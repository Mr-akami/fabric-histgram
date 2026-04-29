import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { loadModules } from './helpers/load-script.js';

beforeAll(() => {
  window.FH = {};
  loadModules([
    'js/color-converter.js',
    'js/color-presets.js',
    'js/preset-visualizer.js',
  ]);
});

beforeEach(() => {
  window.localStorage.clear();
  FH.ColorPresets._resetMemory();
});

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

describe('FH.PresetVisualizer', () => {
  test('drawWheel runs without throwing on default categories', () => {
    const cats = FH.ColorPresets.getStored();
    const canvas = makeCanvas(40, 40);
    expect(() => FH.PresetVisualizer.drawWheel(canvas, cats)).not.toThrow();
  });

  test('drawVBar runs without throwing', () => {
    const cats = FH.ColorPresets.getStored();
    const canvas = makeCanvas(20, 60);
    expect(() => FH.PresetVisualizer.drawVBar(canvas, cats)).not.toThrow();
  });

  test('drawRgbChannel runs for each channel', () => {
    FH.ColorPresets.add({
      name: 'rgb1', displayColor: '#ffaa00', rangeMode: 'rgb',
      rMin: 100, rMax: 200, gMin: 50, gMax: 150, bMin: 0, bMax: 80,
    });
    const cats = FH.ColorPresets.getStored();
    ['r', 'g', 'b'].forEach((ch) => {
      const canvas = makeCanvas(120, 16);
      expect(() => FH.PresetVisualizer.drawRgbChannel(canvas, ch, cats)).not.toThrow();
    });
  });

  test('drawInlineHueBar runs for HSV preset', () => {
    const red = FH.ColorPresets.getById('red');
    const canvas = makeCanvas(80, 12);
    expect(() => FH.PresetVisualizer.drawInlineHueBar(canvas, red)).not.toThrow();
  });

  test('drawInlineRgbBar runs for RGB preset', () => {
    const cat = FH.ColorPresets.add({
      name: 'x', displayColor: '#fff', rangeMode: 'rgb',
      rMin: 0, rMax: 255, gMin: 0, gMax: 255, bMin: 0, bMax: 255,
    });
    const canvas = makeCanvas(80, 24);
    expect(() => FH.PresetVisualizer.drawInlineRgbBar(canvas, cat)).not.toThrow();
  });
});
