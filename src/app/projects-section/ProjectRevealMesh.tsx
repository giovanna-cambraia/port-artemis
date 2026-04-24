"use client";

import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAspect, useTexture } from "@react-three/drei";
import * as THREE from "three";
import "@/src/app/hero/footer/r3f-reveal/components/RevealImage";

interface ProjectRevealMeshProps {
  imageTexture: string;
  revealProgress: { get: () => number; set: (val: number) => void };
  cursorPos: React.MutableRefObject<{ x: number; y: number }>;
}

// Lerp helper
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function ProjectRevealMesh({
  imageTexture,
  revealProgress,
  cursorPos,
}: ProjectRevealMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const texture = useTexture(imageTexture);
  const { width, height } = texture.image as HTMLImageElement;
  const { viewport, size } = useThree();

  // Mesh size — portrait-ish, feels like a polaroid
  const MESH_WIDTH = 0.38;
  const MESH_HEIGHT = 0.48;
  const scale = useAspect(width, height, MESH_WIDTH);

  // Smooth cursor position in viewport space
  const smoothPos = useRef({ x: 0, y: 0 });
  // Animated progress (separate from the ref so we can lerp it)
  const currentProgress = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // ── Cursor following with lag ──
    // Convert screen px → NDC → viewport units
    const targetX =
      ((cursorPos.current.x / size.width) * 2 - 1) * (viewport.width / 2);
    const targetY =
      (-(cursorPos.current.y / size.height) * 2 + 1) * (viewport.height / 2);

    const LERP_SPEED = 6;
    smoothPos.current.x = lerp(
      smoothPos.current.x,
      targetX,
      1 - Math.exp(-LERP_SPEED * delta)
    );
    smoothPos.current.y = lerp(
      smoothPos.current.y,
      targetY,
      1 - Math.exp(-LERP_SPEED * delta)
    );

    // Offset so image appears slightly up-right of cursor
    meshRef.current.position.set(
      smoothPos.current.x + 0.15,
      smoothPos.current.y + 0.1,
      0
    );

    // ── Progress lerp ──
    const targetProgress = revealProgress.get();
    currentProgress.current = lerp(
      currentProgress.current,
      targetProgress,
      1 - Math.exp(-8 * delta)
    );

    // ── Material uniforms ──
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    materialRef.current.uniforms.uProgress.value = currentProgress.current;
    materialRef.current.uniforms.uTexture.value = texture;
    materialRef.current.uniforms.uImageRes.value.set(width, height);
    materialRef.current.uniforms.uRes.value.set(scale[0], scale[1]);
  });

  return (
    <mesh ref={meshRef} scale={[scale[0], scale[1], 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      {/* @ts-ignore */}
      <imageRevealMaterial
        ref={materialRef}
        attach="material"
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}