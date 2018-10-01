'use strict';

var AbstractRenderer = require( '../core/renderer/AbstractRenderer' );
var createRenderer   = require( '../core/renderer' );
var RendererGL       = require( '../core/renderer/RendererGL' );
var Renderer2D       = require( '../core/renderer/Renderer2D' );
var constants        = require( '../core/constants' );

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
      createRenderer( { type: constants.get( 'RENDERER_GL' ) } ).should
        .instanceof( RendererGL );
    } );
  } );

  describe( 'create_renderer -> Renderer2D', function ()
  {
    it( 'works', function ()
    {
      createRenderer( { type: constants.get( 'RENDERER_2D' ) } ).should
        .instanceof( Renderer2D );
    } );
  } );

  describe( 'create_renderer -> AbstractRenderer', function ()
  {
    it( 'works', function ()
    {
      createRenderer( { type: constants.get( 'RENDERER_AUTO' ) } ).should
        .instanceof( AbstractRenderer );
    } );
  } );
} );
