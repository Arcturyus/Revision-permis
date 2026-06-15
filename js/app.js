/* ============================================================
   Contrôleur de l'application — navigation, sessions de révision,
   rendu des cartes mémoire.
   ============================================================ */
(function () {
  'use strict';

  var DATA = window.QUESTIONS || [];
  var ALL_IDS = DATA.map(function (f) { return f.id; });
  var BY_ID = {};
  DATA.forEach(function (f) { BY_ID[f.id] = f; });

  var ROLE_LABEL = {
    verification: 'Vérification',
    manipulation: 'À faire',
    securite_routiere: 'Sécurité routière',
    premiers_secours: 'Premiers secours'
  };

  // ordre d'affichage des items dans une fiche (« À faire » avant « Vérification »)
  var ROLE_ORDER = { manipulation: 0, verification: 1 };
  function roleRank(role) {
    return ROLE_ORDER[role] === undefined ? 2 : ROLE_ORDER[role];
  }

  // état de session
  var queue = [];      // file d'ids à voir
  var pos = 0;         // index courant dans queue
  var sessionTotal = 0;
  var stats = { good: 0, again: 0 };
  var revealed = false;
  var editMode = false;          // édition du texte de la fiche courante
  var currentFiche = null;       // fiche affichée
  var currentItems = [];         // items réordonnés : [{ it, idx }] (idx = index d'origine)

  // applique les corrections de texte sauvegardées sur les données en mémoire
  function applyEdits() {
    var edits = SRS.getEdits();
    Object.keys(edits).forEach(function (id) {
      var fiche = BY_ID[id];
      if (!fiche) return;
      var perItem = edits[id];
      Object.keys(perItem).forEach(function (idx) {
        var item = fiche.items[idx];
        if (!item) return;
        if (perItem[idx].q != null) item.q = perItem[idx].q;
        if (perItem[idx].a != null) item.a = perItem[idx].a;
      });
    });
  }

  // ---------- helpers DOM ----------
  function $(id) { return document.getElementById(id); }
  function show(screenId) {
    ['screen-home', 'screen-study', 'screen-done'].forEach(function (s) {
      $(s).classList.toggle('is-active', s === screenId);
    });
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---------- accueil ----------
  function refreshHome() {
    var c = SRS.counts(ALL_IDS);
    $('stat-total').textContent = c.total;
    $('stat-due').textContent = c.due;
    $('stat-mastered').textContent = c.mastered;
    $('home-progress').style.width = (c.total ? (c.mastered / c.total * 100) : 0) + '%';
    if (c.due === 0) {
      $('today-sub').textContent = 'Tout est à jour — bravo !';
    } else {
      var parts = [];
      if (c.dueNew > 0) parts.push(c.dueNew + ' nouvelle' + (c.dueNew > 1 ? 's' : ''));
      if (c.dueReview > 0) parts.push(c.dueReview + ' à revoir');
      $('today-sub').textContent = parts.join(' + ');
    }
  }

  function fichesForTheme(theme) {
    return DATA.filter(function (f) {
      return f.items.some(function (it) { return it.role === theme; });
    }).map(function (f) { return f.id; });
  }

  // ---------- démarrage d'une session ----------
  function startSession(mode, theme) {
    var ids;
    if (mode === 'today') {
      var dueReview = ALL_IDS.filter(function (id) { return !SRS.isNew(id) && SRS.isDue(id); });
      var allowance = SRS.newAllowanceToday();
      var dueNew = ALL_IDS.filter(SRS.isNew).slice(0, allowance);
      ids = dueReview.concat(dueNew);
      if (ids.length === 0) ids = ALL_IDS.slice(); // rien de dû → révision libre
    } else if (mode === 'theme') {
      ids = fichesForTheme(theme);
    } else {
      ids = ALL_IDS.slice();
    }
    queue = shuffle(ids.slice());
    pos = 0;
    sessionTotal = queue.length;
    stats = { good: 0, again: 0 };
    show('screen-study');
    renderCard();
  }

  // réordonne les items pour l'affichage tout en conservant l'index d'origine
  function orderedItems(items) {
    return items.map(function (it, idx) { return { it: it, idx: idx }; })
      .sort(function (a, b) {
        var d = roleRank(a.it.role) - roleRank(b.it.role);
        return d !== 0 ? d : a.idx - b.idx; // tri stable
      });
  }

  function itemTag(it) {
    return '<span class="role-tag role-' + it.role + '">' + ROLE_LABEL[it.role] + '</span>';
  }

  // ---------- rendu d'une carte ----------
  function renderCard() {
    if (pos >= queue.length) { finish(); return; }
    revealed = false;
    editMode = false;
    var fiche = BY_ID[queue[pos]];
    currentFiche = fiche;
    currentItems = orderedItems(fiche.items);

    $('card-badge').textContent = 'Fiche ' + fiche.id;

    var photo = $('card-photo');
    if (fiche.image) {
      $('card-photo-img').src = fiche.image;
      photo.hidden = false;
    } else {
      photo.hidden = true;
    }

    renderQuestions();
    renderAnswers();

    // délai avant prochaine révision selon l'état sauvegardé de la fiche
    var pv = SRS.preview(fiche.id);
    $('iv-again').textContent = fmtInterval(pv.again);
    $('iv-hard').textContent = fmtInterval(pv.hard);
    $('iv-good').textContent = fmtInterval(pv.good);

    // affichage : recto seul
    $('card-answers').hidden = true;
    $('card-questions').style.display = '';
    $('reveal-btn').hidden = false;
    $('grade-row').hidden = true;
    $('edit-toggle').hidden = true;
    $('card').querySelector('.card-scroll').scrollTop = 0;

    // progression (le dénominateur grandit si des fiches « à revoir » reviennent)
    var denom = Math.max(queue.length, sessionTotal);
    $('study-count').textContent = (pos + 1) + '/' + denom;
    $('study-progress').style.width = (pos / denom * 100) + '%';
  }

  // questions seules (recto)
  function renderQuestions() {
    $('card-questions').innerHTML = currentItems.map(function (o) {
      return '<div class="qitem">' + itemTag(o.it) +
        '<div class="qtext">' + escapeHtml(o.it.q) + '</div></div>';
    }).join('');
  }

  // questions + réponses (verso) — en lecture ou en édition selon editMode
  function renderAnswers() {
    $('card-answers').innerHTML = currentItems.map(function (o) {
      var it = o.it, idx = o.idx;
      if (editMode) {
        return '<div class="qitem" data-idx="' + idx + '">' + itemTag(it) +
          '<textarea class="edit-field edit-q" data-idx="' + idx + '" data-field="q" ' +
          'aria-label="Question">' + escapeHtml(it.q) + '</textarea>' +
          '<textarea class="edit-field edit-a" data-idx="' + idx + '" data-field="a" ' +
          'placeholder="Réponse (laisser vide si aucune)">' + escapeHtml(it.a || '') + '</textarea>' +
          '</div>';
      }
      var a = it.a && it.a.trim()
        ? '<div class="atext">' + escapeHtml(it.a) + '</div>'
        : '<div class="atext empty">Geste à réaliser — pas de réponse orale.</div>';
      return '<div class="qitem" data-idx="' + idx + '">' + itemTag(it) +
        '<div class="qtext">' + escapeHtml(it.q) + '</div>' + a + '</div>';
    }).join('');
    if (editMode) {
      $('card-answers').querySelectorAll('textarea.edit-field').forEach(autosize);
    }
  }

  function autosize(ta) {
    ta.style.height = 'auto';
    ta.style.height = (ta.scrollHeight + 2) + 'px';
  }

  function reveal() {
    revealed = true;
    editMode = false;
    $('card-questions').style.display = 'none'; // on remplace par questions+réponses
    $('card-answers').hidden = false;
    $('reveal-btn').hidden = true;
    $('grade-row').hidden = false;
    $('edit-toggle').hidden = false;
    $('edit-toggle').textContent = '✎ Modifier le texte';
  }

  // bascule entre lecture et édition du texte de la fiche courante
  function toggleEdit() {
    if (!revealed) return;
    if (!editMode) {
      editMode = true;
      $('edit-toggle').textContent = '✓ Enregistrer';
      $('grade-row').hidden = true;
      renderAnswers();
    } else {
      saveEdits();
      editMode = false;
      $('edit-toggle').textContent = '✎ Modifier le texte';
      $('grade-row').hidden = false;
      renderAnswers();
    }
  }

  // lit les champs d'édition et persiste les changements (clé = index d'origine)
  function saveEdits() {
    var changed = false;
    $('card-answers').querySelectorAll('textarea.edit-field').forEach(function (ta) {
      var idx = parseInt(ta.dataset.idx, 10);
      var field = ta.dataset.field;
      var it = currentFiche.items[idx];
      if (!it) return;
      var current = field === 'a' ? (it.a || '') : it.q;
      var val = ta.value;
      if (val !== current) {
        it[field] = val;                              // données en mémoire
        SRS.setEdit(currentFiche.id, idx, field, val); // localStorage
        changed = true;
      }
    });
    if (changed) renderQuestions(); // garde le recto cohérent
  }

  function grade(g) {
    if (!revealed) return;
    var id = queue[pos];
    SRS.grade(id, g);
    if (g === 'again') {
      stats.again += 1;
      // ré-injecte la fiche un peu plus loin dans la session
      var insertAt = Math.min(queue.length, pos + 4);
      queue.splice(insertAt, 0, id);
    } else {
      stats.good += 1;
    }
    pos += 1;
    renderCard();
  }

  function finish() {
    $('study-progress').style.width = '100%';
    var seen = stats.good + stats.again;
    $('done-summary').textContent = seen + ' révision' + (seen > 1 ? 's' : '') +
      ' · ' + stats.good + ' su' + (stats.good > 1 ? 'es' : '') +
      ' · ' + stats.again + ' à revoir.';
    refreshHome();
    show('screen-done');
  }

  // formate un nombre de jours en libellé court pour les boutons de note
  function fmtInterval(d) {
    if (d <= 0) return "auj.";
    if (d < 7) return d + " j";
    return Math.round(d / 7) + " sem";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ---------- liaisons ----------
  function bind() {
    document.querySelectorAll('.mode-btn[data-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        startSession(btn.dataset.mode, btn.dataset.theme);
      });
    });
    $('reveal-btn').addEventListener('click', reveal);
    $('card').addEventListener('click', function () { if (!revealed) reveal(); });
    $('edit-toggle').addEventListener('click', function (e) { e.stopPropagation(); toggleEdit(); });
    // auto-ajustement de la hauteur des champs d'édition pendant la saisie
    $('card-answers').addEventListener('input', function (e) {
      if (e.target.classList.contains('edit-field')) autosize(e.target);
    });
    document.querySelectorAll('.grade').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); grade(b.dataset.grade); });
    });
    $('back-btn').addEventListener('click', function () { refreshHome(); show('screen-home'); });
    $('done-home').addEventListener('click', function () { show('screen-home'); });
    $('reset-btn').addEventListener('click', function () {
      if (confirm('Effacer toute ta progression enregistrée sur cet appareil ?')) {
        SRS.reset(); renderNpd(); refreshHome();
      }
    });

    // réglages repliables
    var sToggle = $('settings-toggle'), sPanel = $('settings-panel');
    sToggle.addEventListener('click', function () {
      var open = sPanel.hidden;
      sPanel.hidden = !open;
      sToggle.classList.toggle('is-open', open);
      sToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // stepper « nouvelles fiches / jour »
    function changeNpd(delta) {
      var v = SRS.getSettings().newPerDay + delta;
      v = Math.max(1, Math.min(100, v));
      SRS.setSetting('newPerDay', v);
      renderNpd();
      refreshHome();
    }
    $('npd-minus').addEventListener('click', function () { changeNpd(-1); });
    $('npd-plus').addEventListener('click', function () { changeNpd(1); });
    renderNpd();
  }

  function renderNpd() {
    $('setting-new-per-day-val').textContent = SRS.getSettings().newPerDay;
  }

  // ---------- init ----------
  if (DATA.length !== 100) {
    console.warn('ATTENTION : ' + DATA.length + ' fiches chargées (attendu : 100).');
  } else {
    console.log('100 fiches chargées ✓');
  }
  applyEdits();
  bind();
  refreshHome();
})();
