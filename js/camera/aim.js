// Mira do celular: touchpad (opção B) ou giroscópio (opção A), mais os ajustes de sensibilidade.
import { W, H } from '../config.js';
import { $, clamp, store } from '../shared/util.js';

let cam, onMove, onInfo;

// cam.x / cam.y vão de 0 a 1 (canto superior esquerdo a inferior direito da TV).
export function initAim(state, handlers) {
  cam = state; ({ onMove, onInfo } = handlers);
  Object.assign(cam, { x: 0.5, y: 0.5, mode: 'touch', sens: 1, invX: false, invY: false });
  try { const s = JSON.parse(store.get('oop-set') || '{}'); Object.assign(cam, { sens: s.sens || 1, invX: !!s.invX, invY: !!s.invY }); } catch (e) {}
  $('sensIn').value = cam.sens; $('invXIn').checked = cam.invX; $('invYIn').checked = cam.invY;

  $('modeTouch').onclick = () => setMode('touch');
  $('modeGyro').onclick = enableGyro;
  $('recenter').onclick = () => { cam.x = cam.y = 0.5; onMove(); };
  $('setBtn').onclick = () => { $('settings').hidden = false; };
  $('setClose').onclick = () => { $('settings').hidden = true; };
  $('sensIn').oninput = $('invXIn').onchange = $('invYIn').onchange = saveSettings;
  initTouchpad();
}

function saveSettings() {
  cam.sens = Number($('sensIn').value) || 1; cam.invX = $('invXIn').checked; cam.invY = $('invYIn').checked;
  store.set('oop-set', JSON.stringify({ sens: cam.sens, invX: cam.invX, invY: cam.invY }));
}

function moveAim(dx, dy) { cam.x = clamp(cam.x + dx, 0, 1); cam.y = clamp(cam.y + dy, 0, 1); onMove(); }

// Opção B — touchpad: movimento relativo, como trackpad de notebook.
function initTouchpad() {
  const pad = $('pad'); let drag = null;
  pad.addEventListener('pointerdown', e => {
    if (cam.mode !== 'touch') return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    try { pad.setPointerCapture(e.pointerId); } catch (er) {}
    $('vfHint').hidden = true;
  });
  pad.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const k = Math.min(pad.clientWidth, pad.clientHeight) * 0.9 / cam.sens; // atravessar o lado menor do pad = atravessar a TV
    moveAim((e.clientX - drag.x) / k, (e.clientY - drag.y) / k * (W / H));
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const endDrag = e => { if (drag && e.pointerId === drag.id) drag = null; };
  pad.addEventListener('pointerup', endDrag); pad.addEventListener('pointercancel', endDrag);
}

// Opção A — giroscópio: integra a velocidade angular (graus/s) e move a mira, como um air mouse.
let gyroLast = 0, gyroSeen = false, gyroListening = false;

function setMode(m) {
  cam.mode = m;
  $('modeTouch').classList.toggle('on', m === 'touch'); $('modeGyro').classList.toggle('on', m === 'gyro');
  $('vfHint').textContent = m === 'gyro' ? 'Mova o celular para mirar. “Centralizar” recalibra.' : 'Arraste o dedo aqui para mover a mira na TV';
  $('vfHint').hidden = false;
}

function gyroFail(msg) { setMode('touch'); onInfo(msg); }

function enableGyro() {
  if (!window.isSecureContext) return gyroFail('O giroscópio só funciona com HTTPS (veja o README). Seguimos no touchpad.');
  setMode('gyro'); gyroSeen = false; gyroLast = 0;
  const blocked = 'O navegador não liberou o giroscópio. Seguimos no touchpad.';
  const go = () => {
    if (!gyroListening) { addEventListener('devicemotion', onMotion); gyroListening = true; }
    setTimeout(() => { if (!gyroSeen && cam.mode === 'gyro') gyroFail(blocked); }, 1500);
  };
  const DME = window.DeviceMotionEvent;
  if (DME && typeof DME.requestPermission === 'function') { // iOS: precisa vir de um toque
    DME.requestPermission().then(r => (r === 'granted' ? go() : gyroFail('Permissão do giroscópio negada. Seguimos no touchpad.'))).catch(() => gyroFail(blocked));
  } else if (DME) go();
  else gyroFail('Este aparelho não informa o giroscópio. Seguimos no touchpad.');
}

function onMotion(e) {
  const r = e.rotationRate; if (!r || (r.beta == null && r.gamma == null)) return;
  gyroSeen = true; if (cam.mode !== 'gyro') return;
  const now = performance.now(), dt = gyroLast ? Math.min(0.05, (now - gyroLast) / 1000) : 0; gyroLast = now;
  const ang = ((((screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0) % 360) + 360) % 360;
  const b = r.beta || 0, g = r.gamma || 0;
  // yaw = girar para a direita, pitch = apontar para cima (graus/s). Sinais variam por aparelho: os toggles "Inverter" calibram.
  const [yaw, pitch] = ang === 90 ? [-b, -g] : ang === 270 ? [b, g] : ang === 180 ? [g, -b] : [-g, b];
  const dz = v => (Math.abs(v) < 2 ? 0 : v); // zona morta contra drift
  const fovX = 40 / cam.sens, fovY = fovX * H / W; // graus de giro para atravessar a tela
  moveAim((cam.invX ? -1 : 1) * dz(yaw) * dt / fovX, -(cam.invY ? -1 : 1) * dz(pitch) * dt / fovY);
}
