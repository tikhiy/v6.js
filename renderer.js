'use strict';

var once              = require( 'peako/once' ),
    platform          = require( './platform' ),
    _getContextNameGL = require( './_getContextNameGL' ),
    RendererGL        = require( './RendererGL' ),
    Renderer2D        = require( './Renderer2D' ),
    constants         = require( './constants' ),
    report            = require( './report' ),
    o                 = require( './rendererOptions' );

var getRendererMode = once( function () {
  var touchable, safari;

  if ( typeof window !== 'undefined' ) {
    touchable = 'ontouchstart' in window &&
      'ontouchmove' in window &&
      'ontouchend' in window;
  }

  if ( platform ) {
    safari = platform.os &&
      platform.os.family === 'iOS' &&
      platform.name === 'Safari';
  }

  if ( touchable && ! safari ) {
    return constants.MODE_GL;
  }

  return constants.MODE_2D;
} );

module.exports = function renderer ( options ) {
  var mode = options && options.mode || o.mode;

  if ( mode === constants.MODE_AUTO ) {
    mode = getRendererMode();
  }

  if ( mode === constants.MODE_GL ) {
    if ( _getContextNameGL() ) {
      return new RendererGL( options );
    }

    report( 'Cannot create WebGL context, fallback to 2D.' );
  }

  if ( mode === constants.MODE_2D ||
       mode === constants.MODE_GL )
  {
    return new Renderer2D( options );
  }
};
