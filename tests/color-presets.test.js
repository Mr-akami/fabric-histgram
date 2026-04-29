import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { loadModules } from './helpers/load-script.js';

beforeAll(() => {
  window.FH = {};
  loadModules(['js/color-presets.js']);
});

beforeEach(() => {
  window.localStorage.clear();
  FH.ColorPresets._resetMemory();
});

describe('FH.ColorPresets', () => {
  describe('default seed', () => {
    test('seeds 9 defaults on first load', () => {
      const all = FH.ColorPresets.getStored();
      expect(all.length).toBe(9);
    });

    test('getAll appends OTHER fallback', () => {
      const all = FH.ColorPresets.getAll();
      expect(all.length).toBe(10);
      expect(all[all.length - 1].id).toBe(FH.ColorPresets.OTHER_ID);
    });

    test('persists defaults to localStorage', () => {
      FH.ColorPresets.getStored();
      const raw = window.localStorage.getItem(FH.ColorPresets.STORAGE_KEY);
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw).length).toBe(9);
    });

    test('contains all expected default keys', () => {
      const ids = FH.ColorPresets.getStored().map((p) => p.id);
      ['black', 'white', 'gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple']
        .forEach((id) => expect(ids).toContain(id));
    });
  });

  describe('add / update / remove (chromatic)', () => {
    test('add appends a new chromatic preset', () => {
      const before = FH.ColorPresets.getStored().length;
      const added = FH.ColorPresets.add({
        name: 'テスト',
        displayColor: '#abcdef',
        hMin: 100, hMax: 120,
        sMin: 20, sMax: 80,
        vMin: 30, vMax: 90,
      });
      expect(added.id).toBeTruthy();
      expect(FH.ColorPresets.getStored().length).toBe(before + 1);
      expect(added.kind).toBe('chromatic');
    });

    test('update mutates an existing preset and persists', () => {
      FH.ColorPresets.update('red', { name: '赤改', hMin: 340 });
      FH.ColorPresets._resetMemory();
      const p = FH.ColorPresets.getById('red');
      expect(p.name).toBe('赤改');
      expect(p.hMin).toBe(340);
    });

    test('remove deletes chromatic preset', () => {
      const removed = FH.ColorPresets.remove('red');
      expect(removed).toBe(true);
      expect(FH.ColorPresets.getById('red')).toBeNull();
    });

    test('clamps out-of-range numeric values', () => {
      const added = FH.ColorPresets.add({
        name: 'X', displayColor: '#fff',
        hMin: -10, hMax: 999,
        sMin: -5, sMax: 200,
        vMin: -1, vMax: 150,
      });
      expect(added.hMin).toBe(0);
      expect(added.hMax).toBe(360);
      expect(added.sMin).toBe(0);
      expect(added.sMax).toBe(100);
      expect(added.vMin).toBe(0);
      expect(added.vMax).toBe(100);
    });
  });

  describe('achromatic preset constraints', () => {
    test('update only changes name/displayColor on achromatic', () => {
      FH.ColorPresets.update('black', {
        name: '真っ黒',
        displayColor: '#111111',
        hMin: 999, // ignored
      });
      const p = FH.ColorPresets.getById('black');
      expect(p.name).toBe('真っ黒');
      expect(p.displayColor).toBe('#111111');
      expect(p.hMin).toBeUndefined();
    });

    test('remove rejects achromatic preset', () => {
      const ok = FH.ColorPresets.remove('black');
      expect(ok).toBe(false);
      expect(FH.ColorPresets.getById('black')).not.toBeNull();
    });

    test('expandRange rejects achromatic preset', () => {
      const ok = FH.ColorPresets.expandRange('black', 100, 50, 50);
      expect(ok).toBe(false);
    });
  });

  describe('OTHER preset', () => {
    test('cannot remove OTHER', () => {
      expect(FH.ColorPresets.remove('other')).toBe(false);
    });

    test('cannot update OTHER', () => {
      expect(FH.ColorPresets.update('other', { name: 'x' })).toBeNull();
    });
  });

  describe('matchHsv', () => {
    test('matches inside non-wrap range', () => {
      const orange = FH.ColorPresets.getById('orange');
      expect(FH.ColorPresets.matchHsv(orange, 25, 80, 80)).toBe(true);
      expect(FH.ColorPresets.matchHsv(orange, 5, 80, 80)).toBe(false);
    });

    test('matches inside wrap range (red 350..10)', () => {
      const red = FH.ColorPresets.getById('red');
      expect(FH.ColorPresets.matchHsv(red, 355, 80, 80)).toBe(true);
      expect(FH.ColorPresets.matchHsv(red, 5, 80, 80)).toBe(true);
      expect(FH.ColorPresets.matchHsv(red, 100, 80, 80)).toBe(false);
    });

    test('rejects when S/V outside range', () => {
      const added = FH.ColorPresets.add({
        name: 'x', displayColor: '#fff',
        hMin: 100, hMax: 120,
        sMin: 30, sMax: 60,
        vMin: 40, vMax: 70,
      });
      expect(FH.ColorPresets.matchHsv(added, 110, 50, 50)).toBe(true);
      expect(FH.ColorPresets.matchHsv(added, 110, 20, 50)).toBe(false);
      expect(FH.ColorPresets.matchHsv(added, 110, 50, 80)).toBe(false);
    });
  });

  describe('expandRange', () => {
    test('expands H min when h is below current range', () => {
      const before = FH.ColorPresets.getById('green'); // 70..175
      FH.ColorPresets.expandRange('green', 60, 50, 50);
      const after = FH.ColorPresets.getById('green');
      expect(after.hMin).toBe(60);
      expect(after.hMax).toBe(before.hMax);
    });

    test('expands S/V bounds', () => {
      FH.ColorPresets.update('green', { sMin: 30, sMax: 80, vMin: 30, vMax: 80 });
      FH.ColorPresets.expandRange('green', 100, 20, 90);
      const after = FH.ColorPresets.getById('green');
      expect(after.sMin).toBe(20);
      expect(after.vMax).toBe(90);
    });

    test('no-op if HSV already inside range', () => {
      const before = JSON.stringify(FH.ColorPresets.getById('green'));
      FH.ColorPresets.expandRange('green', 100, 50, 50);
      const after = JSON.stringify(FH.ColorPresets.getById('green'));
      expect(after).toBe(before);
    });
  });

  describe('reset', () => {
    test('reset restores defaults', () => {
      FH.ColorPresets.remove('red');
      FH.ColorPresets.reset();
      expect(FH.ColorPresets.getById('red')).not.toBeNull();
    });
  });

  describe('subscribe', () => {
    test('notifies listeners on add', () => {
      let count = 0;
      FH.ColorPresets.subscribe(() => count++);
      FH.ColorPresets.add({ name: 'a', displayColor: '#fff' });
      expect(count).toBe(1);
    });

    test('unsubscribe stops notifications', () => {
      let count = 0;
      const off = FH.ColorPresets.subscribe(() => count++);
      off();
      FH.ColorPresets.add({ name: 'a', displayColor: '#fff' });
      expect(count).toBe(0);
    });
  });

  describe('persistence', () => {
    test('reload picks up saved data', () => {
      FH.ColorPresets.add({
        name: 'persist', displayColor: '#abcdef',
        hMin: 50, hMax: 60, sMin: 0, sMax: 100, vMin: 0, vMax: 100,
      });
      FH.ColorPresets._resetMemory();
      const list = FH.ColorPresets.getStored();
      expect(list.some((p) => p.name === 'persist')).toBe(true);
    });
  });
});
