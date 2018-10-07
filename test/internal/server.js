'use strict';

var express = require( 'express' );

express()
  .use( express.static( 'test/core' ) )
  .listen( 8765 );
