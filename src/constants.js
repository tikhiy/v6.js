'use strict';

module.exports = {

  /**
   * Use in v6.renderer( options ):
   */

  MODE_AUTO: 1,
  MODE_GL:   2,
  MODE_2D:   3,

  /**
   * Use in renderer.colorMode( mode ) and v6.renderer( options.settings ):
   */

  RGBA: 4,
  HSLA: 5,

  /**
   * Use in v6.ticker( update, render, context );
   */

  SELF_CONTEXT: 6

};
