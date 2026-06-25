
"use client";

/**
 * GravitationalLensEffect
 * ------------------------
 * A screen-space postprocessing pass that bends the rendered frame around a
 * projected 2D point (the black hole's screen position). This is the standard
 * real-time trick for lensing: you're not actually ray-marching geodesics through
 * curved spacetime, you're distorting UV sampling radially around a point, which
 * is visually convincing and orders of magnitude cheaper than true GR ray-marching.
 *
 * Usage: <EffectComposer><gravitationalLensEffect ... /></EffectComposer>
 * via wrapEffect, see BlackHolePostFX.tsx
 */

import { Effect, EffectAttribute } from "postprocessing";
import * as THREE from "three";

const fragmentShader = `
  uniform vec2 uCenter;        // screen-space center of the black hole, 0-1 UV
  uniform float uStrength;     // overall lensing intensity, 0 = off
  uniform float uRadius;       // visual radius of the event horizon (screen-space, 0-1ish)
  uniform float uEventHorizon; // radius where light is fully swallowed -> pure black
  uniform float uAspect;       // width/height, to keep distortion circular not elliptical

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 toCenter = uv - uCenter;
    toCenter.x *= uAspect;

    float dist = length(toCenter);

    // Lensing falloff: strongest near the horizon, fading with inverse-square-ish falloff.
    // Clamp to avoid singularity blowup at dist == 0.
    float safeDist = max(dist, 0.0001);
    float bend = uStrength * uRadius * uRadius / (safeDist * safeDist);
    bend = clamp(bend, 0.0, 2.5);

    // Pull sample point TOWARD the center (light bending around the mass),
    // pinches the image inward as you approach, classic lensing swirl.
    vec2 dir = normalize(toCenter);
    vec2 distortedUv = uv - dir * bend * 0.05 * vec2(1.0 / uAspect, 1.0);

    // Slight rotational swirl for accretion-disk-style frame dragging.
    float swirl = uStrength * 0.6 * smoothstep(uRadius * 3.0, uRadius, dist);
    float ca = cos(swirl);
    float sa = sin(swirl);
    vec2 rotated = vec2(
      toCenter.x * ca - toCenter.y * sa,
      toCenter.x * sa + toCenter.y * ca
    );
    rotated.x /= uAspect;
    vec2 swirlUv = uCenter + rotated;

    vec2 finalUv = mix(distortedUv, swirlUv, 0.35);
    finalUv = clamp(finalUv, vec2(0.001), vec2(0.999));

    vec4 sampled = texture2D(inputBuffer, finalUv);

    // Event horizon: inside this radius, nothing escapes. Pure black, no sampling.
    float horizonMask = smoothstep(uEventHorizon, uEventHorizon * 0.6, dist);
    sampled.rgb *= horizonMask;

    // Subtle chromatic aberration right at the photon ring edge — light of different
    // wavelengths bends slightly differently, classic lensing tell.
    float edgeBand = smoothstep(uEventHorizon * 0.9, uEventHorizon * 1.4, dist)
                    * (1.0 - smoothstep(uEventHorizon * 1.4, uEventHorizon * 2.2, dist));
    if (edgeBand > 0.01) {
      vec2 caOffset = dir * edgeBand * 0.004;
      float r = texture2D(inputBuffer, finalUv + caOffset).r;
      float b = texture2D(inputBuffer, finalUv - caOffset).b;
      sampled.r = mix(sampled.r, r, edgeBand);
      sampled.b = mix(sampled.b, b, edgeBand);
    }

    outputColor = sampled;
  }
`;

export class GravitationalLensEffect extends Effect {
  constructor({
    center = new THREE.Vector2(0.5, 0.5),
    strength = 0,
    radius = 0.18,
    eventHorizon = 0.1,
    aspect = 1,
  } = {}) {
    super("GravitationalLensEffect", fragmentShader, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, THREE.Uniform>([
        ["uCenter", new THREE.Uniform(center)],
        ["uStrength", new THREE.Uniform(strength)],
        ["uRadius", new THREE.Uniform(radius)],
        ["uEventHorizon", new THREE.Uniform(eventHorizon)],
        ["uAspect", new THREE.Uniform(aspect)],
      ]),
    });
  }

  setCenter(x: number, y: number) {
    (this.uniforms.get("uCenter")!.value as THREE.Vector2).set(x, y);
  }

  setStrength(v: number) {
    this.uniforms.get("uStrength")!.value = v;
  }

  setRadius(v: number) {
    this.uniforms.get("uRadius")!.value = v;
  }

  setEventHorizon(v: number) {
    this.uniforms.get("uEventHorizon")!.value = v;
  }

  setAspect(v: number) {
    this.uniforms.get("uAspect")!.value = v;
  }
}