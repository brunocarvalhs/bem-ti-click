// Estado compartilhado da TV. Os módulos leem e alteram estes objetos; nenhum guarda cópia.
import { ROUND, HARD_FILM } from '../config.js';
import { PX } from '../art/pixel.js';
import { store } from '../shared/util.js';
import { levelOf, hardFilm } from '../core/rules.js';

export const tv = {
  phase: 'gate',              // gate → lobby → countdown → playing ⇄ travel → end
  players: new Map(),         // token -> jogador (câmeras e o mouse)
  level: levelOf(store.get('oop-level')),
  hard: hardFilm(store.get('oop-hard') || HARD_FILM.def), // fotos da viagem no Difícil
  stage: 0, stagePts: 0, timeLeft: ROUND, countdown: 0, travelT: 0, won: false, outT: 0,
  birds: [], history: [], spawnIn: 0,
  texts: [], locks: [], rings: [], crops: [], flash: 0, lastFlash: 0, lastSecond: -1,
};

export const mico = { y: -40, mode: 'hidden', t: 0 };

// Encaixe da cena 320×180 no canvas da tela (escala e margem).
export const view = { S: 1, s: 1 / PX, ox: 0, oy: 0 };

// Canvas: tela visível, cena em baixa resolução e paisagem pré-pintada.
export const gfx = { canvas: null, ctx: null, lo: null, lc: null, backdrop: null };

export const onlineCams = () => Math.max(1, [...tv.players.values()].filter(p => p.online).length);
