(function (FH) {
  'use strict';

  function presetToCategory(p) {
    return { key: p.id, name: p.name, displayColor: p.displayColor };
  }

  function classifyAchromatic(hsv) {
    if (hsv.v <= 20) return 'black';
    if (hsv.s <= 15) {
      if (hsv.v > 80) return 'white';
      return 'gray';
    }
    return null;
  }

  /**
   * Classify RGB color via FH.ColorPresets.
   * Achromatic rules (V<=20 / S<=15) run first, then chromatic presets in stored
   * order (first match wins). Unmatched chromatic falls through to OTHER.
   * @returns {{ key: string, name: string, displayColor: string }}
   */
  function classify(r, g, b) {
    var hsv = FH.ColorConverter.rgbToHsv(r, g, b);
    var presets = FH.ColorPresets.getStored();

    var achroId = classifyAchromatic(hsv);
    if (achroId) {
      for (var i = 0; i < presets.length; i++) {
        if (presets[i].kind === 'achromatic' && presets[i].rule === achroId) {
          return presetToCategory(presets[i]);
        }
      }
    }

    for (var j = 0; j < presets.length; j++) {
      if (FH.ColorPresets.matchPixel(presets[j], r, g, b, hsv.h, hsv.s, hsv.v)) {
        return presetToCategory(presets[j]);
      }
    }

    return presetToCategory(FH.ColorPresets.getById(FH.ColorPresets.OTHER_ID));
  }

  FH.ColorClassifier = {
    classify: classify,
    get CATEGORIES() {
      return FH.ColorPresets.getAll().map(presetToCategory);
    },
  };
})(window.FH);
