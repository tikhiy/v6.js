'use strict';

var sinon = require( 'sinon' );
var chai  = require( 'chai' );
var like  = require( 'chai-like' );

var as    = require( './chai-as' );

chai.should();
chai.use( like );
chai.use( as );

global.expect = chai.expect;
global.should = null;
global.sinon  = sinon;

chai.truncateThreshold = 0;
