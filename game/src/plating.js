// The pass: the plate waiting under the warmer lamp. A finished dish lands on it when the cook
// lifts the wok, one garnish jar may be tapped before it goes out (scallion or sesame, worth a
// small bonus on the tip), and serving carries the plate to the customer. The plate is only ever
// one dish, and serving clears it.

import { GARNISHES } from './ingredients.js';

export function createPlateState() {
  return {
    dish: null,
    ticketId: null,
    garnished: false,
    garnishId: null,
    age: 0,
    serveFlash: 0,
  };
}

/** Put a freshly cooked dish on the plate. */
export function loadPlate(plate, recipe, ticketId) {
  plate.dish = recipe;
  plate.ticketId = ticketId ?? null;
  plate.garnished = false;
  plate.garnishId = null;
  plate.age = 0;
}

/** Tap a garnish jar, then the plate. Returns false when the plate is empty or already dressed. */
export function garnishPlate(plate, garnishId) {
  if (plate.dish === null || plate.garnished) return false;
  if (!GARNISHES.some((entry) => entry.id === garnishId)) return false;
  plate.garnished = true;
  plate.garnishId = garnishId;
  return true;
}

/** Hand the plate over: the recipe leaves the pass. Returns what was on it, or null. */
export function takeFromPass(plate) {
  if (plate.dish === null) return null;
  const trimmed = { recipe: plate.dish, ticketId: plate.ticketId, garnished: plate.garnished, garnishId: plate.garnishId };
  plate.dish = null;
  plate.ticketId = null;
  plate.garnished = false;
  plate.garnishId = null;
  plate.age = 0;
  plate.serveFlash = 0.3;
  return trimmed;
}

export function plateReady(plate) {
  return plate.dish !== null;
}

/** The plate cools a little while it waits, which is the only thing its age affects. */
export function tickPlate(plate, dt) {
  if (plate.dish !== null) plate.age += dt;
  if (plate.serveFlash > 0) plate.serveFlash = Math.max(0, plate.serveFlash - dt);
}
