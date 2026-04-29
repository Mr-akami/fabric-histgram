(function (FH) {
  'use strict';

  var reportContainer;
  var printButton;

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
  }

  /** @param {{ data: Uint8ClampedArray, width: number, height: number }} imageData */
  function analyze(imageData) {
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

    var html = '<h2>面積率レポート</h2><table class="area-report-table">';
    html += '<tr><th>カテゴリ</th><th>面積率</th></tr>';

    for (var j = 0; j < categories.length; j++) {
      var cat = categories[j];
      var pct = (counts[cat.key] / pixelCount) * 100;
      var display = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1);
      html += '<tr><td>' + cat.name + '</td><td>' + display + '%</td></tr>';
    }

    html += '</table>';
    reportContainer.innerHTML = html;
  }

  FH.AreaReport = {
    init: init,
    analyze: analyze,
  };
})(window.FH);
