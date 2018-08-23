'use strict';

var Camera = require( './Camera' );

module.exports = function camera ( renderer, options ) {
  return new Camera( renderer, options );
};
