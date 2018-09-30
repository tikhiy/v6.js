'use strict';

var parse = require( './internal/parse' );

var RGBA  = require( './RGBA' );

function color ( r, g, b, a ) {
  if ( typeof r !== 'string' ) {
    return new RGBA( r, g, b, a );
  }

  return parse( r );
}

module.exports = color;
