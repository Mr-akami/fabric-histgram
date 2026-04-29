import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import { loadModules } from './helpers/load-script.js';

var mockDestroy;

beforeAll(() => {
  mockDestroy = vi.fn();
  window.Chart = vi.fn(function () {
    return { destroy: mockDestroy };
  });

  window.FH = {};
  loadModules([
    'js/color-converter.js',
    'js/histogram-panel.js',
  ]);
});

function createHistData() {
  var empty = new Array(256).fill(0);
  return {
    r: empty.slice(),
    g: empty.slice(),
    b: empty.slice(),
    luminance: empty.slice(),
  };
}

describe('FH.HistogramPanel.init', () => {
  test('should toggle panel display on button click', () => {
    var panel = document.createElement('div');
    panel.style.display = 'none';
    var btn = document.createElement('button');

    FH.HistogramPanel.init(panel, btn);

    btn.click();
    expect(panel.style.display).toBe('block');

    btn.click();
    expect(panel.style.display).toBe('none');
  });
});

describe('FH.HistogramPanel.render', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should create 4 Chart instances', () => {
    var panel = document.createElement('div');
    var btn = document.createElement('button');
    FH.HistogramPanel.init(panel, btn);

    FH.HistogramPanel.render(createHistData());

    expect(window.Chart).toHaveBeenCalledTimes(4);
  });

  test('should create 4 canvas elements inside panel', () => {
    var panel = document.createElement('div');
    var btn = document.createElement('button');
    FH.HistogramPanel.init(panel, btn);

    FH.HistogramPanel.render(createHistData());

    var canvases = panel.querySelectorAll('canvas');
    expect(canvases.length).toBe(4);
  });

  test('should replace canvas elements on re-render (not accumulate)', () => {
    var panel = document.createElement('div');
    var btn = document.createElement('button');
    FH.HistogramPanel.init(panel, btn);

    FH.HistogramPanel.render(createHistData());
    FH.HistogramPanel.render(createHistData());

    var canvases = panel.querySelectorAll('canvas');
    expect(canvases.length).toBe(4);
  });

  test('should call destroy on previous charts when re-rendered', () => {
    var panel = document.createElement('div');
    var btn = document.createElement('button');
    FH.HistogramPanel.init(panel, btn);

    FH.HistogramPanel.render(createHistData());
    mockDestroy.mockClear();

    FH.HistogramPanel.render(createHistData());

    expect(mockDestroy).toHaveBeenCalledTimes(4);
  });
});
