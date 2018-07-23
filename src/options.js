'use strict';

var constants = require( './constants' );

module.exports = {

  /**
   * A default options to be used in the v6.renderer( options ) function.
   */
  renderer: {

    /**
     * A renderer's settings, all the values can be changed after creating the
     * renderer.
     */
    settings: {

      /**
       * A color mode of a renderer, use in renderer.fill( r, g, b, a ) or
       * renderer.fill( h, s, l, a ).
       */
      colorMode: constants.RGBA,

      /**
       * The imageSmoothingEnabled property of a renderer's context.
       */
      smooth: false,

      /**
       * Pixel density of a renderer's context.
       */
      scale: 1
    },

    /**
     * Not implemented.
     */
    antialias: true,

    /**
     * Not completed.
     */
    blending: true,

    /**
     * Do use degrees instead of radians in the Vectors.
     */
    degrees: false,

    /**
     * Do append a renderer's canvas to a page after.
     */
    append: true,

    /**
     * Use a transparent background for a renderer's context.
     * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
     */
    alpha: true,

    /**
     * A type of a renderer's context, ('2d', 'webgl', 'auto'). When the mode is
     * 'auto' for mobile platforms 'webgl' instead of '2d' to be used.
     */
    mode: '2d'
  },

  colorMode: constants.RGBA
};
