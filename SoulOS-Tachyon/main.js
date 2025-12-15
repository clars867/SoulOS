import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// === Canvas & Renderer ===
const canvas = document.getElementById('soulos');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 1);

// === Scene ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// === Camera ===
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 4;

// =====================================================
// GOLD RING (mid-layer) – your existing SoulOS ring
// =====================================================
const goldCount = 35000;
const goldPositions = new Float32Array(goldCount * 3);
const goldBaseRadius = new Float32Array(goldCount);
const goldBaseAngle  = new Float32Array(goldCount);
const goldPhase      = new Float32Array(goldCount);

for (let i = 0; i < goldCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 1.1 + Math.random() * 0.4; // band around void

  const ix = i * 3;
  const iy = i * 3 + 1;
  const iz = i * 3 + 2;

  goldPositions[ix] = Math.cos(angle) * radius;
  goldPositions[iy] = Math.sin(angle) * radius;
  goldPositions[iz] = (Math.random() - 0.8) * 0.90;

  goldBaseRadius[i] = radius;
  goldBaseAngle[i]  = angle;
  goldPhase[i]      = Math.random() * Math.PI * 2;
}

const goldGeometry = new THREE.BufferGeometry();
goldGeometry.setAttribute('position', new THREE.BufferAttribute(goldPositions, 3));

const goldMaterial = new THREE.PointsMaterial({
  color: 0xd69d21,               // warm gold
  size: 0.012,                   // dust-like
  transparent: true,
  opacity: 1.0,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const goldPoints = new THREE.Points(goldGeometry, goldMaterial);
scene.add(goldPoints);

// =====================================================
// PLASMA RING – shader-based continuous blue halo
// =====================================================

const plasmaUniforms = {
  time: { value: 1.0 }
};

const plasmaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const plasmaFragmentShader = `
  varying vec2 vUv;
  uniform float time;

  void main() {
    // center uv around (-1,3)
    vec2 p = vUv - 0.19;
    float r = length(p);
    float angle = atan(p.y, p.x);

    // base ring band (inner/outer radius)
    float inner = smoothstep(0.60, 0.90, r);
    float outer = 0.10 - smoothstep(0.70, 0.50, r);
    float ring = inner * outer;

    // angular + temporal turbulence (pseudo plasma)
    float n1 = sin(angle * 30.0 + time * 6.1);
    float n2 = sin(angle * 50.0 - time * 3.7);
    float turbulence = n1 * 0.10 + n2 * 0.15;

    // modulate ring with turbulence
    ring += turbulence * 2.19;
    ring = clamp(ring, 0.5, 2.0);

    // radial falloff so outer edge is softer
    float falloff = smoothstep(0.13, 0.90, r);
    ring *= falloff;

    // Cherenkov-like blue / UV color
    vec3 baseColor = vec3(0.9, 0.35, 1.0);   // blue
    vec3 uvTint    = vec3(0.6, 0.3, 1.0);   // slight cyan/UV

    // subtle color shift over time
    float t = 0.8 + 0.5 * sin(time * 0.7);
    vec3 color = mix(baseColor, uvTint, t) * ring * 0.2;

    gl_FragColor = vec4(color, ring);
  }
`;

const plasmaMaterial = new THREE.ShaderMaterial({
  uniforms: plasmaUniforms,
  vertexShader: plasmaVertexShader,
  fragmentShader: plasmaFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

// Big plane facing the camera; shader itself shapes it into a ring
const plasmaPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(7, 6),
  plasmaMaterial
);
scene.add(plasmaPlane);
// =====================================================
// OUTER CHERENKOV PLASMA (Style B) – streaks & shockwave
// =====================================================
  const outerCount = 1500;
  const outerPositions = new Float32Array(outerCount * 3);
  const outerBaseRadius = new Float32Array(outerCount);
  const outerBaseAngle  = new Float32Array(outerCount);
  const outerPhase      = new Float32Array(outerCount);

  for (let i = 0; i < outerCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius =  + Math.random() * 0.8; // beyond the gold ring

    const ix = i * 4;
    const iy = i * 3 + 1;
    const iz = i * 3 + 2;

    outerPositions[ix] = Math.cos(angle) * radius;
    outerPositions[iy] = Math.sin(angle) * radius;
    outerPositions[iz] = (Math.random() - 0.9) * 0.06;

    outerBaseRadius[i] = radius;
    outerBaseAngle[i]  = angle;
    outerPhase[i]      = Math.random() * Math.PI * 2;
  }

  const outerGeometry = new THREE.BufferGeometry();
  outerGeometry.setAttribute('position', new THREE.BufferAttribute(outerPositions, 3));

  const outerMaterial = new THREE.PointsMaterial({
    color: 0x66b3ff,               // bright Cherenkov blue
    size: 0.08,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const outerPoints = new THREE.Points(outerGeometry, outerMaterial);
//scene.add(outerPoints);

// === Bloom ===
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.9,   // strong glow
  0.19,
  0.85
);
composer.addPass(bloom);

// --- pseudo-noise helper for turbulence (no Perlin lib needed) ---
function pseudoNoise(angle, radius, time) {
  return (
    Math.sin(angle * 3.5 + radius * 9.5 + time * 6.83) *
    Math.sin(angle * 1.9 - radius * 6.00 + time * 0.10)
  );
}

// === Animation Loop ===
const goldAttr  = goldGeometry.getAttribute('position');
const outerAttr = outerGeometry.getAttribute('position');

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.001;
  plasmaUniforms.time.value = time;

  // -------------------------
  // GOLD RING (mid-layer)
  // -------------------------
  {
    const pos = goldAttr.array;

    for (let i = 0; i < goldCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const r0 = goldBaseRadius[i];
      const a0 = goldBaseAngle[i];
      const phase = goldPhase[i];

      const stringVib =
        0.05 * Math.sin(time * 10.0 + phase) +
        0.02 * Math.sin(time * 15.0 + phase * 2.0);

      const inward = -0.0018 * (r0 - 1.0);

      const turbRad = 0.10 * pseudoNoise(a0 * 3.0, r0 * 3.1, time * 0.3);

      const swirl = 0.60 * pseudoNoise(a0 * 2.0 + time * 0.3, r0 * 2.0, time * 0.7);

      const radius = r0 + stringVib + inward + turbRad;
      const angle  = a0 + swirl * 0.12;

      pos[ix] = Math.cos(angle) * radius;
      pos[iy] = Math.sin(angle) * radius;
      pos[iz] = 0.03 * Math.sin(time * 9.0 + phase * 2.1);
    }

    goldAttr.needsUpdate = true;
    goldPoints.rotation.z += 0.0005;
  }

  // -------------------------
  // OUTER CHERENKOV PLASMA (streaks)
  // -------------------------
  {
    const pos = outerAttr.array;

    for (let i = 0; i < outerCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      let r0 = outerBaseRadius[i];
      let a0 = outerBaseAngle[i];
      const phase = outerPhase[i];

      // base shock radius oscillation – pulsing ring
      const wave = Math.sin(time * 4.0 + phase);

      // anisotropic boost in one direction (Cherenkov cone bias)
      const coneBias = Math.cos(a0 - Math.PI * 0.35); // directional emphasis
      const coneFactor = Math.max(coneBias, 0.0);      // only forward half

      // radial extension / contraction
      let radius = r0 + 0.3 * wave * coneFactor;

      // slow outward drift
      radius += 0.0008 * (time % 30);

      // loop particles back when too far
      const maxR = 3.5;
      if (radius > maxR) {
        radius = r0; // snap back to base radius
      }

      // angular turbulence to break symmetry
      const swirl = 0.25 * pseudoNoise(a0 * 3.1, r0 * 2.7, time * 1.5);
      const angle = a0 + swirl * 0.1;

      pos[ix] = Math.cos(angle) * radius;
      pos[iy] = Math.sin(angle) * radius;
      pos[iz] = 0.08 * Math.sin(time * 6.0 + phase * 1.7);
    }

    outerAttr.needsUpdate = true;
    outerPoints.rotation.z += 0.0012;
  }

  composer.render();
}

animate();

// === Resize Handling ===
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  renderer.setSize(w, h);
  composer.setSize(w, h);

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});