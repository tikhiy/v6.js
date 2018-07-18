'use strict';

// export before call recursive require
module.exports = parseColor;

var create  = require( 'peako/create' ),
    trim    = require( 'peako/trim' );

var RGBA    = require( './RGBA' ),
    HSLA    = require( './HSLA' ),
    colors  = require( './colors' );

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

// parseColor( '#f0f0' );                     // -> new RGBA( 255, 0, 255, 0 )
// parseColor( '#000000ff' );                 // -> new RGBA( 0, 0, 0, 1 )
// parseColor( 'magenta' );                   // -> new RGBA( 255, 0, 255, 1 )
// parseColor( 'transparent' );               // -> new RGBA( 0, 0, 0, 0 )
// parseColor( 'hsl( 0, 100%, 50% )' );       // -> new HSLA( 0, 100, 50, 1 )
// parseColor( 'hsla( 0, 100%, 50%, 0.5 )' ); // -> new HSLA( 0, 100, 50, 0.5 )

function parseColor ( string ) {
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
