document.addEventListener("DOMContentLoaded", () => {
  // 1. Register ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // 8. Add safety checks
  const workSection = document.querySelector(".work");
  const cardsContainer = document.querySelector(".cards");
  const textContainer = document.querySelector(".text-container");

  if (!workSection || !cardsContainer || !textContainer) {
    console.error("Required DOM elements not found");
    return;
  }

  const moveDistance = window.innerWidth * 5;
  let currentXPosition = 0;

  const lerp = (start, end, t) => start + (end - start) * t;

  const gridCanvas = document.createElement("canvas");
  gridCanvas.id = "grid-canvas";
  workSection.appendChild(gridCanvas);
  const gridCtx = gridCanvas.getContext("2d");

  // 5. Fix canvas scaling on resize
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
    gridCtx.fillStyle = "#000";
    gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
    gridCtx.fillStyle = "#f40c3f";
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
  lettersRenderer.domElement.id = "letters-canvas";
  workSection.appendChild(lettersRenderer.domElement);

  const createTextAnimationPath = (yPos, amplitude) => {
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
      // 3. Fix LineBasicMaterial
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 1,
      }),
    );
    line.curve = curve;
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
    line.letterElements = Array.from({ length: 15 }, () => {
      const el = document.createElement("div");
      el.className = "letter";
      el.textContent = ["W", "O", "R", "K"][i];
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
      line.letterElements.forEach((element, i) => {
        const point = line.curve.getPoint(
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
    letterPositions.forEach((positions, element) => {
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
      // 4. Fix the transform string
      element.style.transform = `translate(-50%, -50%) translate3d(${positions.current.x}px, ${positions.current.y}px, 0px)`;
    });
  };

  // 7. Replace ScrollTrigger.getAll()[0]?.progress with workTrigger.progress
  let workTrigger;

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

  // 6. Store the ScrollTrigger instance
  workTrigger = ScrollTrigger.create({
    trigger: ".work",
    start: "top top",
    end: "+=700%",
    pin: true,
    pinSpacing: true,
    scrub: 1,
    onUpdate: (self) => {
      updateTargetPositions(self.progress);
      drawGrid(self.progress);
    },
  });

  drawGrid(0);
  animate();
  updateTargetPositions(0);

  // 9. Add a resize pixel ratio update
  window.addEventListener("resize", () => {
    resizeGridCanvas();
    drawGrid(workTrigger?.progress || 0);
    lettersCamera.aspect = window.innerWidth / window.innerHeight;
    lettersCamera.updateProjectionMatrix();
    lettersRenderer.setSize(window.innerWidth, window.innerHeight);
    lettersRenderer.setPixelRatio(window.devicePixelRatio);
    updateTargetPositions(workTrigger?.progress || 0);
  });
});
