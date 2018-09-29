# `v6.js`

`v6.js` представляет из себя JavaScript (ES5) модуль для отрисовки чего либо. Главная фишка `v6.js` - это один API для WebGL и 2D контекста.

### Установка

Установка для [Node.js](https://nodejs.org/en/about/) или [Browserify](http://browserify.org/) через [npm](https://www.npmjs.com/): `$ npm install --save v6.js`.

### Пример

```javascript
// importing v6.js
var createRenderer = require( 'v6.js/create_renderer' );
var constants      = require( 'v6.js/constants' );
var HSLA           = require( 'v6.js/colors/HSLA' );
var Ticker         = require( 'v6.js/Ticker' );
// creating v6.js renderer
var renderer = createRenderer( {
  settings: {
    color: HSLA
  },
  type: constants.get( 'RENDERER_AUTO' )
} )
  .stroke( 'black' )
  .fill( 'white' );
// creating v6.js ticker
var ticker = new Ticker()
  .on( 'render', function ()
  {
    renderer.background( this.totalTime * 10 | 0, 80, 80 );
    renderer.polygon( renderer.w / 2, renderer.h / 2, 100, 5 );
  } )
  .start();
// auto-resize the renderer
self.addEventListener( 'resize', function ()
{
  renderer.resizeTo( this );
} );
```

### License

Released under the [MIT License](LICENSE).
