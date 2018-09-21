'use strict';

var defaults  = require( 'peako/defaults' );
var constants = require( './constants' );
var AbstractRenderer  = require( './AbstractRenderer' );
var _options  = require( './options' );
var align     = require( './internal/align' );

function Renderer2D ( options ) {

  options = defaults( _options, options );

  AbstractRenderer.call( this, options, constants.RENDERER_2D );

  this.matrix = this.context;

  this._beginPath = false;

}

Renderer2D.prototype = Object.create( AbstractRenderer.prototype );
Renderer2D.prototype.constructor = Renderer2D;

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
 * @example
 * var Image = require( 'v6.js/Image' );
 * var image = new Image( './assets/background.jpg' );
 * renderer.backgroundImage( Image.stretch( image, renderer.w, renderer.h ) );
 */
Renderer2D.prototype.backgroundImage = function backgroundImage ( image ) {

  var _rectAlignX = this._rectAlignX,
      _rectAlignY = this._rectAlignY;

  this._rectAlignX = constants.CENTER;
  this._rectAlignY = constants.MIDDLE;

  this.image( image, this.w * 0.5, this.h * 0.5 );

  this._rectAlignX = _rectAlignX;
  this._rectAlignY = _rectAlignY;

  return this;

};

Renderer2D.prototype.image = function image ( image, x, y, w, h ) {

  if ( image.get().loaded ) {

    if ( typeof w === 'undefined' ) {
      w = image.dw;
    }

    if ( typeof h === 'undefined' ) {
      h = image.dh;
    }

    x = Math.floor( align( x, w, this._rectAlignX ) );
    y = Math.floor( align( y, h, this._rectAlignY ) );

    this.context.drawImage( image.get().image, image.x, image.y, image.w, image.h, x, y, w, h );

  }

  return this;

};

Renderer2D.prototype.clear = function clear ( x, y, w, h ) {

  if ( typeof x === 'undefined' ) {
    x = y = 0;
    w = this.w;
    h = this.h;
  } else {
    x = Math.floor( align( x, w, this._rectAlignX ) );
    y = Math.floor( align( y, h, this._rectAlignY ) );
  }

  this.context.clearRect( x, y, w, h );

  return this;

};

Renderer2D.prototype.rect = function rect ( x, y, w, h ) {

  x = Math.floor( align( x, w, this._rectAlignX ) );
  y = Math.floor( align( y, h, this._rectAlignY ) );

  if ( this._beginPath ) {
    this.context.rect( x, y, w, h );
  } else {
    this.context.beginPath();
    this.context.rect( x, y, w, h );

    if ( this._doFill ) {
      this._fill();
    }

    if ( this._doStroke ) {
      this._stroke();
    }
  }

  return this;

};

Renderer2D.prototype.arc = function arc ( x, y, r ) {

  if ( this._beginPath ) {
    this.context.arc( x, y, r, 0, Math.PI * 2, false );
  } else {
    this.context.beginPath();
    this.context.arc( x, y, r, 0, Math.PI * 2, false );

    if ( this._doFill ) {
      this._fill();
    }

    if ( this._doStroke ) {
      this._stroke( true );
    }
  }

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

module.exports = Renderer2D;
