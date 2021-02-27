'use strict';

var settings = require( '../../../core/camera/settings' );

describe( 'v6.settings.camera', function ()
{
  it( 'successfully required', function ()
  {
    settings.should.be.an( 'object' );
  } );

  it( 'have "settings" property', function ()
  {
    settings.should.have.property( 'settings' ).that.is.an( 'object' );
  } );
} );
