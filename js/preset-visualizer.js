(function (FH) {
  'use strict';

  function thetaToHue(theta) {
    var h = -theta * 180 / Math.PI;
    return ((h % 360) + 360) % 360;
  }

  function hueInRange(h, hMin, hMax) {
    if (hMin <= hMax) return h >= hMin && h <= hMax;
    return h >= hMin || h <= hMax;
  }

  function hexToRgb(hex) {
    if (typeof hex !== 'string') return { r: 200, g: 200, b: 200 };
    var m = /^#([0-9a-fA-F]{6})$/.exec(hex);
    if (!m) return { r: 200, g: 200, b: 200 };
    var n = parseInt(m[1], 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
  }

  function blend(base, over, alpha) {
    return Math.round(base * (1 - alpha) + over * alpha);
  }

  /**
   * Draw HSV color wheel (H=angle, S=radius) with category range overlays.
   * @param {HTMLCanvasElement} canvas
   * @param {Array} categories - chromatic HSV-mode categories
   */
  function drawWheel(canvas, categories) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var cx = W / 2, cy = H / 2;
    var R = Math.min(cx, cy) - 2;

    var img = ctx.createImageData(W, H);
    var data = img.data;
    var hsvToRgb = FH.ColorConverter.hsvToRgb;

    // Pre-compute category overlay colors
    var overlays = [];
    for (var k = 0; k < categories.length; k++) {
      var c = categories[k];
      if (c.kind !== 'chromatic' || c.rangeMode === 'rgb') continue;
      var oc = hexToRgb(c.displayColor);
      overlays.push({ cat: c, r: oc.r, g: oc.g, b: oc.b });
    }

    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var dx = x - cx;
        var dy = y - cy;
        var rr = Math.sqrt(dx * dx + dy * dy);
        var idx = (y * W + x) * 4;
        if (rr > R) {
          data[idx + 3] = 0;
          continue;
        }
        var theta = Math.atan2(dy, dx);
        var h = thetaToHue(theta);
        var s = (rr / R) * 100;
        var base = hsvToRgb(h, s, 100);
        var br = base.r, bg = base.g, bb = base.b;

        for (var i = 0; i < overlays.length; i++) {
          var ov = overlays[i];
          var p = ov.cat;
          if (s >= p.sMin && s <= p.sMax && hueInRange(h, p.hMin, p.hMax)) {
            br = blend(br, ov.r, 0.45);
            bg = blend(bg, ov.g, 0.45);
            bb = blend(bb, ov.b, 0.45);
          }
        }

        data[idx]     = br;
        data[idx + 1] = bg;
        data[idx + 2] = bb;
        data[idx + 3] = 255;
      }
    }

    ctx.clearRect(0, 0, W, H);
    ctx.putImageData(img, 0, 0);

    // Outline circle
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Vertical V (value) bar with category vMin..vMax markers.
   */
  function drawVBar(canvas, categories) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Gradient (top=white V=100, bottom=black V=0 — but typical: top=full, bottom=zero)
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < categories.length; i++) {
      var c = categories[i];
      if (c.kind !== 'chromatic' || c.rangeMode === 'rgb') continue;
      var yMax = (1 - c.vMin / 100) * H;
      var yMin = (1 - c.vMax / 100) * H;
      ctx.fillStyle = c.displayColor + '80'; // 50% alpha
      ctx.fillRect(W * 0.15, yMin, W * 0.7, yMax - yMin);
      ctx.strokeStyle = c.displayColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(W * 0.15, yMin, W * 0.7, yMax - yMin);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }

  /**
   * Horizontal RGB channel bar (0..255 -> black..pure channel).
   * @param {string} channel 'r' | 'g' | 'b'
   */
  function drawRgbChannel(canvas, channel, categories) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    var pure = channel === 'r' ? '#ff0000' : channel === 'g' ? '#00ff00' : '#0000ff';
    var grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#000');
    grad.addColorStop(1, pure);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    var minKey = channel + 'Min';
    var maxKey = channel + 'Max';

    for (var i = 0; i < categories.length; i++) {
      var c = categories[i];
      if (c.kind !== 'chromatic' || c.rangeMode !== 'rgb') continue;
      var x1 = (c[minKey] / 255) * W;
      var x2 = (c[maxKey] / 255) * W;
      ctx.fillStyle = c.displayColor + '80';
      ctx.fillRect(x1, H * 0.15, x2 - x1, H * 0.7);
      ctx.strokeStyle = c.displayColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x1, H * 0.15, x2 - x1, H * 0.7);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }

  /**
   * Inline single-row hue bar showing one preset's H range.
   */
  function drawInlineHueBar(canvas, p) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Rainbow gradient via segment fills
    var hsvToRgb = FH.ColorConverter.hsvToRgb;
    var img = ctx.createImageData(W, H);
    var data = img.data;
    for (var x = 0; x < W; x++) {
      var h = (x / W) * 360;
      var rgb = hsvToRgb(h, 100, 100);
      for (var y = 0; y < H; y++) {
        var idx = (y * W + x) * 4;
        data[idx] = rgb.r;
        data[idx + 1] = rgb.g;
        data[idx + 2] = rgb.b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    if (p.kind === 'chromatic' && p.rangeMode !== 'rgb') {
      var x1 = (p.hMin / 360) * W;
      var x2 = (p.hMax / 360) * W;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      if (p.hMin <= p.hMax) {
        ctx.strokeRect(x1, 1, x2 - x1, H - 2);
      } else {
        ctx.strokeRect(x1, 1, W - x1, H - 2);
        ctx.strokeRect(0, 1, x2, H - 2);
      }
    }
  }

  /**
   * Inline RGB triplet bars: 3 stacked thin bars for r/g/b ranges.
   */
  function drawInlineRgbBar(canvas, p) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    var rowH = H / 3;
    var channels = ['r', 'g', 'b'];
    var pure = ['#ff4444', '#44ff44', '#4488ff'];
    for (var i = 0; i < 3; i++) {
      var y = i * rowH;
      var grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, '#000');
      grad.addColorStop(1, pure[i]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, W, rowH - 1);

      if (p.kind === 'chromatic' && p.rangeMode === 'rgb') {
        var lo = p[channels[i] + 'Min'] || 0;
        var hi = p[channels[i] + 'Max'] || 255;
        var x1 = (lo / 255) * W;
        var x2 = (hi / 255) * W;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x1, y + 1, x2 - x1, rowH - 3);
      }
    }
  }

  FH.PresetVisualizer = {
    drawWheel: drawWheel,
    drawVBar: drawVBar,
    drawRgbChannel: drawRgbChannel,
    drawInlineHueBar: drawInlineHueBar,
    drawInlineRgbBar: drawInlineRgbBar,
  };
})(window.FH);
