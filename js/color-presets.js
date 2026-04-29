(function (FH) {
  'use strict';

  var STORAGE_KEY = 'fh.colorPresets.v1';
  var OTHER_ID = 'other';

  // Defaults mirror previous hardcoded categories.
  // Chromatic S/V bounds are wide; achromatic pre-filter handles low-S/V pixels.
  var DEFAULTS = [
    { id: 'black',  name: '黒系', displayColor: '#000000', kind: 'achromatic', rule: 'black' },
    { id: 'white',  name: '白系', displayColor: '#ffffff', kind: 'achromatic', rule: 'white' },
    { id: 'gray',   name: '灰系', displayColor: '#888888', kind: 'achromatic', rule: 'gray'  },
    { id: 'red',    name: '赤系', displayColor: '#e60012', kind: 'chromatic',
      hMin: 350, hMax: 10,  sMin: 0, sMax: 100, vMin: 0, vMax: 100 },
    { id: 'orange', name: '橙系', displayColor: '#f39800', kind: 'chromatic',
      hMin: 10,  hMax: 40,  sMin: 0, sMax: 100, vMin: 0, vMax: 100 },
    { id: 'yellow', name: '黄系', displayColor: '#fff100', kind: 'chromatic',
      hMin: 40,  hMax: 70,  sMin: 0, sMax: 100, vMin: 0, vMax: 100 },
    { id: 'green',  name: '緑系', displayColor: '#009944', kind: 'chromatic',
      hMin: 70,  hMax: 175, sMin: 0, sMax: 100, vMin: 0, vMax: 100 },
    { id: 'blue',   name: '青系', displayColor: '#0068b7', kind: 'chromatic',
      hMin: 175, hMax: 260, sMin: 0, sMax: 100, vMin: 0, vMax: 100 },
    { id: 'purple', name: '紫系', displayColor: '#920783', kind: 'chromatic',
      hMin: 260, hMax: 350, sMin: 0, sMax: 100, vMin: 0, vMax: 100 },
  ];

  var OTHER = { id: OTHER_ID, name: 'その他', displayColor: '#999999', kind: 'other' };

  var presets = null;
  var listeners = [];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function defaults() { return clone(DEFAULTS); }

  function load() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          presets = parsed;
          return;
        }
      }
    } catch (e) {}
    presets = defaults();
    save();
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {}
  }

  function ensureLoaded() {
    if (presets === null) load();
  }

  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](); } catch (e) {}
    }
  }

  function getStored() {
    ensureLoaded();
    return presets;
  }

  function getAll() {
    return getStored().concat([clone(OTHER)]);
  }

  function getById(id) {
    if (id === OTHER_ID) return clone(OTHER);
    var list = getStored();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function clamp(v, lo, hi) {
    if (typeof v !== 'number' || isNaN(v)) return lo;
    return Math.max(lo, Math.min(hi, v));
  }

  function genId() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function add(preset) {
    ensureLoaded();
    var entry = {
      id: preset && preset.id ? preset.id : genId(),
      name: preset && preset.name ? preset.name : '新規',
      displayColor: preset && preset.displayColor ? preset.displayColor : '#cccccc',
      kind: 'chromatic',
      hMin: clamp(preset && preset.hMin, 0, 360),
      hMax: clamp(preset && preset.hMax !== undefined ? preset.hMax : 360, 0, 360),
      sMin: clamp(preset && preset.sMin, 0, 100),
      sMax: clamp(preset && preset.sMax !== undefined ? preset.sMax : 100, 0, 100),
      vMin: clamp(preset && preset.vMin, 0, 100),
      vMax: clamp(preset && preset.vMax !== undefined ? preset.vMax : 100, 0, 100),
    };
    presets.push(entry);
    save();
    emit();
    return entry;
  }

  function update(id, patch) {
    ensureLoaded();
    if (id === OTHER_ID) return null;
    var p = null;
    for (var i = 0; i < presets.length; i++) {
      if (presets[i].id === id) { p = presets[i]; break; }
    }
    if (!p) return null;
    if (patch.name !== undefined) p.name = patch.name;
    if (patch.displayColor !== undefined) p.displayColor = patch.displayColor;
    if (p.kind === 'chromatic') {
      var numKeys = ['hMin', 'hMax', 'sMin', 'sMax', 'vMin', 'vMax'];
      for (var k = 0; k < numKeys.length; k++) {
        var key = numKeys[k];
        if (patch[key] !== undefined) {
          var lo = key.charAt(0) === 'h' ? 0 : 0;
          var hi = key.charAt(0) === 'h' ? 360 : 100;
          p[key] = clamp(patch[key], lo, hi);
        }
      }
    }
    save();
    emit();
    return p;
  }

  function remove(id) {
    ensureLoaded();
    if (id === OTHER_ID) return false;
    var idx = -1;
    for (var i = 0; i < presets.length; i++) {
      if (presets[i].id === id) { idx = i; break; }
    }
    if (idx < 0) return false;
    if (presets[idx].kind !== 'chromatic') return false;
    presets.splice(idx, 1);
    save();
    emit();
    return true;
  }

  function reset() {
    presets = defaults();
    save();
    emit();
  }

  function subscribe(fn) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (l) { return l !== fn; });
    };
  }

  function hueInRange(h, hMin, hMax) {
    if (hMin <= hMax) return h >= hMin && h < hMax;
    return h >= hMin || h < hMax;
  }

  function matchHsv(p, h, s, v) {
    if (p.kind !== 'chromatic') return false;
    if (s < p.sMin || s > p.sMax) return false;
    if (v < p.vMin || v > p.vMax) return false;
    return hueInRange(h, p.hMin, p.hMax);
  }

  function expandRange(id, h, s, v) {
    ensureLoaded();
    if (id === OTHER_ID) return false;
    var p = null;
    for (var i = 0; i < presets.length; i++) {
      if (presets[i].id === id) { p = presets[i]; break; }
    }
    if (!p || p.kind !== 'chromatic') return false;

    if (!hueInRange(h, p.hMin, p.hMax)) {
      // Pick the side with smaller forward arc to extend.
      var distToMin = (p.hMin - h + 360) % 360;
      var distFromMax = (h - p.hMax + 360) % 360;
      if (distToMin <= distFromMax) {
        p.hMin = h;
      } else {
        p.hMax = h;
      }
    }
    if (s < p.sMin) p.sMin = s;
    if (s > p.sMax) p.sMax = s;
    if (v < p.vMin) p.vMin = v;
    if (v > p.vMax) p.vMax = v;

    save();
    emit();
    return true;
  }

  // For tests: forcibly clear in-memory cache so next call reloads from storage
  function _resetMemory() {
    presets = null;
    listeners = [];
  }

  FH.ColorPresets = {
    load: load,
    getAll: getAll,
    getStored: getStored,
    getById: getById,
    add: add,
    update: update,
    remove: remove,
    reset: reset,
    subscribe: subscribe,
    matchHsv: matchHsv,
    expandRange: expandRange,
    OTHER_ID: OTHER_ID,
    STORAGE_KEY: STORAGE_KEY,
    _resetMemory: _resetMemory,
  };
})(window.FH);
