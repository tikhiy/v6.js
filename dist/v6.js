(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

/**
 * @interface IShaderAttribute
 * @property {number} location
 * @property {string} name
 * @property {number} size
 * @property {number} type
 * @see [getAttribLocation](https://mdn.io/getAttribLocation)
 * @see [WebGLActiveInfo](https://mdn.io/WebGLActiveInfo)
 */

/**
 * @interface IShaderUniform
 * @property {number} location
 * @property {string} name
 * @property {number} size
 * @property {number} type
 * @see [getActiveUniform](https://mdn.io/getActiveUniform)
 * @see [WebGLActiveInfo](https://mdn.io/WebGLActiveInfo)
 */

var createProgram = require( './internal/create_program' );
var createShader  = require( './internal/create_shader' );

/**
 * Высокоуровневый интерфейс для WebGLProgram.
 * @constructor v6.ShaderProgram
 * @param {IShaderSources}        sources Шейдеры для программы.
 * @param {WebGLRenderingContext} gl      WebGL контекст.
 * @example <caption>Require "v6.ShaderProgram"</caption>
 * var ShaderProgram = require( 'v6.js/ShaderProgram' );
 * @example <caption>Use without renderer</caption>
 * // Require "v6.js" shaders.
 * var shaders = require( 'v6.js/shaders' );
 * // Create a program.
 * var program = new ShaderProgram( shaders.basic, glContext );
 */
function ShaderProgram ( sources, gl )
{
  var vert = createShader( sources.vert, gl.VERTEX_SHADER, gl );
  var frag = createShader( sources.frag, gl.FRAGMENT_SHADER, gl );

  /**
   * WebGL программа созданная с помощью {@link createProgram}.
   * @private
   * @member {WebGLProgram} v6.ShaderProgram#_program
   */
  this._program = createProgram( vert, frag, gl );

  /**
   * WebGL контекст.
   * @private
   * @member {WebGLRenderingContext} v6.ShaderProgram#_gl
   */
  this._gl = gl;

  /**
   * Кешированные атрибуты шейдеров.
   * @private
   * @member {object} v6.ShaderProgram#_attributes
   * @see v6.ShaderProgram#getAttribute
   */
  this._attributes = {};

  /**
   * Кешированные формы (uniforms) шейдеров.
   * @private
   * @member {object} v6.ShaderProgram#_uniforms
   * @see v6.ShaderProgram#getUniform
   */
  this._uniforms = {};

  /**
   * Индекс последнего полученного атрибута.
   * @private
   * @member {number} v6.ShaderProgram#_attributeIndex
   * @see v6.ShaderProgram#getAttribute
   */
  this._attributeIndex = gl.getProgramParameter( this._program, gl.ACTIVE_ATTRIBUTES );

  /**
   * Индекс последней полученной формы (uniform).
   * @private
   * @member {number} v6.ShaderProgram#_uniformIndex
   * @see v6.ShaderProgram#getUniform
   */
  this._uniformIndex = gl.getProgramParameter( this._program, gl.ACTIVE_UNIFORMS );
}

ShaderProgram.prototype = {
  /**
   * @method v6.ShaderProgram#getAttribute
   * @param  {string}           name Название атрибута.
   * @return {IShaderAttribute}      Возвращает данные о атрибуте.
   * @example
   * var location = program.getAttribute( 'apos' ).location;
   */
  getAttribute: function getAttribute ( name )
  {
    var attr = this._attributes[ name ];
    var info;

    if ( attr ) {
      return attr;
    }

    while ( --this._attributeIndex >= 0 ) {
      info = this._gl.getActiveAttrib( this._program, this._attributeIndex );

      attr = {
        location: this._gl.getAttribLocation( this._program, name ),
        name: info.name,
        size: info.size,
        type: info.type
      };

      this._attributes[ attr.name ] = attr;

      if ( attr.name === name ) {
        return attr;
      }
    }

    throw ReferenceError( 'No "' + name + '" attribute found' );
  },

  /**
   * @method v6.ShaderProgram#getUniform
   * @param  {string}         name Название формы (uniform).
   * @return {IShaderUniform}      Возвращает данные о форме (uniform).
   * @example
   * var location = program.getUniform( 'ucolor' ).location;
   */
  getUniform: function getUniform ( name )
  {
    var uniform = this._uniforms[ name ];
    var index, info;

    if ( uniform ) {
      return uniform;
    }

    while ( --this._uniformIndex >= 0 ) {
      info = this._gl.getActiveUniform( this._program, this._uniformIndex );

      uniform = {
        location: this._gl.getUniformLocation( this._program, info.name ),
        size: info.size,
        type: info.type
      };

      if ( info.size > 1 && ~ ( index = info.name.indexOf( '[' ) ) ) { // eslint-disable-line no-bitwise
        uniform.name = info.name.slice( 0, index );
      } else {
        uniform.name = info.name;
      }

      this._uniforms[ uniform.name ] = uniform;

      if ( uniform.name === name ) {
        return uniform;
      }
    }

    throw ReferenceError( 'No "' + name + '" uniform found' );
  },

  /**
   * @method v6.ShaderProgram#setAttribute
   * @chainable
   * @see [WebGLRenderingContext#enableVertexAttribArray](https://mdn.io/enableVertexAttribArray)
   * @see [WebGLRenderingContext#vertexAttribPointer](https://mdn.io/vertexAttribPointer)
   * @example
   * program.setAttribute( 'apos', 2, gl.FLOAT, false, 0, 0 );
   */
  setAttribute: function setAttribute ( name, size, type, normalized, stride, offset )
  {
    var location = this.getAttribute( name ).location;
    this._gl.enableVertexAttribArray( location );
    this._gl.vertexAttribPointer( location, size, type, normalized, stride, offset );
    return this;
  },

  /**
   * @method v6.ShaderProgram#setUniform
   * @param  {string} name  Название формы (uniform).
   * @param  {any}    value Новое значение формы (uniform).
   * @chainable
   * @example
   * program.setUniform( 'ucolor', [ 255, 0, 0, 1 ] );
   */
  setUniform: function setUniform ( name, value )
  {
    var uniform = this.getUniform( name );
    var _gl     = this._gl;

    switch ( uniform.type ) {
      case _gl.BOOL:
      case _gl.INT:
        if ( uniform.size > 1 ) {
          _gl.uniform1iv( uniform.location, value );
        } else {
          _gl.uniform1i( uniform.location, value );
        }
        break;
      case _gl.FLOAT:
        if ( uniform.size > 1 ) {
          _gl.uniform1fv( uniform.location, value );
        } else {
          _gl.uniform1f( uniform.location, value );
        }
        break;
      case _gl.FLOAT_MAT2:
        _gl.uniformMatrix2fv( uniform.location, false, value );
        break;
      case _gl.FLOAT_MAT3:
        _gl.uniformMatrix3fv( uniform.location, false, value );
        break;
      case _gl.FLOAT_MAT4:
        _gl.uniformMatrix4fv( uniform.location, false, value );
        break;
      case _gl.FLOAT_VEC2:
        if ( uniform.size > 1 ) {
          _gl.uniform2fv( uniform.location, value );
        } else {
          _gl.uniform2f( uniform.location, value[ 0 ], value[ 1 ] );
        }
        break;
      case _gl.FLOAT_VEC3:
        if ( uniform.size > 1 ) {
          _gl.uniform3fv( uniform.location, value );
        } else {
          _gl.uniform3f( uniform.location, value[ 0 ], value[ 1 ], value[ 2 ] );
        }
        break;
      case _gl.FLOAT_VEC4:
        if ( uniform.size > 1 ) {
          _gl.uniform4fv( uniform.location, value );
        } else {
          _gl.uniform4f( uniform.location, value[ 0 ], value[ 1 ], value[ 2 ], value[ 3 ] );
        }
        break;
      default:
        throw TypeError( 'The uniform type is not supported ("' + name + '")' );
    }

    return this;
  },

  /**
   * @method v6.ShaderProgram#use
   * @chainable
   * @see [WebGLRenderingContext#useProgram](https://mdn.io/useProgram)
   * @example
   * program.use();
   */
  use: function use ()
  {
    this._gl.useProgram( this._program );
    return this;
  },

  constructor: ShaderProgram
};

module.exports = ShaderProgram;

},{"./internal/create_program":15,"./internal/create_shader":16}],2:[function(require,module,exports){
'use strict';

var LightEmitter = require( 'light_emitter' );
var timestamp    = require( 'peako/timestamp' );
var timer        = require( 'peako/timer' );

/**
 * Этот класс используется для зацикливания анимации вместо `requestAnimationFrame`.
 * @constructor v6.Ticker
 * @extends {LightEmitter}
 * @fires update
 * @fires render
 * @example
 * var Ticker = require( 'v6.js/Ticker' );
 * var ticker = new Ticker();
 * @example <caption>"update" event.</caption>
 * // Fires everytime an application should be updated.
 * // Depends on maximum FPS.
 * ticker.on( 'update', function ( elapsedTime ) {
 *   shape.rotation += 10 * elapsedTime;
 * } );
 * @example <caption>"render" event.</caption>
 * // Fires everytime an application should be rendered.
 * // Unlike "update", independent from maximum FPS.
 * ticker.on( 'render', function () {
 *   renderer.rotate( shape.rotation );
 * } );
 */
function Ticker ()
{
  var self = this;

  LightEmitter.call( this );

  this.lastRequestAnimationFrameID = 0;
  this.lastRequestTime = 0;
  this.skippedTime = 0;
  this.totalTime = 0;
  this.running = false;

  /**
   * Запускает цикл анимации.
   * @method v6.Ticker#start
   * @chainable
   * @example
   * ticker.start();
   */
  function start ( _now )
  {
    var elapsedTime;

    if ( ! self.running ) {
      if ( ! _now ) {
        self.lastRequestAnimationFrameID = timer.request( start );
        self.lastRequestTime = timestamp();
        self.running = true;
      }

      return this; // eslint-disable-line no-invalid-this
    }

    if ( ! _now ) {
      _now = timestamp();
    }

    elapsedTime = Math.min( 1, ( _now - self.lastRequestTime ) * 0.001 );

    self.skippedTime += elapsedTime;
    self.totalTime   += elapsedTime;

    while ( self.skippedTime >= self.step && self.running ) {
      self.skippedTime -= self.step;
      self.emit( 'update', self.step, _now );
    }

    self.emit( 'render', elapsedTime, _now );
    self.lastRequestTime = _now;
    self.lastRequestAnimationFrameID = timer.request( start );

    return this; // eslint-disable-line no-invalid-this
  }

  this.start = start;
  this.fps( 60 );
}

Ticker.prototype = Object.create( LightEmitter.prototype );
Ticker.prototype.constructor = Ticker;

/**
 * Устанавливает максимальное количество кадров в секунду (FPS) анимации.
 * @method v6.Ticker#fps
 * @param {number} fps Максимальный FPS, например: 60.
 * @chainable
 * @example
 * // Set maximum animation FPS to 10.
 * // Do not need to restart ticker.
 * ticker.fps( 10 );
 */
Ticker.prototype.fps = function fps ( fps )
{
  this.step = 1 / fps;
  return this;
};

/**
 * @method v6.Ticker#clear
 * @chainable
 */
Ticker.prototype.clear = function clear ()
{
  this.skippedTime = 0;
  return this;
};

/**
 * Останавливает анимацию.
 * @method v6.Ticker#stop
 * @chainable
 * @example
 * ticker.on( 'render', function () {
 *   // Stop the ticker after five seconds.
 *   if ( this.totalTime >= 5 ) {
 *     ticker.stop();
 *   }
 * } );
 */
Ticker.prototype.stop = function stop ()
{
  this.running = false;
  return this;
};

module.exports = Ticker;

},{"light_emitter":41,"peako/timer":94,"peako/timestamp":95}],3:[function(require,module,exports){
'use strict';

var mat3 = require( './math/mat3' );

function Transform ()
{
  this.matrix = mat3.identity();
  this._index = -1;
  this._stack = [];
}

Transform.prototype = {
  save: function save ()
  {
    if ( ++this._index < this._stack.length ) {
      mat3.copy( this._stack[ this._index ], this.matrix );
    } else {
      this._stack.push( mat3.clone( this.matrix ) );
    }
  },

  restore: function restore ()
  {
    if ( this._index >= 0 ) {
      mat3.copy( this.matrix, this._stack[ this._index-- ] );
    } else {
      mat3.setIdentity( this.matrix );
    }
  },

  setTransform: function setTransform ( m11, m12, m21, m22, dx, dy )
  {
    mat3.setTransform( this.matrix, m11, m12, m21, m22, dx, dy );
  },

  translate: function translate ( x, y )
  {
    mat3.translate( this.matrix, x, y );
  },

  rotate: function rotate ( angle )
  {
    mat3.rotate( this.matrix, angle );
  },

  scale: function scale ( x, y )
  {
    mat3.scale( this.matrix, x, y );
  },

  /**
   * Применяет "transformation matrix" из соответствующих параметров на текущий "transformation matrix".
   * @method v6.Transform#transform
   * @param  {number}  m11 X scale.
   * @param  {number}  m12 X skew.
   * @param  {number}  m21 Y skew.
   * @param  {number}  m22 Y scale.
   * @param  {number}  dx  X translate.
   * @param  {number}  dy  Y translate.
   * @return {void}        Ничего не возвращает.
   * @example
   * // Apply scaled twice "transformation matrix".
   * transform.transform( 2, 0, 0, 2, 0, 0 );
   */
  transform: function transform ( m11, m12, m21, m22, dx, dy )
  {
    mat3.transform( this.matrix, m11, m12, m21, m22, dx, dy );
  },

  constructor: Transform
};

module.exports = Transform;

},{"./math/mat3":22}],4:[function(require,module,exports){
'use strict';
var defaults = require( 'peako/defaults' );
var mixin = require( 'peako/mixin' );
var settings = require( './settings' );
/**
 * Класс камеры. Этот класс удобен для создания камеры, которая должна быть
 * направленна на определенный объект в приложении, например: на машину в
 * гоночной игре. Камера будет сама плавно и с анимацией направляться на нужный
 * объект. Есть возможность анимированного отдаления или приближения камеры.
 * @constructor v6.Camera
 * @param {object} [options] Параметры для создания камеры, смотрите {@link v6.settings.camera}.
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
  var x, y;
  options = defaults( settings, options );
  /**
   * Настройки камеры, такие как скорость анимации или масштаб.
   * @member {object} v6.Camera#settings
   * @see v6.settings.camera.settings
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
      x = this.renderer.w * 0.5;
      y = this.renderer.h * 0.5;
    } else {
      x = 0;
      y = 0;
    }
    this.settings.offset = {
      x: x,
      y: y
    };
  }
  /**
   * Объект, на который направлена камера.
   * @private
   * @member {object?} v6.Camera#_destination
   * @see v6.Camera#lookAt
   */
  this._destination = null;
  /**
   * Свойство, которое надо брать из {@link v6.Camera#_destination}.
   * @private
   * @member {string?} v6.Camera#_destinationKey
   * @see v6.Camera#lookAt
   */
  this._destinationKey = null;
  /**
   * Текущяя позиция камеры (сюда направлена камера).
   * @private
   * @member {IVector2D} v6.Camera#_currentPosition
   */
  this._currentPosition = {
    x: 0,
    y: 0
  };
}
Camera.prototype = {
  /**
   * Возвращает объект, на который камера должна быть направлена.
   * @private
   * @method v6.Camera#_getDestination
   * @return {IVector2D?} Объект или "null".
   */
  _getDestination: function _getDestination ()
  {
    var _destinationKey = this._destinationKey;
    if ( _destinationKey === null ) {
      return this._destination;
    }
    return this._destination[ _destinationKey ];
  },
  /**
   * Устанавливает настройки.
   * @method v6.Camera#set
   * @param {string} setting Имя настройки: "zoom-in speed", "zoom-out speed", "zoom", "speed", "offset".
   * @param {any}    value   Новое значение настройки.
   * @chainable
   * @example
   * // Set zoom-in speed setting to 0.0025 with linear flag (default: true).
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
      case 'offset':
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
   * Направляет камеру на определенную позицию (`"destination"`).
   * @method v6.Camera#lookAt
   * @param {IVector2D} destination Позиция, в которую должна смотреть камера.
   * @param {string}   [key]   Свойство, которое надо брать из `"destination"`.
   * @chainable
   * @example
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
  lookAt: function lookAt ( destination, key )
  {
    this._destination = destination;
    if ( typeof key === 'undefined' ) {
      this._destinationKey = null;
    } else {
      this._destinationKey = key;
    }
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
   * camera.lookAt( destination, 'position' ).shouldLookAt(); // -> { x: 4, y: 2 } (clone of "object.position").
   */
  shouldLookAt: function shouldLookAt ()
  {
    var _destination = this._getDestination();
    var x, y;
    if ( _destination === null ) {
      x = 0;
      y = 0;
    } else {
      x = _destination.x;
      y = _destination.y;
    }
    return {
      x: x,
      y: y
    };
  },
  /**
   * Обновляет позицию, на которую направлена камера.
   * @method v6.Camera#update
   * @return {void} Ничего не возвращает.
   * @chainable
   * @example
   * ticker.on( 'update', function ()
   * {
   *   // Update a camera on each frame.
   *   camera.update();
   * } );
   */
  update: function update ()
  {
    var _destination = this._getDestination();
    if ( _destination !== null ) {
      translate( this, _destination, 'x' );
      translate( this, _destination, 'y' );
    }
  },
  /**
   * Возвращает позицию, на которую камера направлена сейчас.
   * @method v6.Camera#looksAt
   * @return {IVector2D} Текущее направление камеры.
   * @example
   * // A camera looks at [ x, y ] from looksAt now.
   * var looksAt = camera.looksAt();
   */
  looksAt: function looksAt ()
  {
    return {
      x: this._currentPosition.x,
      y: this._currentPosition.y
    };
  },
  /**
   * Применяет камеру на матрицу или рендерер.
   * @method v6.Camera#apply
   * @param  {v6.Transform|v6.AbstractRenderer} [matrix] Матрица или рендерер.
   * @return {void}                                      Ничего не возвращает.
   * @example <caption>Apply on a renderer</caption>
   * var renderer = v6.createRenderer();
   * camera.apply( renderer );
   * @example <caption>Apply on a transform</caption>
   * var matrix = new v6.Transform();
   * camera.apply( matrix );
   * @example <caption>Apply on a camera's renderer</caption>
   * var camera = new v6.Camera( {
   *   renderer: renderer
   * } );
   *
   * camera.apply();
   */
  apply: function apply ( matrix )
  {
    var zoom = this.settings.zoom.value;
    var x = transform( this, this._currentPosition, 'x' );
    var y = transform( this, this._currentPosition, 'y' );
    ( matrix || this.renderer ).setTransform( zoom, 0, 0, zoom, zoom * x, zoom * y );
  },
  /**
   * Определяет, видит ли камера объект из соответсвующих параветров (x, y, w, h) сейчас,
   * если нет, то этот объект можно не отрисовывать.
   * @method v6.Camera#sees
   * @param  {number}              x          X координата объекта.
   * @param  {number}              y          Y координата объекта.
   * @param  {number}              w          Ширина объекта.
   * @param  {number}              h          Высота объекта.
   * @param  {v6.AbstractRenderer} [renderer] Рендерер.
   * @return {boolean}                        `true`, если объект должен быть отрисован.
   * @example
   * if ( camera.sees( object.x, object.y, object.w, object.h ) ) {
   *   object.show();
   * }
   */
  sees: function sees ( x, y, w, h, renderer )
  {
    var zoom = this.settings.zoom.value;
    var offset = this.settings.offset;
    var _currentPosition = this._currentPosition;
    if ( ! renderer ) {
      renderer = this.renderer;
    }
    if ( ! renderer ) {
      throw Error( 'No renderer (camera.sees)' );
    }
    return x + w > _currentPosition.x - offset.x / zoom &&
           x < _currentPosition.x + ( renderer.w - offset.x ) / zoom &&
           y + h > _currentPosition.y - offset.y / zoom &&
           y < _currentPosition.y + ( renderer.h - offset.y ) / zoom;
  },
  /**
   * Отдаляет камеру. Анимация может быть линейной (по умолчанию) если это включено:
   * ```javascript
   * camera.set( 'zoom-out speed', {
   *   // Enables linear animation (enabled by default but you can disable).
   *   linear: true
   * } );
   * ```
   * Скорость анимации изменяется через `value`:
   * ```javascript
   * camera.set( 'zoom-out speed', {
   *   // Set slow zoom-out speed (1 by default).
   *   value: 0.1
   * } );
   * ```
   * @method v6.Camera#zoomOut
   * @return {void} Ничего не возвращает.
   * @example
   * ticker.on( 'update', function ()
   * {
   *   camera.zoomOut();
   * } );
   */
  zoomOut: function zoomOut () { var zoomSpeed = this.settings[ 'zoom-out speed' ]; var zoom = this.settings.zoom; var change; if ( zoom.value !== zoom.min ) { if ( zoomSpeed.linear ) { change = zoomSpeed.value * zoom.value; } else { change = zoomSpeed.value; } zoom.value = Math.max( zoom.value - change, zoom.min ); } }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Приближает камеру. Анимация может быть линейной (по умолчанию) если это включено:
   * ```javascript
   * camera.set( 'zoom-in speed', {
   *   // Enables linear animation (enabled by default but you can disable).
   *   linear: true
   * } );
   * ```
   * Скорость анимации изменяется через `value`:
   * ```javascript
   * camera.set( 'zoom-in speed', {
   *   // Set slow zoom-in speed (1 by default).
   *   value: 0.1
   * } );
   * ```
   * @method v6.Camera#zoomIn
   * @return {void} Ничего не возвращает.
   * @example
   * ticker.on( 'update', function ()
   * {
   *   camera.zoomIn();
   * } );
   */
  zoomIn: function zoomIn () { var zoomSpeed = this.settings[ 'zoom-in speed' ]; var zoom = this.settings.zoom; var change; if ( zoom.value !== zoom.max ) { if ( zoomSpeed.linear ) { change = zoomSpeed.value * zoom.value; } else { change = zoomSpeed.value; } zoom.value = Math.min( zoom.value + change, zoom.max ); } }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  constructor: Camera
};
function transform ( camera, position, axis )
{
  return camera.settings.offset[ axis ] / camera.settings.zoom.value - position[ axis ];
}
function translate ( camera, destination, axis )
{
  var transformedDestination = transform( camera, destination, axis );
  var transformedCurrentPosition = transform( camera, camera._currentPosition, axis );
  camera._currentPosition[ axis ] += ( transformedDestination - transformedCurrentPosition ) * camera.settings.speed[ axis ];
}
module.exports = Camera;

},{"./settings":5,"peako/defaults":65,"peako/mixin":86}],5:[function(require,module,exports){
'use strict';

/**
 * Стандартные настройки камеры.
 * @namespace v6.settings.camera
 * @example
 * var settings = require( 'v6.js/core/camera/settings' );
 */

/**
 * Рендерер.
 * @member {v6.AbstractRenderer} v6.settings.camera.renderer
 */

/**
 * Стандартные настройки камеры.
 * @member {object} v6.settings.camera.settings
 * @property {object}    ['zoom-out speed']
 * @property {number}    ['zoom-out speed'.value=1]     Скорость уменьшения масштаба (отдаления) камеры.
 * @property {boolean}   ['zoom-out speed'.linear=true] Делать анимацию линейной.
 * @property {object}    ['zoom-in speed']
 * @property {number}    ['zoom-in speed'.value=1]      Скорость увеличения масштаба (приближения) камеры.
 * @property {boolean}   ['zoom-in speed'.linear=true]  Делать анимацию линейной.
 * @property {object}    ['zoom']
 * @property {number}    ['zoom'.value=1]               Текущий масштаб камеры.
 * @property {number}    ['zoom'.min=1]                 Минимальный масштаб камеры.
 * @property {number}    ['zoom'.max=1]                 Максимальный масштаб камеры.
 * @property {object}    ['speed']                      Скорость направления камеры на объект.
 * @property {number}    ['speed'.x=1]                  1 - моментальное перемещение по X, 0.1 - медленное.
 * @property {number}    ['speed'.y=1]                  1 - моментальное перемещение по Y, 0.1 - медленное.
 * @property {IVector2D} ['offset']
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

},{}],6:[function(require,module,exports){
'use strict';

module.exports = HSLA;

var clamp = require( 'peako/clamp' );      // eslint-disable-line vars-on-top

var parse = require( './internal/parse' ); // eslint-disable-line vars-on-top

var RGBA  = require( './RGBA' );           // eslint-disable-line vars-on-top

/**
 * HSLA цвет.
 * @constructor v6.HSLA
 * @param {number|TColor} [h] Hue value.
 * @param {number}        [s] Saturation value.
 * @param {number}        [l] Lightness value.
 * @param {number}        [a] Alpha value.
 * @see v6.HSLA#set
 * @example
 * var HSLA = require( 'v6.js/core/color/HSLA' );
 *
 * var transparent = new HSLA( 'transparent' );
 * var magenta     = new HSLA( 'magenta' );
 * var fuchsia     = new HSLA( 300, 100, 50 );
 * var ghost       = new HSLA( 100, 0.1 );
 * var white       = new HSLA( 100 );
 * var black       = new HSLA();
 */
function HSLA ( h, s, l, a )
{
  /**
   * @member {number} v6.HSLA#0 "hue" value.
   */

  /**
   * @member {number} v6.HSLA#1 "saturation" value.
   */

  /**
   * @member {number} v6.HSLA#2 "lightness" value.
   */

  /**
   * @member {number} v6.HSLA#3 "alpha" value.
   */

  this.set( h, s, l, a );
}

HSLA.prototype = {
  /**
   * Возвращает воспринимаемую яркость (perceived brightness) цвета.
   * @method v6.HSLA#perceivedBrightness
   * @return {number}
   * @example
   * new HSLA( 'magenta' ).perceivedBrightness(); // -> 163.8759439332082
   */
  perceivedBrightness: function perceivedBrightness ()
  {
    return this.rgba().perceivedBrightness();
  },

  /**
   * Возвращает относительную яркость цвета.
   * @method v6.HSLA#luminance
   * @return {number}
   * @see https://en.wikipedia.org/wiki/Relative_luminance
   * @example
   * new HSLA( 'magenta' ).luminance(); // -> 72.624
   */
  luminance: function luminance ()
  {
    return this.rgba().luminance();
  },

  /**
   * Возвращает яркость цвета.
   * @method v6.HSLA#brightness
   * @return {number}
   * @see https://www.w3.org/TR/AERT/#color-contrast
   * @example
   * new HSLA( 'magenta' ).brightness(); // -> 105.315
   */
  brightness: function brightness ()
  {
    return this.rgba().brightness();
  },

  /**
   * Возвращает CSS-color строку.
   * @method v6.HSLA#toString
   * @return {string}
   * @example
   * '' + new HSLA( 'red' ); // -> "hsla(0, 100%, 50%, 1)"
   */
  toString: function toString ()
  {
    return 'hsla(' + this[ 0 ] + ', ' + this[ 1 ] + '\u0025, ' + this[ 2 ] + '\u0025, ' + this[ 3 ] + ')';
  },

  /**
   * Устанавливает H, S, L, A значения.
   * @method v6.HSLA#set
   * @param {number|TColor} [h] Hue value.
   * @param {number}        [s] Saturation value.
   * @param {number}        [l] Lightness value.
   * @param {number}        [a] Alpha value.
   * @chainable
   * @see v6.HSLA
   * @example
   * new HSLA().set( 100, 0.5 ); // -> 0, 0, 100, 0.5
   */
  set: function set ( h, s, l, a )
  {
    switch ( true ) {
      case typeof h === 'string':
        h = parse( h );
        // falls through
      case typeof h === 'object' && h !== null:
        if ( h.type !== this.type ) {
          h = h[ this.type ]();
        }

        this[ 0 ] = h[ 0 ];
        this[ 1 ] = h[ 1 ];
        this[ 2 ] = h[ 2 ];
        this[ 3 ] = h[ 3 ];
        break;
      default:
        switch ( void 0 ) {
          case h:
            a = 1;
            l = s = h = 0; // eslint-disable-line no-multi-assign
            break;
          case s:
            a = 1;
            l = Math.floor( h );
            s = h = 0; // eslint-disable-line no-multi-assign
            break;
          case l:
            a = s;
            l = Math.floor( h );
            s = h = 0; // eslint-disable-line no-multi-assign
            break;
          case a:
            a = 1;
            // falls through
          default:
            h = Math.floor( h );
            s = Math.floor( s );
            l = Math.floor( l );
        }

        this[ 0 ] = h;
        this[ 1 ] = s;
        this[ 2 ] = l;
        this[ 3 ] = a;
    }

    return this;
  },

  /**
   * Конвертирует в {@link v6.RGBA}.
   * @method v6.HSLA#rgba
   * @return {v6.RGBA}
   * @example
   * new HSLA( 'magenta' ).rgba(); // -> new RGBA( 255, 0, 255, 1 )
   */
  rgba: function rgba ()
  {
    var rgba = new RGBA();

    var h = this[ 0 ] % 360 / 360;
    var s = this[ 1 ] * 0.01;
    var l = this[ 2 ] * 0.01;

    var tr = h + 1 / 3;
    var tg = h;
    var tb = h - 1 / 3;

    var q;

    if ( l < 0.5 ) {
      q = l * ( 1 + s );
    } else {
      q = l + s - l * s;
    }

    var p = 2 * l - q; // eslint-disable-line vars-on-top

    if ( tr < 0 ) {
      ++tr;
    }

    if ( tg < 0 ) {
      ++tg;
    }

    if ( tb < 0 ) {
      ++tb;
    }

    if ( tr > 1 ) {
      --tr;
    }

    if ( tg > 1 ) {
      --tg;
    }

    if ( tb > 1 ) {
      --tb;
    }

    rgba[ 0 ] = foo( tr, p, q );
    rgba[ 1 ] = foo( tg, p, q );
    rgba[ 2 ] = foo( tb, p, q );
    rgba[ 3 ] = this[ 3 ];

    return rgba;
  },

  /**
   * Создает новый {@link v6.HSLA} - интерполированный между соответствующими параметрами.
   * @method v6.HSLA#lerp
   * @param  {number}  h
   * @param  {number}  s
   * @param  {number}  l
   * @param  {number}  value
   * @return {v6.HSLA}
   * @see v6.HSLA#lerpColor
   * @example
   * new HSLA( 50, 0.25 ).lerp( 0, 0, 100, 0.5 ); // -> new HSLA( 0, 0, 75, 0.25 )
   */
  lerp: function lerp ( h, s, l, value )
  {
    var color = new HSLA();
    color[ 0 ] = h;
    color[ 1 ] = s;
    color[ 2 ] = l;
    return this.lerpColor( color, value );
  },

  /**
   * Создает новый {@link v6.HSLA} - интерполированный между `color`.
   * @method v6.HSLA#lerpColor
   * @param  {TColor}  color
   * @param  {number}  value
   * @return {v6.HSLA}
   * @see v6.HSLA#lerp
   * @example
   * var a = new HSLA( 50, 0.25 );
   * var b = new HSLA( 100, 0 );
   * var c = a.lerpColor( b, 0.5 ); // -> new HSLA( 0, 0, 75, 0.25 )
   */
  lerpColor: function lerpColor ( color, value )
  {
    return this.rgba().lerpColor( color, value ).hsla();
  },

  /**
   * Создает новый {@link v6.HSLA} - затемненный или засветленный на `percentage` процентов.
   * @method v6.HSLA#shade
   * @param  {number}  percentage
   * @return {v6.HSLA}
   * @example
   * new HSLA( 0, 100, 75, 1 ).shade( -10 ); // -> new HSLA( 0, 100, 65, 1 )
   */
  shade: function shade ( percentage )
  {
    var hsla = new HSLA();
    hsla[ 0 ] = this[ 0 ];
    hsla[ 1 ] = this[ 1 ];
    hsla[ 2 ] = clamp( this[ 2 ] + percentage, 0, 100 );
    hsla[ 3 ] = this[ 3 ];
    return hsla;
  },

  constructor: HSLA
};

/**
 * @member {string} v6.HSLA#type `"hsla"`. Это свойство используется для конвертирования между {@link v6.RGBA} и {@link v6.HSLA}.
 */
HSLA.prototype.type = 'hsla';

function foo ( t, p, q )
{
  if ( t < 1 / 6 ) {
    return Math.round( ( p + ( q - p ) * 6 * t ) * 255 );
  }

  if ( t < 0.5 ) {
    return Math.round( q * 255 );
  }

  if ( t < 2 / 3 ) {
    return Math.round( ( p + ( q - p ) * ( 2 / 3 - t ) * 6 ) * 255 );
  }

  return Math.round( p * 255 );
}

},{"./RGBA":7,"./internal/parse":9,"peako/clamp":57}],7:[function(require,module,exports){
'use strict';

module.exports = RGBA;

var parse = require( './internal/parse' ); // eslint-disable-line vars-on-top

var HSLA  = require( './HSLA' );           // eslint-disable-line vars-on-top

/**
 * RGBA цвет.
 * @constructor v6.RGBA
 * @param {number|TColor} [r] Red channel value.
 * @param {number}        [g] Green channel value.
 * @param {number}        [b] Blue channel value.
 * @param {number}        [a] Alpha channel value.
 * @see v6.RGBA#set
 * @example
 * var RGBA = require( 'v6.js/core/color/RGBA' );
 *
 * var transparent = new RGBA( 'transparent' );
 * var magenta     = new RGBA( 'magenta' );
 * var fuchsia     = new RGBA( 255, 0, 255 );
 * var ghost       = new RGBA( 255, 0.1 );
 * var white       = new RGBA( 255 );
 * var black       = new RGBA();
 */
function RGBA ( r, g, b, a )
{
  /**
   * @member {number} v6.RGBA#0 "red" channel value.
   */

  /**
   * @member {number} v6.RGBA#1 "green" channel value.
   */

  /**
   * @member {number} v6.RGBA#2 "blue" channel value.
   */

  /**
   * @member {number} v6.RGBA#3 "alpha" channel value.
   */

  this.set( r, g, b, a );
}

RGBA.prototype = {
  /**
   * Возвращает воспринимаемую яркость (perceived brightness) цвета.
   * @method v6.RGBA#perceivedBrightness
   * @return {number}
   * @see https://stackoverflow.com/a/596243
   * @see http://alienryderflex.com/hsp.html
   * @example
   * new RGBA( 'magenta' ).perceivedBrightness(); // -> 163.8759439332082
   */
  perceivedBrightness: function perceivedBrightness ()
  {
    var r = this[ 0 ];
    var g = this[ 1 ];
    var b = this[ 2 ];
    return Math.sqrt( 0.299 * r * r + 0.587 * g * g + 0.114 * b * b );
  },

  /**
   * Возвращает относительную яркость цвета.
   * @method v6.RGBA#luminance
   * @return {number}
   * @see https://en.wikipedia.org/wiki/Relative_luminance
   * @example
   * new RGBA( 'magenta' ).luminance(); // -> 72.624
   */
  luminance: function luminance ()
  {
    return this[ 0 ] * 0.2126 + this[ 1 ] * 0.7152 + this[ 2 ] * 0.0722;
  },

  /**
   * Возвращает яркость цвета.
   * @method v6.RGBA#brightness
   * @return {number}
   * @see https://www.w3.org/TR/AERT/#color-contrast
   * @example
   * new RGBA( 'magenta' ).brightness(); // -> 105.315
   */
  brightness: function brightness ()
  {
    return 0.299 * this[ 0 ] + 0.587 * this[ 1 ] + 0.114 * this[ 2 ];
  },

  /**
   * Возвращает CSS-color строку.
   * @method v6.RGBA#toString
   * @return {string}
   * @example
   * '' + new RGBA( 'magenta' ); // -> "rgba(255, 0, 255, 1)"
   */
  toString: function toString ()
  {
    return 'rgba(' + this[ 0 ] + ', ' + this[ 1 ] + ', ' + this[ 2 ] + ', ' + this[ 3 ] + ')';
  },

  /**
   * Устанавливает R, G, B, A значения.
   * @method v6.RGBA#set
   * @param {number|TColor} [r] Red channel value.
   * @param {number}        [g] Green channel value.
   * @param {number}        [b] Blue channel value.
   * @param {number}        [a] Alpha channel value.
   * @chainable
   * @see v6.RGBA
   * @example
   * new RGBA()
   *   .set( 'magenta' )                    // -> 255, 0, 255, 1
   *   .set( '#ff00ffff' )                  // -> 255, 0, 255, 1
   *   .set( '#ff00ff' )                    // -> 255, 0, 255, 1
   *   .set( '#f007' )                      // -> 255, 0, 0, 0.47
   *   .set( '#f00' )                       // -> 255, 0, 0, 1
   *   .set( 'hsla( 0, 100%, 50%, 0.47 )' ) // -> 255, 0, 0, 0.47
   *   .set( 'rgb( 0, 0, 0 )' )             // -> 0, 0, 0, 1
   *   .set( 0 )                            // -> 0, 0, 0, 1
   *   .set( 0, 0, 0 )                      // -> 0, 0, 0, 1
   *   .set( 0, 0 )                         // -> 0, 0, 0, 0
   *   .set( 0, 0, 0, 0 );                  // -> 0, 0, 0, 0
   */
  set: function set ( r, g, b, a )
  {
    switch ( true ) {
      case typeof r === 'string':
        r = parse( r );
        // falls through
      case typeof r === 'object' && r !== null:
        if ( r.type !== this.type ) {
          r = r[ this.type ]();
        }

        this[ 0 ] = r[ 0 ];
        this[ 1 ] = r[ 1 ];
        this[ 2 ] = r[ 2 ];
        this[ 3 ] = r[ 3 ];
        break;
      default:
        switch ( void 0 ) {
          case r:
            a = 1;
            b = g = r = 0;               // eslint-disable-line no-multi-assign
            break;
          case g:
            a = 1;
            b = g = r = Math.floor( r ); // eslint-disable-line no-multi-assign
            break;
          case b:
            a = g;
            b = g = r = Math.floor( r ); // eslint-disable-line no-multi-assign
            break;
          case a:
            a = 1;
            // falls through
          default:
            r = Math.floor( r );
            g = Math.floor( g );
            b = Math.floor( b );
        }

        this[ 0 ] = r;
        this[ 1 ] = g;
        this[ 2 ] = b;
        this[ 3 ] = a;
    }

    return this;
  },

  /**
   * Конвертирует в {@link v6.HSLA}.
   * @method v6.RGBA#hsla
   * @return {v6.HSLA}
   * @example
   * new RGBA( 255, 0, 0, 1 ).hsla(); // -> new HSLA( 0, 100, 50, 1 )
   */
  hsla: function hsla ()
  {
    var hsla = new HSLA();

    var r = this[ 0 ] / 255;
    var g = this[ 1 ] / 255;
    var b = this[ 2 ] / 255;

    var max = Math.max( r, g, b );
    var min = Math.min( r, g, b );

    var l = ( max + min ) * 50;
    var h, s;

    var diff = max - min;

    if ( diff ) {
      if ( l > 50 ) {
        s = diff / ( 2 - max - min );
      } else {
        s = diff / ( max + min );
      }

      switch ( max ) {
        case r:
          if ( g < b ) {
            h = 1.0472 * ( g - b ) / diff + 6.2832;
          } else {
            h = 1.0472 * ( g - b ) / diff;
          }

          break;
        case g:
          h = 1.0472 * ( b - r ) / diff + 2.0944;
          break;
        default:
          h = 1.0472 * ( r - g ) / diff + 4.1888;
      }

      h = Math.round( h * 360 / 6.2832 );
      s = Math.round( s * 100 );
    } else {
      h = s = 0; // eslint-disable-line no-multi-assign
    }

    hsla[ 0 ] = h;
    hsla[ 1 ] = s;
    hsla[ 2 ] = Math.round( l );
    hsla[ 3 ] = this[ 3 ];

    return hsla;
  },

  /**
   * @private
   * @method v6.RGBA#rgba
   * @see v6.RendererGL#vertices
   * @chainable
   */
  rgba: function rgba ()
  {
    return this;
  },

  /**
   * Создает новый {@link v6.RGBA} - интерполированный между соответствующими параметрами.
   * @method v6.RGBA#lerp
   * @param  {number}  r
   * @param  {number}  g
   * @param  {number}  b
   * @param  {number}  value
   * @return {v6.RGBA}
   * @see v6.RGBA#lerpColor
   * @example
   * new RGBA( 100, 0.25 ).lerp( 200, 200, 200, 0.5 ); // -> new RGBA( 150, 150, 150, 0.25 )
   */
  lerp: function lerp ( r, g, b, value )
  {
    r = this[ 0 ] + ( r - this[ 0 ] ) * value;
    g = this[ 1 ] + ( g - this[ 1 ] ) * value;
    b = this[ 2 ] + ( b - this[ 2 ] ) * value;
    return new RGBA( r, g, b, this[ 3 ] );
  },

  /**
   * Создает новый {@link v6.RGBA} - интерполированный между `color`.
   * @method v6.RGBA#lerpColor
   * @param  {TColor}  color
   * @param  {number}  value
   * @return {v6.RGBA}
   * @see v6.RGBA#lerp
   * @example
   * var a = new RGBA( 100, 0.25 );
   * var b = new RGBA( 200, 0 );
   * var c = a.lerpColor( b, 0.5 ); // -> new RGBA( 150, 150, 150, 0.25 )
   */
  lerpColor: function lerpColor ( color, value )
  {
    var r, g, b;

    if ( typeof color !== 'object' ) {
      color = parse( color );
    }

    if ( color.type !== 'rgba' ) {
      color = color.rgba();
    }

    r = color[ 0 ];
    g = color[ 1 ];
    b = color[ 2 ];

    return this.lerp( r, g, b, value );
  },

  /**
   * Создает новый {@link v6.RGBA} - затемненный или засветленный на `percentages` процентов.
   * @method v6.RGBA#shade
   * @param  {number}  percentage
   * @return {v6.RGBA}
   * @see v6.HSLA#shade
   * @example
   * new RGBA().shade( 50 ); // -> new RGBA( 128 )
   */
  shade: function shade ( percentages )
  {
    return this.hsla().shade( percentages ).rgba();
  },

  constructor: RGBA
};

/**
 * @member {string} v6.RGBA#type `"rgba"`. Это свойство используется для конвертирования между {@link v6.HSLA} и {@link v6.RGBA}.
 */
RGBA.prototype.type = 'rgba';

},{"./HSLA":6,"./internal/parse":9}],8:[function(require,module,exports){
'use strict';

/* eslint key-spacing: [ "error", { "align": { "beforeColon": false, "afterColon": true, "on": "value" } } ] */

var colors = {
  aliceblue:            'f0f8ffff', antiquewhite:         'faebd7ff',
  aqua:                 '00ffffff', aquamarine:           '7fffd4ff',
  azure:                'f0ffffff', beige:                'f5f5dcff',
  bisque:               'ffe4c4ff', black:                '000000ff',
  blanchedalmond:       'ffebcdff', blue:                 '0000ffff',
  blueviolet:           '8a2be2ff', brown:                'a52a2aff',
  burlywood:            'deb887ff', cadetblue:            '5f9ea0ff',
  chartreuse:           '7fff00ff', chocolate:            'd2691eff',
  coral:                'ff7f50ff', cornflowerblue:       '6495edff',
  cornsilk:             'fff8dcff', crimson:              'dc143cff',
  cyan:                 '00ffffff', darkblue:             '00008bff',
  darkcyan:             '008b8bff', darkgoldenrod:        'b8860bff',
  darkgray:             'a9a9a9ff', darkgreen:            '006400ff',
  darkkhaki:            'bdb76bff', darkmagenta:          '8b008bff',
  darkolivegreen:       '556b2fff', darkorange:           'ff8c00ff',
  darkorchid:           '9932ccff', darkred:              '8b0000ff',
  darksalmon:           'e9967aff', darkseagreen:         '8fbc8fff',
  darkslateblue:        '483d8bff', darkslategray:        '2f4f4fff',
  darkturquoise:        '00ced1ff', darkviolet:           '9400d3ff',
  deeppink:             'ff1493ff', deepskyblue:          '00bfffff',
  dimgray:              '696969ff', dodgerblue:           '1e90ffff',
  feldspar:             'd19275ff', firebrick:            'b22222ff',
  floralwhite:          'fffaf0ff', forestgreen:          '228b22ff',
  fuchsia:              'ff00ffff', gainsboro:            'dcdcdcff',
  ghostwhite:           'f8f8ffff', gold:                 'ffd700ff',
  goldenrod:            'daa520ff', gray:                 '808080ff',
  green:                '008000ff', greenyellow:          'adff2fff',
  honeydew:             'f0fff0ff', hotpink:              'ff69b4ff',
  indianred:            'cd5c5cff', indigo:               '4b0082ff',
  ivory:                'fffff0ff', khaki:                'f0e68cff',
  lavender:             'e6e6faff', lavenderblush:        'fff0f5ff',
  lawngreen:            '7cfc00ff', lemonchiffon:         'fffacdff',
  lightblue:            'add8e6ff', lightcoral:           'f08080ff',
  lightcyan:            'e0ffffff', lightgoldenrodyellow: 'fafad2ff',
  lightgrey:            'd3d3d3ff', lightgreen:           '90ee90ff',
  lightpink:            'ffb6c1ff', lightsalmon:          'ffa07aff',
  lightseagreen:        '20b2aaff', lightskyblue:         '87cefaff',
  lightslateblue:       '8470ffff', lightslategray:       '778899ff',
  lightsteelblue:       'b0c4deff', lightyellow:          'ffffe0ff',
  lime:                 '00ff00ff', limegreen:            '32cd32ff',
  linen:                'faf0e6ff', magenta:              'ff00ffff',
  maroon:               '800000ff', mediumaquamarine:     '66cdaaff',
  mediumblue:           '0000cdff', mediumorchid:         'ba55d3ff',
  mediumpurple:         '9370d8ff', mediumseagreen:       '3cb371ff',
  mediumslateblue:      '7b68eeff', mediumspringgreen:    '00fa9aff',
  mediumturquoise:      '48d1ccff', mediumvioletred:      'c71585ff',
  midnightblue:         '191970ff', mintcream:            'f5fffaff',
  mistyrose:            'ffe4e1ff', moccasin:             'ffe4b5ff',
  navajowhite:          'ffdeadff', navy:                 '000080ff',
  oldlace:              'fdf5e6ff', olive:                '808000ff',
  olivedrab:            '6b8e23ff', orange:               'ffa500ff',
  orangered:            'ff4500ff', orchid:               'da70d6ff',
  palegoldenrod:        'eee8aaff', palegreen:            '98fb98ff',
  paleturquoise:        'afeeeeff', palevioletred:        'd87093ff',
  papayawhip:           'ffefd5ff', peachpuff:            'ffdab9ff',
  peru:                 'cd853fff', pink:                 'ffc0cbff',
  plum:                 'dda0ddff', powderblue:           'b0e0e6ff',
  purple:               '800080ff', red:                  'ff0000ff',
  rosybrown:            'bc8f8fff', royalblue:            '4169e1ff',
  saddlebrown:          '8b4513ff', salmon:               'fa8072ff',
  sandybrown:           'f4a460ff', seagreen:             '2e8b57ff',
  seashell:             'fff5eeff', sienna:               'a0522dff',
  silver:               'c0c0c0ff', skyblue:              '87ceebff',
  slateblue:            '6a5acdff', slategray:            '708090ff',
  snow:                 'fffafaff', springgreen:          '00ff7fff',
  steelblue:            '4682b4ff', tan:                  'd2b48cff',
  teal:                 '008080ff', thistle:              'd8bfd8ff',
  tomato:               'ff6347ff', turquoise:            '40e0d0ff',
  violet:               'ee82eeff', violetred:            'd02090ff',
  wheat:                'f5deb3ff', white:                'ffffffff',
  whitesmoke:           'f5f5f5ff', yellow:               'ffff00ff',
  yellowgreen:          '9acd32ff', transparent:          '00000000'
};

module.exports = colors;

},{}],9:[function(require,module,exports){
'use strict';

module.exports = parse;

var RGBA   = require( '../RGBA' );
var HSLA   = require( '../HSLA' );
var colors = require( './colors' );

var parsed = Object.create( null );

var TRANSPARENT = [
  0, 0, 0, 0
];

var regexps = {
  hex3: /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/,
  hex:  /^#([0-9a-f]{6})([0-9a-f]{2})?$/,
  rgb:  /^rgb\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)$|^\s*rgba\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)$/,
  hsl:  /^hsl\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\u0025\s*\)$|^\s*hsla\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\s*\)$/
};

/**
 * @private
 * @method parse
 * @param  {string}                                  string
 * @return {module:"v6.js".RGBA|module:"v6.js".HSLA}
 * @example
 * parse( '#f0f0' );                     // -> new RGBA( 255, 0, 255, 0 )
 * parse( '#000000ff' );                 // -> new RGBA( 0, 0, 0, 1 )
 * parse( 'magenta' );                   // -> new RGBA( 255, 0, 255, 1 )
 * parse( 'transparent' );               // -> new RGBA( 0, 0, 0, 0 )
 * parse( 'hsl( 0, 100%, 50% )' );       // -> new HSLA( 0, 100, 50, 1 )
 * parse( 'hsla( 0, 100%, 50%, 0.5 )' ); // -> new HSLA( 0, 100, 50, 0.5 )
 */
function parse ( string )
{
  var cache = parsed[ string ] || parsed[ string = string.trim().toLowerCase() ];

  if ( ! cache ) {
    if ( ( cache = colors[ string ] ) ) {
      cache = new ColorData( parseHex( cache ), RGBA );
    } else if ( ( cache = regexps.hex.exec( string ) ) || ( cache = regexps.hex3.exec( string ) ) ) {
      cache = new ColorData( parseHex( formatHex( cache ) ), RGBA );
    } else if ( ( cache = regexps.rgb.exec( string ) ) ) {
      cache = new ColorData( compactMatch( cache ), RGBA );
    } else if ( ( cache = regexps.hsl.exec( string ) ) ) {
      cache = new ColorData( compactMatch( cache ), HSLA );
    } else {
      throw SyntaxError( string + ' is not a valid syntax' );
    }

    parsed[ string ] = cache;
  }

  return new cache.color( cache[ 0 ], cache[ 1 ], cache[ 2 ], cache[ 3 ] );
}

/**
 * @private
 * @method formatHex
 * @param  {array<string?>} match
 * @return {string}
 * @example
 * formatHex( [ '#000000ff', '000000', 'ff' ] ); // -> '000000ff'
 * formatHex( [ '#0007', '0', '0', '0', '7' ] ); // -> '00000077'
 * formatHex( [ '#000', '0', '0', '0', null ] ); // -> '000000ff'
 */
function formatHex ( match )
{
  var r, g, b, a;

  if ( match.length === 3 ) {
    return match[ 1 ] + ( match[ 2 ] || 'ff' );
  }

  r = match[ 1 ];
  g = match[ 2 ];
  b = match[ 3 ];
  a = match[ 4 ] || 'f';

  return r + r + g + g + b + b + a + a;
}

/**
 * @private
 * @method parseHex
 * @param  {string}        hex
 * @return {array<number>}
 * @example
 * parseHex( '00000000' ); // -> [ 0, 0, 0, 0 ]
 * parseHex( 'ff00ffff' ); // -> [ 255, 0, 255, 1 ]
 */
function parseHex ( hex )
{
  if ( hex == 0 ) { // eslint-disable-line eqeqeq
    return TRANSPARENT;
  }

  hex = parseInt( hex, 16 );

  return [
    // R
    hex >> 24 & 255,    // eslint-disable-line no-bitwise
    // G
    hex >> 16 & 255,    // eslint-disable-line no-bitwise
    // B
    hex >> 8  & 255,    // eslint-disable-line no-bitwise
    // A
    ( hex & 255 ) / 255 // eslint-disable-line no-bitwise
  ];
}

/**
 * @private
 * @method compactMatch
 * @param  {array<string?>} match
 * @return {array<number>}
 */
function compactMatch ( match )
{
  if ( match[ 7 ] ) {
    return [
      Number( match[ 4 ] ),
      Number( match[ 5 ] ),
      Number( match[ 6 ] ),
      Number( match[ 7 ] )
    ];
  }

  return [
    Number( match[ 1 ] ),
    Number( match[ 2 ] ),
    Number( match[ 3 ] )
  ];
}

/**
 * @private
 * @constructor ColorData
 * @param {array<number>} match
 * @param {function}      color
 */
function ColorData ( match, color )
{
  this[ 0 ] = match[ 0 ];
  this[ 1 ] = match[ 1 ];
  this[ 2 ] = match[ 2 ];
  this[ 3 ] = match[ 3 ];
  this.color = color;
}

},{"../HSLA":6,"../RGBA":7,"./colors":8}],10:[function(require,module,exports){
'use strict';

/**
 * Константы.
 * @namespace {object} v6.constants
 * @example
 * var constants = require( 'v6.js/core/constants' );
 */

var _constants = {};
var _counter   = 0;

/**
 * Добавляет константу.
 * @method v6.constants.add
 * @param  {string} key Имя константы.
 * @return {void}       Ничего не возвращает.
 * @example
 * constants.add( 'CUSTOM_CONSTANT' );
 */
function add ( key )
{
  if ( typeof _constants[ key ] !== 'undefined' ) {
    throw Error( 'Cannot re-set (add) existing constant: ' + key );
  }

  _constants[ key ] = ++_counter;
}

/**
 * Возвращает константу.
 * @method v6.constants.get
 * @param  {string}   key Имя константы.
 * @return {constant}     Возвращает константу.
 * @example
 * constants.get( 'CUSTOM_CONSTANT' );
 */
function get ( key )
{
  if ( typeof _constants[ key ] === 'undefined' ) {
    throw ReferenceError( 'Cannot get unknown constant: ' + key );
  }

  return _constants[ key ];
}

[
  'AUTO',
  'GL',
  '2D',
  'LEFT',
  'TOP',
  'CENTER',
  'MIDDLE',
  'RIGHT',
  'BOTTOM',
  'PERCENT'
].forEach( add );

exports.add = add;
exports.get = get;

},{}],11:[function(require,module,exports){
'use strict';

var LightEmitter = require( 'light_emitter' );

/**
 * @abstract
 * @constructor v6.AbstractImage
 * @extends LightEmitter
 * @see v6.CompoundedImage
 * @see v6.Image
 */
function AbstractImage ()
{
  /**
   * @member {number} v6.Image#sx "Source X".
   */

  /**
   * @member {number} v6.Image#sy "Source Y".
   */

  /**
   * @member {number} v6.Image#sw "Source Width".
   */

  /**
   * @member {number} v6.Image#sh "Source Height".
   */

  /**
   * @member {number} v6.Image#dw "Destination Width".
   */

  /**
   * @member {number} v6.Image#dh "Destination Height".
   */

  throw Error( 'Cannot create an instance of the abstract class (new v6.AbstractImage)' );
}

AbstractImage.prototype = Object.create( LightEmitter.prototype );
AbstractImage.prototype.constructor = AbstractImage;

/**
 * @virtual
 * @method v6.AbstractImage#get
 * @return {v6.Image}
 */

module.exports = AbstractImage;

},{"light_emitter":41}],12:[function(require,module,exports){
'use strict';

var AbstractImage = require( './AbstractImage' );

/**
 * @constructor v6.CompoundedImage
 * @extends v6.AbstractImage
 * @param {v6.AbstractImage} image
 * @param {nubmer}           sx
 * @param {nubmer}           sy
 * @param {nubmer}           sw
 * @param {nubmer}           sh
 * @param {nubmer}           dw
 * @param {nubmer}           dh
 */
function CompoundedImage ( image, sx, sy, sw, sh, dw, dh )
{
  this.image = image;
  this.sx    = sx;
  this.sy    = sy;
  this.sw    = sw;
  this.sh    = sh;
  this.dw    = dw;
  this.dh    = dh;
}

CompoundedImage.prototype = Object.create( AbstractImage.prototype );
CompoundedImage.prototype.constructor = CompoundedImage;

/**
 * @override
 * @method v6.CompoundedImage#get
 */
CompoundedImage.prototype.get = function get ()
{
  return this.image.get();
};

module.exports = CompoundedImage;

},{"./AbstractImage":11}],13:[function(require,module,exports){
'use strict';

var CompoundedImage = require( './CompoundedImage' );
var AbstractImage   = require( './AbstractImage' );

/**
 * Класс картинки.
 * @constructor v6.Image
 * @extends v6.AbstractImage
 * @param {HTMLImageElement} image DOM элемент картинки (IMG).
 * @fires complete
 * @see v6.Image.fromURL
 * @see v6.AbstractRenderer#backgroundImage
 * @see v6.AbstractRenderer#image
 * @example
 * var Image = require( 'v6.js/core/image/Image' );
 * @example <caption>Creating an image with an DOM image</caption>
 * // HTML: <img src="image.png" id="image" />
 * var image = new Image( document.getElementById( 'image' ) );
 * @example <caption>Creating an image with a URL</caption>
 * var image = Image.fromURL( 'image.png' );
 * @example <caption>Fires "complete" event</caption>
 * image.once( 'complete', function ()
 * {
 *   console.log( 'The image is loaded!' );
 * } );
 */
function Image ( image )
{
  var self = this;

  if ( ! image.src ) {
    throw Error( 'Cannot create v6.Image from HTMLImageElement with no "src" attribute (new v6.Image)' );
  }

  /**
   * @member {HTMLImageElement} v6.Image#image DOM эелемент картинки.
   */
  this.image = image;

  if ( this.image.complete ) {
    this._init();
  } else {
    this.image.addEventListener( 'load', function onload ()
    {
      self.image.removeEventListener( 'load', onload );
      self._init();
    }, false );
  }
}

Image.prototype = Object.create( AbstractImage.prototype );
Image.prototype.constructor = Image;

/**
 * Инициализирует картинку после ее загрузки.
 * @private
 * @method v6.Image#_init
 * @return {void} Ничего не возвращает.
 */
Image.prototype._init = function _init ()
{
  this.sx = 0;
  this.sy = 0;
  this.sw = this.dw = this.image.width;  // eslint-disable-line no-multi-assign
  this.sh = this.dh = this.image.height; // eslint-disable-line no-multi-assign
  this.emit( 'complete' );
};

/**
 * @override
 * @method v6.Image#get
 */
Image.prototype.get = function get ()
{
  return this;
};

/**
 * Определяет, загружена ли картинка.
 * @method v6.Image#complete
 * @return {boolean} `true`, если загружена.
 * @example
 * var image = Image.fromURL( 'image.png' );
 *
 * if ( ! image.complete() ) {
 *   image.once( 'complete', function ()
 *   {
 *     console.log( 'The image is loaded!', image.complete() );
 *   } );
 * }
 */
Image.prototype.complete = function complete ()
{
  return Boolean( this.image.src ) && this.image.complete;
};

/**
 * Возвращает URL картинки.
 * @method v6.Image#src
 * @return {string} URL картинки.
 * @example
 * Image.fromURL( 'image.png' ).src(); // -> "image.png"
 */
Image.prototype.src = function src ()
{
  return this.image.src;
};

/**
 * Создает новую {@link v6.Image} из URL.
 * @method v6.Image.fromURL
 * @param  {string}   src URL картинки.
 * @return {v6.Image}     Новая {@link v6.Image}.
 * @example
 * var image = Image.fromURL( 'image.png' );
 */
Image.fromURL = function fromURL ( src )
{
  var image = document.createElement( 'img' );
  image.src = src;
  return new Image( image );
};

/**
 * Пропорционально растягивает или сжимает картинку.
 * @method v6.Image.stretch
 * @param  {v6.AbstractImage}   image Картинка.
 * @param  {number}             dw    Новый "Destination Width".
 * @param  {number}             dh    Новый "Destination Height".
 * @return {v6.CompoundedImage}       Новая картинка.
 * @example
 * Image.stretch( image, 600, 400 );
 */
Image.stretch = function stretch ( image, dw, dh )
{
  var value = dh / image.dh * image.dw;

  // Stretch DW.
  if ( value < dw ) {
    dh = dw / image.dw * image.dh;

  // Stretch DH.
  } else {
    dw = value;
  }

  return new CompoundedImage( image.get(), image.sx, image.sy, image.sw, image.sh, dw, dh );
};

/**
 * Обрезает картинку.
 * @method v6.Image.cut
 * @param  {v6.AbstractImage}   image Картинка, которую надо обрезать.
 * @param  {number}             sx    X координата, откуда надо обрезать.
 * @param  {number}             sy    Y координата, откуда надо обрезать.
 * @param  {number}             sw    Новая ширина.
 * @param  {number}             sh    Новая высота.
 * @return {v6.CompoundedImage}       Обрезанная картинка.
 * @example
 * Image.cut( image, 10, 20, 30, 40 );
 */
Image.cut = function cut ( image, sx, sy, dw, dh )
{
  var sw = image.sw / image.dw * dw;
  var sh = image.sh / image.dh * dh;

  sx += image.sx;

  if ( sx + sw > image.sx + image.sw ) {
    throw Error( 'Cannot cut the image because the new image X or W is out of bounds (v6.Image.cut)' );
  }

  sy += image.sy;

  if ( sy + sh > image.sy + image.sh ) {
    throw Error( 'Cannot cut the image because the new image Y or H is out of bounds (v6.Image.cut)' );
  }

  return new CompoundedImage( image.get(), sx, sy, sw, sh, dw, dh );
};

module.exports = Image;

},{"./AbstractImage":11,"./CompoundedImage":12}],14:[function(require,module,exports){
'use strict';

var _Float32Array;

if ( typeof Float32Array === 'function' ) {
  _Float32Array = Float32Array; // eslint-disable-line no-undef
} else {
  _Float32Array = Array;
}

/**
 * Создает массив с координатами всех точек нужного полигона.
 * @private
 * @method createPolygon
 * @param  {number}       sides Количество сторон полигона.
 * @return {Float32Array}       Возвращает массив (Float32Array) который выглядит так: `[ x1, y1, x2, y2 ]`.
 *                              Все значения которого нормализованны.
 */
function createPolygon ( sides )
{
  var i        = Math.floor( sides );
  var step     = Math.PI * 2 / sides;
  var vertices = new _Float32Array( i * 2 + 2 );

  for ( ; i >= 0; --i ) {
    vertices[     i * 2 ] = Math.cos( step * i );
    vertices[ 1 + i * 2 ] = Math.sin( step * i );
  }

  return vertices;
}

module.exports = createPolygon;

},{}],15:[function(require,module,exports){
'use strict';

/**
 * Создает и инициализирует новую WebGL программу.
 * @private
 * @method createProgram
 * @param  {WebGLShader}           vert Вершинный шейдер (созданный с помощью `{@link createShader}`).
 * @param  {WebGLShader}           frag Фрагментный шейдер (созданный с помощью `{@link createShader}`).
 * @param  {WebGLRenderingContext} gl   WebGL контекст.
 * @return {WebGLProgram}
 */
function createProgram ( vert, frag, gl )
{
  var program = gl.createProgram();

  gl.attachShader( program, vert );
  gl.attachShader( program, frag );
  gl.linkProgram( program );

  if ( ! gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
    throw Error( 'Unable to initialize the shader program: ' + gl.getProgramInfoLog( program ) );
  }

  gl.validateProgram( program );

  if ( ! gl.getProgramParameter( program, gl.VALIDATE_STATUS ) ) {
    throw Error( 'Unable to validate the shader program: ' + gl.getProgramInfoLog( program ) );
  }

  return program;
}

module.exports = createProgram;

},{}],16:[function(require,module,exports){
'use strict';

/**
 * Создает и инициализирует новый WebGL шейдер.
 * @private
 * @method createShader
 * @param  {string}                source Исходный код шейдера.
 * @param  {constant}              type   Тип шейдера: VERTEX_SHADER или FRAGMENT_SHADER.
 * @param  {WebGLRenderingContext} gl     WebGL контекст.
 * @return {WebGLShader}
 */
function createShader ( source, type, gl )
{
  var shader = gl.createShader( type );

  gl.shaderSource( shader, source );
  gl.compileShader( shader );

  if ( ! gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
    throw SyntaxError( 'An error occurred compiling the shaders: ' + gl.getShaderInfoLog( shader ) );
  }

  return shader;
}

module.exports = createShader;

},{}],17:[function(require,module,exports){
'use strict';

/**
 * @private
 * @member {object} polygons
 */

},{}],18:[function(require,module,exports){
'use strict';

var noop = require( 'peako/noop' );

var report, reported;

if ( typeof console !== 'undefined' && console.warn ) { // eslint-disable-line no-console
  reported = {};

  report = function report ( message )
  {
    if ( reported[ message ] ) {
      return;
    }

    console.warn( message ); // eslint-disable-line no-console
    reported[ message ] = true;
  };
} else {
  report = noop;
}

module.exports = report;

},{"peako/noop":87}],19:[function(require,module,exports){
'use strict';

var settings = require( '../settings' );

/**
 * Абстрактный класс вектора с базовыми методами.
 *
 * Чтобы использовать грудусы вместо радианов надо написать следующее:
 * ```javascript
 * var settings = require( 'v6.js/core/settings' );
 * settings.degrees = true;
 * ```
 * @abstract
 * @constructor v6.AbstractVector
 * @see v6.Vector2D
 * @see v6.Vector3D
 */
function AbstractVector ()
{
  throw Error( 'Cannot create an instance of the abstract class (new v6.AbstractVector)' );
}

AbstractVector.prototype = {
  /**
   * Нормализует вектор.
   * @method v6.AbstractVector#normalize
   * @chainable
   * @example
   * new Vector2D( 4, 2 ).normalize(); // Vector2D { x: 0.8944271909999159, y: 0.4472135954999579 }
   */
  normalize: function normalize ()
  {
    var mag = this.mag();

    if ( mag && mag !== 1 ) {
      this.div( mag );
    }

    return this;
  },

  /**
   * Изменяет направление вектора на `"angle"` с сохранением длины.
   * @method v6.AbstractVector#setAngle
   * @param {number} angle Новое направление.
   * @chainable
   * @example
   * new Vector2D( 4, 2 ).setAngle( 45 * Math.PI / 180 ); // Vector2D { x: 3.1622776601683795, y: 3.162277660168379 }
   * @example <caption>Используя грудусы</caption>
   * new Vector2D( 4, 2 ).setAngle( 45 ); // Vector2D { x: 3.1622776601683795, y: 3.162277660168379 }
   */
  setAngle: function setAngle ( angle )
  {
    var mag = this.mag();

    if ( settings.degrees ) {
      angle *= Math.PI / 180;
    }

    this.x = mag * Math.cos( angle );
    this.y = mag * Math.sin( angle );

    return this;
  },

  /**
   * Изменяет длину вектора на `"value"` с сохранением направления.
   * @method v6.AbstractVector#setMag
   * @param {number} value Новая длина.
   * @chainable
   * @example
   * new Vector2D( 4, 2 ).setMag( 42 ); // Vector2D { x: 37.56594202199646, y: 18.78297101099823 }
   */
  setMag: function setMag ( value )
  {
    return this.normalize().mul( value );
  },

  /**
   * Поворачивает вектор на `"angle"` угол с сохранением длины.
   * @method v6.AbstractVector#rotate
   * @param {number} angle
   * @chainable
   * @example
   * new Vector2D( 4, 2 ).rotate( 5 * Math.PI / 180 ); // Vector2D { x: 3.810467306871666, y: 2.3410123671741236 }
   * @example <caption>Используя грудусы</caption>
   * new Vector2D( 4, 2 ).rotate( 5 ); // Vector2D { x: 3.810467306871666, y: 2.3410123671741236 }
   */
  rotate: function rotate ( angle )
  {
    var x = this.x;
    var y = this.y;

    var c, s;

    if ( settings.degrees ) {
      angle *= Math.PI / 180;
    }

    c = Math.cos( angle );
    s = Math.sin( angle );

    this.x = ( x * c ) - ( y * s );
    this.y = ( x * s ) + ( y * c );

    return this;
  },

  /**
   * Возвращает текущее направление вектора.
   * @method v6.AbstractVector#getAngle
   * @return {number} Направление (угол) в градусах или радианах.
   * @example
   * new Vector2D( 1, 1 ).getAngle(); // -> 0.7853981633974483
   * @example <caption>Используя грудусы</caption>
   * new Vector2D( 1, 1 ).getAngle(); // -> 45
   */
  getAngle: function getAngle ()
  {
    if ( settings.degrees ) {
      return Math.atan2( this.y, this.x ) * 180 / Math.PI;
    }

    return Math.atan2( this.y, this.x );
  },

  /**
   * Ограничивает длину вектора до `"value"`.
   * @method v6.AbstractVector#limit
   * @param {number} value Максимальная длина вектора.
   * @chainable
   * @example
   * new Vector2D( 1, 1 ).limit( 1 ); // Vector2D { x: 0.7071067811865475, y: 0.7071067811865475 }
   */
  limit: function limit ( value )
  {
    var mag = this.magSq();

    if ( mag > value * value ) {
      this.div( Math.sqrt( mag ) ).mul( value );
    }

    return this;
  },

  /**
   * Возвращает длину вектора.
   * @method v6.AbstractVector#mag
   * @return {number} Длина вектора.
   * @example
   * new Vector2D( 2, 2 ).mag(); // -> 2.8284271247461903
   */
  mag: function mag ()
  {
    return Math.sqrt( this.magSq() );
  },

  /**
   * Возвращает длину вектора в квадрате.
   * @virtual
   * @method v6.AbstractVector#magSq
   * @return {number} Длина вектора в квадрате.
   * @example
   * new Vector2D( 2, 2 ).magSq(); // -> 8
   */

  /**
   * Создает клон вектора.
   * @virtual
   * @method v6.AbstractVector#clone
   * @return {v6.AbstractVector} Клон вектора.
   * @example
   * new Vector2D( 4, 2 ).clone();
   */

  /**
   * Возвращает строковое представление вектора (prettified).
   * @virtual
   * @method v6.AbstractVector#toString
   * @return {string}
   * @example
   * new Vector2D( 4.321, 2.345 ).toString(); // -> "v6.Vector2D { x: 4.32, y: 2.35 }"
   */

  /**
   * Возвращает дистанцию между двумя векторами.
   * @virtual
   * @method v6.AbstractVector#dist
   * @param  {v6.AbstractVector} vector Другой (второй) вектор.
   * @return {number}
   * @example
   * new Vector2D( 3, 3 ).dist( new Vector2D( 1, 1 ) ); // -> 2.8284271247461903
   */

  constructor: AbstractVector
};

/**
 * @private
 * @method v6.AbstractVector._fromAngle
 * @param  {v6.AbstractVector} Vector {@link v6.Vector2D}, {@link v6.Vector3D}.
 * @param  {number}            angle
 * @return {v6.AbstractVector}
 * @see v6.AbstractVector.fromAngle
 */
AbstractVector._fromAngle = function _fromAngle ( Vector, angle )
{
  if ( settings.degrees ) {
    angle *= Math.PI / 180;
  }

  return new Vector( Math.cos( angle ), Math.sin( angle ) );
};

/**
 * Создает рандомный вектор.
 * @virtual
 * @static
 * @method v6.AbstractVector.random
 * @return {v6.AbstractVector} Возвращает нормализованный вектор с рандомным направлением.
 */

/**
 * Создает вектор с направлением равным `"angle"`.
 * @virtual
 * @static
 * @method v6.AbstractVector.fromAngle
 * @param  {number}            angle Направление вектора.
 * @return {v6.AbstractVector}       Возвращает нормализованный вектор.
 */

module.exports = AbstractVector;

},{"../settings":38}],20:[function(require,module,exports){
'use strict';

var settings       = require( '../settings' );
var AbstractVector = require( './AbstractVector' );

/**
 * 2D вектор.
 * @constructor v6.Vector2D
 * @extends v6.AbstractVector
 * @param {number} [x=0] X координата вектора.
 * @param {number} [y=0] Y координата вектора.
 * @example
 * var Vector2D = require( 'v6.js/math/Vector2D' );
 * var position = new Vector2D( 4, 2 ); // Vector2D { x: 4, y: 2 }
 */
function Vector2D ( x, y )
{
  /**
   * X координата вектора.
   * @member {number} v6.Vector2D#x
   * @example
   * var x = new Vector2D( 4, 2 ).x; // -> 4
   */

  /**
   * Y координата вектора.
   * @member {number} v6.Vector2D#y
   * @example
   * var y = new Vector2D( 4, 2 ).y; // -> 2
   */

  this.set( x, y );
}

Vector2D.prototype = Object.create( AbstractVector.prototype );
Vector2D.prototype.constructor = Vector2D;

/**
 * Устанавливает X и Y координаты.
 * @method v6.Vector2D#set
 * @param {number} [x=0] Новая X координата.
 * @param {number} [y=0] Новая Y координата.
 * @chainable
 * @example
 * new Vector2D().set( 4, 2 ); // Vector2D { x: 4, y: 2 }
 */
Vector2D.prototype.set = function set ( x, y )
{
  this.x = x || 0;
  this.y = y || 0;
  return this;
};

/**
 * Добавляет к координатам X и Y соответствующие параметры.
 * @method v6.Vector2D#add
 * @param {number} [x=0] Число, которое должно быть добавлено.
 * @param {number} [y=0] Число, которое должно быть добавлено.
 * @chainable
 * @example
 * new Vector2D().add( 4, 2 ); // Vector2D { x: 4, y: 2 }
 */
Vector2D.prototype.add = function add ( x, y )
{
  this.x += x || 0;
  this.y += y || 0;
  return this;
};

/**
 * Вычитает из координат X и Y соответствующие параметры.
 * @method v6.Vector2D#sub
 * @param {number} [x=0] Число, которое должно быть вычтено.
 * @param {number} [y=0] Число, которое должно быть вычтено.
 * @chainable
 * @example
 * new Vector2D().sub( 4, 2 ); // Vector2D { x: -4, y: -2 }
 */
Vector2D.prototype.sub = function sub ( x, y )
{
  this.x -= x || 0;
  this.y -= y || 0;
  return this;
};

/**
 * Умножает X и Y координаты на `value`.
 * @method v6.Vector2D#mul
 * @param {number} value Число, на которое надо умножить.
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).mul( 2 ); // Vector2D { x: 8, y: 4 }
 */
Vector2D.prototype.mul = function mul ( value )
{
  this.x *= value;
  this.y *= value;
  return this;
};

/**
 * Делит X и Y координаты на `value`.
 * @method v6.Vector2D#div
 * @param {number} value Число, на которое надо разделить.
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).div( 2 ); // Vector2D { x: 2, y: 1 }
 */
Vector2D.prototype.div = function div ( value )
{
  this.x /= value;
  this.y /= value;
  return this;
};

/**
 * @method v6.Vector2D#dot
 * @param  {number} [x=0]
 * @param  {number} [y=0]
 * @return {number}
 * @example
 * new Vector2D( 4, 2 ).div( 2, 3 ); // 14, потому что: "(4 * 2) + (2 * 3) = 8 + 6 = 14"
 */
Vector2D.prototype.dot = function dot ( x, y )
{
  return ( this.x * ( x || 0 ) ) +
         ( this.y * ( y || 0 ) );
};

/**
 * Интерполирует X и Y координаты между соответствующими параметрами.
 * @method v6.Vector2D#lerp
 * @param {number} x
 * @param {number} y
 * @param {number} value
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).lerp( 8, 4, 0.5 ); // Vector2D { x: 6, y: 3 }
 */
Vector2D.prototype.lerp = function ( x, y, value )
{
  this.x += ( x - this.x ) * value || 0;
  this.y += ( y - this.y ) * value || 0;
  return this;
};

/**
 * Копирует другой вектор.
 * @method v6.Vector2D#setVector
 * @param {v6.AbstractVector} vector Вектор, который надо скопировать.
 * @chainable
 * @example
 * new Vector2D().setVector( new Vector2D( 4, 2 ) ); // Vector2D { x: 4, y: 2 }
 */
Vector2D.prototype.setVector = function setVector ( vector )
{
  return this.set( vector.x, vector.y );
};

/**
 * Добавляет другой вектор.
 * @method v6.Vector2D#addVector
 * @param {v6.AbstractVector} vector Вектор, который надо добавить.
 * @chainable
 * @example
 * new Vector2D().addVector( new Vector2D( 4, 2 ) ); // Vector2D { x: 4, y: 2 }
 */
Vector2D.prototype.addVector = function addVector ( vector )
{
  return this.add( vector.x, vector.y );
};

/**
 * Вычитает другой вектор.
 * @method v6.Vector2D#subVector
 * @param {v6.AbstractVector} vector Вектор, который надо вычесть.
 * @chainable
 * @example
 * new Vector2D().subVector( new Vector2D( 4, 2 ) ); // Vector2D { x: -4, y: -2 }
 */
Vector2D.prototype.subVector = function subVector ( vector )
{
  return this.sub( vector.x, vector.y );
};

/**
 * Умножает X и Y координаты на X и Y другого вектора.
 * @method v6.Vector2D#mulVector
 * @param {v6.AbstractVector} vector Вектор для умножения.
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).mulVector( new Vector2D( 2, 3 ) ); // Vector2D { x: 8, y: 6 }
 */
Vector2D.prototype.mulVector = function mulVector ( vector )
{
  this.x *= vector.x;
  this.y *= vector.y;
  return this;
};

/**
 * Делит X и Y координаты на X и Y другого вектора.
 * @method v6.Vector2D#divVector
 * @param {v6.AbstractVector} vector Вектор, на который надо делить.
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).divVector( new Vector2D( 2, 0.5 ) ); // Vector2D { x: 2, y: 4 }
 */
Vector2D.prototype.divVector = function divVector ( vector )
{
  this.x /= vector.x;
  this.y /= vector.y;
  return this;
};

/**
 * @method v6.Vector2D#dotVector
 * @param  {v6.AbstractVector} vector
 * @return {number}
 * @example
 * new Vector2D( 4, 2 ).dotVector( new Vector2D( 3, 5 ) ); // -> 22
 */
Vector2D.prototype.dotVector = function dotVector ( vector )
{
  return this.dot( vector.x, vector.y );
};

/**
 * Интерполирует X и Y координаты между другим вектором.
 * @method v6.Vector2D#lerpVector
 * @param {v6.AbstractVector} vector
 * @param {number}            value
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).lerpVector( new Vector2D( 2, 1 ), 0.5 ); // Vector2D { x: 3, y: 1.5 }
 */
Vector2D.prototype.lerpVector = function lerpVector ( vector, value )
{
  return this.lerp( vector.x, vector.y, value );
};

/**
 * @override
 * @method v6.Vector2D#magSq
 */
Vector2D.prototype.magSq = function magSq ()
{
  return ( this.x * this.x ) + ( this.y * this.y );
};

/**
 * @override
 * @method v6.Vector2D#clone
 */
Vector2D.prototype.clone = function clone ()
{
  return new Vector2D( this.x, this.y );
};

/**
 * @override
 * @method v6.Vector2D#dist
 */
Vector2D.prototype.dist = function dist ( vector )
{
  var x = vector.x - this.x;
  var y = vector.y - this.y;
  return Math.sqrt( ( x * x ) + ( y * y ) );
};

/**
 * @override
 * @method v6.Vector2D#toString
 */
Vector2D.prototype.toString = function toString ()
{
  return 'v6.Vector2D { x: ' + this.x.toFixed( 2 ) + ', y: ' + this.y.toFixed( 2 ) + ' }';
};

/**
 * @method v6.Vector2D.random
 * @see v6.AbstractVector.random
 */
Vector2D.random = function random ()
{
  var value;

  if ( settings.degrees ) {
    value = 360;
  } else {
    value = Math.PI * 2;
  }

  return Vector2D.fromAngle( Math.random() * value );
};

/**
 * @method v6.Vector2D.fromAngle
 * @see v6.AbstractVector.fromAngle
 */
Vector2D.fromAngle = function fromAngle ( angle )
{
  return AbstractVector._fromAngle( Vector2D, angle );
};

module.exports = Vector2D;

},{"../settings":38,"./AbstractVector":19}],21:[function(require,module,exports){
'use strict';

var AbstractVector = require( './AbstractVector' );

/**
 * 3D вектор.
 * @constructor v6.Vector3D
 * @extends v6.AbstractVector
 * @param {number} [x=0] X координата вектора.
 * @param {number} [y=0] Y координата вектора.
 * @param {number} [z=0] Z координата вектора.
 * @example
 * var Vector3D = require( 'v6.js/math/Vector3D' );
 * var position = new Vector3D( 4, 2, 3 ); // Vector3D { x: 4, y: 2, z: 3 }
 */
function Vector3D ( x, y, z )
{
  /**
   * X координата вектора.
   * @member {number} v6.Vector3D#x
   * @example
   * var x = new Vector3D( 4, 2, 3 ).x; // -> 4
   */

  /**
   * Y координата вектора.
   * @member {number} v6.Vector3D#y
   * @example
   * var y = new Vector3D( 4, 2, 3 ).y; // -> 2
   */

  /**
   * Z координата вектора.
   * @member {number} v6.Vector3D#z
   * @example
   * var z = new Vector3D( 4, 2, 3 ).z; // -> 3
   */

  this.set( x, y, z );
}

Vector3D.prototype = Object.create( AbstractVector.prototype );
Vector3D.prototype.constructor = Vector3D;

/**
 * Устанавливает X, Y, и Z координаты.
 * @method v6.Vector3D#set
 * @param {number} [x=0] Новая X координата.
 * @param {number} [y=0] Новая Y координата.
 * @param {number} [z=0] Новая Z координата.
 * @chainable
 * @example
 * new Vector3D().set( 4, 2, 6 ); // Vector3D { x: 4, y: 2, z: 6 }
 */
Vector3D.prototype.set = function set ( x, y, z )
{
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  return this;
};

/**
 * Добавляет к координатам X, Y, и Z соответствующие параметры.
 * @method v6.Vector3D#add
 * @param {number} [x=0] Число, которое должно быть добавлено.
 * @param {number} [y=0] Число, которое должно быть добавлено.
 * @param {number} [z=0] Число, которое должно быть добавлено.
 * @chainable
 * @example
 * new Vector3D().add( 4, 2, 6 ); // Vector3D { x: 4, y: 2, z: 6 }
 */
Vector3D.prototype.add = function add ( x, y, z )
{
  this.x += x || 0;
  this.y += y || 0;
  this.z += z || 0;
  return this;
};

/**
 * Вычитает из координат X, Y, и Z соответствующие параметры.
 * @method v6.Vector3D#sub
 * @param {number} [x=0] Число, которое должно быть вычтено.
 * @param {number} [y=0] Число, которое должно быть вычтено.
 * @param {number} [z=0] Число, которое должно быть вычтено.
 * @chainable
 * @example
 * new Vector3D().sub( 4, 2, 6 ); // Vector3D { x: -4, y: -2, z: -6 }
 */
Vector3D.prototype.sub = function sub ( x, y, z )
{
  this.x -= x || 0;
  this.y -= y || 0;
  this.z -= z || 0;
  return this;
};

/**
 * Умножает X, Y, и Z координаты на `value`.
 * @method v6.Vector3D#mul
 * @param {number} value Число, на которое надо умножить.
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).mul( 2 ); // Vector3D { x: 8, y: 4, z: 12 }
 */
Vector3D.prototype.mul = function mul ( value )
{
  this.x *= value;
  this.y *= value;
  this.z *= value;
  return this;
};

/**
 * Делит X, Y, и Z координаты на `value`.
 * @method v6.Vector3D#div
 * @param {number} value Число, на которое надо разделить.
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).div( 2 ); // Vector3D { x: 2, y: 1, z: 3 }
 */
Vector3D.prototype.div = function div ( value )
{
  this.x /= value;
  this.y /= value;
  this.z /= value;
  return this;
};

/**
 * @method v6.Vector3D#dot
 * @param  {number} [x=0]
 * @param  {number} [y=0]
 * @param  {number} [z=0]
 * @return {number}
 * @example
 * new Vector3D( 4, 2, 6 ).dot( 2, 3, 4 ); // -> 38, потому что: "(4 * 2) + (2 * 3) + (6 * 4) = 8 + 6 + 24 = 38"
 */
Vector3D.prototype.dot = function dot ( x, y, z )
{
  return ( this.x * ( x || 0 ) ) +
         ( this.y * ( y || 0 ) ) +
         ( this.z * ( z || 0 ) );
};

/**
 * Интерполирует X, Y, и Z координаты между соответствующими параметрами.
 * @method v6.Vector3D#lerp
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} value
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).lerp( 8, 4, 12, 0.5 ); // Vector3D { x: 6, y: 3, z: 9 }
 */
Vector3D.prototype.lerp = function ( x, y, z, value )
{
  this.x += ( x - this.x ) * value || 0;
  this.y += ( y - this.y ) * value || 0;
  this.z += ( z - this.z ) * value || 0;
  return this;
};

/**
 * Копирует другой вектор.
 * @method v6.Vector3D#setVector
 * @param {v6.AbstractVector} vector Вектор, который надо скопировать.
 * @chainable
 * @example
 * new Vector3D().setVector( new Vector3D( 4, 2, 6 ) ); // Vector3D { x: 4, y: 2, z: 6 }
 */
Vector3D.prototype.setVector = function setVector ( vector )
{
  return this.set( vector.x, vector.y, vector.z );
};

/**
 * Добавляет другой вектор.
 * @method v6.Vector3D#addVector
 * @param {v6.AbstractVector} vector Вектор, который надо добавить.
 * @chainable
 * @example
 * new Vector3D().addVector( new Vector3D( 4, 2, 6 ) ); // Vector3D { x: 4, y: 2, z: 6 }
 */
Vector3D.prototype.addVector = function addVector ( vector )
{
  return this.add( vector.x, vector.y, vector.z );
};

/**
 * Вычитает другой вектор.
 * @method v6.Vector3D#subVector
 * @param {v6.AbstractVector} vector Вектор, который надо вычесть.
 * @chainable
 * @example
 * new Vector3D().subVector( new Vector3D( 4, 2, 6 ) ); // Vector3D { x: -4, y: -2, z: -6 }
 */
Vector3D.prototype.subVector = function subVector ( vector )
{
  return this.sub( vector.x, vector.y, vector.z );
};

/**
 * Умножает X, Y, и Z координаты на X, Y, и Z другого вектора.
 * @method v6.Vector3D#mulVector
 * @param {v6.AbstractVector} vector Вектор для умножения.
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).mulVector( new Vector3D( 2, 3, 4 ) ); // Vector3D { x: 8, y: 6, z: 24 }
 */
Vector3D.prototype.mulVector = function mulVector ( vector )
{
  this.x *= vector.x;
  this.y *= vector.y;
  this.z *= vector.z;
  return this;
};

/**
 * Делит X, Y, и Z координаты на X, Y, и Z другого вектора.
 * @method v6.Vector3D#divVector
 * @param {v6.AbstractVector} vector Вектор, на который надо делить.
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).divVector( new Vector3D( 2, 0.5, 4 ) ); // Vector3D { x: 2, y: 4, z: 1.5 }
 */
Vector3D.prototype.divVector = function divVector ( vector )
{
  this.x /= vector.x;
  this.y /= vector.y;
  this.z /= vector.z;
  return this;
};

/**
 * @method v6.Vector3D#dotVector
 * @param  {v6.AbstractVector} vector
 * @return {number}
 * @example
 * new Vector3D( 4, 2, 6 ).dotVector( new Vector3D( 2, 3, -2 ) ); // -> 2
 */
Vector3D.prototype.dotVector = function dotVector ( vector )
{
  return this.dot( vector.x, vector.y, vector.z );
};

/**
 * Интерполирует X, Y, и Z координаты между другим вектором.
 * @method v6.Vector3D#lerpVector
 * @param {v6.AbstractVector} vector
 * @param {number}            value
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).lerpVector( new Vector3D( 8, 4, 12 ), 0.5 ); // Vector3D { x: 6, y: 3, z: 9 }
 */
Vector3D.prototype.lerpVector = function lerpVector ( vector, value )
{
  return this.lerp( vector.x, vector.y, vector.z, value );
};

/**
 * @override
 * @method v6.Vector3D#magSq
 */
Vector3D.prototype.magSq = function magSq ()
{
  return ( this.x * this.x ) + ( this.y * this.y ) + ( this.z * this.z );
};

/**
 * @override
 * @method v6.Vector3D#clone
 */
Vector3D.prototype.clone = function clone ()
{
  return new Vector3D( this.x, this.y, this.z );
};

/**
 * @override
 * @method v6.Vector3D#dist
 */
Vector3D.prototype.dist = function dist ( vector )
{
  var x = vector.x - this.x;
  var y = vector.y - this.y;
  var z = vector.z - this.z;
  return Math.sqrt( ( x * x ) + ( y * y ) + ( z * z ) );
};

/**
 * @override
 * @method v6.Vector3D#toString
 */
Vector3D.prototype.toString = function toString ()
{
  return 'v6.Vector3D { x: ' + this.x.toFixed( 2 ) + ', y: ' + this.y.toFixed( 2 ) + ', z: ' + this.z.toFixed( 2 ) + ' }';
};

/**
 * @method v6.Vector3D.random
 * @see v6.AbstractVector.random
 */
Vector3D.random = function random ()
{
  // Use the equal-area projection algorithm.
  var theta = Math.random() * Math.PI * 2;
  var z     = ( Math.random() * 2 ) - 1;
  var n     = Math.sqrt( 1 - ( z * z ) );
  return new Vector3D( n * Math.cos( theta ), n * Math.sin( theta ), z );
};

/**
 * @method v6.Vector3D.fromAngle
 * @see v6.AbstractVector.fromAngle
 */
Vector3D.fromAngle = function fromAngle ( angle )
{
  return AbstractVector._fromAngle( Vector3D, angle );
};

module.exports = Vector3D;

},{"./AbstractVector":19}],22:[function(require,module,exports){
'use strict';

/**
 * Это пространство имен (этот namepspace) реализует работу с 2D матрицами 3x3.
 * @namespace v6.mat3
 * @example
 * var mat3 = require( 'v6.js/core/math/mat3' );
 */

/**
 * Создает стандартную (identity) 3x3 матрицу.
 * @method v6.mat3.identity
 * @return {Array.<number>} Новая матрица.
 * @example
 * // Returns the identity.
 * var matrix = mat3.identity();
 */
exports.identity = function identity ()
{
  return [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ];
};

/**
 * Сбрасывает матрицу `"m1"` до стандартных (identity) значений.
 * @method v6.mat3.setIdentity
 * @param  {Array.<number>} m1 Матрица.
 * @return {void}              Ничего не возвращает.
 * @example
 * // Sets the identity.
 * mat3.setIdentity( matrix );
 */
exports.setIdentity = function setIdentity ( m1 )
{
  m1[ 0 ] = 1;
  m1[ 1 ] = 0;
  m1[ 2 ] = 0;
  m1[ 3 ] = 0;
  m1[ 4 ] = 1;
  m1[ 5 ] = 0;
  m1[ 6 ] = 0;
  m1[ 7 ] = 0;
  m1[ 8 ] = 1;
};

/**
 * Копирует значения матрицы `"m2"` на матрицу `"m1"`.
 * @method v6.mat3.copy
 * @param  {Array.<number>} m1 Матрица, в которую надо копировать.
 * @param  {Array.<number>} m2 Матрица, которую надо скопировать.
 * @return {void}              Ничего не возвращает.
 * @example
 * // Copies a matrix.
 * mat3.copy( destinationMatrix, sourceMatrix );
 */
exports.copy = function copy ( m1, m2 )
{
  m1[ 0 ] = m2[ 0 ];
  m1[ 1 ] = m2[ 1 ];
  m1[ 2 ] = m2[ 2 ];
  m1[ 3 ] = m2[ 3 ];
  m1[ 4 ] = m2[ 4 ];
  m1[ 5 ] = m2[ 5 ];
  m1[ 6 ] = m2[ 6 ];
  m1[ 7 ] = m2[ 7 ];
  m1[ 8 ] = m2[ 8 ];
};

/**
 * Возвращает клон матрицы `"m1"`.
 * @method v6.mat3.clone
 * @param  {Array.<number>} m1 Исходная матрица.
 * @return {Array.<number>}    Клон матрицы.
 * @example
 * // Creates a clone.
 * var clone = mat3.clone( matrix );
 */
exports.clone = function clone ( m1 )
{
  return [
    m1[ 0 ],
    m1[ 1 ],
    m1[ 2 ],
    m1[ 3 ],
    m1[ 4 ],
    m1[ 5 ],
    m1[ 6 ],
    m1[ 7 ],
    m1[ 8 ]
  ];
};

/**
 * Перемещает матрицу `"m1"`.
 * @method v6.mat3.translate
 * @param  {Array.<number>} m1 Матрица.
 * @param  {number}         x  X перемещения.
 * @param  {number}         y  Y перемещения.
 * @return {void}              Ничего не возвращает.
 * @example
 * // Translates by [ 4, 2 ].
 * mat3.translate( matrix, 4, 2 );
 */
exports.translate = function translate ( m1, x, y )
{
  m1[ 6 ] = ( x * m1[ 0 ] ) + ( y * m1[ 3 ] ) + m1[ 6 ];
  m1[ 7 ] = ( x * m1[ 1 ] ) + ( y * m1[ 4 ] ) + m1[ 7 ];
  m1[ 8 ] = ( x * m1[ 2 ] ) + ( y * m1[ 5 ] ) + m1[ 8 ];
};

/**
 * Поворачивает матрицу `"m1"` на `"angle"` радианов.
 * @method v6.mat3.rotate
 * @param  {Array.<number>} m1    Матрица.
 * @param  {number}         angle Угол.
 * @return {void}                 Ничего не возвращает.
 * @example
 * // Rotates by 45 degrees.
 * mat3.rotate( matrix, 45 * Math.PI / 180 );
 */
exports.rotate = function rotate ( m1, angle )
{
  var m10 = m1[ 0 ];
  var m11 = m1[ 1 ];
  var m12 = m1[ 2 ];
  var m13 = m1[ 3 ];
  var m14 = m1[ 4 ];
  var m15 = m1[ 5 ];
  var x = Math.cos( angle );
  var y = Math.sin( angle );
  m1[ 0 ] = ( x * m10 ) + ( y * m13 );
  m1[ 1 ] = ( x * m11 ) + ( y * m14 );
  m1[ 2 ] = ( x * m12 ) + ( y * m15 );
  m1[ 3 ] = ( x * m13 ) - ( y * m10 );
  m1[ 4 ] = ( x * m14 ) - ( y * m11 );
  m1[ 5 ] = ( x * m15 ) - ( y * m12 );
};

/**
 * Масштабирует матрицу.
 * @method v6.mat3.scale
 * @param  {Array.<number>} m1 Матрица.
 * @param  {number}         x  X-фактор.
 * @param  {number}         y  Y-фактор.
 * @return {void}              Ничего не возвращает.
 * @example
 * // Scales in [ 2, 2 ] times.
 * mat3.scale( matrix, 2, 2 );
 */
exports.scale = function scale ( m1, x, y )
{
  m1[ 0 ] *= x;
  m1[ 1 ] *= x;
  m1[ 2 ] *= x;
  m1[ 3 ] *= y;
  m1[ 4 ] *= y;
  m1[ 5 ] *= y;
};

/**
 * Применяет матрицу из соответствующих параметров на матрицу `"m1"`.
 * @method v6.mat3.transform
 * @param  {Array.<number>} m1  Матрица.
 * @param  {number}         m11 X масштаб (scale).
 * @param  {number}         m12 X наклон (skew).
 * @param  {number}         m21 Y наклон (skew).
 * @param  {number}         m22 Y масштаб (scale).
 * @param  {number}         dx  X перемещения (translate).
 * @param  {number}         dy  Y перемещения (translate).
 * @return {void}               Ничего не возвращает.
 * @example
 * // Applies a double-scaled matrix.
 * mat3.transform( matrix, 2, 0, 0, 2, 0, 0 );
 */
exports.transform = function transform ( m1, m11, m12, m21, m22, dx, dy )
{
  m1[ 0 ] *= m11;
  m1[ 1 ] *= m21;
  m1[ 2 ] *= dx;
  m1[ 3 ] *= m12;
  m1[ 4 ] *= m22;
  m1[ 5 ] *= dy;
  m1[ 6 ] = 0;
  m1[ 7 ] = 0;
};

/**
 * Сбрасывает матрицу `"m1"` до матрицы из соответствующих параметров.
 * @method v6.mat3.setTransform
 * @param  {Array.<number>} m1  Матрица.
 * @param  {number}         m11 X масштаб (scale).
 * @param  {number}         m12 X наклон (skew).
 * @param  {number}         m21 Y наклон (skew).
 * @param  {number}         m22 Y масштаб (scale).
 * @param  {number}         dx  X перемещения (translate).
 * @param  {number}         dy  Y перемещения (translate).
 * @return {void}               Ничего не возвращает.
 * @example
 * // Sets the identity and then applies a double-scaled matrix.
 * mat3.setTransform( matrix, 2, 0, 0, 2, 0, 0 );
 */
exports.setTransform = function setTransform ( m1, m11, m12, m21, m22, dx, dy )
{
  // X scale
  m1[ 0 ] = m11;
  // X skew
  m1[ 1 ] = m12;
  // Y skew
  m1[ 3 ] = m21;
  // Y scale
  m1[ 4 ] = m22;
  // X translate
  m1[ 6 ] = dx;
  // Y translate
  m1[ 7 ] = dy;
};

},{}],23:[function(require,module,exports){
'use strict';
var getElementW = require( 'peako/get-element-w' );
var getElementH = require( 'peako/get-element-h' );
var constants = require( '../constants' );
var createPolygon = require( '../internal/create_polygon' );
var polygons = require( '../internal/polygons' );
var setDefaultDrawingSettings = require( './internal/set_default_drawing_settings' );
var getWebGL = require( './internal/get_webgl' );
var copyDrawingSettings = require( './internal/copy_drawing_settings' );
var processRectAlignX = require( './internal/process_rect_align' ).processRectAlignX;
var processRectAlignY = require( './internal/process_rect_align' ).processRectAlignY;
var processShape = require( './internal/process_shape' );
var closeShape = require( './internal/close_shape' );
var options = require( './settings' );
/**
 * Абстрактный класс рендерера.
 * @abstract
 * @constructor v6.AbstractRenderer
 * @see v6.RendererGL
 * @see v6.Renderer2D
 * @example
 * var AbstractRenderer = require( 'v6.js/core/renderer/AbstractRenderer' );
 */
function AbstractRenderer ()
{
  throw Error( 'Cannot create an instance of the abstract class (new v6.AbstractRenderer)' );
}
AbstractRenderer.prototype = {
  /**
   * Добавляет `canvas` рендерера в DOM.
   * @method v6.AbstractRenderer#appendTo
   * @param {Element} parent Элемент, в который `canvas` рендерера должен быть добавлен.
   * @chainable
   * @example
   * // Add renderer into DOM.
   * renderer.appendTo( document.body );
   */
  appendTo: function appendTo ( parent )
  {
    parent.appendChild( this.canvas );
    return this;
  },
  /**
   * Удаляет `canvas` рендерера из DOM.
   * @method v6.AbstractRenderer#destroy
   * @chainable
   * @example
   * // Remove renderer from DOM.
   * renderer.destroy();
   */
  destroy: function destroy ()
  {
    this.canvas.parentNode.removeChild( this.canvas );
    return this;
  },
  /**
   * Сохраняет текущие настройки рендеринга.
   * @method v6.AbstractRenderer#push
   * @chainable
   * @example
   * // Save drawing settings (fill, lineWidth...) (push onto stack).
   * renderer.push();
   */
  push: function push ()
  {
    if ( this._stack[ ++this._stackIndex ] ) {
      copyDrawingSettings( this._stack[ this._stackIndex ], this );
    } else {
      this._stack.push( setDefaultDrawingSettings( {}, this ) );
    }
    return this;
  },
  /**
   * Восстанавливает предыдущие настройки рендеринга.
   * @method v6.AbstractRenderer#pop
   * @chainable
   * @example
   * // Restore drawing settings (fill, lineWidth...) (take from stack).
   * renderer.pop();
   */
  pop: function pop ()
  {
    if ( this._stackIndex >= 0 ) {
      copyDrawingSettings( this, this._stack[ this._stackIndex-- ] );
    } else {
      setDefaultDrawingSettings( this, this );
    }
    return this;
  },
  /**
   * Изменяет размер рендерера.
   * @method v6.AbstractRenderer#resize
   * @param {number} w Новая ширина.
   * @param {number} h Новая высота.
   * @chainable
   * @example
   * // Resize renderer to 600x400.
   * renderer.resize( 600, 400 );
   */
  resize: function resize ( w, h )
  {
    var canvas = this.canvas;
    var scale = this.settings.scale;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = this.w = Math.floor( w * scale ); // eslint-disable-line no-multi-assign
    canvas.height = this.h = Math.floor( h * scale ); // eslint-disable-line no-multi-assign
    return this;
  },
  /**
   * Изменяет размер рендерера до размера `element` элемента.
   * @method v6.AbstractRenderer#resizeTo
   * @param {Element} element Элемент, до которого надо растянуть рендерер.
   * @chainable
   * @example
   * // Resize renderer to match <body /> sizes.
   * renderer.resizeTo( document.body );
   */
  resizeTo: function resizeTo ( element )
  {
    return this.resize( getElementW( element ), getElementH( element ) );
  },
  /**
   * Рисует полигон.
   * @method v6.AbstractRenderer#drawPolygon
   * @param  {number}    x             X координата полигона.
   * @param  {number}    y             Y координата полигона.
   * @param  {number}    xRadius       X радиус полигона.
   * @param  {number}    yRadius       Y радиус полигона.
   * @param  {number}    sides         Количество сторон полигона.
   * @param  {number}    rotationAngle Угол поворота полигона
   *                                   (чтобы не использовать {@link v6.Transform#rotate}).
   * @param  {boolean}   degrees       Использовать градусы.
   * @chainable
   * @example
   * // Draw hexagon at [ 4, 2 ] with radius 25.
   * renderer.polygon( 4, 2, 25, 25, 6, 0 );
   */
  drawPolygon: function drawPolygon ( x, y, xRadius, yRadius, sides, rotationAngle, degrees )
  {
    var polygon = polygons[ sides ];
    if ( ! polygon ) {
      polygon = polygons[ sides ] = createPolygon( sides ); // eslint-disable-line no-multi-assign
    }
    if ( degrees ) {
      rotationAngle *= Math.PI / 180;
    }
    this.matrix.save();
    this.matrix.translate( x, y );
    this.matrix.rotate( rotationAngle );
    this.drawArrays( polygon, polygon.length * 0.5, void 0, xRadius, yRadius );
    this.matrix.restore();
    return this;
  },
  /**
   * Рисует полигон.
   * @method v6.AbstractRenderer#polygon
   * @param  {number} x               X координата полигона.
   * @param  {number} y               Y координата полигона.
   * @param  {number} r               Радиус полигона.
   * @param  {number} sides           Количество сторон полигона.
   * @param  {number} [rotationAngle] Угол поворота полигона
   *                                  (чтобы не использовать {@link v6.Transform#rotate}).
   * @chainable
   * @example
   * // Draw hexagon at [ 4, 2 ] with radius 25.
   * renderer.polygon( 4, 2, 25, 6 );
   */
  polygon: function polygon ( x, y, r, sides, rotationAngle )
  {
    if ( sides % 1 ) {
      sides = Math.floor( sides * 100 ) * 0.01;
    }
    if ( typeof rotationAngle === 'undefined' ) {
      this.drawPolygon( x, y, r, r, sides, -Math.PI * 0.5 );
    } else {
      this.drawPolygon( x, y, r, r, sides, rotationAngle, options.degrees );
    }
    return this;
  },
  /**
   * Рисует картинку.
   * @method v6.AbstractRenderer#image
   * @param {v6.AbstractImage} image Картинка которую надо отрисовать.
   * @param {number}           x     X координата картинки.
   * @param {number}           y     Y координата картинки.
   * @param {number}           [w]   Ширина картинки.
   * @param {number}           [h]   Высота картинки.
   * @chainable
   * @example
   * // Create image.
   * var image = new Image( document.getElementById( 'image' ) );
   * // Draw image at [ 4, 2 ].
   * renderer.image( image, 4, 2 );
   */
  image: function image ( image, x, y, w, h )
  {
    if ( image.get().loaded ) {
      if ( typeof w === 'undefined' ) {
        w = image.dw;
      }
      if ( typeof h === 'undefined' ) {
        h = image.dh;
      }
      x = processRectAlignX( this, x, w );
      x = processRectAlignY( this, y, h );
      this.drawImage( image, x, y, w, h );
    }
    return this;
  },
  /**
   * Метод для начала отрисовки фигуры.
   * @method v6.AbstractRenderer#beginShape
   * @param {object}   [options]              Параметры фигуры.
   * @param {function} [options.drawFunction] Функция, котороя будет отрисовывать все вершины в {@link v6.AbstractRenderer.endShape}. Может быть перезаписана.
   * @chainable
   * @example
   * // Require "v6.shapes" ("v6.js" built-in drawing functions).
   * var shapes = require( 'v6.js/renderer/shapes/points' );
   * // Begin drawing points shape.
   * renderer.beginShape( { drawFunction: shapes.drawPoints } );
   * // Begin drawing shape without drawing function (must be passed later in `endShape`).
   * renderer.beginShape();
   */
  beginShape: function beginShape ( options )
  {
    if ( ! options ) {
      options = {};
    }
    this._vertices.length = 0;
    this._closedShape = null;
    if ( typeof options.drawFunction === 'undefined' ) {
      this._drawFunction = null;
    } else {
      this._drawFunction = options.drawFunction;
    }
    return this;
  },
  /**
   * Создает вершину в координатах из соответсвующих параметров.
   * @method v6.AbstractRenderer#vertex
   * @param {number} x X координата новой вершины.
   * @param {number} y Y координата новой вершины.
   * @chainable
   * @see v6.AbstractRenderer#beginShape
   * @see v6.AbstractRenderer#endShape
   * @example
   * // Draw rectangle with vertices.
   * renderer.vertex( 0, 0 );
   * renderer.vertex( 1, 0 );
   * renderer.vertex( 1, 1 );
   * renderer.vertex( 0, 1 );
   */
  vertex: function vertex ( x, y )
  {
    this._vertices.push( Math.floor( x ), Math.floor( y ) );
    this._closedShape = null;
    return this;
  },
  /**
   * Рисует фигуру из вершин.
   * @method v6.AbstractRenderer#endShape
   * @param {object}   [options]              Параметры фигуры.
   * @param {boolean}  [options.close]        Соединить последнюю вершину с первой (закрыть фигуру).
   * @param {function} [options.drawFunction] Функция, котороя будет отрисовывать все вершины.
   *                                          Имеет больший приоритет чем в {@link v6.AbstractRenderer#beginShape}.
   * @chainable
   * @example
   * // Require "v6.shapes" ("v6.js" built-in drawing functions).
   * var shapes = require( 'v6.js/renderer/shapes/points' );
   * // Close and draw a shape.
   * renderer.endShape( { close: true } );
   * // Draw with a custom function.
   * renderer.endShape( { drawFunction: shapes.drawLines } );
   */
  endShape: function endShape ( options )
  {
    var drawFunction, vertices;
    if ( ! options ) {
      options = {};
    }
    if ( ! ( drawFunction = options.drawFunction || this._drawFunction ) ) {
      throw Error( 'No "drawFunction" specified for "renderer.endShape"' );
    }
    if ( options.close ) {
      closeShape( this );
      vertices = this._closedShape;
    } else {
      vertices = this._vertices;
    }
    drawFunction( this, processShape( this, vertices ) );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#save
   * @chainable
   * @see v6.Transform#save
   * @example
   * // Save transform.
   * renderer.save();
   */
  save: function save ()
  {
    this.matrix.save();
    return this;
  },
  /**
   * @method v6.AbstractRenderer#restore
   * @chainable
   * @see v6.Transform#restore
   * @example
   * // Restore transform.
   * renderer.restore();
   */
  restore: function restore ()
  {
    this.matrix.restore();
    return this;
  },
  /**
   * @method v6.AbstractRenderer#setTransform
   * @chainable
   * @see v6.Transform#setTransform
   * @example
   * // Set identity transform.
   * renderer.setTransform( 1, 0, 0, 1, 0, 0 );
   */
  setTransform: function setTransform ( m11, m12, m21, m22, dx, dy )
  {
    this.matrix.setTransform( m11, m12, m21, m22, dx, dy );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#translate
   * @chainable
   * @see v6.Transform#translate
   * @example
   * // Translate transform to [ 4, 2 ].
   * renderer.translate( 4, 2 );
   */
  translate: function translate ( x, y )
  {
    this.matrix.translate( x, y );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#rotate
   * @chainable
   * @see v6.Transform#rotate
   * @todo renderer.settings.degrees
   * @example
   * // Rotate transform on 45 degrees.
   * renderer.rotate( 45 * Math.PI / 180 );
   */
  rotate: function rotate ( angle )
  {
    if ( this.settings.degrees ) {
      angle *= Math.PI / 180;
    }
    this.matrix.rotate( angle );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#scale
   * @chainable
   * @see v6.Transform#scale
   * @example
   * // Scale transform twice.
   * renderer.scale( 2, 2 );
   */
  scale: function scale ( x, y )
  {
    this.matrix.scale( x, y );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#transform
   * @chainable
   * @see v6.Transform#transform
   * @example
   * // Apply translated to [ 4, 2 ] "transformation matrix".
   * renderer.transform( 1, 0, 0, 1, 4, 2 );
   */
  transform: function transform ( m11, m12, m21, m22, dx, dy )
  {
    this.matrix.transform( m11, m12, m21, m22, dx, dy );
    return this;
  },
  /**
   * Устанавливает lineWidth (ширину контура).
   * @method v6.AbstractRenderer#lineWidth
   * @param {number} number Новый lineWidth.
   * @chainable
   * @example
   * // Set `lineWidth` to 10px.
   * renderer.lineWidth( 10 );
   */
  lineWidth: function lineWidth ( number )
  {
    this._lineWidth = number;
    return this;
  },
  /**
   * Устанавливает `backgroundPositionX` настройку рендеринга.
   * @method v6.AbstractRenderer#backgroundPositionX
   * @param {number}   value
   * @param {constant} type
   * @chainable
   * @example
   * // Set "backgroundPositionX" drawing setting to CENTER (default: LEFT).
   * renderer.backgroundPositionX( constants.get( 'CENTER' ), constants.get( 'CONSTANT' ) );
   * renderer.backgroundPositionX( 0.5, constants.get( 'PERCENT' ) );
   * renderer.backgroundPositionX( renderer.w / 2 );
   */
  backgroundPositionX: function backgroundPositionX ( value, type ) { if ( typeof type !== 'undefined' && type !== constants.get( 'VALUE' ) ) { if ( type === constants.get( 'CONSTANT' ) ) { type = constants.get( 'PERCENT' ); if ( value === constants.get( "LEFT" ) ) { value = 0; } else if ( value === constants.get( "CENTER" ) ) { value = 0.5; } else if ( value === constants.get( "RIGHT" ) ) { value = 1; } else { throw Error( 'Got unknown value. The known are: ' + "LEFT" + ', ' + "CENTER" + ', ' + "RIGHT" ); } } if ( type === constants.get( 'PERCENT' ) ) { value *= this.w; } else { throw Error( 'Got unknown `value` type. The known are: VALUE, PERCENT, CONSTANT' ); } } this._backgroundPositionX = value; return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Устанавливает `backgroundPositionY` настройку рендеринга.
   * @method v6.AbstractRenderer#backgroundPositionY
   * @param {number}   value
   * @param {constant} type
   * @chainable
   * @example
   * // Set "backgroundPositionY" drawing setting to MIDDLE (default: TOP).
   * renderer.backgroundPositionY( constants.get( 'MIDDLE' ), constants.get( 'CONSTANT' ) );
   * renderer.backgroundPositionY( 0.5, constants.get( 'PERCENT' ) );
   * renderer.backgroundPositionY( renderer.h / 2 );
   */
  backgroundPositionY: function backgroundPositionY ( value, type ) { if ( typeof type !== 'undefined' && type !== constants.get( 'VALUE' ) ) { if ( type === constants.get( 'CONSTANT' ) ) { type = constants.get( 'PERCENT' ); if ( value === constants.get( "TOP" ) ) { value = 0; } else if ( value === constants.get( "MIDDLE" ) ) { value = 0.5; } else if ( value === constants.get( "BOTTOM" ) ) { value = 1; } else { throw Error( 'Got unknown value. The known are: ' + "TOP" + ', ' + "MIDDLE" + ', ' + "BOTTOM" ); } } if ( type === constants.get( 'PERCENT' ) ) { value *= this.h; } else { throw Error( 'Got unknown `value` type. The known are: VALUE, PERCENT, CONSTANT' ); } } this._backgroundPositionY = value; return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Устанавливает `rectAlignX` настройку рендеринга.
   * @method v6.AbstractRenderer#rectAlignX
   * @param {constant} value `LEFT`, `CENTER`, `RIGHT`.
   * @chainable
   * @example
   * // Set "rectAlignX" drawing setting to CENTER (default: LEFT).
   * renderer.rectAlignX( constants.get( 'CENTER' ) );
   */
  rectAlignX: function rectAlignX ( value ) { if ( value === constants.get( 'LEFT' ) || value === constants.get( 'CENTER' ) || value === constants.get( 'RIGHT' ) ) { this._rectAlignX = value; } else { throw Error( 'Got unknown `rectAlign` constant. The known are: ' + "LEFT" + ', ' + "CENTER" + ', ' + "RIGHT" ); } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Устанавливает `rectAlignY` настройку рендеринга.
   * @method v6.AbstractRenderer#rectAlignY
   * @param {constant} value `TOP`, `MIDDLE`, `BOTTOM`.
   * @chainable
   * @example
   * // Set "rectAlignY" drawing setting to MIDDLE (default: TOP).
   * renderer.rectAlignY( constants.get( 'MIDDLE' ) );
   */
  rectAlignY: function rectAlignY ( value ) { if ( value === constants.get( 'LEFT' ) || value === constants.get( 'CENTER' ) || value === constants.get( 'RIGHT' ) ) { this._rectAlignY = value; } else { throw Error( 'Got unknown `rectAlign` constant. The known are: ' + "TOP" + ', ' + "MIDDLE" + ', ' + "BOTTOM" ); } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Устанавливает цвет `stroke` при рисовании через {@link v6.AbstractRenderer#rect} и т.п.
   * @method v6.AbstractRenderer#stroke
   * @param {number|boolean|TColor} [r] Если это `boolean`, то это включит или выключит `stroke`
   *                                    (как через {@link v6.AbstractRenderer#noStroke}).
   * @param {number}                [g]
   * @param {number}                [b]
   * @param {number}                [a]
   * @chainable
   * @example
   * // Disable and then enable `stroke`.
   * renderer.stroke( false ).stroke( true );
   * // Set `stroke` to "lightskyblue".
   * renderer.stroke( 'lightskyblue' );
   * // Set `stroke` from `v6.RGBA`.
   * renderer.stroke( new RGBA( 255, 0, 0 ).perceivedBrightness() );
   */
  stroke: function stroke ( r, g, b, a ) { if ( typeof r === 'boolean' ) { this._doStroke = r; } else { if ( typeof r === 'string' || this._strokeColor.type !== this.settings.color.type ) { this._strokeColor = new this.settings.color( r, g, b, a ); } else { this._strokeColor.set( r, g, b, a ); } this._doStroke = true; } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Устанавливает цвет `fill` при рисовании через {@link v6.AbstractRenderer#rect} и т.п.
   * @method v6.AbstractRenderer#fill
   * @param {number|boolean|TColor} [r] Если это `boolean`, то это включит или выключит `fill`
   *                                    (как через {@link v6.AbstractRenderer#noFill}).
   * @param {number}                [g]
   * @param {number}                [b]
   * @param {number}                [a]
   * @chainable
   * @example
   * // Disable and then enable `fill`.
   * renderer.fill( false ).fill( true );
   * // Set `fill` to "lightpink".
   * renderer.fill( 'lightpink' );
   * // Set `fill` from `v6.RGBA`.
   * renderer.fill( new RGBA( 255, 0, 0 ).brightness() );
   */
  fill: function fill ( r, g, b, a ) { if ( typeof r === 'boolean' ) { this._doFill = r; } else { if ( typeof r === 'string' || this._fillColor.type !== this.settings.color.type ) { this._fillColor = new this.settings.color( r, g, b, a ); } else { this._fillColor.set( r, g, b, a ); } this._doFill = true; } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Выключает рисование контура (stroke).
   * @method v6.AbstractRenderer#noStroke
   * @chainable
   * @example
   * // Disable drawing stroke.
   * renderer.noStroke();
   */
  noStroke: function noStroke () { this._doStroke = false; return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Выключает заполнения фона (fill).
   * @method v6.AbstractRenderer#noFill
   * @chainable
   * @example
   * // Disable filling.
   * renderer.noFill();
   */
  noFill: function noFill () { this._doFill = false; return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Заполняет фон рендерера цветом.
   * @virtual
   * @method v6.AbstractRenderer#backgroundColor
   * @param {number|TColor} [r]
   * @param {number}        [g]
   * @param {number}        [b]
   * @param {number}        [a]
   * @chainable
   * @example
   * // Fill renderer with "lightpink" color.
   * renderer.backgroundColor( 'lightpink' );
   */
  /**
   * Заполняет фон рендерера картинкой.
   * @virtual
   * @method v6.AbstractRenderer#backgroundImage
   * @param {v6.AbstractImage} image Картинка, которая должна использоваться для фона.
   * @chainable
   * @example
   * // Create background image.
   * var image = Image.fromURL( 'background.jpg' );
   * // Fill renderer with the image.
   * renderer.backgroundImage( Image.stretch( image, renderer.w, renderer.h ) );
   */
  /**
   * Очищает контекст.
   * @virtual
   * @method v6.AbstractRenderer#clear
   * @chainable
   * @example
   * // Clear renderer's context.
   * renderer.clear();
   */
  /**
   * Отрисовывает переданные вершины.
   * @virtual
   * @method v6.AbstractRenderer#drawArrays
   * @param {Float32Array|Array} verts Вершины, которые надо отрисовать. Если не передано для
   *                                   {@link v6.RendererGL}, то будут использоваться вершины из
   *                                   стандартного буфера ({@link v6.RendererGL#buffers.default}).
   * @param {number}             count Количество вершин, например: 3 для треугольника.
   * @chainable
   * @example
   * // A triangle.
   * var vertices = new Float32Array( [
   *   0,  0,
   *   50, 50,
   *   0,  50
   * ] );
   *
   * // Draw the triangle.
   * renderer.drawArrays( vertices, 3 );
   */
  /**
   * Рисует картинку.
   * @virtual
   * @method v6.AbstractRenderer#drawImage
   * @param {v6.AbstractImage} image Картинка которую надо отрисовать.
   * @param {number}           x     "Destination X". X координата картинки.
   * @param {number}           y     "Destination Y". Y координата картинки.
   * @param {number}           w     "Destination Width". Ширина картинки.
   * @param {number}           h     "Destination Height". Высота картинки.
   * @chainable
   * @example
   * // Create image.
   * var image = Image.fromURL( '300x200.png' );
   * // Draw image at [ 0, 0 ].
   * renderer.drawImage( image, 0, 0, 600, 400 );
   */
  /**
   * Рисует прямоугольник.
   * @virtual
   * @method v6.AbstractRenderer#rect
   * @param {number} x X координата прямоугольника.
   * @param {number} y Y координата прямоугольника.
   * @param {number} w Ширина прямоугольника.
   * @param {number} h Высота прямоугольника.
   * @chainable
   * @example
   * // Draw square at [ 20, 20 ] with size 80.
   * renderer.rect( 20, 20, 80, 80 );
   */
  /**
   * Рисует круг.
   * @virtual
   * @method v6.AbstractRenderer#arc
   * @param {number} x X координата круга.
   * @param {number} y Y координата круга.
   * @param {number} r Радиус круга.
   * @chainable
   * @example
   * // Draw circle at [ 60, 60 ] with radius 40.
   * renderer.arc( 60, 60, 40 );
   */
  /**
   * Рисует линию.
   * @method v6.AbstractRenderer#line
   * @param {number} x1 X начала линии.
   * @param {number} y1 Y начала линии.
   * @param {number} x2 X концы линии.
   * @param {number} y2 Y концы линии.
   * @chainable
   * @example
   * // Draw line from [ 10, 10 ] to [ 20, 20 ].
   * renderer.line( 10, 10, 20, 20 );
   */
  /**
   * Рисует точку.
   * @method v6.AbstractRenderer#point
   * @param {number} x X координата точки.
   * @param {number} y Y координата точки.
   * @chainable
   * @example
   * // Draw point at [ 4, 2 ].
   * renderer.point( 4, 2 );
   */
  constructor: AbstractRenderer
};
/**
 * Initialize renderer on `"self"`.
 * @method v6.AbstractRenderer.create
 * @param  {v6.AbstractRenderer} self    Renderer that should be initialized.
 * @param  {object}              options {@link v6.settings.renderer}
 * @param  {constant}            type    Type of renderer: `2D` or `GL`. Cannot be `AUTO`!.
 * @return {void}                        Returns nothing.
 * @example <caption>Custom Renderer</caption>
 * var AbstractRenderer = require( 'v6.js/core/renderer/AbstractRenderer' );
 * var settings         = require( 'v6.js/core/renderer/settings' );
 * var constants        = require( 'v6.js/core/constants' );
 *
 * function CustomRenderer ( options )
 * {
 *   // Initialize CustomRenderer.
 *   AbstractRenderer.create( this, defaults( settings, options ), constants.get( '2D' ) );
 * }
 */
AbstractRenderer.create = function create ( self, options, type )
{
  var context;
  /**
   * `canvas` рендерера для отрисовки на экране.
   * @member {HTMLCanvasElement} v6.AbstractRenderer#canvas
   */
  if ( options.canvas ) {
    self.canvas = options.canvas;
  } else {
    self.canvas = document.createElement( 'canvas' );
    self.canvas.innerHTML = 'Unable to run this application.';
  }
  if ( type === constants.get( '2D' ) ) {
    context = '2d';
  } else if ( type !== constants.get( 'GL' ) ) {
    throw Error( 'Got unknown renderer type. The known are: 2D and GL' );
  } else if ( ! ( context = getWebGL() ) ) {
    throw Error( 'Cannot get WebGL context. Try to use 2D as the renderer type or v6.Renderer2D instead of v6.RendererGL' );
  }
  /**
   * Контекст холста.
   * @member {object} v6.AbstractRenderer#context
   */
  self.context = self.canvas.getContext( context, {
    alpha: options.alpha
  } );
  /**
   * Настройки рендерера.
   * @member {object} v6.AbstractRenderer#settings
   * @see v6.settings.renderer.settings
   */
  self.settings = options.settings;
  /**
   * Тип рендерера: GL, 2D.
   * @member {constant} v6.AbstractRenderer#type
   */
  self.type = type;
  /**
   * Стэк сохраненных настроек рендеринга.
   * @private
   * @member {Array.<object>} v6.AbstractRenderer#_stack
   * @see v6.AbstractRenderer#push
   * @see v6.AbstractRenderer#pop
   */
  self._stack = [];
  /**
   * Позиция последних сохраненных настроек рендеринга.
   * @private
   * @member {number} v6.AbstractRenderer#_stackIndex
   * @see v6.AbstractRenderer#push
   * @see v6.AbstractRenderer#pop
   */
  self._stackIndex = -1;
  /**
   * Вершины фигуры.
   * @private
   * @member {Array.<number>} v6.AbstractRenderer#_vertices
   * @see v6.AbstractRenderer#beginShape
   * @see v6.AbstractRenderer#vertex
   * @see v6.AbstractRenderer#endShape
   */
  self._vertices = [];
  /**
   * Закрытая фигура (вершина).
   * @private
   * @member {Array.<number>} v6.AbstractRenderer#_drawFunction
   * @see v6.AbstractRenderer#beginShape
   * @see v6.AbstractRenderer#vertex
   * @see v6.AbstractRenderer#endShape
   */
  self._closedShape = null;
  /**
   * Функция, котороя будет отрисовывать вершины.
   * @private
   * @member {function} v6.AbstractRenderer#_drawFunction
   * @see v6.AbstractRenderer#beginShape
   * @see v6.AbstractRenderer#vertex
   * @see v6.AbstractRenderer#endShape
   */
  self._drawFunction = null;
  if ( typeof options.appendTo === 'undefined' ) {
    self.appendTo( document.body );
  } else if ( options.appendTo !== null ) {
    self.appendTo( options.appendTo );
  }
  if ( 'w' in options || 'h' in options ) {
    self.resize( options.w || 0, options.h || 0 );
  } else if ( options.appendTo !== null ) {
    self.resizeTo( options.appendTo || document.body );
  } else {
    self.resize( 600, 400 );
  }
  setDefaultDrawingSettings( self, self );
};
module.exports = AbstractRenderer;

},{"../constants":10,"../internal/create_polygon":14,"../internal/polygons":17,"./internal/close_shape":27,"./internal/copy_drawing_settings":28,"./internal/get_webgl":31,"./internal/process_rect_align":32,"./internal/process_shape":33,"./internal/set_default_drawing_settings":34,"./settings":35,"peako/get-element-h":68,"peako/get-element-w":69}],24:[function(require,module,exports){
'use strict';

var defaults          = require( 'peako/defaults' );

var constants         = require( '../constants' );

var processRectAlignX = require( './internal/process_rect_align' ).processRectAlignX;
var processRectAlignY = require( './internal/process_rect_align' ).processRectAlignY;

var AbstractRenderer  = require( './AbstractRenderer' );
var settings          = require( './settings' );

/**
 * 2D рендерер.
 * @constructor v6.Renderer2D
 * @extends v6.AbstractRenderer
 * @param {object} options {@link v6.settings.renderer}
 * @example
 * // Require Renderer2D.
 * var Renderer2D = require( 'v6.js/core/renderer/Renderer2D' );
 * // Create an Renderer2D isntance.
 * var renderer = new Renderer2D();
 */
function Renderer2D ( options )
{
  AbstractRenderer.create( this, ( options = defaults( settings, options ) ), constants.get( '2D' ) );

  /**
   * @member v6.Renderer2D#matrix
   * @alias v6.Renderer2D#context
   */
  this.matrix = this.context;
}

Renderer2D.prototype = Object.create( AbstractRenderer.prototype );
Renderer2D.prototype.constructor = Renderer2D;

/**
 * @override
 * @method v6.Renderer2D#backgroundColor
 */
Renderer2D.prototype.backgroundColor = function backgroundColor ( r, g, b, a )
{
  var settings = this.settings;
  var context  = this.context;

  context.save();
  context.fillStyle = new settings.color( r, g, b, a );
  context.setTransform( settings.scale, 0, 0, settings.scale, 0, 0 );
  context.fillRect( 0, 0, this.w, this.h );
  context.restore();

  return this;
};

/**
 * @override
 * @method v6.Renderer2D#backgroundImage
 */
Renderer2D.prototype.backgroundImage = function backgroundImage ( image )
{
  var _rectAlignX = this._rectAlignX;
  var _rectAlignY = this._rectAlignY;

  this._rectAlignX = constants.get( 'CENTER' );
  this._rectAlignY = constants.get( 'MIDDLE' );

  this.image( image, this.w * 0.5, this.h * 0.5 );

  this._rectAlignX = _rectAlignX;
  this._rectAlignY = _rectAlignY;

  return this;
};

/**
 * @override
 * @method v6.Renderer2D#clear
 */
Renderer2D.prototype.clear = function clear ()
{
  this.context.clear( 0, 0, this.w, this.h );
  return this;
};

/**
 * @override
 * @method v6.Renderer2D#drawArrays
 */
Renderer2D.prototype.drawArrays = function drawArrays ( verts, count, _mode, _sx, _sy )
{
  var context = this.context;
  var i;

  if ( count < 2 ) {
    return this;
  }

  if ( typeof _sx === 'undefined' ) {
    _sx = _sy = 1; // eslint-disable-line no-multi-assign
  }

  context.beginPath();
  context.moveTo( verts[ 0 ] * _sx, verts[ 1 ] * _sy );

  for ( i = 2, count *= 2; i < count; i += 2 ) {
    context.lineTo( verts[ i ] * _sx, verts[ i + 1 ] * _sy );
  }

  if ( this._doFill ) {
    this._fill();
  }

  if ( this._doStroke && this._lineWidth > 0 ) {
    this._stroke();
  }

  return this;
};

/**
 * @override
 * @method v6.Renderer2D#drawImage
 */
Renderer2D.prototype.drawImage = function drawImage ( image, x, y, w, h )
{
  this.context.drawImage( image.get().image, image.sx, image.sy, image.sw, image.sh, x, y, w, h );
  return this;
};

/**
 * @override
 * @method v6.Renderer2D#rect
 */
Renderer2D.prototype.rect = function rect ( x, y, w, h )
{
  x = processRectAlignX( this, x, w );
  y = processRectAlignY( this, y, h );

  this.context.beginPath();
  this.context.rect( x, y, w, h );

  if ( this._doFill ) {
    this._fill();
  }

  if ( this._doStroke && this._lineWidth > 0 ) {
    this._stroke();
  }

  return this;
};

/**
 * @override
 * @method v6.Renderer2D#arc
 */
Renderer2D.prototype.arc = function arc ( x, y, r )
{
  this.context.beginPath();
  this.context.arc( x, y, r, 0, Math.PI * 2 );

  if ( this._doFill ) {
    this._fill();
  }

  if ( this._doStroke && this._lineWidth > 0 ) {
    this._stroke();
  }

  return this;
};

Renderer2D.prototype._fill = function _fill ()
{
  this.context.fillStyle = this._fillColor;
  this.context.fill();
};

Renderer2D.prototype._stroke = function _stroke ()
{
  var context = this.context;

  context.strokeStyle = this._strokeColor;

  if ( ( context.lineWidth = this._lineWidth ) <= 1 ) {
    context.stroke();
  }

  context.stroke();
};

module.exports = Renderer2D;

},{"../constants":10,"./AbstractRenderer":23,"./internal/process_rect_align":32,"./settings":35,"peako/defaults":65}],25:[function(require,module,exports){
'use strict';

var defaults          = require( 'peako/defaults' );

var ShaderProgram     = require( '../ShaderProgram' );
var Transform         = require( '../Transform' );
var constants         = require( '../constants' );
var shaders           = require( '../shaders' );

var processRectAlignX = require( './internal/process_rect_align' ).processRectAlignX;
var processRectAlignY = require( './internal/process_rect_align' ).processRectAlignY;

var AbstractRenderer  = require( './AbstractRenderer' );
var settings          = require( './settings' );

/**
 * Массив вершин (vertices) квадрата.
 * @private
 * @inner
 * @var {Float32Array} rect
 */
var rect = ( function ()
{
  var rect = [
    0, 0,
    1, 0,
    1, 1,
    0, 1
  ];

  if ( typeof Float32Array === 'function' ) {
    return new Float32Array( rect ); // eslint-disable-line no-undef
  }

  return rect;
} )();

/**
 * WebGL рендерер.
 * @constructor v6.RendererGL
 * @extends v6.AbstractRenderer
 * @param {object} options {@link v6.settings.renderer}
 * @example
 * // Require RendererGL.
 * var RendererGL = require( 'v6.js/core/renderer/RendererGL' );
 * // Create an RendererGL isntance.
 * var renderer = new RendererGL();
 */
function RendererGL ( options )
{
  AbstractRenderer.create( this, ( options = defaults( settings, options ) ), constants.get( 'GL' ) );

  /**
   * Эта "transformation matrix" используется для {@link v6.RendererGL#rotate} и т.п.
   * @member {v6.Transform} v6.RendererGL#matrix
   */
  this.matrix = new Transform();

  /**
   * Буферы данных (вершин).
   * @member {object} v6.RendererGL#buffers
   * @property {WebGLBuffer} default Основной буфер.
   * @property {WebGLBuffer} rect    Используется для отрисовки прямоугольника в {@link v6.RendererGL#rect}.
   */
  this.buffers = {
    default: this.context.createBuffer(),
    rect:  this.context.createBuffer()
  };

  this.context.bindBuffer( this.context.ARRAY_BUFFER, this.buffers.rect );
  this.context.bufferData( this.context.ARRAY_BUFFER, rect, this.context.STATIC_DRAW );

  /**
   * Шейдеры (WebGL программы).
   * @member {object} v6.RendererGL#programs
   * @property {v6.ShaderProgram} default
   */
  this.programs = {
    default: new ShaderProgram( shaders.basic, this.context )
  };

  this.blending( options.blending );
}

RendererGL.prototype = Object.create( AbstractRenderer.prototype );
RendererGL.prototype.constructor = RendererGL;

/**
 * @override
 * @method v6.RendererGL#resize
 */
RendererGL.prototype.resize = function resize ( w, h )
{
  AbstractRenderer.prototype.resize.call( this, w, h );
  this.context.viewport( 0, 0, this.w, this.h );
  return this;
};

/**
 * @method v6.RendererGL#blending
 * @param {boolean} blending
 * @chainable
 */
RendererGL.prototype.blending = function blending ( blending )
{
  var gl = this.context;

  if ( blending ) {
    gl.enable( gl.BLEND );
    gl.disable( gl.DEPTH_TEST );
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
    gl.blendEquation( gl.FUNC_ADD );
  } else {
    gl.disable( gl.BLEND );
    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc( gl.LEQUAL );
  }

  return this;
};

/**
 * Очищает контекст.
 * @private
 * @method v6.RendererGL#_clear
 * @param  {number} r Нормализованное значение "red channel".
 * @param  {number} g Нормализованное значение "green channel".
 * @param  {number} b Нормализованное значение "blue channel".
 * @param  {number} a Нормализованное значение прозрачности (alpha).
 * @return {void}     Ничего не возвращает.
 * @example
 * renderer._clear( 1, 0, 0, 1 ); // Fill context with red color.
 */
RendererGL.prototype._clear = function _clear ( r, g, b, a )
{
  var gl = this.context;
  gl.clearColor( r, g, b, a );
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT ); // eslint-disable-line no-bitwise
};

/**
 * @override
 * @method v6.RendererGL#backgroundColor
 */
RendererGL.prototype.backgroundColor = function backgroundColor ( r, g, b, a )
{
  var rgba = new this.settings.color( r, g, b, a ).rgba();
  this._clear( rgba[ 0 ] / 255, rgba[ 1 ] / 255, rgba[ 2 ] / 255, rgba[ 3 ] );
  return this;
};

/**
 * @override
 * @method v6.RendererGL#clear
 */
RendererGL.prototype.clear = function clear ()
{
  this._clear( 0, 0, 0, 0 );
  return this;
};

/**
 * @override
 * @method v6.RendererGL#drawArrays
 */
RendererGL.prototype.drawArrays = function drawArrays ( verts, count, mode, _sx, _sy )
{
  var program = this.programs.default;
  var gl      = this.context;

  if ( count < 2 ) {
    return this;
  }

  if ( verts ) {
    if ( typeof mode === 'undefined' ) {
      mode = gl.STATIC_DRAW;
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, this.buffers.default );
    gl.bufferData( gl.ARRAY_BUFFER, verts, mode );
  }

  if ( typeof _sx !== 'undefined' ) {
    this.matrix.scale( _sx, _sy );
  }

  program
    .use()
    .setUniform( 'utransform', this.matrix.matrix )
    .setUniform( 'ures', [ this.w, this.h ] )
    .setAttribute( 'apos', 2, gl.FLOAT, false, 0, 0 );

  this._fill( count );
  this._stroke( count );

  return this;
};

RendererGL.prototype._fill = function _fill ( count )
{
  if ( this._doFill ) {
    this.programs.default.setUniform( 'ucolor', this._fillColor.rgba() );
    this.context.drawArrays( this.context.TRIANGLE_FAN, 0, count );
  }
};

RendererGL.prototype._stroke = function _stroke ( count )
{
  if ( this._doStroke && this._lineWidth > 0 ) {
    this.programs.default.setUniform( 'ucolor', this._strokeColor.rgba() );
    this.context.lineWidth( this._lineWidth );
    this.context.drawArrays( this.context.LINE_LOOP, 0, count );
  }
};

/**
 * @override
 * @method v6.RendererGL#arc
 */
RendererGL.prototype.arc = function arc ( x, y, r )
{
  return this.drawPolygon( x, y, r, r, 24, 0 );
};

/**
 * @override
 * @method v6.RendererGL#rect
 */
RendererGL.prototype.rect = function rect ( x, y, w, h )
{
  x = processRectAlignX( this, x, w );
  y = processRectAlignY( this, y, h );
  this.matrix.save();
  this.matrix.translate( x, y );
  this.matrix.scale( w, h );
  this.context.bindBuffer( this.context.ARRAY_BUFFER, this.buffers.rect );
  this.drawArrays( null, 4 );
  this.matrix.restore();
  return this;
};

module.exports = RendererGL;

},{"../ShaderProgram":1,"../Transform":3,"../constants":10,"../shaders":39,"./AbstractRenderer":23,"./internal/process_rect_align":32,"./settings":35,"peako/defaults":65}],26:[function(require,module,exports){
'use strict';

var constants       = require( '../constants' );

var report          = require( '../internal/report' );

var getRendererType = require( './internal/get_renderer_type' );
var getWebGL        = require( './internal/get_webgl' );

var RendererGL      = require( './RendererGL' );
var Renderer2D      = require( './Renderer2D' );
var type            = require( './settings' ).type;

/**
 * Создает новый рендерер. Если создать WebGL контекст не получится, то будет использован 2D.
 * @method v6.createRenderer
 * @param  {object}              options {@link v6.settings.renderer}.
 * @return {v6.AbstractRenderer}         Новый рендерер (2D, GL).
 * @example
 * var createRenderer = require( 'v6.js/core/renderer/create_renderer' );
 * var constants      = require( 'v6.js/core/constants' );
 * @example <caption>Creating WebGL or 2D renderer based on platform and browser</caption>
 * var renderer = createRenderer( { type: constants.get( 'AUTO' ) } );
 * @example <caption>Creating WebGL renderer</caption>
 * var renderer = createRenderer( { type: constants.get( 'GL' ) } );
 * @example <caption>Creating 2D renderer</caption>
 * var renderer = createRenderer( { type: constants.get( '2D' ) } );
 */
function createRenderer ( options )
{
  var type_ = ( options && options.type ) || type;

  if ( type_ === constants.get( 'AUTO' ) ) {
    type_ = getRendererType();
  }

  if ( type_ === constants.get( 'GL' ) ) {
    if ( getWebGL() ) {
      return new RendererGL( options );
    }

    report( 'Cannot create WebGL context. Falling back to 2D.' );
  }

  if ( type_ === constants.get( '2D' ) || type_ === constants.get( 'GL' ) ) {
    return new Renderer2D( options );
  }

  throw Error( 'Got unknown renderer type. The known are: 2D and GL' );
}

module.exports = createRenderer;

},{"../constants":10,"../internal/report":18,"./Renderer2D":24,"./RendererGL":25,"./internal/get_renderer_type":30,"./internal/get_webgl":31,"./settings":35}],27:[function(require,module,exports){
'use strict';

/**
 * Закрывает фигуру.
 * @private
 * @method closeShape
 * @param  {v6.AbstractRenderer} renderer Рендерер.
 * @return {void}                         Ничего не возвращает.
 */
function closeShape ( renderer )
{
  if ( ! renderer._closedShape ) {
    renderer._closedShape = renderer._vertices.slice();
    renderer._closedShape.push( renderer._closedShape[ 0 ] );
  }
}

module.exports = closeShape;

},{}],28:[function(require,module,exports){
'use strict';

/**
 * Копирует drawing settings (_lineWidth, _rectAlignX, и т.д.) из `source` в `target`.
 * @private
 * @method copyDrawingSettings
 * @param  {object}  target Может быть `AbstractRenderer` или простым объектом с сохраненными через
 *                          эту функцию настройками.
 * @param  {object}  source Описание то же, что и для `target`.
 * @param  {boolean} [deep] Если `true`, то будет также копировать _fillColor, _strokeColor и т.д.
 * @return {object}         Возвращает `target`.
 */
function copyDrawingSettings ( target, source, deep )
{
  if ( deep ) {
    target._fillColor[ 0 ]   = source._fillColor[ 0 ];
    target._fillColor[ 1 ]   = source._fillColor[ 1 ];
    target._fillColor[ 2 ]   = source._fillColor[ 2 ];
    target._fillColor[ 3 ]   = source._fillColor[ 3 ];
    target._strokeColor[ 0 ] = source._strokeColor[ 0 ];
    target._strokeColor[ 1 ] = source._strokeColor[ 1 ];
    target._strokeColor[ 2 ] = source._strokeColor[ 2 ];
    target._strokeColor[ 3 ] = source._strokeColor[ 3 ];
  }

  target._backgroundPositionX = source._backgroundPositionX;
  target._backgroundPositionY = source._backgroundPositionY;
  target._rectAlignX          = source._rectAlignX;
  target._rectAlignY          = source._rectAlignY;
  target._lineWidth           = source._lineWidth;
  target._doStroke            = source._doStroke;
  target._doFill              = source._doFill;

  return target;
}

module.exports = copyDrawingSettings;

},{}],29:[function(require,module,exports){
'use strict';

var constants = require( '../../constants' );

var defaultDrawingSettings = {
  _backgroundPositionX: constants.get( 'LEFT' ),
  _backgroundPositionY: constants.get( 'TOP' ),
  _rectAlignX:          constants.get( 'LEFT' ),
  _rectAlignY:          constants.get( 'TOP' ),
  _lineWidth:           2,
  _doStroke:            true,
  _doFill:              true
};

module.exports = defaultDrawingSettings;

},{"../../constants":10}],30:[function(require,module,exports){
'use strict';

var once      = require( 'peako/once' );

var constants = require( '../../constants' );

// "platform" not included using <script /> tag.
if ( typeof platform === 'undefined' ) { // eslint-disable-line no-use-before-define
  var platform; // eslint-disable-line vars-on-top

  try {
    platform = require( 'platform' ); // eslint-disable-line global-require
  } catch ( error ) {
    // "platform" not installed using NPM.
  }
}

function getRendererType ()
{
  var safari, touchable;

  if ( platform ) {
    safari = platform.os &&
      platform.os.family === 'iOS' &&
      platform.name === 'Safari';
  }

  if ( typeof window !== 'undefined' ) {
    touchable = 'ontouchend' in window;
  }

  if ( touchable && ! safari ) {
    return constants.get( 'GL' );
  }

  return constants.get( '2D' );
}

module.exports = once( getRendererType );

},{"../../constants":10,"peako/once":89,"platform":"platform"}],31:[function(require,module,exports){
'use strict';

var once = require( 'peako/once' );

/**
 * Возвращает имя поддерживаемого WebGL контекста, например: 'experimental-webgl'.
 * @private
 * @method getWebGL
 * @return {string?} В случае неудачи (WebGL не поддерживается) - вернет `null`.
 */
function getWebGL ()
{
  var canvas = document.createElement( 'canvas' );
  var name   = null;

  if ( canvas.getContext( 'webgl' ) ) {
    name = 'webgl';
  } else if ( canvas.getContext( 'experimental-webgl' ) ) {
    name = 'experimental-webgl';
  }

  // Fixing possible memory leak.
  canvas = null;
  return name;
}

module.exports = once( getWebGL );

},{"peako/once":89}],32:[function(require,module,exports){
/* eslint lines-around-directive: off */
/* eslint lines-around-comment: off */
'use strict';
var constants = require( '../../constants' );
/**
 * @private
 * @method processRectAlignX
 * @param  {v6.AbstractRenderer} renderer
 * @param  {number}              x
 * @param  {number}              w
 * @return {number}
 */
exports.processRectAlignX = function processRectAlignX ( renderer, x, w ) { if ( renderer._rectAlignX === constants.get( "CENTER" ) ) { x -= w * 0.5; } else if ( renderer._rectAlignX === constants.get( "RIGHT" ) ) { x -= w; } else if ( renderer._rectAlignX !== constants.get( "LEFT" ) ) { throw Error( 'Unknown " +' + "rectAlignX" + '": ' + renderer._rectAlignX ); } return Math.floor( x ); }; // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
/**
 * @private
 * @method processRectAlignY
 * @param  {v6.AbstractRenderer} renderer
 * @param  {number}              y
 * @param  {number}              h
 * @return {number}
 */
exports.processRectAlignY = function processRectAlignY ( renderer, x, w ) { if ( renderer._rectAlignY === constants.get( "MIDDLE" ) ) { x -= w * 0.5; } else if ( renderer._rectAlignY === constants.get( "BOTTOM" ) ) { x -= w; } else if ( renderer._rectAlignY !== constants.get( "TOP" ) ) { throw Error( 'Unknown " +' + "rectAlignY" + '": ' + renderer._rectAlignY ); } return Math.floor( x ); }; // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len

},{"../../constants":10}],33:[function(require,module,exports){
'use strict';

var GL = require( '../../constants' ).get( 'GL' );

/**
 * Обрабатывает фигуру.
 * @private
 * @method processShape
 * @param  {v6.AbstractRenderer} renderer Рендерер.
 * @param  {Array|Float32Array}  vertices Вершины.
 * @return {Array|Float32Array}           Обработанные вершины.
 */
function processShape ( renderer, vertices )
{
  if ( renderer.type === GL && typeof Float32Array === 'function' && ! ( vertices instanceof Float32Array ) ) { // eslint-disable-line no-undef
    vertices = new Float32Array( vertices );                                                                    // eslint-disable-line no-undef
  }

  return vertices;
}

module.exports = processShape;

},{"../../constants":10}],34:[function(require,module,exports){
'use strict';

var defaultDrawingSettings = require( './default_drawing_settings' );
var copyDrawingSettings    = require( './copy_drawing_settings' );

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
function setDefaultDrawingSettings ( target, renderer )
{

  copyDrawingSettings( target, defaultDrawingSettings );

  target._strokeColor = new renderer.settings.color();
  target._fillColor   = new renderer.settings.color();

  return target;

}

module.exports = setDefaultDrawingSettings;

},{"./copy_drawing_settings":28,"./default_drawing_settings":29}],35:[function(require,module,exports){
'use strict';

var color = require( '../color/RGBA' );
var type  = require( '../constants' ).get( '2D' );

/**
 * Настройки для рендереров: {@link v6.Renderer2D}, {@link v6.RendererGL}, {@link v6.AbstractRenderer}, {@link v6.createRenderer}.
 * @namespace v6.settings.renderer
 */

/**
 * @member   {object} [v6.settings.renderer.settings] Настройки рендерера по умолчанию.
 * @property {object} [color={@link v6.RGBA}]         Конструкторы {@link v6.RGBA} или {@link v6.HSLA}.
 * @property {number} [scale=1]                       Плотность пикселей рендерера, например: `devicePixelRatio`.
 */
exports.settings = {
  color: color,
  scale: 1
};

/**
 * Пока не сделано.
 * @member {boolean} [v6.settings.renderer.antialias=true]
 */
exports.antialias = true;

/**
 * Пока не сделано.
 * @member {boolean} [v6.settings.renderer.blending=true]
 */
exports.blending = true;

/**
 * Использовать градусы вместо радианов.
 * @member {boolean} [v6.settings.renderer.degrees=false]
 */
exports.degrees = false;

/**
 * Использовать прозрачный (вместо черного) контекст.
 * @member {boolean} [v6.settings.renderer.alpha=true]
 */
exports.alpha = true;

/**
 * Тип контекста (2D, GL, AUTO).
 * @member {constant} [v6.settings.renderer.type=2D]
 */
exports.type = type;

/**
 * В этот элемент будет добавлен `canvas`.
 * @member {Element?} [v6.settings.renderer.appendTo]
 */

},{"../color/RGBA":7,"../constants":10}],36:[function(require,module,exports){
'use strict';

/**
 * @member v6.shapes.drawLines
 * @example
 * shapes.drawLines( renderer, vertices );
 */
function drawLines ()
{
  throw Error( 'Not implemented' );
}

module.exports = drawLines;

},{}],37:[function(require,module,exports){
'use strict';

/**
 * @member v6.shapes.drawPoints
 * @example
 * shapes.drawPoints( renderer, vertices );
 */
function drawPoints ()
{
  throw Error( 'Not implemented' );
}

module.exports = drawPoints;

},{}],38:[function(require,module,exports){
'use strict';

/**
 * Главные настройки "v6.js".
 * @namespace v6.settings.core
 */

/**
 * Использовать градусы вместо радианов.
 * @member {boolean} v6.settings.core.degrees
 */
exports.degress = false;

},{}],39:[function(require,module,exports){
'use strict';

/**
 * @interface IShaderSources
 * @property {string} vert Исходник вершинного (vertex) шейдера.
 * @property {string} frag Исходник фрагментного (fragment) шейдера.
 */

/**
 * WebGL шейдеры.
 * @member {object} v6.shaders
 * @property {IShaderSources} basic      Стандартные шейдеры.
 * @property {IShaderSources} background Шейдеры для отрисовки фона.
 */
var shaders = {
  basic: {
    vert: 'precision mediump float;attribute vec2 apos;uniform vec2 ures;uniform mat3 utransform;void main(){gl_Position=vec4(((utransform*vec3(apos,1.0)).xy/ures*2.0-1.0)*vec2(1,-1),0,1);}',
    frag: 'precision mediump float;uniform vec4 ucolor;void main(){gl_FragColor=vec4(ucolor.rgb/255.0,ucolor.a);}'
  },

  background: {
    vert: 'precision mediump float;attribute vec2 apos;void main(){gl_Position = vec4(apos,0,1);}',
    frag: 'precision mediump float;uniform vec4 ucolor;void main(){gl_FragColor=ucolor;}'
  }
};

module.exports = shaders;

},{}],40:[function(require,module,exports){
/*!
 * Copyright (c) 2017-2018 Vladislav Tikhiy (SILENT)
 * Released under the GPL-3.0 license.
 * https://github.com/tikhiy/v6.js/tree/dev/
 */

'use strict';

/**
 * @namespace v6
 */

exports.AbstractImage    = require( './core/image/AbstractImage' );
exports.AbstractRenderer = require( './core/renderer/AbstractRenderer' );
exports.AbstractVector   = require( './core/math/AbstractVector' );
exports.Camera           = require( './core/camera/Camera' );
exports.CompoundedImage  = require( './core/image/CompoundedImage' );
exports.HSLA             = require( './core/color/HSLA' );
exports.Image            = require( './core/image/Image' );
exports.RGBA             = require( './core/color/RGBA' );
exports.Renderer2D       = require( './core/renderer/Renderer2D' );
exports.RendererGL       = require( './core/renderer/RendererGL' );
exports.ShaderProgram    = require( './core/ShaderProgram' );
exports.Ticker           = require( './core/Ticker' );
exports.Transform        = require( './core/Transform' );
exports.Vector2D         = require( './core/math/Vector2D' );
exports.Vector3D         = require( './core/math/Vector3D' );
exports.constants        = require( './core/constants' );
exports.createRenderer   = require( './core/renderer/create_renderer' );
exports.shaders          = require( './core/shaders' );
exports.mat3             = require( './core/math/mat3' );

/**
 * "v6.js" built-in drawing functions.
 * @namespace v6.shapes
 * @see v6.AbstractRenderer#beginShape
 * @see v6.AbstractRenderer#vertex
 * @see v6.AbstractRenderer#endShape
 * @example
 * var shapes = require( 'v6.js/core/renderer/shapes' );
 * @example
 * renderer.beginShape( {
 *   drawFunction: shapes.drawPoints
 * } );
 */
exports.shapes = {
  drawPoints: require( './core/renderer/shapes/draw_points' ),
  drawLines:  require( './core/renderer/shapes/draw_lines' )
};

/**
 * Настройки "v6.js".
 * @namespace v6.settings
 * @example <caption>Core Settings</caption>
 * var settings = require( 'v6.js/core/settings' );
 * settings.degrees = true;
 * @example <caption>Renderer Settings</caption>
 * // Default renderer settings.
 * var settings = require( 'v6.js/core/renderer/settings' );
 * settings.degrees = true;
 */
exports.settings = {
  renderer: require( './core/renderer/settings' ),
  camera:   require( './core/camera/settings' ),
  core:     require( './core/settings' )
};

if ( typeof self !== 'undefined' ) {
  self.v6 = exports;
}

/**
 * @typedef {string|v6.HSLA|v6.RGBA} TColor
 * @example <caption>A string (CSS color).</caption>
 * var color = 'rgba( 255, 0, 255, 1 )';
 * var color = 'hsl( 360, 100%, 50% )';
 * var color = '#ff00ff';
 * var color = 'lightpink';
 * // "rgba(0, 0, 0, 0)"
 * var color = getComputedStyle( document.body ).getPropertyValue( 'background-color' );
 * // The same as "transparent".
 * // NOTE: CSS does not support this syntax but "v6.js" does.
 * var color = '#00000000';
 * @example <caption>An object (v6.RGBA, v6.HSLA)</caption>
 * var color = new RGBA( 255, 0, 255, 1 );
 * var color = new HSLA( 360, 100, 50 );
 */

/**
 * @typedef {number} constant
 * @see v6.constants
 * @example
 * // This is a constant.
 * var RENDERER_TYPE = constants.get( 'GL' );
 */

/**
 * @interface IVector2D
 * @property {number} x
 * @property {number} y
 */

},{"./core/ShaderProgram":1,"./core/Ticker":2,"./core/Transform":3,"./core/camera/Camera":4,"./core/camera/settings":5,"./core/color/HSLA":6,"./core/color/RGBA":7,"./core/constants":10,"./core/image/AbstractImage":11,"./core/image/CompoundedImage":12,"./core/image/Image":13,"./core/math/AbstractVector":19,"./core/math/Vector2D":20,"./core/math/Vector3D":21,"./core/math/mat3":22,"./core/renderer/AbstractRenderer":23,"./core/renderer/Renderer2D":24,"./core/renderer/RendererGL":25,"./core/renderer/create_renderer":26,"./core/renderer/settings":35,"./core/renderer/shapes/draw_lines":36,"./core/renderer/shapes/draw_points":37,"./core/settings":38,"./core/shaders":39}],41:[function(require,module,exports){
'use strict';

/**
 * A lightweight implementation of Node.js EventEmitter.
 * @constructor LightEmitter
 * @example
 * var LightEmitter = require( 'light_emitter' );
 */
function LightEmitter () {}

LightEmitter.prototype = {
  /**
   * @method LightEmitter#emit
   * @param {string} type
   * @param {...any} [data]
   * @chainable
   */
  emit: function emit ( type ) {
    var list = _getList( this, type );
    var data, i, l;

    if ( ! list ) {
      return this;
    }

    if ( arguments.length > 1 ) {
      data = [].slice.call( arguments, 1 );
    }

    for ( i = 0, l = list.length; i < l; ++i ) {
      if ( ! list[ i ].active ) {
        continue;
      }

      if ( list[ i ].once ) {
        list[ i ].active = false;
      }

      if ( data ) {
        list[ i ].listener.apply( this, data );
      } else {
        list[ i ].listener.call( this );
      }
    }

    return this;
  },

  /**
   * @method LightEmitter#off
   * @param {string}   [type]
   * @param {function} [listener]
   * @chainable
   */
  off: function off ( type, listener ) {
    var list, i;

    if ( ! type ) {
      this._events = null;
    } else if ( ( list = _getList( this, type ) ) ) {
      if ( listener ) {
        for ( i = list.length - 1; i >= 0; --i ) {
          if ( list[ i ].listener === listener && list[ i ].active ) {
            list[ i ].active = false;
          }
        }
      } else {
        list.length = 0;
      }
    }

    return this;
  },

  /**
   * @method LightEmitter#on
   * @param {string}   type
   * @param {function} listener
   * @chainable
   */
  on: function on ( type, listener ) {
    _on( this, type, listener );
    return this;
  },

  /**
   * @method LightEmitter#once
   * @param {string}   type
   * @param {function} listener
   * @chainable
   */
  once: function once ( type, listener ) {
    _on( this, type, listener, true );
    return this;
  },

  constructor: LightEmitter
};

/**
 * @private
 * @method _on
 * @param  {LightEmitter} self
 * @param  {string}       type
 * @param  {function}     listener
 * @param  {boolean}      once
 * @return {void}
 */
function _on ( self, type, listener, once ) {
  var entity = {
    listener: listener,
    active:   true,
    type:     type,
    once:     once
  };

  if ( ! self._events ) {
    self._events = Object.create( null );
  }

  if ( ! self._events[ type ] ) {
    self._events[ type ] = [];
  }

  self._events[ type ].push( entity );
}

/**
 * @private
 * @method _getList
 * @param  {LightEmitter}   self
 * @param  {string}         type
 * @return {array<object>?}
 */
function _getList ( self, type ) {
  return self._events && self._events[ type ];
}

module.exports = LightEmitter;

},{}],42:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString;

module.exports = function _throwArgumentException ( unexpected, expected ) {
  throw Error( '"' + toString.call( unexpected ) + '" is not ' + expected );
};

},{}],43:[function(require,module,exports){
'use strict';

var type = require( './type' );
var lastRes = 'undefined';
var lastVal;

module.exports = function _type ( val ) {
  if ( val === lastVal ) {
    return lastRes;
  }

  return ( lastRes = type( lastVal = val ) );
};

},{"./type":98}],44:[function(require,module,exports){
'use strict';

module.exports = function _unescape ( string ) {
  return string.replace( /\\(\\)?/g, '$1' );
};

},{}],45:[function(require,module,exports){
'use strict';

var isset = require( '../isset' );

var undefined; // jshint ignore: line

var defineGetter = Object.prototype.__defineGetter__,
    defineSetter = Object.prototype.__defineSetter__;

function baseDefineProperty ( object, key, descriptor ) {
  var hasGetter = isset( 'get', descriptor ),
      hasSetter = isset( 'set', descriptor ),
      get, set;

  if ( hasGetter || hasSetter ) {
    if ( hasGetter && typeof ( get = descriptor.get ) !== 'function' ) {
      throw TypeError( 'Getter must be a function: ' + get );
    }

    if ( hasSetter && typeof ( set = descriptor.set ) !== 'function' ) {
      throw TypeError( 'Setter must be a function: ' + set );
    }

    if ( isset( 'writable', descriptor ) ) {
      throw TypeError( 'Invalid property descriptor. Cannot both specify accessors and a value or writable attribute' );
    }

    if ( defineGetter ) {
      if ( hasGetter ) {
        defineGetter.call( object, key, get );
      }

      if ( hasSetter ) {
        defineSetter.call( object, key, set );
      }
    } else {
      throw Error( 'Cannot define getter or setter' );
    }
  } else if ( isset( 'value', descriptor ) ) {
    object[ key ] = descriptor.value;
  } else if ( ! isset( key, object ) ) {
    object[ key ] = undefined;
  }

  return object;
}

module.exports = baseDefineProperty;

},{"../isset":82}],46:[function(require,module,exports){
'use strict';

module.exports = function baseExec ( regexp, string ) {
  var result = [],
      value;

  regexp.lastIndex = 0;

  while ( ( value = regexp.exec( string ) ) ) {
    result.push( value );
  }

  return result;
};

},{}],47:[function(require,module,exports){
'use strict';

var callIteratee = require( '../call-iteratee' ),
    isset        = require( '../isset' );

module.exports = function baseForEach ( arr, fn, ctx, fromRight ) {
  var i, j, idx;

  for ( i = -1, j = arr.length - 1; j >= 0; --j ) {
    if ( fromRight ) {
      idx = j;
    } else {
      idx = ++i;
    }

    if ( isset( idx, arr ) && callIteratee( fn, ctx, arr[ idx ], idx, arr ) === false ) {
      break;
    }
  }

  return arr;
};

},{"../call-iteratee":55,"../isset":82}],48:[function(require,module,exports){
'use strict';

var callIteratee = require( '../call-iteratee' );

module.exports = function baseForIn ( obj, fn, ctx, fromRight, keys ) {
  var i, j, key;

  for ( i = -1, j = keys.length - 1; j >= 0; --j ) {
    if ( fromRight ) {
      key = keys[ j ];
    } else {
      key = keys[ ++i ];
    }

    if ( callIteratee( fn, ctx, obj[ key ], key, obj ) === false ) {
      break;
    }
  }

  return obj;
};

},{"../call-iteratee":55}],49:[function(require,module,exports){
'use strict';

var isset = require( '../isset' );

module.exports = function baseGet ( obj, path, off ) {
  var l = path.length - off,
      i = 0,
      key;

  for ( ; i < l; ++i ) {
    key = path[ i ];

    if ( isset( key, obj ) ) {
      obj = obj[ key ];
    } else {
      return;
    }
  }

  return obj;
};

},{"../isset":82}],50:[function(require,module,exports){
'use strict';

var baseToIndex = require( './base-to-index' );

var indexOf     = Array.prototype.indexOf,
    lastIndexOf = Array.prototype.lastIndexOf;

function baseIndexOf ( arr, search, fromIndex, fromRight ) {
  var l, i, j, idx, val;

  // use the native function if it is supported and the search is not nan.

  if ( search === search && ( idx = fromRight ? lastIndexOf : indexOf ) ) {
    return idx.call( arr, search, fromIndex );
  }

  l = arr.length;

  if ( ! l ) {
    return -1;
  }

  j = l - 1;

  if ( typeof fromIndex !== 'undefined' ) {
    fromIndex = baseToIndex( fromIndex, l );

    if ( fromRight ) {
      j = Math.min( j, fromIndex );
    } else {
      j = Math.max( 0, fromIndex );
    }

    i = j - 1;
  } else {
    i = -1;
  }

  for ( ; j >= 0; --j ) {
    if ( fromRight ) {
      idx = j;
    } else {
      idx = ++i;
    }

    val = arr[ idx ];

    if ( val === search || search !== search && val !== val ) {
      return idx;
    }
  }

  return -1;
}

module.exports = baseIndexOf;

},{"./base-to-index":53}],51:[function(require,module,exports){
'use strict';

var baseIndexOf = require( './base-index-of' );

var support = require( '../support/support-keys' );

var hasOwnProperty = Object.prototype.hasOwnProperty;

var k, fixKeys;

if ( support === 'not-supported' ) {
  k = [
    'toString',
    'toLocaleString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'constructor'
  ];

  fixKeys = function fixKeys ( keys, object ) {
    var i, key;

    for ( i = k.length - 1; i >= 0; --i ) {
      if ( baseIndexOf( keys, key = k[ i ] ) < 0 && hasOwnProperty.call( object, key ) ) {
        keys.push( key );
      }
    }

    return keys;
  };
}

module.exports = function baseKeys ( object ) {
  var keys = [];

  var key;

  for ( key in object ) {
    if ( hasOwnProperty.call( object, key ) ) {
      keys.push( key );
    }
  }

  if ( support !== 'not-supported' ) {
    return keys;
  }

  return fixKeys( keys, object );
};

},{"../support/support-keys":93,"./base-index-of":50}],52:[function(require,module,exports){
'use strict';

var get = require( './base-get' );

module.exports = function baseProperty ( object, path ) {
  if ( object != null ) {
    if ( path.length > 1 ) {
      return get( object, path, 0 );
    }

    return object[ path[ 0 ] ];
  }
};

},{"./base-get":49}],53:[function(require,module,exports){
'use strict';

module.exports = function baseToIndex ( v, l ) {
  if ( ! l || ! v ) {
    return 0;
  }

  if ( v < 0 ) {
    v += l;
  }

  return v || 0;
};

},{}],54:[function(require,module,exports){
'use strict';

var _throwArgumentException = require( './_throw-argument-exception' );
var defaultTo = require( './default-to' );

module.exports = function before ( n, fn ) {
  var value;

  if ( typeof fn !== 'function' ) {
    _throwArgumentException( fn, 'a function' );
  }

  n = defaultTo( n, 1 );

  return function () {
    if ( --n >= 0 ) {
      value = fn.apply( this, arguments );
    }

    return value;
  };
};

},{"./_throw-argument-exception":42,"./default-to":64}],55:[function(require,module,exports){
'use strict';

module.exports = function callIteratee ( fn, ctx, val, key, obj ) {
  if ( typeof ctx === 'undefined' ) {
    return fn( val, key, obj );
  }

  return fn.call( ctx, val, key, obj );
};

},{}],56:[function(require,module,exports){
'use strict';

var baseExec  = require( './base/base-exec' ),
    _unescape = require( './_unescape' ),
    isKey     = require( './is-key' ),
    toKey     = require( './to-key' ),
    _type     = require( './_type' );

var rProperty = /(^|\.)\s*([_a-z]\w*)\s*|\[\s*((?:-)?(?:\d+|\d*\.\d+)|("|')(([^\\]\\(\\\\)*|[^\4])*)\4)\s*\]/gi;

function stringToPath ( str ) {
  var path = baseExec( rProperty, str ),
      i = path.length - 1,
      val;

  for ( ; i >= 0; --i ) {
    val = path[ i ];

    // .name
    if ( val[ 2 ] ) {
      path[ i ] = val[ 2 ];
    // [ "" ] || [ '' ]
    } else if ( val[ 5 ] != null ) {
      path[ i ] = _unescape( val[ 5 ] );
    // [ 0 ]
    } else {
      path[ i ] = val[ 3 ];
    }
  }

  return path;
}

function castPath ( val ) {
  var path, l, i;

  if ( isKey( val ) ) {
    return [ toKey( val ) ];
  }

  if ( _type( val ) === 'array' ) {
    path = Array( l = val.length );

    for ( i = l - 1; i >= 0; --i ) {
      path[ i ] = toKey( val[ i ] );
    }
  } else {
    path = stringToPath( '' + val );
  }

  return path;
}

module.exports = castPath;

},{"./_type":43,"./_unescape":44,"./base/base-exec":46,"./is-key":74,"./to-key":96}],57:[function(require,module,exports){
'use strict';

module.exports = function clamp ( value, lower, upper ) {
  if ( value >= upper ) {
    return upper;
  }

  if ( value <= lower ) {
    return lower;
  }

  return value;
};

},{}],58:[function(require,module,exports){
'use strict';

var create         = require( './create' ),
    getPrototypeOf = require( './get-prototype-of' ),
    toObject       = require( './to-object' ),
    each           = require( './each' ),
    isObjectLike   = require( './is-object-like' );

module.exports = function clone ( deep, target, guard ) {
  var cln;

  if ( typeof target === 'undefined' || guard ) {
    target = deep;
    deep = true;
  }

  cln = create( getPrototypeOf( target = toObject( target ) ) );

  each( target, function ( value, key, target ) {
    if ( value === target ) {
      this[ key ] = this;
    } else if ( deep && isObjectLike( value ) ) {
      this[ key ] = clone( deep, value );
    } else {
      this[ key ] = value;
    }
  }, cln );

  return cln;
};

},{"./create":60,"./each":67,"./get-prototype-of":70,"./is-object-like":76,"./to-object":97}],59:[function(require,module,exports){
'use strict';

module.exports = {
  ERR: {
    INVALID_ARGS:          'Invalid arguments',
    FUNCTION_EXPECTED:     'Expected a function',
    STRING_EXPECTED:       'Expected a string',
    UNDEFINED_OR_NULL:     'Cannot convert undefined or null to object',
    REDUCE_OF_EMPTY_ARRAY: 'Reduce of empty array with no initial value',
    NO_PATH:               'No path was given'
  },

  MAX_ARRAY_LENGTH: 4294967295,
  MAX_SAFE_INT:     9007199254740991,
  MIN_SAFE_INT:    -9007199254740991,

  DEEP:         1,
  DEEP_KEEP_FN: 2,

  PLACEHOLDER: {}
};

},{}],60:[function(require,module,exports){
'use strict';

var defineProperties = require( './define-properties' );

var setPrototypeOf = require( './set-prototype-of' );

var isPrimitive = require( './is-primitive' );

function C () {}

module.exports = Object.create || function create ( prototype, descriptors ) {
  var object;

  if ( prototype !== null && isPrimitive( prototype ) ) {
    throw TypeError( 'Object prototype may only be an Object or null: ' + prototype );
  }

  C.prototype = prototype;

  object = new C();

  C.prototype = null;

  if ( prototype === null ) {
    setPrototypeOf( object, null );
  }

  if ( arguments.length >= 2 ) {
    defineProperties( object, descriptors );
  }

  return object;
};

},{"./define-properties":66,"./is-primitive":79,"./set-prototype-of":91}],61:[function(require,module,exports){
'use strict';

var baseForEach  = require( '../base/base-for-each' ),
    baseForIn    = require( '../base/base-for-in' ),
    isArrayLike  = require( '../is-array-like' ),
    toObject     = require( '../to-object' ),
    iteratee     = require( '../iteratee' ).iteratee,
    keys         = require( '../keys' );

module.exports = function createEach ( fromRight ) {
  return function each ( obj, fn, ctx ) {

    obj = toObject( obj );

    fn  = iteratee( fn );

    if ( isArrayLike( obj ) ) {
      return baseForEach( obj, fn, ctx, fromRight );
    }

    return baseForIn( obj, fn, ctx, fromRight, keys( obj ) );

  };
};

},{"../base/base-for-each":47,"../base/base-for-in":48,"../is-array-like":72,"../iteratee":83,"../keys":84,"../to-object":97}],62:[function(require,module,exports){
'use strict';

/**
 * @param {string} name Must be 'Width' or 'Height' (capitalized).
 */
module.exports = function createGetElementDimension ( name ) {

  /**
   * @param {Window|Node} e
   */
  return function ( e ) {

    var v, b, d;

    // if the element is a window

    if ( e.window === e ) {

      // innerWidth and innerHeight includes a scrollbar width, but it is not
      // supported by older browsers

      v = Math.max( e[ 'inner' + name ] || 0, e.document.documentElement[ 'client' + name ] );

    // if the elements is a document

    } else if ( e.nodeType === 9 ) {

      b = e.body;
      d = e.documentElement;

      v = Math.max(
        b[ 'scroll' + name ],
        d[ 'scroll' + name ],
        b[ 'offset' + name ],
        d[ 'offset' + name ],
        b[ 'client' + name ],
        d[ 'client' + name ] );

    } else {
      v = e[ 'client' + name ];
    }

    return v;

  };
};

},{}],63:[function(require,module,exports){
'use strict';

var castPath = require( '../cast-path' ),
    noop     = require( '../noop' );

module.exports = function createProperty ( baseProperty, useArgs ) {
  return function ( path ) {
    var args;

    if ( ! ( path = castPath( path ) ).length ) {
      return noop;
    }

    if ( useArgs ) {
      args = Array.prototype.slice.call( arguments, 1 );
    }

    return function ( object ) {
      return baseProperty( object, path, args );
    };
  };
};

},{"../cast-path":56,"../noop":87}],64:[function(require,module,exports){
'use strict';

module.exports = function defaultTo ( value, defaultValue ) {
  if ( value != null && value === value ) {
    return value;
  }

  return defaultValue;
};

},{}],65:[function(require,module,exports){
'use strict';

var mixin = require( './mixin' ),
    clone = require( './clone' );

module.exports = function defaults ( defaults, object ) {
  if ( object == null ) {
    return clone( true, defaults );
  }

  return mixin( true, clone( true, defaults ), object );
};

},{"./clone":58,"./mixin":86}],66:[function(require,module,exports){
'use strict';

var support = require( './support/support-define-property' );

var defineProperties, baseDefineProperty, isPrimitive, each;

if ( support !== 'full' ) {
  isPrimitive        = require( './is-primitive' );
  each               = require( './each' );
  baseDefineProperty = require( './base/base-define-property' );

  defineProperties = function defineProperties ( object, descriptors ) {
    if ( support !== 'not-supported' ) {
      try {
        return Object.defineProperties( object, descriptors );
      } catch ( e ) {}
    }

    if ( isPrimitive( object ) ) {
      throw TypeError( 'defineProperties called on non-object' );
    }

    if ( isPrimitive( descriptors ) ) {
      throw TypeError( 'Property description must be an object: ' + descriptors );
    }

    each( descriptors, function ( descriptor, key ) {
      if ( isPrimitive( descriptor ) ) {
        throw TypeError( 'Property description must be an object: ' + descriptor );
      }

      baseDefineProperty( this, key, descriptor );
    }, object );

    return object;
  };
} else {
  defineProperties = Object.defineProperties;
}

module.exports = defineProperties;

},{"./base/base-define-property":45,"./each":67,"./is-primitive":79,"./support/support-define-property":92}],67:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-each' )();

},{"./create/create-each":61}],68:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-get-element-dimension' )( 'Height' );

},{"./create/create-get-element-dimension":62}],69:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-get-element-dimension' )( 'Width' );

},{"./create/create-get-element-dimension":62}],70:[function(require,module,exports){
'use strict';

var ERR = require( './constants' ).ERR;

var toString = Object.prototype.toString;

module.exports = Object.getPrototypeOf || function getPrototypeOf ( obj ) {
  var prototype;

  if ( obj == null ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  prototype = obj.__proto__; // jshint ignore: line

  if ( typeof prototype !== 'undefined' ) {
    return prototype;
  }

  if ( toString.call( obj.constructor ) === '[object Function]' ) {
    return obj.constructor.prototype;
  }

  return obj;
};

},{"./constants":59}],71:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' ),
    isLength     = require( './is-length' ),
    isWindowLike = require( './is-window-like' );

module.exports = function isArrayLikeObject ( value ) {
  return isObjectLike( value ) && isLength( value.length ) && ! isWindowLike( value );
};

},{"./is-length":75,"./is-object-like":76,"./is-window-like":81}],72:[function(require,module,exports){
'use strict';

var isLength     = require( './is-length' ),
    isWindowLike = require( './is-window-like' );

module.exports = function isArrayLike ( value ) {
  if ( value == null ) {
    return false;
  }

  if ( typeof value === 'object' ) {
    return isLength( value.length ) && !isWindowLike( value );
  }

  return typeof value === 'string';
};

},{"./is-length":75,"./is-window-like":81}],73:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' ),
    isLength = require( './is-length' );

var toString = {}.toString;

module.exports = Array.isArray || function isArray ( value ) {
  return isObjectLike( value ) &&
    isLength( value.length ) &&
    toString.call( value ) === '[object Array]';
};

},{"./is-length":75,"./is-object-like":76}],74:[function(require,module,exports){
'use strict';

var _type    = require( './_type' );

var rDeepKey = /(^|[^\\])(\\\\)*(\.|\[)/;

function isKey ( val ) {
  var type;

  if ( ! val ) {
    return true;
  }

  if ( _type( val ) === 'array' ) {
    return false;
  }

  type = typeof val;

  if ( type === 'number' || type === 'boolean' || _type( val ) === 'symbol' ) {
    return true;
  }

  return ! rDeepKey.test( val );
}

module.exports = isKey;

},{"./_type":43}],75:[function(require,module,exports){
'use strict';

var MAX_ARRAY_LENGTH = require( './constants' ).MAX_ARRAY_LENGTH;

module.exports = function isLength ( value ) {
  return typeof value === 'number' &&
    value >= 0 &&
    value <= MAX_ARRAY_LENGTH &&
    value % 1 === 0;
};

},{"./constants":59}],76:[function(require,module,exports){
'use strict';

module.exports = function isObjectLike ( value ) {
  return !! value && typeof value === 'object';
};

},{}],77:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );

var toString = {}.toString;

module.exports = function isObject ( value ) {
  return isObjectLike( value ) &&
    toString.call( value ) === '[object Object]';
};

},{"./is-object-like":76}],78:[function(require,module,exports){
'use strict';

var getPrototypeOf = require( './get-prototype-of' );

var isObject = require( './is-object' );

var hasOwnProperty = Object.prototype.hasOwnProperty;

var toString = Function.prototype.toString;

var OBJECT = toString.call( Object );

module.exports = function isPlainObject ( v ) {
  var p, c;

  if ( ! isObject( v ) ) {
    return false;
  }

  p = getPrototypeOf( v );

  if ( p === null ) {
    return true;
  }

  if ( ! hasOwnProperty.call( p, 'constructor' ) ) {
    return false;
  }

  c = p.constructor;

  return typeof c === 'function' && toString.call( c ) === OBJECT;
};

},{"./get-prototype-of":70,"./is-object":77}],79:[function(require,module,exports){
'use strict';

module.exports = function isPrimitive ( value ) {
  return ! value ||
    typeof value !== 'object' &&
    typeof value !== 'function';
};

},{}],80:[function(require,module,exports){
'use strict';

var type = require( './type' );

module.exports = function isSymbol ( value ) {
  return type( value ) === 'symbol';
};

},{"./type":98}],81:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );

module.exports = function isWindowLike ( value ) {
  return isObjectLike( value ) && value.window === value;
};

},{"./is-object-like":76}],82:[function(require,module,exports){
'use strict';

module.exports = function isset ( key, obj ) {
  if ( obj == null ) {
    return false;
  }

  return typeof obj[ key ] !== 'undefined' || key in obj;
};

},{}],83:[function(require,module,exports){
'use strict';

var isArrayLikeObject = require( './is-array-like-object' ),
    matchesProperty   = require( './matches-property' ),
    property          = require( './property' );

exports.iteratee = function iteratee ( value ) {
  if ( typeof value === 'function' ) {
    return value;
  }

  if ( isArrayLikeObject( value ) ) {
    return matchesProperty( value );
  }

  return property( value );
};

},{"./is-array-like-object":71,"./matches-property":85,"./property":90}],84:[function(require,module,exports){
'use strict';

var baseKeys = require( './base/base-keys' );
var toObject = require( './to-object' );
var support  = require( './support/support-keys' );

if ( support !== 'es2015' ) {
  module.exports = function keys ( v ) {
    var _keys;

    /**
     * + ---------------------------------------------------------------------- +
     * | I tested the functions with string[2048] (an array of strings) and had |
     * | this results in node.js (v8.10.0):                                     |
     * + ---------------------------------------------------------------------- +
     * | baseKeys x 10,674 ops/sec ±0.23% (94 runs sampled)                     |
     * | Object.keys x 22,147 ops/sec ±0.23% (95 runs sampled)                  |
     * | Fastest is "Object.keys"                                               |
     * + ---------------------------------------------------------------------- +
     */

    if ( support === 'es5' ) {
      _keys = Object.keys;
    } else {
      _keys = baseKeys;
    }

    return _keys( toObject( v ) );
  };
} else {
  module.exports = Object.keys;
}

},{"./base/base-keys":51,"./support/support-keys":93,"./to-object":97}],85:[function(require,module,exports){
'use strict';

var castPath = require( './cast-path' ),
    get      = require( './base/base-get' ),
    ERR      = require( './constants' ).ERR;

module.exports = function matchesProperty ( property ) {

  var path  = castPath( property[ 0 ] ),
      value = property[ 1 ];

  if ( ! path.length ) {
    throw Error( ERR.NO_PATH );
  }

  return function ( object ) {

    if ( object == null ) {
      return false;
    }

    if ( path.length > 1 ) {
      return get( object, path, 0 ) === value;
    }

    return object[ path[ 0 ] ] === value;

  };

};

},{"./base/base-get":49,"./cast-path":56,"./constants":59}],86:[function(require,module,exports){
'use strict';

var isPlainObject = require( './is-plain-object' );

var toObject = require( './to-object' );

var isArray = require( './is-array' );

var keys = require( './keys' );

module.exports = function mixin ( deep, object ) {

  var l = arguments.length;

  var i = 2;


  var names, exp, j, k, val, key, nowArray, src;

  //  mixin( {}, {} )

  if ( typeof deep !== 'boolean' ) {
    object = deep;
    deep   = true;
    i      = 1;
  }

  // var extendable = {
  //   extend: require( 'peako/mixin' )
  // };

  // extendable.extend( { name: 'Extendable Object' } );

  if ( i === l ) {

    object = this; // jshint ignore: line

    --i;

  }

  object = toObject( object );

  for ( ; i < l; ++i ) {
    names = keys( exp = toObject( arguments[ i ] ) );

    for ( j = 0, k = names.length; j < k; ++j ) {
      val = exp[ key = names[ j ] ];

      if ( deep && val !== exp && ( isPlainObject( val ) || ( nowArray = isArray( val ) ) ) ) {
        src = object[ key ];

        if ( nowArray ) {
          if ( ! isArray( src ) ) {
            src = [];
          }

          nowArray = false;
        } else if ( ! isPlainObject( src ) ) {
          src = {};
        }

        object[ key ] = mixin( true, src, val );
      } else {
        object[ key ] = val;
      }
    }

  }

  return object;
};

},{"./is-array":73,"./is-plain-object":78,"./keys":84,"./to-object":97}],87:[function(require,module,exports){
'use strict';

module.exports = function noop () {};

},{}],88:[function(require,module,exports){
'use strict';

module.exports = Date.now || function now () {
  return new Date().getTime();
};

},{}],89:[function(require,module,exports){
'use strict';

var before = require( './before' );

module.exports = function once ( target ) {
  return before( 1, target );
};

},{"./before":54}],90:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-property' )( require( './base/base-property' ) );

},{"./base/base-property":52,"./create/create-property":63}],91:[function(require,module,exports){
'use strict';

var isPrimitive = require( './is-primitive' ),
    ERR         = require( './constants' ).ERR;

module.exports = Object.setPrototypeOf || function setPrototypeOf ( target, prototype ) {
  if ( target == null ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  if ( prototype !== null && isPrimitive( prototype ) ) {
    throw TypeError( 'Object prototype may only be an Object or null: ' + prototype );
  }

  if ( '__proto__' in target ) {
    target.__proto__ = prototype; // jshint ignore: line
  }

  return target;
};

},{"./constants":59,"./is-primitive":79}],92:[function(require,module,exports){
'use strict';

var support;

function test ( target ) {
  try {
    if ( '' in Object.defineProperty( target, '', {} ) ) {
      return true;
    }
  } catch ( e ) {}

  return false;
}

if ( test( {} ) ) {
  support = 'full';
} else if ( typeof document !== 'undefined' && test( document.createElement( 'span' ) ) ) {
  support = 'dom';
} else {
  support = 'not-supported';
}

module.exports = support;

},{}],93:[function(require,module,exports){
'use strict';

var support;

if ( Object.keys ) {
  try {
    support = Object.keys( '' ), 'es2015'; // jshint ignore: line
  } catch ( e ) {
    support = 'es5';
  }
} else if ( { toString: null }.propertyIsEnumerable( 'toString' ) ) {
  support = 'not-supported';
} else {
  support = 'has-a-bug';
}

module.exports = support;

},{}],94:[function(require,module,exports){
/**
 * Based on Erik Möller requestAnimationFrame polyfill:
 *
 * Adapted from https://gist.github.com/paulirish/1579671 which derived from
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 *
 * requestAnimationFrame polyfill by Erik Möller.
 * Fixes from Paul Irish, Tino Zijdel, Andrew Mao, Klemen Slavič, Darius Bacon.
 *
 * MIT license
 */

'use strict';

var timestamp = require( './timestamp' );

var requestAF, cancelAF;

if ( typeof window !== 'undefined' ) {
  cancelAF = window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.mozCancelRequestAnimationFrame;
  requestAF = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame;
}

var noRequestAnimationFrame = ! requestAF || ! cancelAF ||
  typeof navigator !== 'undefined' && /iP(ad|hone|od).*OS\s6/.test( navigator.userAgent );

if ( noRequestAnimationFrame ) {
  var lastRequestTime = 0,
      frameDuration   = 1000 / 60;

  exports.request = function request ( animate ) {
    var now             = timestamp(),
        nextRequestTime = Math.max( lastRequestTime + frameDuration, now );

    return setTimeout( function () {
      lastRequestTime = nextRequestTime;
      animate( now );
    }, nextRequestTime - now );
  };

  exports.cancel = clearTimeout;
} else {
  exports.request = function request ( animate ) {
    return requestAF( animate );
  };

  exports.cancel = function cancel ( id ) {
    return cancelAF( id );
  };
}

},{"./timestamp":95}],95:[function(require,module,exports){
'use strict';

var now = require( './now' );
var navigatorStart;

if ( typeof performance === 'undefined' || ! performance.now ) {
  navigatorStart = now();

  module.exports = function timestamp () {
    return now() - navigatorStart;
  };
} else {
  module.exports = function timestamp () {
    return performance.now();
  };
}

},{"./now":88}],96:[function(require,module,exports){
'use strict';

var _unescape = require( './_unescape' ),
    isSymbol  = require( './is-symbol' );

module.exports = function toKey ( val ) {
  var key;

  if ( typeof val === 'string' ) {
    return _unescape( val );
  }

  if ( isSymbol( val ) ) {
    return val;
  }

  key = '' + val;

  if ( key === '0' && 1 / val === -Infinity ) {
    return '-0';
  }

  return _unescape( key );
};

},{"./_unescape":44,"./is-symbol":80}],97:[function(require,module,exports){
'use strict';

var ERR = require( './constants' ).ERR;

module.exports = function toObject ( value ) {
  if ( value == null ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  return Object( value );
};

},{"./constants":59}],98:[function(require,module,exports){
'use strict';

var create = require( './create' );

var toString = {}.toString,
    types = create( null );

module.exports = function getType ( value ) {
  var type, tag;

  if ( value === null ) {
    return 'null';
  }

  type = typeof value;

  if ( type !== 'object' && type !== 'function' ) {
    return type;
  }

  type = types[ tag = toString.call( value ) ];

  if ( type ) {
    return type;
  }

  return ( types[ tag ] = tag.slice( 8, -1 ).toLowerCase() );
};

},{"./create":60}]},{},[40])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb3JlL1NoYWRlclByb2dyYW0uanMiLCJjb3JlL1RpY2tlci5qcyIsImNvcmUvVHJhbnNmb3JtLmpzIiwiY29yZS9jYW1lcmEvQ2FtZXJhLmpzIiwiY29yZS9jYW1lcmEvc2V0dGluZ3MuanMiLCJjb3JlL2NvbG9yL0hTTEEuanMiLCJjb3JlL2NvbG9yL1JHQkEuanMiLCJjb3JlL2NvbG9yL2ludGVybmFsL2NvbG9ycy5qcyIsImNvcmUvY29sb3IvaW50ZXJuYWwvcGFyc2UuanMiLCJjb3JlL2NvbnN0YW50cy5qcyIsImNvcmUvaW1hZ2UvQWJzdHJhY3RJbWFnZS5qcyIsImNvcmUvaW1hZ2UvQ29tcG91bmRlZEltYWdlLmpzIiwiY29yZS9pbWFnZS9JbWFnZS5qcyIsImNvcmUvaW50ZXJuYWwvY3JlYXRlX3BvbHlnb24uanMiLCJjb3JlL2ludGVybmFsL2NyZWF0ZV9wcm9ncmFtLmpzIiwiY29yZS9pbnRlcm5hbC9jcmVhdGVfc2hhZGVyLmpzIiwiY29yZS9pbnRlcm5hbC9wb2x5Z29ucy5qcyIsImNvcmUvaW50ZXJuYWwvcmVwb3J0LmpzIiwiY29yZS9tYXRoL0Fic3RyYWN0VmVjdG9yLmpzIiwiY29yZS9tYXRoL1ZlY3RvcjJELmpzIiwiY29yZS9tYXRoL1ZlY3RvcjNELmpzIiwiY29yZS9tYXRoL21hdDMuanMiLCJjb3JlL3JlbmRlcmVyL0Fic3RyYWN0UmVuZGVyZXIuanMiLCJjb3JlL3JlbmRlcmVyL1JlbmRlcmVyMkQuanMiLCJjb3JlL3JlbmRlcmVyL1JlbmRlcmVyR0wuanMiLCJjb3JlL3JlbmRlcmVyL2NyZWF0ZV9yZW5kZXJlci5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvY2xvc2Vfc2hhcGUuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL2NvcHlfZHJhd2luZ19zZXR0aW5ncy5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvZGVmYXVsdF9kcmF3aW5nX3NldHRpbmdzLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9nZXRfcmVuZGVyZXJfdHlwZS5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvZ2V0X3dlYmdsLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24uanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL3Byb2Nlc3Nfc2hhcGUuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL3NldF9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MuanMiLCJjb3JlL3JlbmRlcmVyL3NldHRpbmdzLmpzIiwiY29yZS9yZW5kZXJlci9zaGFwZXMvZHJhd19saW5lcy5qcyIsImNvcmUvcmVuZGVyZXIvc2hhcGVzL2RyYXdfcG9pbnRzLmpzIiwiY29yZS9zZXR0aW5ncy5qcyIsImNvcmUvc2hhZGVycy5qcyIsImluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xpZ2h0X2VtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGVha28vX3Rocm93LWFyZ3VtZW50LWV4Y2VwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdHlwZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdW5lc2NhcGUuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZXhlYy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZm9yLWVhY2guanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWZvci1pbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZ2V0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1pbmRleC1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2Uta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLXRvLWluZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2JlZm9yZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jYWxsLWl0ZXJhdGVlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Nhc3QtcGF0aC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jbGFtcC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jbG9uZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jb25zdGFudHMuanMiLCJub2RlX21vZHVsZXMvcGVha28vY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NyZWF0ZS9jcmVhdGUtZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUvY3JlYXRlLWdldC1lbGVtZW50LWRpbWVuc2lvbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUvY3JlYXRlLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2RlZmF1bHQtdG8uanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmYXVsdHMuanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmaW5lLXByb3BlcnRpZXMuanMiLCJub2RlX21vZHVsZXMvcGVha28vZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9nZXQtZWxlbWVudC1oLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2dldC1lbGVtZW50LXcuanMiLCJub2RlX21vZHVsZXMvcGVha28vZ2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1hcnJheS1saWtlLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1hcnJheS1saWtlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWFycmF5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWtleS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1sZW5ndGguanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LWxpa2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXBsYWluLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1wcmltaXRpdmUuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtc3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXdpbmRvdy1saWtlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzc2V0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2l0ZXJhdGVlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2tleXMuanMiLCJub2RlX21vZHVsZXMvcGVha28vbWF0Y2hlcy1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9taXhpbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9ub29wLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL25vdy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9vbmNlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3Byb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3NldC1wcm90b3R5cGUtb2YuanMiLCJub2RlX21vZHVsZXMvcGVha28vc3VwcG9ydC9zdXBwb3J0LWRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9zdXBwb3J0L3N1cHBvcnQta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lci5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lc3RhbXAuanMiLCJub2RlX21vZHVsZXMvcGVha28vdG8ta2V5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3RvLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90eXBlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy90QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVNoYWRlckF0dHJpYnV0ZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGxvY2F0aW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHNpemVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB0eXBlXG4gKiBAc2VlIFtnZXRBdHRyaWJMb2NhdGlvbl0oaHR0cHM6Ly9tZG4uaW8vZ2V0QXR0cmliTG9jYXRpb24pXG4gKiBAc2VlIFtXZWJHTEFjdGl2ZUluZm9dKGh0dHBzOi8vbWRuLmlvL1dlYkdMQWN0aXZlSW5mbylcbiAqL1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVNoYWRlclVuaWZvcm1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsb2NhdGlvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzaXplXG4gKiBAcHJvcGVydHkge251bWJlcn0gdHlwZVxuICogQHNlZSBbZ2V0QWN0aXZlVW5pZm9ybV0oaHR0cHM6Ly9tZG4uaW8vZ2V0QWN0aXZlVW5pZm9ybSlcbiAqIEBzZWUgW1dlYkdMQWN0aXZlSW5mb10oaHR0cHM6Ly9tZG4uaW8vV2ViR0xBY3RpdmVJbmZvKVxuICovXG5cbnZhciBjcmVhdGVQcm9ncmFtID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvY3JlYXRlX3Byb2dyYW0nICk7XG52YXIgY3JlYXRlU2hhZGVyICA9IHJlcXVpcmUoICcuL2ludGVybmFsL2NyZWF0ZV9zaGFkZXInICk7XG5cbi8qKlxuICog0JLRi9GB0L7QutC+0YPRgNC+0LLQvdC10LLRi9C5INC40L3RgtC10YDRhNC10LnRgSDQtNC70Y8gV2ViR0xQcm9ncmFtLlxuICogQGNvbnN0cnVjdG9yIHY2LlNoYWRlclByb2dyYW1cbiAqIEBwYXJhbSB7SVNoYWRlclNvdXJjZXN9ICAgICAgICBzb3VyY2VzINCo0LXQudC00LXRgNGLINC00LvRjyDQv9GA0L7Qs9GA0LDQvNC80YsuXG4gKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgICAgICBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICogQGV4YW1wbGUgPGNhcHRpb24+UmVxdWlyZSBcInY2LlNoYWRlclByb2dyYW1cIjwvY2FwdGlvbj5cbiAqIHZhciBTaGFkZXJQcm9ncmFtID0gcmVxdWlyZSggJ3Y2LmpzL1NoYWRlclByb2dyYW0nICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5Vc2Ugd2l0aG91dCByZW5kZXJlcjwvY2FwdGlvbj5cbiAqIC8vIFJlcXVpcmUgXCJ2Ni5qc1wiIHNoYWRlcnMuXG4gKiB2YXIgc2hhZGVycyA9IHJlcXVpcmUoICd2Ni5qcy9zaGFkZXJzJyApO1xuICogLy8gQ3JlYXRlIGEgcHJvZ3JhbS5cbiAqIHZhciBwcm9ncmFtID0gbmV3IFNoYWRlclByb2dyYW0oIHNoYWRlcnMuYmFzaWMsIGdsQ29udGV4dCApO1xuICovXG5mdW5jdGlvbiBTaGFkZXJQcm9ncmFtICggc291cmNlcywgZ2wgKVxue1xuICB2YXIgdmVydCA9IGNyZWF0ZVNoYWRlciggc291cmNlcy52ZXJ0LCBnbC5WRVJURVhfU0hBREVSLCBnbCApO1xuICB2YXIgZnJhZyA9IGNyZWF0ZVNoYWRlciggc291cmNlcy5mcmFnLCBnbC5GUkFHTUVOVF9TSEFERVIsIGdsICk7XG5cbiAgLyoqXG4gICAqIFdlYkdMINC/0YDQvtCz0YDQsNC80LzQsCDRgdC+0LfQtNCw0L3QvdCw0Y8g0YEg0L/QvtC80L7RidGM0Y4ge0BsaW5rIGNyZWF0ZVByb2dyYW19LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtXZWJHTFByb2dyYW19IHY2LlNoYWRlclByb2dyYW0jX3Byb2dyYW1cbiAgICovXG4gIHRoaXMuX3Byb2dyYW0gPSBjcmVhdGVQcm9ncmFtKCB2ZXJ0LCBmcmFnLCBnbCApO1xuXG4gIC8qKlxuICAgKiBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IHY2LlNoYWRlclByb2dyYW0jX2dsXG4gICAqL1xuICB0aGlzLl9nbCA9IGdsO1xuXG4gIC8qKlxuICAgKiDQmtC10YjQuNGA0L7QstCw0L3QvdGL0LUg0LDRgtGA0LjQsdGD0YLRiyDRiNC10LnQtNC10YDQvtCyLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LlNoYWRlclByb2dyYW0jX2F0dHJpYnV0ZXNcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKi9cbiAgdGhpcy5fYXR0cmlidXRlcyA9IHt9O1xuXG4gIC8qKlxuICAgKiDQmtC10YjQuNGA0L7QstCw0L3QvdGL0LUg0YTQvtGA0LzRiyAodW5pZm9ybXMpINGI0LXQudC00LXRgNC+0LIuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuU2hhZGVyUHJvZ3JhbSNfdW5pZm9ybXNcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldFVuaWZvcm1cbiAgICovXG4gIHRoaXMuX3VuaWZvcm1zID0ge307XG5cbiAgLyoqXG4gICAqINCY0L3QtNC10LrRgSDQv9C+0YHQu9C10LTQvdC10LPQviDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INCw0YLRgNC40LHRg9GC0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuU2hhZGVyUHJvZ3JhbSNfYXR0cmlidXRlSW5kZXhcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKi9cbiAgdGhpcy5fYXR0cmlidXRlSW5kZXggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKCB0aGlzLl9wcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUyApO1xuXG4gIC8qKlxuICAgKiDQmNC90LTQtdC60YEg0L/QvtGB0LvQtdC00L3QtdC5INC/0L7Qu9GD0YfQtdC90L3QvtC5INGE0L7RgNC80YsgKHVuaWZvcm0pLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlNoYWRlclByb2dyYW0jX3VuaWZvcm1JbmRleFxuICAgKiBAc2VlIHY2LlNoYWRlclByb2dyYW0jZ2V0VW5pZm9ybVxuICAgKi9cbiAgdGhpcy5fdW5pZm9ybUluZGV4ID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggdGhpcy5fcHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TICk7XG59XG5cblNoYWRlclByb2dyYW0ucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogQG1ldGhvZCB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICBuYW1lINCd0LDQt9Cy0LDQvdC40LUg0LDRgtGA0LjQsdGD0YLQsC5cbiAgICogQHJldHVybiB7SVNoYWRlckF0dHJpYnV0ZX0gICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQtNCw0L3QvdGL0LUg0L4g0LDRgtGA0LjQsdGD0YLQtS5cbiAgICogQGV4YW1wbGVcbiAgICogdmFyIGxvY2F0aW9uID0gcHJvZ3JhbS5nZXRBdHRyaWJ1dGUoICdhcG9zJyApLmxvY2F0aW9uO1xuICAgKi9cbiAgZ2V0QXR0cmlidXRlOiBmdW5jdGlvbiBnZXRBdHRyaWJ1dGUgKCBuYW1lIClcbiAge1xuICAgIHZhciBhdHRyID0gdGhpcy5fYXR0cmlidXRlc1sgbmFtZSBdO1xuICAgIHZhciBpbmZvO1xuXG4gICAgaWYgKCBhdHRyICkge1xuICAgICAgcmV0dXJuIGF0dHI7XG4gICAgfVxuXG4gICAgd2hpbGUgKCAtLXRoaXMuX2F0dHJpYnV0ZUluZGV4ID49IDAgKSB7XG4gICAgICBpbmZvID0gdGhpcy5fZ2wuZ2V0QWN0aXZlQXR0cmliKCB0aGlzLl9wcm9ncmFtLCB0aGlzLl9hdHRyaWJ1dGVJbmRleCApO1xuXG4gICAgICBhdHRyID0ge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5fZ2wuZ2V0QXR0cmliTG9jYXRpb24oIHRoaXMuX3Byb2dyYW0sIG5hbWUgKSxcbiAgICAgICAgbmFtZTogaW5mby5uYW1lLFxuICAgICAgICBzaXplOiBpbmZvLnNpemUsXG4gICAgICAgIHR5cGU6IGluZm8udHlwZVxuICAgICAgfTtcblxuICAgICAgdGhpcy5fYXR0cmlidXRlc1sgYXR0ci5uYW1lIF0gPSBhdHRyO1xuXG4gICAgICBpZiAoIGF0dHIubmFtZSA9PT0gbmFtZSApIHtcbiAgICAgICAgcmV0dXJuIGF0dHI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgUmVmZXJlbmNlRXJyb3IoICdObyBcIicgKyBuYW1lICsgJ1wiIGF0dHJpYnV0ZSBmb3VuZCcgKTtcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5TaGFkZXJQcm9ncmFtI2dldFVuaWZvcm1cbiAgICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgIG5hbWUg0J3QsNC30LLQsNC90LjQtSDRhNC+0YDQvNGLICh1bmlmb3JtKS5cbiAgICogQHJldHVybiB7SVNoYWRlclVuaWZvcm19ICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQsNC90L3Ri9C1INC+INGE0L7RgNC80LUgKHVuaWZvcm0pLlxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgbG9jYXRpb24gPSBwcm9ncmFtLmdldFVuaWZvcm0oICd1Y29sb3InICkubG9jYXRpb247XG4gICAqL1xuICBnZXRVbmlmb3JtOiBmdW5jdGlvbiBnZXRVbmlmb3JtICggbmFtZSApXG4gIHtcbiAgICB2YXIgdW5pZm9ybSA9IHRoaXMuX3VuaWZvcm1zWyBuYW1lIF07XG4gICAgdmFyIGluZGV4LCBpbmZvO1xuXG4gICAgaWYgKCB1bmlmb3JtICkge1xuICAgICAgcmV0dXJuIHVuaWZvcm07XG4gICAgfVxuXG4gICAgd2hpbGUgKCAtLXRoaXMuX3VuaWZvcm1JbmRleCA+PSAwICkge1xuICAgICAgaW5mbyA9IHRoaXMuX2dsLmdldEFjdGl2ZVVuaWZvcm0oIHRoaXMuX3Byb2dyYW0sIHRoaXMuX3VuaWZvcm1JbmRleCApO1xuXG4gICAgICB1bmlmb3JtID0ge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKCB0aGlzLl9wcm9ncmFtLCBpbmZvLm5hbWUgKSxcbiAgICAgICAgc2l6ZTogaW5mby5zaXplLFxuICAgICAgICB0eXBlOiBpbmZvLnR5cGVcbiAgICAgIH07XG5cbiAgICAgIGlmICggaW5mby5zaXplID4gMSAmJiB+ICggaW5kZXggPSBpbmZvLm5hbWUuaW5kZXhPZiggJ1snICkgKSApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZS5zbGljZSggMCwgaW5kZXggKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fdW5pZm9ybXNbIHVuaWZvcm0ubmFtZSBdID0gdW5pZm9ybTtcblxuICAgICAgaWYgKCB1bmlmb3JtLm5hbWUgPT09IG5hbWUgKSB7XG4gICAgICAgIHJldHVybiB1bmlmb3JtO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IFJlZmVyZW5jZUVycm9yKCAnTm8gXCInICsgbmFtZSArICdcIiB1bmlmb3JtIGZvdW5kJyApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jc2V0QXR0cmlidXRlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSBbV2ViR0xSZW5kZXJpbmdDb250ZXh0I2VuYWJsZVZlcnRleEF0dHJpYkFycmF5XShodHRwczovL21kbi5pby9lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSlcbiAgICogQHNlZSBbV2ViR0xSZW5kZXJpbmdDb250ZXh0I3ZlcnRleEF0dHJpYlBvaW50ZXJdKGh0dHBzOi8vbWRuLmlvL3ZlcnRleEF0dHJpYlBvaW50ZXIpXG4gICAqIEBleGFtcGxlXG4gICAqIHByb2dyYW0uc2V0QXR0cmlidXRlKCAnYXBvcycsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCApO1xuICAgKi9cbiAgc2V0QXR0cmlidXRlOiBmdW5jdGlvbiBzZXRBdHRyaWJ1dGUgKCBuYW1lLCBzaXplLCB0eXBlLCBub3JtYWxpemVkLCBzdHJpZGUsIG9mZnNldCApXG4gIHtcbiAgICB2YXIgbG9jYXRpb24gPSB0aGlzLmdldEF0dHJpYnV0ZSggbmFtZSApLmxvY2F0aW9uO1xuICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KCBsb2NhdGlvbiApO1xuICAgIHRoaXMuX2dsLnZlcnRleEF0dHJpYlBvaW50ZXIoIGxvY2F0aW9uLCBzaXplLCB0eXBlLCBub3JtYWxpemVkLCBzdHJpZGUsIG9mZnNldCApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jc2V0VW5pZm9ybVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWUgINCd0LDQt9Cy0LDQvdC40LUg0YTQvtGA0LzRiyAodW5pZm9ybSkuXG4gICAqIEBwYXJhbSAge2FueX0gICAgdmFsdWUg0J3QvtCy0L7QtSDQt9C90LDRh9C10L3QuNC1INGE0L7RgNC80YsgKHVuaWZvcm0pLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIHByb2dyYW0uc2V0VW5pZm9ybSggJ3Vjb2xvcicsIFsgMjU1LCAwLCAwLCAxIF0gKTtcbiAgICovXG4gIHNldFVuaWZvcm06IGZ1bmN0aW9uIHNldFVuaWZvcm0gKCBuYW1lLCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgdW5pZm9ybSA9IHRoaXMuZ2V0VW5pZm9ybSggbmFtZSApO1xuICAgIHZhciBfZ2wgICAgID0gdGhpcy5fZ2w7XG5cbiAgICBzd2l0Y2ggKCB1bmlmb3JtLnR5cGUgKSB7XG4gICAgICBjYXNlIF9nbC5CT09MOlxuICAgICAgY2FzZSBfZ2wuSU5UOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xaXYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xaSggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xZnYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUX01BVDI6XG4gICAgICAgIF9nbC51bmlmb3JtTWF0cml4MmZ2KCB1bmlmb3JtLmxvY2F0aW9uLCBmYWxzZSwgdmFsdWUgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIF9nbC5GTE9BVF9NQVQzOlxuICAgICAgICBfZ2wudW5pZm9ybU1hdHJpeDNmdiggdW5pZm9ybS5sb2NhdGlvbiwgZmFsc2UsIHZhbHVlICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfZ2wuRkxPQVRfTUFUNDpcbiAgICAgICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoIHVuaWZvcm0ubG9jYXRpb24sIGZhbHNlLCB2YWx1ZSApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUX1ZFQzI6XG4gICAgICAgIGlmICggdW5pZm9ybS5zaXplID4gMSApIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTJmdiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTJmKCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZVsgMCBdLCB2YWx1ZVsgMSBdICk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIF9nbC5GTE9BVF9WRUMzOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0zZnYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0zZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWVbIDAgXSwgdmFsdWVbIDEgXSwgdmFsdWVbIDIgXSApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfZ2wuRkxPQVRfVkVDNDpcbiAgICAgICAgaWYgKCB1bmlmb3JtLnNpemUgPiAxICkge1xuICAgICAgICAgIF9nbC51bmlmb3JtNGZ2KCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9nbC51bmlmb3JtNGYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlWyAwIF0sIHZhbHVlWyAxIF0sIHZhbHVlWyAyIF0sIHZhbHVlWyAzIF0gKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IFR5cGVFcnJvciggJ1RoZSB1bmlmb3JtIHR5cGUgaXMgbm90IHN1cHBvcnRlZCAoXCInICsgbmFtZSArICdcIiknICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuU2hhZGVyUHJvZ3JhbSN1c2VcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIFtXZWJHTFJlbmRlcmluZ0NvbnRleHQjdXNlUHJvZ3JhbV0oaHR0cHM6Ly9tZG4uaW8vdXNlUHJvZ3JhbSlcbiAgICogQGV4YW1wbGVcbiAgICogcHJvZ3JhbS51c2UoKTtcbiAgICovXG4gIHVzZTogZnVuY3Rpb24gdXNlICgpXG4gIHtcbiAgICB0aGlzLl9nbC51c2VQcm9ncmFtKCB0aGlzLl9wcm9ncmFtICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IFNoYWRlclByb2dyYW1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2hhZGVyUHJvZ3JhbTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIExpZ2h0RW1pdHRlciA9IHJlcXVpcmUoICdsaWdodF9lbWl0dGVyJyApO1xudmFyIHRpbWVzdGFtcCAgICA9IHJlcXVpcmUoICdwZWFrby90aW1lc3RhbXAnICk7XG52YXIgdGltZXIgICAgICAgID0gcmVxdWlyZSggJ3BlYWtvL3RpbWVyJyApO1xuXG4vKipcbiAqINCt0YLQvtGCINC60LvQsNGB0YEg0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC00LvRjyDQt9Cw0YbQuNC60LvQuNCy0LDQvdC40Y8g0LDQvdC40LzQsNGG0LjQuCDQstC80LXRgdGC0L4gYHJlcXVlc3RBbmltYXRpb25GcmFtZWAuXG4gKiBAY29uc3RydWN0b3IgdjYuVGlja2VyXG4gKiBAZXh0ZW5kcyB7TGlnaHRFbWl0dGVyfVxuICogQGZpcmVzIHVwZGF0ZVxuICogQGZpcmVzIHJlbmRlclxuICogQGV4YW1wbGVcbiAqIHZhciBUaWNrZXIgPSByZXF1aXJlKCAndjYuanMvVGlja2VyJyApO1xuICogdmFyIHRpY2tlciA9IG5ldyBUaWNrZXIoKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlwidXBkYXRlXCIgZXZlbnQuPC9jYXB0aW9uPlxuICogLy8gRmlyZXMgZXZlcnl0aW1lIGFuIGFwcGxpY2F0aW9uIHNob3VsZCBiZSB1cGRhdGVkLlxuICogLy8gRGVwZW5kcyBvbiBtYXhpbXVtIEZQUy5cbiAqIHRpY2tlci5vbiggJ3VwZGF0ZScsIGZ1bmN0aW9uICggZWxhcHNlZFRpbWUgKSB7XG4gKiAgIHNoYXBlLnJvdGF0aW9uICs9IDEwICogZWxhcHNlZFRpbWU7XG4gKiB9ICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5cInJlbmRlclwiIGV2ZW50LjwvY2FwdGlvbj5cbiAqIC8vIEZpcmVzIGV2ZXJ5dGltZSBhbiBhcHBsaWNhdGlvbiBzaG91bGQgYmUgcmVuZGVyZWQuXG4gKiAvLyBVbmxpa2UgXCJ1cGRhdGVcIiwgaW5kZXBlbmRlbnQgZnJvbSBtYXhpbXVtIEZQUy5cbiAqIHRpY2tlci5vbiggJ3JlbmRlcicsIGZ1bmN0aW9uICgpIHtcbiAqICAgcmVuZGVyZXIucm90YXRlKCBzaGFwZS5yb3RhdGlvbiApO1xuICogfSApO1xuICovXG5mdW5jdGlvbiBUaWNrZXIgKClcbntcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIExpZ2h0RW1pdHRlci5jYWxsKCB0aGlzICk7XG5cbiAgdGhpcy5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSAwO1xuICB0aGlzLmxhc3RSZXF1ZXN0VGltZSA9IDA7XG4gIHRoaXMuc2tpcHBlZFRpbWUgPSAwO1xuICB0aGlzLnRvdGFsVGltZSA9IDA7XG4gIHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiDQl9Cw0L/Rg9GB0LrQsNC10YIg0YbQuNC60Lsg0LDQvdC40LzQsNGG0LjQuC5cbiAgICogQG1ldGhvZCB2Ni5UaWNrZXIjc3RhcnRcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiB0aWNrZXIuc3RhcnQoKTtcbiAgICovXG4gIGZ1bmN0aW9uIHN0YXJ0ICggX25vdyApXG4gIHtcbiAgICB2YXIgZWxhcHNlZFRpbWU7XG5cbiAgICBpZiAoICEgc2VsZi5ydW5uaW5nICkge1xuICAgICAgaWYgKCAhIF9ub3cgKSB7XG4gICAgICAgIHNlbGYubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlEID0gdGltZXIucmVxdWVzdCggc3RhcnQgKTtcbiAgICAgICAgc2VsZi5sYXN0UmVxdWVzdFRpbWUgPSB0aW1lc3RhbXAoKTtcbiAgICAgICAgc2VsZi5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taW52YWxpZC10aGlzXG4gICAgfVxuXG4gICAgaWYgKCAhIF9ub3cgKSB7XG4gICAgICBfbm93ID0gdGltZXN0YW1wKCk7XG4gICAgfVxuXG4gICAgZWxhcHNlZFRpbWUgPSBNYXRoLm1pbiggMSwgKCBfbm93IC0gc2VsZi5sYXN0UmVxdWVzdFRpbWUgKSAqIDAuMDAxICk7XG5cbiAgICBzZWxmLnNraXBwZWRUaW1lICs9IGVsYXBzZWRUaW1lO1xuICAgIHNlbGYudG90YWxUaW1lICAgKz0gZWxhcHNlZFRpbWU7XG5cbiAgICB3aGlsZSAoIHNlbGYuc2tpcHBlZFRpbWUgPj0gc2VsZi5zdGVwICYmIHNlbGYucnVubmluZyApIHtcbiAgICAgIHNlbGYuc2tpcHBlZFRpbWUgLT0gc2VsZi5zdGVwO1xuICAgICAgc2VsZi5lbWl0KCAndXBkYXRlJywgc2VsZi5zdGVwLCBfbm93ICk7XG4gICAgfVxuXG4gICAgc2VsZi5lbWl0KCAncmVuZGVyJywgZWxhcHNlZFRpbWUsIF9ub3cgKTtcbiAgICBzZWxmLmxhc3RSZXF1ZXN0VGltZSA9IF9ub3c7XG4gICAgc2VsZi5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSB0aW1lci5yZXF1ZXN0KCBzdGFydCApO1xuXG4gICAgcmV0dXJuIHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taW52YWxpZC10aGlzXG4gIH1cblxuICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XG4gIHRoaXMuZnBzKCA2MCApO1xufVxuXG5UaWNrZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggTGlnaHRFbWl0dGVyLnByb3RvdHlwZSApO1xuVGlja2VyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRpY2tlcjtcblxuLyoqXG4gKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiDQvNCw0LrRgdC40LzQsNC70YzQvdC+0LUg0LrQvtC70LjRh9C10YHRgtCy0L4g0LrQsNC00YDQvtCyINCyINGB0LXQutGD0L3QtNGDIChGUFMpINCw0L3QuNC80LDRhtC40LguXG4gKiBAbWV0aG9kIHY2LlRpY2tlciNmcHNcbiAqIEBwYXJhbSB7bnVtYmVyfSBmcHMg0JzQsNC60YHQuNC80LDQu9GM0L3Ri9C5IEZQUywg0L3QsNC/0YDQuNC80LXRgDogNjAuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogLy8gU2V0IG1heGltdW0gYW5pbWF0aW9uIEZQUyB0byAxMC5cbiAqIC8vIERvIG5vdCBuZWVkIHRvIHJlc3RhcnQgdGlja2VyLlxuICogdGlja2VyLmZwcyggMTAgKTtcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5mcHMgPSBmdW5jdGlvbiBmcHMgKCBmcHMgKVxue1xuICB0aGlzLnN0ZXAgPSAxIC8gZnBzO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjY2xlYXJcbiAqIEBjaGFpbmFibGVcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuc2tpcHBlZFRpbWUgPSAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0J7RgdGC0LDQvdCw0LLQu9C40LLQsNC10YIg0LDQvdC40LzQsNGG0LjRji5cbiAqIEBtZXRob2QgdjYuVGlja2VyI3N0b3BcbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiB0aWNrZXIub24oICdyZW5kZXInLCBmdW5jdGlvbiAoKSB7XG4gKiAgIC8vIFN0b3AgdGhlIHRpY2tlciBhZnRlciBmaXZlIHNlY29uZHMuXG4gKiAgIGlmICggdGhpcy50b3RhbFRpbWUgPj0gNSApIHtcbiAqICAgICB0aWNrZXIuc3RvcCgpO1xuICogICB9XG4gKiB9ICk7XG4gKi9cblRpY2tlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIHN0b3AgKClcbntcbiAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUaWNrZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBtYXQzID0gcmVxdWlyZSggJy4vbWF0aC9tYXQzJyApO1xuXG5mdW5jdGlvbiBUcmFuc2Zvcm0gKClcbntcbiAgdGhpcy5tYXRyaXggPSBtYXQzLmlkZW50aXR5KCk7XG4gIHRoaXMuX2luZGV4ID0gLTE7XG4gIHRoaXMuX3N0YWNrID0gW107XG59XG5cblRyYW5zZm9ybS5wcm90b3R5cGUgPSB7XG4gIHNhdmU6IGZ1bmN0aW9uIHNhdmUgKClcbiAge1xuICAgIGlmICggKyt0aGlzLl9pbmRleCA8IHRoaXMuX3N0YWNrLmxlbmd0aCApIHtcbiAgICAgIG1hdDMuY29weSggdGhpcy5fc3RhY2tbIHRoaXMuX2luZGV4IF0sIHRoaXMubWF0cml4ICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3N0YWNrLnB1c2goIG1hdDMuY2xvbmUoIHRoaXMubWF0cml4ICkgKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVzdG9yZTogZnVuY3Rpb24gcmVzdG9yZSAoKVxuICB7XG4gICAgaWYgKCB0aGlzLl9pbmRleCA+PSAwICkge1xuICAgICAgbWF0My5jb3B5KCB0aGlzLm1hdHJpeCwgdGhpcy5fc3RhY2tbIHRoaXMuX2luZGV4LS0gXSApO1xuICAgIH0gZWxzZSB7XG4gICAgICBtYXQzLnNldElkZW50aXR5KCB0aGlzLm1hdHJpeCApO1xuICAgIH1cbiAgfSxcblxuICBzZXRUcmFuc2Zvcm06IGZ1bmN0aW9uIHNldFRyYW5zZm9ybSAoIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbiAge1xuICAgIG1hdDMuc2V0VHJhbnNmb3JtKCB0aGlzLm1hdHJpeCwgbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKTtcbiAgfSxcblxuICB0cmFuc2xhdGU6IGZ1bmN0aW9uIHRyYW5zbGF0ZSAoIHgsIHkgKVxuICB7XG4gICAgbWF0My50cmFuc2xhdGUoIHRoaXMubWF0cml4LCB4LCB5ICk7XG4gIH0sXG5cbiAgcm90YXRlOiBmdW5jdGlvbiByb3RhdGUgKCBhbmdsZSApXG4gIHtcbiAgICBtYXQzLnJvdGF0ZSggdGhpcy5tYXRyaXgsIGFuZ2xlICk7XG4gIH0sXG5cbiAgc2NhbGU6IGZ1bmN0aW9uIHNjYWxlICggeCwgeSApXG4gIHtcbiAgICBtYXQzLnNjYWxlKCB0aGlzLm1hdHJpeCwgeCwgeSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQn9GA0LjQvNC10L3Rj9C10YIgXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIiDQuNC3INGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7QsiDQvdCwINGC0LXQutGD0YnQuNC5IFwidHJhbnNmb3JtYXRpb24gbWF0cml4XCIuXG4gICAqIEBtZXRob2QgdjYuVHJhbnNmb3JtI3RyYW5zZm9ybVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMTEgWCBzY2FsZS5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgbTEyIFggc2tldy5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgbTIxIFkgc2tldy5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgbTIyIFkgc2NhbGUuXG4gICAqIEBwYXJhbSAge251bWJlcn0gIGR4ICBYIHRyYW5zbGF0ZS5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgZHkgIFkgdHJhbnNsYXRlLlxuICAgKiBAcmV0dXJuIHt2b2lkfSAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEFwcGx5IHNjYWxlZCB0d2ljZSBcInRyYW5zZm9ybWF0aW9uIG1hdHJpeFwiLlxuICAgKiB0cmFuc2Zvcm0udHJhbnNmb3JtKCAyLCAwLCAwLCAyLCAwLCAwICk7XG4gICAqL1xuICB0cmFuc2Zvcm06IGZ1bmN0aW9uIHRyYW5zZm9ybSAoIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbiAge1xuICAgIG1hdDMudHJhbnNmb3JtKCB0aGlzLm1hdHJpeCwgbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKTtcbiAgfSxcblxuICBjb25zdHJ1Y3RvcjogVHJhbnNmb3JtXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoICdwZWFrby9kZWZhdWx0cycgKTtcbnZhciBtaXhpbiA9IHJlcXVpcmUoICdwZWFrby9taXhpbicgKTtcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICcuL3NldHRpbmdzJyApO1xuLyoqXG4gKiDQmtC70LDRgdGBINC60LDQvNC10YDRiy4g0K3RgtC+0YIg0LrQu9Cw0YHRgSDRg9C00L7QsdC10L0g0LTQu9GPINGB0L7Qt9C00LDQvdC40Y8g0LrQsNC80LXRgNGLLCDQutC+0YLQvtGA0LDRjyDQtNC+0LvQttC90LAg0LHRi9GC0YxcbiAqINC90LDQv9GA0LDQstC70LXQvdC90LAg0L3QsCDQvtC/0YDQtdC00LXQu9C10L3QvdGL0Lkg0L7QsdGK0LXQutGCINCyINC/0YDQuNC70L7QttC10L3QuNC4LCDQvdCw0L/RgNC40LzQtdGAOiDQvdCwINC80LDRiNC40L3RgyDQslxuICog0LPQvtC90L7Rh9C90L7QuSDQuNCz0YDQtS4g0JrQsNC80LXRgNCwINCx0YPQtNC10YIg0YHQsNC80LAg0L/Qu9Cw0LLQvdC+INC4INGBINCw0L3QuNC80LDRhtC40LXQuSDQvdCw0L/RgNCw0LLQu9GP0YLRjNGB0Y8g0L3QsCDQvdGD0LbQvdGL0LlcbiAqINC+0LHRitC10LrRgi4g0JXRgdGC0Ywg0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQsNC90LjQvNC40YDQvtCy0LDQvdC90L7Qs9C+INC+0YLQtNCw0LvQtdC90LjRjyDQuNC70Lgg0L/RgNC40LHQu9C40LbQtdC90LjRjyDQutCw0LzQtdGA0YsuXG4gKiBAY29uc3RydWN0b3IgdjYuQ2FtZXJhXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdINCf0LDRgNCw0LzQtdGC0YDRiyDQtNC70Y8g0YHQvtC30LTQsNC90LjRjyDQutCw0LzQtdGA0YssINGB0LzQvtGC0YDQuNGC0LUge0BsaW5rIHY2LnNldHRpbmdzLmNhbWVyYX0uXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5SZXF1aXJlIFwidjYuQ2FtZXJhXCI8L2NhcHRpb24+XG4gKiB2YXIgQ2FtZXJhID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY2FtZXJhL0NhbWVyYScgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhbiBpbnN0YW5jZTwvY2FwdGlvbj5cbiAqIHZhciBjYW1lcmEgPSBuZXcgQ2FtZXJhKCk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGUgYW4gaW5zdGFuY2Ugd2l0aCBvcHRpb25zPC9jYXB0aW9uPlxuICogdmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEoIHtcbiAqICAgc2V0dGluZ3M6IHtcbiAqICAgICBzcGVlZDoge1xuICogICAgICAgeDogMC4xNSxcbiAqICAgICAgIHk6IDAuMTVcbiAqICAgICB9XG4gKiAgIH1cbiAqIH0gKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhbiBpbnN0YW5jZSB3aXRoIHJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEoIHtcbiAqICAgcmVuZGVyZXI6IHJlbmRlcmVyXG4gKiB9ICk7XG4gKi9cbmZ1bmN0aW9uIENhbWVyYSAoIG9wdGlvbnMgKVxue1xuICB2YXIgeCwgeTtcbiAgb3B0aW9ucyA9IGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApO1xuICAvKipcbiAgICog0J3QsNGB0YLRgNC+0LnQutC4INC60LDQvNC10YDRiywg0YLQsNC60LjQtSDQutCw0Log0YHQutC+0YDQvtGB0YLRjCDQsNC90LjQvNCw0YbQuNC4INC40LvQuCDQvNCw0YHRiNGC0LDQsS5cbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5DYW1lcmEjc2V0dGluZ3NcbiAgICogQHNlZSB2Ni5zZXR0aW5ncy5jYW1lcmEuc2V0dGluZ3NcbiAgICovXG4gIHRoaXMuc2V0dGluZ3MgPSBvcHRpb25zLnNldHRpbmdzO1xuICBpZiAoIG9wdGlvbnMucmVuZGVyZXIgKSB7XG4gICAgLyoqXG4gICAgICog0KDQtdC90LTQtdGA0LXRgC5cbiAgICAgKiBAbWVtYmVyIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfHZvaWR9IHY2LkNhbWVyYSNyZW5kZXJlclxuICAgICAqL1xuICAgIHRoaXMucmVuZGVyZXIgPSBvcHRpb25zLnJlbmRlcmVyO1xuICB9XG4gIGlmICggISB0aGlzLnNldHRpbmdzLm9mZnNldCApIHtcbiAgICBpZiAoIHRoaXMucmVuZGVyZXIgKSB7XG4gICAgICB4ID0gdGhpcy5yZW5kZXJlci53ICogMC41O1xuICAgICAgeSA9IHRoaXMucmVuZGVyZXIuaCAqIDAuNTtcbiAgICB9IGVsc2Uge1xuICAgICAgeCA9IDA7XG4gICAgICB5ID0gMDtcbiAgICB9XG4gICAgdGhpcy5zZXR0aW5ncy5vZmZzZXQgPSB7XG4gICAgICB4OiB4LFxuICAgICAgeTogeVxuICAgIH07XG4gIH1cbiAgLyoqXG4gICAqINCe0LHRitC10LrRgiwg0L3QsCDQutC+0YLQvtGA0YvQuSDQvdCw0L/RgNCw0LLQu9C10L3QsCDQutCw0LzQtdGA0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge29iamVjdD99IHY2LkNhbWVyYSNfZGVzdGluYXRpb25cbiAgICogQHNlZSB2Ni5DYW1lcmEjbG9va0F0XG4gICAqL1xuICB0aGlzLl9kZXN0aW5hdGlvbiA9IG51bGw7XG4gIC8qKlxuICAgKiDQodCy0L7QudGB0YLQstC+LCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDQsdGA0LDRgtGMINC40Lcge0BsaW5rIHY2LkNhbWVyYSNfZGVzdGluYXRpb259LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtzdHJpbmc/fSB2Ni5DYW1lcmEjX2Rlc3RpbmF0aW9uS2V5XG4gICAqIEBzZWUgdjYuQ2FtZXJhI2xvb2tBdFxuICAgKi9cbiAgdGhpcy5fZGVzdGluYXRpb25LZXkgPSBudWxsO1xuICAvKipcbiAgICog0KLQtdC60YPRidGP0Y8g0L/QvtC30LjRhtC40Y8g0LrQsNC80LXRgNGLICjRgdGO0LTQsCDQvdCw0L/RgNCw0LLQu9C10L3QsCDQutCw0LzQtdGA0LApLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtJVmVjdG9yMkR9IHY2LkNhbWVyYSNfY3VycmVudFBvc2l0aW9uXG4gICAqL1xuICB0aGlzLl9jdXJyZW50UG9zaXRpb24gPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH07XG59XG5DYW1lcmEucHJvdG90eXBlID0ge1xuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0L7QsdGK0LXQutGCLCDQvdCwINC60L7RgtC+0YDRi9C5INC60LDQvNC10YDQsCDQtNC+0LvQttC90LAg0LHRi9GC0Ywg0L3QsNC/0YDQsNCy0LvQtdC90LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI19nZXREZXN0aW5hdGlvblxuICAgKiBAcmV0dXJuIHtJVmVjdG9yMkQ/fSDQntCx0YrQtdC60YIg0LjQu9C4IFwibnVsbFwiLlxuICAgKi9cbiAgX2dldERlc3RpbmF0aW9uOiBmdW5jdGlvbiBfZ2V0RGVzdGluYXRpb24gKClcbiAge1xuICAgIHZhciBfZGVzdGluYXRpb25LZXkgPSB0aGlzLl9kZXN0aW5hdGlvbktleTtcbiAgICBpZiAoIF9kZXN0aW5hdGlvbktleSA9PT0gbnVsbCApIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZXN0aW5hdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2Rlc3RpbmF0aW9uWyBfZGVzdGluYXRpb25LZXkgXTtcbiAgfSxcbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINC90LDRgdGC0YDQvtC50LrQuC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjc2V0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZXR0aW5nINCY0LzRjyDQvdCw0YHRgtGA0L7QudC60Lg6IFwiem9vbS1pbiBzcGVlZFwiLCBcInpvb20tb3V0IHNwZWVkXCIsIFwiem9vbVwiLCBcInNwZWVkXCIsIFwib2Zmc2V0XCIuXG4gICAqIEBwYXJhbSB7YW55fSAgICB2YWx1ZSAgINCd0L7QstC+0LUg0LfQvdCw0YfQtdC90LjQtSDQvdCw0YHRgtGA0L7QudC60LguXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IHpvb20taW4gc3BlZWQgc2V0dGluZyB0byAwLjAwMjUgd2l0aCBsaW5lYXIgZmxhZyAoZGVmYXVsdDogdHJ1ZSkuXG4gICAqIGNhbWVyYS5zZXQoICd6b29tLWluIHNwZWVkJywgeyB2YWx1ZTogMC4wMDI1LCBsaW5lYXI6IHRydWUgfSApO1xuICAgKiAvLyBUdXJuIG9mZiBsaW5lYXIgZmxhZy5cbiAgICogY2FtZXJhLnNldCggJ3pvb20taW4gc3BlZWQnLCB7IGxpbmVhcjogZmFsc2UgfSApO1xuICAgKiAvLyBTZXQgem9vbSBzZXR0aW5nIHRvIDEgd2l0aCByYW5nZSBbIDAuNzUgLi4gMS4xMjUgXS5cbiAgICogY2FtZXJhLnNldCggJ3pvb20nLCB7IHZhbHVlOiAxLCBtaW46IDAuNzUsIG1heDogMS4xMjUgfSApO1xuICAgKiAvLyBTZXQgY2FtZXJhIHNwZWVkLlxuICAgKiBjYW1lcmEuc2V0KCAnc3BlZWQnLCB7IHg6IDAuMSwgeTogMC4xIH0gKTtcbiAgICovXG4gIHNldDogZnVuY3Rpb24gc2V0ICggc2V0dGluZywgdmFsdWUgKVxuICB7XG4gICAgc3dpdGNoICggc2V0dGluZyApIHtcbiAgICAgIGNhc2UgJ3pvb20tb3V0IHNwZWVkJzpcbiAgICAgIGNhc2UgJ3pvb20taW4gc3BlZWQnOlxuICAgICAgY2FzZSAnb2Zmc2V0JzpcbiAgICAgIGNhc2UgJ3NwZWVkJzpcbiAgICAgIGNhc2UgJ3pvb20nOlxuICAgICAgICBtaXhpbiggdGhpcy5zZXR0aW5nc1sgc2V0dGluZyBdLCB2YWx1ZSApO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IEVycm9yKCAnR290IHVua25vd24gc2V0dGluZyBuYW1lOiAnICsgc2V0dGluZyApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCd0LDQv9GA0LDQstC70Y/QtdGCINC60LDQvNC10YDRgyDQvdCwINC+0L/RgNC10LTQtdC70LXQvdC90YPRjiDQv9C+0LfQuNGG0LjRjiAoYFwiZGVzdGluYXRpb25cImApLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNsb29rQXRcbiAgICogQHBhcmFtIHtJVmVjdG9yMkR9IGRlc3RpbmF0aW9uINCf0L7Qt9C40YbQuNGPLCDQsiDQutC+0YLQvtGA0YPRjiDQtNC+0LvQttC90LAg0YHQvNC+0YLRgNC10YLRjCDQutCw0LzQtdGA0LAuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtrZXldICAg0KHQstC+0LnRgdGC0LLQviwg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0LHRgNCw0YLRjCDQuNC3IGBcImRlc3RpbmF0aW9uXCJgLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBjYXIgPSB7XG4gICAqICAgcG9zaXRpb246IHtcbiAgICogICAgIHg6IDQsXG4gICAqICAgICB5OiAyXG4gICAqICAgfVxuICAgKiB9O1xuICAgKiAvLyBEaXJlY3QgYSBjYW1lcmEgb24gdGhlIGNhci5cbiAgICogY2FtZXJhLmxvb2tBdCggY2FyLCAncG9zaXRpb24nICk7XG4gICAqIC8vIFRoaXMgd2F5IHdvcmtzIHRvbyBidXQgaWYgdGhlICdwb3NpdGlvbicgd2lsbCBiZSByZXBsYWNlZCBpdCB3b3VsZCBub3Qgd29yay5cbiAgICogY2FtZXJhLmxvb2tBdCggY2FyLnBvc2l0aW9uICk7XG4gICAqL1xuICBsb29rQXQ6IGZ1bmN0aW9uIGxvb2tBdCAoIGRlc3RpbmF0aW9uLCBrZXkgKVxuICB7XG4gICAgdGhpcy5fZGVzdGluYXRpb24gPSBkZXN0aW5hdGlvbjtcbiAgICBpZiAoIHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgdGhpcy5fZGVzdGluYXRpb25LZXkgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kZXN0aW5hdGlvbktleSA9IGtleTtcbiAgICB9XG4gIH0sXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQv9C+0LfQuNGG0LjRjiwg0L3QsCDQutC+0YLQvtGA0YPRjiDQutCw0LzQtdGA0LAg0LTQvtC70LbQvdCwINCx0YvRgtGMINC90LDQv9GA0LDQstC70LXQvdCwLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNzaG91bGRMb29rQXRcbiAgICogQHJldHVybiB7SVZlY3RvcjJEfSDQn9C+0LfQuNGG0LjRjy5cbiAgICogQGV4YW1wbGVcbiAgICogdmFyIG9iamVjdCA9IHtcbiAgICogICBwb3NpdGlvbjoge1xuICAgKiAgICAgeDogNCxcbiAgICogICAgIHk6IDJcbiAgICogICB9XG4gICAqIH07XG4gICAqXG4gICAqIGNhbWVyYS5sb29rQXQoIGRlc3RpbmF0aW9uLCAncG9zaXRpb24nICkuc2hvdWxkTG9va0F0KCk7IC8vIC0+IHsgeDogNCwgeTogMiB9IChjbG9uZSBvZiBcIm9iamVjdC5wb3NpdGlvblwiKS5cbiAgICovXG4gIHNob3VsZExvb2tBdDogZnVuY3Rpb24gc2hvdWxkTG9va0F0ICgpXG4gIHtcbiAgICB2YXIgX2Rlc3RpbmF0aW9uID0gdGhpcy5fZ2V0RGVzdGluYXRpb24oKTtcbiAgICB2YXIgeCwgeTtcbiAgICBpZiAoIF9kZXN0aW5hdGlvbiA9PT0gbnVsbCApIHtcbiAgICAgIHggPSAwO1xuICAgICAgeSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSBfZGVzdGluYXRpb24ueDtcbiAgICAgIHkgPSBfZGVzdGluYXRpb24ueTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHgsXG4gICAgICB5OiB5XG4gICAgfTtcbiAgfSxcbiAgLyoqXG4gICAqINCe0LHQvdC+0LLQu9GP0LXRgiDQv9C+0LfQuNGG0LjRjiwg0L3QsCDQutC+0YLQvtGA0YPRjiDQvdCw0L/RgNCw0LLQu9C10L3QsCDQutCw0LzQtdGA0LAuXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI3VwZGF0ZVxuICAgKiBAcmV0dXJuIHt2b2lkfSDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiB0aWNrZXIub24oICd1cGRhdGUnLCBmdW5jdGlvbiAoKVxuICAgKiB7XG4gICAqICAgLy8gVXBkYXRlIGEgY2FtZXJhIG9uIGVhY2ggZnJhbWUuXG4gICAqICAgY2FtZXJhLnVwZGF0ZSgpO1xuICAgKiB9ICk7XG4gICAqL1xuICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZSAoKVxuICB7XG4gICAgdmFyIF9kZXN0aW5hdGlvbiA9IHRoaXMuX2dldERlc3RpbmF0aW9uKCk7XG4gICAgaWYgKCBfZGVzdGluYXRpb24gIT09IG51bGwgKSB7XG4gICAgICB0cmFuc2xhdGUoIHRoaXMsIF9kZXN0aW5hdGlvbiwgJ3gnICk7XG4gICAgICB0cmFuc2xhdGUoIHRoaXMsIF9kZXN0aW5hdGlvbiwgJ3knICk7XG4gICAgfVxuICB9LFxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0L/QvtC30LjRhtC40Y4sINC90LAg0LrQvtGC0L7RgNGD0Y4g0LrQsNC80LXRgNCwINC90LDQv9GA0LDQstC70LXQvdCwINGB0LXQudGH0LDRgS5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjbG9va3NBdFxuICAgKiBAcmV0dXJuIHtJVmVjdG9yMkR9INCi0LXQutGD0YnQtdC1INC90LDQv9GA0LDQstC70LXQvdC40LUg0LrQsNC80LXRgNGLLlxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBBIGNhbWVyYSBsb29rcyBhdCBbIHgsIHkgXSBmcm9tIGxvb2tzQXQgbm93LlxuICAgKiB2YXIgbG9va3NBdCA9IGNhbWVyYS5sb29rc0F0KCk7XG4gICAqL1xuICBsb29rc0F0OiBmdW5jdGlvbiBsb29rc0F0ICgpXG4gIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDogdGhpcy5fY3VycmVudFBvc2l0aW9uLngsXG4gICAgICB5OiB0aGlzLl9jdXJyZW50UG9zaXRpb24ueVxuICAgIH07XG4gIH0sXG4gIC8qKlxuICAgKiDQn9GA0LjQvNC10L3Rj9C10YIg0LrQsNC80LXRgNGDINC90LAg0LzQsNGC0YDQuNGG0YMg0LjQu9C4INGA0LXQvdC00LXRgNC10YAuXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI2FwcGx5XG4gICAqIEBwYXJhbSAge3Y2LlRyYW5zZm9ybXx2Ni5BYnN0cmFjdFJlbmRlcmVyfSBbbWF0cml4XSDQnNCw0YLRgNC40YbQsCDQuNC70Lgg0YDQtdC90LTQtdGA0LXRgC5cbiAgICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5BcHBseSBvbiBhIHJlbmRlcmVyPC9jYXB0aW9uPlxuICAgKiB2YXIgcmVuZGVyZXIgPSB2Ni5jcmVhdGVSZW5kZXJlcigpO1xuICAgKiBjYW1lcmEuYXBwbHkoIHJlbmRlcmVyICk7XG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPkFwcGx5IG9uIGEgdHJhbnNmb3JtPC9jYXB0aW9uPlxuICAgKiB2YXIgbWF0cml4ID0gbmV3IHY2LlRyYW5zZm9ybSgpO1xuICAgKiBjYW1lcmEuYXBwbHkoIG1hdHJpeCApO1xuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5BcHBseSBvbiBhIGNhbWVyYSdzIHJlbmRlcmVyPC9jYXB0aW9uPlxuICAgKiB2YXIgY2FtZXJhID0gbmV3IHY2LkNhbWVyYSgge1xuICAgKiAgIHJlbmRlcmVyOiByZW5kZXJlclxuICAgKiB9ICk7XG4gICAqXG4gICAqIGNhbWVyYS5hcHBseSgpO1xuICAgKi9cbiAgYXBwbHk6IGZ1bmN0aW9uIGFwcGx5ICggbWF0cml4IClcbiAge1xuICAgIHZhciB6b29tID0gdGhpcy5zZXR0aW5ncy56b29tLnZhbHVlO1xuICAgIHZhciB4ID0gdHJhbnNmb3JtKCB0aGlzLCB0aGlzLl9jdXJyZW50UG9zaXRpb24sICd4JyApO1xuICAgIHZhciB5ID0gdHJhbnNmb3JtKCB0aGlzLCB0aGlzLl9jdXJyZW50UG9zaXRpb24sICd5JyApO1xuICAgICggbWF0cml4IHx8IHRoaXMucmVuZGVyZXIgKS5zZXRUcmFuc2Zvcm0oIHpvb20sIDAsIDAsIHpvb20sIHpvb20gKiB4LCB6b29tICogeSApO1xuICB9LFxuICAvKipcbiAgICog0J7Qv9GA0LXQtNC10LvRj9C10YIsINCy0LjQtNC40YIg0LvQuCDQutCw0LzQtdGA0LAg0L7QsdGK0LXQutGCINC40Lcg0YHQvtC+0YLQstC10YLRgdCy0YPRjtGJ0LjRhSDQv9Cw0YDQsNCy0LXRgtGA0L7QsiAoeCwgeSwgdywgaCkg0YHQtdC50YfQsNGBLFxuICAgKiDQtdGB0LvQuCDQvdC10YIsINGC0L4g0Y3RgtC+0YIg0L7QsdGK0LXQutGCINC80L7QttC90L4g0L3QtSDQvtGC0YDQuNGB0L7QstGL0LLQsNGC0YwuXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI3NlZXNcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgeCAgICAgICAgICBYINC60L7QvtGA0LTQuNC90LDRgtCwINC+0LHRitC10LrRgtCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB5ICAgICAgICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L7QsdGK0LXQutGC0LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIHcgICAgICAgICAg0KjQuNGA0LjQvdCwINC+0LHRitC10LrRgtCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICBoICAgICAgICAgINCS0YvRgdC+0YLQsCDQvtCx0YrQtdC60YLQsC5cbiAgICogQHBhcmFtICB7djYuQWJzdHJhY3RSZW5kZXJlcn0gW3JlbmRlcmVyXSDQoNC10L3QtNC10YDQtdGALlxuICAgKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgIGB0cnVlYCwg0LXRgdC70Lgg0L7QsdGK0LXQutGCINC00L7Qu9C20LXQvSDQsdGL0YLRjCDQvtGC0YDQuNGB0L7QstCw0L0uXG4gICAqIEBleGFtcGxlXG4gICAqIGlmICggY2FtZXJhLnNlZXMoIG9iamVjdC54LCBvYmplY3QueSwgb2JqZWN0LncsIG9iamVjdC5oICkgKSB7XG4gICAqICAgb2JqZWN0LnNob3coKTtcbiAgICogfVxuICAgKi9cbiAgc2VlczogZnVuY3Rpb24gc2VlcyAoIHgsIHksIHcsIGgsIHJlbmRlcmVyIClcbiAge1xuICAgIHZhciB6b29tID0gdGhpcy5zZXR0aW5ncy56b29tLnZhbHVlO1xuICAgIHZhciBvZmZzZXQgPSB0aGlzLnNldHRpbmdzLm9mZnNldDtcbiAgICB2YXIgX2N1cnJlbnRQb3NpdGlvbiA9IHRoaXMuX2N1cnJlbnRQb3NpdGlvbjtcbiAgICBpZiAoICEgcmVuZGVyZXIgKSB7XG4gICAgICByZW5kZXJlciA9IHRoaXMucmVuZGVyZXI7XG4gICAgfVxuICAgIGlmICggISByZW5kZXJlciApIHtcbiAgICAgIHRocm93IEVycm9yKCAnTm8gcmVuZGVyZXIgKGNhbWVyYS5zZWVzKScgKTtcbiAgICB9XG4gICAgcmV0dXJuIHggKyB3ID4gX2N1cnJlbnRQb3NpdGlvbi54IC0gb2Zmc2V0LnggLyB6b29tICYmXG4gICAgICAgICAgIHggPCBfY3VycmVudFBvc2l0aW9uLnggKyAoIHJlbmRlcmVyLncgLSBvZmZzZXQueCApIC8gem9vbSAmJlxuICAgICAgICAgICB5ICsgaCA+IF9jdXJyZW50UG9zaXRpb24ueSAtIG9mZnNldC55IC8gem9vbSAmJlxuICAgICAgICAgICB5IDwgX2N1cnJlbnRQb3NpdGlvbi55ICsgKCByZW5kZXJlci5oIC0gb2Zmc2V0LnkgKSAvIHpvb207XG4gIH0sXG4gIC8qKlxuICAgKiDQntGC0LTQsNC70Y/QtdGCINC60LDQvNC10YDRgy4g0JDQvdC40LzQsNGG0LjRjyDQvNC+0LbQtdGCINCx0YvRgtGMINC70LjQvdC10LnQvdC+0LkgKNC/0L4g0YPQvNC+0LvRh9Cw0L3QuNGOKSDQtdGB0LvQuCDRjdGC0L4g0LLQutC70Y7Rh9C10L3QvjpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiBjYW1lcmEuc2V0KCAnem9vbS1vdXQgc3BlZWQnLCB7XG4gICAqICAgLy8gRW5hYmxlcyBsaW5lYXIgYW5pbWF0aW9uIChlbmFibGVkIGJ5IGRlZmF1bHQgYnV0IHlvdSBjYW4gZGlzYWJsZSkuXG4gICAqICAgbGluZWFyOiB0cnVlXG4gICAqIH0gKTtcbiAgICogYGBgXG4gICAqINCh0LrQvtGA0L7RgdGC0Ywg0LDQvdC40LzQsNGG0LjQuCDQuNC30LzQtdC90Y/QtdGC0YHRjyDRh9C10YDQtdC3IGB2YWx1ZWA6XG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogY2FtZXJhLnNldCggJ3pvb20tb3V0IHNwZWVkJywge1xuICAgKiAgIC8vIFNldCBzbG93IHpvb20tb3V0IHNwZWVkICgxIGJ5IGRlZmF1bHQpLlxuICAgKiAgIHZhbHVlOiAwLjFcbiAgICogfSApO1xuICAgKiBgYGBcbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjem9vbU91dFxuICAgKiBAcmV0dXJuIHt2b2lkfSDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGVcbiAgICogdGlja2VyLm9uKCAndXBkYXRlJywgZnVuY3Rpb24gKClcbiAgICoge1xuICAgKiAgIGNhbWVyYS56b29tT3V0KCk7XG4gICAqIH0gKTtcbiAgICovXG4gIHpvb21PdXQ6IGZ1bmN0aW9uIHpvb21PdXQgKCkgeyB2YXIgem9vbVNwZWVkID0gdGhpcy5zZXR0aW5nc1sgJ3pvb20tb3V0IHNwZWVkJyBdOyB2YXIgem9vbSA9IHRoaXMuc2V0dGluZ3Muem9vbTsgdmFyIGNoYW5nZTsgaWYgKCB6b29tLnZhbHVlICE9PSB6b29tLm1pbiApIHsgaWYgKCB6b29tU3BlZWQubGluZWFyICkgeyBjaGFuZ2UgPSB6b29tU3BlZWQudmFsdWUgKiB6b29tLnZhbHVlOyB9IGVsc2UgeyBjaGFuZ2UgPSB6b29tU3BlZWQudmFsdWU7IH0gem9vbS52YWx1ZSA9IE1hdGgubWF4KCB6b29tLnZhbHVlIC0gY2hhbmdlLCB6b29tLm1pbiApOyB9IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0J/RgNC40LHQu9C40LbQsNC10YIg0LrQsNC80LXRgNGDLiDQkNC90LjQvNCw0YbQuNGPINC80L7QttC10YIg0LHRi9GC0Ywg0LvQuNC90LXQudC90L7QuSAo0L/QviDRg9C80L7Qu9GH0LDQvdC40Y4pINC10YHQu9C4INGN0YLQviDQstC60LvRjtGH0LXQvdC+OlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIGNhbWVyYS5zZXQoICd6b29tLWluIHNwZWVkJywge1xuICAgKiAgIC8vIEVuYWJsZXMgbGluZWFyIGFuaW1hdGlvbiAoZW5hYmxlZCBieSBkZWZhdWx0IGJ1dCB5b3UgY2FuIGRpc2FibGUpLlxuICAgKiAgIGxpbmVhcjogdHJ1ZVxuICAgKiB9ICk7XG4gICAqIGBgYFxuICAgKiDQodC60L7RgNC+0YHRgtGMINCw0L3QuNC80LDRhtC40Lgg0LjQt9C80LXQvdGP0LXRgtGB0Y8g0YfQtdGA0LXQtyBgdmFsdWVgOlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIGNhbWVyYS5zZXQoICd6b29tLWluIHNwZWVkJywge1xuICAgKiAgIC8vIFNldCBzbG93IHpvb20taW4gc3BlZWQgKDEgYnkgZGVmYXVsdCkuXG4gICAqICAgdmFsdWU6IDAuMVxuICAgKiB9ICk7XG4gICAqIGBgYFxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSN6b29tSW5cbiAgICogQHJldHVybiB7dm9pZH0g0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gICAqIEBleGFtcGxlXG4gICAqIHRpY2tlci5vbiggJ3VwZGF0ZScsIGZ1bmN0aW9uICgpXG4gICAqIHtcbiAgICogICBjYW1lcmEuem9vbUluKCk7XG4gICAqIH0gKTtcbiAgICovXG4gIHpvb21JbjogZnVuY3Rpb24gem9vbUluICgpIHsgdmFyIHpvb21TcGVlZCA9IHRoaXMuc2V0dGluZ3NbICd6b29tLWluIHNwZWVkJyBdOyB2YXIgem9vbSA9IHRoaXMuc2V0dGluZ3Muem9vbTsgdmFyIGNoYW5nZTsgaWYgKCB6b29tLnZhbHVlICE9PSB6b29tLm1heCApIHsgaWYgKCB6b29tU3BlZWQubGluZWFyICkgeyBjaGFuZ2UgPSB6b29tU3BlZWQudmFsdWUgKiB6b29tLnZhbHVlOyB9IGVsc2UgeyBjaGFuZ2UgPSB6b29tU3BlZWQudmFsdWU7IH0gem9vbS52YWx1ZSA9IE1hdGgubWluKCB6b29tLnZhbHVlICsgY2hhbmdlLCB6b29tLm1heCApOyB9IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICBjb25zdHJ1Y3RvcjogQ2FtZXJhXG59O1xuZnVuY3Rpb24gdHJhbnNmb3JtICggY2FtZXJhLCBwb3NpdGlvbiwgYXhpcyApXG57XG4gIHJldHVybiBjYW1lcmEuc2V0dGluZ3Mub2Zmc2V0WyBheGlzIF0gLyBjYW1lcmEuc2V0dGluZ3Muem9vbS52YWx1ZSAtIHBvc2l0aW9uWyBheGlzIF07XG59XG5mdW5jdGlvbiB0cmFuc2xhdGUgKCBjYW1lcmEsIGRlc3RpbmF0aW9uLCBheGlzIClcbntcbiAgdmFyIHRyYW5zZm9ybWVkRGVzdGluYXRpb24gPSB0cmFuc2Zvcm0oIGNhbWVyYSwgZGVzdGluYXRpb24sIGF4aXMgKTtcbiAgdmFyIHRyYW5zZm9ybWVkQ3VycmVudFBvc2l0aW9uID0gdHJhbnNmb3JtKCBjYW1lcmEsIGNhbWVyYS5fY3VycmVudFBvc2l0aW9uLCBheGlzICk7XG4gIGNhbWVyYS5fY3VycmVudFBvc2l0aW9uWyBheGlzIF0gKz0gKCB0cmFuc2Zvcm1lZERlc3RpbmF0aW9uIC0gdHJhbnNmb3JtZWRDdXJyZW50UG9zaXRpb24gKSAqIGNhbWVyYS5zZXR0aW5ncy5zcGVlZFsgYXhpcyBdO1xufVxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0KHRgtCw0L3QtNCw0YDRgtC90YvQtSDQvdCw0YHRgtGA0L7QudC60Lgg0LrQsNC80LXRgNGLLlxuICogQG5hbWVzcGFjZSB2Ni5zZXR0aW5ncy5jYW1lcmFcbiAqIEBleGFtcGxlXG4gKiB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAndjYuanMvY29yZS9jYW1lcmEvc2V0dGluZ3MnICk7XG4gKi9cblxuLyoqXG4gKiDQoNC10L3QtNC10YDQtdGALlxuICogQG1lbWJlciB7djYuQWJzdHJhY3RSZW5kZXJlcn0gdjYuc2V0dGluZ3MuY2FtZXJhLnJlbmRlcmVyXG4gKi9cblxuLyoqXG4gKiDQodGC0LDQvdC00LDRgNGC0L3Ri9C1INC90LDRgdGC0YDQvtC50LrQuCDQutCw0LzQtdGA0YsuXG4gKiBAbWVtYmVyIHtvYmplY3R9IHY2LnNldHRpbmdzLmNhbWVyYS5zZXR0aW5nc1xuICogQHByb3BlcnR5IHtvYmplY3R9ICAgIFsnem9vbS1vdXQgc3BlZWQnXVxuICogQHByb3BlcnR5IHtudW1iZXJ9ICAgIFsnem9vbS1vdXQgc3BlZWQnLnZhbHVlPTFdICAgICDQodC60L7RgNC+0YHRgtGMINGD0LzQtdC90YzRiNC10L3QuNGPINC80LDRgdGI0YLQsNCx0LAgKNC+0YLQtNCw0LvQtdC90LjRjykg0LrQsNC80LXRgNGLLlxuICogQHByb3BlcnR5IHtib29sZWFufSAgIFsnem9vbS1vdXQgc3BlZWQnLmxpbmVhcj10cnVlXSDQlNC10LvQsNGC0Ywg0LDQvdC40LzQsNGG0LjRjiDQu9C40L3QtdC50L3QvtC5LlxuICogQHByb3BlcnR5IHtvYmplY3R9ICAgIFsnem9vbS1pbiBzcGVlZCddXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWyd6b29tLWluIHNwZWVkJy52YWx1ZT0xXSAgICAgINCh0LrQvtGA0L7RgdGC0Ywg0YPQstC10LvQuNGH0LXQvdC40Y8g0LzQsNGB0YjRgtCw0LHQsCAo0L/RgNC40LHQu9C40LbQtdC90LjRjykg0LrQsNC80LXRgNGLLlxuICogQHByb3BlcnR5IHtib29sZWFufSAgIFsnem9vbS1pbiBzcGVlZCcubGluZWFyPXRydWVdICDQlNC10LvQsNGC0Ywg0LDQvdC40LzQsNGG0LjRjiDQu9C40L3QtdC50L3QvtC5LlxuICogQHByb3BlcnR5IHtvYmplY3R9ICAgIFsnem9vbSddXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWyd6b29tJy52YWx1ZT0xXSAgICAgICAgICAgICAgINCi0LXQutGD0YnQuNC5INC80LDRgdGI0YLQsNCxINC60LDQvNC10YDRiy5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3pvb20nLm1pbj0xXSAgICAgICAgICAgICAgICAg0JzQuNC90LjQvNCw0LvRjNC90YvQuSDQvNCw0YHRiNGC0LDQsSDQutCw0LzQtdGA0YsuXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWyd6b29tJy5tYXg9MV0gICAgICAgICAgICAgICAgINCc0LDQutGB0LjQvNCw0LvRjNC90YvQuSDQvNCw0YHRiNGC0LDQsSDQutCw0LzQtdGA0YsuXG4gKiBAcHJvcGVydHkge29iamVjdH0gICAgWydzcGVlZCddICAgICAgICAgICAgICAgICAgICAgINCh0LrQvtGA0L7RgdGC0Ywg0L3QsNC/0YDQsNCy0LvQtdC90LjRjyDQutCw0LzQtdGA0Ysg0L3QsCDQvtCx0YrQtdC60YIuXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWydzcGVlZCcueD0xXSAgICAgICAgICAgICAgICAgIDEgLSDQvNC+0LzQtdC90YLQsNC70YzQvdC+0LUg0L/QtdGA0LXQvNC10YnQtdC90LjQtSDQv9C+IFgsIDAuMSAtINC80LXQtNC70LXQvdC90L7QtS5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3NwZWVkJy55PTFdICAgICAgICAgICAgICAgICAgMSAtINC80L7QvNC10L3RgtCw0LvRjNC90L7QtSDQv9C10YDQtdC80LXRidC10L3QuNC1INC/0L4gWSwgMC4xIC0g0LzQtdC00LvQtdC90L3QvtC1LlxuICogQHByb3BlcnR5IHtJVmVjdG9yMkR9IFsnb2Zmc2V0J11cbiAqL1xuZXhwb3J0cy5zZXR0aW5ncyA9IHtcbiAgJ3pvb20tb3V0IHNwZWVkJzoge1xuICAgIHZhbHVlOiAgMSxcbiAgICBsaW5lYXI6IHRydWVcbiAgfSxcblxuICAnem9vbS1pbiBzcGVlZCc6IHtcbiAgICB2YWx1ZTogIDEsXG4gICAgbGluZWFyOiB0cnVlXG4gIH0sXG5cbiAgJ3pvb20nOiB7XG4gICAgdmFsdWU6IDEsXG4gICAgbWluOiAgIDEsXG4gICAgbWF4OiAgIDFcbiAgfSxcblxuICAnc3BlZWQnOiB7XG4gICAgeDogMSxcbiAgICB5OiAxXG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gSFNMQTtcblxudmFyIGNsYW1wID0gcmVxdWlyZSggJ3BlYWtvL2NsYW1wJyApOyAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxudmFyIHBhcnNlID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcGFyc2UnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxudmFyIFJHQkEgID0gcmVxdWlyZSggJy4vUkdCQScgKTsgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuLyoqXG4gKiBIU0xBINGG0LLQtdGCLlxuICogQGNvbnN0cnVjdG9yIHY2LkhTTEFcbiAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW2hdIEh1ZSB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW3NdIFNhdHVyYXRpb24gdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtsXSBMaWdodG5lc3MgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSB2YWx1ZS5cbiAqIEBzZWUgdjYuSFNMQSNzZXRcbiAqIEBleGFtcGxlXG4gKiB2YXIgSFNMQSA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2NvbG9yL0hTTEEnICk7XG4gKlxuICogdmFyIHRyYW5zcGFyZW50ID0gbmV3IEhTTEEoICd0cmFuc3BhcmVudCcgKTtcbiAqIHZhciBtYWdlbnRhICAgICA9IG5ldyBIU0xBKCAnbWFnZW50YScgKTtcbiAqIHZhciBmdWNoc2lhICAgICA9IG5ldyBIU0xBKCAzMDAsIDEwMCwgNTAgKTtcbiAqIHZhciBnaG9zdCAgICAgICA9IG5ldyBIU0xBKCAxMDAsIDAuMSApO1xuICogdmFyIHdoaXRlICAgICAgID0gbmV3IEhTTEEoIDEwMCApO1xuICogdmFyIGJsYWNrICAgICAgID0gbmV3IEhTTEEoKTtcbiAqL1xuZnVuY3Rpb24gSFNMQSAoIGgsIHMsIGwsIGEgKVxue1xuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzAgXCJodWVcIiB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSFNMQSMxIFwic2F0dXJhdGlvblwiIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzIgXCJsaWdodG5lc3NcIiB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSFNMQSMzIFwiYWxwaGFcIiB2YWx1ZS5cbiAgICovXG5cbiAgdGhpcy5zZXQoIGgsIHMsIGwsIGEgKTtcbn1cblxuSFNMQS5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQstC+0YHQv9GA0LjQvdC40LzQsNC10LzRg9GOINGP0YDQutC+0YHRgtGMIChwZXJjZWl2ZWQgYnJpZ2h0bmVzcykg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI3BlcmNlaXZlZEJyaWdodG5lc3NcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggJ21hZ2VudGEnICkucGVyY2VpdmVkQnJpZ2h0bmVzcygpOyAvLyAtPiAxNjMuODc1OTQzOTMzMjA4MlxuICAgKi9cbiAgcGVyY2VpdmVkQnJpZ2h0bmVzczogZnVuY3Rpb24gcGVyY2VpdmVkQnJpZ2h0bmVzcyAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLnBlcmNlaXZlZEJyaWdodG5lc3MoKTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0L7RgtC90L7RgdC40YLQtdC70YzQvdGD0Y4g0Y/RgNC60L7RgdGC0Ywg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI2x1bWluYW5jZVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUmVsYXRpdmVfbHVtaW5hbmNlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5sdW1pbmFuY2UoKTsgLy8gLT4gNzIuNjI0XG4gICAqL1xuICBsdW1pbmFuY2U6IGZ1bmN0aW9uIGx1bWluYW5jZSAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLmx1bWluYW5jZSgpO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjYnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL0FFUlQvI2NvbG9yLWNvbnRyYXN0XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5icmlnaHRuZXNzKCk7IC8vIC0+IDEwNS4zMTVcbiAgICovXG4gIGJyaWdodG5lc3M6IGZ1bmN0aW9uIGJyaWdodG5lc3MgKClcbiAge1xuICAgIHJldHVybiB0aGlzLnJnYmEoKS5icmlnaHRuZXNzKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIENTUy1jb2xvciDRgdGC0YDQvtC60YMuXG4gICAqIEBtZXRob2QgdjYuSFNMQSN0b1N0cmluZ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBleGFtcGxlXG4gICAqICcnICsgbmV3IEhTTEEoICdyZWQnICk7IC8vIC0+IFwiaHNsYSgwLCAxMDAlLCA1MCUsIDEpXCJcbiAgICovXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiB0b1N0cmluZyAoKVxuICB7XG4gICAgcmV0dXJuICdoc2xhKCcgKyB0aGlzWyAwIF0gKyAnLCAnICsgdGhpc1sgMSBdICsgJ1xcdTAwMjUsICcgKyB0aGlzWyAyIF0gKyAnXFx1MDAyNSwgJyArIHRoaXNbIDMgXSArICcpJztcbiAgfSxcblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgSCwgUywgTCwgQSDQt9C90LDRh9C10L3QuNGPLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjc2V0XG4gICAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW2hdIEh1ZSB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbc10gU2F0dXJhdGlvbiB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbbF0gTGlnaHRuZXNzIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSB2YWx1ZS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LkhTTEFcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoKS5zZXQoIDEwMCwgMC41ICk7IC8vIC0+IDAsIDAsIDEwMCwgMC41XG4gICAqL1xuICBzZXQ6IGZ1bmN0aW9uIHNldCAoIGgsIHMsIGwsIGEgKVxuICB7XG4gICAgc3dpdGNoICggdHJ1ZSApIHtcbiAgICAgIGNhc2UgdHlwZW9mIGggPT09ICdzdHJpbmcnOlxuICAgICAgICBoID0gcGFyc2UoIGggKTtcbiAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgY2FzZSB0eXBlb2YgaCA9PT0gJ29iamVjdCcgJiYgaCAhPT0gbnVsbDpcbiAgICAgICAgaWYgKCBoLnR5cGUgIT09IHRoaXMudHlwZSApIHtcbiAgICAgICAgICBoID0gaFsgdGhpcy50eXBlIF0oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IGhbIDAgXTtcbiAgICAgICAgdGhpc1sgMSBdID0gaFsgMSBdO1xuICAgICAgICB0aGlzWyAyIF0gPSBoWyAyIF07XG4gICAgICAgIHRoaXNbIDMgXSA9IGhbIDMgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBzd2l0Y2ggKCB2b2lkIDAgKSB7XG4gICAgICAgICAgY2FzZSBoOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBsID0gcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBzOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBsID0gTWF0aC5mbG9vciggaCApO1xuICAgICAgICAgICAgcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBsOlxuICAgICAgICAgICAgYSA9IHM7XG4gICAgICAgICAgICBsID0gTWF0aC5mbG9vciggaCApO1xuICAgICAgICAgICAgcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBhOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGggPSBNYXRoLmZsb29yKCBoICk7XG4gICAgICAgICAgICBzID0gTWF0aC5mbG9vciggcyApO1xuICAgICAgICAgICAgbCA9IE1hdGguZmxvb3IoIGwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IGg7XG4gICAgICAgIHRoaXNbIDEgXSA9IHM7XG4gICAgICAgIHRoaXNbIDIgXSA9IGw7XG4gICAgICAgIHRoaXNbIDMgXSA9IGE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCa0L7QvdCy0LXRgNGC0LjRgNGD0LXRgiDQsiB7QGxpbmsgdjYuUkdCQX0uXG4gICAqIEBtZXRob2QgdjYuSFNMQSNyZ2JhXG4gICAqIEByZXR1cm4ge3Y2LlJHQkF9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5yZ2JhKCk7IC8vIC0+IG5ldyBSR0JBKCAyNTUsIDAsIDI1NSwgMSApXG4gICAqL1xuICByZ2JhOiBmdW5jdGlvbiByZ2JhICgpXG4gIHtcbiAgICB2YXIgcmdiYSA9IG5ldyBSR0JBKCk7XG5cbiAgICB2YXIgaCA9IHRoaXNbIDAgXSAlIDM2MCAvIDM2MDtcbiAgICB2YXIgcyA9IHRoaXNbIDEgXSAqIDAuMDE7XG4gICAgdmFyIGwgPSB0aGlzWyAyIF0gKiAwLjAxO1xuXG4gICAgdmFyIHRyID0gaCArIDEgLyAzO1xuICAgIHZhciB0ZyA9IGg7XG4gICAgdmFyIHRiID0gaCAtIDEgLyAzO1xuXG4gICAgdmFyIHE7XG5cbiAgICBpZiAoIGwgPCAwLjUgKSB7XG4gICAgICBxID0gbCAqICggMSArIHMgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcSA9IGwgKyBzIC0gbCAqIHM7XG4gICAgfVxuXG4gICAgdmFyIHAgPSAyICogbCAtIHE7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuICAgIGlmICggdHIgPCAwICkge1xuICAgICAgKyt0cjtcbiAgICB9XG5cbiAgICBpZiAoIHRnIDwgMCApIHtcbiAgICAgICsrdGc7XG4gICAgfVxuXG4gICAgaWYgKCB0YiA8IDAgKSB7XG4gICAgICArK3RiO1xuICAgIH1cblxuICAgIGlmICggdHIgPiAxICkge1xuICAgICAgLS10cjtcbiAgICB9XG5cbiAgICBpZiAoIHRnID4gMSApIHtcbiAgICAgIC0tdGc7XG4gICAgfVxuXG4gICAgaWYgKCB0YiA+IDEgKSB7XG4gICAgICAtLXRiO1xuICAgIH1cblxuICAgIHJnYmFbIDAgXSA9IGZvbyggdHIsIHAsIHEgKTtcbiAgICByZ2JhWyAxIF0gPSBmb28oIHRnLCBwLCBxICk7XG4gICAgcmdiYVsgMiBdID0gZm9vKCB0YiwgcCwgcSApO1xuICAgIHJnYmFbIDMgXSA9IHRoaXNbIDMgXTtcblxuICAgIHJldHVybiByZ2JhO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5IU0xBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjbGVycFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBoXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHNcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgbFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB2YWx1ZVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAc2VlIHY2LkhTTEEjbGVycENvbG9yXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCA1MCwgMC4yNSApLmxlcnAoIDAsIDAsIDEwMCwgMC41ICk7IC8vIC0+IG5ldyBIU0xBKCAwLCAwLCA3NSwgMC4yNSApXG4gICAqL1xuICBsZXJwOiBmdW5jdGlvbiBsZXJwICggaCwgcywgbCwgdmFsdWUgKVxuICB7XG4gICAgdmFyIGNvbG9yID0gbmV3IEhTTEEoKTtcbiAgICBjb2xvclsgMCBdID0gaDtcbiAgICBjb2xvclsgMSBdID0gcztcbiAgICBjb2xvclsgMiBdID0gbDtcbiAgICByZXR1cm4gdGhpcy5sZXJwQ29sb3IoIGNvbG9yLCB2YWx1ZSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5IU0xBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyBgY29sb3JgLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjbGVycENvbG9yXG4gICAqIEBwYXJhbSAge1RDb2xvcn0gIGNvbG9yXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHZhbHVlXG4gICAqIEByZXR1cm4ge3Y2LkhTTEF9XG4gICAqIEBzZWUgdjYuSFNMQSNsZXJwXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBhID0gbmV3IEhTTEEoIDUwLCAwLjI1ICk7XG4gICAqIHZhciBiID0gbmV3IEhTTEEoIDEwMCwgMCApO1xuICAgKiB2YXIgYyA9IGEubGVycENvbG9yKCBiLCAwLjUgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDAsIDc1LCAwLjI1IClcbiAgICovXG4gIGxlcnBDb2xvcjogZnVuY3Rpb24gbGVycENvbG9yICggY29sb3IsIHZhbHVlIClcbiAge1xuICAgIHJldHVybiB0aGlzLnJnYmEoKS5sZXJwQ29sb3IoIGNvbG9yLCB2YWx1ZSApLmhzbGEoKTtcbiAgfSxcblxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSB7QGxpbmsgdjYuSFNMQX0gLSDQt9Cw0YLQtdC80L3QtdC90L3Ri9C5INC40LvQuCDQt9Cw0YHQstC10YLQu9C10L3QvdGL0Lkg0L3QsCBgcGVyY2VudGFnZWAg0L/RgNC+0YbQtdC90YLQvtCyLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjc2hhZGVcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgcGVyY2VudGFnZVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggMCwgMTAwLCA3NSwgMSApLnNoYWRlKCAtMTAgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDEwMCwgNjUsIDEgKVxuICAgKi9cbiAgc2hhZGU6IGZ1bmN0aW9uIHNoYWRlICggcGVyY2VudGFnZSApXG4gIHtcbiAgICB2YXIgaHNsYSA9IG5ldyBIU0xBKCk7XG4gICAgaHNsYVsgMCBdID0gdGhpc1sgMCBdO1xuICAgIGhzbGFbIDEgXSA9IHRoaXNbIDEgXTtcbiAgICBoc2xhWyAyIF0gPSBjbGFtcCggdGhpc1sgMiBdICsgcGVyY2VudGFnZSwgMCwgMTAwICk7XG4gICAgaHNsYVsgMyBdID0gdGhpc1sgMyBdO1xuICAgIHJldHVybiBoc2xhO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBIU0xBXG59O1xuXG4vKipcbiAqIEBtZW1iZXIge3N0cmluZ30gdjYuSFNMQSN0eXBlIGBcImhzbGFcImAuINCt0YLQviDRgdCy0L7QudGB0YLQstC+INC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0LrQvtC90LLQtdGA0YLQuNGA0L7QstCw0L3QuNGPINC80LXQttC00YMge0BsaW5rIHY2LlJHQkF9INC4IHtAbGluayB2Ni5IU0xBfS5cbiAqL1xuSFNMQS5wcm90b3R5cGUudHlwZSA9ICdoc2xhJztcblxuZnVuY3Rpb24gZm9vICggdCwgcCwgcSApXG57XG4gIGlmICggdCA8IDEgLyA2ICkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCAoIHAgKyAoIHEgLSBwICkgKiA2ICogdCApICogMjU1ICk7XG4gIH1cblxuICBpZiAoIHQgPCAwLjUgKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoIHEgKiAyNTUgKTtcbiAgfVxuXG4gIGlmICggdCA8IDIgLyAzICkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCAoIHAgKyAoIHEgLSBwICkgKiAoIDIgLyAzIC0gdCApICogNiApICogMjU1ICk7XG4gIH1cblxuICByZXR1cm4gTWF0aC5yb3VuZCggcCAqIDI1NSApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJHQkE7XG5cbnZhciBwYXJzZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3BhcnNlJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbnZhciBIU0xBICA9IHJlcXVpcmUoICcuL0hTTEEnICk7ICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbi8qKlxuICogUkdCQSDRhtCy0LXRgi5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5SR0JBXG4gKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXSBSZWQgY2hhbm5lbCB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2ddIEdyZWVuIGNoYW5uZWwgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtiXSBCbHVlIGNoYW5uZWwgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSBjaGFubmVsIHZhbHVlLlxuICogQHNlZSB2Ni5SR0JBI3NldFxuICogQGV4YW1wbGVcbiAqIHZhciBSR0JBID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29sb3IvUkdCQScgKTtcbiAqXG4gKiB2YXIgdHJhbnNwYXJlbnQgPSBuZXcgUkdCQSggJ3RyYW5zcGFyZW50JyApO1xuICogdmFyIG1hZ2VudGEgICAgID0gbmV3IFJHQkEoICdtYWdlbnRhJyApO1xuICogdmFyIGZ1Y2hzaWEgICAgID0gbmV3IFJHQkEoIDI1NSwgMCwgMjU1ICk7XG4gKiB2YXIgZ2hvc3QgICAgICAgPSBuZXcgUkdCQSggMjU1LCAwLjEgKTtcbiAqIHZhciB3aGl0ZSAgICAgICA9IG5ldyBSR0JBKCAyNTUgKTtcbiAqIHZhciBibGFjayAgICAgICA9IG5ldyBSR0JBKCk7XG4gKi9cbmZ1bmN0aW9uIFJHQkEgKCByLCBnLCBiLCBhIClcbntcbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMwIFwicmVkXCIgY2hhbm5lbCB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMxIFwiZ3JlZW5cIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5SR0JBIzIgXCJibHVlXCIgY2hhbm5lbCB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMzIFwiYWxwaGFcIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICB0aGlzLnNldCggciwgZywgYiwgYSApO1xufVxuXG5SR0JBLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINCy0L7RgdC/0YDQuNC90LjQvNCw0LXQvNGD0Y4g0Y/RgNC60L7RgdGC0YwgKHBlcmNlaXZlZCBicmlnaHRuZXNzKSDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjcGVyY2VpdmVkQnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzU5NjI0M1xuICAgKiBAc2VlIGh0dHA6Ly9hbGllbnJ5ZGVyZmxleC5jb20vaHNwLmh0bWxcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoICdtYWdlbnRhJyApLnBlcmNlaXZlZEJyaWdodG5lc3MoKTsgLy8gLT4gMTYzLjg3NTk0MzkzMzIwODJcbiAgICovXG4gIHBlcmNlaXZlZEJyaWdodG5lc3M6IGZ1bmN0aW9uIHBlcmNlaXZlZEJyaWdodG5lc3MgKClcbiAge1xuICAgIHZhciByID0gdGhpc1sgMCBdO1xuICAgIHZhciBnID0gdGhpc1sgMSBdO1xuICAgIHZhciBiID0gdGhpc1sgMiBdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoIDAuMjk5ICogciAqIHIgKyAwLjU4NyAqIGcgKiBnICsgMC4xMTQgKiBiICogYiApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQvtGC0L3QvtGB0LjRgtC10LvRjNC90YPRjiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjbHVtaW5hbmNlXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SZWxhdGl2ZV9sdW1pbmFuY2VcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoICdtYWdlbnRhJyApLmx1bWluYW5jZSgpOyAvLyAtPiA3Mi42MjRcbiAgICovXG4gIGx1bWluYW5jZTogZnVuY3Rpb24gbHVtaW5hbmNlICgpXG4gIHtcbiAgICByZXR1cm4gdGhpc1sgMCBdICogMC4yMTI2ICsgdGhpc1sgMSBdICogMC43MTUyICsgdGhpc1sgMiBdICogMC4wNzIyO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjYnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL0FFUlQvI2NvbG9yLWNvbnRyYXN0XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAnbWFnZW50YScgKS5icmlnaHRuZXNzKCk7IC8vIC0+IDEwNS4zMTVcbiAgICovXG4gIGJyaWdodG5lc3M6IGZ1bmN0aW9uIGJyaWdodG5lc3MgKClcbiAge1xuICAgIHJldHVybiAwLjI5OSAqIHRoaXNbIDAgXSArIDAuNTg3ICogdGhpc1sgMSBdICsgMC4xMTQgKiB0aGlzWyAyIF07XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIENTUy1jb2xvciDRgdGC0YDQvtC60YMuXG4gICAqIEBtZXRob2QgdjYuUkdCQSN0b1N0cmluZ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBleGFtcGxlXG4gICAqICcnICsgbmV3IFJHQkEoICdtYWdlbnRhJyApOyAvLyAtPiBcInJnYmEoMjU1LCAwLCAyNTUsIDEpXCJcbiAgICovXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiB0b1N0cmluZyAoKVxuICB7XG4gICAgcmV0dXJuICdyZ2JhKCcgKyB0aGlzWyAwIF0gKyAnLCAnICsgdGhpc1sgMSBdICsgJywgJyArIHRoaXNbIDIgXSArICcsICcgKyB0aGlzWyAzIF0gKyAnKSc7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIFIsIEcsIEIsIEEg0LfQvdCw0YfQtdC90LjRjy5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI3NldFxuICAgKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXSBSZWQgY2hhbm5lbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbZ10gR3JlZW4gY2hhbm5lbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbYl0gQmx1ZSBjaGFubmVsIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSBjaGFubmVsIHZhbHVlLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuUkdCQVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSgpXG4gICAqICAgLnNldCggJ21hZ2VudGEnICkgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmZjAwZmZmZicgKSAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmZjAwZmYnICkgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmMDA3JyApICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMCwgMC40N1xuICAgKiAgIC5zZXQoICcjZjAwJyApICAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAyNTUsIDAsIDAsIDFcbiAgICogICAuc2V0KCAnaHNsYSggMCwgMTAwJSwgNTAlLCAwLjQ3ICknICkgLy8gLT4gMjU1LCAwLCAwLCAwLjQ3XG4gICAqICAgLnNldCggJ3JnYiggMCwgMCwgMCApJyApICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDFcbiAgICogICAuc2V0KCAwICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMVxuICAgKiAgIC5zZXQoIDAsIDAsIDAgKSAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAwLCAwLCAwLCAxXG4gICAqICAgLnNldCggMCwgMCApICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDBcbiAgICogICAuc2V0KCAwLCAwLCAwLCAwICk7ICAgICAgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMFxuICAgKi9cbiAgc2V0OiBmdW5jdGlvbiBzZXQgKCByLCBnLCBiLCBhIClcbiAge1xuICAgIHN3aXRjaCAoIHRydWUgKSB7XG4gICAgICBjYXNlIHR5cGVvZiByID09PSAnc3RyaW5nJzpcbiAgICAgICAgciA9IHBhcnNlKCByICk7XG4gICAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgIGNhc2UgdHlwZW9mIHIgPT09ICdvYmplY3QnICYmIHIgIT09IG51bGw6XG4gICAgICAgIGlmICggci50eXBlICE9PSB0aGlzLnR5cGUgKSB7XG4gICAgICAgICAgciA9IHJbIHRoaXMudHlwZSBdKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzWyAwIF0gPSByWyAwIF07XG4gICAgICAgIHRoaXNbIDEgXSA9IHJbIDEgXTtcbiAgICAgICAgdGhpc1sgMiBdID0gclsgMiBdO1xuICAgICAgICB0aGlzWyAzIF0gPSByWyAzIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgc3dpdGNoICggdm9pZCAwICkge1xuICAgICAgICAgIGNhc2UgcjpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgYiA9IGcgPSByID0gMDsgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBnOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBiID0gZyA9IHIgPSBNYXRoLmZsb29yKCByICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGI6XG4gICAgICAgICAgICBhID0gZztcbiAgICAgICAgICAgIGIgPSBnID0gciA9IE1hdGguZmxvb3IoIHIgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgYTpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByID0gTWF0aC5mbG9vciggciApO1xuICAgICAgICAgICAgZyA9IE1hdGguZmxvb3IoIGcgKTtcbiAgICAgICAgICAgIGIgPSBNYXRoLmZsb29yKCBiICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzWyAwIF0gPSByO1xuICAgICAgICB0aGlzWyAxIF0gPSBnO1xuICAgICAgICB0aGlzWyAyIF0gPSBiO1xuICAgICAgICB0aGlzWyAzIF0gPSBhO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQmtC+0L3QstC10YDRgtC40YDRg9C10YIg0LIge0BsaW5rIHY2LkhTTEF9LlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjaHNsYVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSggMjU1LCAwLCAwLCAxICkuaHNsYSgpOyAvLyAtPiBuZXcgSFNMQSggMCwgMTAwLCA1MCwgMSApXG4gICAqL1xuICBoc2xhOiBmdW5jdGlvbiBoc2xhICgpXG4gIHtcbiAgICB2YXIgaHNsYSA9IG5ldyBIU0xBKCk7XG5cbiAgICB2YXIgciA9IHRoaXNbIDAgXSAvIDI1NTtcbiAgICB2YXIgZyA9IHRoaXNbIDEgXSAvIDI1NTtcbiAgICB2YXIgYiA9IHRoaXNbIDIgXSAvIDI1NTtcblxuICAgIHZhciBtYXggPSBNYXRoLm1heCggciwgZywgYiApO1xuICAgIHZhciBtaW4gPSBNYXRoLm1pbiggciwgZywgYiApO1xuXG4gICAgdmFyIGwgPSAoIG1heCArIG1pbiApICogNTA7XG4gICAgdmFyIGgsIHM7XG5cbiAgICB2YXIgZGlmZiA9IG1heCAtIG1pbjtcblxuICAgIGlmICggZGlmZiApIHtcbiAgICAgIGlmICggbCA+IDUwICkge1xuICAgICAgICBzID0gZGlmZiAvICggMiAtIG1heCAtIG1pbiApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcyA9IGRpZmYgLyAoIG1heCArIG1pbiApO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKCBtYXggKSB7XG4gICAgICAgIGNhc2UgcjpcbiAgICAgICAgICBpZiAoIGcgPCBiICkge1xuICAgICAgICAgICAgaCA9IDEuMDQ3MiAqICggZyAtIGIgKSAvIGRpZmYgKyA2LjI4MzI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGggPSAxLjA0NzIgKiAoIGcgLSBiICkgLyBkaWZmO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIGc6XG4gICAgICAgICAgaCA9IDEuMDQ3MiAqICggYiAtIHIgKSAvIGRpZmYgKyAyLjA5NDQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaCA9IDEuMDQ3MiAqICggciAtIGcgKSAvIGRpZmYgKyA0LjE4ODg7XG4gICAgICB9XG5cbiAgICAgIGggPSBNYXRoLnJvdW5kKCBoICogMzYwIC8gNi4yODMyICk7XG4gICAgICBzID0gTWF0aC5yb3VuZCggcyAqIDEwMCApO1xuICAgIH0gZWxzZSB7XG4gICAgICBoID0gcyA9IDA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgfVxuXG4gICAgaHNsYVsgMCBdID0gaDtcbiAgICBoc2xhWyAxIF0gPSBzO1xuICAgIGhzbGFbIDIgXSA9IE1hdGgucm91bmQoIGwgKTtcbiAgICBoc2xhWyAzIF0gPSB0aGlzWyAzIF07XG5cbiAgICByZXR1cm4gaHNsYTtcbiAgfSxcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQG1ldGhvZCB2Ni5SR0JBI3JnYmFcbiAgICogQHNlZSB2Ni5SZW5kZXJlckdMI3ZlcnRpY2VzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHJnYmE6IGZ1bmN0aW9uIHJnYmEgKClcbiAge1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5SR0JBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjbGVycFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICByXG4gICAqIEBwYXJhbSAge251bWJlcn0gIGdcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgYlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB2YWx1ZVxuICAgKiBAcmV0dXJuIHt2Ni5SR0JBfVxuICAgKiBAc2VlIHY2LlJHQkEjbGVycENvbG9yXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAxMDAsIDAuMjUgKS5sZXJwKCAyMDAsIDIwMCwgMjAwLCAwLjUgKTsgLy8gLT4gbmV3IFJHQkEoIDE1MCwgMTUwLCAxNTAsIDAuMjUgKVxuICAgKi9cbiAgbGVycDogZnVuY3Rpb24gbGVycCAoIHIsIGcsIGIsIHZhbHVlIClcbiAge1xuICAgIHIgPSB0aGlzWyAwIF0gKyAoIHIgLSB0aGlzWyAwIF0gKSAqIHZhbHVlO1xuICAgIGcgPSB0aGlzWyAxIF0gKyAoIGcgLSB0aGlzWyAxIF0gKSAqIHZhbHVlO1xuICAgIGIgPSB0aGlzWyAyIF0gKyAoIGIgLSB0aGlzWyAyIF0gKSAqIHZhbHVlO1xuICAgIHJldHVybiBuZXcgUkdCQSggciwgZywgYiwgdGhpc1sgMyBdICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LlJHQkF9IC0g0LjQvdGC0LXRgNC/0L7Qu9C40YDQvtCy0LDQvdC90YvQuSDQvNC10LbQtNGDIGBjb2xvcmAuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNsZXJwQ29sb3JcbiAgICogQHBhcmFtICB7VENvbG9yfSAgY29sb3JcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgdmFsdWVcbiAgICogQHJldHVybiB7djYuUkdCQX1cbiAgICogQHNlZSB2Ni5SR0JBI2xlcnBcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIGEgPSBuZXcgUkdCQSggMTAwLCAwLjI1ICk7XG4gICAqIHZhciBiID0gbmV3IFJHQkEoIDIwMCwgMCApO1xuICAgKiB2YXIgYyA9IGEubGVycENvbG9yKCBiLCAwLjUgKTsgLy8gLT4gbmV3IFJHQkEoIDE1MCwgMTUwLCAxNTAsIDAuMjUgKVxuICAgKi9cbiAgbGVycENvbG9yOiBmdW5jdGlvbiBsZXJwQ29sb3IgKCBjb2xvciwgdmFsdWUgKVxuICB7XG4gICAgdmFyIHIsIGcsIGI7XG5cbiAgICBpZiAoIHR5cGVvZiBjb2xvciAhPT0gJ29iamVjdCcgKSB7XG4gICAgICBjb2xvciA9IHBhcnNlKCBjb2xvciApO1xuICAgIH1cblxuICAgIGlmICggY29sb3IudHlwZSAhPT0gJ3JnYmEnICkge1xuICAgICAgY29sb3IgPSBjb2xvci5yZ2JhKCk7XG4gICAgfVxuXG4gICAgciA9IGNvbG9yWyAwIF07XG4gICAgZyA9IGNvbG9yWyAxIF07XG4gICAgYiA9IGNvbG9yWyAyIF07XG5cbiAgICByZXR1cm4gdGhpcy5sZXJwKCByLCBnLCBiLCB2YWx1ZSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5SR0JBfSAtINC30LDRgtC10LzQvdC10L3QvdGL0Lkg0LjQu9C4INC30LDRgdCy0LXRgtC70LXQvdC90YvQuSDQvdCwIGBwZXJjZW50YWdlc2Ag0L/RgNC+0YbQtdC90YLQvtCyLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjc2hhZGVcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgcGVyY2VudGFnZVxuICAgKiBAcmV0dXJuIHt2Ni5SR0JBfVxuICAgKiBAc2VlIHY2LkhTTEEjc2hhZGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoKS5zaGFkZSggNTAgKTsgLy8gLT4gbmV3IFJHQkEoIDEyOCApXG4gICAqL1xuICBzaGFkZTogZnVuY3Rpb24gc2hhZGUgKCBwZXJjZW50YWdlcyApXG4gIHtcbiAgICByZXR1cm4gdGhpcy5oc2xhKCkuc2hhZGUoIHBlcmNlbnRhZ2VzICkucmdiYSgpO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBSR0JBXG59O1xuXG4vKipcbiAqIEBtZW1iZXIge3N0cmluZ30gdjYuUkdCQSN0eXBlIGBcInJnYmFcImAuINCt0YLQviDRgdCy0L7QudGB0YLQstC+INC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0LrQvtC90LLQtdGA0YLQuNGA0L7QstCw0L3QuNGPINC80LXQttC00YMge0BsaW5rIHY2LkhTTEF9INC4IHtAbGluayB2Ni5SR0JBfS5cbiAqL1xuUkdCQS5wcm90b3R5cGUudHlwZSA9ICdyZ2JhJztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogZXNsaW50IGtleS1zcGFjaW5nOiBbIFwiZXJyb3JcIiwgeyBcImFsaWduXCI6IHsgXCJiZWZvcmVDb2xvblwiOiBmYWxzZSwgXCJhZnRlckNvbG9uXCI6IHRydWUsIFwib25cIjogXCJ2YWx1ZVwiIH0gfSBdICovXG5cbnZhciBjb2xvcnMgPSB7XG4gIGFsaWNlYmx1ZTogICAgICAgICAgICAnZjBmOGZmZmYnLCBhbnRpcXVld2hpdGU6ICAgICAgICAgJ2ZhZWJkN2ZmJyxcbiAgYXF1YTogICAgICAgICAgICAgICAgICcwMGZmZmZmZicsIGFxdWFtYXJpbmU6ICAgICAgICAgICAnN2ZmZmQ0ZmYnLFxuICBhenVyZTogICAgICAgICAgICAgICAgJ2YwZmZmZmZmJywgYmVpZ2U6ICAgICAgICAgICAgICAgICdmNWY1ZGNmZicsXG4gIGJpc3F1ZTogICAgICAgICAgICAgICAnZmZlNGM0ZmYnLCBibGFjazogICAgICAgICAgICAgICAgJzAwMDAwMGZmJyxcbiAgYmxhbmNoZWRhbG1vbmQ6ICAgICAgICdmZmViY2RmZicsIGJsdWU6ICAgICAgICAgICAgICAgICAnMDAwMGZmZmYnLFxuICBibHVldmlvbGV0OiAgICAgICAgICAgJzhhMmJlMmZmJywgYnJvd246ICAgICAgICAgICAgICAgICdhNTJhMmFmZicsXG4gIGJ1cmx5d29vZDogICAgICAgICAgICAnZGViODg3ZmYnLCBjYWRldGJsdWU6ICAgICAgICAgICAgJzVmOWVhMGZmJyxcbiAgY2hhcnRyZXVzZTogICAgICAgICAgICc3ZmZmMDBmZicsIGNob2NvbGF0ZTogICAgICAgICAgICAnZDI2OTFlZmYnLFxuICBjb3JhbDogICAgICAgICAgICAgICAgJ2ZmN2Y1MGZmJywgY29ybmZsb3dlcmJsdWU6ICAgICAgICc2NDk1ZWRmZicsXG4gIGNvcm5zaWxrOiAgICAgICAgICAgICAnZmZmOGRjZmYnLCBjcmltc29uOiAgICAgICAgICAgICAgJ2RjMTQzY2ZmJyxcbiAgY3lhbjogICAgICAgICAgICAgICAgICcwMGZmZmZmZicsIGRhcmtibHVlOiAgICAgICAgICAgICAnMDAwMDhiZmYnLFxuICBkYXJrY3lhbjogICAgICAgICAgICAgJzAwOGI4YmZmJywgZGFya2dvbGRlbnJvZDogICAgICAgICdiODg2MGJmZicsXG4gIGRhcmtncmF5OiAgICAgICAgICAgICAnYTlhOWE5ZmYnLCBkYXJrZ3JlZW46ICAgICAgICAgICAgJzAwNjQwMGZmJyxcbiAgZGFya2toYWtpOiAgICAgICAgICAgICdiZGI3NmJmZicsIGRhcmttYWdlbnRhOiAgICAgICAgICAnOGIwMDhiZmYnLFxuICBkYXJrb2xpdmVncmVlbjogICAgICAgJzU1NmIyZmZmJywgZGFya29yYW5nZTogICAgICAgICAgICdmZjhjMDBmZicsXG4gIGRhcmtvcmNoaWQ6ICAgICAgICAgICAnOTkzMmNjZmYnLCBkYXJrcmVkOiAgICAgICAgICAgICAgJzhiMDAwMGZmJyxcbiAgZGFya3NhbG1vbjogICAgICAgICAgICdlOTk2N2FmZicsIGRhcmtzZWFncmVlbjogICAgICAgICAnOGZiYzhmZmYnLFxuICBkYXJrc2xhdGVibHVlOiAgICAgICAgJzQ4M2Q4YmZmJywgZGFya3NsYXRlZ3JheTogICAgICAgICcyZjRmNGZmZicsXG4gIGRhcmt0dXJxdW9pc2U6ICAgICAgICAnMDBjZWQxZmYnLCBkYXJrdmlvbGV0OiAgICAgICAgICAgJzk0MDBkM2ZmJyxcbiAgZGVlcHBpbms6ICAgICAgICAgICAgICdmZjE0OTNmZicsIGRlZXBza3libHVlOiAgICAgICAgICAnMDBiZmZmZmYnLFxuICBkaW1ncmF5OiAgICAgICAgICAgICAgJzY5Njk2OWZmJywgZG9kZ2VyYmx1ZTogICAgICAgICAgICcxZTkwZmZmZicsXG4gIGZlbGRzcGFyOiAgICAgICAgICAgICAnZDE5Mjc1ZmYnLCBmaXJlYnJpY2s6ICAgICAgICAgICAgJ2IyMjIyMmZmJyxcbiAgZmxvcmFsd2hpdGU6ICAgICAgICAgICdmZmZhZjBmZicsIGZvcmVzdGdyZWVuOiAgICAgICAgICAnMjI4YjIyZmYnLFxuICBmdWNoc2lhOiAgICAgICAgICAgICAgJ2ZmMDBmZmZmJywgZ2FpbnNib3JvOiAgICAgICAgICAgICdkY2RjZGNmZicsXG4gIGdob3N0d2hpdGU6ICAgICAgICAgICAnZjhmOGZmZmYnLCBnb2xkOiAgICAgICAgICAgICAgICAgJ2ZmZDcwMGZmJyxcbiAgZ29sZGVucm9kOiAgICAgICAgICAgICdkYWE1MjBmZicsIGdyYXk6ICAgICAgICAgICAgICAgICAnODA4MDgwZmYnLFxuICBncmVlbjogICAgICAgICAgICAgICAgJzAwODAwMGZmJywgZ3JlZW55ZWxsb3c6ICAgICAgICAgICdhZGZmMmZmZicsXG4gIGhvbmV5ZGV3OiAgICAgICAgICAgICAnZjBmZmYwZmYnLCBob3RwaW5rOiAgICAgICAgICAgICAgJ2ZmNjliNGZmJyxcbiAgaW5kaWFucmVkOiAgICAgICAgICAgICdjZDVjNWNmZicsIGluZGlnbzogICAgICAgICAgICAgICAnNGIwMDgyZmYnLFxuICBpdm9yeTogICAgICAgICAgICAgICAgJ2ZmZmZmMGZmJywga2hha2k6ICAgICAgICAgICAgICAgICdmMGU2OGNmZicsXG4gIGxhdmVuZGVyOiAgICAgICAgICAgICAnZTZlNmZhZmYnLCBsYXZlbmRlcmJsdXNoOiAgICAgICAgJ2ZmZjBmNWZmJyxcbiAgbGF3bmdyZWVuOiAgICAgICAgICAgICc3Y2ZjMDBmZicsIGxlbW9uY2hpZmZvbjogICAgICAgICAnZmZmYWNkZmYnLFxuICBsaWdodGJsdWU6ICAgICAgICAgICAgJ2FkZDhlNmZmJywgbGlnaHRjb3JhbDogICAgICAgICAgICdmMDgwODBmZicsXG4gIGxpZ2h0Y3lhbjogICAgICAgICAgICAnZTBmZmZmZmYnLCBsaWdodGdvbGRlbnJvZHllbGxvdzogJ2ZhZmFkMmZmJyxcbiAgbGlnaHRncmV5OiAgICAgICAgICAgICdkM2QzZDNmZicsIGxpZ2h0Z3JlZW46ICAgICAgICAgICAnOTBlZTkwZmYnLFxuICBsaWdodHBpbms6ICAgICAgICAgICAgJ2ZmYjZjMWZmJywgbGlnaHRzYWxtb246ICAgICAgICAgICdmZmEwN2FmZicsXG4gIGxpZ2h0c2VhZ3JlZW46ICAgICAgICAnMjBiMmFhZmYnLCBsaWdodHNreWJsdWU6ICAgICAgICAgJzg3Y2VmYWZmJyxcbiAgbGlnaHRzbGF0ZWJsdWU6ICAgICAgICc4NDcwZmZmZicsIGxpZ2h0c2xhdGVncmF5OiAgICAgICAnNzc4ODk5ZmYnLFxuICBsaWdodHN0ZWVsYmx1ZTogICAgICAgJ2IwYzRkZWZmJywgbGlnaHR5ZWxsb3c6ICAgICAgICAgICdmZmZmZTBmZicsXG4gIGxpbWU6ICAgICAgICAgICAgICAgICAnMDBmZjAwZmYnLCBsaW1lZ3JlZW46ICAgICAgICAgICAgJzMyY2QzMmZmJyxcbiAgbGluZW46ICAgICAgICAgICAgICAgICdmYWYwZTZmZicsIG1hZ2VudGE6ICAgICAgICAgICAgICAnZmYwMGZmZmYnLFxuICBtYXJvb246ICAgICAgICAgICAgICAgJzgwMDAwMGZmJywgbWVkaXVtYXF1YW1hcmluZTogICAgICc2NmNkYWFmZicsXG4gIG1lZGl1bWJsdWU6ICAgICAgICAgICAnMDAwMGNkZmYnLCBtZWRpdW1vcmNoaWQ6ICAgICAgICAgJ2JhNTVkM2ZmJyxcbiAgbWVkaXVtcHVycGxlOiAgICAgICAgICc5MzcwZDhmZicsIG1lZGl1bXNlYWdyZWVuOiAgICAgICAnM2NiMzcxZmYnLFxuICBtZWRpdW1zbGF0ZWJsdWU6ICAgICAgJzdiNjhlZWZmJywgbWVkaXVtc3ByaW5nZ3JlZW46ICAgICcwMGZhOWFmZicsXG4gIG1lZGl1bXR1cnF1b2lzZTogICAgICAnNDhkMWNjZmYnLCBtZWRpdW12aW9sZXRyZWQ6ICAgICAgJ2M3MTU4NWZmJyxcbiAgbWlkbmlnaHRibHVlOiAgICAgICAgICcxOTE5NzBmZicsIG1pbnRjcmVhbTogICAgICAgICAgICAnZjVmZmZhZmYnLFxuICBtaXN0eXJvc2U6ICAgICAgICAgICAgJ2ZmZTRlMWZmJywgbW9jY2FzaW46ICAgICAgICAgICAgICdmZmU0YjVmZicsXG4gIG5hdmFqb3doaXRlOiAgICAgICAgICAnZmZkZWFkZmYnLCBuYXZ5OiAgICAgICAgICAgICAgICAgJzAwMDA4MGZmJyxcbiAgb2xkbGFjZTogICAgICAgICAgICAgICdmZGY1ZTZmZicsIG9saXZlOiAgICAgICAgICAgICAgICAnODA4MDAwZmYnLFxuICBvbGl2ZWRyYWI6ICAgICAgICAgICAgJzZiOGUyM2ZmJywgb3JhbmdlOiAgICAgICAgICAgICAgICdmZmE1MDBmZicsXG4gIG9yYW5nZXJlZDogICAgICAgICAgICAnZmY0NTAwZmYnLCBvcmNoaWQ6ICAgICAgICAgICAgICAgJ2RhNzBkNmZmJyxcbiAgcGFsZWdvbGRlbnJvZDogICAgICAgICdlZWU4YWFmZicsIHBhbGVncmVlbjogICAgICAgICAgICAnOThmYjk4ZmYnLFxuICBwYWxldHVycXVvaXNlOiAgICAgICAgJ2FmZWVlZWZmJywgcGFsZXZpb2xldHJlZDogICAgICAgICdkODcwOTNmZicsXG4gIHBhcGF5YXdoaXA6ICAgICAgICAgICAnZmZlZmQ1ZmYnLCBwZWFjaHB1ZmY6ICAgICAgICAgICAgJ2ZmZGFiOWZmJyxcbiAgcGVydTogICAgICAgICAgICAgICAgICdjZDg1M2ZmZicsIHBpbms6ICAgICAgICAgICAgICAgICAnZmZjMGNiZmYnLFxuICBwbHVtOiAgICAgICAgICAgICAgICAgJ2RkYTBkZGZmJywgcG93ZGVyYmx1ZTogICAgICAgICAgICdiMGUwZTZmZicsXG4gIHB1cnBsZTogICAgICAgICAgICAgICAnODAwMDgwZmYnLCByZWQ6ICAgICAgICAgICAgICAgICAgJ2ZmMDAwMGZmJyxcbiAgcm9zeWJyb3duOiAgICAgICAgICAgICdiYzhmOGZmZicsIHJveWFsYmx1ZTogICAgICAgICAgICAnNDE2OWUxZmYnLFxuICBzYWRkbGVicm93bjogICAgICAgICAgJzhiNDUxM2ZmJywgc2FsbW9uOiAgICAgICAgICAgICAgICdmYTgwNzJmZicsXG4gIHNhbmR5YnJvd246ICAgICAgICAgICAnZjRhNDYwZmYnLCBzZWFncmVlbjogICAgICAgICAgICAgJzJlOGI1N2ZmJyxcbiAgc2Vhc2hlbGw6ICAgICAgICAgICAgICdmZmY1ZWVmZicsIHNpZW5uYTogICAgICAgICAgICAgICAnYTA1MjJkZmYnLFxuICBzaWx2ZXI6ICAgICAgICAgICAgICAgJ2MwYzBjMGZmJywgc2t5Ymx1ZTogICAgICAgICAgICAgICc4N2NlZWJmZicsXG4gIHNsYXRlYmx1ZTogICAgICAgICAgICAnNmE1YWNkZmYnLCBzbGF0ZWdyYXk6ICAgICAgICAgICAgJzcwODA5MGZmJyxcbiAgc25vdzogICAgICAgICAgICAgICAgICdmZmZhZmFmZicsIHNwcmluZ2dyZWVuOiAgICAgICAgICAnMDBmZjdmZmYnLFxuICBzdGVlbGJsdWU6ICAgICAgICAgICAgJzQ2ODJiNGZmJywgdGFuOiAgICAgICAgICAgICAgICAgICdkMmI0OGNmZicsXG4gIHRlYWw6ICAgICAgICAgICAgICAgICAnMDA4MDgwZmYnLCB0aGlzdGxlOiAgICAgICAgICAgICAgJ2Q4YmZkOGZmJyxcbiAgdG9tYXRvOiAgICAgICAgICAgICAgICdmZjYzNDdmZicsIHR1cnF1b2lzZTogICAgICAgICAgICAnNDBlMGQwZmYnLFxuICB2aW9sZXQ6ICAgICAgICAgICAgICAgJ2VlODJlZWZmJywgdmlvbGV0cmVkOiAgICAgICAgICAgICdkMDIwOTBmZicsXG4gIHdoZWF0OiAgICAgICAgICAgICAgICAnZjVkZWIzZmYnLCB3aGl0ZTogICAgICAgICAgICAgICAgJ2ZmZmZmZmZmJyxcbiAgd2hpdGVzbW9rZTogICAgICAgICAgICdmNWY1ZjVmZicsIHllbGxvdzogICAgICAgICAgICAgICAnZmZmZjAwZmYnLFxuICB5ZWxsb3dncmVlbjogICAgICAgICAgJzlhY2QzMmZmJywgdHJhbnNwYXJlbnQ6ICAgICAgICAgICcwMDAwMDAwMCdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY29sb3JzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlO1xuXG52YXIgUkdCQSAgID0gcmVxdWlyZSggJy4uL1JHQkEnICk7XG52YXIgSFNMQSAgID0gcmVxdWlyZSggJy4uL0hTTEEnICk7XG52YXIgY29sb3JzID0gcmVxdWlyZSggJy4vY29sb3JzJyApO1xuXG52YXIgcGFyc2VkID0gT2JqZWN0LmNyZWF0ZSggbnVsbCApO1xuXG52YXIgVFJBTlNQQVJFTlQgPSBbXG4gIDAsIDAsIDAsIDBcbl07XG5cbnZhciByZWdleHBzID0ge1xuICBoZXgzOiAvXiMoWzAtOWEtZl0pKFswLTlhLWZdKShbMC05YS1mXSkoWzAtOWEtZl0pPyQvLFxuICBoZXg6ICAvXiMoWzAtOWEtZl17Nn0pKFswLTlhLWZdezJ9KT8kLyxcbiAgcmdiOiAgL15yZ2JcXHMqXFwoXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccypcXCkkfF5cXHMqcmdiYVxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKlxcKSQvLFxuICBoc2w6ICAvXmhzbFxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFx1MDAyNVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqXFwpJHxeXFxzKmhzbGFcXHMqXFwoXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHUwMDI1XFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKlxcKSQvXG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHBhcnNlXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZ1xuICogQHJldHVybiB7bW9kdWxlOlwidjYuanNcIi5SR0JBfG1vZHVsZTpcInY2LmpzXCIuSFNMQX1cbiAqIEBleGFtcGxlXG4gKiBwYXJzZSggJyNmMGYwJyApOyAgICAgICAgICAgICAgICAgICAgIC8vIC0+IG5ldyBSR0JBKCAyNTUsIDAsIDI1NSwgMCApXG4gKiBwYXJzZSggJyMwMDAwMDBmZicgKTsgICAgICAgICAgICAgICAgIC8vIC0+IG5ldyBSR0JBKCAwLCAwLCAwLCAxIClcbiAqIHBhcnNlKCAnbWFnZW50YScgKTsgICAgICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDI1NSwgMCwgMjU1LCAxIClcbiAqIHBhcnNlKCAndHJhbnNwYXJlbnQnICk7ICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDAsIDAsIDAsIDAgKVxuICogcGFyc2UoICdoc2woIDAsIDEwMCUsIDUwJSApJyApOyAgICAgICAvLyAtPiBuZXcgSFNMQSggMCwgMTAwLCA1MCwgMSApXG4gKiBwYXJzZSggJ2hzbGEoIDAsIDEwMCUsIDUwJSwgMC41ICknICk7IC8vIC0+IG5ldyBIU0xBKCAwLCAxMDAsIDUwLCAwLjUgKVxuICovXG5mdW5jdGlvbiBwYXJzZSAoIHN0cmluZyApXG57XG4gIHZhciBjYWNoZSA9IHBhcnNlZFsgc3RyaW5nIF0gfHwgcGFyc2VkWyBzdHJpbmcgPSBzdHJpbmcudHJpbSgpLnRvTG93ZXJDYXNlKCkgXTtcblxuICBpZiAoICEgY2FjaGUgKSB7XG4gICAgaWYgKCAoIGNhY2hlID0gY29sb3JzWyBzdHJpbmcgXSApICkge1xuICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKCBwYXJzZUhleCggY2FjaGUgKSwgUkdCQSApO1xuICAgIH0gZWxzZSBpZiAoICggY2FjaGUgPSByZWdleHBzLmhleC5leGVjKCBzdHJpbmcgKSApIHx8ICggY2FjaGUgPSByZWdleHBzLmhleDMuZXhlYyggc3RyaW5nICkgKSApIHtcbiAgICAgIGNhY2hlID0gbmV3IENvbG9yRGF0YSggcGFyc2VIZXgoIGZvcm1hdEhleCggY2FjaGUgKSApLCBSR0JBICk7XG4gICAgfSBlbHNlIGlmICggKCBjYWNoZSA9IHJlZ2V4cHMucmdiLmV4ZWMoIHN0cmluZyApICkgKSB7XG4gICAgICBjYWNoZSA9IG5ldyBDb2xvckRhdGEoIGNvbXBhY3RNYXRjaCggY2FjaGUgKSwgUkdCQSApO1xuICAgIH0gZWxzZSBpZiAoICggY2FjaGUgPSByZWdleHBzLmhzbC5leGVjKCBzdHJpbmcgKSApICkge1xuICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKCBjb21wYWN0TWF0Y2goIGNhY2hlICksIEhTTEEgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgU3ludGF4RXJyb3IoIHN0cmluZyArICcgaXMgbm90IGEgdmFsaWQgc3ludGF4JyApO1xuICAgIH1cblxuICAgIHBhcnNlZFsgc3RyaW5nIF0gPSBjYWNoZTtcbiAgfVxuXG4gIHJldHVybiBuZXcgY2FjaGUuY29sb3IoIGNhY2hlWyAwIF0sIGNhY2hlWyAxIF0sIGNhY2hlWyAyIF0sIGNhY2hlWyAzIF0gKTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBmb3JtYXRIZXhcbiAqIEBwYXJhbSAge2FycmF5PHN0cmluZz8+fSBtYXRjaFxuICogQHJldHVybiB7c3RyaW5nfVxuICogQGV4YW1wbGVcbiAqIGZvcm1hdEhleCggWyAnIzAwMDAwMGZmJywgJzAwMDAwMCcsICdmZicgXSApOyAvLyAtPiAnMDAwMDAwZmYnXG4gKiBmb3JtYXRIZXgoIFsgJyMwMDA3JywgJzAnLCAnMCcsICcwJywgJzcnIF0gKTsgLy8gLT4gJzAwMDAwMDc3J1xuICogZm9ybWF0SGV4KCBbICcjMDAwJywgJzAnLCAnMCcsICcwJywgbnVsbCBdICk7IC8vIC0+ICcwMDAwMDBmZidcbiAqL1xuZnVuY3Rpb24gZm9ybWF0SGV4ICggbWF0Y2ggKVxue1xuICB2YXIgciwgZywgYiwgYTtcblxuICBpZiAoIG1hdGNoLmxlbmd0aCA9PT0gMyApIHtcbiAgICByZXR1cm4gbWF0Y2hbIDEgXSArICggbWF0Y2hbIDIgXSB8fCAnZmYnICk7XG4gIH1cblxuICByID0gbWF0Y2hbIDEgXTtcbiAgZyA9IG1hdGNoWyAyIF07XG4gIGIgPSBtYXRjaFsgMyBdO1xuICBhID0gbWF0Y2hbIDQgXSB8fCAnZic7XG5cbiAgcmV0dXJuIHIgKyByICsgZyArIGcgKyBiICsgYiArIGEgKyBhO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHBhcnNlSGV4XG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICBoZXhcbiAqIEByZXR1cm4ge2FycmF5PG51bWJlcj59XG4gKiBAZXhhbXBsZVxuICogcGFyc2VIZXgoICcwMDAwMDAwMCcgKTsgLy8gLT4gWyAwLCAwLCAwLCAwIF1cbiAqIHBhcnNlSGV4KCAnZmYwMGZmZmYnICk7IC8vIC0+IFsgMjU1LCAwLCAyNTUsIDEgXVxuICovXG5mdW5jdGlvbiBwYXJzZUhleCAoIGhleCApXG57XG4gIGlmICggaGV4ID09IDAgKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgcmV0dXJuIFRSQU5TUEFSRU5UO1xuICB9XG5cbiAgaGV4ID0gcGFyc2VJbnQoIGhleCwgMTYgKTtcblxuICByZXR1cm4gW1xuICAgIC8vIFJcbiAgICBoZXggPj4gMjQgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEdcbiAgICBoZXggPj4gMTYgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEJcbiAgICBoZXggPj4gOCAgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEFcbiAgICAoIGhleCAmIDI1NSApIC8gMjU1IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICBdO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNvbXBhY3RNYXRjaFxuICogQHBhcmFtICB7YXJyYXk8c3RyaW5nPz59IG1hdGNoXG4gKiBAcmV0dXJuIHthcnJheTxudW1iZXI+fVxuICovXG5mdW5jdGlvbiBjb21wYWN0TWF0Y2ggKCBtYXRjaCApXG57XG4gIGlmICggbWF0Y2hbIDcgXSApIHtcbiAgICByZXR1cm4gW1xuICAgICAgTnVtYmVyKCBtYXRjaFsgNCBdICksXG4gICAgICBOdW1iZXIoIG1hdGNoWyA1IF0gKSxcbiAgICAgIE51bWJlciggbWF0Y2hbIDYgXSApLFxuICAgICAgTnVtYmVyKCBtYXRjaFsgNyBdIClcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBOdW1iZXIoIG1hdGNoWyAxIF0gKSxcbiAgICBOdW1iZXIoIG1hdGNoWyAyIF0gKSxcbiAgICBOdW1iZXIoIG1hdGNoWyAzIF0gKVxuICBdO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAY29uc3RydWN0b3IgQ29sb3JEYXRhXG4gKiBAcGFyYW0ge2FycmF5PG51bWJlcj59IG1hdGNoXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSAgICAgIGNvbG9yXG4gKi9cbmZ1bmN0aW9uIENvbG9yRGF0YSAoIG1hdGNoLCBjb2xvciApXG57XG4gIHRoaXNbIDAgXSA9IG1hdGNoWyAwIF07XG4gIHRoaXNbIDEgXSA9IG1hdGNoWyAxIF07XG4gIHRoaXNbIDIgXSA9IG1hdGNoWyAyIF07XG4gIHRoaXNbIDMgXSA9IG1hdGNoWyAzIF07XG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQmtC+0L3RgdGC0LDQvdGC0YsuXG4gKiBAbmFtZXNwYWNlIHtvYmplY3R9IHY2LmNvbnN0YW50c1xuICogQGV4YW1wbGVcbiAqIHZhciBjb25zdGFudHMgPSByZXF1aXJlKCAndjYuanMvY29yZS9jb25zdGFudHMnICk7XG4gKi9cblxudmFyIF9jb25zdGFudHMgPSB7fTtcbnZhciBfY291bnRlciAgID0gMDtcblxuLyoqXG4gKiDQlNC+0LHQsNCy0LvRj9C10YIg0LrQvtC90YHRgtCw0L3RgtGDLlxuICogQG1ldGhvZCB2Ni5jb25zdGFudHMuYWRkXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGtleSDQmNC80Y8g0LrQvtC90YHRgtCw0L3RgtGLLlxuICogQHJldHVybiB7dm9pZH0gICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogY29uc3RhbnRzLmFkZCggJ0NVU1RPTV9DT05TVEFOVCcgKTtcbiAqL1xuZnVuY3Rpb24gYWRkICgga2V5IClcbntcbiAgaWYgKCB0eXBlb2YgX2NvbnN0YW50c1sga2V5IF0gIT09ICd1bmRlZmluZWQnICkge1xuICAgIHRocm93IEVycm9yKCAnQ2Fubm90IHJlLXNldCAoYWRkKSBleGlzdGluZyBjb25zdGFudDogJyArIGtleSApO1xuICB9XG5cbiAgX2NvbnN0YW50c1sga2V5IF0gPSArK19jb3VudGVyO1xufVxuXG4vKipcbiAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC60L7QvdGB0YLQsNC90YLRgy5cbiAqIEBtZXRob2QgdjYuY29uc3RhbnRzLmdldFxuICogQHBhcmFtICB7c3RyaW5nfSAgIGtleSDQmNC80Y8g0LrQvtC90YHRgtCw0L3RgtGLLlxuICogQHJldHVybiB7Y29uc3RhbnR9ICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQutC+0L3RgdGC0LDQvdGC0YMuXG4gKiBAZXhhbXBsZVxuICogY29uc3RhbnRzLmdldCggJ0NVU1RPTV9DT05TVEFOVCcgKTtcbiAqL1xuZnVuY3Rpb24gZ2V0ICgga2V5IClcbntcbiAgaWYgKCB0eXBlb2YgX2NvbnN0YW50c1sga2V5IF0gPT09ICd1bmRlZmluZWQnICkge1xuICAgIHRocm93IFJlZmVyZW5jZUVycm9yKCAnQ2Fubm90IGdldCB1bmtub3duIGNvbnN0YW50OiAnICsga2V5ICk7XG4gIH1cblxuICByZXR1cm4gX2NvbnN0YW50c1sga2V5IF07XG59XG5cbltcbiAgJ0FVVE8nLFxuICAnR0wnLFxuICAnMkQnLFxuICAnTEVGVCcsXG4gICdUT1AnLFxuICAnQ0VOVEVSJyxcbiAgJ01JRERMRScsXG4gICdSSUdIVCcsXG4gICdCT1RUT00nLFxuICAnUEVSQ0VOVCdcbl0uZm9yRWFjaCggYWRkICk7XG5cbmV4cG9ydHMuYWRkID0gYWRkO1xuZXhwb3J0cy5nZXQgPSBnZXQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBMaWdodEVtaXR0ZXIgPSByZXF1aXJlKCAnbGlnaHRfZW1pdHRlcicgKTtcblxuLyoqXG4gKiBAYWJzdHJhY3RcbiAqIEBjb25zdHJ1Y3RvciB2Ni5BYnN0cmFjdEltYWdlXG4gKiBAZXh0ZW5kcyBMaWdodEVtaXR0ZXJcbiAqIEBzZWUgdjYuQ29tcG91bmRlZEltYWdlXG4gKiBAc2VlIHY2LkltYWdlXG4gKi9cbmZ1bmN0aW9uIEFic3RyYWN0SW1hZ2UgKClcbntcbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2Ujc3ggXCJTb3VyY2UgWFwiLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNzeSBcIlNvdXJjZSBZXCIuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI3N3IFwiU291cmNlIFdpZHRoXCIuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI3NoIFwiU291cmNlIEhlaWdodFwiLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNkdyBcIkRlc3RpbmF0aW9uIFdpZHRoXCIuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI2RoIFwiRGVzdGluYXRpb24gSGVpZ2h0XCIuXG4gICAqL1xuXG4gIHRocm93IEVycm9yKCAnQ2Fubm90IGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgYWJzdHJhY3QgY2xhc3MgKG5ldyB2Ni5BYnN0cmFjdEltYWdlKScgKTtcbn1cblxuQWJzdHJhY3RJbWFnZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBMaWdodEVtaXR0ZXIucHJvdG90eXBlICk7XG5BYnN0cmFjdEltYWdlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEFic3RyYWN0SW1hZ2U7XG5cbi8qKlxuICogQHZpcnR1YWxcbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RJbWFnZSNnZXRcbiAqIEByZXR1cm4ge3Y2LkltYWdlfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gQWJzdHJhY3RJbWFnZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEFic3RyYWN0SW1hZ2UgPSByZXF1aXJlKCAnLi9BYnN0cmFjdEltYWdlJyApO1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvciB2Ni5Db21wb3VuZGVkSW1hZ2VcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0SW1hZ2VcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2VcbiAqIEBwYXJhbSB7bnVibWVyfSAgICAgICAgICAgc3hcbiAqIEBwYXJhbSB7bnVibWVyfSAgICAgICAgICAgc3lcbiAqIEBwYXJhbSB7bnVibWVyfSAgICAgICAgICAgc3dcbiAqIEBwYXJhbSB7bnVibWVyfSAgICAgICAgICAgc2hcbiAqIEBwYXJhbSB7bnVibWVyfSAgICAgICAgICAgZHdcbiAqIEBwYXJhbSB7bnVibWVyfSAgICAgICAgICAgZGhcbiAqL1xuZnVuY3Rpb24gQ29tcG91bmRlZEltYWdlICggaW1hZ2UsIHN4LCBzeSwgc3csIHNoLCBkdywgZGggKVxue1xuICB0aGlzLmltYWdlID0gaW1hZ2U7XG4gIHRoaXMuc3ggICAgPSBzeDtcbiAgdGhpcy5zeSAgICA9IHN5O1xuICB0aGlzLnN3ICAgID0gc3c7XG4gIHRoaXMuc2ggICAgPSBzaDtcbiAgdGhpcy5kdyAgICA9IGR3O1xuICB0aGlzLmRoICAgID0gZGg7XG59XG5cbkNvbXBvdW5kZWRJbWFnZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdEltYWdlLnByb3RvdHlwZSApO1xuQ29tcG91bmRlZEltYWdlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENvbXBvdW5kZWRJbWFnZTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuQ29tcG91bmRlZEltYWdlI2dldFxuICovXG5Db21wb3VuZGVkSW1hZ2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAoKVxue1xuICByZXR1cm4gdGhpcy5pbWFnZS5nZXQoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG91bmRlZEltYWdlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29tcG91bmRlZEltYWdlID0gcmVxdWlyZSggJy4vQ29tcG91bmRlZEltYWdlJyApO1xudmFyIEFic3RyYWN0SW1hZ2UgICA9IHJlcXVpcmUoICcuL0Fic3RyYWN0SW1hZ2UnICk7XG5cbi8qKlxuICog0JrQu9Cw0YHRgSDQutCw0YDRgtC40L3QutC4LlxuICogQGNvbnN0cnVjdG9yIHY2LkltYWdlXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdEltYWdlXG4gKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltYWdlIERPTSDRjdC70LXQvNC10L3RgiDQutCw0YDRgtC40L3QutC4IChJTUcpLlxuICogQGZpcmVzIGNvbXBsZXRlXG4gKiBAc2VlIHY2LkltYWdlLmZyb21VUkxcbiAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNiYWNrZ3JvdW5kSW1hZ2VcbiAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNpbWFnZVxuICogQGV4YW1wbGVcbiAqIHZhciBJbWFnZSA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2ltYWdlL0ltYWdlJyApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRpbmcgYW4gaW1hZ2Ugd2l0aCBhbiBET00gaW1hZ2U8L2NhcHRpb24+XG4gKiAvLyBIVE1MOiA8aW1nIHNyYz1cImltYWdlLnBuZ1wiIGlkPVwiaW1hZ2VcIiAvPlxuICogdmFyIGltYWdlID0gbmV3IEltYWdlKCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2ltYWdlJyApICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyBhbiBpbWFnZSB3aXRoIGEgVVJMPC9jYXB0aW9uPlxuICogdmFyIGltYWdlID0gSW1hZ2UuZnJvbVVSTCggJ2ltYWdlLnBuZycgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkZpcmVzIFwiY29tcGxldGVcIiBldmVudDwvY2FwdGlvbj5cbiAqIGltYWdlLm9uY2UoICdjb21wbGV0ZScsIGZ1bmN0aW9uICgpXG4gKiB7XG4gKiAgIGNvbnNvbGUubG9nKCAnVGhlIGltYWdlIGlzIGxvYWRlZCEnICk7XG4gKiB9ICk7XG4gKi9cbmZ1bmN0aW9uIEltYWdlICggaW1hZ2UgKVxue1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKCAhIGltYWdlLnNyYyApIHtcbiAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjcmVhdGUgdjYuSW1hZ2UgZnJvbSBIVE1MSW1hZ2VFbGVtZW50IHdpdGggbm8gXCJzcmNcIiBhdHRyaWJ1dGUgKG5ldyB2Ni5JbWFnZSknICk7XG4gIH1cblxuICAvKipcbiAgICogQG1lbWJlciB7SFRNTEltYWdlRWxlbWVudH0gdjYuSW1hZ2UjaW1hZ2UgRE9NINGN0LXQu9C10LzQtdC90YIg0LrQsNGA0YLQuNC90LrQuC5cbiAgICovXG4gIHRoaXMuaW1hZ2UgPSBpbWFnZTtcblxuICBpZiAoIHRoaXMuaW1hZ2UuY29tcGxldGUgKSB7XG4gICAgdGhpcy5faW5pdCgpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBmdW5jdGlvbiBvbmxvYWQgKClcbiAgICB7XG4gICAgICBzZWxmLmltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdsb2FkJywgb25sb2FkICk7XG4gICAgICBzZWxmLl9pbml0KCk7XG4gICAgfSwgZmFsc2UgKTtcbiAgfVxufVxuXG5JbWFnZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdEltYWdlLnByb3RvdHlwZSApO1xuSW1hZ2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gSW1hZ2U7XG5cbi8qKlxuICog0JjQvdC40YbQuNCw0LvQuNC30LjRgNGD0LXRgiDQutCw0YDRgtC40L3QutGDINC/0L7RgdC70LUg0LXQtSDQt9Cw0LPRgNGD0LfQutC4LlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgdjYuSW1hZ2UjX2luaXRcbiAqIEByZXR1cm4ge3ZvaWR9INCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICovXG5JbWFnZS5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbiBfaW5pdCAoKVxue1xuICB0aGlzLnN4ID0gMDtcbiAgdGhpcy5zeSA9IDA7XG4gIHRoaXMuc3cgPSB0aGlzLmR3ID0gdGhpcy5pbWFnZS53aWR0aDsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gIHRoaXMuc2ggPSB0aGlzLmRoID0gdGhpcy5pbWFnZS5oZWlnaHQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gIHRoaXMuZW1pdCggJ2NvbXBsZXRlJyApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuSW1hZ2UjZ2V0XG4gKi9cbkltYWdlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQgKClcbntcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCe0L/RgNC10LTQtdC70Y/QtdGCLCDQt9Cw0LPRgNGD0LbQtdC90LAg0LvQuCDQutCw0YDRgtC40L3QutCwLlxuICogQG1ldGhvZCB2Ni5JbWFnZSNjb21wbGV0ZVxuICogQHJldHVybiB7Ym9vbGVhbn0gYHRydWVgLCDQtdGB0LvQuCDQt9Cw0LPRgNGD0LbQtdC90LAuXG4gKiBAZXhhbXBsZVxuICogdmFyIGltYWdlID0gSW1hZ2UuZnJvbVVSTCggJ2ltYWdlLnBuZycgKTtcbiAqXG4gKiBpZiAoICEgaW1hZ2UuY29tcGxldGUoKSApIHtcbiAqICAgaW1hZ2Uub25jZSggJ2NvbXBsZXRlJywgZnVuY3Rpb24gKClcbiAqICAge1xuICogICAgIGNvbnNvbGUubG9nKCAnVGhlIGltYWdlIGlzIGxvYWRlZCEnLCBpbWFnZS5jb21wbGV0ZSgpICk7XG4gKiAgIH0gKTtcbiAqIH1cbiAqL1xuSW1hZ2UucHJvdG90eXBlLmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGUgKClcbntcbiAgcmV0dXJuIEJvb2xlYW4oIHRoaXMuaW1hZ2Uuc3JjICkgJiYgdGhpcy5pbWFnZS5jb21wbGV0ZTtcbn07XG5cbi8qKlxuICog0JLQvtC30LLRgNCw0YnQsNC10YIgVVJMINC60LDRgNGC0LjQvdC60LguXG4gKiBAbWV0aG9kIHY2LkltYWdlI3NyY1xuICogQHJldHVybiB7c3RyaW5nfSBVUkwg0LrQsNGA0YLQuNC90LrQuC5cbiAqIEBleGFtcGxlXG4gKiBJbWFnZS5mcm9tVVJMKCAnaW1hZ2UucG5nJyApLnNyYygpOyAvLyAtPiBcImltYWdlLnBuZ1wiXG4gKi9cbkltYWdlLnByb3RvdHlwZS5zcmMgPSBmdW5jdGlvbiBzcmMgKClcbntcbiAgcmV0dXJuIHRoaXMuaW1hZ2Uuc3JjO1xufTtcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRg9GOIHtAbGluayB2Ni5JbWFnZX0g0LjQtyBVUkwuXG4gKiBAbWV0aG9kIHY2LkltYWdlLmZyb21VUkxcbiAqIEBwYXJhbSAge3N0cmluZ30gICBzcmMgVVJMINC60LDRgNGC0LjQvdC60LguXG4gKiBAcmV0dXJuIHt2Ni5JbWFnZX0gICAgINCd0L7QstCw0Y8ge0BsaW5rIHY2LkltYWdlfS5cbiAqIEBleGFtcGxlXG4gKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnaW1hZ2UucG5nJyApO1xuICovXG5JbWFnZS5mcm9tVVJMID0gZnVuY3Rpb24gZnJvbVVSTCAoIHNyYyApXG57XG4gIHZhciBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdpbWcnICk7XG4gIGltYWdlLnNyYyA9IHNyYztcbiAgcmV0dXJuIG5ldyBJbWFnZSggaW1hZ2UgKTtcbn07XG5cbi8qKlxuICog0J/RgNC+0L/QvtGA0YbQuNC+0L3QsNC70YzQvdC+INGA0LDRgdGC0Y/Qs9C40LLQsNC10YIg0LjQu9C4INGB0LbQuNC80LDQtdGCINC60LDRgNGC0LjQvdC60YMuXG4gKiBAbWV0aG9kIHY2LkltYWdlLnN0cmV0Y2hcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0SW1hZ2V9ICAgaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgZHcgICAg0J3QvtCy0YvQuSBcIkRlc3RpbmF0aW9uIFdpZHRoXCIuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIGRoICAgINCd0L7QstGL0LkgXCJEZXN0aW5hdGlvbiBIZWlnaHRcIi5cbiAqIEByZXR1cm4ge3Y2LkNvbXBvdW5kZWRJbWFnZX0gICAgICAg0J3QvtCy0LDRjyDQutCw0YDRgtC40L3QutCwLlxuICogQGV4YW1wbGVcbiAqIEltYWdlLnN0cmV0Y2goIGltYWdlLCA2MDAsIDQwMCApO1xuICovXG5JbWFnZS5zdHJldGNoID0gZnVuY3Rpb24gc3RyZXRjaCAoIGltYWdlLCBkdywgZGggKVxue1xuICB2YXIgdmFsdWUgPSBkaCAvIGltYWdlLmRoICogaW1hZ2UuZHc7XG5cbiAgLy8gU3RyZXRjaCBEVy5cbiAgaWYgKCB2YWx1ZSA8IGR3ICkge1xuICAgIGRoID0gZHcgLyBpbWFnZS5kdyAqIGltYWdlLmRoO1xuXG4gIC8vIFN0cmV0Y2ggREguXG4gIH0gZWxzZSB7XG4gICAgZHcgPSB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiBuZXcgQ29tcG91bmRlZEltYWdlKCBpbWFnZS5nZXQoKSwgaW1hZ2Uuc3gsIGltYWdlLnN5LCBpbWFnZS5zdywgaW1hZ2Uuc2gsIGR3LCBkaCApO1xufTtcblxuLyoqXG4gKiDQntCx0YDQtdC30LDQtdGCINC60LDRgNGC0LjQvdC60YMuXG4gKiBAbWV0aG9kIHY2LkltYWdlLmN1dFxuICogQHBhcmFtICB7djYuQWJzdHJhY3RJbWFnZX0gICBpbWFnZSDQmtCw0YDRgtC40L3QutCwLCDQutC+0YLQvtGA0YPRjiDQvdCw0LTQviDQvtCx0YDQtdC30LDRgtGMLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBzeCAgICBYINC60L7QvtGA0LTQuNC90LDRgtCwLCDQvtGC0LrRg9C00LAg0L3QsNC00L4g0L7QsdGA0LXQt9Cw0YLRjC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgc3kgICAgWSDQutC+0L7RgNC00LjQvdCw0YLQsCwg0L7RgtC60YPQtNCwINC90LDQtNC+INC+0LHRgNC10LfQsNGC0YwuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIHN3ICAgINCd0L7QstCw0Y8g0YjQuNGA0LjQvdCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBzaCAgICDQndC+0LLQsNGPINCy0YvRgdC+0YLQsC5cbiAqIEByZXR1cm4ge3Y2LkNvbXBvdW5kZWRJbWFnZX0gICAgICAg0J7QsdGA0LXQt9Cw0L3QvdCw0Y8g0LrQsNGA0YLQuNC90LrQsC5cbiAqIEBleGFtcGxlXG4gKiBJbWFnZS5jdXQoIGltYWdlLCAxMCwgMjAsIDMwLCA0MCApO1xuICovXG5JbWFnZS5jdXQgPSBmdW5jdGlvbiBjdXQgKCBpbWFnZSwgc3gsIHN5LCBkdywgZGggKVxue1xuICB2YXIgc3cgPSBpbWFnZS5zdyAvIGltYWdlLmR3ICogZHc7XG4gIHZhciBzaCA9IGltYWdlLnNoIC8gaW1hZ2UuZGggKiBkaDtcblxuICBzeCArPSBpbWFnZS5zeDtcblxuICBpZiAoIHN4ICsgc3cgPiBpbWFnZS5zeCArIGltYWdlLnN3ICkge1xuICAgIHRocm93IEVycm9yKCAnQ2Fubm90IGN1dCB0aGUgaW1hZ2UgYmVjYXVzZSB0aGUgbmV3IGltYWdlIFggb3IgVyBpcyBvdXQgb2YgYm91bmRzICh2Ni5JbWFnZS5jdXQpJyApO1xuICB9XG5cbiAgc3kgKz0gaW1hZ2Uuc3k7XG5cbiAgaWYgKCBzeSArIHNoID4gaW1hZ2Uuc3kgKyBpbWFnZS5zaCApIHtcbiAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjdXQgdGhlIGltYWdlIGJlY2F1c2UgdGhlIG5ldyBpbWFnZSBZIG9yIEggaXMgb3V0IG9mIGJvdW5kcyAodjYuSW1hZ2UuY3V0KScgKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgQ29tcG91bmRlZEltYWdlKCBpbWFnZS5nZXQoKSwgc3gsIHN5LCBzdywgc2gsIGR3LCBkaCApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9GbG9hdDMyQXJyYXk7XG5cbmlmICggdHlwZW9mIEZsb2F0MzJBcnJheSA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgX0Zsb2F0MzJBcnJheSA9IEZsb2F0MzJBcnJheTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxufSBlbHNlIHtcbiAgX0Zsb2F0MzJBcnJheSA9IEFycmF5O1xufVxuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINC80LDRgdGB0LjQsiDRgSDQutC+0L7RgNC00LjQvdCw0YLQsNC80Lgg0LLRgdC10YUg0YLQvtGH0LXQuiDQvdGD0LbQvdC+0LPQviDQv9C+0LvQuNCz0L7QvdCwLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY3JlYXRlUG9seWdvblxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICBzaWRlcyDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdGC0L7RgNC+0L0g0L/QvtC70LjQs9C+0L3QsC5cbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0LzQsNGB0YHQuNCyIChGbG9hdDMyQXJyYXkpINC60L7RgtC+0YDRi9C5INCy0YvQs9C70Y/QtNC40YIg0YLQsNC6OiBgWyB4MSwgeTEsIHgyLCB5MiBdYC5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0JLRgdC1INC30L3QsNGH0LXQvdC40Y8g0LrQvtGC0L7RgNC+0LPQviDQvdC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdGLLlxuICovXG5mdW5jdGlvbiBjcmVhdGVQb2x5Z29uICggc2lkZXMgKVxue1xuICB2YXIgaSAgICAgICAgPSBNYXRoLmZsb29yKCBzaWRlcyApO1xuICB2YXIgc3RlcCAgICAgPSBNYXRoLlBJICogMiAvIHNpZGVzO1xuICB2YXIgdmVydGljZXMgPSBuZXcgX0Zsb2F0MzJBcnJheSggaSAqIDIgKyAyICk7XG5cbiAgZm9yICggOyBpID49IDA7IC0taSApIHtcbiAgICB2ZXJ0aWNlc1sgICAgIGkgKiAyIF0gPSBNYXRoLmNvcyggc3RlcCAqIGkgKTtcbiAgICB2ZXJ0aWNlc1sgMSArIGkgKiAyIF0gPSBNYXRoLnNpbiggc3RlcCAqIGkgKTtcbiAgfVxuXG4gIHJldHVybiB2ZXJ0aWNlcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVQb2x5Z29uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINC4INC40L3QuNGG0LjQsNC70LjQt9C40YDRg9C10YIg0L3QvtCy0YPRjiBXZWJHTCDQv9GA0L7Qs9GA0LDQvNC80YMuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjcmVhdGVQcm9ncmFtXG4gKiBAcGFyYW0gIHtXZWJHTFNoYWRlcn0gICAgICAgICAgIHZlcnQg0JLQtdGA0YjQuNC90L3Ri9C5INGI0LXQudC00LXRgCAo0YHQvtC30LTQsNC90L3Ri9C5INGBINC/0L7QvNC+0YnRjNGOIGB7QGxpbmsgY3JlYXRlU2hhZGVyfWApLlxuICogQHBhcmFtICB7V2ViR0xTaGFkZXJ9ICAgICAgICAgICBmcmFnINCk0YDQsNCz0LzQtdC90YLQvdGL0Lkg0YjQtdC50LTQtdGAICjRgdC+0LfQtNCw0L3QvdGL0Lkg0YEg0L/QvtC80L7RidGM0Y4gYHtAbGluayBjcmVhdGVTaGFkZXJ9YCkuXG4gKiBAcGFyYW0gIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsICAgV2ViR0wg0LrQvtC90YLQtdC60YHRgi5cbiAqIEByZXR1cm4ge1dlYkdMUHJvZ3JhbX1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUHJvZ3JhbSAoIHZlcnQsIGZyYWcsIGdsIClcbntcbiAgdmFyIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG5cbiAgZ2wuYXR0YWNoU2hhZGVyKCBwcm9ncmFtLCB2ZXJ0ICk7XG4gIGdsLmF0dGFjaFNoYWRlciggcHJvZ3JhbSwgZnJhZyApO1xuICBnbC5saW5rUHJvZ3JhbSggcHJvZ3JhbSApO1xuXG4gIGlmICggISBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKCBwcm9ncmFtLCBnbC5MSU5LX1NUQVRVUyApICkge1xuICAgIHRocm93IEVycm9yKCAnVW5hYmxlIHRvIGluaXRpYWxpemUgdGhlIHNoYWRlciBwcm9ncmFtOiAnICsgZ2wuZ2V0UHJvZ3JhbUluZm9Mb2coIHByb2dyYW0gKSApO1xuICB9XG5cbiAgZ2wudmFsaWRhdGVQcm9ncmFtKCBwcm9ncmFtICk7XG5cbiAgaWYgKCAhIGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoIHByb2dyYW0sIGdsLlZBTElEQVRFX1NUQVRVUyApICkge1xuICAgIHRocm93IEVycm9yKCAnVW5hYmxlIHRvIHZhbGlkYXRlIHRoZSBzaGFkZXIgcHJvZ3JhbTogJyArIGdsLmdldFByb2dyYW1JbmZvTG9nKCBwcm9ncmFtICkgKTtcbiAgfVxuXG4gIHJldHVybiBwcm9ncmFtO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVByb2dyYW07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0Lgg0LjQvdC40YbQuNCw0LvQuNC30LjRgNGD0LXRgiDQvdC+0LLRi9C5IFdlYkdMINGI0LXQudC00LXRgC5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNyZWF0ZVNoYWRlclxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgICAgICAgICBzb3VyY2Ug0JjRgdGF0L7QtNC90YvQuSDQutC+0LQg0YjQtdC50LTQtdGA0LAuXG4gKiBAcGFyYW0gIHtjb25zdGFudH0gICAgICAgICAgICAgIHR5cGUgICDQotC40L8g0YjQtdC50LTQtdGA0LA6IFZFUlRFWF9TSEFERVIg0LjQu9C4IEZSQUdNRU5UX1NIQURFUi5cbiAqIEBwYXJhbSAge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgICAgIFdlYkdMINC60L7QvdGC0LXQutGB0YIuXG4gKiBAcmV0dXJuIHtXZWJHTFNoYWRlcn1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlU2hhZGVyICggc291cmNlLCB0eXBlLCBnbCApXG57XG4gIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoIHR5cGUgKTtcblxuICBnbC5zaGFkZXJTb3VyY2UoIHNoYWRlciwgc291cmNlICk7XG4gIGdsLmNvbXBpbGVTaGFkZXIoIHNoYWRlciApO1xuXG4gIGlmICggISBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoIHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMgKSApIHtcbiAgICB0aHJvdyBTeW50YXhFcnJvciggJ0FuIGVycm9yIG9jY3VycmVkIGNvbXBpbGluZyB0aGUgc2hhZGVyczogJyArIGdsLmdldFNoYWRlckluZm9Mb2coIHNoYWRlciApICk7XG4gIH1cblxuICByZXR1cm4gc2hhZGVyO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVNoYWRlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1lbWJlciB7b2JqZWN0fSBwb2x5Z29uc1xuICovXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBub29wID0gcmVxdWlyZSggJ3BlYWtvL25vb3AnICk7XG5cbnZhciByZXBvcnQsIHJlcG9ydGVkO1xuXG5pZiAoIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBjb25zb2xlLndhcm4gKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICByZXBvcnRlZCA9IHt9O1xuXG4gIHJlcG9ydCA9IGZ1bmN0aW9uIHJlcG9ydCAoIG1lc3NhZ2UgKVxuICB7XG4gICAgaWYgKCByZXBvcnRlZFsgbWVzc2FnZSBdICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnNvbGUud2FybiggbWVzc2FnZSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICByZXBvcnRlZFsgbWVzc2FnZSBdID0gdHJ1ZTtcbiAgfTtcbn0gZWxzZSB7XG4gIHJlcG9ydCA9IG5vb3A7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVwb3J0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAnLi4vc2V0dGluZ3MnICk7XG5cbi8qKlxuICog0JDQsdGB0YLRgNCw0LrRgtC90YvQuSDQutC70LDRgdGBINCy0LXQutGC0L7RgNCwINGBINCx0LDQt9C+0LLRi9C80Lgg0LzQtdGC0L7QtNCw0LzQuC5cbiAqXG4gKiDQp9GC0L7QsdGLINC40YHQv9C+0LvRjNC30L7QstCw0YLRjCDQs9GA0YPQtNGD0YHRiyDQstC80LXRgdGC0L4g0YDQsNC00LjQsNC90L7QsiDQvdCw0LTQviDQvdCw0L/QuNGB0LDRgtGMINGB0LvQtdC00YPRjtGJ0LXQtTpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3NldHRpbmdzJyApO1xuICogc2V0dGluZ3MuZGVncmVlcyA9IHRydWU7XG4gKiBgYGBcbiAqIEBhYnN0cmFjdFxuICogQGNvbnN0cnVjdG9yIHY2LkFic3RyYWN0VmVjdG9yXG4gKiBAc2VlIHY2LlZlY3RvcjJEXG4gKiBAc2VlIHY2LlZlY3RvcjNEXG4gKi9cbmZ1bmN0aW9uIEFic3RyYWN0VmVjdG9yICgpXG57XG4gIHRocm93IEVycm9yKCAnQ2Fubm90IGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgYWJzdHJhY3QgY2xhc3MgKG5ldyB2Ni5BYnN0cmFjdFZlY3RvciknICk7XG59XG5cbkFic3RyYWN0VmVjdG9yLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqINCd0L7RgNC80LDQu9C40LfRg9C10YIg0LLQtdC60YLQvtGALlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI25vcm1hbGl6ZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLm5vcm1hbGl6ZSgpOyAvLyBWZWN0b3IyRCB7IHg6IDAuODk0NDI3MTkwOTk5OTE1OSwgeTogMC40NDcyMTM1OTU0OTk5NTc5IH1cbiAgICovXG4gIG5vcm1hbGl6ZTogZnVuY3Rpb24gbm9ybWFsaXplICgpXG4gIHtcbiAgICB2YXIgbWFnID0gdGhpcy5tYWcoKTtcblxuICAgIGlmICggbWFnICYmIG1hZyAhPT0gMSApIHtcbiAgICAgIHRoaXMuZGl2KCBtYWcgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICog0JjQt9C80LXQvdGP0LXRgiDQvdCw0L/RgNCw0LLQu9C10L3QuNC1INCy0LXQutGC0L7RgNCwINC90LAgYFwiYW5nbGVcImAg0YEg0YHQvtGF0YDQsNC90LXQvdC40LXQvCDQtNC70LjQvdGLLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI3NldEFuZ2xlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSDQndC+0LLQvtC1INC90LDQv9GA0LDQstC70LXQvdC40LUuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkuc2V0QW5nbGUoIDQ1ICogTWF0aC5QSSAvIDE4MCApOyAvLyBWZWN0b3IyRCB7IHg6IDMuMTYyMjc3NjYwMTY4Mzc5NSwgeTogMy4xNjIyNzc2NjAxNjgzNzkgfVxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj7QmNGB0L/QvtC70YzQt9GD0Y8g0LPRgNGD0LTRg9GB0Ys8L2NhcHRpb24+XG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnNldEFuZ2xlKCA0NSApOyAvLyBWZWN0b3IyRCB7IHg6IDMuMTYyMjc3NjYwMTY4Mzc5NSwgeTogMy4xNjIyNzc2NjAxNjgzNzkgfVxuICAgKi9cbiAgc2V0QW5nbGU6IGZ1bmN0aW9uIHNldEFuZ2xlICggYW5nbGUgKVxuICB7XG4gICAgdmFyIG1hZyA9IHRoaXMubWFnKCk7XG5cbiAgICBpZiAoIHNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgICBhbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICAgIH1cblxuICAgIHRoaXMueCA9IG1hZyAqIE1hdGguY29zKCBhbmdsZSApO1xuICAgIHRoaXMueSA9IG1hZyAqIE1hdGguc2luKCBhbmdsZSApO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCY0LfQvNC10L3Rj9C10YIg0LTQu9C40L3RgyDQstC10LrRgtC+0YDQsCDQvdCwIGBcInZhbHVlXCJgINGBINGB0L7RhdGA0LDQvdC10L3QuNC10Lwg0L3QsNC/0YDQsNCy0LvQtdC90LjRjy5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNzZXRNYWdcbiAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCd0L7QstCw0Y8g0LTQu9C40L3QsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5zZXRNYWcoIDQyICk7IC8vIFZlY3RvcjJEIHsgeDogMzcuNTY1OTQyMDIxOTk2NDYsIHk6IDE4Ljc4Mjk3MTAxMDk5ODIzIH1cbiAgICovXG4gIHNldE1hZzogZnVuY3Rpb24gc2V0TWFnICggdmFsdWUgKVxuICB7XG4gICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKCkubXVsKCB2YWx1ZSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQn9C+0LLQvtGA0LDRh9C40LLQsNC10YIg0LLQtdC60YLQvtGAINC90LAgYFwiYW5nbGVcImAg0YPQs9C+0Lsg0YEg0YHQvtGF0YDQsNC90LXQvdC40LXQvCDQtNC70LjQvdGLLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI3JvdGF0ZVxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5yb3RhdGUoIDUgKiBNYXRoLlBJIC8gMTgwICk7IC8vIFZlY3RvcjJEIHsgeDogMy44MTA0NjczMDY4NzE2NjYsIHk6IDIuMzQxMDEyMzY3MTc0MTIzNiB9XG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPtCY0YHQv9C+0LvRjNC30YPRjyDQs9GA0YPQtNGD0YHRizwvY2FwdGlvbj5cbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkucm90YXRlKCA1ICk7IC8vIFZlY3RvcjJEIHsgeDogMy44MTA0NjczMDY4NzE2NjYsIHk6IDIuMzQxMDEyMzY3MTc0MTIzNiB9XG4gICAqL1xuICByb3RhdGU6IGZ1bmN0aW9uIHJvdGF0ZSAoIGFuZ2xlIClcbiAge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuXG4gICAgdmFyIGMsIHM7XG5cbiAgICBpZiAoIHNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgICBhbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICAgIH1cblxuICAgIGMgPSBNYXRoLmNvcyggYW5nbGUgKTtcbiAgICBzID0gTWF0aC5zaW4oIGFuZ2xlICk7XG5cbiAgICB0aGlzLnggPSAoIHggKiBjICkgLSAoIHkgKiBzICk7XG4gICAgdGhpcy55ID0gKCB4ICogcyApICsgKCB5ICogYyApO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINGC0LXQutGD0YnQtdC1INC90LDQv9GA0LDQstC70LXQvdC40LUg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjZ2V0QW5nbGVcbiAgICogQHJldHVybiB7bnVtYmVyfSDQndCw0L/RgNCw0LLQu9C10L3QuNC1ICjRg9Cz0L7Quykg0LIg0LPRgNCw0LTRg9GB0LDRhSDQuNC70Lgg0YDQsNC00LjQsNC90LDRhS5cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCAxLCAxICkuZ2V0QW5nbGUoKTsgLy8gLT4gMC43ODUzOTgxNjMzOTc0NDgzXG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPtCY0YHQv9C+0LvRjNC30YPRjyDQs9GA0YPQtNGD0YHRizwvY2FwdGlvbj5cbiAgICogbmV3IFZlY3RvcjJEKCAxLCAxICkuZ2V0QW5nbGUoKTsgLy8gLT4gNDVcbiAgICovXG4gIGdldEFuZ2xlOiBmdW5jdGlvbiBnZXRBbmdsZSAoKVxuICB7XG4gICAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgICAgcmV0dXJuIE1hdGguYXRhbjIoIHRoaXMueSwgdGhpcy54ICkgKiAxODAgLyBNYXRoLlBJO1xuICAgIH1cblxuICAgIHJldHVybiBNYXRoLmF0YW4yKCB0aGlzLnksIHRoaXMueCApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQntCz0YDQsNC90LjRh9C40LLQsNC10YIg0LTQu9C40L3RgyDQstC10LrRgtC+0YDQsCDQtNC+IGBcInZhbHVlXCJgLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI2xpbWl0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQnNCw0LrRgdC40LzQsNC70YzQvdCw0Y8g0LTQu9C40L3QsCDQstC10LrRgtC+0YDQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDEsIDEgKS5saW1pdCggMSApOyAvLyBWZWN0b3IyRCB7IHg6IDAuNzA3MTA2NzgxMTg2NTQ3NSwgeTogMC43MDcxMDY3ODExODY1NDc1IH1cbiAgICovXG4gIGxpbWl0OiBmdW5jdGlvbiBsaW1pdCAoIHZhbHVlIClcbiAge1xuICAgIHZhciBtYWcgPSB0aGlzLm1hZ1NxKCk7XG5cbiAgICBpZiAoIG1hZyA+IHZhbHVlICogdmFsdWUgKSB7XG4gICAgICB0aGlzLmRpdiggTWF0aC5zcXJ0KCBtYWcgKSApLm11bCggdmFsdWUgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQu9C40L3RgyDQstC10LrRgtC+0YDQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNtYWdcbiAgICogQHJldHVybiB7bnVtYmVyfSDQlNC70LjQvdCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDIsIDIgKS5tYWcoKTsgLy8gLT4gMi44Mjg0MjcxMjQ3NDYxOTAzXG4gICAqL1xuICBtYWc6IGZ1bmN0aW9uIG1hZyAoKVxuICB7XG4gICAgcmV0dXJuIE1hdGguc3FydCggdGhpcy5tYWdTcSgpICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC00LvQuNC90YMg0LLQtdC60YLQvtGA0LAg0LIg0LrQstCw0LTRgNCw0YLQtS5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNtYWdTcVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9INCU0LvQuNC90LAg0LLQtdC60YLQvtGA0LAg0LIg0LrQstCw0LTRgNCw0YLQtS5cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCAyLCAyICkubWFnU3EoKTsgLy8gLT4gOFxuICAgKi9cblxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0LrQu9C+0L0g0LLQtdC60YLQvtGA0LAuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjY2xvbmVcbiAgICogQHJldHVybiB7djYuQWJzdHJhY3RWZWN0b3J9INCa0LvQvtC9INCy0LXQutGC0L7RgNCwLlxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5jbG9uZSgpO1xuICAgKi9cblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0YHRgtGA0L7QutC+0LLQvtC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0LXQutGC0L7RgNCwIChwcmV0dGlmaWVkKS5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciN0b1N0cmluZ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNC4zMjEsIDIuMzQ1ICkudG9TdHJpbmcoKTsgLy8gLT4gXCJ2Ni5WZWN0b3IyRCB7IHg6IDQuMzIsIHk6IDIuMzUgfVwiXG4gICAqL1xuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQtNC40YHRgtCw0L3RhtC40Y4g0LzQtdC20LTRgyDQtNCy0YPQvNGPINCy0LXQutGC0L7RgNCw0LzQuC5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNkaXN0XG4gICAqIEBwYXJhbSAge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JTRgNGD0LPQvtC5ICjQstGC0L7RgNC+0LkpINCy0LXQutGC0L7RgC5cbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDMsIDMgKS5kaXN0KCBuZXcgVmVjdG9yMkQoIDEsIDEgKSApOyAvLyAtPiAyLjgyODQyNzEyNDc0NjE5MDNcbiAgICovXG5cbiAgY29uc3RydWN0b3I6IEFic3RyYWN0VmVjdG9yXG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yLl9mcm9tQW5nbGVcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0VmVjdG9yfSBWZWN0b3Ige0BsaW5rIHY2LlZlY3RvcjJEfSwge0BsaW5rIHY2LlZlY3RvcjNEfS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICBhbmdsZVxuICogQHJldHVybiB7djYuQWJzdHJhY3RWZWN0b3J9XG4gKiBAc2VlIHY2LkFic3RyYWN0VmVjdG9yLmZyb21BbmdsZVxuICovXG5BYnN0cmFjdFZlY3Rvci5fZnJvbUFuZ2xlID0gZnVuY3Rpb24gX2Zyb21BbmdsZSAoIFZlY3RvciwgYW5nbGUgKVxue1xuICBpZiAoIHNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgYW5nbGUgKj0gTWF0aC5QSSAvIDE4MDtcbiAgfVxuXG4gIHJldHVybiBuZXcgVmVjdG9yKCBNYXRoLmNvcyggYW5nbGUgKSwgTWF0aC5zaW4oIGFuZ2xlICkgKTtcbn07XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0YDQsNC90LTQvtC80L3Ri9C5INCy0LXQutGC0L7RgC5cbiAqIEB2aXJ0dWFsXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yLnJhbmRvbVxuICogQHJldHVybiB7djYuQWJzdHJhY3RWZWN0b3J9INCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC90L7RgNC80LDQu9C40LfQvtCy0LDQvdC90YvQuSDQstC10LrRgtC+0YAg0YEg0YDQsNC90LTQvtC80L3Ri9C8INC90LDQv9GA0LDQstC70LXQvdC40LXQvC5cbiAqL1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINCy0LXQutGC0L7RgCDRgSDQvdCw0L/RgNCw0LLQu9C10L3QuNC10Lwg0YDQsNCy0L3Ri9C8IGBcImFuZ2xlXCJgLlxuICogQHZpcnR1YWxcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IuZnJvbUFuZ2xlXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgYW5nbGUg0J3QsNC/0YDQsNCy0LvQtdC90LjQtSDQstC10LrRgtC+0YDQsC5cbiAqIEByZXR1cm4ge3Y2LkFic3RyYWN0VmVjdG9yfSAgICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQvdC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdGL0Lkg0LLQtdC60YLQvtGALlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gQWJzdHJhY3RWZWN0b3I7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzZXR0aW5ncyAgICAgICA9IHJlcXVpcmUoICcuLi9zZXR0aW5ncycgKTtcbnZhciBBYnN0cmFjdFZlY3RvciA9IHJlcXVpcmUoICcuL0Fic3RyYWN0VmVjdG9yJyApO1xuXG4vKipcbiAqIDJEINCy0LXQutGC0L7RgC5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5WZWN0b3IyRFxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RWZWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSBYINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gKiBAZXhhbXBsZVxuICogdmFyIFZlY3RvcjJEID0gcmVxdWlyZSggJ3Y2LmpzL21hdGgvVmVjdG9yMkQnICk7XG4gKiB2YXIgcG9zaXRpb24gPSBuZXcgVmVjdG9yMkQoIDQsIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiA0LCB5OiAyIH1cbiAqL1xuZnVuY3Rpb24gVmVjdG9yMkQgKCB4LCB5IClcbntcbiAgLyoqXG4gICAqIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuVmVjdG9yMkQjeFxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgeCA9IG5ldyBWZWN0b3IyRCggNCwgMiApLng7IC8vIC0+IDRcbiAgICovXG5cbiAgLyoqXG4gICAqIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuVmVjdG9yMkQjeVxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgeSA9IG5ldyBWZWN0b3IyRCggNCwgMiApLnk7IC8vIC0+IDJcbiAgICovXG5cbiAgdGhpcy5zZXQoIHgsIHkgKTtcbn1cblxuVmVjdG9yMkQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RWZWN0b3IucHJvdG90eXBlICk7XG5WZWN0b3IyRC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBWZWN0b3IyRDtcblxuLyoqXG4gKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI3NldFxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCd0L7QstCw0Y8gWCDQutC+0L7RgNC00LjQvdCw0YLQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQndC+0LLQsNGPIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuc2V0KCA0LCAyICk7IC8vIFZlY3RvcjJEIHsgeDogNCwgeTogMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQgKCB4LCB5IClcbntcbiAgdGhpcy54ID0geCB8fCAwO1xuICB0aGlzLnkgPSB5IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC+0LHQsNCy0LvRj9C10YIg0Log0LrQvtC+0YDQtNC40L3QsNGC0LDQvCBYINC4IFkg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC1INC/0LDRgNCw0LzQtdGC0YDRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjYWRkXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvdC+LlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLmFkZCggNCwgMiApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkICggeCwgeSApXG57XG4gIHRoaXMueCArPSB4IHx8IDA7XG4gIHRoaXMueSArPSB5IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQktGL0YfQuNGC0LDQtdGCINC40Lcg0LrQvtC+0YDQtNC40L3QsNGCIFgg0LggWSDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LUg0L/QsNGA0LDQvNC10YLRgNGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNzdWJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LLRi9GH0YLQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINCy0YvRh9GC0LXQvdC+LlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLnN1YiggNCwgMiApOyAvLyBWZWN0b3IyRCB7IHg6IC00LCB5OiAtMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbiBzdWIgKCB4LCB5IClcbntcbiAgdGhpcy54IC09IHggfHwgMDtcbiAgdGhpcy55IC09IHkgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCj0LzQvdC+0LbQsNC10YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgYHZhbHVlYC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbXVsXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUg0KfQuNGB0LvQviwg0L3QsCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDRg9C80L3QvtC20LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLm11bCggMiApOyAvLyBWZWN0b3IyRCB7IHg6IDgsIHk6IDQgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUubXVsID0gZnVuY3Rpb24gbXVsICggdmFsdWUgKVxue1xuICB0aGlzLnggKj0gdmFsdWU7XG4gIHRoaXMueSAqPSB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCU0LXQu9C40YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgYHZhbHVlYC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjZGl2XG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUg0KfQuNGB0LvQviwg0L3QsCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDRgNCw0LfQtNC10LvQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkuZGl2KCAyICk7IC8vIFZlY3RvcjJEIHsgeDogMiwgeTogMSB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kaXYgPSBmdW5jdGlvbiBkaXYgKCB2YWx1ZSApXG57XG4gIHRoaXMueCAvPSB2YWx1ZTtcbiAgdGhpcy55IC89IHZhbHVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNkb3RcbiAqIEBwYXJhbSAge251bWJlcn0gW3g9MF1cbiAqIEBwYXJhbSAge251bWJlcn0gW3k9MF1cbiAqIEByZXR1cm4ge251bWJlcn1cbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5kaXYoIDIsIDMgKTsgLy8gMTQsINC/0L7RgtC+0LzRgyDRh9GC0L46IFwiKDQgKiAyKSArICgyICogMykgPSA4ICsgNiA9IDE0XCJcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uIGRvdCAoIHgsIHkgKVxue1xuICByZXR1cm4gKCB0aGlzLnggKiAoIHggfHwgMCApICkgK1xuICAgICAgICAgKCB0aGlzLnkgKiAoIHkgfHwgMCApICk7XG59O1xuXG4vKipcbiAqINCY0L3RgtC10YDQv9C+0LvQuNGA0YPQtdGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvNC10LbQtNGDINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQvNC4INC/0LDRgNCw0LzQtdGC0YDQsNC80LguXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2xlcnBcbiAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gKiBAcGFyYW0ge251bWJlcn0geVxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkubGVycCggOCwgNCwgMC41ICk7IC8vIFZlY3RvcjJEIHsgeDogNiwgeTogMyB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKCB4LCB5LCB2YWx1ZSApXG57XG4gIHRoaXMueCArPSAoIHggLSB0aGlzLnggKSAqIHZhbHVlIHx8IDA7XG4gIHRoaXMueSArPSAoIHkgLSB0aGlzLnkgKSAqIHZhbHVlIHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQmtC+0L/QuNGA0YPQtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI3NldFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0YHQutC+0L/QuNGA0L7QstCw0YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5zZXRWZWN0b3IoIG5ldyBWZWN0b3IyRCggNCwgMiApICk7IC8vIFZlY3RvcjJEIHsgeDogNCwgeTogMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5zZXRWZWN0b3IgPSBmdW5jdGlvbiBzZXRWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5zZXQoIHZlY3Rvci54LCB2ZWN0b3IueSApO1xufTtcblxuLyoqXG4gKiDQlNC+0LHQsNCy0LvRj9C10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjYWRkVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQtNC+0LHQsNCy0LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLmFkZFZlY3RvciggbmV3IFZlY3RvcjJEKCA0LCAyICkgKTsgLy8gVmVjdG9yMkQgeyB4OiA0LCB5OiAyIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmFkZFZlY3RvciA9IGZ1bmN0aW9uIGFkZFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLmFkZCggdmVjdG9yLngsIHZlY3Rvci55ICk7XG59O1xuXG4vKipcbiAqINCS0YvRh9C40YLQsNC10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjc3ViVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQstGL0YfQtdGB0YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5zdWJWZWN0b3IoIG5ldyBWZWN0b3IyRCggNCwgMiApICk7IC8vIFZlY3RvcjJEIHsgeDogLTQsIHk6IC0yIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnN1YlZlY3RvciA9IGZ1bmN0aW9uIHN1YlZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLnN1YiggdmVjdG9yLngsIHZlY3Rvci55ICk7XG59O1xuXG4vKipcbiAqINCj0LzQvdC+0LbQsNC10YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgWCDQuCBZINC00YDRg9Cz0L7Qs9C+INCy0LXQutGC0L7RgNCwLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNtdWxWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAg0LTQu9GPINGD0LzQvdC+0LbQtdC90LjRjy5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5tdWxWZWN0b3IoIG5ldyBWZWN0b3IyRCggMiwgMyApICk7IC8vIFZlY3RvcjJEIHsgeDogOCwgeTogNiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5tdWxWZWN0b3IgPSBmdW5jdGlvbiBtdWxWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICB0aGlzLnggKj0gdmVjdG9yLng7XG4gIHRoaXMueSAqPSB2ZWN0b3IueTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCU0LXQu9C40YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgWCDQuCBZINC00YDRg9Cz0L7Qs9C+INCy0LXQutGC0L7RgNCwLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNkaXZWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC90LAg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LTQtdC70LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmRpdlZlY3RvciggbmV3IFZlY3RvcjJEKCAyLCAwLjUgKSApOyAvLyBWZWN0b3IyRCB7IHg6IDIsIHk6IDQgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuZGl2VmVjdG9yID0gZnVuY3Rpb24gZGl2VmVjdG9yICggdmVjdG9yIClcbntcbiAgdGhpcy54IC89IHZlY3Rvci54O1xuICB0aGlzLnkgLz0gdmVjdG9yLnk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2RvdFZlY3RvclxuICogQHBhcmFtICB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmRvdFZlY3RvciggbmV3IFZlY3RvcjJEKCAzLCA1ICkgKTsgLy8gLT4gMjJcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmRvdFZlY3RvciA9IGZ1bmN0aW9uIGRvdFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLmRvdCggdmVjdG9yLngsIHZlY3Rvci55ICk7XG59O1xuXG4vKipcbiAqINCY0L3RgtC10YDQv9C+0LvQuNGA0YPQtdGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvNC10LbQtNGDINC00YDRg9Cz0LjQvCDQstC10LrRgtC+0YDQvtC8LlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNsZXJwVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgIHZhbHVlXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkubGVycFZlY3RvciggbmV3IFZlY3RvcjJEKCAyLCAxICksIDAuNSApOyAvLyBWZWN0b3IyRCB7IHg6IDMsIHk6IDEuNSB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5sZXJwVmVjdG9yID0gZnVuY3Rpb24gbGVycFZlY3RvciAoIHZlY3RvciwgdmFsdWUgKVxue1xuICByZXR1cm4gdGhpcy5sZXJwKCB2ZWN0b3IueCwgdmVjdG9yLnksIHZhbHVlICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNtYWdTcVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUubWFnU3EgPSBmdW5jdGlvbiBtYWdTcSAoKVxue1xuICByZXR1cm4gKCB0aGlzLnggKiB0aGlzLnggKSArICggdGhpcy55ICogdGhpcy55ICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNjbG9uZVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSAoKVxue1xuICByZXR1cm4gbmV3IFZlY3RvcjJEKCB0aGlzLngsIHRoaXMueSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjZGlzdFxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuZGlzdCA9IGZ1bmN0aW9uIGRpc3QgKCB2ZWN0b3IgKVxue1xuICB2YXIgeCA9IHZlY3Rvci54IC0gdGhpcy54O1xuICB2YXIgeSA9IHZlY3Rvci55IC0gdGhpcy55O1xuICByZXR1cm4gTWF0aC5zcXJ0KCAoIHggKiB4ICkgKyAoIHkgKiB5ICkgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI3RvU3RyaW5nXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpXG57XG4gIHJldHVybiAndjYuVmVjdG9yMkQgeyB4OiAnICsgdGhpcy54LnRvRml4ZWQoIDIgKSArICcsIHk6ICcgKyB0aGlzLnkudG9GaXhlZCggMiApICsgJyB9Jztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRC5yYW5kb21cbiAqIEBzZWUgdjYuQWJzdHJhY3RWZWN0b3IucmFuZG9tXG4gKi9cblZlY3RvcjJELnJhbmRvbSA9IGZ1bmN0aW9uIHJhbmRvbSAoKVxue1xuICB2YXIgdmFsdWU7XG5cbiAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgIHZhbHVlID0gMzYwO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gTWF0aC5QSSAqIDI7XG4gIH1cblxuICByZXR1cm4gVmVjdG9yMkQuZnJvbUFuZ2xlKCBNYXRoLnJhbmRvbSgpICogdmFsdWUgKTtcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRC5mcm9tQW5nbGVcbiAqIEBzZWUgdjYuQWJzdHJhY3RWZWN0b3IuZnJvbUFuZ2xlXG4gKi9cblZlY3RvcjJELmZyb21BbmdsZSA9IGZ1bmN0aW9uIGZyb21BbmdsZSAoIGFuZ2xlIClcbntcbiAgcmV0dXJuIEFic3RyYWN0VmVjdG9yLl9mcm9tQW5nbGUoIFZlY3RvcjJELCBhbmdsZSApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3IyRDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEFic3RyYWN0VmVjdG9yID0gcmVxdWlyZSggJy4vQWJzdHJhY3RWZWN0b3InICk7XG5cbi8qKlxuICogM0Qg0LLQtdC60YLQvtGALlxuICogQGNvbnN0cnVjdG9yIHY2LlZlY3RvcjNEXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdFZlY3RvclxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0gWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbej0wXSBaINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICogQGV4YW1wbGVcbiAqIHZhciBWZWN0b3IzRCA9IHJlcXVpcmUoICd2Ni5qcy9tYXRoL1ZlY3RvcjNEJyApO1xuICogdmFyIHBvc2l0aW9uID0gbmV3IFZlY3RvcjNEKCA0LCAyLCAzICk7IC8vIFZlY3RvcjNEIHsgeDogNCwgeTogMiwgejogMyB9XG4gKi9cbmZ1bmN0aW9uIFZlY3RvcjNEICggeCwgeSwgeiApXG57XG4gIC8qKlxuICAgKiBYINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlZlY3RvcjNEI3hcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHggPSBuZXcgVmVjdG9yM0QoIDQsIDIsIDMgKS54OyAvLyAtPiA0XG4gICAqL1xuXG4gIC8qKlxuICAgKiBZINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlZlY3RvcjNEI3lcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHkgPSBuZXcgVmVjdG9yM0QoIDQsIDIsIDMgKS55OyAvLyAtPiAyXG4gICAqL1xuXG4gIC8qKlxuICAgKiBaINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlZlY3RvcjNEI3pcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHogPSBuZXcgVmVjdG9yM0QoIDQsIDIsIDMgKS56OyAvLyAtPiAzXG4gICAqL1xuXG4gIHRoaXMuc2V0KCB4LCB5LCB6ICk7XG59XG5cblZlY3RvcjNELnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0VmVjdG9yLnByb3RvdHlwZSApO1xuVmVjdG9yM0QucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVmVjdG9yM0Q7XG5cbi8qKlxuICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0Qjc2V0XG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0J3QvtCy0LDRjyBYINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCd0L7QstCw0Y8gWSDQutC+0L7RgNC00LjQvdCw0YLQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbej0wXSDQndC+0LLQsNGPIFog0LrQvtC+0YDQtNC40L3QsNGC0LAuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuc2V0KCA0LCAyLCA2ICk7IC8vIFZlY3RvcjNEIHsgeDogNCwgeTogMiwgejogNiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQgKCB4LCB5LCB6IClcbntcbiAgdGhpcy54ID0geCB8fCAwO1xuICB0aGlzLnkgPSB5IHx8IDA7XG4gIHRoaXMueiA9IHogfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQuiDQutC+0L7RgNC00LjQvdCw0YLQsNC8IFgsIFksINC4IFog0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC1INC/0LDRgNCw0LzQtdGC0YDRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjYWRkXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt6PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuYWRkKCA0LCAyLCA2ICk7IC8vIFZlY3RvcjNEIHsgeDogNCwgeTogMiwgejogNiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQgKCB4LCB5LCB6IClcbntcbiAgdGhpcy54ICs9IHggfHwgMDtcbiAgdGhpcy55ICs9IHkgfHwgMDtcbiAgdGhpcy56ICs9IHogfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCS0YvRh9C40YLQsNC10YIg0LjQtyDQutC+0L7RgNC00LjQvdCw0YIgWCwgWSwg0LggWiDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LUg0L/QsNGA0LDQvNC10YLRgNGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNzdWJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LLRi9GH0YLQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINCy0YvRh9GC0LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt6PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5zdWIoIDQsIDIsIDYgKTsgLy8gVmVjdG9yM0QgeyB4OiAtNCwgeTogLTIsIHo6IC02IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uIHN1YiAoIHgsIHksIHogKVxue1xuICB0aGlzLnggLT0geCB8fCAwO1xuICB0aGlzLnkgLT0geSB8fCAwO1xuICB0aGlzLnogLT0geiB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0KPQvNC90L7QttCw0LXRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgYHZhbHVlYC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbXVsXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUg0KfQuNGB0LvQviwg0L3QsCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDRg9C80L3QvtC20LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLm11bCggMiApOyAvLyBWZWN0b3IzRCB7IHg6IDgsIHk6IDQsIHo6IDEyIH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLm11bCA9IGZ1bmN0aW9uIG11bCAoIHZhbHVlIClcbntcbiAgdGhpcy54ICo9IHZhbHVlO1xuICB0aGlzLnkgKj0gdmFsdWU7XG4gIHRoaXMueiAqPSB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCU0LXQu9C40YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIGB2YWx1ZWAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2RpdlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCn0LjRgdC70L4sINC90LAg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0YDQsNC30LTQtdC70LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmRpdiggMiApOyAvLyBWZWN0b3IzRCB7IHg6IDIsIHk6IDEsIHo6IDMgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZGl2ID0gZnVuY3Rpb24gZGl2ICggdmFsdWUgKVxue1xuICB0aGlzLnggLz0gdmFsdWU7XG4gIHRoaXMueSAvPSB2YWx1ZTtcbiAgdGhpcy56IC89IHZhbHVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNkb3RcbiAqIEBwYXJhbSAge251bWJlcn0gW3g9MF1cbiAqIEBwYXJhbSAge251bWJlcn0gW3k9MF1cbiAqIEBwYXJhbSAge251bWJlcn0gW3o9MF1cbiAqIEByZXR1cm4ge251bWJlcn1cbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5kb3QoIDIsIDMsIDQgKTsgLy8gLT4gMzgsINC/0L7RgtC+0LzRgyDRh9GC0L46IFwiKDQgKiAyKSArICgyICogMykgKyAoNiAqIDQpID0gOCArIDYgKyAyNCA9IDM4XCJcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uIGRvdCAoIHgsIHksIHogKVxue1xuICByZXR1cm4gKCB0aGlzLnggKiAoIHggfHwgMCApICkgK1xuICAgICAgICAgKCB0aGlzLnkgKiAoIHkgfHwgMCApICkgK1xuICAgICAgICAgKCB0aGlzLnogKiAoIHogfHwgMCApICk7XG59O1xuXG4vKipcbiAqINCY0L3RgtC10YDQv9C+0LvQuNGA0YPQtdGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNsZXJwXG4gKiBAcGFyYW0ge251bWJlcn0geFxuICogQHBhcmFtIHtudW1iZXJ9IHlcbiAqIEBwYXJhbSB7bnVtYmVyfSB6XG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5sZXJwKCA4LCA0LCAxMiwgMC41ICk7IC8vIFZlY3RvcjNEIHsgeDogNiwgeTogMywgejogOSB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKCB4LCB5LCB6LCB2YWx1ZSApXG57XG4gIHRoaXMueCArPSAoIHggLSB0aGlzLnggKSAqIHZhbHVlIHx8IDA7XG4gIHRoaXMueSArPSAoIHkgLSB0aGlzLnkgKSAqIHZhbHVlIHx8IDA7XG4gIHRoaXMueiArPSAoIHogLSB0aGlzLnogKSAqIHZhbHVlIHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQmtC+0L/QuNGA0YPQtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3NldFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0YHQutC+0L/QuNGA0L7QstCw0YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5zZXRWZWN0b3IoIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApICk7IC8vIFZlY3RvcjNEIHsgeDogNCwgeTogMiwgejogNiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5zZXRWZWN0b3IgPSBmdW5jdGlvbiBzZXRWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5zZXQoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnogKTtcbn07XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2FkZFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LTQvtCx0LDQstC40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5hZGRWZWN0b3IoIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApICk7IC8vIFZlY3RvcjNEIHsgeDogNCwgeTogMiwgejogNiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5hZGRWZWN0b3IgPSBmdW5jdGlvbiBhZGRWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5hZGQoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnogKTtcbn07XG5cbi8qKlxuICog0JLRi9GH0LjRgtCw0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNzdWJWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INCy0YvRh9C10YHRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLnN1YlZlY3RvciggbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiAtNCwgeTogLTIsIHo6IC02IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLnN1YlZlY3RvciA9IGZ1bmN0aW9uIHN1YlZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLnN1YiggdmVjdG9yLngsIHZlY3Rvci55LCB2ZWN0b3IueiApO1xufTtcblxuLyoqXG4gKiDQo9C80L3QvtC20LDQtdGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBYLCBZLCDQuCBaINC00YDRg9Cz0L7Qs9C+INCy0LXQutGC0L7RgNCwLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNtdWxWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAg0LTQu9GPINGD0LzQvdC+0LbQtdC90LjRjy5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5tdWxWZWN0b3IoIG5ldyBWZWN0b3IzRCggMiwgMywgNCApICk7IC8vIFZlY3RvcjNEIHsgeDogOCwgeTogNiwgejogMjQgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUubXVsVmVjdG9yID0gZnVuY3Rpb24gbXVsVmVjdG9yICggdmVjdG9yIClcbntcbiAgdGhpcy54ICo9IHZlY3Rvci54O1xuICB0aGlzLnkgKj0gdmVjdG9yLnk7XG4gIHRoaXMueiAqPSB2ZWN0b3IuejtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCU0LXQu9C40YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIFgsIFksINC4IFog0LTRgNGD0LPQvtCz0L4g0LLQtdC60YLQvtGA0LAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2RpdlZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0L3QsCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQtNC10LvQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkuZGl2VmVjdG9yKCBuZXcgVmVjdG9yM0QoIDIsIDAuNSwgNCApICk7IC8vIFZlY3RvcjNEIHsgeDogMiwgeTogNCwgejogMS41IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmRpdlZlY3RvciA9IGZ1bmN0aW9uIGRpdlZlY3RvciAoIHZlY3RvciApXG57XG4gIHRoaXMueCAvPSB2ZWN0b3IueDtcbiAgdGhpcy55IC89IHZlY3Rvci55O1xuICB0aGlzLnogLz0gdmVjdG9yLno7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2RvdFZlY3RvclxuICogQHBhcmFtICB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmRvdFZlY3RvciggbmV3IFZlY3RvcjNEKCAyLCAzLCAtMiApICk7IC8vIC0+IDJcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmRvdFZlY3RvciA9IGZ1bmN0aW9uIGRvdFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLmRvdCggdmVjdG9yLngsIHZlY3Rvci55LCB2ZWN0b3IueiApO1xufTtcblxuLyoqXG4gKiDQmNC90YLQtdGA0L/QvtC70LjRgNGD0LXRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC80LXQttC00YMg0LTRgNGD0LPQuNC8INCy0LXQutGC0L7RgNC+0LwuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2xlcnBWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvclxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgdmFsdWVcbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5sZXJwVmVjdG9yKCBuZXcgVmVjdG9yM0QoIDgsIDQsIDEyICksIDAuNSApOyAvLyBWZWN0b3IzRCB7IHg6IDYsIHk6IDMsIHo6IDkgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUubGVycFZlY3RvciA9IGZ1bmN0aW9uIGxlcnBWZWN0b3IgKCB2ZWN0b3IsIHZhbHVlIClcbntcbiAgcmV0dXJuIHRoaXMubGVycCggdmVjdG9yLngsIHZlY3Rvci55LCB2ZWN0b3IueiwgdmFsdWUgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI21hZ1NxXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5tYWdTcSA9IGZ1bmN0aW9uIG1hZ1NxICgpXG57XG4gIHJldHVybiAoIHRoaXMueCAqIHRoaXMueCApICsgKCB0aGlzLnkgKiB0aGlzLnkgKSArICggdGhpcy56ICogdGhpcy56ICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNjbG9uZVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSAoKVxue1xuICByZXR1cm4gbmV3IFZlY3RvcjNEKCB0aGlzLngsIHRoaXMueSwgdGhpcy56ICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNkaXN0XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kaXN0ID0gZnVuY3Rpb24gZGlzdCAoIHZlY3RvciApXG57XG4gIHZhciB4ID0gdmVjdG9yLnggLSB0aGlzLng7XG4gIHZhciB5ID0gdmVjdG9yLnkgLSB0aGlzLnk7XG4gIHZhciB6ID0gdmVjdG9yLnogLSB0aGlzLno7XG4gIHJldHVybiBNYXRoLnNxcnQoICggeCAqIHggKSArICggeSAqIHkgKSArICggeiAqIHogKSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjdG9TdHJpbmdcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKClcbntcbiAgcmV0dXJuICd2Ni5WZWN0b3IzRCB7IHg6ICcgKyB0aGlzLngudG9GaXhlZCggMiApICsgJywgeTogJyArIHRoaXMueS50b0ZpeGVkKCAyICkgKyAnLCB6OiAnICsgdGhpcy56LnRvRml4ZWQoIDIgKSArICcgfSc7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QucmFuZG9tXG4gKiBAc2VlIHY2LkFic3RyYWN0VmVjdG9yLnJhbmRvbVxuICovXG5WZWN0b3IzRC5yYW5kb20gPSBmdW5jdGlvbiByYW5kb20gKClcbntcbiAgLy8gVXNlIHRoZSBlcXVhbC1hcmVhIHByb2plY3Rpb24gYWxnb3JpdGhtLlxuICB2YXIgdGhldGEgPSBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSAqIDI7XG4gIHZhciB6ICAgICA9ICggTWF0aC5yYW5kb20oKSAqIDIgKSAtIDE7XG4gIHZhciBuICAgICA9IE1hdGguc3FydCggMSAtICggeiAqIHogKSApO1xuICByZXR1cm4gbmV3IFZlY3RvcjNEKCBuICogTWF0aC5jb3MoIHRoZXRhICksIG4gKiBNYXRoLnNpbiggdGhldGEgKSwgeiApO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNELmZyb21BbmdsZVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5mcm9tQW5nbGVcbiAqL1xuVmVjdG9yM0QuZnJvbUFuZ2xlID0gZnVuY3Rpb24gZnJvbUFuZ2xlICggYW5nbGUgKVxue1xuICByZXR1cm4gQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZSggVmVjdG9yM0QsIGFuZ2xlICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjNEO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCt0YLQviDQv9GA0L7RgdGC0YDQsNC90YHRgtCy0L4g0LjQvNC10L0gKNGN0YLQvtGCIG5hbWVwc3BhY2UpINGA0LXQsNC70LjQt9GD0LXRgiDRgNCw0LHQvtGC0YMg0YEgMkQg0LzQsNGC0YDQuNGG0LDQvNC4IDN4My5cbiAqIEBuYW1lc3BhY2UgdjYubWF0M1xuICogQGV4YW1wbGVcbiAqIHZhciBtYXQzID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvbWF0aC9tYXQzJyApO1xuICovXG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0YHRgtCw0L3QtNCw0YDRgtC90YPRjiAoaWRlbnRpdHkpIDN4MyDQvNCw0YLRgNC40YbRgy5cbiAqIEBtZXRob2QgdjYubWF0My5pZGVudGl0eVxuICogQHJldHVybiB7QXJyYXkuPG51bWJlcj59INCd0L7QstCw0Y8g0LzQsNGC0YDQuNGG0LAuXG4gKiBAZXhhbXBsZVxuICogLy8gUmV0dXJucyB0aGUgaWRlbnRpdHkuXG4gKiB2YXIgbWF0cml4ID0gbWF0My5pZGVudGl0eSgpO1xuICovXG5leHBvcnRzLmlkZW50aXR5ID0gZnVuY3Rpb24gaWRlbnRpdHkgKClcbntcbiAgcmV0dXJuIFtcbiAgICAxLCAwLCAwLFxuICAgIDAsIDEsIDAsXG4gICAgMCwgMCwgMVxuICBdO1xufTtcblxuLyoqXG4gKiDQodCx0YDQsNGB0YvQstCw0LXRgiDQvNCw0YLRgNC40YbRgyBgXCJtMVwiYCDQtNC+INGB0YLQsNC90LTQsNGA0YLQvdGL0YUgKGlkZW50aXR5KSDQt9C90LDRh9C10L3QuNC5LlxuICogQG1ldGhvZCB2Ni5tYXQzLnNldElkZW50aXR5XG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEg0JzQsNGC0YDQuNGG0LAuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gU2V0cyB0aGUgaWRlbnRpdHkuXG4gKiBtYXQzLnNldElkZW50aXR5KCBtYXRyaXggKTtcbiAqL1xuZXhwb3J0cy5zZXRJZGVudGl0eSA9IGZ1bmN0aW9uIHNldElkZW50aXR5ICggbTEgKVxue1xuICBtMVsgMCBdID0gMTtcbiAgbTFbIDEgXSA9IDA7XG4gIG0xWyAyIF0gPSAwO1xuICBtMVsgMyBdID0gMDtcbiAgbTFbIDQgXSA9IDE7XG4gIG0xWyA1IF0gPSAwO1xuICBtMVsgNiBdID0gMDtcbiAgbTFbIDcgXSA9IDA7XG4gIG0xWyA4IF0gPSAxO1xufTtcblxuLyoqXG4gKiDQmtC+0L/QuNGA0YPQtdGCINC30L3QsNGH0LXQvdC40Y8g0LzQsNGC0YDQuNGG0YsgYFwibTJcImAg0L3QsCDQvNCw0YLRgNC40YbRgyBgXCJtMVwiYC5cbiAqIEBtZXRob2QgdjYubWF0My5jb3B5XG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEg0JzQsNGC0YDQuNGG0LAsINCyINC60L7RgtC+0YDRg9GOINC90LDQtNC+INC60L7Qv9C40YDQvtCy0LDRgtGMLlxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0yINCc0LDRgtGA0LjRhtCwLCDQutC+0YLQvtGA0YPRjiDQvdCw0LTQviDRgdC60L7Qv9C40YDQvtCy0LDRgtGMLlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIENvcGllcyBhIG1hdHJpeC5cbiAqIG1hdDMuY29weSggZGVzdGluYXRpb25NYXRyaXgsIHNvdXJjZU1hdHJpeCApO1xuICovXG5leHBvcnRzLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICggbTEsIG0yIClcbntcbiAgbTFbIDAgXSA9IG0yWyAwIF07XG4gIG0xWyAxIF0gPSBtMlsgMSBdO1xuICBtMVsgMiBdID0gbTJbIDIgXTtcbiAgbTFbIDMgXSA9IG0yWyAzIF07XG4gIG0xWyA0IF0gPSBtMlsgNCBdO1xuICBtMVsgNSBdID0gbTJbIDUgXTtcbiAgbTFbIDYgXSA9IG0yWyA2IF07XG4gIG0xWyA3IF0gPSBtMlsgNyBdO1xuICBtMVsgOCBdID0gbTJbIDggXTtcbn07XG5cbi8qKlxuICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LrQu9C+0L0g0LzQsNGC0YDQuNGG0YsgYFwibTFcImAuXG4gKiBAbWV0aG9kIHY2Lm1hdDMuY2xvbmVcbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSDQmNGB0YXQvtC00L3QsNGPINC80LDRgtGA0LjRhtCwLlxuICogQHJldHVybiB7QXJyYXkuPG51bWJlcj59ICAgINCa0LvQvtC9INC80LDRgtGA0LjRhtGLLlxuICogQGV4YW1wbGVcbiAqIC8vIENyZWF0ZXMgYSBjbG9uZS5cbiAqIHZhciBjbG9uZSA9IG1hdDMuY2xvbmUoIG1hdHJpeCApO1xuICovXG5leHBvcnRzLmNsb25lID0gZnVuY3Rpb24gY2xvbmUgKCBtMSApXG57XG4gIHJldHVybiBbXG4gICAgbTFbIDAgXSxcbiAgICBtMVsgMSBdLFxuICAgIG0xWyAyIF0sXG4gICAgbTFbIDMgXSxcbiAgICBtMVsgNCBdLFxuICAgIG0xWyA1IF0sXG4gICAgbTFbIDYgXSxcbiAgICBtMVsgNyBdLFxuICAgIG0xWyA4IF1cbiAgXTtcbn07XG5cbi8qKlxuICog0J/QtdGA0LXQvNC10YnQsNC10YIg0LzQsNGC0YDQuNGG0YMgYFwibTFcImAuXG4gKiBAbWV0aG9kIHY2Lm1hdDMudHJhbnNsYXRlXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEg0JzQsNGC0YDQuNGG0LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgeCAgWCDQv9C10YDQtdC80LXRidC10L3QuNGPLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIHkgIFkg0L/QtdGA0LXQvNC10YnQtdC90LjRjy5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiAvLyBUcmFuc2xhdGVzIGJ5IFsgNCwgMiBdLlxuICogbWF0My50cmFuc2xhdGUoIG1hdHJpeCwgNCwgMiApO1xuICovXG5leHBvcnRzLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uIHRyYW5zbGF0ZSAoIG0xLCB4LCB5IClcbntcbiAgbTFbIDYgXSA9ICggeCAqIG0xWyAwIF0gKSArICggeSAqIG0xWyAzIF0gKSArIG0xWyA2IF07XG4gIG0xWyA3IF0gPSAoIHggKiBtMVsgMSBdICkgKyAoIHkgKiBtMVsgNCBdICkgKyBtMVsgNyBdO1xuICBtMVsgOCBdID0gKCB4ICogbTFbIDIgXSApICsgKCB5ICogbTFbIDUgXSApICsgbTFbIDggXTtcbn07XG5cbi8qKlxuICog0J/QvtCy0L7RgNCw0YfQuNCy0LDQtdGCINC80LDRgtGA0LjRhtGDIGBcIm0xXCJgINC90LAgYFwiYW5nbGVcImAg0YDQsNC00LjQsNC90L7Qsi5cbiAqIEBtZXRob2QgdjYubWF0My5yb3RhdGVcbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSAgICDQnNCw0YLRgNC40YbQsC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBhbmdsZSDQo9Cz0L7Quy5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiAvLyBSb3RhdGVzIGJ5IDQ1IGRlZ3JlZXMuXG4gKiBtYXQzLnJvdGF0ZSggbWF0cml4LCA0NSAqIE1hdGguUEkgLyAxODAgKTtcbiAqL1xuZXhwb3J0cy5yb3RhdGUgPSBmdW5jdGlvbiByb3RhdGUgKCBtMSwgYW5nbGUgKVxue1xuICB2YXIgbTEwID0gbTFbIDAgXTtcbiAgdmFyIG0xMSA9IG0xWyAxIF07XG4gIHZhciBtMTIgPSBtMVsgMiBdO1xuICB2YXIgbTEzID0gbTFbIDMgXTtcbiAgdmFyIG0xNCA9IG0xWyA0IF07XG4gIHZhciBtMTUgPSBtMVsgNSBdO1xuICB2YXIgeCA9IE1hdGguY29zKCBhbmdsZSApO1xuICB2YXIgeSA9IE1hdGguc2luKCBhbmdsZSApO1xuICBtMVsgMCBdID0gKCB4ICogbTEwICkgKyAoIHkgKiBtMTMgKTtcbiAgbTFbIDEgXSA9ICggeCAqIG0xMSApICsgKCB5ICogbTE0ICk7XG4gIG0xWyAyIF0gPSAoIHggKiBtMTIgKSArICggeSAqIG0xNSApO1xuICBtMVsgMyBdID0gKCB4ICogbTEzICkgLSAoIHkgKiBtMTAgKTtcbiAgbTFbIDQgXSA9ICggeCAqIG0xNCApIC0gKCB5ICogbTExICk7XG4gIG0xWyA1IF0gPSAoIHggKiBtMTUgKSAtICggeSAqIG0xMiApO1xufTtcblxuLyoqXG4gKiDQnNCw0YHRiNGC0LDQsdC40YDRg9C10YIg0LzQsNGC0YDQuNGG0YMuXG4gKiBAbWV0aG9kIHY2Lm1hdDMuc2NhbGVcbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSDQnNCw0YLRgNC40YbQsC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICB4ICBYLdGE0LDQutGC0L7RgC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICB5ICBZLdGE0LDQutGC0L7RgC5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiAvLyBTY2FsZXMgaW4gWyAyLCAyIF0gdGltZXMuXG4gKiBtYXQzLnNjYWxlKCBtYXRyaXgsIDIsIDIgKTtcbiAqL1xuZXhwb3J0cy5zY2FsZSA9IGZ1bmN0aW9uIHNjYWxlICggbTEsIHgsIHkgKVxue1xuICBtMVsgMCBdICo9IHg7XG4gIG0xWyAxIF0gKj0geDtcbiAgbTFbIDIgXSAqPSB4O1xuICBtMVsgMyBdICo9IHk7XG4gIG0xWyA0IF0gKj0geTtcbiAgbTFbIDUgXSAqPSB5O1xufTtcblxuLyoqXG4gKiDQn9GA0LjQvNC10L3Rj9C10YIg0LzQsNGC0YDQuNGG0YMg0LjQtyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40YUg0L/QsNGA0LDQvNC10YLRgNC+0LIg0L3QsCDQvNCw0YLRgNC40YbRgyBgXCJtMVwiYC5cbiAqIEBtZXRob2QgdjYubWF0My50cmFuc2Zvcm1cbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSAg0JzQsNGC0YDQuNGG0LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTExIFgg0LzQsNGB0YjRgtCw0LEgKHNjYWxlKS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMTIgWCDQvdCw0LrQu9C+0L0gKHNrZXcpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0yMSBZINC90LDQutC70L7QvSAoc2tldykuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTIyIFkg0LzQsNGB0YjRgtCw0LEgKHNjYWxlKS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBkeCAgWCDQv9C10YDQtdC80LXRidC10L3QuNGPICh0cmFuc2xhdGUpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIGR5ICBZINC/0LXRgNC10LzQtdGJ0LXQvdC40Y8gKHRyYW5zbGF0ZSkuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIEFwcGxpZXMgYSBkb3VibGUtc2NhbGVkIG1hdHJpeC5cbiAqIG1hdDMudHJhbnNmb3JtKCBtYXRyaXgsIDIsIDAsIDAsIDIsIDAsIDAgKTtcbiAqL1xuZXhwb3J0cy50cmFuc2Zvcm0gPSBmdW5jdGlvbiB0cmFuc2Zvcm0gKCBtMSwgbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxue1xuICBtMVsgMCBdICo9IG0xMTtcbiAgbTFbIDEgXSAqPSBtMjE7XG4gIG0xWyAyIF0gKj0gZHg7XG4gIG0xWyAzIF0gKj0gbTEyO1xuICBtMVsgNCBdICo9IG0yMjtcbiAgbTFbIDUgXSAqPSBkeTtcbiAgbTFbIDYgXSA9IDA7XG4gIG0xWyA3IF0gPSAwO1xufTtcblxuLyoqXG4gKiDQodCx0YDQsNGB0YvQstCw0LXRgiDQvNCw0YLRgNC40YbRgyBgXCJtMVwiYCDQtNC+INC80LDRgtGA0LjRhtGLINC40Lcg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNGFINC/0LDRgNCw0LzQtdGC0YDQvtCyLlxuICogQG1ldGhvZCB2Ni5tYXQzLnNldFRyYW5zZm9ybVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xICDQnNCw0YLRgNC40YbQsC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMTEgWCDQvNCw0YHRiNGC0LDQsSAoc2NhbGUpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0xMiBYINC90LDQutC70L7QvSAoc2tldykuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTIxIFkg0L3QsNC60LvQvtC9IChza2V3KS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMjIgWSDQvNCw0YHRiNGC0LDQsSAoc2NhbGUpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIGR4ICBYINC/0LXRgNC10LzQtdGJ0LXQvdC40Y8gKHRyYW5zbGF0ZSkuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgZHkgIFkg0L/QtdGA0LXQvNC10YnQtdC90LjRjyAodHJhbnNsYXRlKS5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gU2V0cyB0aGUgaWRlbnRpdHkgYW5kIHRoZW4gYXBwbGllcyBhIGRvdWJsZS1zY2FsZWQgbWF0cml4LlxuICogbWF0My5zZXRUcmFuc2Zvcm0oIG1hdHJpeCwgMiwgMCwgMCwgMiwgMCwgMCApO1xuICovXG5leHBvcnRzLnNldFRyYW5zZm9ybSA9IGZ1bmN0aW9uIHNldFRyYW5zZm9ybSAoIG0xLCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG57XG4gIC8vIFggc2NhbGVcbiAgbTFbIDAgXSA9IG0xMTtcbiAgLy8gWCBza2V3XG4gIG0xWyAxIF0gPSBtMTI7XG4gIC8vIFkgc2tld1xuICBtMVsgMyBdID0gbTIxO1xuICAvLyBZIHNjYWxlXG4gIG0xWyA0IF0gPSBtMjI7XG4gIC8vIFggdHJhbnNsYXRlXG4gIG0xWyA2IF0gPSBkeDtcbiAgLy8gWSB0cmFuc2xhdGVcbiAgbTFbIDcgXSA9IGR5O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBnZXRFbGVtZW50VyA9IHJlcXVpcmUoICdwZWFrby9nZXQtZWxlbWVudC13JyApO1xudmFyIGdldEVsZW1lbnRIID0gcmVxdWlyZSggJ3BlYWtvL2dldC1lbGVtZW50LWgnICk7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJy4uL2NvbnN0YW50cycgKTtcbnZhciBjcmVhdGVQb2x5Z29uID0gcmVxdWlyZSggJy4uL2ludGVybmFsL2NyZWF0ZV9wb2x5Z29uJyApO1xudmFyIHBvbHlnb25zID0gcmVxdWlyZSggJy4uL2ludGVybmFsL3BvbHlnb25zJyApO1xudmFyIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3MgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9zZXRfZGVmYXVsdF9kcmF3aW5nX3NldHRpbmdzJyApO1xudmFyIGdldFdlYkdMID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvZ2V0X3dlYmdsJyApO1xudmFyIGNvcHlEcmF3aW5nU2V0dGluZ3MgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9jb3B5X2RyYXdpbmdfc2V0dGluZ3MnICk7XG52YXIgcHJvY2Vzc1JlY3RBbGlnblggPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblg7XG52YXIgcHJvY2Vzc1JlY3RBbGlnblkgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblk7XG52YXIgcHJvY2Vzc1NoYXBlID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19zaGFwZScgKTtcbnZhciBjbG9zZVNoYXBlID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvY2xvc2Vfc2hhcGUnICk7XG52YXIgb3B0aW9ucyA9IHJlcXVpcmUoICcuL3NldHRpbmdzJyApO1xuLyoqXG4gKiDQkNCx0YHRgtGA0LDQutGC0L3Ri9C5INC60LvQsNGB0YEg0YDQtdC90LTQtdGA0LXRgNCwLlxuICogQGFic3RyYWN0XG4gKiBAY29uc3RydWN0b3IgdjYuQWJzdHJhY3RSZW5kZXJlclxuICogQHNlZSB2Ni5SZW5kZXJlckdMXG4gKiBAc2VlIHY2LlJlbmRlcmVyMkRcbiAqIEBleGFtcGxlXG4gKiB2YXIgQWJzdHJhY3RSZW5kZXJlciA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL0Fic3RyYWN0UmVuZGVyZXInICk7XG4gKi9cbmZ1bmN0aW9uIEFic3RyYWN0UmVuZGVyZXIgKClcbntcbiAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBhYnN0cmFjdCBjbGFzcyAobmV3IHY2LkFic3RyYWN0UmVuZGVyZXIpJyApO1xufVxuQWJzdHJhY3RSZW5kZXJlci5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQlNC+0LHQsNCy0LvRj9C10YIgYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINCyIERPTS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2FwcGVuZFRvXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gcGFyZW50INCt0LvQtdC80LXQvdGCLCDQsiDQutC+0YLQvtGA0YvQuSBgY2FudmFzYCDRgNC10L3QtNC10YDQtdGA0LAg0LTQvtC70LbQtdC9INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L0uXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gQWRkIHJlbmRlcmVyIGludG8gRE9NLlxuICAgKiByZW5kZXJlci5hcHBlbmRUbyggZG9jdW1lbnQuYm9keSApO1xuICAgKi9cbiAgYXBwZW5kVG86IGZ1bmN0aW9uIGFwcGVuZFRvICggcGFyZW50IClcbiAge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZCggdGhpcy5jYW52YXMgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCj0LTQsNC70Y/QtdGCIGBjYW52YXNgINGA0LXQvdC00LXRgNC10YDQsCDQuNC3IERPTS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2Rlc3Ryb3lcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZW1vdmUgcmVuZGVyZXIgZnJvbSBET00uXG4gICAqIHJlbmRlcmVyLmRlc3Ryb3koKTtcbiAgICovXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uIGRlc3Ryb3kgKClcbiAge1xuICAgIHRoaXMuY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoIHRoaXMuY2FudmFzICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQodC+0YXRgNCw0L3Rj9C10YIg0YLQtdC60YPRidC40LUg0L3QsNGB0YLRgNC+0LnQutC4INGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcHVzaFxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNhdmUgZHJhd2luZyBzZXR0aW5ncyAoZmlsbCwgbGluZVdpZHRoLi4uKSAocHVzaCBvbnRvIHN0YWNrKS5cbiAgICogcmVuZGVyZXIucHVzaCgpO1xuICAgKi9cbiAgcHVzaDogZnVuY3Rpb24gcHVzaCAoKVxuICB7XG4gICAgaWYgKCB0aGlzLl9zdGFja1sgKyt0aGlzLl9zdGFja0luZGV4IF0gKSB7XG4gICAgICBjb3B5RHJhd2luZ1NldHRpbmdzKCB0aGlzLl9zdGFja1sgdGhpcy5fc3RhY2tJbmRleCBdLCB0aGlzICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3N0YWNrLnB1c2goIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3MoIHt9LCB0aGlzICkgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQktC+0YHRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIg0L/RgNC10LTRi9C00YPRidC40LUg0L3QsNGB0YLRgNC+0LnQutC4INGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcG9wXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVzdG9yZSBkcmF3aW5nIHNldHRpbmdzIChmaWxsLCBsaW5lV2lkdGguLi4pICh0YWtlIGZyb20gc3RhY2spLlxuICAgKiByZW5kZXJlci5wb3AoKTtcbiAgICovXG4gIHBvcDogZnVuY3Rpb24gcG9wICgpXG4gIHtcbiAgICBpZiAoIHRoaXMuX3N0YWNrSW5kZXggPj0gMCApIHtcbiAgICAgIGNvcHlEcmF3aW5nU2V0dGluZ3MoIHRoaXMsIHRoaXMuX3N0YWNrWyB0aGlzLl9zdGFja0luZGV4LS0gXSApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzKCB0aGlzLCB0aGlzICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0JjQt9C80LXQvdGP0LXRgiDRgNCw0LfQvNC10YAg0YDQtdC90LTQtdGA0LXRgNCwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVzaXplXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB3INCd0L7QstCw0Y8g0YjQuNGA0LjQvdCwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gaCDQndC+0LLQsNGPINCy0YvRgdC+0YLQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXNpemUgcmVuZGVyZXIgdG8gNjAweDQwMC5cbiAgICogcmVuZGVyZXIucmVzaXplKCA2MDAsIDQwMCApO1xuICAgKi9cbiAgcmVzaXplOiBmdW5jdGlvbiByZXNpemUgKCB3LCBoIClcbiAge1xuICAgIHZhciBjYW52YXMgPSB0aGlzLmNhbnZhcztcbiAgICB2YXIgc2NhbGUgPSB0aGlzLnNldHRpbmdzLnNjYWxlO1xuICAgIGNhbnZhcy5zdHlsZS53aWR0aCA9IHcgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBoICsgJ3B4JztcbiAgICBjYW52YXMud2lkdGggPSB0aGlzLncgPSBNYXRoLmZsb29yKCB3ICogc2NhbGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICBjYW52YXMuaGVpZ2h0ID0gdGhpcy5oID0gTWF0aC5mbG9vciggaCAqIHNjYWxlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQmNC30LzQtdC90Y/QtdGCINGA0LDQt9C80LXRgCDRgNC10L3QtNC10YDQtdGA0LAg0LTQviDRgNCw0LfQvNC10YDQsCBgZWxlbWVudGAg0Y3Qu9C10LzQtdC90YLQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3Jlc2l6ZVRvXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCDQrdC70LXQvNC10L3Rgiwg0LTQviDQutC+0YLQvtGA0L7Qs9C+INC90LDQtNC+INGA0LDRgdGC0Y/QvdGD0YLRjCDRgNC10L3QtNC10YDQtdGALlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlc2l6ZSByZW5kZXJlciB0byBtYXRjaCA8Ym9keSAvPiBzaXplcy5cbiAgICogcmVuZGVyZXIucmVzaXplVG8oIGRvY3VtZW50LmJvZHkgKTtcbiAgICovXG4gIHJlc2l6ZVRvOiBmdW5jdGlvbiByZXNpemVUbyAoIGVsZW1lbnQgKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmVzaXplKCBnZXRFbGVtZW50VyggZWxlbWVudCApLCBnZXRFbGVtZW50SCggZWxlbWVudCApICk7XG4gIH0sXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0L/QvtC70LjQs9C+0L0uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNkcmF3UG9seWdvblxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgIHggICAgICAgICAgICAgWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgIHkgICAgICAgICAgICAgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgIHhSYWRpdXMgICAgICAgWCDRgNCw0LTQuNGD0YEg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB5UmFkaXVzICAgICAgIFkg0YDQsNC00LjRg9GBINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgc2lkZXMgICAgICAgICDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdGC0L7RgNC+0L0g0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICByb3RhdGlvbkFuZ2xlINCj0LPQvtC7INC/0L7QstC+0YDQvtGC0LAg0L/QvtC70LjQs9C+0L3QsFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKNGH0YLQvtCx0Ysg0L3QtSDQuNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywge0BsaW5rIHY2LlRyYW5zZm9ybSNyb3RhdGV9KS5cbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICBkZWdyZWVzICAgICAgINCY0YHQv9C+0LvRjNC30L7QstCw0YLRjCDQs9GA0LDQtNGD0YHRiy5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGhleGFnb24gYXQgWyA0LCAyIF0gd2l0aCByYWRpdXMgMjUuXG4gICAqIHJlbmRlcmVyLnBvbHlnb24oIDQsIDIsIDI1LCAyNSwgNiwgMCApO1xuICAgKi9cbiAgZHJhd1BvbHlnb246IGZ1bmN0aW9uIGRyYXdQb2x5Z29uICggeCwgeSwgeFJhZGl1cywgeVJhZGl1cywgc2lkZXMsIHJvdGF0aW9uQW5nbGUsIGRlZ3JlZXMgKVxuICB7XG4gICAgdmFyIHBvbHlnb24gPSBwb2x5Z29uc1sgc2lkZXMgXTtcbiAgICBpZiAoICEgcG9seWdvbiApIHtcbiAgICAgIHBvbHlnb24gPSBwb2x5Z29uc1sgc2lkZXMgXSA9IGNyZWF0ZVBvbHlnb24oIHNpZGVzICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgfVxuICAgIGlmICggZGVncmVlcyApIHtcbiAgICAgIHJvdGF0aW9uQW5nbGUgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICB9XG4gICAgdGhpcy5tYXRyaXguc2F2ZSgpO1xuICAgIHRoaXMubWF0cml4LnRyYW5zbGF0ZSggeCwgeSApO1xuICAgIHRoaXMubWF0cml4LnJvdGF0ZSggcm90YXRpb25BbmdsZSApO1xuICAgIHRoaXMuZHJhd0FycmF5cyggcG9seWdvbiwgcG9seWdvbi5sZW5ndGggKiAwLjUsIHZvaWQgMCwgeFJhZGl1cywgeVJhZGl1cyApO1xuICAgIHRoaXMubWF0cml4LnJlc3RvcmUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQv9C+0LvQuNCz0L7QvS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvbHlnb25cbiAgICogQHBhcmFtICB7bnVtYmVyfSB4ICAgICAgICAgICAgICAgWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IHkgICAgICAgICAgICAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gciAgICAgICAgICAgICAgINCg0LDQtNC40YPRgSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IHNpZGVzICAgICAgICAgICDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdGC0L7RgNC+0L0g0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSBbcm90YXRpb25BbmdsZV0g0KPQs9C+0Lsg0L/QvtCy0L7RgNC+0YLQsCDQv9C+0LvQuNCz0L7QvdCwXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjRh9GC0L7QsdGLINC90LUg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMIHtAbGluayB2Ni5UcmFuc2Zvcm0jcm90YXRlfSkuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBoZXhhZ29uIGF0IFsgNCwgMiBdIHdpdGggcmFkaXVzIDI1LlxuICAgKiByZW5kZXJlci5wb2x5Z29uKCA0LCAyLCAyNSwgNiApO1xuICAgKi9cbiAgcG9seWdvbjogZnVuY3Rpb24gcG9seWdvbiAoIHgsIHksIHIsIHNpZGVzLCByb3RhdGlvbkFuZ2xlIClcbiAge1xuICAgIGlmICggc2lkZXMgJSAxICkge1xuICAgICAgc2lkZXMgPSBNYXRoLmZsb29yKCBzaWRlcyAqIDEwMCApICogMC4wMTtcbiAgICB9XG4gICAgaWYgKCB0eXBlb2Ygcm90YXRpb25BbmdsZSA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICB0aGlzLmRyYXdQb2x5Z29uKCB4LCB5LCByLCByLCBzaWRlcywgLU1hdGguUEkgKiAwLjUgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3UG9seWdvbiggeCwgeSwgciwgciwgc2lkZXMsIHJvdGF0aW9uQW5nbGUsIG9wdGlvbnMuZGVncmVlcyApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjaW1hZ2VcbiAgICogQHBhcmFtIHt2Ni5BYnN0cmFjdEltYWdlfSBpbWFnZSDQmtCw0YDRgtC40L3QutCwINC60L7RgtC+0YDRg9GOINC90LDQtNC+INC+0YLRgNC40YHQvtCy0LDRgtGMLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHggICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICB5ICAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgW3ddICAg0KjQuNGA0LjQvdCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgW2hdICAg0JLRi9GB0L7RgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gQ3JlYXRlIGltYWdlLlxuICAgKiB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnaW1hZ2UnICkgKTtcbiAgICogLy8gRHJhdyBpbWFnZSBhdCBbIDQsIDIgXS5cbiAgICogcmVuZGVyZXIuaW1hZ2UoIGltYWdlLCA0LCAyICk7XG4gICAqL1xuICBpbWFnZTogZnVuY3Rpb24gaW1hZ2UgKCBpbWFnZSwgeCwgeSwgdywgaCApXG4gIHtcbiAgICBpZiAoIGltYWdlLmdldCgpLmxvYWRlZCApIHtcbiAgICAgIGlmICggdHlwZW9mIHcgPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICB3ID0gaW1hZ2UuZHc7XG4gICAgICB9XG4gICAgICBpZiAoIHR5cGVvZiBoID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgaCA9IGltYWdlLmRoO1xuICAgICAgfVxuICAgICAgeCA9IHByb2Nlc3NSZWN0QWxpZ25YKCB0aGlzLCB4LCB3ICk7XG4gICAgICB4ID0gcHJvY2Vzc1JlY3RBbGlnblkoIHRoaXMsIHksIGggKTtcbiAgICAgIHRoaXMuZHJhd0ltYWdlKCBpbWFnZSwgeCwgeSwgdywgaCApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LTQu9GPINC90LDRh9Cw0LvQsCDQvtGC0YDQuNGB0L7QstC60Lgg0YTQuNCz0YPRgNGLLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICAgKiBAcGFyYW0ge29iamVjdH0gICBbb3B0aW9uc10gICAgICAgICAgICAgINCf0LDRgNCw0LzQtdGC0YDRiyDRhNC40LPRg9GA0YsuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLmRyYXdGdW5jdGlvbl0g0KTRg9C90LrRhtC40Y8sINC60L7RgtC+0YDQvtGPINCx0YPQtNC10YIg0L7RgtGA0LjRgdC+0LLRi9Cy0LDRgtGMINCy0YHQtSDQstC10YDRiNC40L3RiyDQsiB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlci5lbmRTaGFwZX0uINCc0L7QttC10YIg0LHRi9GC0Ywg0L/QtdGA0LXQt9Cw0L/QuNGB0LDQvdCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlcXVpcmUgXCJ2Ni5zaGFwZXNcIiAoXCJ2Ni5qc1wiIGJ1aWx0LWluIGRyYXdpbmcgZnVuY3Rpb25zKS5cbiAgICogdmFyIHNoYXBlcyA9IHJlcXVpcmUoICd2Ni5qcy9yZW5kZXJlci9zaGFwZXMvcG9pbnRzJyApO1xuICAgKiAvLyBCZWdpbiBkcmF3aW5nIHBvaW50cyBzaGFwZS5cbiAgICogcmVuZGVyZXIuYmVnaW5TaGFwZSggeyBkcmF3RnVuY3Rpb246IHNoYXBlcy5kcmF3UG9pbnRzIH0gKTtcbiAgICogLy8gQmVnaW4gZHJhd2luZyBzaGFwZSB3aXRob3V0IGRyYXdpbmcgZnVuY3Rpb24gKG11c3QgYmUgcGFzc2VkIGxhdGVyIGluIGBlbmRTaGFwZWApLlxuICAgKiByZW5kZXJlci5iZWdpblNoYXBlKCk7XG4gICAqL1xuICBiZWdpblNoYXBlOiBmdW5jdGlvbiBiZWdpblNoYXBlICggb3B0aW9ucyApXG4gIHtcbiAgICBpZiAoICEgb3B0aW9ucyApIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgdGhpcy5fdmVydGljZXMubGVuZ3RoID0gMDtcbiAgICB0aGlzLl9jbG9zZWRTaGFwZSA9IG51bGw7XG4gICAgaWYgKCB0eXBlb2Ygb3B0aW9ucy5kcmF3RnVuY3Rpb24gPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgdGhpcy5fZHJhd0Z1bmN0aW9uID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZHJhd0Z1bmN0aW9uID0gb3B0aW9ucy5kcmF3RnVuY3Rpb247XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0LLQtdGA0YjQuNC90YMg0LIg0LrQvtC+0YDQtNC40L3QsNGC0LDRhSDQuNC3INGB0L7QvtGC0LLQtdGC0YHQstGD0Y7RidC40YUg0L/QsNGA0LDQvNC10YLRgNC+0LIuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciN2ZXJ0ZXhcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQvdC+0LLQvtC5INCy0LXRgNGI0LjQvdGLLlxuICAgKiBAcGFyYW0ge251bWJlcn0geSBZINC60L7QvtGA0LTQuNC90LDRgtCwINC90L7QstC+0Lkg0LLQtdGA0YjQuNC90YsuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgcmVjdGFuZ2xlIHdpdGggdmVydGljZXMuXG4gICAqIHJlbmRlcmVyLnZlcnRleCggMCwgMCApO1xuICAgKiByZW5kZXJlci52ZXJ0ZXgoIDEsIDAgKTtcbiAgICogcmVuZGVyZXIudmVydGV4KCAxLCAxICk7XG4gICAqIHJlbmRlcmVyLnZlcnRleCggMCwgMSApO1xuICAgKi9cbiAgdmVydGV4OiBmdW5jdGlvbiB2ZXJ0ZXggKCB4LCB5IClcbiAge1xuICAgIHRoaXMuX3ZlcnRpY2VzLnB1c2goIE1hdGguZmxvb3IoIHggKSwgTWF0aC5mbG9vciggeSApICk7XG4gICAgdGhpcy5fY2xvc2VkU2hhcGUgPSBudWxsO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINGE0LjQs9GD0YDRgyDQuNC3INCy0LXRgNGI0LjQvS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSAgIFtvcHRpb25zXSAgICAgICAgICAgICAg0J/QsNGA0LDQvNC10YLRgNGLINGE0LjQs9GD0YDRiy5cbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMuY2xvc2VdICAgICAgICDQodC+0LXQtNC40L3QuNGC0Ywg0L/QvtGB0LvQtdC00L3RjtGOINCy0LXRgNGI0LjQvdGDINGBINC/0LXRgNCy0L7QuSAo0LfQsNC60YDRi9GC0Ywg0YTQuNCz0YPRgNGDKS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMuZHJhd0Z1bmN0aW9uXSDQpNGD0L3QutGG0LjRjywg0LrQvtGC0L7RgNC+0Y8g0LHRg9C00LXRgiDQvtGC0YDQuNGB0L7QstGL0LLQsNGC0Ywg0LLRgdC1INCy0LXRgNGI0LjQvdGLLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINCY0LzQtdC10YIg0LHQvtC70YzRiNC40Lkg0L/RgNC40L7RgNC40YLQtdGCINGH0LXQvCDQsiB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlfS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXF1aXJlIFwidjYuc2hhcGVzXCIgKFwidjYuanNcIiBidWlsdC1pbiBkcmF3aW5nIGZ1bmN0aW9ucykuXG4gICAqIHZhciBzaGFwZXMgPSByZXF1aXJlKCAndjYuanMvcmVuZGVyZXIvc2hhcGVzL3BvaW50cycgKTtcbiAgICogLy8gQ2xvc2UgYW5kIGRyYXcgYSBzaGFwZS5cbiAgICogcmVuZGVyZXIuZW5kU2hhcGUoIHsgY2xvc2U6IHRydWUgfSApO1xuICAgKiAvLyBEcmF3IHdpdGggYSBjdXN0b20gZnVuY3Rpb24uXG4gICAqIHJlbmRlcmVyLmVuZFNoYXBlKCB7IGRyYXdGdW5jdGlvbjogc2hhcGVzLmRyYXdMaW5lcyB9ICk7XG4gICAqL1xuICBlbmRTaGFwZTogZnVuY3Rpb24gZW5kU2hhcGUgKCBvcHRpb25zIClcbiAge1xuICAgIHZhciBkcmF3RnVuY3Rpb24sIHZlcnRpY2VzO1xuICAgIGlmICggISBvcHRpb25zICkge1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICBpZiAoICEgKCBkcmF3RnVuY3Rpb24gPSBvcHRpb25zLmRyYXdGdW5jdGlvbiB8fCB0aGlzLl9kcmF3RnVuY3Rpb24gKSApIHtcbiAgICAgIHRocm93IEVycm9yKCAnTm8gXCJkcmF3RnVuY3Rpb25cIiBzcGVjaWZpZWQgZm9yIFwicmVuZGVyZXIuZW5kU2hhcGVcIicgKTtcbiAgICB9XG4gICAgaWYgKCBvcHRpb25zLmNsb3NlICkge1xuICAgICAgY2xvc2VTaGFwZSggdGhpcyApO1xuICAgICAgdmVydGljZXMgPSB0aGlzLl9jbG9zZWRTaGFwZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmVydGljZXMgPSB0aGlzLl92ZXJ0aWNlcztcbiAgICB9XG4gICAgZHJhd0Z1bmN0aW9uKCB0aGlzLCBwcm9jZXNzU2hhcGUoIHRoaXMsIHZlcnRpY2VzICkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNzYXZlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jc2F2ZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTYXZlIHRyYW5zZm9ybS5cbiAgICogcmVuZGVyZXIuc2F2ZSgpO1xuICAgKi9cbiAgc2F2ZTogZnVuY3Rpb24gc2F2ZSAoKVxuICB7XG4gICAgdGhpcy5tYXRyaXguc2F2ZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3Jlc3RvcmVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNyZXN0b3JlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlc3RvcmUgdHJhbnNmb3JtLlxuICAgKiByZW5kZXJlci5yZXN0b3JlKCk7XG4gICAqL1xuICByZXN0b3JlOiBmdW5jdGlvbiByZXN0b3JlICgpXG4gIHtcbiAgICB0aGlzLm1hdHJpeC5yZXN0b3JlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc2V0VHJhbnNmb3JtXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jc2V0VHJhbnNmb3JtXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBpZGVudGl0eSB0cmFuc2Zvcm0uXG4gICAqIHJlbmRlcmVyLnNldFRyYW5zZm9ybSggMSwgMCwgMCwgMSwgMCwgMCApO1xuICAgKi9cbiAgc2V0VHJhbnNmb3JtOiBmdW5jdGlvbiBzZXRUcmFuc2Zvcm0gKCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG4gIHtcbiAgICB0aGlzLm1hdHJpeC5zZXRUcmFuc2Zvcm0oIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjdHJhbnNsYXRlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jdHJhbnNsYXRlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFRyYW5zbGF0ZSB0cmFuc2Zvcm0gdG8gWyA0LCAyIF0uXG4gICAqIHJlbmRlcmVyLnRyYW5zbGF0ZSggNCwgMiApO1xuICAgKi9cbiAgdHJhbnNsYXRlOiBmdW5jdGlvbiB0cmFuc2xhdGUgKCB4LCB5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnRyYW5zbGF0ZSggeCwgeSApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JvdGF0ZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuVHJhbnNmb3JtI3JvdGF0ZVxuICAgKiBAdG9kbyByZW5kZXJlci5zZXR0aW5ncy5kZWdyZWVzXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJvdGF0ZSB0cmFuc2Zvcm0gb24gNDUgZGVncmVlcy5cbiAgICogcmVuZGVyZXIucm90YXRlKCA0NSAqIE1hdGguUEkgLyAxODAgKTtcbiAgICovXG4gIHJvdGF0ZTogZnVuY3Rpb24gcm90YXRlICggYW5nbGUgKVxuICB7XG4gICAgaWYgKCB0aGlzLnNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgICBhbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICAgIH1cbiAgICB0aGlzLm1hdHJpeC5yb3RhdGUoIGFuZ2xlICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc2NhbGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNzY2FsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTY2FsZSB0cmFuc2Zvcm0gdHdpY2UuXG4gICAqIHJlbmRlcmVyLnNjYWxlKCAyLCAyICk7XG4gICAqL1xuICBzY2FsZTogZnVuY3Rpb24gc2NhbGUgKCB4LCB5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnNjYWxlKCB4LCB5ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjdHJhbnNmb3JtXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jdHJhbnNmb3JtXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEFwcGx5IHRyYW5zbGF0ZWQgdG8gWyA0LCAyIF0gXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIi5cbiAgICogcmVuZGVyZXIudHJhbnNmb3JtKCAxLCAwLCAwLCAxLCA0LCAyICk7XG4gICAqL1xuICB0cmFuc2Zvcm06IGZ1bmN0aW9uIHRyYW5zZm9ybSAoIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnRyYW5zZm9ybSggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGxpbmVXaWR0aCAo0YjQuNGA0LjQvdGDINC60L7QvdGC0YPRgNCwKS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2xpbmVXaWR0aFxuICAgKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyINCd0L7QstGL0LkgbGluZVdpZHRoLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBgbGluZVdpZHRoYCB0byAxMHB4LlxuICAgKiByZW5kZXJlci5saW5lV2lkdGgoIDEwICk7XG4gICAqL1xuICBsaW5lV2lkdGg6IGZ1bmN0aW9uIGxpbmVXaWR0aCAoIG51bWJlciApXG4gIHtcbiAgICB0aGlzLl9saW5lV2lkdGggPSBudW1iZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgYmFja2dyb3VuZFBvc2l0aW9uWGAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZFBvc2l0aW9uWFxuICAgKiBAcGFyYW0ge251bWJlcn0gICB2YWx1ZVxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB0eXBlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IFwiYmFja2dyb3VuZFBvc2l0aW9uWFwiIGRyYXdpbmcgc2V0dGluZyB0byBDRU5URVIgKGRlZmF1bHQ6IExFRlQpLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25YKCBjb25zdGFudHMuZ2V0KCAnQ0VOVEVSJyApLCBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKTtcbiAgICogcmVuZGVyZXIuYmFja2dyb3VuZFBvc2l0aW9uWCggMC41LCBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25YKCByZW5kZXJlci53IC8gMiApO1xuICAgKi9cbiAgYmFja2dyb3VuZFBvc2l0aW9uWDogZnVuY3Rpb24gYmFja2dyb3VuZFBvc2l0aW9uWCAoIHZhbHVlLCB0eXBlICkgeyBpZiAoIHR5cGVvZiB0eXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlICE9PSBjb25zdGFudHMuZ2V0KCAnVkFMVUUnICkgKSB7IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ0NPTlNUQU5UJyApICkgeyB0eXBlID0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICk7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiTEVGVFwiICkgKSB7IHZhbHVlID0gMDsgfSBlbHNlIGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiQ0VOVEVSXCIgKSApIHsgdmFsdWUgPSAwLjU7IH0gZWxzZSBpZiAoIHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCBcIlJJR0hUXCIgKSApIHsgdmFsdWUgPSAxOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHZhbHVlLiBUaGUga25vd24gYXJlOiAnICsgXCJMRUZUXCIgKyAnLCAnICsgXCJDRU5URVJcIiArICcsICcgKyBcIlJJR0hUXCIgKTsgfSB9IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICkgKSB7IHZhbHVlICo9IHRoaXMudzsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgdmFsdWVgIHR5cGUuIFRoZSBrbm93biBhcmU6IFZBTFVFLCBQRVJDRU5ULCBDT05TVEFOVCcgKTsgfSB9IHRoaXMuX2JhY2tncm91bmRQb3NpdGlvblggPSB2YWx1ZTsgcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgYGJhY2tncm91bmRQb3NpdGlvbllgINC90LDRgdGC0YDQvtC50LrRgyDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRQb3NpdGlvbllcbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgdmFsdWVcbiAgICogQHBhcmFtIHtjb25zdGFudH0gdHlwZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBcImJhY2tncm91bmRQb3NpdGlvbllcIiBkcmF3aW5nIHNldHRpbmcgdG8gTUlERExFIChkZWZhdWx0OiBUT1ApLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25ZKCBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApLCBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKTtcbiAgICogcmVuZGVyZXIuYmFja2dyb3VuZFBvc2l0aW9uWSggMC41LCBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25ZKCByZW5kZXJlci5oIC8gMiApO1xuICAgKi9cbiAgYmFja2dyb3VuZFBvc2l0aW9uWTogZnVuY3Rpb24gYmFja2dyb3VuZFBvc2l0aW9uWSAoIHZhbHVlLCB0eXBlICkgeyBpZiAoIHR5cGVvZiB0eXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlICE9PSBjb25zdGFudHMuZ2V0KCAnVkFMVUUnICkgKSB7IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ0NPTlNUQU5UJyApICkgeyB0eXBlID0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICk7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiVE9QXCIgKSApIHsgdmFsdWUgPSAwOyB9IGVsc2UgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJNSURETEVcIiApICkgeyB2YWx1ZSA9IDAuNTsgfSBlbHNlIGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiQk9UVE9NXCIgKSApIHsgdmFsdWUgPSAxOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHZhbHVlLiBUaGUga25vd24gYXJlOiAnICsgXCJUT1BcIiArICcsICcgKyBcIk1JRERMRVwiICsgJywgJyArIFwiQk9UVE9NXCIgKTsgfSB9IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICkgKSB7IHZhbHVlICo9IHRoaXMuaDsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgdmFsdWVgIHR5cGUuIFRoZSBrbm93biBhcmU6IFZBTFVFLCBQRVJDRU5ULCBDT05TVEFOVCcgKTsgfSB9IHRoaXMuX2JhY2tncm91bmRQb3NpdGlvblkgPSB2YWx1ZTsgcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgYHJlY3RBbGlnblhgINC90LDRgdGC0YDQvtC50LrRgyDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3RBbGlnblhcbiAgICogQHBhcmFtIHtjb25zdGFudH0gdmFsdWUgYExFRlRgLCBgQ0VOVEVSYCwgYFJJR0hUYC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTZXQgXCJyZWN0QWxpZ25YXCIgZHJhd2luZyBzZXR0aW5nIHRvIENFTlRFUiAoZGVmYXVsdDogTEVGVCkuXG4gICAqIHJlbmRlcmVyLnJlY3RBbGlnblgoIGNvbnN0YW50cy5nZXQoICdDRU5URVInICkgKTtcbiAgICovXG4gIHJlY3RBbGlnblg6IGZ1bmN0aW9uIHJlY3RBbGlnblggKCB2YWx1ZSApIHsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ0xFRlQnICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdDRU5URVInICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdSSUdIVCcgKSApIHsgdGhpcy5fcmVjdEFsaWduWCA9IHZhbHVlOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGByZWN0QWxpZ25gIGNvbnN0YW50LiBUaGUga25vd24gYXJlOiAnICsgXCJMRUZUXCIgKyAnLCAnICsgXCJDRU5URVJcIiArICcsICcgKyBcIlJJR0hUXCIgKTsgfSByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgcmVjdEFsaWduWWAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdEFsaWduWVxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB2YWx1ZSBgVE9QYCwgYE1JRERMRWAsIGBCT1RUT01gLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBcInJlY3RBbGlnbllcIiBkcmF3aW5nIHNldHRpbmcgdG8gTUlERExFIChkZWZhdWx0OiBUT1ApLlxuICAgKiByZW5kZXJlci5yZWN0QWxpZ25ZKCBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApICk7XG4gICAqL1xuICByZWN0QWxpZ25ZOiBmdW5jdGlvbiByZWN0QWxpZ25ZICggdmFsdWUgKSB7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdMRUZUJyApIHx8IHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCAnQ0VOVEVSJyApIHx8IHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCAnUklHSFQnICkgKSB7IHRoaXMuX3JlY3RBbGlnblkgPSB2YWx1ZTsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgcmVjdEFsaWduYCBjb25zdGFudC4gVGhlIGtub3duIGFyZTogJyArIFwiVE9QXCIgKyAnLCAnICsgXCJNSURETEVcIiArICcsICcgKyBcIkJPVFRPTVwiICk7IH0gcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIg0YbQstC10YIgYHN0cm9rZWAg0L/RgNC4INGA0LjRgdC+0LLQsNC90LjQuCDRh9C10YDQtdC3IHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3R9INC4INGCLtC/LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc3Ryb2tlXG4gICAqIEBwYXJhbSB7bnVtYmVyfGJvb2xlYW58VENvbG9yfSBbcl0g0JXRgdC70Lgg0Y3RgtC+IGBib29sZWFuYCwg0YLQviDRjdGC0L4g0LLQutC70Y7Rh9C40YIg0LjQu9C4INCy0YvQutC70Y7Rh9C40YIgYHN0cm9rZWBcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAo0LrQsNC6INGH0LXRgNC10Lcge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXIjbm9TdHJva2V9KS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYV1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEaXNhYmxlIGFuZCB0aGVuIGVuYWJsZSBgc3Ryb2tlYC5cbiAgICogcmVuZGVyZXIuc3Ryb2tlKCBmYWxzZSApLnN0cm9rZSggdHJ1ZSApO1xuICAgKiAvLyBTZXQgYHN0cm9rZWAgdG8gXCJsaWdodHNreWJsdWVcIi5cbiAgICogcmVuZGVyZXIuc3Ryb2tlKCAnbGlnaHRza3libHVlJyApO1xuICAgKiAvLyBTZXQgYHN0cm9rZWAgZnJvbSBgdjYuUkdCQWAuXG4gICAqIHJlbmRlcmVyLnN0cm9rZSggbmV3IFJHQkEoIDI1NSwgMCwgMCApLnBlcmNlaXZlZEJyaWdodG5lc3MoKSApO1xuICAgKi9cbiAgc3Ryb2tlOiBmdW5jdGlvbiBzdHJva2UgKCByLCBnLCBiLCBhICkgeyBpZiAoIHR5cGVvZiByID09PSAnYm9vbGVhbicgKSB7IHRoaXMuX2RvU3Ryb2tlID0gcjsgfSBlbHNlIHsgaWYgKCB0eXBlb2YgciA9PT0gJ3N0cmluZycgfHwgdGhpcy5fc3Ryb2tlQ29sb3IudHlwZSAhPT0gdGhpcy5zZXR0aW5ncy5jb2xvci50eXBlICkgeyB0aGlzLl9zdHJva2VDb2xvciA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7IH0gZWxzZSB7IHRoaXMuX3N0cm9rZUNvbG9yLnNldCggciwgZywgYiwgYSApOyB9IHRoaXMuX2RvU3Ryb2tlID0gdHJ1ZTsgfSByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiDRhtCy0LXRgiBgZmlsbGAg0L/RgNC4INGA0LjRgdC+0LLQsNC90LjQuCDRh9C10YDQtdC3IHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3R9INC4INGCLtC/LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZmlsbFxuICAgKiBAcGFyYW0ge251bWJlcnxib29sZWFufFRDb2xvcn0gW3JdINCV0YHQu9C4INGN0YLQviBgYm9vbGVhbmAsINGC0L4g0Y3RgtC+INCy0LrQu9GO0YfQuNGCINC40LvQuCDQstGL0LrQu9GO0YfQuNGCIGBmaWxsYFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjQutCw0Log0YfQtdGA0LXQtyB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlciNub0ZpbGx9KS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYV1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEaXNhYmxlIGFuZCB0aGVuIGVuYWJsZSBgZmlsbGAuXG4gICAqIHJlbmRlcmVyLmZpbGwoIGZhbHNlICkuZmlsbCggdHJ1ZSApO1xuICAgKiAvLyBTZXQgYGZpbGxgIHRvIFwibGlnaHRwaW5rXCIuXG4gICAqIHJlbmRlcmVyLmZpbGwoICdsaWdodHBpbmsnICk7XG4gICAqIC8vIFNldCBgZmlsbGAgZnJvbSBgdjYuUkdCQWAuXG4gICAqIHJlbmRlcmVyLmZpbGwoIG5ldyBSR0JBKCAyNTUsIDAsIDAgKS5icmlnaHRuZXNzKCkgKTtcbiAgICovXG4gIGZpbGw6IGZ1bmN0aW9uIGZpbGwgKCByLCBnLCBiLCBhICkgeyBpZiAoIHR5cGVvZiByID09PSAnYm9vbGVhbicgKSB7IHRoaXMuX2RvRmlsbCA9IHI7IH0gZWxzZSB7IGlmICggdHlwZW9mIHIgPT09ICdzdHJpbmcnIHx8IHRoaXMuX2ZpbGxDb2xvci50eXBlICE9PSB0aGlzLnNldHRpbmdzLmNvbG9yLnR5cGUgKSB7IHRoaXMuX2ZpbGxDb2xvciA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7IH0gZWxzZSB7IHRoaXMuX2ZpbGxDb2xvci5zZXQoIHIsIGcsIGIsIGEgKTsgfSB0aGlzLl9kb0ZpbGwgPSB0cnVlOyB9IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCS0YvQutC70Y7Rh9Cw0LXRgiDRgNC40YHQvtCy0LDQvdC40LUg0LrQvtC90YLRg9GA0LAgKHN0cm9rZSkuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNub1N0cm9rZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERpc2FibGUgZHJhd2luZyBzdHJva2UuXG4gICAqIHJlbmRlcmVyLm5vU3Ryb2tlKCk7XG4gICAqL1xuICBub1N0cm9rZTogZnVuY3Rpb24gbm9TdHJva2UgKCkgeyB0aGlzLl9kb1N0cm9rZSA9IGZhbHNlOyByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQktGL0LrQu9GO0YfQsNC10YIg0LfQsNC/0L7Qu9C90LXQvdC40Y8g0YTQvtC90LAgKGZpbGwpLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjbm9GaWxsXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRGlzYWJsZSBmaWxsaW5nLlxuICAgKiByZW5kZXJlci5ub0ZpbGwoKTtcbiAgICovXG4gIG5vRmlsbDogZnVuY3Rpb24gbm9GaWxsICgpIHsgdGhpcy5fZG9GaWxsID0gZmFsc2U7IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCX0LDQv9C+0LvQvdGP0LXRgiDRhNC+0L0g0YDQtdC90LTQtdGA0LXRgNCwINGG0LLQtdGC0L7QvC5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRDb2xvclxuICAgKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtiXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEZpbGwgcmVuZGVyZXIgd2l0aCBcImxpZ2h0cGlua1wiIGNvbG9yLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kQ29sb3IoICdsaWdodHBpbmsnICk7XG4gICAqL1xuICAvKipcbiAgICog0JfQsNC/0L7Qu9C90Y/QtdGCINGE0L7QvSDRgNC10L3QtNC10YDQtdGA0LAg0LrQsNGA0YLQuNC90LrQvtC5LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZEltYWdlXG4gICAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCwg0LrQvtGC0L7RgNCw0Y8g0LTQvtC70LbQvdCwINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0LTQu9GPINGE0L7QvdCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENyZWF0ZSBiYWNrZ3JvdW5kIGltYWdlLlxuICAgKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnYmFja2dyb3VuZC5qcGcnICk7XG4gICAqIC8vIEZpbGwgcmVuZGVyZXIgd2l0aCB0aGUgaW1hZ2UuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRJbWFnZSggSW1hZ2Uuc3RyZXRjaCggaW1hZ2UsIHJlbmRlcmVyLncsIHJlbmRlcmVyLmggKSApO1xuICAgKi9cbiAgLyoqXG4gICAqINCe0YfQuNGJ0LDQtdGCINC60L7QvdGC0LXQutGB0YIuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNjbGVhclxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENsZWFyIHJlbmRlcmVyJ3MgY29udGV4dC5cbiAgICogcmVuZGVyZXIuY2xlYXIoKTtcbiAgICovXG4gIC8qKlxuICAgKiDQntGC0YDQuNGB0L7QstGL0LLQsNC10YIg0L/QtdGA0LXQtNCw0L3QvdGL0LUg0LLQtdGA0YjQuNC90YsuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNkcmF3QXJyYXlzXG4gICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5fSB2ZXJ0cyDQktC10YDRiNC40L3Riywg0LrQvtGC0L7RgNGL0LUg0L3QsNC00L4g0L7RgtGA0LjRgdC+0LLQsNGC0YwuINCV0YHQu9C4INC90LUg0L/QtdGA0LXQtNCw0L3QviDQtNC70Y9cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtAbGluayB2Ni5SZW5kZXJlckdMfSwg0YLQviDQsdGD0LTRg9GCINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0LLQtdGA0YjQuNC90Ysg0LjQt1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0YHRgtCw0L3QtNCw0YDRgtC90L7Qs9C+INCx0YPRhNC10YDQsCAoe0BsaW5rIHY2LlJlbmRlcmVyR0wjYnVmZmVycy5kZWZhdWx0fSkuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICBjb3VudCDQmtC+0LvQuNGH0LXRgdGC0LLQviDQstC10YDRiNC40L0sINC90LDQv9GA0LjQvNC10YA6IDMg0LTQu9GPINGC0YDQtdGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBBIHRyaWFuZ2xlLlxuICAgKiB2YXIgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KCBbXG4gICAqICAgMCwgIDAsXG4gICAqICAgNTAsIDUwLFxuICAgKiAgIDAsICA1MFxuICAgKiBdICk7XG4gICAqXG4gICAqIC8vIERyYXcgdGhlIHRyaWFuZ2xlLlxuICAgKiByZW5kZXJlci5kcmF3QXJyYXlzKCB2ZXJ0aWNlcywgMyApO1xuICAgKi9cbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZHJhd0ltYWdlXG4gICAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCDQutC+0YLQvtGA0YPRjiDQvdCw0LTQviDQvtGC0YDQuNGB0L7QstCw0YLRjC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICB4ICAgICBcIkRlc3RpbmF0aW9uIFhcIi4gWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHkgICAgIFwiRGVzdGluYXRpb24gWVwiLiBZINC60L7QvtGA0LTQuNC90LDRgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgdyAgICAgXCJEZXN0aW5hdGlvbiBXaWR0aFwiLiDQqNC40YDQuNC90LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICBoICAgICBcIkRlc3RpbmF0aW9uIEhlaWdodFwiLiDQktGL0YHQvtGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBDcmVhdGUgaW1hZ2UuXG4gICAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICczMDB4MjAwLnBuZycgKTtcbiAgICogLy8gRHJhdyBpbWFnZSBhdCBbIDAsIDAgXS5cbiAgICogcmVuZGVyZXIuZHJhd0ltYWdlKCBpbWFnZSwgMCwgMCwgNjAwLCA0MDAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LouXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZWN0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gdyDQqNC40YDQuNC90LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGgg0JLRi9GB0L7RgtCwINC/0YDRj9C80L7Rg9Cz0L7Qu9GM0L3QuNC60LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBzcXVhcmUgYXQgWyAyMCwgMjAgXSB3aXRoIHNpemUgODAuXG4gICAqIHJlbmRlcmVyLnJlY3QoIDIwLCAyMCwgODAsIDgwICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC60YDRg9CzLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYXJjXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrRgNGD0LPQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQutGA0YPQs9CwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gciDQoNCw0LTQuNGD0YEg0LrRgNGD0LPQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGNpcmNsZSBhdCBbIDYwLCA2MCBdIHdpdGggcmFkaXVzIDQwLlxuICAgKiByZW5kZXJlci5hcmMoIDYwLCA2MCwgNDAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0LvQuNC90LjRji5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2xpbmVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHgxIFgg0L3QsNGH0LDQu9CwINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MSBZINC90LDRh9Cw0LvQsCDQu9C40L3QuNC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0geDIgWCDQutC+0L3RhtGLINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MiBZINC60L7QvdGG0Ysg0LvQuNC90LjQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGxpbmUgZnJvbSBbIDEwLCAxMCBdIHRvIFsgMjAsIDIwIF0uXG4gICAqIHJlbmRlcmVyLmxpbmUoIDEwLCAxMCwgMjAsIDIwICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINGC0L7Rh9C60YMuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwb2ludFxuICAgKiBAcGFyYW0ge251bWJlcn0geCBYINC60L7QvtGA0LTQuNC90LDRgtCwINGC0L7Rh9C60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5IFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0YLQvtGH0LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IHBvaW50IGF0IFsgNCwgMiBdLlxuICAgKiByZW5kZXJlci5wb2ludCggNCwgMiApO1xuICAgKi9cbiAgY29uc3RydWN0b3I6IEFic3RyYWN0UmVuZGVyZXJcbn07XG4vKipcbiAqIEluaXRpYWxpemUgcmVuZGVyZXIgb24gYFwic2VsZlwiYC5cbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlci5jcmVhdGVcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHNlbGYgICAgUmVuZGVyZXIgdGhhdCBzaG91bGQgYmUgaW5pdGlhbGl6ZWQuXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgICAgICBvcHRpb25zIHtAbGluayB2Ni5zZXR0aW5ncy5yZW5kZXJlcn1cbiAqIEBwYXJhbSAge2NvbnN0YW50fSAgICAgICAgICAgIHR5cGUgICAgVHlwZSBvZiByZW5kZXJlcjogYDJEYCBvciBgR0xgLiBDYW5ub3QgYmUgYEFVVE9gIS5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICAgICAgICAgUmV0dXJucyBub3RoaW5nLlxuICogQGV4YW1wbGUgPGNhcHRpb24+Q3VzdG9tIFJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIEFic3RyYWN0UmVuZGVyZXIgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyJyApO1xuICogdmFyIHNldHRpbmdzICAgICAgICAgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9zZXR0aW5ncycgKTtcbiAqIHZhciBjb25zdGFudHMgICAgICAgID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29uc3RhbnRzJyApO1xuICpcbiAqIGZ1bmN0aW9uIEN1c3RvbVJlbmRlcmVyICggb3B0aW9ucyApXG4gKiB7XG4gKiAgIC8vIEluaXRpYWxpemUgQ3VzdG9tUmVuZGVyZXIuXG4gKiAgIEFic3RyYWN0UmVuZGVyZXIuY3JlYXRlKCB0aGlzLCBkZWZhdWx0cyggc2V0dGluZ3MsIG9wdGlvbnMgKSwgY29uc3RhbnRzLmdldCggJzJEJyApICk7XG4gKiB9XG4gKi9cbkFic3RyYWN0UmVuZGVyZXIuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlICggc2VsZiwgb3B0aW9ucywgdHlwZSApXG57XG4gIHZhciBjb250ZXh0O1xuICAvKipcbiAgICogYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINC00LvRjyDQvtGC0YDQuNGB0L7QstC60Lgg0L3QsCDRjdC60YDQsNC90LUuXG4gICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2NhbnZhc1xuICAgKi9cbiAgaWYgKCBvcHRpb25zLmNhbnZhcyApIHtcbiAgICBzZWxmLmNhbnZhcyA9IG9wdGlvbnMuY2FudmFzO1xuICB9IGVsc2Uge1xuICAgIHNlbGYuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcbiAgICBzZWxmLmNhbnZhcy5pbm5lckhUTUwgPSAnVW5hYmxlIHRvIHJ1biB0aGlzIGFwcGxpY2F0aW9uLic7XG4gIH1cbiAgaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnMkQnICkgKSB7XG4gICAgY29udGV4dCA9ICcyZCc7XG4gIH0gZWxzZSBpZiAoIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoICdHTCcgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHJlbmRlcmVyIHR5cGUuIFRoZSBrbm93biBhcmU6IDJEIGFuZCBHTCcgKTtcbiAgfSBlbHNlIGlmICggISAoIGNvbnRleHQgPSBnZXRXZWJHTCgpICkgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgZ2V0IFdlYkdMIGNvbnRleHQuIFRyeSB0byB1c2UgMkQgYXMgdGhlIHJlbmRlcmVyIHR5cGUgb3IgdjYuUmVuZGVyZXIyRCBpbnN0ZWFkIG9mIHY2LlJlbmRlcmVyR0wnICk7XG4gIH1cbiAgLyoqXG4gICAqINCa0L7QvdGC0LXQutGB0YIg0YXQvtC70YHRgtCwLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LkFic3RyYWN0UmVuZGVyZXIjY29udGV4dFxuICAgKi9cbiAgc2VsZi5jb250ZXh0ID0gc2VsZi5jYW52YXMuZ2V0Q29udGV4dCggY29udGV4dCwge1xuICAgIGFscGhhOiBvcHRpb25zLmFscGhhXG4gIH0gKTtcbiAgLyoqXG4gICAqINCd0LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQtdGA0LAuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuQWJzdHJhY3RSZW5kZXJlciNzZXR0aW5nc1xuICAgKiBAc2VlIHY2LnNldHRpbmdzLnJlbmRlcmVyLnNldHRpbmdzXG4gICAqL1xuICBzZWxmLnNldHRpbmdzID0gb3B0aW9ucy5zZXR0aW5ncztcbiAgLyoqXG4gICAqINCi0LjQvyDRgNC10L3QtNC10YDQtdGA0LA6IEdMLCAyRC5cbiAgICogQG1lbWJlciB7Y29uc3RhbnR9IHY2LkFic3RyYWN0UmVuZGVyZXIjdHlwZVxuICAgKi9cbiAgc2VsZi50eXBlID0gdHlwZTtcbiAgLyoqXG4gICAqINCh0YLRjdC6INGB0L7RhdGA0LDQvdC10L3QvdGL0YUg0L3QsNGB0YLRgNC+0LXQuiDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7QXJyYXkuPG9iamVjdD59IHY2LkFic3RyYWN0UmVuZGVyZXIjX3N0YWNrXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNwdXNoXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNwb3BcbiAgICovXG4gIHNlbGYuX3N0YWNrID0gW107XG4gIC8qKlxuICAgKiDQn9C+0LfQuNGG0LjRjyDQv9C+0YHQu9C10LTQvdC40YUg0YHQvtGF0YDQsNC90LXQvdC90YvRhSDQvdCw0YHRgtGA0L7QtdC6INGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkFic3RyYWN0UmVuZGVyZXIjX3N0YWNrSW5kZXhcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3B1c2hcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvcFxuICAgKi9cbiAgc2VsZi5fc3RhY2tJbmRleCA9IC0xO1xuICAvKipcbiAgICog0JLQtdGA0YjQuNC90Ysg0YTQuNCz0YPRgNGLLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48bnVtYmVyPn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfdmVydGljZXNcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICovXG4gIHNlbGYuX3ZlcnRpY2VzID0gW107XG4gIC8qKlxuICAgKiDQl9Cw0LrRgNGL0YLQsNGPINGE0LjQs9GD0YDQsCAo0LLQtdGA0YjQuNC90LApLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48bnVtYmVyPn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfZHJhd0Z1bmN0aW9uXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciN2ZXJ0ZXhcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqL1xuICBzZWxmLl9jbG9zZWRTaGFwZSA9IG51bGw7XG4gIC8qKlxuICAgKiDQpNGD0L3QutGG0LjRjywg0LrQvtGC0L7RgNC+0Y8g0LHRg9C00LXRgiDQvtGC0YDQuNGB0L7QstGL0LLQsNGC0Ywg0LLQtdGA0YjQuNC90YsuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge2Z1bmN0aW9ufSB2Ni5BYnN0cmFjdFJlbmRlcmVyI19kcmF3RnVuY3Rpb25cbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICovXG4gIHNlbGYuX2RyYXdGdW5jdGlvbiA9IG51bGw7XG4gIGlmICggdHlwZW9mIG9wdGlvbnMuYXBwZW5kVG8gPT09ICd1bmRlZmluZWQnICkge1xuICAgIHNlbGYuYXBwZW5kVG8oIGRvY3VtZW50LmJvZHkgKTtcbiAgfSBlbHNlIGlmICggb3B0aW9ucy5hcHBlbmRUbyAhPT0gbnVsbCApIHtcbiAgICBzZWxmLmFwcGVuZFRvKCBvcHRpb25zLmFwcGVuZFRvICk7XG4gIH1cbiAgaWYgKCAndycgaW4gb3B0aW9ucyB8fCAnaCcgaW4gb3B0aW9ucyApIHtcbiAgICBzZWxmLnJlc2l6ZSggb3B0aW9ucy53IHx8IDAsIG9wdGlvbnMuaCB8fCAwICk7XG4gIH0gZWxzZSBpZiAoIG9wdGlvbnMuYXBwZW5kVG8gIT09IG51bGwgKSB7XG4gICAgc2VsZi5yZXNpemVUbyggb3B0aW9ucy5hcHBlbmRUbyB8fCBkb2N1bWVudC5ib2R5ICk7XG4gIH0gZWxzZSB7XG4gICAgc2VsZi5yZXNpemUoIDYwMCwgNDAwICk7XG4gIH1cbiAgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyggc2VsZiwgc2VsZiApO1xufTtcbm1vZHVsZS5leHBvcnRzID0gQWJzdHJhY3RSZW5kZXJlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmF1bHRzICAgICAgICAgID0gcmVxdWlyZSggJ3BlYWtvL2RlZmF1bHRzJyApO1xuXG52YXIgY29uc3RhbnRzICAgICAgICAgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApO1xuXG52YXIgcHJvY2Vzc1JlY3RBbGlnblggPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblg7XG52YXIgcHJvY2Vzc1JlY3RBbGlnblkgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblk7XG5cbnZhciBBYnN0cmFjdFJlbmRlcmVyICA9IHJlcXVpcmUoICcuL0Fic3RyYWN0UmVuZGVyZXInICk7XG52YXIgc2V0dGluZ3MgICAgICAgICAgPSByZXF1aXJlKCAnLi9zZXR0aW5ncycgKTtcblxuLyoqXG4gKiAyRCDRgNC10L3QtNC10YDQtdGALlxuICogQGNvbnN0cnVjdG9yIHY2LlJlbmRlcmVyMkRcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0UmVuZGVyZXJcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIHtAbGluayB2Ni5zZXR0aW5ncy5yZW5kZXJlcn1cbiAqIEBleGFtcGxlXG4gKiAvLyBSZXF1aXJlIFJlbmRlcmVyMkQuXG4gKiB2YXIgUmVuZGVyZXIyRCA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyMkQnICk7XG4gKiAvLyBDcmVhdGUgYW4gUmVuZGVyZXIyRCBpc250YW5jZS5cbiAqIHZhciByZW5kZXJlciA9IG5ldyBSZW5kZXJlcjJEKCk7XG4gKi9cbmZ1bmN0aW9uIFJlbmRlcmVyMkQgKCBvcHRpb25zIClcbntcbiAgQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUoIHRoaXMsICggb3B0aW9ucyA9IGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApICksIGNvbnN0YW50cy5nZXQoICcyRCcgKSApO1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHY2LlJlbmRlcmVyMkQjbWF0cml4XG4gICAqIEBhbGlhcyB2Ni5SZW5kZXJlcjJEI2NvbnRleHRcbiAgICovXG4gIHRoaXMubWF0cml4ID0gdGhpcy5jb250ZXh0O1xufVxuXG5SZW5kZXJlcjJELnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlICk7XG5SZW5kZXJlcjJELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlbmRlcmVyMkQ7XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjYmFja2dyb3VuZENvbG9yXG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLmJhY2tncm91bmRDb2xvciA9IGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvciAoIHIsIGcsIGIsIGEgKVxue1xuICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzO1xuICB2YXIgY29udGV4dCAgPSB0aGlzLmNvbnRleHQ7XG5cbiAgY29udGV4dC5zYXZlKCk7XG4gIGNvbnRleHQuZmlsbFN0eWxlID0gbmV3IHNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7XG4gIGNvbnRleHQuc2V0VHJhbnNmb3JtKCBzZXR0aW5ncy5zY2FsZSwgMCwgMCwgc2V0dGluZ3Muc2NhbGUsIDAsIDAgKTtcbiAgY29udGV4dC5maWxsUmVjdCggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgY29udGV4dC5yZXN0b3JlKCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2JhY2tncm91bmRJbWFnZVxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5iYWNrZ3JvdW5kSW1hZ2UgPSBmdW5jdGlvbiBiYWNrZ3JvdW5kSW1hZ2UgKCBpbWFnZSApXG57XG4gIHZhciBfcmVjdEFsaWduWCA9IHRoaXMuX3JlY3RBbGlnblg7XG4gIHZhciBfcmVjdEFsaWduWSA9IHRoaXMuX3JlY3RBbGlnblk7XG5cbiAgdGhpcy5fcmVjdEFsaWduWCA9IGNvbnN0YW50cy5nZXQoICdDRU5URVInICk7XG4gIHRoaXMuX3JlY3RBbGlnblkgPSBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApO1xuXG4gIHRoaXMuaW1hZ2UoIGltYWdlLCB0aGlzLncgKiAwLjUsIHRoaXMuaCAqIDAuNSApO1xuXG4gIHRoaXMuX3JlY3RBbGlnblggPSBfcmVjdEFsaWduWDtcbiAgdGhpcy5fcmVjdEFsaWduWSA9IF9yZWN0QWxpZ25ZO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNjbGVhclxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuY29udGV4dC5jbGVhciggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2RyYXdBcnJheXNcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuZHJhd0FycmF5cyA9IGZ1bmN0aW9uIGRyYXdBcnJheXMgKCB2ZXJ0cywgY291bnQsIF9tb2RlLCBfc3gsIF9zeSApXG57XG4gIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICB2YXIgaTtcblxuICBpZiAoIGNvdW50IDwgMiApIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGlmICggdHlwZW9mIF9zeCA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgX3N4ID0gX3N5ID0gMTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgfVxuXG4gIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gIGNvbnRleHQubW92ZVRvKCB2ZXJ0c1sgMCBdICogX3N4LCB2ZXJ0c1sgMSBdICogX3N5ICk7XG5cbiAgZm9yICggaSA9IDIsIGNvdW50ICo9IDI7IGkgPCBjb3VudDsgaSArPSAyICkge1xuICAgIGNvbnRleHQubGluZVRvKCB2ZXJ0c1sgaSBdICogX3N4LCB2ZXJ0c1sgaSArIDEgXSAqIF9zeSApO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb0ZpbGwgKSB7XG4gICAgdGhpcy5fZmlsbCgpO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb1N0cm9rZSAmJiB0aGlzLl9saW5lV2lkdGggPiAwICkge1xuICAgIHRoaXMuX3N0cm9rZSgpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2RyYXdJbWFnZVxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5kcmF3SW1hZ2UgPSBmdW5jdGlvbiBkcmF3SW1hZ2UgKCBpbWFnZSwgeCwgeSwgdywgaCApXG57XG4gIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UoIGltYWdlLmdldCgpLmltYWdlLCBpbWFnZS5zeCwgaW1hZ2Uuc3ksIGltYWdlLnN3LCBpbWFnZS5zaCwgeCwgeSwgdywgaCApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjcmVjdFxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24gcmVjdCAoIHgsIHksIHcsIGggKVxue1xuICB4ID0gcHJvY2Vzc1JlY3RBbGlnblgoIHRoaXMsIHgsIHcgKTtcbiAgeSA9IHByb2Nlc3NSZWN0QWxpZ25ZKCB0aGlzLCB5LCBoICk7XG5cbiAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICB0aGlzLmNvbnRleHQucmVjdCggeCwgeSwgdywgaCApO1xuXG4gIGlmICggdGhpcy5fZG9GaWxsICkge1xuICAgIHRoaXMuX2ZpbGwoKTtcbiAgfVxuXG4gIGlmICggdGhpcy5fZG9TdHJva2UgJiYgdGhpcy5fbGluZVdpZHRoID4gMCApIHtcbiAgICB0aGlzLl9zdHJva2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNhcmNcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuYXJjID0gZnVuY3Rpb24gYXJjICggeCwgeSwgciApXG57XG4gIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgdGhpcy5jb250ZXh0LmFyYyggeCwgeSwgciwgMCwgTWF0aC5QSSAqIDIgKTtcblxuICBpZiAoIHRoaXMuX2RvRmlsbCApIHtcbiAgICB0aGlzLl9maWxsKCk7XG4gIH1cblxuICBpZiAoIHRoaXMuX2RvU3Ryb2tlICYmIHRoaXMuX2xpbmVXaWR0aCA+IDAgKSB7XG4gICAgdGhpcy5fc3Ryb2tlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblJlbmRlcmVyMkQucHJvdG90eXBlLl9maWxsID0gZnVuY3Rpb24gX2ZpbGwgKClcbntcbiAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuX2ZpbGxDb2xvcjtcbiAgdGhpcy5jb250ZXh0LmZpbGwoKTtcbn07XG5cblJlbmRlcmVyMkQucHJvdG90eXBlLl9zdHJva2UgPSBmdW5jdGlvbiBfc3Ryb2tlICgpXG57XG4gIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuXG4gIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLl9zdHJva2VDb2xvcjtcblxuICBpZiAoICggY29udGV4dC5saW5lV2lkdGggPSB0aGlzLl9saW5lV2lkdGggKSA8PSAxICkge1xuICAgIGNvbnRleHQuc3Ryb2tlKCk7XG4gIH1cblxuICBjb250ZXh0LnN0cm9rZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjJEO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVmYXVsdHMgICAgICAgICAgPSByZXF1aXJlKCAncGVha28vZGVmYXVsdHMnICk7XG5cbnZhciBTaGFkZXJQcm9ncmFtICAgICA9IHJlcXVpcmUoICcuLi9TaGFkZXJQcm9ncmFtJyApO1xudmFyIFRyYW5zZm9ybSAgICAgICAgID0gcmVxdWlyZSggJy4uL1RyYW5zZm9ybScgKTtcbnZhciBjb25zdGFudHMgICAgICAgICA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICk7XG52YXIgc2hhZGVycyAgICAgICAgICAgPSByZXF1aXJlKCAnLi4vc2hhZGVycycgKTtcblxudmFyIHByb2Nlc3NSZWN0QWxpZ25YID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25YO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25ZID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25ZO1xuXG52YXIgQWJzdHJhY3RSZW5kZXJlciAgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFJlbmRlcmVyJyApO1xudmFyIHNldHRpbmdzICAgICAgICAgID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG5cbi8qKlxuICog0JzQsNGB0YHQuNCyINCy0LXRgNGI0LjQvSAodmVydGljZXMpINC60LLQsNC00YDQsNGC0LAuXG4gKiBAcHJpdmF0ZVxuICogQGlubmVyXG4gKiBAdmFyIHtGbG9hdDMyQXJyYXl9IHJlY3RcbiAqL1xudmFyIHJlY3QgPSAoIGZ1bmN0aW9uICgpXG57XG4gIHZhciByZWN0ID0gW1xuICAgIDAsIDAsXG4gICAgMSwgMCxcbiAgICAxLCAxLFxuICAgIDAsIDFcbiAgXTtcblxuICBpZiAoIHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoIHJlY3QgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICB9XG5cbiAgcmV0dXJuIHJlY3Q7XG59ICkoKTtcblxuLyoqXG4gKiBXZWJHTCDRgNC10L3QtNC10YDQtdGALlxuICogQGNvbnN0cnVjdG9yIHY2LlJlbmRlcmVyR0xcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0UmVuZGVyZXJcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIHtAbGluayB2Ni5zZXR0aW5ncy5yZW5kZXJlcn1cbiAqIEBleGFtcGxlXG4gKiAvLyBSZXF1aXJlIFJlbmRlcmVyR0wuXG4gKiB2YXIgUmVuZGVyZXJHTCA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyR0wnICk7XG4gKiAvLyBDcmVhdGUgYW4gUmVuZGVyZXJHTCBpc250YW5jZS5cbiAqIHZhciByZW5kZXJlciA9IG5ldyBSZW5kZXJlckdMKCk7XG4gKi9cbmZ1bmN0aW9uIFJlbmRlcmVyR0wgKCBvcHRpb25zIClcbntcbiAgQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUoIHRoaXMsICggb3B0aW9ucyA9IGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApICksIGNvbnN0YW50cy5nZXQoICdHTCcgKSApO1xuXG4gIC8qKlxuICAgKiDQrdGC0LAgXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIiDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0LTQu9GPIHtAbGluayB2Ni5SZW5kZXJlckdMI3JvdGF0ZX0g0Lgg0YIu0L8uXG4gICAqIEBtZW1iZXIge3Y2LlRyYW5zZm9ybX0gdjYuUmVuZGVyZXJHTCNtYXRyaXhcbiAgICovXG4gIHRoaXMubWF0cml4ID0gbmV3IFRyYW5zZm9ybSgpO1xuXG4gIC8qKlxuICAgKiDQkdGD0YTQtdGA0Ysg0LTQsNC90L3Ri9GFICjQstC10YDRiNC40L0pLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LlJlbmRlcmVyR0wjYnVmZmVyc1xuICAgKiBAcHJvcGVydHkge1dlYkdMQnVmZmVyfSBkZWZhdWx0INCe0YHQvdC+0LLQvdC+0Lkg0LHRg9GE0LXRgC5cbiAgICogQHByb3BlcnR5IHtXZWJHTEJ1ZmZlcn0gcmVjdCAgICDQmNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0LTQu9GPINC+0YLRgNC40YHQvtCy0LrQuCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwINCyIHtAbGluayB2Ni5SZW5kZXJlckdMI3JlY3R9LlxuICAgKi9cbiAgdGhpcy5idWZmZXJzID0ge1xuICAgIGRlZmF1bHQ6IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIoKSxcbiAgICByZWN0OiAgdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlcigpXG4gIH07XG5cbiAgdGhpcy5jb250ZXh0LmJpbmRCdWZmZXIoIHRoaXMuY29udGV4dC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVycy5yZWN0ICk7XG4gIHRoaXMuY29udGV4dC5idWZmZXJEYXRhKCB0aGlzLmNvbnRleHQuQVJSQVlfQlVGRkVSLCByZWN0LCB0aGlzLmNvbnRleHQuU1RBVElDX0RSQVcgKTtcblxuICAvKipcbiAgICog0KjQtdC50LTQtdGA0YsgKFdlYkdMINC/0YDQvtCz0YDQsNC80LzRiykuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuUmVuZGVyZXJHTCNwcm9ncmFtc1xuICAgKiBAcHJvcGVydHkge3Y2LlNoYWRlclByb2dyYW19IGRlZmF1bHRcbiAgICovXG4gIHRoaXMucHJvZ3JhbXMgPSB7XG4gICAgZGVmYXVsdDogbmV3IFNoYWRlclByb2dyYW0oIHNoYWRlcnMuYmFzaWMsIHRoaXMuY29udGV4dCApXG4gIH07XG5cbiAgdGhpcy5ibGVuZGluZyggb3B0aW9ucy5ibGVuZGluZyApO1xufVxuXG5SZW5kZXJlckdMLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlICk7XG5SZW5kZXJlckdMLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlbmRlcmVyR0w7XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjcmVzaXplXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uIHJlc2l6ZSAoIHcsIGggKVxue1xuICBBYnN0cmFjdFJlbmRlcmVyLnByb3RvdHlwZS5yZXNpemUuY2FsbCggdGhpcywgdywgaCApO1xuICB0aGlzLmNvbnRleHQudmlld3BvcnQoIDAsIDAsIHRoaXMudywgdGhpcy5oICk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjYmxlbmRpbmdcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYmxlbmRpbmdcbiAqIEBjaGFpbmFibGVcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuYmxlbmRpbmcgPSBmdW5jdGlvbiBibGVuZGluZyAoIGJsZW5kaW5nIClcbntcbiAgdmFyIGdsID0gdGhpcy5jb250ZXh0O1xuXG4gIGlmICggYmxlbmRpbmcgKSB7XG4gICAgZ2wuZW5hYmxlKCBnbC5CTEVORCApO1xuICAgIGdsLmRpc2FibGUoIGdsLkRFUFRIX1RFU1QgKTtcbiAgICBnbC5ibGVuZEZ1bmMoIGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSApO1xuICAgIGdsLmJsZW5kRXF1YXRpb24oIGdsLkZVTkNfQUREICk7XG4gIH0gZWxzZSB7XG4gICAgZ2wuZGlzYWJsZSggZ2wuQkxFTkQgKTtcbiAgICBnbC5lbmFibGUoIGdsLkRFUFRIX1RFU1QgKTtcbiAgICBnbC5kZXB0aEZ1bmMoIGdsLkxFUVVBTCApO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCe0YfQuNGJ0LDQtdGCINC60L7QvdGC0LXQutGB0YIuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI19jbGVhclxuICogQHBhcmFtICB7bnVtYmVyfSByINCd0L7RgNC80LDQu9C40LfQvtCy0LDQvdC90L7QtSDQt9C90LDRh9C10L3QuNC1IFwicmVkIGNoYW5uZWxcIi5cbiAqIEBwYXJhbSAge251bWJlcn0gZyDQndC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSBcImdyZWVuIGNoYW5uZWxcIi5cbiAqIEBwYXJhbSAge251bWJlcn0gYiDQndC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSBcImJsdWUgY2hhbm5lbFwiLlxuICogQHBhcmFtICB7bnVtYmVyfSBhINCd0L7RgNC80LDQu9C40LfQvtCy0LDQvdC90L7QtSDQt9C90LDRh9C10L3QuNC1INC/0YDQvtC30YDQsNGH0L3QvtGB0YLQuCAoYWxwaGEpLlxuICogQHJldHVybiB7dm9pZH0gICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIHJlbmRlcmVyLl9jbGVhciggMSwgMCwgMCwgMSApOyAvLyBGaWxsIGNvbnRleHQgd2l0aCByZWQgY29sb3IuXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLl9jbGVhciA9IGZ1bmN0aW9uIF9jbGVhciAoIHIsIGcsIGIsIGEgKVxue1xuICB2YXIgZ2wgPSB0aGlzLmNvbnRleHQ7XG4gIGdsLmNsZWFyQ29sb3IoIHIsIGcsIGIsIGEgKTtcbiAgZ2wuY2xlYXIoIGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNiYWNrZ3JvdW5kQ29sb3JcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuYmFja2dyb3VuZENvbG9yID0gZnVuY3Rpb24gYmFja2dyb3VuZENvbG9yICggciwgZywgYiwgYSApXG57XG4gIHZhciByZ2JhID0gbmV3IHRoaXMuc2V0dGluZ3MuY29sb3IoIHIsIGcsIGIsIGEgKS5yZ2JhKCk7XG4gIHRoaXMuX2NsZWFyKCByZ2JhWyAwIF0gLyAyNTUsIHJnYmFbIDEgXSAvIDI1NSwgcmdiYVsgMiBdIC8gMjU1LCByZ2JhWyAzIF0gKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2NsZWFyXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIgKClcbntcbiAgdGhpcy5fY2xlYXIoIDAsIDAsIDAsIDAgKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2RyYXdBcnJheXNcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuZHJhd0FycmF5cyA9IGZ1bmN0aW9uIGRyYXdBcnJheXMgKCB2ZXJ0cywgY291bnQsIG1vZGUsIF9zeCwgX3N5IClcbntcbiAgdmFyIHByb2dyYW0gPSB0aGlzLnByb2dyYW1zLmRlZmF1bHQ7XG4gIHZhciBnbCAgICAgID0gdGhpcy5jb250ZXh0O1xuXG4gIGlmICggY291bnQgPCAyICkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaWYgKCB2ZXJ0cyApIHtcbiAgICBpZiAoIHR5cGVvZiBtb2RlID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgIG1vZGUgPSBnbC5TVEFUSUNfRFJBVztcbiAgICB9XG5cbiAgICBnbC5iaW5kQnVmZmVyKCBnbC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVycy5kZWZhdWx0ICk7XG4gICAgZ2wuYnVmZmVyRGF0YSggZ2wuQVJSQVlfQlVGRkVSLCB2ZXJ0cywgbW9kZSApO1xuICB9XG5cbiAgaWYgKCB0eXBlb2YgX3N4ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICB0aGlzLm1hdHJpeC5zY2FsZSggX3N4LCBfc3kgKTtcbiAgfVxuXG4gIHByb2dyYW1cbiAgICAudXNlKClcbiAgICAuc2V0VW5pZm9ybSggJ3V0cmFuc2Zvcm0nLCB0aGlzLm1hdHJpeC5tYXRyaXggKVxuICAgIC5zZXRVbmlmb3JtKCAndXJlcycsIFsgdGhpcy53LCB0aGlzLmggXSApXG4gICAgLnNldEF0dHJpYnV0ZSggJ2Fwb3MnLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDAgKTtcblxuICB0aGlzLl9maWxsKCBjb3VudCApO1xuICB0aGlzLl9zdHJva2UoIGNvdW50ICk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5SZW5kZXJlckdMLnByb3RvdHlwZS5fZmlsbCA9IGZ1bmN0aW9uIF9maWxsICggY291bnQgKVxue1xuICBpZiAoIHRoaXMuX2RvRmlsbCApIHtcbiAgICB0aGlzLnByb2dyYW1zLmRlZmF1bHQuc2V0VW5pZm9ybSggJ3Vjb2xvcicsIHRoaXMuX2ZpbGxDb2xvci5yZ2JhKCkgKTtcbiAgICB0aGlzLmNvbnRleHQuZHJhd0FycmF5cyggdGhpcy5jb250ZXh0LlRSSUFOR0xFX0ZBTiwgMCwgY291bnQgKTtcbiAgfVxufTtcblxuUmVuZGVyZXJHTC5wcm90b3R5cGUuX3N0cm9rZSA9IGZ1bmN0aW9uIF9zdHJva2UgKCBjb3VudCApXG57XG4gIGlmICggdGhpcy5fZG9TdHJva2UgJiYgdGhpcy5fbGluZVdpZHRoID4gMCApIHtcbiAgICB0aGlzLnByb2dyYW1zLmRlZmF1bHQuc2V0VW5pZm9ybSggJ3Vjb2xvcicsIHRoaXMuX3N0cm9rZUNvbG9yLnJnYmEoKSApO1xuICAgIHRoaXMuY29udGV4dC5saW5lV2lkdGgoIHRoaXMuX2xpbmVXaWR0aCApO1xuICAgIHRoaXMuY29udGV4dC5kcmF3QXJyYXlzKCB0aGlzLmNvbnRleHQuTElORV9MT09QLCAwLCBjb3VudCApO1xuICB9XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2FyY1xuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5hcmMgPSBmdW5jdGlvbiBhcmMgKCB4LCB5LCByIClcbntcbiAgcmV0dXJuIHRoaXMuZHJhd1BvbHlnb24oIHgsIHksIHIsIHIsIDI0LCAwICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI3JlY3RcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUucmVjdCA9IGZ1bmN0aW9uIHJlY3QgKCB4LCB5LCB3LCBoIClcbntcbiAgeCA9IHByb2Nlc3NSZWN0QWxpZ25YKCB0aGlzLCB4LCB3ICk7XG4gIHkgPSBwcm9jZXNzUmVjdEFsaWduWSggdGhpcywgeSwgaCApO1xuICB0aGlzLm1hdHJpeC5zYXZlKCk7XG4gIHRoaXMubWF0cml4LnRyYW5zbGF0ZSggeCwgeSApO1xuICB0aGlzLm1hdHJpeC5zY2FsZSggdywgaCApO1xuICB0aGlzLmNvbnRleHQuYmluZEJ1ZmZlciggdGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXJzLnJlY3QgKTtcbiAgdGhpcy5kcmF3QXJyYXlzKCBudWxsLCA0ICk7XG4gIHRoaXMubWF0cml4LnJlc3RvcmUoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyR0w7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdGFudHMgICAgICAgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApO1xuXG52YXIgcmVwb3J0ICAgICAgICAgID0gcmVxdWlyZSggJy4uL2ludGVybmFsL3JlcG9ydCcgKTtcblxudmFyIGdldFJlbmRlcmVyVHlwZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL2dldF9yZW5kZXJlcl90eXBlJyApO1xudmFyIGdldFdlYkdMICAgICAgICA9IHJlcXVpcmUoICcuL2ludGVybmFsL2dldF93ZWJnbCcgKTtcblxudmFyIFJlbmRlcmVyR0wgICAgICA9IHJlcXVpcmUoICcuL1JlbmRlcmVyR0wnICk7XG52YXIgUmVuZGVyZXIyRCAgICAgID0gcmVxdWlyZSggJy4vUmVuZGVyZXIyRCcgKTtcbnZhciB0eXBlICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9zZXR0aW5ncycgKS50eXBlO1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkg0YDQtdC90LTQtdGA0LXRgC4g0JXRgdC70Lgg0YHQvtC30LTQsNGC0YwgV2ViR0wg0LrQvtC90YLQtdC60YHRgiDQvdC1INC/0L7Qu9GD0YfQuNGC0YHRjywg0YLQviDQsdGD0LTQtdGCINC40YHQv9C+0LvRjNC30L7QstCw0L0gMkQuXG4gKiBAbWV0aG9kIHY2LmNyZWF0ZVJlbmRlcmVyXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgICAgICBvcHRpb25zIHtAbGluayB2Ni5zZXR0aW5ncy5yZW5kZXJlcn0uXG4gKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSAgICAgICAgINCd0L7QstGL0Lkg0YDQtdC90LTQtdGA0LXRgCAoMkQsIEdMKS5cbiAqIEBleGFtcGxlXG4gKiB2YXIgY3JlYXRlUmVuZGVyZXIgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9jcmVhdGVfcmVuZGVyZXInICk7XG4gKiB2YXIgY29uc3RhbnRzICAgICAgPSByZXF1aXJlKCAndjYuanMvY29yZS9jb25zdGFudHMnICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyBXZWJHTCBvciAyRCByZW5kZXJlciBiYXNlZCBvbiBwbGF0Zm9ybSBhbmQgYnJvd3NlcjwvY2FwdGlvbj5cbiAqIHZhciByZW5kZXJlciA9IGNyZWF0ZVJlbmRlcmVyKCB7IHR5cGU6IGNvbnN0YW50cy5nZXQoICdBVVRPJyApIH0gKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIFdlYkdMIHJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIHJlbmRlcmVyID0gY3JlYXRlUmVuZGVyZXIoIHsgdHlwZTogY29uc3RhbnRzLmdldCggJ0dMJyApIH0gKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIDJEIHJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIHJlbmRlcmVyID0gY3JlYXRlUmVuZGVyZXIoIHsgdHlwZTogY29uc3RhbnRzLmdldCggJzJEJyApIH0gKTtcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUmVuZGVyZXIgKCBvcHRpb25zIClcbntcbiAgdmFyIHR5cGVfID0gKCBvcHRpb25zICYmIG9wdGlvbnMudHlwZSApIHx8IHR5cGU7XG5cbiAgaWYgKCB0eXBlXyA9PT0gY29uc3RhbnRzLmdldCggJ0FVVE8nICkgKSB7XG4gICAgdHlwZV8gPSBnZXRSZW5kZXJlclR5cGUoKTtcbiAgfVxuXG4gIGlmICggdHlwZV8gPT09IGNvbnN0YW50cy5nZXQoICdHTCcgKSApIHtcbiAgICBpZiAoIGdldFdlYkdMKCkgKSB7XG4gICAgICByZXR1cm4gbmV3IFJlbmRlcmVyR0woIG9wdGlvbnMgKTtcbiAgICB9XG5cbiAgICByZXBvcnQoICdDYW5ub3QgY3JlYXRlIFdlYkdMIGNvbnRleHQuIEZhbGxpbmcgYmFjayB0byAyRC4nICk7XG4gIH1cblxuICBpZiAoIHR5cGVfID09PSBjb25zdGFudHMuZ2V0KCAnMkQnICkgfHwgdHlwZV8gPT09IGNvbnN0YW50cy5nZXQoICdHTCcgKSApIHtcbiAgICByZXR1cm4gbmV3IFJlbmRlcmVyMkQoIG9wdGlvbnMgKTtcbiAgfVxuXG4gIHRocm93IEVycm9yKCAnR290IHVua25vd24gcmVuZGVyZXIgdHlwZS4gVGhlIGtub3duIGFyZTogMkQgYW5kIEdMJyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVJlbmRlcmVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCX0LDQutGA0YvQstCw0LXRgiDRhNC40LPRg9GA0YMuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjbG9zZVNoYXBlXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSByZW5kZXJlciDQoNC10L3QtNC10YDQtdGALlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKi9cbmZ1bmN0aW9uIGNsb3NlU2hhcGUgKCByZW5kZXJlciApXG57XG4gIGlmICggISByZW5kZXJlci5fY2xvc2VkU2hhcGUgKSB7XG4gICAgcmVuZGVyZXIuX2Nsb3NlZFNoYXBlID0gcmVuZGVyZXIuX3ZlcnRpY2VzLnNsaWNlKCk7XG4gICAgcmVuZGVyZXIuX2Nsb3NlZFNoYXBlLnB1c2goIHJlbmRlcmVyLl9jbG9zZWRTaGFwZVsgMCBdICk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbG9zZVNoYXBlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCa0L7Qv9C40YDRg9C10YIgZHJhd2luZyBzZXR0aW5ncyAoX2xpbmVXaWR0aCwgX3JlY3RBbGlnblgsINC4INGCLtC0Likg0LjQtyBgc291cmNlYCDQsiBgdGFyZ2V0YC5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNvcHlEcmF3aW5nU2V0dGluZ3NcbiAqIEBwYXJhbSAge29iamVjdH0gIHRhcmdldCDQnNC+0LbQtdGCINCx0YvRgtGMIGBBYnN0cmFjdFJlbmRlcmVyYCDQuNC70Lgg0L/RgNC+0YHRgtGL0Lwg0L7QsdGK0LXQutGC0L7QvCDRgSDRgdC+0YXRgNCw0L3QtdC90L3Ri9C80Lgg0YfQtdGA0LXQt1xuICogICAgICAgICAgICAgICAgICAgICAgICAgINGN0YLRgyDRhNGD0L3QutGG0LjRjiDQvdCw0YHRgtGA0L7QudC60LDQvNC4LlxuICogQHBhcmFtICB7b2JqZWN0fSAgc291cmNlINCe0L/QuNGB0LDQvdC40LUg0YLQviDQttC1LCDRh9GC0L4g0Lgg0LTQu9GPIGB0YXJnZXRgLlxuICogQHBhcmFtICB7Ym9vbGVhbn0gW2RlZXBdINCV0YHQu9C4IGB0cnVlYCwg0YLQviDQsdGD0LTQtdGCINGC0LDQutC20LUg0LrQvtC/0LjRgNC+0LLQsNGC0YwgX2ZpbGxDb2xvciwgX3N0cm9rZUNvbG9yINC4INGCLtC0LlxuICogQHJldHVybiB7b2JqZWN0fSAgICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIGB0YXJnZXRgLlxuICovXG5mdW5jdGlvbiBjb3B5RHJhd2luZ1NldHRpbmdzICggdGFyZ2V0LCBzb3VyY2UsIGRlZXAgKVxue1xuICBpZiAoIGRlZXAgKSB7XG4gICAgdGFyZ2V0Ll9maWxsQ29sb3JbIDAgXSAgID0gc291cmNlLl9maWxsQ29sb3JbIDAgXTtcbiAgICB0YXJnZXQuX2ZpbGxDb2xvclsgMSBdICAgPSBzb3VyY2UuX2ZpbGxDb2xvclsgMSBdO1xuICAgIHRhcmdldC5fZmlsbENvbG9yWyAyIF0gICA9IHNvdXJjZS5fZmlsbENvbG9yWyAyIF07XG4gICAgdGFyZ2V0Ll9maWxsQ29sb3JbIDMgXSAgID0gc291cmNlLl9maWxsQ29sb3JbIDMgXTtcbiAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWyAwIF0gPSBzb3VyY2UuX3N0cm9rZUNvbG9yWyAwIF07XG4gICAgdGFyZ2V0Ll9zdHJva2VDb2xvclsgMSBdID0gc291cmNlLl9zdHJva2VDb2xvclsgMSBdO1xuICAgIHRhcmdldC5fc3Ryb2tlQ29sb3JbIDIgXSA9IHNvdXJjZS5fc3Ryb2tlQ29sb3JbIDIgXTtcbiAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWyAzIF0gPSBzb3VyY2UuX3N0cm9rZUNvbG9yWyAzIF07XG4gIH1cblxuICB0YXJnZXQuX2JhY2tncm91bmRQb3NpdGlvblggPSBzb3VyY2UuX2JhY2tncm91bmRQb3NpdGlvblg7XG4gIHRhcmdldC5fYmFja2dyb3VuZFBvc2l0aW9uWSA9IHNvdXJjZS5fYmFja2dyb3VuZFBvc2l0aW9uWTtcbiAgdGFyZ2V0Ll9yZWN0QWxpZ25YICAgICAgICAgID0gc291cmNlLl9yZWN0QWxpZ25YO1xuICB0YXJnZXQuX3JlY3RBbGlnblkgICAgICAgICAgPSBzb3VyY2UuX3JlY3RBbGlnblk7XG4gIHRhcmdldC5fbGluZVdpZHRoICAgICAgICAgICA9IHNvdXJjZS5fbGluZVdpZHRoO1xuICB0YXJnZXQuX2RvU3Ryb2tlICAgICAgICAgICAgPSBzb3VyY2UuX2RvU3Ryb2tlO1xuICB0YXJnZXQuX2RvRmlsbCAgICAgICAgICAgICAgPSBzb3VyY2UuX2RvRmlsbDtcblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvcHlEcmF3aW5nU2V0dGluZ3M7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCAnLi4vLi4vY29uc3RhbnRzJyApO1xuXG52YXIgZGVmYXVsdERyYXdpbmdTZXR0aW5ncyA9IHtcbiAgX2JhY2tncm91bmRQb3NpdGlvblg6IGNvbnN0YW50cy5nZXQoICdMRUZUJyApLFxuICBfYmFja2dyb3VuZFBvc2l0aW9uWTogY29uc3RhbnRzLmdldCggJ1RPUCcgKSxcbiAgX3JlY3RBbGlnblg6ICAgICAgICAgIGNvbnN0YW50cy5nZXQoICdMRUZUJyApLFxuICBfcmVjdEFsaWduWTogICAgICAgICAgY29uc3RhbnRzLmdldCggJ1RPUCcgKSxcbiAgX2xpbmVXaWR0aDogICAgICAgICAgIDIsXG4gIF9kb1N0cm9rZTogICAgICAgICAgICB0cnVlLFxuICBfZG9GaWxsOiAgICAgICAgICAgICAgdHJ1ZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0RHJhd2luZ1NldHRpbmdzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb25jZSAgICAgID0gcmVxdWlyZSggJ3BlYWtvL29uY2UnICk7XG5cbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCAnLi4vLi4vY29uc3RhbnRzJyApO1xuXG4vLyBcInBsYXRmb3JtXCIgbm90IGluY2x1ZGVkIHVzaW5nIDxzY3JpcHQgLz4gdGFnLlxuaWYgKCB0eXBlb2YgcGxhdGZvcm0gPT09ICd1bmRlZmluZWQnICkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZS1iZWZvcmUtZGVmaW5lXG4gIHZhciBwbGF0Zm9ybTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG4gIHRyeSB7XG4gICAgcGxhdGZvcm0gPSByZXF1aXJlKCAncGxhdGZvcm0nICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ2xvYmFsLXJlcXVpcmVcbiAgfSBjYXRjaCAoIGVycm9yICkge1xuICAgIC8vIFwicGxhdGZvcm1cIiBub3QgaW5zdGFsbGVkIHVzaW5nIE5QTS5cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZW5kZXJlclR5cGUgKClcbntcbiAgdmFyIHNhZmFyaSwgdG91Y2hhYmxlO1xuXG4gIGlmICggcGxhdGZvcm0gKSB7XG4gICAgc2FmYXJpID0gcGxhdGZvcm0ub3MgJiZcbiAgICAgIHBsYXRmb3JtLm9zLmZhbWlseSA9PT0gJ2lPUycgJiZcbiAgICAgIHBsYXRmb3JtLm5hbWUgPT09ICdTYWZhcmknO1xuICB9XG5cbiAgaWYgKCB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICB0b3VjaGFibGUgPSAnb250b3VjaGVuZCcgaW4gd2luZG93O1xuICB9XG5cbiAgaWYgKCB0b3VjaGFibGUgJiYgISBzYWZhcmkgKSB7XG4gICAgcmV0dXJuIGNvbnN0YW50cy5nZXQoICdHTCcgKTtcbiAgfVxuXG4gIHJldHVybiBjb25zdGFudHMuZ2V0KCAnMkQnICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb25jZSggZ2V0UmVuZGVyZXJUeXBlICk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBvbmNlID0gcmVxdWlyZSggJ3BlYWtvL29uY2UnICk7XG5cbi8qKlxuICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LjQvNGPINC/0L7QtNC00LXRgNC20LjQstCw0LXQvNC+0LPQviBXZWJHTCDQutC+0L3RgtC10LrRgdGC0LAsINC90LDQv9GA0LjQvNC10YA6ICdleHBlcmltZW50YWwtd2ViZ2wnLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgZ2V0V2ViR0xcbiAqIEByZXR1cm4ge3N0cmluZz99INCSINGB0LvRg9GH0LDQtSDQvdC10YPQtNCw0YfQuCAoV2ViR0wg0L3QtSDQv9C+0LTQtNC10YDQttC40LLQsNC10YLRgdGPKSAtINCy0LXRgNC90LXRgiBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGdldFdlYkdMICgpXG57XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xuICB2YXIgbmFtZSAgID0gbnVsbDtcblxuICBpZiAoIGNhbnZhcy5nZXRDb250ZXh0KCAnd2ViZ2wnICkgKSB7XG4gICAgbmFtZSA9ICd3ZWJnbCc7XG4gIH0gZWxzZSBpZiAoIGNhbnZhcy5nZXRDb250ZXh0KCAnZXhwZXJpbWVudGFsLXdlYmdsJyApICkge1xuICAgIG5hbWUgPSAnZXhwZXJpbWVudGFsLXdlYmdsJztcbiAgfVxuXG4gIC8vIEZpeGluZyBwb3NzaWJsZSBtZW1vcnkgbGVhay5cbiAgY2FudmFzID0gbnVsbDtcbiAgcmV0dXJuIG5hbWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb25jZSggZ2V0V2ViR0wgKTtcbiIsIi8qIGVzbGludCBsaW5lcy1hcm91bmQtZGlyZWN0aXZlOiBvZmYgKi9cbi8qIGVzbGludCBsaW5lcy1hcm91bmQtY29tbWVudDogb2ZmICovXG4ndXNlIHN0cmljdCc7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJy4uLy4uL2NvbnN0YW50cycgKTtcbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgcHJvY2Vzc1JlY3RBbGlnblhcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHJlbmRlcmVyXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB4XG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB3XG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydHMucHJvY2Vzc1JlY3RBbGlnblggPSBmdW5jdGlvbiBwcm9jZXNzUmVjdEFsaWduWCAoIHJlbmRlcmVyLCB4LCB3ICkgeyBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25YID09PSBjb25zdGFudHMuZ2V0KCBcIkNFTlRFUlwiICkgKSB7IHggLT0gdyAqIDAuNTsgfSBlbHNlIGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblggPT09IGNvbnN0YW50cy5nZXQoIFwiUklHSFRcIiApICkgeyB4IC09IHc7IH0gZWxzZSBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25YICE9PSBjb25zdGFudHMuZ2V0KCBcIkxFRlRcIiApICkgeyB0aHJvdyBFcnJvciggJ1Vua25vd24gXCIgKycgKyBcInJlY3RBbGlnblhcIiArICdcIjogJyArIHJlbmRlcmVyLl9yZWN0QWxpZ25YICk7IH0gcmV0dXJuIE1hdGguZmxvb3IoIHggKTsgfTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHByb2Nlc3NSZWN0QWxpZ25ZXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSByZW5kZXJlclxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgeVxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgaFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnRzLnByb2Nlc3NSZWN0QWxpZ25ZID0gZnVuY3Rpb24gcHJvY2Vzc1JlY3RBbGlnblkgKCByZW5kZXJlciwgeCwgdyApIHsgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWSA9PT0gY29uc3RhbnRzLmdldCggXCJNSURETEVcIiApICkgeyB4IC09IHcgKiAwLjU7IH0gZWxzZSBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25ZID09PSBjb25zdGFudHMuZ2V0KCBcIkJPVFRPTVwiICkgKSB7IHggLT0gdzsgfSBlbHNlIGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblkgIT09IGNvbnN0YW50cy5nZXQoIFwiVE9QXCIgKSApIHsgdGhyb3cgRXJyb3IoICdVbmtub3duIFwiICsnICsgXCJyZWN0QWxpZ25ZXCIgKyAnXCI6ICcgKyByZW5kZXJlci5fcmVjdEFsaWduWSApOyB9IHJldHVybiBNYXRoLmZsb29yKCB4ICk7IH07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR0wgPSByZXF1aXJlKCAnLi4vLi4vY29uc3RhbnRzJyApLmdldCggJ0dMJyApO1xuXG4vKipcbiAqINCe0LHRgNCw0LHQsNGC0YvQstCw0LXRgiDRhNC40LPRg9GA0YMuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBwcm9jZXNzU2hhcGVcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHJlbmRlcmVyINCg0LXQvdC00LXRgNC10YAuXG4gKiBAcGFyYW0gIHtBcnJheXxGbG9hdDMyQXJyYXl9ICB2ZXJ0aWNlcyDQktC10YDRiNC40L3Riy5cbiAqIEByZXR1cm4ge0FycmF5fEZsb2F0MzJBcnJheX0gICAgICAgICAgINCe0LHRgNCw0LHQvtGC0LDQvdC90YvQtSDQstC10YDRiNC40L3Riy5cbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc1NoYXBlICggcmVuZGVyZXIsIHZlcnRpY2VzIClcbntcbiAgaWYgKCByZW5kZXJlci50eXBlID09PSBHTCAmJiB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSAnZnVuY3Rpb24nICYmICEgKCB2ZXJ0aWNlcyBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSApICkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gICAgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KCB2ZXJ0aWNlcyApOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICB9XG5cbiAgcmV0dXJuIHZlcnRpY2VzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHByb2Nlc3NTaGFwZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmF1bHREcmF3aW5nU2V0dGluZ3MgPSByZXF1aXJlKCAnLi9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MnICk7XG52YXIgY29weURyYXdpbmdTZXR0aW5ncyAgICA9IHJlcXVpcmUoICcuL2NvcHlfZHJhd2luZ19zZXR0aW5ncycgKTtcblxuLyoqXG4gKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBkcmF3aW5nIHNldHRpbmdzINC/0L4g0YPQvNC+0LvRh9Cw0L3QuNGOINCyIGB0YXJnZXRgLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2Qgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5nc1xuICogQHBhcmFtICB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ICAg0JzQvtC20LXRgiDQsdGL0YLRjCBgQWJzdHJhY3RSZW5kZXJlcmAg0LjQu9C4INC/0YDQvtGB0YLRi9C8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDQvtCx0YrQtdC60YLQvtC8LlxuICogQHBhcmFtICB7bW9kdWxlOlwidjYuanNcIi5BYnN0cmFjdFJlbmRlcmVyfSByZW5kZXJlciBgUmVuZGVyZXJHTGAg0LjQu9C4IGBSZW5kZXJlcjJEYCDQvdGD0LbQvdGLINC00LvRj1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0YPRgdGC0LDQvdC+0LLQutC4IF9zdHJva2VDb2xvciwgX2ZpbGxDb2xvci5cbiAqIEByZXR1cm4ge29iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIGB0YXJnZXRgLlxuICovXG5mdW5jdGlvbiBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzICggdGFyZ2V0LCByZW5kZXJlciApXG57XG5cbiAgY29weURyYXdpbmdTZXR0aW5ncyggdGFyZ2V0LCBkZWZhdWx0RHJhd2luZ1NldHRpbmdzICk7XG5cbiAgdGFyZ2V0Ll9zdHJva2VDb2xvciA9IG5ldyByZW5kZXJlci5zZXR0aW5ncy5jb2xvcigpO1xuICB0YXJnZXQuX2ZpbGxDb2xvciAgID0gbmV3IHJlbmRlcmVyLnNldHRpbmdzLmNvbG9yKCk7XG5cbiAgcmV0dXJuIHRhcmdldDtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3M7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb2xvciA9IHJlcXVpcmUoICcuLi9jb2xvci9SR0JBJyApO1xudmFyIHR5cGUgID0gcmVxdWlyZSggJy4uL2NvbnN0YW50cycgKS5nZXQoICcyRCcgKTtcblxuLyoqXG4gKiDQndCw0YHRgtGA0L7QudC60Lgg0LTQu9GPINGA0LXQvdC00LXRgNC10YDQvtCyOiB7QGxpbmsgdjYuUmVuZGVyZXIyRH0sIHtAbGluayB2Ni5SZW5kZXJlckdMfSwge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXJ9LCB7QGxpbmsgdjYuY3JlYXRlUmVuZGVyZXJ9LlxuICogQG5hbWVzcGFjZSB2Ni5zZXR0aW5ncy5yZW5kZXJlclxuICovXG5cbi8qKlxuICogQG1lbWJlciAgIHtvYmplY3R9IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5zZXR0aW5nc10g0J3QsNGB0YLRgNC+0LnQutC4INGA0LXQvdC00LXRgNC10YDQsCDQv9C+INGD0LzQvtC70YfQsNC90LjRji5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBbY29sb3I9e0BsaW5rIHY2LlJHQkF9XSAgICAgICAgINCa0L7QvdGB0YLRgNGD0LrRgtC+0YDRiyB7QGxpbmsgdjYuUkdCQX0g0LjQu9C4IHtAbGluayB2Ni5IU0xBfS5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2NhbGU9MV0gICAgICAgICAgICAgICAgICAgICAgINCf0LvQvtGC0L3QvtGB0YLRjCDQv9C40LrRgdC10LvQtdC5INGA0LXQvdC00LXRgNC10YDQsCwg0L3QsNC/0YDQuNC80LXRgDogYGRldmljZVBpeGVsUmF0aW9gLlxuICovXG5leHBvcnRzLnNldHRpbmdzID0ge1xuICBjb2xvcjogY29sb3IsXG4gIHNjYWxlOiAxXG59O1xuXG4vKipcbiAqINCf0L7QutCwINC90LUg0YHQtNC10LvQsNC90L4uXG4gKiBAbWVtYmVyIHtib29sZWFufSBbdjYuc2V0dGluZ3MucmVuZGVyZXIuYW50aWFsaWFzPXRydWVdXG4gKi9cbmV4cG9ydHMuYW50aWFsaWFzID0gdHJ1ZTtcblxuLyoqXG4gKiDQn9C+0LrQsCDQvdC1INGB0LTQtdC70LDQvdC+LlxuICogQG1lbWJlciB7Ym9vbGVhbn0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLmJsZW5kaW5nPXRydWVdXG4gKi9cbmV4cG9ydHMuYmxlbmRpbmcgPSB0cnVlO1xuXG4vKipcbiAqINCY0YHQv9C+0LvRjNC30L7QstCw0YLRjCDQs9GA0LDQtNGD0YHRiyDQstC80LXRgdGC0L4g0YDQsNC00LjQsNC90L7Qsi5cbiAqIEBtZW1iZXIge2Jvb2xlYW59IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5kZWdyZWVzPWZhbHNlXVxuICovXG5leHBvcnRzLmRlZ3JlZXMgPSBmYWxzZTtcblxuLyoqXG4gKiDQmNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0L/RgNC+0LfRgNCw0YfQvdGL0LkgKNCy0LzQtdGB0YLQviDRh9C10YDQvdC+0LPQvikg0LrQvtC90YLQtdC60YHRgi5cbiAqIEBtZW1iZXIge2Jvb2xlYW59IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5hbHBoYT10cnVlXVxuICovXG5leHBvcnRzLmFscGhhID0gdHJ1ZTtcblxuLyoqXG4gKiDQotC40L8g0LrQvtC90YLQtdC60YHRgtCwICgyRCwgR0wsIEFVVE8pLlxuICogQG1lbWJlciB7Y29uc3RhbnR9IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci50eXBlPTJEXVxuICovXG5leHBvcnRzLnR5cGUgPSB0eXBlO1xuXG4vKipcbiAqINCSINGN0YLQvtGCINGN0LvQtdC80LXQvdGCINCx0YPQtNC10YIg0LTQvtCx0LDQstC70LXQvSBgY2FudmFzYC5cbiAqIEBtZW1iZXIge0VsZW1lbnQ/fSBbdjYuc2V0dGluZ3MucmVuZGVyZXIuYXBwZW5kVG9dXG4gKi9cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbWVtYmVyIHY2LnNoYXBlcy5kcmF3TGluZXNcbiAqIEBleGFtcGxlXG4gKiBzaGFwZXMuZHJhd0xpbmVzKCByZW5kZXJlciwgdmVydGljZXMgKTtcbiAqL1xuZnVuY3Rpb24gZHJhd0xpbmVzICgpXG57XG4gIHRocm93IEVycm9yKCAnTm90IGltcGxlbWVudGVkJyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRyYXdMaW5lcztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbWVtYmVyIHY2LnNoYXBlcy5kcmF3UG9pbnRzXG4gKiBAZXhhbXBsZVxuICogc2hhcGVzLmRyYXdQb2ludHMoIHJlbmRlcmVyLCB2ZXJ0aWNlcyApO1xuICovXG5mdW5jdGlvbiBkcmF3UG9pbnRzICgpXG57XG4gIHRocm93IEVycm9yKCAnTm90IGltcGxlbWVudGVkJyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRyYXdQb2ludHM7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0JPQu9Cw0LLQvdGL0LUg0L3QsNGB0YLRgNC+0LnQutC4IFwidjYuanNcIi5cbiAqIEBuYW1lc3BhY2UgdjYuc2V0dGluZ3MuY29yZVxuICovXG5cbi8qKlxuICog0JjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMINCz0YDQsNC00YPRgdGLINCy0LzQtdGB0YLQviDRgNCw0LTQuNCw0L3QvtCyLlxuICogQG1lbWJlciB7Ym9vbGVhbn0gdjYuc2V0dGluZ3MuY29yZS5kZWdyZWVzXG4gKi9cbmV4cG9ydHMuZGVncmVzcyA9IGZhbHNlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVNoYWRlclNvdXJjZXNcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB2ZXJ0INCY0YHRhdC+0LTQvdC40Log0LLQtdGA0YjQuNC90L3QvtCz0L4gKHZlcnRleCkg0YjQtdC50LTQtdGA0LAuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZnJhZyDQmNGB0YXQvtC00L3QuNC6INGE0YDQsNCz0LzQtdC90YLQvdC+0LPQviAoZnJhZ21lbnQpINGI0LXQudC00LXRgNCwLlxuICovXG5cbi8qKlxuICogV2ViR0wg0YjQtdC50LTQtdGA0YsuXG4gKiBAbWVtYmVyIHtvYmplY3R9IHY2LnNoYWRlcnNcbiAqIEBwcm9wZXJ0eSB7SVNoYWRlclNvdXJjZXN9IGJhc2ljICAgICAg0KHRgtCw0L3QtNCw0YDRgtC90YvQtSDRiNC10LnQtNC10YDRiy5cbiAqIEBwcm9wZXJ0eSB7SVNoYWRlclNvdXJjZXN9IGJhY2tncm91bmQg0KjQtdC50LTQtdGA0Ysg0LTQu9GPINC+0YLRgNC40YHQvtCy0LrQuCDRhNC+0L3QsC5cbiAqL1xudmFyIHNoYWRlcnMgPSB7XG4gIGJhc2ljOiB7XG4gICAgdmVydDogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O2F0dHJpYnV0ZSB2ZWMyIGFwb3M7dW5pZm9ybSB2ZWMyIHVyZXM7dW5pZm9ybSBtYXQzIHV0cmFuc2Zvcm07dm9pZCBtYWluKCl7Z2xfUG9zaXRpb249dmVjNCgoKHV0cmFuc2Zvcm0qdmVjMyhhcG9zLDEuMCkpLnh5L3VyZXMqMi4wLTEuMCkqdmVjMigxLC0xKSwwLDEpO30nLFxuICAgIGZyYWc6ICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDt1bmlmb3JtIHZlYzQgdWNvbG9yO3ZvaWQgbWFpbigpe2dsX0ZyYWdDb2xvcj12ZWM0KHVjb2xvci5yZ2IvMjU1LjAsdWNvbG9yLmEpO30nXG4gIH0sXG5cbiAgYmFja2dyb3VuZDoge1xuICAgIHZlcnQ6ICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDthdHRyaWJ1dGUgdmVjMiBhcG9zO3ZvaWQgbWFpbigpe2dsX1Bvc2l0aW9uID0gdmVjNChhcG9zLDAsMSk7fScsXG4gICAgZnJhZzogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O3VuaWZvcm0gdmVjNCB1Y29sb3I7dm9pZCBtYWluKCl7Z2xfRnJhZ0NvbG9yPXVjb2xvcjt9J1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoYWRlcnM7XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNy0yMDE4IFZsYWRpc2xhdiBUaWtoaXkgKFNJTEVOVClcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBHUEwtMy4wIGxpY2Vuc2UuXG4gKiBodHRwczovL2dpdGh1Yi5jb20vdGlraGl5L3Y2LmpzL3RyZWUvZGV2L1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIHY2XG4gKi9cblxuZXhwb3J0cy5BYnN0cmFjdEltYWdlICAgID0gcmVxdWlyZSggJy4vY29yZS9pbWFnZS9BYnN0cmFjdEltYWdlJyApO1xuZXhwb3J0cy5BYnN0cmFjdFJlbmRlcmVyID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyJyApO1xuZXhwb3J0cy5BYnN0cmFjdFZlY3RvciAgID0gcmVxdWlyZSggJy4vY29yZS9tYXRoL0Fic3RyYWN0VmVjdG9yJyApO1xuZXhwb3J0cy5DYW1lcmEgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9jYW1lcmEvQ2FtZXJhJyApO1xuZXhwb3J0cy5Db21wb3VuZGVkSW1hZ2UgID0gcmVxdWlyZSggJy4vY29yZS9pbWFnZS9Db21wb3VuZGVkSW1hZ2UnICk7XG5leHBvcnRzLkhTTEEgICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2NvbG9yL0hTTEEnICk7XG5leHBvcnRzLkltYWdlICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2ltYWdlL0ltYWdlJyApO1xuZXhwb3J0cy5SR0JBICAgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9jb2xvci9SR0JBJyApO1xuZXhwb3J0cy5SZW5kZXJlcjJEICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9SZW5kZXJlcjJEJyApO1xuZXhwb3J0cy5SZW5kZXJlckdMICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9SZW5kZXJlckdMJyApO1xuZXhwb3J0cy5TaGFkZXJQcm9ncmFtICAgID0gcmVxdWlyZSggJy4vY29yZS9TaGFkZXJQcm9ncmFtJyApO1xuZXhwb3J0cy5UaWNrZXIgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9UaWNrZXInICk7XG5leHBvcnRzLlRyYW5zZm9ybSAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL1RyYW5zZm9ybScgKTtcbmV4cG9ydHMuVmVjdG9yMkQgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvbWF0aC9WZWN0b3IyRCcgKTtcbmV4cG9ydHMuVmVjdG9yM0QgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvbWF0aC9WZWN0b3IzRCcgKTtcbmV4cG9ydHMuY29uc3RhbnRzICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvY29uc3RhbnRzJyApO1xuZXhwb3J0cy5jcmVhdGVSZW5kZXJlciAgID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9jcmVhdGVfcmVuZGVyZXInICk7XG5leHBvcnRzLnNoYWRlcnMgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL3NoYWRlcnMnICk7XG5leHBvcnRzLm1hdDMgICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL21hdGgvbWF0MycgKTtcblxuLyoqXG4gKiBcInY2LmpzXCIgYnVpbHQtaW4gZHJhd2luZyBmdW5jdGlvbnMuXG4gKiBAbmFtZXNwYWNlIHY2LnNoYXBlc1xuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciN2ZXJ0ZXhcbiAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNlbmRTaGFwZVxuICogQGV4YW1wbGVcbiAqIHZhciBzaGFwZXMgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9zaGFwZXMnICk7XG4gKiBAZXhhbXBsZVxuICogcmVuZGVyZXIuYmVnaW5TaGFwZSgge1xuICogICBkcmF3RnVuY3Rpb246IHNoYXBlcy5kcmF3UG9pbnRzXG4gKiB9ICk7XG4gKi9cbmV4cG9ydHMuc2hhcGVzID0ge1xuICBkcmF3UG9pbnRzOiByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL3NoYXBlcy9kcmF3X3BvaW50cycgKSxcbiAgZHJhd0xpbmVzOiAgcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9zaGFwZXMvZHJhd19saW5lcycgKVxufTtcblxuLyoqXG4gKiDQndCw0YHRgtGA0L7QudC60LggXCJ2Ni5qc1wiLlxuICogQG5hbWVzcGFjZSB2Ni5zZXR0aW5nc1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q29yZSBTZXR0aW5nczwvY2FwdGlvbj5cbiAqIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3NldHRpbmdzJyApO1xuICogc2V0dGluZ3MuZGVncmVlcyA9IHRydWU7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5SZW5kZXJlciBTZXR0aW5nczwvY2FwdGlvbj5cbiAqIC8vIERlZmF1bHQgcmVuZGVyZXIgc2V0dGluZ3MuXG4gKiB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9zZXR0aW5ncycgKTtcbiAqIHNldHRpbmdzLmRlZ3JlZXMgPSB0cnVlO1xuICovXG5leHBvcnRzLnNldHRpbmdzID0ge1xuICByZW5kZXJlcjogcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9zZXR0aW5ncycgKSxcbiAgY2FtZXJhOiAgIHJlcXVpcmUoICcuL2NvcmUvY2FtZXJhL3NldHRpbmdzJyApLFxuICBjb3JlOiAgICAgcmVxdWlyZSggJy4vY29yZS9zZXR0aW5ncycgKVxufTtcblxuaWYgKCB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gIHNlbGYudjYgPSBleHBvcnRzO1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIHtzdHJpbmd8djYuSFNMQXx2Ni5SR0JBfSBUQ29sb3JcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkEgc3RyaW5nIChDU1MgY29sb3IpLjwvY2FwdGlvbj5cbiAqIHZhciBjb2xvciA9ICdyZ2JhKCAyNTUsIDAsIDI1NSwgMSApJztcbiAqIHZhciBjb2xvciA9ICdoc2woIDM2MCwgMTAwJSwgNTAlICknO1xuICogdmFyIGNvbG9yID0gJyNmZjAwZmYnO1xuICogdmFyIGNvbG9yID0gJ2xpZ2h0cGluayc7XG4gKiAvLyBcInJnYmEoMCwgMCwgMCwgMClcIlxuICogdmFyIGNvbG9yID0gZ2V0Q29tcHV0ZWRTdHlsZSggZG9jdW1lbnQuYm9keSApLmdldFByb3BlcnR5VmFsdWUoICdiYWNrZ3JvdW5kLWNvbG9yJyApO1xuICogLy8gVGhlIHNhbWUgYXMgXCJ0cmFuc3BhcmVudFwiLlxuICogLy8gTk9URTogQ1NTIGRvZXMgbm90IHN1cHBvcnQgdGhpcyBzeW50YXggYnV0IFwidjYuanNcIiBkb2VzLlxuICogdmFyIGNvbG9yID0gJyMwMDAwMDAwMCc7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5BbiBvYmplY3QgKHY2LlJHQkEsIHY2LkhTTEEpPC9jYXB0aW9uPlxuICogdmFyIGNvbG9yID0gbmV3IFJHQkEoIDI1NSwgMCwgMjU1LCAxICk7XG4gKiB2YXIgY29sb3IgPSBuZXcgSFNMQSggMzYwLCAxMDAsIDUwICk7XG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7bnVtYmVyfSBjb25zdGFudFxuICogQHNlZSB2Ni5jb25zdGFudHNcbiAqIEBleGFtcGxlXG4gKiAvLyBUaGlzIGlzIGEgY29uc3RhbnQuXG4gKiB2YXIgUkVOREVSRVJfVFlQRSA9IGNvbnN0YW50cy5nZXQoICdHTCcgKTtcbiAqL1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVZlY3RvcjJEXG4gKiBAcHJvcGVydHkge251bWJlcn0geFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHlcbiAqL1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEEgbGlnaHR3ZWlnaHQgaW1wbGVtZW50YXRpb24gb2YgTm9kZS5qcyBFdmVudEVtaXR0ZXIuXG4gKiBAY29uc3RydWN0b3IgTGlnaHRFbWl0dGVyXG4gKiBAZXhhbXBsZVxuICogdmFyIExpZ2h0RW1pdHRlciA9IHJlcXVpcmUoICdsaWdodF9lbWl0dGVyJyApO1xuICovXG5mdW5jdGlvbiBMaWdodEVtaXR0ZXIgKCkge31cblxuTGlnaHRFbWl0dGVyLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI2VtaXRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAgICogQHBhcmFtIHsuLi5hbnl9IFtkYXRhXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBlbWl0OiBmdW5jdGlvbiBlbWl0ICggdHlwZSApIHtcbiAgICB2YXIgbGlzdCA9IF9nZXRMaXN0KCB0aGlzLCB0eXBlICk7XG4gICAgdmFyIGRhdGEsIGksIGw7XG5cbiAgICBpZiAoICEgbGlzdCApIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA+IDEgKSB7XG4gICAgICBkYXRhID0gW10uc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICk7XG4gICAgfVxuXG4gICAgZm9yICggaSA9IDAsIGwgPSBsaXN0Lmxlbmd0aDsgaSA8IGw7ICsraSApIHtcbiAgICAgIGlmICggISBsaXN0WyBpIF0uYWN0aXZlICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCBsaXN0WyBpIF0ub25jZSApIHtcbiAgICAgICAgbGlzdFsgaSBdLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIGRhdGEgKSB7XG4gICAgICAgIGxpc3RbIGkgXS5saXN0ZW5lci5hcHBseSggdGhpcywgZGF0YSApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlzdFsgaSBdLmxpc3RlbmVyLmNhbGwoIHRoaXMgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBMaWdodEVtaXR0ZXIjb2ZmXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFt0eXBlXVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbbGlzdGVuZXJdXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9mZjogZnVuY3Rpb24gb2ZmICggdHlwZSwgbGlzdGVuZXIgKSB7XG4gICAgdmFyIGxpc3QsIGk7XG5cbiAgICBpZiAoICEgdHlwZSApIHtcbiAgICAgIHRoaXMuX2V2ZW50cyA9IG51bGw7XG4gICAgfSBlbHNlIGlmICggKCBsaXN0ID0gX2dldExpc3QoIHRoaXMsIHR5cGUgKSApICkge1xuICAgICAgaWYgKCBsaXN0ZW5lciApIHtcbiAgICAgICAgZm9yICggaSA9IGxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICAgICAgaWYgKCBsaXN0WyBpIF0ubGlzdGVuZXIgPT09IGxpc3RlbmVyICYmIGxpc3RbIGkgXS5hY3RpdmUgKSB7XG4gICAgICAgICAgICBsaXN0WyBpIF0uYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI29uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIHR5cGVcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXJcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb246IGZ1bmN0aW9uIG9uICggdHlwZSwgbGlzdGVuZXIgKSB7XG4gICAgX29uKCB0aGlzLCB0eXBlLCBsaXN0ZW5lciApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIExpZ2h0RW1pdHRlciNvbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIHR5cGVcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXJcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb25jZTogZnVuY3Rpb24gb25jZSAoIHR5cGUsIGxpc3RlbmVyICkge1xuICAgIF9vbiggdGhpcywgdHlwZSwgbGlzdGVuZXIsIHRydWUgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb25zdHJ1Y3RvcjogTGlnaHRFbWl0dGVyXG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIF9vblxuICogQHBhcmFtICB7TGlnaHRFbWl0dGVyfSBzZWxmXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgIHR5cGVcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSAgICAgbGlzdGVuZXJcbiAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgb25jZVxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gX29uICggc2VsZiwgdHlwZSwgbGlzdGVuZXIsIG9uY2UgKSB7XG4gIHZhciBlbnRpdHkgPSB7XG4gICAgbGlzdGVuZXI6IGxpc3RlbmVyLFxuICAgIGFjdGl2ZTogICB0cnVlLFxuICAgIHR5cGU6ICAgICB0eXBlLFxuICAgIG9uY2U6ICAgICBvbmNlXG4gIH07XG5cbiAgaWYgKCAhIHNlbGYuX2V2ZW50cyApIHtcbiAgICBzZWxmLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKCBudWxsICk7XG4gIH1cblxuICBpZiAoICEgc2VsZi5fZXZlbnRzWyB0eXBlIF0gKSB7XG4gICAgc2VsZi5fZXZlbnRzWyB0eXBlIF0gPSBbXTtcbiAgfVxuXG4gIHNlbGYuX2V2ZW50c1sgdHlwZSBdLnB1c2goIGVudGl0eSApO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIF9nZXRMaXN0XG4gKiBAcGFyYW0gIHtMaWdodEVtaXR0ZXJ9ICAgc2VsZlxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgIHR5cGVcbiAqIEByZXR1cm4ge2FycmF5PG9iamVjdD4/fVxuICovXG5mdW5jdGlvbiBfZ2V0TGlzdCAoIHNlbGYsIHR5cGUgKSB7XG4gIHJldHVybiBzZWxmLl9ldmVudHMgJiYgc2VsZi5fZXZlbnRzWyB0eXBlIF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGlnaHRFbWl0dGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF90aHJvd0FyZ3VtZW50RXhjZXB0aW9uICggdW5leHBlY3RlZCwgZXhwZWN0ZWQgKSB7XG4gIHRocm93IEVycm9yKCAnXCInICsgdG9TdHJpbmcuY2FsbCggdW5leHBlY3RlZCApICsgJ1wiIGlzIG5vdCAnICsgZXhwZWN0ZWQgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0eXBlID0gcmVxdWlyZSggJy4vdHlwZScgKTtcbnZhciBsYXN0UmVzID0gJ3VuZGVmaW5lZCc7XG52YXIgbGFzdFZhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfdHlwZSAoIHZhbCApIHtcbiAgaWYgKCB2YWwgPT09IGxhc3RWYWwgKSB7XG4gICAgcmV0dXJuIGxhc3RSZXM7XG4gIH1cblxuICByZXR1cm4gKCBsYXN0UmVzID0gdHlwZSggbGFzdFZhbCA9IHZhbCApICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF91bmVzY2FwZSAoIHN0cmluZyApIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKCAvXFxcXChcXFxcKT8vZywgJyQxJyApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzc2V0ID0gcmVxdWlyZSggJy4uL2lzc2V0JyApO1xuXG52YXIgdW5kZWZpbmVkOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG5cbnZhciBkZWZpbmVHZXR0ZXIgPSBPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lR2V0dGVyX18sXG4gICAgZGVmaW5lU2V0dGVyID0gT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZVNldHRlcl9fO1xuXG5mdW5jdGlvbiBiYXNlRGVmaW5lUHJvcGVydHkgKCBvYmplY3QsIGtleSwgZGVzY3JpcHRvciApIHtcbiAgdmFyIGhhc0dldHRlciA9IGlzc2V0KCAnZ2V0JywgZGVzY3JpcHRvciApLFxuICAgICAgaGFzU2V0dGVyID0gaXNzZXQoICdzZXQnLCBkZXNjcmlwdG9yICksXG4gICAgICBnZXQsIHNldDtcblxuICBpZiAoIGhhc0dldHRlciB8fCBoYXNTZXR0ZXIgKSB7XG4gICAgaWYgKCBoYXNHZXR0ZXIgJiYgdHlwZW9mICggZ2V0ID0gZGVzY3JpcHRvci5nZXQgKSAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ0dldHRlciBtdXN0IGJlIGEgZnVuY3Rpb246ICcgKyBnZXQgKTtcbiAgICB9XG5cbiAgICBpZiAoIGhhc1NldHRlciAmJiB0eXBlb2YgKCBzZXQgPSBkZXNjcmlwdG9yLnNldCApICE9PSAnZnVuY3Rpb24nICkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnU2V0dGVyIG11c3QgYmUgYSBmdW5jdGlvbjogJyArIHNldCApO1xuICAgIH1cblxuICAgIGlmICggaXNzZXQoICd3cml0YWJsZScsIGRlc2NyaXB0b3IgKSApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ0ludmFsaWQgcHJvcGVydHkgZGVzY3JpcHRvci4gQ2Fubm90IGJvdGggc3BlY2lmeSBhY2Nlc3NvcnMgYW5kIGEgdmFsdWUgb3Igd3JpdGFibGUgYXR0cmlidXRlJyApO1xuICAgIH1cblxuICAgIGlmICggZGVmaW5lR2V0dGVyICkge1xuICAgICAgaWYgKCBoYXNHZXR0ZXIgKSB7XG4gICAgICAgIGRlZmluZUdldHRlci5jYWxsKCBvYmplY3QsIGtleSwgZ2V0ICk7XG4gICAgICB9XG5cbiAgICAgIGlmICggaGFzU2V0dGVyICkge1xuICAgICAgICBkZWZpbmVTZXR0ZXIuY2FsbCggb2JqZWN0LCBrZXksIHNldCApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBkZWZpbmUgZ2V0dGVyIG9yIHNldHRlcicgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoIGlzc2V0KCAndmFsdWUnLCBkZXNjcmlwdG9yICkgKSB7XG4gICAgb2JqZWN0WyBrZXkgXSA9IGRlc2NyaXB0b3IudmFsdWU7XG4gIH0gZWxzZSBpZiAoICEgaXNzZXQoIGtleSwgb2JqZWN0ICkgKSB7XG4gICAgb2JqZWN0WyBrZXkgXSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiBvYmplY3Q7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZURlZmluZVByb3BlcnR5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VFeGVjICggcmVnZXhwLCBzdHJpbmcgKSB7XG4gIHZhciByZXN1bHQgPSBbXSxcbiAgICAgIHZhbHVlO1xuXG4gIHJlZ2V4cC5sYXN0SW5kZXggPSAwO1xuXG4gIHdoaWxlICggKCB2YWx1ZSA9IHJlZ2V4cC5leGVjKCBzdHJpbmcgKSApICkge1xuICAgIHJlc3VsdC5wdXNoKCB2YWx1ZSApO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYWxsSXRlcmF0ZWUgPSByZXF1aXJlKCAnLi4vY2FsbC1pdGVyYXRlZScgKSxcbiAgICBpc3NldCAgICAgICAgPSByZXF1aXJlKCAnLi4vaXNzZXQnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZUZvckVhY2ggKCBhcnIsIGZuLCBjdHgsIGZyb21SaWdodCApIHtcbiAgdmFyIGksIGosIGlkeDtcblxuICBmb3IgKCBpID0gLTEsIGogPSBhcnIubGVuZ3RoIC0gMTsgaiA+PSAwOyAtLWogKSB7XG4gICAgaWYgKCBmcm9tUmlnaHQgKSB7XG4gICAgICBpZHggPSBqO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZHggPSArK2k7XG4gICAgfVxuXG4gICAgaWYgKCBpc3NldCggaWR4LCBhcnIgKSAmJiBjYWxsSXRlcmF0ZWUoIGZuLCBjdHgsIGFyclsgaWR4IF0sIGlkeCwgYXJyICkgPT09IGZhbHNlICkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFycjtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYWxsSXRlcmF0ZWUgPSByZXF1aXJlKCAnLi4vY2FsbC1pdGVyYXRlZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlRm9ySW4gKCBvYmosIGZuLCBjdHgsIGZyb21SaWdodCwga2V5cyApIHtcbiAgdmFyIGksIGosIGtleTtcblxuICBmb3IgKCBpID0gLTEsIGogPSBrZXlzLmxlbmd0aCAtIDE7IGogPj0gMDsgLS1qICkge1xuICAgIGlmICggZnJvbVJpZ2h0ICkge1xuICAgICAga2V5ID0ga2V5c1sgaiBdO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXkgPSBrZXlzWyArK2kgXTtcbiAgICB9XG5cbiAgICBpZiAoIGNhbGxJdGVyYXRlZSggZm4sIGN0eCwgb2JqWyBrZXkgXSwga2V5LCBvYmogKSA9PT0gZmFsc2UgKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzc2V0ID0gcmVxdWlyZSggJy4uL2lzc2V0JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VHZXQgKCBvYmosIHBhdGgsIG9mZiApIHtcbiAgdmFyIGwgPSBwYXRoLmxlbmd0aCAtIG9mZixcbiAgICAgIGkgPSAwLFxuICAgICAga2V5O1xuXG4gIGZvciAoIDsgaSA8IGw7ICsraSApIHtcbiAgICBrZXkgPSBwYXRoWyBpIF07XG5cbiAgICBpZiAoIGlzc2V0KCBrZXksIG9iaiApICkge1xuICAgICAgb2JqID0gb2JqWyBrZXkgXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmFzZVRvSW5kZXggPSByZXF1aXJlKCAnLi9iYXNlLXRvLWluZGV4JyApO1xuXG52YXIgaW5kZXhPZiAgICAgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZixcbiAgICBsYXN0SW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZjtcblxuZnVuY3Rpb24gYmFzZUluZGV4T2YgKCBhcnIsIHNlYXJjaCwgZnJvbUluZGV4LCBmcm9tUmlnaHQgKSB7XG4gIHZhciBsLCBpLCBqLCBpZHgsIHZhbDtcblxuICAvLyB1c2UgdGhlIG5hdGl2ZSBmdW5jdGlvbiBpZiBpdCBpcyBzdXBwb3J0ZWQgYW5kIHRoZSBzZWFyY2ggaXMgbm90IG5hbi5cblxuICBpZiAoIHNlYXJjaCA9PT0gc2VhcmNoICYmICggaWR4ID0gZnJvbVJpZ2h0ID8gbGFzdEluZGV4T2YgOiBpbmRleE9mICkgKSB7XG4gICAgcmV0dXJuIGlkeC5jYWxsKCBhcnIsIHNlYXJjaCwgZnJvbUluZGV4ICk7XG4gIH1cblxuICBsID0gYXJyLmxlbmd0aDtcblxuICBpZiAoICEgbCApIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICBqID0gbCAtIDE7XG5cbiAgaWYgKCB0eXBlb2YgZnJvbUluZGV4ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICBmcm9tSW5kZXggPSBiYXNlVG9JbmRleCggZnJvbUluZGV4LCBsICk7XG5cbiAgICBpZiAoIGZyb21SaWdodCApIHtcbiAgICAgIGogPSBNYXRoLm1pbiggaiwgZnJvbUluZGV4ICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGogPSBNYXRoLm1heCggMCwgZnJvbUluZGV4ICk7XG4gICAgfVxuXG4gICAgaSA9IGogLSAxO1xuICB9IGVsc2Uge1xuICAgIGkgPSAtMTtcbiAgfVxuXG4gIGZvciAoIDsgaiA+PSAwOyAtLWogKSB7XG4gICAgaWYgKCBmcm9tUmlnaHQgKSB7XG4gICAgICBpZHggPSBqO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZHggPSArK2k7XG4gICAgfVxuXG4gICAgdmFsID0gYXJyWyBpZHggXTtcblxuICAgIGlmICggdmFsID09PSBzZWFyY2ggfHwgc2VhcmNoICE9PSBzZWFyY2ggJiYgdmFsICE9PSB2YWwgKSB7XG4gICAgICByZXR1cm4gaWR4O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlSW5kZXhPZjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJhc2VJbmRleE9mID0gcmVxdWlyZSggJy4vYmFzZS1pbmRleC1vZicgKTtcblxudmFyIHN1cHBvcnQgPSByZXF1aXJlKCAnLi4vc3VwcG9ydC9zdXBwb3J0LWtleXMnICk7XG5cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbnZhciBrLCBmaXhLZXlzO1xuXG5pZiAoIHN1cHBvcnQgPT09ICdub3Qtc3VwcG9ydGVkJyApIHtcbiAgayA9IFtcbiAgICAndG9TdHJpbmcnLFxuICAgICd0b0xvY2FsZVN0cmluZycsXG4gICAgJ3ZhbHVlT2YnLFxuICAgICdoYXNPd25Qcm9wZXJ0eScsXG4gICAgJ2lzUHJvdG90eXBlT2YnLFxuICAgICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsXG4gICAgJ2NvbnN0cnVjdG9yJ1xuICBdO1xuXG4gIGZpeEtleXMgPSBmdW5jdGlvbiBmaXhLZXlzICgga2V5cywgb2JqZWN0ICkge1xuICAgIHZhciBpLCBrZXk7XG5cbiAgICBmb3IgKCBpID0gay5sZW5ndGggLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgIGlmICggYmFzZUluZGV4T2YoIGtleXMsIGtleSA9IGtbIGkgXSApIDwgMCAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKCBvYmplY3QsIGtleSApICkge1xuICAgICAgICBrZXlzLnB1c2goIGtleSApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBrZXlzO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VLZXlzICggb2JqZWN0ICkge1xuICB2YXIga2V5cyA9IFtdO1xuXG4gIHZhciBrZXk7XG5cbiAgZm9yICgga2V5IGluIG9iamVjdCApIHtcbiAgICBpZiAoIGhhc093blByb3BlcnR5LmNhbGwoIG9iamVjdCwga2V5ICkgKSB7XG4gICAgICBrZXlzLnB1c2goIGtleSApO1xuICAgIH1cbiAgfVxuXG4gIGlmICggc3VwcG9ydCAhPT0gJ25vdC1zdXBwb3J0ZWQnICkge1xuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgcmV0dXJuIGZpeEtleXMoIGtleXMsIG9iamVjdCApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldCA9IHJlcXVpcmUoICcuL2Jhc2UtZ2V0JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VQcm9wZXJ0eSAoIG9iamVjdCwgcGF0aCApIHtcbiAgaWYgKCBvYmplY3QgIT0gbnVsbCApIHtcbiAgICBpZiAoIHBhdGgubGVuZ3RoID4gMSApIHtcbiAgICAgIHJldHVybiBnZXQoIG9iamVjdCwgcGF0aCwgMCApO1xuICAgIH1cblxuICAgIHJldHVybiBvYmplY3RbIHBhdGhbIDAgXSBdO1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VUb0luZGV4ICggdiwgbCApIHtcbiAgaWYgKCAhIGwgfHwgISB2ICkge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgaWYgKCB2IDwgMCApIHtcbiAgICB2ICs9IGw7XG4gIH1cblxuICByZXR1cm4gdiB8fCAwO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF90aHJvd0FyZ3VtZW50RXhjZXB0aW9uID0gcmVxdWlyZSggJy4vX3Rocm93LWFyZ3VtZW50LWV4Y2VwdGlvbicgKTtcbnZhciBkZWZhdWx0VG8gPSByZXF1aXJlKCAnLi9kZWZhdWx0LXRvJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJlZm9yZSAoIG4sIGZuICkge1xuICB2YXIgdmFsdWU7XG5cbiAgaWYgKCB0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicgKSB7XG4gICAgX3Rocm93QXJndW1lbnRFeGNlcHRpb24oIGZuLCAnYSBmdW5jdGlvbicgKTtcbiAgfVxuXG4gIG4gPSBkZWZhdWx0VG8oIG4sIDEgKTtcblxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGlmICggLS1uID49IDAgKSB7XG4gICAgICB2YWx1ZSA9IGZuLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNhbGxJdGVyYXRlZSAoIGZuLCBjdHgsIHZhbCwga2V5LCBvYmogKSB7XG4gIGlmICggdHlwZW9mIGN0eCA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgcmV0dXJuIGZuKCB2YWwsIGtleSwgb2JqICk7XG4gIH1cblxuICByZXR1cm4gZm4uY2FsbCggY3R4LCB2YWwsIGtleSwgb2JqICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmFzZUV4ZWMgID0gcmVxdWlyZSggJy4vYmFzZS9iYXNlLWV4ZWMnICksXG4gICAgX3VuZXNjYXBlID0gcmVxdWlyZSggJy4vX3VuZXNjYXBlJyApLFxuICAgIGlzS2V5ICAgICA9IHJlcXVpcmUoICcuL2lzLWtleScgKSxcbiAgICB0b0tleSAgICAgPSByZXF1aXJlKCAnLi90by1rZXknICksXG4gICAgX3R5cGUgICAgID0gcmVxdWlyZSggJy4vX3R5cGUnICk7XG5cbnZhciByUHJvcGVydHkgPSAvKF58XFwuKVxccyooW19hLXpdXFx3KilcXHMqfFxcW1xccyooKD86LSk/KD86XFxkK3xcXGQqXFwuXFxkKyl8KFwifCcpKChbXlxcXFxdXFxcXChcXFxcXFxcXCkqfFteXFw0XSkqKVxcNClcXHMqXFxdL2dpO1xuXG5mdW5jdGlvbiBzdHJpbmdUb1BhdGggKCBzdHIgKSB7XG4gIHZhciBwYXRoID0gYmFzZUV4ZWMoIHJQcm9wZXJ0eSwgc3RyICksXG4gICAgICBpID0gcGF0aC5sZW5ndGggLSAxLFxuICAgICAgdmFsO1xuXG4gIGZvciAoIDsgaSA+PSAwOyAtLWkgKSB7XG4gICAgdmFsID0gcGF0aFsgaSBdO1xuXG4gICAgLy8gLm5hbWVcbiAgICBpZiAoIHZhbFsgMiBdICkge1xuICAgICAgcGF0aFsgaSBdID0gdmFsWyAyIF07XG4gICAgLy8gWyBcIlwiIF0gfHwgWyAnJyBdXG4gICAgfSBlbHNlIGlmICggdmFsWyA1IF0gIT0gbnVsbCApIHtcbiAgICAgIHBhdGhbIGkgXSA9IF91bmVzY2FwZSggdmFsWyA1IF0gKTtcbiAgICAvLyBbIDAgXVxuICAgIH0gZWxzZSB7XG4gICAgICBwYXRoWyBpIF0gPSB2YWxbIDMgXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGF0aDtcbn1cblxuZnVuY3Rpb24gY2FzdFBhdGggKCB2YWwgKSB7XG4gIHZhciBwYXRoLCBsLCBpO1xuXG4gIGlmICggaXNLZXkoIHZhbCApICkge1xuICAgIHJldHVybiBbIHRvS2V5KCB2YWwgKSBdO1xuICB9XG5cbiAgaWYgKCBfdHlwZSggdmFsICkgPT09ICdhcnJheScgKSB7XG4gICAgcGF0aCA9IEFycmF5KCBsID0gdmFsLmxlbmd0aCApO1xuXG4gICAgZm9yICggaSA9IGwgLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgIHBhdGhbIGkgXSA9IHRvS2V5KCB2YWxbIGkgXSApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwYXRoID0gc3RyaW5nVG9QYXRoKCAnJyArIHZhbCApO1xuICB9XG5cbiAgcmV0dXJuIHBhdGg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2FzdFBhdGg7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xhbXAgKCB2YWx1ZSwgbG93ZXIsIHVwcGVyICkge1xuICBpZiAoIHZhbHVlID49IHVwcGVyICkge1xuICAgIHJldHVybiB1cHBlcjtcbiAgfVxuXG4gIGlmICggdmFsdWUgPD0gbG93ZXIgKSB7XG4gICAgcmV0dXJuIGxvd2VyO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNyZWF0ZSAgICAgICAgID0gcmVxdWlyZSggJy4vY3JlYXRlJyApLFxuICAgIGdldFByb3RvdHlwZU9mID0gcmVxdWlyZSggJy4vZ2V0LXByb3RvdHlwZS1vZicgKSxcbiAgICB0b09iamVjdCAgICAgICA9IHJlcXVpcmUoICcuL3RvLW9iamVjdCcgKSxcbiAgICBlYWNoICAgICAgICAgICA9IHJlcXVpcmUoICcuL2VhY2gnICksXG4gICAgaXNPYmplY3RMaWtlICAgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QtbGlrZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjbG9uZSAoIGRlZXAsIHRhcmdldCwgZ3VhcmQgKSB7XG4gIHZhciBjbG47XG5cbiAgaWYgKCB0eXBlb2YgdGFyZ2V0ID09PSAndW5kZWZpbmVkJyB8fCBndWFyZCApIHtcbiAgICB0YXJnZXQgPSBkZWVwO1xuICAgIGRlZXAgPSB0cnVlO1xuICB9XG5cbiAgY2xuID0gY3JlYXRlKCBnZXRQcm90b3R5cGVPZiggdGFyZ2V0ID0gdG9PYmplY3QoIHRhcmdldCApICkgKTtcblxuICBlYWNoKCB0YXJnZXQsIGZ1bmN0aW9uICggdmFsdWUsIGtleSwgdGFyZ2V0ICkge1xuICAgIGlmICggdmFsdWUgPT09IHRhcmdldCApIHtcbiAgICAgIHRoaXNbIGtleSBdID0gdGhpcztcbiAgICB9IGVsc2UgaWYgKCBkZWVwICYmIGlzT2JqZWN0TGlrZSggdmFsdWUgKSApIHtcbiAgICAgIHRoaXNbIGtleSBdID0gY2xvbmUoIGRlZXAsIHZhbHVlICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXNbIGtleSBdID0gdmFsdWU7XG4gICAgfVxuICB9LCBjbG4gKTtcblxuICByZXR1cm4gY2xuO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEVSUjoge1xuICAgIElOVkFMSURfQVJHUzogICAgICAgICAgJ0ludmFsaWQgYXJndW1lbnRzJyxcbiAgICBGVU5DVElPTl9FWFBFQ1RFRDogICAgICdFeHBlY3RlZCBhIGZ1bmN0aW9uJyxcbiAgICBTVFJJTkdfRVhQRUNURUQ6ICAgICAgICdFeHBlY3RlZCBhIHN0cmluZycsXG4gICAgVU5ERUZJTkVEX09SX05VTEw6ICAgICAnQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0JyxcbiAgICBSRURVQ0VfT0ZfRU1QVFlfQVJSQVk6ICdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJyxcbiAgICBOT19QQVRIOiAgICAgICAgICAgICAgICdObyBwYXRoIHdhcyBnaXZlbidcbiAgfSxcblxuICBNQVhfQVJSQVlfTEVOR1RIOiA0Mjk0OTY3Mjk1LFxuICBNQVhfU0FGRV9JTlQ6ICAgICA5MDA3MTk5MjU0NzQwOTkxLFxuICBNSU5fU0FGRV9JTlQ6ICAgIC05MDA3MTk5MjU0NzQwOTkxLFxuXG4gIERFRVA6ICAgICAgICAgMSxcbiAgREVFUF9LRUVQX0ZOOiAyLFxuXG4gIFBMQUNFSE9MREVSOiB7fVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmluZVByb3BlcnRpZXMgPSByZXF1aXJlKCAnLi9kZWZpbmUtcHJvcGVydGllcycgKTtcblxudmFyIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZSggJy4vc2V0LXByb3RvdHlwZS1vZicgKTtcblxudmFyIGlzUHJpbWl0aXZlID0gcmVxdWlyZSggJy4vaXMtcHJpbWl0aXZlJyApO1xuXG5mdW5jdGlvbiBDICgpIHt9XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiBjcmVhdGUgKCBwcm90b3R5cGUsIGRlc2NyaXB0b3JzICkge1xuICB2YXIgb2JqZWN0O1xuXG4gIGlmICggcHJvdG90eXBlICE9PSBudWxsICYmIGlzUHJpbWl0aXZlKCBwcm90b3R5cGUgKSApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoICdPYmplY3QgcHJvdG90eXBlIG1heSBvbmx5IGJlIGFuIE9iamVjdCBvciBudWxsOiAnICsgcHJvdG90eXBlICk7XG4gIH1cblxuICBDLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcblxuICBvYmplY3QgPSBuZXcgQygpO1xuXG4gIEMucHJvdG90eXBlID0gbnVsbDtcblxuICBpZiAoIHByb3RvdHlwZSA9PT0gbnVsbCApIHtcbiAgICBzZXRQcm90b3R5cGVPZiggb2JqZWN0LCBudWxsICk7XG4gIH1cblxuICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPj0gMiApIHtcbiAgICBkZWZpbmVQcm9wZXJ0aWVzKCBvYmplY3QsIGRlc2NyaXB0b3JzICk7XG4gIH1cblxuICByZXR1cm4gb2JqZWN0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJhc2VGb3JFYWNoICA9IHJlcXVpcmUoICcuLi9iYXNlL2Jhc2UtZm9yLWVhY2gnICksXG4gICAgYmFzZUZvckluICAgID0gcmVxdWlyZSggJy4uL2Jhc2UvYmFzZS1mb3ItaW4nICksXG4gICAgaXNBcnJheUxpa2UgID0gcmVxdWlyZSggJy4uL2lzLWFycmF5LWxpa2UnICksXG4gICAgdG9PYmplY3QgICAgID0gcmVxdWlyZSggJy4uL3RvLW9iamVjdCcgKSxcbiAgICBpdGVyYXRlZSAgICAgPSByZXF1aXJlKCAnLi4vaXRlcmF0ZWUnICkuaXRlcmF0ZWUsXG4gICAga2V5cyAgICAgICAgID0gcmVxdWlyZSggJy4uL2tleXMnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlRWFjaCAoIGZyb21SaWdodCApIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGVhY2ggKCBvYmosIGZuLCBjdHggKSB7XG5cbiAgICBvYmogPSB0b09iamVjdCggb2JqICk7XG5cbiAgICBmbiAgPSBpdGVyYXRlZSggZm4gKTtcblxuICAgIGlmICggaXNBcnJheUxpa2UoIG9iaiApICkge1xuICAgICAgcmV0dXJuIGJhc2VGb3JFYWNoKCBvYmosIGZuLCBjdHgsIGZyb21SaWdodCApO1xuICAgIH1cblxuICAgIHJldHVybiBiYXNlRm9ySW4oIG9iaiwgZm4sIGN0eCwgZnJvbVJpZ2h0LCBrZXlzKCBvYmogKSApO1xuXG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE11c3QgYmUgJ1dpZHRoJyBvciAnSGVpZ2h0JyAoY2FwaXRhbGl6ZWQpLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUdldEVsZW1lbnREaW1lbnNpb24gKCBuYW1lICkge1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1dpbmRvd3xOb2RlfSBlXG4gICAqL1xuICByZXR1cm4gZnVuY3Rpb24gKCBlICkge1xuXG4gICAgdmFyIHYsIGIsIGQ7XG5cbiAgICAvLyBpZiB0aGUgZWxlbWVudCBpcyBhIHdpbmRvd1xuXG4gICAgaWYgKCBlLndpbmRvdyA9PT0gZSApIHtcblxuICAgICAgLy8gaW5uZXJXaWR0aCBhbmQgaW5uZXJIZWlnaHQgaW5jbHVkZXMgYSBzY3JvbGxiYXIgd2lkdGgsIGJ1dCBpdCBpcyBub3RcbiAgICAgIC8vIHN1cHBvcnRlZCBieSBvbGRlciBicm93c2Vyc1xuXG4gICAgICB2ID0gTWF0aC5tYXgoIGVbICdpbm5lcicgKyBuYW1lIF0gfHwgMCwgZS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnRbICdjbGllbnQnICsgbmFtZSBdICk7XG5cbiAgICAvLyBpZiB0aGUgZWxlbWVudHMgaXMgYSBkb2N1bWVudFxuXG4gICAgfSBlbHNlIGlmICggZS5ub2RlVHlwZSA9PT0gOSApIHtcblxuICAgICAgYiA9IGUuYm9keTtcbiAgICAgIGQgPSBlLmRvY3VtZW50RWxlbWVudDtcblxuICAgICAgdiA9IE1hdGgubWF4KFxuICAgICAgICBiWyAnc2Nyb2xsJyArIG5hbWUgXSxcbiAgICAgICAgZFsgJ3Njcm9sbCcgKyBuYW1lIF0sXG4gICAgICAgIGJbICdvZmZzZXQnICsgbmFtZSBdLFxuICAgICAgICBkWyAnb2Zmc2V0JyArIG5hbWUgXSxcbiAgICAgICAgYlsgJ2NsaWVudCcgKyBuYW1lIF0sXG4gICAgICAgIGRbICdjbGllbnQnICsgbmFtZSBdICk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdiA9IGVbICdjbGllbnQnICsgbmFtZSBdO1xuICAgIH1cblxuICAgIHJldHVybiB2O1xuXG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2FzdFBhdGggPSByZXF1aXJlKCAnLi4vY2FzdC1wYXRoJyApLFxuICAgIG5vb3AgICAgID0gcmVxdWlyZSggJy4uL25vb3AnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlUHJvcGVydHkgKCBiYXNlUHJvcGVydHksIHVzZUFyZ3MgKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoIHBhdGggKSB7XG4gICAgdmFyIGFyZ3M7XG5cbiAgICBpZiAoICEgKCBwYXRoID0gY2FzdFBhdGgoIHBhdGggKSApLmxlbmd0aCApIHtcbiAgICAgIHJldHVybiBub29wO1xuICAgIH1cblxuICAgIGlmICggdXNlQXJncyApIHtcbiAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICggb2JqZWN0ICkge1xuICAgICAgcmV0dXJuIGJhc2VQcm9wZXJ0eSggb2JqZWN0LCBwYXRoLCBhcmdzICk7XG4gICAgfTtcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVmYXVsdFRvICggdmFsdWUsIGRlZmF1bHRWYWx1ZSApIHtcbiAgaWYgKCB2YWx1ZSAhPSBudWxsICYmIHZhbHVlID09PSB2YWx1ZSApIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gZGVmYXVsdFZhbHVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1peGluID0gcmVxdWlyZSggJy4vbWl4aW4nICksXG4gICAgY2xvbmUgPSByZXF1aXJlKCAnLi9jbG9uZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWZhdWx0cyAoIGRlZmF1bHRzLCBvYmplY3QgKSB7XG4gIGlmICggb2JqZWN0ID09IG51bGwgKSB7XG4gICAgcmV0dXJuIGNsb25lKCB0cnVlLCBkZWZhdWx0cyApO1xuICB9XG5cbiAgcmV0dXJuIG1peGluKCB0cnVlLCBjbG9uZSggdHJ1ZSwgZGVmYXVsdHMgKSwgb2JqZWN0ICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3VwcG9ydCA9IHJlcXVpcmUoICcuL3N1cHBvcnQvc3VwcG9ydC1kZWZpbmUtcHJvcGVydHknICk7XG5cbnZhciBkZWZpbmVQcm9wZXJ0aWVzLCBiYXNlRGVmaW5lUHJvcGVydHksIGlzUHJpbWl0aXZlLCBlYWNoO1xuXG5pZiAoIHN1cHBvcnQgIT09ICdmdWxsJyApIHtcbiAgaXNQcmltaXRpdmUgICAgICAgID0gcmVxdWlyZSggJy4vaXMtcHJpbWl0aXZlJyApO1xuICBlYWNoICAgICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9lYWNoJyApO1xuICBiYXNlRGVmaW5lUHJvcGVydHkgPSByZXF1aXJlKCAnLi9iYXNlL2Jhc2UtZGVmaW5lLXByb3BlcnR5JyApO1xuXG4gIGRlZmluZVByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzICggb2JqZWN0LCBkZXNjcmlwdG9ycyApIHtcbiAgICBpZiAoIHN1cHBvcnQgIT09ICdub3Qtc3VwcG9ydGVkJyApIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydGllcyggb2JqZWN0LCBkZXNjcmlwdG9ycyApO1xuICAgICAgfSBjYXRjaCAoIGUgKSB7fVxuICAgIH1cblxuICAgIGlmICggaXNQcmltaXRpdmUoIG9iamVjdCApICkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnZGVmaW5lUHJvcGVydGllcyBjYWxsZWQgb24gbm9uLW9iamVjdCcgKTtcbiAgICB9XG5cbiAgICBpZiAoIGlzUHJpbWl0aXZlKCBkZXNjcmlwdG9ycyApICkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnUHJvcGVydHkgZGVzY3JpcHRpb24gbXVzdCBiZSBhbiBvYmplY3Q6ICcgKyBkZXNjcmlwdG9ycyApO1xuICAgIH1cblxuICAgIGVhY2goIGRlc2NyaXB0b3JzLCBmdW5jdGlvbiAoIGRlc2NyaXB0b3IsIGtleSApIHtcbiAgICAgIGlmICggaXNQcmltaXRpdmUoIGRlc2NyaXB0b3IgKSApIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCAnUHJvcGVydHkgZGVzY3JpcHRpb24gbXVzdCBiZSBhbiBvYmplY3Q6ICcgKyBkZXNjcmlwdG9yICk7XG4gICAgICB9XG5cbiAgICAgIGJhc2VEZWZpbmVQcm9wZXJ0eSggdGhpcywga2V5LCBkZXNjcmlwdG9yICk7XG4gICAgfSwgb2JqZWN0ICk7XG5cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9O1xufSBlbHNlIHtcbiAgZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmluZVByb3BlcnRpZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSggJy4vY3JlYXRlL2NyZWF0ZS1lYWNoJyApKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSggJy4vY3JlYXRlL2NyZWF0ZS1nZXQtZWxlbWVudC1kaW1lbnNpb24nICkoICdIZWlnaHQnICk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSggJy4vY3JlYXRlL2NyZWF0ZS1nZXQtZWxlbWVudC1kaW1lbnNpb24nICkoICdXaWR0aCcgKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEVSUiA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5FUlI7XG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIGdldFByb3RvdHlwZU9mICggb2JqICkge1xuICB2YXIgcHJvdG90eXBlO1xuXG4gIGlmICggb2JqID09IG51bGwgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCBFUlIuVU5ERUZJTkVEX09SX05VTEwgKTtcbiAgfVxuXG4gIHByb3RvdHlwZSA9IG9iai5fX3Byb3RvX187IC8vIGpzaGludCBpZ25vcmU6IGxpbmVcblxuICBpZiAoIHR5cGVvZiBwcm90b3R5cGUgIT09ICd1bmRlZmluZWQnICkge1xuICAgIHJldHVybiBwcm90b3R5cGU7XG4gIH1cblxuICBpZiAoIHRvU3RyaW5nLmNhbGwoIG9iai5jb25zdHJ1Y3RvciApID09PSAnW29iamVjdCBGdW5jdGlvbl0nICkge1xuICAgIHJldHVybiBvYmouY29uc3RydWN0b3IucHJvdG90eXBlO1xuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QtbGlrZScgKSxcbiAgICBpc0xlbmd0aCAgICAgPSByZXF1aXJlKCAnLi9pcy1sZW5ndGgnICksXG4gICAgaXNXaW5kb3dMaWtlID0gcmVxdWlyZSggJy4vaXMtd2luZG93LWxpa2UnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBcnJheUxpa2VPYmplY3QgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSggdmFsdWUgKSAmJiBpc0xlbmd0aCggdmFsdWUubGVuZ3RoICkgJiYgISBpc1dpbmRvd0xpa2UoIHZhbHVlICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNMZW5ndGggICAgID0gcmVxdWlyZSggJy4vaXMtbGVuZ3RoJyApLFxuICAgIGlzV2luZG93TGlrZSA9IHJlcXVpcmUoICcuL2lzLXdpbmRvdy1saWtlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQXJyYXlMaWtlICggdmFsdWUgKSB7XG4gIGlmICggdmFsdWUgPT0gbnVsbCApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgKSB7XG4gICAgcmV0dXJuIGlzTGVuZ3RoKCB2YWx1ZS5sZW5ndGggKSAmJiAhaXNXaW5kb3dMaWtlKCB2YWx1ZSApO1xuICB9XG5cbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZyc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCAnLi9pcy1sZW5ndGgnICk7XG5cbnZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gaXNBcnJheSAoIHZhbHVlICkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKCB2YWx1ZSApICYmXG4gICAgaXNMZW5ndGgoIHZhbHVlLmxlbmd0aCApICYmXG4gICAgdG9TdHJpbmcuY2FsbCggdmFsdWUgKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfdHlwZSAgICA9IHJlcXVpcmUoICcuL190eXBlJyApO1xuXG52YXIgckRlZXBLZXkgPSAvKF58W15cXFxcXSkoXFxcXFxcXFwpKihcXC58XFxbKS87XG5cbmZ1bmN0aW9uIGlzS2V5ICggdmFsICkge1xuICB2YXIgdHlwZTtcblxuICBpZiAoICEgdmFsICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKCBfdHlwZSggdmFsICkgPT09ICdhcnJheScgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdHlwZSA9IHR5cGVvZiB2YWw7XG5cbiAgaWYgKCB0eXBlID09PSAnbnVtYmVyJyB8fCB0eXBlID09PSAnYm9vbGVhbicgfHwgX3R5cGUoIHZhbCApID09PSAnc3ltYm9sJyApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiAhIHJEZWVwS2V5LnRlc3QoIHZhbCApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzS2V5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTUFYX0FSUkFZX0xFTkdUSCA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5NQVhfQVJSQVlfTEVOR1RIO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzTGVuZ3RoICggdmFsdWUgKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmXG4gICAgdmFsdWUgPj0gMCAmJlxuICAgIHZhbHVlIDw9IE1BWF9BUlJBWV9MRU5HVEggJiZcbiAgICB2YWx1ZSAlIDEgPT09IDA7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzT2JqZWN0TGlrZSAoIHZhbHVlICkge1xuICByZXR1cm4gISEgdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QtbGlrZScgKTtcblxudmFyIHRvU3RyaW5nID0ge30udG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNPYmplY3QgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSggdmFsdWUgKSAmJlxuICAgIHRvU3RyaW5nLmNhbGwoIHZhbHVlICkgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFByb3RvdHlwZU9mID0gcmVxdWlyZSggJy4vZ2V0LXByb3RvdHlwZS1vZicgKTtcblxudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0JyApO1xuXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgdG9TdHJpbmcgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG5cbnZhciBPQkpFQ1QgPSB0b1N0cmluZy5jYWxsKCBPYmplY3QgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1BsYWluT2JqZWN0ICggdiApIHtcbiAgdmFyIHAsIGM7XG5cbiAgaWYgKCAhIGlzT2JqZWN0KCB2ICkgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcCA9IGdldFByb3RvdHlwZU9mKCB2ICk7XG5cbiAgaWYgKCBwID09PSBudWxsICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKCAhIGhhc093blByb3BlcnR5LmNhbGwoIHAsICdjb25zdHJ1Y3RvcicgKSApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjID0gcC5jb25zdHJ1Y3RvcjtcblxuICByZXR1cm4gdHlwZW9mIGMgPT09ICdmdW5jdGlvbicgJiYgdG9TdHJpbmcuY2FsbCggYyApID09PSBPQkpFQ1Q7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzUHJpbWl0aXZlICggdmFsdWUgKSB7XG4gIHJldHVybiAhIHZhbHVlIHx8XG4gICAgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyAmJlxuICAgIHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0eXBlID0gcmVxdWlyZSggJy4vdHlwZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1N5bWJvbCAoIHZhbHVlICkge1xuICByZXR1cm4gdHlwZSggdmFsdWUgKSA9PT0gJ3N5bWJvbCc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNXaW5kb3dMaWtlICggdmFsdWUgKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UoIHZhbHVlICkgJiYgdmFsdWUud2luZG93ID09PSB2YWx1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNzZXQgKCBrZXksIG9iaiApIHtcbiAgaWYgKCBvYmogPT0gbnVsbCApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHlwZW9mIG9ialsga2V5IF0gIT09ICd1bmRlZmluZWQnIHx8IGtleSBpbiBvYmo7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNBcnJheUxpa2VPYmplY3QgPSByZXF1aXJlKCAnLi9pcy1hcnJheS1saWtlLW9iamVjdCcgKSxcbiAgICBtYXRjaGVzUHJvcGVydHkgICA9IHJlcXVpcmUoICcuL21hdGNoZXMtcHJvcGVydHknICksXG4gICAgcHJvcGVydHkgICAgICAgICAgPSByZXF1aXJlKCAnLi9wcm9wZXJ0eScgKTtcblxuZXhwb3J0cy5pdGVyYXRlZSA9IGZ1bmN0aW9uIGl0ZXJhdGVlICggdmFsdWUgKSB7XG4gIGlmICggdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGlmICggaXNBcnJheUxpa2VPYmplY3QoIHZhbHVlICkgKSB7XG4gICAgcmV0dXJuIG1hdGNoZXNQcm9wZXJ0eSggdmFsdWUgKTtcbiAgfVxuXG4gIHJldHVybiBwcm9wZXJ0eSggdmFsdWUgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiYXNlS2V5cyA9IHJlcXVpcmUoICcuL2Jhc2UvYmFzZS1rZXlzJyApO1xudmFyIHRvT2JqZWN0ID0gcmVxdWlyZSggJy4vdG8tb2JqZWN0JyApO1xudmFyIHN1cHBvcnQgID0gcmVxdWlyZSggJy4vc3VwcG9ydC9zdXBwb3J0LWtleXMnICk7XG5cbmlmICggc3VwcG9ydCAhPT0gJ2VzMjAxNScgKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ga2V5cyAoIHYgKSB7XG4gICAgdmFyIF9rZXlzO1xuXG4gICAgLyoqXG4gICAgICogKyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICtcbiAgICAgKiB8IEkgdGVzdGVkIHRoZSBmdW5jdGlvbnMgd2l0aCBzdHJpbmdbMjA0OF0gKGFuIGFycmF5IG9mIHN0cmluZ3MpIGFuZCBoYWQgfFxuICAgICAqIHwgdGhpcyByZXN1bHRzIGluIG5vZGUuanMgKHY4LjEwLjApOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICogKyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICtcbiAgICAgKiB8IGJhc2VLZXlzIHggMTAsNjc0IG9wcy9zZWMgwrEwLjIzJSAoOTQgcnVucyBzYW1wbGVkKSAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAgKiB8IE9iamVjdC5rZXlzIHggMjIsMTQ3IG9wcy9zZWMgwrEwLjIzJSAoOTUgcnVucyBzYW1wbGVkKSAgICAgICAgICAgICAgICAgIHxcbiAgICAgKiB8IEZhc3Rlc3QgaXMgXCJPYmplY3Qua2V5c1wiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICogKyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICtcbiAgICAgKi9cblxuICAgIGlmICggc3VwcG9ydCA9PT0gJ2VzNScgKSB7XG4gICAgICBfa2V5cyA9IE9iamVjdC5rZXlzO1xuICAgIH0gZWxzZSB7XG4gICAgICBfa2V5cyA9IGJhc2VLZXlzO1xuICAgIH1cblxuICAgIHJldHVybiBfa2V5cyggdG9PYmplY3QoIHYgKSApO1xuICB9O1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBPYmplY3Qua2V5cztcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNhc3RQYXRoID0gcmVxdWlyZSggJy4vY2FzdC1wYXRoJyApLFxuICAgIGdldCAgICAgID0gcmVxdWlyZSggJy4vYmFzZS9iYXNlLWdldCcgKSxcbiAgICBFUlIgICAgICA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5FUlI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWF0Y2hlc1Byb3BlcnR5ICggcHJvcGVydHkgKSB7XG5cbiAgdmFyIHBhdGggID0gY2FzdFBhdGgoIHByb3BlcnR5WyAwIF0gKSxcbiAgICAgIHZhbHVlID0gcHJvcGVydHlbIDEgXTtcblxuICBpZiAoICEgcGF0aC5sZW5ndGggKSB7XG4gICAgdGhyb3cgRXJyb3IoIEVSUi5OT19QQVRIICk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKCBvYmplY3QgKSB7XG5cbiAgICBpZiAoIG9iamVjdCA9PSBudWxsICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICggcGF0aC5sZW5ndGggPiAxICkge1xuICAgICAgcmV0dXJuIGdldCggb2JqZWN0LCBwYXRoLCAwICkgPT09IHZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBvYmplY3RbIHBhdGhbIDAgXSBdID09PSB2YWx1ZTtcblxuICB9O1xuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNQbGFpbk9iamVjdCA9IHJlcXVpcmUoICcuL2lzLXBsYWluLW9iamVjdCcgKTtcblxudmFyIHRvT2JqZWN0ID0gcmVxdWlyZSggJy4vdG8tb2JqZWN0JyApO1xuXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoICcuL2lzLWFycmF5JyApO1xuXG52YXIga2V5cyA9IHJlcXVpcmUoICcuL2tleXMnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWl4aW4gKCBkZWVwLCBvYmplY3QgKSB7XG5cbiAgdmFyIGwgPSBhcmd1bWVudHMubGVuZ3RoO1xuXG4gIHZhciBpID0gMjtcblxuXG4gIHZhciBuYW1lcywgZXhwLCBqLCBrLCB2YWwsIGtleSwgbm93QXJyYXksIHNyYztcblxuICAvLyAgbWl4aW4oIHt9LCB7fSApXG5cbiAgaWYgKCB0eXBlb2YgZGVlcCAhPT0gJ2Jvb2xlYW4nICkge1xuICAgIG9iamVjdCA9IGRlZXA7XG4gICAgZGVlcCAgID0gdHJ1ZTtcbiAgICBpICAgICAgPSAxO1xuICB9XG5cbiAgLy8gdmFyIGV4dGVuZGFibGUgPSB7XG4gIC8vICAgZXh0ZW5kOiByZXF1aXJlKCAncGVha28vbWl4aW4nIClcbiAgLy8gfTtcblxuICAvLyBleHRlbmRhYmxlLmV4dGVuZCggeyBuYW1lOiAnRXh0ZW5kYWJsZSBPYmplY3QnIH0gKTtcblxuICBpZiAoIGkgPT09IGwgKSB7XG5cbiAgICBvYmplY3QgPSB0aGlzOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG5cbiAgICAtLWk7XG5cbiAgfVxuXG4gIG9iamVjdCA9IHRvT2JqZWN0KCBvYmplY3QgKTtcblxuICBmb3IgKCA7IGkgPCBsOyArK2kgKSB7XG4gICAgbmFtZXMgPSBrZXlzKCBleHAgPSB0b09iamVjdCggYXJndW1lbnRzWyBpIF0gKSApO1xuXG4gICAgZm9yICggaiA9IDAsIGsgPSBuYW1lcy5sZW5ndGg7IGogPCBrOyArK2ogKSB7XG4gICAgICB2YWwgPSBleHBbIGtleSA9IG5hbWVzWyBqIF0gXTtcblxuICAgICAgaWYgKCBkZWVwICYmIHZhbCAhPT0gZXhwICYmICggaXNQbGFpbk9iamVjdCggdmFsICkgfHwgKCBub3dBcnJheSA9IGlzQXJyYXkoIHZhbCApICkgKSApIHtcbiAgICAgICAgc3JjID0gb2JqZWN0WyBrZXkgXTtcblxuICAgICAgICBpZiAoIG5vd0FycmF5ICkge1xuICAgICAgICAgIGlmICggISBpc0FycmF5KCBzcmMgKSApIHtcbiAgICAgICAgICAgIHNyYyA9IFtdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG5vd0FycmF5ID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoICEgaXNQbGFpbk9iamVjdCggc3JjICkgKSB7XG4gICAgICAgICAgc3JjID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBvYmplY3RbIGtleSBdID0gbWl4aW4oIHRydWUsIHNyYywgdmFsICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvYmplY3RbIGtleSBdID0gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIG9iamVjdDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbm9vcCAoKSB7fTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbiBub3cgKCkge1xuICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmVmb3JlID0gcmVxdWlyZSggJy4vYmVmb3JlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG9uY2UgKCB0YXJnZXQgKSB7XG4gIHJldHVybiBiZWZvcmUoIDEsIHRhcmdldCApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCAnLi9jcmVhdGUvY3JlYXRlLXByb3BlcnR5JyApKCByZXF1aXJlKCAnLi9iYXNlL2Jhc2UtcHJvcGVydHknICkgKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzUHJpbWl0aXZlID0gcmVxdWlyZSggJy4vaXMtcHJpbWl0aXZlJyApLFxuICAgIEVSUiAgICAgICAgID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApLkVSUjtcblxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gc2V0UHJvdG90eXBlT2YgKCB0YXJnZXQsIHByb3RvdHlwZSApIHtcbiAgaWYgKCB0YXJnZXQgPT0gbnVsbCApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoIEVSUi5VTkRFRklORURfT1JfTlVMTCApO1xuICB9XG5cbiAgaWYgKCBwcm90b3R5cGUgIT09IG51bGwgJiYgaXNQcmltaXRpdmUoIHByb3RvdHlwZSApICkge1xuICAgIHRocm93IFR5cGVFcnJvciggJ09iamVjdCBwcm90b3R5cGUgbWF5IG9ubHkgYmUgYW4gT2JqZWN0IG9yIG51bGw6ICcgKyBwcm90b3R5cGUgKTtcbiAgfVxuXG4gIGlmICggJ19fcHJvdG9fXycgaW4gdGFyZ2V0ICkge1xuICAgIHRhcmdldC5fX3Byb3RvX18gPSBwcm90b3R5cGU7IC8vIGpzaGludCBpZ25vcmU6IGxpbmVcbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3VwcG9ydDtcblxuZnVuY3Rpb24gdGVzdCAoIHRhcmdldCApIHtcbiAgdHJ5IHtcbiAgICBpZiAoICcnIGluIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdGFyZ2V0LCAnJywge30gKSApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBjYXRjaCAoIGUgKSB7fVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuaWYgKCB0ZXN0KCB7fSApICkge1xuICBzdXBwb3J0ID0gJ2Z1bGwnO1xufSBlbHNlIGlmICggdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiB0ZXN0KCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc3BhbicgKSApICkge1xuICBzdXBwb3J0ID0gJ2RvbSc7XG59IGVsc2Uge1xuICBzdXBwb3J0ID0gJ25vdC1zdXBwb3J0ZWQnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdXBwb3J0O1xuXG5pZiAoIE9iamVjdC5rZXlzICkge1xuICB0cnkge1xuICAgIHN1cHBvcnQgPSBPYmplY3Qua2V5cyggJycgKSwgJ2VzMjAxNSc7IC8vIGpzaGludCBpZ25vcmU6IGxpbmVcbiAgfSBjYXRjaCAoIGUgKSB7XG4gICAgc3VwcG9ydCA9ICdlczUnO1xuICB9XG59IGVsc2UgaWYgKCB7IHRvU3RyaW5nOiBudWxsIH0ucHJvcGVydHlJc0VudW1lcmFibGUoICd0b1N0cmluZycgKSApIHtcbiAgc3VwcG9ydCA9ICdub3Qtc3VwcG9ydGVkJztcbn0gZWxzZSB7XG4gIHN1cHBvcnQgPSAnaGFzLWEtYnVnJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0O1xuIiwiLyoqXG4gKiBCYXNlZCBvbiBFcmlrIE3DtmxsZXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsOlxuICpcbiAqIEFkYXB0ZWQgZnJvbSBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9wYXVsaXJpc2gvMTU3OTY3MSB3aGljaCBkZXJpdmVkIGZyb21cbiAqIGh0dHA6Ly9wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4gKiBodHRwOi8vbXkub3BlcmEuY29tL2Vtb2xsZXIvYmxvZy8yMDExLzEyLzIwL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtZXItYW5pbWF0aW5nXG4gKlxuICogcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsIGJ5IEVyaWsgTcO2bGxlci5cbiAqIEZpeGVzIGZyb20gUGF1bCBJcmlzaCwgVGlubyBaaWpkZWwsIEFuZHJldyBNYW8sIEtsZW1lbiBTbGF2acSNLCBEYXJpdXMgQmFjb24uXG4gKlxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB0aW1lc3RhbXAgPSByZXF1aXJlKCAnLi90aW1lc3RhbXAnICk7XG5cbnZhciByZXF1ZXN0QUYsIGNhbmNlbEFGO1xuXG5pZiAoIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICkge1xuICBjYW5jZWxBRiA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRDYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96Q2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICByZXF1ZXN0QUYgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG59XG5cbnZhciBub1JlcXVlc3RBbmltYXRpb25GcmFtZSA9ICEgcmVxdWVzdEFGIHx8ICEgY2FuY2VsQUYgfHxcbiAgdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgL2lQKGFkfGhvbmV8b2QpLipPU1xcczYvLnRlc3QoIG5hdmlnYXRvci51c2VyQWdlbnQgKTtcblxuaWYgKCBub1JlcXVlc3RBbmltYXRpb25GcmFtZSApIHtcbiAgdmFyIGxhc3RSZXF1ZXN0VGltZSA9IDAsXG4gICAgICBmcmFtZUR1cmF0aW9uICAgPSAxMDAwIC8gNjA7XG5cbiAgZXhwb3J0cy5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdCAoIGFuaW1hdGUgKSB7XG4gICAgdmFyIG5vdyAgICAgICAgICAgICA9IHRpbWVzdGFtcCgpLFxuICAgICAgICBuZXh0UmVxdWVzdFRpbWUgPSBNYXRoLm1heCggbGFzdFJlcXVlc3RUaW1lICsgZnJhbWVEdXJhdGlvbiwgbm93ICk7XG5cbiAgICByZXR1cm4gc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgbGFzdFJlcXVlc3RUaW1lID0gbmV4dFJlcXVlc3RUaW1lO1xuICAgICAgYW5pbWF0ZSggbm93ICk7XG4gICAgfSwgbmV4dFJlcXVlc3RUaW1lIC0gbm93ICk7XG4gIH07XG5cbiAgZXhwb3J0cy5jYW5jZWwgPSBjbGVhclRpbWVvdXQ7XG59IGVsc2Uge1xuICBleHBvcnRzLnJlcXVlc3QgPSBmdW5jdGlvbiByZXF1ZXN0ICggYW5pbWF0ZSApIHtcbiAgICByZXR1cm4gcmVxdWVzdEFGKCBhbmltYXRlICk7XG4gIH07XG5cbiAgZXhwb3J0cy5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwgKCBpZCApIHtcbiAgICByZXR1cm4gY2FuY2VsQUYoIGlkICk7XG4gIH07XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBub3cgPSByZXF1aXJlKCAnLi9ub3cnICk7XG52YXIgbmF2aWdhdG9yU3RhcnQ7XG5cbmlmICggdHlwZW9mIHBlcmZvcm1hbmNlID09PSAndW5kZWZpbmVkJyB8fCAhIHBlcmZvcm1hbmNlLm5vdyApIHtcbiAgbmF2aWdhdG9yU3RhcnQgPSBub3coKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRpbWVzdGFtcCAoKSB7XG4gICAgcmV0dXJuIG5vdygpIC0gbmF2aWdhdG9yU3RhcnQ7XG4gIH07XG59IGVsc2Uge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRpbWVzdGFtcCAoKSB7XG4gICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpO1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3VuZXNjYXBlID0gcmVxdWlyZSggJy4vX3VuZXNjYXBlJyApLFxuICAgIGlzU3ltYm9sICA9IHJlcXVpcmUoICcuL2lzLXN5bWJvbCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b0tleSAoIHZhbCApIHtcbiAgdmFyIGtleTtcblxuICBpZiAoIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICkge1xuICAgIHJldHVybiBfdW5lc2NhcGUoIHZhbCApO1xuICB9XG5cbiAgaWYgKCBpc1N5bWJvbCggdmFsICkgKSB7XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuXG4gIGtleSA9ICcnICsgdmFsO1xuXG4gIGlmICgga2V5ID09PSAnMCcgJiYgMSAvIHZhbCA9PT0gLUluZmluaXR5ICkge1xuICAgIHJldHVybiAnLTAnO1xuICB9XG5cbiAgcmV0dXJuIF91bmVzY2FwZSgga2V5ICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRVJSID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApLkVSUjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b09iamVjdCAoIHZhbHVlICkge1xuICBpZiAoIHZhbHVlID09IG51bGwgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCBFUlIuVU5ERUZJTkVEX09SX05VTEwgKTtcbiAgfVxuXG4gIHJldHVybiBPYmplY3QoIHZhbHVlICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3JlYXRlID0gcmVxdWlyZSggJy4vY3JlYXRlJyApO1xuXG52YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZyxcbiAgICB0eXBlcyA9IGNyZWF0ZSggbnVsbCApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFR5cGUgKCB2YWx1ZSApIHtcbiAgdmFyIHR5cGUsIHRhZztcblxuICBpZiAoIHZhbHVlID09PSBudWxsICkge1xuICAgIHJldHVybiAnbnVsbCc7XG4gIH1cblxuICB0eXBlID0gdHlwZW9mIHZhbHVlO1xuXG4gIGlmICggdHlwZSAhPT0gJ29iamVjdCcgJiYgdHlwZSAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICByZXR1cm4gdHlwZTtcbiAgfVxuXG4gIHR5cGUgPSB0eXBlc1sgdGFnID0gdG9TdHJpbmcuY2FsbCggdmFsdWUgKSBdO1xuXG4gIGlmICggdHlwZSApIHtcbiAgICByZXR1cm4gdHlwZTtcbiAgfVxuXG4gIHJldHVybiAoIHR5cGVzWyB0YWcgXSA9IHRhZy5zbGljZSggOCwgLTEgKS50b0xvd2VyQ2FzZSgpICk7XG59O1xuIl19
