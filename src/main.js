import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// Get Container Canvas
const container = document.getElementById('three-container');


// Scene setup
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x333333);
// scene.environment = new RGBELoader().load('textures/venice_sunset_1k.hdr');
// scene.environment.mapping = THREE.EquirectangularReflectionMapping;

const hdrLoader = new RGBELoader();
hdrLoader.load('textures/suburban_football_field_4k.hdr', function (hdrMap) {
  hdrMap.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdrMap;
  scene.background = hdrMap; // background hơi mờ có chiều sâu
});

// Camera
const camera = new THREE.PerspectiveCamera(
  75, 16 / 9, 0.1, 1000
);
camera.position.set(4.25, 1.0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setAnimationLoop(animate);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.4;
container.appendChild(renderer.domElement);

// Resize to match container
function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

// Load Car Model
let isFirstPersonView = false;

let carModel;

const wheels = [];

let carMoving = false;
let doorFLAxes;
let doorFRAxes;
let doorRLAxes;
let doorRRAxes;
// Door animation targets and state
let doorTargets = {
  FL: 0,
  FR: 0,
  RL: 0,
  RR: 0
};
let doorStates = {
  FL: false, // false = closed, true = open
  FR: false,
  RL: false,
  RR: false
};
const DOOR_OPEN_ANGLE = Math.PI / 3;
const DOOR_ANIMATION_SPEED = 0.1; 

function toggleDoorFL() {
  doorStates.FL = !doorStates.FL;
  doorTargets.FL = doorStates.FL ? -DOOR_OPEN_ANGLE : 0;
}
function toggleDoorFR() {
  doorStates.FR = !doorStates.FR;
  doorTargets.FR = doorStates.FR ? DOOR_OPEN_ANGLE : 0;
}
function toggleDoorRL() {
  doorStates.RL = !doorStates.RL;
  doorTargets.RL = doorStates.RL ? -DOOR_OPEN_ANGLE : 0;
}
function toggleDoorRR() {
  doorStates.RR = !doorStates.RR;
  doorTargets.RR = doorStates.RR ? DOOR_OPEN_ANGLE : 0;
}

// Grid
let grid = new THREE.GridHelper(20, 40, 0xffffff, 0xffffff);
grid.material.opacity = 0.2;
grid.material.depthWrite = false;
grid.material.transparent = true;

// scene.add(grid);// Remove grid from scene initially

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.maxDistance = 8;
controls.minDistance = 0.1;
controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
controls.target.set(0, 0.5, 0);
controls.update();

// Animate
function animate() {
  // requestAnimationFrame(animate);
  controls.update();
  const time = - performance.now() / 1000;

  // Car Moving
  if (carMoving) {
    for (let i = 0; i < wheels.length; i++) {
      wheels[i].rotation.x = -(time * Math.PI * 2);
    }
    grid.position.z = (time) % 1;
  }

  // Door animation (lerp to target)
  if (doorFLAxes) {
    doorFLAxes.rotation.y += (doorTargets.FL - doorFLAxes.rotation.y) * DOOR_ANIMATION_SPEED;
  }
  if (doorFRAxes) {
    doorFRAxes.rotation.y += (doorTargets.FR - doorFRAxes.rotation.y) * DOOR_ANIMATION_SPEED;
  }
  if (doorRLAxes) {
    doorRLAxes.rotation.y += (doorTargets.RL - doorRLAxes.rotation.y) * DOOR_ANIMATION_SPEED;
  }
  if (doorRRAxes) {
    doorRRAxes.rotation.y += (doorTargets.RR - doorRRAxes.rotation.y) * DOOR_ANIMATION_SPEED;
  }
  renderer.render(scene, camera);
}
animate();

// Model Interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
function onClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (!carModel) return; // Make sure model is loaded

  const intersects = raycaster.intersectObjects([carModel], true);
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    if (clickedObject && clickedObject.name === "Plane023") {
      toggleDoorFL();
    }
    if (clickedObject && clickedObject.name === "Plane024") {
      toggleDoorRL();
    }
    if (clickedObject && clickedObject.name === "Plane011") {
      toggleDoorRR();
    }
    if (clickedObject && clickedObject.name === "Plane008") {
      toggleDoorFR();
    }
    // clickedObject.material.color.set(0xff0000);
  }
}
renderer.domElement.addEventListener('click', onClick, false);

// Toggle Camera View
function toggleCameraView() {
  isFirstPersonView = !isFirstPersonView;
  if (isFirstPersonView) {
    camera.position.set(0, 1.2, 0); // vị trí người lái
    controls.target.set(0, 1.15, 0.1); // điểm nhìn về phía trước
    // camera.lookAt(0, 0.8, 5);       // nhìn về phía trước
    controls.minDistance = 0.2;
    controls.maxDistance = 1.2;
    controls.enablePan = false;
    controls.enableZoom = true;
  } else {
    camera.position.set(4.25, 1.0, 0);
    controls.target.set(0, 0.5, 0);
    controls.minDistance = 4;
    controls.maxDistance = 12;
    controls.enablePan = true;
    controls.enableZoom = true;
  }
  controls.update();
}

// Declare Material
// materials
const carPaintMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xff0000, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, metalness: 0.25, roughness: 0, transmission: 1.0
});

function setCarPaint(group) {
  group.traverse(function(child) {
    if (child.isMesh) {
      child.geometry.computeBoundingBox();
      if ('Car Paint' === child.material.name) {
        child.material = carPaintMaterial;
      }
      if ('Glass' === child.material.name || 'Glass headlights' === child.material.name) {
        child.material = glassMaterial;
      }
      if ('Lettering_Rear_2' === child.name) {
        child.material.polygonOffset = true;
        child.material.polygonOffsetFactor = -10.0; // đẩy mặt ra phía trước
        child.material.polygonOffsetUnits = -1.0;
      }
    }
  });
}

// Load studio environment first
const studioLoader = new GLTFLoader();
studioLoader.load('textures/env/showroom.gltf', function (gltf) {
  const studioScene = gltf.scene;
  scene.add(studioScene);
});


const carLoader = new GLTFLoader();
carLoader.load(
  'models/VolvoS90/volvos90.gltf',
  function (gltf) {

    carModel = gltf.scene;
    scene.add(carModel);

    setCarPaint(carModel);

    wheels.push(
      carModel.getObjectByName( 'Rim_FL' ),
      carModel.getObjectByName( 'Rim_FR' ),
      carModel.getObjectByName( 'Rim_RL' ),
      carModel.getObjectByName( 'Rim_RR' ),
      carModel.getObjectByName( 'Tire_FL' ),
      carModel.getObjectByName( 'Tire_FR' ),
      carModel.getObjectByName( 'Tire_RL' ),
      carModel.getObjectByName( 'Tire_RR' ),
      carModel.getObjectByName( 'Wheelhub_FL' ),
      carModel.getObjectByName( 'Wheelhub_FR' ),
      carModel.getObjectByName( 'Wheelhub_RL' ),
      carModel.getObjectByName( 'Wheelhub_RR' ),
      carModel.getObjectByName( 'Brake_Disc_FL' ),
      carModel.getObjectByName( 'Brake_Disc_FR' ),
      carModel.getObjectByName( 'Brake_Disc_RL' ),
      carModel.getObjectByName( 'Brake_Disc_RR' )
    );

    // Get X, Y, Z axes of the door
    doorFLAxes = carModel.getObjectByName( 'DoorFLAxes' );
    doorFRAxes = carModel.getObjectByName( 'DoorFRAxes' );
    doorRLAxes = carModel.getObjectByName( 'DoorRLAxes' );
    doorRRAxes = carModel.getObjectByName( 'DoorRRAxes' );

    // Add butotn toggle car move
    document.getElementById('toggle-car-move').addEventListener('click', function() { 
      carMoving = !carMoving;
      if (carMoving) {
        scene.add(grid); // Show grid when car is moving
      } else {
        scene.remove(grid);
      }
     });
    
    // Add button toggle view
    document.getElementById('toggle-camera-view').addEventListener('click', toggleCameraView);

    // Add set color button event listeners
    document.getElementById('paint-color').addEventListener('input', function () { carPaintMaterial.color.set(this.value)} );
    document.getElementById('glass-color').addEventListener('input', function () { glassMaterial.color.set(this.value) });
   
  });
