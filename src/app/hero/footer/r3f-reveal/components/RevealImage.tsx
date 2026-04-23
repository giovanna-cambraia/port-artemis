import { shaderMaterial, useAspect, useTexture } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const ImageRevealMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uTime: 0,
    uProgress: 0,
    uImageRes: new THREE.Vector2(1.0, 1.0),
    uRes: new THREE.Vector2(1.0, 1.0),
  },
  // vertex
  `uniform float uProgress;
   varying vec2 vUv;
   void main() {
     vec3 newPosition = position;
     float distanceToCenter = distance(vec2(0.5), uv);
     float wave = (1.0 - uProgress) * sin(distanceToCenter * 20.0 - uProgress * 5.0);
     newPosition.z += wave;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
     vUv = uv;
   }`,
  // fragment — inlined, no #include
  `uniform sampler2D uTexture;
   uniform float uTime;
   uniform float uProgress;
   uniform vec2 uRes;
   uniform vec2 uImageRes;
   varying vec2 vUv;

   vec2 CoverUV(vec2 u, vec2 s, vec2 i) {
     float rs = s.x / s.y;
     float ri = i.x / i.y;
     vec2 st = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
     vec2 o = (rs < ri ? vec2((st.x - s.x) / 2.0, 0.0) : vec2(0.0, (st.y - s.y) / 2.0)) / st;
     return u * s / st + o;
   }

   vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
   vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
   vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }
   float cnoise(vec3 P) {
     vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
     Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
     vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
     vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
     vec4 iy = vec4(Pi0.yy, Pi1.yy);
     vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
     vec4 ixy = permute(permute(ix) + iy);
     vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
     vec4 gx0 = ixy0 / 7.0; vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
     gx0 = fract(gx0); vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
     vec4 sz0 = step(gz0, vec4(0.0));
     gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);
     vec4 gx1 = ixy1 / 7.0; vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
     gx1 = fract(gx1); vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
     vec4 sz1 = step(gz1, vec4(0.0));
     gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);
     vec3 g000 = vec3(gx0.x,gy0.x,gz0.x); vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
     vec3 g010 = vec3(gx0.z,gy0.z,gz0.z); vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
     vec3 g001 = vec3(gx1.x,gy1.x,gz1.x); vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
     vec3 g011 = vec3(gx1.z,gy1.z,gz1.z); vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
     vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
     g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
     vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
     g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
     float n000 = dot(g000,Pf0); float n100 = dot(g100,vec3(Pf1.x,Pf0.yz));
     float n010 = dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)); float n110 = dot(g110,vec3(Pf1.xy,Pf0.z));
     float n001 = dot(g001,vec3(Pf0.xy,Pf1.z)); float n101 = dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
     float n011 = dot(g011,vec3(Pf0.x,Pf1.yz)); float n111 = dot(g111,Pf1);
     vec3 fade_xyz = fade(Pf0);
     vec4 n_z = mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
     vec2 n_yz = mix(n_z.xy,n_z.zw,fade_xyz.y);
     float n_xyz = mix(n_yz.x,n_yz.y,fade_xyz.x);
     return 2.2 * n_xyz;
   }

   void main() {
     vec2 newUv = CoverUV(vUv, uRes, uImageRes);
     vec2 displacedUv = vUv + cnoise(vec3(vUv * 5.0, uTime * 0.1));
     float strength = cnoise(vec3(displacedUv * 5.0, uTime * 0.2));
     float radialGradient = distance(vUv, vec2(0.5)) * 12.5 - 7.0 * uProgress;
     strength += radialGradient;
     strength = clamp(strength, 0.0, 1.0);
     strength = 1.0 - strength;
     vec3 textureColor = texture2D(uTexture, newUv).rgb;
     float opacityProgress = smoothstep(0.0, 0.7, uProgress);
     gl_FragColor = vec4(textureColor, strength * opacityProgress);
   }`,
  (self) => { if (self) self.transparent = true; }
);

extend({ ImageRevealMaterial });

const RevealImage = ({ imageTexture, revealProgress, isFullScreen = false }) => {
  const materialRef = useRef<any>();
  const texture = useTexture(imageTexture);
  const { width, height } = texture.image as HTMLImageElement;
  const scale = useAspect(width, height, 0.7);
  const { viewport } = useThree();

  useEffect(() => {
    if (materialRef.current && texture) {
      materialRef.current.uniforms.uTexture.value = texture;  
      materialRef.current.uniforms.uImageRes.value.set(width, height);
    }
  }, [texture, width, height]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uRes.value.set(
        isFullScreen ? viewport.width : scale[0],
        isFullScreen ? viewport.height : scale[1]
      );
    }
  }, [isFullScreen, scale, viewport.width, viewport.height]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = revealProgress.get();
    }
  });

  const finalScale: [number, number, number] = isFullScreen
    ? [viewport.width, viewport.height, 1]
    : [scale[0], scale[1], 1];

  return (
    <mesh scale={finalScale}>
      <planeGeometry args={[1, 1, 32, 32]} />
      {/* @ts-ignore */}
      <imageRevealMaterial attach="material" ref={materialRef} transparent />
    </mesh>
  );
};

export default RevealImage;