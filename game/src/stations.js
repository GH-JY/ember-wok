// Where every station is, in field coordinates: the eight shelf cubbies, the cutting board, the
// wok and its burner, the heat gauge, the pass plate, the serve button and the two garnish jars.
// The renderer draws inside these rectangles and the input layer hit-tests against the very same
// numbers, so a tap lands where the picture says it will.

import { LAYOUT } from './config.js';

export const BIN_COUNT = 8;
const BIN_COL_X = [22, 160];
const BIN_ROW_Y = [148, 222, 296, 370];
const BIN_W = 128;
const BIN_H = 70;

export function binRect(index) {
  const column = index % 2;
  const row = Math.floor(index / 2);
  return { x: BIN_COL_X[column], y: BIN_ROW_Y[row], w: BIN_W, h: BIN_H };
}

export const CHOP = { x: 316, y: 250, w: 124, h: 158, board: { x: 324, y: 296, w: 104, h: 100 }, cx: 376, cy: 346 };

export const WOK = { x: 448, y: 244, w: 282, h: 164, cx: 588, cy: 330, rx: 138, ry: 52 };

export const BURNER = { x: 520, y: 372, w: 136, h: 36 };

export const GAUGE = { x: 726, y: 206, w: 30, h: 170 };

export const PLATE = { cx: 892, cy: 318, r: 82 };

export const SERVE = { x: 808, y: 386, w: 168, h: 28 };

export const JARS = [
  { id: 'scallion', x: 812, y: 198, w: 44, h: 56 },
  { id: 'sesame', x: 928, y: 198, w: 44, h: 56 },
];

export const SHIFT_PANEL = { x: LAYOUT.shift.x, y: LAYOUT.shift.y, w: LAYOUT.shift.w, h: LAYOUT.shift.h };

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function ellipseHit(cx, cy, rx, ry, x, y) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

/**
 * What sits under a field point: {kind} for the controls and {kind:'bin', index} for the shelf.
 * The serve button wins over the plate beneath it, and the jars win over the pass.
 */
export function hitTest(x, y) {
  if (inside(SERVE, x, y)) return { kind: 'serve' };
  for (const jar of JARS) if (inside(jar, x, y)) return { kind: 'garnish', id: jar.id };
  if (ellipseHit(PLATE.cx, PLATE.cy, PLATE.r + 14, PLATE.r * 0.5 + 16, x, y)) return { kind: 'plate' };
  if (ellipseHit(WOK.cx, WOK.cy, WOK.rx + 16, WOK.ry + 60, x, y) || inside(BURNER, x, y)) return { kind: 'wok' };
  if (inside(CHOP, x, y)) return { kind: 'chop' };
  for (let index = 0; index < BIN_COUNT; index += 1) if (inside(binRect(index), x, y)) return { kind: 'bin', index };
  if (inside(SHIFT_PANEL, x, y)) return { kind: 'shift' };
  return null;
}
