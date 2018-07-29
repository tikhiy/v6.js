(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var defaultTo = require( './_optional' )( 'peako/default-to', [ 'peako', 'defaultTo' ] );

var Vector2D = require( './math/Vector2D' );

function Camera ( options, renderer ) {
  if ( ! options ) {
    options = {};
  }

  this.xSpeed           = defaultTo( options.xSpeed, 1 );
  this.ySpeed           = defaultTo( options.ySpeed, 1 );
  this.zoomInSpeed      = defaultTo( options.zoomInSpeed, 1 );
  this.zoomOutSpeed     = defaultTo( options.zoomOutSpeed, 1 );

  this.zoom             = defaultTo( options.zoom, 1 );
  this.minZoom          = defaultTo( options.minZoom, 1 );
  this.maxZoom          = defaultTo( options.maxZoom, 1 );

  this.useLinearZoomIn  = defaultTo( options.useLinearZoomIn, true );
  this.useLinearZoomOut = defaultTo( options.useLinearZoomOut, true );

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
    0, 0, // current position
    0, 0, // tranformed position of the object to be viewed
    0, 0  // not transformed position...
  ];
}

Camera.prototype = {
  update: function update () {
    var pos = this.position;

    if ( pos[ 0 ] !== pos[ 2 ] ) {
      pos[ 0 ] += ( pos[ 2 ] - pos[ 0 ] ) * this.xSpeed;
    }

    if ( pos[ 1 ] !== pos[ 3 ] ) {
      pos[ 1 ] += ( pos[ 3 ] - pos[ 1 ] ) * this.ySpeed;
    }

    return this;
  },

  lookAt: function lookAt ( at ) {
    var pos = this.position,
        off = this.offset;

    pos[ 2 ] = off.x / this.zoom - ( pos[ 4 ] = at.x );
    pos[ 3 ] = off.y / this.zoom - ( pos[ 5 ] = at.y );

    return this;
  },

  shouldLookAt: function shouldLookAt () {
    return new Vector2D( this.position[ 4 ], this.position[ 5 ] );
  },

  looksAt: function looksAt () {
    var x = ( this.offset.x - this.position[ 0 ] * this.zoom ) / this.zoom,
        y = ( this.offset.y - this.position[ 1 ] * this.zoom ) / this.zoom;

    return new Vector2D( x, y );
  },

  sees: function sees ( x, y, w, h, renderer ) {
    var off = this.offset,
        at  = this.looksAt();

    if ( ! renderer ) {
      renderer = this.renderer;
    }

    return x + w > at.x - off.x / this.zoom &&
           x     < at.x + ( renderer.w - off.x ) / this.zoom &&
           y + h > at.y - off.y / this.zoom &&
           y     < at.y + ( renderer.h - off.y ) / this.zoom;
  },

  zoomIn: function zoomIn () {
    var spd;

    if ( this.zoom !== this.maxZoom ) {
      if ( this.useLinearZoomIn ) {
        spd = this.zoomInSpeed * this.zoom;
      } else {
        spd = this.zoomInSpeed;
      }

      this.zoom = Math.min( this.zoom + spd, this.maxZoom );
    }
  },

  zoomOut: function zoomOut () {
    var spd;

    if ( this.zoom !== this.minZoom ) {
      if ( this.useLinearZoomOut ) {
        spd = this.zoomOutSpeed * this.zoom;
      } else {
        spd = this.zoomOutSpeed;
      }

      this.zoom = Math.max( this.zoom - spd, this.minZoom );
    }
  },

  constructor: Camera
};

module.exports = Camera;

},{"./_optional":17,"./math/Vector2D":32}],2:[function(require,module,exports){
'use strict';

/**
 * @param {v6.Image|v6.CompoundedImage} image
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function CompoundedImage ( image, x, y, w, h ) {

  this.image = image;

  this.x = x;
  this.y = y;

  this.w = w;
  this.h = h;

}

CompoundedImage.prototype = {
  get: function get () {
    return this.image.get();
  },

  constructor: CompoundedImage
};

module.exports = CompoundedImage;

},{}],3:[function(require,module,exports){
'use strict';

function Font ( style, variant, weight, size, lineHeight, family ) {
}

Font.prototype = {

  set: function set ( style, variant, weight, size, lineHeight, family ) {

    if ( style instanceof Font ) {
      this.setFont( style );
    } else if ( variant == null ) {
      if ( isGlobal( style ) || isFontSize( style ) ) {
        this.size = style;
      } else {
        this.family = style;
      }
    } else if ( weight == null ) {

    }



    if ( variant == null ) {
      if ( is_global( style ) || is_font_size( style ) ) {
        this.size = style;
      } else {
        this.family = style;
      }
    } else if ( weight === undefined ) {
      this.size = style;
      this.family = variant;
    } else if ( size === undefined ) {
      this[ get_property_name( style, 'style' ) ] = style;
      this.size = variant;
      this.family = weight;
    } else if ( family === undefined ) {
      var a = get_property_name( style, 'style' ),
          b = get_property_name( variant, a === 'style' ? 'variant' : 'weight' );

      if ( a === b ) {
        b = a === 'style' ? 'variant' : 'weight';
      }

      this[ a ] = style;
      this[ b ] = variant;
      this.size = weight;
      this.family = size;
    } else {
      this.style = style;
      this.variant = variant;
      this.weight = weight;
      this.size = size;
      this.family = family;
    }

  },

  setFont: function setFont ( font ) {

    this.style      = font.style;
    this.variant    = font.variant;
    this.weight     = font.weight;
    this.size       = font.size;
    this.lineHeight = font.lineHeight;
    this.family     = font.family;

    return this;

  },

  constructor: Font

};

function isGlobal ( v ) {
  return v === 'inherit' || v === 'initial' || v === 'unset';
}

function isFontStyle ( v ) {
  return v === 'normal' || v === 'italic' || v === 'oblique';
}

function isFontVariant ( v ) {
  return v === 'none' || v === 'normal' || v === 'small-caps';
}

function isFontSize ( v ) {
  return typeof v == 'number' ||
    /^(?:smaller|xx-small|x-small|small|medium|large|x-large|xx-large|larger|(\d+|\d*\.\d+)(px|em|\u0025|cm|in|mm|pc|pt|rem)?)$/.test( v );
}

function get ( v, k ) {
  if ( isGlobal( v ) ) {
    return k;
  }

  if ( isFontStyle( v ) ) {
    return 'style';
  }

  if ( isFontVariant( v ) ) {
    return 'variant';
  }

  return 'weight';
}

module.exports = Font;

},{}],4:[function(require,module,exports){
'use strict';

var CompoundedImage = require( './CompoundedImage' );

var report = require( './report' );

/**
 * @param {string|HTMLImageElement} url
 */
function Image ( url ) {

  this.loaded = false;

  this.x = 0;
  this.y = 0;

  if ( typeof HTMLImageElement !== 'undefined' && url instanceof HTMLImageElement ) {
    if ( url.src ) {
      if ( url.complete ) {
        this._onload();
      } else {
        report( 'new v6.Image: you should manually set the "loaded" property if you are using "new v6.Image( image )"' );
      }

      this.url = url.src;
    } else {
      this.url = '';
    }

    this.image = url;
  } else if ( typeof url === 'string' ) {
    this.image = document.createElement( 'img' );
    this.url = url;
    this.load();
  } else {
    throw TypeError( 'new v6.Image: first argument must be a string or a HTMLImageElement object' );
  }

}

Image.prototype = {
  _onload: function _onload ( e ) {

    if ( e ) {
      this.image.onload = null;
    }

    this.w = this.image.width;
    this.h = this.image.height;

    this.loaded = true;

  },

  /*
   * @returns {v6.Image}
   */
  load: function load ( url ) {
    if ( ! this.loaded ) {

      this.image.onload = this._onload;

      this.image.src = this.url = ( this.url || url || '' );

    }

    return this;
  },

  /**
   * tl;dr: Just the exit-function from v6.CompoundedImage::get() recursion.
   *
   * Since v6.Image functions (static) can work with both v6.Image and
   * v6.CompoundedImage, a source object (v6.Image) can be required in them.
   * Thus, there is v6.CompoundedImage::get(), which starts a recursion through
   * intermediate objects (v6.CompoundedImage) and v6.Image::get(), which stop it
   * as the source object (v6.Image).
   *
   * @returns {v6.Image}
   * @see v6.CompoundedImage#get()
   */
  get: function get () {
    return this;
  },

  constructor: Image
};

/**
 * @param {v6.Image|v6.CompoundedImage} image
 * @param {number} w
 * @param {number} h
 * @returns {v6.CompoundedImage}
 */
Image.stretch = function stretch ( image, w, h ) {

  var x = h / image.h * image.w;

  // stretch width (keep w, change h)

  if ( x < w ) {
    h = w / image.w * image.h;

  // stretch height (change w, keep h)

  } else {
    w = x;
  }

  return new CompoundedImage( image.get(), image.x, image.y, w, h );

};

/**
 * @param {v6.Image|v6.CompoundedImage} image
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @returns {v6.CompoundedImage}
 */
Image.cut = function cut ( image, x, y, w, h ) {

  x += image.x;

  if ( x + w > image.x + image.w ) {
    throw Error( 'v6.Image.cut: cannot cut the image because the new image X or W is out of bounds' );
  }

  y += image.y;

  if ( y + h > image.y + image.h ) {
    throw Error( 'v6.Image.cut: cannot cut the image because the new image Y or H is out of bounds' );
  }

  return new CompoundedImage( image.get(), x, y, w, h );

};

module.exports = Image;

},{"./CompoundedImage":2,"./report":39}],5:[function(require,module,exports){
'use strict';

var _setDefaultDrawingSettings = require( './_setDefaultDrawingSettings' ),
    _copyDrawingSettings       = require( './_copyDrawingSettings' ),
    _getContextNameGL          = require( './_getContextNameGL' ),
    _createPolygon             = require( './_createPolygon' ),
    _polygons                  = require( './_polygons' ),
    _optional                  = require( './_optional' ),
    CompoundedImage            = require( './CompoundedImage' ),
    constants                  = require( './constants' ),
    options                    = require( './options' ),
    Image                      = require( './Image' );

var getElementW = _optional( 'peako/get-element-w', [ 'peako', 'prototype', 'width' ] ),
    getElementH = _optional( 'peako/get-element-h', [ 'peako', 'prototype', 'height' ] ),
    baseForIn   = _optional( 'peako/base/base-for-in', [ 'peako', 'forOwnRight' ] );

var undefined; // jshint ignore: line

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
    if ( ( mode = _getContextNameGL() ) ) {
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
    var w, h;

    try {
      w = getElementW( element );
      h = getElementH( element );
    } catch ( e ) {
      w = getElementW.call( [ element ] );
      h = getElementH.call( [ element ] );
    }

    return this.resize( w, h );
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
    if ( r instanceof Image || r instanceof CompoundedImage ) {
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

  constructor: Renderer

};

// for ( var o = { stroke: 'Stroke', fill: 'Fill' }, k = [ 'stroke', 'fill' ], i = k.length - 1; i >= 0; --i ) {
//   ( function ( k ) {
//     var _nameColor = '_' + k + 'Color',
//         _doName = '_do' + o[ k ],
//         _name = '_' + k;

//     Renderer.prototype[ k ] = function ( r, g, b, a ) {

//       // renderer.fill()

//       if ( typeof r === 'undefined' ) {
//         this[ _name ]();

//       // renderer.fill( 'magenta' )

//       } else if ( typeof r !== 'boolean' ) {
//         if ( typeof r === 'string' || this[ _nameColor ].type !== this.settings.color.prototype.type ) {
//           this[ _nameColor ] = new this.settings.color( r, g, b, a );
//         } else {
//           this[ _nameColor ].set( r, g, b, a );
//         }

//         this[ _doName ] = true;

//       // renderer.fill( true )

//       } else {
//         this[ _doName ] = r;
//       }

//       return this;
//     };
//   } )( k[ i ] );
// }

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
}, undefined, true, [ 'stroke', 'fill' ] );

module.exports = Renderer;

},{"./CompoundedImage":2,"./Image":4,"./_copyDrawingSettings":12,"./_createPolygon":13,"./_getContextNameGL":16,"./_optional":17,"./_polygons":18,"./_setDefaultDrawingSettings":19,"./constants":28,"./options":36}],6:[function(require,module,exports){
'use strict';

var defaults        = require( './_optional' )( 'peako/defaults', [ 'peako', 'defaults' ] ),
    rendererOptions = require( './rendererOptions' ),
    constants       = require( './constants' ),
    Renderer        = require( './Renderer' ),
    _align          = require( './_align' );

function Renderer2D ( options ) {

  options = defaults( rendererOptions, options );

  Renderer.call( this, options, constants.MODE_2D );

  this.smooth( this.settings.smooth );

  this.matrix = this.context;

  this._beginPath = false;

}

Renderer2D.prototype = Object.create( Renderer.prototype );

Renderer2D.prototype.smooth = ( function () {
  var names = [
    'webkitImageSmoothingEnabled',
    'mozImageSmoothingEnabled',
    'msImageSmoothingEnabled',
    'oImageSmoothingEnabled',
    'imageSmoothingEnabled'
  ];

  /**
   * @param {boolean} bool
   */
  return function smooth ( bool ) {

    var i;

    if ( typeof bool !== 'boolean' ) {
      throw TypeError( 'First argument in smooth( bool ) must be a boolean' );
    }

    for ( i = names.length - 1; i >= 0; --i ) {
      if ( names[ i ] in this.context ) {
        this.context[ names[ i ] ] = bool;
      }
    }

    this.settings.smooth = bool;

    return this;

  };
} )();

/**
 * @param {number|string|v6.RGBA|v6.HSLA} r
 * @param {number} g
 * @param {number} b
 * @param {number} a
 */
Renderer2D.prototype.backgroundColor = function backgroundColor ( r, g, b, a ) {

  var context = this.context;

  context.save();
  context.setTransform( this.settings.scale, 0, 0, this.settings.scale, 0, 0 );
  context.fillStyle = new this.settings.color( r, g, b, a );
  context.fillRect( 0, 0, this.w, this.h );
  context.restore();

  return this;

};

/**
 * @param {v6.Image|v6.CompoundedImage} image
 */
Renderer2D.prototype.backgroundImage = function backgroundImage ( image ) {

  var _rectAlignX = this._rectAlignX,
      _rectAlignY = this._rectAlignY;

  this._rectAlignX = 'left';
  this._rectAlignY = 'top';

  this.image( Image.stretch( image, this.w, this.h ), 0, 0 );

  this._rectAlignX = _rectAlignX;
  this._rectAlignY = _rectAlignY;

  return this;

};

Renderer2D.prototype.clear = function clear ( x, y, w, h ) {

  if ( typeof x === 'undefined' ) {
    x = y = 0;
    w = this.w;
    h = this.h;
  } else {
    x = Math.floor( _align( x, w, this._rectAlignX ) );
    y = Math.floor( _align( y, h, this._rectAlignY ) );
  }

  this.context.clearRect( x, y, w, h );

  return this;

};

Renderer2D.prototype.vertices = function vertices ( verts, count, _mode, _sx, _sy ) {
  var context = this.context,
      i;

  if ( count < 2 ) {
    return this;
  }

  if ( _sx == null ) {
    _sx = _sy = 1;
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
    this._stroke( true );
  }

  return this;
};

Renderer2D.prototype._fill = function _fill () {
  this.context.fillStyle = this._fillColor;
  this.context.fill();
};

Renderer2D.prototype._stroke = function ( close ) {
  var context = this.context;

  if ( close ) {
    context.closePath();
  }

  context.strokeStyle = this._strokeColor;

  if ( ( context.lineWidth = this._lineWidth ) <= 1 ) {
    context.stroke();
  }

  context.stroke();
};

Renderer2D.prototype.constructor = Renderer2D;

module.exports = Renderer2D;

},{"./Renderer":5,"./_align":11,"./_optional":17,"./constants":28,"./rendererOptions":38}],7:[function(require,module,exports){
'use strict';

var defaults        = require( './_optional' )( 'peako/defaults', [ 'peako', 'defaults' ] ),
    ShaderProgram   = require( './ShaderProgram' ),
    Transform       = require( './Transform' ),
    constants       = require( './constants' ),
    Renderer        = require( './Renderer' ),
    shaders         = require( './defaultShaders' ),
    rendererOptions = require( './rendererOptions' );

function RendererGL ( options ) {

  options = defaults( rendererOptions, options );

  Renderer.call( this, options, constants.MODE_GL );

  this.matrix = new Transform();

  this.buffers = {
    default: this.context.createBuffer(),
    rect:    this.context.createBuffer()
  };

  this.shaders = {
    basic: new ShaderProgram( shaders.basicVert, shaders.basicFrag, this.context )
  };

  this.blending( options.blending );
}

RendererGL.prototype = Object.create( Renderer.prototype );

/**
 * @param {number} w
 * @param {number} h
 */
RendererGL.prototype.resize = function resize ( w, h ) {
  Renderer.prototype.resize.call( this, w, h );
  this.context.viewport( 0, 0, this.w, this.h );
  return this;
};

/**
 * @param {boolean} blending
 */
RendererGL.prototype.blending = function blending ( blending ) {
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

RendererGL.prototype._clearColor = function _clearColor ( r, g, b, a ) {
  var gl = this.context;
  gl.clearColor( r, g, b, a );
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
};

RendererGL.prototype.backgroundColor = function backgroundColor ( r, g, b, a ) {
  var rgba = new this.settings.color( r, g, b, a ).rgba();
  this._clearColor( rgba[ 0 ] / 255, rgba[ 1 ] / 255, rgba[ 2 ] / 255, rgba[ 3 ] );
  return this;
};

RendererGL.prototype.clear = function clear () {
  this._clearColor( 0, 0, 0, 0 );
  return this;
};

RendererGL.prototype.vertices = function vertices ( verts, count, mode, _sx, _sy ) {
  var program = this.shaders.basic,
      gl      = this.context;

  if ( count < 2 ) {
    return this;
  }

  if ( verts ) {
    if ( mode == null ) {
      mode = gl.STATIC_DRAW;
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, this.buffers.default );
    gl.bufferData( gl.ARRAY_BUFFER, verts, mode );
  }

  if ( _sx != null ) {
    this.matrix.scale( _sx, _sy );
  }

  program
    .use()
    .uniform( 'utransform', this.matrix.matrix )
    .uniform( 'ures', [ this.w, this.h ] )
    .pointer( 'apos', 2, gl.FLOAT, false, 0, 0 );

  if ( this._doFill ) {
    program.uniform( 'ucolor', this._fillColor.rgba() );
    gl.drawArrays( gl.TRIANGLE_FAN, 0, count );
  }

  if ( this._doStroke && this._lineWidth > 0 ) {
    program.uniform( 'ucolor', this._strokeColor.rgba() );
    gl.lineWidth( this._lineWidth );
    gl.drawArrays( gl.LINE_LOOP, 0, count );
  }

  return this;
};

RendererGL.prototype.constructor = RendererGL;

module.exports = RendererGL;

},{"./Renderer":5,"./ShaderProgram":8,"./Transform":10,"./_optional":17,"./constants":28,"./defaultShaders":29,"./rendererOptions":38}],8:[function(require,module,exports){
'use strict';

var _createProgram = require( './_createProgram' ),
    _createShader  = require( './_createShader' );

function ShaderProgram ( vert, frag, gl ) {
  if ( typeof vert === 'string' ) {
    vert = _createShader( vert, gl.VERTEX_SHADER, gl );
  }

  if ( typeof frag === 'string' ) {
    frag = _createShader( frag, gl.FRAGMENT_SHADER, gl );
  }

  this._program   = _createProgram( vert, frag, gl );
  this._gl        = gl;
  this.attributes = attributes( gl, this._program );
  this.uniforms   = uniforms( gl, this._program );
}

ShaderProgram.prototype = {
  use: function use () {

    this._gl.useProgram( this._program );

    return this;

  },

  pointer: function pointer ( name, size, type, normalized, stride, offset ) {

    var location = this.attributes[ name ].location;

    var _gl = this._gl;

    _gl.enableVertexAttribArray( location );
    _gl.vertexAttribPointer( location, size, type, normalized, stride, offset );

    return this;

  },

  constructor: ShaderProgram
};

ShaderProgram.prototype.uniform = function uniform ( name, value ) {
  var uniform = this.uniforms[ name ];

  var _gl = this._gl;

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

function attributes ( gl, program ) {

  var i = gl.getProgramParameter( program, gl.ACTIVE_ATTRIBUTES ) - 1;

  var attributes = {};

  var attribute;

  for ( ; i >= 0; --i ) {

    attribute          = gl.getActiveAttrib( program, i );
    attribute.location = gl.getAttribLocation( program, attribute.name );

    attributes[ attribute.name ] = attribute;

  }

  return attributes;

}

function uniforms ( gl, program ) {

  var i = gl.getProgramParameter( program, gl.ACTIVE_UNIFORMS ) - 1;

  var uniforms = {};

  var uniform, index, info;

  for ( ; i >= 0; --i ) {

    info = gl.getActiveUniform( program, i );

    uniform = {
      location: gl.getUniformLocation( program, info.name ),
      size: info.size,
      type: info.type
    };

    if ( info.size > 1 && ~ ( index = info.name.indexOf( '[0]' ) ) ) {
      uniform.name = info.name.slice( 0, index );
    } else {
      uniform.name = info.name;
    }

    uniforms[ uniform.name ] = uniform;

  }

  return uniforms;

}

module.exports = ShaderProgram;

},{"./_createProgram":14,"./_createShader":15}],9:[function(require,module,exports){
'use strict';

var _optional = require( './_optional' ),
    constants = require( './constants' );

var timestamp = _optional( 'peako/timestamp', [ 'peako', 'timestamp' ] ),
    timer     = _optional( 'peako/timer', [ 'peako', 'timer' ] ),
    noop      = _optional( 'peako/noop', [ 'peako', 'noop' ] );

function Ticker ( update, render, context ) {
  var self = this;

  if ( typeof render !== 'function' ) {
    context = render;
    render = null;
  }

  if ( context === constants.SELF_CONTEXT ) {
    context = this;
  }

  if ( render == null ) {
    render = update;
    update = noop;
  }

  this.lastRequestAnimationFrameID = 0;
  this.lastRequestTime = 0;
  this.skippedTime = 0;
  this.totalTime = 0;
  this.running = false;
  this.update = update;
  this.render = render;

  function tick ( now ) {
    var elapsedTime;

    if ( ! self.running ) {

      // if it is just `ticker.tick();` (not `self.lastRequestAnimationFrameID = timer.request( tick );`).

      if ( ! now ) {
        self.lastRequestAnimationFrameID = timer.request( tick );
        self.lastRequestTime = timestamp();
        self.running = true;
      }

      return this; // jshint ignore: line
    }

    // see the comment above

    if ( ! now ) {
      now = timestamp();
    }

    elapsedTime = Math.min( 1, ( now - self.lastRequestTime ) * 0.001 );

    self.skippedTime += elapsedTime;

    self.totalTime += elapsedTime;

    while ( self.skippedTime >= self.step && self.running ) {
      self.skippedTime -= self.step;

      if ( typeof context !== 'undefined' ) {
        self.update.call( context, self.step, now );
      } else {
        self.update( self.step, now );
      }
    }

    if ( typeof context !== 'undefined' ) {
      self.render.call( context, elapsedTime, now );
    } else {
      self.render( elapsedTime, now );
    }

    self.lastRequestTime = now;

    self.lastRequestAnimationFrameID = timer.request( tick );

    return this; // jshint ignore: line
  }

  this.tick = tick;

  this.setFPS( 60 );
}

Ticker.prototype = {
  setFPS: function setFPS ( fps ) {
    this.step = 1 / fps;
    return this;
  },

  clear: function clear () {
    this.skippedTime = 0;
    return this;
  },

  stop: function stop () {
    this.running = false;
    return this;
  },

  constructor: Ticker
};

module.exports = Ticker;

},{"./_optional":17,"./constants":28}],10:[function(require,module,exports){
'use strict';

var mat3 = require( './mat3' );

function Transform () {
  this.matrix = mat3.identity();
  this._index = -1;
  this._stack = [];
}

Transform.prototype = {
  save: function save () {
    if ( ++this._index < this._stack.length ) {
      mat3.copy( this._stack[ this._index ], this.matrix );
    } else {
      this._stack.push( mat3.clone( this.matrix ) );
    }
  },

  restore: function restore () {
    if ( this._index >= 0 ) {
      mat3.copy( this.matrix, this._stack[ this._index-- ] );
    } else {
      mat3.setIdentity( this.matrix );
    }
  },

  setTransform: function setTransform ( m11, m12, m21, m22, dx, dy ) {
    mat3.setTransform( this.matrix, m11, m12, m21, m22, dx, dy );
  },

  translate: function translate ( x, y ) {
    mat3.translate( this.matrix, x, y );
  },

  rotate: function rotate ( angle ) {
    mat3.rotate( this.matrix, angle );
  },

  scale: function scale ( x, y ) {
    mat3.scale( this.matrix, x, y );
  },

  transform: function transform ( m11, m12, m21, m22, dx, dy ) {
    mat3.transform( this.matrix, m11, m12, m21, m22, dx, dy );
  },

  constructor: Transform
};

module.exports = Transform;

},{"./mat3":31}],11:[function(require,module,exports){
'use strict';

var constants = require( './constants' );

module.exports = function align ( value, dimension, align ) {
  switch ( align ) {
    case constants.LEFT:
    case constants.TOP:
      return value;
    case constants.CENTER:
    case constants.MIDDLE:
      return value - dimension * 0.5;
    case constants.RIGHT:
    case constants.BOTTOM:
      return value - dimension;
  }

  return 0;
};

},{"./constants":28}],12:[function(require,module,exports){
'use strict';

module.exports = function _copyDrawingSettings ( obj, src, deep ) {
  if ( deep ) {
    obj._fillColor[ 0 ]   = src._fillColor[ 0 ];
    obj._fillColor[ 1 ]   = src._fillColor[ 1 ];
    obj._fillColor[ 2 ]   = src._fillColor[ 2 ];
    obj._fillColor[ 3 ]   = src._fillColor[ 3 ];
    obj._font.style       = src._font.style;
    obj._font.variant     = src._font.variant;
    obj._font.weight      = src._font.weight;
    obj._font.size        = src._font.size;
    obj._font.family      = src._font.family;
    obj._strokeColor[ 0 ] = src._strokeColor[ 0 ];
    obj._strokeColor[ 1 ] = src._strokeColor[ 1 ];
    obj._strokeColor[ 2 ] = src._strokeColor[ 2 ];
    obj._strokeColor[ 3 ] = src._strokeColor[ 3 ];
  }

  obj._rectAlignX   = src._rectAlignX;
  obj._rectAlignY   = src._rectAlignY;
  obj._doFill       = src._doFill;
  obj._doStroke     = src._doStroke;
  obj._lineHeight   = src._lineHeight;
  obj._lineWidth    = src._lineWidth;
  obj._textAlign    = src._textAlign;
  obj._textBaseline = src._textBaseline;

  return obj;
};

},{}],13:[function(require,module,exports){
'use strict';

module.exports = function _createPolygon ( n ) {

  var i = Math.floor( n );

  var verts = new Float32Array( i * 2 + 2 );

  var step = Math.PI * 2 / n;

  for ( ; i >= 0; --i ) {
    verts[     i * 2 ] = Math.cos( step * i );
    verts[ 1 + i * 2 ] = Math.sin( step * i );
  }

  return verts;

};

},{}],14:[function(require,module,exports){
'use strict';

module.exports = function _createProgram ( vert, frag, gl ) {

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

};

},{}],15:[function(require,module,exports){
'use strict';

module.exports = function _createShader ( source, type, gl ) {

  var shader = gl.createShader( type );

  gl.shaderSource( shader, source );
  gl.compileShader( shader );

  if ( ! gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
    throw SyntaxError( 'An error occurred compiling the shaders: ' + gl.getShaderInfoLog( shader ) );
  }

  return shader;

};

},{}],16:[function(require,module,exports){
'use strict';

var once = require( './_optional' )( 'peako/once', [ 'peako', 'once' ] );

var _getContextNameGL = once( function () {
  var canvas = document.createElement( 'canvas' );

  var types, i;

  if ( typeof canvas.getContext !== 'function' ) {
    return;
  }

  types = [
    'webkit-3d',
    'moz-webgl',
    'experimental-webgl',
    'webgl'
  ];

  for ( i = types.length - 1; i >= 0; --i ) {
    if ( canvas.getContext( types[ i ] ) ) {
      return types[ i ];
    }
  }
} );

module.exports = _getContextNameGL;

},{"./_optional":17}],17:[function(require,module,exports){
'use strict';

var optional = require;

/**
 * @param {string} url
 * @param {string} alt
 */

// _optional( 'peako/base/base-for-in', [ 'peako', 'forOwnRight' ] )
// // -> require( 'peako/base/base-for-in' ) or peako.forOwnRight
// _optional( 'qs/lib/parse', [ 'qs', 'parse' ] );
// // -> require( 'qs/lib/parse' ) or self.qs.parse
// _optional( 'platform', [ 'platform' ] );
// // -> require( 'platform' ) or self.platform
// _optional( 'some-module' )
// // -> require( 'some-module' ) or nothing

module.exports = function _optional ( url, alt ) {
  var res, i, l;

  try {
    return optional( url );
  } catch ( e ) {}

  if ( ! alt || typeof self === 'undefined' ) {
    return;
  }

  for ( res = self, i = 0, l = alt.length; i < l; ++i ) {
    if ( res[ alt[ i ] ] == null ) {
      return;
    }

    res = res[ alt[ i ] ];
  }

  return res;
};

},{}],18:[function(require,module,exports){
'use strict';

},{}],19:[function(require,module,exports){
'use strict';

var _copyDrawingSettings = require( './_copyDrawingSettings' ),
    constants            = require( './constants' ),
    Font                 = require( './Font' );

var defaultDrawingSettings = {
  _rectAlignX: constants.LEFT,
  _rectAlignY: constants.TOP,
  _textAlignX: constants.LEFT,
  _textAlineY: constants.TOP,
  _doStroke:   true,
  _doFill:     true,
  _lineH:      14,
  _lineW:      2
};

module.exports = function _setDefaultDrawingSettings ( target, source ) {

  _copyDrawingSettings( target, defaultDrawingSettings );

  target._strokeColor = new source.settings.color();
  target._fillColor   = new source.settings.color();
  target._font        = new Font();

  return target;

};

},{"./Font":3,"./_copyDrawingSettings":12,"./constants":28}],20:[function(require,module,exports){
'use strict';

var Camera = require( './Camera' );

module.exports = function camera ( options, renderer ) {
  return new Camera( options, renderer );
};

},{"./Camera":1}],21:[function(require,module,exports){
'use strict';

var clamp = require( '../_optional' )( 'peako/clamp', [ 'peako', 'clamp' ] );

// there is a circular recursion

var _parseColor, RGBA;

var undefined; // jshint ignore: line

function HSLA ( h, s, l, a ) {
  this.set( h, s, l, a );
}

HSLA.prototype = {

  // new HSLA( 'magenta' ).perceivedBrightness(); // -> 163.8759439332082

  perceivedBrightness: function perceivedBrightness () {
    return this.rgba().perceivedBrightness();
  },

  // new HSLA( 'magenta' ).luminance(); // -> 72.624

  luminance: function luminance () {
    return this.rgba().luminance();
  },

  // new HSLA( 'magenta' ).brightness(); // -> 105.315

  brightness: function brightness () {
    return this.rgba().brightness();
  },

  // '' + new HSLA( 'red' ); // -> "hsla(0, 100, 50, 1)"

  toString: function toString () {
    return 'hsla(' + this[ 0 ] + ', ' + this[ 1 ] + '\u0025, ' + this[ 2 ] + '\u0025, ' + this[ 3 ] + ')';
  },

  // new HSLA()
  //   .set( 'red' )      // -> 0, 100, 50, 1
  //   .set( '#ff0000' ); // -> 0, 100, 50, 1

  set: function set ( h, s, l, a ) {
    switch ( true ) {
      case typeof h === 'string':
        h = _parseColor( h );
        /* falls through */
      case typeof h === 'object' && h != null:
        if ( h.type !== this.type ) {
          h = h[ this.type ]();
        }

        this[ 0 ] = h[ 0 ];
        this[ 1 ] = h[ 1 ];
        this[ 2 ] = h[ 2 ];
        this[ 3 ] = h[ 3 ];

        break;
      default:
        switch ( undefined ) {
          case h:
            a = 1;
            l = s = h = 0;
            break;
          case s:
            a = 1;
            l = Math.floor( h );
            s = h = 0;
            break;
          case l:
            a = s;
            l = Math.floor( h );
            s = h = 0;
            break;
          case a:
            a = 1;
            /* falls through */
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

  // new HSLA( 'magenta' ).rgba(); // -> new RGBA( 255, 0, 255, 1 )

  rgba: function rgba () {
    var rgba = new RGBA();

    var h = this[ 0 ] % 360 / 360,
        s = this[ 1 ] * 0.01,
        l = this[ 2 ] * 0.01;

    var tr = h + 1 / 3,
        tg = h,
        tb = h - 1 / 3;

    var q;

    if ( l < 0.5 ) {
      q = l * ( 1 + s );
    } else {
      q = l + s - l * s;
    }

    var p = 2 * l - q;

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

  lerp: function lerp ( h, s, l, value ) {

    // HAHA LOL NICE OPTIMIZATION LOVE ME!

    var color = new HSLA();

    color[ 0 ] = h;
    color[ 1 ] = s;
    color[ 2 ] = l;

    return this.lerpColor( color, value );

  },

  lerpColor: function lerpColor ( color, value ) {
    return this.rgba().lerpColor( color, value ).hsla();
  },

  // new HSLA( 0, 100, 75, 1 ).shade( -10 ); // -> new HSLA( 0, 100, 65, 1 )

  shade: function shade ( value ) {

    var hsla = new HSLA();

    hsla[ 0 ] = this[ 0 ];
    hsla[ 1 ] = this[ 1 ];
    hsla[ 2 ] = clamp( this[ 2 ] + value, 0, 100 );
    hsla[ 3 ] = this[ 3 ];

    return hsla;

  },

  constructor: HSLA,
  type: 'hsla'
};

function foo ( t, p, q ) {
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

// export

module.exports = HSLA;

// then require modules that requires this module

_parseColor = require( './_parseColor' );

RGBA = require( './RGBA' );

},{"../_optional":17,"./RGBA":22,"./_parseColor":23}],22:[function(require,module,exports){
'use strict';

// there is a circular recursion

var _parseColor, HSLA;

var undefined; // jshint ignore: line

function RGBA ( r, g, b, a ) {
  this.set( r, g, b, a );
}

RGBA.prototype = {

  // Anonymous's answer: https://stackoverflow.com/a/596243

  // http://alienryderflex.com/hsp.html

  // new RGBA( 'magenta' ).perceivedBrightness(); // -> 163.8759439332082

  perceivedBrightness: function perceivedBrightness () {
    var r = this[ 0 ],
        g = this[ 1 ],
        b = this[ 2 ];

    return Math.sqrt( 0.299 * r * r + 0.587 * g * g + 0.114 * b * b );
  },

  // https://en.wikipedia.org/wiki/Relative_luminance

  // new RGBA( 'magenta' ).luminance(); // -> 72.624

  luminance: function luminance () {
    return this[ 0 ] * 0.2126 + this[ 1 ] * 0.7152 + this[ 2 ] * 0.0722;
  },

  // https://www.w3.org/TR/AERT/#color-contrast

  // new RGBA( 'magenta' ).brightness(); // -> 105.315

  brightness: function brightness () {
    return 0.299 * this[ 0 ] + 0.587 * this[ 1 ] + 0.114 * this[ 2 ];
  },

  // '' + new RGBA( 'magenta' ); // -> "rgba(255, 0, 255, 1)"

  toString: function toString () {
    return 'rgba(' + this[ 0 ] + ', ' + this[ 1 ] + ', ' + this[ 2 ] + ', ' + this[ 3 ] + ')';
  },

  // new RGBA()
  //   .set( 'magenta' )                    // -> 255, 0, 255, 1
  //   .set( '#ff00ff' )                    // -> 255, 0, 255, 1
  //   .set( '#f007' )                      // -> 255, 0, 0, 0.47
  //   .set( 'hsla( 0, 100%, 50%, 0.47 )' ) // -> 255, 0, 0, 0.47
  //   .set( 'rgb( 0, 0, 0 )' )             // -> 0, 0, 0, 1
  //   .set( 0 )                            // -> 0, 0, 0, 1
  //   .set( 0, 0, 0 )                      // -> 0, 0, 0, 1
  //   .set( 0, 0 )                         // -> 0, 0, 0, 0
  //   .set( 0, 0, 0, 0 );                  // -> 0, 0, 0, 0

  set: function set ( r, g, b, a ) {
    switch ( true ) {
      case typeof r === 'string':
        r = _parseColor( r );
        /* falls through */
      case typeof r === 'object' && r != null:
        if ( r.type !== this.type ) {
          r = r[ this.type ]();
        }

        this[ 0 ] = r[ 0 ];
        this[ 1 ] = r[ 1 ];
        this[ 2 ] = r[ 2 ];
        this[ 3 ] = r[ 3 ];

        break;
      default:
        switch ( undefined ) {
          case r:
            a = 1;
            b = g = r = 0;
            break;
          case g:
            a = 1;
            b = g = r = Math.floor( r );
            break;
          case b:
            a = g;
            b = g = r = Math.floor( r );
            break;
          case a:
            a = 1;
            /* falls through */
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

  // new RGBA( 255, 0, 0, 1 ).hsla(); // -> new HSLA( 0, 100, 50, 1 )

  hsla: function hsla () {
    var hsla = new HSLA();

    var r = this[ 0 ] / 255,
        g = this[ 1 ] / 255,
        b = this[ 2 ] / 255;

    var max = Math.max( r, g, b ),
        min = Math.min( r, g, b );

    var l = ( max + min ) * 50,
        h, s;

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
      h = s = 0;
    }

    hsla[ 0 ] = h;
    hsla[ 1 ] = s;
    hsla[ 2 ] = Math.round( l );
    hsla[ 3 ] = this[ 3 ];

    return hsla;
  },

  // for the RendererWebGL

  rgba: function rgba () {
    return this;
  },

  // new RGBA( 100, 0.25 ).lerp( 200, 200, 200, 0.5 ); // -> new RGBA( 150, 150, 150, 0.25 );

  lerp: function lerp ( r, g, b, value ) {

    r = lerp( this[ 0 ], r, value );
    g = lerp( this[ 0 ], g, value );
    b = lerp( this[ 0 ], b, value );

    return new RGBA( r, g, b, this[ 3 ] );

  },

  // var a = new RGBA( 100, 0.25 ),
  //     b = new RGBA( 200, 0 );

  // var c = a.lerpColor( b, 0.5 ); // -> new RGBA( 150, 150, 150, 0.25 );

  lerpColor: function lerpColor ( color, value ) {
    var r, g, b;

    if ( typeof color !== 'object' ) {
      color = _parseColor( color );
    }

    if ( color.type !== 'rgba' ) {
      color = color.rgba();
    }

    r = color[ 0 ];
    g = color[ 1 ];
    b = color[ 2 ];

    return this.lerp( r, g, b, value );
  },

  shade: function shade ( value ) {
    return this.hsla().shade( value ).rgba();
  },

  constructor: RGBA,
  type: 'rgba'
};

// export

module.exports = RGBA;

// then require modules that requires this module

_parseColor = require( './_parseColor' );

HSLA = require( './HSLA' );

},{"./HSLA":21,"./_parseColor":23}],23:[function(require,module,exports){
'use strict';

var _optional = require( '../_optional' ),
    colors    = require( './colors' );

var create = _optional( 'peako/create', [ 'peako', 'create' ] ),
    trim   = _optional( 'peako/trim', [ 'peako', 'trim' ] );

// there is a circular recursion

var RGBA, HSLA;

var parsed = create( null );

var TRANSPARENT = [
  0, 0, 0, 0
];

var regexps = {
  hex3: /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/,
  hex:  /^#([0-9a-f]{6})([0-9a-f]{2})?$/,
  rgb:  /^rgb\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)$|^\s*rgba\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)$/,
  hsl:  /^hsl\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\u0025\s*\)$|^\s*hsla\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\s*\)$/
};

// _parseColor( '#f0f0' );                     // -> new RGBA( 255, 0, 255, 0 )
// _parseColor( '#000000ff' );                 // -> new RGBA( 0, 0, 0, 1 )
// _parseColor( 'magenta' );                   // -> new RGBA( 255, 0, 255, 1 )
// _parseColor( 'transparent' );               // -> new RGBA( 0, 0, 0, 0 )
// _parseColor( 'hsl( 0, 100%, 50% )' );       // -> new HSLA( 0, 100, 50, 1 )
// _parseColor( 'hsla( 0, 100%, 50%, 0.5 )' ); // -> new HSLA( 0, 100, 50, 0.5 )

function _parseColor ( string ) {
  var cache = parsed[ string ] || parsed[ string = trim( string ).toLowerCase() ];

  if ( ! cache ) {
    if ( ( cache = colors[ string ] ) ) {
      cache = new ColorData( parseHex( cache ), RGBA );
    } else if ( ( cache = regexps.hex.exec( string ) ) ) {
      cache = new ColorData( parseHex( formatHex( cache ) ), RGBA );
    } else if ( ( cache = regexps.rgb.exec( string ) ) ) {
      cache = new ColorData( compactMatch( cache ), RGBA );
    } else if ( ( cache = regexps.hsl.exec( string ) ) ) {
      cache = new ColorData( compactMatch( cache ), HSLA );
    } else if ( ( cache = regexps.hex3.exec( string ) ) ) {
      cache = new ColorData( parseHex( formatHex( cache, true ) ), RGBA );
    } else {
      throw SyntaxError( string + ' is not a valid syntax' );
    }

    parsed[ string ] = cache;
  }

  return new cache.color( cache[ 0 ], cache[ 1 ], cache[ 2 ], cache[ 3 ] );
}

// formatHex( [ '#000000ff', '000000', 'ff' ] );       // -> '000000ff'
// formatHex( [ '#0007', '0', '0', '0', '7' ], true ); // -> '00000077'
// formatHex( [ '#000', '0', '0', '0', null ], true ); // -> '000000ff'

function formatHex ( match, shortSyntax ) {
  var r, g, b, a;

  if ( ! shortSyntax ) {
    return match[ 1 ] + ( match[ 2 ] || 'ff' );
  }

  r = match[ 1 ];
  g = match[ 2 ];
  b = match[ 3 ];
  a = match[ 4 ] || 'f';

  return r + r + g + g + b + b + a + a;
}

// parseHex( '00000000' ); // -> [ 0, 0, 0, 0 ]
// parseHex( 'ff00ffff' ); // -> [ 255, 0, 255, 1 ]

function parseHex ( hex ) {
  // use js type coercion ('00000000' == 0)
  // jshint -W116
  if ( hex == 0 ) {
  // jshint +W116
    return TRANSPARENT;
  }

  hex = parseInt( hex, 16 );

  return [
    hex >> 24 & 255,    // r
    hex >> 16 & 255,    // g
    hex >> 8 & 255,     // b
    ( hex & 255 ) / 255 // a
  ];
}

// compactMatch( [ 'hsl( 0, 0%, 0% )', '0', '0', '0', null, null, null, null ] );  // -> [ '0', '0', '0' ]
// compactMatch( [ 'rgba( 0, 0, 0, 0 )', null, null, null, '0', '0', '0', '0' ] ); // -> [ '0', '0', '0', '0' ]

function compactMatch ( match ) {
  if ( match[ 7 ] ) {
    return [ +match[ 4 ], +match[ 5 ], +match[ 6 ], +match[ 7 ] ];
  }

  return [ +match[ 1 ], +match[ 2 ], +match[ 3 ] ];
}

function ColorData ( match, color ) {
  this[ 0 ] = match[ 0 ];
  this[ 1 ] = match[ 1 ];
  this[ 2 ] = match[ 2 ];
  this[ 3 ] = match[ 3 ];
  this.color = color;
}

// export

module.exports = _parseColor;

// then require modules that requires this module

RGBA = require( './RGBA' );

HSLA = require( './HSLA' );

},{"../_optional":17,"./HSLA":21,"./RGBA":22,"./colors":25}],24:[function(require,module,exports){
'use strict';

var _parseColor = require( './_parseColor' );

var RGBA = require( './RGBA' );

module.exports = function color ( a, b, c, d ) {
  if ( typeof a !== 'string' ) {
    return new RGBA( a, b, c, d );
  }

  return _parseColor( a );
};

},{"./RGBA":22,"./_parseColor":23}],25:[function(require,module,exports){
'use strict';

module.exports = {
  aliceblue:       'f0f8ffff', antiquewhite:         'faebd7ff',
  aqua:            '00ffffff', aquamarine:           '7fffd4ff',
  azure:           'f0ffffff', beige:                'f5f5dcff',
  bisque:          'ffe4c4ff', black:                '000000ff',
  blanchedalmond:  'ffebcdff', blue:                 '0000ffff',
  blueviolet:      '8a2be2ff', brown:                'a52a2aff',
  burlywood:       'deb887ff', cadetblue:            '5f9ea0ff',
  chartreuse:      '7fff00ff', chocolate:            'd2691eff',
  coral:           'ff7f50ff', cornflowerblue:       '6495edff',
  cornsilk:        'fff8dcff', crimson:              'dc143cff',
  cyan:            '00ffffff', darkblue:             '00008bff',
  darkcyan:        '008b8bff', darkgoldenrod:        'b8860bff',
  darkgray:        'a9a9a9ff', darkgreen:            '006400ff',
  darkkhaki:       'bdb76bff', darkmagenta:          '8b008bff',
  darkolivegreen:  '556b2fff', darkorange:           'ff8c00ff',
  darkorchid:      '9932ccff', darkred:              '8b0000ff',
  darksalmon:      'e9967aff', darkseagreen:         '8fbc8fff',
  darkslateblue:   '483d8bff', darkslategray:        '2f4f4fff',
  darkturquoise:   '00ced1ff', darkviolet:           '9400d3ff',
  deeppink:        'ff1493ff', deepskyblue:          '00bfffff',
  dimgray:         '696969ff', dodgerblue:           '1e90ffff',
  feldspar:        'd19275ff', firebrick:            'b22222ff',
  floralwhite:     'fffaf0ff', forestgreen:          '228b22ff',
  fuchsia:         'ff00ffff', gainsboro:            'dcdcdcff',
  ghostwhite:      'f8f8ffff', gold:                 'ffd700ff',
  goldenrod:       'daa520ff', gray:                 '808080ff',
  green:           '008000ff', greenyellow:          'adff2fff',
  honeydew:        'f0fff0ff', hotpink:              'ff69b4ff',
  indianred:       'cd5c5cff', indigo:               '4b0082ff',
  ivory:           'fffff0ff', khaki:                'f0e68cff',
  lavender:        'e6e6faff', lavenderblush:        'fff0f5ff',
  lawngreen:       '7cfc00ff', lemonchiffon:         'fffacdff',
  lightblue:       'add8e6ff', lightcoral:           'f08080ff',
  lightcyan:       'e0ffffff', lightgoldenrodyellow: 'fafad2ff',
  lightgrey:       'd3d3d3ff', lightgreen:           '90ee90ff',
  lightpink:       'ffb6c1ff', lightsalmon:          'ffa07aff',
  lightseagreen:   '20b2aaff', lightskyblue:         '87cefaff',
  lightslateblue:  '8470ffff', lightslategray:       '778899ff',
  lightsteelblue:  'b0c4deff', lightyellow:          'ffffe0ff',
  lime:            '00ff00ff', limegreen:            '32cd32ff',
  linen:           'faf0e6ff', magenta:              'ff00ffff',
  maroon:          '800000ff', mediumaquamarine:     '66cdaaff',
  mediumblue:      '0000cdff', mediumorchid:         'ba55d3ff',
  mediumpurple:    '9370d8ff', mediumseagreen:       '3cb371ff',
  mediumslateblue: '7b68eeff', mediumspringgreen:    '00fa9aff',
  mediumturquoise: '48d1ccff', mediumvioletred:      'c71585ff',
  midnightblue:    '191970ff', mintcream:            'f5fffaff',
  mistyrose:       'ffe4e1ff', moccasin:             'ffe4b5ff',
  navajowhite:     'ffdeadff', navy:                 '000080ff',
  oldlace:         'fdf5e6ff', olive:                '808000ff',
  olivedrab:       '6b8e23ff', orange:               'ffa500ff',
  orangered:       'ff4500ff', orchid:               'da70d6ff',
  palegoldenrod:   'eee8aaff', palegreen:            '98fb98ff',
  paleturquoise:   'afeeeeff', palevioletred:        'd87093ff',
  papayawhip:      'ffefd5ff', peachpuff:            'ffdab9ff',
  peru:            'cd853fff', pink:                 'ffc0cbff',
  plum:            'dda0ddff', powderblue:           'b0e0e6ff',
  purple:          '800080ff', red:                  'ff0000ff',
  rosybrown:       'bc8f8fff', royalblue:            '4169e1ff',
  saddlebrown:     '8b4513ff', salmon:               'fa8072ff',
  sandybrown:      'f4a460ff', seagreen:             '2e8b57ff',
  seashell:        'fff5eeff', sienna:               'a0522dff',
  silver:          'c0c0c0ff', skyblue:              '87ceebff',
  slateblue:       '6a5acdff', slategray:            '708090ff',
  snow:            'fffafaff', springgreen:          '00ff7fff',
  steelblue:       '4682b4ff', tan:                  'd2b48cff',
  teal:            '008080ff', thistle:              'd8bfd8ff',
  tomato:          'ff6347ff', turquoise:            '40e0d0ff',
  violet:          'ee82eeff', violetred:            'd02090ff',
  wheat:           'f5deb3ff', white:                'ffffffff',
  whitesmoke:      'f5f5f5ff', yellow:               'ffff00ff',
  yellowgreen:     '9acd32ff', transparent:          '00000000'
};

},{}],26:[function(require,module,exports){
'use strict';

var HSLA = require( './HSLA' );

module.exports = function hsla ( h, s, l, a ) {
  return new HSLA( h, s, l, a );
};

},{"./HSLA":21}],27:[function(require,module,exports){
'use strict';

var RGBA = require( './RGBA' );

module.exports = function rgba ( r, g, b, a ) {
  return new RGBA( r, g, b, a );
};

},{"./RGBA":22}],28:[function(require,module,exports){
'use strict';

module.exports = {

  // 'v6.renderer( options )'

  MODE_AUTO: 1,
  MODE_GL:   2,
  MODE_2D:   3,

  // 'v6.ticker( update, render, context )'

  SELF_CONTEXT: 6,

  // Align constants

  BOTTOM: 7,
  RIGHT:  8,
  LEFT:   9,
  TOP:    10,
  CENTER: 11,
  MIDDLE: 12

};

},{}],29:[function(require,module,exports){
'use strict';

module.exports = {
  basicVert:      'precision mediump float;attribute vec2 apos;uniform vec2 ures;uniform mat3 utransform;void main(){gl_Position=vec4(((utransform*vec3(apos,1.0)).xy/ures*2.0-1.0)*vec2(1,-1),0,1);}',
  basicFrag:      'precision mediump float;uniform vec4 ucolor;void main(){gl_FragColor=vec4(ucolor.rgb/255.0,ucolor.a);}',
  backgroundVert: 'precision mediump float;attribute vec2 apos;void main(){gl_Position = vec4(apos,0,1);}',
  backgroundFrag: 'precision mediump float;uniform vec4 ucolor;void main(){gl_FragColor=ucolor;}'
};

},{}],30:[function(require,module,exports){
'use strict';

var Image = require( './Image' );

module.exports = function image ( url ) {
  return new Image( url );
};

},{"./Image":4}],31:[function(require,module,exports){
'use strict';

exports.identity = function identity () {
  return [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ];
};

exports.setIdentity = function setIdentity ( m1 ) {
  m1[ 0 ] = m1[ 4 ] = m1[ 8 ] = 1;
  m1[ 1 ] = m1[ 2 ] = m1[ 3 ] = m1[ 5 ] = m1[ 6 ] = m1[ 7 ] = 0;
};

exports.copy = function copy ( m1, m2 ) {
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

exports.clone = function clone ( m1 ) {
  return [
    m1[ 0 ], m1[ 1 ], m1[ 2 ],
    m1[ 3 ], m1[ 4 ], m1[ 5 ],
    m1[ 6 ], m1[ 7 ], m1[ 8 ]
  ];
};

exports.translate = function translate ( m1, x, y ) {
  m1[ 6 ] = x * m1[ 0 ] + y * m1[ 3 ] + m1[ 6 ];
  m1[ 7 ] = x * m1[ 1 ] + y * m1[ 4 ] + m1[ 7 ];
  m1[ 8 ] = x * m1[ 2 ] + y * m1[ 5 ] + m1[ 8 ];
};

exports.rotate = function rotate ( m1, angle ) {
  var m10 = m1[ 0 ],
      m11 = m1[ 1 ],
      m12 = m1[ 2 ],
      m13 = m1[ 3 ],
      m14 = m1[ 4 ],
      m15 = m1[ 5 ];

  var x = Math.cos( angle ),
      y = Math.sin( angle );

  m1[ 0 ] = x * m10 + y * m13;
  m1[ 1 ] = x * m11 + y * m14;
  m1[ 2 ] = x * m12 + y * m15;
  m1[ 3 ] = x * m13 - y * m10;
  m1[ 4 ] = x * m14 - y * m11;
  m1[ 5 ] = x * m15 - y * m12;
};

exports.scale = function scale ( m1, x, y ) {
  m1[ 0 ] *= x;
  m1[ 1 ] *= x;
  m1[ 2 ] *= x;
  m1[ 3 ] *= y;
  m1[ 4 ] *= y;
  m1[ 5 ] *= y;
};

exports.transform = function transform ( m1, m11, m12, m21, m22, dx, dy ) {
  m1[ 0 ] *= m11;
  m1[ 1 ] *= m21;
  m1[ 2 ] *= dx;
  m1[ 3 ] *= m12;
  m1[ 4 ] *= m22;
  m1[ 5 ] *= dy;
  m1[ 6 ] = 0;
  m1[ 7 ] = 0;
};

exports.setTransform = function setTransform ( m1, m11, m12, m21, m22, dx, dy ) {
  m1[ 0 ] = m11; // x scale
  m1[ 1 ] = m12; // x skew
  m1[ 3 ] = m21; // y skew
  m1[ 4 ] = m22; // y scale
  m1[ 6 ] = dx;  // x translate
  m1[ 7 ] = dy;  // y translate
};

},{}],32:[function(require,module,exports){
'use strict';

var options = require( '../options' );

function Vector2D ( x, y ) {
  this.set( x, y );
}

Vector2D.prototype = {
  set: function set ( x, y ) {

    this.x = x || 0;
    this.y = y || 0;

    return this;

  },

  setVector: function setVector ( vector ) {
    return this.set( vector.x, vector.y );
  },

  lerp: function ( x, y, value ) {

    this.x += ( x - this.x ) * value || 0;
    this.y += ( y - this.y ) * value || 0;

    return this;

  },

  lerpVector: function lerpVector ( vector, value ) {

    var x = vector.x || 0,
        y = vector.y || 0;

    return this.lerp( x, y, value );

  },

  add: function add ( x, y ) {

    this.x += x || 0;
    this.y += y || 0;

    return this;

  },

  addVector: function addVector ( vector ) {
    return this.add( vector.x, vector.y );
  },

  sub: function sub ( x, y ) {

    this.x -= x || 0;
    this.y -= y || 0;

    return this;

  },

  subVector: function subVector ( vector ) {
    return this.sub( vector.x, vector.y );
  },

  mul: function mul ( value ) {

    this.x *= value || 0;
    this.y *= value || 0;

    return this;

  },

  mulVector: function mulVector ( vector ) {

    this.x *= vector.x || 0;
    this.y *= vector.y || 0;

    return this;

  },

  div: function div ( value ) {

    this.x /= value || 0;
    this.y /= value || 0;

    return this;

  },

  divVector: function divVector ( vector ) {

    this.x /= vector.x || 0;
    this.y /= vector.y || 0;

    return this;

  },

  angle: function angle () {
    if ( options.degrees ) {
      return Math.atan2( this.y, this.x ) * 180 / Math.PI;
    }

    return Math.atan2( this.y, this.x );
  },

  mag: function mag () {
    return Math.sqrt( this.magSquare() );
  },

  magSquare: function magSquare () {
    return this.x * this.x + this.y * this.y;
  },

  setMag: function setMag ( value ) {
    return this.normalize().mult( value );
  },

  normalize: function normalize () {
    var mag = this.mag();

    if ( mag && mag !== 1 ) {
      this.div( mag );
    }

    return this;
  },

  dot: function dot ( x, y ) {
    return this.x * ( x || 0 ) + this.y * ( y || 0 );
  },

  dotVector: function dotVector ( vector ) {
    return this.x * ( vector.x || 0 ) + this.y * ( vector.y || 0 );
  },

  clone: function clone () {
    return new Vector2D( this.x, this.y );
  },

  dist: function dist ( vector ) {
    return dist( this.x, this.y, vector.x, vector.y );
  },

  limit: function limit ( value ) {
    var mag = this.magSquare();

    if ( mag > value * value ) {
      this.div( Math.sqrt( mag ) ).mult( value );
    }

    return this;
  },

  cross: function cross ( vector ) {
    return Vector2D.cross( this, vector );
  },

  toString: function toString () {
    return 'vec2(' + this.x.toFixed( 2 ) + ', ' + this.y.toFixed( 2 ) + ')';
  },

  rotate: function rotate ( angle ) {
    var x = this.x,
        y = this.y;

    var c, s;

    if ( options.degrees ) {
      angle *= Math.PI / 180;
    }

    c = Math.cos( angle );
    s = Math.sin( angle );

    this.x = x * c - y * s;
    this.y = x * s + y * c;

    return this;
  },

  setAngle: function setAngle ( angle ) {
    var mag = this.mag();

    if ( options.degrees ) {
      angle *= Math.PI / 180;
    }

    this.x = mag * Math.cos( angle );
    this.y = mag * Math.sin( angle );

    return this;
  },

  constructor: Vector2D
};

[
  'normalize',
  'setMag',
  'rotate',
  'limit',
  'lerp',
  'mul',
  'div',
  'add',
  'sub',
  'set'
].forEach( function ( method ) {
  /* jshint evil: true */
  Vector2D[ method ] = Function( 'vector, x, y, z, value', 'return vector.copy().' + method + '( x, y, z, value );' );
  /* jshint evil: false */
} );

Vector2D.random = function random () {
  var x;

  if ( options.degrees ) {
    x = 360;
  } else {
    x = Math.PI * 2;
  }

  return Vector2D.fromAngle( Math.random() * x );
};

Vector2D.fromAngle = function fromAngle ( angle ) {
  if ( options.degrees ) {
    angle *= Math.PI / 180;
  }

  return new Vector2D( Math.cos( angle ), Math.sin( angle ) );
};

Vector2D.cross = function cross ( a, b ) {
  return a.x * b.y - a.y * b.x;
};

module.exports = Vector2D;

},{"../options":36}],33:[function(require,module,exports){
'use strict';

var Vector2D = require( './Vector2D' );

var options = require( '../options' );

function Vector3D ( x, y, z ) {
  this.set( x, y, z );
}

Vector3D.prototype = {
  set: function set ( x, y, z ) {

    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;

    return this;

  },

  setVector: function setVector ( vector ) {
    return this.set( vector.x, vector.y, vector.z );
  },

  lerp: function lerp ( x, y, z, value ) {

    this.x += ( x - this.x ) * value || 0;
    this.y += ( y - this.y ) * value || 0;
    this.z += ( z - this.z ) * value || 0;

    return this;

  },

  lerpVector: function lerpVector ( vector, value ) {
    var x = vector.x || 0,
        y = vector.y || 0,
        z = vector.z || 0;

    return this.lerp( x, y, z, value );
  },

  add: function add ( x, y, z ) {

    this.x += x || 0;
    this.y += y || 0;
    this.z += z || 0;

    return this;

  },

  addVector: function addVector ( vector ) {
    return this.add( vector.x, vector.y, vector.z );
  },

  sub: function sub ( x, y, z ) {

    this.x -= x || 0;
    this.y -= y || 0;
    this.z -= z || 0;

    return this;

  },

  subVector: function subVector ( vector ) {
    return this.sub( vector.x, vector.y, vector.z );
  },

  mul: function mul ( value ) {

    this.x *= value || 0;
    this.y *= value || 0;
    this.z *= value || 0;

    return this;

  },

  mulVector: function mulVector ( vector ) {

    this.x *= vector.x || 0;
    this.y *= vector.y || 0;
    this.z *= vector.z || 0;

    return this;

  },

  div: function div ( value ) {

    this.x /= value || 0;
    this.y /= value || 0;
    this.z /= value || 0;

    return this;

  },

  divVector: function divVector ( vector ) {

    this.x /= vector.x || 0;
    this.y /= vector.y || 0;
    this.z /= vector.z || 0;

    return this;

  },

  magSquare: function magSquare () {
    // return this.dotVector( this );
    return this.x * this.x + this.y * this.y + this.z * this.z;
  },

  dot: function dot ( x, y, z ) {
    return this.x * x + this.y * y + this.z * z;
  },

  dotVector: function dotVector ( vector ) {
    var x = vector.x || 0,
        y = vector.y || 0,
        z = vector.z || 0;

    return this.dot( x, y, z );
  },

  copy: function copy () {
    return new Vector3D( this.x, this.y, this.z );
  },

  dist: function dist ( vector ) {
    var x = vector.x - this.x,
        y = vector.y - this.y,
        z = vector.z - this.z;

    return Math.sqrt( x * x + y * y + z * z );
  },

  toString: function toString () {
    return 'vec3(' + this.x.toFixed( 2 ) + ', ' + this.y.toFixed( 2 ) + ', ' + this.z.toFixed( 2 ) + ')';
  },

  normalize: Vector2D.prototype.normalize,
  setAngle:  Vector2D.prototype.setAngle,
  setMag:    Vector2D.prototype.setMag,
  rotate:    Vector2D.prototype.rotate,
  angle:     Vector2D.prototype.angle,
  limit:     Vector2D.prototype.limit,
  mag:       Vector2D.prototype.mag,

  constructor: Vector3D
};

[
  'normalize',
  'setMag',
  'rotate',
  'limit',
  'lerp',
  'mul',
  'div',
  'add',
  'sub',
  'set'
].forEach( function ( method ) {
  Vector3D[ method ] = Vector2D[ method ];
} );

// use the equal-area projection algorithm.
Vector3D.random = function random () {
  var theta = Math.random() * Math.PI * 2,
      z = Math.random() * 2 - 1,
      n = Math.root( 1 - z * z );

  return new Vector3D( n * Math.cos( theta ), n * Math.sin( theta ), z );
};

Vector3D.fromAngle = function fromAngle ( angle ) {
  if ( options.degrees ) {
    angle *= Math.PI / 180;
  }

  return new Vector3D( Math.cos( angle ), Math.sin( angle ) );
};

module.exports = Vector3D;

},{"../options":36,"./Vector2D":32}],34:[function(require,module,exports){
'use strict';

var Vector2D = require( './Vector2D' );

module.exports = function vec2 ( x, y ) {
  return new Vector2D( x, y );
};

},{"./Vector2D":32}],35:[function(require,module,exports){
'use strict';

var Vector3D = require( './Vector3D' );

module.exports = function vec3 ( x, y, z ) {
  return new Vector3D( x, y, z );
};

},{"./Vector3D":33}],36:[function(require,module,exports){
'use strict';

module.exports = {

  /**
   * Do use degrees instead of radians in the Vectors.
   */
  degress: false
};

},{}],37:[function(require,module,exports){
'use strict';

var _getContextNameGL = require( './_getContextNameGL' ),
    _optional         = require( './_optional' ),
    rendererOptions   = require( './rendererOptions' ),
    RendererGL        = require( './RendererGL' ),
    Renderer2D        = require( './Renderer2D' ),
    constants         = require( './constants' ),
    report            = require( './report' );

var once              = _optional( 'peako/once', [ 'peako', 'once' ] ),
    platform          = _optional( 'platform', [ 'platform' ] );

var getRendererMode = once( function () {
  var touchable, safari;

  if ( typeof window !== 'undefined' ) {
    touchable = 'ontouchstart' in window &&
      'ontouchmove' in window &&
      'ontouchend' in window;
  }

  if ( platform ) {
    safari = platform.os &&
      platform.os.family === 'iOS' &&
      platform.name === 'Safari';
  }

  if ( touchable && ! safari ) {
    return constants.MODE_GL;
  }

  return constants.MODE_2D;
} );

module.exports = function renderer ( options ) {
  var mode = options && options.mode || rendererOptions.mode;

  if ( mode === constants.MODE_AUTO ) {
    mode = getRendererMode();
  }

  if ( mode === constants.MODE_GL ) {
    if ( _getContextNameGL() ) {
      return new RendererGL( options );
    }

    report( 'Cannot create WebGL context, fallback to 2D.' );
  }

  if ( mode === constants.MODE_2D ||
       mode === constants.MODE_GL )
  {
    return new Renderer2D( options );
  }
};

},{"./Renderer2D":6,"./RendererGL":7,"./_getContextNameGL":16,"./_optional":17,"./constants":28,"./rendererOptions":38,"./report":39}],38:[function(require,module,exports){
'use strict';

/**
 * A default options to be used in the v6.renderer( options ) function.
 */
module.exports = {

  /**
   * A renderer's settings, all the values can be changed after creating the
   * renderer.
   */
  settings: {

    /**
     * A color mode of a renderer, use in renderer.fill( r, g, b, a ) or
     * renderer.fill( h, s, l, a ).
     */
    color: require( './colors/RGBA' ),

    /**
     * The imageSmoothingEnabled property of a renderer's context.
     */
    smooth: false,

    /**
     * Pixel density of a renderer's context.
     */
    scale: 1
  },

  /**
   * Not implemented.
   */
  antialias: true,

  /**
   * Not completed.
   */
  blending: true,

  /**
   * Do use degrees instead of radians in the Vectors.
   */
  degrees: false,

  /**
   * Do append a renderer's canvas to a page after.
   */
  append: true,

  /**
   * Use a transparent background for a renderer's context.
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
   */
  alpha: true,

  /**
   * A mode of a renderer's context, (MODE_2D, MODE_GL, MODE_AUTO). When the
   * mode is MODE_AUTO for mobile platforms 'webgl' instead of '2d' to be used.
   */
  mode: require( './constants' ).MODE_2D
};

},{"./colors/RGBA":22,"./constants":28}],39:[function(require,module,exports){
'use strict';

var report, reported;

if ( typeof console !== 'undefined' && console.warn ) {
  reported = {};

  report = function report ( message ) {
    if ( reported[ message ] ) {
      return;
    }

    console.warn( message );

    reported[ message ] = true;
  };
} else {
  report = require( './_optional' )( 'peako/noop', [ 'peako', 'noop' ] );
}

module.exports = report;

},{"./_optional":17}],40:[function(require,module,exports){
'use strict';

var Ticker = require( './Ticker' );

module.exports = function ticker ( update, render, context ) {
  return new Ticker( update, render, context );
};

},{"./Ticker":9}],41:[function(require,module,exports){
/*!
 * Copyright (c) 2017-2018 SILENT
 * Released under the MIT License.
 * https://github.com/silent-tempest/v6
 */

'use strict';

var v6 = {
  Camera:          require( './Camera' ),
  CompoundedImage: require( './CompoundedImage' ),
  HSLA:            require( './colors/HSLA' ),
  Image:           require( './Image' ),
  RGBA:            require( './colors/RGBA' ),
  Renderer2D:      require( './Renderer2D' ),
  RendererGL:      require( './RendererGL' ),
  ShaderProgram:   require( './ShaderProgram' ),
  Ticker:          require( './Ticker' ),
  Transform:       require( './Transform' ),
  Vector2D:        require( './math/Vector2D' ),
  Vector3D:        require( './math/Vector3D' ),
  camera:          require( './camera' ),
  color:           require( './colors/color' ),
  constants:       require( './constants' ),
  defaultShaders:  require( './defaultShaders' ),
  hsla:            require( './colors/hsla' ),
  image:           require( './image' ),
  options:         require( './options' ),
  renderer:        require( './renderer' ),
  rendererOptions: require( './rendererOptions' ),
  rgba:            require( './colors/rgba' ),
  ticker:          require( './ticker' ),
  vec2:            require( './math/vec2' ),
  vec3:            require( './math/vec3' )
};

if ( typeof self !== 'undefined' ) {
  self.v6 = v6;
}

module.exports = v6;

},{"./Camera":1,"./CompoundedImage":2,"./Image":4,"./Renderer2D":6,"./RendererGL":7,"./ShaderProgram":8,"./Ticker":9,"./Transform":10,"./camera":20,"./colors/HSLA":21,"./colors/RGBA":22,"./colors/color":24,"./colors/hsla":26,"./colors/rgba":27,"./constants":28,"./defaultShaders":29,"./image":30,"./math/Vector2D":32,"./math/Vector3D":33,"./math/vec2":34,"./math/vec3":35,"./options":36,"./renderer":37,"./rendererOptions":38,"./ticker":40}]},{},[41]);
