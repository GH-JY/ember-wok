// The staged scenes behind the screenshots. A shot is a real game state, played by the same rules
// as a shift: tickets are seated on the board, the tray is filled, the knife has cut, and a short
// warm-up of fixed steps runs the wok and the particle weather before the state is trimmed to the
// exact numbers the picture needs. `?shot=<name>&seed=<n>` in the URL picks one, and the page
// freezes on it, so every screenshot is the game's own render of its own rules.

import { ORDER, SHIFT, STEP } from './config.js';
import { RECIPES } from './recipes.js';
import { armChop } from './chopping.js';
import { TICKET_ACTIVE, TICKET_PLATED, TICKET_WAITING } from './orders.js';
import { startShift, tick, PHASE_PLAY, setStirring, chopTap } from './game.js';

let nextId = 11;

function seat(book, slot, recipe, ticketState, patience, maxPatience) {
  const ticket = {
    id: nextId,
    recipe,
    slot,
    state: ticketState,
    patience,
    patienceMax: maxPatience ?? ORDER.patience,
    stamp: null,
    stampAt: 0,
  };
  nextId += 1;
  book.slots[slot] = ticket;
  return ticket;
}

/** Start a clean shift with the board's spawner parked, ready for a composed scene. */
function freshPlay(game) {
  nextId = 11;
  startShift(game);
  const state = game.state;
  state.phase = PHASE_PLAY;
  state.book.spawnTimer = 999;
  state.cues.length = 0;
  state.toast = { text: '', kind: 'info', ttl: 0 };
  return state;
}

function fillTray(state, recipe) {
  state.tray = recipe.ingredients.slice();
}

function dressPass(state, recipe, ticketId, garnishId) {
  state.plate.dish = recipe;
  state.plate.ticketId = ticketId;
  state.plate.garnished = garnishId !== null;
  state.plate.garnishId = garnishId;
  state.plate.age = 1.4;
}

/** A short run of real fixed steps, so steam, embers and crumbs are genuinely in the air. */
function warm(game, seconds, stirring) {
  setStirring(game, stirring);
  const steps = Math.round(seconds / STEP);
  for (let index = 0; index < steps; index += 1) tick(game, STEP);
  setStirring(game, false);
  game.state.cues.length = 0;
}

function setWok(state, wok) {
  state.wok.heat = wok.heat;
  state.wok.progress = wok.progress;
  state.wok.ready = wok.ready;
  state.wok.burnt = wok.burnt;
  state.wok.hotFor = 0;
  state.wok.stirring = false;
  state.wok.plateFlash = 0;
  state.stirring = false;
}

function setClock(state, time) {
  state.time = time;
  state.rush = time >= SHIFT.rushAt;
}

function setScore(state, score) {
  state.score.earnings = score.earnings;
  state.score.served = score.served;
  state.score.lost = score.lost;
  state.score.combo = score.combo;
  state.score.comboTimer = score.comboTimer;
  state.score.bestCombo = score.bestCombo;
  state.score.garnishCount = score.garnishCount;
  state.score.lastPayout = null;
}

function quiet(state, text, kind, ttl) {
  state.toast = { text: text ?? '', kind: kind ?? 'info', ttl: ttl ?? 0 };
  state.cues.length = 0;
}

/** The cover: a dressed plate on the pass, one dish cooking, the next ticket queued. */
function stageCover(game) {
  const state = freshPlay(game);
  const active = seat(state.book, 0, RECIPES[3], TICKET_ACTIVE, 21);
  const plated = seat(state.book, 1, RECIPES[2], TICKET_PLATED, 13);
  const queued = seat(state.book, 2, RECIPES[0], TICKET_WAITING, 28);
  fillTray(state, active.recipe);
  armChop(state.chop, active.recipe);
  state.chop.progress = 1;
  state.chop.done = true;
  state.chop.bounce = 0;
  dressPass(state, plated.recipe, plated.id, 'scallion');
  warm(game, 0.7, true);
  setWok(state, { heat: 0.63, progress: 0.62, ready: false, burnt: false });
  setClock(state, 47);
  setScore(state, { earnings: 58, served: 4, lost: 0, combo: 2, comboTimer: 5.4, bestCombo: 3, garnishCount: 2 });
  active.patience = 21;
  plated.patience = 13;
  queued.patience = 28;
  quiet(state);
  return state;
}

/** The knife beat: the tray is full, two of three chops are in, raw greens still on the board. */
function stageChop(game) {
  const state = freshPlay(game);
  const active = seat(state.book, 0, RECIPES[1], TICKET_ACTIVE, 26);
  const queued = seat(state.book, 1, RECIPES[0], TICKET_WAITING, 22);
  fillTray(state, active.recipe);
  armChop(state.chop, active.recipe);
  chopTap(game);
  chopTap(game);
  warm(game, 0.25, false);
  setWok(state, { heat: 0.36, progress: 0, ready: false, burnt: false });
  setClock(state, 38);
  setScore(state, { earnings: 31, served: 2, lost: 0, combo: 1, comboTimer: 7.2, bestCombo: 2, garnishCount: 1 });
  active.patience = 26;
  queued.patience = 22;
  state.chop.bounce = 0.12;
  quiet(state);
  return state;
}

/** The flame beat: the pan is done and glowing, the gauge sits in the green, nothing plated yet. */
function stagePlating(game) {
  const state = freshPlay(game);
  const active = seat(state.book, 0, RECIPES[3], TICKET_ACTIVE, 24);
  const queuedA = seat(state.book, 1, RECIPES[4], TICKET_WAITING, 23);
  const queuedB = seat(state.book, 2, RECIPES[2], TICKET_WAITING, 29);
  fillTray(state, active.recipe);
  armChop(state.chop, active.recipe);
  state.chop.progress = 1;
  state.chop.done = true;
  warm(game, 0.7, true);
  setWok(state, { heat: 0.68, progress: 1, ready: true, burnt: false });
  setClock(state, 55);
  setScore(state, { earnings: 67, served: 5, lost: 1, combo: 3, comboTimer: 6.2, bestCombo: 3, garnishCount: 2 });
  active.patience = 24;
  queuedA.patience = 23;
  queuedB.patience = 29;
  quiet(state);
  return state;
}

/** The rush beat: short patience, one customer almost out, a garnished plate waiting on the pass. */
function stageRush(game) {
  const state = freshPlay(game);
  const active = seat(state.book, 0, RECIPES[4], TICKET_ACTIVE, 15, ORDER.rushPatience);
  const waiting = seat(state.book, 1, RECIPES[0], TICKET_WAITING, 5, ORDER.rushPatience);
  const plated = seat(state.book, 2, RECIPES[5], TICKET_PLATED, 17, ORDER.rushPatience);
  fillTray(state, active.recipe);
  armChop(state.chop, active.recipe);
  state.chop.progress = 1;
  state.chop.done = true;
  dressPass(state, plated.recipe, plated.id, 'sesame');
  warm(game, 0.7, true);
  setWok(state, { heat: 0.7, progress: 0.4, ready: false, burnt: false });
  setClock(state, 122);
  setScore(state, { earnings: 104, served: 7, lost: 1, combo: 4, comboTimer: 5.8, bestCombo: 5, garnishCount: 3 });
  active.patience = 15;
  waiting.patience = 5;
  plated.patience = 17;
  quiet(state, 'RUSH HOUR - KEEP THE WOK MOVING', 'gold', 2.4);
  return state;
}

const STAGES = {
  cover: stageCover,
  chop: stageChop,
  plating: stagePlating,
  rush: stageRush,
};

export const SHOT_NAMES = Object.keys(STAGES);

/** Compose the named shot on `game` and return it. Unknown names fall back to the cover. */
export function stageShot(name, game) {
  const stage = STAGES[name] ?? STAGES.cover;
  stage(game);
  return game;
}
