/*
 * Implements the SimpleFMC UI
 */

var UI = {
  // Height of the FMC div
  FmcHeight: '300px',

  infoContainer: null,
  statusContainer: null,
  apsContainer: null,
  mapContainer: null,
  routeContainer: null,
  logContainer: null,

  _state: {
    active: null
  },

  init: function () {
    $('.gefs-map-list')
      .css('border-bottom', UI.FmcHeight + ' solid transparent');

    var fmcPanel = $('.gefs-autopilot');
    fmcPanel
      .empty()
      .css('height', UI.FmcHeight)
      .css('font-family', 'Lucida Console, Monaco, monospace')
      .css('font-size', '9pt')
      .css('background', '#555555')
      .css('padding', '0 0 0 0');

    var makeButton = function (name, isBottomButton) {
      var btn = $('<button></button>');
      btn
        .text(name)
        .css('width', '100%')
        .css('font-family', 'Lucida Console, Monaco, monospace')
        .css('font-weight', 'bold')
        .css('font-size', '8pt')
        .css('text-align', 'left')
        .css('transition-duration', '0.4s')
        .css('border-top', '1px solid #000')
        .css('border-left', '1px solid #000');

      if (isBottomButton !== undefined && isBottomButton) {
        btn
          .css('border-bottom', '1px solid #000');
      }

      return btn;
    };

    var buttonPanel = $('<div></div>');
    buttonPanel
      .css('float', 'left')
      .css('width', '10%')
      .css('margin-right', '0px')
      .css('padding-right', '0px');

    var containerPanel = $('<div></div>');
    containerPanel
      .css('float', 'left')
      .css('background', '#000')
      .css('color', '#0f0')
      .css('width', '90%')
      .css('height', '300px')
      .css('margin-right', '0px')
      .css('padding-right', '0px');

    UI.infoContainer = $('<div></div>');
    UI.infoContainer
      .css('padding', '5px');

    UI.statusContainer = $('<div></div>');
    UI.statusContainer
      .css('display', 'none')
      .css('padding', '5px');

    UI.apsContainer = $('<div></div>');
    UI.apsContainer
      .css('display', 'none')
      .css('padding', '5px');

    UI.mapContainer = $('<div></div>');
    UI.mapContainer
      .css('display', 'none')
      .css('padding', '5px');

    UI.routeContainer = $('<div></div>');
    UI.routeContainer
      .css('display', 'none')
      .css('padding', '5px');

    UI.logContainer = $('<div></div>');
    UI.logContainer
      .css('display', 'none')
      .css('padding', '5px');

    UI._state.active = UI.infoContainer;

    var infoButton = makeButton('INFO');
    var statusButton = makeButton('STAT');
    var apsButton = makeButton('APS');
    var mapButton = makeButton('MAP');
    var routeButton = makeButton('RTE');
    var logButton = makeButton('LOG', true);

    var switchContent = function (target) {
        if (UI._state.active !== target) {
          UI._state.active.stop(true, true).fadeOut(function () {
            target.stop(true, true).fadeIn(function () {
              UI._state.active = target;
            });
          });
        }
    };

    infoButton.click(function () {
      switchContent(UI.infoContainer);
    });

    statusButton.click(function () {
      switchContent(UI.statusContainer);
    });

    apsButton.click(function () {
      switchContent(UI.apsContainer);
    });

    mapButton.click(function () {
      MapDisplay._syncDims();
      
      switchContent(UI.mapContainer);
    });

    routeButton.click(function () {
      switchContent(UI.routeContainer);
    });

    logButton.click(function () {
      switchContent(UI.logContainer);
    });

    containerPanel.append(UI.infoContainer);
    containerPanel.append(UI.statusContainer);
    containerPanel.append(UI.apsContainer);
    containerPanel.append(UI.mapContainer);
    containerPanel.append(UI.routeContainer);
    containerPanel.append(UI.logContainer);

    buttonPanel
      .append(infoButton)
      .append(statusButton)
      .append(apsButton)
      .append(mapButton)
      .append(routeButton)
      .append(logButton);

    fmcPanel
      .append(buttonPanel)
      .append(containerPanel);
  }
};
