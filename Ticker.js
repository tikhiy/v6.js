'use strict';

var LightEmitter = require( 'light_emitter' );
var timestamp    = require( 'peako/timestamp' );
var timer        = require( 'peako/timer' );

/**
 * Этот класс используется для зацикливания анимации вместо `requestAnimationFrame`.
 * @constructor v6.Ticker
 * @extends {LightEmitter}
 * @fires update
 * @fires render
 * @example
 * var Ticker = require( 'v6.js/Ticker' );
 * var ticker = new Ticker();
 * @example <caption>"update" event.</caption>
 * // Fires everytime an application should be updated.
 * // Depends on maximum FPS.
 * ticker.on( 'update', function ( elapsedTime ) {
 *   shape.rotation += 10 * elapsedTime;
 * } );
 * @example <caption>"render" event.</caption>
 * // Fires everytime an application should be rendered.
 * // Unlike "update", independent from maximum FPS.
 * ticker.on( 'render', function () {
 *   renderer.rotate( shape.rotation );
 * } );
 */
function Ticker ()
{
  var self = this;

  LightEmitter.call( this );

  this.lastRequestAnimationFrameID = 0;
  this.lastRequestTime = 0;
  this.skippedTime = 0;
  this.totalTime = 0;
  this.running = false;

  /**
   * Запускает цикл анимации.
   * @method v6.Ticker#start
   * @chainable
   */
  function start ( _now )
  {
    var elapsedTime;

    if ( ! self.running ) {
      if ( ! _now ) {
        self.lastRequestAnimationFrameID = timer.request( start );
        self.lastRequestTime = timestamp();
        self.running = true;
      }

      return this; // eslint-disable-line no-invalid-this
    }

    if ( ! _now ) {
      _now = timestamp();
    }

    elapsedTime = Math.min( 1, ( _now - self.lastRequestTime ) * 0.001 );

    self.skippedTime += elapsedTime;
    self.totalTime   += elapsedTime;

    while ( self.skippedTime >= self.step && self.running ) {
      self.skippedTime -= self.step;
      self.emit( 'update', self.step, _now );
    }

    self.emit( 'render', elapsedTime, _now );
    self.lastRequestTime = _now;
    self.lastRequestAnimationFrameID = timer.request( start );

    return this; // eslint-disable-line no-invalid-this
  }

  this.start = start;
  this.fps( 60 );
}

Ticker.prototype = Object.create( LightEmitter.prototype );
Ticker.prototype.constructor = Ticker;

/**
 * Устанавливает максимальное количество кадров в секунду (FPS) анимации.
 * @method v6.Ticker#fps
 * @param {number} fps Максимальный FPS, например: 60.
 * @chainable
 * @example
 * // Set maximum animation FPS to 10.
 * // Do not need to restart ticker.
 * ticker.fps( 10 );
 */
Ticker.prototype.fps = function fps ( fps )
{
  this.step = 1 / fps;
  return this;
};

/**
 * @method v6.Ticker#clear
 * @chainable
 */
Ticker.prototype.clear = function clear ()
{
  this.skippedTime = 0;
  return this;
};

/**
 * Останавливает анимацию.
 * @method v6.Ticker#stop
 * @chainable
 * @example
 * ticker.on( 'render', function () {
 *   // Stop the ticker after five seconds.
 *   if ( this.totalTime >= 5 ) {
 *     ticker.stop();
 *   }
 * } );
 */
Ticker.prototype.stop = function stop ()
{
  this.running = false;
  return this;
};

module.exports = Ticker;
