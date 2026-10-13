// Catálogo de pássaros: sprite, nome, raridade e quanto vale cada foto. Usado no mapa e na pausa.
import { TIERS, rarityOf, multText } from '../../core/rules.js';
import { birdImage, speciesOf } from '../../ui/images.js';

// album (opcional) = espécies já fotografadas na viagem, para marcar no catálogo.
export function BirdList({ names, album }) {
  return (
    <ul className={`bird-list${album ? ' with-album' : ''}`}>
      {names.map(name => {
        const sp = speciesOf(name), r = rarityOf(sp.rarity);
        const [perfect, good, shaky] = TIERS.map(t => Math.round(t.pts * r.mult));
        const got = album && album.has(name);
        return (
          <li key={name} className={got ? 'got' : ''}>
            <img src={birdImage(name)} alt="" className="px-img" />
            <div className="bird-name">
              <b>{name}</b>
              <span className="rarity" style={{ '--r': r.color }}>{r.name} {multText(sp.rarity)}</span>
            </div>
            <div className="bird-pts">
              <b>{perfect}</b>
              <span>Boa {good} · Tremida {shaky}</span>
            </div>
            {album && <em>{got ? '✓ fotografado' : 'falta'}</em>}
          </li>
        );
      })}
    </ul>
  );
}
