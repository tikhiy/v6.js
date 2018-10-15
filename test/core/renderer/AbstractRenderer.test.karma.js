'use strict';

var mixin                  = require( 'peako/mixin' );

var defaultDrawingSettings = require( '../../../core/renderer/internal/default_drawing_settings' );
var AbstractRenderer       = require( '../../../core/renderer/AbstractRenderer' );
var Renderer2D             = require( '../../../core/renderer/Renderer2D' );
var RendererGL             = require( '../../../core/renderer/RendererGL' );
var settings               = require( '../../../core/renderer/settings' );
var RGBA                   = require( '../../../core/color/RGBA' );
var constants              = require( '../../../core/constants' );

var internal               = require( './__internal__' );

describe( 'v6.AbstractRenderer', function ()
{
  it( 'successfully required', function ()
  {
    AbstractRenderer.should.be.a( 'function' );
  } );

  describe( 'new v6.AbstractRenderer', function ()
  {
    var renderer;

    before( function ()
    {
      renderer = Object.create( AbstractRenderer.prototype );
      AbstractRenderer.create( renderer, settings, constants.get( '2D' ) );
    } );

    it( 'throws on attempt to create an instance', function ()
    {
      ( function ()
      {
        return new AbstractRenderer();
      } ).should.throw( Error );
    } );

    describe( 'members', function ()
    {
      it( 'new v6.AbstractRenderer.canvas', function ()
      {
        renderer.should.have.property( 'canvas' ).that.is.an.instanceof( HTMLCanvasElement );
      } );

      it( 'new v6.AbstractRenderer.context', function ()
      {
        renderer.should.have.property( 'context' ).that.is.an.instanceof( CanvasRenderingContext2D );
      } );

      it( 'new v6.AbstractRenderer.settings', function ()
      {
        renderer.should.have.property( 'settings' ).that.is.an( 'object' );
        renderer.settings.should.have.property( 'color' ).that.is.equal( RGBA );
        renderer.settings.should.have.property( 'scale' ).that.is.equal( 1 );
      } );

      it( 'new v6.AbstractRenderer.type', function ()
      {
        renderer.should.have.property( 'type' ).that.is.oneOf( [
          constants.get( '2D' ),
          constants.get( 'GL' )
        ] );
      } );
    } );

    describe( 'methods', function ()
    {
      var mock = null;

      beforeEach( function ()
      {
        mock = null;
      } );

      afterEach( function ()
      {
        if ( mock !== null ) {
          mock.verify();
        }
      } );

      describe( 'new v6.AbstractRenderer.appendTo', function ()
      {
        it( 'works', function ()
        {
          internal.div( function ( div )
          {
            internal.cover( ( mock = sinon.mock( div ) ), {
              appendChild: {
                arguments: [ renderer.canvas ],
                exactly:   [ 1 ]
              }
            } );

            renderer.appendTo( div );
          } );
        } );
      } );

      describe( 'new v6.AbstractRenderer.destroy', function ()
      {
        it( 'works', function ()
        {
          internal.div( function ( div )
          {
            internal.cover( ( mock = sinon.mock( div ) ), {
              removeChild: {
                arguments: [ renderer.canvas ],
                exactly:   [ 1 ]
              }
            } );

            renderer.appendTo( div ).destroy();
          } );
        } );
      } );
    } );
  } );

  describe( 'v6.AbstractRenderer.create', function ()
  {
    [
      [ 'creates Renderer2D', Renderer2D, '2D', CanvasRenderingContext2D ],
      [ 'creates RendererGL', RendererGL, 'GL', WebGLRenderingContext ]
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
