'use strict';

var _parseColor = require( './_parseColor' );

var RGBA = require( './RGBA' );

module.exports = function color ( a, b, c, d ) {
  if ( typeof a !== 'string' ) {
    return new RGBA( a, b, c, d );
  }

  return _parseColor( a );
};
