'use strict';

/**
 * @private
 * @method setup
 * @param  {object} config
 * @return {void}
 */
function setup ( config )
{
  config.set( {
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'browserify', 'mocha' ],

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'test/internal/register.js',  included: true }, // Initialize.
      { pattern: 'core/**/!(*.preprocess).js', included: true }, // Sources.
      { pattern: 'index.js',                   included: true }, // Sources.
      { pattern: 'test/**/*.test.js',          included: true }, // Tests.
      { pattern: 'test/**/*.test.karma.js',    included: true }  // Tests.
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*.js':               [ 'browserify' ], // Tests.
      'core/**/!(*.preprocess).js': [ 'browserify' ], // Sources.
      'index.js':                   [ 'browserify' ]  // Sources.
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: [ 'mocha' ],

    // nyan-reporter config
    nyanReporter: {
      // suppress the red background on errors in the error
      // report at the end of the test run
      suppressErrorHighlighting: true
    },

    // mocha-reporter config
    mochaReporter: {
      // Shows a diff output.
      showDiff: 'unified'
    },

    // plugins to use
    plugins: [
      'karma-firefox-launcher',
      'karma-chrome-launcher',
      'karma-mocha-reporter',
      'karma-nyan-reporter',
      'karma-browserify',
      'karma-mocha'
    ],

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [ 'Chrome', 'Chromium', 'Firefox', 'FirefoxDeveloper' ],

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO
  } );
}

module.exports = setup;
