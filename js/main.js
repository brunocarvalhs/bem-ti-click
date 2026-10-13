// Rota: o site é sempre a TV (host); com ?sala=ABCD vira a câmera do celular.
// Cada lado carrega só o código que usa.
const params = new URLSearchParams(location.search);

if (params.has('sala')) import('./camera/camera.js').then(m => m.startCam(params));
else import('./tv/host.js').then(m => m.startTv(params));
