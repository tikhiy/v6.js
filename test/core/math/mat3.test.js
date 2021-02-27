'use strict';

var mat3 = require( '../../../core/math/mat3' );

describe( 'v6.mat3', function ()
{
  var identity;
  var m1;
  var m2;

  it( 'successfully required', function ()
  {
    mat3.should.be.an( 'object' );
  } );

  beforeEach( function ()
  {
    identity = [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ];

    m1 = [
      3, 2, 1,
      6, 5, 4,
      9, 8, 7
    ];

    m2 = [
      3, 6, 9,
      2, 5, 8,
      1, 4, 7
    ];
  } );

  describe( 'v6.mat3.identity', function ()
  {
    it( 'works', function ()
    {
      mat3.identity().should.have.ordered.members( identity );
    } );
  } );

  describe( 'v6.mat3.setIdentity', function ()
  {
    it( 'works', function ()
    {
      mat3.setIdentity( m1 );
      m1.should.have.ordered.members( identity );
    } );
  } );

  describe( 'v6.mat3.copy', function ()
  {
    it( 'works', function ()
    {
      mat3.copy( m1, m2 );
      m1.should.have.ordered.members( m2 );
    } );
  } );

  describe( 'v6.mat3.clone', function ()
  {
    it( 'works', function ()
    {
      mat3.clone( m1 ).should.have.ordered.members( m1 ).but.not.equal( m1 );
    } );
  } );

  describe( 'v6.mat3.scale', function ()
  {
    it( 'works', function ()
    {
      var x = 2;
      var y = 3;

      var result = [
        m1[ 0 ] * x, m1[ 1 ] * x, m1[ 2 ] * x,
        m1[ 3 ] * y, m1[ 4 ] * y, m1[ 5 ] * y,
        m1[ 6 ],     m1[ 7 ],     m1[ 8 ]
      ];

      mat3.scale( m1, x, y );
      m1.should.have.ordered.members( result );
    } );
  } );
} );
