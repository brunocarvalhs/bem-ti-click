// A viagem: cada lugar tem paisagem, pássaros e ritmo próprios (as metas estão em config.js).
import { LW, LH, paintGrid } from './pixel.js';

export const STAGES = [
  { name: 'Mata Atlântica', short: 'MATA', birds: ['Bem-te-vi', 'Sabiá-laranjeira', 'Tucano-toco', 'Beija-flor', 'Gavião-carijó'], speedK: 1, clouds: 0.9, ground: '#163d24', paint: paintMata },
  { name: 'Rio de Janeiro', short: 'RIO', birds: ['Sabiá-laranjeira', 'Bem-te-vi', 'Beija-flor', 'Tesourão'], speedK: 1.1, clouds: 0.5, ground: '#171717', paint: paintRio },
  { name: 'Sertão nordestino', short: 'SERTÃO', birds: ['Asa-branca', 'Carcará', 'Galo-de-campina', 'Beija-flor'], speedK: 1.2, clouds: 0.3, ground: '#8f5a2e', paint: paintSertao },
  { name: 'Amazônia', short: 'AMAZÔNIA', birds: ['Arara-vermelha', 'Arara-azul', 'Tucano-toco', 'Gavião-real'], speedK: 1.3, clouds: 0.95, ground: '#123a20', paint: paintAmazonia },
];

function bakeCloud(parts) {
  const w = 44, h = 16, grid = new Array(w * h).fill(null);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (const [cx, cy, r] of parts) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) grid[y * w + x] = y > 10 ? '#d6e6f2' : '#ffffff';
  return paintGrid(grid, w, h, false);
}
export const CLOUD_SPR = [bakeCloud([[8, 10, 5], [16, 7, 7], [26, 8, 7], [34, 11, 5]]), bakeCloud([[10, 10, 6], [20, 8, 7], [30, 10, 5]])];

// Pinta a paisagem do lugar i em 320×180 no canvas dado, com ferramentas de pixel art compartilhadas.
export function paintBackdrop(canvas, i) {
  canvas.width = LW; canvas.height = LH;
  const g = canvas.getContext('2d');
  let seed = 11 + i * 7;
  const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const dot = (x, y, col) => rect(x, y, 1, 1, col);
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const sky = bands => bands.forEach(([y0, col], k) => {
    rect(0, y0, LW, (k + 1 < bands.length ? bands[k + 1][0] : 140) - y0, col);
    if (k) for (let x = 0; x < LW; x++) { if (x % 2 === 0) dot(x, y0, bands[k - 1][1]); if (x % 4 === 1) dot(x, y0 + 1, bands[k - 1][1]); } // pontilhado 8 bits
  });
  const blob = (cx, cy, r, col, hi) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) dot(cx + x, cy + y, hi && x + y < -r * 0.6 ? hi : col); };
  const sun = (cx, cy, r, core, ring) => { const R = Math.ceil(r + 3); for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y); if (d <= r) dot(cx + x, cy + y, core); else if (d <= r + 2.5 && (x + y) % 2 === 0) dot(cx + x, cy + y, ring); } }; // passo inteiro: pixel cheio, sem borrar
  const palm = (base, ground, hgt, trunk, trunk2, leaf, leaf2) => {
    for (let y = ground - hgt; y < ground; y++) rect(base + Math.round(Math.sin((ground - y) / hgt * 1.2) * 3), y, 2, 1, y % 4 ? trunk : trunk2);
    const tx = base + Math.round(Math.sin(1.2) * 3) + 1, ty = ground - hgt - 1;
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.5; for (let t = 1; t < 15; t++) dot(Math.round(tx + Math.cos(a) * t), Math.round(ty + Math.sin(a) * t + (t * t) / 26), t % 3 ? leaf : leaf2); }
  };
  STAGES[i].paint({ rect, dot, rnd, sky, blob, sun, palm });
}

function paintMata({ rect, dot, rnd, sky, blob, sun, palm }) {
  sky([[0, '#3a86d8'], [28, '#4f9de6'], [54, '#69b3ef'], [78, '#8cc8f3'], [96, '#b3dcf3'], [108, '#e4e6cc'], [116, '#f6d9a0']]);
  sun(262, 38, 10.5, '#fff4c2', '#ffe28a');
  for (let x = 0; x < LW; x++) { // Serra do Mar
    const h1 = 104 + Math.round(8 * Math.sin(x * 0.04 + 0.5) + 4 * Math.sin(x * 0.11 + 2));
    rect(x, h1, 1, 60, '#7aa7ad'); dot(x, h1, '#a2c6c6');
    const h2 = 121 + Math.round(5 * Math.sin(x * 0.06 + 1.2) + 3 * Math.sin(x * 0.17));
    rect(x, h2, 1, 60, '#55915f'); dot(x, h2, '#70ad72');
  }
  for (let x = -4; x < LW + 8; x += 9 + Math.floor(rnd() * 7)) blob(x, 138 - Math.floor(rnd() * 4), 6 + Math.floor(rnd() * 4), '#2f7040', '#3f8a4c');
  for (let x = -4; x < LW + 8; x += 8 + Math.floor(rnd() * 6)) blob(x, 152 - Math.floor(rnd() * 3), 7 + Math.floor(rnd() * 4), '#225a33', '#2f7040');
  rect(0, 156, LW, 24, '#1b4a2b'); rect(0, 168, LW, 12, '#163d24');
  for (let x = 0; x < LW; x += 2) dot(x + ((x / 2) % 2), 167, '#163d24');
  for (const base of [28, 246]) palm(base, 160, 56, '#5b4a32', '#3f3222', '#2c6e3a', '#45924f'); // palmeiras-juçara
}

function paintRio({ rect, dot, rnd, sky, sun, palm }) {
  sky([[0, '#33366f'], [22, '#4e4a96'], [44, '#7b55a3'], [64, '#b5639c'], [82, '#e57f73'], [98, '#f4a762'], [110, '#fbcf86']]);
  sun(24, 120, 12, '#ffe3a3', '#ffbf6b'); // pôr do sol na baía
  const hill = '#2b2743', statue = '#efeaf6';
  for (let x = 40; x < 200; x++) { const d = x - 112, y0 = Math.round(64 + (d < 0 ? -d * 1.05 : d * 1.7) + Math.sin(x * 0.7)); if (y0 < 132) rect(x, y0, 1, 132 - y0, hill); } // Corcovado
  rect(108, 63, 8, 3, hill);
  rect(111, 47, 2, 2, statue); rect(111, 49, 2, 13, statue); rect(105, 53, 14, 2, statue); rect(110, 57, 4, 5, statue); rect(109, 62, 6, 1, statue); // Cristo Redentor de braços abertos
  const loaf = (cx, w, hgt) => { for (let x = cx - w; x <= cx + w; x++) { const t = (x - cx) / w, y0 = Math.round(132 - hgt * Math.pow(Math.max(0, 1 - t * t), 0.35)); rect(x, y0, 1, 132 - y0, hill); } };
  loaf(222, 18, 26); loaf(262, 26, 60); // Morro da Urca e Pão de Açúcar
  for (let k = 0; k <= 38; k++) dot(224 + k, Math.round(106 - k * 0.84), '#1a1830'); // cabo do bondinho
  rect(242, 90, 3, 2, '#f2c14e');
  for (let x = 0; x < LW; x += 4 + Math.floor(rnd() * 4)) { // prédios da orla com janelas acesas
    if (x > 196 && x < 292) continue;
    const bh = 4 + Math.floor(rnd() * 12), bw = 3 + Math.floor(rnd() * 4);
    rect(x, 132 - bh, bw, bh, '#1d1a30');
    for (let wy = 133 - bh; wy < 131; wy += 2) for (let wx = x + 1; wx < x + bw - 1; wx += 2) if (rnd() < 0.45) dot(wx, wy, '#ffd67a');
  }
  rect(0, 132, LW, 28, '#2c4f7c');
  for (let y = 134; y < 160; y += 3) for (let x = (y * 7) % 11; x < LW; x += 9 + (y % 5)) rect(x, y, 3, 1, '#3f6a9a');
  for (let y = 133; y < 160; y += 2) rect(16 + Math.floor(rnd() * 10), y, 3 + Math.floor(rnd() * 4), 1, '#f7b267'); // reflexo do sol
  rect(0, 160, LW, 10, '#e2bd85');
  for (let y = 170; y < LH; y++) for (let x = 0; x < LW; x++) dot(x, y, Math.floor((y + Math.sin(x * 0.25) * 2.5) / 2.5) % 2 ? '#1a1a1a' : '#f1ede4'); // calçadão de Copacabana
  palm(26, 170, 48, '#5b4a32', '#3f3222', '#1f5a33', '#2f7d3f'); palm(296, 170, 54, '#5b4a32', '#3f3222', '#1f5a33', '#2f7d3f');
}

function paintSertao({ rect, dot, rnd, sky, sun }) {
  sky([[0, '#3e9ad8'], [30, '#62b0e3'], [58, '#93c8e6'], [84, '#cfe2dc'], [102, '#f3e3b2'], [114, '#f6d18a']]);
  sun(250, 34, 13, '#fffbe0', '#fff0a8'); // sol a pino
  const mesa = (x0, x1, top, col, edge) => { for (let x = x0; x <= x1; x++) { const y0 = Math.round(top + Math.max(0, x0 + 10 - x, x - (x1 - 10)) * 1.3); rect(x, y0, 1, 140 - y0, col); dot(x, y0, edge); } };
  mesa(-10, 150, 98, '#c48a5e', '#dcaa7c'); mesa(170, 340, 108, '#b07850', '#c9926a'); // chapadas no horizonte
  rect(0, 130, LW, 50, '#d9a05e'); rect(0, 152, LW, 28, '#c98c4c');
  for (let k = 0; k < 26; k++) { let x = Math.floor(rnd() * LW), y = 134 + Math.floor(rnd() * 44); for (let s = 0; s < 6; s++) { dot(x, y, '#9a5f30'); x += rnd() < 0.5 ? 0 : 2; y += rnd() < 0.6 ? 1 : 0; } } // chão rachado
  for (const bx of [80, 160, 205, 268]) for (let k = 0; k < 6; k++) { // garranchos secos
    const ex = bx + Math.floor(rnd() * 14) - 7, ey = 128 + Math.floor(rnd() * 8);
    for (let t = 0; t <= 10; t++) dot(Math.round(bx + (ex - bx) * t / 10), Math.round(142 + (ey - 142) * t / 10), '#7a6a55');
  }
  const cactus = (x, base, hgt) => { // mandacaru
    const arm1 = base - Math.round(hgt * 0.55), arm2 = base - Math.round(hgt * 0.4), up1 = Math.round(hgt * 0.3), up2 = Math.round(hgt * 0.25);
    rect(x, base - hgt, 4, hgt, '#3f8a4c'); rect(x + 1, base - hgt, 1, hgt, '#5aa65f'); rect(x + 3, base - hgt, 1, hgt, '#2c6b39'); rect(x + 1, base - hgt - 1, 2, 1, '#3f8a4c');
    rect(x - 6, arm1, 6, 3, '#3f8a4c'); rect(x - 6, arm1 - up1, 3, up1, '#3f8a4c'); rect(x - 5, arm1 - up1, 1, up1, '#5aa65f');
    rect(x + 4, arm2, 6, 3, '#3f8a4c'); rect(x + 7, arm2 - up2, 3, up2, '#3f8a4c'); rect(x + 8, arm2 - up2, 1, up2, '#5aa65f');
  };
  cactus(34, 172, 60); cactus(232, 166, 48); cactus(292, 176, 66); cactus(128, 160, 22);
}

function paintAmazonia({ rect, dot, rnd, sky, blob }) {
  sky([[0, '#5d9bb3'], [28, '#7cb0c2'], [56, '#a0c6cf'], [84, '#c4dcd6'], [104, '#dfe9de']]);
  for (let x = -4; x < LW + 8; x += 7 + Math.floor(rnd() * 5)) blob(x, 114 - Math.floor(rnd() * 4), 5 + Math.floor(rnd() * 3), '#5f8f6c'); // floresta ao longe
  for (let y = 100; y < 108; y++) for (let x = y % 2; x < LW; x += 2) if (rnd() < 0.5) dot(x, y, '#eef3ec'); // neblina
  for (let x = -4; x < LW + 8; x += 6 + Math.floor(rnd() * 5)) blob(x, 122 - Math.floor(rnd() * 3), 6 + Math.floor(rnd() * 3), '#2f6b40', '#3f8a4c');
  const samauma = (x, top) => { // árvore gigante acima da copa
    rect(x - 1, top, 3, 126 - top, '#6e5a44'); rect(x - 4, 120, 2, 6, '#6e5a44'); rect(x + 3, 120, 2, 6, '#6e5a44');
    for (let y = -8; y <= 6; y++) for (let dx = -28; dx <= 28; dx++) if ((dx / 28) ** 2 + (y / 8) ** 2 <= 1) dot(x + dx, top + y, y < -3 && dx < 0 ? '#46924f' : '#2e6b3a');
  };
  samauma(70, 70); samauma(248, 64);
  for (let x = 0; x < LW; x++) for (let y = 126; y < 152; y++) dot(x, y, (x - 150) / 30 + Math.sin(y * 0.9 + x * 0.2) * 0.4 < 0 ? '#2a2620' : '#a07c4a'); // encontro das águas: Rio Negro e Solimões
  for (let y = 128; y < 150; y += 3) for (let x = (y * 5) % 13; x < LW; x += 14) rect(x, y, 4, 1, 'rgba(255,255,255,.18)');
  rect(112, 137, 14, 2, '#5b3a22'); rect(114, 136, 10, 1, '#7a5030'); rect(119, 132, 1, 4, '#222222'); dot(119, 131, '#d9a77a'); rect(121, 133, 1, 5, '#7a5030'); // canoa
  rect(0, 150, LW, 30, '#174a28');
  for (let k = 0; k < 70; k++) blob(Math.floor(rnd() * LW), 154 + Math.floor(rnd() * 26), 3 + Math.floor(rnd() * 4), ['#1d5a2e', '#2f7d3f', '#3f9a4c'][k % 3]);
  for (let k = 0; k < 14; k++) { const x = Math.floor(rnd() * LW), y = 152 + Math.floor(rnd() * 20); rect(x, y, 2, 3, '#e23c3c'); dot(x, y - 1, '#f5c518'); } // helicônias
  for (const vx of [6, 13, 307, 314]) { // cipós
    const len = 24 + Math.floor(rnd() * 34);
    for (let y = 0; y < len; y++) dot(vx + Math.round(Math.sin(y * 0.3)), y, '#2e6b3a');
    for (let y = 4; y < len; y += 5) dot(vx + 1 + Math.round(Math.sin(y * 0.3)), y, '#46924f');
  }
}
