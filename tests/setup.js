// Canvas 2D context polyfill for jsdom
// jsdom does not implement getContext('2d') without the native canvas package.
HTMLCanvasElement.prototype.getContext = (function (original) {
  return function (type) {
    if (type === '2d') {
      if (!this._mockCtx) {
        this._mockCtx = {
          drawImage: function () {},
          getImageData: function (sx, sy, sw, sh) {
            var w = sw || 1;
            var h = sh || 1;
            return {
              data: new Uint8ClampedArray(w * h * 4),
              width: w,
              height: h,
            };
          },
          createImageData: function (w, h) {
            return {
              data: new Uint8ClampedArray((w || 1) * (h || 1) * 4),
              width: w || 1,
              height: h || 1,
            };
          },
          putImageData: function () {},
          clearRect: function () {},
          fillRect: function () {},
        };
      }
      return this._mockCtx;
    }
    return original ? original.call(this, type) : null;
  };
})(HTMLCanvasElement.prototype.getContext);

// MouseEvent polyfill for jsdom
// jsdom computes offsetX/offsetY from clientX/clientY relative to element position.
// It does not accept offsetX/offsetY as MouseEventInit properties.
// Patch so tests can pass { offsetX, offsetY } in the constructor.
var OriginalMouseEvent = MouseEvent;
window.MouseEvent = function (type, init) {
  var event = new OriginalMouseEvent(type, init);
  if (init) {
    if ('offsetX' in init) {
      Object.defineProperty(event, 'offsetX', { value: init.offsetX });
    }
    if ('offsetY' in init) {
      Object.defineProperty(event, 'offsetY', { value: init.offsetY });
    }
  }
  return event;
};
window.MouseEvent.prototype = OriginalMouseEvent.prototype;
