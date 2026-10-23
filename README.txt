CUBO AR CON MARCADOR HIRO

Utiliza A-Frame 1.6.0 y AR.js 3.4.7 para detectar el marcador con la cámara.
No utiliza WebXR ni requiere ARCore.

CÓMO PROBAR
1. Publicar en GitHub Pages (HTTPS) o usar localhost en desarrollo.
2. Abrir marcador.html en otro dispositivo o imprimirlo.
3. Abrir index.html en el teléfono y pulsar Iniciar cámara.
4. Aceptar el permiso de cámara.
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
