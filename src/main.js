import * as THREE from 'three';
import './style.css';

const app = document.querySelector('#app');
const clockEl = document.querySelector('#clock');
const stateEl = document.querySelector('#state');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9d5a2');
scene.fog = new THREE.Fog('#b9d5a2', 420, 1250);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 2500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x6b7855, 2.0));
const sun = new THREE.DirectionalLight(0xfff0d2, 2.3);
sun.position.set(-110, 220, 120);
sun.castShadow = true;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2400, 2400),
  new THREE.MeshStandardMaterial({ color: '#b9d5a2', roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
ground.receiveShadow = true;
scene.add(ground);

const world = new THREE.Group();
scene.add(world);

const mats = {
  asphalt: new THREE.MeshStandardMaterial({ color: '#4e5557', roughness: 0.96 }),
  curb: new THREE.MeshStandardMaterial({ color: '#d2cabb', roughness: 1 }),
  lawn: new THREE.MeshStandardMaterial({ color: '#8fb77b', roughness: 1 }),
  walls: ['#e8d4b8', '#d6c5a6', '#c6d4c9', '#e4c6b5'].map(
    color => new THREE.MeshStandardMaterial({ color, roughness: 0.95 })
  ),
  roofs: ['#bd6049', '#d78a5b', '#9e9b8b', '#6d7880', '#c5ad83'].map(
    color => new THREE.MeshStandardMaterial({ color, roughness: 0.95 })
  )
};

const center = { lat: 52.0625, lon: 5.1360 };
const bounds = { south: 52.056, west: 5.124, north: 52.069, east: 5.148 };
const metersPerLat = 111320;
const metersPerLon = 111320 * Math.cos(center.lat * Math.PI / 180);

function project(lat, lon) {
  return {
    x: (lon - center.lon) * metersPerLon,
    z: -(lat - center.lat) * metersPerLat
  };
}

function addRibbon(a, b, width, material, y) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  if (length < 0.2) return;
  const nx = -dz / length * width / 2;
  const nz = dx / length * width / 2;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    a.x + nx, y, a.z + nz,
    a.x - nx, y, a.z - nz,
    b.x - nx, y, b.z - nz,
    a.x + nx, y, a.z + nz,
    b.x - nx, y, b.z - nz,
    b.x + nx, y, b.z + nz
  ], 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  world.add(mesh);
}

function addBuilding(points, index) {
  if (points.length < 4) return;
  const xs = points.map(point => point.x);
  const zs = points.map(point => point.z);
  const width = Math.max(...xs) - Math.min(...xs);
  const depth = Math.max(...zs) - Math.min(...zs);
  if (width < 2.5 || depth < 2.5 || width * depth > 12000) return;

  const footprint = new THREE.Shape();
  footprint.moveTo(points[0].x, points[0].z);
  for (let i = 1; i < points.length; i++) footprint.lineTo(points[i].x, points[i].z);
  footprint.closePath();

  const height = 5.5 + (index % 5) * 1.35;
  const geometry = new THREE.ExtrudeGeometry(footprint, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 1
  });
  // Footprint XY becomes world XZ; extrusion depth becomes vertical.
  geometry.rotateX(Math.PI / 2);
  const building = new THREE.Mesh(geometry, mats.walls[index % mats.walls.length]);
  building.position.y = height;
  building.castShadow = true;
  building.receiveShadow = true;
  world.add(building);

  // Flat, slightly oversized roof caps make the massing read as intentional art direction.
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width * 1.02, 0.45, depth * 1.02),
    mats.roofs[index % mats.roofs.length]
  );
  roof.position.set(
    (Math.min(...xs) + Math.max(...xs)) / 2,
    height + 0.18,
    (Math.min(...zs) + Math.max(...zs)) / 2
  );
  roof.castShadow = true;
  world.add(roof);
}

function addTree(x, z, index) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 2.4, 6),
    new THREE.MeshStandardMaterial({ color: '#795b40' })
  );
  trunk.position.set(x, 1.2, z);
  world.add(trunk);
  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.8 + (index % 3) * 0.35, 1),
    new THREE.MeshStandardMaterial({
      color: ['#4f8650', '#659b58', '#477747'][index % 3],
      roughness: 1
    })
  );
  crown.position.set(x, 3.4, z);
  crown.castShadow = true;
  world.add(crown);
}

const course = [
  project(52.0618, 5.1346),
  project(52.0630, 5.1375),
  project(52.0643, 5.1348),
  project(52.0624, 5.1317),
  project(52.0618, 5.1346)
];

function addFallbackRoads() {
  for (let i = 1; i < course.length; i++) {
    addRibbon(course[i - 1], course[i], 12, mats.curb, 0.0);
    addRibbon(course[i - 1], course[i], 9, mats.asphalt, 0.04);
  }
}

async function loadNeighborhood() {
  const query = `[out:json][timeout:25];(way["highway"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});way["building"](${bounds.south},${bounds.west},${bounds.north},${bounds.east}););out body;>;out skel qt;`;
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Overpass request failed: ' + response.status);
  const data = await response.json();
  const nodes = new Map(
    data.elements.filter(element => element.type === 'node')
      .map(node => [node.id, project(node.lat, node.lon)])
  );
  let roads = 0;
  let buildings = 0;
  for (const way of data.elements.filter(element => element.type === 'way')) {
    const points = way.nodes.map(id => nodes.get(id)).filter(Boolean);
    if (way.tags?.highway && points.length > 1) {
      const highway = way.tags.highway;
      const width = highway === 'footway' || highway === 'path' ? 2.4
        : highway === 'service' ? 4.2
        : highway === 'residential' || highway === 'living_street' ? 7
        : 9;
      for (let i = 1; i < points.length; i++) {
        if (width >= 6) addRibbon(points[i - 1], points[i], width + 1.7, mats.curb, 0.005);
        addRibbon(points[i - 1], points[i], width, mats.asphalt, 0.035);
      }
      roads++;
    } else if (way.tags?.building && points.length >= 4) {
      addBuilding(points, buildings++);
    }
  }

  // Small, restrained greenery dressing. These are visual props, not map-derived trees.
  for (let i = 0; i < 105; i++) {
    const x = (Math.random() - 0.5) * 520;
    const z = (Math.random() - 0.5) * 520;
    addTree(x, z, i);
  }
  stateEl.textContent = `OSM-wijk geladen · ${roads} wegways · ${buildings} gebouwen`;
}

function makeCar() {
  const car = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 1.05, 4.8),
    new THREE.MeshStandardMaterial({ color: '#efbf45', roughness: 0.48 })
  );
  body.position.y = 0.95;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, 0.8, 2.1),
    new THREE.MeshStandardMaterial({ color: '#29434b', roughness: 0.35, metalness: 0.1 })
  );
  cabin.position.set(0, 1.75, -0.35);
  cabin.castShadow = true;
  car.add(cabin);

  const wheelMaterial = new THREE.MeshStandardMaterial({ color: '#242629' });
  for (const x of [-1.65, 1.65]) {
    for (const z of [-1.5, 1.5]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.32, 12), wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.48, z);
      car.add(wheel);
    }
  }
  scene.add(car);
  return car;
}

const car = makeCar();
car.position.set(course[0].x, 0, course[0].z);
let heading = 0;
let speed = 0;
let startedAt = null;
let finishTime = null;
let checkpointIndex = 1;
const keys = new Set();

addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  keys.add(key);
  if (key === 'r') resetRun();
});
addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

const checkpointMaterial = new THREE.MeshStandardMaterial({
  color: '#ffe27a',
  emissive: '#8a5b09',
  roughness: 0.35
});
const checkpointRing = new THREE.Mesh(
  new THREE.TorusGeometry(4.5, 0.3, 8, 28),
  checkpointMaterial
);
checkpointRing.rotation.x = Math.PI / 2;
scene.add(checkpointRing);

function formatTime(milliseconds) {
  const ms = Math.max(0, milliseconds);
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor(ms / 1000) % 60;
  const fraction = Math.floor(ms % 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(fraction).padStart(3, '0')}`;
}

function resetRun() {
  car.position.set(course[0].x, 0, course[0].z);
  heading = 0;
  speed = 0;
  startedAt = null;
  finishTime = null;
  checkpointIndex = 1;
  clockEl.textContent = '00:00.000';
  stateEl.textContent = 'Start bij de gele poort · rij door de checkpoints';
}

function update(delta) {
  const accelerating = keys.has('w') || keys.has('arrowup');
  const braking = keys.has('s') || keys.has('arrowdown');
  const steering = (keys.has('d') || keys.has('arrowright') ? 1 : 0)
    - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);

  if (finishTime === null) {
    if (accelerating && startedAt === null) startedAt = performance.now();
    speed += (accelerating ? 26 : 0) * delta;
    speed -= (braking ? 34 : 0) * delta;
    if (!accelerating && !braking) speed *= Math.pow(0.94, delta * 60);
    speed = THREE.MathUtils.clamp(speed, -9, 31);
    heading += steering * Math.sign(speed || 1) * 1.65 * delta;
    car.position.x += Math.sin(heading) * speed * delta;
    car.position.z += Math.cos(heading) * speed * delta;
  }

  car.rotation.y = heading;
  if (startedAt !== null && finishTime === null) {
    clockEl.textContent = formatTime(performance.now() - startedAt);
  } else if (finishTime !== null) {
    clockEl.textContent = formatTime(finishTime);
  }

  const target = course[checkpointIndex];
  checkpointRing.position.set(target.x, 1.4, target.z);
  if (finishTime === null && car.position.distanceTo(new THREE.Vector3(target.x, 0, target.z)) < 7) {
    checkpointIndex++;
    if (checkpointIndex >= course.length) {
      finishTime = performance.now() - startedAt;
      stateEl.textContent = `Finish · ${formatTime(finishTime)} · druk R voor nieuwe poging`;
      checkpointIndex = 1;
    } else {
      stateEl.textContent = `Checkpoint ${checkpointIndex} / ${course.length - 1}`;
    }
  }

  const desiredCamera = new THREE.Vector3(
    car.position.x - Math.sin(heading) * 38,
    112,
    car.position.z - Math.cos(heading) * 62
  );
  camera.position.lerp(desiredCamera, 0.055);
  camera.lookAt(car.position.x, 0, car.position.z);
}

let previousFrame = performance.now();
function animate(now) {
  const delta = Math.min((now - previousFrame) / 1000, 0.05);
  previousFrame = now;
  update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

addFallbackRoads();
loadNeighborhood().catch(error => {
  console.error(error);
  stateEl.textContent = 'OSM niet bereikbaar · fallback-circuit actief';
});

requestAnimationFrame(animate);
