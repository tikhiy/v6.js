/*!
 * Copyright (c) 2017-2018 SILENT
 * Released under the MIT License.
 * https://github.com/silent-tempest/v6
 */

'use strict';

var once                = require( 'peako/once' );

var getWebGLContextName = require( './get-webgl-context-name' ),
    defaultOptions      = require( './default-options' ),
    RendererWebGL       = require( './renderer-webgl/RendererWebGL' ),
    Renderer2D          = require( './renderer-2d/Renderer2D' ),
    constants           = require( './constants' ),
    platform            = require( './platform' ),
    report              = require( './report' );

var getRendererMode;

function renderer ( options ) {
  var mode = options && options.mode || defaultOptions.renderer.mode;

  if ( mode === constants.RENDERER_MODE_AUTO ) {
    mode = getRendererMode();
  }

  if ( mode === constants.RENDERER_MODE_WEBGL ) {
    if ( getWebGLContextName() ) {
      return new RendererWebGL( options );
    }

    report( 'Cannot create WebGL context, fallback to 2D.' );
  }

  if ( mode === constants.RENDERER_MODE_2D ||
       mode === constants.RENDERER_MODE_WEBGL )
  {
    return new Renderer2D( options );
  }
}

getRendererMode = once( function () {
  var touchable = 'ontouchstart' in root &&
                  'ontouchmove' in root &&
                  'ontouchend' in root;

  var safari;

  if ( platform ) {
    safari = platform.os &&
             platform.os.family === 'iOS' &&
             platform.name === 'Safari';
  } else {
    safari = false;
  }

  if ( touchable && ! safari ) {
    return constants.RENDERER_MODE_WEBGL;
  }

  return constants.RENDERER_MODE_2D;
} );

module.exports = renderer;
