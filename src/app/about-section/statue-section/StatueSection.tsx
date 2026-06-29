"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./StatueSection.module.css";

gsap.registerPlugin(ScrollTrigger);

// side: "left" = text left / statue right, "right" = text right / statue left
const SECTIONS = [
  {
    signal: "SIGNAL_01 // ORIGIN",
    headline: ["HEAD", "INTO THE", "ABYSS."],
    body: "Started with hardware.\nEnded up everywhere.\nEmbedded systems, backends,\nthe occasional star map.",
    side: "left",
  },
  {
    signal: "SIGNAL_02 // CRAFT",
    headline: ["STRUCTURE", "OR", "CHAOS."],
    body: "NestJS · C · TypeScript · ARM.\nI don't pick tools.\nI pick the right level\nof control.",
    side: "right",
  },
  {
    signal: "SIGNAL_03 // TRAJECTORY",
    headline: ["AIMED", "AT", "ORBIT."],
    body: "ITA. INPE. Robotics.\nSpace engineering.\nEvery project is a stage\nin the launch sequence.",
    side: "left",
  },
  {
    signal: "SIGNAL_04 // NOW",
    headline: ["STILL", "TRANS", "MITTING."],
    body: "Signal ongoing.\nNo end timestamp.\n\n// REF: THE REAL YOU",
    side: "right",
  },
] as const;

export default function StatueScene() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const signalRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headlineRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const bodyRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current) return;

    // ── RENDERER ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    canvasRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0, 6);

    // ── LIGHTS — much stronger so statue is unmissable ────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));

    // strong front key
    const keyLight = new THREE.DirectionalLight(0xffffff, 8);
    keyLight.position.set(1, 3, 6);
    scene.add(keyLight);

    // blue rim for iridescent feel
    const rimBlue = new THREE.DirectionalLight(0x88ccff, 5);
    rimBlue.position.set(-5, 2, -2);
    scene.add(rimBlue);

    // red fill
    const rimRed = new THREE.DirectionalLight(0xff3300, 4);
    rimRed.position.set(4, -2, -3);
    scene.add(rimRed);

    // top
    const topLight = new THREE.DirectionalLight(0xffffff, 4);
    topLight.position.set(0, 8, 1);
    scene.add(topLight);

    // glowing point
    const glow = new THREE.PointLight(0xffffff, 12, 5);
    glow.position.set(0, 1, 3);
    scene.add(glow);

    // ── MODEL ─────────────────────────────────────────────────────
    const group = new THREE.Group();
    scene.add(group);

    const loader = new GLTFLoader();
    loader.load(
      "/models/marble_torso_from_a_statue_of_dionysos.glb",
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // center and scale to fill more of the screen
        model.position.sub(center);
        model.scale.setScalar(4.2 / maxDim);

        // bright metallic material — picks up all the colored lights
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: 0x888888,    // mid-grey so colors from lights read clearly
              metalness: 0.9,
              roughness: 0.15,
              envMapIntensity: 2,
            });
          }
        });

        group.add(model);

        // entrance
        group.position.y = -2.5;
        group.scale.setScalar(0.3);
        gsap.to(group.position, { y: 0, duration: 2, ease: "power3.out" });
        gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 2, ease: "power3.out" });
      },
      undefined,
      (err) => console.error("GLB error:", err)
    );

    // ── CANVAS VISIBILITY ─────────────────────────────────────────
    const canvasEl = canvasRef.current;
    ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top bottom",
      end: "bottom top",
      onEnter:      () => gsap.to(canvasEl, { opacity: 1, duration: 0.5 }),
      onLeave:      () => gsap.to(canvasEl, { opacity: 0, duration: 0.5 }),
      onEnterBack:  () => gsap.to(canvasEl, { opacity: 1, duration: 0.5 }),
      onLeaveBack:  () => gsap.to(canvasEl, { opacity: 0, duration: 0.5 }),
    });

    // ── SCROLL → ROTATION ─────────────────────────────────────────
    const targetRot = { y: -0.4 };
    ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 2.5,
      onUpdate: (self) => {
        targetRot.y = -0.4 + self.progress * Math.PI * 1.6;
      },
    });

    // ── TEXT ANIMATIONS ───────────────────────────────────────────
    SECTIONS.forEach((section, i) => {
      const signal   = signalRefs.current[i];
      const headline = headlineRefs.current[i];
      const body     = bodyRefs.current[i];
      const lines    = headline?.querySelectorAll(`.${styles.headlineLine}`);
      const isLeft   = section.side === "left";

      const pct = (v: number) => `${v}%`;
      const s  = i * 25;       // section start %
      const e  = (i + 1) * 25; // section end %
      const inE  = pct(s + 9);
      const outS = pct(e - 9);
      const outE = pct(e);

      const wrap = wrapperRef.current!;

      // signal
      gsap.fromTo(signal,
        { opacity: 0, x: isLeft ? -24 : 24 },
        { opacity: 1, x: 0, scrollTrigger: { trigger: wrap, start: pct(s), end: inE, scrub: true } }
      );
      gsap.fromTo(signal,
        { opacity: 1, x: 0 },
        { opacity: 0, x: isLeft ? -24 : 24, scrollTrigger: { trigger: wrap, start: outS, end: outE, scrub: true } }
      );

      // headline lines — alternate slide direction
      lines?.forEach((line, j) => {
        const xIn  =  isLeft ? -(60 + j * 20) :  (60 + j * 20);
        const xOut = -xIn * 0.6;
        gsap.fromTo(line,
          { opacity: 0, x: xIn, filter: "blur(10px)" },
          { opacity: 1, x: 0,   filter: "blur(0px)",  scrollTrigger: { trigger: wrap, start: pct(s), end: inE, scrub: true } }
        );
        gsap.fromTo(line,
          { opacity: 1, x: 0,    filter: "blur(0px)" },
          { opacity: 0, x: xOut, filter: "blur(6px)",  scrollTrigger: { trigger: wrap, start: outS, end: outE, scrub: true } }
        );
      });

      // body — slides from opposite side to headline
      const bodyXIn = isLeft ? 30 : -30;
      gsap.fromTo(body,
        { opacity: 0, y: 16, x: bodyXIn },
        { opacity: 1, y: 0,  x: 0, scrollTrigger: { trigger: wrap, start: pct(s + 4), end: pct(s + 14), scrub: true } }
      );
      gsap.fromTo(body,
        { opacity: 1 },
        { opacity: 0, scrollTrigger: { trigger: wrap, start: outS, end: outE, scrub: true } }
      );
    });

    // ── MOUSE + RENDER LOOP ───────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMouse);

    let rafId: number;
    const clock = new THREE.Clock();
    let curY = -0.4, curX = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      curY += (targetRot.y - curY) * 0.04;
      curX += (mouse.y * 0.1 - curX) * 0.04;

      group.rotation.y = curY + mouse.x * 0.06;
      group.rotation.x = curX;
      group.position.y = Math.sin(t * 0.5) * 0.06;

      // orbit colored lights for iridescence
      rimBlue.position.x = Math.sin(t * 0.4) * 5;
      rimBlue.position.z = Math.cos(t * 0.4) * 3 - 2;
      rimRed.position.x  = Math.cos(t * 0.3) * 4;
      glow.intensity     = 10 + Math.sin(t * 1.8) * 4;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      renderer.dispose();
      if (canvasRef.current?.contains(renderer.domElement)) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div ref={canvasRef} className={styles.canvas} style={{ opacity: 0 }} />
      <div className={styles.noise} />
      <div className={styles.chromaLine} />

      <div className={styles.content}>
        {SECTIONS.map((section, i) => (
          <div
            key={i}
            className={`${styles.section} ${section.side === "right" ? styles.sectionRight : styles.sectionLeft}`}
          >
            {/* text block — switches side per section */}
            <div className={styles.textBlock}>
              <div
                ref={(el) => { signalRefs.current[i] = el; }}
                className={styles.signal}
              >
                <span className={styles.signalDash}>——</span>
                {section.signal}
              </div>

              <h2
                ref={(el) => { headlineRefs.current[i] = el; }}
                className={styles.headline}
              >
                {section.headline.map((line, j) => (
                  <span key={j} className={styles.headlineLine}>{line}</span>
                ))}
              </h2>

              <p
                ref={(el) => { bodyRefs.current[i] = el; }}
                className={styles.body}
              >
                {section.body.split("\n").map((line, j) => (
                  <span key={j}>{line}<br /></span>
                ))}
              </p>
            </div>

            {/* spacer — statue lives here visually */}
            <div className={styles.statueSide} />

            <span className={styles.sectionNum}>0{i + 1} / 0{SECTIONS.length}</span>
          </div>
        ))}
      </div>

   
    </div>
  );
}