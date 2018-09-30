'use strict';

var Vector3D = require( '../core/math/Vector3D' );

describe( 'v6.Vector3D', function ()
{
  it( 'Successfully required.', function ()
  {
    Vector3D
      .should
        .a( 'function' );
  } );

  describe( 'new v6.Vector3D', function ()
  {
    it( 'Works.', function ()
    {
      new Vector3D()
        .should
          .like( { x: 0, y: 0, z: 0 } );

      new Vector3D( 4, 2, 6 )
        .should
          .like( { x: 4, y: 2, z: 6 } );
    } );

    describe( 'new v6.Vector3D.set', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D().set( 4, 2, 6 )
          .should
            .like( { x: 4, y: 2, z: 6 } );
      } );
    } );

    describe( 'new v6.Vector3D.add', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D().add( 4, 2, 6 )
          .should
            .like( { x: 4, y: 2, z: 6 } );
      } );
    } );

    describe( 'new v6.Vector3D.sub', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D().sub( 4, 2, 6 )
          .should
            .like( { x: -4, y: -2, z: -6 } );
      } );
    } );

    describe( 'new v6.Vector3D.mul', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D( 4, 2, 6 ).mul( 2 )
          .should
            .like( { x: 8, y: 4, z: 12 } );
      } );
    } );

    describe( 'new v6.Vector3D.div', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D( 4, 2, 6 ).div( 2 )
          .should
            .like( { x: 2, y: 1, z: 3 } );
      } );
    } );

    describe( 'new v6.Vector3D.dot', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D( 4, 2, 6 ).dot( 2, 3, 4 )
          .should
            .equal( 8 + 6 + 24 );
      } );
    } );

    describe( 'new v6.Vector3D.lerp', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D( 4, 2, 6 ).lerp( 8, 4, 12, 0.5 )
          .should
            .like( { x: 6, y: 3, z: 9 } );
      } );
    } );

    describe( 'new v6.Vector3D.setVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D().setVector( new Vector3D( 4, 2, 6 ) )
          .should
            .like( { x: 4, y: 2, z: 6 } );
      } );
    } );

    describe( 'new v6.Vector3D.addVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D().addVector( new Vector3D( 4, 2, 6 ) )
          .should
            .like( { x: 4, y: 2, z: 6 } );
      } );
    } );

    describe( 'new v6.Vector3D.subVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D().subVector( new Vector3D( 4, 2, 6 ) )
          .should
            .like( { x: -4, y: -2, z: -6 } );
      } );
    } );

    describe( 'new v6.Vector3D.mulVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D( 4, 2, 6 ).mulVector( new Vector3D( 2, 3, 4 ) )
          .should
            .like( { x: 8, y: 6, z: 24 } );
      } );
    } );

    describe( 'new v6.Vector3D.divVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D( 4, 2, 6 ).divVector( new Vector3D( 2, 3, 4 ) )
          .should
            .like( { x: 4 / 2, y: 2 / 3, z: 6 / 4 } );
      } );
    } );

    describe( 'new v6.Vector3D.dotVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D( 4, 2, 6 ).dotVector( new Vector3D( 2, 3, 4 ) )
          .should
            .equal( 8 + 6 + 24 );
      } );
    } );

    describe( 'new v6.Vector3D.lerpVector', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D( 4, 2, 6 ).lerpVector( new Vector3D( 8, 4, 12 ), 0.5 )
          .should
            .like( { x: 6, y: 3, z: 9 } );
      } );
    } );

    describe( 'new v6.Vector3D.magSq', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D( 4, 2, 6 ).magSq()
          .should
            .equal( ( 4 * 4 ) + ( 2 * 2 ) + ( 6 * 6 ) );
      } );
    } );

    describe( 'new v6.Vector3D.mag', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D( 4, 2, 6 ).mag()
          .should
            .equal( Math.sqrt( ( 4 * 4 ) + ( 2 * 2 ) + ( 6 * 6 ) ) );
      } );
    } );

    describe( 'new v6.Vector3D.clone', function ()
    {
      it( 'Works.', function ()
      {
        var vector = new Vector3D( 4, 2, 6 );

        vector.clone()
          .should
            .deep.equal( vector );
      } );
    } );

    describe( 'new v6.Vector3D.toString', function ()
    {
      it( 'Works.', function ()
      {
        new Vector3D( 4.321, 2.345, 6.543 ).toString()
          .should
            .equal( 'Vector3D { 4.32, 2.35, 6.54 }' );
      } );
    } );
  } );

  describe( 'v6.Vector3D.random', function ()
  {
    it( 'Works.', function ()
    {
      Vector3D.random().mag()
        .should
          .closeTo( 1, 1e-8 );
    } );
  } );

  describe( 'v6.Vector3D.fromAngle', function ()
  {
    it( 'Works.', function ()
    {
      var angle = Math.PI / 180 * 45;

      Vector3D.fromAngle( angle )
        .should
          .like( { x: Math.cos( angle ), y: Math.sin( angle ), z: 0 } );
    } );
  } );
} );
