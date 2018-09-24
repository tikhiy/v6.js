'use strict';

var defaults         = require( 'peako/defaults' );
var align            = require( './internal/align' );
var AbstractRenderer = require( './AbstractRenderer' );
var ShaderProgram    = require( './ShaderProgram' );
var Transform        = require( './Transform' );
var constants        = require( './constants' );
var shaders          = require( './shaders' );
var options_         = require( './options' );

/**
 * Массив вершин (vertices) квадрата.
 * @private
 * @inner
 * @var {Float32Array} square
 */
var square = new Float32Array( [
  0, 0,
  1, 0,
  1, 1,
  0, 1
] );

/**
 * WebGL рендерер.
 * @constructor v6.RendererGL
 * @extends v6.AbstractRenderer
 * @param {object} options {@link v6.options}
 */
function RendererGL ( options ) {
  AbstractRenderer.call( this, ( options = defaults( options_, options ) ), constants.RENDERER_GL );

  /**
   * Эта матрица используется для таких методов как {@link v6.RendererGL#rotate}, {@link v6.RendererGL#transform}, и т.п.
   * @member {v6.Transform} v6.RendererGL#matrix
   */
  this.matrix = new Transform();

  /**
   * @member {object} v6.RendererGL#buffers
   * @property {WebGLBuffer} default Основной буфер.
   * @property {WebGLBuffer} square  Используется для отрисовки прямоугольника в {@link v6.RendererGL#rect}.
   */
  this.buffers = {
    default: this.context.createBuffer(),
    square:  this.context.createBuffer()
  };

  this.context.bindBuffer( this.context.ARRAY_BUFFER, this.buffers.square );
  this.context.bufferData( this.context.ARRAY_BUFFER, square, this.context.STATIC_DRAW );

  /**
   * @member {object} v6.RendererGL#programs
   * @property {v6.ShaderProgram} default
   */
  this.programs = {
    default: new ShaderProgram( shaders.basic, this.context )
  };

  this.blending( options.blending );
}

RendererGL.prototype = Object.create( AbstractRenderer.prototype );
RendererGL.prototype.constructor = RendererGL;

/**
 * @override
 * @method v6.RendererGL#resize
 * @param {number} w
 * @param {number} h
 * @chainable
 */
RendererGL.prototype.resize = function resize ( w, h ) {
  AbstractRenderer.prototype.resize.call( this, w, h );
  this.context.viewport( 0, 0, this.w, this.h );
  return this;
};

/**
 * @method v6.RendererGL#blending
 * @param {boolean} blending
 * @chainable
 */
RendererGL.prototype.blending = function blending ( blending ) {
  var gl = this.context;

  if ( blending ) {
    gl.enable( gl.BLEND );
    gl.disable( gl.DEPTH_TEST );
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
    gl.blendEquation( gl.FUNC_ADD );
  } else {
    gl.disable( gl.BLEND );
    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc( gl.LEQUAL );
  }

  return this;
};

/**
 * Takes normalized color channels.
 * @private
 * @method v6.RendererGL#_clear
 * @param  {number} r
 * @param  {number} g
 * @param  {number} b
 * @param  {number} a
 * @return {void}
 */
RendererGL.prototype._clear = function _clear ( r, g, b, a ) {
  var gl = this.context;
  gl.clearColor( r, g, b, a );
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
};

/**
 * @override
 * @method v6.RendererGL#backgroundColor
 */
RendererGL.prototype.backgroundColor = function backgroundColor ( r, g, b, a ) {
  var rgba = new this.settings.color( r, g, b, a ).rgba();
  this._clear( rgba[ 0 ] / 255, rgba[ 1 ] / 255, rgba[ 2 ] / 255, rgba[ 3 ] );
  return this;
};

/**
 * @method v6.RendererGL#clear
 * @chainable
 */
RendererGL.prototype.clear = function clear () {
  this._clear( 0, 0, 0, 0 );
  return this;
};

/**
 * Отрисовывает переданные вершины.
 * @method v6.RendererGL#vertices
 * @param {Float32Array?} verts Вершины, которые надо отрисовать. Если не передано, будут
 *                               использоваться вершины из стандартного буфера ({@link v6.RendererGL#buffers.default}).
 * @param {number}        count Количество вершин, например: 3 для треугольника.
 * @param {constant}      [mode=STATIC_DRAW]  Например: `GL_STATIC_DRAW`.
 * @param {number?}       _sx   X scale. Used for backwards-compability with {@link v6.Renderer2D#vertices}.
 * @param {number?}       _sy   Y scale. Used for backwards-compability with {@link v6.Renderer2D#vertices}.
 * @chainable
 * @example
 * // triangle
 * var vertices = new Float32Array( [
 *   0, 0,
 *   1, 1,
 *   0, 1
 * ] );
 *
 * // draws triangle
 * renderer.vertices( vertices, 3 );
 */
RendererGL.prototype.vertices = function vertices ( verts, count, mode, _sx, _sy ) {
  var program = this.programs.default;
  var gl      = this.context;

  if ( count < 2 ) {
    return this;
  }

  if ( verts ) {
    if ( mode == null ) {
      mode = gl.STATIC_DRAW;
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, this.buffers.default );
    gl.bufferData( gl.ARRAY_BUFFER, verts, mode );
  }

  if ( _sx != null ) {
    this.matrix.scale( _sx, _sy );
  }

  program
    .use()
    .setUniform( 'utransform', this.matrix.matrix )
    .setUniform( 'ures', [ this.w, this.h ] )
    .pointer( 'apos', 2, gl.FLOAT, false, 0, 0 );

  if ( this._doFill ) {
    program.setUniform( 'ucolor', this._fillColor.rgba() );
    gl.drawArrays( gl.TRIANGLE_FAN, 0, count );
  }

  if ( this._doStroke && this._lineWidth > 0 ) {
    program.setUniform( 'ucolor', this._strokeColor.rgba() );
    gl.lineWidth( this._lineWidth );
    gl.drawArrays( gl.LINE_LOOP, 0, count );
  }

  return this;
};

/**
 * Отрисовывает круг.
 * @method v6.RendererGL#arc
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @chainable
 */
RendererGL.prototype.arc = function arc ( x, y, r ) {
  return this._polygon( x, y, r, r, 24, 0 );
};

/**
 * Отрисовывает прямоугольник.
 * @method v6.RendererGL#rect
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @chainable
 */
RendererGL.prototype.rect = function rect ( x, y, w, h ) {
  var alignedX = align( x, w, this._rectAlignX );
  var alignedY = align( y, h, this._rectAlignY );
  this.matrix.save();
  this.matrix.translate( alignedX, alignedY );
  this.matrix.scale( w, h );
  this.context.bindBuffer( this.context.ARRAY_BUFFER, this.buffers.rect );
  this.vertices( null, 4 );
  this.matrix.restore();
  return this;
};

module.exports = RendererGL;
