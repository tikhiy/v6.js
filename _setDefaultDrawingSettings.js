'use strict';

var _copyDrawingSettings = require( './_copyDrawingSettings' );

var Font = require( './Font' );

var defaultDrawingSettings = {
  _rectAlignX:   'left',
  _rectAlignY:   'top',
  _textAlign:    'left',
  _textBaseline: 'top',
  _doFill:       true,
  _doStroke:     true,
  _lineHeight:   14,
  _lineWidth:    2
};

module.exports = function _setDefaultDrawingSettings ( obj, renderer ) {

  _copyDrawingSettings( obj, defaultDrawingSettings );

  obj._strokeColor = new renderer.settings.color();
  obj._fillColor   = new renderer.settings.color();
  obj._font        = new Font();

  return obj;

};
