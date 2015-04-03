// for this example, include:
// https://rawgit.com/danschumann/limby-resize/master/lib/canvas_resize.js
// jquery
// this file
//
// Then upload an image to test
$(function(){
  var originalCanvas = $("<canvas>")[0];
  var originalContext = originalCanvas.getContext('2d');

  var crappyCanvas = $("<canvas>")[0];
  var crappyContext = crappyCanvas.getContext('2d');

  var goodCanvas = $("<canvas>")[0];
  var goodContext = goodCanvas.getContext('2d');

  $container = $('<div style="background: #ddd; padding 5px; margin: 10px" />');

  var $goodContainer = $container.clone().append(
    'Good:',
    goodCanvas
  );

  var $factor = $('<input value=".1">');

  $('body').append(
    $container.clone().append(
      'Scale down by: ',
      $factor
    ),
    $container.clone().append(
      $('<input type="file" id="fileUpload" />')
    ),
    $container.clone().append(
      'Original:',
      originalCanvas
    ),
    $container.clone().append(
      'Crappy:',
      crappyCanvas
    ),
    $goodContainer
  );

  function readImage() {
    if ( this.files && this.files[0] ) {
    var FR= new FileReader();
    FR.onload = function(e) {

      var img = new Image();
        img.onload = function() {
          draw(img);
        };
        img.src = e.target.result;
      };       
      FR.readAsDataURL( this.files[0] );
    }
  }

  function draw(img) {
    originalCanvas.width = img.width;
    originalCanvas.height = img.height;
    factor = parseFloat($factor.val());
    if (!(factor>0 && factor<1)) alert('Scale down must be between 0 and 1');

    crappyCanvas.width = goodCanvas.width = Math.floor(img.width * factor);
    crappyCanvas.height = goodCanvas.height = Math.floor(img.height * factor);

    originalContext.drawImage(img, 0, 0);
    crappyContext.drawImage(img, 0, 0, crappyCanvas.width, crappyCanvas.height);

    var $processing = $('<div>Processing...</div>').appendTo($goodContainer);
    canvasResize(originalCanvas, goodCanvas, function(){
      console.log('resized!');
      $processing.remove();
    });
  }

  document.getElementById("fileUpload").addEventListener("change", readImage, false);
});
