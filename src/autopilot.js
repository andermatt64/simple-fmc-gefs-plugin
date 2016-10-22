/*
 * Implements autopilot system functionality
 */

var APS = {
  // Radius around waypoint that counts as hitting the waypoint
  TARGET_HIT_RADIUS: 0.4,

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
  _holdPatternCoord: [],

  // Sets the autopilot heading and updates the heading input to the
  // new heading
  _setAPHeading: function (hdg, onErrorSetCurrent) {
    var newHdg = parseInt(hdg);
    if (!isNaN(newHdg) && newHdg >= 0 && newHdg <= 360) {
      controls.autopilot.setHeading(newHdg % 360);
    } else {
      newHdg = parseInt(gefs.aircraft.animationValue.heading360);

      if (onErrorSetCurrent !== undefined && onErrorSetCurrent) {
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
      controls.autopilot.setAltitude(newAlt);
    } else {
      newAlt = parseInt(gefs.aircraft.animationValue.altitude);

      if (onErrorSetCurrent !== undefined && onErrorSetCurrent) {
        var climbRate = gefs.aircraft.animationValue.climbrate;
        if (Math.abs(climbRate) >= 100) {
          if (climbRate > 0) {
            newAlt += 500;
          } else {
            newAlt -= 500;
          }
        }
        controls.autopilot.setAltitude(newAlt);
      }

      APS.altLabel
        .val(newAlt);
    }
  },

  // Sets the autopilot IAS and updates the IAS input to the new IAS
  _setAPIas: function (ias, onErrorSetCurrent) {
    var newIas = parseInt(ias);
    if (!isNaN(newIas) && newIas > 0) {
      controls.autopilot.setKias(newIas);
    } else {
      newIas = parseInt(gefs.aircraft.animationValue.kias);
      if (onErrorSetCurrent !== undefined && onErrorSetCurrent) {
        controls.autopilot.setKias(newIas);
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
          var loc = {
            lat: gefs.aircraft.llaLocation[0],
            lon: gefs.aircraft.llaLocation[1]
          };
          var waypt = RouteManager._currentWaypoint;
          if (waypt !== null) {
            Log.info('Current waypoint: ' + RouteManager._currentWaypoint.id);
            RouteManager._totalDist = Utils.getGreatCircleDistance(loc, waypt);

            if (waypt.altitude !== null) {
              controls.autopilot.setAltitude(waypt.altitude);
            }

            if (waypt.ias !== null) {
              controls.autopilot.setKias(waypt.ias);
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
        if (controls.autopilot.on && APS.mode === 'HDG') {
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
        if (controls.autopilot.on) {
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
        if (controls.autopilot.on) {
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
    if (controls.autopilot[limitName] !== undefined) {
      if (controls.autopilot[limitName] !== limitValue) {
        Log.info('Setting autopilot ' + limitName + ' to ' + limitValue.toString());
        controls.autopilot[limitName] = limitValue;
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
    controls.autopilot.setHeading((controls.autopilot.heading + 180) % 360);
    APS._holdPatternCoord = [{
      lat: gefs.aircraft.llaLocation[0],
      lon: gefs.aircraft.llaLocation[1]
    }];
    APS._holdPatternTicks = 0;
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
      APS._setAPHeading(APS.hdgLabel.val(), true);
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
      APS._initHoldPattern();
    }

    APS._setAPIas(APS.iasLabel.val(), true);
    APS._setAPAltitude(APS.altLabel.val(), true);

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
          if (bearing !== controls.autopilot.heading) {
            controls.autopilot.setHeading(bearing);
          }

          if (Math.abs(RouteManager._distanceTilWaypoint) < APS.TARGET_HIT_RADIUS) {
            // We count a radius of a defined value as hitting the waypoint
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
            RouteManager._eta = parseInt((1 / deltaDist) * RouteManager._distanceTilWaypoint);              APS._lastDistance = RouteManager._distanceTilWaypoint;
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
          var hdg = parseInt(gefs.aircraft.animationValue.heading360);
          if (hdg >= controls.autopilot.heading - 3 &&
              hdg <= controls.autopilot.heading + 3) {
            // We are near our target heading
            if (APS._holdPatternTicks > 35) {
              // We have traveled "straight" for a bit, set another
              // waypoint and turn back.
              APS._holdPatternCoord.push({
                lat: gefs.aircraft.llaLocation[0],
                lon: gefs.aircraft.llaLocation[1]
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
          var currentLoc = {
            lat: gefs.aircraft.llaLocation[0],
            lon: gefs.aircraft.llaLocation[1]
          };
          var targetWaypt = APS._holdPatternCoord[APS._holdPatternTicks];
          var distanceTilTarget = Utils.getGreatCircleDistance(currentLoc, targetWaypt);
          var targetHdg = parseInt(Utils.getGreatCircleBearing(currentLoc, targetWaypt));
          if (targetHdg !== controls.autopilot.heading) {
            controls.autopilot.setHeading(targetHdg);
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
          console.log(APS._holdPatternCoord);

          APS._initHoldPattern();
        }
      }
    }

    if (controls.autopilot.on) {
      if (gefs.aircraft.animationValue.kias >= 400) {
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
