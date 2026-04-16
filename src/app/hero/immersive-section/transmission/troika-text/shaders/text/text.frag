uniform float uProgress;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float reveal = 1.0 - vUv.y;
  
  if (reveal > uProgress) discard;
  
  gl_FragColor = vec4(uColor, 1.0);
}