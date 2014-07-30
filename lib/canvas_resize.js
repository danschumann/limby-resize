/* 
 * MIT License
 *  You may use this code as long as you retain this notice.  Use at your own risk! :)
 *  https://github.com/danschumann/limby-resize
 */
var canvasResize = function(original, canvas) {

  var
    w1 = original.width,
    h1 = original.height,
    w2 = canvas.width,
    h2 = canvas.height,
    img = original.getContext("2d").getImageData(0, 0, w1, h1),
    img2 = canvas.getContext("2d").getImageData(0, 0, w2, h2);

  var data = img.data;
  // we don't use this much, as working with doubles isn't great
  var _data2 = img2.data;

  // We enforce float type for every entity in the array
  // this prevents weird faded lines when things get rounded off
  var data2 = Array(_data2.length);
  var alphas = Array(_data2.length >> 2);
  for (var i = 0; i < _data2.length; i++){
    data2[i] = 0.0;
  }
  for (var i = 0; i < _data2.length >> 2; i++){
    alphas[i] = 1;
  }

  // when resizing down, this will be decimal
  var xScale = w2 / w1;
  var yScale = h2 / h1;

  for (var y1 = 0; y1 < h1; y1++){
    for (var x1 = 0; x1 < w1; x1++) {

      var
        extraX = false,
        extraY = false,
        xFactor = xScale,
        yFactor = yScale,
        bottomFactor = 0,
        rightFactor = 0,
        targetX = Math.floor(x1 * xScale),
        targetY = Math.floor(y1 * yScale);

      offset = (y1 * w1 + x1) * 4; 
      targetOffset = (targetY * w2 + targetX) * 4;

      // Right side goes into another pixel 
      // .99999 to ensure equal sides round down to the same
      if (targetX < Math.floor((x1 + 1) * xScale)) {

        rightFactor = (((x1 + 1) * xScale) % 1);
        xFactor -= rightFactor;

        extraX = true;

      }

      // Right side goes into another pixel
      if (targetY < Math.floor((y1 + 1) * yScale)) {

        bottomFactor = (((y1 + 1) * yScale) % 1);
        yFactor -= bottomFactor;

        extraY = true;

      }

      var a;

      a = (data[offset + 3] / 255);

      alphaOffset = targetOffset >> 2

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
  };

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

};

// Allow for use with browser or node.js
if ('undefined' !== typeof window) {
  window.canvasResize = canvasResize;
} else {
  module.exports = canvasResize;
};
