'use strict';

var once      = require( 'peako/once' );
var constants = require( '../constants' );

if ( typeof platform === 'undefined' ) {
  var platform;

  try {
    platform = require( 'platform' );
  } catch ( error ) {}
}

function getRendererType () {
  var safari, touchable;

  if ( platform ) {
    safari = platform.os &&
      platform.os.family === 'iOS' &&
      platform.name === 'Safari';
  }

  if ( typeof window !== 'undefined' ) {
    touchable = 'ontouchend' in window;
  }

  if ( touchable && ! safari ) {
    return constants.RENDERER_GL;
  }

  return constants.RENDERER_2D;
}

module.exports = once( getRendererType );
