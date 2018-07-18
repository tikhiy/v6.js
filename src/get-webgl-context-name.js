'use strict';

var once = require( 'peako/once' ),
    find = require( 'peako/find' );

module.exports = once( function () {
  var canvas = document.createElement( 'canvas' ),
      types, type, i;

  if ( typeof canvas.getContext === 'function' ) {
    types = [
      'webgl',
      'experimental-webgl',
      'moz-webgl',
      'webkit-3d'
    ];

    type = find( types, function ( type ) {
      return canvas.getContext( type ) !== null;
    } );
  }

  canvas = null;

  return type;
} );
