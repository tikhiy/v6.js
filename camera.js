'use strict';

var Camera = require( './Camera' );

module.exports = function camera ( options, renderer ) {
  return new Camera( options, renderer );
};
