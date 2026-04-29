import { describe, test, expect, beforeAll } from 'vitest';
import { loadModules } from './helpers/load-script.js';

beforeAll(() => {
  window.FH = {};
  loadModules([
    'js/color-converter.js',
    'js/color-classifier.js',
  ]);
});

describe('FH.ColorClassifier.classify', () => {
  function classify(r, g, b) {
    return FH.ColorClassifier.classify(r, g, b);
  }

  describe('achromatic colors (S <= 15 or V <= 20)', () => {
    test('should return black when V <= 20', () => {
      // Given: very dark color (V ≈ 10)
      // When
      const result = classify(25, 25, 25);

      // Then
      expect(result.key).toBe('black');
      expect(result.name).toBe('黒系');
    });

    test('should return black when pure black (0,0,0)', () => {
      const result = classify(0, 0, 0);

      expect(result.key).toBe('black');
    });

    test('should return white when S <= 15 and V > 80', () => {
      // Given: high value, low saturation
      const result = classify(255, 255, 255);

      // Then
      expect(result.key).toBe('white');
      expect(result.name).toBe('白系');
    });

    test('should return white when near-white (240, 240, 245)', () => {
      const result = classify(240, 240, 245);

      expect(result.key).toBe('white');
    });

    test('should return gray when S <= 15 and 20 < V <= 80', () => {
      // Given: mid-value, low saturation
      const result = classify(128, 128, 128);

      // Then
      expect(result.key).toBe('gray');
      expect(result.name).toBe('灰系');
    });

    test('should return gray when dark gray (60, 60, 60)', () => {
      const result = classify(60, 60, 60);

      expect(result.key).toBe('gray');
    });
  });

  describe('chromatic colors (S > 15 and V > 20)', () => {
    test('should return red when H: 0-10', () => {
      // Given: pure red
      const result = classify(255, 0, 0);

      // Then
      expect(result.key).toBe('red');
      expect(result.name).toBe('赤系');
    });

    test('should return red when H: 350-360', () => {
      // Given: reddish-pink (H ≈ 350)
      const result = classify(255, 0, 42);

      expect(result.key).toBe('red');
    });

    test('should return orange when H: 10-40', () => {
      // Given: orange (255, 165, 0) → H ≈ 39
      const result = classify(255, 165, 0);

      // Then
      expect(result.key).toBe('orange');
      expect(result.name).toBe('橙系');
    });

    test('should return yellow when H: 40-70', () => {
      // Given: yellow
      const result = classify(255, 255, 0);

      // Then
      expect(result.key).toBe('yellow');
      expect(result.name).toBe('黄系');
    });

    test('should return green when H: 70-170', () => {
      // Given: pure green (H = 120)
      const result = classify(0, 255, 0);

      // Then
      expect(result.key).toBe('green');
      expect(result.name).toBe('緑系');
    });

    test('should return green when teal (H ≈ 170)', () => {
      // Given: teal-ish green at boundary
      const result = classify(0, 200, 180);

      expect(result.key).toBe('green');
    });

    test('should return blue when H: 170-260', () => {
      // Given: pure blue (H = 240)
      const result = classify(0, 0, 255);

      // Then
      expect(result.key).toBe('blue');
      expect(result.name).toBe('青系');
    });

    test('should return blue when cyan (H = 180)', () => {
      const result = classify(0, 255, 255);

      expect(result.key).toBe('blue');
    });

    test('should return purple when H: 260-350', () => {
      // Given: magenta (H = 300)
      const result = classify(255, 0, 255);

      // Then
      expect(result.key).toBe('purple');
      expect(result.name).toBe('紫系');
    });

    test('should return purple when violet (H ≈ 270)', () => {
      const result = classify(128, 0, 255);

      expect(result.key).toBe('purple');
    });
  });

  describe('boundary: achromatic vs chromatic priority', () => {
    test('should prioritize black over hue when V <= 20', () => {
      // Given: very dark red (V ≈ 20, has hue but too dark)
      const result = classify(51, 0, 0);

      expect(result.key).toBe('black');
    });

    test('should prioritize white over hue when S <= 15 and V > 80', () => {
      // Given: very light blue-ish (nearly white, slight tint)
      const result = classify(220, 220, 230);

      expect(result.key).toBe('white');
    });

    test('should prioritize gray over hue when S <= 15 and 20 < V <= 80', () => {
      // Given: grayish with slight tint
      const result = classify(130, 128, 128);

      expect(result.key).toBe('gray');
    });
  });

  describe('hue boundary edge cases', () => {
    test('should classify H=10 boundary correctly between red and orange', () => {
      // Given: H exactly at boundary (~10)
      // RGB that produces H ≈ 10: (255, 43, 0)
      const result = classify(255, 43, 0);

      // At boundary, should be either red or orange (implementation decides)
      expect(['red', 'orange']).toContain(result.key);
    });

    test('should classify H=350 boundary correctly between purple and red', () => {
      // Given: H ≈ 350
      const result = classify(255, 0, 43);

      expect(['red', 'purple']).toContain(result.key);
    });
  });

  describe('return value structure', () => {
    test('should return object with name and key properties', () => {
      const result = classify(255, 0, 0);

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('key');
      expect(typeof result.name).toBe('string');
      expect(typeof result.key).toBe('string');
    });
  });
});

describe('FH.ColorClassifier.CATEGORIES', () => {
  test('should expose all 9 categories', () => {
    const categories = FH.ColorClassifier.CATEGORIES;

    expect(categories).toBeInstanceOf(Array);
    expect(categories.length).toBe(9);
  });

  test('should contain all expected category keys', () => {
    const keys = FH.ColorClassifier.CATEGORIES.map(function (c) { return c.key; });

    expect(keys).toContain('black');
    expect(keys).toContain('white');
    expect(keys).toContain('gray');
    expect(keys).toContain('red');
    expect(keys).toContain('orange');
    expect(keys).toContain('yellow');
    expect(keys).toContain('green');
    expect(keys).toContain('blue');
    expect(keys).toContain('purple');
  });

  test('should have name property on each category', () => {
    FH.ColorClassifier.CATEGORIES.forEach(function (cat) {
      expect(typeof cat.name).toBe('string');
      expect(cat.name.length).toBeGreaterThan(0);
    });
  });
});
