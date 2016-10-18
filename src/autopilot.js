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
  hdrLabel: null,
  altLabel: null,
  iasLabel: null,

  nextLabel: null,
  distLabel: null,
  etaLabel: null,

  _holdPatternTicks: 0,

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

    var hdgBtn = makeModeBtn();
    var rteBtn = makeModeBtn();
    var hptBtn = makeModeBtn();

    hdgBtn
      .text('HDG')
      .css('color', '#0f0')
      .css('border', '1px solid #0f0')
      .click(function () {
        hdgBtn
          .css('color', '#0f0')
          .css('border', '1px solid #0f0');
        rteBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');
        hptBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');

        // TODO
        APS.mode = 'HDG';
        APS.hdgLabel
          .prop('disabled', false);
      });

    rteBtn
      .text('ROUTE')
      .click(function () {
        rteBtn
          .css('color', '#0f0')
          .css('border', '1px solid #0f0');
        hdgBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');
        hptBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');

        // TODO
        APS.mode = 'RTE';
        APS.hdgLabel
          .prop('disabled', true);
      });

    hptBtn
      .text('HLDPAT')
      .click(function () {
        hptBtn
          .css('color', '#0f0')
          .css('border', '1px solid #0f0');
        rteBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');
        hdgBtn
          .css('color', '#f00')
          .css('border', '1px solid #f00');

        APS.mode = 'HPT';
        APS.hdgLabel
          .prop('disabled', true);

        controls.autopilot.setHeading((controls.autopilot.heading + 180) % 360);
        APS._holdPatternTicks = 0;
      });

    var hdgBox = makeThirdsCell(true);
    APS.hdgLabel = makeInput(3);
    APS.hdgLabel
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
      .append(makeModeCell(hdgBtn))
      .append(makeModeCell(rteBtn))
      .append(makeModeCell(hptBtn))
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
      // TODO: make sure altLabel and iasLabel are set!
    } else if (APS.mode === 'HPT') {
      controls.autopilot.setHeading((controls.autopilot.heading + 180) % 360);
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
          // TODO: after RTE completes, switch mode to HPT
      } else if (APS.mode === 'HPT') {
        var hdg = parseInt(gefs.aircraft.animationValue.heading360);
        if (hdg >= controls.autopilot.heading - 5 &&
            hdg <= controls.autopilot.heading + 5) {
          if (APS._holdPatternTicks > 20) {
            // After 21 ticks, switch heading 180deg
            controls.autopilot.setHeading((controls.autopilot.heading + 180) % 360);
            APS._holdPatternTicks = 0;
          } else {
            // Count ticks
            APS._holdPatternTicks += 1;
          }
        } else {
          // In the middle of a turn
          APS._holdPatternTicks = 0;
        }
      }
    }
  }
};
