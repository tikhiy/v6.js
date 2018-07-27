'use strict';

var defaults      = require( 'peako/defaults' ),
    ShaderProgram = require( './ShaderProgram' ),
    Transform     = require( './Transform' ),
    constants     = require( './constants' ),
    Renderer      = require( './Renderer' ),
    shaders       = require( './defaultShaders' ),
    o             = require( './rendererOptions' );

function RendererGL ( options ) {

  options = defaults( o, options );

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
  var rgba = this.settings.color( r, g, b, a ).rgba();
  this._clearColor( rgba[ 0 ] / 255, rgba[ 1 ] / 255, rgba[ 2 ] / 255, rgba[ 3 ] );
  return this;
};

RendererGL.prototype.clear = function clear () {
  this._clearColor( 0, 0, 0, 0 );
  return this;
};

RendererGL.prototype.constructor = RendererGL;

module.exports = RendererGL;
