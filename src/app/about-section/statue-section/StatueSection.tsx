"use client"

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './StatueScene.css';

gsap.registerPlugin(ScrollTrigger);

const PLAQUE_TITLES = [
  'Torso, marble',
  'Chest, detail',
  'Absence, form',
  'Surface, tool marks',
  'Fragment, complete',
];

const SECTIONS = [
  {
    id: 's1',
    eyebrow: 'Excavated fragment — 01',
    title: ['What the', 'stone kept'],
    body: 'A body without a name. Two thousand years of weather sanded away everything but the parts that mattered most.',
  },
  {
    id: 's2',
    eyebrow: '02 — The torso',
    title: ['Muscle carved', 'into memory'],
    body: 'Every plane of the chest was cut to catch light at a single hour of a single day, in a workshop that no longer has a name.',
  },
  {
    id: 's3',
    eyebrow: '03 — Loss as form',
    title: ['The missing', 'parts speak'],
    body: 'No head, no arms, no legend. What survives is turned into the subject itself — absence, sculpted.',
  },
  {
    id: 's4',
    eyebrow: '04 — Surface',
    title: ['Marble', 'remembers heat'],
    body: 'Under raking light the tool marks resurface — a record of hands that stopped moving centuries ago.',
  },
  {
    id: 's5',
    eyebrow: '05 — Closing',
    title: ['Still standing,', 'still unfinished'],
    body: 'A fragment outlives the story built around it. This is the last of it, held here — turning, quietly, for anyone who scrolls this far.',
  },
];

interface TorsoScrollProps {
  modelUrl?: string;
}

export default function StatueScene({ modelUrl = '/models/marble_torso_from_a_statue_of_dionysos.glb' }: TorsoScrollProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [plaqueTitle, setPlaqueTitle] = useState(PLAQUE_TITLES[0]);
  const [progress, setProgress] = useState(0);
  
  // Ref to hold fresnel uniforms for animation
  const fresnelUniformsRef = useRef<{
    uFresnelColor: { value: THREE.Color };
    uFresnelPower: { value: number };
    uFresnelIntensity: { value: number };
  } | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const content = contentRef.current;
    if (!stage || !content) return;

    let renderer: THREE.WebGLRenderer;
    let model: THREE.Object3D | null = null;
    let frameId: number;
    let scrollTriggerInstance: ScrollTrigger | undefined;
    const panelTriggers: ScrollTrigger[] = [];
    let disposed = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141210);
    scene.fog = new THREE.Fog(0x141210, 8, 20);

    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.3, 5.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    stage.appendChild(renderer.domElement);

    // Lighting
    const key = new THREE.SpotLight(0xffe9cc, 220, 20, Math.PI / 6, 0.4, 1.5);
    key.position.set(3, 5, 4);
    scene.add(key);

    const rim = new THREE.SpotLight(0x8ab4ff, 90, 20, Math.PI / 5, 0.5, 1.5);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    const fill = new THREE.AmbientLight(0x403830, 0.9);
    scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(6, 64),
      new THREE.MeshStandardMaterial({ color: 0x1c1a17, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.4;
    scene.add(ground);

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;

        // Fresnel uniforms
        const fresnelUniforms = {
          uFresnelColor: { value: new THREE.Color(0xff6b35) }, // Warm amber glow
          uFresnelPower: { value: 2.0 },
          uFresnelIntensity: { value: 0.6 },
        };
        fresnelUniformsRef.current = fresnelUniforms;

        model.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            const mesh = c as THREE.Mesh;
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat) {
              mat.roughness = 0.55;
              mat.metalness = 0.02;

              // Inject fresnel shader
              mat.onBeforeCompile = (shader) => {
                shader.uniforms.uFresnelColor = fresnelUniforms.uFresnelColor;
                shader.uniforms.uFresnelPower = fresnelUniforms.uFresnelPower;
                shader.uniforms.uFresnelIntensity = fresnelUniforms.uFresnelIntensity;

                shader.vertexShader = shader.vertexShader
                  .replace(
                    '#include <common>',
                    `#include <common>
                     varying vec3 vFresnelNormal;
                     varying vec3 vFresnelViewDir;`
                  )
                  .replace(
                    '#include <begin_vertex>',
                    `#include <begin_vertex>
                     vFresnelNormal = normalize(normalMatrix * normal);
                     vFresnelViewDir = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);`
                  );

                shader.fragmentShader = shader.fragmentShader
                  .replace(
                    '#include <common>',
                    `#include <common>
                     uniform vec3 uFresnelColor;
                     uniform float uFresnelPower;
                     uniform float uFresnelIntensity;
                     varying vec3 vFresnelNormal;
                     varying vec3 vFresnelViewDir;`
                  )
                  .replace(
                    '#include <dithering_fragment>',
                    `#include <dithering_fragment>
                     float fresnelTerm = pow(1.0 - saturate(dot(vFresnelNormal, vFresnelViewDir)), uFresnelPower);
                     gl_FragColor.rgb += uFresnelColor * fresnelTerm * uFresnelIntensity;`
                  );
              };

              mat.needsUpdate = true;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const scale = 2.6 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y -= 0.1;
        scene.add(model);

        initScroll(model);
      },
      undefined,
      (err) => console.error('Model failed to load', err)
    );

    function initScroll(loadedModel: THREE.Object3D) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: content,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          onUpdate: (self) => {
            setProgress(self.progress * 100);
            const idx = Math.min(4, Math.floor(self.progress * 5));
            setPlaqueTitle(PLAQUE_TITLES[idx]);
            
            // Tie fresnel intensity to scroll progress
            if (fresnelUniformsRef.current) {
              fresnelUniformsRef.current.uFresnelIntensity.value = 0.3 + self.progress * 0.7;
            }
          },
        },
      });
      scrollTriggerInstance = tl.scrollTrigger;

      tl.to(loadedModel.rotation, { y: Math.PI * 0.55, ease: 'none' }, 0)
        .to(camera.position, { x: 1.4, y: 0.6, z: 3.6, ease: 'none' }, 0)
        .to(loadedModel.rotation, { y: Math.PI * 1.15, ease: 'none' }, 0.25)
        .to(camera.position, { x: -1.6, y: 0.1, z: 3.0, ease: 'none' }, 0.25)
        .to(loadedModel.rotation, { y: Math.PI * 1.6, ease: 'none' }, 0.5)
        .to(camera.position, { x: -0.6, y: 1.1, z: 2.4, ease: 'none' }, 0.5)
        .to(loadedModel.rotation, { y: Math.PI * 2.05, ease: 'none' }, 0.75)
        .to(camera.position, { x: 0, y: 0.2, z: 4.4, ease: 'none' }, 0.75);

      panelRefs.current.forEach((panel) => {
        if (!panel) return;
        const spacer = panel.closest('.ts-spacer');
        if (!spacer) return;
        gsap.fromTo(
          panel,
          { autoAlpha: 0, y: 30 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            scrollTrigger: {
              trigger: spacer,
              start: 'top 70%',
              end: 'top 30%',
              toggleActions: 'play reverse play reverse',
            },
          }
        );
      });
    }

    function animate() {
      frameId = requestAnimationFrame(animate);
      if (model) camera.lookAt(0, 0, 0);
      
      // Gentle pulse on fresnel power
      if (fresnelUniformsRef.current) {
        const t = performance.now() * 0.001;
        fresnelUniformsRef.current.uFresnelPower.value = 2.0 + Math.sin(t * 0.8) * 0.3;
      }
      
      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      scrollTriggerInstance?.kill();
      panelTriggers.forEach((t) => t.kill());
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === content || panelRefs.current.includes(t.trigger as HTMLDivElement)) {
          t.kill();
        }
      });
      renderer.dispose();
      if (stage.contains(renderer.domElement)) {
        stage.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  return (
    <div className="ts-root">
      <div className="ts-sticky-frame">
        <div className="ts-progress" style={{ width: `${progress}%` }} />
        <div className="ts-credit">Port Artemis — Cat. No. 04</div>
        <div className="ts-canvas-stage" ref={stageRef} />

        <div className="ts-plaque">
          <span>{plaqueTitle}</span>
          scroll to circle the piece
        </div>
      </div>

      <div className="ts-content" ref={contentRef}>
        {SECTIONS.map((section, i) => (
          <div className="ts-spacer" key={section.id}>
            <div
              className={`ts-panel ts-panel-${i + 1}`}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
            >
              <div className="ts-eyebrow">{section.eyebrow}</div>
              <h2 className="ts-heading">
                {section.title[0]}
                <br />
                {section.title[1]}
              </h2>
              <p className="ts-body">{section.body}</p>
            </div>
          </div>
        ))}
        <div className="ts-spacer" />
      </div>
    </div>
  );
}