'use strict';

/**
 * @private
 * @method createArray
 * @param  {Array.<any>}                    array
 * @return {Array.<any>|Float32Array.<any>}
 */

if ( typeof Float32Array === 'function' ) {
  module.exports = function createArray ( array )
  {
    return new Float32Array( array ); // eslint-disable-line no-undef
  };
} else {
  module.exports = function createArray ( array )
  {
    return array;
  };
}
