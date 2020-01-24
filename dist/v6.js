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
    var index;
    var info;

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

},{"./internal/create_program":17,"./internal/create_shader":18}],2:[function(require,module,exports){
'use strict';
var LightEmitter = require( 'light_emitter' );
var timestamp = require( 'peako/timestamp' );
var timer = require( 'peako/timer' );
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
    var elapsedTime;
    var frameTime;
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
    self.totalTime += elapsedTime;
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
  if ( isInvalidSetting( setting ) ) { throw Error( 'Got unknown setting key: ' + setting ); } /* eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len*/
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
  if ( isInvalidSetting( setting ) ) { throw Error( 'Got unknown setting key: ' + setting ); } /* eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len*/
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
function isInvalidSetting ( setting )
{
  return setting !== 'frame time' && setting !== 'FPS';
}
module.exports = Ticker;

},{"light_emitter":43,"peako/timer":65,"peako/timestamp":66}],3:[function(require,module,exports){
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

},{"./math/mat3":24}],4:[function(require,module,exports){
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
  var x;
  var y;
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
    var x;
    var y;
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

},{"./settings":5,"peako/defaults":49}],5:[function(require,module,exports){
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

},{"./RGBA":7,"./internal/parse":9,"peako/clamp":45}],7:[function(require,module,exports){
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
    var h;
    var s;

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
    var r;
    var g;
    var b;

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
  var r;
  var g;
  var b;
  var a;

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
   * @member {number} v6.Image#sx Source X.
   */

  /**
   * @member {number} v6.Image#sy Source Y.
   */

  /**
   * @member {number} v6.Image#sw Source Width.
   */

  /**
   * @member {number} v6.Image#sh Source Height.
   */

  /**
   * @member {number} v6.Image#dw Destination Width.
   */

  /**
   * @member {number} v6.Image#dh Destination Height.
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

},{"light_emitter":43}],12:[function(require,module,exports){
'use strict';

var AbstractImage = require( './AbstractImage' );

/**
 * @constructor v6.CompoundedImage
 * @extends v6.AbstractImage
 * @param {v6.AbstractImage} image v6.CompoundedImage or v6.Image.
 * @param {nubmer}           sx    Source X.
 * @param {nubmer}           sy    Source Y.
 * @param {nubmer}           sw    Source Width.
 * @param {nubmer}           sh    Source Height.
 * @param {nubmer}           dw    Destination Width.
 * @param {nubmer}           dh    Destination Height.
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

if ( typeof Float32Array === 'function' ) {
  module.exports = Float32Array; // eslint-disable-line no-undef
} else {
  module.exports = Array;
}

},{}],15:[function(require,module,exports){
'use strict';

/**
 * @private
 * @method createArray
 * @param  {Array.<any>}                    array
 * @return {Array.<any>|Float32Array.<any>}
 */

if ( typeof Float32Array === 'function' ) {
  module.exports = function createArray ( array )
  {
    return new Float32Array( array ); // eslint-disable-line no-undef
  };
} else {
  module.exports = function createArray ( array )
  {
    return array;
  };
}

},{}],16:[function(require,module,exports){
'use strict';

var _Float32Array = require( './_Float32Array' );

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

},{"./_Float32Array":14}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
'use strict';

/**
 * @private
 * @member {object} polygons
 */

},{}],20:[function(require,module,exports){
'use strict';

var noop = require( 'peako/noop' );

var reported;
var report;

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

},{"peako/noop":62}],21:[function(require,module,exports){
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
    var c;
    var s;

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

},{"../settings":40}],22:[function(require,module,exports){
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

},{"../settings":40,"./AbstractVector":21}],23:[function(require,module,exports){
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

},{"./AbstractVector":21}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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
    var drawFunction;
    var vertices;
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

},{"../constants":10,"../internal/create_polygon":16,"../internal/polygons":19,"./internal/close_shape":29,"./internal/copy_drawing_settings":30,"./internal/get_webgl":33,"./internal/process_rect_align":34,"./internal/process_shape":35,"./internal/set_default_drawing_settings":36,"./settings":37,"peako/get-element-h":50,"peako/get-element-w":51}],26:[function(require,module,exports){
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
  context.setTransform( 1, 0, 0, 1, 0, 0 );
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
  this.context.clearRect( 0, 0, this.w, this.h );
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

/**
 * @override
 * @method v6.Renderer2D#line
 */
Renderer2D.prototype.line = function line ( x1, y1, x2, y2 )
{
  if ( this._doStroke && this._lineWidth > 0 ) {
    this.context.moveTo( x1, y1 );
    this.context.lineTo( x2, y2 );
    this._stroke();
  }

  return this;
};

/**
 * @override
 * @method v6.Renderer2D#point
 */
Renderer2D.prototype.point = function point ( x, y )
{
  var w = this._lineWidth;

  if ( this._doStroke && w > 0 ) {
    this.context.beginPath();
    this.context.rect( x - w * 0.5, y - w * 0.5, w, w );
    this.context.fillStyle = this._strokeColor;
    this.context.fill();
  }

  return this;
};

/**
 * @private
 * @method v6.Renderer2D#_fill
 * @return {void}
 */
Renderer2D.prototype._fill = function _fill ()
{
  this.context.fillStyle = this._fillColor;
  this.context.fill();
};

/**
 * @private
 * @method v6.Renderer2D#_stroke
 * @return {void}
 */
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

},{"../constants":10,"./AbstractRenderer":25,"./internal/process_rect_align":34,"./settings":37,"peako/defaults":49}],27:[function(require,module,exports){
'use strict';

var defaults          = require( 'peako/defaults' );

var createArray       = require( '../internal/create_array' );

var ShaderProgram     = require( '../ShaderProgram' );
var Transform         = require( '../Transform' );
var constants         = require( '../constants' );
var shaders           = require( '../shaders' );

var processRectAlignX = require( './internal/process_rect_align' ).processRectAlignX;
var processRectAlignY = require( './internal/process_rect_align' ).processRectAlignY;

var AbstractRenderer  = require( './AbstractRenderer' );
var settings          = require( './settings' );

var rect = createArray( [
  0, 0,
  1, 0,
  1, 1,
  0, 1
] );

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

/**
 * @private
 * @method v6.RendererGL#_fill
 * @return {void}
 */
RendererGL.prototype._fill = function _fill ( count )
{
  if ( this._doFill ) {
    this.programs.default.setUniform( 'ucolor', this._fillColor.rgba() );
    this.context.drawArrays( this.context.TRIANGLE_FAN, 0, count );
  }
};

/**
 * @private
 * @method v6.RendererGL#_stroke
 * @return {void}
 */
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
 * @method v6.RendererGL#line
 */
RendererGL.prototype.line = function line ( x1, y1, x2, y2 )
{
  this.drawArrays( createArray( [
    x1, y1,
    x2, y2
  ] ), 2 );

  return this;
};

/**
 * @override
 * @method v6.RendererGL#point
 */
RendererGL.prototype.point = function point ( x, y )
{
  var hw = this._lineWidth * 0.5;
  var fc = this._fillColor;
  var df = this._doFill;
  var ds = this._doStroke;

  this._fillColor = this._strokeColor;
  this._doFill    = true;
  this._doStroke  = false;

  this.drawArrays( createArray( [
    x - hw, y - hw,
    x + hw, y - hw,
    x + hw, y + hw,
    x - hw, y + hw
  ] ), 4 );

  this._fillColor = fc;
  this._doFill    = df;
  this._doStroke  = ds;

  return this;
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

},{"../ShaderProgram":1,"../Transform":3,"../constants":10,"../internal/create_array":15,"../shaders":41,"./AbstractRenderer":25,"./internal/process_rect_align":34,"./settings":37,"peako/defaults":49}],28:[function(require,module,exports){
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

},{"../constants":10,"../internal/report":20,"./Renderer2D":26,"./RendererGL":27,"./internal/get_renderer_type":32,"./internal/get_webgl":33,"./settings":37}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
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

},{"../../constants":10}],32:[function(require,module,exports){
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
  var touchable;
  var safari;

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

},{"../../constants":10,"peako/once":63,"platform":"platform"}],33:[function(require,module,exports){
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

},{"peako/once":63}],34:[function(require,module,exports){
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

},{"../../constants":10}],35:[function(require,module,exports){
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

},{"../../constants":10}],36:[function(require,module,exports){
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

},{"./copy_drawing_settings":30,"./default_drawing_settings":31}],37:[function(require,module,exports){
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

},{"../color/RGBA":7,"../constants":10}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
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

},{"./core/ShaderProgram":1,"./core/Ticker":2,"./core/Transform":3,"./core/camera/Camera":4,"./core/camera/settings":5,"./core/color/HSLA":6,"./core/color/RGBA":7,"./core/constants":10,"./core/image/AbstractImage":11,"./core/image/CompoundedImage":12,"./core/image/Image":13,"./core/math/AbstractVector":21,"./core/math/Vector2D":22,"./core/math/Vector3D":23,"./core/math/mat3":24,"./core/renderer/AbstractRenderer":25,"./core/renderer/Renderer2D":26,"./core/renderer/RendererGL":27,"./core/renderer/create_renderer":28,"./core/renderer/settings":37,"./core/renderer/shapes/draw_lines":38,"./core/renderer/shapes/draw_points":39,"./core/settings":40,"./core/shaders":41}],43:[function(require,module,exports){
'use strict';

/**
 * A lightweight implementation of Node.js EventEmitter.
 * @constructor LightEmitter
 * @example
 * var LightEmitter = require( 'light_emitter' );
 * @example
 * var emitter = new LightEmitter();
 * @example
 * function Chat () {
 *   LightEmitter.call( this );
 * }
 * 
 * Chat.prototype = Object.create( LightEmitter.prototype );
 * Chat.prototype.constructor = Chat;
 */
function LightEmitter () {}

LightEmitter.prototype = {
  /**
   * @method LightEmitter#emit
   * @param  {string} type   A event name.
   * @param  {...any} [data] Arguments that should be passed to all handlers.
   * @return {boolean?} Returns `false` if any handler returned `false` too (stopped propagation).
   * @example
   * if ( chat.emit( 'message', 'Hello LightEmitter!' ) !== false ) {
   *   console.log( 'The message delivered successfully!' );
   * }
   */
  emit: function emit ( type ) {
    var list = _getList( this, type );
    var data, i, l, result;

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
        result = list[ i ].listener.apply( this, data );
      } else {
        result = list[ i ].listener.call( this );
      }

      if ( result === false ) {
        return false;
      }
    }
  },

  /**
   * @method LightEmitter#off
   * @param {string}   [type]     A event name.
   * @param {function} [listener] A event handler.
   * @chainable
   * @example
   * // Remove messageHandler.
   * emitter.off( 'message', messageHandler );
   * @example
   * // Remove all 'message' handlers.
   * emitter.off( 'message' );
   * @example
   * // Remove all handlers.
   * emitter.off();
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
   * @param {string}   type     A event name.
   * @param {function} listener A event handler.
   * @chainable
   */
  on: function on ( type, listener ) {
    _on( this, type, listener );
    return this;
  },

  /**
   * @method LightEmitter#once
   * @param {string}   type     A event name.
   * @param {function} listener A event handler.
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

},{}],44:[function(require,module,exports){
'use strict';

var _ArgumentException = require( './internal/ArgumentException' );
var defaultTo = require( './default-to' );

module.exports = function before ( n, fn ) {
  var value;

  if ( typeof fn !== 'function' ) {
    throw _ArgumentException( fn, 'a function' );
  }

  n = defaultTo( n, 1 );

  return function () {
    if ( --n >= 0 ) {
      value = fn.apply( this, arguments );
    }

    return value;
  };
};

},{"./default-to":48,"./internal/ArgumentException":53}],45:[function(require,module,exports){
'use strict';

/**
 * @method peako.clamp
 * @param  {number} value A number to be clamped.
 * @param  {number} lower Lower bound of the clamp.
 * @param  {number} upper Upper bound of the clamp.
 * @return {number}
 */
module.exports = function clamp ( value, lower, upper ) {
  if ( value >= upper ) {
    return upper;
  }

  if ( value <= lower ) {
    return lower;
  }

  return value;
};

},{}],46:[function(require,module,exports){
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
  DEEP_KEEP_FN: 2
};

},{}],47:[function(require,module,exports){
'use strict';

/**
 * @param {string} name Must be 'Width' or 'Height' (capitalized).
 */
module.exports = function createGetElementDimension ( name ) {
  /**
   * @param {Window|Node} e
   */
  return function ( e ) {
    var v;
    var b;
    var d;

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

},{}],48:[function(require,module,exports){
'use strict';

module.exports = function defaultTo ( value, defaultValue ) {
  if ( value !== null && typeof value !== 'undefined' && value === value ) {
    return value;
  }

  return defaultValue;
};

},{}],49:[function(require,module,exports){
'use strict';

var mixin = require( './mixin' );

function defaults ( defaults, object ) {
  if ( object ) {
    return mixin( {}, defaults, object );
  }

  return mixin( {}, defaults );
}

module.exports = defaults;

},{"./mixin":61}],50:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-get-element-dimension' )( 'Height' );

},{"./create/create-get-element-dimension":47}],51:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-get-element-dimension' )( 'Width' );

},{"./create/create-get-element-dimension":47}],52:[function(require,module,exports){
'use strict';

var ERR = require( './constants' ).ERR;

module.exports = Object.getPrototypeOf || function getPrototypeOf ( obj ) {
  var prototype;

  if ( obj === null || typeof obj === 'undefined' ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  prototype = obj.__proto__;

  if ( typeof prototype !== 'undefined' ) {
    return prototype;
  }

  if ( Object.prototype.toString.call( obj.constructor ) === '[object Function]' ) {
    return obj.constructor.prototype;
  }

  return obj;
};

},{"./constants":46}],53:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString;

module.exports = function _ArgumentException ( unexpected, expected ) {
  return Error( '"' + toString.call( unexpected ) + '" is not ' + expected );
};

},{}],54:[function(require,module,exports){
'use strict';

/**
 * @private
 * @method _memoize
 * @param  {function} function_
 * @return {function}
 */
module.exports = function _memoize ( function_ ) {
  var called = false;
  var lastResult;
  var lastValue;

  return function memoized ( value ) {
    switch ( false ) {
      case called:
        called = true;
        // falls through
      case value === lastValue:
        return ( lastResult = function_( ( lastValue = value ) ) );
    }

    return lastResult;
  };
};

},{}],55:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );
var isLength     = require( './is-length' );

module.exports = Array.isArray || function isArray ( value ) {
  return isObjectLike( value ) &&
    isLength( value.length ) &&
    Object.prototype.toString.call( value ) === '[object Array]';
};

},{"./is-length":56,"./is-object-like":57}],56:[function(require,module,exports){
'use strict';

var MAX_ARRAY_LENGTH = require( './constants' ).MAX_ARRAY_LENGTH;

module.exports = function isLength ( value ) {
  return typeof value === 'number' &&
    value >= 0 &&
    value <= MAX_ARRAY_LENGTH &&
    value % 1 === 0;
};

},{"./constants":46}],57:[function(require,module,exports){
'use strict';

module.exports = function isObjectLike ( value ) {
  return typeof value === 'object' && value !== null;
};

},{}],58:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );

var toString = {}.toString;

module.exports = function isObject ( value ) {
  return isObjectLike( value ) && toString.call( value ) === '[object Object]';
};

},{"./is-object-like":57}],59:[function(require,module,exports){
'use strict';

var getPrototypeOf = require( './get-prototype-of' );
var isObject       = require( './is-object' );

var hasOwnProperty = Object.prototype.hasOwnProperty;
var toString = Function.prototype.toString;
var OBJECT = toString.call( Object );

module.exports = function isPlainObject ( v ) {
  var p;
  var c;

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

},{"./get-prototype-of":52,"./is-object":58}],60:[function(require,module,exports){
'use strict';

var support  = require( './support/support-keys' );

var toObject = require( './to-object' );

if ( support !== 'es2015' ) {
  module.exports = function keys ( value ) {
    return Object.keys( toObject( value ) );
  };
} else {
  module.exports = Object.keys;
}

},{"./support/support-keys":64,"./to-object":67}],61:[function(require,module,exports){
'use strict';

var memoize       = require( './internal/memoize' );

var isPlainObject = require( './is-plain-object' );
var toObject      = require( './to-object' );
var keys          = require( './keys' );
var isArray       = memoize( require( './is-array' ) );

/**
 * @method peako.mixin
 * @param  {boolean}    [deep=true]
 * @param  {object}     target
 * @param  {...object?} object
 * @return {object}
 */
module.exports = function mixin ( deep, target ) {
  var argsLength = arguments.length;
  var i = 2;
  var object;
  var source;
  var value;
  var j;
  var l;
  var k;

  if ( typeof deep !== 'boolean' ) {
    target = deep;
    deep = true;
    i = 1;
  }

  target = toObject( target );

  for ( ; i < argsLength; ++i ) {
    object = arguments[ i ];

    if ( ! object ) {
      continue;
    }

    for ( k = keys( object ), j = 0, l = k.length; j < l; ++j ) {
      value = object[ k[ j ] ];

      if ( deep && isPlainObject( value ) || isArray( value ) ) {
        source = target[ k[ j ] ];

        if ( isArray( value ) ) {
          if ( ! isArray( source ) ) {
            source = [];
          }
        } else {
          if ( ! isPlainObject( source ) ) {
            source = {};
          }
        }

        target[ k[ j ] ] = mixin( true, source, value );
      } else {
        target[ k[ j ] ] = value;
      }
    }
  }

  return target;
};

},{"./internal/memoize":54,"./is-array":55,"./is-plain-object":59,"./keys":60,"./to-object":67}],62:[function(require,module,exports){
'use strict';

module.exports = function noop () {}; // eslint-disable-line brace-rules/brace-on-same-line

},{}],63:[function(require,module,exports){
'use strict';

var before = require( './before' );

module.exports = function once ( target ) {
  return before( 1, target );
};

},{"./before":44}],64:[function(require,module,exports){
'use strict';

try {
  module.exports = Object.keys( '' ), 'es2015'; // eslint-disable-line no-unused-expressions, no-sequences
} catch ( error ) {
  module.exports = 'es5';
}

},{}],65:[function(require,module,exports){
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

var requestAF;
var cancelAF;

if ( typeof self !== 'undefined' ) {
  cancelAF = self.cancelAnimationFrame ||
    self.webkitCancelAnimationFrame ||
    self.webkitCancelRequestAnimationFrame ||
    self.mozCancelAnimationFrame ||
    self.mozCancelRequestAnimationFrame;
  requestAF = self.requestAnimationFrame ||
    self.webkitRequestAnimationFrame ||
    self.mozRequestAnimationFrame;
}

var noRequestAnimationFrame = ! requestAF || ! cancelAF ||
  typeof navigator !== 'undefined' && /iP(ad|hone|od).*OS\s6/.test( navigator.userAgent );

if ( noRequestAnimationFrame ) {
  var lastRequestTime = 0;
  var frameDuration   = 1000 / 60;

  exports.request = function request ( animate ) {
    var now             = timestamp();
    var nextRequestTime = Math.max( lastRequestTime + frameDuration, now );

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

},{"./timestamp":66}],66:[function(require,module,exports){
'use strict';

var navigatorStart;

if ( typeof performance === 'undefined' || ! performance.now ) {
  navigatorStart = Date.now();

  module.exports = function timestamp () {
    return Date.now() - navigatorStart;
  };
} else {
  module.exports = function timestamp () {
    return performance.now();
  };
}

},{}],67:[function(require,module,exports){
'use strict';

var ERR = require( './constants' ).ERR;

module.exports = function toObject ( value ) {
  if ( value === null || typeof value === 'undefined' ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  return Object( value );
};

},{"./constants":46}]},{},[42])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb3JlL1NoYWRlclByb2dyYW0uanMiLCJjb3JlL1RpY2tlci5qcyIsImNvcmUvVHJhbnNmb3JtLmpzIiwiY29yZS9jYW1lcmEvQ2FtZXJhLmpzIiwiY29yZS9jYW1lcmEvc2V0dGluZ3MuanMiLCJjb3JlL2NvbG9yL0hTTEEuanMiLCJjb3JlL2NvbG9yL1JHQkEuanMiLCJjb3JlL2NvbG9yL2ludGVybmFsL2NvbG9ycy5qcyIsImNvcmUvY29sb3IvaW50ZXJuYWwvcGFyc2UuanMiLCJjb3JlL2NvbnN0YW50cy5qcyIsImNvcmUvaW1hZ2UvQWJzdHJhY3RJbWFnZS5qcyIsImNvcmUvaW1hZ2UvQ29tcG91bmRlZEltYWdlLmpzIiwiY29yZS9pbWFnZS9JbWFnZS5qcyIsImNvcmUvaW50ZXJuYWwvX0Zsb2F0MzJBcnJheS5qcyIsImNvcmUvaW50ZXJuYWwvY3JlYXRlX2FycmF5LmpzIiwiY29yZS9pbnRlcm5hbC9jcmVhdGVfcG9seWdvbi5qcyIsImNvcmUvaW50ZXJuYWwvY3JlYXRlX3Byb2dyYW0uanMiLCJjb3JlL2ludGVybmFsL2NyZWF0ZV9zaGFkZXIuanMiLCJjb3JlL2ludGVybmFsL3BvbHlnb25zLmpzIiwiY29yZS9pbnRlcm5hbC9yZXBvcnQuanMiLCJjb3JlL21hdGgvQWJzdHJhY3RWZWN0b3IuanMiLCJjb3JlL21hdGgvVmVjdG9yMkQuanMiLCJjb3JlL21hdGgvVmVjdG9yM0QuanMiLCJjb3JlL21hdGgvbWF0My5qcyIsImNvcmUvcmVuZGVyZXIvQWJzdHJhY3RSZW5kZXJlci5qcyIsImNvcmUvcmVuZGVyZXIvUmVuZGVyZXIyRC5qcyIsImNvcmUvcmVuZGVyZXIvUmVuZGVyZXJHTC5qcyIsImNvcmUvcmVuZGVyZXIvY3JlYXRlX3JlbmRlcmVyLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9jbG9zZV9zaGFwZS5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvY29weV9kcmF3aW5nX3NldHRpbmdzLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL2dldF9yZW5kZXJlcl90eXBlLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9nZXRfd2ViZ2wuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbi5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvcHJvY2Vzc19zaGFwZS5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvc2V0X2RlZmF1bHRfZHJhd2luZ19zZXR0aW5ncy5qcyIsImNvcmUvcmVuZGVyZXIvc2V0dGluZ3MuanMiLCJjb3JlL3JlbmRlcmVyL3NoYXBlcy9kcmF3X2xpbmVzLmpzIiwiY29yZS9yZW5kZXJlci9zaGFwZXMvZHJhd19wb2ludHMuanMiLCJjb3JlL3NldHRpbmdzLmpzIiwiY29yZS9zaGFkZXJzLmpzIiwiaW5kZXguanMiLCJub2RlX21vZHVsZXMvbGlnaHRfZW1pdHRlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iZWZvcmUuanMiLCJub2RlX21vZHVsZXMvcGVha28vY2xhbXAuanMiLCJub2RlX21vZHVsZXMvcGVha28vY29uc3RhbnRzLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NyZWF0ZS9jcmVhdGUtZ2V0LWVsZW1lbnQtZGltZW5zaW9uLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2RlZmF1bHQtdG8uanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmYXVsdHMuanMiLCJub2RlX21vZHVsZXMvcGVha28vZ2V0LWVsZW1lbnQtaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9nZXQtZWxlbWVudC13LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2dldC1wcm90b3R5cGUtb2YuanMiLCJub2RlX21vZHVsZXMvcGVha28vaW50ZXJuYWwvQXJndW1lbnRFeGNlcHRpb24uanMiLCJub2RlX21vZHVsZXMvcGVha28vaW50ZXJuYWwvbWVtb2l6ZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1sZW5ndGguanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LWxpa2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXBsYWluLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9rZXlzLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL21peGluLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL25vb3AuanMiLCJub2RlX21vZHVsZXMvcGVha28vb25jZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9zdXBwb3J0L3N1cHBvcnQta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lci5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lc3RhbXAuanMiLCJub2RlX21vZHVsZXMvcGVha28vdG8tb2JqZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9TQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2h1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVNoYWRlckF0dHJpYnV0ZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGxvY2F0aW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHNpemVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB0eXBlXG4gKiBAc2VlIFtnZXRBdHRyaWJMb2NhdGlvbl0oaHR0cHM6Ly9tZG4uaW8vZ2V0QXR0cmliTG9jYXRpb24pXG4gKiBAc2VlIFtXZWJHTEFjdGl2ZUluZm9dKGh0dHBzOi8vbWRuLmlvL1dlYkdMQWN0aXZlSW5mbylcbiAqL1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVNoYWRlclVuaWZvcm1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsb2NhdGlvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzaXplXG4gKiBAcHJvcGVydHkge251bWJlcn0gdHlwZVxuICogQHNlZSBbZ2V0QWN0aXZlVW5pZm9ybV0oaHR0cHM6Ly9tZG4uaW8vZ2V0QWN0aXZlVW5pZm9ybSlcbiAqIEBzZWUgW1dlYkdMQWN0aXZlSW5mb10oaHR0cHM6Ly9tZG4uaW8vV2ViR0xBY3RpdmVJbmZvKVxuICovXG5cbnZhciBjcmVhdGVQcm9ncmFtID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvY3JlYXRlX3Byb2dyYW0nICk7XG52YXIgY3JlYXRlU2hhZGVyICA9IHJlcXVpcmUoICcuL2ludGVybmFsL2NyZWF0ZV9zaGFkZXInICk7XG5cbi8qKlxuICog0JLRi9GB0L7QutC+0YPRgNC+0LLQvdC10LLRi9C5INC40L3RgtC10YDRhNC10LnRgSDQtNC70Y8gV2ViR0xQcm9ncmFtLlxuICogQGNvbnN0cnVjdG9yIHY2LlNoYWRlclByb2dyYW1cbiAqIEBwYXJhbSB7SVNoYWRlclNvdXJjZXN9ICAgICAgICBzb3VyY2VzINCo0LXQudC00LXRgNGLINC00LvRjyDQv9GA0L7Qs9GA0LDQvNC80YsuXG4gKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgICAgICBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICogQGV4YW1wbGUgPGNhcHRpb24+UmVxdWlyZSBcInY2LlNoYWRlclByb2dyYW1cIjwvY2FwdGlvbj5cbiAqIHZhciBTaGFkZXJQcm9ncmFtID0gcmVxdWlyZSggJ3Y2LmpzL1NoYWRlclByb2dyYW0nICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5Vc2Ugd2l0aG91dCByZW5kZXJlcjwvY2FwdGlvbj5cbiAqIC8vIFJlcXVpcmUgXCJ2Ni5qc1wiIHNoYWRlcnMuXG4gKiB2YXIgc2hhZGVycyA9IHJlcXVpcmUoICd2Ni5qcy9zaGFkZXJzJyApO1xuICogLy8gQ3JlYXRlIGEgcHJvZ3JhbS5cbiAqIHZhciBwcm9ncmFtID0gbmV3IFNoYWRlclByb2dyYW0oIHNoYWRlcnMuYmFzaWMsIGdsQ29udGV4dCApO1xuICovXG5mdW5jdGlvbiBTaGFkZXJQcm9ncmFtICggc291cmNlcywgZ2wgKVxue1xuICB2YXIgdmVydCA9IGNyZWF0ZVNoYWRlciggc291cmNlcy52ZXJ0LCBnbC5WRVJURVhfU0hBREVSLCBnbCApO1xuICB2YXIgZnJhZyA9IGNyZWF0ZVNoYWRlciggc291cmNlcy5mcmFnLCBnbC5GUkFHTUVOVF9TSEFERVIsIGdsICk7XG5cbiAgLyoqXG4gICAqIFdlYkdMINC/0YDQvtCz0YDQsNC80LzQsCDRgdC+0LfQtNCw0L3QvdCw0Y8g0YEg0L/QvtC80L7RidGM0Y4ge0BsaW5rIGNyZWF0ZVByb2dyYW19LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtXZWJHTFByb2dyYW19IHY2LlNoYWRlclByb2dyYW0jX3Byb2dyYW1cbiAgICovXG4gIHRoaXMuX3Byb2dyYW0gPSBjcmVhdGVQcm9ncmFtKCB2ZXJ0LCBmcmFnLCBnbCApO1xuXG4gIC8qKlxuICAgKiBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IHY2LlNoYWRlclByb2dyYW0jX2dsXG4gICAqL1xuICB0aGlzLl9nbCA9IGdsO1xuXG4gIC8qKlxuICAgKiDQmtC10YjQuNGA0L7QstCw0L3QvdGL0LUg0LDRgtGA0LjQsdGD0YLRiyDRiNC10LnQtNC10YDQvtCyLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LlNoYWRlclByb2dyYW0jX2F0dHJpYnV0ZXNcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKi9cbiAgdGhpcy5fYXR0cmlidXRlcyA9IHt9O1xuXG4gIC8qKlxuICAgKiDQmtC10YjQuNGA0L7QstCw0L3QvdGL0LUg0YTQvtGA0LzRiyAodW5pZm9ybXMpINGI0LXQudC00LXRgNC+0LIuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuU2hhZGVyUHJvZ3JhbSNfdW5pZm9ybXNcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldFVuaWZvcm1cbiAgICovXG4gIHRoaXMuX3VuaWZvcm1zID0ge307XG5cbiAgLyoqXG4gICAqINCY0L3QtNC10LrRgSDQv9C+0YHQu9C10LTQvdC10LPQviDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INCw0YLRgNC40LHRg9GC0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuU2hhZGVyUHJvZ3JhbSNfYXR0cmlidXRlSW5kZXhcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKi9cbiAgdGhpcy5fYXR0cmlidXRlSW5kZXggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKCB0aGlzLl9wcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUyApO1xuXG4gIC8qKlxuICAgKiDQmNC90LTQtdC60YEg0L/QvtGB0LvQtdC00L3QtdC5INC/0L7Qu9GD0YfQtdC90L3QvtC5INGE0L7RgNC80YsgKHVuaWZvcm0pLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlNoYWRlclByb2dyYW0jX3VuaWZvcm1JbmRleFxuICAgKiBAc2VlIHY2LlNoYWRlclByb2dyYW0jZ2V0VW5pZm9ybVxuICAgKi9cbiAgdGhpcy5fdW5pZm9ybUluZGV4ID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggdGhpcy5fcHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TICk7XG59XG5cblNoYWRlclByb2dyYW0ucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogQG1ldGhvZCB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICBuYW1lINCd0LDQt9Cy0LDQvdC40LUg0LDRgtGA0LjQsdGD0YLQsC5cbiAgICogQHJldHVybiB7SVNoYWRlckF0dHJpYnV0ZX0gICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQtNCw0L3QvdGL0LUg0L4g0LDRgtGA0LjQsdGD0YLQtS5cbiAgICogQGV4YW1wbGVcbiAgICogdmFyIGxvY2F0aW9uID0gcHJvZ3JhbS5nZXRBdHRyaWJ1dGUoICdhcG9zJyApLmxvY2F0aW9uO1xuICAgKi9cbiAgZ2V0QXR0cmlidXRlOiBmdW5jdGlvbiBnZXRBdHRyaWJ1dGUgKCBuYW1lIClcbiAge1xuICAgIHZhciBhdHRyID0gdGhpcy5fYXR0cmlidXRlc1sgbmFtZSBdO1xuICAgIHZhciBpbmZvO1xuXG4gICAgaWYgKCBhdHRyICkge1xuICAgICAgcmV0dXJuIGF0dHI7XG4gICAgfVxuXG4gICAgd2hpbGUgKCAtLXRoaXMuX2F0dHJpYnV0ZUluZGV4ID49IDAgKSB7XG4gICAgICBpbmZvID0gdGhpcy5fZ2wuZ2V0QWN0aXZlQXR0cmliKCB0aGlzLl9wcm9ncmFtLCB0aGlzLl9hdHRyaWJ1dGVJbmRleCApO1xuXG4gICAgICBhdHRyID0ge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5fZ2wuZ2V0QXR0cmliTG9jYXRpb24oIHRoaXMuX3Byb2dyYW0sIG5hbWUgKSxcbiAgICAgICAgbmFtZTogaW5mby5uYW1lLFxuICAgICAgICBzaXplOiBpbmZvLnNpemUsXG4gICAgICAgIHR5cGU6IGluZm8udHlwZVxuICAgICAgfTtcblxuICAgICAgdGhpcy5fYXR0cmlidXRlc1sgYXR0ci5uYW1lIF0gPSBhdHRyO1xuXG4gICAgICBpZiAoIGF0dHIubmFtZSA9PT0gbmFtZSApIHtcbiAgICAgICAgcmV0dXJuIGF0dHI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgUmVmZXJlbmNlRXJyb3IoICdObyBcIicgKyBuYW1lICsgJ1wiIGF0dHJpYnV0ZSBmb3VuZCcgKTtcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5TaGFkZXJQcm9ncmFtI2dldFVuaWZvcm1cbiAgICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgIG5hbWUg0J3QsNC30LLQsNC90LjQtSDRhNC+0YDQvNGLICh1bmlmb3JtKS5cbiAgICogQHJldHVybiB7SVNoYWRlclVuaWZvcm19ICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQsNC90L3Ri9C1INC+INGE0L7RgNC80LUgKHVuaWZvcm0pLlxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgbG9jYXRpb24gPSBwcm9ncmFtLmdldFVuaWZvcm0oICd1Y29sb3InICkubG9jYXRpb247XG4gICAqL1xuICBnZXRVbmlmb3JtOiBmdW5jdGlvbiBnZXRVbmlmb3JtICggbmFtZSApXG4gIHtcbiAgICB2YXIgdW5pZm9ybSA9IHRoaXMuX3VuaWZvcm1zWyBuYW1lIF07XG4gICAgdmFyIGluZGV4O1xuICAgIHZhciBpbmZvO1xuXG4gICAgaWYgKCB1bmlmb3JtICkge1xuICAgICAgcmV0dXJuIHVuaWZvcm07XG4gICAgfVxuXG4gICAgd2hpbGUgKCAtLXRoaXMuX3VuaWZvcm1JbmRleCA+PSAwICkge1xuICAgICAgaW5mbyA9IHRoaXMuX2dsLmdldEFjdGl2ZVVuaWZvcm0oIHRoaXMuX3Byb2dyYW0sIHRoaXMuX3VuaWZvcm1JbmRleCApO1xuXG4gICAgICB1bmlmb3JtID0ge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKCB0aGlzLl9wcm9ncmFtLCBpbmZvLm5hbWUgKSxcbiAgICAgICAgc2l6ZTogaW5mby5zaXplLFxuICAgICAgICB0eXBlOiBpbmZvLnR5cGVcbiAgICAgIH07XG5cbiAgICAgIGlmICggaW5mby5zaXplID4gMSAmJiB+ICggaW5kZXggPSBpbmZvLm5hbWUuaW5kZXhPZiggJ1snICkgKSApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZS5zbGljZSggMCwgaW5kZXggKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fdW5pZm9ybXNbIHVuaWZvcm0ubmFtZSBdID0gdW5pZm9ybTtcblxuICAgICAgaWYgKCB1bmlmb3JtLm5hbWUgPT09IG5hbWUgKSB7XG4gICAgICAgIHJldHVybiB1bmlmb3JtO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IFJlZmVyZW5jZUVycm9yKCAnTm8gXCInICsgbmFtZSArICdcIiB1bmlmb3JtIGZvdW5kJyApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jc2V0QXR0cmlidXRlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSBbV2ViR0xSZW5kZXJpbmdDb250ZXh0I2VuYWJsZVZlcnRleEF0dHJpYkFycmF5XShodHRwczovL21kbi5pby9lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSlcbiAgICogQHNlZSBbV2ViR0xSZW5kZXJpbmdDb250ZXh0I3ZlcnRleEF0dHJpYlBvaW50ZXJdKGh0dHBzOi8vbWRuLmlvL3ZlcnRleEF0dHJpYlBvaW50ZXIpXG4gICAqIEBleGFtcGxlXG4gICAqIHByb2dyYW0uc2V0QXR0cmlidXRlKCAnYXBvcycsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCApO1xuICAgKi9cbiAgc2V0QXR0cmlidXRlOiBmdW5jdGlvbiBzZXRBdHRyaWJ1dGUgKCBuYW1lLCBzaXplLCB0eXBlLCBub3JtYWxpemVkLCBzdHJpZGUsIG9mZnNldCApXG4gIHtcbiAgICB2YXIgbG9jYXRpb24gPSB0aGlzLmdldEF0dHJpYnV0ZSggbmFtZSApLmxvY2F0aW9uO1xuICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KCBsb2NhdGlvbiApO1xuICAgIHRoaXMuX2dsLnZlcnRleEF0dHJpYlBvaW50ZXIoIGxvY2F0aW9uLCBzaXplLCB0eXBlLCBub3JtYWxpemVkLCBzdHJpZGUsIG9mZnNldCApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jc2V0VW5pZm9ybVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWUgINCd0LDQt9Cy0LDQvdC40LUg0YTQvtGA0LzRiyAodW5pZm9ybSkuXG4gICAqIEBwYXJhbSAge2FueX0gICAgdmFsdWUg0J3QvtCy0L7QtSDQt9C90LDRh9C10L3QuNC1INGE0L7RgNC80YsgKHVuaWZvcm0pLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIHByb2dyYW0uc2V0VW5pZm9ybSggJ3Vjb2xvcicsIFsgMjU1LCAwLCAwLCAxIF0gKTtcbiAgICovXG4gIHNldFVuaWZvcm06IGZ1bmN0aW9uIHNldFVuaWZvcm0gKCBuYW1lLCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgdW5pZm9ybSA9IHRoaXMuZ2V0VW5pZm9ybSggbmFtZSApO1xuICAgIHZhciBfZ2wgICAgID0gdGhpcy5fZ2w7XG5cbiAgICBzd2l0Y2ggKCB1bmlmb3JtLnR5cGUgKSB7XG4gICAgICBjYXNlIF9nbC5CT09MOlxuICAgICAgY2FzZSBfZ2wuSU5UOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xaXYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xaSggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xZnYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUX01BVDI6XG4gICAgICAgIF9nbC51bmlmb3JtTWF0cml4MmZ2KCB1bmlmb3JtLmxvY2F0aW9uLCBmYWxzZSwgdmFsdWUgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIF9nbC5GTE9BVF9NQVQzOlxuICAgICAgICBfZ2wudW5pZm9ybU1hdHJpeDNmdiggdW5pZm9ybS5sb2NhdGlvbiwgZmFsc2UsIHZhbHVlICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfZ2wuRkxPQVRfTUFUNDpcbiAgICAgICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoIHVuaWZvcm0ubG9jYXRpb24sIGZhbHNlLCB2YWx1ZSApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUX1ZFQzI6XG4gICAgICAgIGlmICggdW5pZm9ybS5zaXplID4gMSApIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTJmdiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTJmKCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZVsgMCBdLCB2YWx1ZVsgMSBdICk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIF9nbC5GTE9BVF9WRUMzOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0zZnYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0zZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWVbIDAgXSwgdmFsdWVbIDEgXSwgdmFsdWVbIDIgXSApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfZ2wuRkxPQVRfVkVDNDpcbiAgICAgICAgaWYgKCB1bmlmb3JtLnNpemUgPiAxICkge1xuICAgICAgICAgIF9nbC51bmlmb3JtNGZ2KCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9nbC51bmlmb3JtNGYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlWyAwIF0sIHZhbHVlWyAxIF0sIHZhbHVlWyAyIF0sIHZhbHVlWyAzIF0gKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IFR5cGVFcnJvciggJ1RoZSB1bmlmb3JtIHR5cGUgaXMgbm90IHN1cHBvcnRlZCAoXCInICsgbmFtZSArICdcIiknICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuU2hhZGVyUHJvZ3JhbSN1c2VcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIFtXZWJHTFJlbmRlcmluZ0NvbnRleHQjdXNlUHJvZ3JhbV0oaHR0cHM6Ly9tZG4uaW8vdXNlUHJvZ3JhbSlcbiAgICogQGV4YW1wbGVcbiAgICogcHJvZ3JhbS51c2UoKTtcbiAgICovXG4gIHVzZTogZnVuY3Rpb24gdXNlICgpXG4gIHtcbiAgICB0aGlzLl9nbC51c2VQcm9ncmFtKCB0aGlzLl9wcm9ncmFtICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IFNoYWRlclByb2dyYW1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2hhZGVyUHJvZ3JhbTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBMaWdodEVtaXR0ZXIgPSByZXF1aXJlKCAnbGlnaHRfZW1pdHRlcicgKTtcbnZhciB0aW1lc3RhbXAgPSByZXF1aXJlKCAncGVha28vdGltZXN0YW1wJyApO1xudmFyIHRpbWVyID0gcmVxdWlyZSggJ3BlYWtvL3RpbWVyJyApO1xuLyoqXG4gKiDQrdGC0L7RgiDQutC70LDRgdGBINC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0LfQsNGG0LjQutC70LjQstCw0L3QuNGPINCw0L3QuNC80LDRhtC40Lgg0LLQvNC10YHRgtC+IGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLlxuICogQGNvbnN0cnVjdG9yIHY2LlRpY2tlclxuICogQGV4dGVuZHMge0xpZ2h0RW1pdHRlcn1cbiAqIEBmaXJlcyB1cGRhdGVcbiAqIEBmaXJlcyByZW5kZXJcbiAqIEBleGFtcGxlXG4gKiB2YXIgVGlja2VyID0gcmVxdWlyZSggJ3Y2LmpzL1RpY2tlcicgKTtcbiAqIHZhciB0aWNrZXIgPSBuZXcgVGlja2VyKCk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5cInVwZGF0ZVwiIGV2ZW50LjwvY2FwdGlvbj5cbiAqIC8vIEZpcmVzIGV2ZXJ5dGltZSBhbiBhcHBsaWNhdGlvbiBzaG91bGQgYmUgdXBkYXRlZC5cbiAqIC8vIERlcGVuZHMgb24gbWF4aW11bSBGUFMuXG4gKiB0aWNrZXIub24oICd1cGRhdGUnLCBmdW5jdGlvbiAoIGVsYXBzZWRUaW1lICkge1xuICogICBzaGFwZS5yb3RhdGlvbiArPSAxMCAqIGVsYXBzZWRUaW1lO1xuICogfSApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+XCJyZW5kZXJcIiBldmVudC48L2NhcHRpb24+XG4gKiAvLyBGaXJlcyBldmVyeXRpbWUgYW4gYXBwbGljYXRpb24gc2hvdWxkIGJlIHJlbmRlcmVkLlxuICogLy8gVW5saWtlIFwidXBkYXRlXCIsIGluZGVwZW5kZW50IGZyb20gbWF4aW11bSBGUFMuXG4gKiB0aWNrZXIub24oICdyZW5kZXInLCBmdW5jdGlvbiAoKSB7XG4gKiAgIHJlbmRlcmVyLnJvdGF0ZSggc2hhcGUucm90YXRpb24gKTtcbiAqIH0gKTtcbiAqL1xuZnVuY3Rpb24gVGlja2VyICgpXG57XG4gIHZhciBzZWxmID0gdGhpcztcbiAgTGlnaHRFbWl0dGVyLmNhbGwoIHRoaXMgKTtcbiAgdGhpcy5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSAwO1xuICB0aGlzLmxhc3RSZXF1ZXN0VGltZSA9IDA7XG4gIHRoaXMuc2tpcHBlZFRpbWUgPSAwO1xuICB0aGlzLnRvdGFsVGltZSA9IDA7XG4gIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICB0aGlzLnNldHRpbmdzID0ge307XG4gIC8qKlxuICAgKiDQl9Cw0L/Rg9GB0LrQsNC10YIg0YbQuNC60Lsg0LDQvdC40LzQsNGG0LjQuC5cbiAgICogQG1ldGhvZCB2Ni5UaWNrZXIjc3RhcnRcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiB0aWNrZXIuc3RhcnQoKTtcbiAgICovXG4gIGZ1bmN0aW9uIHN0YXJ0ICggX25vdyApXG4gIHtcbiAgICB2YXIgZWxhcHNlZFRpbWU7XG4gICAgdmFyIGZyYW1lVGltZTtcbiAgICBpZiAoICEgc2VsZi5ydW5uaW5nICkge1xuICAgICAgaWYgKCAhIF9ub3cgKSB7XG4gICAgICAgIHNlbGYubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlEID0gdGltZXIucmVxdWVzdCggc3RhcnQgKTtcbiAgICAgICAgc2VsZi5sYXN0UmVxdWVzdFRpbWUgPSB0aW1lc3RhbXAoKTtcbiAgICAgICAgc2VsZi5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWludmFsaWQtdGhpc1xuICAgIH1cbiAgICBpZiAoICEgX25vdyApIHtcbiAgICAgIHJldHVybiB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWludmFsaWQtdGhpc1xuICAgIH1cbiAgICBlbGFwc2VkVGltZSA9IE1hdGgubWluKCAxLCAoIF9ub3cgLSBzZWxmLmxhc3RSZXF1ZXN0VGltZSApICogMC4wMDEgKTtcbiAgICBzZWxmLnNraXBwZWRUaW1lICs9IGVsYXBzZWRUaW1lO1xuICAgIHNlbGYudG90YWxUaW1lICs9IGVsYXBzZWRUaW1lO1xuICAgIGZyYW1lVGltZSA9IHNlbGYuc2V0dGluZ3NbICdmcmFtZSB0aW1lJyBdO1xuICAgIHdoaWxlICggc2VsZi5za2lwcGVkVGltZSA+PSBmcmFtZVRpbWUgJiYgc2VsZi5ydW5uaW5nICkge1xuICAgICAgc2VsZi5za2lwcGVkVGltZSAtPSBmcmFtZVRpbWU7XG4gICAgICBzZWxmLmVtaXQoICd1cGRhdGUnLCBmcmFtZVRpbWUsIF9ub3cgKTtcbiAgICB9XG4gICAgc2VsZi5lbWl0KCAncmVuZGVyJywgZWxhcHNlZFRpbWUsIF9ub3cgKTtcbiAgICBzZWxmLmxhc3RSZXF1ZXN0VGltZSA9IF9ub3c7XG4gICAgc2VsZi5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSB0aW1lci5yZXF1ZXN0KCBzdGFydCApO1xuICAgIHJldHVybiB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWludmFsaWQtdGhpc1xuICB9XG4gIHRoaXMuc3RhcnQgPSBzdGFydDtcbiAgdGhpcy5zZXQoICdGUFMnLCA2MCApO1xufVxuVGlja2VyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIExpZ2h0RW1pdHRlci5wcm90b3R5cGUgKTtcblRpY2tlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUaWNrZXI7XG4vKipcbiAqIFNldCBuZXcgdmFsdWUgb2YgYSBzZXR0aW5nLlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjc2V0XG4gKiBAcGFyYW0gIHtzdHJpbmd9IHNldHRpbmcgVGhlIHNldHRpbmdgcyBrZXksIGUuZy46IFwiRlBTXCIsIFwiZnJhbWUgdGltZVwiLlxuICogQHBhcmFtICB7YW55fSAgICB2YWx1ZSAgIE5ldyBzZXR0aW5nYHMgdmFsdWUuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgUmV0dXJucyBub3RoaW5nLlxuICogQGV4YW1wbGVcbiAqIHRpY2tlci5zZXQoICdGUFMnLCAxMjAgKTtcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQgKCBzZXR0aW5nLCB2YWx1ZSApXG57XG4gIGlmICggaXNJbnZhbGlkU2V0dGluZyggc2V0dGluZyApICkgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHNldHRpbmcga2V5OiAnICsgc2V0dGluZyApOyB9IC8qIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlbiovXG4gIGlmICggc2V0dGluZyA9PT0gJ0ZQUycgKSB7XG4gICAgdGhpcy5zZXR0aW5nc1sgJ2ZyYW1lIHRpbWUnIF0gPSAxIC8gdmFsdWU7XG4gIH0gZWxzZSBpZiAoIHNldHRpbmcgPT09ICdmcmFtZSB0aW1lJyApIHtcbiAgICB0aGlzLnNldHRpbmdzWyAnRlBTJyBdID0gMSAvIHZhbHVlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGRvdC1ub3RhdGlvblxuICB9XG4gIHRoaXMuc2V0dGluZ3NbIHNldHRpbmcgXSA9IHZhbHVlO1xufTtcbi8qKlxuICogR2V0IGN1cnJlbnQgdmFsdWUgb2YgYSBzZXR0aW5nLlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjZ2V0XG4gKiBAcGFyYW0gIHtzdHJpbmd9IHNldHRpbmcgVGhlIHNldHRpbmdgcyBrZXksIGUuZy46IFwiRlBTXCIsIFwiZnJhbWUgdGltZVwiLlxuICogQHJldHVybiB7YW55fSAgICAgICAgICAgIFRoZSBzZXR0aW5nYHMgdmFsdWUuXG4gKiBAZXhhbXBsZVxuICogdmFyIGZyYW1lVGltZSA9IHRpY2tlci5nZXQoICdmcmFtZSB0aW1lJyApO1xuICovXG5UaWNrZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAoIHNldHRpbmcgKVxue1xuICBpZiAoIGlzSW52YWxpZFNldHRpbmcoIHNldHRpbmcgKSApIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBzZXR0aW5nIGtleTogJyArIHNldHRpbmcgKTsgfSAvKiBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW4qL1xuICByZXR1cm4gdGhpcy5zZXR0aW5nc1sgc2V0dGluZyBdO1xufTtcbi8qKlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjY2xlYXJcbiAqIEBjaGFpbmFibGVcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuc2tpcHBlZFRpbWUgPSAwO1xuICByZXR1cm4gdGhpcztcbn07XG4vKipcbiAqINCe0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINCw0L3QuNC80LDRhtC40Y4uXG4gKiBAbWV0aG9kIHY2LlRpY2tlciNzdG9wXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogdGlja2VyLm9uKCAncmVuZGVyJywgZnVuY3Rpb24gKCkge1xuICogICAvLyBTdG9wIHRoZSB0aWNrZXIgYWZ0ZXIgZml2ZSBzZWNvbmRzLlxuICogICBpZiAoIHRoaXMudG90YWxUaW1lID49IDUgKSB7XG4gKiAgICAgdGlja2VyLnN0b3AoKTtcbiAqICAgfVxuICogfSApO1xuICovXG5UaWNrZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wICgpXG57XG4gIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICByZXR1cm4gdGhpcztcbn07XG5mdW5jdGlvbiBpc0ludmFsaWRTZXR0aW5nICggc2V0dGluZyApXG57XG4gIHJldHVybiBzZXR0aW5nICE9PSAnZnJhbWUgdGltZScgJiYgc2V0dGluZyAhPT0gJ0ZQUyc7XG59XG5tb2R1bGUuZXhwb3J0cyA9IFRpY2tlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1hdDMgPSByZXF1aXJlKCAnLi9tYXRoL21hdDMnICk7XG5cbmZ1bmN0aW9uIFRyYW5zZm9ybSAoKVxue1xuICB0aGlzLm1hdHJpeCA9IG1hdDMuaWRlbnRpdHkoKTtcbiAgdGhpcy5faW5kZXggPSAtMTtcbiAgdGhpcy5fc3RhY2sgPSBbXTtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZSA9IHtcbiAgc2F2ZTogZnVuY3Rpb24gc2F2ZSAoKVxuICB7XG4gICAgaWYgKCArK3RoaXMuX2luZGV4IDwgdGhpcy5fc3RhY2subGVuZ3RoICkge1xuICAgICAgbWF0My5jb3B5KCB0aGlzLl9zdGFja1sgdGhpcy5faW5kZXggXSwgdGhpcy5tYXRyaXggKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RhY2sucHVzaCggbWF0My5jbG9uZSggdGhpcy5tYXRyaXggKSApO1xuICAgIH1cbiAgfSxcblxuICByZXN0b3JlOiBmdW5jdGlvbiByZXN0b3JlICgpXG4gIHtcbiAgICBpZiAoIHRoaXMuX2luZGV4ID49IDAgKSB7XG4gICAgICBtYXQzLmNvcHkoIHRoaXMubWF0cml4LCB0aGlzLl9zdGFja1sgdGhpcy5faW5kZXgtLSBdICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hdDMuc2V0SWRlbnRpdHkoIHRoaXMubWF0cml4ICk7XG4gICAgfVxuICB9LFxuXG4gIHNldFRyYW5zZm9ybTogZnVuY3Rpb24gc2V0VHJhbnNmb3JtICggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxuICB7XG4gICAgbWF0My5zZXRUcmFuc2Zvcm0oIHRoaXMubWF0cml4LCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApO1xuICB9LFxuXG4gIHRyYW5zbGF0ZTogZnVuY3Rpb24gdHJhbnNsYXRlICggeCwgeSApXG4gIHtcbiAgICBtYXQzLnRyYW5zbGF0ZSggdGhpcy5tYXRyaXgsIHgsIHkgKTtcbiAgfSxcblxuICByb3RhdGU6IGZ1bmN0aW9uIHJvdGF0ZSAoIGFuZ2xlIClcbiAge1xuICAgIG1hdDMucm90YXRlKCB0aGlzLm1hdHJpeCwgYW5nbGUgKTtcbiAgfSxcblxuICBzY2FsZTogZnVuY3Rpb24gc2NhbGUgKCB4LCB5IClcbiAge1xuICAgIG1hdDMuc2NhbGUoIHRoaXMubWF0cml4LCB4LCB5ICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCf0YDQuNC80LXQvdGP0LXRgiBcInRyYW5zZm9ybWF0aW9uIG1hdHJpeFwiINC40Lcg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNGFINC/0LDRgNCw0LzQtdGC0YDQvtCyINC90LAg0YLQtdC60YPRidC40LkgXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIi5cbiAgICogQG1ldGhvZCB2Ni5UcmFuc2Zvcm0jdHJhbnNmb3JtXG4gICAqIEBwYXJhbSAge251bWJlcn0gIG0xMSBYIHNjYWxlLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMTIgWCBza2V3LlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMjEgWSBza2V3LlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMjIgWSBzY2FsZS5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgZHggIFggdHJhbnNsYXRlLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBkeSAgWSB0cmFuc2xhdGUuXG4gICAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGVcbiAgICogLy8gQXBwbHkgc2NhbGVkIHR3aWNlIFwidHJhbnNmb3JtYXRpb24gbWF0cml4XCIuXG4gICAqIHRyYW5zZm9ybS50cmFuc2Zvcm0oIDIsIDAsIDAsIDIsIDAsIDAgKTtcbiAgICovXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24gdHJhbnNmb3JtICggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxuICB7XG4gICAgbWF0My50cmFuc2Zvcm0oIHRoaXMubWF0cml4LCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBUcmFuc2Zvcm1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSggJ3BlYWtvL2RlZmF1bHRzJyApO1xudmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG4vKipcbiAqINCa0LvQsNGB0YEg0LrQsNC80LXRgNGLLiDQrdGC0L7RgiDQutC70LDRgdGBINGD0LTQvtCx0LXQvSDQtNC70Y8g0YHQvtC30LTQsNC90LjRjyDQutCw0LzQtdGA0YssINC60L7RgtC+0YDQsNGPINC00L7Qu9C20L3QsCDQsdGL0YLRjFxuICog0L3QsNC/0YDQsNCy0LvQtdC90L3QsCDQvdCwINC+0L/RgNC10LTQtdC70LXQvdC90YvQuSDQvtCx0YrQtdC60YIg0LIg0L/RgNC40LvQvtC20LXQvdC40LgsINC90LDQv9GA0LjQvNC10YA6INC90LAg0LzQsNGI0LjQvdGDINCyXG4gKiDQs9C+0L3QvtGH0L3QvtC5INC40LPRgNC1LiDQmtCw0LzQtdGA0LAg0LHRg9C00LXRgiDRgdCw0LzQsCDQv9C70LDQstC90L4g0Lgg0YEg0LDQvdC40LzQsNGG0LjQtdC5INC90LDQv9GA0LDQstC70Y/RgtGM0YHRjyDQvdCwINC90YPQttC90YvQuVxuICog0L7QsdGK0LXQutGCLiDQldGB0YLRjCDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINCw0L3QuNC80LjRgNC+0LLQsNC90L3QvtCz0L4g0L7RgtC00LDQu9C10L3QuNGPINC40LvQuCDQv9GA0LjQsdC70LjQttC10L3QuNGPINC60LDQvNC10YDRiy5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5DYW1lcmFcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10g0J/QsNGA0LDQvNC10YLRgNGLINC00LvRjyDRgdC+0LfQtNCw0L3QuNGPINC60LDQvNC10YDRiywg0YHQvNC+0YLRgNC40YLQtSB7QGxpbmsgdjYuc2V0dGluZ3MuY2FtZXJhfS5cbiAqIEBleGFtcGxlIDxjYXB0aW9uPlJlcXVpcmUgXCJ2Ni5DYW1lcmFcIjwvY2FwdGlvbj5cbiAqIHZhciBDYW1lcmEgPSByZXF1aXJlKCAndjYuanMvY29yZS9jYW1lcmEvQ2FtZXJhJyApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRlIGFuIGluc3RhbmNlPC9jYXB0aW9uPlxuICogdmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEoKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhbiBpbnN0YW5jZSB3aXRoIG9wdGlvbnM8L2NhcHRpb24+XG4gKiB2YXIgY2FtZXJhID0gbmV3IENhbWVyYSgge1xuICogICBzZXR0aW5nczoge1xuICogICAgIHNwZWVkOiB7XG4gKiAgICAgICB4OiAwLjE1LFxuICogICAgICAgeTogMC4xNVxuICogICAgIH1cbiAqICAgfVxuICogfSApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRlIGFuIGluc3RhbmNlIHdpdGggcmVuZGVyZXI8L2NhcHRpb24+XG4gKiB2YXIgY2FtZXJhID0gbmV3IENhbWVyYSgge1xuICogICByZW5kZXJlcjogcmVuZGVyZXJcbiAqIH0gKTtcbiAqL1xuZnVuY3Rpb24gQ2FtZXJhICggb3B0aW9ucyApXG57XG4gIHZhciB4O1xuICB2YXIgeTtcbiAgb3B0aW9ucyA9IGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApO1xuICAvKipcbiAgICog0J3QsNGB0YLRgNC+0LnQutC4INC60LDQvNC10YDRiywg0YLQsNC60LjQtSDQutCw0Log0YHQutC+0YDQvtGB0YLRjCDQsNC90LjQvNCw0YbQuNC4INC40LvQuCDQvNCw0YHRiNGC0LDQsS5cbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5DYW1lcmEjc2V0dGluZ3NcbiAgICogQHNlZSB2Ni5zZXR0aW5ncy5jYW1lcmEuc2V0dGluZ3NcbiAgICovXG4gIHRoaXMuc2V0dGluZ3MgPSBvcHRpb25zLnNldHRpbmdzO1xuICBpZiAoIG9wdGlvbnMucmVuZGVyZXIgKSB7XG4gICAgLyoqXG4gICAgICog0KDQtdC90LTQtdGA0LXRgC5cbiAgICAgKiBAbWVtYmVyIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfHZvaWR9IHY2LkNhbWVyYSNyZW5kZXJlclxuICAgICAqL1xuICAgIHRoaXMucmVuZGVyZXIgPSBvcHRpb25zLnJlbmRlcmVyO1xuICB9XG4gIGlmICggISB0aGlzLnNldHRpbmdzLm9mZnNldCApIHtcbiAgICBpZiAoIHRoaXMucmVuZGVyZXIgKSB7XG4gICAgICB4ID0gdGhpcy5yZW5kZXJlci53ICogMC41O1xuICAgICAgeSA9IHRoaXMucmVuZGVyZXIuaCAqIDAuNTtcbiAgICB9IGVsc2Uge1xuICAgICAgeCA9IDA7XG4gICAgICB5ID0gMDtcbiAgICB9XG4gICAgdGhpcy5zZXR0aW5ncy5vZmZzZXQgPSB7XG4gICAgICB4OiB4LFxuICAgICAgeTogeVxuICAgIH07XG4gIH1cbiAgLyoqXG4gICAqINCe0LHRitC10LrRgiwg0L3QsCDQutC+0YLQvtGA0YvQuSDQvdCw0L/RgNCw0LLQu9C10L3QsCDQutCw0LzQtdGA0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge29iamVjdD99IHY2LkNhbWVyYSNfZGVzdGluYXRpb25cbiAgICogQHNlZSB2Ni5DYW1lcmEjbG9va0F0XG4gICAqL1xuICB0aGlzLl9kZXN0aW5hdGlvbiA9IG51bGw7XG4gIC8qKlxuICAgKiDQodCy0L7QudGB0YLQstC+LCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDQsdGA0LDRgtGMINC40Lcge0BsaW5rIHY2LkNhbWVyYSNfZGVzdGluYXRpb259LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtzdHJpbmc/fSB2Ni5DYW1lcmEjX2Rlc3RpbmF0aW9uS2V5XG4gICAqIEBzZWUgdjYuQ2FtZXJhI2xvb2tBdFxuICAgKi9cbiAgdGhpcy5fZGVzdGluYXRpb25LZXkgPSBudWxsO1xuICAvKipcbiAgICog0KLQtdC60YPRidGP0Y8g0L/QvtC30LjRhtC40Y8g0LrQsNC80LXRgNGLICjRgdGO0LTQsCDQvdCw0L/RgNCw0LLQu9C10L3QsCDQutCw0LzQtdGA0LApLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtJVmVjdG9yMkR9IHY2LkNhbWVyYSNfY3VycmVudFBvc2l0aW9uXG4gICAqL1xuICB0aGlzLl9jdXJyZW50UG9zaXRpb24gPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH07XG59XG5DYW1lcmEucHJvdG90eXBlID0ge1xuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0L7QsdGK0LXQutGCLCDQvdCwINC60L7RgtC+0YDRi9C5INC60LDQvNC10YDQsCDQtNC+0LvQttC90LAg0LHRi9GC0Ywg0L3QsNC/0YDQsNCy0LvQtdC90LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI19nZXREZXN0aW5hdGlvblxuICAgKiBAcmV0dXJuIHtJVmVjdG9yMkQ/fSDQntCx0YrQtdC60YIg0LjQu9C4IFwibnVsbFwiLlxuICAgKi9cbiAgX2dldERlc3RpbmF0aW9uOiBmdW5jdGlvbiBfZ2V0RGVzdGluYXRpb24gKClcbiAge1xuICAgIHZhciBfZGVzdGluYXRpb25LZXkgPSB0aGlzLl9kZXN0aW5hdGlvbktleTtcbiAgICBpZiAoIF9kZXN0aW5hdGlvbktleSA9PT0gbnVsbCApIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZXN0aW5hdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2Rlc3RpbmF0aW9uWyBfZGVzdGluYXRpb25LZXkgXTtcbiAgfSxcbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINC90LDRgdGC0YDQvtC50LrQuC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjc2V0XG4gICAqIEBwYXJhbSAge3N0cmluZ30gc2V0dGluZyDQmNC80Y8g0L3QsNGB0YLRgNC+0LnQutC4OiBcInpvb20tb3V0IHNwZWVkXCIsIFwiem9vbS1pbiBzcGVlZFwiLCBcIm9mZnNldFwiLCBcInNwZWVkXCIsIFwiem9vbVwiLlxuICAgKiBAcGFyYW0gIHthbnl9ICAgIHZhbHVlICAg0J3QvtCy0L7QtSDQt9C90LDRh9C10L3QuNC1INC90LDRgdGC0YDQvtC50LrQuC5cbiAgICogQHJldHVybiB7dm9pZH0gICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9GA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IHpvb20taW4gc3BlZWQgc2V0dGluZyB0byAwLjAwMjUgd2l0aCBsaW5lYXIgZmxhZyAoZGVmYXVsdDogdHJ1ZSkuXG4gICAqIGNhbWVyYS5zZXQoICd6b29tLWluIHNwZWVkJywgeyB2YWx1ZTogMC4wMDI1LCBsaW5lYXI6IHRydWUgfSApO1xuICAgKiAvLyBUdXJuIG9mZiBsaW5lYXIgZmxhZy5cbiAgICogY2FtZXJhLnNldCggJ3pvb20taW4gc3BlZWQnLCB7IGxpbmVhcjogZmFsc2UgfSApO1xuICAgKiAvLyBTZXQgem9vbSBzZXR0aW5nIHRvIDEgd2l0aCByYW5nZSBbIDAuNzUgLi4gMS4xMjUgXS5cbiAgICogY2FtZXJhLnNldCggJ3pvb20nLCB7IHZhbHVlOiAxLCBtaW46IDAuNzUsIG1heDogMS4xMjUgfSApO1xuICAgKiAvLyBTZXQgY2FtZXJhIHNwZWVkLlxuICAgKiBjYW1lcmEuc2V0KCAnc3BlZWQnLCB7IHg6IDAuMSwgeTogMC4xIH0gKTtcbiAgICovXG4gIHNldDogZnVuY3Rpb24gc2V0ICggc2V0dGluZywgdmFsdWUgKVxuICB7XG4gICAgdmFyIHNldHRpbmdfID0gdGhpcy5nZXQoIHNldHRpbmcgKTtcbiAgICBmb3IgKCB2YXIgX2tleXMgPSBPYmplY3Qua2V5cyggdmFsdWUgKSwgX2kgPSAwLCBfbCA9IF9rZXlzLmxlbmd0aDsgX2kgPCBfbDsgKytfaSApIHtcbiAgICAgIHNldHRpbmdfWyBfa2V5c1sgX2kgXSBdID0gdmFsdWVbIF9rZXlzWyBfaSBdIF07XG4gICAgfVxuICB9LFxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LfQvdCw0YfQtdC90LjQtSDQvdCw0YHRgtGA0L7QudC60LguXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI2dldFxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHNldHRpbmcg0JjQvNGPINC90LDRgdGC0YDQvtC50LrQuDogXCJ6b29tLW91dCBzcGVlZFwiLCBcInpvb20taW4gc3BlZWRcIiwgXCJvZmZzZXRcIiwgXCJzcGVlZFwiLCBcInpvb21cIi5cbiAgICogQHJldHVybiB7YW55fSAgICAgICAgICAgINCX0L3QsNGH0LXQvdC40LUg0L3QsNGB0YLRgNC+0LnQutC4LlxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBHZXQgY3VycmVudCBjYW1lcmEgem9vbS5cbiAgICogdmFyIHpvb20gPSBjYW1lcmEuZ2V0KCAnem9vbScgKS52YWx1ZTtcbiAgICovXG4gIGdldDogZnVuY3Rpb24gZ2V0ICggc2V0dGluZyApXG4gIHtcbiAgICBDSEVDSyggc2V0dGluZyApO1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzWyBzZXR0aW5nIF07XG4gIH0sXG4gIC8qKlxuICAgKiDQndCw0L/RgNCw0LLQu9GP0LXRgiDQutCw0LzQtdGA0YMg0L3QsCDQvtC/0YDQtdC00LXQu9C10L3QvdGD0Y4g0L/QvtC30LjRhtC40Y4gKGBcImRlc3RpbmF0aW9uXCJgKS5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjbG9va0F0XG4gICAqIEBwYXJhbSAge0lWZWN0b3IyRH0gZGVzdGluYXRpb24g0J/QvtC30LjRhtC40Y8sINCyINC60L7RgtC+0YDRg9GOINC00L7Qu9C20L3QsCDRgdC80L7RgtGA0LXRgtGMINC60LDQvNC10YDQsC5cbiAgICogQHBhcmFtICB7c3RyaW5nfSAgIFtrZXldICAgICAgICDQodCy0L7QudGB0YLQstC+LCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDQsdGA0LDRgtGMINC40LcgYFwiZGVzdGluYXRpb25cImAuXG4gICAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30YDQsNGJ0LDQtdGCLlxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgY2FyID0ge1xuICAgKiAgIHBvc2l0aW9uOiB7XG4gICAqICAgICB4OiA0LFxuICAgKiAgICAgeTogMlxuICAgKiAgIH1cbiAgICogfTtcbiAgICogLy8gRGlyZWN0IGEgY2FtZXJhIG9uIHRoZSBjYXIuXG4gICAqIGNhbWVyYS5sb29rQXQoIGNhciwgJ3Bvc2l0aW9uJyApO1xuICAgKiAvLyBUaGlzIHdheSB3b3JrcyB0b28gYnV0IGlmIHRoZSAncG9zaXRpb24nIHdpbGwgYmUgcmVwbGFjZWQgaXQgd291bGQgbm90IHdvcmsuXG4gICAqIGNhbWVyYS5sb29rQXQoIGNhci5wb3NpdGlvbiApO1xuICAgKi9cbiAgbG9va0F0OiBmdW5jdGlvbiBsb29rQXQgKCBkZXN0aW5hdGlvbiwga2V5IClcbiAge1xuICAgIHRoaXMuX2Rlc3RpbmF0aW9uID0gZGVzdGluYXRpb247XG4gICAgaWYgKCB0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgIHRoaXMuX2Rlc3RpbmF0aW9uS2V5ID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZGVzdGluYXRpb25LZXkgPSBrZXk7XG4gICAgfVxuICB9LFxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0L/QvtC30LjRhtC40Y4sINC90LAg0LrQvtGC0L7RgNGD0Y4g0LrQsNC80LXRgNCwINC00L7Qu9C20L3QsCDQsdGL0YLRjCDQvdCw0L/RgNCw0LLQu9C10L3QsC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjc2hvdWxkTG9va0F0XG4gICAqIEByZXR1cm4ge0lWZWN0b3IyRH0g0J/QvtC30LjRhtC40Y8uXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBvYmplY3QgPSB7XG4gICAqICAgcG9zaXRpb246IHsgeDogNCwgeTogMiB9XG4gICAqIH07XG4gICAqXG4gICAqIGNhbWVyYS5zaG91bGRMb29rQXQoKTsgLy8gLT4geyB4OiAwLCB5OiAwIH0uXG4gICAqIGNhbWVyYS5sb29rQXQoIG9iamVjdCwgJ3Bvc2l0aW9uJyApO1xuICAgKiBjYW1lcmEuc2hvdWxkTG9va0F0KCk7IC8vIC0+IHsgeDogNCwgeTogMiB9IChjbG9uZSkuXG4gICAqL1xuICBzaG91bGRMb29rQXQ6IGZ1bmN0aW9uIHNob3VsZExvb2tBdCAoKVxuICB7XG4gICAgdmFyIF9kZXN0aW5hdGlvbiA9IHRoaXMuX2dldERlc3RpbmF0aW9uKCk7XG4gICAgdmFyIHg7XG4gICAgdmFyIHk7XG4gICAgaWYgKCBfZGVzdGluYXRpb24gPT09IG51bGwgKSB7XG4gICAgICB4ID0gMDtcbiAgICAgIHkgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gX2Rlc3RpbmF0aW9uLng7XG4gICAgICB5ID0gX2Rlc3RpbmF0aW9uLnk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB4OiB4LFxuICAgICAgeTogeVxuICAgIH07XG4gIH0sXG4gIC8qKlxuICAgKiDQntCx0L3QvtCy0LvRj9C10YIg0L/QvtC30LjRhtC40Y4sINC90LAg0LrQvtGC0L7RgNGD0Y4g0L3QsNC/0YDQsNCy0LvQtdC90LAg0LrQsNC80LXRgNCwLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSN1cGRhdGVcbiAgICogQHJldHVybiB7dm9pZH0g0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gICAqIEBleGFtcGxlXG4gICAqIHRpY2tlci5vbiggJ3VwZGF0ZScsIGZ1bmN0aW9uICgpXG4gICAqIHtcbiAgICogICAvLyBVcGRhdGUgYSBjYW1lcmEgb24gZWFjaCBmcmFtZS5cbiAgICogICBjYW1lcmEudXBkYXRlKCk7XG4gICAqIH0gKTtcbiAgICovXG4gIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlICgpXG4gIHtcbiAgICB2YXIgX2Rlc3RpbmF0aW9uID0gdGhpcy5fZ2V0RGVzdGluYXRpb24oKTtcbiAgICBpZiAoIF9kZXN0aW5hdGlvbiAhPT0gbnVsbCApIHtcbiAgICAgIHRyYW5zbGF0ZSggdGhpcywgX2Rlc3RpbmF0aW9uLCAneCcgKTtcbiAgICAgIHRyYW5zbGF0ZSggdGhpcywgX2Rlc3RpbmF0aW9uLCAneScgKTtcbiAgICB9XG4gIH0sXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQv9C+0LfQuNGG0LjRjiwg0L3QsCDQutC+0YLQvtGA0YPRjiDQutCw0LzQtdGA0LAg0L3QsNC/0YDQsNCy0LvQtdC90LAg0YHQtdC50YfQsNGBLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNsb29rc0F0XG4gICAqIEByZXR1cm4ge0lWZWN0b3IyRH0g0KLQtdC60YPRidC10LUg0L3QsNC/0YDQsNCy0LvQtdC90LjQtSDQutCw0LzQtdGA0YsuXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEEgY2FtZXJhIGxvb2tzIGF0IFsgeCwgeSBdIGZyb20gbG9va3NBdCBub3cuXG4gICAqIHZhciBsb29rc0F0ID0gY2FtZXJhLmxvb2tzQXQoKTtcbiAgICovXG4gIGxvb2tzQXQ6IGZ1bmN0aW9uIGxvb2tzQXQgKClcbiAge1xuICAgIHJldHVybiB7XG4gICAgICB4OiB0aGlzLl9jdXJyZW50UG9zaXRpb24ueCxcbiAgICAgIHk6IHRoaXMuX2N1cnJlbnRQb3NpdGlvbi55XG4gICAgfTtcbiAgfSxcbiAgLyoqXG4gICAqINCf0YDQuNC80LXQvdGP0LXRgiDQutCw0LzQtdGA0YMg0L3QsCDQvNCw0YLRgNC40YbRgyDQuNC70Lgg0YDQtdC90LTQtdGA0LXRgC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjYXBwbHlcbiAgICogQHBhcmFtICB7djYuVHJhbnNmb3JtfHY2LkFic3RyYWN0UmVuZGVyZXJ9IFttYXRyaXhdINCc0LDRgtGA0LjRhtCwINC40LvQuCDRgNC10L3QtNC10YDQtdGALlxuICAgKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPkFwcGx5IG9uIGEgcmVuZGVyZXI8L2NhcHRpb24+XG4gICAqIHZhciByZW5kZXJlciA9IHY2LmNyZWF0ZVJlbmRlcmVyKCk7XG4gICAqIGNhbWVyYS5hcHBseSggcmVuZGVyZXIgKTtcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+QXBwbHkgb24gYSB0cmFuc2Zvcm08L2NhcHRpb24+XG4gICAqIHZhciBtYXRyaXggPSBuZXcgdjYuVHJhbnNmb3JtKCk7XG4gICAqIGNhbWVyYS5hcHBseSggbWF0cml4ICk7XG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPkFwcGx5IG9uIGEgY2FtZXJhJ3MgcmVuZGVyZXI8L2NhcHRpb24+XG4gICAqIHZhciBjYW1lcmEgPSBuZXcgdjYuQ2FtZXJhKCB7XG4gICAqICAgcmVuZGVyZXI6IHJlbmRlcmVyXG4gICAqIH0gKTtcbiAgICpcbiAgICogY2FtZXJhLmFwcGx5KCk7XG4gICAqL1xuICBhcHBseTogZnVuY3Rpb24gYXBwbHkgKCBtYXRyaXggKVxuICB7XG4gICAgdmFyIHpvb20gPSB0aGlzLnNldHRpbmdzLnpvb20udmFsdWU7XG4gICAgdmFyIHggPSB0cmFuc2Zvcm0oIHRoaXMsIHRoaXMuX2N1cnJlbnRQb3NpdGlvbiwgJ3gnICk7XG4gICAgdmFyIHkgPSB0cmFuc2Zvcm0oIHRoaXMsIHRoaXMuX2N1cnJlbnRQb3NpdGlvbiwgJ3knICk7XG4gICAgKCBtYXRyaXggfHwgdGhpcy5yZW5kZXJlciApLnNldFRyYW5zZm9ybSggem9vbSwgMCwgMCwgem9vbSwgem9vbSAqIHgsIHpvb20gKiB5ICk7XG4gIH0sXG4gIC8qKlxuICAgKiDQntC/0YDQtdC00LXQu9GP0LXRgiwg0LLQuNC00LjRgiDQu9C4INC60LDQvNC10YDQsCDQvtCx0YrQtdC60YIg0LjQtyDRgdC+0L7RgtCy0LXRgtGB0LLRg9GO0YnQuNGFINC/0LDRgNCw0LLQtdGC0YDQvtCyICh4LCB5LCB3LCBoKSDRgdC10LnRh9Cw0YEsXG4gICAqINC10YHQu9C4INC90LXRgiwg0YLQviDRjdGC0L7RgiDQvtCx0YrQtdC60YIg0LzQvtC20L3QviDQvdC1INC+0YLRgNC40YHQvtCy0YvQstCw0YLRjC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjc2Vlc1xuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB4ICAgICAgICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L7QsdGK0LXQutGC0LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIHkgICAgICAgICAgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQvtCx0YrQtdC60YLQsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgdyAgICAgICAgICDQqNC40YDQuNC90LAg0L7QsdGK0LXQutGC0LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIGggICAgICAgICAg0JLRi9GB0L7RgtCwINC+0LHRitC10LrRgtCwLlxuICAgKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSBbcmVuZGVyZXJdINCg0LXQvdC00LXRgNC10YAuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgYHRydWVgLCDQtdGB0LvQuCDQvtCx0YrQtdC60YIg0LTQvtC70LbQtdC9INCx0YvRgtGMINC+0YLRgNC40YHQvtCy0LDQvS5cbiAgICogQGV4YW1wbGVcbiAgICogaWYgKCBjYW1lcmEuc2Vlcyggb2JqZWN0LngsIG9iamVjdC55LCBvYmplY3Qudywgb2JqZWN0LmggKSApIHtcbiAgICogICBvYmplY3Quc2hvdygpO1xuICAgKiB9XG4gICAqL1xuICBzZWVzOiBmdW5jdGlvbiBzZWVzICggeCwgeSwgdywgaCwgcmVuZGVyZXIgKVxuICB7XG4gICAgdmFyIHpvb20gPSB0aGlzLnNldHRpbmdzLnpvb20udmFsdWU7XG4gICAgdmFyIG9mZnNldCA9IHRoaXMuc2V0dGluZ3Mub2Zmc2V0O1xuICAgIHZhciBfY3VycmVudFBvc2l0aW9uID0gdGhpcy5fY3VycmVudFBvc2l0aW9uO1xuICAgIGlmICggISByZW5kZXJlciApIHtcbiAgICAgIHJlbmRlcmVyID0gdGhpcy5yZW5kZXJlcjtcbiAgICB9XG4gICAgaWYgKCAhIHJlbmRlcmVyICkge1xuICAgICAgdGhyb3cgRXJyb3IoICdObyByZW5kZXJlciAoY2FtZXJhLnNlZXMpJyApO1xuICAgIH1cbiAgICByZXR1cm4geCArIHcgPiBfY3VycmVudFBvc2l0aW9uLnggLSBvZmZzZXQueCAvIHpvb20gJiZcbiAgICAgICAgICAgeCA8IF9jdXJyZW50UG9zaXRpb24ueCArICggcmVuZGVyZXIudyAtIG9mZnNldC54ICkgLyB6b29tICYmXG4gICAgICAgICAgIHkgKyBoID4gX2N1cnJlbnRQb3NpdGlvbi55IC0gb2Zmc2V0LnkgLyB6b29tICYmXG4gICAgICAgICAgIHkgPCBfY3VycmVudFBvc2l0aW9uLnkgKyAoIHJlbmRlcmVyLmggLSBvZmZzZXQueSApIC8gem9vbTtcbiAgfSxcbiAgLyoqXG4gICAqINCe0YLQtNCw0LvRj9C10YIg0LrQsNC80LXRgNGDLiDQkNC90LjQvNCw0YbQuNGPINC80L7QttC10YIg0LHRi9GC0Ywg0LvQuNC90LXQudC90L7QuSAo0L/QviDRg9C80L7Qu9GH0LDQvdC40Y4pINC10YHQu9C4INGN0YLQviDQstC60LvRjtGH0LXQvdC+OlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIGNhbWVyYS5zZXQoICd6b29tLW91dCBzcGVlZCcsIHtcbiAgICogICAvLyBFbmFibGVzIGxpbmVhciBhbmltYXRpb24gKGVuYWJsZWQgYnkgZGVmYXVsdCBidXQgeW91IGNhbiBkaXNhYmxlKS5cbiAgICogICBsaW5lYXI6IHRydWVcbiAgICogfSApO1xuICAgKiBgYGBcbiAgICog0KHQutC+0YDQvtGB0YLRjCDQsNC90LjQvNCw0YbQuNC4INC40LfQvNC10L3Rj9C10YLRgdGPINGH0LXRgNC10LcgYHZhbHVlYDpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiBjYW1lcmEuc2V0KCAnem9vbS1vdXQgc3BlZWQnLCB7XG4gICAqICAgLy8gU2V0IHNsb3cgem9vbS1vdXQgc3BlZWQgKDEgYnkgZGVmYXVsdCkuXG4gICAqICAgdmFsdWU6IDAuMVxuICAgKiB9ICk7XG4gICAqIGBgYFxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSN6b29tT3V0XG4gICAqIEByZXR1cm4ge3ZvaWR9INCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICAgKiBAZXhhbXBsZVxuICAgKiB0aWNrZXIub24oICd1cGRhdGUnLCBmdW5jdGlvbiAoKVxuICAgKiB7XG4gICAqICAgY2FtZXJhLnpvb21PdXQoKTtcbiAgICogfSApO1xuICAgKi9cbiAgem9vbU91dDogZnVuY3Rpb24gem9vbU91dCAoKSB7IHZhciB6b29tU3BlZWQgPSB0aGlzLnNldHRpbmdzWyAnem9vbS1vdXQgc3BlZWQnIF07IHZhciB6b29tID0gdGhpcy5zZXR0aW5ncy56b29tOyB2YXIgY2hhbmdlOyBpZiAoIHpvb20udmFsdWUgIT09IHpvb20ubWluICkgeyBpZiAoIHpvb21TcGVlZC5saW5lYXIgKSB7IGNoYW5nZSA9IHpvb21TcGVlZC52YWx1ZSAqIHpvb20udmFsdWU7IH0gZWxzZSB7IGNoYW5nZSA9IHpvb21TcGVlZC52YWx1ZTsgfSB6b29tLnZhbHVlID0gTWF0aC5tYXgoIHpvb20udmFsdWUgLSBjaGFuZ2UsIHpvb20ubWluICk7IH0gfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQn9GA0LjQsdC70LjQttCw0LXRgiDQutCw0LzQtdGA0YMuINCQ0L3QuNC80LDRhtC40Y8g0LzQvtC20LXRgiDQsdGL0YLRjCDQu9C40L3QtdC50L3QvtC5ICjQv9C+INGD0LzQvtC70YfQsNC90LjRjikg0LXRgdC70Lgg0Y3RgtC+INCy0LrQu9GO0YfQtdC90L46XG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogY2FtZXJhLnNldCggJ3pvb20taW4gc3BlZWQnLCB7XG4gICAqICAgLy8gRW5hYmxlcyBsaW5lYXIgYW5pbWF0aW9uIChlbmFibGVkIGJ5IGRlZmF1bHQgYnV0IHlvdSBjYW4gZGlzYWJsZSkuXG4gICAqICAgbGluZWFyOiB0cnVlXG4gICAqIH0gKTtcbiAgICogYGBgXG4gICAqINCh0LrQvtGA0L7RgdGC0Ywg0LDQvdC40LzQsNGG0LjQuCDQuNC30LzQtdC90Y/QtdGC0YHRjyDRh9C10YDQtdC3IGB2YWx1ZWA6XG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogY2FtZXJhLnNldCggJ3pvb20taW4gc3BlZWQnLCB7XG4gICAqICAgLy8gU2V0IHNsb3cgem9vbS1pbiBzcGVlZCAoMSBieSBkZWZhdWx0KS5cbiAgICogICB2YWx1ZTogMC4xXG4gICAqIH0gKTtcbiAgICogYGBgXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI3pvb21JblxuICAgKiBAcmV0dXJuIHt2b2lkfSDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGVcbiAgICogdGlja2VyLm9uKCAndXBkYXRlJywgZnVuY3Rpb24gKClcbiAgICoge1xuICAgKiAgIGNhbWVyYS56b29tSW4oKTtcbiAgICogfSApO1xuICAgKi9cbiAgem9vbUluOiBmdW5jdGlvbiB6b29tSW4gKCkgeyB2YXIgem9vbVNwZWVkID0gdGhpcy5zZXR0aW5nc1sgJ3pvb20taW4gc3BlZWQnIF07IHZhciB6b29tID0gdGhpcy5zZXR0aW5ncy56b29tOyB2YXIgY2hhbmdlOyBpZiAoIHpvb20udmFsdWUgIT09IHpvb20ubWF4ICkgeyBpZiAoIHpvb21TcGVlZC5saW5lYXIgKSB7IGNoYW5nZSA9IHpvb21TcGVlZC52YWx1ZSAqIHpvb20udmFsdWU7IH0gZWxzZSB7IGNoYW5nZSA9IHpvb21TcGVlZC52YWx1ZTsgfSB6b29tLnZhbHVlID0gTWF0aC5taW4oIHpvb20udmFsdWUgKyBjaGFuZ2UsIHpvb20ubWF4ICk7IH0gfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIGNvbnN0cnVjdG9yOiBDYW1lcmFcbn07XG5mdW5jdGlvbiB0cmFuc2Zvcm0gKCBjYW1lcmEsIHBvc2l0aW9uLCBheGlzIClcbntcbiAgcmV0dXJuIGNhbWVyYS5zZXR0aW5ncy5vZmZzZXRbIGF4aXMgXSAvIGNhbWVyYS5zZXR0aW5ncy56b29tLnZhbHVlIC0gcG9zaXRpb25bIGF4aXMgXTtcbn1cbmZ1bmN0aW9uIHRyYW5zbGF0ZSAoIGNhbWVyYSwgZGVzdGluYXRpb24sIGF4aXMgKVxue1xuICB2YXIgdHJhbnNmb3JtZWREZXN0aW5hdGlvbiA9IHRyYW5zZm9ybSggY2FtZXJhLCBkZXN0aW5hdGlvbiwgYXhpcyApO1xuICB2YXIgdHJhbnNmb3JtZWRDdXJyZW50UG9zaXRpb24gPSB0cmFuc2Zvcm0oIGNhbWVyYSwgY2FtZXJhLl9jdXJyZW50UG9zaXRpb24sIGF4aXMgKTtcbiAgY2FtZXJhLl9jdXJyZW50UG9zaXRpb25bIGF4aXMgXSArPSAoIHRyYW5zZm9ybWVkQ3VycmVudFBvc2l0aW9uIC0gdHJhbnNmb3JtZWREZXN0aW5hdGlvbiApICogY2FtZXJhLnNldHRpbmdzLnNwZWVkWyBheGlzIF07XG59XG5mdW5jdGlvbiBDSEVDSyAoIHNldHRpbmcgKVxue1xuICBzd2l0Y2ggKCBzZXR0aW5nICkge1xuICAgIGNhc2UgJ3pvb20tb3V0IHNwZWVkJzpcbiAgICBjYXNlICd6b29tLWluIHNwZWVkJzpcbiAgICBjYXNlICdvZmZzZXQnOlxuICAgIGNhc2UgJ3NwZWVkJzpcbiAgICBjYXNlICd6b29tJzpcbiAgICAgIHJldHVybjtcbiAgfVxuICB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHNldHRpbmcga2V5OiAnICsgc2V0dGluZyApO1xufVxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0KHRgtCw0L3QtNCw0YDRgtC90YvQtSDQvdCw0YHRgtGA0L7QudC60Lgg0LrQsNC80LXRgNGLLlxuICogQG5hbWVzcGFjZSB2Ni5zZXR0aW5ncy5jYW1lcmFcbiAqIEBleGFtcGxlXG4gKiB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAndjYuanMvY29yZS9jYW1lcmEvc2V0dGluZ3MnICk7XG4gKi9cblxuLyoqXG4gKiDQoNC10L3QtNC10YDQtdGALlxuICogQG1lbWJlciB7djYuQWJzdHJhY3RSZW5kZXJlcn0gdjYuc2V0dGluZ3MuY2FtZXJhLnJlbmRlcmVyXG4gKi9cblxuLyoqXG4gKiDQodGC0LDQvdC00LDRgNGC0L3Ri9C1INC90LDRgdGC0YDQvtC50LrQuCDQutCw0LzQtdGA0YsuXG4gKiBAbWVtYmVyIHtvYmplY3R9IHY2LnNldHRpbmdzLmNhbWVyYS5zZXR0aW5nc1xuICogQHByb3BlcnR5IHtvYmplY3R9ICAgIFsnem9vbS1vdXQgc3BlZWQnXVxuICogQHByb3BlcnR5IHtudW1iZXJ9ICAgIFsnem9vbS1vdXQgc3BlZWQnLnZhbHVlPTFdICAgICDQodC60L7RgNC+0YHRgtGMINGD0LzQtdC90YzRiNC10L3QuNGPINC80LDRgdGI0YLQsNCx0LAgKNC+0YLQtNCw0LvQtdC90LjRjykg0LrQsNC80LXRgNGLLlxuICogQHByb3BlcnR5IHtib29sZWFufSAgIFsnem9vbS1vdXQgc3BlZWQnLmxpbmVhcj10cnVlXSDQlNC10LvQsNGC0Ywg0LDQvdC40LzQsNGG0LjRjiDQu9C40L3QtdC50L3QvtC5LlxuICogQHByb3BlcnR5IHtvYmplY3R9ICAgIFsnem9vbS1pbiBzcGVlZCddXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWyd6b29tLWluIHNwZWVkJy52YWx1ZT0xXSAgICAgINCh0LrQvtGA0L7RgdGC0Ywg0YPQstC10LvQuNGH0LXQvdC40Y8g0LzQsNGB0YjRgtCw0LHQsCAo0L/RgNC40LHQu9C40LbQtdC90LjRjykg0LrQsNC80LXRgNGLLlxuICogQHByb3BlcnR5IHtib29sZWFufSAgIFsnem9vbS1pbiBzcGVlZCcubGluZWFyPXRydWVdICDQlNC10LvQsNGC0Ywg0LDQvdC40LzQsNGG0LjRjiDQu9C40L3QtdC50L3QvtC5LlxuICogQHByb3BlcnR5IHtvYmplY3R9ICAgIFsnem9vbSddXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWyd6b29tJy52YWx1ZT0xXSAgICAgICAgICAgICAgINCi0LXQutGD0YnQuNC5INC80LDRgdGI0YLQsNCxINC60LDQvNC10YDRiy5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3pvb20nLm1pbj0xXSAgICAgICAgICAgICAgICAg0JzQuNC90LjQvNCw0LvRjNC90YvQuSDQvNCw0YHRiNGC0LDQsSDQutCw0LzQtdGA0YsuXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWyd6b29tJy5tYXg9MV0gICAgICAgICAgICAgICAgINCc0LDQutGB0LjQvNCw0LvRjNC90YvQuSDQvNCw0YHRiNGC0LDQsSDQutCw0LzQtdGA0YsuXG4gKiBAcHJvcGVydHkge29iamVjdH0gICAgWydzcGVlZCddICAgICAgICAgICAgICAgICAgICAgINCh0LrQvtGA0L7RgdGC0Ywg0L3QsNC/0YDQsNCy0LvQtdC90LjRjyDQutCw0LzQtdGA0Ysg0L3QsCDQvtCx0YrQtdC60YIuXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWydzcGVlZCcueD0xXSAgICAgICAgICAgICAgICAgIDEgLSDQvNC+0LzQtdC90YLQsNC70YzQvdC+0LUg0L/QtdGA0LXQvNC10YnQtdC90LjQtSDQv9C+IFgsIDAuMSAtINC80LXQtNC70LXQvdC90L7QtS5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3NwZWVkJy55PTFdICAgICAgICAgICAgICAgICAgMSAtINC80L7QvNC10L3RgtCw0LvRjNC90L7QtSDQv9C10YDQtdC80LXRidC10L3QuNC1INC/0L4gWSwgMC4xIC0g0LzQtdC00LvQtdC90L3QvtC1LlxuICogQHByb3BlcnR5IHtJVmVjdG9yMkR9IFsnb2Zmc2V0J11cbiAqL1xuZXhwb3J0cy5zZXR0aW5ncyA9IHtcbiAgJ3pvb20tb3V0IHNwZWVkJzoge1xuICAgIHZhbHVlOiAgMSxcbiAgICBsaW5lYXI6IHRydWVcbiAgfSxcblxuICAnem9vbS1pbiBzcGVlZCc6IHtcbiAgICB2YWx1ZTogIDEsXG4gICAgbGluZWFyOiB0cnVlXG4gIH0sXG5cbiAgJ3pvb20nOiB7XG4gICAgdmFsdWU6IDEsXG4gICAgbWluOiAgIDEsXG4gICAgbWF4OiAgIDFcbiAgfSxcblxuICAnc3BlZWQnOiB7XG4gICAgeDogMSxcbiAgICB5OiAxXG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gSFNMQTtcblxudmFyIGNsYW1wID0gcmVxdWlyZSggJ3BlYWtvL2NsYW1wJyApOyAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxudmFyIHBhcnNlID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcGFyc2UnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxudmFyIFJHQkEgID0gcmVxdWlyZSggJy4vUkdCQScgKTsgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuLyoqXG4gKiBIU0xBINGG0LLQtdGCLlxuICogQGNvbnN0cnVjdG9yIHY2LkhTTEFcbiAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW2hdIEh1ZSB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW3NdIFNhdHVyYXRpb24gdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtsXSBMaWdodG5lc3MgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSB2YWx1ZS5cbiAqIEBzZWUgdjYuSFNMQSNzZXRcbiAqIEBleGFtcGxlXG4gKiB2YXIgSFNMQSA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2NvbG9yL0hTTEEnICk7XG4gKlxuICogdmFyIHRyYW5zcGFyZW50ID0gbmV3IEhTTEEoICd0cmFuc3BhcmVudCcgKTtcbiAqIHZhciBtYWdlbnRhICAgICA9IG5ldyBIU0xBKCAnbWFnZW50YScgKTtcbiAqIHZhciBmdWNoc2lhICAgICA9IG5ldyBIU0xBKCAzMDAsIDEwMCwgNTAgKTtcbiAqIHZhciBnaG9zdCAgICAgICA9IG5ldyBIU0xBKCAxMDAsIDAuMSApO1xuICogdmFyIHdoaXRlICAgICAgID0gbmV3IEhTTEEoIDEwMCApO1xuICogdmFyIGJsYWNrICAgICAgID0gbmV3IEhTTEEoKTtcbiAqL1xuZnVuY3Rpb24gSFNMQSAoIGgsIHMsIGwsIGEgKVxue1xuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzAgXCJodWVcIiB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSFNMQSMxIFwic2F0dXJhdGlvblwiIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzIgXCJsaWdodG5lc3NcIiB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSFNMQSMzIFwiYWxwaGFcIiB2YWx1ZS5cbiAgICovXG5cbiAgdGhpcy5zZXQoIGgsIHMsIGwsIGEgKTtcbn1cblxuSFNMQS5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQstC+0YHQv9GA0LjQvdC40LzQsNC10LzRg9GOINGP0YDQutC+0YHRgtGMIChwZXJjZWl2ZWQgYnJpZ2h0bmVzcykg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI3BlcmNlaXZlZEJyaWdodG5lc3NcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggJ21hZ2VudGEnICkucGVyY2VpdmVkQnJpZ2h0bmVzcygpOyAvLyAtPiAxNjMuODc1OTQzOTMzMjA4MlxuICAgKi9cbiAgcGVyY2VpdmVkQnJpZ2h0bmVzczogZnVuY3Rpb24gcGVyY2VpdmVkQnJpZ2h0bmVzcyAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLnBlcmNlaXZlZEJyaWdodG5lc3MoKTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0L7RgtC90L7RgdC40YLQtdC70YzQvdGD0Y4g0Y/RgNC60L7RgdGC0Ywg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI2x1bWluYW5jZVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUmVsYXRpdmVfbHVtaW5hbmNlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5sdW1pbmFuY2UoKTsgLy8gLT4gNzIuNjI0XG4gICAqL1xuICBsdW1pbmFuY2U6IGZ1bmN0aW9uIGx1bWluYW5jZSAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLmx1bWluYW5jZSgpO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjYnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL0FFUlQvI2NvbG9yLWNvbnRyYXN0XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5icmlnaHRuZXNzKCk7IC8vIC0+IDEwNS4zMTVcbiAgICovXG4gIGJyaWdodG5lc3M6IGZ1bmN0aW9uIGJyaWdodG5lc3MgKClcbiAge1xuICAgIHJldHVybiB0aGlzLnJnYmEoKS5icmlnaHRuZXNzKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIENTUy1jb2xvciDRgdGC0YDQvtC60YMuXG4gICAqIEBtZXRob2QgdjYuSFNMQSN0b1N0cmluZ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBleGFtcGxlXG4gICAqICcnICsgbmV3IEhTTEEoICdyZWQnICk7IC8vIC0+IFwiaHNsYSgwLCAxMDAlLCA1MCUsIDEpXCJcbiAgICovXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiB0b1N0cmluZyAoKVxuICB7XG4gICAgcmV0dXJuICdoc2xhKCcgKyB0aGlzWyAwIF0gKyAnLCAnICsgdGhpc1sgMSBdICsgJ1xcdTAwMjUsICcgKyB0aGlzWyAyIF0gKyAnXFx1MDAyNSwgJyArIHRoaXNbIDMgXSArICcpJztcbiAgfSxcblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgSCwgUywgTCwgQSDQt9C90LDRh9C10L3QuNGPLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjc2V0XG4gICAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW2hdIEh1ZSB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbc10gU2F0dXJhdGlvbiB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbbF0gTGlnaHRuZXNzIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSB2YWx1ZS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LkhTTEFcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoKS5zZXQoIDEwMCwgMC41ICk7IC8vIC0+IDAsIDAsIDEwMCwgMC41XG4gICAqL1xuICBzZXQ6IGZ1bmN0aW9uIHNldCAoIGgsIHMsIGwsIGEgKVxuICB7XG4gICAgc3dpdGNoICggdHJ1ZSApIHtcbiAgICAgIGNhc2UgdHlwZW9mIGggPT09ICdzdHJpbmcnOlxuICAgICAgICBoID0gcGFyc2UoIGggKTtcbiAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgY2FzZSB0eXBlb2YgaCA9PT0gJ29iamVjdCcgJiYgaCAhPT0gbnVsbDpcbiAgICAgICAgaWYgKCBoLnR5cGUgIT09IHRoaXMudHlwZSApIHtcbiAgICAgICAgICBoID0gaFsgdGhpcy50eXBlIF0oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IGhbIDAgXTtcbiAgICAgICAgdGhpc1sgMSBdID0gaFsgMSBdO1xuICAgICAgICB0aGlzWyAyIF0gPSBoWyAyIF07XG4gICAgICAgIHRoaXNbIDMgXSA9IGhbIDMgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBzd2l0Y2ggKCB2b2lkIDAgKSB7XG4gICAgICAgICAgY2FzZSBoOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBsID0gcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBzOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBsID0gTWF0aC5mbG9vciggaCApO1xuICAgICAgICAgICAgcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBsOlxuICAgICAgICAgICAgYSA9IHM7XG4gICAgICAgICAgICBsID0gTWF0aC5mbG9vciggaCApO1xuICAgICAgICAgICAgcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBhOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGggPSBNYXRoLmZsb29yKCBoICk7XG4gICAgICAgICAgICBzID0gTWF0aC5mbG9vciggcyApO1xuICAgICAgICAgICAgbCA9IE1hdGguZmxvb3IoIGwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IGg7XG4gICAgICAgIHRoaXNbIDEgXSA9IHM7XG4gICAgICAgIHRoaXNbIDIgXSA9IGw7XG4gICAgICAgIHRoaXNbIDMgXSA9IGE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCa0L7QvdCy0LXRgNGC0LjRgNGD0LXRgiDQsiB7QGxpbmsgdjYuUkdCQX0uXG4gICAqIEBtZXRob2QgdjYuSFNMQSNyZ2JhXG4gICAqIEByZXR1cm4ge3Y2LlJHQkF9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5yZ2JhKCk7IC8vIC0+IG5ldyBSR0JBKCAyNTUsIDAsIDI1NSwgMSApXG4gICAqL1xuICByZ2JhOiBmdW5jdGlvbiByZ2JhICgpXG4gIHtcbiAgICB2YXIgcmdiYSA9IG5ldyBSR0JBKCk7XG5cbiAgICB2YXIgaCA9IHRoaXNbIDAgXSAlIDM2MCAvIDM2MDtcbiAgICB2YXIgcyA9IHRoaXNbIDEgXSAqIDAuMDE7XG4gICAgdmFyIGwgPSB0aGlzWyAyIF0gKiAwLjAxO1xuXG4gICAgdmFyIHRyID0gaCArIDEgLyAzO1xuICAgIHZhciB0ZyA9IGg7XG4gICAgdmFyIHRiID0gaCAtIDEgLyAzO1xuXG4gICAgdmFyIHE7XG5cbiAgICBpZiAoIGwgPCAwLjUgKSB7XG4gICAgICBxID0gbCAqICggMSArIHMgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcSA9IGwgKyBzIC0gbCAqIHM7XG4gICAgfVxuXG4gICAgdmFyIHAgPSAyICogbCAtIHE7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuICAgIGlmICggdHIgPCAwICkge1xuICAgICAgKyt0cjtcbiAgICB9XG5cbiAgICBpZiAoIHRnIDwgMCApIHtcbiAgICAgICsrdGc7XG4gICAgfVxuXG4gICAgaWYgKCB0YiA8IDAgKSB7XG4gICAgICArK3RiO1xuICAgIH1cblxuICAgIGlmICggdHIgPiAxICkge1xuICAgICAgLS10cjtcbiAgICB9XG5cbiAgICBpZiAoIHRnID4gMSApIHtcbiAgICAgIC0tdGc7XG4gICAgfVxuXG4gICAgaWYgKCB0YiA+IDEgKSB7XG4gICAgICAtLXRiO1xuICAgIH1cblxuICAgIHJnYmFbIDAgXSA9IGZvbyggdHIsIHAsIHEgKTtcbiAgICByZ2JhWyAxIF0gPSBmb28oIHRnLCBwLCBxICk7XG4gICAgcmdiYVsgMiBdID0gZm9vKCB0YiwgcCwgcSApO1xuICAgIHJnYmFbIDMgXSA9IHRoaXNbIDMgXTtcblxuICAgIHJldHVybiByZ2JhO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5IU0xBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjbGVycFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBoXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHNcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgbFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB2YWx1ZVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAc2VlIHY2LkhTTEEjbGVycENvbG9yXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCA1MCwgMC4yNSApLmxlcnAoIDAsIDAsIDEwMCwgMC41ICk7IC8vIC0+IG5ldyBIU0xBKCAwLCAwLCA3NSwgMC4yNSApXG4gICAqL1xuICBsZXJwOiBmdW5jdGlvbiBsZXJwICggaCwgcywgbCwgdmFsdWUgKVxuICB7XG4gICAgdmFyIGNvbG9yID0gbmV3IEhTTEEoKTtcbiAgICBjb2xvclsgMCBdID0gaDtcbiAgICBjb2xvclsgMSBdID0gcztcbiAgICBjb2xvclsgMiBdID0gbDtcbiAgICByZXR1cm4gdGhpcy5sZXJwQ29sb3IoIGNvbG9yLCB2YWx1ZSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5IU0xBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyBgY29sb3JgLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjbGVycENvbG9yXG4gICAqIEBwYXJhbSAge1RDb2xvcn0gIGNvbG9yXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHZhbHVlXG4gICAqIEByZXR1cm4ge3Y2LkhTTEF9XG4gICAqIEBzZWUgdjYuSFNMQSNsZXJwXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBhID0gbmV3IEhTTEEoIDUwLCAwLjI1ICk7XG4gICAqIHZhciBiID0gbmV3IEhTTEEoIDEwMCwgMCApO1xuICAgKiB2YXIgYyA9IGEubGVycENvbG9yKCBiLCAwLjUgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDAsIDc1LCAwLjI1IClcbiAgICovXG4gIGxlcnBDb2xvcjogZnVuY3Rpb24gbGVycENvbG9yICggY29sb3IsIHZhbHVlIClcbiAge1xuICAgIHJldHVybiB0aGlzLnJnYmEoKS5sZXJwQ29sb3IoIGNvbG9yLCB2YWx1ZSApLmhzbGEoKTtcbiAgfSxcblxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSB7QGxpbmsgdjYuSFNMQX0gLSDQt9Cw0YLQtdC80L3QtdC90L3Ri9C5INC40LvQuCDQt9Cw0YHQstC10YLQu9C10L3QvdGL0Lkg0L3QsCBgcGVyY2VudGFnZWAg0L/RgNC+0YbQtdC90YLQvtCyLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjc2hhZGVcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgcGVyY2VudGFnZVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggMCwgMTAwLCA3NSwgMSApLnNoYWRlKCAtMTAgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDEwMCwgNjUsIDEgKVxuICAgKi9cbiAgc2hhZGU6IGZ1bmN0aW9uIHNoYWRlICggcGVyY2VudGFnZSApXG4gIHtcbiAgICB2YXIgaHNsYSA9IG5ldyBIU0xBKCk7XG4gICAgaHNsYVsgMCBdID0gdGhpc1sgMCBdO1xuICAgIGhzbGFbIDEgXSA9IHRoaXNbIDEgXTtcbiAgICBoc2xhWyAyIF0gPSBjbGFtcCggdGhpc1sgMiBdICsgcGVyY2VudGFnZSwgMCwgMTAwICk7XG4gICAgaHNsYVsgMyBdID0gdGhpc1sgMyBdO1xuICAgIHJldHVybiBoc2xhO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBIU0xBXG59O1xuXG4vKipcbiAqIEBtZW1iZXIge3N0cmluZ30gdjYuSFNMQSN0eXBlIGBcImhzbGFcImAuINCt0YLQviDRgdCy0L7QudGB0YLQstC+INC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0LrQvtC90LLQtdGA0YLQuNGA0L7QstCw0L3QuNGPINC80LXQttC00YMge0BsaW5rIHY2LlJHQkF9INC4IHtAbGluayB2Ni5IU0xBfS5cbiAqL1xuSFNMQS5wcm90b3R5cGUudHlwZSA9ICdoc2xhJztcblxuZnVuY3Rpb24gZm9vICggdCwgcCwgcSApXG57XG4gIGlmICggdCA8IDEgLyA2ICkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCAoIHAgKyAoIHEgLSBwICkgKiA2ICogdCApICogMjU1ICk7XG4gIH1cblxuICBpZiAoIHQgPCAwLjUgKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoIHEgKiAyNTUgKTtcbiAgfVxuXG4gIGlmICggdCA8IDIgLyAzICkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCAoIHAgKyAoIHEgLSBwICkgKiAoIDIgLyAzIC0gdCApICogNiApICogMjU1ICk7XG4gIH1cblxuICByZXR1cm4gTWF0aC5yb3VuZCggcCAqIDI1NSApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJHQkE7XG5cbnZhciBwYXJzZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3BhcnNlJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbnZhciBIU0xBICA9IHJlcXVpcmUoICcuL0hTTEEnICk7ICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbi8qKlxuICogUkdCQSDRhtCy0LXRgi5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5SR0JBXG4gKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXSBSZWQgY2hhbm5lbCB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2ddIEdyZWVuIGNoYW5uZWwgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtiXSBCbHVlIGNoYW5uZWwgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSBjaGFubmVsIHZhbHVlLlxuICogQHNlZSB2Ni5SR0JBI3NldFxuICogQGV4YW1wbGVcbiAqIHZhciBSR0JBID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29sb3IvUkdCQScgKTtcbiAqXG4gKiB2YXIgdHJhbnNwYXJlbnQgPSBuZXcgUkdCQSggJ3RyYW5zcGFyZW50JyApO1xuICogdmFyIG1hZ2VudGEgICAgID0gbmV3IFJHQkEoICdtYWdlbnRhJyApO1xuICogdmFyIGZ1Y2hzaWEgICAgID0gbmV3IFJHQkEoIDI1NSwgMCwgMjU1ICk7XG4gKiB2YXIgZ2hvc3QgICAgICAgPSBuZXcgUkdCQSggMjU1LCAwLjEgKTtcbiAqIHZhciB3aGl0ZSAgICAgICA9IG5ldyBSR0JBKCAyNTUgKTtcbiAqIHZhciBibGFjayAgICAgICA9IG5ldyBSR0JBKCk7XG4gKi9cbmZ1bmN0aW9uIFJHQkEgKCByLCBnLCBiLCBhIClcbntcbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMwIFwicmVkXCIgY2hhbm5lbCB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMxIFwiZ3JlZW5cIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5SR0JBIzIgXCJibHVlXCIgY2hhbm5lbCB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMzIFwiYWxwaGFcIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICB0aGlzLnNldCggciwgZywgYiwgYSApO1xufVxuXG5SR0JBLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINCy0L7RgdC/0YDQuNC90LjQvNCw0LXQvNGD0Y4g0Y/RgNC60L7RgdGC0YwgKHBlcmNlaXZlZCBicmlnaHRuZXNzKSDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjcGVyY2VpdmVkQnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzU5NjI0M1xuICAgKiBAc2VlIGh0dHA6Ly9hbGllbnJ5ZGVyZmxleC5jb20vaHNwLmh0bWxcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoICdtYWdlbnRhJyApLnBlcmNlaXZlZEJyaWdodG5lc3MoKTsgLy8gLT4gMTYzLjg3NTk0MzkzMzIwODJcbiAgICovXG4gIHBlcmNlaXZlZEJyaWdodG5lc3M6IGZ1bmN0aW9uIHBlcmNlaXZlZEJyaWdodG5lc3MgKClcbiAge1xuICAgIHZhciByID0gdGhpc1sgMCBdO1xuICAgIHZhciBnID0gdGhpc1sgMSBdO1xuICAgIHZhciBiID0gdGhpc1sgMiBdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoIDAuMjk5ICogciAqIHIgKyAwLjU4NyAqIGcgKiBnICsgMC4xMTQgKiBiICogYiApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQvtGC0L3QvtGB0LjRgtC10LvRjNC90YPRjiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjbHVtaW5hbmNlXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SZWxhdGl2ZV9sdW1pbmFuY2VcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoICdtYWdlbnRhJyApLmx1bWluYW5jZSgpOyAvLyAtPiA3Mi42MjRcbiAgICovXG4gIGx1bWluYW5jZTogZnVuY3Rpb24gbHVtaW5hbmNlICgpXG4gIHtcbiAgICByZXR1cm4gdGhpc1sgMCBdICogMC4yMTI2ICsgdGhpc1sgMSBdICogMC43MTUyICsgdGhpc1sgMiBdICogMC4wNzIyO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjYnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL0FFUlQvI2NvbG9yLWNvbnRyYXN0XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAnbWFnZW50YScgKS5icmlnaHRuZXNzKCk7IC8vIC0+IDEwNS4zMTVcbiAgICovXG4gIGJyaWdodG5lc3M6IGZ1bmN0aW9uIGJyaWdodG5lc3MgKClcbiAge1xuICAgIHJldHVybiAwLjI5OSAqIHRoaXNbIDAgXSArIDAuNTg3ICogdGhpc1sgMSBdICsgMC4xMTQgKiB0aGlzWyAyIF07XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIENTUy1jb2xvciDRgdGC0YDQvtC60YMuXG4gICAqIEBtZXRob2QgdjYuUkdCQSN0b1N0cmluZ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBleGFtcGxlXG4gICAqICcnICsgbmV3IFJHQkEoICdtYWdlbnRhJyApOyAvLyAtPiBcInJnYmEoMjU1LCAwLCAyNTUsIDEpXCJcbiAgICovXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiB0b1N0cmluZyAoKVxuICB7XG4gICAgcmV0dXJuICdyZ2JhKCcgKyB0aGlzWyAwIF0gKyAnLCAnICsgdGhpc1sgMSBdICsgJywgJyArIHRoaXNbIDIgXSArICcsICcgKyB0aGlzWyAzIF0gKyAnKSc7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIFIsIEcsIEIsIEEg0LfQvdCw0YfQtdC90LjRjy5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI3NldFxuICAgKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXSBSZWQgY2hhbm5lbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbZ10gR3JlZW4gY2hhbm5lbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbYl0gQmx1ZSBjaGFubmVsIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSBjaGFubmVsIHZhbHVlLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuUkdCQVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSgpXG4gICAqICAgLnNldCggJ21hZ2VudGEnICkgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmZjAwZmZmZicgKSAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmZjAwZmYnICkgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmMDA3JyApICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMCwgMC40N1xuICAgKiAgIC5zZXQoICcjZjAwJyApICAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAyNTUsIDAsIDAsIDFcbiAgICogICAuc2V0KCAnaHNsYSggMCwgMTAwJSwgNTAlLCAwLjQ3ICknICkgLy8gLT4gMjU1LCAwLCAwLCAwLjQ3XG4gICAqICAgLnNldCggJ3JnYiggMCwgMCwgMCApJyApICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDFcbiAgICogICAuc2V0KCAwICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMVxuICAgKiAgIC5zZXQoIDAsIDAsIDAgKSAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAwLCAwLCAwLCAxXG4gICAqICAgLnNldCggMCwgMCApICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDBcbiAgICogICAuc2V0KCAwLCAwLCAwLCAwICk7ICAgICAgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMFxuICAgKi9cbiAgc2V0OiBmdW5jdGlvbiBzZXQgKCByLCBnLCBiLCBhIClcbiAge1xuICAgIHN3aXRjaCAoIHRydWUgKSB7XG4gICAgICBjYXNlIHR5cGVvZiByID09PSAnc3RyaW5nJzpcbiAgICAgICAgciA9IHBhcnNlKCByICk7XG4gICAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgIGNhc2UgdHlwZW9mIHIgPT09ICdvYmplY3QnICYmIHIgIT09IG51bGw6XG4gICAgICAgIGlmICggci50eXBlICE9PSB0aGlzLnR5cGUgKSB7XG4gICAgICAgICAgciA9IHJbIHRoaXMudHlwZSBdKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzWyAwIF0gPSByWyAwIF07XG4gICAgICAgIHRoaXNbIDEgXSA9IHJbIDEgXTtcbiAgICAgICAgdGhpc1sgMiBdID0gclsgMiBdO1xuICAgICAgICB0aGlzWyAzIF0gPSByWyAzIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgc3dpdGNoICggdm9pZCAwICkge1xuICAgICAgICAgIGNhc2UgcjpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgYiA9IGcgPSByID0gMDsgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBnOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBiID0gZyA9IHIgPSBNYXRoLmZsb29yKCByICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGI6XG4gICAgICAgICAgICBhID0gZztcbiAgICAgICAgICAgIGIgPSBnID0gciA9IE1hdGguZmxvb3IoIHIgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgYTpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByID0gTWF0aC5mbG9vciggciApO1xuICAgICAgICAgICAgZyA9IE1hdGguZmxvb3IoIGcgKTtcbiAgICAgICAgICAgIGIgPSBNYXRoLmZsb29yKCBiICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzWyAwIF0gPSByO1xuICAgICAgICB0aGlzWyAxIF0gPSBnO1xuICAgICAgICB0aGlzWyAyIF0gPSBiO1xuICAgICAgICB0aGlzWyAzIF0gPSBhO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQmtC+0L3QstC10YDRgtC40YDRg9C10YIg0LIge0BsaW5rIHY2LkhTTEF9LlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjaHNsYVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSggMjU1LCAwLCAwLCAxICkuaHNsYSgpOyAvLyAtPiBuZXcgSFNMQSggMCwgMTAwLCA1MCwgMSApXG4gICAqL1xuICBoc2xhOiBmdW5jdGlvbiBoc2xhICgpXG4gIHtcbiAgICB2YXIgaHNsYSA9IG5ldyBIU0xBKCk7XG5cbiAgICB2YXIgciA9IHRoaXNbIDAgXSAvIDI1NTtcbiAgICB2YXIgZyA9IHRoaXNbIDEgXSAvIDI1NTtcbiAgICB2YXIgYiA9IHRoaXNbIDIgXSAvIDI1NTtcblxuICAgIHZhciBtYXggPSBNYXRoLm1heCggciwgZywgYiApO1xuICAgIHZhciBtaW4gPSBNYXRoLm1pbiggciwgZywgYiApO1xuXG4gICAgdmFyIGwgPSAoIG1heCArIG1pbiApICogNTA7XG4gICAgdmFyIGg7XG4gICAgdmFyIHM7XG5cbiAgICB2YXIgZGlmZiA9IG1heCAtIG1pbjtcblxuICAgIGlmICggZGlmZiApIHtcbiAgICAgIGlmICggbCA+IDUwICkge1xuICAgICAgICBzID0gZGlmZiAvICggMiAtIG1heCAtIG1pbiApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcyA9IGRpZmYgLyAoIG1heCArIG1pbiApO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKCBtYXggKSB7XG4gICAgICAgIGNhc2UgcjpcbiAgICAgICAgICBpZiAoIGcgPCBiICkge1xuICAgICAgICAgICAgaCA9IDEuMDQ3MiAqICggZyAtIGIgKSAvIGRpZmYgKyA2LjI4MzI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGggPSAxLjA0NzIgKiAoIGcgLSBiICkgLyBkaWZmO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIGc6XG4gICAgICAgICAgaCA9IDEuMDQ3MiAqICggYiAtIHIgKSAvIGRpZmYgKyAyLjA5NDQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaCA9IDEuMDQ3MiAqICggciAtIGcgKSAvIGRpZmYgKyA0LjE4ODg7XG4gICAgICB9XG5cbiAgICAgIGggPSBNYXRoLnJvdW5kKCBoICogMzYwIC8gNi4yODMyICk7XG4gICAgICBzID0gTWF0aC5yb3VuZCggcyAqIDEwMCApO1xuICAgIH0gZWxzZSB7XG4gICAgICBoID0gcyA9IDA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgfVxuXG4gICAgaHNsYVsgMCBdID0gaDtcbiAgICBoc2xhWyAxIF0gPSBzO1xuICAgIGhzbGFbIDIgXSA9IE1hdGgucm91bmQoIGwgKTtcbiAgICBoc2xhWyAzIF0gPSB0aGlzWyAzIF07XG5cbiAgICByZXR1cm4gaHNsYTtcbiAgfSxcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQG1ldGhvZCB2Ni5SR0JBI3JnYmFcbiAgICogQHNlZSB2Ni5SZW5kZXJlckdMI3ZlcnRpY2VzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHJnYmE6IGZ1bmN0aW9uIHJnYmEgKClcbiAge1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5SR0JBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjbGVycFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICByXG4gICAqIEBwYXJhbSAge251bWJlcn0gIGdcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgYlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB2YWx1ZVxuICAgKiBAcmV0dXJuIHt2Ni5SR0JBfVxuICAgKiBAc2VlIHY2LlJHQkEjbGVycENvbG9yXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAxMDAsIDAuMjUgKS5sZXJwKCAyMDAsIDIwMCwgMjAwLCAwLjUgKTsgLy8gLT4gbmV3IFJHQkEoIDE1MCwgMTUwLCAxNTAsIDAuMjUgKVxuICAgKi9cbiAgbGVycDogZnVuY3Rpb24gbGVycCAoIHIsIGcsIGIsIHZhbHVlIClcbiAge1xuICAgIHIgPSB0aGlzWyAwIF0gKyAoIHIgLSB0aGlzWyAwIF0gKSAqIHZhbHVlO1xuICAgIGcgPSB0aGlzWyAxIF0gKyAoIGcgLSB0aGlzWyAxIF0gKSAqIHZhbHVlO1xuICAgIGIgPSB0aGlzWyAyIF0gKyAoIGIgLSB0aGlzWyAyIF0gKSAqIHZhbHVlO1xuICAgIHJldHVybiBuZXcgUkdCQSggciwgZywgYiwgdGhpc1sgMyBdICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LlJHQkF9IC0g0LjQvdGC0LXRgNC/0L7Qu9C40YDQvtCy0LDQvdC90YvQuSDQvNC10LbQtNGDIGBjb2xvcmAuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNsZXJwQ29sb3JcbiAgICogQHBhcmFtICB7VENvbG9yfSAgY29sb3JcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgdmFsdWVcbiAgICogQHJldHVybiB7djYuUkdCQX1cbiAgICogQHNlZSB2Ni5SR0JBI2xlcnBcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIGEgPSBuZXcgUkdCQSggMTAwLCAwLjI1ICk7XG4gICAqIHZhciBiID0gbmV3IFJHQkEoIDIwMCwgMCApO1xuICAgKiB2YXIgYyA9IGEubGVycENvbG9yKCBiLCAwLjUgKTsgLy8gLT4gbmV3IFJHQkEoIDE1MCwgMTUwLCAxNTAsIDAuMjUgKVxuICAgKi9cbiAgbGVycENvbG9yOiBmdW5jdGlvbiBsZXJwQ29sb3IgKCBjb2xvciwgdmFsdWUgKVxuICB7XG4gICAgdmFyIHI7XG4gICAgdmFyIGc7XG4gICAgdmFyIGI7XG5cbiAgICBpZiAoIHR5cGVvZiBjb2xvciAhPT0gJ29iamVjdCcgKSB7XG4gICAgICBjb2xvciA9IHBhcnNlKCBjb2xvciApO1xuICAgIH1cblxuICAgIGlmICggY29sb3IudHlwZSAhPT0gJ3JnYmEnICkge1xuICAgICAgY29sb3IgPSBjb2xvci5yZ2JhKCk7XG4gICAgfVxuXG4gICAgciA9IGNvbG9yWyAwIF07XG4gICAgZyA9IGNvbG9yWyAxIF07XG4gICAgYiA9IGNvbG9yWyAyIF07XG5cbiAgICByZXR1cm4gdGhpcy5sZXJwKCByLCBnLCBiLCB2YWx1ZSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5SR0JBfSAtINC30LDRgtC10LzQvdC10L3QvdGL0Lkg0LjQu9C4INC30LDRgdCy0LXRgtC70LXQvdC90YvQuSDQvdCwIGBwZXJjZW50YWdlc2Ag0L/RgNC+0YbQtdC90YLQvtCyLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjc2hhZGVcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgcGVyY2VudGFnZVxuICAgKiBAcmV0dXJuIHt2Ni5SR0JBfVxuICAgKiBAc2VlIHY2LkhTTEEjc2hhZGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoKS5zaGFkZSggNTAgKTsgLy8gLT4gbmV3IFJHQkEoIDEyOCApXG4gICAqL1xuICBzaGFkZTogZnVuY3Rpb24gc2hhZGUgKCBwZXJjZW50YWdlcyApXG4gIHtcbiAgICByZXR1cm4gdGhpcy5oc2xhKCkuc2hhZGUoIHBlcmNlbnRhZ2VzICkucmdiYSgpO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBSR0JBXG59O1xuXG4vKipcbiAqIEBtZW1iZXIge3N0cmluZ30gdjYuUkdCQSN0eXBlIGBcInJnYmFcImAuINCt0YLQviDRgdCy0L7QudGB0YLQstC+INC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0LrQvtC90LLQtdGA0YLQuNGA0L7QstCw0L3QuNGPINC80LXQttC00YMge0BsaW5rIHY2LkhTTEF9INC4IHtAbGluayB2Ni5SR0JBfS5cbiAqL1xuUkdCQS5wcm90b3R5cGUudHlwZSA9ICdyZ2JhJztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogZXNsaW50IGtleS1zcGFjaW5nOiBbIFwiZXJyb3JcIiwgeyBcImFsaWduXCI6IHsgXCJiZWZvcmVDb2xvblwiOiBmYWxzZSwgXCJhZnRlckNvbG9uXCI6IHRydWUsIFwib25cIjogXCJ2YWx1ZVwiIH0gfSBdICovXG5cbnZhciBjb2xvcnMgPSB7XG4gIGFsaWNlYmx1ZTogICAgICAgICAgICAnZjBmOGZmZmYnLCBhbnRpcXVld2hpdGU6ICAgICAgICAgJ2ZhZWJkN2ZmJyxcbiAgYXF1YTogICAgICAgICAgICAgICAgICcwMGZmZmZmZicsIGFxdWFtYXJpbmU6ICAgICAgICAgICAnN2ZmZmQ0ZmYnLFxuICBhenVyZTogICAgICAgICAgICAgICAgJ2YwZmZmZmZmJywgYmVpZ2U6ICAgICAgICAgICAgICAgICdmNWY1ZGNmZicsXG4gIGJpc3F1ZTogICAgICAgICAgICAgICAnZmZlNGM0ZmYnLCBibGFjazogICAgICAgICAgICAgICAgJzAwMDAwMGZmJyxcbiAgYmxhbmNoZWRhbG1vbmQ6ICAgICAgICdmZmViY2RmZicsIGJsdWU6ICAgICAgICAgICAgICAgICAnMDAwMGZmZmYnLFxuICBibHVldmlvbGV0OiAgICAgICAgICAgJzhhMmJlMmZmJywgYnJvd246ICAgICAgICAgICAgICAgICdhNTJhMmFmZicsXG4gIGJ1cmx5d29vZDogICAgICAgICAgICAnZGViODg3ZmYnLCBjYWRldGJsdWU6ICAgICAgICAgICAgJzVmOWVhMGZmJyxcbiAgY2hhcnRyZXVzZTogICAgICAgICAgICc3ZmZmMDBmZicsIGNob2NvbGF0ZTogICAgICAgICAgICAnZDI2OTFlZmYnLFxuICBjb3JhbDogICAgICAgICAgICAgICAgJ2ZmN2Y1MGZmJywgY29ybmZsb3dlcmJsdWU6ICAgICAgICc2NDk1ZWRmZicsXG4gIGNvcm5zaWxrOiAgICAgICAgICAgICAnZmZmOGRjZmYnLCBjcmltc29uOiAgICAgICAgICAgICAgJ2RjMTQzY2ZmJyxcbiAgY3lhbjogICAgICAgICAgICAgICAgICcwMGZmZmZmZicsIGRhcmtibHVlOiAgICAgICAgICAgICAnMDAwMDhiZmYnLFxuICBkYXJrY3lhbjogICAgICAgICAgICAgJzAwOGI4YmZmJywgZGFya2dvbGRlbnJvZDogICAgICAgICdiODg2MGJmZicsXG4gIGRhcmtncmF5OiAgICAgICAgICAgICAnYTlhOWE5ZmYnLCBkYXJrZ3JlZW46ICAgICAgICAgICAgJzAwNjQwMGZmJyxcbiAgZGFya2toYWtpOiAgICAgICAgICAgICdiZGI3NmJmZicsIGRhcmttYWdlbnRhOiAgICAgICAgICAnOGIwMDhiZmYnLFxuICBkYXJrb2xpdmVncmVlbjogICAgICAgJzU1NmIyZmZmJywgZGFya29yYW5nZTogICAgICAgICAgICdmZjhjMDBmZicsXG4gIGRhcmtvcmNoaWQ6ICAgICAgICAgICAnOTkzMmNjZmYnLCBkYXJrcmVkOiAgICAgICAgICAgICAgJzhiMDAwMGZmJyxcbiAgZGFya3NhbG1vbjogICAgICAgICAgICdlOTk2N2FmZicsIGRhcmtzZWFncmVlbjogICAgICAgICAnOGZiYzhmZmYnLFxuICBkYXJrc2xhdGVibHVlOiAgICAgICAgJzQ4M2Q4YmZmJywgZGFya3NsYXRlZ3JheTogICAgICAgICcyZjRmNGZmZicsXG4gIGRhcmt0dXJxdW9pc2U6ICAgICAgICAnMDBjZWQxZmYnLCBkYXJrdmlvbGV0OiAgICAgICAgICAgJzk0MDBkM2ZmJyxcbiAgZGVlcHBpbms6ICAgICAgICAgICAgICdmZjE0OTNmZicsIGRlZXBza3libHVlOiAgICAgICAgICAnMDBiZmZmZmYnLFxuICBkaW1ncmF5OiAgICAgICAgICAgICAgJzY5Njk2OWZmJywgZG9kZ2VyYmx1ZTogICAgICAgICAgICcxZTkwZmZmZicsXG4gIGZlbGRzcGFyOiAgICAgICAgICAgICAnZDE5Mjc1ZmYnLCBmaXJlYnJpY2s6ICAgICAgICAgICAgJ2IyMjIyMmZmJyxcbiAgZmxvcmFsd2hpdGU6ICAgICAgICAgICdmZmZhZjBmZicsIGZvcmVzdGdyZWVuOiAgICAgICAgICAnMjI4YjIyZmYnLFxuICBmdWNoc2lhOiAgICAgICAgICAgICAgJ2ZmMDBmZmZmJywgZ2FpbnNib3JvOiAgICAgICAgICAgICdkY2RjZGNmZicsXG4gIGdob3N0d2hpdGU6ICAgICAgICAgICAnZjhmOGZmZmYnLCBnb2xkOiAgICAgICAgICAgICAgICAgJ2ZmZDcwMGZmJyxcbiAgZ29sZGVucm9kOiAgICAgICAgICAgICdkYWE1MjBmZicsIGdyYXk6ICAgICAgICAgICAgICAgICAnODA4MDgwZmYnLFxuICBncmVlbjogICAgICAgICAgICAgICAgJzAwODAwMGZmJywgZ3JlZW55ZWxsb3c6ICAgICAgICAgICdhZGZmMmZmZicsXG4gIGhvbmV5ZGV3OiAgICAgICAgICAgICAnZjBmZmYwZmYnLCBob3RwaW5rOiAgICAgICAgICAgICAgJ2ZmNjliNGZmJyxcbiAgaW5kaWFucmVkOiAgICAgICAgICAgICdjZDVjNWNmZicsIGluZGlnbzogICAgICAgICAgICAgICAnNGIwMDgyZmYnLFxuICBpdm9yeTogICAgICAgICAgICAgICAgJ2ZmZmZmMGZmJywga2hha2k6ICAgICAgICAgICAgICAgICdmMGU2OGNmZicsXG4gIGxhdmVuZGVyOiAgICAgICAgICAgICAnZTZlNmZhZmYnLCBsYXZlbmRlcmJsdXNoOiAgICAgICAgJ2ZmZjBmNWZmJyxcbiAgbGF3bmdyZWVuOiAgICAgICAgICAgICc3Y2ZjMDBmZicsIGxlbW9uY2hpZmZvbjogICAgICAgICAnZmZmYWNkZmYnLFxuICBsaWdodGJsdWU6ICAgICAgICAgICAgJ2FkZDhlNmZmJywgbGlnaHRjb3JhbDogICAgICAgICAgICdmMDgwODBmZicsXG4gIGxpZ2h0Y3lhbjogICAgICAgICAgICAnZTBmZmZmZmYnLCBsaWdodGdvbGRlbnJvZHllbGxvdzogJ2ZhZmFkMmZmJyxcbiAgbGlnaHRncmV5OiAgICAgICAgICAgICdkM2QzZDNmZicsIGxpZ2h0Z3JlZW46ICAgICAgICAgICAnOTBlZTkwZmYnLFxuICBsaWdodHBpbms6ICAgICAgICAgICAgJ2ZmYjZjMWZmJywgbGlnaHRzYWxtb246ICAgICAgICAgICdmZmEwN2FmZicsXG4gIGxpZ2h0c2VhZ3JlZW46ICAgICAgICAnMjBiMmFhZmYnLCBsaWdodHNreWJsdWU6ICAgICAgICAgJzg3Y2VmYWZmJyxcbiAgbGlnaHRzbGF0ZWJsdWU6ICAgICAgICc4NDcwZmZmZicsIGxpZ2h0c2xhdGVncmF5OiAgICAgICAnNzc4ODk5ZmYnLFxuICBsaWdodHN0ZWVsYmx1ZTogICAgICAgJ2IwYzRkZWZmJywgbGlnaHR5ZWxsb3c6ICAgICAgICAgICdmZmZmZTBmZicsXG4gIGxpbWU6ICAgICAgICAgICAgICAgICAnMDBmZjAwZmYnLCBsaW1lZ3JlZW46ICAgICAgICAgICAgJzMyY2QzMmZmJyxcbiAgbGluZW46ICAgICAgICAgICAgICAgICdmYWYwZTZmZicsIG1hZ2VudGE6ICAgICAgICAgICAgICAnZmYwMGZmZmYnLFxuICBtYXJvb246ICAgICAgICAgICAgICAgJzgwMDAwMGZmJywgbWVkaXVtYXF1YW1hcmluZTogICAgICc2NmNkYWFmZicsXG4gIG1lZGl1bWJsdWU6ICAgICAgICAgICAnMDAwMGNkZmYnLCBtZWRpdW1vcmNoaWQ6ICAgICAgICAgJ2JhNTVkM2ZmJyxcbiAgbWVkaXVtcHVycGxlOiAgICAgICAgICc5MzcwZDhmZicsIG1lZGl1bXNlYWdyZWVuOiAgICAgICAnM2NiMzcxZmYnLFxuICBtZWRpdW1zbGF0ZWJsdWU6ICAgICAgJzdiNjhlZWZmJywgbWVkaXVtc3ByaW5nZ3JlZW46ICAgICcwMGZhOWFmZicsXG4gIG1lZGl1bXR1cnF1b2lzZTogICAgICAnNDhkMWNjZmYnLCBtZWRpdW12aW9sZXRyZWQ6ICAgICAgJ2M3MTU4NWZmJyxcbiAgbWlkbmlnaHRibHVlOiAgICAgICAgICcxOTE5NzBmZicsIG1pbnRjcmVhbTogICAgICAgICAgICAnZjVmZmZhZmYnLFxuICBtaXN0eXJvc2U6ICAgICAgICAgICAgJ2ZmZTRlMWZmJywgbW9jY2FzaW46ICAgICAgICAgICAgICdmZmU0YjVmZicsXG4gIG5hdmFqb3doaXRlOiAgICAgICAgICAnZmZkZWFkZmYnLCBuYXZ5OiAgICAgICAgICAgICAgICAgJzAwMDA4MGZmJyxcbiAgb2xkbGFjZTogICAgICAgICAgICAgICdmZGY1ZTZmZicsIG9saXZlOiAgICAgICAgICAgICAgICAnODA4MDAwZmYnLFxuICBvbGl2ZWRyYWI6ICAgICAgICAgICAgJzZiOGUyM2ZmJywgb3JhbmdlOiAgICAgICAgICAgICAgICdmZmE1MDBmZicsXG4gIG9yYW5nZXJlZDogICAgICAgICAgICAnZmY0NTAwZmYnLCBvcmNoaWQ6ICAgICAgICAgICAgICAgJ2RhNzBkNmZmJyxcbiAgcGFsZWdvbGRlbnJvZDogICAgICAgICdlZWU4YWFmZicsIHBhbGVncmVlbjogICAgICAgICAgICAnOThmYjk4ZmYnLFxuICBwYWxldHVycXVvaXNlOiAgICAgICAgJ2FmZWVlZWZmJywgcGFsZXZpb2xldHJlZDogICAgICAgICdkODcwOTNmZicsXG4gIHBhcGF5YXdoaXA6ICAgICAgICAgICAnZmZlZmQ1ZmYnLCBwZWFjaHB1ZmY6ICAgICAgICAgICAgJ2ZmZGFiOWZmJyxcbiAgcGVydTogICAgICAgICAgICAgICAgICdjZDg1M2ZmZicsIHBpbms6ICAgICAgICAgICAgICAgICAnZmZjMGNiZmYnLFxuICBwbHVtOiAgICAgICAgICAgICAgICAgJ2RkYTBkZGZmJywgcG93ZGVyYmx1ZTogICAgICAgICAgICdiMGUwZTZmZicsXG4gIHB1cnBsZTogICAgICAgICAgICAgICAnODAwMDgwZmYnLCByZWQ6ICAgICAgICAgICAgICAgICAgJ2ZmMDAwMGZmJyxcbiAgcm9zeWJyb3duOiAgICAgICAgICAgICdiYzhmOGZmZicsIHJveWFsYmx1ZTogICAgICAgICAgICAnNDE2OWUxZmYnLFxuICBzYWRkbGVicm93bjogICAgICAgICAgJzhiNDUxM2ZmJywgc2FsbW9uOiAgICAgICAgICAgICAgICdmYTgwNzJmZicsXG4gIHNhbmR5YnJvd246ICAgICAgICAgICAnZjRhNDYwZmYnLCBzZWFncmVlbjogICAgICAgICAgICAgJzJlOGI1N2ZmJyxcbiAgc2Vhc2hlbGw6ICAgICAgICAgICAgICdmZmY1ZWVmZicsIHNpZW5uYTogICAgICAgICAgICAgICAnYTA1MjJkZmYnLFxuICBzaWx2ZXI6ICAgICAgICAgICAgICAgJ2MwYzBjMGZmJywgc2t5Ymx1ZTogICAgICAgICAgICAgICc4N2NlZWJmZicsXG4gIHNsYXRlYmx1ZTogICAgICAgICAgICAnNmE1YWNkZmYnLCBzbGF0ZWdyYXk6ICAgICAgICAgICAgJzcwODA5MGZmJyxcbiAgc25vdzogICAgICAgICAgICAgICAgICdmZmZhZmFmZicsIHNwcmluZ2dyZWVuOiAgICAgICAgICAnMDBmZjdmZmYnLFxuICBzdGVlbGJsdWU6ICAgICAgICAgICAgJzQ2ODJiNGZmJywgdGFuOiAgICAgICAgICAgICAgICAgICdkMmI0OGNmZicsXG4gIHRlYWw6ICAgICAgICAgICAgICAgICAnMDA4MDgwZmYnLCB0aGlzdGxlOiAgICAgICAgICAgICAgJ2Q4YmZkOGZmJyxcbiAgdG9tYXRvOiAgICAgICAgICAgICAgICdmZjYzNDdmZicsIHR1cnF1b2lzZTogICAgICAgICAgICAnNDBlMGQwZmYnLFxuICB2aW9sZXQ6ICAgICAgICAgICAgICAgJ2VlODJlZWZmJywgdmlvbGV0cmVkOiAgICAgICAgICAgICdkMDIwOTBmZicsXG4gIHdoZWF0OiAgICAgICAgICAgICAgICAnZjVkZWIzZmYnLCB3aGl0ZTogICAgICAgICAgICAgICAgJ2ZmZmZmZmZmJyxcbiAgd2hpdGVzbW9rZTogICAgICAgICAgICdmNWY1ZjVmZicsIHllbGxvdzogICAgICAgICAgICAgICAnZmZmZjAwZmYnLFxuICB5ZWxsb3dncmVlbjogICAgICAgICAgJzlhY2QzMmZmJywgdHJhbnNwYXJlbnQ6ICAgICAgICAgICcwMDAwMDAwMCdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY29sb3JzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlO1xuXG52YXIgUkdCQSAgID0gcmVxdWlyZSggJy4uL1JHQkEnICk7XG52YXIgSFNMQSAgID0gcmVxdWlyZSggJy4uL0hTTEEnICk7XG52YXIgY29sb3JzID0gcmVxdWlyZSggJy4vY29sb3JzJyApO1xuXG52YXIgcGFyc2VkID0gT2JqZWN0LmNyZWF0ZSggbnVsbCApO1xuXG52YXIgVFJBTlNQQVJFTlQgPSBbXG4gIDAsIDAsIDAsIDBcbl07XG5cbnZhciByZWdleHBzID0ge1xuICBoZXgzOiAvXiMoWzAtOWEtZl0pKFswLTlhLWZdKShbMC05YS1mXSkoWzAtOWEtZl0pPyQvLFxuICBoZXg6ICAvXiMoWzAtOWEtZl17Nn0pKFswLTlhLWZdezJ9KT8kLyxcbiAgcmdiOiAgL15yZ2JcXHMqXFwoXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccypcXCkkfF5cXHMqcmdiYVxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKlxcKSQvLFxuICBoc2w6ICAvXmhzbFxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFx1MDAyNVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqXFwpJHxeXFxzKmhzbGFcXHMqXFwoXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHUwMDI1XFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKlxcKSQvXG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHBhcnNlXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZ1xuICogQHJldHVybiB7bW9kdWxlOlwidjYuanNcIi5SR0JBfG1vZHVsZTpcInY2LmpzXCIuSFNMQX1cbiAqIEBleGFtcGxlXG4gKiBwYXJzZSggJyNmMGYwJyApOyAgICAgICAgICAgICAgICAgICAgIC8vIC0+IG5ldyBSR0JBKCAyNTUsIDAsIDI1NSwgMCApXG4gKiBwYXJzZSggJyMwMDAwMDBmZicgKTsgICAgICAgICAgICAgICAgIC8vIC0+IG5ldyBSR0JBKCAwLCAwLCAwLCAxIClcbiAqIHBhcnNlKCAnbWFnZW50YScgKTsgICAgICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDI1NSwgMCwgMjU1LCAxIClcbiAqIHBhcnNlKCAndHJhbnNwYXJlbnQnICk7ICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDAsIDAsIDAsIDAgKVxuICogcGFyc2UoICdoc2woIDAsIDEwMCUsIDUwJSApJyApOyAgICAgICAvLyAtPiBuZXcgSFNMQSggMCwgMTAwLCA1MCwgMSApXG4gKiBwYXJzZSggJ2hzbGEoIDAsIDEwMCUsIDUwJSwgMC41ICknICk7IC8vIC0+IG5ldyBIU0xBKCAwLCAxMDAsIDUwLCAwLjUgKVxuICovXG5mdW5jdGlvbiBwYXJzZSAoIHN0cmluZyApXG57XG4gIHZhciBjYWNoZSA9IHBhcnNlZFsgc3RyaW5nIF0gfHwgcGFyc2VkWyBzdHJpbmcgPSBzdHJpbmcudHJpbSgpLnRvTG93ZXJDYXNlKCkgXTtcblxuICBpZiAoICEgY2FjaGUgKSB7XG4gICAgaWYgKCAoIGNhY2hlID0gY29sb3JzWyBzdHJpbmcgXSApICkge1xuICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKCBwYXJzZUhleCggY2FjaGUgKSwgUkdCQSApO1xuICAgIH0gZWxzZSBpZiAoICggY2FjaGUgPSByZWdleHBzLmhleC5leGVjKCBzdHJpbmcgKSApIHx8ICggY2FjaGUgPSByZWdleHBzLmhleDMuZXhlYyggc3RyaW5nICkgKSApIHtcbiAgICAgIGNhY2hlID0gbmV3IENvbG9yRGF0YSggcGFyc2VIZXgoIGZvcm1hdEhleCggY2FjaGUgKSApLCBSR0JBICk7XG4gICAgfSBlbHNlIGlmICggKCBjYWNoZSA9IHJlZ2V4cHMucmdiLmV4ZWMoIHN0cmluZyApICkgKSB7XG4gICAgICBjYWNoZSA9IG5ldyBDb2xvckRhdGEoIGNvbXBhY3RNYXRjaCggY2FjaGUgKSwgUkdCQSApO1xuICAgIH0gZWxzZSBpZiAoICggY2FjaGUgPSByZWdleHBzLmhzbC5leGVjKCBzdHJpbmcgKSApICkge1xuICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKCBjb21wYWN0TWF0Y2goIGNhY2hlICksIEhTTEEgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgU3ludGF4RXJyb3IoIHN0cmluZyArICcgaXMgbm90IGEgdmFsaWQgc3ludGF4JyApO1xuICAgIH1cblxuICAgIHBhcnNlZFsgc3RyaW5nIF0gPSBjYWNoZTtcbiAgfVxuXG4gIHJldHVybiBuZXcgY2FjaGUuY29sb3IoIGNhY2hlWyAwIF0sIGNhY2hlWyAxIF0sIGNhY2hlWyAyIF0sIGNhY2hlWyAzIF0gKTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBmb3JtYXRIZXhcbiAqIEBwYXJhbSAge2FycmF5PHN0cmluZz8+fSBtYXRjaFxuICogQHJldHVybiB7c3RyaW5nfVxuICogQGV4YW1wbGVcbiAqIGZvcm1hdEhleCggWyAnIzAwMDAwMGZmJywgJzAwMDAwMCcsICdmZicgXSApOyAvLyAtPiAnMDAwMDAwZmYnXG4gKiBmb3JtYXRIZXgoIFsgJyMwMDA3JywgJzAnLCAnMCcsICcwJywgJzcnIF0gKTsgLy8gLT4gJzAwMDAwMDc3J1xuICogZm9ybWF0SGV4KCBbICcjMDAwJywgJzAnLCAnMCcsICcwJywgbnVsbCBdICk7IC8vIC0+ICcwMDAwMDBmZidcbiAqL1xuZnVuY3Rpb24gZm9ybWF0SGV4ICggbWF0Y2ggKVxue1xuICB2YXIgcjtcbiAgdmFyIGc7XG4gIHZhciBiO1xuICB2YXIgYTtcblxuICBpZiAoIG1hdGNoLmxlbmd0aCA9PT0gMyApIHtcbiAgICByZXR1cm4gbWF0Y2hbIDEgXSArICggbWF0Y2hbIDIgXSB8fCAnZmYnICk7XG4gIH1cblxuICByID0gbWF0Y2hbIDEgXTtcbiAgZyA9IG1hdGNoWyAyIF07XG4gIGIgPSBtYXRjaFsgMyBdO1xuICBhID0gbWF0Y2hbIDQgXSB8fCAnZic7XG5cbiAgcmV0dXJuIHIgKyByICsgZyArIGcgKyBiICsgYiArIGEgKyBhO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHBhcnNlSGV4XG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICBoZXhcbiAqIEByZXR1cm4ge2FycmF5PG51bWJlcj59XG4gKiBAZXhhbXBsZVxuICogcGFyc2VIZXgoICcwMDAwMDAwMCcgKTsgLy8gLT4gWyAwLCAwLCAwLCAwIF1cbiAqIHBhcnNlSGV4KCAnZmYwMGZmZmYnICk7IC8vIC0+IFsgMjU1LCAwLCAyNTUsIDEgXVxuICovXG5mdW5jdGlvbiBwYXJzZUhleCAoIGhleCApXG57XG4gIGlmICggaGV4ID09IDAgKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgcmV0dXJuIFRSQU5TUEFSRU5UO1xuICB9XG5cbiAgaGV4ID0gcGFyc2VJbnQoIGhleCwgMTYgKTtcblxuICByZXR1cm4gW1xuICAgIC8vIFJcbiAgICBoZXggPj4gMjQgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEdcbiAgICBoZXggPj4gMTYgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEJcbiAgICBoZXggPj4gOCAgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEFcbiAgICAoIGhleCAmIDI1NSApIC8gMjU1IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICBdO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNvbXBhY3RNYXRjaFxuICogQHBhcmFtICB7YXJyYXk8c3RyaW5nPz59IG1hdGNoXG4gKiBAcmV0dXJuIHthcnJheTxudW1iZXI+fVxuICovXG5mdW5jdGlvbiBjb21wYWN0TWF0Y2ggKCBtYXRjaCApXG57XG4gIGlmICggbWF0Y2hbIDcgXSApIHtcbiAgICByZXR1cm4gW1xuICAgICAgTnVtYmVyKCBtYXRjaFsgNCBdICksXG4gICAgICBOdW1iZXIoIG1hdGNoWyA1IF0gKSxcbiAgICAgIE51bWJlciggbWF0Y2hbIDYgXSApLFxuICAgICAgTnVtYmVyKCBtYXRjaFsgNyBdIClcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBOdW1iZXIoIG1hdGNoWyAxIF0gKSxcbiAgICBOdW1iZXIoIG1hdGNoWyAyIF0gKSxcbiAgICBOdW1iZXIoIG1hdGNoWyAzIF0gKVxuICBdO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAY29uc3RydWN0b3IgQ29sb3JEYXRhXG4gKiBAcGFyYW0ge2FycmF5PG51bWJlcj59IG1hdGNoXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSAgICAgIGNvbG9yXG4gKi9cbmZ1bmN0aW9uIENvbG9yRGF0YSAoIG1hdGNoLCBjb2xvciApXG57XG4gIHRoaXNbIDAgXSA9IG1hdGNoWyAwIF07XG4gIHRoaXNbIDEgXSA9IG1hdGNoWyAxIF07XG4gIHRoaXNbIDIgXSA9IG1hdGNoWyAyIF07XG4gIHRoaXNbIDMgXSA9IG1hdGNoWyAzIF07XG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQmtC+0L3RgdGC0LDQvdGC0YsuXG4gKiBAbmFtZXNwYWNlIHtvYmplY3R9IHY2LmNvbnN0YW50c1xuICogQGV4YW1wbGVcbiAqIHZhciBjb25zdGFudHMgPSByZXF1aXJlKCAndjYuanMvY29yZS9jb25zdGFudHMnICk7XG4gKi9cblxudmFyIF9jb25zdGFudHMgPSB7fTtcbnZhciBfY291bnRlciAgID0gMDtcblxuLyoqXG4gKiDQlNC+0LHQsNCy0LvRj9C10YIg0LrQvtC90YHRgtCw0L3RgtGDLlxuICogQG1ldGhvZCB2Ni5jb25zdGFudHMuYWRkXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGtleSDQmNC80Y8g0LrQvtC90YHRgtCw0L3RgtGLLlxuICogQHJldHVybiB7dm9pZH0gICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogY29uc3RhbnRzLmFkZCggJ0NVU1RPTV9DT05TVEFOVCcgKTtcbiAqL1xuZnVuY3Rpb24gYWRkICgga2V5IClcbntcbiAgaWYgKCB0eXBlb2YgX2NvbnN0YW50c1sga2V5IF0gIT09ICd1bmRlZmluZWQnICkge1xuICAgIHRocm93IEVycm9yKCAnQ2Fubm90IHJlLXNldCAoYWRkKSBleGlzdGluZyBjb25zdGFudDogJyArIGtleSApO1xuICB9XG5cbiAgX2NvbnN0YW50c1sga2V5IF0gPSArK19jb3VudGVyO1xufVxuXG4vKipcbiAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC60L7QvdGB0YLQsNC90YLRgy5cbiAqIEBtZXRob2QgdjYuY29uc3RhbnRzLmdldFxuICogQHBhcmFtICB7c3RyaW5nfSAgIGtleSDQmNC80Y8g0LrQvtC90YHRgtCw0L3RgtGLLlxuICogQHJldHVybiB7Y29uc3RhbnR9ICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQutC+0L3RgdGC0LDQvdGC0YMuXG4gKiBAZXhhbXBsZVxuICogY29uc3RhbnRzLmdldCggJ0NVU1RPTV9DT05TVEFOVCcgKTtcbiAqL1xuZnVuY3Rpb24gZ2V0ICgga2V5IClcbntcbiAgaWYgKCB0eXBlb2YgX2NvbnN0YW50c1sga2V5IF0gPT09ICd1bmRlZmluZWQnICkge1xuICAgIHRocm93IFJlZmVyZW5jZUVycm9yKCAnQ2Fubm90IGdldCB1bmtub3duIGNvbnN0YW50OiAnICsga2V5ICk7XG4gIH1cblxuICByZXR1cm4gX2NvbnN0YW50c1sga2V5IF07XG59XG5cbltcbiAgJ0FVVE8nLFxuICAnR0wnLFxuICAnMkQnLFxuICAnTEVGVCcsXG4gICdUT1AnLFxuICAnQ0VOVEVSJyxcbiAgJ01JRERMRScsXG4gICdSSUdIVCcsXG4gICdCT1RUT00nLFxuICAnUEVSQ0VOVCdcbl0uZm9yRWFjaCggYWRkICk7XG5cbmV4cG9ydHMuYWRkID0gYWRkO1xuZXhwb3J0cy5nZXQgPSBnZXQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBMaWdodEVtaXR0ZXIgPSByZXF1aXJlKCAnbGlnaHRfZW1pdHRlcicgKTtcblxuLyoqXG4gKiBAYWJzdHJhY3RcbiAqIEBjb25zdHJ1Y3RvciB2Ni5BYnN0cmFjdEltYWdlXG4gKiBAZXh0ZW5kcyBMaWdodEVtaXR0ZXJcbiAqIEBzZWUgdjYuQ29tcG91bmRlZEltYWdlXG4gKiBAc2VlIHY2LkltYWdlXG4gKi9cbmZ1bmN0aW9uIEFic3RyYWN0SW1hZ2UgKClcbntcbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2Ujc3ggU291cmNlIFguXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI3N5IFNvdXJjZSBZLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNzdyBTb3VyY2UgV2lkdGguXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI3NoIFNvdXJjZSBIZWlnaHQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI2R3IERlc3RpbmF0aW9uIFdpZHRoLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNkaCBEZXN0aW5hdGlvbiBIZWlnaHQuXG4gICAqL1xuXG4gIHRocm93IEVycm9yKCAnQ2Fubm90IGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgYWJzdHJhY3QgY2xhc3MgKG5ldyB2Ni5BYnN0cmFjdEltYWdlKScgKTtcbn1cblxuQWJzdHJhY3RJbWFnZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBMaWdodEVtaXR0ZXIucHJvdG90eXBlICk7XG5BYnN0cmFjdEltYWdlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEFic3RyYWN0SW1hZ2U7XG5cbi8qKlxuICogQHZpcnR1YWxcbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RJbWFnZSNnZXRcbiAqIEByZXR1cm4ge3Y2LkltYWdlfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gQWJzdHJhY3RJbWFnZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEFic3RyYWN0SW1hZ2UgPSByZXF1aXJlKCAnLi9BYnN0cmFjdEltYWdlJyApO1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvciB2Ni5Db21wb3VuZGVkSW1hZ2VcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0SW1hZ2VcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2UgdjYuQ29tcG91bmRlZEltYWdlIG9yIHY2LkltYWdlLlxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzeCAgICBTb3VyY2UgWC5cbiAqIEBwYXJhbSB7bnVibWVyfSAgICAgICAgICAgc3kgICAgU291cmNlIFkuXG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIHN3ICAgIFNvdXJjZSBXaWR0aC5cbiAqIEBwYXJhbSB7bnVibWVyfSAgICAgICAgICAgc2ggICAgU291cmNlIEhlaWdodC5cbiAqIEBwYXJhbSB7bnVibWVyfSAgICAgICAgICAgZHcgICAgRGVzdGluYXRpb24gV2lkdGguXG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIGRoICAgIERlc3RpbmF0aW9uIEhlaWdodC5cbiAqL1xuZnVuY3Rpb24gQ29tcG91bmRlZEltYWdlICggaW1hZ2UsIHN4LCBzeSwgc3csIHNoLCBkdywgZGggKVxue1xuICB0aGlzLmltYWdlID0gaW1hZ2U7XG4gIHRoaXMuc3ggICAgPSBzeDtcbiAgdGhpcy5zeSAgICA9IHN5O1xuICB0aGlzLnN3ICAgID0gc3c7XG4gIHRoaXMuc2ggICAgPSBzaDtcbiAgdGhpcy5kdyAgICA9IGR3O1xuICB0aGlzLmRoICAgID0gZGg7XG59XG5cbkNvbXBvdW5kZWRJbWFnZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdEltYWdlLnByb3RvdHlwZSApO1xuQ29tcG91bmRlZEltYWdlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENvbXBvdW5kZWRJbWFnZTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuQ29tcG91bmRlZEltYWdlI2dldFxuICovXG5Db21wb3VuZGVkSW1hZ2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAoKVxue1xuICByZXR1cm4gdGhpcy5pbWFnZS5nZXQoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG91bmRlZEltYWdlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29tcG91bmRlZEltYWdlID0gcmVxdWlyZSggJy4vQ29tcG91bmRlZEltYWdlJyApO1xudmFyIEFic3RyYWN0SW1hZ2UgICA9IHJlcXVpcmUoICcuL0Fic3RyYWN0SW1hZ2UnICk7XG5cbi8qKlxuICog0JrQu9Cw0YHRgSDQutCw0YDRgtC40L3QutC4LlxuICogQGNvbnN0cnVjdG9yIHY2LkltYWdlXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdEltYWdlXG4gKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltYWdlIERPTSDRjdC70LXQvNC10L3RgiDQutCw0YDRgtC40L3QutC4IChJTUcpLlxuICogQGZpcmVzIGNvbXBsZXRlXG4gKiBAc2VlIHY2LkltYWdlLmZyb21VUkxcbiAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNiYWNrZ3JvdW5kSW1hZ2VcbiAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNpbWFnZVxuICogQGV4YW1wbGVcbiAqIHZhciBJbWFnZSA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2ltYWdlL0ltYWdlJyApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRpbmcgYW4gaW1hZ2Ugd2l0aCBhbiBET00gaW1hZ2U8L2NhcHRpb24+XG4gKiAvLyBIVE1MOiA8aW1nIHNyYz1cImltYWdlLnBuZ1wiIGlkPVwiaW1hZ2VcIiAvPlxuICogdmFyIGltYWdlID0gbmV3IEltYWdlKCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2ltYWdlJyApICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyBhbiBpbWFnZSB3aXRoIGEgVVJMPC9jYXB0aW9uPlxuICogdmFyIGltYWdlID0gSW1hZ2UuZnJvbVVSTCggJ2ltYWdlLnBuZycgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkZpcmVzIFwiY29tcGxldGVcIiBldmVudDwvY2FwdGlvbj5cbiAqIGltYWdlLm9uY2UoICdjb21wbGV0ZScsIGZ1bmN0aW9uICgpXG4gKiB7XG4gKiAgIGNvbnNvbGUubG9nKCAnVGhlIGltYWdlIGlzIGxvYWRlZCEnICk7XG4gKiB9ICk7XG4gKi9cbmZ1bmN0aW9uIEltYWdlICggaW1hZ2UgKVxue1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKCAhIGltYWdlLnNyYyApIHtcbiAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjcmVhdGUgdjYuSW1hZ2UgZnJvbSBIVE1MSW1hZ2VFbGVtZW50IHdpdGggbm8gXCJzcmNcIiBhdHRyaWJ1dGUgKG5ldyB2Ni5JbWFnZSknICk7XG4gIH1cblxuICAvKipcbiAgICogQG1lbWJlciB7SFRNTEltYWdlRWxlbWVudH0gdjYuSW1hZ2UjaW1hZ2UgRE9NINGN0LXQu9C10LzQtdC90YIg0LrQsNGA0YLQuNC90LrQuC5cbiAgICovXG4gIHRoaXMuaW1hZ2UgPSBpbWFnZTtcblxuICBpZiAoIHRoaXMuaW1hZ2UuY29tcGxldGUgKSB7XG4gICAgdGhpcy5faW5pdCgpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBmdW5jdGlvbiBvbmxvYWQgKClcbiAgICB7XG4gICAgICBzZWxmLmltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdsb2FkJywgb25sb2FkICk7XG4gICAgICBzZWxmLl9pbml0KCk7XG4gICAgfSwgZmFsc2UgKTtcbiAgfVxufVxuXG5JbWFnZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdEltYWdlLnByb3RvdHlwZSApO1xuSW1hZ2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gSW1hZ2U7XG5cbi8qKlxuICog0JjQvdC40YbQuNCw0LvQuNC30LjRgNGD0LXRgiDQutCw0YDRgtC40L3QutGDINC/0L7RgdC70LUg0LXQtSDQt9Cw0LPRgNGD0LfQutC4LlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgdjYuSW1hZ2UjX2luaXRcbiAqIEByZXR1cm4ge3ZvaWR9INCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICovXG5JbWFnZS5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbiBfaW5pdCAoKVxue1xuICB0aGlzLnN4ID0gMDtcbiAgdGhpcy5zeSA9IDA7XG4gIHRoaXMuc3cgPSB0aGlzLmR3ID0gdGhpcy5pbWFnZS53aWR0aDsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gIHRoaXMuc2ggPSB0aGlzLmRoID0gdGhpcy5pbWFnZS5oZWlnaHQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gIHRoaXMuZW1pdCggJ2NvbXBsZXRlJyApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuSW1hZ2UjZ2V0XG4gKi9cbkltYWdlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQgKClcbntcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCe0L/RgNC10LTQtdC70Y/QtdGCLCDQt9Cw0LPRgNGD0LbQtdC90LAg0LvQuCDQutCw0YDRgtC40L3QutCwLlxuICogQG1ldGhvZCB2Ni5JbWFnZSNjb21wbGV0ZVxuICogQHJldHVybiB7Ym9vbGVhbn0gYHRydWVgLCDQtdGB0LvQuCDQt9Cw0LPRgNGD0LbQtdC90LAuXG4gKiBAZXhhbXBsZVxuICogdmFyIGltYWdlID0gSW1hZ2UuZnJvbVVSTCggJ2ltYWdlLnBuZycgKTtcbiAqXG4gKiBpZiAoICEgaW1hZ2UuY29tcGxldGUoKSApIHtcbiAqICAgaW1hZ2Uub25jZSggJ2NvbXBsZXRlJywgZnVuY3Rpb24gKClcbiAqICAge1xuICogICAgIGNvbnNvbGUubG9nKCAnVGhlIGltYWdlIGlzIGxvYWRlZCEnLCBpbWFnZS5jb21wbGV0ZSgpICk7XG4gKiAgIH0gKTtcbiAqIH1cbiAqL1xuSW1hZ2UucHJvdG90eXBlLmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGUgKClcbntcbiAgcmV0dXJuIEJvb2xlYW4oIHRoaXMuaW1hZ2Uuc3JjICkgJiYgdGhpcy5pbWFnZS5jb21wbGV0ZTtcbn07XG5cbi8qKlxuICog0JLQvtC30LLRgNCw0YnQsNC10YIgVVJMINC60LDRgNGC0LjQvdC60LguXG4gKiBAbWV0aG9kIHY2LkltYWdlI3NyY1xuICogQHJldHVybiB7c3RyaW5nfSBVUkwg0LrQsNGA0YLQuNC90LrQuC5cbiAqIEBleGFtcGxlXG4gKiBJbWFnZS5mcm9tVVJMKCAnaW1hZ2UucG5nJyApLnNyYygpOyAvLyAtPiBcImltYWdlLnBuZ1wiXG4gKi9cbkltYWdlLnByb3RvdHlwZS5zcmMgPSBmdW5jdGlvbiBzcmMgKClcbntcbiAgcmV0dXJuIHRoaXMuaW1hZ2Uuc3JjO1xufTtcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRg9GOIHtAbGluayB2Ni5JbWFnZX0g0LjQtyBVUkwuXG4gKiBAbWV0aG9kIHY2LkltYWdlLmZyb21VUkxcbiAqIEBwYXJhbSAge3N0cmluZ30gICBzcmMgVVJMINC60LDRgNGC0LjQvdC60LguXG4gKiBAcmV0dXJuIHt2Ni5JbWFnZX0gICAgINCd0L7QstCw0Y8ge0BsaW5rIHY2LkltYWdlfS5cbiAqIEBleGFtcGxlXG4gKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnaW1hZ2UucG5nJyApO1xuICovXG5JbWFnZS5mcm9tVVJMID0gZnVuY3Rpb24gZnJvbVVSTCAoIHNyYyApXG57XG4gIHZhciBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdpbWcnICk7XG4gIGltYWdlLnNyYyA9IHNyYztcbiAgcmV0dXJuIG5ldyBJbWFnZSggaW1hZ2UgKTtcbn07XG5cbi8qKlxuICog0J/RgNC+0L/QvtGA0YbQuNC+0L3QsNC70YzQvdC+INGA0LDRgdGC0Y/Qs9C40LLQsNC10YIg0LjQu9C4INGB0LbQuNC80LDQtdGCINC60LDRgNGC0LjQvdC60YMuXG4gKiBAbWV0aG9kIHY2LkltYWdlLnN0cmV0Y2hcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0SW1hZ2V9ICAgaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgZHcgICAg0J3QvtCy0YvQuSBcIkRlc3RpbmF0aW9uIFdpZHRoXCIuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIGRoICAgINCd0L7QstGL0LkgXCJEZXN0aW5hdGlvbiBIZWlnaHRcIi5cbiAqIEByZXR1cm4ge3Y2LkNvbXBvdW5kZWRJbWFnZX0gICAgICAg0J3QvtCy0LDRjyDQutCw0YDRgtC40L3QutCwLlxuICogQGV4YW1wbGVcbiAqIEltYWdlLnN0cmV0Y2goIGltYWdlLCA2MDAsIDQwMCApO1xuICovXG5JbWFnZS5zdHJldGNoID0gZnVuY3Rpb24gc3RyZXRjaCAoIGltYWdlLCBkdywgZGggKVxue1xuICB2YXIgdmFsdWUgPSBkaCAvIGltYWdlLmRoICogaW1hZ2UuZHc7XG5cbiAgLy8gU3RyZXRjaCBEVy5cbiAgaWYgKCB2YWx1ZSA8IGR3ICkge1xuICAgIGRoID0gZHcgLyBpbWFnZS5kdyAqIGltYWdlLmRoO1xuXG4gIC8vIFN0cmV0Y2ggREguXG4gIH0gZWxzZSB7XG4gICAgZHcgPSB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiBuZXcgQ29tcG91bmRlZEltYWdlKCBpbWFnZS5nZXQoKSwgaW1hZ2Uuc3gsIGltYWdlLnN5LCBpbWFnZS5zdywgaW1hZ2Uuc2gsIGR3LCBkaCApO1xufTtcblxuLyoqXG4gKiDQntCx0YDQtdC30LDQtdGCINC60LDRgNGC0LjQvdC60YMuXG4gKiBAbWV0aG9kIHY2LkltYWdlLmN1dFxuICogQHBhcmFtICB7djYuQWJzdHJhY3RJbWFnZX0gICBpbWFnZSDQmtCw0YDRgtC40L3QutCwLCDQutC+0YLQvtGA0YPRjiDQvdCw0LTQviDQvtCx0YDQtdC30LDRgtGMLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBzeCAgICBYINC60L7QvtGA0LTQuNC90LDRgtCwLCDQvtGC0LrRg9C00LAg0L3QsNC00L4g0L7QsdGA0LXQt9Cw0YLRjC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgc3kgICAgWSDQutC+0L7RgNC00LjQvdCw0YLQsCwg0L7RgtC60YPQtNCwINC90LDQtNC+INC+0LHRgNC10LfQsNGC0YwuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIHN3ICAgINCd0L7QstCw0Y8g0YjQuNGA0LjQvdCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBzaCAgICDQndC+0LLQsNGPINCy0YvRgdC+0YLQsC5cbiAqIEByZXR1cm4ge3Y2LkNvbXBvdW5kZWRJbWFnZX0gICAgICAg0J7QsdGA0LXQt9Cw0L3QvdCw0Y8g0LrQsNGA0YLQuNC90LrQsC5cbiAqIEBleGFtcGxlXG4gKiBJbWFnZS5jdXQoIGltYWdlLCAxMCwgMjAsIDMwLCA0MCApO1xuICovXG5JbWFnZS5jdXQgPSBmdW5jdGlvbiBjdXQgKCBpbWFnZSwgc3gsIHN5LCBkdywgZGggKVxue1xuICB2YXIgc3cgPSBpbWFnZS5zdyAvIGltYWdlLmR3ICogZHc7XG4gIHZhciBzaCA9IGltYWdlLnNoIC8gaW1hZ2UuZGggKiBkaDtcblxuICBzeCArPSBpbWFnZS5zeDtcblxuICBpZiAoIHN4ICsgc3cgPiBpbWFnZS5zeCArIGltYWdlLnN3ICkge1xuICAgIHRocm93IEVycm9yKCAnQ2Fubm90IGN1dCB0aGUgaW1hZ2UgYmVjYXVzZSB0aGUgbmV3IGltYWdlIFggb3IgVyBpcyBvdXQgb2YgYm91bmRzICh2Ni5JbWFnZS5jdXQpJyApO1xuICB9XG5cbiAgc3kgKz0gaW1hZ2Uuc3k7XG5cbiAgaWYgKCBzeSArIHNoID4gaW1hZ2Uuc3kgKyBpbWFnZS5zaCApIHtcbiAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjdXQgdGhlIGltYWdlIGJlY2F1c2UgdGhlIG5ldyBpbWFnZSBZIG9yIEggaXMgb3V0IG9mIGJvdW5kcyAodjYuSW1hZ2UuY3V0KScgKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgQ29tcG91bmRlZEltYWdlKCBpbWFnZS5nZXQoKSwgc3gsIHN5LCBzdywgc2gsIGR3LCBkaCApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaWYgKCB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSAnZnVuY3Rpb24nICkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEZsb2F0MzJBcnJheTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBBcnJheTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjcmVhdGVBcnJheVxuICogQHBhcmFtICB7QXJyYXkuPGFueT59ICAgICAgICAgICAgICAgICAgICBhcnJheVxuICogQHJldHVybiB7QXJyYXkuPGFueT58RmxvYXQzMkFycmF5Ljxhbnk+fVxuICovXG5cbmlmICggdHlwZW9mIEZsb2F0MzJBcnJheSA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVBcnJheSAoIGFycmF5IClcbiAge1xuICAgIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KCBhcnJheSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gIH07XG59IGVsc2Uge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUFycmF5ICggYXJyYXkgKVxuICB7XG4gICAgcmV0dXJuIGFycmF5O1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX0Zsb2F0MzJBcnJheSA9IHJlcXVpcmUoICcuL19GbG9hdDMyQXJyYXknICk7XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0LzQsNGB0YHQuNCyINGBINC60L7QvtGA0LTQuNC90LDRgtCw0LzQuCDQstGB0LXRhSDRgtC+0YfQtdC6INC90YPQttC90L7Qs9C+INC/0L7Qu9C40LPQvtC90LAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjcmVhdGVQb2x5Z29uXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgIHNpZGVzINCa0L7Qu9C40YfQtdGB0YLQstC+INGB0YLQvtGA0L7QvSDQv9C+0LvQuNCz0L7QvdCwLlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSAgICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQvNCw0YHRgdC40LIgKEZsb2F0MzJBcnJheSkg0LrQvtGC0L7RgNGL0Lkg0LLRi9Cz0LvRj9C00LjRgiDRgtCw0Lo6IGBbIHgxLCB5MSwgeDIsIHkyIF1gLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICDQktGB0LUg0LfQvdCw0YfQtdC90LjRjyDQutC+0YLQvtGA0L7Qs9C+INC90L7RgNC80LDQu9C40LfQvtCy0LDQvdC90YsuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVBvbHlnb24gKCBzaWRlcyApXG57XG4gIHZhciBpICAgICAgICA9IE1hdGguZmxvb3IoIHNpZGVzICk7XG4gIHZhciBzdGVwICAgICA9IE1hdGguUEkgKiAyIC8gc2lkZXM7XG4gIHZhciB2ZXJ0aWNlcyA9IG5ldyBfRmxvYXQzMkFycmF5KCBpICogMiArIDIgKTtcblxuICBmb3IgKCA7IGkgPj0gMDsgLS1pICkge1xuICAgIHZlcnRpY2VzWyAgICAgaSAqIDIgXSA9IE1hdGguY29zKCBzdGVwICogaSApO1xuICAgIHZlcnRpY2VzWyAxICsgaSAqIDIgXSA9IE1hdGguc2luKCBzdGVwICogaSApO1xuICB9XG5cbiAgcmV0dXJuIHZlcnRpY2VzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVBvbHlnb247XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0Lgg0LjQvdC40YbQuNCw0LvQuNC30LjRgNGD0LXRgiDQvdC+0LLRg9GOIFdlYkdMINC/0YDQvtCz0YDQsNC80LzRgy5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNyZWF0ZVByb2dyYW1cbiAqIEBwYXJhbSAge1dlYkdMU2hhZGVyfSAgICAgICAgICAgdmVydCDQktC10YDRiNC40L3QvdGL0Lkg0YjQtdC50LTQtdGAICjRgdC+0LfQtNCw0L3QvdGL0Lkg0YEg0L/QvtC80L7RidGM0Y4gYHtAbGluayBjcmVhdGVTaGFkZXJ9YCkuXG4gKiBAcGFyYW0gIHtXZWJHTFNoYWRlcn0gICAgICAgICAgIGZyYWcg0KTRgNCw0LPQvNC10L3RgtC90YvQuSDRiNC10LnQtNC10YAgKNGB0L7Qt9C00LDQvdC90YvQuSDRgSDQv9C+0LzQvtGJ0YzRjiBge0BsaW5rIGNyZWF0ZVNoYWRlcn1gKS5cbiAqIEBwYXJhbSAge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgICBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICogQHJldHVybiB7V2ViR0xQcm9ncmFtfVxuICovXG5mdW5jdGlvbiBjcmVhdGVQcm9ncmFtICggdmVydCwgZnJhZywgZ2wgKVxue1xuICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcblxuICBnbC5hdHRhY2hTaGFkZXIoIHByb2dyYW0sIHZlcnQgKTtcbiAgZ2wuYXR0YWNoU2hhZGVyKCBwcm9ncmFtLCBmcmFnICk7XG4gIGdsLmxpbmtQcm9ncmFtKCBwcm9ncmFtICk7XG5cbiAgaWYgKCAhIGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoIHByb2dyYW0sIGdsLkxJTktfU1RBVFVTICkgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdVbmFibGUgdG8gaW5pdGlhbGl6ZSB0aGUgc2hhZGVyIHByb2dyYW06ICcgKyBnbC5nZXRQcm9ncmFtSW5mb0xvZyggcHJvZ3JhbSApICk7XG4gIH1cblxuICBnbC52YWxpZGF0ZVByb2dyYW0oIHByb2dyYW0gKTtcblxuICBpZiAoICEgZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggcHJvZ3JhbSwgZ2wuVkFMSURBVEVfU1RBVFVTICkgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdVbmFibGUgdG8gdmFsaWRhdGUgdGhlIHNoYWRlciBwcm9ncmFtOiAnICsgZ2wuZ2V0UHJvZ3JhbUluZm9Mb2coIHByb2dyYW0gKSApO1xuICB9XG5cbiAgcmV0dXJuIHByb2dyYW07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUHJvZ3JhbTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQuCDQuNC90LjRhtC40LDQu9C40LfQuNGA0YPQtdGCINC90L7QstGL0LkgV2ViR0wg0YjQtdC50LTQtdGALlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY3JlYXRlU2hhZGVyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICAgIHNvdXJjZSDQmNGB0YXQvtC00L3Ri9C5INC60L7QtCDRiNC10LnQtNC10YDQsC5cbiAqIEBwYXJhbSAge2NvbnN0YW50fSAgICAgICAgICAgICAgdHlwZSAgINCi0LjQvyDRiNC10LnQtNC10YDQsDogVkVSVEVYX1NIQURFUiDQuNC70LggRlJBR01FTlRfU0hBREVSLlxuICogQHBhcmFtICB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAgICAgV2ViR0wg0LrQvtC90YLQtdC60YHRgi5cbiAqIEByZXR1cm4ge1dlYkdMU2hhZGVyfVxuICovXG5mdW5jdGlvbiBjcmVhdGVTaGFkZXIgKCBzb3VyY2UsIHR5cGUsIGdsIClcbntcbiAgdmFyIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlciggdHlwZSApO1xuXG4gIGdsLnNoYWRlclNvdXJjZSggc2hhZGVyLCBzb3VyY2UgKTtcbiAgZ2wuY29tcGlsZVNoYWRlciggc2hhZGVyICk7XG5cbiAgaWYgKCAhIGdsLmdldFNoYWRlclBhcmFtZXRlciggc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUyApICkge1xuICAgIHRocm93IFN5bnRheEVycm9yKCAnQW4gZXJyb3Igb2NjdXJyZWQgY29tcGlsaW5nIHRoZSBzaGFkZXJzOiAnICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyggc2hhZGVyICkgKTtcbiAgfVxuXG4gIHJldHVybiBzaGFkZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlU2hhZGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWVtYmVyIHtvYmplY3R9IHBvbHlnb25zXG4gKi9cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG5vb3AgPSByZXF1aXJlKCAncGVha28vbm9vcCcgKTtcblxudmFyIHJlcG9ydGVkO1xudmFyIHJlcG9ydDtcblxuaWYgKCB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgY29uc29sZS53YXJuICkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgcmVwb3J0ZWQgPSB7fTtcblxuICByZXBvcnQgPSBmdW5jdGlvbiByZXBvcnQgKCBtZXNzYWdlIClcbiAge1xuICAgIGlmICggcmVwb3J0ZWRbIG1lc3NhZ2UgXSApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zb2xlLndhcm4oIG1lc3NhZ2UgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmVwb3J0ZWRbIG1lc3NhZ2UgXSA9IHRydWU7XG4gIH07XG59IGVsc2Uge1xuICByZXBvcnQgPSBub29wO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcG9ydDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4uL3NldHRpbmdzJyApO1xuXG4vKipcbiAqINCQ0LHRgdGC0YDQsNC60YLQvdGL0Lkg0LrQu9Cw0YHRgSDQstC10LrRgtC+0YDQsCDRgSDQsdCw0LfQvtCy0YvQvNC4INC80LXRgtC+0LTQsNC80LguXG4gKlxuICog0KfRgtC+0LHRiyDQuNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNGD0LTRg9GB0Ysg0LLQvNC10YHRgtC+INGA0LDQtNC40LDQvdC+0LIg0L3QsNC00L4g0L3QsNC/0LjRgdCw0YLRjCDRgdC70LXQtNGD0Y7RidC10LU6XG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAndjYuanMvY29yZS9zZXR0aW5ncycgKTtcbiAqIHNldHRpbmdzLmRlZ3JlZXMgPSB0cnVlO1xuICogYGBgXG4gKiBAYWJzdHJhY3RcbiAqIEBjb25zdHJ1Y3RvciB2Ni5BYnN0cmFjdFZlY3RvclxuICogQHNlZSB2Ni5WZWN0b3IyRFxuICogQHNlZSB2Ni5WZWN0b3IzRFxuICovXG5mdW5jdGlvbiBBYnN0cmFjdFZlY3RvciAoKVxue1xuICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGFic3RyYWN0IGNsYXNzIChuZXcgdjYuQWJzdHJhY3RWZWN0b3IpJyApO1xufVxuXG5BYnN0cmFjdFZlY3Rvci5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQndC+0YDQvNCw0LvQuNC30YPQtdGCINCy0LXQutGC0L7RgC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNub3JtYWxpemVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5ub3JtYWxpemUoKTsgLy8gVmVjdG9yMkQgeyB4OiAwLjg5NDQyNzE5MDk5OTkxNTksIHk6IDAuNDQ3MjEzNTk1NDk5OTU3OSB9XG4gICAqL1xuICBub3JtYWxpemU6IGZ1bmN0aW9uIG5vcm1hbGl6ZSAoKVxuICB7XG4gICAgdmFyIG1hZyA9IHRoaXMubWFnKCk7XG5cbiAgICBpZiAoIG1hZyAmJiBtYWcgIT09IDEgKSB7XG4gICAgICB0aGlzLmRpdiggbWFnICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCY0LfQvNC10L3Rj9C10YIg0L3QsNC/0YDQsNCy0LvQtdC90LjQtSDQstC10LrRgtC+0YDQsCDQvdCwIGBcImFuZ2xlXCJgINGBINGB0L7RhdGA0LDQvdC10L3QuNC10Lwg0LTQu9C40L3Riy5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNzZXRBbmdsZVxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUg0J3QvtCy0L7QtSDQvdCw0L/RgNCw0LLQu9C10L3QuNC1LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnNldEFuZ2xlKCA0NSAqIE1hdGguUEkgLyAxODAgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjE2MjI3NzY2MDE2ODM3OTUsIHk6IDMuMTYyMjc3NjYwMTY4Mzc5IH1cbiAgICogQGV4YW1wbGUgPGNhcHRpb24+0JjRgdC/0L7Qu9GM0LfRg9GPINCz0YDRg9C00YPRgdGLPC9jYXB0aW9uPlxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5zZXRBbmdsZSggNDUgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjE2MjI3NzY2MDE2ODM3OTUsIHk6IDMuMTYyMjc3NjYwMTY4Mzc5IH1cbiAgICovXG4gIHNldEFuZ2xlOiBmdW5jdGlvbiBzZXRBbmdsZSAoIGFuZ2xlIClcbiAge1xuICAgIHZhciBtYWcgPSB0aGlzLm1hZygpO1xuXG4gICAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgICAgYW5nbGUgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICB9XG5cbiAgICB0aGlzLnggPSBtYWcgKiBNYXRoLmNvcyggYW5nbGUgKTtcbiAgICB0aGlzLnkgPSBtYWcgKiBNYXRoLnNpbiggYW5nbGUgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQmNC30LzQtdC90Y/QtdGCINC00LvQuNC90YMg0LLQtdC60YLQvtGA0LAg0L3QsCBgXCJ2YWx1ZVwiYCDRgSDRgdC+0YXRgNCw0L3QtdC90LjQtdC8INC90LDQv9GA0LDQstC70LXQvdC40Y8uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3Ijc2V0TWFnXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQndC+0LLQsNGPINC00LvQuNC90LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkuc2V0TWFnKCA0MiApOyAvLyBWZWN0b3IyRCB7IHg6IDM3LjU2NTk0MjAyMTk5NjQ2LCB5OiAxOC43ODI5NzEwMTA5OTgyMyB9XG4gICAqL1xuICBzZXRNYWc6IGZ1bmN0aW9uIHNldE1hZyAoIHZhbHVlIClcbiAge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZSgpLm11bCggdmFsdWUgKTtcbiAgfSxcblxuICAvKipcbiAgICog0J/QvtCy0L7RgNCw0YfQuNCy0LDQtdGCINCy0LXQutGC0L7RgCDQvdCwIGBcImFuZ2xlXCJgINGD0LPQvtC7INGBINGB0L7RhdGA0LDQvdC10L3QuNC10Lwg0LTQu9C40L3Riy5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNyb3RhdGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkucm90YXRlKCA1ICogTWF0aC5QSSAvIDE4MCApOyAvLyBWZWN0b3IyRCB7IHg6IDMuODEwNDY3MzA2ODcxNjY2LCB5OiAyLjM0MTAxMjM2NzE3NDEyMzYgfVxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj7QmNGB0L/QvtC70YzQt9GD0Y8g0LPRgNGD0LTRg9GB0Ys8L2NhcHRpb24+XG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnJvdGF0ZSggNSApOyAvLyBWZWN0b3IyRCB7IHg6IDMuODEwNDY3MzA2ODcxNjY2LCB5OiAyLjM0MTAxMjM2NzE3NDEyMzYgfVxuICAgKi9cbiAgcm90YXRlOiBmdW5jdGlvbiByb3RhdGUgKCBhbmdsZSApXG4gIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgYztcbiAgICB2YXIgcztcblxuICAgIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICAgIGFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gICAgfVxuXG4gICAgYyA9IE1hdGguY29zKCBhbmdsZSApO1xuICAgIHMgPSBNYXRoLnNpbiggYW5nbGUgKTtcblxuICAgIHRoaXMueCA9ICggeCAqIGMgKSAtICggeSAqIHMgKTtcbiAgICB0aGlzLnkgPSAoIHggKiBzICkgKyAoIHkgKiBjICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0YLQtdC60YPRidC10LUg0L3QsNC/0YDQsNCy0LvQtdC90LjQtSDQstC10LrRgtC+0YDQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNnZXRBbmdsZVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9INCd0LDQv9GA0LDQstC70LXQvdC40LUgKNGD0LPQvtC7KSDQsiDQs9GA0LDQtNGD0YHQsNGFINC40LvQuCDRgNCw0LTQuNCw0L3QsNGFLlxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDEsIDEgKS5nZXRBbmdsZSgpOyAvLyAtPiAwLjc4NTM5ODE2MzM5NzQ0ODNcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+0JjRgdC/0L7Qu9GM0LfRg9GPINCz0YDRg9C00YPRgdGLPC9jYXB0aW9uPlxuICAgKiBuZXcgVmVjdG9yMkQoIDEsIDEgKS5nZXRBbmdsZSgpOyAvLyAtPiA0NVxuICAgKi9cbiAgZ2V0QW5nbGU6IGZ1bmN0aW9uIGdldEFuZ2xlICgpXG4gIHtcbiAgICBpZiAoIHNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgICByZXR1cm4gTWF0aC5hdGFuMiggdGhpcy55LCB0aGlzLnggKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE1hdGguYXRhbjIoIHRoaXMueSwgdGhpcy54ICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCe0LPRgNCw0L3QuNGH0LjQstCw0LXRgiDQtNC70LjQvdGDINCy0LXQutGC0L7RgNCwINC00L4gYFwidmFsdWVcImAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjbGltaXRcbiAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCc0LDQutGB0LjQvNCw0LvRjNC90LDRjyDQtNC70LjQvdCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMSwgMSApLmxpbWl0KCAxICk7IC8vIFZlY3RvcjJEIHsgeDogMC43MDcxMDY3ODExODY1NDc1LCB5OiAwLjcwNzEwNjc4MTE4NjU0NzUgfVxuICAgKi9cbiAgbGltaXQ6IGZ1bmN0aW9uIGxpbWl0ICggdmFsdWUgKVxuICB7XG4gICAgdmFyIG1hZyA9IHRoaXMubWFnU3EoKTtcblxuICAgIGlmICggbWFnID4gdmFsdWUgKiB2YWx1ZSApIHtcbiAgICAgIHRoaXMuZGl2KCBNYXRoLnNxcnQoIG1hZyApICkubXVsKCB2YWx1ZSApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQtNC70LjQvdGDINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI21hZ1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9INCU0LvQuNC90LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMiwgMiApLm1hZygpOyAvLyAtPiAyLjgyODQyNzEyNDc0NjE5MDNcbiAgICovXG4gIG1hZzogZnVuY3Rpb24gbWFnICgpXG4gIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCB0aGlzLm1hZ1NxKCkgKTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQu9C40L3RgyDQstC10LrRgtC+0YDQsCDQsiDQutCy0LDQtNGA0LDRgtC1LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI21hZ1NxXG4gICAqIEByZXR1cm4ge251bWJlcn0g0JTQu9C40L3QsCDQstC10LrRgtC+0YDQsCDQsiDQutCy0LDQtNGA0LDRgtC1LlxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDIsIDIgKS5tYWdTcSgpOyAvLyAtPiA4XG4gICAqL1xuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQutC70L7QvSDQstC10LrRgtC+0YDQsC5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNjbG9uZVxuICAgKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn0g0JrQu9C+0L0g0LLQtdC60YLQvtGA0LAuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmNsb25lKCk7XG4gICAqL1xuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLQtdC60YLQvtGA0LAgKHByZXR0aWZpZWQpLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI3RvU3RyaW5nXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LjMyMSwgMi4zNDUgKS50b1N0cmluZygpOyAvLyAtPiBcInY2LlZlY3RvcjJEIHsgeDogNC4zMiwgeTogMi4zNSB9XCJcbiAgICovXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC00LjRgdGC0LDQvdGG0LjRjiDQvNC10LbQtNGDINC00LLRg9C80Y8g0LLQtdC60YLQvtGA0LDQvNC4LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI2Rpc3RcbiAgICogQHBhcmFtICB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQlNGA0YPQs9C+0LkgKNCy0YLQvtGA0L7QuSkg0LLQtdC60YLQvtGALlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMywgMyApLmRpc3QoIG5ldyBWZWN0b3IyRCggMSwgMSApICk7IC8vIC0+IDIuODI4NDI3MTI0NzQ2MTkwM1xuICAgKi9cblxuICBjb25zdHJ1Y3RvcjogQWJzdHJhY3RWZWN0b3Jcbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZVxuICogQHBhcmFtICB7djYuQWJzdHJhY3RWZWN0b3J9IFZlY3RvciB7QGxpbmsgdjYuVmVjdG9yMkR9LCB7QGxpbmsgdjYuVmVjdG9yM0R9LlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgIGFuZ2xlXG4gKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn1cbiAqIEBzZWUgdjYuQWJzdHJhY3RWZWN0b3IuZnJvbUFuZ2xlXG4gKi9cbkFic3RyYWN0VmVjdG9yLl9mcm9tQW5nbGUgPSBmdW5jdGlvbiBfZnJvbUFuZ2xlICggVmVjdG9yLCBhbmdsZSApXG57XG4gIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICBhbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBWZWN0b3IoIE1hdGguY29zKCBhbmdsZSApLCBNYXRoLnNpbiggYW5nbGUgKSApO1xufTtcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDRgNCw0L3QtNC+0LzQvdGL0Lkg0LLQtdC60YLQvtGALlxuICogQHZpcnR1YWxcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IucmFuZG9tXG4gKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn0g0JLQvtC30LLRgNCw0YnQsNC10YIg0L3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3Ri9C5INCy0LXQutGC0L7RgCDRgSDRgNCw0L3QtNC+0LzQvdGL0Lwg0L3QsNC/0YDQsNCy0LvQtdC90LjQtdC8LlxuICovXG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0LLQtdC60YLQvtGAINGBINC90LDQv9GA0LDQstC70LXQvdC40LXQvCDRgNCw0LLQvdGL0LwgYFwiYW5nbGVcImAuXG4gKiBAdmlydHVhbFxuICogQHN0YXRpY1xuICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3Rvci5mcm9tQW5nbGVcbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICBhbmdsZSDQndCw0L/RgNCw0LLQu9C10L3QuNC1INCy0LXQutGC0L7RgNCwLlxuICogQHJldHVybiB7djYuQWJzdHJhY3RWZWN0b3J9ICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC90L7RgNC80LDQu9C40LfQvtCy0LDQvdC90YvQuSDQstC10LrRgtC+0YAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBBYnN0cmFjdFZlY3RvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNldHRpbmdzICAgICAgID0gcmVxdWlyZSggJy4uL3NldHRpbmdzJyApO1xudmFyIEFic3RyYWN0VmVjdG9yID0gcmVxdWlyZSggJy4vQWJzdHJhY3RWZWN0b3InICk7XG5cbi8qKlxuICogMkQg0LLQtdC60YLQvtGALlxuICogQGNvbnN0cnVjdG9yIHY2LlZlY3RvcjJEXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdFZlY3RvclxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0gWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgVmVjdG9yMkQgPSByZXF1aXJlKCAndjYuanMvbWF0aC9WZWN0b3IyRCcgKTtcbiAqIHZhciBwb3NpdGlvbiA9IG5ldyBWZWN0b3IyRCggNCwgMiApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5mdW5jdGlvbiBWZWN0b3IyRCAoIHgsIHkgKVxue1xuICAvKipcbiAgICogWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IyRCN4XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB4ID0gbmV3IFZlY3RvcjJEKCA0LCAyICkueDsgLy8gLT4gNFxuICAgKi9cblxuICAvKipcbiAgICogWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IyRCN5XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB5ID0gbmV3IFZlY3RvcjJEKCA0LCAyICkueTsgLy8gLT4gMlxuICAgKi9cblxuICB0aGlzLnNldCggeCwgeSApO1xufVxuXG5WZWN0b3IyRC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdFZlY3Rvci5wcm90b3R5cGUgKTtcblZlY3RvcjJELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFZlY3RvcjJEO1xuXG4vKipcbiAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjc2V0XG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0J3QvtCy0LDRjyBYINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCd0L7QstCw0Y8gWSDQutC+0L7RgNC00LjQvdCw0YLQsC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5zZXQoIDQsIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiA0LCB5OiAyIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAoIHgsIHkgKVxue1xuICB0aGlzLnggPSB4IHx8IDA7XG4gIHRoaXMueSA9IHkgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQuiDQutC+0L7RgNC00LjQvdCw0YLQsNC8IFgg0LggWSDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LUg0L/QsNGA0LDQvNC10YLRgNGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNhZGRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuYWRkKCA0LCAyICk7IC8vIFZlY3RvcjJEIHsgeDogNCwgeTogMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQgKCB4LCB5IClcbntcbiAgdGhpcy54ICs9IHggfHwgMDtcbiAgdGhpcy55ICs9IHkgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCS0YvRh9C40YLQsNC10YIg0LjQtyDQutC+0L7RgNC00LjQvdCw0YIgWCDQuCBZINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI3N1YlxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LLRi9GH0YLQtdC90L4uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuc3ViKCA0LCAyICk7IC8vIFZlY3RvcjJEIHsgeDogLTQsIHk6IC0yIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uIHN1YiAoIHgsIHkgKVxue1xuICB0aGlzLnggLT0geCB8fCAwO1xuICB0aGlzLnkgLT0geSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0KPQvNC90L7QttCw0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNtdWxcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGD0LzQvdC+0LbQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkubXVsKCAyICk7IC8vIFZlY3RvcjJEIHsgeDogOCwgeTogNCB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5tdWwgPSBmdW5jdGlvbiBtdWwgKCB2YWx1ZSApXG57XG4gIHRoaXMueCAqPSB2YWx1ZTtcbiAgdGhpcy55ICo9IHZhbHVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNkaXZcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGA0LDQt9C00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5kaXYoIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiAyLCB5OiAxIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmRpdiA9IGZ1bmN0aW9uIGRpdiAoIHZhbHVlIClcbntcbiAgdGhpcy54IC89IHZhbHVlO1xuICB0aGlzLnkgLz0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2RvdFxuICogQHBhcmFtICB7bnVtYmVyfSBbeD0wXVxuICogQHBhcmFtICB7bnVtYmVyfSBbeT0wXVxuICogQHJldHVybiB7bnVtYmVyfVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmRpdiggMiwgMyApOyAvLyAxNCwg0L/QvtGC0L7QvNGDINGH0YLQvjogXCIoNCAqIDIpICsgKDIgKiAzKSA9IDggKyA2ID0gMTRcIlxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gZG90ICggeCwgeSApXG57XG4gIHJldHVybiAoIHRoaXMueCAqICggeCB8fCAwICkgKSArXG4gICAgICAgICAoIHRoaXMueSAqICggeSB8fCAwICkgKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLINC80LXQttC00YMg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC80Lgg0L/QsNGA0LDQvNC10YLRgNCw0LzQuC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbGVycFxuICogQHBhcmFtIHtudW1iZXJ9IHhcbiAqIEBwYXJhbSB7bnVtYmVyfSB5XG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5sZXJwKCA4LCA0LCAwLjUgKTsgLy8gVmVjdG9yMkQgeyB4OiA2LCB5OiAzIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoIHgsIHksIHZhbHVlIClcbntcbiAgdGhpcy54ICs9ICggeCAtIHRoaXMueCApICogdmFsdWUgfHwgMDtcbiAgdGhpcy55ICs9ICggeSAtIHRoaXMueSApICogdmFsdWUgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCa0L7Qv9C40YDRg9C10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjc2V0VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDRgdC60L7Qv9C40YDQvtCy0LDRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLnNldFZlY3RvciggbmV3IFZlY3RvcjJEKCA0LCAyICkgKTsgLy8gVmVjdG9yMkQgeyB4OiA0LCB5OiAyIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnNldFZlY3RvciA9IGZ1bmN0aW9uIHNldFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLnNldCggdmVjdG9yLngsIHZlY3Rvci55ICk7XG59O1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNhZGRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00L7QsdCw0LLQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuYWRkVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDQsIDIgKSApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuYWRkVmVjdG9yID0gZnVuY3Rpb24gYWRkVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuYWRkKCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0JLRi9GH0LjRgtCw0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNzdWJWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INCy0YvRh9C10YHRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLnN1YlZlY3RvciggbmV3IFZlY3RvcjJEKCA0LCAyICkgKTsgLy8gVmVjdG9yMkQgeyB4OiAtNCwgeTogLTIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc3ViVmVjdG9yID0gZnVuY3Rpb24gc3ViVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc3ViKCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0KPQvNC90L7QttCw0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBYINC4IFkg0LTRgNGD0LPQvtCz0L4g0LLQtdC60YLQvtGA0LAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI211bFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCDQtNC70Y8g0YPQvNC90L7QttC10L3QuNGPLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLm11bFZlY3RvciggbmV3IFZlY3RvcjJEKCAyLCAzICkgKTsgLy8gVmVjdG9yMkQgeyB4OiA4LCB5OiA2IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLm11bFZlY3RvciA9IGZ1bmN0aW9uIG11bFZlY3RvciAoIHZlY3RvciApXG57XG4gIHRoaXMueCAqPSB2ZWN0b3IueDtcbiAgdGhpcy55ICo9IHZlY3Rvci55O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBYINC4IFkg0LTRgNGD0LPQvtCz0L4g0LLQtdC60YLQvtGA0LAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2RpdlZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0L3QsCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQtNC10LvQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkuZGl2VmVjdG9yKCBuZXcgVmVjdG9yMkQoIDIsIDAuNSApICk7IC8vIFZlY3RvcjJEIHsgeDogMiwgeTogNCB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kaXZWZWN0b3IgPSBmdW5jdGlvbiBkaXZWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICB0aGlzLnggLz0gdmVjdG9yLng7XG4gIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjZG90VmVjdG9yXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkuZG90VmVjdG9yKCBuZXcgVmVjdG9yMkQoIDMsIDUgKSApOyAvLyAtPiAyMlxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuZG90VmVjdG9yID0gZnVuY3Rpb24gZG90VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuZG90KCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLINC80LXQttC00YMg0LTRgNGD0LPQuNC8INCy0LXQutGC0L7RgNC+0LwuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2xlcnBWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvclxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgdmFsdWVcbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5sZXJwVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDIsIDEgKSwgMC41ICk7IC8vIFZlY3RvcjJEIHsgeDogMywgeTogMS41IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmxlcnBWZWN0b3IgPSBmdW5jdGlvbiBsZXJwVmVjdG9yICggdmVjdG9yLCB2YWx1ZSApXG57XG4gIHJldHVybiB0aGlzLmxlcnAoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmFsdWUgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI21hZ1NxXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5tYWdTcSA9IGZ1bmN0aW9uIG1hZ1NxICgpXG57XG4gIHJldHVybiAoIHRoaXMueCAqIHRoaXMueCApICsgKCB0aGlzLnkgKiB0aGlzLnkgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2Nsb25lXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lICgpXG57XG4gIHJldHVybiBuZXcgVmVjdG9yMkQoIHRoaXMueCwgdGhpcy55ICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNkaXN0XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kaXN0ID0gZnVuY3Rpb24gZGlzdCAoIHZlY3RvciApXG57XG4gIHZhciB4ID0gdmVjdG9yLnggLSB0aGlzLng7XG4gIHZhciB5ID0gdmVjdG9yLnkgLSB0aGlzLnk7XG4gIHJldHVybiBNYXRoLnNxcnQoICggeCAqIHggKSArICggeSAqIHkgKSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjdG9TdHJpbmdcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKClcbntcbiAgcmV0dXJuICd2Ni5WZWN0b3IyRCB7IHg6ICcgKyB0aGlzLngudG9GaXhlZCggMiApICsgJywgeTogJyArIHRoaXMueS50b0ZpeGVkKCAyICkgKyAnIH0nO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJELnJhbmRvbVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5yYW5kb21cbiAqL1xuVmVjdG9yMkQucmFuZG9tID0gZnVuY3Rpb24gcmFuZG9tICgpXG57XG4gIHZhciB2YWx1ZTtcblxuICBpZiAoIHNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgdmFsdWUgPSAzNjA7XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBNYXRoLlBJICogMjtcbiAgfVxuXG4gIHJldHVybiBWZWN0b3IyRC5mcm9tQW5nbGUoIE1hdGgucmFuZG9tKCkgKiB2YWx1ZSApO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJELmZyb21BbmdsZVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5mcm9tQW5nbGVcbiAqL1xuVmVjdG9yMkQuZnJvbUFuZ2xlID0gZnVuY3Rpb24gZnJvbUFuZ2xlICggYW5nbGUgKVxue1xuICByZXR1cm4gQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZSggVmVjdG9yMkQsIGFuZ2xlICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjJEO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWJzdHJhY3RWZWN0b3IgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFZlY3RvcicgKTtcblxuLyoqXG4gKiAzRCDQstC10LrRgtC+0YAuXG4gKiBAY29uc3RydWN0b3IgdjYuVmVjdG9yM0RcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0VmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0gWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSBZINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt6PTBdIFog0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gKiBAZXhhbXBsZVxuICogdmFyIFZlY3RvcjNEID0gcmVxdWlyZSggJ3Y2LmpzL21hdGgvVmVjdG9yM0QnICk7XG4gKiB2YXIgcG9zaXRpb24gPSBuZXcgVmVjdG9yM0QoIDQsIDIsIDMgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiAzIH1cbiAqL1xuZnVuY3Rpb24gVmVjdG9yM0QgKCB4LCB5LCB6IClcbntcbiAgLyoqXG4gICAqIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuVmVjdG9yM0QjeFxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgeCA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApLng7IC8vIC0+IDRcbiAgICovXG5cbiAgLyoqXG4gICAqIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuVmVjdG9yM0QjeVxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgeSA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApLnk7IC8vIC0+IDJcbiAgICovXG5cbiAgLyoqXG4gICAqIFog0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuVmVjdG9yM0QjelxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgeiA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApLno7IC8vIC0+IDNcbiAgICovXG5cbiAgdGhpcy5zZXQoIHgsIHksIHogKTtcbn1cblxuVmVjdG9yM0QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RWZWN0b3IucHJvdG90eXBlICk7XG5WZWN0b3IzRC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBWZWN0b3IzRDtcblxuLyoqXG4gKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNzZXRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQndC+0LLQsNGPIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0J3QvtCy0LDRjyBZINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt6PTBdINCd0L7QstCw0Y8gWiDQutC+0L7RgNC00LjQvdCw0YLQsC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5zZXQoIDQsIDIsIDYgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAoIHgsIHksIHogKVxue1xuICB0aGlzLnggPSB4IHx8IDA7XG4gIHRoaXMueSA9IHkgfHwgMDtcbiAgdGhpcy56ID0geiB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC6INC60L7QvtGA0LTQuNC90LDRgtCw0LwgWCwgWSwg0LggWiDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LUg0L/QsNGA0LDQvNC10YLRgNGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNhZGRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3Qvi5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5hZGQoIDQsIDIsIDYgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZCAoIHgsIHksIHogKVxue1xuICB0aGlzLnggKz0geCB8fCAwO1xuICB0aGlzLnkgKz0geSB8fCAwO1xuICB0aGlzLnogKz0geiB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JLRi9GH0LjRgtCw0LXRgiDQuNC3INC60L7QvtGA0LTQuNC90LDRgiBYLCBZLCDQuCBaINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3N1YlxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LLRi9GH0YLQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINCy0YvRh9GC0LXQvdC+LlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLnN1YiggNCwgMiwgNiApOyAvLyBWZWN0b3IzRCB7IHg6IC00LCB5OiAtMiwgejogLTYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24gc3ViICggeCwgeSwgeiApXG57XG4gIHRoaXMueCAtPSB4IHx8IDA7XG4gIHRoaXMueSAtPSB5IHx8IDA7XG4gIHRoaXMueiAtPSB6IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQo9C80L3QvtC20LDQtdGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNtdWxcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGD0LzQvdC+0LbQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubXVsKCAyICk7IC8vIFZlY3RvcjNEIHsgeDogOCwgeTogNCwgejogMTIgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUubXVsID0gZnVuY3Rpb24gbXVsICggdmFsdWUgKVxue1xuICB0aGlzLnggKj0gdmFsdWU7XG4gIHRoaXMueSAqPSB2YWx1ZTtcbiAgdGhpcy56ICo9IHZhbHVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgYHZhbHVlYC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZGl2XG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUg0KfQuNGB0LvQviwg0L3QsCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDRgNCw0LfQtNC10LvQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkuZGl2KCAyICk7IC8vIFZlY3RvcjNEIHsgeDogMiwgeTogMSwgejogMyB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kaXYgPSBmdW5jdGlvbiBkaXYgKCB2YWx1ZSApXG57XG4gIHRoaXMueCAvPSB2YWx1ZTtcbiAgdGhpcy55IC89IHZhbHVlO1xuICB0aGlzLnogLz0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2RvdFxuICogQHBhcmFtICB7bnVtYmVyfSBbeD0wXVxuICogQHBhcmFtICB7bnVtYmVyfSBbeT0wXVxuICogQHBhcmFtICB7bnVtYmVyfSBbej0wXVxuICogQHJldHVybiB7bnVtYmVyfVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmRvdCggMiwgMywgNCApOyAvLyAtPiAzOCwg0L/QvtGC0L7QvNGDINGH0YLQvjogXCIoNCAqIDIpICsgKDIgKiAzKSArICg2ICogNCkgPSA4ICsgNiArIDI0ID0gMzhcIlxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gZG90ICggeCwgeSwgeiApXG57XG4gIHJldHVybiAoIHRoaXMueCAqICggeCB8fCAwICkgKSArXG4gICAgICAgICAoIHRoaXMueSAqICggeSB8fCAwICkgKSArXG4gICAgICAgICAoIHRoaXMueiAqICggeiB8fCAwICkgKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvNC10LbQtNGDINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQvNC4INC/0LDRgNCw0LzQtdGC0YDQsNC80LguXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2xlcnBcbiAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gKiBAcGFyYW0ge251bWJlcn0geVxuICogQHBhcmFtIHtudW1iZXJ9IHpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmxlcnAoIDgsIDQsIDEyLCAwLjUgKTsgLy8gVmVjdG9yM0QgeyB4OiA2LCB5OiAzLCB6OiA5IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoIHgsIHksIHosIHZhbHVlIClcbntcbiAgdGhpcy54ICs9ICggeCAtIHRoaXMueCApICogdmFsdWUgfHwgMDtcbiAgdGhpcy55ICs9ICggeSAtIHRoaXMueSApICogdmFsdWUgfHwgMDtcbiAgdGhpcy56ICs9ICggeiAtIHRoaXMueiApICogdmFsdWUgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCa0L7Qv9C40YDRg9C10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0Qjc2V0VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDRgdC60L7Qv9C40YDQvtCy0LDRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLnNldFZlY3RvciggbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLnNldFZlY3RvciA9IGZ1bmN0aW9uIHNldFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLnNldCggdmVjdG9yLngsIHZlY3Rvci55LCB2ZWN0b3IueiApO1xufTtcblxuLyoqXG4gKiDQlNC+0LHQsNCy0LvRj9C10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjYWRkVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQtNC+0LHQsNCy0LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLmFkZFZlY3RvciggbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmFkZFZlY3RvciA9IGZ1bmN0aW9uIGFkZFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLmFkZCggdmVjdG9yLngsIHZlY3Rvci55LCB2ZWN0b3IueiApO1xufTtcblxuLyoqXG4gKiDQktGL0YfQuNGC0LDQtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3N1YlZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LLRi9GH0LXRgdGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuc3ViVmVjdG9yKCBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKSApOyAvLyBWZWN0b3IzRCB7IHg6IC00LCB5OiAtMiwgejogLTYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc3ViVmVjdG9yID0gZnVuY3Rpb24gc3ViVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc3ViKCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCj0LzQvdC+0LbQsNC10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIFgsIFksINC4IFog0LTRgNGD0LPQvtCz0L4g0LLQtdC60YLQvtGA0LAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI211bFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCDQtNC70Y8g0YPQvNC90L7QttC10L3QuNGPLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLm11bFZlY3RvciggbmV3IFZlY3RvcjNEKCAyLCAzLCA0ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiA4LCB5OiA2LCB6OiAyNCB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5tdWxWZWN0b3IgPSBmdW5jdGlvbiBtdWxWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICB0aGlzLnggKj0gdmVjdG9yLng7XG4gIHRoaXMueSAqPSB2ZWN0b3IueTtcbiAgdGhpcy56ICo9IHZlY3Rvci56O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgWCwgWSwg0LggWiDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZGl2VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQvdCwINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5kaXZWZWN0b3IoIG5ldyBWZWN0b3IzRCggMiwgMC41LCA0ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiAyLCB5OiA0LCB6OiAxLjUgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZGl2VmVjdG9yID0gZnVuY3Rpb24gZGl2VmVjdG9yICggdmVjdG9yIClcbntcbiAgdGhpcy54IC89IHZlY3Rvci54O1xuICB0aGlzLnkgLz0gdmVjdG9yLnk7XG4gIHRoaXMueiAvPSB2ZWN0b3IuejtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZG90VmVjdG9yXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkuZG90VmVjdG9yKCBuZXcgVmVjdG9yM0QoIDIsIDMsIC0yICkgKTsgLy8gLT4gMlxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZG90VmVjdG9yID0gZnVuY3Rpb24gZG90VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuZG90KCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCY0L3RgtC10YDQv9C+0LvQuNGA0YPQtdGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0LzQtdC20LTRgyDQtNGA0YPQs9C40Lwg0LLQtdC60YLQvtGA0L7QvC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbGVycFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmxlcnBWZWN0b3IoIG5ldyBWZWN0b3IzRCggOCwgNCwgMTIgKSwgMC41ICk7IC8vIFZlY3RvcjNEIHsgeDogNiwgeTogMywgejogOSB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5sZXJwVmVjdG9yID0gZnVuY3Rpb24gbGVycFZlY3RvciAoIHZlY3RvciwgdmFsdWUgKVxue1xuICByZXR1cm4gdGhpcy5sZXJwKCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56LCB2YWx1ZSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbWFnU3FcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLm1hZ1NxID0gZnVuY3Rpb24gbWFnU3EgKClcbntcbiAgcmV0dXJuICggdGhpcy54ICogdGhpcy54ICkgKyAoIHRoaXMueSAqIHRoaXMueSApICsgKCB0aGlzLnogKiB0aGlzLnogKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2Nsb25lXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lICgpXG57XG4gIHJldHVybiBuZXcgVmVjdG9yM0QoIHRoaXMueCwgdGhpcy55LCB0aGlzLnogKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2Rpc3RcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmRpc3QgPSBmdW5jdGlvbiBkaXN0ICggdmVjdG9yIClcbntcbiAgdmFyIHggPSB2ZWN0b3IueCAtIHRoaXMueDtcbiAgdmFyIHkgPSB2ZWN0b3IueSAtIHRoaXMueTtcbiAgdmFyIHogPSB2ZWN0b3IueiAtIHRoaXMuejtcbiAgcmV0dXJuIE1hdGguc3FydCggKCB4ICogeCApICsgKCB5ICogeSApICsgKCB6ICogeiApICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCN0b1N0cmluZ1xuICovXG5WZWN0b3IzRC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKVxue1xuICByZXR1cm4gJ3Y2LlZlY3RvcjNEIHsgeDogJyArIHRoaXMueC50b0ZpeGVkKCAyICkgKyAnLCB5OiAnICsgdGhpcy55LnRvRml4ZWQoIDIgKSArICcsIHo6ICcgKyB0aGlzLnoudG9GaXhlZCggMiApICsgJyB9Jztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRC5yYW5kb21cbiAqIEBzZWUgdjYuQWJzdHJhY3RWZWN0b3IucmFuZG9tXG4gKi9cblZlY3RvcjNELnJhbmRvbSA9IGZ1bmN0aW9uIHJhbmRvbSAoKVxue1xuICAvLyBVc2UgdGhlIGVxdWFsLWFyZWEgcHJvamVjdGlvbiBhbGdvcml0aG0uXG4gIHZhciB0aGV0YSA9IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJICogMjtcbiAgdmFyIHogICAgID0gKCBNYXRoLnJhbmRvbSgpICogMiApIC0gMTtcbiAgdmFyIG4gICAgID0gTWF0aC5zcXJ0KCAxIC0gKCB6ICogeiApICk7XG4gIHJldHVybiBuZXcgVmVjdG9yM0QoIG4gKiBNYXRoLmNvcyggdGhldGEgKSwgbiAqIE1hdGguc2luKCB0aGV0YSApLCB6ICk7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QuZnJvbUFuZ2xlXG4gKiBAc2VlIHY2LkFic3RyYWN0VmVjdG9yLmZyb21BbmdsZVxuICovXG5WZWN0b3IzRC5mcm9tQW5nbGUgPSBmdW5jdGlvbiBmcm9tQW5nbGUgKCBhbmdsZSApXG57XG4gIHJldHVybiBBYnN0cmFjdFZlY3Rvci5fZnJvbUFuZ2xlKCBWZWN0b3IzRCwgYW5nbGUgKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yM0Q7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0K3RgtC+INC/0YDQvtGB0YLRgNCw0L3RgdGC0LLQviDQuNC80LXQvSAo0Y3RgtC+0YIgbmFtZXBzcGFjZSkg0YDQtdCw0LvQuNC30YPQtdGCINGA0LDQsdC+0YLRgyDRgSAyRCDQvNCw0YLRgNC40YbQsNC80LggM3gzLlxuICogQG5hbWVzcGFjZSB2Ni5tYXQzXG4gKiBAZXhhbXBsZVxuICogdmFyIG1hdDMgPSByZXF1aXJlKCAndjYuanMvY29yZS9tYXRoL21hdDMnICk7XG4gKi9cblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDRgdGC0LDQvdC00LDRgNGC0L3Rg9GOIChpZGVudGl0eSkgM3gzINC80LDRgtGA0LjRhtGDLlxuICogQG1ldGhvZCB2Ni5tYXQzLmlkZW50aXR5XG4gKiBAcmV0dXJuIHtBcnJheS48bnVtYmVyPn0g0J3QvtCy0LDRjyDQvNCw0YLRgNC40YbQsC5cbiAqIEBleGFtcGxlXG4gKiAvLyBSZXR1cm5zIHRoZSBpZGVudGl0eS5cbiAqIHZhciBtYXRyaXggPSBtYXQzLmlkZW50aXR5KCk7XG4gKi9cbmV4cG9ydHMuaWRlbnRpdHkgPSBmdW5jdGlvbiBpZGVudGl0eSAoKVxue1xuICByZXR1cm4gW1xuICAgIDEsIDAsIDAsXG4gICAgMCwgMSwgMCxcbiAgICAwLCAwLCAxXG4gIF07XG59O1xuXG4vKipcbiAqINCh0LHRgNCw0YHRi9Cy0LDQtdGCINC80LDRgtGA0LjRhtGDIGBcIm0xXCJgINC00L4g0YHRgtCw0L3QtNCw0YDRgtC90YvRhSAoaWRlbnRpdHkpINC30L3QsNGH0LXQvdC40LkuXG4gKiBAbWV0aG9kIHY2Lm1hdDMuc2V0SWRlbnRpdHlcbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSDQnNCw0YLRgNC40YbQsC5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiAvLyBTZXRzIHRoZSBpZGVudGl0eS5cbiAqIG1hdDMuc2V0SWRlbnRpdHkoIG1hdHJpeCApO1xuICovXG5leHBvcnRzLnNldElkZW50aXR5ID0gZnVuY3Rpb24gc2V0SWRlbnRpdHkgKCBtMSApXG57XG4gIG0xWyAwIF0gPSAxO1xuICBtMVsgMSBdID0gMDtcbiAgbTFbIDIgXSA9IDA7XG4gIG0xWyAzIF0gPSAwO1xuICBtMVsgNCBdID0gMTtcbiAgbTFbIDUgXSA9IDA7XG4gIG0xWyA2IF0gPSAwO1xuICBtMVsgNyBdID0gMDtcbiAgbTFbIDggXSA9IDE7XG59O1xuXG4vKipcbiAqINCa0L7Qv9C40YDRg9C10YIg0LfQvdCw0YfQtdC90LjRjyDQvNCw0YLRgNC40YbRiyBgXCJtMlwiYCDQvdCwINC80LDRgtGA0LjRhtGDIGBcIm0xXCJgLlxuICogQG1ldGhvZCB2Ni5tYXQzLmNvcHlcbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSDQnNCw0YLRgNC40YbQsCwg0LIg0LrQvtGC0L7RgNGD0Y4g0L3QsNC00L4g0LrQvtC/0LjRgNC+0LLQsNGC0YwuXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTIg0JzQsNGC0YDQuNGG0LAsINC60L7RgtC+0YDRg9GOINC90LDQtNC+INGB0LrQvtC/0LjRgNC+0LLQsNGC0YwuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gQ29waWVzIGEgbWF0cml4LlxuICogbWF0My5jb3B5KCBkZXN0aW5hdGlvbk1hdHJpeCwgc291cmNlTWF0cml4ICk7XG4gKi9cbmV4cG9ydHMuY29weSA9IGZ1bmN0aW9uIGNvcHkgKCBtMSwgbTIgKVxue1xuICBtMVsgMCBdID0gbTJbIDAgXTtcbiAgbTFbIDEgXSA9IG0yWyAxIF07XG4gIG0xWyAyIF0gPSBtMlsgMiBdO1xuICBtMVsgMyBdID0gbTJbIDMgXTtcbiAgbTFbIDQgXSA9IG0yWyA0IF07XG4gIG0xWyA1IF0gPSBtMlsgNSBdO1xuICBtMVsgNiBdID0gbTJbIDYgXTtcbiAgbTFbIDcgXSA9IG0yWyA3IF07XG4gIG0xWyA4IF0gPSBtMlsgOCBdO1xufTtcblxuLyoqXG4gKiDQktC+0LfQstGA0LDRidCw0LXRgiDQutC70L7QvSDQvNCw0YLRgNC40YbRiyBgXCJtMVwiYC5cbiAqIEBtZXRob2QgdjYubWF0My5jbG9uZVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xINCY0YHRhdC+0LTQvdCw0Y8g0LzQsNGC0YDQuNGG0LAuXG4gKiBAcmV0dXJuIHtBcnJheS48bnVtYmVyPn0gICAg0JrQu9C+0L0g0LzQsNGC0YDQuNGG0YsuXG4gKiBAZXhhbXBsZVxuICogLy8gQ3JlYXRlcyBhIGNsb25lLlxuICogdmFyIGNsb25lID0gbWF0My5jbG9uZSggbWF0cml4ICk7XG4gKi9cbmV4cG9ydHMuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSAoIG0xIClcbntcbiAgcmV0dXJuIFtcbiAgICBtMVsgMCBdLFxuICAgIG0xWyAxIF0sXG4gICAgbTFbIDIgXSxcbiAgICBtMVsgMyBdLFxuICAgIG0xWyA0IF0sXG4gICAgbTFbIDUgXSxcbiAgICBtMVsgNiBdLFxuICAgIG0xWyA3IF0sXG4gICAgbTFbIDggXVxuICBdO1xufTtcblxuLyoqXG4gKiDQn9C10YDQtdC80LXRidCw0LXRgiDQvNCw0YLRgNC40YbRgyBgXCJtMVwiYC5cbiAqIEBtZXRob2QgdjYubWF0My50cmFuc2xhdGVcbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSDQnNCw0YLRgNC40YbQsC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICB4ICBYINC/0LXRgNC10LzQtdGJ0LXQvdC40Y8uXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgeSAgWSDQv9C10YDQtdC80LXRidC10L3QuNGPLlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIFRyYW5zbGF0ZXMgYnkgWyA0LCAyIF0uXG4gKiBtYXQzLnRyYW5zbGF0ZSggbWF0cml4LCA0LCAyICk7XG4gKi9cbmV4cG9ydHMudHJhbnNsYXRlID0gZnVuY3Rpb24gdHJhbnNsYXRlICggbTEsIHgsIHkgKVxue1xuICBtMVsgNiBdID0gKCB4ICogbTFbIDAgXSApICsgKCB5ICogbTFbIDMgXSApICsgbTFbIDYgXTtcbiAgbTFbIDcgXSA9ICggeCAqIG0xWyAxIF0gKSArICggeSAqIG0xWyA0IF0gKSArIG0xWyA3IF07XG4gIG0xWyA4IF0gPSAoIHggKiBtMVsgMiBdICkgKyAoIHkgKiBtMVsgNSBdICkgKyBtMVsgOCBdO1xufTtcblxuLyoqXG4gKiDQn9C+0LLQvtGA0LDRh9C40LLQsNC10YIg0LzQsNGC0YDQuNGG0YMgYFwibTFcImAg0L3QsCBgXCJhbmdsZVwiYCDRgNCw0LTQuNCw0L3QvtCyLlxuICogQG1ldGhvZCB2Ni5tYXQzLnJvdGF0ZVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xICAgINCc0LDRgtGA0LjRhtCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIGFuZ2xlINCj0LPQvtC7LlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIFJvdGF0ZXMgYnkgNDUgZGVncmVlcy5cbiAqIG1hdDMucm90YXRlKCBtYXRyaXgsIDQ1ICogTWF0aC5QSSAvIDE4MCApO1xuICovXG5leHBvcnRzLnJvdGF0ZSA9IGZ1bmN0aW9uIHJvdGF0ZSAoIG0xLCBhbmdsZSApXG57XG4gIHZhciBtMTAgPSBtMVsgMCBdO1xuICB2YXIgbTExID0gbTFbIDEgXTtcbiAgdmFyIG0xMiA9IG0xWyAyIF07XG4gIHZhciBtMTMgPSBtMVsgMyBdO1xuICB2YXIgbTE0ID0gbTFbIDQgXTtcbiAgdmFyIG0xNSA9IG0xWyA1IF07XG4gIHZhciB4ID0gTWF0aC5jb3MoIGFuZ2xlICk7XG4gIHZhciB5ID0gTWF0aC5zaW4oIGFuZ2xlICk7XG4gIG0xWyAwIF0gPSAoIHggKiBtMTAgKSArICggeSAqIG0xMyApO1xuICBtMVsgMSBdID0gKCB4ICogbTExICkgKyAoIHkgKiBtMTQgKTtcbiAgbTFbIDIgXSA9ICggeCAqIG0xMiApICsgKCB5ICogbTE1ICk7XG4gIG0xWyAzIF0gPSAoIHggKiBtMTMgKSAtICggeSAqIG0xMCApO1xuICBtMVsgNCBdID0gKCB4ICogbTE0ICkgLSAoIHkgKiBtMTEgKTtcbiAgbTFbIDUgXSA9ICggeCAqIG0xNSApIC0gKCB5ICogbTEyICk7XG59O1xuXG4vKipcbiAqINCc0LDRgdGI0YLQsNCx0LjRgNGD0LXRgiDQvNCw0YLRgNC40YbRgy5cbiAqIEBtZXRob2QgdjYubWF0My5zY2FsZVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xINCc0LDRgtGA0LjRhtCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIHggIFgt0YTQsNC60YLQvtGALlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIHkgIFkt0YTQsNC60YLQvtGALlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIFNjYWxlcyBpbiBbIDIsIDIgXSB0aW1lcy5cbiAqIG1hdDMuc2NhbGUoIG1hdHJpeCwgMiwgMiApO1xuICovXG5leHBvcnRzLnNjYWxlID0gZnVuY3Rpb24gc2NhbGUgKCBtMSwgeCwgeSApXG57XG4gIG0xWyAwIF0gKj0geDtcbiAgbTFbIDEgXSAqPSB4O1xuICBtMVsgMiBdICo9IHg7XG4gIG0xWyAzIF0gKj0geTtcbiAgbTFbIDQgXSAqPSB5O1xuICBtMVsgNSBdICo9IHk7XG59O1xuXG4vKipcbiAqINCf0YDQuNC80LXQvdGP0LXRgiDQvNCw0YLRgNC40YbRgyDQuNC3INGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7QsiDQvdCwINC80LDRgtGA0LjRhtGDIGBcIm0xXCJgLlxuICogQG1ldGhvZCB2Ni5tYXQzLnRyYW5zZm9ybVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xICDQnNCw0YLRgNC40YbQsC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMTEgWCDQvNCw0YHRiNGC0LDQsSAoc2NhbGUpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0xMiBYINC90LDQutC70L7QvSAoc2tldykuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTIxIFkg0L3QsNC60LvQvtC9IChza2V3KS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMjIgWSDQvNCw0YHRiNGC0LDQsSAoc2NhbGUpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIGR4ICBYINC/0LXRgNC10LzQtdGJ0LXQvdC40Y8gKHRyYW5zbGF0ZSkuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgZHkgIFkg0L/QtdGA0LXQvNC10YnQtdC90LjRjyAodHJhbnNsYXRlKS5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gQXBwbGllcyBhIGRvdWJsZS1zY2FsZWQgbWF0cml4LlxuICogbWF0My50cmFuc2Zvcm0oIG1hdHJpeCwgMiwgMCwgMCwgMiwgMCwgMCApO1xuICovXG5leHBvcnRzLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIHRyYW5zZm9ybSAoIG0xLCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG57XG4gIG0xWyAwIF0gKj0gbTExO1xuICBtMVsgMSBdICo9IG0yMTtcbiAgbTFbIDIgXSAqPSBkeDtcbiAgbTFbIDMgXSAqPSBtMTI7XG4gIG0xWyA0IF0gKj0gbTIyO1xuICBtMVsgNSBdICo9IGR5O1xuICBtMVsgNiBdID0gMDtcbiAgbTFbIDcgXSA9IDA7XG59O1xuXG4vKipcbiAqINCh0LHRgNCw0YHRi9Cy0LDQtdGCINC80LDRgtGA0LjRhtGDIGBcIm0xXCJgINC00L4g0LzQsNGC0YDQuNGG0Ysg0LjQtyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40YUg0L/QsNGA0LDQvNC10YLRgNC+0LIuXG4gKiBAbWV0aG9kIHY2Lm1hdDMuc2V0VHJhbnNmb3JtXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEgINCc0LDRgtGA0LjRhtCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0xMSBYINC80LDRgdGI0YLQsNCxIChzY2FsZSkuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTEyIFgg0L3QsNC60LvQvtC9IChza2V3KS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMjEgWSDQvdCw0LrQu9C+0L0gKHNrZXcpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0yMiBZINC80LDRgdGI0YLQsNCxIChzY2FsZSkuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgZHggIFgg0L/QtdGA0LXQvNC10YnQtdC90LjRjyAodHJhbnNsYXRlKS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBkeSAgWSDQv9C10YDQtdC80LXRidC10L3QuNGPICh0cmFuc2xhdGUpLlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiAvLyBTZXRzIHRoZSBpZGVudGl0eSBhbmQgdGhlbiBhcHBsaWVzIGEgZG91YmxlLXNjYWxlZCBtYXRyaXguXG4gKiBtYXQzLnNldFRyYW5zZm9ybSggbWF0cml4LCAyLCAwLCAwLCAyLCAwLCAwICk7XG4gKi9cbmV4cG9ydHMuc2V0VHJhbnNmb3JtID0gZnVuY3Rpb24gc2V0VHJhbnNmb3JtICggbTEsIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbntcbiAgLy8gWCBzY2FsZVxuICBtMVsgMCBdID0gbTExO1xuICAvLyBYIHNrZXdcbiAgbTFbIDEgXSA9IG0xMjtcbiAgLy8gWSBza2V3XG4gIG0xWyAzIF0gPSBtMjE7XG4gIC8vIFkgc2NhbGVcbiAgbTFbIDQgXSA9IG0yMjtcbiAgLy8gWCB0cmFuc2xhdGVcbiAgbTFbIDYgXSA9IGR4O1xuICAvLyBZIHRyYW5zbGF0ZVxuICBtMVsgNyBdID0gZHk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGdldEVsZW1lbnRXID0gcmVxdWlyZSggJ3BlYWtvL2dldC1lbGVtZW50LXcnICk7XG52YXIgZ2V0RWxlbWVudEggPSByZXF1aXJlKCAncGVha28vZ2V0LWVsZW1lbnQtaCcgKTtcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApO1xudmFyIGNyZWF0ZVBvbHlnb24gPSByZXF1aXJlKCAnLi4vaW50ZXJuYWwvY3JlYXRlX3BvbHlnb24nICk7XG52YXIgcG9seWdvbnMgPSByZXF1aXJlKCAnLi4vaW50ZXJuYWwvcG9seWdvbnMnICk7XG52YXIgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyA9IHJlcXVpcmUoICcuL2ludGVybmFsL3NldF9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MnICk7XG52YXIgZ2V0V2ViR0wgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9nZXRfd2ViZ2wnICk7XG52YXIgY29weURyYXdpbmdTZXR0aW5ncyA9IHJlcXVpcmUoICcuL2ludGVybmFsL2NvcHlfZHJhd2luZ19zZXR0aW5ncycgKTtcbnZhciBwcm9jZXNzUmVjdEFsaWduWCA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWDtcbnZhciBwcm9jZXNzUmVjdEFsaWduWSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWTtcbnZhciBwcm9jZXNzU2hhcGUgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3NoYXBlJyApO1xudmFyIGNsb3NlU2hhcGUgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9jbG9zZV9zaGFwZScgKTtcbnZhciBvcHRpb25zID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG4vKipcbiAqINCQ0LHRgdGC0YDQsNC60YLQvdGL0Lkg0LrQu9Cw0YHRgSDRgNC10L3QtNC10YDQtdGA0LAuXG4gKiBAYWJzdHJhY3RcbiAqIEBjb25zdHJ1Y3RvciB2Ni5BYnN0cmFjdFJlbmRlcmVyXG4gKiBAc2VlIHY2LlJlbmRlcmVyR0xcbiAqIEBzZWUgdjYuUmVuZGVyZXIyRFxuICogQGV4YW1wbGVcbiAqIHZhciBBYnN0cmFjdFJlbmRlcmVyID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXIvQWJzdHJhY3RSZW5kZXJlcicgKTtcbiAqL1xuZnVuY3Rpb24gQWJzdHJhY3RSZW5kZXJlciAoKVxue1xuICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGFic3RyYWN0IGNsYXNzIChuZXcgdjYuQWJzdHJhY3RSZW5kZXJlciknICk7XG59XG5BYnN0cmFjdFJlbmRlcmVyLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqINCU0L7QsdCw0LLQu9GP0LXRgiBgY2FudmFzYCDRgNC10L3QtNC10YDQtdGA0LAg0LIgRE9NLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYXBwZW5kVG9cbiAgICogQHBhcmFtIHtFbGVtZW50fSBwYXJlbnQg0K3Qu9C10LzQtdC90YIsINCyINC60L7RgtC+0YDRi9C5IGBjYW52YXNgINGA0LXQvdC00LXRgNC10YDQsCDQtNC+0LvQttC10L0g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBBZGQgcmVuZGVyZXIgaW50byBET00uXG4gICAqIHJlbmRlcmVyLmFwcGVuZFRvKCBkb2N1bWVudC5ib2R5ICk7XG4gICAqL1xuICBhcHBlbmRUbzogZnVuY3Rpb24gYXBwZW5kVG8gKCBwYXJlbnQgKVxuICB7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKCB0aGlzLmNhbnZhcyApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KPQtNCw0LvRj9C10YIgYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINC40LcgRE9NLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZGVzdHJveVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlbW92ZSByZW5kZXJlciBmcm9tIERPTS5cbiAgICogcmVuZGVyZXIuZGVzdHJveSgpO1xuICAgKi9cbiAgZGVzdHJveTogZnVuY3Rpb24gZGVzdHJveSAoKVxuICB7XG4gICAgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggdGhpcy5jYW52YXMgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCh0L7RhdGA0LDQvdGP0LXRgiDRgtC10LrRg9GJ0LjQtSDQvdCw0YHRgtGA0L7QudC60Lgg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwdXNoXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2F2ZSBkcmF3aW5nIHNldHRpbmdzIChmaWxsLCBsaW5lV2lkdGguLi4pIChwdXNoIG9udG8gc3RhY2spLlxuICAgKiByZW5kZXJlci5wdXNoKCk7XG4gICAqL1xuICBwdXNoOiBmdW5jdGlvbiBwdXNoICgpXG4gIHtcbiAgICBpZiAoIHRoaXMuX3N0YWNrWyArK3RoaXMuX3N0YWNrSW5kZXggXSApIHtcbiAgICAgIGNvcHlEcmF3aW5nU2V0dGluZ3MoIHRoaXMuX3N0YWNrWyB0aGlzLl9zdGFja0luZGV4IF0sIHRoaXMgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RhY2sucHVzaCggc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncygge30sIHRoaXMgKSApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCS0L7RgdGB0YLQsNC90LDQstC70LjQstCw0LXRgiDQv9GA0LXQtNGL0LTRg9GJ0LjQtSDQvdCw0YHRgtGA0L7QudC60Lgg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwb3BcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXN0b3JlIGRyYXdpbmcgc2V0dGluZ3MgKGZpbGwsIGxpbmVXaWR0aC4uLikgKHRha2UgZnJvbSBzdGFjaykuXG4gICAqIHJlbmRlcmVyLnBvcCgpO1xuICAgKi9cbiAgcG9wOiBmdW5jdGlvbiBwb3AgKClcbiAge1xuICAgIGlmICggdGhpcy5fc3RhY2tJbmRleCA+PSAwICkge1xuICAgICAgY29weURyYXdpbmdTZXR0aW5ncyggdGhpcywgdGhpcy5fc3RhY2tbIHRoaXMuX3N0YWNrSW5kZXgtLSBdICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3MoIHRoaXMsIHRoaXMgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQmNC30LzQtdC90Y/QtdGCINGA0LDQt9C80LXRgCDRgNC10L3QtNC10YDQtdGA0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZXNpemVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHcg0J3QvtCy0LDRjyDRiNC40YDQuNC90LAuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoINCd0L7QstCw0Y8g0LLRi9GB0L7RgtCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlc2l6ZSByZW5kZXJlciB0byA2MDB4NDAwLlxuICAgKiByZW5kZXJlci5yZXNpemUoIDYwMCwgNDAwICk7XG4gICAqL1xuICByZXNpemU6IGZ1bmN0aW9uIHJlc2l6ZSAoIHcsIGggKVxuICB7XG4gICAgdmFyIGNhbnZhcyA9IHRoaXMuY2FudmFzO1xuICAgIHZhciBzY2FsZSA9IHRoaXMuc2V0dGluZ3Muc2NhbGU7XG4gICAgY2FudmFzLnN0eWxlLndpZHRoID0gdyArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGggKyAncHgnO1xuICAgIGNhbnZhcy53aWR0aCA9IHRoaXMudyA9IE1hdGguZmxvb3IoIHcgKiBzY2FsZSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmggPSBNYXRoLmZsb29yKCBoICogc2NhbGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCY0LfQvNC10L3Rj9C10YIg0YDQsNC30LzQtdGAINGA0LXQvdC00LXRgNC10YDQsCDQtNC+INGA0LDQt9C80LXRgNCwIGBlbGVtZW50YCDRjdC70LXQvNC10L3RgtCwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVzaXplVG9cbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50INCt0LvQtdC80LXQvdGCLCDQtNC+INC60L7RgtC+0YDQvtCz0L4g0L3QsNC00L4g0YDQsNGB0YLRj9C90YPRgtGMINGA0LXQvdC00LXRgNC10YAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVzaXplIHJlbmRlcmVyIHRvIG1hdGNoIDxib2R5IC8+IHNpemVzLlxuICAgKiByZW5kZXJlci5yZXNpemVUbyggZG9jdW1lbnQuYm9keSApO1xuICAgKi9cbiAgcmVzaXplVG86IGZ1bmN0aW9uIHJlc2l6ZVRvICggZWxlbWVudCApXG4gIHtcbiAgICByZXR1cm4gdGhpcy5yZXNpemUoIGdldEVsZW1lbnRXKCBlbGVtZW50ICksIGdldEVsZW1lbnRIKCBlbGVtZW50ICkgKTtcbiAgfSxcbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQv9C+0LvQuNCz0L7QvS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2RyYXdQb2x5Z29uXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgeCAgICAgICAgICAgICBYINC60L7QvtGA0LTQuNC90LDRgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgeSAgICAgICAgICAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgc2lkZXMgICAgICAgICDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdGC0L7RgNC+0L0g0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB4UmFkaXVzICAgICAgIFgg0YDQsNC00LjRg9GBINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgeVJhZGl1cyAgICAgICBZINGA0LDQtNC40YPRgSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgIHJvdGF0aW9uQW5nbGUg0KPQs9C+0Lsg0L/QvtCy0L7RgNC+0YLQsCDQv9C+0LvQuNCz0L7QvdCwXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAo0YfRgtC+0LHRiyDQvdC1INC40YHQv9C+0LvRjNC30L7QstCw0YLRjCB7QGxpbmsgdjYuVHJhbnNmb3JtI3JvdGF0ZX0pLlxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgIGRlZ3JlZXMgICAgICAg0JjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMINCz0YDQsNC00YPRgdGLLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgaGV4YWdvbiBhdCBbIDQsIDIgXSB3aXRoIHJhZGl1cyAyNS5cbiAgICogcmVuZGVyZXIucG9seWdvbiggNCwgMiwgNiwgMjUsIDI1LCAwICk7XG4gICAqL1xuICBkcmF3UG9seWdvbjogZnVuY3Rpb24gZHJhd1BvbHlnb24gKCB4LCB5LCBzaWRlcywgeFJhZGl1cywgeVJhZGl1cywgcm90YXRpb25BbmdsZSwgZGVncmVlcyApXG4gIHtcbiAgICB2YXIgcG9seWdvbiA9IHBvbHlnb25zWyBzaWRlcyBdO1xuICAgIGlmICggISBwb2x5Z29uICkge1xuICAgICAgcG9seWdvbiA9IHBvbHlnb25zWyBzaWRlcyBdID0gY3JlYXRlUG9seWdvbiggc2lkZXMgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICB9XG4gICAgaWYgKCBkZWdyZWVzICkge1xuICAgICAgcm90YXRpb25BbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICAgIH1cbiAgICB0aGlzLm1hdHJpeC5zYXZlKCk7XG4gICAgdGhpcy5tYXRyaXgudHJhbnNsYXRlKCB4LCB5ICk7XG4gICAgdGhpcy5tYXRyaXgucm90YXRlKCByb3RhdGlvbkFuZ2xlICk7XG4gICAgdGhpcy5kcmF3QXJyYXlzKCBwb2x5Z29uLCBwb2x5Z29uLmxlbmd0aCAqIDAuNSwgdm9pZCAwLCB4UmFkaXVzLCB5UmFkaXVzICk7XG4gICAgdGhpcy5tYXRyaXgucmVzdG9yZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC/0L7Qu9C40LPQvtC9LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcG9seWdvblxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IHggICAgICAgICAgICAgICBYINC60L7QvtGA0LTQuNC90LDRgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0geSAgICAgICAgICAgICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSBzaWRlcyAgICAgICAgICAg0JrQvtC70LjRh9C10YHRgtCy0L4g0YHRgtC+0YDQvtC9INC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gciAgICAgICAgICAgICAgINCg0LDQtNC40YPRgSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IFtyb3RhdGlvbkFuZ2xlXSDQo9Cz0L7QuyDQv9C+0LLQvtGA0L7RgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjRh9GC0L7QsdGLINC90LUg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMIHtAbGluayB2Ni5UcmFuc2Zvcm0jcm90YXRlfSkuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBoZXhhZ29uIGF0IFsgNCwgMiBdIHdpdGggcmFkaXVzIDI1LlxuICAgKiByZW5kZXJlci5wb2x5Z29uKCA0LCAyLCA2LCAyNSApO1xuICAgKi9cbiAgcG9seWdvbjogZnVuY3Rpb24gcG9seWdvbiAoIHgsIHksIHNpZGVzLCByLCByb3RhdGlvbkFuZ2xlIClcbiAge1xuICAgIGlmICggc2lkZXMgJSAxICkge1xuICAgICAgc2lkZXMgPSBNYXRoLmZsb29yKCBzaWRlcyAqIDEwMCApICogMC4wMTtcbiAgICB9XG4gICAgaWYgKCB0eXBlb2Ygcm90YXRpb25BbmdsZSA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICB0aGlzLmRyYXdQb2x5Z29uKCB4LCB5LCBzaWRlcywgciwgciwgLU1hdGguUEkgKiAwLjUgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3UG9seWdvbiggeCwgeSwgc2lkZXMsIHIsIHIsIHJvdGF0aW9uQW5nbGUsIG9wdGlvbnMuZGVncmVlcyApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjaW1hZ2VcbiAgICogQHBhcmFtIHt2Ni5BYnN0cmFjdEltYWdlfSBpbWFnZSDQmtCw0YDRgtC40L3QutCwINC60L7RgtC+0YDRg9GOINC90LDQtNC+INC+0YLRgNC40YHQvtCy0LDRgtGMLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHggICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICB5ICAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgW3ddICAg0KjQuNGA0LjQvdCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgW2hdICAg0JLRi9GB0L7RgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gQ3JlYXRlIGltYWdlLlxuICAgKiB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnaW1hZ2UnICkgKTtcbiAgICogLy8gRHJhdyBpbWFnZSBhdCBbIDQsIDIgXS5cbiAgICogcmVuZGVyZXIuaW1hZ2UoIGltYWdlLCA0LCAyICk7XG4gICAqL1xuICBpbWFnZTogZnVuY3Rpb24gaW1hZ2UgKCBpbWFnZSwgeCwgeSwgdywgaCApXG4gIHtcbiAgICBpZiAoIGltYWdlLmdldCgpLmxvYWRlZCApIHtcbiAgICAgIGlmICggdHlwZW9mIHcgPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICB3ID0gaW1hZ2UuZHc7XG4gICAgICB9XG4gICAgICBpZiAoIHR5cGVvZiBoID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgaCA9IGltYWdlLmRoO1xuICAgICAgfVxuICAgICAgeCA9IHByb2Nlc3NSZWN0QWxpZ25YKCB0aGlzLCB4LCB3ICk7XG4gICAgICB4ID0gcHJvY2Vzc1JlY3RBbGlnblkoIHRoaXMsIHksIGggKTtcbiAgICAgIHRoaXMuZHJhd0ltYWdlKCBpbWFnZSwgeCwgeSwgdywgaCApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LTQu9GPINC90LDRh9Cw0LvQsCDQvtGC0YDQuNGB0L7QstC60Lgg0YTQuNCz0YPRgNGLLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICAgKiBAcGFyYW0ge29iamVjdH0gICBbb3B0aW9uc10gICAgICAgICAgICAgINCf0LDRgNCw0LzQtdGC0YDRiyDRhNC40LPRg9GA0YsuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLmRyYXdGdW5jdGlvbl0g0KTRg9C90LrRhtC40Y8sINC60L7RgtC+0YDQvtGPINCx0YPQtNC10YIg0L7RgtGA0LjRgdC+0LLRi9Cy0LDRgtGMINCy0YHQtSDQstC10YDRiNC40L3RiyDQsiB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlci5lbmRTaGFwZX0uINCc0L7QttC10YIg0LHRi9GC0Ywg0L/QtdGA0LXQt9Cw0L/QuNGB0LDQvdCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlcXVpcmUgXCJ2Ni5zaGFwZXNcIiAoXCJ2Ni5qc1wiIGJ1aWx0LWluIGRyYXdpbmcgZnVuY3Rpb25zKS5cbiAgICogdmFyIHNoYXBlcyA9IHJlcXVpcmUoICd2Ni5qcy9yZW5kZXJlci9zaGFwZXMvcG9pbnRzJyApO1xuICAgKiAvLyBCZWdpbiBkcmF3aW5nIHBvaW50cyBzaGFwZS5cbiAgICogcmVuZGVyZXIuYmVnaW5TaGFwZSggeyBkcmF3RnVuY3Rpb246IHNoYXBlcy5kcmF3UG9pbnRzIH0gKTtcbiAgICogLy8gQmVnaW4gZHJhd2luZyBzaGFwZSB3aXRob3V0IGRyYXdpbmcgZnVuY3Rpb24gKG11c3QgYmUgcGFzc2VkIGxhdGVyIGluIGBlbmRTaGFwZWApLlxuICAgKiByZW5kZXJlci5iZWdpblNoYXBlKCk7XG4gICAqL1xuICBiZWdpblNoYXBlOiBmdW5jdGlvbiBiZWdpblNoYXBlICggb3B0aW9ucyApXG4gIHtcbiAgICBpZiAoICEgb3B0aW9ucyApIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgdGhpcy5fdmVydGljZXMubGVuZ3RoID0gMDtcbiAgICB0aGlzLl9jbG9zZWRTaGFwZSA9IG51bGw7XG4gICAgaWYgKCB0eXBlb2Ygb3B0aW9ucy5kcmF3RnVuY3Rpb24gPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgdGhpcy5fZHJhd0Z1bmN0aW9uID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZHJhd0Z1bmN0aW9uID0gb3B0aW9ucy5kcmF3RnVuY3Rpb247XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0LLQtdGA0YjQuNC90YMg0LIg0LrQvtC+0YDQtNC40L3QsNGC0LDRhSDQuNC3INGB0L7QvtGC0LLQtdGC0YHQstGD0Y7RidC40YUg0L/QsNGA0LDQvNC10YLRgNC+0LIuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciN2ZXJ0ZXhcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQvdC+0LLQvtC5INCy0LXRgNGI0LjQvdGLLlxuICAgKiBAcGFyYW0ge251bWJlcn0geSBZINC60L7QvtGA0LTQuNC90LDRgtCwINC90L7QstC+0Lkg0LLQtdGA0YjQuNC90YsuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgcmVjdGFuZ2xlIHdpdGggdmVydGljZXMuXG4gICAqIHJlbmRlcmVyLnZlcnRleCggMCwgMCApO1xuICAgKiByZW5kZXJlci52ZXJ0ZXgoIDEsIDAgKTtcbiAgICogcmVuZGVyZXIudmVydGV4KCAxLCAxICk7XG4gICAqIHJlbmRlcmVyLnZlcnRleCggMCwgMSApO1xuICAgKi9cbiAgdmVydGV4OiBmdW5jdGlvbiB2ZXJ0ZXggKCB4LCB5IClcbiAge1xuICAgIHRoaXMuX3ZlcnRpY2VzLnB1c2goIE1hdGguZmxvb3IoIHggKSwgTWF0aC5mbG9vciggeSApICk7XG4gICAgdGhpcy5fY2xvc2VkU2hhcGUgPSBudWxsO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINGE0LjQs9GD0YDRgyDQuNC3INCy0LXRgNGI0LjQvS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSAgIFtvcHRpb25zXSAgICAgICAgICAgICAg0J/QsNGA0LDQvNC10YLRgNGLINGE0LjQs9GD0YDRiy5cbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMuY2xvc2VdICAgICAgICDQodC+0LXQtNC40L3QuNGC0Ywg0L/QvtGB0LvQtdC00L3RjtGOINCy0LXRgNGI0LjQvdGDINGBINC/0LXRgNCy0L7QuSAo0LfQsNC60YDRi9GC0Ywg0YTQuNCz0YPRgNGDKS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMuZHJhd0Z1bmN0aW9uXSDQpNGD0L3QutGG0LjRjywg0LrQvtGC0L7RgNC+0Y8g0LHRg9C00LXRgiDQvtGC0YDQuNGB0L7QstGL0LLQsNGC0Ywg0LLRgdC1INCy0LXRgNGI0LjQvdGLLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINCY0LzQtdC10YIg0LHQvtC70YzRiNC40Lkg0L/RgNC40L7RgNC40YLQtdGCINGH0LXQvCDQsiB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlfS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXF1aXJlIFwidjYuc2hhcGVzXCIgKFwidjYuanNcIiBidWlsdC1pbiBkcmF3aW5nIGZ1bmN0aW9ucykuXG4gICAqIHZhciBzaGFwZXMgPSByZXF1aXJlKCAndjYuanMvcmVuZGVyZXIvc2hhcGVzL3BvaW50cycgKTtcbiAgICogLy8gQ2xvc2UgYW5kIGRyYXcgYSBzaGFwZS5cbiAgICogcmVuZGVyZXIuZW5kU2hhcGUoIHsgY2xvc2U6IHRydWUgfSApO1xuICAgKiAvLyBEcmF3IHdpdGggYSBjdXN0b20gZnVuY3Rpb24uXG4gICAqIHJlbmRlcmVyLmVuZFNoYXBlKCB7IGRyYXdGdW5jdGlvbjogc2hhcGVzLmRyYXdMaW5lcyB9ICk7XG4gICAqL1xuICBlbmRTaGFwZTogZnVuY3Rpb24gZW5kU2hhcGUgKCBvcHRpb25zIClcbiAge1xuICAgIHZhciBkcmF3RnVuY3Rpb247XG4gICAgdmFyIHZlcnRpY2VzO1xuICAgIGlmICggISBvcHRpb25zICkge1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICBpZiAoICEgKCBkcmF3RnVuY3Rpb24gPSBvcHRpb25zLmRyYXdGdW5jdGlvbiB8fCB0aGlzLl9kcmF3RnVuY3Rpb24gKSApIHtcbiAgICAgIHRocm93IEVycm9yKCAnTm8gXCJkcmF3RnVuY3Rpb25cIiBzcGVjaWZpZWQgZm9yIFwicmVuZGVyZXIuZW5kU2hhcGVcIicgKTtcbiAgICB9XG4gICAgaWYgKCBvcHRpb25zLmNsb3NlICkge1xuICAgICAgY2xvc2VTaGFwZSggdGhpcyApO1xuICAgICAgdmVydGljZXMgPSB0aGlzLl9jbG9zZWRTaGFwZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmVydGljZXMgPSB0aGlzLl92ZXJ0aWNlcztcbiAgICB9XG4gICAgZHJhd0Z1bmN0aW9uKCB0aGlzLCBwcm9jZXNzU2hhcGUoIHRoaXMsIHZlcnRpY2VzICkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNzYXZlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jc2F2ZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTYXZlIHRyYW5zZm9ybS5cbiAgICogcmVuZGVyZXIuc2F2ZSgpO1xuICAgKi9cbiAgc2F2ZTogZnVuY3Rpb24gc2F2ZSAoKVxuICB7XG4gICAgdGhpcy5tYXRyaXguc2F2ZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3Jlc3RvcmVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNyZXN0b3JlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlc3RvcmUgdHJhbnNmb3JtLlxuICAgKiByZW5kZXJlci5yZXN0b3JlKCk7XG4gICAqL1xuICByZXN0b3JlOiBmdW5jdGlvbiByZXN0b3JlICgpXG4gIHtcbiAgICB0aGlzLm1hdHJpeC5yZXN0b3JlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc2V0VHJhbnNmb3JtXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jc2V0VHJhbnNmb3JtXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBpZGVudGl0eSB0cmFuc2Zvcm0uXG4gICAqIHJlbmRlcmVyLnNldFRyYW5zZm9ybSggMSwgMCwgMCwgMSwgMCwgMCApO1xuICAgKi9cbiAgc2V0VHJhbnNmb3JtOiBmdW5jdGlvbiBzZXRUcmFuc2Zvcm0gKCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG4gIHtcbiAgICB0aGlzLm1hdHJpeC5zZXRUcmFuc2Zvcm0oIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjdHJhbnNsYXRlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jdHJhbnNsYXRlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFRyYW5zbGF0ZSB0cmFuc2Zvcm0gdG8gWyA0LCAyIF0uXG4gICAqIHJlbmRlcmVyLnRyYW5zbGF0ZSggNCwgMiApO1xuICAgKi9cbiAgdHJhbnNsYXRlOiBmdW5jdGlvbiB0cmFuc2xhdGUgKCB4LCB5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnRyYW5zbGF0ZSggeCwgeSApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JvdGF0ZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuVHJhbnNmb3JtI3JvdGF0ZVxuICAgKiBAdG9kbyByZW5kZXJlci5zZXR0aW5ncy5kZWdyZWVzXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJvdGF0ZSB0cmFuc2Zvcm0gb24gNDUgZGVncmVlcy5cbiAgICogcmVuZGVyZXIucm90YXRlKCA0NSAqIE1hdGguUEkgLyAxODAgKTtcbiAgICovXG4gIHJvdGF0ZTogZnVuY3Rpb24gcm90YXRlICggYW5nbGUgKVxuICB7XG4gICAgaWYgKCB0aGlzLnNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgICBhbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICAgIH1cbiAgICB0aGlzLm1hdHJpeC5yb3RhdGUoIGFuZ2xlICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc2NhbGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNzY2FsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTY2FsZSB0cmFuc2Zvcm0gdHdpY2UuXG4gICAqIHJlbmRlcmVyLnNjYWxlKCAyLCAyICk7XG4gICAqL1xuICBzY2FsZTogZnVuY3Rpb24gc2NhbGUgKCB4LCB5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnNjYWxlKCB4LCB5ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjdHJhbnNmb3JtXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jdHJhbnNmb3JtXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEFwcGx5IHRyYW5zbGF0ZWQgdG8gWyA0LCAyIF0gXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIi5cbiAgICogcmVuZGVyZXIudHJhbnNmb3JtKCAxLCAwLCAwLCAxLCA0LCAyICk7XG4gICAqL1xuICB0cmFuc2Zvcm06IGZ1bmN0aW9uIHRyYW5zZm9ybSAoIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnRyYW5zZm9ybSggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGxpbmVXaWR0aCAo0YjQuNGA0LjQvdGDINC60L7QvdGC0YPRgNCwKS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2xpbmVXaWR0aFxuICAgKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyINCd0L7QstGL0LkgbGluZVdpZHRoLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBgbGluZVdpZHRoYCB0byAxMHB4LlxuICAgKiByZW5kZXJlci5saW5lV2lkdGgoIDEwICk7XG4gICAqL1xuICBsaW5lV2lkdGg6IGZ1bmN0aW9uIGxpbmVXaWR0aCAoIG51bWJlciApXG4gIHtcbiAgICB0aGlzLl9saW5lV2lkdGggPSBudW1iZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgYmFja2dyb3VuZFBvc2l0aW9uWGAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZFBvc2l0aW9uWFxuICAgKiBAcGFyYW0ge251bWJlcn0gICB2YWx1ZVxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB0eXBlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IFwiYmFja2dyb3VuZFBvc2l0aW9uWFwiIGRyYXdpbmcgc2V0dGluZyB0byBDRU5URVIgKGRlZmF1bHQ6IExFRlQpLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25YKCBjb25zdGFudHMuZ2V0KCAnQ0VOVEVSJyApLCBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKTtcbiAgICogcmVuZGVyZXIuYmFja2dyb3VuZFBvc2l0aW9uWCggMC41LCBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25YKCByZW5kZXJlci53IC8gMiApO1xuICAgKi9cbiAgYmFja2dyb3VuZFBvc2l0aW9uWDogZnVuY3Rpb24gYmFja2dyb3VuZFBvc2l0aW9uWCAoIHZhbHVlLCB0eXBlICkgeyBpZiAoIHR5cGVvZiB0eXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlICE9PSBjb25zdGFudHMuZ2V0KCAnVkFMVUUnICkgKSB7IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ0NPTlNUQU5UJyApICkgeyB0eXBlID0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICk7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiTEVGVFwiICkgKSB7IHZhbHVlID0gMDsgfSBlbHNlIGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiQ0VOVEVSXCIgKSApIHsgdmFsdWUgPSAwLjU7IH0gZWxzZSBpZiAoIHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCBcIlJJR0hUXCIgKSApIHsgdmFsdWUgPSAxOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHZhbHVlLiBUaGUga25vd24gYXJlOiAnICsgXCJMRUZUXCIgKyAnLCAnICsgXCJDRU5URVJcIiArICcsICcgKyBcIlJJR0hUXCIgKTsgfSB9IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICkgKSB7IHZhbHVlICo9IHRoaXMudzsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgdmFsdWVgIHR5cGUuIFRoZSBrbm93biBhcmU6IFZBTFVFLCBQRVJDRU5ULCBDT05TVEFOVCcgKTsgfSB9IHRoaXMuX2JhY2tncm91bmRQb3NpdGlvblggPSB2YWx1ZTsgcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgYGJhY2tncm91bmRQb3NpdGlvbllgINC90LDRgdGC0YDQvtC50LrRgyDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRQb3NpdGlvbllcbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgdmFsdWVcbiAgICogQHBhcmFtIHtjb25zdGFudH0gdHlwZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBcImJhY2tncm91bmRQb3NpdGlvbllcIiBkcmF3aW5nIHNldHRpbmcgdG8gTUlERExFIChkZWZhdWx0OiBUT1ApLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25ZKCBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApLCBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKTtcbiAgICogcmVuZGVyZXIuYmFja2dyb3VuZFBvc2l0aW9uWSggMC41LCBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25ZKCByZW5kZXJlci5oIC8gMiApO1xuICAgKi9cbiAgYmFja2dyb3VuZFBvc2l0aW9uWTogZnVuY3Rpb24gYmFja2dyb3VuZFBvc2l0aW9uWSAoIHZhbHVlLCB0eXBlICkgeyBpZiAoIHR5cGVvZiB0eXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlICE9PSBjb25zdGFudHMuZ2V0KCAnVkFMVUUnICkgKSB7IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ0NPTlNUQU5UJyApICkgeyB0eXBlID0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICk7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiVE9QXCIgKSApIHsgdmFsdWUgPSAwOyB9IGVsc2UgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJNSURETEVcIiApICkgeyB2YWx1ZSA9IDAuNTsgfSBlbHNlIGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiQk9UVE9NXCIgKSApIHsgdmFsdWUgPSAxOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHZhbHVlLiBUaGUga25vd24gYXJlOiAnICsgXCJUT1BcIiArICcsICcgKyBcIk1JRERMRVwiICsgJywgJyArIFwiQk9UVE9NXCIgKTsgfSB9IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICkgKSB7IHZhbHVlICo9IHRoaXMuaDsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgdmFsdWVgIHR5cGUuIFRoZSBrbm93biBhcmU6IFZBTFVFLCBQRVJDRU5ULCBDT05TVEFOVCcgKTsgfSB9IHRoaXMuX2JhY2tncm91bmRQb3NpdGlvblkgPSB2YWx1ZTsgcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgYHJlY3RBbGlnblhgINC90LDRgdGC0YDQvtC50LrRgyDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3RBbGlnblhcbiAgICogQHBhcmFtIHtjb25zdGFudH0gdmFsdWUgYExFRlRgLCBgQ0VOVEVSYCwgYFJJR0hUYC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTZXQgXCJyZWN0QWxpZ25YXCIgZHJhd2luZyBzZXR0aW5nIHRvIENFTlRFUiAoZGVmYXVsdDogTEVGVCkuXG4gICAqIHJlbmRlcmVyLnJlY3RBbGlnblgoIGNvbnN0YW50cy5nZXQoICdDRU5URVInICkgKTtcbiAgICovXG4gIHJlY3RBbGlnblg6IGZ1bmN0aW9uIHJlY3RBbGlnblggKCB2YWx1ZSApIHsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ0xFRlQnICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdDRU5URVInICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdSSUdIVCcgKSApIHsgdGhpcy5fcmVjdEFsaWduWCA9IHZhbHVlOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGByZWN0QWxpZ25gIGNvbnN0YW50LiBUaGUga25vd24gYXJlOiAnICsgXCJMRUZUXCIgKyAnLCAnICsgXCJDRU5URVJcIiArICcsICcgKyBcIlJJR0hUXCIgKTsgfSByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgcmVjdEFsaWduWWAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdEFsaWduWVxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB2YWx1ZSBgVE9QYCwgYE1JRERMRWAsIGBCT1RUT01gLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBcInJlY3RBbGlnbllcIiBkcmF3aW5nIHNldHRpbmcgdG8gTUlERExFIChkZWZhdWx0OiBUT1ApLlxuICAgKiByZW5kZXJlci5yZWN0QWxpZ25ZKCBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApICk7XG4gICAqL1xuICByZWN0QWxpZ25ZOiBmdW5jdGlvbiByZWN0QWxpZ25ZICggdmFsdWUgKSB7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdMRUZUJyApIHx8IHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCAnQ0VOVEVSJyApIHx8IHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCAnUklHSFQnICkgKSB7IHRoaXMuX3JlY3RBbGlnblkgPSB2YWx1ZTsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgcmVjdEFsaWduYCBjb25zdGFudC4gVGhlIGtub3duIGFyZTogJyArIFwiVE9QXCIgKyAnLCAnICsgXCJNSURETEVcIiArICcsICcgKyBcIkJPVFRPTVwiICk7IH0gcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIg0YbQstC10YIgYHN0cm9rZWAg0L/RgNC4INGA0LjRgdC+0LLQsNC90LjQuCDRh9C10YDQtdC3IHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3R9INC4INGCLtC/LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc3Ryb2tlXG4gICAqIEBwYXJhbSB7bnVtYmVyfGJvb2xlYW58VENvbG9yfSBbcl0g0JXRgdC70Lgg0Y3RgtC+IGBib29sZWFuYCwg0YLQviDRjdGC0L4g0LLQutC70Y7Rh9C40YIg0LjQu9C4INCy0YvQutC70Y7Rh9C40YIgYHN0cm9rZWBcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAo0LrQsNC6INGH0LXRgNC10Lcge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXIjbm9TdHJva2V9KS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYV1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEaXNhYmxlIGFuZCB0aGVuIGVuYWJsZSBgc3Ryb2tlYC5cbiAgICogcmVuZGVyZXIuc3Ryb2tlKCBmYWxzZSApLnN0cm9rZSggdHJ1ZSApO1xuICAgKiAvLyBTZXQgYHN0cm9rZWAgdG8gXCJsaWdodHNreWJsdWVcIi5cbiAgICogcmVuZGVyZXIuc3Ryb2tlKCAnbGlnaHRza3libHVlJyApO1xuICAgKiAvLyBTZXQgYHN0cm9rZWAgZnJvbSBgdjYuUkdCQWAuXG4gICAqIHJlbmRlcmVyLnN0cm9rZSggbmV3IFJHQkEoIDI1NSwgMCwgMCApLnBlcmNlaXZlZEJyaWdodG5lc3MoKSApO1xuICAgKi9cbiAgc3Ryb2tlOiBmdW5jdGlvbiBzdHJva2UgKCByLCBnLCBiLCBhICkgeyBpZiAoIHR5cGVvZiByID09PSAnYm9vbGVhbicgKSB7IHRoaXMuX2RvU3Ryb2tlID0gcjsgfSBlbHNlIHsgaWYgKCB0eXBlb2YgciA9PT0gJ3N0cmluZycgfHwgdGhpcy5fc3Ryb2tlQ29sb3IudHlwZSAhPT0gdGhpcy5zZXR0aW5ncy5jb2xvci50eXBlICkgeyB0aGlzLl9zdHJva2VDb2xvciA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7IH0gZWxzZSB7IHRoaXMuX3N0cm9rZUNvbG9yLnNldCggciwgZywgYiwgYSApOyB9IHRoaXMuX2RvU3Ryb2tlID0gdHJ1ZTsgfSByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiDRhtCy0LXRgiBgZmlsbGAg0L/RgNC4INGA0LjRgdC+0LLQsNC90LjQuCDRh9C10YDQtdC3IHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3R9INC4INGCLtC/LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZmlsbFxuICAgKiBAcGFyYW0ge251bWJlcnxib29sZWFufFRDb2xvcn0gW3JdINCV0YHQu9C4INGN0YLQviBgYm9vbGVhbmAsINGC0L4g0Y3RgtC+INCy0LrQu9GO0YfQuNGCINC40LvQuCDQstGL0LrQu9GO0YfQuNGCIGBmaWxsYFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjQutCw0Log0YfQtdGA0LXQtyB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlciNub0ZpbGx9KS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYV1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEaXNhYmxlIGFuZCB0aGVuIGVuYWJsZSBgZmlsbGAuXG4gICAqIHJlbmRlcmVyLmZpbGwoIGZhbHNlICkuZmlsbCggdHJ1ZSApO1xuICAgKiAvLyBTZXQgYGZpbGxgIHRvIFwibGlnaHRwaW5rXCIuXG4gICAqIHJlbmRlcmVyLmZpbGwoICdsaWdodHBpbmsnICk7XG4gICAqIC8vIFNldCBgZmlsbGAgZnJvbSBgdjYuUkdCQWAuXG4gICAqIHJlbmRlcmVyLmZpbGwoIG5ldyBSR0JBKCAyNTUsIDAsIDAgKS5icmlnaHRuZXNzKCkgKTtcbiAgICovXG4gIGZpbGw6IGZ1bmN0aW9uIGZpbGwgKCByLCBnLCBiLCBhICkgeyBpZiAoIHR5cGVvZiByID09PSAnYm9vbGVhbicgKSB7IHRoaXMuX2RvRmlsbCA9IHI7IH0gZWxzZSB7IGlmICggdHlwZW9mIHIgPT09ICdzdHJpbmcnIHx8IHRoaXMuX2ZpbGxDb2xvci50eXBlICE9PSB0aGlzLnNldHRpbmdzLmNvbG9yLnR5cGUgKSB7IHRoaXMuX2ZpbGxDb2xvciA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7IH0gZWxzZSB7IHRoaXMuX2ZpbGxDb2xvci5zZXQoIHIsIGcsIGIsIGEgKTsgfSB0aGlzLl9kb0ZpbGwgPSB0cnVlOyB9IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCS0YvQutC70Y7Rh9Cw0LXRgiDRgNC40YHQvtCy0LDQvdC40LUg0LrQvtC90YLRg9GA0LAgKHN0cm9rZSkuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNub1N0cm9rZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERpc2FibGUgZHJhd2luZyBzdHJva2UuXG4gICAqIHJlbmRlcmVyLm5vU3Ryb2tlKCk7XG4gICAqL1xuICBub1N0cm9rZTogZnVuY3Rpb24gbm9TdHJva2UgKCkgeyB0aGlzLl9kb1N0cm9rZSA9IGZhbHNlOyByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQktGL0LrQu9GO0YfQsNC10YIg0LfQsNC/0L7Qu9C90LXQvdC40Y8g0YTQvtC90LAgKGZpbGwpLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjbm9GaWxsXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRGlzYWJsZSBmaWxsaW5nLlxuICAgKiByZW5kZXJlci5ub0ZpbGwoKTtcbiAgICovXG4gIG5vRmlsbDogZnVuY3Rpb24gbm9GaWxsICgpIHsgdGhpcy5fZG9GaWxsID0gZmFsc2U7IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCX0LDQv9C+0LvQvdGP0LXRgiDRhNC+0L0g0YDQtdC90LTQtdGA0LXRgNCwINGG0LLQtdGC0L7QvC5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRDb2xvclxuICAgKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtiXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEZpbGwgcmVuZGVyZXIgd2l0aCBcImxpZ2h0cGlua1wiIGNvbG9yLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kQ29sb3IoICdsaWdodHBpbmsnICk7XG4gICAqL1xuICAvKipcbiAgICog0JfQsNC/0L7Qu9C90Y/QtdGCINGE0L7QvSDRgNC10L3QtNC10YDQtdGA0LAg0LrQsNGA0YLQuNC90LrQvtC5LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZEltYWdlXG4gICAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCwg0LrQvtGC0L7RgNCw0Y8g0LTQvtC70LbQvdCwINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0LTQu9GPINGE0L7QvdCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENyZWF0ZSBiYWNrZ3JvdW5kIGltYWdlLlxuICAgKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnYmFja2dyb3VuZC5qcGcnICk7XG4gICAqIC8vIEZpbGwgcmVuZGVyZXIgd2l0aCB0aGUgaW1hZ2UuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRJbWFnZSggSW1hZ2Uuc3RyZXRjaCggaW1hZ2UsIHJlbmRlcmVyLncsIHJlbmRlcmVyLmggKSApO1xuICAgKi9cbiAgLyoqXG4gICAqINCe0YfQuNGJ0LDQtdGCINC60L7QvdGC0LXQutGB0YIuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNjbGVhclxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENsZWFyIHJlbmRlcmVyJ3MgY29udGV4dC5cbiAgICogcmVuZGVyZXIuY2xlYXIoKTtcbiAgICovXG4gIC8qKlxuICAgKiDQntGC0YDQuNGB0L7QstGL0LLQsNC10YIg0L/QtdGA0LXQtNCw0L3QvdGL0LUg0LLQtdGA0YjQuNC90YsuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNkcmF3QXJyYXlzXG4gICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5fSB2ZXJ0cyDQktC10YDRiNC40L3Riywg0LrQvtGC0L7RgNGL0LUg0L3QsNC00L4g0L7RgtGA0LjRgdC+0LLQsNGC0YwuINCV0YHQu9C4INC90LUg0L/QtdGA0LXQtNCw0L3QviDQtNC70Y9cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtAbGluayB2Ni5SZW5kZXJlckdMfSwg0YLQviDQsdGD0LTRg9GCINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0LLQtdGA0YjQuNC90Ysg0LjQt1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0YHRgtCw0L3QtNCw0YDRgtC90L7Qs9C+INCx0YPRhNC10YDQsCAoe0BsaW5rIHY2LlJlbmRlcmVyR0wjYnVmZmVycy5kZWZhdWx0fSkuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICBjb3VudCDQmtC+0LvQuNGH0LXRgdGC0LLQviDQstC10YDRiNC40L0sINC90LDQv9GA0LjQvNC10YA6IDMg0LTQu9GPINGC0YDQtdGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBBIHRyaWFuZ2xlLlxuICAgKiB2YXIgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KCBbXG4gICAqICAgMCwgIDAsXG4gICAqICAgNTAsIDUwLFxuICAgKiAgIDAsICA1MFxuICAgKiBdICk7XG4gICAqXG4gICAqIC8vIERyYXcgdGhlIHRyaWFuZ2xlLlxuICAgKiByZW5kZXJlci5kcmF3QXJyYXlzKCB2ZXJ0aWNlcywgMyApO1xuICAgKi9cbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZHJhd0ltYWdlXG4gICAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCDQutC+0YLQvtGA0YPRjiDQvdCw0LTQviDQvtGC0YDQuNGB0L7QstCw0YLRjC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICB4ICAgICBcIkRlc3RpbmF0aW9uIFhcIi4gWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHkgICAgIFwiRGVzdGluYXRpb24gWVwiLiBZINC60L7QvtGA0LTQuNC90LDRgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgdyAgICAgXCJEZXN0aW5hdGlvbiBXaWR0aFwiLiDQqNC40YDQuNC90LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICBoICAgICBcIkRlc3RpbmF0aW9uIEhlaWdodFwiLiDQktGL0YHQvtGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBDcmVhdGUgaW1hZ2UuXG4gICAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICczMDB4MjAwLnBuZycgKTtcbiAgICogLy8gRHJhdyBpbWFnZSBhdCBbIDAsIDAgXS5cbiAgICogcmVuZGVyZXIuZHJhd0ltYWdlKCBpbWFnZSwgMCwgMCwgNjAwLCA0MDAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LouXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZWN0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gdyDQqNC40YDQuNC90LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGgg0JLRi9GB0L7RgtCwINC/0YDRj9C80L7Rg9Cz0L7Qu9GM0L3QuNC60LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBzcXVhcmUgYXQgWyAyMCwgMjAgXSB3aXRoIHNpemUgODAuXG4gICAqIHJlbmRlcmVyLnJlY3QoIDIwLCAyMCwgODAsIDgwICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC60YDRg9CzLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYXJjXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrRgNGD0LPQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQutGA0YPQs9CwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gciDQoNCw0LTQuNGD0YEg0LrRgNGD0LPQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGNpcmNsZSBhdCBbIDYwLCA2MCBdIHdpdGggcmFkaXVzIDQwLlxuICAgKiByZW5kZXJlci5hcmMoIDYwLCA2MCwgNDAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0LvQuNC90LjRji5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2xpbmVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHgxIFgg0L3QsNGH0LDQu9CwINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MSBZINC90LDRh9Cw0LvQsCDQu9C40L3QuNC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0geDIgWCDQutC+0L3RhtGLINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MiBZINC60L7QvdGG0Ysg0LvQuNC90LjQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGxpbmUgZnJvbSBbIDEwLCAxMCBdIHRvIFsgMjAsIDIwIF0uXG4gICAqIHJlbmRlcmVyLmxpbmUoIDEwLCAxMCwgMjAsIDIwICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINGC0L7Rh9C60YMuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwb2ludFxuICAgKiBAcGFyYW0ge251bWJlcn0geCBYINC60L7QvtGA0LTQuNC90LDRgtCwINGC0L7Rh9C60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5IFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0YLQvtGH0LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IHBvaW50IGF0IFsgNCwgMiBdLlxuICAgKiByZW5kZXJlci5wb2ludCggNCwgMiApO1xuICAgKi9cbiAgY29uc3RydWN0b3I6IEFic3RyYWN0UmVuZGVyZXJcbn07XG4vKipcbiAqIEluaXRpYWxpemUgcmVuZGVyZXIgb24gYFwic2VsZlwiYC5cbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlci5jcmVhdGVcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHNlbGYgICAgUmVuZGVyZXIgdGhhdCBzaG91bGQgYmUgaW5pdGlhbGl6ZWQuXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgICAgICBvcHRpb25zIHtAbGluayB2Ni5zZXR0aW5ncy5yZW5kZXJlcn1cbiAqIEBwYXJhbSAge2NvbnN0YW50fSAgICAgICAgICAgIHR5cGUgICAgVHlwZSBvZiByZW5kZXJlcjogYDJEYCBvciBgR0xgLiBDYW5ub3QgYmUgYEFVVE9gIS5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICAgICAgICAgUmV0dXJucyBub3RoaW5nLlxuICogQGV4YW1wbGUgPGNhcHRpb24+Q3VzdG9tIFJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIEFic3RyYWN0UmVuZGVyZXIgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyJyApO1xuICogdmFyIHNldHRpbmdzICAgICAgICAgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9zZXR0aW5ncycgKTtcbiAqIHZhciBjb25zdGFudHMgICAgICAgID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29uc3RhbnRzJyApO1xuICpcbiAqIGZ1bmN0aW9uIEN1c3RvbVJlbmRlcmVyICggb3B0aW9ucyApXG4gKiB7XG4gKiAgIC8vIEluaXRpYWxpemUgQ3VzdG9tUmVuZGVyZXIuXG4gKiAgIEFic3RyYWN0UmVuZGVyZXIuY3JlYXRlKCB0aGlzLCBkZWZhdWx0cyggc2V0dGluZ3MsIG9wdGlvbnMgKSwgY29uc3RhbnRzLmdldCggJzJEJyApICk7XG4gKiB9XG4gKi9cbkFic3RyYWN0UmVuZGVyZXIuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlICggc2VsZiwgb3B0aW9ucywgdHlwZSApXG57XG4gIHZhciBjb250ZXh0O1xuICAvKipcbiAgICogYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINC00LvRjyDQvtGC0YDQuNGB0L7QstC60Lgg0L3QsCDRjdC60YDQsNC90LUuXG4gICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2NhbnZhc1xuICAgKi9cbiAgaWYgKCBvcHRpb25zLmNhbnZhcyApIHtcbiAgICBzZWxmLmNhbnZhcyA9IG9wdGlvbnMuY2FudmFzO1xuICB9IGVsc2Uge1xuICAgIHNlbGYuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcbiAgICBzZWxmLmNhbnZhcy5pbm5lckhUTUwgPSAnVW5hYmxlIHRvIHJ1biB0aGlzIGFwcGxpY2F0aW9uLic7XG4gIH1cbiAgaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnMkQnICkgKSB7XG4gICAgY29udGV4dCA9ICcyZCc7XG4gIH0gZWxzZSBpZiAoIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoICdHTCcgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHJlbmRlcmVyIHR5cGUuIFRoZSBrbm93biBhcmU6IDJEIGFuZCBHTCcgKTtcbiAgfSBlbHNlIGlmICggISAoIGNvbnRleHQgPSBnZXRXZWJHTCgpICkgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgZ2V0IFdlYkdMIGNvbnRleHQuIFRyeSB0byB1c2UgMkQgYXMgdGhlIHJlbmRlcmVyIHR5cGUgb3IgdjYuUmVuZGVyZXIyRCBpbnN0ZWFkIG9mIHY2LlJlbmRlcmVyR0wnICk7XG4gIH1cbiAgLyoqXG4gICAqINCa0L7QvdGC0LXQutGB0YIg0YXQvtC70YHRgtCwLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LkFic3RyYWN0UmVuZGVyZXIjY29udGV4dFxuICAgKi9cbiAgc2VsZi5jb250ZXh0ID0gc2VsZi5jYW52YXMuZ2V0Q29udGV4dCggY29udGV4dCwge1xuICAgIGFscGhhOiBvcHRpb25zLmFscGhhXG4gIH0gKTtcbiAgLyoqXG4gICAqINCd0LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQtdGA0LAuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuQWJzdHJhY3RSZW5kZXJlciNzZXR0aW5nc1xuICAgKiBAc2VlIHY2LnNldHRpbmdzLnJlbmRlcmVyLnNldHRpbmdzXG4gICAqL1xuICBzZWxmLnNldHRpbmdzID0gb3B0aW9ucy5zZXR0aW5ncztcbiAgLyoqXG4gICAqINCi0LjQvyDRgNC10L3QtNC10YDQtdGA0LA6IEdMLCAyRC5cbiAgICogQG1lbWJlciB7Y29uc3RhbnR9IHY2LkFic3RyYWN0UmVuZGVyZXIjdHlwZVxuICAgKi9cbiAgc2VsZi50eXBlID0gdHlwZTtcbiAgLyoqXG4gICAqINCh0YLRjdC6INGB0L7RhdGA0LDQvdC10L3QvdGL0YUg0L3QsNGB0YLRgNC+0LXQuiDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7QXJyYXkuPG9iamVjdD59IHY2LkFic3RyYWN0UmVuZGVyZXIjX3N0YWNrXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNwdXNoXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNwb3BcbiAgICovXG4gIHNlbGYuX3N0YWNrID0gW107XG4gIC8qKlxuICAgKiDQn9C+0LfQuNGG0LjRjyDQv9C+0YHQu9C10LTQvdC40YUg0YHQvtGF0YDQsNC90LXQvdC90YvRhSDQvdCw0YHRgtGA0L7QtdC6INGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkFic3RyYWN0UmVuZGVyZXIjX3N0YWNrSW5kZXhcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3B1c2hcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvcFxuICAgKi9cbiAgc2VsZi5fc3RhY2tJbmRleCA9IC0xO1xuICAvKipcbiAgICog0JLQtdGA0YjQuNC90Ysg0YTQuNCz0YPRgNGLLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48bnVtYmVyPn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfdmVydGljZXNcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICovXG4gIHNlbGYuX3ZlcnRpY2VzID0gW107XG4gIC8qKlxuICAgKiDQl9Cw0LrRgNGL0YLQsNGPINGE0LjQs9GD0YDQsCAo0LLQtdGA0YjQuNC90LApLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48bnVtYmVyPn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfZHJhd0Z1bmN0aW9uXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciN2ZXJ0ZXhcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqL1xuICBzZWxmLl9jbG9zZWRTaGFwZSA9IG51bGw7XG4gIC8qKlxuICAgKiDQpNGD0L3QutGG0LjRjywg0LrQvtGC0L7RgNC+0Y8g0LHRg9C00LXRgiDQvtGC0YDQuNGB0L7QstGL0LLQsNGC0Ywg0LLQtdGA0YjQuNC90YsuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge2Z1bmN0aW9ufSB2Ni5BYnN0cmFjdFJlbmRlcmVyI19kcmF3RnVuY3Rpb25cbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICovXG4gIHNlbGYuX2RyYXdGdW5jdGlvbiA9IG51bGw7XG4gIGlmICggdHlwZW9mIG9wdGlvbnMuYXBwZW5kVG8gPT09ICd1bmRlZmluZWQnICkge1xuICAgIHNlbGYuYXBwZW5kVG8oIGRvY3VtZW50LmJvZHkgKTtcbiAgfSBlbHNlIGlmICggb3B0aW9ucy5hcHBlbmRUbyAhPT0gbnVsbCApIHtcbiAgICBzZWxmLmFwcGVuZFRvKCBvcHRpb25zLmFwcGVuZFRvICk7XG4gIH1cbiAgaWYgKCAndycgaW4gb3B0aW9ucyB8fCAnaCcgaW4gb3B0aW9ucyApIHtcbiAgICBzZWxmLnJlc2l6ZSggb3B0aW9ucy53IHx8IDAsIG9wdGlvbnMuaCB8fCAwICk7XG4gIH0gZWxzZSBpZiAoIG9wdGlvbnMuYXBwZW5kVG8gIT09IG51bGwgKSB7XG4gICAgc2VsZi5yZXNpemVUbyggb3B0aW9ucy5hcHBlbmRUbyB8fCBkb2N1bWVudC5ib2R5ICk7XG4gIH0gZWxzZSB7XG4gICAgc2VsZi5yZXNpemUoIDYwMCwgNDAwICk7XG4gIH1cbiAgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyggc2VsZiwgc2VsZiApO1xufTtcbm1vZHVsZS5leHBvcnRzID0gQWJzdHJhY3RSZW5kZXJlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmF1bHRzICAgICAgICAgID0gcmVxdWlyZSggJ3BlYWtvL2RlZmF1bHRzJyApO1xuXG52YXIgY29uc3RhbnRzICAgICAgICAgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApO1xuXG52YXIgcHJvY2Vzc1JlY3RBbGlnblggPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblg7XG52YXIgcHJvY2Vzc1JlY3RBbGlnblkgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblk7XG5cbnZhciBBYnN0cmFjdFJlbmRlcmVyICA9IHJlcXVpcmUoICcuL0Fic3RyYWN0UmVuZGVyZXInICk7XG52YXIgc2V0dGluZ3MgICAgICAgICAgPSByZXF1aXJlKCAnLi9zZXR0aW5ncycgKTtcblxuLyoqXG4gKiAyRCDRgNC10L3QtNC10YDQtdGALlxuICogQGNvbnN0cnVjdG9yIHY2LlJlbmRlcmVyMkRcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0UmVuZGVyZXJcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIHtAbGluayB2Ni5zZXR0aW5ncy5yZW5kZXJlcn1cbiAqIEBleGFtcGxlXG4gKiAvLyBSZXF1aXJlIFJlbmRlcmVyMkQuXG4gKiB2YXIgUmVuZGVyZXIyRCA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyMkQnICk7XG4gKiAvLyBDcmVhdGUgYW4gUmVuZGVyZXIyRCBpc250YW5jZS5cbiAqIHZhciByZW5kZXJlciA9IG5ldyBSZW5kZXJlcjJEKCk7XG4gKi9cbmZ1bmN0aW9uIFJlbmRlcmVyMkQgKCBvcHRpb25zIClcbntcbiAgQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUoIHRoaXMsICggb3B0aW9ucyA9IGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApICksIGNvbnN0YW50cy5nZXQoICcyRCcgKSApO1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHY2LlJlbmRlcmVyMkQjbWF0cml4XG4gICAqIEBhbGlhcyB2Ni5SZW5kZXJlcjJEI2NvbnRleHRcbiAgICovXG4gIHRoaXMubWF0cml4ID0gdGhpcy5jb250ZXh0O1xufVxuXG5SZW5kZXJlcjJELnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlICk7XG5SZW5kZXJlcjJELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlbmRlcmVyMkQ7XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjYmFja2dyb3VuZENvbG9yXG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLmJhY2tncm91bmRDb2xvciA9IGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvciAoIHIsIGcsIGIsIGEgKVxue1xuICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzO1xuICB2YXIgY29udGV4dCAgPSB0aGlzLmNvbnRleHQ7XG5cbiAgY29udGV4dC5zYXZlKCk7XG4gIGNvbnRleHQuZmlsbFN0eWxlID0gbmV3IHNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7XG4gIGNvbnRleHQuc2V0VHJhbnNmb3JtKCAxLCAwLCAwLCAxLCAwLCAwICk7XG4gIGNvbnRleHQuZmlsbFJlY3QoIDAsIDAsIHRoaXMudywgdGhpcy5oICk7XG4gIGNvbnRleHQucmVzdG9yZSgpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNiYWNrZ3JvdW5kSW1hZ2VcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuYmFja2dyb3VuZEltYWdlID0gZnVuY3Rpb24gYmFja2dyb3VuZEltYWdlICggaW1hZ2UgKVxue1xuICB2YXIgX3JlY3RBbGlnblggPSB0aGlzLl9yZWN0QWxpZ25YO1xuICB2YXIgX3JlY3RBbGlnblkgPSB0aGlzLl9yZWN0QWxpZ25ZO1xuXG4gIHRoaXMuX3JlY3RBbGlnblggPSBjb25zdGFudHMuZ2V0KCAnQ0VOVEVSJyApO1xuICB0aGlzLl9yZWN0QWxpZ25ZID0gY29uc3RhbnRzLmdldCggJ01JRERMRScgKTtcblxuICB0aGlzLmltYWdlKCBpbWFnZSwgdGhpcy53ICogMC41LCB0aGlzLmggKiAwLjUgKTtcblxuICB0aGlzLl9yZWN0QWxpZ25YID0gX3JlY3RBbGlnblg7XG4gIHRoaXMuX3JlY3RBbGlnblkgPSBfcmVjdEFsaWduWTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjY2xlYXJcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiBjbGVhciAoKVxue1xuICB0aGlzLmNvbnRleHQuY2xlYXJSZWN0KCAwLCAwLCB0aGlzLncsIHRoaXMuaCApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjZHJhd0FycmF5c1xuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5kcmF3QXJyYXlzID0gZnVuY3Rpb24gZHJhd0FycmF5cyAoIHZlcnRzLCBjb3VudCwgX21vZGUsIF9zeCwgX3N5IClcbntcbiAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gIHZhciBpO1xuXG4gIGlmICggY291bnQgPCAyICkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaWYgKCB0eXBlb2YgX3N4ID09PSAndW5kZWZpbmVkJyApIHtcbiAgICBfc3ggPSBfc3kgPSAxOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICB9XG5cbiAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgY29udGV4dC5tb3ZlVG8oIHZlcnRzWyAwIF0gKiBfc3gsIHZlcnRzWyAxIF0gKiBfc3kgKTtcblxuICBmb3IgKCBpID0gMiwgY291bnQgKj0gMjsgaSA8IGNvdW50OyBpICs9IDIgKSB7XG4gICAgY29udGV4dC5saW5lVG8oIHZlcnRzWyBpIF0gKiBfc3gsIHZlcnRzWyBpICsgMSBdICogX3N5ICk7XG4gIH1cblxuICBpZiAoIHRoaXMuX2RvRmlsbCApIHtcbiAgICB0aGlzLl9maWxsKCk7XG4gIH1cblxuICBpZiAoIHRoaXMuX2RvU3Ryb2tlICYmIHRoaXMuX2xpbmVXaWR0aCA+IDAgKSB7XG4gICAgdGhpcy5fc3Ryb2tlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjZHJhd0ltYWdlXG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLmRyYXdJbWFnZSA9IGZ1bmN0aW9uIGRyYXdJbWFnZSAoIGltYWdlLCB4LCB5LCB3LCBoIClcbntcbiAgdGhpcy5jb250ZXh0LmRyYXdJbWFnZSggaW1hZ2UuZ2V0KCkuaW1hZ2UsIGltYWdlLnN4LCBpbWFnZS5zeSwgaW1hZ2Uuc3csIGltYWdlLnNoLCB4LCB5LCB3LCBoICk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNyZWN0XG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLnJlY3QgPSBmdW5jdGlvbiByZWN0ICggeCwgeSwgdywgaCApXG57XG4gIHggPSBwcm9jZXNzUmVjdEFsaWduWCggdGhpcywgeCwgdyApO1xuICB5ID0gcHJvY2Vzc1JlY3RBbGlnblkoIHRoaXMsIHksIGggKTtcblxuICB0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gIHRoaXMuY29udGV4dC5yZWN0KCB4LCB5LCB3LCBoICk7XG5cbiAgaWYgKCB0aGlzLl9kb0ZpbGwgKSB7XG4gICAgdGhpcy5fZmlsbCgpO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb1N0cm9rZSAmJiB0aGlzLl9saW5lV2lkdGggPiAwICkge1xuICAgIHRoaXMuX3N0cm9rZSgpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2FyY1xuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5hcmMgPSBmdW5jdGlvbiBhcmMgKCB4LCB5LCByIClcbntcbiAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICB0aGlzLmNvbnRleHQuYXJjKCB4LCB5LCByLCAwLCBNYXRoLlBJICogMiApO1xuXG4gIGlmICggdGhpcy5fZG9GaWxsICkge1xuICAgIHRoaXMuX2ZpbGwoKTtcbiAgfVxuXG4gIGlmICggdGhpcy5fZG9TdHJva2UgJiYgdGhpcy5fbGluZVdpZHRoID4gMCApIHtcbiAgICB0aGlzLl9zdHJva2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNsaW5lXG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLmxpbmUgPSBmdW5jdGlvbiBsaW5lICggeDEsIHkxLCB4MiwgeTIgKVxue1xuICBpZiAoIHRoaXMuX2RvU3Ryb2tlICYmIHRoaXMuX2xpbmVXaWR0aCA+IDAgKSB7XG4gICAgdGhpcy5jb250ZXh0Lm1vdmVUbyggeDEsIHkxICk7XG4gICAgdGhpcy5jb250ZXh0LmxpbmVUbyggeDIsIHkyICk7XG4gICAgdGhpcy5fc3Ryb2tlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjcG9pbnRcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUucG9pbnQgPSBmdW5jdGlvbiBwb2ludCAoIHgsIHkgKVxue1xuICB2YXIgdyA9IHRoaXMuX2xpbmVXaWR0aDtcblxuICBpZiAoIHRoaXMuX2RvU3Ryb2tlICYmIHcgPiAwICkge1xuICAgIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICB0aGlzLmNvbnRleHQucmVjdCggeCAtIHcgKiAwLjUsIHkgLSB3ICogMC41LCB3LCB3ICk7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuX3N0cm9rZUNvbG9yO1xuICAgIHRoaXMuY29udGV4dC5maWxsKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNfZmlsbFxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuX2ZpbGwgPSBmdW5jdGlvbiBfZmlsbCAoKVxue1xuICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5fZmlsbENvbG9yO1xuICB0aGlzLmNvbnRleHQuZmlsbCgpO1xufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI19zdHJva2VcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLl9zdHJva2UgPSBmdW5jdGlvbiBfc3Ryb2tlICgpXG57XG4gIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuXG4gIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLl9zdHJva2VDb2xvcjtcblxuICBpZiAoICggY29udGV4dC5saW5lV2lkdGggPSB0aGlzLl9saW5lV2lkdGggKSA8PSAxICkge1xuICAgIGNvbnRleHQuc3Ryb2tlKCk7XG4gIH1cblxuICBjb250ZXh0LnN0cm9rZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjJEO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVmYXVsdHMgICAgICAgICAgPSByZXF1aXJlKCAncGVha28vZGVmYXVsdHMnICk7XG5cbnZhciBjcmVhdGVBcnJheSAgICAgICA9IHJlcXVpcmUoICcuLi9pbnRlcm5hbC9jcmVhdGVfYXJyYXknICk7XG5cbnZhciBTaGFkZXJQcm9ncmFtICAgICA9IHJlcXVpcmUoICcuLi9TaGFkZXJQcm9ncmFtJyApO1xudmFyIFRyYW5zZm9ybSAgICAgICAgID0gcmVxdWlyZSggJy4uL1RyYW5zZm9ybScgKTtcbnZhciBjb25zdGFudHMgICAgICAgICA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICk7XG52YXIgc2hhZGVycyAgICAgICAgICAgPSByZXF1aXJlKCAnLi4vc2hhZGVycycgKTtcblxudmFyIHByb2Nlc3NSZWN0QWxpZ25YID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25YO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25ZID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25ZO1xuXG52YXIgQWJzdHJhY3RSZW5kZXJlciAgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFJlbmRlcmVyJyApO1xudmFyIHNldHRpbmdzICAgICAgICAgID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG5cbnZhciByZWN0ID0gY3JlYXRlQXJyYXkoIFtcbiAgMCwgMCxcbiAgMSwgMCxcbiAgMSwgMSxcbiAgMCwgMVxuXSApO1xuXG4vKipcbiAqIFdlYkdMINGA0LXQvdC00LXRgNC10YAuXG4gKiBAY29uc3RydWN0b3IgdjYuUmVuZGVyZXJHTFxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RSZW5kZXJlclxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMge0BsaW5rIHY2LnNldHRpbmdzLnJlbmRlcmVyfVxuICogQGV4YW1wbGVcbiAqIC8vIFJlcXVpcmUgUmVuZGVyZXJHTC5cbiAqIHZhciBSZW5kZXJlckdMID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXIvUmVuZGVyZXJHTCcgKTtcbiAqIC8vIENyZWF0ZSBhbiBSZW5kZXJlckdMIGlzbnRhbmNlLlxuICogdmFyIHJlbmRlcmVyID0gbmV3IFJlbmRlcmVyR0woKTtcbiAqL1xuZnVuY3Rpb24gUmVuZGVyZXJHTCAoIG9wdGlvbnMgKVxue1xuICBBYnN0cmFjdFJlbmRlcmVyLmNyZWF0ZSggdGhpcywgKCBvcHRpb25zID0gZGVmYXVsdHMoIHNldHRpbmdzLCBvcHRpb25zICkgKSwgY29uc3RhbnRzLmdldCggJ0dMJyApICk7XG5cbiAgLyoqXG4gICAqINCt0YLQsCBcInRyYW5zZm9ybWF0aW9uIG1hdHJpeFwiINC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8ge0BsaW5rIHY2LlJlbmRlcmVyR0wjcm90YXRlfSDQuCDRgi7Qvy5cbiAgICogQG1lbWJlciB7djYuVHJhbnNmb3JtfSB2Ni5SZW5kZXJlckdMI21hdHJpeFxuICAgKi9cbiAgdGhpcy5tYXRyaXggPSBuZXcgVHJhbnNmb3JtKCk7XG5cbiAgLyoqXG4gICAqINCR0YPRhNC10YDRiyDQtNCw0L3QvdGL0YUgKNCy0LXRgNGI0LjQvSkuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuUmVuZGVyZXJHTCNidWZmZXJzXG4gICAqIEBwcm9wZXJ0eSB7V2ViR0xCdWZmZXJ9IGRlZmF1bHQg0J7RgdC90L7QstC90L7QuSDQsdGD0YTQtdGALlxuICAgKiBAcHJvcGVydHkge1dlYkdMQnVmZmVyfSByZWN0ICAgINCY0YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0L7RgtGA0LjRgdC+0LLQutC4INC/0YDRj9C80L7Rg9Cz0L7Qu9GM0L3QuNC60LAg0LIge0BsaW5rIHY2LlJlbmRlcmVyR0wjcmVjdH0uXG4gICAqL1xuICB0aGlzLmJ1ZmZlcnMgPSB7XG4gICAgZGVmYXVsdDogdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlcigpLFxuICAgIHJlY3Q6ICB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKClcbiAgfTtcblxuICB0aGlzLmNvbnRleHQuYmluZEJ1ZmZlciggdGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXJzLnJlY3QgKTtcbiAgdGhpcy5jb250ZXh0LmJ1ZmZlckRhdGEoIHRoaXMuY29udGV4dC5BUlJBWV9CVUZGRVIsIHJlY3QsIHRoaXMuY29udGV4dC5TVEFUSUNfRFJBVyApO1xuXG4gIC8qKlxuICAgKiDQqNC10LnQtNC10YDRiyAoV2ViR0wg0L/RgNC+0LPRgNCw0LzQvNGLKS5cbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5SZW5kZXJlckdMI3Byb2dyYW1zXG4gICAqIEBwcm9wZXJ0eSB7djYuU2hhZGVyUHJvZ3JhbX0gZGVmYXVsdFxuICAgKi9cbiAgdGhpcy5wcm9ncmFtcyA9IHtcbiAgICBkZWZhdWx0OiBuZXcgU2hhZGVyUHJvZ3JhbSggc2hhZGVycy5iYXNpYywgdGhpcy5jb250ZXh0IClcbiAgfTtcblxuICB0aGlzLmJsZW5kaW5nKCBvcHRpb25zLmJsZW5kaW5nICk7XG59XG5cblJlbmRlcmVyR0wucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RSZW5kZXJlci5wcm90b3R5cGUgKTtcblJlbmRlcmVyR0wucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUmVuZGVyZXJHTDtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNyZXNpemVcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24gcmVzaXplICggdywgaCApXG57XG4gIEFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlLnJlc2l6ZS5jYWxsKCB0aGlzLCB3LCBoICk7XG4gIHRoaXMuY29udGV4dC52aWV3cG9ydCggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNibGVuZGluZ1xuICogQHBhcmFtIHtib29sZWFufSBibGVuZGluZ1xuICogQGNoYWluYWJsZVxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5ibGVuZGluZyA9IGZ1bmN0aW9uIGJsZW5kaW5nICggYmxlbmRpbmcgKVxue1xuICB2YXIgZ2wgPSB0aGlzLmNvbnRleHQ7XG5cbiAgaWYgKCBibGVuZGluZyApIHtcbiAgICBnbC5lbmFibGUoIGdsLkJMRU5EICk7XG4gICAgZ2wuZGlzYWJsZSggZ2wuREVQVEhfVEVTVCApO1xuICAgIGdsLmJsZW5kRnVuYyggZ2wuU1JDX0FMUEhBLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBICk7XG4gICAgZ2wuYmxlbmRFcXVhdGlvbiggZ2wuRlVOQ19BREQgKTtcbiAgfSBlbHNlIHtcbiAgICBnbC5kaXNhYmxlKCBnbC5CTEVORCApO1xuICAgIGdsLmVuYWJsZSggZ2wuREVQVEhfVEVTVCApO1xuICAgIGdsLmRlcHRoRnVuYyggZ2wuTEVRVUFMICk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0J7Rh9C40YnQsNC10YIg0LrQvtC90YLQtdC60YHRgi5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjX2NsZWFyXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHIg0J3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3QvtC1INC30L3QsNGH0LXQvdC40LUgXCJyZWQgY2hhbm5lbFwiLlxuICogQHBhcmFtICB7bnVtYmVyfSBnINCd0L7RgNC80LDQu9C40LfQvtCy0LDQvdC90L7QtSDQt9C90LDRh9C10L3QuNC1IFwiZ3JlZW4gY2hhbm5lbFwiLlxuICogQHBhcmFtICB7bnVtYmVyfSBiINCd0L7RgNC80LDQu9C40LfQvtCy0LDQvdC90L7QtSDQt9C90LDRh9C10L3QuNC1IFwiYmx1ZSBjaGFubmVsXCIuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGEg0J3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3QvtC1INC30L3QsNGH0LXQvdC40LUg0L/RgNC+0LfRgNCw0YfQvdC+0YHRgtC4IChhbHBoYSkuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogcmVuZGVyZXIuX2NsZWFyKCAxLCAwLCAwLCAxICk7IC8vIEZpbGwgY29udGV4dCB3aXRoIHJlZCBjb2xvci5cbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuX2NsZWFyID0gZnVuY3Rpb24gX2NsZWFyICggciwgZywgYiwgYSApXG57XG4gIHZhciBnbCA9IHRoaXMuY29udGV4dDtcbiAgZ2wuY2xlYXJDb2xvciggciwgZywgYiwgYSApO1xuICBnbC5jbGVhciggZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2JhY2tncm91bmRDb2xvclxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5iYWNrZ3JvdW5kQ29sb3IgPSBmdW5jdGlvbiBiYWNrZ3JvdW5kQ29sb3IgKCByLCBnLCBiLCBhIClcbntcbiAgdmFyIHJnYmEgPSBuZXcgdGhpcy5zZXR0aW5ncy5jb2xvciggciwgZywgYiwgYSApLnJnYmEoKTtcbiAgdGhpcy5fY2xlYXIoIHJnYmFbIDAgXSAvIDI1NSwgcmdiYVsgMSBdIC8gMjU1LCByZ2JhWyAyIF0gLyAyNTUsIHJnYmFbIDMgXSApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjY2xlYXJcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiBjbGVhciAoKVxue1xuICB0aGlzLl9jbGVhciggMCwgMCwgMCwgMCApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjZHJhd0FycmF5c1xuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5kcmF3QXJyYXlzID0gZnVuY3Rpb24gZHJhd0FycmF5cyAoIHZlcnRzLCBjb3VudCwgbW9kZSwgX3N4LCBfc3kgKVxue1xuICB2YXIgcHJvZ3JhbSA9IHRoaXMucHJvZ3JhbXMuZGVmYXVsdDtcbiAgdmFyIGdsICAgICAgPSB0aGlzLmNvbnRleHQ7XG5cbiAgaWYgKCBjb3VudCA8IDIgKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBpZiAoIHZlcnRzICkge1xuICAgIGlmICggdHlwZW9mIG1vZGUgPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgbW9kZSA9IGdsLlNUQVRJQ19EUkFXO1xuICAgIH1cblxuICAgIGdsLmJpbmRCdWZmZXIoIGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXJzLmRlZmF1bHQgKTtcbiAgICBnbC5idWZmZXJEYXRhKCBnbC5BUlJBWV9CVUZGRVIsIHZlcnRzLCBtb2RlICk7XG4gIH1cblxuICBpZiAoIHR5cGVvZiBfc3ggIT09ICd1bmRlZmluZWQnICkge1xuICAgIHRoaXMubWF0cml4LnNjYWxlKCBfc3gsIF9zeSApO1xuICB9XG5cbiAgcHJvZ3JhbVxuICAgIC51c2UoKVxuICAgIC5zZXRVbmlmb3JtKCAndXRyYW5zZm9ybScsIHRoaXMubWF0cml4Lm1hdHJpeCApXG4gICAgLnNldFVuaWZvcm0oICd1cmVzJywgWyB0aGlzLncsIHRoaXMuaCBdIClcbiAgICAuc2V0QXR0cmlidXRlKCAnYXBvcycsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCApO1xuXG4gIHRoaXMuX2ZpbGwoIGNvdW50ICk7XG4gIHRoaXMuX3N0cm9rZSggY291bnQgKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNfZmlsbFxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuX2ZpbGwgPSBmdW5jdGlvbiBfZmlsbCAoIGNvdW50IClcbntcbiAgaWYgKCB0aGlzLl9kb0ZpbGwgKSB7XG4gICAgdGhpcy5wcm9ncmFtcy5kZWZhdWx0LnNldFVuaWZvcm0oICd1Y29sb3InLCB0aGlzLl9maWxsQ29sb3IucmdiYSgpICk7XG4gICAgdGhpcy5jb250ZXh0LmRyYXdBcnJheXMoIHRoaXMuY29udGV4dC5UUklBTkdMRV9GQU4sIDAsIGNvdW50ICk7XG4gIH1cbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNfc3Ryb2tlXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5fc3Ryb2tlID0gZnVuY3Rpb24gX3N0cm9rZSAoIGNvdW50IClcbntcbiAgaWYgKCB0aGlzLl9kb1N0cm9rZSAmJiB0aGlzLl9saW5lV2lkdGggPiAwICkge1xuICAgIHRoaXMucHJvZ3JhbXMuZGVmYXVsdC5zZXRVbmlmb3JtKCAndWNvbG9yJywgdGhpcy5fc3Ryb2tlQ29sb3IucmdiYSgpICk7XG4gICAgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCggdGhpcy5fbGluZVdpZHRoICk7XG4gICAgdGhpcy5jb250ZXh0LmRyYXdBcnJheXMoIHRoaXMuY29udGV4dC5MSU5FX0xPT1AsIDAsIGNvdW50ICk7XG4gIH1cbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjYXJjXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmFyYyA9IGZ1bmN0aW9uIGFyYyAoIHgsIHksIHIgKVxue1xuICByZXR1cm4gdGhpcy5kcmF3UG9seWdvbiggeCwgeSwgciwgciwgMjQsIDAgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjbGluZVxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5saW5lID0gZnVuY3Rpb24gbGluZSAoIHgxLCB5MSwgeDIsIHkyIClcbntcbiAgdGhpcy5kcmF3QXJyYXlzKCBjcmVhdGVBcnJheSggW1xuICAgIHgxLCB5MSxcbiAgICB4MiwgeTJcbiAgXSApLCAyICk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI3BvaW50XG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLnBvaW50ID0gZnVuY3Rpb24gcG9pbnQgKCB4LCB5IClcbntcbiAgdmFyIGh3ID0gdGhpcy5fbGluZVdpZHRoICogMC41O1xuICB2YXIgZmMgPSB0aGlzLl9maWxsQ29sb3I7XG4gIHZhciBkZiA9IHRoaXMuX2RvRmlsbDtcbiAgdmFyIGRzID0gdGhpcy5fZG9TdHJva2U7XG5cbiAgdGhpcy5fZmlsbENvbG9yID0gdGhpcy5fc3Ryb2tlQ29sb3I7XG4gIHRoaXMuX2RvRmlsbCAgICA9IHRydWU7XG4gIHRoaXMuX2RvU3Ryb2tlICA9IGZhbHNlO1xuXG4gIHRoaXMuZHJhd0FycmF5cyggY3JlYXRlQXJyYXkoIFtcbiAgICB4IC0gaHcsIHkgLSBodyxcbiAgICB4ICsgaHcsIHkgLSBodyxcbiAgICB4ICsgaHcsIHkgKyBodyxcbiAgICB4IC0gaHcsIHkgKyBod1xuICBdICksIDQgKTtcblxuICB0aGlzLl9maWxsQ29sb3IgPSBmYztcbiAgdGhpcy5fZG9GaWxsICAgID0gZGY7XG4gIHRoaXMuX2RvU3Ryb2tlICA9IGRzO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNyZWN0XG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLnJlY3QgPSBmdW5jdGlvbiByZWN0ICggeCwgeSwgdywgaCApXG57XG4gIHggPSBwcm9jZXNzUmVjdEFsaWduWCggdGhpcywgeCwgdyApO1xuICB5ID0gcHJvY2Vzc1JlY3RBbGlnblkoIHRoaXMsIHksIGggKTtcbiAgdGhpcy5tYXRyaXguc2F2ZSgpO1xuICB0aGlzLm1hdHJpeC50cmFuc2xhdGUoIHgsIHkgKTtcbiAgdGhpcy5tYXRyaXguc2NhbGUoIHcsIGggKTtcbiAgdGhpcy5jb250ZXh0LmJpbmRCdWZmZXIoIHRoaXMuY29udGV4dC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVycy5yZWN0ICk7XG4gIHRoaXMuZHJhd0FycmF5cyggbnVsbCwgNCApO1xuICB0aGlzLm1hdHJpeC5yZXN0b3JlKCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlckdMO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uc3RhbnRzICAgICAgID0gcmVxdWlyZSggJy4uL2NvbnN0YW50cycgKTtcblxudmFyIHJlcG9ydCAgICAgICAgICA9IHJlcXVpcmUoICcuLi9pbnRlcm5hbC9yZXBvcnQnICk7XG5cbnZhciBnZXRSZW5kZXJlclR5cGUgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9nZXRfcmVuZGVyZXJfdHlwZScgKTtcbnZhciBnZXRXZWJHTCAgICAgICAgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9nZXRfd2ViZ2wnICk7XG5cbnZhciBSZW5kZXJlckdMICAgICAgPSByZXF1aXJlKCAnLi9SZW5kZXJlckdMJyApO1xudmFyIFJlbmRlcmVyMkQgICAgICA9IHJlcXVpcmUoICcuL1JlbmRlcmVyMkQnICk7XG52YXIgdHlwZSAgICAgICAgICAgID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICkudHlwZTtcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5INGA0LXQvdC00LXRgNC10YAuINCV0YHQu9C4INGB0L7Qt9C00LDRgtGMIFdlYkdMINC60L7QvdGC0LXQutGB0YIg0L3QtSDQv9C+0LvRg9GH0LjRgtGB0Y8sINGC0L4g0LHRg9C00LXRgiDQuNGB0L/QvtC70YzQt9C+0LLQsNC9IDJELlxuICogQG1ldGhvZCB2Ni5jcmVhdGVSZW5kZXJlclxuICogQHBhcmFtICB7b2JqZWN0fSAgICAgICAgICAgICAgb3B0aW9ucyB7QGxpbmsgdjYuc2V0dGluZ3MucmVuZGVyZXJ9LlxuICogQHJldHVybiB7djYuQWJzdHJhY3RSZW5kZXJlcn0gICAgICAgICDQndC+0LLRi9C5INGA0LXQvdC00LXRgNC10YAgKDJELCBHTCkuXG4gKiBAZXhhbXBsZVxuICogdmFyIGNyZWF0ZVJlbmRlcmVyID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXIvY3JlYXRlX3JlbmRlcmVyJyApO1xuICogdmFyIGNvbnN0YW50cyAgICAgID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29uc3RhbnRzJyApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRpbmcgV2ViR0wgb3IgMkQgcmVuZGVyZXIgYmFzZWQgb24gcGxhdGZvcm0gYW5kIGJyb3dzZXI8L2NhcHRpb24+XG4gKiB2YXIgcmVuZGVyZXIgPSBjcmVhdGVSZW5kZXJlciggeyB0eXBlOiBjb25zdGFudHMuZ2V0KCAnQVVUTycgKSB9ICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyBXZWJHTCByZW5kZXJlcjwvY2FwdGlvbj5cbiAqIHZhciByZW5kZXJlciA9IGNyZWF0ZVJlbmRlcmVyKCB7IHR5cGU6IGNvbnN0YW50cy5nZXQoICdHTCcgKSB9ICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyAyRCByZW5kZXJlcjwvY2FwdGlvbj5cbiAqIHZhciByZW5kZXJlciA9IGNyZWF0ZVJlbmRlcmVyKCB7IHR5cGU6IGNvbnN0YW50cy5nZXQoICcyRCcgKSB9ICk7XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJlbmRlcmVyICggb3B0aW9ucyApXG57XG4gIHZhciB0eXBlXyA9ICggb3B0aW9ucyAmJiBvcHRpb25zLnR5cGUgKSB8fCB0eXBlO1xuXG4gIGlmICggdHlwZV8gPT09IGNvbnN0YW50cy5nZXQoICdBVVRPJyApICkge1xuICAgIHR5cGVfID0gZ2V0UmVuZGVyZXJUeXBlKCk7XG4gIH1cblxuICBpZiAoIHR5cGVfID09PSBjb25zdGFudHMuZ2V0KCAnR0wnICkgKSB7XG4gICAgaWYgKCBnZXRXZWJHTCgpICkge1xuICAgICAgcmV0dXJuIG5ldyBSZW5kZXJlckdMKCBvcHRpb25zICk7XG4gICAgfVxuXG4gICAgcmVwb3J0KCAnQ2Fubm90IGNyZWF0ZSBXZWJHTCBjb250ZXh0LiBGYWxsaW5nIGJhY2sgdG8gMkQuJyApO1xuICB9XG5cbiAgaWYgKCB0eXBlXyA9PT0gY29uc3RhbnRzLmdldCggJzJEJyApIHx8IHR5cGVfID09PSBjb25zdGFudHMuZ2V0KCAnR0wnICkgKSB7XG4gICAgcmV0dXJuIG5ldyBSZW5kZXJlcjJEKCBvcHRpb25zICk7XG4gIH1cblxuICB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHJlbmRlcmVyIHR5cGUuIFRoZSBrbm93biBhcmU6IDJEIGFuZCBHTCcgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVSZW5kZXJlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQl9Cw0LrRgNGL0LLQsNC10YIg0YTQuNCz0YPRgNGDLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY2xvc2VTaGFwZVxuICogQHBhcmFtICB7djYuQWJzdHJhY3RSZW5kZXJlcn0gcmVuZGVyZXIg0KDQtdC90LTQtdGA0LXRgC5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICovXG5mdW5jdGlvbiBjbG9zZVNoYXBlICggcmVuZGVyZXIgKVxue1xuICBpZiAoICEgcmVuZGVyZXIuX2Nsb3NlZFNoYXBlICkge1xuICAgIHJlbmRlcmVyLl9jbG9zZWRTaGFwZSA9IHJlbmRlcmVyLl92ZXJ0aWNlcy5zbGljZSgpO1xuICAgIHJlbmRlcmVyLl9jbG9zZWRTaGFwZS5wdXNoKCByZW5kZXJlci5fY2xvc2VkU2hhcGVbIDAgXSApO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xvc2VTaGFwZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQmtC+0L/QuNGA0YPQtdGCIGRyYXdpbmcgc2V0dGluZ3MgKF9saW5lV2lkdGgsIF9yZWN0QWxpZ25YLCDQuCDRgi7QtC4pINC40LcgYHNvdXJjZWAg0LIgYHRhcmdldGAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjb3B5RHJhd2luZ1NldHRpbmdzXG4gKiBAcGFyYW0gIHtvYmplY3R9ICB0YXJnZXQg0JzQvtC20LXRgiDQsdGL0YLRjCBgQWJzdHJhY3RSZW5kZXJlcmAg0LjQu9C4INC/0YDQvtGB0YLRi9C8INC+0LHRitC10LrRgtC+0Lwg0YEg0YHQvtGF0YDQsNC90LXQvdC90YvQvNC4INGH0LXRgNC10LdcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICDRjdGC0YMg0YTRg9C90LrRhtC40Y4g0L3QsNGB0YLRgNC+0LnQutCw0LzQuC5cbiAqIEBwYXJhbSAge29iamVjdH0gIHNvdXJjZSDQntC/0LjRgdCw0L3QuNC1INGC0L4g0LbQtSwg0YfRgtC+INC4INC00LvRjyBgdGFyZ2V0YC5cbiAqIEBwYXJhbSAge2Jvb2xlYW59IFtkZWVwXSDQldGB0LvQuCBgdHJ1ZWAsINGC0L4g0LHRg9C00LXRgiDRgtCw0LrQttC1INC60L7Qv9C40YDQvtCy0LDRgtGMIF9maWxsQ29sb3IsIF9zdHJva2VDb2xvciDQuCDRgi7QtC5cbiAqIEByZXR1cm4ge29iamVjdH0gICAgICAgICDQktC+0LfQstGA0LDRidCw0LXRgiBgdGFyZ2V0YC5cbiAqL1xuZnVuY3Rpb24gY29weURyYXdpbmdTZXR0aW5ncyAoIHRhcmdldCwgc291cmNlLCBkZWVwIClcbntcbiAgaWYgKCBkZWVwICkge1xuICAgIHRhcmdldC5fZmlsbENvbG9yWyAwIF0gICA9IHNvdXJjZS5fZmlsbENvbG9yWyAwIF07XG4gICAgdGFyZ2V0Ll9maWxsQ29sb3JbIDEgXSAgID0gc291cmNlLl9maWxsQ29sb3JbIDEgXTtcbiAgICB0YXJnZXQuX2ZpbGxDb2xvclsgMiBdICAgPSBzb3VyY2UuX2ZpbGxDb2xvclsgMiBdO1xuICAgIHRhcmdldC5fZmlsbENvbG9yWyAzIF0gICA9IHNvdXJjZS5fZmlsbENvbG9yWyAzIF07XG4gICAgdGFyZ2V0Ll9zdHJva2VDb2xvclsgMCBdID0gc291cmNlLl9zdHJva2VDb2xvclsgMCBdO1xuICAgIHRhcmdldC5fc3Ryb2tlQ29sb3JbIDEgXSA9IHNvdXJjZS5fc3Ryb2tlQ29sb3JbIDEgXTtcbiAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWyAyIF0gPSBzb3VyY2UuX3N0cm9rZUNvbG9yWyAyIF07XG4gICAgdGFyZ2V0Ll9zdHJva2VDb2xvclsgMyBdID0gc291cmNlLl9zdHJva2VDb2xvclsgMyBdO1xuICB9XG5cbiAgdGFyZ2V0Ll9iYWNrZ3JvdW5kUG9zaXRpb25YID0gc291cmNlLl9iYWNrZ3JvdW5kUG9zaXRpb25YO1xuICB0YXJnZXQuX2JhY2tncm91bmRQb3NpdGlvblkgPSBzb3VyY2UuX2JhY2tncm91bmRQb3NpdGlvblk7XG4gIHRhcmdldC5fcmVjdEFsaWduWCAgICAgICAgICA9IHNvdXJjZS5fcmVjdEFsaWduWDtcbiAgdGFyZ2V0Ll9yZWN0QWxpZ25ZICAgICAgICAgID0gc291cmNlLl9yZWN0QWxpZ25ZO1xuICB0YXJnZXQuX2xpbmVXaWR0aCAgICAgICAgICAgPSBzb3VyY2UuX2xpbmVXaWR0aDtcbiAgdGFyZ2V0Ll9kb1N0cm9rZSAgICAgICAgICAgID0gc291cmNlLl9kb1N0cm9rZTtcbiAgdGFyZ2V0Ll9kb0ZpbGwgICAgICAgICAgICAgID0gc291cmNlLl9kb0ZpbGw7XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb3B5RHJhd2luZ1NldHRpbmdzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJy4uLy4uL2NvbnN0YW50cycgKTtcblxudmFyIGRlZmF1bHREcmF3aW5nU2V0dGluZ3MgPSB7XG4gIF9iYWNrZ3JvdW5kUG9zaXRpb25YOiBjb25zdGFudHMuZ2V0KCAnTEVGVCcgKSxcbiAgX2JhY2tncm91bmRQb3NpdGlvblk6IGNvbnN0YW50cy5nZXQoICdUT1AnICksXG4gIF9yZWN0QWxpZ25YOiAgICAgICAgICBjb25zdGFudHMuZ2V0KCAnTEVGVCcgKSxcbiAgX3JlY3RBbGlnblk6ICAgICAgICAgIGNvbnN0YW50cy5nZXQoICdUT1AnICksXG4gIF9saW5lV2lkdGg6ICAgICAgICAgICAyLFxuICBfZG9TdHJva2U6ICAgICAgICAgICAgdHJ1ZSxcbiAgX2RvRmlsbDogICAgICAgICAgICAgIHRydWVcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZGVmYXVsdERyYXdpbmdTZXR0aW5ncztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9uY2UgICAgICA9IHJlcXVpcmUoICdwZWFrby9vbmNlJyApO1xuXG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJy4uLy4uL2NvbnN0YW50cycgKTtcblxuLy8gXCJwbGF0Zm9ybVwiIG5vdCBpbmNsdWRlZCB1c2luZyA8c2NyaXB0IC8+IHRhZy5cbmlmICggdHlwZW9mIHBsYXRmb3JtID09PSAndW5kZWZpbmVkJyApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2UtYmVmb3JlLWRlZmluZVxuICB2YXIgcGxhdGZvcm07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuICB0cnkge1xuICAgIHBsYXRmb3JtID0gcmVxdWlyZSggJ3BsYXRmb3JtJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGdsb2JhbC1yZXF1aXJlXG4gIH0gY2F0Y2ggKCBlcnJvciApIHtcbiAgICAvLyBcInBsYXRmb3JtXCIgbm90IGluc3RhbGxlZCB1c2luZyBOUE0uXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVuZGVyZXJUeXBlICgpXG57XG4gIHZhciB0b3VjaGFibGU7XG4gIHZhciBzYWZhcmk7XG5cbiAgaWYgKCBwbGF0Zm9ybSApIHtcbiAgICBzYWZhcmkgPSBwbGF0Zm9ybS5vcyAmJlxuICAgICAgcGxhdGZvcm0ub3MuZmFtaWx5ID09PSAnaU9TJyAmJlxuICAgICAgcGxhdGZvcm0ubmFtZSA9PT0gJ1NhZmFyaSc7XG4gIH1cblxuICBpZiAoIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICkge1xuICAgIHRvdWNoYWJsZSA9ICdvbnRvdWNoZW5kJyBpbiB3aW5kb3c7XG4gIH1cblxuICBpZiAoIHRvdWNoYWJsZSAmJiAhIHNhZmFyaSApIHtcbiAgICByZXR1cm4gY29uc3RhbnRzLmdldCggJ0dMJyApO1xuICB9XG5cbiAgcmV0dXJuIGNvbnN0YW50cy5nZXQoICcyRCcgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvbmNlKCBnZXRSZW5kZXJlclR5cGUgKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9uY2UgPSByZXF1aXJlKCAncGVha28vb25jZScgKTtcblxuLyoqXG4gKiDQktC+0LfQstGA0LDRidCw0LXRgiDQuNC80Y8g0L/QvtC00LTQtdGA0LbQuNCy0LDQtdC80L7Qs9C+IFdlYkdMINC60L7QvdGC0LXQutGB0YLQsCwg0L3QsNC/0YDQuNC80LXRgDogJ2V4cGVyaW1lbnRhbC13ZWJnbCcuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBnZXRXZWJHTFxuICogQHJldHVybiB7c3RyaW5nP30g0JIg0YHQu9GD0YfQsNC1INC90LXRg9C00LDRh9C4IChXZWJHTCDQvdC1INC/0L7QtNC00LXRgNC20LjQstCw0LXRgtGB0Y8pIC0g0LLQtdGA0L3QtdGCIGBudWxsYC5cbiAqL1xuZnVuY3Rpb24gZ2V0V2ViR0wgKClcbntcbiAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XG4gIHZhciBuYW1lICAgPSBudWxsO1xuXG4gIGlmICggY2FudmFzLmdldENvbnRleHQoICd3ZWJnbCcgKSApIHtcbiAgICBuYW1lID0gJ3dlYmdsJztcbiAgfSBlbHNlIGlmICggY2FudmFzLmdldENvbnRleHQoICdleHBlcmltZW50YWwtd2ViZ2wnICkgKSB7XG4gICAgbmFtZSA9ICdleHBlcmltZW50YWwtd2ViZ2wnO1xuICB9XG5cbiAgLy8gRml4aW5nIHBvc3NpYmxlIG1lbW9yeSBsZWFrLlxuICBjYW52YXMgPSBudWxsO1xuICByZXR1cm4gbmFtZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvbmNlKCBnZXRXZWJHTCApO1xuIiwiLyogZXNsaW50IGxpbmVzLWFyb3VuZC1kaXJlY3RpdmU6IG9mZiAqL1xuLyogZXNsaW50IGxpbmVzLWFyb3VuZC1jb21tZW50OiBvZmYgKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCAnLi4vLi4vY29uc3RhbnRzJyApO1xuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBwcm9jZXNzUmVjdEFsaWduWFxuICogQHBhcmFtICB7djYuQWJzdHJhY3RSZW5kZXJlcn0gcmVuZGVyZXJcbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIHhcbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIHdcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0cy5wcm9jZXNzUmVjdEFsaWduWCA9IGZ1bmN0aW9uIHByb2Nlc3NSZWN0QWxpZ25YICggcmVuZGVyZXIsIHgsIHcgKSB7IGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblggPT09IGNvbnN0YW50cy5nZXQoIFwiQ0VOVEVSXCIgKSApIHsgeCAtPSB3ICogMC41OyB9IGVsc2UgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWCA9PT0gY29uc3RhbnRzLmdldCggXCJSSUdIVFwiICkgKSB7IHggLT0gdzsgfSBlbHNlIGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblggIT09IGNvbnN0YW50cy5nZXQoIFwiTEVGVFwiICkgKSB7IHRocm93IEVycm9yKCAnVW5rbm93biBcIiArJyArIFwicmVjdEFsaWduWFwiICsgJ1wiOiAnICsgcmVuZGVyZXIuX3JlY3RBbGlnblggKTsgfSByZXR1cm4gTWF0aC5mbG9vciggeCApOyB9OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgcHJvY2Vzc1JlY3RBbGlnbllcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHJlbmRlcmVyXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB5XG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICBoXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydHMucHJvY2Vzc1JlY3RBbGlnblkgPSBmdW5jdGlvbiBwcm9jZXNzUmVjdEFsaWduWSAoIHJlbmRlcmVyLCB4LCB3ICkgeyBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25ZID09PSBjb25zdGFudHMuZ2V0KCBcIk1JRERMRVwiICkgKSB7IHggLT0gdyAqIDAuNTsgfSBlbHNlIGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblkgPT09IGNvbnN0YW50cy5nZXQoIFwiQk9UVE9NXCIgKSApIHsgeCAtPSB3OyB9IGVsc2UgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWSAhPT0gY29uc3RhbnRzLmdldCggXCJUT1BcIiApICkgeyB0aHJvdyBFcnJvciggJ1Vua25vd24gXCIgKycgKyBcInJlY3RBbGlnbllcIiArICdcIjogJyArIHJlbmRlcmVyLl9yZWN0QWxpZ25ZICk7IH0gcmV0dXJuIE1hdGguZmxvb3IoIHggKTsgfTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBHTCA9IHJlcXVpcmUoICcuLi8uLi9jb25zdGFudHMnICkuZ2V0KCAnR0wnICk7XG5cbi8qKlxuICog0J7QsdGA0LDQsdCw0YLRi9Cy0LDQtdGCINGE0LjQs9GD0YDRgy5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHByb2Nlc3NTaGFwZVxuICogQHBhcmFtICB7djYuQWJzdHJhY3RSZW5kZXJlcn0gcmVuZGVyZXIg0KDQtdC90LTQtdGA0LXRgC5cbiAqIEBwYXJhbSAge0FycmF5fEZsb2F0MzJBcnJheX0gIHZlcnRpY2VzINCS0LXRgNGI0LjQvdGLLlxuICogQHJldHVybiB7QXJyYXl8RmxvYXQzMkFycmF5fSAgICAgICAgICAg0J7QsdGA0LDQsdC+0YLQsNC90L3Ri9C1INCy0LXRgNGI0LjQvdGLLlxuICovXG5mdW5jdGlvbiBwcm9jZXNzU2hhcGUgKCByZW5kZXJlciwgdmVydGljZXMgKVxue1xuICBpZiAoIHJlbmRlcmVyLnR5cGUgPT09IEdMICYmIHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICdmdW5jdGlvbicgJiYgISAoIHZlcnRpY2VzIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkgKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgICB2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoIHZlcnRpY2VzICk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gIH1cblxuICByZXR1cm4gdmVydGljZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcHJvY2Vzc1NoYXBlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVmYXVsdERyYXdpbmdTZXR0aW5ncyA9IHJlcXVpcmUoICcuL2RlZmF1bHRfZHJhd2luZ19zZXR0aW5ncycgKTtcbnZhciBjb3B5RHJhd2luZ1NldHRpbmdzICAgID0gcmVxdWlyZSggJy4vY29weV9kcmF3aW5nX3NldHRpbmdzJyApO1xuXG4vKipcbiAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGRyYXdpbmcgc2V0dGluZ3Mg0L/QviDRg9C80L7Qu9GH0LDQvdC40Y4g0LIgYHRhcmdldGAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQgICDQnNC+0LbQtdGCINCx0YvRgtGMIGBBYnN0cmFjdFJlbmRlcmVyYCDQuNC70Lgg0L/RgNC+0YHRgtGL0LxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINC+0LHRitC10LrRgtC+0LwuXG4gKiBAcGFyYW0gIHttb2R1bGU6XCJ2Ni5qc1wiLkFic3RyYWN0UmVuZGVyZXJ9IHJlbmRlcmVyIGBSZW5kZXJlckdMYCDQuNC70LggYFJlbmRlcmVyMkRgINC90YPQttC90Ysg0LTQu9GPXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDRg9GB0YLQsNC90L7QstC60LggX3N0cm9rZUNvbG9yLCBfZmlsbENvbG9yLlxuICogQHJldHVybiB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIgYHRhcmdldGAuXG4gKi9cbmZ1bmN0aW9uIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3MgKCB0YXJnZXQsIHJlbmRlcmVyIClcbntcblxuICBjb3B5RHJhd2luZ1NldHRpbmdzKCB0YXJnZXQsIGRlZmF1bHREcmF3aW5nU2V0dGluZ3MgKTtcblxuICB0YXJnZXQuX3N0cm9rZUNvbG9yID0gbmV3IHJlbmRlcmVyLnNldHRpbmdzLmNvbG9yKCk7XG4gIHRhcmdldC5fZmlsbENvbG9yICAgPSBuZXcgcmVuZGVyZXIuc2V0dGluZ3MuY29sb3IoKTtcblxuICByZXR1cm4gdGFyZ2V0O1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbG9yID0gcmVxdWlyZSggJy4uL2NvbG9yL1JHQkEnICk7XG52YXIgdHlwZSAgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApLmdldCggJzJEJyApO1xuXG4vKipcbiAqINCd0LDRgdGC0YDQvtC50LrQuCDQtNC70Y8g0YDQtdC90LTQtdGA0LXRgNC+0LI6IHtAbGluayB2Ni5SZW5kZXJlcjJEfSwge0BsaW5rIHY2LlJlbmRlcmVyR0x9LCB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlcn0sIHtAbGluayB2Ni5jcmVhdGVSZW5kZXJlcn0uXG4gKiBAbmFtZXNwYWNlIHY2LnNldHRpbmdzLnJlbmRlcmVyXG4gKi9cblxuLyoqXG4gKiBAbWVtYmVyICAge29iamVjdH0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLnNldHRpbmdzXSDQndCw0YHRgtGA0L7QudC60Lgg0YDQtdC90LTQtdGA0LXRgNCwINC/0L4g0YPQvNC+0LvRh9Cw0L3QuNGOLlxuICogQHByb3BlcnR5IHtvYmplY3R9IFtjb2xvcj17QGxpbmsgdjYuUkdCQX1dICAgICAgICAg0JrQvtC90YHRgtGA0YPQutGC0L7RgNGLIHtAbGluayB2Ni5SR0JBfSDQuNC70Lgge0BsaW5rIHY2LkhTTEF9LlxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzY2FsZT0xXSAgICAgICAgICAgICAgICAgICAgICAg0J/Qu9C+0YLQvdC+0YHRgtGMINC/0LjQutGB0LXQu9C10Lkg0YDQtdC90LTQtdGA0LXRgNCwLCDQvdCw0L/RgNC40LzQtdGAOiBgZGV2aWNlUGl4ZWxSYXRpb2AuXG4gKi9cbmV4cG9ydHMuc2V0dGluZ3MgPSB7XG4gIGNvbG9yOiBjb2xvcixcbiAgc2NhbGU6IDFcbn07XG5cbi8qKlxuICog0J/QvtC60LAg0L3QtSDRgdC00LXQu9Cw0L3Qvi5cbiAqIEBtZW1iZXIge2Jvb2xlYW59IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5hbnRpYWxpYXM9dHJ1ZV1cbiAqL1xuZXhwb3J0cy5hbnRpYWxpYXMgPSB0cnVlO1xuXG4vKipcbiAqINCf0L7QutCwINC90LUg0YHQtNC10LvQsNC90L4uXG4gKiBAbWVtYmVyIHtib29sZWFufSBbdjYuc2V0dGluZ3MucmVuZGVyZXIuYmxlbmRpbmc9dHJ1ZV1cbiAqL1xuZXhwb3J0cy5ibGVuZGluZyA9IHRydWU7XG5cbi8qKlxuICog0JjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMINCz0YDQsNC00YPRgdGLINCy0LzQtdGB0YLQviDRgNCw0LTQuNCw0L3QvtCyLlxuICogQG1lbWJlciB7Ym9vbGVhbn0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLmRlZ3JlZXM9ZmFsc2VdXG4gKi9cbmV4cG9ydHMuZGVncmVlcyA9IGZhbHNlO1xuXG4vKipcbiAqINCY0YHQv9C+0LvRjNC30L7QstCw0YLRjCDQv9GA0L7Qt9GA0LDRh9C90YvQuSAo0LLQvNC10YHRgtC+INGH0LXRgNC90L7Qs9C+KSDQutC+0L3RgtC10LrRgdGCLlxuICogQG1lbWJlciB7Ym9vbGVhbn0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLmFscGhhPXRydWVdXG4gKi9cbmV4cG9ydHMuYWxwaGEgPSB0cnVlO1xuXG4vKipcbiAqINCi0LjQvyDQutC+0L3RgtC10LrRgdGC0LAgKDJELCBHTCwgQVVUTykuXG4gKiBAbWVtYmVyIHtjb25zdGFudH0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLnR5cGU9MkRdXG4gKi9cbmV4cG9ydHMudHlwZSA9IHR5cGU7XG5cbi8qKlxuICog0JIg0Y3RgtC+0YIg0Y3Qu9C10LzQtdC90YIg0LHRg9C00LXRgiDQtNC+0LHQsNCy0LvQtdC9IGBjYW52YXNgLlxuICogQG1lbWJlciB7RWxlbWVudD99IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5hcHBlbmRUb11cbiAqL1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBtZW1iZXIgdjYuc2hhcGVzLmRyYXdMaW5lc1xuICogQGV4YW1wbGVcbiAqIHNoYXBlcy5kcmF3TGluZXMoIHJlbmRlcmVyLCB2ZXJ0aWNlcyApO1xuICovXG5mdW5jdGlvbiBkcmF3TGluZXMgKClcbntcbiAgdGhyb3cgRXJyb3IoICdOb3QgaW1wbGVtZW50ZWQnICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZHJhd0xpbmVzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBtZW1iZXIgdjYuc2hhcGVzLmRyYXdQb2ludHNcbiAqIEBleGFtcGxlXG4gKiBzaGFwZXMuZHJhd1BvaW50cyggcmVuZGVyZXIsIHZlcnRpY2VzICk7XG4gKi9cbmZ1bmN0aW9uIGRyYXdQb2ludHMgKClcbntcbiAgdGhyb3cgRXJyb3IoICdOb3QgaW1wbGVtZW50ZWQnICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZHJhd1BvaW50cztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQk9C70LDQstC90YvQtSDQvdCw0YHRgtGA0L7QudC60LggXCJ2Ni5qc1wiLlxuICogQG5hbWVzcGFjZSB2Ni5zZXR0aW5ncy5jb3JlXG4gKi9cblxuLyoqXG4gKiDQmNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNCw0LTRg9GB0Ysg0LLQvNC10YHRgtC+INGA0LDQtNC40LDQvdC+0LIuXG4gKiBAbWVtYmVyIHtib29sZWFufSB2Ni5zZXR0aW5ncy5jb3JlLmRlZ3JlZXNcbiAqL1xuZXhwb3J0cy5kZWdyZXNzID0gZmFsc2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQGludGVyZmFjZSBJU2hhZGVyU291cmNlc1xuICogQHByb3BlcnR5IHtzdHJpbmd9IHZlcnQg0JjRgdGF0L7QtNC90LjQuiDQstC10YDRiNC40L3QvdC+0LPQviAodmVydGV4KSDRiNC10LnQtNC10YDQsC5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBmcmFnINCY0YHRhdC+0LTQvdC40Log0YTRgNCw0LPQvNC10L3RgtC90L7Qs9C+IChmcmFnbWVudCkg0YjQtdC50LTQtdGA0LAuXG4gKi9cblxuLyoqXG4gKiBXZWJHTCDRiNC10LnQtNC10YDRiy5cbiAqIEBtZW1iZXIge29iamVjdH0gdjYuc2hhZGVyc1xuICogQHByb3BlcnR5IHtJU2hhZGVyU291cmNlc30gYmFzaWMgICAgICDQodGC0LDQvdC00LDRgNGC0L3Ri9C1INGI0LXQudC00LXRgNGLLlxuICogQHByb3BlcnR5IHtJU2hhZGVyU291cmNlc30gYmFja2dyb3VuZCDQqNC10LnQtNC10YDRiyDQtNC70Y8g0L7RgtGA0LjRgdC+0LLQutC4INGE0L7QvdCwLlxuICovXG52YXIgc2hhZGVycyA9IHtcbiAgYmFzaWM6IHtcbiAgICB2ZXJ0OiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7YXR0cmlidXRlIHZlYzIgYXBvczt1bmlmb3JtIHZlYzIgdXJlczt1bmlmb3JtIG1hdDMgdXRyYW5zZm9ybTt2b2lkIG1haW4oKXtnbF9Qb3NpdGlvbj12ZWM0KCgodXRyYW5zZm9ybSp2ZWMzKGFwb3MsMS4wKSkueHkvdXJlcyoyLjAtMS4wKSp2ZWMyKDEsLTEpLDAsMSk7fScsXG4gICAgZnJhZzogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O3VuaWZvcm0gdmVjNCB1Y29sb3I7dm9pZCBtYWluKCl7Z2xfRnJhZ0NvbG9yPXZlYzQodWNvbG9yLnJnYi8yNTUuMCx1Y29sb3IuYSk7fSdcbiAgfSxcblxuICBiYWNrZ3JvdW5kOiB7XG4gICAgdmVydDogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O2F0dHJpYnV0ZSB2ZWMyIGFwb3M7dm9pZCBtYWluKCl7Z2xfUG9zaXRpb24gPSB2ZWM0KGFwb3MsMCwxKTt9JyxcbiAgICBmcmFnOiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7dW5pZm9ybSB2ZWM0IHVjb2xvcjt2b2lkIG1haW4oKXtnbF9GcmFnQ29sb3I9dWNvbG9yO30nXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2hhZGVycztcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3LTIwMTggVmxhZGlzbGF2IFRpa2hpeSAoU0lMRU5UKVxuICogUmVsZWFzZWQgdW5kZXIgdGhlIEdQTC0zLjAgbGljZW5zZS5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS90aWtoaXkvdjYuanMvdHJlZS9kZXYvXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgdjZcbiAqL1xuXG5leHBvcnRzLkFic3RyYWN0SW1hZ2UgICAgPSByZXF1aXJlKCAnLi9jb3JlL2ltYWdlL0Fic3RyYWN0SW1hZ2UnICk7XG5leHBvcnRzLkFic3RyYWN0UmVuZGVyZXIgPSByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL0Fic3RyYWN0UmVuZGVyZXInICk7XG5leHBvcnRzLkFic3RyYWN0VmVjdG9yICAgPSByZXF1aXJlKCAnLi9jb3JlL21hdGgvQWJzdHJhY3RWZWN0b3InICk7XG5leHBvcnRzLkNhbWVyYSAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2NhbWVyYS9DYW1lcmEnICk7XG5leHBvcnRzLkNvbXBvdW5kZWRJbWFnZSAgPSByZXF1aXJlKCAnLi9jb3JlL2ltYWdlL0NvbXBvdW5kZWRJbWFnZScgKTtcbmV4cG9ydHMuSFNMQSAgICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvY29sb3IvSFNMQScgKTtcbmV4cG9ydHMuSW1hZ2UgICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvaW1hZ2UvSW1hZ2UnICk7XG5leHBvcnRzLlJHQkEgICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2NvbG9yL1JHQkEnICk7XG5leHBvcnRzLlJlbmRlcmVyMkQgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyMkQnICk7XG5leHBvcnRzLlJlbmRlcmVyR0wgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyR0wnICk7XG5leHBvcnRzLlNoYWRlclByb2dyYW0gICAgPSByZXF1aXJlKCAnLi9jb3JlL1NoYWRlclByb2dyYW0nICk7XG5leHBvcnRzLlRpY2tlciAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL1RpY2tlcicgKTtcbmV4cG9ydHMuVHJhbnNmb3JtICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvVHJhbnNmb3JtJyApO1xuZXhwb3J0cy5WZWN0b3IyRCAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9tYXRoL1ZlY3RvcjJEJyApO1xuZXhwb3J0cy5WZWN0b3IzRCAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9tYXRoL1ZlY3RvcjNEJyApO1xuZXhwb3J0cy5jb25zdGFudHMgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9jb25zdGFudHMnICk7XG5leHBvcnRzLmNyZWF0ZVJlbmRlcmVyICAgPSByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL2NyZWF0ZV9yZW5kZXJlcicgKTtcbmV4cG9ydHMuc2hhZGVycyAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvc2hhZGVycycgKTtcbmV4cG9ydHMubWF0MyAgICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvbWF0aC9tYXQzJyApO1xuXG4vKipcbiAqIFwidjYuanNcIiBidWlsdC1pbiBkcmF3aW5nIGZ1bmN0aW9ucy5cbiAqIEBuYW1lc3BhY2UgdjYuc2hhcGVzXG4gKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gKiBAZXhhbXBsZVxuICogdmFyIHNoYXBlcyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL3NoYXBlcycgKTtcbiAqIEBleGFtcGxlXG4gKiByZW5kZXJlci5iZWdpblNoYXBlKCB7XG4gKiAgIGRyYXdGdW5jdGlvbjogc2hhcGVzLmRyYXdQb2ludHNcbiAqIH0gKTtcbiAqL1xuZXhwb3J0cy5zaGFwZXMgPSB7XG4gIGRyYXdQb2ludHM6IHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXIvc2hhcGVzL2RyYXdfcG9pbnRzJyApLFxuICBkcmF3TGluZXM6ICByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL3NoYXBlcy9kcmF3X2xpbmVzJyApXG59O1xuXG4vKipcbiAqINCd0LDRgdGC0YDQvtC50LrQuCBcInY2LmpzXCIuXG4gKiBAbmFtZXNwYWNlIHY2LnNldHRpbmdzXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5Db3JlIFNldHRpbmdzPC9jYXB0aW9uPlxuICogdmFyIHNldHRpbmdzID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvc2V0dGluZ3MnICk7XG4gKiBzZXR0aW5ncy5kZWdyZWVzID0gdHJ1ZTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlJlbmRlcmVyIFNldHRpbmdzPC9jYXB0aW9uPlxuICogLy8gRGVmYXVsdCByZW5kZXJlciBzZXR0aW5ncy5cbiAqIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL3NldHRpbmdzJyApO1xuICogc2V0dGluZ3MuZGVncmVlcyA9IHRydWU7XG4gKi9cbmV4cG9ydHMuc2V0dGluZ3MgPSB7XG4gIHJlbmRlcmVyOiByZXF1aXJlKCAnLi9jb3JlL3JlbmRlcmVyL3NldHRpbmdzJyApLFxuICBjYW1lcmE6ICAgcmVxdWlyZSggJy4vY29yZS9jYW1lcmEvc2V0dGluZ3MnICksXG4gIGNvcmU6ICAgICByZXF1aXJlKCAnLi9jb3JlL3NldHRpbmdzJyApXG59O1xuXG5pZiAoIHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyApIHtcbiAgc2VsZi52NiA9IGV4cG9ydHM7XG59XG5cbi8qKlxuICogQHR5cGVkZWYge3N0cmluZ3x2Ni5IU0xBfHY2LlJHQkF9IFRDb2xvclxuICogQGV4YW1wbGUgPGNhcHRpb24+QSBzdHJpbmcgKENTUyBjb2xvcikuPC9jYXB0aW9uPlxuICogdmFyIGNvbG9yID0gJ3JnYmEoIDI1NSwgMCwgMjU1LCAxICknO1xuICogdmFyIGNvbG9yID0gJ2hzbCggMzYwLCAxMDAlLCA1MCUgKSc7XG4gKiB2YXIgY29sb3IgPSAnI2ZmMDBmZic7XG4gKiB2YXIgY29sb3IgPSAnbGlnaHRwaW5rJztcbiAqIC8vIFwicmdiYSgwLCAwLCAwLCAwKVwiXG4gKiB2YXIgY29sb3IgPSBnZXRDb21wdXRlZFN0eWxlKCBkb2N1bWVudC5ib2R5ICkuZ2V0UHJvcGVydHlWYWx1ZSggJ2JhY2tncm91bmQtY29sb3InICk7XG4gKiAvLyBUaGUgc2FtZSBhcyBcInRyYW5zcGFyZW50XCIuXG4gKiAvLyBOT1RFOiBDU1MgZG9lcyBub3Qgc3VwcG9ydCB0aGlzIHN5bnRheCBidXQgXCJ2Ni5qc1wiIGRvZXMuXG4gKiB2YXIgY29sb3IgPSAnIzAwMDAwMDAwJztcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkFuIG9iamVjdCAodjYuUkdCQSwgdjYuSFNMQSk8L2NhcHRpb24+XG4gKiB2YXIgY29sb3IgPSBuZXcgUkdCQSggMjU1LCAwLCAyNTUsIDEgKTtcbiAqIHZhciBjb2xvciA9IG5ldyBIU0xBKCAzNjAsIDEwMCwgNTAgKTtcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtudW1iZXJ9IGNvbnN0YW50XG4gKiBAc2VlIHY2LmNvbnN0YW50c1xuICogQGV4YW1wbGVcbiAqIC8vIFRoaXMgaXMgYSBjb25zdGFudC5cbiAqIHZhciBSRU5ERVJFUl9UWVBFID0gY29uc3RhbnRzLmdldCggJ0dMJyApO1xuICovXG5cbi8qKlxuICogQGludGVyZmFjZSBJVmVjdG9yMkRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4XG4gKiBAcHJvcGVydHkge251bWJlcn0geVxuICovXG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQSBsaWdodHdlaWdodCBpbXBsZW1lbnRhdGlvbiBvZiBOb2RlLmpzIEV2ZW50RW1pdHRlci5cbiAqIEBjb25zdHJ1Y3RvciBMaWdodEVtaXR0ZXJcbiAqIEBleGFtcGxlXG4gKiB2YXIgTGlnaHRFbWl0dGVyID0gcmVxdWlyZSggJ2xpZ2h0X2VtaXR0ZXInICk7XG4gKiBAZXhhbXBsZVxuICogdmFyIGVtaXR0ZXIgPSBuZXcgTGlnaHRFbWl0dGVyKCk7XG4gKiBAZXhhbXBsZVxuICogZnVuY3Rpb24gQ2hhdCAoKSB7XG4gKiAgIExpZ2h0RW1pdHRlci5jYWxsKCB0aGlzICk7XG4gKiB9XG4gKiBcbiAqIENoYXQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggTGlnaHRFbWl0dGVyLnByb3RvdHlwZSApO1xuICogQ2hhdC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDaGF0O1xuICovXG5mdW5jdGlvbiBMaWdodEVtaXR0ZXIgKCkge31cblxuTGlnaHRFbWl0dGVyLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI2VtaXRcbiAgICogQHBhcmFtICB7c3RyaW5nfSB0eXBlICAgQSBldmVudCBuYW1lLlxuICAgKiBAcGFyYW0gIHsuLi5hbnl9IFtkYXRhXSBBcmd1bWVudHMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIHRvIGFsbCBoYW5kbGVycy5cbiAgICogQHJldHVybiB7Ym9vbGVhbj99IFJldHVybnMgYGZhbHNlYCBpZiBhbnkgaGFuZGxlciByZXR1cm5lZCBgZmFsc2VgIHRvbyAoc3RvcHBlZCBwcm9wYWdhdGlvbikuXG4gICAqIEBleGFtcGxlXG4gICAqIGlmICggY2hhdC5lbWl0KCAnbWVzc2FnZScsICdIZWxsbyBMaWdodEVtaXR0ZXIhJyApICE9PSBmYWxzZSApIHtcbiAgICogICBjb25zb2xlLmxvZyggJ1RoZSBtZXNzYWdlIGRlbGl2ZXJlZCBzdWNjZXNzZnVsbHkhJyApO1xuICAgKiB9XG4gICAqL1xuICBlbWl0OiBmdW5jdGlvbiBlbWl0ICggdHlwZSApIHtcbiAgICB2YXIgbGlzdCA9IF9nZXRMaXN0KCB0aGlzLCB0eXBlICk7XG4gICAgdmFyIGRhdGEsIGksIGwsIHJlc3VsdDtcblxuICAgIGlmICggISBsaXN0ICkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID4gMSApIHtcbiAgICAgIGRhdGEgPSBbXS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDEgKTtcbiAgICB9XG5cbiAgICBmb3IgKCBpID0gMCwgbCA9IGxpc3QubGVuZ3RoOyBpIDwgbDsgKytpICkge1xuICAgICAgaWYgKCAhIGxpc3RbIGkgXS5hY3RpdmUgKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIGxpc3RbIGkgXS5vbmNlICkge1xuICAgICAgICBsaXN0WyBpIF0uYWN0aXZlID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICggZGF0YSApIHtcbiAgICAgICAgcmVzdWx0ID0gbGlzdFsgaSBdLmxpc3RlbmVyLmFwcGx5KCB0aGlzLCBkYXRhICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBsaXN0WyBpIF0ubGlzdGVuZXIuY2FsbCggdGhpcyApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIHJlc3VsdCA9PT0gZmFsc2UgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI29mZlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbdHlwZV0gICAgIEEgZXZlbnQgbmFtZS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2xpc3RlbmVyXSBBIGV2ZW50IGhhbmRsZXIuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVtb3ZlIG1lc3NhZ2VIYW5kbGVyLlxuICAgKiBlbWl0dGVyLm9mZiggJ21lc3NhZ2UnLCBtZXNzYWdlSGFuZGxlciApO1xuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZW1vdmUgYWxsICdtZXNzYWdlJyBoYW5kbGVycy5cbiAgICogZW1pdHRlci5vZmYoICdtZXNzYWdlJyApO1xuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZW1vdmUgYWxsIGhhbmRsZXJzLlxuICAgKiBlbWl0dGVyLm9mZigpO1xuICAgKi9cbiAgb2ZmOiBmdW5jdGlvbiBvZmYgKCB0eXBlLCBsaXN0ZW5lciApIHtcbiAgICB2YXIgbGlzdCwgaTtcblxuICAgIGlmICggISB0eXBlICkge1xuICAgICAgdGhpcy5fZXZlbnRzID0gbnVsbDtcbiAgICB9IGVsc2UgaWYgKCAoIGxpc3QgPSBfZ2V0TGlzdCggdGhpcywgdHlwZSApICkgKSB7XG4gICAgICBpZiAoIGxpc3RlbmVyICkge1xuICAgICAgICBmb3IgKCBpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgICAgICBpZiAoIGxpc3RbIGkgXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIgJiYgbGlzdFsgaSBdLmFjdGl2ZSApIHtcbiAgICAgICAgICAgIGxpc3RbIGkgXS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBMaWdodEVtaXR0ZXIjb25cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgdHlwZSAgICAgQSBldmVudCBuYW1lLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaXN0ZW5lciBBIGV2ZW50IGhhbmRsZXIuXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9uOiBmdW5jdGlvbiBvbiAoIHR5cGUsIGxpc3RlbmVyICkge1xuICAgIF9vbiggdGhpcywgdHlwZSwgbGlzdGVuZXIgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBMaWdodEVtaXR0ZXIjb25jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICB0eXBlICAgICBBIGV2ZW50IG5hbWUuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyIEEgZXZlbnQgaGFuZGxlci5cbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb25jZTogZnVuY3Rpb24gb25jZSAoIHR5cGUsIGxpc3RlbmVyICkge1xuICAgIF9vbiggdGhpcywgdHlwZSwgbGlzdGVuZXIsIHRydWUgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb25zdHJ1Y3RvcjogTGlnaHRFbWl0dGVyXG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIF9vblxuICogQHBhcmFtICB7TGlnaHRFbWl0dGVyfSBzZWxmXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgIHR5cGVcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSAgICAgbGlzdGVuZXJcbiAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgb25jZVxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gX29uICggc2VsZiwgdHlwZSwgbGlzdGVuZXIsIG9uY2UgKSB7XG4gIHZhciBlbnRpdHkgPSB7XG4gICAgbGlzdGVuZXI6IGxpc3RlbmVyLFxuICAgIGFjdGl2ZTogICB0cnVlLFxuICAgIHR5cGU6ICAgICB0eXBlLFxuICAgIG9uY2U6ICAgICBvbmNlXG4gIH07XG5cbiAgaWYgKCAhIHNlbGYuX2V2ZW50cyApIHtcbiAgICBzZWxmLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKCBudWxsICk7XG4gIH1cblxuICBpZiAoICEgc2VsZi5fZXZlbnRzWyB0eXBlIF0gKSB7XG4gICAgc2VsZi5fZXZlbnRzWyB0eXBlIF0gPSBbXTtcbiAgfVxuXG4gIHNlbGYuX2V2ZW50c1sgdHlwZSBdLnB1c2goIGVudGl0eSApO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIF9nZXRMaXN0XG4gKiBAcGFyYW0gIHtMaWdodEVtaXR0ZXJ9ICAgc2VsZlxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgIHR5cGVcbiAqIEByZXR1cm4ge2FycmF5PG9iamVjdD4/fVxuICovXG5mdW5jdGlvbiBfZ2V0TGlzdCAoIHNlbGYsIHR5cGUgKSB7XG4gIHJldHVybiBzZWxmLl9ldmVudHMgJiYgc2VsZi5fZXZlbnRzWyB0eXBlIF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGlnaHRFbWl0dGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX0FyZ3VtZW50RXhjZXB0aW9uID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvQXJndW1lbnRFeGNlcHRpb24nICk7XG52YXIgZGVmYXVsdFRvID0gcmVxdWlyZSggJy4vZGVmYXVsdC10bycgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiZWZvcmUgKCBuLCBmbiApIHtcbiAgdmFyIHZhbHVlO1xuXG4gIGlmICggdHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nICkge1xuICAgIHRocm93IF9Bcmd1bWVudEV4Y2VwdGlvbiggZm4sICdhIGZ1bmN0aW9uJyApO1xuICB9XG5cbiAgbiA9IGRlZmF1bHRUbyggbiwgMSApO1xuXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCAtLW4gPj0gMCApIHtcbiAgICAgIHZhbHVlID0gZm4uYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG1ldGhvZCBwZWFrby5jbGFtcFxuICogQHBhcmFtICB7bnVtYmVyfSB2YWx1ZSBBIG51bWJlciB0byBiZSBjbGFtcGVkLlxuICogQHBhcmFtICB7bnVtYmVyfSBsb3dlciBMb3dlciBib3VuZCBvZiB0aGUgY2xhbXAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHVwcGVyIFVwcGVyIGJvdW5kIG9mIHRoZSBjbGFtcC5cbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjbGFtcCAoIHZhbHVlLCBsb3dlciwgdXBwZXIgKSB7XG4gIGlmICggdmFsdWUgPj0gdXBwZXIgKSB7XG4gICAgcmV0dXJuIHVwcGVyO1xuICB9XG5cbiAgaWYgKCB2YWx1ZSA8PSBsb3dlciApIHtcbiAgICByZXR1cm4gbG93ZXI7XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgRVJSOiB7XG4gICAgSU5WQUxJRF9BUkdTOiAgICAgICAgICAnSW52YWxpZCBhcmd1bWVudHMnLFxuICAgIEZVTkNUSU9OX0VYUEVDVEVEOiAgICAgJ0V4cGVjdGVkIGEgZnVuY3Rpb24nLFxuICAgIFNUUklOR19FWFBFQ1RFRDogICAgICAgJ0V4cGVjdGVkIGEgc3RyaW5nJyxcbiAgICBVTkRFRklORURfT1JfTlVMTDogICAgICdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnLFxuICAgIFJFRFVDRV9PRl9FTVBUWV9BUlJBWTogJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnLFxuICAgIE5PX1BBVEg6ICAgICAgICAgICAgICAgJ05vIHBhdGggd2FzIGdpdmVuJ1xuICB9LFxuXG4gIE1BWF9BUlJBWV9MRU5HVEg6IDQyOTQ5NjcyOTUsXG4gIE1BWF9TQUZFX0lOVDogICAgIDkwMDcxOTkyNTQ3NDA5OTEsXG4gIE1JTl9TQUZFX0lOVDogICAgLTkwMDcxOTkyNTQ3NDA5OTEsXG5cbiAgREVFUDogICAgICAgICAxLFxuICBERUVQX0tFRVBfRk46IDJcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgTXVzdCBiZSAnV2lkdGgnIG9yICdIZWlnaHQnIChjYXBpdGFsaXplZCkuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlR2V0RWxlbWVudERpbWVuc2lvbiAoIG5hbWUgKSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1dpbmRvd3xOb2RlfSBlXG4gICAqL1xuICByZXR1cm4gZnVuY3Rpb24gKCBlICkge1xuICAgIHZhciB2O1xuICAgIHZhciBiO1xuICAgIHZhciBkO1xuXG4gICAgLy8gaWYgdGhlIGVsZW1lbnQgaXMgYSB3aW5kb3dcblxuICAgIGlmICggZS53aW5kb3cgPT09IGUgKSB7XG5cbiAgICAgIC8vIGlubmVyV2lkdGggYW5kIGlubmVySGVpZ2h0IGluY2x1ZGVzIGEgc2Nyb2xsYmFyIHdpZHRoLCBidXQgaXQgaXMgbm90XG4gICAgICAvLyBzdXBwb3J0ZWQgYnkgb2xkZXIgYnJvd3NlcnNcblxuICAgICAgdiA9IE1hdGgubWF4KCBlWyAnaW5uZXInICsgbmFtZSBdIHx8IDAsIGUuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50WyAnY2xpZW50JyArIG5hbWUgXSApO1xuXG4gICAgLy8gaWYgdGhlIGVsZW1lbnRzIGlzIGEgZG9jdW1lbnRcblxuICAgIH0gZWxzZSBpZiAoIGUubm9kZVR5cGUgPT09IDkgKSB7XG5cbiAgICAgIGIgPSBlLmJvZHk7XG4gICAgICBkID0gZS5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICAgIHYgPSBNYXRoLm1heChcbiAgICAgICAgYlsgJ3Njcm9sbCcgKyBuYW1lIF0sXG4gICAgICAgIGRbICdzY3JvbGwnICsgbmFtZSBdLFxuICAgICAgICBiWyAnb2Zmc2V0JyArIG5hbWUgXSxcbiAgICAgICAgZFsgJ29mZnNldCcgKyBuYW1lIF0sXG4gICAgICAgIGJbICdjbGllbnQnICsgbmFtZSBdLFxuICAgICAgICBkWyAnY2xpZW50JyArIG5hbWUgXSApO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHYgPSBlWyAnY2xpZW50JyArIG5hbWUgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gdjtcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVmYXVsdFRvICggdmFsdWUsIGRlZmF1bHRWYWx1ZSApIHtcbiAgaWYgKCB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgIT09ICd1bmRlZmluZWQnICYmIHZhbHVlID09PSB2YWx1ZSApIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gZGVmYXVsdFZhbHVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1peGluID0gcmVxdWlyZSggJy4vbWl4aW4nICk7XG5cbmZ1bmN0aW9uIGRlZmF1bHRzICggZGVmYXVsdHMsIG9iamVjdCApIHtcbiAgaWYgKCBvYmplY3QgKSB7XG4gICAgcmV0dXJuIG1peGluKCB7fSwgZGVmYXVsdHMsIG9iamVjdCApO1xuICB9XG5cbiAgcmV0dXJuIG1peGluKCB7fSwgZGVmYXVsdHMgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0cztcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCAnLi9jcmVhdGUvY3JlYXRlLWdldC1lbGVtZW50LWRpbWVuc2lvbicgKSggJ0hlaWdodCcgKTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCAnLi9jcmVhdGUvY3JlYXRlLWdldC1lbGVtZW50LWRpbWVuc2lvbicgKSggJ1dpZHRoJyApO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRVJSID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApLkVSUjtcblxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gZ2V0UHJvdG90eXBlT2YgKCBvYmogKSB7XG4gIHZhciBwcm90b3R5cGU7XG5cbiAgaWYgKCBvYmogPT09IG51bGwgfHwgdHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCBFUlIuVU5ERUZJTkVEX09SX05VTEwgKTtcbiAgfVxuXG4gIHByb3RvdHlwZSA9IG9iai5fX3Byb3RvX187XG5cbiAgaWYgKCB0eXBlb2YgcHJvdG90eXBlICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICByZXR1cm4gcHJvdG90eXBlO1xuICB9XG5cbiAgaWYgKCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoIG9iai5jb25zdHJ1Y3RvciApID09PSAnW29iamVjdCBGdW5jdGlvbl0nICkge1xuICAgIHJldHVybiBvYmouY29uc3RydWN0b3IucHJvdG90eXBlO1xuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX0FyZ3VtZW50RXhjZXB0aW9uICggdW5leHBlY3RlZCwgZXhwZWN0ZWQgKSB7XG4gIHJldHVybiBFcnJvciggJ1wiJyArIHRvU3RyaW5nLmNhbGwoIHVuZXhwZWN0ZWQgKSArICdcIiBpcyBub3QgJyArIGV4cGVjdGVkICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIF9tZW1vaXplXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gZnVuY3Rpb25fXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfbWVtb2l6ZSAoIGZ1bmN0aW9uXyApIHtcbiAgdmFyIGNhbGxlZCA9IGZhbHNlO1xuICB2YXIgbGFzdFJlc3VsdDtcbiAgdmFyIGxhc3RWYWx1ZTtcblxuICByZXR1cm4gZnVuY3Rpb24gbWVtb2l6ZWQgKCB2YWx1ZSApIHtcbiAgICBzd2l0Y2ggKCBmYWxzZSApIHtcbiAgICAgIGNhc2UgY2FsbGVkOlxuICAgICAgICBjYWxsZWQgPSB0cnVlO1xuICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICBjYXNlIHZhbHVlID09PSBsYXN0VmFsdWU6XG4gICAgICAgIHJldHVybiAoIGxhc3RSZXN1bHQgPSBmdW5jdGlvbl8oICggbGFzdFZhbHVlID0gdmFsdWUgKSApICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxhc3RSZXN1bHQ7XG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICk7XG52YXIgaXNMZW5ndGggICAgID0gcmVxdWlyZSggJy4vaXMtbGVuZ3RoJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gaXNBcnJheSAoIHZhbHVlICkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKCB2YWx1ZSApICYmXG4gICAgaXNMZW5ndGgoIHZhbHVlLmxlbmd0aCApICYmXG4gICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKCB2YWx1ZSApID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIE1BWF9BUlJBWV9MRU5HVEggPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICkuTUFYX0FSUkFZX0xFTkdUSDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0xlbmd0aCAoIHZhbHVlICkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJlxuICAgIHZhbHVlID49IDAgJiZcbiAgICB2YWx1ZSA8PSBNQVhfQVJSQVlfTEVOR1RIICYmXG4gICAgdmFsdWUgJSAxID09PSAwO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc09iamVjdExpa2UgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGw7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICk7XG5cbnZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzT2JqZWN0ICggdmFsdWUgKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UoIHZhbHVlICkgJiYgdG9TdHJpbmcuY2FsbCggdmFsdWUgKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0UHJvdG90eXBlT2YgPSByZXF1aXJlKCAnLi9nZXQtcHJvdG90eXBlLW9mJyApO1xudmFyIGlzT2JqZWN0ICAgICAgID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0JyApO1xuXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIE9CSkVDVCA9IHRvU3RyaW5nLmNhbGwoIE9iamVjdCApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzUGxhaW5PYmplY3QgKCB2ICkge1xuICB2YXIgcDtcbiAgdmFyIGM7XG5cbiAgaWYgKCAhIGlzT2JqZWN0KCB2ICkgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcCA9IGdldFByb3RvdHlwZU9mKCB2ICk7XG5cbiAgaWYgKCBwID09PSBudWxsICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKCAhIGhhc093blByb3BlcnR5LmNhbGwoIHAsICdjb25zdHJ1Y3RvcicgKSApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjID0gcC5jb25zdHJ1Y3RvcjtcblxuICByZXR1cm4gdHlwZW9mIGMgPT09ICdmdW5jdGlvbicgJiYgdG9TdHJpbmcuY2FsbCggYyApID09PSBPQkpFQ1Q7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3VwcG9ydCAgPSByZXF1aXJlKCAnLi9zdXBwb3J0L3N1cHBvcnQta2V5cycgKTtcblxudmFyIHRvT2JqZWN0ID0gcmVxdWlyZSggJy4vdG8tb2JqZWN0JyApO1xuXG5pZiAoIHN1cHBvcnQgIT09ICdlczIwMTUnICkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGtleXMgKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoIHRvT2JqZWN0KCB2YWx1ZSApICk7XG4gIH07XG59IGVsc2Uge1xuICBtb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5rZXlzO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbWVtb2l6ZSAgICAgICA9IHJlcXVpcmUoICcuL2ludGVybmFsL21lbW9pemUnICk7XG5cbnZhciBpc1BsYWluT2JqZWN0ID0gcmVxdWlyZSggJy4vaXMtcGxhaW4tb2JqZWN0JyApO1xudmFyIHRvT2JqZWN0ICAgICAgPSByZXF1aXJlKCAnLi90by1vYmplY3QnICk7XG52YXIga2V5cyAgICAgICAgICA9IHJlcXVpcmUoICcuL2tleXMnICk7XG52YXIgaXNBcnJheSAgICAgICA9IG1lbW9pemUoIHJlcXVpcmUoICcuL2lzLWFycmF5JyApICk7XG5cbi8qKlxuICogQG1ldGhvZCBwZWFrby5taXhpblxuICogQHBhcmFtICB7Ym9vbGVhbn0gICAgW2RlZXA9dHJ1ZV1cbiAqIEBwYXJhbSAge29iamVjdH0gICAgIHRhcmdldFxuICogQHBhcmFtICB7Li4ub2JqZWN0P30gb2JqZWN0XG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWl4aW4gKCBkZWVwLCB0YXJnZXQgKSB7XG4gIHZhciBhcmdzTGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgdmFyIGkgPSAyO1xuICB2YXIgb2JqZWN0O1xuICB2YXIgc291cmNlO1xuICB2YXIgdmFsdWU7XG4gIHZhciBqO1xuICB2YXIgbDtcbiAgdmFyIGs7XG5cbiAgaWYgKCB0eXBlb2YgZGVlcCAhPT0gJ2Jvb2xlYW4nICkge1xuICAgIHRhcmdldCA9IGRlZXA7XG4gICAgZGVlcCA9IHRydWU7XG4gICAgaSA9IDE7XG4gIH1cblxuICB0YXJnZXQgPSB0b09iamVjdCggdGFyZ2V0ICk7XG5cbiAgZm9yICggOyBpIDwgYXJnc0xlbmd0aDsgKytpICkge1xuICAgIG9iamVjdCA9IGFyZ3VtZW50c1sgaSBdO1xuXG4gICAgaWYgKCAhIG9iamVjdCApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGZvciAoIGsgPSBrZXlzKCBvYmplY3QgKSwgaiA9IDAsIGwgPSBrLmxlbmd0aDsgaiA8IGw7ICsraiApIHtcbiAgICAgIHZhbHVlID0gb2JqZWN0WyBrWyBqIF0gXTtcblxuICAgICAgaWYgKCBkZWVwICYmIGlzUGxhaW5PYmplY3QoIHZhbHVlICkgfHwgaXNBcnJheSggdmFsdWUgKSApIHtcbiAgICAgICAgc291cmNlID0gdGFyZ2V0WyBrWyBqIF0gXTtcblxuICAgICAgICBpZiAoIGlzQXJyYXkoIHZhbHVlICkgKSB7XG4gICAgICAgICAgaWYgKCAhIGlzQXJyYXkoIHNvdXJjZSApICkge1xuICAgICAgICAgICAgc291cmNlID0gW107XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICggISBpc1BsYWluT2JqZWN0KCBzb3VyY2UgKSApIHtcbiAgICAgICAgICAgIHNvdXJjZSA9IHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRhcmdldFsga1sgaiBdIF0gPSBtaXhpbiggdHJ1ZSwgc291cmNlLCB2YWx1ZSApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0WyBrWyBqIF0gXSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5vb3AgKCkge307IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiZWZvcmUgPSByZXF1aXJlKCAnLi9iZWZvcmUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gb25jZSAoIHRhcmdldCApIHtcbiAgcmV0dXJuIGJlZm9yZSggMSwgdGFyZ2V0ICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG50cnkge1xuICBtb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5rZXlzKCAnJyApLCAnZXMyMDE1JzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtZXhwcmVzc2lvbnMsIG5vLXNlcXVlbmNlc1xufSBjYXRjaCAoIGVycm9yICkge1xuICBtb2R1bGUuZXhwb3J0cyA9ICdlczUnO1xufVxuIiwiLyoqXG4gKiBCYXNlZCBvbiBFcmlrIE3DtmxsZXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsOlxuICpcbiAqIEFkYXB0ZWQgZnJvbSBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9wYXVsaXJpc2gvMTU3OTY3MSB3aGljaCBkZXJpdmVkIGZyb21cbiAqIGh0dHA6Ly9wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4gKiBodHRwOi8vbXkub3BlcmEuY29tL2Vtb2xsZXIvYmxvZy8yMDExLzEyLzIwL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtZXItYW5pbWF0aW5nXG4gKlxuICogcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsIGJ5IEVyaWsgTcO2bGxlci5cbiAqIEZpeGVzIGZyb20gUGF1bCBJcmlzaCwgVGlubyBaaWpkZWwsIEFuZHJldyBNYW8sIEtsZW1lbiBTbGF2acSNLCBEYXJpdXMgQmFjb24uXG4gKlxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB0aW1lc3RhbXAgPSByZXF1aXJlKCAnLi90aW1lc3RhbXAnICk7XG5cbnZhciByZXF1ZXN0QUY7XG52YXIgY2FuY2VsQUY7XG5cbmlmICggdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICkge1xuICBjYW5jZWxBRiA9IHNlbGYuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICBzZWxmLndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgc2VsZi53ZWJraXRDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICBzZWxmLm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgc2VsZi5tb3pDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gIHJlcXVlc3RBRiA9IHNlbGYucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgc2VsZi53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICBzZWxmLm1velJlcXVlc3RBbmltYXRpb25GcmFtZTtcbn1cblxudmFyIG5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gISByZXF1ZXN0QUYgfHwgISBjYW5jZWxBRiB8fFxuICB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiAvaVAoYWR8aG9uZXxvZCkuKk9TXFxzNi8udGVzdCggbmF2aWdhdG9yLnVzZXJBZ2VudCApO1xuXG5pZiAoIG5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lICkge1xuICB2YXIgbGFzdFJlcXVlc3RUaW1lID0gMDtcbiAgdmFyIGZyYW1lRHVyYXRpb24gICA9IDEwMDAgLyA2MDtcblxuICBleHBvcnRzLnJlcXVlc3QgPSBmdW5jdGlvbiByZXF1ZXN0ICggYW5pbWF0ZSApIHtcbiAgICB2YXIgbm93ICAgICAgICAgICAgID0gdGltZXN0YW1wKCk7XG4gICAgdmFyIG5leHRSZXF1ZXN0VGltZSA9IE1hdGgubWF4KCBsYXN0UmVxdWVzdFRpbWUgKyBmcmFtZUR1cmF0aW9uLCBub3cgKTtcblxuICAgIHJldHVybiBzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG4gICAgICBsYXN0UmVxdWVzdFRpbWUgPSBuZXh0UmVxdWVzdFRpbWU7XG4gICAgICBhbmltYXRlKCBub3cgKTtcbiAgICB9LCBuZXh0UmVxdWVzdFRpbWUgLSBub3cgKTtcbiAgfTtcblxuICBleHBvcnRzLmNhbmNlbCA9IGNsZWFyVGltZW91dDtcbn0gZWxzZSB7XG4gIGV4cG9ydHMucmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3QgKCBhbmltYXRlICkge1xuICAgIHJldHVybiByZXF1ZXN0QUYoIGFuaW1hdGUgKTtcbiAgfTtcblxuICBleHBvcnRzLmNhbmNlbCA9IGZ1bmN0aW9uIGNhbmNlbCAoIGlkICkge1xuICAgIHJldHVybiBjYW5jZWxBRiggaWQgKTtcbiAgfTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG5hdmlnYXRvclN0YXJ0O1xuXG5pZiAoIHR5cGVvZiBwZXJmb3JtYW5jZSA9PT0gJ3VuZGVmaW5lZCcgfHwgISBwZXJmb3JtYW5jZS5ub3cgKSB7XG4gIG5hdmlnYXRvclN0YXJ0ID0gRGF0ZS5ub3coKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRpbWVzdGFtcCAoKSB7XG4gICAgcmV0dXJuIERhdGUubm93KCkgLSBuYXZpZ2F0b3JTdGFydDtcbiAgfTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdGltZXN0YW1wICgpIHtcbiAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gIH07XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBFUlIgPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICkuRVJSO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRvT2JqZWN0ICggdmFsdWUgKSB7XG4gIGlmICggdmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJyApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoIEVSUi5VTkRFRklORURfT1JfTlVMTCApO1xuICB9XG5cbiAgcmV0dXJuIE9iamVjdCggdmFsdWUgKTtcbn07XG4iXX0=
