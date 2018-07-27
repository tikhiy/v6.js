'use strict';

var Image = require( './Image' );

module.exports = function image ( url ) {
  return new Image( url );
};
