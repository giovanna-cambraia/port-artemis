import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Shader for Sphere (Demo 2)
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
    float time = uTime * 1.5;
    vec2 repeat = vec2(12., 12.);
    vec2 uv = fract(vUv * repeat + vec2(sin(vUv.y * 1.) * 5., time));
    vec3 texture = texture2D(uTexture, uv).rgb;
    float depth = vPosition.z / 10.;
    vec3 fragColor = mix(vec3(0., 0., .8), texture, depth);
    gl_FragColor = vec4(fragColor, 1.);
  }
`;

const KineticTypeDemo2: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 10;

    const scene = new THREE.Scene();

    // Create text texture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1024;
    canvas.height = 512;
    ctx.fillStyle = '#3e64ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'Bold 80px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SWIRL', canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);

    // Create render target
    const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    const rtCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    rtCamera.position.z = 2.4;

    const rtScene = new THREE.Scene();
    rtScene.background = new THREE.Color('#3e64ff');

    const planeGeo = new THREE.PlaneGeometry(4, 2);
    const planeMat = new THREE.MeshBasicMaterial({ map: texture });
    const textPlane = new THREE.Mesh(planeGeo, planeMat);
    textPlane.position.set(-0.9, -0.5, 0);
    textPlane.scale.set(0.0115, 0.04, 1);
    rtScene.add(textPlane);

    // Main mesh - Sphere
    const geometry = new THREE.SphereGeometry(12, 64, 64);
    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: rt.texture },
      },
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    mesh.onBeforeRender = () => {
      renderer.setRenderTarget(rt);
      renderer.render(rtScene, rtCamera);
      renderer.setRenderTarget(null);
    };
    scene.add(mesh);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      timeRef.current += 0.016;
      material.uniforms.uTime.value = timeRef.current;
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      rt.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Set body class for styling
    document.body.classList.add('demo-2');

    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('demo-2');
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      rt.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }} />;
};

export default KineticTypeDemo2;