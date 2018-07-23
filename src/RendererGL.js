'use strict';

var defaults = require( 'peako/defaults' );

var Transform = require( './Transform' );

var constants = require( './constants' );

var Renderer = require( './Renderer' );

var o = require( './options' );

function RendererGL ( options ) {

  options = defaults( options, o.renderer );

  Renderer.call( this, options, constants.MODE_GL );

  this.matrix = new Transform();

  this.buffers = {
    default: this.context.createBuffer(),
    rect:    this.context.createBuffer()
  };

  this.shaders = {};

  this.addShaders( shaders );

  this.useShaders( shaders );

  this.blending( options.blending );
}

RendererGL.prototype = Object.create( Renderer.prototype );

RendererGL.prototype.resize = function resize ( w, h ) {

  Renderer.prototype.resize.call( this, w, h );

  this.context.viewport( 0, 0, this.w, this.h );

  return this;

};

RendererGL.prototype.addShaders = function addShaders ( shaders ) {
  this.shaders.push( shaders );
};

RendererGL.prototype.constructor = RendererGL;

module.exports = RendererGL;
