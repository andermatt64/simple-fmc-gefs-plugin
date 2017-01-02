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
      .append($('<option value="5">5KM</option>'))
      .append($('<option value="10">10KM</option>'))
      .append($('<option value="25">25KM</option>'))
      .append($('<option value="50">50KM</option>'))
      .append($('<option value="100">100KM</option>'))
      .append($('<option value="1000">1000KM</option>'))
      .append($('<option value="5000">5000KM</option>'));

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
        for (var l3_key in AIRPORT_MAP[l2_key]) {
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
    var location = gefs.aircraft.llaLocation;
    return {
      lat: location[0],
      lon: location[1],
      hdg: parseInt(gefs.aircraft.animationValue.heading360 % 360)
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

  paintWaypoints: function () {

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
    var hdg = parseInt(gefs.aircraft.animationValue.heading360 % 360).toString();
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
    var altitude = parseInt(gefs.aircraft.animationValue.altitude / 100).toString();
    if (altitude.length > 3) {
      altitude = "999";
    } else {
      while (altitude.length < 3) {
        altitude = "0" + altitude;
      }
    }
    MapDisplay._drawText("FL" + altitude, (target.x * 2) - 31, 0, 10, '#fff');

    // Draw above ground level altitude
    var agl = (gefs.aircraft.animationValue.altitude - (gefs.groundElevation * AGLStatus.metersToFeet) - AGLStatus._planeHeight).toString();
    if (agl.length > 5) {
      agl = "99999";
    } else {
      while (agl.length < 5) {
        agl = "0" + agl;
      }
    }
    MapDisplay._drawText("AGL" + agl, (target.x * 2) - 49, 12, 10, '#fff');

    // Draw IAS
    var ias = parseInt(gefs.aircraft.animationValue.kias).toString();
    MapDisplay._drawText("IAS" + ias, 0, 0, 10, '#fff');

    // Draw VS
    var vs = (gefs.aircraft.animationValue.climbrate / 1000);
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
    var rawThrottle = gefs.aircraft.animationValue.throttle;
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
