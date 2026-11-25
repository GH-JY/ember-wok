// The stall's illustrated vocabulary: one bold canvas drawing per ingredient, the plates and bowls
// dishes sit on, the dishes themselves, garnish jars and coins. Everything is drawn from a 40-pixel
// box around the centre, so callers pass the real size and the icons stay sharp at every scale.
// The dish drawing reads the recipe's accents, so a ticket's colours and its plate always match.

import { roundRectPath } from './ui.js';

function scaleOf(size) {
  return size / 40;
}

function noodleWaves(ctx, cx, cy, s, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  for (let row = -1; row <= 1; row += 1) {
    ctx.beginPath();
    ctx.moveTo(cx - 14 * s, cy + row * 6 * s);
    ctx.quadraticCurveTo(cx - 7 * s, cy + (row * 6 - 5) * s, cx, cy + row * 6 * s);
    ctx.quadraticCurveTo(cx + 7 * s, cy + (row * 6 + 5) * s, cx + 14 * s, cy + row * 6 * s);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

export function drawIngredientIcon(ctx, id, cx, cy, size) {
  const s = scaleOf(size);
  ctx.save();
  switch (id) {
    case 'noodles': {
      noodleWaves(ctx, cx, cy, s, '#e8b34f', 3.4 * s);
      ctx.fillStyle = '#c98a2e';
      roundRectPath(ctx, cx - 4 * s, cy - 2 * s, 8 * s, 14 * s, 2 * s);
      ctx.fill();
      break;
    }
    case 'rice': {
      ctx.fillStyle = '#e9dcc0';
      ctx.beginPath();
      ctx.moveTo(cx - 15 * s, cy - 2 * s);
      ctx.quadraticCurveTo(cx, cy + 22 * s, cx + 15 * s, cy - 2 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c9b894';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 3 * s, 15 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f7efdc';
      for (const [dx, dy] of [[-8, 2], [-3, 6], [3, 7], [8, 3], [0, 10], [-5, 4], [6, 5]]) {
        ctx.beginPath();
        ctx.ellipse(cx + dx * s, cy + dy * s, 2.4 * s, 1.7 * s, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'beef': {
      ctx.fillStyle = '#a84632';
      roundRectPath(ctx, cx - 14 * s, cy - 9 * s, 28 * s, 18 * s, 5 * s);
      ctx.fill();
      ctx.strokeStyle = '#d98a6a';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(cx - 11 * s, cy - 3 * s);
      ctx.quadraticCurveTo(cx - 3 * s, cy - 7 * s, cx + 4 * s, cy - 4 * s);
      ctx.moveTo(cx - 4 * s, cy + 5 * s);
      ctx.quadraticCurveTo(cx + 4 * s, cy + 2 * s, cx + 11 * s, cy + 5 * s);
      ctx.stroke();
      break;
    }
    case 'greens': {
      ctx.fillStyle = '#e8ecdc';
      ctx.beginPath();
      ctx.moveTo(cx - 2.5 * s, cy + 14 * s);
      ctx.lineTo(cx + 2.5 * s, cy + 14 * s);
      ctx.lineTo(cx + 1.5 * s, cy - 2 * s);
      ctx.lineTo(cx - 1.5 * s, cy - 2 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#57c785';
      for (const turn of [-0.9, 0, 0.9]) {
        ctx.save();
        ctx.translate(cx, cy - 4 * s);
        ctx.rotate(turn);
        ctx.beginPath();
        ctx.ellipse(0, -8 * s, 5 * s, 11 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#8fe3ae';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 12 * s, 3 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chili': {
      ctx.strokeStyle = '#e6402e';
      ctx.lineWidth = 7 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 10 * s, cy + 10 * s);
      ctx.quadraticCurveTo(cx + 2 * s, cy + 6 * s, cx + 9 * s, cy - 8 * s);
      ctx.stroke();
      ctx.strokeStyle = '#3f8f4f';
      ctx.lineWidth = 2.6 * s;
      ctx.beginPath();
      ctx.moveTo(cx + 9 * s, cy - 8 * s);
      ctx.lineTo(cx + 12 * s, cy - 13 * s);
      ctx.stroke();
      ctx.strokeStyle = '#ff8a72';
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.moveTo(cx - 6 * s, cy + 7 * s);
      ctx.quadraticCurveTo(cx + 1 * s, cy + 4 * s, cx + 6 * s, cy - 5 * s);
      ctx.stroke();
      ctx.lineCap = 'butt';
      break;
    }
    case 'garlic': {
      ctx.fillStyle = '#efe6d2';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2 * s, 11 * s, 13 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cfc2a4';
      ctx.lineWidth = 1.6 * s;
      for (const dx of [-5, 0, 5]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx * s, cy - 9 * s);
        ctx.quadraticCurveTo(cx + dx * 1.4 * s, cy + 2 * s, cx + dx * 0.6 * s, cy + 13 * s);
        ctx.stroke();
      }
      ctx.strokeStyle = '#6fce8f';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 12 * s);
      ctx.quadraticCurveTo(cx + 2 * s, cy - 18 * s, cx + 6 * s, cy - 18 * s);
      ctx.stroke();
      break;
    }
    case 'egg': {
      ctx.fillStyle = '#f7efdc';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 11 * s, 14 * s, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.arc(cx + 2 * s, cy + 1 * s, 5.2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe0a3';
      ctx.beginPath();
      ctx.arc(cx + 0.5 * s, cy - 1 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'shrimp': {
      ctx.strokeStyle = '#ff8a5c';
      ctx.lineWidth = 8 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, 9 * s, Math.PI * 0.15, Math.PI * 1.1);
      ctx.stroke();
      ctx.strokeStyle = '#ffb28f';
      ctx.lineWidth = 1.8 * s;
      for (const angle of [0.5, 1.2, 1.9, 2.6]) {
        ctx.beginPath();
        ctx.arc(cx, cy, 9 * s, angle, angle + 0.25);
        ctx.stroke();
      }
      ctx.fillStyle = '#ff8a5c';
      ctx.beginPath();
      ctx.moveTo(cx + 9 * s, cy);
      ctx.lineTo(cx + 15 * s, cy - 4 * s);
      ctx.lineTo(cx + 15 * s, cy + 5 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2a1d15';
      ctx.beginPath();
      ctx.arc(cx - 4 * s, cy - 8 * s, 1.2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineCap = 'butt';
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

/** The plate the pass sends dishes out on: a cream rim, a shadowed well, one highlight. */
export function drawPlate(ctx, cx, cy, radius) {
  const ry = radius * 0.36;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + ry * 0.5, radius * 1.02, ry * 1.02, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2e6cb';
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8c49d';
  ctx.lineWidth = radius * 0.045;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 0.86, ry * 0.86, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#e9d9b6';
  ctx.beginPath();
  ctx.ellipse(cx, cy + ry * 0.12, radius * 0.78, ry * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = radius * 0.03;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 0.96, ry * 0.96, 0, Math.PI * 1.05, Math.PI * 1.55);
  ctx.stroke();
  ctx.restore();
}

function dishJitter(recipe) {
  let hash = 0;
  for (let index = 0; index < recipe.id.length; index += 1) hash = (hash * 31 + recipe.id.charCodeAt(index)) % 997;
  return (offset) => ((hash + offset * 37) % 100) / 100;
}

/** The finished dish sitting in a plate's well. `radius` is the plate radius. */
export function drawDishOn(ctx, recipe, cx, cy, radius, garnishId) {
  const jitter = dishJitter(recipe);
  const rx = radius * 0.62;
  const ry = radius * 0.28;
  ctx.save();
  if (recipe.base === 'noodles') {
    ctx.strokeStyle = '#d9a34a';
    ctx.lineWidth = radius * 0.075;
    ctx.lineCap = 'round';
    for (let strand = 0; strand < 6; strand += 1) {
      const offset = (strand - 2.5) * ry * 0.28;
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.8, cy + offset);
      ctx.quadraticCurveTo(cx, cy + offset - ry * 0.5, cx + rx * 0.8, cy + offset);
      ctx.stroke();
    }
    ctx.strokeStyle = '#f2c063';
    ctx.lineWidth = radius * 0.035;
    for (let strand = 0; strand < 4; strand += 1) {
      const offset = (strand - 1.5) * ry * 0.34;
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.7, cy + offset);
      ctx.quadraticCurveTo(cx, cy + offset + ry * 0.4, cx + rx * 0.7, cy + offset);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  } else {
    ctx.fillStyle = '#efe3c6';
    ctx.beginPath();
    ctx.ellipse(cx, cy - ry * 0.15, rx * 0.85, ry * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7efdc';
    for (let grain = 0; grain < 26; grain += 1) {
      const gx = cx + (jitter(grain) - 0.5) * rx * 1.5;
      const gy = cy - ry * 0.2 + (jitter(grain + 40) - 0.5) * ry * 1.4 - (1 - Math.abs(gx - cx) / (rx * 0.9)) * ry * 0.5;
      ctx.beginPath();
      ctx.ellipse(gx, gy, radius * 0.035, radius * 0.022, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const [first, second, third] = recipe.accents;
  for (let piece = 0; piece < 4; piece += 1) {
    const px = cx + (jitter(piece + 7) - 0.5) * rx * 1.2;
    const py = cy - ry * 0.25 + (jitter(piece + 21) - 0.5) * ry * 0.9;
    ctx.fillStyle = first;
    ctx.beginPath();
    ctx.ellipse(px, py, radius * 0.11, radius * 0.055, jitter(piece) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let piece = 0; piece < 3; piece += 1) {
    const px = cx + (jitter(piece + 55) - 0.5) * rx * 1.35;
    const py = cy - ry * 0.15 + (jitter(piece + 66) - 0.5) * ry * 0.8;
    ctx.fillStyle = second;
    ctx.beginPath();
    ctx.ellipse(px, py, radius * 0.07, radius * 0.045, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = third;
  for (let piece = 0; piece < 4; piece += 1) {
    const px = cx + (jitter(piece + 88) - 0.5) * rx * 1.5;
    const py = cy - ry * 0.1 + (jitter(piece + 99) - 0.5) * ry * 0.75;
    ctx.beginPath();
    ctx.arc(px, py, radius * 0.032, 0, Math.PI * 2);
    ctx.fill();
  }

  if (garnishId === 'scallion') {
    ctx.strokeStyle = '#6fce8f';
    ctx.lineWidth = radius * 0.035;
    ctx.lineCap = 'round';
    for (let dash = 0; dash < 5; dash += 1) {
      const px = cx + (jitter(dash + 130) - 0.5) * rx * 1.1;
      const py = cy - ry * 0.3 + (jitter(dash + 140) - 0.5) * ry * 0.6;
      ctx.beginPath();
      ctx.moveTo(px - radius * 0.03, py);
      ctx.lineTo(px + radius * 0.03, py - radius * 0.02);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  } else if (garnishId === 'sesame') {
    ctx.fillStyle = '#f4e3b2';
    for (let dot = 0; dot < 10; dot += 1) {
      const px = cx + (jitter(dot + 160) - 0.5) * rx * 1.2;
      const py = cy - ry * 0.3 + (jitter(dot + 170) - 0.5) * ry * 0.7;
      ctx.beginPath();
      ctx.ellipse(px, py, radius * 0.022, radius * 0.014, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A small bowl of the dish, for customer bubbles and the pass's "next up" strip. */
export function drawBowlIcon(ctx, recipe, cx, cy, size) {
  const s = size / 40;
  ctx.save();
  ctx.fillStyle = '#d9c7a4';
  ctx.beginPath();
  ctx.moveTo(cx - 16 * s, cy - 3 * s);
  ctx.quadraticCurveTo(cx, cy + 18 * s, cx + 16 * s, cy - 3 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2e6cb';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 3 * s, 16 * s, 4.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = recipe.base === 'noodles' ? '#e8b34f' : '#f7efdc';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 5 * s, 11 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = recipe.accents[0];
  for (const dx of [-6, -1.5, 3, 7]) {
    ctx.beginPath();
    ctx.arc(cx + dx * s, cy - 6 * s + (dx % 2) * s, 1.8 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,244,225,0.75)';
  ctx.lineWidth = 1.6 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 3 * s, cy - 11 * s);
  ctx.quadraticCurveTo(cx + 2 * s, cy - 15 * s, cx - 1 * s, cy - 19 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 4 * s, cy - 10 * s);
  ctx.quadraticCurveTo(cx + 8 * s, cy - 14 * s, cx + 5 * s, cy - 18 * s);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.restore();
}

/** A garnish jar on the pass shelf: glass, contents, and a small label. */
export function drawGarnishJar(ctx, garnish, x, y, w, h, active) {
  ctx.save();
  ctx.fillStyle = active ? 'rgba(255,179,71,0.22)' : 'rgba(255,255,255,0.08)';
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = active ? '#ffb347' : 'rgba(200,210,220,0.5)';
  ctx.lineWidth = active ? 2 : 1.2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(190,205,215,0.25)';
  roundRectPath(ctx, x + 4, y + 6, w - 8, h - 16, 4);
  ctx.fill();
  if (garnish.id === 'scallion') {
    ctx.strokeStyle = '#6fce8f';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    for (const offset of [-3, 0, 3]) {
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + offset, y + h - 12);
      ctx.lineTo(x + w / 2 + offset + 1, y + 8);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  } else {
    ctx.fillStyle = '#e8d8a8';
    for (let dot = 0; dot < 8; dot += 1) {
      ctx.beginPath();
      ctx.ellipse(x + w / 2 + ((dot % 4) - 1.5) * 4, y + 12 + Math.floor(dot / 4) * 6, 1.5, 1, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#efe6d2';
  roundRectPath(ctx, x + 2, y + h - 12, w - 4, 9, 2);
  ctx.fill();
  ctx.fillStyle = '#2a1d15';
  ctx.font = '600 6px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(garnish.name, x + w / 2, y + h - 7);
  ctx.restore();
}

/** A gold coin with the stall's mark. */
export function drawCoin(ctx, cx, cy, radius) {
  ctx.save();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9973a';
  ctx.lineWidth = Math.max(1, radius * 0.18);
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#8a5f1e';
  ctx.font = `700 ${Math.round(radius * 1.1)}px "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', cx, cy + radius * 0.06);
  ctx.restore();
}
