// Espécies brasileiras e o "forno" que transforma os parâmetros de cada uma em sprite.
import { paintGrid } from './pixel.js';

// u = tamanho, beak/tail = comprimentos, w = peso no sorteio, flap = batidas de asa por segundo.
export const SPECIES = [
  { name: 'Bem-te-vi', u: 1.25, beak: 3, beakH: 0.9, tail: 5, speed: [230, 330], body: '#7a5a33', wing: '#5e4527', belly: '#ffd31a', head: '#1a1a1a', brow: '#ffffff', beakC: '#1a1a1a', flap: 2.6, w: 5 },
  { name: 'Sabiá-laranjeira', u: 1.2, beak: 3, beakH: 0.8, tail: 6, speed: [190, 290], body: '#8d7558', wing: '#6f5b43', belly: '#e0781e', head: '#8d7558', beakC: '#d4a62a', flap: 2.4, w: 5 },
  { name: 'Tucano-toco', u: 1.45, beak: 12, beakH: 2.2, tail: 6, speed: [160, 240], body: '#151515', wing: '#2b2b2b', throat: '#fbf3cf', head: '#151515', beakC: '#ff8a1f', tip: '#151515', flap: 1.8, w: 3 },
  { name: 'Arara-azul', u: 1.55, beak: 3, beakH: 1.5, tail: 15, tailW: 1.1, speed: [180, 270], body: '#2156d1', wing: '#173f9e', head: '#2a62e0', ring: '#ffd23f', beakC: '#1a1a1a', flap: 1.6, w: 2 },
  { name: 'Beija-flor', u: 0.7, beak: 6, beakH: 0.35, tail: 3, speed: [320, 470], body: '#1fa673', wing: '#c9f2de', belly: '#bdf0d6', head: '#14905f', beakC: '#1a1a1a', flap: 12, hover: true, w: 3 },
  { name: 'Gavião-carijó', u: 1.45, beak: 2.5, beakH: 1.1, tail: 7, speed: [300, 420], body: '#7a6a5a', wing: '#5f5245', belly: '#e3d6c2', bars: '#9c8670', head: '#6c5f51', beakC: '#f0bf3f', flap: 1.4, w: 1 },
  { name: 'Tesourão', u: 1.4, beak: 4, beakH: 0.7, tail: 9, fork: true, wingL: 1.5, speed: [220, 320], body: '#1c1c22', wing: '#2a2a33', throat: '#d8323a', head: '#1c1c22', beakC: '#8a8a95', flap: 1.2, w: 3 },
  { name: 'Asa-branca', u: 1.2, beak: 2, beakH: 0.6, tail: 6, speed: [260, 360], body: '#8f8a94', wing: '#a8a3ad', wingBand: '#f4f2f0', belly: '#b39aa8', head: '#a5899a', beakC: '#2a2a2a', flap: 3, w: 5 },
  { name: 'Carcará', u: 1.4, beak: 3, beakH: 1.2, tail: 7, speed: [220, 320], body: '#3b2e24', wing: '#2e241c', belly: '#d9cdb4', bars: '#7a6650', head: '#efe6cf', cap: '#1d1712', beakC: '#e8c27a', flap: 1.6, w: 3 },
  { name: 'Galo-de-campina', u: 1.05, beak: 2.5, beakH: 0.8, tail: 6, speed: [230, 330], body: '#6f737a', wing: '#585c63', belly: '#f2f2f2', head: '#d8262b', beakC: '#d9d9d9', flap: 2.8, w: 4 },
  { name: 'Arara-vermelha', u: 1.55, beak: 3, beakH: 1.6, tail: 16, tailW: 1.1, speed: [180, 270], body: '#d7262b', wing: '#2a5bd1', wingBand: '#f5c518', head: '#e03030', ring: '#f4efe6', beakC: '#efe6d6', flap: 1.6, w: 4 },
  { name: 'Gavião-real', u: 1.75, beak: 3, beakH: 1.4, tail: 8, speed: [200, 280], body: '#3c3c42', wing: '#2c2c32', belly: '#ecebe6', head: '#a3a3a8', cap: '#2a2a2e', beakC: '#2a2a2e', flap: 1.2, w: 1 },
];

// Sorteia uma espécie entre as do lugar, respeitando o peso w.
export function pickSpecies(names) {
  const list = SPECIES.filter(s => names.includes(s.name));
  let r = Math.random() * list.reduce((s, x) => s + x.w, 0);
  for (const s of list) if ((r -= s.w) < 0) return s;
  return list[0];
}

// Sprite de pássaro virado para a direita; (0,0) do sprite = centro visual (onde a pontuação mede).
function bakeBird(sp, frame) {
  const u = sp.u, L = sp.beak, T = sp.tail, wl = sp.wingL || 1;
  const xa = Math.floor(-7 * u * wl - T - 3), xb = Math.ceil(8 * u + L + 3), ya = Math.floor(-8 * u * wl - 4), yb = Math.ceil(6 * u * wl + 3);
  const w = xb - xa, h = yb - ya, grid = new Array(w * h).fill(null);
  const ang = [0.9, 0.05, -0.65][frame], ca = Math.cos(ang), sa = Math.sin(ang);
  for (let iy = 0; iy < h; iy++) for (let ix = 0; ix < w; ix++) {
    const x = ix + xa + 0.5 + u, y = iy + ya + 0.5 - 0.8 * u;
    let col = null;
    const tw = (sp.tailW || 1.5) * u * 0.8;
    if (x < -4 * u && x > -4 * u - T) {
      const k = (-4 * u - x) / T, dy = Math.abs(y + 0.3 * u);
      if (dy <= tw * (1 + k * 0.9) && !(sp.fork && k > 0.35 && dy < tw * k * 1.4)) col = sp.body; // fork = cauda em tesoura
    }
    const bx = x / (6 * u), by = y / (3.5 * u), inBody = bx * bx + by * by <= 1;
    if (inBody) col = sp.body;
    if (inBody && sp.belly) { const ex = (x - 1.2 * u) / (4.6 * u), ey = (y - 1.6 * u) / (2.2 * u); if (ex * ex + ey * ey <= 1) col = sp.bars && Math.floor(x + 50) % 3 === 0 ? sp.bars : sp.belly; }
    const hx = x - 5 * u, hy = y + 2.3 * u, inHead = hx * hx + hy * hy <= (3.1 * u) ** 2;
    if (inHead) col = sp.head;
    if (inHead && sp.throat && hy > 0 && hx > -u) col = sp.throat;
    if (inHead && sp.brow && Math.abs(hy + 1.1 * u) <= 0.5 && hx > -2.2 * u) col = sp.brow;
    if (inHead && sp.cap && hy < -1.2 * u) col = sp.cap;
    const b0 = 7.2 * u;
    if (x >= b0 && x <= b0 + L) { const t = (x - b0) / L; if (Math.abs(y - (-2.1 * u + t * 0.9 * u)) <= sp.beakH * u * (1 - t * 0.8) + 0.5) col = sp.tip && t > 0.85 ? sp.tip : sp.beakC; }
    const sx = x + 0.5 * u, sy = y + 1.4 * u, wx = sx * ca + sy * sa, wy = -sx * sa + sy * ca, qx = (wx + 3.2 * u * wl) / (4.3 * u * wl), qy = wy / (1.5 * u);
    if (qx * qx + qy * qy <= 1) col = sp.wingBand && qy < -0.35 ? sp.wingBand : sp.wing;
    grid[iy * w + ix] = col;
  }
  const put = (sxp, syp, col) => { const ix = Math.round(sxp - u - xa - 0.5), iy = Math.round(syp + 0.8 * u - ya - 0.5); if (ix >= 0 && iy >= 0 && ix < w && iy < h) grid[iy * w + ix] = col; };
  if (sp.ring) { put(5.2 * u, -2.9 * u, sp.ring); put(6 * u, -2.2 * u, sp.ring); put(7 * u, -1.2 * u, sp.ring); }
  if (u >= 1) { put(6 * u, -2.9 * u, '#ffffff'); put(6 * u + 1, -2.9 * u, '#111111'); } else put(6 * u, -2.9 * u, '#111111');
  return { c: paintGrid(grid, w, h, true), ox: -xa, oy: -ya };
}

// Espécie -> 3 quadros de asa (cima, meio, baixo).
export const BIRD_SPR = new Map(SPECIES.map(sp => [sp, [0, 1, 2].map(f => bakeBird(sp, f))]));
