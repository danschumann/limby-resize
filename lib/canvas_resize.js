/* 
 * MIT License
 *  You may use this code as long as you retain this notice.  Use at your own risk! :)
 *  https://github.com/danschumann/limby-resize
 *  0.0.8
 */
(function(){
  var isNode = !(typeof process == 'undefined' || !process.versions);

  return (function(_module, namespace) {

    // assigns to module.exports | window.canvasResize
    _module[namespace] = function(original, canvas, callback) {

      var
        w1 = original.width,
        h1 = original.height,
        w2 = canvas.width,
        h2 = canvas.height,
        img = original.getContext("2d").getImageData(0, 0, w1, h1),
        img2 = canvas.getContext("2d").getImageData(0, 0, w2, h2);

      if (w2 > w1 || h2 > h1) {
        canvas.getContext('2d').drawImage(original, 0, 0, w2, h2);
        return callback();
      };


      var data = img.data;
      // it's an _ because we don't use it much, as working with doubles isn't great
      var _data2 = img2.data;
      // Instead, we enforce float type for every entity in the array
      // this prevents weird faded lines when things get rounded off
      var data2 = Array(_data2.length);
      for (var i = 0; i < _data2.length; i++){
        data2[i] = 0.0;
      }

      // We track alphas, since we need to use alphas to correct colors later on
      var alphas = Array(_data2.length >> 2);
      for (var i = 0; i < _data2.length >> 2; i++){
        alphas[i] = 1;
      }

      // this will always be between 0 and 1
      var xScale = w2 / w1;
      var yScale = h2 / h1;

      var deferred;

      // We process 1 row at a time ( and then let the process rest for 0ms [async] )
      var nextY = function(y1){
        for (var x1 = 0; x1 < w1; x1++) {

          var

            // the original pixel is split between two pixels in the output, we do an extra step
            extraX = false,
            extraY = false,

            // the output pixel
            targetX = Math.floor(x1 * xScale),
            targetY = Math.floor(y1 * yScale),

            // The percentage of this pixel going to the output pixel (this gets modified)
            xFactor = xScale,
            yFactor = yScale,

            // The percentage of this pixel going to the right neighbor or bottom neighbor
            bottomFactor = 0,
            rightFactor = 0,

            // positions of pixels in the array
            offset = (y1 * w1 + x1) * 4,
            targetOffset = (targetY * w2 + targetX) * 4;

          // Right side goes into another pixel 
          if (targetX < Math.floor((x1 + 1) * xScale)) {

            rightFactor = (((x1 + 1) * xScale) % 1);
            xFactor -= rightFactor;

            extraX = true;

          }

          // Bottom side goes into another pixel
          if (targetY < Math.floor((y1 + 1) * yScale)) {

            bottomFactor = (((y1 + 1) * yScale) % 1);
            yFactor -= bottomFactor;

            extraY = true;

          }

          var a;

          a = (data[offset + 3] / 255);

          alphaOffset = targetOffset / 4;

          if (extraX) {

            // Since we're not adding the color of invisible pixels,  we multiply by a
            data2[targetOffset + 4] += data[offset] * rightFactor * yFactor * a;
            data2[targetOffset + 5] += data[offset + 1] * rightFactor * yFactor * a;
            data2[targetOffset + 6] += data[offset + 2] * rightFactor * yFactor * a;

            data2[targetOffset + 7] += data[offset + 3] * rightFactor * yFactor;

            // if we left out the color of invisible pixels(fully or partly)
            // the entire average we end up with will no longer be out of 255
            // so we subtract the percentage from the alpha ( originally 1 )
            // so that we can reverse this effect by dividing by the amount.
            // ( if one pixel is black and invisible, and the other is white and visible,
            // the white pixel will weight itself at 50% because it does not know the other pixel is invisible
            // so the total(color) for the new pixel would be 128(gray), but it should be all white.
            // the alpha will be the correct 128, combinging alphas, but we need to preserve the color 
            // of the visible pixels )
            alphas[alphaOffset + 1] -= (1 - a) * rightFactor * yFactor;
          }

          if (extraY) {
            data2[targetOffset + w2 * 4]     += data[offset] * xFactor * bottomFactor * a;
            data2[targetOffset + w2 * 4 + 1] += data[offset + 1] * xFactor * bottomFactor * a;
            data2[targetOffset + w2 * 4 + 2] += data[offset + 2] * xFactor * bottomFactor * a;

            data2[targetOffset + w2 * 4 + 3] += data[offset + 3] * xFactor * bottomFactor;

            alphas[alphaOffset + w2] -= (1 - a) * xFactor * bottomFactor;
          }

          if (extraX && extraY) {
            data2[targetOffset + w2 * 4 + 4]     += data[offset] * rightFactor * bottomFactor * a;
            data2[targetOffset + w2 * 4 + 5] += data[offset + 1] * rightFactor * bottomFactor * a;
            data2[targetOffset + w2 * 4 + 6] += data[offset + 2] * rightFactor * bottomFactor * a;

            data2[targetOffset + w2 * 4 + 7] += data[offset + 3] * rightFactor * bottomFactor;

            alphas[alphaOffset + w2 + 1] -= (1 - a) * rightFactor * bottomFactor;
          }
            
          data2[targetOffset]     += data[offset] * xFactor * yFactor * a;
          data2[targetOffset + 1] += data[offset + 1] * xFactor * yFactor * a;
          data2[targetOffset + 2] += data[offset + 2] * xFactor * yFactor * a;

          data2[targetOffset + 3] += data[offset + 3] * xFactor * yFactor;

          alphas[alphaOffset] -= (1 - a) * xFactor * yFactor;
        };

        if (y1++ < h1) {
          // Big images shouldn't block for a long time.
          // This breaks up the process and allows other processes to tick
          setTimeout(function(){
            nextY(y1)
          }, 0);
        } else
          done();

      };

      var done = function(){

        // fully distribute the color of pixels that are partially full because their neighbor is transparent
        // (i.e. undo the invisible pixels are averaged with visible ones)
        for (var i = 0; i < (_data2.length >> 2); i++){
          if (alphas[i] && alphas[i] < 1) {
            data2[(i<<2)] /= alphas[i];     // r
            data2[(i<<2) + 1] /= alphas[i]; // g
            data2[(i<<2) + 2] /= alphas[i]; // b
          }
        }

        // re populate the actual imgData
        for (var i = 0; i < data2.length; i++){
          _data2[i] = Math.round(data2[i]);
        }

        var context = canvas.getContext("2d")
        context.putImageData(img2, 0, 0);
        callback();

      };

      // Start processing the image at row 0
      nextY(0);

    };

  })( isNode ? module : window, isNode ? 'exports' : 'canvasResize');
})()
