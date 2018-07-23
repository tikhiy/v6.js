'use strict';

var HSLA = require( './HSLA' );

module.exports = function hsla ( h, s, l, a ) {
  return new HSLA( h, s, l, a );
};
