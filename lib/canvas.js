/* 
 * MIT License
 *  You may use this code as long as you retain this notice.  Use at your own risk! :)
 *  https://github.com/danschumann/limby-resize
 */
var
  _      = require('underscore'),
  when = require('when'),
  fs    = require('final-fs'),
  canvasResize = require('./canvas_resize'),
  nodefn = require('when/node/function');

module.exports = function(limbyResizer) {

  var Canvas = limbyResizer.config.canvas;

  limbyResizer._resize = function(path, options) {

    var img;

    return fs.readFile(path)
    .then(function(data) {
      img = new Canvas.Image;
      img.src = data;
    })
    .then(function() {

      var width = img.width, height = img.height;

      var canvas = new Canvas(width, height);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      var resizedCanvas;

      if (options.width) {

        if (options.constrain === false) {
          resizedCanvas = new Canvas(options.width, options.height);
        } else {
          // We take the smaller of the two ratios to ensure it fits within our options
          var ratio = Math.min(options.width / img.width, options.height / img.height);

          width  = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
          resizedCanvas = new Canvas(width, height);
        }

        return when.promise(function(resolve, reject){
          canvasResize(canvas, resizedCanvas, function(){
            (resizedCanvas || canvas).toBuffer(function(err, buf){
              fs.writeFile(options.destination, buf)
                .then(resolve).otherwise(reject);
            });

          });
        });
      };

    })
    .otherwise(function(er){
      console.log('limby-resize: error processing image', er, er.stack);
    });

  };

};
