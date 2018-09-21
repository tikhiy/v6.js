'use strict';

var constants = require( '../constants' );

/**
 * Возвращает новую координату.
 * @private
 * @method align
 * @param  {number}   value Текущая координата.
 * @param  {number}   width Размер контейнера (rect, image).
 * @param  {constant} align `constants.LEFT`, `constants.MIDDLE`, `constants.BOTTOM`, и так далее.
 * @return {number}
 * @example
 * align( 100, 200, constants.LEFT );   // -> 100
 * align( 100, 200, constants.CENTER ); // -> 0
 */
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

  throw Error( 'Got unknown alignment constant. The known are: `constants.LEFT`, `constants.CENTER`, `constants.RIGHT`, `constants.TOP`, `constants.MIDDLE`, and `constants.BOTTOM`' );
}

module.exports = align;
