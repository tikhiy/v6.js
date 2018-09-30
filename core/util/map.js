'use strict';

var clamp = require( 'peako/clamp' );

module.exports = function map ( value, currentStart, currentStop, newStart, newStop, doLimit )
{
  var result = ( newStop - newStart ) * ( value - currentStart ) / ( currentStop - currentStart ) + newStart;

  if ( doLimit ) {
    if ( newStart < newStop ) {
      return clamp( result, newStart, newStop );
    }

    return clamp( result, newStop, newStart );
  }

  return result;
};
