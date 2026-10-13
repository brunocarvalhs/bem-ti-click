// Sala da TV: o código de 4 letras é o id da TV no PeerJS e cada celular abre uma conexão direta com ela.
import { Peer } from 'peerjs';
import { PEER_PREFIX, PEER_OPTS } from '../../shared/net.js';
import { cleanName } from '../../shared/util.js';

export const net = { peer: null, error: '', code: '' };
const conns = new Map(); // token da câmera -> conexão aberta
let on = null;           // { open(code), join(token, name) -> recusa|null, data(token, msg), leave(token), change() }

export function openRoom(handlers) {
  on = handlers;
  open(0);
}

// Recarregar a página tenta manter o mesmo código; se estiver ocupado, sorteia outro.
function open(tries) {
  let saved = '';
  try { saved = sessionStorage.getItem('oop-room') || ''; } catch (e) {}
  const A = 'ABCDEFGHJKLMNPRSTUVWXYZ'; // sem I, O e Q para não confundir
  const code = saved || Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join('');
  const peer = net.peer = new Peer(PEER_PREFIX + code, PEER_OPTS);
  peer.on('open', () => {
    net.error = ''; net.code = code;
    try { sessionStorage.setItem('oop-room', code); } catch (e) {}
    on.open(code); on.change();
  });
  peer.on('connection', accept);
  peer.on('disconnected', () => { on.change(); setTimeout(() => { if (!peer.destroyed) peer.reconnect(); }, 1500); });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { // código em uso: outra TV, ou esta mesma recarregada há poucos segundos
      peer.destroy();
      if (saved && tries < 3) return setTimeout(() => open(tries + 1), 2000);
      try { sessionStorage.removeItem('oop-room'); } catch (er) {}
      return open(0);
    }
    if (e.type !== 'peer-unavailable') { net.error = e.type; on.change(); }
  });
}

function accept(conn) {
  const meta = conn.metadata || {};
  const token = String(meta.token || conn.peer).slice(0, 64);
  conn.on('open', () => {
    const refusal = on.join(token, cleanName(meta.name));
    if (refusal) { conn.send({ t: 'nope', msg: refusal }); setTimeout(() => conn.close(), 500); return; }
    const old = conns.get(token); if (old && old !== conn) old.close(); // mesma câmera reconectou
    conns.set(token, conn);
    conn.send({ t: 'joined' });
    on.change();
  });
  conn.on('data', m => { if (conns.get(token) === conn && m && typeof m === 'object') on.data(token, m); });
  conn.on('close', () => {
    if (conns.get(token) !== conn) return;
    conns.delete(token);
    on.leave(token);
  });
}

export function sendTo(token, m) { const c = conns.get(token); if (c && c.open) c.send(m); }

// Monta uma mensagem por câmera conectada (make devolve null para pular).
export function sendEach(make) {
  for (const [token, c] of conns) { const m = c.open && make(token); if (m) c.send(m); }
}
