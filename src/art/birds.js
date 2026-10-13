// Espécies brasileiras e o "forno" que transforma os parâmetros de cada uma em sprite.
import { paintGrid } from './pixel.js';
import { rarityOf } from '../core/rules.js';

// u = tamanho, beak/tail = comprimentos, flap = batidas de asa por segundo, rarity = chave de RARITY (core/rules.js).
// Extras opcionais: crest (topete) + crestAt [x, y, raio x, raio y] em u, legs (pernas esticadas no voo), tailC (cor da cauda).
export const SPECIES = [
  // Brasil
  { name: 'Bem-te-vi', rarity: 'comum', u: 1.25, beak: 3, beakH: 0.9, tail: 5, speed: [230, 330], body: '#7a5a33', wing: '#5e4527', belly: '#ffd31a', head: '#1a1a1a', brow: '#ffffff', beakC: '#1a1a1a', flap: 2.6 },
  { name: 'Sabiá-laranjeira', rarity: 'comum', u: 1.2, beak: 3, beakH: 0.8, tail: 6, speed: [190, 290], body: '#8d7558', wing: '#6f5b43', belly: '#e0781e', head: '#8d7558', beakC: '#d4a62a', flap: 2.4 },
  { name: 'Tucano-toco', rarity: 'incomum', u: 1.45, beak: 12, beakH: 2.2, tail: 6, speed: [160, 240], body: '#151515', wing: '#2b2b2b', throat: '#fbf3cf', head: '#151515', beakC: '#ff8a1f', tip: '#151515', flap: 1.8 },
  { name: 'Arara-azul', rarity: 'rara', u: 1.55, beak: 3, beakH: 1.5, tail: 15, tailW: 1.1, speed: [180, 270], body: '#2156d1', wing: '#173f9e', head: '#2a62e0', ring: '#ffd23f', beakC: '#1a1a1a', flap: 1.6 },
  { name: 'Beija-flor', rarity: 'incomum', u: 0.7, beak: 6, beakH: 0.35, tail: 3, speed: [320, 470], body: '#1fa673', wing: '#c9f2de', belly: '#bdf0d6', head: '#14905f', beakC: '#1a1a1a', flap: 12, hover: true },
  { name: 'Gavião-carijó', rarity: 'rara', u: 1.45, beak: 2.5, beakH: 1.1, tail: 7, speed: [300, 420], body: '#7a6a5a', wing: '#5f5245', belly: '#e3d6c2', bars: '#9c8670', head: '#6c5f51', beakC: '#f0bf3f', flap: 1.4 },
  { name: 'Tesourão', rarity: 'incomum', u: 1.4, beak: 4, beakH: 0.7, tail: 9, fork: true, wingL: 1.5, speed: [220, 320], body: '#1c1c22', wing: '#2a2a33', throat: '#d8323a', head: '#1c1c22', beakC: '#8a8a95', flap: 1.2 },
  { name: 'Asa-branca', rarity: 'comum', u: 1.2, beak: 2, beakH: 0.6, tail: 6, speed: [260, 360], body: '#8f8a94', wing: '#a8a3ad', wingBand: '#f4f2f0', belly: '#b39aa8', head: '#a5899a', beakC: '#2a2a2a', flap: 3 },
  { name: 'Carcará', rarity: 'incomum', u: 1.4, beak: 3, beakH: 1.2, tail: 7, speed: [220, 320], body: '#3b2e24', wing: '#2e241c', belly: '#d9cdb4', bars: '#7a6650', head: '#efe6cf', cap: '#1d1712', beakC: '#e8c27a', flap: 1.6 },
  { name: 'Galo-de-campina', rarity: 'comum', u: 1.05, beak: 2.5, beakH: 0.8, tail: 6, speed: [230, 330], body: '#6f737a', wing: '#585c63', belly: '#f2f2f2', head: '#d8262b', beakC: '#d9d9d9', flap: 2.8 },
  { name: 'Arara-vermelha', rarity: 'incomum', u: 1.55, beak: 3, beakH: 1.6, tail: 16, tailW: 1.1, speed: [180, 270], body: '#d7262b', wing: '#2a5bd1', wingBand: '#f5c518', head: '#e03030', ring: '#f4efe6', beakC: '#efe6d6', flap: 1.6 },
  { name: 'Gavião-real', rarity: 'lendaria', u: 1.75, beak: 3, beakH: 1.4, tail: 8, speed: [200, 280], body: '#3c3c42', wing: '#2c2c32', belly: '#ecebe6', head: '#a3a3a8', cap: '#2a2a2e', beakC: '#2a2a2e', flap: 1.2 },
  // Peru
  { name: 'Tico-tico', rarity: 'comum', u: 0.95, beak: 2, beakH: 0.6, tail: 5, speed: [240, 340], body: '#8a6e52', wing: '#6b5440', belly: '#d9d2c4', head: '#8f8f8f', cap: '#2f2f2f', brow: '#dcdcdc', beakC: '#2a2a2a', flap: 3 },
  { name: 'Beija-flor-gigante', rarity: 'incomum', u: 0.95, beak: 6, beakH: 0.4, tail: 4, speed: [280, 400], body: '#7d8a4c', wing: '#9aa070', belly: '#c98b4f', head: '#6f7a45', beakC: '#1a1a1a', flap: 9, hover: true },
  { name: 'Galo-da-serra', rarity: 'rara', u: 1.25, beak: 2, beakH: 0.9, tail: 5, speed: [200, 300], body: '#e2421f', wing: '#1c1c1c', wingBand: '#8c8c8c', head: '#f0521f', crest: '#f46a2a', crestAt: [6.2, -3.8, 2.2, 2], beakC: '#e8c070', flap: 2.4 },
  { name: 'Condor-andino', rarity: 'lendaria', u: 1.8, beak: 2.5, beakH: 1.2, tail: 6, wingL: 1.5, speed: [150, 220], body: '#1c1c1c', wing: '#262626', wingBand: '#e8e8e8', head: '#b06a5c', throat: '#f2f2f2', beakC: '#d8c8a8', flap: 0.8 },
  // Quênia
  { name: 'Estorninho-soberbo', rarity: 'comum', u: 1.05, beak: 2.5, beakH: 0.7, tail: 5, speed: [240, 340], body: '#1f5fa8', wing: '#1b4f8f', belly: '#e0782a', head: '#1a2f66', ring: '#f2f2f2', beakC: '#1a1a1a', flap: 3 },
  { name: 'Flamingo', rarity: 'incomum', u: 1.35, beak: 3, beakH: 1, tail: 3, wingL: 1.3, speed: [220, 300], body: '#f29bb3', wing: '#ef7e9e', wingBand: '#1a1a1a', head: '#f5a8bd', beakC: '#2a2a2a', legs: '#e5677f', flap: 2.2 },
  { name: 'Rolieiro-de-peito-lilás', rarity: 'rara', u: 1.15, beak: 3, beakH: 0.9, tail: 8, fork: true, speed: [240, 340], body: '#3a7fc2', wing: '#2a5fb0', wingBand: '#5ec3e6', throat: '#c08ad8', head: '#7fae5e', beakC: '#1a1a1a', flap: 2.6 },
  { name: 'Águia-pesqueira', rarity: 'lendaria', u: 1.75, beak: 3, beakH: 1.3, tail: 6, speed: [190, 270], body: '#6b3b22', wing: '#1f1f1f', head: '#f5f2ea', throat: '#f5f2ea', beakC: '#f0c040', tip: '#1a1a1a', flap: 1.1 },
  // Japão
  { name: 'Mejiro', rarity: 'comum', u: 0.75, beak: 2, beakH: 0.45, tail: 3, speed: [300, 420], body: '#8fae3a', wing: '#7a9632', belly: '#e7e2a0', head: '#a4bf3f', ring: '#ffffff', beakC: '#2a2a2a', flap: 6 },
  { name: 'Martim-pescador', rarity: 'incomum', u: 1, beak: 5, beakH: 0.7, tail: 2, speed: [320, 440], body: '#1f8fc9', wing: '#1a6fa8', belly: '#e8822a', head: '#1f8fc9', throat: '#f2f2f2', beakC: '#1a1a1a', flap: 5 },
  { name: 'Faisão-verde', rarity: 'rara', u: 1.3, beak: 2, beakH: 0.8, tail: 14, tailW: 0.9, tailC: '#8a7a52', speed: [220, 300], body: '#2f5a3a', wing: '#6b5a3a', belly: '#26483a', head: '#1f4f6a', ring: '#d8262b', beakC: '#d8c070', flap: 3 },
  { name: 'Grou-japonês', rarity: 'lendaria', u: 1.7, beak: 4, beakH: 0.8, tail: 4, wingL: 1.4, speed: [170, 240], body: '#f5f5f2', wing: '#f5f5f2', wingBand: '#1a1a1a', head: '#1a1a1a', cap: '#d8262b', beakC: '#c8c0a0', legs: '#2a2a2a', flap: 1.3 },
  // Austrália
  { name: 'Periquito-australiano', rarity: 'comum', u: 0.8, beak: 1.5, beakH: 0.6, tail: 6, speed: [300, 420], body: '#5cc23a', wing: '#4a8a2a', wingBand: '#f2e04a', head: '#f2e04a', belly: '#6fd04a', beakC: '#e8d8a0', flap: 5 },
  { name: 'Cacatua-de-crista-amarela', rarity: 'incomum', u: 1.4, beak: 2.5, beakH: 1.4, tail: 6, speed: [200, 290], body: '#f7f7f2', wing: '#ecece4', head: '#fbfbf6', crest: '#f5d000', beakC: '#2a2a2a', flap: 2 },
  { name: 'Cucaburra', rarity: 'rara', u: 1.25, beak: 5, beakH: 1.1, tail: 6, speed: [220, 310], body: '#8a6a48', wing: '#6b5236', wingBand: '#5a9ad0', belly: '#efe8da', head: '#efe8da', brow: '#5a4430', beakC: '#3a3a3a', flap: 2.4 },
  { name: 'Cacatua-negra', rarity: 'lendaria', u: 1.55, beak: 2.5, beakH: 1.4, tail: 9, tailC: '#c8261b', speed: [180, 260], body: '#1e1e1e', wing: '#262626', head: '#222222', crest: '#2e2e2e', beakC: '#4a4a4a', flap: 1.6 },
];

// Sorteia uma espécie entre as do lugar: quanto mais rara, menos aparece.
export function pickSpecies(names) {
  const list = SPECIES.filter(s => names.includes(s.name));
  let r = Math.random() * list.reduce((s, x) => s + rarityOf(x.rarity).w, 0);
  for (const s of list) if ((r -= rarityOf(s.rarity).w) < 0) return s;
  return list[0];
}

// Sprite de pássaro virado para a direita; (0,0) do sprite = centro visual (onde a pontuação mede).
function bakeBird(sp, frame) {
  const u = sp.u, L = sp.beak, T = sp.tail, wl = sp.wingL || 1, legL = sp.legs ? 5 * u : 0;
  const [cx, cy, crx, cry] = (sp.crestAt || [4.4, -5.2, 1.3, 2]).map(v => v * u);
  const xa = Math.floor(-7 * u * wl - T - 3 - legL), xb = Math.ceil(8 * u + L + 3), ya = Math.floor(-8 * u * wl - 4), yb = Math.ceil(6 * u * wl + 3);
  const w = xb - xa, h = yb - ya, grid = new Array(w * h).fill(null);
  const ang = [0.9, 0.05, -0.65][frame], ca = Math.cos(ang), sa = Math.sin(ang);
  for (let iy = 0; iy < h; iy++) for (let ix = 0; ix < w; ix++) {
    const x = ix + xa + 0.5 + u, y = iy + ya + 0.5 - 0.8 * u;
    let col = null;
    if (sp.legs && x < -3 * u && x > -4 * u - T - legL && y >= 1.6 * u && y < 1.6 * u + 1) col = sp.legs; // pernas esticadas para trás
    const tw = (sp.tailW || 1.5) * u * 0.8;
    if (x < -4 * u && x > -4 * u - T) {
      const k = (-4 * u - x) / T, dy = Math.abs(y + 0.3 * u);
      if (dy <= tw * (1 + k * 0.9) && !(sp.fork && k > 0.35 && dy < tw * k * 1.4)) col = sp.tailC || sp.body; // fork = cauda em tesoura
    }
    const bx = x / (6 * u), by = y / (3.5 * u), inBody = bx * bx + by * by <= 1;
    if (inBody) col = sp.body;
    if (inBody && sp.belly) { const ex = (x - 1.2 * u) / (4.6 * u), ey = (y - 1.6 * u) / (2.2 * u); if (ex * ex + ey * ey <= 1) col = sp.bars && Math.floor(x + 50) % 3 === 0 ? sp.bars : sp.belly; }
    const hx = x - 5 * u, hy = y + 2.3 * u, inHead = hx * hx + hy * hy <= (3.1 * u) ** 2;
    if (inHead) col = sp.head;
    if (inHead && sp.throat && hy > 0 && hx > -u) col = sp.throat;
    if (inHead && sp.brow && Math.abs(hy + 1.1 * u) <= 0.5 && hx > -2.2 * u) col = sp.brow;
    if (inHead && sp.cap && hy < -1.2 * u) col = sp.cap;
    if (sp.crest && ((x - cx) / crx) ** 2 + ((y - cy) / cry) ** 2 <= 1) col = sp.crest; // topete
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
