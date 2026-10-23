// AR con marcador: cámara sin WebXR ni ARCore.
const arButton = document.getElementById('ar-button');
const arStatus = document.getElementById('ar-status');
const assetBase = 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.7/';
let scene = null;
let stream = null;
let started = false;
let watchdog = null;

function stopCamera() {
    clearTimeout(watchdog);
    stream?.getTracks().forEach((track) => track.stop());
    document.querySelectorAll('video').forEach((video) => {
        video.srcObject?.getTracks().forEach((track) => track.stop());
    });
    scene?.pause();
}

function showError(error) {
    console.error('Error AR:', error);
    stopCamera();
    document.body.classList.remove('ar-active');
    const messages = {
        NotAllowedError: 'No se autorizó la cámara. Permite su acceso en la configuración del sitio y vuelve a intentarlo.',
        SecurityError: 'El navegador bloqueó la cámara. Abre la página directamente con HTTPS.',
        NotFoundError: 'No se encontró una cámara disponible.',
        NotReadableError: 'No se pudo abrir la cámara. Cierra otras aplicaciones que puedan estar usándola.',
        OverconstrainedError: 'La cámara no admite la configuración solicitada.'
    };
    arStatus.textContent = messages[error.name] || error.message || 'No se pudo iniciar la experiencia.';
    arButton.textContent = 'Recargar y reintentar';
    arButton.disabled = false;
}

function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = () => reject(new Error('No se pudieron descargar las librerías AR. Revisa tu conexión y recarga.'));
        document.head.appendChild(script);
    });
}

// En AR.js 3.4.7 camera-init no incluye detail; el vídeo sí expone el stream.
window.addEventListener('arjs-video-loaded', (event) => {
    const video = event.detail.component;
    stream = video.srcObject;
    video.muted = true;
    video.play().catch(() => {
        arStatus.textContent = 'Toca la imagen de la cámara para activar el vídeo.';
    });
    arStatus.textContent = 'Cámara activa. Apunta al marcador Hiro con todo su borde visible.';
    document.body.classList.add('ar-active');
    arButton.textContent = 'Detener cámara';
    arButton.disabled = false;
    stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
            showError(new Error('La cámara se desconectó. Recarga para volver a iniciarla.'));
        }, { once: true });
    });
});
window.addEventListener('camera-error', (event) => {
    showError(event.detail?.error || new Error('No se pudo abrir la cámara. Permite su acceso en la configuración del sitio y cierra otras aplicaciones que puedan estar usándola.'));
});

function createScene() {
    scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('device-orientation-permission-ui', 'enabled: false');
    scene.setAttribute('renderer', 'antialias: true; alpha: true');
    scene.setAttribute('loading-screen', 'enabled: false');
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; detectionMode: mono; cameraParametersUrl: ' + assetBase + 'data/data/camera_para.dat;');
    const marker = document.createElement('a-marker');
    marker.setAttribute('type', 'pattern');
    marker.setAttribute('url', assetBase + 'data/data/patt.hiro');
    marker.setAttribute('emitevents', 'true');
    const cube = document.createElement('a-box');
    cube.setAttribute('position', '0 0.5 0');
    cube.setAttribute('width', '0.8');
    cube.setAttribute('height', '0.8');
    cube.setAttribute('depth', '0.8');
    cube.setAttribute('material', 'shader: normal');
    cube.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 6000; easing: linear');
    marker.appendChild(cube);
    marker.addEventListener('markerFound', () => {
        clearTimeout(watchdog);
        arStatus.textContent = 'Marcador detectado. Mueve la cámara alrededor del cubo.';
    });
    marker.addEventListener('markerLost', () => {
        arStatus.textContent = 'Marcador fuera de vista. Apunta de nuevo al Hiro con todo el borde visible.';
    });
    scene.appendChild(marker);
    const camera = document.createElement('a-entity');
    camera.setAttribute('camera', '');
    scene.appendChild(camera);
    document.body.appendChild(scene);
    watchdog = setTimeout(() => {
        arStatus.textContent = stream
            ? 'Aún no se detecta el Hiro. Revisa luz, enfoque y borde completo. Si persiste, recarga y comprueba tu conexión.'
            : 'Esperando la cámara. Revisa la solicitud de permiso del navegador; si no aparece, recarga.';
        arButton.textContent = stream ? 'Detener cámara' : 'Recargar y reintentar';
        arButton.disabled = false;
    }, 30000);
}

arButton.addEventListener('click', async () => {
    if (started) {
        stopCamera();
        // Libera también el detector y vuelve a la pantalla inicial.
        window.location.reload();
        return;
    }
    started = true;
    arButton.disabled = true;
    arStatus.textContent = 'Cargando el detector de marcadores…';
    try {
        await loadScript('https://aframe.io/releases/1.6.0/aframe.min.js');
        await loadScript(assetBase + 'aframe/build/aframe-ar.js');
        if (!window.AFRAME?.systems.arjs) {
            throw new Error('El detector AR no se cargó correctamente. Recarga la página.');
        }
        arStatus.textContent = 'Permite el acceso a la cámara cuando el navegador lo solicite.';
        createScene();
    } catch (error) {
        showError(error);
    }
});

window.addEventListener('pagehide', stopCamera);
window.addEventListener('pageshow', (event) => {
    if (event.persisted && started) window.location.reload();
});

if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    arButton.disabled = true;
    arStatus.textContent = !window.isSecureContext
        ? 'La cámara requiere HTTPS. Abre el enlace de GitHub Pages o usa localhost para desarrollar.'
        : 'Este navegador no ofrece acceso a la cámara. Abre la página en un navegador compatible.';
}
