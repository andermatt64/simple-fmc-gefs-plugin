// ==UserScript==
// @name        simple-fmc-gefs-plugin
// @namespace   andermatt64-gefs-plugins
// @version     0.2.0
// @description Simple FMC GEFS Plugin
// @author      andermatt64
// @require     https://raw.githubusercontent.com/andermatt64/simple-fmc-gefs-plugin/master/dist/simple-fmc-gefs-plugin-locations.min.js
// @require     https://raw.githubusercontent.com/andermatt64/simple-fmc-gefs-plugin/master/dist/simple-fmc-gefs-plugin-airportmap.min.js
// @match       http://*.gefs-online.com/gefs.php
// @grant       none
// ==/UserScript==

// Sat Jan 07 2017 22:37:43 GMT-0500 (EST)

/*
 * Implements autopilot system functionality
 */

var APS = {
  // Radius around waypoint that counts as hitting the waypoint
  TARGET_HIT_RADIUS: 1,

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
  _lastTime: 0,
  _holdPatternCoord: [],

  // Sets the autopilot heading and updates the heading input to the
  // new heading
  _setAPHeading: function (hdg, onErrorSetCurrent) {
    var newHdg = parseInt(hdg);
    if (!isNaN(newHdg) && newHdg >= 0 && newHdg <= 360) {
      GEFS.autopilot.setHeading(newHdg % 360);
    } else {
      newHdg = parseInt(GEFS.aircraft.getHeading());

      if (onErrorSetCurrent !== undefined && onErrorSetCurrent) {
        var rollAngle = GEFS.aircraft.getRollAngle();
        if (Math.abs(rollAngle) >= 1) {
          // Smoother transition into autopilot
          if (rollAngle > 0) {
            newHdg -= 8;
          } else {
            newHdg += 8;
          }
        }
        GEFS.autopilot.setHeading(newHdg);
      }

      APS.hdgLabel
        .val(newHdg);
    }
  },

  // Sets the autopilot altitude and updates the altitude input to the
  // new altitude
  _setAPAltitude: function (alt, onErrorSetCurrent) {
    var newAlt = parseInt(alt);
    if (!isNaN(newAlt)) {
      GEFS.autopilot.setAltitude(newAlt);
    } else {
      newAlt = parseInt(GEFS.aircraft.getAltitude());

      if (onErrorSetCurrent !== undefined && onErrorSetCurrent) {
        var climbRate = GEFS.aircraft.getClimbRate();
        if (Math.abs(climbRate) >= 100) {
          if (climbRate > 0) {
            newAlt += 500;
          } else {
            newAlt -= 500;
          }
        }
        GEFS.autopilot.setAltitude(newAlt);
      }

      APS.altLabel
        .val(newAlt);
    }
  },

  // Sets the autopilot IAS and updates the IAS input to the new IAS
  _setAPIas: function (ias, onErrorSetCurrent) {
    var newIas = parseInt(ias);
    if (!isNaN(newIas) && newIas > 0) {
      GEFS.autopilot.setKias(newIas);
    } else {
      newIas = parseInt(GEFS.aircraft.getKias());
      if (onErrorSetCurrent !== undefined && onErrorSetCurrent) {
        GEFS.autopilot.setKias(newIas);
      }

      APS.iasLabel
        .val(newIas);
    }
  },

  init: function (content) {
    APS.content = content;

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
        if (GEFS.autopilot.isOn()) {
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

        // TODO: trigger heading set to hdgLabel contents
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

        // TODO: trigger route?
        APS.mode = 'RTE';
        APS.hdgLabel
          .prop('disabled', true);

        if (RouteManager._currentWaypoint === null) {
          RouteManager.nextWaypoint();
          var location = GEFS.aircraft.getLocation();
          var loc = {
            lat: location[0],
            lon: location[1]
          };
          var waypt = RouteManager._currentWaypoint;
          if (waypt !== null) {
            Log.info('Current waypoint: ' + RouteManager._currentWaypoint.id);
            RouteManager._totalDist = Utils.getGreatCircleDistance(loc, waypt);

            if (waypt.altitude !== null) {
              GEFS.autopilot.setAltitude(waypt.altitude);
            }

            if (waypt.ias !== null) {
              GEFS.autopilot.setKias(waypt.ias);
            }
          }
        }
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

        APS._initHoldPattern();
      });

    var hdgBox = makeThirdsCell(true);
    APS.hdgLabel = makeInput(3);
    APS.hdgLabel
      .keypress(function (event) {
        if (event.keyCode === 13) {
          APS.hdgLabel.blur();
        }
      })
      .blur(function () {
        if (GEFS.autopilot.isOn() && APS.mode === 'HDG') {
          APS._setAPHeading(APS.hdgLabel.val());
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
      .keypress(function (event) {
        if (event.keyCode === 13) {
          APS.altLabel.blur();
        }
      })
      .blur(function () {
        if (GEFS.autopilot.isOn()) {
          APS._setAPAltitude(APS.altLabel.val());
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
      .keypress(function (event) {
        if (event.keyCode === 13) {
          APS.iasLabel.blur();
        }
      })
      .blur(function () {
        if (GEFS.autopilot.isOn()) {
          APS._setAPIas(APS.iasLabel.val());
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

    APS._hook();
    APS._setLessAggressiveAP();

    SimpleFMC.registerUpdate(APS.update);
  },

  _ensureAPLimit: function (limitName, limitValue) {
    if (GEFS.autopilot.getLimit(limitName) !== undefined) {
      if (GEFS.autopilot.getLimit(limitName) !== limitValue) {
        Log.info('Setting autopilot ' + limitName + ' to ' + limitValue.toString());
        GEFS.autopilot.setLimit(limitName, limitValue);
      }
    } else {
      Log.warn(limitName + ' is not a defined autopilot limit');
    }
  },

  _setLessAggressiveAP: function () {
    // Set less aggressive autopilot constants
    APS._ensureAPLimit('commonClimbrate', 500);
    APS._ensureAPLimit('commonDescentrate', -750);
    APS._ensureAPLimit('maxBankAngle', 20);
    APS._ensureAPLimit('maxClimbrate', 2000);
    APS._ensureAPLimit('maxDescentrate', -1800);
    APS._ensureAPLimit('maxPitchAngle', 10);
    APS._ensureAPLimit('minPitchAngle', -8);

    Log.info('Finished setting a less aggressive AP');
  },

  _initHoldPattern: function () {
    GEFS.autopilot.setHeading((GEFS.autopilot.getHeading() + 180) % 360);
    var location = GEFS.aircraft.getLocation();
    APS._holdPatternCoord = [{
      lat: location[0],
      lon: location[1]
    }];
    APS._holdPatternTicks = 0;
  },

  turnOn: function () {
    if (APS.mode === 'HDG') {
      APS._setAPHeading(APS.hdgLabel.val(), true);
      APS._setAPIas(APS.iasLabel.val(), true);
      APS._setAPAltitude(APS.altLabel.val(), true);
    } else if (APS.mode === 'RTE') {
      if (RouteManager._currentWaypoint === null) {
        Log.info('Current waypoint is NULL, getting next waypoint');
        RouteManager.nextWaypoint();
      }

      var waypt = RouteManager._currentWaypoint;
      var location = GEFS.aircraft.getLocation();
      var loc = {
        lat: location[0],
        lon: location[1]
      };
      if (waypt !== null) {
        Log.info('Got next waypoint: ' + waypt.id);
        RouteManager._totalDist = Utils.getGreatCircleDistance(loc, waypt);

        if (waypt.altitude !== null) {
          GEFS.autopilot.setAltitude(waypt.altitude);
        } else {
          APS._setAPAltitude(APS.altLabel.val(), true);
        }

        if (waypt.ias !== null) {
          GEFS.autopilot.setKias(waypt.ias);
        } else {
          APS._setAPIas(APS.iasLabel.val(), true);
        }
      }
    } else if (APS.mode === 'HPT') {
      APS._initHoldPattern();
      APS._setAPIas(APS.iasLabel.val(), true);
      APS._setAPAltitude(APS.altLabel.val(), true);
    }

    Log.info('AP engaged, MODE=' + APS.mode);

    APS.apBtn
      .text('AUTOPILOT\nENGAGED')
      .css('border', '1px solid #0f0')
      .css('color', '#0f0');
  },

  turnOff: function () {
    Log.info('AP disengaged');

    APS.apBtn
      .text('AUTOPILOT\nDISENGAGED')
      .css('border', '1px solid #f00')
      .css('color', '#f00');

    SimpleFMC._checkMixYawRollExponential();
  },

  _hook: function () {
    GEFS.autopilot.hookTurnOn(function () {
      APS.turnOn();
    });

    GEFS.autopilot.hookTurnOff(function () {
      APS.turnOff();
    });
  },

  update: function () {
    if (GEFS.autopilot.isOn()) {
      if (APS.mode === 'RTE') {
        if (RouteManager._currentWaypoint === null) {
          // If the current waypoint is null, switch to holding pattern
          APS.hptBtn.click();
        } else {
          var location = GEFS.aircraft.getLocation();
          var loc = {
            lat: location[0],
            lon: location[1]
          };
          RouteManager._distanceTilWaypoint = Utils.getGreatCircleDistance(loc, RouteManager._currentWaypoint);
          var bearing = parseInt(Utils.getGreatCircleBearing(loc, RouteManager._currentWaypoint));
          if (bearing !== GEFS.autopilot.getHeading()) {
            GEFS.autopilot.setHeading(bearing);
          }

          if (Math.abs(RouteManager._distanceTilWaypoint) < APS.TARGET_HIT_RADIUS) {
            // We count a radius of a defined value as hitting the waypoint
            RouteManager.nextWaypoint();
            var waypt = RouteManager._currentWaypoint;
            if (waypt !== null) {
              RouteManager._totalDist = Utils.getGreatCircleDistance(loc, waypt);

              if (waypt.altitude !== null) {
                GEFS.autopilot.setAltitude(waypt.altitude);
              }

              if (waypt.ias !== null) {
                GEFS.autopilot.setKias(waypt.ias);
              }
            }
          } else {
            // Calculate ETA
            var currentTime = (new Date()).getTime();
            var deltaTime = currentTime - APS._lastTime;
            var deltaDist = Math.abs(APS._lastDistance - RouteManager._distanceTilWaypoint);
            RouteManager._eta = parseInt(((deltaTime / 1000.0) / deltaDist) * RouteManager._distanceTilWaypoint);
            APS._lastTime = currentTime;
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
        if (APS._holdPatternCoord.length === 1) {
          var hdg = parseInt(GEFS.aircraft.getHeading());
          if (hdg >= GEFS.autopilot.getHeading() - 3 &&
              hdg <= GEFS.autopilot.getHeading() + 3) {
            // We are near our target heading
            if (APS._holdPatternTicks > (35 * (1000 / FMC_UPDATE_INTERVAL))) {
              // We have traveled "straight" for a bit, set another
              // waypoint and turn back.
              var currentLocation = GEFS.aircraft.getLocation();
              APS._holdPatternCoord.push({
                lat: currentLocation[0],
                lon: currentLocation[1]
              });

              // Set it to 0 to seek first waypoint again
              APS._holdPatternTicks = 0;
              Log.info('Target set for holding pattern');
            } else {
              APS._holdPatternTicks += 1;
            }
          } else {
            // We are in the middle of a turn
            APS._holdPatternTicks = 0;
          }
        } else if (APS._holdPatternCoord.length === 2) {
          // Our two waypoints are set, we use APS._holdPatternTicks as the index
          var _location = GEFS.aircraft.getLocation();
          var currentLoc = {
            lat: _location[0],
            lon: _location[1]
          };
          var targetWaypt = APS._holdPatternCoord[APS._holdPatternTicks];
          var distanceTilTarget = Utils.getGreatCircleDistance(currentLoc, targetWaypt);
          var targetHdg = parseInt(Utils.getGreatCircleBearing(currentLoc, targetWaypt));
          if (targetHdg !== GEFS.autopilot.getHeading()) {
            GEFS.autopilot.setHeading(targetHdg);
          }

          if (Math.abs(distanceTilTarget) < APS.TARGET_HIT_RADIUS) {
            // We are within a defined km of the target waypoints
            if (APS._holdPatternTicks === 0) {
              APS._holdPatternTicks = 1;
            } else {
              APS._holdPatternTicks = 0;
            }
          }
        } else {
          Log.error('Holding pattern is in a bad state! Reinitializing...');
      
          APS._initHoldPattern();
        }
      }
    }

    if (GEFS.autopilot.isOn()) {
      if (GEFS.aircraft.getKias() >= 400) {
        // KIAS is >400kts, limit AP pitch angles
        APS._ensureAPLimit('maxPitchAngle', 5);
        APS._ensureAPLimit('minPitchAngle', -5);
      } else {
        APS._ensureAPLimit('maxPitchAngle', 10);
        APS._ensureAPLimit('minPitchAngle', -8);
      }

      if (APS.mode === 'HPT') {
        APS._ensureAPLimit('maxBankAngle', 30);
      } else {
        APS._ensureAPLimit('maxBankAngle', 20);
      }
    }
  }
};

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

  _checkMixYawRollExponential: function () {
    // Make sure nose steering/rudder works in mouse mode with mix yaw/roll off
    if (controls.mode === 'mouse' && !controls.mixYawRoll) {
        Log.info('Detected mouse mode with mixYawRoll off, applying fixes...');
        controls.yawExponential = '0.0';
    }
  },

  init: function () {
    Log.init(UI.logContainer);
    Status.init(UI.statusContainer);
    APS.init(UI.apsContainer);
    MapDisplay.init(UI.mapContainer);
    Route.init(UI.routeContainer);
    Info.init(UI.infoContainer);
    TerrainFix.init();

    SimpleFMC.timerID = setInterval(SimpleFMC.backgroundUpdate, FMC_UPDATE_INTERVAL);

    SimpleFMC._checkMixYawRollExponential();

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
 * Implements the GEFS abstraction layer that aims to be the only code that
 * directly references the gefs specific JavaScript namespace.
 *
 * The goal here is to mitigate porting difficulties upon GEFS version updates.
 */

var GEFS = {
  metersToFeet: 3.28084,

  getInitFunction: function () {
    return gefs.init;
  },

  isLoadedIntoNamespace: function () {
    return (window.gefs && GEFS.getInitFunction());
  },

  setInitFunction: function (initFn) {
    gefs.init = initFn;
  },

  getCanvas: function () {
    return gefs.canvas;
  },

  aircraft: {
    height: 0,

    getName: function () {
      return gefs.aircraft.name;
    },

    getMass: function () {
      return gefs.aircraft.rigidBody.mass;
    },

    getThrottlePosition: function () {
      return gefs.aircraft.animationValue.throttle;
    },

    isEngineOn: function () {
      return gefs.aircraft.engine.on;
    },

    getHeading: function () {
      return gefs.aircraft.animationValue.heading360;
    },

    getKias: function () {
      return gefs.aircraft.animationValue.kias;
    },

    getMachSpeed: function () {
      return gefs.aircraft.animationValue.mach;
    },

    getClimbRate: function () {
      return gefs.aircraft.animationValue.climbrate;
    },

    getFlapsPosition: function () {
      return gefs.aircraft.animationValue.flapsValue;
    },

    getGearPosition: function () {
      return gefs.aircraft.animationValue.gearPosition;
    },

    getElevatorTrimPosition: function () {
      return gefs.aircraft.animationValue.trim;
    },

    getAirBrakePosition: function () {
      return gefs.aircraft.animationValue.airbrakesPosition;
    },

    getBrakePosition: function () {
      return gefs.aircraft.animationValue.brakes;
    },

    getRollAngle: function () {
      return gefs.aircraft.animationValue.aroll;
    },

    getLocation: function () {
      return gefs.aircraft.llaLocation;
    },

    getGroundElevation: function () {
      return gefs.groundElevation;
    },

    getAltitude: function () {
      return gefs.aircraft.animationValue.altitude;
    },

    getAGL: function () {
      return GEFS.aircraft.getAltitude() - (GEFS.aircraft.getGroundElevation() * GEFS.metersToFeet) - GEFS.aircraft.height;
    }
  },

  autopilot: {
      isOn: function () {
        return controls.autopilot.on;
      },

      hookTurnOn: function (cb) {
        controls.autopilot.turnOn = function () {
          if (!gefs.aircraft.setup.autopilot) {
            return;
          }

          controls.autopilot.climbPID.reset();
          controls.autopilot.pitchPID.reset();
          controls.autopilot.rollPID.reset();
          controls.autopilot.throttlePID.reset();

          cb();

          controls.autopilot.on = true;
          ui.hud.autopilotIndicator(true);
        };
      },

      hookTurnOff: function (cb) {
        controls.autopilot.turnOff = function () {
          controls.autopilot.on = false;
          ui.hud.autopilotIndicator(false);

          cb();
        };
      },

      getHeading: function () {
        return controls.autopilot.heading;
      },

      setHeading: function (heading) {
        Log.info('AP: setting new heading=' + heading + 'deg');
        controls.autopilot.setHeading(heading);
      },

      setAltitude: function (altitude) {
        Log.info('AP: setting new altitude=' + altitude + 'ft');
        controls.autopilot.setAltitude(altitude);
      },

      setKias: function (ias) {
        Log.info('AP: setting new kias=' + ias + 'kts');
        controls.autopilot.setKias(ias);
      },

      setLimit: function (name, value) {
        controls.autopilot[name] = value;
      },

      getLimit: function (name) {
        return controls.autopilot[name];
      }
  },

  terrain: {
    setProvider: function (provider) {
      gefs.api.viewer.terrainProvider = provider;
    },

    getProvider: function () {
      return gefs.api.viewer.terrainProvider;
    },

    createEllipsoidProvider: function () {
      return new Cesium.EllipsoidTerrainProvider();
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
      .append('MAKE SURE PLANE HEIGHT IS CALIBRATED!')
      .append($('<br><br>'))
      .append(credits);

    Info.content
      .append(banner)
      .append(label);

    SimpleFMC.registerUpdate(Info.update);
  },

  update: function () {
    Info._aircraft
      .text(GEFS.aircraft.getName());
    Info._uptime
      .text(Log.uptime());
    Info._mass
      .text(GEFS.aircraft.getMass() + 'KG');
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

/*
 * Implements the map panel
 */

var within = function (min, x, max) {
    return (x >= min) && (x < max);
};

var MapDisplay = {
  AIRCRAFT_SIZE: 15,
  AIRPORT_SIZE: 5,
  WAYPT_RADIUS: 7,
  MAP_RADIUS: 223,

  content: null,
  mapView: null,
  rangeSelector: null,

  _ctx: null,

  init: function (content) {
    MapDisplay.content = content;

    MapDisplay.mapView = $('<canvas></canvas>');
    MapDisplay.mapView
      .css('height', '260px')
      .css('width', '100%');

    // Setup a resize handler to make sure canvas is resized!
    $(window).resize(function () {
      MapDisplay._syncDims();
      MapDisplay.paint();
    });

    MapDisplay.rangeSelector = $('<select></select>');
    MapDisplay.rangeSelector
      .css('float', 'right')
      .css('padding', '0')
      .css('margin', '0')
      .css('background', '#000')
      .css('color', '#0f0')
      .append($('<option value="10">10KM</option>'))
      .append($('<option value="25">25KM</option>'))
      .append($('<option value="50">50KM</option>'))
      .append($('<option value="100">100KM</option>'))
      .append($('<option value="1000">1000KM</option>'))
      .append($('<option value="5000">5000KM</option>'))
      .append($('<option value="10000">10000KM</option>'));

    MapDisplay.content
      .append(MapDisplay.mapView)
      .append(MapDisplay.rangeSelector)
      .append($('<span>RANGE:</span>')
                .css('color', '#0f0')
                .css('float', 'right'));

    MapDisplay._ctx = MapDisplay.mapView[0].getContext('2d');

    window.requestAnimFrame = (function () {
      return window.requestAnimationFrame ||
             window.webkitRequestAnimationFrame ||
             window.mozRequestAnimationFrame ||
             function (callback) {
               window.setTimeout(callback, 1000 / 30);
             };
    })();

    MapDisplay._syncDims();

    (function animationLoop() {
      requestAnimFrame(animationLoop);
      MapDisplay.paint();
    })();
  },

  _mapCenterPoint: function () {
    return {
      x: parseInt(MapDisplay.mapView.width() / 2),
      y: (parseInt(MapDisplay.mapView.height()) - 5) - (parseInt((MapDisplay.AIRCRAFT_SIZE * 1.33) / 2))
    };
  },

  _drawText: function (label, x, y, size, color) {
      MapDisplay._ctx.font = size + 'px "Lucida Console", Monaco, monospace';
      MapDisplay._ctx.fillStyle = color;
      MapDisplay._ctx.fillText(label, x, y + size);
  },

  _syncDims: function () {
    MapDisplay.mapView[0].width = MapDisplay.mapView.width();
    MapDisplay.mapView[0].height = MapDisplay.mapView.height();
  },

  getNearbyAirports: function (location) {
    var boxX = parseInt(location.lat / 2);
    var boxY = parseInt(location.lon / 2);

    var getAirportsForSector = function (x, y) {
      if (y > 89) {
        y = (y % 90) - 89;
      } else if (y < -89) {
        y = (y % 90) + 89;
      }

      // XXX: I'm not sure what happens at the north pole...
      if (x > 44) {
        x = 44 - (x % 45);
      } else if (x < -44) {
        x = -44 - (x % 45);
      }

      var key = x + ',' + y;
      if (AIRPORT_MAP[key] === undefined) {
        return [];
      }

      var sector = [];
      for (var l2_key in AIRPORT_MAP[key]) {
        for (var l3_key in AIRPORT_MAP[key][l2_key]) {
          sector = sector.concat(AIRPORT_MAP[key][l2_key][l3_key]);
        }
      }

      return sector;
    };

    var nearby = [];
    for (var x = -1; x < 2; x++) {
      for (var y = -1; y < 2; y++) {
        nearby = nearby.concat(getAirportsForSector(boxX + x, boxY + y));
      }
    }

    return nearby;
  },

  getRadius: function () {
    return parseInt(MapDisplay.rangeSelector.val());
  },

  getCurrentLocation: function () {
    var location = GEFS.aircraft.getLocation();
    return {
      lat: location[0],
      lon: location[1],
      hdg: parseInt(GEFS.aircraft.getHeading() % 360)
    };
  },

  // XXX: Only supports -90 to 90 for now!
  getDegreeDelta: function (hdg, bearing) {
    var degDelta;
    var maxLeft = hdg - 90;
    var maxRight = hdg + 90;

    if (maxLeft < 0) {
      if (within(360 + maxLeft, hdg, 360) && within(0, bearing, maxRight)) {
        degDelta = -((360 - hdg) + bearing);
      } else if (within(360 + maxLeft, bearing, 360) && within(0, hdg, maxRight)) {
        degDelta = (360 - bearing) + hdg;
      } else if (within(maxRight, bearing, 360 - maxLeft)) {
        degDelta = null;
      } else {
        degDelta = hdg - bearing;
      }
    } else if (maxRight >= 360) {
      if (within(maxLeft, hdg, 360) && within(0, bearing, maxRight - 360)) {
        degDelta = -((360 - hdg) + (bearing - 360));
      } else if (within(maxLeft, bearing, 360) && within(0, hdg, maxRight - 360)) {
        degDelta = (360 - bearing) + (hdg - 360);
      } else if (within(maxRight - 360, bearing, maxLeft)) {
        degDelta = null;
      } else {
        degDelta = hdg - bearing;
      }
    } else {
      degDelta = hdg - bearing;
    }

    return degDelta;
  },

  // XXX: Only supports -90 to 90 for now!
  calculateCoordForPoint: function (normalizedDistance, degDelta) {
    var xDiff = parseInt((normalizedDistance * Math.sin(Utils.toRadians(Math.abs(degDelta)))) + 0.5);
    var yDiff = parseInt((normalizedDistance * Math.cos(Utils.toRadians(Math.abs(degDelta)))) + 0.5);

    var target = MapDisplay._mapCenterPoint();
    if (degDelta < 0) {
      target.x += xDiff;
    } else {
      target.x -= xDiff;
    }
    target.y -= yDiff;

    return target;
  },

  _drawWaypoint: function (x, y, label) {
    var ctx = MapDisplay._ctx;

    ctx.beginPath();
    ctx.arc(x - MapDisplay.WAYPT_RADIUS,
            y - MapDisplay.WAYPT_RADIUS,
            MapDisplay.WAYPT_RADIUS,
            0,
            0.5 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#c3f';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - MapDisplay.WAYPT_RADIUS,
            y + MapDisplay.WAYPT_RADIUS,
            MapDisplay.WAYPT_RADIUS,
            1.5 * Math.PI,
            2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#c3f';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + MapDisplay.WAYPT_RADIUS,
            y - MapDisplay.WAYPT_RADIUS,
            MapDisplay.WAYPT_RADIUS,
            0.5 * Math.PI,
            Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#c3f';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + MapDisplay.WAYPT_RADIUS,
            y + MapDisplay.WAYPT_RADIUS,
            MapDisplay.WAYPT_RADIUS,
            Math.PI,
            1.5 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#c3f';
    ctx.stroke();

    MapDisplay._drawText(label, x + MapDisplay.WAYPT_RADIUS - 2, y + MapDisplay.WAYPT_RADIUS - 2, 9, '#fff');
  },

  _getWaypoints: function () {
    return RouteManager._routesList;
  },

  _getCurrentWaypointIndex: function () {
    return RouteManager._waypointIndex;
  },

  paintWaypoints: function () {
    var waypoints = MapDisplay._getWaypoints();
    if (MapDisplay._getCurrentWaypointIndex() >= 0 && waypoints.length > 0) {
      var ctx = MapDisplay._ctx;
      var location = MapDisplay.getCurrentLocation();
      var wayptMap = {};

      // FIXME: This process can probably be simplified more...
      for (var i = MapDisplay._getCurrentWaypointIndex(); i < waypoints.length; i++) {
        var waypt = waypoints[i];
        var distance = Utils.getGreatCircleDistance(location, waypt);
        var bearing = Utils.getGreatCircleBearing(location, waypt);
        var radius = parseInt(((MapDisplay.MAP_RADIUS / MapDisplay.getRadius()) * distance) + 0.5);
        var degDelta = MapDisplay.getDegreeDelta(location.hdg, bearing);
        if (degDelta !== null) {
          var target = MapDisplay.calculateCoordForPoint(radius, degDelta);
          MapDisplay._drawWaypoint(target.x, target.y, waypt.id);
          wayptMap[waypt.id] = target;
        }
      }

      // Draw connecting lines
      var prevCoord = MapDisplay._mapCenterPoint();
      var prevLocation = MapDisplay.getCurrentLocation();
      for (i = MapDisplay._getCurrentWaypointIndex(); i < waypoints.length; i++) {
        var current = waypoints[i];
        if (wayptMap[current.id] !== undefined) {
          if (prevCoord === null) {
            // FIXME: previous coordinate could not be displayed, should display a lines
            //        from way point to prev location?
          } else {
            ctx.beginPath();
            ctx.moveTo(prevCoord.x, prevCoord.y);
            ctx.lineTo(wayptMap[current.id].x, wayptMap[current.id].y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#0f0';
            ctx.stroke();
          }

          prevCoord = wayptMap[current.id];
        } else {
          // FIXME: current coordinate does not exist, can we figure out the bearing and
          //        draw a line at that bearing?
          prevCoord = null;
        }

        prevLocation = current;
      }

      var bottomY = MapDisplay.mapView.height();

      // Draw next waypoint
      MapDisplay._drawText("WPT: ", 2, bottomY - 52, 10, '#fff');
      MapDisplay._drawText(RouteManager._currentWaypoint.id, 27, bottomY - 52, 10, '#0f0');

      // Draw distance til waypoint
      var remDist = (parseInt(RouteManager._distanceTilWaypoint  * 100) / 100).toFixed(2);
      MapDisplay._drawText("DIST: ", 2, bottomY - 40, 10, '#fff');
      MapDisplay._drawText(remDist + "KM", 33, bottomY - 40, 10, '#0f0');

      // Draw time til waypoint
      MapDisplay._drawText("ETA: ", 2, bottomY - 28, 10, '#fff');
      MapDisplay._drawText(Utils.getTimeStamp(RouteManager._eta * 1000), 27, bottomY - 28, 10, '#0f0');

      // Draw total distance for planned route
      var totalDist = (parseInt(RouteManager._routeTotalDist * 100) / 100).toFixed(2);
      MapDisplay._drawText("TTL: ", 2, bottomY - 12, 10, '#fff');
      MapDisplay._drawText(totalDist + "KM", 27, bottomY - 12, 10, '#0f0');
    }
  },

  _drawAirport: function (x, y, label) {
    var ctx = MapDisplay._ctx;

    ctx.beginPath();
    ctx.arc(x, y, MapDisplay.AIRPORT_SIZE, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3cf';
    ctx.stroke();

    MapDisplay._drawText(label, x + parseInt(MapDisplay.AIRPORT_SIZE + 0.5), y + parseInt(MapDisplay.AIRPORT_SIZE + 0.5), 9, '#3cf');
  },

  paintAirports: function () {
    var location = MapDisplay.getCurrentLocation();

    var airports = [];
    var nearby = MapDisplay.getNearbyAirports(location);
    for (var key in nearby) {
      var airport = LOCATION_DB.airports[nearby[key]];
      var distance = Utils.getGreatCircleDistance(location, airport);
      if (distance <= MapDisplay.getRadius()) {
        airports.push({
          airport: airport,
          distance: distance,
          code: nearby[key]
        });
      }
    }

    // Only show 30 airports at maximum
    var maxObjects = airports.length;
    if (maxObjects > 30) {
      maxObjects = 30;
    }

    for (var i = 0; i < maxObjects; i++) {
      var result = airports[i];
      var bearing = Utils.getGreatCircleBearing(location, result.airport);
      var radius = parseInt(((MapDisplay.MAP_RADIUS / MapDisplay.getRadius()) * result.distance) + 0.5);
      var degDelta = MapDisplay.getDegreeDelta(location.hdg, bearing);
      if (degDelta !== null) {
        var point = MapDisplay.calculateCoordForPoint(radius, degDelta);
        MapDisplay._drawAirport(point.x, point.y, result.code);
      }
    }
  },

  paintInfo: function () {
    var ctx = MapDisplay._ctx;

    var target = MapDisplay._mapCenterPoint();
    var bottomY = parseInt(MapDisplay.mapView.height()) - 5;

    // Draw aircraft
    ctx.beginPath();
    ctx.moveTo(target.x, bottomY - parseInt(MapDisplay.AIRCRAFT_SIZE * 1.33));
    ctx.lineTo(target.x - parseInt(MapDisplay.AIRCRAFT_SIZE / 2), bottomY);
    ctx.lineTo(target.x + parseInt(MapDisplay.AIRCRAFT_SIZE / 2), bottomY);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ff0';
    ctx.stroke();

    // Draw heading box
    ctx.beginPath();
    ctx.rect(target.x - 15, 0, 30, 16);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Draw heading
    var hdg = parseInt(GEFS.aircraft.getHeading() % 360).toString();
    while (hdg.length < 3) {
      hdg = "0" + hdg;
    }
    MapDisplay._drawText(hdg, target.x - 9, 2, 10, '#fff');

    // Draw heading box tick
    ctx.beginPath();
    ctx.moveTo(target.x - 3, bottomY - MapDisplay.MAP_RADIUS - 15);
    ctx.lineTo(target.x, bottomY - MapDisplay.MAP_RADIUS - 10);
    ctx.lineTo(target.x + 3, bottomY - MapDisplay.MAP_RADIUS - 15);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Draw arc
    ctx.beginPath();
    ctx.arc(target.x, target.y, MapDisplay.MAP_RADIUS, 1.25 * Math.PI, 1.75 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Draw altitude above sea level
    var altitude = parseInt(GEFS.aircraft.getAltitude() / 100).toString();
    if (altitude.length > 3) {
      altitude = "999";
    } else {
      while (altitude.length < 3) {
        altitude = "0" + altitude;
      }
    }
    MapDisplay._drawText("FL" + altitude, (target.x * 2) - 31, 0, 10, '#fff');

    // Draw above ground level altitude
    var agl = parseInt(GEFS.aircraft.getAGL()).toString();
    if (agl.length > 5) {
      agl = "99999";
    } else {
      while (agl.length < 5) {
        agl = "0" + agl;
      }
    }
    MapDisplay._drawText("AGL" + agl, (target.x * 2) - 49, 12, 10, '#fff');

    // Draw IAS
    var ias = parseInt(GEFS.aircraft.getKias()).toString();
    MapDisplay._drawText("IAS" + ias, 0, 0, 10, '#fff');

    // Draw VS
    var vs = (GEFS.aircraft.getClimbRate() / 1000);
    if (vs >= 10) {
      vs = " 9.99K";
    } else if (vs <= -10) {
      vs = "-9.99K";
    } else {
      vs = vs.toFixed(2);
      if (vs.length < 5) {
        vs = " " + vs;
      }
      vs += "K";
    }
    MapDisplay._drawText("VS " + vs, (target.x * 2) - 55, 24, 10, '#fff');

    // Draw throttle
    var rawThrottle = GEFS.aircraft.getThrottlePosition();
    var throttle = parseInt(rawThrottle * 100).toString();
    while (throttle.length < 3) {
      throttle = "0" + throttle;
    }
    var thrColor = '#0f0';
    if (rawThrottle < 0) {
      thrColor = '#f60';
    }
    MapDisplay._drawText("THR" + throttle, 0, 12, 10, thrColor);
  },

  clear: function () {
    MapDisplay._ctx.fillStyle = '#000';
    MapDisplay._ctx.fillRect(0, 0, MapDisplay.mapView.width(), MapDisplay.mapView.height());
  },

  paint: function () {
    MapDisplay.clear();
    MapDisplay.paintWaypoints();

    // Only paint airports under 100KM
    if (MapDisplay.getRadius() <= 100) {
      MapDisplay.paintAirports();
    }

    MapDisplay.paintInfo();
  }
};

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

    _routeTotalDist: 0,

    init: function(content) {
        RouteManager._list = $('<div></div>');
        RouteManager._list
            .css('width', 'calc(50% - 4px)')
            .css('height', '286px')
            .css('float', 'left')
            .css('padding', '2px')
            .css('overflow-y', 'scroll');

        content.append(RouteManager._list);
    },

    _isGPSCoordFormat: function(target) {
        target = target.toUpperCase();
        return ((target.length === 12) &&
                (target[4] === 'N' || target[4] === 'S') &&
                (target[11] === 'E' || target[11] === 'W'));
    },

    _lookupId: function(id) {
        var target = id.toUpperCase();
        var key = LOCATION_DB.fixes[target];
        if (key !== undefined) {
            key.type = 'fix';
            return key;
        }

        key = LOCATION_DB.airports[target];
        if (key !== undefined) {
            key.type = 'airport';
            return key;
        }

        key = LOCATION_DB.navaids[target];
        if (key !== undefined) {
            key.type = 'navaid';
            return key;
        }

        if (RouteManager._isGPSCoordFormat(id)) {
          var lat = 0;
          var lon = 0;

          if (id.length === 12) {
            lat = parseInt(target.slice(0, 4)) / 100;
            lon = parseInt(target.slice(6, 11)) / 100;

            lat = (target[4] === 'S') ? -lat : lat;
            lon = (target[11] === 'W') ? -lon : lon;
          } else {
            throw "Bad GPS coordinate format";
          }

          key = {
              type: 'gps',
              lat: lat,
              lon: lon,
              name: lat.toString() + ',' + lon.toString()
          };
          return key;
        }
        return null;
    },

    _parseDirective: function(data) {
        var status = {
            ok: false,
            msg: '',
            data: null
        };

        var altDelim = data.indexOf('@');
        var iasDelim = data.indexOf(':');

        var obj = {
            type: null,
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

        obj.type = key.type;
        obj.lat = key.lat;
        obj.lon = key.lon;

        status.ok = true;
        status.data = obj;

        return status;
    },

    // Convert the route to gcmap.com syntax
    _toGCMapFormat: function() {
        var gcList = [];
        var toGCMapFmt = function(v, isLng) {
            var h = parseInt(Math.abs(v));
            var m = (Math.abs(v) - h) * 60;
            var s = parseInt(((m - parseInt(m)) * 60) + 0.5);

            m = parseInt(m);

            var len = h.toString().length;
            if (isLng !== undefined && isLng) {
                if (len === 1) {
                    h = '00' + h.toString();
                } else if (len === 2) {
                    h = '0' + h.toString();
                }
            } else {
                if (len === 1) {
                    h = '0' + h.toString();
                }
            }

            len = m.toString().length;
            if (len === 1) {
                m = '0' + m.toString();
            }

            len = s.toString().length;
            if (len === 1) {
                s = '0' + s.toString();
            }

            return h + '' + m + '' + s;
        };

        for (var i = 0; i < RouteManager._routesList.length; i++) {
            var entry = RouteManager._routesList[i];
            if (entry.type === 'gps' || entry.type === 'navaid') {
                gcList.push(((entry.lat > 0) ? 'N' : 'S') + toGCMapFmt(entry.lat) + ' ' +
                    ((entry.lon > 0) ? 'E' : 'W') + toGCMapFmt(entry.lon, true));
            } else {
                gcList.push(entry.id);
            }
        }
        return gcList.join('-');
    },

    load: function(lst) {
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
        var location = GEFS.aircraft.getLocation();
        var prevLocation = {
            lat: location[0],
            lon: location[1]
        };
        for (i = 0; i < verifiedList.length; i++) {
            RouteManager._add(verifiedList[i]);

            totalDist += Utils.getGreatCircleDistance(prevLocation, verifiedList[i]);
            prevLocation = verifiedList[i];
        }
        RouteManager._routeTotalDist = totalDist;

        // FIXME TODO: Add more information here?
        var gcmap = $('<div></div>');
        gcmap
            .css('font-family', 'Courier New')
            .css('font-size', '6pt')
            .css('line-height', '10px')
            .text(RouteManager._toGCMapFormat());
        var overview = $('<div></div>');
        overview
            .text('ADDED ' + RouteManager._routesList.length + ' WAYPOINTS')
            .append($('<br>'))
            .append('TOTAL DISTANCE: ' + (parseInt(totalDist * 100) / 100) + 'KM')
            .append($('<br><br>'))
            .append(gcmap);
        Route._info
            .empty()
            .append(overview);

        status.ok = true;
        return status;
    },

    _add: function(entry) {
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
            .css('font-size', '14pt')
            .css('color', '#0f0')
            .css('float', 'left')
            .text(entry.id);
        item
            .append(wID);

        if (entry.altitude !== null) {
            var alt = $('<span></span>');
            alt
                .css('color', '#0f0')
                .css('float', 'right')
                .text(entry.altitude + 'FT');
            item
                .append(alt);
        }

        if (entry.ias !== null) {
            var ias = $('<span></span>');
            ias
                .css('color', '#0f0')
                .css('float', 'right')
                .css('padding-right', '10px')
                .text(entry.ias + 'KTS');
            item
                .append(ias);
        }

        // FIXME TODO: Add more route waypoint information here?
        RouteManager._list
            .append(item);

        RouteManager._uiList.push(item);
        RouteManager._routesList.push(entry);
    },

    _clear: function() {
        RouteManager._currentWaypoint = null;
        RouteManager._waypointIndex = -1;

        RouteManager._distanceTilWaypoint = 0;
        RouteManager._eta = 0;
        RouteManager._totalDist = 0;
        RouteManager._routeTotalDist = 0;

        RouteManager._list.empty();
        Route._info.empty();
        RouteManager._routesList = [];
        RouteManager._uiList = [];
    },

    nextWaypoint: function() {
        if (RouteManager._waypointIndex >= 0) {
            RouteManager._uiList[RouteManager._waypointIndex]
                .css('background', '#111');
        }

        var next = RouteManager._routesList[RouteManager._waypointIndex + 1];
        if (next === undefined | next === null) {
            RouteManager._currentWaypoint = null;
        } else {
            RouteManager._uiList[RouteManager._waypointIndex + 1]
                .css('background', '#777');
            RouteManager._currentWaypoint = next;
            RouteManager._waypointIndex++;
            Log.info('Next waypoint: ' + RouteManager._currentWaypoint.id);
        }
    },

    reset: function() {
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

    init: function(content) {
        Route.content = content;

        RouteManager.init(content);

        Route._setupMainDialog();
        Route._setupRouteDialog();

        Route.content
            .append(RouteManager._list)
            .append(Route._details)
            .append(Route._dialog);
    },

    _setupMainDialog: function() {
        Route._details = $('<div></div>');
        Route._details
            .css('width', 'calc(50% - 4px)')
            .css('height', '286px')
            .css('float', 'left')
            .css('padding', '2px');

        // FIXME TODO: Better default text?
        Route._info = $('<div></div>');
        Route._info
            .css('width', '100%')
            .css('height', '90%')
            .text('PRESS LOAD TO DEFINE A ROUTE TO FOLLOW');

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
            .click(function() {
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
            .click(function() {
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
            .click(function() {
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

    _setupRouteDialog: function() {
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
            .click(function() {
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
                    .fadeOut(function() {
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
            .click(function() {
                Route._dialog
                    .fadeOut(function() {
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
  _mach: null,

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
      ElevatorTrim._mach = $('<span></span>');

      caption
        .text('ELVTRIM')
        .append($('<br>'))
        .append(ElevatorTrim._trim)
        .append($('<br>'))
        .append('MACH')
        .append($('<br>'))
        .append(ElevatorTrim._mach);
      meter
        .append(ElevatorTrim._fill);
      ElevatorTrim._panel
        .append(meter)
        .append(caption);

      content.append(ElevatorTrim._panel);
  },

  update: function (trim, mach) {
    var percent = parseInt((trim + 0.5) * 100);
    ElevatorTrim._fill
      .css('height', (100 - Math.abs(percent)).toString() + '%');

    ElevatorTrim._trim
      .text((parseInt(trim * 1000) / 1000).toString());

    mach = parseInt(mach * 1000) / 1000;
    ElevatorTrim._mach
      .text(mach.toString());
  }
};

var AGLStatus = {
    metersToFeet: 3.28084,

    _panel: null,
    _label: null,

    _planeHeight: 0,
    _calibrateBtn: null,

    init: function (content) {
      AGLStatus._panel = makeStatusPanel();

      var container = $('<div></div>');
      container
        .css('margin-left', '5px')
        .css('margin-top', '5px');

      AGLStatus._label = $('<span></span>');
      AGLStatus._calibrateBtn = $('<button></button>');
      AGLStatus._calibrateBtn
        .text('CAL')
        .css('font-family', '"Lucida Console", Monaco, monospace')
        .css('border', '1px solid #0f0')
        .css('background', '#000')
        .css('color', '#0f0')
        .click(function () {
          GEFS.aircraft.height = GEFS.aircraft.getAltitude() - (GEFS.aircraft.getGroundElevation() * GEFS.metersToFeet);
          Log.info('Calibrated AGL! planeHeight=' + AGLStatus._planeHeight);
        });
      container
        .text('AGL')
        .append($('<br>'))
        .append(AGLStatus._label)
        .append($('<br>'))
        .append(AGLStatus._calibrateBtn);
      AGLStatus._panel
        .append(container);

      content.append(AGLStatus._panel);
    },

    update: function () {
      var agl = GEFS.aircraft.getAGL();

      // TODO: This should update agl in some global state
      AGLStatus._label
        .text(parseInt(agl).toString() + 'FT');

      if (agl <= 500) {
        AGLStatus._label.css('color', '#ff3300');
      } else if (agl > 500 && agl <= 1500) {
        AGLStatus._label.css('color', '#ff9933');
      } else {
        AGLStatus._label.css('color', '#339966');
      }
    }
};

var APStatus = {
    _panel: null,
    _label: null,
    _mode: null,

    init: function (content) {
      APStatus._panel = makeStatusPanel();
      APStatus._panel
        .css('height', '90px');
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
    AGLStatus.init(content);
    APStatus.init(content);

    SimpleFMC.registerUpdate(function () {
      Throttle.update(GEFS.aircraft.getThrottlePosition(),
                      GEFS.aircraft.isEngineOn());
      HeadingAndSpeed.update(GEFS.aircraft.getHeading(),
                             GEFS.aircraft.getKias());
      AltitudeAndClimbRate.update(GEFS.aircraft.getAltitude(),
                                  GEFS.aircraft.getClimbRate());
      NextWaypoint.update();
      FlapsAndGear.update(GEFS.aircraft.getFlapsPosition(),
                          GEFS.aircraft.getGearPosition());
      ElevatorTrim.update(GEFS.aircraft.getElevatorTrimPosition(),
                          GEFS.aircraft.getMachSpeed());
      Brakes.update(GEFS.aircraft.getAirBrakePosition(),
                    GEFS.aircraft.getBrakePosition());
      AGLStatus.update();
      APStatus.update(GEFS.autopilot.isOn(),
                      APS.mode);
    });
  }
};

/*
 * Implements a fix for bad runway terrain at certain airports
 */

 var TerrainFix = {
   ALTITUDE_THRESHOLD: 1100,
   DISTANCE_RADIUS: 10,

   _oldTerrainProvider: null,
   _ellipseProvider: null,

   init: function () {
     TerrainFix._ellipseProvider = GEFS.terrain.createEllipsoidProvider();
     TerrainFix._oldTerrainProvider = GEFS.terrain.getProvider();
     SimpleFMC.registerUpdate(TerrainFix.update);
   },

   closestAirport: function () {
      var key = null;
      var location = GEFS.aircraft.getLocation();
      var current = {
        lat: location[0],
        lon: location[1]
      };
      var closest = {
        name: "",
        distance: 999999
      };
      var airportFix = ["VHHH",
                        "OMDB",
                        "ZBAA",
                        "WSSS",
                        "SAEZ",
                        "NZAA",
                        "FACT",
                        "EDDM",
                        "YPPH",
                        "EGLL"];
      for (var i = 0; i < airportFix.length; i++) {
          key = LOCATION_DB.airports[airportFix[i]];
          if (key !== undefined) {
              var distance = Utils.getGreatCircleDistance(current, key);
              if (distance < closest.distance) {
                  closest.name = airportFix[i];
                  closest.distance = distance;
              }
          }
      }

      return closest;
   },

   update: function () {
     var altitude = GEFS.aircraft.getAGL();
     if (altitude < TerrainFix.ALTITUDE_THRESHOLD) {
       var closest = TerrainFix.closestAirport();
       if (closest.distance < TerrainFix.DISTANCE_RADIUS) {
         if (TerrainFix._ellipseProvider !== GEFS.terrain.getProvider()) {
           GEFS.terrain.setProvider(TerrainFix._ellipseProvider);
         }

         return;
       }
     }

     if (TerrainFix._oldTerrainProvider !== GEFS.terrain.getProvider()) {
       GEFS.terrain.setProvider(TerrainFix._oldTerrainProvider);
     }
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
  mapContainer: null,
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

    UI.mapContainer = $('<div></div>');
    UI.mapContainer
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
    var mapButton = makeButton('MAP');
    var routeButton = makeButton('RTE');
    var logButton = makeButton('LOG', true);

    var switchContent = function (target, cb) {
        if (UI._state.active !== target) {
          UI._state.active.stop(true, true).fadeOut(function () {
            target.stop(true, true).fadeIn(function () {
              UI._state.active = target;

              if (cb !== undefined) {
                cb();
              }
            });
          });
        }
    };

    infoButton.click(function () {
      switchContent(UI.infoContainer);
    });

    statusButton.click(function () {
      switchContent(UI.statusContainer);
    });

    apsButton.click(function () {
      switchContent(UI.apsContainer);
    });

    mapButton.click(function () {
      switchContent(UI.mapContainer, function () {
        MapDisplay._syncDims();
      });
    });

    routeButton.click(function () {
      switchContent(UI.routeContainer);
    });

    logButton.click(function () {
      switchContent(UI.logContainer);
    });

    containerPanel.append(UI.infoContainer);
    containerPanel.append(UI.statusContainer);
    containerPanel.append(UI.apsContainer);
    containerPanel.append(UI.mapContainer);
    containerPanel.append(UI.routeContainer);
    containerPanel.append(UI.logContainer);

    buttonPanel
      .append(infoButton)
      .append(statusButton)
      .append(apsButton)
      .append(mapButton)
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
