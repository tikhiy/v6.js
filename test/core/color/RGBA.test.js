'use strict';

var RGBA     = require( '../../../core/color/RGBA' );
var HSLA     = require( '../../../core/color/HSLA' );

var internal = require( '../renderer/__internal__' );

describe( 'v6.RGBA', function ()
{
  it( 'successfully required', function ()
  {
    RGBA.should.a( 'function' );
  } );

  describe( 'new v6.RGBA', function ()
  {
    var mock;
    var r;
    var g;
    var b;
    var a;

    beforeEach( function ()
    {
      mock = sinon.mock( RGBA.prototype );
      r = Math.random() * 255 | 0; // eslint-disable-line no-bitwise
      g = Math.random() * 255 | 0; // eslint-disable-line no-bitwise
      b = Math.random() * 255 | 0; // eslint-disable-line no-bitwise
      a = Math.random();
    } );

    afterEach( function ()
    {
      mock.verify();
      mock.restore();
    } );

    it( 'calls "set" method', function ()
    {
      internal.cover( mock, {
        set: {
          arguments: [ r, g, b, a ],
          exactly:   [ 1 ]
        }
      } );

      new RGBA( r, g, b, a );
    } );

    describe( 'new v6.RGBA()', function ()
    {
      it( 'works', function ()
      {
        new RGBA().should.be.like( {
          0: 0,
          1: 0,
          2: 0,
          3: 1
        } );
      } );
    } );

    describe( 'new v6.RGBA( <RGB> )', function ()
    {
      it( 'works', function ()
      {
        new RGBA( 66.6 ).should.be.like( {
          0: 66,
          1: 66,
          2: 66,
          3: 1
        } );
      } );
    } );

    describe( 'new v6.RGBA( <RGB>, <alpha> )', function ()
    {
      it( 'works', function ()
      {
        new RGBA( 66.6, 0.13 ).should.be.like( {
          0: 66,
          1: 66,
          2: 66,
          3: 0.13
        } );
      } );
    } );

    describe( 'new v6.RGBA( <R>, <G>, <B> )', function ()
    {
      it( 'works', function ()
      {
        new RGBA( 1.2, 3.4, 5.6 ).should.be.like( {
          0: 1,
          1: 3,
          2: 5,
          3: 1
        } );
      } );
    } );

    describe( 'new v6.RGBA( <R>, <G>, <B>, <alpha> )', function ()
    {
      it( 'works', function ()
      {
        new RGBA( 1.2, 3.4, 5.6, 0.7 ).should.be.like( {
          0: 1,
          1: 3,
          2: 5,
          3: 0.7
        } );
      } );
    } );

    describe( 'new v6.RGBA.type', function ()
    {
      it( 'equals to "rgba"', function ()
      {
        new RGBA().type.should.equal( 'rgba' );
      } );
    } );

    describe( 'new v6.RGBA.brightness', function ()
    {
      it( 'works', function ()
      {
        new RGBA( 'magenta' ).brightness().should.equal( 105.315 );
      } );
    } );

    describe( 'new v6.RGBA.hsla', function ()
    {
      it( 'works', function ()
      {
        new RGBA( 255, 0, 0, 1 ).hsla().should.deep.equal( new HSLA( 0, 100, 50, 1 ) );
      } );
    } );

    describe( 'new v6.RGBA.lerp', function ()
    {
      it( 'works', function ()
      {
        new RGBA( 100, 0.25 ).lerp( 200, 200, 200, 0.5 ).should.deep.equal( new RGBA( 150, 150, 150, 0.25 ) );
      } );
    } );

    describe( 'new v6.RGBA.lerpColor', function ()
    {
      it( 'works', function ()
      {
        new RGBA( 100, 0.25 ).lerpColor( new RGBA( 200, 0 ), 0.5 ).should.deep.equal( new RGBA( 150, 150, 150, 0.25 ) );
        new RGBA( '#f00' ).lerpColor( '#00f', 0.5 ).should.deep.equal( new RGBA( 127, 0, 127, 1 ) );
      } );
    } );

    describe( 'new v6.RGBA.luminance', function ()
    {
      it( 'works', function ()
      {
        new RGBA( 'magenta' ).luminance().should.equal( 72.624 );
      } );
    } );

    describe( 'new v6.RGBA.perceivedBrightness', function ()
    {
      it( 'works', function ()
      {
        new RGBA( 'magenta' ).perceivedBrightness().should.equal( 163.8759439332082 );
      } );
    } );

    describe( 'new v6.RGBA.set', function ()
    {
      it( 'works', function ()
      {
        new RGBA().set( r, g, b, a ).should.as( [ r, g, b, a ] );
      } );
    } );

    describe( 'new v6.RGBA.shade', function ()
    {
      it( 'works', function ()
      {
        new RGBA().shade( 50 ).should.deep.equal( new RGBA( 128 ) );
      } );
    } );

    describe( 'new v6.RGBA.toString', function ()
    {
      it( 'works', function ()
      {
        new RGBA( 'magenta' ).toString().should.equal( 'rgba(255, 0, 255, 1)' );
      } );
    } );
  } );
} );
