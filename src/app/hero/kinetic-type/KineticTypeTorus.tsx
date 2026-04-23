import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// -------- ENHANCED SHADER with color tint and rim highlight --------
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform sampler2D uTexture;

  void main() {
    float time = uTime * 0.4;
    vec2 repeat = -vec2(12., 3.);
    vec2 uv = fract(vUv * repeat - vec2(time, 0.));
    vec3 tex = texture2D(uTexture, uv).rgb;

    float fog = clamp(vPosition.z / 6., 0., 1.);
    
    // ✅ Subtle color shift — deep blue-black shadows, white highlights
    vec3 shadowColor = vec3(0.02, 0.02, 0.08);
    vec3 fragColor = mix(shadowColor, tex, fog);

    // ✅ Rim highlight based on UV
    float rim = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 3.0);
    fragColor += vec3(0.05, 0.08, 0.15) * rim;

    gl_FragColor = vec4(fragColor, 1.);
  }
`;

// -------- MAIN COMPONENT --------
const KineticTypeTorus: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    renderer.setClearColor(0xfff, 1)
    container.appendChild(renderer.domElement);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.z = 50;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#fff");

    // ---- HIGH-RES RENDER TARGET (captures text for texture) ----
    const rt = new THREE.WebGLRenderTarget(width, height);
    const rtCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    rtCamera.position.z = 2;
    const rtScene = new THREE.Scene();
    rtScene.background = new THREE.Color("#000000");

    // ----- ENHANCED TEXT CANVAS (higher resolution + custom letter spacing) -----
    const canvas = document.createElement("canvas");
    canvas.width = 4096; // ✅ double original resolution
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Draw black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Setup typography
    ctx.fillStyle = "#ffffff";
    ctx.font = 'Bold 220px "Arial Black", sans-serif';
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    // Helper: draw text with custom spacing (simulating letterSpacing: 20px)
    const drawSpacedText = (
      text: string,
      startX: number,
      y: number,
      spacing: number,
    ) => {
      let currentX = startX;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charWidth = ctx.measureText(char).width;
        ctx.fillText(char, currentX, y);
        currentX += charWidth + spacing;
      }
      return currentX;
    };

    const word = "---";
    const letterSpacing = 20;
    const wordWidth = drawSpacedText(word, 0, canvas.height / 2, letterSpacing);
    const spaceBetweenRepeats = 80; 

    let xPos = 0;
    while (xPos < canvas.width) {
      drawSpacedText(word, xPos, canvas.height / 2, letterSpacing);
      xPos += wordWidth + spaceBetweenRepeats;
    }

    const textCanvasTexture = new THREE.CanvasTexture(canvas);
    textCanvasTexture.wrapS = THREE.RepeatWrapping;
    textCanvasTexture.wrapT = THREE.RepeatWrapping;
    textCanvasTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const planeGeo = new THREE.PlaneGeometry(2, 1);
    const planeMat = new THREE.MeshBasicMaterial({ map: textCanvasTexture });
    const textPlane = new THREE.Mesh(planeGeo, planeMat);
    textPlane.position.set(0, 0, 0);
    textPlane.scale.set(3, 1, 1);
    rtScene.add(textPlane);

    // ---- MAIN MESH: denser, more elegant torus knot ----
    // Geometry: radius 9, tube 2.5 (thinner), segments 1024 (smoother), radialSeg 8, p=4, q=3
    const geometry = new THREE.TorusKnotGeometry(9, 2.5, 1024, 8, 4, 3);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: rt.texture },
      },
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);

    // Render target update (captures textPlane into texture each frame)
    mesh.onBeforeRender = (r) => {
      r.setRenderTarget(rt);
      r.render(rtScene, rtCamera);
      r.setRenderTarget(null);
    };

    scene.add(mesh);

    // ---- ANIMATION LOOP with breathing & drift ----
    let time = 0;
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.016;

     
      material.uniforms.uTime.value = time;


      renderer.render(scene, camera);
    };
    animate();

    // ---- RESIZE HANDLER ----
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      rt.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeChild(renderer.domElement);
      rt.dispose();
      geometry.dispose();
      material.dispose();
      textCanvasTexture.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: "400px" }}
    />
  );
};

export default KineticTypeTorus;
