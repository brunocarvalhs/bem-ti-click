// Voo dos pássaros: entram por um lado, passeiam mudando de rumo e vão embora depois de 5 a 8 s.
import { W, H } from '../../config.js';
import { PX } from '../../art/pixel.js';
import { pickSpecies } from '../../art/birds.js';
import { STAGES } from '../../art/stages.js';
import { rand, clamp } from '../../shared/util.js';

let birdSeq = 0;

export function spawnBird(stage) {
  const st = STAGES[stage], sp = pickSpecies(st.birds), left = Math.random() < 0.5, k = st.speedK; // cada lugar é um pouco mais rápido
  const b = {
    id: ++birdSeq, sp, k, x: left ? -90 : W + 90, y: rand(110, H * 0.6), heading: left ? 0 : Math.PI,
    speed: rand(sp.speed[0], sp.speed[1]) * k, targetSpeed: 0, targetHeading: 0, life: rand(5, 8), age: 0,
    leaving: false, gone: false, turnIn: 0, phase: Math.random() * 4, rx: 7 * sp.u * PX, ry: 4.4 * sp.u * PX,
  };
  retarget(b);
  return b;
}

function retarget(b) {
  const tx = rand(160, W - 160), ty = rand(100, H * 0.62);
  b.targetHeading = Math.atan2(ty - b.y, tx - b.x);
  b.targetSpeed = b.sp.hover && Math.random() < 0.35 ? 12 : rand(b.sp.speed[0], b.sp.speed[1]) * b.k; // beija-flor às vezes para no ar
  b.turnIn = rand(0.6, 1.6);
}

export function updateBird(b, dt) {
  b.age += dt;
  if (!b.leaving) {
    if ((b.turnIn -= dt) <= 0) retarget(b);
    if (b.age > b.life) { b.leaving = true; b.targetHeading = b.x < W / 2 ? -Math.PI + 0.45 : -0.45; b.targetSpeed = b.sp.speed[1] * 1.35 * b.k; }
  }
  let diff = b.targetHeading - b.heading;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  b.heading += clamp(diff, -2.6 * dt, 2.6 * dt);
  b.speed += (b.targetSpeed - b.speed) * Math.min(1, dt * 2);
  b.x += Math.cos(b.heading) * b.speed * dt;
  b.y += Math.sin(b.heading) * b.speed * dt;
  if (b.leaving && (b.x < -160 || b.x > W + 160 || b.y < -160)) b.gone = true;
}
