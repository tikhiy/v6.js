'use strict';

module.exports = {
  basicVert:      'attribute vec2 apos;uniform vec2 ures;uniform mat3 utransform;void main(){gl_Position=vec4(((utransform*vec3(apos,1.0)).xy/ures*2.0-1.0)*vec2(1,-1),0,1);}',
  basicFrag:      'uniform vec4 ucolor;void main(){gl_FragColor=vec4(ucolor.rgb/255.0,ucolor.a);}',
  backgroundVert: 'attribute vec2 apos;void main(){gl_Position = vec4(apos,0,1);}',
  backgroundFrag: 'uniform vec4 ucolor;void main(){gl_FragColor=ucolor;}'
};
