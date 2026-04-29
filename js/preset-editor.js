(function (FH) {
  'use strict';

  var modal;
  var listEl;
  var presetSelectEl;

  function init(triggerBtn, modalEl) {
    modal = modalEl;
    listEl = modal.querySelector('[data-pe="list"]');
    presetSelectEl = modal.querySelector('[data-pe="active-select"]');

    triggerBtn.addEventListener('click', open);

    modal.querySelectorAll('[data-pe="close"]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    modal.querySelector('[data-pe="add"]').addEventListener('click', addNewCategory);
    modal.querySelector('[data-pe="reset"]').addEventListener('click', function () {
      if (window.confirm('このプリセットを初期状態に戻しますか？')) {
        FH.ColorPresets.reset();
      }
    });

    presetSelectEl.addEventListener('change', function () {
      FH.ColorPresets.setActive(presetSelectEl.value);
    });
    modal.querySelector('[data-pe="new-preset"]').addEventListener('click', function () {
      var name = window.prompt('新規プリセット名:', '新規プリセット');
      if (name) FH.ColorPresets.createPreset(name);
    });
    modal.querySelector('[data-pe="duplicate-preset"]').addEventListener('click', function () {
      var current = FH.ColorPresets.getActivePreset();
      var name = window.prompt('複製プリセット名:', current.name + ' のコピー');
      if (name) FH.ColorPresets.createPreset(name, current.id);
    });
    modal.querySelector('[data-pe="rename-preset"]').addEventListener('click', function () {
      var current = FH.ColorPresets.getActivePreset();
      var name = window.prompt('プリセット名:', current.name);
      if (name) FH.ColorPresets.renamePreset(current.id, name);
    });
    modal.querySelector('[data-pe="delete-preset"]').addEventListener('click', function () {
      var current = FH.ColorPresets.getActivePreset();
      if (FH.ColorPresets.getAllPresets().length <= 1) {
        window.alert('最後のプリセットは削除できません');
        return;
      }
      if (window.confirm('プリセット「' + current.name + '」を削除しますか?')) {
        FH.ColorPresets.deletePreset(current.id);
      }
    });

    FH.ColorPresets.subscribe(render);
  }

  function open() {
    render();
    modal.style.display = 'flex';
  }

  function close() {
    modal.style.display = 'none';
  }

  function addNewCategory() {
    FH.ColorPresets.add({
      name: '新規カテゴリ',
      displayColor: '#cccccc',
      hMin: 0, hMax: 360,
      sMin: 0, sMax: 100,
      vMin: 0, vMax: 100,
    });
  }

  function renderPresetSelect() {
    if (!presetSelectEl) return;
    presetSelectEl.innerHTML = '';
    var presets = FH.ColorPresets.getAllPresets();
    var activeId = FH.ColorPresets.getActivePresetId();
    for (var i = 0; i < presets.length; i++) {
      var opt = document.createElement('option');
      opt.value = presets[i].id;
      opt.textContent = presets[i].name;
      if (presets[i].id === activeId) opt.selected = true;
      presetSelectEl.appendChild(opt);
    }
  }

  function render() {
    renderPresetSelect();
    if (!listEl) return;
    listEl.innerHTML = '';
    var all = FH.ColorPresets.getAll();
    for (var i = 0; i < all.length; i++) {
      listEl.appendChild(buildRow(all[i]));
    }
  }

  function buildRow(p) {
    var row = document.createElement('div');
    row.className = 'preset-row preset-row-' + p.kind;
    row.dataset.id = p.id;

    // Swatch + color picker
    var colorWrap = document.createElement('label');
    colorWrap.className = 'preset-swatch-wrap';
    var colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = normalizeHex(p.displayColor);
    colorInput.disabled = (p.kind === 'other');
    colorInput.addEventListener('change', function () {
      FH.ColorPresets.update(p.id, { displayColor: colorInput.value });
    });
    colorWrap.appendChild(colorInput);

    // Name
    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'preset-name';
    nameInput.value = p.name;
    nameInput.disabled = (p.kind === 'other');
    nameInput.addEventListener('change', function () {
      FH.ColorPresets.update(p.id, { name: nameInput.value });
    });

    row.appendChild(colorWrap);
    row.appendChild(nameInput);

    if (p.kind === 'chromatic') {
      row.appendChild(buildModeToggle(p));
      row.appendChild(buildRangeFields(p));
      row.appendChild(buildDeleteBtn(p.id));
    } else {
      var lock = document.createElement('span');
      lock.className = 'preset-lock';
      lock.textContent = p.kind === 'other' ? '(未マッチ)' : '(範囲固定)';
      row.appendChild(lock);
    }

    return row;
  }

  function buildModeToggle(p) {
    var wrap = document.createElement('div');
    wrap.className = 'preset-mode-toggle';
    var modes = [['hsv', 'HSV'], ['rgb', 'RGB']];
    var current = p.rangeMode === 'rgb' ? 'rgb' : 'hsv';
    for (var i = 0; i < modes.length; i++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = modes[i][1];
      btn.className = 'mode-btn' + (modes[i][0] === current ? ' active' : '');
      (function (mode) {
        btn.addEventListener('click', function () {
          FH.ColorPresets.update(p.id, { rangeMode: mode });
        });
      })(modes[i][0]);
      wrap.appendChild(btn);
    }
    return wrap;
  }

  function buildRangeFields(p) {
    var wrap = document.createElement('div');
    wrap.className = 'preset-ranges';
    if (p.rangeMode === 'rgb') {
      wrap.appendChild(buildRangePair(p, 'r', 'R', 0, 255));
      wrap.appendChild(buildRangePair(p, 'g', 'G', 0, 255));
      wrap.appendChild(buildRangePair(p, 'b', 'B', 0, 255));
    } else {
      wrap.appendChild(buildRangePair(p, 'h', 'H', 0, 360));
      wrap.appendChild(buildRangePair(p, 's', 'S', 0, 100));
      wrap.appendChild(buildRangePair(p, 'v', 'V', 0, 100));
    }
    return wrap;
  }

  function buildRangePair(p, axis, label, lo, hi) {
    var row = document.createElement('div');
    row.className = 'preset-range-pair';

    var lab = document.createElement('span');
    lab.className = 'preset-range-label';
    lab.textContent = label;
    row.appendChild(lab);

    row.appendChild(buildNumInput(p, axis + 'Min', lo, hi));
    var sep = document.createElement('span');
    sep.textContent = '–';
    row.appendChild(sep);
    row.appendChild(buildNumInput(p, axis + 'Max', lo, hi));

    return row;
  }

  function buildNumInput(p, key, lo, hi) {
    var input = document.createElement('input');
    input.type = 'number';
    input.min = String(lo);
    input.max = String(hi);
    input.step = '1';
    input.className = 'preset-num';
    input.value = String(p[key]);
    input.addEventListener('change', function () {
      var n = parseInt(input.value, 10);
      if (isNaN(n)) return;
      var patch = {};
      patch[key] = n;
      FH.ColorPresets.update(p.id, patch);
    });
    return input;
  }

  function buildDeleteBtn(id) {
    var btn = document.createElement('button');
    btn.className = 'preset-delete';
    btn.textContent = '削除';
    btn.addEventListener('click', function () {
      if (window.confirm('削除しますか?')) {
        FH.ColorPresets.remove(id);
      }
    });
    return btn;
  }

  function normalizeHex(c) {
    if (typeof c !== 'string') return '#cccccc';
    if (/^#[0-9a-fA-F]{6}$/.test(c)) return c.toLowerCase();
    return '#cccccc';
  }

  FH.PresetEditor = {
    init: init,
  };
})(window.FH);
