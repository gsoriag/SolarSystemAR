import * as THREE from 'three';

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
const arButton = document.getElementById('ar-button');
const arStatus = document.getElementById('ar-status');
let currentSession = null;
renderer.xr.setReferenceSpaceType('local');

function showARError(error) {
    console.error('Error de WebXR:', error);
    const messages = {
        NotAllowedError: 'El navegador no autorizó AR. Revisa los permisos del sitio y vuelve a intentarlo.',
        SecurityError: 'El navegador bloqueó AR por seguridad o permisos. Abre la página directamente mediante HTTPS.',
        NotSupportedError: 'Este dispositivo no puede iniciar WebXR AR. Comprueba su compatibilidad y los servicios de realidad aumentada.',
        InvalidStateError: 'Hay otra sesión XR activa o la página no está activa. Cierra la otra sesión y vuelve a intentarlo.'
    };
    arStatus.textContent = messages[error.name] || `No se pudo iniciar AR: ${error.message || error.name}`;
}

function onSessionEnded() {
    currentSession = null;
    document.body.classList.remove('ar-active');
    arButton.textContent = 'Iniciar AR';
    arButton.disabled = false;
    arStatus.textContent = 'Sesión AR finalizada. Puedes volver a iniciarla.';
}

arButton.addEventListener('click', async () => {
    arButton.disabled = true;
    if (currentSession) {
        try {
            await currentSession.end();
        } catch (error) {
            showARError(error);
        } finally {
            arButton.disabled = false;
        }
        return;
    }

    let session;
    try {
        // Solicitar la sesión directamente desde el gesto del usuario.
        session = await navigator.xr.requestSession('immersive-ar', {
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.getElementById('ar-controls') }
        });
        currentSession = session;
        session.addEventListener('end', onSessionEnded, { once: true });
        await renderer.xr.setSession(session);
        if (currentSession !== session) return;
        document.body.classList.add('ar-active');
        arButton.textContent = 'Salir de AR';
        arStatus.textContent = 'AR activa. El cubo aparece a un metro del punto de inicio.';
    } catch (error) {
        if (session) {
            session.removeEventListener('end', onSessionEnded);
            try { await session.end(); } catch (endError) { console.warn(endError); }
        }
        onSessionEnded();
        showARError(error);
    } finally {
        arButton.disabled = false;
    }
});

async function checkARSupport() {
    if (!window.isSecureContext) {
        arButton.textContent = 'Se requiere HTTPS';
        arStatus.textContent = 'Abre esta página con HTTPS. Una dirección HTTP de la red local no permite iniciar AR en el teléfono.';
        return;
    }
    if (!navigator.xr) {
        arButton.textContent = 'WebXR no disponible';
        arStatus.textContent = 'Este navegador no ofrece WebXR. Usa un navegador y dispositivo compatibles con WebXR AR; Chrome en iPhone no garantiza esta compatibilidad.';
        return;
    }
    try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        arButton.disabled = !supported;
        arButton.textContent = supported ? 'Iniciar AR' : 'AR no compatible';
        arStatus.textContent = supported
            ? 'Pulsa Iniciar AR y acepta los permisos que solicite el navegador.'
            : 'El navegador no admite AR en este dispositivo. En Android, comprueba que el teléfono sea compatible con ARCore y tenga actualizados Chrome y los Servicios de Google Play para RA.';
    } catch (error) {
        arButton.textContent = 'AR no disponible';
        showARError(error);
    }
}

checkARSupport();

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
