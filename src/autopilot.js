/*
 * Implements autopilot system functionality
 */

var APS = {
  // Valid modes:
  //   hold  -> holding on a specific altitude/heading/speed
  //   route -> follows a established route
  //   holdp -> holding pattern
  mode: 'hold',

  content: null,

  init: function (content) {
    APS.content = content;

    
  }
};
