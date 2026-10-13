// TV (host): manda no jogo. Simula os pássaros, julga as fotos e conduz as fases.
import { W, H, ROUND, COUNTDOWN, MAX_CAMS, COLORS } from '../config.js';
import { $, clamp, num, rand, store, wakeLock, reduceMotion, portfolioUrl } from '../shared/util.js';
import { sfx, unlockAudio } from '../shared/audio.js';
import { TIERS, LEVELS, shotLabel, rarityOf, rarityTag, judge, filmAfter, startFilm, stageTarget, rankPlayers, levelOf, hardFilm, selfCheck } from '../core/rules.js';
import { STAGES } from '../art/stages.js';
import { SPECIES, BIRD_SPR } from '../art/birds.js';
import { tv, mico, gfx, onlineCams } from './state.js';
import { net, openRoom, sendTo, sendEach } from './room.js';
import { spawnBird, updateBird } from './flight.js';
import { initScene, showStage, render, marquee, toWorld } from './render.js';
import * as hud from './hud.js';
import { addScores, topScores } from './ranking.js';

let lastFrame = 0;

export function startTv(params) {
  $('tv').hidden = false;
  $('siteLink').href = portfolioUrl();
  initScene($('scene'));
  hud.renderRoster(); hud.renderLevel(); marquee();
  wireControls();
  requestAnimationFrame(loop);
  if (params.has('teste')) {
    $('gateText').textContent = 'Teste das regras de pontuação: ' + selfCheck();
    window.oop = { tv, gfx, hud, setPhase, startStage, stageClear, setLevel, showStage, STAGES, SPECIES, BIRD_SPR }; // alça para os testes automáticos
  }
  openRoom({ open: showRoom, join, data, leave, change });
}

// ---------- sala e câmeras ----------
function showRoom(code) {
  const url = location.origin + location.pathname + '?sala=' + code;
  $('codeBig').textContent = $('codeSmall').textContent = code;
  $('joinUrl').textContent = url;
  for (const [id, size] of [['qrBig', 212], ['qrSmall', 108]]) {
    const el = $(id); el.replaceChildren(); el.hidden = false;
    if (window.QRCode) new window.QRCode(el, { text: url, width: size, height: size, colorDark: '#000000', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M });
    else el.textContent = `Sala ${code}`;
  }
}

function join(token, name) {
  let pl = tv.players.get(token);
  if (!pl) {
    if ([...tv.players.values()].filter(p => !p.local).length >= MAX_CAMS) return `Sala cheia: no máximo ${MAX_CAMS} câmeras.`;
    pl = newPlayer(token, name, false); tv.players.set(token, pl);
  }
  pl.online = true; pl.name = name || pl.name;
  return null;
}

function data(token, m) {
  const pl = tv.players.get(token); if (!pl) return;
  if (m.t === 'aim') { pl.target.x = clamp(num(m.x), 0, 1) * W; pl.target.y = clamp(num(m.y), 0, 1) * H; }
  else if (m.t === 'shot') shoot(pl);
  else if (m.t === 'start' && (tv.phase === 'lobby' || tv.phase === 'end')) setPhase('countdown');
}

function leave(token) {
  const pl = tv.players.get(token); if (!pl) return;
  pl.online = false; hud.renderRoster(); hud.renderScoreboard();
}

function change() { hud.renderRoster(); hud.renderScoreboard(); pushHostState(); }

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
function setPhase(ph) {
  tv.phase = ph;
  for (const [id, on] of [['gate', 'gate'], ['lobby', 'lobby'], ['countdown', 'countdown'], ['travel', 'travel'], ['results', 'end']]) $(id).hidden = ph !== on;
  const live = ph === 'countdown' || ph === 'playing' || ph === 'travel';
  $('qrCorner').hidden = !live || !net.code;
  $('clock').hidden = !live || ph === 'travel';
  $('scoreboard').hidden = $('stageInfo').hidden = !live;
  if (ph === 'lobby') hud.renderLevel();
  if (ph === 'countdown') {
    tv.countdown = COUNTDOWN; tv.won = false;
    for (const pl of tv.players.values()) Object.assign(pl, { score: 0, perfect: 0, best: null, result: null });
    refillFilm();
    startStage(0);
    $('countdown').textContent = COUNTDOWN; sfx.beep(false); hud.renderScoreboard();
  }
  if (ph === 'end') {
    sfx.jingle(); hud.renderResults();
    if (![...tv.players.values()].some(p => p.score > 0)) micoLaugh();
    saveRanking();
  }
  hud.renderClock(); pushHostState();
}

// Chega num lugar novo: paisagem, pássaros, meta e cronômetro da fase.
function startStage(i) {
  tv.stage = i; tv.stagePts = 0; tv.timeLeft = ROUND; tv.outT = 0;
  tv.birds = []; tv.texts = []; tv.locks = []; tv.history = []; tv.spawnIn = 0.4;
  showStage(i); hud.renderStage();
}

function travelNote() {
  const here = STAGES[tv.stage].name, bonus = LEVELS[tv.level].bonus;
  if (tv.level === 'facil') return `Meta de ${here} batida. Filme ilimitado: pode clicar à vontade.`;
  return bonus ? `Meta de ${here} batida. Todo mundo ganha filme novo: +${bonus} fotos.` : `Meta de ${here} batida. No Difícil não tem filme novo: cuide das fotos que restam.`;
}

function stageClear() { // meta batida: viaja para o próximo lugar (ou termina a volta ao mundo)
  if (tv.stage === STAGES.length - 1) { tv.won = true; return setPhase('end'); }
  $('travelTo').textContent = `Próxima parada: ${STAGES[tv.stage + 1].name}`;
  $('travelNote').textContent = travelNote();
  tv.travelT = 3.5; setPhase('travel');
}

// O filme de cada câmera acompanha o nível escolhido, para o celular já mostrar a contagem certa no lobby.
function refillFilm() { for (const pl of tv.players.values()) pl.film = startFilm(tv.level, tv.hard); }

function setLevel(lv) {
  tv.level = levelOf(lv); store.set('oop-level', tv.level);
  refillFilm(); hud.renderLevel(); pushHostState();
}

async function saveRanking() {
  const mine = [...tv.players.values()].filter(p => p.score > 0).map(p => ({ name: p.name, score: p.score, stage: tv.stage + 1, level: tv.level }));
  hud.renderBoard(null);
  await addScores(mine);
  hud.renderBoard(await topScores(tv.level), mine);
}

// ---------- disparo ----------
function shoot(pl) {
  const now = performance.now();
  if (tv.phase !== 'playing' || pl.film <= 0 || now - pl.cool < 300) return; // o celular já espera 450 ms; aqui só barra rajada
  pl.cool = now;
  const r = judge(tv.history, pl.key, now);
  const aim = r.aim || { x: pl.aim.x, y: pl.aim.y };
  const bonus = LEVELS[tv.level].bonus;
  pl.score += r.pts; tv.stagePts += r.pts; if (r.key === 'perfect') pl.perfect++;
  pl.film = filmAfter(pl.film, r.key, tv.level);
  const rar = r.bird ? r.bird.rarity : '';
  pl.n++; pl.result = { k: r.key, p: r.pts, r: rar };
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
  hud.renderScoreboard(); hud.renderStage(); pushHostState();
  if (tv.stagePts >= stageTarget(tv.stage, onlineCams())) stageClear();
}

function micoLaugh() {
  if (mico.mode === 'hidden' || mico.mode === 'up') { mico.mode = 'down'; mico.t = 0; sfx.laugh(); }
  else if (mico.mode === 'laugh') mico.t = Math.min(mico.t, 0.5);
}

// ---------- loop ----------
function loop(now) {
  const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000); lastFrame = now;
  update(dt, now); render(now);
  requestAnimationFrame(loop);
}

function update(dt, now) {
  for (const pl of tv.players.values()) { const k = pl.local ? 1 : Math.min(1, dt * 22); pl.aim.x += (pl.target.x - pl.aim.x) * k; pl.aim.y += (pl.target.y - pl.aim.y) * k; }
  if (tv.phase === 'countdown') {
    const before = Math.ceil(tv.countdown); tv.countdown -= dt; const after = Math.ceil(tv.countdown);
    if (after !== before && after > 0) { sfx.beep(false); $('countdown').textContent = after; }
    if (tv.countdown <= 0) { sfx.beep(true); setPhase('playing'); }
  } else if (tv.phase === 'playing') {
    tv.timeLeft -= dt;
    const shooters = [...tv.players.values()].filter(p => p.online);
    tv.outT = shooters.length && shooters.every(p => p.film <= 0) ? tv.outT + dt : 0; // todo mundo sem filme: rodada acaba
    if (tv.timeLeft <= 0 || tv.outT > 2) { tv.timeLeft = Math.max(0, tv.timeLeft); setPhase('end'); }
    else if (Math.ceil(tv.timeLeft) !== tv.lastSecond) { hud.renderClock(); pushHostState(); }
  } else if (tv.phase === 'travel' && (tv.travelT -= dt) <= 0) {
    for (const pl of tv.players.values()) pl.film += LEVELS[tv.level].bonus; // filme novo para o lugar novo (só no Normal)
    startStage(tv.stage + 1); setPhase('playing'); hud.renderScoreboard();
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

// ---------- botões e mouse ----------
function wireControls() {
  $('armTv').onclick = () => {
    unlockAudio(); wakeLock();
    try { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); p && p.catch(() => {}); } catch (e) {}
    setPhase('lobby');
  };
  $('startBtn').onclick = $('againBtn').onclick = () => { unlockAudio(); setPhase('countdown'); };
  $('levelBtn').onclick = () => setPhase('lobby');
  for (const b of document.querySelectorAll('#levels [data-lv]')) b.onclick = () => setLevel(b.dataset.lv);
  $('hardIn').oninput = () => { // enquanto digita, só atualiza o texto; ao sair do campo, normaliza o número
    tv.hard = hardFilm($('hardIn').value); store.set('oop-hard', tv.hard);
    $('levelNote').textContent = hud.levelNote(tv.level, tv.hard);
    refillFilm(); pushHostState();
  };
  $('hardIn').onchange = hud.renderLevel;
  $('mouseBtn').onclick = () => {
    if (tv.players.has('mouse')) tv.players.delete('mouse');
    else tv.players.set('mouse', newPlayer('mouse', 'Mouse', true));
    $('mouseBtn').textContent = tv.players.has('mouse') ? 'Tirar o mouse' : 'Jogar com o mouse';
    $('tv').classList.toggle('aim', tv.players.has('mouse'));
    hud.renderRoster(); hud.renderScoreboard();
  };
  $('scene').addEventListener('pointermove', e => { const pl = tv.players.get('mouse'); if (pl) Object.assign(pl.target, toWorld(e.clientX, e.clientY)); });
  $('scene').addEventListener('pointerdown', () => { const pl = tv.players.get('mouse'); if (pl) shoot(pl); });
}
