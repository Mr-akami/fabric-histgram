import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import { loadModules } from './helpers/load-script.js';

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

function createMockCanvas(clientWidth, clientHeight) {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'clientWidth', { value: clientWidth, writable: true });
  Object.defineProperty(canvas, 'clientHeight', { value: clientHeight, writable: true });
  return canvas;
}

describe('FH.PixelInspector.init', () => {
  test('should register click event listener on canvas', () => {
    const canvas = createMockCanvas(500, 400);
    const infoPanel = createInfoPanel();
    const addEventSpy = vi.spyOn(canvas, 'addEventListener');

    FH.PixelInspector.init(canvas, infoPanel);

    expect(addEventSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });
});

describe('click event handling', () => {
  test('should update info panel with RGB values on canvas click', () => {
    const canvas = createMockCanvas(100, 100);
    canvas.width = 100;
    canvas.height = 100;
    const infoPanel = createInfoPanel();

    // Stub getPixelAt to return known pixel data
    vi.spyOn(FH.CanvasRenderer, 'getPixelAt').mockReturnValue({
      r: 255, g: 128, b: 0, x: 50, y: 50,
    });

    FH.PixelInspector.init(canvas, infoPanel);

    const clickEvent = new MouseEvent('click', { offsetX: 50, offsetY: 50 });
    canvas.dispatchEvent(clickEvent);

    const rgbEl = infoPanel.querySelector('[data-info="rgb"]');
    expect(rgbEl.textContent).toContain('255');
    expect(rgbEl.textContent).toContain('128');
    expect(rgbEl.textContent).toContain('0');
  });

  test('should update info panel with HSV values on canvas click', () => {
    const canvas = createMockCanvas(100, 100);
    canvas.width = 100;
    canvas.height = 100;
    const infoPanel = createInfoPanel();

    vi.spyOn(FH.CanvasRenderer, 'getPixelAt').mockReturnValue({
      r: 255, g: 0, b: 0, x: 10, y: 10,
    });

    FH.PixelInspector.init(canvas, infoPanel);

    const clickEvent = new MouseEvent('click', { offsetX: 10, offsetY: 10 });
    canvas.dispatchEvent(clickEvent);

    const hsvEl = infoPanel.querySelector('[data-info="hsv"]');
    expect(hsvEl.textContent).toContain('0');
    expect(hsvEl.textContent).toContain('100');
  });

  test('should update info panel with Hex value on canvas click', () => {
    const canvas = createMockCanvas(100, 100);
    canvas.width = 100;
    canvas.height = 100;
    const infoPanel = createInfoPanel();

    vi.spyOn(FH.CanvasRenderer, 'getPixelAt').mockReturnValue({
      r: 255, g: 0, b: 0, x: 10, y: 10,
    });

    FH.PixelInspector.init(canvas, infoPanel);

    const clickEvent = new MouseEvent('click', { offsetX: 10, offsetY: 10 });
    canvas.dispatchEvent(clickEvent);

    const hexEl = infoPanel.querySelector('[data-info="hex"]');
    expect(hexEl.textContent).toContain('#FF0000');
  });

  test('should update info panel with coordinates on canvas click', () => {
    const canvas = createMockCanvas(100, 100);
    canvas.width = 100;
    canvas.height = 100;
    const infoPanel = createInfoPanel();

    vi.spyOn(FH.CanvasRenderer, 'getPixelAt').mockReturnValue({
      r: 0, g: 0, b: 0, x: 42, y: 73,
    });

    FH.PixelInspector.init(canvas, infoPanel);

    const clickEvent = new MouseEvent('click', { offsetX: 42, offsetY: 73 });
    canvas.dispatchEvent(clickEvent);

    const coordsEl = infoPanel.querySelector('[data-info="coords"]');
    expect(coordsEl.textContent).toContain('42');
    expect(coordsEl.textContent).toContain('73');
  });

  test('should call getPixelAt with event offsetX and offsetY', () => {
    const canvas = createMockCanvas(100, 100);
    canvas.width = 100;
    canvas.height = 100;
    const infoPanel = createInfoPanel();

    const getPixelSpy = vi.spyOn(FH.CanvasRenderer, 'getPixelAt').mockReturnValue({
      r: 0, g: 0, b: 0, x: 0, y: 0,
    });

    FH.PixelInspector.init(canvas, infoPanel);

    const clickEvent = new MouseEvent('click', { offsetX: 77, offsetY: 33 });
    canvas.dispatchEvent(clickEvent);

    expect(getPixelSpy).toHaveBeenCalledWith(77, 33);
  });
});
