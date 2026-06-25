"use client";

/**
 * AccretionDisk
 * --------------
 * A flat ring mesh around the black hole, simulating superheated infalling matter.
 * Two visual tricks make this read as "real" instead of a flat colored ring:
 *
 * 1. Doppler beaming: the side of the disk rotating toward the camera looks
 *    brighter/bluer, the side rotating away looks dimmer/redder. In Interstellar's
 *    Gargantua this is THE detail that sells it. We fake it with a dot-product
 *    against a "rotation direction" vector per-fragment.
 * 2. Turbulent noise so it's not a flat gradient — looks like plasma, not paint.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = `
uniform float uTime;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform vec3 uHotColor;
uniform vec3 uCoolColor;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vWorldPos;

// Cheap hash-based noise, good enough for plasma turbulence at this scale.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  // vUv.x = angle around the ring (0-1), vUv.y = radial position (0 = inner, 1 = outer)
  vec2 centered = vUv - 0.5;
  float radial = length(centered) * 2.0;
  float angle = atan(centered.y, centered.x);

  // Radial falloff: fade to nothing at inner (swallowed) and outer (cold, dim) edges.
  float radialFade = smoothstep(0.0, 0.15, radial) * (1.0 - smoothstep(0.7, 1.0, radial));

  // Spinning turbulence: sample noise in a frame that rotates with uTime so the
  // disk material appears to actually flow/orbit rather than just sit there.
  float spin = uTime * 0.15;
  vec2 noiseCoord = vec2(angle * 3.0 + spin * 4.0, radial * 4.0 - uTime * 0.3);
  float n1 = noise(noiseCoord);
  float n2 = noise(noiseCoord * 2.3 + 7.0);
  float turbulence = n1 * 0.65 + n2 * 0.35;

  // Doppler beaming: brighten the side moving toward camera-ish (+X here, since
  // the disk group itself is what gets oriented toward the camera in JS).
  float doppler = 0.5 + 0.5 * cos(angle);
  float dopplerBoost = mix(0.35, 1.8, doppler);

  vec3 color = mix(uCoolColor, uHotColor, clamp(turbulence * dopplerBoost, 0.0, 1.0));
  color *= dopplerBoost;

  float alpha = radialFade * (0.5 + 0.5 * turbulence) * uOpacity;

  gl_FragColor = vec4(color, alpha);
}
`;

export function AccretionDisk({
  morphRef,
  innerRadius = 1.05,
  outerRadius = 2.6,
}: {
  morphRef: React.RefObject<number>;
  innerRadius?: number;
  outerRadius?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInnerRadius: { value: innerRadius },
      uOuterRadius: { value: outerRadius },
      uHotColor: { value: new THREE.Color("#fff2c8") },
      uCoolColor: { value: new THREE.Color("#ff5a1f") },
      uOpacity: { value: 0 },
    }),
    [innerRadius, outerRadius],
  );

  const geometry = useMemo(
    () => new THREE.RingGeometry(innerRadius, outerRadius, 128, 1),
    [innerRadius, outerRadius],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uOpacity.value = morphRef.current ?? 0;
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.04;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation={[Math.PI / 2.3, 0, 0]}
    />
  );
}