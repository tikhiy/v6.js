'use strict';

var constants           = require( '../constants' );
var copyDrawingSettings = require( './copy_drawing_settings' );

var defaultDrawingSettings = {
  _rectAlignX: constants.LEFT,
  _rectAlignY: constants.TOP,
  _lineWidth:  2,
  _doStroke:   true,
  _doFill:     true
};

/**
 * Устанавливает drawing settings по умолчанию в `target`.
 * @private
 * @method setDefaultDrawingSettings
 * @param  {object}                          target   Может быть `AbstractRenderer` или простым
 *                                                    объектом.
 * @param  {module:"v6.js".AbstractRenderer} renderer `RendererGL` или `Renderer2D` нужны для
 *                                                    установки _strokeColor, _fillColor.
 * @return {object}                                   Возвращает `target`.
 */
function setDefaultDrawingSettings ( target, renderer ) {

  copyDrawingSettings( target, defaultDrawingSettings );

  target._strokeColor = new renderer.settings.color();
  target._fillColor   = new renderer.settings.color();

  return target;

}

module.exports = setDefaultDrawingSettings;
