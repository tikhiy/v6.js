'use strict';

module.exports = function _copyDrawingSettings ( obj, src, deep ) {
  if ( deep ) {
    obj._fillColor[ 0 ]   = src._fillColor[ 0 ];
    obj._fillColor[ 1 ]   = src._fillColor[ 1 ];
    obj._fillColor[ 2 ]   = src._fillColor[ 2 ];
    obj._fillColor[ 3 ]   = src._fillColor[ 3 ];
    obj._font.style       = src._font.style;
    obj._font.variant     = src._font.variant;
    obj._font.weight      = src._font.weight;
    obj._font.size        = src._font.size;
    obj._font.family      = src._font.family;
    obj._strokeColor[ 0 ] = src._strokeColor[ 0 ];
    obj._strokeColor[ 1 ] = src._strokeColor[ 1 ];
    obj._strokeColor[ 2 ] = src._strokeColor[ 2 ];
    obj._strokeColor[ 3 ] = src._strokeColor[ 3 ];
  }

  obj._rectAlignX   = src._rectAlignX;
  obj._rectAlignY   = src._rectAlignY;
  obj._doFill       = src._doFill;
  obj._doStroke     = src._doStroke;
  obj._lineHeight   = src._lineHeight;
  obj._lineWidth    = src._lineWidth;
  obj._textAlign    = src._textAlign;
  obj._textBaseline = src._textBaseline;

  return obj;
};
