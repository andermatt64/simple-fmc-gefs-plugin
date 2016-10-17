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
      .css('font-size', '8pt');

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
        // TODO:
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

    // TODO: setup click handler for submitRoute

    Route._dialog
      .append(msg)
      .append(Route._status)
      .append(Route._routeEntry)
      .append(cancelBtn)
      .append(Route._submitRoute);
  }
};
