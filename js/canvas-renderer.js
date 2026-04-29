(function (FH) {
  'use strict';

  var currentCanvas = null;
  var currentCtx = null;

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
  }

  /**
   * Get pixel color and original coordinates from display coordinates.
   * @param {number} displayX
   * @param {number} displayY
   * @returns {{ r: number, g: number, b: number, x: number, y: number }}
   */
  function getPixelAt(displayX, displayY) {
    var scaleX = currentCanvas.width / currentCanvas.clientWidth;
    var scaleY = currentCanvas.height / currentCanvas.clientHeight;
    var x = Math.floor(displayX * scaleX);
    var y = Math.floor(displayY * scaleY);

    var imageData = currentCtx.getImageData(x, y, 1, 1);

    return {
      r: imageData.data[0],
      g: imageData.data[1],
      b: imageData.data[2],
      x: x,
      y: y,
    };
  }

  FH.CanvasRenderer = {
    render: render,
    getPixelAt: getPixelAt,
  };
})(window.FH);
