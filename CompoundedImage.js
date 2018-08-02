'use strict';

/**
 * @param {v6.Image|v6.CompoundedImage} image
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function CompoundedImage ( image, x, y, w, h, dw, dh ) {

  this.image = image;

  this.x = x;
  this.y = y;

  this.w = w;
  this.h = h;

  this.dw = dw;
  this.dh = dh;

}

CompoundedImage.prototype = {
  get: function get () {
    return this.image.get();
  },

  constructor: CompoundedImage
};

module.exports = CompoundedImage;
