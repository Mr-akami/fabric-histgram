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

  /**
   * @param {number} h 0-360
   * @param {number} s 0-100
   * @param {number} v 0-100
   * @returns {{ r: number, g: number, b: number }} 0-255
   */
  function hsvToRgb(h, s, v) {
    var sN = s / 100;
    var vN = v / 100;
    var c = vN * sN;
    var hh = ((h % 360) + 360) % 360 / 60;
    var x = c * (1 - Math.abs((hh % 2) - 1));
    var r1 = 0, g1 = 0, b1 = 0;
    if (hh < 1)      { r1 = c; g1 = x; b1 = 0; }
    else if (hh < 2) { r1 = x; g1 = c; b1 = 0; }
    else if (hh < 3) { r1 = 0; g1 = c; b1 = x; }
    else if (hh < 4) { r1 = 0; g1 = x; b1 = c; }
    else if (hh < 5) { r1 = x; g1 = 0; b1 = c; }
    else             { r1 = c; g1 = 0; b1 = x; }
    var m = vN - c;
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255),
    };
  }

  FH.ColorConverter = {
    rgbToHsv: rgbToHsv,
    rgbToHex: rgbToHex,
    hsvToRgb: hsvToRgb,
  };
})(window.FH);
