// Textos da TV que dependem do estado (nível, lugar, rede). Ficam juntos para revisar a linguagem num lugar só.
import { FILM_PACK } from '../../config.js';
import { NET_ERR } from '../../shared/net.js';
import { LEVELS, RARITY, multText, stageTarget } from '../../core/rules.js';
import { STAGES, COUNTRIES } from '../../art/stages.js';
import { onlineCams } from '../engine/state.js';
import { net } from '../engine/room.js';

export const filmLabel = f => (f === Infinity ? '∞' : String(f));
export const clockText = t => { const s = Math.max(0, Math.ceil(t)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const countryName = key => (COUNTRIES.find(c => c.key === key) || {}).name || '';

export function levelNote(level, hard) {
  if (level === 'facil') return 'Fácil: fotos ilimitadas. Bom para pegar o jeito da mira.';
  if (level === 'dificil') return `Difícil: ${hard} fotos para a viagem inteira, sem filme novo. Cada clique conta.`;
  return `Normal: cada câmera começa com ${FILM_PACK} fotos; Foto Perfeita e lugar novo dão mais ${FILM_PACK}.`;
}

export const rarityNote = () => 'Ave rara vale mais: ' + Object.keys(RARITY).map(k => `${RARITY[k].name} ${multText(k)}`).join(' · ') + '.';

export function travelNote(tv) {
  const here = STAGES[tv.stage].name, bonus = LEVELS[tv.level].bonus;
  if (tv.level === 'facil') return `Meta de ${here} batida. Filme ilimitado: pode clicar à vontade.`;
  return bonus ? `Meta de ${here} batida. Todo mundo ganha filme novo: +${bonus} fotos.` : `Meta de ${here} batida. No Difícil não tem filme novo: cuide das fotos que restam.`;
}

export function journeyText(tv) {
  if (tv.won) return tv.start === 0 ? `Volta ao mundo completa: do Brasil à Austrália, ${STAGES.length} lugares!` : `Viagem completa: de ${STAGES[tv.start].name} até ${STAGES[STAGES.length - 1].name}!`;
  return `A viagem parou em ${STAGES[tv.stage].name} (lugar ${tv.stage + 1} de ${STAGES.length}). Faltaram ${Math.max(0, stageTarget(tv.stage, onlineCams()) - tv.stagePts)} pontos para a meta.`;
}

export function netText(tv) {
  const cams = [...tv.players.values()].filter(p => !p.local && p.online).length;
  return net.error === 'browser-incompatible' ? 'Este navegador não suporta conexão direta (WebRTC). Use Chrome, Edge, Firefox ou Safari atualizados.'
    : NET_ERR.includes(net.error) || (net.peer && net.peer.disconnected && net.code) ? 'Sem conexão com o serviço de pareamento. Confira a internet; tentando de novo…'
    : net.error ? `Erro de conexão (${net.error}). Recarregue a página.`
    : !net.code ? 'Criando a sala…'
    : cams ? `${cams} câmera(s) conectada(s). Mais gente pode entrar pelo QR Code.` : 'Pronto. Escaneie o QR Code com o celular ou digite o endereço abaixo dele.';
}
