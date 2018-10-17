'use strict';

var mixin            = require( 'peako/mixin' );

var Camera           = require( '../../../core/camera/Camera' );
var settings         = require( '../../../core/camera/settings' );
var AbstractRenderer = require( '../../../core/renderer/AbstractRenderer' );

var Transform        = require( '../../../core/Transform' );

describe( 'v6.Camera API', function ()
{
  it( 'successfully required', function ()
  {
    Camera.should.be.a( 'function' );
  } );

  describe( 'new v6.Camera', function ()
  {
    beforeEach( function ()
    {
      this.camera = new Camera();

      this.object = {
        position: {
          x: 4,
          y: 2
        }
      };
    } );

    it( 'works #1', function ()
    {
      var options = {
        settings: {
          'zoom-out speed': {
            linear: false
          },

          'speed': {
            x: 0.15,
            y: 0.15
          },

          'zoom': {
            min: 0.5
          }
        }
      };

      new Camera( options ).should.be.like( {
        settings: mixin( {}, settings.settings, options.settings )
      } );
    } );

    it( 'works #2', function ()
    {
      var renderer = Object.create( AbstractRenderer.prototype );

      new Camera( {
        renderer: renderer
      } ).should.have.property( 'renderer', renderer );
    } );

    it( 'works #3', function ()
    {
      this.camera.should.be.like( {
        settings: settings.settings
      } );
    } );

    describe( 'members', function ()
    {
      describe( 'new v6.Camera.renderer', function ()
      {
        it( 'works' );
      } );

      describe( 'new v6.Camera.settings', function ()
      {
        it( 'works' );
      } );
    } );

    describe( 'methods', function ()
    {
      describe( 'new v6.Camera.apply', function ()
      {
        it( 'works', function ()
        {
          var matrix = new Transform();
          this.camera.apply( matrix );
          this.skip();
        } );
      } );

      describe( 'new v6.Camera.lookAt', function ()
      {
        it( 'works #1', function ()
        {
          this.camera.lookAt( this.object, 'position' );
        } );

        it( 'works #2', function ()
        {
          this.camera.lookAt( this.object.position );
        } );
      } );

      describe( 'new v6.Camera.looksAt', function ()
      {
        it( 'works #1', function ()
        {
          this.camera.looksAt().should.deep.equal( {
            x: 0,
            y: 0
          } );
        } );

        it( 'works #2' );
      } );

      describe( 'new v6.Camera.sees', function ()
      {
        it( 'works' );
      } );

      describe( 'new v6.Camera.set', function ()
      {
        describe( '"zoom-out speed"', function ()
        {
          it( 'works #1', function ()
          {
            this.camera.set( 'zoom-out speed', { linear: false } );
            this.camera.settings.should.have.property( 'zoom-out speed' ).that.is.like( { value: 1, linear: false } );
          } );

          it( 'works #2', function ()
          {
            this.camera.set( 'zoom-out speed', { value: 0.8 } );
            this.camera.settings.should.have.property( 'zoom-out speed' ).that.is.like( { value: 0.8, linear: true } );
          } );
        } );

        describe( '"zoom-in speed"', function ()
        {
          it( 'works #1', function ()
          {
            this.camera.set( 'zoom-in speed', { linear: false } );
            this.camera.settings.should.have.property( 'zoom-in speed' ).that.is.like( { value: 1, linear: false } );
          } );

          it( 'works #2', function ()
          {
            this.camera.set( 'zoom-in speed', { value: 0.2 } );
            this.camera.settings.should.have.property( 'zoom-in speed' ).that.is.like( { value: 0.2, linear: true } );
          } );
        } );

        describe( '"speed"', function ()
        {
          it( 'works #1', function ()
          {
            this.camera.set( 'speed', { x: 0.25 } );
            this.camera.settings.should.have.property( 'speed' ).that.is.like( { x: 0.25, y: 1 } );
          } );

          it( 'works #2', function ()
          {
            this.camera.set( 'speed', { y: 0.25 } );
            this.camera.settings.should.have.property( 'speed' ).that.is.like( { x: 1, y: 0.25 } );
          } );
        } );

        describe( '"zoom"', function ()
        {
          it( 'works #1', function ()
          {
            this.camera.set( 'zoom', { value: 2 } );
            this.camera.settings.should.have.property( 'zoom' ).that.is.like( { value: 2, min: 1, max: 1 } );
          } );

          it( 'works #2', function ()
          {
            this.camera.set( 'zoom', { min: 0.5 } );
            this.camera.settings.should.have.property( 'zoom' ).that.is.like( { value: 1, min: 0.5, max: 1 } );
          } );

          it( 'works #3', function ()
          {
            this.camera.set( 'zoom', { max: 0.5 } );
            this.camera.settings.should.have.property( 'zoom' ).that.is.like( { value: 1, min: 1, max: 0.5 } );
          } );
        } );

        describe( '"offset"', function ()
        {
          it( 'works #1', function ()
          {
            this.camera.set( 'offset', { x: 300 } );
            this.camera.settings.should.have.property( 'offset' ).that.is.like( { x: 300, y: 0 } );
          } );

          it( 'works #2', function ()
          {
            this.camera.set( 'offset', { y: 200 } );
            this.camera.settings.should.have.property( 'offset' ).that.is.like( { x: 0, y: 200 } );
          } );
        } );
      } );

      describe( 'new v6.Camera.shouldLookAt', function ()
      {
        it( 'works #1', function ()
        {
          this.camera.shouldLookAt().should.deep.equal( {
            x: 0,
            y: 0
          } );
        } );

        it( 'works #2', function ()
        {
          this.camera.lookAt( this.object, 'position' );
          this.camera.shouldLookAt().should.deep.equal( this.object.position );
        } );

        it( 'works #3', function ()
        {
          this.camera.lookAt( this.object.position );
          this.camera.shouldLookAt().should.deep.equal( this.object.position );
        } );
      } );

      describe( 'new v6.Camera.zoomIn', function ()
      {
        it( 'works', function ()
        {
          this.camera.zoomIn();
          this.skip();
        } );
      } );

      describe( 'new v6.Camera.zoomOut', function ()
      {
        it( 'works', function ()
        {
          this.camera.zoomOut();
          this.skip();
        } );
      } );
    } );
  } );
} );
