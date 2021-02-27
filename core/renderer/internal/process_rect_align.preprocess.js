/* eslint lines-around-directive: off */
/* eslint lines-around-comment: off */

'use strict';

var constants = require( '../../constants' );

#define rectAlignX( rectAlignX, RectAlignX, LEFT, CENTER, RIGHT )                  \
  function process##RectAlignX ( renderer, x, w )                                  \
  {                                                                                \
    if ( renderer._##rectAlignX === constants.get( #CENTER ) ) {                   \
      x -= w * 0.5;                                                                \
    } else if ( renderer._##rectAlignX === constants.get( #RIGHT ) ) {             \
      x -= w;                                                                      \
    } else if ( renderer._##rectAlignX !== constants.get( #LEFT ) ) {              \
      throw Error( 'Unknown " +' + #rectAlignX + '": ' + renderer._##rectAlignX ); \
    }                                                                              \
                                                                                   \
    return Math.floor( x );                                                        \
  }

/**
 * @private
 * @method processRectAlignX
 * @param  {v6.AbstractRenderer} renderer
 * @param  {number}              x
 * @param  {number}              w
 * @return {number}
 */
exports.processRectAlignX = rectAlignX( rectAlignX, RectAlignX, LEFT, CENTER, RIGHT ); // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len

/**
 * @private
 * @method processRectAlignY
 * @param  {v6.AbstractRenderer} renderer
 * @param  {number}              y
 * @param  {number}              h
 * @return {number}
 */
exports.processRectAlignY = rectAlignX( rectAlignY, RectAlignY, TOP, MIDDLE, BOTTOM ); // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
