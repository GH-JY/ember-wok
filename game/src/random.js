// A seeded random number generator so a seed always deals the same orders and the same sparks,
// which is what lets the screenshot scenes repeat frame for frame. xorshift32: tiny, fast, and
// plenty for ticket shuffles and particle jitter. Each consumer keeps its own stream, so drawing
// never shifts the order sequence and vice versa.

export function createRandom(seed) {
  let state = (seed | 0) === 0 ? 0x9e3779b9 : seed | 0;
  function random() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  }
  return random;
}

/** An integer in [low, high], both ends included. */
export function randomInt(random, low, high) {
  return low + Math.floor(random() * (high - low + 1));
}

/** One element of `list`, picked by the stream. */
export function pick(random, list) {
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}
