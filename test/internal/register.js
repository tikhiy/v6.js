'use strict';

var unexpected = require( 'unexpected' );
var sinon      = require( 'sinon' );
var chai       = require( 'chai' );
var like       = require( 'chai-like' );

var as         = require( './chai-as' );

global.should = chai.should();
global.expect = chai.expect;
global.sinon  = sinon;

global.expected = unexpected;

chai.use( like );
chai.use( as );

// chai.config.truncateThreshold = 0;
