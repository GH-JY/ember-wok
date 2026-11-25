// Small drawing helpers shared by every scene part: rounded rectangles, text with a chosen weight,
// progress bars, rings and soft glows. Nothing here knows about the game; it only turns shapes and
// strings into pixels so the bigger drawing modules stay about layout and state.

import { FONT } from './config.js';

export function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

export function fillRound(ctx, x, y, w, h, r, color) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

export function strokeRound(ctx, x, y, w, h, r, color, width) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function setFont(ctx, size, weight, family) {
  ctx.font = `${weight} ${size}px ${family || FONT.body}`;
}

/** One line of text. `align` is left/center/right, `baseline` defaults to alphabetic. */
export function label(ctx, text, x, y, options = {}) {
  const { size = 16, color = '#fff', align = 'left', baseline = 'alphabetic', weight = 600, family = FONT.body, alpha = 1 } = options;
  ctx.save();
  ctx.globalAlpha = alpha;
  setFont(ctx, size, weight, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** A horizontal bar with a rounded track and a fill fraction 0..1. */
export function bar(ctx, x, y, w, h, fraction, options = {}) {
  const { back = 'rgba(0,0,0,0.35)', fill = '#57c785', radius = h / 2 } = options;
  fillRound(ctx, x, y, w, h, radius, back);
  const width = Math.max(0, Math.min(1, fraction)) * w;
  if (width > 0.5) {
    fillRound(ctx, x, y, width, h, Math.min(radius, width / 2), fill);
  }
}

/** A ring starting at twelve o'clock, clockwise, for clocks and progress dials. */
export function ring(ctx, cx, cy, radius, width, fraction, color, back) {
  if (back) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = back;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  const clamped = Math.max(0, Math.min(1, fraction));
  if (clamped <= 0) return;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + clamped * Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';
}

/** Run `paint` with a soft shadow in `color`, then put the context back. */
export function withGlow(ctx, color, blur, paint) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  paint();
  ctx.restore();
}

/** A four-point sparkle, the stall's little star marker. */
export function sparkle(ctx, cx, cy, radius, color) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.quadraticCurveTo(cx + radius * 0.18, cy - radius * 0.18, cx + radius, cy);
  ctx.quadraticCurveTo(cx + radius * 0.18, cy + radius * 0.18, cx, cy + radius);
  ctx.quadraticCurveTo(cx - radius * 0.18, cy + radius * 0.18, cx - radius, cy);
  ctx.quadraticCurveTo(cx - radius * 0.18, cy - radius * 0.18, cx, cy - radius);
  ctx.fillStyle = color;
  ctx.fill();
}
