attribute vec2 apos;
uniform   vec2 ures;
uniform   mat3 utransform;

void main ()
{
  gl_Position = vec4( ( ( utransform * vec3( apos, 1.0 ) ).xy / ures * 2.0 - 1.0 ) * vec2( 1, -1 ), 0, 1 );
}
