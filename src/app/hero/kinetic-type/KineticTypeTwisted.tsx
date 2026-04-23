import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Shader for Box (Demo 3)
const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;

  mat4 rotation3d(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat4(
      oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
      0.0,                                0.0,                                0.0,                                1.0
    );
  }

  vec3 rotate(vec3 v, vec3 axis, float angle) {
    return (rotation3d(axis, angle) * vec4(v, 1.0)).xyz;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    vec3 axis = vec3(1., 0., 0.);
    float twist = 0.1;
    float angle = pos.x * twist;
    vec3 transformed = rotate(pos, axis, angle);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform sampler2D uTexture;

  void main() {
    float time = uTime * 0.25;
    vec2 uv = fract(vUv * 3. - vec2(time, 0.));
    vec3 texture = texture2D(uTexture, uv).rgb;
    gl_FragColor = vec4(texture, 1.);
  }
`;

const KineticTypeDemo3: React.FC = () => {
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
    camera.position.z = 15;

    const scene = new THREE.Scene();

    // Create text texture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1024;
    canvas.height = 512;
    ctx.fillStyle = '#d8345f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'Bold 80px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TWISTED', canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);

    // Create render target
    const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    const rtCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    rtCamera.position.z = 2.4;

    const rtScene = new THREE.Scene();
    rtScene.background = new THREE.Color('#d8345f');

    const planeGeo = new THREE.PlaneGeometry(4, 2);
    const planeMat = new THREE.MeshBasicMaterial({ map: texture });
    const textPlane = new THREE.Mesh(planeGeo, planeMat);
    textPlane.position.set(-0.945, -0.5, 0);
    textPlane.scale.set(0.009, 0.04, 1);
    rtScene.add(textPlane);

    // Main mesh - Box
    const geometry = new THREE.BoxGeometry(100, 10, 10, 64, 64, 64);
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
    document.body.classList.add('demo-3');

    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('demo-3');
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      rt.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }} />;
};

export default KineticTypeDemo3;