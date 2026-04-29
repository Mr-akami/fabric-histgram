import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import { loadModules } from './helpers/load-script.js';

beforeAll(() => {
  window.FH = {};
  loadModules([
    'js/color-converter.js',
    'js/color-classifier.js',
    'js/canvas-renderer.js',
    'js/area-report.js',
  ]);
});

function createReportContainer() {
  var container = document.createElement('div');
  container.id = 'area-report';
  return container;
}

function createPrintButton() {
  var btn = document.createElement('button');
  btn.id = 'print-report';
  return btn;
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

describe('FH.AreaReport', () => {
  describe('init', () => {
    test('should accept reportContainer and printButton arguments', () => {
      var container = createReportContainer();
      var btn = createPrintButton();

      expect(function () {
        FH.AreaReport.init(container, btn);
      }).not.toThrow();
    });
  });

  describe('analyze', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    test('should populate report container with category percentages', () => {
      // Given: 4 pixels — 2 red, 1 green, 1 blue
      var imageData = createImageData([
        [255, 0, 0],
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
      ]);

      var container = createReportContainer();
      var btn = createPrintButton();
      FH.AreaReport.init(container, btn);

      // When
      FH.AreaReport.analyze(imageData);

      // Then: container should have content
      expect(container.textContent.length).toBeGreaterThan(0);
    });

    test('should show 100% for single-color image', () => {
      // Given: all pixels are pure red
      var imageData = createImageData([
        [255, 0, 0],
        [255, 0, 0],
        [255, 0, 0],
        [255, 0, 0],
      ]);

      var container = createReportContainer();
      var btn = createPrintButton();
      FH.AreaReport.init(container, btn);

      // When
      FH.AreaReport.analyze(imageData);

      // Then: should contain 100 (as percentage)
      expect(container.textContent).toContain('100');
    });

    test('should show correct percentages for evenly split image', () => {
      // Given: 2 red, 2 blue → 50% each
      var imageData = createImageData([
        [255, 0, 0],
        [255, 0, 0],
        [0, 0, 255],
        [0, 0, 255],
      ]);

      var container = createReportContainer();
      var btn = createPrintButton();
      FH.AreaReport.init(container, btn);

      // When
      FH.AreaReport.analyze(imageData);

      // Then: should contain 50
      expect(container.textContent).toContain('50');
    });

    test('should display all category names from CATEGORIES', () => {
      // Given: variety of pixels covering multiple categories
      var imageData = createImageData([
        [255, 0, 0],     // red
        [0, 255, 0],     // green
        [0, 0, 255],     // blue
        [0, 0, 0],       // black
      ]);

      var container = createReportContainer();
      var btn = createPrintButton();
      FH.AreaReport.init(container, btn);

      // When
      FH.AreaReport.analyze(imageData);

      // Then: all category names should appear in the report
      FH.ColorClassifier.CATEGORIES.forEach(function (cat) {
        expect(container.textContent).toContain(cat.name);
      });
    });

    test('should format integer percentage without decimal', () => {
      // Given: 4 pixels all red → 100% (integer)
      var imageData = createImageData([
        [255, 0, 0],
        [255, 0, 0],
        [255, 0, 0],
        [255, 0, 0],
      ]);

      var container = createReportContainer();
      var btn = createPrintButton();
      FH.AreaReport.init(container, btn);

      // When
      FH.AreaReport.analyze(imageData);

      // Then: should show "100%" not "100.0%"
      expect(container.innerHTML).toContain('100%');
      expect(container.innerHTML).not.toContain('100.0%');
    });

    test('should format decimal percentage with 1 decimal place', () => {
      // Given: 3 pixels — 1 red, 1 green, 1 blue → 33.3% each
      var imageData = createImageData([
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
      ]);

      var container = createReportContainer();
      var btn = createPrintButton();
      FH.AreaReport.init(container, btn);

      // When
      FH.AreaReport.analyze(imageData);

      // Then: should show "33.3%" (1 decimal)
      expect(container.textContent).toContain('33.3');
    });

    test('should render an HTML table with header row', () => {
      var imageData = createImageData([[255, 0, 0]]);

      var container = createReportContainer();
      var btn = createPrintButton();
      FH.AreaReport.init(container, btn);

      // When
      FH.AreaReport.analyze(imageData);

      // Then: should contain a table with category and percentage columns
      var table = container.querySelector('table');
      expect(table).not.toBeNull();
      var headers = table.querySelectorAll('th');
      expect(headers.length).toBe(2);
    });

    test('should render 9 data rows (one per category)', () => {
      var imageData = createImageData([[255, 0, 0]]);

      var container = createReportContainer();
      var btn = createPrintButton();
      FH.AreaReport.init(container, btn);

      // When
      FH.AreaReport.analyze(imageData);

      // Then: 1 header row + 9 data rows = 10 tr elements
      var rows = container.querySelectorAll('tr');
      expect(rows.length).toBe(10);
    });

    test('should not call CanvasRenderer.getFullImageData internally', () => {
      var imageData = createImageData([[255, 0, 0]]);
      var spy = vi.spyOn(FH.CanvasRenderer, 'getFullImageData');

      var container = createReportContainer();
      var btn = createPrintButton();
      FH.AreaReport.init(container, btn);

      // When
      FH.AreaReport.analyze(imageData);

      // Then: analyze receives data via argument, not internal fetch
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('print button', () => {
    test('should call window.print when print button is clicked', () => {
      var printSpy = vi.spyOn(window, 'print').mockImplementation(function () {});

      var container = createReportContainer();
      var btn = createPrintButton();
      FH.AreaReport.init(container, btn);

      // When
      btn.click();

      // Then
      expect(printSpy).toHaveBeenCalledOnce();
    });
  });
});
