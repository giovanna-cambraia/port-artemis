"use client";

import { forwardRef, useMemo, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { wrapEffect } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { GravitationalLensEffect } from "./GravitationalLenseEffect"; 

const GravLens = wrapEffect(GravitationalLensEffect);

/**
 * BlackHolePostFX
 * ----------------
 * Drop this inside <Canvas>, sibling to your <Scene/>.
 *
 * `blackHoleRef` should point to the Object3D (the torus/black-hole mesh group)
 * so we can project its world position to screen space every frame and feed
 * that into the lensing shader's uCenter uniform — this is what makes the
 * distortion track the black hole as the camera dives toward it, instead of
 * being stuck in the middle of the screen.
 *
 * `progress` (0-1) drives how strong the effect gets — pass your existing
 * scroll progressRef.current here so lensing intensifies as you dive in.
 */
export const BlackHolePostFX = forwardRef<
  any,
  {
    blackHoleTarget: React.RefObject<THREE.Object3D | null>;
    diveProgressRef: React.RefObject<number>;
  }
>(function BlackHolePostFX({ blackHoleTarget, diveProgressRef }, _ref) {
  const lensRef = useRef<InstanceType<typeof GravitationalLensEffect>>(null);
  const { camera, size } = useThree();
  const screenPos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!lensRef.current || !blackHoleTarget.current) return;

    // Project the black hole's world position into normalized device coords,
    // then into 0-1 UV space (flipping Y since screen-space UV origin is bottom-left
    // in most postprocessing conventions but NDC Y+ is up).
    blackHoleTarget.current.getWorldPosition(screenPos);
    screenPos.project(camera);

    const u = screenPos.x * 0.5 + 0.5;
    const v = screenPos.y * 0.5 + 0.5;

    lensRef.current.setCenter(u, v);
    lensRef.current.setAspect(size.width / size.height);

    // Ramp lensing strength with dive progress. Starts subtle (you can still
    // read the torus + tunnel clearly), and becomes intense near full dive.
    const dive = diveProgressRef.current ?? 0;
    const strength = THREE.MathUtils.smoothstep(dive, 0.15, 0.85);
    lensRef.current.setStrength(strength * 1.4);
    lensRef.current.setRadius(THREE.MathUtils.lerp(0.1, 0.34, strength));
    lensRef.current.setEventHorizon(THREE.MathUtils.lerp(0.0, 0.16, strength));
  });

  return (
    <EffectComposer multisampling={4}>
      <GravLens ref={lensRef} />
      <Bloom
        intensity={1.4}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.4}
        mipmapBlur
        radius={0.85}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0012, 0.0012)}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={true}
        modulationOffset={0.3}
      />
      <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={0.15} darkness={1.1} />
    </EffectComposer>
  );
});