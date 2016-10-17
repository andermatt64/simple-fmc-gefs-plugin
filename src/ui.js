/*
 * Implements the SimpleFMC UI
 */

var UI = {
  // Height of the FMC div
  FmcHeight: '300px',

  infoContainer: null,
  statusContainer: null,
  apsContainer: null,
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
    var routeButton = makeButton('RTE');
    var logButton = makeButton('LOG', true);

    infoButton.click(function () {
      if (UI._state.active !== UI.infoContainer) {
        UI._state.active.fadeOut(function () {
          UI.infoContainer.fadeIn(function () {
            UI._state.active = UI.infoContainer;
          });
        });
      }
    });

    statusButton.click(function () {
      if (UI._state.active !== UI.statusContainer) {
        UI._state.active.fadeOut(function () {
          UI.statusContainer.fadeIn(function () {
            UI._state.active = UI.statusContainer;
          });
        });
      }
    });

    apsButton.click(function () {
      if (UI._state.active !== UI.apsContainer) {
        UI._state.active.fadeOut(function () {
          UI.apsContainer.fadeIn(function () {
            UI._state.active = UI.apsContainer;
          });
        });
      }
    });

    routeButton.click(function () {
      if (UI._state.active !== UI.routeContainer) {
        UI._state.active.fadeOut(function () {
          UI.routeContainer.fadeIn(function () {
            UI._state.active = UI.routeContainer;
          });
        });
      }
    });

    logButton.click(function () {
      if (UI._state.active !== UI.logContainer) {
        UI._state.active.fadeOut(function () {
          UI.logContainer.fadeIn(function () {
            UI._state.active = UI.logContainer;
          });
        });
      }
    });

    containerPanel.append(UI.infoContainer);
    containerPanel.append(UI.statusContainer);
    containerPanel.append(UI.apsContainer);
    containerPanel.append(UI.routeContainer);
    containerPanel.append(UI.logContainer);

    buttonPanel
      .append(infoButton)
      .append(statusButton)
      .append(apsButton)
      .append(routeButton)
      .append(logButton);

    fmcPanel
      .append(buttonPanel)
      .append(containerPanel);
  }
};
