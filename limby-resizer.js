(function(){

  var limbyResizer;
  limbyResizer = function(config) {

  };

  limbyResizer.prototype.resize = function() {

  };

  // Allow for use with browser or node.js
  if (typeof window) {
    window.limbyResizer = limbyResizer;
  } else {
    module.exports = limbyResizer;
  };

})();
