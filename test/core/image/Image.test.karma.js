'use strict';

var AbstractImage = require( '../../../core/image/AbstractImage' );
var Image         = require( '../../../core/image/Image' );

describe( 'v6.Image', function ()
{
  it( 'successfully required', function ()
  {
    Image.should.a( 'function' );
  } );

  it( 'extends v6.AbstractImage', function ()
  {
    Image.prototype.should.instanceof( AbstractImage );
  } );

  describe( 'new v6.Image', function ()
  {
    var img;

    beforeEach( function ()
    {
      img = document.createElement( 'img' );
      img.src = 'http://localhost:8765/image/assets/600x400.png';
    } );

    it( 'works', function ( done )
    {
      var image = new Image( img );

      image.should.like( {
        image: img
      } );

      image.on( 'complete', function ()
      {
        image.should.like( {
          sx: 0,
          sy: 0,
          sw: 600,
          sh: 400,
          dw: 600,
          dh: 400
        } );

        done();
      } );
    } );

    describe( 'new v6.Image.on(complete)', function ()
    {
      it( 'works', function ()
      {
        new Image( img ).complete().should.a( 'boolean' );
      } );
    } );

    describe( 'new v6.Image.complete', function ()
    {
      it( 'works', function ()
      {
        new Image( img ).complete().should.a( 'boolean' );
      } );
    } );

    describe( 'new v6.Image.get', function ()
    {
      it( 'works', function ()
      {
        var image = new Image( img );
        image.get().should.equal( image );
      } );
    } );

    describe( 'new v6.Image.src', function ()
    {
      it( 'works', function ()
      {
        new Image( img ).src().should.equal( img.src );
      } );
    } );
  } );
} );
