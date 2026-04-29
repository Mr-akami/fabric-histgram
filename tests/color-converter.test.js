import { describe, test, expect, beforeAll } from 'vitest';
import { loadScript } from './helpers/load-script.js';

beforeAll(() => {
  window.FH = {};
  loadScript('js/color-converter.js');
});

describe('FH.ColorConverter.rgbToHsv', () => {
  function rgbToHsv(r, g, b) {
    return FH.ColorConverter.rgbToHsv(r, g, b);
  }

  describe('primary colors', () => {
    test('should return h=0, s=100, v=100 when pure red', () => {
      const result = rgbToHsv(255, 0, 0);

      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.v).toBe(100);
    });

    test('should return h=120, s=100, v=100 when pure green', () => {
      const result = rgbToHsv(0, 255, 0);

      expect(result.h).toBe(120);
      expect(result.s).toBe(100);
      expect(result.v).toBe(100);
    });

    test('should return h=240, s=100, v=100 when pure blue', () => {
      const result = rgbToHsv(0, 0, 255);

      expect(result.h).toBe(240);
      expect(result.s).toBe(100);
      expect(result.v).toBe(100);
    });
  });

  describe('secondary colors', () => {
    test('should return h=60, s=100, v=100 when yellow', () => {
      const result = rgbToHsv(255, 255, 0);

      expect(result.h).toBe(60);
      expect(result.s).toBe(100);
      expect(result.v).toBe(100);
    });

    test('should return h=180, s=100, v=100 when cyan', () => {
      const result = rgbToHsv(0, 255, 255);

      expect(result.h).toBe(180);
      expect(result.s).toBe(100);
      expect(result.v).toBe(100);
    });

    test('should return h=300, s=100, v=100 when magenta', () => {
      const result = rgbToHsv(255, 0, 255);

      expect(result.h).toBe(300);
      expect(result.s).toBe(100);
      expect(result.v).toBe(100);
    });
  });

  describe('achromatic colors', () => {
    test('should return h=0, s=0, v=0 when black', () => {
      const result = rgbToHsv(0, 0, 0);

      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.v).toBe(0);
    });

    test('should return h=0, s=0, v=100 when white', () => {
      const result = rgbToHsv(255, 255, 255);

      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.v).toBe(100);
    });

    test('should return h=0, s=0, v≈50.2 when gray(128,128,128)', () => {
      const result = rgbToHsv(128, 128, 128);

      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.v).toBeCloseTo(50.2, 1);
    });
  });

  describe('arbitrary colors', () => {
    test('should convert orange (255,165,0) correctly', () => {
      const result = rgbToHsv(255, 165, 0);

      expect(result.h).toBe(39);
      expect(result.s).toBe(100);
      expect(result.v).toBe(100);
    });

    test('should convert dark teal (0,128,128) correctly', () => {
      const result = rgbToHsv(0, 128, 128);

      expect(result.h).toBe(180);
      expect(result.s).toBe(100);
      expect(result.v).toBeCloseTo(50.2, 1);
    });
  });

  describe('rounding', () => {
    test('should return h as integer', () => {
      const result = rgbToHsv(200, 100, 50);

      expect(Number.isInteger(result.h)).toBe(true);
    });

    test('should return s with at most 1 decimal place', () => {
      const result = rgbToHsv(200, 100, 50);
      const decimalPlaces = (result.s.toString().split('.')[1] || '').length;

      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });

    test('should return v with at most 1 decimal place', () => {
      const result = rgbToHsv(200, 100, 50);
      const decimalPlaces = (result.v.toString().split('.')[1] || '').length;

      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });
  });
});

describe('FH.ColorConverter.rgbToHex', () => {
  function rgbToHex(r, g, b) {
    return FH.ColorConverter.rgbToHex(r, g, b);
  }

  test('should return #000000 when black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  test('should return #FFFFFF when white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
  });

  test('should return #FF0000 when pure red', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#FF0000');
  });

  test('should return #00FF00 when pure green', () => {
    expect(rgbToHex(0, 255, 0)).toBe('#00FF00');
  });

  test('should return #0000FF when pure blue', () => {
    expect(rgbToHex(0, 0, 255)).toBe('#0000FF');
  });

  test('should zero-pad single digit hex values', () => {
    expect(rgbToHex(1, 2, 3)).toBe('#010203');
  });

  test('should return #0F0F0F when (15,15,15)', () => {
    expect(rgbToHex(15, 15, 15)).toBe('#0F0F0F');
  });
});

describe('FH.ColorConverter.hsvToRgb', () => {
  const hsvToRgb = (h, s, v) => FH.ColorConverter.hsvToRgb(h, s, v);

  test('pure red (0, 100, 100)', () => {
    expect(hsvToRgb(0, 100, 100)).toEqual({ r: 255, g: 0, b: 0 });
  });

  test('pure green (120, 100, 100)', () => {
    expect(hsvToRgb(120, 100, 100)).toEqual({ r: 0, g: 255, b: 0 });
  });

  test('pure blue (240, 100, 100)', () => {
    expect(hsvToRgb(240, 100, 100)).toEqual({ r: 0, g: 0, b: 255 });
  });

  test('white (any, 0, 100)', () => {
    expect(hsvToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
  });

  test('black (any, any, 0)', () => {
    expect(hsvToRgb(180, 50, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });

  test('round-trip via rgbToHsv', () => {
    const orig = { r: 200, g: 100, b: 50 };
    const hsv = FH.ColorConverter.rgbToHsv(orig.r, orig.g, orig.b);
    const back = hsvToRgb(hsv.h, hsv.s, hsv.v);
    expect(Math.abs(back.r - orig.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(back.g - orig.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(back.b - orig.b)).toBeLessThanOrEqual(2);
  });
});
