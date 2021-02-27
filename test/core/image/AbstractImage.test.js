'use strict';

var LightEmitter  = require( 'light_emitter' );

var AbstractImage = require( '../../../core/image/AbstractImage' );

describe( 'v6.AbstractImage', function ()
{
  it( 'successfully required', function ()
  {
    AbstractImage.should.a( 'function' );
  } );

  it( 'extends LightEmitter', function ()
  {
    AbstractImage.prototype.should.instanceof( LightEmitter );
  } );

  describe( 'new v6.AbstractImage', function ()
  {
    it( 'throws on attempt to create an instance', function ()
    {
      ( function ()
      {
        return new AbstractImage();
      } ).should.throw( Error );
    } );
  } );
} );
