// The knife step between the shelf and the wok: some tickets name one ingredient that must be
// chopped first (bok choy, garlic, chili). The board arms itself when the tray is complete, each
// tap of the knife adds a chop, and three chops turn the pile into the cut ingredient the wok
// expects. Taps after the pile is done just wobble the knife.

import { WORK } from './config.js';

export function createChopState() {
  return {
    needed: false,
    ingredient: null,
    progress: 0,
    done: false,
    bounce: 0,
    cuts: [],
  };
}

/** Point the board at the recipe's chop ingredient; a recipe without one clears it. */
export function armChop(state, recipe) {
  state.needed = Boolean(recipe.chop);
  state.ingredient = recipe.chop ?? null;
  state.progress = 0;
  state.done = false;
  state.cuts.length = 0;
}

/** One knife tap. Returns true on the tap that finishes the pile. `random` scatters the bits. */
export function chopHit(state, random) {
  if (!state.needed || state.done) {
    state.bounce = 0.16;
    return false;
  }
  state.progress = Math.min(1, state.progress + 1 / WORK.chopHits);
  state.bounce = 0.16;
  state.cuts.push(random());
  if (state.progress >= 1) {
    state.done = true;
    return true;
  }
  return false;
}

/** Let the knife settle; nothing about the pile changes here. */
export function tickChop(state, dt) {
  if (state.bounce > 0) state.bounce = Math.max(0, state.bounce - dt);
  while (state.cuts.length > 6) state.cuts.shift();
}
