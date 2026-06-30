"use client";

import { GridScan } from "../../../react-components/grid-scan/GridScan";

export default function AboutHeader() {
  return (
  <div style={{ width: "100%", height: "600px", position: "relative" }}>
    <GridScan 
      sensitivity={0.55}
      lineThickness={1}
      linesColor="#ebebeb"
      gridScale={0.1}
      scanColor="#2F293A"
      scanOpacity={0.4}
      enablePost
      bloomIntensity={0.6}
      chromaticAberration={0.002}
      noiseIntensity={0.01}
      lineJitter={0.1}
      scanGlow={0.5}
      scanSoftness={2}
      enableWebcam={false}
      showPreview={false}
    />
  </div>
  );
}
