/*
 * Implements the FMC log
 */

var Log = {
  content: null,
  startTime: null,

  init: function (content) {
    Log.content = content;
    Log.content
      .css('overflow-y', 'scroll')
      .css('overflow-x', 'auto')
      .css('line-height', '1.3')
      .css('height', '290px');
    Log.startTime = Date.now();
  },

  info: function (msg) {
    Log._write(Log._entry('#9be651', msg));
  },

  warning: function (msg) {
    Log._write(Log._entry('#ffc300', msg));
  },

  error: function (msg) {
    Log._write(Log._entry('#d14537', msg));
  },

  clear: function () {
    Log.content.empty();
  },

  uptime: function () {
    var timeDeltaSeconds = parseInt((Date.now() - Log.startTime) / 1000);
    var hours = parseInt(timeDeltaSeconds / 3600).toString();
    if (hours.length === 1) {
      hours = '0' + hours;
    }

    var mins = parseInt((timeDeltaSeconds % 3600) / 60).toString();
    if (mins.length === 1) {
      mins = '0' + mins;
    }

    var secs = parseInt((timeDeltaSeconds % 3600) % 60).toString();
    if (secs.length === 1) {
      secs = '0' + secs;
    }

    return hours + ':' + mins + ':' + secs;
  },
  
  _entry: function (color, msg) {
    var entry = $('<div></div>');

    var stamp = $('<span></span>');
    stamp
      .css('color', '#0f0')
      .css('font-size', '8pt')
      .css('margin-right', '4px')
      .text('[' + Log.uptime() + ']');

    var item = $('<span></span>');
    item
      .css('color', color)
      .text(msg);
    entry
      .append(stamp)
      .append(item);
    return entry;
  },

  _write: function (entry) {
    Log.content.prepend(entry);
  }
};
