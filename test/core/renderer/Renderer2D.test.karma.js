'use strict';

var Renderer2D = require( '../../../core/renderer/Renderer2D' );

var internal   = require( './internal' );

describe( 'v6.Renderer2D', function ()
{
  it( 'successfully required', function ()
  {
    Renderer2D.should.a( 'function' );
  } );

  describe( 'new v6.Renderer2D', function ()
  {
    it( 'works without options', function ()
    {
      var renderer = new Renderer2D(); // eslint-disable-line no-unused-vars
    } );

    describe( 'new v6.Renderer2D @param options.appendTo', function ()
    {
      it( 'works', function ()
      {
        internal.div( function ( div )
        {
          new Renderer2D( { appendTo: div } ).should.as( {
            canvas: {
              parentNode: div
            },

            w: 600,
            h: 400
          } );
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
  } );
} );
