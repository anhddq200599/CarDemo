import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import { PMREMGenerator } from 'three';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let carModel;

let camera, scene, renderer;

let grid;
let controls;

let isFirstPersonView = false;

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
const DOOR_ANIMATION_SPEED = 0.1; // Lower is slower, higher is faster

function toggleDoorFL() {
  doorStates.FL = !doorStates.FL;
  doorTargets.FL = doorStates.FL ? -DOOR_OPEN_ANGLE : 0;
  updateDoorButtonText('FL');
}
function toggleDoorFR() {
  doorStates.FR = !doorStates.FR;
  doorTargets.FR = doorStates.FR ? DOOR_OPEN_ANGLE : 0;
  updateDoorButtonText('FR');
}
function toggleDoorRL() {
  doorStates.RL = !doorStates.RL;
  doorTargets.RL = doorStates.RL ? -DOOR_OPEN_ANGLE : 0;
  updateDoorButtonText('RL');
}
function toggleDoorRR() {
  doorStates.RR = !doorStates.RR;
  doorTargets.RR = doorStates.RR ? DOOR_OPEN_ANGLE : 0;
  updateDoorButtonText('RR');
}

function updateDoorButtonText(door) {
  const map = {
    FL: 'toggle-door-fl',
    FR: 'toggle-door-fr',
    RL: 'toggle-door-rl',
    RR: 'toggle-door-rr'
  };
  const btn = document.getElementById(map[door]);
  if (!btn) return;
  if (doorStates[door]) {

    btn.innerHTML = `<i class="fa-solid fa-door-open"></i> Close ${getDoorName(door)}`;
  } else {
    btn.innerHTML = `<i class="fa-solid fa-door-open"></i> Open ${getDoorName(door)}`;
  }
}
function getDoorName(door) {
  switch (door) {
    case 'FL': return 'Front Left Door';
    case 'FR': return 'Front Right Door';
    case 'RL': return 'Rear Left Door';
    case 'RR': return 'Rear Right Door';
    default: return 'Door';
  }
}


function init() {

  const container = document.getElementById('container');

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.4;
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize);

  camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(4.25, 1.0, 0);

  controls = new OrbitControls(camera, container);
  controls.maxDistance = 12;
  controls.minDistance = 4;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
  controls.target.set(0, 0.5, 0);
  controls.update();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x333333);

  scene.environment = new RGBELoader().load('textures/equirectangular/venice_sunset_1k.hdr');
  scene.environment.mapping = THREE.EquirectangularReflectionMapping;

  scene.fog = new THREE.Fog(0x333333, 10, 15);

  grid = new THREE.GridHelper(20, 40, 0xffffff, 0xffffff);
  grid.material.opacity = 0.2;
  grid.material.depthWrite = false;
  grid.material.transparent = true;

  scene.add(grid);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft general light
  scene.add(ambientLight);

  // materials
  const carPaintMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff0000, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0.25, roughness: 0, transmission: 1.0
  });
 

  // Car

  // const shadow = new THREE.TextureLoader().load('models/gltf/ferrari_ao.png');

  // const dracoLoader = new DRACOLoader();
  // dracoLoader.setDecoderPath('jsm/libs/draco/gltf/');

  const loader = new GLTFLoader();
  // loader.setDRACOLoader(dracoLoader);

  // Load VolvoS90.glb instead of ferrari.glb
  loader.load('models/gltf/VolvoS90/volvos90.gltf', function (gltf) {
    // Load Model
    carModel = gltf.scene;
    // console.log(dumpObject(carModel).join('\n'));
    scene.add(carModel);

    // Apply Car Materials
    setCarPaint(carModel);

   

    // const pmremGenerator = new THREE.PMREMGenerator(renderer);
    // pmremGenerator.compileEquirectangularShader();
    // new RGBELoader()
    // .setPath('textures/')
    // .load('studio_small_08_4k.hdr', function (hdrTexture) {
    //   hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    //   scene.environment = hdrTexture;
    //   scene.background = hdrTexture; // Cho showroom hiển thị như background
    // });

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

    // Add door toggle button event listeners
    document.getElementById('toggle-door-fl').addEventListener('click', toggleDoorFL);
    document.getElementById('toggle-door-fr').addEventListener('click', toggleDoorFR);
    document.getElementById('toggle-door-rl').addEventListener('click', toggleDoorRL);
    document.getElementById('toggle-door-rr').addEventListener('click', toggleDoorRR);
    // Add set color button event listeners
    document.getElementById('paint-color').addEventListener('input', function () { carPaintMaterial.color.set(this.value)} );
    document.getElementById('glass-color').addEventListener('input', function () { glassMaterial.color.set(this.value) });
    // Set initial button text
    updateDoorButtonText('FL');
    updateDoorButtonText('FR');
    updateDoorButtonText('RL');
    updateDoorButtonText('RR');
    // Add butotn toggle car move
    document.getElementById('toggle-car-move').addEventListener('click', function() { carMoving = !carMoving });

    document.getElementById('toggle-camera-view').addEventListener('click', toggleCameraView);

    renderer.domElement.addEventListener('click', onClick, false);

    const canvas = renderer.domElement;

    canvas.style.border = '2px solid red'; // để bạn thấy rõ canvas

    // End Load Model
  });

  function onClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    // based on the canvas size.
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Find intersected objects
    // 'scene.children' can be replaced with a specific array of objects you want to test
    const intersects = raycaster.intersectObjects(carModel.children, true); // 'true' for recursive checking of children

    if (intersects.length > 0) {
        // 'intersects[0].object' is the first object intersected by the ray
        const clickedObject = intersects[0].object;
        console.log('Clicked object:', clickedObject);

        // Perform actions on the clicked object, e.g., change its color, trigger an animation, etc.
        // clickedObject.material.color.set(0xff0000); // Example: change color to red
    }
  }


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

  function toggleCameraView() {
    isFirstPersonView = !isFirstPersonView;
    if (isFirstPersonView) {
      camera.position.set(0, 1.2, 0); // vị trí người lái
      controls.target.set(0, 1.15, 0.1); // điểm nhìn về phía trước
      // camera.lookAt(0, 0.8, 5);       // nhìn về phía trước
      controls.minDistance = 0.5;
      controls.maxDistance = 0.5;
      controls.enablePan = false;
      controls.enableZoom = false;
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

}

function onWindowResize() {
  const container = document.getElementById('container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {

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


init();
