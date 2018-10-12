'use strict';

var defaults = require( 'peako/defaults' );
var mixin    = require( 'peako/mixin' );

var settings = require( './settings' );

/**
 * Класс камеры. Этот класс удобен для создания камеры, которая должна быть
 * направленна на определенный объект в приложении, например: на машину в
 * гоночной игре. Камера будет сама плавно и с анимацией направляться на нужный
 * объект.
 * @constructor v6.Camera
 * @param {object}              [options]          Параметры для создания камеры, смотрите {@link v6.settings.camera}.
 * @param {v6.AbstractRenderer} [options.renderer] Рендерер.
 * @example <caption>Require "v6.Camera"</caption>
 * var Camera = require( 'v6.js/core/camera/Camera' );
 * @example <caption>Create an instance</caption>
 * var camera = new Camera();
 * @example <caption>Create an instance with options</caption>
 * var camera = new Camera( {
 *   settings: {
 *     speed: {
 *       x: 0.15,
 *       y: 0.15
 *     }
 *   }
 * } );
 * @example <caption>Create an instance with renderer</caption>
 * var camera = new Camera( {
 *   renderer: renderer
 * } );
 */
function Camera ( options )
{
  options = defaults( settings, options );

  /**
   * Настройки камеры, такие как скорость анимации или масштаб.
   * @member {object} v6.Camera#settings
   */
  this.settings = options.settings;

  if ( options.renderer ) {
    /**
     * Рендерер.
     * @member {v6.AbstractRenderer|void} v6.Camera#renderer
     */
    this.renderer = options.renderer;
  }

  if ( ! this.settings.offset ) {
    if ( this.renderer ) {
      this.settings.offset = {
        x: this.renderer.w * 0.5,
        y: this.renderer.h * 0.5
      };
    } else {
      this.settings.offset = {
        x: 0,
        y: 0
      };
    }
  }

  /**
   * Объект, на который направлена камера.
   * @private
   * @member {object?} v6.Camera#_object
   * @see v6.Camera#lookAt
   */
  this._object = null;

  /**
   * Свойство, которое надо брать из {@link v6.Camera#_object}.
   * @private
   * @member {string?} v6.Camera#_key
   * @see v6.Camera#lookAt
   */
  this._key = null;

  /**
   * Текущяя позиция камеры (сюда направлена камера).
   * @member {IVector2D} v6.Camera#_looksAt
   */
  this._looksAt = {
    x: 0,
    y: 0
  };
}

Camera.prototype = {
  /**
   * Возвращает объект, на который камера должна быть направлена.
   * @private
   * @method v6.Camera#_getObject
   * @return {IVector2D?} Объект или "null".
   */
  _getObject: function _getObject ()
  {
    if ( this._key === null ) {
      return this._object;
    }

    return this._object[ this._key ];
  },

  /**
   * Устанавливает настройки.
   * @method v6.Camera#set
   * @param {string} setting Имя настройки: "zoom-in speed", "zoom-out speed", "zoom".
   * @param {any}    value   Новое значение настройки.
   * @chainable
   * @example
   * // Set zoom-in speed setting to 0.0025 with linear flag.
   * camera.set( 'zoom-in speed', { value: 0.0025, linear: true } );
   * // Turn off linear flag.
   * camera.set( 'zoom-in speed', { linear: false } );
   * // Set zoom setting to 1 with range [ 0.75 .. 1.125 ].
   * camera.set( 'zoom', { value: 1, min: 0.75, max: 1.125 } );
   * // Set camera speed.
   * camera.set( 'speed', { x: 0.1, y: 0.1 } );
   */
  set: function set ( setting, value )
  {
    switch ( setting ) {
      case 'zoom-out speed':
      case 'zoom-in speed':
      case 'speed':
      case 'zoom':
        mixin( this.settings[ setting ], value );
        break;
      default:
        throw Error( 'Got unknown setting name: ' + setting );
    }

    return this;
  },

  /**
   * Направляет камеру на определенную позицию (`"object"`).
   * @method v6.Camera#lookAt
   * @param {IVector2D} object Позиция, в которую должна смотреть камера.
   * @param {string}   [key]   Свойство, которое надо брать из `object`.
   * @chainable
   * @example
   * // An object.
   * var car = {
   *   position: {
   *     x: 4,
   *     y: 2
   *   }
   * };
   * // Direct a camera on the car.
   * camera.lookAt( car, 'position' );
   * // This way works too but if the 'position' will be replaced it would not work.
   * camera.lookAt( car.position );
   */
  lookAt: function lookAt ( object, key )
  {
    this._object = object;

    if ( typeof key === 'undefined' ) {
      this._key = null;
    } else {
      this._key = key;
    }

    return this;
  },

  /**
   * Возвращает позицию, на которую камера должна быть направлена.
   * @method v6.Camera#shouldLookAt
   * @return {IVector2D} Позиция.
   * @example
   * var object = {
   *   position: {
   *     x: 4,
   *     y: 2
   *   }
   * };
   *
   * camera.lookAt( object, 'position' ).shouldLookAt(); // -> { x: 4, y: 2 } (clone of "object.position").
   */
  shouldLookAt: function shouldLookAt ()
  {
    var position = this._getObject();

    if ( position === null ) {
      return {
        x: 0,
        y: 0
      };
    }

    return {
      x: position.x,
      y: position.y
    };
  },

  /**
   * Обновляет позицию, на которую направлена камера.
   * @method v6.Camera#update
   * @chainable
   * @see
   * ticker.on( 'update', function ()
   * {
   *   // Update a camera on each frame.
   *   camera.update();
   * } );
   */
  update: function update ()
  {
    var object   = this._getObject();
    var position = this._looksAt;
    var destination;

    if ( object ) {
      destination = {
        x: this.settings.offset.x / this.settings.zoom.value - object.x,
        y: this.settings.offset.y / this.settings.zoom.value - object.y
      };

      if ( position.x !== destination.x ) {
        position.x += ( destination.x - position.x ) * this.settings.speed.x;
      }

      if ( position.y !== destination.y ) {
        position.y += ( destination.y - position.y ) * this.settings.speed.y;
      }
    }

    return this;
  },

  constructor: Camera
};

module.exports = Camera;
