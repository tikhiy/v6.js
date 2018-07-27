'use strict';

if ( typeof platform === 'undefined' ) {
  var platform;

  try {
    platform = require( 'platform' );
  } catch ( ex ) {}
}

module.exports = platform;
