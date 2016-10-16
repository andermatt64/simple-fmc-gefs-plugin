/*
 * Implements autopilot system functionality
 */

var APS = {
  // Valid modes:
  //   HOLD  -> holding on a specific altitude/heading/speed
  //   ROUTE -> follows a established route
  //   HLDPT -> holding pattern
  mode: 'HOLD',

  content: null,

  init: function (content) {
    APS.content = content;


  }
};
