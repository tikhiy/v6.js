'use strict';

var isObjectLike = require( 'peako/is-object-like' );

function as ( _chai, utils )
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

  _chai.Assertion.addMethod( 'as', function ( expected )
  {
    var object = utils.flag( this, 'object' );
    var result = like( object, expected );
    this.assert( result, 'expected #{this} to be as #{exp}', 'expected #{this} not to be as #{exp}', expected, object, _chai.config.showDiff );
  } );
}

module.exports = as;
