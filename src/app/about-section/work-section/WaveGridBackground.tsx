'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './WaveGridBackground.module.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const GRID_SIZE = 40;
const CUBE_WIDTH = 0.8;
const CUBE_HEIGHT = 3;
const MAX_TRAIL = 128;

const WAVE_PARAMS = {
  gap: 0.01,
  waveAmplitude: 0.4,
  waveSpeed: 6.0,
  waveFrequency: 1.2,
  waveWidth: 3.0,
  waveJitter: 0.2,
  waveMaxHeight: 0.4,
  colorBase: '#292929',
  colorHigh: '#fff',
};

const LIGHTING_PARAMS = {
  ambientColor: '#000',
  ambientIntensity: 0.4,
  directionalColor: '#FF0000',
  directionalIntensity: 3.0,
  directional2Color: '#fff',
  directional2Intensity: 1.5,
};

const CAMERA_RADIUS = 12;
const ALPHA_RANGE = Math.PI * 0.03; 
const BETA_RANGE = Math.PI * 0.05; 

const VignetteRGBShiftShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    shiftAmount: { value: 0.005 },
    vignetteRadius: { value: 0.3 },
    vignetteSoftness: { value: 0.3 },
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
    uniform float shiftAmount;
    uniform float vignetteRadius;
    uniform float vignetteSoftness;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      float dist = distance(vUv, center);
      float horzQuadrant = sign(vUv.x - center.x);
      float vertQuadrant = sign(vUv.y - center.y);

      float vignetteFactor = smoothstep(vignetteRadius, vignetteRadius + vignetteSoftness, dist);
      float currentShift = shiftAmount * vignetteFactor;

      float r = texture2D(tDiffuse, vUv + vec2(currentShift * horzQuadrant, currentShift * vertQuadrant)).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - vec2(currentShift * horzQuadrant, currentShift * vertQuadrant)).b;

      float darken = 1.0 - vignetteFactor * 0.5;
      gl_FragColor = vec4(vec3(r, g, b) * darken, 1.0);
    }
  `,
};

function overrideVertexShader(vertexShader: string) {
  return vertexShader
    .replace(
      '#include <common>',
      `#include <common>
      varying float vHeight;
      attribute vec2 aOffset;
      uniform sampler2D uTrailTexture;
      uniform int       uTrailCount;
      uniform float     uWaveSpeed;
      uniform float     uWaveFreq;
      uniform float     uWaveWidth;
      uniform float     uFadeTime;
      uniform float     uAmplitude;
      uniform float     uJitter;
      uniform float     uMaxHeight;

      vec2 hash2( vec2 p ) {
        p = vec2(
          dot( p, vec2( 127.1, 311.7 ) ),
          dot( p, vec2( 269.5, 183.3 ) )
        );
        return fract( sin( p ) * 43758.5453123 ) - 0.5;
      }`,
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>

      vHeight = 0.0;

      if ( position.y > 0.0 ) {
        vec2 jitter  = hash2( aOffset ) * uJitter;
        vec2 worldXZ = aOffset + jitter;
        float waveHeight  = 0.0;
        float totalWeight = 0.0;

        for ( int i = 0; i < uTrailCount; i++ ) {
          vec4 td = texture2D(
            uTrailTexture,
            vec2( ( float(i) + 0.5 ) / ${MAX_TRAIL}.0, 0.5 )
          );
          float dist      = length( worldXZ - td.rg );
          float wavefront = uWaveSpeed * td.b;
          float relDist   = dist - wavefront;

          float window = exp( -( relDist * relDist ) / ( uWaveWidth * uWaveWidth ) );
          float fade   = exp( -td.b / uFadeTime );
          float atten  = 1.0 / ( 1.0 + dist * 0.1 );
          float weight = fade * window * atten * td.a;

          waveHeight  += weight * cos( uWaveFreq * relDist );
          totalWeight += weight;
        }

        waveHeight /= max( totalWeight, 1.0 );

        float displacement = clamp( waveHeight * uAmplitude, -uMaxHeight, uMaxHeight );
        transformed.y += displacement;
        vHeight = displacement;
      }`,
    );
}

interface TrailPoint {
  x: number;
  z: number;
  age: number;
  distDelta: number;
}

function useMouseTrail(bounds: number, camera: THREE.Camera) {
  const trailRef = useRef<TrailPoint[]>([]);
  const lastPointRef = useRef<{ x: number; z: number } | null>(null);
  const timeSinceLastMoveRef = useRef(0);
  const randomPointTimerRef = useRef(0);
  const isPlacingRandomRef = useRef(true);

  const paramsRef = useRef({ fadeTime: 2.0, trailSpacing: 0.1 });

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const rayPlane = useMemo(() => {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(bounds, bounds),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.updateMatrixWorld(true);
    return plane;
  }, [bounds]);

  const trailData = useMemo(() => new Float32Array(MAX_TRAIL * 4), []);
  const trailTexture = useMemo(() => {
    const tex = new THREE.DataTexture(
      trailData,
      MAX_TRAIL,
      1,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    tex.needsUpdate = true;
    return tex;
  }, [trailData]);

  const uniforms = useMemo(
    () => ({
      uTrailTexture: { value: trailTexture },
      uTrailCount: { value: 0 },
      uFadeTime: { value: paramsRef.current.fadeTime },
    }),
    [trailTexture],
  );

  const addPoint = (x: number, z: number, distDelta: number) => {
    const trail = trailRef.current;
    if (trail.length >= MAX_TRAIL) trail.shift();
    trail.push({ x, z, age: 0, distDelta });
  };

  const addRandomPoint = () => {
    const x = (Math.random() * 0.5 - 0.25) * bounds;
    const z = (Math.random() * 0.5 - 0.25) * bounds;
    const distDelta = 0.8 + Math.random() * 0.2;
    addPoint(x, z, distDelta);
  };

  useEffect(() => {
    const mouseCoords = new THREE.Vector2();

    const onPointerMove = (e: PointerEvent) => {
      mouseCoords.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );

      raycaster.setFromCamera(mouseCoords, camera);
      const hits = raycaster.intersectObject(rayPlane);
      if (hits.length === 0) return;

      const { x, z } = hits[0].point;

      let distDelta = 0;
      if (lastPointRef.current) {
        const dx = x - lastPointRef.current.x;
        const dz = z - lastPointRef.current.z;
        distDelta = Math.sqrt(dx * dx + dz * dz);
        if (distDelta < paramsRef.current.trailSpacing) return;
      }

      addPoint(x, z, distDelta);
      lastPointRef.current = { x, z };

      timeSinceLastMoveRef.current = 0;
      isPlacingRandomRef.current = false;
      randomPointTimerRef.current = 0;
    };

    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [camera, raycaster, rayPlane]);

  const update = (delta: number) => {
    const expiry = paramsRef.current.fadeTime * 4;
    const trail = trailRef.current;

    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].age += delta;
      if (trail[i].age > expiry) trail.splice(i, 1);
    }

    timeSinceLastMoveRef.current += delta;

    if (timeSinceLastMoveRef.current >= 3.0 && !isPlacingRandomRef.current) {
      isPlacingRandomRef.current = true;
      randomPointTimerRef.current = 0;
    }

    if (isPlacingRandomRef.current) {
      randomPointTimerRef.current += delta;
      if (randomPointTimerRef.current >= 1.5) {
        addRandomPoint();
        randomPointTimerRef.current = 0;
      }
    }

    const count = Math.min(trail.length, MAX_TRAIL);
    if (count > 0 || uniforms.uTrailCount.value > 0) {
      for (let i = 0; i < count; i++) {
        const ti = i * 4;
        trailData[ti] = trail[i].x;
        trailData[ti + 1] = trail[i].z;
        trailData[ti + 2] = trail[i].age;
        trailData[ti + 3] = trail[i].distDelta;
      }
      trailTexture.needsUpdate = true;
      uniforms.uTrailCount.value = count;
    }
  };

  return { uniforms, update };
}

function WaveGridScene() {
  const { gl, scene, camera, size } = useThree();
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null!);
  const shaderRef = useRef<any>(null);

  const mouse = useRef(new THREE.Vector2(0, 0));
  const lerpedMouse = useRef(new THREE.Vector2(0, 0));

  const bounds = useMemo(
    () => GRID_SIZE * (CUBE_WIDTH + WAVE_PARAMS.gap),
    [],
  );

  const trail = useMouseTrail(bounds, camera);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    scene.background = new THREE.Color(WAVE_PARAMS.colorBase).multiplyScalar(
      0.5,
    );
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 40;
      camera.near = 0.1;
      camera.far = 200;
      camera.updateProjectionMatrix();
    }
  }, [camera, scene]);

  const { geometry, offsetAttribute } = useMemo(() => {
    const geo = new THREE.BoxGeometry(CUBE_WIDTH, CUBE_HEIGHT, CUBE_WIDTH);
    const count = GRID_SIZE * GRID_SIZE;
    const offsetAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(count * 2),
      2,
    );
    geo.setAttribute('aOffset', offsetAttr);
    return { geometry: geo, offsetAttribute: offsetAttr };
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    mat.onBeforeCompile = (shader: any) => {
      shader.uniforms.uTrailTexture = trail.uniforms.uTrailTexture;
      shader.uniforms.uTrailCount = trail.uniforms.uTrailCount;
      shader.uniforms.uFadeTime = trail.uniforms.uFadeTime;
      shader.uniforms.uWaveSpeed = { value: WAVE_PARAMS.waveSpeed };
      shader.uniforms.uWaveFreq = { value: WAVE_PARAMS.waveFrequency };
      shader.uniforms.uWaveWidth = { value: WAVE_PARAMS.waveWidth };
      shader.uniforms.uAmplitude = { value: WAVE_PARAMS.waveAmplitude };
      shader.uniforms.uJitter = { value: WAVE_PARAMS.waveJitter };
      shader.uniforms.uMaxHeight = { value: WAVE_PARAMS.waveMaxHeight };
      shader.uniforms.uColorBase = {
        value: new THREE.Color(WAVE_PARAMS.colorBase),
      };
      shader.uniforms.uColorHigh = {
        value: new THREE.Color(WAVE_PARAMS.colorHigh),
      };

      shader.vertexShader = overrideVertexShader(shader.vertexShader);
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying float vHeight;
          uniform vec3  uColorBase;
          uniform vec3  uColorHigh;
          uniform float uMaxHeight;`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float t = clamp( vHeight / uMaxHeight, 0.0, 1.0 );
          diffuseColor.rgb = mix( uColorBase, uColorHigh, t );`,
        );

      shaderRef.current = shader;
    };
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const depthMaterial = useMemo(() => {
    const mat = new THREE.MeshDepthMaterial();
    mat.onBeforeCompile = (shader: any) => {
      shader.uniforms.uTrailTexture = trail.uniforms.uTrailTexture;
      shader.uniforms.uTrailCount = trail.uniforms.uTrailCount;
      shader.uniforms.uFadeTime = trail.uniforms.uFadeTime;
      shader.uniforms.uWaveSpeed = { value: WAVE_PARAMS.waveSpeed };
      shader.uniforms.uWaveFreq = { value: WAVE_PARAMS.waveFrequency };
      shader.uniforms.uWaveWidth = { value: WAVE_PARAMS.waveWidth };
      shader.uniforms.uAmplitude = { value: WAVE_PARAMS.waveAmplitude };
      shader.uniforms.uJitter = { value: WAVE_PARAMS.waveJitter };
      shader.uniforms.uMaxHeight = { value: WAVE_PARAMS.waveMaxHeight };
      shader.vertexShader = overrideVertexShader(shader.vertexShader);
    };
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mesh = instancedMeshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const spacing = CUBE_WIDTH + WAVE_PARAMS.gap;
    const offset = ((GRID_SIZE - 1) * spacing) / 2;

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const index = i * GRID_SIZE + j;
        const x = i * spacing - offset;
        const z = j * spacing - offset;
        dummy.position.set(x, 0, z);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        offsetAttribute.setXY(index, x, z);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    offsetAttribute.needsUpdate = true;
    mesh.customDepthMaterial = depthMaterial;
  }, [depthMaterial, offsetAttribute]);

  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));

    const vignettePass = new ShaderPass(VignetteRGBShiftShader);
    vignettePass.uniforms.shiftAmount.value = 0.005;
    vignettePass.uniforms.vignetteRadius.value = 0.3;
    vignettePass.uniforms.vignetteSoftness.value = 0.3;
    c.addPass(vignettePass);

    c.addPass(new OutputPass());
    return c;
  }, [gl]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    composer.setPixelRatio(pixelRatio);
  }, [composer, size]);

  useFrame((_, delta) => {
    lerpedMouse.current.x += (mouse.current.x - lerpedMouse.current.x) * 0.04;
    lerpedMouse.current.y += (mouse.current.y - lerpedMouse.current.y) * 0.04;

    if (camera instanceof THREE.PerspectiveCamera) {
      const alpha = lerpedMouse.current.y * ALPHA_RANGE;
      const beta = lerpedMouse.current.x * BETA_RANGE;
      camera.position.set(
        -CAMERA_RADIUS * Math.cos(alpha) * Math.sin(beta),
        CAMERA_RADIUS * Math.cos(alpha) * Math.cos(beta),
        CAMERA_RADIUS * Math.sin(alpha),
      );
      camera.up.set(0, 0, -1);
      camera.lookAt(0, 0, 0);
    }

    trail.update(delta);
    composer.render();
  }, 1);

  return (
    <>
      <ambientLight
        color={LIGHTING_PARAMS.ambientColor}
        intensity={LIGHTING_PARAMS.ambientIntensity}
      />
      <directionalLight
        color={LIGHTING_PARAMS.directionalColor}
        intensity={LIGHTING_PARAMS.directionalIntensity}
        position={[-20, 10, 6]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={0.0001}
      />
      <directionalLight
        color={LIGHTING_PARAMS.directional2Color}
        intensity={LIGHTING_PARAMS.directional2Intensity}
        position={[10, 5, -3]}
      />
      <instancedMesh
        ref={instancedMeshRef}
        args={[geometry, material, GRID_SIZE * GRID_SIZE]}
        castShadow
        receiveShadow
      />
    </>
  );
}

interface WaveGridBackgroundProps {
  revealTargetRef?: React.RefObject<HTMLElement>;
  className?: string;
}

const WaveGridBackground = forwardRef<HTMLDivElement, WaveGridBackgroundProps>(
  ({ revealTargetRef, className }, forwardedRef) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
      if (!mounted || !containerRef.current) return;

      const target = revealTargetRef?.current ?? containerRef.current;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          containerRef.current,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: target,
              start: 'top bottom',
              end: 'top center',
              scrub: true,
            },
          },
        );
      });

      return () => ctx.revert();
    }, [mounted, revealTargetRef]);

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef)
            (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current =
              node;
        }}
        className={[styles.waveGridBackground, className].filter(Boolean).join(' ')}
      >
        {mounted && (
          <Canvas
            className={styles.canvas}
            dpr={[1, 2]}
            shadows
            camera={{ fov: 40, near: 0.1, far: 200, position: [0, CAMERA_RADIUS, 0] }}
            gl={{ antialias: true }}
            onCreated={({ gl, camera }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.95;
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFShadowMap;
              gl.setClearColor('#808080');
              if (camera instanceof THREE.PerspectiveCamera) {
                camera.up.set(0, 0, -1);
                camera.lookAt(0, 0, 0);
              }
            }}
          >
            <WaveGridScene />
          </Canvas>
        )}
      </div>
    );
  },
);

WaveGridBackground.displayName = 'WaveGridBackground';

export default WaveGridBackground;