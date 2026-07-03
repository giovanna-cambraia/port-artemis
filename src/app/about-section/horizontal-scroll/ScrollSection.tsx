"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ScrollSection.module.css";

gsap.registerPlugin(ScrollTrigger);

const BEATS = [
  {
    signal: "SIGNAL_01",
    tag: "ORIGIN",
    headline: "BORN IN\nTHE NOISE.",
    sub: "Started with hardware.\nEnded up everywhere.\nEmbedded systems, backends,\nthe occasional star map.",
  },
  {
    signal: "SIGNAL_02",
    tag: "OBSESSION",
    headline: "WHY\nSYSTEMS.",
    sub: "Code is just physics\nat a higher abstraction.\nI build things that run\nclose to the metal — and feel it.",
  },
  {
    signal: "SIGNAL_03",
    tag: "METHOD",
    headline: "STRUCTURE\nOR CHAOS.",
    sub: "NestJS · C · TypeScript.\nBare-metal ARM.\nI don't pick tools.\nI pick the right level of control.",
  },
  {
    signal: "SIGNAL_04",
    tag: "TRAJECTORY",
    headline: "AIMED AT\nORBIT.",
    sub: "ITA. INPE. Robotics.\nSpace engineering.\nEvery project is a stage\nin the launch sequence.",
  },
];

export default function ScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 20;

    const clusterCubes: THREE.LineSegments[] = [];
    const clusterData: {
      rx: number;
      ry: number;
      floatOff: number;
      initX: number;
      initY: number;
      initZ: number;
    }[] = [];

    const clusterCount = 22;
    for (let i = 0; i < clusterCount; i++) {
      const size = Math.random() * 1.8 + 0.5;
      const geo = new THREE.BoxGeometry(size, size, size);
      const edges = new THREE.EdgesGeometry(geo);
      const mat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: Math.random() * 0.5 + 0.2,
      });
      const cube = new THREE.LineSegments(edges, mat);

      const angle = (i / clusterCount) * Math.PI * 2;
      const radius = Math.random() * 5 + 1.5;
      const ix = Math.cos(angle) * radius;
      const iy = Math.sin(angle) * radius * 0.6;
      const iz = (Math.random() - 0.5) * 6;

      cube.position.set(ix, iy, iz);
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );

      scene.add(cube);
      clusterCubes.push(cube);
      clusterData.push({
        rx: (Math.random() - 0.5) * 0.005,
        ry: (Math.random() - 0.5) * 0.005,
        floatOff: Math.random() * Math.PI * 2,
        initX: ix,
        initY: iy,
        initZ: iz,
      });
    }

    const bgCubes: THREE.LineSegments[] = [];
    const bgData: { rx: number; ry: number; floatOff: number }[] = [];

    for (let i = 0; i < 18; i++) {
      const size = Math.random() * 1.4 + 0.4;
      const geo = new THREE.BoxGeometry(size, size, size);
      const edges = new THREE.EdgesGeometry(geo);
      const mat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: Math.random() * 0.12 + 0.04,
      });
      const cube = new THREE.LineSegments(edges, mat);
      cube.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 16 - 6,
      );
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      scene.add(cube);
      bgCubes.push(cube);
      bgData.push({
        rx: (Math.random() - 0.5) * 0.003,
        ry: (Math.random() - 0.5) * 0.003,
        floatOff: Math.random() * Math.PI * 2,
      });
    }

    const coreGeo = new THREE.IcosahedronGeometry(0.6, 1);
    const coreEdges = new THREE.EdgesGeometry(coreGeo);
    const coreMat = new THREE.LineBasicMaterial({
      color: 0xe03030,
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.LineSegments(coreEdges, coreMat);
    scene.add(core);

    const state = { progress: 0 };

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.4,
      onUpdate: (self) => {
        state.progress = self.progress;
      },
    });

    const total = BEATS.length;

    leftRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, {
        opacity: i === 0 ? 1 : 0,
        x: i === 0 ? 0 : -50,
        filter: i === 0 ? "blur(0px)" : "blur(6px)",
      });
    });

    rightRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, {
        opacity: i === 0 ? 1 : 0,
        x: i === 0 ? 0 : 50,
        filter: i === 0 ? "blur(0px)" : "blur(6px)",
      });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.4,
      },
    });

    BEATS.forEach((_, i) => {
      const leftEl = leftRefs.current[i];
      const rightEl = rightRefs.current[i];
      if (!leftEl || !rightEl) return;

      const start = i / total;
      const end = (i + 1) / total;
      const mid = (start + end) / 2;
      const segment = end - start;

      if (i > 0) {
        tl.to(
          leftEl,
          {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            duration: segment / 2,
            ease: "none",
          },
          start,
        );

        tl.to(
          rightEl,
          {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            duration: segment / 2,
            ease: "none",
          },
          start,
        );
      }

      if (i < total - 1) {
        tl.to(
          leftEl,
          {
            opacity: 0,
            x: -50,
            filter: "blur(6px)",
            duration: segment / 2,
            ease: "none",
          },
          mid,
        );

        tl.to(
          rightEl,
          {
            opacity: 0,
            x: 50,
            filter: "blur(6px)",
            duration: segment / 2,
            ease: "none",
          },
          mid,
        );
      }
    });

    let rafId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const p = state.progress;

      camera.position.z = 20 - p * 5;
      camera.position.y = Math.sin(t * 0.15) * 0.3;
      camera.rotation.z = Math.sin(t * 0.1) * 0.008;

      const clusterGroup = new THREE.Euler(0, p * Math.PI * 0.5, 0);

      clusterCubes.forEach((cube, i) => {
        const d = clusterData[i];
        cube.rotation.x += d.rx;
        cube.rotation.y += d.ry;

        cube.position.y = d.initY + Math.sin(t * 0.5 + d.floatOff) * 0.25;

        const angle = Math.atan2(d.initX, d.initZ) + p * Math.PI * 0.4;
        const r = Math.sqrt(d.initX * d.initX + d.initZ * d.initZ);
        cube.position.x = Math.sin(angle) * r;
        cube.position.z = Math.cos(angle) * r;
      });

      bgCubes.forEach((cube, i) => {
        const d = bgData[i];
        cube.rotation.x += d.rx;
        cube.rotation.y += d.ry;
        cube.position.y += Math.sin(t * 0.3 + d.floatOff) * 0.001;
      });

      core.rotation.x = t * 0.6;
      core.rotation.y = t * 0.9;
      const coreMat2 = core.material as THREE.LineBasicMaterial;
      coreMat2.opacity = 0.6 + Math.sin(t * 4) * 0.35;
      core.scale.setScalar(1 + Math.sin(t * 3.5) * 0.08);

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
      window.removeEventListener("resize", onResize);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      renderer.dispose();
      if (canvasRef.current?.contains(renderer.domElement)) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section ref={containerRef} className={styles.section}>
      <div className={styles.sticky}>
        <div ref={canvasRef} className={styles.canvas} />

        <div className={styles.noise} />

        <div className={styles.layout}>
          <div className={styles.left}>
            {BEATS.map((beat, i) => (
              <div
                key={i}
                ref={(el) => {
                  leftRefs.current[i] = el;
                }}
                className={styles.leftContent}
              >
                <p className={styles.sub}>
                  {beat.sub.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>

          <div className={styles.center} />

          <div className={styles.right}>
            {BEATS.map((beat, i) => (
              <div
                key={i}
                ref={(el) => {
                  rightRefs.current[i] = el;
                }}
                className={styles.rightContent}
              >
                <div className={styles.signalRow}>
                  <div className={styles.signalBar} />
                  <div className={styles.signalKanji}>0{i + 1}</div>
                  <div className={styles.signalMeta}>
                    <span className={styles.signalCode}>
                      {beat.signal.split("_")[0]}_{beat.signal.split("_")[1]}
                    </span>
                    <span className={styles.signalTag}>{beat.tag}</span>
                  </div>
                </div>
                <h2 className={styles.headline}>
                  {beat.headline.split("\n").map((line, j) => (
                    <span key={j} className={styles.headlineLine}>
                      {line}
                    </span>
                  ))}
                </h2>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.scrollHint}>
          <span className={styles.scrollLine} />
          SCROLL · TRAVERSE
          <span className={styles.scrollLine} />
        </div>
      </div>
    </section>
  );
}
