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
    [ 'AbstractRenderer', 'RENDERER_AUTO', AbstractRenderer ],
    [ 'RendererGL',       'RENDERER_GL',   RendererGL ],
    [ 'Renderer2D',       'RENDERER_2D',   Renderer2D ]
  ].forEach( function ( values )
  {
    describe( 'v6.createRenderer -> {v6.' + values[ 0 ] +  '}', function ()
    {
      it( 'works', function ()
      {
        createRenderer( { type: constants.get( values[ 1 ] ) } ).should.instanceof( values[ 2 ] );
      } );
    } );
  } );
} );
