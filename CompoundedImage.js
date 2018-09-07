'use strict';

/**
 * @constructor module:"v6.js".CompoundedImage
 * @param {module:"v6.js".Image|module:"v6.js".CompoundedImage} image
 * @param {number}                                              x
 * @param {number}                                              y
 * @param {number}                                              w
 * @param {number}                                              h
 * @param {number}                                              dw
 * @param {number}                                              dh
 */
function CompoundedImage ( image, x, y, w, h, dw, dh ) {
  this.image = image;
  this.x     = x;
  this.y     = y;
  this.w     = w;
  this.h     = h;
  this.dw    = dw;
  this.dh    = dh;
}

CompoundedImage.prototype = {
  /**
   * @method module:"v6.js".CompoundedImage#get
   * @return {module:"v6.js".Image}
   */
  get: function get () {
    return this.image.get();
  },

  constructor: CompoundedImage
};

module.exports = CompoundedImage;
