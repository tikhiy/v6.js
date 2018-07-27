'use strict';

var Vector3D = require( './Vector3D' );

module.exports = function vec3 ( x, y, z ) {
  return new Vector3D( x, y, z );
};
