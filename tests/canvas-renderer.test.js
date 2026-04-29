import { loadScript } from './helpers/load-script.js';
import { describe, test, expect, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  window.FH = {};
  loadScript('js/canvas-renderer.js');
});

function createMockCanvas(clientWidth, clientHeight) {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'clientWidth', { value: clientWidth, writable: true });
  Object.defineProperty(canvas, 'clientHeight', { value: clientHeight, writable: true });
  return canvas;
}

function createMockImage(width, height) {
  const img = new Image();
  Object.defineProperty(img, 'naturalWidth', { value: width });
  Object.defineProperty(img, 'naturalHeight', { value: height });
  Object.defineProperty(img, 'width', { value: width });
  Object.defineProperty(img, 'height', { value: height });
  return img;
}

describe('FH.CanvasRenderer.render', () => {
  test('should set canvas width/height to image original dimensions', () => {
    const canvas = createMockCanvas(500, 400);
    const image = createMockImage(1920, 1080);

    FH.CanvasRenderer.render(canvas, image);

    expect(canvas.width).toBe(1920);
    expect(canvas.height).toBe(1080);
  });

  test('should set canvas width/height for small image', () => {
    const canvas = createMockCanvas(800, 600);
    const image = createMockImage(100, 50);

    FH.CanvasRenderer.render(canvas, image);

    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(50);
  });

  test('should set canvas width/height for square image', () => {
    const canvas = createMockCanvas(800, 600);
    const image = createMockImage(500, 500);

    FH.CanvasRenderer.render(canvas, image);

    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(500);
  });
});

describe('FH.CanvasRenderer.getPixelAt', () => {
  test('should transform display coordinates to original image coordinates when scaled', () => {
    // Given: 1000x800 image displayed at 500x400
    const canvas = createMockCanvas(500, 400);
    const image = createMockImage(1000, 800);
    FH.CanvasRenderer.render(canvas, image);

    // When: click at display (250, 200) → original (500, 400)
    const result = FH.CanvasRenderer.getPixelAt(250, 200);

    expect(result.x).toBe(500);
    expect(result.y).toBe(400);
  });

  test('should return (0,0) when clicking top-left corner', () => {
    const canvas = createMockCanvas(500, 400);
    const image = createMockImage(1000, 800);
    FH.CanvasRenderer.render(canvas, image);

    const result = FH.CanvasRenderer.getPixelAt(0, 0);

    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  test('should clamp to max coordinates when clicking bottom-right edge', () => {
    const canvas = createMockCanvas(500, 400);
    const image = createMockImage(1000, 800);
    FH.CanvasRenderer.render(canvas, image);

    // display (499, 399) → original (998, 798)
    const result = FH.CanvasRenderer.getPixelAt(499, 399);

    expect(result.x).toBe(998);
    expect(result.y).toBe(798);
  });

  test('should return 1:1 coordinates when no scaling', () => {
    const canvas = createMockCanvas(800, 600);
    const image = createMockImage(800, 600);
    FH.CanvasRenderer.render(canvas, image);

    const result = FH.CanvasRenderer.getPixelAt(100, 200);

    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
  });

  test('should return r, g, b values in 0-255 range', () => {
    const canvas = createMockCanvas(100, 100);
    const image = createMockImage(100, 100);
    FH.CanvasRenderer.render(canvas, image);

    const result = FH.CanvasRenderer.getPixelAt(0, 0);

    expect(result.r).toBeGreaterThanOrEqual(0);
    expect(result.r).toBeLessThanOrEqual(255);
    expect(result.g).toBeGreaterThanOrEqual(0);
    expect(result.g).toBeLessThanOrEqual(255);
    expect(result.b).toBeGreaterThanOrEqual(0);
    expect(result.b).toBeLessThanOrEqual(255);
  });

  test('should return object with r, g, b, x, y properties', () => {
    const canvas = createMockCanvas(100, 100);
    const image = createMockImage(100, 100);
    FH.CanvasRenderer.render(canvas, image);

    const result = FH.CanvasRenderer.getPixelAt(50, 50);

    expect(result).toHaveProperty('r');
    expect(result).toHaveProperty('g');
    expect(result).toHaveProperty('b');
    expect(result).toHaveProperty('x');
    expect(result).toHaveProperty('y');
  });

  test('should floor fractional coordinates from scaling', () => {
    // Given: 1001x801 image displayed at 500x400 → scale ratio is not integer
    const canvas = createMockCanvas(500, 400);
    const image = createMockImage(1001, 801);
    FH.CanvasRenderer.render(canvas, image);

    const result = FH.CanvasRenderer.getPixelAt(1, 1);

    expect(Number.isInteger(result.x)).toBe(true);
    expect(Number.isInteger(result.y)).toBe(true);
  });
});
