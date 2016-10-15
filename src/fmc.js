/*
 * Implements the main Simple FMC functionality
 *
 * TIPS: Make sure Mix Yaw/Roll is off and Exponential is set to 0.0
 */

var SimpleFMC = {
  timerID: null,

  init: function () {
      this.timerID = setInterval(SimpleFMC.backgroundUpdate, 1000);
  },

  backgroundUpdate: function () {

  },

  fini: function () {
    if (this.timerID !== null) {
      clearInterval(this.timerID);
    }
  }
};
