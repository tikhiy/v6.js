'use strict';

var RGBA       = require( './RGBA' ),
    parseColor = require( './parse-color' );

module.exports = function color ( a, b, c, d ) {
  if ( typeof a !== 'string' ) {
    return new RGBA( a, b, c, d );
  }

  return parseColor( a );
};
