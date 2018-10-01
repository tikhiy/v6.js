'use strict';

var constants       = require( '../constants' );

var report          = require( '../internal/report' );

var getRendererType = require( './internal/get_renderer_type' );
var getWebGL        = require( './internal/get_webgl' );

var RendererGL      = require( './RendererGL' );
var Renderer2D      = require( './Renderer2D' );
var type            = require( './settings' ).type;

/**
 * Создает новый рендерер.
 * @method v6.createRenderer
 * @param  {object}              options {@link v6.options}.
 * @return {v6.AbstractRenderer}
 */
function createRenderer ( options )
{
  var type_ = ( options && options.type ) || type;

  if ( type_ === constants.get( 'RENDERER_AUTO' ) ) {
    type_ = getRendererType();
  }

  if ( type_ === constants.get( 'RENDERER_GL' ) ) {
    if ( getWebGL() ) {
      return new RendererGL( options );
    }

    report( 'Cannot create WebGL context. Falling back to 2D.' );
  }

  if ( type_ === constants.get( 'RENDERER_2D' ) || type_ === constants.get( 'RENDERER_GL' ) ) {
    return new Renderer2D( options );
  }

  throw Error( 'Got unknown renderer type. The known are: RENDERER_2D and RENDERER_GL' );
}

module.exports = createRenderer;
