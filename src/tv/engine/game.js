// Motor da TV (host): manda no jogo. Simula os pássaros, julga as fotos e conduz as fases.
// Não toca no DOM além do canvas: muda `tv` e chama emit(); a interface React desenha o resto.
import QRCode from 'qrcode';
import { W, H, ROUND, COUNTDOWN, MAX_CAMS, COLORS } from '../../config.js';
import { clamp, num, rand, store, wakeLock, reduceMotion } from '../../shared/util.js';
import { sfx, unlockAudio } from '../../shared/audio.js';
import { track, events } from '../../shared/analytics.js';
import { TIERS, LEVELS, shotLabel, rarityOf, rarityTag, judge, filmAfter, startFilm, stageTarget, rankPlayers, levelOf, hardFilm, selfCheck } from '../../core/rules.js';
import { STAGES } from '../../art/stages.js';
import { SPECIES, BIRD_SPR } from '../../art/birds.js';
import { tv, mico, gfx, emit, onlineCams } from './state.js';
import { openRoom, sendTo, sendEach } from './room.js';
import { spawnBird, updateBird } from './flight.js';
import { initScene, showStage, render, toWorld } from './render.js';
import { addScores, topScores } from './ranking.js';

let lastFrame = 0, started = false;
const place = () => STAGES[tv.stage].short;

export function startEngine(canvas, params) {
  if (started) return; // o React pode montar duas vezes em desenvolvimento
  started = true;
  initScene(canvas);
  requestAnimationFrame(loop);
  if (params.has('teste')) {
    tv.selfCheck = selfCheck();
    window.oop = { tv, gfx, events, setPhase, startStage, stageClear, setLevel, setStart, pause, resume, exitTrip, showStage, STAGES, SPECIES, BIRD_SPR }; // alça para os testes automáticos
  }
  openRoom({ open: showRoom, join, data, leave, change });
}

// ---------- sala e câmeras ----------
function showRoom(code) {
  tv.joinUrl = location.origin + location.pathname + '?sala=' + code;
  QRCode.toDataURL(tv.joinUrl, { width: 424, margin: 1, errorCorrectionLevel: 'M' })
    .then(img => { tv.qr = img; emit(); })
    .catch(() => {}); // sem QR, o lobby mostra o endereço e o código
  track('room_open');
}

function join(token, name) {
  let pl = tv.players.get(token);
  if (!pl) {
    if ([...tv.players.values()].filter(p => !p.local).length >= MAX_CAMS) return `Sala cheia: no máximo ${MAX_CAMS} câmeras.`;
    pl = newPlayer(token, name, false); tv.players.set(token, pl);
    track('camera_joined', { cams: [...tv.players.values()].filter(p => !p.local).length });
  }
  pl.online = true; pl.name = name || pl.name;
  return null;
}

function data(token, m) {
  const pl = tv.players.get(token); if (!pl) return;
  if (m.t === 'aim') { pl.target.x = clamp(num(m.x), 0, 1) * W; pl.target.y = clamp(num(m.y), 0, 1) * H; }
  else if (m.t === 'shot') shoot(pl);
  else if (m.t === 'start' && (tv.phase === 'lobby' || tv.phase === 'end')) startGame('camera');
  else if (m.t === 'pause') pause('camera');
  else if (m.t === 'resume') resume();
  else if (m.t === 'exit') exitTrip();
}

function leave(token) {
  const pl = tv.players.get(token); if (!pl) return;
  pl.online = false; emit();
}

function change() { emit(); pushHostState(); }

function newPlayer(key, name, local) {
  const used = new Set([...tv.players.values()].map(p => p.ci));
  let ci = 0; while (used.has(ci) && ci < COLORS.length - 1) ci++;
  return { key, name: name || `Câmera ${tv.players.size + 1}`, ci, color: COLORS[ci], local, online: true, score: 0, perfect: 0, best: null, n: 0, film: startFilm(tv.level, tv.hard), aim: { x: W / 2, y: H / 2 }, target: { x: W / 2, y: H / 2 }, cool: 0, result: null };
}

// Estado que cada celular precisa para o visor. f = -1 quer dizer filme ilimitado (JSON não tem Infinity).
function pushHostState() {
  const ranked = tv.phase === 'end' ? rankPlayers(tv.players.values()) : [];
  sendEach(token => {
    const pl = tv.players.get(token); if (!pl) return null;
    const r = pl.result || {};
    return { t: 'state', phase: tv.phase, left: Math.ceil(tv.timeLeft), s: pl.score, c: pl.ci, n: pl.n, f: pl.film === Infinity ? -1 : pl.film, st: tv.stage, k: r.k || '', kp: r.p || 0, kr: r.r || '', lv: tv.level, w: tv.won ? 1 : 0, p: ranked.indexOf(pl) + 1, o: ranked.length };
  });
}

// ---------- fases ----------
export function setPhase(ph) {
  tv.phase = ph;
  if (ph === 'countdown') {
    tv.countdown = COUNTDOWN; tv.won = false; tv.album = new Set(); tv.board = null;
    for (const pl of tv.players.values()) Object.assign(pl, { score: 0, perfect: 0, best: null, result: null });
    refillFilm();
    startStage(tv.start);
    sfx.beep(false);
    track('game_start', { level: tv.level, start_place: place(), cams: onlineCams(), hard_film: tv.level === 'dificil' ? tv.hard : undefined });
  }
  if (ph === 'end') {
    sfx.jingle();
    const ranked = rankPlayers(tv.players.values());
    if (!ranked.some(p => p.score > 0)) micoLaugh();
    saveRanking();
    track('game_end', { level: tv.level, won: tv.won, start_place: STAGES[tv.start].short, last_place: place(), best_score: ranked[0] ? ranked[0].score : 0, cams: onlineCams(), species: tv.album.size });
  }
  emit(); pushHostState();
}

// Chega num lugar novo: paisagem, pássaros, meta e cronômetro da fase.
export function startStage(i) {
  tv.stage = i; tv.stagePts = 0; tv.timeLeft = ROUND; tv.outT = 0;
  tv.birds = []; tv.texts = []; tv.locks = []; tv.history = []; tv.spawnIn = 0.4;
  showStage(i); emit();
}

export function stageClear() { // meta batida: viaja para o próximo lugar (ou termina a viagem)
  track('stage_clear', { place: place(), stage_number: tv.stage + 1, level: tv.level });
  if (tv.stage === STAGES.length - 1) { tv.won = true; return setPhase('end'); }
  tv.travelT = 3.5; setPhase('travel');
}

export function startGame(from = 'tv') {
  unlockAudio();
  if (tv.phase === 'end') track('play_again', { from });
  setPhase('countdown');
}

export function arm() {
  unlockAudio(); wakeLock();
  try { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); p && p.catch(() => {}); } catch (e) {}
  track('tv_ready');
  setPhase('lobby');
}

// O filme de cada câmera acompanha o nível escolhido, para o celular já mostrar a contagem certa no lobby.
function refillFilm() { for (const pl of tv.players.values()) pl.film = startFilm(tv.level, tv.hard); }

export function setLevel(lv) {
  tv.level = levelOf(lv); store.set('oop-level', tv.level);
  refillFilm(); emit(); pushHostState();
  track('level_select', { level: tv.level });
}

export function setHard(n) {
  tv.hard = hardFilm(n); store.set('oop-hard', tv.hard);
  refillFilm(); emit(); pushHostState();
}

export function setStart(i) {
  if (!STAGES[i]) return;
  tv.start = i; store.set('oop-start', i); emit();
  track('destination_select', { place: STAGES[i].short, country: STAGES[i].country });
}

// Pausa: congela tempo e pássaros. Sair volta ao lobby sem salvar no ranking.
export function pause(from = 'tv') {
  if (tv.phase !== 'playing') return;
  setPhase('paused'); track('game_pause', { place: place(), from });
}
export function resume() { if (tv.phase === 'paused') setPhase('playing'); }
export function exitTrip() {
  if (tv.phase !== 'paused') return;
  track('game_exit', { place: place(), level: tv.level });
  tv.birds = []; tv.texts = []; tv.locks = [];
  setPhase('lobby');
}

async function saveRanking() {
  const mine = [...tv.players.values()].filter(p => p.score > 0).map(p => ({ name: p.name, score: p.score, stage: tv.stage + 1, level: tv.level }));
  tv.board = { loading: true }; emit();
  await addScores(mine);
  tv.board = { ...(await topScores(tv.level)), mine }; emit();
}

// ---------- disparo ----------
function shoot(pl) {
  const now = performance.now();
  if (tv.phase !== 'playing' || pl.film <= 0 || now - pl.cool < 300) return; // o celular já espera 450 ms; aqui só barra rajada
  pl.cool = now;
  const r = judge(tv.history, pl.key, now);
  const aim = r.aim || { x: pl.aim.x, y: pl.aim.y };
  const bonus = LEVELS[tv.level].bonus;
  const rar = r.bird ? r.bird.rarity : '';
  pl.score += r.pts; tv.stagePts += r.pts; if (r.key === 'perfect') pl.perfect++;
  pl.film = filmAfter(pl.film, r.key, tv.level);
  pl.n++; pl.result = { k: r.key, p: r.pts, r: rar };
  if (r.bird) tv.album.add(r.bird.sp);
  tv.rings.push({ x: aim.x, y: aim.y, age: 0 });
  if (now - tv.lastFlash > 340) { tv.lastFlash = now; tv.flash = reduceMotion ? 0.15 : 0.5; } // clarão de tela no máximo 3x/s (fotossensibilidade)
  sfx.shutter();
  tv.texts.push({ x: aim.x, y: aim.y - 70, text: shotLabel(r.key, r.pts), key: r.key, age: 0 });
  if (rar && rar !== 'comum') tv.texts.push({ x: aim.x, y: aim.y - 110, text: rarityTag(rar), color: rarityOf(rar).color, age: 0 });
  if (r.key === 'perfect') {
    sfx.perfect(); tv.locks.push({ id: r.bird.id, age: 0 });
    if (bonus) { sfx.film(); tv.texts.push({ x: aim.x, y: aim.y - 30, text: `FILME NOVO +${bonus}`, key: 'film', age: 0 }); }
  } else if (r.key === 'good') sfx.good();
  else if (r.key === 'miss') micoLaugh();
  // toda foto acertada é recortada da cena (no próximo quadro) e vai para o celular; foto perdida sai em branco
  if (r.key !== 'miss') tv.crops.push({ pl, n: pl.n, d: r.d, label: TIERS.find(t => t.key === r.key).label, sp: r.bird.sp, rar, id: r.bird.id, off: { x: aim.x - r.bird.x, y: aim.y - r.bird.y }, aim });
  else sendTo(pl.key, { t: 'photo', n: pl.n, img: null, cap: 'fora de foco' });
  track('photo_taken', { result: r.key, rarity: rar || undefined, species: r.bird ? r.bird.sp : undefined, place: place(), points: r.pts });
  emit(); pushHostState();
  if (tv.stagePts >= stageTarget(tv.stage, onlineCams())) stageClear();
}

function micoLaugh() {
  if (mico.mode === 'hidden' || mico.mode === 'up') { mico.mode = 'down'; mico.t = 0; sfx.laugh(); }
  else if (mico.mode === 'laugh') mico.t = Math.min(mico.t, 0.5);
}

// ---------- mouse (jogar na própria TV) ----------
export function toggleMouse() {
  if (tv.players.has('mouse')) tv.players.delete('mouse');
  else tv.players.set('mouse', newPlayer('mouse', 'Mouse', true));
  emit();
}
export function mouseMove(clientX, clientY) { const pl = tv.players.get('mouse'); if (pl) Object.assign(pl.target, toWorld(clientX, clientY)); }
export function mouseDown() { const pl = tv.players.get('mouse'); if (pl) shoot(pl); }

// ---------- loop ----------
function loop(now) {
  const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000); lastFrame = now;
  update(dt, now); render(now);
  requestAnimationFrame(loop);
}

function update(dt, now) {
  for (const pl of tv.players.values()) { const k = pl.local ? 1 : Math.min(1, dt * 22); pl.aim.x += (pl.target.x - pl.aim.x) * k; pl.aim.y += (pl.target.y - pl.aim.y) * k; }
  if (tv.phase === 'paused') return; // tudo congelado, só a mira se mexe
  if (tv.phase === 'countdown') {
    const before = Math.ceil(tv.countdown); tv.countdown -= dt; const after = Math.ceil(tv.countdown);
    if (after !== before && after > 0) { sfx.beep(false); emit(); }
    if (tv.countdown <= 0) { sfx.beep(true); setPhase('playing'); }
  } else if (tv.phase === 'playing') {
    tv.timeLeft -= dt;
    const shooters = [...tv.players.values()].filter(p => p.online);
    tv.outT = shooters.length && shooters.every(p => p.film <= 0) ? tv.outT + dt : 0; // todo mundo sem filme: a viagem acaba
    if (tv.timeLeft <= 0 || tv.outT > 2) { tv.timeLeft = Math.max(0, tv.timeLeft); setPhase('end'); }
    else if (Math.ceil(tv.timeLeft) !== tv.lastSecond) { tv.lastSecond = Math.ceil(tv.timeLeft); emit(); pushHostState(); }
  } else if (tv.phase === 'travel' && (tv.travelT -= dt) <= 0) {
    for (const pl of tv.players.values()) pl.film += LEVELS[tv.level].bonus; // filme novo para o lugar novo (só no Normal)
    startStage(tv.stage + 1); setPhase('playing');
  }
  const maxBirds = tv.phase === 'playing' ? Math.min(6, 2 + tv.players.size) : ['countdown', 'gate', 'travel'].includes(tv.phase) ? 0 : 2;
  tv.spawnIn -= dt;
  if (tv.birds.length < maxBirds && tv.spawnIn <= 0) {
    tv.birds.push(spawnBird(tv.stage)); tv.spawnIn = rand(0.6, 1.6);
    if (tv.phase === 'playing') sfx.chirp();
  }
  for (const b of tv.birds) updateBird(b, dt);
  tv.birds = tv.birds.filter(b => !b.gone);
  const aims = {};
  for (const pl of tv.players.values()) if (pl.online) aims[pl.key] = { x: pl.aim.x, y: pl.aim.y };
  tv.history.push({ t: now, aims, birds: tv.birds.map(b => ({ id: b.id, x: b.x, y: b.y, rx: b.rx, ry: b.ry, sp: b.sp.name, rarity: b.sp.rarity })) });
  while (tv.history.length && now - tv.history[0].t > 400) tv.history.shift();
  if (mico.mode === 'down') { mico.y += 150 * dt; if (mico.y >= 30) { mico.y = 30; mico.mode = 'laugh'; mico.t = 0; } }
  else if (mico.mode === 'laugh') { if ((mico.t += dt) > 1.5) mico.mode = 'up'; }
  else if (mico.mode === 'up') { mico.y -= 170 * dt; if (mico.y <= -40) { mico.y = -40; mico.mode = 'hidden'; } }
  tv.flash = Math.max(0, tv.flash - dt * 3.2);
  for (const list of [tv.texts, tv.locks, tv.rings]) for (const f of list) f.age += dt;
  tv.texts = tv.texts.filter(f => f.age < 1.2); tv.locks = tv.locks.filter(f => f.age < 0.7); tv.rings = tv.rings.filter(f => f.age < 0.35);
}
