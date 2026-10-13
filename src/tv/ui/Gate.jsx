// Tela de abertura: libera som e tela cheia num clique.
import { useEffect, useRef } from 'react';
import { arm } from '../engine/game.js';
import { marquee } from '../engine/render.js';
import { useTv } from './useTv.js';

export function Gate() {
  const tv = useTv();
  const cv = useRef(null);
  useEffect(() => { marquee(cv.current); }, []);
  return (
    <div id="gate" className="panel gate">
      <p className="eyebrow">Jogo de fotografia para duas telas</p>
      <h1>Bem Ti <span>Click</span></h1>
      <canvas ref={cv} id="marquee" className="px" width="128" height="32" aria-hidden="true" />
      <p id="gateText" className="dim">
        {tv.selfCheck ? `Teste das regras de pontuação: ${tv.selfCheck}` : 'Esta tela é a TV. Um clique libera o som e tenta abrir em tela cheia; depois é só escanear o QR Code com o celular.'}
      </p>
      <div className="row"><button id="armTv" className="btn primary" type="button" onClick={arm}>Preparar a TV</button></div>
    </div>
  );
}
