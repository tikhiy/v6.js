'use strict';

var constants = require( './constants' );

module.exports = function align ( value, dimension, align ) {
  switch ( align ) {
    case constants.LEFT:
    case constants.TOP:
      return value;
    case constants.CENTER:
    case constants.MIDDLE:
      return value - dimension * 0.5;
    case constants.RIGHT:
    case constants.BOTTOM:
      return value - dimension;
  }

  return 0;
};
