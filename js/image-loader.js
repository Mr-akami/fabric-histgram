(function (FH) {
  'use strict';

  /**
   * @param {File} file
   * @param {function} callback - called with loaded HTMLImageElement
   */
  function loadImageFromFile(file, callback) {
    var reader = new FileReader();
    reader.addEventListener('load', function () {
      var img = new Image();
      img.addEventListener('load', function () {
        callback(img);
      });
      img.src = reader.result;
    });
    reader.readAsDataURL(file);
  }

  /**
   * @param {HTMLInputElement} fileInput
   * @param {HTMLElement} dropZone
   * @param {function} callback - called with loaded HTMLImageElement
   */
  function init(fileInput, dropZone, callback) {
    fileInput.addEventListener('change', function () {
      if (!fileInput.files || fileInput.files.length === 0) {
        return;
      }
      loadImageFromFile(fileInput.files[0], callback);
    });

    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
    });

    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      var files = e.dataTransfer.files;
      if (!files || files.length === 0) {
        return;
      }
      loadImageFromFile(files[0], callback);
    });
  }

  FH.ImageLoader = {
    init: init,
  };
})(window.FH);
