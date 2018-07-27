'use strict';

var timestamp = require( 'peako/timestamp' );

var timer     = require( 'peako/timer' );

var noop      = require( 'peako/noop' );

var constants = require( './constants' );

function Ticker ( update, render, context ) {
  var self = this;

  if ( typeof render !== 'function' ) {
    context = render;
    render = null;
  }

  if ( context === constants.SELF_CONTEXT ) {
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

  function tick ( now ) {
    var elapsedTime;

    if ( ! self.running ) {

      // if it is just `ticker.tick();` (not `self.lastRequestAnimationFrameID = timer.request( tick );`).

      if ( ! now ) {
        self.lastRequestAnimationFrameID = timer.request( tick );
        self.lastRequestTime = timestamp();
        self.running = true;
      }

      return this; // jshint ignore: line
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

      if ( typeof context !== 'undefined' ) {
        self.update.call( context, self.step, now );
      } else {
        self.update( self.step, now );
      }
    }

    if ( typeof context !== 'undefined' ) {
      self.render.call( context, elapsedTime, now );
    } else {
      self.render( elapsedTime, now );
    }

    self.lastRequestTime = now;

    self.lastRequestAnimationFrameID = timer.request( tick );

    return this; // jshint ignore: line
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
