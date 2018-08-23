'use strict';

var isObjectLike = require( 'peako/is-object-like' );
var getElementW  = require( 'peako/get-element-w' );
var getElementH  = require( 'peako/get-element-h' );
var baseForIn    = require( 'peako/base/base-for-in' );

var _setDefaultDrawingSettings = require( './_set-default-drawing-settings' );
var _copyDrawingSettings       = require( './_copy-drawing-settings' );
var _getGLContextName          = require( './_get-gl-context-name' );
var _createPolygon             = require( './_create-polygon' );
var _polygons                  = require( './_polygons' );
var constants                  = require( './constants' );
var options                    = require( './options' );

var rendererIndex = 0;

function Renderer ( options, mode ) {

  var getContextOptions = {
    alpha: options.alpha
  };

  if ( options.canvas ) {
    this.canvas = options.canvas;
  } else {
    this.canvas = document.createElement( 'canvas' );
    this.canvas.innerHTML = 'Unable to run the application.';
  }

  if ( options.append ) {
    this.add();
  }

  if ( mode === constants.MODE_2D ) {
    this.context = this.canvas.getContext( '2d', getContextOptions );
  } else if ( mode === constants.MODE_GL ) {
    if ( ( mode = _getGLContextName() ) ) {
      this.context = this.canvas.getContext( mode, getContextOptions );
    } else {
      throw Error( 'Cannot get WebGL context. Try to use v6.constants.MODE_GL as the renderer mode or v6.Renderer2D instead of v6.RendererGL' );
    }
  }

  this.settings    = options.settings;

  this.mode        = mode;

  this.index       = rendererIndex;

  /**
   * A stack for use in the push and pop functions to save the drawing settings.
   */
  this._stack      = [];

  this._stackIndex = -1;

  /*
   * An accumulator for vertices in the functions beginShape, vertex, endShape.
   */
  this._vertices   = [];

  _setDefaultDrawingSettings( this, this );

  if ( 'w' in options || 'h' in options ) {
    this.resize( options.w, options.h );
  } else {
    this.resizeTo( window );
  }

  // Increment the count of created renderers.

  rendererIndex += 1;

}

Renderer.prototype = {

  /**
   * @param {Element} parent
   */
  add: function add ( parent ) {

    ( parent || document.body ).appendChild( this.canvas );

    return this;

  },

  destroy: function destroy () {

    this.canvas.parentNode.removeChild( this.canvas );

    return this;

  },

  push: function push () {

    if ( this._stack[ ++this._stackIndex ] ) {
      _copyDrawingSettings( this._stack[ this._stackIndex ], this );
    } else {
      this._stack.push( _setDefaultDrawingSettings( {}, this ) );
    }

    return this;

  },

  pop: function pop () {

    if ( this._stackIndex >= 0 ) {
      _copyDrawingSettings( this, this._stack[ this._stackIndex-- ] );
    } else {
      _setDefaultDrawingSettings( this, this );
    }

    return this;

  },

  /**
   * @param {number} w
   * @param {number} h
   */
  resize: function resize ( w, h ) {

    var canvas = this.canvas;

    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';

    var scale = this.settings.scale;

    canvas.width  = this.w = Math.floor( w * scale );
    canvas.height = this.h = Math.floor( h * scale );

    return this;

  },

  /**
   * @param {Element} element
   */
  resizeTo: function resizeTo ( element ) {
    return this.resize( getElementW( element ), getElementH( element ) );
  },

  rescale: function rescale () {
    return this.resizeTo( this.canvas );
  },

  /**
   * @param {number|string|v6.Image|v6.CompoundedImage} r R value (RGBA), H value (HSLA), an image, or a string color.
   * @param {number} g G value (RGBA), S value (HSLA).
   * @param {number} b B value (RGBA), L value (HSLA).
   * @param {number} a A value (RGBA or HSLA).
   */
  background: function background ( r, g, b, a ) {
    if ( isObjectLike( r ) ) {
      return this.backgroundImage( r );
    }

    return this.backgroundColor( r, g, b, a );
  },

  _polygon: function _polygon ( x, y, rx, ry, n, a, degrees ) {
    var polygon = _polygons[ n ];
    var matrix = this.matrix;

    if ( ! polygon ) {
      polygon = _polygons[ n ] = _createPolygon( n );
    }

    if ( degrees ) {
      a *= Math.PI / 180;
    }

    matrix.save();
    matrix.translate( x, y );
    matrix.rotate( a );
    this.vertices( polygon, polygon.length * 0.5, null, rx, ry );
    matrix.restore();

    return this;
  },

  polygon: function polygon ( x, y, r, n, a ) {
    if ( n % 1 ) {
      n = Math.floor( n * 100 ) * 0.01;
    }

    if ( typeof a !== 'undefined' ) {
      this._polygon( x, y, r, r, n, a, options.degrees );
    } else {
      this._polygon( x, y, r, r, n, -Math.PI * 0.5 );
    }

    return this;
  },

  noStroke: function noStroke () {
    this._doStroke = false;
    return this;
  },

  noFill: function noFill () {
    this._doFill = false;
    return this;
  },

  setTransformFromCamera: function setTransformFromCamera ( camera ) {

    var position = camera.position;
    var zoom     = camera.zoom;

    this.matrix.setTransform( zoom, 0, 0, zoom, position[ 0 ] * zoom, position[ 1 ] * zoom );

    return this;

  },

  lineWidth: function lineWidth ( number ) {
    this._lineW = number;
    return this;
  },

  constructor: Renderer

};

baseForIn( { stroke: 'Stroke', fill: 'Fill' }, function ( Name, name ) {
  var _nameColor = '_' + name + 'Color',
      _doName = '_do' + Name,
      _name = '_' + name;

  Renderer.prototype[ name ] = function ( r, g, b, a ) {

    // renderer.fill()

    if ( typeof r === 'undefined' ) {
      this[ _name ]();

    // renderer.fill( 'magenta' )

    } else if ( typeof r !== 'boolean' ) {
      if ( typeof r === 'string' || this[ _nameColor ].type !== this.settings.color.prototype.type ) {
        this[ _nameColor ] = new this.settings.color( r, g, b, a );
      } else {
        this[ _nameColor ].set( r, g, b, a );
      }

      this[ _doName ] = true;

    // renderer.fill( true )

    } else {
      this[ _doName ] = r;
    }

    return this;
  };
}, void 0, true, [ 'stroke', 'fill' ] );

[
  'setTransform',
  'transform',
  'translate',
  'restore',
  'scale',
  'save'
].forEach( function ( name ) {
  Renderer.prototype[ name ] = Function( 'a, b, c, d, e, f', 'return this.matrix.' + name + '( a, b, c, d, e, f ), this;' ); // jshint ignore: line
} );

module.exports = Renderer;
