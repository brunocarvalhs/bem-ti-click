// Mapa-múndi: escolhe o país no mapa, depois o lugar; mostra os pássaros de cada lugar e quanto valem.
import { useState } from 'react';
import { STAGES, COUNTRIES, stagesOf } from '../../art/stages.js';
import { worldMapImage, mapPos } from '../../art/worldmap.js';
import { placeImage } from '../../ui/images.js';
import { setStart } from '../engine/game.js';
import { useTv } from './useTv.js';
import { BirdList } from './BirdList.jsx';
import { countryName, rarityNote } from './text.js';

export function WorldMap({ onClose }) {
  const tv = useTv();
  const [country, setCountry] = useState(STAGES[tv.start].country);
  const [pick, setPick] = useState(tv.start);
  const places = stagesOf(country);
  const chosen = STAGES[pick];

  const chooseCountry = key => { setCountry(key); setPick(stagesOf(key)[0].i); };

  return (
    <div id="worldMap" className="panel worldmap">
      <div className="worldmap-head">
        <p className="eyebrow">Mapa-múndi</p>
        <h2>Onde a viagem começa?</h2>
        <p className="dim small">A viagem segue pelos lugares seguintes até a Austrália. {rarityNote()}</p>
      </div>
      <div className="worldmap-body">
        <div className="map-frame">
          <img src={worldMapImage()} alt="Mapa-múndi com os países do jogo" className="px-img map-img" />
          {COUNTRIES.map(c => {
            const p = mapPos(c.lon, c.lat);
            return (
              <button key={c.key} type="button" data-country={c.key} className="map-pin" aria-pressed={c.key === country}
                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} onClick={() => chooseCountry(c.key)}>
                <i aria-hidden="true" /><span>{c.name}</span>
              </button>
            );
          })}
        </div>
        <div className="map-side">
          <h3>{countryName(country)}</h3>
          <div className="place-tabs" role="group" aria-label="Lugares">
            {places.map(st => (
              <button key={st.i} type="button" data-place={st.i} aria-pressed={st.i === pick} onClick={() => setPick(st.i)}>
                <img src={placeImage(st.i)} alt="" className="px-img" />
                <span>{st.i + 1}. {st.name}</span>
              </button>
            ))}
          </div>
          <BirdList names={chosen.birds} />
        </div>
      </div>
      <div className="row">
        <button id="mapGo" className="btn primary" type="button" onClick={() => { setStart(pick); onClose(); }}>Começar em {chosen.name}</button>
        <button id="mapBack" className="btn" type="button" onClick={onClose}>Voltar</button>
      </div>
    </div>
  );
}
