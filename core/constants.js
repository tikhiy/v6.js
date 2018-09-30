'use strict';

/**
 * @member v6.constants
 */

var _constants = {};
var _counter   = 0;

/**
 * @method v6.constants.add
 * @param  {string} key
 * @return {void}
 */
function add ( key )
{
  if ( typeof _constants[ key ] !== 'undefined' ) {
    throw Error( 'Cannot re-set (add) existing constant: ' + key );
  }

  _constants[ key ] = ++_counter;
}

/**
 * @method v6.constants.get
 * @param  {string}   key
 * @return {constant}
 */
function get ( key )
{
  if ( typeof _constants[ key ] === 'undefined' ) {
    throw ReferenceError( 'Cannot get unknown constant: ' + key );
  }

  return _constants[ key ];
}

[
  'RENDERER_AUTO',
  'RENDERER_GL',
  'RENDERER_2D',
  'LEFT',
  'TOP',
  'CENTER',
  'MIDDLE',
  'RIGHT',
  'BOTTOM'
].forEach( add );

exports.add = add;
exports.get = get;
