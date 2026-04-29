import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import { loadModules } from '../helpers/load-script.js';

/**
 * 統合テスト: 画像読み込み → ヒストグラム算出 → 面積率レポート → 色カテゴリ表示
 * の3モジュール以上横断フローを検証。
 */

beforeAll(() => {
  window.FH = {};
  loadModules([
    'js/color-converter.js',
    'js/color-classifier.js',
    'js/canvas-renderer.js',
    'js/pixel-inspector.js',
    'js/histogram-analyzer.js',
    'js/area-report.js',
  ]);
});

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

function createInfoPanel() {
  var panel = document.createElement('div');
  panel.innerHTML = [
    '<span data-info="rgb"></span>',
    '<span data-info="hsv"></span>',
    '<span data-info="hex"></span>',
    '<span data-info="coords"></span>',
    '<span data-info="category"></span>',
  ].join('');
  return panel;
}

function createCanvasWithImage(imageW, imageH, displayW, displayH) {
  var canvas = document.createElement('canvas');
  canvas.width = imageW;
  canvas.height = imageH;
  Object.defineProperty(canvas, 'clientWidth', { value: displayW });
  Object.defineProperty(canvas, 'clientHeight', { value: displayH });
  return canvas;
}

describe('histogram + area report integration flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('should compute histogram data from full image data via CanvasRenderer → HistogramAnalyzer', () => {
    // Given: image with known pixel distribution
    var pixels = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [128, 128, 128],
    ];
    var imageData = createImageData(pixels);
    vi.spyOn(FH.CanvasRenderer, 'getFullImageData').mockReturnValue(imageData);

    // When: analyze via HistogramAnalyzer
    var fullImageData = FH.CanvasRenderer.getFullImageData();
    var histData = FH.HistogramAnalyzer.analyze(fullImageData);

    // Then: R channel should have counts at 255, 0, 0, 128
    expect(histData.r[255]).toBe(1);
    expect(histData.r[0]).toBe(2);
    expect(histData.r[128]).toBe(1);

    // G channel
    expect(histData.g[0]).toBe(2);
    expect(histData.g[255]).toBe(1);
    expect(histData.g[128]).toBe(1);

    // B channel
    expect(histData.b[0]).toBe(2);
    expect(histData.b[255]).toBe(1);
    expect(histData.b[128]).toBe(1);

    // Luminance bins should total 4
    var totalL = histData.luminance.reduce(function (s, v) { return s + v; }, 0);
    expect(totalL).toBe(4);
  });

  test('should generate area report with correct category distribution via CanvasRenderer → ColorClassifier → AreaReport', () => {
    // Given: 10 pixels — 5 red, 3 green, 2 blue → 50% red, 30% green, 20% blue
    var pixels = [
      [255, 0, 0], [255, 0, 0], [255, 0, 0], [255, 0, 0], [255, 0, 0],
      [0, 255, 0], [0, 255, 0], [0, 255, 0],
      [0, 0, 255], [0, 0, 255],
    ];
    var imageData = createImageData(pixels);

    var container = document.createElement('div');
    var btn = document.createElement('button');
    FH.AreaReport.init(container, btn);

    // When: pass imageData directly (same as index.html orchestration)
    FH.AreaReport.analyze(imageData);

    // Then: report should contain percentage values
    expect(container.textContent).toContain('50');
    expect(container.textContent).toContain('30');
    expect(container.textContent).toContain('20');
  });

  test('should display color category in pixel info when clicking canvas', () => {
    // Given: canvas with red pixel
    var canvas = createCanvasWithImage(100, 100, 100, 100);
    var infoPanel = createInfoPanel();
    var ctx = canvas.getContext('2d');

    vi.spyOn(ctx, 'getImageData').mockReturnValue({
      data: new Uint8ClampedArray([255, 0, 0, 255]),
    });

    vi.spyOn(FH.CanvasRenderer, 'getPixelAt').mockImplementation(function (displayX, displayY) {
      var imageData = ctx.getImageData(0, 0, 1, 1);
      return {
        r: imageData.data[0],
        g: imageData.data[1],
        b: imageData.data[2],
        x: displayX,
        y: displayY,
      };
    });

    FH.PixelInspector.init(canvas, infoPanel);

    // When: click on canvas
    var clickEvent = new MouseEvent('click', { offsetX: 50, offsetY: 50 });
    canvas.dispatchEvent(clickEvent);

    // Then: category element should show red category
    var categoryEl = infoPanel.querySelector('[data-info="category"]');
    expect(categoryEl.textContent).toContain('赤');
  });

  test('should show color category for green pixel click', () => {
    // Given: canvas with green pixel
    var canvas = createCanvasWithImage(100, 100, 100, 100);
    var infoPanel = createInfoPanel();
    var ctx = canvas.getContext('2d');

    vi.spyOn(ctx, 'getImageData').mockReturnValue({
      data: new Uint8ClampedArray([0, 255, 0, 255]),
    });

    vi.spyOn(FH.CanvasRenderer, 'getPixelAt').mockImplementation(function (displayX, displayY) {
      var imageData = ctx.getImageData(0, 0, 1, 1);
      return {
        r: imageData.data[0],
        g: imageData.data[1],
        b: imageData.data[2],
        x: displayX,
        y: displayY,
      };
    });

    FH.PixelInspector.init(canvas, infoPanel);

    // When
    var clickEvent = new MouseEvent('click', { offsetX: 25, offsetY: 25 });
    canvas.dispatchEvent(clickEvent);

    // Then
    var categoryEl = infoPanel.querySelector('[data-info="category"]');
    expect(categoryEl.textContent).toContain('緑');
  });

  test('should run full pipeline: getFullImageData → histogram + area report in sequence', () => {
    // Given: 3-color image
    var pixels = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
    ];
    var imageData = createImageData(pixels);
    var getFullSpy = vi.spyOn(FH.CanvasRenderer, 'getFullImageData').mockReturnValue(imageData);

    // When: simulate the orchestration from index.html
    var fullData = FH.CanvasRenderer.getFullImageData();
    var histData = FH.HistogramAnalyzer.analyze(fullData);

    var container = document.createElement('div');
    var btn = document.createElement('button');
    FH.AreaReport.init(container, btn);
    FH.AreaReport.analyze(fullData);

    // Then: histogram data is valid
    expect(histData.r[255]).toBe(1);
    expect(histData.g[255]).toBe(1);
    expect(histData.b[255]).toBe(1);

    // And: area report is populated
    expect(container.textContent.length).toBeGreaterThan(0);

    // And: getFullImageData was called once by orchestration (not by AreaReport)
    expect(getFullSpy).toHaveBeenCalledOnce();
  });
});
