import { describe, test, expect, beforeAll } from 'vitest';
import { loadModules } from './helpers/load-script.js';

beforeAll(() => {
  window.FH = {};
  loadModules([
    'js/color-converter.js',
    'js/histogram-analyzer.js',
  ]);
});

describe('FH.HistogramAnalyzer.analyze', () => {
  function analyze(imageData) {
    return FH.HistogramAnalyzer.analyze(imageData);
  }

  function createImageData(pixels) {
    var data = new Uint8ClampedArray(pixels.length * 4);
    for (var i = 0; i < pixels.length; i++) {
      data[i * 4] = pixels[i][0];
      data[i * 4 + 1] = pixels[i][1];
      data[i * 4 + 2] = pixels[i][2];
      data[i * 4 + 3] = 255;
    }
    return { data: data, width: pixels.length, height: 1 };
  }

  describe('return structure', () => {
    test('should return object with r, g, b, luminance arrays', () => {
      // Given: single black pixel
      var imageData = createImageData([[0, 0, 0]]);

      // When
      var result = analyze(imageData);

      // Then
      expect(result).toHaveProperty('r');
      expect(result).toHaveProperty('g');
      expect(result).toHaveProperty('b');
      expect(result).toHaveProperty('luminance');
    });

    test('should return arrays of length 256', () => {
      var imageData = createImageData([[0, 0, 0]]);

      var result = analyze(imageData);

      expect(result.r.length).toBe(256);
      expect(result.g.length).toBe(256);
      expect(result.b.length).toBe(256);
      expect(result.luminance.length).toBe(256);
    });

    test('should initialize all bins to 0 except those with pixels', () => {
      // Given: single pixel with R=100, G=0, B=0
      var imageData = createImageData([[100, 0, 0]]);

      // When
      var result = analyze(imageData);

      // Then: only bin 100 for R has count
      expect(result.r[100]).toBe(1);
      expect(result.r[0]).toBe(0);
      expect(result.r[255]).toBe(0);
    });
  });

  describe('RGB channel histograms', () => {
    test('should count R channel correctly for multiple pixels', () => {
      // Given: 3 pixels with R values: 0, 0, 128
      var imageData = createImageData([
        [0, 50, 100],
        [0, 100, 200],
        [128, 75, 150],
      ]);

      // When
      var result = analyze(imageData);

      // Then
      expect(result.r[0]).toBe(2);
      expect(result.r[128]).toBe(1);
    });

    test('should count G channel correctly', () => {
      var imageData = createImageData([
        [10, 200, 30],
        [40, 200, 60],
        [70, 100, 90],
      ]);

      var result = analyze(imageData);

      expect(result.g[200]).toBe(2);
      expect(result.g[100]).toBe(1);
    });

    test('should count B channel correctly', () => {
      var imageData = createImageData([
        [10, 20, 255],
        [40, 50, 255],
        [70, 80, 0],
      ]);

      var result = analyze(imageData);

      expect(result.b[255]).toBe(2);
      expect(result.b[0]).toBe(1);
    });

    test('should handle all-same-color pixels', () => {
      // Given: 4 identical white pixels
      var imageData = createImageData([
        [255, 255, 255],
        [255, 255, 255],
        [255, 255, 255],
        [255, 255, 255],
      ]);

      var result = analyze(imageData);

      expect(result.r[255]).toBe(4);
      expect(result.g[255]).toBe(4);
      expect(result.b[255]).toBe(4);
    });
  });

  describe('luminance histogram', () => {
    test('should compute luminance using BT.601 formula for white pixel', () => {
      // Given: white pixel (255,255,255) → luminance = 255
      var imageData = createImageData([[255, 255, 255]]);

      var result = analyze(imageData);

      expect(result.luminance[255]).toBe(1);
    });

    test('should compute luminance using BT.601 formula for black pixel', () => {
      // Given: black pixel (0,0,0) → luminance = 0
      var imageData = createImageData([[0, 0, 0]]);

      var result = analyze(imageData);

      expect(result.luminance[0]).toBe(1);
    });

    test('should compute luminance for pure red', () => {
      // Given: pure red (255,0,0) → luminance = round(0.299*255) = round(76.245) = 76
      var imageData = createImageData([[255, 0, 0]]);

      var result = analyze(imageData);

      // BT.601: 0.299*255 + 0.587*0 + 0.114*0 ≈ 76
      expect(result.luminance[76]).toBe(1);
    });

    test('should compute luminance for pure green', () => {
      // Given: pure green (0,255,0) → luminance = round(0.587*255) = round(149.685) = 150
      var imageData = createImageData([[0, 255, 0]]);

      var result = analyze(imageData);

      // BT.601: 0.299*0 + 0.587*255 + 0.114*0 ≈ 150
      expect(result.luminance[150]).toBe(1);
    });

    test('should compute luminance for pure blue', () => {
      // Given: pure blue (0,0,255) → luminance = round(0.114*255) = round(29.07) = 29
      var imageData = createImageData([[0, 0, 255]]);

      var result = analyze(imageData);

      // BT.601: 0.299*0 + 0.587*0 + 0.114*255 ≈ 29
      expect(result.luminance[29]).toBe(1);
    });
  });

  describe('edge cases', () => {
    test('should handle single pixel image', () => {
      var imageData = createImageData([[42, 84, 126]]);

      var result = analyze(imageData);

      expect(result.r[42]).toBe(1);
      expect(result.g[84]).toBe(1);
      expect(result.b[126]).toBe(1);

      // Total pixel count across all luminance bins should be 1
      var totalLuminance = result.luminance.reduce(function (sum, v) { return sum + v; }, 0);
      expect(totalLuminance).toBe(1);
    });

    test('should handle boundary values (0 and 255)', () => {
      var imageData = createImageData([
        [0, 0, 0],
        [255, 255, 255],
      ]);

      var result = analyze(imageData);

      expect(result.r[0]).toBe(1);
      expect(result.r[255]).toBe(1);
      expect(result.g[0]).toBe(1);
      expect(result.g[255]).toBe(1);
      expect(result.b[0]).toBe(1);
      expect(result.b[255]).toBe(1);
    });

    test('should preserve total pixel count across all bins', () => {
      var pixels = [
        [10, 20, 30],
        [40, 50, 60],
        [70, 80, 90],
        [100, 110, 120],
        [130, 140, 150],
      ];
      var imageData = createImageData(pixels);

      var result = analyze(imageData);

      var totalR = result.r.reduce(function (sum, v) { return sum + v; }, 0);
      var totalG = result.g.reduce(function (sum, v) { return sum + v; }, 0);
      var totalB = result.b.reduce(function (sum, v) { return sum + v; }, 0);
      var totalL = result.luminance.reduce(function (sum, v) { return sum + v; }, 0);

      expect(totalR).toBe(5);
      expect(totalG).toBe(5);
      expect(totalB).toBe(5);
      expect(totalL).toBe(5);
    });
  });
});
