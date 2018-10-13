'use strict';

var mat3 = require( '../../../core/math/mat3' );

describe( 'v6.mat3', function ()
{
  var identity, m1, m2;

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
} );
