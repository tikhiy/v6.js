/*!
 * Copyright (c) 2017-2018 SILENT
 * Released under the MIT License.
 * https://github.com/silent-tempest/v6
 */

'use strict';

var v6 = {
  Camera:          require( './Camera' ),
  CompoundedImage: require( './CompoundedImage' ),
  HSLA:            require( './colors/HSLA' ),
  Image:           require( './Image' ),
  RGBA:            require( './colors/RGBA' ),
  Renderer2D:      require( './Renderer2D' ),
  RendererGL:      require( './RendererGL' ),
  ShaderProgram:   require( './ShaderProgram' ),
  Ticker:          require( './Ticker' ),
  Transform:       require( './Transform' ),
  Vector2D:        require( './math/Vector2D' ),
  Vector3D:        require( './math/Vector3D' ),
  camera:          require( './camera' ),
  color:           require( './colors/color' ),
  constants:       require( './constants' ),
  hsla:            require( './colors/hsla' ),
  image:           require( './image' ),
  options:         require( './options' ),
  renderer:        require( './renderer' ),
  rgba:            require( './colors/rgba' ),
  settings:        require( './settings' ),
  shaders:         require( './shaders' ),
  ticker:          require( './ticker' ),
  vec2:            require( './math/vec2' ),
  vec3:            require( './math/vec3' )
};

if ( typeof self !== 'undefined' ) {
  self.v6 = v6;
}

module.exports = v6;
