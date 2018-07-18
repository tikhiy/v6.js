'use strict';

module.exports = {

  /**
   * Use in v6.renderer( options ):
   * v6.renderer( { mode: v6.constants.RENDERER_MODE_AUTO } );
   */

  RENDERER_MODE_WEBGL: 1,
  RENDERER_MODE_AUTO:  2,
  RENDERER_MODE_2D:    3,

  /**
   * Use in renderer.colorMode( mode ) and v6.renderer( options.settings ):
   * v6.renderer( { settings: { colorMode: v6.constants.HSLA } } );
   */

  RGBA: 4,
  HSLA: 5

};
