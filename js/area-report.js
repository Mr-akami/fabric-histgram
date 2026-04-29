(function (FH) {
  'use strict';

  var reportContainer;
  var printButton;
  var lastImageData = null;

  /**
   * @param {HTMLElement} container - element to render report into
   * @param {HTMLButtonElement} btn - button that triggers print
   */
  function init(container, btn) {
    reportContainer = container;
    printButton = btn;

    printButton.addEventListener('click', function () {
      window.print();
    });

    if (FH.ColorPresets) {
      FH.ColorPresets.subscribe(function () {
        if (lastImageData) analyze(lastImageData);
      });
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** @param {{ data: Uint8ClampedArray, width: number, height: number }} imageData */
  function analyze(imageData) {
    lastImageData = imageData;

    var data = imageData.data;
    var pixelCount = data.length / 4;

    var counts = {};
    var categories = FH.ColorClassifier.CATEGORIES;
    for (var i = 0; i < categories.length; i++) {
      counts[categories[i].key] = 0;
    }

    for (var p = 0; p < pixelCount; p++) {
      var offset = p * 4;
      var cat = FH.ColorClassifier.classify(
        data[offset],
        data[offset + 1],
        data[offset + 2]
      );
      counts[cat.key]++;
    }

    var activeKey = (FH.CanvasRenderer && FH.CanvasRenderer.getHighlightedKey)
      ? FH.CanvasRenderer.getHighlightedKey() : null;

    var html = '<h2>面積率レポート</h2><table class="area-report-table">';
    html += '<tr><th></th><th>カテゴリ</th><th>面積率</th></tr>';

    for (var j = 0; j < categories.length; j++) {
      var c = categories[j];
      var pct = (counts[c.key] / pixelCount) * 100;
      var display = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1);
      var swatch = '<span class="swatch" style="background:' + escapeHtml(c.displayColor) + '"></span>';
      var rowCls = c.key === activeKey ? ' class="active-row"' : '';
      html += '<tr' + rowCls + ' data-cat-key="' + escapeHtml(c.key) + '">'
            + '<td>' + swatch + '</td>'
            + '<td>' + escapeHtml(c.name) + '</td>'
            + '<td>' + display + '%</td></tr>';
    }

    html += '</table>';
    reportContainer.innerHTML = html;

    bindRowClicks();
  }

  function bindRowClicks() {
    if (!FH.CanvasRenderer || !FH.CanvasRenderer.highlightCategory) return;
    var rows = reportContainer.querySelectorAll('tr[data-cat-key]');
    for (var i = 0; i < rows.length; i++) {
      (function (row) {
        row.addEventListener('click', function () {
          var key = row.getAttribute('data-cat-key');
          FH.CanvasRenderer.highlightCategory(key);
          // Re-render to refresh active-row class
          if (lastImageData) analyze(lastImageData);
        });
      })(rows[i]);
    }
  }

  FH.AreaReport = {
    init: init,
    analyze: analyze,
  };
})(window.FH);
