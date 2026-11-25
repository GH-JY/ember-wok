// The stall's small weather: steam off the wok and the plate, embers off the burner, crumbs off
// the knife, smoke off a burnt pan and coins off a paid ticket. One fixed pool, allocated at boot,
// so a busy rush never allocates mid-frame. Spawning draws from the game's seeded stream; the
// update itself is pure arithmetic, so the same seed and the same steps always give the same
// picture.

const POOL = 256;

export const PARTICLE_STEAM = 0;
export const PARTICLE_EMBER = 1;
export const PARTICLE_CRUMB = 2;
export const PARTICLE_COIN = 3;
export const PARTICLE_SMOKE = 4;
export const PARTICLE_PAY = 5;

export function createParticles() {
  const items = new Array(POOL);
  for (let index = 0; index < POOL; index += 1) {
    items[index] = { active: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 1, color: '#fff', text: '' };
  }
  return { items, cursor: 0 };
}

function take(particles) {
  const items = particles.items;
  for (let step = 0; step < POOL; step += 1) {
    const index = (particles.cursor + step) % POOL;
    if (!items[index].active) {
      particles.cursor = (index + 1) % POOL;
      return items[index];
    }
  }
  const fallback = items[particles.cursor];
  particles.cursor = (particles.cursor + 1) % POOL;
  return fallback;
}

function spawn(particles, kind, x, y, vx, vy, life, size, color, text) {
  const item = take(particles);
  item.active = true;
  item.kind = kind;
  item.x = x;
  item.y = y;
  item.vx = vx;
  item.vy = vy;
  item.life = life;
  item.maxLife = life;
  item.size = size;
  item.color = color;
  item.text = text;
  return item;
}

/** A lazy column of steam: `spread` widens it, `strength` (0..1) sets how often and how big. */
export function emitSteam(particles, random, x, y, spread, strength) {
  if (random() > 0.18 + strength * 0.72) return;
  spawn(
    particles,
    PARTICLE_STEAM,
    x + (random() - 0.5) * spread,
    y,
    (random() - 0.5) * 14,
    -18 - random() * 26 * strength,
    1.5 + random() * 1.2,
    6 + random() * 12 * (0.5 + strength),
    '255,244,225',
    '',
  );
}

/** Sparks off the burner, thrown up and out, fading fast. */
export function emitEmbers(particles, random, x, y, strength) {
  if (random() > 0.25 + strength * 0.6) return;
  spawn(
    particles,
    PARTICLE_EMBER,
    x + (random() - 0.5) * 90,
    y,
    (random() - 0.5) * 60,
    -40 - random() * 90 * strength,
    0.35 + random() * 0.5,
    1.5 + random() * 2,
    random() > 0.4 ? '255,158,31' : '255,107,53',
    '',
  );
}

/** Bits of chopped greens flying off the cutting board. */
export function emitCrumbs(particles, random, x, y, color) {
  for (let burst = 0; burst < 5; burst += 1) {
    spawn(particles, PARTICLE_CRUMB, x + (random() - 0.5) * 26, y, (random() - 0.5) * 150, -60 - random() * 120, 0.4 + random() * 0.4, 2 + random() * 2.5, color, '');
  }
}

/** A soft puff of dark smoke over a pan that went too far. */
export function emitSmoke(particles, random, x, y) {
  for (let burst = 0; burst < 10; burst += 1) {
    spawn(particles, PARTICLE_SMOKE, x + (random() - 0.5) * 100, y - random() * 20, (random() - 0.5) * 20, -30 - random() * 40, 1.2 + random() * 1.1, 16 + random() * 18, '70,64,58', '');
  }
}

/** Coins and the money line popping off the pass when a ticket pays. */
export function emitCoins(particles, random, x, y, amount) {
  for (let coin = 0; coin < 7; coin += 1) {
    spawn(particles, PARTICLE_COIN, x + (random() - 0.5) * 40, y, (random() - 0.5) * 130, -110 - random() * 150, 0.7 + random() * 0.5, 4 + random() * 3, '255,209,102', '');
  }
  spawn(particles, PARTICLE_PAY, x, y - 18, 0, -46, 1.5, 20, '255,209,102', '+$' + amount);
}

/** Advance everything; dead particles go back to the pool. */
export function tickParticles(particles, dt) {
  const items = particles.items;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item.active) continue;
    item.life -= dt;
    if (item.life <= 0) {
      item.active = false;
      continue;
    }
    item.x += item.vx * dt;
    item.y += item.vy * dt;
    if (item.kind === PARTICLE_EMBER || item.kind === PARTICLE_CRUMB) item.vy += 300 * dt;
    else if (item.kind === PARTICLE_STEAM || item.kind === PARTICLE_SMOKE) item.vy -= 6 * dt;
    else if (item.kind === PARTICLE_COIN) item.vy += 260 * dt;
  }
}
