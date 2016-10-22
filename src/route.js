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

      if (target.length === 12 &&
          (target[4] === 'N' || target[4] === 'S') &&
          (target[11] === 'E' || target[11] === 'W')) {
        var lat = parseInt(target.slice(0, 4)) / 100;
        var lon = parseInt(target.slice(6, 11)) / 100;

        lat = (target[4] === 'S') ? -lat : lat;
        lon = (target[11] === 'W') ? -lon : lon;

        key = {
          lat: lat,
          lon: lon,
          name: 'GPS'
        };
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

      // FIXME TODO: Add more information here?
      var overview = $('<div></div>');
      overview
        .text('ADDED ' + RouteManager._routesList.length + ' WAYPOINTS')
        .append($('<br>'))
        .append('TOTAL DISTANCE:' + (parseInt(totalDist * 100) / 100) + 'KM');
      Route._info
        .empty()
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
        .css('font-size', '12pt')
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
          .css('padding-left', '10px')
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

    _clear: function () {
      RouteManager._currentWaypoint = null;
      RouteManager._waypointIndex = -1;

      RouteManager._distanceTilWaypoint = 0;
      RouteManager._eta = 0;
      RouteManager._totalDist = 0;

      RouteManager._list.empty();
      Route._info.empty();
      RouteManager._routesList = [];
      RouteManager._uiList = [];
    },

    nextWaypoint: function () {
      console.log(RouteManager);
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

    reset: function () {
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

  _setupMainDialog: function () {
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

          APS.rteBtn.click();
        }
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
