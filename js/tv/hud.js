// HUD da TV em HTML: placar, relógio, meta da fase, lobby, níveis e tela final.
import { FILM_PACK } from '../config.js';
import { NET_ERR, LIB_ERROR } from '../shared/net.js';
import { $ } from '../shared/util.js';
import { STAGES } from '../art/stages.js';
import { rankPlayers, stageTarget, LEVELS, RARITY, multText } from '../core/rules.js';
import { tv, onlineCams } from './state.js';
import { net } from './room.js';

export const filmLabel = f => (f === Infinity ? '∞' : String(f));

function dot(color) { const i = document.createElement('i'); i.style.setProperty('--c', color); return i; }
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

export function renderClock() {
  const s = Math.max(0, Math.ceil(tv.timeLeft)); tv.lastSecond = s;
  $('clock').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  $('clock').classList.toggle('low', tv.phase === 'playing' && s <= 10);
}

export function renderScoreboard() {
  const ol = $('scoreboard'); ol.replaceChildren();
  for (const pl of rankPlayers(tv.players.values())) {
    const li = el('li'); li.classList.toggle('off', !pl.online);
    const f = el('em', pl.film <= 0 ? 'out' : '', filmLabel(pl.film)); f.title = 'fotos restantes';
    li.append(dot(pl.color), el('span', '', pl.name.toUpperCase()), f, el('b', '', String(pl.score).padStart(4, '0')));
    ol.append(li);
  }
}

export function renderStage() {
  const goal = stageTarget(tv.stage, onlineCams());
  $('stageName').textContent = `${tv.stage + 1}/${STAGES.length} ${STAGES[tv.stage].short}`;
  $('stageGoal').textContent = `${Math.min(tv.stagePts, goal)}/${goal}`;
  $('stageFill').style.width = `${Math.min(100, tv.stagePts / goal * 100)}%`;
}

export function renderNet() {
  const cams = [...tv.players.values()].filter(p => !p.local && p.online).length;
  $('netStatus').textContent = net.error === 'lib' ? LIB_ERROR
    : net.error === 'browser-incompatible' ? 'Este navegador não suporta conexão direta (WebRTC). Use Chrome, Edge, Firefox ou Safari atualizados.'
    : NET_ERR.includes(net.error) || (net.peer && net.peer.disconnected && net.code) ? 'Sem conexão com o serviço de pareamento. Confira a internet; tentando de novo…'
    : net.error ? `Erro de conexão (${net.error}). Recarregue a página.`
    : !net.code ? 'Criando a sala…'
    : cams ? `${cams} câmera(s) conectada(s). Mais gente pode entrar pelo QR Code.` : 'Pronto. Escaneie o QR Code com o celular ou digite o endereço abaixo dele.';
}

export function renderRoster() {
  const ul = $('roster'); ul.replaceChildren();
  const list = [...tv.players.values()];
  for (const pl of list) { const li = el('li'); li.append(dot(pl.color), el('span', '', pl.online ? pl.name : `${pl.name} (saiu)`)); ul.append(li); }
  if (!list.length) ul.append(el('li', 'empty', 'Nenhuma câmera conectada ainda'));
  $('startBtn').disabled = !list.some(p => p.online);
  renderNet();
  renderStage(); // a meta da fase depende de quantas câmeras estão jogando
}

export function levelNote(level, hard) {
  if (level === 'facil') return 'Fácil: fotos ilimitadas. Bom para pegar o jeito da mira.';
  if (level === 'dificil') return `Difícil: ${hard} fotos para a viagem inteira, sem filme novo. Cada clique conta.`;
  return `Normal: cada câmera começa com ${FILM_PACK} fotos; Foto Perfeita e lugar novo dão mais ${FILM_PACK}.`;
}

export function renderLevel() {
  for (const b of document.querySelectorAll('#levels [data-lv]')) b.setAttribute('aria-pressed', String(b.dataset.lv === tv.level));
  $('hardRow').hidden = tv.level !== 'dificil';
  $('hardIn').value = tv.hard;
  $('levelNote').textContent = levelNote(tv.level, tv.hard);
  $('rarityNote').textContent = 'Ave rara vale mais: ' + Object.keys(RARITY).map(k => `${RARITY[k].name} ${multText(k)}`).join(' · ') + '.';
}

function print(pl) {
  if (!pl.best) return el('div', 'print none', 'sem foto');
  const fig = el('div', 'print'), img = el('img', 'px-img');
  img.src = pl.best.img; img.alt = `Melhor foto de ${pl.name}: ${pl.best.sp}`;
  fig.append(img, el('span', '', `${pl.best.sp} · ${pl.best.label}`));
  return fig;
}

export function renderResults() {
  const ranked = rankPlayers(tv.players.values());
  $('resultsLevel').textContent = LEVELS[tv.level].name;
  $('winner').textContent = !ranked.length || ranked[0].score === 0 ? 'Ninguém conseguiu foto. O Mico venceu.' : `${ranked[0].name} fez o melhor álbum!`;
  $('journey').textContent = tv.won ? `Volta ao mundo completa: do Brasil à Austrália, ${STAGES.length} lugares!`
    : `A viagem parou em ${STAGES[tv.stage].name} (lugar ${tv.stage + 1} de ${STAGES.length}). Faltaram ${Math.max(0, stageTarget(tv.stage, onlineCams()) - tv.stagePts)} pontos para a meta.`;
  const ol = $('ranking'); ol.replaceChildren();
  ranked.forEach((pl, i) => {
    const who = el('div', 'who'), nm = el('b');
    nm.append(dot(pl.color), document.createTextNode(pl.name));
    who.append(nm, el('span', '', `${pl.perfect} perfeita${pl.perfect === 1 ? '' : 's'}` + (pl.best ? ` · melhor foto ${Math.round((1 - Math.min(1, pl.best.d)) * 100)}% centralizada` : '')));
    const li = el('li'); li.append(el('span', 'pos', i + 1), print(pl), who, el('span', 'pts', pl.score));
    ol.append(li);
  });
}

// board = null enquanto carrega; mine = pontuações desta partida, para destacar.
export function renderBoard(board, mine = []) {
  const ol = $('board'); ol.replaceChildren();
  $('boardTitle').textContent = `${board && board.where === 'online' ? 'Ranking geral' : 'Ranking desta TV'} · ${LEVELS[tv.level].name}`;
  if (!board) { ol.append(el('li', 'empty', 'Carregando…')); return; }
  if (!board.rows.length) { ol.append(el('li', 'empty', 'Ninguém pontuou neste nível ainda.')); return; }
  board.rows.forEach((r, i) => {
    const li = el('li'); li.classList.toggle('mine', mine.some(m => m.name === r.name && m.score === r.score));
    li.append(el('span', 'pos', i + 1), el('span', 'name', r.name), el('span', 'where', STAGES[r.stage - 1] ? STAGES[r.stage - 1].short : ''), el('b', '', r.score));
    ol.append(li);
  });
}
