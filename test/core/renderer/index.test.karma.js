'use strict';

var AbstractRenderer = require( '../../../core/renderer/AbstractRenderer' );
var createRenderer   = require( '../../../core/renderer' );
var RendererGL       = require( '../../../core/renderer/RendererGL' );
var Renderer2D       = require( '../../../core/renderer/Renderer2D' );
var constants        = require( '../../../core/constants' );

describe( 'v6.createRenderer', function ()
{
  it( 'works', function ()
  {
    createRenderer.should.a( 'function' );
  } );

  [
    [ 'AUTO', AbstractRenderer ],
    [ 'GL',   RendererGL ],
    [ '2D',   Renderer2D ]
  ].forEach( function ( values )
  {
    describe( 'v6.createRenderer( ' + values[ 0 ] +  ' )', function ()
    {
      it( 'works', function ()
      {
        createRenderer( { type: constants.get( values[ 0 ] ) } ).should.instanceof( values[ 1 ] );
      } );
    } );
  } );
} );
