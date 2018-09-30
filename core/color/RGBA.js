'use strict';

module.exports = RGBA;

var parse = require( './internal/parse' );

var HSLA  = require( './HSLA' );

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
        r = parse( r );
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
        switch ( void 0 ) {
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

  shade: function shade ( value ) {
    return this.hsla().shade( value ).rgba();
  },

  constructor: RGBA,
  type: 'rgba'
};
