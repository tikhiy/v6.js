'use strict';

var defaults = require( 'peako/defaults' );

var constants = require( './constants' );

var Renderer = require( './Renderer' );

var o = require( './options' );

/**
 * @param {v6.options.renderer} options
 */
function Renderer2D ( options ) {

  options = defaults( options, o.renderer );

  Renderer.call( this, options, constants.MODE_2D );

  this.smooth( this.settings.smooth );

  this.matrix = this.context;

  this._beginPath = false;

}

Renderer2D.prototype = Object.create( Renderer.prototype );

Renderer2D.prototype = {

  /**
   * @param {boolean} bool
   */
  smooth: ( function () {
    var names = [
      'webkitImageSmoothingEnabled',
      'mozImageSmoothingEnabled',
      'msImageSmoothingEnabled',
      'oImageSmoothingEnabled',
      'imageSmoothingEnabled'
    ];

    return function smooth ( bool ) {

      var i;

      if ( typeof bool !== 'boolean' ) {
        throw TypeError( 'First argument in smooth( bool ) must be a boolean' );
      }

      for ( i = names.length - 1; i >= 0; --i ) {
        if ( names[ i ] in this.context ) {
          this.context[ names[ i ] ] = bool;
        }
      }

      this.settings.smooth = bool;

      return this;

    };
  } )(),

  /**
   * @param {number|string|v6.RGBA|v6.HSLA} r
   * @param {number} g
   * @param {number} b
   * @param {number} a
   */
  backgroundColor: function backgroundColor ( r, g, b, a ) {

    var context = this.context;

    context.save();
    context.setTransform( this.settings.scale, 0, 0, this.settings.scale, 0, 0 );
    context.fillStyle = this.color( r, g, b, a );
    context.fillRect( 0, 0, this.w, this.h );
    context.restore();

    return this;

  },

  /**
   * @param {v6.Image|v6.CompoundedImage} image
   */
  backgroundImage: function backgroundImage ( image ) {

    var _rectAlignX = this._rectAlignX,
        _rectAlignY = this._rectAlignY;

    this._rectAlignX = 'left';
    this._rectAlignY = 'top';

    this.image( Image.stretch( image, this.w, this.h ), 0, 0 );

    this._rectAlignX = _rectAlignX;
    this._rectAlignY = _rectAlignY;

    return this;

  },

  constructor: Renderer2D
};

module.exports = Renderer2D;
