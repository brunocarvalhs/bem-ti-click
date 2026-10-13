// Mira do celular: touchpad (opção B) ou giroscópio (opção A), mais os ajustes de sensibilidade.
// cam.x / cam.y vão de 0 a 1 (canto superior esquerdo a inferior direito da TV).
import { W, H } from '../config.js';
import { clamp, store } from '../shared/util.js';

export function loadSettings(cam) {
  Object.assign(cam, { x: 0.5, y: 0.5, mode: 'touch', sens: 1, invX: false, invY: false });
  try { const s = JSON.parse(store.get('oop-set') || '{}'); Object.assign(cam, { sens: s.sens || 1, invX: !!s.invX, invY: !!s.invY }); } catch (e) {}
}

export function saveSettings(cam, s) {
  Object.assign(cam, s);
  store.set('oop-set', JSON.stringify({ sens: cam.sens, invX: cam.invX, invY: cam.invY }));
}

// on: { move(), info(text), mode(m), touch() }. Devolve funções de controle e o "desligar" para o React.
export function createAim(cam, on) {
  const moveAim = (dx, dy) => { cam.x = clamp(cam.x + dx, 0, 1); cam.y = clamp(cam.y + dy, 0, 1); on.move(); };
  const setMode = m => { cam.mode = m; on.mode(m); };
  const gyroFail = msg => { setMode('touch'); on.info(msg); };

  // Opção B — touchpad: movimento relativo, como trackpad de notebook.
  function bindPad(pad) {
    let drag = null;
    const down = e => {
      if (cam.mode !== 'touch') return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      try { pad.setPointerCapture(e.pointerId); } catch (er) {}
      on.touch();
    };
    const move = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const k = Math.min(pad.clientWidth, pad.clientHeight) * 0.9 / cam.sens; // atravessar o lado menor do pad = atravessar a TV
      moveAim((e.clientX - drag.x) / k, (e.clientY - drag.y) / k * (W / H));
      drag.x = e.clientX; drag.y = e.clientY;
    };
    const up = e => { if (drag && e.pointerId === drag.id) drag = null; };
    pad.addEventListener('pointerdown', down); pad.addEventListener('pointermove', move);
    pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
    return () => { pad.removeEventListener('pointerdown', down); pad.removeEventListener('pointermove', move); pad.removeEventListener('pointerup', up); pad.removeEventListener('pointercancel', up); };
  }

  // Opção A — giroscópio: integra a velocidade angular (graus/s) e move a mira, como um air mouse.
  let gyroLast = 0, gyroSeen = false, listening = false;
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

  function enableGyro() {
    if (!window.isSecureContext) return gyroFail('O giroscópio só funciona com HTTPS (veja o README). Seguimos no touchpad.');
    setMode('gyro'); gyroSeen = false; gyroLast = 0;
    const blocked = 'O navegador não liberou o giroscópio. Seguimos no touchpad.';
    const go = () => {
      if (!listening) { addEventListener('devicemotion', onMotion); listening = true; }
      setTimeout(() => { if (!gyroSeen && cam.mode === 'gyro') gyroFail(blocked); }, 1500);
    };
    const DME = window.DeviceMotionEvent;
    if (DME && typeof DME.requestPermission === 'function') { // iOS: precisa vir de um toque
      DME.requestPermission().then(r => (r === 'granted' ? go() : gyroFail('Permissão do giroscópio negada. Seguimos no touchpad.'))).catch(() => gyroFail(blocked));
    } else if (DME) go();
    else gyroFail('Este aparelho não informa o giroscópio. Seguimos no touchpad.');
  }

  const recenter = () => { cam.x = cam.y = 0.5; on.move(); };
  const stop = () => { if (listening) removeEventListener('devicemotion', onMotion); listening = false; };
  return { bindPad, setMode, enableGyro, recenter, stop };
}
