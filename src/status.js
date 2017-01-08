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
