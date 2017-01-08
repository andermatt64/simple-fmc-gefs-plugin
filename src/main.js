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
    if (!GEFS.isLoadedIntoNamespace()) {
      return;
    }

    clearInterval(initTimer);

    if (GEFS.getCanvas()) {
      fmcInit();
    } else {
      var gefsInit = GEFS.getInitFunction();

      GEFS.setInitFunction(function () {
        gefsInit();
        fmcInit();
      });
    }
  }, 16);
})();
