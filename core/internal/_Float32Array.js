'use strict';

if ( typeof Float32Array === 'function' ) {
  module.exports = Float32Array; // eslint-disable-line no-undef
} else {
  module.exports = Array;
}
