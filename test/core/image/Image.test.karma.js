'use strict';

var CompoundedImage = require( '../../../core/image/CompoundedImage' );
var AbstractImage   = require( '../../../core/image/AbstractImage' );
var Image           = require( '../../../core/image/Image' );

describe( 'v6.Image', function ()
{
  var src = 'http://localhost:8765/image/assets/600x400.png';
  var img, image;

  beforeEach( function ()
  {
    img = document.createElement( 'img' );
    img.src = src;
  } );

  beforeEach( function ()
  {
    image = new Image( img );
  } );

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
    it( 'works', function ( done )
    {
      image.should.like( {
        image: img
      } );

      image.once( 'complete', function ()
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

    describe( 'new v6.Image.complete', function ()
    {
      it( 'works', function ()
      {
        image.complete().should.a( 'boolean' );
      } );
    } );

    describe( 'new v6.Image.get', function ()
    {
      it( 'works', function ()
      {
        image.get().should.equal( image );
      } );
    } );

    describe( 'new v6.Image.src', function ()
    {
      it( 'works', function ()
      {
        image.src().should.equal( img.src );
      } );
    } );
  } );

  describe( 'v6.Image.fromURL', function ()
  {
    it( 'works', function ()
    {
      Image.fromURL( src ).should.as( {
        image: {
          src: src
        }
      } );
    } );
  } );

  describe( 'v6.Image.stretch', function ()
  {
    it( 'works', function ()
    {
      var stretched = Image.stretch( image, 400, 600 );

      stretched.should.like( {
        image: image,
        sx: 0,
        sy: 0,
        sw: 600,
        sh: 400,
        dw: 900,
        dh: 600
      } );

      stretched.should.instanceof( CompoundedImage );
    } );

    it( 'works with cut image', function ()
    {
      var cut       = Image.cut( image, 200, 100, 400, 300 );
      var stretched = Image.stretch( cut, 400, 600 );

      stretched.should.like( {
        image: image,
        sx: 200,
        sy: 100,
        sw: 400,
        sh: 300,
        dw: 800,
        dh: 600
      } );
    } );
  } );

  describe( 'v6.Image.cut', function ()
  {
    it( 'works', function ()
    {
      var cut = Image.cut( Image.cut( image, 25, 50, 75, 100 ), 10, 20, 30, 40 );

      cut.should.like( {
        image: image,
        sx: 35,
        sy: 70,
        sw: 30,
        sh: 40,
        dw: 30,
        dh: 40
      } );

      cut.should.instanceof( CompoundedImage );
    } );
  } );
} );
