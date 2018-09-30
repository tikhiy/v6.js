'use strict';

module.exports = HSLA;

var clamp = require( 'peako/clamp' );
var RGBA  = require( './RGBA' );
var parse = require( './internal/parse' );

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

  // '' + new HSLA( 'red' ); // -> "hsla(0, 100%, 50%, 1)"

  toString: function toString () {
    return 'hsla(' + this[ 0 ] + ', ' + this[ 1 ] + '\u0025, ' + this[ 2 ] + '\u0025, ' + this[ 3 ] + ')';
  },

  // new HSLA()
  //   .set( 'red' )      // -> 0, 100, 50, 1
  //   .set( '#ff0000' ); // -> 0, 100, 50, 1

  set: function set ( h, s, l, a ) {
    switch ( true ) {
      case typeof h === 'string':
        h = parse( h );
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
        switch ( void 0 ) {
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
