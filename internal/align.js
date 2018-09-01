'use strict';

var constants = require( '../constants' );

function align ( value, width, align ) {
  switch ( align ) {
    case constants.LEFT:
    case constants.TOP:
      return value;
    case constants.CENTER:
    case constants.MIDDLE:
      return value - width * 0.5;
    case constants.RIGHT:
    case constants.BOTTOM:
      return value - width;
  }

  return 0;
}

module.exports = align;
