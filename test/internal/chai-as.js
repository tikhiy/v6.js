'use strict';

var isObjectLike = require( 'peako/is-object-like' );

function as ( chai, util )
{
  function like ( object, expected )
  {
    if ( object === expected ) {
      return true;
    }

    if ( Array.isArray( expected ) && Array.isArray( object ) ) {
      return object.length === expected.length && object.every( function ( value, i )
      {
        return like( value, expected[ i ] );
      } );
    }

    if ( isObjectLike( expected ) && isObjectLike( object ) ) {
      return Object.keys( expected ).every( function ( key )
      {
        return key in object && like( object[ key ], expected[ key ] );
      } );
    }

    return false;
  }

  chai.Assertion.addMethod( 'as', function ( expected )
  {
    var object = util.flag( this, 'object' );
    var result = like( object, expected );

    this.assert( result, 'expected #{this} to be dummy like #{exp}',
      'expected #{this} to not dummy like #{exp}', expected, object,
      chai.config.showDiff );
  } );
}

module.exports = as;
