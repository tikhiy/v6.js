'use strict';

module.exports = function _copyDrawingSettings ( target, source, deep ) {
  if ( deep ) {
    target._fillColor[ 0 ]   = source._fillColor[ 0 ];
    target._fillColor[ 1 ]   = source._fillColor[ 1 ];
    target._fillColor[ 2 ]   = source._fillColor[ 2 ];
    target._fillColor[ 3 ]   = source._fillColor[ 3 ];
    target._font.style       = source._font.style;
    target._font.variant     = source._font.variant;
    target._font.weight      = source._font.weight;
    target._font.size        = source._font.size;
    target._font.family      = source._font.family;
    target._strokeColor[ 0 ] = source._strokeColor[ 0 ];
    target._strokeColor[ 1 ] = source._strokeColor[ 1 ];
    target._strokeColor[ 2 ] = source._strokeColor[ 2 ];
    target._strokeColor[ 3 ] = source._strokeColor[ 3 ];
  }

  target._rectAlignX = source._rectAlignX;
  target._rectAlignY = source._rectAlignY;
  target._textAlignX = source._textAlignX;
  target._textAlignY = source._textAlignY;
  target._doStroke   = source._doStroke;
  target._doFill     = source._doFill;
  target._lineH      = source._lineH;
  target._lineW      = source._lineW;

  return target;
};
