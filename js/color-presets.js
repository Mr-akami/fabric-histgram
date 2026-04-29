(function (FH) {
  'use strict';

  var STORAGE_KEY = 'fh.colorPresets.v2';
  var STORAGE_KEY_V1 = 'fh.colorPresets.v1';
  var OTHER_ID = 'other';
  var DEFAULT_PRESET_ID = 'default';

  var DEFAULT_CATEGORIES = [
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

  var state = null;
  var listeners = [];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function defaultCategories() { return clone(DEFAULT_CATEGORIES); }

  function defaultState() {
    return {
      version: 2,
      activeId: DEFAULT_PRESET_ID,
      presets: [
        { id: DEFAULT_PRESET_ID, name: 'デフォルト', categories: defaultCategories() },
      ],
    };
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.presets) && parsed.presets.length > 0 && parsed.activeId) {
          state = parsed;
          // Ensure activeId points to an existing preset
          if (!findPreset(state.activeId)) state.activeId = state.presets[0].id;
          return;
        }
      }
      // Migrate from v1
      var v1 = window.localStorage.getItem(STORAGE_KEY_V1);
      if (v1) {
        var v1arr = JSON.parse(v1);
        if (Array.isArray(v1arr) && v1arr.length > 0) {
          state = {
            version: 2,
            activeId: DEFAULT_PRESET_ID,
            presets: [{ id: DEFAULT_PRESET_ID, name: 'デフォルト', categories: v1arr }],
          };
          save();
          return;
        }
      }
    } catch (e) {}
    state = defaultState();
    save();
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function ensureLoaded() {
    if (state === null) load();
  }

  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](); } catch (e) {}
    }
  }

  function findPreset(id) {
    if (!state) return null;
    for (var i = 0; i < state.presets.length; i++) {
      if (state.presets[i].id === id) return state.presets[i];
    }
    return null;
  }

  function activePreset() {
    ensureLoaded();
    return findPreset(state.activeId) || state.presets[0];
  }

  // ---- Preset (set) operations ----

  function getAllPresets() {
    ensureLoaded();
    return state.presets.map(function (p) {
      return { id: p.id, name: p.name, isActive: p.id === state.activeId };
    });
  }

  function getActivePresetId() {
    ensureLoaded();
    return state.activeId;
  }

  function getActivePreset() {
    return clone(activePreset());
  }

  function setActive(id) {
    ensureLoaded();
    if (!findPreset(id)) return false;
    if (state.activeId === id) return true;
    state.activeId = id;
    save();
    emit();
    return true;
  }

  function genId(prefix) {
    return (prefix || 'p') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function createPreset(name, copyFromId) {
    ensureLoaded();
    var src = copyFromId ? findPreset(copyFromId) : activePreset();
    var categories = src ? clone(src.categories) : defaultCategories();
    var preset = {
      id: genId('ps'),
      name: name || '新規プリセット',
      categories: categories,
    };
    state.presets.push(preset);
    state.activeId = preset.id;
    save();
    emit();
    return preset.id;
  }

  function deletePreset(id) {
    ensureLoaded();
    if (state.presets.length <= 1) return false;
    var idx = -1;
    for (var i = 0; i < state.presets.length; i++) {
      if (state.presets[i].id === id) { idx = i; break; }
    }
    if (idx < 0) return false;
    state.presets.splice(idx, 1);
    if (state.activeId === id) {
      state.activeId = state.presets[0].id;
    }
    save();
    emit();
    return true;
  }

  function renamePreset(id, name) {
    ensureLoaded();
    var p = findPreset(id);
    if (!p) return false;
    p.name = name;
    save();
    emit();
    return true;
  }

  // ---- Category operations (within active preset) ----

  function getStored() {
    return activePreset().categories;
  }

  function getAll() {
    return getStored().concat([clone(OTHER)]);
  }

  function getById(catId) {
    if (catId === OTHER_ID) return clone(OTHER);
    var cats = getStored();
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === catId) return cats[i];
    }
    return null;
  }

  function clamp(v, lo, hi) {
    if (typeof v !== 'number' || isNaN(v)) return lo;
    return Math.max(lo, Math.min(hi, v));
  }

  function add(category) {
    ensureLoaded();
    var entry = {
      id: category && category.id ? category.id : genId('c'),
      name: category && category.name ? category.name : '新規',
      displayColor: category && category.displayColor ? category.displayColor : '#cccccc',
      kind: 'chromatic',
      rangeMode: (category && category.rangeMode === 'rgb') ? 'rgb' : 'hsv',
      hMin: clamp(category && category.hMin, 0, 360),
      hMax: clamp(category && category.hMax !== undefined ? category.hMax : 360, 0, 360),
      sMin: clamp(category && category.sMin, 0, 100),
      sMax: clamp(category && category.sMax !== undefined ? category.sMax : 100, 0, 100),
      vMin: clamp(category && category.vMin, 0, 100),
      vMax: clamp(category && category.vMax !== undefined ? category.vMax : 100, 0, 100),
      rMin: clamp(category && category.rMin, 0, 255),
      rMax: clamp(category && category.rMax !== undefined ? category.rMax : 255, 0, 255),
      gMin: clamp(category && category.gMin, 0, 255),
      gMax: clamp(category && category.gMax !== undefined ? category.gMax : 255, 0, 255),
      bMin: clamp(category && category.bMin, 0, 255),
      bMax: clamp(category && category.bMax !== undefined ? category.bMax : 255, 0, 255),
    };
    activePreset().categories.push(entry);
    save();
    emit();
    return entry;
  }

  function update(catId, patch) {
    ensureLoaded();
    if (catId === OTHER_ID) return null;
    var cats = activePreset().categories;
    var p = null;
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === catId) { p = cats[i]; break; }
    }
    if (!p) return null;
    if (patch.name !== undefined) p.name = patch.name;
    if (patch.displayColor !== undefined) p.displayColor = patch.displayColor;
    if (p.kind === 'chromatic') {
      if (patch.rangeMode === 'hsv' || patch.rangeMode === 'rgb') {
        p.rangeMode = patch.rangeMode;
      }
      var numKeys = ['hMin', 'hMax', 'sMin', 'sMax', 'vMin', 'vMax',
                     'rMin', 'rMax', 'gMin', 'gMax', 'bMin', 'bMax'];
      for (var k = 0; k < numKeys.length; k++) {
        var key = numKeys[k];
        if (patch[key] !== undefined) {
          var ch = key.charAt(0);
          var hi = ch === 'h' ? 360 : (ch === 's' || ch === 'v' ? 100 : 255);
          p[key] = clamp(patch[key], 0, hi);
        }
      }
    }
    save();
    emit();
    return p;
  }

  function remove(catId) {
    ensureLoaded();
    if (catId === OTHER_ID) return false;
    var cats = activePreset().categories;
    var idx = -1;
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === catId) { idx = i; break; }
    }
    if (idx < 0) return false;
    if (cats[idx].kind !== 'chromatic') return false;
    cats.splice(idx, 1);
    save();
    emit();
    return true;
  }

  function reset() {
    ensureLoaded();
    activePreset().categories = defaultCategories();
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
    if (hMin <= hMax) return h >= hMin && h <= hMax;
    return h >= hMin || h <= hMax;
  }

  function matchHsv(p, h, s, v) {
    if (p.kind !== 'chromatic') return false;
    if (p.rangeMode === 'rgb') return false;
    if (s < p.sMin || s > p.sMax) return false;
    if (v < p.vMin || v > p.vMax) return false;
    return hueInRange(h, p.hMin, p.hMax);
  }

  function matchRgb(p, r, g, b) {
    if (p.kind !== 'chromatic') return false;
    if (p.rangeMode !== 'rgb') return false;
    if (r < p.rMin || r > p.rMax) return false;
    if (g < p.gMin || g > p.gMax) return false;
    if (b < p.bMin || b > p.bMax) return false;
    return true;
  }

  function matchPixel(p, r, g, b, h, s, v) {
    if (p.kind !== 'chromatic') return false;
    if (p.rangeMode === 'rgb') return matchRgb(p, r, g, b);
    return matchHsv(p, h, s, v);
  }

  function expandRange(catId, h, s, v, r, g, b) {
    ensureLoaded();
    if (catId === OTHER_ID) return false;
    var cats = activePreset().categories;
    var p = null;
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === catId) { p = cats[i]; break; }
    }
    if (!p || p.kind !== 'chromatic') return false;

    if (p.rangeMode === 'rgb') {
      if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') return false;
      if (r < p.rMin) p.rMin = r;
      if (r > p.rMax) p.rMax = r;
      if (g < p.gMin) p.gMin = g;
      if (g > p.gMax) p.gMax = g;
      if (b < p.bMin) p.bMin = b;
      if (b > p.bMax) p.bMax = b;
    } else {
      if (!hueInRange(h, p.hMin, p.hMax)) {
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
    }

    save();
    emit();
    return true;
  }

  function _resetMemory() {
    state = null;
    listeners = [];
  }

  FH.ColorPresets = {
    load: load,
    // Preset-set ops
    getAllPresets: getAllPresets,
    getActivePresetId: getActivePresetId,
    getActivePreset: getActivePreset,
    setActive: setActive,
    createPreset: createPreset,
    deletePreset: deletePreset,
    renamePreset: renamePreset,
    // Category ops (within active preset)
    getStored: getStored,
    getAll: getAll,
    getById: getById,
    add: add,
    update: update,
    remove: remove,
    reset: reset,
    subscribe: subscribe,
    matchHsv: matchHsv,
    matchRgb: matchRgb,
    matchPixel: matchPixel,
    expandRange: expandRange,
    OTHER_ID: OTHER_ID,
    STORAGE_KEY: STORAGE_KEY,
    STORAGE_KEY_V1: STORAGE_KEY_V1,
    _resetMemory: _resetMemory,
  };
})(window.FH);
