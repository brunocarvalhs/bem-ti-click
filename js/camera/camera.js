// Câmera (celular): entra na sala, mira, dispara e recebe as fotos da TV.
import { COLORS, PORTFOLIO_URL } from '../config.js';
import { $, clamp, num, cleanName, store, wakeLock, vibrate, replay } from '../shared/util.js';
import { PEER_PREFIX, PEER_OPTS, NET_ERR, hasPeer, LIB_ERROR } from '../shared/net.js';
import { TIER_TEXT, RARITY, LEVELS, levelOf, shotLabel, rarityTag } from '../core/rules.js';
import { STAGES } from '../art/stages.js';
import { initAim } from './aim.js';

const cam = { joined: false, shown: 0, film: Infinity, level: 'normal', lastPhase: '', cool: 0, aimQueued: false, code: '', name: '' };
let peer = null, conn = null, msgTimer = 0, retryTimer = 0, openTimer = 0;

export function startCam(params) {
  $('cam').hidden = false;
  $('camSite').href = PORTFOLIO_URL;
  const code = (params.get('sala') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  $('codeIn').value = code;
  $('nameIn').value = store.get('oop-name') || '';
  initAim(cam, { onMove: sendAim, onInfo: text => showMsg(text, 'info') });
  $('join').addEventListener('submit', onJoin);
  $('shutter').addEventListener('pointerdown', onShutter);
  $('camStart').onclick = $('camAgain').onclick = () => { if (cam.joined) send({ t: 'start' }); };
  (code ? $('nameIn') : $('codeIn')).focus();
}

// ---------- entrar na sala ----------
function camToken() { // identifica esta câmera para voltar à partida (com os pontos) se a conexão cair
  let t = store.get('oop-token');
  if (!t) { t = Math.random().toString(36).slice(2) + Date.now().toString(36); store.set('oop-token', t); }
  return t;
}

function onJoin(e) {
  e.preventDefault();
  const code = $('codeIn').value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  const name = cleanName($('nameIn').value) || 'Fotógrafo';
  if (code.length !== 4) { $('joinStatus').textContent = 'Digite as 4 letras da sala que aparecem na TV.'; return; }
  if (!hasPeer()) { $('joinStatus').textContent = LIB_ERROR; return; }
  store.set('oop-name', name);
  cam.code = code; cam.name = name;
  $('joinStatus').textContent = 'Conectando à TV…'; $('joinBtn').disabled = true;
  connect();
}

function joinFail(msg) { clearTimeout(openTimer); $('joinStatus').textContent = msg; $('joinBtn').disabled = false; }
function retryLater() { clearTimeout(retryTimer); retryTimer = setTimeout(connect, 2500); }

function connect() {
  clearTimeout(retryTimer);
  if (!peer || peer.destroyed) {
    peer = new window.Peer(PEER_OPTS);
    peer.on('disconnected', () => setTimeout(() => { if (peer && !peer.destroyed) peer.reconnect(); }, 1500));
    peer.on('error', e => {
      if (cam.joined) { setClock(e.type === 'peer-unavailable' ? 'TV desconectada' : 'Reconectando…', false); return retryLater(); }
      joinFail(e.type === 'peer-unavailable' ? 'Sala não encontrada. Confira as 4 letras na TV ou escaneie o QR Code de novo.'
        : NET_ERR.includes(e.type) ? 'Sem conexão com o serviço de pareamento. Confira a internet do celular.'
        : e.type === 'browser-incompatible' ? 'Este navegador não suporta conexão direta (WebRTC).'
        : `Não consegui conectar (${e.type}).`);
    });
  }
  const go = () => {
    if (conn) conn.close();
    const c = conn = peer.connect(PEER_PREFIX + cam.code, { metadata: { name: cam.name, token: camToken() }, serialization: 'json', reliable: true });
    c.on('data', m => {
      if (c !== conn || !m || typeof m !== 'object') return;
      if (m.t === 'joined') {
        clearTimeout(openTimer);
        cam.joined = true; $('meName').textContent = cam.name; $('join').hidden = true; $('vf').hidden = false;
        wakeLock(); flushAim();
      } else if (m.t === 'nope') joinFail(String(m.msg || 'A TV recusou a entrada.'));
      else if (m.t === 'state') onState(m);
      else if (m.t === 'photo') ejectPhoto(m);
    });
    c.on('close', () => { if (c === conn && cam.joined) { setClock('Reconectando…', false); retryLater(); } });
    if (!cam.joined) { clearTimeout(openTimer); openTimer = setTimeout(() => { if (!cam.joined) joinFail('A conexão com a TV não abriu. Deixe TV e celular na mesma Wi‑Fi e tente de novo.'); }, 15000); }
  };
  if (peer.open) go(); else peer.once('open', go);
}

function send(m) { if (conn && conn.open) conn.send(m); }
function flushAim() { if (cam.joined) send({ t: 'aim', x: Math.round(cam.x * 1e4) / 1e4, y: Math.round(cam.y * 1e4) / 1e4 }); }
function sendAim() { if (cam.aimQueued) return; cam.aimQueued = true; requestAnimationFrame(() => { cam.aimQueued = false; flushAim(); }); } // no máximo 1 envio por quadro

// ---------- visor ----------
function setClock(text, rec) { $('vfClock').textContent = text; $('vfClock').classList.toggle('rec', rec); }

function onState(d) {
  const level = cam.level = levelOf(d.lv), bonus = LEVELS[level].bonus;
  const playing = d.phase === 'playing', left = clamp(num(d.left), 0, 999), st = clamp(num(d.st), 0, STAGES.length - 1);
  setClock(playing ? `${STAGES[st].short} ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : d.phase === 'travel' ? 'Viajando…' : d.phase === 'countdown' ? 'Prepare-se' : d.phase === 'end' ? 'Fim da viagem' : d.phase === 'gate' ? 'Prepare a TV' : 'Aguardando', playing);
  if (d.phase === 'travel' && cam.lastPhase !== 'travel' && STAGES[st + 1]) showMsg(`PRÓXIMA PARADA:\n${STAGES[st + 1].name.toUpperCase()}` + (bonus ? `\n+${bonus} FOTOS` : ''), 'perfect');
  cam.lastPhase = d.phase;
  $('camStart').hidden = d.phase !== 'lobby';
  $('vfExif').textContent = `FILME INSTANTÂNEO · ${LEVELS[level].name.toUpperCase()}`;
  $('meChip').style.setProperty('--c', COLORS[num(d.c) % COLORS.length]);
  $('vfScore').textContent = String(num(d.s)).padStart(4, '0');

  const unlimited = num(d.f) < 0, f = unlimited ? Infinity : Math.max(0, num(d.f)), film = $('film');
  if (f > cam.film && !unlimited) replay(film, 'gain');
  cam.film = f;
  film.textContent = unlimited ? '∞' : String(f).padStart(2, '0'); film.classList.toggle('low', f <= 2);
  $('shutter').classList.toggle('empty', f <= 0);

  if (num(d.n) > cam.shown && TIER_TEXT[d.k]) {
    cam.shown = num(d.n);
    const rare = RARITY[d.kr] && d.kr !== 'comum' ? `\n${rarityTag(d.kr)}` : '', film = d.k === 'perfect' && bonus ? `\nFILME NOVO +${bonus}` : '';
    showMsg(d.k === 'miss' ? 'PERDEU O FOCO! O Mico riu.' : shotLabel(d.k, num(d.kp)) + rare + film, d.k);
    if (d.k === 'perfect') vibrate([20, 40, 20]);
  } else if (num(d.n) < cam.shown) cam.shown = num(d.n); // a TV recarregou

  renderEnd(d, st);
}

// Fim da viagem no celular: resultado e as duas saídas (continuar ou conhecer o site do Bruno).
function renderEnd(d, st) {
  $('endSheet').hidden = d.phase !== 'end';
  if (d.phase !== 'end') return;
  const pts = num(d.s), pos = num(d.p), of = num(d.o);
  $('endScore').textContent = `${pts} ponto${pts === 1 ? '' : 's'}`;
  $('endNote').textContent = (d.w ? 'Volta ao mundo completa!' : `A viagem parou em ${STAGES[st].name}.`) + (of > 1 && pos ? ` Você ficou em ${pos}º de ${of}.` : '');
}

function ejectPhoto(m) { // a foto sai pela fenda e revela aos poucos
  const box = $('instant'), img = $('instantImg');
  const src = typeof m.img === 'string' && m.img.startsWith('data:image/png;base64,') ? m.img : '';
  img.hidden = !src; if (src) img.src = src;
  $('instantCap').textContent = String(m.cap || '').slice(0, 40);
  box.classList.remove('dev'); replay(box, 'out');
  requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('dev')));
}

function showMsg(text, kind) {
  const m = $('vfMsg'); m.textContent = text; m.className = `vf-msg show ${kind}`;
  clearTimeout(msgTimer); msgTimer = setTimeout(() => m.classList.remove('show'), kind === 'info' ? 3500 : 1100);
}

function onShutter(e) {
  e.preventDefault();
  const now = performance.now();
  if (!cam.joined || now - cam.cool < 450) return;
  if (cam.film <= 0) {
    showMsg(cam.level === 'dificil' ? 'SEM FILME!\nAcabaram as fotos da viagem.' : 'SEM FILME!\nSó uma Foto Perfeita traz filme novo.', 'miss');
    vibrate([40, 30, 40]); return;
  }
  cam.cool = now;
  flushAim(); send({ t: 'shot' });
  vibrate(25);
  replay($('blink'), 'go');
  const sh = $('shutter'); sh.classList.add('wait'); setTimeout(() => sh.classList.remove('wait'), 450);
}
