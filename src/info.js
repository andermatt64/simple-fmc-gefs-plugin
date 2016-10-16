/*
 * Implements the info panel
 */

var BANNER = " _____  _                    _       ______ ___  ___ _____  \n" +
             "/  ___|(_)                  | |      |  ___||  \\/  |/  __ \\ \n" +
             "\\ `--.  _  _ __ ___   _ __  | |  ___ | |_   | .  . || /  \\/ \n" +
             " `--. \\| || '_ ` _ \\ | '_ \\ | | / _ \\|  _|  | |\\/| || |     \n" +
             "/\\__/ /| || | | | | || |_) || ||  __/| |    | |  | || \\__/\\ \n" +
             "\\____/ |_||_| |_| |_|| .__/ |_| \\___|\\_|    \\_|  |_/ \\____/ \n" +
             "                     | |                                    \n" +
             "                     |_|                                    \n";

var Info = {
  content: null,
  _uptime: null,
  _aircraft: null,
  _mass: null,

  init: function (content) {
    Info.content = content;

    var banner = $('<pre></pre>');
    banner
      .text(BANNER)
      .css('line-height', '1')
      .css('font-size', '8pt');

    Info._aircraft = $('<span></span>');
    Info._uptime = $('<span></span>');
    Info._mass = $('<span></span>');

    var label = $('<div></div>');
    label
      .text('AIRCRAFT: ')
      .append(Info._aircraft)
      .append($('<br>'))
      .append('WEIGHT: ')
      .append(Info._mass)
      .append($('<br>'))
      .append('UPTIME: ')
      .append(Info._uptime);

    Info.content
      .append(banner)
      .append(label);

    SimpleFMC.registerUpdate(Info.update);
  },

  update: function () {
    Info._aircraft
      .text(gefs.aircraft.name);
    Info._uptime
      .text(Log.uptime());
    Info._mass
      .text(gefs.aircraft.rigidBody.mass + 'KG');
  }
};
