'use strict'; // eslint-disable-line lines-around-directive
var isObjectLike = require( 'peako/is-object-like' );
var getElementW = require( 'peako/get-element-w' );
var getElementH = require( 'peako/get-element-h' );
var constants = require( '../constants' );
var createPolygon = require( '../internal/create_polygon' );
var polygons = require( '../internal/polygons' );
var setDefaultDrawingSettings = require( './internal/set_default_drawing_settings' );
var getWebGL = require( './internal/get_webgl' );
var copyDrawingSettings = require( './internal/copy_drawing_settings' );
var align = require( './internal/align' );
var options = require( './settings' );
/**
 * Абстрактный класс AbstractRenderer - это основа для {@link v6.RendererGL} и {@link v6.Renderer2D}.
 * @abstract
 * @constructor v6.AbstractRenderer
 * @param {object}   options {@link v6.options}
 * @param {constant} type    Тип рендерера: 2D (`RENDERER_2D`) или WebGL (`RENDERER_GL`).
 */
function AbstractRenderer () {} // eslint-disable-line no-empty-function, brace-rules/brace-on-same-line
AbstractRenderer.prototype = {
  /**
   * Добавляет `canvas` в DOM.
   * @method v6.AbstractRenderer#append
   * @param {Element} [parent=document.body] Элемент, в который {@link v6.AbstractRenderer#canvas}
   *                                         должен быть добавлен.
   * @chainable
   */
  append: function append ( parent )
  {
    ( parent || document.body ).appendChild( this.canvas );
    return this;
  },
  /**
   * Удаляет {@link v6.AbstractRenderer#canvas} из DOM.
   * @method v6.AbstractRenderer#destroy
   * @chainable
   */
  destroy: function destroy ()
  {
    this.canvas.parentNode.removeChild( this.canvas );
    return this;
  },
  push: function push ()
  {
    if ( this._stack[ ++this._stackIndex ] ) {
      copyDrawingSettings( this._stack[ this._stackIndex ], this );
    } else {
      this._stack.push( setDefaultDrawingSettings( {}, this ) );
    }
    return this;
  },
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
   * @param {number} w
   * @param {number} h
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
   * @param {Element} element
   */
  resizeTo: function resizeTo ( element )
  {
    return this.resize( getElementW( element ), getElementH( element ) );
  },
  rescale: function rescale ()
  {
    return this.resizeTo( this.canvas );
  },
  /**
   * @param {number|string|v6.Image|v6.CompoundedImage} r R value (RGBA), H value (HSLA), an image, or a string color.
   * @param {number} g G value (RGBA), S value (HSLA).
   * @param {number} b B value (RGBA), L value (HSLA).
   * @param {number} a A value (RGBA or HSLA).
   */
  background: function background ( r, g, b, a )
  {
    if ( isObjectLike( r ) ) {
      return this.backgroundImage( r );
    }
    return this.backgroundColor( r, g, b, a );
  },
  _polygon: function _polygon ( x, y, rx, ry, n, a, degrees )
  {
    var polygon = polygons[ n ];
    var matrix = this.matrix;
    if ( ! polygon ) {
      polygon = polygons[ n ] = createPolygon( n ); // eslint-disable-line no-multi-assign
    }
    if ( degrees ) {
      a *= Math.PI / 180;
    }
    matrix.save();
    matrix.translate( x, y );
    matrix.rotate( a );
    this.drawArrays( polygon, polygon.length * 0.5, null, rx, ry );
    matrix.restore();
    return this;
  },
  /**
   * Рисует многоугольник.
   * @method v6.AbstractRenderer#polygon
   * @param {number} x
   * @param {number} y
   * @param {number} r   Радиус многоугольника.
   * @param {number} n   Количество сторон многоугольника.
   * @param {number} [a] Угол поворота. В целях оптимизации вместо {@link v6.AbstractRenderer#rotate}
   *                     для поворота можно использовать этот параметр.
   * @chainable
   */
  polygon: function polygon ( x, y, r, n, a )
  {
    if ( n % 1 ) {
      n = Math.floor( n * 100 ) * 0.01;
    }
    if ( typeof a === 'undefined' ) {
      this._polygon( x, y, r, r, n, -Math.PI * 0.5 );
    } else {
      this._polygon( x, y, r, r, n, a, options.degrees );
    }
    return this;
  },
  lineWidth: function lineWidth ( number )
  {
    this._lineWidth = number;
    return this;
  },
  /**
   * Устанавливает stroke color.
   * @method v6.AbstractRenderer#stroke
   * @param {number|object|boolean} [r] Может быть {@link v6.RGBA} или {@link v6.HSLA}
   *                                    чтобы поставить stroke color. Если это boolean, то включит
   *                                    или отключит stroke color.
   * @param {number}                [g]
   * @param {number}                [b]
   * @param {number}                [a]
   * @chainable
   * @example
   * renderer.stroke( new HSLA( 0, 100, 50 ) );
   * renderer.stroke( 'magenta' );
   * renderer.stroke( 255, 0, 0, 0.5 );
   * renderer.noStroke().stroke( true );
   */
  stroke: function stroke ( r, g, b, a ) { if ( typeof r === 'undefined' ) { this._stroke(); } else if ( typeof r === 'boolean' ) { this._doStroke = r; } else { if ( typeof r === 'string' || this._strokeColor.type !== this.settings.color.type ) { this._strokeColor = new this.settings.color( r, g, b, a ); } else { this._strokeColor.set( r, g, b, a ); } this._doStroke = true; } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line
  /**
   * Устанавливает fill color.
   * @method v6.AbstractRenderer#fill
   * @see {@link v6.AbstractRenderer#stroke}
   */
  fill: function fill ( r, g, b, a ) { if ( typeof r === 'undefined' ) { this._fill(); } else if ( typeof r === 'boolean' ) { this._doFill = r; } else { if ( typeof r === 'string' || this._fillColor.type !== this.settings.color.type ) { this._fillColor = new this.settings.color( r, g, b, a ); } else { this._fillColor.set( r, g, b, a ); } this._doFill = true; } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line
  /**
   * @method v6.AbstractRenderer#setTransform
   * @param {number|v6.Camera} m11
   * @param {number}           [m12]
   * @param {number}           [m21]
   * @param {number}           [m22]
   * @param {number}           [dx]
   * @param {number}           [dy]
   * @chainable
   */
  setTransform: function setTransform ( m11, m12, m21, m22, dx, dy )
  {
    var position, zoom;
    if ( typeof m11 === 'object' ) {
      position = m11.position;
      zoom = m11.zoom;
      this.matrix.setTransform( zoom, 0, 0, zoom, position[ 0 ] * zoom, position[ 1 ] * zoom );
    } else {
      this.matrix.setTransform( m11, m12, m21, m22, dx, dy );
    }
    return this;
  },
  /**
   * @method v6.AbstractRenderer#backgroundPositionX
   * @param  {number}   value
   * @param  {constant} [type=VALUE]
   * @chainable
   * @example
   * renderer.backgroundPositionX( constants.get( 'CENTER' ), constants.get( 'CONSTANT' ) );
   * renderer.backgroundPositionX( 0.5, constants.get( 'PERCENTAGES' ) );
   * renderer.backgroundPositionX( renderer.w / 2 );
   */
  backgroundPositionX: function backgroundPositionX ( value, type ) { if ( typeof type !== 'undefined' && type !== constants.get( 'VALUE' ) ) { if ( type === constants.get( 'CONSTANT' ) ) { type = constants.get( 'PERCENTAGES' ); if ( value === constants.get( 'LEFT' ) ) { value = 0; } else if ( value === constants.get( 'CENTER' ) ) { value = 0.5; } else if ( value === constants.get( 'RIGHT' ) ) { value = 1; } else { throw Error( 'Got unknown value. The known are: ' + "LEFT" + ', ' + "CENTER" + ', ' + "RIGHT" ); } } if ( type === constants.get( 'PERCENTAGES' ) ) { value *= this.w; } else { throw Error( 'Got unknown `value` type. The known are: VALUE, PERCENTAGES, CONSTANT' ); } } this._backgroundPositionX = value; return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line
  /**
   * @method v6.AbstractRenderer#backgroundPositionY
   * @param  {number}   value
   * @param  {constant} [type=VALUE]
   * @chainable
   * @example
   * renderer.backgroundPositionY( constants.get( 'MIDDLE' ), constants.get( 'CONSTANT' ) );
   * renderer.backgroundPositionY( 0.5, constants.get( 'PERCENTAGES' ) );
   * renderer.backgroundPositionY( renderer.h / 2 );
   */
  backgroundPositionY: function backgroundPositionY ( value, type ) { if ( typeof type !== 'undefined' && type !== constants.get( 'VALUE' ) ) { if ( type === constants.get( 'CONSTANT' ) ) { type = constants.get( 'PERCENTAGES' ); if ( value === constants.get( 'LEFT' ) ) { value = 0; } else if ( value === constants.get( 'CENTER' ) ) { value = 0.5; } else if ( value === constants.get( 'RIGHT' ) ) { value = 1; } else { throw Error( 'Got unknown value. The known are: ' + "TOP" + ', ' + "MIDDLE" + ', ' + "BOTTOM" ); } } if ( type === constants.get( 'PERCENTAGES' ) ) { value *= this.h; } else { throw Error( 'Got unknown `value` type. The known are: VALUE, PERCENTAGES, CONSTANT' ); } } this._backgroundPositionX = value; return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line
  /**
   * Отрисовывает картинку.
   * @method v6.AbstractRenderer#image
   * @param {v6.Image|v6.CompoundedImage} image
   * @param {number}                      x
   * @param {number}                      y
   * @param {number}                      w
   * @param {number}                      h
   * @chainable
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
      this.drawImage( image, align( x, w, this._rectAlignX ), align( y, h, this._rectAlignY ), w, h );
    }
    return this;
  },
  closeShape: function closeShape ()
  {
    this._closeShape = true;
    return this;
  },
  /**
   * @method v6.AbstractRenderer#beginShape
   * @param {constant} [type] POINTS, LINES.
   * @chainable
   * @example
   * renderer.beginShape( { type: v6.constants.get( 'POINTS' ) } );
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
   * @method v6.AbstractRenderer#vertex
   * @param {number} x
   * @param {number} y
   * @chainable
   */
  vertex: function vertex ( x, y )
  {
    this._vertices.push( Math.floor( x ), Math.floor( y ) );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#endShape
   * @param {object}   [options]
   * @param {boolean}  [options.close]
   * @param {constant} [options.type]
   * @chainable
   * @example
   * renderer.endShape( { close: true } );
   */
  endShape: function endShape ()
  {
    throw Error( 'not impemented now' );
  },
  /**
   * @method v6.AbstractRenderer#transform
   * @param  {number}  m11 X scale.
   * @param  {number}  m12 X skew.
   * @param  {number}  m21 Y skew.
   * @param  {number}  m22 Y scale.
   * @param  {number}  dx  X translate.
   * @param  {number}  dy  Y translate.
   * @chainable
   * @see v6.Transform#transform
   * @see v6.mat3.transform
   */
  transform: function transform ( m11, m12, m21, m22, dx, dy )
  {
    this.matrix.transform( m11, m12, m21, m22, dx, dy );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#translate
   * @param  {number}  x - X translate.
   * @param  {number}  y - Y translate.
   * @chainable
   * @see v6.Transform#translate
   * @see v6.mat3.translate
   */
  translate: function translate ( x, y )
  {
    this.matrix.translate( x, y );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#restore
   * @chainable
   * @see v6.Transform#restore
   */
  restore: function restore ()
  {
    this.matrix.restore();
    return this;
  },
  constructor: AbstractRenderer
};
[
  'scale',
  'save'
].forEach( function ( name )
{
  AbstractRenderer.prototype[ name ] = Function( 'a, b, c, d, e, f', 'return this.matrix.' + name + '( a, b, c, d, e, f ), this;' ); // jshint ignore: line
} );
/**
 * Инициализирует рендерер на `self`.
 * @static
 * @method v6.AbstractRenderer.create
 * @param  {v6.AbstractRenderer} self    The renderer.
 * @param  {object}              options {@link v6.options}
 * @param  {constant}            type    Тип рендерера: 2D `RENDERER_2D` или WebGL `RENDERER_GL`.
 *                                       Не может быть `RENDERER_AUTO`!.
 * @return {void}
 */
AbstractRenderer.create = function create ( self, options, type )
{
  var context;
  /**
   * @member {HTMLCanvasElement} v6.AbstractRenderer#canvas
   */
  if ( options.canvas ) {
    self.canvas = options.canvas;
  } else {
    self.canvas = document.createElement( 'canvas' );
    self.canvas.innerHTML = 'Unable to run this application.';
  }
  if ( typeof options.append === 'undefined' || options.append ) {
    self.append();
  }
  if ( type === constants.get( 'RENDERER_2D' ) ) {
    context = '2d';
  } else if ( type !== constants.get( 'RENDERER_GL' ) ) {
    throw Error( 'Got unknown renderer type. The known are: `RENDERER_2D` and `RENDERER_GL`' );
  } else if ( ! ( context = getWebGL() ) ) {
    throw Error( 'Cannot get WebGL context. Try to use `RENDERER_2D` as the renderer type or `v6.Renderer2D` instead of `v6.RendererGL`' );
  }
  /**
   * @member {object} v6.AbstractRenderer#context
   */
  self.context = self.canvas.getContext( context, {
    alpha: options.alpha
  } );
  /**
   * @member {object} v6.AbstractRenderer#settings
   */
  self.settings = options.settings;
  /**
   * @member {constant} v6.AbstractRenderer#type
   */
  self.type = type;
  /**
   * @private
   * @member {Array.<object>} v6.AbstractRenderer#_stack
   */
  self._stack = [];
  /**
   * @private
   * @member {number} v6.AbstractRenderer#_stackIndex
   */
  self._stackIndex = -1;
  /**
   * Выглядит так: `[ x1, y1, x2, y2 ]`.
   * @private
   * @member {Array.<number>} v6.AbstractRenderer#_vertices
   */
  self._vertices = [];
  if ( 'w' in options || 'h' in options ) {
    self.resize( options.w, options.h );
  } else {
    self.resizeTo( window );
  }
  setDefaultDrawingSettings( self, self );
};
/**
 * Заполняет фон цветом.
 * @virtual
 * @method v6.AbstractRenderer#backgroundColor
 * @param {number|string|v6.RGBA|v6.HSLA} r
 * @param {number}                        g
 * @param {number}                        b
 * @param {number}                        a
 * @chainable
 */
/**
 * Заполняет фон картинкой.
 * @virtual
 * @method v6.AbstractRenderer#backgroundImage
 * @param {v6.Image|v6.CompoundedImage} image
 * @chainable
 * @example
 * var Image = require( 'v6.js/Image' );
 * var image = new Image( './assets/background.jpg' );
 * renderer.backgroundImage( Image.stretch( image, renderer.w, renderer.h ) );
 */
/**
 * Очищает контекст.
 * @virtual
 * @method v6.AbstractRenderer#clear
 * @chainable
 * @example
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
 * // triangle
 * var vertices = new Float32Array( [
 *   0, 0,
 *   1, 1,
 *   0, 1
 * ] );
 *
 * // draws triangle
 * renderer.drawArrays( vertices, 3 );
 */
/**
 * @virtual
 * @method v6.AbstractRenderer#drawImage
 * @param {v6.Image|v6.CompoundedImage} image
 * @param {number}                      x
 * @param {number}                      y
 * @param {number}                      w
 * @param {number}                      h
 * @chainable
 */
/**
 * Рисует прямоугольник.
 * @virtual
 * @method v6.AbstractRenderer#rect
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @chainable
 */
/**
 * Рисует круг.
 * @virtual
 * @method v6.AbstractRenderer#arc
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @chainable
 */
module.exports = AbstractRenderer;
