'use strict';

var _setDefaultDrawingSettings = require( './_setDefaultDrawingSettings' );

var _getContextNameGL = require( './_getContextNameGL' );

var constants = require( './constants' );

var rendererIndex = 0;

/**
 * @param {Renderer2D|RendererGL} self The renderer to initialize.
 * @param {number} mode The mode of a new renderer, can be v6.constants.MODE_2D or v6.constants.MODE_GL.
 * @param {Object} options The options, see v6.options for more information.
 */
module.exports = function _createRenderer ( self, mode, options ) {

  var getContextOptions = {
    alpha: options.alpha
  };

  if ( options.canvas ) {
    self.canvas = options.canvas;
  } else {
    self.canvas = document.createElement( 'canvas' );
    self.canvas.innerHTML = 'Unable to run the application.';
  }

  if ( options.append ) {
    self.add();
  }

  if ( mode === constants.MODE_2D ) {
    self.context = self.canvas.getContext( '2d', getContextOptions );
  } else if ( mode === constants.MODE_GL ) {
    if ( ( mode = _getContextNameGL() ) ) {
      self.context = self.canvas.getContext( mode, getContextOptions );
    } else {
      throw Error( 'Cannot get WebGL context. Try to use v6.constants.MODE_GL as the renderer mode or v6.Renderer2D instead of v6.RendererGL' );
    }
  }

  _setDefaultDrawingSettings( self, self );

  self.settings    = options.settings;

  self.mode        = mode;

  self.index       = rendererIndex;

  /**
   * A stack for use in the push and pop functions to save the drawing settings.
   */
  self._stack      = [];

  self._stackIndex = -1;

  /*
   * An accumulator for vertices in the functions beginShape, vertex, endShape.
   */
  self._vertices   = [];

  if ( 'width' in options || 'height' in options ) {
    self.resize( options.width, options.height );
  } else {
    self.resizeTo( window );
  }

  // Increment the count of created renderers.

  rendererIndex += 1;

};
