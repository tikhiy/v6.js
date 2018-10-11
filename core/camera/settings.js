'use strict';

/**
 * Стандартные настройки камеры.
 * @namespace v6.settings.camera
 * @example
 * var settings = require( 'v6.js/core/camera/settings' );
 */

/**
 * Стандартные настройки камеры.
 * @member {object} v6.settings.camera.settings
 * @property {object}  ['zoom-out speed']
 * @property {number}  ['zoom-out speed'.value=1]
 * @property {boolean} ['zoom-out speed'.linear=true]
 * @property {object}  ['zoom-in speed']
 * @property {number}  ['zoom-in speed'.value=1]
 * @property {boolean} ['zoom-in speed'.linear=true]
 * @property {object}  ['zoom']
 * @property {number}  ['zoom'.value=1]
 * @property {number}  ['zoom'.min=1]
 * @property {number}  ['zoom'.max=1]
 * @property {object}  ['speed']
 * @property {number}  ['speed'.x=1]
 * @property {number}  ['speed'.y=1]
 */
exports.settings = {
  'zoom-out speed': {
    value:  1,
    linear: true
  },

  'zoom-in speed': {
    value:  1,
    linear: true
  },

  'zoom': {
    value: 1,
    min:   1,
    max:   1
  },

  'speed': {
    x: 1,
    y: 1
  }
};
