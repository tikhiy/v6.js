'use strict';

var ShaderProgram       = require( '../ShaderProgram' );
var constants           = require( '../constants' );
var align               = require( '../internal/align' );
var copyDrawingSettings = require( '../internal/copy_drawing_settings' );

describe( "ShaderProgram", function () {
  it( 'works', function () {
    ShaderProgram.should.be.a( 'function' );
  } );
} );

describe( "internal/align", function () {
  it( 'works', function () {
    align.should.be.a( 'function' );
  } );

  describe( 'align()', function () {
    it( 'works', function () {
      align( 500, 250, constants.LEFT ).should.equal( 500 );
      align( 400, 200, constants.MIDDLE ).should.equal( 300 );
      align( 300, 150, constants.BOTTOM ).should.equal( 150 );
    } );
  } );

  describe( 'bad use', function () {
    it( 'throws', function () {
      expect( align ).throw();
    } );
  } );
} );

describe( "internal/copy_drawing_settings", function () {
  it( 'works', function () {
    copyDrawingSettings.should.be.a( 'function' );
  } );

  describe( 'copyDrawingSettings()', function () {
    it( 'works', function () {
      // TODO: Write tests.
    } );
  } );
} );
