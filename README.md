limby-resize
============

    npm install limby-resize
    
    
### Resize with `canvas` or `imagemagick` node modules.

Wrapper for both.


#### Better resizing with `canvas`

Normally, resizing with `canvas` produces some not so great images.  This module implements it's own resizing algorithm.


##### Math behind the algorithm

lets say we have 3 pixels being resized into 2 pixels.

normally, each pixel will have 4 numbers: red, green, blue, alpha.  Lets just look at a simplified version where pixels are just 1 number.

Lets say the original image is (these represent 3 different pixels, separated by |):

`0  |  100  | 255`

The regular canvas drawImage resize will grab nearest neighbor and produce

`0 | 100`   or
`0 | 255`

This sometimes is fine, but it loses details and it can be a very ugly and jagged image.
If you think about it, the sum of all the color in the original is 355 (0 + 100 + 255), leaving the average pixel 118.33.  The resized average pixel would be 50 or 127.5, which could look okay or very different!

The image algorithm implemented in `limby-resize` will produce a similar image to imagemagick, keeping all the pixel data, so the average pixel will be the same.

Our algorithm would produce the following image:

`33  | 201.3`

`(0 * .66 + 100 * .33) | (100 * .33 + 255 * .66)`

The total in ours is 234.3, leaving the average of 117.15, which is going to equal the first image ( if we weren't rounding to 2 decimals for this example ).

#### tl;dr

This image resizer is better than the default canvas drawImage, but it is slower and slightly processor intensive.

Overall, this library wraps both `imagemagic` and `canvas` so you can switch out either one at a whim


## Usage


### Canvas

```javascript
    var resizer = require('limby-resize')({
      canvas: require('canvas'),
    });
    
    resizer.resize('/tmp/image01.jpg', {
      width: 300,
      height: 500,
      destination: '/uploads/myimage.jpg',
    });
```    
    
### Image Magick

```javascript
    var resizer = require('limby-resize')({
      imagemagick: require('imagemagick'),
    });
    
    resizer.resize('/tmp/myanimation.gif', {
      width: 300,
      height: 500,
      coalesce: true, // animated gif support ( if your image magick supports )
      destination: '/uploads/myanimation.gif',
    });
    
    // [0] takes first frame for previews, etc
    resizer.resize('/tmp/myanimation.gif[0]', {
      width: 300,
      height: 500,
      destination: '/uploads/myanimation_preview.gif',
    });
```

    
*Note:*  If you scale up ( make a bigger image ), it will bypass the algorithm and use default `drawImage`

* Gif support only for image magick at the moment

canvas will just take the first frame, similar to using `[0]` with image magick


### Browser support

_DEMO_
http://jsbin.com/palota/1/
http://jsbin.com/palota/1/edit?html,js,output

![How it looks](https://cloud.githubusercontent.com/assets/1516973/6985039/73b5fb4e-d9f4-11e4-921b-6fc873fa0b45.png)

`lib/canvas_resize.js` should be able to be included on the frontend for better resizing client side.  

```javascript
    var img, canvas, resized;
    img = new Image;
    img.onload = function(){
      canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
      resized = document.createElement('canvas');
      resized.width = 300;
      resized.height = 500;
      // see lib/canvas_resize for window.canvasResize = function(){...}
      canvasResize(canvas, resized, function(){
        // resized will now be a properly resized version of canvas
      });
    }
    
    img.src = '/path/to/img.jpg';
```
