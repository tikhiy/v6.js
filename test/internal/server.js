'use strict';

var express = require( 'express' );

express()
  .use( express.static( 'test/core' ) )
  .listen( 8765, function ()
  {
    console.log( 'listening on "http://localhost:8765/"...' );
  } );
