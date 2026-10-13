// Painéis curtos da TV: viagem entre lugares, pausa e fim da viagem.
import { STAGES, countryOf, birdsOf } from '../../art/stages.js';
import { LEVELS, rankPlayers } from '../../core/rules.js';
import { portfolioUrl } from '../../shared/util.js';
import { track } from '../../shared/analytics.js';
import { resume, exitTrip, startGame, setPhase } from '../engine/game.js';
import { useTv } from './useTv.js';
import { BirdList } from './BirdList.jsx';
import { travelNote, journeyText } from './text.js';

export function Travel() {
  const tv = useTv();
  const next = STAGES[tv.stage + 1];
  const abroad = next && next.country !== STAGES[tv.stage].country;
  return (
    <div id="travel" className="panel travel">
      <p className="eyebrow">{abroad ? `Meta batida! Rumo ${countryOf(tv.stage + 1).to}` : 'Meta batida!'}</p>
      <h2 id="travelTo">{next ? `Próxima parada: ${next.name}` : ''}</h2>
      <p id="travelNote" className="dim">{travelNote(tv)}</p>
    </div>
  );
}

export function Pause() {
  const tv = useTv();
  const c = countryOf(tv.stage), names = birdsOf(c.key);
  const got = names.filter(n => tv.album.has(n)).length;
  return (
    <div id="pausePanel" className="panel pause" role="dialog" aria-labelledby="pauseTitle">
      <p className="eyebrow">Jogo pausado · {STAGES[tv.stage].name}</p>
      <h2 id="pauseTitle">Catálogo: {c.name}</h2>
      <p className="dim small">{got} de {names.length} espécies fotografadas nesta viagem. O número grande é quanto vale uma Foto Perfeita.</p>
      <BirdList names={names} album={tv.album} />
      <div className="row">
        <button id="resumeBtn" className="btn primary" type="button" onClick={resume} autoFocus>Continuar</button>
        <button id="exitBtn" className="btn" type="button" onClick={exitTrip}>Sair da viagem</button>
      </div>
    </div>
  );
}

function Print({ pl }) {
  if (!pl.best) return <div className="print none">sem foto</div>;
  return (
    <div className="print">
      <img className="px-img" src={pl.best.img} alt={`Melhor foto de ${pl.name}: ${pl.best.sp}`} />
      <span>{pl.best.sp} · {pl.best.label}</span>
    </div>
  );
}

function Board({ tv }) {
  const b = tv.board;
  const title = `${b && b.where === 'online' ? 'Ranking geral' : 'Ranking desta TV'} · ${LEVELS[tv.level].name}`;
  let body;
  if (!b || b.loading) body = <li className="empty">Carregando…</li>;
  else if (!b.rows.length) body = <li className="empty">Ninguém pontuou neste nível ainda.</li>;
  else body = b.rows.map((r, i) => (
    <li key={i} className={b.mine.some(m => m.name === r.name && m.score === r.score) ? 'mine' : ''}>
      <span className="pos">{i + 1}</span><span className="name">{r.name}</span>
      <span className="where">{STAGES[r.stage - 1] ? STAGES[r.stage - 1].short : ''}</span><b>{r.score}</b>
    </li>
  ));
  return (
    <section aria-labelledby="boardTitle">
      <h3 id="boardTitle">{title}</h3>
      <ol id="board" className="board" aria-live="polite">{body}</ol>
    </section>
  );
}

export function Results() {
  const tv = useTv();
  const ranked = rankPlayers(tv.players.values());
  const nobody = !ranked.length || ranked[0].score === 0;
  return (
    <div id="results" className="panel results">
      <p className="eyebrow">Fim da viagem · Nível <b id="resultsLevel">{LEVELS[tv.level].name}</b></p>
      <h2 id="winner">{nobody ? 'Ninguém conseguiu foto. O Mico venceu.' : `${ranked[0].name} fez o melhor álbum!`}</h2>
      <p id="journey" className="dim">{journeyText(tv)}</p>
      <div className="results-body">
        <section aria-labelledby="roundTitle">
          <h3 id="roundTitle">Esta partida</h3>
          <ol id="ranking" className="ranking">
            {ranked.map((pl, i) => (
              <li key={pl.key}>
                <span className="pos">{i + 1}</span>
                <Print pl={pl} />
                <div className="who">
                  <b><i style={{ '--c': pl.color }} />{pl.name}</b>
                  <span>{pl.perfect} perfeita{pl.perfect === 1 ? '' : 's'}{pl.best ? ` · melhor foto ${Math.round((1 - Math.min(1, pl.best.d)) * 100)}% centralizada` : ''}</span>
                </div>
                <span className="pts">{pl.score}</span>
              </li>
            ))}
          </ol>
        </section>
        <Board tv={tv} />
      </div>
      <div className="row">
        <button id="againBtn" className="btn primary" type="button" onClick={() => startGame('tv')}>Continuar jogando</button>
        <button id="levelBtn" className="btn" type="button" onClick={() => setPhase('lobby')}>Mudar nível ou destino</button>
        <a id="siteLink" className="btn ghost" href={portfolioUrl()} target="_blank" rel="noopener" onClick={() => track('portfolio_click', { from: 'tv' })}>Conhecer outros projetos do Bruno</a>
      </div>
    </div>
  );
}
