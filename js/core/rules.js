// Regras puras: sem DOM e sem rede. Rodam no navegador e no Node (test/rules.test.js).
import { STAGE_TARGETS, TARGET_PER_EXTRA_CAM, FILM_PACK, HARD_FILM } from '../config.js';

export const TIERS = [
  { key: 'perfect', max: 0.2, pts: 100, label: 'Foto Perfeita!' },
  { key: 'good', max: 0.55, pts: 50, label: 'Boa Foto' },
  { key: 'shaky', max: 1.0, pts: 10, label: 'Foto Tremida' },
];
export const MISS = { key: 'miss', pts: 0, label: 'Perdeu o foco!' };
export const LABELS = { perfect: 'FOTO PERFEITA! +100', good: 'BOA FOTO +50', shaky: 'FOTO TREMIDA +10', miss: 'PERDEU O FOCO!' };

// Distância normalizada pela hitbox elíptica: 0 = centro, 1 = borda. Pássaro grande e pequeno ficam justos.
export function shotDistance(aim, b) { return Math.hypot((aim.x - b.x) / b.rx, (aim.y - b.y) / b.ry); }

export function scoreShot(aim, birds) {
  let best = null;
  for (const b of birds) { const d = shotDistance(aim, b); if (!best || d < best.d) best = { d, bird: b }; }
  const tier = (best && TIERS.find(t => best.d <= t.max)) || MISS;
  return { ...tier, d: best ? best.d : Infinity, bird: tier === MISS ? null : best.bird };
}

// Compensação de latência: julga contra o que estava NA TELA (mira exibida + pássaros) nos últimos ms.
// ponytail: janela fixa de 240 ms, fica com o melhor quadro; trocar por rebobinar com relógio sincronizado se alguém explorar.
export function judge(history, key, now, windowMs = 240) {
  let best = null;
  for (const f of history) {
    if (now - f.t > windowMs) continue;
    const aim = f.aims[key];
    if (!aim) continue;
    const r = scoreShot(aim, f.birds);
    if (!best || r.d < best.d) best = { ...r, aim };
  }
  return best || { ...MISS, d: Infinity, bird: null, aim: null };
}

export function rankPlayers(list) {
  return [...list].sort((a, b) => b.score - a.score || (a.best ? a.best.d : 9) - (b.best ? b.best.d : 9) || b.perfect - a.perfect);
}

// Níveis da câmera instantânea. bonus = fotos ganhas por Foto Perfeita e por lugar novo.
export const LEVELS = {
  facil: { name: 'Fácil', bonus: 0 },     // filme ilimitado
  normal: { name: 'Normal', bonus: FILM_PACK },
  dificil: { name: 'Difícil', bonus: 0 }, // total escolhido no lobby, sem filme novo
};
export const levelOf = key => (LEVELS[key] ? key : 'normal');
export const hardFilm = n => Math.round(Math.min(HARD_FILM.max, Math.max(HARD_FILM.min, Number(n) || HARD_FILM.def)));

export function startFilm(level, hard) {
  if (level === 'facil') return Infinity;
  return level === 'dificil' ? hardFilm(hard) : FILM_PACK;
}
// Cada disparo gasta uma foto; Infinity - 1 continua Infinity, então o Fácil não precisa de caso especial.
export function filmAfter(film, key, level = 'normal') {
  return Math.max(0, film - 1) + (key === 'perfect' ? LEVELS[levelOf(level)].bonus : 0);
}

// Fases: o grupo soma pontos e precisa bater a meta do lugar antes do tempo acabar.
export function stageTarget(i, cams) { return STAGE_TARGETS[i] + TARGET_PER_EXTRA_CAM * Math.max(0, cams - 1); }

// Abra o site com ?teste para ver o resultado na tela inicial; no terminal: node test/rules.test.js
export function selfCheck() {
  const bird = { id: 1, x: 500, y: 300, rx: 50, ry: 30 };
  const frame = (t, x) => ({ t, aims: { a: { x: 500, y: 300 } }, birds: [{ ...bird, x }] });
  const cases = [
    [scoreShot({ x: 500, y: 300 }, [bird]).pts, 100, 'centro vale 100'],
    [scoreShot({ x: 520, y: 300 }, [bird]).pts, 50, 'perto do centro vale 50'],
    [scoreShot({ x: 500, y: 327 }, [bird]).pts, 10, 'na borda vale 10'],
    [scoreShot({ x: 580, y: 300 }, [bird]).key, 'miss', 'fora do pássaro vale 0'],
    [scoreShot({ x: 698, y: 300 }, [bird, { ...bird, id: 2, x: 700 }]).bird.id, 2, 'conta o pássaro mais centralizado'],
    [judge([frame(500, 500), frame(900, 520), frame(1000, 560)], 'a', 1000).pts, 50, 'latência: melhor quadro dos últimos 240 ms'],
    [rankPlayers([{ name: 'A', score: 100, perfect: 1, best: { d: 0.15 } }, { name: 'B', score: 100, perfect: 1, best: { d: 0.05 } }])[0].name, 'B', 'empate vai para a foto mais centralizada'],
    [filmAfter(1, 'perfect'), FILM_PACK, 'normal: foto perfeita ganha um pacote novo'],
    [filmAfter(1, 'good'), 0, 'normal: cada disparo gasta uma foto'],
    [filmAfter(startFilm('facil'), 'miss', 'facil'), Infinity, 'fácil: filme nunca acaba'],
    [filmAfter(3, 'perfect', 'dificil'), 2, 'difícil: foto perfeita não dá filme'],
    [startFilm('dificil', 999), HARD_FILM.max, 'difícil: limite respeita o máximo'],
    [stageTarget(1, 2), 470, 'meta da fase cresce com mais câmeras'],
  ];
  const fails = cases.filter(([got, want]) => got !== want).map(c => c[2]);
  return fails.length ? `FALHOU: ${fails.join('; ')}` : `ok (${cases.length} checagens)`;
}
