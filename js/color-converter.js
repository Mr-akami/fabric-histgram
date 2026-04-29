(function (FH) {
  'use strict';

  function roundToOneDecimal(value) {
    return Math.round(value * 10) / 10;
  }

  /**
   * @param {number} r 0-255
   * @param {number} g 0-255
   * @param {number} b 0-255
   * @returns {{ h: number, s: number, v: number }}
   */
  function rgbToHsv(r, g, b) {
    var rNorm = r / 255;
    var gNorm = g / 255;
    var bNorm = b / 255;

    var max = Math.max(rNorm, gNorm, bNorm);
    var min = Math.min(rNorm, gNorm, bNorm);
    var delta = max - min;

    // Hue
    var h = 0;
    if (delta !== 0) {
      if (max === rNorm) {
        h = 60 * (((gNorm - bNorm) / delta) % 6);
      } else if (max === gNorm) {
        h = 60 * ((bNorm - rNorm) / delta + 2);
      } else {
        h = 60 * ((rNorm - gNorm) / delta + 4);
      }
    }
    if (h < 0) {
      h += 360;
    }
    h = Math.round(h);

    // Saturation
    var s = max === 0 ? 0 : roundToOneDecimal((delta / max) * 100);

    // Value
    var v = roundToOneDecimal(max * 100);

    return { h: h, s: s, v: v };
  }

  /**
   * @param {number} r 0-255
   * @param {number} g 0-255
   * @param {number} b 0-255
   * @returns {string} #RRGGBB uppercase
   */
  function rgbToHex(r, g, b) {
    var rHex = r.toString(16).toUpperCase().padStart(2, '0');
    var gHex = g.toString(16).toUpperCase().padStart(2, '0');
    var bHex = b.toString(16).toUpperCase().padStart(2, '0');
    return '#' + rHex + gHex + bHex;
  }

  FH.ColorConverter = {
    rgbToHsv: rgbToHsv,
    rgbToHex: rgbToHex,
  };
})(window.FH);
