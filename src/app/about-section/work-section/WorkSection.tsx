'use client';

import React, { useEffect, useRef } from 'react';
import styles from './WorkSection.module.css';

interface CardData {
  id: number;
  title: string;
  number: string;
  imageUrl: string;
}

const cardData: CardData[] = [
  { id: 1, title: 'Project Alpha', number: '#001', imageUrl: 'https://picsum.photos/seed/1/400/500' },
  { id: 2, title: 'Project Beta', number: '#002', imageUrl: 'https://picsum.photos/seed/2/400/500' },
  { id: 3, title: 'Project Gamma', number: '#003', imageUrl: 'https://picsum.photos/seed/3/400/500' },
  { id: 4, title: 'Project Delta', number: '#004', imageUrl: 'https://picsum.photos/seed/4/400/500' },
  { id: 5, title: 'Project Epsilon', number: '#005', imageUrl: 'https://picsum.photos/seed/5/400/500' },
  { id: 6, title: 'Project Zeta', number: '#006', imageUrl: 'https://picsum.photos/seed/6/400/500' },
  { id: 7, title: 'Project Eta', number: '#007', imageUrl: 'https://picsum.photos/seed/7/400/500' },
  { id: 8, title: 'Project Theta', number: '#008', imageUrl: 'https://picsum.photos/seed/8/400/500' },
];

declare global {
  interface Window {
    Lenis: any;
    gsap: any;
    ScrollTrigger: any;
    THREE: any;
  }
}

const WorkSection: React.FC = () => {
  const workRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load external scripts
    const loadScripts = async () => {
      const scripts = [
        'https://unpkg.com/lenis@1.1.20/dist/lenis.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
      ];

      const loadScript = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
          document.body.appendChild(script);
        });
      };

      try {
        for (const src of scripts) {
          await loadScript(src);
        }
        initializeAnimations();
      } catch (error) {
        console.error('Error loading scripts:', error);
      }
    };

    const initializeAnimations = () => {
      const { gsap, ScrollTrigger, Lenis, THREE } = window;

      if (!gsap || !ScrollTrigger || !Lenis || !THREE) {
        console.error('Required libraries not loaded');
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis();
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time: number) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      const workSection = workRef.current;
      const cardsContainer = cardsRef.current;
      const textContainer = textContainerRef.current;

      if (!workSection || !cardsContainer || !textContainer) {
        console.error('Required DOM elements not found');
        return;
      }

      const moveDistance = window.innerWidth * 5;
      let currentXPosition = 0;

      const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

      // Grid canvas setup
      const gridCanvas = document.createElement('canvas');
      gridCanvas.id = 'grid-canvas';
      gridCanvas.className = styles['grid-canvas'];
      workSection.appendChild(gridCanvas);
      const gridCtx = gridCanvas.getContext('2d')!;

      const resizeGridCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        gridCanvas.width = window.innerWidth * dpr;
        gridCanvas.height = window.innerHeight * dpr;
        gridCanvas.style.width = `${window.innerWidth}px`;
        gridCanvas.style.height = `${window.innerHeight}px`;
        gridCtx.setTransform(1, 0, 0, 1, 0, 0);
        gridCtx.scale(dpr, dpr);
      };
      resizeGridCanvas();

      const drawGrid = (scrollProgress = 0) => {
        gridCtx.fillStyle = '#000';
        gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
        gridCtx.fillStyle = '#f40c3f';
        const [dotSize, spacing] = [1, 30];
        const [rows, cols] = [
          Math.ceil(window.innerHeight / spacing),
          Math.ceil(window.innerWidth / spacing) + 15,
        ];

        const offset = (scrollProgress * spacing * 10) % spacing;

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            gridCtx.beginPath();
            gridCtx.arc(x * spacing - offset, y * spacing, dotSize, 0, Math.PI * 2);
            gridCtx.fill();
          }
        }
      };

      // Three.js setup
      const lettersScene = new THREE.Scene();
      const lettersCamera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
      );
      lettersCamera.position.z = 20;

      const lettersRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      lettersRenderer.setSize(window.innerWidth, window.innerHeight);
      lettersRenderer.setClearColor(0x000000, 0);
      lettersRenderer.setPixelRatio(window.devicePixelRatio);
      lettersRenderer.domElement.id = 'letters-canvas';
      lettersRenderer.domElement.className = styles['letters-canvas'];
      workSection.appendChild(lettersRenderer.domElement);

      const createTextAnimationPath = (yPos: number, amplitude: number) => {
        const points = [];
        for (let i = 0; i < 20; i++) {
          const t = i / 20;
          points.push(
            new THREE.Vector3(
              -25 + 50 * t,
              yPos + Math.sin(t * Math.PI) * -amplitude,
              (1 - Math.pow(Math.abs(t - 0.5) * 2, 2)) * -5,
            ),
          );
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),
          new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1,
          }),
        );
        (line as any).curve = curve;
        return line;
      };

      const path = [
        createTextAnimationPath(10, 2),
        createTextAnimationPath(3.5, 1),
        createTextAnimationPath(-10, -2),
        createTextAnimationPath(-3.5, -1),
      ];
      path.forEach((line) => lettersScene.add(line));

      const letterPositions = new Map();
      path.forEach((line, i) => {
        (line as any).letterElements = Array.from({ length: 15 }, () => {
          const el = document.createElement('div');
          el.className = styles.letter;
          el.textContent = ['W', 'O', 'R', 'K'][i];
          textContainer.appendChild(el);
          letterPositions.set(el, {
            current: { x: 0, y: 0 },
            target: { x: 0, y: 0 },
          });
          return el;
        });
      });

      const lineSpeedMultipliers = [0.8, 1, 0.7, 0.9];
      const updateTargetPositions = (scrollProgress = 0) => {
        path.forEach((line, lineIndex) => {
          const letterElements = (line as any).letterElements;
          letterElements.forEach((element: HTMLElement, i: number) => {
            const point = (line as any).curve.getPoint(
              (i / 14 + scrollProgress * lineSpeedMultipliers[lineIndex]) % 1,
            );

            const vector = point.clone().project(lettersCamera);
            const positions = letterPositions.get(element);
            positions.target = {
              x: (-vector.x * 0.5 + 0.5) * window.innerWidth,
              y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
            };
          });
        });
      };

      const updateLetterPositions = () => {
        letterPositions.forEach((positions: any, element: HTMLElement) => {
          const distX = positions.target.x - positions.current.x;
          if (Math.abs(distX) > window.innerWidth * 0.7) {
            [positions.current.x, positions.current.y] = [
              positions.target.x,
              positions.target.y,
            ];
          } else {
            positions.current.x = lerp(
              positions.current.x,
              positions.target.x,
              0.07,
            );
            positions.current.y = lerp(
              positions.current.y,
              positions.target.y,
              0.07,
            );
          }
          element.style.transform = `translate(-50%, -50%) translate3d(${positions.current.x}px, ${positions.current.y}px, 0px)`;
        });
      };

      let workTrigger: any;

      const updateCardsPosition = () => {
        const targetX = -moveDistance * (workTrigger?.progress || 0);
        currentXPosition = lerp(currentXPosition, targetX, 0.07);
        gsap.set(cardsContainer, {
          x: currentXPosition,
        });
      };

      const animate = () => {
        updateLetterPositions();
        updateCardsPosition();
        lettersRenderer.render(lettersScene, lettersCamera);
        requestAnimationFrame(animate);
      };

      workTrigger = ScrollTrigger.create({
        trigger: workSection,
        start: 'top top',
        end: '+=700%',
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onUpdate: (self: any) => {
          updateTargetPositions(self.progress);
          drawGrid(self.progress);
        },
      });

      drawGrid(0);
      animate();
      updateTargetPositions(0);

      window.addEventListener('resize', () => {
        resizeGridCanvas();
        drawGrid(workTrigger?.progress || 0);
        lettersCamera.aspect = window.innerWidth / window.innerHeight;
        lettersCamera.updateProjectionMatrix();
        lettersRenderer.setSize(window.innerWidth, window.innerHeight);
        lettersRenderer.setPixelRatio(window.devicePixelRatio);
        updateTargetPositions(workTrigger?.progress || 0);
      });
    };

    loadScripts();

    return () => {
      // Cleanup
      const workSection = workRef.current;
      if (workSection) {
        const canvases = workSection.querySelectorAll('canvas');
        canvases.forEach(canvas => canvas.remove());
      }
    };
  }, []);

  return (
    <section className={styles.work} ref={workRef}>
      <div className={styles['text-container']} ref={textContainerRef}>
        <div className={styles.cards} ref={cardsRef}>
          {cardData.map((card) => (
            <div key={card.id} className={styles.card}>
              <div className={styles['card-img']}>
                <img src={card.imageUrl} alt={card.title} />
              </div>
              <div className={styles['card-copy']}>
                <p>{card.title}</p>
                <p>{card.number}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkSection;