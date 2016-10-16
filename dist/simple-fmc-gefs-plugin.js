// ==UserScript==
// @name        simple-fmc-gefs-plugin
// @namespace   andermatt64-gefs-plugins
// @version     0.0.1
// @description Simple FMC GEFS Plugin
// @author      andermatt64
// @match       http://*.gefs-online.com/gefs.php
// @grant       none
// ==/UserScript==

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

/*
 * Implements the main Simple FMC functionality
 *
 * TIPS: Make sure Mix Yaw/Roll is off and Exponential is set to 0.0
 */

var SimpleFMC = {
  timerID: null,
  updateFnList: [],

  init: function () {
    Log.init(UI.logContainer);
    Status.init(UI.statusContainer);
    APS.init(UI.apsContainer);
    Route.init(UI.routeContainer);
    Info.init(UI.infoContainer);

    SimpleFMC.timerID = setInterval(SimpleFMC.backgroundUpdate, 1000);
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

/*
 * Implements the info panel
 */

var Info = {
  content: null,

  init: function (content) {
    Info.content = null;

  }
};

/*
 * Implements the FMC log
 */

var Log = {
  content: null,

  init: function (content) {
    Log.content = content;
    Log.content
      .css('overflow-y', 'scroll')
      .css('overflow-x', 'auto')
      .css('line-height', '1.3')
      .css('height', '290px');
  },

  info: function (msg) {
    Log._write(Log._entry('#9be651', msg));
  },

  warning: function (msg) {
    Log._write(Log._entry('#ffc300', msg));
  },

  error: function (msg) {
    Log._write(Log._entry('#d14537', msg));
  },

  clear: function () {
    Log.content.empty();
  },

  _entry: function (color, msg) {
    var entry = $('<div></div>');
    entry
      .css('color', color)
      .text(msg);
    return entry;
  },

  _write: function (entry) {
    Log.content.prepend(entry);
  }
};

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

/*
 * Implements the route panel
 */

var Route = {
  content: null,

  init: function (content) {
    Route.content = content;
  }
};

/*
 * Implements the status panel
 */

 var makeStatusPanel = function () {
   var panel = $('<div></div>');
   panel
     .css('width', '25%')
     .css('height', '100px')
     .css('float', 'left');
   return panel;
 };

var Throttle = {
  _panel: null,
  _fill: null,
  _label: null,
  _meter: null,

  init: function (content) {
    Throttle._panel = makeStatusPanel();

    Throttle._meter = $('<div></div>');
    Throttle._meter
      .css('margin-top', '5px')
      .css('margin-bottom', '5px')
      .css('margin-left', '5px')
      .css('border', '1px solid #0f0')
      .css('width', '10px')
      .css('height', '80px')
      .css('background', '#0f0')
      .css('float', 'left');

    Throttle._fill = $('<div></div>');
    Throttle._fill
      .css('background', '#000')
      .css('height', '100%');

    var caption = $('<div></div>');
    caption
      .css('padding-top', '5px')
      .css('padding-left', '5px')
      .css('color', '#0f0')
      .css('float', 'left');

    Throttle._label = $('<span></span>');

    caption
      .text('THROT')
      .append($('<br>'))
      .append(Throttle._label);
    Throttle._meter
      .append(Throttle._fill);
    Throttle._panel
      .append(Throttle._meter)
      .append(caption);

    content.append(Throttle._panel);
  },

  update: function (value) {
    var percent = parseInt(value * 100);
    Throttle._fill
      .css('height', (100 - Math.abs(percent)).toString() + '%');

    if (percent < 0) {
      percent = -percent;
      Throttle._meter
        .css('background', '#ff8400');
      Throttle._label
        .css('color', '#ff8400');
    } else {
      Throttle._meter
        .css('background', '#0f0');
      Throttle._label
        .css('color', '#0f0');
    }
    var val = percent.toString();
    if (val.length === 1) {
      val = '00' + val;
    } else if (val.length === 2) {
      val = '0' + val;
    }

    Throttle._label
      .text(val + '/100');
  },
};

var Status = {
  content: null,

  init: function (content) {
    Status.content = content;

    Throttle.init(content);

    SimpleFMC.registerUpdate(function () {
      Throttle.update(gefs.aircraft.animationValue.throttle);
    });
  }
};

/*
 * Implements the SimpleFMC UI
 */

var UI = {
  // Height of the FMC div
  FmcHeight: '300px',

  infoContainer: null,
  statusContainer: null,
  apsContainer: null,
  routeContainer: null,
  logContainer: null,

  init: function () {
    $('.gefs-map-list')
      .css('border-bottom', UI.FmcHeight + ' solid transparent');

    var fmcPanel = $('.gefs-autopilot');
    fmcPanel
      .empty()
      .css('height', UI.FmcHeight)
      .css('font-family', 'Lucida Console, Monaco, monospace')
      .css('font-size', '9pt')
      .css('padding', '0 0 0 0');

    var makeButton = function (name, isBottomButton) {
      var btn = $('<button></button>');
      btn
        .text(name)
        .css('width', '100%')
        .css('font-family', 'Lucida Console, Monaco, monospace')
        .css('font-weight', 'bold')
        .css('font-size', '8pt')
        .css('text-align', 'left')
        .css('transition-duration', '0.4s')
        .css('border-top', '1px solid #000')
        .css('border-left', '1px solid #000');

      if (isBottomButton !== undefined && isBottomButton) {
        btn
          .css('border-bottom', '1px solid #000');
      }

      return btn;
    };

    var buttonPanel = $('<div></div>');
    buttonPanel
      .css('float', 'left')
      .css('width', '10%')
      .css('margin-right', '0px')
      .css('padding-right', '0px');

    var containerPanel = $('<div></div>');
    containerPanel
      .css('float', 'left')
      .css('background', '#000')
      .css('color', '#0f0')
      .css('width', '90%')
      .css('height', '300px')
      .css('margin-right', '0px')
      .css('padding-right', '0px');

    UI.infoContainer = $('<div></div>');
    UI.infoContainer
      .css('padding', '5px');

    UI.statusContainer = $('<div></div>');
    UI.statusContainer
      .css('padding', '5px');

    UI.apsContainer = $('<div></div>');
    UI.apsContainer
      .css('padding', '5px');

    UI.routeContainer = $('<div></div>');
    UI.routeContainer
      .css('padding', '5px');

    UI.logContainer = $('<div></div>');
    UI.logContainer
      .css('padding', '5px');

    var infoButton = makeButton('INFO');
    infoButton.click(function () {
      containerPanel.empty();
      containerPanel.append(UI.infoContainer);
    });

    var statusButton = makeButton('STAT');
    statusButton.click(function () {
      containerPanel.empty();
      containerPanel.append(UI.statusContainer);
    });

    var apsButton = makeButton('APS');
    apsButton.click(function () {
      containerPanel.empty();
      containerPanel.append(UI.apsContainer);
    });

    var routeButton = makeButton('RTE');
    routeButton.click(function () {
      containerPanel.empty();
      containerPanel.append(UI.routeContainer);
    });

    var logButton = makeButton('LOG', true);
    logButton.click(function () {
      containerPanel.empty();
      containerPanel.append(UI.logContainer);
    });

    containerPanel.append(UI.infoContainer);

    buttonPanel
      .append(infoButton)
      .append(statusButton)
      .append(apsButton)
      .append(routeButton)
      .append(logButton);

    fmcPanel
      .append(buttonPanel)
      .append(containerPanel);
  }
};

/*
 * Implements some util functions like calculating great circle bearing and distance
 */

var Utils = {
  toRadians: function (degrees) {
    return degrees * (Math.PI / 180);
  },

  toDegrees: function (radians) {
    return radians * (180 / Math.PI);
  },

  // Adopted from http://www.movable-type.co.uk/scripts/latlong.html
  getGreatCircleBearing: function (x, y) {
    var latx = Utils.toRadians(x.lat);
    var lonx = Utils.toRadians(x.lon);
    var laty = Utils.toRadians(y.lat);
    var lony = Utils.toRadians(y.lon);

    var b = Math.sin(lony - lonx) * Math.cos(laty);
    var a = Math.cos(latx) * Math.sin(laty) -
            Math.sin(latx) * Math.cos(laty) * Math.cos(lony - lonx);
    var hdg = Math.atan2(b, a);
    return (Utils.toDegrees(hdg) + 360) % 360;
  },

  // Adopted from http://www.movable-type.co.uk/scripts/latlong.html
  getGreatCircleDistance: function (x, y) {
    // Constant for meters
    var R = 6371e3;

    var latx = Utils.toRadians(x.lat);
    var laty = Utils.toRadians(y.lat);

    var dlat = Utils.toRadians(y.lat - x.lat);
    var dlon = Utils.toRadians(y.lon - x.lon);

    var a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
            Math.cos(latx) * Math.cos(laty) *
            Math.sin(dlon / 2) * Math.sin(dlon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d / 1000;
  }
};
