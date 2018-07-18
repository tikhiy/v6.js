'use strict';

var timer     = require( 'peako/timer' ),
    timestamp = require( 'peako/timestamp' ),
    noop      = require( 'peako/noop' );

// jshint -W024
var undefined;
// jshint +W024

function Ticker ( update, render, context ) {
  var self = this;

  if ( context === undefined ) {
    if ( typeof render !== 'function' ) {
      return new Ticker( update, null, render );
    }

    context = this;
  }

  if ( render == null ) {
    render = update;
    update = noop;
  }

  this.lastRequestAnimationFrameID = 0;
  this.lastRequestTime = 0;
  this.skippedTime = 0;
  this.totalTime = 0;
  this.running = false;
  this.update = update;
  this.render = render;
  this.context = context;

  function tick ( now ) {
    var elapsedTime;

    if ( ! self.running ) {
      // if it is just `ticker.tick();` (not `self.lastRequestAnimationFrameID = timer.request( tick );`).
      if ( ! now ) {
        self.lastRequestAnimationFrameID = timer.request( tick );
        self.lastRequestTime = timestamp();
        self.running = true;
      }

      return;
    }

    // see the comment above
    if ( ! now ) {
      now = timestamp();
    }

    elapsedTime = Math.min( 1, ( now - self.lastRequestTime ) * 0.001 );

    self.skippedTime += elapsedTime;
    
    self.totalTime += elapsedTime;

    while ( self.skippedTime >= self.step && self.running ) {
      self.skippedTime -= self.step;

      if ( self.context ) {
        self.update.call( self.context, self.step, now );
      } else {
        self.update( self.step, now );
      }
    }

    if ( self.context ) {
      self.render.call( self.context, elapsedTime, now );
    } else {
      self.render( elapsedTime, now );
    }

    self.lastRequestTime = now;

    self.lastRequestAnimationFrameID = timer.request( tick );

    // no reason to return self
    // jshint -W040
    return this;
    // jshint +W040
  }

  this.tick = tick;

  this.setFPS( 60 );
}

Ticker.prototype = {
  setFPS: function setFPS ( fps ) {
    this.step = 1 / fps;
    return this;
  },

  clear: function clear () {
    this.skippedTime = 0;
    return this;
  },

  stop: function stop () {
    this.running = false;
    return this;
  },

  constructor: Ticker
};

module.exports = Ticker;
