"use client";

import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import ProjectRevealMesh from "./ProjectRevealMesh";

interface ProjectHoverCanvasProps {
  imageTexture: string;
  revealProgress: { get: () => number; set: (val: number) => void };
  cursorPos: React.MutableRefObject<{ x: number; y: number }>;
}

export default function ProjectHoverCanvas({
  imageTexture,
  revealProgress,
  cursorPos,
}: ProjectHoverCanvasProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <Canvas
        gl={{ alpha: true, antialias: false }}
        camera={{ position: [0, 0, 3] }}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      >
        {/* Key on imageTexture so React remounts on project switch → resets progress */}
        <ProjectRevealMesh
          key={imageTexture}
          imageTexture={imageTexture}
          revealProgress={revealProgress}
          cursorPos={cursorPos}
        />
      </Canvas>
    </div>
  );
}