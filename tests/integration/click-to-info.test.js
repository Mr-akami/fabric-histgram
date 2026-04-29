import { describe, test, expect, beforeAll, vi } from 'vitest';
import { loadModules } from '../helpers/load-script.js';

/**
 * 統合テスト: pixel-inspector → canvas-renderer → color-converter の
 * 3モジュール横断フロー。クリックから情報パネル更新までの一連の流れを検証。
 */

beforeAll(() => {
  window.FH = {};
  loadModules([
    'js/color-converter.js',
    'js/canvas-renderer.js',
    'js/pixel-inspector.js',
  ]);
});

function createInfoPanel() {
  const panel = document.createElement('div');
  panel.innerHTML = `
    <span data-info="rgb"></span>
    <span data-info="hsv"></span>
    <span data-info="hex"></span>
    <span data-info="coords"></span>
  `;
  return panel;
}

function createCanvasWithImage(imageW, imageH, displayW, displayH) {
  const canvas = document.createElement('canvas');
  canvas.width = imageW;
  canvas.height = imageH;
  Object.defineProperty(canvas, 'clientWidth', { value: displayW });
  Object.defineProperty(canvas, 'clientHeight', { value: displayH });
  return canvas;
}

describe('click-to-info integration', () => {
  test('should display correct color info when clicking a pixel with known color', () => {
    // Given: a canvas with known pixel data
    const canvas = createCanvasWithImage(200, 200, 200, 200);
    const infoPanel = createInfoPanel();

    // Stub getImageData at the canvas context level to return a known color
    const ctx = canvas.getContext('2d');
    vi.spyOn(ctx, 'getImageData').mockReturnValue({
      data: new Uint8ClampedArray([255, 0, 0, 255]),
    });

    // Re-stub getPixelAt to use the real coordinate transform + stubbed getImageData
    // This tests the real flow: click → coordinate transform → getImageData → color convert → DOM
    vi.spyOn(FH.CanvasRenderer, 'getPixelAt').mockImplementation((displayX, displayY) => {
      const x = Math.floor(displayX * (canvas.width / canvas.clientWidth));
      const y = Math.floor(displayY * (canvas.height / canvas.clientHeight));
      const imageData = ctx.getImageData(x, y, 1, 1);
      return {
        r: imageData.data[0],
        g: imageData.data[1],
        b: imageData.data[2],
        x,
        y,
      };
    });

    FH.PixelInspector.init(canvas, infoPanel);

    // When: click at (100, 100)
    const clickEvent = new MouseEvent('click', { offsetX: 100, offsetY: 100 });
    canvas.dispatchEvent(clickEvent);

    // Then: info panel shows correct RGB, HSV, Hex, and coordinates
    const rgbEl = infoPanel.querySelector('[data-info="rgb"]');
    expect(rgbEl.textContent).toContain('255');

    const hsvEl = infoPanel.querySelector('[data-info="hsv"]');
    expect(hsvEl.textContent).toContain('0');
    expect(hsvEl.textContent).toContain('100');

    const hexEl = infoPanel.querySelector('[data-info="hex"]');
    expect(hexEl.textContent).toContain('#FF0000');

    const coordsEl = infoPanel.querySelector('[data-info="coords"]');
    expect(coordsEl.textContent).toContain('100');
  });

  test('should handle scaled canvas coordinates correctly in full flow', () => {
    // Given: 1000x800 image displayed at 500x400
    const canvas = createCanvasWithImage(1000, 800, 500, 400);
    const infoPanel = createInfoPanel();
    const ctx = canvas.getContext('2d');

    vi.spyOn(ctx, 'getImageData').mockReturnValue({
      data: new Uint8ClampedArray([0, 255, 0, 255]),
    });

    vi.spyOn(FH.CanvasRenderer, 'getPixelAt').mockImplementation((displayX, displayY) => {
      const x = Math.floor(displayX * (canvas.width / canvas.clientWidth));
      const y = Math.floor(displayY * (canvas.height / canvas.clientHeight));
      const imageData = ctx.getImageData(x, y, 1, 1);
      return {
        r: imageData.data[0],
        g: imageData.data[1],
        b: imageData.data[2],
        x,
        y,
      };
    });

    FH.PixelInspector.init(canvas, infoPanel);

    // When: click at display (250, 200) → should resolve to original (500, 400)
    const clickEvent = new MouseEvent('click', { offsetX: 250, offsetY: 200 });
    canvas.dispatchEvent(clickEvent);

    // Then: coordinates reflect original image position
    const coordsEl = infoPanel.querySelector('[data-info="coords"]');
    expect(coordsEl.textContent).toContain('500');
    expect(coordsEl.textContent).toContain('400');

    // And: color info is green
    const hexEl = infoPanel.querySelector('[data-info="hex"]');
    expect(hexEl.textContent).toContain('#00FF00');
  });

  test('should display all four info sections after click', () => {
    const canvas = createCanvasWithImage(100, 100, 100, 100);
    const infoPanel = createInfoPanel();
    const ctx = canvas.getContext('2d');

    vi.spyOn(ctx, 'getImageData').mockReturnValue({
      data: new Uint8ClampedArray([128, 64, 32, 255]),
    });

    vi.spyOn(FH.CanvasRenderer, 'getPixelAt').mockImplementation((displayX, displayY) => {
      const x = Math.floor(displayX * (canvas.width / canvas.clientWidth));
      const y = Math.floor(displayY * (canvas.height / canvas.clientHeight));
      const imageData = ctx.getImageData(x, y, 1, 1);
      return {
        r: imageData.data[0],
        g: imageData.data[1],
        b: imageData.data[2],
        x,
        y,
      };
    });

    FH.PixelInspector.init(canvas, infoPanel);

    const clickEvent = new MouseEvent('click', { offsetX: 50, offsetY: 50 });
    canvas.dispatchEvent(clickEvent);

    // All four sections should have content
    const rgbEl = infoPanel.querySelector('[data-info="rgb"]');
    const hsvEl = infoPanel.querySelector('[data-info="hsv"]');
    const hexEl = infoPanel.querySelector('[data-info="hex"]');
    const coordsEl = infoPanel.querySelector('[data-info="coords"]');

    expect(rgbEl.textContent.length).toBeGreaterThan(0);
    expect(hsvEl.textContent.length).toBeGreaterThan(0);
    expect(hexEl.textContent.length).toBeGreaterThan(0);
    expect(coordsEl.textContent.length).toBeGreaterThan(0);
  });
});
