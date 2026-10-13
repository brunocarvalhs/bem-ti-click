// Mico: personagem original, mico-leão-dourado pendurado num balanço de cipó. Quadro 0 = parado, 1 e 2 = rindo.
import { paintGrid } from './pixel.js';

function bakeMico(frame) {
  const w = 28, h = 46, ox = 14, oy = 17, grid = new Array(w * h).fill(null);
  const bob = frame === 2 ? 1 : 0;
  for (let iy = 0; iy < h; iy++) for (let ix = 0; ix < w; ix++) {
    const X = ix - ox + 0.5, Y = iy - oy + 0.5 - bob;
    let col = null;
    const tx = Math.sin(Y * 0.33) * 2 + 1;
    if (Y > 15 && Y < 25 && Math.abs(X - tx) < 1.1) col = '#d97a12';
    if (Y >= 24 && Y < 28 && Math.abs(X - tx) < 2) col = '#f7b23b';
    if ((X / 5) ** 2 + ((Y - 11) / 6.5) ** 2 <= 1) col = '#ef8f1a';
    if (Y > 13 && Y < 19 && Math.abs(Math.abs(X) - 3.5) < 1.2) col = '#d97a12';
    if (Y < 8 && Y > -13 && (Math.abs(X - 5.5 + (Y + 13) * 0.06) < 1.1 || Math.abs(X + 5.5 - (Y + 13) * 0.06) < 1.1)) col = '#d97a12';
    if (Y >= -16 && Y < -12.5 && Math.abs(Math.abs(X) - 5.5) < 1.5) col = '#5a2f1f';
    const r = Math.hypot(X, Y), a = Math.atan2(Y, X);
    if (r <= 8 + Math.sin(a * 7) * 1.3) col = Y < -2 && X < 1 ? '#ffc04d' : '#f29a1f';
    if ((X / 3.8) ** 2 + ((Y - 1) / 4.4) ** 2 <= 1) col = '#7a3f2c';
    grid[iy * w + ix] = col;
  }
  const put = (x, y, col) => { const X = x + ox, Y = y + oy + bob; if (X >= 0 && Y >= 0 && X < w && Y < h) grid[Y * w + X] = col; };
  if (frame === 0) { put(-2, 0, '#111'); put(1, 0, '#111'); put(-1, 3, '#2a0f0f'); put(0, 3, '#2a0f0f'); }
  else {
    for (const [x, y] of [[-3, 0], [-2, -1], [-1, 0], [0, 0], [1, -1], [2, 0]]) put(x, y, '#111');
    const mw = frame === 2 ? 2 : 1;
    for (let y = 2; y <= 3 + mw; y++) for (let x = -mw; x < mw; x++) put(x, y, y === 3 + mw ? '#e05a5a' : '#2a0f0f');
  }
  return { c: paintGrid(grid, w, h, true), ox, oy };
}

export const MICO_SPR = [0, 1, 2].map(bakeMico);
