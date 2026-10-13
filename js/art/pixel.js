// Base da pixel art: tudo é desenhado por código em 320×180 e ampliado sem suavização.
import { W } from '../config.js';

export const LW = 320, LH = 180, PX = W / LW; // 5 unidades do mundo por pixel
export const FLAP = [0, 1, 2, 1];             // ordem dos quadros da batida de asa
const OUTLINE = '#141414';

// Converte uma grade de cores (null = vazio) em canvas, com contorno opcional de 1 pixel.
export function paintGrid(grid, w, h, outline) {
  const out = grid.slice();
  if (outline) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (grid[y * w + x]) continue;
    const at = (dx, dy) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < w && Y < h && grid[Y * w + X]; };
    if (at(1, 0) || at(-1, 0) || at(0, 1) || at(0, -1)) out[y * w + x] = OUTLINE;
  }
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  for (let i = 0; i < out.length; i++) if (out[i]) { g.fillStyle = out[i]; g.fillRect(i % w, (i / w) | 0, 1, 1); }
  return c;
}

export function drawSprite(c, spr, x, y, flip) {
  if (!flip) { c.drawImage(spr.c, x - spr.ox, y - spr.oy); return; }
  c.save(); c.translate(x, y); c.scale(-1, 1); c.drawImage(spr.c, -spr.ox, -spr.oy); c.restore();
}

// Cantoneiras de foco (mira e "foco cravado").
export function pxBrackets(c, x, y, hw, hh, len, color) {
  c.fillStyle = color;
  c.fillRect(x - hw, y - hh, len, 1); c.fillRect(x - hw, y - hh, 1, len);
  c.fillRect(x + hw - len + 1, y - hh, len, 1); c.fillRect(x + hw, y - hh, 1, len);
  c.fillRect(x - hw, y + hh, len, 1); c.fillRect(x - hw, y + hh - len + 1, 1, len);
  c.fillRect(x + hw - len + 1, y + hh, len, 1); c.fillRect(x + hw, y + hh - len + 1, 1, len);
}
