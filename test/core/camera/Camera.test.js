'use strict';

var mixin    = require( 'peako/mixin' );

var Camera   = require( '../../../core/camera/Camera' );
var settings = require( '../../../core/camera/settings' );

describe( 'v6.Camera API', function ()
{
  it( 'successfully required', function ()
  {
    Camera.should.be.a( 'function' );
  } );

  describe( 'new v6.Camera', function ()
  {
    var camera;

    beforeEach( function ()
    {
      camera = new Camera();
    } );

    it( 'works', function ()
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

    it( 'works with no options', function ()
    {
      camera.should.be.like( {
        settings: settings.settings
      } );
    } );

    describe( 'new v6.Camera.shouldLookAt', function ()
    {
      it( 'works', function ()
      {
        camera.shouldLookAt().should.deep.equal( {
          x: 0,
          y: 0
        } );
      } );
    } );
  } );
} );
