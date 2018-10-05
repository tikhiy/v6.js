'use strict';

var mixin                  = require( 'peako/mixin' );

var defaultDrawingSettings = require( '../../../core/renderer/internal/default_drawing_settings' );
var AbstractRenderer       = require( '../../../core/renderer/AbstractRenderer' );
var Renderer2D             = require( '../../../core/renderer/Renderer2D' );
var RendererGL             = require( '../../../core/renderer/RendererGL' );
var settings               = require( '../../../core/renderer/settings' );
var constants              = require( '../../../core/constants' );

describe( 'v6.AbstractRenderer', function ()
{
  it( 'successfully required', function ()
  {
    AbstractRenderer.should.be.a( 'function' );
  } );

  describe( 'new v6.AbstractRenderer', function ()
  {
    it( 'throws on attempt to create an instance', function ()
    {
      ( function ()
      {
        return new AbstractRenderer();
      } ).should.throw( Error );
    } );
  } );

  describe( 'v6.AbstractRenderer.create', function ()
  {
    [
      [ 'creates Renderer2D', Renderer2D, 'RENDERER_2D', CanvasRenderingContext2D ],
      [ 'creates RendererGL', RendererGL, 'RENDERER_GL', WebGLRenderingContext ]
    ].forEach( function ( values )
    {
      it( values[ 0 ], function ()
      {
        var renderer = Object.create( values[ 1 ].prototype );
        AbstractRenderer.create( renderer, mixin( {}, settings ), constants.get( values[ 2 ] ) );
        renderer.canvas.should.instanceof( HTMLCanvasElement );
        renderer.context.should.instanceof( values[ 3 ] );
        renderer.should.like( defaultDrawingSettings );
        renderer.canvas.parentNode.should.equal( document.body );
      } );
    } );
  } );
} );
