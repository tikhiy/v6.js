'use strict';

var constants = require( '../../core/constants' );

describe( 'v6.constants API', function ()
{
  describe( 'v6.constants.add', function ()
  {
    it( 'works', function ()
    {
      constants.add( 'MY_KEY_1' );
    } );

    it( 'throws if key is taken', function ()
    {
      constants.add( 'MY_KEY_2' );

      ( function ()
      {
        constants.add( 'MY_KEY_2' );
      } ).should.throw( Error );
    } );
  } );

  describe( 'v6.constants.get', function ()
  {
    it( 'works', function ()
    {
      constants.get( 'AUTO' ).should.be.a( 'number' );
    } );

    it( 'throws if no key found', function ()
    {
      ( function ()
      {
        constants.get( 'MY_KEY_3' );
      } ).should.throw( Error );
    } );
  } );
} );
