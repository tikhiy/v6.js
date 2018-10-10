'use strict';

var constants = require( '../../../../core/constants' );

/**
 * @private
 * @method exports.stroke
 * @param  {object}              sandbox
 * @param  {v6.AbstractRenderer} renderer
 * @param  {string}              value
 * @return {void}
 */

/**
 * @private
 * @method exports.fill
 * @param  {object}              sandbox
 * @param  {v6.AbstractRenderer} renderer
 * @param  {string}              value
 * @return {void}
 */

[ 'stroke', 'fill' ].forEach( function ( key )
{
  exports[ key ] = function ( sandbox, renderer, value )
  {
    renderer[ key ]( value );

    if ( renderer.type === constants.get( 'GL' ) ) {
      throw Error( 'Not implemented' );
    } else if ( renderer.type === constants.get( '2D' ) ) {
      sandbox.replaceSetter( renderer.context, key + 'Style', function ( value )
      {
        value.toString().should.equal( renderer[ '_' + key + 'Color' ].toString() );
      } );
    }
  };
} );

/**
 * Set up a mock using JSON.
 * @private
 * @method exports.cover
 * @param  {object} mock
 * @param  {object} options
 * @return {void}
 * @example
 * var sinon = require( 'sinon' );
 *
 * var cover = require( './internals' ).cover;
 *
 * var API = {
 *   greet: function greet ( name )
 *   {
 *     return 'Hello ' + name + '!';
 *   }
 * };
 *
 * var mock = sinon.mock( API );
 *
 * cover( mock, {
 *   greet: {
 *     arguments: [ 'World' ],
 *     exactly:   [ 1 ],
 *     returns:   'Hello World!'
 *   }
 * } );
 *
 * API.greet( 'World' ); // -> 'Hello World!'
 * mock.verify();
 */
exports.cover = function cover ( mock, options )
{
  Object.keys( options ).forEach( function ( key )
  {
    var expectation = mock.expects( key );

    if ( options[ key ].exactly ) {
      if ( options[ key ].exactly.length === 1 ) {
        expectation.exactly( options[ key ].exactly[ 0 ] );
      } else if ( options[ key ].exactly.length === 2 ) {
        expectation.atLeast( options[ key ].exactly[ 0 ], options[ key ].exactly[ 2 ] );
      } else {
        throw Error( 'Unknown syntax in options."' + key + '".exactly' );
      }
    }

    if ( options[ key ].arguments ) {
      expectation.withExactArgs.apply( expectation, options[ key ].arguments );
    }

    if ( options[ key ].returns ) {
      expectation.returns( options[ key ].returns );
    }
  } );
};

/**
 * @private
 * @method exports.div
 * @param  {function} callback
 * @return {void}
 * @example
 * var div = require( './internals' ).div;
 *
 * div( function ( div )
 * {
 *   // Working with "<div />".
 * } );
 */
exports.div = function div ( callback )
{
  var div = document.body.appendChild( document.createElement( 'div' ) );
  div.style.width  = '600px';
  div.style.height = '400px';
  callback( div );
  div.parentNode.removeChild( div );
  div = null;
};
