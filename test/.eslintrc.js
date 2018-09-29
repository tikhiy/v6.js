'use strict';

var config = {
  extends: '../.eslintrc.js',

  parserOptions: {
    ecmaVersion: 5
  },

  globals: {
    describe: false,
    expect:   false,
    it:       false
  }
};

module.exports = config;
