/*
 * Implements the FMC log
 */

var Log = {
  content: null,

  init: function (content) {
    Log.content = content;
    Log.content
      .css('overflow-y', 'scroll')
      .css('overflow-x', 'auto')
      .css('line-height', '1.3')
      .css('height', '290px');
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

  _entry: function (color, msg) {
    var entry = $('<div></div>');
    entry
      .css('color', color)
      .text(msg);
    return entry;
  },

  _write: function (entry) {
    Log.content.prepend(entry);
  }
};
