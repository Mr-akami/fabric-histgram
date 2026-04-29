(function (FH) {
  'use strict';

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLElement} infoPanel - contains [data-info] elements
   */
  function init(canvas, infoPanel) {
    var rgbEl = infoPanel.querySelector('[data-info="rgb"]');
    var hsvEl = infoPanel.querySelector('[data-info="hsv"]');
    var hexEl = infoPanel.querySelector('[data-info="hex"]');
    var coordsEl = infoPanel.querySelector('[data-info="coords"]');

    canvas.addEventListener('click', function (e) {
      var pixel = FH.CanvasRenderer.getPixelAt(e.offsetX, e.offsetY);
      var hsv = FH.ColorConverter.rgbToHsv(pixel.r, pixel.g, pixel.b);
      var hex = FH.ColorConverter.rgbToHex(pixel.r, pixel.g, pixel.b);

      rgbEl.textContent = 'R: ' + pixel.r + ', G: ' + pixel.g + ', B: ' + pixel.b;
      hsvEl.textContent = 'H: ' + hsv.h + '°, S: ' + hsv.s + '%, V: ' + hsv.v + '%';
      hexEl.textContent = hex;
      coordsEl.textContent = '(' + pixel.x + ', ' + pixel.y + ')';
    });
  }

  FH.PixelInspector = {
    init: init,
  };
})(window.FH);
