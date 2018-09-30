# `v6.js`

`v6.js` представляет из себя JavaScript (ES5) модуль для отрисовки чего либо. Главная фишка `v6.js` - это один API для WebGL и 2D контекста.

### Установка

Установка для [Node.js](https://nodejs.org/en/about/) или [Browserify](http://browserify.org/) через [npm](https://www.npmjs.com/): `$ npm install --save v6.js`.

### Пример

```javascript
// Import the "v6.js".
var createRenderer = require( 'v6.js/core/renderer' );
var constants      = require( 'v6.js/core/constants' );
var HSLA           = require( 'v6.js/core/color/HSLA' );
var Ticker         = require( 'v6.js/core/Ticker' );
// Create "v6.js" renderer.
var renderer = createRenderer( {
  settings: {
    color: HSLA
  },
  type: constants.get( 'RENDERER_AUTO' )
} )
  .stroke( 'black' )
  .fill( 'white' );
// Create "v6.js" ticker.
var ticker = new Ticker()
  .on( 'render', function ()
  {
    renderer.background( this.totalTime * 10 | 0, 80, 80 );
    renderer.polygon( renderer.w / 2, renderer.h / 2, 100, 5 );
  } )
  .start();
// Auto-resize the renderer.
self.addEventListener( 'resize', function ()
{
  renderer.resizeTo( this );
} );
```

### License

Released under the [GPL-3.0](LICENSE) license.
