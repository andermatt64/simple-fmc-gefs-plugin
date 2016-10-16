/*
 * Initial entry point
 */

(function () {
  'use strict';

  var fmcInit = function () {
    UI.init();
    SimpleFMC.init();
  };

  var initTimer = setInterval(function () {
    if (!window.gefs || !gefs.init) {
      return;
    }

    clearInterval(initTimer);

    if (gefs.canvas) {
      fmcInit();
    } else {
      var gefsInit = gefs.init;

      gefs.init = function () {
        gefsInit();
        fmcInit();
      };
    }
  }, 16);
})();
