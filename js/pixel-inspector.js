(function (FH) {
  'use strict';

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLElement} infoPanel - contains [data-info] elements
   */
  function init(canvas, infoPanel) {
    var rgbEl = infoPanel.querySelector('[data-info="rgb"]');
    var hsvEl = infoPanel.querySelector('[data-info="hsv"]');
    var hexEl = infoPanel.querySelector('[data-info="hex"]');
    var coordsEl = infoPanel.querySelector('[data-info="coords"]');
    var categoryEl = infoPanel.querySelector('[data-info="category"]');
    var assignSelectEl = infoPanel.querySelector('[data-info="assign-target"]');
    var assignBtnEl = infoPanel.querySelector('[data-info="assign-btn"]');
    var assignNoteEl = infoPanel.querySelector('[data-info="assign-note"]');
    var assignSectionEl = infoPanel.querySelector('[data-info="assign-section"]');

    var lastHsv = null;
    var lastRgb = null;

    function renderAssignOptions() {
      if (!assignSelectEl || !FH.ColorPresets) return;
      var presets = FH.ColorPresets.getStored().filter(function (p) {
        return p.kind === 'chromatic';
      });
      var prev = assignSelectEl.value;
      assignSelectEl.innerHTML = '';
      for (var i = 0; i < presets.length; i++) {
        var opt = document.createElement('option');
        opt.value = presets[i].id;
        opt.textContent = presets[i].name;
        assignSelectEl.appendChild(opt);
      }
      if (prev) assignSelectEl.value = prev;
    }

    if (assignSelectEl && FH.ColorPresets) {
      renderAssignOptions();
      FH.ColorPresets.subscribe(renderAssignOptions);
    }

    if (assignBtnEl) {
      assignBtnEl.addEventListener('click', function () {
        if (!lastHsv || !lastRgb || !assignSelectEl) return;
        var id = assignSelectEl.value;
        if (!id) return;
        FH.ColorPresets.expandRange(id, lastHsv.h, lastHsv.s, lastHsv.v,
                                    lastRgb.r, lastRgb.g, lastRgb.b);
        if (assignNoteEl) {
          var p = FH.ColorPresets.getById(id);
          assignNoteEl.textContent = '「' + (p ? p.name : id) + '」に追加しました';
        }
      });
    }

    canvas.addEventListener('click', function (e) {
      var pixel = FH.CanvasRenderer.getPixelAt(e.offsetX, e.offsetY);
      var hsv = FH.ColorConverter.rgbToHsv(pixel.r, pixel.g, pixel.b);
      var hex = FH.ColorConverter.rgbToHex(pixel.r, pixel.g, pixel.b);

      lastHsv = hsv;
      lastRgb = { r: pixel.r, g: pixel.g, b: pixel.b };

      rgbEl.textContent = 'R: ' + pixel.r + ', G: ' + pixel.g + ', B: ' + pixel.b;
      hsvEl.textContent = 'H: ' + hsv.h + '°, S: ' + hsv.s + '%, V: ' + hsv.v + '%';
      hexEl.textContent = hex;
      coordsEl.textContent = '(' + pixel.x + ', ' + pixel.y + ')';

      if (categoryEl && FH.ColorClassifier) {
        var cat = FH.ColorClassifier.classify(pixel.r, pixel.g, pixel.b);
        categoryEl.textContent = cat.name;
      }

      if (assignSectionEl) {
        assignSectionEl.style.display = '';
      }
      if (assignNoteEl) {
        var isAchromatic = hsv.v <= 20 || hsv.s <= 15;
        assignNoteEl.textContent = isAchromatic
          ? '※ 灰/白/黒判定は固定。色相系プリセットに追加しても反映されません'
          : '';
      }
    });
  }

  FH.PixelInspector = {
    init: init,
  };
})(window.FH);
