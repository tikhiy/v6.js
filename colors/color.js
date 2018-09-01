'use strict';

var RGBA  = require( './RGBA' );
var parse = require( './internal/parse' );

function color ( r, g, b, a ) {
  if ( typeof r !== 'string' ) {
    return new RGBA( r, g, b, a );
  }

  return parse( r );
}

module.exports = color;
