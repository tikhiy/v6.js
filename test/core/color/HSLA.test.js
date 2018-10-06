'use strict';

var RGBA     = require( '../../../core/color/RGBA' );
var HSLA     = require( '../../../core/color/HSLA' );

var internal = require( '../renderer/internal' );

describe( 'v6.HSLA', function ()
{
  it( 'successfully required', function ()
  {
    HSLA.should.a( 'function' );
  } );

  describe( 'new v6.HSLA', function ()
  {
    var mock, h, s, l, a;

    beforeEach( function ()
    {
      mock = sinon.mock( HSLA.prototype );
      h = Math.random() * 360 | 0; // eslint-disable-line no-bitwise
      s = Math.random() * 100 | 0; // eslint-disable-line no-bitwise
      l = Math.random() * 100 | 0; // eslint-disable-line no-bitwise
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
          arguments: [ h, s, l, a ],
          exactly:   [ 1 ]
        }
      } );

      new HSLA( h, s, l, a );
    } );

    describe( 'new v6.HSLA.type', function ()
    {
      it( 'equals to "hsla"', function ()
      {
        new HSLA().type.should.equal( 'hsla' );
      } );
    } );

    describe( 'new v6.HSLA.brightness', function ()
    {
      it( 'works', function ()
      {
        new HSLA( 'magenta' ).brightness().should.equal( 105.315 );
      } );
    } );

    describe( 'new v6.HSLA.rgba', function ()
    {
      it( 'works', function ()
      {
        new HSLA( 'magenta' ).rgba().should.deep.equal( new RGBA( 255, 0, 255, 1 ) );
      } );
    } );

    describe( 'new v6.HSLA.lerp', function ()
    {
      it( 'works', function ()
      {
        new HSLA( 50, 0.25 ).lerp( 0, 0, 100, 0.5 ).should.deep.equal( new HSLA( 0, 0, 75, 0.25 ) );
      } );
    } );

    describe( 'new v6.HSLA.lerpColor', function ()
    {
      it( 'works', function ()
      {
        new HSLA( 50, 0.25 ).lerpColor( new HSLA( 100, 0 ), 0.5 ).should.deep.equal( new HSLA( 0, 0, 75, 0.25 ) );
      } );
    } );

    describe( 'new v6.HSLA.luminance', function ()
    {
      it( 'works', function ()
      {
        new HSLA( 'magenta' ).luminance().should.equal( 72.624 );
      } );
    } );

    describe( 'new v6.HSLA.perceivedBrightness', function ()
    {
      it( 'works', function ()
      {
        new HSLA( 'magenta' ).perceivedBrightness().should.equal( 163.8759439332082 );
      } );
    } );

    describe( 'new v6.HSLA.set', function ()
    {
      it( 'works', function ()
      {
        new HSLA().set( h, s, l, a ).should.as( [ h, s, l, a ] );
      } );
    } );

    describe( 'new v6.HSLA.shade', function ()
    {
      it( 'works', function ()
      {
        new HSLA( 0, 100, 75, 1 ).shade( -10 ).should.deep.equal( new HSLA( 0, 100, 65, 1 ) );
      } );
    } );

    describe( 'new v6.HSLA.toString', function ()
    {
      it( 'works', function ()
      {
        new HSLA( 'red' ).toString().should.equal( 'hsla(0, 100%, 50%, 1)' );
      } );
    } );
  } );
} );
