import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

// ==============================
// ESCENA
// ==============================
const scene = new THREE.Scene();

// ==============================
// CÁMARA
// ==============================
const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
);

// ==============================
// RENDERER
// ==============================
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

// ==============================
// BOTÓN AR
// ==============================
document.body.appendChild(
    ARButton.createButton(renderer)
);

// ==============================
// CUBO
// ==============================
const geometry = new THREE.BoxGeometry(
    0.2,
    0.2,
    0.2
);

const material = new THREE.MeshNormalMaterial();

const cube = new THREE.Mesh(
    geometry,
    material
);

cube.position.set(0, 0, -1);

scene.add(cube);

// ==============================
// ANIMACIÓN
// ==============================
function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// ==============================
// CAMBIO DE TAMAÑO
// ==============================
window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}
