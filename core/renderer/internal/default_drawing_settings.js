'use strict';

var constants = require( '../../constants' );

var defaultDrawingSettings = {
  _rectAlignX: constants.get( 'LEFT' ),
  _rectAlignY: constants.get( 'TOP' ),
  _lineWidth:  2,
  _doStroke:   true,
  _doFill:     true
};

module.exports = defaultDrawingSettings;
