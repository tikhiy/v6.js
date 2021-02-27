'use strict';

var GL = require( '../../constants' ).get( 'GL' );

/**
 * Обрабатывает фигуру.
 * @private
 * @method processShape
 * @param  {v6.AbstractRenderer} renderer Рендерер.
 * @param  {Array|Float32Array}  vertices Вершины.
 * @return {Array|Float32Array}           Обработанные вершины.
 */
function processShape ( renderer, vertices )
{
  if ( renderer.type === GL && typeof Float32Array === 'function' && ! ( vertices instanceof Float32Array ) ) { // eslint-disable-line no-undef
    vertices = new Float32Array( vertices );                                                                    // eslint-disable-line no-undef
  }

  return vertices;
}

module.exports = processShape;
