# v6
A simple JavaScript render engine, with which you can easily create cool games and applications.

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

/** Update function (you can use `deltaTime`, it's passed as the first argument). */
function update() {
  sides = v6.map(Math.sin(ticker.total), -1, 1, 3, 12);
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
