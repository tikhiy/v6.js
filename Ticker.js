'use strict';

var LightEmitter = require( 'light_emitter' );
var extend       = require( 'extend' );
var timestamp    = require( 'peako/timestamp' );
var timer        = require( 'peako/timer' );

var Ticker = extend( LightEmitter, {
  /**
   * @constructor module:"v6.js".Ticker
   * @extends {LightEmitter}
   */
  constructor: function Ticker () {
    var self = this;

    this.__super__.call( this );
    this.lastRequestAnimationFrameID = 0;
    this.lastRequestTime = 0;
    this.skippedTime = 0;
    this.totalTime = 0;
    this.running = false;

    function tick ( now ) {
      var elapsedTime;

      if ( ! self.running ) {
        if ( ! now ) {
          self.lastRequestAnimationFrameID = timer.request( tick );
          self.lastRequestTime = timestamp();
          self.running = true;
        }

        return this; // jshint ignore: line
      }

      if ( ! now ) {
        now = timestamp();
      }

      elapsedTime = Math.min( 1, ( now - self.lastRequestTime ) * 0.001 );

      self.skippedTime += elapsedTime;
      self.totalTime   += elapsedTime;

      while ( self.skippedTime >= self.step && self.running ) {
        self.skippedTime -= self.step;
        self.emit( 'update', self.step, now );
      }

      self.emit( 'render', elapsedTime, now );
      self.lastRequestTime = now;
      self.lastRequestAnimationFrameID = timer.request( tick );

      return this; // jshint ignore: line
    }

    this.tick = tick;
    this.setFPS( 60 );
  },

  /**
   * @method module:"v6.js".Ticker#setFPS
   * @param {number} fps
   * @chainable
   */
  setFPS: function setFPS ( fps ) {
    this.step = 1 / fps;
    return this;
  },

  /**
   * @method module:"v6.js".Ticker#clear
   * @chainable
   */
  clear: function clear () {
    this.skippedTime = 0;
    return this;
  },

  /**
   * @method module:"v6.js".Ticker#stop
   * @chainable
   */
  stop: function stop () {
    this.running = false;
    return this;
  }
} );

module.exports = Ticker;
