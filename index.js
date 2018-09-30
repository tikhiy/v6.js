/*!
 * Copyright (c) 2017-2018 SILENT
 * Released under the MIT License.
 * https://github.com/silent-tempest/v6.js/
 */

'use strict';

/**
 * @namespace v6
 */

exports.AbstractRenderer = require( './core/renderer/AbstractRenderer' );
exports.Camera           = require( './core/Camera' );
exports.CompoundedImage  = require( './core/CompoundedImage' );
exports.HSLA             = require( './core/color/HSLA' );
exports.Image            = require( './core/Image' );
exports.RGBA             = require( './core/color/RGBA' );
exports.Renderer2D       = require( './core/renderer/Renderer2D' );
exports.RendererGL       = require( './core/renderer/RendererGL' );
exports.ShaderProgram    = require( './core/ShaderProgram' );
exports.Ticker           = require( './core/Ticker' );
exports.Transform        = require( './core/Transform' );
exports.Vector2D         = require( './core/math/Vector2D' );
exports.Vector3D         = require( './core/math/Vector3D' );
exports.color            = require( './core/color' );
exports.constants        = require( './core/constants' );
exports.createRenderer   = require( './core/renderer' );
exports.options          = require( './core/renderer/settings' );
exports.settings         = require( './core/settings' );
exports.shaders          = require( './core/shaders' );
exports.dist             = require( './core/util/dist' );
exports.map              = require( './core/util/map' );

if ( typeof self !== 'undefined' ) {
  self.v6 = exports;
}
