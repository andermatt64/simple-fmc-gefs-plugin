/*
 * Implements the map panel
 */

var MapDisplay = {
  AIRCRAFT_SIZE: 15,
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
    MapDisplay._syncDims();

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

    // TODO: When should we repaint? Every X seconds or as fast as we can?
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
      MapDisplay._ctx.fillText(value, x, y + size);
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

  paintWaypoints: function () {

  },

  paintAirports: function () {

  },

  paintInfo: function () {

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
