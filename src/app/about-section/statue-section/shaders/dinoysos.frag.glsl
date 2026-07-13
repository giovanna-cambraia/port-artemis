uniform float uProgress;
uniform float uTime;
uniform vec3 uColorA;   
uniform vec3 uColorB;   
uniform vec3 uCameraPos;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;

void main() {
  vec3 viewDir = normalize(uCameraPos - vPosition);
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

  // Dissolve threshold: fragments where noise falls below a
  // progress-dependent cutoff are discarded entirely (eroding edges)
  float cutoff = mix(-1.0, 1.0, uProgress) - 0.3;
  if (vNoise < cutoff) discard;

  // Fragments near the cutoff glow brightest — the "edge" of dissolving matter
  float edgeGlow = smoothstep(cutoff, cutoff + 0.15, vNoise);
  edgeGlow = 1.0 - edgeGlow; // brightest right at the threshold

  vec3 baseColor = mix(uColorA, uColorB, fresnel);
  vec3 glow = uColorB * edgeGlow * 2.0;

  vec3 finalColor = baseColor + glow * (1.0 - uProgress * 0.6);

  float alpha = mix(0.85, 1.0, uProgress);
  gl_FragColor = vec4(finalColor, alpha);
}