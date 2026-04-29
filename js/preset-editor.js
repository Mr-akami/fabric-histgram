(function (FH) {
  'use strict';

  var modal;
  var listEl;

  function init(triggerBtn, modalEl) {
    modal = modalEl;
    listEl = modal.querySelector('[data-pe="list"]');

    triggerBtn.addEventListener('click', open);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });

    modal.querySelector('[data-pe="close"]').addEventListener('click', close);
    modal.querySelector('[data-pe="add"]').addEventListener('click', addNew);
    modal.querySelector('[data-pe="reset"]').addEventListener('click', function () {
      if (window.confirm('プリセットを初期状態に戻しますか？')) {
        FH.ColorPresets.reset();
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

  function addNew() {
    FH.ColorPresets.add({
      name: '新規カテゴリ',
      displayColor: '#cccccc',
      hMin: 0, hMax: 360,
      sMin: 0, sMax: 100,
      vMin: 0, vMax: 100,
    });
  }

  function render() {
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

  function buildRangeFields(p) {
    var wrap = document.createElement('div');
    wrap.className = 'preset-ranges';
    wrap.appendChild(buildRangePair(p, 'h', 'H', 0, 360));
    wrap.appendChild(buildRangePair(p, 's', 'S', 0, 100));
    wrap.appendChild(buildRangePair(p, 'v', 'V', 0, 100));
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
