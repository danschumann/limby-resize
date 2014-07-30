/* 
 * MIT License
 *  You may use this code as long as you retain this notice.  Use at your own risk! :)
 *  https://github.com/danschumann/limby-resize
 */
var
  _      = require('underscore'),
  when = require('when'),
  nodefn = require('when/node/function');

module.exports = function(limbyResizer) {

  var im = _.clone(limbyResizer.config.imagemagick);

  _.each(['identify', 'convert', 'resize'], function(fnName) {
    im[fnName] = nodefn.lift(_.bind(im[fnName], im));
    im[fnName].path = fnName; // BUGFIX: imagemagick depends on a string of what bash command to run
  });

  limbyResizer._resize = function(path, options) {

    return when().then(function() {
      if (!options.width) return im.identify(['-format', '%wx%h_', path])
    })
    .then(function(output) {

      var args = [ path ];
      if (options.coalesce) args.push('-coalesce');
      args.push(
        '-resize', output ? output.split('_')[0] : options.width + 'x' + options.height,
        options.destination
      );

      return im.convert(args);

    });

  };
};
