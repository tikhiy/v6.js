'use strict';

module.exports = function _createPolygon ( n ) {

  var i = Math.floor( n );

  var verts = new Float32Array( i * 2 + 2 );

  var step = Math.PI * 2 / n;

  for ( ; i >= 0; --i ) {
    verts[     i * 2 ] = Math.cos( step * i );
    verts[ 1 + i * 2 ] = Math.sin( step * i );
  }

  return verts;

};
