'use strict';

var underscore    = require( 'underscore' );
var unique        = require( 'underscore' ).unique;
var promisify     = require( 'util' ).promisify;
var child_process = require( 'child_process' );
var fs            = require( 'fs' );
var exec  = promisify( child_process.exec );
var mkdir = promisify( fs.mkdir );
var push  = Array.prototype.push;

function publish ( data, opts )
{
  data().each( function ( doclet )
  {
    if ( doclet.undocumented ) {
      return;
    }

    // console.log( JSON.stringify( doclet, null, '\t' ) );

    switch ( doclet.kind ) {
      case 'function':
        console.log( buildFunction( doclet ) );
    }
  } );
  // console.log( opts );
  // exec( 'rm -Rf ' + opts.destination )
  //   .then( handleExec )
  //   .then( function ()
  //   {
  //     return exec( 'mkdir ' + opts.destination );
  //   } )
  //   .then( handleExec );
  return 0;
}

function handleExec ( object )
{
  console.log( object );
}

function buildFunction ( doclet )
{
  var params = unique( doclet.params, function ( value )
  {
    return value.name;
  } )
    .map( function ( current )
    {
      return current.name + ': ' + current.type.names[ 0 ];
    } )
    .join( ', ' );

  if ( params ) {
    params = ' ' + params + ' ';
  }

  return underscore.chain( doclet.returns )
    .reduce( function ( previous, current )
    {
      return push.apply( previous, current.type.names ), previous;
    }, [] )
    .unique()
    .map( function ( returns )
    {
      var prefix = doclet.access || '';

      if ( doclet.scope === 'static' ) {
        prefix += ' static ';
      } else {
        prefix += ' ';
      }

      return prefix + doclet.name + ' (' + params + '): ' + returns;
    } )
    .value();
}

exports.publish = publish;
