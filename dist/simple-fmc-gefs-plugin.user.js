// ==UserScript==
// @name        simple-fmc-gefs-plugin
// @namespace   andermatt64-gefs-plugins
// @version     0.0.1
// @description Simple FMC GEFS Plugin
// @author      andermatt64
// @require     https://raw.githubusercontent.com/andermatt64/simple-fmc-gefs-plugin/master/dist/simple-fmc-gefs-plugin-locations.min.js
// @match       http://*.gefs-online.com/gefs.php
// @grant       none
// ==/UserScript==

/*
 * Implements autopilot system functionality
 */

var APS = {
  // Valid modes:
  //   HDG -> holding on a specific altitude/heading/speed
  //   RTE -> follows a established route
  //   HPT -> holding pattern
  mode: 'HDG',

  content: null,

  apBtn: null,
  hdgBtn: null,
  rteBtn: null,
  hptBtn: null,

  hdrLabel: null,
  altLabel: null,
  iasLabel: null,

  nextLabel: null,
  distLabel: null,
  etaLabel: null,

  _holdPatternTicks: 0,
  _lastDistance: null,

  init: function (content) {
    APS.content = content;

    // https://jsfiddle.net/7zthavz0/7/

    var makeModeCell = function (btn) {
      var cell = $('<div></div>');
      cell
        .css('float', 'left')
        .css('width', 'calc(25% - 4px)')
        .css('height', '50px')
        .css('padding', '2px')
        .append(btn);
      return cell;
    };

    var makeModeBtn = function () {
        var btn = $('<button></button>');
        btn
          .css('width', '100%')
          .css('height', '50px')
          .css('background', '#000')
          .css('color', '#f00')
          .css('border', '1px solid #f00');
        return btn;
    };

    var makeThirdsCell = function (center) {
      var cell = $('<div></div>');
      cell
        .css('float', 'left')
        .css('width', 'calc(33.33333% - 4px)')
        .css('height', '50px')
        .css('padding', '2px');
      if (center !== undefined && center) {
        cell
          .css('text-align', 'center');
      }
      return cell;
    };

    var makeHR = function () {
      var rule = $('<div></div>');
      rule
        .css('float', 'left')
        .css('width', '100%')
        .css('height', '10px');
      return rule;
    };

    var makeInput = function (width) {
      var entry = $('<input></input>');
      entry
        .attr('type', 'text')
        .attr('size', width)
        .attr('maxlength', width)
        .css('background', '#000')
        .css('color', '#fff')
        .css('border', '0px')
        .css('font-family', '"Lucida Console", Monaco, monospace')
        .css('font-size', '10pt');
      return entry;
    };

    APS.apBtn = makeModeBtn();
    APS.apBtn
      .text('AUTOPILOT\nDISENGAGED')
      .click(function () {
        if (controls.autopilot.on) {
          APS.turnOff();
        } else {
          APS.turnOn();
        }
      });

    APS.hdgBtn = makeModeBtn();
    APS.rteBtn = makeModeBtn();
    APS.hptBtn = makeModeBtn();

    APS.hdgBtn
      .text('HDG')
      .css('color', '#0f0')
      .css('border', '1px solid #0f0')
      .click(function () {
        APS.hdgBtn
          .css('color', '#0f0')
          .css('border', '1px solid #0f0');
        APS.rteBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');
        APS.hptBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');

        // TODO
        APS.mode = 'HDG';
        APS.hdgLabel
          .prop('disabled', false);
      });

    APS.rteBtn
      .text('ROUTE')
      .click(function () {
        APS.rteBtn
          .css('color', '#0f0')
          .css('border', '1px solid #0f0');
        APS.hdgBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');
        APS.hptBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');

        // TODO
        APS.mode = 'RTE';
        APS.hdgLabel
          .prop('disabled', true);
      });

    APS.hptBtn
      .text('HLDPAT')
      .click(function () {
        APS.hptBtn
          .css('color', '#0f0')
          .css('border', '1px solid #0f0');
        APS.rteBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');
        APS.hdgBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');

        APS.mode = 'HPT';
        APS.hdgLabel
          .prop('disabled', true);

        controls.autopilot.setHeading((controls.autopilot.heading + 180) % 360);
        APS._holdPatternCoord = {
          lat: gefs.aircraft.llaLocation[0],
          lon: gefs.aircraft.llaLocation[1]
        };
        APS._holdPatternTicks = 0;
      });

    var hdgBox = makeThirdsCell(true);
    APS.hdgLabel = makeInput(3);
    APS.hdgLabel
      .click(function (event) {
        if (event.keyCode === 13) {
          APS.hdgLabel.blur();
        }
      })
      .blur(function () {
        if (controls.autopilot.on && APS.mode === 'HDG') {
          var newHdg = parseInt(APS.hdgLabel.val());
          if (!isNaN(newHdg) && newHdg >= 0 && newHdg <= 360) {
            controls.autopilot.setHeading(newHdg % 360);
          } else {
            APS.hdgLabel
              .val(parseInt(gefs.aircraft.animationValue.heading360));
          }
        }
      });
    hdgBox
      .text('HDG')
      .append($('<br>'))
      .append(APS.hdgLabel)
      .append('DEG');

    var altBox = makeThirdsCell(true);
    APS.altLabel = makeInput(5);
    APS.altLabel
      .click(function (event) {
        if (event.keyCode === 13) {
          APS.altLabel.blur();
        }
      })
      .blur(function () {
        if (controls.autopilot.on) {
          var newAlt = parseInt(APS.altLabel.val());
          if (!isNaN(newAlt)) {
            controls.autopilot.setAltitude(newAlt);
          } else {
            APS.altLabel
              .val(parseInt(gefs.aircraft.animationValue.altitude));
          }
        }
      });
    altBox
      .text('ALT')
      .append($('<br>'))
      .append(APS.altLabel)
      .append('FT');

    var iasBox = makeThirdsCell(true);
    APS.iasLabel = makeInput(3);
    APS.iasLabel
      .click(function (event) {
        if (event.keyCode === 13) {
          APS.iasLabel.blur();
        }
      })
      .blur(function () {
        if (controls.autopilot.on) {
          var newIas = parseInt(APS.iasLabel.val());
          if (!isNaN(newIas) && newIas > 0) {
            controls.autopilot.setKias(newIas);
          } else {
            APS.iasLabel
              .val(parseInt(gefs.aircraft.animationValue.kias));
          }
        }
      });
    iasBox
      .text('IAS')
      .append($('<br>'))
      .append(APS.iasLabel)
      .append('KTS');

    var nextBox = makeThirdsCell();
    APS.nextLabel = $('<span></span>');
    nextBox
      .text('NEXT WAYPT')
      .append($('<br>'))
      .append(APS.nextLabel);

    var distBox = makeThirdsCell();
    APS.distLabel = $('<span></span>');
    distBox
      .text('DIST')
      .append($('<br>'))
      .append(APS.distLabel);

    var etaBox = makeThirdsCell();
    APS.etaLabel = $('<span></span>');
    etaBox
      .text('ETA')
      .append($('<br>'))
      .append(APS.etaLabel);

    APS.content
      .append(makeModeCell(APS.apBtn))
      .append(makeModeCell(APS.hdgBtn))
      .append(makeModeCell(APS.rteBtn))
      .append(makeModeCell(APS.hptBtn))
      .append(makeHR())
      .append(hdgBox)
      .append(altBox)
      .append(iasBox)
      .append(makeHR())
      .append(nextBox)
      .append(distBox)
      .append(etaBox);

    // Set less aggressive autopilot constants
    var ap = controls.autopilot;
    ap.commonClimbrate = 500;
    ap.commonDescentrate = -750;
    ap.maxBankAngle = 20;
    ap.maxClimbrate = 2000;
    ap.maxDescentrate = -1800;
    ap.maxPitchAngle = 10;
    ap.minPitchAngle = -8;

    APS._hook();

    SimpleFMC.registerUpdate(APS.update);
  },

  turnOn: function () {
    if (!gefs.aircraft.setup.autopilot) {
      return;
    }

    var values = gefs.aircraft.animationValue;

    controls.autopilot.climbPID.reset();
  	controls.autopilot.pitchPID.reset();
  	controls.autopilot.rollPID.reset();
  	controls.autopilot.throttlePID.reset();

    if (APS.mode === 'HDG') {
      var newHdg = parseInt(APS.hdgLabel.val());
      if (!isNaN(newHdg) && newHdg >= 0 && newHdg <= 360) {
        controls.autopilot.setHeading(newHdg % 360);
      } else {
        newHdg = parseInt(gefs.aircraft.animationValue.heading360);
        var rollAngle = gefs.aircraft.animationValue.aroll;
        if (Math.abs(rollAngle) >= 1) {
          // Smoother transition into autopilot
          if (rollAngle > 0) {
            newHdg -= 8;
          } else {
            newHdg += 8;
          }
        }
        controls.autopilot.setHeading(newHdg);
        APS.hdgLabel
          .val(newHdg);
      }
    } else if (APS.mode === 'RTE') {
      if (RouteManager._currentWaypoint === null) {
        Log.info('Current waypoint is NULL, getting next waypoint');
        RouteManager.nextWaypoint();
      }

      var waypt = RouteManager._currentWaypoint;
      var loc = {
        lat: gefs.aircraft.llaLocation[0],
        lon: gefs.aircraft.llaLocation[1]
      };
      if (waypt !== null) {
        Log.info('Got next waypoint: ' + waypt.id);
        RouteManager._totalDist = Utils.getGreatCircleDistance(loc, waypt);

        if (waypt.altitude !== null) {
          controls.autopilot.setAltitude(waypt.altitude);
        }

        if (waypt.ias !== null) {
          controls.autopilot.setKias(waypt.ias);
        }
      }
    } else if (APS.mode === 'HPT') {
      controls.autopilot.setHeading((controls.autopilot.heading + 180) % 360);
      APS._holdPatternCoord = {
        lat: gefs.aircraft.llaLocation[0],
        lon: gefs.aircraft.llaLocation[1]
      };
      APS._holdPatternTicks = 0;
    }

    var newIas = parseInt(APS.iasLabel.val());
    if (!isNaN(newIas) && newIas > 0) {
      controls.autopilot.setKias(newIas);
    } else {
      newIas = parseInt(gefs.aircraft.animationValue.kias);
      controls.autopilot.setKias(newIas);
      APS.iasLabel
        .val(newIas);
    }

    var newAlt = parseInt(APS.altLabel.val());
    if (!isNaN(newAlt)) {
      controls.autopilot.setAltitude(newAlt);
    } else {
      newAlt = parseInt(gefs.aircraft.animationValue.altitude);
      var climbRate = gefs.aircraft.animationValue.climbrate;
      if (Math.abs(climbRate) >= 100) {
        if (climbRate > 0) {
          newAlt += 500;
        } else {
          newAlt -= 500;
        }
      }
      controls.autopilot.setAltitude(newAlt);
      APS.altLabel
        .val(newAlt);
    }

    controls.autopilot.on = true;
  	ui.hud.autopilotIndicator(true);

    Log.info('AP engaged, MODE=' + APS.mode);

    APS.apBtn
      .text('AUTOPILOT\nENGAGED')
      .css('border', '1px solid #0f0')
      .css('color', '#0f0');
  },

  turnOff: function () {
    controls.autopilot.on = false;
    ui.hud.autopilotIndicator(false);

    Log.info('AP disengaged');

    APS.apBtn
      .text('AUTOPILOT\nDISENGAGED')
      .css('border', '1px solid #f00')
      .css('color', '#f00');
  },

  _hook: function () {
    controls.autopilot.turnOn = function () {
      APS.turnOn();
    };

    controls.autopilot.turnOff = function () {
      APS.turnOff();
    };

    var oldSetAlt = controls.autopilot.setAltitude;
    var oldSetHdg = controls.autopilot.setHeading;
    var oldSetIas = controls.autopilot.setKias;

    controls.autopilot.setAltitude = function (altitude) {
      Log.info('AP: setting new altitude=' + altitude + 'ft');
      return oldSetAlt(altitude);
    };

    controls.autopilot.setHeading = function (heading) {
      Log.info('AP: setting new heading=' + heading + 'deg');
      return oldSetHdg(heading);
    };

    controls.autopilot.setKias = function (kias) {
      Log.info('AP: setting new kias=' + kias + 'kts');
      return oldSetIas(kias);
    };
  },

  update: function () {
    if (controls.autopilot.on) {
      if (APS.mode === 'RTE') {
          console.log(RouteManager._currentWaypoint);
          if (RouteManager._currentWaypoint === null) {
            // If the current waypoint is null, switch to holding pattern
            APS.hptBtn.click();
          } else {
            var loc = {
              lat: gefs.aircraft.llaLocation[0],
              lon: gefs.aircraft.llaLocation[1]
            };
            RouteManager._distanceTilWaypoint = Utils.getGreatCircleDistance(loc, RouteManager._currentWaypoint);
            var bearing = parseInt(Utils.getGreatCircleBearing(loc, RouteManager._currentWaypoint));
            controls.autopilot.setHeading(bearing);

            if (Math.abs(RouteManager._distanceTilWaypoint) < 1) {
              // We count a radius of 1km as hitting the waypoint
              RouteManager.nextWaypoint();
              var waypt = RouteManager._currentWaypoint;
              if (waypt !== null) {
                RouteManager._totalDist = Utils.getGreatCircleDistance(loc, waypt);

                if (waypt.altitude !== null) {
                  controls.autopilot.setAltitude(waypt.altitude);
                }

                if (waypt.ias !== null) {
                  controls.autopilot.setKias(waypt.ias);
                }
              }
            } else {
              // Calculate ETA
              var deltaDist = Math.abs(APS._lastDistance - RouteManager._distanceTilWaypoint);
              RouteManager._eta = parseInt((1 / deltaDist) * RouteManager._distanceTilWaypoint);
              APS._lastDistance = RouteManager._distanceTilWaypoint;
            }

            APS.nextLabel
              .text(RouteManager._currentWaypoint.id);
            APS.distLabel
              .text((parseInt(RouteManager._distanceTilWaypoint * 100) / 100) + 'KM');
            APS.etaLabel
              .text(Utils.getTimeStamp(RouteManager._eta * 1000));
          }
      } else if (APS.mode === 'HPT') {
        var hdg = parseInt(gefs.aircraft.animationValue.heading360);
        if (hdg >= controls.autopilot.heading - 3 &&
            hdg <= controls.autopilot.heading + 3) {
          if (APS._holdPatternTicks > 2) {
            // After 2kms, switch heading 180deg
            controls.autopilot.setHeading((controls.autopilot.heading + 180) % 360);
            APS._holdPatternCoord = {
              lat: gefs.aircraft.llaLocation[0],
              lon: gefs.aircraft.llaLocation[1]
            };
            APS._holdPatternTicks = 0;
          } else {
            // Count ticks
            var currentLoc = {
              lat: gefs.aircraft.llaLocation[0],
              lon: gefs.aircraft.llaLocation[1]
            };
            APS._holdPatternTicks = Utils.getGreatCircleDistance(APS._holdPatternCoord,
                                                                 currentLoc);
          }
        } else {
          // In the middle of a turn
          APS._holdPatternCoord = {
            lat: gefs.aircraft.llaLocation[0],
            lon: gefs.aircraft.llaLocation[1]
          };
          APS._holdPatternTicks = 0;
        }
      }
    }
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

/*
 * Implements the info panel
 */

var BANNER = " _____  _                    _       ______ ___  ___ _____  \n" +
             "/  ___|(_)                  | |      |  ___||  \\/  |/  __ \\ \n" +
             "\\ `--.  _  _ __ ___   _ __  | |  ___ | |_   | .  . || /  \\/ \n" +
             " `--. \\| || '_ ` _ \\ | '_ \\ | | / _ \\|  _|  | |\\/| || |     \n" +
             "/\\__/ /| || | | | | || |_) || ||  __/| |    | |  | || \\__/\\ \n" +
             "\\____/ |_||_| |_| |_|| .__/ |_| \\___|\\_|    \\_|  |_/ \\____/ \n" +
             "                     | |                                    \n" +
             "                     |_|                                    \n";

var Info = {
  content: null,
  _uptime: null,
  _aircraft: null,
  _mass: null,

  init: function (content) {
    Info.content = content;

    var banner = $('<pre></pre>');
    banner
      .text(BANNER)
      .css('margin-left', '5px')
      .css('line-height', '1')
      .css('font-size', '8pt');

    Info._aircraft = $('<span></span>');
    Info._uptime = $('<span></span>');
    Info._mass = $('<span></span>');

    var credits = $('<span></span>');
    credits
      .text('ASCII ART GENERATED BY ')
      .append($('<a href="http://patorjk.com/software/taag">TaaG</a>'));

    var label = $('<div></div>');
    label
      .css('margin-left', '5px')
      .text('AIRCRAFT: ')
      .append(Info._aircraft)
      .append($('<br>'))
      .append('WEIGHT: ')
      .append(Info._mass)
      .append($('<br>'))
      .append('UPTIME: ')
      .append(Info._uptime)
      .append($('<br><br>'))
      .append(credits);

    Info.content
      .append(banner)
      .append(label);

    SimpleFMC.registerUpdate(Info.update);
  },

  update: function () {
    Info._aircraft
      .text(gefs.aircraft.name);
    Info._uptime
      .text(Log.uptime());
    Info._mass
      .text(gefs.aircraft.rigidBody.mass + 'KG');
  }
};

/*
 * Implements the FMC log
 */

var Log = {
  content: null,
  startTime: null,

  init: function (content) {
    Log.content = content;
    Log.content
      .css('overflow-y', 'scroll')
      .css('overflow-x', 'auto')
      .css('line-height', '1.3')
      .css('height', '290px');
    Log.startTime = Date.now();
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

  uptime: function () {
    return Utils.getTimeStamp(Date.now() - Log.startTime);
  },

  _entry: function (color, msg) {
    var entry = $('<div></div>');

    var stamp = $('<span></span>');
    stamp
      .css('color', '#0f0')
      .css('font-size', '8pt')
      .css('margin-right', '4px')
      .text('[' + Log.uptime() + ']');

    var item = $('<span></span>');
    item
      .css('color', color)
      .text(msg);
    entry
      .append(stamp)
      .append(item);
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

var RouteManager = {
    _list: null,

    // Routes list
    _routesList: [],
    _uiList: [],

    // Current active waypoint, must be a map with the following keys:
    //   id, lat, lon, altitude, ias
    _currentWaypoint: null,

    // Index pointing to the current waypoint in _routesList/_uiList
    _waypointIndex: -1,

    // Set by external clients
    // FIXME: Starting to get a bit messy here...
    //   Ideally, this should be internal modification only...
    //   Worry about it in later versions...
    _distanceTilWaypoint: 0,
    _eta: 0,
    _totalDist: 0,

    init: function (content) {
        RouteManager._list = $('<div></div>');
        RouteManager._list
          .css('width', 'calc(50% - 4px)')
          .css('height', '286px')
          .css('float', 'left')
          .css('padding', '2px')
          .css('overflow-y', 'scroll');

        content.append(RouteManager._list);
    },

    _lookupId: function (id) {
      var target = id.toUpperCase();
      var key = LOCATION_DB.fixes[target];
      if (key !== undefined) {
        return key;
      }

      key = LOCATION_DB.airports[target];
      if (key !== undefined) {
        return key;
      }

      key = LOCATION_DB.navaids[target];
      if (key !== undefined) {
        return key;
      }

      return null;
    },

    _parseDirective: function (data) {
      var status = {
        ok: false,
        msg: '',
        data: null
      };

      var altDelim = data.indexOf('@');
      var iasDelim = data.indexOf(':');

      var obj = {
        id: null,
        altitude: null,
        ias: null,
        lat: null,
        lon: null
      };

      if (altDelim === -1 && iasDelim === -1) {
        obj.id = data;
      } else if (altDelim === -1) {
        obj.id = data.slice(0, iasDelim);
        obj.ias = parseInt(data.slice(iasDelim + 1));
      } else if (iasDelim === -1) {
        obj.id = data.slice(0, altDelim);
        obj.altitude = parseInt(data.slice(altDelim + 1));
      } else {
        if (altDelim > iasDelim) {
          obj.id = data.slice(0, iasDelim);
        } else {
          obj.id = data.slice(0, altDelim);
        }

        obj.altitude = parseInt(data.slice(altDelim + 1));
        obj.ias = parseInt(data.slice(iasDelim + 1));
      }

      var key = RouteManager._lookupId(obj.id);
      if (key === null) {
        // TODO: Should check for XXXN/XXXXW type reporting points
        status.msg = 'Invalid waypoint: ' + obj.id;
        return status;
      }

      if (isNaN(obj.altitude)) {
        status.msg = 'Invalid altitude for waypoint: ' + obj.id;
        return status;
      } else if (isNaN(obj.ias)) {
        status.msg = 'Invalid IAS for waypoint: ' + obj.id;
        return status;
      }

      obj.lat = key.lat;
      obj.lon = key.lon;

      status.ok = true;
      status.data = obj;

      return status;
    },

    load: function (lst) {
      var status = {
        ok: false,
        msg: ''
      };

      var verifiedList = [];
      for (var i = 0; i < lst.length; i++) {
        var ret = RouteManager._parseDirective(lst[i]);
        if (!ret.ok) {
          status.msg = ret.msg;
          return status;
        }

        verifiedList.push(ret.data);
      }

      var totalDist = 0;
      var prevLocation = {
        lat: gefs.aircraft.llaLocation[0],
        lon: gefs.aircraft.llaLocation[1]
      };
      for (i = 0; i < verifiedList.length; i++) {
        RouteManager._add(verifiedList[i]);

        totalDist += Utils.getGreatCircleDistance(prevLocation, verifiedList[i]);
        prevLocation = verifiedList[i];
      }

      var overview = $('<div></div>');
      overview
        .text('TOTAL DISTANCE:')
        .append($('<br>'))
        .append((parseInt(totalDist * 100) / 100) + 'KM');
      Route._info
        .append(overview);

      status.ok = true;
      return status;
    },

    _add: function (entry) {
      var item = $('<div></div>');
      item
        .css('margin-top', '1px')
        .css('margin-bottom', '1px')
        .css('padding', '2px')
        .css('background', '#555')
        .css('width', 'calc(100% - 5px)')
        .css('height', '40px');
      var wID = $('<span></span>');
      wID
        .css('font-size', '11pt')
        .css('color', '#0f0')
        .text(entry.id);

      item
        .append(wID);
      RouteManager._list
        .append(item);

      RouteManager._uiList.push(item);
      RouteManager._routesList.push(entry);

      console.log(entry);
    },

    _clear: function () {
      RouteManager._currentWaypoint = null;
      RouteManager._waypointIndex = -1;

      RouteManager._distanceTilWaypoint = 0;
      RouteManager._eta = 0;
      RouteManager._totalDist = 0;

      RouteManager._list.empty();
      RouteManager._routesList = [];
      RouteManager._uiList = [];
    },

    nextWaypoint: function () {
      console.log(RouteManager);
      if (RouteManager._waypointIndex >= 0) {
        RouteManager._uiList[RouteManager._waypointIndex]
          .css('background', '#333');
      }

      var next = RouteManager._routesList[RouteManager._waypointIndex + 1];
      if (next === undefined) {
        RouteManager._currentWaypoint = null;
      } else {
        RouteManager._uiList[RouteManager._waypointIndex + 1]
          .css('background', '#777');
        RouteManager._currentWaypoint = next;
        RouteManager._waypointIndex++;
        Log.info('Next waypoint: ' + RouteManager._currentWaypoint.id);
      }
    },

    reset: function () {
      // TODO: resets the whole route manager
      RouteManager._clear();
    }
};

var Route = {
  content: null,
  _dialog: null,
  _routeEntry: null,
  _submitRoute: null,
  _status: null,
  _info: null,
  _details: null,

  init: function (content) {
    Route.content = content;

    RouteManager.init(content);

    Route._setupMainDialog();
    Route._setupRouteDialog();

    Route.content
      .append(RouteManager._list)
      .append(Route._details)
      .append(Route._dialog);
  },

  // https://jsfiddle.net/7zthavz0/5/
  _setupMainDialog: function () {
    Route._details = $('<div></div>');
    Route._details
      .css('width', 'calc(50% - 4px)')
      .css('height', '286px')
      .css('float', 'left')
      .css('padding', '2px');

    Route._info = $('<div></div>');
    Route._info
      .css('width', '100%')
      .css('height', '90%');

    var controls = $('<div></div>');
    controls
      .css('width', '100%')
      .css('height', '10%')
      .css('text-align', 'center')
      .css('margin-left', '3px');

    var loadBtn = $('<button></button>');
    loadBtn
      .text('LOAD')
      .css('padding', '0px')
      .css('margin', '0px')
      .css('height', '100%')
      .css('width', '33%')
      .css('background', '#333')
      .css('border', '1px solid #0f0')
      .css('color', '#0f0')
      .click(function () {
        RouteManager._list
          .css('display', 'none');
        Route._details
          .css('display', 'none');
        Route._dialog.show();
      });
    var actBtn = $('<button></button>');
    actBtn
      .text('ACTV')
      .css('padding', '0px')
      .css('margin', '0px')
      .css('height', '100%')
      .css('width', '33%')
      .css('background', '#333')
      .css('border', '1px solid #0f0')
      .css('color', '#0f0')
      .click(function () {
        // TODO: setup current waypoint by setting currentWaypoint
        //       and updating a bunch of values...
        RouteManager.nextWaypoint();
        Log.info('Current waypoint: ' + RouteManager._currentWaypoint.id);
        APS.rteBtn.click();
      });
    var resetBtn = $('<button></button>');
    resetBtn
      .text('RESET')
      .css('padding', '0px')
      .css('margin', '0px')
      .css('height', '100%')
      .css('width', '33%')
      .css('background', '#333')
      .css('border', '1px solid #0f0')
      .css('color', '#0f0')
      .click(function () {
        // TODO: clears the route manager
        RouteManager.reset();
      });

    controls
      .append(loadBtn)
      .append(actBtn)
      .append(resetBtn);
    Route._details
      .append(Route._info)
      .append(controls);
  },

  _setupRouteDialog: function () {
    Route._dialog = $('<div></div>');
    Route._dialog
      .css('display', 'none');

    var msg = $('<div></div>');
    msg
      .css('height', '20px')
      .text('Enter route information as specified by ')
      .append($('<a href="https://github.com/andermatt64/simple-fmc-gefs-plugin/blob/master/ROUTES.md">ROUTES.md</a>'));

    Route._status = $('<div></div>');
    Route._status
      .css('height', '80px')
      .css('color', '#f00');

    Route._routeEntry = $('<textarea></textarea>');
    Route._routeEntry
      .css('width', 'calc(100% - 5px)')
      .css('height', '150px')
      .css('background', '#555')
      .css('color', '#0f9')
      .css('border', '1px solid #0f0')
      .css('margin', '0px')
      .css('font-family', 'Lucida Console, Monaco, monospace')
      .css('font-size', '8pt')
      .keyup(function(evt) {
        evt.stopImmediatePropagation();
      });

    Route._submitRoute = $('<button></button>');
    Route._submitRoute
      .text('SUBMIT')
      .css('border', '1px solid #0f0')
      .css('background', '#333')
      .css('color', '#0f0')
      .css('margin', '0px')
      .css('width', '50%')
      .css('text-align', 'center')
      .click(function () {
        var raw = Route._routeEntry.val();
        if (raw.length === 0) {
          Route._status
            .text('ERROR: Empty entry box!');
          return;
        }

        var rawList = raw.split(' ');
        if (rawList.length === 0) {
          Route._status
            .text('ERROR: Entry is not valid');
          return;
        }

        var points = [];
        for (var i = 0; i < rawList.length; i++) {
          if (rawList[i].length > 0) {
            points.push(rawList[i]);
          }
        }

        if (points.length === 0) {
          Route._status
            .text('ERROR: Invalid list format!');
          return;
        }

        var status = RouteManager.load(points);
        if (!status.ok) {
          Route._status
            .text('ERROR: ' + status.msg);
          return;
        }

        // On success, hide the dialog
        Route._routeEntry.text('');
        Route._status.text('');
        Route._dialog
          .fadeOut(function () {
            RouteManager._list
              .css('display', 'block');
            Route._details
              .css('display', 'block');
          });
      });

    var cancelBtn = $('<button></button>');
    cancelBtn
      .text('CANCEL')
      .css('border', '1px solid #0f0')
      .css('background', '#333')
      .css('color', '#0f0')
      .css('margin', '0px')
      .css('width', '50%')
      .css('text-align', 'center')
      .click(function () {
        Route._dialog
          .fadeOut(function () {
            RouteManager._list
              .css('display', 'block');
            Route._details
              .css('display', 'block');
          });
      });

    Route._dialog
      .append(msg)
      .append(Route._status)
      .append(Route._routeEntry)
      .append(cancelBtn)
      .append(Route._submitRoute);
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

var NextWaypoint = {
  _panel: null,
  _fill: null,
  _time: null,
  _target: null,

  init: function (content) {
    NextWaypoint._panel = makeStatusPanel();

    var meter = $('<div></div>');
    meter
      .css('margin-top', '5px')
      .css('margin-bottom', '5px')
      .css('margin-left', '5px')
      .css('border', '1px solid #0f0')
      .css('width', '10px')
      .css('height', '80px')
      .css('background', '#0f0')
      .css('float', 'left');

      NextWaypoint._fill = $('<div></div>');
      NextWaypoint._fill
        .css('background', '#000')
        .css('height', '100%');

      var caption = $('<div></div>');
      caption
        .css('padding-top', '5px')
        .css('padding-left', '5px')
        .css('color', '#0f0')
        .css('float', 'left');

    NextWaypoint._time = $('<span></span>');
    NextWaypoint._target = $('<span></span>');

    caption
      .text('NEXT WPT')
      .append($('<br>'))
      .append(NextWaypoint._target)
      .append($('<br>'))
      .append('ETA')
      .append($('<br>'))
      .append(NextWaypoint._time);
    meter
      .append(NextWaypoint._fill);
    NextWaypoint._panel
      .append(meter)
      .append(caption);

    content.append(NextWaypoint._panel);
  },

  update: function () {
    var waypt = RouteManager._currentWaypoint;
    if (waypt !== null) {
      var percent = parseInt((RouteManager._distanceTilWaypoint / RouteManager._totalDist) * 100);
      NextWaypoint._fill
        .css('height', (100 - Math.abs(percent)).toString() + '%');

      NextWaypoint._target
        .text(waypt.id);
      NextWaypoint._time
        .text(Utils.getTimeStamp(RouteManager._eta * 1000));
    }
  }
};

var ElevatorTrim = {
  _panel: null,
  _fill: null,
  _trim: null,

  init: function (content) {
    ElevatorTrim._panel = makeStatusPanel();

    var meter = $('<div></div>');
    meter
      .css('margin-top', '5px')
      .css('margin-bottom', '5px')
      .css('margin-left', '5px')
      .css('border', '1px solid #0f0')
      .css('width', '10px')
      .css('height', '80px')
      .css('background', '#0f0')
      .css('float', 'left');

      ElevatorTrim._fill = $('<div></div>');
      ElevatorTrim._fill
        .css('background', '#000')
        .css('height', '100%');

      var caption = $('<div></div>');
      caption
        .css('padding-top', '5px')
        .css('padding-left', '5px')
        .css('color', '#0f0')
        .css('float', 'left');

      ElevatorTrim._trim = $('<span></span>');

      caption
        .text('ELVTRIM')
        .append($('<br>'))
        .append(ElevatorTrim._trim);
      meter
        .append(ElevatorTrim._fill);
      ElevatorTrim._panel
        .append(meter)
        .append(caption);

      content.append(ElevatorTrim._panel);
  },

  update: function (trim) {
    var percent = parseInt((trim + 0.5) * 100);
    ElevatorTrim._fill
      .css('height', (100 - Math.abs(percent)).toString() + '%');

    ElevatorTrim._trim
      .text((parseInt(trim * 1000) / 1000).toString());
  }
};

var APStatus = {
    _panel: null,
    _label: null,
    _mode: null,

    init: function (content) {
      APStatus._panel = makeStatusPanel();

      var container = $('<div></div>');
      container
        .css('margin-left', '5px')
        .css('margin-top', '5px');

      APStatus._label = $('<span></span>');
      APStatus._mode = $('<span></span>');

      container
        .text('AP STAT')
        .append($('<br>'))
        .append(APStatus._label)
        .append($('<br>'))
        .append('AP MODE')
        .append($('<br>'))
        .append(APStatus._mode);
      APStatus._panel
        .append(container);

      content.append(APStatus._panel);
    },

    update: function (status, mode) {
      if (status) {
        APStatus._label
          .text('ON')
          .css('color', '#339966');
      } else {
        APStatus._label
          .text('OFF')
          .css('color', '#ff3300');
      }

      APStatus._mode
        .text(mode);
    }
};

var Brakes = {
  _panel: null,
  _airbrake: null,
  _brake: null,

  init: function (content) {
    Brakes._panel = makeStatusPanel();

    var container = $('<div></div>');
    container
      .css('margin-left', '5px')
      .css('margin-top', '5px');

    Brakes._airbrake = $('<span></span>');
    Brakes._brake = $('<span></span>');

    container
      .text('SPOILER')
      .append($('<br>'))
      .append(Brakes._airbrake)
      .append($('<br>'))
      .append('BRAKES')
      .append($('<br>'))
      .append(Brakes._brake);
    Brakes._panel
      .append(container);

    content.append(Brakes._panel);
  },

  update: function (airbrake, brakes) {
    if (airbrake === 0) {
      Brakes._airbrake
        .text('DISARM')
        .css('color', '#339966');
    } else if (airbrake === 1) {
      Brakes._airbrake
        .text('ARM')
        .css('color', '#ff3300');
    } else {
      Brakes._airbrake
        .text('CHNG')
        .css('color', '#ff9933');
    }

    if (brakes === 0) {
      Brakes._brake
        .text('OFF')
        .css('color', '#339966');
    } else {
      Brakes._brake
        .text('ON')
        .css('color', '#ff3300');
    }
  }
};

var AltitudeAndClimbRate = {
  _panel: null,
  _altitudeLabel: null,
  _climbRateLabel: null,

  init: function (content) {
    AltitudeAndClimbRate._panel = makeStatusPanel();

    var container = $('<div></div>');
    container
      .css('margin-left', '5px')
      .css('margin-top', '5px');

    AltitudeAndClimbRate._altitudeLabel = $('<span></span>');
    AltitudeAndClimbRate._climbRateLabel = $('<span></span>');

    container
      .text('ALTITUDE')
      .append($('<br>'))
      .append(AltitudeAndClimbRate._altitudeLabel)
      .append($('<br>'))
      .append('VERTSPD')
      .append($('<br>'))
      .append(AltitudeAndClimbRate._climbRateLabel);
    AltitudeAndClimbRate._panel
      .append(container);

    content.append(AltitudeAndClimbRate._panel);
  },

  update: function (altitude, climbRate) {
    altitude = parseInt(altitude).toString();
    climbRate = parseInt(climbRate).toString();

    AltitudeAndClimbRate._altitudeLabel
      .text(altitude + 'FT');
    AltitudeAndClimbRate._climbRateLabel
      .text(climbRate + 'FT/M');
  }
};

var HeadingAndSpeed = {
  _panel: null,
  _headingLabel: null,
  _speedLabel: null,

  init: function (content) {
    HeadingAndSpeed._panel = makeStatusPanel();

    var container = $('<div></div>');
    container
      .css('margin-left', '5px')
      .css('margin-top', '5px');

    HeadingAndSpeed._headingLabel = $('<span></span>');
    HeadingAndSpeed._speedLabel = $('<span></span>');

    container
      .text('HEADING')
      .append($('<br>'))
      .append(HeadingAndSpeed._headingLabel)
      .append($('<br>'))
      .append('KIAS')
      .append($('<br>'))
      .append(HeadingAndSpeed._speedLabel);
    HeadingAndSpeed._panel
      .append(container);

    content.append(HeadingAndSpeed._panel);
  },

  update: function (heading, speed) {
    heading = parseInt(heading).toString();
    speed = parseInt(speed).toString();

    HeadingAndSpeed._headingLabel
      .text(heading + 'DEG');
    HeadingAndSpeed._speedLabel
      .text(speed + 'KTS');
  }
};

var FlapsAndGear = {
  _panel: null,
  _fill: null,
  _flapLabel: null,
  _gearLabel: null,

  init: function (content) {
    FlapsAndGear._panel = makeStatusPanel();

    var meter = $('<div></div>');
    meter
      .css('margin-top', '5px')
      .css('margin-bottom', '5px')
      .css('margin-left', '5px')
      .css('border', '1px solid #0f0')
      .css('width', '10px')
      .css('height', '80px')
      .css('background', '#0f0')
      .css('float', 'left');

    FlapsAndGear._fill = $('<div></div>');
    FlapsAndGear._fill
      .css('background', '#000')
      .css('height', '100%');

    var caption = $('<div></div>');
    caption
      .css('padding-top', '5px')
      .css('padding-left', '5px')
      .css('color', '#0f0')
      .css('float', 'left');

    FlapsAndGear._flapLabel = $('<span></span>');
    FlapsAndGear._gearLabel = $('<span></span>');

    caption
      .text('FLAPS')
      .append($('<br>'))
      .append(FlapsAndGear._flapLabel)
      .append($('<br>'))
      .append('GEAR')
      .append($('<br>'))
      .append(FlapsAndGear._gearLabel);
    meter
      .append(FlapsAndGear._fill);
    FlapsAndGear._panel
      .append(meter)
      .append(caption);

    content.append(FlapsAndGear._panel);
  },

  update: function (flapsValue, gearValue) {
    var percent = parseInt(flapsValue * 100);
    FlapsAndGear._fill
      .css('height', (100 - Math.abs(percent)).toString() + '%');

      var val = percent.toString();
      if (val.length === 1) {
        val = '00' + val;
      } else if (val.length === 2) {
        val = '0' + val;
      }
    FlapsAndGear._flapLabel
      .text(val + '/100');

    if (gearValue === 0) {
      FlapsAndGear._gearLabel
        .text('DOWN')
        .css('color', '#339966');
    } else if (gearValue === 1) {
      FlapsAndGear._gearLabel
        .text('UP')
        .css('color', '#ff3300');
    } else {
      FlapsAndGear._gearLabel
        .text('CHNG')
        .css('color', '#ff9933');
    }
  },
};

var Throttle = {
  _panel: null,
  _fill: null,
  _label: null,
  _engine: null,
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
    Throttle._engine = $('<span></span>');

    caption
      .text('THROT')
      .append($('<br>'))
      .append(Throttle._label)
      .append($('<br>'))
      .append('ENGINE')
      .append($('<br>'))
      .append(Throttle._engine);
    Throttle._meter
      .append(Throttle._fill);
    Throttle._panel
      .append(Throttle._meter)
      .append(caption);

    content.append(Throttle._panel);
  },

  update: function (value, engineStatus) {
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

    if (engineStatus) {
      Throttle._engine
        .css('color', '#339966')
        .text('ON');
    } else {
      Throttle._engine
        .css('color', '#ff3300')
        .text('OFF');
    }
  },
};

var Status = {
  content: null,

  init: function (content) {
    Status.content = content;

    Throttle.init(content);
    HeadingAndSpeed.init(content);
    AltitudeAndClimbRate.init(content);
    NextWaypoint.init(content);
    FlapsAndGear.init(content);
    ElevatorTrim.init(content);
    Brakes.init(content);
    APStatus.init(content);

    SimpleFMC.registerUpdate(function () {
      Throttle.update(gefs.aircraft.animationValue.throttle,
                      gefs.aircraft.engine.on);
      HeadingAndSpeed.update(gefs.aircraft.animationValue.heading360,
                             gefs.aircraft.animationValue.kias);
      AltitudeAndClimbRate.update(gefs.aircraft.animationValue.altitude,
                                  gefs.aircraft.animationValue.climbrate);
      NextWaypoint.update();
      FlapsAndGear.update(gefs.aircraft.animationValue.flapsValue,
                          gefs.aircraft.animationValue.gearPosition);
      ElevatorTrim.update(gefs.aircraft.animationValue.trim);
      Brakes.update(gefs.aircraft.animationValue.airbrakesPosition,
                    gefs.aircraft.animationValue.brakes);
      APStatus.update(controls.autopilot.on,
                      APS.mode);
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

  _state: {
    active: null
  },

  init: function () {
    $('.gefs-map-list')
      .css('border-bottom', UI.FmcHeight + ' solid transparent');

    var fmcPanel = $('.gefs-autopilot');
    fmcPanel
      .empty()
      .css('height', UI.FmcHeight)
      .css('font-family', 'Lucida Console, Monaco, monospace')
      .css('font-size', '9pt')
      .css('background', '#555555')
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
      .css('display', 'none')
      .css('padding', '5px');

    UI.apsContainer = $('<div></div>');
    UI.apsContainer
      .css('display', 'none')
      .css('padding', '5px');

    UI.routeContainer = $('<div></div>');
    UI.routeContainer
      .css('display', 'none')
      .css('padding', '5px');

    UI.logContainer = $('<div></div>');
    UI.logContainer
      .css('display', 'none')
      .css('padding', '5px');

    UI._state.active = UI.infoContainer;

    var infoButton = makeButton('INFO');
    var statusButton = makeButton('STAT');
    var apsButton = makeButton('APS');
    var routeButton = makeButton('RTE');
    var logButton = makeButton('LOG', true);

    infoButton.click(function () {
      if (UI._state.active !== UI.infoContainer) {
        UI._state.active.fadeOut(function () {
          UI.infoContainer.fadeIn(function () {
            UI._state.active = UI.infoContainer;
          });
        });
      }
    });

    statusButton.click(function () {
      if (UI._state.active !== UI.statusContainer) {
        UI._state.active.fadeOut(function () {
          UI.statusContainer.fadeIn(function () {
            UI._state.active = UI.statusContainer;
          });
        });
      }
    });

    apsButton.click(function () {
      if (UI._state.active !== UI.apsContainer) {
        UI._state.active.fadeOut(function () {
          UI.apsContainer.fadeIn(function () {
            UI._state.active = UI.apsContainer;
          });
        });
      }
    });

    routeButton.click(function () {
      if (UI._state.active !== UI.routeContainer) {
        UI._state.active.fadeOut(function () {
          UI.routeContainer.fadeIn(function () {
            UI._state.active = UI.routeContainer;
          });
        });
      }
    });

    logButton.click(function () {
      if (UI._state.active !== UI.logContainer) {
        UI._state.active.fadeOut(function () {
          UI.logContainer.fadeIn(function () {
            UI._state.active = UI.logContainer;
          });
        });
      }
    });

    containerPanel.append(UI.infoContainer);
    containerPanel.append(UI.statusContainer);
    containerPanel.append(UI.apsContainer);
    containerPanel.append(UI.routeContainer);
    containerPanel.append(UI.logContainer);

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
  },

  getTimeStamp: function (ms) {
    var timeDeltaSeconds = parseInt(ms / 1000);
    var hours = parseInt(timeDeltaSeconds / 3600).toString();
    if (hours.length === 1) {
      hours = '0' + hours;
    }

    var mins = parseInt((timeDeltaSeconds % 3600) / 60).toString();
    if (mins.length === 1) {
      mins = '0' + mins;
    }

    var secs = parseInt((timeDeltaSeconds % 3600) % 60).toString();
    if (secs.length === 1) {
      secs = '0' + secs;
    }

    return hours + ':' + mins + ':' + secs;
  }
};
