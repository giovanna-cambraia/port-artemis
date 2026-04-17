"use client";

import {
  useGLTF,
  MeshTransmissionMaterial,
  PresentationControls,
  RandomizedLight,
  Text,
} from "@react-three/drei";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "gsap";

const FONT = "/fonts/Oi-Regular.ttf";

const TEXT_BLOCKS = [
  {
    id: 1,
    content: "CRAFTED WITH\nWEBGL AND\nTHREE.JS",
    y: -2.5,
    size: 0.18,
  },
  {
    id: 2,
    content: "EVERY PIXEL\nRENDERED IN\nREAL TIME —\nNO SHORTCUTS.",
    y: -3.5,
    size: 0.13,
  },
  {
    id: 3,
    content:
      "SHADERS, GEOMETRY\nAND LIGHT WORKING\nTOGETHER TO BUILD\nSOMETHING THAT\nFEELS ALIVE.",
    y: -4.5,
    size: 0.11,
  },
  {
    id: 5,
    content: "NOW GO CRAZY\nWITH THE SHADERS.",
    y: -5.5,
    size: 0.15,
  },
  {
    id: 6,
    content:
      "SHADERS, GEOMETRY\nAND LIGHT WORKING\nTOGETHER TO BUILD\nSOMETHING THAT\nFEELS ALIVE.",
    y: -6.5,
    size: 0.15,
  },
];

function TextBlock({
  content,
  y,
  size,
  scrollY,
}: {
  content: string;
  y: number;
  size: number;
  scrollY: number;
}) {
  const ref = useRef<any>(null);
  const [progress, setProgress] = useState(0);

  useFrame(() => {
    if (!ref.current) return;

    // Map scroll to reveal — each block reveals as it comes into view
    const blockWorldY = y - scrollY * 0.01;
    const revealStart = -1.5;
    const revealEnd = 0.5;
    const p = Math.max(
      0,
      Math.min(1, (blockWorldY - revealStart) / (revealEnd - revealStart)),
    );
    setProgress(1 - p);

    ref.current.position.y = y + scrollY * 0.01;
  });

  return (
    <Text
      ref={ref}
      font={FONT}
      fontSize={size}
      color="white"
      anchorX="center"
      anchorY="top"
      position={[0, y, 0]}
      maxWidth={3}
      textAlign="center"
      fillOpacity={progress}
    >
      {content}
    </Text>
  );
}

export default function Scene() {
  const { nodes, materials } = useGLTF("/circle_text_13.glb");

  const circularText = useRef<THREE.Group>(null);
  const transmissionMaterial = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);

  const spotLight1 = useRef<THREE.SpotLight>(null);
  const spotLight2 = useRef<THREE.SpotLight>(null);

  const elapsedTime = useRef(0);
  const pauseDuration = 3;
  const oscillationDuration = 2;
  const totalCycleDuration = oscillationDuration + pauseDuration;

  const scrollY = useRef(0);

  const sectionProgress = useRef(0);

  useFrame((state, delta) => {
    // Get section progress
    const section = document.querySelector(".immersive-section") as HTMLElement;
    if (section) {
      const rect = section.getBoundingClientRect();
      const scrollHeight = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      sectionProgress.current = Math.max(
        0,
        Math.min(1, scrolled / scrollHeight),
      );
    }

    // Rotate model
    if (circularText.current) {
      circularText.current.rotation.y -= delta * 0.3;
    }

    // IOR animation
    if (transmissionMaterial.current) {
      elapsedTime.current = state.clock.elapsedTime % totalCycleDuration;
      let ior: number;
      if (elapsedTime.current < oscillationDuration) {
        const progress = elapsedTime.current / oscillationDuration;
        const amplitude = (3.5 - 1.07) / 2;
        const offset = (3.5 + 1.07) / 2;
        ior = offset - amplitude * Math.cos(progress * Math.PI);
      } else {
        ior = 1.07;
      }
      gsap.to(transmissionMaterial.current, { ior });
    }

    // Move group up based on section progress (0 to 3 units)
    if (groupRef.current) {
      groupRef.current.position.y = sectionProgress.current * -0.5;
    }
  });

  const torusMesh = nodes.Torus as THREE.Mesh;
  const textMesh = nodes.Text as THREE.Mesh;

  return (
    <>
      <color args={["black"]} attach="background" />
      <ambientLight />

      <group rotation={[-0.23, 0.1, 0]}>
        <spotLight
          position={[4, 4, 4]}
          intensity={100}
          color={"#E5FCFF"}
          angle={Math.PI / 8}
          ref={spotLight1}
        />
        <spotLight
          position={[1.5, -0.3, 2]}
          intensity={800}
          power={60.0}
          color={"#FFA530"}
          angle={Math.PI / 4}
          ref={spotLight2}
        />

        <RandomizedLight
          radius={10}
          ambient={0.5}
          intensity={1}
          position={[2.5, 8, -2.5]}
          bias={0.001}
        />

        <group ref={groupRef}>
          {/* 3D model */}
          <group dispose={null} ref={circularText}>
            <mesh
              castShadow
              receiveShadow
              geometry={torusMesh.geometry}
              rotation={[0.026, 0.195, -10.334]}
            >
              <MeshTransmissionMaterial
                background={new THREE.Color("#000000")}
                isMeshPhysicalMaterial={false}
                transmissionSampler={false}
                backside={false}
                samples={10}
                resolution={2048}
                transmission={1}
                roughness={0}
                thickness={0.2}
                ior={1.068}
                chromaticAberration={0}
                anisotropy={0}
                distortion={0.5}
                distortionScale={0.5}
                temporalDistortion={0.5}
                clearcoat={1}
                attenuationDistance={0.5}
                attenuationColor={"#ffffff"}
                color={"#ff0000"}
                ref={transmissionMaterial}
              />
            </mesh>
          </group>
          {TEXT_BLOCKS.map((block) => (
            <TextBlock
              key={block.id}
              content={block.content}
              y={block.y}
              size={block.size}
              scrollY={sectionProgress.current * 1000}
            />
          ))}
        </group>
      </group>
    </>
  );
}

useGLTF.preload("/circle_text_13.glb");
