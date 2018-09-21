'use strict';

var Vector2D = require( '../math/Vector2D' );

describe( 'math/Vector2D', function () {
  it( 'works', function () {
    Vector2D.should.be.a( 'function' );
  } );

  describe( 'new Vector2D', function () {
    it( 'works', function () {
      new Vector2D( 4, 2 )
        .should
          .instanceof( Vector2D )
          .like( { x: 4, y: 2 } );
    } );

    it( 'uses default parameters', function () {
      new Vector2D().should.like( { x: 0, y: 0 } );
    } );

    describe( 'new Vector2D.lerp', function () {
      it( 'works', function () {
        new Vector2D( 10, 10 ).lerp( 0, 0, 0.5 ).mag()
          .should
            .equal( new Vector2D( 5, 5 ).mag() );
      } );
    } );

    describe( 'new Vector2D.lerpVector', function () {
      it( 'works', function () {
        new Vector2D( 10, 10 ).lerpVector( new Vector2D(), 0.5 ).mag()
          .should
            .equal( new Vector2D( 5, 5 ).mag() );
      } );
    } );
  } );

  describe( 'Vector2D.fromAngle', function () {
    it( 'works', function () {
      var angle = Math.PI / 180 * 45;

      Vector2D.fromAngle( angle )
        .should
          .instanceof( Vector2D )
          .like( { x: Math.cos( angle ), y: Math.sin( angle ) } );
    } );
  } );

  describe( 'Vector2D.random', function () {
    it( 'works', function () {
      var vector = Vector2D.random();

      vector
        .should
          .instanceof( Vector2D );

      vector.mag()
        .should
          .equal( 1 );
    } );
  } );
} );
