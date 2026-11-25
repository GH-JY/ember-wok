// Money and momentum. A served ticket pays its menu price, a speed share that shrinks with every
// second the ticket waited, the garnish bonus when the plate was dressed, and a combo bonus that
// grows with each ticket served inside the combo window. Letting a ticket expire zeroes the combo.
// The shift's goal is checked against earnings alone.

import { SCORE, SHIFT } from './config.js';

export function createScoreState() {
  return {
    earnings: 0,
    served: 0,
    lost: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    garnishCount: 0,
    lastPayout: null,
  };
}

/** The combo window slips away while nothing is served; at zero the run is over. */
export function tickScore(score, dt) {
  if (score.comboTimer > 0) {
    score.comboTimer = Math.max(0, score.comboTimer - dt);
    if (score.comboTimer === 0) score.combo = 0;
  }
}

/** Itemise what this ticket is worth right now, before it is banked. */
export function quotePayout(score, ticket, plateEntry, rush) {
  const recipe = ticket.recipe;
  const patienceShare = ticket.patienceMax > 0 ? ticket.patience / ticket.patienceMax : 0;
  const base = recipe.price;
  const speed = Math.round(base * SCORE.speedShare * patienceShare);
  const garnish = plateEntry.garnished ? SCORE.garnishBonus : 0;
  const comboLevel = Math.min(score.combo, SCORE.comboMax);
  const combo = Math.round(comboLevel * SCORE.comboStep);
  const subtotal = base + speed + garnish + combo;
  const total = Math.round(subtotal * (rush ? SHIFT.rushPay : 1));
  return { base, speed, garnish, combo, total, comboLevel };
}

/** Bank a served ticket and extend the combo. */
export function applyServe(score, payout, plateEntry) {
  score.earnings += payout.total;
  score.served += 1;
  score.combo += 1;
  score.comboTimer = SCORE.comboWindow;
  score.bestCombo = Math.max(score.bestCombo, score.combo);
  if (plateEntry.garnished) score.garnishCount += 1;
  score.lastPayout = payout;
  return payout;
}

/** A lost ticket ends the combo run and is counted against the shift. */
export function applyExpiry(score) {
  score.lost += 1;
  score.combo = 0;
  score.comboTimer = 0;
}

/** One to three stars for the shift report. */
export function shiftStars(score, goal) {
  if (score.earnings >= goal * 1.35) return 3;
  if (score.earnings >= goal) return 2;
  if (score.earnings >= goal * 0.6) return 1;
  return 0;
}
