"use client";

/**
 * BlackHoleCore
 * -------------
 * Renders the event horizon + photon ring directly on the torus geometry.
 * As `morph` goes 0 -> 1, this fades from your original glass MeshTransmissionMaterial
 * look into a pure black sphere-like silhouette with a thin superheated rim (the photon ring).
 *
 * This is NOT the screen-space lensing (that's the postprocessing pass, separate file).
 * This is just what the mesh itself looks like up close.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = viewMatrix * worldPos;

  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPosition.xyz);

  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform float uMorph;       // 0 = original glass torus, 1 = full black hole
uniform float uTime;
uniform vec3 uRimColorHot;  // inner photon ring color (white-blue-hot)
uniform vec3 uRimColorWarm; // outer rim color (orange, like your original light)

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.5);

  // Photon ring: a thin, hot band right at the silhouette edge.
  // fresnel close to 1.0 = grazing angle = the rim of the torus from camera's view.
  float ringBand = smoothstep(0.78, 0.92, fresnel) * (1.0 - smoothstep(0.92, 1.0, fresnel));
  ringBand = pow(ringBand, 1.5);

  // Flicker so the ring doesn't look static — accretion plasma is turbulent.
  float flicker = 0.85 + 0.15 * sin(uTime * 6.0 + vUv.x * 40.0) * sin(uTime * 2.3 + vUv.y * 17.0);

  vec3 ringColor = mix(uRimColorWarm, uRimColorHot, fresnel) * flicker;

  // Body of the black hole: essentially absorbs everything. Only the fresnel-edge glows.
  vec3 blackHoleColor = ringColor * ringBand * 3.5;

  gl_FragColor = vec4(blackHoleColor, uMorph * (ringBand * 3.0 + 0.02));
}
`;

export function useBlackHoleMaterial() {
  const uniforms = useMemo(
    () => ({
      uMorph: { value: 0 },
      uTime: { value: 0 },
      uRimColorHot: { value: new THREE.Color("#fff6e0") },
      uRimColorWarm: { value: new THREE.Color("#ff9540") },
    }),
    [],
  );

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }, [uniforms]);

  return { material, uniforms };
}
