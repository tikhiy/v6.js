'use strict';

var copyDrawingSettings = require( '../core/renderer/internal/copy_drawing_settings' );

describe( 'internal/copy_drawing_settings', function ()
{
  it( 'works', function ()
  {
    copyDrawingSettings.should.be.a( 'function' );
  } );
} );
