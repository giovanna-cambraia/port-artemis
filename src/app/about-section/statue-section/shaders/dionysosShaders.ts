import * as THREE from "three";

export const dionysosVert = `
uniform float uProgress;
uniform float uTime;
uniform float uNoiseScale;
uniform float uDisplaceStrength;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vNormal = normalize(normalMatrix * normal);

  float noise = snoise(position * uNoiseScale + uTime * 0.15);
  vNoise = noise;

  float dissolveAmount = (1.0 - uProgress);
  vec3 displaced = position + normal * noise * uDisplaceStrength * dissolveAmount;
  displaced += normal * dissolveAmount * dissolveAmount * (noise * 0.5) * 1.5;

  vPosition = displaced;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const dionysosFrag = `
uniform float uProgress;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uCameraPos;
uniform vec3 uLightDir;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;

void main() {
  vec3 viewDir = normalize(uCameraPos - vPosition);
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

  // ── MUCH TIGHTER CUTOFF — mostly solid at rest ──────────────
  float cutoff = mix(-1.4, -0.75, uProgress);
  if (vNoise < cutoff) discard;

  float edgeGlow = smoothstep(cutoff, cutoff + 0.08, vNoise);
  edgeGlow = 1.0 - edgeGlow;

  // ── DIFFUSE LIGHTING ──────────────────────────────────────────
  float diffuse = max(dot(vNormal, normalize(uLightDir)), 0.0);
  diffuse = diffuse * 0.75 + 0.25;

  // ── MARBLE PALETTE: near-black void → warm marble-white ─────
  vec3 baseColor = mix(uColorA, uColorB, fresnel) * diffuse;

  // ── RED ACCENT ONLY AT EROSION EDGE ──────────────────────────
  vec3 accentGlow = vec3(0.88, 0.19, 0.19) * edgeGlow * 1.2;

 vec3 finalColor = baseColor;

  float alpha = mix(0.9, 1.0, uProgress);
  gl_FragColor = vec4(finalColor, alpha);
}
`;

export const uniforms = {
  uProgress: { value: 0 },
  uTime: { value: 0 },
  uNoiseScale: { value: 1.6 },
  uDisplaceStrength: { value: 0.04 },
  uColorA: { value: new THREE.Color(0x050505) },
  uColorB: { value: new THREE.Color(0xf4f2ee) },
  uCameraPos: { value: new THREE.Vector3() },
  uLightDir: { value: new THREE.Vector3(3, 5, 2).normalize() },
};
