'use strict';

function Shader ( type ) {
  this.type = type;
}

Shader.prototype = {
  source: function source ( source ) {
    this.source = source;
  },

  create: function create ( renderer ) {

  },

  constructor: Shader
};

module.exports = Shader;
