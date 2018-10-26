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
  this.settings = {};

  /**
   * Запускает цикл анимации.
   * @method v6.Ticker#start
   * @chainable
   * @example
   * ticker.start();
   */
  function start ( _now )
  {
    var elapsedTime, frameTime;

    if ( ! self.running ) {
      if ( ! _now ) {
        self.lastRequestAnimationFrameID = timer.request( start );
        self.lastRequestTime = timestamp();
        self.running = true;
      }

      return this; // eslint-disable-line no-invalid-this
    }

    if ( ! _now ) {
      return this; // eslint-disable-line no-invalid-this
    }

    elapsedTime = Math.min( 1, ( _now - self.lastRequestTime ) * 0.001 );

    self.skippedTime += elapsedTime;
    self.totalTime   += elapsedTime;

    frameTime = self.settings[ 'frame time' ];

    while ( self.skippedTime >= frameTime && self.running ) {
      self.skippedTime -= frameTime;
      self.emit( 'update', frameTime, _now );
    }

    self.emit( 'render', elapsedTime, _now );
    self.lastRequestTime = _now;
    self.lastRequestAnimationFrameID = timer.request( start );

    return this; // eslint-disable-line no-invalid-this
  }

  this.start = start;
  this.set( 'FPS', 60 );
}

Ticker.prototype = Object.create( LightEmitter.prototype );
Ticker.prototype.constructor = Ticker;

/**
 * Set new value of a setting.
 * @method v6.Ticker#set
 * @param  {string} setting The setting`s key, e.g.: "FPS", "frame time".
 * @param  {any}    value   New setting`s value.
 * @return {void}           Returns nothing.
 * @example
 * ticker.set( 'FPS', 120 );
 */
Ticker.prototype.set = function set ( setting, value )
{
  CHECK( setting );

  if ( setting === 'FPS' ) {
    this.settings[ 'frame time' ] = 1 / value;
  } else if ( setting === 'frame time' ) {
    this.settings[ 'FPS' ] = 1 / value; // eslint-disable-line dot-notation
  }

  this.settings[ setting ] = value;
};

/**
 * Get current value of a setting.
 * @method v6.Ticker#get
 * @param  {string} setting The setting`s key, e.g.: "FPS", "frame time".
 * @return {any}            The setting`s value.
 * @example
 * var frameTime = ticker.get( 'frame time' );
 */
Ticker.prototype.get = function get ( setting )
{
  CHECK( setting );
  return this.settings[ setting ];
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

function CHECK ( setting )
{
  switch ( setting ) {
    case 'frame time':
    case 'FPS':
      return;
  }

  throw Error( 'Got unknown setting key: ' + setting );
}

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
  throw Error( 'Got unknown setting key: ' + setting );
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb3JlL1NoYWRlclByb2dyYW0uanMiLCJjb3JlL1RpY2tlci5qcyIsImNvcmUvVHJhbnNmb3JtLmpzIiwiY29yZS9jYW1lcmEvQ2FtZXJhLmpzIiwiY29yZS9jYW1lcmEvc2V0dGluZ3MuanMiLCJjb3JlL2NvbG9yL0hTTEEuanMiLCJjb3JlL2NvbG9yL1JHQkEuanMiLCJjb3JlL2NvbG9yL2ludGVybmFsL2NvbG9ycy5qcyIsImNvcmUvY29sb3IvaW50ZXJuYWwvcGFyc2UuanMiLCJjb3JlL2NvbnN0YW50cy5qcyIsImNvcmUvaW1hZ2UvQWJzdHJhY3RJbWFnZS5qcyIsImNvcmUvaW1hZ2UvQ29tcG91bmRlZEltYWdlLmpzIiwiY29yZS9pbWFnZS9JbWFnZS5qcyIsImNvcmUvaW50ZXJuYWwvY3JlYXRlX3BvbHlnb24uanMiLCJjb3JlL2ludGVybmFsL2NyZWF0ZV9wcm9ncmFtLmpzIiwiY29yZS9pbnRlcm5hbC9jcmVhdGVfc2hhZGVyLmpzIiwiY29yZS9pbnRlcm5hbC9wb2x5Z29ucy5qcyIsImNvcmUvaW50ZXJuYWwvcmVwb3J0LmpzIiwiY29yZS9tYXRoL0Fic3RyYWN0VmVjdG9yLmpzIiwiY29yZS9tYXRoL1ZlY3RvcjJELmpzIiwiY29yZS9tYXRoL1ZlY3RvcjNELmpzIiwiY29yZS9tYXRoL21hdDMuanMiLCJjb3JlL3JlbmRlcmVyL0Fic3RyYWN0UmVuZGVyZXIuanMiLCJjb3JlL3JlbmRlcmVyL1JlbmRlcmVyMkQuanMiLCJjb3JlL3JlbmRlcmVyL1JlbmRlcmVyR0wuanMiLCJjb3JlL3JlbmRlcmVyL2NyZWF0ZV9yZW5kZXJlci5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvY2xvc2Vfc2hhcGUuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL2NvcHlfZHJhd2luZ19zZXR0aW5ncy5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvZGVmYXVsdF9kcmF3aW5nX3NldHRpbmdzLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9nZXRfcmVuZGVyZXJfdHlwZS5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvZ2V0X3dlYmdsLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24uanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL3Byb2Nlc3Nfc2hhcGUuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL3NldF9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MuanMiLCJjb3JlL3JlbmRlcmVyL3NldHRpbmdzLmpzIiwiY29yZS9yZW5kZXJlci9zaGFwZXMvZHJhd19saW5lcy5qcyIsImNvcmUvcmVuZGVyZXIvc2hhcGVzL2RyYXdfcG9pbnRzLmpzIiwiY29yZS9zZXR0aW5ncy5qcyIsImNvcmUvc2hhZGVycy5qcyIsImluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xpZ2h0X2VtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGVha28vX3Rocm93LWFyZ3VtZW50LWV4Y2VwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdHlwZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdW5lc2NhcGUuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZXhlYy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZm9yLWVhY2guanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWZvci1pbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZ2V0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1pbmRleC1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2Uta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLXRvLWluZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2JlZm9yZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jYWxsLWl0ZXJhdGVlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Nhc3QtcGF0aC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jbGFtcC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jbG9uZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jb25zdGFudHMuanMiLCJub2RlX21vZHVsZXMvcGVha28vY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NyZWF0ZS9jcmVhdGUtZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUvY3JlYXRlLWdldC1lbGVtZW50LWRpbWVuc2lvbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUvY3JlYXRlLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2RlZmF1bHQtdG8uanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmYXVsdHMuanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmaW5lLXByb3BlcnRpZXMuanMiLCJub2RlX21vZHVsZXMvcGVha28vZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9nZXQtZWxlbWVudC1oLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2dldC1lbGVtZW50LXcuanMiLCJub2RlX21vZHVsZXMvcGVha28vZ2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1hcnJheS1saWtlLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1hcnJheS1saWtlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWFycmF5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWtleS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1sZW5ndGguanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LWxpa2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXBsYWluLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1wcmltaXRpdmUuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtc3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXdpbmRvdy1saWtlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzc2V0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2l0ZXJhdGVlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2tleXMuanMiLCJub2RlX21vZHVsZXMvcGVha28vbWF0Y2hlcy1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9taXhpbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9ub29wLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL25vdy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9vbmNlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3Byb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3NldC1wcm90b3R5cGUtb2YuanMiLCJub2RlX21vZHVsZXMvcGVha28vc3VwcG9ydC9zdXBwb3J0LWRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9zdXBwb3J0L3N1cHBvcnQta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lci5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lc3RhbXAuanMiLCJub2RlX21vZHVsZXMvcGVha28vdG8ta2V5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3RvLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90eXBlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQGludGVyZmFjZSBJU2hhZGVyQXR0cmlidXRlXG4gKiBAcHJvcGVydHkge251bWJlcn0gbG9jYXRpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBuYW1lXG4gKiBAcHJvcGVydHkge251bWJlcn0gc2l6ZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHR5cGVcbiAqIEBzZWUgW2dldEF0dHJpYkxvY2F0aW9uXShodHRwczovL21kbi5pby9nZXRBdHRyaWJMb2NhdGlvbilcbiAqIEBzZWUgW1dlYkdMQWN0aXZlSW5mb10oaHR0cHM6Ly9tZG4uaW8vV2ViR0xBY3RpdmVJbmZvKVxuICovXG5cbi8qKlxuICogQGludGVyZmFjZSBJU2hhZGVyVW5pZm9ybVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGxvY2F0aW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHNpemVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB0eXBlXG4gKiBAc2VlIFtnZXRBY3RpdmVVbmlmb3JtXShodHRwczovL21kbi5pby9nZXRBY3RpdmVVbmlmb3JtKVxuICogQHNlZSBbV2ViR0xBY3RpdmVJbmZvXShodHRwczovL21kbi5pby9XZWJHTEFjdGl2ZUluZm8pXG4gKi9cblxudmFyIGNyZWF0ZVByb2dyYW0gPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9jcmVhdGVfcHJvZ3JhbScgKTtcbnZhciBjcmVhdGVTaGFkZXIgID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvY3JlYXRlX3NoYWRlcicgKTtcblxuLyoqXG4gKiDQktGL0YHQvtC60L7Rg9GA0L7QstC90LXQstGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBINC00LvRjyBXZWJHTFByb2dyYW0uXG4gKiBAY29uc3RydWN0b3IgdjYuU2hhZGVyUHJvZ3JhbVxuICogQHBhcmFtIHtJU2hhZGVyU291cmNlc30gICAgICAgIHNvdXJjZXMg0KjQtdC50LTQtdGA0Ysg0LTQu9GPINC/0YDQvtCz0YDQsNC80LzRiy5cbiAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAgICAgIFdlYkdMINC60L7QvdGC0LXQutGB0YIuXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5SZXF1aXJlIFwidjYuU2hhZGVyUHJvZ3JhbVwiPC9jYXB0aW9uPlxuICogdmFyIFNoYWRlclByb2dyYW0gPSByZXF1aXJlKCAndjYuanMvU2hhZGVyUHJvZ3JhbScgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlVzZSB3aXRob3V0IHJlbmRlcmVyPC9jYXB0aW9uPlxuICogLy8gUmVxdWlyZSBcInY2LmpzXCIgc2hhZGVycy5cbiAqIHZhciBzaGFkZXJzID0gcmVxdWlyZSggJ3Y2LmpzL3NoYWRlcnMnICk7XG4gKiAvLyBDcmVhdGUgYSBwcm9ncmFtLlxuICogdmFyIHByb2dyYW0gPSBuZXcgU2hhZGVyUHJvZ3JhbSggc2hhZGVycy5iYXNpYywgZ2xDb250ZXh0ICk7XG4gKi9cbmZ1bmN0aW9uIFNoYWRlclByb2dyYW0gKCBzb3VyY2VzLCBnbCApXG57XG4gIHZhciB2ZXJ0ID0gY3JlYXRlU2hhZGVyKCBzb3VyY2VzLnZlcnQsIGdsLlZFUlRFWF9TSEFERVIsIGdsICk7XG4gIHZhciBmcmFnID0gY3JlYXRlU2hhZGVyKCBzb3VyY2VzLmZyYWcsIGdsLkZSQUdNRU5UX1NIQURFUiwgZ2wgKTtcblxuICAvKipcbiAgICogV2ViR0wg0L/RgNC+0LPRgNCw0LzQvNCwINGB0L7Qt9C00LDQvdC90LDRjyDRgSDQv9C+0LzQvtGJ0YzRjiB7QGxpbmsgY3JlYXRlUHJvZ3JhbX0uXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge1dlYkdMUHJvZ3JhbX0gdjYuU2hhZGVyUHJvZ3JhbSNfcHJvZ3JhbVxuICAgKi9cbiAgdGhpcy5fcHJvZ3JhbSA9IGNyZWF0ZVByb2dyYW0oIHZlcnQsIGZyYWcsIGdsICk7XG5cbiAgLyoqXG4gICAqIFdlYkdMINC60L7QvdGC0LXQutGB0YIuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gdjYuU2hhZGVyUHJvZ3JhbSNfZ2xcbiAgICovXG4gIHRoaXMuX2dsID0gZ2w7XG5cbiAgLyoqXG4gICAqINCa0LXRiNC40YDQvtCy0LDQvdC90YvQtSDQsNGC0YDQuNCx0YPRgtGLINGI0LXQudC00LXRgNC+0LIuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuU2hhZGVyUHJvZ3JhbSNfYXR0cmlidXRlc1xuICAgKiBAc2VlIHY2LlNoYWRlclByb2dyYW0jZ2V0QXR0cmlidXRlXG4gICAqL1xuICB0aGlzLl9hdHRyaWJ1dGVzID0ge307XG5cbiAgLyoqXG4gICAqINCa0LXRiNC40YDQvtCy0LDQvdC90YvQtSDRhNC+0YDQvNGLICh1bmlmb3Jtcykg0YjQtdC50LTQtdGA0L7Qsi5cbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5TaGFkZXJQcm9ncmFtI191bmlmb3Jtc1xuICAgKiBAc2VlIHY2LlNoYWRlclByb2dyYW0jZ2V0VW5pZm9ybVxuICAgKi9cbiAgdGhpcy5fdW5pZm9ybXMgPSB7fTtcblxuICAvKipcbiAgICog0JjQvdC00LXQutGBINC/0L7RgdC70LXQtNC90LXQs9C+INC/0L7Qu9GD0YfQtdC90L3QvtCz0L4g0LDRgtGA0LjQsdGD0YLQsC5cbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5TaGFkZXJQcm9ncmFtI19hdHRyaWJ1dGVJbmRleFxuICAgKiBAc2VlIHY2LlNoYWRlclByb2dyYW0jZ2V0QXR0cmlidXRlXG4gICAqL1xuICB0aGlzLl9hdHRyaWJ1dGVJbmRleCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoIHRoaXMuX3Byb2dyYW0sIGdsLkFDVElWRV9BVFRSSUJVVEVTICk7XG5cbiAgLyoqXG4gICAqINCY0L3QtNC10LrRgSDQv9C+0YHQu9C10LTQvdC10Lkg0L/QvtC70YPRh9C10L3QvdC+0Lkg0YTQvtGA0LzRiyAodW5pZm9ybSkuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuU2hhZGVyUHJvZ3JhbSNfdW5pZm9ybUluZGV4XG4gICAqIEBzZWUgdjYuU2hhZGVyUHJvZ3JhbSNnZXRVbmlmb3JtXG4gICAqL1xuICB0aGlzLl91bmlmb3JtSW5kZXggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKCB0aGlzLl9wcm9ncmFtLCBnbC5BQ1RJVkVfVU5JRk9STVMgKTtcbn1cblxuU2hhZGVyUHJvZ3JhbS5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jZ2V0QXR0cmlidXRlXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgIG5hbWUg0J3QsNC30LLQsNC90LjQtSDQsNGC0YDQuNCx0YPRgtCwLlxuICAgKiBAcmV0dXJuIHtJU2hhZGVyQXR0cmlidXRlfSAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC00LDQvdC90YvQtSDQviDQsNGC0YDQuNCx0YPRgtC1LlxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgbG9jYXRpb24gPSBwcm9ncmFtLmdldEF0dHJpYnV0ZSggJ2Fwb3MnICkubG9jYXRpb247XG4gICAqL1xuICBnZXRBdHRyaWJ1dGU6IGZ1bmN0aW9uIGdldEF0dHJpYnV0ZSAoIG5hbWUgKVxuICB7XG4gICAgdmFyIGF0dHIgPSB0aGlzLl9hdHRyaWJ1dGVzWyBuYW1lIF07XG4gICAgdmFyIGluZm87XG5cbiAgICBpZiAoIGF0dHIgKSB7XG4gICAgICByZXR1cm4gYXR0cjtcbiAgICB9XG5cbiAgICB3aGlsZSAoIC0tdGhpcy5fYXR0cmlidXRlSW5kZXggPj0gMCApIHtcbiAgICAgIGluZm8gPSB0aGlzLl9nbC5nZXRBY3RpdmVBdHRyaWIoIHRoaXMuX3Byb2dyYW0sIHRoaXMuX2F0dHJpYnV0ZUluZGV4ICk7XG5cbiAgICAgIGF0dHIgPSB7XG4gICAgICAgIGxvY2F0aW9uOiB0aGlzLl9nbC5nZXRBdHRyaWJMb2NhdGlvbiggdGhpcy5fcHJvZ3JhbSwgbmFtZSApLFxuICAgICAgICBuYW1lOiBpbmZvLm5hbWUsXG4gICAgICAgIHNpemU6IGluZm8uc2l6ZSxcbiAgICAgICAgdHlwZTogaW5mby50eXBlXG4gICAgICB9O1xuXG4gICAgICB0aGlzLl9hdHRyaWJ1dGVzWyBhdHRyLm5hbWUgXSA9IGF0dHI7XG5cbiAgICAgIGlmICggYXR0ci5uYW1lID09PSBuYW1lICkge1xuICAgICAgICByZXR1cm4gYXR0cjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBSZWZlcmVuY2VFcnJvciggJ05vIFwiJyArIG5hbWUgKyAnXCIgYXR0cmlidXRlIGZvdW5kJyApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jZ2V0VW5pZm9ybVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgbmFtZSDQndCw0LfQstCw0L3QuNC1INGE0L7RgNC80YsgKHVuaWZvcm0pLlxuICAgKiBAcmV0dXJuIHtJU2hhZGVyVW5pZm9ybX0gICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQtNCw0L3QvdGL0LUg0L4g0YTQvtGA0LzQtSAodW5pZm9ybSkuXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBsb2NhdGlvbiA9IHByb2dyYW0uZ2V0VW5pZm9ybSggJ3Vjb2xvcicgKS5sb2NhdGlvbjtcbiAgICovXG4gIGdldFVuaWZvcm06IGZ1bmN0aW9uIGdldFVuaWZvcm0gKCBuYW1lIClcbiAge1xuICAgIHZhciB1bmlmb3JtID0gdGhpcy5fdW5pZm9ybXNbIG5hbWUgXTtcbiAgICB2YXIgaW5kZXgsIGluZm87XG5cbiAgICBpZiAoIHVuaWZvcm0gKSB7XG4gICAgICByZXR1cm4gdW5pZm9ybTtcbiAgICB9XG5cbiAgICB3aGlsZSAoIC0tdGhpcy5fdW5pZm9ybUluZGV4ID49IDAgKSB7XG4gICAgICBpbmZvID0gdGhpcy5fZ2wuZ2V0QWN0aXZlVW5pZm9ybSggdGhpcy5fcHJvZ3JhbSwgdGhpcy5fdW5pZm9ybUluZGV4ICk7XG5cbiAgICAgIHVuaWZvcm0gPSB7XG4gICAgICAgIGxvY2F0aW9uOiB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24oIHRoaXMuX3Byb2dyYW0sIGluZm8ubmFtZSApLFxuICAgICAgICBzaXplOiBpbmZvLnNpemUsXG4gICAgICAgIHR5cGU6IGluZm8udHlwZVxuICAgICAgfTtcblxuICAgICAgaWYgKCBpbmZvLnNpemUgPiAxICYmIH4gKCBpbmRleCA9IGluZm8ubmFtZS5pbmRleE9mKCAnWycgKSApICkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWJpdHdpc2VcbiAgICAgICAgdW5pZm9ybS5uYW1lID0gaW5mby5uYW1lLnNsaWNlKCAwLCBpbmRleCApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5pZm9ybS5uYW1lID0gaW5mby5uYW1lO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl91bmlmb3Jtc1sgdW5pZm9ybS5uYW1lIF0gPSB1bmlmb3JtO1xuXG4gICAgICBpZiAoIHVuaWZvcm0ubmFtZSA9PT0gbmFtZSApIHtcbiAgICAgICAgcmV0dXJuIHVuaWZvcm07XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgUmVmZXJlbmNlRXJyb3IoICdObyBcIicgKyBuYW1lICsgJ1wiIHVuaWZvcm0gZm91bmQnICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuU2hhZGVyUHJvZ3JhbSNzZXRBdHRyaWJ1dGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIFtXZWJHTFJlbmRlcmluZ0NvbnRleHQjZW5hYmxlVmVydGV4QXR0cmliQXJyYXldKGh0dHBzOi8vbWRuLmlvL2VuYWJsZVZlcnRleEF0dHJpYkFycmF5KVxuICAgKiBAc2VlIFtXZWJHTFJlbmRlcmluZ0NvbnRleHQjdmVydGV4QXR0cmliUG9pbnRlcl0oaHR0cHM6Ly9tZG4uaW8vdmVydGV4QXR0cmliUG9pbnRlcilcbiAgICogQGV4YW1wbGVcbiAgICogcHJvZ3JhbS5zZXRBdHRyaWJ1dGUoICdhcG9zJywgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwICk7XG4gICAqL1xuICBzZXRBdHRyaWJ1dGU6IGZ1bmN0aW9uIHNldEF0dHJpYnV0ZSAoIG5hbWUsIHNpemUsIHR5cGUsIG5vcm1hbGl6ZWQsIHN0cmlkZSwgb2Zmc2V0IClcbiAge1xuICAgIHZhciBsb2NhdGlvbiA9IHRoaXMuZ2V0QXR0cmlidXRlKCBuYW1lICkubG9jYXRpb247XG4gICAgdGhpcy5fZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoIGxvY2F0aW9uICk7XG4gICAgdGhpcy5fZ2wudmVydGV4QXR0cmliUG9pbnRlciggbG9jYXRpb24sIHNpemUsIHR5cGUsIG5vcm1hbGl6ZWQsIHN0cmlkZSwgb2Zmc2V0ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuU2hhZGVyUHJvZ3JhbSNzZXRVbmlmb3JtXG4gICAqIEBwYXJhbSAge3N0cmluZ30gbmFtZSAg0J3QsNC30LLQsNC90LjQtSDRhNC+0YDQvNGLICh1bmlmb3JtKS5cbiAgICogQHBhcmFtICB7YW55fSAgICB2YWx1ZSDQndC+0LLQvtC1INC30L3QsNGH0LXQvdC40LUg0YTQvtGA0LzRiyAodW5pZm9ybSkuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogcHJvZ3JhbS5zZXRVbmlmb3JtKCAndWNvbG9yJywgWyAyNTUsIDAsIDAsIDEgXSApO1xuICAgKi9cbiAgc2V0VW5pZm9ybTogZnVuY3Rpb24gc2V0VW5pZm9ybSAoIG5hbWUsIHZhbHVlIClcbiAge1xuICAgIHZhciB1bmlmb3JtID0gdGhpcy5nZXRVbmlmb3JtKCBuYW1lICk7XG4gICAgdmFyIF9nbCAgICAgPSB0aGlzLl9nbDtcblxuICAgIHN3aXRjaCAoIHVuaWZvcm0udHlwZSApIHtcbiAgICAgIGNhc2UgX2dsLkJPT0w6XG4gICAgICBjYXNlIF9nbC5JTlQ6XG4gICAgICAgIGlmICggdW5pZm9ybS5zaXplID4gMSApIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTFpdiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTFpKCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfZ2wuRkxPQVQ6XG4gICAgICAgIGlmICggdW5pZm9ybS5zaXplID4gMSApIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTFmdiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTFmKCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfZ2wuRkxPQVRfTUFUMjpcbiAgICAgICAgX2dsLnVuaWZvcm1NYXRyaXgyZnYoIHVuaWZvcm0ubG9jYXRpb24sIGZhbHNlLCB2YWx1ZSApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUX01BVDM6XG4gICAgICAgIF9nbC51bmlmb3JtTWF0cml4M2Z2KCB1bmlmb3JtLmxvY2F0aW9uLCBmYWxzZSwgdmFsdWUgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIF9nbC5GTE9BVF9NQVQ0OlxuICAgICAgICBfZ2wudW5pZm9ybU1hdHJpeDRmdiggdW5pZm9ybS5sb2NhdGlvbiwgZmFsc2UsIHZhbHVlICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfZ2wuRkxPQVRfVkVDMjpcbiAgICAgICAgaWYgKCB1bmlmb3JtLnNpemUgPiAxICkge1xuICAgICAgICAgIF9nbC51bmlmb3JtMmZ2KCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9nbC51bmlmb3JtMmYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlWyAwIF0sIHZhbHVlWyAxIF0gKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUX1ZFQzM6XG4gICAgICAgIGlmICggdW5pZm9ybS5zaXplID4gMSApIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTNmdiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTNmKCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZVsgMCBdLCB2YWx1ZVsgMSBdLCB2YWx1ZVsgMiBdICk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIF9nbC5GTE9BVF9WRUM0OlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm00ZnYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm00ZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWVbIDAgXSwgdmFsdWVbIDEgXSwgdmFsdWVbIDIgXSwgdmFsdWVbIDMgXSApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCAnVGhlIHVuaWZvcm0gdHlwZSBpcyBub3Qgc3VwcG9ydGVkIChcIicgKyBuYW1lICsgJ1wiKScgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5TaGFkZXJQcm9ncmFtI3VzZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgW1dlYkdMUmVuZGVyaW5nQ29udGV4dCN1c2VQcm9ncmFtXShodHRwczovL21kbi5pby91c2VQcm9ncmFtKVxuICAgKiBAZXhhbXBsZVxuICAgKiBwcm9ncmFtLnVzZSgpO1xuICAgKi9cbiAgdXNlOiBmdW5jdGlvbiB1c2UgKClcbiAge1xuICAgIHRoaXMuX2dsLnVzZVByb2dyYW0oIHRoaXMuX3Byb2dyYW0gKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb25zdHJ1Y3RvcjogU2hhZGVyUHJvZ3JhbVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaGFkZXJQcm9ncmFtO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTGlnaHRFbWl0dGVyID0gcmVxdWlyZSggJ2xpZ2h0X2VtaXR0ZXInICk7XG52YXIgdGltZXN0YW1wICAgID0gcmVxdWlyZSggJ3BlYWtvL3RpbWVzdGFtcCcgKTtcbnZhciB0aW1lciAgICAgICAgPSByZXF1aXJlKCAncGVha28vdGltZXInICk7XG5cbi8qKlxuICog0K3RgtC+0YIg0LrQu9Cw0YHRgSDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0LTQu9GPINC30LDRhtC40LrQu9C40LLQsNC90LjRjyDQsNC90LjQvNCw0YbQuNC4INCy0LzQtdGB0YLQviBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYC5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5UaWNrZXJcbiAqIEBleHRlbmRzIHtMaWdodEVtaXR0ZXJ9XG4gKiBAZmlyZXMgdXBkYXRlXG4gKiBAZmlyZXMgcmVuZGVyXG4gKiBAZXhhbXBsZVxuICogdmFyIFRpY2tlciA9IHJlcXVpcmUoICd2Ni5qcy9UaWNrZXInICk7XG4gKiB2YXIgdGlja2VyID0gbmV3IFRpY2tlcigpO1xuICogQGV4YW1wbGUgPGNhcHRpb24+XCJ1cGRhdGVcIiBldmVudC48L2NhcHRpb24+XG4gKiAvLyBGaXJlcyBldmVyeXRpbWUgYW4gYXBwbGljYXRpb24gc2hvdWxkIGJlIHVwZGF0ZWQuXG4gKiAvLyBEZXBlbmRzIG9uIG1heGltdW0gRlBTLlxuICogdGlja2VyLm9uKCAndXBkYXRlJywgZnVuY3Rpb24gKCBlbGFwc2VkVGltZSApIHtcbiAqICAgc2hhcGUucm90YXRpb24gKz0gMTAgKiBlbGFwc2VkVGltZTtcbiAqIH0gKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlwicmVuZGVyXCIgZXZlbnQuPC9jYXB0aW9uPlxuICogLy8gRmlyZXMgZXZlcnl0aW1lIGFuIGFwcGxpY2F0aW9uIHNob3VsZCBiZSByZW5kZXJlZC5cbiAqIC8vIFVubGlrZSBcInVwZGF0ZVwiLCBpbmRlcGVuZGVudCBmcm9tIG1heGltdW0gRlBTLlxuICogdGlja2VyLm9uKCAncmVuZGVyJywgZnVuY3Rpb24gKCkge1xuICogICByZW5kZXJlci5yb3RhdGUoIHNoYXBlLnJvdGF0aW9uICk7XG4gKiB9ICk7XG4gKi9cbmZ1bmN0aW9uIFRpY2tlciAoKVxue1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgTGlnaHRFbWl0dGVyLmNhbGwoIHRoaXMgKTtcblxuICB0aGlzLmxhc3RSZXF1ZXN0QW5pbWF0aW9uRnJhbWVJRCA9IDA7XG4gIHRoaXMubGFzdFJlcXVlc3RUaW1lID0gMDtcbiAgdGhpcy5za2lwcGVkVGltZSA9IDA7XG4gIHRoaXMudG90YWxUaW1lID0gMDtcbiAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gIHRoaXMuc2V0dGluZ3MgPSB7fTtcblxuICAvKipcbiAgICog0JfQsNC/0YPRgdC60LDQtdGCINGG0LjQutC7INCw0L3QuNC80LDRhtC40LguXG4gICAqIEBtZXRob2QgdjYuVGlja2VyI3N0YXJ0XG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogdGlja2VyLnN0YXJ0KCk7XG4gICAqL1xuICBmdW5jdGlvbiBzdGFydCAoIF9ub3cgKVxuICB7XG4gICAgdmFyIGVsYXBzZWRUaW1lLCBmcmFtZVRpbWU7XG5cbiAgICBpZiAoICEgc2VsZi5ydW5uaW5nICkge1xuICAgICAgaWYgKCAhIF9ub3cgKSB7XG4gICAgICAgIHNlbGYubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlEID0gdGltZXIucmVxdWVzdCggc3RhcnQgKTtcbiAgICAgICAgc2VsZi5sYXN0UmVxdWVzdFRpbWUgPSB0aW1lc3RhbXAoKTtcbiAgICAgICAgc2VsZi5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taW52YWxpZC10aGlzXG4gICAgfVxuXG4gICAgaWYgKCAhIF9ub3cgKSB7XG4gICAgICByZXR1cm4gdGhpczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1pbnZhbGlkLXRoaXNcbiAgICB9XG5cbiAgICBlbGFwc2VkVGltZSA9IE1hdGgubWluKCAxLCAoIF9ub3cgLSBzZWxmLmxhc3RSZXF1ZXN0VGltZSApICogMC4wMDEgKTtcblxuICAgIHNlbGYuc2tpcHBlZFRpbWUgKz0gZWxhcHNlZFRpbWU7XG4gICAgc2VsZi50b3RhbFRpbWUgICArPSBlbGFwc2VkVGltZTtcblxuICAgIGZyYW1lVGltZSA9IHNlbGYuc2V0dGluZ3NbICdmcmFtZSB0aW1lJyBdO1xuXG4gICAgd2hpbGUgKCBzZWxmLnNraXBwZWRUaW1lID49IGZyYW1lVGltZSAmJiBzZWxmLnJ1bm5pbmcgKSB7XG4gICAgICBzZWxmLnNraXBwZWRUaW1lIC09IGZyYW1lVGltZTtcbiAgICAgIHNlbGYuZW1pdCggJ3VwZGF0ZScsIGZyYW1lVGltZSwgX25vdyApO1xuICAgIH1cblxuICAgIHNlbGYuZW1pdCggJ3JlbmRlcicsIGVsYXBzZWRUaW1lLCBfbm93ICk7XG4gICAgc2VsZi5sYXN0UmVxdWVzdFRpbWUgPSBfbm93O1xuICAgIHNlbGYubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlEID0gdGltZXIucmVxdWVzdCggc3RhcnQgKTtcblxuICAgIHJldHVybiB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWludmFsaWQtdGhpc1xuICB9XG5cbiAgdGhpcy5zdGFydCA9IHN0YXJ0O1xuICB0aGlzLnNldCggJ0ZQUycsIDYwICk7XG59XG5cblRpY2tlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBMaWdodEVtaXR0ZXIucHJvdG90eXBlICk7XG5UaWNrZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVGlja2VyO1xuXG4vKipcbiAqIFNldCBuZXcgdmFsdWUgb2YgYSBzZXR0aW5nLlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjc2V0XG4gKiBAcGFyYW0gIHtzdHJpbmd9IHNldHRpbmcgVGhlIHNldHRpbmdgcyBrZXksIGUuZy46IFwiRlBTXCIsIFwiZnJhbWUgdGltZVwiLlxuICogQHBhcmFtICB7YW55fSAgICB2YWx1ZSAgIE5ldyBzZXR0aW5nYHMgdmFsdWUuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgUmV0dXJucyBub3RoaW5nLlxuICogQGV4YW1wbGVcbiAqIHRpY2tlci5zZXQoICdGUFMnLCAxMjAgKTtcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQgKCBzZXR0aW5nLCB2YWx1ZSApXG57XG4gIENIRUNLKCBzZXR0aW5nICk7XG5cbiAgaWYgKCBzZXR0aW5nID09PSAnRlBTJyApIHtcbiAgICB0aGlzLnNldHRpbmdzWyAnZnJhbWUgdGltZScgXSA9IDEgLyB2YWx1ZTtcbiAgfSBlbHNlIGlmICggc2V0dGluZyA9PT0gJ2ZyYW1lIHRpbWUnICkge1xuICAgIHRoaXMuc2V0dGluZ3NbICdGUFMnIF0gPSAxIC8gdmFsdWU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZG90LW5vdGF0aW9uXG4gIH1cblxuICB0aGlzLnNldHRpbmdzWyBzZXR0aW5nIF0gPSB2YWx1ZTtcbn07XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgdmFsdWUgb2YgYSBzZXR0aW5nLlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjZ2V0XG4gKiBAcGFyYW0gIHtzdHJpbmd9IHNldHRpbmcgVGhlIHNldHRpbmdgcyBrZXksIGUuZy46IFwiRlBTXCIsIFwiZnJhbWUgdGltZVwiLlxuICogQHJldHVybiB7YW55fSAgICAgICAgICAgIFRoZSBzZXR0aW5nYHMgdmFsdWUuXG4gKiBAZXhhbXBsZVxuICogdmFyIGZyYW1lVGltZSA9IHRpY2tlci5nZXQoICdmcmFtZSB0aW1lJyApO1xuICovXG5UaWNrZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAoIHNldHRpbmcgKVxue1xuICBDSEVDSyggc2V0dGluZyApO1xuICByZXR1cm4gdGhpcy5zZXR0aW5nc1sgc2V0dGluZyBdO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlRpY2tlciNjbGVhclxuICogQGNoYWluYWJsZVxuICovXG5UaWNrZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIgKClcbntcbiAgdGhpcy5za2lwcGVkVGltZSA9IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQntGB0YLQsNC90LDQstC70LjQstCw0LXRgiDQsNC90LjQvNCw0YbQuNGOLlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjc3RvcFxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIHRpY2tlci5vbiggJ3JlbmRlcicsIGZ1bmN0aW9uICgpIHtcbiAqICAgLy8gU3RvcCB0aGUgdGlja2VyIGFmdGVyIGZpdmUgc2Vjb25kcy5cbiAqICAgaWYgKCB0aGlzLnRvdGFsVGltZSA+PSA1ICkge1xuICogICAgIHRpY2tlci5zdG9wKCk7XG4gKiAgIH1cbiAqIH0gKTtcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gc3RvcCAoKVxue1xuICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBDSEVDSyAoIHNldHRpbmcgKVxue1xuICBzd2l0Y2ggKCBzZXR0aW5nICkge1xuICAgIGNhc2UgJ2ZyYW1lIHRpbWUnOlxuICAgIGNhc2UgJ0ZQUyc6XG4gICAgICByZXR1cm47XG4gIH1cblxuICB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHNldHRpbmcga2V5OiAnICsgc2V0dGluZyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRpY2tlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1hdDMgPSByZXF1aXJlKCAnLi9tYXRoL21hdDMnICk7XG5cbmZ1bmN0aW9uIFRyYW5zZm9ybSAoKVxue1xuICB0aGlzLm1hdHJpeCA9IG1hdDMuaWRlbnRpdHkoKTtcbiAgdGhpcy5faW5kZXggPSAtMTtcbiAgdGhpcy5fc3RhY2sgPSBbXTtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZSA9IHtcbiAgc2F2ZTogZnVuY3Rpb24gc2F2ZSAoKVxuICB7XG4gICAgaWYgKCArK3RoaXMuX2luZGV4IDwgdGhpcy5fc3RhY2subGVuZ3RoICkge1xuICAgICAgbWF0My5jb3B5KCB0aGlzLl9zdGFja1sgdGhpcy5faW5kZXggXSwgdGhpcy5tYXRyaXggKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RhY2sucHVzaCggbWF0My5jbG9uZSggdGhpcy5tYXRyaXggKSApO1xuICAgIH1cbiAgfSxcblxuICByZXN0b3JlOiBmdW5jdGlvbiByZXN0b3JlICgpXG4gIHtcbiAgICBpZiAoIHRoaXMuX2luZGV4ID49IDAgKSB7XG4gICAgICBtYXQzLmNvcHkoIHRoaXMubWF0cml4LCB0aGlzLl9zdGFja1sgdGhpcy5faW5kZXgtLSBdICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hdDMuc2V0SWRlbnRpdHkoIHRoaXMubWF0cml4ICk7XG4gICAgfVxuICB9LFxuXG4gIHNldFRyYW5zZm9ybTogZnVuY3Rpb24gc2V0VHJhbnNmb3JtICggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxuICB7XG4gICAgbWF0My5zZXRUcmFuc2Zvcm0oIHRoaXMubWF0cml4LCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApO1xuICB9LFxuXG4gIHRyYW5zbGF0ZTogZnVuY3Rpb24gdHJhbnNsYXRlICggeCwgeSApXG4gIHtcbiAgICBtYXQzLnRyYW5zbGF0ZSggdGhpcy5tYXRyaXgsIHgsIHkgKTtcbiAgfSxcblxuICByb3RhdGU6IGZ1bmN0aW9uIHJvdGF0ZSAoIGFuZ2xlIClcbiAge1xuICAgIG1hdDMucm90YXRlKCB0aGlzLm1hdHJpeCwgYW5nbGUgKTtcbiAgfSxcblxuICBzY2FsZTogZnVuY3Rpb24gc2NhbGUgKCB4LCB5IClcbiAge1xuICAgIG1hdDMuc2NhbGUoIHRoaXMubWF0cml4LCB4LCB5ICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCf0YDQuNC80LXQvdGP0LXRgiBcInRyYW5zZm9ybWF0aW9uIG1hdHJpeFwiINC40Lcg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNGFINC/0LDRgNCw0LzQtdGC0YDQvtCyINC90LAg0YLQtdC60YPRidC40LkgXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIi5cbiAgICogQG1ldGhvZCB2Ni5UcmFuc2Zvcm0jdHJhbnNmb3JtXG4gICAqIEBwYXJhbSAge251bWJlcn0gIG0xMSBYIHNjYWxlLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMTIgWCBza2V3LlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMjEgWSBza2V3LlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMjIgWSBzY2FsZS5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgZHggIFggdHJhbnNsYXRlLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBkeSAgWSB0cmFuc2xhdGUuXG4gICAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGVcbiAgICogLy8gQXBwbHkgc2NhbGVkIHR3aWNlIFwidHJhbnNmb3JtYXRpb24gbWF0cml4XCIuXG4gICAqIHRyYW5zZm9ybS50cmFuc2Zvcm0oIDIsIDAsIDAsIDIsIDAsIDAgKTtcbiAgICovXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24gdHJhbnNmb3JtICggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxuICB7XG4gICAgbWF0My50cmFuc2Zvcm0oIHRoaXMubWF0cml4LCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBUcmFuc2Zvcm1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSggJ3BlYWtvL2RlZmF1bHRzJyApO1xudmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG4vKipcbiAqINCa0LvQsNGB0YEg0LrQsNC80LXRgNGLLiDQrdGC0L7RgiDQutC70LDRgdGBINGD0LTQvtCx0LXQvSDQtNC70Y8g0YHQvtC30LTQsNC90LjRjyDQutCw0LzQtdGA0YssINC60L7RgtC+0YDQsNGPINC00L7Qu9C20L3QsCDQsdGL0YLRjFxuICog0L3QsNC/0YDQsNCy0LvQtdC90L3QsCDQvdCwINC+0L/RgNC10LTQtdC70LXQvdC90YvQuSDQvtCx0YrQtdC60YIg0LIg0L/RgNC40LvQvtC20LXQvdC40LgsINC90LDQv9GA0LjQvNC10YA6INC90LAg0LzQsNGI0LjQvdGDINCyXG4gKiDQs9C+0L3QvtGH0L3QvtC5INC40LPRgNC1LiDQmtCw0LzQtdGA0LAg0LHRg9C00LXRgiDRgdCw0LzQsCDQv9C70LDQstC90L4g0Lgg0YEg0LDQvdC40LzQsNGG0LjQtdC5INC90LDQv9GA0LDQstC70Y/RgtGM0YHRjyDQvdCwINC90YPQttC90YvQuVxuICog0L7QsdGK0LXQutGCLiDQldGB0YLRjCDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINCw0L3QuNC80LjRgNC+0LLQsNC90L3QvtCz0L4g0L7RgtC00LDQu9C10L3QuNGPINC40LvQuCDQv9GA0LjQsdC70LjQttC10L3QuNGPINC60LDQvNC10YDRiy5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5DYW1lcmFcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10g0J/QsNGA0LDQvNC10YLRgNGLINC00LvRjyDRgdC+0LfQtNCw0L3QuNGPINC60LDQvNC10YDRiywg0YHQvNC+0YLRgNC40YLQtSB7QGxpbmsgdjYuc2V0dGluZ3MuY2FtZXJhfS5cbiAqIEBleGFtcGxlIDxjYXB0aW9uPlJlcXVpcmUgXCJ2Ni5DYW1lcmFcIjwvY2FwdGlvbj5cbiAqIHZhciBDYW1lcmEgPSByZXF1aXJlKCAndjYuanMvY29yZS9jYW1lcmEvQ2FtZXJhJyApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRlIGFuIGluc3RhbmNlPC9jYXB0aW9uPlxuICogdmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEoKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhbiBpbnN0YW5jZSB3aXRoIG9wdGlvbnM8L2NhcHRpb24+XG4gKiB2YXIgY2FtZXJhID0gbmV3IENhbWVyYSgge1xuICogICBzZXR0aW5nczoge1xuICogICAgIHNwZWVkOiB7XG4gKiAgICAgICB4OiAwLjE1LFxuICogICAgICAgeTogMC4xNVxuICogICAgIH1cbiAqICAgfVxuICogfSApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRlIGFuIGluc3RhbmNlIHdpdGggcmVuZGVyZXI8L2NhcHRpb24+XG4gKiB2YXIgY2FtZXJhID0gbmV3IENhbWVyYSgge1xuICogICByZW5kZXJlcjogcmVuZGVyZXJcbiAqIH0gKTtcbiAqL1xuZnVuY3Rpb24gQ2FtZXJhICggb3B0aW9ucyApXG57XG4gIHZhciB4LCB5O1xuICBvcHRpb25zID0gZGVmYXVsdHMoIHNldHRpbmdzLCBvcHRpb25zICk7XG4gIC8qKlxuICAgKiDQndCw0YHRgtGA0L7QudC60Lgg0LrQsNC80LXRgNGLLCDRgtCw0LrQuNC1INC60LDQuiDRgdC60L7RgNC+0YHRgtGMINCw0L3QuNC80LDRhtC40Lgg0LjQu9C4INC80LDRgdGI0YLQsNCxLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LkNhbWVyYSNzZXR0aW5nc1xuICAgKiBAc2VlIHY2LnNldHRpbmdzLmNhbWVyYS5zZXR0aW5nc1xuICAgKi9cbiAgdGhpcy5zZXR0aW5ncyA9IG9wdGlvbnMuc2V0dGluZ3M7XG4gIGlmICggb3B0aW9ucy5yZW5kZXJlciApIHtcbiAgICAvKipcbiAgICAgKiDQoNC10L3QtNC10YDQtdGALlxuICAgICAqIEBtZW1iZXIge3Y2LkFic3RyYWN0UmVuZGVyZXJ8dm9pZH0gdjYuQ2FtZXJhI3JlbmRlcmVyXG4gICAgICovXG4gICAgdGhpcy5yZW5kZXJlciA9IG9wdGlvbnMucmVuZGVyZXI7XG4gIH1cbiAgaWYgKCAhIHRoaXMuc2V0dGluZ3Mub2Zmc2V0ICkge1xuICAgIGlmICggdGhpcy5yZW5kZXJlciApIHtcbiAgICAgIHggPSB0aGlzLnJlbmRlcmVyLncgKiAwLjU7XG4gICAgICB5ID0gdGhpcy5yZW5kZXJlci5oICogMC41O1xuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gMDtcbiAgICAgIHkgPSAwO1xuICAgIH1cbiAgICB0aGlzLnNldHRpbmdzLm9mZnNldCA9IHtcbiAgICAgIHg6IHgsXG4gICAgICB5OiB5XG4gICAgfTtcbiAgfVxuICAvKipcbiAgICog0J7QsdGK0LXQutGCLCDQvdCwINC60L7RgtC+0YDRi9C5INC90LDQv9GA0LDQstC70LXQvdCwINC60LDQvNC10YDQsC5cbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7b2JqZWN0P30gdjYuQ2FtZXJhI19kZXN0aW5hdGlvblxuICAgKiBAc2VlIHY2LkNhbWVyYSNsb29rQXRcbiAgICovXG4gIHRoaXMuX2Rlc3RpbmF0aW9uID0gbnVsbDtcbiAgLyoqXG4gICAqINCh0LLQvtC50YHRgtCy0L4sINC60L7RgtC+0YDQvtC1INC90LDQtNC+INCx0YDQsNGC0Ywg0LjQtyB7QGxpbmsgdjYuQ2FtZXJhI19kZXN0aW5hdGlvbn0uXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge3N0cmluZz99IHY2LkNhbWVyYSNfZGVzdGluYXRpb25LZXlcbiAgICogQHNlZSB2Ni5DYW1lcmEjbG9va0F0XG4gICAqL1xuICB0aGlzLl9kZXN0aW5hdGlvbktleSA9IG51bGw7XG4gIC8qKlxuICAgKiDQotC10LrRg9GJ0Y/RjyDQv9C+0LfQuNGG0LjRjyDQutCw0LzQtdGA0YsgKNGB0Y7QtNCwINC90LDQv9GA0LDQstC70LXQvdCwINC60LDQvNC10YDQsCkuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge0lWZWN0b3IyRH0gdjYuQ2FtZXJhI19jdXJyZW50UG9zaXRpb25cbiAgICovXG4gIHRoaXMuX2N1cnJlbnRQb3NpdGlvbiA9IHtcbiAgICB4OiAwLFxuICAgIHk6IDBcbiAgfTtcbn1cbkNhbWVyYS5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQvtCx0YrQtdC60YIsINC90LAg0LrQvtGC0L7RgNGL0Lkg0LrQsNC80LXRgNCwINC00L7Qu9C20L3QsCDQsdGL0YLRjCDQvdCw0L/RgNCw0LLQu9C10L3QsC5cbiAgICogQHByaXZhdGVcbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjX2dldERlc3RpbmF0aW9uXG4gICAqIEByZXR1cm4ge0lWZWN0b3IyRD99INCe0LHRitC10LrRgiDQuNC70LggXCJudWxsXCIuXG4gICAqL1xuICBfZ2V0RGVzdGluYXRpb246IGZ1bmN0aW9uIF9nZXREZXN0aW5hdGlvbiAoKVxuICB7XG4gICAgdmFyIF9kZXN0aW5hdGlvbktleSA9IHRoaXMuX2Rlc3RpbmF0aW9uS2V5O1xuICAgIGlmICggX2Rlc3RpbmF0aW9uS2V5ID09PSBudWxsICkge1xuICAgICAgcmV0dXJuIHRoaXMuX2Rlc3RpbmF0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZGVzdGluYXRpb25bIF9kZXN0aW5hdGlvbktleSBdO1xuICB9LFxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIg0L3QsNGB0YLRgNC+0LnQutC4LlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNzZXRcbiAgICogQHBhcmFtICB7c3RyaW5nfSBzZXR0aW5nINCY0LzRjyDQvdCw0YHRgtGA0L7QudC60Lg6IFwiem9vbS1vdXQgc3BlZWRcIiwgXCJ6b29tLWluIHNwZWVkXCIsIFwib2Zmc2V0XCIsIFwic3BlZWRcIiwgXCJ6b29tXCIuXG4gICAqIEBwYXJhbSAge2FueX0gICAgdmFsdWUgICDQndC+0LLQvtC1INC30L3QsNGH0LXQvdC40LUg0L3QsNGB0YLRgNC+0LnQutC4LlxuICAgKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30YDQsNGJ0LDQtdGCLlxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTZXQgem9vbS1pbiBzcGVlZCBzZXR0aW5nIHRvIDAuMDAyNSB3aXRoIGxpbmVhciBmbGFnIChkZWZhdWx0OiB0cnVlKS5cbiAgICogY2FtZXJhLnNldCggJ3pvb20taW4gc3BlZWQnLCB7IHZhbHVlOiAwLjAwMjUsIGxpbmVhcjogdHJ1ZSB9ICk7XG4gICAqIC8vIFR1cm4gb2ZmIGxpbmVhciBmbGFnLlxuICAgKiBjYW1lcmEuc2V0KCAnem9vbS1pbiBzcGVlZCcsIHsgbGluZWFyOiBmYWxzZSB9ICk7XG4gICAqIC8vIFNldCB6b29tIHNldHRpbmcgdG8gMSB3aXRoIHJhbmdlIFsgMC43NSAuLiAxLjEyNSBdLlxuICAgKiBjYW1lcmEuc2V0KCAnem9vbScsIHsgdmFsdWU6IDEsIG1pbjogMC43NSwgbWF4OiAxLjEyNSB9ICk7XG4gICAqIC8vIFNldCBjYW1lcmEgc3BlZWQuXG4gICAqIGNhbWVyYS5zZXQoICdzcGVlZCcsIHsgeDogMC4xLCB5OiAwLjEgfSApO1xuICAgKi9cbiAgc2V0OiBmdW5jdGlvbiBzZXQgKCBzZXR0aW5nLCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgc2V0dGluZ18gPSB0aGlzLmdldCggc2V0dGluZyApO1xuICAgIGZvciAoIHZhciBfa2V5cyA9IE9iamVjdC5rZXlzKCB2YWx1ZSApLCBfaSA9IDAsIF9sID0gX2tleXMubGVuZ3RoOyBfaSA8IF9sOyArK19pICkge1xuICAgICAgc2V0dGluZ19bIF9rZXlzWyBfaSBdIF0gPSB2YWx1ZVsgX2tleXNbIF9pIF0gXTtcbiAgICB9XG4gIH0sXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQt9C90LDRh9C10L3QuNC1INC90LDRgdGC0YDQvtC50LrQuC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjZ2V0XG4gICAqIEBwYXJhbSAge3N0cmluZ30gc2V0dGluZyDQmNC80Y8g0L3QsNGB0YLRgNC+0LnQutC4OiBcInpvb20tb3V0IHNwZWVkXCIsIFwiem9vbS1pbiBzcGVlZFwiLCBcIm9mZnNldFwiLCBcInNwZWVkXCIsIFwiem9vbVwiLlxuICAgKiBAcmV0dXJuIHthbnl9ICAgICAgICAgICAg0JfQvdCw0YfQtdC90LjQtSDQvdCw0YHRgtGA0L7QudC60LguXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEdldCBjdXJyZW50IGNhbWVyYSB6b29tLlxuICAgKiB2YXIgem9vbSA9IGNhbWVyYS5nZXQoICd6b29tJyApLnZhbHVlO1xuICAgKi9cbiAgZ2V0OiBmdW5jdGlvbiBnZXQgKCBzZXR0aW5nIClcbiAge1xuICAgIENIRUNLKCBzZXR0aW5nICk7XG4gICAgcmV0dXJuIHRoaXMuc2V0dGluZ3NbIHNldHRpbmcgXTtcbiAgfSxcbiAgLyoqXG4gICAqINCd0LDQv9GA0LDQstC70Y/QtdGCINC60LDQvNC10YDRgyDQvdCwINC+0L/RgNC10LTQtdC70LXQvdC90YPRjiDQv9C+0LfQuNGG0LjRjiAoYFwiZGVzdGluYXRpb25cImApLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNsb29rQXRcbiAgICogQHBhcmFtICB7SVZlY3RvcjJEfSBkZXN0aW5hdGlvbiDQn9C+0LfQuNGG0LjRjywg0LIg0LrQvtGC0L7RgNGD0Y4g0LTQvtC70LbQvdCwINGB0LzQvtGC0YDQtdGC0Ywg0LrQsNC80LXRgNCwLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgW2tleV0gICAgICAgINCh0LLQvtC50YHRgtCy0L4sINC60L7RgtC+0YDQvtC1INC90LDQtNC+INCx0YDQsNGC0Ywg0LjQtyBgXCJkZXN0aW5hdGlvblwiYC5cbiAgICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfRgNCw0YnQsNC10YIuXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBjYXIgPSB7XG4gICAqICAgcG9zaXRpb246IHtcbiAgICogICAgIHg6IDQsXG4gICAqICAgICB5OiAyXG4gICAqICAgfVxuICAgKiB9O1xuICAgKiAvLyBEaXJlY3QgYSBjYW1lcmEgb24gdGhlIGNhci5cbiAgICogY2FtZXJhLmxvb2tBdCggY2FyLCAncG9zaXRpb24nICk7XG4gICAqIC8vIFRoaXMgd2F5IHdvcmtzIHRvbyBidXQgaWYgdGhlICdwb3NpdGlvbicgd2lsbCBiZSByZXBsYWNlZCBpdCB3b3VsZCBub3Qgd29yay5cbiAgICogY2FtZXJhLmxvb2tBdCggY2FyLnBvc2l0aW9uICk7XG4gICAqL1xuICBsb29rQXQ6IGZ1bmN0aW9uIGxvb2tBdCAoIGRlc3RpbmF0aW9uLCBrZXkgKVxuICB7XG4gICAgdGhpcy5fZGVzdGluYXRpb24gPSBkZXN0aW5hdGlvbjtcbiAgICBpZiAoIHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgdGhpcy5fZGVzdGluYXRpb25LZXkgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kZXN0aW5hdGlvbktleSA9IGtleTtcbiAgICB9XG4gIH0sXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQv9C+0LfQuNGG0LjRjiwg0L3QsCDQutC+0YLQvtGA0YPRjiDQutCw0LzQtdGA0LAg0LTQvtC70LbQvdCwINCx0YvRgtGMINC90LDQv9GA0LDQstC70LXQvdCwLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNzaG91bGRMb29rQXRcbiAgICogQHJldHVybiB7SVZlY3RvcjJEfSDQn9C+0LfQuNGG0LjRjy5cbiAgICogQGV4YW1wbGVcbiAgICogdmFyIG9iamVjdCA9IHtcbiAgICogICBwb3NpdGlvbjogeyB4OiA0LCB5OiAyIH1cbiAgICogfTtcbiAgICpcbiAgICogY2FtZXJhLnNob3VsZExvb2tBdCgpOyAvLyAtPiB7IHg6IDAsIHk6IDAgfS5cbiAgICogY2FtZXJhLmxvb2tBdCggb2JqZWN0LCAncG9zaXRpb24nICk7XG4gICAqIGNhbWVyYS5zaG91bGRMb29rQXQoKTsgLy8gLT4geyB4OiA0LCB5OiAyIH0gKGNsb25lKS5cbiAgICovXG4gIHNob3VsZExvb2tBdDogZnVuY3Rpb24gc2hvdWxkTG9va0F0ICgpXG4gIHtcbiAgICB2YXIgX2Rlc3RpbmF0aW9uID0gdGhpcy5fZ2V0RGVzdGluYXRpb24oKTtcbiAgICB2YXIgeCwgeTtcbiAgICBpZiAoIF9kZXN0aW5hdGlvbiA9PT0gbnVsbCApIHtcbiAgICAgIHggPSAwO1xuICAgICAgeSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSBfZGVzdGluYXRpb24ueDtcbiAgICAgIHkgPSBfZGVzdGluYXRpb24ueTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHgsXG4gICAgICB5OiB5XG4gICAgfTtcbiAgfSxcbiAgLyoqXG4gICAqINCe0LHQvdC+0LLQu9GP0LXRgiDQv9C+0LfQuNGG0LjRjiwg0L3QsCDQutC+0YLQvtGA0YPRjiDQvdCw0L/RgNCw0LLQu9C10L3QsCDQutCw0LzQtdGA0LAuXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI3VwZGF0ZVxuICAgKiBAcmV0dXJuIHt2b2lkfSDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGVcbiAgICogdGlja2VyLm9uKCAndXBkYXRlJywgZnVuY3Rpb24gKClcbiAgICoge1xuICAgKiAgIC8vIFVwZGF0ZSBhIGNhbWVyYSBvbiBlYWNoIGZyYW1lLlxuICAgKiAgIGNhbWVyYS51cGRhdGUoKTtcbiAgICogfSApO1xuICAgKi9cbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUgKClcbiAge1xuICAgIHZhciBfZGVzdGluYXRpb24gPSB0aGlzLl9nZXREZXN0aW5hdGlvbigpO1xuICAgIGlmICggX2Rlc3RpbmF0aW9uICE9PSBudWxsICkge1xuICAgICAgdHJhbnNsYXRlKCB0aGlzLCBfZGVzdGluYXRpb24sICd4JyApO1xuICAgICAgdHJhbnNsYXRlKCB0aGlzLCBfZGVzdGluYXRpb24sICd5JyApO1xuICAgIH1cbiAgfSxcbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC/0L7Qt9C40YbQuNGOLCDQvdCwINC60L7RgtC+0YDRg9GOINC60LDQvNC10YDQsCDQvdCw0L/RgNCw0LLQu9C10L3QsCDRgdC10LnRh9Cw0YEuXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI2xvb2tzQXRcbiAgICogQHJldHVybiB7SVZlY3RvcjJEfSDQotC10LrRg9GJ0LXQtSDQvdCw0L/RgNCw0LLQu9C10L3QuNC1INC60LDQvNC10YDRiy5cbiAgICogQGV4YW1wbGVcbiAgICogLy8gQSBjYW1lcmEgbG9va3MgYXQgWyB4LCB5IF0gZnJvbSBsb29rc0F0IG5vdy5cbiAgICogdmFyIGxvb2tzQXQgPSBjYW1lcmEubG9va3NBdCgpO1xuICAgKi9cbiAgbG9va3NBdDogZnVuY3Rpb24gbG9va3NBdCAoKVxuICB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHRoaXMuX2N1cnJlbnRQb3NpdGlvbi54LFxuICAgICAgeTogdGhpcy5fY3VycmVudFBvc2l0aW9uLnlcbiAgICB9O1xuICB9LFxuICAvKipcbiAgICog0J/RgNC40LzQtdC90Y/QtdGCINC60LDQvNC10YDRgyDQvdCwINC80LDRgtGA0LjRhtGDINC40LvQuCDRgNC10L3QtNC10YDQtdGALlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNhcHBseVxuICAgKiBAcGFyYW0gIHt2Ni5UcmFuc2Zvcm18djYuQWJzdHJhY3RSZW5kZXJlcn0gW21hdHJpeF0g0JzQsNGC0YDQuNGG0LAg0LjQu9C4INGA0LXQvdC00LXRgNC10YAuXG4gICAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGUgPGNhcHRpb24+QXBwbHkgb24gYSByZW5kZXJlcjwvY2FwdGlvbj5cbiAgICogdmFyIHJlbmRlcmVyID0gdjYuY3JlYXRlUmVuZGVyZXIoKTtcbiAgICogY2FtZXJhLmFwcGx5KCByZW5kZXJlciApO1xuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5BcHBseSBvbiBhIHRyYW5zZm9ybTwvY2FwdGlvbj5cbiAgICogdmFyIG1hdHJpeCA9IG5ldyB2Ni5UcmFuc2Zvcm0oKTtcbiAgICogY2FtZXJhLmFwcGx5KCBtYXRyaXggKTtcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+QXBwbHkgb24gYSBjYW1lcmEncyByZW5kZXJlcjwvY2FwdGlvbj5cbiAgICogdmFyIGNhbWVyYSA9IG5ldyB2Ni5DYW1lcmEoIHtcbiAgICogICByZW5kZXJlcjogcmVuZGVyZXJcbiAgICogfSApO1xuICAgKlxuICAgKiBjYW1lcmEuYXBwbHkoKTtcbiAgICovXG4gIGFwcGx5OiBmdW5jdGlvbiBhcHBseSAoIG1hdHJpeCApXG4gIHtcbiAgICB2YXIgem9vbSA9IHRoaXMuc2V0dGluZ3Muem9vbS52YWx1ZTtcbiAgICB2YXIgeCA9IHRyYW5zZm9ybSggdGhpcywgdGhpcy5fY3VycmVudFBvc2l0aW9uLCAneCcgKTtcbiAgICB2YXIgeSA9IHRyYW5zZm9ybSggdGhpcywgdGhpcy5fY3VycmVudFBvc2l0aW9uLCAneScgKTtcbiAgICAoIG1hdHJpeCB8fCB0aGlzLnJlbmRlcmVyICkuc2V0VHJhbnNmb3JtKCB6b29tLCAwLCAwLCB6b29tLCB6b29tICogeCwgem9vbSAqIHkgKTtcbiAgfSxcbiAgLyoqXG4gICAqINCe0L/RgNC10LTQtdC70Y/QtdGCLCDQstC40LTQuNGCINC70Lgg0LrQsNC80LXRgNCwINC+0LHRitC10LrRgiDQuNC3INGB0L7QvtGC0LLQtdGC0YHQstGD0Y7RidC40YUg0L/QsNGA0LDQstC10YLRgNC+0LIgKHgsIHksIHcsIGgpINGB0LXQudGH0LDRgSxcbiAgICog0LXRgdC70Lgg0L3QtdGCLCDRgtC+INGN0YLQvtGCINC+0LHRitC10LrRgiDQvNC+0LbQvdC+INC90LUg0L7RgtGA0LjRgdC+0LLRi9Cy0LDRgtGMLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNzZWVzXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIHggICAgICAgICAgWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQvtCx0YrQtdC60YLQsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgeSAgICAgICAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwINC+0LHRitC10LrRgtCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB3ICAgICAgICAgINCo0LjRgNC40L3QsCDQvtCx0YrQtdC60YLQsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgaCAgICAgICAgICDQktGL0YHQvtGC0LAg0L7QsdGK0LXQutGC0LAuXG4gICAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IFtyZW5kZXJlcl0g0KDQtdC90LTQtdGA0LXRgC5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICBgdHJ1ZWAsINC10YHQu9C4INC+0LHRitC10LrRgiDQtNC+0LvQttC10L0g0LHRi9GC0Ywg0L7RgtGA0LjRgdC+0LLQsNC9LlxuICAgKiBAZXhhbXBsZVxuICAgKiBpZiAoIGNhbWVyYS5zZWVzKCBvYmplY3QueCwgb2JqZWN0LnksIG9iamVjdC53LCBvYmplY3QuaCApICkge1xuICAgKiAgIG9iamVjdC5zaG93KCk7XG4gICAqIH1cbiAgICovXG4gIHNlZXM6IGZ1bmN0aW9uIHNlZXMgKCB4LCB5LCB3LCBoLCByZW5kZXJlciApXG4gIHtcbiAgICB2YXIgem9vbSA9IHRoaXMuc2V0dGluZ3Muem9vbS52YWx1ZTtcbiAgICB2YXIgb2Zmc2V0ID0gdGhpcy5zZXR0aW5ncy5vZmZzZXQ7XG4gICAgdmFyIF9jdXJyZW50UG9zaXRpb24gPSB0aGlzLl9jdXJyZW50UG9zaXRpb247XG4gICAgaWYgKCAhIHJlbmRlcmVyICkge1xuICAgICAgcmVuZGVyZXIgPSB0aGlzLnJlbmRlcmVyO1xuICAgIH1cbiAgICBpZiAoICEgcmVuZGVyZXIgKSB7XG4gICAgICB0aHJvdyBFcnJvciggJ05vIHJlbmRlcmVyIChjYW1lcmEuc2VlcyknICk7XG4gICAgfVxuICAgIHJldHVybiB4ICsgdyA+IF9jdXJyZW50UG9zaXRpb24ueCAtIG9mZnNldC54IC8gem9vbSAmJlxuICAgICAgICAgICB4IDwgX2N1cnJlbnRQb3NpdGlvbi54ICsgKCByZW5kZXJlci53IC0gb2Zmc2V0LnggKSAvIHpvb20gJiZcbiAgICAgICAgICAgeSArIGggPiBfY3VycmVudFBvc2l0aW9uLnkgLSBvZmZzZXQueSAvIHpvb20gJiZcbiAgICAgICAgICAgeSA8IF9jdXJyZW50UG9zaXRpb24ueSArICggcmVuZGVyZXIuaCAtIG9mZnNldC55ICkgLyB6b29tO1xuICB9LFxuICAvKipcbiAgICog0J7RgtC00LDQu9GP0LXRgiDQutCw0LzQtdGA0YMuINCQ0L3QuNC80LDRhtC40Y8g0LzQvtC20LXRgiDQsdGL0YLRjCDQu9C40L3QtdC50L3QvtC5ICjQv9C+INGD0LzQvtC70YfQsNC90LjRjikg0LXRgdC70Lgg0Y3RgtC+INCy0LrQu9GO0YfQtdC90L46XG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogY2FtZXJhLnNldCggJ3pvb20tb3V0IHNwZWVkJywge1xuICAgKiAgIC8vIEVuYWJsZXMgbGluZWFyIGFuaW1hdGlvbiAoZW5hYmxlZCBieSBkZWZhdWx0IGJ1dCB5b3UgY2FuIGRpc2FibGUpLlxuICAgKiAgIGxpbmVhcjogdHJ1ZVxuICAgKiB9ICk7XG4gICAqIGBgYFxuICAgKiDQodC60L7RgNC+0YHRgtGMINCw0L3QuNC80LDRhtC40Lgg0LjQt9C80LXQvdGP0LXRgtGB0Y8g0YfQtdGA0LXQtyBgdmFsdWVgOlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIGNhbWVyYS5zZXQoICd6b29tLW91dCBzcGVlZCcsIHtcbiAgICogICAvLyBTZXQgc2xvdyB6b29tLW91dCBzcGVlZCAoMSBieSBkZWZhdWx0KS5cbiAgICogICB2YWx1ZTogMC4xXG4gICAqIH0gKTtcbiAgICogYGBgXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI3pvb21PdXRcbiAgICogQHJldHVybiB7dm9pZH0g0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gICAqIEBleGFtcGxlXG4gICAqIHRpY2tlci5vbiggJ3VwZGF0ZScsIGZ1bmN0aW9uICgpXG4gICAqIHtcbiAgICogICBjYW1lcmEuem9vbU91dCgpO1xuICAgKiB9ICk7XG4gICAqL1xuICB6b29tT3V0OiBmdW5jdGlvbiB6b29tT3V0ICgpIHsgdmFyIHpvb21TcGVlZCA9IHRoaXMuc2V0dGluZ3NbICd6b29tLW91dCBzcGVlZCcgXTsgdmFyIHpvb20gPSB0aGlzLnNldHRpbmdzLnpvb207IHZhciBjaGFuZ2U7IGlmICggem9vbS52YWx1ZSAhPT0gem9vbS5taW4gKSB7IGlmICggem9vbVNwZWVkLmxpbmVhciApIHsgY2hhbmdlID0gem9vbVNwZWVkLnZhbHVlICogem9vbS52YWx1ZTsgfSBlbHNlIHsgY2hhbmdlID0gem9vbVNwZWVkLnZhbHVlOyB9IHpvb20udmFsdWUgPSBNYXRoLm1heCggem9vbS52YWx1ZSAtIGNoYW5nZSwgem9vbS5taW4gKTsgfSB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCf0YDQuNCx0LvQuNC20LDQtdGCINC60LDQvNC10YDRgy4g0JDQvdC40LzQsNGG0LjRjyDQvNC+0LbQtdGCINCx0YvRgtGMINC70LjQvdC10LnQvdC+0LkgKNC/0L4g0YPQvNC+0LvRh9Cw0L3QuNGOKSDQtdGB0LvQuCDRjdGC0L4g0LLQutC70Y7Rh9C10L3QvjpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiBjYW1lcmEuc2V0KCAnem9vbS1pbiBzcGVlZCcsIHtcbiAgICogICAvLyBFbmFibGVzIGxpbmVhciBhbmltYXRpb24gKGVuYWJsZWQgYnkgZGVmYXVsdCBidXQgeW91IGNhbiBkaXNhYmxlKS5cbiAgICogICBsaW5lYXI6IHRydWVcbiAgICogfSApO1xuICAgKiBgYGBcbiAgICog0KHQutC+0YDQvtGB0YLRjCDQsNC90LjQvNCw0YbQuNC4INC40LfQvNC10L3Rj9C10YLRgdGPINGH0LXRgNC10LcgYHZhbHVlYDpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiBjYW1lcmEuc2V0KCAnem9vbS1pbiBzcGVlZCcsIHtcbiAgICogICAvLyBTZXQgc2xvdyB6b29tLWluIHNwZWVkICgxIGJ5IGRlZmF1bHQpLlxuICAgKiAgIHZhbHVlOiAwLjFcbiAgICogfSApO1xuICAgKiBgYGBcbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjem9vbUluXG4gICAqIEByZXR1cm4ge3ZvaWR9INCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICAgKiBAZXhhbXBsZVxuICAgKiB0aWNrZXIub24oICd1cGRhdGUnLCBmdW5jdGlvbiAoKVxuICAgKiB7XG4gICAqICAgY2FtZXJhLnpvb21JbigpO1xuICAgKiB9ICk7XG4gICAqL1xuICB6b29tSW46IGZ1bmN0aW9uIHpvb21JbiAoKSB7IHZhciB6b29tU3BlZWQgPSB0aGlzLnNldHRpbmdzWyAnem9vbS1pbiBzcGVlZCcgXTsgdmFyIHpvb20gPSB0aGlzLnNldHRpbmdzLnpvb207IHZhciBjaGFuZ2U7IGlmICggem9vbS52YWx1ZSAhPT0gem9vbS5tYXggKSB7IGlmICggem9vbVNwZWVkLmxpbmVhciApIHsgY2hhbmdlID0gem9vbVNwZWVkLnZhbHVlICogem9vbS52YWx1ZTsgfSBlbHNlIHsgY2hhbmdlID0gem9vbVNwZWVkLnZhbHVlOyB9IHpvb20udmFsdWUgPSBNYXRoLm1pbiggem9vbS52YWx1ZSArIGNoYW5nZSwgem9vbS5tYXggKTsgfSB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgY29uc3RydWN0b3I6IENhbWVyYVxufTtcbmZ1bmN0aW9uIHRyYW5zZm9ybSAoIGNhbWVyYSwgcG9zaXRpb24sIGF4aXMgKVxue1xuICByZXR1cm4gY2FtZXJhLnNldHRpbmdzLm9mZnNldFsgYXhpcyBdIC8gY2FtZXJhLnNldHRpbmdzLnpvb20udmFsdWUgLSBwb3NpdGlvblsgYXhpcyBdO1xufVxuZnVuY3Rpb24gdHJhbnNsYXRlICggY2FtZXJhLCBkZXN0aW5hdGlvbiwgYXhpcyApXG57XG4gIHZhciB0cmFuc2Zvcm1lZERlc3RpbmF0aW9uID0gdHJhbnNmb3JtKCBjYW1lcmEsIGRlc3RpbmF0aW9uLCBheGlzICk7XG4gIHZhciB0cmFuc2Zvcm1lZEN1cnJlbnRQb3NpdGlvbiA9IHRyYW5zZm9ybSggY2FtZXJhLCBjYW1lcmEuX2N1cnJlbnRQb3NpdGlvbiwgYXhpcyApO1xuICBjYW1lcmEuX2N1cnJlbnRQb3NpdGlvblsgYXhpcyBdICs9ICggdHJhbnNmb3JtZWRDdXJyZW50UG9zaXRpb24gLSB0cmFuc2Zvcm1lZERlc3RpbmF0aW9uICkgKiBjYW1lcmEuc2V0dGluZ3Muc3BlZWRbIGF4aXMgXTtcbn1cbmZ1bmN0aW9uIENIRUNLICggc2V0dGluZyApXG57XG4gIHN3aXRjaCAoIHNldHRpbmcgKSB7XG4gICAgY2FzZSAnem9vbS1vdXQgc3BlZWQnOlxuICAgIGNhc2UgJ3pvb20taW4gc3BlZWQnOlxuICAgIGNhc2UgJ29mZnNldCc6XG4gICAgY2FzZSAnc3BlZWQnOlxuICAgIGNhc2UgJ3pvb20nOlxuICAgICAgcmV0dXJuO1xuICB9XG4gIHRocm93IEVycm9yKCAnR290IHVua25vd24gc2V0dGluZyBrZXk6ICcgKyBzZXR0aW5nICk7XG59XG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQodGC0LDQvdC00LDRgNGC0L3Ri9C1INC90LDRgdGC0YDQvtC50LrQuCDQutCw0LzQtdGA0YsuXG4gKiBAbmFtZXNwYWNlIHY2LnNldHRpbmdzLmNhbWVyYVxuICogQGV4YW1wbGVcbiAqIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2NhbWVyYS9zZXR0aW5ncycgKTtcbiAqL1xuXG4vKipcbiAqINCg0LXQvdC00LXRgNC10YAuXG4gKiBAbWVtYmVyIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSB2Ni5zZXR0aW5ncy5jYW1lcmEucmVuZGVyZXJcbiAqL1xuXG4vKipcbiAqINCh0YLQsNC90LTQsNGA0YLQvdGL0LUg0L3QsNGB0YLRgNC+0LnQutC4INC60LDQvNC10YDRiy5cbiAqIEBtZW1iZXIge29iamVjdH0gdjYuc2V0dGluZ3MuY2FtZXJhLnNldHRpbmdzXG4gKiBAcHJvcGVydHkge29iamVjdH0gICAgWyd6b29tLW91dCBzcGVlZCddXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWyd6b29tLW91dCBzcGVlZCcudmFsdWU9MV0gICAgINCh0LrQvtGA0L7RgdGC0Ywg0YPQvNC10L3RjNGI0LXQvdC40Y8g0LzQsNGB0YjRgtCw0LHQsCAo0L7RgtC00LDQu9C10L3QuNGPKSDQutCw0LzQtdGA0YsuXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59ICAgWyd6b29tLW91dCBzcGVlZCcubGluZWFyPXRydWVdINCU0LXQu9Cw0YLRjCDQsNC90LjQvNCw0YbQuNGOINC70LjQvdC10LnQvdC+0LkuXG4gKiBAcHJvcGVydHkge29iamVjdH0gICAgWyd6b29tLWluIHNwZWVkJ11cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3pvb20taW4gc3BlZWQnLnZhbHVlPTFdICAgICAg0KHQutC+0YDQvtGB0YLRjCDRg9Cy0LXQu9C40YfQtdC90LjRjyDQvNCw0YHRiNGC0LDQsdCwICjQv9GA0LjQsdC70LjQttC10L3QuNGPKSDQutCw0LzQtdGA0YsuXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59ICAgWyd6b29tLWluIHNwZWVkJy5saW5lYXI9dHJ1ZV0gINCU0LXQu9Cw0YLRjCDQsNC90LjQvNCw0YbQuNGOINC70LjQvdC10LnQvdC+0LkuXG4gKiBAcHJvcGVydHkge29iamVjdH0gICAgWyd6b29tJ11cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3pvb20nLnZhbHVlPTFdICAgICAgICAgICAgICAg0KLQtdC60YPRidC40Lkg0LzQsNGB0YjRgtCw0LEg0LrQsNC80LXRgNGLLlxuICogQHByb3BlcnR5IHtudW1iZXJ9ICAgIFsnem9vbScubWluPTFdICAgICAgICAgICAgICAgICDQnNC40L3QuNC80LDQu9GM0L3Ri9C5INC80LDRgdGI0YLQsNCxINC60LDQvNC10YDRiy5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3pvb20nLm1heD0xXSAgICAgICAgICAgICAgICAg0JzQsNC60YHQuNC80LDQu9GM0L3Ri9C5INC80LDRgdGI0YLQsNCxINC60LDQvNC10YDRiy5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAgICBbJ3NwZWVkJ10gICAgICAgICAgICAgICAgICAgICAg0KHQutC+0YDQvtGB0YLRjCDQvdCw0L/RgNCw0LLQu9C10L3QuNGPINC60LDQvNC10YDRiyDQvdCwINC+0LHRitC10LrRgi5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3NwZWVkJy54PTFdICAgICAgICAgICAgICAgICAgMSAtINC80L7QvNC10L3RgtCw0LvRjNC90L7QtSDQv9C10YDQtdC80LXRidC10L3QuNC1INC/0L4gWCwgMC4xIC0g0LzQtdC00LvQtdC90L3QvtC1LlxuICogQHByb3BlcnR5IHtudW1iZXJ9ICAgIFsnc3BlZWQnLnk9MV0gICAgICAgICAgICAgICAgICAxIC0g0LzQvtC80LXQvdGC0LDQu9GM0L3QvtC1INC/0LXRgNC10LzQtdGJ0LXQvdC40LUg0L/QviBZLCAwLjEgLSDQvNC10LTQu9C10L3QvdC+0LUuXG4gKiBAcHJvcGVydHkge0lWZWN0b3IyRH0gWydvZmZzZXQnXVxuICovXG5leHBvcnRzLnNldHRpbmdzID0ge1xuICAnem9vbS1vdXQgc3BlZWQnOiB7XG4gICAgdmFsdWU6ICAxLFxuICAgIGxpbmVhcjogdHJ1ZVxuICB9LFxuXG4gICd6b29tLWluIHNwZWVkJzoge1xuICAgIHZhbHVlOiAgMSxcbiAgICBsaW5lYXI6IHRydWVcbiAgfSxcblxuICAnem9vbSc6IHtcbiAgICB2YWx1ZTogMSxcbiAgICBtaW46ICAgMSxcbiAgICBtYXg6ICAgMVxuICB9LFxuXG4gICdzcGVlZCc6IHtcbiAgICB4OiAxLFxuICAgIHk6IDFcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBIU0xBO1xuXG52YXIgY2xhbXAgPSByZXF1aXJlKCAncGVha28vY2xhbXAnICk7ICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG52YXIgcGFyc2UgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wYXJzZScgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG52YXIgUkdCQSAgPSByZXF1aXJlKCAnLi9SR0JBJyApOyAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG4vKipcbiAqIEhTTEEg0YbQstC10YIuXG4gKiBAY29uc3RydWN0b3IgdjYuSFNMQVxuICogQHBhcmFtIHtudW1iZXJ8VENvbG9yfSBbaF0gSHVlIHZhbHVlLlxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbc10gU2F0dXJhdGlvbiB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2xdIExpZ2h0bmVzcyB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2FdIEFscGhhIHZhbHVlLlxuICogQHNlZSB2Ni5IU0xBI3NldFxuICogQGV4YW1wbGVcbiAqIHZhciBIU0xBID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29sb3IvSFNMQScgKTtcbiAqXG4gKiB2YXIgdHJhbnNwYXJlbnQgPSBuZXcgSFNMQSggJ3RyYW5zcGFyZW50JyApO1xuICogdmFyIG1hZ2VudGEgICAgID0gbmV3IEhTTEEoICdtYWdlbnRhJyApO1xuICogdmFyIGZ1Y2hzaWEgICAgID0gbmV3IEhTTEEoIDMwMCwgMTAwLCA1MCApO1xuICogdmFyIGdob3N0ICAgICAgID0gbmV3IEhTTEEoIDEwMCwgMC4xICk7XG4gKiB2YXIgd2hpdGUgICAgICAgPSBuZXcgSFNMQSggMTAwICk7XG4gKiB2YXIgYmxhY2sgICAgICAgPSBuZXcgSFNMQSgpO1xuICovXG5mdW5jdGlvbiBIU0xBICggaCwgcywgbCwgYSApXG57XG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkhTTEEjMCBcImh1ZVwiIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzEgXCJzYXR1cmF0aW9uXCIgdmFsdWUuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkhTTEEjMiBcImxpZ2h0bmVzc1wiIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzMgXCJhbHBoYVwiIHZhbHVlLlxuICAgKi9cblxuICB0aGlzLnNldCggaCwgcywgbCwgYSApO1xufVxuXG5IU0xBLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINCy0L7RgdC/0YDQuNC90LjQvNCw0LXQvNGD0Y4g0Y/RgNC60L7RgdGC0YwgKHBlcmNlaXZlZCBicmlnaHRuZXNzKSDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjcGVyY2VpdmVkQnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5wZXJjZWl2ZWRCcmlnaHRuZXNzKCk7IC8vIC0+IDE2My44NzU5NDM5MzMyMDgyXG4gICAqL1xuICBwZXJjZWl2ZWRCcmlnaHRuZXNzOiBmdW5jdGlvbiBwZXJjZWl2ZWRCcmlnaHRuZXNzICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5yZ2JhKCkucGVyY2VpdmVkQnJpZ2h0bmVzcygpO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQvtGC0L3QvtGB0LjRgtC10LvRjNC90YPRjiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjbHVtaW5hbmNlXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SZWxhdGl2ZV9sdW1pbmFuY2VcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoICdtYWdlbnRhJyApLmx1bWluYW5jZSgpOyAvLyAtPiA3Mi42MjRcbiAgICovXG4gIGx1bWluYW5jZTogZnVuY3Rpb24gbHVtaW5hbmNlICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5yZ2JhKCkubHVtaW5hbmNlKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINGP0YDQutC+0YHRgtGMINGG0LLQtdGC0LAuXG4gICAqIEBtZXRob2QgdjYuSFNMQSNicmlnaHRuZXNzXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvQUVSVC8jY29sb3ItY29udHJhc3RcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoICdtYWdlbnRhJyApLmJyaWdodG5lc3MoKTsgLy8gLT4gMTA1LjMxNVxuICAgKi9cbiAgYnJpZ2h0bmVzczogZnVuY3Rpb24gYnJpZ2h0bmVzcyAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLmJyaWdodG5lc3MoKTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIgQ1NTLWNvbG9yINGB0YLRgNC+0LrRgy5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI3RvU3RyaW5nXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQGV4YW1wbGVcbiAgICogJycgKyBuZXcgSFNMQSggJ3JlZCcgKTsgLy8gLT4gXCJoc2xhKDAsIDEwMCUsIDUwJSwgMSlcIlxuICAgKi9cbiAgdG9TdHJpbmc6IGZ1bmN0aW9uIHRvU3RyaW5nICgpXG4gIHtcbiAgICByZXR1cm4gJ2hzbGEoJyArIHRoaXNbIDAgXSArICcsICcgKyB0aGlzWyAxIF0gKyAnXFx1MDAyNSwgJyArIHRoaXNbIDIgXSArICdcXHUwMDI1LCAnICsgdGhpc1sgMyBdICsgJyknO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBILCBTLCBMLCBBINC30L3QsNGH0LXQvdC40Y8uXG4gICAqIEBtZXRob2QgdjYuSFNMQSNzZXRcbiAgICogQHBhcmFtIHtudW1iZXJ8VENvbG9yfSBbaF0gSHVlIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtzXSBTYXR1cmF0aW9uIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtsXSBMaWdodG5lc3MgdmFsdWUuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2FdIEFscGhhIHZhbHVlLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuSFNMQVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSgpLnNldCggMTAwLCAwLjUgKTsgLy8gLT4gMCwgMCwgMTAwLCAwLjVcbiAgICovXG4gIHNldDogZnVuY3Rpb24gc2V0ICggaCwgcywgbCwgYSApXG4gIHtcbiAgICBzd2l0Y2ggKCB0cnVlICkge1xuICAgICAgY2FzZSB0eXBlb2YgaCA9PT0gJ3N0cmluZyc6XG4gICAgICAgIGggPSBwYXJzZSggaCApO1xuICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICBjYXNlIHR5cGVvZiBoID09PSAnb2JqZWN0JyAmJiBoICE9PSBudWxsOlxuICAgICAgICBpZiAoIGgudHlwZSAhPT0gdGhpcy50eXBlICkge1xuICAgICAgICAgIGggPSBoWyB0aGlzLnR5cGUgXSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpc1sgMCBdID0gaFsgMCBdO1xuICAgICAgICB0aGlzWyAxIF0gPSBoWyAxIF07XG4gICAgICAgIHRoaXNbIDIgXSA9IGhbIDIgXTtcbiAgICAgICAgdGhpc1sgMyBdID0gaFsgMyBdO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHN3aXRjaCAoIHZvaWQgMCApIHtcbiAgICAgICAgICBjYXNlIGg6XG4gICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgIGwgPSBzID0gaCA9IDA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIHM6XG4gICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgIGwgPSBNYXRoLmZsb29yKCBoICk7XG4gICAgICAgICAgICBzID0gaCA9IDA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGw6XG4gICAgICAgICAgICBhID0gcztcbiAgICAgICAgICAgIGwgPSBNYXRoLmZsb29yKCBoICk7XG4gICAgICAgICAgICBzID0gaCA9IDA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGE6XG4gICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaCA9IE1hdGguZmxvb3IoIGggKTtcbiAgICAgICAgICAgIHMgPSBNYXRoLmZsb29yKCBzICk7XG4gICAgICAgICAgICBsID0gTWF0aC5mbG9vciggbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpc1sgMCBdID0gaDtcbiAgICAgICAgdGhpc1sgMSBdID0gcztcbiAgICAgICAgdGhpc1sgMiBdID0gbDtcbiAgICAgICAgdGhpc1sgMyBdID0gYTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICog0JrQvtC90LLQtdGA0YLQuNGA0YPQtdGCINCyIHtAbGluayB2Ni5SR0JBfS5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI3JnYmFcbiAgICogQHJldHVybiB7djYuUkdCQX1cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoICdtYWdlbnRhJyApLnJnYmEoKTsgLy8gLT4gbmV3IFJHQkEoIDI1NSwgMCwgMjU1LCAxIClcbiAgICovXG4gIHJnYmE6IGZ1bmN0aW9uIHJnYmEgKClcbiAge1xuICAgIHZhciByZ2JhID0gbmV3IFJHQkEoKTtcblxuICAgIHZhciBoID0gdGhpc1sgMCBdICUgMzYwIC8gMzYwO1xuICAgIHZhciBzID0gdGhpc1sgMSBdICogMC4wMTtcbiAgICB2YXIgbCA9IHRoaXNbIDIgXSAqIDAuMDE7XG5cbiAgICB2YXIgdHIgPSBoICsgMSAvIDM7XG4gICAgdmFyIHRnID0gaDtcbiAgICB2YXIgdGIgPSBoIC0gMSAvIDM7XG5cbiAgICB2YXIgcTtcblxuICAgIGlmICggbCA8IDAuNSApIHtcbiAgICAgIHEgPSBsICogKCAxICsgcyApO1xuICAgIH0gZWxzZSB7XG4gICAgICBxID0gbCArIHMgLSBsICogcztcbiAgICB9XG5cbiAgICB2YXIgcCA9IDIgKiBsIC0gcTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG4gICAgaWYgKCB0ciA8IDAgKSB7XG4gICAgICArK3RyO1xuICAgIH1cblxuICAgIGlmICggdGcgPCAwICkge1xuICAgICAgKyt0ZztcbiAgICB9XG5cbiAgICBpZiAoIHRiIDwgMCApIHtcbiAgICAgICsrdGI7XG4gICAgfVxuXG4gICAgaWYgKCB0ciA+IDEgKSB7XG4gICAgICAtLXRyO1xuICAgIH1cblxuICAgIGlmICggdGcgPiAxICkge1xuICAgICAgLS10ZztcbiAgICB9XG5cbiAgICBpZiAoIHRiID4gMSApIHtcbiAgICAgIC0tdGI7XG4gICAgfVxuXG4gICAgcmdiYVsgMCBdID0gZm9vKCB0ciwgcCwgcSApO1xuICAgIHJnYmFbIDEgXSA9IGZvbyggdGcsIHAsIHEgKTtcbiAgICByZ2JhWyAyIF0gPSBmb28oIHRiLCBwLCBxICk7XG4gICAgcmdiYVsgMyBdID0gdGhpc1sgMyBdO1xuXG4gICAgcmV0dXJuIHJnYmE7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LkhTTEF9IC0g0LjQvdGC0LXRgNC/0L7Qu9C40YDQvtCy0LDQvdC90YvQuSDQvNC10LbQtNGDINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQvNC4INC/0LDRgNCw0LzQtdGC0YDQsNC80LguXG4gICAqIEBtZXRob2QgdjYuSFNMQSNsZXJwXG4gICAqIEBwYXJhbSAge251bWJlcn0gIGhcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgc1xuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBsXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHZhbHVlXG4gICAqIEByZXR1cm4ge3Y2LkhTTEF9XG4gICAqIEBzZWUgdjYuSFNMQSNsZXJwQ29sb3JcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoIDUwLCAwLjI1ICkubGVycCggMCwgMCwgMTAwLCAwLjUgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDAsIDc1LCAwLjI1IClcbiAgICovXG4gIGxlcnA6IGZ1bmN0aW9uIGxlcnAgKCBoLCBzLCBsLCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgY29sb3IgPSBuZXcgSFNMQSgpO1xuICAgIGNvbG9yWyAwIF0gPSBoO1xuICAgIGNvbG9yWyAxIF0gPSBzO1xuICAgIGNvbG9yWyAyIF0gPSBsO1xuICAgIHJldHVybiB0aGlzLmxlcnBDb2xvciggY29sb3IsIHZhbHVlICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LkhTTEF9IC0g0LjQvdGC0LXRgNC/0L7Qu9C40YDQvtCy0LDQvdC90YvQuSDQvNC10LbQtNGDIGBjb2xvcmAuXG4gICAqIEBtZXRob2QgdjYuSFNMQSNsZXJwQ29sb3JcbiAgICogQHBhcmFtICB7VENvbG9yfSAgY29sb3JcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgdmFsdWVcbiAgICogQHJldHVybiB7djYuSFNMQX1cbiAgICogQHNlZSB2Ni5IU0xBI2xlcnBcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIGEgPSBuZXcgSFNMQSggNTAsIDAuMjUgKTtcbiAgICogdmFyIGIgPSBuZXcgSFNMQSggMTAwLCAwICk7XG4gICAqIHZhciBjID0gYS5sZXJwQ29sb3IoIGIsIDAuNSApOyAvLyAtPiBuZXcgSFNMQSggMCwgMCwgNzUsIDAuMjUgKVxuICAgKi9cbiAgbGVycENvbG9yOiBmdW5jdGlvbiBsZXJwQ29sb3IgKCBjb2xvciwgdmFsdWUgKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLmxlcnBDb2xvciggY29sb3IsIHZhbHVlICkuaHNsYSgpO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5IU0xBfSAtINC30LDRgtC10LzQvdC10L3QvdGL0Lkg0LjQu9C4INC30LDRgdCy0LXRgtC70LXQvdC90YvQuSDQvdCwIGBwZXJjZW50YWdlYCDQv9GA0L7RhtC10L3RgtC+0LIuXG4gICAqIEBtZXRob2QgdjYuSFNMQSNzaGFkZVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBwZXJjZW50YWdlXG4gICAqIEByZXR1cm4ge3Y2LkhTTEF9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAwLCAxMDAsIDc1LCAxICkuc2hhZGUoIC0xMCApOyAvLyAtPiBuZXcgSFNMQSggMCwgMTAwLCA2NSwgMSApXG4gICAqL1xuICBzaGFkZTogZnVuY3Rpb24gc2hhZGUgKCBwZXJjZW50YWdlIClcbiAge1xuICAgIHZhciBoc2xhID0gbmV3IEhTTEEoKTtcbiAgICBoc2xhWyAwIF0gPSB0aGlzWyAwIF07XG4gICAgaHNsYVsgMSBdID0gdGhpc1sgMSBdO1xuICAgIGhzbGFbIDIgXSA9IGNsYW1wKCB0aGlzWyAyIF0gKyBwZXJjZW50YWdlLCAwLCAxMDAgKTtcbiAgICBoc2xhWyAzIF0gPSB0aGlzWyAzIF07XG4gICAgcmV0dXJuIGhzbGE7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IEhTTEFcbn07XG5cbi8qKlxuICogQG1lbWJlciB7c3RyaW5nfSB2Ni5IU0xBI3R5cGUgYFwiaHNsYVwiYC4g0K3RgtC+INGB0LLQvtC50YHRgtCy0L4g0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC00LvRjyDQutC+0L3QstC10YDRgtC40YDQvtCy0LDQvdC40Y8g0LzQtdC20LTRgyB7QGxpbmsgdjYuUkdCQX0g0Lgge0BsaW5rIHY2LkhTTEF9LlxuICovXG5IU0xBLnByb3RvdHlwZS50eXBlID0gJ2hzbGEnO1xuXG5mdW5jdGlvbiBmb28gKCB0LCBwLCBxIClcbntcbiAgaWYgKCB0IDwgMSAvIDYgKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoICggcCArICggcSAtIHAgKSAqIDYgKiB0ICkgKiAyNTUgKTtcbiAgfVxuXG4gIGlmICggdCA8IDAuNSApIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCggcSAqIDI1NSApO1xuICB9XG5cbiAgaWYgKCB0IDwgMiAvIDMgKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoICggcCArICggcSAtIHAgKSAqICggMiAvIDMgLSB0ICkgKiA2ICkgKiAyNTUgKTtcbiAgfVxuXG4gIHJldHVybiBNYXRoLnJvdW5kKCBwICogMjU1ICk7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gUkdCQTtcblxudmFyIHBhcnNlID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcGFyc2UnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxudmFyIEhTTEEgID0gcmVxdWlyZSggJy4vSFNMQScgKTsgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuLyoqXG4gKiBSR0JBINGG0LLQtdGCLlxuICogQGNvbnN0cnVjdG9yIHY2LlJHQkFcbiAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW3JdIFJlZCBjaGFubmVsIHZhbHVlLlxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbZ10gR3JlZW4gY2hhbm5lbCB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2JdIEJsdWUgY2hhbm5lbCB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2FdIEFscGhhIGNoYW5uZWwgdmFsdWUuXG4gKiBAc2VlIHY2LlJHQkEjc2V0XG4gKiBAZXhhbXBsZVxuICogdmFyIFJHQkEgPSByZXF1aXJlKCAndjYuanMvY29yZS9jb2xvci9SR0JBJyApO1xuICpcbiAqIHZhciB0cmFuc3BhcmVudCA9IG5ldyBSR0JBKCAndHJhbnNwYXJlbnQnICk7XG4gKiB2YXIgbWFnZW50YSAgICAgPSBuZXcgUkdCQSggJ21hZ2VudGEnICk7XG4gKiB2YXIgZnVjaHNpYSAgICAgPSBuZXcgUkdCQSggMjU1LCAwLCAyNTUgKTtcbiAqIHZhciBnaG9zdCAgICAgICA9IG5ldyBSR0JBKCAyNTUsIDAuMSApO1xuICogdmFyIHdoaXRlICAgICAgID0gbmV3IFJHQkEoIDI1NSApO1xuICogdmFyIGJsYWNrICAgICAgID0gbmV3IFJHQkEoKTtcbiAqL1xuZnVuY3Rpb24gUkdCQSAoIHIsIGcsIGIsIGEgKVxue1xuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5SR0JBIzAgXCJyZWRcIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5SR0JBIzEgXCJncmVlblwiIGNoYW5uZWwgdmFsdWUuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlJHQkEjMiBcImJsdWVcIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5SR0JBIzMgXCJhbHBoYVwiIGNoYW5uZWwgdmFsdWUuXG4gICAqL1xuXG4gIHRoaXMuc2V0KCByLCBnLCBiLCBhICk7XG59XG5cblJHQkEucHJvdG90eXBlID0ge1xuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LLQvtGB0L/RgNC40L3QuNC80LDQtdC80YPRjiDRj9GA0LrQvtGB0YLRjCAocGVyY2VpdmVkIGJyaWdodG5lc3MpINGG0LLQtdGC0LAuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNwZXJjZWl2ZWRCcmlnaHRuZXNzXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNTk2MjQzXG4gICAqIEBzZWUgaHR0cDovL2FsaWVucnlkZXJmbGV4LmNvbS9oc3AuaHRtbFxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSggJ21hZ2VudGEnICkucGVyY2VpdmVkQnJpZ2h0bmVzcygpOyAvLyAtPiAxNjMuODc1OTQzOTMzMjA4MlxuICAgKi9cbiAgcGVyY2VpdmVkQnJpZ2h0bmVzczogZnVuY3Rpb24gcGVyY2VpdmVkQnJpZ2h0bmVzcyAoKVxuICB7XG4gICAgdmFyIHIgPSB0aGlzWyAwIF07XG4gICAgdmFyIGcgPSB0aGlzWyAxIF07XG4gICAgdmFyIGIgPSB0aGlzWyAyIF07XG4gICAgcmV0dXJuIE1hdGguc3FydCggMC4yOTkgKiByICogciArIDAuNTg3ICogZyAqIGcgKyAwLjExNCAqIGIgKiBiICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC+0YLQvdC+0YHQuNGC0LXQu9GM0L3Rg9GOINGP0YDQutC+0YHRgtGMINGG0LLQtdGC0LAuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNsdW1pbmFuY2VcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKiBAc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1JlbGF0aXZlX2x1bWluYW5jZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSggJ21hZ2VudGEnICkubHVtaW5hbmNlKCk7IC8vIC0+IDcyLjYyNFxuICAgKi9cbiAgbHVtaW5hbmNlOiBmdW5jdGlvbiBsdW1pbmFuY2UgKClcbiAge1xuICAgIHJldHVybiB0aGlzWyAwIF0gKiAwLjIxMjYgKyB0aGlzWyAxIF0gKiAwLjcxNTIgKyB0aGlzWyAyIF0gKiAwLjA3MjI7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINGP0YDQutC+0YHRgtGMINGG0LLQtdGC0LAuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNicmlnaHRuZXNzXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvQUVSVC8jY29sb3ItY29udHJhc3RcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoICdtYWdlbnRhJyApLmJyaWdodG5lc3MoKTsgLy8gLT4gMTA1LjMxNVxuICAgKi9cbiAgYnJpZ2h0bmVzczogZnVuY3Rpb24gYnJpZ2h0bmVzcyAoKVxuICB7XG4gICAgcmV0dXJuIDAuMjk5ICogdGhpc1sgMCBdICsgMC41ODcgKiB0aGlzWyAxIF0gKyAwLjExNCAqIHRoaXNbIDIgXTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIgQ1NTLWNvbG9yINGB0YLRgNC+0LrRgy5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI3RvU3RyaW5nXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQGV4YW1wbGVcbiAgICogJycgKyBuZXcgUkdCQSggJ21hZ2VudGEnICk7IC8vIC0+IFwicmdiYSgyNTUsIDAsIDI1NSwgMSlcIlxuICAgKi9cbiAgdG9TdHJpbmc6IGZ1bmN0aW9uIHRvU3RyaW5nICgpXG4gIHtcbiAgICByZXR1cm4gJ3JnYmEoJyArIHRoaXNbIDAgXSArICcsICcgKyB0aGlzWyAxIF0gKyAnLCAnICsgdGhpc1sgMiBdICsgJywgJyArIHRoaXNbIDMgXSArICcpJztcbiAgfSxcblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgUiwgRywgQiwgQSDQt9C90LDRh9C10L3QuNGPLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjc2V0XG4gICAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW3JdIFJlZCBjaGFubmVsIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtnXSBHcmVlbiBjaGFubmVsIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtiXSBCbHVlIGNoYW5uZWwgdmFsdWUuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2FdIEFscGhhIGNoYW5uZWwgdmFsdWUuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5SR0JBXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKClcbiAgICogICAuc2V0KCAnbWFnZW50YScgKSAgICAgICAgICAgICAgICAgICAgLy8gLT4gMjU1LCAwLCAyNTUsIDFcbiAgICogICAuc2V0KCAnI2ZmMDBmZmZmJyApICAgICAgICAgICAgICAgICAgLy8gLT4gMjU1LCAwLCAyNTUsIDFcbiAgICogICAuc2V0KCAnI2ZmMDBmZicgKSAgICAgICAgICAgICAgICAgICAgLy8gLT4gMjU1LCAwLCAyNTUsIDFcbiAgICogICAuc2V0KCAnI2YwMDcnICkgICAgICAgICAgICAgICAgICAgICAgLy8gLT4gMjU1LCAwLCAwLCAwLjQ3XG4gICAqICAgLnNldCggJyNmMDAnICkgICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMCwgMVxuICAgKiAgIC5zZXQoICdoc2xhKCAwLCAxMDAlLCA1MCUsIDAuNDcgKScgKSAvLyAtPiAyNTUsIDAsIDAsIDAuNDdcbiAgICogICAuc2V0KCAncmdiKCAwLCAwLCAwICknICkgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMVxuICAgKiAgIC5zZXQoIDAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAwLCAwLCAwLCAxXG4gICAqICAgLnNldCggMCwgMCwgMCApICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDFcbiAgICogICAuc2V0KCAwLCAwICkgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMFxuICAgKiAgIC5zZXQoIDAsIDAsIDAsIDAgKTsgICAgICAgICAgICAgICAgICAvLyAtPiAwLCAwLCAwLCAwXG4gICAqL1xuICBzZXQ6IGZ1bmN0aW9uIHNldCAoIHIsIGcsIGIsIGEgKVxuICB7XG4gICAgc3dpdGNoICggdHJ1ZSApIHtcbiAgICAgIGNhc2UgdHlwZW9mIHIgPT09ICdzdHJpbmcnOlxuICAgICAgICByID0gcGFyc2UoIHIgKTtcbiAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgY2FzZSB0eXBlb2YgciA9PT0gJ29iamVjdCcgJiYgciAhPT0gbnVsbDpcbiAgICAgICAgaWYgKCByLnR5cGUgIT09IHRoaXMudHlwZSApIHtcbiAgICAgICAgICByID0gclsgdGhpcy50eXBlIF0oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IHJbIDAgXTtcbiAgICAgICAgdGhpc1sgMSBdID0gclsgMSBdO1xuICAgICAgICB0aGlzWyAyIF0gPSByWyAyIF07XG4gICAgICAgIHRoaXNbIDMgXSA9IHJbIDMgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBzd2l0Y2ggKCB2b2lkIDAgKSB7XG4gICAgICAgICAgY2FzZSByOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBiID0gZyA9IHIgPSAwOyAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGc6XG4gICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgIGIgPSBnID0gciA9IE1hdGguZmxvb3IoIHIgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgYjpcbiAgICAgICAgICAgIGEgPSBnO1xuICAgICAgICAgICAgYiA9IGcgPSByID0gTWF0aC5mbG9vciggciApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBhOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHIgPSBNYXRoLmZsb29yKCByICk7XG4gICAgICAgICAgICBnID0gTWF0aC5mbG9vciggZyApO1xuICAgICAgICAgICAgYiA9IE1hdGguZmxvb3IoIGIgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IHI7XG4gICAgICAgIHRoaXNbIDEgXSA9IGc7XG4gICAgICAgIHRoaXNbIDIgXSA9IGI7XG4gICAgICAgIHRoaXNbIDMgXSA9IGE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCa0L7QvdCy0LXRgNGC0LjRgNGD0LXRgiDQsiB7QGxpbmsgdjYuSFNMQX0uXG4gICAqIEBtZXRob2QgdjYuUkdCQSNoc2xhXG4gICAqIEByZXR1cm4ge3Y2LkhTTEF9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAyNTUsIDAsIDAsIDEgKS5oc2xhKCk7IC8vIC0+IG5ldyBIU0xBKCAwLCAxMDAsIDUwLCAxIClcbiAgICovXG4gIGhzbGE6IGZ1bmN0aW9uIGhzbGEgKClcbiAge1xuICAgIHZhciBoc2xhID0gbmV3IEhTTEEoKTtcblxuICAgIHZhciByID0gdGhpc1sgMCBdIC8gMjU1O1xuICAgIHZhciBnID0gdGhpc1sgMSBdIC8gMjU1O1xuICAgIHZhciBiID0gdGhpc1sgMiBdIC8gMjU1O1xuXG4gICAgdmFyIG1heCA9IE1hdGgubWF4KCByLCBnLCBiICk7XG4gICAgdmFyIG1pbiA9IE1hdGgubWluKCByLCBnLCBiICk7XG5cbiAgICB2YXIgbCA9ICggbWF4ICsgbWluICkgKiA1MDtcbiAgICB2YXIgaCwgcztcblxuICAgIHZhciBkaWZmID0gbWF4IC0gbWluO1xuXG4gICAgaWYgKCBkaWZmICkge1xuICAgICAgaWYgKCBsID4gNTAgKSB7XG4gICAgICAgIHMgPSBkaWZmIC8gKCAyIC0gbWF4IC0gbWluICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzID0gZGlmZiAvICggbWF4ICsgbWluICk7XG4gICAgICB9XG5cbiAgICAgIHN3aXRjaCAoIG1heCApIHtcbiAgICAgICAgY2FzZSByOlxuICAgICAgICAgIGlmICggZyA8IGIgKSB7XG4gICAgICAgICAgICBoID0gMS4wNDcyICogKCBnIC0gYiApIC8gZGlmZiArIDYuMjgzMjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaCA9IDEuMDQ3MiAqICggZyAtIGIgKSAvIGRpZmY7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgZzpcbiAgICAgICAgICBoID0gMS4wNDcyICogKCBiIC0gciApIC8gZGlmZiArIDIuMDk0NDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBoID0gMS4wNDcyICogKCByIC0gZyApIC8gZGlmZiArIDQuMTg4ODtcbiAgICAgIH1cblxuICAgICAgaCA9IE1hdGgucm91bmQoIGggKiAzNjAgLyA2LjI4MzIgKTtcbiAgICAgIHMgPSBNYXRoLnJvdW5kKCBzICogMTAwICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGggPSBzID0gMDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICB9XG5cbiAgICBoc2xhWyAwIF0gPSBoO1xuICAgIGhzbGFbIDEgXSA9IHM7XG4gICAgaHNsYVsgMiBdID0gTWF0aC5yb3VuZCggbCApO1xuICAgIGhzbGFbIDMgXSA9IHRoaXNbIDMgXTtcblxuICAgIHJldHVybiBoc2xhO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWV0aG9kIHY2LlJHQkEjcmdiYVxuICAgKiBAc2VlIHY2LlJlbmRlcmVyR0wjdmVydGljZXNcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgcmdiYTogZnVuY3Rpb24gcmdiYSAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LlJHQkF9IC0g0LjQvdGC0LXRgNC/0L7Qu9C40YDQvtCy0LDQvdC90YvQuSDQvNC10LbQtNGDINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQvNC4INC/0LDRgNCw0LzQtdGC0YDQsNC80LguXG4gICAqIEBtZXRob2QgdjYuUkdCQSNsZXJwXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHJcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgZ1xuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBiXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHZhbHVlXG4gICAqIEByZXR1cm4ge3Y2LlJHQkF9XG4gICAqIEBzZWUgdjYuUkdCQSNsZXJwQ29sb3JcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoIDEwMCwgMC4yNSApLmxlcnAoIDIwMCwgMjAwLCAyMDAsIDAuNSApOyAvLyAtPiBuZXcgUkdCQSggMTUwLCAxNTAsIDE1MCwgMC4yNSApXG4gICAqL1xuICBsZXJwOiBmdW5jdGlvbiBsZXJwICggciwgZywgYiwgdmFsdWUgKVxuICB7XG4gICAgciA9IHRoaXNbIDAgXSArICggciAtIHRoaXNbIDAgXSApICogdmFsdWU7XG4gICAgZyA9IHRoaXNbIDEgXSArICggZyAtIHRoaXNbIDEgXSApICogdmFsdWU7XG4gICAgYiA9IHRoaXNbIDIgXSArICggYiAtIHRoaXNbIDIgXSApICogdmFsdWU7XG4gICAgcmV0dXJuIG5ldyBSR0JBKCByLCBnLCBiLCB0aGlzWyAzIF0gKTtcbiAgfSxcblxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSB7QGxpbmsgdjYuUkdCQX0gLSDQuNC90YLQtdGA0L/QvtC70LjRgNC+0LLQsNC90L3Ri9C5INC80LXQttC00YMgYGNvbG9yYC5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI2xlcnBDb2xvclxuICAgKiBAcGFyYW0gIHtUQ29sb3J9ICBjb2xvclxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB2YWx1ZVxuICAgKiBAcmV0dXJuIHt2Ni5SR0JBfVxuICAgKiBAc2VlIHY2LlJHQkEjbGVycFxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgYSA9IG5ldyBSR0JBKCAxMDAsIDAuMjUgKTtcbiAgICogdmFyIGIgPSBuZXcgUkdCQSggMjAwLCAwICk7XG4gICAqIHZhciBjID0gYS5sZXJwQ29sb3IoIGIsIDAuNSApOyAvLyAtPiBuZXcgUkdCQSggMTUwLCAxNTAsIDE1MCwgMC4yNSApXG4gICAqL1xuICBsZXJwQ29sb3I6IGZ1bmN0aW9uIGxlcnBDb2xvciAoIGNvbG9yLCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgciwgZywgYjtcblxuICAgIGlmICggdHlwZW9mIGNvbG9yICE9PSAnb2JqZWN0JyApIHtcbiAgICAgIGNvbG9yID0gcGFyc2UoIGNvbG9yICk7XG4gICAgfVxuXG4gICAgaWYgKCBjb2xvci50eXBlICE9PSAncmdiYScgKSB7XG4gICAgICBjb2xvciA9IGNvbG9yLnJnYmEoKTtcbiAgICB9XG5cbiAgICByID0gY29sb3JbIDAgXTtcbiAgICBnID0gY29sb3JbIDEgXTtcbiAgICBiID0gY29sb3JbIDIgXTtcblxuICAgIHJldHVybiB0aGlzLmxlcnAoIHIsIGcsIGIsIHZhbHVlICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LlJHQkF9IC0g0LfQsNGC0LXQvNC90LXQvdC90YvQuSDQuNC70Lgg0LfQsNGB0LLQtdGC0LvQtdC90L3Ri9C5INC90LAgYHBlcmNlbnRhZ2VzYCDQv9GA0L7RhtC10L3RgtC+0LIuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNzaGFkZVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBwZXJjZW50YWdlXG4gICAqIEByZXR1cm4ge3Y2LlJHQkF9XG4gICAqIEBzZWUgdjYuSFNMQSNzaGFkZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSgpLnNoYWRlKCA1MCApOyAvLyAtPiBuZXcgUkdCQSggMTI4IClcbiAgICovXG4gIHNoYWRlOiBmdW5jdGlvbiBzaGFkZSAoIHBlcmNlbnRhZ2VzIClcbiAge1xuICAgIHJldHVybiB0aGlzLmhzbGEoKS5zaGFkZSggcGVyY2VudGFnZXMgKS5yZ2JhKCk7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IFJHQkFcbn07XG5cbi8qKlxuICogQG1lbWJlciB7c3RyaW5nfSB2Ni5SR0JBI3R5cGUgYFwicmdiYVwiYC4g0K3RgtC+INGB0LLQvtC50YHRgtCy0L4g0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC00LvRjyDQutC+0L3QstC10YDRgtC40YDQvtCy0LDQvdC40Y8g0LzQtdC20LTRgyB7QGxpbmsgdjYuSFNMQX0g0Lgge0BsaW5rIHY2LlJHQkF9LlxuICovXG5SR0JBLnByb3RvdHlwZS50eXBlID0gJ3JnYmEnO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBlc2xpbnQga2V5LXNwYWNpbmc6IFsgXCJlcnJvclwiLCB7IFwiYWxpZ25cIjogeyBcImJlZm9yZUNvbG9uXCI6IGZhbHNlLCBcImFmdGVyQ29sb25cIjogdHJ1ZSwgXCJvblwiOiBcInZhbHVlXCIgfSB9IF0gKi9cblxudmFyIGNvbG9ycyA9IHtcbiAgYWxpY2VibHVlOiAgICAgICAgICAgICdmMGY4ZmZmZicsIGFudGlxdWV3aGl0ZTogICAgICAgICAnZmFlYmQ3ZmYnLFxuICBhcXVhOiAgICAgICAgICAgICAgICAgJzAwZmZmZmZmJywgYXF1YW1hcmluZTogICAgICAgICAgICc3ZmZmZDRmZicsXG4gIGF6dXJlOiAgICAgICAgICAgICAgICAnZjBmZmZmZmYnLCBiZWlnZTogICAgICAgICAgICAgICAgJ2Y1ZjVkY2ZmJyxcbiAgYmlzcXVlOiAgICAgICAgICAgICAgICdmZmU0YzRmZicsIGJsYWNrOiAgICAgICAgICAgICAgICAnMDAwMDAwZmYnLFxuICBibGFuY2hlZGFsbW9uZDogICAgICAgJ2ZmZWJjZGZmJywgYmx1ZTogICAgICAgICAgICAgICAgICcwMDAwZmZmZicsXG4gIGJsdWV2aW9sZXQ6ICAgICAgICAgICAnOGEyYmUyZmYnLCBicm93bjogICAgICAgICAgICAgICAgJ2E1MmEyYWZmJyxcbiAgYnVybHl3b29kOiAgICAgICAgICAgICdkZWI4ODdmZicsIGNhZGV0Ymx1ZTogICAgICAgICAgICAnNWY5ZWEwZmYnLFxuICBjaGFydHJldXNlOiAgICAgICAgICAgJzdmZmYwMGZmJywgY2hvY29sYXRlOiAgICAgICAgICAgICdkMjY5MWVmZicsXG4gIGNvcmFsOiAgICAgICAgICAgICAgICAnZmY3ZjUwZmYnLCBjb3JuZmxvd2VyYmx1ZTogICAgICAgJzY0OTVlZGZmJyxcbiAgY29ybnNpbGs6ICAgICAgICAgICAgICdmZmY4ZGNmZicsIGNyaW1zb246ICAgICAgICAgICAgICAnZGMxNDNjZmYnLFxuICBjeWFuOiAgICAgICAgICAgICAgICAgJzAwZmZmZmZmJywgZGFya2JsdWU6ICAgICAgICAgICAgICcwMDAwOGJmZicsXG4gIGRhcmtjeWFuOiAgICAgICAgICAgICAnMDA4YjhiZmYnLCBkYXJrZ29sZGVucm9kOiAgICAgICAgJ2I4ODYwYmZmJyxcbiAgZGFya2dyYXk6ICAgICAgICAgICAgICdhOWE5YTlmZicsIGRhcmtncmVlbjogICAgICAgICAgICAnMDA2NDAwZmYnLFxuICBkYXJra2hha2k6ICAgICAgICAgICAgJ2JkYjc2YmZmJywgZGFya21hZ2VudGE6ICAgICAgICAgICc4YjAwOGJmZicsXG4gIGRhcmtvbGl2ZWdyZWVuOiAgICAgICAnNTU2YjJmZmYnLCBkYXJrb3JhbmdlOiAgICAgICAgICAgJ2ZmOGMwMGZmJyxcbiAgZGFya29yY2hpZDogICAgICAgICAgICc5OTMyY2NmZicsIGRhcmtyZWQ6ICAgICAgICAgICAgICAnOGIwMDAwZmYnLFxuICBkYXJrc2FsbW9uOiAgICAgICAgICAgJ2U5OTY3YWZmJywgZGFya3NlYWdyZWVuOiAgICAgICAgICc4ZmJjOGZmZicsXG4gIGRhcmtzbGF0ZWJsdWU6ICAgICAgICAnNDgzZDhiZmYnLCBkYXJrc2xhdGVncmF5OiAgICAgICAgJzJmNGY0ZmZmJyxcbiAgZGFya3R1cnF1b2lzZTogICAgICAgICcwMGNlZDFmZicsIGRhcmt2aW9sZXQ6ICAgICAgICAgICAnOTQwMGQzZmYnLFxuICBkZWVwcGluazogICAgICAgICAgICAgJ2ZmMTQ5M2ZmJywgZGVlcHNreWJsdWU6ICAgICAgICAgICcwMGJmZmZmZicsXG4gIGRpbWdyYXk6ICAgICAgICAgICAgICAnNjk2OTY5ZmYnLCBkb2RnZXJibHVlOiAgICAgICAgICAgJzFlOTBmZmZmJyxcbiAgZmVsZHNwYXI6ICAgICAgICAgICAgICdkMTkyNzVmZicsIGZpcmVicmljazogICAgICAgICAgICAnYjIyMjIyZmYnLFxuICBmbG9yYWx3aGl0ZTogICAgICAgICAgJ2ZmZmFmMGZmJywgZm9yZXN0Z3JlZW46ICAgICAgICAgICcyMjhiMjJmZicsXG4gIGZ1Y2hzaWE6ICAgICAgICAgICAgICAnZmYwMGZmZmYnLCBnYWluc2Jvcm86ICAgICAgICAgICAgJ2RjZGNkY2ZmJyxcbiAgZ2hvc3R3aGl0ZTogICAgICAgICAgICdmOGY4ZmZmZicsIGdvbGQ6ICAgICAgICAgICAgICAgICAnZmZkNzAwZmYnLFxuICBnb2xkZW5yb2Q6ICAgICAgICAgICAgJ2RhYTUyMGZmJywgZ3JheTogICAgICAgICAgICAgICAgICc4MDgwODBmZicsXG4gIGdyZWVuOiAgICAgICAgICAgICAgICAnMDA4MDAwZmYnLCBncmVlbnllbGxvdzogICAgICAgICAgJ2FkZmYyZmZmJyxcbiAgaG9uZXlkZXc6ICAgICAgICAgICAgICdmMGZmZjBmZicsIGhvdHBpbms6ICAgICAgICAgICAgICAnZmY2OWI0ZmYnLFxuICBpbmRpYW5yZWQ6ICAgICAgICAgICAgJ2NkNWM1Y2ZmJywgaW5kaWdvOiAgICAgICAgICAgICAgICc0YjAwODJmZicsXG4gIGl2b3J5OiAgICAgICAgICAgICAgICAnZmZmZmYwZmYnLCBraGFraTogICAgICAgICAgICAgICAgJ2YwZTY4Y2ZmJyxcbiAgbGF2ZW5kZXI6ICAgICAgICAgICAgICdlNmU2ZmFmZicsIGxhdmVuZGVyYmx1c2g6ICAgICAgICAnZmZmMGY1ZmYnLFxuICBsYXduZ3JlZW46ICAgICAgICAgICAgJzdjZmMwMGZmJywgbGVtb25jaGlmZm9uOiAgICAgICAgICdmZmZhY2RmZicsXG4gIGxpZ2h0Ymx1ZTogICAgICAgICAgICAnYWRkOGU2ZmYnLCBsaWdodGNvcmFsOiAgICAgICAgICAgJ2YwODA4MGZmJyxcbiAgbGlnaHRjeWFuOiAgICAgICAgICAgICdlMGZmZmZmZicsIGxpZ2h0Z29sZGVucm9keWVsbG93OiAnZmFmYWQyZmYnLFxuICBsaWdodGdyZXk6ICAgICAgICAgICAgJ2QzZDNkM2ZmJywgbGlnaHRncmVlbjogICAgICAgICAgICc5MGVlOTBmZicsXG4gIGxpZ2h0cGluazogICAgICAgICAgICAnZmZiNmMxZmYnLCBsaWdodHNhbG1vbjogICAgICAgICAgJ2ZmYTA3YWZmJyxcbiAgbGlnaHRzZWFncmVlbjogICAgICAgICcyMGIyYWFmZicsIGxpZ2h0c2t5Ymx1ZTogICAgICAgICAnODdjZWZhZmYnLFxuICBsaWdodHNsYXRlYmx1ZTogICAgICAgJzg0NzBmZmZmJywgbGlnaHRzbGF0ZWdyYXk6ICAgICAgICc3Nzg4OTlmZicsXG4gIGxpZ2h0c3RlZWxibHVlOiAgICAgICAnYjBjNGRlZmYnLCBsaWdodHllbGxvdzogICAgICAgICAgJ2ZmZmZlMGZmJyxcbiAgbGltZTogICAgICAgICAgICAgICAgICcwMGZmMDBmZicsIGxpbWVncmVlbjogICAgICAgICAgICAnMzJjZDMyZmYnLFxuICBsaW5lbjogICAgICAgICAgICAgICAgJ2ZhZjBlNmZmJywgbWFnZW50YTogICAgICAgICAgICAgICdmZjAwZmZmZicsXG4gIG1hcm9vbjogICAgICAgICAgICAgICAnODAwMDAwZmYnLCBtZWRpdW1hcXVhbWFyaW5lOiAgICAgJzY2Y2RhYWZmJyxcbiAgbWVkaXVtYmx1ZTogICAgICAgICAgICcwMDAwY2RmZicsIG1lZGl1bW9yY2hpZDogICAgICAgICAnYmE1NWQzZmYnLFxuICBtZWRpdW1wdXJwbGU6ICAgICAgICAgJzkzNzBkOGZmJywgbWVkaXVtc2VhZ3JlZW46ICAgICAgICczY2IzNzFmZicsXG4gIG1lZGl1bXNsYXRlYmx1ZTogICAgICAnN2I2OGVlZmYnLCBtZWRpdW1zcHJpbmdncmVlbjogICAgJzAwZmE5YWZmJyxcbiAgbWVkaXVtdHVycXVvaXNlOiAgICAgICc0OGQxY2NmZicsIG1lZGl1bXZpb2xldHJlZDogICAgICAnYzcxNTg1ZmYnLFxuICBtaWRuaWdodGJsdWU6ICAgICAgICAgJzE5MTk3MGZmJywgbWludGNyZWFtOiAgICAgICAgICAgICdmNWZmZmFmZicsXG4gIG1pc3R5cm9zZTogICAgICAgICAgICAnZmZlNGUxZmYnLCBtb2NjYXNpbjogICAgICAgICAgICAgJ2ZmZTRiNWZmJyxcbiAgbmF2YWpvd2hpdGU6ICAgICAgICAgICdmZmRlYWRmZicsIG5hdnk6ICAgICAgICAgICAgICAgICAnMDAwMDgwZmYnLFxuICBvbGRsYWNlOiAgICAgICAgICAgICAgJ2ZkZjVlNmZmJywgb2xpdmU6ICAgICAgICAgICAgICAgICc4MDgwMDBmZicsXG4gIG9saXZlZHJhYjogICAgICAgICAgICAnNmI4ZTIzZmYnLCBvcmFuZ2U6ICAgICAgICAgICAgICAgJ2ZmYTUwMGZmJyxcbiAgb3JhbmdlcmVkOiAgICAgICAgICAgICdmZjQ1MDBmZicsIG9yY2hpZDogICAgICAgICAgICAgICAnZGE3MGQ2ZmYnLFxuICBwYWxlZ29sZGVucm9kOiAgICAgICAgJ2VlZThhYWZmJywgcGFsZWdyZWVuOiAgICAgICAgICAgICc5OGZiOThmZicsXG4gIHBhbGV0dXJxdW9pc2U6ICAgICAgICAnYWZlZWVlZmYnLCBwYWxldmlvbGV0cmVkOiAgICAgICAgJ2Q4NzA5M2ZmJyxcbiAgcGFwYXlhd2hpcDogICAgICAgICAgICdmZmVmZDVmZicsIHBlYWNocHVmZjogICAgICAgICAgICAnZmZkYWI5ZmYnLFxuICBwZXJ1OiAgICAgICAgICAgICAgICAgJ2NkODUzZmZmJywgcGluazogICAgICAgICAgICAgICAgICdmZmMwY2JmZicsXG4gIHBsdW06ICAgICAgICAgICAgICAgICAnZGRhMGRkZmYnLCBwb3dkZXJibHVlOiAgICAgICAgICAgJ2IwZTBlNmZmJyxcbiAgcHVycGxlOiAgICAgICAgICAgICAgICc4MDAwODBmZicsIHJlZDogICAgICAgICAgICAgICAgICAnZmYwMDAwZmYnLFxuICByb3N5YnJvd246ICAgICAgICAgICAgJ2JjOGY4ZmZmJywgcm95YWxibHVlOiAgICAgICAgICAgICc0MTY5ZTFmZicsXG4gIHNhZGRsZWJyb3duOiAgICAgICAgICAnOGI0NTEzZmYnLCBzYWxtb246ICAgICAgICAgICAgICAgJ2ZhODA3MmZmJyxcbiAgc2FuZHlicm93bjogICAgICAgICAgICdmNGE0NjBmZicsIHNlYWdyZWVuOiAgICAgICAgICAgICAnMmU4YjU3ZmYnLFxuICBzZWFzaGVsbDogICAgICAgICAgICAgJ2ZmZjVlZWZmJywgc2llbm5hOiAgICAgICAgICAgICAgICdhMDUyMmRmZicsXG4gIHNpbHZlcjogICAgICAgICAgICAgICAnYzBjMGMwZmYnLCBza3libHVlOiAgICAgICAgICAgICAgJzg3Y2VlYmZmJyxcbiAgc2xhdGVibHVlOiAgICAgICAgICAgICc2YTVhY2RmZicsIHNsYXRlZ3JheTogICAgICAgICAgICAnNzA4MDkwZmYnLFxuICBzbm93OiAgICAgICAgICAgICAgICAgJ2ZmZmFmYWZmJywgc3ByaW5nZ3JlZW46ICAgICAgICAgICcwMGZmN2ZmZicsXG4gIHN0ZWVsYmx1ZTogICAgICAgICAgICAnNDY4MmI0ZmYnLCB0YW46ICAgICAgICAgICAgICAgICAgJ2QyYjQ4Y2ZmJyxcbiAgdGVhbDogICAgICAgICAgICAgICAgICcwMDgwODBmZicsIHRoaXN0bGU6ICAgICAgICAgICAgICAnZDhiZmQ4ZmYnLFxuICB0b21hdG86ICAgICAgICAgICAgICAgJ2ZmNjM0N2ZmJywgdHVycXVvaXNlOiAgICAgICAgICAgICc0MGUwZDBmZicsXG4gIHZpb2xldDogICAgICAgICAgICAgICAnZWU4MmVlZmYnLCB2aW9sZXRyZWQ6ICAgICAgICAgICAgJ2QwMjA5MGZmJyxcbiAgd2hlYXQ6ICAgICAgICAgICAgICAgICdmNWRlYjNmZicsIHdoaXRlOiAgICAgICAgICAgICAgICAnZmZmZmZmZmYnLFxuICB3aGl0ZXNtb2tlOiAgICAgICAgICAgJ2Y1ZjVmNWZmJywgeWVsbG93OiAgICAgICAgICAgICAgICdmZmZmMDBmZicsXG4gIHllbGxvd2dyZWVuOiAgICAgICAgICAnOWFjZDMyZmYnLCB0cmFuc3BhcmVudDogICAgICAgICAgJzAwMDAwMDAwJ1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb2xvcnM7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2U7XG5cbnZhciBSR0JBICAgPSByZXF1aXJlKCAnLi4vUkdCQScgKTtcbnZhciBIU0xBICAgPSByZXF1aXJlKCAnLi4vSFNMQScgKTtcbnZhciBjb2xvcnMgPSByZXF1aXJlKCAnLi9jb2xvcnMnICk7XG5cbnZhciBwYXJzZWQgPSBPYmplY3QuY3JlYXRlKCBudWxsICk7XG5cbnZhciBUUkFOU1BBUkVOVCA9IFtcbiAgMCwgMCwgMCwgMFxuXTtcblxudmFyIHJlZ2V4cHMgPSB7XG4gIGhleDM6IC9eIyhbMC05YS1mXSkoWzAtOWEtZl0pKFswLTlhLWZdKShbMC05YS1mXSk/JC8sXG4gIGhleDogIC9eIyhbMC05YS1mXXs2fSkoWzAtOWEtZl17Mn0pPyQvLFxuICByZ2I6ICAvXnJnYlxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKlxcKSR8XlxccypyZ2JhXFxzKlxcKFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqXFwpJC8sXG4gIGhzbDogIC9eaHNsXFxzKlxcKFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHUwMDI1XFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFx1MDAyNVxccypcXCkkfF5cXHMqaHNsYVxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFx1MDAyNVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqXFwpJC9cbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgcGFyc2VcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nXG4gKiBAcmV0dXJuIHttb2R1bGU6XCJ2Ni5qc1wiLlJHQkF8bW9kdWxlOlwidjYuanNcIi5IU0xBfVxuICogQGV4YW1wbGVcbiAqIHBhcnNlKCAnI2YwZjAnICk7ICAgICAgICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDI1NSwgMCwgMjU1LCAwIClcbiAqIHBhcnNlKCAnIzAwMDAwMGZmJyApOyAgICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDAsIDAsIDAsIDEgKVxuICogcGFyc2UoICdtYWdlbnRhJyApOyAgICAgICAgICAgICAgICAgICAvLyAtPiBuZXcgUkdCQSggMjU1LCAwLCAyNTUsIDEgKVxuICogcGFyc2UoICd0cmFuc3BhcmVudCcgKTsgICAgICAgICAgICAgICAvLyAtPiBuZXcgUkdCQSggMCwgMCwgMCwgMCApXG4gKiBwYXJzZSggJ2hzbCggMCwgMTAwJSwgNTAlICknICk7ICAgICAgIC8vIC0+IG5ldyBIU0xBKCAwLCAxMDAsIDUwLCAxIClcbiAqIHBhcnNlKCAnaHNsYSggMCwgMTAwJSwgNTAlLCAwLjUgKScgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDEwMCwgNTAsIDAuNSApXG4gKi9cbmZ1bmN0aW9uIHBhcnNlICggc3RyaW5nIClcbntcbiAgdmFyIGNhY2hlID0gcGFyc2VkWyBzdHJpbmcgXSB8fCBwYXJzZWRbIHN0cmluZyA9IHN0cmluZy50cmltKCkudG9Mb3dlckNhc2UoKSBdO1xuXG4gIGlmICggISBjYWNoZSApIHtcbiAgICBpZiAoICggY2FjaGUgPSBjb2xvcnNbIHN0cmluZyBdICkgKSB7XG4gICAgICBjYWNoZSA9IG5ldyBDb2xvckRhdGEoIHBhcnNlSGV4KCBjYWNoZSApLCBSR0JBICk7XG4gICAgfSBlbHNlIGlmICggKCBjYWNoZSA9IHJlZ2V4cHMuaGV4LmV4ZWMoIHN0cmluZyApICkgfHwgKCBjYWNoZSA9IHJlZ2V4cHMuaGV4My5leGVjKCBzdHJpbmcgKSApICkge1xuICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKCBwYXJzZUhleCggZm9ybWF0SGV4KCBjYWNoZSApICksIFJHQkEgKTtcbiAgICB9IGVsc2UgaWYgKCAoIGNhY2hlID0gcmVnZXhwcy5yZ2IuZXhlYyggc3RyaW5nICkgKSApIHtcbiAgICAgIGNhY2hlID0gbmV3IENvbG9yRGF0YSggY29tcGFjdE1hdGNoKCBjYWNoZSApLCBSR0JBICk7XG4gICAgfSBlbHNlIGlmICggKCBjYWNoZSA9IHJlZ2V4cHMuaHNsLmV4ZWMoIHN0cmluZyApICkgKSB7XG4gICAgICBjYWNoZSA9IG5ldyBDb2xvckRhdGEoIGNvbXBhY3RNYXRjaCggY2FjaGUgKSwgSFNMQSApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBTeW50YXhFcnJvciggc3RyaW5nICsgJyBpcyBub3QgYSB2YWxpZCBzeW50YXgnICk7XG4gICAgfVxuXG4gICAgcGFyc2VkWyBzdHJpbmcgXSA9IGNhY2hlO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBjYWNoZS5jb2xvciggY2FjaGVbIDAgXSwgY2FjaGVbIDEgXSwgY2FjaGVbIDIgXSwgY2FjaGVbIDMgXSApO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGZvcm1hdEhleFxuICogQHBhcmFtICB7YXJyYXk8c3RyaW5nPz59IG1hdGNoXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAZXhhbXBsZVxuICogZm9ybWF0SGV4KCBbICcjMDAwMDAwZmYnLCAnMDAwMDAwJywgJ2ZmJyBdICk7IC8vIC0+ICcwMDAwMDBmZidcbiAqIGZvcm1hdEhleCggWyAnIzAwMDcnLCAnMCcsICcwJywgJzAnLCAnNycgXSApOyAvLyAtPiAnMDAwMDAwNzcnXG4gKiBmb3JtYXRIZXgoIFsgJyMwMDAnLCAnMCcsICcwJywgJzAnLCBudWxsIF0gKTsgLy8gLT4gJzAwMDAwMGZmJ1xuICovXG5mdW5jdGlvbiBmb3JtYXRIZXggKCBtYXRjaCApXG57XG4gIHZhciByLCBnLCBiLCBhO1xuXG4gIGlmICggbWF0Y2gubGVuZ3RoID09PSAzICkge1xuICAgIHJldHVybiBtYXRjaFsgMSBdICsgKCBtYXRjaFsgMiBdIHx8ICdmZicgKTtcbiAgfVxuXG4gIHIgPSBtYXRjaFsgMSBdO1xuICBnID0gbWF0Y2hbIDIgXTtcbiAgYiA9IG1hdGNoWyAzIF07XG4gIGEgPSBtYXRjaFsgNCBdIHx8ICdmJztcblxuICByZXR1cm4gciArIHIgKyBnICsgZyArIGIgKyBiICsgYSArIGE7XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgcGFyc2VIZXhcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgIGhleFxuICogQHJldHVybiB7YXJyYXk8bnVtYmVyPn1cbiAqIEBleGFtcGxlXG4gKiBwYXJzZUhleCggJzAwMDAwMDAwJyApOyAvLyAtPiBbIDAsIDAsIDAsIDAgXVxuICogcGFyc2VIZXgoICdmZjAwZmZmZicgKTsgLy8gLT4gWyAyNTUsIDAsIDI1NSwgMSBdXG4gKi9cbmZ1bmN0aW9uIHBhcnNlSGV4ICggaGV4IClcbntcbiAgaWYgKCBoZXggPT0gMCApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICByZXR1cm4gVFJBTlNQQVJFTlQ7XG4gIH1cblxuICBoZXggPSBwYXJzZUludCggaGV4LCAxNiApO1xuXG4gIHJldHVybiBbXG4gICAgLy8gUlxuICAgIGhleCA+PiAyNCAmIDI1NSwgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgLy8gR1xuICAgIGhleCA+PiAxNiAmIDI1NSwgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgLy8gQlxuICAgIGhleCA+PiA4ICAmIDI1NSwgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgLy8gQVxuICAgICggaGV4ICYgMjU1ICkgLyAyNTUgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gIF07XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY29tcGFjdE1hdGNoXG4gKiBAcGFyYW0gIHthcnJheTxzdHJpbmc/Pn0gbWF0Y2hcbiAqIEByZXR1cm4ge2FycmF5PG51bWJlcj59XG4gKi9cbmZ1bmN0aW9uIGNvbXBhY3RNYXRjaCAoIG1hdGNoIClcbntcbiAgaWYgKCBtYXRjaFsgNyBdICkge1xuICAgIHJldHVybiBbXG4gICAgICBOdW1iZXIoIG1hdGNoWyA0IF0gKSxcbiAgICAgIE51bWJlciggbWF0Y2hbIDUgXSApLFxuICAgICAgTnVtYmVyKCBtYXRjaFsgNiBdICksXG4gICAgICBOdW1iZXIoIG1hdGNoWyA3IF0gKVxuICAgIF07XG4gIH1cblxuICByZXR1cm4gW1xuICAgIE51bWJlciggbWF0Y2hbIDEgXSApLFxuICAgIE51bWJlciggbWF0Y2hbIDIgXSApLFxuICAgIE51bWJlciggbWF0Y2hbIDMgXSApXG4gIF07XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBjb25zdHJ1Y3RvciBDb2xvckRhdGFcbiAqIEBwYXJhbSB7YXJyYXk8bnVtYmVyPn0gbWF0Y2hcbiAqIEBwYXJhbSB7ZnVuY3Rpb259ICAgICAgY29sb3JcbiAqL1xuZnVuY3Rpb24gQ29sb3JEYXRhICggbWF0Y2gsIGNvbG9yIClcbntcbiAgdGhpc1sgMCBdID0gbWF0Y2hbIDAgXTtcbiAgdGhpc1sgMSBdID0gbWF0Y2hbIDEgXTtcbiAgdGhpc1sgMiBdID0gbWF0Y2hbIDIgXTtcbiAgdGhpc1sgMyBdID0gbWF0Y2hbIDMgXTtcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCa0L7QvdGB0YLQsNC90YLRiy5cbiAqIEBuYW1lc3BhY2Uge29iamVjdH0gdjYuY29uc3RhbnRzXG4gKiBAZXhhbXBsZVxuICogdmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2NvbnN0YW50cycgKTtcbiAqL1xuXG52YXIgX2NvbnN0YW50cyA9IHt9O1xudmFyIF9jb3VudGVyICAgPSAwO1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQutC+0L3RgdGC0LDQvdGC0YMuXG4gKiBAbWV0aG9kIHY2LmNvbnN0YW50cy5hZGRcbiAqIEBwYXJhbSAge3N0cmluZ30ga2V5INCY0LzRjyDQutC+0L3RgdGC0LDQvdGC0YsuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiBjb25zdGFudHMuYWRkKCAnQ1VTVE9NX0NPTlNUQU5UJyApO1xuICovXG5mdW5jdGlvbiBhZGQgKCBrZXkgKVxue1xuICBpZiAoIHR5cGVvZiBfY29uc3RhbnRzWyBrZXkgXSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgcmUtc2V0IChhZGQpIGV4aXN0aW5nIGNvbnN0YW50OiAnICsga2V5ICk7XG4gIH1cblxuICBfY29uc3RhbnRzWyBrZXkgXSA9ICsrX2NvdW50ZXI7XG59XG5cbi8qKlxuICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LrQvtC90YHRgtCw0L3RgtGDLlxuICogQG1ldGhvZCB2Ni5jb25zdGFudHMuZ2V0XG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAga2V5INCY0LzRjyDQutC+0L3RgdGC0LDQvdGC0YsuXG4gKiBAcmV0dXJuIHtjb25zdGFudH0gICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC60L7QvdGB0YLQsNC90YLRgy5cbiAqIEBleGFtcGxlXG4gKiBjb25zdGFudHMuZ2V0KCAnQ1VTVE9NX0NPTlNUQU5UJyApO1xuICovXG5mdW5jdGlvbiBnZXQgKCBrZXkgKVxue1xuICBpZiAoIHR5cGVvZiBfY29uc3RhbnRzWyBrZXkgXSA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgdGhyb3cgUmVmZXJlbmNlRXJyb3IoICdDYW5ub3QgZ2V0IHVua25vd24gY29uc3RhbnQ6ICcgKyBrZXkgKTtcbiAgfVxuXG4gIHJldHVybiBfY29uc3RhbnRzWyBrZXkgXTtcbn1cblxuW1xuICAnQVVUTycsXG4gICdHTCcsXG4gICcyRCcsXG4gICdMRUZUJyxcbiAgJ1RPUCcsXG4gICdDRU5URVInLFxuICAnTUlERExFJyxcbiAgJ1JJR0hUJyxcbiAgJ0JPVFRPTScsXG4gICdQRVJDRU5UJ1xuXS5mb3JFYWNoKCBhZGQgKTtcblxuZXhwb3J0cy5hZGQgPSBhZGQ7XG5leHBvcnRzLmdldCA9IGdldDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIExpZ2h0RW1pdHRlciA9IHJlcXVpcmUoICdsaWdodF9lbWl0dGVyJyApO1xuXG4vKipcbiAqIEBhYnN0cmFjdFxuICogQGNvbnN0cnVjdG9yIHY2LkFic3RyYWN0SW1hZ2VcbiAqIEBleHRlbmRzIExpZ2h0RW1pdHRlclxuICogQHNlZSB2Ni5Db21wb3VuZGVkSW1hZ2VcbiAqIEBzZWUgdjYuSW1hZ2VcbiAqL1xuZnVuY3Rpb24gQWJzdHJhY3RJbWFnZSAoKVxue1xuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNzeCBcIlNvdXJjZSBYXCIuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI3N5IFwiU291cmNlIFlcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2Ujc3cgXCJTb3VyY2UgV2lkdGhcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2Ujc2ggXCJTb3VyY2UgSGVpZ2h0XCIuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI2R3IFwiRGVzdGluYXRpb24gV2lkdGhcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2UjZGggXCJEZXN0aW5hdGlvbiBIZWlnaHRcIi5cbiAgICovXG5cbiAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBhYnN0cmFjdCBjbGFzcyAobmV3IHY2LkFic3RyYWN0SW1hZ2UpJyApO1xufVxuXG5BYnN0cmFjdEltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIExpZ2h0RW1pdHRlci5wcm90b3R5cGUgKTtcbkFic3RyYWN0SW1hZ2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQWJzdHJhY3RJbWFnZTtcblxuLyoqXG4gKiBAdmlydHVhbFxuICogQG1ldGhvZCB2Ni5BYnN0cmFjdEltYWdlI2dldFxuICogQHJldHVybiB7djYuSW1hZ2V9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBBYnN0cmFjdEltYWdlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWJzdHJhY3RJbWFnZSA9IHJlcXVpcmUoICcuL0Fic3RyYWN0SW1hZ2UnICk7XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yIHY2LkNvbXBvdW5kZWRJbWFnZVxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RJbWFnZVxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdEltYWdlfSBpbWFnZVxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzeFxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzeVxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzd1xuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzaFxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBkd1xuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBkaFxuICovXG5mdW5jdGlvbiBDb21wb3VuZGVkSW1hZ2UgKCBpbWFnZSwgc3gsIHN5LCBzdywgc2gsIGR3LCBkaCApXG57XG4gIHRoaXMuaW1hZ2UgPSBpbWFnZTtcbiAgdGhpcy5zeCAgICA9IHN4O1xuICB0aGlzLnN5ICAgID0gc3k7XG4gIHRoaXMuc3cgICAgPSBzdztcbiAgdGhpcy5zaCAgICA9IHNoO1xuICB0aGlzLmR3ICAgID0gZHc7XG4gIHRoaXMuZGggICAgPSBkaDtcbn1cblxuQ29tcG91bmRlZEltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0SW1hZ2UucHJvdG90eXBlICk7XG5Db21wb3VuZGVkSW1hZ2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ29tcG91bmRlZEltYWdlO1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5Db21wb3VuZGVkSW1hZ2UjZ2V0XG4gKi9cbkNvbXBvdW5kZWRJbWFnZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0ICgpXG57XG4gIHJldHVybiB0aGlzLmltYWdlLmdldCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb3VuZGVkSW1hZ2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb21wb3VuZGVkSW1hZ2UgPSByZXF1aXJlKCAnLi9Db21wb3VuZGVkSW1hZ2UnICk7XG52YXIgQWJzdHJhY3RJbWFnZSAgID0gcmVxdWlyZSggJy4vQWJzdHJhY3RJbWFnZScgKTtcblxuLyoqXG4gKiDQmtC70LDRgdGBINC60LDRgNGC0LjQvdC60LguXG4gKiBAY29uc3RydWN0b3IgdjYuSW1hZ2VcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0SW1hZ2VcbiAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudH0gaW1hZ2UgRE9NINGN0LvQtdC80LXQvdGCINC60LDRgNGC0LjQvdC60LggKElNRykuXG4gKiBAZmlyZXMgY29tcGxldGVcbiAqIEBzZWUgdjYuSW1hZ2UuZnJvbVVSTFxuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRJbWFnZVxuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2ltYWdlXG4gKiBAZXhhbXBsZVxuICogdmFyIEltYWdlID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvaW1hZ2UvSW1hZ2UnICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyBhbiBpbWFnZSB3aXRoIGFuIERPTSBpbWFnZTwvY2FwdGlvbj5cbiAqIC8vIEhUTUw6IDxpbWcgc3JjPVwiaW1hZ2UucG5nXCIgaWQ9XCJpbWFnZVwiIC8+XG4gKiB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnaW1hZ2UnICkgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIGFuIGltYWdlIHdpdGggYSBVUkw8L2NhcHRpb24+XG4gKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnaW1hZ2UucG5nJyApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+RmlyZXMgXCJjb21wbGV0ZVwiIGV2ZW50PC9jYXB0aW9uPlxuICogaW1hZ2Uub25jZSggJ2NvbXBsZXRlJywgZnVuY3Rpb24gKClcbiAqIHtcbiAqICAgY29uc29sZS5sb2coICdUaGUgaW1hZ2UgaXMgbG9hZGVkIScgKTtcbiAqIH0gKTtcbiAqL1xuZnVuY3Rpb24gSW1hZ2UgKCBpbWFnZSApXG57XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAoICEgaW1hZ2Uuc3JjICkge1xuICAgIHRocm93IEVycm9yKCAnQ2Fubm90IGNyZWF0ZSB2Ni5JbWFnZSBmcm9tIEhUTUxJbWFnZUVsZW1lbnQgd2l0aCBubyBcInNyY1wiIGF0dHJpYnV0ZSAobmV3IHY2LkltYWdlKScgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtIVE1MSW1hZ2VFbGVtZW50fSB2Ni5JbWFnZSNpbWFnZSBET00g0Y3QtdC70LXQvNC10L3RgiDQutCw0YDRgtC40L3QutC4LlxuICAgKi9cbiAgdGhpcy5pbWFnZSA9IGltYWdlO1xuXG4gIGlmICggdGhpcy5pbWFnZS5jb21wbGV0ZSApIHtcbiAgICB0aGlzLl9pbml0KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5pbWFnZS5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIGZ1bmN0aW9uIG9ubG9hZCAoKVxuICAgIHtcbiAgICAgIHNlbGYuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBvbmxvYWQgKTtcbiAgICAgIHNlbGYuX2luaXQoKTtcbiAgICB9LCBmYWxzZSApO1xuICB9XG59XG5cbkltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0SW1hZ2UucHJvdG90eXBlICk7XG5JbWFnZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBJbWFnZTtcblxuLyoqXG4gKiDQmNC90LjRhtC40LDQu9C40LfQuNGA0YPQtdGCINC60LDRgNGC0LjQvdC60YMg0L/QvtGB0LvQtSDQtdC1INC30LDQs9GA0YPQt9C60LguXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCB2Ni5JbWFnZSNfaW5pdFxuICogQHJldHVybiB7dm9pZH0g0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKi9cbkltYWdlLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uIF9pbml0ICgpXG57XG4gIHRoaXMuc3ggPSAwO1xuICB0aGlzLnN5ID0gMDtcbiAgdGhpcy5zdyA9IHRoaXMuZHcgPSB0aGlzLmltYWdlLndpZHRoOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgdGhpcy5zaCA9IHRoaXMuZGggPSB0aGlzLmltYWdlLmhlaWdodDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgdGhpcy5lbWl0KCAnY29tcGxldGUnICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5JbWFnZSNnZXRcbiAqL1xuSW1hZ2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAoKVxue1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0J7Qv9GA0LXQtNC10LvRj9C10YIsINC30LDQs9GA0YPQttC10L3QsCDQu9C4INC60LDRgNGC0LjQvdC60LAuXG4gKiBAbWV0aG9kIHY2LkltYWdlI2NvbXBsZXRlXG4gKiBAcmV0dXJuIHtib29sZWFufSBgdHJ1ZWAsINC10YHQu9C4INC30LDQs9GA0YPQttC10L3QsC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnaW1hZ2UucG5nJyApO1xuICpcbiAqIGlmICggISBpbWFnZS5jb21wbGV0ZSgpICkge1xuICogICBpbWFnZS5vbmNlKCAnY29tcGxldGUnLCBmdW5jdGlvbiAoKVxuICogICB7XG4gKiAgICAgY29uc29sZS5sb2coICdUaGUgaW1hZ2UgaXMgbG9hZGVkIScsIGltYWdlLmNvbXBsZXRlKCkgKTtcbiAqICAgfSApO1xuICogfVxuICovXG5JbWFnZS5wcm90b3R5cGUuY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZSAoKVxue1xuICByZXR1cm4gQm9vbGVhbiggdGhpcy5pbWFnZS5zcmMgKSAmJiB0aGlzLmltYWdlLmNvbXBsZXRlO1xufTtcblxuLyoqXG4gKiDQktC+0LfQstGA0LDRidCw0LXRgiBVUkwg0LrQsNGA0YLQuNC90LrQuC5cbiAqIEBtZXRob2QgdjYuSW1hZ2Ujc3JjXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFVSTCDQutCw0YDRgtC40L3QutC4LlxuICogQGV4YW1wbGVcbiAqIEltYWdlLmZyb21VUkwoICdpbWFnZS5wbmcnICkuc3JjKCk7IC8vIC0+IFwiaW1hZ2UucG5nXCJcbiAqL1xuSW1hZ2UucHJvdG90eXBlLnNyYyA9IGZ1bmN0aW9uIHNyYyAoKVxue1xuICByZXR1cm4gdGhpcy5pbWFnZS5zcmM7XG59O1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINC90L7QstGD0Y4ge0BsaW5rIHY2LkltYWdlfSDQuNC3IFVSTC5cbiAqIEBtZXRob2QgdjYuSW1hZ2UuZnJvbVVSTFxuICogQHBhcmFtICB7c3RyaW5nfSAgIHNyYyBVUkwg0LrQsNGA0YLQuNC90LrQuC5cbiAqIEByZXR1cm4ge3Y2LkltYWdlfSAgICAg0J3QvtCy0LDRjyB7QGxpbmsgdjYuSW1hZ2V9LlxuICogQGV4YW1wbGVcbiAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICdpbWFnZS5wbmcnICk7XG4gKi9cbkltYWdlLmZyb21VUkwgPSBmdW5jdGlvbiBmcm9tVVJMICggc3JjIClcbntcbiAgdmFyIGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2ltZycgKTtcbiAgaW1hZ2Uuc3JjID0gc3JjO1xuICByZXR1cm4gbmV3IEltYWdlKCBpbWFnZSApO1xufTtcblxuLyoqXG4gKiDQn9GA0L7Qv9C+0YDRhtC40L7QvdCw0LvRjNC90L4g0YDQsNGB0YLRj9Cz0LjQstCw0LXRgiDQuNC70Lgg0YHQttC40LzQsNC10YIg0LrQsNGA0YLQuNC90LrRgy5cbiAqIEBtZXRob2QgdjYuSW1hZ2Uuc3RyZXRjaFxuICogQHBhcmFtICB7djYuQWJzdHJhY3RJbWFnZX0gICBpbWFnZSDQmtCw0YDRgtC40L3QutCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBkdyAgICDQndC+0LLRi9C5IFwiRGVzdGluYXRpb24gV2lkdGhcIi5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgZGggICAg0J3QvtCy0YvQuSBcIkRlc3RpbmF0aW9uIEhlaWdodFwiLlxuICogQHJldHVybiB7djYuQ29tcG91bmRlZEltYWdlfSAgICAgICDQndC+0LLQsNGPINC60LDRgNGC0LjQvdC60LAuXG4gKiBAZXhhbXBsZVxuICogSW1hZ2Uuc3RyZXRjaCggaW1hZ2UsIDYwMCwgNDAwICk7XG4gKi9cbkltYWdlLnN0cmV0Y2ggPSBmdW5jdGlvbiBzdHJldGNoICggaW1hZ2UsIGR3LCBkaCApXG57XG4gIHZhciB2YWx1ZSA9IGRoIC8gaW1hZ2UuZGggKiBpbWFnZS5kdztcblxuICAvLyBTdHJldGNoIERXLlxuICBpZiAoIHZhbHVlIDwgZHcgKSB7XG4gICAgZGggPSBkdyAvIGltYWdlLmR3ICogaW1hZ2UuZGg7XG5cbiAgLy8gU3RyZXRjaCBESC5cbiAgfSBlbHNlIHtcbiAgICBkdyA9IHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBDb21wb3VuZGVkSW1hZ2UoIGltYWdlLmdldCgpLCBpbWFnZS5zeCwgaW1hZ2Uuc3ksIGltYWdlLnN3LCBpbWFnZS5zaCwgZHcsIGRoICk7XG59O1xuXG4vKipcbiAqINCe0LHRgNC10LfQsNC10YIg0LrQsNGA0YLQuNC90LrRgy5cbiAqIEBtZXRob2QgdjYuSW1hZ2UuY3V0XG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdEltYWdlfSAgIGltYWdlINCa0LDRgNGC0LjQvdC60LAsINC60L7RgtC+0YDRg9GOINC90LDQtNC+INC+0LHRgNC10LfQsNGC0YwuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIHN4ICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAsINC+0YLQutGD0LTQsCDQvdCw0LTQviDQvtCx0YDQtdC30LDRgtGMLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBzeSAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwLCDQvtGC0LrRg9C00LAg0L3QsNC00L4g0L7QsdGA0LXQt9Cw0YLRjC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgc3cgICAg0J3QvtCy0LDRjyDRiNC40YDQuNC90LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIHNoICAgINCd0L7QstCw0Y8g0LLRi9GB0L7RgtCwLlxuICogQHJldHVybiB7djYuQ29tcG91bmRlZEltYWdlfSAgICAgICDQntCx0YDQtdC30LDQvdC90LDRjyDQutCw0YDRgtC40L3QutCwLlxuICogQGV4YW1wbGVcbiAqIEltYWdlLmN1dCggaW1hZ2UsIDEwLCAyMCwgMzAsIDQwICk7XG4gKi9cbkltYWdlLmN1dCA9IGZ1bmN0aW9uIGN1dCAoIGltYWdlLCBzeCwgc3ksIGR3LCBkaCApXG57XG4gIHZhciBzdyA9IGltYWdlLnN3IC8gaW1hZ2UuZHcgKiBkdztcbiAgdmFyIHNoID0gaW1hZ2Uuc2ggLyBpbWFnZS5kaCAqIGRoO1xuXG4gIHN4ICs9IGltYWdlLnN4O1xuXG4gIGlmICggc3ggKyBzdyA+IGltYWdlLnN4ICsgaW1hZ2Uuc3cgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3V0IHRoZSBpbWFnZSBiZWNhdXNlIHRoZSBuZXcgaW1hZ2UgWCBvciBXIGlzIG91dCBvZiBib3VuZHMgKHY2LkltYWdlLmN1dCknICk7XG4gIH1cblxuICBzeSArPSBpbWFnZS5zeTtcblxuICBpZiAoIHN5ICsgc2ggPiBpbWFnZS5zeSArIGltYWdlLnNoICkge1xuICAgIHRocm93IEVycm9yKCAnQ2Fubm90IGN1dCB0aGUgaW1hZ2UgYmVjYXVzZSB0aGUgbmV3IGltYWdlIFkgb3IgSCBpcyBvdXQgb2YgYm91bmRzICh2Ni5JbWFnZS5jdXQpJyApO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBDb21wb3VuZGVkSW1hZ2UoIGltYWdlLmdldCgpLCBzeCwgc3ksIHN3LCBzaCwgZHcsIGRoICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX0Zsb2F0MzJBcnJheTtcblxuaWYgKCB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSAnZnVuY3Rpb24nICkge1xuICBfRmxvYXQzMkFycmF5ID0gRmxvYXQzMkFycmF5OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG59IGVsc2Uge1xuICBfRmxvYXQzMkFycmF5ID0gQXJyYXk7XG59XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0LzQsNGB0YHQuNCyINGBINC60L7QvtGA0LTQuNC90LDRgtCw0LzQuCDQstGB0LXRhSDRgtC+0YfQtdC6INC90YPQttC90L7Qs9C+INC/0L7Qu9C40LPQvtC90LAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjcmVhdGVQb2x5Z29uXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgIHNpZGVzINCa0L7Qu9C40YfQtdGB0YLQstC+INGB0YLQvtGA0L7QvSDQv9C+0LvQuNCz0L7QvdCwLlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSAgICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQvNCw0YHRgdC40LIgKEZsb2F0MzJBcnJheSkg0LrQvtGC0L7RgNGL0Lkg0LLRi9Cz0LvRj9C00LjRgiDRgtCw0Lo6IGBbIHgxLCB5MSwgeDIsIHkyIF1gLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICDQktGB0LUg0LfQvdCw0YfQtdC90LjRjyDQutC+0YLQvtGA0L7Qs9C+INC90L7RgNC80LDQu9C40LfQvtCy0LDQvdC90YsuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVBvbHlnb24gKCBzaWRlcyApXG57XG4gIHZhciBpICAgICAgICA9IE1hdGguZmxvb3IoIHNpZGVzICk7XG4gIHZhciBzdGVwICAgICA9IE1hdGguUEkgKiAyIC8gc2lkZXM7XG4gIHZhciB2ZXJ0aWNlcyA9IG5ldyBfRmxvYXQzMkFycmF5KCBpICogMiArIDIgKTtcblxuICBmb3IgKCA7IGkgPj0gMDsgLS1pICkge1xuICAgIHZlcnRpY2VzWyAgICAgaSAqIDIgXSA9IE1hdGguY29zKCBzdGVwICogaSApO1xuICAgIHZlcnRpY2VzWyAxICsgaSAqIDIgXSA9IE1hdGguc2luKCBzdGVwICogaSApO1xuICB9XG5cbiAgcmV0dXJuIHZlcnRpY2VzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVBvbHlnb247XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0Lgg0LjQvdC40YbQuNCw0LvQuNC30LjRgNGD0LXRgiDQvdC+0LLRg9GOIFdlYkdMINC/0YDQvtCz0YDQsNC80LzRgy5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNyZWF0ZVByb2dyYW1cbiAqIEBwYXJhbSAge1dlYkdMU2hhZGVyfSAgICAgICAgICAgdmVydCDQktC10YDRiNC40L3QvdGL0Lkg0YjQtdC50LTQtdGAICjRgdC+0LfQtNCw0L3QvdGL0Lkg0YEg0L/QvtC80L7RidGM0Y4gYHtAbGluayBjcmVhdGVTaGFkZXJ9YCkuXG4gKiBAcGFyYW0gIHtXZWJHTFNoYWRlcn0gICAgICAgICAgIGZyYWcg0KTRgNCw0LPQvNC10L3RgtC90YvQuSDRiNC10LnQtNC10YAgKNGB0L7Qt9C00LDQvdC90YvQuSDRgSDQv9C+0LzQvtGJ0YzRjiBge0BsaW5rIGNyZWF0ZVNoYWRlcn1gKS5cbiAqIEBwYXJhbSAge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgICBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICogQHJldHVybiB7V2ViR0xQcm9ncmFtfVxuICovXG5mdW5jdGlvbiBjcmVhdGVQcm9ncmFtICggdmVydCwgZnJhZywgZ2wgKVxue1xuICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcblxuICBnbC5hdHRhY2hTaGFkZXIoIHByb2dyYW0sIHZlcnQgKTtcbiAgZ2wuYXR0YWNoU2hhZGVyKCBwcm9ncmFtLCBmcmFnICk7XG4gIGdsLmxpbmtQcm9ncmFtKCBwcm9ncmFtICk7XG5cbiAgaWYgKCAhIGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoIHByb2dyYW0sIGdsLkxJTktfU1RBVFVTICkgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdVbmFibGUgdG8gaW5pdGlhbGl6ZSB0aGUgc2hhZGVyIHByb2dyYW06ICcgKyBnbC5nZXRQcm9ncmFtSW5mb0xvZyggcHJvZ3JhbSApICk7XG4gIH1cblxuICBnbC52YWxpZGF0ZVByb2dyYW0oIHByb2dyYW0gKTtcblxuICBpZiAoICEgZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggcHJvZ3JhbSwgZ2wuVkFMSURBVEVfU1RBVFVTICkgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdVbmFibGUgdG8gdmFsaWRhdGUgdGhlIHNoYWRlciBwcm9ncmFtOiAnICsgZ2wuZ2V0UHJvZ3JhbUluZm9Mb2coIHByb2dyYW0gKSApO1xuICB9XG5cbiAgcmV0dXJuIHByb2dyYW07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUHJvZ3JhbTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQuCDQuNC90LjRhtC40LDQu9C40LfQuNGA0YPQtdGCINC90L7QstGL0LkgV2ViR0wg0YjQtdC50LTQtdGALlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY3JlYXRlU2hhZGVyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICAgIHNvdXJjZSDQmNGB0YXQvtC00L3Ri9C5INC60L7QtCDRiNC10LnQtNC10YDQsC5cbiAqIEBwYXJhbSAge2NvbnN0YW50fSAgICAgICAgICAgICAgdHlwZSAgINCi0LjQvyDRiNC10LnQtNC10YDQsDogVkVSVEVYX1NIQURFUiDQuNC70LggRlJBR01FTlRfU0hBREVSLlxuICogQHBhcmFtICB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAgICAgV2ViR0wg0LrQvtC90YLQtdC60YHRgi5cbiAqIEByZXR1cm4ge1dlYkdMU2hhZGVyfVxuICovXG5mdW5jdGlvbiBjcmVhdGVTaGFkZXIgKCBzb3VyY2UsIHR5cGUsIGdsIClcbntcbiAgdmFyIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlciggdHlwZSApO1xuXG4gIGdsLnNoYWRlclNvdXJjZSggc2hhZGVyLCBzb3VyY2UgKTtcbiAgZ2wuY29tcGlsZVNoYWRlciggc2hhZGVyICk7XG5cbiAgaWYgKCAhIGdsLmdldFNoYWRlclBhcmFtZXRlciggc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUyApICkge1xuICAgIHRocm93IFN5bnRheEVycm9yKCAnQW4gZXJyb3Igb2NjdXJyZWQgY29tcGlsaW5nIHRoZSBzaGFkZXJzOiAnICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyggc2hhZGVyICkgKTtcbiAgfVxuXG4gIHJldHVybiBzaGFkZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlU2hhZGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWVtYmVyIHtvYmplY3R9IHBvbHlnb25zXG4gKi9cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG5vb3AgPSByZXF1aXJlKCAncGVha28vbm9vcCcgKTtcblxudmFyIHJlcG9ydCwgcmVwb3J0ZWQ7XG5cbmlmICggdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmIGNvbnNvbGUud2FybiApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gIHJlcG9ydGVkID0ge307XG5cbiAgcmVwb3J0ID0gZnVuY3Rpb24gcmVwb3J0ICggbWVzc2FnZSApXG4gIHtcbiAgICBpZiAoIHJlcG9ydGVkWyBtZXNzYWdlIF0gKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc29sZS53YXJuKCBtZXNzYWdlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIHJlcG9ydGVkWyBtZXNzYWdlIF0gPSB0cnVlO1xuICB9O1xufSBlbHNlIHtcbiAgcmVwb3J0ID0gbm9vcDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXBvcnQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICcuLi9zZXR0aW5ncycgKTtcblxuLyoqXG4gKiDQkNCx0YHRgtGA0LDQutGC0L3Ri9C5INC60LvQsNGB0YEg0LLQtdC60YLQvtGA0LAg0YEg0LHQsNC30L7QstGL0LzQuCDQvNC10YLQvtC00LDQvNC4LlxuICpcbiAqINCn0YLQvtCx0Ysg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMINCz0YDRg9C00YPRgdGLINCy0LzQtdGB0YLQviDRgNCw0LTQuNCw0L3QvtCyINC90LDQtNC+INC90LDQv9C40YHQsNGC0Ywg0YHQu9C10LTRg9GO0YnQtdC1OlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIHNldHRpbmdzID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvc2V0dGluZ3MnICk7XG4gKiBzZXR0aW5ncy5kZWdyZWVzID0gdHJ1ZTtcbiAqIGBgYFxuICogQGFic3RyYWN0XG4gKiBAY29uc3RydWN0b3IgdjYuQWJzdHJhY3RWZWN0b3JcbiAqIEBzZWUgdjYuVmVjdG9yMkRcbiAqIEBzZWUgdjYuVmVjdG9yM0RcbiAqL1xuZnVuY3Rpb24gQWJzdHJhY3RWZWN0b3IgKClcbntcbiAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBhYnN0cmFjdCBjbGFzcyAobmV3IHY2LkFic3RyYWN0VmVjdG9yKScgKTtcbn1cblxuQWJzdHJhY3RWZWN0b3IucHJvdG90eXBlID0ge1xuICAvKipcbiAgICog0J3QvtGA0LzQsNC70LjQt9GD0LXRgiDQstC10LrRgtC+0YAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3Ijbm9ybWFsaXplXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkubm9ybWFsaXplKCk7IC8vIFZlY3RvcjJEIHsgeDogMC44OTQ0MjcxOTA5OTk5MTU5LCB5OiAwLjQ0NzIxMzU5NTQ5OTk1NzkgfVxuICAgKi9cbiAgbm9ybWFsaXplOiBmdW5jdGlvbiBub3JtYWxpemUgKClcbiAge1xuICAgIHZhciBtYWcgPSB0aGlzLm1hZygpO1xuXG4gICAgaWYgKCBtYWcgJiYgbWFnICE9PSAxICkge1xuICAgICAgdGhpcy5kaXYoIG1hZyApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQmNC30LzQtdC90Y/QtdGCINC90LDQv9GA0LDQstC70LXQvdC40LUg0LLQtdC60YLQvtGA0LAg0L3QsCBgXCJhbmdsZVwiYCDRgSDRgdC+0YXRgNCw0L3QtdC90LjQtdC8INC00LvQuNC90YsuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3Ijc2V0QW5nbGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlINCd0L7QstC+0LUg0L3QsNC/0YDQsNCy0LvQtdC90LjQtS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5zZXRBbmdsZSggNDUgKiBNYXRoLlBJIC8gMTgwICk7IC8vIFZlY3RvcjJEIHsgeDogMy4xNjIyNzc2NjAxNjgzNzk1LCB5OiAzLjE2MjI3NzY2MDE2ODM3OSB9XG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPtCY0YHQv9C+0LvRjNC30YPRjyDQs9GA0YPQtNGD0YHRizwvY2FwdGlvbj5cbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkuc2V0QW5nbGUoIDQ1ICk7IC8vIFZlY3RvcjJEIHsgeDogMy4xNjIyNzc2NjAxNjgzNzk1LCB5OiAzLjE2MjI3NzY2MDE2ODM3OSB9XG4gICAqL1xuICBzZXRBbmdsZTogZnVuY3Rpb24gc2V0QW5nbGUgKCBhbmdsZSApXG4gIHtcbiAgICB2YXIgbWFnID0gdGhpcy5tYWcoKTtcblxuICAgIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICAgIGFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gICAgfVxuXG4gICAgdGhpcy54ID0gbWFnICogTWF0aC5jb3MoIGFuZ2xlICk7XG4gICAgdGhpcy55ID0gbWFnICogTWF0aC5zaW4oIGFuZ2xlICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICog0JjQt9C80LXQvdGP0LXRgiDQtNC70LjQvdGDINCy0LXQutGC0L7RgNCwINC90LAgYFwidmFsdWVcImAg0YEg0YHQvtGF0YDQsNC90LXQvdC40LXQvCDQvdCw0L/RgNCw0LLQu9C10L3QuNGPLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI3NldE1hZ1xuICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWUg0J3QvtCy0LDRjyDQtNC70LjQvdCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnNldE1hZyggNDIgKTsgLy8gVmVjdG9yMkQgeyB4OiAzNy41NjU5NDIwMjE5OTY0NiwgeTogMTguNzgyOTcxMDEwOTk4MjMgfVxuICAgKi9cbiAgc2V0TWFnOiBmdW5jdGlvbiBzZXRNYWcgKCB2YWx1ZSApXG4gIHtcbiAgICByZXR1cm4gdGhpcy5ub3JtYWxpemUoKS5tdWwoIHZhbHVlICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCf0L7QstC+0YDQsNGH0LjQstCw0LXRgiDQstC10LrRgtC+0YAg0L3QsCBgXCJhbmdsZVwiYCDRg9Cz0L7QuyDRgSDRgdC+0YXRgNCw0L3QtdC90LjQtdC8INC00LvQuNC90YsuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3Ijcm90YXRlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnJvdGF0ZSggNSAqIE1hdGguUEkgLyAxODAgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjgxMDQ2NzMwNjg3MTY2NiwgeTogMi4zNDEwMTIzNjcxNzQxMjM2IH1cbiAgICogQGV4YW1wbGUgPGNhcHRpb24+0JjRgdC/0L7Qu9GM0LfRg9GPINCz0YDRg9C00YPRgdGLPC9jYXB0aW9uPlxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5yb3RhdGUoIDUgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjgxMDQ2NzMwNjg3MTY2NiwgeTogMi4zNDEwMTIzNjcxNzQxMjM2IH1cbiAgICovXG4gIHJvdGF0ZTogZnVuY3Rpb24gcm90YXRlICggYW5nbGUgKVxuICB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG5cbiAgICB2YXIgYywgcztcblxuICAgIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICAgIGFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gICAgfVxuXG4gICAgYyA9IE1hdGguY29zKCBhbmdsZSApO1xuICAgIHMgPSBNYXRoLnNpbiggYW5nbGUgKTtcblxuICAgIHRoaXMueCA9ICggeCAqIGMgKSAtICggeSAqIHMgKTtcbiAgICB0aGlzLnkgPSAoIHggKiBzICkgKyAoIHkgKiBjICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0YLQtdC60YPRidC10LUg0L3QsNC/0YDQsNCy0LvQtdC90LjQtSDQstC10LrRgtC+0YDQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNnZXRBbmdsZVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9INCd0LDQv9GA0LDQstC70LXQvdC40LUgKNGD0LPQvtC7KSDQsiDQs9GA0LDQtNGD0YHQsNGFINC40LvQuCDRgNCw0LTQuNCw0L3QsNGFLlxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDEsIDEgKS5nZXRBbmdsZSgpOyAvLyAtPiAwLjc4NTM5ODE2MzM5NzQ0ODNcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+0JjRgdC/0L7Qu9GM0LfRg9GPINCz0YDRg9C00YPRgdGLPC9jYXB0aW9uPlxuICAgKiBuZXcgVmVjdG9yMkQoIDEsIDEgKS5nZXRBbmdsZSgpOyAvLyAtPiA0NVxuICAgKi9cbiAgZ2V0QW5nbGU6IGZ1bmN0aW9uIGdldEFuZ2xlICgpXG4gIHtcbiAgICBpZiAoIHNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgICByZXR1cm4gTWF0aC5hdGFuMiggdGhpcy55LCB0aGlzLnggKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE1hdGguYXRhbjIoIHRoaXMueSwgdGhpcy54ICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCe0LPRgNCw0L3QuNGH0LjQstCw0LXRgiDQtNC70LjQvdGDINCy0LXQutGC0L7RgNCwINC00L4gYFwidmFsdWVcImAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjbGltaXRcbiAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCc0LDQutGB0LjQvNCw0LvRjNC90LDRjyDQtNC70LjQvdCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMSwgMSApLmxpbWl0KCAxICk7IC8vIFZlY3RvcjJEIHsgeDogMC43MDcxMDY3ODExODY1NDc1LCB5OiAwLjcwNzEwNjc4MTE4NjU0NzUgfVxuICAgKi9cbiAgbGltaXQ6IGZ1bmN0aW9uIGxpbWl0ICggdmFsdWUgKVxuICB7XG4gICAgdmFyIG1hZyA9IHRoaXMubWFnU3EoKTtcblxuICAgIGlmICggbWFnID4gdmFsdWUgKiB2YWx1ZSApIHtcbiAgICAgIHRoaXMuZGl2KCBNYXRoLnNxcnQoIG1hZyApICkubXVsKCB2YWx1ZSApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQtNC70LjQvdGDINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI21hZ1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9INCU0LvQuNC90LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMiwgMiApLm1hZygpOyAvLyAtPiAyLjgyODQyNzEyNDc0NjE5MDNcbiAgICovXG4gIG1hZzogZnVuY3Rpb24gbWFnICgpXG4gIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCB0aGlzLm1hZ1NxKCkgKTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQu9C40L3RgyDQstC10LrRgtC+0YDQsCDQsiDQutCy0LDQtNGA0LDRgtC1LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI21hZ1NxXG4gICAqIEByZXR1cm4ge251bWJlcn0g0JTQu9C40L3QsCDQstC10LrRgtC+0YDQsCDQsiDQutCy0LDQtNGA0LDRgtC1LlxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDIsIDIgKS5tYWdTcSgpOyAvLyAtPiA4XG4gICAqL1xuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQutC70L7QvSDQstC10LrRgtC+0YDQsC5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNjbG9uZVxuICAgKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn0g0JrQu9C+0L0g0LLQtdC60YLQvtGA0LAuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmNsb25lKCk7XG4gICAqL1xuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLQtdC60YLQvtGA0LAgKHByZXR0aWZpZWQpLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI3RvU3RyaW5nXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LjMyMSwgMi4zNDUgKS50b1N0cmluZygpOyAvLyAtPiBcInY2LlZlY3RvcjJEIHsgeDogNC4zMiwgeTogMi4zNSB9XCJcbiAgICovXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC00LjRgdGC0LDQvdGG0LjRjiDQvNC10LbQtNGDINC00LLRg9C80Y8g0LLQtdC60YLQvtGA0LDQvNC4LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI2Rpc3RcbiAgICogQHBhcmFtICB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQlNGA0YPQs9C+0LkgKNCy0YLQvtGA0L7QuSkg0LLQtdC60YLQvtGALlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMywgMyApLmRpc3QoIG5ldyBWZWN0b3IyRCggMSwgMSApICk7IC8vIC0+IDIuODI4NDI3MTI0NzQ2MTkwM1xuICAgKi9cblxuICBjb25zdHJ1Y3RvcjogQWJzdHJhY3RWZWN0b3Jcbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZVxuICogQHBhcmFtICB7djYuQWJzdHJhY3RWZWN0b3J9IFZlY3RvciB7QGxpbmsgdjYuVmVjdG9yMkR9LCB7QGxpbmsgdjYuVmVjdG9yM0R9LlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgIGFuZ2xlXG4gKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn1cbiAqIEBzZWUgdjYuQWJzdHJhY3RWZWN0b3IuZnJvbUFuZ2xlXG4gKi9cbkFic3RyYWN0VmVjdG9yLl9mcm9tQW5nbGUgPSBmdW5jdGlvbiBfZnJvbUFuZ2xlICggVmVjdG9yLCBhbmdsZSApXG57XG4gIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICBhbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBWZWN0b3IoIE1hdGguY29zKCBhbmdsZSApLCBNYXRoLnNpbiggYW5nbGUgKSApO1xufTtcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDRgNCw0L3QtNC+0LzQvdGL0Lkg0LLQtdC60YLQvtGALlxuICogQHZpcnR1YWxcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IucmFuZG9tXG4gKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn0g0JLQvtC30LLRgNCw0YnQsNC10YIg0L3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3Ri9C5INCy0LXQutGC0L7RgCDRgSDRgNCw0L3QtNC+0LzQvdGL0Lwg0L3QsNC/0YDQsNCy0LvQtdC90LjQtdC8LlxuICovXG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0LLQtdC60YLQvtGAINGBINC90LDQv9GA0LDQstC70LXQvdC40LXQvCDRgNCw0LLQvdGL0LwgYFwiYW5nbGVcImAuXG4gKiBAdmlydHVhbFxuICogQHN0YXRpY1xuICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3Rvci5mcm9tQW5nbGVcbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICBhbmdsZSDQndCw0L/RgNCw0LLQu9C10L3QuNC1INCy0LXQutGC0L7RgNCwLlxuICogQHJldHVybiB7djYuQWJzdHJhY3RWZWN0b3J9ICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC90L7RgNC80LDQu9C40LfQvtCy0LDQvdC90YvQuSDQstC10LrRgtC+0YAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBBYnN0cmFjdFZlY3RvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNldHRpbmdzICAgICAgID0gcmVxdWlyZSggJy4uL3NldHRpbmdzJyApO1xudmFyIEFic3RyYWN0VmVjdG9yID0gcmVxdWlyZSggJy4vQWJzdHJhY3RWZWN0b3InICk7XG5cbi8qKlxuICogMkQg0LLQtdC60YLQvtGALlxuICogQGNvbnN0cnVjdG9yIHY2LlZlY3RvcjJEXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdFZlY3RvclxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0gWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgVmVjdG9yMkQgPSByZXF1aXJlKCAndjYuanMvbWF0aC9WZWN0b3IyRCcgKTtcbiAqIHZhciBwb3NpdGlvbiA9IG5ldyBWZWN0b3IyRCggNCwgMiApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5mdW5jdGlvbiBWZWN0b3IyRCAoIHgsIHkgKVxue1xuICAvKipcbiAgICogWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IyRCN4XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB4ID0gbmV3IFZlY3RvcjJEKCA0LCAyICkueDsgLy8gLT4gNFxuICAgKi9cblxuICAvKipcbiAgICogWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IyRCN5XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB5ID0gbmV3IFZlY3RvcjJEKCA0LCAyICkueTsgLy8gLT4gMlxuICAgKi9cblxuICB0aGlzLnNldCggeCwgeSApO1xufVxuXG5WZWN0b3IyRC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdFZlY3Rvci5wcm90b3R5cGUgKTtcblZlY3RvcjJELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFZlY3RvcjJEO1xuXG4vKipcbiAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjc2V0XG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0J3QvtCy0LDRjyBYINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCd0L7QstCw0Y8gWSDQutC+0L7RgNC00LjQvdCw0YLQsC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5zZXQoIDQsIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiA0LCB5OiAyIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAoIHgsIHkgKVxue1xuICB0aGlzLnggPSB4IHx8IDA7XG4gIHRoaXMueSA9IHkgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQuiDQutC+0L7RgNC00LjQvdCw0YLQsNC8IFgg0LggWSDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LUg0L/QsNGA0LDQvNC10YLRgNGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNhZGRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuYWRkKCA0LCAyICk7IC8vIFZlY3RvcjJEIHsgeDogNCwgeTogMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQgKCB4LCB5IClcbntcbiAgdGhpcy54ICs9IHggfHwgMDtcbiAgdGhpcy55ICs9IHkgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCS0YvRh9C40YLQsNC10YIg0LjQtyDQutC+0L7RgNC00LjQvdCw0YIgWCDQuCBZINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI3N1YlxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LLRi9GH0YLQtdC90L4uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuc3ViKCA0LCAyICk7IC8vIFZlY3RvcjJEIHsgeDogLTQsIHk6IC0yIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uIHN1YiAoIHgsIHkgKVxue1xuICB0aGlzLnggLT0geCB8fCAwO1xuICB0aGlzLnkgLT0geSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0KPQvNC90L7QttCw0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNtdWxcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGD0LzQvdC+0LbQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkubXVsKCAyICk7IC8vIFZlY3RvcjJEIHsgeDogOCwgeTogNCB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5tdWwgPSBmdW5jdGlvbiBtdWwgKCB2YWx1ZSApXG57XG4gIHRoaXMueCAqPSB2YWx1ZTtcbiAgdGhpcy55ICo9IHZhbHVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNkaXZcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGA0LDQt9C00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5kaXYoIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiAyLCB5OiAxIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmRpdiA9IGZ1bmN0aW9uIGRpdiAoIHZhbHVlIClcbntcbiAgdGhpcy54IC89IHZhbHVlO1xuICB0aGlzLnkgLz0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2RvdFxuICogQHBhcmFtICB7bnVtYmVyfSBbeD0wXVxuICogQHBhcmFtICB7bnVtYmVyfSBbeT0wXVxuICogQHJldHVybiB7bnVtYmVyfVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmRpdiggMiwgMyApOyAvLyAxNCwg0L/QvtGC0L7QvNGDINGH0YLQvjogXCIoNCAqIDIpICsgKDIgKiAzKSA9IDggKyA2ID0gMTRcIlxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gZG90ICggeCwgeSApXG57XG4gIHJldHVybiAoIHRoaXMueCAqICggeCB8fCAwICkgKSArXG4gICAgICAgICAoIHRoaXMueSAqICggeSB8fCAwICkgKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLINC80LXQttC00YMg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC80Lgg0L/QsNGA0LDQvNC10YLRgNCw0LzQuC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbGVycFxuICogQHBhcmFtIHtudW1iZXJ9IHhcbiAqIEBwYXJhbSB7bnVtYmVyfSB5XG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5sZXJwKCA4LCA0LCAwLjUgKTsgLy8gVmVjdG9yMkQgeyB4OiA2LCB5OiAzIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoIHgsIHksIHZhbHVlIClcbntcbiAgdGhpcy54ICs9ICggeCAtIHRoaXMueCApICogdmFsdWUgfHwgMDtcbiAgdGhpcy55ICs9ICggeSAtIHRoaXMueSApICogdmFsdWUgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCa0L7Qv9C40YDRg9C10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjc2V0VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDRgdC60L7Qv9C40YDQvtCy0LDRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLnNldFZlY3RvciggbmV3IFZlY3RvcjJEKCA0LCAyICkgKTsgLy8gVmVjdG9yMkQgeyB4OiA0LCB5OiAyIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnNldFZlY3RvciA9IGZ1bmN0aW9uIHNldFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLnNldCggdmVjdG9yLngsIHZlY3Rvci55ICk7XG59O1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNhZGRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00L7QsdCw0LLQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuYWRkVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDQsIDIgKSApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuYWRkVmVjdG9yID0gZnVuY3Rpb24gYWRkVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuYWRkKCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0JLRi9GH0LjRgtCw0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNzdWJWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INCy0YvRh9C10YHRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLnN1YlZlY3RvciggbmV3IFZlY3RvcjJEKCA0LCAyICkgKTsgLy8gVmVjdG9yMkQgeyB4OiAtNCwgeTogLTIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc3ViVmVjdG9yID0gZnVuY3Rpb24gc3ViVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc3ViKCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0KPQvNC90L7QttCw0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBYINC4IFkg0LTRgNGD0LPQvtCz0L4g0LLQtdC60YLQvtGA0LAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI211bFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCDQtNC70Y8g0YPQvNC90L7QttC10L3QuNGPLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLm11bFZlY3RvciggbmV3IFZlY3RvcjJEKCAyLCAzICkgKTsgLy8gVmVjdG9yMkQgeyB4OiA4LCB5OiA2IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLm11bFZlY3RvciA9IGZ1bmN0aW9uIG11bFZlY3RvciAoIHZlY3RvciApXG57XG4gIHRoaXMueCAqPSB2ZWN0b3IueDtcbiAgdGhpcy55ICo9IHZlY3Rvci55O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBYINC4IFkg0LTRgNGD0LPQvtCz0L4g0LLQtdC60YLQvtGA0LAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2RpdlZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0L3QsCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQtNC10LvQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkuZGl2VmVjdG9yKCBuZXcgVmVjdG9yMkQoIDIsIDAuNSApICk7IC8vIFZlY3RvcjJEIHsgeDogMiwgeTogNCB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kaXZWZWN0b3IgPSBmdW5jdGlvbiBkaXZWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICB0aGlzLnggLz0gdmVjdG9yLng7XG4gIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjZG90VmVjdG9yXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkuZG90VmVjdG9yKCBuZXcgVmVjdG9yMkQoIDMsIDUgKSApOyAvLyAtPiAyMlxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuZG90VmVjdG9yID0gZnVuY3Rpb24gZG90VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuZG90KCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLINC80LXQttC00YMg0LTRgNGD0LPQuNC8INCy0LXQutGC0L7RgNC+0LwuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2xlcnBWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvclxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgdmFsdWVcbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5sZXJwVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDIsIDEgKSwgMC41ICk7IC8vIFZlY3RvcjJEIHsgeDogMywgeTogMS41IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmxlcnBWZWN0b3IgPSBmdW5jdGlvbiBsZXJwVmVjdG9yICggdmVjdG9yLCB2YWx1ZSApXG57XG4gIHJldHVybiB0aGlzLmxlcnAoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmFsdWUgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI21hZ1NxXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5tYWdTcSA9IGZ1bmN0aW9uIG1hZ1NxICgpXG57XG4gIHJldHVybiAoIHRoaXMueCAqIHRoaXMueCApICsgKCB0aGlzLnkgKiB0aGlzLnkgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2Nsb25lXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lICgpXG57XG4gIHJldHVybiBuZXcgVmVjdG9yMkQoIHRoaXMueCwgdGhpcy55ICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNkaXN0XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kaXN0ID0gZnVuY3Rpb24gZGlzdCAoIHZlY3RvciApXG57XG4gIHZhciB4ID0gdmVjdG9yLnggLSB0aGlzLng7XG4gIHZhciB5ID0gdmVjdG9yLnkgLSB0aGlzLnk7XG4gIHJldHVybiBNYXRoLnNxcnQoICggeCAqIHggKSArICggeSAqIHkgKSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjdG9TdHJpbmdcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKClcbntcbiAgcmV0dXJuICd2Ni5WZWN0b3IyRCB7IHg6ICcgKyB0aGlzLngudG9GaXhlZCggMiApICsgJywgeTogJyArIHRoaXMueS50b0ZpeGVkKCAyICkgKyAnIH0nO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJELnJhbmRvbVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5yYW5kb21cbiAqL1xuVmVjdG9yMkQucmFuZG9tID0gZnVuY3Rpb24gcmFuZG9tICgpXG57XG4gIHZhciB2YWx1ZTtcblxuICBpZiAoIHNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgdmFsdWUgPSAzNjA7XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBNYXRoLlBJICogMjtcbiAgfVxuXG4gIHJldHVybiBWZWN0b3IyRC5mcm9tQW5nbGUoIE1hdGgucmFuZG9tKCkgKiB2YWx1ZSApO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJELmZyb21BbmdsZVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5mcm9tQW5nbGVcbiAqL1xuVmVjdG9yMkQuZnJvbUFuZ2xlID0gZnVuY3Rpb24gZnJvbUFuZ2xlICggYW5nbGUgKVxue1xuICByZXR1cm4gQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZSggVmVjdG9yMkQsIGFuZ2xlICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjJEO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWJzdHJhY3RWZWN0b3IgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFZlY3RvcicgKTtcblxuLyoqXG4gKiAzRCDQstC10LrRgtC+0YAuXG4gKiBAY29uc3RydWN0b3IgdjYuVmVjdG9yM0RcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0VmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0gWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSBZINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt6PTBdIFog0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gKiBAZXhhbXBsZVxuICogdmFyIFZlY3RvcjNEID0gcmVxdWlyZSggJ3Y2LmpzL21hdGgvVmVjdG9yM0QnICk7XG4gKiB2YXIgcG9zaXRpb24gPSBuZXcgVmVjdG9yM0QoIDQsIDIsIDMgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiAzIH1cbiAqL1xuZnVuY3Rpb24gVmVjdG9yM0QgKCB4LCB5LCB6IClcbntcbiAgLyoqXG4gICAqIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuVmVjdG9yM0QjeFxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgeCA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApLng7IC8vIC0+IDRcbiAgICovXG5cbiAgLyoqXG4gICAqIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuVmVjdG9yM0QjeVxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgeSA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApLnk7IC8vIC0+IDJcbiAgICovXG5cbiAgLyoqXG4gICAqIFog0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuVmVjdG9yM0QjelxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgeiA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApLno7IC8vIC0+IDNcbiAgICovXG5cbiAgdGhpcy5zZXQoIHgsIHksIHogKTtcbn1cblxuVmVjdG9yM0QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RWZWN0b3IucHJvdG90eXBlICk7XG5WZWN0b3IzRC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBWZWN0b3IzRDtcblxuLyoqXG4gKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNzZXRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQndC+0LLQsNGPIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0J3QvtCy0LDRjyBZINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt6PTBdINCd0L7QstCw0Y8gWiDQutC+0L7RgNC00LjQvdCw0YLQsC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5zZXQoIDQsIDIsIDYgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAoIHgsIHksIHogKVxue1xuICB0aGlzLnggPSB4IHx8IDA7XG4gIHRoaXMueSA9IHkgfHwgMDtcbiAgdGhpcy56ID0geiB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC6INC60L7QvtGA0LTQuNC90LDRgtCw0LwgWCwgWSwg0LggWiDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LUg0L/QsNGA0LDQvNC10YLRgNGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNhZGRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3Qvi5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5hZGQoIDQsIDIsIDYgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZCAoIHgsIHksIHogKVxue1xuICB0aGlzLnggKz0geCB8fCAwO1xuICB0aGlzLnkgKz0geSB8fCAwO1xuICB0aGlzLnogKz0geiB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JLRi9GH0LjRgtCw0LXRgiDQuNC3INC60L7QvtGA0LTQuNC90LDRgiBYLCBZLCDQuCBaINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3N1YlxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LLRi9GH0YLQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINCy0YvRh9GC0LXQvdC+LlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLnN1YiggNCwgMiwgNiApOyAvLyBWZWN0b3IzRCB7IHg6IC00LCB5OiAtMiwgejogLTYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24gc3ViICggeCwgeSwgeiApXG57XG4gIHRoaXMueCAtPSB4IHx8IDA7XG4gIHRoaXMueSAtPSB5IHx8IDA7XG4gIHRoaXMueiAtPSB6IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQo9C80L3QvtC20LDQtdGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNtdWxcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGD0LzQvdC+0LbQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubXVsKCAyICk7IC8vIFZlY3RvcjNEIHsgeDogOCwgeTogNCwgejogMTIgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUubXVsID0gZnVuY3Rpb24gbXVsICggdmFsdWUgKVxue1xuICB0aGlzLnggKj0gdmFsdWU7XG4gIHRoaXMueSAqPSB2YWx1ZTtcbiAgdGhpcy56ICo9IHZhbHVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgYHZhbHVlYC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZGl2XG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUg0KfQuNGB0LvQviwg0L3QsCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDRgNCw0LfQtNC10LvQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkuZGl2KCAyICk7IC8vIFZlY3RvcjNEIHsgeDogMiwgeTogMSwgejogMyB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kaXYgPSBmdW5jdGlvbiBkaXYgKCB2YWx1ZSApXG57XG4gIHRoaXMueCAvPSB2YWx1ZTtcbiAgdGhpcy55IC89IHZhbHVlO1xuICB0aGlzLnogLz0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2RvdFxuICogQHBhcmFtICB7bnVtYmVyfSBbeD0wXVxuICogQHBhcmFtICB7bnVtYmVyfSBbeT0wXVxuICogQHBhcmFtICB7bnVtYmVyfSBbej0wXVxuICogQHJldHVybiB7bnVtYmVyfVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmRvdCggMiwgMywgNCApOyAvLyAtPiAzOCwg0L/QvtGC0L7QvNGDINGH0YLQvjogXCIoNCAqIDIpICsgKDIgKiAzKSArICg2ICogNCkgPSA4ICsgNiArIDI0ID0gMzhcIlxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gZG90ICggeCwgeSwgeiApXG57XG4gIHJldHVybiAoIHRoaXMueCAqICggeCB8fCAwICkgKSArXG4gICAgICAgICAoIHRoaXMueSAqICggeSB8fCAwICkgKSArXG4gICAgICAgICAoIHRoaXMueiAqICggeiB8fCAwICkgKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvNC10LbQtNGDINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQvNC4INC/0LDRgNCw0LzQtdGC0YDQsNC80LguXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2xlcnBcbiAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gKiBAcGFyYW0ge251bWJlcn0geVxuICogQHBhcmFtIHtudW1iZXJ9IHpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmxlcnAoIDgsIDQsIDEyLCAwLjUgKTsgLy8gVmVjdG9yM0QgeyB4OiA2LCB5OiAzLCB6OiA5IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoIHgsIHksIHosIHZhbHVlIClcbntcbiAgdGhpcy54ICs9ICggeCAtIHRoaXMueCApICogdmFsdWUgfHwgMDtcbiAgdGhpcy55ICs9ICggeSAtIHRoaXMueSApICogdmFsdWUgfHwgMDtcbiAgdGhpcy56ICs9ICggeiAtIHRoaXMueiApICogdmFsdWUgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCa0L7Qv9C40YDRg9C10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0Qjc2V0VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDRgdC60L7Qv9C40YDQvtCy0LDRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLnNldFZlY3RvciggbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLnNldFZlY3RvciA9IGZ1bmN0aW9uIHNldFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLnNldCggdmVjdG9yLngsIHZlY3Rvci55LCB2ZWN0b3IueiApO1xufTtcblxuLyoqXG4gKiDQlNC+0LHQsNCy0LvRj9C10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjYWRkVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQtNC+0LHQsNCy0LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLmFkZFZlY3RvciggbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmFkZFZlY3RvciA9IGZ1bmN0aW9uIGFkZFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLmFkZCggdmVjdG9yLngsIHZlY3Rvci55LCB2ZWN0b3IueiApO1xufTtcblxuLyoqXG4gKiDQktGL0YfQuNGC0LDQtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3N1YlZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LLRi9GH0LXRgdGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuc3ViVmVjdG9yKCBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKSApOyAvLyBWZWN0b3IzRCB7IHg6IC00LCB5OiAtMiwgejogLTYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc3ViVmVjdG9yID0gZnVuY3Rpb24gc3ViVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc3ViKCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCj0LzQvdC+0LbQsNC10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIFgsIFksINC4IFog0LTRgNGD0LPQvtCz0L4g0LLQtdC60YLQvtGA0LAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI211bFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCDQtNC70Y8g0YPQvNC90L7QttC10L3QuNGPLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLm11bFZlY3RvciggbmV3IFZlY3RvcjNEKCAyLCAzLCA0ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiA4LCB5OiA2LCB6OiAyNCB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5tdWxWZWN0b3IgPSBmdW5jdGlvbiBtdWxWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICB0aGlzLnggKj0gdmVjdG9yLng7XG4gIHRoaXMueSAqPSB2ZWN0b3IueTtcbiAgdGhpcy56ICo9IHZlY3Rvci56O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgWCwgWSwg0LggWiDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZGl2VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQvdCwINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5kaXZWZWN0b3IoIG5ldyBWZWN0b3IzRCggMiwgMC41LCA0ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiAyLCB5OiA0LCB6OiAxLjUgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZGl2VmVjdG9yID0gZnVuY3Rpb24gZGl2VmVjdG9yICggdmVjdG9yIClcbntcbiAgdGhpcy54IC89IHZlY3Rvci54O1xuICB0aGlzLnkgLz0gdmVjdG9yLnk7XG4gIHRoaXMueiAvPSB2ZWN0b3IuejtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZG90VmVjdG9yXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkuZG90VmVjdG9yKCBuZXcgVmVjdG9yM0QoIDIsIDMsIC0yICkgKTsgLy8gLT4gMlxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZG90VmVjdG9yID0gZnVuY3Rpb24gZG90VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuZG90KCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCY0L3RgtC10YDQv9C+0LvQuNGA0YPQtdGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0LzQtdC20LTRgyDQtNGA0YPQs9C40Lwg0LLQtdC60YLQvtGA0L7QvC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbGVycFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmxlcnBWZWN0b3IoIG5ldyBWZWN0b3IzRCggOCwgNCwgMTIgKSwgMC41ICk7IC8vIFZlY3RvcjNEIHsgeDogNiwgeTogMywgejogOSB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5sZXJwVmVjdG9yID0gZnVuY3Rpb24gbGVycFZlY3RvciAoIHZlY3RvciwgdmFsdWUgKVxue1xuICByZXR1cm4gdGhpcy5sZXJwKCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56LCB2YWx1ZSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbWFnU3FcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLm1hZ1NxID0gZnVuY3Rpb24gbWFnU3EgKClcbntcbiAgcmV0dXJuICggdGhpcy54ICogdGhpcy54ICkgKyAoIHRoaXMueSAqIHRoaXMueSApICsgKCB0aGlzLnogKiB0aGlzLnogKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2Nsb25lXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lICgpXG57XG4gIHJldHVybiBuZXcgVmVjdG9yM0QoIHRoaXMueCwgdGhpcy55LCB0aGlzLnogKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2Rpc3RcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmRpc3QgPSBmdW5jdGlvbiBkaXN0ICggdmVjdG9yIClcbntcbiAgdmFyIHggPSB2ZWN0b3IueCAtIHRoaXMueDtcbiAgdmFyIHkgPSB2ZWN0b3IueSAtIHRoaXMueTtcbiAgdmFyIHogPSB2ZWN0b3IueiAtIHRoaXMuejtcbiAgcmV0dXJuIE1hdGguc3FydCggKCB4ICogeCApICsgKCB5ICogeSApICsgKCB6ICogeiApICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCN0b1N0cmluZ1xuICovXG5WZWN0b3IzRC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKVxue1xuICByZXR1cm4gJ3Y2LlZlY3RvcjNEIHsgeDogJyArIHRoaXMueC50b0ZpeGVkKCAyICkgKyAnLCB5OiAnICsgdGhpcy55LnRvRml4ZWQoIDIgKSArICcsIHo6ICcgKyB0aGlzLnoudG9GaXhlZCggMiApICsgJyB9Jztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRC5yYW5kb21cbiAqIEBzZWUgdjYuQWJzdHJhY3RWZWN0b3IucmFuZG9tXG4gKi9cblZlY3RvcjNELnJhbmRvbSA9IGZ1bmN0aW9uIHJhbmRvbSAoKVxue1xuICAvLyBVc2UgdGhlIGVxdWFsLWFyZWEgcHJvamVjdGlvbiBhbGdvcml0aG0uXG4gIHZhciB0aGV0YSA9IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJICogMjtcbiAgdmFyIHogICAgID0gKCBNYXRoLnJhbmRvbSgpICogMiApIC0gMTtcbiAgdmFyIG4gICAgID0gTWF0aC5zcXJ0KCAxIC0gKCB6ICogeiApICk7XG4gIHJldHVybiBuZXcgVmVjdG9yM0QoIG4gKiBNYXRoLmNvcyggdGhldGEgKSwgbiAqIE1hdGguc2luKCB0aGV0YSApLCB6ICk7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QuZnJvbUFuZ2xlXG4gKiBAc2VlIHY2LkFic3RyYWN0VmVjdG9yLmZyb21BbmdsZVxuICovXG5WZWN0b3IzRC5mcm9tQW5nbGUgPSBmdW5jdGlvbiBmcm9tQW5nbGUgKCBhbmdsZSApXG57XG4gIHJldHVybiBBYnN0cmFjdFZlY3Rvci5fZnJvbUFuZ2xlKCBWZWN0b3IzRCwgYW5nbGUgKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yM0Q7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0K3RgtC+INC/0YDQvtGB0YLRgNCw0L3RgdGC0LLQviDQuNC80LXQvSAo0Y3RgtC+0YIgbmFtZXBzcGFjZSkg0YDQtdCw0LvQuNC30YPQtdGCINGA0LDQsdC+0YLRgyDRgSAyRCDQvNCw0YLRgNC40YbQsNC80LggM3gzLlxuICogQG5hbWVzcGFjZSB2Ni5tYXQzXG4gKiBAZXhhbXBsZVxuICogdmFyIG1hdDMgPSByZXF1aXJlKCAndjYuanMvY29yZS9tYXRoL21hdDMnICk7XG4gKi9cblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDRgdGC0LDQvdC00LDRgNGC0L3Rg9GOIChpZGVudGl0eSkgM3gzINC80LDRgtGA0LjRhtGDLlxuICogQG1ldGhvZCB2Ni5tYXQzLmlkZW50aXR5XG4gKiBAcmV0dXJuIHtBcnJheS48bnVtYmVyPn0g0J3QvtCy0LDRjyDQvNCw0YLRgNC40YbQsC5cbiAqIEBleGFtcGxlXG4gKiAvLyBSZXR1cm5zIHRoZSBpZGVudGl0eS5cbiAqIHZhciBtYXRyaXggPSBtYXQzLmlkZW50aXR5KCk7XG4gKi9cbmV4cG9ydHMuaWRlbnRpdHkgPSBmdW5jdGlvbiBpZGVudGl0eSAoKVxue1xuICByZXR1cm4gW1xuICAgIDEsIDAsIDAsXG4gICAgMCwgMSwgMCxcbiAgICAwLCAwLCAxXG4gIF07XG59O1xuXG4vKipcbiAqINCh0LHRgNCw0YHRi9Cy0LDQtdGCINC80LDRgtGA0LjRhtGDIGBcIm0xXCJgINC00L4g0YHRgtCw0L3QtNCw0YDRgtC90YvRhSAoaWRlbnRpdHkpINC30L3QsNGH0LXQvdC40LkuXG4gKiBAbWV0aG9kIHY2Lm1hdDMuc2V0SWRlbnRpdHlcbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSDQnNCw0YLRgNC40YbQsC5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiAvLyBTZXRzIHRoZSBpZGVudGl0eS5cbiAqIG1hdDMuc2V0SWRlbnRpdHkoIG1hdHJpeCApO1xuICovXG5leHBvcnRzLnNldElkZW50aXR5ID0gZnVuY3Rpb24gc2V0SWRlbnRpdHkgKCBtMSApXG57XG4gIG0xWyAwIF0gPSAxO1xuICBtMVsgMSBdID0gMDtcbiAgbTFbIDIgXSA9IDA7XG4gIG0xWyAzIF0gPSAwO1xuICBtMVsgNCBdID0gMTtcbiAgbTFbIDUgXSA9IDA7XG4gIG0xWyA2IF0gPSAwO1xuICBtMVsgNyBdID0gMDtcbiAgbTFbIDggXSA9IDE7XG59O1xuXG4vKipcbiAqINCa0L7Qv9C40YDRg9C10YIg0LfQvdCw0YfQtdC90LjRjyDQvNCw0YLRgNC40YbRiyBgXCJtMlwiYCDQvdCwINC80LDRgtGA0LjRhtGDIGBcIm0xXCJgLlxuICogQG1ldGhvZCB2Ni5tYXQzLmNvcHlcbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSDQnNCw0YLRgNC40YbQsCwg0LIg0LrQvtGC0L7RgNGD0Y4g0L3QsNC00L4g0LrQvtC/0LjRgNC+0LLQsNGC0YwuXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTIg0JzQsNGC0YDQuNGG0LAsINC60L7RgtC+0YDRg9GOINC90LDQtNC+INGB0LrQvtC/0LjRgNC+0LLQsNGC0YwuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gQ29waWVzIGEgbWF0cml4LlxuICogbWF0My5jb3B5KCBkZXN0aW5hdGlvbk1hdHJpeCwgc291cmNlTWF0cml4ICk7XG4gKi9cbmV4cG9ydHMuY29weSA9IGZ1bmN0aW9uIGNvcHkgKCBtMSwgbTIgKVxue1xuICBtMVsgMCBdID0gbTJbIDAgXTtcbiAgbTFbIDEgXSA9IG0yWyAxIF07XG4gIG0xWyAyIF0gPSBtMlsgMiBdO1xuICBtMVsgMyBdID0gbTJbIDMgXTtcbiAgbTFbIDQgXSA9IG0yWyA0IF07XG4gIG0xWyA1IF0gPSBtMlsgNSBdO1xuICBtMVsgNiBdID0gbTJbIDYgXTtcbiAgbTFbIDcgXSA9IG0yWyA3IF07XG4gIG0xWyA4IF0gPSBtMlsgOCBdO1xufTtcblxuLyoqXG4gKiDQktC+0LfQstGA0LDRidCw0LXRgiDQutC70L7QvSDQvNCw0YLRgNC40YbRiyBgXCJtMVwiYC5cbiAqIEBtZXRob2QgdjYubWF0My5jbG9uZVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xINCY0YHRhdC+0LTQvdCw0Y8g0LzQsNGC0YDQuNGG0LAuXG4gKiBAcmV0dXJuIHtBcnJheS48bnVtYmVyPn0gICAg0JrQu9C+0L0g0LzQsNGC0YDQuNGG0YsuXG4gKiBAZXhhbXBsZVxuICogLy8gQ3JlYXRlcyBhIGNsb25lLlxuICogdmFyIGNsb25lID0gbWF0My5jbG9uZSggbWF0cml4ICk7XG4gKi9cbmV4cG9ydHMuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSAoIG0xIClcbntcbiAgcmV0dXJuIFtcbiAgICBtMVsgMCBdLFxuICAgIG0xWyAxIF0sXG4gICAgbTFbIDIgXSxcbiAgICBtMVsgMyBdLFxuICAgIG0xWyA0IF0sXG4gICAgbTFbIDUgXSxcbiAgICBtMVsgNiBdLFxuICAgIG0xWyA3IF0sXG4gICAgbTFbIDggXVxuICBdO1xufTtcblxuLyoqXG4gKiDQn9C10YDQtdC80LXRidCw0LXRgiDQvNCw0YLRgNC40YbRgyBgXCJtMVwiYC5cbiAqIEBtZXRob2QgdjYubWF0My50cmFuc2xhdGVcbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSDQnNCw0YLRgNC40YbQsC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICB4ICBYINC/0LXRgNC10LzQtdGJ0LXQvdC40Y8uXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgeSAgWSDQv9C10YDQtdC80LXRidC10L3QuNGPLlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIFRyYW5zbGF0ZXMgYnkgWyA0LCAyIF0uXG4gKiBtYXQzLnRyYW5zbGF0ZSggbWF0cml4LCA0LCAyICk7XG4gKi9cbmV4cG9ydHMudHJhbnNsYXRlID0gZnVuY3Rpb24gdHJhbnNsYXRlICggbTEsIHgsIHkgKVxue1xuICBtMVsgNiBdID0gKCB4ICogbTFbIDAgXSApICsgKCB5ICogbTFbIDMgXSApICsgbTFbIDYgXTtcbiAgbTFbIDcgXSA9ICggeCAqIG0xWyAxIF0gKSArICggeSAqIG0xWyA0IF0gKSArIG0xWyA3IF07XG4gIG0xWyA4IF0gPSAoIHggKiBtMVsgMiBdICkgKyAoIHkgKiBtMVsgNSBdICkgKyBtMVsgOCBdO1xufTtcblxuLyoqXG4gKiDQn9C+0LLQvtGA0LDRh9C40LLQsNC10YIg0LzQsNGC0YDQuNGG0YMgYFwibTFcImAg0L3QsCBgXCJhbmdsZVwiYCDRgNCw0LTQuNCw0L3QvtCyLlxuICogQG1ldGhvZCB2Ni5tYXQzLnJvdGF0ZVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xICAgINCc0LDRgtGA0LjRhtCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIGFuZ2xlINCj0LPQvtC7LlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIFJvdGF0ZXMgYnkgNDUgZGVncmVlcy5cbiAqIG1hdDMucm90YXRlKCBtYXRyaXgsIDQ1ICogTWF0aC5QSSAvIDE4MCApO1xuICovXG5leHBvcnRzLnJvdGF0ZSA9IGZ1bmN0aW9uIHJvdGF0ZSAoIG0xLCBhbmdsZSApXG57XG4gIHZhciBtMTAgPSBtMVsgMCBdO1xuICB2YXIgbTExID0gbTFbIDEgXTtcbiAgdmFyIG0xMiA9IG0xWyAyIF07XG4gIHZhciBtMTMgPSBtMVsgMyBdO1xuICB2YXIgbTE0ID0gbTFbIDQgXTtcbiAgdmFyIG0xNSA9IG0xWyA1IF07XG4gIHZhciB4ID0gTWF0aC5jb3MoIGFuZ2xlICk7XG4gIHZhciB5ID0gTWF0aC5zaW4oIGFuZ2xlICk7XG4gIG0xWyAwIF0gPSAoIHggKiBtMTAgKSArICggeSAqIG0xMyApO1xuICBtMVsgMSBdID0gKCB4ICogbTExICkgKyAoIHkgKiBtMTQgKTtcbiAgbTFbIDIgXSA9ICggeCAqIG0xMiApICsgKCB5ICogbTE1ICk7XG4gIG0xWyAzIF0gPSAoIHggKiBtMTMgKSAtICggeSAqIG0xMCApO1xuICBtMVsgNCBdID0gKCB4ICogbTE0ICkgLSAoIHkgKiBtMTEgKTtcbiAgbTFbIDUgXSA9ICggeCAqIG0xNSApIC0gKCB5ICogbTEyICk7XG59O1xuXG4vKipcbiAqINCc0LDRgdGI0YLQsNCx0LjRgNGD0LXRgiDQvNCw0YLRgNC40YbRgy5cbiAqIEBtZXRob2QgdjYubWF0My5zY2FsZVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xINCc0LDRgtGA0LjRhtCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIHggIFgt0YTQsNC60YLQvtGALlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIHkgIFkt0YTQsNC60YLQvtGALlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIFNjYWxlcyBpbiBbIDIsIDIgXSB0aW1lcy5cbiAqIG1hdDMuc2NhbGUoIG1hdHJpeCwgMiwgMiApO1xuICovXG5leHBvcnRzLnNjYWxlID0gZnVuY3Rpb24gc2NhbGUgKCBtMSwgeCwgeSApXG57XG4gIG0xWyAwIF0gKj0geDtcbiAgbTFbIDEgXSAqPSB4O1xuICBtMVsgMiBdICo9IHg7XG4gIG0xWyAzIF0gKj0geTtcbiAgbTFbIDQgXSAqPSB5O1xuICBtMVsgNSBdICo9IHk7XG59O1xuXG4vKipcbiAqINCf0YDQuNC80LXQvdGP0LXRgiDQvNCw0YLRgNC40YbRgyDQuNC3INGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7QsiDQvdCwINC80LDRgtGA0LjRhtGDIGBcIm0xXCJgLlxuICogQG1ldGhvZCB2Ni5tYXQzLnRyYW5zZm9ybVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xICDQnNCw0YLRgNC40YbQsC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMTEgWCDQvNCw0YHRiNGC0LDQsSAoc2NhbGUpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0xMiBYINC90LDQutC70L7QvSAoc2tldykuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTIxIFkg0L3QsNC60LvQvtC9IChza2V3KS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMjIgWSDQvNCw0YHRiNGC0LDQsSAoc2NhbGUpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIGR4ICBYINC/0LXRgNC10LzQtdGJ0LXQvdC40Y8gKHRyYW5zbGF0ZSkuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgZHkgIFkg0L/QtdGA0LXQvNC10YnQtdC90LjRjyAodHJhbnNsYXRlKS5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gQXBwbGllcyBhIGRvdWJsZS1zY2FsZWQgbWF0cml4LlxuICogbWF0My50cmFuc2Zvcm0oIG1hdHJpeCwgMiwgMCwgMCwgMiwgMCwgMCApO1xuICovXG5leHBvcnRzLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIHRyYW5zZm9ybSAoIG0xLCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG57XG4gIG0xWyAwIF0gKj0gbTExO1xuICBtMVsgMSBdICo9IG0yMTtcbiAgbTFbIDIgXSAqPSBkeDtcbiAgbTFbIDMgXSAqPSBtMTI7XG4gIG0xWyA0IF0gKj0gbTIyO1xuICBtMVsgNSBdICo9IGR5O1xuICBtMVsgNiBdID0gMDtcbiAgbTFbIDcgXSA9IDA7XG59O1xuXG4vKipcbiAqINCh0LHRgNCw0YHRi9Cy0LDQtdGCINC80LDRgtGA0LjRhtGDIGBcIm0xXCJgINC00L4g0LzQsNGC0YDQuNGG0Ysg0LjQtyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40YUg0L/QsNGA0LDQvNC10YLRgNC+0LIuXG4gKiBAbWV0aG9kIHY2Lm1hdDMuc2V0VHJhbnNmb3JtXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEgINCc0LDRgtGA0LjRhtCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0xMSBYINC80LDRgdGI0YLQsNCxIChzY2FsZSkuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTEyIFgg0L3QsNC60LvQvtC9IChza2V3KS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMjEgWSDQvdCw0LrQu9C+0L0gKHNrZXcpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0yMiBZINC80LDRgdGI0YLQsNCxIChzY2FsZSkuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgZHggIFgg0L/QtdGA0LXQvNC10YnQtdC90LjRjyAodHJhbnNsYXRlKS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBkeSAgWSDQv9C10YDQtdC80LXRidC10L3QuNGPICh0cmFuc2xhdGUpLlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiAvLyBTZXRzIHRoZSBpZGVudGl0eSBhbmQgdGhlbiBhcHBsaWVzIGEgZG91YmxlLXNjYWxlZCBtYXRyaXguXG4gKiBtYXQzLnNldFRyYW5zZm9ybSggbWF0cml4LCAyLCAwLCAwLCAyLCAwLCAwICk7XG4gKi9cbmV4cG9ydHMuc2V0VHJhbnNmb3JtID0gZnVuY3Rpb24gc2V0VHJhbnNmb3JtICggbTEsIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbntcbiAgLy8gWCBzY2FsZVxuICBtMVsgMCBdID0gbTExO1xuICAvLyBYIHNrZXdcbiAgbTFbIDEgXSA9IG0xMjtcbiAgLy8gWSBza2V3XG4gIG0xWyAzIF0gPSBtMjE7XG4gIC8vIFkgc2NhbGVcbiAgbTFbIDQgXSA9IG0yMjtcbiAgLy8gWCB0cmFuc2xhdGVcbiAgbTFbIDYgXSA9IGR4O1xuICAvLyBZIHRyYW5zbGF0ZVxuICBtMVsgNyBdID0gZHk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGdldEVsZW1lbnRXID0gcmVxdWlyZSggJ3BlYWtvL2dldC1lbGVtZW50LXcnICk7XG52YXIgZ2V0RWxlbWVudEggPSByZXF1aXJlKCAncGVha28vZ2V0LWVsZW1lbnQtaCcgKTtcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApO1xudmFyIGNyZWF0ZVBvbHlnb24gPSByZXF1aXJlKCAnLi4vaW50ZXJuYWwvY3JlYXRlX3BvbHlnb24nICk7XG52YXIgcG9seWdvbnMgPSByZXF1aXJlKCAnLi4vaW50ZXJuYWwvcG9seWdvbnMnICk7XG52YXIgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyA9IHJlcXVpcmUoICcuL2ludGVybmFsL3NldF9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MnICk7XG52YXIgZ2V0V2ViR0wgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9nZXRfd2ViZ2wnICk7XG52YXIgY29weURyYXdpbmdTZXR0aW5ncyA9IHJlcXVpcmUoICcuL2ludGVybmFsL2NvcHlfZHJhd2luZ19zZXR0aW5ncycgKTtcbnZhciBwcm9jZXNzUmVjdEFsaWduWCA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWDtcbnZhciBwcm9jZXNzUmVjdEFsaWduWSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWTtcbnZhciBwcm9jZXNzU2hhcGUgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3NoYXBlJyApO1xudmFyIGNsb3NlU2hhcGUgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9jbG9zZV9zaGFwZScgKTtcbnZhciBvcHRpb25zID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG4vKipcbiAqINCQ0LHRgdGC0YDQsNC60YLQvdGL0Lkg0LrQu9Cw0YHRgSDRgNC10L3QtNC10YDQtdGA0LAuXG4gKiBAYWJzdHJhY3RcbiAqIEBjb25zdHJ1Y3RvciB2Ni5BYnN0cmFjdFJlbmRlcmVyXG4gKiBAc2VlIHY2LlJlbmRlcmVyR0xcbiAqIEBzZWUgdjYuUmVuZGVyZXIyRFxuICogQGV4YW1wbGVcbiAqIHZhciBBYnN0cmFjdFJlbmRlcmVyID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXIvQWJzdHJhY3RSZW5kZXJlcicgKTtcbiAqL1xuZnVuY3Rpb24gQWJzdHJhY3RSZW5kZXJlciAoKVxue1xuICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGFic3RyYWN0IGNsYXNzIChuZXcgdjYuQWJzdHJhY3RSZW5kZXJlciknICk7XG59XG5BYnN0cmFjdFJlbmRlcmVyLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqINCU0L7QsdCw0LLQu9GP0LXRgiBgY2FudmFzYCDRgNC10L3QtNC10YDQtdGA0LAg0LIgRE9NLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYXBwZW5kVG9cbiAgICogQHBhcmFtIHtFbGVtZW50fSBwYXJlbnQg0K3Qu9C10LzQtdC90YIsINCyINC60L7RgtC+0YDRi9C5IGBjYW52YXNgINGA0LXQvdC00LXRgNC10YDQsCDQtNC+0LvQttC10L0g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBBZGQgcmVuZGVyZXIgaW50byBET00uXG4gICAqIHJlbmRlcmVyLmFwcGVuZFRvKCBkb2N1bWVudC5ib2R5ICk7XG4gICAqL1xuICBhcHBlbmRUbzogZnVuY3Rpb24gYXBwZW5kVG8gKCBwYXJlbnQgKVxuICB7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKCB0aGlzLmNhbnZhcyApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KPQtNCw0LvRj9C10YIgYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINC40LcgRE9NLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZGVzdHJveVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlbW92ZSByZW5kZXJlciBmcm9tIERPTS5cbiAgICogcmVuZGVyZXIuZGVzdHJveSgpO1xuICAgKi9cbiAgZGVzdHJveTogZnVuY3Rpb24gZGVzdHJveSAoKVxuICB7XG4gICAgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggdGhpcy5jYW52YXMgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCh0L7RhdGA0LDQvdGP0LXRgiDRgtC10LrRg9GJ0LjQtSDQvdCw0YHRgtGA0L7QudC60Lgg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwdXNoXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2F2ZSBkcmF3aW5nIHNldHRpbmdzIChmaWxsLCBsaW5lV2lkdGguLi4pIChwdXNoIG9udG8gc3RhY2spLlxuICAgKiByZW5kZXJlci5wdXNoKCk7XG4gICAqL1xuICBwdXNoOiBmdW5jdGlvbiBwdXNoICgpXG4gIHtcbiAgICBpZiAoIHRoaXMuX3N0YWNrWyArK3RoaXMuX3N0YWNrSW5kZXggXSApIHtcbiAgICAgIGNvcHlEcmF3aW5nU2V0dGluZ3MoIHRoaXMuX3N0YWNrWyB0aGlzLl9zdGFja0luZGV4IF0sIHRoaXMgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RhY2sucHVzaCggc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncygge30sIHRoaXMgKSApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCS0L7RgdGB0YLQsNC90LDQstC70LjQstCw0LXRgiDQv9GA0LXQtNGL0LTRg9GJ0LjQtSDQvdCw0YHRgtGA0L7QudC60Lgg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwb3BcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXN0b3JlIGRyYXdpbmcgc2V0dGluZ3MgKGZpbGwsIGxpbmVXaWR0aC4uLikgKHRha2UgZnJvbSBzdGFjaykuXG4gICAqIHJlbmRlcmVyLnBvcCgpO1xuICAgKi9cbiAgcG9wOiBmdW5jdGlvbiBwb3AgKClcbiAge1xuICAgIGlmICggdGhpcy5fc3RhY2tJbmRleCA+PSAwICkge1xuICAgICAgY29weURyYXdpbmdTZXR0aW5ncyggdGhpcywgdGhpcy5fc3RhY2tbIHRoaXMuX3N0YWNrSW5kZXgtLSBdICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3MoIHRoaXMsIHRoaXMgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQmNC30LzQtdC90Y/QtdGCINGA0LDQt9C80LXRgCDRgNC10L3QtNC10YDQtdGA0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZXNpemVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHcg0J3QvtCy0LDRjyDRiNC40YDQuNC90LAuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoINCd0L7QstCw0Y8g0LLRi9GB0L7RgtCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlc2l6ZSByZW5kZXJlciB0byA2MDB4NDAwLlxuICAgKiByZW5kZXJlci5yZXNpemUoIDYwMCwgNDAwICk7XG4gICAqL1xuICByZXNpemU6IGZ1bmN0aW9uIHJlc2l6ZSAoIHcsIGggKVxuICB7XG4gICAgdmFyIGNhbnZhcyA9IHRoaXMuY2FudmFzO1xuICAgIHZhciBzY2FsZSA9IHRoaXMuc2V0dGluZ3Muc2NhbGU7XG4gICAgY2FudmFzLnN0eWxlLndpZHRoID0gdyArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGggKyAncHgnO1xuICAgIGNhbnZhcy53aWR0aCA9IHRoaXMudyA9IE1hdGguZmxvb3IoIHcgKiBzY2FsZSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmggPSBNYXRoLmZsb29yKCBoICogc2NhbGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCY0LfQvNC10L3Rj9C10YIg0YDQsNC30LzQtdGAINGA0LXQvdC00LXRgNC10YDQsCDQtNC+INGA0LDQt9C80LXRgNCwIGBlbGVtZW50YCDRjdC70LXQvNC10L3RgtCwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVzaXplVG9cbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50INCt0LvQtdC80LXQvdGCLCDQtNC+INC60L7RgtC+0YDQvtCz0L4g0L3QsNC00L4g0YDQsNGB0YLRj9C90YPRgtGMINGA0LXQvdC00LXRgNC10YAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVzaXplIHJlbmRlcmVyIHRvIG1hdGNoIDxib2R5IC8+IHNpemVzLlxuICAgKiByZW5kZXJlci5yZXNpemVUbyggZG9jdW1lbnQuYm9keSApO1xuICAgKi9cbiAgcmVzaXplVG86IGZ1bmN0aW9uIHJlc2l6ZVRvICggZWxlbWVudCApXG4gIHtcbiAgICByZXR1cm4gdGhpcy5yZXNpemUoIGdldEVsZW1lbnRXKCBlbGVtZW50ICksIGdldEVsZW1lbnRIKCBlbGVtZW50ICkgKTtcbiAgfSxcbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQv9C+0LvQuNCz0L7QvS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2RyYXdQb2x5Z29uXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgeCAgICAgICAgICAgICBYINC60L7QvtGA0LTQuNC90LDRgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgeSAgICAgICAgICAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgc2lkZXMgICAgICAgICDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdGC0L7RgNC+0L0g0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB4UmFkaXVzICAgICAgIFgg0YDQsNC00LjRg9GBINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgeVJhZGl1cyAgICAgICBZINGA0LDQtNC40YPRgSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgIHJvdGF0aW9uQW5nbGUg0KPQs9C+0Lsg0L/QvtCy0L7RgNC+0YLQsCDQv9C+0LvQuNCz0L7QvdCwXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAo0YfRgtC+0LHRiyDQvdC1INC40YHQv9C+0LvRjNC30L7QstCw0YLRjCB7QGxpbmsgdjYuVHJhbnNmb3JtI3JvdGF0ZX0pLlxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgIGRlZ3JlZXMgICAgICAg0JjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMINCz0YDQsNC00YPRgdGLLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgaGV4YWdvbiBhdCBbIDQsIDIgXSB3aXRoIHJhZGl1cyAyNS5cbiAgICogcmVuZGVyZXIucG9seWdvbiggNCwgMiwgNiwgMjUsIDI1LCAwICk7XG4gICAqL1xuICBkcmF3UG9seWdvbjogZnVuY3Rpb24gZHJhd1BvbHlnb24gKCB4LCB5LCBzaWRlcywgeFJhZGl1cywgeVJhZGl1cywgcm90YXRpb25BbmdsZSwgZGVncmVlcyApXG4gIHtcbiAgICB2YXIgcG9seWdvbiA9IHBvbHlnb25zWyBzaWRlcyBdO1xuICAgIGlmICggISBwb2x5Z29uICkge1xuICAgICAgcG9seWdvbiA9IHBvbHlnb25zWyBzaWRlcyBdID0gY3JlYXRlUG9seWdvbiggc2lkZXMgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICB9XG4gICAgaWYgKCBkZWdyZWVzICkge1xuICAgICAgcm90YXRpb25BbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICAgIH1cbiAgICB0aGlzLm1hdHJpeC5zYXZlKCk7XG4gICAgdGhpcy5tYXRyaXgudHJhbnNsYXRlKCB4LCB5ICk7XG4gICAgdGhpcy5tYXRyaXgucm90YXRlKCByb3RhdGlvbkFuZ2xlICk7XG4gICAgdGhpcy5kcmF3QXJyYXlzKCBwb2x5Z29uLCBwb2x5Z29uLmxlbmd0aCAqIDAuNSwgdm9pZCAwLCB4UmFkaXVzLCB5UmFkaXVzICk7XG4gICAgdGhpcy5tYXRyaXgucmVzdG9yZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC/0L7Qu9C40LPQvtC9LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcG9seWdvblxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IHggICAgICAgICAgICAgICBYINC60L7QvtGA0LTQuNC90LDRgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0geSAgICAgICAgICAgICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSBzaWRlcyAgICAgICAgICAg0JrQvtC70LjRh9C10YHRgtCy0L4g0YHRgtC+0YDQvtC9INC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gciAgICAgICAgICAgICAgINCg0LDQtNC40YPRgSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IFtyb3RhdGlvbkFuZ2xlXSDQo9Cz0L7QuyDQv9C+0LLQvtGA0L7RgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjRh9GC0L7QsdGLINC90LUg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMIHtAbGluayB2Ni5UcmFuc2Zvcm0jcm90YXRlfSkuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBoZXhhZ29uIGF0IFsgNCwgMiBdIHdpdGggcmFkaXVzIDI1LlxuICAgKiByZW5kZXJlci5wb2x5Z29uKCA0LCAyLCA2LCAyNSApO1xuICAgKi9cbiAgcG9seWdvbjogZnVuY3Rpb24gcG9seWdvbiAoIHgsIHksIHNpZGVzLCByLCByb3RhdGlvbkFuZ2xlIClcbiAge1xuICAgIGlmICggc2lkZXMgJSAxICkge1xuICAgICAgc2lkZXMgPSBNYXRoLmZsb29yKCBzaWRlcyAqIDEwMCApICogMC4wMTtcbiAgICB9XG4gICAgaWYgKCB0eXBlb2Ygcm90YXRpb25BbmdsZSA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICB0aGlzLmRyYXdQb2x5Z29uKCB4LCB5LCBzaWRlcywgciwgciwgLU1hdGguUEkgKiAwLjUgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3UG9seWdvbiggeCwgeSwgc2lkZXMsIHIsIHIsIHJvdGF0aW9uQW5nbGUsIG9wdGlvbnMuZGVncmVlcyApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjaW1hZ2VcbiAgICogQHBhcmFtIHt2Ni5BYnN0cmFjdEltYWdlfSBpbWFnZSDQmtCw0YDRgtC40L3QutCwINC60L7RgtC+0YDRg9GOINC90LDQtNC+INC+0YLRgNC40YHQvtCy0LDRgtGMLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHggICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICB5ICAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgW3ddICAg0KjQuNGA0LjQvdCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgW2hdICAg0JLRi9GB0L7RgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gQ3JlYXRlIGltYWdlLlxuICAgKiB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnaW1hZ2UnICkgKTtcbiAgICogLy8gRHJhdyBpbWFnZSBhdCBbIDQsIDIgXS5cbiAgICogcmVuZGVyZXIuaW1hZ2UoIGltYWdlLCA0LCAyICk7XG4gICAqL1xuICBpbWFnZTogZnVuY3Rpb24gaW1hZ2UgKCBpbWFnZSwgeCwgeSwgdywgaCApXG4gIHtcbiAgICBpZiAoIGltYWdlLmdldCgpLmxvYWRlZCApIHtcbiAgICAgIGlmICggdHlwZW9mIHcgPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICB3ID0gaW1hZ2UuZHc7XG4gICAgICB9XG4gICAgICBpZiAoIHR5cGVvZiBoID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgaCA9IGltYWdlLmRoO1xuICAgICAgfVxuICAgICAgeCA9IHByb2Nlc3NSZWN0QWxpZ25YKCB0aGlzLCB4LCB3ICk7XG4gICAgICB4ID0gcHJvY2Vzc1JlY3RBbGlnblkoIHRoaXMsIHksIGggKTtcbiAgICAgIHRoaXMuZHJhd0ltYWdlKCBpbWFnZSwgeCwgeSwgdywgaCApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LTQu9GPINC90LDRh9Cw0LvQsCDQvtGC0YDQuNGB0L7QstC60Lgg0YTQuNCz0YPRgNGLLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICAgKiBAcGFyYW0ge29iamVjdH0gICBbb3B0aW9uc10gICAgICAgICAgICAgINCf0LDRgNCw0LzQtdGC0YDRiyDRhNC40LPRg9GA0YsuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLmRyYXdGdW5jdGlvbl0g0KTRg9C90LrRhtC40Y8sINC60L7RgtC+0YDQvtGPINCx0YPQtNC10YIg0L7RgtGA0LjRgdC+0LLRi9Cy0LDRgtGMINCy0YHQtSDQstC10YDRiNC40L3RiyDQsiB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlci5lbmRTaGFwZX0uINCc0L7QttC10YIg0LHRi9GC0Ywg0L/QtdGA0LXQt9Cw0L/QuNGB0LDQvdCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlcXVpcmUgXCJ2Ni5zaGFwZXNcIiAoXCJ2Ni5qc1wiIGJ1aWx0LWluIGRyYXdpbmcgZnVuY3Rpb25zKS5cbiAgICogdmFyIHNoYXBlcyA9IHJlcXVpcmUoICd2Ni5qcy9yZW5kZXJlci9zaGFwZXMvcG9pbnRzJyApO1xuICAgKiAvLyBCZWdpbiBkcmF3aW5nIHBvaW50cyBzaGFwZS5cbiAgICogcmVuZGVyZXIuYmVnaW5TaGFwZSggeyBkcmF3RnVuY3Rpb246IHNoYXBlcy5kcmF3UG9pbnRzIH0gKTtcbiAgICogLy8gQmVnaW4gZHJhd2luZyBzaGFwZSB3aXRob3V0IGRyYXdpbmcgZnVuY3Rpb24gKG11c3QgYmUgcGFzc2VkIGxhdGVyIGluIGBlbmRTaGFwZWApLlxuICAgKiByZW5kZXJlci5iZWdpblNoYXBlKCk7XG4gICAqL1xuICBiZWdpblNoYXBlOiBmdW5jdGlvbiBiZWdpblNoYXBlICggb3B0aW9ucyApXG4gIHtcbiAgICBpZiAoICEgb3B0aW9ucyApIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgdGhpcy5fdmVydGljZXMubGVuZ3RoID0gMDtcbiAgICB0aGlzLl9jbG9zZWRTaGFwZSA9IG51bGw7XG4gICAgaWYgKCB0eXBlb2Ygb3B0aW9ucy5kcmF3RnVuY3Rpb24gPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgdGhpcy5fZHJhd0Z1bmN0aW9uID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZHJhd0Z1bmN0aW9uID0gb3B0aW9ucy5kcmF3RnVuY3Rpb247XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0LLQtdGA0YjQuNC90YMg0LIg0LrQvtC+0YDQtNC40L3QsNGC0LDRhSDQuNC3INGB0L7QvtGC0LLQtdGC0YHQstGD0Y7RidC40YUg0L/QsNGA0LDQvNC10YLRgNC+0LIuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciN2ZXJ0ZXhcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQvdC+0LLQvtC5INCy0LXRgNGI0LjQvdGLLlxuICAgKiBAcGFyYW0ge251bWJlcn0geSBZINC60L7QvtGA0LTQuNC90LDRgtCwINC90L7QstC+0Lkg0LLQtdGA0YjQuNC90YsuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgcmVjdGFuZ2xlIHdpdGggdmVydGljZXMuXG4gICAqIHJlbmRlcmVyLnZlcnRleCggMCwgMCApO1xuICAgKiByZW5kZXJlci52ZXJ0ZXgoIDEsIDAgKTtcbiAgICogcmVuZGVyZXIudmVydGV4KCAxLCAxICk7XG4gICAqIHJlbmRlcmVyLnZlcnRleCggMCwgMSApO1xuICAgKi9cbiAgdmVydGV4OiBmdW5jdGlvbiB2ZXJ0ZXggKCB4LCB5IClcbiAge1xuICAgIHRoaXMuX3ZlcnRpY2VzLnB1c2goIE1hdGguZmxvb3IoIHggKSwgTWF0aC5mbG9vciggeSApICk7XG4gICAgdGhpcy5fY2xvc2VkU2hhcGUgPSBudWxsO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINGE0LjQs9GD0YDRgyDQuNC3INCy0LXRgNGI0LjQvS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSAgIFtvcHRpb25zXSAgICAgICAgICAgICAg0J/QsNGA0LDQvNC10YLRgNGLINGE0LjQs9GD0YDRiy5cbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMuY2xvc2VdICAgICAgICDQodC+0LXQtNC40L3QuNGC0Ywg0L/QvtGB0LvQtdC00L3RjtGOINCy0LXRgNGI0LjQvdGDINGBINC/0LXRgNCy0L7QuSAo0LfQsNC60YDRi9GC0Ywg0YTQuNCz0YPRgNGDKS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMuZHJhd0Z1bmN0aW9uXSDQpNGD0L3QutGG0LjRjywg0LrQvtGC0L7RgNC+0Y8g0LHRg9C00LXRgiDQvtGC0YDQuNGB0L7QstGL0LLQsNGC0Ywg0LLRgdC1INCy0LXRgNGI0LjQvdGLLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINCY0LzQtdC10YIg0LHQvtC70YzRiNC40Lkg0L/RgNC40L7RgNC40YLQtdGCINGH0LXQvCDQsiB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlfS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXF1aXJlIFwidjYuc2hhcGVzXCIgKFwidjYuanNcIiBidWlsdC1pbiBkcmF3aW5nIGZ1bmN0aW9ucykuXG4gICAqIHZhciBzaGFwZXMgPSByZXF1aXJlKCAndjYuanMvcmVuZGVyZXIvc2hhcGVzL3BvaW50cycgKTtcbiAgICogLy8gQ2xvc2UgYW5kIGRyYXcgYSBzaGFwZS5cbiAgICogcmVuZGVyZXIuZW5kU2hhcGUoIHsgY2xvc2U6IHRydWUgfSApO1xuICAgKiAvLyBEcmF3IHdpdGggYSBjdXN0b20gZnVuY3Rpb24uXG4gICAqIHJlbmRlcmVyLmVuZFNoYXBlKCB7IGRyYXdGdW5jdGlvbjogc2hhcGVzLmRyYXdMaW5lcyB9ICk7XG4gICAqL1xuICBlbmRTaGFwZTogZnVuY3Rpb24gZW5kU2hhcGUgKCBvcHRpb25zIClcbiAge1xuICAgIHZhciBkcmF3RnVuY3Rpb24sIHZlcnRpY2VzO1xuICAgIGlmICggISBvcHRpb25zICkge1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICBpZiAoICEgKCBkcmF3RnVuY3Rpb24gPSBvcHRpb25zLmRyYXdGdW5jdGlvbiB8fCB0aGlzLl9kcmF3RnVuY3Rpb24gKSApIHtcbiAgICAgIHRocm93IEVycm9yKCAnTm8gXCJkcmF3RnVuY3Rpb25cIiBzcGVjaWZpZWQgZm9yIFwicmVuZGVyZXIuZW5kU2hhcGVcIicgKTtcbiAgICB9XG4gICAgaWYgKCBvcHRpb25zLmNsb3NlICkge1xuICAgICAgY2xvc2VTaGFwZSggdGhpcyApO1xuICAgICAgdmVydGljZXMgPSB0aGlzLl9jbG9zZWRTaGFwZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmVydGljZXMgPSB0aGlzLl92ZXJ0aWNlcztcbiAgICB9XG4gICAgZHJhd0Z1bmN0aW9uKCB0aGlzLCBwcm9jZXNzU2hhcGUoIHRoaXMsIHZlcnRpY2VzICkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNzYXZlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jc2F2ZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTYXZlIHRyYW5zZm9ybS5cbiAgICogcmVuZGVyZXIuc2F2ZSgpO1xuICAgKi9cbiAgc2F2ZTogZnVuY3Rpb24gc2F2ZSAoKVxuICB7XG4gICAgdGhpcy5tYXRyaXguc2F2ZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3Jlc3RvcmVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNyZXN0b3JlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlc3RvcmUgdHJhbnNmb3JtLlxuICAgKiByZW5kZXJlci5yZXN0b3JlKCk7XG4gICAqL1xuICByZXN0b3JlOiBmdW5jdGlvbiByZXN0b3JlICgpXG4gIHtcbiAgICB0aGlzLm1hdHJpeC5yZXN0b3JlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc2V0VHJhbnNmb3JtXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jc2V0VHJhbnNmb3JtXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBpZGVudGl0eSB0cmFuc2Zvcm0uXG4gICAqIHJlbmRlcmVyLnNldFRyYW5zZm9ybSggMSwgMCwgMCwgMSwgMCwgMCApO1xuICAgKi9cbiAgc2V0VHJhbnNmb3JtOiBmdW5jdGlvbiBzZXRUcmFuc2Zvcm0gKCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG4gIHtcbiAgICB0aGlzLm1hdHJpeC5zZXRUcmFuc2Zvcm0oIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjdHJhbnNsYXRlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jdHJhbnNsYXRlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFRyYW5zbGF0ZSB0cmFuc2Zvcm0gdG8gWyA0LCAyIF0uXG4gICAqIHJlbmRlcmVyLnRyYW5zbGF0ZSggNCwgMiApO1xuICAgKi9cbiAgdHJhbnNsYXRlOiBmdW5jdGlvbiB0cmFuc2xhdGUgKCB4LCB5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnRyYW5zbGF0ZSggeCwgeSApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JvdGF0ZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuVHJhbnNmb3JtI3JvdGF0ZVxuICAgKiBAdG9kbyByZW5kZXJlci5zZXR0aW5ncy5kZWdyZWVzXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJvdGF0ZSB0cmFuc2Zvcm0gb24gNDUgZGVncmVlcy5cbiAgICogcmVuZGVyZXIucm90YXRlKCA0NSAqIE1hdGguUEkgLyAxODAgKTtcbiAgICovXG4gIHJvdGF0ZTogZnVuY3Rpb24gcm90YXRlICggYW5nbGUgKVxuICB7XG4gICAgaWYgKCB0aGlzLnNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgICBhbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICAgIH1cbiAgICB0aGlzLm1hdHJpeC5yb3RhdGUoIGFuZ2xlICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc2NhbGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNzY2FsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTY2FsZSB0cmFuc2Zvcm0gdHdpY2UuXG4gICAqIHJlbmRlcmVyLnNjYWxlKCAyLCAyICk7XG4gICAqL1xuICBzY2FsZTogZnVuY3Rpb24gc2NhbGUgKCB4LCB5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnNjYWxlKCB4LCB5ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjdHJhbnNmb3JtXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jdHJhbnNmb3JtXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEFwcGx5IHRyYW5zbGF0ZWQgdG8gWyA0LCAyIF0gXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIi5cbiAgICogcmVuZGVyZXIudHJhbnNmb3JtKCAxLCAwLCAwLCAxLCA0LCAyICk7XG4gICAqL1xuICB0cmFuc2Zvcm06IGZ1bmN0aW9uIHRyYW5zZm9ybSAoIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnRyYW5zZm9ybSggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGxpbmVXaWR0aCAo0YjQuNGA0LjQvdGDINC60L7QvdGC0YPRgNCwKS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2xpbmVXaWR0aFxuICAgKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyINCd0L7QstGL0LkgbGluZVdpZHRoLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBgbGluZVdpZHRoYCB0byAxMHB4LlxuICAgKiByZW5kZXJlci5saW5lV2lkdGgoIDEwICk7XG4gICAqL1xuICBsaW5lV2lkdGg6IGZ1bmN0aW9uIGxpbmVXaWR0aCAoIG51bWJlciApXG4gIHtcbiAgICB0aGlzLl9saW5lV2lkdGggPSBudW1iZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgYmFja2dyb3VuZFBvc2l0aW9uWGAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZFBvc2l0aW9uWFxuICAgKiBAcGFyYW0ge251bWJlcn0gICB2YWx1ZVxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB0eXBlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IFwiYmFja2dyb3VuZFBvc2l0aW9uWFwiIGRyYXdpbmcgc2V0dGluZyB0byBDRU5URVIgKGRlZmF1bHQ6IExFRlQpLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25YKCBjb25zdGFudHMuZ2V0KCAnQ0VOVEVSJyApLCBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKTtcbiAgICogcmVuZGVyZXIuYmFja2dyb3VuZFBvc2l0aW9uWCggMC41LCBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25YKCByZW5kZXJlci53IC8gMiApO1xuICAgKi9cbiAgYmFja2dyb3VuZFBvc2l0aW9uWDogZnVuY3Rpb24gYmFja2dyb3VuZFBvc2l0aW9uWCAoIHZhbHVlLCB0eXBlICkgeyBpZiAoIHR5cGVvZiB0eXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlICE9PSBjb25zdGFudHMuZ2V0KCAnVkFMVUUnICkgKSB7IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ0NPTlNUQU5UJyApICkgeyB0eXBlID0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICk7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiTEVGVFwiICkgKSB7IHZhbHVlID0gMDsgfSBlbHNlIGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiQ0VOVEVSXCIgKSApIHsgdmFsdWUgPSAwLjU7IH0gZWxzZSBpZiAoIHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCBcIlJJR0hUXCIgKSApIHsgdmFsdWUgPSAxOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHZhbHVlLiBUaGUga25vd24gYXJlOiAnICsgXCJMRUZUXCIgKyAnLCAnICsgXCJDRU5URVJcIiArICcsICcgKyBcIlJJR0hUXCIgKTsgfSB9IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICkgKSB7IHZhbHVlICo9IHRoaXMudzsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgdmFsdWVgIHR5cGUuIFRoZSBrbm93biBhcmU6IFZBTFVFLCBQRVJDRU5ULCBDT05TVEFOVCcgKTsgfSB9IHRoaXMuX2JhY2tncm91bmRQb3NpdGlvblggPSB2YWx1ZTsgcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgYGJhY2tncm91bmRQb3NpdGlvbllgINC90LDRgdGC0YDQvtC50LrRgyDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRQb3NpdGlvbllcbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgdmFsdWVcbiAgICogQHBhcmFtIHtjb25zdGFudH0gdHlwZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBcImJhY2tncm91bmRQb3NpdGlvbllcIiBkcmF3aW5nIHNldHRpbmcgdG8gTUlERExFIChkZWZhdWx0OiBUT1ApLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25ZKCBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApLCBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKTtcbiAgICogcmVuZGVyZXIuYmFja2dyb3VuZFBvc2l0aW9uWSggMC41LCBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25ZKCByZW5kZXJlci5oIC8gMiApO1xuICAgKi9cbiAgYmFja2dyb3VuZFBvc2l0aW9uWTogZnVuY3Rpb24gYmFja2dyb3VuZFBvc2l0aW9uWSAoIHZhbHVlLCB0eXBlICkgeyBpZiAoIHR5cGVvZiB0eXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlICE9PSBjb25zdGFudHMuZ2V0KCAnVkFMVUUnICkgKSB7IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ0NPTlNUQU5UJyApICkgeyB0eXBlID0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICk7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiVE9QXCIgKSApIHsgdmFsdWUgPSAwOyB9IGVsc2UgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJNSURETEVcIiApICkgeyB2YWx1ZSA9IDAuNTsgfSBlbHNlIGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiQk9UVE9NXCIgKSApIHsgdmFsdWUgPSAxOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHZhbHVlLiBUaGUga25vd24gYXJlOiAnICsgXCJUT1BcIiArICcsICcgKyBcIk1JRERMRVwiICsgJywgJyArIFwiQk9UVE9NXCIgKTsgfSB9IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICkgKSB7IHZhbHVlICo9IHRoaXMuaDsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgdmFsdWVgIHR5cGUuIFRoZSBrbm93biBhcmU6IFZBTFVFLCBQRVJDRU5ULCBDT05TVEFOVCcgKTsgfSB9IHRoaXMuX2JhY2tncm91bmRQb3NpdGlvblkgPSB2YWx1ZTsgcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgYHJlY3RBbGlnblhgINC90LDRgdGC0YDQvtC50LrRgyDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3RBbGlnblhcbiAgICogQHBhcmFtIHtjb25zdGFudH0gdmFsdWUgYExFRlRgLCBgQ0VOVEVSYCwgYFJJR0hUYC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTZXQgXCJyZWN0QWxpZ25YXCIgZHJhd2luZyBzZXR0aW5nIHRvIENFTlRFUiAoZGVmYXVsdDogTEVGVCkuXG4gICAqIHJlbmRlcmVyLnJlY3RBbGlnblgoIGNvbnN0YW50cy5nZXQoICdDRU5URVInICkgKTtcbiAgICovXG4gIHJlY3RBbGlnblg6IGZ1bmN0aW9uIHJlY3RBbGlnblggKCB2YWx1ZSApIHsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ0xFRlQnICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdDRU5URVInICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdSSUdIVCcgKSApIHsgdGhpcy5fcmVjdEFsaWduWCA9IHZhbHVlOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGByZWN0QWxpZ25gIGNvbnN0YW50LiBUaGUga25vd24gYXJlOiAnICsgXCJMRUZUXCIgKyAnLCAnICsgXCJDRU5URVJcIiArICcsICcgKyBcIlJJR0hUXCIgKTsgfSByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgcmVjdEFsaWduWWAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdEFsaWduWVxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB2YWx1ZSBgVE9QYCwgYE1JRERMRWAsIGBCT1RUT01gLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBcInJlY3RBbGlnbllcIiBkcmF3aW5nIHNldHRpbmcgdG8gTUlERExFIChkZWZhdWx0OiBUT1ApLlxuICAgKiByZW5kZXJlci5yZWN0QWxpZ25ZKCBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApICk7XG4gICAqL1xuICByZWN0QWxpZ25ZOiBmdW5jdGlvbiByZWN0QWxpZ25ZICggdmFsdWUgKSB7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdMRUZUJyApIHx8IHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCAnQ0VOVEVSJyApIHx8IHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCAnUklHSFQnICkgKSB7IHRoaXMuX3JlY3RBbGlnblkgPSB2YWx1ZTsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgcmVjdEFsaWduYCBjb25zdGFudC4gVGhlIGtub3duIGFyZTogJyArIFwiVE9QXCIgKyAnLCAnICsgXCJNSURETEVcIiArICcsICcgKyBcIkJPVFRPTVwiICk7IH0gcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIg0YbQstC10YIgYHN0cm9rZWAg0L/RgNC4INGA0LjRgdC+0LLQsNC90LjQuCDRh9C10YDQtdC3IHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3R9INC4INGCLtC/LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc3Ryb2tlXG4gICAqIEBwYXJhbSB7bnVtYmVyfGJvb2xlYW58VENvbG9yfSBbcl0g0JXRgdC70Lgg0Y3RgtC+IGBib29sZWFuYCwg0YLQviDRjdGC0L4g0LLQutC70Y7Rh9C40YIg0LjQu9C4INCy0YvQutC70Y7Rh9C40YIgYHN0cm9rZWBcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAo0LrQsNC6INGH0LXRgNC10Lcge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXIjbm9TdHJva2V9KS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYV1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEaXNhYmxlIGFuZCB0aGVuIGVuYWJsZSBgc3Ryb2tlYC5cbiAgICogcmVuZGVyZXIuc3Ryb2tlKCBmYWxzZSApLnN0cm9rZSggdHJ1ZSApO1xuICAgKiAvLyBTZXQgYHN0cm9rZWAgdG8gXCJsaWdodHNreWJsdWVcIi5cbiAgICogcmVuZGVyZXIuc3Ryb2tlKCAnbGlnaHRza3libHVlJyApO1xuICAgKiAvLyBTZXQgYHN0cm9rZWAgZnJvbSBgdjYuUkdCQWAuXG4gICAqIHJlbmRlcmVyLnN0cm9rZSggbmV3IFJHQkEoIDI1NSwgMCwgMCApLnBlcmNlaXZlZEJyaWdodG5lc3MoKSApO1xuICAgKi9cbiAgc3Ryb2tlOiBmdW5jdGlvbiBzdHJva2UgKCByLCBnLCBiLCBhICkgeyBpZiAoIHR5cGVvZiByID09PSAnYm9vbGVhbicgKSB7IHRoaXMuX2RvU3Ryb2tlID0gcjsgfSBlbHNlIHsgaWYgKCB0eXBlb2YgciA9PT0gJ3N0cmluZycgfHwgdGhpcy5fc3Ryb2tlQ29sb3IudHlwZSAhPT0gdGhpcy5zZXR0aW5ncy5jb2xvci50eXBlICkgeyB0aGlzLl9zdHJva2VDb2xvciA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7IH0gZWxzZSB7IHRoaXMuX3N0cm9rZUNvbG9yLnNldCggciwgZywgYiwgYSApOyB9IHRoaXMuX2RvU3Ryb2tlID0gdHJ1ZTsgfSByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiDRhtCy0LXRgiBgZmlsbGAg0L/RgNC4INGA0LjRgdC+0LLQsNC90LjQuCDRh9C10YDQtdC3IHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3R9INC4INGCLtC/LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZmlsbFxuICAgKiBAcGFyYW0ge251bWJlcnxib29sZWFufFRDb2xvcn0gW3JdINCV0YHQu9C4INGN0YLQviBgYm9vbGVhbmAsINGC0L4g0Y3RgtC+INCy0LrQu9GO0YfQuNGCINC40LvQuCDQstGL0LrQu9GO0YfQuNGCIGBmaWxsYFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjQutCw0Log0YfQtdGA0LXQtyB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlciNub0ZpbGx9KS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYV1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEaXNhYmxlIGFuZCB0aGVuIGVuYWJsZSBgZmlsbGAuXG4gICAqIHJlbmRlcmVyLmZpbGwoIGZhbHNlICkuZmlsbCggdHJ1ZSApO1xuICAgKiAvLyBTZXQgYGZpbGxgIHRvIFwibGlnaHRwaW5rXCIuXG4gICAqIHJlbmRlcmVyLmZpbGwoICdsaWdodHBpbmsnICk7XG4gICAqIC8vIFNldCBgZmlsbGAgZnJvbSBgdjYuUkdCQWAuXG4gICAqIHJlbmRlcmVyLmZpbGwoIG5ldyBSR0JBKCAyNTUsIDAsIDAgKS5icmlnaHRuZXNzKCkgKTtcbiAgICovXG4gIGZpbGw6IGZ1bmN0aW9uIGZpbGwgKCByLCBnLCBiLCBhICkgeyBpZiAoIHR5cGVvZiByID09PSAnYm9vbGVhbicgKSB7IHRoaXMuX2RvRmlsbCA9IHI7IH0gZWxzZSB7IGlmICggdHlwZW9mIHIgPT09ICdzdHJpbmcnIHx8IHRoaXMuX2ZpbGxDb2xvci50eXBlICE9PSB0aGlzLnNldHRpbmdzLmNvbG9yLnR5cGUgKSB7IHRoaXMuX2ZpbGxDb2xvciA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7IH0gZWxzZSB7IHRoaXMuX2ZpbGxDb2xvci5zZXQoIHIsIGcsIGIsIGEgKTsgfSB0aGlzLl9kb0ZpbGwgPSB0cnVlOyB9IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCS0YvQutC70Y7Rh9Cw0LXRgiDRgNC40YHQvtCy0LDQvdC40LUg0LrQvtC90YLRg9GA0LAgKHN0cm9rZSkuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNub1N0cm9rZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERpc2FibGUgZHJhd2luZyBzdHJva2UuXG4gICAqIHJlbmRlcmVyLm5vU3Ryb2tlKCk7XG4gICAqL1xuICBub1N0cm9rZTogZnVuY3Rpb24gbm9TdHJva2UgKCkgeyB0aGlzLl9kb1N0cm9rZSA9IGZhbHNlOyByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQktGL0LrQu9GO0YfQsNC10YIg0LfQsNC/0L7Qu9C90LXQvdC40Y8g0YTQvtC90LAgKGZpbGwpLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjbm9GaWxsXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRGlzYWJsZSBmaWxsaW5nLlxuICAgKiByZW5kZXJlci5ub0ZpbGwoKTtcbiAgICovXG4gIG5vRmlsbDogZnVuY3Rpb24gbm9GaWxsICgpIHsgdGhpcy5fZG9GaWxsID0gZmFsc2U7IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCX0LDQv9C+0LvQvdGP0LXRgiDRhNC+0L0g0YDQtdC90LTQtdGA0LXRgNCwINGG0LLQtdGC0L7QvC5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRDb2xvclxuICAgKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtiXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEZpbGwgcmVuZGVyZXIgd2l0aCBcImxpZ2h0cGlua1wiIGNvbG9yLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kQ29sb3IoICdsaWdodHBpbmsnICk7XG4gICAqL1xuICAvKipcbiAgICog0JfQsNC/0L7Qu9C90Y/QtdGCINGE0L7QvSDRgNC10L3QtNC10YDQtdGA0LAg0LrQsNGA0YLQuNC90LrQvtC5LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZEltYWdlXG4gICAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCwg0LrQvtGC0L7RgNCw0Y8g0LTQvtC70LbQvdCwINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0LTQu9GPINGE0L7QvdCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENyZWF0ZSBiYWNrZ3JvdW5kIGltYWdlLlxuICAgKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnYmFja2dyb3VuZC5qcGcnICk7XG4gICAqIC8vIEZpbGwgcmVuZGVyZXIgd2l0aCB0aGUgaW1hZ2UuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRJbWFnZSggSW1hZ2Uuc3RyZXRjaCggaW1hZ2UsIHJlbmRlcmVyLncsIHJlbmRlcmVyLmggKSApO1xuICAgKi9cbiAgLyoqXG4gICAqINCe0YfQuNGJ0LDQtdGCINC60L7QvdGC0LXQutGB0YIuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNjbGVhclxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENsZWFyIHJlbmRlcmVyJ3MgY29udGV4dC5cbiAgICogcmVuZGVyZXIuY2xlYXIoKTtcbiAgICovXG4gIC8qKlxuICAgKiDQntGC0YDQuNGB0L7QstGL0LLQsNC10YIg0L/QtdGA0LXQtNCw0L3QvdGL0LUg0LLQtdGA0YjQuNC90YsuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNkcmF3QXJyYXlzXG4gICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5fSB2ZXJ0cyDQktC10YDRiNC40L3Riywg0LrQvtGC0L7RgNGL0LUg0L3QsNC00L4g0L7RgtGA0LjRgdC+0LLQsNGC0YwuINCV0YHQu9C4INC90LUg0L/QtdGA0LXQtNCw0L3QviDQtNC70Y9cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtAbGluayB2Ni5SZW5kZXJlckdMfSwg0YLQviDQsdGD0LTRg9GCINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0LLQtdGA0YjQuNC90Ysg0LjQt1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0YHRgtCw0L3QtNCw0YDRgtC90L7Qs9C+INCx0YPRhNC10YDQsCAoe0BsaW5rIHY2LlJlbmRlcmVyR0wjYnVmZmVycy5kZWZhdWx0fSkuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICBjb3VudCDQmtC+0LvQuNGH0LXRgdGC0LLQviDQstC10YDRiNC40L0sINC90LDQv9GA0LjQvNC10YA6IDMg0LTQu9GPINGC0YDQtdGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBBIHRyaWFuZ2xlLlxuICAgKiB2YXIgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KCBbXG4gICAqICAgMCwgIDAsXG4gICAqICAgNTAsIDUwLFxuICAgKiAgIDAsICA1MFxuICAgKiBdICk7XG4gICAqXG4gICAqIC8vIERyYXcgdGhlIHRyaWFuZ2xlLlxuICAgKiByZW5kZXJlci5kcmF3QXJyYXlzKCB2ZXJ0aWNlcywgMyApO1xuICAgKi9cbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZHJhd0ltYWdlXG4gICAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCDQutC+0YLQvtGA0YPRjiDQvdCw0LTQviDQvtGC0YDQuNGB0L7QstCw0YLRjC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICB4ICAgICBcIkRlc3RpbmF0aW9uIFhcIi4gWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHkgICAgIFwiRGVzdGluYXRpb24gWVwiLiBZINC60L7QvtGA0LTQuNC90LDRgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgdyAgICAgXCJEZXN0aW5hdGlvbiBXaWR0aFwiLiDQqNC40YDQuNC90LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICBoICAgICBcIkRlc3RpbmF0aW9uIEhlaWdodFwiLiDQktGL0YHQvtGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBDcmVhdGUgaW1hZ2UuXG4gICAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICczMDB4MjAwLnBuZycgKTtcbiAgICogLy8gRHJhdyBpbWFnZSBhdCBbIDAsIDAgXS5cbiAgICogcmVuZGVyZXIuZHJhd0ltYWdlKCBpbWFnZSwgMCwgMCwgNjAwLCA0MDAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LouXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZWN0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gdyDQqNC40YDQuNC90LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGgg0JLRi9GB0L7RgtCwINC/0YDRj9C80L7Rg9Cz0L7Qu9GM0L3QuNC60LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBzcXVhcmUgYXQgWyAyMCwgMjAgXSB3aXRoIHNpemUgODAuXG4gICAqIHJlbmRlcmVyLnJlY3QoIDIwLCAyMCwgODAsIDgwICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC60YDRg9CzLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYXJjXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrRgNGD0LPQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQutGA0YPQs9CwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gciDQoNCw0LTQuNGD0YEg0LrRgNGD0LPQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGNpcmNsZSBhdCBbIDYwLCA2MCBdIHdpdGggcmFkaXVzIDQwLlxuICAgKiByZW5kZXJlci5hcmMoIDYwLCA2MCwgNDAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0LvQuNC90LjRji5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2xpbmVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHgxIFgg0L3QsNGH0LDQu9CwINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MSBZINC90LDRh9Cw0LvQsCDQu9C40L3QuNC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0geDIgWCDQutC+0L3RhtGLINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MiBZINC60L7QvdGG0Ysg0LvQuNC90LjQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGxpbmUgZnJvbSBbIDEwLCAxMCBdIHRvIFsgMjAsIDIwIF0uXG4gICAqIHJlbmRlcmVyLmxpbmUoIDEwLCAxMCwgMjAsIDIwICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINGC0L7Rh9C60YMuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwb2ludFxuICAgKiBAcGFyYW0ge251bWJlcn0geCBYINC60L7QvtGA0LTQuNC90LDRgtCwINGC0L7Rh9C60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5IFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0YLQvtGH0LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IHBvaW50IGF0IFsgNCwgMiBdLlxuICAgKiByZW5kZXJlci5wb2ludCggNCwgMiApO1xuICAgKi9cbiAgY29uc3RydWN0b3I6IEFic3RyYWN0UmVuZGVyZXJcbn07XG4vKipcbiAqIEluaXRpYWxpemUgcmVuZGVyZXIgb24gYFwic2VsZlwiYC5cbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlci5jcmVhdGVcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHNlbGYgICAgUmVuZGVyZXIgdGhhdCBzaG91bGQgYmUgaW5pdGlhbGl6ZWQuXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgICAgICBvcHRpb25zIHtAbGluayB2Ni5zZXR0aW5ncy5yZW5kZXJlcn1cbiAqIEBwYXJhbSAge2NvbnN0YW50fSAgICAgICAgICAgIHR5cGUgICAgVHlwZSBvZiByZW5kZXJlcjogYDJEYCBvciBgR0xgLiBDYW5ub3QgYmUgYEFVVE9gIS5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICAgICAgICAgUmV0dXJucyBub3RoaW5nLlxuICogQGV4YW1wbGUgPGNhcHRpb24+Q3VzdG9tIFJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIEFic3RyYWN0UmVuZGVyZXIgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyJyApO1xuICogdmFyIHNldHRpbmdzICAgICAgICAgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9zZXR0aW5ncycgKTtcbiAqIHZhciBjb25zdGFudHMgICAgICAgID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29uc3RhbnRzJyApO1xuICpcbiAqIGZ1bmN0aW9uIEN1c3RvbVJlbmRlcmVyICggb3B0aW9ucyApXG4gKiB7XG4gKiAgIC8vIEluaXRpYWxpemUgQ3VzdG9tUmVuZGVyZXIuXG4gKiAgIEFic3RyYWN0UmVuZGVyZXIuY3JlYXRlKCB0aGlzLCBkZWZhdWx0cyggc2V0dGluZ3MsIG9wdGlvbnMgKSwgY29uc3RhbnRzLmdldCggJzJEJyApICk7XG4gKiB9XG4gKi9cbkFic3RyYWN0UmVuZGVyZXIuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlICggc2VsZiwgb3B0aW9ucywgdHlwZSApXG57XG4gIHZhciBjb250ZXh0O1xuICAvKipcbiAgICogYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINC00LvRjyDQvtGC0YDQuNGB0L7QstC60Lgg0L3QsCDRjdC60YDQsNC90LUuXG4gICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2NhbnZhc1xuICAgKi9cbiAgaWYgKCBvcHRpb25zLmNhbnZhcyApIHtcbiAgICBzZWxmLmNhbnZhcyA9IG9wdGlvbnMuY2FudmFzO1xuICB9IGVsc2Uge1xuICAgIHNlbGYuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcbiAgICBzZWxmLmNhbnZhcy5pbm5lckhUTUwgPSAnVW5hYmxlIHRvIHJ1biB0aGlzIGFwcGxpY2F0aW9uLic7XG4gIH1cbiAgaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnMkQnICkgKSB7XG4gICAgY29udGV4dCA9ICcyZCc7XG4gIH0gZWxzZSBpZiAoIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoICdHTCcgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHJlbmRlcmVyIHR5cGUuIFRoZSBrbm93biBhcmU6IDJEIGFuZCBHTCcgKTtcbiAgfSBlbHNlIGlmICggISAoIGNvbnRleHQgPSBnZXRXZWJHTCgpICkgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgZ2V0IFdlYkdMIGNvbnRleHQuIFRyeSB0byB1c2UgMkQgYXMgdGhlIHJlbmRlcmVyIHR5cGUgb3IgdjYuUmVuZGVyZXIyRCBpbnN0ZWFkIG9mIHY2LlJlbmRlcmVyR0wnICk7XG4gIH1cbiAgLyoqXG4gICAqINCa0L7QvdGC0LXQutGB0YIg0YXQvtC70YHRgtCwLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LkFic3RyYWN0UmVuZGVyZXIjY29udGV4dFxuICAgKi9cbiAgc2VsZi5jb250ZXh0ID0gc2VsZi5jYW52YXMuZ2V0Q29udGV4dCggY29udGV4dCwge1xuICAgIGFscGhhOiBvcHRpb25zLmFscGhhXG4gIH0gKTtcbiAgLyoqXG4gICAqINCd0LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQtdGA0LAuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuQWJzdHJhY3RSZW5kZXJlciNzZXR0aW5nc1xuICAgKiBAc2VlIHY2LnNldHRpbmdzLnJlbmRlcmVyLnNldHRpbmdzXG4gICAqL1xuICBzZWxmLnNldHRpbmdzID0gb3B0aW9ucy5zZXR0aW5ncztcbiAgLyoqXG4gICAqINCi0LjQvyDRgNC10L3QtNC10YDQtdGA0LA6IEdMLCAyRC5cbiAgICogQG1lbWJlciB7Y29uc3RhbnR9IHY2LkFic3RyYWN0UmVuZGVyZXIjdHlwZVxuICAgKi9cbiAgc2VsZi50eXBlID0gdHlwZTtcbiAgLyoqXG4gICAqINCh0YLRjdC6INGB0L7RhdGA0LDQvdC10L3QvdGL0YUg0L3QsNGB0YLRgNC+0LXQuiDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7QXJyYXkuPG9iamVjdD59IHY2LkFic3RyYWN0UmVuZGVyZXIjX3N0YWNrXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNwdXNoXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNwb3BcbiAgICovXG4gIHNlbGYuX3N0YWNrID0gW107XG4gIC8qKlxuICAgKiDQn9C+0LfQuNGG0LjRjyDQv9C+0YHQu9C10LTQvdC40YUg0YHQvtGF0YDQsNC90LXQvdC90YvRhSDQvdCw0YHRgtGA0L7QtdC6INGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkFic3RyYWN0UmVuZGVyZXIjX3N0YWNrSW5kZXhcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3B1c2hcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvcFxuICAgKi9cbiAgc2VsZi5fc3RhY2tJbmRleCA9IC0xO1xuICAvKipcbiAgICog0JLQtdGA0YjQuNC90Ysg0YTQuNCz0YPRgNGLLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48bnVtYmVyPn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfdmVydGljZXNcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICovXG4gIHNlbGYuX3ZlcnRpY2VzID0gW107XG4gIC8qKlxuICAgKiDQl9Cw0LrRgNGL0YLQsNGPINGE0LjQs9GD0YDQsCAo0LLQtdGA0YjQuNC90LApLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48bnVtYmVyPn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfZHJhd0Z1bmN0aW9uXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciN2ZXJ0ZXhcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqL1xuICBzZWxmLl9jbG9zZWRTaGFwZSA9IG51bGw7XG4gIC8qKlxuICAgKiDQpNGD0L3QutGG0LjRjywg0LrQvtGC0L7RgNC+0Y8g0LHRg9C00LXRgiDQvtGC0YDQuNGB0L7QstGL0LLQsNGC0Ywg0LLQtdGA0YjQuNC90YsuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge2Z1bmN0aW9ufSB2Ni5BYnN0cmFjdFJlbmRlcmVyI19kcmF3RnVuY3Rpb25cbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICovXG4gIHNlbGYuX2RyYXdGdW5jdGlvbiA9IG51bGw7XG4gIGlmICggdHlwZW9mIG9wdGlvbnMuYXBwZW5kVG8gPT09ICd1bmRlZmluZWQnICkge1xuICAgIHNlbGYuYXBwZW5kVG8oIGRvY3VtZW50LmJvZHkgKTtcbiAgfSBlbHNlIGlmICggb3B0aW9ucy5hcHBlbmRUbyAhPT0gbnVsbCApIHtcbiAgICBzZWxmLmFwcGVuZFRvKCBvcHRpb25zLmFwcGVuZFRvICk7XG4gIH1cbiAgaWYgKCAndycgaW4gb3B0aW9ucyB8fCAnaCcgaW4gb3B0aW9ucyApIHtcbiAgICBzZWxmLnJlc2l6ZSggb3B0aW9ucy53IHx8IDAsIG9wdGlvbnMuaCB8fCAwICk7XG4gIH0gZWxzZSBpZiAoIG9wdGlvbnMuYXBwZW5kVG8gIT09IG51bGwgKSB7XG4gICAgc2VsZi5yZXNpemVUbyggb3B0aW9ucy5hcHBlbmRUbyB8fCBkb2N1bWVudC5ib2R5ICk7XG4gIH0gZWxzZSB7XG4gICAgc2VsZi5yZXNpemUoIDYwMCwgNDAwICk7XG4gIH1cbiAgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyggc2VsZiwgc2VsZiApO1xufTtcbm1vZHVsZS5leHBvcnRzID0gQWJzdHJhY3RSZW5kZXJlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmF1bHRzICAgICAgICAgID0gcmVxdWlyZSggJ3BlYWtvL2RlZmF1bHRzJyApO1xuXG52YXIgY29uc3RhbnRzICAgICAgICAgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApO1xuXG52YXIgcHJvY2Vzc1JlY3RBbGlnblggPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblg7XG52YXIgcHJvY2Vzc1JlY3RBbGlnblkgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblk7XG5cbnZhciBBYnN0cmFjdFJlbmRlcmVyICA9IHJlcXVpcmUoICcuL0Fic3RyYWN0UmVuZGVyZXInICk7XG52YXIgc2V0dGluZ3MgICAgICAgICAgPSByZXF1aXJlKCAnLi9zZXR0aW5ncycgKTtcblxuLyoqXG4gKiAyRCDRgNC10L3QtNC10YDQtdGALlxuICogQGNvbnN0cnVjdG9yIHY2LlJlbmRlcmVyMkRcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0UmVuZGVyZXJcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIHtAbGluayB2Ni5zZXR0aW5ncy5yZW5kZXJlcn1cbiAqIEBleGFtcGxlXG4gKiAvLyBSZXF1aXJlIFJlbmRlcmVyMkQuXG4gKiB2YXIgUmVuZGVyZXIyRCA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyMkQnICk7XG4gKiAvLyBDcmVhdGUgYW4gUmVuZGVyZXIyRCBpc250YW5jZS5cbiAqIHZhciByZW5kZXJlciA9IG5ldyBSZW5kZXJlcjJEKCk7XG4gKi9cbmZ1bmN0aW9uIFJlbmRlcmVyMkQgKCBvcHRpb25zIClcbntcbiAgQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUoIHRoaXMsICggb3B0aW9ucyA9IGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApICksIGNvbnN0YW50cy5nZXQoICcyRCcgKSApO1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHY2LlJlbmRlcmVyMkQjbWF0cml4XG4gICAqIEBhbGlhcyB2Ni5SZW5kZXJlcjJEI2NvbnRleHRcbiAgICovXG4gIHRoaXMubWF0cml4ID0gdGhpcy5jb250ZXh0O1xufVxuXG5SZW5kZXJlcjJELnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlICk7XG5SZW5kZXJlcjJELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlbmRlcmVyMkQ7XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjYmFja2dyb3VuZENvbG9yXG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLmJhY2tncm91bmRDb2xvciA9IGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvciAoIHIsIGcsIGIsIGEgKVxue1xuICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzO1xuICB2YXIgY29udGV4dCAgPSB0aGlzLmNvbnRleHQ7XG5cbiAgY29udGV4dC5zYXZlKCk7XG4gIGNvbnRleHQuZmlsbFN0eWxlID0gbmV3IHNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7XG4gIGNvbnRleHQuc2V0VHJhbnNmb3JtKCBzZXR0aW5ncy5zY2FsZSwgMCwgMCwgc2V0dGluZ3Muc2NhbGUsIDAsIDAgKTtcbiAgY29udGV4dC5maWxsUmVjdCggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgY29udGV4dC5yZXN0b3JlKCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2JhY2tncm91bmRJbWFnZVxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5iYWNrZ3JvdW5kSW1hZ2UgPSBmdW5jdGlvbiBiYWNrZ3JvdW5kSW1hZ2UgKCBpbWFnZSApXG57XG4gIHZhciBfcmVjdEFsaWduWCA9IHRoaXMuX3JlY3RBbGlnblg7XG4gIHZhciBfcmVjdEFsaWduWSA9IHRoaXMuX3JlY3RBbGlnblk7XG5cbiAgdGhpcy5fcmVjdEFsaWduWCA9IGNvbnN0YW50cy5nZXQoICdDRU5URVInICk7XG4gIHRoaXMuX3JlY3RBbGlnblkgPSBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApO1xuXG4gIHRoaXMuaW1hZ2UoIGltYWdlLCB0aGlzLncgKiAwLjUsIHRoaXMuaCAqIDAuNSApO1xuXG4gIHRoaXMuX3JlY3RBbGlnblggPSBfcmVjdEFsaWduWDtcbiAgdGhpcy5fcmVjdEFsaWduWSA9IF9yZWN0QWxpZ25ZO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNjbGVhclxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuY29udGV4dC5jbGVhciggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2RyYXdBcnJheXNcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuZHJhd0FycmF5cyA9IGZ1bmN0aW9uIGRyYXdBcnJheXMgKCB2ZXJ0cywgY291bnQsIF9tb2RlLCBfc3gsIF9zeSApXG57XG4gIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICB2YXIgaTtcblxuICBpZiAoIGNvdW50IDwgMiApIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGlmICggdHlwZW9mIF9zeCA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgX3N4ID0gX3N5ID0gMTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgfVxuXG4gIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gIGNvbnRleHQubW92ZVRvKCB2ZXJ0c1sgMCBdICogX3N4LCB2ZXJ0c1sgMSBdICogX3N5ICk7XG5cbiAgZm9yICggaSA9IDIsIGNvdW50ICo9IDI7IGkgPCBjb3VudDsgaSArPSAyICkge1xuICAgIGNvbnRleHQubGluZVRvKCB2ZXJ0c1sgaSBdICogX3N4LCB2ZXJ0c1sgaSArIDEgXSAqIF9zeSApO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb0ZpbGwgKSB7XG4gICAgdGhpcy5fZmlsbCgpO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb1N0cm9rZSAmJiB0aGlzLl9saW5lV2lkdGggPiAwICkge1xuICAgIHRoaXMuX3N0cm9rZSgpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2RyYXdJbWFnZVxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5kcmF3SW1hZ2UgPSBmdW5jdGlvbiBkcmF3SW1hZ2UgKCBpbWFnZSwgeCwgeSwgdywgaCApXG57XG4gIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UoIGltYWdlLmdldCgpLmltYWdlLCBpbWFnZS5zeCwgaW1hZ2Uuc3ksIGltYWdlLnN3LCBpbWFnZS5zaCwgeCwgeSwgdywgaCApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjcmVjdFxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24gcmVjdCAoIHgsIHksIHcsIGggKVxue1xuICB4ID0gcHJvY2Vzc1JlY3RBbGlnblgoIHRoaXMsIHgsIHcgKTtcbiAgeSA9IHByb2Nlc3NSZWN0QWxpZ25ZKCB0aGlzLCB5LCBoICk7XG5cbiAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICB0aGlzLmNvbnRleHQucmVjdCggeCwgeSwgdywgaCApO1xuXG4gIGlmICggdGhpcy5fZG9GaWxsICkge1xuICAgIHRoaXMuX2ZpbGwoKTtcbiAgfVxuXG4gIGlmICggdGhpcy5fZG9TdHJva2UgJiYgdGhpcy5fbGluZVdpZHRoID4gMCApIHtcbiAgICB0aGlzLl9zdHJva2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNhcmNcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuYXJjID0gZnVuY3Rpb24gYXJjICggeCwgeSwgciApXG57XG4gIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgdGhpcy5jb250ZXh0LmFyYyggeCwgeSwgciwgMCwgTWF0aC5QSSAqIDIgKTtcblxuICBpZiAoIHRoaXMuX2RvRmlsbCApIHtcbiAgICB0aGlzLl9maWxsKCk7XG4gIH1cblxuICBpZiAoIHRoaXMuX2RvU3Ryb2tlICYmIHRoaXMuX2xpbmVXaWR0aCA+IDAgKSB7XG4gICAgdGhpcy5fc3Ryb2tlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblJlbmRlcmVyMkQucHJvdG90eXBlLl9maWxsID0gZnVuY3Rpb24gX2ZpbGwgKClcbntcbiAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuX2ZpbGxDb2xvcjtcbiAgdGhpcy5jb250ZXh0LmZpbGwoKTtcbn07XG5cblJlbmRlcmVyMkQucHJvdG90eXBlLl9zdHJva2UgPSBmdW5jdGlvbiBfc3Ryb2tlICgpXG57XG4gIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuXG4gIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLl9zdHJva2VDb2xvcjtcblxuICBpZiAoICggY29udGV4dC5saW5lV2lkdGggPSB0aGlzLl9saW5lV2lkdGggKSA8PSAxICkge1xuICAgIGNvbnRleHQuc3Ryb2tlKCk7XG4gIH1cblxuICBjb250ZXh0LnN0cm9rZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjJEO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVmYXVsdHMgICAgICAgICAgPSByZXF1aXJlKCAncGVha28vZGVmYXVsdHMnICk7XG5cbnZhciBTaGFkZXJQcm9ncmFtICAgICA9IHJlcXVpcmUoICcuLi9TaGFkZXJQcm9ncmFtJyApO1xudmFyIFRyYW5zZm9ybSAgICAgICAgID0gcmVxdWlyZSggJy4uL1RyYW5zZm9ybScgKTtcbnZhciBjb25zdGFudHMgICAgICAgICA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICk7XG52YXIgc2hhZGVycyAgICAgICAgICAgPSByZXF1aXJlKCAnLi4vc2hhZGVycycgKTtcblxudmFyIHByb2Nlc3NSZWN0QWxpZ25YID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25YO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25ZID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25ZO1xuXG52YXIgQWJzdHJhY3RSZW5kZXJlciAgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFJlbmRlcmVyJyApO1xudmFyIHNldHRpbmdzICAgICAgICAgID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG5cbi8qKlxuICog0JzQsNGB0YHQuNCyINCy0LXRgNGI0LjQvSAodmVydGljZXMpINC60LLQsNC00YDQsNGC0LAuXG4gKiBAcHJpdmF0ZVxuICogQGlubmVyXG4gKiBAdmFyIHtGbG9hdDMyQXJyYXl9IHJlY3RcbiAqL1xudmFyIHJlY3QgPSAoIGZ1bmN0aW9uICgpXG57XG4gIHZhciByZWN0ID0gW1xuICAgIDAsIDAsXG4gICAgMSwgMCxcbiAgICAxLCAxLFxuICAgIDAsIDFcbiAgXTtcblxuICBpZiAoIHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoIHJlY3QgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICB9XG5cbiAgcmV0dXJuIHJlY3Q7XG59ICkoKTtcblxuLyoqXG4gKiBXZWJHTCDRgNC10L3QtNC10YDQtdGALlxuICogQGNvbnN0cnVjdG9yIHY2LlJlbmRlcmVyR0xcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0UmVuZGVyZXJcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIHtAbGluayB2Ni5zZXR0aW5ncy5yZW5kZXJlcn1cbiAqIEBleGFtcGxlXG4gKiAvLyBSZXF1aXJlIFJlbmRlcmVyR0wuXG4gKiB2YXIgUmVuZGVyZXJHTCA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyR0wnICk7XG4gKiAvLyBDcmVhdGUgYW4gUmVuZGVyZXJHTCBpc250YW5jZS5cbiAqIHZhciByZW5kZXJlciA9IG5ldyBSZW5kZXJlckdMKCk7XG4gKi9cbmZ1bmN0aW9uIFJlbmRlcmVyR0wgKCBvcHRpb25zIClcbntcbiAgQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUoIHRoaXMsICggb3B0aW9ucyA9IGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApICksIGNvbnN0YW50cy5nZXQoICdHTCcgKSApO1xuXG4gIC8qKlxuICAgKiDQrdGC0LAgXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIiDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0LTQu9GPIHtAbGluayB2Ni5SZW5kZXJlckdMI3JvdGF0ZX0g0Lgg0YIu0L8uXG4gICAqIEBtZW1iZXIge3Y2LlRyYW5zZm9ybX0gdjYuUmVuZGVyZXJHTCNtYXRyaXhcbiAgICovXG4gIHRoaXMubWF0cml4ID0gbmV3IFRyYW5zZm9ybSgpO1xuXG4gIC8qKlxuICAgKiDQkdGD0YTQtdGA0Ysg0LTQsNC90L3Ri9GFICjQstC10YDRiNC40L0pLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LlJlbmRlcmVyR0wjYnVmZmVyc1xuICAgKiBAcHJvcGVydHkge1dlYkdMQnVmZmVyfSBkZWZhdWx0INCe0YHQvdC+0LLQvdC+0Lkg0LHRg9GE0LXRgC5cbiAgICogQHByb3BlcnR5IHtXZWJHTEJ1ZmZlcn0gcmVjdCAgICDQmNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0LTQu9GPINC+0YLRgNC40YHQvtCy0LrQuCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwINCyIHtAbGluayB2Ni5SZW5kZXJlckdMI3JlY3R9LlxuICAgKi9cbiAgdGhpcy5idWZmZXJzID0ge1xuICAgIGRlZmF1bHQ6IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIoKSxcbiAgICByZWN0OiAgdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlcigpXG4gIH07XG5cbiAgdGhpcy5jb250ZXh0LmJpbmRCdWZmZXIoIHRoaXMuY29udGV4dC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVycy5yZWN0ICk7XG4gIHRoaXMuY29udGV4dC5idWZmZXJEYXRhKCB0aGlzLmNvbnRleHQuQVJSQVlfQlVGRkVSLCByZWN0LCB0aGlzLmNvbnRleHQuU1RBVElDX0RSQVcgKTtcblxuICAvKipcbiAgICog0KjQtdC50LTQtdGA0YsgKFdlYkdMINC/0YDQvtCz0YDQsNC80LzRiykuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuUmVuZGVyZXJHTCNwcm9ncmFtc1xuICAgKiBAcHJvcGVydHkge3Y2LlNoYWRlclByb2dyYW19IGRlZmF1bHRcbiAgICovXG4gIHRoaXMucHJvZ3JhbXMgPSB7XG4gICAgZGVmYXVsdDogbmV3IFNoYWRlclByb2dyYW0oIHNoYWRlcnMuYmFzaWMsIHRoaXMuY29udGV4dCApXG4gIH07XG5cbiAgdGhpcy5ibGVuZGluZyggb3B0aW9ucy5ibGVuZGluZyApO1xufVxuXG5SZW5kZXJlckdMLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlICk7XG5SZW5kZXJlckdMLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlbmRlcmVyR0w7XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjcmVzaXplXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uIHJlc2l6ZSAoIHcsIGggKVxue1xuICBBYnN0cmFjdFJlbmRlcmVyLnByb3RvdHlwZS5yZXNpemUuY2FsbCggdGhpcywgdywgaCApO1xuICB0aGlzLmNvbnRleHQudmlld3BvcnQoIDAsIDAsIHRoaXMudywgdGhpcy5oICk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjYmxlbmRpbmdcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYmxlbmRpbmdcbiAqIEBjaGFpbmFibGVcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuYmxlbmRpbmcgPSBmdW5jdGlvbiBibGVuZGluZyAoIGJsZW5kaW5nIClcbntcbiAgdmFyIGdsID0gdGhpcy5jb250ZXh0O1xuXG4gIGlmICggYmxlbmRpbmcgKSB7XG4gICAgZ2wuZW5hYmxlKCBnbC5CTEVORCApO1xuICAgIGdsLmRpc2FibGUoIGdsLkRFUFRIX1RFU1QgKTtcbiAgICBnbC5ibGVuZEZ1bmMoIGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSApO1xuICAgIGdsLmJsZW5kRXF1YXRpb24oIGdsLkZVTkNfQUREICk7XG4gIH0gZWxzZSB7XG4gICAgZ2wuZGlzYWJsZSggZ2wuQkxFTkQgKTtcbiAgICBnbC5lbmFibGUoIGdsLkRFUFRIX1RFU1QgKTtcbiAgICBnbC5kZXB0aEZ1bmMoIGdsLkxFUVVBTCApO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCe0YfQuNGJ0LDQtdGCINC60L7QvdGC0LXQutGB0YIuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI19jbGVhclxuICogQHBhcmFtICB7bnVtYmVyfSByINCd0L7RgNC80LDQu9C40LfQvtCy0LDQvdC90L7QtSDQt9C90LDRh9C10L3QuNC1IFwicmVkIGNoYW5uZWxcIi5cbiAqIEBwYXJhbSAge251bWJlcn0gZyDQndC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSBcImdyZWVuIGNoYW5uZWxcIi5cbiAqIEBwYXJhbSAge251bWJlcn0gYiDQndC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSBcImJsdWUgY2hhbm5lbFwiLlxuICogQHBhcmFtICB7bnVtYmVyfSBhINCd0L7RgNC80LDQu9C40LfQvtCy0LDQvdC90L7QtSDQt9C90LDRh9C10L3QuNC1INC/0YDQvtC30YDQsNGH0L3QvtGB0YLQuCAoYWxwaGEpLlxuICogQHJldHVybiB7dm9pZH0gICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIHJlbmRlcmVyLl9jbGVhciggMSwgMCwgMCwgMSApOyAvLyBGaWxsIGNvbnRleHQgd2l0aCByZWQgY29sb3IuXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLl9jbGVhciA9IGZ1bmN0aW9uIF9jbGVhciAoIHIsIGcsIGIsIGEgKVxue1xuICB2YXIgZ2wgPSB0aGlzLmNvbnRleHQ7XG4gIGdsLmNsZWFyQ29sb3IoIHIsIGcsIGIsIGEgKTtcbiAgZ2wuY2xlYXIoIGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNiYWNrZ3JvdW5kQ29sb3JcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuYmFja2dyb3VuZENvbG9yID0gZnVuY3Rpb24gYmFja2dyb3VuZENvbG9yICggciwgZywgYiwgYSApXG57XG4gIHZhciByZ2JhID0gbmV3IHRoaXMuc2V0dGluZ3MuY29sb3IoIHIsIGcsIGIsIGEgKS5yZ2JhKCk7XG4gIHRoaXMuX2NsZWFyKCByZ2JhWyAwIF0gLyAyNTUsIHJnYmFbIDEgXSAvIDI1NSwgcmdiYVsgMiBdIC8gMjU1LCByZ2JhWyAzIF0gKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2NsZWFyXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIgKClcbntcbiAgdGhpcy5fY2xlYXIoIDAsIDAsIDAsIDAgKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2RyYXdBcnJheXNcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuZHJhd0FycmF5cyA9IGZ1bmN0aW9uIGRyYXdBcnJheXMgKCB2ZXJ0cywgY291bnQsIG1vZGUsIF9zeCwgX3N5IClcbntcbiAgdmFyIHByb2dyYW0gPSB0aGlzLnByb2dyYW1zLmRlZmF1bHQ7XG4gIHZhciBnbCAgICAgID0gdGhpcy5jb250ZXh0O1xuXG4gIGlmICggY291bnQgPCAyICkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaWYgKCB2ZXJ0cyApIHtcbiAgICBpZiAoIHR5cGVvZiBtb2RlID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgIG1vZGUgPSBnbC5TVEFUSUNfRFJBVztcbiAgICB9XG5cbiAgICBnbC5iaW5kQnVmZmVyKCBnbC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVycy5kZWZhdWx0ICk7XG4gICAgZ2wuYnVmZmVyRGF0YSggZ2wuQVJSQVlfQlVGRkVSLCB2ZXJ0cywgbW9kZSApO1xuICB9XG5cbiAgaWYgKCB0eXBlb2YgX3N4ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICB0aGlzLm1hdHJpeC5zY2FsZSggX3N4LCBfc3kgKTtcbiAgfVxuXG4gIHByb2dyYW1cbiAgICAudXNlKClcbiAgICAuc2V0VW5pZm9ybSggJ3V0cmFuc2Zvcm0nLCB0aGlzLm1hdHJpeC5tYXRyaXggKVxuICAgIC5zZXRVbmlmb3JtKCAndXJlcycsIFsgdGhpcy53LCB0aGlzLmggXSApXG4gICAgLnNldEF0dHJpYnV0ZSggJ2Fwb3MnLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDAgKTtcblxuICB0aGlzLl9maWxsKCBjb3VudCApO1xuICB0aGlzLl9zdHJva2UoIGNvdW50ICk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5SZW5kZXJlckdMLnByb3RvdHlwZS5fZmlsbCA9IGZ1bmN0aW9uIF9maWxsICggY291bnQgKVxue1xuICBpZiAoIHRoaXMuX2RvRmlsbCApIHtcbiAgICB0aGlzLnByb2dyYW1zLmRlZmF1bHQuc2V0VW5pZm9ybSggJ3Vjb2xvcicsIHRoaXMuX2ZpbGxDb2xvci5yZ2JhKCkgKTtcbiAgICB0aGlzLmNvbnRleHQuZHJhd0FycmF5cyggdGhpcy5jb250ZXh0LlRSSUFOR0xFX0ZBTiwgMCwgY291bnQgKTtcbiAgfVxufTtcblxuUmVuZGVyZXJHTC5wcm90b3R5cGUuX3N0cm9rZSA9IGZ1bmN0aW9uIF9zdHJva2UgKCBjb3VudCApXG57XG4gIGlmICggdGhpcy5fZG9TdHJva2UgJiYgdGhpcy5fbGluZVdpZHRoID4gMCApIHtcbiAgICB0aGlzLnByb2dyYW1zLmRlZmF1bHQuc2V0VW5pZm9ybSggJ3Vjb2xvcicsIHRoaXMuX3N0cm9rZUNvbG9yLnJnYmEoKSApO1xuICAgIHRoaXMuY29udGV4dC5saW5lV2lkdGgoIHRoaXMuX2xpbmVXaWR0aCApO1xuICAgIHRoaXMuY29udGV4dC5kcmF3QXJyYXlzKCB0aGlzLmNvbnRleHQuTElORV9MT09QLCAwLCBjb3VudCApO1xuICB9XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2FyY1xuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5hcmMgPSBmdW5jdGlvbiBhcmMgKCB4LCB5LCByIClcbntcbiAgcmV0dXJuIHRoaXMuZHJhd1BvbHlnb24oIHgsIHksIHIsIHIsIDI0LCAwICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI3JlY3RcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUucmVjdCA9IGZ1bmN0aW9uIHJlY3QgKCB4LCB5LCB3LCBoIClcbntcbiAgeCA9IHByb2Nlc3NSZWN0QWxpZ25YKCB0aGlzLCB4LCB3ICk7XG4gIHkgPSBwcm9jZXNzUmVjdEFsaWduWSggdGhpcywgeSwgaCApO1xuICB0aGlzLm1hdHJpeC5zYXZlKCk7XG4gIHRoaXMubWF0cml4LnRyYW5zbGF0ZSggeCwgeSApO1xuICB0aGlzLm1hdHJpeC5zY2FsZSggdywgaCApO1xuICB0aGlzLmNvbnRleHQuYmluZEJ1ZmZlciggdGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXJzLnJlY3QgKTtcbiAgdGhpcy5kcmF3QXJyYXlzKCBudWxsLCA0ICk7XG4gIHRoaXMubWF0cml4LnJlc3RvcmUoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyR0w7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdGFudHMgICAgICAgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApO1xuXG52YXIgcmVwb3J0ICAgICAgICAgID0gcmVxdWlyZSggJy4uL2ludGVybmFsL3JlcG9ydCcgKTtcblxudmFyIGdldFJlbmRlcmVyVHlwZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL2dldF9yZW5kZXJlcl90eXBlJyApO1xudmFyIGdldFdlYkdMICAgICAgICA9IHJlcXVpcmUoICcuL2ludGVybmFsL2dldF93ZWJnbCcgKTtcblxudmFyIFJlbmRlcmVyR0wgICAgICA9IHJlcXVpcmUoICcuL1JlbmRlcmVyR0wnICk7XG52YXIgUmVuZGVyZXIyRCAgICAgID0gcmVxdWlyZSggJy4vUmVuZGVyZXIyRCcgKTtcbnZhciB0eXBlICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9zZXR0aW5ncycgKS50eXBlO1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkg0YDQtdC90LTQtdGA0LXRgC4g0JXRgdC70Lgg0YHQvtC30LTQsNGC0YwgV2ViR0wg0LrQvtC90YLQtdC60YHRgiDQvdC1INC/0L7Qu9GD0YfQuNGC0YHRjywg0YLQviDQsdGD0LTQtdGCINC40YHQv9C+0LvRjNC30L7QstCw0L0gMkQuXG4gKiBAbWV0aG9kIHY2LmNyZWF0ZVJlbmRlcmVyXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgICAgICBvcHRpb25zIHtAbGluayB2Ni5zZXR0aW5ncy5yZW5kZXJlcn0uXG4gKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSAgICAgICAgINCd0L7QstGL0Lkg0YDQtdC90LTQtdGA0LXRgCAoMkQsIEdMKS5cbiAqIEBleGFtcGxlXG4gKiB2YXIgY3JlYXRlUmVuZGVyZXIgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9jcmVhdGVfcmVuZGVyZXInICk7XG4gKiB2YXIgY29uc3RhbnRzICAgICAgPSByZXF1aXJlKCAndjYuanMvY29yZS9jb25zdGFudHMnICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyBXZWJHTCBvciAyRCByZW5kZXJlciBiYXNlZCBvbiBwbGF0Zm9ybSBhbmQgYnJvd3NlcjwvY2FwdGlvbj5cbiAqIHZhciByZW5kZXJlciA9IGNyZWF0ZVJlbmRlcmVyKCB7IHR5cGU6IGNvbnN0YW50cy5nZXQoICdBVVRPJyApIH0gKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIFdlYkdMIHJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIHJlbmRlcmVyID0gY3JlYXRlUmVuZGVyZXIoIHsgdHlwZTogY29uc3RhbnRzLmdldCggJ0dMJyApIH0gKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIDJEIHJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIHJlbmRlcmVyID0gY3JlYXRlUmVuZGVyZXIoIHsgdHlwZTogY29uc3RhbnRzLmdldCggJzJEJyApIH0gKTtcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUmVuZGVyZXIgKCBvcHRpb25zIClcbntcbiAgdmFyIHR5cGVfID0gKCBvcHRpb25zICYmIG9wdGlvbnMudHlwZSApIHx8IHR5cGU7XG5cbiAgaWYgKCB0eXBlXyA9PT0gY29uc3RhbnRzLmdldCggJ0FVVE8nICkgKSB7XG4gICAgdHlwZV8gPSBnZXRSZW5kZXJlclR5cGUoKTtcbiAgfVxuXG4gIGlmICggdHlwZV8gPT09IGNvbnN0YW50cy5nZXQoICdHTCcgKSApIHtcbiAgICBpZiAoIGdldFdlYkdMKCkgKSB7XG4gICAgICByZXR1cm4gbmV3IFJlbmRlcmVyR0woIG9wdGlvbnMgKTtcbiAgICB9XG5cbiAgICByZXBvcnQoICdDYW5ub3QgY3JlYXRlIFdlYkdMIGNvbnRleHQuIEZhbGxpbmcgYmFjayB0byAyRC4nICk7XG4gIH1cblxuICBpZiAoIHR5cGVfID09PSBjb25zdGFudHMuZ2V0KCAnMkQnICkgfHwgdHlwZV8gPT09IGNvbnN0YW50cy5nZXQoICdHTCcgKSApIHtcbiAgICByZXR1cm4gbmV3IFJlbmRlcmVyMkQoIG9wdGlvbnMgKTtcbiAgfVxuXG4gIHRocm93IEVycm9yKCAnR290IHVua25vd24gcmVuZGVyZXIgdHlwZS4gVGhlIGtub3duIGFyZTogMkQgYW5kIEdMJyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVJlbmRlcmVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCX0LDQutGA0YvQstCw0LXRgiDRhNC40LPRg9GA0YMuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjbG9zZVNoYXBlXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSByZW5kZXJlciDQoNC10L3QtNC10YDQtdGALlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKi9cbmZ1bmN0aW9uIGNsb3NlU2hhcGUgKCByZW5kZXJlciApXG57XG4gIGlmICggISByZW5kZXJlci5fY2xvc2VkU2hhcGUgKSB7XG4gICAgcmVuZGVyZXIuX2Nsb3NlZFNoYXBlID0gcmVuZGVyZXIuX3ZlcnRpY2VzLnNsaWNlKCk7XG4gICAgcmVuZGVyZXIuX2Nsb3NlZFNoYXBlLnB1c2goIHJlbmRlcmVyLl9jbG9zZWRTaGFwZVsgMCBdICk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbG9zZVNoYXBlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCa0L7Qv9C40YDRg9C10YIgZHJhd2luZyBzZXR0aW5ncyAoX2xpbmVXaWR0aCwgX3JlY3RBbGlnblgsINC4INGCLtC0Likg0LjQtyBgc291cmNlYCDQsiBgdGFyZ2V0YC5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNvcHlEcmF3aW5nU2V0dGluZ3NcbiAqIEBwYXJhbSAge29iamVjdH0gIHRhcmdldCDQnNC+0LbQtdGCINCx0YvRgtGMIGBBYnN0cmFjdFJlbmRlcmVyYCDQuNC70Lgg0L/RgNC+0YHRgtGL0Lwg0L7QsdGK0LXQutGC0L7QvCDRgSDRgdC+0YXRgNCw0L3QtdC90L3Ri9C80Lgg0YfQtdGA0LXQt1xuICogICAgICAgICAgICAgICAgICAgICAgICAgINGN0YLRgyDRhNGD0L3QutGG0LjRjiDQvdCw0YHRgtGA0L7QudC60LDQvNC4LlxuICogQHBhcmFtICB7b2JqZWN0fSAgc291cmNlINCe0L/QuNGB0LDQvdC40LUg0YLQviDQttC1LCDRh9GC0L4g0Lgg0LTQu9GPIGB0YXJnZXRgLlxuICogQHBhcmFtICB7Ym9vbGVhbn0gW2RlZXBdINCV0YHQu9C4IGB0cnVlYCwg0YLQviDQsdGD0LTQtdGCINGC0LDQutC20LUg0LrQvtC/0LjRgNC+0LLQsNGC0YwgX2ZpbGxDb2xvciwgX3N0cm9rZUNvbG9yINC4INGCLtC0LlxuICogQHJldHVybiB7b2JqZWN0fSAgICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIGB0YXJnZXRgLlxuICovXG5mdW5jdGlvbiBjb3B5RHJhd2luZ1NldHRpbmdzICggdGFyZ2V0LCBzb3VyY2UsIGRlZXAgKVxue1xuICBpZiAoIGRlZXAgKSB7XG4gICAgdGFyZ2V0Ll9maWxsQ29sb3JbIDAgXSAgID0gc291cmNlLl9maWxsQ29sb3JbIDAgXTtcbiAgICB0YXJnZXQuX2ZpbGxDb2xvclsgMSBdICAgPSBzb3VyY2UuX2ZpbGxDb2xvclsgMSBdO1xuICAgIHRhcmdldC5fZmlsbENvbG9yWyAyIF0gICA9IHNvdXJjZS5fZmlsbENvbG9yWyAyIF07XG4gICAgdGFyZ2V0Ll9maWxsQ29sb3JbIDMgXSAgID0gc291cmNlLl9maWxsQ29sb3JbIDMgXTtcbiAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWyAwIF0gPSBzb3VyY2UuX3N0cm9rZUNvbG9yWyAwIF07XG4gICAgdGFyZ2V0Ll9zdHJva2VDb2xvclsgMSBdID0gc291cmNlLl9zdHJva2VDb2xvclsgMSBdO1xuICAgIHRhcmdldC5fc3Ryb2tlQ29sb3JbIDIgXSA9IHNvdXJjZS5fc3Ryb2tlQ29sb3JbIDIgXTtcbiAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWyAzIF0gPSBzb3VyY2UuX3N0cm9rZUNvbG9yWyAzIF07XG4gIH1cblxuICB0YXJnZXQuX2JhY2tncm91bmRQb3NpdGlvblggPSBzb3VyY2UuX2JhY2tncm91bmRQb3NpdGlvblg7XG4gIHRhcmdldC5fYmFja2dyb3VuZFBvc2l0aW9uWSA9IHNvdXJjZS5fYmFja2dyb3VuZFBvc2l0aW9uWTtcbiAgdGFyZ2V0Ll9yZWN0QWxpZ25YICAgICAgICAgID0gc291cmNlLl9yZWN0QWxpZ25YO1xuICB0YXJnZXQuX3JlY3RBbGlnblkgICAgICAgICAgPSBzb3VyY2UuX3JlY3RBbGlnblk7XG4gIHRhcmdldC5fbGluZVdpZHRoICAgICAgICAgICA9IHNvdXJjZS5fbGluZVdpZHRoO1xuICB0YXJnZXQuX2RvU3Ryb2tlICAgICAgICAgICAgPSBzb3VyY2UuX2RvU3Ryb2tlO1xuICB0YXJnZXQuX2RvRmlsbCAgICAgICAgICAgICAgPSBzb3VyY2UuX2RvRmlsbDtcblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvcHlEcmF3aW5nU2V0dGluZ3M7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCAnLi4vLi4vY29uc3RhbnRzJyApO1xuXG52YXIgZGVmYXVsdERyYXdpbmdTZXR0aW5ncyA9IHtcbiAgX2JhY2tncm91bmRQb3NpdGlvblg6IGNvbnN0YW50cy5nZXQoICdMRUZUJyApLFxuICBfYmFja2dyb3VuZFBvc2l0aW9uWTogY29uc3RhbnRzLmdldCggJ1RPUCcgKSxcbiAgX3JlY3RBbGlnblg6ICAgICAgICAgIGNvbnN0YW50cy5nZXQoICdMRUZUJyApLFxuICBfcmVjdEFsaWduWTogICAgICAgICAgY29uc3RhbnRzLmdldCggJ1RPUCcgKSxcbiAgX2xpbmVXaWR0aDogICAgICAgICAgIDIsXG4gIF9kb1N0cm9rZTogICAgICAgICAgICB0cnVlLFxuICBfZG9GaWxsOiAgICAgICAgICAgICAgdHJ1ZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0RHJhd2luZ1NldHRpbmdzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb25jZSAgICAgID0gcmVxdWlyZSggJ3BlYWtvL29uY2UnICk7XG5cbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCAnLi4vLi4vY29uc3RhbnRzJyApO1xuXG4vLyBcInBsYXRmb3JtXCIgbm90IGluY2x1ZGVkIHVzaW5nIDxzY3JpcHQgLz4gdGFnLlxuaWYgKCB0eXBlb2YgcGxhdGZvcm0gPT09ICd1bmRlZmluZWQnICkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZS1iZWZvcmUtZGVmaW5lXG4gIHZhciBwbGF0Zm9ybTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG4gIHRyeSB7XG4gICAgcGxhdGZvcm0gPSByZXF1aXJlKCAncGxhdGZvcm0nICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ2xvYmFsLXJlcXVpcmVcbiAgfSBjYXRjaCAoIGVycm9yICkge1xuICAgIC8vIFwicGxhdGZvcm1cIiBub3QgaW5zdGFsbGVkIHVzaW5nIE5QTS5cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZW5kZXJlclR5cGUgKClcbntcbiAgdmFyIHNhZmFyaSwgdG91Y2hhYmxlO1xuXG4gIGlmICggcGxhdGZvcm0gKSB7XG4gICAgc2FmYXJpID0gcGxhdGZvcm0ub3MgJiZcbiAgICAgIHBsYXRmb3JtLm9zLmZhbWlseSA9PT0gJ2lPUycgJiZcbiAgICAgIHBsYXRmb3JtLm5hbWUgPT09ICdTYWZhcmknO1xuICB9XG5cbiAgaWYgKCB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICB0b3VjaGFibGUgPSAnb250b3VjaGVuZCcgaW4gd2luZG93O1xuICB9XG5cbiAgaWYgKCB0b3VjaGFibGUgJiYgISBzYWZhcmkgKSB7XG4gICAgcmV0dXJuIGNvbnN0YW50cy5nZXQoICdHTCcgKTtcbiAgfVxuXG4gIHJldHVybiBjb25zdGFudHMuZ2V0KCAnMkQnICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb25jZSggZ2V0UmVuZGVyZXJUeXBlICk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBvbmNlID0gcmVxdWlyZSggJ3BlYWtvL29uY2UnICk7XG5cbi8qKlxuICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LjQvNGPINC/0L7QtNC00LXRgNC20LjQstCw0LXQvNC+0LPQviBXZWJHTCDQutC+0L3RgtC10LrRgdGC0LAsINC90LDQv9GA0LjQvNC10YA6ICdleHBlcmltZW50YWwtd2ViZ2wnLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgZ2V0V2ViR0xcbiAqIEByZXR1cm4ge3N0cmluZz99INCSINGB0LvRg9GH0LDQtSDQvdC10YPQtNCw0YfQuCAoV2ViR0wg0L3QtSDQv9C+0LTQtNC10YDQttC40LLQsNC10YLRgdGPKSAtINCy0LXRgNC90LXRgiBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGdldFdlYkdMICgpXG57XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xuICB2YXIgbmFtZSAgID0gbnVsbDtcblxuICBpZiAoIGNhbnZhcy5nZXRDb250ZXh0KCAnd2ViZ2wnICkgKSB7XG4gICAgbmFtZSA9ICd3ZWJnbCc7XG4gIH0gZWxzZSBpZiAoIGNhbnZhcy5nZXRDb250ZXh0KCAnZXhwZXJpbWVudGFsLXdlYmdsJyApICkge1xuICAgIG5hbWUgPSAnZXhwZXJpbWVudGFsLXdlYmdsJztcbiAgfVxuXG4gIC8vIEZpeGluZyBwb3NzaWJsZSBtZW1vcnkgbGVhay5cbiAgY2FudmFzID0gbnVsbDtcbiAgcmV0dXJuIG5hbWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb25jZSggZ2V0V2ViR0wgKTtcbiIsIi8qIGVzbGludCBsaW5lcy1hcm91bmQtZGlyZWN0aXZlOiBvZmYgKi9cbi8qIGVzbGludCBsaW5lcy1hcm91bmQtY29tbWVudDogb2ZmICovXG4ndXNlIHN0cmljdCc7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJy4uLy4uL2NvbnN0YW50cycgKTtcbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgcHJvY2Vzc1JlY3RBbGlnblhcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHJlbmRlcmVyXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB4XG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB3XG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydHMucHJvY2Vzc1JlY3RBbGlnblggPSBmdW5jdGlvbiBwcm9jZXNzUmVjdEFsaWduWCAoIHJlbmRlcmVyLCB4LCB3ICkgeyBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25YID09PSBjb25zdGFudHMuZ2V0KCBcIkNFTlRFUlwiICkgKSB7IHggLT0gdyAqIDAuNTsgfSBlbHNlIGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblggPT09IGNvbnN0YW50cy5nZXQoIFwiUklHSFRcIiApICkgeyB4IC09IHc7IH0gZWxzZSBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25YICE9PSBjb25zdGFudHMuZ2V0KCBcIkxFRlRcIiApICkgeyB0aHJvdyBFcnJvciggJ1Vua25vd24gXCIgKycgKyBcInJlY3RBbGlnblhcIiArICdcIjogJyArIHJlbmRlcmVyLl9yZWN0QWxpZ25YICk7IH0gcmV0dXJuIE1hdGguZmxvb3IoIHggKTsgfTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHByb2Nlc3NSZWN0QWxpZ25ZXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSByZW5kZXJlclxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgeVxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgaFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnRzLnByb2Nlc3NSZWN0QWxpZ25ZID0gZnVuY3Rpb24gcHJvY2Vzc1JlY3RBbGlnblkgKCByZW5kZXJlciwgeCwgdyApIHsgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWSA9PT0gY29uc3RhbnRzLmdldCggXCJNSURETEVcIiApICkgeyB4IC09IHcgKiAwLjU7IH0gZWxzZSBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25ZID09PSBjb25zdGFudHMuZ2V0KCBcIkJPVFRPTVwiICkgKSB7IHggLT0gdzsgfSBlbHNlIGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblkgIT09IGNvbnN0YW50cy5nZXQoIFwiVE9QXCIgKSApIHsgdGhyb3cgRXJyb3IoICdVbmtub3duIFwiICsnICsgXCJyZWN0QWxpZ25ZXCIgKyAnXCI6ICcgKyByZW5kZXJlci5fcmVjdEFsaWduWSApOyB9IHJldHVybiBNYXRoLmZsb29yKCB4ICk7IH07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR0wgPSByZXF1aXJlKCAnLi4vLi4vY29uc3RhbnRzJyApLmdldCggJ0dMJyApO1xuXG4vKipcbiAqINCe0LHRgNCw0LHQsNGC0YvQstCw0LXRgiDRhNC40LPRg9GA0YMuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBwcm9jZXNzU2hhcGVcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHJlbmRlcmVyINCg0LXQvdC00LXRgNC10YAuXG4gKiBAcGFyYW0gIHtBcnJheXxGbG9hdDMyQXJyYXl9ICB2ZXJ0aWNlcyDQktC10YDRiNC40L3Riy5cbiAqIEByZXR1cm4ge0FycmF5fEZsb2F0MzJBcnJheX0gICAgICAgICAgINCe0LHRgNCw0LHQvtGC0LDQvdC90YvQtSDQstC10YDRiNC40L3Riy5cbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc1NoYXBlICggcmVuZGVyZXIsIHZlcnRpY2VzIClcbntcbiAgaWYgKCByZW5kZXJlci50eXBlID09PSBHTCAmJiB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSAnZnVuY3Rpb24nICYmICEgKCB2ZXJ0aWNlcyBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSApICkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gICAgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KCB2ZXJ0aWNlcyApOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICB9XG5cbiAgcmV0dXJuIHZlcnRpY2VzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHByb2Nlc3NTaGFwZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmF1bHREcmF3aW5nU2V0dGluZ3MgPSByZXF1aXJlKCAnLi9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MnICk7XG52YXIgY29weURyYXdpbmdTZXR0aW5ncyAgICA9IHJlcXVpcmUoICcuL2NvcHlfZHJhd2luZ19zZXR0aW5ncycgKTtcblxuLyoqXG4gKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBkcmF3aW5nIHNldHRpbmdzINC/0L4g0YPQvNC+0LvRh9Cw0L3QuNGOINCyIGB0YXJnZXRgLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2Qgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5nc1xuICogQHBhcmFtICB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ICAg0JzQvtC20LXRgiDQsdGL0YLRjCBgQWJzdHJhY3RSZW5kZXJlcmAg0LjQu9C4INC/0YDQvtGB0YLRi9C8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDQvtCx0YrQtdC60YLQvtC8LlxuICogQHBhcmFtICB7bW9kdWxlOlwidjYuanNcIi5BYnN0cmFjdFJlbmRlcmVyfSByZW5kZXJlciBgUmVuZGVyZXJHTGAg0LjQu9C4IGBSZW5kZXJlcjJEYCDQvdGD0LbQvdGLINC00LvRj1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0YPRgdGC0LDQvdC+0LLQutC4IF9zdHJva2VDb2xvciwgX2ZpbGxDb2xvci5cbiAqIEByZXR1cm4ge29iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIGB0YXJnZXRgLlxuICovXG5mdW5jdGlvbiBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzICggdGFyZ2V0LCByZW5kZXJlciApXG57XG5cbiAgY29weURyYXdpbmdTZXR0aW5ncyggdGFyZ2V0LCBkZWZhdWx0RHJhd2luZ1NldHRpbmdzICk7XG5cbiAgdGFyZ2V0Ll9zdHJva2VDb2xvciA9IG5ldyByZW5kZXJlci5zZXR0aW5ncy5jb2xvcigpO1xuICB0YXJnZXQuX2ZpbGxDb2xvciAgID0gbmV3IHJlbmRlcmVyLnNldHRpbmdzLmNvbG9yKCk7XG5cbiAgcmV0dXJuIHRhcmdldDtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3M7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb2xvciA9IHJlcXVpcmUoICcuLi9jb2xvci9SR0JBJyApO1xudmFyIHR5cGUgID0gcmVxdWlyZSggJy4uL2NvbnN0YW50cycgKS5nZXQoICcyRCcgKTtcblxuLyoqXG4gKiDQndCw0YHRgtGA0L7QudC60Lgg0LTQu9GPINGA0LXQvdC00LXRgNC10YDQvtCyOiB7QGxpbmsgdjYuUmVuZGVyZXIyRH0sIHtAbGluayB2Ni5SZW5kZXJlckdMfSwge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXJ9LCB7QGxpbmsgdjYuY3JlYXRlUmVuZGVyZXJ9LlxuICogQG5hbWVzcGFjZSB2Ni5zZXR0aW5ncy5yZW5kZXJlclxuICovXG5cbi8qKlxuICogQG1lbWJlciAgIHtvYmplY3R9IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5zZXR0aW5nc10g0J3QsNGB0YLRgNC+0LnQutC4INGA0LXQvdC00LXRgNC10YDQsCDQv9C+INGD0LzQvtC70YfQsNC90LjRji5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBbY29sb3I9e0BsaW5rIHY2LlJHQkF9XSAgICAgICAgINCa0L7QvdGB0YLRgNGD0LrRgtC+0YDRiyB7QGxpbmsgdjYuUkdCQX0g0LjQu9C4IHtAbGluayB2Ni5IU0xBfS5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2NhbGU9MV0gICAgICAgICAgICAgICAgICAgICAgINCf0LvQvtGC0L3QvtGB0YLRjCDQv9C40LrRgdC10LvQtdC5INGA0LXQvdC00LXRgNC10YDQsCwg0L3QsNC/0YDQuNC80LXRgDogYGRldmljZVBpeGVsUmF0aW9gLlxuICovXG5leHBvcnRzLnNldHRpbmdzID0ge1xuICBjb2xvcjogY29sb3IsXG4gIHNjYWxlOiAxXG59O1xuXG4vKipcbiAqINCf0L7QutCwINC90LUg0YHQtNC10LvQsNC90L4uXG4gKiBAbWVtYmVyIHtib29sZWFufSBbdjYuc2V0dGluZ3MucmVuZGVyZXIuYW50aWFsaWFzPXRydWVdXG4gKi9cbmV4cG9ydHMuYW50aWFsaWFzID0gdHJ1ZTtcblxuLyoqXG4gKiDQn9C+0LrQsCDQvdC1INGB0LTQtdC70LDQvdC+LlxuICogQG1lbWJlciB7Ym9vbGVhbn0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLmJsZW5kaW5nPXRydWVdXG4gKi9cbmV4cG9ydHMuYmxlbmRpbmcgPSB0cnVlO1xuXG4vKipcbiAqINCY0YHQv9C+0LvRjNC30L7QstCw0YLRjCDQs9GA0LDQtNGD0YHRiyDQstC80LXRgdGC0L4g0YDQsNC00LjQsNC90L7Qsi5cbiAqIEBtZW1iZXIge2Jvb2xlYW59IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5kZWdyZWVzPWZhbHNlXVxuICovXG5leHBvcnRzLmRlZ3JlZXMgPSBmYWxzZTtcblxuLyoqXG4gKiDQmNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0L/RgNC+0LfRgNCw0YfQvdGL0LkgKNCy0LzQtdGB0YLQviDRh9C10YDQvdC+0LPQvikg0LrQvtC90YLQtdC60YHRgi5cbiAqIEBtZW1iZXIge2Jvb2xlYW59IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5hbHBoYT10cnVlXVxuICovXG5leHBvcnRzLmFscGhhID0gdHJ1ZTtcblxuLyoqXG4gKiDQotC40L8g0LrQvtC90YLQtdC60YHRgtCwICgyRCwgR0wsIEFVVE8pLlxuICogQG1lbWJlciB7Y29uc3RhbnR9IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci50eXBlPTJEXVxuICovXG5leHBvcnRzLnR5cGUgPSB0eXBlO1xuXG4vKipcbiAqINCSINGN0YLQvtGCINGN0LvQtdC80LXQvdGCINCx0YPQtNC10YIg0LTQvtCx0LDQstC70LXQvSBgY2FudmFzYC5cbiAqIEBtZW1iZXIge0VsZW1lbnQ/fSBbdjYuc2V0dGluZ3MucmVuZGVyZXIuYXBwZW5kVG9dXG4gKi9cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbWVtYmVyIHY2LnNoYXBlcy5kcmF3TGluZXNcbiAqIEBleGFtcGxlXG4gKiBzaGFwZXMuZHJhd0xpbmVzKCByZW5kZXJlciwgdmVydGljZXMgKTtcbiAqL1xuZnVuY3Rpb24gZHJhd0xpbmVzICgpXG57XG4gIHRocm93IEVycm9yKCAnTm90IGltcGxlbWVudGVkJyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRyYXdMaW5lcztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbWVtYmVyIHY2LnNoYXBlcy5kcmF3UG9pbnRzXG4gKiBAZXhhbXBsZVxuICogc2hhcGVzLmRyYXdQb2ludHMoIHJlbmRlcmVyLCB2ZXJ0aWNlcyApO1xuICovXG5mdW5jdGlvbiBkcmF3UG9pbnRzICgpXG57XG4gIHRocm93IEVycm9yKCAnTm90IGltcGxlbWVudGVkJyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRyYXdQb2ludHM7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0JPQu9Cw0LLQvdGL0LUg0L3QsNGB0YLRgNC+0LnQutC4IFwidjYuanNcIi5cbiAqIEBuYW1lc3BhY2UgdjYuc2V0dGluZ3MuY29yZVxuICovXG5cbi8qKlxuICog0JjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMINCz0YDQsNC00YPRgdGLINCy0LzQtdGB0YLQviDRgNCw0LTQuNCw0L3QvtCyLlxuICogQG1lbWJlciB7Ym9vbGVhbn0gdjYuc2V0dGluZ3MuY29yZS5kZWdyZWVzXG4gKi9cbmV4cG9ydHMuZGVncmVzcyA9IGZhbHNlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVNoYWRlclNvdXJjZXNcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB2ZXJ0INCY0YHRhdC+0LTQvdC40Log0LLQtdGA0YjQuNC90L3QvtCz0L4gKHZlcnRleCkg0YjQtdC50LTQtdGA0LAuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZnJhZyDQmNGB0YXQvtC00L3QuNC6INGE0YDQsNCz0LzQtdC90YLQvdC+0LPQviAoZnJhZ21lbnQpINGI0LXQudC00LXRgNCwLlxuICovXG5cbi8qKlxuICogV2ViR0wg0YjQtdC50LTQtdGA0YsuXG4gKiBAbWVtYmVyIHtvYmplY3R9IHY2LnNoYWRlcnNcbiAqIEBwcm9wZXJ0eSB7SVNoYWRlclNvdXJjZXN9IGJhc2ljICAgICAg0KHRgtCw0L3QtNCw0YDRgtC90YvQtSDRiNC10LnQtNC10YDRiy5cbiAqIEBwcm9wZXJ0eSB7SVNoYWRlclNvdXJjZXN9IGJhY2tncm91bmQg0KjQtdC50LTQtdGA0Ysg0LTQu9GPINC+0YLRgNC40YHQvtCy0LrQuCDRhNC+0L3QsC5cbiAqL1xudmFyIHNoYWRlcnMgPSB7XG4gIGJhc2ljOiB7XG4gICAgdmVydDogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O2F0dHJpYnV0ZSB2ZWMyIGFwb3M7dW5pZm9ybSB2ZWMyIHVyZXM7dW5pZm9ybSBtYXQzIHV0cmFuc2Zvcm07dm9pZCBtYWluKCl7Z2xfUG9zaXRpb249dmVjNCgoKHV0cmFuc2Zvcm0qdmVjMyhhcG9zLDEuMCkpLnh5L3VyZXMqMi4wLTEuMCkqdmVjMigxLC0xKSwwLDEpO30nLFxuICAgIGZyYWc6ICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDt1bmlmb3JtIHZlYzQgdWNvbG9yO3ZvaWQgbWFpbigpe2dsX0ZyYWdDb2xvcj12ZWM0KHVjb2xvci5yZ2IvMjU1LjAsdWNvbG9yLmEpO30nXG4gIH0sXG5cbiAgYmFja2dyb3VuZDoge1xuICAgIHZlcnQ6ICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDthdHRyaWJ1dGUgdmVjMiBhcG9zO3ZvaWQgbWFpbigpe2dsX1Bvc2l0aW9uID0gdmVjNChhcG9zLDAsMSk7fScsXG4gICAgZnJhZzogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O3VuaWZvcm0gdmVjNCB1Y29sb3I7dm9pZCBtYWluKCl7Z2xfRnJhZ0NvbG9yPXVjb2xvcjt9J1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoYWRlcnM7XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNy0yMDE4IFZsYWRpc2xhdiBUaWtoaXkgKFNJTEVOVClcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBHUEwtMy4wIGxpY2Vuc2UuXG4gKiBodHRwczovL2dpdGh1Yi5jb20vdGlraGl5L3Y2LmpzL3RyZWUvZGV2L1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIHY2XG4gKi9cblxuZXhwb3J0cy5BYnN0cmFjdEltYWdlICAgID0gcmVxdWlyZSggJy4vY29yZS9pbWFnZS9BYnN0cmFjdEltYWdlJyApO1xuZXhwb3J0cy5BYnN0cmFjdFJlbmRlcmVyID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyJyApO1xuZXhwb3J0cy5BYnN0cmFjdFZlY3RvciAgID0gcmVxdWlyZSggJy4vY29yZS9tYXRoL0Fic3RyYWN0VmVjdG9yJyApO1xuZXhwb3J0cy5DYW1lcmEgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9jYW1lcmEvQ2FtZXJhJyApO1xuZXhwb3J0cy5Db21wb3VuZGVkSW1hZ2UgID0gcmVxdWlyZSggJy4vY29yZS9pbWFnZS9Db21wb3VuZGVkSW1hZ2UnICk7XG5leHBvcnRzLkhTTEEgICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2NvbG9yL0hTTEEnICk7XG5leHBvcnRzLkltYWdlICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2ltYWdlL0ltYWdlJyApO1xuZXhwb3J0cy5SR0JBICAgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9jb2xvci9SR0JBJyApO1xuZXhwb3J0cy5SZW5kZXJlcjJEICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9SZW5kZXJlcjJEJyApO1xuZXhwb3J0cy5SZW5kZXJlckdMICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9SZW5kZXJlckdMJyApO1xuZXhwb3J0cy5TaGFkZXJQcm9ncmFtICAgID0gcmVxdWlyZSggJy4vY29yZS9TaGFkZXJQcm9ncmFtJyApO1xuZXhwb3J0cy5UaWNrZXIgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9UaWNrZXInICk7XG5leHBvcnRzLlRyYW5zZm9ybSAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL1RyYW5zZm9ybScgKTtcbmV4cG9ydHMuVmVjdG9yMkQgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvbWF0aC9WZWN0b3IyRCcgKTtcbmV4cG9ydHMuVmVjdG9yM0QgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvbWF0aC9WZWN0b3IzRCcgKTtcbmV4cG9ydHMuY29uc3RhbnRzICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvY29uc3RhbnRzJyApO1xuZXhwb3J0cy5jcmVhdGVSZW5kZXJlciAgID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9jcmVhdGVfcmVuZGVyZXInICk7XG5leHBvcnRzLnNoYWRlcnMgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL3NoYWRlcnMnICk7XG5leHBvcnRzLm1hdDMgICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL21hdGgvbWF0MycgKTtcblxuLyoqXG4gKiBcInY2LmpzXCIgYnVpbHQtaW4gZHJhd2luZyBmdW5jdGlvbnMuXG4gKiBAbmFtZXNwYWNlIHY2LnNoYXBlc1xuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciN2ZXJ0ZXhcbiAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNlbmRTaGFwZVxuICogQGV4YW1wbGVcbiAqIHZhciBzaGFwZXMgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9zaGFwZXMnICk7XG4gKiBAZXhhbXBsZVxuICogcmVuZGVyZXIuYmVnaW5TaGFwZSgge1xuICogICBkcmF3RnVuY3Rpb246IHNoYXBlcy5kcmF3UG9pbnRzXG4gKiB9ICk7XG4gKi9cbmV4cG9ydHMuc2hhcGVzID0ge1xuICBkcmF3UG9pbnRzOiByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL3NoYXBlcy9kcmF3X3BvaW50cycgKSxcbiAgZHJhd0xpbmVzOiAgcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9zaGFwZXMvZHJhd19saW5lcycgKVxufTtcblxuLyoqXG4gKiDQndCw0YHRgtGA0L7QudC60LggXCJ2Ni5qc1wiLlxuICogQG5hbWVzcGFjZSB2Ni5zZXR0aW5nc1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q29yZSBTZXR0aW5nczwvY2FwdGlvbj5cbiAqIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3NldHRpbmdzJyApO1xuICogc2V0dGluZ3MuZGVncmVlcyA9IHRydWU7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5SZW5kZXJlciBTZXR0aW5nczwvY2FwdGlvbj5cbiAqIC8vIERlZmF1bHQgcmVuZGVyZXIgc2V0dGluZ3MuXG4gKiB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9zZXR0aW5ncycgKTtcbiAqIHNldHRpbmdzLmRlZ3JlZXMgPSB0cnVlO1xuICovXG5leHBvcnRzLnNldHRpbmdzID0ge1xuICByZW5kZXJlcjogcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9zZXR0aW5ncycgKSxcbiAgY2FtZXJhOiAgIHJlcXVpcmUoICcuL2NvcmUvY2FtZXJhL3NldHRpbmdzJyApLFxuICBjb3JlOiAgICAgcmVxdWlyZSggJy4vY29yZS9zZXR0aW5ncycgKVxufTtcblxuaWYgKCB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gIHNlbGYudjYgPSBleHBvcnRzO1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIHtzdHJpbmd8djYuSFNMQXx2Ni5SR0JBfSBUQ29sb3JcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkEgc3RyaW5nIChDU1MgY29sb3IpLjwvY2FwdGlvbj5cbiAqIHZhciBjb2xvciA9ICdyZ2JhKCAyNTUsIDAsIDI1NSwgMSApJztcbiAqIHZhciBjb2xvciA9ICdoc2woIDM2MCwgMTAwJSwgNTAlICknO1xuICogdmFyIGNvbG9yID0gJyNmZjAwZmYnO1xuICogdmFyIGNvbG9yID0gJ2xpZ2h0cGluayc7XG4gKiAvLyBcInJnYmEoMCwgMCwgMCwgMClcIlxuICogdmFyIGNvbG9yID0gZ2V0Q29tcHV0ZWRTdHlsZSggZG9jdW1lbnQuYm9keSApLmdldFByb3BlcnR5VmFsdWUoICdiYWNrZ3JvdW5kLWNvbG9yJyApO1xuICogLy8gVGhlIHNhbWUgYXMgXCJ0cmFuc3BhcmVudFwiLlxuICogLy8gTk9URTogQ1NTIGRvZXMgbm90IHN1cHBvcnQgdGhpcyBzeW50YXggYnV0IFwidjYuanNcIiBkb2VzLlxuICogdmFyIGNvbG9yID0gJyMwMDAwMDAwMCc7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5BbiBvYmplY3QgKHY2LlJHQkEsIHY2LkhTTEEpPC9jYXB0aW9uPlxuICogdmFyIGNvbG9yID0gbmV3IFJHQkEoIDI1NSwgMCwgMjU1LCAxICk7XG4gKiB2YXIgY29sb3IgPSBuZXcgSFNMQSggMzYwLCAxMDAsIDUwICk7XG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7bnVtYmVyfSBjb25zdGFudFxuICogQHNlZSB2Ni5jb25zdGFudHNcbiAqIEBleGFtcGxlXG4gKiAvLyBUaGlzIGlzIGEgY29uc3RhbnQuXG4gKiB2YXIgUkVOREVSRVJfVFlQRSA9IGNvbnN0YW50cy5nZXQoICdHTCcgKTtcbiAqL1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVZlY3RvcjJEXG4gKiBAcHJvcGVydHkge251bWJlcn0geFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHlcbiAqL1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEEgbGlnaHR3ZWlnaHQgaW1wbGVtZW50YXRpb24gb2YgTm9kZS5qcyBFdmVudEVtaXR0ZXIuXG4gKiBAY29uc3RydWN0b3IgTGlnaHRFbWl0dGVyXG4gKiBAZXhhbXBsZVxuICogdmFyIExpZ2h0RW1pdHRlciA9IHJlcXVpcmUoICdsaWdodF9lbWl0dGVyJyApO1xuICovXG5mdW5jdGlvbiBMaWdodEVtaXR0ZXIgKCkge31cblxuTGlnaHRFbWl0dGVyLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI2VtaXRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAgICogQHBhcmFtIHsuLi5hbnl9IFtkYXRhXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBlbWl0OiBmdW5jdGlvbiBlbWl0ICggdHlwZSApIHtcbiAgICB2YXIgbGlzdCA9IF9nZXRMaXN0KCB0aGlzLCB0eXBlICk7XG4gICAgdmFyIGRhdGEsIGksIGw7XG5cbiAgICBpZiAoICEgbGlzdCApIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA+IDEgKSB7XG4gICAgICBkYXRhID0gW10uc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICk7XG4gICAgfVxuXG4gICAgZm9yICggaSA9IDAsIGwgPSBsaXN0Lmxlbmd0aDsgaSA8IGw7ICsraSApIHtcbiAgICAgIGlmICggISBsaXN0WyBpIF0uYWN0aXZlICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCBsaXN0WyBpIF0ub25jZSApIHtcbiAgICAgICAgbGlzdFsgaSBdLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIGRhdGEgKSB7XG4gICAgICAgIGxpc3RbIGkgXS5saXN0ZW5lci5hcHBseSggdGhpcywgZGF0YSApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlzdFsgaSBdLmxpc3RlbmVyLmNhbGwoIHRoaXMgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBMaWdodEVtaXR0ZXIjb2ZmXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFt0eXBlXVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbbGlzdGVuZXJdXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9mZjogZnVuY3Rpb24gb2ZmICggdHlwZSwgbGlzdGVuZXIgKSB7XG4gICAgdmFyIGxpc3QsIGk7XG5cbiAgICBpZiAoICEgdHlwZSApIHtcbiAgICAgIHRoaXMuX2V2ZW50cyA9IG51bGw7XG4gICAgfSBlbHNlIGlmICggKCBsaXN0ID0gX2dldExpc3QoIHRoaXMsIHR5cGUgKSApICkge1xuICAgICAgaWYgKCBsaXN0ZW5lciApIHtcbiAgICAgICAgZm9yICggaSA9IGxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICAgICAgaWYgKCBsaXN0WyBpIF0ubGlzdGVuZXIgPT09IGxpc3RlbmVyICYmIGxpc3RbIGkgXS5hY3RpdmUgKSB7XG4gICAgICAgICAgICBsaXN0WyBpIF0uYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI29uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIHR5cGVcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXJcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb246IGZ1bmN0aW9uIG9uICggdHlwZSwgbGlzdGVuZXIgKSB7XG4gICAgX29uKCB0aGlzLCB0eXBlLCBsaXN0ZW5lciApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIExpZ2h0RW1pdHRlciNvbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIHR5cGVcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXJcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb25jZTogZnVuY3Rpb24gb25jZSAoIHR5cGUsIGxpc3RlbmVyICkge1xuICAgIF9vbiggdGhpcywgdHlwZSwgbGlzdGVuZXIsIHRydWUgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb25zdHJ1Y3RvcjogTGlnaHRFbWl0dGVyXG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIF9vblxuICogQHBhcmFtICB7TGlnaHRFbWl0dGVyfSBzZWxmXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgIHR5cGVcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSAgICAgbGlzdGVuZXJcbiAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgb25jZVxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gX29uICggc2VsZiwgdHlwZSwgbGlzdGVuZXIsIG9uY2UgKSB7XG4gIHZhciBlbnRpdHkgPSB7XG4gICAgbGlzdGVuZXI6IGxpc3RlbmVyLFxuICAgIGFjdGl2ZTogICB0cnVlLFxuICAgIHR5cGU6ICAgICB0eXBlLFxuICAgIG9uY2U6ICAgICBvbmNlXG4gIH07XG5cbiAgaWYgKCAhIHNlbGYuX2V2ZW50cyApIHtcbiAgICBzZWxmLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKCBudWxsICk7XG4gIH1cblxuICBpZiAoICEgc2VsZi5fZXZlbnRzWyB0eXBlIF0gKSB7XG4gICAgc2VsZi5fZXZlbnRzWyB0eXBlIF0gPSBbXTtcbiAgfVxuXG4gIHNlbGYuX2V2ZW50c1sgdHlwZSBdLnB1c2goIGVudGl0eSApO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIF9nZXRMaXN0XG4gKiBAcGFyYW0gIHtMaWdodEVtaXR0ZXJ9ICAgc2VsZlxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgIHR5cGVcbiAqIEByZXR1cm4ge2FycmF5PG9iamVjdD4/fVxuICovXG5mdW5jdGlvbiBfZ2V0TGlzdCAoIHNlbGYsIHR5cGUgKSB7XG4gIHJldHVybiBzZWxmLl9ldmVudHMgJiYgc2VsZi5fZXZlbnRzWyB0eXBlIF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGlnaHRFbWl0dGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF90aHJvd0FyZ3VtZW50RXhjZXB0aW9uICggdW5leHBlY3RlZCwgZXhwZWN0ZWQgKSB7XG4gIHRocm93IEVycm9yKCAnXCInICsgdG9TdHJpbmcuY2FsbCggdW5leHBlY3RlZCApICsgJ1wiIGlzIG5vdCAnICsgZXhwZWN0ZWQgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0eXBlID0gcmVxdWlyZSggJy4vdHlwZScgKTtcbnZhciBsYXN0UmVzID0gJ3VuZGVmaW5lZCc7XG52YXIgbGFzdFZhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfdHlwZSAoIHZhbCApIHtcbiAgaWYgKCB2YWwgPT09IGxhc3RWYWwgKSB7XG4gICAgcmV0dXJuIGxhc3RSZXM7XG4gIH1cblxuICByZXR1cm4gKCBsYXN0UmVzID0gdHlwZSggbGFzdFZhbCA9IHZhbCApICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF91bmVzY2FwZSAoIHN0cmluZyApIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKCAvXFxcXChcXFxcKT8vZywgJyQxJyApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzc2V0ID0gcmVxdWlyZSggJy4uL2lzc2V0JyApO1xuXG52YXIgdW5kZWZpbmVkOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG5cbnZhciBkZWZpbmVHZXR0ZXIgPSBPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lR2V0dGVyX18sXG4gICAgZGVmaW5lU2V0dGVyID0gT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZVNldHRlcl9fO1xuXG5mdW5jdGlvbiBiYXNlRGVmaW5lUHJvcGVydHkgKCBvYmplY3QsIGtleSwgZGVzY3JpcHRvciApIHtcbiAgdmFyIGhhc0dldHRlciA9IGlzc2V0KCAnZ2V0JywgZGVzY3JpcHRvciApLFxuICAgICAgaGFzU2V0dGVyID0gaXNzZXQoICdzZXQnLCBkZXNjcmlwdG9yICksXG4gICAgICBnZXQsIHNldDtcblxuICBpZiAoIGhhc0dldHRlciB8fCBoYXNTZXR0ZXIgKSB7XG4gICAgaWYgKCBoYXNHZXR0ZXIgJiYgdHlwZW9mICggZ2V0ID0gZGVzY3JpcHRvci5nZXQgKSAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ0dldHRlciBtdXN0IGJlIGEgZnVuY3Rpb246ICcgKyBnZXQgKTtcbiAgICB9XG5cbiAgICBpZiAoIGhhc1NldHRlciAmJiB0eXBlb2YgKCBzZXQgPSBkZXNjcmlwdG9yLnNldCApICE9PSAnZnVuY3Rpb24nICkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnU2V0dGVyIG11c3QgYmUgYSBmdW5jdGlvbjogJyArIHNldCApO1xuICAgIH1cblxuICAgIGlmICggaXNzZXQoICd3cml0YWJsZScsIGRlc2NyaXB0b3IgKSApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ0ludmFsaWQgcHJvcGVydHkgZGVzY3JpcHRvci4gQ2Fubm90IGJvdGggc3BlY2lmeSBhY2Nlc3NvcnMgYW5kIGEgdmFsdWUgb3Igd3JpdGFibGUgYXR0cmlidXRlJyApO1xuICAgIH1cblxuICAgIGlmICggZGVmaW5lR2V0dGVyICkge1xuICAgICAgaWYgKCBoYXNHZXR0ZXIgKSB7XG4gICAgICAgIGRlZmluZUdldHRlci5jYWxsKCBvYmplY3QsIGtleSwgZ2V0ICk7XG4gICAgICB9XG5cbiAgICAgIGlmICggaGFzU2V0dGVyICkge1xuICAgICAgICBkZWZpbmVTZXR0ZXIuY2FsbCggb2JqZWN0LCBrZXksIHNldCApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBkZWZpbmUgZ2V0dGVyIG9yIHNldHRlcicgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoIGlzc2V0KCAndmFsdWUnLCBkZXNjcmlwdG9yICkgKSB7XG4gICAgb2JqZWN0WyBrZXkgXSA9IGRlc2NyaXB0b3IudmFsdWU7XG4gIH0gZWxzZSBpZiAoICEgaXNzZXQoIGtleSwgb2JqZWN0ICkgKSB7XG4gICAgb2JqZWN0WyBrZXkgXSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiBvYmplY3Q7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZURlZmluZVByb3BlcnR5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VFeGVjICggcmVnZXhwLCBzdHJpbmcgKSB7XG4gIHZhciByZXN1bHQgPSBbXSxcbiAgICAgIHZhbHVlO1xuXG4gIHJlZ2V4cC5sYXN0SW5kZXggPSAwO1xuXG4gIHdoaWxlICggKCB2YWx1ZSA9IHJlZ2V4cC5leGVjKCBzdHJpbmcgKSApICkge1xuICAgIHJlc3VsdC5wdXNoKCB2YWx1ZSApO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYWxsSXRlcmF0ZWUgPSByZXF1aXJlKCAnLi4vY2FsbC1pdGVyYXRlZScgKSxcbiAgICBpc3NldCAgICAgICAgPSByZXF1aXJlKCAnLi4vaXNzZXQnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZUZvckVhY2ggKCBhcnIsIGZuLCBjdHgsIGZyb21SaWdodCApIHtcbiAgdmFyIGksIGosIGlkeDtcblxuICBmb3IgKCBpID0gLTEsIGogPSBhcnIubGVuZ3RoIC0gMTsgaiA+PSAwOyAtLWogKSB7XG4gICAgaWYgKCBmcm9tUmlnaHQgKSB7XG4gICAgICBpZHggPSBqO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZHggPSArK2k7XG4gICAgfVxuXG4gICAgaWYgKCBpc3NldCggaWR4LCBhcnIgKSAmJiBjYWxsSXRlcmF0ZWUoIGZuLCBjdHgsIGFyclsgaWR4IF0sIGlkeCwgYXJyICkgPT09IGZhbHNlICkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFycjtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYWxsSXRlcmF0ZWUgPSByZXF1aXJlKCAnLi4vY2FsbC1pdGVyYXRlZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlRm9ySW4gKCBvYmosIGZuLCBjdHgsIGZyb21SaWdodCwga2V5cyApIHtcbiAgdmFyIGksIGosIGtleTtcblxuICBmb3IgKCBpID0gLTEsIGogPSBrZXlzLmxlbmd0aCAtIDE7IGogPj0gMDsgLS1qICkge1xuICAgIGlmICggZnJvbVJpZ2h0ICkge1xuICAgICAga2V5ID0ga2V5c1sgaiBdO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXkgPSBrZXlzWyArK2kgXTtcbiAgICB9XG5cbiAgICBpZiAoIGNhbGxJdGVyYXRlZSggZm4sIGN0eCwgb2JqWyBrZXkgXSwga2V5LCBvYmogKSA9PT0gZmFsc2UgKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzc2V0ID0gcmVxdWlyZSggJy4uL2lzc2V0JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VHZXQgKCBvYmosIHBhdGgsIG9mZiApIHtcbiAgdmFyIGwgPSBwYXRoLmxlbmd0aCAtIG9mZixcbiAgICAgIGkgPSAwLFxuICAgICAga2V5O1xuXG4gIGZvciAoIDsgaSA8IGw7ICsraSApIHtcbiAgICBrZXkgPSBwYXRoWyBpIF07XG5cbiAgICBpZiAoIGlzc2V0KCBrZXksIG9iaiApICkge1xuICAgICAgb2JqID0gb2JqWyBrZXkgXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmFzZVRvSW5kZXggPSByZXF1aXJlKCAnLi9iYXNlLXRvLWluZGV4JyApO1xuXG52YXIgaW5kZXhPZiAgICAgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZixcbiAgICBsYXN0SW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZjtcblxuZnVuY3Rpb24gYmFzZUluZGV4T2YgKCBhcnIsIHNlYXJjaCwgZnJvbUluZGV4LCBmcm9tUmlnaHQgKSB7XG4gIHZhciBsLCBpLCBqLCBpZHgsIHZhbDtcblxuICAvLyB1c2UgdGhlIG5hdGl2ZSBmdW5jdGlvbiBpZiBpdCBpcyBzdXBwb3J0ZWQgYW5kIHRoZSBzZWFyY2ggaXMgbm90IG5hbi5cblxuICBpZiAoIHNlYXJjaCA9PT0gc2VhcmNoICYmICggaWR4ID0gZnJvbVJpZ2h0ID8gbGFzdEluZGV4T2YgOiBpbmRleE9mICkgKSB7XG4gICAgcmV0dXJuIGlkeC5jYWxsKCBhcnIsIHNlYXJjaCwgZnJvbUluZGV4ICk7XG4gIH1cblxuICBsID0gYXJyLmxlbmd0aDtcblxuICBpZiAoICEgbCApIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICBqID0gbCAtIDE7XG5cbiAgaWYgKCB0eXBlb2YgZnJvbUluZGV4ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICBmcm9tSW5kZXggPSBiYXNlVG9JbmRleCggZnJvbUluZGV4LCBsICk7XG5cbiAgICBpZiAoIGZyb21SaWdodCApIHtcbiAgICAgIGogPSBNYXRoLm1pbiggaiwgZnJvbUluZGV4ICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGogPSBNYXRoLm1heCggMCwgZnJvbUluZGV4ICk7XG4gICAgfVxuXG4gICAgaSA9IGogLSAxO1xuICB9IGVsc2Uge1xuICAgIGkgPSAtMTtcbiAgfVxuXG4gIGZvciAoIDsgaiA+PSAwOyAtLWogKSB7XG4gICAgaWYgKCBmcm9tUmlnaHQgKSB7XG4gICAgICBpZHggPSBqO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZHggPSArK2k7XG4gICAgfVxuXG4gICAgdmFsID0gYXJyWyBpZHggXTtcblxuICAgIGlmICggdmFsID09PSBzZWFyY2ggfHwgc2VhcmNoICE9PSBzZWFyY2ggJiYgdmFsICE9PSB2YWwgKSB7XG4gICAgICByZXR1cm4gaWR4O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlSW5kZXhPZjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJhc2VJbmRleE9mID0gcmVxdWlyZSggJy4vYmFzZS1pbmRleC1vZicgKTtcblxudmFyIHN1cHBvcnQgPSByZXF1aXJlKCAnLi4vc3VwcG9ydC9zdXBwb3J0LWtleXMnICk7XG5cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbnZhciBrLCBmaXhLZXlzO1xuXG5pZiAoIHN1cHBvcnQgPT09ICdub3Qtc3VwcG9ydGVkJyApIHtcbiAgayA9IFtcbiAgICAndG9TdHJpbmcnLFxuICAgICd0b0xvY2FsZVN0cmluZycsXG4gICAgJ3ZhbHVlT2YnLFxuICAgICdoYXNPd25Qcm9wZXJ0eScsXG4gICAgJ2lzUHJvdG90eXBlT2YnLFxuICAgICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsXG4gICAgJ2NvbnN0cnVjdG9yJ1xuICBdO1xuXG4gIGZpeEtleXMgPSBmdW5jdGlvbiBmaXhLZXlzICgga2V5cywgb2JqZWN0ICkge1xuICAgIHZhciBpLCBrZXk7XG5cbiAgICBmb3IgKCBpID0gay5sZW5ndGggLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgIGlmICggYmFzZUluZGV4T2YoIGtleXMsIGtleSA9IGtbIGkgXSApIDwgMCAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKCBvYmplY3QsIGtleSApICkge1xuICAgICAgICBrZXlzLnB1c2goIGtleSApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBrZXlzO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VLZXlzICggb2JqZWN0ICkge1xuICB2YXIga2V5cyA9IFtdO1xuXG4gIHZhciBrZXk7XG5cbiAgZm9yICgga2V5IGluIG9iamVjdCApIHtcbiAgICBpZiAoIGhhc093blByb3BlcnR5LmNhbGwoIG9iamVjdCwga2V5ICkgKSB7XG4gICAgICBrZXlzLnB1c2goIGtleSApO1xuICAgIH1cbiAgfVxuXG4gIGlmICggc3VwcG9ydCAhPT0gJ25vdC1zdXBwb3J0ZWQnICkge1xuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgcmV0dXJuIGZpeEtleXMoIGtleXMsIG9iamVjdCApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldCA9IHJlcXVpcmUoICcuL2Jhc2UtZ2V0JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VQcm9wZXJ0eSAoIG9iamVjdCwgcGF0aCApIHtcbiAgaWYgKCBvYmplY3QgIT0gbnVsbCApIHtcbiAgICBpZiAoIHBhdGgubGVuZ3RoID4gMSApIHtcbiAgICAgIHJldHVybiBnZXQoIG9iamVjdCwgcGF0aCwgMCApO1xuICAgIH1cblxuICAgIHJldHVybiBvYmplY3RbIHBhdGhbIDAgXSBdO1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VUb0luZGV4ICggdiwgbCApIHtcbiAgaWYgKCAhIGwgfHwgISB2ICkge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgaWYgKCB2IDwgMCApIHtcbiAgICB2ICs9IGw7XG4gIH1cblxuICByZXR1cm4gdiB8fCAwO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF90aHJvd0FyZ3VtZW50RXhjZXB0aW9uID0gcmVxdWlyZSggJy4vX3Rocm93LWFyZ3VtZW50LWV4Y2VwdGlvbicgKTtcbnZhciBkZWZhdWx0VG8gPSByZXF1aXJlKCAnLi9kZWZhdWx0LXRvJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJlZm9yZSAoIG4sIGZuICkge1xuICB2YXIgdmFsdWU7XG5cbiAgaWYgKCB0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicgKSB7XG4gICAgX3Rocm93QXJndW1lbnRFeGNlcHRpb24oIGZuLCAnYSBmdW5jdGlvbicgKTtcbiAgfVxuXG4gIG4gPSBkZWZhdWx0VG8oIG4sIDEgKTtcblxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGlmICggLS1uID49IDAgKSB7XG4gICAgICB2YWx1ZSA9IGZuLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNhbGxJdGVyYXRlZSAoIGZuLCBjdHgsIHZhbCwga2V5LCBvYmogKSB7XG4gIGlmICggdHlwZW9mIGN0eCA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgcmV0dXJuIGZuKCB2YWwsIGtleSwgb2JqICk7XG4gIH1cblxuICByZXR1cm4gZm4uY2FsbCggY3R4LCB2YWwsIGtleSwgb2JqICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmFzZUV4ZWMgID0gcmVxdWlyZSggJy4vYmFzZS9iYXNlLWV4ZWMnICksXG4gICAgX3VuZXNjYXBlID0gcmVxdWlyZSggJy4vX3VuZXNjYXBlJyApLFxuICAgIGlzS2V5ICAgICA9IHJlcXVpcmUoICcuL2lzLWtleScgKSxcbiAgICB0b0tleSAgICAgPSByZXF1aXJlKCAnLi90by1rZXknICksXG4gICAgX3R5cGUgICAgID0gcmVxdWlyZSggJy4vX3R5cGUnICk7XG5cbnZhciByUHJvcGVydHkgPSAvKF58XFwuKVxccyooW19hLXpdXFx3KilcXHMqfFxcW1xccyooKD86LSk/KD86XFxkK3xcXGQqXFwuXFxkKyl8KFwifCcpKChbXlxcXFxdXFxcXChcXFxcXFxcXCkqfFteXFw0XSkqKVxcNClcXHMqXFxdL2dpO1xuXG5mdW5jdGlvbiBzdHJpbmdUb1BhdGggKCBzdHIgKSB7XG4gIHZhciBwYXRoID0gYmFzZUV4ZWMoIHJQcm9wZXJ0eSwgc3RyICksXG4gICAgICBpID0gcGF0aC5sZW5ndGggLSAxLFxuICAgICAgdmFsO1xuXG4gIGZvciAoIDsgaSA+PSAwOyAtLWkgKSB7XG4gICAgdmFsID0gcGF0aFsgaSBdO1xuXG4gICAgLy8gLm5hbWVcbiAgICBpZiAoIHZhbFsgMiBdICkge1xuICAgICAgcGF0aFsgaSBdID0gdmFsWyAyIF07XG4gICAgLy8gWyBcIlwiIF0gfHwgWyAnJyBdXG4gICAgfSBlbHNlIGlmICggdmFsWyA1IF0gIT0gbnVsbCApIHtcbiAgICAgIHBhdGhbIGkgXSA9IF91bmVzY2FwZSggdmFsWyA1IF0gKTtcbiAgICAvLyBbIDAgXVxuICAgIH0gZWxzZSB7XG4gICAgICBwYXRoWyBpIF0gPSB2YWxbIDMgXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGF0aDtcbn1cblxuZnVuY3Rpb24gY2FzdFBhdGggKCB2YWwgKSB7XG4gIHZhciBwYXRoLCBsLCBpO1xuXG4gIGlmICggaXNLZXkoIHZhbCApICkge1xuICAgIHJldHVybiBbIHRvS2V5KCB2YWwgKSBdO1xuICB9XG5cbiAgaWYgKCBfdHlwZSggdmFsICkgPT09ICdhcnJheScgKSB7XG4gICAgcGF0aCA9IEFycmF5KCBsID0gdmFsLmxlbmd0aCApO1xuXG4gICAgZm9yICggaSA9IGwgLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgIHBhdGhbIGkgXSA9IHRvS2V5KCB2YWxbIGkgXSApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwYXRoID0gc3RyaW5nVG9QYXRoKCAnJyArIHZhbCApO1xuICB9XG5cbiAgcmV0dXJuIHBhdGg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2FzdFBhdGg7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xhbXAgKCB2YWx1ZSwgbG93ZXIsIHVwcGVyICkge1xuICBpZiAoIHZhbHVlID49IHVwcGVyICkge1xuICAgIHJldHVybiB1cHBlcjtcbiAgfVxuXG4gIGlmICggdmFsdWUgPD0gbG93ZXIgKSB7XG4gICAgcmV0dXJuIGxvd2VyO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNyZWF0ZSAgICAgICAgID0gcmVxdWlyZSggJy4vY3JlYXRlJyApLFxuICAgIGdldFByb3RvdHlwZU9mID0gcmVxdWlyZSggJy4vZ2V0LXByb3RvdHlwZS1vZicgKSxcbiAgICB0b09iamVjdCAgICAgICA9IHJlcXVpcmUoICcuL3RvLW9iamVjdCcgKSxcbiAgICBlYWNoICAgICAgICAgICA9IHJlcXVpcmUoICcuL2VhY2gnICksXG4gICAgaXNPYmplY3RMaWtlICAgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QtbGlrZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjbG9uZSAoIGRlZXAsIHRhcmdldCwgZ3VhcmQgKSB7XG4gIHZhciBjbG47XG5cbiAgaWYgKCB0eXBlb2YgdGFyZ2V0ID09PSAndW5kZWZpbmVkJyB8fCBndWFyZCApIHtcbiAgICB0YXJnZXQgPSBkZWVwO1xuICAgIGRlZXAgPSB0cnVlO1xuICB9XG5cbiAgY2xuID0gY3JlYXRlKCBnZXRQcm90b3R5cGVPZiggdGFyZ2V0ID0gdG9PYmplY3QoIHRhcmdldCApICkgKTtcblxuICBlYWNoKCB0YXJnZXQsIGZ1bmN0aW9uICggdmFsdWUsIGtleSwgdGFyZ2V0ICkge1xuICAgIGlmICggdmFsdWUgPT09IHRhcmdldCApIHtcbiAgICAgIHRoaXNbIGtleSBdID0gdGhpcztcbiAgICB9IGVsc2UgaWYgKCBkZWVwICYmIGlzT2JqZWN0TGlrZSggdmFsdWUgKSApIHtcbiAgICAgIHRoaXNbIGtleSBdID0gY2xvbmUoIGRlZXAsIHZhbHVlICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXNbIGtleSBdID0gdmFsdWU7XG4gICAgfVxuICB9LCBjbG4gKTtcblxuICByZXR1cm4gY2xuO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEVSUjoge1xuICAgIElOVkFMSURfQVJHUzogICAgICAgICAgJ0ludmFsaWQgYXJndW1lbnRzJyxcbiAgICBGVU5DVElPTl9FWFBFQ1RFRDogICAgICdFeHBlY3RlZCBhIGZ1bmN0aW9uJyxcbiAgICBTVFJJTkdfRVhQRUNURUQ6ICAgICAgICdFeHBlY3RlZCBhIHN0cmluZycsXG4gICAgVU5ERUZJTkVEX09SX05VTEw6ICAgICAnQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0JyxcbiAgICBSRURVQ0VfT0ZfRU1QVFlfQVJSQVk6ICdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJyxcbiAgICBOT19QQVRIOiAgICAgICAgICAgICAgICdObyBwYXRoIHdhcyBnaXZlbidcbiAgfSxcblxuICBNQVhfQVJSQVlfTEVOR1RIOiA0Mjk0OTY3Mjk1LFxuICBNQVhfU0FGRV9JTlQ6ICAgICA5MDA3MTk5MjU0NzQwOTkxLFxuICBNSU5fU0FGRV9JTlQ6ICAgIC05MDA3MTk5MjU0NzQwOTkxLFxuXG4gIERFRVA6ICAgICAgICAgMSxcbiAgREVFUF9LRUVQX0ZOOiAyLFxuXG4gIFBMQUNFSE9MREVSOiB7fVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmluZVByb3BlcnRpZXMgPSByZXF1aXJlKCAnLi9kZWZpbmUtcHJvcGVydGllcycgKTtcblxudmFyIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZSggJy4vc2V0LXByb3RvdHlwZS1vZicgKTtcblxudmFyIGlzUHJpbWl0aXZlID0gcmVxdWlyZSggJy4vaXMtcHJpbWl0aXZlJyApO1xuXG5mdW5jdGlvbiBDICgpIHt9XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiBjcmVhdGUgKCBwcm90b3R5cGUsIGRlc2NyaXB0b3JzICkge1xuICB2YXIgb2JqZWN0O1xuXG4gIGlmICggcHJvdG90eXBlICE9PSBudWxsICYmIGlzUHJpbWl0aXZlKCBwcm90b3R5cGUgKSApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoICdPYmplY3QgcHJvdG90eXBlIG1heSBvbmx5IGJlIGFuIE9iamVjdCBvciBudWxsOiAnICsgcHJvdG90eXBlICk7XG4gIH1cblxuICBDLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcblxuICBvYmplY3QgPSBuZXcgQygpO1xuXG4gIEMucHJvdG90eXBlID0gbnVsbDtcblxuICBpZiAoIHByb3RvdHlwZSA9PT0gbnVsbCApIHtcbiAgICBzZXRQcm90b3R5cGVPZiggb2JqZWN0LCBudWxsICk7XG4gIH1cblxuICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPj0gMiApIHtcbiAgICBkZWZpbmVQcm9wZXJ0aWVzKCBvYmplY3QsIGRlc2NyaXB0b3JzICk7XG4gIH1cblxuICByZXR1cm4gb2JqZWN0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJhc2VGb3JFYWNoICA9IHJlcXVpcmUoICcuLi9iYXNlL2Jhc2UtZm9yLWVhY2gnICksXG4gICAgYmFzZUZvckluICAgID0gcmVxdWlyZSggJy4uL2Jhc2UvYmFzZS1mb3ItaW4nICksXG4gICAgaXNBcnJheUxpa2UgID0gcmVxdWlyZSggJy4uL2lzLWFycmF5LWxpa2UnICksXG4gICAgdG9PYmplY3QgICAgID0gcmVxdWlyZSggJy4uL3RvLW9iamVjdCcgKSxcbiAgICBpdGVyYXRlZSAgICAgPSByZXF1aXJlKCAnLi4vaXRlcmF0ZWUnICkuaXRlcmF0ZWUsXG4gICAga2V5cyAgICAgICAgID0gcmVxdWlyZSggJy4uL2tleXMnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlRWFjaCAoIGZyb21SaWdodCApIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGVhY2ggKCBvYmosIGZuLCBjdHggKSB7XG5cbiAgICBvYmogPSB0b09iamVjdCggb2JqICk7XG5cbiAgICBmbiAgPSBpdGVyYXRlZSggZm4gKTtcblxuICAgIGlmICggaXNBcnJheUxpa2UoIG9iaiApICkge1xuICAgICAgcmV0dXJuIGJhc2VGb3JFYWNoKCBvYmosIGZuLCBjdHgsIGZyb21SaWdodCApO1xuICAgIH1cblxuICAgIHJldHVybiBiYXNlRm9ySW4oIG9iaiwgZm4sIGN0eCwgZnJvbVJpZ2h0LCBrZXlzKCBvYmogKSApO1xuXG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE11c3QgYmUgJ1dpZHRoJyBvciAnSGVpZ2h0JyAoY2FwaXRhbGl6ZWQpLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUdldEVsZW1lbnREaW1lbnNpb24gKCBuYW1lICkge1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1dpbmRvd3xOb2RlfSBlXG4gICAqL1xuICByZXR1cm4gZnVuY3Rpb24gKCBlICkge1xuXG4gICAgdmFyIHYsIGIsIGQ7XG5cbiAgICAvLyBpZiB0aGUgZWxlbWVudCBpcyBhIHdpbmRvd1xuXG4gICAgaWYgKCBlLndpbmRvdyA9PT0gZSApIHtcblxuICAgICAgLy8gaW5uZXJXaWR0aCBhbmQgaW5uZXJIZWlnaHQgaW5jbHVkZXMgYSBzY3JvbGxiYXIgd2lkdGgsIGJ1dCBpdCBpcyBub3RcbiAgICAgIC8vIHN1cHBvcnRlZCBieSBvbGRlciBicm93c2Vyc1xuXG4gICAgICB2ID0gTWF0aC5tYXgoIGVbICdpbm5lcicgKyBuYW1lIF0gfHwgMCwgZS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnRbICdjbGllbnQnICsgbmFtZSBdICk7XG5cbiAgICAvLyBpZiB0aGUgZWxlbWVudHMgaXMgYSBkb2N1bWVudFxuXG4gICAgfSBlbHNlIGlmICggZS5ub2RlVHlwZSA9PT0gOSApIHtcblxuICAgICAgYiA9IGUuYm9keTtcbiAgICAgIGQgPSBlLmRvY3VtZW50RWxlbWVudDtcblxuICAgICAgdiA9IE1hdGgubWF4KFxuICAgICAgICBiWyAnc2Nyb2xsJyArIG5hbWUgXSxcbiAgICAgICAgZFsgJ3Njcm9sbCcgKyBuYW1lIF0sXG4gICAgICAgIGJbICdvZmZzZXQnICsgbmFtZSBdLFxuICAgICAgICBkWyAnb2Zmc2V0JyArIG5hbWUgXSxcbiAgICAgICAgYlsgJ2NsaWVudCcgKyBuYW1lIF0sXG4gICAgICAgIGRbICdjbGllbnQnICsgbmFtZSBdICk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdiA9IGVbICdjbGllbnQnICsgbmFtZSBdO1xuICAgIH1cblxuICAgIHJldHVybiB2O1xuXG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2FzdFBhdGggPSByZXF1aXJlKCAnLi4vY2FzdC1wYXRoJyApLFxuICAgIG5vb3AgICAgID0gcmVxdWlyZSggJy4uL25vb3AnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlUHJvcGVydHkgKCBiYXNlUHJvcGVydHksIHVzZUFyZ3MgKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoIHBhdGggKSB7XG4gICAgdmFyIGFyZ3M7XG5cbiAgICBpZiAoICEgKCBwYXRoID0gY2FzdFBhdGgoIHBhdGggKSApLmxlbmd0aCApIHtcbiAgICAgIHJldHVybiBub29wO1xuICAgIH1cblxuICAgIGlmICggdXNlQXJncyApIHtcbiAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICggb2JqZWN0ICkge1xuICAgICAgcmV0dXJuIGJhc2VQcm9wZXJ0eSggb2JqZWN0LCBwYXRoLCBhcmdzICk7XG4gICAgfTtcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVmYXVsdFRvICggdmFsdWUsIGRlZmF1bHRWYWx1ZSApIHtcbiAgaWYgKCB2YWx1ZSAhPSBudWxsICYmIHZhbHVlID09PSB2YWx1ZSApIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gZGVmYXVsdFZhbHVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1peGluID0gcmVxdWlyZSggJy4vbWl4aW4nICksXG4gICAgY2xvbmUgPSByZXF1aXJlKCAnLi9jbG9uZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWZhdWx0cyAoIGRlZmF1bHRzLCBvYmplY3QgKSB7XG4gIGlmICggb2JqZWN0ID09IG51bGwgKSB7XG4gICAgcmV0dXJuIGNsb25lKCB0cnVlLCBkZWZhdWx0cyApO1xuICB9XG5cbiAgcmV0dXJuIG1peGluKCB0cnVlLCBjbG9uZSggdHJ1ZSwgZGVmYXVsdHMgKSwgb2JqZWN0ICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3VwcG9ydCA9IHJlcXVpcmUoICcuL3N1cHBvcnQvc3VwcG9ydC1kZWZpbmUtcHJvcGVydHknICk7XG5cbnZhciBkZWZpbmVQcm9wZXJ0aWVzLCBiYXNlRGVmaW5lUHJvcGVydHksIGlzUHJpbWl0aXZlLCBlYWNoO1xuXG5pZiAoIHN1cHBvcnQgIT09ICdmdWxsJyApIHtcbiAgaXNQcmltaXRpdmUgICAgICAgID0gcmVxdWlyZSggJy4vaXMtcHJpbWl0aXZlJyApO1xuICBlYWNoICAgICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9lYWNoJyApO1xuICBiYXNlRGVmaW5lUHJvcGVydHkgPSByZXF1aXJlKCAnLi9iYXNlL2Jhc2UtZGVmaW5lLXByb3BlcnR5JyApO1xuXG4gIGRlZmluZVByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzICggb2JqZWN0LCBkZXNjcmlwdG9ycyApIHtcbiAgICBpZiAoIHN1cHBvcnQgIT09ICdub3Qtc3VwcG9ydGVkJyApIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydGllcyggb2JqZWN0LCBkZXNjcmlwdG9ycyApO1xuICAgICAgfSBjYXRjaCAoIGUgKSB7fVxuICAgIH1cblxuICAgIGlmICggaXNQcmltaXRpdmUoIG9iamVjdCApICkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnZGVmaW5lUHJvcGVydGllcyBjYWxsZWQgb24gbm9uLW9iamVjdCcgKTtcbiAgICB9XG5cbiAgICBpZiAoIGlzUHJpbWl0aXZlKCBkZXNjcmlwdG9ycyApICkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnUHJvcGVydHkgZGVzY3JpcHRpb24gbXVzdCBiZSBhbiBvYmplY3Q6ICcgKyBkZXNjcmlwdG9ycyApO1xuICAgIH1cblxuICAgIGVhY2goIGRlc2NyaXB0b3JzLCBmdW5jdGlvbiAoIGRlc2NyaXB0b3IsIGtleSApIHtcbiAgICAgIGlmICggaXNQcmltaXRpdmUoIGRlc2NyaXB0b3IgKSApIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCAnUHJvcGVydHkgZGVzY3JpcHRpb24gbXVzdCBiZSBhbiBvYmplY3Q6ICcgKyBkZXNjcmlwdG9yICk7XG4gICAgICB9XG5cbiAgICAgIGJhc2VEZWZpbmVQcm9wZXJ0eSggdGhpcywga2V5LCBkZXNjcmlwdG9yICk7XG4gICAgfSwgb2JqZWN0ICk7XG5cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9O1xufSBlbHNlIHtcbiAgZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmluZVByb3BlcnRpZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSggJy4vY3JlYXRlL2NyZWF0ZS1lYWNoJyApKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSggJy4vY3JlYXRlL2NyZWF0ZS1nZXQtZWxlbWVudC1kaW1lbnNpb24nICkoICdIZWlnaHQnICk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSggJy4vY3JlYXRlL2NyZWF0ZS1nZXQtZWxlbWVudC1kaW1lbnNpb24nICkoICdXaWR0aCcgKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEVSUiA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5FUlI7XG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIGdldFByb3RvdHlwZU9mICggb2JqICkge1xuICB2YXIgcHJvdG90eXBlO1xuXG4gIGlmICggb2JqID09IG51bGwgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCBFUlIuVU5ERUZJTkVEX09SX05VTEwgKTtcbiAgfVxuXG4gIHByb3RvdHlwZSA9IG9iai5fX3Byb3RvX187IC8vIGpzaGludCBpZ25vcmU6IGxpbmVcblxuICBpZiAoIHR5cGVvZiBwcm90b3R5cGUgIT09ICd1bmRlZmluZWQnICkge1xuICAgIHJldHVybiBwcm90b3R5cGU7XG4gIH1cblxuICBpZiAoIHRvU3RyaW5nLmNhbGwoIG9iai5jb25zdHJ1Y3RvciApID09PSAnW29iamVjdCBGdW5jdGlvbl0nICkge1xuICAgIHJldHVybiBvYmouY29uc3RydWN0b3IucHJvdG90eXBlO1xuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QtbGlrZScgKSxcbiAgICBpc0xlbmd0aCAgICAgPSByZXF1aXJlKCAnLi9pcy1sZW5ndGgnICksXG4gICAgaXNXaW5kb3dMaWtlID0gcmVxdWlyZSggJy4vaXMtd2luZG93LWxpa2UnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBcnJheUxpa2VPYmplY3QgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSggdmFsdWUgKSAmJiBpc0xlbmd0aCggdmFsdWUubGVuZ3RoICkgJiYgISBpc1dpbmRvd0xpa2UoIHZhbHVlICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNMZW5ndGggICAgID0gcmVxdWlyZSggJy4vaXMtbGVuZ3RoJyApLFxuICAgIGlzV2luZG93TGlrZSA9IHJlcXVpcmUoICcuL2lzLXdpbmRvdy1saWtlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQXJyYXlMaWtlICggdmFsdWUgKSB7XG4gIGlmICggdmFsdWUgPT0gbnVsbCApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgKSB7XG4gICAgcmV0dXJuIGlzTGVuZ3RoKCB2YWx1ZS5sZW5ndGggKSAmJiAhaXNXaW5kb3dMaWtlKCB2YWx1ZSApO1xuICB9XG5cbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZyc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCAnLi9pcy1sZW5ndGgnICk7XG5cbnZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gaXNBcnJheSAoIHZhbHVlICkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKCB2YWx1ZSApICYmXG4gICAgaXNMZW5ndGgoIHZhbHVlLmxlbmd0aCApICYmXG4gICAgdG9TdHJpbmcuY2FsbCggdmFsdWUgKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfdHlwZSAgICA9IHJlcXVpcmUoICcuL190eXBlJyApO1xuXG52YXIgckRlZXBLZXkgPSAvKF58W15cXFxcXSkoXFxcXFxcXFwpKihcXC58XFxbKS87XG5cbmZ1bmN0aW9uIGlzS2V5ICggdmFsICkge1xuICB2YXIgdHlwZTtcblxuICBpZiAoICEgdmFsICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKCBfdHlwZSggdmFsICkgPT09ICdhcnJheScgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdHlwZSA9IHR5cGVvZiB2YWw7XG5cbiAgaWYgKCB0eXBlID09PSAnbnVtYmVyJyB8fCB0eXBlID09PSAnYm9vbGVhbicgfHwgX3R5cGUoIHZhbCApID09PSAnc3ltYm9sJyApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiAhIHJEZWVwS2V5LnRlc3QoIHZhbCApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzS2V5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTUFYX0FSUkFZX0xFTkdUSCA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5NQVhfQVJSQVlfTEVOR1RIO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzTGVuZ3RoICggdmFsdWUgKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmXG4gICAgdmFsdWUgPj0gMCAmJlxuICAgIHZhbHVlIDw9IE1BWF9BUlJBWV9MRU5HVEggJiZcbiAgICB2YWx1ZSAlIDEgPT09IDA7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzT2JqZWN0TGlrZSAoIHZhbHVlICkge1xuICByZXR1cm4gISEgdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QtbGlrZScgKTtcblxudmFyIHRvU3RyaW5nID0ge30udG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNPYmplY3QgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSggdmFsdWUgKSAmJlxuICAgIHRvU3RyaW5nLmNhbGwoIHZhbHVlICkgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFByb3RvdHlwZU9mID0gcmVxdWlyZSggJy4vZ2V0LXByb3RvdHlwZS1vZicgKTtcblxudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0JyApO1xuXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgdG9TdHJpbmcgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG5cbnZhciBPQkpFQ1QgPSB0b1N0cmluZy5jYWxsKCBPYmplY3QgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1BsYWluT2JqZWN0ICggdiApIHtcbiAgdmFyIHAsIGM7XG5cbiAgaWYgKCAhIGlzT2JqZWN0KCB2ICkgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcCA9IGdldFByb3RvdHlwZU9mKCB2ICk7XG5cbiAgaWYgKCBwID09PSBudWxsICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKCAhIGhhc093blByb3BlcnR5LmNhbGwoIHAsICdjb25zdHJ1Y3RvcicgKSApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjID0gcC5jb25zdHJ1Y3RvcjtcblxuICByZXR1cm4gdHlwZW9mIGMgPT09ICdmdW5jdGlvbicgJiYgdG9TdHJpbmcuY2FsbCggYyApID09PSBPQkpFQ1Q7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzUHJpbWl0aXZlICggdmFsdWUgKSB7XG4gIHJldHVybiAhIHZhbHVlIHx8XG4gICAgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyAmJlxuICAgIHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0eXBlID0gcmVxdWlyZSggJy4vdHlwZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1N5bWJvbCAoIHZhbHVlICkge1xuICByZXR1cm4gdHlwZSggdmFsdWUgKSA9PT0gJ3N5bWJvbCc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNXaW5kb3dMaWtlICggdmFsdWUgKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UoIHZhbHVlICkgJiYgdmFsdWUud2luZG93ID09PSB2YWx1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNzZXQgKCBrZXksIG9iaiApIHtcbiAgaWYgKCBvYmogPT0gbnVsbCApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHlwZW9mIG9ialsga2V5IF0gIT09ICd1bmRlZmluZWQnIHx8IGtleSBpbiBvYmo7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNBcnJheUxpa2VPYmplY3QgPSByZXF1aXJlKCAnLi9pcy1hcnJheS1saWtlLW9iamVjdCcgKSxcbiAgICBtYXRjaGVzUHJvcGVydHkgICA9IHJlcXVpcmUoICcuL21hdGNoZXMtcHJvcGVydHknICksXG4gICAgcHJvcGVydHkgICAgICAgICAgPSByZXF1aXJlKCAnLi9wcm9wZXJ0eScgKTtcblxuZXhwb3J0cy5pdGVyYXRlZSA9IGZ1bmN0aW9uIGl0ZXJhdGVlICggdmFsdWUgKSB7XG4gIGlmICggdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGlmICggaXNBcnJheUxpa2VPYmplY3QoIHZhbHVlICkgKSB7XG4gICAgcmV0dXJuIG1hdGNoZXNQcm9wZXJ0eSggdmFsdWUgKTtcbiAgfVxuXG4gIHJldHVybiBwcm9wZXJ0eSggdmFsdWUgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiYXNlS2V5cyA9IHJlcXVpcmUoICcuL2Jhc2UvYmFzZS1rZXlzJyApO1xudmFyIHRvT2JqZWN0ID0gcmVxdWlyZSggJy4vdG8tb2JqZWN0JyApO1xudmFyIHN1cHBvcnQgID0gcmVxdWlyZSggJy4vc3VwcG9ydC9zdXBwb3J0LWtleXMnICk7XG5cbmlmICggc3VwcG9ydCAhPT0gJ2VzMjAxNScgKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ga2V5cyAoIHYgKSB7XG4gICAgdmFyIF9rZXlzO1xuXG4gICAgLyoqXG4gICAgICogKyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICtcbiAgICAgKiB8IEkgdGVzdGVkIHRoZSBmdW5jdGlvbnMgd2l0aCBzdHJpbmdbMjA0OF0gKGFuIGFycmF5IG9mIHN0cmluZ3MpIGFuZCBoYWQgfFxuICAgICAqIHwgdGhpcyByZXN1bHRzIGluIG5vZGUuanMgKHY4LjEwLjApOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICogKyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICtcbiAgICAgKiB8IGJhc2VLZXlzIHggMTAsNjc0IG9wcy9zZWMgwrEwLjIzJSAoOTQgcnVucyBzYW1wbGVkKSAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAgKiB8IE9iamVjdC5rZXlzIHggMjIsMTQ3IG9wcy9zZWMgwrEwLjIzJSAoOTUgcnVucyBzYW1wbGVkKSAgICAgICAgICAgICAgICAgIHxcbiAgICAgKiB8IEZhc3Rlc3QgaXMgXCJPYmplY3Qua2V5c1wiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICogKyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICtcbiAgICAgKi9cblxuICAgIGlmICggc3VwcG9ydCA9PT0gJ2VzNScgKSB7XG4gICAgICBfa2V5cyA9IE9iamVjdC5rZXlzO1xuICAgIH0gZWxzZSB7XG4gICAgICBfa2V5cyA9IGJhc2VLZXlzO1xuICAgIH1cblxuICAgIHJldHVybiBfa2V5cyggdG9PYmplY3QoIHYgKSApO1xuICB9O1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBPYmplY3Qua2V5cztcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNhc3RQYXRoID0gcmVxdWlyZSggJy4vY2FzdC1wYXRoJyApLFxuICAgIGdldCAgICAgID0gcmVxdWlyZSggJy4vYmFzZS9iYXNlLWdldCcgKSxcbiAgICBFUlIgICAgICA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5FUlI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWF0Y2hlc1Byb3BlcnR5ICggcHJvcGVydHkgKSB7XG5cbiAgdmFyIHBhdGggID0gY2FzdFBhdGgoIHByb3BlcnR5WyAwIF0gKSxcbiAgICAgIHZhbHVlID0gcHJvcGVydHlbIDEgXTtcblxuICBpZiAoICEgcGF0aC5sZW5ndGggKSB7XG4gICAgdGhyb3cgRXJyb3IoIEVSUi5OT19QQVRIICk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKCBvYmplY3QgKSB7XG5cbiAgICBpZiAoIG9iamVjdCA9PSBudWxsICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICggcGF0aC5sZW5ndGggPiAxICkge1xuICAgICAgcmV0dXJuIGdldCggb2JqZWN0LCBwYXRoLCAwICkgPT09IHZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBvYmplY3RbIHBhdGhbIDAgXSBdID09PSB2YWx1ZTtcblxuICB9O1xuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNQbGFpbk9iamVjdCA9IHJlcXVpcmUoICcuL2lzLXBsYWluLW9iamVjdCcgKTtcblxudmFyIHRvT2JqZWN0ID0gcmVxdWlyZSggJy4vdG8tb2JqZWN0JyApO1xuXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoICcuL2lzLWFycmF5JyApO1xuXG52YXIga2V5cyA9IHJlcXVpcmUoICcuL2tleXMnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWl4aW4gKCBkZWVwLCBvYmplY3QgKSB7XG5cbiAgdmFyIGwgPSBhcmd1bWVudHMubGVuZ3RoO1xuXG4gIHZhciBpID0gMjtcblxuXG4gIHZhciBuYW1lcywgZXhwLCBqLCBrLCB2YWwsIGtleSwgbm93QXJyYXksIHNyYztcblxuICAvLyAgbWl4aW4oIHt9LCB7fSApXG5cbiAgaWYgKCB0eXBlb2YgZGVlcCAhPT0gJ2Jvb2xlYW4nICkge1xuICAgIG9iamVjdCA9IGRlZXA7XG4gICAgZGVlcCAgID0gdHJ1ZTtcbiAgICBpICAgICAgPSAxO1xuICB9XG5cbiAgLy8gdmFyIGV4dGVuZGFibGUgPSB7XG4gIC8vICAgZXh0ZW5kOiByZXF1aXJlKCAncGVha28vbWl4aW4nIClcbiAgLy8gfTtcblxuICAvLyBleHRlbmRhYmxlLmV4dGVuZCggeyBuYW1lOiAnRXh0ZW5kYWJsZSBPYmplY3QnIH0gKTtcblxuICBpZiAoIGkgPT09IGwgKSB7XG5cbiAgICBvYmplY3QgPSB0aGlzOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG5cbiAgICAtLWk7XG5cbiAgfVxuXG4gIG9iamVjdCA9IHRvT2JqZWN0KCBvYmplY3QgKTtcblxuICBmb3IgKCA7IGkgPCBsOyArK2kgKSB7XG4gICAgbmFtZXMgPSBrZXlzKCBleHAgPSB0b09iamVjdCggYXJndW1lbnRzWyBpIF0gKSApO1xuXG4gICAgZm9yICggaiA9IDAsIGsgPSBuYW1lcy5sZW5ndGg7IGogPCBrOyArK2ogKSB7XG4gICAgICB2YWwgPSBleHBbIGtleSA9IG5hbWVzWyBqIF0gXTtcblxuICAgICAgaWYgKCBkZWVwICYmIHZhbCAhPT0gZXhwICYmICggaXNQbGFpbk9iamVjdCggdmFsICkgfHwgKCBub3dBcnJheSA9IGlzQXJyYXkoIHZhbCApICkgKSApIHtcbiAgICAgICAgc3JjID0gb2JqZWN0WyBrZXkgXTtcblxuICAgICAgICBpZiAoIG5vd0FycmF5ICkge1xuICAgICAgICAgIGlmICggISBpc0FycmF5KCBzcmMgKSApIHtcbiAgICAgICAgICAgIHNyYyA9IFtdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG5vd0FycmF5ID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoICEgaXNQbGFpbk9iamVjdCggc3JjICkgKSB7XG4gICAgICAgICAgc3JjID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBvYmplY3RbIGtleSBdID0gbWl4aW4oIHRydWUsIHNyYywgdmFsICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvYmplY3RbIGtleSBdID0gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIG9iamVjdDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbm9vcCAoKSB7fTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbiBub3cgKCkge1xuICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmVmb3JlID0gcmVxdWlyZSggJy4vYmVmb3JlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG9uY2UgKCB0YXJnZXQgKSB7XG4gIHJldHVybiBiZWZvcmUoIDEsIHRhcmdldCApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCAnLi9jcmVhdGUvY3JlYXRlLXByb3BlcnR5JyApKCByZXF1aXJlKCAnLi9iYXNlL2Jhc2UtcHJvcGVydHknICkgKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzUHJpbWl0aXZlID0gcmVxdWlyZSggJy4vaXMtcHJpbWl0aXZlJyApLFxuICAgIEVSUiAgICAgICAgID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApLkVSUjtcblxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gc2V0UHJvdG90eXBlT2YgKCB0YXJnZXQsIHByb3RvdHlwZSApIHtcbiAgaWYgKCB0YXJnZXQgPT0gbnVsbCApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoIEVSUi5VTkRFRklORURfT1JfTlVMTCApO1xuICB9XG5cbiAgaWYgKCBwcm90b3R5cGUgIT09IG51bGwgJiYgaXNQcmltaXRpdmUoIHByb3RvdHlwZSApICkge1xuICAgIHRocm93IFR5cGVFcnJvciggJ09iamVjdCBwcm90b3R5cGUgbWF5IG9ubHkgYmUgYW4gT2JqZWN0IG9yIG51bGw6ICcgKyBwcm90b3R5cGUgKTtcbiAgfVxuXG4gIGlmICggJ19fcHJvdG9fXycgaW4gdGFyZ2V0ICkge1xuICAgIHRhcmdldC5fX3Byb3RvX18gPSBwcm90b3R5cGU7IC8vIGpzaGludCBpZ25vcmU6IGxpbmVcbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3VwcG9ydDtcblxuZnVuY3Rpb24gdGVzdCAoIHRhcmdldCApIHtcbiAgdHJ5IHtcbiAgICBpZiAoICcnIGluIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdGFyZ2V0LCAnJywge30gKSApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBjYXRjaCAoIGUgKSB7fVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuaWYgKCB0ZXN0KCB7fSApICkge1xuICBzdXBwb3J0ID0gJ2Z1bGwnO1xufSBlbHNlIGlmICggdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiB0ZXN0KCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc3BhbicgKSApICkge1xuICBzdXBwb3J0ID0gJ2RvbSc7XG59IGVsc2Uge1xuICBzdXBwb3J0ID0gJ25vdC1zdXBwb3J0ZWQnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdXBwb3J0O1xuXG5pZiAoIE9iamVjdC5rZXlzICkge1xuICB0cnkge1xuICAgIHN1cHBvcnQgPSBPYmplY3Qua2V5cyggJycgKSwgJ2VzMjAxNSc7IC8vIGpzaGludCBpZ25vcmU6IGxpbmVcbiAgfSBjYXRjaCAoIGUgKSB7XG4gICAgc3VwcG9ydCA9ICdlczUnO1xuICB9XG59IGVsc2UgaWYgKCB7IHRvU3RyaW5nOiBudWxsIH0ucHJvcGVydHlJc0VudW1lcmFibGUoICd0b1N0cmluZycgKSApIHtcbiAgc3VwcG9ydCA9ICdub3Qtc3VwcG9ydGVkJztcbn0gZWxzZSB7XG4gIHN1cHBvcnQgPSAnaGFzLWEtYnVnJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0O1xuIiwiLyoqXG4gKiBCYXNlZCBvbiBFcmlrIE3DtmxsZXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsOlxuICpcbiAqIEFkYXB0ZWQgZnJvbSBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9wYXVsaXJpc2gvMTU3OTY3MSB3aGljaCBkZXJpdmVkIGZyb21cbiAqIGh0dHA6Ly9wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4gKiBodHRwOi8vbXkub3BlcmEuY29tL2Vtb2xsZXIvYmxvZy8yMDExLzEyLzIwL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtZXItYW5pbWF0aW5nXG4gKlxuICogcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsIGJ5IEVyaWsgTcO2bGxlci5cbiAqIEZpeGVzIGZyb20gUGF1bCBJcmlzaCwgVGlubyBaaWpkZWwsIEFuZHJldyBNYW8sIEtsZW1lbiBTbGF2acSNLCBEYXJpdXMgQmFjb24uXG4gKlxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB0aW1lc3RhbXAgPSByZXF1aXJlKCAnLi90aW1lc3RhbXAnICk7XG5cbnZhciByZXF1ZXN0QUYsIGNhbmNlbEFGO1xuXG5pZiAoIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICkge1xuICBjYW5jZWxBRiA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRDYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96Q2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICByZXF1ZXN0QUYgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG59XG5cbnZhciBub1JlcXVlc3RBbmltYXRpb25GcmFtZSA9ICEgcmVxdWVzdEFGIHx8ICEgY2FuY2VsQUYgfHxcbiAgdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgL2lQKGFkfGhvbmV8b2QpLipPU1xcczYvLnRlc3QoIG5hdmlnYXRvci51c2VyQWdlbnQgKTtcblxuaWYgKCBub1JlcXVlc3RBbmltYXRpb25GcmFtZSApIHtcbiAgdmFyIGxhc3RSZXF1ZXN0VGltZSA9IDAsXG4gICAgICBmcmFtZUR1cmF0aW9uICAgPSAxMDAwIC8gNjA7XG5cbiAgZXhwb3J0cy5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdCAoIGFuaW1hdGUgKSB7XG4gICAgdmFyIG5vdyAgICAgICAgICAgICA9IHRpbWVzdGFtcCgpLFxuICAgICAgICBuZXh0UmVxdWVzdFRpbWUgPSBNYXRoLm1heCggbGFzdFJlcXVlc3RUaW1lICsgZnJhbWVEdXJhdGlvbiwgbm93ICk7XG5cbiAgICByZXR1cm4gc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgbGFzdFJlcXVlc3RUaW1lID0gbmV4dFJlcXVlc3RUaW1lO1xuICAgICAgYW5pbWF0ZSggbm93ICk7XG4gICAgfSwgbmV4dFJlcXVlc3RUaW1lIC0gbm93ICk7XG4gIH07XG5cbiAgZXhwb3J0cy5jYW5jZWwgPSBjbGVhclRpbWVvdXQ7XG59IGVsc2Uge1xuICBleHBvcnRzLnJlcXVlc3QgPSBmdW5jdGlvbiByZXF1ZXN0ICggYW5pbWF0ZSApIHtcbiAgICByZXR1cm4gcmVxdWVzdEFGKCBhbmltYXRlICk7XG4gIH07XG5cbiAgZXhwb3J0cy5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwgKCBpZCApIHtcbiAgICByZXR1cm4gY2FuY2VsQUYoIGlkICk7XG4gIH07XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBub3cgPSByZXF1aXJlKCAnLi9ub3cnICk7XG52YXIgbmF2aWdhdG9yU3RhcnQ7XG5cbmlmICggdHlwZW9mIHBlcmZvcm1hbmNlID09PSAndW5kZWZpbmVkJyB8fCAhIHBlcmZvcm1hbmNlLm5vdyApIHtcbiAgbmF2aWdhdG9yU3RhcnQgPSBub3coKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRpbWVzdGFtcCAoKSB7XG4gICAgcmV0dXJuIG5vdygpIC0gbmF2aWdhdG9yU3RhcnQ7XG4gIH07XG59IGVsc2Uge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRpbWVzdGFtcCAoKSB7XG4gICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpO1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3VuZXNjYXBlID0gcmVxdWlyZSggJy4vX3VuZXNjYXBlJyApLFxuICAgIGlzU3ltYm9sICA9IHJlcXVpcmUoICcuL2lzLXN5bWJvbCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b0tleSAoIHZhbCApIHtcbiAgdmFyIGtleTtcblxuICBpZiAoIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICkge1xuICAgIHJldHVybiBfdW5lc2NhcGUoIHZhbCApO1xuICB9XG5cbiAgaWYgKCBpc1N5bWJvbCggdmFsICkgKSB7XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuXG4gIGtleSA9ICcnICsgdmFsO1xuXG4gIGlmICgga2V5ID09PSAnMCcgJiYgMSAvIHZhbCA9PT0gLUluZmluaXR5ICkge1xuICAgIHJldHVybiAnLTAnO1xuICB9XG5cbiAgcmV0dXJuIF91bmVzY2FwZSgga2V5ICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRVJSID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApLkVSUjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b09iamVjdCAoIHZhbHVlICkge1xuICBpZiAoIHZhbHVlID09IG51bGwgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCBFUlIuVU5ERUZJTkVEX09SX05VTEwgKTtcbiAgfVxuXG4gIHJldHVybiBPYmplY3QoIHZhbHVlICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3JlYXRlID0gcmVxdWlyZSggJy4vY3JlYXRlJyApO1xuXG52YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZyxcbiAgICB0eXBlcyA9IGNyZWF0ZSggbnVsbCApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFR5cGUgKCB2YWx1ZSApIHtcbiAgdmFyIHR5cGUsIHRhZztcblxuICBpZiAoIHZhbHVlID09PSBudWxsICkge1xuICAgIHJldHVybiAnbnVsbCc7XG4gIH1cblxuICB0eXBlID0gdHlwZW9mIHZhbHVlO1xuXG4gIGlmICggdHlwZSAhPT0gJ29iamVjdCcgJiYgdHlwZSAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICByZXR1cm4gdHlwZTtcbiAgfVxuXG4gIHR5cGUgPSB0eXBlc1sgdGFnID0gdG9TdHJpbmcuY2FsbCggdmFsdWUgKSBdO1xuXG4gIGlmICggdHlwZSApIHtcbiAgICByZXR1cm4gdHlwZTtcbiAgfVxuXG4gIHJldHVybiAoIHR5cGVzWyB0YWcgXSA9IHRhZy5zbGljZSggOCwgLTEgKS50b0xvd2VyQ2FzZSgpICk7XG59O1xuIl19
