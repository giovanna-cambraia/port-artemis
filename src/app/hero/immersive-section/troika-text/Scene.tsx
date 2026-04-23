"use client";

import {
  useGLTF,
  MeshTransmissionMaterial,
  RandomizedLight,
  Text,
} from "@react-three/drei";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const FONT = "/fonts/Oi-Regular.ttf";

// Tunnel component – creates a descending cube tunnel below the torus
function Tunnel() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef({ value: 0 });

  const rowCount = 20;
  const columnCount = 64;
  const layerCount = 2;
  const totalInstances = rowCount * columnCount * layerCount;

  const { geometry, material } = useMemo(() => {
    // Bordered cube texture (white square with transparent center)
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 128, 128);
    ctx.clearRect(3, 3, 122, 122);
    const map = new THREE.CanvasTexture(canvas);
    map.anisotropy = 4;

    // Geometry with rcl attribute
    const geo = new THREE.BoxGeometry();
    const rcl = [];
    for (let i = 0; i < rowCount; i++) {
      for (let j = 0; j < layerCount; j++) {
        for (let k = 0; k < columnCount; k++) {
          rcl.push(i, k, j);
        }
      }
    }
    geo.setAttribute(
      "rcl",
      new THREE.InstancedBufferAttribute(new Float32Array(rcl), 3),
    );

    // Material using onBeforeCompile (same as original)
    const mat = new THREE.MeshBasicMaterial({ map, transparent: true });
    const time = timeRef.current;

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.time = time;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `
          uniform float time;
          attribute vec3 rcl;
          #include <common>
        `,
        )
        .replace(
          "#include <project_vertex>",
          `
          const float columnCount = ${columnCount}.0;
          const float arc = 2.0 * 3.14159265359 / columnCount;
          const float oneStep = 0.283;
          float shift = 3.0 - fract(time) * oneStep;
          float radius = shift;
          float zShift = 0.0;
          int x = int(rcl.x);
          for (int i = 0; i < 20; i++) {
            if (i >= x) break;
            radius += radius * arc;
            zShift += radius * arc;
          }
          vec4 mvPosition = vec4(transformed, 1.0);
          if (mvPosition.z > 0.0) {
            radius += radius * arc;
          }
          mvPosition.xz *= radius * arc;
          mvPosition.z += zShift + shift;
          float t = sin(rcl.y / 5.3) * 1.1
                  + sin(rcl.y / 1.3) * 1.5
                  + cos(rcl.y / 1.7) * 2.5;
          t = 2.0 - rcl.x + abs(t) + fract(time);
          t += rcl.z * abs(sin(rcl.y));
          t = max(t, 0.0);
          mvPosition.y -= t * t * t + rcl.z;
          float angle = rcl.y * arc;
          float sn = sin(angle);
          float cs = cos(angle);
          mvPosition.xz = mvPosition.xz * mat2(cs, -sn, sn, cs);
          mvPosition = modelViewMatrix * mvPosition;
          gl_Position = projectionMatrix * mvPosition;
        `,
        );
    };

    return { geometry: geo, material: mat };
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      timeRef.current.value += delta * 0.5;
      meshRef.current.rotation.y -= delta * 0.3;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, totalInstances]}
      position={[0, -1.8, 0]}
      scale={0.9}
    />
  );
}

// Fixed text block (no scroll movement)
function FixedTextBlock({
  content,
  y,
  size,
}: {
  content: string;
  y: number;
  size: number;
}) {
  const ref = useRef<any>(null);

  return (
    <Text
      ref={ref}
      font={FONT}
      fontSize={size}
      color="white"
      anchorX="center"
      anchorY="middle"
      position={[0, y, 0]}
      maxWidth={3}
      textAlign="center"
      fillOpacity={1}
    >
      {content}
    </Text>
  );
}

export default function Scene() {
  const { nodes } = useGLTF("/circle_text_13.glb");

  const circularText = useRef<THREE.Group>(null);
  const transmissionMaterial = useRef<any>(null);
  const spotLight1 = useRef<THREE.SpotLight>(null);
  const spotLight2 = useRef<THREE.SpotLight>(null);

  const elapsedTime = useRef(0);
  const pauseDuration = 3;
  const oscillationDuration = 2;
  const totalCycleDuration = oscillationDuration + pauseDuration;

  useFrame((state, delta) => {
    // Rotate torus model
    if (circularText.current) {
      circularText.current.rotation.y -= delta * 0.3;
    }

    // Animate transmission material IOR
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
      transmissionMaterial.current.ior = ior;
    }
  });

  const torusMesh = nodes.Torus as THREE.Mesh;

  return (
    <>
      <color args={["black"]} attach="background" />
      <ambientLight intensity={0.5} />

      <group rotation={[-0.01, 0.9, 0.01]}>
        <spotLight
          position={[4, 4, 4]}
          intensity={100}
          color="#E5FCFF"
          angle={Math.PI / 8}
          ref={spotLight1}
        />
        <spotLight
          position={[1.5, -0.3, 2]}
          intensity={800}
          power={60.0}
          color="#FFA530"
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

        {/* Torus (glass ring) */}
        <group ref={circularText} position={[0, 0.6, 0]} scale={0.8}>
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
              attenuationColor="#ffffff"
              color="#ff0000"
              ref={transmissionMaterial}
            />
          </mesh>
        </group>

        {/* Tunnel effect - placed below the torus, rotates in sync */}
        <Tunnel />

        {/* Fixed text */}
        <FixedTextBlock content="DIVE IN THE" y={1} size={0.25} />
        <FixedTextBlock content="VAST ABYSS" y={0.5} size={0.25} />
      </group>
    </>
  );
}

useGLTF.preload("/circle_text_13.glb");
