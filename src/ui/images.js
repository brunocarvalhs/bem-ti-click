// Imagens prontas para usar em <img>: sprite de cada espécie e miniatura de cada lugar (geradas uma vez).
import { SPECIES, BIRD_SPR } from '../art/birds.js';
import { paintBackdrop } from '../art/stages.js';

const birds = new Map(), places = new Map();

export const speciesOf = name => SPECIES.find(s => s.name === name);

export function birdImage(name) {
  if (!birds.has(name)) birds.set(name, BIRD_SPR.get(speciesOf(name))[1].c.toDataURL('image/png'));
  return birds.get(name);
}

export function placeImage(i) {
  if (!places.has(i)) { const c = document.createElement('canvas'); paintBackdrop(c, i); places.set(i, c.toDataURL('image/png')); }
  return places.get(i);
}
