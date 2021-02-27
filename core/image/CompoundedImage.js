'use strict';

var AbstractImage = require( './AbstractImage' );

/**
 * @constructor v6.CompoundedImage
 * @extends v6.AbstractImage
 * @param {v6.AbstractImage} image v6.CompoundedImage or v6.Image.
 * @param {nubmer}           sx    Source X.
 * @param {nubmer}           sy    Source Y.
 * @param {nubmer}           sw    Source Width.
 * @param {nubmer}           sh    Source Height.
 * @param {nubmer}           dw    Destination Width.
 * @param {nubmer}           dh    Destination Height.
 */
function CompoundedImage ( image, sx, sy, sw, sh, dw, dh )
{
  this.image = image;
  this.sx    = sx;
  this.sy    = sy;
  this.sw    = sw;
  this.sh    = sh;
  this.dw    = dw;
  this.dh    = dh;
}

CompoundedImage.prototype = Object.create( AbstractImage.prototype );
CompoundedImage.prototype.constructor = CompoundedImage;

/**
 * @override
 * @method v6.CompoundedImage#get
 */
CompoundedImage.prototype.get = function get ()
{
  return this.image.get();
};

module.exports = CompoundedImage;
