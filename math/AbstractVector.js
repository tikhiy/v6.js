'use strict';

var settings = require( '../settings' );

/**
 * Абстрактный класс вектора с базовыми методами.
 * @abstract
 * @constructor v6.AbstractVector
 * @see v6.Vector2D
 * @see v6.Vector3D
 */
function AbstractVector () {} // eslint-disable-line no-empty-function, brace-rules/brace-on-same-line

AbstractVector.prototype = {
  /**
   * @method v6.AbstractVector#normalize
   * @chainable
   */
  normalize: function normalize ()
  {
    var mag = this.mag();

    if ( mag && mag !== 1 ) {
      this.div( mag );
    }

    return this;
  },

  /**
   * @method v6.AbstractVector#setAngle
   * @param {number} angle
   * @chainable
   */
  setAngle: function setAngle ( angle )
  {
    var mag = this.mag();

    if ( settings.degrees ) {
      angle *= Math.PI / 180;
    }

    this.x = mag * Math.cos( angle );
    this.y = mag * Math.sin( angle );

    return this;
  },

  /**
   * @method v6.AbstractVector#setMag
   * @param {number} value
   * @chainable
   */
  setMag: function setMag ( value )
  {
    return this.normalize().mul( value );
  },

  /**
   * @method v6.AbstractVector#rotate
   * @param  {number} angle
   * @chainable
   */
  rotate: function rotate ( angle )
  {
    var x = this.x,
        y = this.y;

    var c, s;

    if ( settings.degrees ) {
      angle *= Math.PI / 180;
    }

    c = Math.cos( angle );
    s = Math.sin( angle );

    this.x = ( x * c ) - ( y * s );
    this.y = ( x * s ) + ( y * c );

    return this;
  },

  /**
   * @method v6.AbstractVector#getAngle
   * @return {number}
   */
  getAngle: function getAngle ()
  {
    if ( settings.degrees ) {
      return Math.atan2( this.y, this.x ) * 180 / Math.PI;
    }

    return Math.atan2( this.y, this.x );
  },

  /**
   * @method v6.AbstractVector#limit
   * @param  {number} value
   * @chainable
   */
  limit: function limit ( value )
  {
    var mag = this.magSquare();

    if ( mag > value * value ) {
      this.div( Math.sqrt( mag ) ).mul( value );
    }

    return this;
  },

  /**
   * @method v6.AbstractVector#mag
   * @return {number}
   */
  mag: function mag ()
  {
    return Math.sqrt( this.magSquare() );
  },

  constructor: AbstractVector
};

module.exports = AbstractVector;
