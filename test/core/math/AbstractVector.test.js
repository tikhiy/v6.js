'use strict';

var AbstractVector = require( '../../../core/math/AbstractVector' );

var settings       = require( '../../../core/settings' );

describe( 'v6.AbstractVector', function ()
{
  it( 'successfully required', function ()
  {
    AbstractVector.should.be.a( 'function' );
  } );

  describe( 'new v6.AbstractVector', function ()
  {
    it( 'throws on attempt to create an instance', function ()
    {
      ( function ()
      {
        return new AbstractVector();
      } ).should.throw( Error );
    } );
  } );

  describe( 'v6.AbstractVector._fromAngle', function ()
  {
    before( function ()
    {
      function Vector4D ( x, y, z, w )
      {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
      }

      Vector4D.prototype = Object.create( AbstractVector.prototype );
      Vector4D.prototype.constructor = Vector4D;

      this.Vector4D = Vector4D;
    } );

    [
      [ 'works with radians', false, Math.PI, Math.PI ],
      [ 'works with degrees', true,  180,     Math.PI ]
    ].forEach( function ( values )
    {
      it( values[ 0 ], function ()
      {
        settings.degrees = values[ 1 ];

        AbstractVector._fromAngle( this.Vector4D, values[ 2 ] ).should.deep.equal(
          new this.Vector4D( Math.cos( values[ 3 ] ), Math.sin( values[ 3 ] ) ) );

        settings.degrees = false;
      } );
    } );
  } );
} );
