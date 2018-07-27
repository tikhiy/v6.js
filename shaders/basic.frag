uniform vec4 ucolor;

void main ()
{
  gl_FragColor = vec4( ucolor.rgb / 255.0, ucolor.a );
}
