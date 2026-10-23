CUBO AR CON MARCADOR HIRO

Utiliza Three.js 0.164.1 y AR.js 3.4.7 para detectar el marcador con la cámara.
La cámara se abre una sola vez y ese mismo vídeo alimenta el detector.
No depende del inicio automático de una escena A-Frame.
No utiliza WebXR ni requiere ARCore.

CÓMO PROBAR
1. Publicar en GitHub Pages (HTTPS) o usar localhost en desarrollo.
2. Abrir marcador.html en otro dispositivo o imprimirlo.
3. Abrir index.html en el teléfono y pulsar Iniciar cámara.
4. Aceptar el permiso de cámara.
   El permiso se solicita directamente al pulsar el botón, antes de cargar AR.
   Si ya está concedido, el navegador puede continuar sin mostrar otro aviso.
5. Apuntar al Hiro con buena luz y el borde negro completo visible.
6. El cubo aparece sobre el marcador y se oculta al perderlo de vista.
7. Detener cámara libera la cámara y recarga la página inicial.

REQUISITOS
- Navegador con WebGL y acceso a cámara mediante getUserMedia.
- HTTPS (excepto localhost). No abrir como archivo local.
- Internet para descargar librerías, calibración y marcador.
- No necesita permisos de ubicación ni sensores de orientación.

ARCHIVOS
index.html: interfaz.
js/app.js: carga de librerías, cámara, escena y detección.
css/style.css: controles superpuestos.
marcador.html: marcador oficial Hiro y página de impresión.

Si se deniega la cámara, habilitarla en los permisos del sitio y recargar.
Si no se detecta el marcador, revisar luz, reflejos, enfoque y borde completo.

Documentación: https://ar-js-org.github.io/AR.js-Docs/
Marcador y detector: https://github.com/AR-js-org/AR.js (3.4.7).
