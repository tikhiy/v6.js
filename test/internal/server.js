'use strict';

var express = require( 'express' );

var app = express();

app.use( express.static( 'test/core' ) );

app.listen( 8765 );
