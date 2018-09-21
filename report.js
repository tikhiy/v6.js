'use strict';

/* globals console */

var report, reported;

if ( typeof console !== 'undefined' && console.warn ) {
  reported = {};

  report = function report ( message ) {
    if ( reported[ message ] ) {
      return;
    }

    console.warn( message );

    reported[ message ] = true;
  };
} else {
  report = require( 'peako/noop' );
}

module.exports = report;
