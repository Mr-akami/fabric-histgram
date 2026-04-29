(function (FH) {
  'use strict';

  var panel;
  var charts = [];
  var visible = false;

  var CHART_CONFIGS = [
    { key: 'r', label: 'Red', color: 'rgba(255, 99, 132, 0.7)' },
    { key: 'g', label: 'Green', color: 'rgba(75, 192, 192, 0.7)' },
    { key: 'b', label: 'Blue', color: 'rgba(54, 162, 235, 0.7)' },
    { key: 'luminance', label: 'Luminance', color: 'rgba(201, 203, 207, 0.7)' },
  ];

  function createLabels() {
    var labels = [];
    for (var i = 0; i < 256; i++) {
      labels.push(i);
    }
    return labels;
  }

  function createChart(canvasEl, label, color, data) {
    return new Chart(canvasEl, {
      type: 'bar',
      data: {
        labels: createLabels(),
        datasets: [{
          label: label,
          data: data,
          backgroundColor: color,
          borderWidth: 0,
          barPercentage: 1.0,
          categoryPercentage: 1.0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            display: true,
            ticks: { maxTicksLimit: 10, color: '#999' },
            grid: { display: false },
          },
          y: {
            display: true,
            ticks: { maxTicksLimit: 5, color: '#999' },
            grid: { color: 'rgba(255,255,255,0.1)' },
          },
        },
      },
    });
  }

  /**
   * @param {HTMLElement} panelEl - floating panel container
   * @param {HTMLButtonElement} toggleBtn - toggle visibility button
   */
  function init(panelEl, toggleBtn) {
    panel = panelEl;

    toggleBtn.addEventListener('click', function () {
      visible = !visible;
      panel.style.display = visible ? 'block' : 'none';
    });
  }

  /** @param {{ r: number[], g: number[], b: number[], luminance: number[] }} histData */
  function render(histData) {
    for (var i = 0; i < charts.length; i++) {
      charts[i].destroy();
    }
    charts = [];

    panel.innerHTML = '<h3>ヒストグラム</h3>';

    for (var j = 0; j < CHART_CONFIGS.length; j++) {
      var cfg = CHART_CONFIGS[j];
      var wrapper = document.createElement('div');
      wrapper.className = 'histogram-chart-wrapper';

      var title = document.createElement('span');
      title.className = 'histogram-chart-title';
      title.textContent = cfg.label;
      wrapper.appendChild(title);

      var canvas = document.createElement('canvas');
      wrapper.appendChild(canvas);
      panel.appendChild(wrapper);

      var chart = createChart(canvas, cfg.label, cfg.color, histData[cfg.key]);
      charts.push(chart);
    }
  }

  FH.HistogramPanel = {
    init: init,
    render: render,
  };
})(window.FH);
