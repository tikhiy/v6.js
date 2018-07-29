'use strict';

var defaults = require( 'peako/defaults' );

var rendererOptions = require( './rendererOptions' ),
    constants       = require( './constants' ),
    Renderer        = require( './Renderer' ),
    _align          = require( './_align' );

function Renderer2D ( options ) {

  options = defaults( rendererOptions, options );

  Renderer.call( this, options, constants.MODE_2D );

  this.smooth( this.settings.smooth );

  this.matrix = this.context;

  this._beginPath = false;

}

Renderer2D.prototype = Object.create( Renderer.prototype );

Renderer2D.prototype.smooth = ( function () {
  var names = [
    'webkitImageSmoothingEnabled',
    'mozImageSmoothingEnabled',
    'msImageSmoothingEnabled',
    'oImageSmoothingEnabled',
    'imageSmoothingEnabled'
  ];

  /**
   * @param {boolean} bool
   */
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
} )();

/**
 * @param {number|string|v6.RGBA|v6.HSLA} r
 * @param {number} g
 * @param {number} b
 * @param {number} a
 */
Renderer2D.prototype.backgroundColor = function backgroundColor ( r, g, b, a ) {

  var context = this.context;

  context.save();
  context.setTransform( this.settings.scale, 0, 0, this.settings.scale, 0, 0 );
  context.fillStyle = new this.settings.color( r, g, b, a );
  context.fillRect( 0, 0, this.w, this.h );
  context.restore();

  return this;

};

/**
 * @param {v6.Image|v6.CompoundedImage} image
 */
Renderer2D.prototype.backgroundImage = function backgroundImage ( image ) {

  var _rectAlignX = this._rectAlignX,
      _rectAlignY = this._rectAlignY;

  this._rectAlignX = 'left';
  this._rectAlignY = 'top';

  this.image( Image.stretch( image, this.w, this.h ), 0, 0 );

  this._rectAlignX = _rectAlignX;
  this._rectAlignY = _rectAlignY;

  return this;

};

Renderer2D.prototype.clear = function clear ( x, y, w, h ) {

  if ( typeof x === 'undefined' ) {
    x = y = 0;
    w = this.w;
    h = this.h;
  } else {
    x = Math.floor( _align( x, w, this._rectAlignX ) );
    y = Math.floor( _align( y, h, this._rectAlignY ) );
  }

  this.context.clearRect( x, y, w, h );

  return this;

};

Renderer2D.prototype.vertices = function vertices ( verts, count, _mode, _sx, _sy ) {
  var context = this.context,
      i;

  if ( count < 2 ) {
    return this;
  }

  if ( _sx == null ) {
    _sx = _sy = 1;
  }

  context.beginPath();
  context.moveTo( verts[ 0 ] * _sx, verts[ 1 ] * _sy );

  for ( i = 2, count *= 2; i < count; i += 2 ) {
    context.lineTo( verts[ i ] * _sx, verts[ i + 1 ] * _sy );
  }

  if ( this._doFill ) {
    this._fill();
  }

  if ( this._doStroke && this._lineW > 0 ) {
    this._stroke( true );
  }

  return this;
};

Renderer2D.prototype._fill = function _fill () {
  this.context.fillStyle = this._fillColor;
  this.context.fill();
};

Renderer2D.prototype._stroke = function ( close ) {
  var context = this.context;

  if ( close ) {
    context.closePath();
  }

  context.strokeStyle = this._strokeColor;

  if ( ( context.lineWidth = this._lineW ) <= 1 ) {
    context.stroke();
  }

  context.stroke();
};

Renderer2D.prototype.constructor = Renderer2D;

module.exports = Renderer2D;
