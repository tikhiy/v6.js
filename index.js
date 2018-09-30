/*!
 * Copyright (c) 2017-2018 SILENT
 * Released under the MIT License.
 * https://github.com/silent-tempest/v6.js/
 */

'use strict';

/**
 * @namespace v6
 */

exports.AbstractRenderer = require( './core/AbstractRenderer' );
exports.Camera           = require( './core/Camera' );
exports.CompoundedImage  = require( './core/CompoundedImage' );
exports.HSLA             = require( './core/colors/HSLA' );
exports.Image            = require( './core/Image' );
exports.RGBA             = require( './core/colors/RGBA' );
exports.Renderer2D       = require( './core/Renderer2D' );
exports.RendererGL       = require( './core/RendererGL' );
exports.ShaderProgram    = require( './core/ShaderProgram' );
exports.Ticker           = require( './core/Ticker' );
exports.Transform        = require( './core/Transform' );
exports.Vector2D         = require( './core/math/Vector2D' );
exports.Vector3D         = require( './core/math/Vector3D' );
exports.color            = require( './core/color' );
exports.constants        = require( './core/constants' );
exports.createRenderer   = require( './core/create_renderer' );
exports.options          = require( './core/options' );
exports.settings         = require( './core/settings' );
exports.shaders          = require( './core/shaders' );
exports.dist             = require( './core/util/dist' );
exports.map              = require( './core/util/map' );

if ( typeof self !== 'undefined' ) {
  self.v6 = exports;
}
