/*
 * Implements the SimpleFMC UI
 */

var UI = {
  // Height of the FMC div
  FmcHeight: '300px',

  init: function () {
    $('.gefs-map-list')
      .css('border-bottom', this.FmcHeight + ' solid transparent');

    var fmcPanel = $('.gefs-autopilot');
    fmcPanel
      .empty()
      .css('height', this.FmcHeight)
      .css('font-family', 'Lucida Console, Monaco, monospace')
      .css('font-size', '9pt')
      .css('padding', '0 0 0 0');

    var makeButton = function (name, isBottomButton) {
      var btn = $('<button></button>');
      btn
        .val(name)
        .css('width', '100%')
        .css('font-family', 'Lucida Console, Monaco, monospace')
        .css('font-weight', 'bold')
        .css('font-size', '8pt')
        .css('text-align', 'left')
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

    var infoButton = makeButton('INFO');
    var statusButton = makeButton('STATUS');
    var apsButton = makeButton('APS');
    var routeButton = makeButton('ROUTE');

    buttonPanel
      .append(infoButton)
      .append(statusButton)
      .append(apsButton)
      .append(routeButton);

    fmcPanel
      .append(buttonPanel)
      .append(containerPanel);
  }
};
