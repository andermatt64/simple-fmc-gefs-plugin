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

// TODO: Make a panel for next waypoint
//       (fill showing distance covered,
//        time til waypoint,
//        waypoint name)

// TODO: Make a panel for AP status/mode
var APStatus = {
    _panel: null,
    _label: null,
    _mode: null,

    init: function (content) {
      APStatus._panel = makeStatusPanel();

      var container = $('<div></div>');
      container
        .css('margin-top', '5px');

      APStatus._label = $('<span></span>');
      APStatus._mode = $('<span></span>');

      // TODO:
    },

    update: function (status, mode) {
      // TODO:
    }
};

// TODO: Make a panel for airbrakes and brake status
var Brakes = {
  _panel: null,
  _airbrake: null,
  _brake: null,

  init: function (content) {
    Brakes._panel = makeStatusPanel();

    var container = $('<div></div>');
    container
      .css('margin-top', '5px');

    Brakes._airbrake = $('<span></span>');
    Brakes._brake = $('<span></span>');

    // TODO:
  },

  update: function (airbrake, brake) {
    // TODO:
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
    FlapsAndGear._gearLabel
      .css('font-weight', 'bold');

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
    FlapsAndGear.init(content);

    SimpleFMC.registerUpdate(function () {
      Throttle.update(gefs.aircraft.animationValue.throttle,
                      gefs.aircraft.engine.on);
      HeadingAndSpeed.update(gefs.aircraft.animationValue.heading360,
                             gefs.aircraft.animationValue.kias);
      AltitudeAndClimbRate.update(gefs.aircraft.animationValue.altitude,
                                  gefs.aircraft.animationValue.climbrate);
      FlapsAndGear.update(gefs.aircraft.animationValue.flapsValue,
                          gefs.aircraft.animationValue.gearPosition);
    });
  }
};
