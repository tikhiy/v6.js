'use strict';

var Ticker = require( './Ticker' );

module.exports = function ticker ( update, render, context ) {
  return new Ticker( update, render, context );
};
