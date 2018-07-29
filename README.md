# v6

The main feature of the v6 is the use of one-code for the 2D and WebGL contexts (**only** 2D).

### Install ([Node.js](https://nodejs.org/en/about/) / [Browserify](http://browserify.org/))

Install the library `$ npm install --save v6.js`. Install an optional dependency `$ npm install --save platform`.

```javascript
// require a sub-module of the library.
var hsla = require( 'v6.js/colors/hsla' );
// require whole the library.
var v6   = require( 'v6.js' );

var renderer = v6.renderer( {
  mode: v6.constants.MODE_AUTO
} );

var DARK_MAGENTA = hsla( 'magenta' ).shade( -25 );
```

### Dependencies

The library has a hard-dependency on [peako](https://github.com/silent-tempest/peako), and an optional on [platform.js](https://github.com/bestiejs/platform.js).

### Hello World

An example of use:

```javascript
'use strict';

var constants = require( 'v6.js/constants' ),
    Renderer  = require( 'v6.js/renderer' ),
    Ticker    = require( 'v6.js/ticker' );

var options = {
  settings: {
    color: require( 'v6.js/colors/HSLA' )
  },

  mode: constants.MODE_AUTO
};

var renderer = Renderer( options ).fill( 'white' );

function render () {
  var w = renderer.w,
      h = renderer.h;

  // r is from min( w, h ) / 5 through 400
  var r = Math.min( Math.min( w, h ) / 5, 400 );

  // n is from 3 through 9
  var n = 3 + ( Math.sin( this.totalTime ) + 1 ) * 3;

  renderer
    .background( this.totalTime * 25, 80, 80 )
    .polygon( w / 2, h / 2, r, n );
}

var ticker = Ticker( render ).tick();
```

### Build

Use `$ make` to build v6.js.

### License

Released under the [MIT License](LICENSE).
