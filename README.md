# v6

A simple graphics library, with which you can easily create cool games and applications.

## Install

This library has a dependency on [Peako](https://github.com/silent-tempest/Peako).

```html
<!-- Import from GitHub CDN. -->
<script src="https://rawgit.com/silent-tempest/Peako/master/peako.js"></script>
<script src="https://rawgit.com/silent-tempest/v6/master/v6.js"></script>
<!-- Import local files. -->
<script src="peako.js"></script>
<script src="v6.js"></script>
<!-- Of course, you can combine it. -->
```

## Hello World

A simple example of use this library:

```javascript
/** Create and setup the renderer. */
var renderer = v6()
  .stroke(0)
  .fill(255);

/** Number of sides of the polygon. */
var sides = 3;

/** Create the game loop and run it. */
var ticker = v6.ticker(update, render)
  .tick();

/** Update function (you can use `elapsedTime`, it's passed as the first argument). */
function update() {
  sides = v6.map(Math.sin(ticker.totalTime), -1, 1, 3, 12);
}

/** Render function. */
function render() {
  var x = renderer.width * 0.5,
      y = renderer.height * 0.5,
      radius = 100;

  renderer
    .background('lightskyblue')
    .polygon(x, y, radius, sides);
}
```

## v6.ticker(update, render, context)

This class is used to loop an animation.

#### Simple example

Do you wrote code like this before?

```javascript
var reqAnimFrame = requestAnimationFrame || lalala...;

function loop () {
  reqAnimFrame(loop);
  someDrawStuff();
}

loop();
```

Now you can write this:

```javascript
v6
  .ticker(someDrawStuff)
  .tick();
```

It will work well in old browsers too.

#### Adavnced example

```javascript
var game = {
  update: function (elapsedTime, now) {
    console.log(elapsedTime, now, this === game);
    // -> 0.0166 168 true
  },

  render: function (elapsedTime, now) {
    console.log(elapsedTime, now, this === game);
    // -> 0.0166 168 true
  },

  init: function () {
    this.ticker = v6
      .ticker(this.update, this.render, this)
      .setFrameRate(60) // 60 by default
      .tick();
  }
};

game.init();
```

#### Why update and render

The difference between `update` and` render` is that `render` will be called regardless of the specified FPS, and` update` only when more than 1 / FPS seconds has passed.

#### Context

* null: the functions will called without context (`undefined`).
* undefined (by default): `this` will point to the `ticker` object.
* otherwise the passed context will be used.

## v6(options)

#### Options

Some basic options (to find more see v6.options):

```javascript
options = {
  settings: {
    // The renderer pixel density (1 default)
    scale: window.devicePixelRatio || 1,
    // The renderer default color mode ('rgba' default)
    colorMode: 'hsla'
  },

  // Mode will me selected automatically, it's dependence on the client platform.
  // For mobiles "webgl" mode will be used, instead of '2d'.
  // NOTE To fully use the auto mode you need to include the platform.js library
  mode: 'auto',

  // The default mode
  mode: '2d',

  // Use WebGL to draw graphics (2D)
  mode: 'webgl'
};
```

#### Example

```javascript
var renderer = v6();

renderer
  // Set fill color
  .fill(51)
  // Set stroke color
  .stroke('white')
  // Draw circle in the middle
  .arc(renderer.width / 2, renderer.height / 2, 100);
```

## v6.color(), v6.rgba(), v6.hsla()

#### Use

The results is the same.

```javascript
renderer
  .fill('rgb(0, 0, 0)')
  .fill('rgba(0, 0, 0, 1)')
  .fill('hsl(0, 0%, 0%)')
  .fill('hsla(0, 0%, 0%, 1)')
  .fill('#000')
  .fill('#000f')
  .fill('#000000')
  .fill('#000000ff')
  .fill('black')
  .colorMode('rgba')
  .fill(0)
  .fill(0, 1)
  .fill(0, 0, 0)
  .fill(0, 0, 0, 1)
  .colorMode('hsla')
  .fill(0)
  .fill(0, 1)
  .fill(0, 0, 0)
  .fill(0, 0, 0, 1)
  .fill(v6.rgba('hsl(0, 0%, 0%)'))
  // ... do you understand what i mean?
```

#### Color Mode

```javascript
renderer
  // Set color mode ('rgba', 'hsla')
  .colorMode('hsla')
  // Shortcut for (0, 0, 20, 1)
  .fill(20)
  // Some blue stroke color
  .stroke(220, 100, 50);
```

## License

[MIT License](LICENSE).
