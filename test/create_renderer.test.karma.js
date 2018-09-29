'use strict';

var createRenderer   = require( '../create_renderer' );
var AbstractRenderer = require( '../AbstractRenderer' );
var RendererGL       = require( '../RendererGL' );
var Renderer2D       = require( '../Renderer2D' );
var constants        = require( '../constants' );

describe( 'create_renderer', function ()
{
  it( 'works', function ()
  {
    createRenderer.should.be.a( 'function' );
  } );

  describe( 'create_renderer -> RendererGL', function ()
  {
    it( 'works', function ()
    {
      createRenderer( { type: constants.get( 'RENDERER_GL' ) } )
        .should
          .instanceof( RendererGL );
    } );
  } );

  describe( 'create_renderer -> Renderer2D', function ()
  {
    it( 'works', function ()
    {
      createRenderer( { type: constants.get( 'RENDERER_2D' ) } )
        .should
          .instanceof( Renderer2D );
    } );
  } );

  describe( 'create_renderer -> AbstractRenderer', function ()
  {
    it( 'works', function ()
    {
      createRenderer( { type: constants.get( 'RENDERER_AUTO' ) } )
        .should
          .instanceof( AbstractRenderer );
    } );
  } );
} );
