import * as THREE from 'three';

/* ---------------------------------------------------------------
   POST WESTPHALIA — voxel solarpunk Earth
   Chunky low-poly block globe assembled from cubes, colored by
   biome (forest, water, sand, city, garden, energy infra).
   Structured so a later version can attach selectable "sites"
   to specific block coordinates (see SITE_SLOTS below).
---------------------------------------------------------------- */

const container = document.getElementById('globe-container');
const loader = document.getElementById('loader');

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.6, 8.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// Detect low-power / no-WebGL devices for a lightweight fallback
let webglOK = true;
try {
  const testCanvas = document.createElement('canvas');
  webglOK = !!(testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'));
} catch (e) { webglOK = false; }

const isSmallDevice = window.innerWidth < 560;

// --------------------------- Lighting ---------------------------

const ambientLight = new THREE.AmbientLight(0xfff1d6, 0.55);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xfff3d0, 2.1);
sun.position.set(6, 4.5, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 20;
sun.shadow.camera.left = -4;
sun.shadow.camera.right = 4;
sun.shadow.camera.top = 4;
sun.shadow.camera.bottom = -4;
sun.shadow.bias = -0.001;
scene.add(sun);

const rim = new THREE.DirectionalLight(0x9fd6e6, 0.35);
rim.position.set(-6, -2, -4);
scene.add(rim);

// soft warm fill from below for that golden solarpunk glow
const fill = new THREE.PointLight(0xf7c873, 0.6, 20, 2);
fill.position.set(-3, -3, 3);
scene.add(fill);

// --------------------------- Palette ---------------------------

const PALETTE = {
  deepWater: 0x2f7d8a,
  water: 0x4fa9b8,
  shallowWater: 0x7fcdd4,
  forestDark: 0x1f3d2c,
  forest: 0x2f5240,
  forestLight: 0x4a7a52,
  sand: 0xe7d3a1,
  snow: 0xf7f3ea,
  city: 0xf5f0e3,
  cityRoof: 0xc9a24b,
  garden: 0x6fae5e,
  energy: 0xdfeaea,
};

function colorVariant(hex, amount) {
  const c = new THREE.Color(hex);
  const h = { h: 0, s: 0, l: 0 };
  c.getHSL(h);
  c.setHSL(h.h, h.s, Math.max(0, Math.min(1, h.l + amount)));
  return c;
}

// --------------------------- Globe assembly ---------------------------

const GLOBE_GROUP = new THREE.Group();
GLOBE_GROUP.name = 'earthVoxelGlobe';
scene.add(GLOBE_GROUP);

const RADIUS = 2.15;
// Fibonacci sphere distribution for even-ish voxel coverage
const VOXEL_COUNT = isSmallDevice ? 900 : 1500;

// simple deterministic pseudo-noise for biome placement (no external deps)
function hashNoise(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

function fbmLike(x, y, z) {
  let v = 0;
  v += hashNoise(x * 1.0, y * 1.0, z * 1.0) * 0.5;
  v += hashNoise(x * 2.13, y * 2.13, z * 2.13) * 0.3;
  v += hashNoise(x * 4.7, y * 4.7, z * 4.7) * 0.2;
  return v;
}

// Continent mask via layered noise + latitude bands (icecaps)
function classifyBiome(dir) {
  const n = fbmLike(dir.x * 1.6, dir.y * 1.6, dir.z * 1.6);
  const lat = Math.abs(dir.y); // 0 equator -> 1 poles

  if (lat > 0.86) return 'snow';

  const landThreshold = 0.5 - lat * 0.12;
  if (n < landThreshold) {
    // ocean
    const depth = (landThreshold - n) / landThreshold;
    if (depth < 0.18) return 'shallowWater';
    if (depth < 0.55) return 'water';
    return 'deepWater';
  }

  // land - decide sub biome
  const n2 = fbmLike(dir.x * 5.3 + 11, dir.y * 5.3 + 11, dir.z * 5.3 + 11);
  const coastal = n - landThreshold < 0.05;
  if (coastal && n2 > 0.7) return 'sand';
  if (n2 > 0.93) return 'city';
  if (n2 > 0.85) return 'garden';
  if (n2 > 0.8) return 'energy';
  if (n2 > 0.4) return 'forest';
  return 'forestLight';
}

const biomeColor = {
  deepWater: PALETTE.deepWater,
  water: PALETTE.water,
  shallowWater: PALETTE.shallowWater,
  snow: PALETTE.snow,
  sand: PALETTE.sand,
  city: PALETTE.city,
  garden: PALETTE.garden,
  energy: PALETTE.energy,
  forest: PALETTE.forest,
  forestLight: PALETTE.forestLight,
};

const biomeHeight = {
  deepWater: 0.0,
  water: 0.01,
  shallowWater: 0.015,
  snow: 0.05,
  sand: 0.03,
  city: 0.09,
  garden: 0.06,
  energy: 0.08,
  forest: 0.08,
  forestLight: 0.06,
};

// Base geometry for a single voxel block (chunky rounded-ish cube via BoxGeometry, kept low-poly)
const voxelSize = 0.19;
const boxGeo = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

// group blocks by material category for instancing (performance)
const categories = Object.keys(biomeColor);
const instancedMeshes = {};
const dummy = new THREE.Object3D();

// Count how many voxels per category first
const goldenAngle = Math.PI * (3 - Math.sqrt(5));
const voxelData = [];

for (let i = 0; i < VOXEL_COUNT; i++) {
  const t = i / (VOXEL_COUNT - 1);
  const yv = 1 - t * 2; // -1..1
  const radiusAtY = Math.sqrt(1 - yv * yv);
  const theta = goldenAngle * i;
  const xv = Math.cos(theta) * radiusAtY;
  const zv = Math.sin(theta) * radiusAtY;
  const dir = new THREE.Vector3(xv, yv, zv).normalize();
  const biome = classifyBiome(dir);
  voxelData.push({ dir, biome });
}

// count per category
const countPerCat = {};
categories.forEach(c => countPerCat[c] = 0);
voxelData.forEach(v => countPerCat[v.biome]++);

categories.forEach(cat => {
  const count = countPerCat[cat] || 0;
  if (count === 0) return;
  const mat = new THREE.MeshStandardMaterial({
    color: biomeColor[cat],
    roughness: cat === 'city' || cat === 'energy' ? 0.35 : 0.85,
    metalness: cat === 'energy' ? 0.25 : 0.02,
    flatShading: true,
  });
  const mesh = new THREE.InstancedMesh(boxGeo, mat, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'voxelCategory_' + cat;
  GLOBE_GROUP.add(mesh);
  instancedMeshes[cat] = { mesh, index: 0 };
});

const upVec = new THREE.Vector3(0, 1, 0);
const siteAnchors = []; // for future selectable village sites

voxelData.forEach((v, i) => {
  const { dir, biome } = v;
  const height = biomeHeight[biome];
  const dist = RADIUS + height;
  const pos = dir.clone().multiplyScalar(dist);

  dummy.position.copy(pos);
  // orient block so local Y faces outward (gives that chunky planet-facet look)
  const quat = new THREE.Quaternion().setFromUnitVectors(upVec, dir);
  dummy.quaternion.copy(quat);
  // slight randomized scale for hand-crafted irregularity
  const jitter = 0.82 + hashNoise(dir.x * 50, dir.y * 50, dir.z * 50) * 0.5;
  const heightScale = 1 + height * 3.2;
  dummy.scale.set(jitter, jitter * heightScale, jitter);
  dummy.updateMatrix();

  const cat = instancedMeshes[biome];
  cat.mesh.setMatrixAt(cat.index, dummy.matrix);
  // subtle per-instance color variance
  if (cat.mesh.instanceColor === null) {
    cat.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cat.mesh.count * 3), 3);
  }
  const variance = (hashNoise(dir.x * 7, dir.y * 7, dir.z * 7) - 0.5) * 0.08;
  const c = colorVariant(biomeColor[biome], variance);
  cat.mesh.setColorAt(cat.index, c);

  if ((biome === 'city' || biome === 'energy') && hashNoise(dir.x * 99, dir.y * 99, dir.z * 99) > 0.965) {
    siteAnchors.push({ position: pos.clone(), direction: dir.clone(), biome });
  }

  cat.index++;
});

Object.values(instancedMeshes).forEach(({ mesh }) => {
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
});

// expose site anchors globally for a future feature (selectable villages)
window.POST_WESTPHALIA_SITE_ANCHORS = siteAnchors;

// --------------------------- Tiny city lights (emissive points) ---------------------------

const lightPositions = [];
voxelData.forEach((v) => {
  if ((v.biome === 'city' || v.biome === 'energy') && Math.random() > 0.4) {
    const dist = RADIUS + biomeHeight[v.biome] + 0.14;
    lightPositions.push(v.dir.clone().multiplyScalar(dist));
  }
});

const lightsGeo = new THREE.BufferGeometry();
const lightsArr = new Float32Array(lightPositions.length * 3);
lightPositions.forEach((p, i) => {
  lightsArr[i * 3] = p.x;
  lightsArr[i * 3 + 1] = p.y;
  lightsArr[i * 3 + 2] = p.z;
});
lightsGeo.setAttribute('position', new THREE.BufferAttribute(lightsArr, 3));
const lightsMat = new THREE.PointsMaterial({
  color: 0xffe9b0,
  size: 0.035,
  transparent: true,
  opacity: 0.9,
  sizeAttenuation: true,
  depthWrite: false,
});
const cityLights = new THREE.Points(lightsGeo, lightsMat);
cityLights.name = 'cityLights';
GLOBE_GROUP.add(cityLights);

// --------------------------- Atmosphere glow ---------------------------

const atmosphereGeometry = new THREE.SphereGeometry(RADIUS * 1.12, 48, 48);
const atmosphereMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.66 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
      vec3 atmosphereColor = vec3(0.68, 0.85, 0.78);
      gl_FragColor = vec4(atmosphereColor, 1.0) * intensity;
    }
  `,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  transparent: true,
  depthWrite: false,
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
atmosphere.name = 'atmosphereGlow';
scene.add(atmosphere);

// --------------------------- Drifting clouds (low-poly puffs) ---------------------------

const cloudGroup = new THREE.Group();
cloudGroup.name = 'cloudLayer';
scene.add(cloudGroup);

const cloudMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1,
  transparent: true,
  opacity: 0.55,
  flatShading: true,
  depthWrite: false,
});

const CLOUD_COUNT = isSmallDevice ? 26 : 46;
const cloudMeshes = [];
for (let i = 0; i < CLOUD_COUNT; i++) {
  const puffCount = 2 + Math.floor(Math.random() * 3);
  const cloudCluster = new THREE.Group();
  for (let p = 0; p < puffCount; p++) {
    const s = 0.09 + Math.random() * 0.1;
    const geo = new THREE.IcosahedronGeometry(s, 0);
    const puff = new THREE.Mesh(geo, cloudMat);
    puff.position.set((Math.random() - 0.5) * 0.22, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.22);
    cloudCluster.add(puff);
  }
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(1 - 2 * Math.random() * 0.85 - 0.075);
  const dist = RADIUS * 1.09;
  cloudCluster.position.set(
    dist * Math.sin(phi) * Math.cos(theta),
    dist * Math.cos(phi),
    dist * Math.sin(phi) * Math.sin(theta)
  );
  cloudCluster.lookAt(0, 0, 0);
  cloudCluster.userData.baseTheta = theta;
  cloudCluster.userData.phi = phi;
  cloudCluster.userData.speed = 0.02 + Math.random() * 0.03;
  cloudCluster.userData.dist = dist;
  cloudCluster.name = 'cloudCluster_' + i;
  cloudGroup.add(cloudCluster);
  cloudMeshes.push(cloudCluster);
}

// --------------------------- Birds (tiny animated V shapes) ---------------------------

const birdGroup = new THREE.Group();
birdGroup.name = 'birds';
scene.add(birdGroup);

const BIRD_COUNT = isSmallDevice ? 4 : 8;
const birds = [];
for (let i = 0; i < BIRD_COUNT; i++) {
  const bird = new THREE.Group();
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.045, 0, 0),
      new THREE.Vector3(0, 0.018, 0),
      new THREE.Vector3(0.045, 0, 0),
    ]),
    new THREE.LineBasicMaterial({ color: 0x2f3d33, transparent: true, opacity: 0.55 })
  );
  bird.add(line);
  bird.userData.orbitRadius = RADIUS * (1.25 + Math.random() * 0.35);
  bird.userData.orbitSpeed = 0.15 + Math.random() * 0.15;
  bird.userData.orbitOffset = Math.random() * Math.PI * 2;
  bird.userData.tilt = (Math.random() - 0.5) * 1.4;
  bird.userData.flapPhase = Math.random() * Math.PI * 2;
  bird.name = 'bird_' + i;
  birdGroup.add(bird);
  birds.push(bird);
}

// --------------------------- Starfield (subtle, behind) ---------------------------

const starsGeometry = new THREE.BufferGeometry();
const starsVerts = [];
for (let i = 0; i < 1400; i++) {
  const r = 40 + Math.random() * 40;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  starsVerts.push(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVerts, 3));
const starsMaterial = new THREE.PointsMaterial({
  color: 0xfff3d0,
  size: 0.05,
  transparent: true,
  opacity: 0.25,
  sizeAttenuation: true,
  depthWrite: false,
});
const stars = new THREE.Points(starsGeometry, starsMaterial);
stars.name = 'backdropStars';
scene.add(stars);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateWorldLayout() {
  const mobile = window.innerWidth <= 820;
  const worldX = mobile ? 0.75 : 2.35;
  const worldY = mobile ? -1.85 : 0.05;

  [GLOBE_GROUP, atmosphere, cloudGroup, birdGroup].forEach((object) => {
    object.position.set(worldX, worldY, 0);
  });

  camera.position.set(0, 0.25, mobile ? 8.8 : 8.2);
  camera.lookAt(0, 0, 0);
  camera.fov = mobile ? 47 : 42;
  camera.updateProjectionMatrix();
}

updateWorldLayout();

// Dragging rotates the world in place, keeping the editorial layout stable.
let dragging = false;
let lastPointerX = 0;
let lastPointerY = 0;

renderer.domElement.addEventListener('pointerdown', (event) => {
  dragging = true;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  renderer.domElement.setPointerCapture(event.pointerId);
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const deltaX = event.clientX - lastPointerX;
  const deltaY = event.clientY - lastPointerY;
  GLOBE_GROUP.rotation.y += deltaX * 0.006;
  GLOBE_GROUP.rotation.x = THREE.MathUtils.clamp(GLOBE_GROUP.rotation.x + deltaY * 0.004, -0.55, 0.55);
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
});

renderer.domElement.addEventListener('pointerup', (event) => {
  dragging = false;
  renderer.domElement.releasePointerCapture(event.pointerId);
});

renderer.domElement.addEventListener('pointercancel', () => {
  dragging = false;
});

// --------------------------- Animation loop ---------------------------

let t = 0;
const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt;

  if (!reducedMotion && !dragging) GLOBE_GROUP.rotation.y += dt * 0.045;
  atmosphere.rotation.y = GLOBE_GROUP.rotation.y;
  atmosphere.rotation.x = GLOBE_GROUP.rotation.x;

  cloudGroup.rotation.y += dt * 0.03;
  cloudMeshes.forEach((c) => {
    c.rotation.z += dt * 0.02;
  });

  // shimmer city lights
  lightsMat.opacity = 0.7 + Math.sin(t * 1.6) * 0.2;

  // birds orbit gently around the globe
  birds.forEach((b) => {
    const angle = t * b.userData.orbitSpeed + b.userData.orbitOffset;
    const r = b.userData.orbitRadius;
    const tilt = b.userData.tilt;
    b.position.set(
      Math.cos(angle) * r,
      Math.sin(tilt) * r * 0.4 + Math.sin(t * 0.6 + b.userData.flapPhase) * 0.05,
      Math.sin(angle) * r
    );
    b.lookAt(
      Math.cos(angle + 0.15) * r,
      Math.sin(tilt) * r * 0.4,
      Math.sin(angle + 0.15) * r
    );
    b.rotation.z += Math.sin(t * 6 + b.userData.flapPhase) * 0.15 * dt * 10;
  });

  starsMaterial.opacity = 0.2 + Math.sin(t * 0.4) * 0.06;

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// --------------------------- Resize ---------------------------

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateWorldLayout();
});

// --------------------------- Fallback for no-WebGL ---------------------------

if (!webglOK) {
  container.innerHTML = '';
  container.style.background = 'radial-gradient(circle at 50% 45%, #7fcdd4 0%, #2f5240 55%, #1f3d2c 100%)';
  const fallbackNote = document.createElement('div');
  fallbackNote.style.position = 'absolute';
  fallbackNote.style.inset = '0';
  fallbackNote.style.display = 'flex';
  fallbackNote.style.alignItems = 'center';
  fallbackNote.style.justifyContent = 'center';
  fallbackNote.style.color = '#f7f3ea';
  fallbackNote.style.fontFamily = 'Inter, sans-serif';
  fallbackNote.style.fontSize = '13px';
  fallbackNote.style.opacity = '0.7';
  container.appendChild(fallbackNote);
}

// --------------------------- Loader dismissal ---------------------------

setTimeout(() => {
  loader.classList.add('hidden');
}, 650);
