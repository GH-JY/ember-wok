// Ember Wok: one place for the stall's size, palette, layout rectangles and every tuning knob.
// The playfield is a fixed 1280x480 logical area (the screenshot aspect), scaled to the window by
// the renderer, so no rule depends on the screen. Stations draw themselves inside the LAYOUT rects
// declared here: the order board along the top, the ingredient shelf on the left, the prep tray and
// wok in the middle, the plating pass and the service window on the right, the step tape along the
// bottom. Tuning lives per system in WORK (chop, wok heat), ORDER (tickets, patience) and SCORE.

export const FIELD = { width: 1280, height: 480 };

/** The simulation's fixed step in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const SHIFT = {
  seconds: 180,
  goal: 120,
  rushAt: 60,
  rushPay: 1.25,
};

export const WORK = {
  heatStart: 0.3,
  heatStir: 0.6,
  heatCool: 0.2,
  heatBand: [0.45, 0.8],
  burnAt: 0.94,
  burnGrace: 0.75,
  stirWindow: 1.3,
  cookSeconds: 4.6,
  chopHits: 3,
};

export const ORDER = {
  slots: 3,
  patience: 34,
  rushPatience: 28,
  spawn: 9.5,
  rushSpawn: 5.5,
  firstAt: 1.2,
  expiredHold: 2.2,
};

export const SCORE = {
  garnishBonus: 3,
  comboStep: 1.5,
  comboMax: 5,
  comboWindow: 8,
  speedShare: 0.6,
};

export const LAYOUT = {
  board: { x: 10, y: 6, w: 1260, h: 92 },
  nameplate: { x: 18, y: 14, w: 170, h: 76 },
  ticketY: 12,
  ticketH: 78,
  ticketX: [196, 456, 716],
  ticketW: 250,
  shift: { x: 1006, y: 14, w: 256, h: 76 },
  shelf: { x: 10, y: 106, w: 292, h: 350 },
  tray: { x: 312, y: 106, w: 316, h: 78 },
  combo: { x: 636, y: 106, w: 120, h: 78 },
  chop: { x: 316, y: 250, w: 124, h: 158 },
  wok: { x: 448, y: 190, w: 282, h: 218 },
  gauge: { x: 726, y: 206, w: 30, h: 170 },
  pass: { x: 772, y: 106, w: 240, h: 350 },
  window: { x: 1022, y: 106, w: 248, h: 350 },
  tape: { x: 10, y: 458, w: 1260, h: 16 },
  counterY: 408,
};

export const PALETTE = {
  backdrop: '#07080c',
  wallTop: '#151a28',
  wallBottom: '#0d1018',
  wood: '#3a2a20',
  woodLight: '#513a2a',
  woodDark: '#241812',
  counter: '#5a4030',
  counterDark: '#39251b',
  paper: '#f2e6cb',
  paperShade: '#e3d2ae',
  ink: '#2a1d15',
  cream: '#f7efdc',
  text: '#f7f1e3',
  muted: '#b3a68e',
  amber: '#ffb347',
  gold: '#ffd166',
  ember: '#ff6b35',
  flame: '#ff9e1f',
  jade: '#57c785',
  jadeDeep: '#2f7d55',
  chili: '#e6402e',
  neon: '#ff5c8a',
  steel: '#a9b6c3',
  steelDark: '#5d6a78',
  shadow: 'rgba(0,0,0,0.35)',
  steam: 'rgba(255,244,225,0.16)',
};

export const FONT = {
  display: '"Segoe UI", "Arial Black", system-ui, sans-serif',
  body: '"Segoe UI", system-ui, sans-serif',
  mono: 'Consolas, "Cascadia Mono", monospace',
};
