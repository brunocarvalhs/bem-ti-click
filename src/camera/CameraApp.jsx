// Câmera (celular): entra na sala, mira, dispara e recebe as fotos da TV.
import { useEffect, useRef, useState } from 'react';
import '../styles/camera.css';
import { COLORS } from '../config.js';
import { clamp, num, cleanName, store, wakeLock, vibrate, portfolioUrl } from '../shared/util.js';
import { initAnalytics, track } from '../shared/analytics.js';
import { TIER_TEXT, RARITY, LEVELS, levelOf, shotLabel, rarityTag } from '../core/rules.js';
import { STAGES } from '../art/stages.js';
import { connect, send } from './link.js';
import { createAim, loadSettings, saveSettings } from './aim.js';

const PHASE_TEXT = { travel: 'Viajando…', countdown: 'Prepare-se', end: 'Fim da viagem', gate: 'Prepare a TV', paused: 'Pausado', lobby: 'Aguardando' };
const roomCode = s => String(s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

export default function CameraApp({ params }) {
  const cam = useRef(null);
  if (!cam.current) { cam.current = { shown: 0, film: Infinity, level: 'normal', lastPhase: '', cool: 0, aimQueued: false }; loadSettings(cam.current); }
  const c = cam.current;

  const [joined, setJoined] = useState(false);
  const [code, setCode] = useState(roomCode(params.get('sala')));
  const [name, setName] = useState(store.get('oop-name') || '');
  const [joinStatus, setJoinStatus] = useState('');
  const [joining, setJoining] = useState(false);
  const [host, setHost] = useState({});
  const [linkStatus, setLinkStatus] = useState('');
  const [msg, setMsg] = useState({ text: '', kind: '', show: false });
  const [photo, setPhoto] = useState(null);
  const [gain, setGain] = useState(0);
  const [blink, setBlink] = useState(0);
  const [mode, setMode] = useState('touch');
  const [hint, setHint] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sets, setSets] = useState({ sens: c.sens, invX: c.invX, invY: c.invY });
  const pad = useRef(null), msgTimer = useRef(0), aim = useRef(null);

  useEffect(() => { initAnalytics('camera'); }, []);

  const flushAim = () => send({ t: 'aim', x: Math.round(c.x * 1e4) / 1e4, y: Math.round(c.y * 1e4) / 1e4 });
  const sendAim = () => { if (c.aimQueued) return; c.aimQueued = true; requestAnimationFrame(() => { c.aimQueued = false; flushAim(); }); }; // no máximo 1 envio por quadro

  function showMsg(text, kind) {
    setMsg({ text, kind, show: true });
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(m => ({ ...m, show: false })), kind === 'info' ? 3500 : 1100);
  }

  // Mira: liga o touchpad quando o visor aparece.
  useEffect(() => {
    if (!joined) return;
    aim.current = createAim(c, { move: sendAim, info: t => showMsg(t, 'info'), mode: m => { setMode(m); setHint(true); }, touch: () => setHint(false) });
    const unbind = aim.current.bindPad(pad.current);
    return () => { unbind(); aim.current.stop(); };
  }, [joined]); // eslint-disable-line react-hooks/exhaustive-deps

  function onState(d) {
    const level = levelOf(d.lv), bonus = LEVELS[level].bonus;
    const st = clamp(num(d.st), 0, STAGES.length - 1);
    if (d.phase === 'travel' && c.lastPhase !== 'travel' && STAGES[st + 1]) showMsg(`PRÓXIMA PARADA:\n${STAGES[st + 1].name.toUpperCase()}` + (bonus ? `\n+${bonus} FOTOS` : ''), 'perfect');
    c.lastPhase = d.phase; c.level = level;
    const unlimited = num(d.f) < 0, f = unlimited ? Infinity : Math.max(0, num(d.f));
    if (f > c.film && !unlimited) setGain(g => g + 1);
    c.film = f;
    if (num(d.n) > c.shown && TIER_TEXT[d.k]) {
      c.shown = num(d.n);
      const rare = RARITY[d.kr] && d.kr !== 'comum' ? `\n${rarityTag(d.kr)}` : '', film = d.k === 'perfect' && bonus ? `\nFILME NOVO +${bonus}` : '';
      showMsg(d.k === 'miss' ? 'PERDEU O FOCO! O Mico riu.' : shotLabel(d.k, num(d.kp)) + rare + film, d.k);
      if (d.k === 'perfect') vibrate([20, 40, 20]);
    } else if (num(d.n) < c.shown) c.shown = num(d.n); // a TV recarregou
    setLinkStatus('');
    setHost(d);
  }

  function onJoin(e) {
    e.preventDefault();
    const room = roomCode(code), who = cleanName(name) || 'Fotógrafo';
    if (room.length !== 4) { setJoinStatus('Digite as 4 letras da sala que aparecem na TV.'); return; }
    store.set('oop-name', who);
    setJoinStatus('Conectando à TV…'); setJoining(true);
    connect(room, who, {
      joined: () => { setName(who); setJoined(true); wakeLock(); flushAim(); track('camera_join', { result: 'ok' }); },
      state: onState,
      photo: m => setPhoto({ src: typeof m.img === 'string' && m.img.startsWith('data:image/png;base64,') ? m.img : '', cap: String(m.cap || '').slice(0, 40), n: num(m.n) }),
      fail: text => { setJoinStatus(text); setJoining(false); track('camera_join', { result: 'fail' }); },
      status: setLinkStatus,
    });
  }

  function onShutter(e) {
    e.preventDefault();
    const now = performance.now();
    if (!joined || now - c.cool < 450) return;
    if (c.film <= 0) {
      showMsg(c.level === 'dificil' ? 'SEM FILME!\nAcabaram as fotos da viagem.' : 'SEM FILME!\nSó uma Foto Perfeita traz filme novo.', 'miss');
      vibrate([40, 30, 40]); return;
    }
    c.cool = now;
    flushAim(); send({ t: 'shot' });
    vibrate(25); setBlink(b => b + 1);
  }

  const changeSet = patch => { const next = { ...sets, ...patch }; setSets(next); saveSettings(c, next); };

  if (!joined) {
    return (
      <section id="cam">
        <form id="join" className="panel join" onSubmit={onJoin}>
          <p className="eyebrow">Câmera · Bem Ti Click</p>
          <h2>Quem vai fotografar?</h2>
          <label htmlFor="codeIn">Sala (as 4 letras da TV)</label>
          <input id="codeIn" maxLength={4} autoComplete="off" autoCapitalize="characters" spellCheck="false" placeholder="ABCD" value={code} onChange={e => setCode(e.target.value)} autoFocus={!code} />
          <label htmlFor="nameIn">Seu nome</label>
          <input id="nameIn" maxLength={14} autoComplete="nickname" placeholder="Ex.: Bruno" value={name} onChange={e => setName(e.target.value)} autoFocus={!!code} />
          <p id="joinStatus" className="dim" aria-live="polite">{joinStatus}</p>
          <button id="joinBtn" className="btn primary" type="submit" disabled={joining}>Entrar na partida</button>
        </form>
      </section>
    );
  }

  const d = host, phase = d.phase || '';
  const st = clamp(num(d.st), 0, STAGES.length - 1), left = clamp(num(d.left), 0, 999), level = levelOf(d.lv);
  const unlimited = num(d.f) < 0, film = unlimited ? Infinity : Math.max(0, num(d.f));
  const clock = linkStatus || (phase === 'playing' ? `${STAGES[st].short} ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : PHASE_TEXT[phase] || 'Aguardando');
  const pts = num(d.s), pos = num(d.p), of = num(d.o);

  return (
    <section id="cam">
      <div id="vf" className="vf">
        <div className="vf-top">
          <span id="meChip" className="me" style={{ '--c': COLORS[num(d.c) % COLORS.length] }}><i /><b id="meName">{name}</b></span>
          <span id="vfClock" className={`vf-clock${phase === 'playing' && !linkStatus ? ' rec' : ''}`}>{clock}</span>
          <span className="film">FOTOS<b key={`film-${gain}`} id="film" className={`${gain ? 'gain' : ''}${film <= 2 ? ' low' : ''}`} aria-label="fotos restantes">{d.phase ? (unlimited ? '∞' : String(film).padStart(2, '0')) : '--'}</b></span>
          <span id="vfScore" className="vf-score">{String(pts).padStart(4, '0')}</span>
        </div>
        <div id="pad" ref={pad} className="pad">
          <div className="thirds" />
          <div className="af"><i /><i /><i /><i /></div>
          <p id="vfExif" className="vf-exif">FILME INSTANTÂNEO · {LEVELS[level].name.toUpperCase()}</p>
          <p id="vfMsg" className={`vf-msg${msg.show ? ' show' : ''} ${msg.kind}`}>{msg.text}</p>
          {hint && <p id="vfHint" className="vf-hint">{mode === 'gyro' ? 'Mova o celular para mirar. “Centralizar” recalibra.' : 'Arraste o dedo aqui para mover a mira na TV'}</p>}
        </div>
        <div className="vf-side">
          <div className="seg" role="group" aria-label="Controle da mira">
            <button id="modeTouch" className={mode === 'touch' ? 'on' : ''} type="button" onClick={() => aim.current.setMode('touch')}>Touchpad</button>
            <button id="modeGyro" className={mode === 'gyro' ? 'on' : ''} type="button" onClick={() => { aim.current.enableGyro(); track('aim_mode', { mode: 'gyro' }); }}>Giroscópio</button>
          </div>
          <button id="recenter" className="btn ghost" type="button" onClick={() => aim.current.recenter()}>Centralizar</button>
          <button id="setBtn" className="btn ghost" type="button" onClick={() => setSettingsOpen(true)}>Ajustes</button>
          {phase === 'playing' && <button id="camPause" className="btn ghost" type="button" onClick={() => send({ t: 'pause' })}>Pausar</button>}
          {phase === 'lobby' && <button id="camStart" className="btn primary" type="button" onClick={() => send({ t: 'start' })}>Começar</button>}
        </div>
        <div className="shut"><button id="shutter" className={`shutter${d.phase && film <= 0 ? ' empty' : ''}`} type="button" aria-label="Disparar foto" onPointerDown={onShutter} /></div>

        {settingsOpen && (
          <div id="settings" className="panel sheet">
            <h3>Ajustes</h3>
            <label htmlFor="sensIn">Sensibilidade <input id="sensIn" type="range" min="0.4" max="2.5" step="0.1" value={sets.sens} onChange={e => changeSet({ sens: Number(e.target.value) || 1 })} /></label>
            <label htmlFor="invXIn">Inverter horizontal (giroscópio) <input id="invXIn" type="checkbox" checked={sets.invX} onChange={e => changeSet({ invX: e.target.checked })} /></label>
            <label htmlFor="invYIn">Inverter vertical (giroscópio) <input id="invYIn" type="checkbox" checked={sets.invY} onChange={e => changeSet({ invY: e.target.checked })} /></label>
            <div className="row"><button id="setClose" className="btn primary" type="button" onClick={() => setSettingsOpen(false)}>Fechar</button></div>
          </div>
        )}

        {phase === 'paused' && (
          <div id="pauseSheet" className="panel sheet end">
            <p className="eyebrow">Jogo pausado</p>
            <h3>{STAGES[st].name}</h3>
            <p className="small">O catálogo de pássaros deste lugar está na TV.</p>
            <div className="row">
              <button id="camResume" className="btn primary" type="button" onClick={() => send({ t: 'resume' })}>Continuar</button>
              <button id="camExit" className="btn" type="button" onClick={() => send({ t: 'exit' })}>Sair da viagem</button>
            </div>
          </div>
        )}

        {phase === 'end' && (
          <div id="endSheet" className="panel sheet end">
            <p className="eyebrow">Fim da viagem</p>
            <h3 id="endScore">{pts} ponto{pts === 1 ? '' : 's'}</h3>
            <p id="endNote" className="small">{(d.w ? 'Volta ao mundo completa!' : `A viagem parou em ${STAGES[st].name}.`) + (of > 1 && pos ? ` Você ficou em ${pos}º de ${of}.` : '')}</p>
            <div className="row">
              <button id="camAgain" className="btn primary" type="button" onClick={() => send({ t: 'start' })}>Continuar jogando</button>
              <a id="camSite" className="btn" href={portfolioUrl()} target="_blank" rel="noopener" onClick={() => track('portfolio_click', { from: 'camera' })}>Conhecer outros projetos do Bruno</a>
            </div>
          </div>
        )}

        <div key={`blink-${blink}`} id="blink" className={`blink${blink ? ' go' : ''}`} />
        {photo && (
          <div key={`photo-${photo.n}`} id="instant" className="instant out" aria-live="polite">
            <div className="instant-img">{photo.src && <img id="instantImg" src={photo.src} alt="" />}</div>
            <p id="instantCap">{photo.cap}</p>
          </div>
        )}
      </div>
    </section>
  );
}
