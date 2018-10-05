'use strict';

var AbstractVector = require( '../../../core/math/AbstractVector' );

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
    it( 'works', function ()
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

      AbstractVector._fromAngle( Vector4D, Math.PI )
        .should
          .deep.equal( new Vector4D( Math.cos( Math.PI ), Math.sin( Math.PI ) ) );
    } );
  } );
} );
