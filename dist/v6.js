(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var createProgram = require( './internal/create_program' );
var createShader  = require( './internal/create_shader' );

/**
 * @interface IUniform
 */

/**
 * @interface IAttribute
 */

/**
 * Высоко-уровневый интерфейс для WebGLProgram.
 * @constructor v6.ShaderProgram
 * @param {IShaderSources}        sources Шейдеры для программы.
 * @param {WebGLRenderingContext} gl      WebGL контекст.
 * @example
 * var ShaderProgram = require( 'v6.js/ShaderProgram' );
 * var shaders       = require( 'v6.js/shaders' );
 * var gl      = canvas.getContext( 'webgl' );
 * var program = new ShaderProgram( shaders.basic, gl );
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
   * @private
   * @member {object} v6.ShaderProgram#_uniforms
   */
  this._uniforms = {};

  /**
   * @private
   * @member {object} v6.ShaderProgram#_attrs
   */
  this._attrs = {};

  /**
   * @private
   * @member {number} v6.ShaderProgram#_uniformIndex
   */
  this._uniformIndex = gl.getProgramParameter( this._program, gl.ACTIVE_UNIFORMS );

  /**
   * @private
   * @member {number} v6.ShaderProgram#_attrIndex
   */
  this._attrIndex = gl.getProgramParameter( this._program, gl.ACTIVE_ATTRIBUTES );
}

ShaderProgram.prototype = {
  /**
   * @method v6.ShaderProgram#use
   * @chainable
   * @see [WebGLRenderingContext#useProgram](https://developer.mozilla.org/docs/Web/API/WebGLRenderingContext/useProgram)
   * @example
   * program.use();
   */
  use: function use ()
  {
    this._gl.useProgram( this._program );
    return this;
  },

  /**
   * @method v6.ShaderProgram#setAttribute
   * @chainable
   * @see [WebGLRenderingContext#enableVertexAttribArray](https://developer.mozilla.org/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray)
   * @see [WebGLRenderingContext#vertexAttribPointer](https://developer.mozilla.org/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)
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
   * @method v6.ShaderProgram#getUniform
   * @param  {string}   name Название uniform.
   * @return {IUniform}      Возвращает данные о uniform.
   * @example
   * var { location } = program.getUniform( 'ucolor' );
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
   * @method v6.ShaderProgram#getAttribute
   * @param  {string}     name Название атрибута.
   * @return {IAttribute}      Возвращает данные о атрибуте.
   * @example
   * var location = program.getAttribute( 'apos' ).location;
   */
  getAttribute: function getAttribute ( name )
  {
    var attr = this._attrs[ name ];

    if ( attr ) {
      return attr;
    }

    while ( --this._attrIndex >= 0 ) {
      attr          = this._gl.getActiveAttrib( this._program, this._attrIndex );
      attr.location = this._gl.getAttribLocation( this._program, name );
      this._attrs[ name ] = attr;

      if ( attr.name === name ) {
        return attr;
      }
    }

    throw ReferenceError( 'No "' + name + '" attribute found' );
  },

  constructor: ShaderProgram
};

/**
 * @method v6.ShaderProgram#setUniform
 * @param  {string} name  Name of the uniform.
 * @param  {any}    value Value you want to set to the uniform.
 * @chainable
 * @example
 * program.setUniform( 'ucolor', [ 255, 0, 0, 1 ] );
 */
ShaderProgram.prototype.setUniform = function setUniform ( name, value )
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
      throw TypeError( 'The uniform type is not supported' );
  }

  return this;
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

},{"light_emitter":37,"peako/timer":90,"peako/timestamp":91}],3:[function(require,module,exports){
'use strict';

var mat3 = require( './mat3' );

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

},{"./mat3":19}],4:[function(require,module,exports){
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

  /**
   * Рендерер.
   * @member {v6.AbstractRenderer|void} v6.Camera#renderer
   */

  if ( options.renderer ) {
    this.renderer = options.renderer;
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

  update: function update ()
  {
    return this;
  },

  constructor: Camera
};

module.exports = Camera;

},{"./settings":5,"peako/defaults":61,"peako/mixin":82}],5:[function(require,module,exports){
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

},{"./RGBA":7,"./internal/parse":9,"peako/clamp":53}],7:[function(require,module,exports){
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
  'PERCENT',
  'POINTS',
  'LINES'
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

},{"light_emitter":37}],12:[function(require,module,exports){
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

},{"peako/noop":83}],19:[function(require,module,exports){
'use strict';

exports.identity = function identity ()
{
  return [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ];
};

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

exports.translate = function translate ( m1, x, y )
{
  m1[ 6 ] = ( x * m1[ 0 ] ) + ( y * m1[ 3 ] ) + m1[ 6 ];
  m1[ 7 ] = ( x * m1[ 1 ] ) + ( y * m1[ 4 ] ) + m1[ 7 ];
  m1[ 8 ] = ( x * m1[ 2 ] ) + ( y * m1[ 5 ] ) + m1[ 8 ];
};

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

exports.scale = function scale ( m1, x, y )
{
  m1[ 0 ] *= x;
  m1[ 1 ] *= x;
  m1[ 2 ] *= x;
  m1[ 3 ] *= y;
  m1[ 4 ] *= y;
  m1[ 5 ] *= y;
};

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

},{}],20:[function(require,module,exports){
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

},{"../settings":34}],21:[function(require,module,exports){
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

},{"../settings":34,"./AbstractVector":20}],22:[function(require,module,exports){
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

},{"./AbstractVector":20}],23:[function(require,module,exports){
/* eslint lines-around-directive: off */
/* eslint lines-around-comment: off */
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
    this.drawArrays( polygon, polygon.length * 0.5, null, xRadius, yRadius );
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
   * @param {object}   [options]      Параметры фигуры.
   * @param {constant} [options.type] Тип фигуры: POINTS, LINES.
   * @chainable
   * @example
   * // Begin drawing POINTS shape.
   * renderer.beginShape( { type: v6.constants.get( 'POINTS' ) } );
   * // Begin drawing shape without type (must be passed later in `endShape`).
   * renderer.beginShape();
   */
  beginShape: function beginShape ( options )
  {
    if ( ! options ) {
      options = {};
    }
    this._vertices.length = 0;
    if ( typeof options.type === 'undefined' ) {
      this._shapeType = null;
    } else {
      this._shapeType = options.type;
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
    return this;
  },
  /**
   * Рисует фигуру из вершин.
   * @method v6.AbstractRenderer#endShape
   * @param {object}   [options]       Параметры фигуры.
   * @param {boolean}  [options.close] Соединить последнюю вершину с первой (закрыть фигуру).
   * @param {constant} [options.type]  Тип фигуры (несовместимо с `options.draw`).
   * @param {function} [options.draw]  Нестандартная функция для отрисовки всех вершин (несовместимо с `options.type`).
   * @chainable
   * @example
   * // Close and draw shape.
   * renderer.endShape( { close: true } );
   * // Draw with custom function.
   * renderer.endShape( {
   *   draw: function draw ( vertices )
   *   {
   *     renderer.drawArrays( vertices, vertices.length / 2 );
   *   }
   * } );
   */
  endShape: function endShape ()
  {
    throw Error( 'Not implemented' );
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
   * @see v6.Camera
   * @example
   * // Set identity transform.
   * renderer.setTransform( 1, 0, 0, 1, 0, 0 );
   * // Set transform from `v6.Camera`.
   * renderer.setTransform( camera );
   */
  setTransform: function setTransform ( m11, m12, m21, m22, dx, dy )
  {
    var position, zoom;
    if ( typeof m11 === 'object' && m11 !== null ) {
      position = m11.position;
      zoom = m11.zoom;
      this.matrix.setTransform( zoom, 0, 0, zoom, position[ 0 ] * zoom, position[ 1 ] * zoom );
    } else {
      this.matrix.setTransform( m11, m12, m21, m22, dx, dy );
    }
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
 * @param  {object}              options {@link v6.options}
 * @param  {constant}            type    Type of renderer: `2D` или `GL`. Cannot be `AUTO`!.
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
   */
  self._stack = [];
  /**
   * Позиция последних сохраненных настроек рендеринга.
   * @private
   * @member {number} v6.AbstractRenderer#_stackIndex
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
   * Тип фигуры.
   * @private
   * @member {Array.<number>} v6.AbstractRenderer#_shapeType
   * @see v6.AbstractRenderer#beginShape
   * @see v6.AbstractRenderer#vertex
   * @see v6.AbstractRenderer#endShape
   */
  self._shapeType = null;
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

},{"../constants":10,"../internal/create_polygon":14,"../internal/polygons":17,"./internal/copy_drawing_settings":27,"./internal/get_webgl":30,"./internal/process_rect_align":31,"./internal/set_default_drawing_settings":32,"./settings":33,"peako/get-element-h":64,"peako/get-element-w":65}],24:[function(require,module,exports){
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
 * @param {object} options {@link v6.options}
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

},{"../constants":10,"./AbstractRenderer":23,"./internal/process_rect_align":31,"./settings":33,"peako/defaults":61}],25:[function(require,module,exports){
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
 * @var {Float32Array} square
 */
var square = ( function ()
{
  var square = [
    0, 0,
    1, 0,
    1, 1,
    0, 1
  ];

  if ( typeof Float32Array === 'function' ) {
    return new Float32Array( square ); // eslint-disable-line no-undef
  }

  return square;
} )();

/**
 * WebGL рендерер.
 * @constructor v6.RendererGL
 * @extends v6.AbstractRenderer
 * @param {object} options {@link v6.options}
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
   * @property {WebGLBuffer} square  Используется для отрисовки прямоугольника в {@link v6.RendererGL#rect}.
   */
  this.buffers = {
    default: this.context.createBuffer(),
    square:  this.context.createBuffer()
  };

  this.context.bindBuffer( this.context.ARRAY_BUFFER, this.buffers.square );
  this.context.bufferData( this.context.ARRAY_BUFFER, square, this.context.STATIC_DRAW );

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

},{"../ShaderProgram":1,"../Transform":3,"../constants":10,"../shaders":35,"./AbstractRenderer":23,"./internal/process_rect_align":31,"./settings":33,"peako/defaults":61}],26:[function(require,module,exports){
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
 * @param  {object}              options {@link v6.options}.
 * @return {v6.AbstractRenderer}         Новый рендерер (2D, GL).
 * @example
 * var createRenderer = require( 'v6.js/core/renderer' );
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

},{"../constants":10,"../internal/report":18,"./Renderer2D":24,"./RendererGL":25,"./internal/get_renderer_type":29,"./internal/get_webgl":30,"./settings":33}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{"../../constants":10}],29:[function(require,module,exports){
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

},{"../../constants":10,"peako/once":85,"platform":"platform"}],30:[function(require,module,exports){
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

},{"peako/once":85}],31:[function(require,module,exports){
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

},{"../../constants":10}],32:[function(require,module,exports){
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

},{"./copy_drawing_settings":27,"./default_drawing_settings":28}],33:[function(require,module,exports){
'use strict';

var color = require( '../color/RGBA' );
var type  = require( '../constants' ).get( '2D' );

/**
 * Настройки для рендереров: {@link v6.Renderer2D}, {@link v6.RendererGL}, {@link v6.AbstractRenderer}, {@link v6.createRenderer}.
 * @namespace v6.settings.renderer
 */

/**
 * @member   {object} [v6.settings.renderer.settings] Настройки рендерера по умолчанию.
 * @property {object} [color=v6.RGBA]                 Конструкторы {@link v6.RGBA} или {@link v6.HSLA}.
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

},{"../color/RGBA":7,"../constants":10}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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

},{}],36:[function(require,module,exports){
/*!
 * Copyright (c) 2017-2018 VladislavTikhiy (SILENT) (silent-tempest)
 * Released under the GPL-3.0 license.
 * https://github.com/silent-tempest/v6.js/tree/dev/
 */

'use strict';

/**
 * @namespace v6
 */

/**
 * A valid CSS-color: `"hsl(360, 100%, 100%)"`, `"#ff00ff"`, `"lightpink"`. {@link v6.HSLA} or {@link v6.RGBA}.
 * @typedef {string|v6.HSLA|v6.RGBA} TColor
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
exports.createRenderer   = require( './core/renderer' );
exports.shaders          = require( './core/shaders' );

/**
 * Настройки "v6.js".
 * @namespace v6.settings
 */
exports.settings = {
  renderer: require( './core/renderer/settings' ),
  camera:   require( './core/camera/settings' ),
  core:     require( './core/settings' )
};

if ( typeof self !== 'undefined' ) {
  self.v6 = exports;
}

},{"./core/ShaderProgram":1,"./core/Ticker":2,"./core/Transform":3,"./core/camera/Camera":4,"./core/camera/settings":5,"./core/color/HSLA":6,"./core/color/RGBA":7,"./core/constants":10,"./core/image/AbstractImage":11,"./core/image/CompoundedImage":12,"./core/image/Image":13,"./core/math/AbstractVector":20,"./core/math/Vector2D":21,"./core/math/Vector3D":22,"./core/renderer":26,"./core/renderer/AbstractRenderer":23,"./core/renderer/Renderer2D":24,"./core/renderer/RendererGL":25,"./core/renderer/settings":33,"./core/settings":34,"./core/shaders":35}],37:[function(require,module,exports){
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

},{}],38:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString;

module.exports = function _throwArgumentException ( unexpected, expected ) {
  throw Error( '"' + toString.call( unexpected ) + '" is not ' + expected );
};

},{}],39:[function(require,module,exports){
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

},{"./type":94}],40:[function(require,module,exports){
'use strict';

module.exports = function _unescape ( string ) {
  return string.replace( /\\(\\)?/g, '$1' );
};

},{}],41:[function(require,module,exports){
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

},{"../isset":78}],42:[function(require,module,exports){
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

},{}],43:[function(require,module,exports){
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

},{"../call-iteratee":51,"../isset":78}],44:[function(require,module,exports){
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

},{"../call-iteratee":51}],45:[function(require,module,exports){
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

},{"../isset":78}],46:[function(require,module,exports){
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

},{"./base-to-index":49}],47:[function(require,module,exports){
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

},{"../support/support-keys":89,"./base-index-of":46}],48:[function(require,module,exports){
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

},{"./base-get":45}],49:[function(require,module,exports){
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

},{}],50:[function(require,module,exports){
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

},{"./_throw-argument-exception":38,"./default-to":60}],51:[function(require,module,exports){
'use strict';

module.exports = function callIteratee ( fn, ctx, val, key, obj ) {
  if ( typeof ctx === 'undefined' ) {
    return fn( val, key, obj );
  }

  return fn.call( ctx, val, key, obj );
};

},{}],52:[function(require,module,exports){
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

},{"./_type":39,"./_unescape":40,"./base/base-exec":42,"./is-key":70,"./to-key":92}],53:[function(require,module,exports){
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

},{}],54:[function(require,module,exports){
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

},{"./create":56,"./each":63,"./get-prototype-of":66,"./is-object-like":72,"./to-object":93}],55:[function(require,module,exports){
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

},{}],56:[function(require,module,exports){
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

},{"./define-properties":62,"./is-primitive":75,"./set-prototype-of":87}],57:[function(require,module,exports){
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

},{"../base/base-for-each":43,"../base/base-for-in":44,"../is-array-like":68,"../iteratee":79,"../keys":80,"../to-object":93}],58:[function(require,module,exports){
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

},{}],59:[function(require,module,exports){
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

},{"../cast-path":52,"../noop":83}],60:[function(require,module,exports){
'use strict';

module.exports = function defaultTo ( value, defaultValue ) {
  if ( value != null && value === value ) {
    return value;
  }

  return defaultValue;
};

},{}],61:[function(require,module,exports){
'use strict';

var mixin = require( './mixin' ),
    clone = require( './clone' );

module.exports = function defaults ( defaults, object ) {
  if ( object == null ) {
    return clone( true, defaults );
  }

  return mixin( true, clone( true, defaults ), object );
};

},{"./clone":54,"./mixin":82}],62:[function(require,module,exports){
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

},{"./base/base-define-property":41,"./each":63,"./is-primitive":75,"./support/support-define-property":88}],63:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-each' )();

},{"./create/create-each":57}],64:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-get-element-dimension' )( 'Height' );

},{"./create/create-get-element-dimension":58}],65:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-get-element-dimension' )( 'Width' );

},{"./create/create-get-element-dimension":58}],66:[function(require,module,exports){
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

},{"./constants":55}],67:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' ),
    isLength     = require( './is-length' ),
    isWindowLike = require( './is-window-like' );

module.exports = function isArrayLikeObject ( value ) {
  return isObjectLike( value ) && isLength( value.length ) && ! isWindowLike( value );
};

},{"./is-length":71,"./is-object-like":72,"./is-window-like":77}],68:[function(require,module,exports){
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

},{"./is-length":71,"./is-window-like":77}],69:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' ),
    isLength = require( './is-length' );

var toString = {}.toString;

module.exports = Array.isArray || function isArray ( value ) {
  return isObjectLike( value ) &&
    isLength( value.length ) &&
    toString.call( value ) === '[object Array]';
};

},{"./is-length":71,"./is-object-like":72}],70:[function(require,module,exports){
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

},{"./_type":39}],71:[function(require,module,exports){
'use strict';

var MAX_ARRAY_LENGTH = require( './constants' ).MAX_ARRAY_LENGTH;

module.exports = function isLength ( value ) {
  return typeof value === 'number' &&
    value >= 0 &&
    value <= MAX_ARRAY_LENGTH &&
    value % 1 === 0;
};

},{"./constants":55}],72:[function(require,module,exports){
'use strict';

module.exports = function isObjectLike ( value ) {
  return !! value && typeof value === 'object';
};

},{}],73:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );

var toString = {}.toString;

module.exports = function isObject ( value ) {
  return isObjectLike( value ) &&
    toString.call( value ) === '[object Object]';
};

},{"./is-object-like":72}],74:[function(require,module,exports){
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

},{"./get-prototype-of":66,"./is-object":73}],75:[function(require,module,exports){
'use strict';

module.exports = function isPrimitive ( value ) {
  return ! value ||
    typeof value !== 'object' &&
    typeof value !== 'function';
};

},{}],76:[function(require,module,exports){
'use strict';

var type = require( './type' );

module.exports = function isSymbol ( value ) {
  return type( value ) === 'symbol';
};

},{"./type":94}],77:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );

module.exports = function isWindowLike ( value ) {
  return isObjectLike( value ) && value.window === value;
};

},{"./is-object-like":72}],78:[function(require,module,exports){
'use strict';

module.exports = function isset ( key, obj ) {
  if ( obj == null ) {
    return false;
  }

  return typeof obj[ key ] !== 'undefined' || key in obj;
};

},{}],79:[function(require,module,exports){
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

},{"./is-array-like-object":67,"./matches-property":81,"./property":86}],80:[function(require,module,exports){
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

},{"./base/base-keys":47,"./support/support-keys":89,"./to-object":93}],81:[function(require,module,exports){
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

},{"./base/base-get":45,"./cast-path":52,"./constants":55}],82:[function(require,module,exports){
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

},{"./is-array":69,"./is-plain-object":74,"./keys":80,"./to-object":93}],83:[function(require,module,exports){
'use strict';

module.exports = function noop () {};

},{}],84:[function(require,module,exports){
'use strict';

module.exports = Date.now || function now () {
  return new Date().getTime();
};

},{}],85:[function(require,module,exports){
'use strict';

var before = require( './before' );

module.exports = function once ( target ) {
  return before( 1, target );
};

},{"./before":50}],86:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-property' )( require( './base/base-property' ) );

},{"./base/base-property":48,"./create/create-property":59}],87:[function(require,module,exports){
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

},{"./constants":55,"./is-primitive":75}],88:[function(require,module,exports){
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

},{}],89:[function(require,module,exports){
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

},{}],90:[function(require,module,exports){
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

},{"./timestamp":91}],91:[function(require,module,exports){
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

},{"./now":84}],92:[function(require,module,exports){
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

},{"./_unescape":40,"./is-symbol":76}],93:[function(require,module,exports){
'use strict';

var ERR = require( './constants' ).ERR;

module.exports = function toObject ( value ) {
  if ( value == null ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  return Object( value );
};

},{"./constants":55}],94:[function(require,module,exports){
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

},{"./create":56}]},{},[36])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb3JlL1NoYWRlclByb2dyYW0uanMiLCJjb3JlL1RpY2tlci5qcyIsImNvcmUvVHJhbnNmb3JtLmpzIiwiY29yZS9jYW1lcmEvQ2FtZXJhLmpzIiwiY29yZS9jYW1lcmEvc2V0dGluZ3MuanMiLCJjb3JlL2NvbG9yL0hTTEEuanMiLCJjb3JlL2NvbG9yL1JHQkEuanMiLCJjb3JlL2NvbG9yL2ludGVybmFsL2NvbG9ycy5qcyIsImNvcmUvY29sb3IvaW50ZXJuYWwvcGFyc2UuanMiLCJjb3JlL2NvbnN0YW50cy5qcyIsImNvcmUvaW1hZ2UvQWJzdHJhY3RJbWFnZS5qcyIsImNvcmUvaW1hZ2UvQ29tcG91bmRlZEltYWdlLmpzIiwiY29yZS9pbWFnZS9JbWFnZS5qcyIsImNvcmUvaW50ZXJuYWwvY3JlYXRlX3BvbHlnb24uanMiLCJjb3JlL2ludGVybmFsL2NyZWF0ZV9wcm9ncmFtLmpzIiwiY29yZS9pbnRlcm5hbC9jcmVhdGVfc2hhZGVyLmpzIiwiY29yZS9pbnRlcm5hbC9wb2x5Z29ucy5qcyIsImNvcmUvaW50ZXJuYWwvcmVwb3J0LmpzIiwiY29yZS9tYXQzLmpzIiwiY29yZS9tYXRoL0Fic3RyYWN0VmVjdG9yLmpzIiwiY29yZS9tYXRoL1ZlY3RvcjJELmpzIiwiY29yZS9tYXRoL1ZlY3RvcjNELmpzIiwiY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyLmpzIiwiY29yZS9yZW5kZXJlci9SZW5kZXJlcjJELmpzIiwiY29yZS9yZW5kZXJlci9SZW5kZXJlckdMLmpzIiwiY29yZS9yZW5kZXJlci9pbmRleC5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvY29weV9kcmF3aW5nX3NldHRpbmdzLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL2dldF9yZW5kZXJlcl90eXBlLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9nZXRfd2ViZ2wuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbi5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvc2V0X2RlZmF1bHRfZHJhd2luZ19zZXR0aW5ncy5qcyIsImNvcmUvcmVuZGVyZXIvc2V0dGluZ3MuanMiLCJjb3JlL3NldHRpbmdzLmpzIiwiY29yZS9zaGFkZXJzLmpzIiwiaW5kZXguanMiLCJub2RlX21vZHVsZXMvbGlnaHRfZW1pdHRlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdGhyb3ctYXJndW1lbnQtZXhjZXB0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL190eXBlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL191bmVzY2FwZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZGVmaW5lLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1leGVjLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1mb3ItZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZm9yLWluLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1nZXQuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWluZGV4LW9mLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1rZXlzLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtdG8taW5kZXguanMiLCJub2RlX21vZHVsZXMvcGVha28vYmVmb3JlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NhbGwtaXRlcmF0ZWUuanMiLCJub2RlX21vZHVsZXMvcGVha28vY2FzdC1wYXRoLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NsYW1wLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Nsb25lLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NvbnN0YW50cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUuanMiLCJub2RlX21vZHVsZXMvcGVha28vY3JlYXRlL2NyZWF0ZS1lYWNoLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NyZWF0ZS9jcmVhdGUtZ2V0LWVsZW1lbnQtZGltZW5zaW9uLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NyZWF0ZS9jcmVhdGUtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmYXVsdC10by5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9kZWZhdWx0cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9kZWZpbmUtcHJvcGVydGllcy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9lYWNoLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2dldC1lbGVtZW50LWguanMiLCJub2RlX21vZHVsZXMvcGVha28vZ2V0LWVsZW1lbnQtdy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9nZXQtcHJvdG90eXBlLW9mLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWFycmF5LWxpa2Utb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWFycmF5LWxpa2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtYXJyYXkuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMta2V5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWxlbmd0aC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1vYmplY3QtbGlrZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1vYmplY3QuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtcGxhaW4tb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXByaW1pdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1zeW1ib2wuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtd2luZG93LWxpa2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXNzZXQuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXRlcmF0ZWUuanMiLCJub2RlX21vZHVsZXMvcGVha28va2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9tYXRjaGVzLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL21peGluLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL25vb3AuanMiLCJub2RlX21vZHVsZXMvcGVha28vbm93LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL29uY2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcGVha28vc2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9zdXBwb3J0L3N1cHBvcnQtZGVmaW5lLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3N1cHBvcnQvc3VwcG9ydC1rZXlzLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3RpbWVyLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3RpbWVzdGFtcC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90by1rZXkuanMiLCJub2RlX21vZHVsZXMvcGVha28vdG8tb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3R5cGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9TQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6c0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNyZWF0ZVByb2dyYW0gPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9jcmVhdGVfcHJvZ3JhbScgKTtcbnZhciBjcmVhdGVTaGFkZXIgID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvY3JlYXRlX3NoYWRlcicgKTtcblxuLyoqXG4gKiBAaW50ZXJmYWNlIElVbmlmb3JtXG4gKi9cblxuLyoqXG4gKiBAaW50ZXJmYWNlIElBdHRyaWJ1dGVcbiAqL1xuXG4vKipcbiAqINCS0YvRgdC+0LrQvi3Rg9GA0L7QstC90LXQstGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBINC00LvRjyBXZWJHTFByb2dyYW0uXG4gKiBAY29uc3RydWN0b3IgdjYuU2hhZGVyUHJvZ3JhbVxuICogQHBhcmFtIHtJU2hhZGVyU291cmNlc30gICAgICAgIHNvdXJjZXMg0KjQtdC50LTQtdGA0Ysg0LTQu9GPINC/0YDQvtCz0YDQsNC80LzRiy5cbiAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAgICAgIFdlYkdMINC60L7QvdGC0LXQutGB0YIuXG4gKiBAZXhhbXBsZVxuICogdmFyIFNoYWRlclByb2dyYW0gPSByZXF1aXJlKCAndjYuanMvU2hhZGVyUHJvZ3JhbScgKTtcbiAqIHZhciBzaGFkZXJzICAgICAgID0gcmVxdWlyZSggJ3Y2LmpzL3NoYWRlcnMnICk7XG4gKiB2YXIgZ2wgICAgICA9IGNhbnZhcy5nZXRDb250ZXh0KCAnd2ViZ2wnICk7XG4gKiB2YXIgcHJvZ3JhbSA9IG5ldyBTaGFkZXJQcm9ncmFtKCBzaGFkZXJzLmJhc2ljLCBnbCApO1xuICovXG5mdW5jdGlvbiBTaGFkZXJQcm9ncmFtICggc291cmNlcywgZ2wgKVxue1xuICB2YXIgdmVydCA9IGNyZWF0ZVNoYWRlciggc291cmNlcy52ZXJ0LCBnbC5WRVJURVhfU0hBREVSLCBnbCApO1xuICB2YXIgZnJhZyA9IGNyZWF0ZVNoYWRlciggc291cmNlcy5mcmFnLCBnbC5GUkFHTUVOVF9TSEFERVIsIGdsICk7XG5cbiAgLyoqXG4gICAqIFdlYkdMINC/0YDQvtCz0YDQsNC80LzQsCDRgdC+0LfQtNCw0L3QvdCw0Y8g0YEg0L/QvtC80L7RidGM0Y4ge0BsaW5rIGNyZWF0ZVByb2dyYW19LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtXZWJHTFByb2dyYW19IHY2LlNoYWRlclByb2dyYW0jX3Byb2dyYW1cbiAgICovXG4gIHRoaXMuX3Byb2dyYW0gPSBjcmVhdGVQcm9ncmFtKCB2ZXJ0LCBmcmFnLCBnbCApO1xuXG4gIC8qKlxuICAgKiBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IHY2LlNoYWRlclByb2dyYW0jX2dsXG4gICAqL1xuICB0aGlzLl9nbCA9IGdsO1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LlNoYWRlclByb2dyYW0jX3VuaWZvcm1zXG4gICAqL1xuICB0aGlzLl91bmlmb3JtcyA9IHt9O1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LlNoYWRlclByb2dyYW0jX2F0dHJzXG4gICAqL1xuICB0aGlzLl9hdHRycyA9IHt9O1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlNoYWRlclByb2dyYW0jX3VuaWZvcm1JbmRleFxuICAgKi9cbiAgdGhpcy5fdW5pZm9ybUluZGV4ID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggdGhpcy5fcHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TICk7XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuU2hhZGVyUHJvZ3JhbSNfYXR0ckluZGV4XG4gICAqL1xuICB0aGlzLl9hdHRySW5kZXggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKCB0aGlzLl9wcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUyApO1xufVxuXG5TaGFkZXJQcm9ncmFtLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuU2hhZGVyUHJvZ3JhbSN1c2VcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIFtXZWJHTFJlbmRlcmluZ0NvbnRleHQjdXNlUHJvZ3JhbV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZG9jcy9XZWIvQVBJL1dlYkdMUmVuZGVyaW5nQ29udGV4dC91c2VQcm9ncmFtKVxuICAgKiBAZXhhbXBsZVxuICAgKiBwcm9ncmFtLnVzZSgpO1xuICAgKi9cbiAgdXNlOiBmdW5jdGlvbiB1c2UgKClcbiAge1xuICAgIHRoaXMuX2dsLnVzZVByb2dyYW0oIHRoaXMuX3Byb2dyYW0gKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5TaGFkZXJQcm9ncmFtI3NldEF0dHJpYnV0ZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgW1dlYkdMUmVuZGVyaW5nQ29udGV4dCNlbmFibGVWZXJ0ZXhBdHRyaWJBcnJheV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZG9jcy9XZWIvQVBJL1dlYkdMUmVuZGVyaW5nQ29udGV4dC9lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSlcbiAgICogQHNlZSBbV2ViR0xSZW5kZXJpbmdDb250ZXh0I3ZlcnRleEF0dHJpYlBvaW50ZXJdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RvY3MvV2ViL0FQSS9XZWJHTFJlbmRlcmluZ0NvbnRleHQvdmVydGV4QXR0cmliUG9pbnRlcilcbiAgICogQGV4YW1wbGVcbiAgICogcHJvZ3JhbS5zZXRBdHRyaWJ1dGUoICdhcG9zJywgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwICk7XG4gICAqL1xuICBzZXRBdHRyaWJ1dGU6IGZ1bmN0aW9uIHNldEF0dHJpYnV0ZSAoIG5hbWUsIHNpemUsIHR5cGUsIG5vcm1hbGl6ZWQsIHN0cmlkZSwgb2Zmc2V0IClcbiAge1xuICAgIHZhciBsb2NhdGlvbiA9IHRoaXMuZ2V0QXR0cmlidXRlKCBuYW1lICkubG9jYXRpb247XG4gICAgdGhpcy5fZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoIGxvY2F0aW9uICk7XG4gICAgdGhpcy5fZ2wudmVydGV4QXR0cmliUG9pbnRlciggbG9jYXRpb24sIHNpemUsIHR5cGUsIG5vcm1hbGl6ZWQsIHN0cmlkZSwgb2Zmc2V0ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuU2hhZGVyUHJvZ3JhbSNnZXRVbmlmb3JtXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICBuYW1lINCd0LDQt9Cy0LDQvdC40LUgdW5pZm9ybS5cbiAgICogQHJldHVybiB7SVVuaWZvcm19ICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQsNC90L3Ri9C1INC+IHVuaWZvcm0uXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB7IGxvY2F0aW9uIH0gPSBwcm9ncmFtLmdldFVuaWZvcm0oICd1Y29sb3InICk7XG4gICAqL1xuICBnZXRVbmlmb3JtOiBmdW5jdGlvbiBnZXRVbmlmb3JtICggbmFtZSApXG4gIHtcbiAgICB2YXIgdW5pZm9ybSA9IHRoaXMuX3VuaWZvcm1zWyBuYW1lIF07XG4gICAgdmFyIGluZGV4LCBpbmZvO1xuXG4gICAgaWYgKCB1bmlmb3JtICkge1xuICAgICAgcmV0dXJuIHVuaWZvcm07XG4gICAgfVxuXG4gICAgd2hpbGUgKCAtLXRoaXMuX3VuaWZvcm1JbmRleCA+PSAwICkge1xuICAgICAgaW5mbyA9IHRoaXMuX2dsLmdldEFjdGl2ZVVuaWZvcm0oIHRoaXMuX3Byb2dyYW0sIHRoaXMuX3VuaWZvcm1JbmRleCApO1xuXG4gICAgICB1bmlmb3JtID0ge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKCB0aGlzLl9wcm9ncmFtLCBpbmZvLm5hbWUgKSxcbiAgICAgICAgc2l6ZTogaW5mby5zaXplLFxuICAgICAgICB0eXBlOiBpbmZvLnR5cGVcbiAgICAgIH07XG5cbiAgICAgIGlmICggaW5mby5zaXplID4gMSAmJiB+ICggaW5kZXggPSBpbmZvLm5hbWUuaW5kZXhPZiggJ1snICkgKSApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZS5zbGljZSggMCwgaW5kZXggKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fdW5pZm9ybXNbIHVuaWZvcm0ubmFtZSBdID0gdW5pZm9ybTtcblxuICAgICAgaWYgKCB1bmlmb3JtLm5hbWUgPT09IG5hbWUgKSB7XG4gICAgICAgIHJldHVybiB1bmlmb3JtO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IFJlZmVyZW5jZUVycm9yKCAnTm8gXCInICsgbmFtZSArICdcIiB1bmlmb3JtIGZvdW5kJyApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jZ2V0QXR0cmlidXRlXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICAgIG5hbWUg0J3QsNC30LLQsNC90LjQtSDQsNGC0YDQuNCx0YPRgtCwLlxuICAgKiBAcmV0dXJuIHtJQXR0cmlidXRlfSAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC00LDQvdC90YvQtSDQviDQsNGC0YDQuNCx0YPRgtC1LlxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgbG9jYXRpb24gPSBwcm9ncmFtLmdldEF0dHJpYnV0ZSggJ2Fwb3MnICkubG9jYXRpb247XG4gICAqL1xuICBnZXRBdHRyaWJ1dGU6IGZ1bmN0aW9uIGdldEF0dHJpYnV0ZSAoIG5hbWUgKVxuICB7XG4gICAgdmFyIGF0dHIgPSB0aGlzLl9hdHRyc1sgbmFtZSBdO1xuXG4gICAgaWYgKCBhdHRyICkge1xuICAgICAgcmV0dXJuIGF0dHI7XG4gICAgfVxuXG4gICAgd2hpbGUgKCAtLXRoaXMuX2F0dHJJbmRleCA+PSAwICkge1xuICAgICAgYXR0ciAgICAgICAgICA9IHRoaXMuX2dsLmdldEFjdGl2ZUF0dHJpYiggdGhpcy5fcHJvZ3JhbSwgdGhpcy5fYXR0ckluZGV4ICk7XG4gICAgICBhdHRyLmxvY2F0aW9uID0gdGhpcy5fZ2wuZ2V0QXR0cmliTG9jYXRpb24oIHRoaXMuX3Byb2dyYW0sIG5hbWUgKTtcbiAgICAgIHRoaXMuX2F0dHJzWyBuYW1lIF0gPSBhdHRyO1xuXG4gICAgICBpZiAoIGF0dHIubmFtZSA9PT0gbmFtZSApIHtcbiAgICAgICAgcmV0dXJuIGF0dHI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgUmVmZXJlbmNlRXJyb3IoICdObyBcIicgKyBuYW1lICsgJ1wiIGF0dHJpYnV0ZSBmb3VuZCcgKTtcbiAgfSxcblxuICBjb25zdHJ1Y3RvcjogU2hhZGVyUHJvZ3JhbVxufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jc2V0VW5pZm9ybVxuICogQHBhcmFtICB7c3RyaW5nfSBuYW1lICBOYW1lIG9mIHRoZSB1bmlmb3JtLlxuICogQHBhcmFtICB7YW55fSAgICB2YWx1ZSBWYWx1ZSB5b3Ugd2FudCB0byBzZXQgdG8gdGhlIHVuaWZvcm0uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogcHJvZ3JhbS5zZXRVbmlmb3JtKCAndWNvbG9yJywgWyAyNTUsIDAsIDAsIDEgXSApO1xuICovXG5TaGFkZXJQcm9ncmFtLnByb3RvdHlwZS5zZXRVbmlmb3JtID0gZnVuY3Rpb24gc2V0VW5pZm9ybSAoIG5hbWUsIHZhbHVlIClcbntcbiAgdmFyIHVuaWZvcm0gPSB0aGlzLmdldFVuaWZvcm0oIG5hbWUgKTtcbiAgdmFyIF9nbCAgICAgPSB0aGlzLl9nbDtcblxuICBzd2l0Y2ggKCB1bmlmb3JtLnR5cGUgKSB7XG4gICAgY2FzZSBfZ2wuQk9PTDpcbiAgICBjYXNlIF9nbC5JTlQ6XG4gICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgIF9nbC51bmlmb3JtMWl2KCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2dsLnVuaWZvcm0xaSggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgX2dsLkZMT0FUOlxuICAgICAgaWYgKCB1bmlmb3JtLnNpemUgPiAxICkge1xuICAgICAgICBfZ2wudW5pZm9ybTFmdiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9nbC51bmlmb3JtMWYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIF9nbC5GTE9BVF9NQVQyOlxuICAgICAgX2dsLnVuaWZvcm1NYXRyaXgyZnYoIHVuaWZvcm0ubG9jYXRpb24sIGZhbHNlLCB2YWx1ZSApO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBfZ2wuRkxPQVRfTUFUMzpcbiAgICAgIF9nbC51bmlmb3JtTWF0cml4M2Z2KCB1bmlmb3JtLmxvY2F0aW9uLCBmYWxzZSwgdmFsdWUgKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgX2dsLkZMT0FUX01BVDQ6XG4gICAgICBfZ2wudW5pZm9ybU1hdHJpeDRmdiggdW5pZm9ybS5sb2NhdGlvbiwgZmFsc2UsIHZhbHVlICk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIF9nbC5GTE9BVF9WRUMyOlxuICAgICAgaWYgKCB1bmlmb3JtLnNpemUgPiAxICkge1xuICAgICAgICBfZ2wudW5pZm9ybTJmdiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9nbC51bmlmb3JtMmYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlWyAwIF0sIHZhbHVlWyAxIF0gKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgX2dsLkZMT0FUX1ZFQzM6XG4gICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgIF9nbC51bmlmb3JtM2Z2KCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2dsLnVuaWZvcm0zZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWVbIDAgXSwgdmFsdWVbIDEgXSwgdmFsdWVbIDIgXSApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBfZ2wuRkxPQVRfVkVDNDpcbiAgICAgIGlmICggdW5pZm9ybS5zaXplID4gMSApIHtcbiAgICAgICAgX2dsLnVuaWZvcm00ZnYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfZ2wudW5pZm9ybTRmKCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZVsgMCBdLCB2YWx1ZVsgMSBdLCB2YWx1ZVsgMiBdLCB2YWx1ZVsgMyBdICk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnVGhlIHVuaWZvcm0gdHlwZSBpcyBub3Qgc3VwcG9ydGVkJyApO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNoYWRlclByb2dyYW07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBMaWdodEVtaXR0ZXIgPSByZXF1aXJlKCAnbGlnaHRfZW1pdHRlcicgKTtcbnZhciB0aW1lc3RhbXAgICAgPSByZXF1aXJlKCAncGVha28vdGltZXN0YW1wJyApO1xudmFyIHRpbWVyICAgICAgICA9IHJlcXVpcmUoICdwZWFrby90aW1lcicgKTtcblxuLyoqXG4gKiDQrdGC0L7RgiDQutC70LDRgdGBINC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0LfQsNGG0LjQutC70LjQstCw0L3QuNGPINCw0L3QuNC80LDRhtC40Lgg0LLQvNC10YHRgtC+IGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLlxuICogQGNvbnN0cnVjdG9yIHY2LlRpY2tlclxuICogQGV4dGVuZHMge0xpZ2h0RW1pdHRlcn1cbiAqIEBmaXJlcyB1cGRhdGVcbiAqIEBmaXJlcyByZW5kZXJcbiAqIEBleGFtcGxlXG4gKiB2YXIgVGlja2VyID0gcmVxdWlyZSggJ3Y2LmpzL1RpY2tlcicgKTtcbiAqIHZhciB0aWNrZXIgPSBuZXcgVGlja2VyKCk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5cInVwZGF0ZVwiIGV2ZW50LjwvY2FwdGlvbj5cbiAqIC8vIEZpcmVzIGV2ZXJ5dGltZSBhbiBhcHBsaWNhdGlvbiBzaG91bGQgYmUgdXBkYXRlZC5cbiAqIC8vIERlcGVuZHMgb24gbWF4aW11bSBGUFMuXG4gKiB0aWNrZXIub24oICd1cGRhdGUnLCBmdW5jdGlvbiAoIGVsYXBzZWRUaW1lICkge1xuICogICBzaGFwZS5yb3RhdGlvbiArPSAxMCAqIGVsYXBzZWRUaW1lO1xuICogfSApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+XCJyZW5kZXJcIiBldmVudC48L2NhcHRpb24+XG4gKiAvLyBGaXJlcyBldmVyeXRpbWUgYW4gYXBwbGljYXRpb24gc2hvdWxkIGJlIHJlbmRlcmVkLlxuICogLy8gVW5saWtlIFwidXBkYXRlXCIsIGluZGVwZW5kZW50IGZyb20gbWF4aW11bSBGUFMuXG4gKiB0aWNrZXIub24oICdyZW5kZXInLCBmdW5jdGlvbiAoKSB7XG4gKiAgIHJlbmRlcmVyLnJvdGF0ZSggc2hhcGUucm90YXRpb24gKTtcbiAqIH0gKTtcbiAqL1xuZnVuY3Rpb24gVGlja2VyICgpXG57XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBMaWdodEVtaXR0ZXIuY2FsbCggdGhpcyApO1xuXG4gIHRoaXMubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlEID0gMDtcbiAgdGhpcy5sYXN0UmVxdWVzdFRpbWUgPSAwO1xuICB0aGlzLnNraXBwZWRUaW1lID0gMDtcbiAgdGhpcy50b3RhbFRpbWUgPSAwO1xuICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcblxuICAvKipcbiAgICog0JfQsNC/0YPRgdC60LDQtdGCINGG0LjQutC7INCw0L3QuNC80LDRhtC40LguXG4gICAqIEBtZXRob2QgdjYuVGlja2VyI3N0YXJ0XG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogdGlja2VyLnN0YXJ0KCk7XG4gICAqL1xuICBmdW5jdGlvbiBzdGFydCAoIF9ub3cgKVxuICB7XG4gICAgdmFyIGVsYXBzZWRUaW1lO1xuXG4gICAgaWYgKCAhIHNlbGYucnVubmluZyApIHtcbiAgICAgIGlmICggISBfbm93ICkge1xuICAgICAgICBzZWxmLmxhc3RSZXF1ZXN0QW5pbWF0aW9uRnJhbWVJRCA9IHRpbWVyLnJlcXVlc3QoIHN0YXJ0ICk7XG4gICAgICAgIHNlbGYubGFzdFJlcXVlc3RUaW1lID0gdGltZXN0YW1wKCk7XG4gICAgICAgIHNlbGYucnVubmluZyA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWludmFsaWQtdGhpc1xuICAgIH1cblxuICAgIGlmICggISBfbm93ICkge1xuICAgICAgX25vdyA9IHRpbWVzdGFtcCgpO1xuICAgIH1cblxuICAgIGVsYXBzZWRUaW1lID0gTWF0aC5taW4oIDEsICggX25vdyAtIHNlbGYubGFzdFJlcXVlc3RUaW1lICkgKiAwLjAwMSApO1xuXG4gICAgc2VsZi5za2lwcGVkVGltZSArPSBlbGFwc2VkVGltZTtcbiAgICBzZWxmLnRvdGFsVGltZSAgICs9IGVsYXBzZWRUaW1lO1xuXG4gICAgd2hpbGUgKCBzZWxmLnNraXBwZWRUaW1lID49IHNlbGYuc3RlcCAmJiBzZWxmLnJ1bm5pbmcgKSB7XG4gICAgICBzZWxmLnNraXBwZWRUaW1lIC09IHNlbGYuc3RlcDtcbiAgICAgIHNlbGYuZW1pdCggJ3VwZGF0ZScsIHNlbGYuc3RlcCwgX25vdyApO1xuICAgIH1cblxuICAgIHNlbGYuZW1pdCggJ3JlbmRlcicsIGVsYXBzZWRUaW1lLCBfbm93ICk7XG4gICAgc2VsZi5sYXN0UmVxdWVzdFRpbWUgPSBfbm93O1xuICAgIHNlbGYubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlEID0gdGltZXIucmVxdWVzdCggc3RhcnQgKTtcblxuICAgIHJldHVybiB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWludmFsaWQtdGhpc1xuICB9XG5cbiAgdGhpcy5zdGFydCA9IHN0YXJ0O1xuICB0aGlzLmZwcyggNjAgKTtcbn1cblxuVGlja2VyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIExpZ2h0RW1pdHRlci5wcm90b3R5cGUgKTtcblRpY2tlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUaWNrZXI7XG5cbi8qKlxuICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIg0LzQsNC60YHQuNC80LDQu9GM0L3QvtC1INC60L7Qu9C40YfQtdGB0YLQstC+INC60LDQtNGA0L7QsiDQsiDRgdC10LrRg9C90LTRgyAoRlBTKSDQsNC90LjQvNCw0YbQuNC4LlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjZnBzXG4gKiBAcGFyYW0ge251bWJlcn0gZnBzINCc0LDQutGB0LjQvNCw0LvRjNC90YvQuSBGUFMsINC90LDQv9GA0LjQvNC10YA6IDYwLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIC8vIFNldCBtYXhpbXVtIGFuaW1hdGlvbiBGUFMgdG8gMTAuXG4gKiAvLyBEbyBub3QgbmVlZCB0byByZXN0YXJ0IHRpY2tlci5cbiAqIHRpY2tlci5mcHMoIDEwICk7XG4gKi9cblRpY2tlci5wcm90b3R5cGUuZnBzID0gZnVuY3Rpb24gZnBzICggZnBzIClcbntcbiAgdGhpcy5zdGVwID0gMSAvIGZwcztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVGlja2VyI2NsZWFyXG4gKiBAY2hhaW5hYmxlXG4gKi9cblRpY2tlci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiBjbGVhciAoKVxue1xuICB0aGlzLnNraXBwZWRUaW1lID0gMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCe0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINCw0L3QuNC80LDRhtC40Y4uXG4gKiBAbWV0aG9kIHY2LlRpY2tlciNzdG9wXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogdGlja2VyLm9uKCAncmVuZGVyJywgZnVuY3Rpb24gKCkge1xuICogICAvLyBTdG9wIHRoZSB0aWNrZXIgYWZ0ZXIgZml2ZSBzZWNvbmRzLlxuICogICBpZiAoIHRoaXMudG90YWxUaW1lID49IDUgKSB7XG4gKiAgICAgdGlja2VyLnN0b3AoKTtcbiAqICAgfVxuICogfSApO1xuICovXG5UaWNrZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wICgpXG57XG4gIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGlja2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbWF0MyA9IHJlcXVpcmUoICcuL21hdDMnICk7XG5cbmZ1bmN0aW9uIFRyYW5zZm9ybSAoKVxue1xuICB0aGlzLm1hdHJpeCA9IG1hdDMuaWRlbnRpdHkoKTtcbiAgdGhpcy5faW5kZXggPSAtMTtcbiAgdGhpcy5fc3RhY2sgPSBbXTtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZSA9IHtcbiAgc2F2ZTogZnVuY3Rpb24gc2F2ZSAoKVxuICB7XG4gICAgaWYgKCArK3RoaXMuX2luZGV4IDwgdGhpcy5fc3RhY2subGVuZ3RoICkge1xuICAgICAgbWF0My5jb3B5KCB0aGlzLl9zdGFja1sgdGhpcy5faW5kZXggXSwgdGhpcy5tYXRyaXggKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RhY2sucHVzaCggbWF0My5jbG9uZSggdGhpcy5tYXRyaXggKSApO1xuICAgIH1cbiAgfSxcblxuICByZXN0b3JlOiBmdW5jdGlvbiByZXN0b3JlICgpXG4gIHtcbiAgICBpZiAoIHRoaXMuX2luZGV4ID49IDAgKSB7XG4gICAgICBtYXQzLmNvcHkoIHRoaXMubWF0cml4LCB0aGlzLl9zdGFja1sgdGhpcy5faW5kZXgtLSBdICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hdDMuc2V0SWRlbnRpdHkoIHRoaXMubWF0cml4ICk7XG4gICAgfVxuICB9LFxuXG4gIHNldFRyYW5zZm9ybTogZnVuY3Rpb24gc2V0VHJhbnNmb3JtICggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxuICB7XG4gICAgbWF0My5zZXRUcmFuc2Zvcm0oIHRoaXMubWF0cml4LCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApO1xuICB9LFxuXG4gIHRyYW5zbGF0ZTogZnVuY3Rpb24gdHJhbnNsYXRlICggeCwgeSApXG4gIHtcbiAgICBtYXQzLnRyYW5zbGF0ZSggdGhpcy5tYXRyaXgsIHgsIHkgKTtcbiAgfSxcblxuICByb3RhdGU6IGZ1bmN0aW9uIHJvdGF0ZSAoIGFuZ2xlIClcbiAge1xuICAgIG1hdDMucm90YXRlKCB0aGlzLm1hdHJpeCwgYW5nbGUgKTtcbiAgfSxcblxuICBzY2FsZTogZnVuY3Rpb24gc2NhbGUgKCB4LCB5IClcbiAge1xuICAgIG1hdDMuc2NhbGUoIHRoaXMubWF0cml4LCB4LCB5ICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCf0YDQuNC80LXQvdGP0LXRgiBcInRyYW5zZm9ybWF0aW9uIG1hdHJpeFwiINC40Lcg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNGFINC/0LDRgNCw0LzQtdGC0YDQvtCyINC90LAg0YLQtdC60YPRidC40LkgXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIi5cbiAgICogQG1ldGhvZCB2Ni5UcmFuc2Zvcm0jdHJhbnNmb3JtXG4gICAqIEBwYXJhbSAge251bWJlcn0gIG0xMSBYIHNjYWxlLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMTIgWCBza2V3LlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMjEgWSBza2V3LlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMjIgWSBzY2FsZS5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgZHggIFggdHJhbnNsYXRlLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBkeSAgWSB0cmFuc2xhdGUuXG4gICAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGVcbiAgICogLy8gQXBwbHkgc2NhbGVkIHR3aWNlIFwidHJhbnNmb3JtYXRpb24gbWF0cml4XCIuXG4gICAqIHRyYW5zZm9ybS50cmFuc2Zvcm0oIDIsIDAsIDAsIDIsIDAsIDAgKTtcbiAgICovXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24gdHJhbnNmb3JtICggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxuICB7XG4gICAgbWF0My50cmFuc2Zvcm0oIHRoaXMubWF0cml4LCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBUcmFuc2Zvcm1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCAncGVha28vZGVmYXVsdHMnICk7XG52YXIgbWl4aW4gICAgPSByZXF1aXJlKCAncGVha28vbWl4aW4nICk7XG5cbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICcuL3NldHRpbmdzJyApO1xuXG4vKipcbiAqINCa0LvQsNGB0YEg0LrQsNC80LXRgNGLLiDQrdGC0L7RgiDQutC70LDRgdGBINGD0LTQvtCx0LXQvSDQtNC70Y8g0YHQvtC30LTQsNC90LjRjyDQutCw0LzQtdGA0YssINC60L7RgtC+0YDQsNGPINC00L7Qu9C20L3QsCDQsdGL0YLRjFxuICog0L3QsNC/0YDQsNCy0LvQtdC90L3QsCDQvdCwINC+0L/RgNC10LTQtdC70LXQvdC90YvQuSDQvtCx0YrQtdC60YIg0LIg0L/RgNC40LvQvtC20LXQvdC40LgsINC90LDQv9GA0LjQvNC10YA6INC90LAg0LzQsNGI0LjQvdGDINCyXG4gKiDQs9C+0L3QvtGH0L3QvtC5INC40LPRgNC1LiDQmtCw0LzQtdGA0LAg0LHRg9C00LXRgiDRgdCw0LzQsCDQv9C70LDQstC90L4g0Lgg0YEg0LDQvdC40LzQsNGG0LjQtdC5INC90LDQv9GA0LDQstC70Y/RgtGM0YHRjyDQvdCwINC90YPQttC90YvQuVxuICog0L7QsdGK0LXQutGCLlxuICogQGNvbnN0cnVjdG9yIHY2LkNhbWVyYVxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgICAgICAgICBbb3B0aW9uc10gICAgICAgICAg0J/QsNGA0LDQvNC10YLRgNGLINC00LvRjyDRgdC+0LfQtNCw0L3QuNGPINC60LDQvNC10YDRiywg0YHQvNC+0YLRgNC40YLQtSB7QGxpbmsgdjYuc2V0dGluZ3MuY2FtZXJhfS5cbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RSZW5kZXJlcn0gW29wdGlvbnMucmVuZGVyZXJdINCg0LXQvdC00LXRgNC10YAuXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5SZXF1aXJlIFwidjYuQ2FtZXJhXCI8L2NhcHRpb24+XG4gKiB2YXIgQ2FtZXJhID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY2FtZXJhL0NhbWVyYScgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhbiBpbnN0YW5jZTwvY2FwdGlvbj5cbiAqIHZhciBjYW1lcmEgPSBuZXcgQ2FtZXJhKCk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGUgYW4gaW5zdGFuY2Ugd2l0aCBvcHRpb25zPC9jYXB0aW9uPlxuICogdmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEoIHtcbiAqICAgc2V0dGluZ3M6IHtcbiAqICAgICBzcGVlZDoge1xuICogICAgICAgeDogMC4xNSxcbiAqICAgICAgIHk6IDAuMTVcbiAqICAgICB9XG4gKiAgIH1cbiAqIH0gKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhbiBpbnN0YW5jZSB3aXRoIHJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEoIHtcbiAqICAgcmVuZGVyZXI6IHJlbmRlcmVyXG4gKiB9ICk7XG4gKi9cbmZ1bmN0aW9uIENhbWVyYSAoIG9wdGlvbnMgKVxue1xuICBvcHRpb25zID0gZGVmYXVsdHMoIHNldHRpbmdzLCBvcHRpb25zICk7XG5cbiAgLyoqXG4gICAqINCd0LDRgdGC0YDQvtC50LrQuCDQutCw0LzQtdGA0YssINGC0LDQutC40LUg0LrQsNC6INGB0LrQvtGA0L7RgdGC0Ywg0LDQvdC40LzQsNGG0LjQuCDQuNC70Lgg0LzQsNGB0YjRgtCw0LEuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuQ2FtZXJhI3NldHRpbmdzXG4gICAqL1xuICB0aGlzLnNldHRpbmdzID0gb3B0aW9ucy5zZXR0aW5ncztcblxuICAvKipcbiAgICog0KDQtdC90LTQtdGA0LXRgC5cbiAgICogQG1lbWJlciB7djYuQWJzdHJhY3RSZW5kZXJlcnx2b2lkfSB2Ni5DYW1lcmEjcmVuZGVyZXJcbiAgICovXG5cbiAgaWYgKCBvcHRpb25zLnJlbmRlcmVyICkge1xuICAgIHRoaXMucmVuZGVyZXIgPSBvcHRpb25zLnJlbmRlcmVyO1xuICB9XG5cbiAgLyoqXG4gICAqINCe0LHRitC10LrRgiwg0L3QsCDQutC+0YLQvtGA0YvQuSDQvdCw0L/RgNCw0LLQu9C10L3QsCDQutCw0LzQtdGA0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge29iamVjdD99IHY2LkNhbWVyYSNfb2JqZWN0XG4gICAqIEBzZWUgdjYuQ2FtZXJhI2xvb2tBdFxuICAgKi9cbiAgdGhpcy5fb2JqZWN0ID0gbnVsbDtcblxuICAvKipcbiAgICog0KHQstC+0LnRgdGC0LLQviwg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0LHRgNCw0YLRjCDQuNC3IHtAbGluayB2Ni5DYW1lcmEjX29iamVjdH0uXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge3N0cmluZz99IHY2LkNhbWVyYSNfa2V5XG4gICAqIEBzZWUgdjYuQ2FtZXJhI2xvb2tBdFxuICAgKi9cbiAgdGhpcy5fa2V5ID0gbnVsbDtcbn1cblxuQ2FtZXJhLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC+0LHRitC10LrRgiwg0L3QsCDQutC+0YLQvtGA0YvQuSDQutCw0LzQtdGA0LAg0LTQvtC70LbQvdCwINCx0YvRgtGMINC90LDQv9GA0LDQstC70LXQvdCwLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNfZ2V0T2JqZWN0XG4gICAqIEByZXR1cm4ge0lWZWN0b3IyRD99INCe0LHRitC10LrRgiDQuNC70LggXCJudWxsXCIuXG4gICAqL1xuICBfZ2V0T2JqZWN0OiBmdW5jdGlvbiBfZ2V0T2JqZWN0ICgpXG4gIHtcbiAgICBpZiAoIHRoaXMuX2tleSA9PT0gbnVsbCApIHtcbiAgICAgIHJldHVybiB0aGlzLl9vYmplY3Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX29iamVjdFsgdGhpcy5fa2V5IF07XG4gIH0sXG5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINC90LDRgdGC0YDQvtC50LrQuC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjc2V0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZXR0aW5nINCY0LzRjyDQvdCw0YHRgtGA0L7QudC60Lg6IFwiem9vbS1pbiBzcGVlZFwiLCBcInpvb20tb3V0IHNwZWVkXCIsIFwiem9vbVwiLlxuICAgKiBAcGFyYW0ge2FueX0gICAgdmFsdWUgICDQndC+0LLQvtC1INC30L3QsNGH0LXQvdC40LUg0L3QsNGB0YLRgNC+0LnQutC4LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCB6b29tLWluIHNwZWVkIHNldHRpbmcgdG8gMC4wMDI1IHdpdGggbGluZWFyIGZsYWcuXG4gICAqIGNhbWVyYS5zZXQoICd6b29tLWluIHNwZWVkJywgeyB2YWx1ZTogMC4wMDI1LCBsaW5lYXI6IHRydWUgfSApO1xuICAgKiAvLyBUdXJuIG9mZiBsaW5lYXIgZmxhZy5cbiAgICogY2FtZXJhLnNldCggJ3pvb20taW4gc3BlZWQnLCB7IGxpbmVhcjogZmFsc2UgfSApO1xuICAgKiAvLyBTZXQgem9vbSBzZXR0aW5nIHRvIDEgd2l0aCByYW5nZSBbIDAuNzUgLi4gMS4xMjUgXS5cbiAgICogY2FtZXJhLnNldCggJ3pvb20nLCB7IHZhbHVlOiAxLCBtaW46IDAuNzUsIG1heDogMS4xMjUgfSApO1xuICAgKiAvLyBTZXQgY2FtZXJhIHNwZWVkLlxuICAgKiBjYW1lcmEuc2V0KCAnc3BlZWQnLCB7IHg6IDAuMSwgeTogMC4xIH0gKTtcbiAgICovXG4gIHNldDogZnVuY3Rpb24gc2V0ICggc2V0dGluZywgdmFsdWUgKVxuICB7XG4gICAgc3dpdGNoICggc2V0dGluZyApIHtcbiAgICAgIGNhc2UgJ3pvb20tb3V0IHNwZWVkJzpcbiAgICAgIGNhc2UgJ3pvb20taW4gc3BlZWQnOlxuICAgICAgY2FzZSAnc3BlZWQnOlxuICAgICAgY2FzZSAnem9vbSc6XG4gICAgICAgIG1peGluKCB0aGlzLnNldHRpbmdzWyBzZXR0aW5nIF0sIHZhbHVlICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBzZXR0aW5nIG5hbWU6ICcgKyBzZXR0aW5nICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCd0LDQv9GA0LDQstC70Y/QtdGCINC60LDQvNC10YDRgyDQvdCwINC+0L/RgNC10LTQtdC70LXQvdC90YPRjiDQv9C+0LfQuNGG0LjRjiAoYFwib2JqZWN0XCJgKS5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjbG9va0F0XG4gICAqIEBwYXJhbSB7SVZlY3RvcjJEfSBvYmplY3Qg0J/QvtC30LjRhtC40Y8sINCyINC60L7RgtC+0YDRg9GOINC00L7Qu9C20L3QsCDRgdC80L7RgtGA0LXRgtGMINC60LDQvNC10YDQsC5cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgW2tleV0gICDQodCy0L7QudGB0YLQstC+LCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDQsdGA0LDRgtGMINC40LcgYG9iamVjdGAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gQW4gb2JqZWN0LlxuICAgKiB2YXIgY2FyID0ge1xuICAgKiAgIHBvc2l0aW9uOiB7XG4gICAqICAgICB4OiA0LFxuICAgKiAgICAgeTogMlxuICAgKiAgIH1cbiAgICogfTtcbiAgICogLy8gRGlyZWN0IGEgY2FtZXJhIG9uIHRoZSBjYXIuXG4gICAqIGNhbWVyYS5sb29rQXQoIGNhciwgJ3Bvc2l0aW9uJyApO1xuICAgKiAvLyBUaGlzIHdheSB3b3JrcyB0b28gYnV0IGlmIHRoZSAncG9zaXRpb24nIHdpbGwgYmUgcmVwbGFjZWQgaXQgd291bGQgbm90IHdvcmsuXG4gICAqIGNhbWVyYS5sb29rQXQoIGNhci5wb3NpdGlvbiApO1xuICAgKi9cbiAgbG9va0F0OiBmdW5jdGlvbiBsb29rQXQgKCBvYmplY3QsIGtleSApXG4gIHtcbiAgICB0aGlzLl9vYmplY3QgPSBvYmplY3Q7XG5cbiAgICBpZiAoIHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgdGhpcy5fa2V5ID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fa2V5ID0ga2V5O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQv9C+0LfQuNGG0LjRjiwg0L3QsCDQutC+0YLQvtGA0YPRjiDQutCw0LzQtdGA0LAg0LTQvtC70LbQvdCwINCx0YvRgtGMINC90LDQv9GA0LDQstC70LXQvdCwLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNzaG91bGRMb29rQXRcbiAgICogQHJldHVybiB7SVZlY3RvcjJEfSDQn9C+0LfQuNGG0LjRjy5cbiAgICogQGV4YW1wbGVcbiAgICogdmFyIG9iamVjdCA9IHtcbiAgICogICBwb3NpdGlvbjoge1xuICAgKiAgICAgeDogNCxcbiAgICogICAgIHk6IDJcbiAgICogICB9XG4gICAqIH07XG4gICAqXG4gICAqIGNhbWVyYS5sb29rQXQoIG9iamVjdCwgJ3Bvc2l0aW9uJyApLnNob3VsZExvb2tBdCgpOyAvLyAtPiB7IHg6IDQsIHk6IDIgfSAoY2xvbmUgb2YgXCJvYmplY3QucG9zaXRpb25cIikuXG4gICAqL1xuICBzaG91bGRMb29rQXQ6IGZ1bmN0aW9uIHNob3VsZExvb2tBdCAoKVxuICB7XG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5fZ2V0T2JqZWN0KCk7XG5cbiAgICBpZiAoIHBvc2l0aW9uID09PSBudWxsICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogcG9zaXRpb24ueCxcbiAgICAgIHk6IHBvc2l0aW9uLnlcbiAgICB9O1xuICB9LFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb25zdHJ1Y3RvcjogQ2FtZXJhXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQodGC0LDQvdC00LDRgNGC0L3Ri9C1INC90LDRgdGC0YDQvtC50LrQuCDQutCw0LzQtdGA0YsuXG4gKiBAbmFtZXNwYWNlIHY2LnNldHRpbmdzLmNhbWVyYVxuICogQGV4YW1wbGVcbiAqIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2NhbWVyYS9zZXR0aW5ncycgKTtcbiAqL1xuXG4vKipcbiAqINCh0YLQsNC90LTQsNGA0YLQvdGL0LUg0L3QsNGB0YLRgNC+0LnQutC4INC60LDQvNC10YDRiy5cbiAqIEBtZW1iZXIge29iamVjdH0gdjYuc2V0dGluZ3MuY2FtZXJhLnNldHRpbmdzXG4gKiBAcHJvcGVydHkge29iamVjdH0gIFsnem9vbS1vdXQgc3BlZWQnXVxuICogQHByb3BlcnR5IHtudW1iZXJ9ICBbJ3pvb20tb3V0IHNwZWVkJy52YWx1ZT0xXVxuICogQHByb3BlcnR5IHtib29sZWFufSBbJ3pvb20tb3V0IHNwZWVkJy5saW5lYXI9dHJ1ZV1cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAgWyd6b29tLWluIHNwZWVkJ11cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgWyd6b29tLWluIHNwZWVkJy52YWx1ZT0xXVxuICogQHByb3BlcnR5IHtib29sZWFufSBbJ3pvb20taW4gc3BlZWQnLmxpbmVhcj10cnVlXVxuICogQHByb3BlcnR5IHtvYmplY3R9ICBbJ3pvb20nXVxuICogQHByb3BlcnR5IHtudW1iZXJ9ICBbJ3pvb20nLnZhbHVlPTFdXG4gKiBAcHJvcGVydHkge251bWJlcn0gIFsnem9vbScubWluPTFdXG4gKiBAcHJvcGVydHkge251bWJlcn0gIFsnem9vbScubWF4PTFdXG4gKiBAcHJvcGVydHkge29iamVjdH0gIFsnc3BlZWQnXVxuICogQHByb3BlcnR5IHtudW1iZXJ9ICBbJ3NwZWVkJy54PTFdXG4gKiBAcHJvcGVydHkge251bWJlcn0gIFsnc3BlZWQnLnk9MV1cbiAqL1xuZXhwb3J0cy5zZXR0aW5ncyA9IHtcbiAgJ3pvb20tb3V0IHNwZWVkJzoge1xuICAgIHZhbHVlOiAgMSxcbiAgICBsaW5lYXI6IHRydWVcbiAgfSxcblxuICAnem9vbS1pbiBzcGVlZCc6IHtcbiAgICB2YWx1ZTogIDEsXG4gICAgbGluZWFyOiB0cnVlXG4gIH0sXG5cbiAgJ3pvb20nOiB7XG4gICAgdmFsdWU6IDEsXG4gICAgbWluOiAgIDEsXG4gICAgbWF4OiAgIDFcbiAgfSxcblxuICAnc3BlZWQnOiB7XG4gICAgeDogMSxcbiAgICB5OiAxXG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gSFNMQTtcblxudmFyIGNsYW1wID0gcmVxdWlyZSggJ3BlYWtvL2NsYW1wJyApOyAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxudmFyIHBhcnNlID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcGFyc2UnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxudmFyIFJHQkEgID0gcmVxdWlyZSggJy4vUkdCQScgKTsgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuLyoqXG4gKiBIU0xBINGG0LLQtdGCLlxuICogQGNvbnN0cnVjdG9yIHY2LkhTTEFcbiAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW2hdIEh1ZSB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW3NdIFNhdHVyYXRpb24gdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtsXSBMaWdodG5lc3MgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSB2YWx1ZS5cbiAqIEBzZWUgdjYuSFNMQSNzZXRcbiAqIEBleGFtcGxlXG4gKiB2YXIgSFNMQSA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2NvbG9yL0hTTEEnICk7XG4gKlxuICogdmFyIHRyYW5zcGFyZW50ID0gbmV3IEhTTEEoICd0cmFuc3BhcmVudCcgKTtcbiAqIHZhciBtYWdlbnRhICAgICA9IG5ldyBIU0xBKCAnbWFnZW50YScgKTtcbiAqIHZhciBmdWNoc2lhICAgICA9IG5ldyBIU0xBKCAzMDAsIDEwMCwgNTAgKTtcbiAqIHZhciBnaG9zdCAgICAgICA9IG5ldyBIU0xBKCAxMDAsIDAuMSApO1xuICogdmFyIHdoaXRlICAgICAgID0gbmV3IEhTTEEoIDEwMCApO1xuICogdmFyIGJsYWNrICAgICAgID0gbmV3IEhTTEEoKTtcbiAqL1xuZnVuY3Rpb24gSFNMQSAoIGgsIHMsIGwsIGEgKVxue1xuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzAgXCJodWVcIiB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSFNMQSMxIFwic2F0dXJhdGlvblwiIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzIgXCJsaWdodG5lc3NcIiB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSFNMQSMzIFwiYWxwaGFcIiB2YWx1ZS5cbiAgICovXG5cbiAgdGhpcy5zZXQoIGgsIHMsIGwsIGEgKTtcbn1cblxuSFNMQS5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQstC+0YHQv9GA0LjQvdC40LzQsNC10LzRg9GOINGP0YDQutC+0YHRgtGMIChwZXJjZWl2ZWQgYnJpZ2h0bmVzcykg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI3BlcmNlaXZlZEJyaWdodG5lc3NcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggJ21hZ2VudGEnICkucGVyY2VpdmVkQnJpZ2h0bmVzcygpOyAvLyAtPiAxNjMuODc1OTQzOTMzMjA4MlxuICAgKi9cbiAgcGVyY2VpdmVkQnJpZ2h0bmVzczogZnVuY3Rpb24gcGVyY2VpdmVkQnJpZ2h0bmVzcyAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLnBlcmNlaXZlZEJyaWdodG5lc3MoKTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0L7RgtC90L7RgdC40YLQtdC70YzQvdGD0Y4g0Y/RgNC60L7RgdGC0Ywg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI2x1bWluYW5jZVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUmVsYXRpdmVfbHVtaW5hbmNlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5sdW1pbmFuY2UoKTsgLy8gLT4gNzIuNjI0XG4gICAqL1xuICBsdW1pbmFuY2U6IGZ1bmN0aW9uIGx1bWluYW5jZSAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLmx1bWluYW5jZSgpO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjYnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL0FFUlQvI2NvbG9yLWNvbnRyYXN0XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5icmlnaHRuZXNzKCk7IC8vIC0+IDEwNS4zMTVcbiAgICovXG4gIGJyaWdodG5lc3M6IGZ1bmN0aW9uIGJyaWdodG5lc3MgKClcbiAge1xuICAgIHJldHVybiB0aGlzLnJnYmEoKS5icmlnaHRuZXNzKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIENTUy1jb2xvciDRgdGC0YDQvtC60YMuXG4gICAqIEBtZXRob2QgdjYuSFNMQSN0b1N0cmluZ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBleGFtcGxlXG4gICAqICcnICsgbmV3IEhTTEEoICdyZWQnICk7IC8vIC0+IFwiaHNsYSgwLCAxMDAlLCA1MCUsIDEpXCJcbiAgICovXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiB0b1N0cmluZyAoKVxuICB7XG4gICAgcmV0dXJuICdoc2xhKCcgKyB0aGlzWyAwIF0gKyAnLCAnICsgdGhpc1sgMSBdICsgJ1xcdTAwMjUsICcgKyB0aGlzWyAyIF0gKyAnXFx1MDAyNSwgJyArIHRoaXNbIDMgXSArICcpJztcbiAgfSxcblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgSCwgUywgTCwgQSDQt9C90LDRh9C10L3QuNGPLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjc2V0XG4gICAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW2hdIEh1ZSB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbc10gU2F0dXJhdGlvbiB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbbF0gTGlnaHRuZXNzIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSB2YWx1ZS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LkhTTEFcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoKS5zZXQoIDEwMCwgMC41ICk7IC8vIC0+IDAsIDAsIDEwMCwgMC41XG4gICAqL1xuICBzZXQ6IGZ1bmN0aW9uIHNldCAoIGgsIHMsIGwsIGEgKVxuICB7XG4gICAgc3dpdGNoICggdHJ1ZSApIHtcbiAgICAgIGNhc2UgdHlwZW9mIGggPT09ICdzdHJpbmcnOlxuICAgICAgICBoID0gcGFyc2UoIGggKTtcbiAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgY2FzZSB0eXBlb2YgaCA9PT0gJ29iamVjdCcgJiYgaCAhPT0gbnVsbDpcbiAgICAgICAgaWYgKCBoLnR5cGUgIT09IHRoaXMudHlwZSApIHtcbiAgICAgICAgICBoID0gaFsgdGhpcy50eXBlIF0oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IGhbIDAgXTtcbiAgICAgICAgdGhpc1sgMSBdID0gaFsgMSBdO1xuICAgICAgICB0aGlzWyAyIF0gPSBoWyAyIF07XG4gICAgICAgIHRoaXNbIDMgXSA9IGhbIDMgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBzd2l0Y2ggKCB2b2lkIDAgKSB7XG4gICAgICAgICAgY2FzZSBoOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBsID0gcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBzOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBsID0gTWF0aC5mbG9vciggaCApO1xuICAgICAgICAgICAgcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBsOlxuICAgICAgICAgICAgYSA9IHM7XG4gICAgICAgICAgICBsID0gTWF0aC5mbG9vciggaCApO1xuICAgICAgICAgICAgcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBhOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGggPSBNYXRoLmZsb29yKCBoICk7XG4gICAgICAgICAgICBzID0gTWF0aC5mbG9vciggcyApO1xuICAgICAgICAgICAgbCA9IE1hdGguZmxvb3IoIGwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IGg7XG4gICAgICAgIHRoaXNbIDEgXSA9IHM7XG4gICAgICAgIHRoaXNbIDIgXSA9IGw7XG4gICAgICAgIHRoaXNbIDMgXSA9IGE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCa0L7QvdCy0LXRgNGC0LjRgNGD0LXRgiDQsiB7QGxpbmsgdjYuUkdCQX0uXG4gICAqIEBtZXRob2QgdjYuSFNMQSNyZ2JhXG4gICAqIEByZXR1cm4ge3Y2LlJHQkF9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5yZ2JhKCk7IC8vIC0+IG5ldyBSR0JBKCAyNTUsIDAsIDI1NSwgMSApXG4gICAqL1xuICByZ2JhOiBmdW5jdGlvbiByZ2JhICgpXG4gIHtcbiAgICB2YXIgcmdiYSA9IG5ldyBSR0JBKCk7XG5cbiAgICB2YXIgaCA9IHRoaXNbIDAgXSAlIDM2MCAvIDM2MDtcbiAgICB2YXIgcyA9IHRoaXNbIDEgXSAqIDAuMDE7XG4gICAgdmFyIGwgPSB0aGlzWyAyIF0gKiAwLjAxO1xuXG4gICAgdmFyIHRyID0gaCArIDEgLyAzO1xuICAgIHZhciB0ZyA9IGg7XG4gICAgdmFyIHRiID0gaCAtIDEgLyAzO1xuXG4gICAgdmFyIHE7XG5cbiAgICBpZiAoIGwgPCAwLjUgKSB7XG4gICAgICBxID0gbCAqICggMSArIHMgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcSA9IGwgKyBzIC0gbCAqIHM7XG4gICAgfVxuXG4gICAgdmFyIHAgPSAyICogbCAtIHE7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuICAgIGlmICggdHIgPCAwICkge1xuICAgICAgKyt0cjtcbiAgICB9XG5cbiAgICBpZiAoIHRnIDwgMCApIHtcbiAgICAgICsrdGc7XG4gICAgfVxuXG4gICAgaWYgKCB0YiA8IDAgKSB7XG4gICAgICArK3RiO1xuICAgIH1cblxuICAgIGlmICggdHIgPiAxICkge1xuICAgICAgLS10cjtcbiAgICB9XG5cbiAgICBpZiAoIHRnID4gMSApIHtcbiAgICAgIC0tdGc7XG4gICAgfVxuXG4gICAgaWYgKCB0YiA+IDEgKSB7XG4gICAgICAtLXRiO1xuICAgIH1cblxuICAgIHJnYmFbIDAgXSA9IGZvbyggdHIsIHAsIHEgKTtcbiAgICByZ2JhWyAxIF0gPSBmb28oIHRnLCBwLCBxICk7XG4gICAgcmdiYVsgMiBdID0gZm9vKCB0YiwgcCwgcSApO1xuICAgIHJnYmFbIDMgXSA9IHRoaXNbIDMgXTtcblxuICAgIHJldHVybiByZ2JhO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5IU0xBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjbGVycFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBoXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHNcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgbFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB2YWx1ZVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAc2VlIHY2LkhTTEEjbGVycENvbG9yXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCA1MCwgMC4yNSApLmxlcnAoIDAsIDAsIDEwMCwgMC41ICk7IC8vIC0+IG5ldyBIU0xBKCAwLCAwLCA3NSwgMC4yNSApXG4gICAqL1xuICBsZXJwOiBmdW5jdGlvbiBsZXJwICggaCwgcywgbCwgdmFsdWUgKVxuICB7XG4gICAgdmFyIGNvbG9yID0gbmV3IEhTTEEoKTtcbiAgICBjb2xvclsgMCBdID0gaDtcbiAgICBjb2xvclsgMSBdID0gcztcbiAgICBjb2xvclsgMiBdID0gbDtcbiAgICByZXR1cm4gdGhpcy5sZXJwQ29sb3IoIGNvbG9yLCB2YWx1ZSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5IU0xBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyBgY29sb3JgLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjbGVycENvbG9yXG4gICAqIEBwYXJhbSAge1RDb2xvcn0gIGNvbG9yXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHZhbHVlXG4gICAqIEByZXR1cm4ge3Y2LkhTTEF9XG4gICAqIEBzZWUgdjYuSFNMQSNsZXJwXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBhID0gbmV3IEhTTEEoIDUwLCAwLjI1ICk7XG4gICAqIHZhciBiID0gbmV3IEhTTEEoIDEwMCwgMCApO1xuICAgKiB2YXIgYyA9IGEubGVycENvbG9yKCBiLCAwLjUgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDAsIDc1LCAwLjI1IClcbiAgICovXG4gIGxlcnBDb2xvcjogZnVuY3Rpb24gbGVycENvbG9yICggY29sb3IsIHZhbHVlIClcbiAge1xuICAgIHJldHVybiB0aGlzLnJnYmEoKS5sZXJwQ29sb3IoIGNvbG9yLCB2YWx1ZSApLmhzbGEoKTtcbiAgfSxcblxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSB7QGxpbmsgdjYuSFNMQX0gLSDQt9Cw0YLQtdC80L3QtdC90L3Ri9C5INC40LvQuCDQt9Cw0YHQstC10YLQu9C10L3QvdGL0Lkg0L3QsCBgcGVyY2VudGFnZWAg0L/RgNC+0YbQtdC90YLQvtCyLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjc2hhZGVcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgcGVyY2VudGFnZVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggMCwgMTAwLCA3NSwgMSApLnNoYWRlKCAtMTAgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDEwMCwgNjUsIDEgKVxuICAgKi9cbiAgc2hhZGU6IGZ1bmN0aW9uIHNoYWRlICggcGVyY2VudGFnZSApXG4gIHtcbiAgICB2YXIgaHNsYSA9IG5ldyBIU0xBKCk7XG4gICAgaHNsYVsgMCBdID0gdGhpc1sgMCBdO1xuICAgIGhzbGFbIDEgXSA9IHRoaXNbIDEgXTtcbiAgICBoc2xhWyAyIF0gPSBjbGFtcCggdGhpc1sgMiBdICsgcGVyY2VudGFnZSwgMCwgMTAwICk7XG4gICAgaHNsYVsgMyBdID0gdGhpc1sgMyBdO1xuICAgIHJldHVybiBoc2xhO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBIU0xBXG59O1xuXG4vKipcbiAqIEBtZW1iZXIge3N0cmluZ30gdjYuSFNMQSN0eXBlIGBcImhzbGFcImAuINCt0YLQviDRgdCy0L7QudGB0YLQstC+INC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0LrQvtC90LLQtdGA0YLQuNGA0L7QstCw0L3QuNGPINC80LXQttC00YMge0BsaW5rIHY2LlJHQkF9INC4IHtAbGluayB2Ni5IU0xBfS5cbiAqL1xuSFNMQS5wcm90b3R5cGUudHlwZSA9ICdoc2xhJztcblxuZnVuY3Rpb24gZm9vICggdCwgcCwgcSApXG57XG4gIGlmICggdCA8IDEgLyA2ICkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCAoIHAgKyAoIHEgLSBwICkgKiA2ICogdCApICogMjU1ICk7XG4gIH1cblxuICBpZiAoIHQgPCAwLjUgKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoIHEgKiAyNTUgKTtcbiAgfVxuXG4gIGlmICggdCA8IDIgLyAzICkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCAoIHAgKyAoIHEgLSBwICkgKiAoIDIgLyAzIC0gdCApICogNiApICogMjU1ICk7XG4gIH1cblxuICByZXR1cm4gTWF0aC5yb3VuZCggcCAqIDI1NSApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJHQkE7XG5cbnZhciBwYXJzZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3BhcnNlJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbnZhciBIU0xBICA9IHJlcXVpcmUoICcuL0hTTEEnICk7ICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbi8qKlxuICogUkdCQSDRhtCy0LXRgi5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5SR0JBXG4gKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXSBSZWQgY2hhbm5lbCB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2ddIEdyZWVuIGNoYW5uZWwgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtiXSBCbHVlIGNoYW5uZWwgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSBjaGFubmVsIHZhbHVlLlxuICogQHNlZSB2Ni5SR0JBI3NldFxuICogQGV4YW1wbGVcbiAqIHZhciBSR0JBID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29sb3IvUkdCQScgKTtcbiAqXG4gKiB2YXIgdHJhbnNwYXJlbnQgPSBuZXcgUkdCQSggJ3RyYW5zcGFyZW50JyApO1xuICogdmFyIG1hZ2VudGEgICAgID0gbmV3IFJHQkEoICdtYWdlbnRhJyApO1xuICogdmFyIGZ1Y2hzaWEgICAgID0gbmV3IFJHQkEoIDI1NSwgMCwgMjU1ICk7XG4gKiB2YXIgZ2hvc3QgICAgICAgPSBuZXcgUkdCQSggMjU1LCAwLjEgKTtcbiAqIHZhciB3aGl0ZSAgICAgICA9IG5ldyBSR0JBKCAyNTUgKTtcbiAqIHZhciBibGFjayAgICAgICA9IG5ldyBSR0JBKCk7XG4gKi9cbmZ1bmN0aW9uIFJHQkEgKCByLCBnLCBiLCBhIClcbntcbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMwIFwicmVkXCIgY2hhbm5lbCB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMxIFwiZ3JlZW5cIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5SR0JBIzIgXCJibHVlXCIgY2hhbm5lbCB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMzIFwiYWxwaGFcIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICB0aGlzLnNldCggciwgZywgYiwgYSApO1xufVxuXG5SR0JBLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINCy0L7RgdC/0YDQuNC90LjQvNCw0LXQvNGD0Y4g0Y/RgNC60L7RgdGC0YwgKHBlcmNlaXZlZCBicmlnaHRuZXNzKSDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjcGVyY2VpdmVkQnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzU5NjI0M1xuICAgKiBAc2VlIGh0dHA6Ly9hbGllbnJ5ZGVyZmxleC5jb20vaHNwLmh0bWxcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoICdtYWdlbnRhJyApLnBlcmNlaXZlZEJyaWdodG5lc3MoKTsgLy8gLT4gMTYzLjg3NTk0MzkzMzIwODJcbiAgICovXG4gIHBlcmNlaXZlZEJyaWdodG5lc3M6IGZ1bmN0aW9uIHBlcmNlaXZlZEJyaWdodG5lc3MgKClcbiAge1xuICAgIHZhciByID0gdGhpc1sgMCBdO1xuICAgIHZhciBnID0gdGhpc1sgMSBdO1xuICAgIHZhciBiID0gdGhpc1sgMiBdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoIDAuMjk5ICogciAqIHIgKyAwLjU4NyAqIGcgKiBnICsgMC4xMTQgKiBiICogYiApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQvtGC0L3QvtGB0LjRgtC10LvRjNC90YPRjiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjbHVtaW5hbmNlXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SZWxhdGl2ZV9sdW1pbmFuY2VcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoICdtYWdlbnRhJyApLmx1bWluYW5jZSgpOyAvLyAtPiA3Mi42MjRcbiAgICovXG4gIGx1bWluYW5jZTogZnVuY3Rpb24gbHVtaW5hbmNlICgpXG4gIHtcbiAgICByZXR1cm4gdGhpc1sgMCBdICogMC4yMTI2ICsgdGhpc1sgMSBdICogMC43MTUyICsgdGhpc1sgMiBdICogMC4wNzIyO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjYnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL0FFUlQvI2NvbG9yLWNvbnRyYXN0XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAnbWFnZW50YScgKS5icmlnaHRuZXNzKCk7IC8vIC0+IDEwNS4zMTVcbiAgICovXG4gIGJyaWdodG5lc3M6IGZ1bmN0aW9uIGJyaWdodG5lc3MgKClcbiAge1xuICAgIHJldHVybiAwLjI5OSAqIHRoaXNbIDAgXSArIDAuNTg3ICogdGhpc1sgMSBdICsgMC4xMTQgKiB0aGlzWyAyIF07XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIENTUy1jb2xvciDRgdGC0YDQvtC60YMuXG4gICAqIEBtZXRob2QgdjYuUkdCQSN0b1N0cmluZ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBleGFtcGxlXG4gICAqICcnICsgbmV3IFJHQkEoICdtYWdlbnRhJyApOyAvLyAtPiBcInJnYmEoMjU1LCAwLCAyNTUsIDEpXCJcbiAgICovXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiB0b1N0cmluZyAoKVxuICB7XG4gICAgcmV0dXJuICdyZ2JhKCcgKyB0aGlzWyAwIF0gKyAnLCAnICsgdGhpc1sgMSBdICsgJywgJyArIHRoaXNbIDIgXSArICcsICcgKyB0aGlzWyAzIF0gKyAnKSc7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIFIsIEcsIEIsIEEg0LfQvdCw0YfQtdC90LjRjy5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI3NldFxuICAgKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXSBSZWQgY2hhbm5lbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbZ10gR3JlZW4gY2hhbm5lbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbYl0gQmx1ZSBjaGFubmVsIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSBjaGFubmVsIHZhbHVlLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuUkdCQVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSgpXG4gICAqICAgLnNldCggJ21hZ2VudGEnICkgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmZjAwZmZmZicgKSAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmZjAwZmYnICkgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmMDA3JyApICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMCwgMC40N1xuICAgKiAgIC5zZXQoICcjZjAwJyApICAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAyNTUsIDAsIDAsIDFcbiAgICogICAuc2V0KCAnaHNsYSggMCwgMTAwJSwgNTAlLCAwLjQ3ICknICkgLy8gLT4gMjU1LCAwLCAwLCAwLjQ3XG4gICAqICAgLnNldCggJ3JnYiggMCwgMCwgMCApJyApICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDFcbiAgICogICAuc2V0KCAwICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMVxuICAgKiAgIC5zZXQoIDAsIDAsIDAgKSAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAwLCAwLCAwLCAxXG4gICAqICAgLnNldCggMCwgMCApICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDBcbiAgICogICAuc2V0KCAwLCAwLCAwLCAwICk7ICAgICAgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMFxuICAgKi9cbiAgc2V0OiBmdW5jdGlvbiBzZXQgKCByLCBnLCBiLCBhIClcbiAge1xuICAgIHN3aXRjaCAoIHRydWUgKSB7XG4gICAgICBjYXNlIHR5cGVvZiByID09PSAnc3RyaW5nJzpcbiAgICAgICAgciA9IHBhcnNlKCByICk7XG4gICAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgIGNhc2UgdHlwZW9mIHIgPT09ICdvYmplY3QnICYmIHIgIT09IG51bGw6XG4gICAgICAgIGlmICggci50eXBlICE9PSB0aGlzLnR5cGUgKSB7XG4gICAgICAgICAgciA9IHJbIHRoaXMudHlwZSBdKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzWyAwIF0gPSByWyAwIF07XG4gICAgICAgIHRoaXNbIDEgXSA9IHJbIDEgXTtcbiAgICAgICAgdGhpc1sgMiBdID0gclsgMiBdO1xuICAgICAgICB0aGlzWyAzIF0gPSByWyAzIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgc3dpdGNoICggdm9pZCAwICkge1xuICAgICAgICAgIGNhc2UgcjpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgYiA9IGcgPSByID0gMDsgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBnOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBiID0gZyA9IHIgPSBNYXRoLmZsb29yKCByICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGI6XG4gICAgICAgICAgICBhID0gZztcbiAgICAgICAgICAgIGIgPSBnID0gciA9IE1hdGguZmxvb3IoIHIgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgYTpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByID0gTWF0aC5mbG9vciggciApO1xuICAgICAgICAgICAgZyA9IE1hdGguZmxvb3IoIGcgKTtcbiAgICAgICAgICAgIGIgPSBNYXRoLmZsb29yKCBiICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzWyAwIF0gPSByO1xuICAgICAgICB0aGlzWyAxIF0gPSBnO1xuICAgICAgICB0aGlzWyAyIF0gPSBiO1xuICAgICAgICB0aGlzWyAzIF0gPSBhO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQmtC+0L3QstC10YDRgtC40YDRg9C10YIg0LIge0BsaW5rIHY2LkhTTEF9LlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjaHNsYVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSggMjU1LCAwLCAwLCAxICkuaHNsYSgpOyAvLyAtPiBuZXcgSFNMQSggMCwgMTAwLCA1MCwgMSApXG4gICAqL1xuICBoc2xhOiBmdW5jdGlvbiBoc2xhICgpXG4gIHtcbiAgICB2YXIgaHNsYSA9IG5ldyBIU0xBKCk7XG5cbiAgICB2YXIgciA9IHRoaXNbIDAgXSAvIDI1NTtcbiAgICB2YXIgZyA9IHRoaXNbIDEgXSAvIDI1NTtcbiAgICB2YXIgYiA9IHRoaXNbIDIgXSAvIDI1NTtcblxuICAgIHZhciBtYXggPSBNYXRoLm1heCggciwgZywgYiApO1xuICAgIHZhciBtaW4gPSBNYXRoLm1pbiggciwgZywgYiApO1xuXG4gICAgdmFyIGwgPSAoIG1heCArIG1pbiApICogNTA7XG4gICAgdmFyIGgsIHM7XG5cbiAgICB2YXIgZGlmZiA9IG1heCAtIG1pbjtcblxuICAgIGlmICggZGlmZiApIHtcbiAgICAgIGlmICggbCA+IDUwICkge1xuICAgICAgICBzID0gZGlmZiAvICggMiAtIG1heCAtIG1pbiApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcyA9IGRpZmYgLyAoIG1heCArIG1pbiApO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKCBtYXggKSB7XG4gICAgICAgIGNhc2UgcjpcbiAgICAgICAgICBpZiAoIGcgPCBiICkge1xuICAgICAgICAgICAgaCA9IDEuMDQ3MiAqICggZyAtIGIgKSAvIGRpZmYgKyA2LjI4MzI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGggPSAxLjA0NzIgKiAoIGcgLSBiICkgLyBkaWZmO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIGc6XG4gICAgICAgICAgaCA9IDEuMDQ3MiAqICggYiAtIHIgKSAvIGRpZmYgKyAyLjA5NDQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaCA9IDEuMDQ3MiAqICggciAtIGcgKSAvIGRpZmYgKyA0LjE4ODg7XG4gICAgICB9XG5cbiAgICAgIGggPSBNYXRoLnJvdW5kKCBoICogMzYwIC8gNi4yODMyICk7XG4gICAgICBzID0gTWF0aC5yb3VuZCggcyAqIDEwMCApO1xuICAgIH0gZWxzZSB7XG4gICAgICBoID0gcyA9IDA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgfVxuXG4gICAgaHNsYVsgMCBdID0gaDtcbiAgICBoc2xhWyAxIF0gPSBzO1xuICAgIGhzbGFbIDIgXSA9IE1hdGgucm91bmQoIGwgKTtcbiAgICBoc2xhWyAzIF0gPSB0aGlzWyAzIF07XG5cbiAgICByZXR1cm4gaHNsYTtcbiAgfSxcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQG1ldGhvZCB2Ni5SR0JBI3JnYmFcbiAgICogQHNlZSB2Ni5SZW5kZXJlckdMI3ZlcnRpY2VzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHJnYmE6IGZ1bmN0aW9uIHJnYmEgKClcbiAge1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5SR0JBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjbGVycFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICByXG4gICAqIEBwYXJhbSAge251bWJlcn0gIGdcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgYlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB2YWx1ZVxuICAgKiBAcmV0dXJuIHt2Ni5SR0JBfVxuICAgKiBAc2VlIHY2LlJHQkEjbGVycENvbG9yXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAxMDAsIDAuMjUgKS5sZXJwKCAyMDAsIDIwMCwgMjAwLCAwLjUgKTsgLy8gLT4gbmV3IFJHQkEoIDE1MCwgMTUwLCAxNTAsIDAuMjUgKVxuICAgKi9cbiAgbGVycDogZnVuY3Rpb24gbGVycCAoIHIsIGcsIGIsIHZhbHVlIClcbiAge1xuICAgIHIgPSB0aGlzWyAwIF0gKyAoIHIgLSB0aGlzWyAwIF0gKSAqIHZhbHVlO1xuICAgIGcgPSB0aGlzWyAxIF0gKyAoIGcgLSB0aGlzWyAxIF0gKSAqIHZhbHVlO1xuICAgIGIgPSB0aGlzWyAyIF0gKyAoIGIgLSB0aGlzWyAyIF0gKSAqIHZhbHVlO1xuICAgIHJldHVybiBuZXcgUkdCQSggciwgZywgYiwgdGhpc1sgMyBdICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LlJHQkF9IC0g0LjQvdGC0LXRgNC/0L7Qu9C40YDQvtCy0LDQvdC90YvQuSDQvNC10LbQtNGDIGBjb2xvcmAuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNsZXJwQ29sb3JcbiAgICogQHBhcmFtICB7VENvbG9yfSAgY29sb3JcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgdmFsdWVcbiAgICogQHJldHVybiB7djYuUkdCQX1cbiAgICogQHNlZSB2Ni5SR0JBI2xlcnBcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIGEgPSBuZXcgUkdCQSggMTAwLCAwLjI1ICk7XG4gICAqIHZhciBiID0gbmV3IFJHQkEoIDIwMCwgMCApO1xuICAgKiB2YXIgYyA9IGEubGVycENvbG9yKCBiLCAwLjUgKTsgLy8gLT4gbmV3IFJHQkEoIDE1MCwgMTUwLCAxNTAsIDAuMjUgKVxuICAgKi9cbiAgbGVycENvbG9yOiBmdW5jdGlvbiBsZXJwQ29sb3IgKCBjb2xvciwgdmFsdWUgKVxuICB7XG4gICAgdmFyIHIsIGcsIGI7XG5cbiAgICBpZiAoIHR5cGVvZiBjb2xvciAhPT0gJ29iamVjdCcgKSB7XG4gICAgICBjb2xvciA9IHBhcnNlKCBjb2xvciApO1xuICAgIH1cblxuICAgIGlmICggY29sb3IudHlwZSAhPT0gJ3JnYmEnICkge1xuICAgICAgY29sb3IgPSBjb2xvci5yZ2JhKCk7XG4gICAgfVxuXG4gICAgciA9IGNvbG9yWyAwIF07XG4gICAgZyA9IGNvbG9yWyAxIF07XG4gICAgYiA9IGNvbG9yWyAyIF07XG5cbiAgICByZXR1cm4gdGhpcy5sZXJwKCByLCBnLCBiLCB2YWx1ZSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5SR0JBfSAtINC30LDRgtC10LzQvdC10L3QvdGL0Lkg0LjQu9C4INC30LDRgdCy0LXRgtC70LXQvdC90YvQuSDQvdCwIGBwZXJjZW50YWdlc2Ag0L/RgNC+0YbQtdC90YLQvtCyLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjc2hhZGVcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgcGVyY2VudGFnZVxuICAgKiBAcmV0dXJuIHt2Ni5SR0JBfVxuICAgKiBAc2VlIHY2LkhTTEEjc2hhZGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoKS5zaGFkZSggNTAgKTsgLy8gLT4gbmV3IFJHQkEoIDEyOCApXG4gICAqL1xuICBzaGFkZTogZnVuY3Rpb24gc2hhZGUgKCBwZXJjZW50YWdlcyApXG4gIHtcbiAgICByZXR1cm4gdGhpcy5oc2xhKCkuc2hhZGUoIHBlcmNlbnRhZ2VzICkucmdiYSgpO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBSR0JBXG59O1xuXG4vKipcbiAqIEBtZW1iZXIge3N0cmluZ30gdjYuUkdCQSN0eXBlIGBcInJnYmFcImAuINCt0YLQviDRgdCy0L7QudGB0YLQstC+INC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0LrQvtC90LLQtdGA0YLQuNGA0L7QstCw0L3QuNGPINC80LXQttC00YMge0BsaW5rIHY2LkhTTEF9INC4IHtAbGluayB2Ni5SR0JBfS5cbiAqL1xuUkdCQS5wcm90b3R5cGUudHlwZSA9ICdyZ2JhJztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogZXNsaW50IGtleS1zcGFjaW5nOiBbIFwiZXJyb3JcIiwgeyBcImFsaWduXCI6IHsgXCJiZWZvcmVDb2xvblwiOiBmYWxzZSwgXCJhZnRlckNvbG9uXCI6IHRydWUsIFwib25cIjogXCJ2YWx1ZVwiIH0gfSBdICovXG5cbnZhciBjb2xvcnMgPSB7XG4gIGFsaWNlYmx1ZTogICAgICAgICAgICAnZjBmOGZmZmYnLCBhbnRpcXVld2hpdGU6ICAgICAgICAgJ2ZhZWJkN2ZmJyxcbiAgYXF1YTogICAgICAgICAgICAgICAgICcwMGZmZmZmZicsIGFxdWFtYXJpbmU6ICAgICAgICAgICAnN2ZmZmQ0ZmYnLFxuICBhenVyZTogICAgICAgICAgICAgICAgJ2YwZmZmZmZmJywgYmVpZ2U6ICAgICAgICAgICAgICAgICdmNWY1ZGNmZicsXG4gIGJpc3F1ZTogICAgICAgICAgICAgICAnZmZlNGM0ZmYnLCBibGFjazogICAgICAgICAgICAgICAgJzAwMDAwMGZmJyxcbiAgYmxhbmNoZWRhbG1vbmQ6ICAgICAgICdmZmViY2RmZicsIGJsdWU6ICAgICAgICAgICAgICAgICAnMDAwMGZmZmYnLFxuICBibHVldmlvbGV0OiAgICAgICAgICAgJzhhMmJlMmZmJywgYnJvd246ICAgICAgICAgICAgICAgICdhNTJhMmFmZicsXG4gIGJ1cmx5d29vZDogICAgICAgICAgICAnZGViODg3ZmYnLCBjYWRldGJsdWU6ICAgICAgICAgICAgJzVmOWVhMGZmJyxcbiAgY2hhcnRyZXVzZTogICAgICAgICAgICc3ZmZmMDBmZicsIGNob2NvbGF0ZTogICAgICAgICAgICAnZDI2OTFlZmYnLFxuICBjb3JhbDogICAgICAgICAgICAgICAgJ2ZmN2Y1MGZmJywgY29ybmZsb3dlcmJsdWU6ICAgICAgICc2NDk1ZWRmZicsXG4gIGNvcm5zaWxrOiAgICAgICAgICAgICAnZmZmOGRjZmYnLCBjcmltc29uOiAgICAgICAgICAgICAgJ2RjMTQzY2ZmJyxcbiAgY3lhbjogICAgICAgICAgICAgICAgICcwMGZmZmZmZicsIGRhcmtibHVlOiAgICAgICAgICAgICAnMDAwMDhiZmYnLFxuICBkYXJrY3lhbjogICAgICAgICAgICAgJzAwOGI4YmZmJywgZGFya2dvbGRlbnJvZDogICAgICAgICdiODg2MGJmZicsXG4gIGRhcmtncmF5OiAgICAgICAgICAgICAnYTlhOWE5ZmYnLCBkYXJrZ3JlZW46ICAgICAgICAgICAgJzAwNjQwMGZmJyxcbiAgZGFya2toYWtpOiAgICAgICAgICAgICdiZGI3NmJmZicsIGRhcmttYWdlbnRhOiAgICAgICAgICAnOGIwMDhiZmYnLFxuICBkYXJrb2xpdmVncmVlbjogICAgICAgJzU1NmIyZmZmJywgZGFya29yYW5nZTogICAgICAgICAgICdmZjhjMDBmZicsXG4gIGRhcmtvcmNoaWQ6ICAgICAgICAgICAnOTkzMmNjZmYnLCBkYXJrcmVkOiAgICAgICAgICAgICAgJzhiMDAwMGZmJyxcbiAgZGFya3NhbG1vbjogICAgICAgICAgICdlOTk2N2FmZicsIGRhcmtzZWFncmVlbjogICAgICAgICAnOGZiYzhmZmYnLFxuICBkYXJrc2xhdGVibHVlOiAgICAgICAgJzQ4M2Q4YmZmJywgZGFya3NsYXRlZ3JheTogICAgICAgICcyZjRmNGZmZicsXG4gIGRhcmt0dXJxdW9pc2U6ICAgICAgICAnMDBjZWQxZmYnLCBkYXJrdmlvbGV0OiAgICAgICAgICAgJzk0MDBkM2ZmJyxcbiAgZGVlcHBpbms6ICAgICAgICAgICAgICdmZjE0OTNmZicsIGRlZXBza3libHVlOiAgICAgICAgICAnMDBiZmZmZmYnLFxuICBkaW1ncmF5OiAgICAgICAgICAgICAgJzY5Njk2OWZmJywgZG9kZ2VyYmx1ZTogICAgICAgICAgICcxZTkwZmZmZicsXG4gIGZlbGRzcGFyOiAgICAgICAgICAgICAnZDE5Mjc1ZmYnLCBmaXJlYnJpY2s6ICAgICAgICAgICAgJ2IyMjIyMmZmJyxcbiAgZmxvcmFsd2hpdGU6ICAgICAgICAgICdmZmZhZjBmZicsIGZvcmVzdGdyZWVuOiAgICAgICAgICAnMjI4YjIyZmYnLFxuICBmdWNoc2lhOiAgICAgICAgICAgICAgJ2ZmMDBmZmZmJywgZ2FpbnNib3JvOiAgICAgICAgICAgICdkY2RjZGNmZicsXG4gIGdob3N0d2hpdGU6ICAgICAgICAgICAnZjhmOGZmZmYnLCBnb2xkOiAgICAgICAgICAgICAgICAgJ2ZmZDcwMGZmJyxcbiAgZ29sZGVucm9kOiAgICAgICAgICAgICdkYWE1MjBmZicsIGdyYXk6ICAgICAgICAgICAgICAgICAnODA4MDgwZmYnLFxuICBncmVlbjogICAgICAgICAgICAgICAgJzAwODAwMGZmJywgZ3JlZW55ZWxsb3c6ICAgICAgICAgICdhZGZmMmZmZicsXG4gIGhvbmV5ZGV3OiAgICAgICAgICAgICAnZjBmZmYwZmYnLCBob3RwaW5rOiAgICAgICAgICAgICAgJ2ZmNjliNGZmJyxcbiAgaW5kaWFucmVkOiAgICAgICAgICAgICdjZDVjNWNmZicsIGluZGlnbzogICAgICAgICAgICAgICAnNGIwMDgyZmYnLFxuICBpdm9yeTogICAgICAgICAgICAgICAgJ2ZmZmZmMGZmJywga2hha2k6ICAgICAgICAgICAgICAgICdmMGU2OGNmZicsXG4gIGxhdmVuZGVyOiAgICAgICAgICAgICAnZTZlNmZhZmYnLCBsYXZlbmRlcmJsdXNoOiAgICAgICAgJ2ZmZjBmNWZmJyxcbiAgbGF3bmdyZWVuOiAgICAgICAgICAgICc3Y2ZjMDBmZicsIGxlbW9uY2hpZmZvbjogICAgICAgICAnZmZmYWNkZmYnLFxuICBsaWdodGJsdWU6ICAgICAgICAgICAgJ2FkZDhlNmZmJywgbGlnaHRjb3JhbDogICAgICAgICAgICdmMDgwODBmZicsXG4gIGxpZ2h0Y3lhbjogICAgICAgICAgICAnZTBmZmZmZmYnLCBsaWdodGdvbGRlbnJvZHllbGxvdzogJ2ZhZmFkMmZmJyxcbiAgbGlnaHRncmV5OiAgICAgICAgICAgICdkM2QzZDNmZicsIGxpZ2h0Z3JlZW46ICAgICAgICAgICAnOTBlZTkwZmYnLFxuICBsaWdodHBpbms6ICAgICAgICAgICAgJ2ZmYjZjMWZmJywgbGlnaHRzYWxtb246ICAgICAgICAgICdmZmEwN2FmZicsXG4gIGxpZ2h0c2VhZ3JlZW46ICAgICAgICAnMjBiMmFhZmYnLCBsaWdodHNreWJsdWU6ICAgICAgICAgJzg3Y2VmYWZmJyxcbiAgbGlnaHRzbGF0ZWJsdWU6ICAgICAgICc4NDcwZmZmZicsIGxpZ2h0c2xhdGVncmF5OiAgICAgICAnNzc4ODk5ZmYnLFxuICBsaWdodHN0ZWVsYmx1ZTogICAgICAgJ2IwYzRkZWZmJywgbGlnaHR5ZWxsb3c6ICAgICAgICAgICdmZmZmZTBmZicsXG4gIGxpbWU6ICAgICAgICAgICAgICAgICAnMDBmZjAwZmYnLCBsaW1lZ3JlZW46ICAgICAgICAgICAgJzMyY2QzMmZmJyxcbiAgbGluZW46ICAgICAgICAgICAgICAgICdmYWYwZTZmZicsIG1hZ2VudGE6ICAgICAgICAgICAgICAnZmYwMGZmZmYnLFxuICBtYXJvb246ICAgICAgICAgICAgICAgJzgwMDAwMGZmJywgbWVkaXVtYXF1YW1hcmluZTogICAgICc2NmNkYWFmZicsXG4gIG1lZGl1bWJsdWU6ICAgICAgICAgICAnMDAwMGNkZmYnLCBtZWRpdW1vcmNoaWQ6ICAgICAgICAgJ2JhNTVkM2ZmJyxcbiAgbWVkaXVtcHVycGxlOiAgICAgICAgICc5MzcwZDhmZicsIG1lZGl1bXNlYWdyZWVuOiAgICAgICAnM2NiMzcxZmYnLFxuICBtZWRpdW1zbGF0ZWJsdWU6ICAgICAgJzdiNjhlZWZmJywgbWVkaXVtc3ByaW5nZ3JlZW46ICAgICcwMGZhOWFmZicsXG4gIG1lZGl1bXR1cnF1b2lzZTogICAgICAnNDhkMWNjZmYnLCBtZWRpdW12aW9sZXRyZWQ6ICAgICAgJ2M3MTU4NWZmJyxcbiAgbWlkbmlnaHRibHVlOiAgICAgICAgICcxOTE5NzBmZicsIG1pbnRjcmVhbTogICAgICAgICAgICAnZjVmZmZhZmYnLFxuICBtaXN0eXJvc2U6ICAgICAgICAgICAgJ2ZmZTRlMWZmJywgbW9jY2FzaW46ICAgICAgICAgICAgICdmZmU0YjVmZicsXG4gIG5hdmFqb3doaXRlOiAgICAgICAgICAnZmZkZWFkZmYnLCBuYXZ5OiAgICAgICAgICAgICAgICAgJzAwMDA4MGZmJyxcbiAgb2xkbGFjZTogICAgICAgICAgICAgICdmZGY1ZTZmZicsIG9saXZlOiAgICAgICAgICAgICAgICAnODA4MDAwZmYnLFxuICBvbGl2ZWRyYWI6ICAgICAgICAgICAgJzZiOGUyM2ZmJywgb3JhbmdlOiAgICAgICAgICAgICAgICdmZmE1MDBmZicsXG4gIG9yYW5nZXJlZDogICAgICAgICAgICAnZmY0NTAwZmYnLCBvcmNoaWQ6ICAgICAgICAgICAgICAgJ2RhNzBkNmZmJyxcbiAgcGFsZWdvbGRlbnJvZDogICAgICAgICdlZWU4YWFmZicsIHBhbGVncmVlbjogICAgICAgICAgICAnOThmYjk4ZmYnLFxuICBwYWxldHVycXVvaXNlOiAgICAgICAgJ2FmZWVlZWZmJywgcGFsZXZpb2xldHJlZDogICAgICAgICdkODcwOTNmZicsXG4gIHBhcGF5YXdoaXA6ICAgICAgICAgICAnZmZlZmQ1ZmYnLCBwZWFjaHB1ZmY6ICAgICAgICAgICAgJ2ZmZGFiOWZmJyxcbiAgcGVydTogICAgICAgICAgICAgICAgICdjZDg1M2ZmZicsIHBpbms6ICAgICAgICAgICAgICAgICAnZmZjMGNiZmYnLFxuICBwbHVtOiAgICAgICAgICAgICAgICAgJ2RkYTBkZGZmJywgcG93ZGVyYmx1ZTogICAgICAgICAgICdiMGUwZTZmZicsXG4gIHB1cnBsZTogICAgICAgICAgICAgICAnODAwMDgwZmYnLCByZWQ6ICAgICAgICAgICAgICAgICAgJ2ZmMDAwMGZmJyxcbiAgcm9zeWJyb3duOiAgICAgICAgICAgICdiYzhmOGZmZicsIHJveWFsYmx1ZTogICAgICAgICAgICAnNDE2OWUxZmYnLFxuICBzYWRkbGVicm93bjogICAgICAgICAgJzhiNDUxM2ZmJywgc2FsbW9uOiAgICAgICAgICAgICAgICdmYTgwNzJmZicsXG4gIHNhbmR5YnJvd246ICAgICAgICAgICAnZjRhNDYwZmYnLCBzZWFncmVlbjogICAgICAgICAgICAgJzJlOGI1N2ZmJyxcbiAgc2Vhc2hlbGw6ICAgICAgICAgICAgICdmZmY1ZWVmZicsIHNpZW5uYTogICAgICAgICAgICAgICAnYTA1MjJkZmYnLFxuICBzaWx2ZXI6ICAgICAgICAgICAgICAgJ2MwYzBjMGZmJywgc2t5Ymx1ZTogICAgICAgICAgICAgICc4N2NlZWJmZicsXG4gIHNsYXRlYmx1ZTogICAgICAgICAgICAnNmE1YWNkZmYnLCBzbGF0ZWdyYXk6ICAgICAgICAgICAgJzcwODA5MGZmJyxcbiAgc25vdzogICAgICAgICAgICAgICAgICdmZmZhZmFmZicsIHNwcmluZ2dyZWVuOiAgICAgICAgICAnMDBmZjdmZmYnLFxuICBzdGVlbGJsdWU6ICAgICAgICAgICAgJzQ2ODJiNGZmJywgdGFuOiAgICAgICAgICAgICAgICAgICdkMmI0OGNmZicsXG4gIHRlYWw6ICAgICAgICAgICAgICAgICAnMDA4MDgwZmYnLCB0aGlzdGxlOiAgICAgICAgICAgICAgJ2Q4YmZkOGZmJyxcbiAgdG9tYXRvOiAgICAgICAgICAgICAgICdmZjYzNDdmZicsIHR1cnF1b2lzZTogICAgICAgICAgICAnNDBlMGQwZmYnLFxuICB2aW9sZXQ6ICAgICAgICAgICAgICAgJ2VlODJlZWZmJywgdmlvbGV0cmVkOiAgICAgICAgICAgICdkMDIwOTBmZicsXG4gIHdoZWF0OiAgICAgICAgICAgICAgICAnZjVkZWIzZmYnLCB3aGl0ZTogICAgICAgICAgICAgICAgJ2ZmZmZmZmZmJyxcbiAgd2hpdGVzbW9rZTogICAgICAgICAgICdmNWY1ZjVmZicsIHllbGxvdzogICAgICAgICAgICAgICAnZmZmZjAwZmYnLFxuICB5ZWxsb3dncmVlbjogICAgICAgICAgJzlhY2QzMmZmJywgdHJhbnNwYXJlbnQ6ICAgICAgICAgICcwMDAwMDAwMCdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY29sb3JzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlO1xuXG52YXIgUkdCQSAgID0gcmVxdWlyZSggJy4uL1JHQkEnICk7XG52YXIgSFNMQSAgID0gcmVxdWlyZSggJy4uL0hTTEEnICk7XG52YXIgY29sb3JzID0gcmVxdWlyZSggJy4vY29sb3JzJyApO1xuXG52YXIgcGFyc2VkID0gT2JqZWN0LmNyZWF0ZSggbnVsbCApO1xuXG52YXIgVFJBTlNQQVJFTlQgPSBbXG4gIDAsIDAsIDAsIDBcbl07XG5cbnZhciByZWdleHBzID0ge1xuICBoZXgzOiAvXiMoWzAtOWEtZl0pKFswLTlhLWZdKShbMC05YS1mXSkoWzAtOWEtZl0pPyQvLFxuICBoZXg6ICAvXiMoWzAtOWEtZl17Nn0pKFswLTlhLWZdezJ9KT8kLyxcbiAgcmdiOiAgL15yZ2JcXHMqXFwoXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccypcXCkkfF5cXHMqcmdiYVxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKlxcKSQvLFxuICBoc2w6ICAvXmhzbFxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFx1MDAyNVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqXFwpJHxeXFxzKmhzbGFcXHMqXFwoXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHUwMDI1XFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKlxcKSQvXG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHBhcnNlXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZ1xuICogQHJldHVybiB7bW9kdWxlOlwidjYuanNcIi5SR0JBfG1vZHVsZTpcInY2LmpzXCIuSFNMQX1cbiAqIEBleGFtcGxlXG4gKiBwYXJzZSggJyNmMGYwJyApOyAgICAgICAgICAgICAgICAgICAgIC8vIC0+IG5ldyBSR0JBKCAyNTUsIDAsIDI1NSwgMCApXG4gKiBwYXJzZSggJyMwMDAwMDBmZicgKTsgICAgICAgICAgICAgICAgIC8vIC0+IG5ldyBSR0JBKCAwLCAwLCAwLCAxIClcbiAqIHBhcnNlKCAnbWFnZW50YScgKTsgICAgICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDI1NSwgMCwgMjU1LCAxIClcbiAqIHBhcnNlKCAndHJhbnNwYXJlbnQnICk7ICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDAsIDAsIDAsIDAgKVxuICogcGFyc2UoICdoc2woIDAsIDEwMCUsIDUwJSApJyApOyAgICAgICAvLyAtPiBuZXcgSFNMQSggMCwgMTAwLCA1MCwgMSApXG4gKiBwYXJzZSggJ2hzbGEoIDAsIDEwMCUsIDUwJSwgMC41ICknICk7IC8vIC0+IG5ldyBIU0xBKCAwLCAxMDAsIDUwLCAwLjUgKVxuICovXG5mdW5jdGlvbiBwYXJzZSAoIHN0cmluZyApXG57XG4gIHZhciBjYWNoZSA9IHBhcnNlZFsgc3RyaW5nIF0gfHwgcGFyc2VkWyBzdHJpbmcgPSBzdHJpbmcudHJpbSgpLnRvTG93ZXJDYXNlKCkgXTtcblxuICBpZiAoICEgY2FjaGUgKSB7XG4gICAgaWYgKCAoIGNhY2hlID0gY29sb3JzWyBzdHJpbmcgXSApICkge1xuICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKCBwYXJzZUhleCggY2FjaGUgKSwgUkdCQSApO1xuICAgIH0gZWxzZSBpZiAoICggY2FjaGUgPSByZWdleHBzLmhleC5leGVjKCBzdHJpbmcgKSApIHx8ICggY2FjaGUgPSByZWdleHBzLmhleDMuZXhlYyggc3RyaW5nICkgKSApIHtcbiAgICAgIGNhY2hlID0gbmV3IENvbG9yRGF0YSggcGFyc2VIZXgoIGZvcm1hdEhleCggY2FjaGUgKSApLCBSR0JBICk7XG4gICAgfSBlbHNlIGlmICggKCBjYWNoZSA9IHJlZ2V4cHMucmdiLmV4ZWMoIHN0cmluZyApICkgKSB7XG4gICAgICBjYWNoZSA9IG5ldyBDb2xvckRhdGEoIGNvbXBhY3RNYXRjaCggY2FjaGUgKSwgUkdCQSApO1xuICAgIH0gZWxzZSBpZiAoICggY2FjaGUgPSByZWdleHBzLmhzbC5leGVjKCBzdHJpbmcgKSApICkge1xuICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKCBjb21wYWN0TWF0Y2goIGNhY2hlICksIEhTTEEgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgU3ludGF4RXJyb3IoIHN0cmluZyArICcgaXMgbm90IGEgdmFsaWQgc3ludGF4JyApO1xuICAgIH1cblxuICAgIHBhcnNlZFsgc3RyaW5nIF0gPSBjYWNoZTtcbiAgfVxuXG4gIHJldHVybiBuZXcgY2FjaGUuY29sb3IoIGNhY2hlWyAwIF0sIGNhY2hlWyAxIF0sIGNhY2hlWyAyIF0sIGNhY2hlWyAzIF0gKTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBmb3JtYXRIZXhcbiAqIEBwYXJhbSAge2FycmF5PHN0cmluZz8+fSBtYXRjaFxuICogQHJldHVybiB7c3RyaW5nfVxuICogQGV4YW1wbGVcbiAqIGZvcm1hdEhleCggWyAnIzAwMDAwMGZmJywgJzAwMDAwMCcsICdmZicgXSApOyAvLyAtPiAnMDAwMDAwZmYnXG4gKiBmb3JtYXRIZXgoIFsgJyMwMDA3JywgJzAnLCAnMCcsICcwJywgJzcnIF0gKTsgLy8gLT4gJzAwMDAwMDc3J1xuICogZm9ybWF0SGV4KCBbICcjMDAwJywgJzAnLCAnMCcsICcwJywgbnVsbCBdICk7IC8vIC0+ICcwMDAwMDBmZidcbiAqL1xuZnVuY3Rpb24gZm9ybWF0SGV4ICggbWF0Y2ggKVxue1xuICB2YXIgciwgZywgYiwgYTtcblxuICBpZiAoIG1hdGNoLmxlbmd0aCA9PT0gMyApIHtcbiAgICByZXR1cm4gbWF0Y2hbIDEgXSArICggbWF0Y2hbIDIgXSB8fCAnZmYnICk7XG4gIH1cblxuICByID0gbWF0Y2hbIDEgXTtcbiAgZyA9IG1hdGNoWyAyIF07XG4gIGIgPSBtYXRjaFsgMyBdO1xuICBhID0gbWF0Y2hbIDQgXSB8fCAnZic7XG5cbiAgcmV0dXJuIHIgKyByICsgZyArIGcgKyBiICsgYiArIGEgKyBhO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHBhcnNlSGV4XG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICBoZXhcbiAqIEByZXR1cm4ge2FycmF5PG51bWJlcj59XG4gKiBAZXhhbXBsZVxuICogcGFyc2VIZXgoICcwMDAwMDAwMCcgKTsgLy8gLT4gWyAwLCAwLCAwLCAwIF1cbiAqIHBhcnNlSGV4KCAnZmYwMGZmZmYnICk7IC8vIC0+IFsgMjU1LCAwLCAyNTUsIDEgXVxuICovXG5mdW5jdGlvbiBwYXJzZUhleCAoIGhleCApXG57XG4gIGlmICggaGV4ID09IDAgKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgcmV0dXJuIFRSQU5TUEFSRU5UO1xuICB9XG5cbiAgaGV4ID0gcGFyc2VJbnQoIGhleCwgMTYgKTtcblxuICByZXR1cm4gW1xuICAgIC8vIFJcbiAgICBoZXggPj4gMjQgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEdcbiAgICBoZXggPj4gMTYgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEJcbiAgICBoZXggPj4gOCAgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEFcbiAgICAoIGhleCAmIDI1NSApIC8gMjU1IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICBdO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNvbXBhY3RNYXRjaFxuICogQHBhcmFtICB7YXJyYXk8c3RyaW5nPz59IG1hdGNoXG4gKiBAcmV0dXJuIHthcnJheTxudW1iZXI+fVxuICovXG5mdW5jdGlvbiBjb21wYWN0TWF0Y2ggKCBtYXRjaCApXG57XG4gIGlmICggbWF0Y2hbIDcgXSApIHtcbiAgICByZXR1cm4gW1xuICAgICAgTnVtYmVyKCBtYXRjaFsgNCBdICksXG4gICAgICBOdW1iZXIoIG1hdGNoWyA1IF0gKSxcbiAgICAgIE51bWJlciggbWF0Y2hbIDYgXSApLFxuICAgICAgTnVtYmVyKCBtYXRjaFsgNyBdIClcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBOdW1iZXIoIG1hdGNoWyAxIF0gKSxcbiAgICBOdW1iZXIoIG1hdGNoWyAyIF0gKSxcbiAgICBOdW1iZXIoIG1hdGNoWyAzIF0gKVxuICBdO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAY29uc3RydWN0b3IgQ29sb3JEYXRhXG4gKiBAcGFyYW0ge2FycmF5PG51bWJlcj59IG1hdGNoXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSAgICAgIGNvbG9yXG4gKi9cbmZ1bmN0aW9uIENvbG9yRGF0YSAoIG1hdGNoLCBjb2xvciApXG57XG4gIHRoaXNbIDAgXSA9IG1hdGNoWyAwIF07XG4gIHRoaXNbIDEgXSA9IG1hdGNoWyAxIF07XG4gIHRoaXNbIDIgXSA9IG1hdGNoWyAyIF07XG4gIHRoaXNbIDMgXSA9IG1hdGNoWyAzIF07XG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQmtC+0L3RgdGC0LDQvdGC0YsuXG4gKiBAbmFtZXNwYWNlIHtvYmplY3R9IHY2LmNvbnN0YW50c1xuICogQGV4YW1wbGVcbiAqIHZhciBjb25zdGFudHMgPSByZXF1aXJlKCAndjYuanMvY29yZS9jb25zdGFudHMnICk7XG4gKi9cblxudmFyIF9jb25zdGFudHMgPSB7fTtcbnZhciBfY291bnRlciAgID0gMDtcblxuLyoqXG4gKiDQlNC+0LHQsNCy0LvRj9C10YIg0LrQvtC90YHRgtCw0L3RgtGDLlxuICogQG1ldGhvZCB2Ni5jb25zdGFudHMuYWRkXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGtleSDQmNC80Y8g0LrQvtC90YHRgtCw0L3RgtGLLlxuICogQHJldHVybiB7dm9pZH0gICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogY29uc3RhbnRzLmFkZCggJ0NVU1RPTV9DT05TVEFOVCcgKTtcbiAqL1xuZnVuY3Rpb24gYWRkICgga2V5IClcbntcbiAgaWYgKCB0eXBlb2YgX2NvbnN0YW50c1sga2V5IF0gIT09ICd1bmRlZmluZWQnICkge1xuICAgIHRocm93IEVycm9yKCAnQ2Fubm90IHJlLXNldCAoYWRkKSBleGlzdGluZyBjb25zdGFudDogJyArIGtleSApO1xuICB9XG5cbiAgX2NvbnN0YW50c1sga2V5IF0gPSArK19jb3VudGVyO1xufVxuXG4vKipcbiAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC60L7QvdGB0YLQsNC90YLRgy5cbiAqIEBtZXRob2QgdjYuY29uc3RhbnRzLmdldFxuICogQHBhcmFtICB7c3RyaW5nfSAgIGtleSDQmNC80Y8g0LrQvtC90YHRgtCw0L3RgtGLLlxuICogQHJldHVybiB7Y29uc3RhbnR9ICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQutC+0L3RgdGC0LDQvdGC0YMuXG4gKiBAZXhhbXBsZVxuICogY29uc3RhbnRzLmdldCggJ0NVU1RPTV9DT05TVEFOVCcgKTtcbiAqL1xuZnVuY3Rpb24gZ2V0ICgga2V5IClcbntcbiAgaWYgKCB0eXBlb2YgX2NvbnN0YW50c1sga2V5IF0gPT09ICd1bmRlZmluZWQnICkge1xuICAgIHRocm93IFJlZmVyZW5jZUVycm9yKCAnQ2Fubm90IGdldCB1bmtub3duIGNvbnN0YW50OiAnICsga2V5ICk7XG4gIH1cblxuICByZXR1cm4gX2NvbnN0YW50c1sga2V5IF07XG59XG5cbltcbiAgJ0FVVE8nLFxuICAnR0wnLFxuICAnMkQnLFxuICAnTEVGVCcsXG4gICdUT1AnLFxuICAnQ0VOVEVSJyxcbiAgJ01JRERMRScsXG4gICdSSUdIVCcsXG4gICdCT1RUT00nLFxuICAnUEVSQ0VOVCcsXG4gICdQT0lOVFMnLFxuICAnTElORVMnXG5dLmZvckVhY2goIGFkZCApO1xuXG5leHBvcnRzLmFkZCA9IGFkZDtcbmV4cG9ydHMuZ2V0ID0gZ2V0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTGlnaHRFbWl0dGVyID0gcmVxdWlyZSggJ2xpZ2h0X2VtaXR0ZXInICk7XG5cbi8qKlxuICogQGFic3RyYWN0XG4gKiBAY29uc3RydWN0b3IgdjYuQWJzdHJhY3RJbWFnZVxuICogQGV4dGVuZHMgTGlnaHRFbWl0dGVyXG4gKiBAc2VlIHY2LkNvbXBvdW5kZWRJbWFnZVxuICogQHNlZSB2Ni5JbWFnZVxuICovXG5mdW5jdGlvbiBBYnN0cmFjdEltYWdlICgpXG57XG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI3N4IFwiU291cmNlIFhcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2Ujc3kgXCJTb3VyY2UgWVwiLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNzdyBcIlNvdXJjZSBXaWR0aFwiLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNzaCBcIlNvdXJjZSBIZWlnaHRcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2UjZHcgXCJEZXN0aW5hdGlvbiBXaWR0aFwiLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNkaCBcIkRlc3RpbmF0aW9uIEhlaWdodFwiLlxuICAgKi9cblxuICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGFic3RyYWN0IGNsYXNzIChuZXcgdjYuQWJzdHJhY3RJbWFnZSknICk7XG59XG5cbkFic3RyYWN0SW1hZ2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggTGlnaHRFbWl0dGVyLnByb3RvdHlwZSApO1xuQWJzdHJhY3RJbWFnZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBBYnN0cmFjdEltYWdlO1xuXG4vKipcbiAqIEB2aXJ0dWFsXG4gKiBAbWV0aG9kIHY2LkFic3RyYWN0SW1hZ2UjZ2V0XG4gKiBAcmV0dXJuIHt2Ni5JbWFnZX1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFic3RyYWN0SW1hZ2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBBYnN0cmFjdEltYWdlID0gcmVxdWlyZSggJy4vQWJzdHJhY3RJbWFnZScgKTtcblxuLyoqXG4gKiBAY29uc3RydWN0b3IgdjYuQ29tcG91bmRlZEltYWdlXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdEltYWdlXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0SW1hZ2V9IGltYWdlXG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIHN4XG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIHN5XG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIHN3XG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIHNoXG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIGR3XG4gKiBAcGFyYW0ge251Ym1lcn0gICAgICAgICAgIGRoXG4gKi9cbmZ1bmN0aW9uIENvbXBvdW5kZWRJbWFnZSAoIGltYWdlLCBzeCwgc3ksIHN3LCBzaCwgZHcsIGRoIClcbntcbiAgdGhpcy5pbWFnZSA9IGltYWdlO1xuICB0aGlzLnN4ICAgID0gc3g7XG4gIHRoaXMuc3kgICAgPSBzeTtcbiAgdGhpcy5zdyAgICA9IHN3O1xuICB0aGlzLnNoICAgID0gc2g7XG4gIHRoaXMuZHcgICAgPSBkdztcbiAgdGhpcy5kaCAgICA9IGRoO1xufVxuXG5Db21wb3VuZGVkSW1hZ2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RJbWFnZS5wcm90b3R5cGUgKTtcbkNvbXBvdW5kZWRJbWFnZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDb21wb3VuZGVkSW1hZ2U7XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LkNvbXBvdW5kZWRJbWFnZSNnZXRcbiAqL1xuQ29tcG91bmRlZEltYWdlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQgKClcbntcbiAgcmV0dXJuIHRoaXMuaW1hZ2UuZ2V0KCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvdW5kZWRJbWFnZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbXBvdW5kZWRJbWFnZSA9IHJlcXVpcmUoICcuL0NvbXBvdW5kZWRJbWFnZScgKTtcbnZhciBBYnN0cmFjdEltYWdlICAgPSByZXF1aXJlKCAnLi9BYnN0cmFjdEltYWdlJyApO1xuXG4vKipcbiAqINCa0LvQsNGB0YEg0LrQsNGA0YLQuNC90LrQuC5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5JbWFnZVxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RJbWFnZVxuICogQHBhcmFtIHtIVE1MSW1hZ2VFbGVtZW50fSBpbWFnZSBET00g0Y3Qu9C10LzQtdC90YIg0LrQsNGA0YLQuNC90LrQuCAoSU1HKS5cbiAqIEBmaXJlcyBjb21wbGV0ZVxuICogQHNlZSB2Ni5JbWFnZS5mcm9tVVJMXG4gKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZEltYWdlXG4gKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjaW1hZ2VcbiAqIEBleGFtcGxlXG4gKiB2YXIgSW1hZ2UgPSByZXF1aXJlKCAndjYuanMvY29yZS9pbWFnZS9JbWFnZScgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIGFuIGltYWdlIHdpdGggYW4gRE9NIGltYWdlPC9jYXB0aW9uPlxuICogLy8gSFRNTDogPGltZyBzcmM9XCJpbWFnZS5wbmdcIiBpZD1cImltYWdlXCIgLz5cbiAqIHZhciBpbWFnZSA9IG5ldyBJbWFnZSggZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoICdpbWFnZScgKSApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRpbmcgYW4gaW1hZ2Ugd2l0aCBhIFVSTDwvY2FwdGlvbj5cbiAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICdpbWFnZS5wbmcnICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5GaXJlcyBcImNvbXBsZXRlXCIgZXZlbnQ8L2NhcHRpb24+XG4gKiBpbWFnZS5vbmNlKCAnY29tcGxldGUnLCBmdW5jdGlvbiAoKVxuICoge1xuICogICBjb25zb2xlLmxvZyggJ1RoZSBpbWFnZSBpcyBsb2FkZWQhJyApO1xuICogfSApO1xuICovXG5mdW5jdGlvbiBJbWFnZSAoIGltYWdlIClcbntcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGlmICggISBpbWFnZS5zcmMgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3JlYXRlIHY2LkltYWdlIGZyb20gSFRNTEltYWdlRWxlbWVudCB3aXRoIG5vIFwic3JjXCIgYXR0cmlidXRlIChuZXcgdjYuSW1hZ2UpJyApO1xuICB9XG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge0hUTUxJbWFnZUVsZW1lbnR9IHY2LkltYWdlI2ltYWdlIERPTSDRjdC10LvQtdC80LXQvdGCINC60LDRgNGC0LjQvdC60LguXG4gICAqL1xuICB0aGlzLmltYWdlID0gaW1hZ2U7XG5cbiAgaWYgKCB0aGlzLmltYWdlLmNvbXBsZXRlICkge1xuICAgIHRoaXMuX2luaXQoKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmltYWdlLmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgZnVuY3Rpb24gb25sb2FkICgpXG4gICAge1xuICAgICAgc2VsZi5pbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCAnbG9hZCcsIG9ubG9hZCApO1xuICAgICAgc2VsZi5faW5pdCgpO1xuICAgIH0sIGZhbHNlICk7XG4gIH1cbn1cblxuSW1hZ2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RJbWFnZS5wcm90b3R5cGUgKTtcbkltYWdlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEltYWdlO1xuXG4vKipcbiAqINCY0L3QuNGG0LjQsNC70LjQt9C40YDRg9C10YIg0LrQsNGA0YLQuNC90LrRgyDQv9C+0YHQu9C1INC10LUg0LfQsNCz0YDRg9C30LrQuC5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHY2LkltYWdlI19pbml0XG4gKiBAcmV0dXJuIHt2b2lkfSDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqL1xuSW1hZ2UucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gX2luaXQgKClcbntcbiAgdGhpcy5zeCA9IDA7XG4gIHRoaXMuc3kgPSAwO1xuICB0aGlzLnN3ID0gdGhpcy5kdyA9IHRoaXMuaW1hZ2Uud2lkdGg7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICB0aGlzLnNoID0gdGhpcy5kaCA9IHRoaXMuaW1hZ2UuaGVpZ2h0OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICB0aGlzLmVtaXQoICdjb21wbGV0ZScgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LkltYWdlI2dldFxuICovXG5JbWFnZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0ICgpXG57XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQntC/0YDQtdC00LXQu9GP0LXRgiwg0LfQsNCz0YDRg9C20LXQvdCwINC70Lgg0LrQsNGA0YLQuNC90LrQsC5cbiAqIEBtZXRob2QgdjYuSW1hZ2UjY29tcGxldGVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IGB0cnVlYCwg0LXRgdC70Lgg0LfQsNCz0YDRg9C20LXQvdCwLlxuICogQGV4YW1wbGVcbiAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICdpbWFnZS5wbmcnICk7XG4gKlxuICogaWYgKCAhIGltYWdlLmNvbXBsZXRlKCkgKSB7XG4gKiAgIGltYWdlLm9uY2UoICdjb21wbGV0ZScsIGZ1bmN0aW9uICgpXG4gKiAgIHtcbiAqICAgICBjb25zb2xlLmxvZyggJ1RoZSBpbWFnZSBpcyBsb2FkZWQhJywgaW1hZ2UuY29tcGxldGUoKSApO1xuICogICB9ICk7XG4gKiB9XG4gKi9cbkltYWdlLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlICgpXG57XG4gIHJldHVybiBCb29sZWFuKCB0aGlzLmltYWdlLnNyYyApICYmIHRoaXMuaW1hZ2UuY29tcGxldGU7XG59O1xuXG4vKipcbiAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIFVSTCDQutCw0YDRgtC40L3QutC4LlxuICogQG1ldGhvZCB2Ni5JbWFnZSNzcmNcbiAqIEByZXR1cm4ge3N0cmluZ30gVVJMINC60LDRgNGC0LjQvdC60LguXG4gKiBAZXhhbXBsZVxuICogSW1hZ2UuZnJvbVVSTCggJ2ltYWdlLnBuZycgKS5zcmMoKTsgLy8gLT4gXCJpbWFnZS5wbmdcIlxuICovXG5JbWFnZS5wcm90b3R5cGUuc3JjID0gZnVuY3Rpb24gc3JjICgpXG57XG4gIHJldHVybiB0aGlzLmltYWdlLnNyYztcbn07XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YPRjiB7QGxpbmsgdjYuSW1hZ2V9INC40LcgVVJMLlxuICogQG1ldGhvZCB2Ni5JbWFnZS5mcm9tVVJMXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgc3JjIFVSTCDQutCw0YDRgtC40L3QutC4LlxuICogQHJldHVybiB7djYuSW1hZ2V9ICAgICDQndC+0LLQsNGPIHtAbGluayB2Ni5JbWFnZX0uXG4gKiBAZXhhbXBsZVxuICogdmFyIGltYWdlID0gSW1hZ2UuZnJvbVVSTCggJ2ltYWdlLnBuZycgKTtcbiAqL1xuSW1hZ2UuZnJvbVVSTCA9IGZ1bmN0aW9uIGZyb21VUkwgKCBzcmMgKVxue1xuICB2YXIgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW1nJyApO1xuICBpbWFnZS5zcmMgPSBzcmM7XG4gIHJldHVybiBuZXcgSW1hZ2UoIGltYWdlICk7XG59O1xuXG4vKipcbiAqINCf0YDQvtC/0L7RgNGG0LjQvtC90LDQu9GM0L3QviDRgNCw0YHRgtGP0LPQuNCy0LDQtdGCINC40LvQuCDRgdC20LjQvNCw0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICogQG1ldGhvZCB2Ni5JbWFnZS5zdHJldGNoXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdEltYWdlfSAgIGltYWdlINCa0LDRgNGC0LjQvdC60LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIGR3ICAgINCd0L7QstGL0LkgXCJEZXN0aW5hdGlvbiBXaWR0aFwiLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBkaCAgICDQndC+0LLRi9C5IFwiRGVzdGluYXRpb24gSGVpZ2h0XCIuXG4gKiBAcmV0dXJuIHt2Ni5Db21wb3VuZGVkSW1hZ2V9ICAgICAgINCd0L7QstCw0Y8g0LrQsNGA0YLQuNC90LrQsC5cbiAqIEBleGFtcGxlXG4gKiBJbWFnZS5zdHJldGNoKCBpbWFnZSwgNjAwLCA0MDAgKTtcbiAqL1xuSW1hZ2Uuc3RyZXRjaCA9IGZ1bmN0aW9uIHN0cmV0Y2ggKCBpbWFnZSwgZHcsIGRoIClcbntcbiAgdmFyIHZhbHVlID0gZGggLyBpbWFnZS5kaCAqIGltYWdlLmR3O1xuXG4gIC8vIFN0cmV0Y2ggRFcuXG4gIGlmICggdmFsdWUgPCBkdyApIHtcbiAgICBkaCA9IGR3IC8gaW1hZ2UuZHcgKiBpbWFnZS5kaDtcblxuICAvLyBTdHJldGNoIERILlxuICB9IGVsc2Uge1xuICAgIGR3ID0gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gbmV3IENvbXBvdW5kZWRJbWFnZSggaW1hZ2UuZ2V0KCksIGltYWdlLnN4LCBpbWFnZS5zeSwgaW1hZ2Uuc3csIGltYWdlLnNoLCBkdywgZGggKTtcbn07XG5cbi8qKlxuICog0J7QsdGA0LXQt9Cw0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICogQG1ldGhvZCB2Ni5JbWFnZS5jdXRcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0SW1hZ2V9ICAgaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCwg0LrQvtGC0L7RgNGD0Y4g0L3QsNC00L4g0L7QsdGA0LXQt9Cw0YLRjC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgc3ggICAgWCDQutC+0L7RgNC00LjQvdCw0YLQsCwg0L7RgtC60YPQtNCwINC90LDQtNC+INC+0LHRgNC10LfQsNGC0YwuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIHN5ICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAsINC+0YLQutGD0LTQsCDQvdCw0LTQviDQvtCx0YDQtdC30LDRgtGMLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBzdyAgICDQndC+0LLQsNGPINGI0LjRgNC40L3QsC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgc2ggICAg0J3QvtCy0LDRjyDQstGL0YHQvtGC0LAuXG4gKiBAcmV0dXJuIHt2Ni5Db21wb3VuZGVkSW1hZ2V9ICAgICAgINCe0LHRgNC10LfQsNC90L3QsNGPINC60LDRgNGC0LjQvdC60LAuXG4gKiBAZXhhbXBsZVxuICogSW1hZ2UuY3V0KCBpbWFnZSwgMTAsIDIwLCAzMCwgNDAgKTtcbiAqL1xuSW1hZ2UuY3V0ID0gZnVuY3Rpb24gY3V0ICggaW1hZ2UsIHN4LCBzeSwgZHcsIGRoIClcbntcbiAgdmFyIHN3ID0gaW1hZ2Uuc3cgLyBpbWFnZS5kdyAqIGR3O1xuICB2YXIgc2ggPSBpbWFnZS5zaCAvIGltYWdlLmRoICogZGg7XG5cbiAgc3ggKz0gaW1hZ2Uuc3g7XG5cbiAgaWYgKCBzeCArIHN3ID4gaW1hZ2Uuc3ggKyBpbWFnZS5zdyApIHtcbiAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjdXQgdGhlIGltYWdlIGJlY2F1c2UgdGhlIG5ldyBpbWFnZSBYIG9yIFcgaXMgb3V0IG9mIGJvdW5kcyAodjYuSW1hZ2UuY3V0KScgKTtcbiAgfVxuXG4gIHN5ICs9IGltYWdlLnN5O1xuXG4gIGlmICggc3kgKyBzaCA+IGltYWdlLnN5ICsgaW1hZ2Uuc2ggKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3V0IHRoZSBpbWFnZSBiZWNhdXNlIHRoZSBuZXcgaW1hZ2UgWSBvciBIIGlzIG91dCBvZiBib3VuZHMgKHY2LkltYWdlLmN1dCknICk7XG4gIH1cblxuICByZXR1cm4gbmV3IENvbXBvdW5kZWRJbWFnZSggaW1hZ2UuZ2V0KCksIHN4LCBzeSwgc3csIHNoLCBkdywgZGggKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW1hZ2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfRmxvYXQzMkFycmF5O1xuXG5pZiAoIHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICdmdW5jdGlvbicgKSB7XG4gIF9GbG9hdDMyQXJyYXkgPSBGbG9hdDMyQXJyYXk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbn0gZWxzZSB7XG4gIF9GbG9hdDMyQXJyYXkgPSBBcnJheTtcbn1cblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQvNCw0YHRgdC40LIg0YEg0LrQvtC+0YDQtNC40L3QsNGC0LDQvNC4INCy0YHQtdGFINGC0L7Rh9C10Log0L3Rg9C20L3QvtCz0L4g0L/QvtC70LjQs9C+0L3QsC5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNyZWF0ZVBvbHlnb25cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgc2lkZXMg0JrQvtC70LjRh9C10YHRgtCy0L4g0YHRgtC+0YDQvtC9INC/0L7Qu9C40LPQvtC90LAuXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9ICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC80LDRgdGB0LjQsiAoRmxvYXQzMkFycmF5KSDQutC+0YLQvtGA0YvQuSDQstGL0LPQu9GP0LTQuNGCINGC0LDQujogYFsgeDEsIHkxLCB4MiwgeTIgXWAuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINCS0YHQtSDQt9C90LDRh9C10L3QuNGPINC60L7RgtC+0YDQvtCz0L4g0L3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3Riy5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUG9seWdvbiAoIHNpZGVzIClcbntcbiAgdmFyIGkgICAgICAgID0gTWF0aC5mbG9vciggc2lkZXMgKTtcbiAgdmFyIHN0ZXAgICAgID0gTWF0aC5QSSAqIDIgLyBzaWRlcztcbiAgdmFyIHZlcnRpY2VzID0gbmV3IF9GbG9hdDMyQXJyYXkoIGkgKiAyICsgMiApO1xuXG4gIGZvciAoIDsgaSA+PSAwOyAtLWkgKSB7XG4gICAgdmVydGljZXNbICAgICBpICogMiBdID0gTWF0aC5jb3MoIHN0ZXAgKiBpICk7XG4gICAgdmVydGljZXNbIDEgKyBpICogMiBdID0gTWF0aC5zaW4oIHN0ZXAgKiBpICk7XG4gIH1cblxuICByZXR1cm4gdmVydGljZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUG9seWdvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQuCDQuNC90LjRhtC40LDQu9C40LfQuNGA0YPQtdGCINC90L7QstGD0Y4gV2ViR0wg0L/RgNC+0LPRgNCw0LzQvNGDLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY3JlYXRlUHJvZ3JhbVxuICogQHBhcmFtICB7V2ViR0xTaGFkZXJ9ICAgICAgICAgICB2ZXJ0INCS0LXRgNGI0LjQvdC90YvQuSDRiNC10LnQtNC10YAgKNGB0L7Qt9C00LDQvdC90YvQuSDRgSDQv9C+0LzQvtGJ0YzRjiBge0BsaW5rIGNyZWF0ZVNoYWRlcn1gKS5cbiAqIEBwYXJhbSAge1dlYkdMU2hhZGVyfSAgICAgICAgICAgZnJhZyDQpNGA0LDQs9C80LXQvdGC0L3Ri9C5INGI0LXQudC00LXRgCAo0YHQvtC30LTQsNC90L3Ri9C5INGBINC/0L7QvNC+0YnRjNGOIGB7QGxpbmsgY3JlYXRlU2hhZGVyfWApLlxuICogQHBhcmFtICB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAgIFdlYkdMINC60L7QvdGC0LXQutGB0YIuXG4gKiBAcmV0dXJuIHtXZWJHTFByb2dyYW19XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVByb2dyYW0gKCB2ZXJ0LCBmcmFnLCBnbCApXG57XG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuXG4gIGdsLmF0dGFjaFNoYWRlciggcHJvZ3JhbSwgdmVydCApO1xuICBnbC5hdHRhY2hTaGFkZXIoIHByb2dyYW0sIGZyYWcgKTtcbiAgZ2wubGlua1Byb2dyYW0oIHByb2dyYW0gKTtcblxuICBpZiAoICEgZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggcHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ1VuYWJsZSB0byBpbml0aWFsaXplIHRoZSBzaGFkZXIgcHJvZ3JhbTogJyArIGdsLmdldFByb2dyYW1JbmZvTG9nKCBwcm9ncmFtICkgKTtcbiAgfVxuXG4gIGdsLnZhbGlkYXRlUHJvZ3JhbSggcHJvZ3JhbSApO1xuXG4gIGlmICggISBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKCBwcm9ncmFtLCBnbC5WQUxJREFURV9TVEFUVVMgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ1VuYWJsZSB0byB2YWxpZGF0ZSB0aGUgc2hhZGVyIHByb2dyYW06ICcgKyBnbC5nZXRQcm9ncmFtSW5mb0xvZyggcHJvZ3JhbSApICk7XG4gIH1cblxuICByZXR1cm4gcHJvZ3JhbTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVQcm9ncmFtO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINC4INC40L3QuNGG0LjQsNC70LjQt9C40YDRg9C10YIg0L3QvtCy0YvQuSBXZWJHTCDRiNC10LnQtNC10YAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjcmVhdGVTaGFkZXJcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgICAgc291cmNlINCY0YHRhdC+0LTQvdGL0Lkg0LrQvtC0INGI0LXQudC00LXRgNCwLlxuICogQHBhcmFtICB7Y29uc3RhbnR9ICAgICAgICAgICAgICB0eXBlICAg0KLQuNC/INGI0LXQudC00LXRgNCwOiBWRVJURVhfU0hBREVSINC40LvQuCBGUkFHTUVOVF9TSEFERVIuXG4gKiBAcGFyYW0gIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsICAgICBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICogQHJldHVybiB7V2ViR0xTaGFkZXJ9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVNoYWRlciAoIHNvdXJjZSwgdHlwZSwgZ2wgKVxue1xuICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKCB0eXBlICk7XG5cbiAgZ2wuc2hhZGVyU291cmNlKCBzaGFkZXIsIHNvdXJjZSApO1xuICBnbC5jb21waWxlU2hhZGVyKCBzaGFkZXIgKTtcblxuICBpZiAoICEgZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKCBzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTICkgKSB7XG4gICAgdGhyb3cgU3ludGF4RXJyb3IoICdBbiBlcnJvciBvY2N1cnJlZCBjb21waWxpbmcgdGhlIHNoYWRlcnM6ICcgKyBnbC5nZXRTaGFkZXJJbmZvTG9nKCBzaGFkZXIgKSApO1xuICB9XG5cbiAgcmV0dXJuIHNoYWRlcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVTaGFkZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZW1iZXIge29iamVjdH0gcG9seWdvbnNcbiAqL1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbm9vcCA9IHJlcXVpcmUoICdwZWFrby9ub29wJyApO1xuXG52YXIgcmVwb3J0LCByZXBvcnRlZDtcblxuaWYgKCB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgY29uc29sZS53YXJuICkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgcmVwb3J0ZWQgPSB7fTtcblxuICByZXBvcnQgPSBmdW5jdGlvbiByZXBvcnQgKCBtZXNzYWdlIClcbiAge1xuICAgIGlmICggcmVwb3J0ZWRbIG1lc3NhZ2UgXSApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zb2xlLndhcm4oIG1lc3NhZ2UgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmVwb3J0ZWRbIG1lc3NhZ2UgXSA9IHRydWU7XG4gIH07XG59IGVsc2Uge1xuICByZXBvcnQgPSBub29wO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcG9ydDtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5pZGVudGl0eSA9IGZ1bmN0aW9uIGlkZW50aXR5ICgpXG57XG4gIHJldHVybiBbXG4gICAgMSwgMCwgMCxcbiAgICAwLCAxLCAwLFxuICAgIDAsIDAsIDFcbiAgXTtcbn07XG5cbmV4cG9ydHMuc2V0SWRlbnRpdHkgPSBmdW5jdGlvbiBzZXRJZGVudGl0eSAoIG0xIClcbntcbiAgbTFbIDAgXSA9IDE7XG4gIG0xWyAxIF0gPSAwO1xuICBtMVsgMiBdID0gMDtcbiAgbTFbIDMgXSA9IDA7XG4gIG0xWyA0IF0gPSAxO1xuICBtMVsgNSBdID0gMDtcbiAgbTFbIDYgXSA9IDA7XG4gIG0xWyA3IF0gPSAwO1xuICBtMVsgOCBdID0gMTtcbn07XG5cbmV4cG9ydHMuY29weSA9IGZ1bmN0aW9uIGNvcHkgKCBtMSwgbTIgKVxue1xuICBtMVsgMCBdID0gbTJbIDAgXTtcbiAgbTFbIDEgXSA9IG0yWyAxIF07XG4gIG0xWyAyIF0gPSBtMlsgMiBdO1xuICBtMVsgMyBdID0gbTJbIDMgXTtcbiAgbTFbIDQgXSA9IG0yWyA0IF07XG4gIG0xWyA1IF0gPSBtMlsgNSBdO1xuICBtMVsgNiBdID0gbTJbIDYgXTtcbiAgbTFbIDcgXSA9IG0yWyA3IF07XG4gIG0xWyA4IF0gPSBtMlsgOCBdO1xufTtcblxuZXhwb3J0cy5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lICggbTEgKVxue1xuICByZXR1cm4gW1xuICAgIG0xWyAwIF0sXG4gICAgbTFbIDEgXSxcbiAgICBtMVsgMiBdLFxuICAgIG0xWyAzIF0sXG4gICAgbTFbIDQgXSxcbiAgICBtMVsgNSBdLFxuICAgIG0xWyA2IF0sXG4gICAgbTFbIDcgXSxcbiAgICBtMVsgOCBdXG4gIF07XG59O1xuXG5leHBvcnRzLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uIHRyYW5zbGF0ZSAoIG0xLCB4LCB5IClcbntcbiAgbTFbIDYgXSA9ICggeCAqIG0xWyAwIF0gKSArICggeSAqIG0xWyAzIF0gKSArIG0xWyA2IF07XG4gIG0xWyA3IF0gPSAoIHggKiBtMVsgMSBdICkgKyAoIHkgKiBtMVsgNCBdICkgKyBtMVsgNyBdO1xuICBtMVsgOCBdID0gKCB4ICogbTFbIDIgXSApICsgKCB5ICogbTFbIDUgXSApICsgbTFbIDggXTtcbn07XG5cbmV4cG9ydHMucm90YXRlID0gZnVuY3Rpb24gcm90YXRlICggbTEsIGFuZ2xlIClcbntcbiAgdmFyIG0xMCA9IG0xWyAwIF07XG4gIHZhciBtMTEgPSBtMVsgMSBdO1xuICB2YXIgbTEyID0gbTFbIDIgXTtcbiAgdmFyIG0xMyA9IG0xWyAzIF07XG4gIHZhciBtMTQgPSBtMVsgNCBdO1xuICB2YXIgbTE1ID0gbTFbIDUgXTtcblxuICB2YXIgeCA9IE1hdGguY29zKCBhbmdsZSApO1xuICB2YXIgeSA9IE1hdGguc2luKCBhbmdsZSApO1xuXG4gIG0xWyAwIF0gPSAoIHggKiBtMTAgKSArICggeSAqIG0xMyApO1xuICBtMVsgMSBdID0gKCB4ICogbTExICkgKyAoIHkgKiBtMTQgKTtcbiAgbTFbIDIgXSA9ICggeCAqIG0xMiApICsgKCB5ICogbTE1ICk7XG4gIG0xWyAzIF0gPSAoIHggKiBtMTMgKSAtICggeSAqIG0xMCApO1xuICBtMVsgNCBdID0gKCB4ICogbTE0ICkgLSAoIHkgKiBtMTEgKTtcbiAgbTFbIDUgXSA9ICggeCAqIG0xNSApIC0gKCB5ICogbTEyICk7XG59O1xuXG5leHBvcnRzLnNjYWxlID0gZnVuY3Rpb24gc2NhbGUgKCBtMSwgeCwgeSApXG57XG4gIG0xWyAwIF0gKj0geDtcbiAgbTFbIDEgXSAqPSB4O1xuICBtMVsgMiBdICo9IHg7XG4gIG0xWyAzIF0gKj0geTtcbiAgbTFbIDQgXSAqPSB5O1xuICBtMVsgNSBdICo9IHk7XG59O1xuXG5leHBvcnRzLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIHRyYW5zZm9ybSAoIG0xLCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG57XG4gIG0xWyAwIF0gKj0gbTExO1xuICBtMVsgMSBdICo9IG0yMTtcbiAgbTFbIDIgXSAqPSBkeDtcbiAgbTFbIDMgXSAqPSBtMTI7XG4gIG0xWyA0IF0gKj0gbTIyO1xuICBtMVsgNSBdICo9IGR5O1xuICBtMVsgNiBdID0gMDtcbiAgbTFbIDcgXSA9IDA7XG59O1xuXG5leHBvcnRzLnNldFRyYW5zZm9ybSA9IGZ1bmN0aW9uIHNldFRyYW5zZm9ybSAoIG0xLCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG57XG4gIC8vIFggc2NhbGVcbiAgbTFbIDAgXSA9IG0xMTtcbiAgLy8gWCBza2V3XG4gIG0xWyAxIF0gPSBtMTI7XG4gIC8vIFkgc2tld1xuICBtMVsgMyBdID0gbTIxO1xuICAvLyBZIHNjYWxlXG4gIG0xWyA0IF0gPSBtMjI7XG4gIC8vIFggdHJhbnNsYXRlXG4gIG0xWyA2IF0gPSBkeDtcbiAgLy8gWSB0cmFuc2xhdGVcbiAgbTFbIDcgXSA9IGR5O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4uL3NldHRpbmdzJyApO1xuXG4vKipcbiAqINCQ0LHRgdGC0YDQsNC60YLQvdGL0Lkg0LrQu9Cw0YHRgSDQstC10LrRgtC+0YDQsCDRgSDQsdCw0LfQvtCy0YvQvNC4INC80LXRgtC+0LTQsNC80LguXG4gKlxuICog0KfRgtC+0LHRiyDQuNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNGD0LTRg9GB0Ysg0LLQvNC10YHRgtC+INGA0LDQtNC40LDQvdC+0LIg0L3QsNC00L4g0L3QsNC/0LjRgdCw0YLRjCDRgdC70LXQtNGD0Y7RidC10LU6XG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAndjYuanMvY29yZS9zZXR0aW5ncycgKTtcbiAqIHNldHRpbmdzLmRlZ3JlZXMgPSB0cnVlO1xuICogYGBgXG4gKiBAYWJzdHJhY3RcbiAqIEBjb25zdHJ1Y3RvciB2Ni5BYnN0cmFjdFZlY3RvclxuICogQHNlZSB2Ni5WZWN0b3IyRFxuICogQHNlZSB2Ni5WZWN0b3IzRFxuICovXG5mdW5jdGlvbiBBYnN0cmFjdFZlY3RvciAoKVxue1xuICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGFic3RyYWN0IGNsYXNzIChuZXcgdjYuQWJzdHJhY3RWZWN0b3IpJyApO1xufVxuXG5BYnN0cmFjdFZlY3Rvci5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQndC+0YDQvNCw0LvQuNC30YPQtdGCINCy0LXQutGC0L7RgC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNub3JtYWxpemVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5ub3JtYWxpemUoKTsgLy8gVmVjdG9yMkQgeyB4OiAwLjg5NDQyNzE5MDk5OTkxNTksIHk6IDAuNDQ3MjEzNTk1NDk5OTU3OSB9XG4gICAqL1xuICBub3JtYWxpemU6IGZ1bmN0aW9uIG5vcm1hbGl6ZSAoKVxuICB7XG4gICAgdmFyIG1hZyA9IHRoaXMubWFnKCk7XG5cbiAgICBpZiAoIG1hZyAmJiBtYWcgIT09IDEgKSB7XG4gICAgICB0aGlzLmRpdiggbWFnICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCY0LfQvNC10L3Rj9C10YIg0L3QsNC/0YDQsNCy0LvQtdC90LjQtSDQstC10LrRgtC+0YDQsCDQvdCwIGBcImFuZ2xlXCJgINGBINGB0L7RhdGA0LDQvdC10L3QuNC10Lwg0LTQu9C40L3Riy5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNzZXRBbmdsZVxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUg0J3QvtCy0L7QtSDQvdCw0L/RgNCw0LLQu9C10L3QuNC1LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnNldEFuZ2xlKCA0NSAqIE1hdGguUEkgLyAxODAgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjE2MjI3NzY2MDE2ODM3OTUsIHk6IDMuMTYyMjc3NjYwMTY4Mzc5IH1cbiAgICogQGV4YW1wbGUgPGNhcHRpb24+0JjRgdC/0L7Qu9GM0LfRg9GPINCz0YDRg9C00YPRgdGLPC9jYXB0aW9uPlxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5zZXRBbmdsZSggNDUgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjE2MjI3NzY2MDE2ODM3OTUsIHk6IDMuMTYyMjc3NjYwMTY4Mzc5IH1cbiAgICovXG4gIHNldEFuZ2xlOiBmdW5jdGlvbiBzZXRBbmdsZSAoIGFuZ2xlIClcbiAge1xuICAgIHZhciBtYWcgPSB0aGlzLm1hZygpO1xuXG4gICAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgICAgYW5nbGUgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICB9XG5cbiAgICB0aGlzLnggPSBtYWcgKiBNYXRoLmNvcyggYW5nbGUgKTtcbiAgICB0aGlzLnkgPSBtYWcgKiBNYXRoLnNpbiggYW5nbGUgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQmNC30LzQtdC90Y/QtdGCINC00LvQuNC90YMg0LLQtdC60YLQvtGA0LAg0L3QsCBgXCJ2YWx1ZVwiYCDRgSDRgdC+0YXRgNCw0L3QtdC90LjQtdC8INC90LDQv9GA0LDQstC70LXQvdC40Y8uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3Ijc2V0TWFnXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQndC+0LLQsNGPINC00LvQuNC90LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkuc2V0TWFnKCA0MiApOyAvLyBWZWN0b3IyRCB7IHg6IDM3LjU2NTk0MjAyMTk5NjQ2LCB5OiAxOC43ODI5NzEwMTA5OTgyMyB9XG4gICAqL1xuICBzZXRNYWc6IGZ1bmN0aW9uIHNldE1hZyAoIHZhbHVlIClcbiAge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZSgpLm11bCggdmFsdWUgKTtcbiAgfSxcblxuICAvKipcbiAgICog0J/QvtCy0L7RgNCw0YfQuNCy0LDQtdGCINCy0LXQutGC0L7RgCDQvdCwIGBcImFuZ2xlXCJgINGD0LPQvtC7INGBINGB0L7RhdGA0LDQvdC10L3QuNC10Lwg0LTQu9C40L3Riy5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNyb3RhdGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkucm90YXRlKCA1ICogTWF0aC5QSSAvIDE4MCApOyAvLyBWZWN0b3IyRCB7IHg6IDMuODEwNDY3MzA2ODcxNjY2LCB5OiAyLjM0MTAxMjM2NzE3NDEyMzYgfVxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj7QmNGB0L/QvtC70YzQt9GD0Y8g0LPRgNGD0LTRg9GB0Ys8L2NhcHRpb24+XG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnJvdGF0ZSggNSApOyAvLyBWZWN0b3IyRCB7IHg6IDMuODEwNDY3MzA2ODcxNjY2LCB5OiAyLjM0MTAxMjM2NzE3NDEyMzYgfVxuICAgKi9cbiAgcm90YXRlOiBmdW5jdGlvbiByb3RhdGUgKCBhbmdsZSApXG4gIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcblxuICAgIHZhciBjLCBzO1xuXG4gICAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgICAgYW5nbGUgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICB9XG5cbiAgICBjID0gTWF0aC5jb3MoIGFuZ2xlICk7XG4gICAgcyA9IE1hdGguc2luKCBhbmdsZSApO1xuXG4gICAgdGhpcy54ID0gKCB4ICogYyApIC0gKCB5ICogcyApO1xuICAgIHRoaXMueSA9ICggeCAqIHMgKSArICggeSAqIGMgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRgtC10LrRg9GJ0LXQtSDQvdCw0L/RgNCw0LLQu9C10L3QuNC1INCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI2dldEFuZ2xlXG4gICAqIEByZXR1cm4ge251bWJlcn0g0J3QsNC/0YDQsNCy0LvQtdC90LjQtSAo0YPQs9C+0LspINCyINCz0YDQsNC00YPRgdCw0YUg0LjQu9C4INGA0LDQtNC40LDQvdCw0YUuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMSwgMSApLmdldEFuZ2xlKCk7IC8vIC0+IDAuNzg1Mzk4MTYzMzk3NDQ4M1xuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj7QmNGB0L/QvtC70YzQt9GD0Y8g0LPRgNGD0LTRg9GB0Ys8L2NhcHRpb24+XG4gICAqIG5ldyBWZWN0b3IyRCggMSwgMSApLmdldEFuZ2xlKCk7IC8vIC0+IDQ1XG4gICAqL1xuICBnZXRBbmdsZTogZnVuY3Rpb24gZ2V0QW5nbGUgKClcbiAge1xuICAgIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICAgIHJldHVybiBNYXRoLmF0YW4yKCB0aGlzLnksIHRoaXMueCApICogMTgwIC8gTWF0aC5QSTtcbiAgICB9XG5cbiAgICByZXR1cm4gTWF0aC5hdGFuMiggdGhpcy55LCB0aGlzLnggKTtcbiAgfSxcblxuICAvKipcbiAgICog0J7Qs9GA0LDQvdC40YfQuNCy0LDQtdGCINC00LvQuNC90YMg0LLQtdC60YLQvtGA0LAg0LTQviBgXCJ2YWx1ZVwiYC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNsaW1pdFxuICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWUg0JzQsNC60YHQuNC80LDQu9GM0L3QsNGPINC00LvQuNC90LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCAxLCAxICkubGltaXQoIDEgKTsgLy8gVmVjdG9yMkQgeyB4OiAwLjcwNzEwNjc4MTE4NjU0NzUsIHk6IDAuNzA3MTA2NzgxMTg2NTQ3NSB9XG4gICAqL1xuICBsaW1pdDogZnVuY3Rpb24gbGltaXQgKCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgbWFnID0gdGhpcy5tYWdTcSgpO1xuXG4gICAgaWYgKCBtYWcgPiB2YWx1ZSAqIHZhbHVlICkge1xuICAgICAgdGhpcy5kaXYoIE1hdGguc3FydCggbWFnICkgKS5tdWwoIHZhbHVlICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC00LvQuNC90YMg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjbWFnXG4gICAqIEByZXR1cm4ge251bWJlcn0g0JTQu9C40L3QsCDQstC10LrRgtC+0YDQsC5cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCAyLCAyICkubWFnKCk7IC8vIC0+IDIuODI4NDI3MTI0NzQ2MTkwM1xuICAgKi9cbiAgbWFnOiBmdW5jdGlvbiBtYWcgKClcbiAge1xuICAgIHJldHVybiBNYXRoLnNxcnQoIHRoaXMubWFnU3EoKSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQtNC70LjQvdGDINCy0LXQutGC0L7RgNCwINCyINC60LLQsNC00YDQsNGC0LUuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjbWFnU3FcbiAgICogQHJldHVybiB7bnVtYmVyfSDQlNC70LjQvdCwINCy0LXQutGC0L7RgNCwINCyINC60LLQsNC00YDQsNGC0LUuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMiwgMiApLm1hZ1NxKCk7IC8vIC0+IDhcbiAgICovXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC60LvQvtC9INCy0LXQutGC0L7RgNCwLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI2Nsb25lXG4gICAqIEByZXR1cm4ge3Y2LkFic3RyYWN0VmVjdG9yfSDQmtC70L7QvSDQstC10LrRgtC+0YDQsC5cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkuY2xvbmUoKTtcbiAgICovXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstC10LrRgtC+0YDQsCAocHJldHRpZmllZCkuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjdG9TdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQuMzIxLCAyLjM0NSApLnRvU3RyaW5nKCk7IC8vIC0+IFwidjYuVmVjdG9yMkQgeyB4OiA0LjMyLCB5OiAyLjM1IH1cIlxuICAgKi9cblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQuNGB0YLQsNC90YbQuNGOINC80LXQttC00YMg0LTQstGD0LzRjyDQstC10LrRgtC+0YDQsNC80LguXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjZGlzdFxuICAgKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCU0YDRg9Cz0L7QuSAo0LLRgtC+0YDQvtC5KSDQstC10LrRgtC+0YAuXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCAzLCAzICkuZGlzdCggbmV3IFZlY3RvcjJEKCAxLCAxICkgKTsgLy8gLT4gMi44Mjg0MjcxMjQ3NDYxOTAzXG4gICAqL1xuXG4gIGNvbnN0cnVjdG9yOiBBYnN0cmFjdFZlY3RvclxufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3Rvci5fZnJvbUFuZ2xlXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gVmVjdG9yIHtAbGluayB2Ni5WZWN0b3IyRH0sIHtAbGluayB2Ni5WZWN0b3IzRH0uXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgYW5nbGVcbiAqIEByZXR1cm4ge3Y2LkFic3RyYWN0VmVjdG9yfVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5mcm9tQW5nbGVcbiAqL1xuQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZSA9IGZ1bmN0aW9uIF9mcm9tQW5nbGUgKCBWZWN0b3IsIGFuZ2xlIClcbntcbiAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgIGFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gIH1cblxuICByZXR1cm4gbmV3IFZlY3RvciggTWF0aC5jb3MoIGFuZ2xlICksIE1hdGguc2luKCBhbmdsZSApICk7XG59O1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINGA0LDQvdC00L7QvNC90YvQuSDQstC10LrRgtC+0YAuXG4gKiBAdmlydHVhbFxuICogQHN0YXRpY1xuICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3Rvci5yYW5kb21cbiAqIEByZXR1cm4ge3Y2LkFic3RyYWN0VmVjdG9yfSDQktC+0LfQstGA0LDRidCw0LXRgiDQvdC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdGL0Lkg0LLQtdC60YLQvtGAINGBINGA0LDQvdC00L7QvNC90YvQvCDQvdCw0L/RgNCw0LLQu9C10L3QuNC10LwuXG4gKi9cblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQstC10LrRgtC+0YAg0YEg0L3QsNC/0YDQsNCy0LvQtdC90LjQtdC8INGA0LDQstC90YvQvCBgXCJhbmdsZVwiYC5cbiAqIEB2aXJ0dWFsXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yLmZyb21BbmdsZVxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgIGFuZ2xlINCd0LDQv9GA0LDQstC70LXQvdC40LUg0LLQtdC60YLQvtGA0LAuXG4gKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0L3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3Ri9C5INCy0LXQutGC0L7RgC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFic3RyYWN0VmVjdG9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2V0dGluZ3MgICAgICAgPSByZXF1aXJlKCAnLi4vc2V0dGluZ3MnICk7XG52YXIgQWJzdHJhY3RWZWN0b3IgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFZlY3RvcicgKTtcblxuLyoqXG4gKiAyRCDQstC10LrRgtC+0YAuXG4gKiBAY29uc3RydWN0b3IgdjYuVmVjdG9yMkRcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0VmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0gWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSBZINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICogQGV4YW1wbGVcbiAqIHZhciBWZWN0b3IyRCA9IHJlcXVpcmUoICd2Ni5qcy9tYXRoL1ZlY3RvcjJEJyApO1xuICogdmFyIHBvc2l0aW9uID0gbmV3IFZlY3RvcjJEKCA0LCAyICk7IC8vIFZlY3RvcjJEIHsgeDogNCwgeTogMiB9XG4gKi9cbmZ1bmN0aW9uIFZlY3RvcjJEICggeCwgeSApXG57XG4gIC8qKlxuICAgKiBYINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlZlY3RvcjJEI3hcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHggPSBuZXcgVmVjdG9yMkQoIDQsIDIgKS54OyAvLyAtPiA0XG4gICAqL1xuXG4gIC8qKlxuICAgKiBZINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlZlY3RvcjJEI3lcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHkgPSBuZXcgVmVjdG9yMkQoIDQsIDIgKS55OyAvLyAtPiAyXG4gICAqL1xuXG4gIHRoaXMuc2V0KCB4LCB5ICk7XG59XG5cblZlY3RvcjJELnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0VmVjdG9yLnByb3RvdHlwZSApO1xuVmVjdG9yMkQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVmVjdG9yMkQ7XG5cbi8qKlxuICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNzZXRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQndC+0LLQsNGPIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0J3QvtCy0LDRjyBZINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLnNldCggNCwgMiApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICggeCwgeSApXG57XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC6INC60L7QvtGA0LTQuNC90LDRgtCw0LwgWCDQuCBZINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2FkZFxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3Qvi5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5hZGQoIDQsIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiA0LCB5OiAyIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZCAoIHgsIHkgKVxue1xuICB0aGlzLnggKz0geCB8fCAwO1xuICB0aGlzLnkgKz0geSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JLRi9GH0LjRgtCw0LXRgiDQuNC3INC60L7QvtGA0LTQuNC90LDRgiBYINC4IFkg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC1INC/0LDRgNCw0LzQtdGC0YDRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjc3ViXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINCy0YvRh9GC0LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5zdWIoIDQsIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiAtNCwgeTogLTIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24gc3ViICggeCwgeSApXG57XG4gIHRoaXMueCAtPSB4IHx8IDA7XG4gIHRoaXMueSAtPSB5IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQo9C80L3QvtC20LDQtdGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIGB2YWx1ZWAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI211bFxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCn0LjRgdC70L4sINC90LAg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0YPQvNC90L7QttC40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5tdWwoIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiA4LCB5OiA0IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLm11bCA9IGZ1bmN0aW9uIG11bCAoIHZhbHVlIClcbntcbiAgdGhpcy54ICo9IHZhbHVlO1xuICB0aGlzLnkgKj0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIGB2YWx1ZWAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2RpdlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCn0LjRgdC70L4sINC90LAg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0YDQsNC30LTQtdC70LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmRpdiggMiApOyAvLyBWZWN0b3IyRCB7IHg6IDIsIHk6IDEgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuZGl2ID0gZnVuY3Rpb24gZGl2ICggdmFsdWUgKVxue1xuICB0aGlzLnggLz0gdmFsdWU7XG4gIHRoaXMueSAvPSB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjZG90XG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt4PTBdXG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt5PTBdXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkuZGl2KCAyLCAzICk7IC8vIDE0LCDQv9C+0YLQvtC80YMg0YfRgtC+OiBcIig0ICogMikgKyAoMiAqIDMpID0gOCArIDYgPSAxNFwiXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiBkb3QgKCB4LCB5IClcbntcbiAgcmV0dXJuICggdGhpcy54ICogKCB4IHx8IDAgKSApICtcbiAgICAgICAgICggdGhpcy55ICogKCB5IHx8IDAgKSApO1xufTtcblxuLyoqXG4gKiDQmNC90YLQtdGA0L/QvtC70LjRgNGD0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNsZXJwXG4gKiBAcGFyYW0ge251bWJlcn0geFxuICogQHBhcmFtIHtudW1iZXJ9IHlcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmxlcnAoIDgsIDQsIDAuNSApOyAvLyBWZWN0b3IyRCB7IHg6IDYsIHk6IDMgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uICggeCwgeSwgdmFsdWUgKVxue1xuICB0aGlzLnggKz0gKCB4IC0gdGhpcy54ICkgKiB2YWx1ZSB8fCAwO1xuICB0aGlzLnkgKz0gKCB5IC0gdGhpcy55ICkgKiB2YWx1ZSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JrQvtC/0LjRgNGD0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNzZXRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INGB0LrQvtC/0LjRgNC+0LLQsNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuc2V0VmVjdG9yKCBuZXcgVmVjdG9yMkQoIDQsIDIgKSApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc2V0VmVjdG9yID0gZnVuY3Rpb24gc2V0VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc2V0KCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2FkZFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LTQvtCx0LDQstC40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5hZGRWZWN0b3IoIG5ldyBWZWN0b3IyRCggNCwgMiApICk7IC8vIFZlY3RvcjJEIHsgeDogNCwgeTogMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5hZGRWZWN0b3IgPSBmdW5jdGlvbiBhZGRWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5hZGQoIHZlY3Rvci54LCB2ZWN0b3IueSApO1xufTtcblxuLyoqXG4gKiDQktGL0YfQuNGC0LDQtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI3N1YlZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LLRi9GH0LXRgdGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuc3ViVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDQsIDIgKSApOyAvLyBWZWN0b3IyRCB7IHg6IC00LCB5OiAtMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5zdWJWZWN0b3IgPSBmdW5jdGlvbiBzdWJWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5zdWIoIHZlY3Rvci54LCB2ZWN0b3IueSApO1xufTtcblxuLyoqXG4gKiDQo9C80L3QvtC20LDQtdGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIFgg0LggWSDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbXVsVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGAINC00LvRjyDRg9C80L3QvtC20LXQvdC40Y8uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkubXVsVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDIsIDMgKSApOyAvLyBWZWN0b3IyRCB7IHg6IDgsIHk6IDYgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUubXVsVmVjdG9yID0gZnVuY3Rpb24gbXVsVmVjdG9yICggdmVjdG9yIClcbntcbiAgdGhpcy54ICo9IHZlY3Rvci54O1xuICB0aGlzLnkgKj0gdmVjdG9yLnk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIFgg0LggWSDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjZGl2VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQvdCwINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5kaXZWZWN0b3IoIG5ldyBWZWN0b3IyRCggMiwgMC41ICkgKTsgLy8gVmVjdG9yMkQgeyB4OiAyLCB5OiA0IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmRpdlZlY3RvciA9IGZ1bmN0aW9uIGRpdlZlY3RvciAoIHZlY3RvciApXG57XG4gIHRoaXMueCAvPSB2ZWN0b3IueDtcbiAgdGhpcy55IC89IHZlY3Rvci55O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNkb3RWZWN0b3JcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5kb3RWZWN0b3IoIG5ldyBWZWN0b3IyRCggMywgNSApICk7IC8vIC0+IDIyXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kb3RWZWN0b3IgPSBmdW5jdGlvbiBkb3RWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5kb3QoIHZlY3Rvci54LCB2ZWN0b3IueSApO1xufTtcblxuLyoqXG4gKiDQmNC90YLQtdGA0L/QvtC70LjRgNGD0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0LzQtdC20LTRgyDQtNGA0YPQs9C40Lwg0LLQtdC60YLQvtGA0L7QvC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbGVycFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmxlcnBWZWN0b3IoIG5ldyBWZWN0b3IyRCggMiwgMSApLCAwLjUgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLCB5OiAxLjUgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUubGVycFZlY3RvciA9IGZ1bmN0aW9uIGxlcnBWZWN0b3IgKCB2ZWN0b3IsIHZhbHVlIClcbntcbiAgcmV0dXJuIHRoaXMubGVycCggdmVjdG9yLngsIHZlY3Rvci55LCB2YWx1ZSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbWFnU3FcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLm1hZ1NxID0gZnVuY3Rpb24gbWFnU3EgKClcbntcbiAgcmV0dXJuICggdGhpcy54ICogdGhpcy54ICkgKyAoIHRoaXMueSAqIHRoaXMueSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjY2xvbmVcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUgKClcbntcbiAgcmV0dXJuIG5ldyBWZWN0b3IyRCggdGhpcy54LCB0aGlzLnkgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2Rpc3RcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmRpc3QgPSBmdW5jdGlvbiBkaXN0ICggdmVjdG9yIClcbntcbiAgdmFyIHggPSB2ZWN0b3IueCAtIHRoaXMueDtcbiAgdmFyIHkgPSB2ZWN0b3IueSAtIHRoaXMueTtcbiAgcmV0dXJuIE1hdGguc3FydCggKCB4ICogeCApICsgKCB5ICogeSApICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCN0b1N0cmluZ1xuICovXG5WZWN0b3IyRC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKVxue1xuICByZXR1cm4gJ3Y2LlZlY3RvcjJEIHsgeDogJyArIHRoaXMueC50b0ZpeGVkKCAyICkgKyAnLCB5OiAnICsgdGhpcy55LnRvRml4ZWQoIDIgKSArICcgfSc7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQucmFuZG9tXG4gKiBAc2VlIHY2LkFic3RyYWN0VmVjdG9yLnJhbmRvbVxuICovXG5WZWN0b3IyRC5yYW5kb20gPSBmdW5jdGlvbiByYW5kb20gKClcbntcbiAgdmFyIHZhbHVlO1xuXG4gIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICB2YWx1ZSA9IDM2MDtcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IE1hdGguUEkgKiAyO1xuICB9XG5cbiAgcmV0dXJuIFZlY3RvcjJELmZyb21BbmdsZSggTWF0aC5yYW5kb20oKSAqIHZhbHVlICk7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQuZnJvbUFuZ2xlXG4gKiBAc2VlIHY2LkFic3RyYWN0VmVjdG9yLmZyb21BbmdsZVxuICovXG5WZWN0b3IyRC5mcm9tQW5nbGUgPSBmdW5jdGlvbiBmcm9tQW5nbGUgKCBhbmdsZSApXG57XG4gIHJldHVybiBBYnN0cmFjdFZlY3Rvci5fZnJvbUFuZ2xlKCBWZWN0b3IyRCwgYW5nbGUgKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yMkQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBBYnN0cmFjdFZlY3RvciA9IHJlcXVpcmUoICcuL0Fic3RyYWN0VmVjdG9yJyApO1xuXG4vKipcbiAqIDNEINCy0LXQutGC0L7RgC5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5WZWN0b3IzRFxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RWZWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSBYINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0gWiDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgVmVjdG9yM0QgPSByZXF1aXJlKCAndjYuanMvbWF0aC9WZWN0b3IzRCcgKTtcbiAqIHZhciBwb3NpdGlvbiA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDMgfVxuICovXG5mdW5jdGlvbiBWZWN0b3IzRCAoIHgsIHksIHogKVxue1xuICAvKipcbiAgICogWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IzRCN4XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB4ID0gbmV3IFZlY3RvcjNEKCA0LCAyLCAzICkueDsgLy8gLT4gNFxuICAgKi9cblxuICAvKipcbiAgICogWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IzRCN5XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB5ID0gbmV3IFZlY3RvcjNEKCA0LCAyLCAzICkueTsgLy8gLT4gMlxuICAgKi9cblxuICAvKipcbiAgICogWiDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IzRCN6XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB6ID0gbmV3IFZlY3RvcjNEKCA0LCAyLCAzICkuejsgLy8gLT4gM1xuICAgKi9cblxuICB0aGlzLnNldCggeCwgeSwgeiApO1xufVxuXG5WZWN0b3IzRC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdFZlY3Rvci5wcm90b3R5cGUgKTtcblZlY3RvcjNELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFZlY3RvcjNEO1xuXG4vKipcbiAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3NldFxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCd0L7QstCw0Y8gWCDQutC+0L7RgNC00LjQvdCw0YLQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQndC+0LLQsNGPIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0g0J3QvtCy0LDRjyBaINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLnNldCggNCwgMiwgNiApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICggeCwgeSwgeiApXG57XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xuICB0aGlzLnogPSB6IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC+0LHQsNCy0LvRj9C10YIg0Log0LrQvtC+0YDQtNC40L3QsNGC0LDQvCBYLCBZLCDQuCBaINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2FkZFxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbej0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvdC+LlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLmFkZCggNCwgMiwgNiApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkICggeCwgeSwgeiApXG57XG4gIHRoaXMueCArPSB4IHx8IDA7XG4gIHRoaXMueSArPSB5IHx8IDA7XG4gIHRoaXMueiArPSB6IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQktGL0YfQuNGC0LDQtdGCINC40Lcg0LrQvtC+0YDQtNC40L3QsNGCIFgsIFksINC4IFog0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC1INC/0LDRgNCw0LzQtdGC0YDRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0Qjc3ViXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINCy0YvRh9GC0LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbej0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LLRi9GH0YLQtdC90L4uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuc3ViKCA0LCAyLCA2ICk7IC8vIFZlY3RvcjNEIHsgeDogLTQsIHk6IC0yLCB6OiAtNiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbiBzdWIgKCB4LCB5LCB6IClcbntcbiAgdGhpcy54IC09IHggfHwgMDtcbiAgdGhpcy55IC09IHkgfHwgMDtcbiAgdGhpcy56IC09IHogfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCj0LzQvdC+0LbQsNC10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIGB2YWx1ZWAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI211bFxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCn0LjRgdC70L4sINC90LAg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0YPQvNC90L7QttC40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5tdWwoIDIgKTsgLy8gVmVjdG9yM0QgeyB4OiA4LCB5OiA0LCB6OiAxMiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5tdWwgPSBmdW5jdGlvbiBtdWwgKCB2YWx1ZSApXG57XG4gIHRoaXMueCAqPSB2YWx1ZTtcbiAgdGhpcy55ICo9IHZhbHVlO1xuICB0aGlzLnogKj0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNkaXZcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGA0LDQt9C00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5kaXYoIDIgKTsgLy8gVmVjdG9yM0QgeyB4OiAyLCB5OiAxLCB6OiAzIH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmRpdiA9IGZ1bmN0aW9uIGRpdiAoIHZhbHVlIClcbntcbiAgdGhpcy54IC89IHZhbHVlO1xuICB0aGlzLnkgLz0gdmFsdWU7XG4gIHRoaXMueiAvPSB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZG90XG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt4PTBdXG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt5PTBdXG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt6PTBdXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkuZG90KCAyLCAzLCA0ICk7IC8vIC0+IDM4LCDQv9C+0YLQvtC80YMg0YfRgtC+OiBcIig0ICogMikgKyAoMiAqIDMpICsgKDYgKiA0KSA9IDggKyA2ICsgMjQgPSAzOFwiXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiBkb3QgKCB4LCB5LCB6IClcbntcbiAgcmV0dXJuICggdGhpcy54ICogKCB4IHx8IDAgKSApICtcbiAgICAgICAgICggdGhpcy55ICogKCB5IHx8IDAgKSApICtcbiAgICAgICAgICggdGhpcy56ICogKCB6IHx8IDAgKSApO1xufTtcblxuLyoqXG4gKiDQmNC90YLQtdGA0L/QvtC70LjRgNGD0LXRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC80LXQttC00YMg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC80Lgg0L/QsNGA0LDQvNC10YLRgNCw0LzQuC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbGVycFxuICogQHBhcmFtIHtudW1iZXJ9IHhcbiAqIEBwYXJhbSB7bnVtYmVyfSB5XG4gKiBAcGFyYW0ge251bWJlcn0gelxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubGVycCggOCwgNCwgMTIsIDAuNSApOyAvLyBWZWN0b3IzRCB7IHg6IDYsIHk6IDMsIHo6IDkgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uICggeCwgeSwgeiwgdmFsdWUgKVxue1xuICB0aGlzLnggKz0gKCB4IC0gdGhpcy54ICkgKiB2YWx1ZSB8fCAwO1xuICB0aGlzLnkgKz0gKCB5IC0gdGhpcy55ICkgKiB2YWx1ZSB8fCAwO1xuICB0aGlzLnogKz0gKCB6IC0gdGhpcy56ICkgKiB2YWx1ZSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JrQvtC/0LjRgNGD0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNzZXRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INGB0LrQvtC/0LjRgNC+0LLQsNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuc2V0VmVjdG9yKCBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc2V0VmVjdG9yID0gZnVuY3Rpb24gc2V0VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc2V0KCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNhZGRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00L7QsdCw0LLQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuYWRkVmVjdG9yKCBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuYWRkVmVjdG9yID0gZnVuY3Rpb24gYWRkVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuYWRkKCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCS0YvRh9C40YLQsNC10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0Qjc3ViVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQstGL0YfQtdGB0YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5zdWJWZWN0b3IoIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApICk7IC8vIFZlY3RvcjNEIHsgeDogLTQsIHk6IC0yLCB6OiAtNiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5zdWJWZWN0b3IgPSBmdW5jdGlvbiBzdWJWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5zdWIoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnogKTtcbn07XG5cbi8qKlxuICog0KPQvNC90L7QttCw0LXRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgWCwgWSwg0LggWiDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbXVsVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGAINC00LvRjyDRg9C80L3QvtC20LXQvdC40Y8uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubXVsVmVjdG9yKCBuZXcgVmVjdG9yM0QoIDIsIDMsIDQgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDgsIHk6IDYsIHo6IDI0IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLm11bFZlY3RvciA9IGZ1bmN0aW9uIG11bFZlY3RvciAoIHZlY3RvciApXG57XG4gIHRoaXMueCAqPSB2ZWN0b3IueDtcbiAgdGhpcy55ICo9IHZlY3Rvci55O1xuICB0aGlzLnogKj0gdmVjdG9yLno7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBYLCBZLCDQuCBaINC00YDRg9Cz0L7Qs9C+INCy0LXQutGC0L7RgNCwLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNkaXZWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC90LAg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LTQtdC70LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmRpdlZlY3RvciggbmV3IFZlY3RvcjNEKCAyLCAwLjUsIDQgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDIsIHk6IDQsIHo6IDEuNSB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kaXZWZWN0b3IgPSBmdW5jdGlvbiBkaXZWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICB0aGlzLnggLz0gdmVjdG9yLng7XG4gIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgdGhpcy56IC89IHZlY3Rvci56O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNkb3RWZWN0b3JcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5kb3RWZWN0b3IoIG5ldyBWZWN0b3IzRCggMiwgMywgLTIgKSApOyAvLyAtPiAyXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kb3RWZWN0b3IgPSBmdW5jdGlvbiBkb3RWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5kb3QoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnogKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvNC10LbQtNGDINC00YDRg9Cz0LjQvCDQstC10LrRgtC+0YDQvtC8LlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNsZXJwVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgIHZhbHVlXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubGVycFZlY3RvciggbmV3IFZlY3RvcjNEKCA4LCA0LCAxMiApLCAwLjUgKTsgLy8gVmVjdG9yM0QgeyB4OiA2LCB5OiAzLCB6OiA5IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmxlcnBWZWN0b3IgPSBmdW5jdGlvbiBsZXJwVmVjdG9yICggdmVjdG9yLCB2YWx1ZSApXG57XG4gIHJldHVybiB0aGlzLmxlcnAoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnosIHZhbHVlICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNtYWdTcVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUubWFnU3EgPSBmdW5jdGlvbiBtYWdTcSAoKVxue1xuICByZXR1cm4gKCB0aGlzLnggKiB0aGlzLnggKSArICggdGhpcy55ICogdGhpcy55ICkgKyAoIHRoaXMueiAqIHRoaXMueiApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjY2xvbmVcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUgKClcbntcbiAgcmV0dXJuIG5ldyBWZWN0b3IzRCggdGhpcy54LCB0aGlzLnksIHRoaXMueiApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZGlzdFxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZGlzdCA9IGZ1bmN0aW9uIGRpc3QgKCB2ZWN0b3IgKVxue1xuICB2YXIgeCA9IHZlY3Rvci54IC0gdGhpcy54O1xuICB2YXIgeSA9IHZlY3Rvci55IC0gdGhpcy55O1xuICB2YXIgeiA9IHZlY3Rvci56IC0gdGhpcy56O1xuICByZXR1cm4gTWF0aC5zcXJ0KCAoIHggKiB4ICkgKyAoIHkgKiB5ICkgKyAoIHogKiB6ICkgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3RvU3RyaW5nXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpXG57XG4gIHJldHVybiAndjYuVmVjdG9yM0QgeyB4OiAnICsgdGhpcy54LnRvRml4ZWQoIDIgKSArICcsIHk6ICcgKyB0aGlzLnkudG9GaXhlZCggMiApICsgJywgejogJyArIHRoaXMuei50b0ZpeGVkKCAyICkgKyAnIH0nO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNELnJhbmRvbVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5yYW5kb21cbiAqL1xuVmVjdG9yM0QucmFuZG9tID0gZnVuY3Rpb24gcmFuZG9tICgpXG57XG4gIC8vIFVzZSB0aGUgZXF1YWwtYXJlYSBwcm9qZWN0aW9uIGFsZ29yaXRobS5cbiAgdmFyIHRoZXRhID0gTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgKiAyO1xuICB2YXIgeiAgICAgPSAoIE1hdGgucmFuZG9tKCkgKiAyICkgLSAxO1xuICB2YXIgbiAgICAgPSBNYXRoLnNxcnQoIDEgLSAoIHogKiB6ICkgKTtcbiAgcmV0dXJuIG5ldyBWZWN0b3IzRCggbiAqIE1hdGguY29zKCB0aGV0YSApLCBuICogTWF0aC5zaW4oIHRoZXRhICksIHogKTtcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRC5mcm9tQW5nbGVcbiAqIEBzZWUgdjYuQWJzdHJhY3RWZWN0b3IuZnJvbUFuZ2xlXG4gKi9cblZlY3RvcjNELmZyb21BbmdsZSA9IGZ1bmN0aW9uIGZyb21BbmdsZSAoIGFuZ2xlIClcbntcbiAgcmV0dXJuIEFic3RyYWN0VmVjdG9yLl9mcm9tQW5nbGUoIFZlY3RvcjNELCBhbmdsZSApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3IzRDtcbiIsIi8qIGVzbGludCBsaW5lcy1hcm91bmQtZGlyZWN0aXZlOiBvZmYgKi9cbi8qIGVzbGludCBsaW5lcy1hcm91bmQtY29tbWVudDogb2ZmICovXG4ndXNlIHN0cmljdCc7XG52YXIgZ2V0RWxlbWVudFcgPSByZXF1aXJlKCAncGVha28vZ2V0LWVsZW1lbnQtdycgKTtcbnZhciBnZXRFbGVtZW50SCA9IHJlcXVpcmUoICdwZWFrby9nZXQtZWxlbWVudC1oJyApO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICk7XG52YXIgY3JlYXRlUG9seWdvbiA9IHJlcXVpcmUoICcuLi9pbnRlcm5hbC9jcmVhdGVfcG9seWdvbicgKTtcbnZhciBwb2x5Z29ucyA9IHJlcXVpcmUoICcuLi9pbnRlcm5hbC9wb2x5Z29ucycgKTtcbnZhciBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvc2V0X2RlZmF1bHRfZHJhd2luZ19zZXR0aW5ncycgKTtcbnZhciBnZXRXZWJHTCA9IHJlcXVpcmUoICcuL2ludGVybmFsL2dldF93ZWJnbCcgKTtcbnZhciBjb3B5RHJhd2luZ1NldHRpbmdzID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvY29weV9kcmF3aW5nX3NldHRpbmdzJyApO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25YID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25YO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25ZID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25ZO1xudmFyIG9wdGlvbnMgPSByZXF1aXJlKCAnLi9zZXR0aW5ncycgKTtcbi8qKlxuICog0JDQsdGB0YLRgNCw0LrRgtC90YvQuSDQutC70LDRgdGBINGA0LXQvdC00LXRgNC10YDQsC5cbiAqIEBhYnN0cmFjdFxuICogQGNvbnN0cnVjdG9yIHY2LkFic3RyYWN0UmVuZGVyZXJcbiAqIEBzZWUgdjYuUmVuZGVyZXJHTFxuICogQHNlZSB2Ni5SZW5kZXJlcjJEXG4gKiBAZXhhbXBsZVxuICogdmFyIEFic3RyYWN0UmVuZGVyZXIgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyJyApO1xuICovXG5mdW5jdGlvbiBBYnN0cmFjdFJlbmRlcmVyICgpXG57XG4gIHRocm93IEVycm9yKCAnQ2Fubm90IGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgYWJzdHJhY3QgY2xhc3MgKG5ldyB2Ni5BYnN0cmFjdFJlbmRlcmVyKScgKTtcbn1cbkFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlID0ge1xuICAvKipcbiAgICog0JTQvtCx0LDQstC70Y/QtdGCIGBjYW52YXNgINGA0LXQvdC00LXRgNC10YDQsCDQsiBET00uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNhcHBlbmRUb1xuICAgKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudCDQrdC70LXQvNC10L3Rgiwg0LIg0LrQvtGC0L7RgNGL0LkgYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINC00L7Qu9C20LXQvSDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC9LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEFkZCByZW5kZXJlciBpbnRvIERPTS5cbiAgICogcmVuZGVyZXIuYXBwZW5kVG8oIGRvY3VtZW50LmJvZHkgKTtcbiAgICovXG4gIGFwcGVuZFRvOiBmdW5jdGlvbiBhcHBlbmRUbyAoIHBhcmVudCApXG4gIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoIHRoaXMuY2FudmFzICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQo9C00LDQu9GP0LXRgiBgY2FudmFzYCDRgNC10L3QtNC10YDQtdGA0LAg0LjQtyBET00uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNkZXN0cm95XG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVtb3ZlIHJlbmRlcmVyIGZyb20gRE9NLlxuICAgKiByZW5kZXJlci5kZXN0cm95KCk7XG4gICAqL1xuICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95ICgpXG4gIHtcbiAgICB0aGlzLmNhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKCB0aGlzLmNhbnZhcyApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KHQvtGF0YDQsNC90Y/QtdGCINGC0LXQutGD0YnQuNC1INC90LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3B1c2hcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTYXZlIGRyYXdpbmcgc2V0dGluZ3MgKGZpbGwsIGxpbmVXaWR0aC4uLikgKHB1c2ggb250byBzdGFjaykuXG4gICAqIHJlbmRlcmVyLnB1c2goKTtcbiAgICovXG4gIHB1c2g6IGZ1bmN0aW9uIHB1c2ggKClcbiAge1xuICAgIGlmICggdGhpcy5fc3RhY2tbICsrdGhpcy5fc3RhY2tJbmRleCBdICkge1xuICAgICAgY29weURyYXdpbmdTZXR0aW5ncyggdGhpcy5fc3RhY2tbIHRoaXMuX3N0YWNrSW5kZXggXSwgdGhpcyApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zdGFjay5wdXNoKCBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzKCB7fSwgdGhpcyApICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0JLQvtGB0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINC/0YDQtdC00YvQtNGD0YnQuNC1INC90LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvcFxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlc3RvcmUgZHJhd2luZyBzZXR0aW5ncyAoZmlsbCwgbGluZVdpZHRoLi4uKSAodGFrZSBmcm9tIHN0YWNrKS5cbiAgICogcmVuZGVyZXIucG9wKCk7XG4gICAqL1xuICBwb3A6IGZ1bmN0aW9uIHBvcCAoKVxuICB7XG4gICAgaWYgKCB0aGlzLl9zdGFja0luZGV4ID49IDAgKSB7XG4gICAgICBjb3B5RHJhd2luZ1NldHRpbmdzKCB0aGlzLCB0aGlzLl9zdGFja1sgdGhpcy5fc3RhY2tJbmRleC0tIF0gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyggdGhpcywgdGhpcyApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCY0LfQvNC10L3Rj9C10YIg0YDQsNC30LzQtdGAINGA0LXQvdC00LXRgNC10YDQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3Jlc2l6ZVxuICAgKiBAcGFyYW0ge251bWJlcn0gdyDQndC+0LLQsNGPINGI0LjRgNC40L3QsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGgg0J3QvtCy0LDRjyDQstGL0YHQvtGC0LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVzaXplIHJlbmRlcmVyIHRvIDYwMHg0MDAuXG4gICAqIHJlbmRlcmVyLnJlc2l6ZSggNjAwLCA0MDAgKTtcbiAgICovXG4gIHJlc2l6ZTogZnVuY3Rpb24gcmVzaXplICggdywgaCApXG4gIHtcbiAgICB2YXIgY2FudmFzID0gdGhpcy5jYW52YXM7XG4gICAgdmFyIHNjYWxlID0gdGhpcy5zZXR0aW5ncy5zY2FsZTtcbiAgICBjYW52YXMuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gaCArICdweCc7XG4gICAgY2FudmFzLndpZHRoID0gdGhpcy53ID0gTWF0aC5mbG9vciggdyAqIHNjYWxlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgY2FudmFzLmhlaWdodCA9IHRoaXMuaCA9IE1hdGguZmxvb3IoIGggKiBzY2FsZSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0JjQt9C80LXQvdGP0LXRgiDRgNCw0LfQvNC10YAg0YDQtdC90LTQtdGA0LXRgNCwINC00L4g0YDQsNC30LzQtdGA0LAgYGVsZW1lbnRgINGN0LvQtdC80LXQvdGC0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZXNpemVUb1xuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQg0K3Qu9C10LzQtdC90YIsINC00L4g0LrQvtGC0L7RgNC+0LPQviDQvdCw0LTQviDRgNCw0YHRgtGP0L3Rg9GC0Ywg0YDQtdC90LTQtdGA0LXRgC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXNpemUgcmVuZGVyZXIgdG8gbWF0Y2ggPGJvZHkgLz4gc2l6ZXMuXG4gICAqIHJlbmRlcmVyLnJlc2l6ZVRvKCBkb2N1bWVudC5ib2R5ICk7XG4gICAqL1xuICByZXNpemVUbzogZnVuY3Rpb24gcmVzaXplVG8gKCBlbGVtZW50IClcbiAge1xuICAgIHJldHVybiB0aGlzLnJlc2l6ZSggZ2V0RWxlbWVudFcoIGVsZW1lbnQgKSwgZ2V0RWxlbWVudEgoIGVsZW1lbnQgKSApO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC/0L7Qu9C40LPQvtC9LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZHJhd1BvbHlnb25cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB4ICAgICAgICAgICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB5ICAgICAgICAgICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB4UmFkaXVzICAgICAgIFgg0YDQsNC00LjRg9GBINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgeVJhZGl1cyAgICAgICBZINGA0LDQtNC40YPRgSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgIHNpZGVzICAgICAgICAg0JrQvtC70LjRh9C10YHRgtCy0L4g0YHRgtC+0YDQvtC9INC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgcm90YXRpb25BbmdsZSDQo9Cz0L7QuyDQv9C+0LLQvtGA0L7RgtCwINC/0L7Qu9C40LPQvtC90LBcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjRh9GC0L7QsdGLINC90LUg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMIHtAbGluayB2Ni5UcmFuc2Zvcm0jcm90YXRlfSkuXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgZGVncmVlcyAgICAgICDQmNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNCw0LTRg9GB0YsuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBoZXhhZ29uIGF0IFsgNCwgMiBdIHdpdGggcmFkaXVzIDI1LlxuICAgKiByZW5kZXJlci5wb2x5Z29uKCA0LCAyLCAyNSwgMjUsIDYsIDAgKTtcbiAgICovXG4gIGRyYXdQb2x5Z29uOiBmdW5jdGlvbiBkcmF3UG9seWdvbiAoIHgsIHksIHhSYWRpdXMsIHlSYWRpdXMsIHNpZGVzLCByb3RhdGlvbkFuZ2xlLCBkZWdyZWVzIClcbiAge1xuICAgIHZhciBwb2x5Z29uID0gcG9seWdvbnNbIHNpZGVzIF07XG4gICAgaWYgKCAhIHBvbHlnb24gKSB7XG4gICAgICBwb2x5Z29uID0gcG9seWdvbnNbIHNpZGVzIF0gPSBjcmVhdGVQb2x5Z29uKCBzaWRlcyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgIH1cbiAgICBpZiAoIGRlZ3JlZXMgKSB7XG4gICAgICByb3RhdGlvbkFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gICAgfVxuICAgIHRoaXMubWF0cml4LnNhdmUoKTtcbiAgICB0aGlzLm1hdHJpeC50cmFuc2xhdGUoIHgsIHkgKTtcbiAgICB0aGlzLm1hdHJpeC5yb3RhdGUoIHJvdGF0aW9uQW5nbGUgKTtcbiAgICB0aGlzLmRyYXdBcnJheXMoIHBvbHlnb24sIHBvbHlnb24ubGVuZ3RoICogMC41LCBudWxsLCB4UmFkaXVzLCB5UmFkaXVzICk7XG4gICAgdGhpcy5tYXRyaXgucmVzdG9yZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC/0L7Qu9C40LPQvtC9LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcG9seWdvblxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IHggICAgICAgICAgICAgICBYINC60L7QvtGA0LTQuNC90LDRgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0geSAgICAgICAgICAgICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSByICAgICAgICAgICAgICAg0KDQsNC00LjRg9GBINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gc2lkZXMgICAgICAgICAgINCa0L7Qu9C40YfQtdGB0YLQstC+INGB0YLQvtGA0L7QvSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IFtyb3RhdGlvbkFuZ2xlXSDQo9Cz0L7QuyDQv9C+0LLQvtGA0L7RgtCwINC/0L7Qu9C40LPQvtC90LBcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKNGH0YLQvtCx0Ysg0L3QtSDQuNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywge0BsaW5rIHY2LlRyYW5zZm9ybSNyb3RhdGV9KS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGhleGFnb24gYXQgWyA0LCAyIF0gd2l0aCByYWRpdXMgMjUuXG4gICAqIHJlbmRlcmVyLnBvbHlnb24oIDQsIDIsIDI1LCA2ICk7XG4gICAqL1xuICBwb2x5Z29uOiBmdW5jdGlvbiBwb2x5Z29uICggeCwgeSwgciwgc2lkZXMsIHJvdGF0aW9uQW5nbGUgKVxuICB7XG4gICAgaWYgKCBzaWRlcyAlIDEgKSB7XG4gICAgICBzaWRlcyA9IE1hdGguZmxvb3IoIHNpZGVzICogMTAwICkgKiAwLjAxO1xuICAgIH1cbiAgICBpZiAoIHR5cGVvZiByb3RhdGlvbkFuZ2xlID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgIHRoaXMuZHJhd1BvbHlnb24oIHgsIHksIHIsIHIsIHNpZGVzLCAtTWF0aC5QSSAqIDAuNSApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdQb2x5Z29uKCB4LCB5LCByLCByLCBzaWRlcywgcm90YXRpb25BbmdsZSwgb3B0aW9ucy5kZWdyZWVzICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC60LDRgNGC0LjQvdC60YMuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNpbWFnZVxuICAgKiBAcGFyYW0ge3Y2LkFic3RyYWN0SW1hZ2V9IGltYWdlINCa0LDRgNGC0LjQvdC60LAg0LrQvtGC0L7RgNGD0Y4g0L3QsNC00L4g0L7RgtGA0LjRgdC+0LLQsNGC0YwuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgeCAgICAgWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHkgICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICBbd10gICDQqNC40YDQuNC90LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICBbaF0gICDQktGL0YHQvtGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBDcmVhdGUgaW1hZ2UuXG4gICAqIHZhciBpbWFnZSA9IG5ldyBJbWFnZSggZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoICdpbWFnZScgKSApO1xuICAgKiAvLyBEcmF3IGltYWdlIGF0IFsgNCwgMiBdLlxuICAgKiByZW5kZXJlci5pbWFnZSggaW1hZ2UsIDQsIDIgKTtcbiAgICovXG4gIGltYWdlOiBmdW5jdGlvbiBpbWFnZSAoIGltYWdlLCB4LCB5LCB3LCBoIClcbiAge1xuICAgIGlmICggaW1hZ2UuZ2V0KCkubG9hZGVkICkge1xuICAgICAgaWYgKCB0eXBlb2YgdyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICAgIHcgPSBpbWFnZS5kdztcbiAgICAgIH1cbiAgICAgIGlmICggdHlwZW9mIGggPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICBoID0gaW1hZ2UuZGg7XG4gICAgICB9XG4gICAgICB4ID0gcHJvY2Vzc1JlY3RBbGlnblgoIHRoaXMsIHgsIHcgKTtcbiAgICAgIHggPSBwcm9jZXNzUmVjdEFsaWduWSggdGhpcywgeSwgaCApO1xuICAgICAgdGhpcy5kcmF3SW1hZ2UoIGltYWdlLCB4LCB5LCB3LCBoICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQtNC70Y8g0L3QsNGH0LDQu9CwINC+0YLRgNC40YHQvtCy0LrQuCDRhNC40LPRg9GA0YsuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSAgIFtvcHRpb25zXSAgICAgINCf0LDRgNCw0LzQtdGC0YDRiyDRhNC40LPRg9GA0YsuXG4gICAqIEBwYXJhbSB7Y29uc3RhbnR9IFtvcHRpb25zLnR5cGVdINCi0LjQvyDRhNC40LPRg9GA0Ys6IFBPSU5UUywgTElORVMuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gQmVnaW4gZHJhd2luZyBQT0lOVFMgc2hhcGUuXG4gICAqIHJlbmRlcmVyLmJlZ2luU2hhcGUoIHsgdHlwZTogdjYuY29uc3RhbnRzLmdldCggJ1BPSU5UUycgKSB9ICk7XG4gICAqIC8vIEJlZ2luIGRyYXdpbmcgc2hhcGUgd2l0aG91dCB0eXBlIChtdXN0IGJlIHBhc3NlZCBsYXRlciBpbiBgZW5kU2hhcGVgKS5cbiAgICogcmVuZGVyZXIuYmVnaW5TaGFwZSgpO1xuICAgKi9cbiAgYmVnaW5TaGFwZTogZnVuY3Rpb24gYmVnaW5TaGFwZSAoIG9wdGlvbnMgKVxuICB7XG4gICAgaWYgKCAhIG9wdGlvbnMgKSB7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIHRoaXMuX3ZlcnRpY2VzLmxlbmd0aCA9IDA7XG4gICAgaWYgKCB0eXBlb2Ygb3B0aW9ucy50eXBlID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgIHRoaXMuX3NoYXBlVHlwZSA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NoYXBlVHlwZSA9IG9wdGlvbnMudHlwZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQstC10YDRiNC40L3RgyDQsiDQutC+0L7RgNC00LjQvdCw0YLQsNGFINC40Lcg0YHQvtC+0YLQstC10YLRgdCy0YPRjtGJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7Qsi5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAcGFyYW0ge251bWJlcn0geCBYINC60L7QvtGA0LTQuNC90LDRgtCwINC90L7QstC+0Lkg0LLQtdGA0YjQuNC90YsuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5IFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L3QvtCy0L7QuSDQstC10YDRiNC40L3Riy5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyByZWN0YW5nbGUgd2l0aCB2ZXJ0aWNlcy5cbiAgICogcmVuZGVyZXIudmVydGV4KCAwLCAwICk7XG4gICAqIHJlbmRlcmVyLnZlcnRleCggMSwgMCApO1xuICAgKiByZW5kZXJlci52ZXJ0ZXgoIDEsIDEgKTtcbiAgICogcmVuZGVyZXIudmVydGV4KCAwLCAxICk7XG4gICAqL1xuICB2ZXJ0ZXg6IGZ1bmN0aW9uIHZlcnRleCAoIHgsIHkgKVxuICB7XG4gICAgdGhpcy5fdmVydGljZXMucHVzaCggTWF0aC5mbG9vciggeCApLCBNYXRoLmZsb29yKCB5ICkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDRhNC40LPRg9GA0YMg0LjQtyDQstC10YDRiNC40L0uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNlbmRTaGFwZVxuICAgKiBAcGFyYW0ge29iamVjdH0gICBbb3B0aW9uc10gICAgICAg0J/QsNGA0LDQvNC10YLRgNGLINGE0LjQs9GD0YDRiy5cbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMuY2xvc2VdINCh0L7QtdC00LjQvdC40YLRjCDQv9C+0YHQu9C10LTQvdGO0Y4g0LLQtdGA0YjQuNC90YMg0YEg0L/QtdGA0LLQvtC5ICjQt9Cw0LrRgNGL0YLRjCDRhNC40LPRg9GA0YMpLlxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSBbb3B0aW9ucy50eXBlXSAg0KLQuNC/INGE0LjQs9GD0YDRiyAo0L3QtdGB0L7QstC80LXRgdGC0LjQvNC+INGBIGBvcHRpb25zLmRyYXdgKS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMuZHJhd10gINCd0LXRgdGC0LDQvdC00LDRgNGC0L3QsNGPINGE0YPQvdC60YbQuNGPINC00LvRjyDQvtGC0YDQuNGB0L7QstC60Lgg0LLRgdC10YUg0LLQtdGA0YjQuNC9ICjQvdC10YHQvtCy0LzQtdGB0YLQuNC80L4g0YEgYG9wdGlvbnMudHlwZWApLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENsb3NlIGFuZCBkcmF3IHNoYXBlLlxuICAgKiByZW5kZXJlci5lbmRTaGFwZSggeyBjbG9zZTogdHJ1ZSB9ICk7XG4gICAqIC8vIERyYXcgd2l0aCBjdXN0b20gZnVuY3Rpb24uXG4gICAqIHJlbmRlcmVyLmVuZFNoYXBlKCB7XG4gICAqICAgZHJhdzogZnVuY3Rpb24gZHJhdyAoIHZlcnRpY2VzIClcbiAgICogICB7XG4gICAqICAgICByZW5kZXJlci5kcmF3QXJyYXlzKCB2ZXJ0aWNlcywgdmVydGljZXMubGVuZ3RoIC8gMiApO1xuICAgKiAgIH1cbiAgICogfSApO1xuICAgKi9cbiAgZW5kU2hhcGU6IGZ1bmN0aW9uIGVuZFNoYXBlICgpXG4gIHtcbiAgICB0aHJvdyBFcnJvciggJ05vdCBpbXBsZW1lbnRlZCcgKTtcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNzYXZlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jc2F2ZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTYXZlIHRyYW5zZm9ybS5cbiAgICogcmVuZGVyZXIuc2F2ZSgpO1xuICAgKi9cbiAgc2F2ZTogZnVuY3Rpb24gc2F2ZSAoKVxuICB7XG4gICAgdGhpcy5tYXRyaXguc2F2ZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3Jlc3RvcmVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNyZXN0b3JlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlc3RvcmUgdHJhbnNmb3JtLlxuICAgKiByZW5kZXJlci5yZXN0b3JlKCk7XG4gICAqL1xuICByZXN0b3JlOiBmdW5jdGlvbiByZXN0b3JlICgpXG4gIHtcbiAgICB0aGlzLm1hdHJpeC5yZXN0b3JlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc2V0VHJhbnNmb3JtXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jc2V0VHJhbnNmb3JtXG4gICAqIEBzZWUgdjYuQ2FtZXJhXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBpZGVudGl0eSB0cmFuc2Zvcm0uXG4gICAqIHJlbmRlcmVyLnNldFRyYW5zZm9ybSggMSwgMCwgMCwgMSwgMCwgMCApO1xuICAgKiAvLyBTZXQgdHJhbnNmb3JtIGZyb20gYHY2LkNhbWVyYWAuXG4gICAqIHJlbmRlcmVyLnNldFRyYW5zZm9ybSggY2FtZXJhICk7XG4gICAqL1xuICBzZXRUcmFuc2Zvcm06IGZ1bmN0aW9uIHNldFRyYW5zZm9ybSAoIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbiAge1xuICAgIHZhciBwb3NpdGlvbiwgem9vbTtcbiAgICBpZiAoIHR5cGVvZiBtMTEgPT09ICdvYmplY3QnICYmIG0xMSAhPT0gbnVsbCApIHtcbiAgICAgIHBvc2l0aW9uID0gbTExLnBvc2l0aW9uO1xuICAgICAgem9vbSA9IG0xMS56b29tO1xuICAgICAgdGhpcy5tYXRyaXguc2V0VHJhbnNmb3JtKCB6b29tLCAwLCAwLCB6b29tLCBwb3NpdGlvblsgMCBdICogem9vbSwgcG9zaXRpb25bIDEgXSAqIHpvb20gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tYXRyaXguc2V0VHJhbnNmb3JtKCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciN0cmFuc2xhdGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSN0cmFuc2xhdGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gVHJhbnNsYXRlIHRyYW5zZm9ybSB0byBbIDQsIDIgXS5cbiAgICogcmVuZGVyZXIudHJhbnNsYXRlKCA0LCAyICk7XG4gICAqL1xuICB0cmFuc2xhdGU6IGZ1bmN0aW9uIHRyYW5zbGF0ZSAoIHgsIHkgKVxuICB7XG4gICAgdGhpcy5tYXRyaXgudHJhbnNsYXRlKCB4LCB5ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcm90YXRlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jcm90YXRlXG4gICAqIEB0b2RvIHJlbmRlcmVyLnNldHRpbmdzLmRlZ3JlZXNcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUm90YXRlIHRyYW5zZm9ybSBvbiA0NSBkZWdyZWVzLlxuICAgKiByZW5kZXJlci5yb3RhdGUoIDQ1ICogTWF0aC5QSSAvIDE4MCApO1xuICAgKi9cbiAgcm90YXRlOiBmdW5jdGlvbiByb3RhdGUgKCBhbmdsZSApXG4gIHtcbiAgICB0aGlzLm1hdHJpeC5yb3RhdGUoIGFuZ2xlICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc2NhbGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNzY2FsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTY2FsZSB0cmFuc2Zvcm0gdHdpY2UuXG4gICAqIHJlbmRlcmVyLnNjYWxlKCAyLCAyICk7XG4gICAqL1xuICBzY2FsZTogZnVuY3Rpb24gc2NhbGUgKCB4LCB5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnNjYWxlKCB4LCB5ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjdHJhbnNmb3JtXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jdHJhbnNmb3JtXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEFwcGx5IHRyYW5zbGF0ZWQgdG8gWyA0LCAyIF0gXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIi5cbiAgICogcmVuZGVyZXIudHJhbnNmb3JtKCAxLCAwLCAwLCAxLCA0LCAyICk7XG4gICAqL1xuICB0cmFuc2Zvcm06IGZ1bmN0aW9uIHRyYW5zZm9ybSAoIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnRyYW5zZm9ybSggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGxpbmVXaWR0aCAo0YjQuNGA0LjQvdGDINC60L7QvdGC0YPRgNCwKS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2xpbmVXaWR0aFxuICAgKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyINCd0L7QstGL0LkgbGluZVdpZHRoLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBgbGluZVdpZHRoYCB0byAxMHB4LlxuICAgKiByZW5kZXJlci5saW5lV2lkdGgoIDEwICk7XG4gICAqL1xuICBsaW5lV2lkdGg6IGZ1bmN0aW9uIGxpbmVXaWR0aCAoIG51bWJlciApXG4gIHtcbiAgICB0aGlzLl9saW5lV2lkdGggPSBudW1iZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgYmFja2dyb3VuZFBvc2l0aW9uWGAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZFBvc2l0aW9uWFxuICAgKiBAcGFyYW0ge251bWJlcn0gICB2YWx1ZVxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB0eXBlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IFwiYmFja2dyb3VuZFBvc2l0aW9uWFwiIGRyYXdpbmcgc2V0dGluZyB0byBDRU5URVIgKGRlZmF1bHQ6IExFRlQpLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25YKCBjb25zdGFudHMuZ2V0KCAnQ0VOVEVSJyApLCBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKTtcbiAgICogcmVuZGVyZXIuYmFja2dyb3VuZFBvc2l0aW9uWCggMC41LCBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25YKCByZW5kZXJlci53IC8gMiApO1xuICAgKi9cbiAgYmFja2dyb3VuZFBvc2l0aW9uWDogZnVuY3Rpb24gYmFja2dyb3VuZFBvc2l0aW9uWCAoIHZhbHVlLCB0eXBlICkgeyBpZiAoIHR5cGVvZiB0eXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlICE9PSBjb25zdGFudHMuZ2V0KCAnVkFMVUUnICkgKSB7IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ0NPTlNUQU5UJyApICkgeyB0eXBlID0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICk7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiTEVGVFwiICkgKSB7IHZhbHVlID0gMDsgfSBlbHNlIGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiQ0VOVEVSXCIgKSApIHsgdmFsdWUgPSAwLjU7IH0gZWxzZSBpZiAoIHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCBcIlJJR0hUXCIgKSApIHsgdmFsdWUgPSAxOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHZhbHVlLiBUaGUga25vd24gYXJlOiAnICsgXCJMRUZUXCIgKyAnLCAnICsgXCJDRU5URVJcIiArICcsICcgKyBcIlJJR0hUXCIgKTsgfSB9IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICkgKSB7IHZhbHVlICo9IHRoaXMudzsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgdmFsdWVgIHR5cGUuIFRoZSBrbm93biBhcmU6IFZBTFVFLCBQRVJDRU5ULCBDT05TVEFOVCcgKTsgfSB9IHRoaXMuX2JhY2tncm91bmRQb3NpdGlvblggPSB2YWx1ZTsgcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgYGJhY2tncm91bmRQb3NpdGlvbllgINC90LDRgdGC0YDQvtC50LrRgyDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRQb3NpdGlvbllcbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgdmFsdWVcbiAgICogQHBhcmFtIHtjb25zdGFudH0gdHlwZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBcImJhY2tncm91bmRQb3NpdGlvbllcIiBkcmF3aW5nIHNldHRpbmcgdG8gTUlERExFIChkZWZhdWx0OiBUT1ApLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25ZKCBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApLCBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKTtcbiAgICogcmVuZGVyZXIuYmFja2dyb3VuZFBvc2l0aW9uWSggMC41LCBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25ZKCByZW5kZXJlci5oIC8gMiApO1xuICAgKi9cbiAgYmFja2dyb3VuZFBvc2l0aW9uWTogZnVuY3Rpb24gYmFja2dyb3VuZFBvc2l0aW9uWSAoIHZhbHVlLCB0eXBlICkgeyBpZiAoIHR5cGVvZiB0eXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlICE9PSBjb25zdGFudHMuZ2V0KCAnVkFMVUUnICkgKSB7IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ0NPTlNUQU5UJyApICkgeyB0eXBlID0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICk7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiVE9QXCIgKSApIHsgdmFsdWUgPSAwOyB9IGVsc2UgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJNSURETEVcIiApICkgeyB2YWx1ZSA9IDAuNTsgfSBlbHNlIGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiQk9UVE9NXCIgKSApIHsgdmFsdWUgPSAxOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHZhbHVlLiBUaGUga25vd24gYXJlOiAnICsgXCJUT1BcIiArICcsICcgKyBcIk1JRERMRVwiICsgJywgJyArIFwiQk9UVE9NXCIgKTsgfSB9IGlmICggdHlwZSA9PT0gY29uc3RhbnRzLmdldCggJ1BFUkNFTlQnICkgKSB7IHZhbHVlICo9IHRoaXMuaDsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgdmFsdWVgIHR5cGUuIFRoZSBrbm93biBhcmU6IFZBTFVFLCBQRVJDRU5ULCBDT05TVEFOVCcgKTsgfSB9IHRoaXMuX2JhY2tncm91bmRQb3NpdGlvblkgPSB2YWx1ZTsgcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgYHJlY3RBbGlnblhgINC90LDRgdGC0YDQvtC50LrRgyDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3RBbGlnblhcbiAgICogQHBhcmFtIHtjb25zdGFudH0gdmFsdWUgYExFRlRgLCBgQ0VOVEVSYCwgYFJJR0hUYC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTZXQgXCJyZWN0QWxpZ25YXCIgZHJhd2luZyBzZXR0aW5nIHRvIENFTlRFUiAoZGVmYXVsdDogTEVGVCkuXG4gICAqIHJlbmRlcmVyLnJlY3RBbGlnblgoIGNvbnN0YW50cy5nZXQoICdDRU5URVInICkgKTtcbiAgICovXG4gIHJlY3RBbGlnblg6IGZ1bmN0aW9uIHJlY3RBbGlnblggKCB2YWx1ZSApIHsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ0xFRlQnICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdDRU5URVInICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdSSUdIVCcgKSApIHsgdGhpcy5fcmVjdEFsaWduWCA9IHZhbHVlOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGByZWN0QWxpZ25gIGNvbnN0YW50LiBUaGUga25vd24gYXJlOiAnICsgXCJMRUZUXCIgKyAnLCAnICsgXCJDRU5URVJcIiArICcsICcgKyBcIlJJR0hUXCIgKTsgfSByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgcmVjdEFsaWduWWAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdEFsaWduWVxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB2YWx1ZSBgVE9QYCwgYE1JRERMRWAsIGBCT1RUT01gLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBcInJlY3RBbGlnbllcIiBkcmF3aW5nIHNldHRpbmcgdG8gTUlERExFIChkZWZhdWx0OiBUT1ApLlxuICAgKiByZW5kZXJlci5yZWN0QWxpZ25ZKCBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApICk7XG4gICAqL1xuICByZWN0QWxpZ25ZOiBmdW5jdGlvbiByZWN0QWxpZ25ZICggdmFsdWUgKSB7IGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdMRUZUJyApIHx8IHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCAnQ0VOVEVSJyApIHx8IHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCAnUklHSFQnICkgKSB7IHRoaXMuX3JlY3RBbGlnblkgPSB2YWx1ZTsgfSBlbHNlIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBgcmVjdEFsaWduYCBjb25zdGFudC4gVGhlIGtub3duIGFyZTogJyArIFwiVE9QXCIgKyAnLCAnICsgXCJNSURETEVcIiArICcsICcgKyBcIkJPVFRPTVwiICk7IH0gcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIg0YbQstC10YIgYHN0cm9rZWAg0L/RgNC4INGA0LjRgdC+0LLQsNC90LjQuCDRh9C10YDQtdC3IHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3R9INC4INGCLtC/LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc3Ryb2tlXG4gICAqIEBwYXJhbSB7bnVtYmVyfGJvb2xlYW58VENvbG9yfSBbcl0g0JXRgdC70Lgg0Y3RgtC+IGBib29sZWFuYCwg0YLQviDRjdGC0L4g0LLQutC70Y7Rh9C40YIg0LjQu9C4INCy0YvQutC70Y7Rh9C40YIgYHN0cm9rZWBcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAo0LrQsNC6INGH0LXRgNC10Lcge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXIjbm9TdHJva2V9KS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYV1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEaXNhYmxlIGFuZCB0aGVuIGVuYWJsZSBgc3Ryb2tlYC5cbiAgICogcmVuZGVyZXIuc3Ryb2tlKCBmYWxzZSApLnN0cm9rZSggdHJ1ZSApO1xuICAgKiAvLyBTZXQgYHN0cm9rZWAgdG8gXCJsaWdodHNreWJsdWVcIi5cbiAgICogcmVuZGVyZXIuc3Ryb2tlKCAnbGlnaHRza3libHVlJyApO1xuICAgKiAvLyBTZXQgYHN0cm9rZWAgZnJvbSBgdjYuUkdCQWAuXG4gICAqIHJlbmRlcmVyLnN0cm9rZSggbmV3IFJHQkEoIDI1NSwgMCwgMCApLnBlcmNlaXZlZEJyaWdodG5lc3MoKSApO1xuICAgKi9cbiAgc3Ryb2tlOiBmdW5jdGlvbiBzdHJva2UgKCByLCBnLCBiLCBhICkgeyBpZiAoIHR5cGVvZiByID09PSAnYm9vbGVhbicgKSB7IHRoaXMuX2RvU3Ryb2tlID0gcjsgfSBlbHNlIHsgaWYgKCB0eXBlb2YgciA9PT0gJ3N0cmluZycgfHwgdGhpcy5fc3Ryb2tlQ29sb3IudHlwZSAhPT0gdGhpcy5zZXR0aW5ncy5jb2xvci50eXBlICkgeyB0aGlzLl9zdHJva2VDb2xvciA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7IH0gZWxzZSB7IHRoaXMuX3N0cm9rZUNvbG9yLnNldCggciwgZywgYiwgYSApOyB9IHRoaXMuX2RvU3Ryb2tlID0gdHJ1ZTsgfSByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiDRhtCy0LXRgiBgZmlsbGAg0L/RgNC4INGA0LjRgdC+0LLQsNC90LjQuCDRh9C10YDQtdC3IHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3R9INC4INGCLtC/LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZmlsbFxuICAgKiBAcGFyYW0ge251bWJlcnxib29sZWFufFRDb2xvcn0gW3JdINCV0YHQu9C4INGN0YLQviBgYm9vbGVhbmAsINGC0L4g0Y3RgtC+INCy0LrQu9GO0YfQuNGCINC40LvQuCDQstGL0LrQu9GO0YfQuNGCIGBmaWxsYFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjQutCw0Log0YfQtdGA0LXQtyB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlciNub0ZpbGx9KS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYV1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEaXNhYmxlIGFuZCB0aGVuIGVuYWJsZSBgZmlsbGAuXG4gICAqIHJlbmRlcmVyLmZpbGwoIGZhbHNlICkuZmlsbCggdHJ1ZSApO1xuICAgKiAvLyBTZXQgYGZpbGxgIHRvIFwibGlnaHRwaW5rXCIuXG4gICAqIHJlbmRlcmVyLmZpbGwoICdsaWdodHBpbmsnICk7XG4gICAqIC8vIFNldCBgZmlsbGAgZnJvbSBgdjYuUkdCQWAuXG4gICAqIHJlbmRlcmVyLmZpbGwoIG5ldyBSR0JBKCAyNTUsIDAsIDAgKS5icmlnaHRuZXNzKCkgKTtcbiAgICovXG4gIGZpbGw6IGZ1bmN0aW9uIGZpbGwgKCByLCBnLCBiLCBhICkgeyBpZiAoIHR5cGVvZiByID09PSAnYm9vbGVhbicgKSB7IHRoaXMuX2RvRmlsbCA9IHI7IH0gZWxzZSB7IGlmICggdHlwZW9mIHIgPT09ICdzdHJpbmcnIHx8IHRoaXMuX2ZpbGxDb2xvci50eXBlICE9PSB0aGlzLnNldHRpbmdzLmNvbG9yLnR5cGUgKSB7IHRoaXMuX2ZpbGxDb2xvciA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7IH0gZWxzZSB7IHRoaXMuX2ZpbGxDb2xvci5zZXQoIHIsIGcsIGIsIGEgKTsgfSB0aGlzLl9kb0ZpbGwgPSB0cnVlOyB9IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCS0YvQutC70Y7Rh9Cw0LXRgiDRgNC40YHQvtCy0LDQvdC40LUg0LrQvtC90YLRg9GA0LAgKHN0cm9rZSkuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNub1N0cm9rZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERpc2FibGUgZHJhd2luZyBzdHJva2UuXG4gICAqIHJlbmRlcmVyLm5vU3Ryb2tlKCk7XG4gICAqL1xuICBub1N0cm9rZTogZnVuY3Rpb24gbm9TdHJva2UgKCkgeyB0aGlzLl9kb1N0cm9rZSA9IGZhbHNlOyByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQktGL0LrQu9GO0YfQsNC10YIg0LfQsNC/0L7Qu9C90LXQvdC40Y8g0YTQvtC90LAgKGZpbGwpLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjbm9GaWxsXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRGlzYWJsZSBmaWxsaW5nLlxuICAgKiByZW5kZXJlci5ub0ZpbGwoKTtcbiAgICovXG4gIG5vRmlsbDogZnVuY3Rpb24gbm9GaWxsICgpIHsgdGhpcy5fZG9GaWxsID0gZmFsc2U7IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCX0LDQv9C+0LvQvdGP0LXRgiDRhNC+0L0g0YDQtdC90LTQtdGA0LXRgNCwINGG0LLQtdGC0L7QvC5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRDb2xvclxuICAgKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtiXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEZpbGwgcmVuZGVyZXIgd2l0aCBcImxpZ2h0cGlua1wiIGNvbG9yLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kQ29sb3IoICdsaWdodHBpbmsnICk7XG4gICAqL1xuICAvKipcbiAgICog0JfQsNC/0L7Qu9C90Y/QtdGCINGE0L7QvSDRgNC10L3QtNC10YDQtdGA0LAg0LrQsNGA0YLQuNC90LrQvtC5LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZEltYWdlXG4gICAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCwg0LrQvtGC0L7RgNCw0Y8g0LTQvtC70LbQvdCwINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0LTQu9GPINGE0L7QvdCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENyZWF0ZSBiYWNrZ3JvdW5kIGltYWdlLlxuICAgKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnYmFja2dyb3VuZC5qcGcnICk7XG4gICAqIC8vIEZpbGwgcmVuZGVyZXIgd2l0aCB0aGUgaW1hZ2UuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRJbWFnZSggSW1hZ2Uuc3RyZXRjaCggaW1hZ2UsIHJlbmRlcmVyLncsIHJlbmRlcmVyLmggKSApO1xuICAgKi9cbiAgLyoqXG4gICAqINCe0YfQuNGJ0LDQtdGCINC60L7QvdGC0LXQutGB0YIuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNjbGVhclxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENsZWFyIHJlbmRlcmVyJ3MgY29udGV4dC5cbiAgICogcmVuZGVyZXIuY2xlYXIoKTtcbiAgICovXG4gIC8qKlxuICAgKiDQntGC0YDQuNGB0L7QstGL0LLQsNC10YIg0L/QtdGA0LXQtNCw0L3QvdGL0LUg0LLQtdGA0YjQuNC90YsuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNkcmF3QXJyYXlzXG4gICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5fSB2ZXJ0cyDQktC10YDRiNC40L3Riywg0LrQvtGC0L7RgNGL0LUg0L3QsNC00L4g0L7RgtGA0LjRgdC+0LLQsNGC0YwuINCV0YHQu9C4INC90LUg0L/QtdGA0LXQtNCw0L3QviDQtNC70Y9cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtAbGluayB2Ni5SZW5kZXJlckdMfSwg0YLQviDQsdGD0LTRg9GCINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0LLQtdGA0YjQuNC90Ysg0LjQt1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0YHRgtCw0L3QtNCw0YDRgtC90L7Qs9C+INCx0YPRhNC10YDQsCAoe0BsaW5rIHY2LlJlbmRlcmVyR0wjYnVmZmVycy5kZWZhdWx0fSkuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICBjb3VudCDQmtC+0LvQuNGH0LXRgdGC0LLQviDQstC10YDRiNC40L0sINC90LDQv9GA0LjQvNC10YA6IDMg0LTQu9GPINGC0YDQtdGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBBIHRyaWFuZ2xlLlxuICAgKiB2YXIgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KCBbXG4gICAqICAgMCwgIDAsXG4gICAqICAgNTAsIDUwLFxuICAgKiAgIDAsICA1MFxuICAgKiBdICk7XG4gICAqXG4gICAqIC8vIERyYXcgdGhlIHRyaWFuZ2xlLlxuICAgKiByZW5kZXJlci5kcmF3QXJyYXlzKCB2ZXJ0aWNlcywgMyApO1xuICAgKi9cbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZHJhd0ltYWdlXG4gICAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCDQutC+0YLQvtGA0YPRjiDQvdCw0LTQviDQvtGC0YDQuNGB0L7QstCw0YLRjC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICB4ICAgICBcIkRlc3RpbmF0aW9uIFhcIi4gWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHkgICAgIFwiRGVzdGluYXRpb24gWVwiLiBZINC60L7QvtGA0LTQuNC90LDRgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgdyAgICAgXCJEZXN0aW5hdGlvbiBXaWR0aFwiLiDQqNC40YDQuNC90LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICBoICAgICBcIkRlc3RpbmF0aW9uIEhlaWdodFwiLiDQktGL0YHQvtGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBDcmVhdGUgaW1hZ2UuXG4gICAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICczMDB4MjAwLnBuZycgKTtcbiAgICogLy8gRHJhdyBpbWFnZSBhdCBbIDAsIDAgXS5cbiAgICogcmVuZGVyZXIuZHJhd0ltYWdlKCBpbWFnZSwgMCwgMCwgNjAwLCA0MDAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LouXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZWN0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gdyDQqNC40YDQuNC90LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGgg0JLRi9GB0L7RgtCwINC/0YDRj9C80L7Rg9Cz0L7Qu9GM0L3QuNC60LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBzcXVhcmUgYXQgWyAyMCwgMjAgXSB3aXRoIHNpemUgODAuXG4gICAqIHJlbmRlcmVyLnJlY3QoIDIwLCAyMCwgODAsIDgwICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC60YDRg9CzLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYXJjXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrRgNGD0LPQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQutGA0YPQs9CwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gciDQoNCw0LTQuNGD0YEg0LrRgNGD0LPQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGNpcmNsZSBhdCBbIDYwLCA2MCBdIHdpdGggcmFkaXVzIDQwLlxuICAgKiByZW5kZXJlci5hcmMoIDYwLCA2MCwgNDAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0LvQuNC90LjRji5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2xpbmVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHgxIFgg0L3QsNGH0LDQu9CwINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MSBZINC90LDRh9Cw0LvQsCDQu9C40L3QuNC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0geDIgWCDQutC+0L3RhtGLINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MiBZINC60L7QvdGG0Ysg0LvQuNC90LjQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGxpbmUgZnJvbSBbIDEwLCAxMCBdIHRvIFsgMjAsIDIwIF0uXG4gICAqIHJlbmRlcmVyLmxpbmUoIDEwLCAxMCwgMjAsIDIwICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINGC0L7Rh9C60YMuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwb2ludFxuICAgKiBAcGFyYW0ge251bWJlcn0geCBYINC60L7QvtGA0LTQuNC90LDRgtCwINGC0L7Rh9C60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5IFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0YLQvtGH0LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IHBvaW50IGF0IFsgNCwgMiBdLlxuICAgKiByZW5kZXJlci5wb2ludCggNCwgMiApO1xuICAgKi9cbiAgY29uc3RydWN0b3I6IEFic3RyYWN0UmVuZGVyZXJcbn07XG4vKipcbiAqIEluaXRpYWxpemUgcmVuZGVyZXIgb24gYFwic2VsZlwiYC5cbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlci5jcmVhdGVcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHNlbGYgICAgUmVuZGVyZXIgdGhhdCBzaG91bGQgYmUgaW5pdGlhbGl6ZWQuXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgICAgICBvcHRpb25zIHtAbGluayB2Ni5vcHRpb25zfVxuICogQHBhcmFtICB7Y29uc3RhbnR9ICAgICAgICAgICAgdHlwZSAgICBUeXBlIG9mIHJlbmRlcmVyOiBgMkRgINC40LvQuCBgR0xgLiBDYW5ub3QgYmUgYEFVVE9gIS5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICAgICAgICAgUmV0dXJucyBub3RoaW5nLlxuICogQGV4YW1wbGUgPGNhcHRpb24+Q3VzdG9tIFJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIEFic3RyYWN0UmVuZGVyZXIgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyJyApO1xuICogdmFyIHNldHRpbmdzICAgICAgICAgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9zZXR0aW5ncycgKTtcbiAqIHZhciBjb25zdGFudHMgICAgICAgID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29uc3RhbnRzJyApO1xuICpcbiAqIGZ1bmN0aW9uIEN1c3RvbVJlbmRlcmVyICggb3B0aW9ucyApXG4gKiB7XG4gKiAgIC8vIEluaXRpYWxpemUgQ3VzdG9tUmVuZGVyZXIuXG4gKiAgIEFic3RyYWN0UmVuZGVyZXIuY3JlYXRlKCB0aGlzLCBkZWZhdWx0cyggc2V0dGluZ3MsIG9wdGlvbnMgKSwgY29uc3RhbnRzLmdldCggJzJEJyApICk7XG4gKiB9XG4gKi9cbkFic3RyYWN0UmVuZGVyZXIuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlICggc2VsZiwgb3B0aW9ucywgdHlwZSApXG57XG4gIHZhciBjb250ZXh0O1xuICAvKipcbiAgICogYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINC00LvRjyDQvtGC0YDQuNGB0L7QstC60Lgg0L3QsCDRjdC60YDQsNC90LUuXG4gICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2NhbnZhc1xuICAgKi9cbiAgaWYgKCBvcHRpb25zLmNhbnZhcyApIHtcbiAgICBzZWxmLmNhbnZhcyA9IG9wdGlvbnMuY2FudmFzO1xuICB9IGVsc2Uge1xuICAgIHNlbGYuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcbiAgICBzZWxmLmNhbnZhcy5pbm5lckhUTUwgPSAnVW5hYmxlIHRvIHJ1biB0aGlzIGFwcGxpY2F0aW9uLic7XG4gIH1cbiAgaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnMkQnICkgKSB7XG4gICAgY29udGV4dCA9ICcyZCc7XG4gIH0gZWxzZSBpZiAoIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoICdHTCcgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHJlbmRlcmVyIHR5cGUuIFRoZSBrbm93biBhcmU6IDJEIGFuZCBHTCcgKTtcbiAgfSBlbHNlIGlmICggISAoIGNvbnRleHQgPSBnZXRXZWJHTCgpICkgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgZ2V0IFdlYkdMIGNvbnRleHQuIFRyeSB0byB1c2UgMkQgYXMgdGhlIHJlbmRlcmVyIHR5cGUgb3IgdjYuUmVuZGVyZXIyRCBpbnN0ZWFkIG9mIHY2LlJlbmRlcmVyR0wnICk7XG4gIH1cbiAgLyoqXG4gICAqINCa0L7QvdGC0LXQutGB0YIg0YXQvtC70YHRgtCwLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LkFic3RyYWN0UmVuZGVyZXIjY29udGV4dFxuICAgKi9cbiAgc2VsZi5jb250ZXh0ID0gc2VsZi5jYW52YXMuZ2V0Q29udGV4dCggY29udGV4dCwge1xuICAgIGFscGhhOiBvcHRpb25zLmFscGhhXG4gIH0gKTtcbiAgLyoqXG4gICAqINCd0LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQtdGA0LAuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuQWJzdHJhY3RSZW5kZXJlciNzZXR0aW5nc1xuICAgKi9cbiAgc2VsZi5zZXR0aW5ncyA9IG9wdGlvbnMuc2V0dGluZ3M7XG4gIC8qKlxuICAgKiDQotC40L8g0YDQtdC90LTQtdGA0LXRgNCwOiBHTCwgMkQuXG4gICAqIEBtZW1iZXIge2NvbnN0YW50fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3R5cGVcbiAgICovXG4gIHNlbGYudHlwZSA9IHR5cGU7XG4gIC8qKlxuICAgKiDQodGC0Y3QuiDRgdC+0YXRgNCw0L3QtdC90L3Ri9GFINC90LDRgdGC0YDQvtC10Log0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge0FycmF5LjxvYmplY3Q+fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI19zdGFja1xuICAgKi9cbiAgc2VsZi5fc3RhY2sgPSBbXTtcbiAgLyoqXG4gICAqINCf0L7Qt9C40YbQuNGPINC/0L7RgdC70LXQtNC90LjRhSDRgdC+0YXRgNCw0L3QtdC90L3Ri9GFINC90LDRgdGC0YDQvtC10Log0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfc3RhY2tJbmRleFxuICAgKi9cbiAgc2VsZi5fc3RhY2tJbmRleCA9IC0xO1xuICAvKipcbiAgICog0JLQtdGA0YjQuNC90Ysg0YTQuNCz0YPRgNGLLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48bnVtYmVyPn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfdmVydGljZXNcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICovXG4gIHNlbGYuX3ZlcnRpY2VzID0gW107XG4gIC8qKlxuICAgKiDQotC40L8g0YTQuNCz0YPRgNGLLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48bnVtYmVyPn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfc2hhcGVUeXBlXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciN2ZXJ0ZXhcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqL1xuICBzZWxmLl9zaGFwZVR5cGUgPSBudWxsO1xuICBpZiAoIHR5cGVvZiBvcHRpb25zLmFwcGVuZFRvID09PSAndW5kZWZpbmVkJyApIHtcbiAgICBzZWxmLmFwcGVuZFRvKCBkb2N1bWVudC5ib2R5ICk7XG4gIH0gZWxzZSBpZiAoIG9wdGlvbnMuYXBwZW5kVG8gIT09IG51bGwgKSB7XG4gICAgc2VsZi5hcHBlbmRUbyggb3B0aW9ucy5hcHBlbmRUbyApO1xuICB9XG4gIGlmICggJ3cnIGluIG9wdGlvbnMgfHwgJ2gnIGluIG9wdGlvbnMgKSB7XG4gICAgc2VsZi5yZXNpemUoIG9wdGlvbnMudyB8fCAwLCBvcHRpb25zLmggfHwgMCApO1xuICB9IGVsc2UgaWYgKCBvcHRpb25zLmFwcGVuZFRvICE9PSBudWxsICkge1xuICAgIHNlbGYucmVzaXplVG8oIG9wdGlvbnMuYXBwZW5kVG8gfHwgZG9jdW1lbnQuYm9keSApO1xuICB9IGVsc2Uge1xuICAgIHNlbGYucmVzaXplKCA2MDAsIDQwMCApO1xuICB9XG4gIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3MoIHNlbGYsIHNlbGYgKTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IEFic3RyYWN0UmVuZGVyZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkZWZhdWx0cyAgICAgICAgICA9IHJlcXVpcmUoICdwZWFrby9kZWZhdWx0cycgKTtcblxudmFyIGNvbnN0YW50cyAgICAgICAgID0gcmVxdWlyZSggJy4uL2NvbnN0YW50cycgKTtcblxudmFyIHByb2Nlc3NSZWN0QWxpZ25YID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25YO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25ZID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25ZO1xuXG52YXIgQWJzdHJhY3RSZW5kZXJlciAgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFJlbmRlcmVyJyApO1xudmFyIHNldHRpbmdzICAgICAgICAgID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG5cbi8qKlxuICogMkQg0YDQtdC90LTQtdGA0LXRgC5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5SZW5kZXJlcjJEXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdFJlbmRlcmVyXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyB7QGxpbmsgdjYub3B0aW9uc31cbiAqIEBleGFtcGxlXG4gKiAvLyBSZXF1aXJlIFJlbmRlcmVyMkQuXG4gKiB2YXIgUmVuZGVyZXIyRCA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyMkQnICk7XG4gKiAvLyBDcmVhdGUgYW4gUmVuZGVyZXIyRCBpc250YW5jZS5cbiAqIHZhciByZW5kZXJlciA9IG5ldyBSZW5kZXJlcjJEKCk7XG4gKi9cbmZ1bmN0aW9uIFJlbmRlcmVyMkQgKCBvcHRpb25zIClcbntcbiAgQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUoIHRoaXMsICggb3B0aW9ucyA9IGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApICksIGNvbnN0YW50cy5nZXQoICcyRCcgKSApO1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHY2LlJlbmRlcmVyMkQjbWF0cml4XG4gICAqIEBhbGlhcyB2Ni5SZW5kZXJlcjJEI2NvbnRleHRcbiAgICovXG4gIHRoaXMubWF0cml4ID0gdGhpcy5jb250ZXh0O1xufVxuXG5SZW5kZXJlcjJELnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlICk7XG5SZW5kZXJlcjJELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlbmRlcmVyMkQ7XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjYmFja2dyb3VuZENvbG9yXG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLmJhY2tncm91bmRDb2xvciA9IGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvciAoIHIsIGcsIGIsIGEgKVxue1xuICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzO1xuICB2YXIgY29udGV4dCAgPSB0aGlzLmNvbnRleHQ7XG5cbiAgY29udGV4dC5zYXZlKCk7XG4gIGNvbnRleHQuZmlsbFN0eWxlID0gbmV3IHNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7XG4gIGNvbnRleHQuc2V0VHJhbnNmb3JtKCBzZXR0aW5ncy5zY2FsZSwgMCwgMCwgc2V0dGluZ3Muc2NhbGUsIDAsIDAgKTtcbiAgY29udGV4dC5maWxsUmVjdCggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgY29udGV4dC5yZXN0b3JlKCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2JhY2tncm91bmRJbWFnZVxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5iYWNrZ3JvdW5kSW1hZ2UgPSBmdW5jdGlvbiBiYWNrZ3JvdW5kSW1hZ2UgKCBpbWFnZSApXG57XG4gIHZhciBfcmVjdEFsaWduWCA9IHRoaXMuX3JlY3RBbGlnblg7XG4gIHZhciBfcmVjdEFsaWduWSA9IHRoaXMuX3JlY3RBbGlnblk7XG5cbiAgdGhpcy5fcmVjdEFsaWduWCA9IGNvbnN0YW50cy5nZXQoICdDRU5URVInICk7XG4gIHRoaXMuX3JlY3RBbGlnblkgPSBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApO1xuXG4gIHRoaXMuaW1hZ2UoIGltYWdlLCB0aGlzLncgKiAwLjUsIHRoaXMuaCAqIDAuNSApO1xuXG4gIHRoaXMuX3JlY3RBbGlnblggPSBfcmVjdEFsaWduWDtcbiAgdGhpcy5fcmVjdEFsaWduWSA9IF9yZWN0QWxpZ25ZO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNjbGVhclxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuY29udGV4dC5jbGVhciggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2RyYXdBcnJheXNcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuZHJhd0FycmF5cyA9IGZ1bmN0aW9uIGRyYXdBcnJheXMgKCB2ZXJ0cywgY291bnQsIF9tb2RlLCBfc3gsIF9zeSApXG57XG4gIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICB2YXIgaTtcblxuICBpZiAoIGNvdW50IDwgMiApIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGlmICggdHlwZW9mIF9zeCA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgX3N4ID0gX3N5ID0gMTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgfVxuXG4gIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gIGNvbnRleHQubW92ZVRvKCB2ZXJ0c1sgMCBdICogX3N4LCB2ZXJ0c1sgMSBdICogX3N5ICk7XG5cbiAgZm9yICggaSA9IDIsIGNvdW50ICo9IDI7IGkgPCBjb3VudDsgaSArPSAyICkge1xuICAgIGNvbnRleHQubGluZVRvKCB2ZXJ0c1sgaSBdICogX3N4LCB2ZXJ0c1sgaSArIDEgXSAqIF9zeSApO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb0ZpbGwgKSB7XG4gICAgdGhpcy5fZmlsbCgpO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb1N0cm9rZSAmJiB0aGlzLl9saW5lV2lkdGggPiAwICkge1xuICAgIHRoaXMuX3N0cm9rZSgpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2RyYXdJbWFnZVxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5kcmF3SW1hZ2UgPSBmdW5jdGlvbiBkcmF3SW1hZ2UgKCBpbWFnZSwgeCwgeSwgdywgaCApXG57XG4gIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UoIGltYWdlLmdldCgpLmltYWdlLCBpbWFnZS5zeCwgaW1hZ2Uuc3ksIGltYWdlLnN3LCBpbWFnZS5zaCwgeCwgeSwgdywgaCApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjcmVjdFxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24gcmVjdCAoIHgsIHksIHcsIGggKVxue1xuICB4ID0gcHJvY2Vzc1JlY3RBbGlnblgoIHRoaXMsIHgsIHcgKTtcbiAgeSA9IHByb2Nlc3NSZWN0QWxpZ25ZKCB0aGlzLCB5LCBoICk7XG5cbiAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICB0aGlzLmNvbnRleHQucmVjdCggeCwgeSwgdywgaCApO1xuXG4gIGlmICggdGhpcy5fZG9GaWxsICkge1xuICAgIHRoaXMuX2ZpbGwoKTtcbiAgfVxuXG4gIGlmICggdGhpcy5fZG9TdHJva2UgJiYgdGhpcy5fbGluZVdpZHRoID4gMCApIHtcbiAgICB0aGlzLl9zdHJva2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNhcmNcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuYXJjID0gZnVuY3Rpb24gYXJjICggeCwgeSwgciApXG57XG4gIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgdGhpcy5jb250ZXh0LmFyYyggeCwgeSwgciwgMCwgTWF0aC5QSSAqIDIgKTtcblxuICBpZiAoIHRoaXMuX2RvRmlsbCApIHtcbiAgICB0aGlzLl9maWxsKCk7XG4gIH1cblxuICBpZiAoIHRoaXMuX2RvU3Ryb2tlICYmIHRoaXMuX2xpbmVXaWR0aCA+IDAgKSB7XG4gICAgdGhpcy5fc3Ryb2tlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblJlbmRlcmVyMkQucHJvdG90eXBlLl9maWxsID0gZnVuY3Rpb24gX2ZpbGwgKClcbntcbiAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuX2ZpbGxDb2xvcjtcbiAgdGhpcy5jb250ZXh0LmZpbGwoKTtcbn07XG5cblJlbmRlcmVyMkQucHJvdG90eXBlLl9zdHJva2UgPSBmdW5jdGlvbiBfc3Ryb2tlICgpXG57XG4gIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuXG4gIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLl9zdHJva2VDb2xvcjtcblxuICBpZiAoICggY29udGV4dC5saW5lV2lkdGggPSB0aGlzLl9saW5lV2lkdGggKSA8PSAxICkge1xuICAgIGNvbnRleHQuc3Ryb2tlKCk7XG4gIH1cblxuICBjb250ZXh0LnN0cm9rZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjJEO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVmYXVsdHMgICAgICAgICAgPSByZXF1aXJlKCAncGVha28vZGVmYXVsdHMnICk7XG5cbnZhciBTaGFkZXJQcm9ncmFtICAgICA9IHJlcXVpcmUoICcuLi9TaGFkZXJQcm9ncmFtJyApO1xudmFyIFRyYW5zZm9ybSAgICAgICAgID0gcmVxdWlyZSggJy4uL1RyYW5zZm9ybScgKTtcbnZhciBjb25zdGFudHMgICAgICAgICA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICk7XG52YXIgc2hhZGVycyAgICAgICAgICAgPSByZXF1aXJlKCAnLi4vc2hhZGVycycgKTtcblxudmFyIHByb2Nlc3NSZWN0QWxpZ25YID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25YO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25ZID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25ZO1xuXG52YXIgQWJzdHJhY3RSZW5kZXJlciAgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFJlbmRlcmVyJyApO1xudmFyIHNldHRpbmdzICAgICAgICAgID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG5cbi8qKlxuICog0JzQsNGB0YHQuNCyINCy0LXRgNGI0LjQvSAodmVydGljZXMpINC60LLQsNC00YDQsNGC0LAuXG4gKiBAcHJpdmF0ZVxuICogQGlubmVyXG4gKiBAdmFyIHtGbG9hdDMyQXJyYXl9IHNxdWFyZVxuICovXG52YXIgc3F1YXJlID0gKCBmdW5jdGlvbiAoKVxue1xuICB2YXIgc3F1YXJlID0gW1xuICAgIDAsIDAsXG4gICAgMSwgMCxcbiAgICAxLCAxLFxuICAgIDAsIDFcbiAgXTtcblxuICBpZiAoIHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoIHNxdWFyZSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gIH1cblxuICByZXR1cm4gc3F1YXJlO1xufSApKCk7XG5cbi8qKlxuICogV2ViR0wg0YDQtdC90LTQtdGA0LXRgC5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5SZW5kZXJlckdMXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdFJlbmRlcmVyXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyB7QGxpbmsgdjYub3B0aW9uc31cbiAqIEBleGFtcGxlXG4gKiAvLyBSZXF1aXJlIFJlbmRlcmVyR0wuXG4gKiB2YXIgUmVuZGVyZXJHTCA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyR0wnICk7XG4gKiAvLyBDcmVhdGUgYW4gUmVuZGVyZXJHTCBpc250YW5jZS5cbiAqIHZhciByZW5kZXJlciA9IG5ldyBSZW5kZXJlckdMKCk7XG4gKi9cbmZ1bmN0aW9uIFJlbmRlcmVyR0wgKCBvcHRpb25zIClcbntcbiAgQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUoIHRoaXMsICggb3B0aW9ucyA9IGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApICksIGNvbnN0YW50cy5nZXQoICdHTCcgKSApO1xuXG4gIC8qKlxuICAgKiDQrdGC0LAgXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIiDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0LTQu9GPIHtAbGluayB2Ni5SZW5kZXJlckdMI3JvdGF0ZX0g0Lgg0YIu0L8uXG4gICAqIEBtZW1iZXIge3Y2LlRyYW5zZm9ybX0gdjYuUmVuZGVyZXJHTCNtYXRyaXhcbiAgICovXG4gIHRoaXMubWF0cml4ID0gbmV3IFRyYW5zZm9ybSgpO1xuXG4gIC8qKlxuICAgKiDQkdGD0YTQtdGA0Ysg0LTQsNC90L3Ri9GFICjQstC10YDRiNC40L0pLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LlJlbmRlcmVyR0wjYnVmZmVyc1xuICAgKiBAcHJvcGVydHkge1dlYkdMQnVmZmVyfSBkZWZhdWx0INCe0YHQvdC+0LLQvdC+0Lkg0LHRg9GE0LXRgC5cbiAgICogQHByb3BlcnR5IHtXZWJHTEJ1ZmZlcn0gc3F1YXJlICDQmNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0LTQu9GPINC+0YLRgNC40YHQvtCy0LrQuCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwINCyIHtAbGluayB2Ni5SZW5kZXJlckdMI3JlY3R9LlxuICAgKi9cbiAgdGhpcy5idWZmZXJzID0ge1xuICAgIGRlZmF1bHQ6IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIoKSxcbiAgICBzcXVhcmU6ICB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKClcbiAgfTtcblxuICB0aGlzLmNvbnRleHQuYmluZEJ1ZmZlciggdGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXJzLnNxdWFyZSApO1xuICB0aGlzLmNvbnRleHQuYnVmZmVyRGF0YSggdGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgc3F1YXJlLCB0aGlzLmNvbnRleHQuU1RBVElDX0RSQVcgKTtcblxuICAvKipcbiAgICog0KjQtdC50LTQtdGA0YsgKFdlYkdMINC/0YDQvtCz0YDQsNC80LzRiykuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuUmVuZGVyZXJHTCNwcm9ncmFtc1xuICAgKiBAcHJvcGVydHkge3Y2LlNoYWRlclByb2dyYW19IGRlZmF1bHRcbiAgICovXG4gIHRoaXMucHJvZ3JhbXMgPSB7XG4gICAgZGVmYXVsdDogbmV3IFNoYWRlclByb2dyYW0oIHNoYWRlcnMuYmFzaWMsIHRoaXMuY29udGV4dCApXG4gIH07XG5cbiAgdGhpcy5ibGVuZGluZyggb3B0aW9ucy5ibGVuZGluZyApO1xufVxuXG5SZW5kZXJlckdMLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlICk7XG5SZW5kZXJlckdMLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlbmRlcmVyR0w7XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjcmVzaXplXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uIHJlc2l6ZSAoIHcsIGggKVxue1xuICBBYnN0cmFjdFJlbmRlcmVyLnByb3RvdHlwZS5yZXNpemUuY2FsbCggdGhpcywgdywgaCApO1xuICB0aGlzLmNvbnRleHQudmlld3BvcnQoIDAsIDAsIHRoaXMudywgdGhpcy5oICk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjYmxlbmRpbmdcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYmxlbmRpbmdcbiAqIEBjaGFpbmFibGVcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuYmxlbmRpbmcgPSBmdW5jdGlvbiBibGVuZGluZyAoIGJsZW5kaW5nIClcbntcbiAgdmFyIGdsID0gdGhpcy5jb250ZXh0O1xuXG4gIGlmICggYmxlbmRpbmcgKSB7XG4gICAgZ2wuZW5hYmxlKCBnbC5CTEVORCApO1xuICAgIGdsLmRpc2FibGUoIGdsLkRFUFRIX1RFU1QgKTtcbiAgICBnbC5ibGVuZEZ1bmMoIGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSApO1xuICAgIGdsLmJsZW5kRXF1YXRpb24oIGdsLkZVTkNfQUREICk7XG4gIH0gZWxzZSB7XG4gICAgZ2wuZGlzYWJsZSggZ2wuQkxFTkQgKTtcbiAgICBnbC5lbmFibGUoIGdsLkRFUFRIX1RFU1QgKTtcbiAgICBnbC5kZXB0aEZ1bmMoIGdsLkxFUVVBTCApO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCe0YfQuNGJ0LDQtdGCINC60L7QvdGC0LXQutGB0YIuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI19jbGVhclxuICogQHBhcmFtICB7bnVtYmVyfSByINCd0L7RgNC80LDQu9C40LfQvtCy0LDQvdC90L7QtSDQt9C90LDRh9C10L3QuNC1IFwicmVkIGNoYW5uZWxcIi5cbiAqIEBwYXJhbSAge251bWJlcn0gZyDQndC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSBcImdyZWVuIGNoYW5uZWxcIi5cbiAqIEBwYXJhbSAge251bWJlcn0gYiDQndC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSBcImJsdWUgY2hhbm5lbFwiLlxuICogQHBhcmFtICB7bnVtYmVyfSBhINCd0L7RgNC80LDQu9C40LfQvtCy0LDQvdC90L7QtSDQt9C90LDRh9C10L3QuNC1INC/0YDQvtC30YDQsNGH0L3QvtGB0YLQuCAoYWxwaGEpLlxuICogQHJldHVybiB7dm9pZH0gICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIHJlbmRlcmVyLl9jbGVhciggMSwgMCwgMCwgMSApOyAvLyBGaWxsIGNvbnRleHQgd2l0aCByZWQgY29sb3IuXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLl9jbGVhciA9IGZ1bmN0aW9uIF9jbGVhciAoIHIsIGcsIGIsIGEgKVxue1xuICB2YXIgZ2wgPSB0aGlzLmNvbnRleHQ7XG4gIGdsLmNsZWFyQ29sb3IoIHIsIGcsIGIsIGEgKTtcbiAgZ2wuY2xlYXIoIGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNiYWNrZ3JvdW5kQ29sb3JcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuYmFja2dyb3VuZENvbG9yID0gZnVuY3Rpb24gYmFja2dyb3VuZENvbG9yICggciwgZywgYiwgYSApXG57XG4gIHZhciByZ2JhID0gbmV3IHRoaXMuc2V0dGluZ3MuY29sb3IoIHIsIGcsIGIsIGEgKS5yZ2JhKCk7XG4gIHRoaXMuX2NsZWFyKCByZ2JhWyAwIF0gLyAyNTUsIHJnYmFbIDEgXSAvIDI1NSwgcmdiYVsgMiBdIC8gMjU1LCByZ2JhWyAzIF0gKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2NsZWFyXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIgKClcbntcbiAgdGhpcy5fY2xlYXIoIDAsIDAsIDAsIDAgKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2RyYXdBcnJheXNcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuZHJhd0FycmF5cyA9IGZ1bmN0aW9uIGRyYXdBcnJheXMgKCB2ZXJ0cywgY291bnQsIG1vZGUsIF9zeCwgX3N5IClcbntcbiAgdmFyIHByb2dyYW0gPSB0aGlzLnByb2dyYW1zLmRlZmF1bHQ7XG4gIHZhciBnbCAgICAgID0gdGhpcy5jb250ZXh0O1xuXG4gIGlmICggY291bnQgPCAyICkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaWYgKCB2ZXJ0cyApIHtcbiAgICBpZiAoIHR5cGVvZiBtb2RlID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgIG1vZGUgPSBnbC5TVEFUSUNfRFJBVztcbiAgICB9XG5cbiAgICBnbC5iaW5kQnVmZmVyKCBnbC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVycy5kZWZhdWx0ICk7XG4gICAgZ2wuYnVmZmVyRGF0YSggZ2wuQVJSQVlfQlVGRkVSLCB2ZXJ0cywgbW9kZSApO1xuICB9XG5cbiAgaWYgKCB0eXBlb2YgX3N4ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICB0aGlzLm1hdHJpeC5zY2FsZSggX3N4LCBfc3kgKTtcbiAgfVxuXG4gIHByb2dyYW1cbiAgICAudXNlKClcbiAgICAuc2V0VW5pZm9ybSggJ3V0cmFuc2Zvcm0nLCB0aGlzLm1hdHJpeC5tYXRyaXggKVxuICAgIC5zZXRVbmlmb3JtKCAndXJlcycsIFsgdGhpcy53LCB0aGlzLmggXSApXG4gICAgLnNldEF0dHJpYnV0ZSggJ2Fwb3MnLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDAgKTtcblxuICB0aGlzLl9maWxsKCBjb3VudCApO1xuICB0aGlzLl9zdHJva2UoIGNvdW50ICk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5SZW5kZXJlckdMLnByb3RvdHlwZS5fZmlsbCA9IGZ1bmN0aW9uIF9maWxsICggY291bnQgKVxue1xuICBpZiAoIHRoaXMuX2RvRmlsbCApIHtcbiAgICB0aGlzLnByb2dyYW1zLmRlZmF1bHQuc2V0VW5pZm9ybSggJ3Vjb2xvcicsIHRoaXMuX2ZpbGxDb2xvci5yZ2JhKCkgKTtcbiAgICB0aGlzLmNvbnRleHQuZHJhd0FycmF5cyggdGhpcy5jb250ZXh0LlRSSUFOR0xFX0ZBTiwgMCwgY291bnQgKTtcbiAgfVxufTtcblxuUmVuZGVyZXJHTC5wcm90b3R5cGUuX3N0cm9rZSA9IGZ1bmN0aW9uIF9zdHJva2UgKCBjb3VudCApXG57XG4gIGlmICggdGhpcy5fZG9TdHJva2UgJiYgdGhpcy5fbGluZVdpZHRoID4gMCApIHtcbiAgICB0aGlzLnByb2dyYW1zLmRlZmF1bHQuc2V0VW5pZm9ybSggJ3Vjb2xvcicsIHRoaXMuX3N0cm9rZUNvbG9yLnJnYmEoKSApO1xuICAgIHRoaXMuY29udGV4dC5saW5lV2lkdGgoIHRoaXMuX2xpbmVXaWR0aCApO1xuICAgIHRoaXMuY29udGV4dC5kcmF3QXJyYXlzKCB0aGlzLmNvbnRleHQuTElORV9MT09QLCAwLCBjb3VudCApO1xuICB9XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2FyY1xuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5hcmMgPSBmdW5jdGlvbiBhcmMgKCB4LCB5LCByIClcbntcbiAgcmV0dXJuIHRoaXMuZHJhd1BvbHlnb24oIHgsIHksIHIsIHIsIDI0LCAwICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI3JlY3RcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUucmVjdCA9IGZ1bmN0aW9uIHJlY3QgKCB4LCB5LCB3LCBoIClcbntcbiAgeCA9IHByb2Nlc3NSZWN0QWxpZ25YKCB0aGlzLCB4LCB3ICk7XG4gIHkgPSBwcm9jZXNzUmVjdEFsaWduWSggdGhpcywgeSwgaCApO1xuICB0aGlzLm1hdHJpeC5zYXZlKCk7XG4gIHRoaXMubWF0cml4LnRyYW5zbGF0ZSggeCwgeSApO1xuICB0aGlzLm1hdHJpeC5zY2FsZSggdywgaCApO1xuICB0aGlzLmNvbnRleHQuYmluZEJ1ZmZlciggdGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXJzLnJlY3QgKTtcbiAgdGhpcy5kcmF3QXJyYXlzKCBudWxsLCA0ICk7XG4gIHRoaXMubWF0cml4LnJlc3RvcmUoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyR0w7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdGFudHMgICAgICAgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApO1xuXG52YXIgcmVwb3J0ICAgICAgICAgID0gcmVxdWlyZSggJy4uL2ludGVybmFsL3JlcG9ydCcgKTtcblxudmFyIGdldFJlbmRlcmVyVHlwZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL2dldF9yZW5kZXJlcl90eXBlJyApO1xudmFyIGdldFdlYkdMICAgICAgICA9IHJlcXVpcmUoICcuL2ludGVybmFsL2dldF93ZWJnbCcgKTtcblxudmFyIFJlbmRlcmVyR0wgICAgICA9IHJlcXVpcmUoICcuL1JlbmRlcmVyR0wnICk7XG52YXIgUmVuZGVyZXIyRCAgICAgID0gcmVxdWlyZSggJy4vUmVuZGVyZXIyRCcgKTtcbnZhciB0eXBlICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9zZXR0aW5ncycgKS50eXBlO1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkg0YDQtdC90LTQtdGA0LXRgC4g0JXRgdC70Lgg0YHQvtC30LTQsNGC0YwgV2ViR0wg0LrQvtC90YLQtdC60YHRgiDQvdC1INC/0L7Qu9GD0YfQuNGC0YHRjywg0YLQviDQsdGD0LTQtdGCINC40YHQv9C+0LvRjNC30L7QstCw0L0gMkQuXG4gKiBAbWV0aG9kIHY2LmNyZWF0ZVJlbmRlcmVyXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgICAgICBvcHRpb25zIHtAbGluayB2Ni5vcHRpb25zfS5cbiAqIEByZXR1cm4ge3Y2LkFic3RyYWN0UmVuZGVyZXJ9ICAgICAgICAg0J3QvtCy0YvQuSDRgNC10L3QtNC10YDQtdGAICgyRCwgR0wpLlxuICogQGV4YW1wbGVcbiAqIHZhciBjcmVhdGVSZW5kZXJlciA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyJyApO1xuICogdmFyIGNvbnN0YW50cyAgICAgID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29uc3RhbnRzJyApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRpbmcgV2ViR0wgb3IgMkQgcmVuZGVyZXIgYmFzZWQgb24gcGxhdGZvcm0gYW5kIGJyb3dzZXI8L2NhcHRpb24+XG4gKiB2YXIgcmVuZGVyZXIgPSBjcmVhdGVSZW5kZXJlciggeyB0eXBlOiBjb25zdGFudHMuZ2V0KCAnQVVUTycgKSB9ICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyBXZWJHTCByZW5kZXJlcjwvY2FwdGlvbj5cbiAqIHZhciByZW5kZXJlciA9IGNyZWF0ZVJlbmRlcmVyKCB7IHR5cGU6IGNvbnN0YW50cy5nZXQoICdHTCcgKSB9ICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyAyRCByZW5kZXJlcjwvY2FwdGlvbj5cbiAqIHZhciByZW5kZXJlciA9IGNyZWF0ZVJlbmRlcmVyKCB7IHR5cGU6IGNvbnN0YW50cy5nZXQoICcyRCcgKSB9ICk7XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJlbmRlcmVyICggb3B0aW9ucyApXG57XG4gIHZhciB0eXBlXyA9ICggb3B0aW9ucyAmJiBvcHRpb25zLnR5cGUgKSB8fCB0eXBlO1xuXG4gIGlmICggdHlwZV8gPT09IGNvbnN0YW50cy5nZXQoICdBVVRPJyApICkge1xuICAgIHR5cGVfID0gZ2V0UmVuZGVyZXJUeXBlKCk7XG4gIH1cblxuICBpZiAoIHR5cGVfID09PSBjb25zdGFudHMuZ2V0KCAnR0wnICkgKSB7XG4gICAgaWYgKCBnZXRXZWJHTCgpICkge1xuICAgICAgcmV0dXJuIG5ldyBSZW5kZXJlckdMKCBvcHRpb25zICk7XG4gICAgfVxuXG4gICAgcmVwb3J0KCAnQ2Fubm90IGNyZWF0ZSBXZWJHTCBjb250ZXh0LiBGYWxsaW5nIGJhY2sgdG8gMkQuJyApO1xuICB9XG5cbiAgaWYgKCB0eXBlXyA9PT0gY29uc3RhbnRzLmdldCggJzJEJyApIHx8IHR5cGVfID09PSBjb25zdGFudHMuZ2V0KCAnR0wnICkgKSB7XG4gICAgcmV0dXJuIG5ldyBSZW5kZXJlcjJEKCBvcHRpb25zICk7XG4gIH1cblxuICB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHJlbmRlcmVyIHR5cGUuIFRoZSBrbm93biBhcmU6IDJEIGFuZCBHTCcgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVSZW5kZXJlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQmtC+0L/QuNGA0YPQtdGCIGRyYXdpbmcgc2V0dGluZ3MgKF9saW5lV2lkdGgsIF9yZWN0QWxpZ25YLCDQuCDRgi7QtC4pINC40LcgYHNvdXJjZWAg0LIgYHRhcmdldGAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjb3B5RHJhd2luZ1NldHRpbmdzXG4gKiBAcGFyYW0gIHtvYmplY3R9ICB0YXJnZXQg0JzQvtC20LXRgiDQsdGL0YLRjCBgQWJzdHJhY3RSZW5kZXJlcmAg0LjQu9C4INC/0YDQvtGB0YLRi9C8INC+0LHRitC10LrRgtC+0Lwg0YEg0YHQvtGF0YDQsNC90LXQvdC90YvQvNC4INGH0LXRgNC10LdcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICDRjdGC0YMg0YTRg9C90LrRhtC40Y4g0L3QsNGB0YLRgNC+0LnQutCw0LzQuC5cbiAqIEBwYXJhbSAge29iamVjdH0gIHNvdXJjZSDQntC/0LjRgdCw0L3QuNC1INGC0L4g0LbQtSwg0YfRgtC+INC4INC00LvRjyBgdGFyZ2V0YC5cbiAqIEBwYXJhbSAge2Jvb2xlYW59IFtkZWVwXSDQldGB0LvQuCBgdHJ1ZWAsINGC0L4g0LHRg9C00LXRgiDRgtCw0LrQttC1INC60L7Qv9C40YDQvtCy0LDRgtGMIF9maWxsQ29sb3IsIF9zdHJva2VDb2xvciDQuCDRgi7QtC5cbiAqIEByZXR1cm4ge29iamVjdH0gICAgICAgICDQktC+0LfQstGA0LDRidCw0LXRgiBgdGFyZ2V0YC5cbiAqL1xuZnVuY3Rpb24gY29weURyYXdpbmdTZXR0aW5ncyAoIHRhcmdldCwgc291cmNlLCBkZWVwIClcbntcbiAgaWYgKCBkZWVwICkge1xuICAgIHRhcmdldC5fZmlsbENvbG9yWyAwIF0gICA9IHNvdXJjZS5fZmlsbENvbG9yWyAwIF07XG4gICAgdGFyZ2V0Ll9maWxsQ29sb3JbIDEgXSAgID0gc291cmNlLl9maWxsQ29sb3JbIDEgXTtcbiAgICB0YXJnZXQuX2ZpbGxDb2xvclsgMiBdICAgPSBzb3VyY2UuX2ZpbGxDb2xvclsgMiBdO1xuICAgIHRhcmdldC5fZmlsbENvbG9yWyAzIF0gICA9IHNvdXJjZS5fZmlsbENvbG9yWyAzIF07XG4gICAgdGFyZ2V0Ll9zdHJva2VDb2xvclsgMCBdID0gc291cmNlLl9zdHJva2VDb2xvclsgMCBdO1xuICAgIHRhcmdldC5fc3Ryb2tlQ29sb3JbIDEgXSA9IHNvdXJjZS5fc3Ryb2tlQ29sb3JbIDEgXTtcbiAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWyAyIF0gPSBzb3VyY2UuX3N0cm9rZUNvbG9yWyAyIF07XG4gICAgdGFyZ2V0Ll9zdHJva2VDb2xvclsgMyBdID0gc291cmNlLl9zdHJva2VDb2xvclsgMyBdO1xuICB9XG5cbiAgdGFyZ2V0Ll9iYWNrZ3JvdW5kUG9zaXRpb25YID0gc291cmNlLl9iYWNrZ3JvdW5kUG9zaXRpb25YO1xuICB0YXJnZXQuX2JhY2tncm91bmRQb3NpdGlvblkgPSBzb3VyY2UuX2JhY2tncm91bmRQb3NpdGlvblk7XG4gIHRhcmdldC5fcmVjdEFsaWduWCAgICAgICAgICA9IHNvdXJjZS5fcmVjdEFsaWduWDtcbiAgdGFyZ2V0Ll9yZWN0QWxpZ25ZICAgICAgICAgID0gc291cmNlLl9yZWN0QWxpZ25ZO1xuICB0YXJnZXQuX2xpbmVXaWR0aCAgICAgICAgICAgPSBzb3VyY2UuX2xpbmVXaWR0aDtcbiAgdGFyZ2V0Ll9kb1N0cm9rZSAgICAgICAgICAgID0gc291cmNlLl9kb1N0cm9rZTtcbiAgdGFyZ2V0Ll9kb0ZpbGwgICAgICAgICAgICAgID0gc291cmNlLl9kb0ZpbGw7XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb3B5RHJhd2luZ1NldHRpbmdzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJy4uLy4uL2NvbnN0YW50cycgKTtcblxudmFyIGRlZmF1bHREcmF3aW5nU2V0dGluZ3MgPSB7XG4gIF9iYWNrZ3JvdW5kUG9zaXRpb25YOiBjb25zdGFudHMuZ2V0KCAnTEVGVCcgKSxcbiAgX2JhY2tncm91bmRQb3NpdGlvblk6IGNvbnN0YW50cy5nZXQoICdUT1AnICksXG4gIF9yZWN0QWxpZ25YOiAgICAgICAgICBjb25zdGFudHMuZ2V0KCAnTEVGVCcgKSxcbiAgX3JlY3RBbGlnblk6ICAgICAgICAgIGNvbnN0YW50cy5nZXQoICdUT1AnICksXG4gIF9saW5lV2lkdGg6ICAgICAgICAgICAyLFxuICBfZG9TdHJva2U6ICAgICAgICAgICAgdHJ1ZSxcbiAgX2RvRmlsbDogICAgICAgICAgICAgIHRydWVcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZGVmYXVsdERyYXdpbmdTZXR0aW5ncztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9uY2UgICAgICA9IHJlcXVpcmUoICdwZWFrby9vbmNlJyApO1xuXG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJy4uLy4uL2NvbnN0YW50cycgKTtcblxuLy8gXCJwbGF0Zm9ybVwiIG5vdCBpbmNsdWRlZCB1c2luZyA8c2NyaXB0IC8+IHRhZy5cbmlmICggdHlwZW9mIHBsYXRmb3JtID09PSAndW5kZWZpbmVkJyApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2UtYmVmb3JlLWRlZmluZVxuICB2YXIgcGxhdGZvcm07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuICB0cnkge1xuICAgIHBsYXRmb3JtID0gcmVxdWlyZSggJ3BsYXRmb3JtJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGdsb2JhbC1yZXF1aXJlXG4gIH0gY2F0Y2ggKCBlcnJvciApIHtcbiAgICAvLyBcInBsYXRmb3JtXCIgbm90IGluc3RhbGxlZCB1c2luZyBOUE0uXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVuZGVyZXJUeXBlICgpXG57XG4gIHZhciBzYWZhcmksIHRvdWNoYWJsZTtcblxuICBpZiAoIHBsYXRmb3JtICkge1xuICAgIHNhZmFyaSA9IHBsYXRmb3JtLm9zICYmXG4gICAgICBwbGF0Zm9ybS5vcy5mYW1pbHkgPT09ICdpT1MnICYmXG4gICAgICBwbGF0Zm9ybS5uYW1lID09PSAnU2FmYXJpJztcbiAgfVxuXG4gIGlmICggdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgdG91Y2hhYmxlID0gJ29udG91Y2hlbmQnIGluIHdpbmRvdztcbiAgfVxuXG4gIGlmICggdG91Y2hhYmxlICYmICEgc2FmYXJpICkge1xuICAgIHJldHVybiBjb25zdGFudHMuZ2V0KCAnR0wnICk7XG4gIH1cblxuICByZXR1cm4gY29uc3RhbnRzLmdldCggJzJEJyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG9uY2UoIGdldFJlbmRlcmVyVHlwZSApO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb25jZSA9IHJlcXVpcmUoICdwZWFrby9vbmNlJyApO1xuXG4vKipcbiAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC40LzRjyDQv9C+0LTQtNC10YDQttC40LLQsNC10LzQvtCz0L4gV2ViR0wg0LrQvtC90YLQtdC60YHRgtCwLCDQvdCw0L/RgNC40LzQtdGAOiAnZXhwZXJpbWVudGFsLXdlYmdsJy5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGdldFdlYkdMXG4gKiBAcmV0dXJuIHtzdHJpbmc/fSDQkiDRgdC70YPRh9Cw0LUg0L3QtdGD0LTQsNGH0LggKFdlYkdMINC90LUg0L/QvtC00LTQtdGA0LbQuNCy0LDQtdGC0YHRjykgLSDQstC10YDQvdC10YIgYG51bGxgLlxuICovXG5mdW5jdGlvbiBnZXRXZWJHTCAoKVxue1xuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcbiAgdmFyIG5hbWUgICA9IG51bGw7XG5cbiAgaWYgKCBjYW52YXMuZ2V0Q29udGV4dCggJ3dlYmdsJyApICkge1xuICAgIG5hbWUgPSAnd2ViZ2wnO1xuICB9IGVsc2UgaWYgKCBjYW52YXMuZ2V0Q29udGV4dCggJ2V4cGVyaW1lbnRhbC13ZWJnbCcgKSApIHtcbiAgICBuYW1lID0gJ2V4cGVyaW1lbnRhbC13ZWJnbCc7XG4gIH1cblxuICAvLyBGaXhpbmcgcG9zc2libGUgbWVtb3J5IGxlYWsuXG4gIGNhbnZhcyA9IG51bGw7XG4gIHJldHVybiBuYW1lO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG9uY2UoIGdldFdlYkdMICk7XG4iLCIvKiBlc2xpbnQgbGluZXMtYXJvdW5kLWRpcmVjdGl2ZTogb2ZmICovXG4vKiBlc2xpbnQgbGluZXMtYXJvdW5kLWNvbW1lbnQ6IG9mZiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoICcuLi8uLi9jb25zdGFudHMnICk7XG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHByb2Nlc3NSZWN0QWxpZ25YXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSByZW5kZXJlclxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgeFxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgd1xuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnRzLnByb2Nlc3NSZWN0QWxpZ25YID0gZnVuY3Rpb24gcHJvY2Vzc1JlY3RBbGlnblggKCByZW5kZXJlciwgeCwgdyApIHsgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWCA9PT0gY29uc3RhbnRzLmdldCggXCJDRU5URVJcIiApICkgeyB4IC09IHcgKiAwLjU7IH0gZWxzZSBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25YID09PSBjb25zdGFudHMuZ2V0KCBcIlJJR0hUXCIgKSApIHsgeCAtPSB3OyB9IGVsc2UgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWCAhPT0gY29uc3RhbnRzLmdldCggXCJMRUZUXCIgKSApIHsgdGhyb3cgRXJyb3IoICdVbmtub3duIFwiICsnICsgXCJyZWN0QWxpZ25YXCIgKyAnXCI6ICcgKyByZW5kZXJlci5fcmVjdEFsaWduWCApOyB9IHJldHVybiBNYXRoLmZsb29yKCB4ICk7IH07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBwcm9jZXNzUmVjdEFsaWduWVxuICogQHBhcmFtICB7djYuQWJzdHJhY3RSZW5kZXJlcn0gcmVuZGVyZXJcbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIHlcbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIGhcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0cy5wcm9jZXNzUmVjdEFsaWduWSA9IGZ1bmN0aW9uIHByb2Nlc3NSZWN0QWxpZ25ZICggcmVuZGVyZXIsIHgsIHcgKSB7IGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblkgPT09IGNvbnN0YW50cy5nZXQoIFwiTUlERExFXCIgKSApIHsgeCAtPSB3ICogMC41OyB9IGVsc2UgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWSA9PT0gY29uc3RhbnRzLmdldCggXCJCT1RUT01cIiApICkgeyB4IC09IHc7IH0gZWxzZSBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25ZICE9PSBjb25zdGFudHMuZ2V0KCBcIlRPUFwiICkgKSB7IHRocm93IEVycm9yKCAnVW5rbm93biBcIiArJyArIFwicmVjdEFsaWduWVwiICsgJ1wiOiAnICsgcmVuZGVyZXIuX3JlY3RBbGlnblkgKTsgfSByZXR1cm4gTWF0aC5mbG9vciggeCApOyB9OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmF1bHREcmF3aW5nU2V0dGluZ3MgPSByZXF1aXJlKCAnLi9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MnICk7XG52YXIgY29weURyYXdpbmdTZXR0aW5ncyAgICA9IHJlcXVpcmUoICcuL2NvcHlfZHJhd2luZ19zZXR0aW5ncycgKTtcblxuLyoqXG4gKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBkcmF3aW5nIHNldHRpbmdzINC/0L4g0YPQvNC+0LvRh9Cw0L3QuNGOINCyIGB0YXJnZXRgLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2Qgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5nc1xuICogQHBhcmFtICB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ICAg0JzQvtC20LXRgiDQsdGL0YLRjCBgQWJzdHJhY3RSZW5kZXJlcmAg0LjQu9C4INC/0YDQvtGB0YLRi9C8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDQvtCx0YrQtdC60YLQvtC8LlxuICogQHBhcmFtICB7bW9kdWxlOlwidjYuanNcIi5BYnN0cmFjdFJlbmRlcmVyfSByZW5kZXJlciBgUmVuZGVyZXJHTGAg0LjQu9C4IGBSZW5kZXJlcjJEYCDQvdGD0LbQvdGLINC00LvRj1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0YPRgdGC0LDQvdC+0LLQutC4IF9zdHJva2VDb2xvciwgX2ZpbGxDb2xvci5cbiAqIEByZXR1cm4ge29iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIGB0YXJnZXRgLlxuICovXG5mdW5jdGlvbiBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzICggdGFyZ2V0LCByZW5kZXJlciApXG57XG5cbiAgY29weURyYXdpbmdTZXR0aW5ncyggdGFyZ2V0LCBkZWZhdWx0RHJhd2luZ1NldHRpbmdzICk7XG5cbiAgdGFyZ2V0Ll9zdHJva2VDb2xvciA9IG5ldyByZW5kZXJlci5zZXR0aW5ncy5jb2xvcigpO1xuICB0YXJnZXQuX2ZpbGxDb2xvciAgID0gbmV3IHJlbmRlcmVyLnNldHRpbmdzLmNvbG9yKCk7XG5cbiAgcmV0dXJuIHRhcmdldDtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3M7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb2xvciA9IHJlcXVpcmUoICcuLi9jb2xvci9SR0JBJyApO1xudmFyIHR5cGUgID0gcmVxdWlyZSggJy4uL2NvbnN0YW50cycgKS5nZXQoICcyRCcgKTtcblxuLyoqXG4gKiDQndCw0YHRgtGA0L7QudC60Lgg0LTQu9GPINGA0LXQvdC00LXRgNC10YDQvtCyOiB7QGxpbmsgdjYuUmVuZGVyZXIyRH0sIHtAbGluayB2Ni5SZW5kZXJlckdMfSwge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXJ9LCB7QGxpbmsgdjYuY3JlYXRlUmVuZGVyZXJ9LlxuICogQG5hbWVzcGFjZSB2Ni5zZXR0aW5ncy5yZW5kZXJlclxuICovXG5cbi8qKlxuICogQG1lbWJlciAgIHtvYmplY3R9IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5zZXR0aW5nc10g0J3QsNGB0YLRgNC+0LnQutC4INGA0LXQvdC00LXRgNC10YDQsCDQv9C+INGD0LzQvtC70YfQsNC90LjRji5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBbY29sb3I9djYuUkdCQV0gICAgICAgICAgICAgICAgINCa0L7QvdGB0YLRgNGD0LrRgtC+0YDRiyB7QGxpbmsgdjYuUkdCQX0g0LjQu9C4IHtAbGluayB2Ni5IU0xBfS5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2NhbGU9MV0gICAgICAgICAgICAgICAgICAgICAgINCf0LvQvtGC0L3QvtGB0YLRjCDQv9C40LrRgdC10LvQtdC5INGA0LXQvdC00LXRgNC10YDQsCwg0L3QsNC/0YDQuNC80LXRgDogYGRldmljZVBpeGVsUmF0aW9gLlxuICovXG5leHBvcnRzLnNldHRpbmdzID0ge1xuICBjb2xvcjogY29sb3IsXG4gIHNjYWxlOiAxXG59O1xuXG4vKipcbiAqINCf0L7QutCwINC90LUg0YHQtNC10LvQsNC90L4uXG4gKiBAbWVtYmVyIHtib29sZWFufSBbdjYuc2V0dGluZ3MucmVuZGVyZXIuYW50aWFsaWFzPXRydWVdXG4gKi9cbmV4cG9ydHMuYW50aWFsaWFzID0gdHJ1ZTtcblxuLyoqXG4gKiDQn9C+0LrQsCDQvdC1INGB0LTQtdC70LDQvdC+LlxuICogQG1lbWJlciB7Ym9vbGVhbn0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLmJsZW5kaW5nPXRydWVdXG4gKi9cbmV4cG9ydHMuYmxlbmRpbmcgPSB0cnVlO1xuXG4vKipcbiAqINCY0YHQv9C+0LvRjNC30L7QstCw0YLRjCDQs9GA0LDQtNGD0YHRiyDQstC80LXRgdGC0L4g0YDQsNC00LjQsNC90L7Qsi5cbiAqIEBtZW1iZXIge2Jvb2xlYW59IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5kZWdyZWVzPWZhbHNlXVxuICovXG5leHBvcnRzLmRlZ3JlZXMgPSBmYWxzZTtcblxuLyoqXG4gKiDQmNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0L/RgNC+0LfRgNCw0YfQvdGL0LkgKNCy0LzQtdGB0YLQviDRh9C10YDQvdC+0LPQvikg0LrQvtC90YLQtdC60YHRgi5cbiAqIEBtZW1iZXIge2Jvb2xlYW59IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5hbHBoYT10cnVlXVxuICovXG5leHBvcnRzLmFscGhhID0gdHJ1ZTtcblxuLyoqXG4gKiDQotC40L8g0LrQvtC90YLQtdC60YHRgtCwICgyRCwgR0wsIEFVVE8pLlxuICogQG1lbWJlciB7Y29uc3RhbnR9IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci50eXBlPTJEXVxuICovXG5leHBvcnRzLnR5cGUgPSB0eXBlO1xuXG4vKipcbiAqINCSINGN0YLQvtGCINGN0LvQtdC80LXQvdGCINCx0YPQtNC10YIg0LTQvtCx0LDQstC70LXQvSBgY2FudmFzYC5cbiAqIEBtZW1iZXIge0VsZW1lbnQ/fSBbdjYuc2V0dGluZ3MucmVuZGVyZXIuYXBwZW5kVG9dXG4gKi9cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQk9C70LDQstC90YvQtSDQvdCw0YHRgtGA0L7QudC60LggXCJ2Ni5qc1wiLlxuICogQG5hbWVzcGFjZSB2Ni5zZXR0aW5ncy5jb3JlXG4gKi9cblxuLyoqXG4gKiDQmNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNCw0LTRg9GB0Ysg0LLQvNC10YHRgtC+INGA0LDQtNC40LDQvdC+0LIuXG4gKiBAbWVtYmVyIHtib29sZWFufSB2Ni5zZXR0aW5ncy5jb3JlLmRlZ3JlZXNcbiAqL1xuZXhwb3J0cy5kZWdyZXNzID0gZmFsc2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQGludGVyZmFjZSBJU2hhZGVyU291cmNlc1xuICogQHByb3BlcnR5IHtzdHJpbmd9IHZlcnQg0JjRgdGF0L7QtNC90LjQuiDQstC10YDRiNC40L3QvdC+0LPQviAodmVydGV4KSDRiNC10LnQtNC10YDQsC5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBmcmFnINCY0YHRhdC+0LTQvdC40Log0YTRgNCw0LPQvNC10L3RgtC90L7Qs9C+IChmcmFnbWVudCkg0YjQtdC50LTQtdGA0LAuXG4gKi9cblxuLyoqXG4gKiBXZWJHTCDRiNC10LnQtNC10YDRiy5cbiAqIEBtZW1iZXIge29iamVjdH0gdjYuc2hhZGVyc1xuICogQHByb3BlcnR5IHtJU2hhZGVyU291cmNlc30gYmFzaWMgICAgICDQodGC0LDQvdC00LDRgNGC0L3Ri9C1INGI0LXQudC00LXRgNGLLlxuICogQHByb3BlcnR5IHtJU2hhZGVyU291cmNlc30gYmFja2dyb3VuZCDQqNC10LnQtNC10YDRiyDQtNC70Y8g0L7RgtGA0LjRgdC+0LLQutC4INGE0L7QvdCwLlxuICovXG52YXIgc2hhZGVycyA9IHtcbiAgYmFzaWM6IHtcbiAgICB2ZXJ0OiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7YXR0cmlidXRlIHZlYzIgYXBvczt1bmlmb3JtIHZlYzIgdXJlczt1bmlmb3JtIG1hdDMgdXRyYW5zZm9ybTt2b2lkIG1haW4oKXtnbF9Qb3NpdGlvbj12ZWM0KCgodXRyYW5zZm9ybSp2ZWMzKGFwb3MsMS4wKSkueHkvdXJlcyoyLjAtMS4wKSp2ZWMyKDEsLTEpLDAsMSk7fScsXG4gICAgZnJhZzogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O3VuaWZvcm0gdmVjNCB1Y29sb3I7dm9pZCBtYWluKCl7Z2xfRnJhZ0NvbG9yPXZlYzQodWNvbG9yLnJnYi8yNTUuMCx1Y29sb3IuYSk7fSdcbiAgfSxcblxuICBiYWNrZ3JvdW5kOiB7XG4gICAgdmVydDogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O2F0dHJpYnV0ZSB2ZWMyIGFwb3M7dm9pZCBtYWluKCl7Z2xfUG9zaXRpb24gPSB2ZWM0KGFwb3MsMCwxKTt9JyxcbiAgICBmcmFnOiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7dW5pZm9ybSB2ZWM0IHVjb2xvcjt2b2lkIG1haW4oKXtnbF9GcmFnQ29sb3I9dWNvbG9yO30nXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2hhZGVycztcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3LTIwMTggVmxhZGlzbGF2VGlraGl5IChTSUxFTlQpIChzaWxlbnQtdGVtcGVzdClcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBHUEwtMy4wIGxpY2Vuc2UuXG4gKiBodHRwczovL2dpdGh1Yi5jb20vc2lsZW50LXRlbXBlc3QvdjYuanMvdHJlZS9kZXYvXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgdjZcbiAqL1xuXG4vKipcbiAqIEEgdmFsaWQgQ1NTLWNvbG9yOiBgXCJoc2woMzYwLCAxMDAlLCAxMDAlKVwiYCwgYFwiI2ZmMDBmZlwiYCwgYFwibGlnaHRwaW5rXCJgLiB7QGxpbmsgdjYuSFNMQX0gb3Ige0BsaW5rIHY2LlJHQkF9LlxuICogQHR5cGVkZWYge3N0cmluZ3x2Ni5IU0xBfHY2LlJHQkF9IFRDb2xvclxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge251bWJlcn0gY29uc3RhbnRcbiAqIEBzZWUgdjYuY29uc3RhbnRzXG4gKiBAZXhhbXBsZVxuICogLy8gVGhpcyBpcyBhIGNvbnN0YW50LlxuICogdmFyIFJFTkRFUkVSX1RZUEUgPSBjb25zdGFudHMuZ2V0KCAnR0wnICk7XG4gKi9cblxuLyoqXG4gKiBAaW50ZXJmYWNlIElWZWN0b3IyRFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHhcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5XG4gKi9cblxuZXhwb3J0cy5BYnN0cmFjdEltYWdlICAgID0gcmVxdWlyZSggJy4vY29yZS9pbWFnZS9BYnN0cmFjdEltYWdlJyApO1xuZXhwb3J0cy5BYnN0cmFjdFJlbmRlcmVyID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyJyApO1xuZXhwb3J0cy5BYnN0cmFjdFZlY3RvciAgID0gcmVxdWlyZSggJy4vY29yZS9tYXRoL0Fic3RyYWN0VmVjdG9yJyApO1xuZXhwb3J0cy5DYW1lcmEgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9jYW1lcmEvQ2FtZXJhJyApO1xuZXhwb3J0cy5Db21wb3VuZGVkSW1hZ2UgID0gcmVxdWlyZSggJy4vY29yZS9pbWFnZS9Db21wb3VuZGVkSW1hZ2UnICk7XG5leHBvcnRzLkhTTEEgICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2NvbG9yL0hTTEEnICk7XG5leHBvcnRzLkltYWdlICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2ltYWdlL0ltYWdlJyApO1xuZXhwb3J0cy5SR0JBICAgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9jb2xvci9SR0JBJyApO1xuZXhwb3J0cy5SZW5kZXJlcjJEICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9SZW5kZXJlcjJEJyApO1xuZXhwb3J0cy5SZW5kZXJlckdMICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9SZW5kZXJlckdMJyApO1xuZXhwb3J0cy5TaGFkZXJQcm9ncmFtICAgID0gcmVxdWlyZSggJy4vY29yZS9TaGFkZXJQcm9ncmFtJyApO1xuZXhwb3J0cy5UaWNrZXIgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9UaWNrZXInICk7XG5leHBvcnRzLlRyYW5zZm9ybSAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL1RyYW5zZm9ybScgKTtcbmV4cG9ydHMuVmVjdG9yMkQgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvbWF0aC9WZWN0b3IyRCcgKTtcbmV4cG9ydHMuVmVjdG9yM0QgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvbWF0aC9WZWN0b3IzRCcgKTtcbmV4cG9ydHMuY29uc3RhbnRzICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvY29uc3RhbnRzJyApO1xuZXhwb3J0cy5jcmVhdGVSZW5kZXJlciAgID0gcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlcicgKTtcbmV4cG9ydHMuc2hhZGVycyAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvc2hhZGVycycgKTtcblxuLyoqXG4gKiDQndCw0YHRgtGA0L7QudC60LggXCJ2Ni5qc1wiLlxuICogQG5hbWVzcGFjZSB2Ni5zZXR0aW5nc1xuICovXG5leHBvcnRzLnNldHRpbmdzID0ge1xuICByZW5kZXJlcjogcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9zZXR0aW5ncycgKSxcbiAgY2FtZXJhOiAgIHJlcXVpcmUoICcuL2NvcmUvY2FtZXJhL3NldHRpbmdzJyApLFxuICBjb3JlOiAgICAgcmVxdWlyZSggJy4vY29yZS9zZXR0aW5ncycgKVxufTtcblxuaWYgKCB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gIHNlbGYudjYgPSBleHBvcnRzO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEEgbGlnaHR3ZWlnaHQgaW1wbGVtZW50YXRpb24gb2YgTm9kZS5qcyBFdmVudEVtaXR0ZXIuXG4gKiBAY29uc3RydWN0b3IgTGlnaHRFbWl0dGVyXG4gKiBAZXhhbXBsZVxuICogdmFyIExpZ2h0RW1pdHRlciA9IHJlcXVpcmUoICdsaWdodF9lbWl0dGVyJyApO1xuICovXG5mdW5jdGlvbiBMaWdodEVtaXR0ZXIgKCkge31cblxuTGlnaHRFbWl0dGVyLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI2VtaXRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAgICogQHBhcmFtIHsuLi5hbnl9IFtkYXRhXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBlbWl0OiBmdW5jdGlvbiBlbWl0ICggdHlwZSApIHtcbiAgICB2YXIgbGlzdCA9IF9nZXRMaXN0KCB0aGlzLCB0eXBlICk7XG4gICAgdmFyIGRhdGEsIGksIGw7XG5cbiAgICBpZiAoICEgbGlzdCApIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA+IDEgKSB7XG4gICAgICBkYXRhID0gW10uc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICk7XG4gICAgfVxuXG4gICAgZm9yICggaSA9IDAsIGwgPSBsaXN0Lmxlbmd0aDsgaSA8IGw7ICsraSApIHtcbiAgICAgIGlmICggISBsaXN0WyBpIF0uYWN0aXZlICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCBsaXN0WyBpIF0ub25jZSApIHtcbiAgICAgICAgbGlzdFsgaSBdLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIGRhdGEgKSB7XG4gICAgICAgIGxpc3RbIGkgXS5saXN0ZW5lci5hcHBseSggdGhpcywgZGF0YSApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlzdFsgaSBdLmxpc3RlbmVyLmNhbGwoIHRoaXMgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBMaWdodEVtaXR0ZXIjb2ZmXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFt0eXBlXVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbbGlzdGVuZXJdXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9mZjogZnVuY3Rpb24gb2ZmICggdHlwZSwgbGlzdGVuZXIgKSB7XG4gICAgdmFyIGxpc3QsIGk7XG5cbiAgICBpZiAoICEgdHlwZSApIHtcbiAgICAgIHRoaXMuX2V2ZW50cyA9IG51bGw7XG4gICAgfSBlbHNlIGlmICggKCBsaXN0ID0gX2dldExpc3QoIHRoaXMsIHR5cGUgKSApICkge1xuICAgICAgaWYgKCBsaXN0ZW5lciApIHtcbiAgICAgICAgZm9yICggaSA9IGxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICAgICAgaWYgKCBsaXN0WyBpIF0ubGlzdGVuZXIgPT09IGxpc3RlbmVyICYmIGxpc3RbIGkgXS5hY3RpdmUgKSB7XG4gICAgICAgICAgICBsaXN0WyBpIF0uYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI29uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIHR5cGVcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXJcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb246IGZ1bmN0aW9uIG9uICggdHlwZSwgbGlzdGVuZXIgKSB7XG4gICAgX29uKCB0aGlzLCB0eXBlLCBsaXN0ZW5lciApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIExpZ2h0RW1pdHRlciNvbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIHR5cGVcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXJcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb25jZTogZnVuY3Rpb24gb25jZSAoIHR5cGUsIGxpc3RlbmVyICkge1xuICAgIF9vbiggdGhpcywgdHlwZSwgbGlzdGVuZXIsIHRydWUgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb25zdHJ1Y3RvcjogTGlnaHRFbWl0dGVyXG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIF9vblxuICogQHBhcmFtICB7TGlnaHRFbWl0dGVyfSBzZWxmXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgIHR5cGVcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSAgICAgbGlzdGVuZXJcbiAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgb25jZVxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gX29uICggc2VsZiwgdHlwZSwgbGlzdGVuZXIsIG9uY2UgKSB7XG4gIHZhciBlbnRpdHkgPSB7XG4gICAgbGlzdGVuZXI6IGxpc3RlbmVyLFxuICAgIGFjdGl2ZTogICB0cnVlLFxuICAgIHR5cGU6ICAgICB0eXBlLFxuICAgIG9uY2U6ICAgICBvbmNlXG4gIH07XG5cbiAgaWYgKCAhIHNlbGYuX2V2ZW50cyApIHtcbiAgICBzZWxmLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKCBudWxsICk7XG4gIH1cblxuICBpZiAoICEgc2VsZi5fZXZlbnRzWyB0eXBlIF0gKSB7XG4gICAgc2VsZi5fZXZlbnRzWyB0eXBlIF0gPSBbXTtcbiAgfVxuXG4gIHNlbGYuX2V2ZW50c1sgdHlwZSBdLnB1c2goIGVudGl0eSApO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIF9nZXRMaXN0XG4gKiBAcGFyYW0gIHtMaWdodEVtaXR0ZXJ9ICAgc2VsZlxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgIHR5cGVcbiAqIEByZXR1cm4ge2FycmF5PG9iamVjdD4/fVxuICovXG5mdW5jdGlvbiBfZ2V0TGlzdCAoIHNlbGYsIHR5cGUgKSB7XG4gIHJldHVybiBzZWxmLl9ldmVudHMgJiYgc2VsZi5fZXZlbnRzWyB0eXBlIF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGlnaHRFbWl0dGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF90aHJvd0FyZ3VtZW50RXhjZXB0aW9uICggdW5leHBlY3RlZCwgZXhwZWN0ZWQgKSB7XG4gIHRocm93IEVycm9yKCAnXCInICsgdG9TdHJpbmcuY2FsbCggdW5leHBlY3RlZCApICsgJ1wiIGlzIG5vdCAnICsgZXhwZWN0ZWQgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0eXBlID0gcmVxdWlyZSggJy4vdHlwZScgKTtcbnZhciBsYXN0UmVzID0gJ3VuZGVmaW5lZCc7XG52YXIgbGFzdFZhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfdHlwZSAoIHZhbCApIHtcbiAgaWYgKCB2YWwgPT09IGxhc3RWYWwgKSB7XG4gICAgcmV0dXJuIGxhc3RSZXM7XG4gIH1cblxuICByZXR1cm4gKCBsYXN0UmVzID0gdHlwZSggbGFzdFZhbCA9IHZhbCApICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF91bmVzY2FwZSAoIHN0cmluZyApIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKCAvXFxcXChcXFxcKT8vZywgJyQxJyApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzc2V0ID0gcmVxdWlyZSggJy4uL2lzc2V0JyApO1xuXG52YXIgdW5kZWZpbmVkOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG5cbnZhciBkZWZpbmVHZXR0ZXIgPSBPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lR2V0dGVyX18sXG4gICAgZGVmaW5lU2V0dGVyID0gT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZVNldHRlcl9fO1xuXG5mdW5jdGlvbiBiYXNlRGVmaW5lUHJvcGVydHkgKCBvYmplY3QsIGtleSwgZGVzY3JpcHRvciApIHtcbiAgdmFyIGhhc0dldHRlciA9IGlzc2V0KCAnZ2V0JywgZGVzY3JpcHRvciApLFxuICAgICAgaGFzU2V0dGVyID0gaXNzZXQoICdzZXQnLCBkZXNjcmlwdG9yICksXG4gICAgICBnZXQsIHNldDtcblxuICBpZiAoIGhhc0dldHRlciB8fCBoYXNTZXR0ZXIgKSB7XG4gICAgaWYgKCBoYXNHZXR0ZXIgJiYgdHlwZW9mICggZ2V0ID0gZGVzY3JpcHRvci5nZXQgKSAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ0dldHRlciBtdXN0IGJlIGEgZnVuY3Rpb246ICcgKyBnZXQgKTtcbiAgICB9XG5cbiAgICBpZiAoIGhhc1NldHRlciAmJiB0eXBlb2YgKCBzZXQgPSBkZXNjcmlwdG9yLnNldCApICE9PSAnZnVuY3Rpb24nICkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnU2V0dGVyIG11c3QgYmUgYSBmdW5jdGlvbjogJyArIHNldCApO1xuICAgIH1cblxuICAgIGlmICggaXNzZXQoICd3cml0YWJsZScsIGRlc2NyaXB0b3IgKSApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ0ludmFsaWQgcHJvcGVydHkgZGVzY3JpcHRvci4gQ2Fubm90IGJvdGggc3BlY2lmeSBhY2Nlc3NvcnMgYW5kIGEgdmFsdWUgb3Igd3JpdGFibGUgYXR0cmlidXRlJyApO1xuICAgIH1cblxuICAgIGlmICggZGVmaW5lR2V0dGVyICkge1xuICAgICAgaWYgKCBoYXNHZXR0ZXIgKSB7XG4gICAgICAgIGRlZmluZUdldHRlci5jYWxsKCBvYmplY3QsIGtleSwgZ2V0ICk7XG4gICAgICB9XG5cbiAgICAgIGlmICggaGFzU2V0dGVyICkge1xuICAgICAgICBkZWZpbmVTZXR0ZXIuY2FsbCggb2JqZWN0LCBrZXksIHNldCApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBkZWZpbmUgZ2V0dGVyIG9yIHNldHRlcicgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoIGlzc2V0KCAndmFsdWUnLCBkZXNjcmlwdG9yICkgKSB7XG4gICAgb2JqZWN0WyBrZXkgXSA9IGRlc2NyaXB0b3IudmFsdWU7XG4gIH0gZWxzZSBpZiAoICEgaXNzZXQoIGtleSwgb2JqZWN0ICkgKSB7XG4gICAgb2JqZWN0WyBrZXkgXSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiBvYmplY3Q7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZURlZmluZVByb3BlcnR5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VFeGVjICggcmVnZXhwLCBzdHJpbmcgKSB7XG4gIHZhciByZXN1bHQgPSBbXSxcbiAgICAgIHZhbHVlO1xuXG4gIHJlZ2V4cC5sYXN0SW5kZXggPSAwO1xuXG4gIHdoaWxlICggKCB2YWx1ZSA9IHJlZ2V4cC5leGVjKCBzdHJpbmcgKSApICkge1xuICAgIHJlc3VsdC5wdXNoKCB2YWx1ZSApO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYWxsSXRlcmF0ZWUgPSByZXF1aXJlKCAnLi4vY2FsbC1pdGVyYXRlZScgKSxcbiAgICBpc3NldCAgICAgICAgPSByZXF1aXJlKCAnLi4vaXNzZXQnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZUZvckVhY2ggKCBhcnIsIGZuLCBjdHgsIGZyb21SaWdodCApIHtcbiAgdmFyIGksIGosIGlkeDtcblxuICBmb3IgKCBpID0gLTEsIGogPSBhcnIubGVuZ3RoIC0gMTsgaiA+PSAwOyAtLWogKSB7XG4gICAgaWYgKCBmcm9tUmlnaHQgKSB7XG4gICAgICBpZHggPSBqO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZHggPSArK2k7XG4gICAgfVxuXG4gICAgaWYgKCBpc3NldCggaWR4LCBhcnIgKSAmJiBjYWxsSXRlcmF0ZWUoIGZuLCBjdHgsIGFyclsgaWR4IF0sIGlkeCwgYXJyICkgPT09IGZhbHNlICkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFycjtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYWxsSXRlcmF0ZWUgPSByZXF1aXJlKCAnLi4vY2FsbC1pdGVyYXRlZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlRm9ySW4gKCBvYmosIGZuLCBjdHgsIGZyb21SaWdodCwga2V5cyApIHtcbiAgdmFyIGksIGosIGtleTtcblxuICBmb3IgKCBpID0gLTEsIGogPSBrZXlzLmxlbmd0aCAtIDE7IGogPj0gMDsgLS1qICkge1xuICAgIGlmICggZnJvbVJpZ2h0ICkge1xuICAgICAga2V5ID0ga2V5c1sgaiBdO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXkgPSBrZXlzWyArK2kgXTtcbiAgICB9XG5cbiAgICBpZiAoIGNhbGxJdGVyYXRlZSggZm4sIGN0eCwgb2JqWyBrZXkgXSwga2V5LCBvYmogKSA9PT0gZmFsc2UgKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzc2V0ID0gcmVxdWlyZSggJy4uL2lzc2V0JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VHZXQgKCBvYmosIHBhdGgsIG9mZiApIHtcbiAgdmFyIGwgPSBwYXRoLmxlbmd0aCAtIG9mZixcbiAgICAgIGkgPSAwLFxuICAgICAga2V5O1xuXG4gIGZvciAoIDsgaSA8IGw7ICsraSApIHtcbiAgICBrZXkgPSBwYXRoWyBpIF07XG5cbiAgICBpZiAoIGlzc2V0KCBrZXksIG9iaiApICkge1xuICAgICAgb2JqID0gb2JqWyBrZXkgXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmFzZVRvSW5kZXggPSByZXF1aXJlKCAnLi9iYXNlLXRvLWluZGV4JyApO1xuXG52YXIgaW5kZXhPZiAgICAgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZixcbiAgICBsYXN0SW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZjtcblxuZnVuY3Rpb24gYmFzZUluZGV4T2YgKCBhcnIsIHNlYXJjaCwgZnJvbUluZGV4LCBmcm9tUmlnaHQgKSB7XG4gIHZhciBsLCBpLCBqLCBpZHgsIHZhbDtcblxuICAvLyB1c2UgdGhlIG5hdGl2ZSBmdW5jdGlvbiBpZiBpdCBpcyBzdXBwb3J0ZWQgYW5kIHRoZSBzZWFyY2ggaXMgbm90IG5hbi5cblxuICBpZiAoIHNlYXJjaCA9PT0gc2VhcmNoICYmICggaWR4ID0gZnJvbVJpZ2h0ID8gbGFzdEluZGV4T2YgOiBpbmRleE9mICkgKSB7XG4gICAgcmV0dXJuIGlkeC5jYWxsKCBhcnIsIHNlYXJjaCwgZnJvbUluZGV4ICk7XG4gIH1cblxuICBsID0gYXJyLmxlbmd0aDtcblxuICBpZiAoICEgbCApIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICBqID0gbCAtIDE7XG5cbiAgaWYgKCB0eXBlb2YgZnJvbUluZGV4ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICBmcm9tSW5kZXggPSBiYXNlVG9JbmRleCggZnJvbUluZGV4LCBsICk7XG5cbiAgICBpZiAoIGZyb21SaWdodCApIHtcbiAgICAgIGogPSBNYXRoLm1pbiggaiwgZnJvbUluZGV4ICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGogPSBNYXRoLm1heCggMCwgZnJvbUluZGV4ICk7XG4gICAgfVxuXG4gICAgaSA9IGogLSAxO1xuICB9IGVsc2Uge1xuICAgIGkgPSAtMTtcbiAgfVxuXG4gIGZvciAoIDsgaiA+PSAwOyAtLWogKSB7XG4gICAgaWYgKCBmcm9tUmlnaHQgKSB7XG4gICAgICBpZHggPSBqO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZHggPSArK2k7XG4gICAgfVxuXG4gICAgdmFsID0gYXJyWyBpZHggXTtcblxuICAgIGlmICggdmFsID09PSBzZWFyY2ggfHwgc2VhcmNoICE9PSBzZWFyY2ggJiYgdmFsICE9PSB2YWwgKSB7XG4gICAgICByZXR1cm4gaWR4O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlSW5kZXhPZjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJhc2VJbmRleE9mID0gcmVxdWlyZSggJy4vYmFzZS1pbmRleC1vZicgKTtcblxudmFyIHN1cHBvcnQgPSByZXF1aXJlKCAnLi4vc3VwcG9ydC9zdXBwb3J0LWtleXMnICk7XG5cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbnZhciBrLCBmaXhLZXlzO1xuXG5pZiAoIHN1cHBvcnQgPT09ICdub3Qtc3VwcG9ydGVkJyApIHtcbiAgayA9IFtcbiAgICAndG9TdHJpbmcnLFxuICAgICd0b0xvY2FsZVN0cmluZycsXG4gICAgJ3ZhbHVlT2YnLFxuICAgICdoYXNPd25Qcm9wZXJ0eScsXG4gICAgJ2lzUHJvdG90eXBlT2YnLFxuICAgICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsXG4gICAgJ2NvbnN0cnVjdG9yJ1xuICBdO1xuXG4gIGZpeEtleXMgPSBmdW5jdGlvbiBmaXhLZXlzICgga2V5cywgb2JqZWN0ICkge1xuICAgIHZhciBpLCBrZXk7XG5cbiAgICBmb3IgKCBpID0gay5sZW5ndGggLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgIGlmICggYmFzZUluZGV4T2YoIGtleXMsIGtleSA9IGtbIGkgXSApIDwgMCAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKCBvYmplY3QsIGtleSApICkge1xuICAgICAgICBrZXlzLnB1c2goIGtleSApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBrZXlzO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VLZXlzICggb2JqZWN0ICkge1xuICB2YXIga2V5cyA9IFtdO1xuXG4gIHZhciBrZXk7XG5cbiAgZm9yICgga2V5IGluIG9iamVjdCApIHtcbiAgICBpZiAoIGhhc093blByb3BlcnR5LmNhbGwoIG9iamVjdCwga2V5ICkgKSB7XG4gICAgICBrZXlzLnB1c2goIGtleSApO1xuICAgIH1cbiAgfVxuXG4gIGlmICggc3VwcG9ydCAhPT0gJ25vdC1zdXBwb3J0ZWQnICkge1xuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgcmV0dXJuIGZpeEtleXMoIGtleXMsIG9iamVjdCApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldCA9IHJlcXVpcmUoICcuL2Jhc2UtZ2V0JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VQcm9wZXJ0eSAoIG9iamVjdCwgcGF0aCApIHtcbiAgaWYgKCBvYmplY3QgIT0gbnVsbCApIHtcbiAgICBpZiAoIHBhdGgubGVuZ3RoID4gMSApIHtcbiAgICAgIHJldHVybiBnZXQoIG9iamVjdCwgcGF0aCwgMCApO1xuICAgIH1cblxuICAgIHJldHVybiBvYmplY3RbIHBhdGhbIDAgXSBdO1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VUb0luZGV4ICggdiwgbCApIHtcbiAgaWYgKCAhIGwgfHwgISB2ICkge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgaWYgKCB2IDwgMCApIHtcbiAgICB2ICs9IGw7XG4gIH1cblxuICByZXR1cm4gdiB8fCAwO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF90aHJvd0FyZ3VtZW50RXhjZXB0aW9uID0gcmVxdWlyZSggJy4vX3Rocm93LWFyZ3VtZW50LWV4Y2VwdGlvbicgKTtcbnZhciBkZWZhdWx0VG8gPSByZXF1aXJlKCAnLi9kZWZhdWx0LXRvJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJlZm9yZSAoIG4sIGZuICkge1xuICB2YXIgdmFsdWU7XG5cbiAgaWYgKCB0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicgKSB7XG4gICAgX3Rocm93QXJndW1lbnRFeGNlcHRpb24oIGZuLCAnYSBmdW5jdGlvbicgKTtcbiAgfVxuXG4gIG4gPSBkZWZhdWx0VG8oIG4sIDEgKTtcblxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGlmICggLS1uID49IDAgKSB7XG4gICAgICB2YWx1ZSA9IGZuLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNhbGxJdGVyYXRlZSAoIGZuLCBjdHgsIHZhbCwga2V5LCBvYmogKSB7XG4gIGlmICggdHlwZW9mIGN0eCA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgcmV0dXJuIGZuKCB2YWwsIGtleSwgb2JqICk7XG4gIH1cblxuICByZXR1cm4gZm4uY2FsbCggY3R4LCB2YWwsIGtleSwgb2JqICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmFzZUV4ZWMgID0gcmVxdWlyZSggJy4vYmFzZS9iYXNlLWV4ZWMnICksXG4gICAgX3VuZXNjYXBlID0gcmVxdWlyZSggJy4vX3VuZXNjYXBlJyApLFxuICAgIGlzS2V5ICAgICA9IHJlcXVpcmUoICcuL2lzLWtleScgKSxcbiAgICB0b0tleSAgICAgPSByZXF1aXJlKCAnLi90by1rZXknICksXG4gICAgX3R5cGUgICAgID0gcmVxdWlyZSggJy4vX3R5cGUnICk7XG5cbnZhciByUHJvcGVydHkgPSAvKF58XFwuKVxccyooW19hLXpdXFx3KilcXHMqfFxcW1xccyooKD86LSk/KD86XFxkK3xcXGQqXFwuXFxkKyl8KFwifCcpKChbXlxcXFxdXFxcXChcXFxcXFxcXCkqfFteXFw0XSkqKVxcNClcXHMqXFxdL2dpO1xuXG5mdW5jdGlvbiBzdHJpbmdUb1BhdGggKCBzdHIgKSB7XG4gIHZhciBwYXRoID0gYmFzZUV4ZWMoIHJQcm9wZXJ0eSwgc3RyICksXG4gICAgICBpID0gcGF0aC5sZW5ndGggLSAxLFxuICAgICAgdmFsO1xuXG4gIGZvciAoIDsgaSA+PSAwOyAtLWkgKSB7XG4gICAgdmFsID0gcGF0aFsgaSBdO1xuXG4gICAgLy8gLm5hbWVcbiAgICBpZiAoIHZhbFsgMiBdICkge1xuICAgICAgcGF0aFsgaSBdID0gdmFsWyAyIF07XG4gICAgLy8gWyBcIlwiIF0gfHwgWyAnJyBdXG4gICAgfSBlbHNlIGlmICggdmFsWyA1IF0gIT0gbnVsbCApIHtcbiAgICAgIHBhdGhbIGkgXSA9IF91bmVzY2FwZSggdmFsWyA1IF0gKTtcbiAgICAvLyBbIDAgXVxuICAgIH0gZWxzZSB7XG4gICAgICBwYXRoWyBpIF0gPSB2YWxbIDMgXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGF0aDtcbn1cblxuZnVuY3Rpb24gY2FzdFBhdGggKCB2YWwgKSB7XG4gIHZhciBwYXRoLCBsLCBpO1xuXG4gIGlmICggaXNLZXkoIHZhbCApICkge1xuICAgIHJldHVybiBbIHRvS2V5KCB2YWwgKSBdO1xuICB9XG5cbiAgaWYgKCBfdHlwZSggdmFsICkgPT09ICdhcnJheScgKSB7XG4gICAgcGF0aCA9IEFycmF5KCBsID0gdmFsLmxlbmd0aCApO1xuXG4gICAgZm9yICggaSA9IGwgLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgIHBhdGhbIGkgXSA9IHRvS2V5KCB2YWxbIGkgXSApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwYXRoID0gc3RyaW5nVG9QYXRoKCAnJyArIHZhbCApO1xuICB9XG5cbiAgcmV0dXJuIHBhdGg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2FzdFBhdGg7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xhbXAgKCB2YWx1ZSwgbG93ZXIsIHVwcGVyICkge1xuICBpZiAoIHZhbHVlID49IHVwcGVyICkge1xuICAgIHJldHVybiB1cHBlcjtcbiAgfVxuXG4gIGlmICggdmFsdWUgPD0gbG93ZXIgKSB7XG4gICAgcmV0dXJuIGxvd2VyO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNyZWF0ZSAgICAgICAgID0gcmVxdWlyZSggJy4vY3JlYXRlJyApLFxuICAgIGdldFByb3RvdHlwZU9mID0gcmVxdWlyZSggJy4vZ2V0LXByb3RvdHlwZS1vZicgKSxcbiAgICB0b09iamVjdCAgICAgICA9IHJlcXVpcmUoICcuL3RvLW9iamVjdCcgKSxcbiAgICBlYWNoICAgICAgICAgICA9IHJlcXVpcmUoICcuL2VhY2gnICksXG4gICAgaXNPYmplY3RMaWtlICAgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QtbGlrZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjbG9uZSAoIGRlZXAsIHRhcmdldCwgZ3VhcmQgKSB7XG4gIHZhciBjbG47XG5cbiAgaWYgKCB0eXBlb2YgdGFyZ2V0ID09PSAndW5kZWZpbmVkJyB8fCBndWFyZCApIHtcbiAgICB0YXJnZXQgPSBkZWVwO1xuICAgIGRlZXAgPSB0cnVlO1xuICB9XG5cbiAgY2xuID0gY3JlYXRlKCBnZXRQcm90b3R5cGVPZiggdGFyZ2V0ID0gdG9PYmplY3QoIHRhcmdldCApICkgKTtcblxuICBlYWNoKCB0YXJnZXQsIGZ1bmN0aW9uICggdmFsdWUsIGtleSwgdGFyZ2V0ICkge1xuICAgIGlmICggdmFsdWUgPT09IHRhcmdldCApIHtcbiAgICAgIHRoaXNbIGtleSBdID0gdGhpcztcbiAgICB9IGVsc2UgaWYgKCBkZWVwICYmIGlzT2JqZWN0TGlrZSggdmFsdWUgKSApIHtcbiAgICAgIHRoaXNbIGtleSBdID0gY2xvbmUoIGRlZXAsIHZhbHVlICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXNbIGtleSBdID0gdmFsdWU7XG4gICAgfVxuICB9LCBjbG4gKTtcblxuICByZXR1cm4gY2xuO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEVSUjoge1xuICAgIElOVkFMSURfQVJHUzogICAgICAgICAgJ0ludmFsaWQgYXJndW1lbnRzJyxcbiAgICBGVU5DVElPTl9FWFBFQ1RFRDogICAgICdFeHBlY3RlZCBhIGZ1bmN0aW9uJyxcbiAgICBTVFJJTkdfRVhQRUNURUQ6ICAgICAgICdFeHBlY3RlZCBhIHN0cmluZycsXG4gICAgVU5ERUZJTkVEX09SX05VTEw6ICAgICAnQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0JyxcbiAgICBSRURVQ0VfT0ZfRU1QVFlfQVJSQVk6ICdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJyxcbiAgICBOT19QQVRIOiAgICAgICAgICAgICAgICdObyBwYXRoIHdhcyBnaXZlbidcbiAgfSxcblxuICBNQVhfQVJSQVlfTEVOR1RIOiA0Mjk0OTY3Mjk1LFxuICBNQVhfU0FGRV9JTlQ6ICAgICA5MDA3MTk5MjU0NzQwOTkxLFxuICBNSU5fU0FGRV9JTlQ6ICAgIC05MDA3MTk5MjU0NzQwOTkxLFxuXG4gIERFRVA6ICAgICAgICAgMSxcbiAgREVFUF9LRUVQX0ZOOiAyLFxuXG4gIFBMQUNFSE9MREVSOiB7fVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmluZVByb3BlcnRpZXMgPSByZXF1aXJlKCAnLi9kZWZpbmUtcHJvcGVydGllcycgKTtcblxudmFyIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZSggJy4vc2V0LXByb3RvdHlwZS1vZicgKTtcblxudmFyIGlzUHJpbWl0aXZlID0gcmVxdWlyZSggJy4vaXMtcHJpbWl0aXZlJyApO1xuXG5mdW5jdGlvbiBDICgpIHt9XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiBjcmVhdGUgKCBwcm90b3R5cGUsIGRlc2NyaXB0b3JzICkge1xuICB2YXIgb2JqZWN0O1xuXG4gIGlmICggcHJvdG90eXBlICE9PSBudWxsICYmIGlzUHJpbWl0aXZlKCBwcm90b3R5cGUgKSApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoICdPYmplY3QgcHJvdG90eXBlIG1heSBvbmx5IGJlIGFuIE9iamVjdCBvciBudWxsOiAnICsgcHJvdG90eXBlICk7XG4gIH1cblxuICBDLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcblxuICBvYmplY3QgPSBuZXcgQygpO1xuXG4gIEMucHJvdG90eXBlID0gbnVsbDtcblxuICBpZiAoIHByb3RvdHlwZSA9PT0gbnVsbCApIHtcbiAgICBzZXRQcm90b3R5cGVPZiggb2JqZWN0LCBudWxsICk7XG4gIH1cblxuICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPj0gMiApIHtcbiAgICBkZWZpbmVQcm9wZXJ0aWVzKCBvYmplY3QsIGRlc2NyaXB0b3JzICk7XG4gIH1cblxuICByZXR1cm4gb2JqZWN0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJhc2VGb3JFYWNoICA9IHJlcXVpcmUoICcuLi9iYXNlL2Jhc2UtZm9yLWVhY2gnICksXG4gICAgYmFzZUZvckluICAgID0gcmVxdWlyZSggJy4uL2Jhc2UvYmFzZS1mb3ItaW4nICksXG4gICAgaXNBcnJheUxpa2UgID0gcmVxdWlyZSggJy4uL2lzLWFycmF5LWxpa2UnICksXG4gICAgdG9PYmplY3QgICAgID0gcmVxdWlyZSggJy4uL3RvLW9iamVjdCcgKSxcbiAgICBpdGVyYXRlZSAgICAgPSByZXF1aXJlKCAnLi4vaXRlcmF0ZWUnICkuaXRlcmF0ZWUsXG4gICAga2V5cyAgICAgICAgID0gcmVxdWlyZSggJy4uL2tleXMnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlRWFjaCAoIGZyb21SaWdodCApIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGVhY2ggKCBvYmosIGZuLCBjdHggKSB7XG5cbiAgICBvYmogPSB0b09iamVjdCggb2JqICk7XG5cbiAgICBmbiAgPSBpdGVyYXRlZSggZm4gKTtcblxuICAgIGlmICggaXNBcnJheUxpa2UoIG9iaiApICkge1xuICAgICAgcmV0dXJuIGJhc2VGb3JFYWNoKCBvYmosIGZuLCBjdHgsIGZyb21SaWdodCApO1xuICAgIH1cblxuICAgIHJldHVybiBiYXNlRm9ySW4oIG9iaiwgZm4sIGN0eCwgZnJvbVJpZ2h0LCBrZXlzKCBvYmogKSApO1xuXG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE11c3QgYmUgJ1dpZHRoJyBvciAnSGVpZ2h0JyAoY2FwaXRhbGl6ZWQpLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUdldEVsZW1lbnREaW1lbnNpb24gKCBuYW1lICkge1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1dpbmRvd3xOb2RlfSBlXG4gICAqL1xuICByZXR1cm4gZnVuY3Rpb24gKCBlICkge1xuXG4gICAgdmFyIHYsIGIsIGQ7XG5cbiAgICAvLyBpZiB0aGUgZWxlbWVudCBpcyBhIHdpbmRvd1xuXG4gICAgaWYgKCBlLndpbmRvdyA9PT0gZSApIHtcblxuICAgICAgLy8gaW5uZXJXaWR0aCBhbmQgaW5uZXJIZWlnaHQgaW5jbHVkZXMgYSBzY3JvbGxiYXIgd2lkdGgsIGJ1dCBpdCBpcyBub3RcbiAgICAgIC8vIHN1cHBvcnRlZCBieSBvbGRlciBicm93c2Vyc1xuXG4gICAgICB2ID0gTWF0aC5tYXgoIGVbICdpbm5lcicgKyBuYW1lIF0gfHwgMCwgZS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnRbICdjbGllbnQnICsgbmFtZSBdICk7XG5cbiAgICAvLyBpZiB0aGUgZWxlbWVudHMgaXMgYSBkb2N1bWVudFxuXG4gICAgfSBlbHNlIGlmICggZS5ub2RlVHlwZSA9PT0gOSApIHtcblxuICAgICAgYiA9IGUuYm9keTtcbiAgICAgIGQgPSBlLmRvY3VtZW50RWxlbWVudDtcblxuICAgICAgdiA9IE1hdGgubWF4KFxuICAgICAgICBiWyAnc2Nyb2xsJyArIG5hbWUgXSxcbiAgICAgICAgZFsgJ3Njcm9sbCcgKyBuYW1lIF0sXG4gICAgICAgIGJbICdvZmZzZXQnICsgbmFtZSBdLFxuICAgICAgICBkWyAnb2Zmc2V0JyArIG5hbWUgXSxcbiAgICAgICAgYlsgJ2NsaWVudCcgKyBuYW1lIF0sXG4gICAgICAgIGRbICdjbGllbnQnICsgbmFtZSBdICk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdiA9IGVbICdjbGllbnQnICsgbmFtZSBdO1xuICAgIH1cblxuICAgIHJldHVybiB2O1xuXG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2FzdFBhdGggPSByZXF1aXJlKCAnLi4vY2FzdC1wYXRoJyApLFxuICAgIG5vb3AgICAgID0gcmVxdWlyZSggJy4uL25vb3AnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlUHJvcGVydHkgKCBiYXNlUHJvcGVydHksIHVzZUFyZ3MgKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoIHBhdGggKSB7XG4gICAgdmFyIGFyZ3M7XG5cbiAgICBpZiAoICEgKCBwYXRoID0gY2FzdFBhdGgoIHBhdGggKSApLmxlbmd0aCApIHtcbiAgICAgIHJldHVybiBub29wO1xuICAgIH1cblxuICAgIGlmICggdXNlQXJncyApIHtcbiAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICggb2JqZWN0ICkge1xuICAgICAgcmV0dXJuIGJhc2VQcm9wZXJ0eSggb2JqZWN0LCBwYXRoLCBhcmdzICk7XG4gICAgfTtcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVmYXVsdFRvICggdmFsdWUsIGRlZmF1bHRWYWx1ZSApIHtcbiAgaWYgKCB2YWx1ZSAhPSBudWxsICYmIHZhbHVlID09PSB2YWx1ZSApIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gZGVmYXVsdFZhbHVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1peGluID0gcmVxdWlyZSggJy4vbWl4aW4nICksXG4gICAgY2xvbmUgPSByZXF1aXJlKCAnLi9jbG9uZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWZhdWx0cyAoIGRlZmF1bHRzLCBvYmplY3QgKSB7XG4gIGlmICggb2JqZWN0ID09IG51bGwgKSB7XG4gICAgcmV0dXJuIGNsb25lKCB0cnVlLCBkZWZhdWx0cyApO1xuICB9XG5cbiAgcmV0dXJuIG1peGluKCB0cnVlLCBjbG9uZSggdHJ1ZSwgZGVmYXVsdHMgKSwgb2JqZWN0ICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3VwcG9ydCA9IHJlcXVpcmUoICcuL3N1cHBvcnQvc3VwcG9ydC1kZWZpbmUtcHJvcGVydHknICk7XG5cbnZhciBkZWZpbmVQcm9wZXJ0aWVzLCBiYXNlRGVmaW5lUHJvcGVydHksIGlzUHJpbWl0aXZlLCBlYWNoO1xuXG5pZiAoIHN1cHBvcnQgIT09ICdmdWxsJyApIHtcbiAgaXNQcmltaXRpdmUgICAgICAgID0gcmVxdWlyZSggJy4vaXMtcHJpbWl0aXZlJyApO1xuICBlYWNoICAgICAgICAgICAgICAgPSByZXF1aXJlKCAnLi9lYWNoJyApO1xuICBiYXNlRGVmaW5lUHJvcGVydHkgPSByZXF1aXJlKCAnLi9iYXNlL2Jhc2UtZGVmaW5lLXByb3BlcnR5JyApO1xuXG4gIGRlZmluZVByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzICggb2JqZWN0LCBkZXNjcmlwdG9ycyApIHtcbiAgICBpZiAoIHN1cHBvcnQgIT09ICdub3Qtc3VwcG9ydGVkJyApIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydGllcyggb2JqZWN0LCBkZXNjcmlwdG9ycyApO1xuICAgICAgfSBjYXRjaCAoIGUgKSB7fVxuICAgIH1cblxuICAgIGlmICggaXNQcmltaXRpdmUoIG9iamVjdCApICkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnZGVmaW5lUHJvcGVydGllcyBjYWxsZWQgb24gbm9uLW9iamVjdCcgKTtcbiAgICB9XG5cbiAgICBpZiAoIGlzUHJpbWl0aXZlKCBkZXNjcmlwdG9ycyApICkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCAnUHJvcGVydHkgZGVzY3JpcHRpb24gbXVzdCBiZSBhbiBvYmplY3Q6ICcgKyBkZXNjcmlwdG9ycyApO1xuICAgIH1cblxuICAgIGVhY2goIGRlc2NyaXB0b3JzLCBmdW5jdGlvbiAoIGRlc2NyaXB0b3IsIGtleSApIHtcbiAgICAgIGlmICggaXNQcmltaXRpdmUoIGRlc2NyaXB0b3IgKSApIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCAnUHJvcGVydHkgZGVzY3JpcHRpb24gbXVzdCBiZSBhbiBvYmplY3Q6ICcgKyBkZXNjcmlwdG9yICk7XG4gICAgICB9XG5cbiAgICAgIGJhc2VEZWZpbmVQcm9wZXJ0eSggdGhpcywga2V5LCBkZXNjcmlwdG9yICk7XG4gICAgfSwgb2JqZWN0ICk7XG5cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9O1xufSBlbHNlIHtcbiAgZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmluZVByb3BlcnRpZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSggJy4vY3JlYXRlL2NyZWF0ZS1lYWNoJyApKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSggJy4vY3JlYXRlL2NyZWF0ZS1nZXQtZWxlbWVudC1kaW1lbnNpb24nICkoICdIZWlnaHQnICk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSggJy4vY3JlYXRlL2NyZWF0ZS1nZXQtZWxlbWVudC1kaW1lbnNpb24nICkoICdXaWR0aCcgKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEVSUiA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5FUlI7XG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIGdldFByb3RvdHlwZU9mICggb2JqICkge1xuICB2YXIgcHJvdG90eXBlO1xuXG4gIGlmICggb2JqID09IG51bGwgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCBFUlIuVU5ERUZJTkVEX09SX05VTEwgKTtcbiAgfVxuXG4gIHByb3RvdHlwZSA9IG9iai5fX3Byb3RvX187IC8vIGpzaGludCBpZ25vcmU6IGxpbmVcblxuICBpZiAoIHR5cGVvZiBwcm90b3R5cGUgIT09ICd1bmRlZmluZWQnICkge1xuICAgIHJldHVybiBwcm90b3R5cGU7XG4gIH1cblxuICBpZiAoIHRvU3RyaW5nLmNhbGwoIG9iai5jb25zdHJ1Y3RvciApID09PSAnW29iamVjdCBGdW5jdGlvbl0nICkge1xuICAgIHJldHVybiBvYmouY29uc3RydWN0b3IucHJvdG90eXBlO1xuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QtbGlrZScgKSxcbiAgICBpc0xlbmd0aCAgICAgPSByZXF1aXJlKCAnLi9pcy1sZW5ndGgnICksXG4gICAgaXNXaW5kb3dMaWtlID0gcmVxdWlyZSggJy4vaXMtd2luZG93LWxpa2UnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBcnJheUxpa2VPYmplY3QgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSggdmFsdWUgKSAmJiBpc0xlbmd0aCggdmFsdWUubGVuZ3RoICkgJiYgISBpc1dpbmRvd0xpa2UoIHZhbHVlICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNMZW5ndGggICAgID0gcmVxdWlyZSggJy4vaXMtbGVuZ3RoJyApLFxuICAgIGlzV2luZG93TGlrZSA9IHJlcXVpcmUoICcuL2lzLXdpbmRvdy1saWtlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQXJyYXlMaWtlICggdmFsdWUgKSB7XG4gIGlmICggdmFsdWUgPT0gbnVsbCApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgKSB7XG4gICAgcmV0dXJuIGlzTGVuZ3RoKCB2YWx1ZS5sZW5ndGggKSAmJiAhaXNXaW5kb3dMaWtlKCB2YWx1ZSApO1xuICB9XG5cbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZyc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCAnLi9pcy1sZW5ndGgnICk7XG5cbnZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gaXNBcnJheSAoIHZhbHVlICkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKCB2YWx1ZSApICYmXG4gICAgaXNMZW5ndGgoIHZhbHVlLmxlbmd0aCApICYmXG4gICAgdG9TdHJpbmcuY2FsbCggdmFsdWUgKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfdHlwZSAgICA9IHJlcXVpcmUoICcuL190eXBlJyApO1xuXG52YXIgckRlZXBLZXkgPSAvKF58W15cXFxcXSkoXFxcXFxcXFwpKihcXC58XFxbKS87XG5cbmZ1bmN0aW9uIGlzS2V5ICggdmFsICkge1xuICB2YXIgdHlwZTtcblxuICBpZiAoICEgdmFsICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKCBfdHlwZSggdmFsICkgPT09ICdhcnJheScgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdHlwZSA9IHR5cGVvZiB2YWw7XG5cbiAgaWYgKCB0eXBlID09PSAnbnVtYmVyJyB8fCB0eXBlID09PSAnYm9vbGVhbicgfHwgX3R5cGUoIHZhbCApID09PSAnc3ltYm9sJyApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiAhIHJEZWVwS2V5LnRlc3QoIHZhbCApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzS2V5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTUFYX0FSUkFZX0xFTkdUSCA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5NQVhfQVJSQVlfTEVOR1RIO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzTGVuZ3RoICggdmFsdWUgKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmXG4gICAgdmFsdWUgPj0gMCAmJlxuICAgIHZhbHVlIDw9IE1BWF9BUlJBWV9MRU5HVEggJiZcbiAgICB2YWx1ZSAlIDEgPT09IDA7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzT2JqZWN0TGlrZSAoIHZhbHVlICkge1xuICByZXR1cm4gISEgdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCAnLi9pcy1vYmplY3QtbGlrZScgKTtcblxudmFyIHRvU3RyaW5nID0ge30udG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNPYmplY3QgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSggdmFsdWUgKSAmJlxuICAgIHRvU3RyaW5nLmNhbGwoIHZhbHVlICkgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFByb3RvdHlwZU9mID0gcmVxdWlyZSggJy4vZ2V0LXByb3RvdHlwZS1vZicgKTtcblxudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0JyApO1xuXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgdG9TdHJpbmcgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG5cbnZhciBPQkpFQ1QgPSB0b1N0cmluZy5jYWxsKCBPYmplY3QgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1BsYWluT2JqZWN0ICggdiApIHtcbiAgdmFyIHAsIGM7XG5cbiAgaWYgKCAhIGlzT2JqZWN0KCB2ICkgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcCA9IGdldFByb3RvdHlwZU9mKCB2ICk7XG5cbiAgaWYgKCBwID09PSBudWxsICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKCAhIGhhc093blByb3BlcnR5LmNhbGwoIHAsICdjb25zdHJ1Y3RvcicgKSApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjID0gcC5jb25zdHJ1Y3RvcjtcblxuICByZXR1cm4gdHlwZW9mIGMgPT09ICdmdW5jdGlvbicgJiYgdG9TdHJpbmcuY2FsbCggYyApID09PSBPQkpFQ1Q7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzUHJpbWl0aXZlICggdmFsdWUgKSB7XG4gIHJldHVybiAhIHZhbHVlIHx8XG4gICAgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyAmJlxuICAgIHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0eXBlID0gcmVxdWlyZSggJy4vdHlwZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1N5bWJvbCAoIHZhbHVlICkge1xuICByZXR1cm4gdHlwZSggdmFsdWUgKSA9PT0gJ3N5bWJvbCc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNXaW5kb3dMaWtlICggdmFsdWUgKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UoIHZhbHVlICkgJiYgdmFsdWUud2luZG93ID09PSB2YWx1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNzZXQgKCBrZXksIG9iaiApIHtcbiAgaWYgKCBvYmogPT0gbnVsbCApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHlwZW9mIG9ialsga2V5IF0gIT09ICd1bmRlZmluZWQnIHx8IGtleSBpbiBvYmo7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNBcnJheUxpa2VPYmplY3QgPSByZXF1aXJlKCAnLi9pcy1hcnJheS1saWtlLW9iamVjdCcgKSxcbiAgICBtYXRjaGVzUHJvcGVydHkgICA9IHJlcXVpcmUoICcuL21hdGNoZXMtcHJvcGVydHknICksXG4gICAgcHJvcGVydHkgICAgICAgICAgPSByZXF1aXJlKCAnLi9wcm9wZXJ0eScgKTtcblxuZXhwb3J0cy5pdGVyYXRlZSA9IGZ1bmN0aW9uIGl0ZXJhdGVlICggdmFsdWUgKSB7XG4gIGlmICggdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGlmICggaXNBcnJheUxpa2VPYmplY3QoIHZhbHVlICkgKSB7XG4gICAgcmV0dXJuIG1hdGNoZXNQcm9wZXJ0eSggdmFsdWUgKTtcbiAgfVxuXG4gIHJldHVybiBwcm9wZXJ0eSggdmFsdWUgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiYXNlS2V5cyA9IHJlcXVpcmUoICcuL2Jhc2UvYmFzZS1rZXlzJyApO1xudmFyIHRvT2JqZWN0ID0gcmVxdWlyZSggJy4vdG8tb2JqZWN0JyApO1xudmFyIHN1cHBvcnQgID0gcmVxdWlyZSggJy4vc3VwcG9ydC9zdXBwb3J0LWtleXMnICk7XG5cbmlmICggc3VwcG9ydCAhPT0gJ2VzMjAxNScgKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ga2V5cyAoIHYgKSB7XG4gICAgdmFyIF9rZXlzO1xuXG4gICAgLyoqXG4gICAgICogKyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICtcbiAgICAgKiB8IEkgdGVzdGVkIHRoZSBmdW5jdGlvbnMgd2l0aCBzdHJpbmdbMjA0OF0gKGFuIGFycmF5IG9mIHN0cmluZ3MpIGFuZCBoYWQgfFxuICAgICAqIHwgdGhpcyByZXN1bHRzIGluIG5vZGUuanMgKHY4LjEwLjApOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICogKyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICtcbiAgICAgKiB8IGJhc2VLZXlzIHggMTAsNjc0IG9wcy9zZWMgwrEwLjIzJSAoOTQgcnVucyBzYW1wbGVkKSAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAgKiB8IE9iamVjdC5rZXlzIHggMjIsMTQ3IG9wcy9zZWMgwrEwLjIzJSAoOTUgcnVucyBzYW1wbGVkKSAgICAgICAgICAgICAgICAgIHxcbiAgICAgKiB8IEZhc3Rlc3QgaXMgXCJPYmplY3Qua2V5c1wiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICogKyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICtcbiAgICAgKi9cblxuICAgIGlmICggc3VwcG9ydCA9PT0gJ2VzNScgKSB7XG4gICAgICBfa2V5cyA9IE9iamVjdC5rZXlzO1xuICAgIH0gZWxzZSB7XG4gICAgICBfa2V5cyA9IGJhc2VLZXlzO1xuICAgIH1cblxuICAgIHJldHVybiBfa2V5cyggdG9PYmplY3QoIHYgKSApO1xuICB9O1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBPYmplY3Qua2V5cztcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNhc3RQYXRoID0gcmVxdWlyZSggJy4vY2FzdC1wYXRoJyApLFxuICAgIGdldCAgICAgID0gcmVxdWlyZSggJy4vYmFzZS9iYXNlLWdldCcgKSxcbiAgICBFUlIgICAgICA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5FUlI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWF0Y2hlc1Byb3BlcnR5ICggcHJvcGVydHkgKSB7XG5cbiAgdmFyIHBhdGggID0gY2FzdFBhdGgoIHByb3BlcnR5WyAwIF0gKSxcbiAgICAgIHZhbHVlID0gcHJvcGVydHlbIDEgXTtcblxuICBpZiAoICEgcGF0aC5sZW5ndGggKSB7XG4gICAgdGhyb3cgRXJyb3IoIEVSUi5OT19QQVRIICk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKCBvYmplY3QgKSB7XG5cbiAgICBpZiAoIG9iamVjdCA9PSBudWxsICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICggcGF0aC5sZW5ndGggPiAxICkge1xuICAgICAgcmV0dXJuIGdldCggb2JqZWN0LCBwYXRoLCAwICkgPT09IHZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBvYmplY3RbIHBhdGhbIDAgXSBdID09PSB2YWx1ZTtcblxuICB9O1xuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNQbGFpbk9iamVjdCA9IHJlcXVpcmUoICcuL2lzLXBsYWluLW9iamVjdCcgKTtcblxudmFyIHRvT2JqZWN0ID0gcmVxdWlyZSggJy4vdG8tb2JqZWN0JyApO1xuXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoICcuL2lzLWFycmF5JyApO1xuXG52YXIga2V5cyA9IHJlcXVpcmUoICcuL2tleXMnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWl4aW4gKCBkZWVwLCBvYmplY3QgKSB7XG5cbiAgdmFyIGwgPSBhcmd1bWVudHMubGVuZ3RoO1xuXG4gIHZhciBpID0gMjtcblxuXG4gIHZhciBuYW1lcywgZXhwLCBqLCBrLCB2YWwsIGtleSwgbm93QXJyYXksIHNyYztcblxuICAvLyAgbWl4aW4oIHt9LCB7fSApXG5cbiAgaWYgKCB0eXBlb2YgZGVlcCAhPT0gJ2Jvb2xlYW4nICkge1xuICAgIG9iamVjdCA9IGRlZXA7XG4gICAgZGVlcCAgID0gdHJ1ZTtcbiAgICBpICAgICAgPSAxO1xuICB9XG5cbiAgLy8gdmFyIGV4dGVuZGFibGUgPSB7XG4gIC8vICAgZXh0ZW5kOiByZXF1aXJlKCAncGVha28vbWl4aW4nIClcbiAgLy8gfTtcblxuICAvLyBleHRlbmRhYmxlLmV4dGVuZCggeyBuYW1lOiAnRXh0ZW5kYWJsZSBPYmplY3QnIH0gKTtcblxuICBpZiAoIGkgPT09IGwgKSB7XG5cbiAgICBvYmplY3QgPSB0aGlzOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG5cbiAgICAtLWk7XG5cbiAgfVxuXG4gIG9iamVjdCA9IHRvT2JqZWN0KCBvYmplY3QgKTtcblxuICBmb3IgKCA7IGkgPCBsOyArK2kgKSB7XG4gICAgbmFtZXMgPSBrZXlzKCBleHAgPSB0b09iamVjdCggYXJndW1lbnRzWyBpIF0gKSApO1xuXG4gICAgZm9yICggaiA9IDAsIGsgPSBuYW1lcy5sZW5ndGg7IGogPCBrOyArK2ogKSB7XG4gICAgICB2YWwgPSBleHBbIGtleSA9IG5hbWVzWyBqIF0gXTtcblxuICAgICAgaWYgKCBkZWVwICYmIHZhbCAhPT0gZXhwICYmICggaXNQbGFpbk9iamVjdCggdmFsICkgfHwgKCBub3dBcnJheSA9IGlzQXJyYXkoIHZhbCApICkgKSApIHtcbiAgICAgICAgc3JjID0gb2JqZWN0WyBrZXkgXTtcblxuICAgICAgICBpZiAoIG5vd0FycmF5ICkge1xuICAgICAgICAgIGlmICggISBpc0FycmF5KCBzcmMgKSApIHtcbiAgICAgICAgICAgIHNyYyA9IFtdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG5vd0FycmF5ID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoICEgaXNQbGFpbk9iamVjdCggc3JjICkgKSB7XG4gICAgICAgICAgc3JjID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBvYmplY3RbIGtleSBdID0gbWl4aW4oIHRydWUsIHNyYywgdmFsICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvYmplY3RbIGtleSBdID0gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIG9iamVjdDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbm9vcCAoKSB7fTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbiBub3cgKCkge1xuICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmVmb3JlID0gcmVxdWlyZSggJy4vYmVmb3JlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG9uY2UgKCB0YXJnZXQgKSB7XG4gIHJldHVybiBiZWZvcmUoIDEsIHRhcmdldCApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCAnLi9jcmVhdGUvY3JlYXRlLXByb3BlcnR5JyApKCByZXF1aXJlKCAnLi9iYXNlL2Jhc2UtcHJvcGVydHknICkgKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzUHJpbWl0aXZlID0gcmVxdWlyZSggJy4vaXMtcHJpbWl0aXZlJyApLFxuICAgIEVSUiAgICAgICAgID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApLkVSUjtcblxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gc2V0UHJvdG90eXBlT2YgKCB0YXJnZXQsIHByb3RvdHlwZSApIHtcbiAgaWYgKCB0YXJnZXQgPT0gbnVsbCApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoIEVSUi5VTkRFRklORURfT1JfTlVMTCApO1xuICB9XG5cbiAgaWYgKCBwcm90b3R5cGUgIT09IG51bGwgJiYgaXNQcmltaXRpdmUoIHByb3RvdHlwZSApICkge1xuICAgIHRocm93IFR5cGVFcnJvciggJ09iamVjdCBwcm90b3R5cGUgbWF5IG9ubHkgYmUgYW4gT2JqZWN0IG9yIG51bGw6ICcgKyBwcm90b3R5cGUgKTtcbiAgfVxuXG4gIGlmICggJ19fcHJvdG9fXycgaW4gdGFyZ2V0ICkge1xuICAgIHRhcmdldC5fX3Byb3RvX18gPSBwcm90b3R5cGU7IC8vIGpzaGludCBpZ25vcmU6IGxpbmVcbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3VwcG9ydDtcblxuZnVuY3Rpb24gdGVzdCAoIHRhcmdldCApIHtcbiAgdHJ5IHtcbiAgICBpZiAoICcnIGluIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdGFyZ2V0LCAnJywge30gKSApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBjYXRjaCAoIGUgKSB7fVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuaWYgKCB0ZXN0KCB7fSApICkge1xuICBzdXBwb3J0ID0gJ2Z1bGwnO1xufSBlbHNlIGlmICggdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiB0ZXN0KCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc3BhbicgKSApICkge1xuICBzdXBwb3J0ID0gJ2RvbSc7XG59IGVsc2Uge1xuICBzdXBwb3J0ID0gJ25vdC1zdXBwb3J0ZWQnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdXBwb3J0O1xuXG5pZiAoIE9iamVjdC5rZXlzICkge1xuICB0cnkge1xuICAgIHN1cHBvcnQgPSBPYmplY3Qua2V5cyggJycgKSwgJ2VzMjAxNSc7IC8vIGpzaGludCBpZ25vcmU6IGxpbmVcbiAgfSBjYXRjaCAoIGUgKSB7XG4gICAgc3VwcG9ydCA9ICdlczUnO1xuICB9XG59IGVsc2UgaWYgKCB7IHRvU3RyaW5nOiBudWxsIH0ucHJvcGVydHlJc0VudW1lcmFibGUoICd0b1N0cmluZycgKSApIHtcbiAgc3VwcG9ydCA9ICdub3Qtc3VwcG9ydGVkJztcbn0gZWxzZSB7XG4gIHN1cHBvcnQgPSAnaGFzLWEtYnVnJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0O1xuIiwiLyoqXG4gKiBCYXNlZCBvbiBFcmlrIE3DtmxsZXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsOlxuICpcbiAqIEFkYXB0ZWQgZnJvbSBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9wYXVsaXJpc2gvMTU3OTY3MSB3aGljaCBkZXJpdmVkIGZyb21cbiAqIGh0dHA6Ly9wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4gKiBodHRwOi8vbXkub3BlcmEuY29tL2Vtb2xsZXIvYmxvZy8yMDExLzEyLzIwL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtZXItYW5pbWF0aW5nXG4gKlxuICogcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsIGJ5IEVyaWsgTcO2bGxlci5cbiAqIEZpeGVzIGZyb20gUGF1bCBJcmlzaCwgVGlubyBaaWpkZWwsIEFuZHJldyBNYW8sIEtsZW1lbiBTbGF2acSNLCBEYXJpdXMgQmFjb24uXG4gKlxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB0aW1lc3RhbXAgPSByZXF1aXJlKCAnLi90aW1lc3RhbXAnICk7XG5cbnZhciByZXF1ZXN0QUYsIGNhbmNlbEFGO1xuXG5pZiAoIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICkge1xuICBjYW5jZWxBRiA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRDYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96Q2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICByZXF1ZXN0QUYgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG59XG5cbnZhciBub1JlcXVlc3RBbmltYXRpb25GcmFtZSA9ICEgcmVxdWVzdEFGIHx8ICEgY2FuY2VsQUYgfHxcbiAgdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgL2lQKGFkfGhvbmV8b2QpLipPU1xcczYvLnRlc3QoIG5hdmlnYXRvci51c2VyQWdlbnQgKTtcblxuaWYgKCBub1JlcXVlc3RBbmltYXRpb25GcmFtZSApIHtcbiAgdmFyIGxhc3RSZXF1ZXN0VGltZSA9IDAsXG4gICAgICBmcmFtZUR1cmF0aW9uICAgPSAxMDAwIC8gNjA7XG5cbiAgZXhwb3J0cy5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdCAoIGFuaW1hdGUgKSB7XG4gICAgdmFyIG5vdyAgICAgICAgICAgICA9IHRpbWVzdGFtcCgpLFxuICAgICAgICBuZXh0UmVxdWVzdFRpbWUgPSBNYXRoLm1heCggbGFzdFJlcXVlc3RUaW1lICsgZnJhbWVEdXJhdGlvbiwgbm93ICk7XG5cbiAgICByZXR1cm4gc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgbGFzdFJlcXVlc3RUaW1lID0gbmV4dFJlcXVlc3RUaW1lO1xuICAgICAgYW5pbWF0ZSggbm93ICk7XG4gICAgfSwgbmV4dFJlcXVlc3RUaW1lIC0gbm93ICk7XG4gIH07XG5cbiAgZXhwb3J0cy5jYW5jZWwgPSBjbGVhclRpbWVvdXQ7XG59IGVsc2Uge1xuICBleHBvcnRzLnJlcXVlc3QgPSBmdW5jdGlvbiByZXF1ZXN0ICggYW5pbWF0ZSApIHtcbiAgICByZXR1cm4gcmVxdWVzdEFGKCBhbmltYXRlICk7XG4gIH07XG5cbiAgZXhwb3J0cy5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwgKCBpZCApIHtcbiAgICByZXR1cm4gY2FuY2VsQUYoIGlkICk7XG4gIH07XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBub3cgPSByZXF1aXJlKCAnLi9ub3cnICk7XG52YXIgbmF2aWdhdG9yU3RhcnQ7XG5cbmlmICggdHlwZW9mIHBlcmZvcm1hbmNlID09PSAndW5kZWZpbmVkJyB8fCAhIHBlcmZvcm1hbmNlLm5vdyApIHtcbiAgbmF2aWdhdG9yU3RhcnQgPSBub3coKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRpbWVzdGFtcCAoKSB7XG4gICAgcmV0dXJuIG5vdygpIC0gbmF2aWdhdG9yU3RhcnQ7XG4gIH07XG59IGVsc2Uge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRpbWVzdGFtcCAoKSB7XG4gICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpO1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3VuZXNjYXBlID0gcmVxdWlyZSggJy4vX3VuZXNjYXBlJyApLFxuICAgIGlzU3ltYm9sICA9IHJlcXVpcmUoICcuL2lzLXN5bWJvbCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b0tleSAoIHZhbCApIHtcbiAgdmFyIGtleTtcblxuICBpZiAoIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICkge1xuICAgIHJldHVybiBfdW5lc2NhcGUoIHZhbCApO1xuICB9XG5cbiAgaWYgKCBpc1N5bWJvbCggdmFsICkgKSB7XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuXG4gIGtleSA9ICcnICsgdmFsO1xuXG4gIGlmICgga2V5ID09PSAnMCcgJiYgMSAvIHZhbCA9PT0gLUluZmluaXR5ICkge1xuICAgIHJldHVybiAnLTAnO1xuICB9XG5cbiAgcmV0dXJuIF91bmVzY2FwZSgga2V5ICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRVJSID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApLkVSUjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b09iamVjdCAoIHZhbHVlICkge1xuICBpZiAoIHZhbHVlID09IG51bGwgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCBFUlIuVU5ERUZJTkVEX09SX05VTEwgKTtcbiAgfVxuXG4gIHJldHVybiBPYmplY3QoIHZhbHVlICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3JlYXRlID0gcmVxdWlyZSggJy4vY3JlYXRlJyApO1xuXG52YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZyxcbiAgICB0eXBlcyA9IGNyZWF0ZSggbnVsbCApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFR5cGUgKCB2YWx1ZSApIHtcbiAgdmFyIHR5cGUsIHRhZztcblxuICBpZiAoIHZhbHVlID09PSBudWxsICkge1xuICAgIHJldHVybiAnbnVsbCc7XG4gIH1cblxuICB0eXBlID0gdHlwZW9mIHZhbHVlO1xuXG4gIGlmICggdHlwZSAhPT0gJ29iamVjdCcgJiYgdHlwZSAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICByZXR1cm4gdHlwZTtcbiAgfVxuXG4gIHR5cGUgPSB0eXBlc1sgdGFnID0gdG9TdHJpbmcuY2FsbCggdmFsdWUgKSBdO1xuXG4gIGlmICggdHlwZSApIHtcbiAgICByZXR1cm4gdHlwZTtcbiAgfVxuXG4gIHJldHVybiAoIHR5cGVzWyB0YWcgXSA9IHRhZy5zbGljZSggOCwgLTEgKS50b0xvd2VyQ2FzZSgpICk7XG59O1xuIl19
