'use strict';

module.exports = {
  source: {
    excludePattern: '\\.preprocess\\.js$',
    exclude: [ '.temp', 'node_modules', 'docs', 'dist', 'test', '.jsdoc.js' ],
    include: [ '.' ]
  },

  opts: {
    destination: 'docs',
    recurse: true,
    private: false
  },

  plugins: [
    'plugins/markdown'
  ]
};
