'use strict';

var RGBA = require( './RGBA' );

module.exports = function rgba ( r, g, b, a ) {
  return new RGBA( r, g, b, a );
};
