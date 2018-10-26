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
   * @param  {string} setting Имя настройки: "zoom-out speed", "zoom-in speed", "offset", "speed", "zoom".
   * @param  {any}    value   Новое значение настройки.
   * @return {void}           Ничего не возращает.
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
    var setting_ = this.get( setting );
    for ( var _keys = Object.keys( value ), _i = 0, _l = _keys.length; _i < _l; ++_i ) {
      setting_[ _keys[ _i ] ] = value[ _keys[ _i ] ];
    }
  },
  /**
   * Возвращает значение настройки.
   * @method v6.Camera#get
   * @param  {string} setting Имя настройки: "zoom-out speed", "zoom-in speed", "offset", "speed", "zoom".
   * @return {any}            Значение настройки.
   * @example
   * // Get current camera zoom.
   * var zoom = camera.get( 'zoom' ).value;
   */
  get: function get ( setting )
  {
    CHECK( setting );
    return this.settings[ setting ];
  },
  /**
   * Направляет камеру на определенную позицию (`"destination"`).
   * @method v6.Camera#lookAt
   * @param  {IVector2D} destination Позиция, в которую должна смотреть камера.
   * @param  {string}   [key]        Свойство, которое надо брать из `"destination"`.
   * @return {void}                  Ничего не возращает.
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
   *   position: { x: 4, y: 2 }
   * };
   *
   * camera.shouldLookAt(); // -> { x: 0, y: 0 }.
   * camera.lookAt( object, 'position' );
   * camera.shouldLookAt(); // -> { x: 4, y: 2 } (clone).
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
  camera._currentPosition[ axis ] += ( transformedCurrentPosition - transformedDestination ) * camera.settings.speed[ axis ];
}
function CHECK ( setting )
{
  switch ( setting ) {
    case 'zoom-out speed':
    case 'zoom-in speed':
    case 'offset':
    case 'speed':
    case 'zoom':
      return;
  }
  throw new Error( 'Got unknown setting key: ' + setting );
}
module.exports = Camera;

},{"./settings":5,"peako/defaults":65}],5:[function(require,module,exports){
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
   * @param  {number}    sides         Количество сторон полигона.
   * @param  {number}    xRadius       X радиус полигона.
   * @param  {number}    yRadius       Y радиус полигона.
   * @param  {number}    rotationAngle Угол поворота полигона
   *                                   (чтобы не использовать {@link v6.Transform#rotate}).
   * @param  {boolean}   degrees       Использовать градусы.
   * @chainable
   * @example
   * // Draw hexagon at [ 4, 2 ] with radius 25.
   * renderer.polygon( 4, 2, 6, 25, 25, 0 );
   */
  drawPolygon: function drawPolygon ( x, y, sides, xRadius, yRadius, rotationAngle, degrees )
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
   * @param  {number} sides           Количество сторон полигона.
   * @param  {number} r               Радиус полигона.
   * @param  {number} [rotationAngle] Угол поворота полигона.
   *                                  (чтобы не использовать {@link v6.Transform#rotate}).
   * @chainable
   * @example
   * // Draw hexagon at [ 4, 2 ] with radius 25.
   * renderer.polygon( 4, 2, 6, 25 );
   */
  polygon: function polygon ( x, y, sides, r, rotationAngle )
  {
    if ( sides % 1 ) {
      sides = Math.floor( sides * 100 ) * 0.01;
    }
    if ( typeof rotationAngle === 'undefined' ) {
      this.drawPolygon( x, y, sides, r, r, -Math.PI * 0.5 );
    } else {
      this.drawPolygon( x, y, sides, r, r, rotationAngle, options.degrees );
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb3JlL1NoYWRlclByb2dyYW0uanMiLCJjb3JlL1RpY2tlci5qcyIsImNvcmUvVHJhbnNmb3JtLmpzIiwiY29yZS9jYW1lcmEvQ2FtZXJhLmpzIiwiY29yZS9jYW1lcmEvc2V0dGluZ3MuanMiLCJjb3JlL2NvbG9yL0hTTEEuanMiLCJjb3JlL2NvbG9yL1JHQkEuanMiLCJjb3JlL2NvbG9yL2ludGVybmFsL2NvbG9ycy5qcyIsImNvcmUvY29sb3IvaW50ZXJuYWwvcGFyc2UuanMiLCJjb3JlL2NvbnN0YW50cy5qcyIsImNvcmUvaW1hZ2UvQWJzdHJhY3RJbWFnZS5qcyIsImNvcmUvaW1hZ2UvQ29tcG91bmRlZEltYWdlLmpzIiwiY29yZS9pbWFnZS9JbWFnZS5qcyIsImNvcmUvaW50ZXJuYWwvY3JlYXRlX3BvbHlnb24uanMiLCJjb3JlL2ludGVybmFsL2NyZWF0ZV9wcm9ncmFtLmpzIiwiY29yZS9pbnRlcm5hbC9jcmVhdGVfc2hhZGVyLmpzIiwiY29yZS9pbnRlcm5hbC9wb2x5Z29ucy5qcyIsImNvcmUvaW50ZXJuYWwvcmVwb3J0LmpzIiwiY29yZS9tYXRoL0Fic3RyYWN0VmVjdG9yLmpzIiwiY29yZS9tYXRoL1ZlY3RvcjJELmpzIiwiY29yZS9tYXRoL1ZlY3RvcjNELmpzIiwiY29yZS9tYXRoL21hdDMuanMiLCJjb3JlL3JlbmRlcmVyL0Fic3RyYWN0UmVuZGVyZXIuanMiLCJjb3JlL3JlbmRlcmVyL1JlbmRlcmVyMkQuanMiLCJjb3JlL3JlbmRlcmVyL1JlbmRlcmVyR0wuanMiLCJjb3JlL3JlbmRlcmVyL2NyZWF0ZV9yZW5kZXJlci5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvY2xvc2Vfc2hhcGUuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL2NvcHlfZHJhd2luZ19zZXR0aW5ncy5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvZGVmYXVsdF9kcmF3aW5nX3NldHRpbmdzLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9nZXRfcmVuZGVyZXJfdHlwZS5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvZ2V0X3dlYmdsLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24uanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL3Byb2Nlc3Nfc2hhcGUuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL3NldF9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MuanMiLCJjb3JlL3JlbmRlcmVyL3NldHRpbmdzLmpzIiwiY29yZS9yZW5kZXJlci9zaGFwZXMvZHJhd19saW5lcy5qcyIsImNvcmUvcmVuZGVyZXIvc2hhcGVzL2RyYXdfcG9pbnRzLmpzIiwiY29yZS9zZXR0aW5ncy5qcyIsImNvcmUvc2hhZGVycy5qcyIsImluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xpZ2h0X2VtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGVha28vX3Rocm93LWFyZ3VtZW50LWV4Y2VwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdHlwZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdW5lc2NhcGUuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZXhlYy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZm9yLWVhY2guanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWZvci1pbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZ2V0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1pbmRleC1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2Uta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLXRvLWluZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2JlZm9yZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jYWxsLWl0ZXJhdGVlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Nhc3QtcGF0aC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jbGFtcC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jbG9uZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jb25zdGFudHMuanMiLCJub2RlX21vZHVsZXMvcGVha28vY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NyZWF0ZS9jcmVhdGUtZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUvY3JlYXRlLWdldC1lbGVtZW50LWRpbWVuc2lvbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUvY3JlYXRlLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2RlZmF1bHQtdG8uanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmYXVsdHMuanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmaW5lLXByb3BlcnRpZXMuanMiLCJub2RlX21vZHVsZXMvcGVha28vZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9nZXQtZWxlbWVudC1oLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2dldC1lbGVtZW50LXcuanMiLCJub2RlX21vZHVsZXMvcGVha28vZ2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1hcnJheS1saWtlLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1hcnJheS1saWtlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWFycmF5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWtleS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1sZW5ndGguanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LWxpa2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXBsYWluLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1wcmltaXRpdmUuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtc3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXdpbmRvdy1saWtlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzc2V0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2l0ZXJhdGVlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2tleXMuanMiLCJub2RlX21vZHVsZXMvcGVha28vbWF0Y2hlcy1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9taXhpbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9ub29wLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL25vdy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9vbmNlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3Byb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3NldC1wcm90b3R5cGUtb2YuanMiLCJub2RlX21vZHVsZXMvcGVha28vc3VwcG9ydC9zdXBwb3J0LWRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9zdXBwb3J0L3N1cHBvcnQta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lci5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lc3RhbXAuanMiLCJub2RlX21vZHVsZXMvcGVha28vdG8ta2V5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3RvLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90eXBlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy90QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVNoYWRlckF0dHJpYnV0ZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGxvY2F0aW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHNpemVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB0eXBlXG4gKiBAc2VlIFtnZXRBdHRyaWJMb2NhdGlvbl0oaHR0cHM6Ly9tZG4uaW8vZ2V0QXR0cmliTG9jYXRpb24pXG4gKiBAc2VlIFtXZWJHTEFjdGl2ZUluZm9dKGh0dHBzOi8vbWRuLmlvL1dlYkdMQWN0aXZlSW5mbylcbiAqL1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVNoYWRlclVuaWZvcm1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsb2NhdGlvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzaXplXG4gKiBAcHJvcGVydHkge251bWJlcn0gdHlwZVxuICogQHNlZSBbZ2V0QWN0aXZlVW5pZm9ybV0oaHR0cHM6Ly9tZG4uaW8vZ2V0QWN0aXZlVW5pZm9ybSlcbiAqIEBzZWUgW1dlYkdMQWN0aXZlSW5mb10oaHR0cHM6Ly9tZG4uaW8vV2ViR0xBY3RpdmVJbmZvKVxuICovXG5cbnZhciBjcmVhdGVQcm9ncmFtID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvY3JlYXRlX3Byb2dyYW0nICk7XG52YXIgY3JlYXRlU2hhZGVyICA9IHJlcXVpcmUoICcuL2ludGVybmFsL2NyZWF0ZV9zaGFkZXInICk7XG5cbi8qKlxuICog0JLRi9GB0L7QutC+0YPRgNC+0LLQvdC10LLRi9C5INC40L3RgtC10YDRhNC10LnRgSDQtNC70Y8gV2ViR0xQcm9ncmFtLlxuICogQGNvbnN0cnVjdG9yIHY2LlNoYWRlclByb2dyYW1cbiAqIEBwYXJhbSB7SVNoYWRlclNvdXJjZXN9ICAgICAgICBzb3VyY2VzINCo0LXQudC00LXRgNGLINC00LvRjyDQv9GA0L7Qs9GA0LDQvNC80YsuXG4gKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgICAgICBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICogQGV4YW1wbGUgPGNhcHRpb24+UmVxdWlyZSBcInY2LlNoYWRlclByb2dyYW1cIjwvY2FwdGlvbj5cbiAqIHZhciBTaGFkZXJQcm9ncmFtID0gcmVxdWlyZSggJ3Y2LmpzL1NoYWRlclByb2dyYW0nICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5Vc2Ugd2l0aG91dCByZW5kZXJlcjwvY2FwdGlvbj5cbiAqIC8vIFJlcXVpcmUgXCJ2Ni5qc1wiIHNoYWRlcnMuXG4gKiB2YXIgc2hhZGVycyA9IHJlcXVpcmUoICd2Ni5qcy9zaGFkZXJzJyApO1xuICogLy8gQ3JlYXRlIGEgcHJvZ3JhbS5cbiAqIHZhciBwcm9ncmFtID0gbmV3IFNoYWRlclByb2dyYW0oIHNoYWRlcnMuYmFzaWMsIGdsQ29udGV4dCApO1xuICovXG5mdW5jdGlvbiBTaGFkZXJQcm9ncmFtICggc291cmNlcywgZ2wgKVxue1xuICB2YXIgdmVydCA9IGNyZWF0ZVNoYWRlciggc291cmNlcy52ZXJ0LCBnbC5WRVJURVhfU0hBREVSLCBnbCApO1xuICB2YXIgZnJhZyA9IGNyZWF0ZVNoYWRlciggc291cmNlcy5mcmFnLCBnbC5GUkFHTUVOVF9TSEFERVIsIGdsICk7XG5cbiAgLyoqXG4gICAqIFdlYkdMINC/0YDQvtCz0YDQsNC80LzQsCDRgdC+0LfQtNCw0L3QvdCw0Y8g0YEg0L/QvtC80L7RidGM0Y4ge0BsaW5rIGNyZWF0ZVByb2dyYW19LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtXZWJHTFByb2dyYW19IHY2LlNoYWRlclByb2dyYW0jX3Byb2dyYW1cbiAgICovXG4gIHRoaXMuX3Byb2dyYW0gPSBjcmVhdGVQcm9ncmFtKCB2ZXJ0LCBmcmFnLCBnbCApO1xuXG4gIC8qKlxuICAgKiBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IHY2LlNoYWRlclByb2dyYW0jX2dsXG4gICAqL1xuICB0aGlzLl9nbCA9IGdsO1xuXG4gIC8qKlxuICAgKiDQmtC10YjQuNGA0L7QstCw0L3QvdGL0LUg0LDRgtGA0LjQsdGD0YLRiyDRiNC10LnQtNC10YDQvtCyLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LlNoYWRlclByb2dyYW0jX2F0dHJpYnV0ZXNcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKi9cbiAgdGhpcy5fYXR0cmlidXRlcyA9IHt9O1xuXG4gIC8qKlxuICAgKiDQmtC10YjQuNGA0L7QstCw0L3QvdGL0LUg0YTQvtGA0LzRiyAodW5pZm9ybXMpINGI0LXQudC00LXRgNC+0LIuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuU2hhZGVyUHJvZ3JhbSNfdW5pZm9ybXNcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldFVuaWZvcm1cbiAgICovXG4gIHRoaXMuX3VuaWZvcm1zID0ge307XG5cbiAgLyoqXG4gICAqINCY0L3QtNC10LrRgSDQv9C+0YHQu9C10LTQvdC10LPQviDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INCw0YLRgNC40LHRg9GC0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuU2hhZGVyUHJvZ3JhbSNfYXR0cmlidXRlSW5kZXhcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKi9cbiAgdGhpcy5fYXR0cmlidXRlSW5kZXggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKCB0aGlzLl9wcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUyApO1xuXG4gIC8qKlxuICAgKiDQmNC90LTQtdC60YEg0L/QvtGB0LvQtdC00L3QtdC5INC/0L7Qu9GD0YfQtdC90L3QvtC5INGE0L7RgNC80YsgKHVuaWZvcm0pLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlNoYWRlclByb2dyYW0jX3VuaWZvcm1JbmRleFxuICAgKiBAc2VlIHY2LlNoYWRlclByb2dyYW0jZ2V0VW5pZm9ybVxuICAgKi9cbiAgdGhpcy5fdW5pZm9ybUluZGV4ID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggdGhpcy5fcHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TICk7XG59XG5cblNoYWRlclByb2dyYW0ucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogQG1ldGhvZCB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICBuYW1lINCd0LDQt9Cy0LDQvdC40LUg0LDRgtGA0LjQsdGD0YLQsC5cbiAgICogQHJldHVybiB7SVNoYWRlckF0dHJpYnV0ZX0gICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQtNCw0L3QvdGL0LUg0L4g0LDRgtGA0LjQsdGD0YLQtS5cbiAgICogQGV4YW1wbGVcbiAgICogdmFyIGxvY2F0aW9uID0gcHJvZ3JhbS5nZXRBdHRyaWJ1dGUoICdhcG9zJyApLmxvY2F0aW9uO1xuICAgKi9cbiAgZ2V0QXR0cmlidXRlOiBmdW5jdGlvbiBnZXRBdHRyaWJ1dGUgKCBuYW1lIClcbiAge1xuICAgIHZhciBhdHRyID0gdGhpcy5fYXR0cmlidXRlc1sgbmFtZSBdO1xuICAgIHZhciBpbmZvO1xuXG4gICAgaWYgKCBhdHRyICkge1xuICAgICAgcmV0dXJuIGF0dHI7XG4gICAgfVxuXG4gICAgd2hpbGUgKCAtLXRoaXMuX2F0dHJpYnV0ZUluZGV4ID49IDAgKSB7XG4gICAgICBpbmZvID0gdGhpcy5fZ2wuZ2V0QWN0aXZlQXR0cmliKCB0aGlzLl9wcm9ncmFtLCB0aGlzLl9hdHRyaWJ1dGVJbmRleCApO1xuXG4gICAgICBhdHRyID0ge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5fZ2wuZ2V0QXR0cmliTG9jYXRpb24oIHRoaXMuX3Byb2dyYW0sIG5hbWUgKSxcbiAgICAgICAgbmFtZTogaW5mby5uYW1lLFxuICAgICAgICBzaXplOiBpbmZvLnNpemUsXG4gICAgICAgIHR5cGU6IGluZm8udHlwZVxuICAgICAgfTtcblxuICAgICAgdGhpcy5fYXR0cmlidXRlc1sgYXR0ci5uYW1lIF0gPSBhdHRyO1xuXG4gICAgICBpZiAoIGF0dHIubmFtZSA9PT0gbmFtZSApIHtcbiAgICAgICAgcmV0dXJuIGF0dHI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgUmVmZXJlbmNlRXJyb3IoICdObyBcIicgKyBuYW1lICsgJ1wiIGF0dHJpYnV0ZSBmb3VuZCcgKTtcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5TaGFkZXJQcm9ncmFtI2dldFVuaWZvcm1cbiAgICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgIG5hbWUg0J3QsNC30LLQsNC90LjQtSDRhNC+0YDQvNGLICh1bmlmb3JtKS5cbiAgICogQHJldHVybiB7SVNoYWRlclVuaWZvcm19ICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQsNC90L3Ri9C1INC+INGE0L7RgNC80LUgKHVuaWZvcm0pLlxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgbG9jYXRpb24gPSBwcm9ncmFtLmdldFVuaWZvcm0oICd1Y29sb3InICkubG9jYXRpb247XG4gICAqL1xuICBnZXRVbmlmb3JtOiBmdW5jdGlvbiBnZXRVbmlmb3JtICggbmFtZSApXG4gIHtcbiAgICB2YXIgdW5pZm9ybSA9IHRoaXMuX3VuaWZvcm1zWyBuYW1lIF07XG4gICAgdmFyIGluZGV4LCBpbmZvO1xuXG4gICAgaWYgKCB1bmlmb3JtICkge1xuICAgICAgcmV0dXJuIHVuaWZvcm07XG4gICAgfVxuXG4gICAgd2hpbGUgKCAtLXRoaXMuX3VuaWZvcm1JbmRleCA+PSAwICkge1xuICAgICAgaW5mbyA9IHRoaXMuX2dsLmdldEFjdGl2ZVVuaWZvcm0oIHRoaXMuX3Byb2dyYW0sIHRoaXMuX3VuaWZvcm1JbmRleCApO1xuXG4gICAgICB1bmlmb3JtID0ge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKCB0aGlzLl9wcm9ncmFtLCBpbmZvLm5hbWUgKSxcbiAgICAgICAgc2l6ZTogaW5mby5zaXplLFxuICAgICAgICB0eXBlOiBpbmZvLnR5cGVcbiAgICAgIH07XG5cbiAgICAgIGlmICggaW5mby5zaXplID4gMSAmJiB+ICggaW5kZXggPSBpbmZvLm5hbWUuaW5kZXhPZiggJ1snICkgKSApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZS5zbGljZSggMCwgaW5kZXggKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fdW5pZm9ybXNbIHVuaWZvcm0ubmFtZSBdID0gdW5pZm9ybTtcblxuICAgICAgaWYgKCB1bmlmb3JtLm5hbWUgPT09IG5hbWUgKSB7XG4gICAgICAgIHJldHVybiB1bmlmb3JtO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IFJlZmVyZW5jZUVycm9yKCAnTm8gXCInICsgbmFtZSArICdcIiB1bmlmb3JtIGZvdW5kJyApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jc2V0QXR0cmlidXRlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSBbV2ViR0xSZW5kZXJpbmdDb250ZXh0I2VuYWJsZVZlcnRleEF0dHJpYkFycmF5XShodHRwczovL21kbi5pby9lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSlcbiAgICogQHNlZSBbV2ViR0xSZW5kZXJpbmdDb250ZXh0I3ZlcnRleEF0dHJpYlBvaW50ZXJdKGh0dHBzOi8vbWRuLmlvL3ZlcnRleEF0dHJpYlBvaW50ZXIpXG4gICAqIEBleGFtcGxlXG4gICAqIHByb2dyYW0uc2V0QXR0cmlidXRlKCAnYXBvcycsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCApO1xuICAgKi9cbiAgc2V0QXR0cmlidXRlOiBmdW5jdGlvbiBzZXRBdHRyaWJ1dGUgKCBuYW1lLCBzaXplLCB0eXBlLCBub3JtYWxpemVkLCBzdHJpZGUsIG9mZnNldCApXG4gIHtcbiAgICB2YXIgbG9jYXRpb24gPSB0aGlzLmdldEF0dHJpYnV0ZSggbmFtZSApLmxvY2F0aW9uO1xuICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KCBsb2NhdGlvbiApO1xuICAgIHRoaXMuX2dsLnZlcnRleEF0dHJpYlBvaW50ZXIoIGxvY2F0aW9uLCBzaXplLCB0eXBlLCBub3JtYWxpemVkLCBzdHJpZGUsIG9mZnNldCApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jc2V0VW5pZm9ybVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWUgINCd0LDQt9Cy0LDQvdC40LUg0YTQvtGA0LzRiyAodW5pZm9ybSkuXG4gICAqIEBwYXJhbSAge2FueX0gICAgdmFsdWUg0J3QvtCy0L7QtSDQt9C90LDRh9C10L3QuNC1INGE0L7RgNC80YsgKHVuaWZvcm0pLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIHByb2dyYW0uc2V0VW5pZm9ybSggJ3Vjb2xvcicsIFsgMjU1LCAwLCAwLCAxIF0gKTtcbiAgICovXG4gIHNldFVuaWZvcm06IGZ1bmN0aW9uIHNldFVuaWZvcm0gKCBuYW1lLCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgdW5pZm9ybSA9IHRoaXMuZ2V0VW5pZm9ybSggbmFtZSApO1xuICAgIHZhciBfZ2wgICAgID0gdGhpcy5fZ2w7XG5cbiAgICBzd2l0Y2ggKCB1bmlmb3JtLnR5cGUgKSB7XG4gICAgICBjYXNlIF9nbC5CT09MOlxuICAgICAgY2FzZSBfZ2wuSU5UOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xaXYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xaSggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xZnYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUX01BVDI6XG4gICAgICAgIF9nbC51bmlmb3JtTWF0cml4MmZ2KCB1bmlmb3JtLmxvY2F0aW9uLCBmYWxzZSwgdmFsdWUgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIF9nbC5GTE9BVF9NQVQzOlxuICAgICAgICBfZ2wudW5pZm9ybU1hdHJpeDNmdiggdW5pZm9ybS5sb2NhdGlvbiwgZmFsc2UsIHZhbHVlICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfZ2wuRkxPQVRfTUFUNDpcbiAgICAgICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoIHVuaWZvcm0ubG9jYXRpb24sIGZhbHNlLCB2YWx1ZSApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUX1ZFQzI6XG4gICAgICAgIGlmICggdW5pZm9ybS5zaXplID4gMSApIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTJmdiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTJmKCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZVsgMCBdLCB2YWx1ZVsgMSBdICk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIF9nbC5GTE9BVF9WRUMzOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0zZnYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0zZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWVbIDAgXSwgdmFsdWVbIDEgXSwgdmFsdWVbIDIgXSApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfZ2wuRkxPQVRfVkVDNDpcbiAgICAgICAgaWYgKCB1bmlmb3JtLnNpemUgPiAxICkge1xuICAgICAgICAgIF9nbC51bmlmb3JtNGZ2KCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9nbC51bmlmb3JtNGYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlWyAwIF0sIHZhbHVlWyAxIF0sIHZhbHVlWyAyIF0sIHZhbHVlWyAzIF0gKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IFR5cGVFcnJvciggJ1RoZSB1bmlmb3JtIHR5cGUgaXMgbm90IHN1cHBvcnRlZCAoXCInICsgbmFtZSArICdcIiknICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuU2hhZGVyUHJvZ3JhbSN1c2VcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIFtXZWJHTFJlbmRlcmluZ0NvbnRleHQjdXNlUHJvZ3JhbV0oaHR0cHM6Ly9tZG4uaW8vdXNlUHJvZ3JhbSlcbiAgICogQGV4YW1wbGVcbiAgICogcHJvZ3JhbS51c2UoKTtcbiAgICovXG4gIHVzZTogZnVuY3Rpb24gdXNlICgpXG4gIHtcbiAgICB0aGlzLl9nbC51c2VQcm9ncmFtKCB0aGlzLl9wcm9ncmFtICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IFNoYWRlclByb2dyYW1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2hhZGVyUHJvZ3JhbTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIExpZ2h0RW1pdHRlciA9IHJlcXVpcmUoICdsaWdodF9lbWl0dGVyJyApO1xudmFyIHRpbWVzdGFtcCAgICA9IHJlcXVpcmUoICdwZWFrby90aW1lc3RhbXAnICk7XG52YXIgdGltZXIgICAgICAgID0gcmVxdWlyZSggJ3BlYWtvL3RpbWVyJyApO1xuXG4vKipcbiAqINCt0YLQvtGCINC60LvQsNGB0YEg0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC00LvRjyDQt9Cw0YbQuNC60LvQuNCy0LDQvdC40Y8g0LDQvdC40LzQsNGG0LjQuCDQstC80LXRgdGC0L4gYHJlcXVlc3RBbmltYXRpb25GcmFtZWAuXG4gKiBAY29uc3RydWN0b3IgdjYuVGlja2VyXG4gKiBAZXh0ZW5kcyB7TGlnaHRFbWl0dGVyfVxuICogQGZpcmVzIHVwZGF0ZVxuICogQGZpcmVzIHJlbmRlclxuICogQGV4YW1wbGVcbiAqIHZhciBUaWNrZXIgPSByZXF1aXJlKCAndjYuanMvVGlja2VyJyApO1xuICogdmFyIHRpY2tlciA9IG5ldyBUaWNrZXIoKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlwidXBkYXRlXCIgZXZlbnQuPC9jYXB0aW9uPlxuICogLy8gRmlyZXMgZXZlcnl0aW1lIGFuIGFwcGxpY2F0aW9uIHNob3VsZCBiZSB1cGRhdGVkLlxuICogLy8gRGVwZW5kcyBvbiBtYXhpbXVtIEZQUy5cbiAqIHRpY2tlci5vbiggJ3VwZGF0ZScsIGZ1bmN0aW9uICggZWxhcHNlZFRpbWUgKSB7XG4gKiAgIHNoYXBlLnJvdGF0aW9uICs9IDEwICogZWxhcHNlZFRpbWU7XG4gKiB9ICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5cInJlbmRlclwiIGV2ZW50LjwvY2FwdGlvbj5cbiAqIC8vIEZpcmVzIGV2ZXJ5dGltZSBhbiBhcHBsaWNhdGlvbiBzaG91bGQgYmUgcmVuZGVyZWQuXG4gKiAvLyBVbmxpa2UgXCJ1cGRhdGVcIiwgaW5kZXBlbmRlbnQgZnJvbSBtYXhpbXVtIEZQUy5cbiAqIHRpY2tlci5vbiggJ3JlbmRlcicsIGZ1bmN0aW9uICgpIHtcbiAqICAgcmVuZGVyZXIucm90YXRlKCBzaGFwZS5yb3RhdGlvbiApO1xuICogfSApO1xuICovXG5mdW5jdGlvbiBUaWNrZXIgKClcbntcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIExpZ2h0RW1pdHRlci5jYWxsKCB0aGlzICk7XG5cbiAgdGhpcy5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSAwO1xuICB0aGlzLmxhc3RSZXF1ZXN0VGltZSA9IDA7XG4gIHRoaXMuc2tpcHBlZFRpbWUgPSAwO1xuICB0aGlzLnRvdGFsVGltZSA9IDA7XG4gIHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiDQl9Cw0L/Rg9GB0LrQsNC10YIg0YbQuNC60Lsg0LDQvdC40LzQsNGG0LjQuC5cbiAgICogQG1ldGhvZCB2Ni5UaWNrZXIjc3RhcnRcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiB0aWNrZXIuc3RhcnQoKTtcbiAgICovXG4gIGZ1bmN0aW9uIHN0YXJ0ICggX25vdyApXG4gIHtcbiAgICB2YXIgZWxhcHNlZFRpbWU7XG5cbiAgICBpZiAoICEgc2VsZi5ydW5uaW5nICkge1xuICAgICAgaWYgKCAhIF9ub3cgKSB7XG4gICAgICAgIHNlbGYubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlEID0gdGltZXIucmVxdWVzdCggc3RhcnQgKTtcbiAgICAgICAgc2VsZi5sYXN0UmVxdWVzdFRpbWUgPSB0aW1lc3RhbXAoKTtcbiAgICAgICAgc2VsZi5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taW52YWxpZC10aGlzXG4gICAgfVxuXG4gICAgaWYgKCAhIF9ub3cgKSB7XG4gICAgICBfbm93ID0gdGltZXN0YW1wKCk7XG4gICAgfVxuXG4gICAgZWxhcHNlZFRpbWUgPSBNYXRoLm1pbiggMSwgKCBfbm93IC0gc2VsZi5sYXN0UmVxdWVzdFRpbWUgKSAqIDAuMDAxICk7XG5cbiAgICBzZWxmLnNraXBwZWRUaW1lICs9IGVsYXBzZWRUaW1lO1xuICAgIHNlbGYudG90YWxUaW1lICAgKz0gZWxhcHNlZFRpbWU7XG5cbiAgICB3aGlsZSAoIHNlbGYuc2tpcHBlZFRpbWUgPj0gc2VsZi5zdGVwICYmIHNlbGYucnVubmluZyApIHtcbiAgICAgIHNlbGYuc2tpcHBlZFRpbWUgLT0gc2VsZi5zdGVwO1xuICAgICAgc2VsZi5lbWl0KCAndXBkYXRlJywgc2VsZi5zdGVwLCBfbm93ICk7XG4gICAgfVxuXG4gICAgc2VsZi5lbWl0KCAncmVuZGVyJywgZWxhcHNlZFRpbWUsIF9ub3cgKTtcbiAgICBzZWxmLmxhc3RSZXF1ZXN0VGltZSA9IF9ub3c7XG4gICAgc2VsZi5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSB0aW1lci5yZXF1ZXN0KCBzdGFydCApO1xuXG4gICAgcmV0dXJuIHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taW52YWxpZC10aGlzXG4gIH1cblxuICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XG4gIHRoaXMuZnBzKCA2MCApO1xufVxuXG5UaWNrZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggTGlnaHRFbWl0dGVyLnByb3RvdHlwZSApO1xuVGlja2VyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRpY2tlcjtcblxuLyoqXG4gKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiDQvNCw0LrRgdC40LzQsNC70YzQvdC+0LUg0LrQvtC70LjRh9C10YHRgtCy0L4g0LrQsNC00YDQvtCyINCyINGB0LXQutGD0L3QtNGDIChGUFMpINCw0L3QuNC80LDRhtC40LguXG4gKiBAbWV0aG9kIHY2LlRpY2tlciNmcHNcbiAqIEBwYXJhbSB7bnVtYmVyfSBmcHMg0JzQsNC60YHQuNC80LDQu9GM0L3Ri9C5IEZQUywg0L3QsNC/0YDQuNC80LXRgDogNjAuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogLy8gU2V0IG1heGltdW0gYW5pbWF0aW9uIEZQUyB0byAxMC5cbiAqIC8vIERvIG5vdCBuZWVkIHRvIHJlc3RhcnQgdGlja2VyLlxuICogdGlja2VyLmZwcyggMTAgKTtcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5mcHMgPSBmdW5jdGlvbiBmcHMgKCBmcHMgKVxue1xuICB0aGlzLnN0ZXAgPSAxIC8gZnBzO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjY2xlYXJcbiAqIEBjaGFpbmFibGVcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuc2tpcHBlZFRpbWUgPSAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0J7RgdGC0LDQvdCw0LLQu9C40LLQsNC10YIg0LDQvdC40LzQsNGG0LjRji5cbiAqIEBtZXRob2QgdjYuVGlja2VyI3N0b3BcbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiB0aWNrZXIub24oICdyZW5kZXInLCBmdW5jdGlvbiAoKSB7XG4gKiAgIC8vIFN0b3AgdGhlIHRpY2tlciBhZnRlciBmaXZlIHNlY29uZHMuXG4gKiAgIGlmICggdGhpcy50b3RhbFRpbWUgPj0gNSApIHtcbiAqICAgICB0aWNrZXIuc3RvcCgpO1xuICogICB9XG4gKiB9ICk7XG4gKi9cblRpY2tlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIHN0b3AgKClcbntcbiAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUaWNrZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBtYXQzID0gcmVxdWlyZSggJy4vbWF0aC9tYXQzJyApO1xuXG5mdW5jdGlvbiBUcmFuc2Zvcm0gKClcbntcbiAgdGhpcy5tYXRyaXggPSBtYXQzLmlkZW50aXR5KCk7XG4gIHRoaXMuX2luZGV4ID0gLTE7XG4gIHRoaXMuX3N0YWNrID0gW107XG59XG5cblRyYW5zZm9ybS5wcm90b3R5cGUgPSB7XG4gIHNhdmU6IGZ1bmN0aW9uIHNhdmUgKClcbiAge1xuICAgIGlmICggKyt0aGlzLl9pbmRleCA8IHRoaXMuX3N0YWNrLmxlbmd0aCApIHtcbiAgICAgIG1hdDMuY29weSggdGhpcy5fc3RhY2tbIHRoaXMuX2luZGV4IF0sIHRoaXMubWF0cml4ICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3N0YWNrLnB1c2goIG1hdDMuY2xvbmUoIHRoaXMubWF0cml4ICkgKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVzdG9yZTogZnVuY3Rpb24gcmVzdG9yZSAoKVxuICB7XG4gICAgaWYgKCB0aGlzLl9pbmRleCA+PSAwICkge1xuICAgICAgbWF0My5jb3B5KCB0aGlzLm1hdHJpeCwgdGhpcy5fc3RhY2tbIHRoaXMuX2luZGV4LS0gXSApO1xuICAgIH0gZWxzZSB7XG4gICAgICBtYXQzLnNldElkZW50aXR5KCB0aGlzLm1hdHJpeCApO1xuICAgIH1cbiAgfSxcblxuICBzZXRUcmFuc2Zvcm06IGZ1bmN0aW9uIHNldFRyYW5zZm9ybSAoIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbiAge1xuICAgIG1hdDMuc2V0VHJhbnNmb3JtKCB0aGlzLm1hdHJpeCwgbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKTtcbiAgfSxcblxuICB0cmFuc2xhdGU6IGZ1bmN0aW9uIHRyYW5zbGF0ZSAoIHgsIHkgKVxuICB7XG4gICAgbWF0My50cmFuc2xhdGUoIHRoaXMubWF0cml4LCB4LCB5ICk7XG4gIH0sXG5cbiAgcm90YXRlOiBmdW5jdGlvbiByb3RhdGUgKCBhbmdsZSApXG4gIHtcbiAgICBtYXQzLnJvdGF0ZSggdGhpcy5tYXRyaXgsIGFuZ2xlICk7XG4gIH0sXG5cbiAgc2NhbGU6IGZ1bmN0aW9uIHNjYWxlICggeCwgeSApXG4gIHtcbiAgICBtYXQzLnNjYWxlKCB0aGlzLm1hdHJpeCwgeCwgeSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQn9GA0LjQvNC10L3Rj9C10YIgXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIiDQuNC3INGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7QsiDQvdCwINGC0LXQutGD0YnQuNC5IFwidHJhbnNmb3JtYXRpb24gbWF0cml4XCIuXG4gICAqIEBtZXRob2QgdjYuVHJhbnNmb3JtI3RyYW5zZm9ybVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMTEgWCBzY2FsZS5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgbTEyIFggc2tldy5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgbTIxIFkgc2tldy5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgbTIyIFkgc2NhbGUuXG4gICAqIEBwYXJhbSAge251bWJlcn0gIGR4ICBYIHRyYW5zbGF0ZS5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgZHkgIFkgdHJhbnNsYXRlLlxuICAgKiBAcmV0dXJuIHt2b2lkfSAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEFwcGx5IHNjYWxlZCB0d2ljZSBcInRyYW5zZm9ybWF0aW9uIG1hdHJpeFwiLlxuICAgKiB0cmFuc2Zvcm0udHJhbnNmb3JtKCAyLCAwLCAwLCAyLCAwLCAwICk7XG4gICAqL1xuICB0cmFuc2Zvcm06IGZ1bmN0aW9uIHRyYW5zZm9ybSAoIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbiAge1xuICAgIG1hdDMudHJhbnNmb3JtKCB0aGlzLm1hdHJpeCwgbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKTtcbiAgfSxcblxuICBjb25zdHJ1Y3RvcjogVHJhbnNmb3JtXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoICdwZWFrby9kZWZhdWx0cycgKTtcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICcuL3NldHRpbmdzJyApO1xuLyoqXG4gKiDQmtC70LDRgdGBINC60LDQvNC10YDRiy4g0K3RgtC+0YIg0LrQu9Cw0YHRgSDRg9C00L7QsdC10L0g0LTQu9GPINGB0L7Qt9C00LDQvdC40Y8g0LrQsNC80LXRgNGLLCDQutC+0YLQvtGA0LDRjyDQtNC+0LvQttC90LAg0LHRi9GC0YxcbiAqINC90LDQv9GA0LDQstC70LXQvdC90LAg0L3QsCDQvtC/0YDQtdC00LXQu9C10L3QvdGL0Lkg0L7QsdGK0LXQutGCINCyINC/0YDQuNC70L7QttC10L3QuNC4LCDQvdCw0L/RgNC40LzQtdGAOiDQvdCwINC80LDRiNC40L3RgyDQslxuICog0LPQvtC90L7Rh9C90L7QuSDQuNCz0YDQtS4g0JrQsNC80LXRgNCwINCx0YPQtNC10YIg0YHQsNC80LAg0L/Qu9Cw0LLQvdC+INC4INGBINCw0L3QuNC80LDRhtC40LXQuSDQvdCw0L/RgNCw0LLQu9GP0YLRjNGB0Y8g0L3QsCDQvdGD0LbQvdGL0LlcbiAqINC+0LHRitC10LrRgi4g0JXRgdGC0Ywg0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQsNC90LjQvNC40YDQvtCy0LDQvdC90L7Qs9C+INC+0YLQtNCw0LvQtdC90LjRjyDQuNC70Lgg0L/RgNC40LHQu9C40LbQtdC90LjRjyDQutCw0LzQtdGA0YsuXG4gKiBAY29uc3RydWN0b3IgdjYuQ2FtZXJhXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdINCf0LDRgNCw0LzQtdGC0YDRiyDQtNC70Y8g0YHQvtC30LTQsNC90LjRjyDQutCw0LzQtdGA0YssINGB0LzQvtGC0YDQuNGC0LUge0BsaW5rIHY2LnNldHRpbmdzLmNhbWVyYX0uXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5SZXF1aXJlIFwidjYuQ2FtZXJhXCI8L2NhcHRpb24+XG4gKiB2YXIgQ2FtZXJhID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY2FtZXJhL0NhbWVyYScgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhbiBpbnN0YW5jZTwvY2FwdGlvbj5cbiAqIHZhciBjYW1lcmEgPSBuZXcgQ2FtZXJhKCk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGUgYW4gaW5zdGFuY2Ugd2l0aCBvcHRpb25zPC9jYXB0aW9uPlxuICogdmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEoIHtcbiAqICAgc2V0dGluZ3M6IHtcbiAqICAgICBzcGVlZDoge1xuICogICAgICAgeDogMC4xNSxcbiAqICAgICAgIHk6IDAuMTVcbiAqICAgICB9XG4gKiAgIH1cbiAqIH0gKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhbiBpbnN0YW5jZSB3aXRoIHJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEoIHtcbiAqICAgcmVuZGVyZXI6IHJlbmRlcmVyXG4gKiB9ICk7XG4gKi9cbmZ1bmN0aW9uIENhbWVyYSAoIG9wdGlvbnMgKVxue1xuICB2YXIgeCwgeTtcbiAgb3B0aW9ucyA9IGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApO1xuICAvKipcbiAgICog0J3QsNGB0YLRgNC+0LnQutC4INC60LDQvNC10YDRiywg0YLQsNC60LjQtSDQutCw0Log0YHQutC+0YDQvtGB0YLRjCDQsNC90LjQvNCw0YbQuNC4INC40LvQuCDQvNCw0YHRiNGC0LDQsS5cbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5DYW1lcmEjc2V0dGluZ3NcbiAgICogQHNlZSB2Ni5zZXR0aW5ncy5jYW1lcmEuc2V0dGluZ3NcbiAgICovXG4gIHRoaXMuc2V0dGluZ3MgPSBvcHRpb25zLnNldHRpbmdzO1xuICBpZiAoIG9wdGlvbnMucmVuZGVyZXIgKSB7XG4gICAgLyoqXG4gICAgICog0KDQtdC90LTQtdGA0LXRgC5cbiAgICAgKiBAbWVtYmVyIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfHZvaWR9IHY2LkNhbWVyYSNyZW5kZXJlclxuICAgICAqL1xuICAgIHRoaXMucmVuZGVyZXIgPSBvcHRpb25zLnJlbmRlcmVyO1xuICB9XG4gIGlmICggISB0aGlzLnNldHRpbmdzLm9mZnNldCApIHtcbiAgICBpZiAoIHRoaXMucmVuZGVyZXIgKSB7XG4gICAgICB4ID0gdGhpcy5yZW5kZXJlci53ICogMC41O1xuICAgICAgeSA9IHRoaXMucmVuZGVyZXIuaCAqIDAuNTtcbiAgICB9IGVsc2Uge1xuICAgICAgeCA9IDA7XG4gICAgICB5ID0gMDtcbiAgICB9XG4gICAgdGhpcy5zZXR0aW5ncy5vZmZzZXQgPSB7XG4gICAgICB4OiB4LFxuICAgICAgeTogeVxuICAgIH07XG4gIH1cbiAgLyoqXG4gICAqINCe0LHRitC10LrRgiwg0L3QsCDQutC+0YLQvtGA0YvQuSDQvdCw0L/RgNCw0LLQu9C10L3QsCDQutCw0LzQtdGA0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge29iamVjdD99IHY2LkNhbWVyYSNfZGVzdGluYXRpb25cbiAgICogQHNlZSB2Ni5DYW1lcmEjbG9va0F0XG4gICAqL1xuICB0aGlzLl9kZXN0aW5hdGlvbiA9IG51bGw7XG4gIC8qKlxuICAgKiDQodCy0L7QudGB0YLQstC+LCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDQsdGA0LDRgtGMINC40Lcge0BsaW5rIHY2LkNhbWVyYSNfZGVzdGluYXRpb259LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtzdHJpbmc/fSB2Ni5DYW1lcmEjX2Rlc3RpbmF0aW9uS2V5XG4gICAqIEBzZWUgdjYuQ2FtZXJhI2xvb2tBdFxuICAgKi9cbiAgdGhpcy5fZGVzdGluYXRpb25LZXkgPSBudWxsO1xuICAvKipcbiAgICog0KLQtdC60YPRidGP0Y8g0L/QvtC30LjRhtC40Y8g0LrQsNC80LXRgNGLICjRgdGO0LTQsCDQvdCw0L/RgNCw0LLQu9C10L3QsCDQutCw0LzQtdGA0LApLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtJVmVjdG9yMkR9IHY2LkNhbWVyYSNfY3VycmVudFBvc2l0aW9uXG4gICAqL1xuICB0aGlzLl9jdXJyZW50UG9zaXRpb24gPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH07XG59XG5DYW1lcmEucHJvdG90eXBlID0ge1xuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0L7QsdGK0LXQutGCLCDQvdCwINC60L7RgtC+0YDRi9C5INC60LDQvNC10YDQsCDQtNC+0LvQttC90LAg0LHRi9GC0Ywg0L3QsNC/0YDQsNCy0LvQtdC90LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI19nZXREZXN0aW5hdGlvblxuICAgKiBAcmV0dXJuIHtJVmVjdG9yMkQ/fSDQntCx0YrQtdC60YIg0LjQu9C4IFwibnVsbFwiLlxuICAgKi9cbiAgX2dldERlc3RpbmF0aW9uOiBmdW5jdGlvbiBfZ2V0RGVzdGluYXRpb24gKClcbiAge1xuICAgIHZhciBfZGVzdGluYXRpb25LZXkgPSB0aGlzLl9kZXN0aW5hdGlvbktleTtcbiAgICBpZiAoIF9kZXN0aW5hdGlvbktleSA9PT0gbnVsbCApIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZXN0aW5hdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2Rlc3RpbmF0aW9uWyBfZGVzdGluYXRpb25LZXkgXTtcbiAgfSxcbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINC90LDRgdGC0YDQvtC50LrQuC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjc2V0XG4gICAqIEBwYXJhbSAge3N0cmluZ30gc2V0dGluZyDQmNC80Y8g0L3QsNGB0YLRgNC+0LnQutC4OiBcInpvb20tb3V0IHNwZWVkXCIsIFwiem9vbS1pbiBzcGVlZFwiLCBcIm9mZnNldFwiLCBcInNwZWVkXCIsIFwiem9vbVwiLlxuICAgKiBAcGFyYW0gIHthbnl9ICAgIHZhbHVlICAg0J3QvtCy0L7QtSDQt9C90LDRh9C10L3QuNC1INC90LDRgdGC0YDQvtC50LrQuC5cbiAgICogQHJldHVybiB7dm9pZH0gICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9GA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IHpvb20taW4gc3BlZWQgc2V0dGluZyB0byAwLjAwMjUgd2l0aCBsaW5lYXIgZmxhZyAoZGVmYXVsdDogdHJ1ZSkuXG4gICAqIGNhbWVyYS5zZXQoICd6b29tLWluIHNwZWVkJywgeyB2YWx1ZTogMC4wMDI1LCBsaW5lYXI6IHRydWUgfSApO1xuICAgKiAvLyBUdXJuIG9mZiBsaW5lYXIgZmxhZy5cbiAgICogY2FtZXJhLnNldCggJ3pvb20taW4gc3BlZWQnLCB7IGxpbmVhcjogZmFsc2UgfSApO1xuICAgKiAvLyBTZXQgem9vbSBzZXR0aW5nIHRvIDEgd2l0aCByYW5nZSBbIDAuNzUgLi4gMS4xMjUgXS5cbiAgICogY2FtZXJhLnNldCggJ3pvb20nLCB7IHZhbHVlOiAxLCBtaW46IDAuNzUsIG1heDogMS4xMjUgfSApO1xuICAgKiAvLyBTZXQgY2FtZXJhIHNwZWVkLlxuICAgKiBjYW1lcmEuc2V0KCAnc3BlZWQnLCB7IHg6IDAuMSwgeTogMC4xIH0gKTtcbiAgICovXG4gIHNldDogZnVuY3Rpb24gc2V0ICggc2V0dGluZywgdmFsdWUgKVxuICB7XG4gICAgdmFyIHNldHRpbmdfID0gdGhpcy5nZXQoIHNldHRpbmcgKTtcbiAgICBmb3IgKCB2YXIgX2tleXMgPSBPYmplY3Qua2V5cyggdmFsdWUgKSwgX2kgPSAwLCBfbCA9IF9rZXlzLmxlbmd0aDsgX2kgPCBfbDsgKytfaSApIHtcbiAgICAgIHNldHRpbmdfWyBfa2V5c1sgX2kgXSBdID0gdmFsdWVbIF9rZXlzWyBfaSBdIF07XG4gICAgfVxuICB9LFxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LfQvdCw0YfQtdC90LjQtSDQvdCw0YHRgtGA0L7QudC60LguXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI2dldFxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHNldHRpbmcg0JjQvNGPINC90LDRgdGC0YDQvtC50LrQuDogXCJ6b29tLW91dCBzcGVlZFwiLCBcInpvb20taW4gc3BlZWRcIiwgXCJvZmZzZXRcIiwgXCJzcGVlZFwiLCBcInpvb21cIi5cbiAgICogQHJldHVybiB7YW55fSAgICAgICAgICAgINCX0L3QsNGH0LXQvdC40LUg0L3QsNGB0YLRgNC+0LnQutC4LlxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBHZXQgY3VycmVudCBjYW1lcmEgem9vbS5cbiAgICogdmFyIHpvb20gPSBjYW1lcmEuZ2V0KCAnem9vbScgKS52YWx1ZTtcbiAgICovXG4gIGdldDogZnVuY3Rpb24gZ2V0ICggc2V0dGluZyApXG4gIHtcbiAgICBDSEVDSyggc2V0dGluZyApO1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzWyBzZXR0aW5nIF07XG4gIH0sXG4gIC8qKlxuICAgKiDQndCw0L/RgNCw0LLQu9GP0LXRgiDQutCw0LzQtdGA0YMg0L3QsCDQvtC/0YDQtdC00LXQu9C10L3QvdGD0Y4g0L/QvtC30LjRhtC40Y4gKGBcImRlc3RpbmF0aW9uXCJgKS5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjbG9va0F0XG4gICAqIEBwYXJhbSAge0lWZWN0b3IyRH0gZGVzdGluYXRpb24g0J/QvtC30LjRhtC40Y8sINCyINC60L7RgtC+0YDRg9GOINC00L7Qu9C20L3QsCDRgdC80L7RgtGA0LXRgtGMINC60LDQvNC10YDQsC5cbiAgICogQHBhcmFtICB7c3RyaW5nfSAgIFtrZXldICAgICAgICDQodCy0L7QudGB0YLQstC+LCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDQsdGA0LDRgtGMINC40LcgYFwiZGVzdGluYXRpb25cImAuXG4gICAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30YDQsNGJ0LDQtdGCLlxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgY2FyID0ge1xuICAgKiAgIHBvc2l0aW9uOiB7XG4gICAqICAgICB4OiA0LFxuICAgKiAgICAgeTogMlxuICAgKiAgIH1cbiAgICogfTtcbiAgICogLy8gRGlyZWN0IGEgY2FtZXJhIG9uIHRoZSBjYXIuXG4gICAqIGNhbWVyYS5sb29rQXQoIGNhciwgJ3Bvc2l0aW9uJyApO1xuICAgKiAvLyBUaGlzIHdheSB3b3JrcyB0b28gYnV0IGlmIHRoZSAncG9zaXRpb24nIHdpbGwgYmUgcmVwbGFjZWQgaXQgd291bGQgbm90IHdvcmsuXG4gICAqIGNhbWVyYS5sb29rQXQoIGNhci5wb3NpdGlvbiApO1xuICAgKi9cbiAgbG9va0F0OiBmdW5jdGlvbiBsb29rQXQgKCBkZXN0aW5hdGlvbiwga2V5IClcbiAge1xuICAgIHRoaXMuX2Rlc3RpbmF0aW9uID0gZGVzdGluYXRpb247XG4gICAgaWYgKCB0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgIHRoaXMuX2Rlc3RpbmF0aW9uS2V5ID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZGVzdGluYXRpb25LZXkgPSBrZXk7XG4gICAgfVxuICB9LFxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0L/QvtC30LjRhtC40Y4sINC90LAg0LrQvtGC0L7RgNGD0Y4g0LrQsNC80LXRgNCwINC00L7Qu9C20L3QsCDQsdGL0YLRjCDQvdCw0L/RgNCw0LLQu9C10L3QsC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjc2hvdWxkTG9va0F0XG4gICAqIEByZXR1cm4ge0lWZWN0b3IyRH0g0J/QvtC30LjRhtC40Y8uXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBvYmplY3QgPSB7XG4gICAqICAgcG9zaXRpb246IHsgeDogNCwgeTogMiB9XG4gICAqIH07XG4gICAqXG4gICAqIGNhbWVyYS5zaG91bGRMb29rQXQoKTsgLy8gLT4geyB4OiAwLCB5OiAwIH0uXG4gICAqIGNhbWVyYS5sb29rQXQoIG9iamVjdCwgJ3Bvc2l0aW9uJyApO1xuICAgKiBjYW1lcmEuc2hvdWxkTG9va0F0KCk7IC8vIC0+IHsgeDogNCwgeTogMiB9IChjbG9uZSkuXG4gICAqL1xuICBzaG91bGRMb29rQXQ6IGZ1bmN0aW9uIHNob3VsZExvb2tBdCAoKVxuICB7XG4gICAgdmFyIF9kZXN0aW5hdGlvbiA9IHRoaXMuX2dldERlc3RpbmF0aW9uKCk7XG4gICAgdmFyIHgsIHk7XG4gICAgaWYgKCBfZGVzdGluYXRpb24gPT09IG51bGwgKSB7XG4gICAgICB4ID0gMDtcbiAgICAgIHkgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gX2Rlc3RpbmF0aW9uLng7XG4gICAgICB5ID0gX2Rlc3RpbmF0aW9uLnk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB4OiB4LFxuICAgICAgeTogeVxuICAgIH07XG4gIH0sXG4gIC8qKlxuICAgKiDQntCx0L3QvtCy0LvRj9C10YIg0L/QvtC30LjRhtC40Y4sINC90LAg0LrQvtGC0L7RgNGD0Y4g0L3QsNC/0YDQsNCy0LvQtdC90LAg0LrQsNC80LXRgNCwLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSN1cGRhdGVcbiAgICogQHJldHVybiB7dm9pZH0g0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gICAqIEBleGFtcGxlXG4gICAqIHRpY2tlci5vbiggJ3VwZGF0ZScsIGZ1bmN0aW9uICgpXG4gICAqIHtcbiAgICogICAvLyBVcGRhdGUgYSBjYW1lcmEgb24gZWFjaCBmcmFtZS5cbiAgICogICBjYW1lcmEudXBkYXRlKCk7XG4gICAqIH0gKTtcbiAgICovXG4gIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlICgpXG4gIHtcbiAgICB2YXIgX2Rlc3RpbmF0aW9uID0gdGhpcy5fZ2V0RGVzdGluYXRpb24oKTtcbiAgICBpZiAoIF9kZXN0aW5hdGlvbiAhPT0gbnVsbCApIHtcbiAgICAgIHRyYW5zbGF0ZSggdGhpcywgX2Rlc3RpbmF0aW9uLCAneCcgKTtcbiAgICAgIHRyYW5zbGF0ZSggdGhpcywgX2Rlc3RpbmF0aW9uLCAneScgKTtcbiAgICB9XG4gIH0sXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQv9C+0LfQuNGG0LjRjiwg0L3QsCDQutC+0YLQvtGA0YPRjiDQutCw0LzQtdGA0LAg0L3QsNC/0YDQsNCy0LvQtdC90LAg0YHQtdC50YfQsNGBLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNsb29rc0F0XG4gICAqIEByZXR1cm4ge0lWZWN0b3IyRH0g0KLQtdC60YPRidC10LUg0L3QsNC/0YDQsNCy0LvQtdC90LjQtSDQutCw0LzQtdGA0YsuXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEEgY2FtZXJhIGxvb2tzIGF0IFsgeCwgeSBdIGZyb20gbG9va3NBdCBub3cuXG4gICAqIHZhciBsb29rc0F0ID0gY2FtZXJhLmxvb2tzQXQoKTtcbiAgICovXG4gIGxvb2tzQXQ6IGZ1bmN0aW9uIGxvb2tzQXQgKClcbiAge1xuICAgIHJldHVybiB7XG4gICAgICB4OiB0aGlzLl9jdXJyZW50UG9zaXRpb24ueCxcbiAgICAgIHk6IHRoaXMuX2N1cnJlbnRQb3NpdGlvbi55XG4gICAgfTtcbiAgfSxcbiAgLyoqXG4gICAqINCf0YDQuNC80LXQvdGP0LXRgiDQutCw0LzQtdGA0YMg0L3QsCDQvNCw0YLRgNC40YbRgyDQuNC70Lgg0YDQtdC90LTQtdGA0LXRgC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjYXBwbHlcbiAgICogQHBhcmFtICB7djYuVHJhbnNmb3JtfHY2LkFic3RyYWN0UmVuZGVyZXJ9IFttYXRyaXhdINCc0LDRgtGA0LjRhtCwINC40LvQuCDRgNC10L3QtNC10YDQtdGALlxuICAgKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPkFwcGx5IG9uIGEgcmVuZGVyZXI8L2NhcHRpb24+XG4gICAqIHZhciByZW5kZXJlciA9IHY2LmNyZWF0ZVJlbmRlcmVyKCk7XG4gICAqIGNhbWVyYS5hcHBseSggcmVuZGVyZXIgKTtcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+QXBwbHkgb24gYSB0cmFuc2Zvcm08L2NhcHRpb24+XG4gICAqIHZhciBtYXRyaXggPSBuZXcgdjYuVHJhbnNmb3JtKCk7XG4gICAqIGNhbWVyYS5hcHBseSggbWF0cml4ICk7XG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPkFwcGx5IG9uIGEgY2FtZXJhJ3MgcmVuZGVyZXI8L2NhcHRpb24+XG4gICAqIHZhciBjYW1lcmEgPSBuZXcgdjYuQ2FtZXJhKCB7XG4gICAqICAgcmVuZGVyZXI6IHJlbmRlcmVyXG4gICAqIH0gKTtcbiAgICpcbiAgICogY2FtZXJhLmFwcGx5KCk7XG4gICAqL1xuICBhcHBseTogZnVuY3Rpb24gYXBwbHkgKCBtYXRyaXggKVxuICB7XG4gICAgdmFyIHpvb20gPSB0aGlzLnNldHRpbmdzLnpvb20udmFsdWU7XG4gICAgdmFyIHggPSB0cmFuc2Zvcm0oIHRoaXMsIHRoaXMuX2N1cnJlbnRQb3NpdGlvbiwgJ3gnICk7XG4gICAgdmFyIHkgPSB0cmFuc2Zvcm0oIHRoaXMsIHRoaXMuX2N1cnJlbnRQb3NpdGlvbiwgJ3knICk7XG4gICAgKCBtYXRyaXggfHwgdGhpcy5yZW5kZXJlciApLnNldFRyYW5zZm9ybSggem9vbSwgMCwgMCwgem9vbSwgem9vbSAqIHgsIHpvb20gKiB5ICk7XG4gIH0sXG4gIC8qKlxuICAgKiDQntC/0YDQtdC00LXQu9GP0LXRgiwg0LLQuNC00LjRgiDQu9C4INC60LDQvNC10YDQsCDQvtCx0YrQtdC60YIg0LjQtyDRgdC+0L7RgtCy0LXRgtGB0LLRg9GO0YnQuNGFINC/0LDRgNCw0LLQtdGC0YDQvtCyICh4LCB5LCB3LCBoKSDRgdC10LnRh9Cw0YEsXG4gICAqINC10YHQu9C4INC90LXRgiwg0YLQviDRjdGC0L7RgiDQvtCx0YrQtdC60YIg0LzQvtC20L3QviDQvdC1INC+0YLRgNC40YHQvtCy0YvQstCw0YLRjC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjc2Vlc1xuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB4ICAgICAgICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L7QsdGK0LXQutGC0LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIHkgICAgICAgICAgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQvtCx0YrQtdC60YLQsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgdyAgICAgICAgICDQqNC40YDQuNC90LAg0L7QsdGK0LXQutGC0LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIGggICAgICAgICAg0JLRi9GB0L7RgtCwINC+0LHRitC10LrRgtCwLlxuICAgKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSBbcmVuZGVyZXJdINCg0LXQvdC00LXRgNC10YAuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgYHRydWVgLCDQtdGB0LvQuCDQvtCx0YrQtdC60YIg0LTQvtC70LbQtdC9INCx0YvRgtGMINC+0YLRgNC40YHQvtCy0LDQvS5cbiAgICogQGV4YW1wbGVcbiAgICogaWYgKCBjYW1lcmEuc2Vlcyggb2JqZWN0LngsIG9iamVjdC55LCBvYmplY3Qudywgb2JqZWN0LmggKSApIHtcbiAgICogICBvYmplY3Quc2hvdygpO1xuICAgKiB9XG4gICAqL1xuICBzZWVzOiBmdW5jdGlvbiBzZWVzICggeCwgeSwgdywgaCwgcmVuZGVyZXIgKVxuICB7XG4gICAgdmFyIHpvb20gPSB0aGlzLnNldHRpbmdzLnpvb20udmFsdWU7XG4gICAgdmFyIG9mZnNldCA9IHRoaXMuc2V0dGluZ3Mub2Zmc2V0O1xuICAgIHZhciBfY3VycmVudFBvc2l0aW9uID0gdGhpcy5fY3VycmVudFBvc2l0aW9uO1xuICAgIGlmICggISByZW5kZXJlciApIHtcbiAgICAgIHJlbmRlcmVyID0gdGhpcy5yZW5kZXJlcjtcbiAgICB9XG4gICAgaWYgKCAhIHJlbmRlcmVyICkge1xuICAgICAgdGhyb3cgRXJyb3IoICdObyByZW5kZXJlciAoY2FtZXJhLnNlZXMpJyApO1xuICAgIH1cbiAgICByZXR1cm4geCArIHcgPiBfY3VycmVudFBvc2l0aW9uLnggLSBvZmZzZXQueCAvIHpvb20gJiZcbiAgICAgICAgICAgeCA8IF9jdXJyZW50UG9zaXRpb24ueCArICggcmVuZGVyZXIudyAtIG9mZnNldC54ICkgLyB6b29tICYmXG4gICAgICAgICAgIHkgKyBoID4gX2N1cnJlbnRQb3NpdGlvbi55IC0gb2Zmc2V0LnkgLyB6b29tICYmXG4gICAgICAgICAgIHkgPCBfY3VycmVudFBvc2l0aW9uLnkgKyAoIHJlbmRlcmVyLmggLSBvZmZzZXQueSApIC8gem9vbTtcbiAgfSxcbiAgLyoqXG4gICAqINCe0YLQtNCw0LvRj9C10YIg0LrQsNC80LXRgNGDLiDQkNC90LjQvNCw0YbQuNGPINC80L7QttC10YIg0LHRi9GC0Ywg0LvQuNC90LXQudC90L7QuSAo0L/QviDRg9C80L7Qu9GH0LDQvdC40Y4pINC10YHQu9C4INGN0YLQviDQstC60LvRjtGH0LXQvdC+OlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIGNhbWVyYS5zZXQoICd6b29tLW91dCBzcGVlZCcsIHtcbiAgICogICAvLyBFbmFibGVzIGxpbmVhciBhbmltYXRpb24gKGVuYWJsZWQgYnkgZGVmYXVsdCBidXQgeW91IGNhbiBkaXNhYmxlKS5cbiAgICogICBsaW5lYXI6IHRydWVcbiAgICogfSApO1xuICAgKiBgYGBcbiAgICog0KHQutC+0YDQvtGB0YLRjCDQsNC90LjQvNCw0YbQuNC4INC40LfQvNC10L3Rj9C10YLRgdGPINGH0LXRgNC10LcgYHZhbHVlYDpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiBjYW1lcmEuc2V0KCAnem9vbS1vdXQgc3BlZWQnLCB7XG4gICAqICAgLy8gU2V0IHNsb3cgem9vbS1vdXQgc3BlZWQgKDEgYnkgZGVmYXVsdCkuXG4gICAqICAgdmFsdWU6IDAuMVxuICAgKiB9ICk7XG4gICAqIGBgYFxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSN6b29tT3V0XG4gICAqIEByZXR1cm4ge3ZvaWR9INCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICAgKiBAZXhhbXBsZVxuICAgKiB0aWNrZXIub24oICd1cGRhdGUnLCBmdW5jdGlvbiAoKVxuICAgKiB7XG4gICAqICAgY2FtZXJhLnpvb21PdXQoKTtcbiAgICogfSApO1xuICAgKi9cbiAgem9vbU91dDogZnVuY3Rpb24gem9vbU91dCAoKSB7IHZhciB6b29tU3BlZWQgPSB0aGlzLnNldHRpbmdzWyAnem9vbS1vdXQgc3BlZWQnIF07IHZhciB6b29tID0gdGhpcy5zZXR0aW5ncy56b29tOyB2YXIgY2hhbmdlOyBpZiAoIHpvb20udmFsdWUgIT09IHpvb20ubWluICkgeyBpZiAoIHpvb21TcGVlZC5saW5lYXIgKSB7IGNoYW5nZSA9IHpvb21TcGVlZC52YWx1ZSAqIHpvb20udmFsdWU7IH0gZWxzZSB7IGNoYW5nZSA9IHpvb21TcGVlZC52YWx1ZTsgfSB6b29tLnZhbHVlID0gTWF0aC5tYXgoIHpvb20udmFsdWUgLSBjaGFuZ2UsIHpvb20ubWluICk7IH0gfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQn9GA0LjQsdC70LjQttCw0LXRgiDQutCw0LzQtdGA0YMuINCQ0L3QuNC80LDRhtC40Y8g0LzQvtC20LXRgiDQsdGL0YLRjCDQu9C40L3QtdC50L3QvtC5ICjQv9C+INGD0LzQvtC70YfQsNC90LjRjikg0LXRgdC70Lgg0Y3RgtC+INCy0LrQu9GO0YfQtdC90L46XG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogY2FtZXJhLnNldCggJ3pvb20taW4gc3BlZWQnLCB7XG4gICAqICAgLy8gRW5hYmxlcyBsaW5lYXIgYW5pbWF0aW9uIChlbmFibGVkIGJ5IGRlZmF1bHQgYnV0IHlvdSBjYW4gZGlzYWJsZSkuXG4gICAqICAgbGluZWFyOiB0cnVlXG4gICAqIH0gKTtcbiAgICogYGBgXG4gICAqINCh0LrQvtGA0L7RgdGC0Ywg0LDQvdC40LzQsNGG0LjQuCDQuNC30LzQtdC90Y/QtdGC0YHRjyDRh9C10YDQtdC3IGB2YWx1ZWA6XG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogY2FtZXJhLnNldCggJ3pvb20taW4gc3BlZWQnLCB7XG4gICAqICAgLy8gU2V0IHNsb3cgem9vbS1pbiBzcGVlZCAoMSBieSBkZWZhdWx0KS5cbiAgICogICB2YWx1ZTogMC4xXG4gICAqIH0gKTtcbiAgICogYGBgXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI3pvb21JblxuICAgKiBAcmV0dXJuIHt2b2lkfSDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGVcbiAgICogdGlja2VyLm9uKCAndXBkYXRlJywgZnVuY3Rpb24gKClcbiAgICoge1xuICAgKiAgIGNhbWVyYS56b29tSW4oKTtcbiAgICogfSApO1xuICAgKi9cbiAgem9vbUluOiBmdW5jdGlvbiB6b29tSW4gKCkgeyB2YXIgem9vbVNwZWVkID0gdGhpcy5zZXR0aW5nc1sgJ3pvb20taW4gc3BlZWQnIF07IHZhciB6b29tID0gdGhpcy5zZXR0aW5ncy56b29tOyB2YXIgY2hhbmdlOyBpZiAoIHpvb20udmFsdWUgIT09IHpvb20ubWF4ICkgeyBpZiAoIHpvb21TcGVlZC5saW5lYXIgKSB7IGNoYW5nZSA9IHpvb21TcGVlZC52YWx1ZSAqIHpvb20udmFsdWU7IH0gZWxzZSB7IGNoYW5nZSA9IHpvb21TcGVlZC52YWx1ZTsgfSB6b29tLnZhbHVlID0gTWF0aC5taW4oIHpvb20udmFsdWUgKyBjaGFuZ2UsIHpvb20ubWF4ICk7IH0gfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIGNvbnN0cnVjdG9yOiBDYW1lcmFcbn07XG5mdW5jdGlvbiB0cmFuc2Zvcm0gKCBjYW1lcmEsIHBvc2l0aW9uLCBheGlzIClcbntcbiAgcmV0dXJuIGNhbWVyYS5zZXR0aW5ncy5vZmZzZXRbIGF4aXMgXSAvIGNhbWVyYS5zZXR0aW5ncy56b29tLnZhbHVlIC0gcG9zaXRpb25bIGF4aXMgXTtcbn1cbmZ1bmN0aW9uIHRyYW5zbGF0ZSAoIGNhbWVyYSwgZGVzdGluYXRpb24sIGF4aXMgKVxue1xuICB2YXIgdHJhbnNmb3JtZWREZXN0aW5hdGlvbiA9IHRyYW5zZm9ybSggY2FtZXJhLCBkZXN0aW5hdGlvbiwgYXhpcyApO1xuICB2YXIgdHJhbnNmb3JtZWRDdXJyZW50UG9zaXRpb24gPSB0cmFuc2Zvcm0oIGNhbWVyYSwgY2FtZXJhLl9jdXJyZW50UG9zaXRpb24sIGF4aXMgKTtcbiAgY2FtZXJhLl9jdXJyZW50UG9zaXRpb25bIGF4aXMgXSArPSAoIHRyYW5zZm9ybWVkQ3VycmVudFBvc2l0aW9uIC0gdHJhbnNmb3JtZWREZXN0aW5hdGlvbiApICogY2FtZXJhLnNldHRpbmdzLnNwZWVkWyBheGlzIF07XG59XG5mdW5jdGlvbiBDSEVDSyAoIHNldHRpbmcgKVxue1xuICBzd2l0Y2ggKCBzZXR0aW5nICkge1xuICAgIGNhc2UgJ3pvb20tb3V0IHNwZWVkJzpcbiAgICBjYXNlICd6b29tLWluIHNwZWVkJzpcbiAgICBjYXNlICdvZmZzZXQnOlxuICAgIGNhc2UgJ3NwZWVkJzpcbiAgICBjYXNlICd6b29tJzpcbiAgICAgIHJldHVybjtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoICdHb3QgdW5rbm93biBzZXR0aW5nIGtleTogJyArIHNldHRpbmcgKTtcbn1cbm1vZHVsZS5leHBvcnRzID0gQ2FtZXJhO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCh0YLQsNC90LTQsNGA0YLQvdGL0LUg0L3QsNGB0YLRgNC+0LnQutC4INC60LDQvNC10YDRiy5cbiAqIEBuYW1lc3BhY2UgdjYuc2V0dGluZ3MuY2FtZXJhXG4gKiBAZXhhbXBsZVxuICogdmFyIHNldHRpbmdzID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY2FtZXJhL3NldHRpbmdzJyApO1xuICovXG5cbi8qKlxuICog0KDQtdC90LTQtdGA0LXRgC5cbiAqIEBtZW1iZXIge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHY2LnNldHRpbmdzLmNhbWVyYS5yZW5kZXJlclxuICovXG5cbi8qKlxuICog0KHRgtCw0L3QtNCw0YDRgtC90YvQtSDQvdCw0YHRgtGA0L7QudC60Lgg0LrQsNC80LXRgNGLLlxuICogQG1lbWJlciB7b2JqZWN0fSB2Ni5zZXR0aW5ncy5jYW1lcmEuc2V0dGluZ3NcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAgICBbJ3pvb20tb3V0IHNwZWVkJ11cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3pvb20tb3V0IHNwZWVkJy52YWx1ZT0xXSAgICAg0KHQutC+0YDQvtGB0YLRjCDRg9C80LXQvdGM0YjQtdC90LjRjyDQvNCw0YHRiNGC0LDQsdCwICjQvtGC0LTQsNC70LXQvdC40Y8pINC60LDQvNC10YDRiy5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gICBbJ3pvb20tb3V0IHNwZWVkJy5saW5lYXI9dHJ1ZV0g0JTQtdC70LDRgtGMINCw0L3QuNC80LDRhtC40Y4g0LvQuNC90LXQudC90L7QuS5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAgICBbJ3pvb20taW4gc3BlZWQnXVxuICogQHByb3BlcnR5IHtudW1iZXJ9ICAgIFsnem9vbS1pbiBzcGVlZCcudmFsdWU9MV0gICAgICDQodC60L7RgNC+0YHRgtGMINGD0LLQtdC70LjRh9C10L3QuNGPINC80LDRgdGI0YLQsNCx0LAgKNC/0YDQuNCx0LvQuNC20LXQvdC40Y8pINC60LDQvNC10YDRiy5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gICBbJ3pvb20taW4gc3BlZWQnLmxpbmVhcj10cnVlXSAg0JTQtdC70LDRgtGMINCw0L3QuNC80LDRhtC40Y4g0LvQuNC90LXQudC90L7QuS5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAgICBbJ3pvb20nXVxuICogQHByb3BlcnR5IHtudW1iZXJ9ICAgIFsnem9vbScudmFsdWU9MV0gICAgICAgICAgICAgICDQotC10LrRg9GJ0LjQuSDQvNCw0YHRiNGC0LDQsSDQutCw0LzQtdGA0YsuXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWyd6b29tJy5taW49MV0gICAgICAgICAgICAgICAgINCc0LjQvdC40LzQsNC70YzQvdGL0Lkg0LzQsNGB0YjRgtCw0LEg0LrQsNC80LXRgNGLLlxuICogQHByb3BlcnR5IHtudW1iZXJ9ICAgIFsnem9vbScubWF4PTFdICAgICAgICAgICAgICAgICDQnNCw0LrRgdC40LzQsNC70YzQvdGL0Lkg0LzQsNGB0YjRgtCw0LEg0LrQsNC80LXRgNGLLlxuICogQHByb3BlcnR5IHtvYmplY3R9ICAgIFsnc3BlZWQnXSAgICAgICAgICAgICAgICAgICAgICDQodC60L7RgNC+0YHRgtGMINC90LDQv9GA0LDQstC70LXQvdC40Y8g0LrQsNC80LXRgNGLINC90LAg0L7QsdGK0LXQutGCLlxuICogQHByb3BlcnR5IHtudW1iZXJ9ICAgIFsnc3BlZWQnLng9MV0gICAgICAgICAgICAgICAgICAxIC0g0LzQvtC80LXQvdGC0LDQu9GM0L3QvtC1INC/0LXRgNC10LzQtdGJ0LXQvdC40LUg0L/QviBYLCAwLjEgLSDQvNC10LTQu9C10L3QvdC+0LUuXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWydzcGVlZCcueT0xXSAgICAgICAgICAgICAgICAgIDEgLSDQvNC+0LzQtdC90YLQsNC70YzQvdC+0LUg0L/QtdGA0LXQvNC10YnQtdC90LjQtSDQv9C+IFksIDAuMSAtINC80LXQtNC70LXQvdC90L7QtS5cbiAqIEBwcm9wZXJ0eSB7SVZlY3RvcjJEfSBbJ29mZnNldCddXG4gKi9cbmV4cG9ydHMuc2V0dGluZ3MgPSB7XG4gICd6b29tLW91dCBzcGVlZCc6IHtcbiAgICB2YWx1ZTogIDEsXG4gICAgbGluZWFyOiB0cnVlXG4gIH0sXG5cbiAgJ3pvb20taW4gc3BlZWQnOiB7XG4gICAgdmFsdWU6ICAxLFxuICAgIGxpbmVhcjogdHJ1ZVxuICB9LFxuXG4gICd6b29tJzoge1xuICAgIHZhbHVlOiAxLFxuICAgIG1pbjogICAxLFxuICAgIG1heDogICAxXG4gIH0sXG5cbiAgJ3NwZWVkJzoge1xuICAgIHg6IDEsXG4gICAgeTogMVxuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhTTEE7XG5cbnZhciBjbGFtcCA9IHJlcXVpcmUoICdwZWFrby9jbGFtcCcgKTsgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbnZhciBwYXJzZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3BhcnNlJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbnZhciBSR0JBICA9IHJlcXVpcmUoICcuL1JHQkEnICk7ICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbi8qKlxuICogSFNMQSDRhtCy0LXRgi5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5IU0xBXG4gKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtoXSBIdWUgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtzXSBTYXR1cmF0aW9uIHZhbHVlLlxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbbF0gTGlnaHRuZXNzIHZhbHVlLlxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbYV0gQWxwaGEgdmFsdWUuXG4gKiBAc2VlIHY2LkhTTEEjc2V0XG4gKiBAZXhhbXBsZVxuICogdmFyIEhTTEEgPSByZXF1aXJlKCAndjYuanMvY29yZS9jb2xvci9IU0xBJyApO1xuICpcbiAqIHZhciB0cmFuc3BhcmVudCA9IG5ldyBIU0xBKCAndHJhbnNwYXJlbnQnICk7XG4gKiB2YXIgbWFnZW50YSAgICAgPSBuZXcgSFNMQSggJ21hZ2VudGEnICk7XG4gKiB2YXIgZnVjaHNpYSAgICAgPSBuZXcgSFNMQSggMzAwLCAxMDAsIDUwICk7XG4gKiB2YXIgZ2hvc3QgICAgICAgPSBuZXcgSFNMQSggMTAwLCAwLjEgKTtcbiAqIHZhciB3aGl0ZSAgICAgICA9IG5ldyBIU0xBKCAxMDAgKTtcbiAqIHZhciBibGFjayAgICAgICA9IG5ldyBIU0xBKCk7XG4gKi9cbmZ1bmN0aW9uIEhTTEEgKCBoLCBzLCBsLCBhIClcbntcbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSFNMQSMwIFwiaHVlXCIgdmFsdWUuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkhTTEEjMSBcInNhdHVyYXRpb25cIiB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSFNMQSMyIFwibGlnaHRuZXNzXCIgdmFsdWUuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkhTTEEjMyBcImFscGhhXCIgdmFsdWUuXG4gICAqL1xuXG4gIHRoaXMuc2V0KCBoLCBzLCBsLCBhICk7XG59XG5cbkhTTEEucHJvdG90eXBlID0ge1xuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LLQvtGB0L/RgNC40L3QuNC80LDQtdC80YPRjiDRj9GA0LrQvtGB0YLRjCAocGVyY2VpdmVkIGJyaWdodG5lc3MpINGG0LLQtdGC0LAuXG4gICAqIEBtZXRob2QgdjYuSFNMQSNwZXJjZWl2ZWRCcmlnaHRuZXNzXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoICdtYWdlbnRhJyApLnBlcmNlaXZlZEJyaWdodG5lc3MoKTsgLy8gLT4gMTYzLjg3NTk0MzkzMzIwODJcbiAgICovXG4gIHBlcmNlaXZlZEJyaWdodG5lc3M6IGZ1bmN0aW9uIHBlcmNlaXZlZEJyaWdodG5lc3MgKClcbiAge1xuICAgIHJldHVybiB0aGlzLnJnYmEoKS5wZXJjZWl2ZWRCcmlnaHRuZXNzKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC+0YLQvdC+0YHQuNGC0LXQu9GM0L3Rg9GOINGP0YDQutC+0YHRgtGMINGG0LLQtdGC0LAuXG4gICAqIEBtZXRob2QgdjYuSFNMQSNsdW1pbmFuY2VcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKiBAc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1JlbGF0aXZlX2x1bWluYW5jZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggJ21hZ2VudGEnICkubHVtaW5hbmNlKCk7IC8vIC0+IDcyLjYyNFxuICAgKi9cbiAgbHVtaW5hbmNlOiBmdW5jdGlvbiBsdW1pbmFuY2UgKClcbiAge1xuICAgIHJldHVybiB0aGlzLnJnYmEoKS5sdW1pbmFuY2UoKTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0Y/RgNC60L7RgdGC0Ywg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI2JyaWdodG5lc3NcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9BRVJULyNjb2xvci1jb250cmFzdFxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggJ21hZ2VudGEnICkuYnJpZ2h0bmVzcygpOyAvLyAtPiAxMDUuMzE1XG4gICAqL1xuICBicmlnaHRuZXNzOiBmdW5jdGlvbiBicmlnaHRuZXNzICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5yZ2JhKCkuYnJpZ2h0bmVzcygpO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiBDU1MtY29sb3Ig0YHRgtGA0L7QutGDLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjdG9TdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKiBAZXhhbXBsZVxuICAgKiAnJyArIG5ldyBIU0xBKCAncmVkJyApOyAvLyAtPiBcImhzbGEoMCwgMTAwJSwgNTAlLCAxKVwiXG4gICAqL1xuICB0b1N0cmluZzogZnVuY3Rpb24gdG9TdHJpbmcgKClcbiAge1xuICAgIHJldHVybiAnaHNsYSgnICsgdGhpc1sgMCBdICsgJywgJyArIHRoaXNbIDEgXSArICdcXHUwMDI1LCAnICsgdGhpc1sgMiBdICsgJ1xcdTAwMjUsICcgKyB0aGlzWyAzIF0gKyAnKSc7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIEgsIFMsIEwsIEEg0LfQvdCw0YfQtdC90LjRjy5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI3NldFxuICAgKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtoXSBIdWUgdmFsdWUuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW3NdIFNhdHVyYXRpb24gdmFsdWUuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2xdIExpZ2h0bmVzcyB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbYV0gQWxwaGEgdmFsdWUuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5IU0xBXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCkuc2V0KCAxMDAsIDAuNSApOyAvLyAtPiAwLCAwLCAxMDAsIDAuNVxuICAgKi9cbiAgc2V0OiBmdW5jdGlvbiBzZXQgKCBoLCBzLCBsLCBhIClcbiAge1xuICAgIHN3aXRjaCAoIHRydWUgKSB7XG4gICAgICBjYXNlIHR5cGVvZiBoID09PSAnc3RyaW5nJzpcbiAgICAgICAgaCA9IHBhcnNlKCBoICk7XG4gICAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgIGNhc2UgdHlwZW9mIGggPT09ICdvYmplY3QnICYmIGggIT09IG51bGw6XG4gICAgICAgIGlmICggaC50eXBlICE9PSB0aGlzLnR5cGUgKSB7XG4gICAgICAgICAgaCA9IGhbIHRoaXMudHlwZSBdKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzWyAwIF0gPSBoWyAwIF07XG4gICAgICAgIHRoaXNbIDEgXSA9IGhbIDEgXTtcbiAgICAgICAgdGhpc1sgMiBdID0gaFsgMiBdO1xuICAgICAgICB0aGlzWyAzIF0gPSBoWyAzIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgc3dpdGNoICggdm9pZCAwICkge1xuICAgICAgICAgIGNhc2UgaDpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgbCA9IHMgPSBoID0gMDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgczpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgbCA9IE1hdGguZmxvb3IoIGggKTtcbiAgICAgICAgICAgIHMgPSBoID0gMDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgbDpcbiAgICAgICAgICAgIGEgPSBzO1xuICAgICAgICAgICAgbCA9IE1hdGguZmxvb3IoIGggKTtcbiAgICAgICAgICAgIHMgPSBoID0gMDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgYTpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBoID0gTWF0aC5mbG9vciggaCApO1xuICAgICAgICAgICAgcyA9IE1hdGguZmxvb3IoIHMgKTtcbiAgICAgICAgICAgIGwgPSBNYXRoLmZsb29yKCBsICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzWyAwIF0gPSBoO1xuICAgICAgICB0aGlzWyAxIF0gPSBzO1xuICAgICAgICB0aGlzWyAyIF0gPSBsO1xuICAgICAgICB0aGlzWyAzIF0gPSBhO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQmtC+0L3QstC10YDRgtC40YDRg9C10YIg0LIge0BsaW5rIHY2LlJHQkF9LlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjcmdiYVxuICAgKiBAcmV0dXJuIHt2Ni5SR0JBfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggJ21hZ2VudGEnICkucmdiYSgpOyAvLyAtPiBuZXcgUkdCQSggMjU1LCAwLCAyNTUsIDEgKVxuICAgKi9cbiAgcmdiYTogZnVuY3Rpb24gcmdiYSAoKVxuICB7XG4gICAgdmFyIHJnYmEgPSBuZXcgUkdCQSgpO1xuXG4gICAgdmFyIGggPSB0aGlzWyAwIF0gJSAzNjAgLyAzNjA7XG4gICAgdmFyIHMgPSB0aGlzWyAxIF0gKiAwLjAxO1xuICAgIHZhciBsID0gdGhpc1sgMiBdICogMC4wMTtcblxuICAgIHZhciB0ciA9IGggKyAxIC8gMztcbiAgICB2YXIgdGcgPSBoO1xuICAgIHZhciB0YiA9IGggLSAxIC8gMztcblxuICAgIHZhciBxO1xuXG4gICAgaWYgKCBsIDwgMC41ICkge1xuICAgICAgcSA9IGwgKiAoIDEgKyBzICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHEgPSBsICsgcyAtIGwgKiBzO1xuICAgIH1cblxuICAgIHZhciBwID0gMiAqIGwgLSBxOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbiAgICBpZiAoIHRyIDwgMCApIHtcbiAgICAgICsrdHI7XG4gICAgfVxuXG4gICAgaWYgKCB0ZyA8IDAgKSB7XG4gICAgICArK3RnO1xuICAgIH1cblxuICAgIGlmICggdGIgPCAwICkge1xuICAgICAgKyt0YjtcbiAgICB9XG5cbiAgICBpZiAoIHRyID4gMSApIHtcbiAgICAgIC0tdHI7XG4gICAgfVxuXG4gICAgaWYgKCB0ZyA+IDEgKSB7XG4gICAgICAtLXRnO1xuICAgIH1cblxuICAgIGlmICggdGIgPiAxICkge1xuICAgICAgLS10YjtcbiAgICB9XG5cbiAgICByZ2JhWyAwIF0gPSBmb28oIHRyLCBwLCBxICk7XG4gICAgcmdiYVsgMSBdID0gZm9vKCB0ZywgcCwgcSApO1xuICAgIHJnYmFbIDIgXSA9IGZvbyggdGIsIHAsIHEgKTtcbiAgICByZ2JhWyAzIF0gPSB0aGlzWyAzIF07XG5cbiAgICByZXR1cm4gcmdiYTtcbiAgfSxcblxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSB7QGxpbmsgdjYuSFNMQX0gLSDQuNC90YLQtdGA0L/QvtC70LjRgNC+0LLQsNC90L3Ri9C5INC80LXQttC00YMg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC80Lgg0L/QsNGA0LDQvNC10YLRgNCw0LzQuC5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI2xlcnBcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgaFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBzXG4gICAqIEBwYXJhbSAge251bWJlcn0gIGxcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgdmFsdWVcbiAgICogQHJldHVybiB7djYuSFNMQX1cbiAgICogQHNlZSB2Ni5IU0xBI2xlcnBDb2xvclxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggNTAsIDAuMjUgKS5sZXJwKCAwLCAwLCAxMDAsIDAuNSApOyAvLyAtPiBuZXcgSFNMQSggMCwgMCwgNzUsIDAuMjUgKVxuICAgKi9cbiAgbGVycDogZnVuY3Rpb24gbGVycCAoIGgsIHMsIGwsIHZhbHVlIClcbiAge1xuICAgIHZhciBjb2xvciA9IG5ldyBIU0xBKCk7XG4gICAgY29sb3JbIDAgXSA9IGg7XG4gICAgY29sb3JbIDEgXSA9IHM7XG4gICAgY29sb3JbIDIgXSA9IGw7XG4gICAgcmV0dXJuIHRoaXMubGVycENvbG9yKCBjb2xvciwgdmFsdWUgKTtcbiAgfSxcblxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSB7QGxpbmsgdjYuSFNMQX0gLSDQuNC90YLQtdGA0L/QvtC70LjRgNC+0LLQsNC90L3Ri9C5INC80LXQttC00YMgYGNvbG9yYC5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI2xlcnBDb2xvclxuICAgKiBAcGFyYW0gIHtUQ29sb3J9ICBjb2xvclxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB2YWx1ZVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAc2VlIHY2LkhTTEEjbGVycFxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgYSA9IG5ldyBIU0xBKCA1MCwgMC4yNSApO1xuICAgKiB2YXIgYiA9IG5ldyBIU0xBKCAxMDAsIDAgKTtcbiAgICogdmFyIGMgPSBhLmxlcnBDb2xvciggYiwgMC41ICk7IC8vIC0+IG5ldyBIU0xBKCAwLCAwLCA3NSwgMC4yNSApXG4gICAqL1xuICBsZXJwQ29sb3I6IGZ1bmN0aW9uIGxlcnBDb2xvciAoIGNvbG9yLCB2YWx1ZSApXG4gIHtcbiAgICByZXR1cm4gdGhpcy5yZ2JhKCkubGVycENvbG9yKCBjb2xvciwgdmFsdWUgKS5oc2xhKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LkhTTEF9IC0g0LfQsNGC0LXQvNC90LXQvdC90YvQuSDQuNC70Lgg0LfQsNGB0LLQtdGC0LvQtdC90L3Ri9C5INC90LAgYHBlcmNlbnRhZ2VgINC/0YDQvtGG0LXQvdGC0L7Qsi5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI3NoYWRlXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHBlcmNlbnRhZ2VcbiAgICogQHJldHVybiB7djYuSFNMQX1cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoIDAsIDEwMCwgNzUsIDEgKS5zaGFkZSggLTEwICk7IC8vIC0+IG5ldyBIU0xBKCAwLCAxMDAsIDY1LCAxIClcbiAgICovXG4gIHNoYWRlOiBmdW5jdGlvbiBzaGFkZSAoIHBlcmNlbnRhZ2UgKVxuICB7XG4gICAgdmFyIGhzbGEgPSBuZXcgSFNMQSgpO1xuICAgIGhzbGFbIDAgXSA9IHRoaXNbIDAgXTtcbiAgICBoc2xhWyAxIF0gPSB0aGlzWyAxIF07XG4gICAgaHNsYVsgMiBdID0gY2xhbXAoIHRoaXNbIDIgXSArIHBlcmNlbnRhZ2UsIDAsIDEwMCApO1xuICAgIGhzbGFbIDMgXSA9IHRoaXNbIDMgXTtcbiAgICByZXR1cm4gaHNsYTtcbiAgfSxcblxuICBjb25zdHJ1Y3RvcjogSFNMQVxufTtcblxuLyoqXG4gKiBAbWVtYmVyIHtzdHJpbmd9IHY2LkhTTEEjdHlwZSBgXCJoc2xhXCJgLiDQrdGC0L4g0YHQstC+0LnRgdGC0LLQviDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0LTQu9GPINC60L7QvdCy0LXRgNGC0LjRgNC+0LLQsNC90LjRjyDQvNC10LbQtNGDIHtAbGluayB2Ni5SR0JBfSDQuCB7QGxpbmsgdjYuSFNMQX0uXG4gKi9cbkhTTEEucHJvdG90eXBlLnR5cGUgPSAnaHNsYSc7XG5cbmZ1bmN0aW9uIGZvbyAoIHQsIHAsIHEgKVxue1xuICBpZiAoIHQgPCAxIC8gNiApIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCggKCBwICsgKCBxIC0gcCApICogNiAqIHQgKSAqIDI1NSApO1xuICB9XG5cbiAgaWYgKCB0IDwgMC41ICkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCBxICogMjU1ICk7XG4gIH1cblxuICBpZiAoIHQgPCAyIC8gMyApIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCggKCBwICsgKCBxIC0gcCApICogKCAyIC8gMyAtIHQgKSAqIDYgKSAqIDI1NSApO1xuICB9XG5cbiAgcmV0dXJuIE1hdGgucm91bmQoIHAgKiAyNTUgKTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBSR0JBO1xuXG52YXIgcGFyc2UgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wYXJzZScgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG52YXIgSFNMQSAgPSByZXF1aXJlKCAnLi9IU0xBJyApOyAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG4vKipcbiAqIFJHQkEg0YbQstC10YIuXG4gKiBAY29uc3RydWN0b3IgdjYuUkdCQVxuICogQHBhcmFtIHtudW1iZXJ8VENvbG9yfSBbcl0gUmVkIGNoYW5uZWwgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtnXSBHcmVlbiBjaGFubmVsIHZhbHVlLlxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbYl0gQmx1ZSBjaGFubmVsIHZhbHVlLlxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbYV0gQWxwaGEgY2hhbm5lbCB2YWx1ZS5cbiAqIEBzZWUgdjYuUkdCQSNzZXRcbiAqIEBleGFtcGxlXG4gKiB2YXIgUkdCQSA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2NvbG9yL1JHQkEnICk7XG4gKlxuICogdmFyIHRyYW5zcGFyZW50ID0gbmV3IFJHQkEoICd0cmFuc3BhcmVudCcgKTtcbiAqIHZhciBtYWdlbnRhICAgICA9IG5ldyBSR0JBKCAnbWFnZW50YScgKTtcbiAqIHZhciBmdWNoc2lhICAgICA9IG5ldyBSR0JBKCAyNTUsIDAsIDI1NSApO1xuICogdmFyIGdob3N0ICAgICAgID0gbmV3IFJHQkEoIDI1NSwgMC4xICk7XG4gKiB2YXIgd2hpdGUgICAgICAgPSBuZXcgUkdCQSggMjU1ICk7XG4gKiB2YXIgYmxhY2sgICAgICAgPSBuZXcgUkdCQSgpO1xuICovXG5mdW5jdGlvbiBSR0JBICggciwgZywgYiwgYSApXG57XG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlJHQkEjMCBcInJlZFwiIGNoYW5uZWwgdmFsdWUuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlJHQkEjMSBcImdyZWVuXCIgY2hhbm5lbCB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMyIFwiYmx1ZVwiIGNoYW5uZWwgdmFsdWUuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlJHQkEjMyBcImFscGhhXCIgY2hhbm5lbCB2YWx1ZS5cbiAgICovXG5cbiAgdGhpcy5zZXQoIHIsIGcsIGIsIGEgKTtcbn1cblxuUkdCQS5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQstC+0YHQv9GA0LjQvdC40LzQsNC10LzRg9GOINGP0YDQutC+0YHRgtGMIChwZXJjZWl2ZWQgYnJpZ2h0bmVzcykg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI3BlcmNlaXZlZEJyaWdodG5lc3NcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKiBAc2VlIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS81OTYyNDNcbiAgICogQHNlZSBodHRwOi8vYWxpZW5yeWRlcmZsZXguY29tL2hzcC5odG1sXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAnbWFnZW50YScgKS5wZXJjZWl2ZWRCcmlnaHRuZXNzKCk7IC8vIC0+IDE2My44NzU5NDM5MzMyMDgyXG4gICAqL1xuICBwZXJjZWl2ZWRCcmlnaHRuZXNzOiBmdW5jdGlvbiBwZXJjZWl2ZWRCcmlnaHRuZXNzICgpXG4gIHtcbiAgICB2YXIgciA9IHRoaXNbIDAgXTtcbiAgICB2YXIgZyA9IHRoaXNbIDEgXTtcbiAgICB2YXIgYiA9IHRoaXNbIDIgXTtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCAwLjI5OSAqIHIgKiByICsgMC41ODcgKiBnICogZyArIDAuMTE0ICogYiAqIGIgKTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0L7RgtC90L7RgdC40YLQtdC70YzQvdGD0Y4g0Y/RgNC60L7RgdGC0Ywg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI2x1bWluYW5jZVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUmVsYXRpdmVfbHVtaW5hbmNlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAnbWFnZW50YScgKS5sdW1pbmFuY2UoKTsgLy8gLT4gNzIuNjI0XG4gICAqL1xuICBsdW1pbmFuY2U6IGZ1bmN0aW9uIGx1bWluYW5jZSAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXNbIDAgXSAqIDAuMjEyNiArIHRoaXNbIDEgXSAqIDAuNzE1MiArIHRoaXNbIDIgXSAqIDAuMDcyMjtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0Y/RgNC60L7RgdGC0Ywg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI2JyaWdodG5lc3NcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9BRVJULyNjb2xvci1jb250cmFzdFxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSggJ21hZ2VudGEnICkuYnJpZ2h0bmVzcygpOyAvLyAtPiAxMDUuMzE1XG4gICAqL1xuICBicmlnaHRuZXNzOiBmdW5jdGlvbiBicmlnaHRuZXNzICgpXG4gIHtcbiAgICByZXR1cm4gMC4yOTkgKiB0aGlzWyAwIF0gKyAwLjU4NyAqIHRoaXNbIDEgXSArIDAuMTE0ICogdGhpc1sgMiBdO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiBDU1MtY29sb3Ig0YHRgtGA0L7QutGDLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjdG9TdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKiBAZXhhbXBsZVxuICAgKiAnJyArIG5ldyBSR0JBKCAnbWFnZW50YScgKTsgLy8gLT4gXCJyZ2JhKDI1NSwgMCwgMjU1LCAxKVwiXG4gICAqL1xuICB0b1N0cmluZzogZnVuY3Rpb24gdG9TdHJpbmcgKClcbiAge1xuICAgIHJldHVybiAncmdiYSgnICsgdGhpc1sgMCBdICsgJywgJyArIHRoaXNbIDEgXSArICcsICcgKyB0aGlzWyAyIF0gKyAnLCAnICsgdGhpc1sgMyBdICsgJyknO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBSLCBHLCBCLCBBINC30L3QsNGH0LXQvdC40Y8uXG4gICAqIEBtZXRob2QgdjYuUkdCQSNzZXRcbiAgICogQHBhcmFtIHtudW1iZXJ8VENvbG9yfSBbcl0gUmVkIGNoYW5uZWwgdmFsdWUuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2ddIEdyZWVuIGNoYW5uZWwgdmFsdWUuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2JdIEJsdWUgY2hhbm5lbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbYV0gQWxwaGEgY2hhbm5lbCB2YWx1ZS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlJHQkFcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoKVxuICAgKiAgIC5zZXQoICdtYWdlbnRhJyApICAgICAgICAgICAgICAgICAgICAvLyAtPiAyNTUsIDAsIDI1NSwgMVxuICAgKiAgIC5zZXQoICcjZmYwMGZmZmYnICkgICAgICAgICAgICAgICAgICAvLyAtPiAyNTUsIDAsIDI1NSwgMVxuICAgKiAgIC5zZXQoICcjZmYwMGZmJyApICAgICAgICAgICAgICAgICAgICAvLyAtPiAyNTUsIDAsIDI1NSwgMVxuICAgKiAgIC5zZXQoICcjZjAwNycgKSAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAyNTUsIDAsIDAsIDAuNDdcbiAgICogICAuc2V0KCAnI2YwMCcgKSAgICAgICAgICAgICAgICAgICAgICAgLy8gLT4gMjU1LCAwLCAwLCAxXG4gICAqICAgLnNldCggJ2hzbGEoIDAsIDEwMCUsIDUwJSwgMC40NyApJyApIC8vIC0+IDI1NSwgMCwgMCwgMC40N1xuICAgKiAgIC5zZXQoICdyZ2IoIDAsIDAsIDAgKScgKSAgICAgICAgICAgICAvLyAtPiAwLCAwLCAwLCAxXG4gICAqICAgLnNldCggMCApICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDFcbiAgICogICAuc2V0KCAwLCAwLCAwICkgICAgICAgICAgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMVxuICAgKiAgIC5zZXQoIDAsIDAgKSAgICAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAwLCAwLCAwLCAwXG4gICAqICAgLnNldCggMCwgMCwgMCwgMCApOyAgICAgICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDBcbiAgICovXG4gIHNldDogZnVuY3Rpb24gc2V0ICggciwgZywgYiwgYSApXG4gIHtcbiAgICBzd2l0Y2ggKCB0cnVlICkge1xuICAgICAgY2FzZSB0eXBlb2YgciA9PT0gJ3N0cmluZyc6XG4gICAgICAgIHIgPSBwYXJzZSggciApO1xuICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICBjYXNlIHR5cGVvZiByID09PSAnb2JqZWN0JyAmJiByICE9PSBudWxsOlxuICAgICAgICBpZiAoIHIudHlwZSAhPT0gdGhpcy50eXBlICkge1xuICAgICAgICAgIHIgPSByWyB0aGlzLnR5cGUgXSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpc1sgMCBdID0gclsgMCBdO1xuICAgICAgICB0aGlzWyAxIF0gPSByWyAxIF07XG4gICAgICAgIHRoaXNbIDIgXSA9IHJbIDIgXTtcbiAgICAgICAgdGhpc1sgMyBdID0gclsgMyBdO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHN3aXRjaCAoIHZvaWQgMCApIHtcbiAgICAgICAgICBjYXNlIHI6XG4gICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgIGIgPSBnID0gciA9IDA7ICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgZzpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgYiA9IGcgPSByID0gTWF0aC5mbG9vciggciApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBiOlxuICAgICAgICAgICAgYSA9IGc7XG4gICAgICAgICAgICBiID0gZyA9IHIgPSBNYXRoLmZsb29yKCByICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGE6XG4gICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgciA9IE1hdGguZmxvb3IoIHIgKTtcbiAgICAgICAgICAgIGcgPSBNYXRoLmZsb29yKCBnICk7XG4gICAgICAgICAgICBiID0gTWF0aC5mbG9vciggYiApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpc1sgMCBdID0gcjtcbiAgICAgICAgdGhpc1sgMSBdID0gZztcbiAgICAgICAgdGhpc1sgMiBdID0gYjtcbiAgICAgICAgdGhpc1sgMyBdID0gYTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICog0JrQvtC90LLQtdGA0YLQuNGA0YPQtdGCINCyIHtAbGluayB2Ni5IU0xBfS5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI2hzbGFcbiAgICogQHJldHVybiB7djYuSFNMQX1cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoIDI1NSwgMCwgMCwgMSApLmhzbGEoKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDEwMCwgNTAsIDEgKVxuICAgKi9cbiAgaHNsYTogZnVuY3Rpb24gaHNsYSAoKVxuICB7XG4gICAgdmFyIGhzbGEgPSBuZXcgSFNMQSgpO1xuXG4gICAgdmFyIHIgPSB0aGlzWyAwIF0gLyAyNTU7XG4gICAgdmFyIGcgPSB0aGlzWyAxIF0gLyAyNTU7XG4gICAgdmFyIGIgPSB0aGlzWyAyIF0gLyAyNTU7XG5cbiAgICB2YXIgbWF4ID0gTWF0aC5tYXgoIHIsIGcsIGIgKTtcbiAgICB2YXIgbWluID0gTWF0aC5taW4oIHIsIGcsIGIgKTtcblxuICAgIHZhciBsID0gKCBtYXggKyBtaW4gKSAqIDUwO1xuICAgIHZhciBoLCBzO1xuXG4gICAgdmFyIGRpZmYgPSBtYXggLSBtaW47XG5cbiAgICBpZiAoIGRpZmYgKSB7XG4gICAgICBpZiAoIGwgPiA1MCApIHtcbiAgICAgICAgcyA9IGRpZmYgLyAoIDIgLSBtYXggLSBtaW4gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMgPSBkaWZmIC8gKCBtYXggKyBtaW4gKTtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoICggbWF4ICkge1xuICAgICAgICBjYXNlIHI6XG4gICAgICAgICAgaWYgKCBnIDwgYiApIHtcbiAgICAgICAgICAgIGggPSAxLjA0NzIgKiAoIGcgLSBiICkgLyBkaWZmICsgNi4yODMyO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBoID0gMS4wNDcyICogKCBnIC0gYiApIC8gZGlmZjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBnOlxuICAgICAgICAgIGggPSAxLjA0NzIgKiAoIGIgLSByICkgLyBkaWZmICsgMi4wOTQ0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGggPSAxLjA0NzIgKiAoIHIgLSBnICkgLyBkaWZmICsgNC4xODg4O1xuICAgICAgfVxuXG4gICAgICBoID0gTWF0aC5yb3VuZCggaCAqIDM2MCAvIDYuMjgzMiApO1xuICAgICAgcyA9IE1hdGgucm91bmQoIHMgKiAxMDAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaCA9IHMgPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgIH1cblxuICAgIGhzbGFbIDAgXSA9IGg7XG4gICAgaHNsYVsgMSBdID0gcztcbiAgICBoc2xhWyAyIF0gPSBNYXRoLnJvdW5kKCBsICk7XG4gICAgaHNsYVsgMyBdID0gdGhpc1sgMyBdO1xuXG4gICAgcmV0dXJuIGhzbGE7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZXRob2QgdjYuUkdCQSNyZ2JhXG4gICAqIEBzZWUgdjYuUmVuZGVyZXJHTCN2ZXJ0aWNlc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICByZ2JhOiBmdW5jdGlvbiByZ2JhICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSB7QGxpbmsgdjYuUkdCQX0gLSDQuNC90YLQtdGA0L/QvtC70LjRgNC+0LLQsNC90L3Ri9C5INC80LXQttC00YMg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC80Lgg0L/QsNGA0LDQvNC10YLRgNCw0LzQuC5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI2xlcnBcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgclxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBnXG4gICAqIEBwYXJhbSAge251bWJlcn0gIGJcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgdmFsdWVcbiAgICogQHJldHVybiB7djYuUkdCQX1cbiAgICogQHNlZSB2Ni5SR0JBI2xlcnBDb2xvclxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSggMTAwLCAwLjI1ICkubGVycCggMjAwLCAyMDAsIDIwMCwgMC41ICk7IC8vIC0+IG5ldyBSR0JBKCAxNTAsIDE1MCwgMTUwLCAwLjI1IClcbiAgICovXG4gIGxlcnA6IGZ1bmN0aW9uIGxlcnAgKCByLCBnLCBiLCB2YWx1ZSApXG4gIHtcbiAgICByID0gdGhpc1sgMCBdICsgKCByIC0gdGhpc1sgMCBdICkgKiB2YWx1ZTtcbiAgICBnID0gdGhpc1sgMSBdICsgKCBnIC0gdGhpc1sgMSBdICkgKiB2YWx1ZTtcbiAgICBiID0gdGhpc1sgMiBdICsgKCBiIC0gdGhpc1sgMiBdICkgKiB2YWx1ZTtcbiAgICByZXR1cm4gbmV3IFJHQkEoIHIsIGcsIGIsIHRoaXNbIDMgXSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5SR0JBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyBgY29sb3JgLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjbGVycENvbG9yXG4gICAqIEBwYXJhbSAge1RDb2xvcn0gIGNvbG9yXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHZhbHVlXG4gICAqIEByZXR1cm4ge3Y2LlJHQkF9XG4gICAqIEBzZWUgdjYuUkdCQSNsZXJwXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBhID0gbmV3IFJHQkEoIDEwMCwgMC4yNSApO1xuICAgKiB2YXIgYiA9IG5ldyBSR0JBKCAyMDAsIDAgKTtcbiAgICogdmFyIGMgPSBhLmxlcnBDb2xvciggYiwgMC41ICk7IC8vIC0+IG5ldyBSR0JBKCAxNTAsIDE1MCwgMTUwLCAwLjI1IClcbiAgICovXG4gIGxlcnBDb2xvcjogZnVuY3Rpb24gbGVycENvbG9yICggY29sb3IsIHZhbHVlIClcbiAge1xuICAgIHZhciByLCBnLCBiO1xuXG4gICAgaWYgKCB0eXBlb2YgY29sb3IgIT09ICdvYmplY3QnICkge1xuICAgICAgY29sb3IgPSBwYXJzZSggY29sb3IgKTtcbiAgICB9XG5cbiAgICBpZiAoIGNvbG9yLnR5cGUgIT09ICdyZ2JhJyApIHtcbiAgICAgIGNvbG9yID0gY29sb3IucmdiYSgpO1xuICAgIH1cblxuICAgIHIgPSBjb2xvclsgMCBdO1xuICAgIGcgPSBjb2xvclsgMSBdO1xuICAgIGIgPSBjb2xvclsgMiBdO1xuXG4gICAgcmV0dXJuIHRoaXMubGVycCggciwgZywgYiwgdmFsdWUgKTtcbiAgfSxcblxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSB7QGxpbmsgdjYuUkdCQX0gLSDQt9Cw0YLQtdC80L3QtdC90L3Ri9C5INC40LvQuCDQt9Cw0YHQstC10YLQu9C10L3QvdGL0Lkg0L3QsCBgcGVyY2VudGFnZXNgINC/0YDQvtGG0LXQvdGC0L7Qsi5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI3NoYWRlXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHBlcmNlbnRhZ2VcbiAgICogQHJldHVybiB7djYuUkdCQX1cbiAgICogQHNlZSB2Ni5IU0xBI3NoYWRlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCkuc2hhZGUoIDUwICk7IC8vIC0+IG5ldyBSR0JBKCAxMjggKVxuICAgKi9cbiAgc2hhZGU6IGZ1bmN0aW9uIHNoYWRlICggcGVyY2VudGFnZXMgKVxuICB7XG4gICAgcmV0dXJuIHRoaXMuaHNsYSgpLnNoYWRlKCBwZXJjZW50YWdlcyApLnJnYmEoKTtcbiAgfSxcblxuICBjb25zdHJ1Y3RvcjogUkdCQVxufTtcblxuLyoqXG4gKiBAbWVtYmVyIHtzdHJpbmd9IHY2LlJHQkEjdHlwZSBgXCJyZ2JhXCJgLiDQrdGC0L4g0YHQstC+0LnRgdGC0LLQviDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0LTQu9GPINC60L7QvdCy0LXRgNGC0LjRgNC+0LLQsNC90LjRjyDQvNC10LbQtNGDIHtAbGluayB2Ni5IU0xBfSDQuCB7QGxpbmsgdjYuUkdCQX0uXG4gKi9cblJHQkEucHJvdG90eXBlLnR5cGUgPSAncmdiYSc7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qIGVzbGludCBrZXktc3BhY2luZzogWyBcImVycm9yXCIsIHsgXCJhbGlnblwiOiB7IFwiYmVmb3JlQ29sb25cIjogZmFsc2UsIFwiYWZ0ZXJDb2xvblwiOiB0cnVlLCBcIm9uXCI6IFwidmFsdWVcIiB9IH0gXSAqL1xuXG52YXIgY29sb3JzID0ge1xuICBhbGljZWJsdWU6ICAgICAgICAgICAgJ2YwZjhmZmZmJywgYW50aXF1ZXdoaXRlOiAgICAgICAgICdmYWViZDdmZicsXG4gIGFxdWE6ICAgICAgICAgICAgICAgICAnMDBmZmZmZmYnLCBhcXVhbWFyaW5lOiAgICAgICAgICAgJzdmZmZkNGZmJyxcbiAgYXp1cmU6ICAgICAgICAgICAgICAgICdmMGZmZmZmZicsIGJlaWdlOiAgICAgICAgICAgICAgICAnZjVmNWRjZmYnLFxuICBiaXNxdWU6ICAgICAgICAgICAgICAgJ2ZmZTRjNGZmJywgYmxhY2s6ICAgICAgICAgICAgICAgICcwMDAwMDBmZicsXG4gIGJsYW5jaGVkYWxtb25kOiAgICAgICAnZmZlYmNkZmYnLCBibHVlOiAgICAgICAgICAgICAgICAgJzAwMDBmZmZmJyxcbiAgYmx1ZXZpb2xldDogICAgICAgICAgICc4YTJiZTJmZicsIGJyb3duOiAgICAgICAgICAgICAgICAnYTUyYTJhZmYnLFxuICBidXJseXdvb2Q6ICAgICAgICAgICAgJ2RlYjg4N2ZmJywgY2FkZXRibHVlOiAgICAgICAgICAgICc1ZjllYTBmZicsXG4gIGNoYXJ0cmV1c2U6ICAgICAgICAgICAnN2ZmZjAwZmYnLCBjaG9jb2xhdGU6ICAgICAgICAgICAgJ2QyNjkxZWZmJyxcbiAgY29yYWw6ICAgICAgICAgICAgICAgICdmZjdmNTBmZicsIGNvcm5mbG93ZXJibHVlOiAgICAgICAnNjQ5NWVkZmYnLFxuICBjb3Juc2lsazogICAgICAgICAgICAgJ2ZmZjhkY2ZmJywgY3JpbXNvbjogICAgICAgICAgICAgICdkYzE0M2NmZicsXG4gIGN5YW46ICAgICAgICAgICAgICAgICAnMDBmZmZmZmYnLCBkYXJrYmx1ZTogICAgICAgICAgICAgJzAwMDA4YmZmJyxcbiAgZGFya2N5YW46ICAgICAgICAgICAgICcwMDhiOGJmZicsIGRhcmtnb2xkZW5yb2Q6ICAgICAgICAnYjg4NjBiZmYnLFxuICBkYXJrZ3JheTogICAgICAgICAgICAgJ2E5YTlhOWZmJywgZGFya2dyZWVuOiAgICAgICAgICAgICcwMDY0MDBmZicsXG4gIGRhcmtraGFraTogICAgICAgICAgICAnYmRiNzZiZmYnLCBkYXJrbWFnZW50YTogICAgICAgICAgJzhiMDA4YmZmJyxcbiAgZGFya29saXZlZ3JlZW46ICAgICAgICc1NTZiMmZmZicsIGRhcmtvcmFuZ2U6ICAgICAgICAgICAnZmY4YzAwZmYnLFxuICBkYXJrb3JjaGlkOiAgICAgICAgICAgJzk5MzJjY2ZmJywgZGFya3JlZDogICAgICAgICAgICAgICc4YjAwMDBmZicsXG4gIGRhcmtzYWxtb246ICAgICAgICAgICAnZTk5NjdhZmYnLCBkYXJrc2VhZ3JlZW46ICAgICAgICAgJzhmYmM4ZmZmJyxcbiAgZGFya3NsYXRlYmx1ZTogICAgICAgICc0ODNkOGJmZicsIGRhcmtzbGF0ZWdyYXk6ICAgICAgICAnMmY0ZjRmZmYnLFxuICBkYXJrdHVycXVvaXNlOiAgICAgICAgJzAwY2VkMWZmJywgZGFya3Zpb2xldDogICAgICAgICAgICc5NDAwZDNmZicsXG4gIGRlZXBwaW5rOiAgICAgICAgICAgICAnZmYxNDkzZmYnLCBkZWVwc2t5Ymx1ZTogICAgICAgICAgJzAwYmZmZmZmJyxcbiAgZGltZ3JheTogICAgICAgICAgICAgICc2OTY5NjlmZicsIGRvZGdlcmJsdWU6ICAgICAgICAgICAnMWU5MGZmZmYnLFxuICBmZWxkc3BhcjogICAgICAgICAgICAgJ2QxOTI3NWZmJywgZmlyZWJyaWNrOiAgICAgICAgICAgICdiMjIyMjJmZicsXG4gIGZsb3JhbHdoaXRlOiAgICAgICAgICAnZmZmYWYwZmYnLCBmb3Jlc3RncmVlbjogICAgICAgICAgJzIyOGIyMmZmJyxcbiAgZnVjaHNpYTogICAgICAgICAgICAgICdmZjAwZmZmZicsIGdhaW5zYm9ybzogICAgICAgICAgICAnZGNkY2RjZmYnLFxuICBnaG9zdHdoaXRlOiAgICAgICAgICAgJ2Y4ZjhmZmZmJywgZ29sZDogICAgICAgICAgICAgICAgICdmZmQ3MDBmZicsXG4gIGdvbGRlbnJvZDogICAgICAgICAgICAnZGFhNTIwZmYnLCBncmF5OiAgICAgICAgICAgICAgICAgJzgwODA4MGZmJyxcbiAgZ3JlZW46ICAgICAgICAgICAgICAgICcwMDgwMDBmZicsIGdyZWVueWVsbG93OiAgICAgICAgICAnYWRmZjJmZmYnLFxuICBob25leWRldzogICAgICAgICAgICAgJ2YwZmZmMGZmJywgaG90cGluazogICAgICAgICAgICAgICdmZjY5YjRmZicsXG4gIGluZGlhbnJlZDogICAgICAgICAgICAnY2Q1YzVjZmYnLCBpbmRpZ286ICAgICAgICAgICAgICAgJzRiMDA4MmZmJyxcbiAgaXZvcnk6ICAgICAgICAgICAgICAgICdmZmZmZjBmZicsIGtoYWtpOiAgICAgICAgICAgICAgICAnZjBlNjhjZmYnLFxuICBsYXZlbmRlcjogICAgICAgICAgICAgJ2U2ZTZmYWZmJywgbGF2ZW5kZXJibHVzaDogICAgICAgICdmZmYwZjVmZicsXG4gIGxhd25ncmVlbjogICAgICAgICAgICAnN2NmYzAwZmYnLCBsZW1vbmNoaWZmb246ICAgICAgICAgJ2ZmZmFjZGZmJyxcbiAgbGlnaHRibHVlOiAgICAgICAgICAgICdhZGQ4ZTZmZicsIGxpZ2h0Y29yYWw6ICAgICAgICAgICAnZjA4MDgwZmYnLFxuICBsaWdodGN5YW46ICAgICAgICAgICAgJ2UwZmZmZmZmJywgbGlnaHRnb2xkZW5yb2R5ZWxsb3c6ICdmYWZhZDJmZicsXG4gIGxpZ2h0Z3JleTogICAgICAgICAgICAnZDNkM2QzZmYnLCBsaWdodGdyZWVuOiAgICAgICAgICAgJzkwZWU5MGZmJyxcbiAgbGlnaHRwaW5rOiAgICAgICAgICAgICdmZmI2YzFmZicsIGxpZ2h0c2FsbW9uOiAgICAgICAgICAnZmZhMDdhZmYnLFxuICBsaWdodHNlYWdyZWVuOiAgICAgICAgJzIwYjJhYWZmJywgbGlnaHRza3libHVlOiAgICAgICAgICc4N2NlZmFmZicsXG4gIGxpZ2h0c2xhdGVibHVlOiAgICAgICAnODQ3MGZmZmYnLCBsaWdodHNsYXRlZ3JheTogICAgICAgJzc3ODg5OWZmJyxcbiAgbGlnaHRzdGVlbGJsdWU6ICAgICAgICdiMGM0ZGVmZicsIGxpZ2h0eWVsbG93OiAgICAgICAgICAnZmZmZmUwZmYnLFxuICBsaW1lOiAgICAgICAgICAgICAgICAgJzAwZmYwMGZmJywgbGltZWdyZWVuOiAgICAgICAgICAgICczMmNkMzJmZicsXG4gIGxpbmVuOiAgICAgICAgICAgICAgICAnZmFmMGU2ZmYnLCBtYWdlbnRhOiAgICAgICAgICAgICAgJ2ZmMDBmZmZmJyxcbiAgbWFyb29uOiAgICAgICAgICAgICAgICc4MDAwMDBmZicsIG1lZGl1bWFxdWFtYXJpbmU6ICAgICAnNjZjZGFhZmYnLFxuICBtZWRpdW1ibHVlOiAgICAgICAgICAgJzAwMDBjZGZmJywgbWVkaXVtb3JjaGlkOiAgICAgICAgICdiYTU1ZDNmZicsXG4gIG1lZGl1bXB1cnBsZTogICAgICAgICAnOTM3MGQ4ZmYnLCBtZWRpdW1zZWFncmVlbjogICAgICAgJzNjYjM3MWZmJyxcbiAgbWVkaXVtc2xhdGVibHVlOiAgICAgICc3YjY4ZWVmZicsIG1lZGl1bXNwcmluZ2dyZWVuOiAgICAnMDBmYTlhZmYnLFxuICBtZWRpdW10dXJxdW9pc2U6ICAgICAgJzQ4ZDFjY2ZmJywgbWVkaXVtdmlvbGV0cmVkOiAgICAgICdjNzE1ODVmZicsXG4gIG1pZG5pZ2h0Ymx1ZTogICAgICAgICAnMTkxOTcwZmYnLCBtaW50Y3JlYW06ICAgICAgICAgICAgJ2Y1ZmZmYWZmJyxcbiAgbWlzdHlyb3NlOiAgICAgICAgICAgICdmZmU0ZTFmZicsIG1vY2Nhc2luOiAgICAgICAgICAgICAnZmZlNGI1ZmYnLFxuICBuYXZham93aGl0ZTogICAgICAgICAgJ2ZmZGVhZGZmJywgbmF2eTogICAgICAgICAgICAgICAgICcwMDAwODBmZicsXG4gIG9sZGxhY2U6ICAgICAgICAgICAgICAnZmRmNWU2ZmYnLCBvbGl2ZTogICAgICAgICAgICAgICAgJzgwODAwMGZmJyxcbiAgb2xpdmVkcmFiOiAgICAgICAgICAgICc2YjhlMjNmZicsIG9yYW5nZTogICAgICAgICAgICAgICAnZmZhNTAwZmYnLFxuICBvcmFuZ2VyZWQ6ICAgICAgICAgICAgJ2ZmNDUwMGZmJywgb3JjaGlkOiAgICAgICAgICAgICAgICdkYTcwZDZmZicsXG4gIHBhbGVnb2xkZW5yb2Q6ICAgICAgICAnZWVlOGFhZmYnLCBwYWxlZ3JlZW46ICAgICAgICAgICAgJzk4ZmI5OGZmJyxcbiAgcGFsZXR1cnF1b2lzZTogICAgICAgICdhZmVlZWVmZicsIHBhbGV2aW9sZXRyZWQ6ICAgICAgICAnZDg3MDkzZmYnLFxuICBwYXBheWF3aGlwOiAgICAgICAgICAgJ2ZmZWZkNWZmJywgcGVhY2hwdWZmOiAgICAgICAgICAgICdmZmRhYjlmZicsXG4gIHBlcnU6ICAgICAgICAgICAgICAgICAnY2Q4NTNmZmYnLCBwaW5rOiAgICAgICAgICAgICAgICAgJ2ZmYzBjYmZmJyxcbiAgcGx1bTogICAgICAgICAgICAgICAgICdkZGEwZGRmZicsIHBvd2RlcmJsdWU6ICAgICAgICAgICAnYjBlMGU2ZmYnLFxuICBwdXJwbGU6ICAgICAgICAgICAgICAgJzgwMDA4MGZmJywgcmVkOiAgICAgICAgICAgICAgICAgICdmZjAwMDBmZicsXG4gIHJvc3licm93bjogICAgICAgICAgICAnYmM4ZjhmZmYnLCByb3lhbGJsdWU6ICAgICAgICAgICAgJzQxNjllMWZmJyxcbiAgc2FkZGxlYnJvd246ICAgICAgICAgICc4YjQ1MTNmZicsIHNhbG1vbjogICAgICAgICAgICAgICAnZmE4MDcyZmYnLFxuICBzYW5keWJyb3duOiAgICAgICAgICAgJ2Y0YTQ2MGZmJywgc2VhZ3JlZW46ICAgICAgICAgICAgICcyZThiNTdmZicsXG4gIHNlYXNoZWxsOiAgICAgICAgICAgICAnZmZmNWVlZmYnLCBzaWVubmE6ICAgICAgICAgICAgICAgJ2EwNTIyZGZmJyxcbiAgc2lsdmVyOiAgICAgICAgICAgICAgICdjMGMwYzBmZicsIHNreWJsdWU6ICAgICAgICAgICAgICAnODdjZWViZmYnLFxuICBzbGF0ZWJsdWU6ICAgICAgICAgICAgJzZhNWFjZGZmJywgc2xhdGVncmF5OiAgICAgICAgICAgICc3MDgwOTBmZicsXG4gIHNub3c6ICAgICAgICAgICAgICAgICAnZmZmYWZhZmYnLCBzcHJpbmdncmVlbjogICAgICAgICAgJzAwZmY3ZmZmJyxcbiAgc3RlZWxibHVlOiAgICAgICAgICAgICc0NjgyYjRmZicsIHRhbjogICAgICAgICAgICAgICAgICAnZDJiNDhjZmYnLFxuICB0ZWFsOiAgICAgICAgICAgICAgICAgJzAwODA4MGZmJywgdGhpc3RsZTogICAgICAgICAgICAgICdkOGJmZDhmZicsXG4gIHRvbWF0bzogICAgICAgICAgICAgICAnZmY2MzQ3ZmYnLCB0dXJxdW9pc2U6ICAgICAgICAgICAgJzQwZTBkMGZmJyxcbiAgdmlvbGV0OiAgICAgICAgICAgICAgICdlZTgyZWVmZicsIHZpb2xldHJlZDogICAgICAgICAgICAnZDAyMDkwZmYnLFxuICB3aGVhdDogICAgICAgICAgICAgICAgJ2Y1ZGViM2ZmJywgd2hpdGU6ICAgICAgICAgICAgICAgICdmZmZmZmZmZicsXG4gIHdoaXRlc21va2U6ICAgICAgICAgICAnZjVmNWY1ZmYnLCB5ZWxsb3c6ICAgICAgICAgICAgICAgJ2ZmZmYwMGZmJyxcbiAgeWVsbG93Z3JlZW46ICAgICAgICAgICc5YWNkMzJmZicsIHRyYW5zcGFyZW50OiAgICAgICAgICAnMDAwMDAwMDAnXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbG9ycztcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZTtcblxudmFyIFJHQkEgICA9IHJlcXVpcmUoICcuLi9SR0JBJyApO1xudmFyIEhTTEEgICA9IHJlcXVpcmUoICcuLi9IU0xBJyApO1xudmFyIGNvbG9ycyA9IHJlcXVpcmUoICcuL2NvbG9ycycgKTtcblxudmFyIHBhcnNlZCA9IE9iamVjdC5jcmVhdGUoIG51bGwgKTtcblxudmFyIFRSQU5TUEFSRU5UID0gW1xuICAwLCAwLCAwLCAwXG5dO1xuXG52YXIgcmVnZXhwcyA9IHtcbiAgaGV4MzogL14jKFswLTlhLWZdKShbMC05YS1mXSkoWzAtOWEtZl0pKFswLTlhLWZdKT8kLyxcbiAgaGV4OiAgL14jKFswLTlhLWZdezZ9KShbMC05YS1mXXsyfSk/JC8sXG4gIHJnYjogIC9ecmdiXFxzKlxcKFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqXFwpJHxeXFxzKnJnYmFcXHMqXFwoXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccypcXCkkLyxcbiAgaHNsOiAgL15oc2xcXHMqXFwoXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHUwMDI1XFxzKlxcKSR8Xlxccypoc2xhXFxzKlxcKFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHUwMDI1XFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFx1MDAyNVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccypcXCkkL1xufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBwYXJzZVxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmdcbiAqIEByZXR1cm4ge21vZHVsZTpcInY2LmpzXCIuUkdCQXxtb2R1bGU6XCJ2Ni5qc1wiLkhTTEF9XG4gKiBAZXhhbXBsZVxuICogcGFyc2UoICcjZjBmMCcgKTsgICAgICAgICAgICAgICAgICAgICAvLyAtPiBuZXcgUkdCQSggMjU1LCAwLCAyNTUsIDAgKVxuICogcGFyc2UoICcjMDAwMDAwZmYnICk7ICAgICAgICAgICAgICAgICAvLyAtPiBuZXcgUkdCQSggMCwgMCwgMCwgMSApXG4gKiBwYXJzZSggJ21hZ2VudGEnICk7ICAgICAgICAgICAgICAgICAgIC8vIC0+IG5ldyBSR0JBKCAyNTUsIDAsIDI1NSwgMSApXG4gKiBwYXJzZSggJ3RyYW5zcGFyZW50JyApOyAgICAgICAgICAgICAgIC8vIC0+IG5ldyBSR0JBKCAwLCAwLCAwLCAwIClcbiAqIHBhcnNlKCAnaHNsKCAwLCAxMDAlLCA1MCUgKScgKTsgICAgICAgLy8gLT4gbmV3IEhTTEEoIDAsIDEwMCwgNTAsIDEgKVxuICogcGFyc2UoICdoc2xhKCAwLCAxMDAlLCA1MCUsIDAuNSApJyApOyAvLyAtPiBuZXcgSFNMQSggMCwgMTAwLCA1MCwgMC41IClcbiAqL1xuZnVuY3Rpb24gcGFyc2UgKCBzdHJpbmcgKVxue1xuICB2YXIgY2FjaGUgPSBwYXJzZWRbIHN0cmluZyBdIHx8IHBhcnNlZFsgc3RyaW5nID0gc3RyaW5nLnRyaW0oKS50b0xvd2VyQ2FzZSgpIF07XG5cbiAgaWYgKCAhIGNhY2hlICkge1xuICAgIGlmICggKCBjYWNoZSA9IGNvbG9yc1sgc3RyaW5nIF0gKSApIHtcbiAgICAgIGNhY2hlID0gbmV3IENvbG9yRGF0YSggcGFyc2VIZXgoIGNhY2hlICksIFJHQkEgKTtcbiAgICB9IGVsc2UgaWYgKCAoIGNhY2hlID0gcmVnZXhwcy5oZXguZXhlYyggc3RyaW5nICkgKSB8fCAoIGNhY2hlID0gcmVnZXhwcy5oZXgzLmV4ZWMoIHN0cmluZyApICkgKSB7XG4gICAgICBjYWNoZSA9IG5ldyBDb2xvckRhdGEoIHBhcnNlSGV4KCBmb3JtYXRIZXgoIGNhY2hlICkgKSwgUkdCQSApO1xuICAgIH0gZWxzZSBpZiAoICggY2FjaGUgPSByZWdleHBzLnJnYi5leGVjKCBzdHJpbmcgKSApICkge1xuICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKCBjb21wYWN0TWF0Y2goIGNhY2hlICksIFJHQkEgKTtcbiAgICB9IGVsc2UgaWYgKCAoIGNhY2hlID0gcmVnZXhwcy5oc2wuZXhlYyggc3RyaW5nICkgKSApIHtcbiAgICAgIGNhY2hlID0gbmV3IENvbG9yRGF0YSggY29tcGFjdE1hdGNoKCBjYWNoZSApLCBIU0xBICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IFN5bnRheEVycm9yKCBzdHJpbmcgKyAnIGlzIG5vdCBhIHZhbGlkIHN5bnRheCcgKTtcbiAgICB9XG5cbiAgICBwYXJzZWRbIHN0cmluZyBdID0gY2FjaGU7XG4gIH1cblxuICByZXR1cm4gbmV3IGNhY2hlLmNvbG9yKCBjYWNoZVsgMCBdLCBjYWNoZVsgMSBdLCBjYWNoZVsgMiBdLCBjYWNoZVsgMyBdICk7XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgZm9ybWF0SGV4XG4gKiBAcGFyYW0gIHthcnJheTxzdHJpbmc/Pn0gbWF0Y2hcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBleGFtcGxlXG4gKiBmb3JtYXRIZXgoIFsgJyMwMDAwMDBmZicsICcwMDAwMDAnLCAnZmYnIF0gKTsgLy8gLT4gJzAwMDAwMGZmJ1xuICogZm9ybWF0SGV4KCBbICcjMDAwNycsICcwJywgJzAnLCAnMCcsICc3JyBdICk7IC8vIC0+ICcwMDAwMDA3NydcbiAqIGZvcm1hdEhleCggWyAnIzAwMCcsICcwJywgJzAnLCAnMCcsIG51bGwgXSApOyAvLyAtPiAnMDAwMDAwZmYnXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdEhleCAoIG1hdGNoIClcbntcbiAgdmFyIHIsIGcsIGIsIGE7XG5cbiAgaWYgKCBtYXRjaC5sZW5ndGggPT09IDMgKSB7XG4gICAgcmV0dXJuIG1hdGNoWyAxIF0gKyAoIG1hdGNoWyAyIF0gfHwgJ2ZmJyApO1xuICB9XG5cbiAgciA9IG1hdGNoWyAxIF07XG4gIGcgPSBtYXRjaFsgMiBdO1xuICBiID0gbWF0Y2hbIDMgXTtcbiAgYSA9IG1hdGNoWyA0IF0gfHwgJ2YnO1xuXG4gIHJldHVybiByICsgciArIGcgKyBnICsgYiArIGIgKyBhICsgYTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBwYXJzZUhleFxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgaGV4XG4gKiBAcmV0dXJuIHthcnJheTxudW1iZXI+fVxuICogQGV4YW1wbGVcbiAqIHBhcnNlSGV4KCAnMDAwMDAwMDAnICk7IC8vIC0+IFsgMCwgMCwgMCwgMCBdXG4gKiBwYXJzZUhleCggJ2ZmMDBmZmZmJyApOyAvLyAtPiBbIDI1NSwgMCwgMjU1LCAxIF1cbiAqL1xuZnVuY3Rpb24gcGFyc2VIZXggKCBoZXggKVxue1xuICBpZiAoIGhleCA9PSAwICkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuICAgIHJldHVybiBUUkFOU1BBUkVOVDtcbiAgfVxuXG4gIGhleCA9IHBhcnNlSW50KCBoZXgsIDE2ICk7XG5cbiAgcmV0dXJuIFtcbiAgICAvLyBSXG4gICAgaGV4ID4+IDI0ICYgMjU1LCAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWJpdHdpc2VcbiAgICAvLyBHXG4gICAgaGV4ID4+IDE2ICYgMjU1LCAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWJpdHdpc2VcbiAgICAvLyBCXG4gICAgaGV4ID4+IDggICYgMjU1LCAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWJpdHdpc2VcbiAgICAvLyBBXG4gICAgKCBoZXggJiAyNTUgKSAvIDI1NSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWJpdHdpc2VcbiAgXTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjb21wYWN0TWF0Y2hcbiAqIEBwYXJhbSAge2FycmF5PHN0cmluZz8+fSBtYXRjaFxuICogQHJldHVybiB7YXJyYXk8bnVtYmVyPn1cbiAqL1xuZnVuY3Rpb24gY29tcGFjdE1hdGNoICggbWF0Y2ggKVxue1xuICBpZiAoIG1hdGNoWyA3IF0gKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIE51bWJlciggbWF0Y2hbIDQgXSApLFxuICAgICAgTnVtYmVyKCBtYXRjaFsgNSBdICksXG4gICAgICBOdW1iZXIoIG1hdGNoWyA2IF0gKSxcbiAgICAgIE51bWJlciggbWF0Y2hbIDcgXSApXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgTnVtYmVyKCBtYXRjaFsgMSBdICksXG4gICAgTnVtYmVyKCBtYXRjaFsgMiBdICksXG4gICAgTnVtYmVyKCBtYXRjaFsgMyBdIClcbiAgXTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQGNvbnN0cnVjdG9yIENvbG9yRGF0YVxuICogQHBhcmFtIHthcnJheTxudW1iZXI+fSBtYXRjaFxuICogQHBhcmFtIHtmdW5jdGlvbn0gICAgICBjb2xvclxuICovXG5mdW5jdGlvbiBDb2xvckRhdGEgKCBtYXRjaCwgY29sb3IgKVxue1xuICB0aGlzWyAwIF0gPSBtYXRjaFsgMCBdO1xuICB0aGlzWyAxIF0gPSBtYXRjaFsgMSBdO1xuICB0aGlzWyAyIF0gPSBtYXRjaFsgMiBdO1xuICB0aGlzWyAzIF0gPSBtYXRjaFsgMyBdO1xuICB0aGlzLmNvbG9yID0gY29sb3I7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0JrQvtC90YHRgtCw0L3RgtGLLlxuICogQG5hbWVzcGFjZSB7b2JqZWN0fSB2Ni5jb25zdGFudHNcbiAqIEBleGFtcGxlXG4gKiB2YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29uc3RhbnRzJyApO1xuICovXG5cbnZhciBfY29uc3RhbnRzID0ge307XG52YXIgX2NvdW50ZXIgICA9IDA7XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC60L7QvdGB0YLQsNC90YLRgy5cbiAqIEBtZXRob2QgdjYuY29uc3RhbnRzLmFkZFxuICogQHBhcmFtICB7c3RyaW5nfSBrZXkg0JjQvNGPINC60L7QvdGB0YLQsNC90YLRiy5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIGNvbnN0YW50cy5hZGQoICdDVVNUT01fQ09OU1RBTlQnICk7XG4gKi9cbmZ1bmN0aW9uIGFkZCAoIGtleSApXG57XG4gIGlmICggdHlwZW9mIF9jb25zdGFudHNbIGtleSBdICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCByZS1zZXQgKGFkZCkgZXhpc3RpbmcgY29uc3RhbnQ6ICcgKyBrZXkgKTtcbiAgfVxuXG4gIF9jb25zdGFudHNbIGtleSBdID0gKytfY291bnRlcjtcbn1cblxuLyoqXG4gKiDQktC+0LfQstGA0LDRidCw0LXRgiDQutC+0L3RgdGC0LDQvdGC0YMuXG4gKiBAbWV0aG9kIHY2LmNvbnN0YW50cy5nZXRcbiAqIEBwYXJhbSAge3N0cmluZ30gICBrZXkg0JjQvNGPINC60L7QvdGB0YLQsNC90YLRiy5cbiAqIEByZXR1cm4ge2NvbnN0YW50fSAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0LrQvtC90YHRgtCw0L3RgtGDLlxuICogQGV4YW1wbGVcbiAqIGNvbnN0YW50cy5nZXQoICdDVVNUT01fQ09OU1RBTlQnICk7XG4gKi9cbmZ1bmN0aW9uIGdldCAoIGtleSApXG57XG4gIGlmICggdHlwZW9mIF9jb25zdGFudHNbIGtleSBdID09PSAndW5kZWZpbmVkJyApIHtcbiAgICB0aHJvdyBSZWZlcmVuY2VFcnJvciggJ0Nhbm5vdCBnZXQgdW5rbm93biBjb25zdGFudDogJyArIGtleSApO1xuICB9XG5cbiAgcmV0dXJuIF9jb25zdGFudHNbIGtleSBdO1xufVxuXG5bXG4gICdBVVRPJyxcbiAgJ0dMJyxcbiAgJzJEJyxcbiAgJ0xFRlQnLFxuICAnVE9QJyxcbiAgJ0NFTlRFUicsXG4gICdNSURETEUnLFxuICAnUklHSFQnLFxuICAnQk9UVE9NJyxcbiAgJ1BFUkNFTlQnXG5dLmZvckVhY2goIGFkZCApO1xuXG5leHBvcnRzLmFkZCA9IGFkZDtcbmV4cG9ydHMuZ2V0ID0gZ2V0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTGlnaHRFbWl0dGVyID0gcmVxdWlyZSggJ2xpZ2h0X2VtaXR0ZXInICk7XG5cbi8qKlxuICogQGFic3RyYWN0XG4gKiBAY29uc3RydWN0b3IgdjYuQWJzdHJhY3RJbWFnZVxuICogQGV4dGVuZHMgTGlnaHRFbWl0dGVyXG4gKiBAc2VlIHY2LkNvbXBvdW5kZWRJbWFnZVxuICogQHNlZSB2Ni5JbWFnZVxuICovXG5mdW5jdGlvbiBBYnN0cmFjdEltYWdlICgpXG57XG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI3N4IFwiU291cmNlIFhcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2Ujc3kgXCJTb3VyY2UgWVwiLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNzdyBcIlNvdXJjZSBXaWR0aFwiLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNzaCBcIlNvdXJjZSBIZWlnaHRcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2UjZHcgXCJEZXN0aW5hdGlvbiBXaWR0aFwiLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNkaCBcIkRlc3RpbmF0aW9uIEhlaWdodFwiLlxuICAgKi9cblxuICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGFic3RyYWN0IGNsYXNzIChuZXcgdjYuQWJzdHJhY3RJbWFnZSknICk7XG59XG5cbkFic3RyYWN0SW1hZ2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggTGlnaHRFbWl0dGVyLnByb3RvdHlwZSApO1xuQWJzdHJhY3RJbWFnZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBBYnN0cmFjdEltYWdlO1xuXG4vKipcbiAqIEB2aXJ0dWFsXG4gKiBAbWV0aG9kIHY2LkFic3RyYWN0SW1hZ2UjZ2V0XG4gKiBAcmV0dXJuIHt2Ni5JbWFnZX1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFic3RyYWN0SW1hZ2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBBYnN0cmFjdEltYWdlID0gcmVxdWlyZSggJy4vQWJzdHJhY3RJbWFnZScgKTtcblxuLyoqXG4gKiBAY29uc3RydWN0b3IgdjYuQ29tcG91bmRlZEltYWdlXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdEltYWdlXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0SW1hZ2V9IGltYWdlXG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIHN4XG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIHN5XG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIHN3XG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIHNoXG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIGR3XG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIGRoXG4gKi9cbmZ1bmN0aW9uIENvbXBvdW5kZWRJbWFnZSAoIGltYWdlLCBzeCwgc3ksIHN3LCBzaCwgZHcsIGRoIClcbntcbiAgdGhpcy5pbWFnZSA9IGltYWdlO1xuICB0aGlzLnN4ICAgID0gc3g7XG4gIHRoaXMuc3kgICAgPSBzeTtcbiAgdGhpcy5zdyAgICA9IHN3O1xuICB0aGlzLnNoICAgID0gc2g7XG4gIHRoaXMuZHcgICAgPSBkdztcbiAgdGhpcy5kaCAgICA9IGRoO1xufVxuXG5Db21wb3VuZGVkSW1hZ2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RJbWFnZS5wcm90b3R5cGUgKTtcbkNvbXBvdW5kZWRJbWFnZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDb21wb3VuZGVkSW1hZ2U7XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LkNvbXBvdW5kZWRJbWFnZSNnZXRcbiAqL1xuQ29tcG91bmRlZEltYWdlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQgKClcbntcbiAgcmV0dXJuIHRoaXMuaW1hZ2UuZ2V0KCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvdW5kZWRJbWFnZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbXBvdW5kZWRJbWFnZSA9IHJlcXVpcmUoICcuL0NvbXBvdW5kZWRJbWFnZScgKTtcbnZhciBBYnN0cmFjdEltYWdlICAgPSByZXF1aXJlKCAnLi9BYnN0cmFjdEltYWdlJyApO1xuXG4vKipcbiAqINCa0LvQsNGB0YEg0LrQsNGA0YLQuNC90LrQuC5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5JbWFnZVxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RJbWFnZVxuICogQHBhcmFtIHtIVE1MSW1hZ2VFbGVtZW50fSBpbWFnZSBET00g0Y3Qu9C10LzQtdC90YIg0LrQsNGA0YLQuNC90LrQuCAoSU1HKS5cbiAqIEBmaXJlcyBjb21wbGV0ZVxuICogQHNlZSB2Ni5JbWFnZS5mcm9tVVJMXG4gKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZEltYWdlXG4gKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjaW1hZ2VcbiAqIEBleGFtcGxlXG4gKiB2YXIgSW1hZ2UgPSByZXF1aXJlKCAndjYuanMvY29yZS9pbWFnZS9JbWFnZScgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIGFuIGltYWdlIHdpdGggYW4gRE9NIGltYWdlPC9jYXB0aW9uPlxuICogLy8gSFRNTDogPGltZyBzcmM9XCJpbWFnZS5wbmdcIiBpZD1cImltYWdlXCIgLz5cbiAqIHZhciBpbWFnZSA9IG5ldyBJbWFnZSggZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoICdpbWFnZScgKSApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRpbmcgYW4gaW1hZ2Ugd2l0aCBhIFVSTDwvY2FwdGlvbj5cbiAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICdpbWFnZS5wbmcnICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5GaXJlcyBcImNvbXBsZXRlXCIgZXZlbnQ8L2NhcHRpb24+XG4gKiBpbWFnZS5vbmNlKCAnY29tcGxldGUnLCBmdW5jdGlvbiAoKVxuICoge1xuICogICBjb25zb2xlLmxvZyggJ1RoZSBpbWFnZSBpcyBsb2FkZWQhJyApO1xuICogfSApO1xuICovXG5mdW5jdGlvbiBJbWFnZSAoIGltYWdlIClcbntcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGlmICggISBpbWFnZS5zcmMgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3JlYXRlIHY2LkltYWdlIGZyb20gSFRNTEltYWdlRWxlbWVudCB3aXRoIG5vIFwic3JjXCIgYXR0cmlidXRlIChuZXcgdjYuSW1hZ2UpJyApO1xuICB9XG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge0hUTUxJbWFnZUVsZW1lbnR9IHY2LkltYWdlI2ltYWdlIERPTSDRjdC10LvQtdC80LXQvdGCINC60LDRgNGC0LjQvdC60LguXG4gICAqL1xuICB0aGlzLmltYWdlID0gaW1hZ2U7XG5cbiAgaWYgKCB0aGlzLmltYWdlLmNvbXBsZXRlICkge1xuICAgIHRoaXMuX2luaXQoKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmltYWdlLmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgZnVuY3Rpb24gb25sb2FkICgpXG4gICAge1xuICAgICAgc2VsZi5pbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCAnbG9hZCcsIG9ubG9hZCApO1xuICAgICAgc2VsZi5faW5pdCgpO1xuICAgIH0sIGZhbHNlICk7XG4gIH1cbn1cblxuSW1hZ2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RJbWFnZS5wcm90b3R5cGUgKTtcbkltYWdlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEltYWdlO1xuXG4vKipcbiAqINCY0L3QuNGG0LjQsNC70LjQt9C40YDRg9C10YIg0LrQsNGA0YLQuNC90LrRgyDQv9C+0YHQu9C1INC10LUg0LfQsNCz0YDRg9C30LrQuC5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHY2LkltYWdlI19pbml0XG4gKiBAcmV0dXJuIHt2b2lkfSDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqL1xuSW1hZ2UucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gX2luaXQgKClcbntcbiAgdGhpcy5zeCA9IDA7XG4gIHRoaXMuc3kgPSAwO1xuICB0aGlzLnN3ID0gdGhpcy5kdyA9IHRoaXMuaW1hZ2Uud2lkdGg7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICB0aGlzLnNoID0gdGhpcy5kaCA9IHRoaXMuaW1hZ2UuaGVpZ2h0OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICB0aGlzLmVtaXQoICdjb21wbGV0ZScgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LkltYWdlI2dldFxuICovXG5JbWFnZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0ICgpXG57XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQntC/0YDQtdC00LXQu9GP0LXRgiwg0LfQsNCz0YDRg9C20LXQvdCwINC70Lgg0LrQsNGA0YLQuNC90LrQsC5cbiAqIEBtZXRob2QgdjYuSW1hZ2UjY29tcGxldGVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IGB0cnVlYCwg0LXRgdC70Lgg0LfQsNCz0YDRg9C20LXQvdCwLlxuICogQGV4YW1wbGVcbiAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICdpbWFnZS5wbmcnICk7XG4gKlxuICogaWYgKCAhIGltYWdlLmNvbXBsZXRlKCkgKSB7XG4gKiAgIGltYWdlLm9uY2UoICdjb21wbGV0ZScsIGZ1bmN0aW9uICgpXG4gKiAgIHtcbiAqICAgICBjb25zb2xlLmxvZyggJ1RoZSBpbWFnZSBpcyBsb2FkZWQhJywgaW1hZ2UuY29tcGxldGUoKSApO1xuICogICB9ICk7XG4gKiB9XG4gKi9cbkltYWdlLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlICgpXG57XG4gIHJldHVybiBCb29sZWFuKCB0aGlzLmltYWdlLnNyYyApICYmIHRoaXMuaW1hZ2UuY29tcGxldGU7XG59O1xuXG4vKipcbiAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIFVSTCDQutCw0YDRgtC40L3QutC4LlxuICogQG1ldGhvZCB2Ni5JbWFnZSNzcmNcbiAqIEByZXR1cm4ge3N0cmluZ30gVVJMINC60LDRgNGC0LjQvdC60LguXG4gKiBAZXhhbXBsZVxuICogSW1hZ2UuZnJvbVVSTCggJ2ltYWdlLnBuZycgKS5zcmMoKTsgLy8gLT4gXCJpbWFnZS5wbmdcIlxuICovXG5JbWFnZS5wcm90b3R5cGUuc3JjID0gZnVuY3Rpb24gc3JjICgpXG57XG4gIHJldHVybiB0aGlzLmltYWdlLnNyYztcbn07XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YPRjiB7QGxpbmsgdjYuSW1hZ2V9INC40LcgVVJMLlxuICogQG1ldGhvZCB2Ni5JbWFnZS5mcm9tVVJMXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgc3JjIFVSTCDQutCw0YDRgtC40L3QutC4LlxuICogQHJldHVybiB7djYuSW1hZ2V9ICAgICDQndC+0LLQsNGPIHtAbGluayB2Ni5JbWFnZX0uXG4gKiBAZXhhbXBsZVxuICogdmFyIGltYWdlID0gSW1hZ2UuZnJvbVVSTCggJ2ltYWdlLnBuZycgKTtcbiAqL1xuSW1hZ2UuZnJvbVVSTCA9IGZ1bmN0aW9uIGZyb21VUkwgKCBzcmMgKVxue1xuICB2YXIgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW1nJyApO1xuICBpbWFnZS5zcmMgPSBzcmM7XG4gIHJldHVybiBuZXcgSW1hZ2UoIGltYWdlICk7XG59O1xuXG4vKipcbiAqINCf0YDQvtC/0L7RgNGG0LjQvtC90LDQu9GM0L3QviDRgNCw0YHRgtGP0LPQuNCy0LDQtdGCINC40LvQuCDRgdC20LjQvNCw0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICogQG1ldGhvZCB2Ni5JbWFnZS5zdHJldGNoXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdEltYWdlfSAgIGltYWdlINCa0LDRgNGC0LjQvdC60LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIGR3ICAgINCd0L7QstGL0LkgXCJEZXN0aW5hdGlvbiBXaWR0aFwiLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBkaCAgICDQndC+0LLRi9C5IFwiRGVzdGluYXRpb24gSGVpZ2h0XCIuXG4gKiBAcmV0dXJuIHt2Ni5Db21wb3VuZGVkSW1hZ2V9ICAgICAgINCd0L7QstCw0Y8g0LrQsNGA0YLQuNC90LrQsC5cbiAqIEBleGFtcGxlXG4gKiBJbWFnZS5zdHJldGNoKCBpbWFnZSwgNjAwLCA0MDAgKTtcbiAqL1xuSW1hZ2Uuc3RyZXRjaCA9IGZ1bmN0aW9uIHN0cmV0Y2ggKCBpbWFnZSwgZHcsIGRoIClcbntcbiAgdmFyIHZhbHVlID0gZGggLyBpbWFnZS5kaCAqIGltYWdlLmR3O1xuXG4gIC8vIFN0cmV0Y2ggRFcuXG4gIGlmICggdmFsdWUgPCBkdyApIHtcbiAgICBkaCA9IGR3IC8gaW1hZ2UuZHcgKiBpbWFnZS5kaDtcblxuICAvLyBTdHJldGNoIERILlxuICB9IGVsc2Uge1xuICAgIGR3ID0gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gbmV3IENvbXBvdW5kZWRJbWFnZSggaW1hZ2UuZ2V0KCksIGltYWdlLnN4LCBpbWFnZS5zeSwgaW1hZ2Uuc3csIGltYWdlLnNoLCBkdywgZGggKTtcbn07XG5cbi8qKlxuICog0J7QsdGA0LXQt9Cw0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICogQG1ldGhvZCB2Ni5JbWFnZS5jdXRcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0SW1hZ2V9ICAgaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCwg0LrQvtGC0L7RgNGD0Y4g0L3QsNC00L4g0L7QsdGA0LXQt9Cw0YLRjC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgc3ggICAgWCDQutC+0L7RgNC00LjQvdCw0YLQsCwg0L7RgtC60YPQtNCwINC90LDQtNC+INC+0LHRgNC10LfQsNGC0YwuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIHN5ICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAsINC+0YLQutGD0LTQsCDQvdCw0LTQviDQvtCx0YDQtdC30LDRgtGMLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBzdyAgICDQndC+0LLQsNGPINGI0LjRgNC40L3QsC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgc2ggICAg0J3QvtCy0LDRjyDQstGL0YHQvtGC0LAuXG4gKiBAcmV0dXJuIHt2Ni5Db21wb3VuZGVkSW1hZ2V9ICAgICAgINCe0LHRgNC10LfQsNC90L3QsNGPINC60LDRgNGC0LjQvdC60LAuXG4gKiBAZXhhbXBsZVxuICogSW1hZ2UuY3V0KCBpbWFnZSwgMTAsIDIwLCAzMCwgNDAgKTtcbiAqL1xuSW1hZ2UuY3V0ID0gZnVuY3Rpb24gY3V0ICggaW1hZ2UsIHN4LCBzeSwgZHcsIGRoIClcbntcbiAgdmFyIHN3ID0gaW1hZ2Uuc3cgLyBpbWFnZS5kdyAqIGR3O1xuICB2YXIgc2ggPSBpbWFnZS5zaCAvIGltYWdlLmRoICogZGg7XG5cbiAgc3ggKz0gaW1hZ2Uuc3g7XG5cbiAgaWYgKCBzeCArIHN3ID4gaW1hZ2Uuc3ggKyBpbWFnZS5zdyApIHtcbiAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjdXQgdGhlIGltYWdlIGJlY2F1c2UgdGhlIG5ldyBpbWFnZSBYIG9yIFcgaXMgb3V0IG9mIGJvdW5kcyAodjYuSW1hZ2UuY3V0KScgKTtcbiAgfVxuXG4gIHN5ICs9IGltYWdlLnN5O1xuXG4gIGlmICggc3kgKyBzaCA+IGltYWdlLnN5ICsgaW1hZ2Uuc2ggKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3V0IHRoZSBpbWFnZSBiZWNhdXNlIHRoZSBuZXcgaW1hZ2UgWSBvciBIIGlzIG91dCBvZiBib3VuZHMgKHY2LkltYWdlLmN1dCknICk7XG4gIH1cblxuICByZXR1cm4gbmV3IENvbXBvdW5kZWRJbWFnZSggaW1hZ2UuZ2V0KCksIHN4LCBzeSwgc3csIHNoLCBkdywgZGggKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW1hZ2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfRmxvYXQzMkFycmF5O1xuXG5pZiAoIHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICdmdW5jdGlvbicgKSB7XG4gIF9GbG9hdDMyQXJyYXkgPSBGbG9hdDMyQXJyYXk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbn0gZWxzZSB7XG4gIF9GbG9hdDMyQXJyYXkgPSBBcnJheTtcbn1cblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQvNCw0YHRgdC40LIg0YEg0LrQvtC+0YDQtNC40L3QsNGC0LDQvNC4INCy0YHQtdGFINGC0L7Rh9C10Log0L3Rg9C20L3QvtCz0L4g0L/QvtC70LjQs9C+0L3QsC5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNyZWF0ZVBvbHlnb25cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgc2lkZXMg0JrQvtC70LjRh9C10YHRgtCy0L4g0YHRgtC+0YDQvtC9INC/0L7Qu9C40LPQvtC90LAuXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9ICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC80LDRgdGB0LjQsiAoRmxvYXQzMkFycmF5KSDQutC+0YLQvtGA0YvQuSDQstGL0LPQu9GP0LTQuNGCINGC0LDQujogYFsgeDEsIHkxLCB4MiwgeTIgXWAuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINCS0YHQtSDQt9C90LDRh9C10L3QuNGPINC60L7RgtC+0YDQvtCz0L4g0L3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3Riy5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUG9seWdvbiAoIHNpZGVzIClcbntcbiAgdmFyIGkgICAgICAgID0gTWF0aC5mbG9vciggc2lkZXMgKTtcbiAgdmFyIHN0ZXAgICAgID0gTWF0aC5QSSAqIDIgLyBzaWRlcztcbiAgdmFyIHZlcnRpY2VzID0gbmV3IF9GbG9hdDMyQXJyYXkoIGkgKiAyICsgMiApO1xuXG4gIGZvciAoIDsgaSA+PSAwOyAtLWkgKSB7XG4gICAgdmVydGljZXNbICAgICBpICogMiBdID0gTWF0aC5jb3MoIHN0ZXAgKiBpICk7XG4gICAgdmVydGljZXNbIDEgKyBpICogMiBdID0gTWF0aC5zaW4oIHN0ZXAgKiBpICk7XG4gIH1cblxuICByZXR1cm4gdmVydGljZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUG9seWdvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQuCDQuNC90LjRhtC40LDQu9C40LfQuNGA0YPQtdGCINC90L7QstGD0Y4gV2ViR0wg0L/RgNC+0LPRgNCw0LzQvNGDLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY3JlYXRlUHJvZ3JhbVxuICogQHBhcmFtICB7V2ViR0xTaGFkZXJ9ICAgICAgICAgICB2ZXJ0INCS0LXRgNGI0LjQvdC90YvQuSDRiNC10LnQtNC10YAgKNGB0L7Qt9C00LDQvdC90YvQuSDRgSDQv9C+0LzQvtGJ0YzRjiBge0BsaW5rIGNyZWF0ZVNoYWRlcn1gKS5cbiAqIEBwYXJhbSAge1dlYkdMU2hhZGVyfSAgICAgICAgICAgZnJhZyDQpNGA0LDQs9C80LXQvdGC0L3Ri9C5INGI0LXQudC00LXRgCAo0YHQvtC30LTQsNC90L3Ri9C5INGBINC/0L7QvNC+0YnRjNGOIGB7QGxpbmsgY3JlYXRlU2hhZGVyfWApLlxuICogQHBhcmFtICB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAgIFdlYkdMINC60L7QvdGC0LXQutGB0YIuXG4gKiBAcmV0dXJuIHtXZWJHTFByb2dyYW19XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVByb2dyYW0gKCB2ZXJ0LCBmcmFnLCBnbCApXG57XG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuXG4gIGdsLmF0dGFjaFNoYWRlciggcHJvZ3JhbSwgdmVydCApO1xuICBnbC5hdHRhY2hTaGFkZXIoIHByb2dyYW0sIGZyYWcgKTtcbiAgZ2wubGlua1Byb2dyYW0oIHByb2dyYW0gKTtcblxuICBpZiAoICEgZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggcHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ1VuYWJsZSB0byBpbml0aWFsaXplIHRoZSBzaGFkZXIgcHJvZ3JhbTogJyArIGdsLmdldFByb2dyYW1JbmZvTG9nKCBwcm9ncmFtICkgKTtcbiAgfVxuXG4gIGdsLnZhbGlkYXRlUHJvZ3JhbSggcHJvZ3JhbSApO1xuXG4gIGlmICggISBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKCBwcm9ncmFtLCBnbC5WQUxJREFURV9TVEFUVVMgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ1VuYWJsZSB0byB2YWxpZGF0ZSB0aGUgc2hhZGVyIHByb2dyYW06ICcgKyBnbC5nZXRQcm9ncmFtSW5mb0xvZyggcHJvZ3JhbSApICk7XG4gIH1cblxuICByZXR1cm4gcHJvZ3JhbTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVQcm9ncmFtO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINC4INC40L3QuNGG0LjQsNC70LjQt9C40YDRg9C10YIg0L3QvtCy0YvQuSBXZWJHTCDRiNC10LnQtNC10YAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjcmVhdGVTaGFkZXJcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgICAgc291cmNlINCY0YHRhdC+0LTQvdGL0Lkg0LrQvtC0INGI0LXQudC00LXRgNCwLlxuICogQHBhcmFtICB7Y29uc3RhbnR9ICAgICAgICAgICAgICB0eXBlICAg0KLQuNC/INGI0LXQudC00LXRgNCwOiBWRVJURVhfU0hBREVSINC40LvQuCBGUkFHTUVOVF9TSEFERVIuXG4gKiBAcGFyYW0gIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsICAgICBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICogQHJldHVybiB7V2ViR0xTaGFkZXJ9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVNoYWRlciAoIHNvdXJjZSwgdHlwZSwgZ2wgKVxue1xuICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKCB0eXBlICk7XG5cbiAgZ2wuc2hhZGVyU291cmNlKCBzaGFkZXIsIHNvdXJjZSApO1xuICBnbC5jb21waWxlU2hhZGVyKCBzaGFkZXIgKTtcblxuICBpZiAoICEgZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKCBzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTICkgKSB7XG4gICAgdGhyb3cgU3ludGF4RXJyb3IoICdBbiBlcnJvciBvY2N1cnJlZCBjb21waWxpbmcgdGhlIHNoYWRlcnM6ICcgKyBnbC5nZXRTaGFkZXJJbmZvTG9nKCBzaGFkZXIgKSApO1xuICB9XG5cbiAgcmV0dXJuIHNoYWRlcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVTaGFkZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZW1iZXIge29iamVjdH0gcG9seWdvbnNcbiAqL1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbm9vcCA9IHJlcXVpcmUoICdwZWFrby9ub29wJyApO1xuXG52YXIgcmVwb3J0LCByZXBvcnRlZDtcblxuaWYgKCB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgY29uc29sZS53YXJuICkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgcmVwb3J0ZWQgPSB7fTtcblxuICByZXBvcnQgPSBmdW5jdGlvbiByZXBvcnQgKCBtZXNzYWdlIClcbiAge1xuICAgIGlmICggcmVwb3J0ZWRbIG1lc3NhZ2UgXSApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zb2xlLndhcm4oIG1lc3NhZ2UgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmVwb3J0ZWRbIG1lc3NhZ2UgXSA9IHRydWU7XG4gIH07XG59IGVsc2Uge1xuICByZXBvcnQgPSBub29wO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcG9ydDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4uL3NldHRpbmdzJyApO1xuXG4vKipcbiAqINCQ0LHRgdGC0YDQsNC60YLQvdGL0Lkg0LrQu9Cw0YHRgSDQstC10LrRgtC+0YDQsCDRgSDQsdCw0LfQvtCy0YvQvNC4INC80LXRgtC+0LTQsNC80LguXG4gKlxuICog0KfRgtC+0LHRiyDQuNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNGD0LTRg9GB0Ysg0LLQvNC10YHRgtC+INGA0LDQtNC40LDQvdC+0LIg0L3QsNC00L4g0L3QsNC/0LjRgdCw0YLRjCDRgdC70LXQtNGD0Y7RidC10LU6XG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAndjYuanMvY29yZS9zZXR0aW5ncycgKTtcbiAqIHNldHRpbmdzLmRlZ3JlZXMgPSB0cnVlO1xuICogYGBgXG4gKiBAYWJzdHJhY3RcbiAqIEBjb25zdHJ1Y3RvciB2Ni5BYnN0cmFjdFZlY3RvclxuICogQHNlZSB2Ni5WZWN0b3IyRFxuICogQHNlZSB2Ni5WZWN0b3IzRFxuICovXG5mdW5jdGlvbiBBYnN0cmFjdFZlY3RvciAoKVxue1xuICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGFic3RyYWN0IGNsYXNzIChuZXcgdjYuQWJzdHJhY3RWZWN0b3IpJyApO1xufVxuXG5BYnN0cmFjdFZlY3Rvci5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQndC+0YDQvNCw0LvQuNC30YPQtdGCINCy0LXQutGC0L7RgC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNub3JtYWxpemVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5ub3JtYWxpemUoKTsgLy8gVmVjdG9yMkQgeyB4OiAwLjg5NDQyNzE5MDk5OTkxNTksIHk6IDAuNDQ3MjEzNTk1NDk5OTU3OSB9XG4gICAqL1xuICBub3JtYWxpemU6IGZ1bmN0aW9uIG5vcm1hbGl6ZSAoKVxuICB7XG4gICAgdmFyIG1hZyA9IHRoaXMubWFnKCk7XG5cbiAgICBpZiAoIG1hZyAmJiBtYWcgIT09IDEgKSB7XG4gICAgICB0aGlzLmRpdiggbWFnICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCY0LfQvNC10L3Rj9C10YIg0L3QsNC/0YDQsNCy0LvQtdC90LjQtSDQstC10LrRgtC+0YDQsCDQvdCwIGBcImFuZ2xlXCJgINGBINGB0L7RhdGA0LDQvdC10L3QuNC10Lwg0LTQu9C40L3Riy5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNzZXRBbmdsZVxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUg0J3QvtCy0L7QtSDQvdCw0L/RgNCw0LLQu9C10L3QuNC1LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnNldEFuZ2xlKCA0NSAqIE1hdGguUEkgLyAxODAgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjE2MjI3NzY2MDE2ODM3OTUsIHk6IDMuMTYyMjc3NjYwMTY4Mzc5IH1cbiAgICogQGV4YW1wbGUgPGNhcHRpb24+0JjRgdC/0L7Qu9GM0LfRg9GPINCz0YDRg9C00YPRgdGLPC9jYXB0aW9uPlxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5zZXRBbmdsZSggNDUgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjE2MjI3NzY2MDE2ODM3OTUsIHk6IDMuMTYyMjc3NjYwMTY4Mzc5IH1cbiAgICovXG4gIHNldEFuZ2xlOiBmdW5jdGlvbiBzZXRBbmdsZSAoIGFuZ2xlIClcbiAge1xuICAgIHZhciBtYWcgPSB0aGlzLm1hZygpO1xuXG4gICAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgICAgYW5nbGUgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICB9XG5cbiAgICB0aGlzLnggPSBtYWcgKiBNYXRoLmNvcyggYW5nbGUgKTtcbiAgICB0aGlzLnkgPSBtYWcgKiBNYXRoLnNpbiggYW5nbGUgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQmNC30LzQtdC90Y/QtdGCINC00LvQuNC90YMg0LLQtdC60YLQvtGA0LAg0L3QsCBgXCJ2YWx1ZVwiYCDRgSDRgdC+0YXRgNCw0L3QtdC90LjQtdC8INC90LDQv9GA0LDQstC70LXQvdC40Y8uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3Ijc2V0TWFnXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQndC+0LLQsNGPINC00LvQuNC90LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkuc2V0TWFnKCA0MiApOyAvLyBWZWN0b3IyRCB7IHg6IDM3LjU2NTk0MjAyMTk5NjQ2LCB5OiAxOC43ODI5NzEwMTA5OTgyMyB9XG4gICAqL1xuICBzZXRNYWc6IGZ1bmN0aW9uIHNldE1hZyAoIHZhbHVlIClcbiAge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZSgpLm11bCggdmFsdWUgKTtcbiAgfSxcblxuICAvKipcbiAgICog0J/QvtCy0L7RgNCw0YfQuNCy0LDQtdGCINCy0LXQutGC0L7RgCDQvdCwIGBcImFuZ2xlXCJgINGD0LPQvtC7INGBINGB0L7RhdGA0LDQvdC10L3QuNC10Lwg0LTQu9C40L3Riy5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNyb3RhdGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkucm90YXRlKCA1ICogTWF0aC5QSSAvIDE4MCApOyAvLyBWZWN0b3IyRCB7IHg6IDMuODEwNDY3MzA2ODcxNjY2LCB5OiAyLjM0MTAxMjM2NzE3NDEyMzYgfVxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj7QmNGB0L/QvtC70YzQt9GD0Y8g0LPRgNGD0LTRg9GB0Ys8L2NhcHRpb24+XG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnJvdGF0ZSggNSApOyAvLyBWZWN0b3IyRCB7IHg6IDMuODEwNDY3MzA2ODcxNjY2LCB5OiAyLjM0MTAxMjM2NzE3NDEyMzYgfVxuICAgKi9cbiAgcm90YXRlOiBmdW5jdGlvbiByb3RhdGUgKCBhbmdsZSApXG4gIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcblxuICAgIHZhciBjLCBzO1xuXG4gICAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgICAgYW5nbGUgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICB9XG5cbiAgICBjID0gTWF0aC5jb3MoIGFuZ2xlICk7XG4gICAgcyA9IE1hdGguc2luKCBhbmdsZSApO1xuXG4gICAgdGhpcy54ID0gKCB4ICogYyApIC0gKCB5ICogcyApO1xuICAgIHRoaXMueSA9ICggeCAqIHMgKSArICggeSAqIGMgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRgtC10LrRg9GJ0LXQtSDQvdCw0L/RgNCw0LLQu9C10L3QuNC1INCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI2dldEFuZ2xlXG4gICAqIEByZXR1cm4ge251bWJlcn0g0J3QsNC/0YDQsNCy0LvQtdC90LjQtSAo0YPQs9C+0LspINCyINCz0YDQsNC00YPRgdCw0YUg0LjQu9C4INGA0LDQtNC40LDQvdCw0YUuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMSwgMSApLmdldEFuZ2xlKCk7IC8vIC0+IDAuNzg1Mzk4MTYzMzk3NDQ4M1xuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj7QmNGB0L/QvtC70YzQt9GD0Y8g0LPRgNGD0LTRg9GB0Ys8L2NhcHRpb24+XG4gICAqIG5ldyBWZWN0b3IyRCggMSwgMSApLmdldEFuZ2xlKCk7IC8vIC0+IDQ1XG4gICAqL1xuICBnZXRBbmdsZTogZnVuY3Rpb24gZ2V0QW5nbGUgKClcbiAge1xuICAgIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICAgIHJldHVybiBNYXRoLmF0YW4yKCB0aGlzLnksIHRoaXMueCApICogMTgwIC8gTWF0aC5QSTtcbiAgICB9XG5cbiAgICByZXR1cm4gTWF0aC5hdGFuMiggdGhpcy55LCB0aGlzLnggKTtcbiAgfSxcblxuICAvKipcbiAgICog0J7Qs9GA0LDQvdC40YfQuNCy0LDQtdGCINC00LvQuNC90YMg0LLQtdC60YLQvtGA0LAg0LTQviBgXCJ2YWx1ZVwiYC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNsaW1pdFxuICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWUg0JzQsNC60YHQuNC80LDQu9GM0L3QsNGPINC00LvQuNC90LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCAxLCAxICkubGltaXQoIDEgKTsgLy8gVmVjdG9yMkQgeyB4OiAwLjcwNzEwNjc4MTE4NjU0NzUsIHk6IDAuNzA3MTA2NzgxMTg2NTQ3NSB9XG4gICAqL1xuICBsaW1pdDogZnVuY3Rpb24gbGltaXQgKCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgbWFnID0gdGhpcy5tYWdTcSgpO1xuXG4gICAgaWYgKCBtYWcgPiB2YWx1ZSAqIHZhbHVlICkge1xuICAgICAgdGhpcy5kaXYoIE1hdGguc3FydCggbWFnICkgKS5tdWwoIHZhbHVlICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC00LvQuNC90YMg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjbWFnXG4gICAqIEByZXR1cm4ge251bWJlcn0g0JTQu9C40L3QsCDQstC10LrRgtC+0YDQsC5cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCAyLCAyICkubWFnKCk7IC8vIC0+IDIuODI4NDI3MTI0NzQ2MTkwM1xuICAgKi9cbiAgbWFnOiBmdW5jdGlvbiBtYWcgKClcbiAge1xuICAgIHJldHVybiBNYXRoLnNxcnQoIHRoaXMubWFnU3EoKSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQtNC70LjQvdGDINCy0LXQutGC0L7RgNCwINCyINC60LLQsNC00YDQsNGC0LUuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjbWFnU3FcbiAgICogQHJldHVybiB7bnVtYmVyfSDQlNC70LjQvdCwINCy0LXQutGC0L7RgNCwINCyINC60LLQsNC00YDQsNGC0LUuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMiwgMiApLm1hZ1NxKCk7IC8vIC0+IDhcbiAgICovXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC60LvQvtC9INCy0LXQutGC0L7RgNCwLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI2Nsb25lXG4gICAqIEByZXR1cm4ge3Y2LkFic3RyYWN0VmVjdG9yfSDQmtC70L7QvSDQstC10LrRgtC+0YDQsC5cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkuY2xvbmUoKTtcbiAgICovXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstC10LrRgtC+0YDQsCAocHJldHRpZmllZCkuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjdG9TdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQuMzIxLCAyLjM0NSApLnRvU3RyaW5nKCk7IC8vIC0+IFwidjYuVmVjdG9yMkQgeyB4OiA0LjMyLCB5OiAyLjM1IH1cIlxuICAgKi9cblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQuNGB0YLQsNC90YbQuNGOINC80LXQttC00YMg0LTQstGD0LzRjyDQstC10LrRgtC+0YDQsNC80LguXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjZGlzdFxuICAgKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCU0YDRg9Cz0L7QuSAo0LLRgtC+0YDQvtC5KSDQstC10LrRgtC+0YAuXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCAzLCAzICkuZGlzdCggbmV3IFZlY3RvcjJEKCAxLCAxICkgKTsgLy8gLT4gMi44Mjg0MjcxMjQ3NDYxOTAzXG4gICAqL1xuXG4gIGNvbnN0cnVjdG9yOiBBYnN0cmFjdFZlY3RvclxufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3Rvci5fZnJvbUFuZ2xlXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gVmVjdG9yIHtAbGluayB2Ni5WZWN0b3IyRH0sIHtAbGluayB2Ni5WZWN0b3IzRH0uXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgYW5nbGVcbiAqIEByZXR1cm4ge3Y2LkFic3RyYWN0VmVjdG9yfVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5mcm9tQW5nbGVcbiAqL1xuQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZSA9IGZ1bmN0aW9uIF9mcm9tQW5nbGUgKCBWZWN0b3IsIGFuZ2xlIClcbntcbiAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgIGFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gIH1cblxuICByZXR1cm4gbmV3IFZlY3RvciggTWF0aC5jb3MoIGFuZ2xlICksIE1hdGguc2luKCBhbmdsZSApICk7XG59O1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINGA0LDQvdC00L7QvNC90YvQuSDQstC10LrRgtC+0YAuXG4gKiBAdmlydHVhbFxuICogQHN0YXRpY1xuICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3Rvci5yYW5kb21cbiAqIEByZXR1cm4ge3Y2LkFic3RyYWN0VmVjdG9yfSDQktC+0LfQstGA0LDRidCw0LXRgiDQvdC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdGL0Lkg0LLQtdC60YLQvtGAINGBINGA0LDQvdC00L7QvNC90YvQvCDQvdCw0L/RgNCw0LLQu9C10L3QuNC10LwuXG4gKi9cblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQstC10LrRgtC+0YAg0YEg0L3QsNC/0YDQsNCy0LvQtdC90LjQtdC8INGA0LDQstC90YvQvCBgXCJhbmdsZVwiYC5cbiAqIEB2aXJ0dWFsXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yLmZyb21BbmdsZVxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgIGFuZ2xlINCd0LDQv9GA0LDQstC70LXQvdC40LUg0LLQtdC60YLQvtGA0LAuXG4gKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0L3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3Ri9C5INCy0LXQutGC0L7RgC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFic3RyYWN0VmVjdG9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2V0dGluZ3MgICAgICAgPSByZXF1aXJlKCAnLi4vc2V0dGluZ3MnICk7XG52YXIgQWJzdHJhY3RWZWN0b3IgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFZlY3RvcicgKTtcblxuLyoqXG4gKiAyRCDQstC10LrRgtC+0YAuXG4gKiBAY29uc3RydWN0b3IgdjYuVmVjdG9yMkRcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0VmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0gWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSBZINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICogQGV4YW1wbGVcbiAqIHZhciBWZWN0b3IyRCA9IHJlcXVpcmUoICd2Ni5qcy9tYXRoL1ZlY3RvcjJEJyApO1xuICogdmFyIHBvc2l0aW9uID0gbmV3IFZlY3RvcjJEKCA0LCAyICk7IC8vIFZlY3RvcjJEIHsgeDogNCwgeTogMiB9XG4gKi9cbmZ1bmN0aW9uIFZlY3RvcjJEICggeCwgeSApXG57XG4gIC8qKlxuICAgKiBYINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlZlY3RvcjJEI3hcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHggPSBuZXcgVmVjdG9yMkQoIDQsIDIgKS54OyAvLyAtPiA0XG4gICAqL1xuXG4gIC8qKlxuICAgKiBZINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlZlY3RvcjJEI3lcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHkgPSBuZXcgVmVjdG9yMkQoIDQsIDIgKS55OyAvLyAtPiAyXG4gICAqL1xuXG4gIHRoaXMuc2V0KCB4LCB5ICk7XG59XG5cblZlY3RvcjJELnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0VmVjdG9yLnByb3RvdHlwZSApO1xuVmVjdG9yMkQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVmVjdG9yMkQ7XG5cbi8qKlxuICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNzZXRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQndC+0LLQsNGPIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0J3QvtCy0LDRjyBZINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLnNldCggNCwgMiApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICggeCwgeSApXG57XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC6INC60L7QvtGA0LTQuNC90LDRgtCw0LwgWCDQuCBZINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2FkZFxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3Qvi5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5hZGQoIDQsIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiA0LCB5OiAyIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZCAoIHgsIHkgKVxue1xuICB0aGlzLnggKz0geCB8fCAwO1xuICB0aGlzLnkgKz0geSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JLRi9GH0LjRgtCw0LXRgiDQuNC3INC60L7QvtGA0LTQuNC90LDRgiBYINC4IFkg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC1INC/0LDRgNCw0LzQtdGC0YDRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjc3ViXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINCy0YvRh9GC0LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5zdWIoIDQsIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiAtNCwgeTogLTIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24gc3ViICggeCwgeSApXG57XG4gIHRoaXMueCAtPSB4IHx8IDA7XG4gIHRoaXMueSAtPSB5IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQo9C80L3QvtC20LDQtdGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIGB2YWx1ZWAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI211bFxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCn0LjRgdC70L4sINC90LAg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0YPQvNC90L7QttC40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5tdWwoIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiA4LCB5OiA0IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLm11bCA9IGZ1bmN0aW9uIG11bCAoIHZhbHVlIClcbntcbiAgdGhpcy54ICo9IHZhbHVlO1xuICB0aGlzLnkgKj0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIGB2YWx1ZWAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2RpdlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCn0LjRgdC70L4sINC90LAg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0YDQsNC30LTQtdC70LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmRpdiggMiApOyAvLyBWZWN0b3IyRCB7IHg6IDIsIHk6IDEgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuZGl2ID0gZnVuY3Rpb24gZGl2ICggdmFsdWUgKVxue1xuICB0aGlzLnggLz0gdmFsdWU7XG4gIHRoaXMueSAvPSB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjZG90XG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt4PTBdXG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt5PTBdXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkuZGl2KCAyLCAzICk7IC8vIDE0LCDQv9C+0YLQvtC80YMg0YfRgtC+OiBcIig0ICogMikgKyAoMiAqIDMpID0gOCArIDYgPSAxNFwiXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiBkb3QgKCB4LCB5IClcbntcbiAgcmV0dXJuICggdGhpcy54ICogKCB4IHx8IDAgKSApICtcbiAgICAgICAgICggdGhpcy55ICogKCB5IHx8IDAgKSApO1xufTtcblxuLyoqXG4gKiDQmNC90YLQtdGA0L/QvtC70LjRgNGD0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNsZXJwXG4gKiBAcGFyYW0ge251bWJlcn0geFxuICogQHBhcmFtIHtudW1iZXJ9IHlcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmxlcnAoIDgsIDQsIDAuNSApOyAvLyBWZWN0b3IyRCB7IHg6IDYsIHk6IDMgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uICggeCwgeSwgdmFsdWUgKVxue1xuICB0aGlzLnggKz0gKCB4IC0gdGhpcy54ICkgKiB2YWx1ZSB8fCAwO1xuICB0aGlzLnkgKz0gKCB5IC0gdGhpcy55ICkgKiB2YWx1ZSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JrQvtC/0LjRgNGD0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNzZXRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INGB0LrQvtC/0LjRgNC+0LLQsNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuc2V0VmVjdG9yKCBuZXcgVmVjdG9yMkQoIDQsIDIgKSApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc2V0VmVjdG9yID0gZnVuY3Rpb24gc2V0VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc2V0KCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2FkZFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LTQvtCx0LDQstC40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5hZGRWZWN0b3IoIG5ldyBWZWN0b3IyRCggNCwgMiApICk7IC8vIFZlY3RvcjJEIHsgeDogNCwgeTogMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5hZGRWZWN0b3IgPSBmdW5jdGlvbiBhZGRWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5hZGQoIHZlY3Rvci54LCB2ZWN0b3IueSApO1xufTtcblxuLyoqXG4gKiDQktGL0YfQuNGC0LDQtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI3N1YlZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LLRi9GH0LXRgdGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuc3ViVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDQsIDIgKSApOyAvLyBWZWN0b3IyRCB7IHg6IC00LCB5OiAtMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5zdWJWZWN0b3IgPSBmdW5jdGlvbiBzdWJWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5zdWIoIHZlY3Rvci54LCB2ZWN0b3IueSApO1xufTtcblxuLyoqXG4gKiDQo9C80L3QvtC20LDQtdGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIFgg0LggWSDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbXVsVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGAINC00LvRjyDRg9C80L3QvtC20LXQvdC40Y8uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkubXVsVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDIsIDMgKSApOyAvLyBWZWN0b3IyRCB7IHg6IDgsIHk6IDYgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUubXVsVmVjdG9yID0gZnVuY3Rpb24gbXVsVmVjdG9yICggdmVjdG9yIClcbntcbiAgdGhpcy54ICo9IHZlY3Rvci54O1xuICB0aGlzLnkgKj0gdmVjdG9yLnk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIFgg0LggWSDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjZGl2VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQvdCwINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5kaXZWZWN0b3IoIG5ldyBWZWN0b3IyRCggMiwgMC41ICkgKTsgLy8gVmVjdG9yMkQgeyB4OiAyLCB5OiA0IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmRpdlZlY3RvciA9IGZ1bmN0aW9uIGRpdlZlY3RvciAoIHZlY3RvciApXG57XG4gIHRoaXMueCAvPSB2ZWN0b3IueDtcbiAgdGhpcy55IC89IHZlY3Rvci55O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNkb3RWZWN0b3JcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5kb3RWZWN0b3IoIG5ldyBWZWN0b3IyRCggMywgNSApICk7IC8vIC0+IDIyXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kb3RWZWN0b3IgPSBmdW5jdGlvbiBkb3RWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5kb3QoIHZlY3Rvci54LCB2ZWN0b3IueSApO1xufTtcblxuLyoqXG4gKiDQmNC90YLQtdGA0L/QvtC70LjRgNGD0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0LzQtdC20LTRgyDQtNGA0YPQs9C40Lwg0LLQtdC60YLQvtGA0L7QvC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbGVycFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmxlcnBWZWN0b3IoIG5ldyBWZWN0b3IyRCggMiwgMSApLCAwLjUgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLCB5OiAxLjUgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUubGVycFZlY3RvciA9IGZ1bmN0aW9uIGxlcnBWZWN0b3IgKCB2ZWN0b3IsIHZhbHVlIClcbntcbiAgcmV0dXJuIHRoaXMubGVycCggdmVjdG9yLngsIHZlY3Rvci55LCB2YWx1ZSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbWFnU3FcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLm1hZ1NxID0gZnVuY3Rpb24gbWFnU3EgKClcbntcbiAgcmV0dXJuICggdGhpcy54ICogdGhpcy54ICkgKyAoIHRoaXMueSAqIHRoaXMueSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjY2xvbmVcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUgKClcbntcbiAgcmV0dXJuIG5ldyBWZWN0b3IyRCggdGhpcy54LCB0aGlzLnkgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2Rpc3RcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmRpc3QgPSBmdW5jdGlvbiBkaXN0ICggdmVjdG9yIClcbntcbiAgdmFyIHggPSB2ZWN0b3IueCAtIHRoaXMueDtcbiAgdmFyIHkgPSB2ZWN0b3IueSAtIHRoaXMueTtcbiAgcmV0dXJuIE1hdGguc3FydCggKCB4ICogeCApICsgKCB5ICogeSApICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCN0b1N0cmluZ1xuICovXG5WZWN0b3IyRC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKVxue1xuICByZXR1cm4gJ3Y2LlZlY3RvcjJEIHsgeDogJyArIHRoaXMueC50b0ZpeGVkKCAyICkgKyAnLCB5OiAnICsgdGhpcy55LnRvRml4ZWQoIDIgKSArICcgfSc7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQucmFuZG9tXG4gKiBAc2VlIHY2LkFic3RyYWN0VmVjdG9yLnJhbmRvbVxuICovXG5WZWN0b3IyRC5yYW5kb20gPSBmdW5jdGlvbiByYW5kb20gKClcbntcbiAgdmFyIHZhbHVlO1xuXG4gIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICB2YWx1ZSA9IDM2MDtcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IE1hdGguUEkgKiAyO1xuICB9XG5cbiAgcmV0dXJuIFZlY3RvcjJELmZyb21BbmdsZSggTWF0aC5yYW5kb20oKSAqIHZhbHVlICk7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQuZnJvbUFuZ2xlXG4gKiBAc2VlIHY2LkFic3RyYWN0VmVjdG9yLmZyb21BbmdsZVxuICovXG5WZWN0b3IyRC5mcm9tQW5nbGUgPSBmdW5jdGlvbiBmcm9tQW5nbGUgKCBhbmdsZSApXG57XG4gIHJldHVybiBBYnN0cmFjdFZlY3Rvci5fZnJvbUFuZ2xlKCBWZWN0b3IyRCwgYW5nbGUgKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yMkQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBBYnN0cmFjdFZlY3RvciA9IHJlcXVpcmUoICcuL0Fic3RyYWN0VmVjdG9yJyApO1xuXG4vKipcbiAqIDNEINCy0LXQutGC0L7RgC5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5WZWN0b3IzRFxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RWZWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSBYINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0gWiDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgVmVjdG9yM0QgPSByZXF1aXJlKCAndjYuanMvbWF0aC9WZWN0b3IzRCcgKTtcbiAqIHZhciBwb3NpdGlvbiA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDMgfVxuICovXG5mdW5jdGlvbiBWZWN0b3IzRCAoIHgsIHksIHogKVxue1xuICAvKipcbiAgICogWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IzRCN4XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB4ID0gbmV3IFZlY3RvcjNEKCA0LCAyLCAzICkueDsgLy8gLT4gNFxuICAgKi9cblxuICAvKipcbiAgICogWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IzRCN5XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB5ID0gbmV3IFZlY3RvcjNEKCA0LCAyLCAzICkueTsgLy8gLT4gMlxuICAgKi9cblxuICAvKipcbiAgICogWiDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IzRCN6XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB6ID0gbmV3IFZlY3RvcjNEKCA0LCAyLCAzICkuejsgLy8gLT4gM1xuICAgKi9cblxuICB0aGlzLnNldCggeCwgeSwgeiApO1xufVxuXG5WZWN0b3IzRC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdFZlY3Rvci5wcm90b3R5cGUgKTtcblZlY3RvcjNELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFZlY3RvcjNEO1xuXG4vKipcbiAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3NldFxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCd0L7QstCw0Y8gWCDQutC+0L7RgNC00LjQvdCw0YLQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQndC+0LLQsNGPIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0g0J3QvtCy0LDRjyBaINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLnNldCggNCwgMiwgNiApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICggeCwgeSwgeiApXG57XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xuICB0aGlzLnogPSB6IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC+0LHQsNCy0LvRj9C10YIg0Log0LrQvtC+0YDQtNC40L3QsNGC0LDQvCBYLCBZLCDQuCBaINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2FkZFxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbej0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvdC+LlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLmFkZCggNCwgMiwgNiApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkICggeCwgeSwgeiApXG57XG4gIHRoaXMueCArPSB4IHx8IDA7XG4gIHRoaXMueSArPSB5IHx8IDA7XG4gIHRoaXMueiArPSB6IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQktGL0YfQuNGC0LDQtdGCINC40Lcg0LrQvtC+0YDQtNC40L3QsNGCIFgsIFksINC4IFog0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC1INC/0LDRgNCw0LzQtdGC0YDRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0Qjc3ViXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINCy0YvRh9GC0LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbej0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LLRi9GH0YLQtdC90L4uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuc3ViKCA0LCAyLCA2ICk7IC8vIFZlY3RvcjNEIHsgeDogLTQsIHk6IC0yLCB6OiAtNiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbiBzdWIgKCB4LCB5LCB6IClcbntcbiAgdGhpcy54IC09IHggfHwgMDtcbiAgdGhpcy55IC09IHkgfHwgMDtcbiAgdGhpcy56IC09IHogfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCj0LzQvdC+0LbQsNC10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIGB2YWx1ZWAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI211bFxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCn0LjRgdC70L4sINC90LAg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0YPQvNC90L7QttC40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5tdWwoIDIgKTsgLy8gVmVjdG9yM0QgeyB4OiA4LCB5OiA0LCB6OiAxMiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5tdWwgPSBmdW5jdGlvbiBtdWwgKCB2YWx1ZSApXG57XG4gIHRoaXMueCAqPSB2YWx1ZTtcbiAgdGhpcy55ICo9IHZhbHVlO1xuICB0aGlzLnogKj0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNkaXZcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGA0LDQt9C00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5kaXYoIDIgKTsgLy8gVmVjdG9yM0QgeyB4OiAyLCB5OiAxLCB6OiAzIH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmRpdiA9IGZ1bmN0aW9uIGRpdiAoIHZhbHVlIClcbntcbiAgdGhpcy54IC89IHZhbHVlO1xuICB0aGlzLnkgLz0gdmFsdWU7XG4gIHRoaXMueiAvPSB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZG90XG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt4PTBdXG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt5PTBdXG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt6PTBdXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkuZG90KCAyLCAzLCA0ICk7IC8vIC0+IDM4LCDQv9C+0YLQvtC80YMg0YfRgtC+OiBcIig0ICogMikgKyAoMiAqIDMpICsgKDYgKiA0KSA9IDggKyA2ICsgMjQgPSAzOFwiXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiBkb3QgKCB4LCB5LCB6IClcbntcbiAgcmV0dXJuICggdGhpcy54ICogKCB4IHx8IDAgKSApICtcbiAgICAgICAgICggdGhpcy55ICogKCB5IHx8IDAgKSApICtcbiAgICAgICAgICggdGhpcy56ICogKCB6IHx8IDAgKSApO1xufTtcblxuLyoqXG4gKiDQmNC90YLQtdGA0L/QvtC70LjRgNGD0LXRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC80LXQttC00YMg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC80Lgg0L/QsNGA0LDQvNC10YLRgNCw0LzQuC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbGVycFxuICogQHBhcmFtIHtudW1iZXJ9IHhcbiAqIEBwYXJhbSB7bnVtYmVyfSB5XG4gKiBAcGFyYW0ge251bWJlcn0gelxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubGVycCggOCwgNCwgMTIsIDAuNSApOyAvLyBWZWN0b3IzRCB7IHg6IDYsIHk6IDMsIHo6IDkgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uICggeCwgeSwgeiwgdmFsdWUgKVxue1xuICB0aGlzLnggKz0gKCB4IC0gdGhpcy54ICkgKiB2YWx1ZSB8fCAwO1xuICB0aGlzLnkgKz0gKCB5IC0gdGhpcy55ICkgKiB2YWx1ZSB8fCAwO1xuICB0aGlzLnogKz0gKCB6IC0gdGhpcy56ICkgKiB2YWx1ZSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JrQvtC/0LjRgNGD0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNzZXRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INGB0LrQvtC/0LjRgNC+0LLQsNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuc2V0VmVjdG9yKCBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc2V0VmVjdG9yID0gZnVuY3Rpb24gc2V0VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc2V0KCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNhZGRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00L7QsdCw0LLQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuYWRkVmVjdG9yKCBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuYWRkVmVjdG9yID0gZnVuY3Rpb24gYWRkVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuYWRkKCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCS0YvRh9C40YLQsNC10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0Qjc3ViVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQstGL0YfQtdGB0YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5zdWJWZWN0b3IoIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApICk7IC8vIFZlY3RvcjNEIHsgeDogLTQsIHk6IC0yLCB6OiAtNiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5zdWJWZWN0b3IgPSBmdW5jdGlvbiBzdWJWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5zdWIoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnogKTtcbn07XG5cbi8qKlxuICog0KPQvNC90L7QttCw0LXRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgWCwgWSwg0LggWiDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbXVsVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGAINC00LvRjyDRg9C80L3QvtC20LXQvdC40Y8uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubXVsVmVjdG9yKCBuZXcgVmVjdG9yM0QoIDIsIDMsIDQgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDgsIHk6IDYsIHo6IDI0IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLm11bFZlY3RvciA9IGZ1bmN0aW9uIG11bFZlY3RvciAoIHZlY3RvciApXG57XG4gIHRoaXMueCAqPSB2ZWN0b3IueDtcbiAgdGhpcy55ICo9IHZlY3Rvci55O1xuICB0aGlzLnogKj0gdmVjdG9yLno7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBYLCBZLCDQuCBaINC00YDRg9Cz0L7Qs9C+INCy0LXQutGC0L7RgNCwLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNkaXZWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC90LAg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LTQtdC70LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmRpdlZlY3RvciggbmV3IFZlY3RvcjNEKCAyLCAwLjUsIDQgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDIsIHk6IDQsIHo6IDEuNSB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kaXZWZWN0b3IgPSBmdW5jdGlvbiBkaXZWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICB0aGlzLnggLz0gdmVjdG9yLng7XG4gIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgdGhpcy56IC89IHZlY3Rvci56O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNkb3RWZWN0b3JcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5kb3RWZWN0b3IoIG5ldyBWZWN0b3IzRCggMiwgMywgLTIgKSApOyAvLyAtPiAyXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kb3RWZWN0b3IgPSBmdW5jdGlvbiBkb3RWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5kb3QoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnogKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvNC10LbQtNGDINC00YDRg9Cz0LjQvCDQstC10LrRgtC+0YDQvtC8LlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNsZXJwVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgIHZhbHVlXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubGVycFZlY3RvciggbmV3IFZlY3RvcjNEKCA4LCA0LCAxMiApLCAwLjUgKTsgLy8gVmVjdG9yM0QgeyB4OiA2LCB5OiAzLCB6OiA5IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmxlcnBWZWN0b3IgPSBmdW5jdGlvbiBsZXJwVmVjdG9yICggdmVjdG9yLCB2YWx1ZSApXG57XG4gIHJldHVybiB0aGlzLmxlcnAoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnosIHZhbHVlICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNtYWdTcVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUubWFnU3EgPSBmdW5jdGlvbiBtYWdTcSAoKVxue1xuICByZXR1cm4gKCB0aGlzLnggKiB0aGlzLnggKSArICggdGhpcy55ICogdGhpcy55ICkgKyAoIHRoaXMueiAqIHRoaXMueiApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjY2xvbmVcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUgKClcbntcbiAgcmV0dXJuIG5ldyBWZWN0b3IzRCggdGhpcy54LCB0aGlzLnksIHRoaXMueiApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZGlzdFxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZGlzdCA9IGZ1bmN0aW9uIGRpc3QgKCB2ZWN0b3IgKVxue1xuICB2YXIgeCA9IHZlY3Rvci54IC0gdGhpcy54O1xuICB2YXIgeSA9IHZlY3Rvci55IC0gdGhpcy55O1xuICB2YXIgeiA9IHZlY3Rvci56IC0gdGhpcy56O1xuICByZXR1cm4gTWF0aC5zcXJ0KCAoIHggKiB4ICkgKyAoIHkgKiB5ICkgKyAoIHogKiB6ICkgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3RvU3RyaW5nXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpXG57XG4gIHJldHVybiAndjYuVmVjdG9yM0QgeyB4OiAnICsgdGhpcy54LnRvRml4ZWQoIDIgKSArICcsIHk6ICcgKyB0aGlzLnkudG9GaXhlZCggMiApICsgJywgejogJyArIHRoaXMuei50b0ZpeGVkKCAyICkgKyAnIH0nO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNELnJhbmRvbVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5yYW5kb21cbiAqL1xuVmVjdG9yM0QucmFuZG9tID0gZnVuY3Rpb24gcmFuZG9tICgpXG57XG4gIC8vIFVzZSB0aGUgZXF1YWwtYXJlYSBwcm9qZWN0aW9uIGFsZ29yaXRobS5cbiAgdmFyIHRoZXRhID0gTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgKiAyO1xuICB2YXIgeiAgICAgPSAoIE1hdGgucmFuZG9tKCkgKiAyICkgLSAxO1xuICB2YXIgbiAgICAgPSBNYXRoLnNxcnQoIDEgLSAoIHogKiB6ICkgKTtcbiAgcmV0dXJuIG5ldyBWZWN0b3IzRCggbiAqIE1hdGguY29zKCB0aGV0YSApLCBuICogTWF0aC5zaW4oIHRoZXRhICksIHogKTtcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRC5mcm9tQW5nbGVcbiAqIEBzZWUgdjYuQWJzdHJhY3RWZWN0b3IuZnJvbUFuZ2xlXG4gKi9cblZlY3RvcjNELmZyb21BbmdsZSA9IGZ1bmN0aW9uIGZyb21BbmdsZSAoIGFuZ2xlIClcbntcbiAgcmV0dXJuIEFic3RyYWN0VmVjdG9yLl9mcm9tQW5nbGUoIFZlY3RvcjNELCBhbmdsZSApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3IzRDtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQrdGC0L4g0L/RgNC+0YHRgtGA0LDQvdGB0YLQstC+INC40LzQtdC9ICjRjdGC0L7RgiBuYW1lcHNwYWNlKSDRgNC10LDQu9C40LfRg9C10YIg0YDQsNCx0L7RgtGDINGBIDJEINC80LDRgtGA0LjRhtCw0LzQuCAzeDMuXG4gKiBAbmFtZXNwYWNlIHY2Lm1hdDNcbiAqIEBleGFtcGxlXG4gKiB2YXIgbWF0MyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL21hdGgvbWF0MycgKTtcbiAqL1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINGB0YLQsNC90LTQsNGA0YLQvdGD0Y4gKGlkZW50aXR5KSAzeDMg0LzQsNGC0YDQuNGG0YMuXG4gKiBAbWV0aG9kIHY2Lm1hdDMuaWRlbnRpdHlcbiAqIEByZXR1cm4ge0FycmF5LjxudW1iZXI+fSDQndC+0LLQsNGPINC80LDRgtGA0LjRhtCwLlxuICogQGV4YW1wbGVcbiAqIC8vIFJldHVybnMgdGhlIGlkZW50aXR5LlxuICogdmFyIG1hdHJpeCA9IG1hdDMuaWRlbnRpdHkoKTtcbiAqL1xuZXhwb3J0cy5pZGVudGl0eSA9IGZ1bmN0aW9uIGlkZW50aXR5ICgpXG57XG4gIHJldHVybiBbXG4gICAgMSwgMCwgMCxcbiAgICAwLCAxLCAwLFxuICAgIDAsIDAsIDFcbiAgXTtcbn07XG5cbi8qKlxuICog0KHQsdGA0LDRgdGL0LLQsNC10YIg0LzQsNGC0YDQuNGG0YMgYFwibTFcImAg0LTQviDRgdGC0LDQvdC00LDRgNGC0L3Ri9GFIChpZGVudGl0eSkg0LfQvdCw0YfQtdC90LjQuS5cbiAqIEBtZXRob2QgdjYubWF0My5zZXRJZGVudGl0eVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xINCc0LDRgtGA0LjRhtCwLlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIFNldHMgdGhlIGlkZW50aXR5LlxuICogbWF0My5zZXRJZGVudGl0eSggbWF0cml4ICk7XG4gKi9cbmV4cG9ydHMuc2V0SWRlbnRpdHkgPSBmdW5jdGlvbiBzZXRJZGVudGl0eSAoIG0xIClcbntcbiAgbTFbIDAgXSA9IDE7XG4gIG0xWyAxIF0gPSAwO1xuICBtMVsgMiBdID0gMDtcbiAgbTFbIDMgXSA9IDA7XG4gIG0xWyA0IF0gPSAxO1xuICBtMVsgNSBdID0gMDtcbiAgbTFbIDYgXSA9IDA7XG4gIG0xWyA3IF0gPSAwO1xuICBtMVsgOCBdID0gMTtcbn07XG5cbi8qKlxuICog0JrQvtC/0LjRgNGD0LXRgiDQt9C90LDRh9C10L3QuNGPINC80LDRgtGA0LjRhtGLIGBcIm0yXCJgINC90LAg0LzQsNGC0YDQuNGG0YMgYFwibTFcImAuXG4gKiBAbWV0aG9kIHY2Lm1hdDMuY29weVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xINCc0LDRgtGA0LjRhtCwLCDQsiDQutC+0YLQvtGA0YPRjiDQvdCw0LTQviDQutC+0L/QuNGA0L7QstCw0YLRjC5cbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMiDQnNCw0YLRgNC40YbQsCwg0LrQvtGC0L7RgNGD0Y4g0L3QsNC00L4g0YHQutC+0L/QuNGA0L7QstCw0YLRjC5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiAvLyBDb3BpZXMgYSBtYXRyaXguXG4gKiBtYXQzLmNvcHkoIGRlc3RpbmF0aW9uTWF0cml4LCBzb3VyY2VNYXRyaXggKTtcbiAqL1xuZXhwb3J0cy5jb3B5ID0gZnVuY3Rpb24gY29weSAoIG0xLCBtMiApXG57XG4gIG0xWyAwIF0gPSBtMlsgMCBdO1xuICBtMVsgMSBdID0gbTJbIDEgXTtcbiAgbTFbIDIgXSA9IG0yWyAyIF07XG4gIG0xWyAzIF0gPSBtMlsgMyBdO1xuICBtMVsgNCBdID0gbTJbIDQgXTtcbiAgbTFbIDUgXSA9IG0yWyA1IF07XG4gIG0xWyA2IF0gPSBtMlsgNiBdO1xuICBtMVsgNyBdID0gbTJbIDcgXTtcbiAgbTFbIDggXSA9IG0yWyA4IF07XG59O1xuXG4vKipcbiAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC60LvQvtC9INC80LDRgtGA0LjRhtGLIGBcIm0xXCJgLlxuICogQG1ldGhvZCB2Ni5tYXQzLmNsb25lXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEg0JjRgdGF0L7QtNC90LDRjyDQvNCw0YLRgNC40YbQsC5cbiAqIEByZXR1cm4ge0FycmF5LjxudW1iZXI+fSAgICDQmtC70L7QvSDQvNCw0YLRgNC40YbRiy5cbiAqIEBleGFtcGxlXG4gKiAvLyBDcmVhdGVzIGEgY2xvbmUuXG4gKiB2YXIgY2xvbmUgPSBtYXQzLmNsb25lKCBtYXRyaXggKTtcbiAqL1xuZXhwb3J0cy5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lICggbTEgKVxue1xuICByZXR1cm4gW1xuICAgIG0xWyAwIF0sXG4gICAgbTFbIDEgXSxcbiAgICBtMVsgMiBdLFxuICAgIG0xWyAzIF0sXG4gICAgbTFbIDQgXSxcbiAgICBtMVsgNSBdLFxuICAgIG0xWyA2IF0sXG4gICAgbTFbIDcgXSxcbiAgICBtMVsgOCBdXG4gIF07XG59O1xuXG4vKipcbiAqINCf0LXRgNC10LzQtdGJ0LDQtdGCINC80LDRgtGA0LjRhtGDIGBcIm0xXCJgLlxuICogQG1ldGhvZCB2Ni5tYXQzLnRyYW5zbGF0ZVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xINCc0LDRgtGA0LjRhtCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIHggIFgg0L/QtdGA0LXQvNC10YnQtdC90LjRjy5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICB5ICBZINC/0LXRgNC10LzQtdGJ0LXQvdC40Y8uXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gVHJhbnNsYXRlcyBieSBbIDQsIDIgXS5cbiAqIG1hdDMudHJhbnNsYXRlKCBtYXRyaXgsIDQsIDIgKTtcbiAqL1xuZXhwb3J0cy50cmFuc2xhdGUgPSBmdW5jdGlvbiB0cmFuc2xhdGUgKCBtMSwgeCwgeSApXG57XG4gIG0xWyA2IF0gPSAoIHggKiBtMVsgMCBdICkgKyAoIHkgKiBtMVsgMyBdICkgKyBtMVsgNiBdO1xuICBtMVsgNyBdID0gKCB4ICogbTFbIDEgXSApICsgKCB5ICogbTFbIDQgXSApICsgbTFbIDcgXTtcbiAgbTFbIDggXSA9ICggeCAqIG0xWyAyIF0gKSArICggeSAqIG0xWyA1IF0gKSArIG0xWyA4IF07XG59O1xuXG4vKipcbiAqINCf0L7QstC+0YDQsNGH0LjQstCw0LXRgiDQvNCw0YLRgNC40YbRgyBgXCJtMVwiYCDQvdCwIGBcImFuZ2xlXCJgINGA0LDQtNC40LDQvdC+0LIuXG4gKiBAbWV0aG9kIHY2Lm1hdDMucm90YXRlXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEgICAg0JzQsNGC0YDQuNGG0LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgYW5nbGUg0KPQs9C+0LsuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gUm90YXRlcyBieSA0NSBkZWdyZWVzLlxuICogbWF0My5yb3RhdGUoIG1hdHJpeCwgNDUgKiBNYXRoLlBJIC8gMTgwICk7XG4gKi9cbmV4cG9ydHMucm90YXRlID0gZnVuY3Rpb24gcm90YXRlICggbTEsIGFuZ2xlIClcbntcbiAgdmFyIG0xMCA9IG0xWyAwIF07XG4gIHZhciBtMTEgPSBtMVsgMSBdO1xuICB2YXIgbTEyID0gbTFbIDIgXTtcbiAgdmFyIG0xMyA9IG0xWyAzIF07XG4gIHZhciBtMTQgPSBtMVsgNCBdO1xuICB2YXIgbTE1ID0gbTFbIDUgXTtcbiAgdmFyIHggPSBNYXRoLmNvcyggYW5nbGUgKTtcbiAgdmFyIHkgPSBNYXRoLnNpbiggYW5nbGUgKTtcbiAgbTFbIDAgXSA9ICggeCAqIG0xMCApICsgKCB5ICogbTEzICk7XG4gIG0xWyAxIF0gPSAoIHggKiBtMTEgKSArICggeSAqIG0xNCApO1xuICBtMVsgMiBdID0gKCB4ICogbTEyICkgKyAoIHkgKiBtMTUgKTtcbiAgbTFbIDMgXSA9ICggeCAqIG0xMyApIC0gKCB5ICogbTEwICk7XG4gIG0xWyA0IF0gPSAoIHggKiBtMTQgKSAtICggeSAqIG0xMSApO1xuICBtMVsgNSBdID0gKCB4ICogbTE1ICkgLSAoIHkgKiBtMTIgKTtcbn07XG5cbi8qKlxuICog0JzQsNGB0YjRgtCw0LHQuNGA0YPQtdGCINC80LDRgtGA0LjRhtGDLlxuICogQG1ldGhvZCB2Ni5tYXQzLnNjYWxlXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEg0JzQsNGC0YDQuNGG0LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgeCAgWC3RhNCw0LrRgtC+0YAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgeSAgWS3RhNCw0LrRgtC+0YAuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gU2NhbGVzIGluIFsgMiwgMiBdIHRpbWVzLlxuICogbWF0My5zY2FsZSggbWF0cml4LCAyLCAyICk7XG4gKi9cbmV4cG9ydHMuc2NhbGUgPSBmdW5jdGlvbiBzY2FsZSAoIG0xLCB4LCB5IClcbntcbiAgbTFbIDAgXSAqPSB4O1xuICBtMVsgMSBdICo9IHg7XG4gIG0xWyAyIF0gKj0geDtcbiAgbTFbIDMgXSAqPSB5O1xuICBtMVsgNCBdICo9IHk7XG4gIG0xWyA1IF0gKj0geTtcbn07XG5cbi8qKlxuICog0J/RgNC40LzQtdC90Y/QtdGCINC80LDRgtGA0LjRhtGDINC40Lcg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNGFINC/0LDRgNCw0LzQtdGC0YDQvtCyINC90LAg0LzQsNGC0YDQuNGG0YMgYFwibTFcImAuXG4gKiBAbWV0aG9kIHY2Lm1hdDMudHJhbnNmb3JtXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEgINCc0LDRgtGA0LjRhtCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0xMSBYINC80LDRgdGI0YLQsNCxIChzY2FsZSkuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTEyIFgg0L3QsNC60LvQvtC9IChza2V3KS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMjEgWSDQvdCw0LrQu9C+0L0gKHNrZXcpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0yMiBZINC80LDRgdGI0YLQsNCxIChzY2FsZSkuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgZHggIFgg0L/QtdGA0LXQvNC10YnQtdC90LjRjyAodHJhbnNsYXRlKS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBkeSAgWSDQv9C10YDQtdC80LXRidC10L3QuNGPICh0cmFuc2xhdGUpLlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiAvLyBBcHBsaWVzIGEgZG91YmxlLXNjYWxlZCBtYXRyaXguXG4gKiBtYXQzLnRyYW5zZm9ybSggbWF0cml4LCAyLCAwLCAwLCAyLCAwLCAwICk7XG4gKi9cbmV4cG9ydHMudHJhbnNmb3JtID0gZnVuY3Rpb24gdHJhbnNmb3JtICggbTEsIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbntcbiAgbTFbIDAgXSAqPSBtMTE7XG4gIG0xWyAxIF0gKj0gbTIxO1xuICBtMVsgMiBdICo9IGR4O1xuICBtMVsgMyBdICo9IG0xMjtcbiAgbTFbIDQgXSAqPSBtMjI7XG4gIG0xWyA1IF0gKj0gZHk7XG4gIG0xWyA2IF0gPSAwO1xuICBtMVsgNyBdID0gMDtcbn07XG5cbi8qKlxuICog0KHQsdGA0LDRgdGL0LLQsNC10YIg0LzQsNGC0YDQuNGG0YMgYFwibTFcImAg0LTQviDQvNCw0YLRgNC40YbRiyDQuNC3INGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7Qsi5cbiAqIEBtZXRob2QgdjYubWF0My5zZXRUcmFuc2Zvcm1cbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSAg0JzQsNGC0YDQuNGG0LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTExIFgg0LzQsNGB0YjRgtCw0LEgKHNjYWxlKS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMTIgWCDQvdCw0LrQu9C+0L0gKHNrZXcpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0yMSBZINC90LDQutC70L7QvSAoc2tldykuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTIyIFkg0LzQsNGB0YjRgtCw0LEgKHNjYWxlKS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBkeCAgWCDQv9C10YDQtdC80LXRidC10L3QuNGPICh0cmFuc2xhdGUpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIGR5ICBZINC/0LXRgNC10LzQtdGJ0LXQvdC40Y8gKHRyYW5zbGF0ZSkuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIFNldHMgdGhlIGlkZW50aXR5IGFuZCB0aGVuIGFwcGxpZXMgYSBkb3VibGUtc2NhbGVkIG1hdHJpeC5cbiAqIG1hdDMuc2V0VHJhbnNmb3JtKCBtYXRyaXgsIDIsIDAsIDAsIDIsIDAsIDAgKTtcbiAqL1xuZXhwb3J0cy5zZXRUcmFuc2Zvcm0gPSBmdW5jdGlvbiBzZXRUcmFuc2Zvcm0gKCBtMSwgbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxue1xuICAvLyBYIHNjYWxlXG4gIG0xWyAwIF0gPSBtMTE7XG4gIC8vIFggc2tld1xuICBtMVsgMSBdID0gbTEyO1xuICAvLyBZIHNrZXdcbiAgbTFbIDMgXSA9IG0yMTtcbiAgLy8gWSBzY2FsZVxuICBtMVsgNCBdID0gbTIyO1xuICAvLyBYIHRyYW5zbGF0ZVxuICBtMVsgNiBdID0gZHg7XG4gIC8vIFkgdHJhbnNsYXRlXG4gIG0xWyA3IF0gPSBkeTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZ2V0RWxlbWVudFcgPSByZXF1aXJlKCAncGVha28vZ2V0LWVsZW1lbnQtdycgKTtcbnZhciBnZXRFbGVtZW50SCA9IHJlcXVpcmUoICdwZWFrby9nZXQtZWxlbWVudC1oJyApO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICk7XG52YXIgY3JlYXRlUG9seWdvbiA9IHJlcXVpcmUoICcuLi9pbnRlcm5hbC9jcmVhdGVfcG9seWdvbicgKTtcbnZhciBwb2x5Z29ucyA9IHJlcXVpcmUoICcuLi9pbnRlcm5hbC9wb2x5Z29ucycgKTtcbnZhciBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvc2V0X2RlZmF1bHRfZHJhd2luZ19zZXR0aW5ncycgKTtcbnZhciBnZXRXZWJHTCA9IHJlcXVpcmUoICcuL2ludGVybmFsL2dldF93ZWJnbCcgKTtcbnZhciBjb3B5RHJhd2luZ1NldHRpbmdzID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvY29weV9kcmF3aW5nX3NldHRpbmdzJyApO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25YID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25YO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25ZID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25ZO1xudmFyIHByb2Nlc3NTaGFwZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3Nfc2hhcGUnICk7XG52YXIgY2xvc2VTaGFwZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL2Nsb3NlX3NoYXBlJyApO1xudmFyIG9wdGlvbnMgPSByZXF1aXJlKCAnLi9zZXR0aW5ncycgKTtcbi8qKlxuICog0JDQsdGB0YLRgNCw0LrRgtC90YvQuSDQutC70LDRgdGBINGA0LXQvdC00LXRgNC10YDQsC5cbiAqIEBhYnN0cmFjdFxuICogQGNvbnN0cnVjdG9yIHY2LkFic3RyYWN0UmVuZGVyZXJcbiAqIEBzZWUgdjYuUmVuZGVyZXJHTFxuICogQHNlZSB2Ni5SZW5kZXJlcjJEXG4gKiBAZXhhbXBsZVxuICogdmFyIEFic3RyYWN0UmVuZGVyZXIgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyJyApO1xuICovXG5mdW5jdGlvbiBBYnN0cmFjdFJlbmRlcmVyICgpXG57XG4gIHRocm93IEVycm9yKCAnQ2Fubm90IGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgYWJzdHJhY3QgY2xhc3MgKG5ldyB2Ni5BYnN0cmFjdFJlbmRlcmVyKScgKTtcbn1cbkFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlID0ge1xuICAvKipcbiAgICog0JTQvtCx0LDQstC70Y/QtdGCIGBjYW52YXNgINGA0LXQvdC00LXRgNC10YDQsCDQsiBET00uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNhcHBlbmRUb1xuICAgKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudCDQrdC70LXQvNC10L3Rgiwg0LIg0LrQvtGC0L7RgNGL0LkgYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINC00L7Qu9C20LXQvSDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC9LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEFkZCByZW5kZXJlciBpbnRvIERPTS5cbiAgICogcmVuZGVyZXIuYXBwZW5kVG8oIGRvY3VtZW50LmJvZHkgKTtcbiAgICovXG4gIGFwcGVuZFRvOiBmdW5jdGlvbiBhcHBlbmRUbyAoIHBhcmVudCApXG4gIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoIHRoaXMuY2FudmFzICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQo9C00LDQu9GP0LXRgiBgY2FudmFzYCDRgNC10L3QtNC10YDQtdGA0LAg0LjQtyBET00uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNkZXN0cm95XG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVtb3ZlIHJlbmRlcmVyIGZyb20gRE9NLlxuICAgKiByZW5kZXJlci5kZXN0cm95KCk7XG4gICAqL1xuICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95ICgpXG4gIHtcbiAgICB0aGlzLmNhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKCB0aGlzLmNhbnZhcyApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KHQvtGF0YDQsNC90Y/QtdGCINGC0LXQutGD0YnQuNC1INC90LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3B1c2hcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTYXZlIGRyYXdpbmcgc2V0dGluZ3MgKGZpbGwsIGxpbmVXaWR0aC4uLikgKHB1c2ggb250byBzdGFjaykuXG4gICAqIHJlbmRlcmVyLnB1c2goKTtcbiAgICovXG4gIHB1c2g6IGZ1bmN0aW9uIHB1c2ggKClcbiAge1xuICAgIGlmICggdGhpcy5fc3RhY2tbICsrdGhpcy5fc3RhY2tJbmRleCBdICkge1xuICAgICAgY29weURyYXdpbmdTZXR0aW5ncyggdGhpcy5fc3RhY2tbIHRoaXMuX3N0YWNrSW5kZXggXSwgdGhpcyApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zdGFjay5wdXNoKCBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzKCB7fSwgdGhpcyApICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0JLQvtGB0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINC/0YDQtdC00YvQtNGD0YnQuNC1INC90LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvcFxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlc3RvcmUgZHJhd2luZyBzZXR0aW5ncyAoZmlsbCwgbGluZVdpZHRoLi4uKSAodGFrZSBmcm9tIHN0YWNrKS5cbiAgICogcmVuZGVyZXIucG9wKCk7XG4gICAqL1xuICBwb3A6IGZ1bmN0aW9uIHBvcCAoKVxuICB7XG4gICAgaWYgKCB0aGlzLl9zdGFja0luZGV4ID49IDAgKSB7XG4gICAgICBjb3B5RHJhd2luZ1NldHRpbmdzKCB0aGlzLCB0aGlzLl9zdGFja1sgdGhpcy5fc3RhY2tJbmRleC0tIF0gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyggdGhpcywgdGhpcyApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCY0LfQvNC10L3Rj9C10YIg0YDQsNC30LzQtdGAINGA0LXQvdC00LXRgNC10YDQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3Jlc2l6ZVxuICAgKiBAcGFyYW0ge251bWJlcn0gdyDQndC+0LLQsNGPINGI0LjRgNC40L3QsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGgg0J3QvtCy0LDRjyDQstGL0YHQvtGC0LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVzaXplIHJlbmRlcmVyIHRvIDYwMHg0MDAuXG4gICAqIHJlbmRlcmVyLnJlc2l6ZSggNjAwLCA0MDAgKTtcbiAgICovXG4gIHJlc2l6ZTogZnVuY3Rpb24gcmVzaXplICggdywgaCApXG4gIHtcbiAgICB2YXIgY2FudmFzID0gdGhpcy5jYW52YXM7XG4gICAgdmFyIHNjYWxlID0gdGhpcy5zZXR0aW5ncy5zY2FsZTtcbiAgICBjYW52YXMuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gaCArICdweCc7XG4gICAgY2FudmFzLndpZHRoID0gdGhpcy53ID0gTWF0aC5mbG9vciggdyAqIHNjYWxlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgY2FudmFzLmhlaWdodCA9IHRoaXMuaCA9IE1hdGguZmxvb3IoIGggKiBzY2FsZSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0JjQt9C80LXQvdGP0LXRgiDRgNCw0LfQvNC10YAg0YDQtdC90LTQtdGA0LXRgNCwINC00L4g0YDQsNC30LzQtdGA0LAgYGVsZW1lbnRgINGN0LvQtdC80LXQvdGC0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZXNpemVUb1xuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQg0K3Qu9C10LzQtdC90YIsINC00L4g0LrQvtGC0L7RgNC+0LPQviDQvdCw0LTQviDRgNCw0YHRgtGP0L3Rg9GC0Ywg0YDQtdC90LTQtdGA0LXRgC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXNpemUgcmVuZGVyZXIgdG8gbWF0Y2ggPGJvZHkgLz4gc2l6ZXMuXG4gICAqIHJlbmRlcmVyLnJlc2l6ZVRvKCBkb2N1bWVudC5ib2R5ICk7XG4gICAqL1xuICByZXNpemVUbzogZnVuY3Rpb24gcmVzaXplVG8gKCBlbGVtZW50IClcbiAge1xuICAgIHJldHVybiB0aGlzLnJlc2l6ZSggZ2V0RWxlbWVudFcoIGVsZW1lbnQgKSwgZ2V0RWxlbWVudEgoIGVsZW1lbnQgKSApO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC/0L7Qu9C40LPQvtC9LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZHJhd1BvbHlnb25cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB4ICAgICAgICAgICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB5ICAgICAgICAgICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICBzaWRlcyAgICAgICAgINCa0L7Qu9C40YfQtdGB0YLQstC+INGB0YLQvtGA0L7QvSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgIHhSYWRpdXMgICAgICAgWCDRgNCw0LTQuNGD0YEg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB5UmFkaXVzICAgICAgIFkg0YDQsNC00LjRg9GBINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgcm90YXRpb25BbmdsZSDQo9Cz0L7QuyDQv9C+0LLQvtGA0L7RgtCwINC/0L7Qu9C40LPQvtC90LBcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjRh9GC0L7QsdGLINC90LUg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMIHtAbGluayB2Ni5UcmFuc2Zvcm0jcm90YXRlfSkuXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgZGVncmVlcyAgICAgICDQmNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNCw0LTRg9GB0YsuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBoZXhhZ29uIGF0IFsgNCwgMiBdIHdpdGggcmFkaXVzIDI1LlxuICAgKiByZW5kZXJlci5wb2x5Z29uKCA0LCAyLCA2LCAyNSwgMjUsIDAgKTtcbiAgICovXG4gIGRyYXdQb2x5Z29uOiBmdW5jdGlvbiBkcmF3UG9seWdvbiAoIHgsIHksIHNpZGVzLCB4UmFkaXVzLCB5UmFkaXVzLCByb3RhdGlvbkFuZ2xlLCBkZWdyZWVzIClcbiAge1xuICAgIHZhciBwb2x5Z29uID0gcG9seWdvbnNbIHNpZGVzIF07XG4gICAgaWYgKCAhIHBvbHlnb24gKSB7XG4gICAgICBwb2x5Z29uID0gcG9seWdvbnNbIHNpZGVzIF0gPSBjcmVhdGVQb2x5Z29uKCBzaWRlcyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgIH1cbiAgICBpZiAoIGRlZ3JlZXMgKSB7XG4gICAgICByb3RhdGlvbkFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gICAgfVxuICAgIHRoaXMubWF0cml4LnNhdmUoKTtcbiAgICB0aGlzLm1hdHJpeC50cmFuc2xhdGUoIHgsIHkgKTtcbiAgICB0aGlzLm1hdHJpeC5yb3RhdGUoIHJvdGF0aW9uQW5nbGUgKTtcbiAgICB0aGlzLmRyYXdBcnJheXMoIHBvbHlnb24sIHBvbHlnb24ubGVuZ3RoICogMC41LCB2b2lkIDAsIHhSYWRpdXMsIHlSYWRpdXMgKTtcbiAgICB0aGlzLm1hdHJpeC5yZXN0b3JlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0L/QvtC70LjQs9C+0L0uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwb2x5Z29uXG4gICAqIEBwYXJhbSAge251bWJlcn0geCAgICAgICAgICAgICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSB5ICAgICAgICAgICAgICAgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IHNpZGVzICAgICAgICAgICDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdGC0L7RgNC+0L0g0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSByICAgICAgICAgICAgICAg0KDQsNC00LjRg9GBINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gW3JvdGF0aW9uQW5nbGVdINCj0LPQvtC7INC/0L7QstC+0YDQvtGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKNGH0YLQvtCx0Ysg0L3QtSDQuNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywge0BsaW5rIHY2LlRyYW5zZm9ybSNyb3RhdGV9KS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGhleGFnb24gYXQgWyA0LCAyIF0gd2l0aCByYWRpdXMgMjUuXG4gICAqIHJlbmRlcmVyLnBvbHlnb24oIDQsIDIsIDYsIDI1ICk7XG4gICAqL1xuICBwb2x5Z29uOiBmdW5jdGlvbiBwb2x5Z29uICggeCwgeSwgc2lkZXMsIHIsIHJvdGF0aW9uQW5nbGUgKVxuICB7XG4gICAgaWYgKCBzaWRlcyAlIDEgKSB7XG4gICAgICBzaWRlcyA9IE1hdGguZmxvb3IoIHNpZGVzICogMTAwICkgKiAwLjAxO1xuICAgIH1cbiAgICBpZiAoIHR5cGVvZiByb3RhdGlvbkFuZ2xlID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgIHRoaXMuZHJhd1BvbHlnb24oIHgsIHksIHNpZGVzLCByLCByLCAtTWF0aC5QSSAqIDAuNSApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdQb2x5Z29uKCB4LCB5LCBzaWRlcywgciwgciwgcm90YXRpb25BbmdsZSwgb3B0aW9ucy5kZWdyZWVzICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC60LDRgNGC0LjQvdC60YMuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNpbWFnZVxuICAgKiBAcGFyYW0ge3Y2LkFic3RyYWN0SW1hZ2V9IGltYWdlINCa0LDRgNGC0LjQvdC60LAg0LrQvtGC0L7RgNGD0Y4g0L3QsNC00L4g0L7RgtGA0LjRgdC+0LLQsNGC0YwuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgeCAgICAgWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHkgICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICBbd10gICDQqNC40YDQuNC90LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICBbaF0gICDQktGL0YHQvtGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBDcmVhdGUgaW1hZ2UuXG4gICAqIHZhciBpbWFnZSA9IG5ldyBJbWFnZSggZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoICdpbWFnZScgKSApO1xuICAgKiAvLyBEcmF3IGltYWdlIGF0IFsgNCwgMiBdLlxuICAgKiByZW5kZXJlci5pbWFnZSggaW1hZ2UsIDQsIDIgKTtcbiAgICovXG4gIGltYWdlOiBmdW5jdGlvbiBpbWFnZSAoIGltYWdlLCB4LCB5LCB3LCBoIClcbiAge1xuICAgIGlmICggaW1hZ2UuZ2V0KCkubG9hZGVkICkge1xuICAgICAgaWYgKCB0eXBlb2YgdyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICAgIHcgPSBpbWFnZS5kdztcbiAgICAgIH1cbiAgICAgIGlmICggdHlwZW9mIGggPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICBoID0gaW1hZ2UuZGg7XG4gICAgICB9XG4gICAgICB4ID0gcHJvY2Vzc1JlY3RBbGlnblgoIHRoaXMsIHgsIHcgKTtcbiAgICAgIHggPSBwcm9jZXNzUmVjdEFsaWduWSggdGhpcywgeSwgaCApO1xuICAgICAgdGhpcy5kcmF3SW1hZ2UoIGltYWdlLCB4LCB5LCB3LCBoICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQtNC70Y8g0L3QsNGH0LDQu9CwINC+0YLRgNC40YHQvtCy0LrQuCDRhNC40LPRg9GA0YsuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSAgIFtvcHRpb25zXSAgICAgICAgICAgICAg0J/QsNGA0LDQvNC10YLRgNGLINGE0LjQs9GD0YDRiy5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMuZHJhd0Z1bmN0aW9uXSDQpNGD0L3QutGG0LjRjywg0LrQvtGC0L7RgNC+0Y8g0LHRg9C00LXRgiDQvtGC0YDQuNGB0L7QstGL0LLQsNGC0Ywg0LLRgdC1INCy0LXRgNGI0LjQvdGLINCyIHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyLmVuZFNoYXBlfS4g0JzQvtC20LXRgiDQsdGL0YLRjCDQv9C10YDQtdC30LDQv9C40YHQsNC90LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVxdWlyZSBcInY2LnNoYXBlc1wiIChcInY2LmpzXCIgYnVpbHQtaW4gZHJhd2luZyBmdW5jdGlvbnMpLlxuICAgKiB2YXIgc2hhcGVzID0gcmVxdWlyZSggJ3Y2LmpzL3JlbmRlcmVyL3NoYXBlcy9wb2ludHMnICk7XG4gICAqIC8vIEJlZ2luIGRyYXdpbmcgcG9pbnRzIHNoYXBlLlxuICAgKiByZW5kZXJlci5iZWdpblNoYXBlKCB7IGRyYXdGdW5jdGlvbjogc2hhcGVzLmRyYXdQb2ludHMgfSApO1xuICAgKiAvLyBCZWdpbiBkcmF3aW5nIHNoYXBlIHdpdGhvdXQgZHJhd2luZyBmdW5jdGlvbiAobXVzdCBiZSBwYXNzZWQgbGF0ZXIgaW4gYGVuZFNoYXBlYCkuXG4gICAqIHJlbmRlcmVyLmJlZ2luU2hhcGUoKTtcbiAgICovXG4gIGJlZ2luU2hhcGU6IGZ1bmN0aW9uIGJlZ2luU2hhcGUgKCBvcHRpb25zIClcbiAge1xuICAgIGlmICggISBvcHRpb25zICkge1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICB0aGlzLl92ZXJ0aWNlcy5sZW5ndGggPSAwO1xuICAgIHRoaXMuX2Nsb3NlZFNoYXBlID0gbnVsbDtcbiAgICBpZiAoIHR5cGVvZiBvcHRpb25zLmRyYXdGdW5jdGlvbiA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICB0aGlzLl9kcmF3RnVuY3Rpb24gPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kcmF3RnVuY3Rpb24gPSBvcHRpb25zLmRyYXdGdW5jdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQstC10YDRiNC40L3RgyDQsiDQutC+0L7RgNC00LjQvdCw0YLQsNGFINC40Lcg0YHQvtC+0YLQstC10YLRgdCy0YPRjtGJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7Qsi5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAcGFyYW0ge251bWJlcn0geCBYINC60L7QvtGA0LTQuNC90LDRgtCwINC90L7QstC+0Lkg0LLQtdGA0YjQuNC90YsuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5IFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L3QvtCy0L7QuSDQstC10YDRiNC40L3Riy5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyByZWN0YW5nbGUgd2l0aCB2ZXJ0aWNlcy5cbiAgICogcmVuZGVyZXIudmVydGV4KCAwLCAwICk7XG4gICAqIHJlbmRlcmVyLnZlcnRleCggMSwgMCApO1xuICAgKiByZW5kZXJlci52ZXJ0ZXgoIDEsIDEgKTtcbiAgICogcmVuZGVyZXIudmVydGV4KCAwLCAxICk7XG4gICAqL1xuICB2ZXJ0ZXg6IGZ1bmN0aW9uIHZlcnRleCAoIHgsIHkgKVxuICB7XG4gICAgdGhpcy5fdmVydGljZXMucHVzaCggTWF0aC5mbG9vciggeCApLCBNYXRoLmZsb29yKCB5ICkgKTtcbiAgICB0aGlzLl9jbG9zZWRTaGFwZSA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0YTQuNCz0YPRgNGDINC40Lcg0LLQtdGA0YjQuNC9LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICogQHBhcmFtIHtvYmplY3R9ICAgW29wdGlvbnNdICAgICAgICAgICAgICDQn9Cw0YDQsNC80LXRgtGA0Ysg0YTQuNCz0YPRgNGLLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5jbG9zZV0gICAgICAgINCh0L7QtdC00LjQvdC40YLRjCDQv9C+0YHQu9C10LTQvdGO0Y4g0LLQtdGA0YjQuNC90YMg0YEg0L/QtdGA0LLQvtC5ICjQt9Cw0LrRgNGL0YLRjCDRhNC40LPRg9GA0YMpLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbb3B0aW9ucy5kcmF3RnVuY3Rpb25dINCk0YPQvdC60YbQuNGPLCDQutC+0YLQvtGA0L7RjyDQsdGD0LTQtdGCINC+0YLRgNC40YHQvtCy0YvQstCw0YLRjCDQstGB0LUg0LLQtdGA0YjQuNC90YsuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0JjQvNC10LXRgiDQsdC+0LvRjNGI0LjQuSDQv9GA0LjQvtGA0LjRgtC10YIg0YfQtdC8INCyIHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGV9LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlcXVpcmUgXCJ2Ni5zaGFwZXNcIiAoXCJ2Ni5qc1wiIGJ1aWx0LWluIGRyYXdpbmcgZnVuY3Rpb25zKS5cbiAgICogdmFyIHNoYXBlcyA9IHJlcXVpcmUoICd2Ni5qcy9yZW5kZXJlci9zaGFwZXMvcG9pbnRzJyApO1xuICAgKiAvLyBDbG9zZSBhbmQgZHJhdyBhIHNoYXBlLlxuICAgKiByZW5kZXJlci5lbmRTaGFwZSggeyBjbG9zZTogdHJ1ZSB9ICk7XG4gICAqIC8vIERyYXcgd2l0aCBhIGN1c3RvbSBmdW5jdGlvbi5cbiAgICogcmVuZGVyZXIuZW5kU2hhcGUoIHsgZHJhd0Z1bmN0aW9uOiBzaGFwZXMuZHJhd0xpbmVzIH0gKTtcbiAgICovXG4gIGVuZFNoYXBlOiBmdW5jdGlvbiBlbmRTaGFwZSAoIG9wdGlvbnMgKVxuICB7XG4gICAgdmFyIGRyYXdGdW5jdGlvbiwgdmVydGljZXM7XG4gICAgaWYgKCAhIG9wdGlvbnMgKSB7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIGlmICggISAoIGRyYXdGdW5jdGlvbiA9IG9wdGlvbnMuZHJhd0Z1bmN0aW9uIHx8IHRoaXMuX2RyYXdGdW5jdGlvbiApICkge1xuICAgICAgdGhyb3cgRXJyb3IoICdObyBcImRyYXdGdW5jdGlvblwiIHNwZWNpZmllZCBmb3IgXCJyZW5kZXJlci5lbmRTaGFwZVwiJyApO1xuICAgIH1cbiAgICBpZiAoIG9wdGlvbnMuY2xvc2UgKSB7XG4gICAgICBjbG9zZVNoYXBlKCB0aGlzICk7XG4gICAgICB2ZXJ0aWNlcyA9IHRoaXMuX2Nsb3NlZFNoYXBlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2ZXJ0aWNlcyA9IHRoaXMuX3ZlcnRpY2VzO1xuICAgIH1cbiAgICBkcmF3RnVuY3Rpb24oIHRoaXMsIHByb2Nlc3NTaGFwZSggdGhpcywgdmVydGljZXMgKSApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3NhdmVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNzYXZlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNhdmUgdHJhbnNmb3JtLlxuICAgKiByZW5kZXJlci5zYXZlKCk7XG4gICAqL1xuICBzYXZlOiBmdW5jdGlvbiBzYXZlICgpXG4gIHtcbiAgICB0aGlzLm1hdHJpeC5zYXZlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVzdG9yZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuVHJhbnNmb3JtI3Jlc3RvcmVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVzdG9yZSB0cmFuc2Zvcm0uXG4gICAqIHJlbmRlcmVyLnJlc3RvcmUoKTtcbiAgICovXG4gIHJlc3RvcmU6IGZ1bmN0aW9uIHJlc3RvcmUgKClcbiAge1xuICAgIHRoaXMubWF0cml4LnJlc3RvcmUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNzZXRUcmFuc2Zvcm1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNzZXRUcmFuc2Zvcm1cbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IGlkZW50aXR5IHRyYW5zZm9ybS5cbiAgICogcmVuZGVyZXIuc2V0VHJhbnNmb3JtKCAxLCAwLCAwLCAxLCAwLCAwICk7XG4gICAqL1xuICBzZXRUcmFuc2Zvcm06IGZ1bmN0aW9uIHNldFRyYW5zZm9ybSAoIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnNldFRyYW5zZm9ybSggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciN0cmFuc2xhdGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSN0cmFuc2xhdGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gVHJhbnNsYXRlIHRyYW5zZm9ybSB0byBbIDQsIDIgXS5cbiAgICogcmVuZGVyZXIudHJhbnNsYXRlKCA0LCAyICk7XG4gICAqL1xuICB0cmFuc2xhdGU6IGZ1bmN0aW9uIHRyYW5zbGF0ZSAoIHgsIHkgKVxuICB7XG4gICAgdGhpcy5tYXRyaXgudHJhbnNsYXRlKCB4LCB5ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcm90YXRlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jcm90YXRlXG4gICAqIEB0b2RvIHJlbmRlcmVyLnNldHRpbmdzLmRlZ3JlZXNcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUm90YXRlIHRyYW5zZm9ybSBvbiA0NSBkZWdyZWVzLlxuICAgKiByZW5kZXJlci5yb3RhdGUoIDQ1ICogTWF0aC5QSSAvIDE4MCApO1xuICAgKi9cbiAgcm90YXRlOiBmdW5jdGlvbiByb3RhdGUgKCBhbmdsZSApXG4gIHtcbiAgICBpZiAoIHRoaXMuc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICAgIGFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gICAgfVxuICAgIHRoaXMubWF0cml4LnJvdGF0ZSggYW5nbGUgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNzY2FsZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuVHJhbnNmb3JtI3NjYWxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNjYWxlIHRyYW5zZm9ybSB0d2ljZS5cbiAgICogcmVuZGVyZXIuc2NhbGUoIDIsIDIgKTtcbiAgICovXG4gIHNjYWxlOiBmdW5jdGlvbiBzY2FsZSAoIHgsIHkgKVxuICB7XG4gICAgdGhpcy5tYXRyaXguc2NhbGUoIHgsIHkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciN0cmFuc2Zvcm1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSN0cmFuc2Zvcm1cbiAgICogQGV4YW1wbGVcbiAgICogLy8gQXBwbHkgdHJhbnNsYXRlZCB0byBbIDQsIDIgXSBcInRyYW5zZm9ybWF0aW9uIG1hdHJpeFwiLlxuICAgKiByZW5kZXJlci50cmFuc2Zvcm0oIDEsIDAsIDAsIDEsIDQsIDIgKTtcbiAgICovXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24gdHJhbnNmb3JtICggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxuICB7XG4gICAgdGhpcy5tYXRyaXgudHJhbnNmb3JtKCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgbGluZVdpZHRoICjRiNC40YDQuNC90YMg0LrQvtC90YLRg9GA0LApLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjbGluZVdpZHRoXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXIg0J3QvtCy0YvQuSBsaW5lV2lkdGguXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IGBsaW5lV2lkdGhgIHRvIDEwcHguXG4gICAqIHJlbmRlcmVyLmxpbmVXaWR0aCggMTAgKTtcbiAgICovXG4gIGxpbmVXaWR0aDogZnVuY3Rpb24gbGluZVdpZHRoICggbnVtYmVyIClcbiAge1xuICAgIHRoaXMuX2xpbmVXaWR0aCA9IG51bWJlcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGBiYWNrZ3JvdW5kUG9zaXRpb25YYCDQvdCw0YHRgtGA0L7QudC60YMg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNiYWNrZ3JvdW5kUG9zaXRpb25YXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgIHZhbHVlXG4gICAqIEBwYXJhbSB7Y29uc3RhbnR9IHR5cGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTZXQgXCJiYWNrZ3JvdW5kUG9zaXRpb25YXCIgZHJhd2luZyBzZXR0aW5nIHRvIENFTlRFUiAoZGVmYXVsdDogTEVGVCkuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblgoIGNvbnN0YW50cy5nZXQoICdDRU5URVInICksIGNvbnN0YW50cy5nZXQoICdDT05TVEFOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25YKCAwLjUsIGNvbnN0YW50cy5nZXQoICdQRVJDRU5UJyApICk7XG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblgoIHJlbmRlcmVyLncgLyAyICk7XG4gICAqL1xuICBiYWNrZ3JvdW5kUG9zaXRpb25YOiBmdW5jdGlvbiBiYWNrZ3JvdW5kUG9zaXRpb25YICggdmFsdWUsIHR5cGUgKSB7IGlmICggdHlwZW9mIHR5cGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoICdWQUxVRScgKSApIHsgaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKSB7IHR5cGUgPSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKTsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJMRUZUXCIgKSApIHsgdmFsdWUgPSAwOyB9IGVsc2UgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJDRU5URVJcIiApICkgeyB2YWx1ZSA9IDAuNTsgfSBlbHNlIGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiUklHSFRcIiApICkgeyB2YWx1ZSA9IDE7IH0gZWxzZSB7IHRocm93IEVycm9yKCAnR290IHVua25vd24gdmFsdWUuIFRoZSBrbm93biBhcmU6ICcgKyBcIkxFRlRcIiArICcsICcgKyBcIkNFTlRFUlwiICsgJywgJyArIFwiUklHSFRcIiApOyB9IH0gaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApIHsgdmFsdWUgKj0gdGhpcy53OyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGB2YWx1ZWAgdHlwZS4gVGhlIGtub3duIGFyZTogVkFMVUUsIFBFUkNFTlQsIENPTlNUQU5UJyApOyB9IH0gdGhpcy5fYmFja2dyb3VuZFBvc2l0aW9uWCA9IHZhbHVlOyByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgYmFja2dyb3VuZFBvc2l0aW9uWWAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZFBvc2l0aW9uWVxuICAgKiBAcGFyYW0ge251bWJlcn0gICB2YWx1ZVxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB0eXBlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IFwiYmFja2dyb3VuZFBvc2l0aW9uWVwiIGRyYXdpbmcgc2V0dGluZyB0byBNSURETEUgKGRlZmF1bHQ6IFRPUCkuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblkoIGNvbnN0YW50cy5nZXQoICdNSURETEUnICksIGNvbnN0YW50cy5nZXQoICdDT05TVEFOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25ZKCAwLjUsIGNvbnN0YW50cy5nZXQoICdQRVJDRU5UJyApICk7XG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblkoIHJlbmRlcmVyLmggLyAyICk7XG4gICAqL1xuICBiYWNrZ3JvdW5kUG9zaXRpb25ZOiBmdW5jdGlvbiBiYWNrZ3JvdW5kUG9zaXRpb25ZICggdmFsdWUsIHR5cGUgKSB7IGlmICggdHlwZW9mIHR5cGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoICdWQUxVRScgKSApIHsgaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKSB7IHR5cGUgPSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKTsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJUT1BcIiApICkgeyB2YWx1ZSA9IDA7IH0gZWxzZSBpZiAoIHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCBcIk1JRERMRVwiICkgKSB7IHZhbHVlID0gMC41OyB9IGVsc2UgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJCT1RUT01cIiApICkgeyB2YWx1ZSA9IDE7IH0gZWxzZSB7IHRocm93IEVycm9yKCAnR290IHVua25vd24gdmFsdWUuIFRoZSBrbm93biBhcmU6ICcgKyBcIlRPUFwiICsgJywgJyArIFwiTUlERExFXCIgKyAnLCAnICsgXCJCT1RUT01cIiApOyB9IH0gaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApIHsgdmFsdWUgKj0gdGhpcy5oOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGB2YWx1ZWAgdHlwZS4gVGhlIGtub3duIGFyZTogVkFMVUUsIFBFUkNFTlQsIENPTlNUQU5UJyApOyB9IH0gdGhpcy5fYmFja2dyb3VuZFBvc2l0aW9uWSA9IHZhbHVlOyByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgcmVjdEFsaWduWGAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdEFsaWduWFxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB2YWx1ZSBgTEVGVGAsIGBDRU5URVJgLCBgUklHSFRgLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBcInJlY3RBbGlnblhcIiBkcmF3aW5nIHNldHRpbmcgdG8gQ0VOVEVSIChkZWZhdWx0OiBMRUZUKS5cbiAgICogcmVuZGVyZXIucmVjdEFsaWduWCggY29uc3RhbnRzLmdldCggJ0NFTlRFUicgKSApO1xuICAgKi9cbiAgcmVjdEFsaWduWDogZnVuY3Rpb24gcmVjdEFsaWduWCAoIHZhbHVlICkgeyBpZiAoIHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCAnTEVGVCcgKSB8fCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ0NFTlRFUicgKSB8fCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ1JJR0hUJyApICkgeyB0aGlzLl9yZWN0QWxpZ25YID0gdmFsdWU7IH0gZWxzZSB7IHRocm93IEVycm9yKCAnR290IHVua25vd24gYHJlY3RBbGlnbmAgY29uc3RhbnQuIFRoZSBrbm93biBhcmU6ICcgKyBcIkxFRlRcIiArICcsICcgKyBcIkNFTlRFUlwiICsgJywgJyArIFwiUklHSFRcIiApOyB9IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGByZWN0QWxpZ25ZYCDQvdCw0YHRgtGA0L7QudC60YMg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZWN0QWxpZ25ZXG4gICAqIEBwYXJhbSB7Y29uc3RhbnR9IHZhbHVlIGBUT1BgLCBgTUlERExFYCwgYEJPVFRPTWAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IFwicmVjdEFsaWduWVwiIGRyYXdpbmcgc2V0dGluZyB0byBNSURETEUgKGRlZmF1bHQ6IFRPUCkuXG4gICAqIHJlbmRlcmVyLnJlY3RBbGlnblkoIGNvbnN0YW50cy5nZXQoICdNSURETEUnICkgKTtcbiAgICovXG4gIHJlY3RBbGlnblk6IGZ1bmN0aW9uIHJlY3RBbGlnblkgKCB2YWx1ZSApIHsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ0xFRlQnICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdDRU5URVInICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdSSUdIVCcgKSApIHsgdGhpcy5fcmVjdEFsaWduWSA9IHZhbHVlOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGByZWN0QWxpZ25gIGNvbnN0YW50LiBUaGUga25vd24gYXJlOiAnICsgXCJUT1BcIiArICcsICcgKyBcIk1JRERMRVwiICsgJywgJyArIFwiQk9UVE9NXCIgKTsgfSByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiDRhtCy0LXRgiBgc3Ryb2tlYCDQv9GA0Lgg0YDQuNGB0L7QstCw0L3QuNC4INGH0LXRgNC10Lcge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdH0g0Lgg0YIu0L8uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNzdHJva2VcbiAgICogQHBhcmFtIHtudW1iZXJ8Ym9vbGVhbnxUQ29sb3J9IFtyXSDQldGB0LvQuCDRjdGC0L4gYGJvb2xlYW5gLCDRgtC+INGN0YLQviDQstC60LvRjtGH0LjRgiDQuNC70Lgg0LLRi9C60LvRjtGH0LjRgiBgc3Ryb2tlYFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjQutCw0Log0YfQtdGA0LXQtyB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlciNub1N0cm9rZX0pLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2ddXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYl1cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFthXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERpc2FibGUgYW5kIHRoZW4gZW5hYmxlIGBzdHJva2VgLlxuICAgKiByZW5kZXJlci5zdHJva2UoIGZhbHNlICkuc3Ryb2tlKCB0cnVlICk7XG4gICAqIC8vIFNldCBgc3Ryb2tlYCB0byBcImxpZ2h0c2t5Ymx1ZVwiLlxuICAgKiByZW5kZXJlci5zdHJva2UoICdsaWdodHNreWJsdWUnICk7XG4gICAqIC8vIFNldCBgc3Ryb2tlYCBmcm9tIGB2Ni5SR0JBYC5cbiAgICogcmVuZGVyZXIuc3Ryb2tlKCBuZXcgUkdCQSggMjU1LCAwLCAwICkucGVyY2VpdmVkQnJpZ2h0bmVzcygpICk7XG4gICAqL1xuICBzdHJva2U6IGZ1bmN0aW9uIHN0cm9rZSAoIHIsIGcsIGIsIGEgKSB7IGlmICggdHlwZW9mIHIgPT09ICdib29sZWFuJyApIHsgdGhpcy5fZG9TdHJva2UgPSByOyB9IGVsc2UgeyBpZiAoIHR5cGVvZiByID09PSAnc3RyaW5nJyB8fCB0aGlzLl9zdHJva2VDb2xvci50eXBlICE9PSB0aGlzLnNldHRpbmdzLmNvbG9yLnR5cGUgKSB7IHRoaXMuX3N0cm9rZUNvbG9yID0gbmV3IHRoaXMuc2V0dGluZ3MuY29sb3IoIHIsIGcsIGIsIGEgKTsgfSBlbHNlIHsgdGhpcy5fc3Ryb2tlQ29sb3Iuc2V0KCByLCBnLCBiLCBhICk7IH0gdGhpcy5fZG9TdHJva2UgPSB0cnVlOyB9IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINGG0LLQtdGCIGBmaWxsYCDQv9GA0Lgg0YDQuNGB0L7QstCw0L3QuNC4INGH0LXRgNC10Lcge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdH0g0Lgg0YIu0L8uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNmaWxsXG4gICAqIEBwYXJhbSB7bnVtYmVyfGJvb2xlYW58VENvbG9yfSBbcl0g0JXRgdC70Lgg0Y3RgtC+IGBib29sZWFuYCwg0YLQviDRjdGC0L4g0LLQutC70Y7Rh9C40YIg0LjQu9C4INCy0YvQutC70Y7Rh9C40YIgYGZpbGxgXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKNC60LDQuiDRh9C10YDQtdC3IHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI25vRmlsbH0pLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2ddXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYl1cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFthXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERpc2FibGUgYW5kIHRoZW4gZW5hYmxlIGBmaWxsYC5cbiAgICogcmVuZGVyZXIuZmlsbCggZmFsc2UgKS5maWxsKCB0cnVlICk7XG4gICAqIC8vIFNldCBgZmlsbGAgdG8gXCJsaWdodHBpbmtcIi5cbiAgICogcmVuZGVyZXIuZmlsbCggJ2xpZ2h0cGluaycgKTtcbiAgICogLy8gU2V0IGBmaWxsYCBmcm9tIGB2Ni5SR0JBYC5cbiAgICogcmVuZGVyZXIuZmlsbCggbmV3IFJHQkEoIDI1NSwgMCwgMCApLmJyaWdodG5lc3MoKSApO1xuICAgKi9cbiAgZmlsbDogZnVuY3Rpb24gZmlsbCAoIHIsIGcsIGIsIGEgKSB7IGlmICggdHlwZW9mIHIgPT09ICdib29sZWFuJyApIHsgdGhpcy5fZG9GaWxsID0gcjsgfSBlbHNlIHsgaWYgKCB0eXBlb2YgciA9PT0gJ3N0cmluZycgfHwgdGhpcy5fZmlsbENvbG9yLnR5cGUgIT09IHRoaXMuc2V0dGluZ3MuY29sb3IudHlwZSApIHsgdGhpcy5fZmlsbENvbG9yID0gbmV3IHRoaXMuc2V0dGluZ3MuY29sb3IoIHIsIGcsIGIsIGEgKTsgfSBlbHNlIHsgdGhpcy5fZmlsbENvbG9yLnNldCggciwgZywgYiwgYSApOyB9IHRoaXMuX2RvRmlsbCA9IHRydWU7IH0gcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0JLRi9C60LvRjtGH0LDQtdGCINGA0LjRgdC+0LLQsNC90LjQtSDQutC+0L3RgtGD0YDQsCAoc3Ryb2tlKS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI25vU3Ryb2tlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRGlzYWJsZSBkcmF3aW5nIHN0cm9rZS5cbiAgICogcmVuZGVyZXIubm9TdHJva2UoKTtcbiAgICovXG4gIG5vU3Ryb2tlOiBmdW5jdGlvbiBub1N0cm9rZSAoKSB7IHRoaXMuX2RvU3Ryb2tlID0gZmFsc2U7IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCS0YvQutC70Y7Rh9Cw0LXRgiDQt9Cw0L/QvtC70L3QtdC90LjRjyDRhNC+0L3QsCAoZmlsbCkuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNub0ZpbGxcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEaXNhYmxlIGZpbGxpbmcuXG4gICAqIHJlbmRlcmVyLm5vRmlsbCgpO1xuICAgKi9cbiAgbm9GaWxsOiBmdW5jdGlvbiBub0ZpbGwgKCkgeyB0aGlzLl9kb0ZpbGwgPSBmYWxzZTsgcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0JfQsNC/0L7Qu9C90Y/QtdGCINGE0L7QvSDRgNC10L3QtNC10YDQtdGA0LAg0YbQstC10YLQvtC8LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZENvbG9yXG4gICAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW3JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2ddXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2FdXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRmlsbCByZW5kZXJlciB3aXRoIFwibGlnaHRwaW5rXCIgY29sb3IuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRDb2xvciggJ2xpZ2h0cGluaycgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQl9Cw0L/QvtC70L3Rj9C10YIg0YTQvtC9INGA0LXQvdC00LXRgNC10YDQsCDQutCw0YDRgtC40L3QutC+0LkuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNiYWNrZ3JvdW5kSW1hZ2VcbiAgICogQHBhcmFtIHt2Ni5BYnN0cmFjdEltYWdlfSBpbWFnZSDQmtCw0YDRgtC40L3QutCwLCDQutC+0YLQvtGA0LDRjyDQtNC+0LvQttC90LAg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGM0YHRjyDQtNC70Y8g0YTQvtC90LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gQ3JlYXRlIGJhY2tncm91bmQgaW1hZ2UuXG4gICAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICdiYWNrZ3JvdW5kLmpwZycgKTtcbiAgICogLy8gRmlsbCByZW5kZXJlciB3aXRoIHRoZSBpbWFnZS5cbiAgICogcmVuZGVyZXIuYmFja2dyb3VuZEltYWdlKCBJbWFnZS5zdHJldGNoKCBpbWFnZSwgcmVuZGVyZXIudywgcmVuZGVyZXIuaCApICk7XG4gICAqL1xuICAvKipcbiAgICog0J7Rh9C40YnQsNC10YIg0LrQvtC90YLQtdC60YHRgi5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2NsZWFyXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gQ2xlYXIgcmVuZGVyZXIncyBjb250ZXh0LlxuICAgKiByZW5kZXJlci5jbGVhcigpO1xuICAgKi9cbiAgLyoqXG4gICAqINCe0YLRgNC40YHQvtCy0YvQstCw0LXRgiDQv9C10YDQtdC00LDQvdC90YvQtSDQstC10YDRiNC40L3Riy5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2RyYXdBcnJheXNcbiAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl8QXJyYXl9IHZlcnRzINCS0LXRgNGI0LjQvdGLLCDQutC+0YLQvtGA0YvQtSDQvdCw0LTQviDQvtGC0YDQuNGB0L7QstCw0YLRjC4g0JXRgdC70Lgg0L3QtSDQv9C10YDQtdC00LDQvdC+INC00LvRj1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge0BsaW5rIHY2LlJlbmRlcmVyR0x9LCDRgtC+INCx0YPQtNGD0YIg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGM0YHRjyDQstC10YDRiNC40L3RiyDQuNC3XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDRgdGC0LDQvdC00LDRgNGC0L3QvtCz0L4g0LHRg9GE0LXRgNCwICh7QGxpbmsgdjYuUmVuZGVyZXJHTCNidWZmZXJzLmRlZmF1bHR9KS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgIGNvdW50INCa0L7Qu9C40YfQtdGB0YLQstC+INCy0LXRgNGI0LjQvSwg0L3QsNC/0YDQuNC80LXRgDogMyDQtNC70Y8g0YLRgNC10YPQs9C+0LvRjNC90LjQutCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEEgdHJpYW5nbGUuXG4gICAqIHZhciB2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoIFtcbiAgICogICAwLCAgMCxcbiAgICogICA1MCwgNTAsXG4gICAqICAgMCwgIDUwXG4gICAqIF0gKTtcbiAgICpcbiAgICogLy8gRHJhdyB0aGUgdHJpYW5nbGUuXG4gICAqIHJlbmRlcmVyLmRyYXdBcnJheXMoIHZlcnRpY2VzLCAzICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC60LDRgNGC0LjQvdC60YMuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNkcmF3SW1hZ2VcbiAgICogQHBhcmFtIHt2Ni5BYnN0cmFjdEltYWdlfSBpbWFnZSDQmtCw0YDRgtC40L3QutCwINC60L7RgtC+0YDRg9GOINC90LDQtNC+INC+0YLRgNC40YHQvtCy0LDRgtGMLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHggICAgIFwiRGVzdGluYXRpb24gWFwiLiBYINC60L7QvtGA0LTQuNC90LDRgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgeSAgICAgXCJEZXN0aW5hdGlvbiBZXCIuIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICB3ICAgICBcIkRlc3RpbmF0aW9uIFdpZHRoXCIuINCo0LjRgNC40L3QsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIGggICAgIFwiRGVzdGluYXRpb24gSGVpZ2h0XCIuINCS0YvRgdC+0YLQsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENyZWF0ZSBpbWFnZS5cbiAgICogdmFyIGltYWdlID0gSW1hZ2UuZnJvbVVSTCggJzMwMHgyMDAucG5nJyApO1xuICAgKiAvLyBEcmF3IGltYWdlIGF0IFsgMCwgMCBdLlxuICAgKiByZW5kZXJlci5kcmF3SW1hZ2UoIGltYWdlLCAwLCAwLCA2MDAsIDQwMCApO1xuICAgKi9cbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQui5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3RcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwLlxuICAgKiBAcGFyYW0ge251bWJlcn0geSBZINC60L7QvtGA0LTQuNC90LDRgtCwINC/0YDRj9C80L7Rg9Cz0L7Qu9GM0L3QuNC60LAuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB3INCo0LjRgNC40L3QsCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gaCDQktGL0YHQvtGC0LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IHNxdWFyZSBhdCBbIDIwLCAyMCBdIHdpdGggc2l6ZSA4MC5cbiAgICogcmVuZGVyZXIucmVjdCggMjAsIDIwLCA4MCwgODAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0LrRgNGD0LMuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNhcmNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQutGA0YPQs9CwLlxuICAgKiBAcGFyYW0ge251bWJlcn0geSBZINC60L7QvtGA0LTQuNC90LDRgtCwINC60YDRg9Cz0LAuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByINCg0LDQtNC40YPRgSDQutGA0YPQs9CwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgY2lyY2xlIGF0IFsgNjAsIDYwIF0gd2l0aCByYWRpdXMgNDAuXG4gICAqIHJlbmRlcmVyLmFyYyggNjAsIDYwLCA0MCApO1xuICAgKi9cbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQu9C40L3QuNGOLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjbGluZVxuICAgKiBAcGFyYW0ge251bWJlcn0geDEgWCDQvdCw0YfQsNC70LAg0LvQuNC90LjQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkxIFkg0L3QsNGH0LDQu9CwINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4MiBYINC60L7QvdGG0Ysg0LvQuNC90LjQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkyIFkg0LrQvtC90YbRiyDQu9C40L3QuNC4LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgbGluZSBmcm9tIFsgMTAsIDEwIF0gdG8gWyAyMCwgMjAgXS5cbiAgICogcmVuZGVyZXIubGluZSggMTAsIDEwLCAyMCwgMjAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0YLQvtGH0LrRgy5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvaW50XG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0YLQvtGH0LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDRgtC+0YfQutC4LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgcG9pbnQgYXQgWyA0LCAyIF0uXG4gICAqIHJlbmRlcmVyLnBvaW50KCA0LCAyICk7XG4gICAqL1xuICBjb25zdHJ1Y3RvcjogQWJzdHJhY3RSZW5kZXJlclxufTtcbi8qKlxuICogSW5pdGlhbGl6ZSByZW5kZXJlciBvbiBgXCJzZWxmXCJgLlxuICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyLmNyZWF0ZVxuICogQHBhcmFtICB7djYuQWJzdHJhY3RSZW5kZXJlcn0gc2VsZiAgICBSZW5kZXJlciB0aGF0IHNob3VsZCBiZSBpbml0aWFsaXplZC5cbiAqIEBwYXJhbSAge29iamVjdH0gICAgICAgICAgICAgIG9wdGlvbnMge0BsaW5rIHY2LnNldHRpbmdzLnJlbmRlcmVyfVxuICogQHBhcmFtICB7Y29uc3RhbnR9ICAgICAgICAgICAgdHlwZSAgICBUeXBlIG9mIHJlbmRlcmVyOiBgMkRgIG9yIGBHTGAuIENhbm5vdCBiZSBgQVVUT2AhLlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICAgICAgICAgICBSZXR1cm5zIG5vdGhpbmcuXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DdXN0b20gUmVuZGVyZXI8L2NhcHRpb24+XG4gKiB2YXIgQWJzdHJhY3RSZW5kZXJlciA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL0Fic3RyYWN0UmVuZGVyZXInICk7XG4gKiB2YXIgc2V0dGluZ3MgICAgICAgICA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL3NldHRpbmdzJyApO1xuICogdmFyIGNvbnN0YW50cyAgICAgICAgPSByZXF1aXJlKCAndjYuanMvY29yZS9jb25zdGFudHMnICk7XG4gKlxuICogZnVuY3Rpb24gQ3VzdG9tUmVuZGVyZXIgKCBvcHRpb25zIClcbiAqIHtcbiAqICAgLy8gSW5pdGlhbGl6ZSBDdXN0b21SZW5kZXJlci5cbiAqICAgQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUoIHRoaXMsIGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApLCBjb25zdGFudHMuZ2V0KCAnMkQnICkgKTtcbiAqIH1cbiAqL1xuQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUgKCBzZWxmLCBvcHRpb25zLCB0eXBlIClcbntcbiAgdmFyIGNvbnRleHQ7XG4gIC8qKlxuICAgKiBgY2FudmFzYCDRgNC10L3QtNC10YDQtdGA0LAg0LTQu9GPINC+0YLRgNC40YHQvtCy0LrQuCDQvdCwINGN0LrRgNCw0L3QtS5cbiAgICogQG1lbWJlciB7SFRNTENhbnZhc0VsZW1lbnR9IHY2LkFic3RyYWN0UmVuZGVyZXIjY2FudmFzXG4gICAqL1xuICBpZiAoIG9wdGlvbnMuY2FudmFzICkge1xuICAgIHNlbGYuY2FudmFzID0gb3B0aW9ucy5jYW52YXM7XG4gIH0gZWxzZSB7XG4gICAgc2VsZi5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xuICAgIHNlbGYuY2FudmFzLmlubmVySFRNTCA9ICdVbmFibGUgdG8gcnVuIHRoaXMgYXBwbGljYXRpb24uJztcbiAgfVxuICBpZiAoIHR5cGUgPT09IGNvbnN0YW50cy5nZXQoICcyRCcgKSApIHtcbiAgICBjb250ZXh0ID0gJzJkJztcbiAgfSBlbHNlIGlmICggdHlwZSAhPT0gY29uc3RhbnRzLmdldCggJ0dMJyApICkge1xuICAgIHRocm93IEVycm9yKCAnR290IHVua25vd24gcmVuZGVyZXIgdHlwZS4gVGhlIGtub3duIGFyZTogMkQgYW5kIEdMJyApO1xuICB9IGVsc2UgaWYgKCAhICggY29udGV4dCA9IGdldFdlYkdMKCkgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBnZXQgV2ViR0wgY29udGV4dC4gVHJ5IHRvIHVzZSAyRCBhcyB0aGUgcmVuZGVyZXIgdHlwZSBvciB2Ni5SZW5kZXJlcjJEIGluc3RlYWQgb2YgdjYuUmVuZGVyZXJHTCcgKTtcbiAgfVxuICAvKipcbiAgICog0JrQvtC90YLQtdC60YHRgiDRhdC+0LvRgdGC0LAuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuQWJzdHJhY3RSZW5kZXJlciNjb250ZXh0XG4gICAqL1xuICBzZWxmLmNvbnRleHQgPSBzZWxmLmNhbnZhcy5nZXRDb250ZXh0KCBjb250ZXh0LCB7XG4gICAgYWxwaGE6IG9wdGlvbnMuYWxwaGFcbiAgfSApO1xuICAvKipcbiAgICog0J3QsNGB0YLRgNC+0LnQutC4INGA0LXQvdC00LXRgNC10YDQsC5cbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3NldHRpbmdzXG4gICAqIEBzZWUgdjYuc2V0dGluZ3MucmVuZGVyZXIuc2V0dGluZ3NcbiAgICovXG4gIHNlbGYuc2V0dGluZ3MgPSBvcHRpb25zLnNldHRpbmdzO1xuICAvKipcbiAgICog0KLQuNC/INGA0LXQvdC00LXRgNC10YDQsDogR0wsIDJELlxuICAgKiBAbWVtYmVyIHtjb25zdGFudH0gdjYuQWJzdHJhY3RSZW5kZXJlciN0eXBlXG4gICAqL1xuICBzZWxmLnR5cGUgPSB0eXBlO1xuICAvKipcbiAgICog0KHRgtGN0Log0YHQvtGF0YDQsNC90LXQvdC90YvRhSDQvdCw0YHRgtGA0L7QtdC6INGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48b2JqZWN0Pn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfc3RhY2tcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3B1c2hcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvcFxuICAgKi9cbiAgc2VsZi5fc3RhY2sgPSBbXTtcbiAgLyoqXG4gICAqINCf0L7Qt9C40YbQuNGPINC/0L7RgdC70LXQtNC90LjRhSDRgdC+0YXRgNCw0L3QtdC90L3Ri9GFINC90LDRgdGC0YDQvtC10Log0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfc3RhY2tJbmRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjcHVzaFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjcG9wXG4gICAqL1xuICBzZWxmLl9zdGFja0luZGV4ID0gLTE7XG4gIC8qKlxuICAgKiDQktC10YDRiNC40L3RiyDRhNC40LPRg9GA0YsuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge0FycmF5LjxudW1iZXI+fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI192ZXJ0aWNlc1xuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjdmVydGV4XG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNlbmRTaGFwZVxuICAgKi9cbiAgc2VsZi5fdmVydGljZXMgPSBbXTtcbiAgLyoqXG4gICAqINCX0LDQutGA0YvRgtCw0Y8g0YTQuNCz0YPRgNCwICjQstC10YDRiNC40L3QsCkuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge0FycmF5LjxudW1iZXI+fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI19kcmF3RnVuY3Rpb25cbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICovXG4gIHNlbGYuX2Nsb3NlZFNoYXBlID0gbnVsbDtcbiAgLyoqXG4gICAqINCk0YPQvdC60YbQuNGPLCDQutC+0YLQvtGA0L7RjyDQsdGD0LTQtdGCINC+0YLRgNC40YHQvtCy0YvQstCw0YLRjCDQstC10YDRiNC40L3Riy5cbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7ZnVuY3Rpb259IHY2LkFic3RyYWN0UmVuZGVyZXIjX2RyYXdGdW5jdGlvblxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjdmVydGV4XG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNlbmRTaGFwZVxuICAgKi9cbiAgc2VsZi5fZHJhd0Z1bmN0aW9uID0gbnVsbDtcbiAgaWYgKCB0eXBlb2Ygb3B0aW9ucy5hcHBlbmRUbyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgc2VsZi5hcHBlbmRUbyggZG9jdW1lbnQuYm9keSApO1xuICB9IGVsc2UgaWYgKCBvcHRpb25zLmFwcGVuZFRvICE9PSBudWxsICkge1xuICAgIHNlbGYuYXBwZW5kVG8oIG9wdGlvbnMuYXBwZW5kVG8gKTtcbiAgfVxuICBpZiAoICd3JyBpbiBvcHRpb25zIHx8ICdoJyBpbiBvcHRpb25zICkge1xuICAgIHNlbGYucmVzaXplKCBvcHRpb25zLncgfHwgMCwgb3B0aW9ucy5oIHx8IDAgKTtcbiAgfSBlbHNlIGlmICggb3B0aW9ucy5hcHBlbmRUbyAhPT0gbnVsbCApIHtcbiAgICBzZWxmLnJlc2l6ZVRvKCBvcHRpb25zLmFwcGVuZFRvIHx8IGRvY3VtZW50LmJvZHkgKTtcbiAgfSBlbHNlIHtcbiAgICBzZWxmLnJlc2l6ZSggNjAwLCA0MDAgKTtcbiAgfVxuICBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzKCBzZWxmLCBzZWxmICk7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBBYnN0cmFjdFJlbmRlcmVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVmYXVsdHMgICAgICAgICAgPSByZXF1aXJlKCAncGVha28vZGVmYXVsdHMnICk7XG5cbnZhciBjb25zdGFudHMgICAgICAgICA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICk7XG5cbnZhciBwcm9jZXNzUmVjdEFsaWduWCA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWDtcbnZhciBwcm9jZXNzUmVjdEFsaWduWSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWTtcblxudmFyIEFic3RyYWN0UmVuZGVyZXIgID0gcmVxdWlyZSggJy4vQWJzdHJhY3RSZW5kZXJlcicgKTtcbnZhciBzZXR0aW5ncyAgICAgICAgICA9IHJlcXVpcmUoICcuL3NldHRpbmdzJyApO1xuXG4vKipcbiAqIDJEINGA0LXQvdC00LXRgNC10YAuXG4gKiBAY29uc3RydWN0b3IgdjYuUmVuZGVyZXIyRFxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RSZW5kZXJlclxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMge0BsaW5rIHY2LnNldHRpbmdzLnJlbmRlcmVyfVxuICogQGV4YW1wbGVcbiAqIC8vIFJlcXVpcmUgUmVuZGVyZXIyRC5cbiAqIHZhciBSZW5kZXJlcjJEID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXIvUmVuZGVyZXIyRCcgKTtcbiAqIC8vIENyZWF0ZSBhbiBSZW5kZXJlcjJEIGlzbnRhbmNlLlxuICogdmFyIHJlbmRlcmVyID0gbmV3IFJlbmRlcmVyMkQoKTtcbiAqL1xuZnVuY3Rpb24gUmVuZGVyZXIyRCAoIG9wdGlvbnMgKVxue1xuICBBYnN0cmFjdFJlbmRlcmVyLmNyZWF0ZSggdGhpcywgKCBvcHRpb25zID0gZGVmYXVsdHMoIHNldHRpbmdzLCBvcHRpb25zICkgKSwgY29uc3RhbnRzLmdldCggJzJEJyApICk7XG5cbiAgLyoqXG4gICAqIEBtZW1iZXIgdjYuUmVuZGVyZXIyRCNtYXRyaXhcbiAgICogQGFsaWFzIHY2LlJlbmRlcmVyMkQjY29udGV4dFxuICAgKi9cbiAgdGhpcy5tYXRyaXggPSB0aGlzLmNvbnRleHQ7XG59XG5cblJlbmRlcmVyMkQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RSZW5kZXJlci5wcm90b3R5cGUgKTtcblJlbmRlcmVyMkQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUmVuZGVyZXIyRDtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNiYWNrZ3JvdW5kQ29sb3JcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuYmFja2dyb3VuZENvbG9yID0gZnVuY3Rpb24gYmFja2dyb3VuZENvbG9yICggciwgZywgYiwgYSApXG57XG4gIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3M7XG4gIHZhciBjb250ZXh0ICA9IHRoaXMuY29udGV4dDtcblxuICBjb250ZXh0LnNhdmUoKTtcbiAgY29udGV4dC5maWxsU3R5bGUgPSBuZXcgc2V0dGluZ3MuY29sb3IoIHIsIGcsIGIsIGEgKTtcbiAgY29udGV4dC5zZXRUcmFuc2Zvcm0oIHNldHRpbmdzLnNjYWxlLCAwLCAwLCBzZXR0aW5ncy5zY2FsZSwgMCwgMCApO1xuICBjb250ZXh0LmZpbGxSZWN0KCAwLCAwLCB0aGlzLncsIHRoaXMuaCApO1xuICBjb250ZXh0LnJlc3RvcmUoKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjYmFja2dyb3VuZEltYWdlXG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLmJhY2tncm91bmRJbWFnZSA9IGZ1bmN0aW9uIGJhY2tncm91bmRJbWFnZSAoIGltYWdlIClcbntcbiAgdmFyIF9yZWN0QWxpZ25YID0gdGhpcy5fcmVjdEFsaWduWDtcbiAgdmFyIF9yZWN0QWxpZ25ZID0gdGhpcy5fcmVjdEFsaWduWTtcblxuICB0aGlzLl9yZWN0QWxpZ25YID0gY29uc3RhbnRzLmdldCggJ0NFTlRFUicgKTtcbiAgdGhpcy5fcmVjdEFsaWduWSA9IGNvbnN0YW50cy5nZXQoICdNSURETEUnICk7XG5cbiAgdGhpcy5pbWFnZSggaW1hZ2UsIHRoaXMudyAqIDAuNSwgdGhpcy5oICogMC41ICk7XG5cbiAgdGhpcy5fcmVjdEFsaWduWCA9IF9yZWN0QWxpZ25YO1xuICB0aGlzLl9yZWN0QWxpZ25ZID0gX3JlY3RBbGlnblk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2NsZWFyXG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIgKClcbntcbiAgdGhpcy5jb250ZXh0LmNsZWFyKCAwLCAwLCB0aGlzLncsIHRoaXMuaCApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjZHJhd0FycmF5c1xuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5kcmF3QXJyYXlzID0gZnVuY3Rpb24gZHJhd0FycmF5cyAoIHZlcnRzLCBjb3VudCwgX21vZGUsIF9zeCwgX3N5IClcbntcbiAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gIHZhciBpO1xuXG4gIGlmICggY291bnQgPCAyICkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaWYgKCB0eXBlb2YgX3N4ID09PSAndW5kZWZpbmVkJyApIHtcbiAgICBfc3ggPSBfc3kgPSAxOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICB9XG5cbiAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgY29udGV4dC5tb3ZlVG8oIHZlcnRzWyAwIF0gKiBfc3gsIHZlcnRzWyAxIF0gKiBfc3kgKTtcblxuICBmb3IgKCBpID0gMiwgY291bnQgKj0gMjsgaSA8IGNvdW50OyBpICs9IDIgKSB7XG4gICAgY29udGV4dC5saW5lVG8oIHZlcnRzWyBpIF0gKiBfc3gsIHZlcnRzWyBpICsgMSBdICogX3N5ICk7XG4gIH1cblxuICBpZiAoIHRoaXMuX2RvRmlsbCApIHtcbiAgICB0aGlzLl9maWxsKCk7XG4gIH1cblxuICBpZiAoIHRoaXMuX2RvU3Ryb2tlICYmIHRoaXMuX2xpbmVXaWR0aCA+IDAgKSB7XG4gICAgdGhpcy5fc3Ryb2tlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjZHJhd0ltYWdlXG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLmRyYXdJbWFnZSA9IGZ1bmN0aW9uIGRyYXdJbWFnZSAoIGltYWdlLCB4LCB5LCB3LCBoIClcbntcbiAgdGhpcy5jb250ZXh0LmRyYXdJbWFnZSggaW1hZ2UuZ2V0KCkuaW1hZ2UsIGltYWdlLnN4LCBpbWFnZS5zeSwgaW1hZ2Uuc3csIGltYWdlLnNoLCB4LCB5LCB3LCBoICk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNyZWN0XG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLnJlY3QgPSBmdW5jdGlvbiByZWN0ICggeCwgeSwgdywgaCApXG57XG4gIHggPSBwcm9jZXNzUmVjdEFsaWduWCggdGhpcywgeCwgdyApO1xuICB5ID0gcHJvY2Vzc1JlY3RBbGlnblkoIHRoaXMsIHksIGggKTtcblxuICB0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gIHRoaXMuY29udGV4dC5yZWN0KCB4LCB5LCB3LCBoICk7XG5cbiAgaWYgKCB0aGlzLl9kb0ZpbGwgKSB7XG4gICAgdGhpcy5fZmlsbCgpO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb1N0cm9rZSAmJiB0aGlzLl9saW5lV2lkdGggPiAwICkge1xuICAgIHRoaXMuX3N0cm9rZSgpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2FyY1xuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5hcmMgPSBmdW5jdGlvbiBhcmMgKCB4LCB5LCByIClcbntcbiAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICB0aGlzLmNvbnRleHQuYXJjKCB4LCB5LCByLCAwLCBNYXRoLlBJICogMiApO1xuXG4gIGlmICggdGhpcy5fZG9GaWxsICkge1xuICAgIHRoaXMuX2ZpbGwoKTtcbiAgfVxuXG4gIGlmICggdGhpcy5fZG9TdHJva2UgJiYgdGhpcy5fbGluZVdpZHRoID4gMCApIHtcbiAgICB0aGlzLl9zdHJva2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuUmVuZGVyZXIyRC5wcm90b3R5cGUuX2ZpbGwgPSBmdW5jdGlvbiBfZmlsbCAoKVxue1xuICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5fZmlsbENvbG9yO1xuICB0aGlzLmNvbnRleHQuZmlsbCgpO1xufTtcblxuUmVuZGVyZXIyRC5wcm90b3R5cGUuX3N0cm9rZSA9IGZ1bmN0aW9uIF9zdHJva2UgKClcbntcbiAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG5cbiAgY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuX3N0cm9rZUNvbG9yO1xuXG4gIGlmICggKCBjb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuX2xpbmVXaWR0aCApIDw9IDEgKSB7XG4gICAgY29udGV4dC5zdHJva2UoKTtcbiAgfVxuXG4gIGNvbnRleHQuc3Ryb2tlKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyMkQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkZWZhdWx0cyAgICAgICAgICA9IHJlcXVpcmUoICdwZWFrby9kZWZhdWx0cycgKTtcblxudmFyIFNoYWRlclByb2dyYW0gICAgID0gcmVxdWlyZSggJy4uL1NoYWRlclByb2dyYW0nICk7XG52YXIgVHJhbnNmb3JtICAgICAgICAgPSByZXF1aXJlKCAnLi4vVHJhbnNmb3JtJyApO1xudmFyIGNvbnN0YW50cyAgICAgICAgID0gcmVxdWlyZSggJy4uL2NvbnN0YW50cycgKTtcbnZhciBzaGFkZXJzICAgICAgICAgICA9IHJlcXVpcmUoICcuLi9zaGFkZXJzJyApO1xuXG52YXIgcHJvY2Vzc1JlY3RBbGlnblggPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblg7XG52YXIgcHJvY2Vzc1JlY3RBbGlnblkgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblk7XG5cbnZhciBBYnN0cmFjdFJlbmRlcmVyICA9IHJlcXVpcmUoICcuL0Fic3RyYWN0UmVuZGVyZXInICk7XG52YXIgc2V0dGluZ3MgICAgICAgICAgPSByZXF1aXJlKCAnLi9zZXR0aW5ncycgKTtcblxuLyoqXG4gKiDQnNCw0YHRgdC40LIg0LLQtdGA0YjQuNC9ICh2ZXJ0aWNlcykg0LrQstCw0LTRgNCw0YLQsC5cbiAqIEBwcml2YXRlXG4gKiBAaW5uZXJcbiAqIEB2YXIge0Zsb2F0MzJBcnJheX0gcmVjdFxuICovXG52YXIgcmVjdCA9ICggZnVuY3Rpb24gKClcbntcbiAgdmFyIHJlY3QgPSBbXG4gICAgMCwgMCxcbiAgICAxLCAwLFxuICAgIDEsIDEsXG4gICAgMCwgMVxuICBdO1xuXG4gIGlmICggdHlwZW9mIEZsb2F0MzJBcnJheSA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheSggcmVjdCApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gIH1cblxuICByZXR1cm4gcmVjdDtcbn0gKSgpO1xuXG4vKipcbiAqIFdlYkdMINGA0LXQvdC00LXRgNC10YAuXG4gKiBAY29uc3RydWN0b3IgdjYuUmVuZGVyZXJHTFxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RSZW5kZXJlclxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMge0BsaW5rIHY2LnNldHRpbmdzLnJlbmRlcmVyfVxuICogQGV4YW1wbGVcbiAqIC8vIFJlcXVpcmUgUmVuZGVyZXJHTC5cbiAqIHZhciBSZW5kZXJlckdMID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXIvUmVuZGVyZXJHTCcgKTtcbiAqIC8vIENyZWF0ZSBhbiBSZW5kZXJlckdMIGlzbnRhbmNlLlxuICogdmFyIHJlbmRlcmVyID0gbmV3IFJlbmRlcmVyR0woKTtcbiAqL1xuZnVuY3Rpb24gUmVuZGVyZXJHTCAoIG9wdGlvbnMgKVxue1xuICBBYnN0cmFjdFJlbmRlcmVyLmNyZWF0ZSggdGhpcywgKCBvcHRpb25zID0gZGVmYXVsdHMoIHNldHRpbmdzLCBvcHRpb25zICkgKSwgY29uc3RhbnRzLmdldCggJ0dMJyApICk7XG5cbiAgLyoqXG4gICAqINCt0YLQsCBcInRyYW5zZm9ybWF0aW9uIG1hdHJpeFwiINC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8ge0BsaW5rIHY2LlJlbmRlcmVyR0wjcm90YXRlfSDQuCDRgi7Qvy5cbiAgICogQG1lbWJlciB7djYuVHJhbnNmb3JtfSB2Ni5SZW5kZXJlckdMI21hdHJpeFxuICAgKi9cbiAgdGhpcy5tYXRyaXggPSBuZXcgVHJhbnNmb3JtKCk7XG5cbiAgLyoqXG4gICAqINCR0YPRhNC10YDRiyDQtNCw0L3QvdGL0YUgKNCy0LXRgNGI0LjQvSkuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuUmVuZGVyZXJHTCNidWZmZXJzXG4gICAqIEBwcm9wZXJ0eSB7V2ViR0xCdWZmZXJ9IGRlZmF1bHQg0J7RgdC90L7QstC90L7QuSDQsdGD0YTQtdGALlxuICAgKiBAcHJvcGVydHkge1dlYkdMQnVmZmVyfSByZWN0ICAgINCY0YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0L7RgtGA0LjRgdC+0LLQutC4INC/0YDRj9C80L7Rg9Cz0L7Qu9GM0L3QuNC60LAg0LIge0BsaW5rIHY2LlJlbmRlcmVyR0wjcmVjdH0uXG4gICAqL1xuICB0aGlzLmJ1ZmZlcnMgPSB7XG4gICAgZGVmYXVsdDogdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlcigpLFxuICAgIHJlY3Q6ICB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKClcbiAgfTtcblxuICB0aGlzLmNvbnRleHQuYmluZEJ1ZmZlciggdGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXJzLnJlY3QgKTtcbiAgdGhpcy5jb250ZXh0LmJ1ZmZlckRhdGEoIHRoaXMuY29udGV4dC5BUlJBWV9CVUZGRVIsIHJlY3QsIHRoaXMuY29udGV4dC5TVEFUSUNfRFJBVyApO1xuXG4gIC8qKlxuICAgKiDQqNC10LnQtNC10YDRiyAoV2ViR0wg0L/RgNC+0LPRgNCw0LzQvNGLKS5cbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5SZW5kZXJlckdMI3Byb2dyYW1zXG4gICAqIEBwcm9wZXJ0eSB7djYuU2hhZGVyUHJvZ3JhbX0gZGVmYXVsdFxuICAgKi9cbiAgdGhpcy5wcm9ncmFtcyA9IHtcbiAgICBkZWZhdWx0OiBuZXcgU2hhZGVyUHJvZ3JhbSggc2hhZGVycy5iYXNpYywgdGhpcy5jb250ZXh0IClcbiAgfTtcblxuICB0aGlzLmJsZW5kaW5nKCBvcHRpb25zLmJsZW5kaW5nICk7XG59XG5cblJlbmRlcmVyR0wucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RSZW5kZXJlci5wcm90b3R5cGUgKTtcblJlbmRlcmVyR0wucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUmVuZGVyZXJHTDtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNyZXNpemVcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24gcmVzaXplICggdywgaCApXG57XG4gIEFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlLnJlc2l6ZS5jYWxsKCB0aGlzLCB3LCBoICk7XG4gIHRoaXMuY29udGV4dC52aWV3cG9ydCggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNibGVuZGluZ1xuICogQHBhcmFtIHtib29sZWFufSBibGVuZGluZ1xuICogQGNoYWluYWJsZVxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5ibGVuZGluZyA9IGZ1bmN0aW9uIGJsZW5kaW5nICggYmxlbmRpbmcgKVxue1xuICB2YXIgZ2wgPSB0aGlzLmNvbnRleHQ7XG5cbiAgaWYgKCBibGVuZGluZyApIHtcbiAgICBnbC5lbmFibGUoIGdsLkJMRU5EICk7XG4gICAgZ2wuZGlzYWJsZSggZ2wuREVQVEhfVEVTVCApO1xuICAgIGdsLmJsZW5kRnVuYyggZ2wuU1JDX0FMUEhBLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBICk7XG4gICAgZ2wuYmxlbmRFcXVhdGlvbiggZ2wuRlVOQ19BREQgKTtcbiAgfSBlbHNlIHtcbiAgICBnbC5kaXNhYmxlKCBnbC5CTEVORCApO1xuICAgIGdsLmVuYWJsZSggZ2wuREVQVEhfVEVTVCApO1xuICAgIGdsLmRlcHRoRnVuYyggZ2wuTEVRVUFMICk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0J7Rh9C40YnQsNC10YIg0LrQvtC90YLQtdC60YHRgi5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjX2NsZWFyXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHIg0J3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3QvtC1INC30L3QsNGH0LXQvdC40LUgXCJyZWQgY2hhbm5lbFwiLlxuICogQHBhcmFtICB7bnVtYmVyfSBnINCd0L7RgNC80LDQu9C40LfQvtCy0LDQvdC90L7QtSDQt9C90LDRh9C10L3QuNC1IFwiZ3JlZW4gY2hhbm5lbFwiLlxuICogQHBhcmFtICB7bnVtYmVyfSBiINCd0L7RgNC80LDQu9C40LfQvtCy0LDQvdC90L7QtSDQt9C90LDRh9C10L3QuNC1IFwiYmx1ZSBjaGFubmVsXCIuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGEg0J3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3QvtC1INC30L3QsNGH0LXQvdC40LUg0L/RgNC+0LfRgNCw0YfQvdC+0YHRgtC4IChhbHBoYSkuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogcmVuZGVyZXIuX2NsZWFyKCAxLCAwLCAwLCAxICk7IC8vIEZpbGwgY29udGV4dCB3aXRoIHJlZCBjb2xvci5cbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuX2NsZWFyID0gZnVuY3Rpb24gX2NsZWFyICggciwgZywgYiwgYSApXG57XG4gIHZhciBnbCA9IHRoaXMuY29udGV4dDtcbiAgZ2wuY2xlYXJDb2xvciggciwgZywgYiwgYSApO1xuICBnbC5jbGVhciggZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2JhY2tncm91bmRDb2xvclxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5iYWNrZ3JvdW5kQ29sb3IgPSBmdW5jdGlvbiBiYWNrZ3JvdW5kQ29sb3IgKCByLCBnLCBiLCBhIClcbntcbiAgdmFyIHJnYmEgPSBuZXcgdGhpcy5zZXR0aW5ncy5jb2xvciggciwgZywgYiwgYSApLnJnYmEoKTtcbiAgdGhpcy5fY2xlYXIoIHJnYmFbIDAgXSAvIDI1NSwgcmdiYVsgMSBdIC8gMjU1LCByZ2JhWyAyIF0gLyAyNTUsIHJnYmFbIDMgXSApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjY2xlYXJcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiBjbGVhciAoKVxue1xuICB0aGlzLl9jbGVhciggMCwgMCwgMCwgMCApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjZHJhd0FycmF5c1xuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5kcmF3QXJyYXlzID0gZnVuY3Rpb24gZHJhd0FycmF5cyAoIHZlcnRzLCBjb3VudCwgbW9kZSwgX3N4LCBfc3kgKVxue1xuICB2YXIgcHJvZ3JhbSA9IHRoaXMucHJvZ3JhbXMuZGVmYXVsdDtcbiAgdmFyIGdsICAgICAgPSB0aGlzLmNvbnRleHQ7XG5cbiAgaWYgKCBjb3VudCA8IDIgKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBpZiAoIHZlcnRzICkge1xuICAgIGlmICggdHlwZW9mIG1vZGUgPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgbW9kZSA9IGdsLlNUQVRJQ19EUkFXO1xuICAgIH1cblxuICAgIGdsLmJpbmRCdWZmZXIoIGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXJzLmRlZmF1bHQgKTtcbiAgICBnbC5idWZmZXJEYXRhKCBnbC5BUlJBWV9CVUZGRVIsIHZlcnRzLCBtb2RlICk7XG4gIH1cblxuICBpZiAoIHR5cGVvZiBfc3ggIT09ICd1bmRlZmluZWQnICkge1xuICAgIHRoaXMubWF0cml4LnNjYWxlKCBfc3gsIF9zeSApO1xuICB9XG5cbiAgcHJvZ3JhbVxuICAgIC51c2UoKVxuICAgIC5zZXRVbmlmb3JtKCAndXRyYW5zZm9ybScsIHRoaXMubWF0cml4Lm1hdHJpeCApXG4gICAgLnNldFVuaWZvcm0oICd1cmVzJywgWyB0aGlzLncsIHRoaXMuaCBdIClcbiAgICAuc2V0QXR0cmlidXRlKCAnYXBvcycsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCApO1xuXG4gIHRoaXMuX2ZpbGwoIGNvdW50ICk7XG4gIHRoaXMuX3N0cm9rZSggY291bnQgKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cblJlbmRlcmVyR0wucHJvdG90eXBlLl9maWxsID0gZnVuY3Rpb24gX2ZpbGwgKCBjb3VudCApXG57XG4gIGlmICggdGhpcy5fZG9GaWxsICkge1xuICAgIHRoaXMucHJvZ3JhbXMuZGVmYXVsdC5zZXRVbmlmb3JtKCAndWNvbG9yJywgdGhpcy5fZmlsbENvbG9yLnJnYmEoKSApO1xuICAgIHRoaXMuY29udGV4dC5kcmF3QXJyYXlzKCB0aGlzLmNvbnRleHQuVFJJQU5HTEVfRkFOLCAwLCBjb3VudCApO1xuICB9XG59O1xuXG5SZW5kZXJlckdMLnByb3RvdHlwZS5fc3Ryb2tlID0gZnVuY3Rpb24gX3N0cm9rZSAoIGNvdW50IClcbntcbiAgaWYgKCB0aGlzLl9kb1N0cm9rZSAmJiB0aGlzLl9saW5lV2lkdGggPiAwICkge1xuICAgIHRoaXMucHJvZ3JhbXMuZGVmYXVsdC5zZXRVbmlmb3JtKCAndWNvbG9yJywgdGhpcy5fc3Ryb2tlQ29sb3IucmdiYSgpICk7XG4gICAgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCggdGhpcy5fbGluZVdpZHRoICk7XG4gICAgdGhpcy5jb250ZXh0LmRyYXdBcnJheXMoIHRoaXMuY29udGV4dC5MSU5FX0xPT1AsIDAsIGNvdW50ICk7XG4gIH1cbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjYXJjXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmFyYyA9IGZ1bmN0aW9uIGFyYyAoIHgsIHksIHIgKVxue1xuICByZXR1cm4gdGhpcy5kcmF3UG9seWdvbiggeCwgeSwgciwgciwgMjQsIDAgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjcmVjdFxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24gcmVjdCAoIHgsIHksIHcsIGggKVxue1xuICB4ID0gcHJvY2Vzc1JlY3RBbGlnblgoIHRoaXMsIHgsIHcgKTtcbiAgeSA9IHByb2Nlc3NSZWN0QWxpZ25ZKCB0aGlzLCB5LCBoICk7XG4gIHRoaXMubWF0cml4LnNhdmUoKTtcbiAgdGhpcy5tYXRyaXgudHJhbnNsYXRlKCB4LCB5ICk7XG4gIHRoaXMubWF0cml4LnNjYWxlKCB3LCBoICk7XG4gIHRoaXMuY29udGV4dC5iaW5kQnVmZmVyKCB0aGlzLmNvbnRleHQuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlcnMucmVjdCApO1xuICB0aGlzLmRyYXdBcnJheXMoIG51bGwsIDQgKTtcbiAgdGhpcy5tYXRyaXgucmVzdG9yZSgpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyZXJHTDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbnN0YW50cyAgICAgICA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICk7XG5cbnZhciByZXBvcnQgICAgICAgICAgPSByZXF1aXJlKCAnLi4vaW50ZXJuYWwvcmVwb3J0JyApO1xuXG52YXIgZ2V0UmVuZGVyZXJUeXBlID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvZ2V0X3JlbmRlcmVyX3R5cGUnICk7XG52YXIgZ2V0V2ViR0wgICAgICAgID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvZ2V0X3dlYmdsJyApO1xuXG52YXIgUmVuZGVyZXJHTCAgICAgID0gcmVxdWlyZSggJy4vUmVuZGVyZXJHTCcgKTtcbnZhciBSZW5kZXJlcjJEICAgICAgPSByZXF1aXJlKCAnLi9SZW5kZXJlcjJEJyApO1xudmFyIHR5cGUgICAgICAgICAgICA9IHJlcXVpcmUoICcuL3NldHRpbmdzJyApLnR5cGU7XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSDRgNC10L3QtNC10YDQtdGALiDQldGB0LvQuCDRgdC+0LfQtNCw0YLRjCBXZWJHTCDQutC+0L3RgtC10LrRgdGCINC90LUg0L/QvtC70YPRh9C40YLRgdGPLCDRgtC+INCx0YPQtNC10YIg0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvSAyRC5cbiAqIEBtZXRob2QgdjYuY3JlYXRlUmVuZGVyZXJcbiAqIEBwYXJhbSAge29iamVjdH0gICAgICAgICAgICAgIG9wdGlvbnMge0BsaW5rIHY2LnNldHRpbmdzLnJlbmRlcmVyfS5cbiAqIEByZXR1cm4ge3Y2LkFic3RyYWN0UmVuZGVyZXJ9ICAgICAgICAg0J3QvtCy0YvQuSDRgNC10L3QtNC10YDQtdGAICgyRCwgR0wpLlxuICogQGV4YW1wbGVcbiAqIHZhciBjcmVhdGVSZW5kZXJlciA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL2NyZWF0ZV9yZW5kZXJlcicgKTtcbiAqIHZhciBjb25zdGFudHMgICAgICA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2NvbnN0YW50cycgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIFdlYkdMIG9yIDJEIHJlbmRlcmVyIGJhc2VkIG9uIHBsYXRmb3JtIGFuZCBicm93c2VyPC9jYXB0aW9uPlxuICogdmFyIHJlbmRlcmVyID0gY3JlYXRlUmVuZGVyZXIoIHsgdHlwZTogY29uc3RhbnRzLmdldCggJ0FVVE8nICkgfSApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRpbmcgV2ViR0wgcmVuZGVyZXI8L2NhcHRpb24+XG4gKiB2YXIgcmVuZGVyZXIgPSBjcmVhdGVSZW5kZXJlciggeyB0eXBlOiBjb25zdGFudHMuZ2V0KCAnR0wnICkgfSApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRpbmcgMkQgcmVuZGVyZXI8L2NhcHRpb24+XG4gKiB2YXIgcmVuZGVyZXIgPSBjcmVhdGVSZW5kZXJlciggeyB0eXBlOiBjb25zdGFudHMuZ2V0KCAnMkQnICkgfSApO1xuICovXG5mdW5jdGlvbiBjcmVhdGVSZW5kZXJlciAoIG9wdGlvbnMgKVxue1xuICB2YXIgdHlwZV8gPSAoIG9wdGlvbnMgJiYgb3B0aW9ucy50eXBlICkgfHwgdHlwZTtcblxuICBpZiAoIHR5cGVfID09PSBjb25zdGFudHMuZ2V0KCAnQVVUTycgKSApIHtcbiAgICB0eXBlXyA9IGdldFJlbmRlcmVyVHlwZSgpO1xuICB9XG5cbiAgaWYgKCB0eXBlXyA9PT0gY29uc3RhbnRzLmdldCggJ0dMJyApICkge1xuICAgIGlmICggZ2V0V2ViR0woKSApIHtcbiAgICAgIHJldHVybiBuZXcgUmVuZGVyZXJHTCggb3B0aW9ucyApO1xuICAgIH1cblxuICAgIHJlcG9ydCggJ0Nhbm5vdCBjcmVhdGUgV2ViR0wgY29udGV4dC4gRmFsbGluZyBiYWNrIHRvIDJELicgKTtcbiAgfVxuXG4gIGlmICggdHlwZV8gPT09IGNvbnN0YW50cy5nZXQoICcyRCcgKSB8fCB0eXBlXyA9PT0gY29uc3RhbnRzLmdldCggJ0dMJyApICkge1xuICAgIHJldHVybiBuZXcgUmVuZGVyZXIyRCggb3B0aW9ucyApO1xuICB9XG5cbiAgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biByZW5kZXJlciB0eXBlLiBUaGUga25vd24gYXJlOiAyRCBhbmQgR0wnICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUmVuZGVyZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0JfQsNC60YDRi9Cy0LDQtdGCINGE0LjQs9GD0YDRgy5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNsb3NlU2hhcGVcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHJlbmRlcmVyINCg0LXQvdC00LXRgNC10YAuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqL1xuZnVuY3Rpb24gY2xvc2VTaGFwZSAoIHJlbmRlcmVyIClcbntcbiAgaWYgKCAhIHJlbmRlcmVyLl9jbG9zZWRTaGFwZSApIHtcbiAgICByZW5kZXJlci5fY2xvc2VkU2hhcGUgPSByZW5kZXJlci5fdmVydGljZXMuc2xpY2UoKTtcbiAgICByZW5kZXJlci5fY2xvc2VkU2hhcGUucHVzaCggcmVuZGVyZXIuX2Nsb3NlZFNoYXBlWyAwIF0gKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsb3NlU2hhcGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0JrQvtC/0LjRgNGD0LXRgiBkcmF3aW5nIHNldHRpbmdzIChfbGluZVdpZHRoLCBfcmVjdEFsaWduWCwg0Lgg0YIu0LQuKSDQuNC3IGBzb3VyY2VgINCyIGB0YXJnZXRgLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY29weURyYXdpbmdTZXR0aW5nc1xuICogQHBhcmFtICB7b2JqZWN0fSAgdGFyZ2V0INCc0L7QttC10YIg0LHRi9GC0YwgYEFic3RyYWN0UmVuZGVyZXJgINC40LvQuCDQv9GA0L7RgdGC0YvQvCDQvtCx0YrQtdC60YLQvtC8INGBINGB0L7RhdGA0LDQvdC10L3QvdGL0LzQuCDRh9C10YDQtdC3XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAg0Y3RgtGDINGE0YPQvdC60YbQuNGOINC90LDRgdGC0YDQvtC50LrQsNC80LguXG4gKiBAcGFyYW0gIHtvYmplY3R9ICBzb3VyY2Ug0J7Qv9C40YHQsNC90LjQtSDRgtC+INC20LUsINGH0YLQviDQuCDQtNC70Y8gYHRhcmdldGAuXG4gKiBAcGFyYW0gIHtib29sZWFufSBbZGVlcF0g0JXRgdC70LggYHRydWVgLCDRgtC+INCx0YPQtNC10YIg0YLQsNC60LbQtSDQutC+0L/QuNGA0L7QstCw0YLRjCBfZmlsbENvbG9yLCBfc3Ryb2tlQ29sb3Ig0Lgg0YIu0LQuXG4gKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIgYHRhcmdldGAuXG4gKi9cbmZ1bmN0aW9uIGNvcHlEcmF3aW5nU2V0dGluZ3MgKCB0YXJnZXQsIHNvdXJjZSwgZGVlcCApXG57XG4gIGlmICggZGVlcCApIHtcbiAgICB0YXJnZXQuX2ZpbGxDb2xvclsgMCBdICAgPSBzb3VyY2UuX2ZpbGxDb2xvclsgMCBdO1xuICAgIHRhcmdldC5fZmlsbENvbG9yWyAxIF0gICA9IHNvdXJjZS5fZmlsbENvbG9yWyAxIF07XG4gICAgdGFyZ2V0Ll9maWxsQ29sb3JbIDIgXSAgID0gc291cmNlLl9maWxsQ29sb3JbIDIgXTtcbiAgICB0YXJnZXQuX2ZpbGxDb2xvclsgMyBdICAgPSBzb3VyY2UuX2ZpbGxDb2xvclsgMyBdO1xuICAgIHRhcmdldC5fc3Ryb2tlQ29sb3JbIDAgXSA9IHNvdXJjZS5fc3Ryb2tlQ29sb3JbIDAgXTtcbiAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWyAxIF0gPSBzb3VyY2UuX3N0cm9rZUNvbG9yWyAxIF07XG4gICAgdGFyZ2V0Ll9zdHJva2VDb2xvclsgMiBdID0gc291cmNlLl9zdHJva2VDb2xvclsgMiBdO1xuICAgIHRhcmdldC5fc3Ryb2tlQ29sb3JbIDMgXSA9IHNvdXJjZS5fc3Ryb2tlQ29sb3JbIDMgXTtcbiAgfVxuXG4gIHRhcmdldC5fYmFja2dyb3VuZFBvc2l0aW9uWCA9IHNvdXJjZS5fYmFja2dyb3VuZFBvc2l0aW9uWDtcbiAgdGFyZ2V0Ll9iYWNrZ3JvdW5kUG9zaXRpb25ZID0gc291cmNlLl9iYWNrZ3JvdW5kUG9zaXRpb25ZO1xuICB0YXJnZXQuX3JlY3RBbGlnblggICAgICAgICAgPSBzb3VyY2UuX3JlY3RBbGlnblg7XG4gIHRhcmdldC5fcmVjdEFsaWduWSAgICAgICAgICA9IHNvdXJjZS5fcmVjdEFsaWduWTtcbiAgdGFyZ2V0Ll9saW5lV2lkdGggICAgICAgICAgID0gc291cmNlLl9saW5lV2lkdGg7XG4gIHRhcmdldC5fZG9TdHJva2UgICAgICAgICAgICA9IHNvdXJjZS5fZG9TdHJva2U7XG4gIHRhcmdldC5fZG9GaWxsICAgICAgICAgICAgICA9IHNvdXJjZS5fZG9GaWxsO1xuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29weURyYXdpbmdTZXR0aW5ncztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoICcuLi8uLi9jb25zdGFudHMnICk7XG5cbnZhciBkZWZhdWx0RHJhd2luZ1NldHRpbmdzID0ge1xuICBfYmFja2dyb3VuZFBvc2l0aW9uWDogY29uc3RhbnRzLmdldCggJ0xFRlQnICksXG4gIF9iYWNrZ3JvdW5kUG9zaXRpb25ZOiBjb25zdGFudHMuZ2V0KCAnVE9QJyApLFxuICBfcmVjdEFsaWduWDogICAgICAgICAgY29uc3RhbnRzLmdldCggJ0xFRlQnICksXG4gIF9yZWN0QWxpZ25ZOiAgICAgICAgICBjb25zdGFudHMuZ2V0KCAnVE9QJyApLFxuICBfbGluZVdpZHRoOiAgICAgICAgICAgMixcbiAgX2RvU3Ryb2tlOiAgICAgICAgICAgIHRydWUsXG4gIF9kb0ZpbGw6ICAgICAgICAgICAgICB0cnVlXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmF1bHREcmF3aW5nU2V0dGluZ3M7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBvbmNlICAgICAgPSByZXF1aXJlKCAncGVha28vb25jZScgKTtcblxudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoICcuLi8uLi9jb25zdGFudHMnICk7XG5cbi8vIFwicGxhdGZvcm1cIiBub3QgaW5jbHVkZWQgdXNpbmcgPHNjcmlwdCAvPiB0YWcuXG5pZiAoIHR5cGVvZiBwbGF0Zm9ybSA9PT0gJ3VuZGVmaW5lZCcgKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgdmFyIHBsYXRmb3JtOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbiAgdHJ5IHtcbiAgICBwbGF0Zm9ybSA9IHJlcXVpcmUoICdwbGF0Zm9ybScgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBnbG9iYWwtcmVxdWlyZVxuICB9IGNhdGNoICggZXJyb3IgKSB7XG4gICAgLy8gXCJwbGF0Zm9ybVwiIG5vdCBpbnN0YWxsZWQgdXNpbmcgTlBNLlxuICB9XG59XG5cbmZ1bmN0aW9uIGdldFJlbmRlcmVyVHlwZSAoKVxue1xuICB2YXIgc2FmYXJpLCB0b3VjaGFibGU7XG5cbiAgaWYgKCBwbGF0Zm9ybSApIHtcbiAgICBzYWZhcmkgPSBwbGF0Zm9ybS5vcyAmJlxuICAgICAgcGxhdGZvcm0ub3MuZmFtaWx5ID09PSAnaU9TJyAmJlxuICAgICAgcGxhdGZvcm0ubmFtZSA9PT0gJ1NhZmFyaSc7XG4gIH1cblxuICBpZiAoIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICkge1xuICAgIHRvdWNoYWJsZSA9ICdvbnRvdWNoZW5kJyBpbiB3aW5kb3c7XG4gIH1cblxuICBpZiAoIHRvdWNoYWJsZSAmJiAhIHNhZmFyaSApIHtcbiAgICByZXR1cm4gY29uc3RhbnRzLmdldCggJ0dMJyApO1xuICB9XG5cbiAgcmV0dXJuIGNvbnN0YW50cy5nZXQoICcyRCcgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvbmNlKCBnZXRSZW5kZXJlclR5cGUgKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9uY2UgPSByZXF1aXJlKCAncGVha28vb25jZScgKTtcblxuLyoqXG4gKiDQktC+0LfQstGA0LDRidCw0LXRgiDQuNC80Y8g0L/QvtC00LTQtdGA0LbQuNCy0LDQtdC80L7Qs9C+IFdlYkdMINC60L7QvdGC0LXQutGB0YLQsCwg0L3QsNC/0YDQuNC80LXRgDogJ2V4cGVyaW1lbnRhbC13ZWJnbCcuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBnZXRXZWJHTFxuICogQHJldHVybiB7c3RyaW5nP30g0JIg0YHQu9GD0YfQsNC1INC90LXRg9C00LDRh9C4IChXZWJHTCDQvdC1INC/0L7QtNC00LXRgNC20LjQstCw0LXRgtGB0Y8pIC0g0LLQtdGA0L3QtdGCIGBudWxsYC5cbiAqL1xuZnVuY3Rpb24gZ2V0V2ViR0wgKClcbntcbiAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XG4gIHZhciBuYW1lICAgPSBudWxsO1xuXG4gIGlmICggY2FudmFzLmdldENvbnRleHQoICd3ZWJnbCcgKSApIHtcbiAgICBuYW1lID0gJ3dlYmdsJztcbiAgfSBlbHNlIGlmICggY2FudmFzLmdldENvbnRleHQoICdleHBlcmltZW50YWwtd2ViZ2wnICkgKSB7XG4gICAgbmFtZSA9ICdleHBlcmltZW50YWwtd2ViZ2wnO1xuICB9XG5cbiAgLy8gRml4aW5nIHBvc3NpYmxlIG1lbW9yeSBsZWFrLlxuICBjYW52YXMgPSBudWxsO1xuICByZXR1cm4gbmFtZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvbmNlKCBnZXRXZWJHTCApO1xuIiwiLyogZXNsaW50IGxpbmVzLWFyb3VuZC1kaXJlY3RpdmU6IG9mZiAqL1xuLyogZXNsaW50IGxpbmVzLWFyb3VuZC1jb21tZW50OiBvZmYgKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCAnLi4vLi4vY29uc3RhbnRzJyApO1xuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBwcm9jZXNzUmVjdEFsaWduWFxuICogQHBhcmFtICB7djYuQWJzdHJhY3RSZW5kZXJlcn0gcmVuZGVyZXJcbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIHhcbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIHdcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0cy5wcm9jZXNzUmVjdEFsaWduWCA9IGZ1bmN0aW9uIHByb2Nlc3NSZWN0QWxpZ25YICggcmVuZGVyZXIsIHgsIHcgKSB7IGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblggPT09IGNvbnN0YW50cy5nZXQoIFwiQ0VOVEVSXCIgKSApIHsgeCAtPSB3ICogMC41OyB9IGVsc2UgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWCA9PT0gY29uc3RhbnRzLmdldCggXCJSSUdIVFwiICkgKSB7IHggLT0gdzsgfSBlbHNlIGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblggIT09IGNvbnN0YW50cy5nZXQoIFwiTEVGVFwiICkgKSB7IHRocm93IEVycm9yKCAnVW5rbm93biBcIiArJyArIFwicmVjdEFsaWduWFwiICsgJ1wiOiAnICsgcmVuZGVyZXIuX3JlY3RBbGlnblggKTsgfSByZXR1cm4gTWF0aC5mbG9vciggeCApOyB9OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgcHJvY2Vzc1JlY3RBbGlnbllcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHJlbmRlcmVyXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB5XG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICBoXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydHMucHJvY2Vzc1JlY3RBbGlnblkgPSBmdW5jdGlvbiBwcm9jZXNzUmVjdEFsaWduWSAoIHJlbmRlcmVyLCB4LCB3ICkgeyBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25ZID09PSBjb25zdGFudHMuZ2V0KCBcIk1JRERMRVwiICkgKSB7IHggLT0gdyAqIDAuNTsgfSBlbHNlIGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblkgPT09IGNvbnN0YW50cy5nZXQoIFwiQk9UVE9NXCIgKSApIHsgeCAtPSB3OyB9IGVsc2UgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWSAhPT0gY29uc3RhbnRzLmdldCggXCJUT1BcIiApICkgeyB0aHJvdyBFcnJvciggJ1Vua25vd24gXCIgKycgKyBcInJlY3RBbGlnbllcIiArICdcIjogJyArIHJlbmRlcmVyLl9yZWN0QWxpZ25ZICk7IH0gcmV0dXJuIE1hdGguZmxvb3IoIHggKTsgfTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBHTCA9IHJlcXVpcmUoICcuLi8uLi9jb25zdGFudHMnICkuZ2V0KCAnR0wnICk7XG5cbi8qKlxuICog0J7QsdGA0LDQsdCw0YLRi9Cy0LDQtdGCINGE0LjQs9GD0YDRgy5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHByb2Nlc3NTaGFwZVxuICogQHBhcmFtICB7djYuQWJzdHJhY3RSZW5kZXJlcn0gcmVuZGVyZXIg0KDQtdC90LTQtdGA0LXRgC5cbiAqIEBwYXJhbSAge0FycmF5fEZsb2F0MzJBcnJheX0gIHZlcnRpY2VzINCS0LXRgNGI0LjQvdGLLlxuICogQHJldHVybiB7QXJyYXl8RmxvYXQzMkFycmF5fSAgICAgICAgICAg0J7QsdGA0LDQsdC+0YLQsNC90L3Ri9C1INCy0LXRgNGI0LjQvdGLLlxuICovXG5mdW5jdGlvbiBwcm9jZXNzU2hhcGUgKCByZW5kZXJlciwgdmVydGljZXMgKVxue1xuICBpZiAoIHJlbmRlcmVyLnR5cGUgPT09IEdMICYmIHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICdmdW5jdGlvbicgJiYgISAoIHZlcnRpY2VzIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkgKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgICB2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoIHZlcnRpY2VzICk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gIH1cblxuICByZXR1cm4gdmVydGljZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcHJvY2Vzc1NoYXBlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVmYXVsdERyYXdpbmdTZXR0aW5ncyA9IHJlcXVpcmUoICcuL2RlZmF1bHRfZHJhd2luZ19zZXR0aW5ncycgKTtcbnZhciBjb3B5RHJhd2luZ1NldHRpbmdzICAgID0gcmVxdWlyZSggJy4vY29weV9kcmF3aW5nX3NldHRpbmdzJyApO1xuXG4vKipcbiAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGRyYXdpbmcgc2V0dGluZ3Mg0L/QviDRg9C80L7Qu9GH0LDQvdC40Y4g0LIgYHRhcmdldGAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQgICDQnNC+0LbQtdGCINCx0YvRgtGMIGBBYnN0cmFjdFJlbmRlcmVyYCDQuNC70Lgg0L/RgNC+0YHRgtGL0LxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINC+0LHRitC10LrRgtC+0LwuXG4gKiBAcGFyYW0gIHttb2R1bGU6XCJ2Ni5qc1wiLkFic3RyYWN0UmVuZGVyZXJ9IHJlbmRlcmVyIGBSZW5kZXJlckdMYCDQuNC70LggYFJlbmRlcmVyMkRgINC90YPQttC90Ysg0LTQu9GPXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDRg9GB0YLQsNC90L7QstC60LggX3N0cm9rZUNvbG9yLCBfZmlsbENvbG9yLlxuICogQHJldHVybiB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIgYHRhcmdldGAuXG4gKi9cbmZ1bmN0aW9uIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3MgKCB0YXJnZXQsIHJlbmRlcmVyIClcbntcblxuICBjb3B5RHJhd2luZ1NldHRpbmdzKCB0YXJnZXQsIGRlZmF1bHREcmF3aW5nU2V0dGluZ3MgKTtcblxuICB0YXJnZXQuX3N0cm9rZUNvbG9yID0gbmV3IHJlbmRlcmVyLnNldHRpbmdzLmNvbG9yKCk7XG4gIHRhcmdldC5fZmlsbENvbG9yICAgPSBuZXcgcmVuZGVyZXIuc2V0dGluZ3MuY29sb3IoKTtcblxuICByZXR1cm4gdGFyZ2V0O1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbG9yID0gcmVxdWlyZSggJy4uL2NvbG9yL1JHQkEnICk7XG52YXIgdHlwZSAgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApLmdldCggJzJEJyApO1xuXG4vKipcbiAqINCd0LDRgdGC0YDQvtC50LrQuCDQtNC70Y8g0YDQtdC90LTQtdGA0LXRgNC+0LI6IHtAbGluayB2Ni5SZW5kZXJlcjJEfSwge0BsaW5rIHY2LlJlbmRlcmVyR0x9LCB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlcn0sIHtAbGluayB2Ni5jcmVhdGVSZW5kZXJlcn0uXG4gKiBAbmFtZXNwYWNlIHY2LnNldHRpbmdzLnJlbmRlcmVyXG4gKi9cblxuLyoqXG4gKiBAbWVtYmVyICAge29iamVjdH0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLnNldHRpbmdzXSDQndCw0YHRgtGA0L7QudC60Lgg0YDQtdC90LTQtdGA0LXRgNCwINC/0L4g0YPQvNC+0LvRh9Cw0L3QuNGOLlxuICogQHByb3BlcnR5IHtvYmplY3R9IFtjb2xvcj17QGxpbmsgdjYuUkdCQX1dICAgICAgICAg0JrQvtC90YHRgtGA0YPQutGC0L7RgNGLIHtAbGluayB2Ni5SR0JBfSDQuNC70Lgge0BsaW5rIHY2LkhTTEF9LlxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzY2FsZT0xXSAgICAgICAgICAgICAgICAgICAgICAg0J/Qu9C+0YLQvdC+0YHRgtGMINC/0LjQutGB0LXQu9C10Lkg0YDQtdC90LTQtdGA0LXRgNCwLCDQvdCw0L/RgNC40LzQtdGAOiBgZGV2aWNlUGl4ZWxSYXRpb2AuXG4gKi9cbmV4cG9ydHMuc2V0dGluZ3MgPSB7XG4gIGNvbG9yOiBjb2xvcixcbiAgc2NhbGU6IDFcbn07XG5cbi8qKlxuICog0J/QvtC60LAg0L3QtSDRgdC00LXQu9Cw0L3Qvi5cbiAqIEBtZW1iZXIge2Jvb2xlYW59IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5hbnRpYWxpYXM9dHJ1ZV1cbiAqL1xuZXhwb3J0cy5hbnRpYWxpYXMgPSB0cnVlO1xuXG4vKipcbiAqINCf0L7QutCwINC90LUg0YHQtNC10LvQsNC90L4uXG4gKiBAbWVtYmVyIHtib29sZWFufSBbdjYuc2V0dGluZ3MucmVuZGVyZXIuYmxlbmRpbmc9dHJ1ZV1cbiAqL1xuZXhwb3J0cy5ibGVuZGluZyA9IHRydWU7XG5cbi8qKlxuICog0JjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMINCz0YDQsNC00YPRgdGLINCy0LzQtdGB0YLQviDRgNCw0LTQuNCw0L3QvtCyLlxuICogQG1lbWJlciB7Ym9vbGVhbn0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLmRlZ3JlZXM9ZmFsc2VdXG4gKi9cbmV4cG9ydHMuZGVncmVlcyA9IGZhbHNlO1xuXG4vKipcbiAqINCY0YHQv9C+0LvRjNC30L7QstCw0YLRjCDQv9GA0L7Qt9GA0LDRh9C90YvQuSAo0LLQvNC10YHRgtC+INGH0LXRgNC90L7Qs9C+KSDQutC+0L3RgtC10LrRgdGCLlxuICogQG1lbWJlciB7Ym9vbGVhbn0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLmFscGhhPXRydWVdXG4gKi9cbmV4cG9ydHMuYWxwaGEgPSB0cnVlO1xuXG4vKipcbiAqINCi0LjQvyDQutC+0L3RgtC10LrRgdGC0LAgKDJELCBHTCwgQVVUTykuXG4gKiBAbWVtYmVyIHtjb25zdGFudH0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLnR5cGU9MkRdXG4gKi9cbmV4cG9ydHMudHlwZSA9IHR5cGU7XG5cbi8qKlxuICog0JIg0Y3RgtC+0YIg0Y3Qu9C10LzQtdC90YIg0LHRg9C00LXRgiDQtNC+0LHQsNCy0LvQtdC9IGBjYW52YXNgLlxuICogQG1lbWJlciB7RWxlbWVudD99IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5hcHBlbmRUb11cbiAqL1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBtZW1iZXIgdjYuc2hhcGVzLmRyYXdMaW5lc1xuICogQGV4YW1wbGVcbiAqIHNoYXBlcy5kcmF3TGluZXMoIHJlbmRlcmVyLCB2ZXJ0aWNlcyApO1xuICovXG5mdW5jdGlvbiBkcmF3TGluZXMgKClcbntcbiAgdGhyb3cgRXJyb3IoICdOb3QgaW1wbGVtZW50ZWQnICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZHJhd0xpbmVzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBtZW1iZXIgdjYuc2hhcGVzLmRyYXdQb2ludHNcbiAqIEBleGFtcGxlXG4gKiBzaGFwZXMuZHJhd1BvaW50cyggcmVuZGVyZXIsIHZlcnRpY2VzICk7XG4gKi9cbmZ1bmN0aW9uIGRyYXdQb2ludHMgKClcbntcbiAgdGhyb3cgRXJyb3IoICdOb3QgaW1wbGVtZW50ZWQnICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZHJhd1BvaW50cztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQk9C70LDQstC90YvQtSDQvdCw0YHRgtGA0L7QudC60LggXCJ2Ni5qc1wiLlxuICogQG5hbWVzcGFjZSB2Ni5zZXR0aW5ncy5jb3JlXG4gKi9cblxuLyoqXG4gKiDQmNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNCw0LTRg9GB0Ysg0LLQvNC10YHRgtC+INGA0LDQtNC40LDQvdC+0LIuXG4gKiBAbWVtYmVyIHtib29sZWFufSB2Ni5zZXR0aW5ncy5jb3JlLmRlZ3JlZXNcbiAqL1xuZXhwb3J0cy5kZWdyZXNzID0gZmFsc2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQGludGVyZmFjZSBJU2hhZGVyU291cmNlc1xuICogQHByb3BlcnR5IHtzdHJpbmd9IHZlcnQg0JjRgdGF0L7QtNC90LjQuiDQstC10YDRiNC40L3QvdC+0LPQviAodmVydGV4KSDRiNC10LnQtNC10YDQsC5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBmcmFnINCY0YHRhdC+0LTQvdC40Log0YTRgNCw0LPQvNC10L3RgtC90L7Qs9C+IChmcmFnbWVudCkg0YjQtdC50LTQtdGA0LAuXG4gKi9cblxuLyoqXG4gKiBXZWJHTCDRiNC10LnQtNC10YDRiy5cbiAqIEBtZW1iZXIge29iamVjdH0gdjYuc2hhZGVyc1xuICogQHByb3BlcnR5IHtJU2hhZGVyU291cmNlc30gYmFzaWMgICAgICDQodGC0LDQvdC00LDRgNGC0L3Ri9C1INGI0LXQudC00LXRgNGLLlxuICogQHByb3BlcnR5IHtJU2hhZGVyU291cmNlc30gYmFja2dyb3VuZCDQqNC10LnQtNC10YDRiyDQtNC70Y8g0L7RgtGA0LjRgdC+0LLQutC4INGE0L7QvdCwLlxuICovXG52YXIgc2hhZGVycyA9IHtcbiAgYmFzaWM6IHtcbiAgICB2ZXJ0OiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7YXR0cmlidXRlIHZlYzIgYXBvczt1bmlmb3JtIHZlYzIgdXJlczt1bmlmb3JtIG1hdDMgdXRyYW5zZm9ybTt2b2lkIG1haW4oKXtnbF9Qb3NpdGlvbj12ZWM0KCgodXRyYW5zZm9ybSp2ZWMzKGFwb3MsMS4wKSkueHkvdXJlcyoyLjAtMS4wKSp2ZWMyKDEsLTEpLDAsMSk7fScsXG4gICAgZnJhZzogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O3VuaWZvcm0gdmVjNCB1Y29sb3I7dm9pZCBtYWluKCl7Z2xfRnJhZ0NvbG9yPXZlYzQodWNvbG9yLnJnYi8yNTUuMCx1Y29sb3IuYSk7fSdcbiAgfSxcblxuICBiYWNrZ3JvdW5kOiB7XG4gICAgdmVydDogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O2F0dHJpYnV0ZSB2ZWMyIGFwb3M7dm9pZCBtYWluKCl7Z2xfUG9zaXRpb24gPSB2ZWM0KGFwb3MsMCwxKTt9JyxcbiAgICBmcmFnOiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7dW5pZm9ybSB2ZWM0IHVjb2xvcjt2b2lkIG1haW4oKXtnbF9GcmFnQ29sb3I9dWNvbG9yO30nXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2hhZGVycztcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3LTIwMTggVmxhZGlzbGF2IFRpa2hpeSAoU0lMRU5UKVxuICogUmVsZWFzZWQgdW5kZXIgdGhlIEdQTC0zLjAgbGljZW5zZS5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS90aWtoaXkvdjYuanMvdHJlZS9kZXYvXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgdjZcbiAqL1xuXG5leHBvcnRzLkFic3RyYWN0SW1hZ2UgICAgPSByZXF1aXJlKCAnLi9jb3JlL2ltYWdlL0Fic3RyYWN0SW1hZ2UnICk7XG5leHBvcnRzLkFic3RyYWN0UmVuZGVyZXIgPSByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL0Fic3RyYWN0UmVuZGVyZXInICk7XG5leHBvcnRzLkFic3RyYWN0VmVjdG9yICAgPSByZXF1aXJlKCAnLi9jb3JlL21hdGgvQWJzdHJhY3RWZWN0b3InICk7XG5leHBvcnRzLkNhbWVyYSAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2NhbWVyYS9DYW1lcmEnICk7XG5leHBvcnRzLkNvbXBvdW5kZWRJbWFnZSAgPSByZXF1aXJlKCAnLi9jb3JlL2ltYWdlL0NvbXBvdW5kZWRJbWFnZScgKTtcbmV4cG9ydHMuSFNMQSAgICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvY29sb3IvSFNMQScgKTtcbmV4cG9ydHMuSW1hZ2UgICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvaW1hZ2UvSW1hZ2UnICk7XG5leHBvcnRzLlJHQkEgICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2NvbG9yL1JHQkEnICk7XG5leHBvcnRzLlJlbmRlcmVyMkQgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyMkQnICk7XG5leHBvcnRzLlJlbmRlcmVyR0wgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyR0wnICk7XG5leHBvcnRzLlNoYWRlclByb2dyYW0gICAgPSByZXF1aXJlKCAnLi9jb3JlL1NoYWRlclByb2dyYW0nICk7XG5leHBvcnRzLlRpY2tlciAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL1RpY2tlcicgKTtcbmV4cG9ydHMuVHJhbnNmb3JtICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvVHJhbnNmb3JtJyApO1xuZXhwb3J0cy5WZWN0b3IyRCAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9tYXRoL1ZlY3RvcjJEJyApO1xuZXhwb3J0cy5WZWN0b3IzRCAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9tYXRoL1ZlY3RvcjNEJyApO1xuZXhwb3J0cy5jb25zdGFudHMgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9jb25zdGFudHMnICk7XG5leHBvcnRzLmNyZWF0ZVJlbmRlcmVyICAgPSByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL2NyZWF0ZV9yZW5kZXJlcicgKTtcbmV4cG9ydHMuc2hhZGVycyAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvc2hhZGVycycgKTtcbmV4cG9ydHMubWF0MyAgICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvbWF0aC9tYXQzJyApO1xuXG4vKipcbiAqIFwidjYuanNcIiBidWlsdC1pbiBkcmF3aW5nIGZ1bmN0aW9ucy5cbiAqIEBuYW1lc3BhY2UgdjYuc2hhcGVzXG4gKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gKiBAZXhhbXBsZVxuICogdmFyIHNoYXBlcyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL3NoYXBlcycgKTtcbiAqIEBleGFtcGxlXG4gKiByZW5kZXJlci5iZWdpblNoYXBlKCB7XG4gKiAgIGRyYXdGdW5jdGlvbjogc2hhcGVzLmRyYXdQb2ludHNcbiAqIH0gKTtcbiAqL1xuZXhwb3J0cy5zaGFwZXMgPSB7XG4gIGRyYXdQb2ludHM6IHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXIvc2hhcGVzL2RyYXdfcG9pbnRzJyApLFxuICBkcmF3TGluZXM6ICByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL3NoYXBlcy9kcmF3X2xpbmVzJyApXG59O1xuXG4vKipcbiAqINCd0LDRgdGC0YDQvtC50LrQuCBcInY2LmpzXCIuXG4gKiBAbmFtZXNwYWNlIHY2LnNldHRpbmdzXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5Db3JlIFNldHRpbmdzPC9jYXB0aW9uPlxuICogdmFyIHNldHRpbmdzID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvc2V0dGluZ3MnICk7XG4gKiBzZXR0aW5ncy5kZWdyZWVzID0gdHJ1ZTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlJlbmRlcmVyIFNldHRpbmdzPC9jYXB0aW9uPlxuICogLy8gRGVmYXVsdCByZW5kZXJlciBzZXR0aW5ncy5cbiAqIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL3NldHRpbmdzJyApO1xuICogc2V0dGluZ3MuZGVncmVlcyA9IHRydWU7XG4gKi9cbmV4cG9ydHMuc2V0dGluZ3MgPSB7XG4gIHJlbmRlcmVyOiByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL3NldHRpbmdzJyApLFxuICBjYW1lcmE6ICAgcmVxdWlyZSggJy4vY29yZS9jYW1lcmEvc2V0dGluZ3MnICksXG4gIGNvcmU6ICAgICByZXF1aXJlKCAnLi9jb3JlL3NldHRpbmdzJyApXG59O1xuXG5pZiAoIHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyApIHtcbiAgc2VsZi52NiA9IGV4cG9ydHM7XG59XG5cbi8qKlxuICogQHR5cGVkZWYge3N0cmluZ3x2Ni5IU0xBfHY2LlJHQkF9IFRDb2xvclxuICogQGV4YW1wbGUgPGNhcHRpb24+QSBzdHJpbmcgKENTUyBjb2xvcikuPC9jYXB0aW9uPlxuICogdmFyIGNvbG9yID0gJ3JnYmEoIDI1NSwgMCwgMjU1LCAxICknO1xuICogdmFyIGNvbG9yID0gJ2hzbCggMzYwLCAxMDAlLCA1MCUgKSc7XG4gKiB2YXIgY29sb3IgPSAnI2ZmMDBmZic7XG4gKiB2YXIgY29sb3IgPSAnbGlnaHRwaW5rJztcbiAqIC8vIFwicmdiYSgwLCAwLCAwLCAwKVwiXG4gKiB2YXIgY29sb3IgPSBnZXRDb21wdXRlZFN0eWxlKCBkb2N1bWVudC5ib2R5ICkuZ2V0UHJvcGVydHlWYWx1ZSggJ2JhY2tncm91bmQtY29sb3InICk7XG4gKiAvLyBUaGUgc2FtZSBhcyBcInRyYW5zcGFyZW50XCIuXG4gKiAvLyBOT1RFOiBDU1MgZG9lcyBub3Qgc3VwcG9ydCB0aGlzIHN5bnRheCBidXQgXCJ2Ni5qc1wiIGRvZXMuXG4gKiB2YXIgY29sb3IgPSAnIzAwMDAwMDAwJztcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkFuIG9iamVjdCAodjYuUkdCQSwgdjYuSFNMQSk8L2NhcHRpb24+XG4gKiB2YXIgY29sb3IgPSBuZXcgUkdCQSggMjU1LCAwLCAyNTUsIDEgKTtcbiAqIHZhciBjb2xvciA9IG5ldyBIU0xBKCAzNjAsIDEwMCwgNTAgKTtcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtudW1iZXJ9IGNvbnN0YW50XG4gKiBAc2VlIHY2LmNvbnN0YW50c1xuICogQGV4YW1wbGVcbiAqIC8vIFRoaXMgaXMgYSBjb25zdGFudC5cbiAqIHZhciBSRU5ERVJFUl9UWVBFID0gY29uc3RhbnRzLmdldCggJ0dMJyApO1xuICovXG5cbi8qKlxuICogQGludGVyZmFjZSBJVmVjdG9yMkRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4XG4gKiBAcHJvcGVydHkge251bWJlcn0geVxuICovXG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQSBsaWdodHdlaWdodCBpbXBsZW1lbnRhdGlvbiBvZiBOb2RlLmpzIEV2ZW50RW1pdHRlci5cbiAqIEBjb25zdHJ1Y3RvciBMaWdodEVtaXR0ZXJcbiAqIEBleGFtcGxlXG4gKiB2YXIgTGlnaHRFbWl0dGVyID0gcmVxdWlyZSggJ2xpZ2h0X2VtaXR0ZXInICk7XG4gKi9cbmZ1bmN0aW9uIExpZ2h0RW1pdHRlciAoKSB7fVxuXG5MaWdodEVtaXR0ZXIucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogQG1ldGhvZCBMaWdodEVtaXR0ZXIjZW1pdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICAgKiBAcGFyYW0gey4uLmFueX0gW2RhdGFdXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGVtaXQ6IGZ1bmN0aW9uIGVtaXQgKCB0eXBlICkge1xuICAgIHZhciBsaXN0ID0gX2dldExpc3QoIHRoaXMsIHR5cGUgKTtcbiAgICB2YXIgZGF0YSwgaSwgbDtcblxuICAgIGlmICggISBsaXN0ICkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID4gMSApIHtcbiAgICAgIGRhdGEgPSBbXS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDEgKTtcbiAgICB9XG5cbiAgICBmb3IgKCBpID0gMCwgbCA9IGxpc3QubGVuZ3RoOyBpIDwgbDsgKytpICkge1xuICAgICAgaWYgKCAhIGxpc3RbIGkgXS5hY3RpdmUgKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIGxpc3RbIGkgXS5vbmNlICkge1xuICAgICAgICBsaXN0WyBpIF0uYWN0aXZlID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICggZGF0YSApIHtcbiAgICAgICAgbGlzdFsgaSBdLmxpc3RlbmVyLmFwcGx5KCB0aGlzLCBkYXRhICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaXN0WyBpIF0ubGlzdGVuZXIuY2FsbCggdGhpcyApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIExpZ2h0RW1pdHRlciNvZmZcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgW3R5cGVdXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtsaXN0ZW5lcl1cbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb2ZmOiBmdW5jdGlvbiBvZmYgKCB0eXBlLCBsaXN0ZW5lciApIHtcbiAgICB2YXIgbGlzdCwgaTtcblxuICAgIGlmICggISB0eXBlICkge1xuICAgICAgdGhpcy5fZXZlbnRzID0gbnVsbDtcbiAgICB9IGVsc2UgaWYgKCAoIGxpc3QgPSBfZ2V0TGlzdCggdGhpcywgdHlwZSApICkgKSB7XG4gICAgICBpZiAoIGxpc3RlbmVyICkge1xuICAgICAgICBmb3IgKCBpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgICAgICBpZiAoIGxpc3RbIGkgXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIgJiYgbGlzdFsgaSBdLmFjdGl2ZSApIHtcbiAgICAgICAgICAgIGxpc3RbIGkgXS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBMaWdodEVtaXR0ZXIjb25cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgdHlwZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaXN0ZW5lclxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBvbjogZnVuY3Rpb24gb24gKCB0eXBlLCBsaXN0ZW5lciApIHtcbiAgICBfb24oIHRoaXMsIHR5cGUsIGxpc3RlbmVyICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI29uY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgdHlwZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaXN0ZW5lclxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBvbmNlOiBmdW5jdGlvbiBvbmNlICggdHlwZSwgbGlzdGVuZXIgKSB7XG4gICAgX29uKCB0aGlzLCB0eXBlLCBsaXN0ZW5lciwgdHJ1ZSApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBMaWdodEVtaXR0ZXJcbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgX29uXG4gKiBAcGFyYW0gIHtMaWdodEVtaXR0ZXJ9IHNlbGZcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgdHlwZVxuICogQHBhcmFtICB7ZnVuY3Rpb259ICAgICBsaXN0ZW5lclxuICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBvbmNlXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfb24gKCBzZWxmLCB0eXBlLCBsaXN0ZW5lciwgb25jZSApIHtcbiAgdmFyIGVudGl0eSA9IHtcbiAgICBsaXN0ZW5lcjogbGlzdGVuZXIsXG4gICAgYWN0aXZlOiAgIHRydWUsXG4gICAgdHlwZTogICAgIHR5cGUsXG4gICAgb25jZTogICAgIG9uY2VcbiAgfTtcblxuICBpZiAoICEgc2VsZi5fZXZlbnRzICkge1xuICAgIHNlbGYuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUoIG51bGwgKTtcbiAgfVxuXG4gIGlmICggISBzZWxmLl9ldmVudHNbIHR5cGUgXSApIHtcbiAgICBzZWxmLl9ldmVudHNbIHR5cGUgXSA9IFtdO1xuICB9XG5cbiAgc2VsZi5fZXZlbnRzWyB0eXBlIF0ucHVzaCggZW50aXR5ICk7XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgX2dldExpc3RcbiAqIEBwYXJhbSAge0xpZ2h0RW1pdHRlcn0gICBzZWxmXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgdHlwZVxuICogQHJldHVybiB7YXJyYXk8b2JqZWN0Pj99XG4gKi9cbmZ1bmN0aW9uIF9nZXRMaXN0ICggc2VsZiwgdHlwZSApIHtcbiAgcmV0dXJuIHNlbGYuX2V2ZW50cyAmJiBzZWxmLl9ldmVudHNbIHR5cGUgXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMaWdodEVtaXR0ZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX3Rocm93QXJndW1lbnRFeGNlcHRpb24gKCB1bmV4cGVjdGVkLCBleHBlY3RlZCApIHtcbiAgdGhyb3cgRXJyb3IoICdcIicgKyB0b1N0cmluZy5jYWxsKCB1bmV4cGVjdGVkICkgKyAnXCIgaXMgbm90ICcgKyBleHBlY3RlZCApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHR5cGUgPSByZXF1aXJlKCAnLi90eXBlJyApO1xudmFyIGxhc3RSZXMgPSAndW5kZWZpbmVkJztcbnZhciBsYXN0VmFsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF90eXBlICggdmFsICkge1xuICBpZiAoIHZhbCA9PT0gbGFzdFZhbCApIHtcbiAgICByZXR1cm4gbGFzdFJlcztcbiAgfVxuXG4gIHJldHVybiAoIGxhc3RSZXMgPSB0eXBlKCBsYXN0VmFsID0gdmFsICkgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX3VuZXNjYXBlICggc3RyaW5nICkge1xuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoIC9cXFxcKFxcXFwpPy9nLCAnJDEnICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNzZXQgPSByZXF1aXJlKCAnLi4vaXNzZXQnICk7XG5cbnZhciB1bmRlZmluZWQ7IC8vIGpzaGludCBpZ25vcmU6IGxpbmVcblxudmFyIGRlZmluZUdldHRlciA9IE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVHZXR0ZXJfXyxcbiAgICBkZWZpbmVTZXR0ZXIgPSBPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lU2V0dGVyX187XG5cbmZ1bmN0aW9uIGJhc2VEZWZpbmVQcm9wZXJ0eSAoIG9iamVjdCwga2V5LCBkZXNjcmlwdG9yICkge1xuICB2YXIgaGFzR2V0dGVyID0gaXNzZXQoICdnZXQnLCBkZXNjcmlwdG9yICksXG4gICAgICBoYXNTZXR0ZXIgPSBpc3NldCggJ3NldCcsIGRlc2NyaXB0b3IgKSxcbiAgICAgIGdldCwgc2V0O1xuXG4gIGlmICggaGFzR2V0dGVyIHx8IGhhc1NldHRlciApIHtcbiAgICBpZiAoIGhhc0dldHRlciAmJiB0eXBlb2YgKCBnZXQgPSBkZXNjcmlwdG9yLmdldCApICE9PSAnZnVuY3Rpb24nICkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnR2V0dGVyIG11c3QgYmUgYSBmdW5jdGlvbjogJyArIGdldCApO1xuICAgIH1cblxuICAgIGlmICggaGFzU2V0dGVyICYmIHR5cGVvZiAoIHNldCA9IGRlc2NyaXB0b3Iuc2V0ICkgIT09ICdmdW5jdGlvbicgKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoICdTZXR0ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uOiAnICsgc2V0ICk7XG4gICAgfVxuXG4gICAgaWYgKCBpc3NldCggJ3dyaXRhYmxlJywgZGVzY3JpcHRvciApICkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnSW52YWxpZCBwcm9wZXJ0eSBkZXNjcmlwdG9yLiBDYW5ub3QgYm90aCBzcGVjaWZ5IGFjY2Vzc29ycyBhbmQgYSB2YWx1ZSBvciB3cml0YWJsZSBhdHRyaWJ1dGUnICk7XG4gICAgfVxuXG4gICAgaWYgKCBkZWZpbmVHZXR0ZXIgKSB7XG4gICAgICBpZiAoIGhhc0dldHRlciApIHtcbiAgICAgICAgZGVmaW5lR2V0dGVyLmNhbGwoIG9iamVjdCwga2V5LCBnZXQgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCBoYXNTZXR0ZXIgKSB7XG4gICAgICAgIGRlZmluZVNldHRlci5jYWxsKCBvYmplY3QsIGtleSwgc2V0ICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKCAnQ2Fubm90IGRlZmluZSBnZXR0ZXIgb3Igc2V0dGVyJyApO1xuICAgIH1cbiAgfSBlbHNlIGlmICggaXNzZXQoICd2YWx1ZScsIGRlc2NyaXB0b3IgKSApIHtcbiAgICBvYmplY3RbIGtleSBdID0gZGVzY3JpcHRvci52YWx1ZTtcbiAgfSBlbHNlIGlmICggISBpc3NldCgga2V5LCBvYmplY3QgKSApIHtcbiAgICBvYmplY3RbIGtleSBdID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRGVmaW5lUHJvcGVydHk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZUV4ZWMgKCByZWdleHAsIHN0cmluZyApIHtcbiAgdmFyIHJlc3VsdCA9IFtdLFxuICAgICAgdmFsdWU7XG5cbiAgcmVnZXhwLmxhc3RJbmRleCA9IDA7XG5cbiAgd2hpbGUgKCAoIHZhbHVlID0gcmVnZXhwLmV4ZWMoIHN0cmluZyApICkgKSB7XG4gICAgcmVzdWx0LnB1c2goIHZhbHVlICk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNhbGxJdGVyYXRlZSA9IHJlcXVpcmUoICcuLi9jYWxsLWl0ZXJhdGVlJyApLFxuICAgIGlzc2V0ICAgICAgICA9IHJlcXVpcmUoICcuLi9pc3NldCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlRm9yRWFjaCAoIGFyciwgZm4sIGN0eCwgZnJvbVJpZ2h0ICkge1xuICB2YXIgaSwgaiwgaWR4O1xuXG4gIGZvciAoIGkgPSAtMSwgaiA9IGFyci5sZW5ndGggLSAxOyBqID49IDA7IC0taiApIHtcbiAgICBpZiAoIGZyb21SaWdodCApIHtcbiAgICAgIGlkeCA9IGo7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlkeCA9ICsraTtcbiAgICB9XG5cbiAgICBpZiAoIGlzc2V0KCBpZHgsIGFyciApICYmIGNhbGxJdGVyYXRlZSggZm4sIGN0eCwgYXJyWyBpZHggXSwgaWR4LCBhcnIgKSA9PT0gZmFsc2UgKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXJyO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNhbGxJdGVyYXRlZSA9IHJlcXVpcmUoICcuLi9jYWxsLWl0ZXJhdGVlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VGb3JJbiAoIG9iaiwgZm4sIGN0eCwgZnJvbVJpZ2h0LCBrZXlzICkge1xuICB2YXIgaSwgaiwga2V5O1xuXG4gIGZvciAoIGkgPSAtMSwgaiA9IGtleXMubGVuZ3RoIC0gMTsgaiA+PSAwOyAtLWogKSB7XG4gICAgaWYgKCBmcm9tUmlnaHQgKSB7XG4gICAgICBrZXkgPSBrZXlzWyBqIF07XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleSA9IGtleXNbICsraSBdO1xuICAgIH1cblxuICAgIGlmICggY2FsbEl0ZXJhdGVlKCBmbiwgY3R4LCBvYmpbIGtleSBdLCBrZXksIG9iaiApID09PSBmYWxzZSApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNzZXQgPSByZXF1aXJlKCAnLi4vaXNzZXQnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZUdldCAoIG9iaiwgcGF0aCwgb2ZmICkge1xuICB2YXIgbCA9IHBhdGgubGVuZ3RoIC0gb2ZmLFxuICAgICAgaSA9IDAsXG4gICAgICBrZXk7XG5cbiAgZm9yICggOyBpIDwgbDsgKytpICkge1xuICAgIGtleSA9IHBhdGhbIGkgXTtcblxuICAgIGlmICggaXNzZXQoIGtleSwgb2JqICkgKSB7XG4gICAgICBvYmogPSBvYmpbIGtleSBdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiYXNlVG9JbmRleCA9IHJlcXVpcmUoICcuL2Jhc2UtdG8taW5kZXgnICk7XG5cbnZhciBpbmRleE9mICAgICA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mLFxuICAgIGxhc3RJbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mO1xuXG5mdW5jdGlvbiBiYXNlSW5kZXhPZiAoIGFyciwgc2VhcmNoLCBmcm9tSW5kZXgsIGZyb21SaWdodCApIHtcbiAgdmFyIGwsIGksIGosIGlkeCwgdmFsO1xuXG4gIC8vIHVzZSB0aGUgbmF0aXZlIGZ1bmN0aW9uIGlmIGl0IGlzIHN1cHBvcnRlZCBhbmQgdGhlIHNlYXJjaCBpcyBub3QgbmFuLlxuXG4gIGlmICggc2VhcmNoID09PSBzZWFyY2ggJiYgKCBpZHggPSBmcm9tUmlnaHQgPyBsYXN0SW5kZXhPZiA6IGluZGV4T2YgKSApIHtcbiAgICByZXR1cm4gaWR4LmNhbGwoIGFyciwgc2VhcmNoLCBmcm9tSW5kZXggKTtcbiAgfVxuXG4gIGwgPSBhcnIubGVuZ3RoO1xuXG4gIGlmICggISBsICkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIGogPSBsIC0gMTtcblxuICBpZiAoIHR5cGVvZiBmcm9tSW5kZXggIT09ICd1bmRlZmluZWQnICkge1xuICAgIGZyb21JbmRleCA9IGJhc2VUb0luZGV4KCBmcm9tSW5kZXgsIGwgKTtcblxuICAgIGlmICggZnJvbVJpZ2h0ICkge1xuICAgICAgaiA9IE1hdGgubWluKCBqLCBmcm9tSW5kZXggKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaiA9IE1hdGgubWF4KCAwLCBmcm9tSW5kZXggKTtcbiAgICB9XG5cbiAgICBpID0gaiAtIDE7XG4gIH0gZWxzZSB7XG4gICAgaSA9IC0xO1xuICB9XG5cbiAgZm9yICggOyBqID49IDA7IC0taiApIHtcbiAgICBpZiAoIGZyb21SaWdodCApIHtcbiAgICAgIGlkeCA9IGo7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlkeCA9ICsraTtcbiAgICB9XG5cbiAgICB2YWwgPSBhcnJbIGlkeCBdO1xuXG4gICAgaWYgKCB2YWwgPT09IHNlYXJjaCB8fCBzZWFyY2ggIT09IHNlYXJjaCAmJiB2YWwgIT09IHZhbCApIHtcbiAgICAgIHJldHVybiBpZHg7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJbmRleE9mO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmFzZUluZGV4T2YgPSByZXF1aXJlKCAnLi9iYXNlLWluZGV4LW9mJyApO1xuXG52YXIgc3VwcG9ydCA9IHJlcXVpcmUoICcuLi9zdXBwb3J0L3N1cHBvcnQta2V5cycgKTtcblxudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxudmFyIGssIGZpeEtleXM7XG5cbmlmICggc3VwcG9ydCA9PT0gJ25vdC1zdXBwb3J0ZWQnICkge1xuICBrID0gW1xuICAgICd0b1N0cmluZycsXG4gICAgJ3RvTG9jYWxlU3RyaW5nJyxcbiAgICAndmFsdWVPZicsXG4gICAgJ2hhc093blByb3BlcnR5JyxcbiAgICAnaXNQcm90b3R5cGVPZicsXG4gICAgJ3Byb3BlcnR5SXNFbnVtZXJhYmxlJyxcbiAgICAnY29uc3RydWN0b3InXG4gIF07XG5cbiAgZml4S2V5cyA9IGZ1bmN0aW9uIGZpeEtleXMgKCBrZXlzLCBvYmplY3QgKSB7XG4gICAgdmFyIGksIGtleTtcblxuICAgIGZvciAoIGkgPSBrLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgaWYgKCBiYXNlSW5kZXhPZigga2V5cywga2V5ID0ga1sgaSBdICkgPCAwICYmIGhhc093blByb3BlcnR5LmNhbGwoIG9iamVjdCwga2V5ICkgKSB7XG4gICAgICAgIGtleXMucHVzaCgga2V5ICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZUtleXMgKCBvYmplY3QgKSB7XG4gIHZhciBrZXlzID0gW107XG5cbiAgdmFyIGtleTtcblxuICBmb3IgKCBrZXkgaW4gb2JqZWN0ICkge1xuICAgIGlmICggaGFzT3duUHJvcGVydHkuY2FsbCggb2JqZWN0LCBrZXkgKSApIHtcbiAgICAgIGtleXMucHVzaCgga2V5ICk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCBzdXBwb3J0ICE9PSAnbm90LXN1cHBvcnRlZCcgKSB7XG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICByZXR1cm4gZml4S2V5cygga2V5cywgb2JqZWN0ICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0ID0gcmVxdWlyZSggJy4vYmFzZS1nZXQnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZVByb3BlcnR5ICggb2JqZWN0LCBwYXRoICkge1xuICBpZiAoIG9iamVjdCAhPSBudWxsICkge1xuICAgIGlmICggcGF0aC5sZW5ndGggPiAxICkge1xuICAgICAgcmV0dXJuIGdldCggb2JqZWN0LCBwYXRoLCAwICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iamVjdFsgcGF0aFsgMCBdIF07XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZVRvSW5kZXggKCB2LCBsICkge1xuICBpZiAoICEgbCB8fCAhIHYgKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBpZiAoIHYgPCAwICkge1xuICAgIHYgKz0gbDtcbiAgfVxuXG4gIHJldHVybiB2IHx8IDA7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3Rocm93QXJndW1lbnRFeGNlcHRpb24gPSByZXF1aXJlKCAnLi9fdGhyb3ctYXJndW1lbnQtZXhjZXB0aW9uJyApO1xudmFyIGRlZmF1bHRUbyA9IHJlcXVpcmUoICcuL2RlZmF1bHQtdG8nICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmVmb3JlICggbiwgZm4gKSB7XG4gIHZhciB2YWx1ZTtcblxuICBpZiAoIHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICBfdGhyb3dBcmd1bWVudEV4Y2VwdGlvbiggZm4sICdhIGZ1bmN0aW9uJyApO1xuICB9XG5cbiAgbiA9IGRlZmF1bHRUbyggbiwgMSApO1xuXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCAtLW4gPj0gMCApIHtcbiAgICAgIHZhbHVlID0gZm4uYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2FsbEl0ZXJhdGVlICggZm4sIGN0eCwgdmFsLCBrZXksIG9iaiApIHtcbiAgaWYgKCB0eXBlb2YgY3R4ID09PSAndW5kZWZpbmVkJyApIHtcbiAgICByZXR1cm4gZm4oIHZhbCwga2V5LCBvYmogKTtcbiAgfVxuXG4gIHJldHVybiBmbi5jYWxsKCBjdHgsIHZhbCwga2V5LCBvYmogKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiYXNlRXhlYyAgPSByZXF1aXJlKCAnLi9iYXNlL2Jhc2UtZXhlYycgKSxcbiAgICBfdW5lc2NhcGUgPSByZXF1aXJlKCAnLi9fdW5lc2NhcGUnICksXG4gICAgaXNLZXkgICAgID0gcmVxdWlyZSggJy4vaXMta2V5JyApLFxuICAgIHRvS2V5ICAgICA9IHJlcXVpcmUoICcuL3RvLWtleScgKSxcbiAgICBfdHlwZSAgICAgPSByZXF1aXJlKCAnLi9fdHlwZScgKTtcblxudmFyIHJQcm9wZXJ0eSA9IC8oXnxcXC4pXFxzKihbX2Etel1cXHcqKVxccyp8XFxbXFxzKigoPzotKT8oPzpcXGQrfFxcZCpcXC5cXGQrKXwoXCJ8JykoKFteXFxcXF1cXFxcKFxcXFxcXFxcKSp8W15cXDRdKSopXFw0KVxccypcXF0vZ2k7XG5cbmZ1bmN0aW9uIHN0cmluZ1RvUGF0aCAoIHN0ciApIHtcbiAgdmFyIHBhdGggPSBiYXNlRXhlYyggclByb3BlcnR5LCBzdHIgKSxcbiAgICAgIGkgPSBwYXRoLmxlbmd0aCAtIDEsXG4gICAgICB2YWw7XG5cbiAgZm9yICggOyBpID49IDA7IC0taSApIHtcbiAgICB2YWwgPSBwYXRoWyBpIF07XG5cbiAgICAvLyAubmFtZVxuICAgIGlmICggdmFsWyAyIF0gKSB7XG4gICAgICBwYXRoWyBpIF0gPSB2YWxbIDIgXTtcbiAgICAvLyBbIFwiXCIgXSB8fCBbICcnIF1cbiAgICB9IGVsc2UgaWYgKCB2YWxbIDUgXSAhPSBudWxsICkge1xuICAgICAgcGF0aFsgaSBdID0gX3VuZXNjYXBlKCB2YWxbIDUgXSApO1xuICAgIC8vIFsgMCBdXG4gICAgfSBlbHNlIHtcbiAgICAgIHBhdGhbIGkgXSA9IHZhbFsgMyBdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXRoO1xufVxuXG5mdW5jdGlvbiBjYXN0UGF0aCAoIHZhbCApIHtcbiAgdmFyIHBhdGgsIGwsIGk7XG5cbiAgaWYgKCBpc0tleSggdmFsICkgKSB7XG4gICAgcmV0dXJuIFsgdG9LZXkoIHZhbCApIF07XG4gIH1cblxuICBpZiAoIF90eXBlKCB2YWwgKSA9PT0gJ2FycmF5JyApIHtcbiAgICBwYXRoID0gQXJyYXkoIGwgPSB2YWwubGVuZ3RoICk7XG5cbiAgICBmb3IgKCBpID0gbCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgcGF0aFsgaSBdID0gdG9LZXkoIHZhbFsgaSBdICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHBhdGggPSBzdHJpbmdUb1BhdGgoICcnICsgdmFsICk7XG4gIH1cblxuICByZXR1cm4gcGF0aDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjYXN0UGF0aDtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjbGFtcCAoIHZhbHVlLCBsb3dlciwgdXBwZXIgKSB7XG4gIGlmICggdmFsdWUgPj0gdXBwZXIgKSB7XG4gICAgcmV0dXJuIHVwcGVyO1xuICB9XG5cbiAgaWYgKCB2YWx1ZSA8PSBsb3dlciApIHtcbiAgICByZXR1cm4gbG93ZXI7XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3JlYXRlICAgICAgICAgPSByZXF1aXJlKCAnLi9jcmVhdGUnICksXG4gICAgZ2V0UHJvdG90eXBlT2YgPSByZXF1aXJlKCAnLi9nZXQtcHJvdG90eXBlLW9mJyApLFxuICAgIHRvT2JqZWN0ICAgICAgID0gcmVxdWlyZSggJy4vdG8tb2JqZWN0JyApLFxuICAgIGVhY2ggICAgICAgICAgID0gcmVxdWlyZSggJy4vZWFjaCcgKSxcbiAgICBpc09iamVjdExpa2UgICA9IHJlcXVpcmUoICcuL2lzLW9iamVjdC1saWtlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNsb25lICggZGVlcCwgdGFyZ2V0LCBndWFyZCApIHtcbiAgdmFyIGNsbjtcblxuICBpZiAoIHR5cGVvZiB0YXJnZXQgPT09ICd1bmRlZmluZWQnIHx8IGd1YXJkICkge1xuICAgIHRhcmdldCA9IGRlZXA7XG4gICAgZGVlcCA9IHRydWU7XG4gIH1cblxuICBjbG4gPSBjcmVhdGUoIGdldFByb3RvdHlwZU9mKCB0YXJnZXQgPSB0b09iamVjdCggdGFyZ2V0ICkgKSApO1xuXG4gIGVhY2goIHRhcmdldCwgZnVuY3Rpb24gKCB2YWx1ZSwga2V5LCB0YXJnZXQgKSB7XG4gICAgaWYgKCB2YWx1ZSA9PT0gdGFyZ2V0ICkge1xuICAgICAgdGhpc1sga2V5IF0gPSB0aGlzO1xuICAgIH0gZWxzZSBpZiAoIGRlZXAgJiYgaXNPYmplY3RMaWtlKCB2YWx1ZSApICkge1xuICAgICAgdGhpc1sga2V5IF0gPSBjbG9uZSggZGVlcCwgdmFsdWUgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1sga2V5IF0gPSB2YWx1ZTtcbiAgICB9XG4gIH0sIGNsbiApO1xuXG4gIHJldHVybiBjbG47XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgRVJSOiB7XG4gICAgSU5WQUxJRF9BUkdTOiAgICAgICAgICAnSW52YWxpZCBhcmd1bWVudHMnLFxuICAgIEZVTkNUSU9OX0VYUEVDVEVEOiAgICAgJ0V4cGVjdGVkIGEgZnVuY3Rpb24nLFxuICAgIFNUUklOR19FWFBFQ1RFRDogICAgICAgJ0V4cGVjdGVkIGEgc3RyaW5nJyxcbiAgICBVTkRFRklORURfT1JfTlVMTDogICAgICdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnLFxuICAgIFJFRFVDRV9PRl9FTVBUWV9BUlJBWTogJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnLFxuICAgIE5PX1BBVEg6ICAgICAgICAgICAgICAgJ05vIHBhdGggd2FzIGdpdmVuJ1xuICB9LFxuXG4gIE1BWF9BUlJBWV9MRU5HVEg6IDQyOTQ5NjcyOTUsXG4gIE1BWF9TQUZFX0lOVDogICAgIDkwMDcxOTkyNTQ3NDA5OTEsXG4gIE1JTl9TQUZFX0lOVDogICAgLTkwMDcxOTkyNTQ3NDA5OTEsXG5cbiAgREVFUDogICAgICAgICAxLFxuICBERUVQX0tFRVBfRk46IDIsXG5cbiAgUExBQ0VIT0xERVI6IHt9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVmaW5lUHJvcGVydGllcyA9IHJlcXVpcmUoICcuL2RlZmluZS1wcm9wZXJ0aWVzJyApO1xuXG52YXIgc2V0UHJvdG90eXBlT2YgPSByZXF1aXJlKCAnLi9zZXQtcHJvdG90eXBlLW9mJyApO1xuXG52YXIgaXNQcmltaXRpdmUgPSByZXF1aXJlKCAnLi9pcy1wcmltaXRpdmUnICk7XG5cbmZ1bmN0aW9uIEMgKCkge31cblxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIGNyZWF0ZSAoIHByb3RvdHlwZSwgZGVzY3JpcHRvcnMgKSB7XG4gIHZhciBvYmplY3Q7XG5cbiAgaWYgKCBwcm90b3R5cGUgIT09IG51bGwgJiYgaXNQcmltaXRpdmUoIHByb3RvdHlwZSApICkge1xuICAgIHRocm93IFR5cGVFcnJvciggJ09iamVjdCBwcm90b3R5cGUgbWF5IG9ubHkgYmUgYW4gT2JqZWN0IG9yIG51bGw6ICcgKyBwcm90b3R5cGUgKTtcbiAgfVxuXG4gIEMucHJvdG90eXBlID0gcHJvdG90eXBlO1xuXG4gIG9iamVjdCA9IG5ldyBDKCk7XG5cbiAgQy5wcm90b3R5cGUgPSBudWxsO1xuXG4gIGlmICggcHJvdG90eXBlID09PSBudWxsICkge1xuICAgIHNldFByb3RvdHlwZU9mKCBvYmplY3QsIG51bGwgKTtcbiAgfVxuXG4gIGlmICggYXJndW1lbnRzLmxlbmd0aCA+PSAyICkge1xuICAgIGRlZmluZVByb3BlcnRpZXMoIG9iamVjdCwgZGVzY3JpcHRvcnMgKTtcbiAgfVxuXG4gIHJldHVybiBvYmplY3Q7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmFzZUZvckVhY2ggID0gcmVxdWlyZSggJy4uL2Jhc2UvYmFzZS1mb3ItZWFjaCcgKSxcbiAgICBiYXNlRm9ySW4gICAgPSByZXF1aXJlKCAnLi4vYmFzZS9iYXNlLWZvci1pbicgKSxcbiAgICBpc0FycmF5TGlrZSAgPSByZXF1aXJlKCAnLi4vaXMtYXJyYXktbGlrZScgKSxcbiAgICB0b09iamVjdCAgICAgPSByZXF1aXJlKCAnLi4vdG8tb2JqZWN0JyApLFxuICAgIGl0ZXJhdGVlICAgICA9IHJlcXVpcmUoICcuLi9pdGVyYXRlZScgKS5pdGVyYXRlZSxcbiAgICBrZXlzICAgICAgICAgPSByZXF1aXJlKCAnLi4va2V5cycgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVFYWNoICggZnJvbVJpZ2h0ICkge1xuICByZXR1cm4gZnVuY3Rpb24gZWFjaCAoIG9iaiwgZm4sIGN0eCApIHtcblxuICAgIG9iaiA9IHRvT2JqZWN0KCBvYmogKTtcblxuICAgIGZuICA9IGl0ZXJhdGVlKCBmbiApO1xuXG4gICAgaWYgKCBpc0FycmF5TGlrZSggb2JqICkgKSB7XG4gICAgICByZXR1cm4gYmFzZUZvckVhY2goIG9iaiwgZm4sIGN0eCwgZnJvbVJpZ2h0ICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJhc2VGb3JJbiggb2JqLCBmbiwgY3R4LCBmcm9tUmlnaHQsIGtleXMoIG9iaiApICk7XG5cbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgTXVzdCBiZSAnV2lkdGgnIG9yICdIZWlnaHQnIChjYXBpdGFsaXplZCkuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlR2V0RWxlbWVudERpbWVuc2lvbiAoIG5hbWUgKSB7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7V2luZG93fE5vZGV9IGVcbiAgICovXG4gIHJldHVybiBmdW5jdGlvbiAoIGUgKSB7XG5cbiAgICB2YXIgdiwgYiwgZDtcblxuICAgIC8vIGlmIHRoZSBlbGVtZW50IGlzIGEgd2luZG93XG5cbiAgICBpZiAoIGUud2luZG93ID09PSBlICkge1xuXG4gICAgICAvLyBpbm5lcldpZHRoIGFuZCBpbm5lckhlaWdodCBpbmNsdWRlcyBhIHNjcm9sbGJhciB3aWR0aCwgYnV0IGl0IGlzIG5vdFxuICAgICAgLy8gc3VwcG9ydGVkIGJ5IG9sZGVyIGJyb3dzZXJzXG5cbiAgICAgIHYgPSBNYXRoLm1heCggZVsgJ2lubmVyJyArIG5hbWUgXSB8fCAwLCBlLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudFsgJ2NsaWVudCcgKyBuYW1lIF0gKTtcblxuICAgIC8vIGlmIHRoZSBlbGVtZW50cyBpcyBhIGRvY3VtZW50XG5cbiAgICB9IGVsc2UgaWYgKCBlLm5vZGVUeXBlID09PSA5ICkge1xuXG4gICAgICBiID0gZS5ib2R5O1xuICAgICAgZCA9IGUuZG9jdW1lbnRFbGVtZW50O1xuXG4gICAgICB2ID0gTWF0aC5tYXgoXG4gICAgICAgIGJbICdzY3JvbGwnICsgbmFtZSBdLFxuICAgICAgICBkWyAnc2Nyb2xsJyArIG5hbWUgXSxcbiAgICAgICAgYlsgJ29mZnNldCcgKyBuYW1lIF0sXG4gICAgICAgIGRbICdvZmZzZXQnICsgbmFtZSBdLFxuICAgICAgICBiWyAnY2xpZW50JyArIG5hbWUgXSxcbiAgICAgICAgZFsgJ2NsaWVudCcgKyBuYW1lIF0gKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICB2ID0gZVsgJ2NsaWVudCcgKyBuYW1lIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHY7XG5cbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYXN0UGF0aCA9IHJlcXVpcmUoICcuLi9jYXN0LXBhdGgnICksXG4gICAgbm9vcCAgICAgPSByZXF1aXJlKCAnLi4vbm9vcCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVQcm9wZXJ0eSAoIGJhc2VQcm9wZXJ0eSwgdXNlQXJncyApIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICggcGF0aCApIHtcbiAgICB2YXIgYXJncztcblxuICAgIGlmICggISAoIHBhdGggPSBjYXN0UGF0aCggcGF0aCApICkubGVuZ3RoICkge1xuICAgICAgcmV0dXJuIG5vb3A7XG4gICAgfVxuXG4gICAgaWYgKCB1c2VBcmdzICkge1xuICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDEgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCBvYmplY3QgKSB7XG4gICAgICByZXR1cm4gYmFzZVByb3BlcnR5KCBvYmplY3QsIHBhdGgsIGFyZ3MgKTtcbiAgICB9O1xuICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWZhdWx0VG8gKCB2YWx1ZSwgZGVmYXVsdFZhbHVlICkge1xuICBpZiAoIHZhbHVlICE9IG51bGwgJiYgdmFsdWUgPT09IHZhbHVlICkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiBkZWZhdWx0VmFsdWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbWl4aW4gPSByZXF1aXJlKCAnLi9taXhpbicgKSxcbiAgICBjbG9uZSA9IHJlcXVpcmUoICcuL2Nsb25lJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlZmF1bHRzICggZGVmYXVsdHMsIG9iamVjdCApIHtcbiAgaWYgKCBvYmplY3QgPT0gbnVsbCApIHtcbiAgICByZXR1cm4gY2xvbmUoIHRydWUsIGRlZmF1bHRzICk7XG4gIH1cblxuICByZXR1cm4gbWl4aW4oIHRydWUsIGNsb25lKCB0cnVlLCBkZWZhdWx0cyApLCBvYmplY3QgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdXBwb3J0ID0gcmVxdWlyZSggJy4vc3VwcG9ydC9zdXBwb3J0LWRlZmluZS1wcm9wZXJ0eScgKTtcblxudmFyIGRlZmluZVByb3BlcnRpZXMsIGJhc2VEZWZpbmVQcm9wZXJ0eSwgaXNQcmltaXRpdmUsIGVhY2g7XG5cbmlmICggc3VwcG9ydCAhPT0gJ2Z1bGwnICkge1xuICBpc1ByaW1pdGl2ZSAgICAgICAgPSByZXF1aXJlKCAnLi9pcy1wcmltaXRpdmUnICk7XG4gIGVhY2ggICAgICAgICAgICAgICA9IHJlcXVpcmUoICcuL2VhY2gnICk7XG4gIGJhc2VEZWZpbmVQcm9wZXJ0eSA9IHJlcXVpcmUoICcuL2Jhc2UvYmFzZS1kZWZpbmUtcHJvcGVydHknICk7XG5cbiAgZGVmaW5lUHJvcGVydGllcyA9IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXMgKCBvYmplY3QsIGRlc2NyaXB0b3JzICkge1xuICAgIGlmICggc3VwcG9ydCAhPT0gJ25vdC1zdXBwb3J0ZWQnICkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCBvYmplY3QsIGRlc2NyaXB0b3JzICk7XG4gICAgICB9IGNhdGNoICggZSApIHt9XG4gICAgfVxuXG4gICAgaWYgKCBpc1ByaW1pdGl2ZSggb2JqZWN0ICkgKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoICdkZWZpbmVQcm9wZXJ0aWVzIGNhbGxlZCBvbiBub24tb2JqZWN0JyApO1xuICAgIH1cblxuICAgIGlmICggaXNQcmltaXRpdmUoIGRlc2NyaXB0b3JzICkgKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoICdQcm9wZXJ0eSBkZXNjcmlwdGlvbiBtdXN0IGJlIGFuIG9iamVjdDogJyArIGRlc2NyaXB0b3JzICk7XG4gICAgfVxuXG4gICAgZWFjaCggZGVzY3JpcHRvcnMsIGZ1bmN0aW9uICggZGVzY3JpcHRvciwga2V5ICkge1xuICAgICAgaWYgKCBpc1ByaW1pdGl2ZSggZGVzY3JpcHRvciApICkge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoICdQcm9wZXJ0eSBkZXNjcmlwdGlvbiBtdXN0IGJlIGFuIG9iamVjdDogJyArIGRlc2NyaXB0b3IgKTtcbiAgICAgIH1cblxuICAgICAgYmFzZURlZmluZVByb3BlcnR5KCB0aGlzLCBrZXksIGRlc2NyaXB0b3IgKTtcbiAgICB9LCBvYmplY3QgKTtcblxuICAgIHJldHVybiBvYmplY3Q7XG4gIH07XG59IGVsc2Uge1xuICBkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVmaW5lUHJvcGVydGllcztcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCAnLi9jcmVhdGUvY3JlYXRlLWVhY2gnICkoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCAnLi9jcmVhdGUvY3JlYXRlLWdldC1lbGVtZW50LWRpbWVuc2lvbicgKSggJ0hlaWdodCcgKTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCAnLi9jcmVhdGUvY3JlYXRlLWdldC1lbGVtZW50LWRpbWVuc2lvbicgKSggJ1dpZHRoJyApO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRVJSID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApLkVSUjtcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gZ2V0UHJvdG90eXBlT2YgKCBvYmogKSB7XG4gIHZhciBwcm90b3R5cGU7XG5cbiAgaWYgKCBvYmogPT0gbnVsbCApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoIEVSUi5VTkRFRklORURfT1JfTlVMTCApO1xuICB9XG5cbiAgcHJvdG90eXBlID0gb2JqLl9fcHJvdG9fXzsgLy8ganNoaW50IGlnbm9yZTogbGluZVxuXG4gIGlmICggdHlwZW9mIHByb3RvdHlwZSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgcmV0dXJuIHByb3RvdHlwZTtcbiAgfVxuXG4gIGlmICggdG9TdHJpbmcuY2FsbCggb2JqLmNvbnN0cnVjdG9yICkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXScgKSB7XG4gICAgcmV0dXJuIG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoICcuL2lzLW9iamVjdC1saWtlJyApLFxuICAgIGlzTGVuZ3RoICAgICA9IHJlcXVpcmUoICcuL2lzLWxlbmd0aCcgKSxcbiAgICBpc1dpbmRvd0xpa2UgPSByZXF1aXJlKCAnLi9pcy13aW5kb3ctbGlrZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0FycmF5TGlrZU9iamVjdCAoIHZhbHVlICkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKCB2YWx1ZSApICYmIGlzTGVuZ3RoKCB2YWx1ZS5sZW5ndGggKSAmJiAhIGlzV2luZG93TGlrZSggdmFsdWUgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc0xlbmd0aCAgICAgPSByZXF1aXJlKCAnLi9pcy1sZW5ndGgnICksXG4gICAgaXNXaW5kb3dMaWtlID0gcmVxdWlyZSggJy4vaXMtd2luZG93LWxpa2UnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBcnJheUxpa2UgKCB2YWx1ZSApIHtcbiAgaWYgKCB2YWx1ZSA9PSBudWxsICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICggdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyApIHtcbiAgICByZXR1cm4gaXNMZW5ndGgoIHZhbHVlLmxlbmd0aCApICYmICFpc1dpbmRvd0xpa2UoIHZhbHVlICk7XG4gIH1cblxuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QtbGlrZScgKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoICcuL2lzLWxlbmd0aCcgKTtcblxudmFyIHRvU3RyaW5nID0ge30udG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiBpc0FycmF5ICggdmFsdWUgKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UoIHZhbHVlICkgJiZcbiAgICBpc0xlbmd0aCggdmFsdWUubGVuZ3RoICkgJiZcbiAgICB0b1N0cmluZy5jYWxsKCB2YWx1ZSApID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF90eXBlICAgID0gcmVxdWlyZSggJy4vX3R5cGUnICk7XG5cbnZhciByRGVlcEtleSA9IC8oXnxbXlxcXFxdKShcXFxcXFxcXCkqKFxcLnxcXFspLztcblxuZnVuY3Rpb24gaXNLZXkgKCB2YWwgKSB7XG4gIHZhciB0eXBlO1xuXG4gIGlmICggISB2YWwgKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoIF90eXBlKCB2YWwgKSA9PT0gJ2FycmF5JyApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB0eXBlID0gdHlwZW9mIHZhbDtcblxuICBpZiAoIHR5cGUgPT09ICdudW1iZXInIHx8IHR5cGUgPT09ICdib29sZWFuJyB8fCBfdHlwZSggdmFsICkgPT09ICdzeW1ib2wnICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuICEgckRlZXBLZXkudGVzdCggdmFsICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNLZXk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBNQVhfQVJSQVlfTEVOR1RIID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApLk1BWF9BUlJBWV9MRU5HVEg7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNMZW5ndGggKCB2YWx1ZSApIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiZcbiAgICB2YWx1ZSA+PSAwICYmXG4gICAgdmFsdWUgPD0gTUFYX0FSUkFZX0xFTkdUSCAmJlxuICAgIHZhbHVlICUgMSA9PT0gMDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNPYmplY3RMaWtlICggdmFsdWUgKSB7XG4gIHJldHVybiAhISB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoICcuL2lzLW9iamVjdC1saWtlJyApO1xuXG52YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc09iamVjdCAoIHZhbHVlICkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKCB2YWx1ZSApICYmXG4gICAgdG9TdHJpbmcuY2FsbCggdmFsdWUgKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0UHJvdG90eXBlT2YgPSByZXF1aXJlKCAnLi9nZXQtcHJvdG90eXBlLW9mJyApO1xuXG52YXIgaXNPYmplY3QgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QnICk7XG5cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbnZhciB0b1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcblxudmFyIE9CSkVDVCA9IHRvU3RyaW5nLmNhbGwoIE9iamVjdCApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzUGxhaW5PYmplY3QgKCB2ICkge1xuICB2YXIgcCwgYztcblxuICBpZiAoICEgaXNPYmplY3QoIHYgKSApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwID0gZ2V0UHJvdG90eXBlT2YoIHYgKTtcblxuICBpZiAoIHAgPT09IG51bGwgKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoICEgaGFzT3duUHJvcGVydHkuY2FsbCggcCwgJ2NvbnN0cnVjdG9yJyApICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGMgPSBwLmNvbnN0cnVjdG9yO1xuXG4gIHJldHVybiB0eXBlb2YgYyA9PT0gJ2Z1bmN0aW9uJyAmJiB0b1N0cmluZy5jYWxsKCBjICkgPT09IE9CSkVDVDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNQcmltaXRpdmUgKCB2YWx1ZSApIHtcbiAgcmV0dXJuICEgdmFsdWUgfHxcbiAgICB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIHZhbHVlICE9PSAnZnVuY3Rpb24nO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHR5cGUgPSByZXF1aXJlKCAnLi90eXBlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzU3ltYm9sICggdmFsdWUgKSB7XG4gIHJldHVybiB0eXBlKCB2YWx1ZSApID09PSAnc3ltYm9sJztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QtbGlrZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1dpbmRvd0xpa2UgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSggdmFsdWUgKSAmJiB2YWx1ZS53aW5kb3cgPT09IHZhbHVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc3NldCAoIGtleSwgb2JqICkge1xuICBpZiAoIG9iaiA9PSBudWxsICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0eXBlb2Ygb2JqWyBrZXkgXSAhPT0gJ3VuZGVmaW5lZCcgfHwga2V5IGluIG9iajtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc0FycmF5TGlrZU9iamVjdCA9IHJlcXVpcmUoICcuL2lzLWFycmF5LWxpa2Utb2JqZWN0JyApLFxuICAgIG1hdGNoZXNQcm9wZXJ0eSAgID0gcmVxdWlyZSggJy4vbWF0Y2hlcy1wcm9wZXJ0eScgKSxcbiAgICBwcm9wZXJ0eSAgICAgICAgICA9IHJlcXVpcmUoICcuL3Byb3BlcnR5JyApO1xuXG5leHBvcnRzLml0ZXJhdGVlID0gZnVuY3Rpb24gaXRlcmF0ZWUgKCB2YWx1ZSApIHtcbiAgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgaWYgKCBpc0FycmF5TGlrZU9iamVjdCggdmFsdWUgKSApIHtcbiAgICByZXR1cm4gbWF0Y2hlc1Byb3BlcnR5KCB2YWx1ZSApO1xuICB9XG5cbiAgcmV0dXJuIHByb3BlcnR5KCB2YWx1ZSApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJhc2VLZXlzID0gcmVxdWlyZSggJy4vYmFzZS9iYXNlLWtleXMnICk7XG52YXIgdG9PYmplY3QgPSByZXF1aXJlKCAnLi90by1vYmplY3QnICk7XG52YXIgc3VwcG9ydCAgPSByZXF1aXJlKCAnLi9zdXBwb3J0L3N1cHBvcnQta2V5cycgKTtcblxuaWYgKCBzdXBwb3J0ICE9PSAnZXMyMDE1JyApIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBrZXlzICggdiApIHtcbiAgICB2YXIgX2tleXM7XG5cbiAgICAvKipcbiAgICAgKiArIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gK1xuICAgICAqIHwgSSB0ZXN0ZWQgdGhlIGZ1bmN0aW9ucyB3aXRoIHN0cmluZ1syMDQ4XSAoYW4gYXJyYXkgb2Ygc3RyaW5ncykgYW5kIGhhZCB8XG4gICAgICogfCB0aGlzIHJlc3VsdHMgaW4gbm9kZS5qcyAodjguMTAuMCk6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAgKiArIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gK1xuICAgICAqIHwgYmFzZUtleXMgeCAxMCw2NzQgb3BzL3NlYyDCsTAuMjMlICg5NCBydW5zIHNhbXBsZWQpICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAqIHwgT2JqZWN0LmtleXMgeCAyMiwxNDcgb3BzL3NlYyDCsTAuMjMlICg5NSBydW5zIHNhbXBsZWQpICAgICAgICAgICAgICAgICAgfFxuICAgICAqIHwgRmFzdGVzdCBpcyBcIk9iamVjdC5rZXlzXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAgKiArIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gK1xuICAgICAqL1xuXG4gICAgaWYgKCBzdXBwb3J0ID09PSAnZXM1JyApIHtcbiAgICAgIF9rZXlzID0gT2JqZWN0LmtleXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9rZXlzID0gYmFzZUtleXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9rZXlzKCB0b09iamVjdCggdiApICk7XG4gIH07XG59IGVsc2Uge1xuICBtb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5rZXlzO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2FzdFBhdGggPSByZXF1aXJlKCAnLi9jYXN0LXBhdGgnICksXG4gICAgZ2V0ICAgICAgPSByZXF1aXJlKCAnLi9iYXNlL2Jhc2UtZ2V0JyApLFxuICAgIEVSUiAgICAgID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApLkVSUjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtYXRjaGVzUHJvcGVydHkgKCBwcm9wZXJ0eSApIHtcblxuICB2YXIgcGF0aCAgPSBjYXN0UGF0aCggcHJvcGVydHlbIDAgXSApLFxuICAgICAgdmFsdWUgPSBwcm9wZXJ0eVsgMSBdO1xuXG4gIGlmICggISBwYXRoLmxlbmd0aCApIHtcbiAgICB0aHJvdyBFcnJvciggRVJSLk5PX1BBVEggKTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoIG9iamVjdCApIHtcblxuICAgIGlmICggb2JqZWN0ID09IG51bGwgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCBwYXRoLmxlbmd0aCA+IDEgKSB7XG4gICAgICByZXR1cm4gZ2V0KCBvYmplY3QsIHBhdGgsIDAgKSA9PT0gdmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iamVjdFsgcGF0aFsgMCBdIF0gPT09IHZhbHVlO1xuXG4gIH07XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc1BsYWluT2JqZWN0ID0gcmVxdWlyZSggJy4vaXMtcGxhaW4tb2JqZWN0JyApO1xuXG52YXIgdG9PYmplY3QgPSByZXF1aXJlKCAnLi90by1vYmplY3QnICk7XG5cbnZhciBpc0FycmF5ID0gcmVxdWlyZSggJy4vaXMtYXJyYXknICk7XG5cbnZhciBrZXlzID0gcmVxdWlyZSggJy4va2V5cycgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtaXhpbiAoIGRlZXAsIG9iamVjdCApIHtcblxuICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cbiAgdmFyIGkgPSAyO1xuXG5cbiAgdmFyIG5hbWVzLCBleHAsIGosIGssIHZhbCwga2V5LCBub3dBcnJheSwgc3JjO1xuXG4gIC8vICBtaXhpbigge30sIHt9IClcblxuICBpZiAoIHR5cGVvZiBkZWVwICE9PSAnYm9vbGVhbicgKSB7XG4gICAgb2JqZWN0ID0gZGVlcDtcbiAgICBkZWVwICAgPSB0cnVlO1xuICAgIGkgICAgICA9IDE7XG4gIH1cblxuICAvLyB2YXIgZXh0ZW5kYWJsZSA9IHtcbiAgLy8gICBleHRlbmQ6IHJlcXVpcmUoICdwZWFrby9taXhpbicgKVxuICAvLyB9O1xuXG4gIC8vIGV4dGVuZGFibGUuZXh0ZW5kKCB7IG5hbWU6ICdFeHRlbmRhYmxlIE9iamVjdCcgfSApO1xuXG4gIGlmICggaSA9PT0gbCApIHtcblxuICAgIG9iamVjdCA9IHRoaXM7IC8vIGpzaGludCBpZ25vcmU6IGxpbmVcblxuICAgIC0taTtcblxuICB9XG5cbiAgb2JqZWN0ID0gdG9PYmplY3QoIG9iamVjdCApO1xuXG4gIGZvciAoIDsgaSA8IGw7ICsraSApIHtcbiAgICBuYW1lcyA9IGtleXMoIGV4cCA9IHRvT2JqZWN0KCBhcmd1bWVudHNbIGkgXSApICk7XG5cbiAgICBmb3IgKCBqID0gMCwgayA9IG5hbWVzLmxlbmd0aDsgaiA8IGs7ICsraiApIHtcbiAgICAgIHZhbCA9IGV4cFsga2V5ID0gbmFtZXNbIGogXSBdO1xuXG4gICAgICBpZiAoIGRlZXAgJiYgdmFsICE9PSBleHAgJiYgKCBpc1BsYWluT2JqZWN0KCB2YWwgKSB8fCAoIG5vd0FycmF5ID0gaXNBcnJheSggdmFsICkgKSApICkge1xuICAgICAgICBzcmMgPSBvYmplY3RbIGtleSBdO1xuXG4gICAgICAgIGlmICggbm93QXJyYXkgKSB7XG4gICAgICAgICAgaWYgKCAhIGlzQXJyYXkoIHNyYyApICkge1xuICAgICAgICAgICAgc3JjID0gW107XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbm93QXJyYXkgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmICggISBpc1BsYWluT2JqZWN0KCBzcmMgKSApIHtcbiAgICAgICAgICBzcmMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9iamVjdFsga2V5IF0gPSBtaXhpbiggdHJ1ZSwgc3JjLCB2YWwgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9iamVjdFsga2V5IF0gPSB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gb2JqZWN0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBub29wICgpIHt9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGUubm93IHx8IGZ1bmN0aW9uIG5vdyAoKSB7XG4gIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiZWZvcmUgPSByZXF1aXJlKCAnLi9iZWZvcmUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gb25jZSAoIHRhcmdldCApIHtcbiAgcmV0dXJuIGJlZm9yZSggMSwgdGFyZ2V0ICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoICcuL2NyZWF0ZS9jcmVhdGUtcHJvcGVydHknICkoIHJlcXVpcmUoICcuL2Jhc2UvYmFzZS1wcm9wZXJ0eScgKSApO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNQcmltaXRpdmUgPSByZXF1aXJlKCAnLi9pcy1wcmltaXRpdmUnICksXG4gICAgRVJSICAgICAgICAgPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICkuRVJSO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBzZXRQcm90b3R5cGVPZiAoIHRhcmdldCwgcHJvdG90eXBlICkge1xuICBpZiAoIHRhcmdldCA9PSBudWxsICkge1xuICAgIHRocm93IFR5cGVFcnJvciggRVJSLlVOREVGSU5FRF9PUl9OVUxMICk7XG4gIH1cblxuICBpZiAoIHByb3RvdHlwZSAhPT0gbnVsbCAmJiBpc1ByaW1pdGl2ZSggcHJvdG90eXBlICkgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCAnT2JqZWN0IHByb3RvdHlwZSBtYXkgb25seSBiZSBhbiBPYmplY3Qgb3IgbnVsbDogJyArIHByb3RvdHlwZSApO1xuICB9XG5cbiAgaWYgKCAnX19wcm90b19fJyBpbiB0YXJnZXQgKSB7XG4gICAgdGFyZ2V0Ll9fcHJvdG9fXyA9IHByb3RvdHlwZTsgLy8ganNoaW50IGlnbm9yZTogbGluZVxuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdXBwb3J0O1xuXG5mdW5jdGlvbiB0ZXN0ICggdGFyZ2V0ICkge1xuICB0cnkge1xuICAgIGlmICggJycgaW4gT2JqZWN0LmRlZmluZVByb3BlcnR5KCB0YXJnZXQsICcnLCB7fSApICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGNhdGNoICggZSApIHt9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5pZiAoIHRlc3QoIHt9ICkgKSB7XG4gIHN1cHBvcnQgPSAnZnVsbCc7XG59IGVsc2UgaWYgKCB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHRlc3QoIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzcGFuJyApICkgKSB7XG4gIHN1cHBvcnQgPSAnZG9tJztcbn0gZWxzZSB7XG4gIHN1cHBvcnQgPSAnbm90LXN1cHBvcnRlZCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VwcG9ydDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHN1cHBvcnQ7XG5cbmlmICggT2JqZWN0LmtleXMgKSB7XG4gIHRyeSB7XG4gICAgc3VwcG9ydCA9IE9iamVjdC5rZXlzKCAnJyApLCAnZXMyMDE1JzsgLy8ganNoaW50IGlnbm9yZTogbGluZVxuICB9IGNhdGNoICggZSApIHtcbiAgICBzdXBwb3J0ID0gJ2VzNSc7XG4gIH1cbn0gZWxzZSBpZiAoIHsgdG9TdHJpbmc6IG51bGwgfS5wcm9wZXJ0eUlzRW51bWVyYWJsZSggJ3RvU3RyaW5nJyApICkge1xuICBzdXBwb3J0ID0gJ25vdC1zdXBwb3J0ZWQnO1xufSBlbHNlIHtcbiAgc3VwcG9ydCA9ICdoYXMtYS1idWcnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnQ7XG4iLCIvKipcbiAqIEJhc2VkIG9uIEVyaWsgTcO2bGxlciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgcG9seWZpbGw6XG4gKlxuICogQWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL3BhdWxpcmlzaC8xNTc5NjcxIHdoaWNoIGRlcml2ZWQgZnJvbVxuICogaHR0cDovL3BhdWxpcmlzaC5jb20vMjAxMS9yZXF1ZXN0YW5pbWF0aW9uZnJhbWUtZm9yLXNtYXJ0LWFuaW1hdGluZy9cbiAqIGh0dHA6Ly9teS5vcGVyYS5jb20vZW1vbGxlci9ibG9nLzIwMTEvMTIvMjAvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1lci1hbmltYXRpbmdcbiAqXG4gKiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgcG9seWZpbGwgYnkgRXJpayBNw7ZsbGVyLlxuICogRml4ZXMgZnJvbSBQYXVsIElyaXNoLCBUaW5vIFppamRlbCwgQW5kcmV3IE1hbywgS2xlbWVuIFNsYXZpxI0sIERhcml1cyBCYWNvbi5cbiAqXG4gKiBNSVQgbGljZW5zZVxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHRpbWVzdGFtcCA9IHJlcXVpcmUoICcuL3RpbWVzdGFtcCcgKTtcblxudmFyIHJlcXVlc3RBRiwgY2FuY2VsQUY7XG5cbmlmICggdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gIGNhbmNlbEFGID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93LndlYmtpdENhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5tb3pDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gIHJlcXVlc3RBRiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZTtcbn1cblxudmFyIG5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gISByZXF1ZXN0QUYgfHwgISBjYW5jZWxBRiB8fFxuICB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiAvaVAoYWR8aG9uZXxvZCkuKk9TXFxzNi8udGVzdCggbmF2aWdhdG9yLnVzZXJBZ2VudCApO1xuXG5pZiAoIG5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lICkge1xuICB2YXIgbGFzdFJlcXVlc3RUaW1lID0gMCxcbiAgICAgIGZyYW1lRHVyYXRpb24gICA9IDEwMDAgLyA2MDtcblxuICBleHBvcnRzLnJlcXVlc3QgPSBmdW5jdGlvbiByZXF1ZXN0ICggYW5pbWF0ZSApIHtcbiAgICB2YXIgbm93ICAgICAgICAgICAgID0gdGltZXN0YW1wKCksXG4gICAgICAgIG5leHRSZXF1ZXN0VGltZSA9IE1hdGgubWF4KCBsYXN0UmVxdWVzdFRpbWUgKyBmcmFtZUR1cmF0aW9uLCBub3cgKTtcblxuICAgIHJldHVybiBzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG4gICAgICBsYXN0UmVxdWVzdFRpbWUgPSBuZXh0UmVxdWVzdFRpbWU7XG4gICAgICBhbmltYXRlKCBub3cgKTtcbiAgICB9LCBuZXh0UmVxdWVzdFRpbWUgLSBub3cgKTtcbiAgfTtcblxuICBleHBvcnRzLmNhbmNlbCA9IGNsZWFyVGltZW91dDtcbn0gZWxzZSB7XG4gIGV4cG9ydHMucmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3QgKCBhbmltYXRlICkge1xuICAgIHJldHVybiByZXF1ZXN0QUYoIGFuaW1hdGUgKTtcbiAgfTtcblxuICBleHBvcnRzLmNhbmNlbCA9IGZ1bmN0aW9uIGNhbmNlbCAoIGlkICkge1xuICAgIHJldHVybiBjYW5jZWxBRiggaWQgKTtcbiAgfTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG5vdyA9IHJlcXVpcmUoICcuL25vdycgKTtcbnZhciBuYXZpZ2F0b3JTdGFydDtcblxuaWYgKCB0eXBlb2YgcGVyZm9ybWFuY2UgPT09ICd1bmRlZmluZWQnIHx8ICEgcGVyZm9ybWFuY2Uubm93ICkge1xuICBuYXZpZ2F0b3JTdGFydCA9IG5vdygpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdGltZXN0YW1wICgpIHtcbiAgICByZXR1cm4gbm93KCkgLSBuYXZpZ2F0b3JTdGFydDtcbiAgfTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdGltZXN0YW1wICgpIHtcbiAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gIH07XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfdW5lc2NhcGUgPSByZXF1aXJlKCAnLi9fdW5lc2NhcGUnICksXG4gICAgaXNTeW1ib2wgID0gcmVxdWlyZSggJy4vaXMtc3ltYm9sJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRvS2V5ICggdmFsICkge1xuICB2YXIga2V5O1xuXG4gIGlmICggdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgKSB7XG4gICAgcmV0dXJuIF91bmVzY2FwZSggdmFsICk7XG4gIH1cblxuICBpZiAoIGlzU3ltYm9sKCB2YWwgKSApIHtcbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAga2V5ID0gJycgKyB2YWw7XG5cbiAgaWYgKCBrZXkgPT09ICcwJyAmJiAxIC8gdmFsID09PSAtSW5maW5pdHkgKSB7XG4gICAgcmV0dXJuICctMCc7XG4gIH1cblxuICByZXR1cm4gX3VuZXNjYXBlKCBrZXkgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBFUlIgPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICkuRVJSO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRvT2JqZWN0ICggdmFsdWUgKSB7XG4gIGlmICggdmFsdWUgPT0gbnVsbCApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoIEVSUi5VTkRFRklORURfT1JfTlVMTCApO1xuICB9XG5cbiAgcmV0dXJuIE9iamVjdCggdmFsdWUgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcmVhdGUgPSByZXF1aXJlKCAnLi9jcmVhdGUnICk7XG5cbnZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nLFxuICAgIHR5cGVzID0gY3JlYXRlKCBudWxsICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0VHlwZSAoIHZhbHVlICkge1xuICB2YXIgdHlwZSwgdGFnO1xuXG4gIGlmICggdmFsdWUgPT09IG51bGwgKSB7XG4gICAgcmV0dXJuICdudWxsJztcbiAgfVxuXG4gIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG5cbiAgaWYgKCB0eXBlICE9PSAnb2JqZWN0JyAmJiB0eXBlICE9PSAnZnVuY3Rpb24nICkge1xuICAgIHJldHVybiB0eXBlO1xuICB9XG5cbiAgdHlwZSA9IHR5cGVzWyB0YWcgPSB0b1N0cmluZy5jYWxsKCB2YWx1ZSApIF07XG5cbiAgaWYgKCB0eXBlICkge1xuICAgIHJldHVybiB0eXBlO1xuICB9XG5cbiAgcmV0dXJuICggdHlwZXNbIHRhZyBdID0gdGFnLnNsaWNlKCA4LCAtMSApLnRvTG93ZXJDYXNlKCkgKTtcbn07XG4iXX0=
