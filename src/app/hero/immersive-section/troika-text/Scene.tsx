// Scene.tsx
"use client";

import {
  useGLTF,
  MeshTransmissionMaterial,
  RandomizedLight,
  Text,
  Html,
} from "@react-three/drei";
import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ProjectCard from "../cards/Cards";

const FONT = "/fonts/Oi-Regular.ttf";

function TextBlock({
  content,
  y,
  size,
}: {
  content: string;
  y: number;
  size: number;
}) {
  return (
    <Text
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

function Tunnel() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeUniform = useRef({ value: 0 });

  const rowCount = 20;
  const columnCount = 64;
  const layerCount = 2;
  const totalInstances = rowCount * columnCount * layerCount;

  const rclArray = useMemo(() => {
    const arr = new Float32Array(totalInstances * 3);
    let idx = 0;
    for (let i = 0; i < rowCount; i++) {
      for (let j = 0; j < layerCount; j++) {
        for (let k = 0; k < columnCount; k++) {
          arr[idx++] = i;
          arr[idx++] = k;
          arr[idx++] = j;
        }
      }
    }
    return arr;
  }, []);

  const canvasTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const size = (canvas.width = canvas.height = 128);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, size, size);
    ctx.clearRect(3, 3, size - 6, size - 6);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry();
    geo.setAttribute("rcl", new THREE.InstancedBufferAttribute(rclArray, 3));
    return geo;
  }, [rclArray]);

  const material = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({ map: canvasTexture });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.time = timeUniform.current;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
uniform float time;
attribute vec3 rcl;
#include <common>
        `,
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        `
const float columnCount = ${columnCount}.0;
const float arc = 2.0 * 3.14159265359 / columnCount;
const float oneStep = 0.283;

float shift = 3.0 - fract(time) * oneStep;
float radius = shift;
float zShift = 0.0;

int x = int(rcl.x);
for (int i = 0; i < ${rowCount}; i++) {
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

    return mat;
  }, [canvasTexture]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      timeUniform.current.value += delta;
      meshRef.current.rotation.y -= delta * 0.3;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, totalInstances]}
      position={[0, -1.5, 0]}
    />
  );
}

export default function Scene() {
  const { nodes } = useGLTF("/circle_text_13.glb");
  const { camera } = useThree();
  const circularText = useRef<THREE.Group>(null);
  const transmissionMaterial = useRef<any>(null);
  const spotLight1 = useRef<THREE.SpotLight>(null);
  const spotLight2 = useRef<THREE.SpotLight>(null);
  const elapsedTime = useRef(0);
  const pauseDuration = 3;
  const oscillationDuration = 2;
  const totalCycleDuration = oscillationDuration + pauseDuration;
  const sectionProgress = useRef(0);
  const cardOpacity = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useFrame((state, delta) => {
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

    const p = sectionProgress.current;
    const diveStart = 0.55;
    const diveProgress = Math.max(0, (p - diveStart) / (1 - diveStart));
    const ease = diveProgress * diveProgress * (3 - 2 * diveProgress);
    const camY = THREE.MathUtils.lerp(6, -18, ease);
    const camZ = THREE.MathUtils.lerp(6, 0.2, ease);
    const lookY = THREE.MathUtils.lerp(0, -8, ease);
    const fogNear = THREE.MathUtils.lerp(8, 0.5, ease);
    const fogFar = THREE.MathUtils.lerp(20, 6, ease);

    state.scene.fog = new THREE.Fog("black", fogNear, fogFar);
    camera.position.set(0, camY, camZ);
    (camera as THREE.PerspectiveCamera).lookAt(0, lookY, 0);

    // Drive card opacity directly via ref — no React state, no re-renders
    const newOpacity = Math.max(0, Math.min(1, (p - 0.75) / 0.1));
    if (cardRef.current && newOpacity !== cardOpacity.current) {
      cardOpacity.current = newOpacity;
      cardRef.current.style.opacity = String(newOpacity);
      cardRef.current.style.transform = `translateY(${(1 - newOpacity) * 24}px)`;
      cardRef.current.style.pointerEvents = newOpacity > 0.1 ? "auto" : "none";
    }

    if (circularText.current) {
      circularText.current.rotation.y -= delta * 0.3;
      circularText.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          (mesh.material as any).opacity = 1 - diveProgress * 2;
          (mesh.material as any).transparent = true;
        }
      });
    }

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
      <TextBlock content="THE ABYSS" y={1.8} size={0.35} />
      <TextBlock content="DRIFT INTO" y={2.6} size={0.35} />

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

        <group ref={circularText} position={[0, 2.2, 0]} scale={1}>
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

        <Tunnel />
      </group>

      {/* Card rendered inside the scene via Html — no fixed positioning issues */}
      <Html
        center
        position={[0, -12, 0]}
        zIndexRange={[100, 0]}
        style={{ width: "min(720px, 90vw)" }}
        prepend
      >
        <div
          ref={cardRef}
          style={{
            opacity: 0,
            transform: "translateY(24px)",
            pointerEvents: "none",
            paddingTop: "20px", // room for the status badge that bleeds upward
          }}
        >
          <ProjectCard
            title="MASKED.\nMARKED.\nWATCHED."
            coordinates="35.6762° N / 139.6503° E"
            tag="JAPAN"
            description="Holographic billboards light up the towering skyline, while traditional temples are reduced to relics."
            ctaLabel="_EXECUTE"
            onCta={() => {
              window.open("https://example.com", "_blank");
            }}
            stats={[
              { value: "24/7", label: "MONITOR" },
              { value: "∞", label: "RECORD" },
              { value: "99.9%", label: "ACCURACY" },
            ]}
            subTag="THREE.JS / WEBGL"
            subTitle="FREEDOM TRADED\nFOR SECURITY."
            version="VER: 2.0.0-RC.1"
            badge="FEATURED"
            progress={78}
            status="active"
            metrics={[
              { label: "LATENCY", value: "0.2ms", trend: "down" },
              { label: "BANDWIDTH", value: "1.4TB/s", trend: "up" },
              { label: "UPTIME", value: "99.99%", trend: "stable" },
            ]}
          />
        </div>
      </Html>
    </>
  );
}

useGLTF.preload("/circle_text_13.glb");
