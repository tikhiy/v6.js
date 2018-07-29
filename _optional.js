'use strict';

var optional = require;

/**
 * @param {string} url
 * @param {string} alt
 */

// _optional( 'peako/base/base-for-in', [ 'peako', 'forOwnRight' ] )
// // -> require( 'peako/base/base-for-in' ) or peako.forOwnRight
// _optional( 'qs/lib/parse', [ 'qs', 'parse' ] );
// // -> require( 'qs/lib/parse' ) or self.qs.parse
// _optional( 'platform', [ 'platform' ] );
// // -> require( 'platform' ) or self.platform
// _optional( 'some-module' )
// // -> require( 'some-module' ) or nothing

module.exports = function _optional ( url, alt ) {
  var res, i, l;

  try {
    return optional( url );
  } catch ( e ) {}

  if ( ! alt || typeof self === 'undefined' ) {
    return;
  }

  for ( res = self, i = 0, l = alt.length; i < l; ++i ) {
    if ( res[ alt[ i ] ] == null ) {
      return;
    }

    res = res[ alt[ i ] ];
  }

  return res;
};
