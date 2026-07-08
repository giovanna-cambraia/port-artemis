"use client";

import { useGLTF, RandomizedLight, Text } from "@react-three/drei";
import { useRef, useMemo } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

const FONT = "/fonts/Sekuya-Regular.ttf";

// ─── CUSTOM POSTPROCESSING SHADERS ──────────────────────────

// 1. WARP DRIVE / REALITY BENDING
const WarpShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    intensity: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float intensity;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      
      // Warp distortion — like gravity lensing
      vec2 center = uv - 0.5;
      float dist = length(center);
      float warp = 1.0 + intensity * 0.3 * (1.0 - dist);
      
      // Radial distortion
      vec2 distorted = uv + center * (warp - 1.0) * 0.1;
      
      // Temporal ripple
      float ripple = sin(dist * 30.0 - time * 2.0) * 0.002 * intensity;
      distorted += center * ripple;
      
      vec4 color = texture2D(tDiffuse, distorted);
      
      // Color shift at edges (like prismatic refraction)
      float edgeShift = pow(dist, 3.0) * intensity * 0.05;
      float r = texture2D(tDiffuse, distorted + vec2(edgeShift, 0.0)).r;
      float b = texture2D(tDiffuse, distorted - vec2(edgeShift, 0.0)).b;
      color.r = mix(color.r, r, 0.5);
      color.b = mix(color.b, b, 0.5);
      
      gl_FragColor = color;
    }
  `,
};

// 2. GLITCH / SIGNAL BREAKDOWN
const GlitchPass = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    amount: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      
      // Horizontal tear lines
      float tear = random(vec2(floor(uv.y * 200.0 + time * 2.0), time * 0.1));
      float threshold = 0.98 - amount * 0.05;
      
      if (tear > threshold) {
        float offset = (random(vec2(time * 0.1, uv.y)) - 0.5) * 0.15 * amount;
        uv.x += offset;
      }
      
      // Block glitch
      float block = random(vec2(floor(uv.y * 50.0), floor(time * 3.0)));
      if (block > threshold - 0.02) {
        vec2 blockUV = floor(uv * vec2(50.0, 20.0)) / vec2(50.0, 20.0);
        uv = mix(uv, blockUV, 0.5);
      }
      
      vec4 color = texture2D(tDiffuse, uv);
      
      // RGB split on glitch
      if (tear > threshold - 0.01) {
        float shift = (random(vec2(time * 0.2, uv.y)) - 0.5) * 0.3 * amount;
        color.r = texture2D(tDiffuse, uv + vec2(shift * 0.05, 0.0)).r;
        color.b = texture2D(tDiffuse, uv - vec2(shift * 0.05, 0.0)).b;
      }
      
      gl_FragColor = color;
    }
  `,
};

// 3. ANALOG NOISE + SCANLINES
const AnalogShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    intensity: { value: 0.04 },
    scanIntensity: { value: 0.1 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float intensity;
    uniform float scanIntensity;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Scanlines (CRT)
      float scanline = sin(vUv.y * 600.0 + time * 2.0) * 0.5 + 0.5;
      scanline = pow(scanline, 8.0) * scanIntensity;
      color.rgb -= scanline;
      
      // Moving noise
      float noise1 = hash(vUv * 2.0 + time * 0.3);
      float noise2 = hash(vUv * 2.0 + time * 0.5 + vec2(10.0, 10.0));
      float noise = (noise1 + noise2) * 0.5 - 0.5;
      
      float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      float noiseAmount = intensity * (1.0 - luminance * 0.5);
      color.rgb += noise * noiseAmount;
      
      // Vignette
      vec2 center = vUv - 0.5;
      float dist = length(center);
      float vignette = 1.0 - smoothstep(0.2, 0.9, dist) * 0.6;
      color.rgb *= vignette;
      
      gl_FragColor = color;
    }
  `,
};

// ─── TUNNEL COMPONENT ─────────────────────────────────────────

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

// ─── MAIN SCENE ──────────────────────────────────────────────

export default function Scene({
  sectionRef,
  progressRef,
}: {
  sectionRef: React.RefObject<HTMLElement> | null;
  progressRef: React.RefObject<number>;
}) {
  const { camera, gl, scene, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const warpPassRef = useRef<ShaderPass | null>(null);
  const glitchPassRef = useRef<ShaderPass | null>(null);
  const analogPassRef = useRef<ShaderPass | null>(null);

  const circularText = useRef<THREE.Group>(null);
  const torusGroupRef = useRef<THREE.Group | null>(null);
  const transmissionMaterial = useRef<any>(null);
  const elapsedTime = useRef(0);

  const pauseDuration = 3;
  const oscillationDuration = 2;
  const totalCycleDuration = oscillationDuration + pauseDuration;

  // ─── SETUP POSTPROCESSING ──────────────────────────────────
  useMemo(() => {
    const composer = new EffectComposer(gl);

    // Render pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom — ethereal glow
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.15, // strength
      0.4, // radius
      0.2, // threshold
    );
    composer.addPass(bloomPass);
    bloomPassRef.current = bloomPass;

    // Warp — reality bending
    const warpPass = new ShaderPass(WarpShader);
    warpPass.uniforms.intensity.value = 0;
    composer.addPass(warpPass);
    warpPassRef.current = warpPass;

    // Glitch — signal breakdown
    const glitchPass = new ShaderPass(GlitchPass);
    glitchPass.uniforms.amount.value = 0;
    composer.addPass(glitchPass);
    glitchPassRef.current = glitchPass;

    // Analog — noise + scanlines
    const analogPass = new ShaderPass(AnalogShader);
    analogPass.uniforms.intensity.value = 0.03;
    analogPass.uniforms.scanIntensity.value = 0.08;
    composer.addPass(analogPass);
    analogPassRef.current = analogPass;

    composerRef.current = composer;

    return () => {
      composer.dispose();
    };
  }, [gl, scene, camera, size]);

  // ─── MAIN LOOP ──────────────────────────────────────────────
  useFrame((state, delta) => {
    const p = progressRef.current ?? 0;
    const t = state.clock.getElapsedTime();

    // ── CAMERA DESCENT ──
    const diveStart = 0.25;
    const diveProgress = Math.min(
      0.85,
      Math.max(0, (p - diveStart) / (1 - diveStart)),
    );
    const ease = diveProgress * diveProgress * (3 - 2 * diveProgress);

    const camY = THREE.MathUtils.lerp(6, -18, ease);
    const camZ = THREE.MathUtils.lerp(6, 0.2, ease);
    const lookY = THREE.MathUtils.lerp(0, -8, ease);

    state.scene.fog = new THREE.Fog(
      "black",
      THREE.MathUtils.lerp(8, 0.5, ease),
      THREE.MathUtils.lerp(20, 6, ease),
    );
    camera.position.set(0, camY, camZ);
    (camera as THREE.PerspectiveCamera).lookAt(0, lookY, 0);

    // ── UPDATE POSTPROCESSING ──

    // 1. BLOOM — pulses with scroll
    if (bloomPassRef.current) {
      bloomPassRef.current.strength = 0.1 + p * 0.5 + Math.sin(t * 0.5) * 0.05;
      bloomPassRef.current.threshold = 0.2 - p * 0.15;
    }

    // 2. WARP — intensifies as you descend (reality bending)
    if (warpPassRef.current) {
      warpPassRef.current.uniforms.intensity.value =
        ease * 0.8 + Math.sin(t * 0.2) * 0.05;
      warpPassRef.current.uniforms.time.value = t;
    }

    // 3. GLITCH — increases with scroll, chaotic pulses
    if (glitchPassRef.current) {
      // Glitch amount: base from scroll + random spikes
      const glitchBase = ease * 0.9;
      const glitchSpike = Math.pow(Math.sin(t * 1.7) * 0.5 + 0.5, 12) * 0.5;
      glitchPassRef.current.uniforms.amount.value = glitchBase + glitchSpike;
      glitchPassRef.current.uniforms.time.value = t;
    }

    // 4. ANALOG — noise increases with scroll (signal degradation)
    if (analogPassRef.current) {
      analogPassRef.current.uniforms.intensity.value = 0.02 + ease * 0.08;
      analogPassRef.current.uniforms.scanIntensity.value = 0.05 + ease * 0.2;
      analogPassRef.current.uniforms.time.value = t;
    }

    // ── CIRCULAR TEXT ──
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

    // ── TRANSMISSION MATERIAL ──
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

    // ── RENDER WITH COMPOSER ──
    if (composerRef.current) {
      composerRef.current.render();
    }
  });

  // ─── RESIZE ──────────────────────────────────────────────────
  useThree(({ size }) => {
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height);
    }
  });

  return (
    <>
      <color args={["black"]} attach="background" />

      <group rotation={[-0.01, 0.9, 0.01]}>
        <spotLight
          position={[4, 4, 4]}
          intensity={100}
          color="#E5FCFF"
          angle={Math.PI / 8}
        />
        <spotLight
          position={[1.5, -0.3, 2]}
          intensity={800}
          power={60.0}
          color="#FFA530"
          angle={Math.PI / 4}
        />
        <RandomizedLight
          radius={10}
          ambient={0.5}
          intensity={1}
          position={[2.5, 8, -2.5]}
          bias={0.001}
        />

        <Tunnel />
      </group>
    </>
  );
}
