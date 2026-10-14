// node test/gyro.test.js — mira do giroscópio em várias posições do celular.
import assert from 'node:assert/strict';
import { gyroToAim, deadzone } from '../src/camera/gyro.js';

const near = (got, want, msg) => assert.ok(Math.abs(got - want) < 1e-6, `${msg}: ${got} ≠ ${want}`);
const check = (rate, grav, angle, yaw, pitch, msg) => { const r = gyroToAim(rate, grav, angle); near(r.yaw, yaw, msg + ' yaw'); near(r.pitch, pitch, msg + ' pitch'); };
const s = Math.SQRT1_2;

// Em pé, sem gravidade: igual ao comportamento antigo.
check({ gamma: -10, beta: 5 }, null, 0, 10, 5, 'em pé sem gravidade');
check({ gamma: -10, beta: 5 }, { x: 0, y: 9.8, z: 0 }, 0, 10, 5, 'em pé');
// Inclinado 45° (como se segura de verdade): girar o corpo 20°/s para a direita = yaw 20, sem vazar para o pitch.
check({ beta: 0, gamma: -20 * s, alpha: -20 * s }, { x: 0, y: 9.8 * s, z: 9.8 * s }, 0, 20, 0, 'inclinado 45°');
// Deitado, apontando com o topo como controle remoto: o giro vem do alpha.
check({ alpha: -20, beta: 10, gamma: 0 }, { x: 0, y: 0, z: 9.8 }, 0, 20, 10, 'deitado');
// Paisagem (90° e 270°).
check({ beta: -10, gamma: -5 }, { x: 9.8, y: 0, z: 0 }, 90, 10, 5, 'paisagem 90');
check({ beta: 10, gamma: 5 }, { x: -9.8, y: 0, z: 0 }, 270, 10, 5, 'paisagem 270');
// iPhone com gravidade de sinal trocado: mesmo resultado.
check({ gamma: -20 * s, alpha: -20 * s }, { x: 0, y: -9.8 * s, z: -9.8 * s }, 0, 20, 0, 'gravidade invertida');
// Sem alpha (alguns Androids) não quebra.
check({ beta: 3, gamma: -4, alpha: null }, { x: 0, y: 9.8, z: 0 }, 0, 4, 3, 'sem alpha');

// Zona morta suave: tremor some, movimento lento continua contínuo (sem salto).
near(deadzone(1), 0, 'deadzone tremor');
near(deadzone(-1.5), 0, 'deadzone borda');
near(deadzone(2), 0.5, 'deadzone +');
near(deadzone(-2), -0.5, 'deadzone -');

console.log('giroscópio: ok');
