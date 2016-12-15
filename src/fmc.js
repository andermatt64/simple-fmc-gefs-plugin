/*
 * Implements the main Simple FMC functionality
 *
 * TIPS: Make sure Mix Yaw/Roll is off and Exponential is set to 0.0
 */

// Update interval
FMC_UPDATE_INTERVAL = 1000;

var SimpleFMC = {
  timerID: null,
  updateFnList: [],

  init: function () {
    Log.init(UI.logContainer);
    Status.init(UI.statusContainer);
    APS.init(UI.apsContainer);
    Route.init(UI.routeContainer);
    Info.init(UI.infoContainer);
    TerrainFix.init();

    SimpleFMC.timerID = setInterval(SimpleFMC.backgroundUpdate, FMC_UPDATE_INTERVAL);

    // Make sure nose steering/rudder works in mouse mode with mix yaw/roll off
    if (controls.mode === 'mouse' && !controls.mixYawRoll) {
        Log.info('Detected mouse mode with mixYawRoll off, applying fixes...');
        controls.yawExponential = '0.0';
    }

    Log.info('SimpleFMC initialized and ready to go.');
  },

  registerUpdate: function (updateFn) {
    SimpleFMC.updateFnList.push(updateFn);
  },

  backgroundUpdate: function () {
    for (var i = 0; i < SimpleFMC.updateFnList.length; i++) {
      SimpleFMC.updateFnList[i]();
    }
  },

  fini: function () {
    if (SimpleFMC.timerID !== null) {
      clearInterval(SimpleFMC.timerID);
    }
  }
};
