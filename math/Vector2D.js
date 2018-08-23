'use strict';

var settings = require( '../settings' );

function Vector2D ( x, y ) {
  this.set( x, y );
}

Vector2D.prototype = {
  set: function set ( x, y ) {

    this.x = x || 0;
    this.y = y || 0;

    return this;

  },

  setVector: function setVector ( vector ) {
    return this.set( vector.x, vector.y );
  },

  lerp: function ( x, y, value ) {

    this.x += ( x - this.x ) * value || 0;
    this.y += ( y - this.y ) * value || 0;

    return this;

  },

  lerpVector: function lerpVector ( vector, value ) {

    var x = vector.x || 0,
        y = vector.y || 0;

    return this.lerp( x, y, value );

  },

  add: function add ( x, y ) {

    this.x += x || 0;
    this.y += y || 0;

    return this;

  },

  addVector: function addVector ( vector ) {
    return this.add( vector.x, vector.y );
  },

  sub: function sub ( x, y ) {

    this.x -= x || 0;
    this.y -= y || 0;

    return this;

  },

  subVector: function subVector ( vector ) {
    return this.sub( vector.x, vector.y );
  },

  mul: function mul ( value ) {

    this.x *= value || 0;
    this.y *= value || 0;

    return this;

  },

  mulVector: function mulVector ( vector ) {

    this.x *= vector.x || 0;
    this.y *= vector.y || 0;

    return this;

  },

  div: function div ( value ) {

    this.x /= value || 0;
    this.y /= value || 0;

    return this;

  },

  divVector: function divVector ( vector ) {

    this.x /= vector.x || 0;
    this.y /= vector.y || 0;

    return this;

  },

  angle: function angle () {
    if ( settings.degrees ) {
      return Math.atan2( this.y, this.x ) * 180 / Math.PI;
    }

    return Math.atan2( this.y, this.x );
  },

  mag: function mag () {
    return Math.sqrt( this.magSquare() );
  },

  magSquare: function magSquare () {
    return this.x * this.x + this.y * this.y;
  },

  setMag: function setMag ( value ) {
    return this.normalize().mul( value );
  },

  normalize: function normalize () {
    var mag = this.mag();

    if ( mag && mag !== 1 ) {
      this.div( mag );
    }

    return this;
  },

  dot: function dot ( x, y ) {
    return this.x * ( x || 0 ) + this.y * ( y || 0 );
  },

  dotVector: function dotVector ( vector ) {
    return this.x * ( vector.x || 0 ) + this.y * ( vector.y || 0 );
  },

  clone: function clone () {
    return new Vector2D( this.x, this.y );
  },

  dist: function dist ( vector ) {
    return dist( this.x, this.y, vector.x, vector.y );
  },

  limit: function limit ( value ) {
    var mag = this.magSquare();

    if ( mag > value * value ) {
      this.div( Math.sqrt( mag ) ).mul( value );
    }

    return this;
  },

  cross: function cross ( vector ) {
    return Vector2D.cross( this, vector );
  },

  toString: function toString () {
    return 'vec2(' + this.x.toFixed( 2 ) + ', ' + this.y.toFixed( 2 ) + ')';
  },

  rotate: function rotate ( angle ) {
    var x = this.x,
        y = this.y;

    var c, s;

    if ( settings.degrees ) {
      angle *= Math.PI / 180;
    }

    c = Math.cos( angle );
    s = Math.sin( angle );

    this.x = x * c - y * s;
    this.y = x * s + y * c;

    return this;
  },

  setAngle: function setAngle ( angle ) {
    var mag = this.mag();

    if ( settings.degrees ) {
      angle *= Math.PI / 180;
    }

    this.x = mag * Math.cos( angle );
    this.y = mag * Math.sin( angle );

    return this;
  },

  constructor: Vector2D
};

[
  'normalize',
  'setMag',
  'rotate',
  'limit',
  'lerp',
  'mul',
  'div',
  'add',
  'sub',
  'set'
].forEach( function ( method ) {
  /* jshint evil: true */
  Vector2D[ method ] = Function( 'vector, x, y, z, value', 'return vector.copy().' + method + '( x, y, z, value );' );
  /* jshint evil: false */
} );

Vector2D.random = function random () {
  var x;

  if ( settings.degrees ) {
    x = 360;
  } else {
    x = Math.PI * 2;
  }

  return Vector2D.fromAngle( Math.random() * x );
};

Vector2D.fromAngle = function fromAngle ( angle ) {
  if ( settings.degrees ) {
    angle *= Math.PI / 180;
  }

  return new Vector2D( Math.cos( angle ), Math.sin( angle ) );
};

Vector2D.cross = function cross ( a, b ) {
  return a.x * b.y - a.y * b.x;
};

module.exports = Vector2D;
