'use strict';
var LightEmitter = require( 'light_emitter' );
var timestamp = require( 'peako/timestamp' );
var timer = require( 'peako/timer' );
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
  this.settings = {};
  /**
   * Запускает цикл анимации.
   * @method v6.Ticker#start
   * @chainable
   * @example
   * ticker.start();
   */
  function start ( _now )
  {
    var elapsedTime;
    var frameTime;
    if ( ! self.running ) {
      if ( ! _now ) {
        self.lastRequestAnimationFrameID = timer.request( start );
        self.lastRequestTime = timestamp();
        self.running = true;
      }
      return this; // eslint-disable-line no-invalid-this
    }
    if ( ! _now ) {
      return this; // eslint-disable-line no-invalid-this
    }
    elapsedTime = Math.min( 1, ( _now - self.lastRequestTime ) * 0.001 );
    self.skippedTime += elapsedTime;
    self.totalTime += elapsedTime;
    frameTime = self.settings[ 'frame time' ];
    while ( self.skippedTime >= frameTime && self.running ) {
      self.skippedTime -= frameTime;
      self.emit( 'update', frameTime, _now );
    }
    self.emit( 'render', elapsedTime, _now );
    self.lastRequestTime = _now;
    self.lastRequestAnimationFrameID = timer.request( start );
    return this; // eslint-disable-line no-invalid-this
  }
  this.start = start;
  this.set( 'FPS', 60 );
}
Ticker.prototype = Object.create( LightEmitter.prototype );
Ticker.prototype.constructor = Ticker;
/**
 * Set new value of a setting.
 * @method v6.Ticker#set
 * @param  {string} setting The setting`s key, e.g.: "FPS", "frame time".
 * @param  {any}    value   New setting`s value.
 * @return {void}           Returns nothing.
 * @example
 * ticker.set( 'FPS', 120 );
 */
Ticker.prototype.set = function set ( setting, value )
{
  if ( isInvalidSetting( setting ) ) { throw Error( 'Got unknown setting key: ' + setting ); } /* eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len*/
  if ( setting === 'FPS' ) {
    this.settings[ 'frame time' ] = 1 / value;
  } else if ( setting === 'frame time' ) {
    this.settings[ 'FPS' ] = 1 / value; // eslint-disable-line dot-notation
  }
  this.settings[ setting ] = value;
};
/**
 * Get current value of a setting.
 * @method v6.Ticker#get
 * @param  {string} setting The setting`s key, e.g.: "FPS", "frame time".
 * @return {any}            The setting`s value.
 * @example
 * var frameTime = ticker.get( 'frame time' );
 */
Ticker.prototype.get = function get ( setting )
{
  if ( isInvalidSetting( setting ) ) { throw Error( 'Got unknown setting key: ' + setting ); } /* eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len*/
  return this.settings[ setting ];
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
function isInvalidSetting ( setting )
{
  return setting !== 'frame time' && setting !== 'FPS';
}
module.exports = Ticker;
