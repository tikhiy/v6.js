'use strict';

var settings       = require( '../settings' );
var AbstractVector = require( './AbstractVector' );

/**
 * 2D вектор.
 * @constructor v6.Vector2D
 * @extends v6.AbstractVector
 * @param {number} [x=0] X координата вектора.
 * @param {number} [y=0] Y координата вектора.
 * @example
 * var Vector2D = require( 'v6.js/math/Vector2D' );
 * var position = new Vector2D( 4, 2 );
 */
function Vector2D ( x, y ) {
  /**
   * X координата вектора.
   * @member {number} v6.Vector2D#x
   * @example
   * var x = new Vector2D( 4, 2 ).x; // -> 4
   */

  /**
   * Y координата вектора.
   * @member {number} v6.Vector2D#y
   * @example
   * var y = new Vector2D( 4, 2 ).y; // -> 2
   */

  this.set( x, y );
}

Vector2D.prototype = Object.create( AbstractVector.prototype );
Vector2D.prototype.constructor = Vector2D;

/**
 * Устанавливает X и Y координаты.
 * @method v6.Vector2D#set
 * @param {number} [x=0] Новая X координата.
 * @param {number} [y=0] Новая Y координата.
 * @chainable
 */
Vector2D.prototype.set = function set ( x, y ) {
  this.x = x || 0;
  this.y = y || 0;
  return this;
};

/**
 * Добавляет к координатам X и Y соответствующие параметры.
 * @method v6.Vector2D#add
 * @param {number} [x=0] Число, которое должно быть добавлено.
 * @param {number} [y=0] Число, которое должно быть добавлено.
 * @chainable
 */
Vector2D.prototype.add = function add ( x, y ) {
  this.x += x || 0;
  this.y += y || 0;
  return this;
};

/**
 * Вычитает из координат X и Y соответствующие параметры.
 * @method v6.Vector2D#sub
 * @param {number} [x=0] Число, которое должно быть вычтено.
 * @param {number} [y=0] Число, которое должно быть вычтено.
 * @chainable
 */
Vector2D.prototype.sub = function sub ( x, y ) {
  this.x -= x || 0;
  this.y -= y || 0;
  return this;
};

/**
 * Умножает X и Y координаты на `value`.
 * @method v6.Vector2D#mul
 * @param {number} value Число, на которое надо умножить.
 * @chainable
 */
Vector2D.prototype.mul = function mul ( value ) {
  this.x *= value;
  this.y *= value;
  return this;
};

/**
 * Делит X и Y координаты на `value`.
 * @method v6.Vector2D#div
 * @param {number} value Число, на которое надо разделить.
 * @chainable
 */
Vector2D.prototype.div = function div ( value ) {
  this.x /= value;
  this.y /= value;
  return this;
};

/**
 * @method v6.Vector2D#dot
 * @param  {number} [x=0]
 * @param  {number} [y=0]
 * @return {number}
 */
Vector2D.prototype.dot = function dot ( x, y ) {
  return this.x * ( x || 0 ) + this.y * ( y || 0 );
};

/**
 * Интерполирует X и Y координаты между соответствующими параметрами.
 * @method v6.Vector2D#lerp
 * @param {number} x
 * @param {number} y
 * @param {number} value
 * @chainable
 */
Vector2D.prototype.lerp = function ( x, y, value ) {
  this.x += ( x - this.x ) * value || 0;
  this.y += ( y - this.y ) * value || 0;
  return this;
};

/**
 * Копирует другой вектор.
 * @method v6.Vector2D#setVector
 * @param {v6.AbstractVector} vector Вектор, который надо скопировать.
 * @chainable
 */
Vector2D.prototype.setVector = function setVector ( vector ) {
  return this.set( vector.x, vector.y );
};

/**
 * Добавляет другой вектор.
 * @method v6.Vector2D#addVector
 * @param {v6.AbstractVector} vector Вектор, который надо добавить.
 * @chainable
 */
Vector2D.prototype.addVector = function addVector ( vector ) {
  return this.add( vector.x, vector.y );
};

/**
 * Вычитает другой вектор.
 * @method v6.Vector2D#subVector
 * @param {v6.AbstractVector} vector Вектор, который надо вычесть.
 * @chainable
 */
Vector2D.prototype.subVector = function subVector ( vector ) {
  return this.sub( vector.x, vector.y );
};

/**
 * Умножает X и Y координаты на X и Y другого вектора.
 * @method v6.Vector2D#mulVector
 * @param {v6.AbstractVector} vector Вектор для умножения.
 * @chainable
 */
Vector2D.prototype.mulVector = function mulVector ( vector ) {
  return this.mul( vector.x, vector.y );
};

/**
 * Делит X и Y координаты на X и Y другого вектора.
 * @method v6.Vector2D#divVector
 * @param {v6.AbstractVector} vector Вектор, на который надо делить.
 * @chainable
 */
Vector2D.prototype.divVector = function divVector ( vector ) {
  return this.div( vector.x, vector.y );
};

/**
 * @method v6.Vector2D#dotVector
 * @param  {v6.AbstractVector} vector
 * @return {number}
 */
Vector2D.prototype.dotVector = function dotVector ( vector ) {
  return this.dot( vector.x, vector.y );
};

/**
 * Интерполирует X и Y координаты между другим вектором.
 * @method v6.Vector2D#lerpVector
 * @param {v6.AbstractVector} vector
 * @param {number}            value
 * @chainable
 */
Vector2D.prototype.lerpVector = function lerpVector ( vector, value ) {
  return this.lerp( vector.x, vector.y, value );
};

/**
 * @method v6.Vector2D#magSquare
 * @return {number}
 */
Vector2D.prototype.magSquare = function magSquare () {
  return this.x * this.x + this.y * this.y;
};

/**
 * Создает клон вектора.
 * @method v6.Vector2D#clone
 * @return {v6.Vector2D}
 */
Vector2D.prototype.clone = function clone () {
  return new Vector2D( this.x, this.y );
};

Vector2D.prototype.dist = function dist ( vector ) {
  var x = vector.x - this.x;
  var y = vector.y - this.y;
  return Math.sqrt( x * x + y * y );
};

Vector2D.prototype.cross = function cross ( vector ) {
  return this.x * vector.y - this.y * vector.x;
};

Vector2D.prototype.toString = function toString () {
  return 'Vector2D { ' + this.x.toFixed( 2 ) + ', ' + this.y.toFixed( 2 ) + ' }';
};

/**
 * Создает рандомный вектор.
 * @static
 * @method v6.Vector2D.random
 * @return {v6.Vector2D} Возвращает нормализованный вектор с рандомным направлением.
 */
Vector2D.random = function random () {
  var value;

  if ( settings.degrees ) {
    value = 360;
  } else {
    value = Math.PI * 2;
  }

  return Vector2D.fromAngle( Math.random() * value );
};

/**
 * Создает вектор с направлением `angle`.
 * @static
 * @method v6.Vector2D.fromAngle
 * @param  {number}  angle Направление вектора.
 * @return {v6.Vector2D}        Возвращает нормализованный вектор с направлением `angle`.
 */
Vector2D.fromAngle = function fromAngle ( angle ) {
  if ( settings.degrees ) {
    angle *= Math.PI / 180;
  }

  return new Vector2D( Math.cos( angle ), Math.sin( angle ) );
};

module.exports = Vector2D;
