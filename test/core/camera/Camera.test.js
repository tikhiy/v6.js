'use strict';

var mixin            = require( 'peako/mixin' );

var Camera           = require( '../../../core/camera/Camera' );
var settings         = require( '../../../core/camera/settings' );
var AbstractRenderer = require( '../../../core/renderer/AbstractRenderer' );

describe( 'v6.Camera API', function ()
{
  it( 'successfully required', function ()
  {
    Camera.should.be.a( 'function' );
  } );

  describe( 'new v6.Camera', function ()
  {
    var camera, object;

    beforeEach( function ()
    {
      camera = new Camera();

      object = {
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
      camera.should.be.like( {
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
        it( 'works' );
      } );

      describe( 'new v6.Camera.lookAt', function ()
      {
        it( 'works #1', function ()
        {
          camera.lookAt( object, 'position' );
        } );

        it( 'works #2', function ()
        {
          camera.lookAt( object.position );
        } );
      } );

      describe( 'new v6.Camera.looksAt', function ()
      {
        it( 'works' );
      } );

      describe( 'new v6.Camera.sees', function ()
      {
        it( 'works' );
      } );

      describe( 'new v6.Camera.set', function ()
      {
        it( 'works #1', function ()
        {
          camera.looksAt().should.deep.equal( {
            x: 0,
            y: 0
          } );
        } );

        it( 'works #2' );
      } );

      describe( 'new v6.Camera.shouldLookAt', function ()
      {
        it( 'works #1', function ()
        {
          camera.shouldLookAt().should.deep.equal( {
            x: 0,
            y: 0
          } );
        } );

        it( 'works #2', function ()
        {
          camera.lookAt( object, 'position' );
          camera.shouldLookAt().should.deep.equal( object.position );
        } );

        it( 'works #3', function ()
        {
          camera.lookAt( object.position );
          camera.shouldLookAt().should.deep.equal( object.position );
        } );
      } );
    } );
  } );
} );
