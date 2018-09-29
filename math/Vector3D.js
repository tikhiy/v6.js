'use strict';

var Vector2D = require( './Vector2D' );
var settings = require( '../settings' );

/**
 * @constructor v6.Vector3D
 */
function Vector3D ( x, y, z )
{
  this.set( x, y, z );
}

Vector3D.prototype = {
  set: function set ( x, y, z )
  {

    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;

    return this;

  },

  setVector: function setVector ( vector )
  {
    return this.set( vector.x, vector.y, vector.z );
  },

  lerp: function lerp ( x, y, z, value )
  {

    this.x += ( x - this.x ) * value || 0;
    this.y += ( y - this.y ) * value || 0;
    this.z += ( z - this.z ) * value || 0;

    return this;

  },

  lerpVector: function lerpVector ( vector, value )
  {
    var x = vector.x || 0,
        y = vector.y || 0,
        z = vector.z || 0;

    return this.lerp( x, y, z, value );
  },

  add: function add ( x, y, z )
  {

    this.x += x || 0;
    this.y += y || 0;
    this.z += z || 0;

    return this;

  },

  addVector: function addVector ( vector )
  {
    return this.add( vector.x, vector.y, vector.z );
  },

  sub: function sub ( x, y, z )
  {

    this.x -= x || 0;
    this.y -= y || 0;
    this.z -= z || 0;

    return this;

  },

  subVector: function subVector ( vector )
  {
    return this.sub( vector.x, vector.y, vector.z );
  },

  mul: function mul ( value )
  {

    this.x *= value || 0;
    this.y *= value || 0;
    this.z *= value || 0;

    return this;

  },

  mulVector: function mulVector ( vector )
  {

    this.x *= vector.x || 0;
    this.y *= vector.y || 0;
    this.z *= vector.z || 0;

    return this;

  },

  div: function div ( value )
  {

    this.x /= value || 0;
    this.y /= value || 0;
    this.z /= value || 0;

    return this;

  },

  divVector: function divVector ( vector )
  {

    this.x /= vector.x || 0;
    this.y /= vector.y || 0;
    this.z /= vector.z || 0;

    return this;

  },

  magSquare: function magSquare ()
  {
    // Return this.dotVector( this );
    return this.x * this.x + this.y * this.y + this.z * this.z;
  },

  dot: function dot ( x, y, z )
  {
    return this.x * x + this.y * y + this.z * z;
  },

  dotVector: function dotVector ( vector )
  {
    var x = vector.x || 0,
        y = vector.y || 0,
        z = vector.z || 0;

    return this.dot( x, y, z );
  },

  copy: function copy ()
  {
    return new Vector3D( this.x, this.y, this.z );
  },

  dist: function dist ( vector )
  {
    var x = vector.x - this.x,
        y = vector.y - this.y,
        z = vector.z - this.z;

    return Math.sqrt( x * x + y * y + z * z );
  },

  toString: function toString ()
  {
    return 'vec3(' + this.x.toFixed( 2 ) + ', ' + this.y.toFixed( 2 ) + ', ' + this.z.toFixed( 2 ) + ')';
  },

  normalize: Vector2D.prototype.normalize,
  setAngle:  Vector2D.prototype.setAngle,
  setMag:    Vector2D.prototype.setMag,
  rotate:    Vector2D.prototype.rotate,
  angle:     Vector2D.prototype.angle,
  limit:     Vector2D.prototype.limit,
  mag:       Vector2D.prototype.mag,

  constructor: Vector3D
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
].forEach( function ( method )
{
  Vector3D[ method ] = Vector2D[ method ];
} );

// Use the equal-area projection algorithm.
Vector3D.random = function random ()
{
  var theta = Math.random() * Math.PI * 2;
  var z     = Math.random() * 2 - 1;
  var n     = Math.root( 1 - z * z );
  return new Vector3D( n * Math.cos( theta ), n * Math.sin( theta ), z );
};

Vector3D.fromAngle = function fromAngle ( angle )
{
  if ( settings.degrees ) {
    angle *= Math.PI / 180;
  }

  return new Vector3D( Math.cos( angle ), Math.sin( angle ) );
};

Vector3D.clone = function clone ( vector )
{
  return new Vector3D( vector.x, vector.y, vector.z );
};

module.exports = Vector3D;
