'use strict';

var CompoundedImage = require( './CompoundedImage' );
var report          = require( './report' );

/**
 * @constructor v6.Image
 * @param {string|HTMLImageElement} url
 */
function Image ( url )
{

  var self = this;

  this.loaded = false;

  this.x = 0;
  this.y = 0;

  if ( typeof HTMLImageElement !== 'undefined' && url instanceof HTMLImageElement ) {
    if ( url.src ) {
      if ( url.complete ) {
        this.onload();
      } else if ( url.addEventListener ) {
        url.addEventListener( 'load', function onload ()
        {
          url.removeEventListener( 'load', onload );
          self.onload();
        } );
      } else {
        report( '`new v6.Image(image: HTMLImageElement)`: do `image.onload()` in your "load" event listener' );
      }

      this.url = url.src;
    } else {
      this.url = '';
    }

    this.image = url;
  } else if ( typeof url === 'string' ) {
    this.image = document.createElement( 'img' );
    this.url   = url;
    this.load();
  } else {
    throw TypeError( '`new v6.Image()`: first argument must be a string or HTMLImageElement object' );
  }

}

Image.prototype = {
  /**
   * @method v6.Image#onload
   * @return {void}
   */
  onload: function onload ( _e )
  {

    if ( _e ) {
      this.image.onload = null;
    }

    this.w = this.dw = this.image.width;  // eslint-disable-line no-multi-assign
    this.h = this.dh = this.image.height; // eslint-disable-line no-multi-assign

    this.loaded = true;

  },

  /**
   * @method v6.Image#load
   * @param {string} [url]
   * @chainable
   * @example
   * var image = new Image( document.createElement( 'img' ) )
   *   .load( './assets/whatrudoing.png' );
   */
  load: function load ( url )
  {
    if ( ! this.loaded ) {

      this.image.onload = this.onload.bind( this );
      this.image.src = this.url = ( this.url || url || '' ); // eslint-disable-line no-multi-assign, no-extra-parens

    }

    return this;
  },

  /**
   * @method v6.Image#get
   * @chainable
   * @see v6.CompoundedImage#get
   */
  get: function get ()
  {
    return this;
  },

  constructor: Image
};

/**
 * @method v6.Image.stretch
 * @param  {v6.Image|v6.CompoundedImage} image
 * @param  {number}                      w
 * @param  {number}                      h
 * @return {v6.CompoundedImage}
 */
Image.stretch = function stretch ( image, w, h )
{

  var x = h / image.h * image.w;

  // Stretch width (keep w, change h).

  if ( x < w ) {
    h = w / image.w * image.h;

  // Stretch height (change w, keep h).

  } else {
    w = x;
  }

  return new CompoundedImage( image.get(), image.x, image.y, image.w, image.h, w, h );

};

/**
 * @method v6.Image.cut
 * @param  {v6.Image|v6.CompoundedImage} image
 * @param  {number}                      x
 * @param  {number}                      y
 * @param  {number}                      dw
 * @param  {number}                      dh
 * @return {v6.CompoundedImage}
 */
Image.cut = function cut ( image, x, y, dw, dh )
{

  var w = image.w / image.dw * dw;
  var h = image.h / image.dh * dh;

  x += image.x;

  if ( x + w > image.x + image.w ) {
    throw Error( 'v6.Image.cut: cannot cut the image because the new image X or W is out of bounds' );
  }

  y += image.y;

  if ( y + h > image.y + image.h ) {
    throw Error( 'v6.Image.cut: cannot cut the image because the new image Y or H is out of bounds' );
  }

  return new CompoundedImage( image.get(), x, y, w, h, dw, dh );

};

module.exports = Image;
