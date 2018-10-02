'use strict';

var Renderer2D = require( '../../core/renderer/Renderer2D' );

describe( 'v6.Renderer2D', function ()
{
  it( 'Successfully required.', function ()
  {
    Renderer2D.should.be.a( 'function' );
  } );

  describe( 'new v6.Renderer2D', function ()
  {
    it( 'Works without options.', function ()
    {
      var renderer = new Renderer2D();

      renderer.matrix.should
        .equal( renderer.context );
    } );
  } );
} );
