/*
 * Initial entry point
 */

(function () {
  'use strict';

  var initTimer = setInterval(function () {
    if (!window.gefs || !gefs.init) {
      return;
    }

    clearInterval(initTimer);

    if (gefs.canvas) {
      // TODO: call our initialization code
    } else {
      var gefsInit = gefs.init;

      gefs.init = function () {
        gefsInit();

        // TODO: call our initialization code
      };
    }
  }, 16);
})();
