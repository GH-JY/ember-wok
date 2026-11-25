// The flame under the wok. Holding the wok (pointer down, or Space) stirs: heat climbs fast.
// Letting go lets it fall. The dish cooks only while the needle sits in the green band, so the
// cook keeps tapping the wok rather than holding it down. Sit in the red too long and the batch
// burns: the pan must be emptied (one tap) and the dish starts over. Eating the clock is the
// whole penalty, and losing a good run to smoke is the whole risk.

import { WORK } from './config.js';

export const WOK_EVENT_READY = 1;
export const WOK_EVENT_BURNT = 2;

export function createWokState() {
  return {
    heat: WORK.heatStart,
    progress: 0,
    ready: false,
    burnt: false,
    hotFor: 0,
    stirring: false,
    wobble: 0,
    plateFlash: 0,
  };
}

/** Empty the pan for the next ticket, keeping whatever heat the burner still holds. */
export function resetWok(state) {
  state.progress = 0;
  state.ready = false;
  state.burnt = false;
  state.hotFor = 0;
  state.plateFlash = 0;
}

/** True while the needle is in the band where the dish actually cooks. */
export function inHeatBand(state) {
  return state.heat >= WORK.heatBand[0] && state.heat <= WORK.heatBand[1];
}

/**
 * One step of the burner. `recipe` is the dish currently in the pan (null when the pan is empty),
 * `stirring` whether the cook is holding the wok this step. Returns WOK_EVENT_* flags.
 */
export function tickWok(state, dt, recipe, stirring) {
  let events = 0;
  state.stirring = stirring;
  const gain = stirring ? WORK.heatStir : -WORK.heatCool;
  state.heat = Math.max(0, Math.min(1, state.heat + gain * dt));
  state.wobble += dt * (stirring ? 7 : 1.6);
  if (state.plateFlash > 0) state.plateFlash = Math.max(0, state.plateFlash - dt);

  if (state.ready || state.burnt || recipe === null) {
    state.hotFor = Math.max(0, state.hotFor - dt * 0.5);
    return events;
  }

  if (inHeatBand(state)) {
    state.progress = Math.min(1, state.progress + dt / recipe.cookSeconds);
    if (state.progress >= 1) {
      state.ready = true;
      events |= WOK_EVENT_READY;
    }
  }

  if (state.heat >= WORK.burnAt) state.hotFor += dt;
  else state.hotFor = Math.max(0, state.hotFor - dt * 0.5);
  if (state.hotFor >= WORK.burnGrace) {
    state.burnt = true;
    state.progress = 0.12;
    events |= WOK_EVENT_BURNT;
  }
  return events;
}

/** Tap a burnt pan to scrape it out; returns false when there was nothing to scrape. */
export function scrapeWok(state) {
  if (!state.burnt) return false;
  state.burnt = false;
  state.hotFor = 0;
  state.progress = 0;
  state.heat = Math.min(state.heat, 0.55);
  return true;
}

/** Lift a finished dish out of the pan onto the plate; returns false when it is not ready. */
export function liftDish(state) {
  if (!state.ready) return false;
  state.ready = false;
  state.progress = 0;
  state.hotFor = 0;
  state.plateFlash = 0.25;
  return true;
}
