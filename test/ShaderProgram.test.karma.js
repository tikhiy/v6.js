'use strict';

var ShaderProgram = require( '../core/ShaderProgram' );
var shaders       = require( '../core/shaders' );

describe( 'v6.ShaderProgram', function ()
{
  it( 'required successfully', function ()
  {
    ShaderProgram
      .should
        .be.a( 'function' );

    ShaderProgram.prototype
      .should
        .be.an( 'object' );
  } );

  describe( 'new v6.ShaderProgram', function ()
  {
    it( 'works', function ()
    {
      var program = new ShaderProgram( shaders.basic, document.createElement( 'canvas' ).getContext( 'webgl' ) ); // eslint-disable-line no-unused-vars
    } );
  } );
} );
