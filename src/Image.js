'use strict';

var bind = require( 'peako/bind' );

var CompoundedImage = require( './CompoundedImage' );

var report = require( './report' );

/**
 * @param {string|HTMLImageElement} url
 */
function Image ( url ) {

  this.loaded = false;

  this.x = 0;
  this.y = 0;

  if ( typeof window !== 'undefined' && url instanceof window.HTMLImageElement ) {
    if ( url.src ) {
      if ( url.complete ) {
        this._onload();
      } else if ( url.onload === null ) {
        url.onload = bind( this._onload, this );
      } else {
        report( 'In new v6.Image: you should manually set "loaded" property if you are using "new v6.Image( image )" with "onload" listener' );
      }

      this.url = url.src;
    } else {
      this.url = '';
    }

    this.image = url;
  } else if ( typeof url === 'string' ) {
    this.image = document.createElement( 'img' );
    this.url = url;
    this.load();
  } else {
    throw TypeError( 'In new v6.Image: first argument must be a string or a HTMLImageElement object' );
  }

}

Image.prototype = {
  _onload: function _onload ( e ) {

    if ( e ) {
      this.image.onload = null;
    }

    this.loaded = true;

    this.w = this.image.width;
    this.h = this.image.height;

  },

  /*
   * @returns {v6.Image}
   */
  load: function load () {

    if ( this.loaded ) {
      return this;
    }

    this.image.onload = this._onload;

    this.image.src = this.url;

    return this;

  },

  /**
   * tl;dr: Just the exit-function from v6.CompoundedImage#get() recursion.
   *
   * Since v6.Image functions (static) can work with both v6.Image and
   * v6.CompoundedImage, a source object (v6.Image) can be required in them.
   * Thus, there is v6.CompoundedImage#get(), which starts a recursion through
   * intermediate objects (v6.CompoundedImage) and v6.Image#get(), which stop it
   * as the source object (v6.Image).
   *
   * @returns {v6.Image}
   * @see v6.CompoundedImage#get()
   */
  get: function get () {
    return this;
  },

  constructor: Image
};

/**
 * @param {v6.Image|v6.CompoundedImage} image
 * @param {number} w
 * @param {number} h
 * @returns {v6.CompoundedImage}
 */
Image.stretch = function stretch ( image, w, h ) {

  var x = h / image.h * image.w;

  // stretch width (keep w, change h)

  if ( x < w ) {
    h = w / image.w * image.h;

  // stretch height (change w, keep h)

  } else {
    w = x;
  }

  return new CompoundedImage( image.get(), image.x, image.y, w, h );

};

/**
 * @param {v6.Image|v6.CompoundedImage} image
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @returns {v6.CompoundedImage}
 */
Image.cut = function cut ( image, x, y, w, h ) {

  x += image.x;

  if ( x + w > image.x + image.w ) {
    throw Error( 'In v6.Image.cut: cannot cut the image because the new image W is out of bounds' );
  }

  y += image.y;

  if ( y + h > image.y + image.h ) {
    throw Error( 'In v6.Image.cut: cannot cut the image because the new image H is out of bounds' );
  }

  return new CompoundedImage( image.get(), x, y, w, h );

};

module.exports = Image;
