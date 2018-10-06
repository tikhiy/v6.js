'use strict';

var color = require( '../color/RGBA' );
var type  = require( '../constants' ).get( '2D' );

/**
 * Опции по умолчанию для создания {@link v6.Renderer2D}, {@link v6.RendererGL}, {@link v6.AbstractRenderer}, или {@link v6.createRenderer}.
 * @member {object} v6.options
 * @property {object}   [settings]               Настройки рендерера по умолчанию.
 * @property {object}   [settings.color=v6.RGBA] {@link v6.RGBA} или {@link v6.HSLA}.
 * @property {number}   [settings.scale=1]       Плотность пикселей рендерера, например: `devicePixelRatio`.
 * @property {boolean}  [antialias=true]         Пока не сделано.
 * @property {boolean}  [blending=true]          Пока не сделано.
 * @property {boolean}  [degrees=false]          Использовать градусы вместо радианов.
 * @property {Element?} [appendTo]               В этот элемент будет добавлен `canvas`.
 * @property {boolean}  [alpha=true]             Использовать прозрачный (вместо черного) контекст.
 * @property {constant} [type=2D]                Тип контекста (2D, GL, AUTO).
 */
var options = {
  settings: {
    color: color,
    scale: 1
  },

  antialias: true,
  blending:  true,
  degrees:   false,
  alpha:     true,
  type:      type
};

module.exports = options;
