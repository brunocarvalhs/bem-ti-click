// Som chiptune sintetizado na hora: nenhum arquivo de áudio.
let actx = null;

export function unlockAudio() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch (e) {} }

function noise(t0, dur, freq, gain) {
  const n = Math.floor(actx.sampleRate * dur), buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8; g.gain.value = gain;
  src.connect(f).connect(g).connect(actx.destination); src.start(t0);
}
function tone(t0, freq, dur, gain, type, to) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.linearRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(gain, t0); g.gain.setValueAtTime(gain, t0 + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
const seq = (notes, step, gain, type) => { if (!actx) return; const t = actx.currentTime + 0.02; notes.forEach((f, i) => f && tone(t + i * step, f, step * 0.9, gain, type)); };

export const sfx = {
  shutter() { if (!actx) return; const t = actx.currentTime; noise(t, 0.035, 3200, 0.8); noise(t + 0.06, 0.05, 1800, 0.6); tone(t + 0.12, 150, 0.5, 0.035, 'sawtooth', 120); }, // clique + motor ejetando a foto
  film() { if (!actx) return; const t = actx.currentTime + 0.3; for (let i = 0; i < 6; i++) noise(t + i * 0.06, 0.025, 1500, 0.4); }, // catraca de pacote novo
  perfect() { seq([1047, 1319, 1568, 2093], 0.06, 0.07); },
  good() { seq([784, 1047], 0.07, 0.06); },
  laugh() { seq([698, 587, 698, 587, 659, 523, 587, 466], 0.085, 0.07); }, // risada do Mico
  chirp() { if (!actx) return; const t = actx.currentTime; tone(t, 2400, 0.05, 0.025, 'triangle', 3200); tone(t + 0.08, 2600, 0.05, 0.025, 'triangle', 3400); },
  beep(hi) { seq([hi ? 1568 : 784], 0.14, 0.07); },
  jingle() { seq([523, 659, 784, 0, 659, 784, 1047, 0, 1047], 0.11, 0.07, 'square'); },
};
