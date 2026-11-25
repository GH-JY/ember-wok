// The rules engine. One game object holds the board, the tray, the knife, the wok, the pass, the
// wallet, the clock and the particle weather; every input funnels into a handful of actions here
// (pick, chop, stir, plate, garnish, serve) and one fixed tick advance. Nothing in this file draws:
// it decides what happened, queues a cue for the audio layer, sets the toast line and leaves the
// screen to say the rest. A shift is three minutes, rush hour starts at one minute, and the pass
// holds exactly one plate, so serving stays the bottleneck even when the wok runs ahead.

import { SHIFT } from './config.js';
import { createRandom } from './random.js';
import { RECIPES } from './recipes.js';
import { ingredientById, trayComplete } from './ingredients.js';
import {
  createOrderBook,
  tickBook,
  activeTicket,
  ticketById,
  promoteNext,
  markServed,
  markPlated,
  mostUrgent,
  isOpen,
  TICKET_PLATED,
} from './orders.js';
import { createChopState, armChop, chopHit, tickChop } from './chopping.js';
import { createWokState, tickWok, resetWok, scrapeWok, liftDish, WOK_EVENT_READY, WOK_EVENT_BURNT } from './wok.js';
import { createPlateState, loadPlate, garnishPlate, takeFromPass, tickPlate } from './plating.js';
import { createScoreState, tickScore, quotePayout, applyServe, applyExpiry } from './scoring.js';
import {
  createParticles,
  tickParticles,
  emitSteam,
  emitEmbers,
  emitCrumbs,
  emitCoins,
  emitSmoke,
} from './particles.js';
import { GARNISHES } from './ingredients.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_PAUSED = 'paused';
export const PHASE_OVER = 'over';

export const STEP_PICK = 1;
export const STEP_CHOP = 2;
export const STEP_COOK = 3;
export const STEP_PLATE = 4;
export const STEP_SERVE = 5;
export const STEP_LABELS = ['PICK', 'CHOP', 'STIR', 'PLATE', 'SERVE'];

/** Where the wok, the knife and the pass sit, so particle spawns land on the drawings. */
const SPOTS = {
  wok: { x: 588, y: 300 },
  burner: { x: 588, y: 386 },
  chop: { x: 378, y: 330 },
  pass: { x: 892, y: 300 },
};

function freshState(random) {
  return {
    phase: PHASE_TITLE,
    time: 0,
    book: createOrderBook(random),
    tray: [],
    chop: createChopState(),
    wok: createWokState(),
    plate: createPlateState(),
    score: createScoreState(),
    particles: createParticles(),
    stirring: false,
    rush: false,
    toast: { text: '', kind: 'info', ttl: 0 },
    cues: [],
    flash: 0,
    servedFlash: 0,
  };
}

export function createGame(seed) {
  const random = createRandom(seed);
  return { seed, random, state: freshState(random) };
}

function say(game, text, kind) {
  game.state.toast = { text, kind: kind ?? 'info', ttl: 2.4 };
}

/** A fresh shift: empty board, clean counter, the clock at three minutes. */
export function startShift(game) {
  const state = game.state;
  state.phase = PHASE_PLAY;
  state.time = 0;
  state.book = createOrderBook(game.random);
  state.tray = [];
  state.chop = createChopState();
  state.wok = createWokState();
  state.plate = createPlateState();
  state.score = createScoreState();
  state.particles = createParticles();
  state.stirring = false;
  state.rush = false;
  state.flash = 0;
  state.servedFlash = 0;
  state.cues.push('start');
  say(game, 'SHIFT START - READ THE ORDER BOARD', 'info');
}

export function togglePause(game) {
  const state = game.state;
  if (state.phase === PHASE_PLAY) {
    state.phase = PHASE_PAUSED;
    state.stirring = false;
  } else if (state.phase === PHASE_PAUSED) {
    state.phase = PHASE_PLAY;
  }
}

export function activeTicketOf(game) {
  return activeTicket(game.state.book);
}

export function platedTicketOf(game) {
  const state = game.state;
  if (state.plate.ticketId === null) return null;
  return ticketById(state.book, state.plate.ticketId);
}

export function urgentTicketOf(game) {
  return mostUrgent(game.state.book);
}

export function shiftLeft(game) {
  return Math.max(0, SHIFT.seconds - game.state.time);
}

/** Which of the five beats the active ticket is waiting for right now. */
export function currentStep(game) {
  const state = game.state;
  const ticket = activeTicket(state.book);
  if (ticket !== null) {
    if (!trayComplete(ticket.recipe, state.tray)) return STEP_PICK;
    if (state.chop.needed && !state.chop.done) return STEP_CHOP;
    if (state.plate.dish !== null) return STEP_SERVE;
    if (!state.wok.ready) return STEP_COOK;
    return STEP_PLATE;
  }
  if (state.plate.dish !== null) return STEP_SERVE;
  return STEP_PICK;
}

/** The ticket at the wok starts from a clean tray, a freshly armed knife and an empty pan. */
function beginTicket(game, ticket) {
  const state = game.state;
  state.tray.length = 0;
  armChop(state.chop, ticket.recipe);
  resetWok(state.wok);
}

/** Whenever the wok falls idle and a ticket is waiting, the oldest one steps up; with no ticket at
 * all, the counter goes back to clean instead of keeping the last dish's tray and knife on it. */
function ensureActive(game) {
  const state = game.state;
  if (activeTicket(state.book) !== null) return null;
  const next = promoteNext(state.book);
  if (next !== null) {
    beginTicket(game, next);
    return next;
  }
  state.tray.length = 0;
  if (state.chop.needed || state.chop.done) state.chop = createChopState();
  return next;
}

export function pickIngredient(game, id) {
  const state = game.state;
  if (state.phase !== PHASE_PLAY) return;
  const ticket = activeTicket(state.book);
  const ingredient = ingredientById(id);
  if (ingredient === null) return;
  if (ticket === null) {
    say(game, 'NO TICKET AT THE WOK YET', 'info');
    return;
  }
  const recipe = ticket.recipe;
  if (!recipe.ingredients.includes(id)) {
    state.cues.push('every');
    say(game, ingredient.name + ' IS NOT ON THIS TICKET', 'bad');
    return;
  }
  if (state.tray.includes(id)) {
    say(game, ingredient.name + ' IS ALREADY ON THE TRAY', 'info');
    return;
  }
  state.tray.push(id);
  state.cues.push('pick');
  state.flash = 0.1;
  if (trayComplete(recipe, state.tray)) {
    state.cues.push('ready');
    if (state.chop.needed) say(game, 'TRAY READY - CHOP THE ' + state.chop.ingredient.toUpperCase(), 'good');
    else say(game, 'TRAY READY - STIR THE WOK', 'good');
  }
}

export function chopTap(game) {
  const state = game.state;
  if (state.phase !== PHASE_PLAY) return;
  const ticket = activeTicket(state.book);
  if (ticket === null) return;
  if (!state.chop.needed) {
    say(game, 'NOTHING TO CHOP FOR THIS TICKET', 'info');
    return;
  }
  if (state.chop.done) {
    say(game, 'ALREADY CHOPPED - GET IT IN THE WOK', 'info');
    return;
  }
  const finished = chopHit(state.chop, game.random);
  state.cues.push('chop');
  const color = ingredientById(state.chop.ingredient)?.color ?? '#57c785';
  emitCrumbs(state.particles, game.random, SPOTS.chop.x, SPOTS.chop.y, color);
  state.flash = 0.12;
  if (finished) {
    state.cues.push('ready');
    say(game, 'CHOPPED - NOW STIR THE WOK', 'good');
  }
}

export function plateTap(game) {
  const state = game.state;
  if (state.phase !== PHASE_PLAY) return;
  if (state.wok.burnt) {
    scrapeWok(state.wok);
    state.cues.push('burnt');
    emitSmoke(state.particles, game.random, SPOTS.wok.x, SPOTS.wok.y);
    say(game, 'PAN SCRAPED - THE DISH STARTS OVER', 'bad');
    return;
  }
  if (state.wok.ready) {
    if (state.plate.dish !== null) {
      say(game, 'THE PASS IS FULL - SERVE THAT PLATE FIRST', 'bad');
      return;
    }
    const ticket = activeTicket(state.book);
    if (ticket === null) {
      say(game, 'NO TICKET FOR THIS DISH', 'bad');
      return;
    }
    liftDish(state.wok);
    loadPlate(state.plate, ticket.recipe, ticket.id);
    markPlated(ticket);
    state.cues.push('plate');
    state.servedFlash = 0.2;
    say(game, 'PLATED - GARNISH IF YOU LIKE, THEN SERVE', 'good');
    ensureActive(game);
    return;
  }
  if (state.plate.dish !== null) {
    say(game, 'SERVE THE PLATE ON THE PASS FIRST', 'info');
    return;
  }
  state.cues.push('every');
  say(game, 'NOT READY - KEEP THE NEEDLE IN THE GREEN', 'info');
}

export function garnishTap(game, garnishId) {
  const state = game.state;
  if (state.phase !== PHASE_PLAY) return;
  const garnish = GARNISHES.find((entry) => entry.id === garnishId);
  if (!garnish) return;
  if (garnishPlate(state.plate, garnishId)) {
    state.cues.push('plate');
    say(game, garnish.name + ' ON THE PLATE - +$3 TIP', 'good');
  } else {
    state.cues.push('every');
    say(game, 'PLATE A DISH BEFORE GARNISHING', 'info');
  }
}

export function serveTap(game) {
  const state = game.state;
  if (state.phase !== PHASE_PLAY) return;
  if (state.plate.dish === null) {
    state.cues.push('every');
    say(game, 'NOTHING ON THE PASS TO SERVE', 'info');
    return;
  }
  const ticket = ticketById(state.book, state.plate.ticketId);
  const entry = takeFromPass(state.plate);
  if (!ticket || !isOpen(ticket) || ticket.state !== TICKET_PLATED) {
    state.cues.push('fail');
    say(game, 'THAT CUSTOMER ALREADY LEFT', 'bad');
    return;
  }
  const payout = quotePayout(state.score, ticket, entry, state.rush);
  applyServe(state.score, payout, entry);
  markServed(ticket);
  emitCoins(state.particles, game.random, SPOTS.pass.x, SPOTS.pass.y, payout.total);
  state.cues.push('serve');
  state.servedFlash = 0.35;
  const comboLine = state.score.combo > 1 ? '  COMBO x' + state.score.combo : '';
  say(game, 'SERVED +$' + payout.total + comboLine, 'gold');
  ensureActive(game);
}

export function setStirring(game, stirring) {
  const state = game.state;
  if (state.phase !== PHASE_PLAY) {
    state.stirring = false;
    return;
  }
  if (stirring && !state.stirring) state.cues.push('stir');
  state.stirring = Boolean(stirring);
}

export function takeCues(game) {
  const cues = game.state.cues;
  game.state.cues = [];
  return cues;
}

/** One fixed step of the whole stall. */
export function tick(game, dt) {
  const state = game.state;
  if (state.phase !== PHASE_PLAY) {
    tickParticles(state.particles, dt * 0.4);
    if (state.toast.ttl > 0) state.toast.ttl = Math.max(0, state.toast.ttl - dt);
    return;
  }

  state.time += dt;
  state.rush = state.time >= SHIFT.rushAt;
  tickScore(state.score, dt);
  tickPlate(state.plate, dt);
  tickChop(state.chop, dt);

  const bookEvents = tickBook(state.book, dt, state.rush, RECIPES);
  for (const ticket of bookEvents.expired) {
    applyExpiry(state.score);
    state.cues.push('fail');
    say(game, 'ORDER #' + ticket.id + ' EXPIRED', 'bad');
    if (state.plate.ticketId === ticket.id) takeFromPass(state.plate);
    if (activeTicket(state.book) === null) {
      state.tray.length = 0;
      armChop(state.chop, { chop: null });
      resetWok(state.wok);
    }
  }
  if (bookEvents.spawned.length > 0) state.cues.push('every');
  ensureActive(game);

  const ticket = activeTicket(state.book);
  const recipe = ticket !== null ? ticket.recipe : null;
  const canCook = ticket !== null && trayComplete(recipe, state.tray) && (!state.chop.needed || state.chop.done);
  const wokEvents = tickWok(state.wok, dt, canCook ? recipe : null, state.stirring);
  if (wokEvents & WOK_EVENT_READY) {
    state.cues.push('ready');
    say(game, 'DISH READY - TAP THE WOK TO PLATE IT', 'good');
  }
  if (wokEvents & WOK_EVENT_BURNT) {
    state.cues.push('burnt');
    emitSmoke(state.particles, game.random, SPOTS.wok.x, SPOTS.wok.y);
    say(game, 'BURNT! TAP THE WOK TO SCRAPE IT OUT', 'bad');
  }

  const steamStrength = canCook ? 0.5 + state.wok.progress * 0.5 : 0.08 + state.wok.heat * 0.12;
  emitSteam(state.particles, game.random, SPOTS.wok.x, SPOTS.wok.y, 70, steamStrength);
  emitEmbers(state.particles, game.random, SPOTS.burner.x, SPOTS.burner.y, state.wok.heat);
  if (state.plate.dish !== null) emitSteam(state.particles, game.random, SPOTS.pass.x, SPOTS.pass.y - 10, 46, 0.4);

  tickParticles(state.particles, dt);
  if (state.toast.ttl > 0) state.toast.ttl = Math.max(0, state.toast.ttl - dt);
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
  if (state.servedFlash > 0) state.servedFlash = Math.max(0, state.servedFlash - dt);

  if (state.time >= SHIFT.seconds) {
    state.phase = PHASE_OVER;
    state.stirring = false;
    state.cues.push('over');
  }
}
