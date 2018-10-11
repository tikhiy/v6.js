/*!
 * Copyright (c) 2017-2018 VladislavTikhiy (SILENT) (silent-tempest)
 * Released under the GPL-3.0 license.
 * https://github.com/silent-tempest/v6.js/tree/dev/
 */

'use strict';

/**
 * @namespace v6
 */

/**
 * A valid CSS-color: `"hsl(360, 100%, 100%)"`, `"#ff00ff"`, `"lightpink"`. {@link v6.HSLA} or {@link v6.RGBA}.
 * @typedef {string|v6.HSLA|v6.RGBA} TColor
 */

/**
 * @typedef {number} constant
 * @see v6.constants
 * @example
 * // This is a constant.
 * var RENDERER_TYPE = constants.get( 'GL' );
 */

/**
 * @interface IVector2D
 * @property {number} x
 * @property {number} y
 */

exports.AbstractImage    = require( './core/image/AbstractImage' );
exports.AbstractRenderer = require( './core/renderer/AbstractRenderer' );
exports.AbstractVector   = require( './core/math/AbstractVector' );
exports.Camera           = require( './core/camera/Camera' );
exports.CompoundedImage  = require( './core/image/CompoundedImage' );
exports.HSLA             = require( './core/color/HSLA' );
exports.Image            = require( './core/image/Image' );
exports.RGBA             = require( './core/color/RGBA' );
exports.Renderer2D       = require( './core/renderer/Renderer2D' );
exports.RendererGL       = require( './core/renderer/RendererGL' );
exports.ShaderProgram    = require( './core/ShaderProgram' );
exports.Ticker           = require( './core/Ticker' );
exports.Transform        = require( './core/Transform' );
exports.Vector2D         = require( './core/math/Vector2D' );
exports.Vector3D         = require( './core/math/Vector3D' );
exports.constants        = require( './core/constants' );
exports.createRenderer   = require( './core/renderer' );
exports.shaders          = require( './core/shaders' );

/**
 * Настройки "v6.js".
 * @namespace v6.settings
 */
exports.settings = {
  renderer: require( './core/renderer/settings' ),
  camera:   require( './core/camera/settings' ),
  core:     require( './core/settings' )
};

if ( typeof self !== 'undefined' ) {
  self.v6 = exports;
}
