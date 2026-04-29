(function (FH) {
  'use strict';

  var currentCanvas = null;
  var currentCtx = null;
  var originalImageData = null;
  var highlightedKey = null;

  /**
   * Render image onto canvas at original resolution.
   * CSS handles display scaling; canvas stores full-res pixel data.
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLImageElement} image
   */
  function render(canvas, image) {
    currentCanvas = canvas;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    currentCtx = canvas.getContext('2d');
    currentCtx.drawImage(image, 0, 0);
    originalImageData = currentCtx.getImageData(0, 0, canvas.width, canvas.height);
    highlightedKey = null;
  }

  /**
   * Get pixel color and original coordinates from display coordinates.
   * Reads from the cached original image so highlight overlays don't affect inspection.
   */
  function getPixelAt(displayX, displayY) {
    var scaleX = currentCanvas.width / currentCanvas.clientWidth;
    var scaleY = currentCanvas.height / currentCanvas.clientHeight;
    var x = Math.floor(displayX * scaleX);
    var y = Math.floor(displayY * scaleY);

    if (originalImageData) {
      var w = originalImageData.width;
      var idx = (y * w + x) * 4;
      var d = originalImageData.data;
      return { r: d[idx], g: d[idx + 1], b: d[idx + 2], x: x, y: y };
    }

    var imageData = currentCtx.getImageData(x, y, 1, 1);
    return {
      r: imageData.data[0],
      g: imageData.data[1],
      b: imageData.data[2],
      x: x,
      y: y,
    };
  }

  function getFullImageData() {
    if (originalImageData) return originalImageData;
    return currentCtx.getImageData(0, 0, currentCanvas.width, currentCanvas.height);
  }

  function highlightCategory(catKey) {
    if (!originalImageData || !currentCtx) return;
    if (highlightedKey === catKey) {
      clearHighlight();
      return;
    }
    highlightedKey = catKey;
    var src = originalImageData.data;
    var w = originalImageData.width;
    var h = originalImageData.height;
    var out = currentCtx.createImageData(w, h);
    var dst = out.data;
    for (var i = 0; i < src.length; i += 4) {
      var r = src[i], g = src[i + 1], b = src[i + 2];
      var cat = FH.ColorClassifier.classify(r, g, b);
      if (cat.key === catKey) {
        dst[i] = r; dst[i + 1] = g; dst[i + 2] = b; dst[i + 3] = 255;
      } else {
        dst[i]     = (r * 38) >> 8;
        dst[i + 1] = (g * 38) >> 8;
        dst[i + 2] = (b * 38) >> 8;
        dst[i + 3] = 255;
      }
    }
    currentCtx.putImageData(out, 0, 0);
  }

  function clearHighlight() {
    if (!originalImageData || !currentCtx) return;
    highlightedKey = null;
    currentCtx.putImageData(originalImageData, 0, 0);
  }

  function getHighlightedKey() {
    return highlightedKey;
  }

  FH.CanvasRenderer = {
    render: render,
    getPixelAt: getPixelAt,
    getFullImageData: getFullImageData,
    highlightCategory: highlightCategory,
    clearHighlight: clearHighlight,
    getHighlightedKey: getHighlightedKey,
  };
})(window.FH);
