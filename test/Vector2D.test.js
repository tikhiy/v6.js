'use strict';

var Vector2D = require( '../math/Vector2D' );

describe( 'v6.Vector2D', function ()
{
  it( 'Successfully required.', function ()
  {
    Vector2D
      .should
        .a( 'function' );
  } );

  describe( 'new v6.Vector2D', function ()
  {
    it( 'Works.', function ()
    {
      new Vector2D()
        .should
          .like( { x: 0, y: 0 } );

      new Vector2D( 4, 2 )
        .should
          .like( { x: 4, y: 2 } );
    } );

    describe( 'new v6.Vector2D.set', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D().set( 4, 2 )
          .should
            .like( { x: 4, y: 2 } );
      } );
    } );

    describe( 'new v6.Vector2D.add', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D().add( 4, 2 )
          .should
            .like( { x: 4, y: 2 } );
      } );
    } );

    describe( 'new v6.Vector2D.sub', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D().sub( 4, 2 )
          .should
            .like( { x: -4, y: -2 } );
      } );
    } );

    describe( 'new v6.Vector2D.mul', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D( 4, 2 ).mul( 2 )
          .should
            .like( { x: 8, y: 4 } );
      } );
    } );

    describe( 'new v6.Vector2D.div', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D( 4, 2 ).div( 2 )
          .should
            .like( { x: 2, y: 1 } );
      } );
    } );

    describe( 'new v6.Vector2D.dot', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D( 4, 2 ).dot( 2, 3 )
          .should
            .equal( 8 + 6 );
      } );
    } );

    describe( 'new v6.Vector2D.lerp', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D( 4, 2 ).lerp( 8, 4, 0.5 )
          .should
            .like( { x: 6, y: 3 } );
      } );
    } );

    describe( 'new v6.Vector2D.setVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D().setVector( new Vector2D( 4, 2 ) )
          .should
            .like( { x: 4, y: 2 } );
      } );
    } );

    describe( 'new v6.Vector2D.addVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D().addVector( new Vector2D( 4, 2 ) )
          .should
            .like( { x: 4, y: 2 } );
      } );
    } );

    describe( 'new v6.Vector2D.subVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D().subVector( new Vector2D( 4, 2 ) )
          .should
            .like( { x: -4, y: -2 } );
      } );
    } );

    describe( 'new v6.Vector2D.mulVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D( 4, 2 ).mulVector( new Vector2D( 2, 3 ) )
          .should
            .like( { x: 8, y: 6 } );
      } );
    } );

    describe( 'new v6.Vector2D.divVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D( 4, 2 ).divVector( new Vector2D( 2, 3 ) )
          .should
            .like( { x: 4 / 2, y: 2 / 3 } );
      } );
    } );

    describe( 'new v6.Vector2D.dotVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D( 4, 2 ).dotVector( new Vector2D( 2, 3 ) )
          .should
            .equal( 8 + 6 );
      } );
    } );

    describe( 'new v6.Vector2D.lerpVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D( 4, 2 ).lerpVector( new Vector2D( 8, 4 ), 0.5 )
          .should
            .like( { x: 6, y: 3 } );
      } );
    } );

    describe( 'new v6.Vector2D.magSq', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D( 4, 2 ).magSq()
          .should
            .equal( ( 4 * 4 ) + ( 2 * 2 ) );
      } );
    } );

    describe( 'new v6.Vector2D.mag', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D( 4, 2 ).mag()
          .should
            .equal( Math.sqrt( ( 4 * 4 ) + ( 2 * 2 ) ) );
      } );
    } );

    describe( 'new v6.Vector2D.clone', function ()
    {
      it( 'Works.', function ()
      {
        var vector = new Vector2D( 4, 2 );

        vector.clone()
          .should
            .deep.equal( vector );
      } );
    } );

    describe( 'new v6.Vector2D.toString', function ()
    {
      it( 'Works.', function ()
      {
        new Vector2D( 4.321, 2.345 ).toString()
          .should
            .equal( 'Vector2D { 4.32, 2.35 }' );
      } );
    } );
  } );

  describe( 'v6.Vector2D.random', function ()
  {
    it( 'Works.', function ()
    {
      Vector2D.random().mag()
        .should
          .closeTo( 1, 1e-8 );
    } );
  } );

  describe( 'v6.Vector2D.fromAngle', function ()
  {
    it( 'Works.', function ()
    {
      var angle = Math.PI / 180 * 45;

      Vector2D.fromAngle( angle )
        .should
          .like( { x: Math.cos( angle ), y: Math.sin( angle ) } );
    } );
  } );
} );
