'use strict';

var createProgram = require( './internal/create_program' );
var createShader  = require( './internal/create_shader' );

/**
 * @interface IUniform
 */

/**
 * @interface IAttribute
 */

/**
 * Высоко-уровневый интерфейс для WebGLProgram.
 * @constructor v6.ShaderProgram
 * @param {IShaderSources}        sources Шейдеры для программы.
 * @param {WebGLRenderingContext} gl      WebGL контекст.
 * @example
 * var ShaderProgram = require( 'v6.js/ShaderProgram' );
 * var shaders       = require( 'v6.js/shaders' );
 * var gl      = canvas.getContext( 'webgl' );
 * var program = new ShaderProgram( shaders.basic, gl );
 */
function ShaderProgram ( sources, gl ) {
  var vert = createShader( sources.vert, gl.VERTEX_SHADER, gl );
  var frag = createShader( sources.frag, gl.FRAGMENT_SHADER, gl );

  /**
   * WebGL программа созданная с помощью {@link createProgram}.
   * @private
   * @member {WebGLProgram} v6.ShaderProgram#_program
   */
  this._program = createProgram( vert, frag, gl );

  /**
   * WebGL контекст.
   * @private
   * @member {WebGLRenderingContext} v6.ShaderProgram#_gl
   */
  this._gl = gl;

  /**
   * @private
   * @member {object} v6.ShaderProgram#_uniforms
   */
  this._uniforms = {};

  /**
   * @private
   * @member {object} v6.ShaderProgram#_attrs
   */
  this._attrs = {};

  /**
   * @private
   * @member {number} v6.ShaderProgram#_uniformIndex
   */
  this._uniformIndex = gl.getProgramParameter( this._program, gl.ACTIVE_UNIFORMS );

  /**
   * @private
   * @member {number} v6.ShaderProgram#_attrIndex
   */
  this._attrIndex = gl.getProgramParameter( this._program, gl.ACTIVE_ATTRIBUTES );
}

ShaderProgram.prototype = {
  /**
   * @method v6.ShaderProgram#use
   * @chainable
   * @example
   * program.use();
   */
  use: function use () {
    this._gl.useProgram( this._program );
    return this;
  },

  pointer: function pointer ( name, size, type, normalized, stride, offset ) {
    var location = this.getAttr( name ).location;
    this._gl.enableVertexAttribArray( location );
    this._gl.vertexAttribPointer( location, size, type, normalized, stride, offset );
    return this;
  },

  /**
   * @method v6.ShaderProgram#getUniform
   * @param  {string}   name Название uniform.
   * @return {IUniform}      Возвращает данные о uniform.
   * @example
   * var { location } = program.getUniform( 'ucolor' );
   */
  getUniform: function getUniform ( name ) {
    var uniform = this._uniforms[ name ];
    var info, index;

    if ( uniform ) {
      return uniform;
    }

    while ( --this._uniformIndex >= 0 ) {
      info = this._gl.getActiveUniform( this._program, this._uniformIndex );

      uniform = {
        location: this._gl.getUniformLocation( this._program, info.name ),
        size: info.size,
        type: info.type
      };

      if ( info.size > 1 && ~ ( index = info.name.indexOf( '[' ) ) ) {
        uniform.name = info.name.slice( 0, index );
      } else {
        uniform.name = info.name;
      }

      this._uniforms[ uniform.name ] = uniform;

      if ( uniform.name === name ) {
        return uniform;
      }
    }

    throw ReferenceError( 'No "' + name + '" uniform found' );
  },

  /**
   * @method v6.ShaderProgram#getAttr
   * @param  {string}     name Название атрибута.
   * @return {IAttribute}      Возвращает данные о атрибуте.
   * @example
   * var { location } = program.getAttr( 'apos' );
   */
  getAttr: function getAttr ( name ) {
    var attr = this._attrs[ name ];

    if ( attr ) {
      return attr;
    }

    while ( --this._attrIndex >= 0 ) {
      attr          = this._gl.getActiveAttrib( this._program, this._attrIndex );
      attr.location = this._gl.getAttribLocation( this._program, name );
      this._attrs[ name ] = attr;

      if ( attr.name === name ) {
        return attr;
      }
    }

    throw ReferenceError( 'No "' + name + '" attribute found' );
  },

  constructor: ShaderProgram
};

/**
 * @method v6.ShaderProgram#setUniform
 * @param  {string} name  Name of the uniform.
 * @param  {any}    value Value you want to set to the uniform.
 * @chainable
 * @example
 * program.setUniform( 'ucolor', [ 255, 0, 0, 1 ] );
 */
ShaderProgram.prototype.setUniform = function setUniform ( name, value ) {
  var uniform = this.uniforms[ name ];
  var _gl     = this._gl;

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

module.exports = ShaderProgram;
