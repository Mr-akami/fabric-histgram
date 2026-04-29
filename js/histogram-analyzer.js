(function (FH) {
  'use strict';

  /**
   * Compute RGB channel histograms and luminance histogram from ImageData.
   * Luminance uses BT.601: 0.299*R + 0.587*G + 0.114*B
   * @param {{ data: Uint8ClampedArray, width: number, height: number }} imageData
   * @returns {{ r: number[], g: number[], b: number[], luminance: number[] }}
   */
  function analyze(imageData) {
    var r = new Array(256);
    var g = new Array(256);
    var b = new Array(256);
    var luminance = new Array(256);

    for (var i = 0; i < 256; i++) {
      r[i] = 0;
      g[i] = 0;
      b[i] = 0;
      luminance[i] = 0;
    }

    var data = imageData.data;
    var pixelCount = data.length / 4;

    for (var p = 0; p < pixelCount; p++) {
      var offset = p * 4;
      var rVal = data[offset];
      var gVal = data[offset + 1];
      var bVal = data[offset + 2];

      r[rVal]++;
      g[gVal]++;
      b[bVal]++;

      var lum = Math.round(0.299 * rVal + 0.587 * gVal + 0.114 * bVal);
      luminance[lum]++;
    }

    return { r: r, g: g, b: b, luminance: luminance };
  }

  FH.HistogramAnalyzer = {
    analyze: analyze,
  };
})(window.FH);
