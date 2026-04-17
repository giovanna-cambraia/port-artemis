"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import "./Skull.css";

// Assets
const cardtemplate =
  "https://raw.githubusercontent.com/pizza3/asset/master/cardtemplate3.png";
const cardtemplateback =
  "https://raw.githubusercontent.com/pizza3/asset/master/cardtemplateback4.png";
const flower =
  "https://raw.githubusercontent.com/pizza3/asset/master/flower3.png";
const noise2 =
  "https://raw.githubusercontent.com/pizza3/asset/master/noise2.png";
const color11 =
  "https://raw.githubusercontent.com/pizza3/asset/master/color11.png";
const backtexture =
  "https://raw.githubusercontent.com/pizza3/asset/master/color3.jpg";
const skullmodel =
  "https://raw.githubusercontent.com/pizza3/asset/master/skull5.obj";
const voronoi =
  "https://raw.githubusercontent.com/pizza3/asset/master/rgbnoise2.png";

// Shaders (same as before - keeping them concise here)
const vert = `
  varying vec2 vUv;
  varying vec3 camPos;
  varying vec3 eyeVector;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    camPos = cameraPosition;
    vNormal = normal;
    vec4 worldPosition = modelViewMatrix * vec4( position, 1.0);
    eyeVector = normalize(worldPosition.xyz - cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const fragPlane = `
  varying vec2 vUv;
  uniform sampler2D skullrender;
  uniform sampler2D cardtemplate;
  uniform sampler2D backtexture;
  uniform sampler2D noiseTex;
  uniform sampler2D color;
  uniform sampler2D noise;
  uniform vec4 resolution;
  varying vec3 camPos;
  varying vec3 eyeVector;
  varying vec3 vNormal;

  float Fresnel(vec3 eyeVector, vec3 worldNormal) {
    return pow( 1.0 + dot( eyeVector, worldNormal), 1.80 );
  }

  void main() {
    vec2 uv = gl_FragCoord.xy/resolution.xy ;
    vec4 temptex = texture2D( cardtemplate, vUv);
    vec4 skulltex = texture2D( skullrender, uv - 0.5 );
    gl_FragColor = temptex;
    float f = Fresnel(eyeVector, vNormal);
    vec4 noisetex = texture2D( noise, mod(vUv*2.,1.));
    if(gl_FragColor.g >= .5 && gl_FragColor.r < 0.6){
      gl_FragColor = f + skulltex;
      gl_FragColor += noisetex/5.;
    } else {
      vec4 bactex = texture2D( backtexture, vUv);
      float tone = pow(dot(normalize(camPos), normalize(bactex.rgb)), 1.);
      vec4 colortex = texture2D( color, vec2(tone,0.));
      vec2 uv2 = vUv;
      float iTime = 1.*0.004;
      uv.y += iTime / 10.0;
      uv.x -= (sin(iTime/10.0)/2.0);
      uv2.y += iTime / 14.0;
      uv2.x += (sin(iTime/10.0)/9.0);
      float result = 0.0;
      result += texture2D(noiseTex, mod(uv*4.,1.) * 0.6 + vec2(iTime*-0.003)).r;
      result *= texture2D(noiseTex, mod(uv2*4.,1.) * 0.9 + vec2(iTime*+0.002)).b;
      result = pow(result, 10.0);
      gl_FragColor *= colortex;
      gl_FragColor += vec4(sin((tone + vUv.x + vUv.y/10.)*10.))/8.;
    }
    gl_FragColor.a = temptex.a;
  }
`;

const fragPlaneback = `
  varying vec2 vUv;
  uniform sampler2D skullrender;
  uniform sampler2D cardtemplate;
  uniform sampler2D backtexture;
  uniform sampler2D noiseTex;
  uniform sampler2D color;
  uniform sampler2D noise;
  uniform vec4 resolution;
  varying vec3 camPos;
  varying vec3 eyeVector;
  varying vec3 vNormal;

  float Fresnel(vec3 eyeVector, vec3 worldNormal) {
    return pow( 1.0 + dot( eyeVector, worldNormal), 1.80 );
  }

  void main() {
    vec2 uv = gl_FragCoord.xy/resolution.xy ;
    vec4 temptex = texture2D( cardtemplate, vUv);
    vec4 skulltex = texture2D( skullrender, vUv );
    gl_FragColor = temptex;
    vec4 noisetex = texture2D( noise, mod(vUv*2.,1.));
    float f = Fresnel(eyeVector, vNormal);
    vec2 uv2 = vUv;
    float iTime = 1.*0.004;
    uv.y += iTime / 10.0;
    uv.x -= (sin(iTime/10.0)/2.0);
    uv2.y += iTime / 14.0;
    uv2.x += (sin(iTime/10.0)/9.0);
    float result = 0.0;
    result += texture2D(noiseTex, mod(uv*4.,1.) * 0.6 + vec2(iTime*-0.003)).r;
    result *= texture2D(noiseTex, mod(uv2*4.,1.) * 0.9 + vec2(iTime*+0.002)).b;
    result = pow(result, 10.0);
    vec4 bactex = texture2D( backtexture, vUv);
    float tone = pow(dot(normalize(camPos), normalize(bactex.rgb)), 1.);
    vec4 colortex = texture2D( color, vec2(tone,0.));
    if(gl_FragColor.g >= .5 && gl_FragColor.r < 0.6){
      float tone = pow(dot(normalize(camPos), normalize(skulltex.rgb)), 1.);
      vec4 colortex2 = texture2D( color, vec2(tone,0.));
      if(skulltex.a > 0.2){
        gl_FragColor = colortex;
      } else {
        gl_FragColor = vec4(0.) + f;
        gl_FragColor += noisetex/5.;
      }
      gl_FragColor += noisetex/5.;
    } else {
      gl_FragColor *= colortex;
      gl_FragColor += vec4(sin((tone + vUv.x + vUv.y/10.)*10.))/8.;
    }
  }
`;

const vertskull = `
  varying vec3 vNormal;
  varying vec3 camPos;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 eyeVector;

  void main() {
    vNormal = normal;
    vUv = uv;
    camPos = cameraPosition;
    vPosition = position;
    vec4 worldPosition = modelViewMatrix * vec4( position, 1.0);
    eyeVector = normalize(worldPosition.xyz - cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const fragskull = `
  #define NUM_OCTAVES 5
  uniform vec4 resolution;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float time;
  varying vec3 camPos;
  varying vec2 vUv;
  uniform vec3 color1;
  uniform vec3 color0;
  varying vec3 eyeVector;
  
  float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }

  float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    float res = mix(
      mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
      mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
  }

  float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
      v += a * noise(x);
      x = rot * x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  float setOpacity(float r, float g, float b) {
    float tone = (r + g + b) / 3.0;
    float alpha = 1.0;
    if(tone<0.69) {
      alpha = 0.0;
    }
    return alpha;
  }

  vec3 rgbcol(float r, float g, float b) {
    return vec3(r/255.0,g/255.0,b/255.0);
  }

  float Fresnel(vec3 eyeVector, vec3 worldNormal) {
    return pow( 1.0 + dot( eyeVector, worldNormal), 3.0 );
  }
     
  void main() {
    vec2 olduv = gl_FragCoord.xy/resolution.xy ;
    float f = Fresnel(eyeVector, vNormal);
    float gradient2 = (f)*(.3 - vPosition.y) ;
    float scale = 8.;
    olduv.y = olduv.y - time;
    vec2 p = olduv*scale;
    float noise = fbm( p + time );
    vec2 uv = gl_FragCoord.xy/resolution.xy ; 
    vec3 newCam = vec3(0.,5.,10.);
    float gradient = dot(.0 -  normalize( newCam ), normalize( vNormal )) ;
    vec3 viewDirectionW = normalize(camPos - vPosition);
    float fresnelTerm = dot(viewDirectionW, vNormal);  
    fresnelTerm = clamp( 1. - fresnelTerm, 0., 1.) ;
    vec3 color = vec3(noise) + gradient;
    vec3 color2 = color - 0.2;
    float noisetone = setOpacity(color.r,color.g,color.b);
    float noisetone2 = setOpacity(color2.r,color2.g,color2.b);
    vec4 backColor = vec4(color, 1.);
    backColor.rgb = rgbcol(color0.r,color0.g,color0.b)*noisetone;
    vec4 frontColor = vec4(color2, 1.);
    frontColor.rgb = rgbcol(color1.r,color1.g,color1.b)*noisetone;
    if(noisetone2>0.0){
      gl_FragColor = frontColor;
    } else {
      gl_FragColor = backColor;
    }
  }
`;

interface Options {
  bloomStrength: number;
  bloomRadius: number;
  color0: [number, number, number];
  color1: [number, number, number];
  color2: [number, number, number];
}

const SkullCard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = 500; // Smaller size for footer
    const height = 500;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(30, width / height, 1, 10000);
    camera.position.z = 100;

    const cameraRTT = new THREE.PerspectiveCamera(30, width / height, 1, 10000);
    cameraRTT.position.z = 30;
    cameraRTT.position.y = -3.5;

    // Scene setup
    const scene = new THREE.Scene();
    const sceneRTT = new THREE.Scene();

    // Renderer setup with transparent background
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(2);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    containerRef.current.appendChild(renderer.domElement);

    // Composer setup
    const renderScene = new RenderPass(sceneRTT, cameraRTT);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.7,
      0.4,
      0.85,
    );
    const composer = new EffectComposer(renderer);
    composer.renderToScreen = false;
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Create planes
    const geometry = new THREE.PlaneGeometry(35, 45); // Smaller size for footer

    const frontmaterial = new THREE.ShaderMaterial({
      uniforms: {
        cardtemplate: { value: new THREE.TextureLoader().load(cardtemplate) },
        backtexture: { value: new THREE.TextureLoader().load(backtexture) },
        noise: { value: new THREE.TextureLoader().load(noise2) },
        skullrender: { value: composer.readBuffer.texture },
        resolution: { value: new THREE.Vector2(width, height) },
        noiseTex: { value: new THREE.TextureLoader().load(voronoi) },
        color: { value: new THREE.TextureLoader().load(color11) },
      },
      fragmentShader: fragPlane,
      vertexShader: vert,
      transparent: true,
      depthWrite: false,
    });

    const frontcard = new THREE.Mesh(geometry, frontmaterial);
    scene.add(frontcard);

    const backmaterial = new THREE.ShaderMaterial({
      uniforms: {
        cardtemplate: {
          value: new THREE.TextureLoader().load(cardtemplateback),
        },
        backtexture: { value: new THREE.TextureLoader().load(backtexture) },
        noise: { value: new THREE.TextureLoader().load(noise2) },
        skullrender: { value: new THREE.TextureLoader().load(flower) },
        resolution: { value: new THREE.Vector2(width, height) },
        noiseTex: { value: new THREE.TextureLoader().load(voronoi) },
        color: { value: new THREE.TextureLoader().load(color11) },
      },
      fragmentShader: fragPlaneback,
      vertexShader: vert,
      transparent: true,
      depthWrite: false,
    });

    const backcard = new THREE.Mesh(geometry, backmaterial);
    backcard.rotation.set(0, Math.PI, 0);
    scene.add(backcard);

    // Load skull
    const options: Options = {
      bloomStrength: 0.8,
      bloomRadius: 1.29,
      color0: [197, 81, 245],
      color1: [65, 0, 170],
      color2: [0, 150, 255],
    };

    const skullmaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color1: { value: new THREE.Vector3(...options.color1) },
        color0: { value: new THREE.Vector3(...options.color0) },
        resolution: { value: new THREE.Vector2(width, height) },
      },
      fragmentShader: fragskull,
      vertexShader: vertskull,
    });

    var spheregeo = new THREE.SphereGeometry(1.5, 32, 32);
    const basicmat = new THREE.MeshBasicMaterial();
    basicmat.color.setRGB(...options.color2);

    const eye = new THREE.Mesh(spheregeo, basicmat);
    const eye2 = new THREE.Mesh(spheregeo, basicmat);
    eye.position.set(-2.2, -2.2, -6.6);
    eye2.position.set(2.2, -2.2, -6.6);

    const modelgroup = new THREE.Group();
    modelgroup.add(eye);
    modelgroup.add(eye2);

    const objloader = new OBJLoader();
    objloader.load(skullmodel, (object) => {
      const mesh2 = object.clone();
      mesh2.position.set(0, 0, -10);
      mesh2.rotation.set(Math.PI, 0, Math.PI);

      mesh2.children.forEach((child) => {
        child.traverse((node: any) => {
          if (node.isMesh) {
            node.material = skullmaterial;
            node.geometry.computeVertexNormals();
          }
        });
      });
      mesh2.scale.set(9, 9, 9);
      modelgroup.add(mesh2);
      sceneRTT.add(modelgroup);
    });

    let time = 0;
    const clock = new THREE.Clock();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      time += delta;

      modelgroup.rotation.set(-camera.rotation.x, -camera.rotation.y, 0);

      bloomPass.strength = options.bloomStrength;
      bloomPass.radius = options.bloomRadius;

      if (skullmaterial) {
        skullmaterial.uniforms.time.value = time;
      }

      composer.render();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="skull-card-container" />;
};

export default SkullCard;
