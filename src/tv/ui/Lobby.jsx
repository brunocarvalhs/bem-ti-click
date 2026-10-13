// Lobby: QR Code, câmeras conectadas, destino (mapa-múndi) e nível.
import { useState } from 'react';
import { HARD_FILM, FILM_PACK } from '../../config.js';
import { STAGES } from '../../art/stages.js';
import { track } from '../../shared/analytics.js';
import { setLevel, setHard, startGame, toggleMouse } from '../engine/game.js';
import { net } from '../engine/room.js';
import { useTv } from './useTv.js';
import { levelNote, rarityNote, netText, countryName } from './text.js';
import { WorldMap } from './WorldMap.jsx';

// "· Brasil · a viagem segue pelos lugares seguintes" (sem repetir o país quando ele já está no nome do lugar).
function destinationNote(i) {
  const st = STAGES[i], country = countryName(st.country);
  const parts = [!st.name.includes(country) && country, i < STAGES.length - 1 ? `a viagem segue até ${STAGES[STAGES.length - 1].name}` : 'última parada da viagem'];
  return '· ' + parts.filter(Boolean).join(' · ');
}

const LEVEL_CARDS = [
  { key: 'facil', name: 'Fácil', hint: 'Fotos ilimitadas' },
  { key: 'normal', name: 'Normal', hint: `${FILM_PACK} fotos, +${FILM_PACK} por Foto Perfeita` },
  { key: 'dificil', name: 'Difícil', hint: 'Você escolhe o limite' },
];

export function Lobby() {
  const tv = useTv();
  const [mapOpen, setMapOpen] = useState(false);
  const [hardText, setHardText] = useState(String(tv.hard));
  const players = [...tv.players.values()];
  const start = STAGES[tv.start];

  if (mapOpen) return <WorldMap onClose={() => setMapOpen(false)} />;

  return (
    <div id="lobby" className="panel lobby">
      <div className="lobby-qr">
        {tv.qr ? <div id="qrBig" className="qr-big"><img src={tv.qr} alt="QR Code para entrar como câmera" /></div> : null}
        <p id="joinUrl" className="join-url">{tv.joinUrl}</p>
      </div>
      <div className="lobby-info">
        <p className="eyebrow">Sala <b id="codeBig">{net.code || '----'}</b></p>
        <h2>Aponte o celular para o QR Code</h2>
        <p id="netStatus" className="dim">{netText(tv)}</p>
        <ul id="roster" className="roster">
          {players.map(pl => <li key={pl.key}><i style={{ '--c': pl.color }} /><span>{pl.online ? pl.name : `${pl.name} (saiu)`}</span></li>)}
          {!players.length && <li className="empty">Nenhuma câmera conectada ainda</li>}
        </ul>

        <div className="destination">
          <p className="eyebrow">Destino</p>
          <p id="destination"><b>{start.name}</b> <span className="dim">{destinationNote(tv.start)}</span></p>
          <button id="mapBtn" className="btn" type="button" onClick={() => { setMapOpen(true); track('map_open'); }}>Escolher no mapa</button>
        </div>

        <fieldset id="levels" className="levels">
          <legend className="eyebrow">Nível</legend>
          {LEVEL_CARDS.map(l => (
            <button key={l.key} type="button" data-lv={l.key} aria-pressed={tv.level === l.key} onClick={() => setLevel(l.key)}><b>{l.name}</b><span>{l.hint}</span></button>
          ))}
        </fieldset>
        {tv.level === 'dificil' && (
          <label id="hardRow" className="hard-row" htmlFor="hardIn">Fotos para a viagem toda
            <input id="hardIn" type="number" min={HARD_FILM.min} max={HARD_FILM.max} step="1" inputMode="numeric" value={hardText}
              onChange={e => { setHardText(e.target.value); setHard(e.target.value); }}
              onBlur={() => setHardText(String(tv.hard))} />
          </label>
        )}
        <p id="levelNote" className="dim small">{levelNote(tv.level, tv.hard)}</p>
        <p id="rarityNote" className="dim small">{rarityNote()}</p>
        <div className="row">
          <button id="startBtn" className="btn primary" type="button" disabled={!players.some(p => p.online)} onClick={() => startGame('tv')}>Começar</button>
          <button id="mouseBtn" className="btn" type="button" onClick={toggleMouse}>{tv.players.has('mouse') ? 'Tirar o mouse' : 'Jogar com o mouse'}</button>
        </div>
      </div>
    </div>
  );
}
