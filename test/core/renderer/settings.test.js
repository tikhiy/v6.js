'use strict';

var settings = require( '../../../core/renderer/settings' );

describe( 'v6.settings.renderer', function ()
{
  it( 'successfully required', function ()
  {
    settings.should.be.an( 'object' );
  } );
} );
