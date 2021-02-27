'use strict';

var AbstractRenderer = require( '../../../core/renderer/AbstractRenderer' );
var createRenderer   = require( '../../../core/renderer/create_renderer' );
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
    [ '2D',   Renderer2D ],
    [ null,   Renderer2D ]
  ].forEach( function ( values )
  {
    describe( 'v6.createRenderer( ' + values[ 0 ] +  ' )', function ()
    {
      it( 'works', function ()
      {
        var options;

        if ( values[ 0 ] !== null ) {
          options = {
            type: constants.get( values[ 0 ] )
          };
        }

        createRenderer( options ).should.instanceof( values[ 1 ] );
      } );
    } );
  } );
} );
