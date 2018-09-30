/*!
 * Copyright (c) 2017-2018 SILENT
 * Released under the MIT License.
 * https://github.com/silent-tempest/v6.js/
 */

'use strict';

/**
 * @namespace v6
 */

exports.AbstractRenderer = require( './AbstractRenderer' );
exports.Camera           = require( './Camera' );
exports.CompoundedImage  = require( './CompoundedImage' );
exports.HSLA             = require( './colors/HSLA' );
exports.Image            = require( './Image' );
exports.RGBA             = require( './colors/RGBA' );
exports.Renderer2D       = require( './Renderer2D' );
exports.RendererGL       = require( './RendererGL' );
exports.ShaderProgram    = require( './ShaderProgram' );
exports.Ticker           = require( './Ticker' );
exports.Transform        = require( './Transform' );
exports.Vector2D         = require( './math/Vector2D' );
exports.Vector3D         = require( './math/Vector3D' );
exports.color            = require( './colors/color' );
exports.constants        = require( './constants' );
exports.createRenderer   = require( './create_renderer' );
exports.options          = require( './options' );
exports.settings         = require( './settings' );
exports.shaders          = require( './shaders' );
exports.dist             = require( './utils/dist' );
exports.map              = require( './utils/map' );

if ( typeof self !== 'undefined' ) {
  self.v6 = exports;
}
