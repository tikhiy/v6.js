'use strict';

var LightEmitter = require( 'light_emitter' );

var Ticker       = require( '../../core/Ticker' );

describe( 'v6.Ticker API', function ()
{
  it( 'v6.Ticker extends LightEmitter', function ()
  {
    Ticker.prototype.should.instanceof( LightEmitter );
  } );

  describe( 'new v6.Ticker', function ()
  {
    beforeEach( function ()
    {
      this.ticker = new Ticker();
    } );

    afterEach( function ()
    {
      this.ticker.stop();
    } );

    describe( 'methods', function ()
    {
      describe( 'new v6.Ticker.clear', function ()
      {
        it( 'works' );
      } );

      describe( 'new v6.Ticker.set', function ()
      {
        describe( 'FPS', function ()
        {
          it( 'works', function ()
          {
            this.ticker.set( 'FPS', 120 );
            this.ticker.get( 'FPS' ).should.equal( 120 );
            this.ticker.get( 'frame time' ).should.equal( 1 / 120 );
          } );
        } );

        describe( 'frame time', function ()
        {
          it( 'works', function ()
          {
            this.ticker.set( 'frame time', 1 / 30 );
            this.ticker.get( 'frame time' ).should.equal( 1 / 30 );
            this.ticker.get( 'FPS' ).should.equal( 30 );
          } );
        } );

        describe( 'unknown settings', function ()
        {
          it( 'throws', function ()
          {
            ( function ()
            {
              this.ticker.set( 'unknown', null );
            } ).bind( this ).should.throw( Error );
          } );
        } );
      } );

      describe( 'new v6.Ticker.get', function ()
      {
        describe( 'unknown settings', function ()
        {
          it( 'throws', function ()
          {
            ( function ()
            {
              this.ticker.get( 'unknown' );
            } ).bind( this ).should.throw( Error );
          } );
        } );
      } );

      describe( 'new v6.Ticker.start', function ()
      {
        it( 'works', function ()
        {
          this.ticker.stop();
          this.ticker.start();
          this.ticker.should.have.property( 'running' ).that.is.true; // eslint-disable-line no-unused-expressions
        } );
      } );

      describe( 'new v6.Ticker.stop', function ()
      {
        it( 'works', function ()
        {
          this.ticker.start();
          this.ticker.stop();
          this.ticker.should.have.property( 'running' ).that.is.false; // eslint-disable-line no-unused-expressions
        } );
      } );
    } );

    [ 'render', 'update' ].forEach( function ( type )
    {
      describe( 'event:' + type, function ()
      {
        it( 'works', function ( done )
        {
          this.ticker.once( type, function ( elapsedTime, now )
          {
            elapsedTime.should.be.finite; // eslint-disable-line no-unused-expressions
            now.should.be.finite; // eslint-disable-line no-unused-expressions
            this.start();
            done();
          } );

          this.ticker.start();
        } );
      } );
    } );
  } );
} );
