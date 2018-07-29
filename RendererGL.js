'use strict';

var defaults        = require( 'peako/defaults' );

var ShaderProgram   = require( './ShaderProgram' ),
    Transform       = require( './Transform' ),
    constants       = require( './constants' ),
    Renderer        = require( './Renderer' ),
    shaders         = require( './defaultShaders' ),
    rendererOptions = require( './rendererOptions' );

function RendererGL ( options ) {

  options = defaults( rendererOptions, options );

  Renderer.call( this, options, constants.MODE_GL );

  this.matrix = new Transform();

  this.buffers = {
    default: this.context.createBuffer(),
    rect:    this.context.createBuffer()
  };

  this.shaders = {
    basic: new ShaderProgram( shaders.basicVert, shaders.basicFrag, this.context )
  };

  this.blending( options.blending );
}

RendererGL.prototype = Object.create( Renderer.prototype );

/**
 * @param {number} w
 * @param {number} h
 */
RendererGL.prototype.resize = function resize ( w, h ) {
  Renderer.prototype.resize.call( this, w, h );
  this.context.viewport( 0, 0, this.w, this.h );
  return this;
};

/**
 * @param {boolean} blending
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

RendererGL.prototype._clearColor = function _clearColor ( r, g, b, a ) {
  var gl = this.context;
  gl.clearColor( r, g, b, a );
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
};

RendererGL.prototype.backgroundColor = function backgroundColor ( r, g, b, a ) {
  var rgba = new this.settings.color( r, g, b, a ).rgba();
  this._clearColor( rgba[ 0 ] / 255, rgba[ 1 ] / 255, rgba[ 2 ] / 255, rgba[ 3 ] );
  return this;
};

RendererGL.prototype.clear = function clear () {
  this._clearColor( 0, 0, 0, 0 );
  return this;
};

RendererGL.prototype.vertices = function vertices ( verts, count, mode, _sx, _sy ) {
  var program = this.shaders.basic,
      gl      = this.context;

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
    .uniform( 'utransform', this.matrix.matrix )
    .uniform( 'ures', [ this.w, this.h ] )
    .pointer( 'apos', 2, gl.FLOAT, false, 0, 0 );

  if ( this._doFill ) {
    program.uniform( 'ucolor', this._fillColor.rgba() );
    gl.drawArrays( gl.TRIANGLE_FAN, 0, count );
  }

  if ( this._doStroke && this._lineWidth > 0 ) {
    program.uniform( 'ucolor', this._strokeColor.rgba() );
    gl.lineWidth( this._lineWidth );
    gl.drawArrays( gl.LINE_LOOP, 0, count );
  }

  return this;
};

RendererGL.prototype.constructor = RendererGL;

module.exports = RendererGL;
