// Olha o Passarinho! — servidor de salas.
// Entrega a página, cria a sala da TV (com QR Code) e repassa mensagens entre câmeras e TV. Nenhuma regra de jogo mora aqui: a TV decide tudo.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');
const QRCode = require('qrcode');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');
const INDEX = path.join(__dirname, 'public', 'index.html');
const MAX_CAMS = 6;
const HOST_GRACE_MS = 60_000; // TV que recarrega a página volta para a mesma sala dentro desse prazo

function lanUrl() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) return `http://${a.address}:${PORT}`;
  }
  return `http://localhost:${PORT}`;
}
// Endereço que vai no QR: PUBLIC_URL > o próprio endereço que a TV abriu > IP da rede local (quando a TV abriu em localhost).
function baseUrl(headers) {
  if (PUBLIC_URL) return PUBLIC_URL;
  const host = String(headers.host || '');
  if (!host || /^(localhost|127\.|\[::1\])/.test(host)) return lanUrl();
  const proto = String(headers['x-forwarded-proto'] || 'http').split(',')[0];
  return `${proto}://${host}`;
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  if (req.method === 'GET' && (pathname === '/' || pathname === '/c' || /^\/c\/[A-Za-z]{4}$/.test(pathname))) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
    return fs.createReadStream(INDEX).pipe(res);
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Não encontrado');
});

const io = new Server(server, { maxHttpBufferSize: 4096, pingInterval: 10_000, pingTimeout: 8_000 });
const rooms = new Map(); // código -> { key, host, players: Map(token -> {id, name, sid}), timer }
const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ'; // sem I, O e Q para não confundir
let seq = 0;
const newCode = () => { let c; do c = Array.from({ length: 4 }, () => LETTERS[crypto.randomInt(LETTERS.length)]).join(''); while (rooms.has(c)); return c; };
const cleanName = s => String(s || '').replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 14);
const unit = v => Math.min(1, Math.max(0, Number(v) || 0));

io.on('connection', socket => {
  const q = socket.handshake.query;
  if (q.role === 'host') return onHost(socket, q);
  if (q.role === 'cam') return onCam(socket, q);
  socket.disconnect(true);
});

function onHost(socket, q) {
  let code = String(q.code || '').toUpperCase();
  let room = rooms.get(code);
  if (!room || room.key !== q.key) {
    code = newCode();
    room = { key: crypto.randomUUID(), host: null, players: new Map(), timer: null };
    rooms.set(code, room);
  }
  if (room.host && room.host !== socket.id) io.in(room.host).disconnectSockets(true); // a mesma TV reconectou antes de o servidor notar a queda
  clearTimeout(room.timer);
  room.host = socket.id;
  const joinUrl = `${baseUrl(socket.handshake.headers)}/c/${code}`;
  QRCode.toDataURL(joinUrl, { margin: 1, width: 480 }).then(qr => socket.emit('room', { code, key: room.key, joinUrl, qr }));
  for (const p of room.players.values()) if (p.sid) socket.emit('join', p.id, p.name);
  io.to(code).emit('host', true);

  socket.on('to', (id, data) => { // estado de um jogador (placar, último resultado, fase, tempo)
    for (const p of room.players.values()) if (p.id === id && p.sid) io.to(p.sid).emit('state', data);
  });
  socket.on('disconnect', () => {
    if (room.host !== socket.id) return;
    room.host = null;
    io.to(code).emit('host', false);
    room.timer = setTimeout(() => { rooms.delete(code); io.in(code).disconnectSockets(true); }, HOST_GRACE_MS);
  });
}

function onCam(socket, q) {
  const code = String(q.room || '').toUpperCase();
  const room = rooms.get(code);
  if (!room) { socket.emit('nope', 'Sala não encontrada. Escaneie de novo o QR Code que está na TV.'); return socket.disconnect(true); }
  const token = String(q.token || socket.id).slice(0, 64);
  let p = room.players.get(token);
  if (!p) {
    if (room.players.size >= MAX_CAMS) { socket.emit('nope', `Sala cheia: no máximo ${MAX_CAMS} câmeras.`); return socket.disconnect(true); }
    p = { id: 'c' + ++seq, name: cleanName(q.name) || 'Fotógrafo', sid: null };
    room.players.set(token, p);
  }
  if (p.sid && p.sid !== socket.id) io.in(p.sid).disconnectSockets(true); // mesma câmera aberta em outra aba
  p.sid = socket.id;
  socket.join(code);
  socket.emit('joined', { id: p.id, host: !!room.host });
  const toHost = (event, ...args) => { if (room.host) io.to(room.host).emit(event, p.id, ...args); };
  toHost('join', p.name);

  socket.on('aim', (x, y) => { if (room.host) io.to(room.host).volatile.emit('aim', p.id, unit(x), unit(y)); });
  socket.on('shot', () => toHost('shot'));
  socket.on('start', () => toHost('start'));
  socket.on('disconnect', () => { if (p.sid === socket.id) { p.sid = null; toHost('leave'); } });
}

server.listen(PORT, () => {
  console.log(`\n  Olha o Passarinho! no ar`);
  console.log(`  TV (este computador): http://localhost:${PORT}`);
  console.log(`  Câmeras entram pelo QR Code: ${PUBLIC_URL || lanUrl()}/c/CODIGO\n`);
});
