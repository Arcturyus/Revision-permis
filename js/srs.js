/* ============================================================
   Répétition espacée — système de Leitner, persistance localStorage.
   Unité de révision = une FICHE (les 3 sous-questions s'apprennent
   ensemble, donc une seule note par fiche).
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'permis-srs-v1';
  var DAY = 24 * 60 * 60 * 1000;
  // intervalle (en jours) avant la prochaine révision, par boîte
  var INTERVALS = { 0: 0, 1: 0, 2: 1, 3: 3, 4: 7, 5: 16, 6: 45 };
  var MAX_BOX = 6;
  // une fiche est « maîtrisée » à partir de cette boîte
  var MASTERED_BOX = 4;

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

  function get(id) {
    return state[id] || { box: 0, due: 0, lapses: 0, seen: 0, last: 0 };
  }

  // applique une note : 'again' | 'hard' | 'good'
  function grade(id, g) {
    var s = get(id);
    if (g === 'again') {
      s.box = 1;
      s.lapses += 1;
    } else if (g === 'hard') {
      s.box = Math.max(1, s.box); // reste dans sa boîte (au moins 1)
    } else { // good
      s.box = Math.min(s.box + 1, MAX_BOX);
    }
    s.seen += 1;
    s.last = Date.now();
    s.due = Date.now() + INTERVALS[s.box] * DAY;
    state[id] = s;
    save();
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
    var due = 0, mastered = 0, seen = 0;
    ids.forEach(function (id) {
      if (isDue(id)) due += 1;
      if (isMastered(id)) mastered += 1;
      if (state[id]) seen += 1;
    });
    return { due: due, mastered: mastered, seen: seen, total: ids.length };
  }

  function reset() {
    state = {};
    try { global.localStorage.removeItem(KEY); } catch (e) {}
  }

  global.SRS = {
    get: get, grade: grade, isDue: isDue, isMastered: isMastered,
    isNew: isNew, counts: counts, reset: reset
  };
})(window);
