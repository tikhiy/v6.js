'use strict';

var defaultTo = require( 'peako/default-to' );

var Vector2D  = require( '../math/Vector2D' );

function Camera ( renderer, options )
{
  if ( ! options ) {
    options = {};
  }

  this.xSpeed           = defaultTo( options.xSpeed, 1 );
  this.ySpeed           = defaultTo( options.ySpeed, 1 );
  this.zoomInSpeed      = defaultTo( options.zoomInSpeed,  1 );
  this.zoomOutSpeed     = defaultTo( options.zoomOutSpeed, 1 );

  this.zoom             = defaultTo( options.zoom,    1 );
  this.minZoom          = defaultTo( options.minZoom, 1 );
  this.maxZoom          = defaultTo( options.maxZoom, 1 );

  this.linearZoomIn     = defaultTo( options.linearZoomIn,  true );
  this.linearZoomOut    = defaultTo( options.linearZoomOut, true );

  this.offset           = options.offset;

  if ( renderer ) {
    if ( ! this.offset ) {
      this.offset = new Vector2D( renderer.w * 0.5, renderer.h * 0.5 );
    }

    this.renderer = renderer;
  } else if ( ! this.offset ) {
    this.offset = new Vector2D();
  }

  this.position = [
    0, 0,
    0, 0,
    0, 0
  ];
}

Camera.prototype = {
  update: function update ()
  {
    var pos = this.position;

    if ( pos[ 0 ] !== pos[ 2 ] ) {
      pos[ 0 ] += ( pos[ 2 ] - pos[ 0 ] ) * this.xSpeed;
    }

    if ( pos[ 1 ] !== pos[ 3 ] ) {
      pos[ 1 ] += ( pos[ 3 ] - pos[ 1 ] ) * this.ySpeed;
    }

    return this;
  },

  lookAt: function lookAt ( at )
  {
    var pos = this.position;
    var off = this.offset;

    pos[ 2 ] = off.x / this.zoom - at.x;
    pos[ 3 ] = off.y / this.zoom - at.y;
    pos[ 4 ] = at.x;
    pos[ 5 ] = at.y;

    return this;
  },

  shouldLookAt: function shouldLookAt ()
  {
    return new Vector2D( this.position[ 4 ], this.position[ 5 ] );
  },

  looksAt: function looksAt ()
  {
    var x = ( this.offset.x - this.position[ 0 ] * this.zoom ) / this.zoom;
    var y = ( this.offset.y - this.position[ 1 ] * this.zoom ) / this.zoom;
    return new Vector2D( x, y );
  },

  sees: function sees ( x, y, w, h, renderer )
  {
    var off = this.offset;
    var at  = this.looksAt();

    if ( ! renderer ) {
      renderer = this.renderer;
    }

    return x + w > at.x - off.x / this.zoom &&
           x     < at.x + ( renderer.w - off.x ) / this.zoom &&
           y + h > at.y - off.y / this.zoom &&
           y     < at.y + ( renderer.h - off.y ) / this.zoom;
  },

  zoomIn: function zoomIn ()
  {
    var speed;

    if ( this.zoom !== this.maxZoom ) {
      if ( this.linearZoomIn ) {
        speed = this.zoomInSpeed * this.zoom;
      } else {
        speed = this.zoomInSpeed;
      }

      this.zoom = Math.min( this.zoom + speed, this.maxZoom );
    }
  },

  zoomOut: function zoomOut ()
  {
    var speed;

    if ( this.zoom !== this.minZoom ) {
      if ( this.linearZoomOut ) {
        speed = this.zoomOutSpeed * this.zoom;
      } else {
        speed = this.zoomOutSpeed;
      }

      this.zoom = Math.max( this.zoom - speed, this.minZoom );
    }
  },

  constructor: Camera
};

module.exports = Camera;
