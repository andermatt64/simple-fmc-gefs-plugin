/*
 * Implements the route panel
 */

var RouteManager = {
    _list: null,

    // Routes list
    _routesList: [],

    // Current active waypoint
    // {id, lat, lon}
    _currentWaypoint: null,
    _waypointIndex: 0,

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

    _parseDirective: function (directive) {
      var status = {
        ok: false,
        msg: '',
        data: null
      };
      var findFirstDelim = function (data) {

      };

      // Parse waypoint ID

      return status;
    },

    load: function (lst) {
      var status = {
        ok: false,
        msg: ''
      };

      console.log(lst);
      for (var i = 0; i < lst.length; i++) {
        var ret = RouteManager._parseDirective(lst[i]);
        if (!ret.ok) {
          status.msg = ret.msg;
          return status;
        }

        // TODO: add to list
        RouteManager._add(ret.data);
      }

      return status;
    },

    _add: function (entry) {
      var item = $('<div></div>');
      item
        .css('margin-top', '1px')
        .css('margin-bottom', '1px')
        .css('padding', '2px')
        .css('background', '#333')
        .css('width', 'calc(100% - 5px)')
        .css('height', '40px');


    },

    _clear: function () {

    },

    getCurrentWaypoint: function () {

    },

    nextWaypoint: function () {

    },

    resetWaypoint: function () {

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
        // TODO: activated PATH -> APS.mode = 'RTE'
        // TODO: setup current waypoint
        APS.rteBtn.click();
      });
    var deactBtn = $('<button></button>');
    deactBtn
      .text('DEACT')
      .css('padding', '0px')
      .css('margin', '0px')
      .css('height', '100%')
      .css('width', '33%')
      .css('background', '#333')
      .css('border', '1px solid #0f0')
      .css('color', '#0f0')
      .click(function () {
        // TODO:
        RouteManager._currentWaypoint = null;
      });

    controls
      .append(loadBtn)
      .append(actBtn)
      .append(deactBtn);
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
