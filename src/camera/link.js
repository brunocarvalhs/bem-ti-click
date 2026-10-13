// Conexão do celular com a TV: entra na sala pelo PeerJS e reconecta sozinho se a rede cair.
import { Peer } from 'peerjs';
import { PEER_PREFIX, PEER_OPTS, NET_ERR } from '../shared/net.js';
import { store } from '../shared/util.js';

let peer = null, conn = null, retryTimer = 0, openTimer = 0, joined = false;
let target = { code: '', name: '' }, on = {}; // on: { joined(), state(d), photo(m), fail(msg), status(text) }

// Identifica esta câmera para voltar à partida (com os pontos) se a conexão cair.
function camToken() {
  let t = store.get('oop-token');
  if (!t) { t = Math.random().toString(36).slice(2) + Date.now().toString(36); store.set('oop-token', t); }
  return t;
}

export function connect(code, name, handlers) {
  target = { code, name }; on = handlers; joined = false;
  open();
}

export function send(m) { if (conn && conn.open) conn.send(m); }

function fail(msg) { clearTimeout(openTimer); on.fail(msg); }
function retryLater() { clearTimeout(retryTimer); retryTimer = setTimeout(open, 2500); }

function open() {
  clearTimeout(retryTimer);
  if (!peer || peer.destroyed) {
    peer = new Peer(PEER_OPTS);
    peer.on('disconnected', () => setTimeout(() => { if (peer && !peer.destroyed) peer.reconnect(); }, 1500));
    peer.on('error', e => {
      if (joined) { on.status(e.type === 'peer-unavailable' ? 'TV desconectada' : 'Reconectando…'); return retryLater(); }
      fail(e.type === 'peer-unavailable' ? 'Sala não encontrada. Confira as 4 letras na TV ou escaneie o QR Code de novo.'
        : NET_ERR.includes(e.type) ? 'Sem conexão com o serviço de pareamento. Confira a internet do celular.'
        : e.type === 'browser-incompatible' ? 'Este navegador não suporta conexão direta (WebRTC).'
        : `Não consegui conectar (${e.type}).`);
    });
  }
  const go = () => {
    if (conn) conn.close();
    const c = conn = peer.connect(PEER_PREFIX + target.code, { metadata: { name: target.name, token: camToken() }, serialization: 'json', reliable: true });
    c.on('data', m => {
      if (c !== conn || !m || typeof m !== 'object') return;
      if (m.t === 'joined') { clearTimeout(openTimer); joined = true; on.joined(); }
      else if (m.t === 'nope') fail(String(m.msg || 'A TV recusou a entrada.'));
      else if (m.t === 'state') on.state(m);
      else if (m.t === 'photo') on.photo(m);
    });
    c.on('close', () => { if (c === conn && joined) { on.status('Reconectando…'); retryLater(); } });
    if (!joined) { clearTimeout(openTimer); openTimer = setTimeout(() => { if (!joined) fail('A conexão com a TV não abriu. Deixe TV e celular na mesma Wi‑Fi e tente de novo.'); }, 15000); }
  };
  if (peer.open) go(); else peer.once('open', go);
}
