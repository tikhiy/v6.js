/*!
 * Copyright (c) 2017-2018 SILENT
 * Released under the MIT License.
 * https://github.com/silent-tempest/v6.js/
 */

'use strict';

/**
 * @namespace v6
 */

var v6 = {
  AbstractRenderer: require( './AbstractRenderer' ),
  Camera:           require( './Camera' ),
  CompoundedImage:  require( './CompoundedImage' ),
  HSLA:             require( './colors/HSLA' ),
  Image:            require( './Image' ),
  RGBA:             require( './colors/RGBA' ),
  Renderer2D:       require( './Renderer2D' ),
  RendererGL:       require( './RendererGL' ),
  ShaderProgram:    require( './ShaderProgram' ),
  Ticker:           require( './Ticker' ),
  Transform:        require( './Transform' ),
  Vector2D:         require( './math/Vector2D' ),
  Vector3D:         require( './math/Vector3D' ),
  color:            require( './colors/color' ),
  constants:        require( './constants' ),
  createRenderer:   require( './create_renderer' ),
  options:          require( './options' ),
  settings:         require( './settings' ),
  shaders:          require( './shaders' ),
  dist:             require( './utils/dist' ),
  map:              require( './utils/map' )
};

if ( typeof self !== 'undefined' ) {
  self.v6 = v6;
}

module.exports = v6;
