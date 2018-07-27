# v6

The main feature of the v6 is the use of one-code for the 2D and WebGL contexts (**only** 2D).

### Install

##### [Node.js](https://nodejs.org/en/about/) / [Browserify](http://browserify.org/)

Install the library `$ npm install --save v6.js`. Install an optional dependency `$ npm install --save platform`.

```javascript
// require whole the library.
var v6   = require( 'v6.js' );
// require a sub-module of the library.
var hsla = require( 'v6.js/colors/hsla' );

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
var constants = require( 'v6/constants' ),
    Renderer  = require( 'v6/renderer' ),
    Ticker    = require( 'v6/ticker' );

var options = {
  settings: {
    colorMode: constants.HSLA
  },

  mode: constants.MODE_AUTO
};

var renderer = Renderer( options );

function render () {
  var w = renderer.w,
      h = renderer.h;

  // r is from min( w, h ) / 10 through 250
  var r = Math.min( 250, Math.min( w, h ) / 10 );

  // n is from 3 through totalTime in seconds
  var n = Math.max( 3, this.totalTime );

  renderer
    .background( this.totalTime, 80, 80 )
    .polygon( w / 2, h / 2, r, n );
}

var ticker = Ticker( render );

ticker.tick()
```

### Build

Use `$ make` to build v6.js.

### License

Released under the [MIT License](LICENSE).
