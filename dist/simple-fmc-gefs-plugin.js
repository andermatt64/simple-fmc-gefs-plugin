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

  init: function () {
    
  }
};

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

/*
 * Initial entry point
 */

(function () {
  'use strict';

  var fmcInit = function () {
    SimpleFMC.init();
    UI.init();
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
 * Implements the status panel
 */

var Status = {

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
      .css('border-bottom', this.FmcHeight + ' solid transparent');

    var fmcPanel = $('.gefs-autopilot');
    fmcPanel
      .empty()
      .css('height', this.FmcHeight)
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

    this.infoContainer = $('<div></div>');
    this.infoContainer
      .css('padding', '5px');

    this.statusContainer = $('<div></div>');
    this.statusContainer
      .css('padding', '5px');

    this.apsContainer = $('<div></div>');
    this.apsContainer
      .css('padding', '5px');

    this.routeContainer = $('<div></div>');
    this.routeContainer
      .css('padding', '5px');

    this.logContainer = $('<div></div>');
    this.logContainer
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

    containerPanel.append(this.infoContainer);

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
    return ((radians * (180 / Math.PI)) + 360) % 360;
  },

  getGreatCircleBearing: function (x, y) {
    var latx = Utils.toRadians(x.lat);
    var lonx = Utils.toRadians(x.lon);
    var laty = Utils.toRadians(y.lat);
    var lony = Utils.toRadians(y.lon);

    var b = Math.sin(lony - lonx) * Math.cos(laty);
    var a = Math.cos(latx) * Math.sin(laty) -
            Math.sin(latx) * Math.cos(laty) * Math.cos(lony - lonx);
    var hdg = Math.atan2(b, a);
    return Utils.toDegrees(hdg);
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
