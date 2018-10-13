'use strict';

var sinon = require( 'sinon' );
var chai  = require( 'chai' );
var like  = require( 'chai-like' );

var as    = require( './chai-as' );

chai.should();
global.expect = chai.expect;
global.sinon  = sinon;

chai.use( like );
chai.use( as );

chai.truncateThreshold = 0;
