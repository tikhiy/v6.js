'use strict';

var _createProgram = require( './internal/_create-program' ),
    _createShader  = require( './internal/_create-shader' );

function ShaderProgram ( vert, frag, gl ) {
  if ( typeof vert === 'string' ) {
    vert = _createShader( vert, gl.VERTEX_SHADER, gl );
  }

  if ( typeof frag === 'string' ) {
    frag = _createShader( frag, gl.FRAGMENT_SHADER, gl );
  }

  this._program   = _createProgram( vert, frag, gl );
  this._gl        = gl;
  this.attributes = attributes( gl, this._program );
  this.uniforms   = uniforms( gl, this._program );
}

ShaderProgram.prototype = {
  use: function use () {

    this._gl.useProgram( this._program );

    return this;

  },

  pointer: function pointer ( name, size, type, normalized, stride, offset ) {

    var location = this.attributes[ name ].location;

    var _gl = this._gl;

    _gl.enableVertexAttribArray( location );
    _gl.vertexAttribPointer( location, size, type, normalized, stride, offset );

    return this;

  },

  constructor: ShaderProgram
};

ShaderProgram.prototype.uniform = function uniform ( name, value ) {
  var uniform = this.uniforms[ name ];

  var _gl = this._gl;

  switch ( uniform.type ) {
    case _gl.BOOL:
    case _gl.INT:
      if ( uniform.size > 1 ) {
        _gl.uniform1iv( uniform.location, value );
      } else {
        _gl.uniform1i( uniform.location, value );
      }

      break;
    case _gl.FLOAT:
      if ( uniform.size > 1 ) {
        _gl.uniform1fv( uniform.location, value );
      } else {
        _gl.uniform1f( uniform.location, value );
      }

      break;
    case _gl.FLOAT_MAT2:
      _gl.uniformMatrix2fv( uniform.location, false, value );
      break;
    case _gl.FLOAT_MAT3:
      _gl.uniformMatrix3fv( uniform.location, false, value );
      break;
    case _gl.FLOAT_MAT4:
      _gl.uniformMatrix4fv( uniform.location, false, value );
      break;
    case _gl.FLOAT_VEC2:
      if ( uniform.size > 1 ) {
        _gl.uniform2fv( uniform.location, value );
      } else {
        _gl.uniform2f( uniform.location, value[ 0 ], value[ 1 ] );
      }

      break;
    case _gl.FLOAT_VEC3:
      if ( uniform.size > 1 ) {
        _gl.uniform3fv( uniform.location, value );
      } else {
        _gl.uniform3f( uniform.location, value[ 0 ], value[ 1 ], value[ 2 ] );
      }

      break;
    case _gl.FLOAT_VEC4:
      if ( uniform.size > 1 ) {
        _gl.uniform4fv( uniform.location, value );
      } else {
        _gl.uniform4f( uniform.location, value[ 0 ], value[ 1 ], value[ 2 ], value[ 3 ] );
      }

      break;
    default:
      throw TypeError( 'The uniform type is not supported' );
  }

  return this;
};

function attributes ( gl, program ) {

  var i = gl.getProgramParameter( program, gl.ACTIVE_ATTRIBUTES ) - 1;

  var attributes = {};

  var attribute;

  for ( ; i >= 0; --i ) {

    attribute          = gl.getActiveAttrib( program, i );
    attribute.location = gl.getAttribLocation( program, attribute.name );

    attributes[ attribute.name ] = attribute;

  }

  return attributes;

}

function uniforms ( gl, program ) {

  var i = gl.getProgramParameter( program, gl.ACTIVE_UNIFORMS ) - 1;

  var uniforms = {};

  var uniform, index, info;

  for ( ; i >= 0; --i ) {

    info = gl.getActiveUniform( program, i );

    uniform = {
      location: gl.getUniformLocation( program, info.name ),
      size: info.size,
      type: info.type
    };

    if ( info.size > 1 && ~ ( index = info.name.indexOf( '[0]' ) ) ) {
      uniform.name = info.name.slice( 0, index );
    } else {
      uniform.name = info.name;
    }

    uniforms[ uniform.name ] = uniform;

  }

  return uniforms;

}

module.exports = ShaderProgram;
