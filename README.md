# v6.js

The main feature of the v6.js is the use of one-code for the 2D and WebGL contexts (**only** 2D), see an [example](https://github.com/silent-tempest/v6.js-example/).

### Installation ([Node.js](https://nodejs.org/en/about/) / [Browserify](http://browserify.org/))

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

### License

Released under the [MIT License](LICENSE).
