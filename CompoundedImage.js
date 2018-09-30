'use strict';

/**
 * @constructor v6.CompoundedImage
 * @param {v6.Image|v6.CompoundedImage} image
 * @param {number}                      x
 * @param {number}                      y
 * @param {number}                      w
 * @param {number}                      h
 * @param {number}                      dw
 * @param {number}                      dh
 */
function CompoundedImage ( image, x, y, w, h, dw, dh )
{
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
   * @method v6.CompoundedImage#get
   * @return {v6.Image}
   */
  get: function get ()
  {
    return this.image.get();
  },

  constructor: CompoundedImage
};

module.exports = CompoundedImage;
