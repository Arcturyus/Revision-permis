/* ============================================================
   Répétition espacée — système de Leitner, persistance localStorage.
   Unité de révision = une FICHE (les 3 sous-questions s'apprennent
   ensemble, donc une seule note par fiche).
   ============================================================ */
(function (global) {
  'use strict';

  var KEY          = 'permis-srs-v1';
  var SETTINGS_KEY = 'permis-settings-v1';
  var DAILY_KEY    = 'permis-daily-v1';
  var DAY = 24 * 60 * 60 * 1000;
  // intervalle (en jours) avant la prochaine révision, par boîte
  var INTERVALS = { 0: 0, 1: 0, 2: 1, 3: 3, 4: 7, 5: 16, 6: 45 };
  var MAX_BOX = 6;
  // une fiche est « maîtrisée » à partir de cette boîte
  var MASTERED_BOX = 4;
  var DEFAULT_NEW_PER_DAY = 10;

  var state = load();

  function load() {
    try {
      return JSON.parse(global.localStorage.getItem(KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function save() {
    try { global.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ---------- settings ----------
  function loadSettings() {
    try {
      var s = JSON.parse(global.localStorage.getItem(SETTINGS_KEY));
      var n = s && s.newPerDay > 0 ? s.newPerDay : DEFAULT_NEW_PER_DAY;
      return { newPerDay: n };
    } catch (e) { return { newPerDay: DEFAULT_NEW_PER_DAY }; }
  }
  function saveSettings(s) {
    try { global.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function getSettings() { return loadSettings(); }
  function setSetting(key, val) {
    var s = loadSettings();
    s[key] = val;
    saveSettings(s);
  }

  // ---------- compteur journalier de nouvelles fiches ----------
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }
  function loadDaily() {
    try {
      var d = JSON.parse(global.localStorage.getItem(DAILY_KEY));
      if (d && d.date === todayStr()) return d;
    } catch (e) {}
    return { date: todayStr(), newCount: 0 };
  }
  function saveDaily(d) {
    try { global.localStorage.setItem(DAILY_KEY, JSON.stringify(d)); } catch (e) {}
  }
  function newAllowanceToday() {
    var settings = loadSettings();
    var daily = loadDaily();
    return Math.max(0, settings.newPerDay - daily.newCount);
  }

  // ---------- fiches ----------
  function get(id) {
    return state[id] || { box: 0, due: 0, lapses: 0, seen: 0, last: 0 };
  }

  // boîte résultante pour une note, sans rien modifier
  function nextBox(box, g) {
    if (g === 'again') return 1;
    if (g === 'hard') return Math.max(1, box); // reste dans sa boîte (au moins 1)
    return Math.min(box + 1, MAX_BOX);         // good
  }

  // intervalles (en jours) que donnerait chaque note, vu l'état actuel
  function preview(id) {
    var s = state[id];
    var box = s ? s.box : 0;
    return {
      again: INTERVALS[nextBox(box, 'again')],
      hard:  INTERVALS[nextBox(box, 'hard')],
      good:  INTERVALS[nextBox(box, 'good')]
    };
  }

  // applique une note : 'again' | 'hard' | 'good'
  function grade(id, g) {
    var firstTime = !state[id];
    var s = get(id);
    s.box = nextBox(s.box, g);
    if (g === 'again') s.lapses += 1;
    s.seen += 1;
    s.last = Date.now();
    s.due = Date.now() + INTERVALS[s.box] * DAY;
    state[id] = s;
    save();
    if (firstTime) {
      var daily = loadDaily();
      daily.newCount += 1;
      saveDaily(daily);
    }
    return s;
  }

  function isDue(id) {
    var s = state[id];
    if (!s) return true;            // jamais vue → à réviser
    return s.due <= Date.now();
  }
  function isMastered(id) {
    var s = state[id];
    return !!s && s.box >= MASTERED_BOX;
  }
  function isNew(id) {
    return !state[id];
  }

  function counts(ids) {
    var dueReview = 0, mastered = 0, seen = 0, totalNew = 0;
    ids.forEach(function (id) {
      if (!state[id]) {
        totalNew += 1;
      } else {
        if (isDue(id)) dueReview += 1;
        if (isMastered(id)) mastered += 1;
      }
      if (state[id]) seen += 1;
    });
    var dueNew = Math.min(totalNew, newAllowanceToday());
    return {
      due: dueReview + dueNew,
      dueReview: dueReview,
      dueNew: dueNew,
      mastered: mastered,
      seen: seen,
      total: ids.length
    };
  }

  function reset() {
    state = {};
    try { global.localStorage.removeItem(KEY); } catch (e) {}
  }

  global.SRS = {
    get: get, grade: grade, isDue: isDue, isMastered: isMastered,
    isNew: isNew, counts: counts, reset: reset, preview: preview,
    getSettings: getSettings, setSetting: setSetting,
    newAllowanceToday: newAllowanceToday
  };
})(window);
