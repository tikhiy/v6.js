'use strict';

var constants = require( '../../constants' );

/**
 * Возвращает новую координату.
 * @private
 * @method align
 * @param  {number}   value Текущая координата.
 * @param  {number}   width Размер контейнера (rect, image).
 * @param  {constant} align `LEFT`, `MIDDLE`, `BOTTOM`, и так далее.
 * @return {number}
 * @example
 * align( 100, 200, constants.get( 'LEFT' ) );   // -> 100
 * align( 100, 200, constants.get( 'CENTER' ) ); // -> 0
 */
function align ( value, width, align ) {
  switch ( align ) {
    case constants.get( 'LEFT' ):
    case constants.get( 'TOP' ):
      return value;
    case constants.get( 'CENTER' ):
    case constants.get( 'MIDDLE' ):
      return value - width * 0.5;
    case constants.get( 'RIGHT' ):
    case constants.get( 'BOTTOM' ):
      return value - width;
  }

  throw Error( 'Got unknown alignment constant. The known are: `LEFT`, `CENTER`, `RIGHT`, `TOP`, `MIDDLE`, and `BOTTOM`' );
}

module.exports = align;
