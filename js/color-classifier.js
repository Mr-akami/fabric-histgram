(function (FH) {
  'use strict';

  var CATEGORIES = [
    { key: 'red', name: '赤系' },
    { key: 'orange', name: '橙系' },
    { key: 'yellow', name: '黄系' },
    { key: 'green', name: '緑系' },
    { key: 'blue', name: '青系' },
    { key: 'purple', name: '紫系' },
    { key: 'white', name: '白系' },
    { key: 'gray', name: '灰系' },
    { key: 'black', name: '黒系' },
  ];

  var CATEGORY_MAP = {};
  for (var i = 0; i < CATEGORIES.length; i++) {
    CATEGORY_MAP[CATEGORIES[i].key] = CATEGORIES[i];
  }

  // Hue ranges: [minH, maxH) → key
  var HUE_RANGES = [
    { min: 0, max: 10, key: 'red' },
    { min: 10, max: 40, key: 'orange' },
    { min: 40, max: 70, key: 'yellow' },
    { min: 70, max: 175, key: 'green' },
    { min: 175, max: 260, key: 'blue' },
    { min: 260, max: 350, key: 'purple' },
    { min: 350, max: 360, key: 'red' },
  ];

  function classifyByHue(h) {
    for (var i = 0; i < HUE_RANGES.length; i++) {
      var range = HUE_RANGES[i];
      if (h >= range.min && h < range.max) {
        return range.key;
      }
    }
    return 'red';
  }

  /**
   * Classify RGB color into one of 9 categories.
   * Uses HSV: achromatic check first (S/V), then hue-based classification.
   * @param {number} r 0-255
   * @param {number} g 0-255
   * @param {number} b 0-255
   * @returns {{ key: string, name: string }}
   */
  function classify(r, g, b) {
    var hsv = FH.ColorConverter.rgbToHsv(r, g, b);

    // Achromatic: V <= 20 → black
    if (hsv.v <= 20) {
      return CATEGORY_MAP.black;
    }

    // Achromatic: S <= 15 → white or gray
    if (hsv.s <= 15) {
      if (hsv.v > 80) {
        return CATEGORY_MAP.white;
      }
      return CATEGORY_MAP.gray;
    }

    var key = classifyByHue(hsv.h);
    return CATEGORY_MAP[key];
  }

  FH.ColorClassifier = {
    classify: classify,
    CATEGORIES: CATEGORIES,
  };
})(window.FH);
