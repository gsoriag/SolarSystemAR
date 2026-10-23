// La cámara se abre una sola vez y el detector recibe ese mismo vídeo.
const arButton = document.getElementById('ar-button');
const arStatus = document.getElementById('ar-status');
const video = document.getElementById('camera-video');
const assetBase = 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.7/';
let stream = null;
let renderer = null;
let context = null;
let started = false;
let stopped = false;
let patternUrl = null;

function withTimeout(promise, message, milliseconds = 20000) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(message)), milliseconds);
        })
    ]).finally(() => clearTimeout(timer));
}

function stopCamera() {
    stopped = true;
    stream?.getTracks().forEach((track) => track.stop());
    video.pause();
    video.srcObject = null;
    video.hidden = true;
    renderer?.setAnimationLoop(null);
    renderer?.dispose();
    renderer?.domElement.remove();
    document.body.classList.remove('ar-active');
    if (patternUrl) URL.revokeObjectURL(patternUrl);
}

function showError(error) {
    console.error('Error AR:', error);
    stopCamera();
    const messages = {
        NotAllowedError: 'No se autorizó la cámara o la reproducción. Permite la cámara en la configuración del sitio y vuelve a intentarlo.',
        SecurityError: 'El navegador bloqueó la cámara. Abre la página directamente con HTTPS.',
        NotFoundError: 'No se encontró una cámara disponible.',
        NotReadableError: 'No se pudo abrir la cámara. Cierra otras aplicaciones que puedan estar usándola.',
        OverconstrainedError: 'La cámara no admite la configuración solicitada.'
    };
    arStatus.textContent = messages[error.name] || error.message || 'No se pudo iniciar la experiencia.';
    arButton.textContent = 'Recargar y reintentar';
    arButton.disabled = false;
}

function resizeView() {
    if (!video.videoWidth || !video.videoHeight) return;
    // Vídeo y canvas usan exactamente el mismo recorte y tamaño.
    const scale = Math.max(innerWidth / video.videoWidth, innerHeight / video.videoHeight);
    const width = Math.ceil(video.videoWidth * scale);
    const height = Math.ceil(video.videoHeight * scale);
    for (const element of [video, renderer?.domElement].filter(Boolean)) {
        element.style.width = width + 'px';
        element.style.height = height + 'px';
        element.style.left = (innerWidth - width) / 2 + 'px';
        element.style.top = (innerHeight - height) / 2 + 'px';
    }
    renderer?.setSize(width, height, false);
}

async function createScene() {
    arStatus.textContent = 'Cámara activa. Cargando el detector Hiro…';
    const [THREE, { ArToolkitContext, ArMarkerControls }] = await withTimeout(
        Promise.all([import('three'), import('threex')]),
        'No se pudo cargar el detector. Comprueba tu conexión y recarga.'
    );
    if (stopped) return;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.id = 'ar-canvas';
    document.body.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    scene.add(camera);
    const markerRoot = new THREE.Group();
    markerRoot.visible = false;
    scene.add(markerRoot);
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshNormalMaterial()
    );
    cube.position.y = 0.4;
    markerRoot.add(cube);
    resizeView();

    arStatus.textContent = 'Cámara activa. Preparando la calibración del detector…';
    context = new ArToolkitContext({
        cameraParametersUrl: assetBase + 'data/data/camera_para.dat',
        detectionMode: 'mono',
        canvasWidth: 640,
        canvasHeight: Math.round(640 * video.videoHeight / video.videoWidth),
        maxDetectionRate: 30
    });
    await withTimeout(new Promise((resolve) => context.init(resolve)),
        'No se pudo preparar la calibración de la cámara. Comprueba tu conexión y recarga.');
    if (stopped) return;
    camera.projectionMatrix.copy(context.getProjectionMatrix());
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    arStatus.textContent = 'Cámara activa. Cargando el patrón Hiro…';
    const pattern = await withTimeout(fetch(assetBase + 'data/data/patt.hiro').then((response) => {
        if (!response.ok) throw new Error('No se pudo descargar el patrón Hiro.');
        return response.blob();
    }), 'No se pudo cargar el patrón Hiro. Comprueba tu conexión y recarga.');
    if (stopped) return;
    patternUrl = URL.createObjectURL(pattern);
    new ArMarkerControls(context, markerRoot, {
        type: 'pattern',
        patternUrl,
        changeMatrixMode: 'modelViewMatrix'
    });

    arStatus.textContent = 'Cámara activa. Apunta al marcador Hiro con todo su borde visible.';
    let lastVisible = false;
    let lastTime = null;
    renderer.setAnimationLoop((time) => {
        if (stopped || video.readyState < 2) return;
        try {
            context.update(video);
            const delta = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.1);
            lastTime = time;
            cube.rotation.y += delta;
            if (markerRoot.visible !== lastVisible) {
                lastVisible = markerRoot.visible;
                arStatus.textContent = lastVisible
                    ? 'Marcador detectado. Mueve la cámara alrededor del cubo.'
                    : 'Marcador fuera de vista. Apunta de nuevo al Hiro con todo el borde visible.';
            }
            renderer.render(scene, camera);
        } catch (error) {
            showError(error);
        }
    });
}

arButton.addEventListener('click', async () => {
    if (started) {
        stopCamera();
        window.location.reload();
        return;
    }
    started = true;
    arButton.disabled = true;
    arStatus.textContent = 'Solicitando acceso a la cámara…';
    try {
        const request = navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        }).then((cameraStream) => {
            if (stopped) {
                cameraStream.getTracks().forEach((track) => track.stop());
                return null;
            }
            stream = cameraStream;
            return cameraStream;
        });
        await withTimeout(request,
            'La solicitud de cámara sigue pendiente. Revisa los permisos de Chrome y de este sitio.', 30000);
        if (stopped) return;
        stream.getVideoTracks().forEach((track) => {
            track.addEventListener('ended', () => {
                if (!stopped) showError(new Error('La cámara se desconectó. Recarga para volver a iniciarla.'));
            }, { once: true });
        });
        video.srcObject = stream;
        video.hidden = false;
        arStatus.textContent = 'Cámara autorizada. Iniciando el vídeo…';
        await withTimeout(video.play(), 'La cámara no entrega vídeo. Cierra otras aplicaciones y recarga.');
        if (stopped) return;
        if (!video.videoWidth || !video.videoHeight) {
            throw new Error('La cámara no entregó una imagen válida. Recarga para reintentarlo.');
        }
        document.body.classList.add('ar-active');
        resizeView();
        arButton.textContent = 'Detener cámara';
        arButton.disabled = false;
        await createScene();
    } catch (error) {
        if (!stopped) showError(error);
    }
});

window.addEventListener('resize', resizeView);
video.addEventListener('resize', resizeView);
window.addEventListener('pagehide', stopCamera);
window.addEventListener('pageshow', (event) => {
    if (event.persisted && started) window.location.reload();
});
if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    arButton.disabled = true;
    arStatus.textContent = !window.isSecureContext
        ? 'La cámara requiere HTTPS. Abre el enlace de GitHub Pages o usa localhost para desarrollar.'
        : 'Este navegador no ofrece acceso a la cámara.';
}
