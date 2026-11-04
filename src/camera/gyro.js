// Conta do giroscópio, sem navegador (testada em test/gyro.test.js).
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = v => { const l = Math.hypot(...v); return l ? v.map(c => c / l) : null; };

// Velocidade angular do aparelho (graus/s) → giro para a direita (yaw) e para cima (pitch), em graus/s.
// grav: accelerationIncludingGravity (aponta para cima). Com ela, o "vertical" é o do mundo, então a mira
// responde igual com o celular em pé, inclinado ou deitado. Sem ela, usa o topo da tela como vertical.
// angle: screen.orientation.angle (0, 90, 180, 270).
export function gyroToAim(rate, grav, angle) {
  const w = [rate.beta || 0, rate.gamma || 0, rate.alpha || 0]; // giro em torno dos eixos x, y, z do aparelho
  const a = angle * Math.PI / 180;
  const top = [Math.sin(a), Math.cos(a), 0], right = [Math.cos(a), -Math.sin(a), 0]; // topo e lado direito da tela
  let up = grav && norm([grav.x || 0, grav.y || 0, grav.z || 0]);
  if (!up) up = top;
  else if (dot(up, top) + up[2] < 0) up = up.map(c => -c); // alguns iPhones mandam a gravidade com sinal trocado
  // eixo do "apontar para cima": o lado direito da tela, deitado na horizontal
  const r = dot(right, up), h = norm(right.map((c, i) => c - r * up[i]));
  return { yaw: -dot(w, up), pitch: dot(w, h && Math.abs(r) < 0.95 ? h : right) };
}

// Zona morta suave: corta o tremor da mão sem "travar e pular" nos movimentos lentos.
export const deadzone = (v, z = 1.5) => Math.sign(v) * Math.max(0, Math.abs(v) - z);
