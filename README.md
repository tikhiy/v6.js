# v6.js

[![Coverage Status](https://coveralls.io/repos/github/tikhiy/v6.js/badge.svg?branch=dev)](https://coveralls.io/github/tikhiy/v6.js?branch=dev)
[![Size](http://img.badgesize.io/tikhiy/v6.js/dev/dist/v6.min.js.gz.svg?&label=lightweight)](https://github.com/ngryman/badge-size)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](LICENSE)

A JavaScript (ES5) library for rendering. Simple API for both WebGL and 2D contexts.

### Installing

* `npm install --save github:tikhiy/v6.js#v0.2.0`

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

* `make lint:core`, `ESLINT='--fix' make lint:core`
* `make lint:test`, `ESLINT='--fix' make lint:test`

##### Testing

* First, create `config/browsers.txt` (ignored in `.gitignore`) for your system:
```bash
FIREFOX_DEVELOPER_BIN=firefox-developer
CHROMIUM_BIN=chromium-browser
FIREFOX_BIN=firefox
CHROME_BIN=google-chrome
```
* `node test/internal/server`
* `make mocha`, `MOCHA='--reporter spec' make mocha`
* `make karma`, `KARMA='--browsers FirefoxDeveloper --reporters mocha' make karma`

##### Coveralls

* `make coverage`

##### Before Committing

* `npm run prepublish`

### License

Released under the [MIT](LICENSE) license.
