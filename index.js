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
exports.constants        = require( './core/constants' );
exports.createRenderer   = require( './core/renderer' );
exports.options          = require( './core/renderer/settings' );
exports.settings         = require( './core/settings' );
exports.shaders          = require( './core/shaders' );

if ( typeof self !== 'undefined' ) {
  self.v6 = exports;
}
