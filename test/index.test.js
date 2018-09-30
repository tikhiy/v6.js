'use strict';

var ShaderProgram       = require( '../core/ShaderProgram' );
var constants           = require( '../core/constants' );
var align               = require( '../core/renderer/internal/align' );

describe( 'ShaderProgram', function ()
{
  it( 'works', function ()
  {
    ShaderProgram.should.be.a( 'function' );
  } );
} );

describe( 'internal/align', function ()
{
  it( 'works', function ()
  {
    align.should.be.a( 'function' );
  } );

  describe( 'align()', function ()
  {
    it( 'works', function ()
    {
      align( 500, 250, constants.get( 'LEFT' ) )
        .should
          .equal( 500 );

      align( 400, 200, constants.get( 'MIDDLE' ) )
        .should
          .equal( 300 );

      align( 300, 150, constants.get( 'BOTTOM' ) )
        .should
          .equal( 150 );
    } );
  } );

  describe( 'bad use', function ()
  {
    it( 'throws', function ()
    {
      expect( align ).throw();
    } );
  } );
} );
