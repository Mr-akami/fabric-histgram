import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..');

/**
 * IIFE形式のJSファイルをjsdom環境のwindowで実行し、FH名前空間を返す。
 * scriptタグ読み込みのシミュレーション。
 */
export function loadScript(relativePath) {
  const fullPath = resolve(PROJECT_ROOT, relativePath);
  const code = readFileSync(fullPath, 'utf-8');
  const fn = new Function('window', 'document', code);
  fn(globalThis.window, globalThis.document);
}

export function loadModules(paths) {
  for (const p of paths) {
    loadScript(p);
  }
}
