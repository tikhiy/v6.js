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
   * @method v6.ShaderProgram#setAttr
   * @chainable
   * @see [WebGLRenderingContext#enableVertexAttribArray](https://developer.mozilla.org/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray)
   * @see [WebGLRenderingContext#vertexAttribPointer](https://developer.mozilla.org/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)
   * @example
   * program.setAttr( 'apos', 2, gl.FLOAT, false, 0, 0 );
   */
  setAttr: function setAttr ( name, size, type, normalized, stride, offset )
  {
    var location = this.getAttr( name ).location;
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
   * @method v6.ShaderProgram#getAttr
   * @param  {string}     name Название атрибута.
   * @return {IAttribute}      Возвращает данные о атрибуте.
   * @example
   * var { location } = program.getAttr( 'apos' );
   */
  getAttr: function getAttr ( name )
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

},{"./internal/create_program":14,"./internal/create_shader":15}],2:[function(require,module,exports){
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

},{"light_emitter":36,"peako/timer":89,"peako/timestamp":90}],3:[function(require,module,exports){
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

},{"./mat3":18}],4:[function(require,module,exports){
'use strict';

var defaultTo = require( 'peako/default-to' );

var Vector2D  = require( '../math/Vector2D' );

function Camera ( renderer, options )
{
  if ( ! options ) {
    options = {};
  }

  this.xSpeed           = defaultTo( options.xSpeed, 1 );
  this.ySpeed           = defaultTo( options.ySpeed, 1 );
  this.zoomInSpeed      = defaultTo( options.zoomInSpeed,  1 );
  this.zoomOutSpeed     = defaultTo( options.zoomOutSpeed, 1 );

  this.zoom             = defaultTo( options.zoom,    1 );
  this.minZoom          = defaultTo( options.minZoom, 1 );
  this.maxZoom          = defaultTo( options.maxZoom, 1 );

  this.linearZoomIn     = defaultTo( options.linearZoomIn,  true );
  this.linearZoomOut    = defaultTo( options.linearZoomOut, true );

  this.offset           = options.offset;

  if ( renderer ) {
    if ( ! this.offset ) {
      this.offset = new Vector2D( renderer.w * 0.5, renderer.h * 0.5 );
    }

    this.renderer = renderer;
  } else if ( ! this.offset ) {
    this.offset = new Vector2D();
  }

  this.position = [
    0, 0,
    0, 0,
    0, 0
  ];
}

Camera.prototype = {
  update: function update ()
  {
    var pos = this.position;

    if ( pos[ 0 ] !== pos[ 2 ] ) {
      pos[ 0 ] += ( pos[ 2 ] - pos[ 0 ] ) * this.xSpeed;
    }

    if ( pos[ 1 ] !== pos[ 3 ] ) {
      pos[ 1 ] += ( pos[ 3 ] - pos[ 1 ] ) * this.ySpeed;
    }

    return this;
  },

  lookAt: function lookAt ( at )
  {
    var pos = this.position;
    var off = this.offset;

    pos[ 2 ] = off.x / this.zoom - at.x;
    pos[ 3 ] = off.y / this.zoom - at.y;
    pos[ 4 ] = at.x;
    pos[ 5 ] = at.y;

    return this;
  },

  shouldLookAt: function shouldLookAt ()
  {
    return new Vector2D( this.position[ 4 ], this.position[ 5 ] );
  },

  looksAt: function looksAt ()
  {
    var x = ( this.offset.x - this.position[ 0 ] * this.zoom ) / this.zoom;
    var y = ( this.offset.y - this.position[ 1 ] * this.zoom ) / this.zoom;
    return new Vector2D( x, y );
  },

  sees: function sees ( x, y, w, h, renderer )
  {
    var off = this.offset;
    var at  = this.looksAt();

    if ( ! renderer ) {
      renderer = this.renderer;
    }

    return x + w > at.x - off.x / this.zoom &&
           x     < at.x + ( renderer.w - off.x ) / this.zoom &&
           y + h > at.y - off.y / this.zoom &&
           y     < at.y + ( renderer.h - off.y ) / this.zoom;
  },

  zoomIn: function zoomIn ()
  {
    var speed;

    if ( this.zoom !== this.maxZoom ) {
      if ( this.linearZoomIn ) {
        speed = this.zoomInSpeed * this.zoom;
      } else {
        speed = this.zoomInSpeed;
      }

      this.zoom = Math.min( this.zoom + speed, this.maxZoom );
    }
  },

  zoomOut: function zoomOut ()
  {
    var speed;

    if ( this.zoom !== this.minZoom ) {
      if ( this.linearZoomOut ) {
        speed = this.zoomOutSpeed * this.zoom;
      } else {
        speed = this.zoomOutSpeed;
      }

      this.zoom = Math.max( this.zoom - speed, this.minZoom );
    }
  },

  constructor: Camera
};

module.exports = Camera;

},{"../math/Vector2D":20,"peako/default-to":59}],5:[function(require,module,exports){
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

},{"./RGBA":6,"./internal/parse":8,"peako/clamp":52}],6:[function(require,module,exports){
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

},{"./HSLA":5,"./internal/parse":8}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{"../HSLA":5,"../RGBA":6,"./colors":7}],9:[function(require,module,exports){
'use strict';

/**
 * Стандартные константы:
 * * `"AUTO"`
 * * `"GL"`
 * * `"2D"`
 * * `"LEFT"`
 * * `"TOP"`
 * * `"CENTER"`
 * * `"MIDDLE"`
 * * `"RIGHT"`
 * * `"BOTTOM"`
 * * `"PERCENT"`
 * * `"POINTS"`
 * * `"LINES"`
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

},{}],10:[function(require,module,exports){
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

},{"light_emitter":36}],11:[function(require,module,exports){
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

},{"./AbstractImage":10}],12:[function(require,module,exports){
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

},{"./AbstractImage":10,"./CompoundedImage":11}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
'use strict';

/**
 * @private
 * @member {object} polygons
 */

},{}],17:[function(require,module,exports){
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

},{"peako/noop":82}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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

},{"../settings":33}],20:[function(require,module,exports){
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

},{"../settings":33,"./AbstractVector":19}],21:[function(require,module,exports){
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
   * @method lineWidth
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
  stroke: function stroke ( r, g, b, a ) { if ( typeof r === 'undefined' ) { this._stroke(); } else if ( typeof r === 'boolean' ) { this._doStroke = r; } else { if ( typeof r === 'string' || this._strokeColor.type !== this.settings.color.type ) { this._strokeColor = new this.settings.color( r, g, b, a ); } else { this._strokeColor.set( r, g, b, a ); } this._doStroke = true; } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
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
  fill: function fill ( r, g, b, a ) { if ( typeof r === 'undefined' ) { this._fill(); } else if ( typeof r === 'boolean' ) { this._doFill = r; } else { if ( typeof r === 'string' || this._fillColor.type !== this.settings.color.type ) { this._fillColor = new this.settings.color( r, g, b, a ); } else { this._fillColor.set( r, g, b, a ); } this._doFill = true; } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
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

},{"../constants":9,"../internal/create_polygon":13,"../internal/polygons":16,"./internal/copy_drawing_settings":26,"./internal/get_webgl":29,"./internal/process_rect_align":30,"./internal/set_default_drawing_settings":31,"./settings":32,"peako/get-element-h":63,"peako/get-element-w":64}],23:[function(require,module,exports){
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

/**
 * @override
 * @method v6.Renderer2D#_fill
 */
Renderer2D.prototype._fill = function _fill ()
{
  this.context.fillStyle = this._fillColor;
  this.context.fill();
};

/**
 * @override
 * @method v6.Renderer2D#_stroke
 */
Renderer2D.prototype._stroke = function ()
{
  var context = this.context;

  context.strokeStyle = this._strokeColor;

  if ( ( context.lineWidth = this._lineWidth ) <= 1 ) {
    context.stroke();
  }

  context.stroke();
};

module.exports = Renderer2D;

},{"../constants":9,"./AbstractRenderer":22,"./internal/process_rect_align":30,"./settings":32,"peako/defaults":60}],24:[function(require,module,exports){
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
    .pointer( 'apos', 2, gl.FLOAT, false, 0, 0 );

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

},{"../ShaderProgram":1,"../Transform":3,"../constants":9,"../shaders":34,"./AbstractRenderer":22,"./internal/process_rect_align":30,"./settings":32,"peako/defaults":60}],25:[function(require,module,exports){
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

},{"../constants":9,"../internal/report":17,"./Renderer2D":23,"./RendererGL":24,"./internal/get_renderer_type":28,"./internal/get_webgl":29,"./settings":32}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
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

},{"../../constants":9}],28:[function(require,module,exports){
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

},{"../../constants":9,"peako/once":84,"platform":"platform"}],29:[function(require,module,exports){
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

},{"peako/once":84}],30:[function(require,module,exports){
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

},{"../../constants":9}],31:[function(require,module,exports){
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

},{"./copy_drawing_settings":26,"./default_drawing_settings":27}],32:[function(require,module,exports){
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

},{"../color/RGBA":6,"../constants":9}],33:[function(require,module,exports){
'use strict';

/**
 * Использовать градусы вместо радианов.
 */
exports.degress = false;

},{}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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

if ( typeof self !== 'undefined' ) {
  self.v6 = exports;
}

},{"./core/ShaderProgram":1,"./core/Ticker":2,"./core/Transform":3,"./core/camera/Camera":4,"./core/color/HSLA":5,"./core/color/RGBA":6,"./core/constants":9,"./core/image/AbstractImage":10,"./core/image/CompoundedImage":11,"./core/image/Image":12,"./core/math/AbstractVector":19,"./core/math/Vector2D":20,"./core/math/Vector3D":21,"./core/renderer":25,"./core/renderer/AbstractRenderer":22,"./core/renderer/Renderer2D":23,"./core/renderer/RendererGL":24,"./core/shaders":34}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString;

module.exports = function _throwArgumentException ( unexpected, expected ) {
  throw Error( '"' + toString.call( unexpected ) + '" is not ' + expected );
};

},{}],38:[function(require,module,exports){
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

},{"./type":93}],39:[function(require,module,exports){
'use strict';

module.exports = function _unescape ( string ) {
  return string.replace( /\\(\\)?/g, '$1' );
};

},{}],40:[function(require,module,exports){
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

},{"../isset":77}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
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

},{"../call-iteratee":50,"../isset":77}],43:[function(require,module,exports){
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

},{"../call-iteratee":50}],44:[function(require,module,exports){
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

},{"../isset":77}],45:[function(require,module,exports){
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

},{"./base-to-index":48}],46:[function(require,module,exports){
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

},{"../support/support-keys":88,"./base-index-of":45}],47:[function(require,module,exports){
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

},{"./base-get":44}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
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

},{"./_throw-argument-exception":37,"./default-to":59}],50:[function(require,module,exports){
'use strict';

module.exports = function callIteratee ( fn, ctx, val, key, obj ) {
  if ( typeof ctx === 'undefined' ) {
    return fn( val, key, obj );
  }

  return fn.call( ctx, val, key, obj );
};

},{}],51:[function(require,module,exports){
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

},{"./_type":38,"./_unescape":39,"./base/base-exec":41,"./is-key":69,"./to-key":91}],52:[function(require,module,exports){
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

},{}],53:[function(require,module,exports){
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

},{"./create":55,"./each":62,"./get-prototype-of":65,"./is-object-like":71,"./to-object":92}],54:[function(require,module,exports){
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

},{}],55:[function(require,module,exports){
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

},{"./define-properties":61,"./is-primitive":74,"./set-prototype-of":86}],56:[function(require,module,exports){
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

},{"../base/base-for-each":42,"../base/base-for-in":43,"../is-array-like":67,"../iteratee":78,"../keys":79,"../to-object":92}],57:[function(require,module,exports){
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

},{}],58:[function(require,module,exports){
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

},{"../cast-path":51,"../noop":82}],59:[function(require,module,exports){
'use strict';

module.exports = function defaultTo ( value, defaultValue ) {
  if ( value != null && value === value ) {
    return value;
  }

  return defaultValue;
};

},{}],60:[function(require,module,exports){
'use strict';

var mixin = require( './mixin' ),
    clone = require( './clone' );

module.exports = function defaults ( defaults, object ) {
  if ( object == null ) {
    return clone( true, defaults );
  }

  return mixin( true, clone( true, defaults ), object );
};

},{"./clone":53,"./mixin":81}],61:[function(require,module,exports){
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

},{"./base/base-define-property":40,"./each":62,"./is-primitive":74,"./support/support-define-property":87}],62:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-each' )();

},{"./create/create-each":56}],63:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-get-element-dimension' )( 'Height' );

},{"./create/create-get-element-dimension":57}],64:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-get-element-dimension' )( 'Width' );

},{"./create/create-get-element-dimension":57}],65:[function(require,module,exports){
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

},{"./constants":54}],66:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' ),
    isLength     = require( './is-length' ),
    isWindowLike = require( './is-window-like' );

module.exports = function isArrayLikeObject ( value ) {
  return isObjectLike( value ) && isLength( value.length ) && ! isWindowLike( value );
};

},{"./is-length":70,"./is-object-like":71,"./is-window-like":76}],67:[function(require,module,exports){
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

},{"./is-length":70,"./is-window-like":76}],68:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' ),
    isLength = require( './is-length' );

var toString = {}.toString;

module.exports = Array.isArray || function isArray ( value ) {
  return isObjectLike( value ) &&
    isLength( value.length ) &&
    toString.call( value ) === '[object Array]';
};

},{"./is-length":70,"./is-object-like":71}],69:[function(require,module,exports){
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

},{"./_type":38}],70:[function(require,module,exports){
'use strict';

var MAX_ARRAY_LENGTH = require( './constants' ).MAX_ARRAY_LENGTH;

module.exports = function isLength ( value ) {
  return typeof value === 'number' &&
    value >= 0 &&
    value <= MAX_ARRAY_LENGTH &&
    value % 1 === 0;
};

},{"./constants":54}],71:[function(require,module,exports){
'use strict';

module.exports = function isObjectLike ( value ) {
  return !! value && typeof value === 'object';
};

},{}],72:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );

var toString = {}.toString;

module.exports = function isObject ( value ) {
  return isObjectLike( value ) &&
    toString.call( value ) === '[object Object]';
};

},{"./is-object-like":71}],73:[function(require,module,exports){
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

},{"./get-prototype-of":65,"./is-object":72}],74:[function(require,module,exports){
'use strict';

module.exports = function isPrimitive ( value ) {
  return ! value ||
    typeof value !== 'object' &&
    typeof value !== 'function';
};

},{}],75:[function(require,module,exports){
'use strict';

var type = require( './type' );

module.exports = function isSymbol ( value ) {
  return type( value ) === 'symbol';
};

},{"./type":93}],76:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );

module.exports = function isWindowLike ( value ) {
  return isObjectLike( value ) && value.window === value;
};

},{"./is-object-like":71}],77:[function(require,module,exports){
'use strict';

module.exports = function isset ( key, obj ) {
  if ( obj == null ) {
    return false;
  }

  return typeof obj[ key ] !== 'undefined' || key in obj;
};

},{}],78:[function(require,module,exports){
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

},{"./is-array-like-object":66,"./matches-property":80,"./property":85}],79:[function(require,module,exports){
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

},{"./base/base-keys":46,"./support/support-keys":88,"./to-object":92}],80:[function(require,module,exports){
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

},{"./base/base-get":44,"./cast-path":51,"./constants":54}],81:[function(require,module,exports){
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

},{"./is-array":68,"./is-plain-object":73,"./keys":79,"./to-object":92}],82:[function(require,module,exports){
'use strict';

module.exports = function noop () {};

},{}],83:[function(require,module,exports){
'use strict';

module.exports = Date.now || function now () {
  return new Date().getTime();
};

},{}],84:[function(require,module,exports){
'use strict';

var before = require( './before' );

module.exports = function once ( target ) {
  return before( 1, target );
};

},{"./before":49}],85:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-property' )( require( './base/base-property' ) );

},{"./base/base-property":47,"./create/create-property":58}],86:[function(require,module,exports){
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

},{"./constants":54,"./is-primitive":74}],87:[function(require,module,exports){
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

},{}],88:[function(require,module,exports){
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

},{}],89:[function(require,module,exports){
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

},{"./timestamp":90}],90:[function(require,module,exports){
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

},{"./now":83}],91:[function(require,module,exports){
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

},{"./_unescape":39,"./is-symbol":75}],92:[function(require,module,exports){
'use strict';

var ERR = require( './constants' ).ERR;

module.exports = function toObject ( value ) {
  if ( value == null ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  return Object( value );
};

},{"./constants":54}],93:[function(require,module,exports){
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

},{"./create":55}]},{},[35])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb3JlL1NoYWRlclByb2dyYW0uanMiLCJjb3JlL1RpY2tlci5qcyIsImNvcmUvVHJhbnNmb3JtLmpzIiwiY29yZS9jYW1lcmEvQ2FtZXJhLmpzIiwiY29yZS9jb2xvci9IU0xBLmpzIiwiY29yZS9jb2xvci9SR0JBLmpzIiwiY29yZS9jb2xvci9pbnRlcm5hbC9jb2xvcnMuanMiLCJjb3JlL2NvbG9yL2ludGVybmFsL3BhcnNlLmpzIiwiY29yZS9jb25zdGFudHMuanMiLCJjb3JlL2ltYWdlL0Fic3RyYWN0SW1hZ2UuanMiLCJjb3JlL2ltYWdlL0NvbXBvdW5kZWRJbWFnZS5qcyIsImNvcmUvaW1hZ2UvSW1hZ2UuanMiLCJjb3JlL2ludGVybmFsL2NyZWF0ZV9wb2x5Z29uLmpzIiwiY29yZS9pbnRlcm5hbC9jcmVhdGVfcHJvZ3JhbS5qcyIsImNvcmUvaW50ZXJuYWwvY3JlYXRlX3NoYWRlci5qcyIsImNvcmUvaW50ZXJuYWwvcG9seWdvbnMuanMiLCJjb3JlL2ludGVybmFsL3JlcG9ydC5qcyIsImNvcmUvbWF0My5qcyIsImNvcmUvbWF0aC9BYnN0cmFjdFZlY3Rvci5qcyIsImNvcmUvbWF0aC9WZWN0b3IyRC5qcyIsImNvcmUvbWF0aC9WZWN0b3IzRC5qcyIsImNvcmUvcmVuZGVyZXIvQWJzdHJhY3RSZW5kZXJlci5qcyIsImNvcmUvcmVuZGVyZXIvUmVuZGVyZXIyRC5qcyIsImNvcmUvcmVuZGVyZXIvUmVuZGVyZXJHTC5qcyIsImNvcmUvcmVuZGVyZXIvaW5kZXguanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL2NvcHlfZHJhd2luZ19zZXR0aW5ncy5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvZGVmYXVsdF9kcmF3aW5nX3NldHRpbmdzLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9nZXRfcmVuZGVyZXJfdHlwZS5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvZ2V0X3dlYmdsLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24uanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL3NldF9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MuanMiLCJjb3JlL3JlbmRlcmVyL3NldHRpbmdzLmpzIiwiY29yZS9zZXR0aW5ncy5qcyIsImNvcmUvc2hhZGVycy5qcyIsImluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xpZ2h0X2VtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGVha28vX3Rocm93LWFyZ3VtZW50LWV4Y2VwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdHlwZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdW5lc2NhcGUuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZXhlYy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZm9yLWVhY2guanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWZvci1pbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZ2V0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1pbmRleC1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2Uta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLXRvLWluZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2JlZm9yZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jYWxsLWl0ZXJhdGVlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Nhc3QtcGF0aC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jbGFtcC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jbG9uZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jb25zdGFudHMuanMiLCJub2RlX21vZHVsZXMvcGVha28vY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NyZWF0ZS9jcmVhdGUtZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUvY3JlYXRlLWdldC1lbGVtZW50LWRpbWVuc2lvbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUvY3JlYXRlLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2RlZmF1bHQtdG8uanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmYXVsdHMuanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmaW5lLXByb3BlcnRpZXMuanMiLCJub2RlX21vZHVsZXMvcGVha28vZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9nZXQtZWxlbWVudC1oLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2dldC1lbGVtZW50LXcuanMiLCJub2RlX21vZHVsZXMvcGVha28vZ2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1hcnJheS1saWtlLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1hcnJheS1saWtlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWFycmF5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWtleS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1sZW5ndGguanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LWxpa2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXBsYWluLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1wcmltaXRpdmUuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtc3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXdpbmRvdy1saWtlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzc2V0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2l0ZXJhdGVlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2tleXMuanMiLCJub2RlX21vZHVsZXMvcGVha28vbWF0Y2hlcy1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9taXhpbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9ub29wLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL25vdy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9vbmNlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3Byb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3NldC1wcm90b3R5cGUtb2YuanMiLCJub2RlX21vZHVsZXMvcGVha28vc3VwcG9ydC9zdXBwb3J0LWRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9zdXBwb3J0L3N1cHBvcnQta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lci5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lc3RhbXAuanMiLCJub2RlX21vZHVsZXMvcGVha28vdG8ta2V5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3RvLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90eXBlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcmVhdGVQcm9ncmFtID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvY3JlYXRlX3Byb2dyYW0nICk7XG52YXIgY3JlYXRlU2hhZGVyICA9IHJlcXVpcmUoICcuL2ludGVybmFsL2NyZWF0ZV9zaGFkZXInICk7XG5cbi8qKlxuICogQGludGVyZmFjZSBJVW5pZm9ybVxuICovXG5cbi8qKlxuICogQGludGVyZmFjZSBJQXR0cmlidXRlXG4gKi9cblxuLyoqXG4gKiDQktGL0YHQvtC60L4t0YPRgNC+0LLQvdC10LLRi9C5INC40L3RgtC10YDRhNC10LnRgSDQtNC70Y8gV2ViR0xQcm9ncmFtLlxuICogQGNvbnN0cnVjdG9yIHY2LlNoYWRlclByb2dyYW1cbiAqIEBwYXJhbSB7SVNoYWRlclNvdXJjZXN9ICAgICAgICBzb3VyY2VzINCo0LXQudC00LXRgNGLINC00LvRjyDQv9GA0L7Qs9GA0LDQvNC80YsuXG4gKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgICAgICBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICogQGV4YW1wbGVcbiAqIHZhciBTaGFkZXJQcm9ncmFtID0gcmVxdWlyZSggJ3Y2LmpzL1NoYWRlclByb2dyYW0nICk7XG4gKiB2YXIgc2hhZGVycyAgICAgICA9IHJlcXVpcmUoICd2Ni5qcy9zaGFkZXJzJyApO1xuICogdmFyIGdsICAgICAgPSBjYW52YXMuZ2V0Q29udGV4dCggJ3dlYmdsJyApO1xuICogdmFyIHByb2dyYW0gPSBuZXcgU2hhZGVyUHJvZ3JhbSggc2hhZGVycy5iYXNpYywgZ2wgKTtcbiAqL1xuZnVuY3Rpb24gU2hhZGVyUHJvZ3JhbSAoIHNvdXJjZXMsIGdsIClcbntcbiAgdmFyIHZlcnQgPSBjcmVhdGVTaGFkZXIoIHNvdXJjZXMudmVydCwgZ2wuVkVSVEVYX1NIQURFUiwgZ2wgKTtcbiAgdmFyIGZyYWcgPSBjcmVhdGVTaGFkZXIoIHNvdXJjZXMuZnJhZywgZ2wuRlJBR01FTlRfU0hBREVSLCBnbCApO1xuXG4gIC8qKlxuICAgKiBXZWJHTCDQv9GA0L7Qs9GA0LDQvNC80LAg0YHQvtC30LTQsNC90L3QsNGPINGBINC/0L7QvNC+0YnRjNGOIHtAbGluayBjcmVhdGVQcm9ncmFtfS5cbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7V2ViR0xQcm9ncmFtfSB2Ni5TaGFkZXJQcm9ncmFtI19wcm9ncmFtXG4gICAqL1xuICB0aGlzLl9wcm9ncmFtID0gY3JlYXRlUHJvZ3JhbSggdmVydCwgZnJhZywgZ2wgKTtcblxuICAvKipcbiAgICogV2ViR0wg0LrQvtC90YLQtdC60YHRgi5cbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSB2Ni5TaGFkZXJQcm9ncmFtI19nbFxuICAgKi9cbiAgdGhpcy5fZ2wgPSBnbDtcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5TaGFkZXJQcm9ncmFtI191bmlmb3Jtc1xuICAgKi9cbiAgdGhpcy5fdW5pZm9ybXMgPSB7fTtcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5TaGFkZXJQcm9ncmFtI19hdHRyc1xuICAgKi9cbiAgdGhpcy5fYXR0cnMgPSB7fTtcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5TaGFkZXJQcm9ncmFtI191bmlmb3JtSW5kZXhcbiAgICovXG4gIHRoaXMuX3VuaWZvcm1JbmRleCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoIHRoaXMuX3Byb2dyYW0sIGdsLkFDVElWRV9VTklGT1JNUyApO1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlNoYWRlclByb2dyYW0jX2F0dHJJbmRleFxuICAgKi9cbiAgdGhpcy5fYXR0ckluZGV4ID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggdGhpcy5fcHJvZ3JhbSwgZ2wuQUNUSVZFX0FUVFJJQlVURVMgKTtcbn1cblxuU2hhZGVyUHJvZ3JhbS5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jdXNlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSBbV2ViR0xSZW5kZXJpbmdDb250ZXh0I3VzZVByb2dyYW1dKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RvY3MvV2ViL0FQSS9XZWJHTFJlbmRlcmluZ0NvbnRleHQvdXNlUHJvZ3JhbSlcbiAgICogQGV4YW1wbGVcbiAgICogcHJvZ3JhbS51c2UoKTtcbiAgICovXG4gIHVzZTogZnVuY3Rpb24gdXNlICgpXG4gIHtcbiAgICB0aGlzLl9nbC51c2VQcm9ncmFtKCB0aGlzLl9wcm9ncmFtICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuU2hhZGVyUHJvZ3JhbSNzZXRBdHRyXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSBbV2ViR0xSZW5kZXJpbmdDb250ZXh0I2VuYWJsZVZlcnRleEF0dHJpYkFycmF5XShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL1dlYi9BUEkvV2ViR0xSZW5kZXJpbmdDb250ZXh0L2VuYWJsZVZlcnRleEF0dHJpYkFycmF5KVxuICAgKiBAc2VlIFtXZWJHTFJlbmRlcmluZ0NvbnRleHQjdmVydGV4QXR0cmliUG9pbnRlcl0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZG9jcy9XZWIvQVBJL1dlYkdMUmVuZGVyaW5nQ29udGV4dC92ZXJ0ZXhBdHRyaWJQb2ludGVyKVxuICAgKiBAZXhhbXBsZVxuICAgKiBwcm9ncmFtLnNldEF0dHIoICdhcG9zJywgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwICk7XG4gICAqL1xuICBzZXRBdHRyOiBmdW5jdGlvbiBzZXRBdHRyICggbmFtZSwgc2l6ZSwgdHlwZSwgbm9ybWFsaXplZCwgc3RyaWRlLCBvZmZzZXQgKVxuICB7XG4gICAgdmFyIGxvY2F0aW9uID0gdGhpcy5nZXRBdHRyKCBuYW1lICkubG9jYXRpb247XG4gICAgdGhpcy5fZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoIGxvY2F0aW9uICk7XG4gICAgdGhpcy5fZ2wudmVydGV4QXR0cmliUG9pbnRlciggbG9jYXRpb24sIHNpemUsIHR5cGUsIG5vcm1hbGl6ZWQsIHN0cmlkZSwgb2Zmc2V0ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuU2hhZGVyUHJvZ3JhbSNnZXRVbmlmb3JtXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICBuYW1lINCd0LDQt9Cy0LDQvdC40LUgdW5pZm9ybS5cbiAgICogQHJldHVybiB7SVVuaWZvcm19ICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQsNC90L3Ri9C1INC+IHVuaWZvcm0uXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB7IGxvY2F0aW9uIH0gPSBwcm9ncmFtLmdldFVuaWZvcm0oICd1Y29sb3InICk7XG4gICAqL1xuICBnZXRVbmlmb3JtOiBmdW5jdGlvbiBnZXRVbmlmb3JtICggbmFtZSApXG4gIHtcbiAgICB2YXIgdW5pZm9ybSA9IHRoaXMuX3VuaWZvcm1zWyBuYW1lIF07XG4gICAgdmFyIGluZGV4LCBpbmZvO1xuXG4gICAgaWYgKCB1bmlmb3JtICkge1xuICAgICAgcmV0dXJuIHVuaWZvcm07XG4gICAgfVxuXG4gICAgd2hpbGUgKCAtLXRoaXMuX3VuaWZvcm1JbmRleCA+PSAwICkge1xuICAgICAgaW5mbyA9IHRoaXMuX2dsLmdldEFjdGl2ZVVuaWZvcm0oIHRoaXMuX3Byb2dyYW0sIHRoaXMuX3VuaWZvcm1JbmRleCApO1xuXG4gICAgICB1bmlmb3JtID0ge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKCB0aGlzLl9wcm9ncmFtLCBpbmZvLm5hbWUgKSxcbiAgICAgICAgc2l6ZTogaW5mby5zaXplLFxuICAgICAgICB0eXBlOiBpbmZvLnR5cGVcbiAgICAgIH07XG5cbiAgICAgIGlmICggaW5mby5zaXplID4gMSAmJiB+ICggaW5kZXggPSBpbmZvLm5hbWUuaW5kZXhPZiggJ1snICkgKSApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZS5zbGljZSggMCwgaW5kZXggKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fdW5pZm9ybXNbIHVuaWZvcm0ubmFtZSBdID0gdW5pZm9ybTtcblxuICAgICAgaWYgKCB1bmlmb3JtLm5hbWUgPT09IG5hbWUgKSB7XG4gICAgICAgIHJldHVybiB1bmlmb3JtO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IFJlZmVyZW5jZUVycm9yKCAnTm8gXCInICsgbmFtZSArICdcIiB1bmlmb3JtIGZvdW5kJyApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jZ2V0QXR0clxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgICBuYW1lINCd0LDQt9Cy0LDQvdC40LUg0LDRgtGA0LjQsdGD0YLQsC5cbiAgICogQHJldHVybiB7SUF0dHJpYnV0ZX0gICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQtNCw0L3QvdGL0LUg0L4g0LDRgtGA0LjQsdGD0YLQtS5cbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHsgbG9jYXRpb24gfSA9IHByb2dyYW0uZ2V0QXR0ciggJ2Fwb3MnICk7XG4gICAqL1xuICBnZXRBdHRyOiBmdW5jdGlvbiBnZXRBdHRyICggbmFtZSApXG4gIHtcbiAgICB2YXIgYXR0ciA9IHRoaXMuX2F0dHJzWyBuYW1lIF07XG5cbiAgICBpZiAoIGF0dHIgKSB7XG4gICAgICByZXR1cm4gYXR0cjtcbiAgICB9XG5cbiAgICB3aGlsZSAoIC0tdGhpcy5fYXR0ckluZGV4ID49IDAgKSB7XG4gICAgICBhdHRyICAgICAgICAgID0gdGhpcy5fZ2wuZ2V0QWN0aXZlQXR0cmliKCB0aGlzLl9wcm9ncmFtLCB0aGlzLl9hdHRySW5kZXggKTtcbiAgICAgIGF0dHIubG9jYXRpb24gPSB0aGlzLl9nbC5nZXRBdHRyaWJMb2NhdGlvbiggdGhpcy5fcHJvZ3JhbSwgbmFtZSApO1xuICAgICAgdGhpcy5fYXR0cnNbIG5hbWUgXSA9IGF0dHI7XG5cbiAgICAgIGlmICggYXR0ci5uYW1lID09PSBuYW1lICkge1xuICAgICAgICByZXR1cm4gYXR0cjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBSZWZlcmVuY2VFcnJvciggJ05vIFwiJyArIG5hbWUgKyAnXCIgYXR0cmlidXRlIGZvdW5kJyApO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBTaGFkZXJQcm9ncmFtXG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuU2hhZGVyUHJvZ3JhbSNzZXRVbmlmb3JtXG4gKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWUgIE5hbWUgb2YgdGhlIHVuaWZvcm0uXG4gKiBAcGFyYW0gIHthbnl9ICAgIHZhbHVlIFZhbHVlIHlvdSB3YW50IHRvIHNldCB0byB0aGUgdW5pZm9ybS5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBwcm9ncmFtLnNldFVuaWZvcm0oICd1Y29sb3InLCBbIDI1NSwgMCwgMCwgMSBdICk7XG4gKi9cblNoYWRlclByb2dyYW0ucHJvdG90eXBlLnNldFVuaWZvcm0gPSBmdW5jdGlvbiBzZXRVbmlmb3JtICggbmFtZSwgdmFsdWUgKVxue1xuICB2YXIgdW5pZm9ybSA9IHRoaXMuZ2V0VW5pZm9ybSggbmFtZSApO1xuICB2YXIgX2dsICAgICA9IHRoaXMuX2dsO1xuXG4gIHN3aXRjaCAoIHVuaWZvcm0udHlwZSApIHtcbiAgICBjYXNlIF9nbC5CT09MOlxuICAgIGNhc2UgX2dsLklOVDpcbiAgICAgIGlmICggdW5pZm9ybS5zaXplID4gMSApIHtcbiAgICAgICAgX2dsLnVuaWZvcm0xaXYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfZ2wudW5pZm9ybTFpKCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBfZ2wuRkxPQVQ6XG4gICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgIF9nbC51bmlmb3JtMWZ2KCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2dsLnVuaWZvcm0xZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgX2dsLkZMT0FUX01BVDI6XG4gICAgICBfZ2wudW5pZm9ybU1hdHJpeDJmdiggdW5pZm9ybS5sb2NhdGlvbiwgZmFsc2UsIHZhbHVlICk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIF9nbC5GTE9BVF9NQVQzOlxuICAgICAgX2dsLnVuaWZvcm1NYXRyaXgzZnYoIHVuaWZvcm0ubG9jYXRpb24sIGZhbHNlLCB2YWx1ZSApO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBfZ2wuRkxPQVRfTUFUNDpcbiAgICAgIF9nbC51bmlmb3JtTWF0cml4NGZ2KCB1bmlmb3JtLmxvY2F0aW9uLCBmYWxzZSwgdmFsdWUgKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgX2dsLkZMT0FUX1ZFQzI6XG4gICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgIF9nbC51bmlmb3JtMmZ2KCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2dsLnVuaWZvcm0yZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWVbIDAgXSwgdmFsdWVbIDEgXSApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBfZ2wuRkxPQVRfVkVDMzpcbiAgICAgIGlmICggdW5pZm9ybS5zaXplID4gMSApIHtcbiAgICAgICAgX2dsLnVuaWZvcm0zZnYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfZ2wudW5pZm9ybTNmKCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZVsgMCBdLCB2YWx1ZVsgMSBdLCB2YWx1ZVsgMiBdICk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIF9nbC5GTE9BVF9WRUM0OlxuICAgICAgaWYgKCB1bmlmb3JtLnNpemUgPiAxICkge1xuICAgICAgICBfZ2wudW5pZm9ybTRmdiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9nbC51bmlmb3JtNGYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlWyAwIF0sIHZhbHVlWyAxIF0sIHZhbHVlWyAyIF0sIHZhbHVlWyAzIF0gKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoICdUaGUgdW5pZm9ybSB0eXBlIGlzIG5vdCBzdXBwb3J0ZWQnICk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2hhZGVyUHJvZ3JhbTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIExpZ2h0RW1pdHRlciA9IHJlcXVpcmUoICdsaWdodF9lbWl0dGVyJyApO1xudmFyIHRpbWVzdGFtcCAgICA9IHJlcXVpcmUoICdwZWFrby90aW1lc3RhbXAnICk7XG52YXIgdGltZXIgICAgICAgID0gcmVxdWlyZSggJ3BlYWtvL3RpbWVyJyApO1xuXG4vKipcbiAqINCt0YLQvtGCINC60LvQsNGB0YEg0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC00LvRjyDQt9Cw0YbQuNC60LvQuNCy0LDQvdC40Y8g0LDQvdC40LzQsNGG0LjQuCDQstC80LXRgdGC0L4gYHJlcXVlc3RBbmltYXRpb25GcmFtZWAuXG4gKiBAY29uc3RydWN0b3IgdjYuVGlja2VyXG4gKiBAZXh0ZW5kcyB7TGlnaHRFbWl0dGVyfVxuICogQGZpcmVzIHVwZGF0ZVxuICogQGZpcmVzIHJlbmRlclxuICogQGV4YW1wbGVcbiAqIHZhciBUaWNrZXIgPSByZXF1aXJlKCAndjYuanMvVGlja2VyJyApO1xuICogdmFyIHRpY2tlciA9IG5ldyBUaWNrZXIoKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlwidXBkYXRlXCIgZXZlbnQuPC9jYXB0aW9uPlxuICogLy8gRmlyZXMgZXZlcnl0aW1lIGFuIGFwcGxpY2F0aW9uIHNob3VsZCBiZSB1cGRhdGVkLlxuICogLy8gRGVwZW5kcyBvbiBtYXhpbXVtIEZQUy5cbiAqIHRpY2tlci5vbiggJ3VwZGF0ZScsIGZ1bmN0aW9uICggZWxhcHNlZFRpbWUgKSB7XG4gKiAgIHNoYXBlLnJvdGF0aW9uICs9IDEwICogZWxhcHNlZFRpbWU7XG4gKiB9ICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5cInJlbmRlclwiIGV2ZW50LjwvY2FwdGlvbj5cbiAqIC8vIEZpcmVzIGV2ZXJ5dGltZSBhbiBhcHBsaWNhdGlvbiBzaG91bGQgYmUgcmVuZGVyZWQuXG4gKiAvLyBVbmxpa2UgXCJ1cGRhdGVcIiwgaW5kZXBlbmRlbnQgZnJvbSBtYXhpbXVtIEZQUy5cbiAqIHRpY2tlci5vbiggJ3JlbmRlcicsIGZ1bmN0aW9uICgpIHtcbiAqICAgcmVuZGVyZXIucm90YXRlKCBzaGFwZS5yb3RhdGlvbiApO1xuICogfSApO1xuICovXG5mdW5jdGlvbiBUaWNrZXIgKClcbntcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIExpZ2h0RW1pdHRlci5jYWxsKCB0aGlzICk7XG5cbiAgdGhpcy5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSAwO1xuICB0aGlzLmxhc3RSZXF1ZXN0VGltZSA9IDA7XG4gIHRoaXMuc2tpcHBlZFRpbWUgPSAwO1xuICB0aGlzLnRvdGFsVGltZSA9IDA7XG4gIHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiDQl9Cw0L/Rg9GB0LrQsNC10YIg0YbQuNC60Lsg0LDQvdC40LzQsNGG0LjQuC5cbiAgICogQG1ldGhvZCB2Ni5UaWNrZXIjc3RhcnRcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiB0aWNrZXIuc3RhcnQoKTtcbiAgICovXG4gIGZ1bmN0aW9uIHN0YXJ0ICggX25vdyApXG4gIHtcbiAgICB2YXIgZWxhcHNlZFRpbWU7XG5cbiAgICBpZiAoICEgc2VsZi5ydW5uaW5nICkge1xuICAgICAgaWYgKCAhIF9ub3cgKSB7XG4gICAgICAgIHNlbGYubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlEID0gdGltZXIucmVxdWVzdCggc3RhcnQgKTtcbiAgICAgICAgc2VsZi5sYXN0UmVxdWVzdFRpbWUgPSB0aW1lc3RhbXAoKTtcbiAgICAgICAgc2VsZi5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taW52YWxpZC10aGlzXG4gICAgfVxuXG4gICAgaWYgKCAhIF9ub3cgKSB7XG4gICAgICBfbm93ID0gdGltZXN0YW1wKCk7XG4gICAgfVxuXG4gICAgZWxhcHNlZFRpbWUgPSBNYXRoLm1pbiggMSwgKCBfbm93IC0gc2VsZi5sYXN0UmVxdWVzdFRpbWUgKSAqIDAuMDAxICk7XG5cbiAgICBzZWxmLnNraXBwZWRUaW1lICs9IGVsYXBzZWRUaW1lO1xuICAgIHNlbGYudG90YWxUaW1lICAgKz0gZWxhcHNlZFRpbWU7XG5cbiAgICB3aGlsZSAoIHNlbGYuc2tpcHBlZFRpbWUgPj0gc2VsZi5zdGVwICYmIHNlbGYucnVubmluZyApIHtcbiAgICAgIHNlbGYuc2tpcHBlZFRpbWUgLT0gc2VsZi5zdGVwO1xuICAgICAgc2VsZi5lbWl0KCAndXBkYXRlJywgc2VsZi5zdGVwLCBfbm93ICk7XG4gICAgfVxuXG4gICAgc2VsZi5lbWl0KCAncmVuZGVyJywgZWxhcHNlZFRpbWUsIF9ub3cgKTtcbiAgICBzZWxmLmxhc3RSZXF1ZXN0VGltZSA9IF9ub3c7XG4gICAgc2VsZi5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSB0aW1lci5yZXF1ZXN0KCBzdGFydCApO1xuXG4gICAgcmV0dXJuIHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taW52YWxpZC10aGlzXG4gIH1cblxuICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XG4gIHRoaXMuZnBzKCA2MCApO1xufVxuXG5UaWNrZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggTGlnaHRFbWl0dGVyLnByb3RvdHlwZSApO1xuVGlja2VyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRpY2tlcjtcblxuLyoqXG4gKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiDQvNCw0LrRgdC40LzQsNC70YzQvdC+0LUg0LrQvtC70LjRh9C10YHRgtCy0L4g0LrQsNC00YDQvtCyINCyINGB0LXQutGD0L3QtNGDIChGUFMpINCw0L3QuNC80LDRhtC40LguXG4gKiBAbWV0aG9kIHY2LlRpY2tlciNmcHNcbiAqIEBwYXJhbSB7bnVtYmVyfSBmcHMg0JzQsNC60YHQuNC80LDQu9GM0L3Ri9C5IEZQUywg0L3QsNC/0YDQuNC80LXRgDogNjAuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogLy8gU2V0IG1heGltdW0gYW5pbWF0aW9uIEZQUyB0byAxMC5cbiAqIC8vIERvIG5vdCBuZWVkIHRvIHJlc3RhcnQgdGlja2VyLlxuICogdGlja2VyLmZwcyggMTAgKTtcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5mcHMgPSBmdW5jdGlvbiBmcHMgKCBmcHMgKVxue1xuICB0aGlzLnN0ZXAgPSAxIC8gZnBzO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjY2xlYXJcbiAqIEBjaGFpbmFibGVcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuc2tpcHBlZFRpbWUgPSAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0J7RgdGC0LDQvdCw0LLQu9C40LLQsNC10YIg0LDQvdC40LzQsNGG0LjRji5cbiAqIEBtZXRob2QgdjYuVGlja2VyI3N0b3BcbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiB0aWNrZXIub24oICdyZW5kZXInLCBmdW5jdGlvbiAoKSB7XG4gKiAgIC8vIFN0b3AgdGhlIHRpY2tlciBhZnRlciBmaXZlIHNlY29uZHMuXG4gKiAgIGlmICggdGhpcy50b3RhbFRpbWUgPj0gNSApIHtcbiAqICAgICB0aWNrZXIuc3RvcCgpO1xuICogICB9XG4gKiB9ICk7XG4gKi9cblRpY2tlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIHN0b3AgKClcbntcbiAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUaWNrZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBtYXQzID0gcmVxdWlyZSggJy4vbWF0MycgKTtcblxuZnVuY3Rpb24gVHJhbnNmb3JtICgpXG57XG4gIHRoaXMubWF0cml4ID0gbWF0My5pZGVudGl0eSgpO1xuICB0aGlzLl9pbmRleCA9IC0xO1xuICB0aGlzLl9zdGFjayA9IFtdO1xufVxuXG5UcmFuc2Zvcm0ucHJvdG90eXBlID0ge1xuICBzYXZlOiBmdW5jdGlvbiBzYXZlICgpXG4gIHtcbiAgICBpZiAoICsrdGhpcy5faW5kZXggPCB0aGlzLl9zdGFjay5sZW5ndGggKSB7XG4gICAgICBtYXQzLmNvcHkoIHRoaXMuX3N0YWNrWyB0aGlzLl9pbmRleCBdLCB0aGlzLm1hdHJpeCApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zdGFjay5wdXNoKCBtYXQzLmNsb25lKCB0aGlzLm1hdHJpeCApICk7XG4gICAgfVxuICB9LFxuXG4gIHJlc3RvcmU6IGZ1bmN0aW9uIHJlc3RvcmUgKClcbiAge1xuICAgIGlmICggdGhpcy5faW5kZXggPj0gMCApIHtcbiAgICAgIG1hdDMuY29weSggdGhpcy5tYXRyaXgsIHRoaXMuX3N0YWNrWyB0aGlzLl9pbmRleC0tIF0gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWF0My5zZXRJZGVudGl0eSggdGhpcy5tYXRyaXggKTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0VHJhbnNmb3JtOiBmdW5jdGlvbiBzZXRUcmFuc2Zvcm0gKCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG4gIHtcbiAgICBtYXQzLnNldFRyYW5zZm9ybSggdGhpcy5tYXRyaXgsIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5ICk7XG4gIH0sXG5cbiAgdHJhbnNsYXRlOiBmdW5jdGlvbiB0cmFuc2xhdGUgKCB4LCB5IClcbiAge1xuICAgIG1hdDMudHJhbnNsYXRlKCB0aGlzLm1hdHJpeCwgeCwgeSApO1xuICB9LFxuXG4gIHJvdGF0ZTogZnVuY3Rpb24gcm90YXRlICggYW5nbGUgKVxuICB7XG4gICAgbWF0My5yb3RhdGUoIHRoaXMubWF0cml4LCBhbmdsZSApO1xuICB9LFxuXG4gIHNjYWxlOiBmdW5jdGlvbiBzY2FsZSAoIHgsIHkgKVxuICB7XG4gICAgbWF0My5zY2FsZSggdGhpcy5tYXRyaXgsIHgsIHkgKTtcbiAgfSxcblxuICAvKipcbiAgICog0J/RgNC40LzQtdC90Y/QtdGCIFwidHJhbnNmb3JtYXRpb24gbWF0cml4XCIg0LjQtyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40YUg0L/QsNGA0LDQvNC10YLRgNC+0LIg0L3QsCDRgtC10LrRg9GJ0LjQuSBcInRyYW5zZm9ybWF0aW9uIG1hdHJpeFwiLlxuICAgKiBAbWV0aG9kIHY2LlRyYW5zZm9ybSN0cmFuc2Zvcm1cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgbTExIFggc2NhbGUuXG4gICAqIEBwYXJhbSAge251bWJlcn0gIG0xMiBYIHNrZXcuXG4gICAqIEBwYXJhbSAge251bWJlcn0gIG0yMSBZIHNrZXcuXG4gICAqIEBwYXJhbSAge251bWJlcn0gIG0yMiBZIHNjYWxlLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBkeCAgWCB0cmFuc2xhdGUuXG4gICAqIEBwYXJhbSAge251bWJlcn0gIGR5ICBZIHRyYW5zbGF0ZS5cbiAgICogQHJldHVybiB7dm9pZH0gICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBBcHBseSBzY2FsZWQgdHdpY2UgXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIi5cbiAgICogdHJhbnNmb3JtLnRyYW5zZm9ybSggMiwgMCwgMCwgMiwgMCwgMCApO1xuICAgKi9cbiAgdHJhbnNmb3JtOiBmdW5jdGlvbiB0cmFuc2Zvcm0gKCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG4gIHtcbiAgICBtYXQzLnRyYW5zZm9ybSggdGhpcy5tYXRyaXgsIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5ICk7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IFRyYW5zZm9ybVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkZWZhdWx0VG8gPSByZXF1aXJlKCAncGVha28vZGVmYXVsdC10bycgKTtcblxudmFyIFZlY3RvcjJEICA9IHJlcXVpcmUoICcuLi9tYXRoL1ZlY3RvcjJEJyApO1xuXG5mdW5jdGlvbiBDYW1lcmEgKCByZW5kZXJlciwgb3B0aW9ucyApXG57XG4gIGlmICggISBvcHRpb25zICkge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuXG4gIHRoaXMueFNwZWVkICAgICAgICAgICA9IGRlZmF1bHRUbyggb3B0aW9ucy54U3BlZWQsIDEgKTtcbiAgdGhpcy55U3BlZWQgICAgICAgICAgID0gZGVmYXVsdFRvKCBvcHRpb25zLnlTcGVlZCwgMSApO1xuICB0aGlzLnpvb21JblNwZWVkICAgICAgPSBkZWZhdWx0VG8oIG9wdGlvbnMuem9vbUluU3BlZWQsICAxICk7XG4gIHRoaXMuem9vbU91dFNwZWVkICAgICA9IGRlZmF1bHRUbyggb3B0aW9ucy56b29tT3V0U3BlZWQsIDEgKTtcblxuICB0aGlzLnpvb20gICAgICAgICAgICAgPSBkZWZhdWx0VG8oIG9wdGlvbnMuem9vbSwgICAgMSApO1xuICB0aGlzLm1pblpvb20gICAgICAgICAgPSBkZWZhdWx0VG8oIG9wdGlvbnMubWluWm9vbSwgMSApO1xuICB0aGlzLm1heFpvb20gICAgICAgICAgPSBkZWZhdWx0VG8oIG9wdGlvbnMubWF4Wm9vbSwgMSApO1xuXG4gIHRoaXMubGluZWFyWm9vbUluICAgICA9IGRlZmF1bHRUbyggb3B0aW9ucy5saW5lYXJab29tSW4sICB0cnVlICk7XG4gIHRoaXMubGluZWFyWm9vbU91dCAgICA9IGRlZmF1bHRUbyggb3B0aW9ucy5saW5lYXJab29tT3V0LCB0cnVlICk7XG5cbiAgdGhpcy5vZmZzZXQgICAgICAgICAgID0gb3B0aW9ucy5vZmZzZXQ7XG5cbiAgaWYgKCByZW5kZXJlciApIHtcbiAgICBpZiAoICEgdGhpcy5vZmZzZXQgKSB7XG4gICAgICB0aGlzLm9mZnNldCA9IG5ldyBWZWN0b3IyRCggcmVuZGVyZXIudyAqIDAuNSwgcmVuZGVyZXIuaCAqIDAuNSApO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgfSBlbHNlIGlmICggISB0aGlzLm9mZnNldCApIHtcbiAgICB0aGlzLm9mZnNldCA9IG5ldyBWZWN0b3IyRCgpO1xuICB9XG5cbiAgdGhpcy5wb3NpdGlvbiA9IFtcbiAgICAwLCAwLFxuICAgIDAsIDAsXG4gICAgMCwgMFxuICBdO1xufVxuXG5DYW1lcmEucHJvdG90eXBlID0ge1xuICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZSAoKVxuICB7XG4gICAgdmFyIHBvcyA9IHRoaXMucG9zaXRpb247XG5cbiAgICBpZiAoIHBvc1sgMCBdICE9PSBwb3NbIDIgXSApIHtcbiAgICAgIHBvc1sgMCBdICs9ICggcG9zWyAyIF0gLSBwb3NbIDAgXSApICogdGhpcy54U3BlZWQ7XG4gICAgfVxuXG4gICAgaWYgKCBwb3NbIDEgXSAhPT0gcG9zWyAzIF0gKSB7XG4gICAgICBwb3NbIDEgXSArPSAoIHBvc1sgMyBdIC0gcG9zWyAxIF0gKSAqIHRoaXMueVNwZWVkO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGxvb2tBdDogZnVuY3Rpb24gbG9va0F0ICggYXQgKVxuICB7XG4gICAgdmFyIHBvcyA9IHRoaXMucG9zaXRpb247XG4gICAgdmFyIG9mZiA9IHRoaXMub2Zmc2V0O1xuXG4gICAgcG9zWyAyIF0gPSBvZmYueCAvIHRoaXMuem9vbSAtIGF0Lng7XG4gICAgcG9zWyAzIF0gPSBvZmYueSAvIHRoaXMuem9vbSAtIGF0Lnk7XG4gICAgcG9zWyA0IF0gPSBhdC54O1xuICAgIHBvc1sgNSBdID0gYXQueTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNob3VsZExvb2tBdDogZnVuY3Rpb24gc2hvdWxkTG9va0F0ICgpXG4gIHtcbiAgICByZXR1cm4gbmV3IFZlY3RvcjJEKCB0aGlzLnBvc2l0aW9uWyA0IF0sIHRoaXMucG9zaXRpb25bIDUgXSApO1xuICB9LFxuXG4gIGxvb2tzQXQ6IGZ1bmN0aW9uIGxvb2tzQXQgKClcbiAge1xuICAgIHZhciB4ID0gKCB0aGlzLm9mZnNldC54IC0gdGhpcy5wb3NpdGlvblsgMCBdICogdGhpcy56b29tICkgLyB0aGlzLnpvb207XG4gICAgdmFyIHkgPSAoIHRoaXMub2Zmc2V0LnkgLSB0aGlzLnBvc2l0aW9uWyAxIF0gKiB0aGlzLnpvb20gKSAvIHRoaXMuem9vbTtcbiAgICByZXR1cm4gbmV3IFZlY3RvcjJEKCB4LCB5ICk7XG4gIH0sXG5cbiAgc2VlczogZnVuY3Rpb24gc2VlcyAoIHgsIHksIHcsIGgsIHJlbmRlcmVyIClcbiAge1xuICAgIHZhciBvZmYgPSB0aGlzLm9mZnNldDtcbiAgICB2YXIgYXQgID0gdGhpcy5sb29rc0F0KCk7XG5cbiAgICBpZiAoICEgcmVuZGVyZXIgKSB7XG4gICAgICByZW5kZXJlciA9IHRoaXMucmVuZGVyZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHggKyB3ID4gYXQueCAtIG9mZi54IC8gdGhpcy56b29tICYmXG4gICAgICAgICAgIHggICAgIDwgYXQueCArICggcmVuZGVyZXIudyAtIG9mZi54ICkgLyB0aGlzLnpvb20gJiZcbiAgICAgICAgICAgeSArIGggPiBhdC55IC0gb2ZmLnkgLyB0aGlzLnpvb20gJiZcbiAgICAgICAgICAgeSAgICAgPCBhdC55ICsgKCByZW5kZXJlci5oIC0gb2ZmLnkgKSAvIHRoaXMuem9vbTtcbiAgfSxcblxuICB6b29tSW46IGZ1bmN0aW9uIHpvb21JbiAoKVxuICB7XG4gICAgdmFyIHNwZWVkO1xuXG4gICAgaWYgKCB0aGlzLnpvb20gIT09IHRoaXMubWF4Wm9vbSApIHtcbiAgICAgIGlmICggdGhpcy5saW5lYXJab29tSW4gKSB7XG4gICAgICAgIHNwZWVkID0gdGhpcy56b29tSW5TcGVlZCAqIHRoaXMuem9vbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWVkID0gdGhpcy56b29tSW5TcGVlZDtcbiAgICAgIH1cblxuICAgICAgdGhpcy56b29tID0gTWF0aC5taW4oIHRoaXMuem9vbSArIHNwZWVkLCB0aGlzLm1heFpvb20gKTtcbiAgICB9XG4gIH0sXG5cbiAgem9vbU91dDogZnVuY3Rpb24gem9vbU91dCAoKVxuICB7XG4gICAgdmFyIHNwZWVkO1xuXG4gICAgaWYgKCB0aGlzLnpvb20gIT09IHRoaXMubWluWm9vbSApIHtcbiAgICAgIGlmICggdGhpcy5saW5lYXJab29tT3V0ICkge1xuICAgICAgICBzcGVlZCA9IHRoaXMuem9vbU91dFNwZWVkICogdGhpcy56b29tO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3BlZWQgPSB0aGlzLnpvb21PdXRTcGVlZDtcbiAgICAgIH1cblxuICAgICAgdGhpcy56b29tID0gTWF0aC5tYXgoIHRoaXMuem9vbSAtIHNwZWVkLCB0aGlzLm1pblpvb20gKTtcbiAgICB9XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IENhbWVyYVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gSFNMQTtcblxudmFyIGNsYW1wID0gcmVxdWlyZSggJ3BlYWtvL2NsYW1wJyApOyAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxudmFyIHBhcnNlID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcGFyc2UnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxudmFyIFJHQkEgID0gcmVxdWlyZSggJy4vUkdCQScgKTsgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuLyoqXG4gKiBIU0xBINGG0LLQtdGCLlxuICogQGNvbnN0cnVjdG9yIHY2LkhTTEFcbiAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW2hdIEh1ZSB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW3NdIFNhdHVyYXRpb24gdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtsXSBMaWdodG5lc3MgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSB2YWx1ZS5cbiAqIEBzZWUgdjYuSFNMQSNzZXRcbiAqIEBleGFtcGxlXG4gKiB2YXIgSFNMQSA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2NvbG9yL0hTTEEnICk7XG4gKlxuICogdmFyIHRyYW5zcGFyZW50ID0gbmV3IEhTTEEoICd0cmFuc3BhcmVudCcgKTtcbiAqIHZhciBtYWdlbnRhICAgICA9IG5ldyBIU0xBKCAnbWFnZW50YScgKTtcbiAqIHZhciBmdWNoc2lhICAgICA9IG5ldyBIU0xBKCAzMDAsIDEwMCwgNTAgKTtcbiAqIHZhciBnaG9zdCAgICAgICA9IG5ldyBIU0xBKCAxMDAsIDAuMSApO1xuICogdmFyIHdoaXRlICAgICAgID0gbmV3IEhTTEEoIDEwMCApO1xuICogdmFyIGJsYWNrICAgICAgID0gbmV3IEhTTEEoKTtcbiAqL1xuZnVuY3Rpb24gSFNMQSAoIGgsIHMsIGwsIGEgKVxue1xuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzAgXCJodWVcIiB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSFNMQSMxIFwic2F0dXJhdGlvblwiIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzIgXCJsaWdodG5lc3NcIiB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSFNMQSMzIFwiYWxwaGFcIiB2YWx1ZS5cbiAgICovXG5cbiAgdGhpcy5zZXQoIGgsIHMsIGwsIGEgKTtcbn1cblxuSFNMQS5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQstC+0YHQv9GA0LjQvdC40LzQsNC10LzRg9GOINGP0YDQutC+0YHRgtGMIChwZXJjZWl2ZWQgYnJpZ2h0bmVzcykg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI3BlcmNlaXZlZEJyaWdodG5lc3NcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggJ21hZ2VudGEnICkucGVyY2VpdmVkQnJpZ2h0bmVzcygpOyAvLyAtPiAxNjMuODc1OTQzOTMzMjA4MlxuICAgKi9cbiAgcGVyY2VpdmVkQnJpZ2h0bmVzczogZnVuY3Rpb24gcGVyY2VpdmVkQnJpZ2h0bmVzcyAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLnBlcmNlaXZlZEJyaWdodG5lc3MoKTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0L7RgtC90L7RgdC40YLQtdC70YzQvdGD0Y4g0Y/RgNC60L7RgdGC0Ywg0YbQstC10YLQsC5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI2x1bWluYW5jZVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUmVsYXRpdmVfbHVtaW5hbmNlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5sdW1pbmFuY2UoKTsgLy8gLT4gNzIuNjI0XG4gICAqL1xuICBsdW1pbmFuY2U6IGZ1bmN0aW9uIGx1bWluYW5jZSAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLmx1bWluYW5jZSgpO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjYnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL0FFUlQvI2NvbG9yLWNvbnRyYXN0XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5icmlnaHRuZXNzKCk7IC8vIC0+IDEwNS4zMTVcbiAgICovXG4gIGJyaWdodG5lc3M6IGZ1bmN0aW9uIGJyaWdodG5lc3MgKClcbiAge1xuICAgIHJldHVybiB0aGlzLnJnYmEoKS5icmlnaHRuZXNzKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIENTUy1jb2xvciDRgdGC0YDQvtC60YMuXG4gICAqIEBtZXRob2QgdjYuSFNMQSN0b1N0cmluZ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBleGFtcGxlXG4gICAqICcnICsgbmV3IEhTTEEoICdyZWQnICk7IC8vIC0+IFwiaHNsYSgwLCAxMDAlLCA1MCUsIDEpXCJcbiAgICovXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiB0b1N0cmluZyAoKVxuICB7XG4gICAgcmV0dXJuICdoc2xhKCcgKyB0aGlzWyAwIF0gKyAnLCAnICsgdGhpc1sgMSBdICsgJ1xcdTAwMjUsICcgKyB0aGlzWyAyIF0gKyAnXFx1MDAyNSwgJyArIHRoaXNbIDMgXSArICcpJztcbiAgfSxcblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgSCwgUywgTCwgQSDQt9C90LDRh9C10L3QuNGPLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjc2V0XG4gICAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW2hdIEh1ZSB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbc10gU2F0dXJhdGlvbiB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbbF0gTGlnaHRuZXNzIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSB2YWx1ZS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LkhTTEFcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoKS5zZXQoIDEwMCwgMC41ICk7IC8vIC0+IDAsIDAsIDEwMCwgMC41XG4gICAqL1xuICBzZXQ6IGZ1bmN0aW9uIHNldCAoIGgsIHMsIGwsIGEgKVxuICB7XG4gICAgc3dpdGNoICggdHJ1ZSApIHtcbiAgICAgIGNhc2UgdHlwZW9mIGggPT09ICdzdHJpbmcnOlxuICAgICAgICBoID0gcGFyc2UoIGggKTtcbiAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgY2FzZSB0eXBlb2YgaCA9PT0gJ29iamVjdCcgJiYgaCAhPT0gbnVsbDpcbiAgICAgICAgaWYgKCBoLnR5cGUgIT09IHRoaXMudHlwZSApIHtcbiAgICAgICAgICBoID0gaFsgdGhpcy50eXBlIF0oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IGhbIDAgXTtcbiAgICAgICAgdGhpc1sgMSBdID0gaFsgMSBdO1xuICAgICAgICB0aGlzWyAyIF0gPSBoWyAyIF07XG4gICAgICAgIHRoaXNbIDMgXSA9IGhbIDMgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBzd2l0Y2ggKCB2b2lkIDAgKSB7XG4gICAgICAgICAgY2FzZSBoOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBsID0gcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBzOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBsID0gTWF0aC5mbG9vciggaCApO1xuICAgICAgICAgICAgcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBsOlxuICAgICAgICAgICAgYSA9IHM7XG4gICAgICAgICAgICBsID0gTWF0aC5mbG9vciggaCApO1xuICAgICAgICAgICAgcyA9IGggPSAwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBhOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGggPSBNYXRoLmZsb29yKCBoICk7XG4gICAgICAgICAgICBzID0gTWF0aC5mbG9vciggcyApO1xuICAgICAgICAgICAgbCA9IE1hdGguZmxvb3IoIGwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IGg7XG4gICAgICAgIHRoaXNbIDEgXSA9IHM7XG4gICAgICAgIHRoaXNbIDIgXSA9IGw7XG4gICAgICAgIHRoaXNbIDMgXSA9IGE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCa0L7QvdCy0LXRgNGC0LjRgNGD0LXRgiDQsiB7QGxpbmsgdjYuUkdCQX0uXG4gICAqIEBtZXRob2QgdjYuSFNMQSNyZ2JhXG4gICAqIEByZXR1cm4ge3Y2LlJHQkF9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5yZ2JhKCk7IC8vIC0+IG5ldyBSR0JBKCAyNTUsIDAsIDI1NSwgMSApXG4gICAqL1xuICByZ2JhOiBmdW5jdGlvbiByZ2JhICgpXG4gIHtcbiAgICB2YXIgcmdiYSA9IG5ldyBSR0JBKCk7XG5cbiAgICB2YXIgaCA9IHRoaXNbIDAgXSAlIDM2MCAvIDM2MDtcbiAgICB2YXIgcyA9IHRoaXNbIDEgXSAqIDAuMDE7XG4gICAgdmFyIGwgPSB0aGlzWyAyIF0gKiAwLjAxO1xuXG4gICAgdmFyIHRyID0gaCArIDEgLyAzO1xuICAgIHZhciB0ZyA9IGg7XG4gICAgdmFyIHRiID0gaCAtIDEgLyAzO1xuXG4gICAgdmFyIHE7XG5cbiAgICBpZiAoIGwgPCAwLjUgKSB7XG4gICAgICBxID0gbCAqICggMSArIHMgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcSA9IGwgKyBzIC0gbCAqIHM7XG4gICAgfVxuXG4gICAgdmFyIHAgPSAyICogbCAtIHE7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuICAgIGlmICggdHIgPCAwICkge1xuICAgICAgKyt0cjtcbiAgICB9XG5cbiAgICBpZiAoIHRnIDwgMCApIHtcbiAgICAgICsrdGc7XG4gICAgfVxuXG4gICAgaWYgKCB0YiA8IDAgKSB7XG4gICAgICArK3RiO1xuICAgIH1cblxuICAgIGlmICggdHIgPiAxICkge1xuICAgICAgLS10cjtcbiAgICB9XG5cbiAgICBpZiAoIHRnID4gMSApIHtcbiAgICAgIC0tdGc7XG4gICAgfVxuXG4gICAgaWYgKCB0YiA+IDEgKSB7XG4gICAgICAtLXRiO1xuICAgIH1cblxuICAgIHJnYmFbIDAgXSA9IGZvbyggdHIsIHAsIHEgKTtcbiAgICByZ2JhWyAxIF0gPSBmb28oIHRnLCBwLCBxICk7XG4gICAgcmdiYVsgMiBdID0gZm9vKCB0YiwgcCwgcSApO1xuICAgIHJnYmFbIDMgXSA9IHRoaXNbIDMgXTtcblxuICAgIHJldHVybiByZ2JhO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5IU0xBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjbGVycFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBoXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHNcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgbFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB2YWx1ZVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAc2VlIHY2LkhTTEEjbGVycENvbG9yXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCA1MCwgMC4yNSApLmxlcnAoIDAsIDAsIDEwMCwgMC41ICk7IC8vIC0+IG5ldyBIU0xBKCAwLCAwLCA3NSwgMC4yNSApXG4gICAqL1xuICBsZXJwOiBmdW5jdGlvbiBsZXJwICggaCwgcywgbCwgdmFsdWUgKVxuICB7XG4gICAgdmFyIGNvbG9yID0gbmV3IEhTTEEoKTtcbiAgICBjb2xvclsgMCBdID0gaDtcbiAgICBjb2xvclsgMSBdID0gcztcbiAgICBjb2xvclsgMiBdID0gbDtcbiAgICByZXR1cm4gdGhpcy5sZXJwQ29sb3IoIGNvbG9yLCB2YWx1ZSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5IU0xBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyBgY29sb3JgLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjbGVycENvbG9yXG4gICAqIEBwYXJhbSAge1RDb2xvcn0gIGNvbG9yXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHZhbHVlXG4gICAqIEByZXR1cm4ge3Y2LkhTTEF9XG4gICAqIEBzZWUgdjYuSFNMQSNsZXJwXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBhID0gbmV3IEhTTEEoIDUwLCAwLjI1ICk7XG4gICAqIHZhciBiID0gbmV3IEhTTEEoIDEwMCwgMCApO1xuICAgKiB2YXIgYyA9IGEubGVycENvbG9yKCBiLCAwLjUgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDAsIDc1LCAwLjI1IClcbiAgICovXG4gIGxlcnBDb2xvcjogZnVuY3Rpb24gbGVycENvbG9yICggY29sb3IsIHZhbHVlIClcbiAge1xuICAgIHJldHVybiB0aGlzLnJnYmEoKS5sZXJwQ29sb3IoIGNvbG9yLCB2YWx1ZSApLmhzbGEoKTtcbiAgfSxcblxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSB7QGxpbmsgdjYuSFNMQX0gLSDQt9Cw0YLQtdC80L3QtdC90L3Ri9C5INC40LvQuCDQt9Cw0YHQstC10YLQu9C10L3QvdGL0Lkg0L3QsCBgcGVyY2VudGFnZWAg0L/RgNC+0YbQtdC90YLQvtCyLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjc2hhZGVcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgcGVyY2VudGFnZVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSggMCwgMTAwLCA3NSwgMSApLnNoYWRlKCAtMTAgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDEwMCwgNjUsIDEgKVxuICAgKi9cbiAgc2hhZGU6IGZ1bmN0aW9uIHNoYWRlICggcGVyY2VudGFnZSApXG4gIHtcbiAgICB2YXIgaHNsYSA9IG5ldyBIU0xBKCk7XG4gICAgaHNsYVsgMCBdID0gdGhpc1sgMCBdO1xuICAgIGhzbGFbIDEgXSA9IHRoaXNbIDEgXTtcbiAgICBoc2xhWyAyIF0gPSBjbGFtcCggdGhpc1sgMiBdICsgcGVyY2VudGFnZSwgMCwgMTAwICk7XG4gICAgaHNsYVsgMyBdID0gdGhpc1sgMyBdO1xuICAgIHJldHVybiBoc2xhO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBIU0xBXG59O1xuXG4vKipcbiAqIEBtZW1iZXIge3N0cmluZ30gdjYuSFNMQSN0eXBlIGBcImhzbGFcImAuINCt0YLQviDRgdCy0L7QudGB0YLQstC+INC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0LrQvtC90LLQtdGA0YLQuNGA0L7QstCw0L3QuNGPINC80LXQttC00YMge0BsaW5rIHY2LlJHQkF9INC4IHtAbGluayB2Ni5IU0xBfS5cbiAqL1xuSFNMQS5wcm90b3R5cGUudHlwZSA9ICdoc2xhJztcblxuZnVuY3Rpb24gZm9vICggdCwgcCwgcSApXG57XG4gIGlmICggdCA8IDEgLyA2ICkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCAoIHAgKyAoIHEgLSBwICkgKiA2ICogdCApICogMjU1ICk7XG4gIH1cblxuICBpZiAoIHQgPCAwLjUgKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoIHEgKiAyNTUgKTtcbiAgfVxuXG4gIGlmICggdCA8IDIgLyAzICkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCAoIHAgKyAoIHEgLSBwICkgKiAoIDIgLyAzIC0gdCApICogNiApICogMjU1ICk7XG4gIH1cblxuICByZXR1cm4gTWF0aC5yb3VuZCggcCAqIDI1NSApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJHQkE7XG5cbnZhciBwYXJzZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3BhcnNlJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbnZhciBIU0xBICA9IHJlcXVpcmUoICcuL0hTTEEnICk7ICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHZhcnMtb24tdG9wXG5cbi8qKlxuICogUkdCQSDRhtCy0LXRgi5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5SR0JBXG4gKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXSBSZWQgY2hhbm5lbCB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2ddIEdyZWVuIGNoYW5uZWwgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtiXSBCbHVlIGNoYW5uZWwgdmFsdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSBjaGFubmVsIHZhbHVlLlxuICogQHNlZSB2Ni5SR0JBI3NldFxuICogQGV4YW1wbGVcbiAqIHZhciBSR0JBID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29sb3IvUkdCQScgKTtcbiAqXG4gKiB2YXIgdHJhbnNwYXJlbnQgPSBuZXcgUkdCQSggJ3RyYW5zcGFyZW50JyApO1xuICogdmFyIG1hZ2VudGEgICAgID0gbmV3IFJHQkEoICdtYWdlbnRhJyApO1xuICogdmFyIGZ1Y2hzaWEgICAgID0gbmV3IFJHQkEoIDI1NSwgMCwgMjU1ICk7XG4gKiB2YXIgZ2hvc3QgICAgICAgPSBuZXcgUkdCQSggMjU1LCAwLjEgKTtcbiAqIHZhciB3aGl0ZSAgICAgICA9IG5ldyBSR0JBKCAyNTUgKTtcbiAqIHZhciBibGFjayAgICAgICA9IG5ldyBSR0JBKCk7XG4gKi9cbmZ1bmN0aW9uIFJHQkEgKCByLCBnLCBiLCBhIClcbntcbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMwIFwicmVkXCIgY2hhbm5lbCB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMxIFwiZ3JlZW5cIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5SR0JBIzIgXCJibHVlXCIgY2hhbm5lbCB2YWx1ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuUkdCQSMzIFwiYWxwaGFcIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICB0aGlzLnNldCggciwgZywgYiwgYSApO1xufVxuXG5SR0JBLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINCy0L7RgdC/0YDQuNC90LjQvNCw0LXQvNGD0Y4g0Y/RgNC60L7RgdGC0YwgKHBlcmNlaXZlZCBicmlnaHRuZXNzKSDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjcGVyY2VpdmVkQnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzU5NjI0M1xuICAgKiBAc2VlIGh0dHA6Ly9hbGllbnJ5ZGVyZmxleC5jb20vaHNwLmh0bWxcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoICdtYWdlbnRhJyApLnBlcmNlaXZlZEJyaWdodG5lc3MoKTsgLy8gLT4gMTYzLjg3NTk0MzkzMzIwODJcbiAgICovXG4gIHBlcmNlaXZlZEJyaWdodG5lc3M6IGZ1bmN0aW9uIHBlcmNlaXZlZEJyaWdodG5lc3MgKClcbiAge1xuICAgIHZhciByID0gdGhpc1sgMCBdO1xuICAgIHZhciBnID0gdGhpc1sgMSBdO1xuICAgIHZhciBiID0gdGhpc1sgMiBdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoIDAuMjk5ICogciAqIHIgKyAwLjU4NyAqIGcgKiBnICsgMC4xMTQgKiBiICogYiApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQvtGC0L3QvtGB0LjRgtC10LvRjNC90YPRjiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjbHVtaW5hbmNlXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SZWxhdGl2ZV9sdW1pbmFuY2VcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoICdtYWdlbnRhJyApLmx1bWluYW5jZSgpOyAvLyAtPiA3Mi42MjRcbiAgICovXG4gIGx1bWluYW5jZTogZnVuY3Rpb24gbHVtaW5hbmNlICgpXG4gIHtcbiAgICByZXR1cm4gdGhpc1sgMCBdICogMC4yMTI2ICsgdGhpc1sgMSBdICogMC43MTUyICsgdGhpc1sgMiBdICogMC4wNzIyO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjYnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL0FFUlQvI2NvbG9yLWNvbnRyYXN0XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAnbWFnZW50YScgKS5icmlnaHRuZXNzKCk7IC8vIC0+IDEwNS4zMTVcbiAgICovXG4gIGJyaWdodG5lc3M6IGZ1bmN0aW9uIGJyaWdodG5lc3MgKClcbiAge1xuICAgIHJldHVybiAwLjI5OSAqIHRoaXNbIDAgXSArIDAuNTg3ICogdGhpc1sgMSBdICsgMC4xMTQgKiB0aGlzWyAyIF07XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIENTUy1jb2xvciDRgdGC0YDQvtC60YMuXG4gICAqIEBtZXRob2QgdjYuUkdCQSN0b1N0cmluZ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBleGFtcGxlXG4gICAqICcnICsgbmV3IFJHQkEoICdtYWdlbnRhJyApOyAvLyAtPiBcInJnYmEoMjU1LCAwLCAyNTUsIDEpXCJcbiAgICovXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiB0b1N0cmluZyAoKVxuICB7XG4gICAgcmV0dXJuICdyZ2JhKCcgKyB0aGlzWyAwIF0gKyAnLCAnICsgdGhpc1sgMSBdICsgJywgJyArIHRoaXNbIDIgXSArICcsICcgKyB0aGlzWyAzIF0gKyAnKSc7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIFIsIEcsIEIsIEEg0LfQvdCw0YfQtdC90LjRjy5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI3NldFxuICAgKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXSBSZWQgY2hhbm5lbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbZ10gR3JlZW4gY2hhbm5lbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbYl0gQmx1ZSBjaGFubmVsIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXSBBbHBoYSBjaGFubmVsIHZhbHVlLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuUkdCQVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSgpXG4gICAqICAgLnNldCggJ21hZ2VudGEnICkgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmZjAwZmZmZicgKSAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmZjAwZmYnICkgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMjU1LCAxXG4gICAqICAgLnNldCggJyNmMDA3JyApICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMCwgMC40N1xuICAgKiAgIC5zZXQoICcjZjAwJyApICAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAyNTUsIDAsIDAsIDFcbiAgICogICAuc2V0KCAnaHNsYSggMCwgMTAwJSwgNTAlLCAwLjQ3ICknICkgLy8gLT4gMjU1LCAwLCAwLCAwLjQ3XG4gICAqICAgLnNldCggJ3JnYiggMCwgMCwgMCApJyApICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDFcbiAgICogICAuc2V0KCAwICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMVxuICAgKiAgIC5zZXQoIDAsIDAsIDAgKSAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAwLCAwLCAwLCAxXG4gICAqICAgLnNldCggMCwgMCApICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDBcbiAgICogICAuc2V0KCAwLCAwLCAwLCAwICk7ICAgICAgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMFxuICAgKi9cbiAgc2V0OiBmdW5jdGlvbiBzZXQgKCByLCBnLCBiLCBhIClcbiAge1xuICAgIHN3aXRjaCAoIHRydWUgKSB7XG4gICAgICBjYXNlIHR5cGVvZiByID09PSAnc3RyaW5nJzpcbiAgICAgICAgciA9IHBhcnNlKCByICk7XG4gICAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgIGNhc2UgdHlwZW9mIHIgPT09ICdvYmplY3QnICYmIHIgIT09IG51bGw6XG4gICAgICAgIGlmICggci50eXBlICE9PSB0aGlzLnR5cGUgKSB7XG4gICAgICAgICAgciA9IHJbIHRoaXMudHlwZSBdKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzWyAwIF0gPSByWyAwIF07XG4gICAgICAgIHRoaXNbIDEgXSA9IHJbIDEgXTtcbiAgICAgICAgdGhpc1sgMiBdID0gclsgMiBdO1xuICAgICAgICB0aGlzWyAzIF0gPSByWyAzIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgc3dpdGNoICggdm9pZCAwICkge1xuICAgICAgICAgIGNhc2UgcjpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgYiA9IGcgPSByID0gMDsgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBnOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBiID0gZyA9IHIgPSBNYXRoLmZsb29yKCByICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGI6XG4gICAgICAgICAgICBhID0gZztcbiAgICAgICAgICAgIGIgPSBnID0gciA9IE1hdGguZmxvb3IoIHIgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgYTpcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByID0gTWF0aC5mbG9vciggciApO1xuICAgICAgICAgICAgZyA9IE1hdGguZmxvb3IoIGcgKTtcbiAgICAgICAgICAgIGIgPSBNYXRoLmZsb29yKCBiICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzWyAwIF0gPSByO1xuICAgICAgICB0aGlzWyAxIF0gPSBnO1xuICAgICAgICB0aGlzWyAyIF0gPSBiO1xuICAgICAgICB0aGlzWyAzIF0gPSBhO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQmtC+0L3QstC10YDRgtC40YDRg9C10YIg0LIge0BsaW5rIHY2LkhTTEF9LlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjaHNsYVxuICAgKiBAcmV0dXJuIHt2Ni5IU0xBfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSggMjU1LCAwLCAwLCAxICkuaHNsYSgpOyAvLyAtPiBuZXcgSFNMQSggMCwgMTAwLCA1MCwgMSApXG4gICAqL1xuICBoc2xhOiBmdW5jdGlvbiBoc2xhICgpXG4gIHtcbiAgICB2YXIgaHNsYSA9IG5ldyBIU0xBKCk7XG5cbiAgICB2YXIgciA9IHRoaXNbIDAgXSAvIDI1NTtcbiAgICB2YXIgZyA9IHRoaXNbIDEgXSAvIDI1NTtcbiAgICB2YXIgYiA9IHRoaXNbIDIgXSAvIDI1NTtcblxuICAgIHZhciBtYXggPSBNYXRoLm1heCggciwgZywgYiApO1xuICAgIHZhciBtaW4gPSBNYXRoLm1pbiggciwgZywgYiApO1xuXG4gICAgdmFyIGwgPSAoIG1heCArIG1pbiApICogNTA7XG4gICAgdmFyIGgsIHM7XG5cbiAgICB2YXIgZGlmZiA9IG1heCAtIG1pbjtcblxuICAgIGlmICggZGlmZiApIHtcbiAgICAgIGlmICggbCA+IDUwICkge1xuICAgICAgICBzID0gZGlmZiAvICggMiAtIG1heCAtIG1pbiApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcyA9IGRpZmYgLyAoIG1heCArIG1pbiApO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKCBtYXggKSB7XG4gICAgICAgIGNhc2UgcjpcbiAgICAgICAgICBpZiAoIGcgPCBiICkge1xuICAgICAgICAgICAgaCA9IDEuMDQ3MiAqICggZyAtIGIgKSAvIGRpZmYgKyA2LjI4MzI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGggPSAxLjA0NzIgKiAoIGcgLSBiICkgLyBkaWZmO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIGc6XG4gICAgICAgICAgaCA9IDEuMDQ3MiAqICggYiAtIHIgKSAvIGRpZmYgKyAyLjA5NDQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaCA9IDEuMDQ3MiAqICggciAtIGcgKSAvIGRpZmYgKyA0LjE4ODg7XG4gICAgICB9XG5cbiAgICAgIGggPSBNYXRoLnJvdW5kKCBoICogMzYwIC8gNi4yODMyICk7XG4gICAgICBzID0gTWF0aC5yb3VuZCggcyAqIDEwMCApO1xuICAgIH0gZWxzZSB7XG4gICAgICBoID0gcyA9IDA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgfVxuXG4gICAgaHNsYVsgMCBdID0gaDtcbiAgICBoc2xhWyAxIF0gPSBzO1xuICAgIGhzbGFbIDIgXSA9IE1hdGgucm91bmQoIGwgKTtcbiAgICBoc2xhWyAzIF0gPSB0aGlzWyAzIF07XG5cbiAgICByZXR1cm4gaHNsYTtcbiAgfSxcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQG1ldGhvZCB2Ni5SR0JBI3JnYmFcbiAgICogQHNlZSB2Ni5SZW5kZXJlckdMI3ZlcnRpY2VzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHJnYmE6IGZ1bmN0aW9uIHJnYmEgKClcbiAge1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5SR0JBfSAtINC40L3RgtC10YDQv9C+0LvQuNGA0L7QstCw0L3QvdGL0Lkg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjbGVycFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICByXG4gICAqIEBwYXJhbSAge251bWJlcn0gIGdcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgYlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB2YWx1ZVxuICAgKiBAcmV0dXJuIHt2Ni5SR0JBfVxuICAgKiBAc2VlIHY2LlJHQkEjbGVycENvbG9yXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAxMDAsIDAuMjUgKS5sZXJwKCAyMDAsIDIwMCwgMjAwLCAwLjUgKTsgLy8gLT4gbmV3IFJHQkEoIDE1MCwgMTUwLCAxNTAsIDAuMjUgKVxuICAgKi9cbiAgbGVycDogZnVuY3Rpb24gbGVycCAoIHIsIGcsIGIsIHZhbHVlIClcbiAge1xuICAgIHIgPSB0aGlzWyAwIF0gKyAoIHIgLSB0aGlzWyAwIF0gKSAqIHZhbHVlO1xuICAgIGcgPSB0aGlzWyAxIF0gKyAoIGcgLSB0aGlzWyAxIF0gKSAqIHZhbHVlO1xuICAgIGIgPSB0aGlzWyAyIF0gKyAoIGIgLSB0aGlzWyAyIF0gKSAqIHZhbHVlO1xuICAgIHJldHVybiBuZXcgUkdCQSggciwgZywgYiwgdGhpc1sgMyBdICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LlJHQkF9IC0g0LjQvdGC0LXRgNC/0L7Qu9C40YDQvtCy0LDQvdC90YvQuSDQvNC10LbQtNGDIGBjb2xvcmAuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNsZXJwQ29sb3JcbiAgICogQHBhcmFtICB7VENvbG9yfSAgY29sb3JcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgdmFsdWVcbiAgICogQHJldHVybiB7djYuUkdCQX1cbiAgICogQHNlZSB2Ni5SR0JBI2xlcnBcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIGEgPSBuZXcgUkdCQSggMTAwLCAwLjI1ICk7XG4gICAqIHZhciBiID0gbmV3IFJHQkEoIDIwMCwgMCApO1xuICAgKiB2YXIgYyA9IGEubGVycENvbG9yKCBiLCAwLjUgKTsgLy8gLT4gbmV3IFJHQkEoIDE1MCwgMTUwLCAxNTAsIDAuMjUgKVxuICAgKi9cbiAgbGVycENvbG9yOiBmdW5jdGlvbiBsZXJwQ29sb3IgKCBjb2xvciwgdmFsdWUgKVxuICB7XG4gICAgdmFyIHIsIGcsIGI7XG5cbiAgICBpZiAoIHR5cGVvZiBjb2xvciAhPT0gJ29iamVjdCcgKSB7XG4gICAgICBjb2xvciA9IHBhcnNlKCBjb2xvciApO1xuICAgIH1cblxuICAgIGlmICggY29sb3IudHlwZSAhPT0gJ3JnYmEnICkge1xuICAgICAgY29sb3IgPSBjb2xvci5yZ2JhKCk7XG4gICAgfVxuXG4gICAgciA9IGNvbG9yWyAwIF07XG4gICAgZyA9IGNvbG9yWyAxIF07XG4gICAgYiA9IGNvbG9yWyAyIF07XG5cbiAgICByZXR1cm4gdGhpcy5sZXJwKCByLCBnLCBiLCB2YWx1ZSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5SR0JBfSAtINC30LDRgtC10LzQvdC10L3QvdGL0Lkg0LjQu9C4INC30LDRgdCy0LXRgtC70LXQvdC90YvQuSDQvdCwIGBwZXJjZW50YWdlc2Ag0L/RgNC+0YbQtdC90YLQvtCyLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjc2hhZGVcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgcGVyY2VudGFnZVxuICAgKiBAcmV0dXJuIHt2Ni5SR0JBfVxuICAgKiBAc2VlIHY2LkhTTEEjc2hhZGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoKS5zaGFkZSggNTAgKTsgLy8gLT4gbmV3IFJHQkEoIDEyOCApXG4gICAqL1xuICBzaGFkZTogZnVuY3Rpb24gc2hhZGUgKCBwZXJjZW50YWdlcyApXG4gIHtcbiAgICByZXR1cm4gdGhpcy5oc2xhKCkuc2hhZGUoIHBlcmNlbnRhZ2VzICkucmdiYSgpO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBSR0JBXG59O1xuXG4vKipcbiAqIEBtZW1iZXIge3N0cmluZ30gdjYuUkdCQSN0eXBlIGBcInJnYmFcImAuINCt0YLQviDRgdCy0L7QudGB0YLQstC+INC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0LrQvtC90LLQtdGA0YLQuNGA0L7QstCw0L3QuNGPINC80LXQttC00YMge0BsaW5rIHY2LkhTTEF9INC4IHtAbGluayB2Ni5SR0JBfS5cbiAqL1xuUkdCQS5wcm90b3R5cGUudHlwZSA9ICdyZ2JhJztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogZXNsaW50IGtleS1zcGFjaW5nOiBbIFwiZXJyb3JcIiwgeyBcImFsaWduXCI6IHsgXCJiZWZvcmVDb2xvblwiOiBmYWxzZSwgXCJhZnRlckNvbG9uXCI6IHRydWUsIFwib25cIjogXCJ2YWx1ZVwiIH0gfSBdICovXG5cbnZhciBjb2xvcnMgPSB7XG4gIGFsaWNlYmx1ZTogICAgICAgICAgICAnZjBmOGZmZmYnLCBhbnRpcXVld2hpdGU6ICAgICAgICAgJ2ZhZWJkN2ZmJyxcbiAgYXF1YTogICAgICAgICAgICAgICAgICcwMGZmZmZmZicsIGFxdWFtYXJpbmU6ICAgICAgICAgICAnN2ZmZmQ0ZmYnLFxuICBhenVyZTogICAgICAgICAgICAgICAgJ2YwZmZmZmZmJywgYmVpZ2U6ICAgICAgICAgICAgICAgICdmNWY1ZGNmZicsXG4gIGJpc3F1ZTogICAgICAgICAgICAgICAnZmZlNGM0ZmYnLCBibGFjazogICAgICAgICAgICAgICAgJzAwMDAwMGZmJyxcbiAgYmxhbmNoZWRhbG1vbmQ6ICAgICAgICdmZmViY2RmZicsIGJsdWU6ICAgICAgICAgICAgICAgICAnMDAwMGZmZmYnLFxuICBibHVldmlvbGV0OiAgICAgICAgICAgJzhhMmJlMmZmJywgYnJvd246ICAgICAgICAgICAgICAgICdhNTJhMmFmZicsXG4gIGJ1cmx5d29vZDogICAgICAgICAgICAnZGViODg3ZmYnLCBjYWRldGJsdWU6ICAgICAgICAgICAgJzVmOWVhMGZmJyxcbiAgY2hhcnRyZXVzZTogICAgICAgICAgICc3ZmZmMDBmZicsIGNob2NvbGF0ZTogICAgICAgICAgICAnZDI2OTFlZmYnLFxuICBjb3JhbDogICAgICAgICAgICAgICAgJ2ZmN2Y1MGZmJywgY29ybmZsb3dlcmJsdWU6ICAgICAgICc2NDk1ZWRmZicsXG4gIGNvcm5zaWxrOiAgICAgICAgICAgICAnZmZmOGRjZmYnLCBjcmltc29uOiAgICAgICAgICAgICAgJ2RjMTQzY2ZmJyxcbiAgY3lhbjogICAgICAgICAgICAgICAgICcwMGZmZmZmZicsIGRhcmtibHVlOiAgICAgICAgICAgICAnMDAwMDhiZmYnLFxuICBkYXJrY3lhbjogICAgICAgICAgICAgJzAwOGI4YmZmJywgZGFya2dvbGRlbnJvZDogICAgICAgICdiODg2MGJmZicsXG4gIGRhcmtncmF5OiAgICAgICAgICAgICAnYTlhOWE5ZmYnLCBkYXJrZ3JlZW46ICAgICAgICAgICAgJzAwNjQwMGZmJyxcbiAgZGFya2toYWtpOiAgICAgICAgICAgICdiZGI3NmJmZicsIGRhcmttYWdlbnRhOiAgICAgICAgICAnOGIwMDhiZmYnLFxuICBkYXJrb2xpdmVncmVlbjogICAgICAgJzU1NmIyZmZmJywgZGFya29yYW5nZTogICAgICAgICAgICdmZjhjMDBmZicsXG4gIGRhcmtvcmNoaWQ6ICAgICAgICAgICAnOTkzMmNjZmYnLCBkYXJrcmVkOiAgICAgICAgICAgICAgJzhiMDAwMGZmJyxcbiAgZGFya3NhbG1vbjogICAgICAgICAgICdlOTk2N2FmZicsIGRhcmtzZWFncmVlbjogICAgICAgICAnOGZiYzhmZmYnLFxuICBkYXJrc2xhdGVibHVlOiAgICAgICAgJzQ4M2Q4YmZmJywgZGFya3NsYXRlZ3JheTogICAgICAgICcyZjRmNGZmZicsXG4gIGRhcmt0dXJxdW9pc2U6ICAgICAgICAnMDBjZWQxZmYnLCBkYXJrdmlvbGV0OiAgICAgICAgICAgJzk0MDBkM2ZmJyxcbiAgZGVlcHBpbms6ICAgICAgICAgICAgICdmZjE0OTNmZicsIGRlZXBza3libHVlOiAgICAgICAgICAnMDBiZmZmZmYnLFxuICBkaW1ncmF5OiAgICAgICAgICAgICAgJzY5Njk2OWZmJywgZG9kZ2VyYmx1ZTogICAgICAgICAgICcxZTkwZmZmZicsXG4gIGZlbGRzcGFyOiAgICAgICAgICAgICAnZDE5Mjc1ZmYnLCBmaXJlYnJpY2s6ICAgICAgICAgICAgJ2IyMjIyMmZmJyxcbiAgZmxvcmFsd2hpdGU6ICAgICAgICAgICdmZmZhZjBmZicsIGZvcmVzdGdyZWVuOiAgICAgICAgICAnMjI4YjIyZmYnLFxuICBmdWNoc2lhOiAgICAgICAgICAgICAgJ2ZmMDBmZmZmJywgZ2FpbnNib3JvOiAgICAgICAgICAgICdkY2RjZGNmZicsXG4gIGdob3N0d2hpdGU6ICAgICAgICAgICAnZjhmOGZmZmYnLCBnb2xkOiAgICAgICAgICAgICAgICAgJ2ZmZDcwMGZmJyxcbiAgZ29sZGVucm9kOiAgICAgICAgICAgICdkYWE1MjBmZicsIGdyYXk6ICAgICAgICAgICAgICAgICAnODA4MDgwZmYnLFxuICBncmVlbjogICAgICAgICAgICAgICAgJzAwODAwMGZmJywgZ3JlZW55ZWxsb3c6ICAgICAgICAgICdhZGZmMmZmZicsXG4gIGhvbmV5ZGV3OiAgICAgICAgICAgICAnZjBmZmYwZmYnLCBob3RwaW5rOiAgICAgICAgICAgICAgJ2ZmNjliNGZmJyxcbiAgaW5kaWFucmVkOiAgICAgICAgICAgICdjZDVjNWNmZicsIGluZGlnbzogICAgICAgICAgICAgICAnNGIwMDgyZmYnLFxuICBpdm9yeTogICAgICAgICAgICAgICAgJ2ZmZmZmMGZmJywga2hha2k6ICAgICAgICAgICAgICAgICdmMGU2OGNmZicsXG4gIGxhdmVuZGVyOiAgICAgICAgICAgICAnZTZlNmZhZmYnLCBsYXZlbmRlcmJsdXNoOiAgICAgICAgJ2ZmZjBmNWZmJyxcbiAgbGF3bmdyZWVuOiAgICAgICAgICAgICc3Y2ZjMDBmZicsIGxlbW9uY2hpZmZvbjogICAgICAgICAnZmZmYWNkZmYnLFxuICBsaWdodGJsdWU6ICAgICAgICAgICAgJ2FkZDhlNmZmJywgbGlnaHRjb3JhbDogICAgICAgICAgICdmMDgwODBmZicsXG4gIGxpZ2h0Y3lhbjogICAgICAgICAgICAnZTBmZmZmZmYnLCBsaWdodGdvbGRlbnJvZHllbGxvdzogJ2ZhZmFkMmZmJyxcbiAgbGlnaHRncmV5OiAgICAgICAgICAgICdkM2QzZDNmZicsIGxpZ2h0Z3JlZW46ICAgICAgICAgICAnOTBlZTkwZmYnLFxuICBsaWdodHBpbms6ICAgICAgICAgICAgJ2ZmYjZjMWZmJywgbGlnaHRzYWxtb246ICAgICAgICAgICdmZmEwN2FmZicsXG4gIGxpZ2h0c2VhZ3JlZW46ICAgICAgICAnMjBiMmFhZmYnLCBsaWdodHNreWJsdWU6ICAgICAgICAgJzg3Y2VmYWZmJyxcbiAgbGlnaHRzbGF0ZWJsdWU6ICAgICAgICc4NDcwZmZmZicsIGxpZ2h0c2xhdGVncmF5OiAgICAgICAnNzc4ODk5ZmYnLFxuICBsaWdodHN0ZWVsYmx1ZTogICAgICAgJ2IwYzRkZWZmJywgbGlnaHR5ZWxsb3c6ICAgICAgICAgICdmZmZmZTBmZicsXG4gIGxpbWU6ICAgICAgICAgICAgICAgICAnMDBmZjAwZmYnLCBsaW1lZ3JlZW46ICAgICAgICAgICAgJzMyY2QzMmZmJyxcbiAgbGluZW46ICAgICAgICAgICAgICAgICdmYWYwZTZmZicsIG1hZ2VudGE6ICAgICAgICAgICAgICAnZmYwMGZmZmYnLFxuICBtYXJvb246ICAgICAgICAgICAgICAgJzgwMDAwMGZmJywgbWVkaXVtYXF1YW1hcmluZTogICAgICc2NmNkYWFmZicsXG4gIG1lZGl1bWJsdWU6ICAgICAgICAgICAnMDAwMGNkZmYnLCBtZWRpdW1vcmNoaWQ6ICAgICAgICAgJ2JhNTVkM2ZmJyxcbiAgbWVkaXVtcHVycGxlOiAgICAgICAgICc5MzcwZDhmZicsIG1lZGl1bXNlYWdyZWVuOiAgICAgICAnM2NiMzcxZmYnLFxuICBtZWRpdW1zbGF0ZWJsdWU6ICAgICAgJzdiNjhlZWZmJywgbWVkaXVtc3ByaW5nZ3JlZW46ICAgICcwMGZhOWFmZicsXG4gIG1lZGl1bXR1cnF1b2lzZTogICAgICAnNDhkMWNjZmYnLCBtZWRpdW12aW9sZXRyZWQ6ICAgICAgJ2M3MTU4NWZmJyxcbiAgbWlkbmlnaHRibHVlOiAgICAgICAgICcxOTE5NzBmZicsIG1pbnRjcmVhbTogICAgICAgICAgICAnZjVmZmZhZmYnLFxuICBtaXN0eXJvc2U6ICAgICAgICAgICAgJ2ZmZTRlMWZmJywgbW9jY2FzaW46ICAgICAgICAgICAgICdmZmU0YjVmZicsXG4gIG5hdmFqb3doaXRlOiAgICAgICAgICAnZmZkZWFkZmYnLCBuYXZ5OiAgICAgICAgICAgICAgICAgJzAwMDA4MGZmJyxcbiAgb2xkbGFjZTogICAgICAgICAgICAgICdmZGY1ZTZmZicsIG9saXZlOiAgICAgICAgICAgICAgICAnODA4MDAwZmYnLFxuICBvbGl2ZWRyYWI6ICAgICAgICAgICAgJzZiOGUyM2ZmJywgb3JhbmdlOiAgICAgICAgICAgICAgICdmZmE1MDBmZicsXG4gIG9yYW5nZXJlZDogICAgICAgICAgICAnZmY0NTAwZmYnLCBvcmNoaWQ6ICAgICAgICAgICAgICAgJ2RhNzBkNmZmJyxcbiAgcGFsZWdvbGRlbnJvZDogICAgICAgICdlZWU4YWFmZicsIHBhbGVncmVlbjogICAgICAgICAgICAnOThmYjk4ZmYnLFxuICBwYWxldHVycXVvaXNlOiAgICAgICAgJ2FmZWVlZWZmJywgcGFsZXZpb2xldHJlZDogICAgICAgICdkODcwOTNmZicsXG4gIHBhcGF5YXdoaXA6ICAgICAgICAgICAnZmZlZmQ1ZmYnLCBwZWFjaHB1ZmY6ICAgICAgICAgICAgJ2ZmZGFiOWZmJyxcbiAgcGVydTogICAgICAgICAgICAgICAgICdjZDg1M2ZmZicsIHBpbms6ICAgICAgICAgICAgICAgICAnZmZjMGNiZmYnLFxuICBwbHVtOiAgICAgICAgICAgICAgICAgJ2RkYTBkZGZmJywgcG93ZGVyYmx1ZTogICAgICAgICAgICdiMGUwZTZmZicsXG4gIHB1cnBsZTogICAgICAgICAgICAgICAnODAwMDgwZmYnLCByZWQ6ICAgICAgICAgICAgICAgICAgJ2ZmMDAwMGZmJyxcbiAgcm9zeWJyb3duOiAgICAgICAgICAgICdiYzhmOGZmZicsIHJveWFsYmx1ZTogICAgICAgICAgICAnNDE2OWUxZmYnLFxuICBzYWRkbGVicm93bjogICAgICAgICAgJzhiNDUxM2ZmJywgc2FsbW9uOiAgICAgICAgICAgICAgICdmYTgwNzJmZicsXG4gIHNhbmR5YnJvd246ICAgICAgICAgICAnZjRhNDYwZmYnLCBzZWFncmVlbjogICAgICAgICAgICAgJzJlOGI1N2ZmJyxcbiAgc2Vhc2hlbGw6ICAgICAgICAgICAgICdmZmY1ZWVmZicsIHNpZW5uYTogICAgICAgICAgICAgICAnYTA1MjJkZmYnLFxuICBzaWx2ZXI6ICAgICAgICAgICAgICAgJ2MwYzBjMGZmJywgc2t5Ymx1ZTogICAgICAgICAgICAgICc4N2NlZWJmZicsXG4gIHNsYXRlYmx1ZTogICAgICAgICAgICAnNmE1YWNkZmYnLCBzbGF0ZWdyYXk6ICAgICAgICAgICAgJzcwODA5MGZmJyxcbiAgc25vdzogICAgICAgICAgICAgICAgICdmZmZhZmFmZicsIHNwcmluZ2dyZWVuOiAgICAgICAgICAnMDBmZjdmZmYnLFxuICBzdGVlbGJsdWU6ICAgICAgICAgICAgJzQ2ODJiNGZmJywgdGFuOiAgICAgICAgICAgICAgICAgICdkMmI0OGNmZicsXG4gIHRlYWw6ICAgICAgICAgICAgICAgICAnMDA4MDgwZmYnLCB0aGlzdGxlOiAgICAgICAgICAgICAgJ2Q4YmZkOGZmJyxcbiAgdG9tYXRvOiAgICAgICAgICAgICAgICdmZjYzNDdmZicsIHR1cnF1b2lzZTogICAgICAgICAgICAnNDBlMGQwZmYnLFxuICB2aW9sZXQ6ICAgICAgICAgICAgICAgJ2VlODJlZWZmJywgdmlvbGV0cmVkOiAgICAgICAgICAgICdkMDIwOTBmZicsXG4gIHdoZWF0OiAgICAgICAgICAgICAgICAnZjVkZWIzZmYnLCB3aGl0ZTogICAgICAgICAgICAgICAgJ2ZmZmZmZmZmJyxcbiAgd2hpdGVzbW9rZTogICAgICAgICAgICdmNWY1ZjVmZicsIHllbGxvdzogICAgICAgICAgICAgICAnZmZmZjAwZmYnLFxuICB5ZWxsb3dncmVlbjogICAgICAgICAgJzlhY2QzMmZmJywgdHJhbnNwYXJlbnQ6ICAgICAgICAgICcwMDAwMDAwMCdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY29sb3JzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlO1xuXG52YXIgUkdCQSAgID0gcmVxdWlyZSggJy4uL1JHQkEnICk7XG52YXIgSFNMQSAgID0gcmVxdWlyZSggJy4uL0hTTEEnICk7XG52YXIgY29sb3JzID0gcmVxdWlyZSggJy4vY29sb3JzJyApO1xuXG52YXIgcGFyc2VkID0gT2JqZWN0LmNyZWF0ZSggbnVsbCApO1xuXG52YXIgVFJBTlNQQVJFTlQgPSBbXG4gIDAsIDAsIDAsIDBcbl07XG5cbnZhciByZWdleHBzID0ge1xuICBoZXgzOiAvXiMoWzAtOWEtZl0pKFswLTlhLWZdKShbMC05YS1mXSkoWzAtOWEtZl0pPyQvLFxuICBoZXg6ICAvXiMoWzAtOWEtZl17Nn0pKFswLTlhLWZdezJ9KT8kLyxcbiAgcmdiOiAgL15yZ2JcXHMqXFwoXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccypcXCkkfF5cXHMqcmdiYVxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKlxcKSQvLFxuICBoc2w6ICAvXmhzbFxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFx1MDAyNVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqXFwpJHxeXFxzKmhzbGFcXHMqXFwoXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHUwMDI1XFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKlxcKSQvXG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHBhcnNlXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZ1xuICogQHJldHVybiB7bW9kdWxlOlwidjYuanNcIi5SR0JBfG1vZHVsZTpcInY2LmpzXCIuSFNMQX1cbiAqIEBleGFtcGxlXG4gKiBwYXJzZSggJyNmMGYwJyApOyAgICAgICAgICAgICAgICAgICAgIC8vIC0+IG5ldyBSR0JBKCAyNTUsIDAsIDI1NSwgMCApXG4gKiBwYXJzZSggJyMwMDAwMDBmZicgKTsgICAgICAgICAgICAgICAgIC8vIC0+IG5ldyBSR0JBKCAwLCAwLCAwLCAxIClcbiAqIHBhcnNlKCAnbWFnZW50YScgKTsgICAgICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDI1NSwgMCwgMjU1LCAxIClcbiAqIHBhcnNlKCAndHJhbnNwYXJlbnQnICk7ICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDAsIDAsIDAsIDAgKVxuICogcGFyc2UoICdoc2woIDAsIDEwMCUsIDUwJSApJyApOyAgICAgICAvLyAtPiBuZXcgSFNMQSggMCwgMTAwLCA1MCwgMSApXG4gKiBwYXJzZSggJ2hzbGEoIDAsIDEwMCUsIDUwJSwgMC41ICknICk7IC8vIC0+IG5ldyBIU0xBKCAwLCAxMDAsIDUwLCAwLjUgKVxuICovXG5mdW5jdGlvbiBwYXJzZSAoIHN0cmluZyApXG57XG4gIHZhciBjYWNoZSA9IHBhcnNlZFsgc3RyaW5nIF0gfHwgcGFyc2VkWyBzdHJpbmcgPSBzdHJpbmcudHJpbSgpLnRvTG93ZXJDYXNlKCkgXTtcblxuICBpZiAoICEgY2FjaGUgKSB7XG4gICAgaWYgKCAoIGNhY2hlID0gY29sb3JzWyBzdHJpbmcgXSApICkge1xuICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKCBwYXJzZUhleCggY2FjaGUgKSwgUkdCQSApO1xuICAgIH0gZWxzZSBpZiAoICggY2FjaGUgPSByZWdleHBzLmhleC5leGVjKCBzdHJpbmcgKSApIHx8ICggY2FjaGUgPSByZWdleHBzLmhleDMuZXhlYyggc3RyaW5nICkgKSApIHtcbiAgICAgIGNhY2hlID0gbmV3IENvbG9yRGF0YSggcGFyc2VIZXgoIGZvcm1hdEhleCggY2FjaGUgKSApLCBSR0JBICk7XG4gICAgfSBlbHNlIGlmICggKCBjYWNoZSA9IHJlZ2V4cHMucmdiLmV4ZWMoIHN0cmluZyApICkgKSB7XG4gICAgICBjYWNoZSA9IG5ldyBDb2xvckRhdGEoIGNvbXBhY3RNYXRjaCggY2FjaGUgKSwgUkdCQSApO1xuICAgIH0gZWxzZSBpZiAoICggY2FjaGUgPSByZWdleHBzLmhzbC5leGVjKCBzdHJpbmcgKSApICkge1xuICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKCBjb21wYWN0TWF0Y2goIGNhY2hlICksIEhTTEEgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgU3ludGF4RXJyb3IoIHN0cmluZyArICcgaXMgbm90IGEgdmFsaWQgc3ludGF4JyApO1xuICAgIH1cblxuICAgIHBhcnNlZFsgc3RyaW5nIF0gPSBjYWNoZTtcbiAgfVxuXG4gIHJldHVybiBuZXcgY2FjaGUuY29sb3IoIGNhY2hlWyAwIF0sIGNhY2hlWyAxIF0sIGNhY2hlWyAyIF0sIGNhY2hlWyAzIF0gKTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBmb3JtYXRIZXhcbiAqIEBwYXJhbSAge2FycmF5PHN0cmluZz8+fSBtYXRjaFxuICogQHJldHVybiB7c3RyaW5nfVxuICogQGV4YW1wbGVcbiAqIGZvcm1hdEhleCggWyAnIzAwMDAwMGZmJywgJzAwMDAwMCcsICdmZicgXSApOyAvLyAtPiAnMDAwMDAwZmYnXG4gKiBmb3JtYXRIZXgoIFsgJyMwMDA3JywgJzAnLCAnMCcsICcwJywgJzcnIF0gKTsgLy8gLT4gJzAwMDAwMDc3J1xuICogZm9ybWF0SGV4KCBbICcjMDAwJywgJzAnLCAnMCcsICcwJywgbnVsbCBdICk7IC8vIC0+ICcwMDAwMDBmZidcbiAqL1xuZnVuY3Rpb24gZm9ybWF0SGV4ICggbWF0Y2ggKVxue1xuICB2YXIgciwgZywgYiwgYTtcblxuICBpZiAoIG1hdGNoLmxlbmd0aCA9PT0gMyApIHtcbiAgICByZXR1cm4gbWF0Y2hbIDEgXSArICggbWF0Y2hbIDIgXSB8fCAnZmYnICk7XG4gIH1cblxuICByID0gbWF0Y2hbIDEgXTtcbiAgZyA9IG1hdGNoWyAyIF07XG4gIGIgPSBtYXRjaFsgMyBdO1xuICBhID0gbWF0Y2hbIDQgXSB8fCAnZic7XG5cbiAgcmV0dXJuIHIgKyByICsgZyArIGcgKyBiICsgYiArIGEgKyBhO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHBhcnNlSGV4XG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICBoZXhcbiAqIEByZXR1cm4ge2FycmF5PG51bWJlcj59XG4gKiBAZXhhbXBsZVxuICogcGFyc2VIZXgoICcwMDAwMDAwMCcgKTsgLy8gLT4gWyAwLCAwLCAwLCAwIF1cbiAqIHBhcnNlSGV4KCAnZmYwMGZmZmYnICk7IC8vIC0+IFsgMjU1LCAwLCAyNTUsIDEgXVxuICovXG5mdW5jdGlvbiBwYXJzZUhleCAoIGhleCApXG57XG4gIGlmICggaGV4ID09IDAgKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgcmV0dXJuIFRSQU5TUEFSRU5UO1xuICB9XG5cbiAgaGV4ID0gcGFyc2VJbnQoIGhleCwgMTYgKTtcblxuICByZXR1cm4gW1xuICAgIC8vIFJcbiAgICBoZXggPj4gMjQgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEdcbiAgICBoZXggPj4gMTYgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEJcbiAgICBoZXggPj4gOCAgJiAyNTUsICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICAgIC8vIEFcbiAgICAoIGhleCAmIDI1NSApIC8gMjU1IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxuICBdO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNvbXBhY3RNYXRjaFxuICogQHBhcmFtICB7YXJyYXk8c3RyaW5nPz59IG1hdGNoXG4gKiBAcmV0dXJuIHthcnJheTxudW1iZXI+fVxuICovXG5mdW5jdGlvbiBjb21wYWN0TWF0Y2ggKCBtYXRjaCApXG57XG4gIGlmICggbWF0Y2hbIDcgXSApIHtcbiAgICByZXR1cm4gW1xuICAgICAgTnVtYmVyKCBtYXRjaFsgNCBdICksXG4gICAgICBOdW1iZXIoIG1hdGNoWyA1IF0gKSxcbiAgICAgIE51bWJlciggbWF0Y2hbIDYgXSApLFxuICAgICAgTnVtYmVyKCBtYXRjaFsgNyBdIClcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBOdW1iZXIoIG1hdGNoWyAxIF0gKSxcbiAgICBOdW1iZXIoIG1hdGNoWyAyIF0gKSxcbiAgICBOdW1iZXIoIG1hdGNoWyAzIF0gKVxuICBdO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAY29uc3RydWN0b3IgQ29sb3JEYXRhXG4gKiBAcGFyYW0ge2FycmF5PG51bWJlcj59IG1hdGNoXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSAgICAgIGNvbG9yXG4gKi9cbmZ1bmN0aW9uIENvbG9yRGF0YSAoIG1hdGNoLCBjb2xvciApXG57XG4gIHRoaXNbIDAgXSA9IG1hdGNoWyAwIF07XG4gIHRoaXNbIDEgXSA9IG1hdGNoWyAxIF07XG4gIHRoaXNbIDIgXSA9IG1hdGNoWyAyIF07XG4gIHRoaXNbIDMgXSA9IG1hdGNoWyAzIF07XG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQodGC0LDQvdC00LDRgNGC0L3Ri9C1INC60L7QvdGB0YLQsNC90YLRizpcbiAqICogYFwiQVVUT1wiYFxuICogKiBgXCJHTFwiYFxuICogKiBgXCIyRFwiYFxuICogKiBgXCJMRUZUXCJgXG4gKiAqIGBcIlRPUFwiYFxuICogKiBgXCJDRU5URVJcImBcbiAqICogYFwiTUlERExFXCJgXG4gKiAqIGBcIlJJR0hUXCJgXG4gKiAqIGBcIkJPVFRPTVwiYFxuICogKiBgXCJQRVJDRU5UXCJgXG4gKiAqIGBcIlBPSU5UU1wiYFxuICogKiBgXCJMSU5FU1wiYFxuICogQG5hbWVzcGFjZSB7b2JqZWN0fSB2Ni5jb25zdGFudHNcbiAqIEBleGFtcGxlXG4gKiB2YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29uc3RhbnRzJyApO1xuICovXG5cbnZhciBfY29uc3RhbnRzID0ge307XG52YXIgX2NvdW50ZXIgICA9IDA7XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC60L7QvdGB0YLQsNC90YLRgy5cbiAqIEBtZXRob2QgdjYuY29uc3RhbnRzLmFkZFxuICogQHBhcmFtICB7c3RyaW5nfSBrZXkg0JjQvNGPINC60L7QvdGB0YLQsNC90YLRiy5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIGNvbnN0YW50cy5hZGQoICdDVVNUT01fQ09OU1RBTlQnICk7XG4gKi9cbmZ1bmN0aW9uIGFkZCAoIGtleSApXG57XG4gIGlmICggdHlwZW9mIF9jb25zdGFudHNbIGtleSBdICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCByZS1zZXQgKGFkZCkgZXhpc3RpbmcgY29uc3RhbnQ6ICcgKyBrZXkgKTtcbiAgfVxuXG4gIF9jb25zdGFudHNbIGtleSBdID0gKytfY291bnRlcjtcbn1cblxuLyoqXG4gKiDQktC+0LfQstGA0LDRidCw0LXRgiDQutC+0L3RgdGC0LDQvdGC0YMuXG4gKiBAbWV0aG9kIHY2LmNvbnN0YW50cy5nZXRcbiAqIEBwYXJhbSAge3N0cmluZ30gICBrZXkg0JjQvNGPINC60L7QvdGB0YLQsNC90YLRiy5cbiAqIEByZXR1cm4ge2NvbnN0YW50fSAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0LrQvtC90YHRgtCw0L3RgtGDLlxuICogQGV4YW1wbGVcbiAqIGNvbnN0YW50cy5nZXQoICdDVVNUT01fQ09OU1RBTlQnICk7XG4gKi9cbmZ1bmN0aW9uIGdldCAoIGtleSApXG57XG4gIGlmICggdHlwZW9mIF9jb25zdGFudHNbIGtleSBdID09PSAndW5kZWZpbmVkJyApIHtcbiAgICB0aHJvdyBSZWZlcmVuY2VFcnJvciggJ0Nhbm5vdCBnZXQgdW5rbm93biBjb25zdGFudDogJyArIGtleSApO1xuICB9XG5cbiAgcmV0dXJuIF9jb25zdGFudHNbIGtleSBdO1xufVxuXG5bXG4gICdBVVRPJyxcbiAgJ0dMJyxcbiAgJzJEJyxcbiAgJ0xFRlQnLFxuICAnVE9QJyxcbiAgJ0NFTlRFUicsXG4gICdNSURETEUnLFxuICAnUklHSFQnLFxuICAnQk9UVE9NJyxcbiAgJ1BFUkNFTlQnLFxuICAnUE9JTlRTJyxcbiAgJ0xJTkVTJ1xuXS5mb3JFYWNoKCBhZGQgKTtcblxuZXhwb3J0cy5hZGQgPSBhZGQ7XG5leHBvcnRzLmdldCA9IGdldDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIExpZ2h0RW1pdHRlciA9IHJlcXVpcmUoICdsaWdodF9lbWl0dGVyJyApO1xuXG4vKipcbiAqIEBhYnN0cmFjdFxuICogQGNvbnN0cnVjdG9yIHY2LkFic3RyYWN0SW1hZ2VcbiAqIEBleHRlbmRzIExpZ2h0RW1pdHRlclxuICogQHNlZSB2Ni5Db21wb3VuZGVkSW1hZ2VcbiAqIEBzZWUgdjYuSW1hZ2VcbiAqL1xuZnVuY3Rpb24gQWJzdHJhY3RJbWFnZSAoKVxue1xuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNzeCBcIlNvdXJjZSBYXCIuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI3N5IFwiU291cmNlIFlcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2Ujc3cgXCJTb3VyY2UgV2lkdGhcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2Ujc2ggXCJTb3VyY2UgSGVpZ2h0XCIuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI2R3IFwiRGVzdGluYXRpb24gV2lkdGhcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2UjZGggXCJEZXN0aW5hdGlvbiBIZWlnaHRcIi5cbiAgICovXG5cbiAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBhYnN0cmFjdCBjbGFzcyAobmV3IHY2LkFic3RyYWN0SW1hZ2UpJyApO1xufVxuXG5BYnN0cmFjdEltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIExpZ2h0RW1pdHRlci5wcm90b3R5cGUgKTtcbkFic3RyYWN0SW1hZ2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQWJzdHJhY3RJbWFnZTtcblxuLyoqXG4gKiBAdmlydHVhbFxuICogQG1ldGhvZCB2Ni5BYnN0cmFjdEltYWdlI2dldFxuICogQHJldHVybiB7djYuSW1hZ2V9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBBYnN0cmFjdEltYWdlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWJzdHJhY3RJbWFnZSA9IHJlcXVpcmUoICcuL0Fic3RyYWN0SW1hZ2UnICk7XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yIHY2LkNvbXBvdW5kZWRJbWFnZVxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RJbWFnZVxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdEltYWdlfSBpbWFnZVxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzeFxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzeVxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzd1xuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzaFxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBkd1xuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBkaFxuICovXG5mdW5jdGlvbiBDb21wb3VuZGVkSW1hZ2UgKCBpbWFnZSwgc3gsIHN5LCBzdywgc2gsIGR3LCBkaCApXG57XG4gIHRoaXMuaW1hZ2UgPSBpbWFnZTtcbiAgdGhpcy5zeCAgICA9IHN4O1xuICB0aGlzLnN5ICAgID0gc3k7XG4gIHRoaXMuc3cgICAgPSBzdztcbiAgdGhpcy5zaCAgICA9IHNoO1xuICB0aGlzLmR3ICAgID0gZHc7XG4gIHRoaXMuZGggICAgPSBkaDtcbn1cblxuQ29tcG91bmRlZEltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0SW1hZ2UucHJvdG90eXBlICk7XG5Db21wb3VuZGVkSW1hZ2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ29tcG91bmRlZEltYWdlO1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5Db21wb3VuZGVkSW1hZ2UjZ2V0XG4gKi9cbkNvbXBvdW5kZWRJbWFnZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0ICgpXG57XG4gIHJldHVybiB0aGlzLmltYWdlLmdldCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb3VuZGVkSW1hZ2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb21wb3VuZGVkSW1hZ2UgPSByZXF1aXJlKCAnLi9Db21wb3VuZGVkSW1hZ2UnICk7XG52YXIgQWJzdHJhY3RJbWFnZSAgID0gcmVxdWlyZSggJy4vQWJzdHJhY3RJbWFnZScgKTtcblxuLyoqXG4gKiDQmtC70LDRgdGBINC60LDRgNGC0LjQvdC60LguXG4gKiBAY29uc3RydWN0b3IgdjYuSW1hZ2VcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0SW1hZ2VcbiAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudH0gaW1hZ2UgRE9NINGN0LvQtdC80LXQvdGCINC60LDRgNGC0LjQvdC60LggKElNRykuXG4gKiBAZmlyZXMgY29tcGxldGVcbiAqIEBzZWUgdjYuSW1hZ2UuZnJvbVVSTFxuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRJbWFnZVxuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2ltYWdlXG4gKiBAZXhhbXBsZVxuICogdmFyIEltYWdlID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvaW1hZ2UvSW1hZ2UnICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyBhbiBpbWFnZSB3aXRoIGFuIERPTSBpbWFnZTwvY2FwdGlvbj5cbiAqIC8vIEhUTUw6IDxpbWcgc3JjPVwiaW1hZ2UucG5nXCIgaWQ9XCJpbWFnZVwiIC8+XG4gKiB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnaW1hZ2UnICkgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIGFuIGltYWdlIHdpdGggYSBVUkw8L2NhcHRpb24+XG4gKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnaW1hZ2UucG5nJyApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+RmlyZXMgXCJjb21wbGV0ZVwiIGV2ZW50PC9jYXB0aW9uPlxuICogaW1hZ2Uub25jZSggJ2NvbXBsZXRlJywgZnVuY3Rpb24gKClcbiAqIHtcbiAqICAgY29uc29sZS5sb2coICdUaGUgaW1hZ2UgaXMgbG9hZGVkIScgKTtcbiAqIH0gKTtcbiAqL1xuZnVuY3Rpb24gSW1hZ2UgKCBpbWFnZSApXG57XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAoICEgaW1hZ2Uuc3JjICkge1xuICAgIHRocm93IEVycm9yKCAnQ2Fubm90IGNyZWF0ZSB2Ni5JbWFnZSBmcm9tIEhUTUxJbWFnZUVsZW1lbnQgd2l0aCBubyBcInNyY1wiIGF0dHJpYnV0ZSAobmV3IHY2LkltYWdlKScgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtIVE1MSW1hZ2VFbGVtZW50fSB2Ni5JbWFnZSNpbWFnZSBET00g0Y3QtdC70LXQvNC10L3RgiDQutCw0YDRgtC40L3QutC4LlxuICAgKi9cbiAgdGhpcy5pbWFnZSA9IGltYWdlO1xuXG4gIGlmICggdGhpcy5pbWFnZS5jb21wbGV0ZSApIHtcbiAgICB0aGlzLl9pbml0KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5pbWFnZS5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIGZ1bmN0aW9uIG9ubG9hZCAoKVxuICAgIHtcbiAgICAgIHNlbGYuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBvbmxvYWQgKTtcbiAgICAgIHNlbGYuX2luaXQoKTtcbiAgICB9LCBmYWxzZSApO1xuICB9XG59XG5cbkltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0SW1hZ2UucHJvdG90eXBlICk7XG5JbWFnZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBJbWFnZTtcblxuLyoqXG4gKiDQmNC90LjRhtC40LDQu9C40LfQuNGA0YPQtdGCINC60LDRgNGC0LjQvdC60YMg0L/QvtGB0LvQtSDQtdC1INC30LDQs9GA0YPQt9C60LguXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCB2Ni5JbWFnZSNfaW5pdFxuICogQHJldHVybiB7dm9pZH0g0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKi9cbkltYWdlLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uIF9pbml0ICgpXG57XG4gIHRoaXMuc3ggPSAwO1xuICB0aGlzLnN5ID0gMDtcbiAgdGhpcy5zdyA9IHRoaXMuZHcgPSB0aGlzLmltYWdlLndpZHRoOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgdGhpcy5zaCA9IHRoaXMuZGggPSB0aGlzLmltYWdlLmhlaWdodDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgdGhpcy5lbWl0KCAnY29tcGxldGUnICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5JbWFnZSNnZXRcbiAqL1xuSW1hZ2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAoKVxue1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0J7Qv9GA0LXQtNC10LvRj9C10YIsINC30LDQs9GA0YPQttC10L3QsCDQu9C4INC60LDRgNGC0LjQvdC60LAuXG4gKiBAbWV0aG9kIHY2LkltYWdlI2NvbXBsZXRlXG4gKiBAcmV0dXJuIHtib29sZWFufSBgdHJ1ZWAsINC10YHQu9C4INC30LDQs9GA0YPQttC10L3QsC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnaW1hZ2UucG5nJyApO1xuICpcbiAqIGlmICggISBpbWFnZS5jb21wbGV0ZSgpICkge1xuICogICBpbWFnZS5vbmNlKCAnY29tcGxldGUnLCBmdW5jdGlvbiAoKVxuICogICB7XG4gKiAgICAgY29uc29sZS5sb2coICdUaGUgaW1hZ2UgaXMgbG9hZGVkIScsIGltYWdlLmNvbXBsZXRlKCkgKTtcbiAqICAgfSApO1xuICogfVxuICovXG5JbWFnZS5wcm90b3R5cGUuY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZSAoKVxue1xuICByZXR1cm4gQm9vbGVhbiggdGhpcy5pbWFnZS5zcmMgKSAmJiB0aGlzLmltYWdlLmNvbXBsZXRlO1xufTtcblxuLyoqXG4gKiDQktC+0LfQstGA0LDRidCw0LXRgiBVUkwg0LrQsNGA0YLQuNC90LrQuC5cbiAqIEBtZXRob2QgdjYuSW1hZ2Ujc3JjXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFVSTCDQutCw0YDRgtC40L3QutC4LlxuICogQGV4YW1wbGVcbiAqIEltYWdlLmZyb21VUkwoICdpbWFnZS5wbmcnICkuc3JjKCk7IC8vIC0+IFwiaW1hZ2UucG5nXCJcbiAqL1xuSW1hZ2UucHJvdG90eXBlLnNyYyA9IGZ1bmN0aW9uIHNyYyAoKVxue1xuICByZXR1cm4gdGhpcy5pbWFnZS5zcmM7XG59O1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINC90L7QstGD0Y4ge0BsaW5rIHY2LkltYWdlfSDQuNC3IFVSTC5cbiAqIEBtZXRob2QgdjYuSW1hZ2UuZnJvbVVSTFxuICogQHBhcmFtICB7c3RyaW5nfSAgIHNyYyBVUkwg0LrQsNGA0YLQuNC90LrQuC5cbiAqIEByZXR1cm4ge3Y2LkltYWdlfSAgICAg0J3QvtCy0LDRjyB7QGxpbmsgdjYuSW1hZ2V9LlxuICogQGV4YW1wbGVcbiAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICdpbWFnZS5wbmcnICk7XG4gKi9cbkltYWdlLmZyb21VUkwgPSBmdW5jdGlvbiBmcm9tVVJMICggc3JjIClcbntcbiAgdmFyIGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2ltZycgKTtcbiAgaW1hZ2Uuc3JjID0gc3JjO1xuICByZXR1cm4gbmV3IEltYWdlKCBpbWFnZSApO1xufTtcblxuLyoqXG4gKiDQn9GA0L7Qv9C+0YDRhtC40L7QvdCw0LvRjNC90L4g0YDQsNGB0YLRj9Cz0LjQstCw0LXRgiDQuNC70Lgg0YHQttC40LzQsNC10YIg0LrQsNGA0YLQuNC90LrRgy5cbiAqIEBtZXRob2QgdjYuSW1hZ2Uuc3RyZXRjaFxuICogQHBhcmFtICB7djYuQWJzdHJhY3RJbWFnZX0gICBpbWFnZSDQmtCw0YDRgtC40L3QutCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBkdyAgICDQndC+0LLRi9C5IFwiRGVzdGluYXRpb24gV2lkdGhcIi5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgZGggICAg0J3QvtCy0YvQuSBcIkRlc3RpbmF0aW9uIEhlaWdodFwiLlxuICogQHJldHVybiB7djYuQ29tcG91bmRlZEltYWdlfSAgICAgICDQndC+0LLQsNGPINC60LDRgNGC0LjQvdC60LAuXG4gKiBAZXhhbXBsZVxuICogSW1hZ2Uuc3RyZXRjaCggaW1hZ2UsIDYwMCwgNDAwICk7XG4gKi9cbkltYWdlLnN0cmV0Y2ggPSBmdW5jdGlvbiBzdHJldGNoICggaW1hZ2UsIGR3LCBkaCApXG57XG4gIHZhciB2YWx1ZSA9IGRoIC8gaW1hZ2UuZGggKiBpbWFnZS5kdztcblxuICAvLyBTdHJldGNoIERXLlxuICBpZiAoIHZhbHVlIDwgZHcgKSB7XG4gICAgZGggPSBkdyAvIGltYWdlLmR3ICogaW1hZ2UuZGg7XG5cbiAgLy8gU3RyZXRjaCBESC5cbiAgfSBlbHNlIHtcbiAgICBkdyA9IHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBDb21wb3VuZGVkSW1hZ2UoIGltYWdlLmdldCgpLCBpbWFnZS5zeCwgaW1hZ2Uuc3ksIGltYWdlLnN3LCBpbWFnZS5zaCwgZHcsIGRoICk7XG59O1xuXG4vKipcbiAqINCe0LHRgNC10LfQsNC10YIg0LrQsNGA0YLQuNC90LrRgy5cbiAqIEBtZXRob2QgdjYuSW1hZ2UuY3V0XG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdEltYWdlfSAgIGltYWdlINCa0LDRgNGC0LjQvdC60LAsINC60L7RgtC+0YDRg9GOINC90LDQtNC+INC+0LHRgNC10LfQsNGC0YwuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIHN4ICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAsINC+0YLQutGD0LTQsCDQvdCw0LTQviDQvtCx0YDQtdC30LDRgtGMLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBzeSAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwLCDQvtGC0LrRg9C00LAg0L3QsNC00L4g0L7QsdGA0LXQt9Cw0YLRjC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgc3cgICAg0J3QvtCy0LDRjyDRiNC40YDQuNC90LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIHNoICAgINCd0L7QstCw0Y8g0LLRi9GB0L7RgtCwLlxuICogQHJldHVybiB7djYuQ29tcG91bmRlZEltYWdlfSAgICAgICDQntCx0YDQtdC30LDQvdC90LDRjyDQutCw0YDRgtC40L3QutCwLlxuICogQGV4YW1wbGVcbiAqIEltYWdlLmN1dCggaW1hZ2UsIDEwLCAyMCwgMzAsIDQwICk7XG4gKi9cbkltYWdlLmN1dCA9IGZ1bmN0aW9uIGN1dCAoIGltYWdlLCBzeCwgc3ksIGR3LCBkaCApXG57XG4gIHZhciBzdyA9IGltYWdlLnN3IC8gaW1hZ2UuZHcgKiBkdztcbiAgdmFyIHNoID0gaW1hZ2Uuc2ggLyBpbWFnZS5kaCAqIGRoO1xuXG4gIHN4ICs9IGltYWdlLnN4O1xuXG4gIGlmICggc3ggKyBzdyA+IGltYWdlLnN4ICsgaW1hZ2Uuc3cgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3V0IHRoZSBpbWFnZSBiZWNhdXNlIHRoZSBuZXcgaW1hZ2UgWCBvciBXIGlzIG91dCBvZiBib3VuZHMgKHY2LkltYWdlLmN1dCknICk7XG4gIH1cblxuICBzeSArPSBpbWFnZS5zeTtcblxuICBpZiAoIHN5ICsgc2ggPiBpbWFnZS5zeSArIGltYWdlLnNoICkge1xuICAgIHRocm93IEVycm9yKCAnQ2Fubm90IGN1dCB0aGUgaW1hZ2UgYmVjYXVzZSB0aGUgbmV3IGltYWdlIFkgb3IgSCBpcyBvdXQgb2YgYm91bmRzICh2Ni5JbWFnZS5jdXQpJyApO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBDb21wb3VuZGVkSW1hZ2UoIGltYWdlLmdldCgpLCBzeCwgc3ksIHN3LCBzaCwgZHcsIGRoICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX0Zsb2F0MzJBcnJheTtcblxuaWYgKCB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSAnZnVuY3Rpb24nICkge1xuICBfRmxvYXQzMkFycmF5ID0gRmxvYXQzMkFycmF5OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG59IGVsc2Uge1xuICBfRmxvYXQzMkFycmF5ID0gQXJyYXk7XG59XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0LzQsNGB0YHQuNCyINGBINC60L7QvtGA0LTQuNC90LDRgtCw0LzQuCDQstGB0LXRhSDRgtC+0YfQtdC6INC90YPQttC90L7Qs9C+INC/0L7Qu9C40LPQvtC90LAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjcmVhdGVQb2x5Z29uXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgIHNpZGVzINCa0L7Qu9C40YfQtdGB0YLQstC+INGB0YLQvtGA0L7QvSDQv9C+0LvQuNCz0L7QvdCwLlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSAgICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQvNCw0YHRgdC40LIgKEZsb2F0MzJBcnJheSkg0LrQvtGC0L7RgNGL0Lkg0LLRi9Cz0LvRj9C00LjRgiDRgtCw0Lo6IGBbIHgxLCB5MSwgeDIsIHkyIF1gLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICDQktGB0LUg0LfQvdCw0YfQtdC90LjRjyDQutC+0YLQvtGA0L7Qs9C+INC90L7RgNC80LDQu9C40LfQvtCy0LDQvdC90YsuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVBvbHlnb24gKCBzaWRlcyApXG57XG4gIHZhciBpICAgICAgICA9IE1hdGguZmxvb3IoIHNpZGVzICk7XG4gIHZhciBzdGVwICAgICA9IE1hdGguUEkgKiAyIC8gc2lkZXM7XG4gIHZhciB2ZXJ0aWNlcyA9IG5ldyBfRmxvYXQzMkFycmF5KCBpICogMiArIDIgKTtcblxuICBmb3IgKCA7IGkgPj0gMDsgLS1pICkge1xuICAgIHZlcnRpY2VzWyAgICAgaSAqIDIgXSA9IE1hdGguY29zKCBzdGVwICogaSApO1xuICAgIHZlcnRpY2VzWyAxICsgaSAqIDIgXSA9IE1hdGguc2luKCBzdGVwICogaSApO1xuICB9XG5cbiAgcmV0dXJuIHZlcnRpY2VzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVBvbHlnb247XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0Lgg0LjQvdC40YbQuNCw0LvQuNC30LjRgNGD0LXRgiDQvdC+0LLRg9GOIFdlYkdMINC/0YDQvtCz0YDQsNC80LzRgy5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNyZWF0ZVByb2dyYW1cbiAqIEBwYXJhbSAge1dlYkdMU2hhZGVyfSAgICAgICAgICAgdmVydCDQktC10YDRiNC40L3QvdGL0Lkg0YjQtdC50LTQtdGAICjRgdC+0LfQtNCw0L3QvdGL0Lkg0YEg0L/QvtC80L7RidGM0Y4gYHtAbGluayBjcmVhdGVTaGFkZXJ9YCkuXG4gKiBAcGFyYW0gIHtXZWJHTFNoYWRlcn0gICAgICAgICAgIGZyYWcg0KTRgNCw0LPQvNC10L3RgtC90YvQuSDRiNC10LnQtNC10YAgKNGB0L7Qt9C00LDQvdC90YvQuSDRgSDQv9C+0LzQvtGJ0YzRjiBge0BsaW5rIGNyZWF0ZVNoYWRlcn1gKS5cbiAqIEBwYXJhbSAge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgICBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICogQHJldHVybiB7V2ViR0xQcm9ncmFtfVxuICovXG5mdW5jdGlvbiBjcmVhdGVQcm9ncmFtICggdmVydCwgZnJhZywgZ2wgKVxue1xuICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcblxuICBnbC5hdHRhY2hTaGFkZXIoIHByb2dyYW0sIHZlcnQgKTtcbiAgZ2wuYXR0YWNoU2hhZGVyKCBwcm9ncmFtLCBmcmFnICk7XG4gIGdsLmxpbmtQcm9ncmFtKCBwcm9ncmFtICk7XG5cbiAgaWYgKCAhIGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoIHByb2dyYW0sIGdsLkxJTktfU1RBVFVTICkgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdVbmFibGUgdG8gaW5pdGlhbGl6ZSB0aGUgc2hhZGVyIHByb2dyYW06ICcgKyBnbC5nZXRQcm9ncmFtSW5mb0xvZyggcHJvZ3JhbSApICk7XG4gIH1cblxuICBnbC52YWxpZGF0ZVByb2dyYW0oIHByb2dyYW0gKTtcblxuICBpZiAoICEgZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggcHJvZ3JhbSwgZ2wuVkFMSURBVEVfU1RBVFVTICkgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdVbmFibGUgdG8gdmFsaWRhdGUgdGhlIHNoYWRlciBwcm9ncmFtOiAnICsgZ2wuZ2V0UHJvZ3JhbUluZm9Mb2coIHByb2dyYW0gKSApO1xuICB9XG5cbiAgcmV0dXJuIHByb2dyYW07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUHJvZ3JhbTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQuCDQuNC90LjRhtC40LDQu9C40LfQuNGA0YPQtdGCINC90L7QstGL0LkgV2ViR0wg0YjQtdC50LTQtdGALlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY3JlYXRlU2hhZGVyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICAgIHNvdXJjZSDQmNGB0YXQvtC00L3Ri9C5INC60L7QtCDRiNC10LnQtNC10YDQsC5cbiAqIEBwYXJhbSAge2NvbnN0YW50fSAgICAgICAgICAgICAgdHlwZSAgINCi0LjQvyDRiNC10LnQtNC10YDQsDogVkVSVEVYX1NIQURFUiDQuNC70LggRlJBR01FTlRfU0hBREVSLlxuICogQHBhcmFtICB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAgICAgV2ViR0wg0LrQvtC90YLQtdC60YHRgi5cbiAqIEByZXR1cm4ge1dlYkdMU2hhZGVyfVxuICovXG5mdW5jdGlvbiBjcmVhdGVTaGFkZXIgKCBzb3VyY2UsIHR5cGUsIGdsIClcbntcbiAgdmFyIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlciggdHlwZSApO1xuXG4gIGdsLnNoYWRlclNvdXJjZSggc2hhZGVyLCBzb3VyY2UgKTtcbiAgZ2wuY29tcGlsZVNoYWRlciggc2hhZGVyICk7XG5cbiAgaWYgKCAhIGdsLmdldFNoYWRlclBhcmFtZXRlciggc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUyApICkge1xuICAgIHRocm93IFN5bnRheEVycm9yKCAnQW4gZXJyb3Igb2NjdXJyZWQgY29tcGlsaW5nIHRoZSBzaGFkZXJzOiAnICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyggc2hhZGVyICkgKTtcbiAgfVxuXG4gIHJldHVybiBzaGFkZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlU2hhZGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWVtYmVyIHtvYmplY3R9IHBvbHlnb25zXG4gKi9cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG5vb3AgPSByZXF1aXJlKCAncGVha28vbm9vcCcgKTtcblxudmFyIHJlcG9ydCwgcmVwb3J0ZWQ7XG5cbmlmICggdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmIGNvbnNvbGUud2FybiApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gIHJlcG9ydGVkID0ge307XG5cbiAgcmVwb3J0ID0gZnVuY3Rpb24gcmVwb3J0ICggbWVzc2FnZSApXG4gIHtcbiAgICBpZiAoIHJlcG9ydGVkWyBtZXNzYWdlIF0gKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc29sZS53YXJuKCBtZXNzYWdlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIHJlcG9ydGVkWyBtZXNzYWdlIF0gPSB0cnVlO1xuICB9O1xufSBlbHNlIHtcbiAgcmVwb3J0ID0gbm9vcDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXBvcnQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuaWRlbnRpdHkgPSBmdW5jdGlvbiBpZGVudGl0eSAoKVxue1xuICByZXR1cm4gW1xuICAgIDEsIDAsIDAsXG4gICAgMCwgMSwgMCxcbiAgICAwLCAwLCAxXG4gIF07XG59O1xuXG5leHBvcnRzLnNldElkZW50aXR5ID0gZnVuY3Rpb24gc2V0SWRlbnRpdHkgKCBtMSApXG57XG4gIG0xWyAwIF0gPSAxO1xuICBtMVsgMSBdID0gMDtcbiAgbTFbIDIgXSA9IDA7XG4gIG0xWyAzIF0gPSAwO1xuICBtMVsgNCBdID0gMTtcbiAgbTFbIDUgXSA9IDA7XG4gIG0xWyA2IF0gPSAwO1xuICBtMVsgNyBdID0gMDtcbiAgbTFbIDggXSA9IDE7XG59O1xuXG5leHBvcnRzLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICggbTEsIG0yIClcbntcbiAgbTFbIDAgXSA9IG0yWyAwIF07XG4gIG0xWyAxIF0gPSBtMlsgMSBdO1xuICBtMVsgMiBdID0gbTJbIDIgXTtcbiAgbTFbIDMgXSA9IG0yWyAzIF07XG4gIG0xWyA0IF0gPSBtMlsgNCBdO1xuICBtMVsgNSBdID0gbTJbIDUgXTtcbiAgbTFbIDYgXSA9IG0yWyA2IF07XG4gIG0xWyA3IF0gPSBtMlsgNyBdO1xuICBtMVsgOCBdID0gbTJbIDggXTtcbn07XG5cbmV4cG9ydHMuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSAoIG0xIClcbntcbiAgcmV0dXJuIFtcbiAgICBtMVsgMCBdLFxuICAgIG0xWyAxIF0sXG4gICAgbTFbIDIgXSxcbiAgICBtMVsgMyBdLFxuICAgIG0xWyA0IF0sXG4gICAgbTFbIDUgXSxcbiAgICBtMVsgNiBdLFxuICAgIG0xWyA3IF0sXG4gICAgbTFbIDggXVxuICBdO1xufTtcblxuZXhwb3J0cy50cmFuc2xhdGUgPSBmdW5jdGlvbiB0cmFuc2xhdGUgKCBtMSwgeCwgeSApXG57XG4gIG0xWyA2IF0gPSAoIHggKiBtMVsgMCBdICkgKyAoIHkgKiBtMVsgMyBdICkgKyBtMVsgNiBdO1xuICBtMVsgNyBdID0gKCB4ICogbTFbIDEgXSApICsgKCB5ICogbTFbIDQgXSApICsgbTFbIDcgXTtcbiAgbTFbIDggXSA9ICggeCAqIG0xWyAyIF0gKSArICggeSAqIG0xWyA1IF0gKSArIG0xWyA4IF07XG59O1xuXG5leHBvcnRzLnJvdGF0ZSA9IGZ1bmN0aW9uIHJvdGF0ZSAoIG0xLCBhbmdsZSApXG57XG4gIHZhciBtMTAgPSBtMVsgMCBdO1xuICB2YXIgbTExID0gbTFbIDEgXTtcbiAgdmFyIG0xMiA9IG0xWyAyIF07XG4gIHZhciBtMTMgPSBtMVsgMyBdO1xuICB2YXIgbTE0ID0gbTFbIDQgXTtcbiAgdmFyIG0xNSA9IG0xWyA1IF07XG5cbiAgdmFyIHggPSBNYXRoLmNvcyggYW5nbGUgKTtcbiAgdmFyIHkgPSBNYXRoLnNpbiggYW5nbGUgKTtcblxuICBtMVsgMCBdID0gKCB4ICogbTEwICkgKyAoIHkgKiBtMTMgKTtcbiAgbTFbIDEgXSA9ICggeCAqIG0xMSApICsgKCB5ICogbTE0ICk7XG4gIG0xWyAyIF0gPSAoIHggKiBtMTIgKSArICggeSAqIG0xNSApO1xuICBtMVsgMyBdID0gKCB4ICogbTEzICkgLSAoIHkgKiBtMTAgKTtcbiAgbTFbIDQgXSA9ICggeCAqIG0xNCApIC0gKCB5ICogbTExICk7XG4gIG0xWyA1IF0gPSAoIHggKiBtMTUgKSAtICggeSAqIG0xMiApO1xufTtcblxuZXhwb3J0cy5zY2FsZSA9IGZ1bmN0aW9uIHNjYWxlICggbTEsIHgsIHkgKVxue1xuICBtMVsgMCBdICo9IHg7XG4gIG0xWyAxIF0gKj0geDtcbiAgbTFbIDIgXSAqPSB4O1xuICBtMVsgMyBdICo9IHk7XG4gIG0xWyA0IF0gKj0geTtcbiAgbTFbIDUgXSAqPSB5O1xufTtcblxuZXhwb3J0cy50cmFuc2Zvcm0gPSBmdW5jdGlvbiB0cmFuc2Zvcm0gKCBtMSwgbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxue1xuICBtMVsgMCBdICo9IG0xMTtcbiAgbTFbIDEgXSAqPSBtMjE7XG4gIG0xWyAyIF0gKj0gZHg7XG4gIG0xWyAzIF0gKj0gbTEyO1xuICBtMVsgNCBdICo9IG0yMjtcbiAgbTFbIDUgXSAqPSBkeTtcbiAgbTFbIDYgXSA9IDA7XG4gIG0xWyA3IF0gPSAwO1xufTtcblxuZXhwb3J0cy5zZXRUcmFuc2Zvcm0gPSBmdW5jdGlvbiBzZXRUcmFuc2Zvcm0gKCBtMSwgbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxue1xuICAvLyBYIHNjYWxlXG4gIG0xWyAwIF0gPSBtMTE7XG4gIC8vIFggc2tld1xuICBtMVsgMSBdID0gbTEyO1xuICAvLyBZIHNrZXdcbiAgbTFbIDMgXSA9IG0yMTtcbiAgLy8gWSBzY2FsZVxuICBtMVsgNCBdID0gbTIyO1xuICAvLyBYIHRyYW5zbGF0ZVxuICBtMVsgNiBdID0gZHg7XG4gIC8vIFkgdHJhbnNsYXRlXG4gIG0xWyA3IF0gPSBkeTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICcuLi9zZXR0aW5ncycgKTtcblxuLyoqXG4gKiDQkNCx0YHRgtGA0LDQutGC0L3Ri9C5INC60LvQsNGB0YEg0LLQtdC60YLQvtGA0LAg0YEg0LHQsNC30L7QstGL0LzQuCDQvNC10YLQvtC00LDQvNC4LlxuICpcbiAqINCn0YLQvtCx0Ysg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMINCz0YDRg9C00YPRgdGLINCy0LzQtdGB0YLQviDRgNCw0LTQuNCw0L3QvtCyINC90LDQtNC+INC90LDQv9C40YHQsNGC0Ywg0YHQu9C10LTRg9GO0YnQtdC1OlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIHNldHRpbmdzID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvc2V0dGluZ3MnICk7XG4gKiBzZXR0aW5ncy5kZWdyZWVzID0gdHJ1ZTtcbiAqIGBgYFxuICogQGFic3RyYWN0XG4gKiBAY29uc3RydWN0b3IgdjYuQWJzdHJhY3RWZWN0b3JcbiAqIEBzZWUgdjYuVmVjdG9yMkRcbiAqIEBzZWUgdjYuVmVjdG9yM0RcbiAqL1xuZnVuY3Rpb24gQWJzdHJhY3RWZWN0b3IgKClcbntcbiAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBhYnN0cmFjdCBjbGFzcyAobmV3IHY2LkFic3RyYWN0VmVjdG9yKScgKTtcbn1cblxuQWJzdHJhY3RWZWN0b3IucHJvdG90eXBlID0ge1xuICAvKipcbiAgICog0J3QvtGA0LzQsNC70LjQt9GD0LXRgiDQstC10LrRgtC+0YAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3Ijbm9ybWFsaXplXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkubm9ybWFsaXplKCk7IC8vIFZlY3RvcjJEIHsgeDogMC44OTQ0MjcxOTA5OTk5MTU5LCB5OiAwLjQ0NzIxMzU5NTQ5OTk1NzkgfVxuICAgKi9cbiAgbm9ybWFsaXplOiBmdW5jdGlvbiBub3JtYWxpemUgKClcbiAge1xuICAgIHZhciBtYWcgPSB0aGlzLm1hZygpO1xuXG4gICAgaWYgKCBtYWcgJiYgbWFnICE9PSAxICkge1xuICAgICAgdGhpcy5kaXYoIG1hZyApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQmNC30LzQtdC90Y/QtdGCINC90LDQv9GA0LDQstC70LXQvdC40LUg0LLQtdC60YLQvtGA0LAg0L3QsCBgXCJhbmdsZVwiYCDRgSDRgdC+0YXRgNCw0L3QtdC90LjQtdC8INC00LvQuNC90YsuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3Ijc2V0QW5nbGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlINCd0L7QstC+0LUg0L3QsNC/0YDQsNCy0LvQtdC90LjQtS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5zZXRBbmdsZSggNDUgKiBNYXRoLlBJIC8gMTgwICk7IC8vIFZlY3RvcjJEIHsgeDogMy4xNjIyNzc2NjAxNjgzNzk1LCB5OiAzLjE2MjI3NzY2MDE2ODM3OSB9XG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPtCY0YHQv9C+0LvRjNC30YPRjyDQs9GA0YPQtNGD0YHRizwvY2FwdGlvbj5cbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkuc2V0QW5nbGUoIDQ1ICk7IC8vIFZlY3RvcjJEIHsgeDogMy4xNjIyNzc2NjAxNjgzNzk1LCB5OiAzLjE2MjI3NzY2MDE2ODM3OSB9XG4gICAqL1xuICBzZXRBbmdsZTogZnVuY3Rpb24gc2V0QW5nbGUgKCBhbmdsZSApXG4gIHtcbiAgICB2YXIgbWFnID0gdGhpcy5tYWcoKTtcblxuICAgIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICAgIGFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gICAgfVxuXG4gICAgdGhpcy54ID0gbWFnICogTWF0aC5jb3MoIGFuZ2xlICk7XG4gICAgdGhpcy55ID0gbWFnICogTWF0aC5zaW4oIGFuZ2xlICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICog0JjQt9C80LXQvdGP0LXRgiDQtNC70LjQvdGDINCy0LXQutGC0L7RgNCwINC90LAgYFwidmFsdWVcImAg0YEg0YHQvtGF0YDQsNC90LXQvdC40LXQvCDQvdCw0L/RgNCw0LLQu9C10L3QuNGPLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI3NldE1hZ1xuICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWUg0J3QvtCy0LDRjyDQtNC70LjQvdCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnNldE1hZyggNDIgKTsgLy8gVmVjdG9yMkQgeyB4OiAzNy41NjU5NDIwMjE5OTY0NiwgeTogMTguNzgyOTcxMDEwOTk4MjMgfVxuICAgKi9cbiAgc2V0TWFnOiBmdW5jdGlvbiBzZXRNYWcgKCB2YWx1ZSApXG4gIHtcbiAgICByZXR1cm4gdGhpcy5ub3JtYWxpemUoKS5tdWwoIHZhbHVlICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCf0L7QstC+0YDQsNGH0LjQstCw0LXRgiDQstC10LrRgtC+0YAg0L3QsCBgXCJhbmdsZVwiYCDRg9Cz0L7QuyDRgSDRgdC+0YXRgNCw0L3QtdC90LjQtdC8INC00LvQuNC90YsuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3Ijcm90YXRlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnJvdGF0ZSggNSAqIE1hdGguUEkgLyAxODAgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjgxMDQ2NzMwNjg3MTY2NiwgeTogMi4zNDEwMTIzNjcxNzQxMjM2IH1cbiAgICogQGV4YW1wbGUgPGNhcHRpb24+0JjRgdC/0L7Qu9GM0LfRg9GPINCz0YDRg9C00YPRgdGLPC9jYXB0aW9uPlxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5yb3RhdGUoIDUgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjgxMDQ2NzMwNjg3MTY2NiwgeTogMi4zNDEwMTIzNjcxNzQxMjM2IH1cbiAgICovXG4gIHJvdGF0ZTogZnVuY3Rpb24gcm90YXRlICggYW5nbGUgKVxuICB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG5cbiAgICB2YXIgYywgcztcblxuICAgIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICAgIGFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gICAgfVxuXG4gICAgYyA9IE1hdGguY29zKCBhbmdsZSApO1xuICAgIHMgPSBNYXRoLnNpbiggYW5nbGUgKTtcblxuICAgIHRoaXMueCA9ICggeCAqIGMgKSAtICggeSAqIHMgKTtcbiAgICB0aGlzLnkgPSAoIHggKiBzICkgKyAoIHkgKiBjICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0YLQtdC60YPRidC10LUg0L3QsNC/0YDQsNCy0LvQtdC90LjQtSDQstC10LrRgtC+0YDQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNnZXRBbmdsZVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9INCd0LDQv9GA0LDQstC70LXQvdC40LUgKNGD0LPQvtC7KSDQsiDQs9GA0LDQtNGD0YHQsNGFINC40LvQuCDRgNCw0LTQuNCw0L3QsNGFLlxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDEsIDEgKS5nZXRBbmdsZSgpOyAvLyAtPiAwLjc4NTM5ODE2MzM5NzQ0ODNcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+0JjRgdC/0L7Qu9GM0LfRg9GPINCz0YDRg9C00YPRgdGLPC9jYXB0aW9uPlxuICAgKiBuZXcgVmVjdG9yMkQoIDEsIDEgKS5nZXRBbmdsZSgpOyAvLyAtPiA0NVxuICAgKi9cbiAgZ2V0QW5nbGU6IGZ1bmN0aW9uIGdldEFuZ2xlICgpXG4gIHtcbiAgICBpZiAoIHNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgICByZXR1cm4gTWF0aC5hdGFuMiggdGhpcy55LCB0aGlzLnggKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE1hdGguYXRhbjIoIHRoaXMueSwgdGhpcy54ICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCe0LPRgNCw0L3QuNGH0LjQstCw0LXRgiDQtNC70LjQvdGDINCy0LXQutGC0L7RgNCwINC00L4gYFwidmFsdWVcImAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjbGltaXRcbiAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCc0LDQutGB0LjQvNCw0LvRjNC90LDRjyDQtNC70LjQvdCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMSwgMSApLmxpbWl0KCAxICk7IC8vIFZlY3RvcjJEIHsgeDogMC43MDcxMDY3ODExODY1NDc1LCB5OiAwLjcwNzEwNjc4MTE4NjU0NzUgfVxuICAgKi9cbiAgbGltaXQ6IGZ1bmN0aW9uIGxpbWl0ICggdmFsdWUgKVxuICB7XG4gICAgdmFyIG1hZyA9IHRoaXMubWFnU3EoKTtcblxuICAgIGlmICggbWFnID4gdmFsdWUgKiB2YWx1ZSApIHtcbiAgICAgIHRoaXMuZGl2KCBNYXRoLnNxcnQoIG1hZyApICkubXVsKCB2YWx1ZSApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQtNC70LjQvdGDINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI21hZ1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9INCU0LvQuNC90LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMiwgMiApLm1hZygpOyAvLyAtPiAyLjgyODQyNzEyNDc0NjE5MDNcbiAgICovXG4gIG1hZzogZnVuY3Rpb24gbWFnICgpXG4gIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCB0aGlzLm1hZ1NxKCkgKTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQu9C40L3RgyDQstC10LrRgtC+0YDQsCDQsiDQutCy0LDQtNGA0LDRgtC1LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI21hZ1NxXG4gICAqIEByZXR1cm4ge251bWJlcn0g0JTQu9C40L3QsCDQstC10LrRgtC+0YDQsCDQsiDQutCy0LDQtNGA0LDRgtC1LlxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDIsIDIgKS5tYWdTcSgpOyAvLyAtPiA4XG4gICAqL1xuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQutC70L7QvSDQstC10LrRgtC+0YDQsC5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNjbG9uZVxuICAgKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn0g0JrQu9C+0L0g0LLQtdC60YLQvtGA0LAuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmNsb25lKCk7XG4gICAqL1xuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLQtdC60YLQvtGA0LAgKHByZXR0aWZpZWQpLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI3RvU3RyaW5nXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LjMyMSwgMi4zNDUgKS50b1N0cmluZygpOyAvLyAtPiBcInY2LlZlY3RvcjJEIHsgeDogNC4zMiwgeTogMi4zNSB9XCJcbiAgICovXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC00LjRgdGC0LDQvdGG0LjRjiDQvNC10LbQtNGDINC00LLRg9C80Y8g0LLQtdC60YLQvtGA0LDQvNC4LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI2Rpc3RcbiAgICogQHBhcmFtICB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQlNGA0YPQs9C+0LkgKNCy0YLQvtGA0L7QuSkg0LLQtdC60YLQvtGALlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMywgMyApLmRpc3QoIG5ldyBWZWN0b3IyRCggMSwgMSApICk7IC8vIC0+IDIuODI4NDI3MTI0NzQ2MTkwM1xuICAgKi9cblxuICBjb25zdHJ1Y3RvcjogQWJzdHJhY3RWZWN0b3Jcbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZVxuICogQHBhcmFtICB7djYuQWJzdHJhY3RWZWN0b3J9IFZlY3RvciB7QGxpbmsgdjYuVmVjdG9yMkR9LCB7QGxpbmsgdjYuVmVjdG9yM0R9LlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgIGFuZ2xlXG4gKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn1cbiAqIEBzZWUgdjYuQWJzdHJhY3RWZWN0b3IuZnJvbUFuZ2xlXG4gKi9cbkFic3RyYWN0VmVjdG9yLl9mcm9tQW5nbGUgPSBmdW5jdGlvbiBfZnJvbUFuZ2xlICggVmVjdG9yLCBhbmdsZSApXG57XG4gIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICBhbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBWZWN0b3IoIE1hdGguY29zKCBhbmdsZSApLCBNYXRoLnNpbiggYW5nbGUgKSApO1xufTtcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDRgNCw0L3QtNC+0LzQvdGL0Lkg0LLQtdC60YLQvtGALlxuICogQHZpcnR1YWxcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IucmFuZG9tXG4gKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn0g0JLQvtC30LLRgNCw0YnQsNC10YIg0L3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3Ri9C5INCy0LXQutGC0L7RgCDRgSDRgNCw0L3QtNC+0LzQvdGL0Lwg0L3QsNC/0YDQsNCy0LvQtdC90LjQtdC8LlxuICovXG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0LLQtdC60YLQvtGAINGBINC90LDQv9GA0LDQstC70LXQvdC40LXQvCDRgNCw0LLQvdGL0LwgYFwiYW5nbGVcImAuXG4gKiBAdmlydHVhbFxuICogQHN0YXRpY1xuICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3Rvci5mcm9tQW5nbGVcbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICBhbmdsZSDQndCw0L/RgNCw0LLQu9C10L3QuNC1INCy0LXQutGC0L7RgNCwLlxuICogQHJldHVybiB7djYuQWJzdHJhY3RWZWN0b3J9ICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC90L7RgNC80LDQu9C40LfQvtCy0LDQvdC90YvQuSDQstC10LrRgtC+0YAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBBYnN0cmFjdFZlY3RvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNldHRpbmdzICAgICAgID0gcmVxdWlyZSggJy4uL3NldHRpbmdzJyApO1xudmFyIEFic3RyYWN0VmVjdG9yID0gcmVxdWlyZSggJy4vQWJzdHJhY3RWZWN0b3InICk7XG5cbi8qKlxuICogMkQg0LLQtdC60YLQvtGALlxuICogQGNvbnN0cnVjdG9yIHY2LlZlY3RvcjJEXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdFZlY3RvclxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0gWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgVmVjdG9yMkQgPSByZXF1aXJlKCAndjYuanMvbWF0aC9WZWN0b3IyRCcgKTtcbiAqIHZhciBwb3NpdGlvbiA9IG5ldyBWZWN0b3IyRCggNCwgMiApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5mdW5jdGlvbiBWZWN0b3IyRCAoIHgsIHkgKVxue1xuICAvKipcbiAgICogWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IyRCN4XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB4ID0gbmV3IFZlY3RvcjJEKCA0LCAyICkueDsgLy8gLT4gNFxuICAgKi9cblxuICAvKipcbiAgICogWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IyRCN5XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB5ID0gbmV3IFZlY3RvcjJEKCA0LCAyICkueTsgLy8gLT4gMlxuICAgKi9cblxuICB0aGlzLnNldCggeCwgeSApO1xufVxuXG5WZWN0b3IyRC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdFZlY3Rvci5wcm90b3R5cGUgKTtcblZlY3RvcjJELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFZlY3RvcjJEO1xuXG4vKipcbiAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjc2V0XG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0J3QvtCy0LDRjyBYINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCd0L7QstCw0Y8gWSDQutC+0L7RgNC00LjQvdCw0YLQsC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5zZXQoIDQsIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiA0LCB5OiAyIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAoIHgsIHkgKVxue1xuICB0aGlzLnggPSB4IHx8IDA7XG4gIHRoaXMueSA9IHkgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQuiDQutC+0L7RgNC00LjQvdCw0YLQsNC8IFgg0LggWSDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LUg0L/QsNGA0LDQvNC10YLRgNGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNhZGRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuYWRkKCA0LCAyICk7IC8vIFZlY3RvcjJEIHsgeDogNCwgeTogMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQgKCB4LCB5IClcbntcbiAgdGhpcy54ICs9IHggfHwgMDtcbiAgdGhpcy55ICs9IHkgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCS0YvRh9C40YLQsNC10YIg0LjQtyDQutC+0L7RgNC00LjQvdCw0YIgWCDQuCBZINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI3N1YlxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LLRi9GH0YLQtdC90L4uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuc3ViKCA0LCAyICk7IC8vIFZlY3RvcjJEIHsgeDogLTQsIHk6IC0yIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uIHN1YiAoIHgsIHkgKVxue1xuICB0aGlzLnggLT0geCB8fCAwO1xuICB0aGlzLnkgLT0geSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0KPQvNC90L7QttCw0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNtdWxcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGD0LzQvdC+0LbQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkubXVsKCAyICk7IC8vIFZlY3RvcjJEIHsgeDogOCwgeTogNCB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5tdWwgPSBmdW5jdGlvbiBtdWwgKCB2YWx1ZSApXG57XG4gIHRoaXMueCAqPSB2YWx1ZTtcbiAgdGhpcy55ICo9IHZhbHVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNkaXZcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGA0LDQt9C00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5kaXYoIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiAyLCB5OiAxIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmRpdiA9IGZ1bmN0aW9uIGRpdiAoIHZhbHVlIClcbntcbiAgdGhpcy54IC89IHZhbHVlO1xuICB0aGlzLnkgLz0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2RvdFxuICogQHBhcmFtICB7bnVtYmVyfSBbeD0wXVxuICogQHBhcmFtICB7bnVtYmVyfSBbeT0wXVxuICogQHJldHVybiB7bnVtYmVyfVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmRpdiggMiwgMyApOyAvLyAxNCwg0L/QvtGC0L7QvNGDINGH0YLQvjogXCIoNCAqIDIpICsgKDIgKiAzKSA9IDggKyA2ID0gMTRcIlxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gZG90ICggeCwgeSApXG57XG4gIHJldHVybiAoIHRoaXMueCAqICggeCB8fCAwICkgKSArXG4gICAgICAgICAoIHRoaXMueSAqICggeSB8fCAwICkgKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLINC80LXQttC00YMg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC80Lgg0L/QsNGA0LDQvNC10YLRgNCw0LzQuC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbGVycFxuICogQHBhcmFtIHtudW1iZXJ9IHhcbiAqIEBwYXJhbSB7bnVtYmVyfSB5XG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5sZXJwKCA4LCA0LCAwLjUgKTsgLy8gVmVjdG9yMkQgeyB4OiA2LCB5OiAzIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoIHgsIHksIHZhbHVlIClcbntcbiAgdGhpcy54ICs9ICggeCAtIHRoaXMueCApICogdmFsdWUgfHwgMDtcbiAgdGhpcy55ICs9ICggeSAtIHRoaXMueSApICogdmFsdWUgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCa0L7Qv9C40YDRg9C10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjc2V0VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDRgdC60L7Qv9C40YDQvtCy0LDRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLnNldFZlY3RvciggbmV3IFZlY3RvcjJEKCA0LCAyICkgKTsgLy8gVmVjdG9yMkQgeyB4OiA0LCB5OiAyIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnNldFZlY3RvciA9IGZ1bmN0aW9uIHNldFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLnNldCggdmVjdG9yLngsIHZlY3Rvci55ICk7XG59O1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNhZGRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00L7QsdCw0LLQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuYWRkVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDQsIDIgKSApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuYWRkVmVjdG9yID0gZnVuY3Rpb24gYWRkVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuYWRkKCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0JLRi9GH0LjRgtCw0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNzdWJWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INCy0YvRh9C10YHRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLnN1YlZlY3RvciggbmV3IFZlY3RvcjJEKCA0LCAyICkgKTsgLy8gVmVjdG9yMkQgeyB4OiAtNCwgeTogLTIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc3ViVmVjdG9yID0gZnVuY3Rpb24gc3ViVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc3ViKCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0KPQvNC90L7QttCw0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBYINC4IFkg0LTRgNGD0LPQvtCz0L4g0LLQtdC60YLQvtGA0LAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI211bFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCDQtNC70Y8g0YPQvNC90L7QttC10L3QuNGPLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLm11bFZlY3RvciggbmV3IFZlY3RvcjJEKCAyLCAzICkgKTsgLy8gVmVjdG9yMkQgeyB4OiA4LCB5OiA2IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLm11bFZlY3RvciA9IGZ1bmN0aW9uIG11bFZlY3RvciAoIHZlY3RvciApXG57XG4gIHRoaXMueCAqPSB2ZWN0b3IueDtcbiAgdGhpcy55ICo9IHZlY3Rvci55O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBYINC4IFkg0LTRgNGD0LPQvtCz0L4g0LLQtdC60YLQvtGA0LAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2RpdlZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0L3QsCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQtNC10LvQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkuZGl2VmVjdG9yKCBuZXcgVmVjdG9yMkQoIDIsIDAuNSApICk7IC8vIFZlY3RvcjJEIHsgeDogMiwgeTogNCB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kaXZWZWN0b3IgPSBmdW5jdGlvbiBkaXZWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICB0aGlzLnggLz0gdmVjdG9yLng7XG4gIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjZG90VmVjdG9yXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkuZG90VmVjdG9yKCBuZXcgVmVjdG9yMkQoIDMsIDUgKSApOyAvLyAtPiAyMlxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuZG90VmVjdG9yID0gZnVuY3Rpb24gZG90VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuZG90KCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLINC80LXQttC00YMg0LTRgNGD0LPQuNC8INCy0LXQutGC0L7RgNC+0LwuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2xlcnBWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvclxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgdmFsdWVcbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5sZXJwVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDIsIDEgKSwgMC41ICk7IC8vIFZlY3RvcjJEIHsgeDogMywgeTogMS41IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmxlcnBWZWN0b3IgPSBmdW5jdGlvbiBsZXJwVmVjdG9yICggdmVjdG9yLCB2YWx1ZSApXG57XG4gIHJldHVybiB0aGlzLmxlcnAoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmFsdWUgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI21hZ1NxXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5tYWdTcSA9IGZ1bmN0aW9uIG1hZ1NxICgpXG57XG4gIHJldHVybiAoIHRoaXMueCAqIHRoaXMueCApICsgKCB0aGlzLnkgKiB0aGlzLnkgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2Nsb25lXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lICgpXG57XG4gIHJldHVybiBuZXcgVmVjdG9yMkQoIHRoaXMueCwgdGhpcy55ICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNkaXN0XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kaXN0ID0gZnVuY3Rpb24gZGlzdCAoIHZlY3RvciApXG57XG4gIHZhciB4ID0gdmVjdG9yLnggLSB0aGlzLng7XG4gIHZhciB5ID0gdmVjdG9yLnkgLSB0aGlzLnk7XG4gIHJldHVybiBNYXRoLnNxcnQoICggeCAqIHggKSArICggeSAqIHkgKSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjdG9TdHJpbmdcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKClcbntcbiAgcmV0dXJuICd2Ni5WZWN0b3IyRCB7IHg6ICcgKyB0aGlzLngudG9GaXhlZCggMiApICsgJywgeTogJyArIHRoaXMueS50b0ZpeGVkKCAyICkgKyAnIH0nO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJELnJhbmRvbVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5yYW5kb21cbiAqL1xuVmVjdG9yMkQucmFuZG9tID0gZnVuY3Rpb24gcmFuZG9tICgpXG57XG4gIHZhciB2YWx1ZTtcblxuICBpZiAoIHNldHRpbmdzLmRlZ3JlZXMgKSB7XG4gICAgdmFsdWUgPSAzNjA7XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBNYXRoLlBJICogMjtcbiAgfVxuXG4gIHJldHVybiBWZWN0b3IyRC5mcm9tQW5nbGUoIE1hdGgucmFuZG9tKCkgKiB2YWx1ZSApO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJELmZyb21BbmdsZVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5mcm9tQW5nbGVcbiAqL1xuVmVjdG9yMkQuZnJvbUFuZ2xlID0gZnVuY3Rpb24gZnJvbUFuZ2xlICggYW5nbGUgKVxue1xuICByZXR1cm4gQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZSggVmVjdG9yMkQsIGFuZ2xlICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjJEO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWJzdHJhY3RWZWN0b3IgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFZlY3RvcicgKTtcblxuLyoqXG4gKiAzRCDQstC10LrRgtC+0YAuXG4gKiBAY29uc3RydWN0b3IgdjYuVmVjdG9yM0RcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0VmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0gWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSBZINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt6PTBdIFog0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gKiBAZXhhbXBsZVxuICogdmFyIFZlY3RvcjNEID0gcmVxdWlyZSggJ3Y2LmpzL21hdGgvVmVjdG9yM0QnICk7XG4gKiB2YXIgcG9zaXRpb24gPSBuZXcgVmVjdG9yM0QoIDQsIDIsIDMgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiAzIH1cbiAqL1xuZnVuY3Rpb24gVmVjdG9yM0QgKCB4LCB5LCB6IClcbntcbiAgLyoqXG4gICAqIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuVmVjdG9yM0QjeFxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgeCA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApLng7IC8vIC0+IDRcbiAgICovXG5cbiAgLyoqXG4gICAqIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuVmVjdG9yM0QjeVxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgeSA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApLnk7IC8vIC0+IDJcbiAgICovXG5cbiAgLyoqXG4gICAqIFog0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuVmVjdG9yM0QjelxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgeiA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApLno7IC8vIC0+IDNcbiAgICovXG5cbiAgdGhpcy5zZXQoIHgsIHksIHogKTtcbn1cblxuVmVjdG9yM0QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RWZWN0b3IucHJvdG90eXBlICk7XG5WZWN0b3IzRC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBWZWN0b3IzRDtcblxuLyoqXG4gKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNzZXRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQndC+0LLQsNGPIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0J3QvtCy0LDRjyBZINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt6PTBdINCd0L7QstCw0Y8gWiDQutC+0L7RgNC00LjQvdCw0YLQsC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5zZXQoIDQsIDIsIDYgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAoIHgsIHksIHogKVxue1xuICB0aGlzLnggPSB4IHx8IDA7XG4gIHRoaXMueSA9IHkgfHwgMDtcbiAgdGhpcy56ID0geiB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC6INC60L7QvtGA0LTQuNC90LDRgtCw0LwgWCwgWSwg0LggWiDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LUg0L/QsNGA0LDQvNC10YLRgNGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNhZGRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3Qvi5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5hZGQoIDQsIDIsIDYgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZCAoIHgsIHksIHogKVxue1xuICB0aGlzLnggKz0geCB8fCAwO1xuICB0aGlzLnkgKz0geSB8fCAwO1xuICB0aGlzLnogKz0geiB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JLRi9GH0LjRgtCw0LXRgiDQuNC3INC60L7QvtGA0LTQuNC90LDRgiBYLCBZLCDQuCBaINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3N1YlxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LLRi9GH0YLQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINCy0YvRh9GC0LXQvdC+LlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLnN1YiggNCwgMiwgNiApOyAvLyBWZWN0b3IzRCB7IHg6IC00LCB5OiAtMiwgejogLTYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24gc3ViICggeCwgeSwgeiApXG57XG4gIHRoaXMueCAtPSB4IHx8IDA7XG4gIHRoaXMueSAtPSB5IHx8IDA7XG4gIHRoaXMueiAtPSB6IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQo9C80L3QvtC20LDQtdGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNtdWxcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGD0LzQvdC+0LbQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubXVsKCAyICk7IC8vIFZlY3RvcjNEIHsgeDogOCwgeTogNCwgejogMTIgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUubXVsID0gZnVuY3Rpb24gbXVsICggdmFsdWUgKVxue1xuICB0aGlzLnggKj0gdmFsdWU7XG4gIHRoaXMueSAqPSB2YWx1ZTtcbiAgdGhpcy56ICo9IHZhbHVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgYHZhbHVlYC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZGl2XG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUg0KfQuNGB0LvQviwg0L3QsCDQutC+0YLQvtGA0L7QtSDQvdCw0LTQviDRgNCw0LfQtNC10LvQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkuZGl2KCAyICk7IC8vIFZlY3RvcjNEIHsgeDogMiwgeTogMSwgejogMyB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kaXYgPSBmdW5jdGlvbiBkaXYgKCB2YWx1ZSApXG57XG4gIHRoaXMueCAvPSB2YWx1ZTtcbiAgdGhpcy55IC89IHZhbHVlO1xuICB0aGlzLnogLz0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2RvdFxuICogQHBhcmFtICB7bnVtYmVyfSBbeD0wXVxuICogQHBhcmFtICB7bnVtYmVyfSBbeT0wXVxuICogQHBhcmFtICB7bnVtYmVyfSBbej0wXVxuICogQHJldHVybiB7bnVtYmVyfVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmRvdCggMiwgMywgNCApOyAvLyAtPiAzOCwg0L/QvtGC0L7QvNGDINGH0YLQvjogXCIoNCAqIDIpICsgKDIgKiAzKSArICg2ICogNCkgPSA4ICsgNiArIDI0ID0gMzhcIlxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gZG90ICggeCwgeSwgeiApXG57XG4gIHJldHVybiAoIHRoaXMueCAqICggeCB8fCAwICkgKSArXG4gICAgICAgICAoIHRoaXMueSAqICggeSB8fCAwICkgKSArXG4gICAgICAgICAoIHRoaXMueiAqICggeiB8fCAwICkgKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvNC10LbQtNGDINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQvNC4INC/0LDRgNCw0LzQtdGC0YDQsNC80LguXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2xlcnBcbiAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gKiBAcGFyYW0ge251bWJlcn0geVxuICogQHBhcmFtIHtudW1iZXJ9IHpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmxlcnAoIDgsIDQsIDEyLCAwLjUgKTsgLy8gVmVjdG9yM0QgeyB4OiA2LCB5OiAzLCB6OiA5IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoIHgsIHksIHosIHZhbHVlIClcbntcbiAgdGhpcy54ICs9ICggeCAtIHRoaXMueCApICogdmFsdWUgfHwgMDtcbiAgdGhpcy55ICs9ICggeSAtIHRoaXMueSApICogdmFsdWUgfHwgMDtcbiAgdGhpcy56ICs9ICggeiAtIHRoaXMueiApICogdmFsdWUgfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCa0L7Qv9C40YDRg9C10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0Qjc2V0VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDRgdC60L7Qv9C40YDQvtCy0LDRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLnNldFZlY3RvciggbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLnNldFZlY3RvciA9IGZ1bmN0aW9uIHNldFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLnNldCggdmVjdG9yLngsIHZlY3Rvci55LCB2ZWN0b3IueiApO1xufTtcblxuLyoqXG4gKiDQlNC+0LHQsNCy0LvRj9C10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjYWRkVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQtNC+0LHQsNCy0LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLmFkZFZlY3RvciggbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiA0LCB5OiAyLCB6OiA2IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmFkZFZlY3RvciA9IGZ1bmN0aW9uIGFkZFZlY3RvciAoIHZlY3RvciApXG57XG4gIHJldHVybiB0aGlzLmFkZCggdmVjdG9yLngsIHZlY3Rvci55LCB2ZWN0b3IueiApO1xufTtcblxuLyoqXG4gKiDQktGL0YfQuNGC0LDQtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3N1YlZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LLRi9GH0LXRgdGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuc3ViVmVjdG9yKCBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKSApOyAvLyBWZWN0b3IzRCB7IHg6IC00LCB5OiAtMiwgejogLTYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc3ViVmVjdG9yID0gZnVuY3Rpb24gc3ViVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc3ViKCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCj0LzQvdC+0LbQsNC10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIFgsIFksINC4IFog0LTRgNGD0LPQvtCz0L4g0LLQtdC60YLQvtGA0LAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI211bFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCDQtNC70Y8g0YPQvNC90L7QttC10L3QuNGPLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLm11bFZlY3RvciggbmV3IFZlY3RvcjNEKCAyLCAzLCA0ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiA4LCB5OiA2LCB6OiAyNCB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5tdWxWZWN0b3IgPSBmdW5jdGlvbiBtdWxWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICB0aGlzLnggKj0gdmVjdG9yLng7XG4gIHRoaXMueSAqPSB2ZWN0b3IueTtcbiAgdGhpcy56ICo9IHZlY3Rvci56O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQtdC70LjRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgWCwgWSwg0LggWiDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZGl2VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQvdCwINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5kaXZWZWN0b3IoIG5ldyBWZWN0b3IzRCggMiwgMC41LCA0ICkgKTsgLy8gVmVjdG9yM0QgeyB4OiAyLCB5OiA0LCB6OiAxLjUgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZGl2VmVjdG9yID0gZnVuY3Rpb24gZGl2VmVjdG9yICggdmVjdG9yIClcbntcbiAgdGhpcy54IC89IHZlY3Rvci54O1xuICB0aGlzLnkgLz0gdmVjdG9yLnk7XG4gIHRoaXMueiAvPSB2ZWN0b3IuejtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZG90VmVjdG9yXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkuZG90VmVjdG9yKCBuZXcgVmVjdG9yM0QoIDIsIDMsIC0yICkgKTsgLy8gLT4gMlxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZG90VmVjdG9yID0gZnVuY3Rpb24gZG90VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuZG90KCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCY0L3RgtC10YDQv9C+0LvQuNGA0YPQtdGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0LzQtdC20LTRgyDQtNGA0YPQs9C40Lwg0LLQtdC60YLQvtGA0L7QvC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbGVycFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmxlcnBWZWN0b3IoIG5ldyBWZWN0b3IzRCggOCwgNCwgMTIgKSwgMC41ICk7IC8vIFZlY3RvcjNEIHsgeDogNiwgeTogMywgejogOSB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5sZXJwVmVjdG9yID0gZnVuY3Rpb24gbGVycFZlY3RvciAoIHZlY3RvciwgdmFsdWUgKVxue1xuICByZXR1cm4gdGhpcy5sZXJwKCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56LCB2YWx1ZSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbWFnU3FcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLm1hZ1NxID0gZnVuY3Rpb24gbWFnU3EgKClcbntcbiAgcmV0dXJuICggdGhpcy54ICogdGhpcy54ICkgKyAoIHRoaXMueSAqIHRoaXMueSApICsgKCB0aGlzLnogKiB0aGlzLnogKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2Nsb25lXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lICgpXG57XG4gIHJldHVybiBuZXcgVmVjdG9yM0QoIHRoaXMueCwgdGhpcy55LCB0aGlzLnogKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2Rpc3RcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmRpc3QgPSBmdW5jdGlvbiBkaXN0ICggdmVjdG9yIClcbntcbiAgdmFyIHggPSB2ZWN0b3IueCAtIHRoaXMueDtcbiAgdmFyIHkgPSB2ZWN0b3IueSAtIHRoaXMueTtcbiAgdmFyIHogPSB2ZWN0b3IueiAtIHRoaXMuejtcbiAgcmV0dXJuIE1hdGguc3FydCggKCB4ICogeCApICsgKCB5ICogeSApICsgKCB6ICogeiApICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCN0b1N0cmluZ1xuICovXG5WZWN0b3IzRC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKVxue1xuICByZXR1cm4gJ3Y2LlZlY3RvcjNEIHsgeDogJyArIHRoaXMueC50b0ZpeGVkKCAyICkgKyAnLCB5OiAnICsgdGhpcy55LnRvRml4ZWQoIDIgKSArICcsIHo6ICcgKyB0aGlzLnoudG9GaXhlZCggMiApICsgJyB9Jztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRC5yYW5kb21cbiAqIEBzZWUgdjYuQWJzdHJhY3RWZWN0b3IucmFuZG9tXG4gKi9cblZlY3RvcjNELnJhbmRvbSA9IGZ1bmN0aW9uIHJhbmRvbSAoKVxue1xuICAvLyBVc2UgdGhlIGVxdWFsLWFyZWEgcHJvamVjdGlvbiBhbGdvcml0aG0uXG4gIHZhciB0aGV0YSA9IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJICogMjtcbiAgdmFyIHogICAgID0gKCBNYXRoLnJhbmRvbSgpICogMiApIC0gMTtcbiAgdmFyIG4gICAgID0gTWF0aC5zcXJ0KCAxIC0gKCB6ICogeiApICk7XG4gIHJldHVybiBuZXcgVmVjdG9yM0QoIG4gKiBNYXRoLmNvcyggdGhldGEgKSwgbiAqIE1hdGguc2luKCB0aGV0YSApLCB6ICk7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QuZnJvbUFuZ2xlXG4gKiBAc2VlIHY2LkFic3RyYWN0VmVjdG9yLmZyb21BbmdsZVxuICovXG5WZWN0b3IzRC5mcm9tQW5nbGUgPSBmdW5jdGlvbiBmcm9tQW5nbGUgKCBhbmdsZSApXG57XG4gIHJldHVybiBBYnN0cmFjdFZlY3Rvci5fZnJvbUFuZ2xlKCBWZWN0b3IzRCwgYW5nbGUgKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yM0Q7XG4iLCIvKiBlc2xpbnQgbGluZXMtYXJvdW5kLWRpcmVjdGl2ZTogb2ZmICovXG4vKiBlc2xpbnQgbGluZXMtYXJvdW5kLWNvbW1lbnQ6IG9mZiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGdldEVsZW1lbnRXID0gcmVxdWlyZSggJ3BlYWtvL2dldC1lbGVtZW50LXcnICk7XG52YXIgZ2V0RWxlbWVudEggPSByZXF1aXJlKCAncGVha28vZ2V0LWVsZW1lbnQtaCcgKTtcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApO1xudmFyIGNyZWF0ZVBvbHlnb24gPSByZXF1aXJlKCAnLi4vaW50ZXJuYWwvY3JlYXRlX3BvbHlnb24nICk7XG52YXIgcG9seWdvbnMgPSByZXF1aXJlKCAnLi4vaW50ZXJuYWwvcG9seWdvbnMnICk7XG52YXIgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyA9IHJlcXVpcmUoICcuL2ludGVybmFsL3NldF9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MnICk7XG52YXIgZ2V0V2ViR0wgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9nZXRfd2ViZ2wnICk7XG52YXIgY29weURyYXdpbmdTZXR0aW5ncyA9IHJlcXVpcmUoICcuL2ludGVybmFsL2NvcHlfZHJhd2luZ19zZXR0aW5ncycgKTtcbnZhciBwcm9jZXNzUmVjdEFsaWduWCA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWDtcbnZhciBwcm9jZXNzUmVjdEFsaWduWSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWTtcbnZhciBvcHRpb25zID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG4vKipcbiAqINCQ0LHRgdGC0YDQsNC60YLQvdGL0Lkg0LrQu9Cw0YHRgSDRgNC10L3QtNC10YDQtdGA0LAuXG4gKiBAYWJzdHJhY3RcbiAqIEBjb25zdHJ1Y3RvciB2Ni5BYnN0cmFjdFJlbmRlcmVyXG4gKiBAc2VlIHY2LlJlbmRlcmVyR0xcbiAqIEBzZWUgdjYuUmVuZGVyZXIyRFxuICogQGV4YW1wbGVcbiAqIHZhciBBYnN0cmFjdFJlbmRlcmVyID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXIvQWJzdHJhY3RSZW5kZXJlcicgKTtcbiAqL1xuZnVuY3Rpb24gQWJzdHJhY3RSZW5kZXJlciAoKVxue1xuICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGFic3RyYWN0IGNsYXNzIChuZXcgdjYuQWJzdHJhY3RSZW5kZXJlciknICk7XG59XG5BYnN0cmFjdFJlbmRlcmVyLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqINCU0L7QsdCw0LLQu9GP0LXRgiBgY2FudmFzYCDRgNC10L3QtNC10YDQtdGA0LAg0LIgRE9NLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYXBwZW5kVG9cbiAgICogQHBhcmFtIHtFbGVtZW50fSBwYXJlbnQg0K3Qu9C10LzQtdC90YIsINCyINC60L7RgtC+0YDRi9C5IGBjYW52YXNgINGA0LXQvdC00LXRgNC10YDQsCDQtNC+0LvQttC10L0g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBBZGQgcmVuZGVyZXIgaW50byBET00uXG4gICAqIHJlbmRlcmVyLmFwcGVuZFRvKCBkb2N1bWVudC5ib2R5ICk7XG4gICAqL1xuICBhcHBlbmRUbzogZnVuY3Rpb24gYXBwZW5kVG8gKCBwYXJlbnQgKVxuICB7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKCB0aGlzLmNhbnZhcyApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KPQtNCw0LvRj9C10YIgYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINC40LcgRE9NLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZGVzdHJveVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlbW92ZSByZW5kZXJlciBmcm9tIERPTS5cbiAgICogcmVuZGVyZXIuZGVzdHJveSgpO1xuICAgKi9cbiAgZGVzdHJveTogZnVuY3Rpb24gZGVzdHJveSAoKVxuICB7XG4gICAgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggdGhpcy5jYW52YXMgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCh0L7RhdGA0LDQvdGP0LXRgiDRgtC10LrRg9GJ0LjQtSDQvdCw0YHRgtGA0L7QudC60Lgg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwdXNoXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2F2ZSBkcmF3aW5nIHNldHRpbmdzIChmaWxsLCBsaW5lV2lkdGguLi4pIChwdXNoIG9udG8gc3RhY2spLlxuICAgKiByZW5kZXJlci5wdXNoKCk7XG4gICAqL1xuICBwdXNoOiBmdW5jdGlvbiBwdXNoICgpXG4gIHtcbiAgICBpZiAoIHRoaXMuX3N0YWNrWyArK3RoaXMuX3N0YWNrSW5kZXggXSApIHtcbiAgICAgIGNvcHlEcmF3aW5nU2V0dGluZ3MoIHRoaXMuX3N0YWNrWyB0aGlzLl9zdGFja0luZGV4IF0sIHRoaXMgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RhY2sucHVzaCggc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncygge30sIHRoaXMgKSApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCS0L7RgdGB0YLQsNC90LDQstC70LjQstCw0LXRgiDQv9GA0LXQtNGL0LTRg9GJ0LjQtSDQvdCw0YHRgtGA0L7QudC60Lgg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwb3BcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXN0b3JlIGRyYXdpbmcgc2V0dGluZ3MgKGZpbGwsIGxpbmVXaWR0aC4uLikgKHRha2UgZnJvbSBzdGFjaykuXG4gICAqIHJlbmRlcmVyLnBvcCgpO1xuICAgKi9cbiAgcG9wOiBmdW5jdGlvbiBwb3AgKClcbiAge1xuICAgIGlmICggdGhpcy5fc3RhY2tJbmRleCA+PSAwICkge1xuICAgICAgY29weURyYXdpbmdTZXR0aW5ncyggdGhpcywgdGhpcy5fc3RhY2tbIHRoaXMuX3N0YWNrSW5kZXgtLSBdICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3MoIHRoaXMsIHRoaXMgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQmNC30LzQtdC90Y/QtdGCINGA0LDQt9C80LXRgCDRgNC10L3QtNC10YDQtdGA0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZXNpemVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHcg0J3QvtCy0LDRjyDRiNC40YDQuNC90LAuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoINCd0L7QstCw0Y8g0LLRi9GB0L7RgtCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlc2l6ZSByZW5kZXJlciB0byA2MDB4NDAwLlxuICAgKiByZW5kZXJlci5yZXNpemUoIDYwMCwgNDAwICk7XG4gICAqL1xuICByZXNpemU6IGZ1bmN0aW9uIHJlc2l6ZSAoIHcsIGggKVxuICB7XG4gICAgdmFyIGNhbnZhcyA9IHRoaXMuY2FudmFzO1xuICAgIHZhciBzY2FsZSA9IHRoaXMuc2V0dGluZ3Muc2NhbGU7XG4gICAgY2FudmFzLnN0eWxlLndpZHRoID0gdyArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGggKyAncHgnO1xuICAgIGNhbnZhcy53aWR0aCA9IHRoaXMudyA9IE1hdGguZmxvb3IoIHcgKiBzY2FsZSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmggPSBNYXRoLmZsb29yKCBoICogc2NhbGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCY0LfQvNC10L3Rj9C10YIg0YDQsNC30LzQtdGAINGA0LXQvdC00LXRgNC10YDQsCDQtNC+INGA0LDQt9C80LXRgNCwIGBlbGVtZW50YCDRjdC70LXQvNC10L3RgtCwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVzaXplVG9cbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50INCt0LvQtdC80LXQvdGCLCDQtNC+INC60L7RgtC+0YDQvtCz0L4g0L3QsNC00L4g0YDQsNGB0YLRj9C90YPRgtGMINGA0LXQvdC00LXRgNC10YAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVzaXplIHJlbmRlcmVyIHRvIG1hdGNoIDxib2R5IC8+IHNpemVzLlxuICAgKiByZW5kZXJlci5yZXNpemVUbyggZG9jdW1lbnQuYm9keSApO1xuICAgKi9cbiAgcmVzaXplVG86IGZ1bmN0aW9uIHJlc2l6ZVRvICggZWxlbWVudCApXG4gIHtcbiAgICByZXR1cm4gdGhpcy5yZXNpemUoIGdldEVsZW1lbnRXKCBlbGVtZW50ICksIGdldEVsZW1lbnRIKCBlbGVtZW50ICkgKTtcbiAgfSxcbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQv9C+0LvQuNCz0L7QvS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2RyYXdQb2x5Z29uXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgeCAgICAgICAgICAgICBYINC60L7QvtGA0LTQuNC90LDRgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgeSAgICAgICAgICAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgeFJhZGl1cyAgICAgICBYINGA0LDQtNC40YPRgSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgIHlSYWRpdXMgICAgICAgWSDRgNCw0LTQuNGD0YEg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICBzaWRlcyAgICAgICAgINCa0L7Qu9C40YfQtdGB0YLQstC+INGB0YLQvtGA0L7QvSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgIHJvdGF0aW9uQW5nbGUg0KPQs9C+0Lsg0L/QvtCy0L7RgNC+0YLQsCDQv9C+0LvQuNCz0L7QvdCwXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAo0YfRgtC+0LHRiyDQvdC1INC40YHQv9C+0LvRjNC30L7QstCw0YLRjCB7QGxpbmsgdjYuVHJhbnNmb3JtI3JvdGF0ZX0pLlxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgIGRlZ3JlZXMgICAgICAg0JjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMINCz0YDQsNC00YPRgdGLLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgaGV4YWdvbiBhdCBbIDQsIDIgXSB3aXRoIHJhZGl1cyAyNS5cbiAgICogcmVuZGVyZXIucG9seWdvbiggNCwgMiwgMjUsIDI1LCA2LCAwICk7XG4gICAqL1xuICBkcmF3UG9seWdvbjogZnVuY3Rpb24gZHJhd1BvbHlnb24gKCB4LCB5LCB4UmFkaXVzLCB5UmFkaXVzLCBzaWRlcywgcm90YXRpb25BbmdsZSwgZGVncmVlcyApXG4gIHtcbiAgICB2YXIgcG9seWdvbiA9IHBvbHlnb25zWyBzaWRlcyBdO1xuICAgIGlmICggISBwb2x5Z29uICkge1xuICAgICAgcG9seWdvbiA9IHBvbHlnb25zWyBzaWRlcyBdID0gY3JlYXRlUG9seWdvbiggc2lkZXMgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICB9XG4gICAgaWYgKCBkZWdyZWVzICkge1xuICAgICAgcm90YXRpb25BbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICAgIH1cbiAgICB0aGlzLm1hdHJpeC5zYXZlKCk7XG4gICAgdGhpcy5tYXRyaXgudHJhbnNsYXRlKCB4LCB5ICk7XG4gICAgdGhpcy5tYXRyaXgucm90YXRlKCByb3RhdGlvbkFuZ2xlICk7XG4gICAgdGhpcy5kcmF3QXJyYXlzKCBwb2x5Z29uLCBwb2x5Z29uLmxlbmd0aCAqIDAuNSwgbnVsbCwgeFJhZGl1cywgeVJhZGl1cyApO1xuICAgIHRoaXMubWF0cml4LnJlc3RvcmUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQv9C+0LvQuNCz0L7QvS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvbHlnb25cbiAgICogQHBhcmFtICB7bnVtYmVyfSB4ICAgICAgICAgICAgICAgWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IHkgICAgICAgICAgICAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gciAgICAgICAgICAgICAgINCg0LDQtNC40YPRgSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IHNpZGVzICAgICAgICAgICDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdGC0L7RgNC+0L0g0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSBbcm90YXRpb25BbmdsZV0g0KPQs9C+0Lsg0L/QvtCy0L7RgNC+0YLQsCDQv9C+0LvQuNCz0L7QvdCwXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjRh9GC0L7QsdGLINC90LUg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMIHtAbGluayB2Ni5UcmFuc2Zvcm0jcm90YXRlfSkuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBoZXhhZ29uIGF0IFsgNCwgMiBdIHdpdGggcmFkaXVzIDI1LlxuICAgKiByZW5kZXJlci5wb2x5Z29uKCA0LCAyLCAyNSwgNiApO1xuICAgKi9cbiAgcG9seWdvbjogZnVuY3Rpb24gcG9seWdvbiAoIHgsIHksIHIsIHNpZGVzLCByb3RhdGlvbkFuZ2xlIClcbiAge1xuICAgIGlmICggc2lkZXMgJSAxICkge1xuICAgICAgc2lkZXMgPSBNYXRoLmZsb29yKCBzaWRlcyAqIDEwMCApICogMC4wMTtcbiAgICB9XG4gICAgaWYgKCB0eXBlb2Ygcm90YXRpb25BbmdsZSA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICB0aGlzLmRyYXdQb2x5Z29uKCB4LCB5LCByLCByLCBzaWRlcywgLU1hdGguUEkgKiAwLjUgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3UG9seWdvbiggeCwgeSwgciwgciwgc2lkZXMsIHJvdGF0aW9uQW5nbGUsIG9wdGlvbnMuZGVncmVlcyApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjaW1hZ2VcbiAgICogQHBhcmFtIHt2Ni5BYnN0cmFjdEltYWdlfSBpbWFnZSDQmtCw0YDRgtC40L3QutCwINC60L7RgtC+0YDRg9GOINC90LDQtNC+INC+0YLRgNC40YHQvtCy0LDRgtGMLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHggICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICB5ICAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgW3ddICAg0KjQuNGA0LjQvdCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgW2hdICAg0JLRi9GB0L7RgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gQ3JlYXRlIGltYWdlLlxuICAgKiB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnaW1hZ2UnICkgKTtcbiAgICogLy8gRHJhdyBpbWFnZSBhdCBbIDQsIDIgXS5cbiAgICogcmVuZGVyZXIuaW1hZ2UoIGltYWdlLCA0LCAyICk7XG4gICAqL1xuICBpbWFnZTogZnVuY3Rpb24gaW1hZ2UgKCBpbWFnZSwgeCwgeSwgdywgaCApXG4gIHtcbiAgICBpZiAoIGltYWdlLmdldCgpLmxvYWRlZCApIHtcbiAgICAgIGlmICggdHlwZW9mIHcgPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICB3ID0gaW1hZ2UuZHc7XG4gICAgICB9XG4gICAgICBpZiAoIHR5cGVvZiBoID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgaCA9IGltYWdlLmRoO1xuICAgICAgfVxuICAgICAgeCA9IHByb2Nlc3NSZWN0QWxpZ25YKCB0aGlzLCB4LCB3ICk7XG4gICAgICB4ID0gcHJvY2Vzc1JlY3RBbGlnblkoIHRoaXMsIHksIGggKTtcbiAgICAgIHRoaXMuZHJhd0ltYWdlKCBpbWFnZSwgeCwgeSwgdywgaCApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LTQu9GPINC90LDRh9Cw0LvQsCDQvtGC0YDQuNGB0L7QstC60Lgg0YTQuNCz0YPRgNGLLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICAgKiBAcGFyYW0ge29iamVjdH0gICBbb3B0aW9uc10gICAgICDQn9Cw0YDQsNC80LXRgtGA0Ysg0YTQuNCz0YPRgNGLLlxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSBbb3B0aW9ucy50eXBlXSDQotC40L8g0YTQuNCz0YPRgNGLOiBQT0lOVFMsIExJTkVTLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEJlZ2luIGRyYXdpbmcgUE9JTlRTIHNoYXBlLlxuICAgKiByZW5kZXJlci5iZWdpblNoYXBlKCB7IHR5cGU6IHY2LmNvbnN0YW50cy5nZXQoICdQT0lOVFMnICkgfSApO1xuICAgKiAvLyBCZWdpbiBkcmF3aW5nIHNoYXBlIHdpdGhvdXQgdHlwZSAobXVzdCBiZSBwYXNzZWQgbGF0ZXIgaW4gYGVuZFNoYXBlYCkuXG4gICAqIHJlbmRlcmVyLmJlZ2luU2hhcGUoKTtcbiAgICovXG4gIGJlZ2luU2hhcGU6IGZ1bmN0aW9uIGJlZ2luU2hhcGUgKCBvcHRpb25zIClcbiAge1xuICAgIGlmICggISBvcHRpb25zICkge1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICB0aGlzLl92ZXJ0aWNlcy5sZW5ndGggPSAwO1xuICAgIGlmICggdHlwZW9mIG9wdGlvbnMudHlwZSA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICB0aGlzLl9zaGFwZVR5cGUgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zaGFwZVR5cGUgPSBvcHRpb25zLnR5cGU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0LLQtdGA0YjQuNC90YMg0LIg0LrQvtC+0YDQtNC40L3QsNGC0LDRhSDQuNC3INGB0L7QvtGC0LLQtdGC0YHQstGD0Y7RidC40YUg0L/QsNGA0LDQvNC10YLRgNC+0LIuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciN2ZXJ0ZXhcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQvdC+0LLQvtC5INCy0LXRgNGI0LjQvdGLLlxuICAgKiBAcGFyYW0ge251bWJlcn0geSBZINC60L7QvtGA0LTQuNC90LDRgtCwINC90L7QstC+0Lkg0LLQtdGA0YjQuNC90YsuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgcmVjdGFuZ2xlIHdpdGggdmVydGljZXMuXG4gICAqIHJlbmRlcmVyLnZlcnRleCggMCwgMCApO1xuICAgKiByZW5kZXJlci52ZXJ0ZXgoIDEsIDAgKTtcbiAgICogcmVuZGVyZXIudmVydGV4KCAxLCAxICk7XG4gICAqIHJlbmRlcmVyLnZlcnRleCggMCwgMSApO1xuICAgKi9cbiAgdmVydGV4OiBmdW5jdGlvbiB2ZXJ0ZXggKCB4LCB5IClcbiAge1xuICAgIHRoaXMuX3ZlcnRpY2VzLnB1c2goIE1hdGguZmxvb3IoIHggKSwgTWF0aC5mbG9vciggeSApICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0YTQuNCz0YPRgNGDINC40Lcg0LLQtdGA0YjQuNC9LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICogQHBhcmFtIHtvYmplY3R9ICAgW29wdGlvbnNdICAgICAgINCf0LDRgNCw0LzQtdGC0YDRiyDRhNC40LPRg9GA0YsuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gIFtvcHRpb25zLmNsb3NlXSDQodC+0LXQtNC40L3QuNGC0Ywg0L/QvtGB0LvQtdC00L3RjtGOINCy0LXRgNGI0LjQvdGDINGBINC/0LXRgNCy0L7QuSAo0LfQsNC60YDRi9GC0Ywg0YTQuNCz0YPRgNGDKS5cbiAgICogQHBhcmFtIHtjb25zdGFudH0gW29wdGlvbnMudHlwZV0gINCi0LjQvyDRhNC40LPRg9GA0YsgKNC90LXRgdC+0LLQvNC10YHRgtC40LzQviDRgSBgb3B0aW9ucy5kcmF3YCkuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLmRyYXddICDQndC10YHRgtCw0L3QtNCw0YDRgtC90LDRjyDRhNGD0L3QutGG0LjRjyDQtNC70Y8g0L7RgtGA0LjRgdC+0LLQutC4INCy0YHQtdGFINCy0LXRgNGI0LjQvSAo0L3QtdGB0L7QstC80LXRgdGC0LjQvNC+INGBIGBvcHRpb25zLnR5cGVgKS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBDbG9zZSBhbmQgZHJhdyBzaGFwZS5cbiAgICogcmVuZGVyZXIuZW5kU2hhcGUoIHsgY2xvc2U6IHRydWUgfSApO1xuICAgKiAvLyBEcmF3IHdpdGggY3VzdG9tIGZ1bmN0aW9uLlxuICAgKiByZW5kZXJlci5lbmRTaGFwZSgge1xuICAgKiAgIGRyYXc6IGZ1bmN0aW9uIGRyYXcgKCB2ZXJ0aWNlcyApXG4gICAqICAge1xuICAgKiAgICAgcmVuZGVyZXIuZHJhd0FycmF5cyggdmVydGljZXMsIHZlcnRpY2VzLmxlbmd0aCAvIDIgKTtcbiAgICogICB9XG4gICAqIH0gKTtcbiAgICovXG4gIGVuZFNoYXBlOiBmdW5jdGlvbiBlbmRTaGFwZSAoKVxuICB7XG4gICAgdGhyb3cgRXJyb3IoICdOb3QgaW1wbGVtZW50ZWQnICk7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjc2F2ZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuVHJhbnNmb3JtI3NhdmVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2F2ZSB0cmFuc2Zvcm0uXG4gICAqIHJlbmRlcmVyLnNhdmUoKTtcbiAgICovXG4gIHNhdmU6IGZ1bmN0aW9uIHNhdmUgKClcbiAge1xuICAgIHRoaXMubWF0cml4LnNhdmUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZXN0b3JlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jcmVzdG9yZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXN0b3JlIHRyYW5zZm9ybS5cbiAgICogcmVuZGVyZXIucmVzdG9yZSgpO1xuICAgKi9cbiAgcmVzdG9yZTogZnVuY3Rpb24gcmVzdG9yZSAoKVxuICB7XG4gICAgdGhpcy5tYXRyaXgucmVzdG9yZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3NldFRyYW5zZm9ybVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuVHJhbnNmb3JtI3NldFRyYW5zZm9ybVxuICAgKiBAc2VlIHY2LkNhbWVyYVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTZXQgaWRlbnRpdHkgdHJhbnNmb3JtLlxuICAgKiByZW5kZXJlci5zZXRUcmFuc2Zvcm0oIDEsIDAsIDAsIDEsIDAsIDAgKTtcbiAgICogLy8gU2V0IHRyYW5zZm9ybSBmcm9tIGB2Ni5DYW1lcmFgLlxuICAgKiByZW5kZXJlci5zZXRUcmFuc2Zvcm0oIGNhbWVyYSApO1xuICAgKi9cbiAgc2V0VHJhbnNmb3JtOiBmdW5jdGlvbiBzZXRUcmFuc2Zvcm0gKCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG4gIHtcbiAgICB2YXIgcG9zaXRpb24sIHpvb207XG4gICAgaWYgKCB0eXBlb2YgbTExID09PSAnb2JqZWN0JyAmJiBtMTEgIT09IG51bGwgKSB7XG4gICAgICBwb3NpdGlvbiA9IG0xMS5wb3NpdGlvbjtcbiAgICAgIHpvb20gPSBtMTEuem9vbTtcbiAgICAgIHRoaXMubWF0cml4LnNldFRyYW5zZm9ybSggem9vbSwgMCwgMCwgem9vbSwgcG9zaXRpb25bIDAgXSAqIHpvb20sIHBvc2l0aW9uWyAxIF0gKiB6b29tICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWF0cml4LnNldFRyYW5zZm9ybSggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjdHJhbnNsYXRlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jdHJhbnNsYXRlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFRyYW5zbGF0ZSB0cmFuc2Zvcm0gdG8gWyA0LCAyIF0uXG4gICAqIHJlbmRlcmVyLnRyYW5zbGF0ZSggNCwgMiApO1xuICAgKi9cbiAgdHJhbnNsYXRlOiBmdW5jdGlvbiB0cmFuc2xhdGUgKCB4LCB5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnRyYW5zbGF0ZSggeCwgeSApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JvdGF0ZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuVHJhbnNmb3JtI3JvdGF0ZVxuICAgKiBAdG9kbyByZW5kZXJlci5zZXR0aW5ncy5kZWdyZWVzXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJvdGF0ZSB0cmFuc2Zvcm0gb24gNDUgZGVncmVlcy5cbiAgICogcmVuZGVyZXIucm90YXRlKCA0NSAqIE1hdGguUEkgLyAxODAgKTtcbiAgICovXG4gIHJvdGF0ZTogZnVuY3Rpb24gcm90YXRlICggYW5nbGUgKVxuICB7XG4gICAgdGhpcy5tYXRyaXgucm90YXRlKCBhbmdsZSApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3NjYWxlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jc2NhbGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2NhbGUgdHJhbnNmb3JtIHR3aWNlLlxuICAgKiByZW5kZXJlci5zY2FsZSggMiwgMiApO1xuICAgKi9cbiAgc2NhbGU6IGZ1bmN0aW9uIHNjYWxlICggeCwgeSApXG4gIHtcbiAgICB0aGlzLm1hdHJpeC5zY2FsZSggeCwgeSApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3RyYW5zZm9ybVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuVHJhbnNmb3JtI3RyYW5zZm9ybVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBBcHBseSB0cmFuc2xhdGVkIHRvIFsgNCwgMiBdIFwidHJhbnNmb3JtYXRpb24gbWF0cml4XCIuXG4gICAqIHJlbmRlcmVyLnRyYW5zZm9ybSggMSwgMCwgMCwgMSwgNCwgMiApO1xuICAgKi9cbiAgdHJhbnNmb3JtOiBmdW5jdGlvbiB0cmFuc2Zvcm0gKCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApXG4gIHtcbiAgICB0aGlzLm1hdHJpeC50cmFuc2Zvcm0oIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBsaW5lV2lkdGggKNGI0LjRgNC40L3RgyDQutC+0L3RgtGD0YDQsCkuXG4gICAqIEBtZXRob2QgbGluZVdpZHRoXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXIg0J3QvtCy0YvQuSBsaW5lV2lkdGguXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IGBsaW5lV2lkdGhgIHRvIDEwcHguXG4gICAqIHJlbmRlcmVyLmxpbmVXaWR0aCggMTAgKTtcbiAgICovXG4gIGxpbmVXaWR0aDogZnVuY3Rpb24gbGluZVdpZHRoICggbnVtYmVyIClcbiAge1xuICAgIHRoaXMuX2xpbmVXaWR0aCA9IG51bWJlcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGBiYWNrZ3JvdW5kUG9zaXRpb25YYCDQvdCw0YHRgtGA0L7QudC60YMg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNiYWNrZ3JvdW5kUG9zaXRpb25YXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgIHZhbHVlXG4gICAqIEBwYXJhbSB7Y29uc3RhbnR9IHR5cGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTZXQgXCJiYWNrZ3JvdW5kUG9zaXRpb25YXCIgZHJhd2luZyBzZXR0aW5nIHRvIENFTlRFUiAoZGVmYXVsdDogTEVGVCkuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblgoIGNvbnN0YW50cy5nZXQoICdDRU5URVInICksIGNvbnN0YW50cy5nZXQoICdDT05TVEFOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25YKCAwLjUsIGNvbnN0YW50cy5nZXQoICdQRVJDRU5UJyApICk7XG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblgoIHJlbmRlcmVyLncgLyAyICk7XG4gICAqL1xuICBiYWNrZ3JvdW5kUG9zaXRpb25YOiBmdW5jdGlvbiBiYWNrZ3JvdW5kUG9zaXRpb25YICggdmFsdWUsIHR5cGUgKSB7IGlmICggdHlwZW9mIHR5cGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoICdWQUxVRScgKSApIHsgaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKSB7IHR5cGUgPSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKTsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJMRUZUXCIgKSApIHsgdmFsdWUgPSAwOyB9IGVsc2UgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJDRU5URVJcIiApICkgeyB2YWx1ZSA9IDAuNTsgfSBlbHNlIGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiUklHSFRcIiApICkgeyB2YWx1ZSA9IDE7IH0gZWxzZSB7IHRocm93IEVycm9yKCAnR290IHVua25vd24gdmFsdWUuIFRoZSBrbm93biBhcmU6ICcgKyBcIkxFRlRcIiArICcsICcgKyBcIkNFTlRFUlwiICsgJywgJyArIFwiUklHSFRcIiApOyB9IH0gaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApIHsgdmFsdWUgKj0gdGhpcy53OyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGB2YWx1ZWAgdHlwZS4gVGhlIGtub3duIGFyZTogVkFMVUUsIFBFUkNFTlQsIENPTlNUQU5UJyApOyB9IH0gdGhpcy5fYmFja2dyb3VuZFBvc2l0aW9uWCA9IHZhbHVlOyByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgYmFja2dyb3VuZFBvc2l0aW9uWWAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZFBvc2l0aW9uWVxuICAgKiBAcGFyYW0ge251bWJlcn0gICB2YWx1ZVxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB0eXBlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IFwiYmFja2dyb3VuZFBvc2l0aW9uWVwiIGRyYXdpbmcgc2V0dGluZyB0byBNSURETEUgKGRlZmF1bHQ6IFRPUCkuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblkoIGNvbnN0YW50cy5nZXQoICdNSURETEUnICksIGNvbnN0YW50cy5nZXQoICdDT05TVEFOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25ZKCAwLjUsIGNvbnN0YW50cy5nZXQoICdQRVJDRU5UJyApICk7XG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblkoIHJlbmRlcmVyLmggLyAyICk7XG4gICAqL1xuICBiYWNrZ3JvdW5kUG9zaXRpb25ZOiBmdW5jdGlvbiBiYWNrZ3JvdW5kUG9zaXRpb25ZICggdmFsdWUsIHR5cGUgKSB7IGlmICggdHlwZW9mIHR5cGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoICdWQUxVRScgKSApIHsgaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKSB7IHR5cGUgPSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKTsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJUT1BcIiApICkgeyB2YWx1ZSA9IDA7IH0gZWxzZSBpZiAoIHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCBcIk1JRERMRVwiICkgKSB7IHZhbHVlID0gMC41OyB9IGVsc2UgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJCT1RUT01cIiApICkgeyB2YWx1ZSA9IDE7IH0gZWxzZSB7IHRocm93IEVycm9yKCAnR290IHVua25vd24gdmFsdWUuIFRoZSBrbm93biBhcmU6ICcgKyBcIlRPUFwiICsgJywgJyArIFwiTUlERExFXCIgKyAnLCAnICsgXCJCT1RUT01cIiApOyB9IH0gaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApIHsgdmFsdWUgKj0gdGhpcy5oOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGB2YWx1ZWAgdHlwZS4gVGhlIGtub3duIGFyZTogVkFMVUUsIFBFUkNFTlQsIENPTlNUQU5UJyApOyB9IH0gdGhpcy5fYmFja2dyb3VuZFBvc2l0aW9uWSA9IHZhbHVlOyByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgcmVjdEFsaWduWGAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdEFsaWduWFxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB2YWx1ZSBgTEVGVGAsIGBDRU5URVJgLCBgUklHSFRgLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBcInJlY3RBbGlnblhcIiBkcmF3aW5nIHNldHRpbmcgdG8gQ0VOVEVSIChkZWZhdWx0OiBMRUZUKS5cbiAgICogcmVuZGVyZXIucmVjdEFsaWduWCggY29uc3RhbnRzLmdldCggJ0NFTlRFUicgKSApO1xuICAgKi9cbiAgcmVjdEFsaWduWDogZnVuY3Rpb24gcmVjdEFsaWduWCAoIHZhbHVlICkgeyBpZiAoIHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCAnTEVGVCcgKSB8fCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ0NFTlRFUicgKSB8fCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ1JJR0hUJyApICkgeyB0aGlzLl9yZWN0QWxpZ25YID0gdmFsdWU7IH0gZWxzZSB7IHRocm93IEVycm9yKCAnR290IHVua25vd24gYHJlY3RBbGlnbmAgY29uc3RhbnQuIFRoZSBrbm93biBhcmU6ICcgKyBcIkxFRlRcIiArICcsICcgKyBcIkNFTlRFUlwiICsgJywgJyArIFwiUklHSFRcIiApOyB9IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGByZWN0QWxpZ25ZYCDQvdCw0YHRgtGA0L7QudC60YMg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZWN0QWxpZ25ZXG4gICAqIEBwYXJhbSB7Y29uc3RhbnR9IHZhbHVlIGBUT1BgLCBgTUlERExFYCwgYEJPVFRPTWAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IFwicmVjdEFsaWduWVwiIGRyYXdpbmcgc2V0dGluZyB0byBNSURETEUgKGRlZmF1bHQ6IFRPUCkuXG4gICAqIHJlbmRlcmVyLnJlY3RBbGlnblkoIGNvbnN0YW50cy5nZXQoICdNSURETEUnICkgKTtcbiAgICovXG4gIHJlY3RBbGlnblk6IGZ1bmN0aW9uIHJlY3RBbGlnblkgKCB2YWx1ZSApIHsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ0xFRlQnICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdDRU5URVInICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdSSUdIVCcgKSApIHsgdGhpcy5fcmVjdEFsaWduWSA9IHZhbHVlOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGByZWN0QWxpZ25gIGNvbnN0YW50LiBUaGUga25vd24gYXJlOiAnICsgXCJUT1BcIiArICcsICcgKyBcIk1JRERMRVwiICsgJywgJyArIFwiQk9UVE9NXCIgKTsgfSByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiDRhtCy0LXRgiBgc3Ryb2tlYCDQv9GA0Lgg0YDQuNGB0L7QstCw0L3QuNC4INGH0LXRgNC10Lcge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdH0g0Lgg0YIu0L8uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNzdHJva2VcbiAgICogQHBhcmFtIHtudW1iZXJ8Ym9vbGVhbnxUQ29sb3J9IFtyXSDQldGB0LvQuCDRjdGC0L4gYGJvb2xlYW5gLCDRgtC+INGN0YLQviDQstC60LvRjtGH0LjRgiDQuNC70Lgg0LLRi9C60LvRjtGH0LjRgiBgc3Ryb2tlYFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjQutCw0Log0YfQtdGA0LXQtyB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlciNub1N0cm9rZX0pLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2ddXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYl1cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFthXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERpc2FibGUgYW5kIHRoZW4gZW5hYmxlIGBzdHJva2VgLlxuICAgKiByZW5kZXJlci5zdHJva2UoIGZhbHNlICkuc3Ryb2tlKCB0cnVlICk7XG4gICAqIC8vIFNldCBgc3Ryb2tlYCB0byBcImxpZ2h0c2t5Ymx1ZVwiLlxuICAgKiByZW5kZXJlci5zdHJva2UoICdsaWdodHNreWJsdWUnICk7XG4gICAqIC8vIFNldCBgc3Ryb2tlYCBmcm9tIGB2Ni5SR0JBYC5cbiAgICogcmVuZGVyZXIuc3Ryb2tlKCBuZXcgUkdCQSggMjU1LCAwLCAwICkucGVyY2VpdmVkQnJpZ2h0bmVzcygpICk7XG4gICAqL1xuICBzdHJva2U6IGZ1bmN0aW9uIHN0cm9rZSAoIHIsIGcsIGIsIGEgKSB7IGlmICggdHlwZW9mIHIgPT09ICd1bmRlZmluZWQnICkgeyB0aGlzLl9zdHJva2UoKTsgfSBlbHNlIGlmICggdHlwZW9mIHIgPT09ICdib29sZWFuJyApIHsgdGhpcy5fZG9TdHJva2UgPSByOyB9IGVsc2UgeyBpZiAoIHR5cGVvZiByID09PSAnc3RyaW5nJyB8fCB0aGlzLl9zdHJva2VDb2xvci50eXBlICE9PSB0aGlzLnNldHRpbmdzLmNvbG9yLnR5cGUgKSB7IHRoaXMuX3N0cm9rZUNvbG9yID0gbmV3IHRoaXMuc2V0dGluZ3MuY29sb3IoIHIsIGcsIGIsIGEgKTsgfSBlbHNlIHsgdGhpcy5fc3Ryb2tlQ29sb3Iuc2V0KCByLCBnLCBiLCBhICk7IH0gdGhpcy5fZG9TdHJva2UgPSB0cnVlOyB9IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINGG0LLQtdGCIGBmaWxsYCDQv9GA0Lgg0YDQuNGB0L7QstCw0L3QuNC4INGH0LXRgNC10Lcge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdH0g0Lgg0YIu0L8uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNmaWxsXG4gICAqIEBwYXJhbSB7bnVtYmVyfGJvb2xlYW58VENvbG9yfSBbcl0g0JXRgdC70Lgg0Y3RgtC+IGBib29sZWFuYCwg0YLQviDRjdGC0L4g0LLQutC70Y7Rh9C40YIg0LjQu9C4INCy0YvQutC70Y7Rh9C40YIgYGZpbGxgXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKNC60LDQuiDRh9C10YDQtdC3IHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI25vRmlsbH0pLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2ddXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYl1cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFthXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERpc2FibGUgYW5kIHRoZW4gZW5hYmxlIGBmaWxsYC5cbiAgICogcmVuZGVyZXIuZmlsbCggZmFsc2UgKS5maWxsKCB0cnVlICk7XG4gICAqIC8vIFNldCBgZmlsbGAgdG8gXCJsaWdodHBpbmtcIi5cbiAgICogcmVuZGVyZXIuZmlsbCggJ2xpZ2h0cGluaycgKTtcbiAgICogLy8gU2V0IGBmaWxsYCBmcm9tIGB2Ni5SR0JBYC5cbiAgICogcmVuZGVyZXIuZmlsbCggbmV3IFJHQkEoIDI1NSwgMCwgMCApLmJyaWdodG5lc3MoKSApO1xuICAgKi9cbiAgZmlsbDogZnVuY3Rpb24gZmlsbCAoIHIsIGcsIGIsIGEgKSB7IGlmICggdHlwZW9mIHIgPT09ICd1bmRlZmluZWQnICkgeyB0aGlzLl9maWxsKCk7IH0gZWxzZSBpZiAoIHR5cGVvZiByID09PSAnYm9vbGVhbicgKSB7IHRoaXMuX2RvRmlsbCA9IHI7IH0gZWxzZSB7IGlmICggdHlwZW9mIHIgPT09ICdzdHJpbmcnIHx8IHRoaXMuX2ZpbGxDb2xvci50eXBlICE9PSB0aGlzLnNldHRpbmdzLmNvbG9yLnR5cGUgKSB7IHRoaXMuX2ZpbGxDb2xvciA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7IH0gZWxzZSB7IHRoaXMuX2ZpbGxDb2xvci5zZXQoIHIsIGcsIGIsIGEgKTsgfSB0aGlzLl9kb0ZpbGwgPSB0cnVlOyB9IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCS0YvQutC70Y7Rh9Cw0LXRgiDRgNC40YHQvtCy0LDQvdC40LUg0LrQvtC90YLRg9GA0LAgKHN0cm9rZSkuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNub1N0cm9rZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERpc2FibGUgZHJhd2luZyBzdHJva2UuXG4gICAqIHJlbmRlcmVyLm5vU3Ryb2tlKCk7XG4gICAqL1xuICBub1N0cm9rZTogZnVuY3Rpb24gbm9TdHJva2UgKCkgeyB0aGlzLl9kb1N0cm9rZSA9IGZhbHNlOyByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQktGL0LrQu9GO0YfQsNC10YIg0LfQsNC/0L7Qu9C90LXQvdC40Y8g0YTQvtC90LAgKGZpbGwpLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjbm9GaWxsXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRGlzYWJsZSBmaWxsaW5nLlxuICAgKiByZW5kZXJlci5ub0ZpbGwoKTtcbiAgICovXG4gIG5vRmlsbDogZnVuY3Rpb24gbm9GaWxsICgpIHsgdGhpcy5fZG9GaWxsID0gZmFsc2U7IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCX0LDQv9C+0LvQvdGP0LXRgiDRhNC+0L0g0YDQtdC90LTQtdGA0LXRgNCwINGG0LLQtdGC0L7QvC5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRDb2xvclxuICAgKiBAcGFyYW0ge251bWJlcnxUQ29sb3J9IFtyXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtnXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtiXVxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFthXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEZpbGwgcmVuZGVyZXIgd2l0aCBcImxpZ2h0cGlua1wiIGNvbG9yLlxuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kQ29sb3IoICdsaWdodHBpbmsnICk7XG4gICAqL1xuICAvKipcbiAgICog0JfQsNC/0L7Qu9C90Y/QtdGCINGE0L7QvSDRgNC10L3QtNC10YDQtdGA0LAg0LrQsNGA0YLQuNC90LrQvtC5LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZEltYWdlXG4gICAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCwg0LrQvtGC0L7RgNCw0Y8g0LTQvtC70LbQvdCwINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0LTQu9GPINGE0L7QvdCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENyZWF0ZSBiYWNrZ3JvdW5kIGltYWdlLlxuICAgKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnYmFja2dyb3VuZC5qcGcnICk7XG4gICAqIC8vIEZpbGwgcmVuZGVyZXIgd2l0aCB0aGUgaW1hZ2UuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRJbWFnZSggSW1hZ2Uuc3RyZXRjaCggaW1hZ2UsIHJlbmRlcmVyLncsIHJlbmRlcmVyLmggKSApO1xuICAgKi9cbiAgLyoqXG4gICAqINCe0YfQuNGJ0LDQtdGCINC60L7QvdGC0LXQutGB0YIuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNjbGVhclxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENsZWFyIHJlbmRlcmVyJ3MgY29udGV4dC5cbiAgICogcmVuZGVyZXIuY2xlYXIoKTtcbiAgICovXG4gIC8qKlxuICAgKiDQntGC0YDQuNGB0L7QstGL0LLQsNC10YIg0L/QtdGA0LXQtNCw0L3QvdGL0LUg0LLQtdGA0YjQuNC90YsuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNkcmF3QXJyYXlzXG4gICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5fSB2ZXJ0cyDQktC10YDRiNC40L3Riywg0LrQvtGC0L7RgNGL0LUg0L3QsNC00L4g0L7RgtGA0LjRgdC+0LLQsNGC0YwuINCV0YHQu9C4INC90LUg0L/QtdGA0LXQtNCw0L3QviDQtNC70Y9cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtAbGluayB2Ni5SZW5kZXJlckdMfSwg0YLQviDQsdGD0LTRg9GCINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0LLQtdGA0YjQuNC90Ysg0LjQt1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0YHRgtCw0L3QtNCw0YDRgtC90L7Qs9C+INCx0YPRhNC10YDQsCAoe0BsaW5rIHY2LlJlbmRlcmVyR0wjYnVmZmVycy5kZWZhdWx0fSkuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICBjb3VudCDQmtC+0LvQuNGH0LXRgdGC0LLQviDQstC10YDRiNC40L0sINC90LDQv9GA0LjQvNC10YA6IDMg0LTQu9GPINGC0YDQtdGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBBIHRyaWFuZ2xlLlxuICAgKiB2YXIgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KCBbXG4gICAqICAgMCwgIDAsXG4gICAqICAgNTAsIDUwLFxuICAgKiAgIDAsICA1MFxuICAgKiBdICk7XG4gICAqXG4gICAqIC8vIERyYXcgdGhlIHRyaWFuZ2xlLlxuICAgKiByZW5kZXJlci5kcmF3QXJyYXlzKCB2ZXJ0aWNlcywgMyApO1xuICAgKi9cbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQutCw0YDRgtC40L3QutGDLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZHJhd0ltYWdlXG4gICAqIEBwYXJhbSB7djYuQWJzdHJhY3RJbWFnZX0gaW1hZ2Ug0JrQsNGA0YLQuNC90LrQsCDQutC+0YLQvtGA0YPRjiDQvdCw0LTQviDQvtGC0YDQuNGB0L7QstCw0YLRjC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICB4ICAgICBcIkRlc3RpbmF0aW9uIFhcIi4gWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHkgICAgIFwiRGVzdGluYXRpb24gWVwiLiBZINC60L7QvtGA0LTQuNC90LDRgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgdyAgICAgXCJEZXN0aW5hdGlvbiBXaWR0aFwiLiDQqNC40YDQuNC90LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICBoICAgICBcIkRlc3RpbmF0aW9uIEhlaWdodFwiLiDQktGL0YHQvtGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBDcmVhdGUgaW1hZ2UuXG4gICAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICczMDB4MjAwLnBuZycgKTtcbiAgICogLy8gRHJhdyBpbWFnZSBhdCBbIDAsIDAgXS5cbiAgICogcmVuZGVyZXIuZHJhd0ltYWdlKCBpbWFnZSwgMCwgMCwgNjAwLCA0MDAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LouXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZWN0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gdyDQqNC40YDQuNC90LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGgg0JLRi9GB0L7RgtCwINC/0YDRj9C80L7Rg9Cz0L7Qu9GM0L3QuNC60LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBzcXVhcmUgYXQgWyAyMCwgMjAgXSB3aXRoIHNpemUgODAuXG4gICAqIHJlbmRlcmVyLnJlY3QoIDIwLCAyMCwgODAsIDgwICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC60YDRg9CzLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYXJjXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrRgNGD0LPQsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQutGA0YPQs9CwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gciDQoNCw0LTQuNGD0YEg0LrRgNGD0LPQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGNpcmNsZSBhdCBbIDYwLCA2MCBdIHdpdGggcmFkaXVzIDQwLlxuICAgKiByZW5kZXJlci5hcmMoIDYwLCA2MCwgNDAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0LvQuNC90LjRji5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2xpbmVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHgxIFgg0L3QsNGH0LDQu9CwINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MSBZINC90LDRh9Cw0LvQsCDQu9C40L3QuNC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0geDIgWCDQutC+0L3RhtGLINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MiBZINC60L7QvdGG0Ysg0LvQuNC90LjQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGxpbmUgZnJvbSBbIDEwLCAxMCBdIHRvIFsgMjAsIDIwIF0uXG4gICAqIHJlbmRlcmVyLmxpbmUoIDEwLCAxMCwgMjAsIDIwICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINGC0L7Rh9C60YMuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwb2ludFxuICAgKiBAcGFyYW0ge251bWJlcn0geCBYINC60L7QvtGA0LTQuNC90LDRgtCwINGC0L7Rh9C60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5IFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0YLQvtGH0LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IHBvaW50IGF0IFsgNCwgMiBdLlxuICAgKiByZW5kZXJlci5wb2ludCggNCwgMiApO1xuICAgKi9cbiAgY29uc3RydWN0b3I6IEFic3RyYWN0UmVuZGVyZXJcbn07XG4vKipcbiAqIEluaXRpYWxpemUgcmVuZGVyZXIgb24gYFwic2VsZlwiYC5cbiAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlci5jcmVhdGVcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHNlbGYgICAgUmVuZGVyZXIgdGhhdCBzaG91bGQgYmUgaW5pdGlhbGl6ZWQuXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgICAgICBvcHRpb25zIHtAbGluayB2Ni5vcHRpb25zfVxuICogQHBhcmFtICB7Y29uc3RhbnR9ICAgICAgICAgICAgdHlwZSAgICBUeXBlIG9mIHJlbmRlcmVyOiBgMkRgINC40LvQuCBgR0xgLiBDYW5ub3QgYmUgYEFVVE9gIS5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICAgICAgICAgUmV0dXJucyBub3RoaW5nLlxuICogQGV4YW1wbGUgPGNhcHRpb24+Q3VzdG9tIFJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIEFic3RyYWN0UmVuZGVyZXIgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyJyApO1xuICogdmFyIHNldHRpbmdzICAgICAgICAgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9zZXR0aW5ncycgKTtcbiAqIHZhciBjb25zdGFudHMgICAgICAgID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29uc3RhbnRzJyApO1xuICpcbiAqIGZ1bmN0aW9uIEN1c3RvbVJlbmRlcmVyICggb3B0aW9ucyApXG4gKiB7XG4gKiAgIC8vIEluaXRpYWxpemUgQ3VzdG9tUmVuZGVyZXIuXG4gKiAgIEFic3RyYWN0UmVuZGVyZXIuY3JlYXRlKCB0aGlzLCBkZWZhdWx0cyggc2V0dGluZ3MsIG9wdGlvbnMgKSwgY29uc3RhbnRzLmdldCggJzJEJyApICk7XG4gKiB9XG4gKi9cbkFic3RyYWN0UmVuZGVyZXIuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlICggc2VsZiwgb3B0aW9ucywgdHlwZSApXG57XG4gIHZhciBjb250ZXh0O1xuICAvKipcbiAgICogYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINC00LvRjyDQvtGC0YDQuNGB0L7QstC60Lgg0L3QsCDRjdC60YDQsNC90LUuXG4gICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2NhbnZhc1xuICAgKi9cbiAgaWYgKCBvcHRpb25zLmNhbnZhcyApIHtcbiAgICBzZWxmLmNhbnZhcyA9IG9wdGlvbnMuY2FudmFzO1xuICB9IGVsc2Uge1xuICAgIHNlbGYuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcbiAgICBzZWxmLmNhbnZhcy5pbm5lckhUTUwgPSAnVW5hYmxlIHRvIHJ1biB0aGlzIGFwcGxpY2F0aW9uLic7XG4gIH1cbiAgaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnMkQnICkgKSB7XG4gICAgY29udGV4dCA9ICcyZCc7XG4gIH0gZWxzZSBpZiAoIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoICdHTCcgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHJlbmRlcmVyIHR5cGUuIFRoZSBrbm93biBhcmU6IDJEIGFuZCBHTCcgKTtcbiAgfSBlbHNlIGlmICggISAoIGNvbnRleHQgPSBnZXRXZWJHTCgpICkgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgZ2V0IFdlYkdMIGNvbnRleHQuIFRyeSB0byB1c2UgMkQgYXMgdGhlIHJlbmRlcmVyIHR5cGUgb3IgdjYuUmVuZGVyZXIyRCBpbnN0ZWFkIG9mIHY2LlJlbmRlcmVyR0wnICk7XG4gIH1cbiAgLyoqXG4gICAqINCa0L7QvdGC0LXQutGB0YIg0YXQvtC70YHRgtCwLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LkFic3RyYWN0UmVuZGVyZXIjY29udGV4dFxuICAgKi9cbiAgc2VsZi5jb250ZXh0ID0gc2VsZi5jYW52YXMuZ2V0Q29udGV4dCggY29udGV4dCwge1xuICAgIGFscGhhOiBvcHRpb25zLmFscGhhXG4gIH0gKTtcbiAgLyoqXG4gICAqINCd0LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQtdGA0LAuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuQWJzdHJhY3RSZW5kZXJlciNzZXR0aW5nc1xuICAgKi9cbiAgc2VsZi5zZXR0aW5ncyA9IG9wdGlvbnMuc2V0dGluZ3M7XG4gIC8qKlxuICAgKiDQotC40L8g0YDQtdC90LTQtdGA0LXRgNCwOiBHTCwgMkQuXG4gICAqIEBtZW1iZXIge2NvbnN0YW50fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3R5cGVcbiAgICovXG4gIHNlbGYudHlwZSA9IHR5cGU7XG4gIC8qKlxuICAgKiDQodGC0Y3QuiDRgdC+0YXRgNCw0L3QtdC90L3Ri9GFINC90LDRgdGC0YDQvtC10Log0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge0FycmF5LjxvYmplY3Q+fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI19zdGFja1xuICAgKi9cbiAgc2VsZi5fc3RhY2sgPSBbXTtcbiAgLyoqXG4gICAqINCf0L7Qt9C40YbQuNGPINC/0L7RgdC70LXQtNC90LjRhSDRgdC+0YXRgNCw0L3QtdC90L3Ri9GFINC90LDRgdGC0YDQvtC10Log0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfc3RhY2tJbmRleFxuICAgKi9cbiAgc2VsZi5fc3RhY2tJbmRleCA9IC0xO1xuICAvKipcbiAgICog0JLQtdGA0YjQuNC90Ysg0YTQuNCz0YPRgNGLLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48bnVtYmVyPn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfdmVydGljZXNcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICovXG4gIHNlbGYuX3ZlcnRpY2VzID0gW107XG4gIC8qKlxuICAgKiDQotC40L8g0YTQuNCz0YPRgNGLLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48bnVtYmVyPn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfc2hhcGVUeXBlXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlXG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciN2ZXJ0ZXhcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2VuZFNoYXBlXG4gICAqL1xuICBzZWxmLl9zaGFwZVR5cGUgPSBudWxsO1xuICBpZiAoIHR5cGVvZiBvcHRpb25zLmFwcGVuZFRvID09PSAndW5kZWZpbmVkJyApIHtcbiAgICBzZWxmLmFwcGVuZFRvKCBkb2N1bWVudC5ib2R5ICk7XG4gIH0gZWxzZSBpZiAoIG9wdGlvbnMuYXBwZW5kVG8gIT09IG51bGwgKSB7XG4gICAgc2VsZi5hcHBlbmRUbyggb3B0aW9ucy5hcHBlbmRUbyApO1xuICB9XG4gIGlmICggJ3cnIGluIG9wdGlvbnMgfHwgJ2gnIGluIG9wdGlvbnMgKSB7XG4gICAgc2VsZi5yZXNpemUoIG9wdGlvbnMudyB8fCAwLCBvcHRpb25zLmggfHwgMCApO1xuICB9IGVsc2UgaWYgKCBvcHRpb25zLmFwcGVuZFRvICE9PSBudWxsICkge1xuICAgIHNlbGYucmVzaXplVG8oIG9wdGlvbnMuYXBwZW5kVG8gfHwgZG9jdW1lbnQuYm9keSApO1xuICB9IGVsc2Uge1xuICAgIHNlbGYucmVzaXplKCA2MDAsIDQwMCApO1xuICB9XG4gIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3MoIHNlbGYsIHNlbGYgKTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IEFic3RyYWN0UmVuZGVyZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkZWZhdWx0cyAgICAgICAgICA9IHJlcXVpcmUoICdwZWFrby9kZWZhdWx0cycgKTtcblxudmFyIGNvbnN0YW50cyAgICAgICAgID0gcmVxdWlyZSggJy4uL2NvbnN0YW50cycgKTtcblxudmFyIHByb2Nlc3NSZWN0QWxpZ25YID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25YO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25ZID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25ZO1xuXG52YXIgQWJzdHJhY3RSZW5kZXJlciAgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFJlbmRlcmVyJyApO1xudmFyIHNldHRpbmdzICAgICAgICAgID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG5cbi8qKlxuICogMkQg0YDQtdC90LTQtdGA0LXRgC5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5SZW5kZXJlcjJEXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdFJlbmRlcmVyXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyB7QGxpbmsgdjYub3B0aW9uc31cbiAqIEBleGFtcGxlXG4gKiAvLyBSZXF1aXJlIFJlbmRlcmVyMkQuXG4gKiB2YXIgUmVuZGVyZXIyRCA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL1JlbmRlcmVyMkQnICk7XG4gKiAvLyBDcmVhdGUgYW4gUmVuZGVyZXIyRCBpc250YW5jZS5cbiAqIHZhciByZW5kZXJlciA9IG5ldyBSZW5kZXJlcjJEKCk7XG4gKi9cbmZ1bmN0aW9uIFJlbmRlcmVyMkQgKCBvcHRpb25zIClcbntcbiAgQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUoIHRoaXMsICggb3B0aW9ucyA9IGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApICksIGNvbnN0YW50cy5nZXQoICcyRCcgKSApO1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHY2LlJlbmRlcmVyMkQjbWF0cml4XG4gICAqIEBhbGlhcyB2Ni5SZW5kZXJlcjJEI2NvbnRleHRcbiAgICovXG4gIHRoaXMubWF0cml4ID0gdGhpcy5jb250ZXh0O1xufVxuXG5SZW5kZXJlcjJELnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlICk7XG5SZW5kZXJlcjJELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlbmRlcmVyMkQ7XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjYmFja2dyb3VuZENvbG9yXG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLmJhY2tncm91bmRDb2xvciA9IGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvciAoIHIsIGcsIGIsIGEgKVxue1xuICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzO1xuICB2YXIgY29udGV4dCAgPSB0aGlzLmNvbnRleHQ7XG5cbiAgY29udGV4dC5zYXZlKCk7XG4gIGNvbnRleHQuZmlsbFN0eWxlID0gbmV3IHNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICk7XG4gIGNvbnRleHQuc2V0VHJhbnNmb3JtKCBzZXR0aW5ncy5zY2FsZSwgMCwgMCwgc2V0dGluZ3Muc2NhbGUsIDAsIDAgKTtcbiAgY29udGV4dC5maWxsUmVjdCggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgY29udGV4dC5yZXN0b3JlKCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2JhY2tncm91bmRJbWFnZVxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5iYWNrZ3JvdW5kSW1hZ2UgPSBmdW5jdGlvbiBiYWNrZ3JvdW5kSW1hZ2UgKCBpbWFnZSApXG57XG4gIHZhciBfcmVjdEFsaWduWCA9IHRoaXMuX3JlY3RBbGlnblg7XG4gIHZhciBfcmVjdEFsaWduWSA9IHRoaXMuX3JlY3RBbGlnblk7XG5cbiAgdGhpcy5fcmVjdEFsaWduWCA9IGNvbnN0YW50cy5nZXQoICdDRU5URVInICk7XG4gIHRoaXMuX3JlY3RBbGlnblkgPSBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApO1xuXG4gIHRoaXMuaW1hZ2UoIGltYWdlLCB0aGlzLncgKiAwLjUsIHRoaXMuaCAqIDAuNSApO1xuXG4gIHRoaXMuX3JlY3RBbGlnblggPSBfcmVjdEFsaWduWDtcbiAgdGhpcy5fcmVjdEFsaWduWSA9IF9yZWN0QWxpZ25ZO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNjbGVhclxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuY29udGV4dC5jbGVhciggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2RyYXdBcnJheXNcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuZHJhd0FycmF5cyA9IGZ1bmN0aW9uIGRyYXdBcnJheXMgKCB2ZXJ0cywgY291bnQsIF9tb2RlLCBfc3gsIF9zeSApXG57XG4gIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICB2YXIgaTtcblxuICBpZiAoIGNvdW50IDwgMiApIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGlmICggdHlwZW9mIF9zeCA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgX3N4ID0gX3N5ID0gMTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgfVxuXG4gIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gIGNvbnRleHQubW92ZVRvKCB2ZXJ0c1sgMCBdICogX3N4LCB2ZXJ0c1sgMSBdICogX3N5ICk7XG5cbiAgZm9yICggaSA9IDIsIGNvdW50ICo9IDI7IGkgPCBjb3VudDsgaSArPSAyICkge1xuICAgIGNvbnRleHQubGluZVRvKCB2ZXJ0c1sgaSBdICogX3N4LCB2ZXJ0c1sgaSArIDEgXSAqIF9zeSApO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb0ZpbGwgKSB7XG4gICAgdGhpcy5fZmlsbCgpO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb1N0cm9rZSAmJiB0aGlzLl9saW5lV2lkdGggPiAwICkge1xuICAgIHRoaXMuX3N0cm9rZSgpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2RyYXdJbWFnZVxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5kcmF3SW1hZ2UgPSBmdW5jdGlvbiBkcmF3SW1hZ2UgKCBpbWFnZSwgeCwgeSwgdywgaCApXG57XG4gIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UoIGltYWdlLmdldCgpLmltYWdlLCBpbWFnZS5zeCwgaW1hZ2Uuc3ksIGltYWdlLnN3LCBpbWFnZS5zaCwgeCwgeSwgdywgaCApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjcmVjdFxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24gcmVjdCAoIHgsIHksIHcsIGggKVxue1xuICB4ID0gcHJvY2Vzc1JlY3RBbGlnblgoIHRoaXMsIHgsIHcgKTtcbiAgeSA9IHByb2Nlc3NSZWN0QWxpZ25ZKCB0aGlzLCB5LCBoICk7XG5cbiAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICB0aGlzLmNvbnRleHQucmVjdCggeCwgeSwgdywgaCApO1xuXG4gIGlmICggdGhpcy5fZG9GaWxsICkge1xuICAgIHRoaXMuX2ZpbGwoKTtcbiAgfVxuXG4gIGlmICggdGhpcy5fZG9TdHJva2UgJiYgdGhpcy5fbGluZVdpZHRoID4gMCApIHtcbiAgICB0aGlzLl9zdHJva2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNhcmNcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuYXJjID0gZnVuY3Rpb24gYXJjICggeCwgeSwgciApXG57XG4gIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgdGhpcy5jb250ZXh0LmFyYyggeCwgeSwgciwgMCwgTWF0aC5QSSAqIDIgKTtcblxuICBpZiAoIHRoaXMuX2RvRmlsbCApIHtcbiAgICB0aGlzLl9maWxsKCk7XG4gIH1cblxuICBpZiAoIHRoaXMuX2RvU3Ryb2tlICYmIHRoaXMuX2xpbmVXaWR0aCA+IDAgKSB7XG4gICAgdGhpcy5fc3Ryb2tlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjX2ZpbGxcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuX2ZpbGwgPSBmdW5jdGlvbiBfZmlsbCAoKVxue1xuICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5fZmlsbENvbG9yO1xuICB0aGlzLmNvbnRleHQuZmlsbCgpO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNfc3Ryb2tlXG4gKi9cblJlbmRlcmVyMkQucHJvdG90eXBlLl9zdHJva2UgPSBmdW5jdGlvbiAoKVxue1xuICB2YXIgY29udGV4dCA9IHRoaXMuY29udGV4dDtcblxuICBjb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5fc3Ryb2tlQ29sb3I7XG5cbiAgaWYgKCAoIGNvbnRleHQubGluZVdpZHRoID0gdGhpcy5fbGluZVdpZHRoICkgPD0gMSApIHtcbiAgICBjb250ZXh0LnN0cm9rZSgpO1xuICB9XG5cbiAgY29udGV4dC5zdHJva2UoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyZXIyRDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmF1bHRzICAgICAgICAgID0gcmVxdWlyZSggJ3BlYWtvL2RlZmF1bHRzJyApO1xuXG52YXIgU2hhZGVyUHJvZ3JhbSAgICAgPSByZXF1aXJlKCAnLi4vU2hhZGVyUHJvZ3JhbScgKTtcbnZhciBUcmFuc2Zvcm0gICAgICAgICA9IHJlcXVpcmUoICcuLi9UcmFuc2Zvcm0nICk7XG52YXIgY29uc3RhbnRzICAgICAgICAgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApO1xudmFyIHNoYWRlcnMgICAgICAgICAgID0gcmVxdWlyZSggJy4uL3NoYWRlcnMnICk7XG5cbnZhciBwcm9jZXNzUmVjdEFsaWduWCA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWDtcbnZhciBwcm9jZXNzUmVjdEFsaWduWSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWTtcblxudmFyIEFic3RyYWN0UmVuZGVyZXIgID0gcmVxdWlyZSggJy4vQWJzdHJhY3RSZW5kZXJlcicgKTtcbnZhciBzZXR0aW5ncyAgICAgICAgICA9IHJlcXVpcmUoICcuL3NldHRpbmdzJyApO1xuXG4vKipcbiAqINCc0LDRgdGB0LjQsiDQstC10YDRiNC40L0gKHZlcnRpY2VzKSDQutCy0LDQtNGA0LDRgtCwLlxuICogQHByaXZhdGVcbiAqIEBpbm5lclxuICogQHZhciB7RmxvYXQzMkFycmF5fSBzcXVhcmVcbiAqL1xudmFyIHNxdWFyZSA9ICggZnVuY3Rpb24gKClcbntcbiAgdmFyIHNxdWFyZSA9IFtcbiAgICAwLCAwLFxuICAgIDEsIDAsXG4gICAgMSwgMSxcbiAgICAwLCAxXG4gIF07XG5cbiAgaWYgKCB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSAnZnVuY3Rpb24nICkge1xuICAgIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KCBzcXVhcmUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICB9XG5cbiAgcmV0dXJuIHNxdWFyZTtcbn0gKSgpO1xuXG4vKipcbiAqIFdlYkdMINGA0LXQvdC00LXRgNC10YAuXG4gKiBAY29uc3RydWN0b3IgdjYuUmVuZGVyZXJHTFxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RSZW5kZXJlclxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMge0BsaW5rIHY2Lm9wdGlvbnN9XG4gKiBAZXhhbXBsZVxuICogLy8gUmVxdWlyZSBSZW5kZXJlckdMLlxuICogdmFyIFJlbmRlcmVyR0wgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9SZW5kZXJlckdMJyApO1xuICogLy8gQ3JlYXRlIGFuIFJlbmRlcmVyR0wgaXNudGFuY2UuXG4gKiB2YXIgcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXJHTCgpO1xuICovXG5mdW5jdGlvbiBSZW5kZXJlckdMICggb3B0aW9ucyApXG57XG4gIEFic3RyYWN0UmVuZGVyZXIuY3JlYXRlKCB0aGlzLCAoIG9wdGlvbnMgPSBkZWZhdWx0cyggc2V0dGluZ3MsIG9wdGlvbnMgKSApLCBjb25zdGFudHMuZ2V0KCAnR0wnICkgKTtcblxuICAvKipcbiAgICog0K3RgtCwIFwidHJhbnNmb3JtYXRpb24gbWF0cml4XCIg0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC00LvRjyB7QGxpbmsgdjYuUmVuZGVyZXJHTCNyb3RhdGV9INC4INGCLtC/LlxuICAgKiBAbWVtYmVyIHt2Ni5UcmFuc2Zvcm19IHY2LlJlbmRlcmVyR0wjbWF0cml4XG4gICAqL1xuICB0aGlzLm1hdHJpeCA9IG5ldyBUcmFuc2Zvcm0oKTtcblxuICAvKipcbiAgICog0JHRg9GE0LXRgNGLINC00LDQvdC90YvRhSAo0LLQtdGA0YjQuNC9KS5cbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5SZW5kZXJlckdMI2J1ZmZlcnNcbiAgICogQHByb3BlcnR5IHtXZWJHTEJ1ZmZlcn0gZGVmYXVsdCDQntGB0L3QvtCy0L3QvtC5INCx0YPRhNC10YAuXG4gICAqIEBwcm9wZXJ0eSB7V2ViR0xCdWZmZXJ9IHNxdWFyZSAg0JjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC00LvRjyDQvtGC0YDQuNGB0L7QstC60Lgg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsCDQsiB7QGxpbmsgdjYuUmVuZGVyZXJHTCNyZWN0fS5cbiAgICovXG4gIHRoaXMuYnVmZmVycyA9IHtcbiAgICBkZWZhdWx0OiB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKCksXG4gICAgc3F1YXJlOiAgdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlcigpXG4gIH07XG5cbiAgdGhpcy5jb250ZXh0LmJpbmRCdWZmZXIoIHRoaXMuY29udGV4dC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVycy5zcXVhcmUgKTtcbiAgdGhpcy5jb250ZXh0LmJ1ZmZlckRhdGEoIHRoaXMuY29udGV4dC5BUlJBWV9CVUZGRVIsIHNxdWFyZSwgdGhpcy5jb250ZXh0LlNUQVRJQ19EUkFXICk7XG5cbiAgLyoqXG4gICAqINCo0LXQudC00LXRgNGLIChXZWJHTCDQv9GA0L7Qs9GA0LDQvNC80YspLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LlJlbmRlcmVyR0wjcHJvZ3JhbXNcbiAgICogQHByb3BlcnR5IHt2Ni5TaGFkZXJQcm9ncmFtfSBkZWZhdWx0XG4gICAqL1xuICB0aGlzLnByb2dyYW1zID0ge1xuICAgIGRlZmF1bHQ6IG5ldyBTaGFkZXJQcm9ncmFtKCBzaGFkZXJzLmJhc2ljLCB0aGlzLmNvbnRleHQgKVxuICB9O1xuXG4gIHRoaXMuYmxlbmRpbmcoIG9wdGlvbnMuYmxlbmRpbmcgKTtcbn1cblxuUmVuZGVyZXJHTC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdFJlbmRlcmVyLnByb3RvdHlwZSApO1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBSZW5kZXJlckdMO1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI3Jlc2l6ZVxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiByZXNpemUgKCB3LCBoIClcbntcbiAgQWJzdHJhY3RSZW5kZXJlci5wcm90b3R5cGUucmVzaXplLmNhbGwoIHRoaXMsIHcsIGggKTtcbiAgdGhpcy5jb250ZXh0LnZpZXdwb3J0KCAwLCAwLCB0aGlzLncsIHRoaXMuaCApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2JsZW5kaW5nXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGJsZW5kaW5nXG4gKiBAY2hhaW5hYmxlXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmJsZW5kaW5nID0gZnVuY3Rpb24gYmxlbmRpbmcgKCBibGVuZGluZyApXG57XG4gIHZhciBnbCA9IHRoaXMuY29udGV4dDtcblxuICBpZiAoIGJsZW5kaW5nICkge1xuICAgIGdsLmVuYWJsZSggZ2wuQkxFTkQgKTtcbiAgICBnbC5kaXNhYmxlKCBnbC5ERVBUSF9URVNUICk7XG4gICAgZ2wuYmxlbmRGdW5jKCBnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEgKTtcbiAgICBnbC5ibGVuZEVxdWF0aW9uKCBnbC5GVU5DX0FERCApO1xuICB9IGVsc2Uge1xuICAgIGdsLmRpc2FibGUoIGdsLkJMRU5EICk7XG4gICAgZ2wuZW5hYmxlKCBnbC5ERVBUSF9URVNUICk7XG4gICAgZ2wuZGVwdGhGdW5jKCBnbC5MRVFVQUwgKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQntGH0LjRidCw0LXRgiDQutC+0L3RgtC10LrRgdGCLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNfY2xlYXJcbiAqIEBwYXJhbSAge251bWJlcn0gciDQndC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSBcInJlZCBjaGFubmVsXCIuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGcg0J3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3QvtC1INC30L3QsNGH0LXQvdC40LUgXCJncmVlbiBjaGFubmVsXCIuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGIg0J3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3QvtC1INC30L3QsNGH0LXQvdC40LUgXCJibHVlIGNoYW5uZWxcIi5cbiAqIEBwYXJhbSAge251bWJlcn0gYSDQndC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSDQv9GA0L7Qt9GA0LDRh9C90L7RgdGC0LggKGFscGhhKS5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiByZW5kZXJlci5fY2xlYXIoIDEsIDAsIDAsIDEgKTsgLy8gRmlsbCBjb250ZXh0IHdpdGggcmVkIGNvbG9yLlxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5fY2xlYXIgPSBmdW5jdGlvbiBfY2xlYXIgKCByLCBnLCBiLCBhIClcbntcbiAgdmFyIGdsID0gdGhpcy5jb250ZXh0O1xuICBnbC5jbGVhckNvbG9yKCByLCBnLCBiLCBhICk7XG4gIGdsLmNsZWFyKCBnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWJpdHdpc2Vcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjYmFja2dyb3VuZENvbG9yXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmJhY2tncm91bmRDb2xvciA9IGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvciAoIHIsIGcsIGIsIGEgKVxue1xuICB2YXIgcmdiYSA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICkucmdiYSgpO1xuICB0aGlzLl9jbGVhciggcmdiYVsgMCBdIC8gMjU1LCByZ2JhWyAxIF0gLyAyNTUsIHJnYmFbIDIgXSAvIDI1NSwgcmdiYVsgMyBdICk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNjbGVhclxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuX2NsZWFyKCAwLCAwLCAwLCAwICk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNkcmF3QXJyYXlzXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmRyYXdBcnJheXMgPSBmdW5jdGlvbiBkcmF3QXJyYXlzICggdmVydHMsIGNvdW50LCBtb2RlLCBfc3gsIF9zeSApXG57XG4gIHZhciBwcm9ncmFtID0gdGhpcy5wcm9ncmFtcy5kZWZhdWx0O1xuICB2YXIgZ2wgICAgICA9IHRoaXMuY29udGV4dDtcblxuICBpZiAoIGNvdW50IDwgMiApIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGlmICggdmVydHMgKSB7XG4gICAgaWYgKCB0eXBlb2YgbW9kZSA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICBtb2RlID0gZ2wuU1RBVElDX0RSQVc7XG4gICAgfVxuXG4gICAgZ2wuYmluZEJ1ZmZlciggZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlcnMuZGVmYXVsdCApO1xuICAgIGdsLmJ1ZmZlckRhdGEoIGdsLkFSUkFZX0JVRkZFUiwgdmVydHMsIG1vZGUgKTtcbiAgfVxuXG4gIGlmICggdHlwZW9mIF9zeCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgdGhpcy5tYXRyaXguc2NhbGUoIF9zeCwgX3N5ICk7XG4gIH1cblxuICBwcm9ncmFtXG4gICAgLnVzZSgpXG4gICAgLnNldFVuaWZvcm0oICd1dHJhbnNmb3JtJywgdGhpcy5tYXRyaXgubWF0cml4IClcbiAgICAuc2V0VW5pZm9ybSggJ3VyZXMnLCBbIHRoaXMudywgdGhpcy5oIF0gKVxuICAgIC5wb2ludGVyKCAnYXBvcycsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCApO1xuXG4gIHRoaXMuX2ZpbGwoIGNvdW50ICk7XG4gIHRoaXMuX3N0cm9rZSggY291bnQgKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cblJlbmRlcmVyR0wucHJvdG90eXBlLl9maWxsID0gZnVuY3Rpb24gX2ZpbGwgKCBjb3VudCApXG57XG4gIGlmICggdGhpcy5fZG9GaWxsICkge1xuICAgIHRoaXMucHJvZ3JhbXMuZGVmYXVsdC5zZXRVbmlmb3JtKCAndWNvbG9yJywgdGhpcy5fZmlsbENvbG9yLnJnYmEoKSApO1xuICAgIHRoaXMuY29udGV4dC5kcmF3QXJyYXlzKCB0aGlzLmNvbnRleHQuVFJJQU5HTEVfRkFOLCAwLCBjb3VudCApO1xuICB9XG59O1xuXG5SZW5kZXJlckdMLnByb3RvdHlwZS5fc3Ryb2tlID0gZnVuY3Rpb24gX3N0cm9rZSAoIGNvdW50IClcbntcbiAgaWYgKCB0aGlzLl9kb1N0cm9rZSAmJiB0aGlzLl9saW5lV2lkdGggPiAwICkge1xuICAgIHRoaXMucHJvZ3JhbXMuZGVmYXVsdC5zZXRVbmlmb3JtKCAndWNvbG9yJywgdGhpcy5fc3Ryb2tlQ29sb3IucmdiYSgpICk7XG4gICAgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCggdGhpcy5fbGluZVdpZHRoICk7XG4gICAgdGhpcy5jb250ZXh0LmRyYXdBcnJheXMoIHRoaXMuY29udGV4dC5MSU5FX0xPT1AsIDAsIGNvdW50ICk7XG4gIH1cbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjYXJjXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmFyYyA9IGZ1bmN0aW9uIGFyYyAoIHgsIHksIHIgKVxue1xuICByZXR1cm4gdGhpcy5kcmF3UG9seWdvbiggeCwgeSwgciwgciwgMjQsIDAgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjcmVjdFxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24gcmVjdCAoIHgsIHksIHcsIGggKVxue1xuICB4ID0gcHJvY2Vzc1JlY3RBbGlnblgoIHRoaXMsIHgsIHcgKTtcbiAgeSA9IHByb2Nlc3NSZWN0QWxpZ25ZKCB0aGlzLCB5LCBoICk7XG4gIHRoaXMubWF0cml4LnNhdmUoKTtcbiAgdGhpcy5tYXRyaXgudHJhbnNsYXRlKCB4LCB5ICk7XG4gIHRoaXMubWF0cml4LnNjYWxlKCB3LCBoICk7XG4gIHRoaXMuY29udGV4dC5iaW5kQnVmZmVyKCB0aGlzLmNvbnRleHQuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlcnMucmVjdCApO1xuICB0aGlzLmRyYXdBcnJheXMoIG51bGwsIDQgKTtcbiAgdGhpcy5tYXRyaXgucmVzdG9yZSgpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyZXJHTDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbnN0YW50cyAgICAgICA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICk7XG5cbnZhciByZXBvcnQgICAgICAgICAgPSByZXF1aXJlKCAnLi4vaW50ZXJuYWwvcmVwb3J0JyApO1xuXG52YXIgZ2V0UmVuZGVyZXJUeXBlID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvZ2V0X3JlbmRlcmVyX3R5cGUnICk7XG52YXIgZ2V0V2ViR0wgICAgICAgID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvZ2V0X3dlYmdsJyApO1xuXG52YXIgUmVuZGVyZXJHTCAgICAgID0gcmVxdWlyZSggJy4vUmVuZGVyZXJHTCcgKTtcbnZhciBSZW5kZXJlcjJEICAgICAgPSByZXF1aXJlKCAnLi9SZW5kZXJlcjJEJyApO1xudmFyIHR5cGUgICAgICAgICAgICA9IHJlcXVpcmUoICcuL3NldHRpbmdzJyApLnR5cGU7XG5cbi8qKlxuICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSDRgNC10L3QtNC10YDQtdGALiDQldGB0LvQuCDRgdC+0LfQtNCw0YLRjCBXZWJHTCDQutC+0L3RgtC10LrRgdGCINC90LUg0L/QvtC70YPRh9C40YLRgdGPLCDRgtC+INCx0YPQtNC10YIg0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvSAyRC5cbiAqIEBtZXRob2QgdjYuY3JlYXRlUmVuZGVyZXJcbiAqIEBwYXJhbSAge29iamVjdH0gICAgICAgICAgICAgIG9wdGlvbnMge0BsaW5rIHY2Lm9wdGlvbnN9LlxuICogQHJldHVybiB7djYuQWJzdHJhY3RSZW5kZXJlcn0gICAgICAgICDQndC+0LLRi9C5INGA0LXQvdC00LXRgNC10YAgKDJELCBHTCkuXG4gKiBAZXhhbXBsZVxuICogdmFyIGNyZWF0ZVJlbmRlcmVyID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXInICk7XG4gKiB2YXIgY29uc3RhbnRzICAgICAgPSByZXF1aXJlKCAndjYuanMvY29yZS9jb25zdGFudHMnICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyBXZWJHTCBvciAyRCByZW5kZXJlciBiYXNlZCBvbiBwbGF0Zm9ybSBhbmQgYnJvd3NlcjwvY2FwdGlvbj5cbiAqIHZhciByZW5kZXJlciA9IGNyZWF0ZVJlbmRlcmVyKCB7IHR5cGU6IGNvbnN0YW50cy5nZXQoICdBVVRPJyApIH0gKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIFdlYkdMIHJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIHJlbmRlcmVyID0gY3JlYXRlUmVuZGVyZXIoIHsgdHlwZTogY29uc3RhbnRzLmdldCggJ0dMJyApIH0gKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIDJEIHJlbmRlcmVyPC9jYXB0aW9uPlxuICogdmFyIHJlbmRlcmVyID0gY3JlYXRlUmVuZGVyZXIoIHsgdHlwZTogY29uc3RhbnRzLmdldCggJzJEJyApIH0gKTtcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUmVuZGVyZXIgKCBvcHRpb25zIClcbntcbiAgdmFyIHR5cGVfID0gKCBvcHRpb25zICYmIG9wdGlvbnMudHlwZSApIHx8IHR5cGU7XG5cbiAgaWYgKCB0eXBlXyA9PT0gY29uc3RhbnRzLmdldCggJ0FVVE8nICkgKSB7XG4gICAgdHlwZV8gPSBnZXRSZW5kZXJlclR5cGUoKTtcbiAgfVxuXG4gIGlmICggdHlwZV8gPT09IGNvbnN0YW50cy5nZXQoICdHTCcgKSApIHtcbiAgICBpZiAoIGdldFdlYkdMKCkgKSB7XG4gICAgICByZXR1cm4gbmV3IFJlbmRlcmVyR0woIG9wdGlvbnMgKTtcbiAgICB9XG5cbiAgICByZXBvcnQoICdDYW5ub3QgY3JlYXRlIFdlYkdMIGNvbnRleHQuIEZhbGxpbmcgYmFjayB0byAyRC4nICk7XG4gIH1cblxuICBpZiAoIHR5cGVfID09PSBjb25zdGFudHMuZ2V0KCAnMkQnICkgfHwgdHlwZV8gPT09IGNvbnN0YW50cy5nZXQoICdHTCcgKSApIHtcbiAgICByZXR1cm4gbmV3IFJlbmRlcmVyMkQoIG9wdGlvbnMgKTtcbiAgfVxuXG4gIHRocm93IEVycm9yKCAnR290IHVua25vd24gcmVuZGVyZXIgdHlwZS4gVGhlIGtub3duIGFyZTogMkQgYW5kIEdMJyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVJlbmRlcmVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCa0L7Qv9C40YDRg9C10YIgZHJhd2luZyBzZXR0aW5ncyAoX2xpbmVXaWR0aCwgX3JlY3RBbGlnblgsINC4INGCLtC0Likg0LjQtyBgc291cmNlYCDQsiBgdGFyZ2V0YC5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNvcHlEcmF3aW5nU2V0dGluZ3NcbiAqIEBwYXJhbSAge29iamVjdH0gIHRhcmdldCDQnNC+0LbQtdGCINCx0YvRgtGMIGBBYnN0cmFjdFJlbmRlcmVyYCDQuNC70Lgg0L/RgNC+0YHRgtGL0Lwg0L7QsdGK0LXQutGC0L7QvCDRgSDRgdC+0YXRgNCw0L3QtdC90L3Ri9C80Lgg0YfQtdGA0LXQt1xuICogICAgICAgICAgICAgICAgICAgICAgICAgINGN0YLRgyDRhNGD0L3QutGG0LjRjiDQvdCw0YHRgtGA0L7QudC60LDQvNC4LlxuICogQHBhcmFtICB7b2JqZWN0fSAgc291cmNlINCe0L/QuNGB0LDQvdC40LUg0YLQviDQttC1LCDRh9GC0L4g0Lgg0LTQu9GPIGB0YXJnZXRgLlxuICogQHBhcmFtICB7Ym9vbGVhbn0gW2RlZXBdINCV0YHQu9C4IGB0cnVlYCwg0YLQviDQsdGD0LTQtdGCINGC0LDQutC20LUg0LrQvtC/0LjRgNC+0LLQsNGC0YwgX2ZpbGxDb2xvciwgX3N0cm9rZUNvbG9yINC4INGCLtC0LlxuICogQHJldHVybiB7b2JqZWN0fSAgICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCIGB0YXJnZXRgLlxuICovXG5mdW5jdGlvbiBjb3B5RHJhd2luZ1NldHRpbmdzICggdGFyZ2V0LCBzb3VyY2UsIGRlZXAgKVxue1xuICBpZiAoIGRlZXAgKSB7XG4gICAgdGFyZ2V0Ll9maWxsQ29sb3JbIDAgXSAgID0gc291cmNlLl9maWxsQ29sb3JbIDAgXTtcbiAgICB0YXJnZXQuX2ZpbGxDb2xvclsgMSBdICAgPSBzb3VyY2UuX2ZpbGxDb2xvclsgMSBdO1xuICAgIHRhcmdldC5fZmlsbENvbG9yWyAyIF0gICA9IHNvdXJjZS5fZmlsbENvbG9yWyAyIF07XG4gICAgdGFyZ2V0Ll9maWxsQ29sb3JbIDMgXSAgID0gc291cmNlLl9maWxsQ29sb3JbIDMgXTtcbiAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWyAwIF0gPSBzb3VyY2UuX3N0cm9rZUNvbG9yWyAwIF07XG4gICAgdGFyZ2V0Ll9zdHJva2VDb2xvclsgMSBdID0gc291cmNlLl9zdHJva2VDb2xvclsgMSBdO1xuICAgIHRhcmdldC5fc3Ryb2tlQ29sb3JbIDIgXSA9IHNvdXJjZS5fc3Ryb2tlQ29sb3JbIDIgXTtcbiAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWyAzIF0gPSBzb3VyY2UuX3N0cm9rZUNvbG9yWyAzIF07XG4gIH1cblxuICB0YXJnZXQuX2JhY2tncm91bmRQb3NpdGlvblggPSBzb3VyY2UuX2JhY2tncm91bmRQb3NpdGlvblg7XG4gIHRhcmdldC5fYmFja2dyb3VuZFBvc2l0aW9uWSA9IHNvdXJjZS5fYmFja2dyb3VuZFBvc2l0aW9uWTtcbiAgdGFyZ2V0Ll9yZWN0QWxpZ25YICAgICAgICAgID0gc291cmNlLl9yZWN0QWxpZ25YO1xuICB0YXJnZXQuX3JlY3RBbGlnblkgICAgICAgICAgPSBzb3VyY2UuX3JlY3RBbGlnblk7XG4gIHRhcmdldC5fbGluZVdpZHRoICAgICAgICAgICA9IHNvdXJjZS5fbGluZVdpZHRoO1xuICB0YXJnZXQuX2RvU3Ryb2tlICAgICAgICAgICAgPSBzb3VyY2UuX2RvU3Ryb2tlO1xuICB0YXJnZXQuX2RvRmlsbCAgICAgICAgICAgICAgPSBzb3VyY2UuX2RvRmlsbDtcblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvcHlEcmF3aW5nU2V0dGluZ3M7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCAnLi4vLi4vY29uc3RhbnRzJyApO1xuXG52YXIgZGVmYXVsdERyYXdpbmdTZXR0aW5ncyA9IHtcbiAgX2JhY2tncm91bmRQb3NpdGlvblg6IGNvbnN0YW50cy5nZXQoICdMRUZUJyApLFxuICBfYmFja2dyb3VuZFBvc2l0aW9uWTogY29uc3RhbnRzLmdldCggJ1RPUCcgKSxcbiAgX3JlY3RBbGlnblg6ICAgICAgICAgIGNvbnN0YW50cy5nZXQoICdMRUZUJyApLFxuICBfcmVjdEFsaWduWTogICAgICAgICAgY29uc3RhbnRzLmdldCggJ1RPUCcgKSxcbiAgX2xpbmVXaWR0aDogICAgICAgICAgIDIsXG4gIF9kb1N0cm9rZTogICAgICAgICAgICB0cnVlLFxuICBfZG9GaWxsOiAgICAgICAgICAgICAgdHJ1ZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0RHJhd2luZ1NldHRpbmdzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb25jZSAgICAgID0gcmVxdWlyZSggJ3BlYWtvL29uY2UnICk7XG5cbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCAnLi4vLi4vY29uc3RhbnRzJyApO1xuXG4vLyBcInBsYXRmb3JtXCIgbm90IGluY2x1ZGVkIHVzaW5nIDxzY3JpcHQgLz4gdGFnLlxuaWYgKCB0eXBlb2YgcGxhdGZvcm0gPT09ICd1bmRlZmluZWQnICkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZS1iZWZvcmUtZGVmaW5lXG4gIHZhciBwbGF0Zm9ybTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG4gIHRyeSB7XG4gICAgcGxhdGZvcm0gPSByZXF1aXJlKCAncGxhdGZvcm0nICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ2xvYmFsLXJlcXVpcmVcbiAgfSBjYXRjaCAoIGVycm9yICkge1xuICAgIC8vIFwicGxhdGZvcm1cIiBub3QgaW5zdGFsbGVkIHVzaW5nIE5QTS5cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZW5kZXJlclR5cGUgKClcbntcbiAgdmFyIHNhZmFyaSwgdG91Y2hhYmxlO1xuXG4gIGlmICggcGxhdGZvcm0gKSB7XG4gICAgc2FmYXJpID0gcGxhdGZvcm0ub3MgJiZcbiAgICAgIHBsYXRmb3JtLm9zLmZhbWlseSA9PT0gJ2lPUycgJiZcbiAgICAgIHBsYXRmb3JtLm5hbWUgPT09ICdTYWZhcmknO1xuICB9XG5cbiAgaWYgKCB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICB0b3VjaGFibGUgPSAnb250b3VjaGVuZCcgaW4gd2luZG93O1xuICB9XG5cbiAgaWYgKCB0b3VjaGFibGUgJiYgISBzYWZhcmkgKSB7XG4gICAgcmV0dXJuIGNvbnN0YW50cy5nZXQoICdHTCcgKTtcbiAgfVxuXG4gIHJldHVybiBjb25zdGFudHMuZ2V0KCAnMkQnICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb25jZSggZ2V0UmVuZGVyZXJUeXBlICk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBvbmNlID0gcmVxdWlyZSggJ3BlYWtvL29uY2UnICk7XG5cbi8qKlxuICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LjQvNGPINC/0L7QtNC00LXRgNC20LjQstCw0LXQvNC+0LPQviBXZWJHTCDQutC+0L3RgtC10LrRgdGC0LAsINC90LDQv9GA0LjQvNC10YA6ICdleHBlcmltZW50YWwtd2ViZ2wnLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgZ2V0V2ViR0xcbiAqIEByZXR1cm4ge3N0cmluZz99INCSINGB0LvRg9GH0LDQtSDQvdC10YPQtNCw0YfQuCAoV2ViR0wg0L3QtSDQv9C+0LTQtNC10YDQttC40LLQsNC10YLRgdGPKSAtINCy0LXRgNC90LXRgiBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGdldFdlYkdMICgpXG57XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xuICB2YXIgbmFtZSAgID0gbnVsbDtcblxuICBpZiAoIGNhbnZhcy5nZXRDb250ZXh0KCAnd2ViZ2wnICkgKSB7XG4gICAgbmFtZSA9ICd3ZWJnbCc7XG4gIH0gZWxzZSBpZiAoIGNhbnZhcy5nZXRDb250ZXh0KCAnZXhwZXJpbWVudGFsLXdlYmdsJyApICkge1xuICAgIG5hbWUgPSAnZXhwZXJpbWVudGFsLXdlYmdsJztcbiAgfVxuXG4gIC8vIEZpeGluZyBwb3NzaWJsZSBtZW1vcnkgbGVhay5cbiAgY2FudmFzID0gbnVsbDtcbiAgcmV0dXJuIG5hbWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb25jZSggZ2V0V2ViR0wgKTtcbiIsIi8qIGVzbGludCBsaW5lcy1hcm91bmQtZGlyZWN0aXZlOiBvZmYgKi9cbi8qIGVzbGludCBsaW5lcy1hcm91bmQtY29tbWVudDogb2ZmICovXG4ndXNlIHN0cmljdCc7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJy4uLy4uL2NvbnN0YW50cycgKTtcbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgcHJvY2Vzc1JlY3RBbGlnblhcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IHJlbmRlcmVyXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB4XG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB3XG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydHMucHJvY2Vzc1JlY3RBbGlnblggPSBmdW5jdGlvbiBwcm9jZXNzUmVjdEFsaWduWCAoIHJlbmRlcmVyLCB4LCB3ICkgeyBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25YID09PSBjb25zdGFudHMuZ2V0KCBcIkNFTlRFUlwiICkgKSB7IHggLT0gdyAqIDAuNTsgfSBlbHNlIGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblggPT09IGNvbnN0YW50cy5nZXQoIFwiUklHSFRcIiApICkgeyB4IC09IHc7IH0gZWxzZSBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25YICE9PSBjb25zdGFudHMuZ2V0KCBcIkxFRlRcIiApICkgeyB0aHJvdyBFcnJvciggJ1Vua25vd24gXCIgKycgKyBcInJlY3RBbGlnblhcIiArICdcIjogJyArIHJlbmRlcmVyLl9yZWN0QWxpZ25YICk7IH0gcmV0dXJuIE1hdGguZmxvb3IoIHggKTsgfTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHByb2Nlc3NSZWN0QWxpZ25ZXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSByZW5kZXJlclxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgeVxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgaFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnRzLnByb2Nlc3NSZWN0QWxpZ25ZID0gZnVuY3Rpb24gcHJvY2Vzc1JlY3RBbGlnblkgKCByZW5kZXJlciwgeCwgdyApIHsgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWSA9PT0gY29uc3RhbnRzLmdldCggXCJNSURETEVcIiApICkgeyB4IC09IHcgKiAwLjU7IH0gZWxzZSBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25ZID09PSBjb25zdGFudHMuZ2V0KCBcIkJPVFRPTVwiICkgKSB7IHggLT0gdzsgfSBlbHNlIGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblkgIT09IGNvbnN0YW50cy5nZXQoIFwiVE9QXCIgKSApIHsgdGhyb3cgRXJyb3IoICdVbmtub3duIFwiICsnICsgXCJyZWN0QWxpZ25ZXCIgKyAnXCI6ICcgKyByZW5kZXJlci5fcmVjdEFsaWduWSApOyB9IHJldHVybiBNYXRoLmZsb29yKCB4ICk7IH07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVmYXVsdERyYXdpbmdTZXR0aW5ncyA9IHJlcXVpcmUoICcuL2RlZmF1bHRfZHJhd2luZ19zZXR0aW5ncycgKTtcbnZhciBjb3B5RHJhd2luZ1NldHRpbmdzICAgID0gcmVxdWlyZSggJy4vY29weV9kcmF3aW5nX3NldHRpbmdzJyApO1xuXG4vKipcbiAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGRyYXdpbmcgc2V0dGluZ3Mg0L/QviDRg9C80L7Qu9GH0LDQvdC40Y4g0LIgYHRhcmdldGAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQgICDQnNC+0LbQtdGCINCx0YvRgtGMIGBBYnN0cmFjdFJlbmRlcmVyYCDQuNC70Lgg0L/RgNC+0YHRgtGL0LxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINC+0LHRitC10LrRgtC+0LwuXG4gKiBAcGFyYW0gIHttb2R1bGU6XCJ2Ni5qc1wiLkFic3RyYWN0UmVuZGVyZXJ9IHJlbmRlcmVyIGBSZW5kZXJlckdMYCDQuNC70LggYFJlbmRlcmVyMkRgINC90YPQttC90Ysg0LTQu9GPXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDRg9GB0YLQsNC90L7QstC60LggX3N0cm9rZUNvbG9yLCBfZmlsbENvbG9yLlxuICogQHJldHVybiB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIgYHRhcmdldGAuXG4gKi9cbmZ1bmN0aW9uIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3MgKCB0YXJnZXQsIHJlbmRlcmVyIClcbntcblxuICBjb3B5RHJhd2luZ1NldHRpbmdzKCB0YXJnZXQsIGRlZmF1bHREcmF3aW5nU2V0dGluZ3MgKTtcblxuICB0YXJnZXQuX3N0cm9rZUNvbG9yID0gbmV3IHJlbmRlcmVyLnNldHRpbmdzLmNvbG9yKCk7XG4gIHRhcmdldC5fZmlsbENvbG9yICAgPSBuZXcgcmVuZGVyZXIuc2V0dGluZ3MuY29sb3IoKTtcblxuICByZXR1cm4gdGFyZ2V0O1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbG9yID0gcmVxdWlyZSggJy4uL2NvbG9yL1JHQkEnICk7XG52YXIgdHlwZSAgPSByZXF1aXJlKCAnLi4vY29uc3RhbnRzJyApLmdldCggJzJEJyApO1xuXG4vKipcbiAqINCe0L/RhtC40Lgg0L/QviDRg9C80L7Qu9GH0LDQvdC40Y4g0LTQu9GPINGB0L7Qt9C00LDQvdC40Y8ge0BsaW5rIHY2LlJlbmRlcmVyMkR9LCB7QGxpbmsgdjYuUmVuZGVyZXJHTH0sIHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyfSwg0LjQu9C4IHtAbGluayB2Ni5jcmVhdGVSZW5kZXJlcn0uXG4gKiBAbWVtYmVyIHtvYmplY3R9IHY2Lm9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAgIFtzZXR0aW5nc10gICAgICAgICAgICAgICDQndCw0YHRgtGA0L7QudC60Lgg0YDQtdC90LTQtdGA0LXRgNCwINC/0L4g0YPQvNC+0LvRh9Cw0L3QuNGOLlxuICogQHByb3BlcnR5IHtvYmplY3R9ICAgW3NldHRpbmdzLmNvbG9yPXY2LlJHQkFdIHtAbGluayB2Ni5SR0JBfSDQuNC70Lgge0BsaW5rIHY2LkhTTEF9LlxuICogQHByb3BlcnR5IHtudW1iZXJ9ICAgW3NldHRpbmdzLnNjYWxlPTFdICAgICAgINCf0LvQvtGC0L3QvtGB0YLRjCDQv9C40LrRgdC10LvQtdC5INGA0LXQvdC00LXRgNC10YDQsCwg0L3QsNC/0YDQuNC80LXRgDogYGRldmljZVBpeGVsUmF0aW9gLlxuICogQHByb3BlcnR5IHtib29sZWFufSAgW2FudGlhbGlhcz10cnVlXSAgICAgICAgINCf0L7QutCwINC90LUg0YHQtNC10LvQsNC90L4uXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59ICBbYmxlbmRpbmc9dHJ1ZV0gICAgICAgICAg0J/QvtC60LAg0L3QtSDRgdC00LXQu9Cw0L3Qvi5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gIFtkZWdyZWVzPWZhbHNlXSAgICAgICAgICDQmNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNCw0LTRg9GB0Ysg0LLQvNC10YHRgtC+INGA0LDQtNC40LDQvdC+0LIuXG4gKiBAcHJvcGVydHkge0VsZW1lbnQ/fSBbYXBwZW5kVG9dICAgICAgICAgICAgICAg0JIg0Y3RgtC+0YIg0Y3Qu9C10LzQtdC90YIg0LHRg9C00LXRgiDQtNC+0LHQsNCy0LvQtdC9IGBjYW52YXNgLlxuICogQHByb3BlcnR5IHtib29sZWFufSAgW2FscGhhPXRydWVdICAgICAgICAgICAgINCY0YHQv9C+0LvRjNC30L7QstCw0YLRjCDQv9GA0L7Qt9GA0LDRh9C90YvQuSAo0LLQvNC10YHRgtC+INGH0LXRgNC90L7Qs9C+KSDQutC+0L3RgtC10LrRgdGCLlxuICogQHByb3BlcnR5IHtjb25zdGFudH0gW3R5cGU9MkRdICAgICAgICAgICAgICAgINCi0LjQvyDQutC+0L3RgtC10LrRgdGC0LAgKDJELCBHTCwgQVVUTykuXG4gKi9cbnZhciBvcHRpb25zID0ge1xuICBzZXR0aW5nczoge1xuICAgIGNvbG9yOiBjb2xvcixcbiAgICBzY2FsZTogMVxuICB9LFxuXG4gIGFudGlhbGlhczogdHJ1ZSxcbiAgYmxlbmRpbmc6ICB0cnVlLFxuICBkZWdyZWVzOiAgIGZhbHNlLFxuICBhbHBoYTogICAgIHRydWUsXG4gIHR5cGU6ICAgICAgdHlwZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBvcHRpb25zO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCY0YHQv9C+0LvRjNC30L7QstCw0YLRjCDQs9GA0LDQtNGD0YHRiyDQstC80LXRgdGC0L4g0YDQsNC00LjQsNC90L7Qsi5cbiAqL1xuZXhwb3J0cy5kZWdyZXNzID0gZmFsc2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQGludGVyZmFjZSBJU2hhZGVyU291cmNlc1xuICogQHByb3BlcnR5IHtzdHJpbmd9IHZlcnQg0JjRgdGF0L7QtNC90LjQuiDQstC10YDRiNC40L3QvdC+0LPQviAodmVydGV4KSDRiNC10LnQtNC10YDQsC5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBmcmFnINCY0YHRhdC+0LTQvdC40Log0YTRgNCw0LPQvNC10L3RgtC90L7Qs9C+IChmcmFnbWVudCkg0YjQtdC50LTQtdGA0LAuXG4gKi9cblxuLyoqXG4gKiBXZWJHTCDRiNC10LnQtNC10YDRiy5cbiAqIEBtZW1iZXIge29iamVjdH0gdjYuc2hhZGVyc1xuICogQHByb3BlcnR5IHtJU2hhZGVyU291cmNlc30gYmFzaWMgICAgICDQodGC0LDQvdC00LDRgNGC0L3Ri9C1INGI0LXQudC00LXRgNGLLlxuICogQHByb3BlcnR5IHtJU2hhZGVyU291cmNlc30gYmFja2dyb3VuZCDQqNC10LnQtNC10YDRiyDQtNC70Y8g0L7RgtGA0LjRgdC+0LLQutC4INGE0L7QvdCwLlxuICovXG52YXIgc2hhZGVycyA9IHtcbiAgYmFzaWM6IHtcbiAgICB2ZXJ0OiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7YXR0cmlidXRlIHZlYzIgYXBvczt1bmlmb3JtIHZlYzIgdXJlczt1bmlmb3JtIG1hdDMgdXRyYW5zZm9ybTt2b2lkIG1haW4oKXtnbF9Qb3NpdGlvbj12ZWM0KCgodXRyYW5zZm9ybSp2ZWMzKGFwb3MsMS4wKSkueHkvdXJlcyoyLjAtMS4wKSp2ZWMyKDEsLTEpLDAsMSk7fScsXG4gICAgZnJhZzogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O3VuaWZvcm0gdmVjNCB1Y29sb3I7dm9pZCBtYWluKCl7Z2xfRnJhZ0NvbG9yPXZlYzQodWNvbG9yLnJnYi8yNTUuMCx1Y29sb3IuYSk7fSdcbiAgfSxcblxuICBiYWNrZ3JvdW5kOiB7XG4gICAgdmVydDogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O2F0dHJpYnV0ZSB2ZWMyIGFwb3M7dm9pZCBtYWluKCl7Z2xfUG9zaXRpb24gPSB2ZWM0KGFwb3MsMCwxKTt9JyxcbiAgICBmcmFnOiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7dW5pZm9ybSB2ZWM0IHVjb2xvcjt2b2lkIG1haW4oKXtnbF9GcmFnQ29sb3I9dWNvbG9yO30nXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2hhZGVycztcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3LTIwMTggVmxhZGlzbGF2VGlraGl5IChTSUxFTlQpIChzaWxlbnQtdGVtcGVzdClcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBHUEwtMy4wIGxpY2Vuc2UuXG4gKiBodHRwczovL2dpdGh1Yi5jb20vc2lsZW50LXRlbXBlc3QvdjYuanMvdHJlZS9kZXYvXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgdjZcbiAqL1xuXG4vKipcbiAqIEEgdmFsaWQgQ1NTLWNvbG9yOiBgXCJoc2woMzYwLCAxMDAlLCAxMDAlKVwiYCwgYFwiI2ZmMDBmZlwiYCwgYFwibGlnaHRwaW5rXCJgLiB7QGxpbmsgdjYuSFNMQX0gb3Ige0BsaW5rIHY2LlJHQkF9LlxuICogQHR5cGVkZWYge3N0cmluZ3x2Ni5IU0xBfHY2LlJHQkF9IFRDb2xvclxuICovXG5cbmV4cG9ydHMuQWJzdHJhY3RJbWFnZSAgICA9IHJlcXVpcmUoICcuL2NvcmUvaW1hZ2UvQWJzdHJhY3RJbWFnZScgKTtcbmV4cG9ydHMuQWJzdHJhY3RSZW5kZXJlciA9IHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXIvQWJzdHJhY3RSZW5kZXJlcicgKTtcbmV4cG9ydHMuQWJzdHJhY3RWZWN0b3IgICA9IHJlcXVpcmUoICcuL2NvcmUvbWF0aC9BYnN0cmFjdFZlY3RvcicgKTtcbmV4cG9ydHMuQ2FtZXJhICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvY2FtZXJhL0NhbWVyYScgKTtcbmV4cG9ydHMuQ29tcG91bmRlZEltYWdlICA9IHJlcXVpcmUoICcuL2NvcmUvaW1hZ2UvQ29tcG91bmRlZEltYWdlJyApO1xuZXhwb3J0cy5IU0xBICAgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9jb2xvci9IU0xBJyApO1xuZXhwb3J0cy5JbWFnZSAgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9pbWFnZS9JbWFnZScgKTtcbmV4cG9ydHMuUkdCQSAgICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvY29sb3IvUkdCQScgKTtcbmV4cG9ydHMuUmVuZGVyZXIyRCAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXIvUmVuZGVyZXIyRCcgKTtcbmV4cG9ydHMuUmVuZGVyZXJHTCAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXIvUmVuZGVyZXJHTCcgKTtcbmV4cG9ydHMuU2hhZGVyUHJvZ3JhbSAgICA9IHJlcXVpcmUoICcuL2NvcmUvU2hhZGVyUHJvZ3JhbScgKTtcbmV4cG9ydHMuVGlja2VyICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvVGlja2VyJyApO1xuZXhwb3J0cy5UcmFuc2Zvcm0gICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9UcmFuc2Zvcm0nICk7XG5leHBvcnRzLlZlY3RvcjJEICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL21hdGgvVmVjdG9yMkQnICk7XG5leHBvcnRzLlZlY3RvcjNEICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL21hdGgvVmVjdG9yM0QnICk7XG5leHBvcnRzLmNvbnN0YW50cyAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2NvbnN0YW50cycgKTtcbmV4cG9ydHMuY3JlYXRlUmVuZGVyZXIgICA9IHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXInICk7XG5leHBvcnRzLnNoYWRlcnMgICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL3NoYWRlcnMnICk7XG5cbmlmICggdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICkge1xuICBzZWxmLnY2ID0gZXhwb3J0cztcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBBIGxpZ2h0d2VpZ2h0IGltcGxlbWVudGF0aW9uIG9mIE5vZGUuanMgRXZlbnRFbWl0dGVyLlxuICogQGNvbnN0cnVjdG9yIExpZ2h0RW1pdHRlclxuICogQGV4YW1wbGVcbiAqIHZhciBMaWdodEVtaXR0ZXIgPSByZXF1aXJlKCAnbGlnaHRfZW1pdHRlcicgKTtcbiAqL1xuZnVuY3Rpb24gTGlnaHRFbWl0dGVyICgpIHt9XG5cbkxpZ2h0RW1pdHRlci5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiBAbWV0aG9kIExpZ2h0RW1pdHRlciNlbWl0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gICAqIEBwYXJhbSB7Li4uYW55fSBbZGF0YV1cbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgZW1pdDogZnVuY3Rpb24gZW1pdCAoIHR5cGUgKSB7XG4gICAgdmFyIGxpc3QgPSBfZ2V0TGlzdCggdGhpcywgdHlwZSApO1xuICAgIHZhciBkYXRhLCBpLCBsO1xuXG4gICAgaWYgKCAhIGxpc3QgKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPiAxICkge1xuICAgICAgZGF0YSA9IFtdLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApO1xuICAgIH1cblxuICAgIGZvciAoIGkgPSAwLCBsID0gbGlzdC5sZW5ndGg7IGkgPCBsOyArK2kgKSB7XG4gICAgICBpZiAoICEgbGlzdFsgaSBdLmFjdGl2ZSApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmICggbGlzdFsgaSBdLm9uY2UgKSB7XG4gICAgICAgIGxpc3RbIGkgXS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCBkYXRhICkge1xuICAgICAgICBsaXN0WyBpIF0ubGlzdGVuZXIuYXBwbHkoIHRoaXMsIGRhdGEgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpc3RbIGkgXS5saXN0ZW5lci5jYWxsKCB0aGlzICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI29mZlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbdHlwZV1cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2xpc3RlbmVyXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBvZmY6IGZ1bmN0aW9uIG9mZiAoIHR5cGUsIGxpc3RlbmVyICkge1xuICAgIHZhciBsaXN0LCBpO1xuXG4gICAgaWYgKCAhIHR5cGUgKSB7XG4gICAgICB0aGlzLl9ldmVudHMgPSBudWxsO1xuICAgIH0gZWxzZSBpZiAoICggbGlzdCA9IF9nZXRMaXN0KCB0aGlzLCB0eXBlICkgKSApIHtcbiAgICAgIGlmICggbGlzdGVuZXIgKSB7XG4gICAgICAgIGZvciAoIGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgIGlmICggbGlzdFsgaSBdLmxpc3RlbmVyID09PSBsaXN0ZW5lciAmJiBsaXN0WyBpIF0uYWN0aXZlICkge1xuICAgICAgICAgICAgbGlzdFsgaSBdLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIExpZ2h0RW1pdHRlciNvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gICB0eXBlXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9uOiBmdW5jdGlvbiBvbiAoIHR5cGUsIGxpc3RlbmVyICkge1xuICAgIF9vbiggdGhpcywgdHlwZSwgbGlzdGVuZXIgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBMaWdodEVtaXR0ZXIjb25jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICB0eXBlXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9uY2U6IGZ1bmN0aW9uIG9uY2UgKCB0eXBlLCBsaXN0ZW5lciApIHtcbiAgICBfb24oIHRoaXMsIHR5cGUsIGxpc3RlbmVyLCB0cnVlICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IExpZ2h0RW1pdHRlclxufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBfb25cbiAqIEBwYXJhbSAge0xpZ2h0RW1pdHRlcn0gc2VsZlxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICB0eXBlXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gICAgIGxpc3RlbmVyXG4gKiBAcGFyYW0gIHtib29sZWFufSAgICAgIG9uY2VcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIF9vbiAoIHNlbGYsIHR5cGUsIGxpc3RlbmVyLCBvbmNlICkge1xuICB2YXIgZW50aXR5ID0ge1xuICAgIGxpc3RlbmVyOiBsaXN0ZW5lcixcbiAgICBhY3RpdmU6ICAgdHJ1ZSxcbiAgICB0eXBlOiAgICAgdHlwZSxcbiAgICBvbmNlOiAgICAgb25jZVxuICB9O1xuXG4gIGlmICggISBzZWxmLl9ldmVudHMgKSB7XG4gICAgc2VsZi5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZSggbnVsbCApO1xuICB9XG5cbiAgaWYgKCAhIHNlbGYuX2V2ZW50c1sgdHlwZSBdICkge1xuICAgIHNlbGYuX2V2ZW50c1sgdHlwZSBdID0gW107XG4gIH1cblxuICBzZWxmLl9ldmVudHNbIHR5cGUgXS5wdXNoKCBlbnRpdHkgKTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBfZ2V0TGlzdFxuICogQHBhcmFtICB7TGlnaHRFbWl0dGVyfSAgIHNlbGZcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICB0eXBlXG4gKiBAcmV0dXJuIHthcnJheTxvYmplY3Q+P31cbiAqL1xuZnVuY3Rpb24gX2dldExpc3QgKCBzZWxmLCB0eXBlICkge1xuICByZXR1cm4gc2VsZi5fZXZlbnRzICYmIHNlbGYuX2V2ZW50c1sgdHlwZSBdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpZ2h0RW1pdHRlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfdGhyb3dBcmd1bWVudEV4Y2VwdGlvbiAoIHVuZXhwZWN0ZWQsIGV4cGVjdGVkICkge1xuICB0aHJvdyBFcnJvciggJ1wiJyArIHRvU3RyaW5nLmNhbGwoIHVuZXhwZWN0ZWQgKSArICdcIiBpcyBub3QgJyArIGV4cGVjdGVkICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdHlwZSA9IHJlcXVpcmUoICcuL3R5cGUnICk7XG52YXIgbGFzdFJlcyA9ICd1bmRlZmluZWQnO1xudmFyIGxhc3RWYWw7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX3R5cGUgKCB2YWwgKSB7XG4gIGlmICggdmFsID09PSBsYXN0VmFsICkge1xuICAgIHJldHVybiBsYXN0UmVzO1xuICB9XG5cbiAgcmV0dXJuICggbGFzdFJlcyA9IHR5cGUoIGxhc3RWYWwgPSB2YWwgKSApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfdW5lc2NhcGUgKCBzdHJpbmcgKSB7XG4gIHJldHVybiBzdHJpbmcucmVwbGFjZSggL1xcXFwoXFxcXCk/L2csICckMScgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc3NldCA9IHJlcXVpcmUoICcuLi9pc3NldCcgKTtcblxudmFyIHVuZGVmaW5lZDsgLy8ganNoaW50IGlnbm9yZTogbGluZVxuXG52YXIgZGVmaW5lR2V0dGVyID0gT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZUdldHRlcl9fLFxuICAgIGRlZmluZVNldHRlciA9IE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVTZXR0ZXJfXztcblxuZnVuY3Rpb24gYmFzZURlZmluZVByb3BlcnR5ICggb2JqZWN0LCBrZXksIGRlc2NyaXB0b3IgKSB7XG4gIHZhciBoYXNHZXR0ZXIgPSBpc3NldCggJ2dldCcsIGRlc2NyaXB0b3IgKSxcbiAgICAgIGhhc1NldHRlciA9IGlzc2V0KCAnc2V0JywgZGVzY3JpcHRvciApLFxuICAgICAgZ2V0LCBzZXQ7XG5cbiAgaWYgKCBoYXNHZXR0ZXIgfHwgaGFzU2V0dGVyICkge1xuICAgIGlmICggaGFzR2V0dGVyICYmIHR5cGVvZiAoIGdldCA9IGRlc2NyaXB0b3IuZ2V0ICkgIT09ICdmdW5jdGlvbicgKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoICdHZXR0ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uOiAnICsgZ2V0ICk7XG4gICAgfVxuXG4gICAgaWYgKCBoYXNTZXR0ZXIgJiYgdHlwZW9mICggc2V0ID0gZGVzY3JpcHRvci5zZXQgKSAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ1NldHRlciBtdXN0IGJlIGEgZnVuY3Rpb246ICcgKyBzZXQgKTtcbiAgICB9XG5cbiAgICBpZiAoIGlzc2V0KCAnd3JpdGFibGUnLCBkZXNjcmlwdG9yICkgKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoICdJbnZhbGlkIHByb3BlcnR5IGRlc2NyaXB0b3IuIENhbm5vdCBib3RoIHNwZWNpZnkgYWNjZXNzb3JzIGFuZCBhIHZhbHVlIG9yIHdyaXRhYmxlIGF0dHJpYnV0ZScgKTtcbiAgICB9XG5cbiAgICBpZiAoIGRlZmluZUdldHRlciApIHtcbiAgICAgIGlmICggaGFzR2V0dGVyICkge1xuICAgICAgICBkZWZpbmVHZXR0ZXIuY2FsbCggb2JqZWN0LCBrZXksIGdldCApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIGhhc1NldHRlciApIHtcbiAgICAgICAgZGVmaW5lU2V0dGVyLmNhbGwoIG9iamVjdCwga2V5LCBzZXQgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgZGVmaW5lIGdldHRlciBvciBzZXR0ZXInICk7XG4gICAgfVxuICB9IGVsc2UgaWYgKCBpc3NldCggJ3ZhbHVlJywgZGVzY3JpcHRvciApICkge1xuICAgIG9iamVjdFsga2V5IF0gPSBkZXNjcmlwdG9yLnZhbHVlO1xuICB9IGVsc2UgaWYgKCAhIGlzc2V0KCBrZXksIG9iamVjdCApICkge1xuICAgIG9iamVjdFsga2V5IF0gPSB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gb2JqZWN0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VEZWZpbmVQcm9wZXJ0eTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlRXhlYyAoIHJlZ2V4cCwgc3RyaW5nICkge1xuICB2YXIgcmVzdWx0ID0gW10sXG4gICAgICB2YWx1ZTtcblxuICByZWdleHAubGFzdEluZGV4ID0gMDtcblxuICB3aGlsZSAoICggdmFsdWUgPSByZWdleHAuZXhlYyggc3RyaW5nICkgKSApIHtcbiAgICByZXN1bHQucHVzaCggdmFsdWUgKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2FsbEl0ZXJhdGVlID0gcmVxdWlyZSggJy4uL2NhbGwtaXRlcmF0ZWUnICksXG4gICAgaXNzZXQgICAgICAgID0gcmVxdWlyZSggJy4uL2lzc2V0JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VGb3JFYWNoICggYXJyLCBmbiwgY3R4LCBmcm9tUmlnaHQgKSB7XG4gIHZhciBpLCBqLCBpZHg7XG5cbiAgZm9yICggaSA9IC0xLCBqID0gYXJyLmxlbmd0aCAtIDE7IGogPj0gMDsgLS1qICkge1xuICAgIGlmICggZnJvbVJpZ2h0ICkge1xuICAgICAgaWR4ID0gajtcbiAgICB9IGVsc2Uge1xuICAgICAgaWR4ID0gKytpO1xuICAgIH1cblxuICAgIGlmICggaXNzZXQoIGlkeCwgYXJyICkgJiYgY2FsbEl0ZXJhdGVlKCBmbiwgY3R4LCBhcnJbIGlkeCBdLCBpZHgsIGFyciApID09PSBmYWxzZSApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhcnI7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2FsbEl0ZXJhdGVlID0gcmVxdWlyZSggJy4uL2NhbGwtaXRlcmF0ZWUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZUZvckluICggb2JqLCBmbiwgY3R4LCBmcm9tUmlnaHQsIGtleXMgKSB7XG4gIHZhciBpLCBqLCBrZXk7XG5cbiAgZm9yICggaSA9IC0xLCBqID0ga2V5cy5sZW5ndGggLSAxOyBqID49IDA7IC0taiApIHtcbiAgICBpZiAoIGZyb21SaWdodCApIHtcbiAgICAgIGtleSA9IGtleXNbIGogXTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5ID0ga2V5c1sgKytpIF07XG4gICAgfVxuXG4gICAgaWYgKCBjYWxsSXRlcmF0ZWUoIGZuLCBjdHgsIG9ialsga2V5IF0sIGtleSwgb2JqICkgPT09IGZhbHNlICkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc3NldCA9IHJlcXVpcmUoICcuLi9pc3NldCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlR2V0ICggb2JqLCBwYXRoLCBvZmYgKSB7XG4gIHZhciBsID0gcGF0aC5sZW5ndGggLSBvZmYsXG4gICAgICBpID0gMCxcbiAgICAgIGtleTtcblxuICBmb3IgKCA7IGkgPCBsOyArK2kgKSB7XG4gICAga2V5ID0gcGF0aFsgaSBdO1xuXG4gICAgaWYgKCBpc3NldCgga2V5LCBvYmogKSApIHtcbiAgICAgIG9iaiA9IG9ialsga2V5IF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJhc2VUb0luZGV4ID0gcmVxdWlyZSggJy4vYmFzZS10by1pbmRleCcgKTtcblxudmFyIGluZGV4T2YgICAgID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YsXG4gICAgbGFzdEluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2Y7XG5cbmZ1bmN0aW9uIGJhc2VJbmRleE9mICggYXJyLCBzZWFyY2gsIGZyb21JbmRleCwgZnJvbVJpZ2h0ICkge1xuICB2YXIgbCwgaSwgaiwgaWR4LCB2YWw7XG5cbiAgLy8gdXNlIHRoZSBuYXRpdmUgZnVuY3Rpb24gaWYgaXQgaXMgc3VwcG9ydGVkIGFuZCB0aGUgc2VhcmNoIGlzIG5vdCBuYW4uXG5cbiAgaWYgKCBzZWFyY2ggPT09IHNlYXJjaCAmJiAoIGlkeCA9IGZyb21SaWdodCA/IGxhc3RJbmRleE9mIDogaW5kZXhPZiApICkge1xuICAgIHJldHVybiBpZHguY2FsbCggYXJyLCBzZWFyY2gsIGZyb21JbmRleCApO1xuICB9XG5cbiAgbCA9IGFyci5sZW5ndGg7XG5cbiAgaWYgKCAhIGwgKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgaiA9IGwgLSAxO1xuXG4gIGlmICggdHlwZW9mIGZyb21JbmRleCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgZnJvbUluZGV4ID0gYmFzZVRvSW5kZXgoIGZyb21JbmRleCwgbCApO1xuXG4gICAgaWYgKCBmcm9tUmlnaHQgKSB7XG4gICAgICBqID0gTWF0aC5taW4oIGosIGZyb21JbmRleCApO1xuICAgIH0gZWxzZSB7XG4gICAgICBqID0gTWF0aC5tYXgoIDAsIGZyb21JbmRleCApO1xuICAgIH1cblxuICAgIGkgPSBqIC0gMTtcbiAgfSBlbHNlIHtcbiAgICBpID0gLTE7XG4gIH1cblxuICBmb3IgKCA7IGogPj0gMDsgLS1qICkge1xuICAgIGlmICggZnJvbVJpZ2h0ICkge1xuICAgICAgaWR4ID0gajtcbiAgICB9IGVsc2Uge1xuICAgICAgaWR4ID0gKytpO1xuICAgIH1cblxuICAgIHZhbCA9IGFyclsgaWR4IF07XG5cbiAgICBpZiAoIHZhbCA9PT0gc2VhcmNoIHx8IHNlYXJjaCAhPT0gc2VhcmNoICYmIHZhbCAhPT0gdmFsICkge1xuICAgICAgcmV0dXJuIGlkeDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUluZGV4T2Y7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiYXNlSW5kZXhPZiA9IHJlcXVpcmUoICcuL2Jhc2UtaW5kZXgtb2YnICk7XG5cbnZhciBzdXBwb3J0ID0gcmVxdWlyZSggJy4uL3N1cHBvcnQvc3VwcG9ydC1rZXlzJyApO1xuXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgaywgZml4S2V5cztcblxuaWYgKCBzdXBwb3J0ID09PSAnbm90LXN1cHBvcnRlZCcgKSB7XG4gIGsgPSBbXG4gICAgJ3RvU3RyaW5nJyxcbiAgICAndG9Mb2NhbGVTdHJpbmcnLFxuICAgICd2YWx1ZU9mJyxcbiAgICAnaGFzT3duUHJvcGVydHknLFxuICAgICdpc1Byb3RvdHlwZU9mJyxcbiAgICAncHJvcGVydHlJc0VudW1lcmFibGUnLFxuICAgICdjb25zdHJ1Y3RvcidcbiAgXTtcblxuICBmaXhLZXlzID0gZnVuY3Rpb24gZml4S2V5cyAoIGtleXMsIG9iamVjdCApIHtcbiAgICB2YXIgaSwga2V5O1xuXG4gICAgZm9yICggaSA9IGsubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICBpZiAoIGJhc2VJbmRleE9mKCBrZXlzLCBrZXkgPSBrWyBpIF0gKSA8IDAgJiYgaGFzT3duUHJvcGVydHkuY2FsbCggb2JqZWN0LCBrZXkgKSApIHtcbiAgICAgICAga2V5cy5wdXNoKCBrZXkgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ga2V5cztcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlS2V5cyAoIG9iamVjdCApIHtcbiAgdmFyIGtleXMgPSBbXTtcblxuICB2YXIga2V5O1xuXG4gIGZvciAoIGtleSBpbiBvYmplY3QgKSB7XG4gICAgaWYgKCBoYXNPd25Qcm9wZXJ0eS5jYWxsKCBvYmplY3QsIGtleSApICkge1xuICAgICAga2V5cy5wdXNoKCBrZXkgKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIHN1cHBvcnQgIT09ICdub3Qtc3VwcG9ydGVkJyApIHtcbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIHJldHVybiBmaXhLZXlzKCBrZXlzLCBvYmplY3QgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXQgPSByZXF1aXJlKCAnLi9iYXNlLWdldCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlUHJvcGVydHkgKCBvYmplY3QsIHBhdGggKSB7XG4gIGlmICggb2JqZWN0ICE9IG51bGwgKSB7XG4gICAgaWYgKCBwYXRoLmxlbmd0aCA+IDEgKSB7XG4gICAgICByZXR1cm4gZ2V0KCBvYmplY3QsIHBhdGgsIDAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqZWN0WyBwYXRoWyAwIF0gXTtcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlVG9JbmRleCAoIHYsIGwgKSB7XG4gIGlmICggISBsIHx8ICEgdiApIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGlmICggdiA8IDAgKSB7XG4gICAgdiArPSBsO1xuICB9XG5cbiAgcmV0dXJuIHYgfHwgMDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfdGhyb3dBcmd1bWVudEV4Y2VwdGlvbiA9IHJlcXVpcmUoICcuL190aHJvdy1hcmd1bWVudC1leGNlcHRpb24nICk7XG52YXIgZGVmYXVsdFRvID0gcmVxdWlyZSggJy4vZGVmYXVsdC10bycgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiZWZvcmUgKCBuLCBmbiApIHtcbiAgdmFyIHZhbHVlO1xuXG4gIGlmICggdHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nICkge1xuICAgIF90aHJvd0FyZ3VtZW50RXhjZXB0aW9uKCBmbiwgJ2EgZnVuY3Rpb24nICk7XG4gIH1cblxuICBuID0gZGVmYXVsdFRvKCBuLCAxICk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIC0tbiA+PSAwICkge1xuICAgICAgdmFsdWUgPSBmbi5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjYWxsSXRlcmF0ZWUgKCBmbiwgY3R4LCB2YWwsIGtleSwgb2JqICkge1xuICBpZiAoIHR5cGVvZiBjdHggPT09ICd1bmRlZmluZWQnICkge1xuICAgIHJldHVybiBmbiggdmFsLCBrZXksIG9iaiApO1xuICB9XG5cbiAgcmV0dXJuIGZuLmNhbGwoIGN0eCwgdmFsLCBrZXksIG9iaiApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJhc2VFeGVjICA9IHJlcXVpcmUoICcuL2Jhc2UvYmFzZS1leGVjJyApLFxuICAgIF91bmVzY2FwZSA9IHJlcXVpcmUoICcuL191bmVzY2FwZScgKSxcbiAgICBpc0tleSAgICAgPSByZXF1aXJlKCAnLi9pcy1rZXknICksXG4gICAgdG9LZXkgICAgID0gcmVxdWlyZSggJy4vdG8ta2V5JyApLFxuICAgIF90eXBlICAgICA9IHJlcXVpcmUoICcuL190eXBlJyApO1xuXG52YXIgclByb3BlcnR5ID0gLyhefFxcLilcXHMqKFtfYS16XVxcdyopXFxzKnxcXFtcXHMqKCg/Oi0pPyg/OlxcZCt8XFxkKlxcLlxcZCspfChcInwnKSgoW15cXFxcXVxcXFwoXFxcXFxcXFwpKnxbXlxcNF0pKilcXDQpXFxzKlxcXS9naTtcblxuZnVuY3Rpb24gc3RyaW5nVG9QYXRoICggc3RyICkge1xuICB2YXIgcGF0aCA9IGJhc2VFeGVjKCByUHJvcGVydHksIHN0ciApLFxuICAgICAgaSA9IHBhdGgubGVuZ3RoIC0gMSxcbiAgICAgIHZhbDtcblxuICBmb3IgKCA7IGkgPj0gMDsgLS1pICkge1xuICAgIHZhbCA9IHBhdGhbIGkgXTtcblxuICAgIC8vIC5uYW1lXG4gICAgaWYgKCB2YWxbIDIgXSApIHtcbiAgICAgIHBhdGhbIGkgXSA9IHZhbFsgMiBdO1xuICAgIC8vIFsgXCJcIiBdIHx8IFsgJycgXVxuICAgIH0gZWxzZSBpZiAoIHZhbFsgNSBdICE9IG51bGwgKSB7XG4gICAgICBwYXRoWyBpIF0gPSBfdW5lc2NhcGUoIHZhbFsgNSBdICk7XG4gICAgLy8gWyAwIF1cbiAgICB9IGVsc2Uge1xuICAgICAgcGF0aFsgaSBdID0gdmFsWyAzIF07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhdGg7XG59XG5cbmZ1bmN0aW9uIGNhc3RQYXRoICggdmFsICkge1xuICB2YXIgcGF0aCwgbCwgaTtcblxuICBpZiAoIGlzS2V5KCB2YWwgKSApIHtcbiAgICByZXR1cm4gWyB0b0tleSggdmFsICkgXTtcbiAgfVxuXG4gIGlmICggX3R5cGUoIHZhbCApID09PSAnYXJyYXknICkge1xuICAgIHBhdGggPSBBcnJheSggbCA9IHZhbC5sZW5ndGggKTtcblxuICAgIGZvciAoIGkgPSBsIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICBwYXRoWyBpIF0gPSB0b0tleSggdmFsWyBpIF0gKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcGF0aCA9IHN0cmluZ1RvUGF0aCggJycgKyB2YWwgKTtcbiAgfVxuXG4gIHJldHVybiBwYXRoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNhc3RQYXRoO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNsYW1wICggdmFsdWUsIGxvd2VyLCB1cHBlciApIHtcbiAgaWYgKCB2YWx1ZSA+PSB1cHBlciApIHtcbiAgICByZXR1cm4gdXBwZXI7XG4gIH1cblxuICBpZiAoIHZhbHVlIDw9IGxvd2VyICkge1xuICAgIHJldHVybiBsb3dlcjtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcmVhdGUgICAgICAgICA9IHJlcXVpcmUoICcuL2NyZWF0ZScgKSxcbiAgICBnZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoICcuL2dldC1wcm90b3R5cGUtb2YnICksXG4gICAgdG9PYmplY3QgICAgICAgPSByZXF1aXJlKCAnLi90by1vYmplY3QnICksXG4gICAgZWFjaCAgICAgICAgICAgPSByZXF1aXJlKCAnLi9lYWNoJyApLFxuICAgIGlzT2JqZWN0TGlrZSAgID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xvbmUgKCBkZWVwLCB0YXJnZXQsIGd1YXJkICkge1xuICB2YXIgY2xuO1xuXG4gIGlmICggdHlwZW9mIHRhcmdldCA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3VhcmQgKSB7XG4gICAgdGFyZ2V0ID0gZGVlcDtcbiAgICBkZWVwID0gdHJ1ZTtcbiAgfVxuXG4gIGNsbiA9IGNyZWF0ZSggZ2V0UHJvdG90eXBlT2YoIHRhcmdldCA9IHRvT2JqZWN0KCB0YXJnZXQgKSApICk7XG5cbiAgZWFjaCggdGFyZ2V0LCBmdW5jdGlvbiAoIHZhbHVlLCBrZXksIHRhcmdldCApIHtcbiAgICBpZiAoIHZhbHVlID09PSB0YXJnZXQgKSB7XG4gICAgICB0aGlzWyBrZXkgXSA9IHRoaXM7XG4gICAgfSBlbHNlIGlmICggZGVlcCAmJiBpc09iamVjdExpa2UoIHZhbHVlICkgKSB7XG4gICAgICB0aGlzWyBrZXkgXSA9IGNsb25lKCBkZWVwLCB2YWx1ZSApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzWyBrZXkgXSA9IHZhbHVlO1xuICAgIH1cbiAgfSwgY2xuICk7XG5cbiAgcmV0dXJuIGNsbjtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBFUlI6IHtcbiAgICBJTlZBTElEX0FSR1M6ICAgICAgICAgICdJbnZhbGlkIGFyZ3VtZW50cycsXG4gICAgRlVOQ1RJT05fRVhQRUNURUQ6ICAgICAnRXhwZWN0ZWQgYSBmdW5jdGlvbicsXG4gICAgU1RSSU5HX0VYUEVDVEVEOiAgICAgICAnRXhwZWN0ZWQgYSBzdHJpbmcnLFxuICAgIFVOREVGSU5FRF9PUl9OVUxMOiAgICAgJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcsXG4gICAgUkVEVUNFX09GX0VNUFRZX0FSUkFZOiAnUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZScsXG4gICAgTk9fUEFUSDogICAgICAgICAgICAgICAnTm8gcGF0aCB3YXMgZ2l2ZW4nXG4gIH0sXG5cbiAgTUFYX0FSUkFZX0xFTkdUSDogNDI5NDk2NzI5NSxcbiAgTUFYX1NBRkVfSU5UOiAgICAgOTAwNzE5OTI1NDc0MDk5MSxcbiAgTUlOX1NBRkVfSU5UOiAgICAtOTAwNzE5OTI1NDc0MDk5MSxcblxuICBERUVQOiAgICAgICAgIDEsXG4gIERFRVBfS0VFUF9GTjogMixcblxuICBQTEFDRUhPTERFUjoge31cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkZWZpbmVQcm9wZXJ0aWVzID0gcmVxdWlyZSggJy4vZGVmaW5lLXByb3BlcnRpZXMnICk7XG5cbnZhciBzZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoICcuL3NldC1wcm90b3R5cGUtb2YnICk7XG5cbnZhciBpc1ByaW1pdGl2ZSA9IHJlcXVpcmUoICcuL2lzLXByaW1pdGl2ZScgKTtcblxuZnVuY3Rpb24gQyAoKSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gY3JlYXRlICggcHJvdG90eXBlLCBkZXNjcmlwdG9ycyApIHtcbiAgdmFyIG9iamVjdDtcblxuICBpZiAoIHByb3RvdHlwZSAhPT0gbnVsbCAmJiBpc1ByaW1pdGl2ZSggcHJvdG90eXBlICkgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCAnT2JqZWN0IHByb3RvdHlwZSBtYXkgb25seSBiZSBhbiBPYmplY3Qgb3IgbnVsbDogJyArIHByb3RvdHlwZSApO1xuICB9XG5cbiAgQy5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG5cbiAgb2JqZWN0ID0gbmV3IEMoKTtcblxuICBDLnByb3RvdHlwZSA9IG51bGw7XG5cbiAgaWYgKCBwcm90b3R5cGUgPT09IG51bGwgKSB7XG4gICAgc2V0UHJvdG90eXBlT2YoIG9iamVjdCwgbnVsbCApO1xuICB9XG5cbiAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID49IDIgKSB7XG4gICAgZGVmaW5lUHJvcGVydGllcyggb2JqZWN0LCBkZXNjcmlwdG9ycyApO1xuICB9XG5cbiAgcmV0dXJuIG9iamVjdDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiYXNlRm9yRWFjaCAgPSByZXF1aXJlKCAnLi4vYmFzZS9iYXNlLWZvci1lYWNoJyApLFxuICAgIGJhc2VGb3JJbiAgICA9IHJlcXVpcmUoICcuLi9iYXNlL2Jhc2UtZm9yLWluJyApLFxuICAgIGlzQXJyYXlMaWtlICA9IHJlcXVpcmUoICcuLi9pcy1hcnJheS1saWtlJyApLFxuICAgIHRvT2JqZWN0ICAgICA9IHJlcXVpcmUoICcuLi90by1vYmplY3QnICksXG4gICAgaXRlcmF0ZWUgICAgID0gcmVxdWlyZSggJy4uL2l0ZXJhdGVlJyApLml0ZXJhdGVlLFxuICAgIGtleXMgICAgICAgICA9IHJlcXVpcmUoICcuLi9rZXlzJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUVhY2ggKCBmcm9tUmlnaHQgKSB7XG4gIHJldHVybiBmdW5jdGlvbiBlYWNoICggb2JqLCBmbiwgY3R4ICkge1xuXG4gICAgb2JqID0gdG9PYmplY3QoIG9iaiApO1xuXG4gICAgZm4gID0gaXRlcmF0ZWUoIGZuICk7XG5cbiAgICBpZiAoIGlzQXJyYXlMaWtlKCBvYmogKSApIHtcbiAgICAgIHJldHVybiBiYXNlRm9yRWFjaCggb2JqLCBmbiwgY3R4LCBmcm9tUmlnaHQgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYmFzZUZvckluKCBvYmosIGZuLCBjdHgsIGZyb21SaWdodCwga2V5cyggb2JqICkgKTtcblxuICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBNdXN0IGJlICdXaWR0aCcgb3IgJ0hlaWdodCcgKGNhcGl0YWxpemVkKS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVHZXRFbGVtZW50RGltZW5zaW9uICggbmFtZSApIHtcblxuICAvKipcbiAgICogQHBhcmFtIHtXaW5kb3d8Tm9kZX0gZVxuICAgKi9cbiAgcmV0dXJuIGZ1bmN0aW9uICggZSApIHtcblxuICAgIHZhciB2LCBiLCBkO1xuXG4gICAgLy8gaWYgdGhlIGVsZW1lbnQgaXMgYSB3aW5kb3dcblxuICAgIGlmICggZS53aW5kb3cgPT09IGUgKSB7XG5cbiAgICAgIC8vIGlubmVyV2lkdGggYW5kIGlubmVySGVpZ2h0IGluY2x1ZGVzIGEgc2Nyb2xsYmFyIHdpZHRoLCBidXQgaXQgaXMgbm90XG4gICAgICAvLyBzdXBwb3J0ZWQgYnkgb2xkZXIgYnJvd3NlcnNcblxuICAgICAgdiA9IE1hdGgubWF4KCBlWyAnaW5uZXInICsgbmFtZSBdIHx8IDAsIGUuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50WyAnY2xpZW50JyArIG5hbWUgXSApO1xuXG4gICAgLy8gaWYgdGhlIGVsZW1lbnRzIGlzIGEgZG9jdW1lbnRcblxuICAgIH0gZWxzZSBpZiAoIGUubm9kZVR5cGUgPT09IDkgKSB7XG5cbiAgICAgIGIgPSBlLmJvZHk7XG4gICAgICBkID0gZS5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICAgIHYgPSBNYXRoLm1heChcbiAgICAgICAgYlsgJ3Njcm9sbCcgKyBuYW1lIF0sXG4gICAgICAgIGRbICdzY3JvbGwnICsgbmFtZSBdLFxuICAgICAgICBiWyAnb2Zmc2V0JyArIG5hbWUgXSxcbiAgICAgICAgZFsgJ29mZnNldCcgKyBuYW1lIF0sXG4gICAgICAgIGJbICdjbGllbnQnICsgbmFtZSBdLFxuICAgICAgICBkWyAnY2xpZW50JyArIG5hbWUgXSApO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHYgPSBlWyAnY2xpZW50JyArIG5hbWUgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gdjtcblxuICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNhc3RQYXRoID0gcmVxdWlyZSggJy4uL2Nhc3QtcGF0aCcgKSxcbiAgICBub29wICAgICA9IHJlcXVpcmUoICcuLi9ub29wJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZVByb3BlcnR5ICggYmFzZVByb3BlcnR5LCB1c2VBcmdzICkge1xuICByZXR1cm4gZnVuY3Rpb24gKCBwYXRoICkge1xuICAgIHZhciBhcmdzO1xuXG4gICAgaWYgKCAhICggcGF0aCA9IGNhc3RQYXRoKCBwYXRoICkgKS5sZW5ndGggKSB7XG4gICAgICByZXR1cm4gbm9vcDtcbiAgICB9XG5cbiAgICBpZiAoIHVzZUFyZ3MgKSB7XG4gICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoIG9iamVjdCApIHtcbiAgICAgIHJldHVybiBiYXNlUHJvcGVydHkoIG9iamVjdCwgcGF0aCwgYXJncyApO1xuICAgIH07XG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlZmF1bHRUbyAoIHZhbHVlLCBkZWZhdWx0VmFsdWUgKSB7XG4gIGlmICggdmFsdWUgIT0gbnVsbCAmJiB2YWx1ZSA9PT0gdmFsdWUgKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBtaXhpbiA9IHJlcXVpcmUoICcuL21peGluJyApLFxuICAgIGNsb25lID0gcmVxdWlyZSggJy4vY2xvbmUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVmYXVsdHMgKCBkZWZhdWx0cywgb2JqZWN0ICkge1xuICBpZiAoIG9iamVjdCA9PSBudWxsICkge1xuICAgIHJldHVybiBjbG9uZSggdHJ1ZSwgZGVmYXVsdHMgKTtcbiAgfVxuXG4gIHJldHVybiBtaXhpbiggdHJ1ZSwgY2xvbmUoIHRydWUsIGRlZmF1bHRzICksIG9iamVjdCApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHN1cHBvcnQgPSByZXF1aXJlKCAnLi9zdXBwb3J0L3N1cHBvcnQtZGVmaW5lLXByb3BlcnR5JyApO1xuXG52YXIgZGVmaW5lUHJvcGVydGllcywgYmFzZURlZmluZVByb3BlcnR5LCBpc1ByaW1pdGl2ZSwgZWFjaDtcblxuaWYgKCBzdXBwb3J0ICE9PSAnZnVsbCcgKSB7XG4gIGlzUHJpbWl0aXZlICAgICAgICA9IHJlcXVpcmUoICcuL2lzLXByaW1pdGl2ZScgKTtcbiAgZWFjaCAgICAgICAgICAgICAgID0gcmVxdWlyZSggJy4vZWFjaCcgKTtcbiAgYmFzZURlZmluZVByb3BlcnR5ID0gcmVxdWlyZSggJy4vYmFzZS9iYXNlLWRlZmluZS1wcm9wZXJ0eScgKTtcblxuICBkZWZpbmVQcm9wZXJ0aWVzID0gZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyAoIG9iamVjdCwgZGVzY3JpcHRvcnMgKSB7XG4gICAgaWYgKCBzdXBwb3J0ICE9PSAnbm90LXN1cHBvcnRlZCcgKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoIG9iamVjdCwgZGVzY3JpcHRvcnMgKTtcbiAgICAgIH0gY2F0Y2ggKCBlICkge31cbiAgICB9XG5cbiAgICBpZiAoIGlzUHJpbWl0aXZlKCBvYmplY3QgKSApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ2RlZmluZVByb3BlcnRpZXMgY2FsbGVkIG9uIG5vbi1vYmplY3QnICk7XG4gICAgfVxuXG4gICAgaWYgKCBpc1ByaW1pdGl2ZSggZGVzY3JpcHRvcnMgKSApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ1Byb3BlcnR5IGRlc2NyaXB0aW9uIG11c3QgYmUgYW4gb2JqZWN0OiAnICsgZGVzY3JpcHRvcnMgKTtcbiAgICB9XG5cbiAgICBlYWNoKCBkZXNjcmlwdG9ycywgZnVuY3Rpb24gKCBkZXNjcmlwdG9yLCBrZXkgKSB7XG4gICAgICBpZiAoIGlzUHJpbWl0aXZlKCBkZXNjcmlwdG9yICkgKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvciggJ1Byb3BlcnR5IGRlc2NyaXB0aW9uIG11c3QgYmUgYW4gb2JqZWN0OiAnICsgZGVzY3JpcHRvciApO1xuICAgICAgfVxuXG4gICAgICBiYXNlRGVmaW5lUHJvcGVydHkoIHRoaXMsIGtleSwgZGVzY3JpcHRvciApO1xuICAgIH0sIG9iamVjdCApO1xuXG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfTtcbn0gZWxzZSB7XG4gIGRlZmluZVByb3BlcnRpZXMgPSBPYmplY3QuZGVmaW5lUHJvcGVydGllcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWZpbmVQcm9wZXJ0aWVzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoICcuL2NyZWF0ZS9jcmVhdGUtZWFjaCcgKSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoICcuL2NyZWF0ZS9jcmVhdGUtZ2V0LWVsZW1lbnQtZGltZW5zaW9uJyApKCAnSGVpZ2h0JyApO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoICcuL2NyZWF0ZS9jcmVhdGUtZ2V0LWVsZW1lbnQtZGltZW5zaW9uJyApKCAnV2lkdGgnICk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBFUlIgPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICkuRVJSO1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBnZXRQcm90b3R5cGVPZiAoIG9iaiApIHtcbiAgdmFyIHByb3RvdHlwZTtcblxuICBpZiAoIG9iaiA9PSBudWxsICkge1xuICAgIHRocm93IFR5cGVFcnJvciggRVJSLlVOREVGSU5FRF9PUl9OVUxMICk7XG4gIH1cblxuICBwcm90b3R5cGUgPSBvYmouX19wcm90b19fOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG5cbiAgaWYgKCB0eXBlb2YgcHJvdG90eXBlICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICByZXR1cm4gcHJvdG90eXBlO1xuICB9XG5cbiAgaWYgKCB0b1N0cmluZy5jYWxsKCBvYmouY29uc3RydWN0b3IgKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJyApIHtcbiAgICByZXR1cm4gb2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICksXG4gICAgaXNMZW5ndGggICAgID0gcmVxdWlyZSggJy4vaXMtbGVuZ3RoJyApLFxuICAgIGlzV2luZG93TGlrZSA9IHJlcXVpcmUoICcuL2lzLXdpbmRvdy1saWtlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQXJyYXlMaWtlT2JqZWN0ICggdmFsdWUgKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UoIHZhbHVlICkgJiYgaXNMZW5ndGgoIHZhbHVlLmxlbmd0aCApICYmICEgaXNXaW5kb3dMaWtlKCB2YWx1ZSApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzTGVuZ3RoICAgICA9IHJlcXVpcmUoICcuL2lzLWxlbmd0aCcgKSxcbiAgICBpc1dpbmRvd0xpa2UgPSByZXF1aXJlKCAnLi9pcy13aW5kb3ctbGlrZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0FycmF5TGlrZSAoIHZhbHVlICkge1xuICBpZiAoIHZhbHVlID09IG51bGwgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICkge1xuICAgIHJldHVybiBpc0xlbmd0aCggdmFsdWUubGVuZ3RoICkgJiYgIWlzV2luZG93TGlrZSggdmFsdWUgKTtcbiAgfVxuXG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoICcuL2lzLW9iamVjdC1saWtlJyApLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSggJy4vaXMtbGVuZ3RoJyApO1xuXG52YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIGlzQXJyYXkgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSggdmFsdWUgKSAmJlxuICAgIGlzTGVuZ3RoKCB2YWx1ZS5sZW5ndGggKSAmJlxuICAgIHRvU3RyaW5nLmNhbGwoIHZhbHVlICkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3R5cGUgICAgPSByZXF1aXJlKCAnLi9fdHlwZScgKTtcblxudmFyIHJEZWVwS2V5ID0gLyhefFteXFxcXF0pKFxcXFxcXFxcKSooXFwufFxcWykvO1xuXG5mdW5jdGlvbiBpc0tleSAoIHZhbCApIHtcbiAgdmFyIHR5cGU7XG5cbiAgaWYgKCAhIHZhbCApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmICggX3R5cGUoIHZhbCApID09PSAnYXJyYXknICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHR5cGUgPSB0eXBlb2YgdmFsO1xuXG4gIGlmICggdHlwZSA9PT0gJ251bWJlcicgfHwgdHlwZSA9PT0gJ2Jvb2xlYW4nIHx8IF90eXBlKCB2YWwgKSA9PT0gJ3N5bWJvbCcgKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gISByRGVlcEtleS50ZXN0KCB2YWwgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0tleTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIE1BWF9BUlJBWV9MRU5HVEggPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICkuTUFYX0FSUkFZX0xFTkdUSDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0xlbmd0aCAoIHZhbHVlICkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJlxuICAgIHZhbHVlID49IDAgJiZcbiAgICB2YWx1ZSA8PSBNQVhfQVJSQVlfTEVOR1RIICYmXG4gICAgdmFsdWUgJSAxID09PSAwO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc09iamVjdExpa2UgKCB2YWx1ZSApIHtcbiAgcmV0dXJuICEhIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICk7XG5cbnZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzT2JqZWN0ICggdmFsdWUgKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UoIHZhbHVlICkgJiZcbiAgICB0b1N0cmluZy5jYWxsKCB2YWx1ZSApID09PSAnW29iamVjdCBPYmplY3RdJztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoICcuL2dldC1wcm90b3R5cGUtb2YnICk7XG5cbnZhciBpc09iamVjdCA9IHJlcXVpcmUoICcuL2lzLW9iamVjdCcgKTtcblxudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxudmFyIHRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nO1xuXG52YXIgT0JKRUNUID0gdG9TdHJpbmcuY2FsbCggT2JqZWN0ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNQbGFpbk9iamVjdCAoIHYgKSB7XG4gIHZhciBwLCBjO1xuXG4gIGlmICggISBpc09iamVjdCggdiApICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHAgPSBnZXRQcm90b3R5cGVPZiggdiApO1xuXG4gIGlmICggcCA9PT0gbnVsbCApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmICggISBoYXNPd25Qcm9wZXJ0eS5jYWxsKCBwLCAnY29uc3RydWN0b3InICkgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgYyA9IHAuY29uc3RydWN0b3I7XG5cbiAgcmV0dXJuIHR5cGVvZiBjID09PSAnZnVuY3Rpb24nICYmIHRvU3RyaW5nLmNhbGwoIGMgKSA9PT0gT0JKRUNUO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1ByaW1pdGl2ZSAoIHZhbHVlICkge1xuICByZXR1cm4gISB2YWx1ZSB8fFxuICAgIHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgJiZcbiAgICB0eXBlb2YgdmFsdWUgIT09ICdmdW5jdGlvbic7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdHlwZSA9IHJlcXVpcmUoICcuL3R5cGUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNTeW1ib2wgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIHR5cGUoIHZhbHVlICkgPT09ICdzeW1ib2wnO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoICcuL2lzLW9iamVjdC1saWtlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzV2luZG93TGlrZSAoIHZhbHVlICkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKCB2YWx1ZSApICYmIHZhbHVlLndpbmRvdyA9PT0gdmFsdWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzc2V0ICgga2V5LCBvYmogKSB7XG4gIGlmICggb2JqID09IG51bGwgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHR5cGVvZiBvYmpbIGtleSBdICE9PSAndW5kZWZpbmVkJyB8fCBrZXkgaW4gb2JqO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzQXJyYXlMaWtlT2JqZWN0ID0gcmVxdWlyZSggJy4vaXMtYXJyYXktbGlrZS1vYmplY3QnICksXG4gICAgbWF0Y2hlc1Byb3BlcnR5ICAgPSByZXF1aXJlKCAnLi9tYXRjaGVzLXByb3BlcnR5JyApLFxuICAgIHByb3BlcnR5ICAgICAgICAgID0gcmVxdWlyZSggJy4vcHJvcGVydHknICk7XG5cbmV4cG9ydHMuaXRlcmF0ZWUgPSBmdW5jdGlvbiBpdGVyYXRlZSAoIHZhbHVlICkge1xuICBpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBpZiAoIGlzQXJyYXlMaWtlT2JqZWN0KCB2YWx1ZSApICkge1xuICAgIHJldHVybiBtYXRjaGVzUHJvcGVydHkoIHZhbHVlICk7XG4gIH1cblxuICByZXR1cm4gcHJvcGVydHkoIHZhbHVlICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmFzZUtleXMgPSByZXF1aXJlKCAnLi9iYXNlL2Jhc2Uta2V5cycgKTtcbnZhciB0b09iamVjdCA9IHJlcXVpcmUoICcuL3RvLW9iamVjdCcgKTtcbnZhciBzdXBwb3J0ICA9IHJlcXVpcmUoICcuL3N1cHBvcnQvc3VwcG9ydC1rZXlzJyApO1xuXG5pZiAoIHN1cHBvcnQgIT09ICdlczIwMTUnICkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGtleXMgKCB2ICkge1xuICAgIHZhciBfa2V5cztcblxuICAgIC8qKlxuICAgICAqICsgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSArXG4gICAgICogfCBJIHRlc3RlZCB0aGUgZnVuY3Rpb25zIHdpdGggc3RyaW5nWzIwNDhdIChhbiBhcnJheSBvZiBzdHJpbmdzKSBhbmQgaGFkIHxcbiAgICAgKiB8IHRoaXMgcmVzdWx0cyBpbiBub2RlLmpzICh2OC4xMC4wKTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAqICsgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSArXG4gICAgICogfCBiYXNlS2V5cyB4IDEwLDY3NCBvcHMvc2VjIMKxMC4yMyUgKDk0IHJ1bnMgc2FtcGxlZCkgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICogfCBPYmplY3Qua2V5cyB4IDIyLDE0NyBvcHMvc2VjIMKxMC4yMyUgKDk1IHJ1bnMgc2FtcGxlZCkgICAgICAgICAgICAgICAgICB8XG4gICAgICogfCBGYXN0ZXN0IGlzIFwiT2JqZWN0LmtleXNcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAqICsgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSArXG4gICAgICovXG5cbiAgICBpZiAoIHN1cHBvcnQgPT09ICdlczUnICkge1xuICAgICAgX2tleXMgPSBPYmplY3Qua2V5cztcbiAgICB9IGVsc2Uge1xuICAgICAgX2tleXMgPSBiYXNlS2V5cztcbiAgICB9XG5cbiAgICByZXR1cm4gX2tleXMoIHRvT2JqZWN0KCB2ICkgKTtcbiAgfTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmtleXM7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYXN0UGF0aCA9IHJlcXVpcmUoICcuL2Nhc3QtcGF0aCcgKSxcbiAgICBnZXQgICAgICA9IHJlcXVpcmUoICcuL2Jhc2UvYmFzZS1nZXQnICksXG4gICAgRVJSICAgICAgPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICkuRVJSO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1hdGNoZXNQcm9wZXJ0eSAoIHByb3BlcnR5ICkge1xuXG4gIHZhciBwYXRoICA9IGNhc3RQYXRoKCBwcm9wZXJ0eVsgMCBdICksXG4gICAgICB2YWx1ZSA9IHByb3BlcnR5WyAxIF07XG5cbiAgaWYgKCAhIHBhdGgubGVuZ3RoICkge1xuICAgIHRocm93IEVycm9yKCBFUlIuTk9fUEFUSCApO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICggb2JqZWN0ICkge1xuXG4gICAgaWYgKCBvYmplY3QgPT0gbnVsbCApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIHBhdGgubGVuZ3RoID4gMSApIHtcbiAgICAgIHJldHVybiBnZXQoIG9iamVjdCwgcGF0aCwgMCApID09PSB2YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqZWN0WyBwYXRoWyAwIF0gXSA9PT0gdmFsdWU7XG5cbiAgfTtcblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzUGxhaW5PYmplY3QgPSByZXF1aXJlKCAnLi9pcy1wbGFpbi1vYmplY3QnICk7XG5cbnZhciB0b09iamVjdCA9IHJlcXVpcmUoICcuL3RvLW9iamVjdCcgKTtcblxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCAnLi9pcy1hcnJheScgKTtcblxudmFyIGtleXMgPSByZXF1aXJlKCAnLi9rZXlzJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1peGluICggZGVlcCwgb2JqZWN0ICkge1xuXG4gIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcblxuICB2YXIgaSA9IDI7XG5cblxuICB2YXIgbmFtZXMsIGV4cCwgaiwgaywgdmFsLCBrZXksIG5vd0FycmF5LCBzcmM7XG5cbiAgLy8gIG1peGluKCB7fSwge30gKVxuXG4gIGlmICggdHlwZW9mIGRlZXAgIT09ICdib29sZWFuJyApIHtcbiAgICBvYmplY3QgPSBkZWVwO1xuICAgIGRlZXAgICA9IHRydWU7XG4gICAgaSAgICAgID0gMTtcbiAgfVxuXG4gIC8vIHZhciBleHRlbmRhYmxlID0ge1xuICAvLyAgIGV4dGVuZDogcmVxdWlyZSggJ3BlYWtvL21peGluJyApXG4gIC8vIH07XG5cbiAgLy8gZXh0ZW5kYWJsZS5leHRlbmQoIHsgbmFtZTogJ0V4dGVuZGFibGUgT2JqZWN0JyB9ICk7XG5cbiAgaWYgKCBpID09PSBsICkge1xuXG4gICAgb2JqZWN0ID0gdGhpczsgLy8ganNoaW50IGlnbm9yZTogbGluZVxuXG4gICAgLS1pO1xuXG4gIH1cblxuICBvYmplY3QgPSB0b09iamVjdCggb2JqZWN0ICk7XG5cbiAgZm9yICggOyBpIDwgbDsgKytpICkge1xuICAgIG5hbWVzID0ga2V5cyggZXhwID0gdG9PYmplY3QoIGFyZ3VtZW50c1sgaSBdICkgKTtcblxuICAgIGZvciAoIGogPSAwLCBrID0gbmFtZXMubGVuZ3RoOyBqIDwgazsgKytqICkge1xuICAgICAgdmFsID0gZXhwWyBrZXkgPSBuYW1lc1sgaiBdIF07XG5cbiAgICAgIGlmICggZGVlcCAmJiB2YWwgIT09IGV4cCAmJiAoIGlzUGxhaW5PYmplY3QoIHZhbCApIHx8ICggbm93QXJyYXkgPSBpc0FycmF5KCB2YWwgKSApICkgKSB7XG4gICAgICAgIHNyYyA9IG9iamVjdFsga2V5IF07XG5cbiAgICAgICAgaWYgKCBub3dBcnJheSApIHtcbiAgICAgICAgICBpZiAoICEgaXNBcnJheSggc3JjICkgKSB7XG4gICAgICAgICAgICBzcmMgPSBbXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBub3dBcnJheSA9IGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKCAhIGlzUGxhaW5PYmplY3QoIHNyYyApICkge1xuICAgICAgICAgIHNyYyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgb2JqZWN0WyBrZXkgXSA9IG1peGluKCB0cnVlLCBzcmMsIHZhbCApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2JqZWN0WyBrZXkgXSA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiBvYmplY3Q7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5vb3AgKCkge307XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gRGF0ZS5ub3cgfHwgZnVuY3Rpb24gbm93ICgpIHtcbiAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJlZm9yZSA9IHJlcXVpcmUoICcuL2JlZm9yZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBvbmNlICggdGFyZ2V0ICkge1xuICByZXR1cm4gYmVmb3JlKCAxLCB0YXJnZXQgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSggJy4vY3JlYXRlL2NyZWF0ZS1wcm9wZXJ0eScgKSggcmVxdWlyZSggJy4vYmFzZS9iYXNlLXByb3BlcnR5JyApICk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc1ByaW1pdGl2ZSA9IHJlcXVpcmUoICcuL2lzLXByaW1pdGl2ZScgKSxcbiAgICBFUlIgICAgICAgICA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5FUlI7XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIHNldFByb3RvdHlwZU9mICggdGFyZ2V0LCBwcm90b3R5cGUgKSB7XG4gIGlmICggdGFyZ2V0ID09IG51bGwgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCBFUlIuVU5ERUZJTkVEX09SX05VTEwgKTtcbiAgfVxuXG4gIGlmICggcHJvdG90eXBlICE9PSBudWxsICYmIGlzUHJpbWl0aXZlKCBwcm90b3R5cGUgKSApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoICdPYmplY3QgcHJvdG90eXBlIG1heSBvbmx5IGJlIGFuIE9iamVjdCBvciBudWxsOiAnICsgcHJvdG90eXBlICk7XG4gIH1cblxuICBpZiAoICdfX3Byb3RvX18nIGluIHRhcmdldCApIHtcbiAgICB0YXJnZXQuX19wcm90b19fID0gcHJvdG90eXBlOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHN1cHBvcnQ7XG5cbmZ1bmN0aW9uIHRlc3QgKCB0YXJnZXQgKSB7XG4gIHRyeSB7XG4gICAgaWYgKCAnJyBpbiBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHRhcmdldCwgJycsIHt9ICkgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gY2F0Y2ggKCBlICkge31cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmlmICggdGVzdCgge30gKSApIHtcbiAgc3VwcG9ydCA9ICdmdWxsJztcbn0gZWxzZSBpZiAoIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGVzdCggZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICkgKSApIHtcbiAgc3VwcG9ydCA9ICdkb20nO1xufSBlbHNlIHtcbiAgc3VwcG9ydCA9ICdub3Qtc3VwcG9ydGVkJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3VwcG9ydDtcblxuaWYgKCBPYmplY3Qua2V5cyApIHtcbiAgdHJ5IHtcbiAgICBzdXBwb3J0ID0gT2JqZWN0LmtleXMoICcnICksICdlczIwMTUnOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG4gIH0gY2F0Y2ggKCBlICkge1xuICAgIHN1cHBvcnQgPSAnZXM1JztcbiAgfVxufSBlbHNlIGlmICggeyB0b1N0cmluZzogbnVsbCB9LnByb3BlcnR5SXNFbnVtZXJhYmxlKCAndG9TdHJpbmcnICkgKSB7XG4gIHN1cHBvcnQgPSAnbm90LXN1cHBvcnRlZCc7XG59IGVsc2Uge1xuICBzdXBwb3J0ID0gJ2hhcy1hLWJ1Zyc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VwcG9ydDtcbiIsIi8qKlxuICogQmFzZWQgb24gRXJpayBNw7ZsbGVyIHJlcXVlc3RBbmltYXRpb25GcmFtZSBwb2x5ZmlsbDpcbiAqXG4gKiBBZGFwdGVkIGZyb20gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vcGF1bGlyaXNoLzE1Nzk2NzEgd2hpY2ggZGVyaXZlZCBmcm9tXG4gKiBodHRwOi8vcGF1bGlyaXNoLmNvbS8yMDExL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtYW5pbWF0aW5nL1xuICogaHR0cDovL215Lm9wZXJhLmNvbS9lbW9sbGVyL2Jsb2cvMjAxMS8xMi8yMC9yZXF1ZXN0YW5pbWF0aW9uZnJhbWUtZm9yLXNtYXJ0LWVyLWFuaW1hdGluZ1xuICpcbiAqIHJlcXVlc3RBbmltYXRpb25GcmFtZSBwb2x5ZmlsbCBieSBFcmlrIE3DtmxsZXIuXG4gKiBGaXhlcyBmcm9tIFBhdWwgSXJpc2gsIFRpbm8gWmlqZGVsLCBBbmRyZXcgTWFvLCBLbGVtZW4gU2xhdmnEjSwgRGFyaXVzIEJhY29uLlxuICpcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGltZXN0YW1wID0gcmVxdWlyZSggJy4vdGltZXN0YW1wJyApO1xuXG52YXIgcmVxdWVzdEFGLCBjYW5jZWxBRjtcblxuaWYgKCB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgY2FuY2VsQUYgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cud2Via2l0Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cud2Via2l0Q2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1vekNhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgcmVxdWVzdEFGID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xufVxuXG52YXIgbm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSAhIHJlcXVlc3RBRiB8fCAhIGNhbmNlbEFGIHx8XG4gIHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIC9pUChhZHxob25lfG9kKS4qT1NcXHM2Ly50ZXN0KCBuYXZpZ2F0b3IudXNlckFnZW50ICk7XG5cbmlmICggbm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKSB7XG4gIHZhciBsYXN0UmVxdWVzdFRpbWUgPSAwLFxuICAgICAgZnJhbWVEdXJhdGlvbiAgID0gMTAwMCAvIDYwO1xuXG4gIGV4cG9ydHMucmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3QgKCBhbmltYXRlICkge1xuICAgIHZhciBub3cgICAgICAgICAgICAgPSB0aW1lc3RhbXAoKSxcbiAgICAgICAgbmV4dFJlcXVlc3RUaW1lID0gTWF0aC5tYXgoIGxhc3RSZXF1ZXN0VGltZSArIGZyYW1lRHVyYXRpb24sIG5vdyApO1xuXG4gICAgcmV0dXJuIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxhc3RSZXF1ZXN0VGltZSA9IG5leHRSZXF1ZXN0VGltZTtcbiAgICAgIGFuaW1hdGUoIG5vdyApO1xuICAgIH0sIG5leHRSZXF1ZXN0VGltZSAtIG5vdyApO1xuICB9O1xuXG4gIGV4cG9ydHMuY2FuY2VsID0gY2xlYXJUaW1lb3V0O1xufSBlbHNlIHtcbiAgZXhwb3J0cy5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdCAoIGFuaW1hdGUgKSB7XG4gICAgcmV0dXJuIHJlcXVlc3RBRiggYW5pbWF0ZSApO1xuICB9O1xuXG4gIGV4cG9ydHMuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsICggaWQgKSB7XG4gICAgcmV0dXJuIGNhbmNlbEFGKCBpZCApO1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbm93ID0gcmVxdWlyZSggJy4vbm93JyApO1xudmFyIG5hdmlnYXRvclN0YXJ0O1xuXG5pZiAoIHR5cGVvZiBwZXJmb3JtYW5jZSA9PT0gJ3VuZGVmaW5lZCcgfHwgISBwZXJmb3JtYW5jZS5ub3cgKSB7XG4gIG5hdmlnYXRvclN0YXJ0ID0gbm93KCk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0aW1lc3RhbXAgKCkge1xuICAgIHJldHVybiBub3coKSAtIG5hdmlnYXRvclN0YXJ0O1xuICB9O1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0aW1lc3RhbXAgKCkge1xuICAgIHJldHVybiBwZXJmb3JtYW5jZS5ub3coKTtcbiAgfTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF91bmVzY2FwZSA9IHJlcXVpcmUoICcuL191bmVzY2FwZScgKSxcbiAgICBpc1N5bWJvbCAgPSByZXF1aXJlKCAnLi9pcy1zeW1ib2wnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9LZXkgKCB2YWwgKSB7XG4gIHZhciBrZXk7XG5cbiAgaWYgKCB0eXBlb2YgdmFsID09PSAnc3RyaW5nJyApIHtcbiAgICByZXR1cm4gX3VuZXNjYXBlKCB2YWwgKTtcbiAgfVxuXG4gIGlmICggaXNTeW1ib2woIHZhbCApICkge1xuICAgIHJldHVybiB2YWw7XG4gIH1cblxuICBrZXkgPSAnJyArIHZhbDtcblxuICBpZiAoIGtleSA9PT0gJzAnICYmIDEgLyB2YWwgPT09IC1JbmZpbml0eSApIHtcbiAgICByZXR1cm4gJy0wJztcbiAgfVxuXG4gIHJldHVybiBfdW5lc2NhcGUoIGtleSApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEVSUiA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5FUlI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9PYmplY3QgKCB2YWx1ZSApIHtcbiAgaWYgKCB2YWx1ZSA9PSBudWxsICkge1xuICAgIHRocm93IFR5cGVFcnJvciggRVJSLlVOREVGSU5FRF9PUl9OVUxMICk7XG4gIH1cblxuICByZXR1cm4gT2JqZWN0KCB2YWx1ZSApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNyZWF0ZSA9IHJlcXVpcmUoICcuL2NyZWF0ZScgKTtcblxudmFyIHRvU3RyaW5nID0ge30udG9TdHJpbmcsXG4gICAgdHlwZXMgPSBjcmVhdGUoIG51bGwgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRUeXBlICggdmFsdWUgKSB7XG4gIHZhciB0eXBlLCB0YWc7XG5cbiAgaWYgKCB2YWx1ZSA9PT0gbnVsbCApIHtcbiAgICByZXR1cm4gJ251bGwnO1xuICB9XG5cbiAgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcblxuICBpZiAoIHR5cGUgIT09ICdvYmplY3QnICYmIHR5cGUgIT09ICdmdW5jdGlvbicgKSB7XG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cblxuICB0eXBlID0gdHlwZXNbIHRhZyA9IHRvU3RyaW5nLmNhbGwoIHZhbHVlICkgXTtcblxuICBpZiAoIHR5cGUgKSB7XG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cblxuICByZXR1cm4gKCB0eXBlc1sgdGFnIF0gPSB0YWcuc2xpY2UoIDgsIC0xICkudG9Mb3dlckNhc2UoKSApO1xufTtcbiJdfQ==
