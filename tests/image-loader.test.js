import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import { loadScript } from './helpers/load-script.js';

beforeAll(() => {
  window.FH = {};
  loadScript('js/image-loader.js');
});

function createFileInput() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/gif,image/bmp';
  return input;
}

function createDropZone() {
  return document.createElement('div');
}

function createImageFile(name, type) {
  return new File(['dummy'], name, { type });
}

describe('FH.ImageLoader.init', () => {
  test('should register change event listener on file input', () => {
    const fileInput = createFileInput();
    const dropZone = createDropZone();
    const callback = vi.fn();
    const addEventSpy = vi.spyOn(fileInput, 'addEventListener');

    FH.ImageLoader.init(fileInput, dropZone, callback);

    expect(addEventSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  test('should register dragover event listener on drop zone', () => {
    const fileInput = createFileInput();
    const dropZone = createDropZone();
    const callback = vi.fn();
    const addEventSpy = vi.spyOn(dropZone, 'addEventListener');

    FH.ImageLoader.init(fileInput, dropZone, callback);

    expect(addEventSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
  });

  test('should register drop event listener on drop zone', () => {
    const fileInput = createFileInput();
    const dropZone = createDropZone();
    const callback = vi.fn();
    const addEventSpy = vi.spyOn(dropZone, 'addEventListener');

    FH.ImageLoader.init(fileInput, dropZone, callback);

    expect(addEventSpy).toHaveBeenCalledWith('drop', expect.any(Function));
  });
});

describe('dragover event handling', () => {
  test('should call preventDefault on dragover to allow drop', () => {
    const fileInput = createFileInput();
    const dropZone = createDropZone();
    const callback = vi.fn();

    FH.ImageLoader.init(fileInput, dropZone, callback);

    const dragoverEvent = new Event('dragover', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(dragoverEvent, 'preventDefault');
    dropZone.dispatchEvent(dragoverEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});

describe('file input change event', () => {
  test('should not call callback when no file is selected', () => {
    const fileInput = createFileInput();
    const dropZone = createDropZone();
    const callback = vi.fn();

    FH.ImageLoader.init(fileInput, dropZone, callback);

    Object.defineProperty(fileInput, 'files', { value: [], configurable: true });
    fileInput.dispatchEvent(new Event('change'));

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('drop event handling', () => {
  test('should call preventDefault on drop event', () => {
    const fileInput = createFileInput();
    const dropZone = createDropZone();
    const callback = vi.fn();

    FH.ImageLoader.init(fileInput, dropZone, callback);

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [] },
    });
    const preventDefaultSpy = vi.spyOn(dropEvent, 'preventDefault');
    dropZone.dispatchEvent(dropEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  test('should not call callback when no files are dropped', () => {
    const fileInput = createFileInput();
    const dropZone = createDropZone();
    const callback = vi.fn();

    FH.ImageLoader.init(fileInput, dropZone, callback);

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [] },
    });
    dropZone.dispatchEvent(dropEvent);

    expect(callback).not.toHaveBeenCalled();
  });
});
