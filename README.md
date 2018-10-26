# v6.js

[![Coverage Status](https://coveralls.io/repos/github/tikhiy/v6.js/badge.svg?branch=dev)](https://coveralls.io/github/tikhiy/v6.js?branch=dev)
[![Size](http://img.badgesize.io/tikhiy/v6.js/dev/dist/v6.min.js.gz.svg?&label=lightweight)](https://github.com/ngryman/badge-size)

A JavaScript (ES5) library for rendering. Simple API for both WebGL and 2D contexts.

### Installing

Installing via [npm](https://www.npmjs.com/): `$ npm install --save github:tikhiy/v6.js#dev`.

### Example

* Importing the library.

```javascript
var createRenderer = require( 'v6.js/core/renderer/create_renderer' );
var constants      = require( 'v6.js/core/constants' );
var HSLA           = require( 'v6.js/core/color/HSLA' );
var Ticker         = require( 'v6.js/core/Ticker' );
```

* Creating a renderer.

```javascript
var renderer = createRenderer( {
  settings: {
    color: HSLA
  },

  type: constants.get( 'AUTO' )
} );
```

* Creating a ticker.

```javascript
var ticker = new Ticker();
```

* Adding a render function to the ticker.

```javascript
ticker.on( 'render', function ()
{
  var hue = Math.floor( this.totalTime * 10 );
  renderer.backgroundColor( hue, 80, 80 );
  renderer.stroke( 'white' );
  renderer.fill( 'black' );
  renderer.polygon( renderer.w / 2, renderer.h / 2, 5, 100 );
} );
```

* Starting the application.

```javascript
ticker.start();
```

* Adding auto-resize for the renderer.

```javascript
window.addEventListener( 'resize', function ()
{
  renderer.resizeTo( this );
} );
```

### Development

##### Preprocessing

* `make preprocess -B`

##### Linting

* `make lint:core`
* `make lint:test`

##### Testing

* First, edit `build/browsers.txt` (it is ignored in `.gitignore`) for your system
* `make start_static_server &`
* `make mocha`
* `make karma`

##### Before Committing

* `npm run prepublish`

### License

Released under the [GPL-3.0](LICENSE) license.
