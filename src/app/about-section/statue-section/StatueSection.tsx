"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./StatueSection.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function StatueSection() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);
  const topTextRef = useRef<HTMLDivElement>(null);
  const bottomTextRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !sectionRef.current) return;

    // ── RENDERER ─────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    canvasRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, 5);

    // ── MOUSE TRACKING ───────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── LOAD MODEL ───────────────────────────────────────────────
    const loader = new GLTFLoader();
    const group = new THREE.Group();
    scene.add(group);

    // subtle red point light inside
    const redLight = new THREE.PointLight(0xe03030, 0, 3);
    redLight.position.set(0, 0, 0);
    group.add(redLight);

    loader.load(
      "/models/marble_torso_from_a_statue_of_dionysos.glb",
      (gltf) => {
        const model = gltf.scene;

        // compute bounding box to center + scale
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.2 / maxDim;

        model.position.sub(center);
        model.scale.setScalar(scale);

        // convert every mesh to wireframe edges
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const edges = new THREE.EdgesGeometry(mesh.geometry, 15);
            const mat = new THREE.LineBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.75,
            });
            const wireframe = new THREE.LineSegments(edges, mat);
            wireframe.position.copy(mesh.position);
            wireframe.rotation.copy(mesh.rotation);
            wireframe.scale.copy(mesh.scale);
            mesh.parent?.add(wireframe);
            mesh.visible = false;
          }
        });

        group.add(model);

        // entrance animation
        group.scale.setScalar(0);
        gsap.to(group.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.4,
          ease: "power3.out",
          delay: 0.3,
        });

        // red light pulse on load
        gsap.to(redLight, {
          intensity: 2,
          duration: 0.8,
          yoyo: true,
          repeat: 3,
          ease: "power2.inOut",
          delay: 0.3,
        });
      },
      undefined,
      (err) => console.error("GLB load error:", err),
    );

    // ── AMBIENT PARTICLES ────────────────────────────────────────
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.012,
      transparent: true,
      opacity: 0.35,
    });
    scene.add(new THREE.Points(particleGeo, particleMat));

    // ── RENDER LOOP ───────────────────────────────────────────────
    let rafId: number;
    const clock = new THREE.Clock();
    const targetRot = { x: 0, y: 0 };
    const currentRot = { x: 0, y: 0 };

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // auto rotate + mouse parallax
      targetRot.y = t * 0.18 + mouse.x * 0.25;
      targetRot.x = mouse.y * 0.12;

      currentRot.x += (targetRot.x - currentRot.x) * 0.04;
      currentRot.y += (targetRot.y - currentRot.y) * 0.04;

      group.rotation.y = currentRot.y;
      group.rotation.x = currentRot.x;

      // breathing scale
      const breathe = 1 + Math.sin(t * 0.8) * 0.008;
      if (group.scale.x > 0.1) {
        group.scale.setScalar(group.scale.x > 0.95 ? breathe : group.scale.x);
      }

      // red light flicker
      redLight.intensity = Math.max(0, Math.sin(t * 3.5) * 0.4);

      renderer.render(scene, camera);
    };
    animate();

    // ── GSAP INTRO ───────────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      topTextRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.9 },
      0.2,
    )
      .fromTo(
        leftTextRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.9 },
        0.4,
      )
      .fromTo(
        rightTextRef.current,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.9 },
        0.4,
      )
      .fromTo(
        bottomTextRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9 },
        0.6,
      )
      .fromTo(
        hudRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        0.8,
      );

    // ── RESIZE ───────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      tl.kill();
      renderer.dispose();
      if (canvasRef.current?.contains(renderer.domElement)) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      {/* Three.js canvas */}
      <div ref={canvasRef} className={styles.canvas} />

      {/* Noise */}
      <div className={styles.noise} />

      {/* Top — big name bleeding off edges */}
      <div ref={topTextRef} className={styles.topText} style={{ opacity: 0 }}>
        <span className={styles.topName}>HEAD INTO</span>
        <span className={styles.topNameOutline}>THE ABYSS</span>
      </div>

      {/* Left vertical text */}
      <div ref={leftTextRef} className={styles.leftText} style={{ opacity: 0 }}>
        <span className={styles.verticalText}>SYSTEMS</span>
      </div>

      {/* Right vertical text */}
      <div
        ref={rightTextRef}
        className={styles.rightText}
        style={{ opacity: 0 }}
      >
        <span className={styles.verticalText}>ENGINEER</span>
      </div>

      {/* HUD overlays */}
      <div ref={hudRef} className={styles.hud} style={{ opacity: 0 }}>
        {/* top-left bracket */}
        <div className={styles.hudTL}>
          <span className={styles.hudLabel}>// REF: THE REAL YOU</span>
        </div>
        {/* top-right */}
        <div className={styles.hudTR}>
          <span className={styles.hudLabel}>DIONYSOS · MARBLE</span>
        </div>
      </div>
    </section>
  );
}
