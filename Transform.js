'use strict';

var mat3 = require( './mat3' );

function Transform () {
  this.matrix = mat3.identity();
  this._index = -1;
  this._stack = [];
}

Transform.prototype = {
  save: function save () {
    if ( ++this._index < this._stack.length ) {
      mat3.copy( this._stack[ this._index ], this.matrix );
    } else {
      this._stack.push( mat3.clone( this.matrix ) );
    }
  },

  restore: function restore () {
    if ( this._index >= 0 ) {
      mat3.copy( this.matrix, this._stack[ this._index-- ] );
    } else {
      mat3.setIdentity( this.matrix );
    }
  },

  setTransform: function setTransform ( m11, m12, m21, m22, dx, dy ) {
    mat3.setTransform( this.matrix, m11, m12, m21, m22, dx, dy );
  },

  translate: function translate ( x, y ) {
    mat3.translate( this.matrix, x, y );
  },

  rotate: function rotate ( angle ) {
    mat3.rotate( this.matrix, angle );
  },

  scale: function scale ( x, y ) {
    mat3.scale( this.matrix, x, y );
  },

  transform: function transform ( m11, m12, m21, m22, dx, dy ) {
    mat3.transform( this.matrix, m11, m12, m21, m22, dx, dy );
  },

  constructor: Transform
};

module.exports = Transform;
