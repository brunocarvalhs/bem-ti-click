// Desenho da TV: cena em 320×180, ampliada para a tela sem suavização, com textos nítidos por cima.
import { W, H } from '../config.js';
import { LW, LH, PX, FLAP, drawSprite, pxBrackets } from '../art/pixel.js';
import { SPECIES, BIRD_SPR } from '../art/birds.js';
import { MICO_SPR } from '../art/mico.js';
import { STAGES, CLOUD_SPR, paintBackdrop } from '../art/stages.js';
import { $, clamp } from '../shared/util.js';
import { rarityOf } from '../core/rules.js';
import { tv, mico, view, gfx } from './state.js';
import { sendTo } from './room.js';

export function initScene(canvas) {
  gfx.canvas = canvas; gfx.ctx = canvas.getContext('2d');
  gfx.lo = document.createElement('canvas'); gfx.lo.width = LW; gfx.lo.height = LH; gfx.lc = gfx.lo.getContext('2d');
  gfx.backdrop = document.createElement('canvas');
  try { document.fonts && document.fonts.load('16px "Press Start 2P"'); } catch (e) {}
  showStage(0); sizeCanvas();
  addEventListener('resize', sizeCanvas);
}

export const showStage = i => paintBackdrop(gfx.backdrop, i);

function sizeCanvas() {
  const { canvas } = gfx, dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  const fit = Math.min(canvas.width / LW, canvas.height / LH);
  view.S = Math.floor(fit) >= 1 && Math.floor(fit) / fit > 0.85 ? Math.floor(fit) : fit; // escala inteira quando sobra pouca borda: pixels iguais
  view.s = view.S / PX;
  view.ox = Math.round((canvas.width - LW * view.S) / 2); view.oy = Math.round((canvas.height - LH * view.S) / 2);
}

// Ponto da tela (mouse) -> coordenada do mundo 1600×900.
export function toWorld(clientX, clientY) {
  const r = gfx.canvas.getBoundingClientRect(), k = gfx.canvas.width / r.width;
  return { x: clamp(((clientX - r.left) * k - view.ox) / view.s, 0, W), y: clamp(((clientY - r.top) * k - view.oy) / view.s, 0, H) };
}

// Foto quadrada de filme instantâneo: 64×64 pixels da cena, enviada ao celular de quem acertou.
function doCrops() {
  for (const k of tv.crops) {
    const live = tv.birds.find(b => b.id === k.id);
    const cx = clamp(Math.round((live ? live.x + k.off.x : k.aim.x) / PX), 32, LW - 32), cy = clamp(Math.round((live ? live.y + k.off.y : k.aim.y) / PX), 32, LH - 32);
    const t = document.createElement('canvas'); t.width = t.height = 64;
    t.getContext('2d').drawImage(gfx.lo, cx - 32, cy - 32, 64, 64, 0, 0, 64, 64);
    const img = t.toDataURL('image/png');
    if (!k.pl.best || k.d < k.pl.best.d) k.pl.best = { d: k.d, label: k.label, sp: k.sp, img };
    sendTo(k.pl.key, { t: 'photo', n: k.n, img, cap: `${k.sp} · ${rarityOf(k.rar).name}` });
  }
  tv.crops.length = 0;
}

function hiText(text, lx, ly, size, color) {
  const { ctx } = gfx, S = view.S, x = view.ox + lx * S, y = view.oy + ly * S;
  ctx.font = `${Math.max(8, Math.round(size * S))}px "Press Start 2P", monospace`;
  ctx.lineWidth = Math.max(3, S * 1.5); ctx.strokeStyle = '#000'; ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}

const aimLabel = pl => pl.film === Infinity ? pl.name.toUpperCase() : `${pl.name.toUpperCase()} [${pl.film > 0 ? pl.film : 'SEM FILME'}]`;

export function render(now) {
  const c = gfx.lc, { ctx, canvas } = gfx;
  c.drawImage(gfx.backdrop, 0, 0);
  c.globalAlpha = STAGES[tv.stage].clouds; // céu do sertão quase sem nuvem, Amazônia carregada
  CLOUD_SPR.forEach((cl, i) => c.drawImage(cl, Math.round(((i * 170 + now / 1000 * (4 + i * 2)) % (LW + 60)) - 50), 14 + i * 22));
  CLOUD_SPR.forEach((cl, i) => c.drawImage(cl, Math.round(((i * 170 + 90 + now / 1000 * (3 + i)) % (LW + 60)) - 50), 46 + i * 10));
  c.globalAlpha = 1;
  for (const b of tv.birds) {
    const spr = BIRD_SPR.get(b.sp)[FLAP[Math.floor((now / 1000 * b.sp.flap * 4 + b.phase)) % 4]];
    drawSprite(c, spr, Math.round(b.x / PX), Math.round(b.y / PX), Math.cos(b.heading) < 0);
  }
  if (mico.mode !== 'hidden') {
    const mx = 292, my = Math.round(mico.y), hands = my - 15;
    c.fillStyle = '#3c8a3c'; c.fillRect(mx - 7, 0, 1, Math.max(0, hands)); c.fillRect(mx + 6, 0, 1, Math.max(0, hands));
    c.fillStyle = '#5ea85a'; for (let y = 3; y < hands; y += 6) { c.fillRect(mx - 8, y, 1, 2); c.fillRect(mx + 7, y + 3, 1, 2); }
    c.fillStyle = '#6b4a2a'; c.fillRect(mx - 8, hands, 16, 2);
    drawSprite(c, MICO_SPR[mico.mode === 'laugh' ? 1 + (Math.floor(now / 110) % 2) : 0], mx, my, false);
  }
  if (tv.crops.length) doCrops(); // a foto sai da cena limpa, antes das miras
  for (const l of tv.locks) { // foco cravado
    const b = tv.birds.find(x => x.id === l.id); if (!b) continue;
    const grow = l.age < 0.15 ? 3 : 0;
    pxBrackets(c, Math.round(b.x / PX), Math.round(b.y / PX), Math.round(b.rx / PX * 1.3) + grow, Math.round(b.ry / PX * 1.7) + grow, 4, '#ffcc33');
  }
  if (tv.phase !== 'gate') for (const pl of tv.players.values()) {
    if (!pl.online) continue;
    const x = Math.round(pl.aim.x / PX), y = Math.round(pl.aim.y / PX), col = pl.film > 0 ? pl.color : '#8a8a8a'; // sem filme: mira apagada
    pxBrackets(c, x + 1, y + 1, 10, 7, 4, '#000'); pxBrackets(c, x, y, 10, 7, 4, col);
    c.fillStyle = '#000'; c.fillRect(x - 2, y + 1, 5, 1); c.fillRect(x + 1, y - 1, 1, 5);
    c.fillStyle = col; c.fillRect(x - 2, y, 5, 1); c.fillRect(x, y - 2, 1, 5);
  }
  for (const r of tv.rings) {
    const rad = 6 + (r.age / 0.35) * 18, cx = r.x / PX, cy = r.y / PX;
    c.fillStyle = r.age < 0.2 ? '#ffffff' : '#cfe7f2';
    for (let a = 0; a < Math.PI * 2; a += 1 / rad) c.fillRect(Math.round(cx + Math.cos(a) * rad), Math.round(cy + Math.sin(a) * rad), 1, 1);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = STAGES[tv.stage].ground; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(gfx.lo, view.ox, view.oy, LW * view.S, LH * view.S);
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  if (tv.phase !== 'gate') for (const pl of tv.players.values()) if (pl.online) hiText(aimLabel(pl), pl.aim.x / PX, pl.aim.y / PX + 17, 4, pl.film > 0 ? pl.color : '#bdbdbd');
  for (const t of tv.texts) {
    const p = t.age / 1.2;
    ctx.globalAlpha = p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25;
    hiText(t.text, clamp(t.x / PX, 72, LW - 72), t.y / PX - p * 10, t.key === 'perfect' ? 7 : 5.5, t.color || (t.key === 'perfect' ? '#ffcc33' : t.key === 'miss' ? '#ff9d9d' : t.key === 'film' ? '#7bd389' : '#ffffff'));
  }
  ctx.globalAlpha = 1;
  if (mico.mode === 'laugh') { ctx.textAlign = 'right'; hiText('HA HA HA!', 274, Math.round(mico.y) + 2 + (Math.floor(now / 110) % 2), 6, '#ffcc33'); }
  if (tv.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${tv.flash})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
}

// Letreiro animado da tela de abertura.
export function marquee() {
  const g = $('marquee').getContext('2d'), spr = BIRD_SPR.get(SPECIES[0]);
  const tick = now => {
    if (tv.phase !== 'gate') return;
    g.fillStyle = '#4f9de6'; g.fillRect(0, 0, 128, 32);
    g.drawImage(CLOUD_SPR[0], Math.round(((now / 120) % 180) - 44), 2);
    g.fillStyle = '#1b4a2b'; g.fillRect(0, 28, 128, 4);
    drawSprite(g, spr[FLAP[Math.floor(now / 1000 * 2.6 * 4) % 4]], Math.round(((now / 30) % 170) - 20), 16 + Math.round(Math.sin(now / 400) * 3), false);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
