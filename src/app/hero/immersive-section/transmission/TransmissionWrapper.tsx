"use client";

import { Canvas } from "@react-three/fiber";
import Transmission from "./Transmission";

export default function TransmissionWrapper() {
  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <Canvas
        shadows
        camera={{
          fov: 45,
          near: 0.1,
          far: 200,
          position: [2.5, 2, 2],
        }}
      >
        <Transmission />
      </Canvas>
    </div>
  );
}
