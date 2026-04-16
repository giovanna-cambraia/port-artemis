export const textVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const textFragmentShader = `
varying vec2 vUv;
uniform vec3 uColor;

void main() {
  if (vUv.y > 0.5) discard;
  gl_FragColor = vec4(uColor, 1.0);
}
`;