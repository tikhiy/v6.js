# v6

The main feature of the v6 is the use of one-code for the 2D and WebGL contexts (**only** 2D).

### Install

##### [Node.js](https://nodejs.org/en/about/) / [Browserify](http://browserify.org/)

Install the library `$ npm install v6`. Install an optional dependency `$ npm install platform`.

```javascript
// require whole the library.
var v6   = require( 'v6' );
// require a sub-module of the library.
var hsla = require( 'v6/hsla' );

// Not working in Node.js because there is no Browser/DOM API.
var renderer = v6.renderer( {
  mode: v6.constants.RENDERER_MODE_AUTO
} );

var DARK_MAGENTA = hsla( 'magenta' ).shade( -25 );
```

##### Browser

```html
<script src="https://rawgit.com/silent-tempest/peako/dev/build/peako.js"></script>
<script src="https://rawgit.com/silent-tempest/v6/dev/build/v6.js"></script>
<!-- optional script -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/platform/1.3.5/platform.min.js"></script>
```

```javascript
var ticker = v6.ticker( update, render );

function update ( elapsedTime ) {
  console.log( elapsedTime );
}

function render ( elapsedTime ) {
  renderer
    .backgroundColor( 'lightskyblue' )
    .polygon( x, y, r, 3 );
}
```

### Dependencies

The library has a hard-dependency on [peako](https://github.com/silent-tempest/peako), and an optional on [platform.js](https://github.com/bestiejs/platform.js).

### Hello World

A ~~simple~~ example of use:

```javascript
var constants = require( 'v6/constants' ),
    Renderer  = require( 'v6/renderer' ),
    Ticker    = require( 'v6/ticker' );

var options = {
  settings: {
    colorMode: constants.HSLA
  },

  mode: constants.RENDERER_MODE_AUTO
};

var renderer = Renderer( options );

function render () {
  var w = renderer.width,
      h = renderer.height;

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

Use `$ make` to build the project.

### License

Released under the [MIT License](LICENSE).
