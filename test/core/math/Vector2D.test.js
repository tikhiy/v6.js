'use strict';

var Vector2D = require( '../../../core/math/Vector2D' );

describe( 'v6.Vector2D', function ()
{
  it( 'successfully required', function ()
  {
    Vector2D.should.be.a( 'function' );
  } );

  describe( 'new v6.Vector2D', function ()
  {
    it( 'works #1', function ()
    {
      new Vector2D().should.be.like( { x: 0, y: 0 } );
    } );

    it( 'works #2', function ()
    {
      new Vector2D( 4, 2 ).should.be.like( { x: 4, y: 2 } );
    } );

    describe( 'new v6.Vector2D.set', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D().set( 4, 2 ).should.be.like( { x: 4, y: 2 } );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 4, 2 ).set().should.be.like( { x: 0, y: 0 } );
      } );
    } );

    describe( 'new v6.Vector2D.add', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D().add( 4, 2 ).should.be.like( { x: 4, y: 2 } );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 4, 2 ).add().should.be.like( { x: 4, y: 2 } );
      } );
    } );

    describe( 'new v6.Vector2D.sub', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D().sub( 4, 2 ).should.be.like( { x: -4, y: -2 } );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 4, 2 ).sub().should.be.like( { x: 4, y: 2 } );
      } );
    } );

    describe( 'new v6.Vector2D.mul', function ()
    {
      it( 'works', function ()
      {
        new Vector2D( 4, 2 ).mul( 2 ).should.be.like( { x: 8, y: 4 } );
      } );
    } );

    describe( 'new v6.Vector2D.div', function ()
    {
      it( 'works', function ()
      {
        new Vector2D( 4, 2 ).div( 2 ).should.be.like( { x: 2, y: 1 } );
      } );
    } );

    describe( 'new v6.Vector2D.dot', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D( 4, 2 ).dot( 2, 3 ).should.equal( 8 + 6 );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 4, 2 ).dot().should.equal( 0 );
      } );
    } );

    describe( 'new v6.Vector2D.lerp', function ()
    {
      it( 'works', function ()
      {
        new Vector2D( 4, 2 ).lerp( 8, 4, 0.5 ).should.be.like( { x: 6, y: 3 } );
      } );
    } );

    describe( 'new v6.Vector2D.setVector', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D( 1, 2 ).setVector( new Vector2D( 4, 2 ) ).should.be.like( { x: 4, y: 2 } );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 1, 2 ).setVector( {} ).should.be.like( { x: 0, y: 0 } );
      } );

      it( 'works #3', function ()
      {
        new Vector2D( 1, 2 ).setVector( { x: 4, y: 2 } ).should.be.like( { x: 4, y: 2 } );
      } );
    } );

    describe( 'new v6.Vector2D.addVector', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D( 1, 2 ).addVector( new Vector2D( 4, 2 ) ).should.be.like( { x: 5, y: 4 } );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 1, 2 ).addVector( {} ).should.be.like( { x: 1, y: 2 } );
      } );

      it( 'works #3', function ()
      {
        new Vector2D( 1, 2 ).addVector( { x: 4, y: 2 } ).should.be.like( { x: 5, y: 4 } );
      } );
    } );

    describe( 'new v6.Vector2D.subVector', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D( 1, 2 ).subVector( new Vector2D( 4, 2 ) ).should.be.like( { x: -3, y: 0 } );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 1, 2 ).subVector( {} ).should.be.like( { x: 1, y: 2 } );
      } );

      it( 'works #3', function ()
      {
        new Vector2D( 1, 2 ).subVector( { x: 4, y: 2 } ).should.be.like( { x: -3, y: 0 } );
      } );
    } );

    describe( 'new v6.Vector2D.mulVector', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D( 4, 2 ).mulVector( new Vector2D( 2, 3 ) ).should.be.like( { x: 8, y: 6 } );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 4, 2 ).mulVector( { x: 2, y: 3 } ).should.be.like( { x: 8, y: 6 } );
      } );
    } );

    describe( 'new v6.Vector2D.divVector', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D( 4, 2 ).divVector( new Vector2D( 2, 3 ) ).should.be.like( { x: 4 / 2, y: 2 / 3 } );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 4, 2 ).divVector( { x: 2, y: 3 } ).should.be.like( { x: 4 / 2, y: 2 / 3 } );
      } );
    } );

    describe( 'new v6.Vector2D.dotVector', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D( 4, 2 ).dotVector( new Vector2D( 2, 3 ) ).should.equal( 8 + 6 );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 4, 2 ).dotVector( {} ).should.equal( 0 );
      } );

      it( 'works #3', function ()
      {
        new Vector2D( 4, 2 ).dotVector( { x: 2, y: 3 } ).should.equal( 8 + 6 );
      } );
    } );

    describe( 'new v6.Vector2D.lerpVector', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D( 4, 2 ).lerpVector( new Vector2D( 8, 4 ), 0.5 ).should.be.like( { x: 6, y: 3 } );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 4, 2 ).lerpVector( {}, 0.5 ).should.be.like( { x: 4, y: 2 } );
      } );

      it( 'works #3', function ()
      {
        new Vector2D( 4, 2 ).lerpVector( { x: 8, y: 4 }, 0.5 ).should.be.like( { x: 6, y: 3 } );
      } );
    } );

    describe( 'new v6.Vector2D.magSq', function ()
    {
      it( 'works', function ()
      {
        new Vector2D( 4, 2 ).magSq().should.equal( ( 4 * 4 ) + ( 2 * 2 ) );
      } );
    } );

    describe( 'new v6.Vector2D.mag', function ()
    {
      it( 'works', function ()
      {
        new Vector2D( 4, 2 ).mag().should.equal( Math.sqrt( ( 4 * 4 ) + ( 2 * 2 ) ) );
      } );
    } );

    describe( 'new v6.Vector2D.clone', function ()
    {
      it( 'works', function ()
      {
        var vector = new Vector2D( 4, 2 );
        var clone = vector.clone();
        clone.should.deep.equal( vector );
        clone.should.not.equal( vector );
      } );
    } );

    describe( 'new v6.Vector2D.toString', function ()
    {
      it( 'works', function ()
      {
        new Vector2D( 4.321, 2.345 ).toString().should.equal( 'v6.Vector2D { x: 4.32, y: 2.35 }' );
      } );
    } );

    describe( 'new v6.Vector2D.dist', function ()
    {
      it( 'works #1', function ()
      {
        new Vector2D( 1, 2 ).dist( new Vector2D( 8, 4 ) ).should.equal( Math.sqrt( ( 7 * 7 ) + ( 2 * 2 ) ) );
      } );

      it( 'works #2', function ()
      {
        new Vector2D( 1, 2 ).dist( { x: 8, y: 4 } ).should.equal( Math.sqrt( ( 7 * 7 ) + ( 2 * 2 ) ) );
      } );
    } );
  } );

  describe( 'v6.Vector2D.random', function ()
  {
    it( 'works', function ()
    {
      Vector2D.random().mag().should.closeTo( 1, 1e-8 );
    } );
  } );

  describe( 'v6.Vector2D.fromAngle', function ()
  {
    it( 'works', function ()
    {
      var angle = Math.PI / 180 * 45;
      Vector2D.fromAngle( angle ).should.like( { x: Math.cos( angle ), y: Math.sin( angle ) } );
    } );
  } );
} );
