// TV (host): o canvas do jogo por baixo e a interface em React por cima.
import { useEffect, useRef } from 'react';
import '../../styles/tv.css';
import { STAGES } from '../../art/stages.js';
import { rankPlayers, stageTarget } from '../../core/rules.js';
import { initAnalytics } from '../../shared/analytics.js';
import { startEngine, mouseMove, mouseDown, pause, resume } from '../engine/game.js';
import { onlineCams } from '../engine/state.js';
import { net } from '../engine/room.js';
import { useTv } from './useTv.js';
import { filmLabel, clockText } from './text.js';
import { Gate } from './Gate.jsx';
import { Lobby } from './Lobby.jsx';
import { Travel, Pause, Results } from './Screens.jsx';

const LIVE = ['countdown', 'playing', 'travel', 'paused'];

function Hud() {
  const tv = useTv();
  const goal = stageTarget(tv.stage, onlineCams());
  const low = tv.phase === 'playing' && Math.ceil(tv.timeLeft) <= 10;
  return (
    <div className="hud">
      <ol id="scoreboard" className="scoreboard">
        {rankPlayers(tv.players.values()).map(pl => (
          <li key={pl.key} className={pl.online ? '' : 'off'}>
            <i style={{ '--c': pl.color }} />
            <span>{pl.name.toUpperCase()}</span>
            <em className={pl.film <= 0 ? 'out' : ''} title="fotos restantes">{filmLabel(pl.film)}</em>
            <b>{String(pl.score).padStart(4, '0')}</b>
          </li>
        ))}
      </ol>
      <div className="top-center">
        {tv.phase !== 'travel' && <div id="clock" className={`clock${low ? ' low' : ''}`}>{clockText(tv.timeLeft)}</div>}
        <div id="stageInfo" className="stage-info">
          <span id="stageName">{tv.stage + 1}/{STAGES.length} {STAGES[tv.stage].short}</span>
          <span className="meter" aria-hidden="true"><i id="stageFill" style={{ width: `${Math.min(100, (tv.stagePts / goal) * 100)}%` }} /></span>
          <span id="stageGoal">{Math.min(tv.stagePts, goal)}/{goal}</span>
        </div>
      </div>
      {tv.phase === 'playing' && <button id="pauseBtn" className="btn pause-btn" type="button" onClick={() => pause('tv')}>❚❚ Pausa</button>}
      {net.code && (
        <div id="qrCorner" className="qr-corner">
          {tv.qr && <img src={tv.qr} alt="QR Code para entrar como câmera" />}
          <span id="codeSmall">{net.code}</span>
        </div>
      )}
    </div>
  );
}

export default function TvApp({ params }) {
  const tv = useTv();
  const canvas = useRef(null);

  useEffect(() => {
    initAnalytics('tv');
    startEngine(canvas.current, params);
  }, [params]);

  // P ou Esc pausa e continua.
  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape' && e.key.toLowerCase() !== 'p') return;
      if (tv.phase === 'playing') pause('tv'); else if (tv.phase === 'paused') resume();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [tv]);

  return (
    <section id="tv" className={tv.players.has('mouse') ? 'aim' : ''}>
      <canvas ref={canvas} id="scene" className="px" onPointerMove={e => mouseMove(e.clientX, e.clientY)} onPointerDown={mouseDown} />
      {LIVE.includes(tv.phase) && <Hud />}
      <div className="overlay">
        {tv.phase === 'gate' && <Gate />}
        {tv.phase === 'lobby' && <Lobby />}
        {tv.phase === 'countdown' && <div id="countdown" className="countdown">{Math.max(1, Math.ceil(tv.countdown))}</div>}
        {tv.phase === 'travel' && <Travel />}
        {tv.phase === 'paused' && <Pause />}
        {tv.phase === 'end' && <Results />}
      </div>
    </section>
  );
}
