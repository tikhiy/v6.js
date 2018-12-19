'use strict';

var AbstractRenderer = require( '../../../core/renderer/AbstractRenderer' );
var Renderer2D       = require( '../../../core/renderer/Renderer2D' );

var internal         = require( './__internal__' );

describe( 'v6.Renderer2D', function ()
{
  it( 'successfully required', function ()
  {
    Renderer2D.should.be.a( 'function' );
  } );

  it( 'extends v6.AbstractRenderer', function ()
  {
    Renderer2D.prototype.should.instanceof( AbstractRenderer );
  } );

  describe( 'new v6.Renderer2D', function ()
  {
    it( 'works with no options', function ()
    {
      var renderer = new Renderer2D(); // eslint-disable-line no-unused-vars
    } );

    it( 'works with options.appendTo', function ()
    {
      internal.div( function ( div )
      {
        new Renderer2D( { appendTo: div } ).should.be.as( {
          canvas: {
            parentNode: div
          },

          w: 600,
          h: 400
        } );
      } );
    } );

    it( 'works with options.appendTo: null', function ()
    {
      new Renderer2D( { appendTo: null } ).should.be.like( {
        w: 600,
        h: 400
      } );
    } );

    it( 'works with options.w and options.h', function ()
    {
      new Renderer2D( { w: 1280, h: 720 } ).should.be.like( {
        w: 1280,
        h: 720
      } );
    } );

    it( 'works with incorrect options.w and options.h', function ()
    {
      new Renderer2D( { w: 0 / 0, h: 0 / 0 } ).should.be.like( {
        w: 0,
        h: 0
      } );
    } );

    it( 'works with options.w and options.h and options.appendTo', function ()
    {
      internal.div( function ( div )
      {
        new Renderer2D( { w: 1280, h: 720, appendTo: div } ).should.be.like( {
          w: 1280,
          h: 720
        } );
      } );
    } );

    describe( 'new v6.Renderer2D.appendTo', function ()
    {
      it( 'works', function ()
      {
        internal.div( function ( div )
        {
          var renderer = new Renderer2D( {
            append: null
          } ).appendTo( div );

          renderer.should.as( {
            canvas: {
              parentNode: div
            }
          } );
        } );
      } );
    } );

    describe( 'new v6.Renderer2D rendering methods', function ()
    {
      var renderer, mock, sandbox;

      before( function ()
      {
        renderer = new Renderer2D();
      } );

      beforeEach( function ()
      {
        sandbox = sinon.createSandbox();
        mock    = sandbox.mock( renderer.context );
      } );

      afterEach( function ()
      {
        sandbox.restore();
      } );

      after( function ()
      {
        renderer.destroy();
      } );

      describe( 'new v6.Rederer2D.clear', function ()
      {
        it( 'works', function () {
          renderer.clear();
        } );
      } );

      describe( 'new v6.Renderer2D.arc', function ()
      {
        it( 'works', function ()
        {
          internal.stroke( sandbox, renderer, 'white' );
          internal.fill( sandbox, renderer, 'fuchsia' );

          internal.cover( mock, {
            beginPath: {
              exactly: [ 1 ]
            },

            arc: {
              arguments: [ 100, 50, 25, 0, Math.PI * 2 ],
              exactly:   [ 1 ]
            },

            fill: {
              exactly: [ 1 ]
            },

            stroke: {
              exactly: [ 1, 2 ]
            }
          } );

          renderer.arc( 100, 50, 25 );
          mock.verify();
        } );
      } );

      describe( 'new v6.Renderer2D.rect', function ()
      {
        it( 'works', function ()
        {
          internal.stroke( sandbox, renderer, 'red' );
          internal.fill( sandbox, renderer, 'ivory' );

          internal.cover( mock, {
            beginPath: {
              exactly: [ 1 ]
            },

            rect: {
              arguments: [ 100, 50, 25, 12.5 ],
              exactly:   [ 1 ]
            },

            fill: {
              exactly: [ 1 ]
            },

            stroke: {
              exactly: [ 1, 2 ]
            }
          } );

          renderer.rect( 100, 50, 25, 12.5 );
          mock.verify();
        } );
      } );
    } );

    describe( 'new v6.Renderer2D.resize', function ()
    {
      it( 'works', function ()
      {
        new Renderer2D().resize( 600, 400 ).should.as( { w: 600, h: 400 } );
      } );
    } );

    describe( 'new v6.Renderer2D.resizeTo', function ()
    {
      it( 'works', function ()
      {
        internal.div( function ( div )
        {
          new Renderer2D().resizeTo( div ).should.as( { w: 600, h: 400 } );
        } );
      } );
    } );

    describe.skip( 'new v6.Renderer2D.pop', function ()
    {
      before( function ()
      {
        this.renderer = new Renderer2D();
      } );

      it( 'works', function ()
      {
        this.renderer.fill( '#ff0000' );
        this.renderer.push();
        this.renderer.fill( '#ff00ff' );
        this.renderer.pop();

        console.log( this.renderer._fillColor );

        this.renderer._fillColor.should.be.like( {
          0: 255,
          1: 0,
          2: 0,
          3: 1
        } );
      } );
    } );
  } );
} );
