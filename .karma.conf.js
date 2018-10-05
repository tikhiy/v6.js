'use strict';

/**
 * @method setup
 * @param  {object} config
 * @return {void}
 */
function setup ( config )
{
  config.set( {
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'browserify', 'mocha', 'chai' ],

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'test/internal/register.js', included: true },
      { pattern: 'test/**/*.test.js',         included: true },
      { pattern: 'test/**/*.test.karma.js',   included: true }
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: [ 'mocha' ],

    // plugins to use
    plugins: [
      'karma-firefox-launcher',
      'karma-chrome-launcher',
      'karma-mocha-reporter',
      'karma-browserify',
      'karma-mocha',
      'karma-chai'
    ],

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [ 'Chrome', 'Chromium', 'Firefox', 'FirefoxDeveloper' ],

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  } );
}

module.exports = setup;
