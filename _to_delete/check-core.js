// Checa as regras puras do jogo (bloco CORE do HTML publicado). Uso: node check-core.js <arquivo.html>
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const html = fs.readFileSync(process.argv[2], 'utf8');
const core = html.slice(html.indexOf('// CORE-START'), html.indexOf('// CORE-END'));
const ctx = {}; vm.createContext(ctx);
vm.runInContext(core + '\nthis.api = { scoreShot, judge, rankPlayers };', ctx);
const { scoreShot, judge, rankPlayers } = ctx.api;

const bird = { id: 1, x: 500, y: 300, rx: 50, ry: 30 };
assert.strictEqual(scoreShot({ x: 500, y: 300 }, [bird]).pts, 100);          // centro
assert.strictEqual(scoreShot({ x: 520, y: 300 }, [bird]).pts, 50);           // d = 0.4
assert.strictEqual(scoreShot({ x: 500, y: 327 }, [bird]).pts, 10);           // d = 0.9 (vertical, ry)
assert.strictEqual(scoreShot({ x: 580, y: 300 }, [bird]).key, 'miss');       // d = 1.6
assert.strictEqual(scoreShot({ x: 0, y: 0 }, []).pts, 0);                    // céu vazio
const near = { id: 2, x: 700, y: 300, rx: 50, ry: 30 };
assert.strictEqual(scoreShot({ x: 698, y: 300 }, [bird, near]).bird.id, 2);  // escolhe o pássaro mais centralizado

// compensação de latência: vale o melhor quadro dos últimos 240 ms; quadro cravado de 500 ms atrás fica fora
const hist = [
  { t: 500, aims: { a: { x: 500, y: 300 } }, birds: [bird] },                // d = 0, mas velho demais
  { t: 900, aims: { a: { x: 500, y: 300 } }, birds: [{ ...bird, x: 520 }] }, // d = 0.4 -> boa
  { t: 1000, aims: { a: { x: 500, y: 300 } }, birds: [{ ...bird, x: 560 }] },// d = 1.2 -> errou
];
assert.strictEqual(judge(hist, 'a', 1000).pts, 50);
assert.strictEqual(judge(hist, 'zzz', 1000).key, 'miss');                    // jogador sem mira no histórico

// desempate: mesma pontuação, vence a foto mais centralizada
const r = rankPlayers([{ name: 'A', score: 100, perfect: 1, best: { d: 0.15 } }, { name: 'B', score: 100, perfect: 1, best: { d: 0.05 } }]);
assert.strictEqual(r[0].name, 'B');
console.log('core ok');
