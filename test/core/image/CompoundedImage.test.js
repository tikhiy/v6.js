'use strict';

var CompoundedImage = require( '../../../core/image/CompoundedImage' );
var Image           = require( '../../../core/image/Image' );

describe( 'v6.CompoundedImage', function ()
{
  it( 'successfully required', function ()
  {
    CompoundedImage.should.a( 'function' );
  } );

  describe( 'new v6.CompoundedImage', function ()
  {
    var image;

    beforeEach( function ()
    {
      image = Object.create( Image.prototype );
    } );

    it( 'works', function ()
    {
      new CompoundedImage( image, 1, 2, 3, 4, 5, 6 ).should.like( {
        image: image,
        sx: 1,
        sy: 2,
        sw: 3,
        sh: 4,
        dw: 5,
        dh: 6
      } );
    } );

    describe( 'new v6.CompoundedImage.get', function ()
    {
      it( 'works', function ()
      {
        new CompoundedImage( image, 0, 0, 0, 0, 0, 0 ).get().should.equal( image );
      } );
    } );
  } );
} );
