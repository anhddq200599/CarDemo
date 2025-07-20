import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let camera, scene, renderer;

let grid;
let controls;

const wheels = [];

function init() {

  const container = document.getElementById('container');

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize);

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(4.25, 1.4, - 4.5);

  controls = new OrbitControls(camera, container);
  controls.maxDistance = 9;
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

  // materials

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff0000, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03
  });

  const detailsMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: 1.0, roughness: 0.5
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0.25, roughness: 0, transmission: 1.0
  });

  const bodyColorInput = document.getElementById('body-color');
  bodyColorInput.addEventListener('input', function () {

    bodyMaterial.color.set(this.value);

  });

  const detailsColorInput = document.getElementById('details-color');
  detailsColorInput.addEventListener('input', function () {

    detailsMaterial.color.set(this.value);

  });

  const glassColorInput = document.getElementById('glass-color');
  glassColorInput.addEventListener('input', function () {

    glassMaterial.color.set(this.value);

  });

  // Car

  const shadow = new THREE.TextureLoader().load('models/gltf/ferrari_ao.png');

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('jsm/libs/draco/gltf/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  // Load VolvoS90.glb instead of ferrari.glb
  loader.load('models/gltf/VolvoS90/volvos90.gltf', function (gltf) {
    const carModel = gltf.scene;
    console.log(carModel);
    console.log(JSON.stringify(carModel.children[31].children));
    scene.add(carModel);
  });

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

  controls.update();

  const time = - performance.now() / 1000;

  for (let i = 0; i < wheels.length; i++) {

    wheels[i].rotation.x = time * Math.PI * 2;

  }

  grid.position.z = - (time) % 1;

  renderer.render(scene, camera);

}

init();