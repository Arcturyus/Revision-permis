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

  // état de session
  var queue = [];      // file d'ids à voir
  var pos = 0;         // index courant dans queue
  var sessionTotal = 0;
  var stats = { good: 0, again: 0 };
  var revealed = false;

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

  // ---------- rendu d'une carte ----------
  function renderCard() {
    if (pos >= queue.length) { finish(); return; }
    revealed = false;
    var fiche = BY_ID[queue[pos]];

    $('card-badge').textContent = 'Fiche ' + fiche.id;

    var photo = $('card-photo');
    if (fiche.image) {
      $('card-photo-img').src = fiche.image;
      photo.hidden = false;
    } else {
      photo.hidden = true;
    }

    // questions (recto)
    var qHtml = fiche.items.map(function (it) {
      return '<div class="qitem">' +
        '<span class="role-tag role-' + it.role + '">' + ROLE_LABEL[it.role] + '</span>' +
        '<div class="qtext">' + escapeHtml(it.q) + '</div>' +
        '</div>';
    }).join('');
    $('card-questions').innerHTML = qHtml;

    // réponses (verso) — masquées au départ
    var aHtml = fiche.items.map(function (it) {
      var a = it.a && it.a.trim()
        ? '<div class="atext">' + escapeHtml(it.a) + '</div>'
        : '<div class="atext empty">Geste à réaliser — pas de réponse orale.</div>';
      return '<div class="qitem">' +
        '<span class="role-tag role-' + it.role + '">' + ROLE_LABEL[it.role] + '</span>' +
        '<div class="qtext">' + escapeHtml(it.q) + '</div>' + a +
        '</div>';
    }).join('');
    $('card-answers').innerHTML = aHtml;

    // affichage : recto seul
    $('card-answers').hidden = true;
    $('card-questions').style.display = '';
    $('reveal-btn').hidden = false;
    $('grade-row').hidden = true;
    $('card').querySelector('.card-scroll').scrollTop = 0;

    // progression (le dénominateur grandit si des fiches « à revoir » reviennent)
    var denom = Math.max(queue.length, sessionTotal);
    $('study-count').textContent = (pos + 1) + '/' + denom;
    $('study-progress').style.width = (pos / denom * 100) + '%';
  }

  function reveal() {
    revealed = true;
    $('card-questions').style.display = 'none'; // on remplace par questions+réponses
    $('card-answers').hidden = false;
    $('reveal-btn').hidden = true;
    $('grade-row').hidden = false;
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
    document.querySelectorAll('.grade').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); grade(b.dataset.grade); });
    });
    $('back-btn').addEventListener('click', function () { refreshHome(); show('screen-home'); });
    $('done-home').addEventListener('click', function () { show('screen-home'); });
    $('reset-btn').addEventListener('click', function () {
      if (confirm('Effacer toute ta progression enregistrée sur cet appareil ?')) {
        SRS.reset(); refreshHome();
      }
    });
    var npdInput = $('setting-new-per-day');
    npdInput.value = SRS.getSettings().newPerDay;
    npdInput.addEventListener('change', function () {
      var v = parseInt(npdInput.value, 10);
      if (v > 0) { SRS.setSetting('newPerDay', v); refreshHome(); }
    });
  }

  // ---------- init ----------
  if (DATA.length !== 100) {
    console.warn('ATTENTION : ' + DATA.length + ' fiches chargées (attendu : 100).');
  } else {
    console.log('100 fiches chargées ✓');
  }
  bind();
  refreshHome();
})();
