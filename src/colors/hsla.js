'use strict';

var HSLA = require( './HSLA' );

module.exports = function rgba ( h, s, l, a ) {
  return new HSLA( h, s, l, a );
};
