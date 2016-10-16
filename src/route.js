/*
 * Implements the route panel
 */

var RouteManager = {
    _list: null,

    // Routes list
    _routesList: [],

    // Current active waypoint
    _currentWaypoint: null,

    init: function (content) {
        RouteManager._list = $('<div></div>');
        RouteManager._list
          .css('width', 'calc(50% - 4px)')
          .css('height', '286px')
          .css('float', 'left')
          .css('padding', '2px')
          .css('overflow-y', 'scroll');
    },

    load: function () {

    },

    _add: function () {

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

  init: function (content) {
    Route.content = content;

    Route._setupMainDialog();
    Route._setupRouteDialog();
  },

  // https://jsfiddle.net/7zthavz0/5/
  _setupMainDialog: function () {

  },

  _setupRouteDialog: function () {
    Route._dialog = $('<div></div>');
    Route._dialog
      .css('padding', '5px')
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
      .css('font-size', '8pt');

    Route._submitRoute = $('<button></button>');
    Route._submitRoute
      .css('border', '1px solid #0f0')
      .css('background', '#333')
      .css('color', '#0f0')
      .css('margin', '0px')
      .css('width', 'calc(100% + 1px)')
      .css('text-align', 'center');

    // TODO: setup click handler for submitRoute

    Route._dialog
      .append(msg)
      .append(Route._status)
      .append(Route._routeEntry)
      .append(Route._submitRoute);
  }
};
