'use strict';

module.exports = {
  source: {
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
