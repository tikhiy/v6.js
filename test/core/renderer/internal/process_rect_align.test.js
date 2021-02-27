'use strict';

var processRectAlign = require( '../../../../core/renderer/internal/process_rect_align' );

var processRectAlignX = processRectAlign.processRectAlignX;
var processRectAlignY = processRectAlign.processRectAlignY;

describe( 'processRectAlign', function ()
{
  it( 'successfully required', function ()
  {
    processRectAlignX.should.be.a( 'function' );
    processRectAlignY.should.be.a( 'function' );
  } );
} );
