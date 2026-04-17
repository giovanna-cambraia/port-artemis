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
uniform float uProgress;

void main() {
  // temporary: visualize what uProgress looks like across the mesh
  gl_FragColor = vec4(vUv.y, 0.0, 0.0, 1.0);
}
`;
