;( function ( window ) {

'use strict';

// position and size of slashes
var x = 0,
    y = 0,
    spacing = 50;

// create and setup a renderer
var renderer = v6()
  .stroke( 255 )
  .lineWidth( 5 )
  .background( 51 );

// create a ticker (game loop)
var ticker = v6.ticker( function () {
  // 60% chance for draw a backslash
  if ( Math.random() < 0.6 ) {    
    renderer.line( x, y, x + spacing, y + spacing );
  } else {
    renderer.line( x, y + spacing, x + spacing, y );
  }

  // change our position
  if ( ( x += spacing ) >= renderer.width ) {
    if ( ( y += spacing ) >= renderer.height ) {
      // and stop the ticker if we out of a screen
      return ticker.stop();
    }

    // go to begin of a new line
    x = 0;
  }
} ).tick();
//      ^^
// run it

// and please help me with english articles...

} )( this );
