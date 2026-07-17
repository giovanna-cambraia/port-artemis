import * as THREE from "three";

export const dionysosVert = `
uniform float uProgress;
uniform float uTime;
uniform float uNoiseScale;
uniform float uDisplaceStrength;
uniform float uBreakStart;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;
varying float vBreak;
varying float vGlitchLine;

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

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

void main() {
  vNormal = normalize(normalMatrix * normal);

  float noise = snoise(position * uNoiseScale + uTime * 0.15);
  vNoise = noise;

  float breakAmount = smoothstep(uBreakStart, 1.0, uProgress);
  vBreak = breakAmount;

  // ── DIGITAL CORRUPTION: quantize into horizontal "scan bands" that jitter ──
  float band = floor(position.y * 14.0); // slice the model into horizontal bands
  float bandGlitch = hash(vec3(band, floor(uTime * 6.0), 0.0)); // re-rolls ~6x/sec
  float glitchActive = step(0.7, bandGlitch) * breakAmount; // only some bands glitch, only near break
  vGlitchLine = glitchActive;

  // ONLY the rigid band jitter remains — no normal-based organic displacement
  vec3 displaced = position;
  displaced.x += glitchActive * (hash(vec3(band, floor(uTime * 20.0), 1.0)) - 0.5) * 0.4;
  displaced.z += glitchActive * (hash(vec3(band, floor(uTime * 20.0), 2.0)) - 0.5) * 0.3;

  // Removed: normal * noise * uDisplaceStrength * breakAmount * 1.5
  // Removed: normal * breakAmount * breakAmount * (noise * 0.5) * 1.2
  // Those lines were the "melting/eroding" silhouette warp

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
uniform vec3 uAccentColor;
uniform vec3 uCameraPos;
uniform vec3 uLightDir;
uniform sampler2D uCharTex;
uniform float uCharCount;
uniform vec2 uResolution;
uniform float uBaseCellSize;
uniform float uCameraDist;
uniform float uAsciiStart;
uniform float uAsciiFull;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;
varying float vBreak;
varying float vGlitchLine;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec3 viewDir = normalize(uCameraPos - vPosition);

  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 5.0);
  float diffuse = max(dot(vNormal, normalize(uLightDir)), 0.0);
  float redHighlight = pow(diffuse, 6.0);
  vec3 lit = uAccentColor * redHighlight * 0.9;

  vec3 baseColor = uColorA + lit + uColorB * fresnel * 0.8;

  // ── ASCII CONTOUR RENDER ──
  float coverageFloor = 0.15;
  float contourLuminance = clamp(fresnel * 1.8 + redHighlight * 1.3 + coverageFloor, 0.0, 1.0);
  contourLuminance = pow(contourLuminance, 0.6);

  float distScale = uCameraDist / 6.5;
  float cellSize = uBaseCellSize * clamp(distScale, 0.6, 2.2);

  vec2 pixelCoord = gl_FragCoord.xy;
  float charIndex = floor(contourLuminance * (uCharCount - 1.0));

  vec2 withinCell = mod(pixelCoord, cellSize) / cellSize;
  withinCell.y = 1.0 - withinCell.y;
  vec2 charUv = vec2((charIndex + withinCell.x) / uCharCount, withinCell.y);
  float glyph = texture2D(uCharTex, charUv).r;

  float asciiAmount = smoothstep(uAsciiStart, uAsciiFull, uProgress);

  vec3 asciiColor = mix(baseColor * 0.15, uColorB * 0.9 + baseColor, glyph);
  vec3 colorWithAscii = mix(baseColor, asciiColor, asciiAmount);

  // ── ORGANIC EROSION ──
  float breakCutoff = mix(-2.0, -0.3, vBreak);
  bool erosionDiscard = vBreak > 0.0 && vNoise < breakCutoff;

  // ── DIGITAL CORRUPTION (unchanged, still layers on at the end) ──
  float blockNoise = hash2(vec2(floor(vPosition.y * 14.0), floor(uTime * 8.0)));
  bool blockDiscard = vGlitchLine > 0.5 && blockNoise > 0.6;

  if (erosionDiscard || blockDiscard) discard;

  vec3 finalColor = colorWithAscii;
  if (vGlitchLine > 0.5) {
    finalColor.r = colorWithAscii.r * 1.4;
    finalColor.g *= 0.6;
    finalColor.b *= 0.7;
    float flicker = step(0.85, hash2(vec2(floor(vPosition.y * 14.0), floor(uTime * 12.0))));
    finalColor = mix(finalColor, uColorB, flicker * 0.6);
  }

  float fractureEdge = 1.0 - smoothstep(breakCutoff, breakCutoff + 0.1, vNoise);
  finalColor += uAccentColor * fractureEdge * vBreak * 1.2;

  float alpha = mix(1.0, 0.8, vBreak);
  gl_FragColor = vec4(finalColor, alpha);
}
`;

export function createAsciiAtlas(
  chars: string[] = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"],
  fontSize = 64,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = fontSize * chars.length;
  canvas.height = fontSize;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = `bold ${fontSize * 0.85}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  chars.forEach((c, i) =>
    ctx.fillText(c, fontSize * (i + 0.5), fontSize * 0.54),
  );
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export const uniforms = {
  uProgress: { value: 0 },
  uTime: { value: 0 },
  uNoiseScale: { value: 1.6 },
  uDisplaceStrength: { value: 0.05 },
  uBreakStart: { value: 0.78 },
  uColorA: { value: new THREE.Color(0x030303) },
  uColorB: { value: new THREE.Color(0xf5f0e8) },
  uAccentColor: { value: new THREE.Color(0xb33030) },
  uCameraPos: { value: new THREE.Vector3() },
  uLightDir: { value: new THREE.Vector3(3, 5, 2).normalize() },
  uCharTex: { value: null as THREE.Texture | null },
  uCharCount: { value: 10 },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uBaseCellSize: { value: 7.0 },
  uCameraDist: { value: 6.5 },
  uAsciiStart: { value: 0.15 },
  uAsciiFull: { value: 0.55 },
};