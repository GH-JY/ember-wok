// The painter. It reads one game state and draws the whole stall: the order board with its three
// paper tickets, the neon nameplate, the shift clock and wallet, the ingredient shelf, the prep
// tray, the cutting board, the wok on its burner with its heat gauge, the pass with the plate and
// the garnish jars, the service window and whoever is waiting in it, the five-step tape along the
// bottom, the particle weather and the overlays for title, pause and the shift report.
// Nothing here changes the state; every flicker comes from numbers already in it, so the same
// state always paints the same frame.

import { FIELD, LAYOUT, PALETTE, SHIFT, FONT } from './config.js';
import { fillRound as fillRoundAt, strokeRound as strokeRoundAt, roundRectPath, setFont, label as labelAt, bar, ring, sparkle } from './ui.js';
import { drawIngredientIcon, drawPlate, drawDishOn, drawBowlIcon, drawGarnishJar, drawCoin } from './icons.js';
import { binRect, PLATE, SERVE, JARS, WOK, CHOP, GAUGE } from './stations.js';
import { INGREDIENTS, GARNISHES, trayComplete } from './ingredients.js';
import { recipeLines } from './recipes.js';
import { mostUrgent, openTickets, activeTicket, TICKET_ACTIVE, TICKET_PLATED, TICKET_SERVED, TICKET_EXPIRED } from './orders.js';
import { PHASE_TITLE, PHASE_PAUSED, PHASE_OVER, STEP_LABELS } from './game.js';
import { PARTICLE_STEAM, PARTICLE_EMBER, PARTICLE_CRUMB, PARTICLE_COIN, PARTICLE_SMOKE, PARTICLE_PAY } from './particles.js';

const P = PALETTE;

function clockText(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
}

function money(value) {
  return '$' + Math.round(value);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0, ratio: 1 };

  // Most panels and every label in this file are painted on the renderer's own context, so those
  // helpers are bound to it once here. bar() and ring() still take a context explicitly because a
  // few of them draw through a saved/translated transform.
  const fillRound = (x, y, w, h, r, color) => fillRoundAt(ctx, x, y, w, h, r, color);
  const strokeRound = (x, y, w, h, r, color, width) => strokeRoundAt(ctx, x, y, w, h, r, color, width);
  const label = (text, x, y, options) => labelAt(ctx, text, x, y, options);

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(window.innerWidth || FIELD.width);
    const height = Math.floor(window.innerHeight || FIELD.height);
    view.ratio = ratio;
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    view.scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    view.x = (canvas.width - FIELD.width * view.scale) / 2;
    view.y = (canvas.height - FIELD.height * view.scale) / 2;
  }

  window.addEventListener('resize', resize);
  resize();

  function activeRecipe(state) {
    const ticket = activeTicket(state.book);
    return ticket !== null ? ticket.recipe : null;
  }

  function ticketColor(ticket) {
    if (ticket.state === TICKET_ACTIVE) return P.amber;
    if (ticket.state === TICKET_PLATED) return P.jade;
    if (ticket.state === TICKET_SERVED) return P.jadeDeep;
    if (ticket.state === TICKET_EXPIRED) return P.chili;
    return P.muted;
  }

  function statusWord(ticket) {
    if (ticket.state === TICKET_ACTIVE) return 'AT THE WOK';
    if (ticket.state === TICKET_PLATED) return 'PLATED';
    if (ticket.state === TICKET_SERVED) return 'PAID';
    if (ticket.state === TICKET_EXPIRED) return 'LOST';
    return 'IN QUEUE';
  }

  function paintBackdrop() {
    const wall = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    wall.addColorStop(0, P.wallTop);
    wall.addColorStop(1, P.wallBottom);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    const halo = ctx.createRadialGradient(588, 318, 20, 588, 318, 330);
    halo.addColorStop(0, 'rgba(255,146,64,0.22)');
    halo.addColorStop(0.55, 'rgba(255,120,50,0.07)');
    halo.addColorStop(1, 'rgba(255,120,50,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(340, 40, 500, 400);

    const lampHalo = ctx.createRadialGradient(892, 132, 12, 892, 132, 260);
    lampHalo.addColorStop(0, 'rgba(255,222,160,0.16)');
    lampHalo.addColorStop(0.5, 'rgba(255,222,160,0.05)');
    lampHalo.addColorStop(1, 'rgba(255,222,160,0)');
    ctx.fillStyle = lampHalo;
    ctx.fillRect(660, 100, 460, 220);

    ctx.fillStyle = 'rgba(255,255,255,0.022)';
    for (let x = 34; x < FIELD.width; x += 86) ctx.fillRect(x, 100, 1, 310);
  }

  function paintCounter() {
    const top = ctx.createLinearGradient(0, 392, 0, 410);
    top.addColorStop(0, '#6b4a34');
    top.addColorStop(1, '#4a3225');
    ctx.fillStyle = top;
    ctx.fillRect(0, 392, FIELD.width, 16);

    const face = ctx.createLinearGradient(0, 408, 0, 458);
    face.addColorStop(0, '#4a3225');
    face.addColorStop(1, '#26180f');
    ctx.fillStyle = face;
    ctx.fillRect(0, 408, FIELD.width, 50);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    for (let x = 160; x < FIELD.width; x += 160) ctx.fillRect(x, 410, 1, 46);
    ctx.fillStyle = 'rgba(255,179,71,0.16)';
    ctx.fillRect(0, 409, FIELD.width, 2);
  }

  function paintNameplate() {
    fillRound(18, 14, 170, 76, 9, '#191014');
    strokeRound(18.5, 14.5, 169, 75, 9, 'rgba(255,92,138,0.25)', 1);
    label('E M B E R', 103, 36, { size: 11, weight: 700, color: '#ffb9cd', align: 'center' });
    ctx.save();
    ctx.shadowColor = 'rgba(255,92,138,0.85)';
    ctx.shadowBlur = 18;
    label('WOK', 103, 66, { size: 30, weight: 700, color: '#ff6f9c', align: 'center', family: FONT.display });
    ctx.restore();
    label('NIGHT MARKET', 103, 81, { size: 7.5, weight: 600, color: 'rgba(255,200,215,0.55)', align: 'center' });
    sparkle(ctx, 34, 27, 4, 'rgba(255,209,102,0.65)');
    sparkle(ctx, 172, 27, 3, 'rgba(255,209,102,0.45)');
  }

  function paintTicket(ticket, x, y, w, h, state) {
    const active = ticket.state === TICKET_ACTIVE;
    const plated = ticket.state === TICKET_PLATED;
    const over = ticket.state === TICKET_SERVED || ticket.state === TICKET_EXPIRED;

    ctx.save();
    ctx.globalAlpha = over ? 0.72 : 1;
    fillRound(x + 2, y + 4, w, h, 7, 'rgba(0,0,0,0.35)');

    ctx.save();
    if (active) {
      ctx.shadowColor = 'rgba(255,179,71,0.55)';
      ctx.shadowBlur = 14;
    } else if (plated) {
      ctx.shadowColor = 'rgba(87,199,133,0.45)';
      ctx.shadowBlur = 10;
    }
    fillRound(x, y, w, h, 7, over ? P.paperShade : P.paper);
    ctx.restore();

    ctx.save();
    roundRectPath(ctx, x, y, w, h, 7);
    ctx.clip();
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(x, y, w, 18);
    ctx.fillStyle = ticketColor(ticket);
    ctx.fillRect(x, y + 18, w, 2);
    ctx.restore();

    label('ORDER #' + ticket.id, x + 10, y + 13, { size: 9, weight: 700, color: '#f2e6cb' });
    label(statusWord(ticket), x + w - 10, y + 13, { size: 8, weight: 700, color: over ? '#d9c7a4' : ticketColor(ticket), align: 'right' });

    label(ticket.recipe.name, x + 12, y + 40, { size: 15, weight: 700, color: P.ink });

    fillRound(x + w - 66, y + 25, 54, 18, 4, '#ffd166');
    label(money(ticket.recipe.price), x + w - 39, y + 38, { size: 11, weight: 700, color: P.ink, align: 'center' });

    for (let index = 0; index < ticket.recipe.ingredients.length; index += 1) {
      const id = ticket.recipe.ingredients[index];
      const picked = state.tray.includes(id);
      ctx.save();
      ctx.globalAlpha = active && !picked ? 0.32 : 1;
      drawIngredientIcon(ctx, id, x + 26 + index * 32, y + 56, 24);
      ctx.restore();
      if (active && picked) {
        ctx.fillStyle = P.jade;
        ctx.beginPath();
        ctx.arc(x + 36 + index * 32, y + 65, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const fraction = ticket.patienceMax > 0 ? ticket.patience / ticket.patienceMax : 0;
    const barColor = fraction > 0.5 ? P.jade : fraction > 0.25 ? P.amber : P.chili;
    bar(ctx, x + 12, y + 68, w - 24, 6, fraction, { fill: barColor, back: 'rgba(42,29,21,0.18)' });

    if (ticket.state === TICKET_SERVED || ticket.state === TICKET_EXPIRED) {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2 + 2);
      ctx.rotate(-0.12);
      const stampText = ticket.state === TICKET_SERVED ? 'PAID' : 'LOST';
      const color = ticket.state === TICKET_SERVED ? P.jadeDeep : P.chili;
      setFont(ctx, 24, 700);
      const width = ctx.measureText(stampText).width + 26;
      ctx.globalAlpha = 0.85;
      roundRectPath(ctx, -width / 2, -18, width, 34, 6);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stampText, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function paintTickets(state) {
    for (let index = 0; index < state.book.slots.length; index += 1) {
      const slotX = LAYOUT.ticketX[index];
      const y = LAYOUT.ticketY;
      const ticket = state.book.slots[index];
      if (ticket === null) {
        ctx.save();
        ctx.setLineDash([7, 6]);
        strokeRound(slotX, y, LAYOUT.ticketW, LAYOUT.ticketH, 7, 'rgba(255,255,255,0.13)', 1.2);
        ctx.setLineDash([]);
        label('OPEN SLOT', slotX + LAYOUT.ticketW / 2, y + 34, { size: 8.5, weight: 600, color: 'rgba(255,255,255,0.28)', align: 'center' });
        label('THE NEXT TICKET WAITS HERE', slotX + LAYOUT.ticketW / 2, y + 50, { size: 7.5, weight: 500, color: 'rgba(255,255,255,0.16)', align: 'center' });
        ctx.restore();
      } else {
        paintTicket(ticket, slotX, y, LAYOUT.ticketW, LAYOUT.ticketH, state);
      }
    }
  }

  function paintShiftPanel(state) {
    const panel = LAYOUT.shift;
    fillRound(panel.x, panel.y, panel.w, panel.h, 10, '#241810');
    strokeRound(panel.x + 0.5, panel.y + 0.5, panel.w - 1, panel.h - 1, 10, '#4a3423', 1.2);
    const left = Math.max(0, SHIFT.seconds - state.time);
    const fraction = Math.max(0, Math.min(1, left / SHIFT.seconds));
    const ringColor = state.rush ? P.chili : P.amber;
    ring(ctx, panel.x + 42, panel.y + 34, 30, 6.5, fraction, ringColor, 'rgba(255,255,255,0.09)');
    label(clockText(left), panel.x + 42, panel.y + 34, { size: 16, weight: 700, color: P.cream, align: 'center', baseline: 'middle', family: FONT.mono });
    label('SHIFT CLOCK', panel.x + 42, panel.y + 75, { size: 7, weight: 700, color: P.muted, align: 'center' });

    const x = panel.x + 78;
    label('EARNINGS', x, panel.y + 15, { size: 8, weight: 700, color: P.muted });
    label(money(state.score.earnings), x, panel.y + 38, { size: 20, weight: 700, color: P.gold, family: FONT.display });
    bar(ctx, x, panel.y + 43, 158, 5, state.score.earnings / SHIFT.goal, { fill: P.jade, back: 'rgba(255,255,255,0.08)' });
    label('GOAL ' + money(SHIFT.goal), x, panel.y + 60, { size: 8, weight: 600, color: P.muted });
    const comboTint = state.score.combo > 0 ? P.amber : 'rgba(179,166,142,0.55)';
    label('COMBO x' + state.score.combo, panel.x + 236, panel.y + 60, { size: 8.5, weight: 700, color: comboTint, align: 'right' });
  }

  function paintShelf(state) {
    fillRound(10, 106, 292, 350, 10, '#221711');
    strokeRound(10.5, 106.5, 291, 349, 10, '#4a3423', 1.2);
    label('INGREDIENTS', 22, 130, { size: 12, weight: 700, color: '#f2c063' });
    label('TAP TO PICK', 290, 130, { size: 8, weight: 600, color: P.muted, align: 'right' });

    const recipe = activeRecipe(state);
    const wanted = recipe !== null ? recipe.ingredients : [];
    for (let index = 0; index < INGREDIENTS.length; index += 1) {
      const ingredient = INGREDIENTS[index];
      const rect = binRect(index);
      const picked = state.tray.includes(ingredient.id);
      const needed = wanted.includes(ingredient.id);
      fillRound(rect.x, rect.y, rect.w, rect.h, 7, '#31221a');
      if (needed && !picked) {
        ctx.save();
        ctx.shadowColor = 'rgba(255,179,71,0.5)';
        ctx.shadowBlur = 9;
        strokeRound(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1, 7, P.amber, 1.6);
        ctx.restore();
      } else if (picked) {
        strokeRound(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1, 7, P.jade, 1.6);
      } else {
        strokeRound(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1, 7, '#443023', 1);
      }
      drawIngredientIcon(ctx, ingredient.id, rect.x + 27, rect.y + 35, 34);
      label(ingredient.name, rect.x + 50, rect.y + 30, { size: 12, weight: 700, color: P.cream });
      label(ingredient.note, rect.x + 50, rect.y + 47, { size: 8, weight: 500, color: 'rgba(179,166,142,0.85)' });
      if (picked) {
        ctx.fillStyle = P.jade;
        ctx.beginPath();
        ctx.arc(rect.x + rect.w - 13, rect.y + 13, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#12301f';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rect.x + rect.w - 17, rect.y + 13);
        ctx.lineTo(rect.x + rect.w - 14, rect.y + 16);
        ctx.lineTo(rect.x + rect.w - 9, rect.y + 10);
        ctx.stroke();
        ctx.lineCap = 'butt';
      }
      if (needed && !picked) {
        ctx.fillStyle = P.amber;
        ctx.beginPath();
        ctx.arc(rect.x + rect.w - 13, rect.y + 13, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function paintTray(state) {
    fillRound(312, 106, 316, 78, 10, '#1d232b');
    strokeRound(312.5, 106.5, 315, 77, 10, '#39424d', 1.2);
    label('PREP TRAY', 324, 119, { size: 8, weight: 700, color: P.muted });
    const ticket = activeTicket(state.book);
    if (ticket === null) {
      label('WAITING FOR A TICKET', 470, 152, { size: 10, weight: 600, color: 'rgba(179,166,142,0.7)', align: 'center' });
      return;
    }
    const recipe = ticket.recipe;
    label(recipe.name, 324, 134, { size: 11.5, weight: 700, color: '#f2c063' });
    let pickedCount = 0;
    for (let index = 0; index < recipe.ingredients.length; index += 1) {
      const id = recipe.ingredients[index];
      const picked = state.tray.includes(id);
      if (picked) pickedCount += 1;
      const x = 324 + index * 52;
      const y = 140;
      fillRound(x, y, 44, 38, 6, picked ? '#2b3a2f' : '#232830');
      if (picked) {
        strokeRound(x + 0.5, y + 0.5, 43, 37, 6, 'rgba(87,199,133,0.85)', 1.4);
      } else {
        ctx.save();
        ctx.setLineDash([4, 4]);
        strokeRound(x + 0.5, y + 0.5, 43, 37, 6, 'rgba(179,166,142,0.35)', 1);
        ctx.setLineDash([]);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = picked ? 1 : 0.3;
      drawIngredientIcon(ctx, id, x + 22, y + 19, 26);
      ctx.restore();
      if (picked) {
        ctx.fillStyle = P.jade;
        ctx.beginPath();
        ctx.arc(x + 36, y + 8, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const complete = pickedCount === recipe.ingredients.length;
    label(pickedCount + '/' + recipe.ingredients.length, 612, 156, { size: 17, weight: 700, color: complete ? P.jade : P.amber, align: 'right', family: FONT.mono });
    label(complete ? 'READY' : 'TO PICK', 612, 172, { size: 8, weight: 700, color: complete ? P.jade : P.muted, align: 'right' });
  }

  function paintCombo(state) {
    fillRound(636, 106, 120, 78, 10, '#1f1a24');
    strokeRound(636.5, 106.5, 119, 77, 10, '#3d3350', 1.2);
    label('COMBO', 646, 122, { size: 8, weight: 700, color: P.muted });
    const combo = state.score.combo;
    label('x' + combo, 646, 156, { size: 30, weight: 700, color: combo > 0 ? P.gold : 'rgba(255,255,255,0.18)', family: FONT.display });
    label('BEST x' + state.score.bestCombo, 646, 174, { size: 8, weight: 600, color: 'rgba(179,166,142,0.8)' });
    if (combo > 0 && state.score.comboTimer > 0) {
      const fraction = state.score.comboTimer / 8;
      fillRound(700, 112, 46, 4, 2, 'rgba(255,255,255,0.1)');
      fillRound(700, 112, 46 * Math.min(1, fraction), 4, 2, P.amber);
    }
  }

  function paintChop(state) {
    const chop = state.chop;
    const active = activeRecipe(state);
    const ready = active !== null && trayComplete(active, state.tray);
    label('CHOP', CHOP.cx, 262, { size: 9, weight: 700, color: chop.needed && ready ? P.amber : P.muted, align: 'center' });

    const board = CHOP.board;
    fillRound(board.x - 4, board.y + 88, board.w + 8, 12, 4, 'rgba(0,0,0,0.35)');
    fillRound(board.x, board.y, board.w, board.h, 6, '#7a5638');
    fillRound(board.x + 3, board.y + 3, board.w - 6, board.h - 6, 4, '#8d6541');
    ctx.strokeStyle = 'rgba(70,44,26,0.6)';
    ctx.lineWidth = 1;
    for (let line = 1; line < 4; line += 1) {
      ctx.beginPath();
      ctx.moveTo(board.x + 6, board.y + line * (board.h / 4));
      ctx.lineTo(board.x + board.w - 8, board.y + line * (board.h / 4) + 3);
      ctx.stroke();
    }

    if (chop.needed) {
      const done = chop.done;
      ctx.save();
      ctx.globalAlpha = done ? 0.85 : 1;
      if (done) {
        drawIngredientIcon(ctx, chop.ingredient, board.x + 32, board.y + 58, 30);
        drawIngredientIcon(ctx, chop.ingredient, board.x + 70, board.y + 42, 26);
        drawIngredientIcon(ctx, chop.ingredient, board.x + 56, board.y + 72, 20);
      } else {
        drawIngredientIcon(ctx, chop.ingredient, board.x + board.w / 2, board.y + board.h / 2 + 4, 44);
      }
      ctx.restore();

      ctx.save();
      ctx.translate(board.x + board.w - 8, board.y + 12);
      ctx.rotate(-0.5 + chop.bounce * 3.2);
      ctx.fillStyle = '#d9dee4';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-8, -10);
      ctx.lineTo(-58, -34);
      ctx.lineTo(-52, -16);
      ctx.lineTo(-6, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,100,112,0.9)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      fillRound(-10, -4, 12, 22, 4, '#3b2a20');
      ctx.restore();

      bar(ctx, board.x, board.y + board.h + 7, board.w, 5, chop.progress, { fill: P.jade, back: 'rgba(255,255,255,0.12)' });
      if (chop.done) {
        label('CHOPPED', board.x + board.w / 2, board.y + board.h + 22, { size: 8, weight: 700, color: P.jade, align: 'center' });
      } else {
        label('TAP THE BOARD', board.x + board.w / 2, board.y + board.h + 22, { size: 7.5, weight: 600, color: 'rgba(179,166,142,0.75)', align: 'center' });
      }
    } else {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(board.x + board.w / 2, board.y + board.h / 2, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      label('NO KNIFE', board.x + board.w / 2, board.y + board.h / 2 + 3, { size: 8, weight: 600, color: 'rgba(255,255,255,0.4)', align: 'center' });
      label('NEEDED FOR THIS TICKET', board.x + board.w / 2, board.y + board.h + 22, { size: 7.5, weight: 500, color: 'rgba(179,166,142,0.5)', align: 'center' });
    }
  }

  function paintFlames(state) {
    const heat = state.wok.heat;
    const time = state.time + state.wok.wobble;
    const baseY = 394;
    const glow = ctx.createRadialGradient(588, 380, 8, 588, 380, 120);
    glow.addColorStop(0, 'rgba(255,150,60,' + (0.1 + heat * 0.35) + ')');
    glow.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(440, 330, 296, 90);

    for (let index = 0; index < 13; index += 1) {
      const x = 512 + index * 12.5;
      const wobble = Math.sin(time * 9 + index * 1.7) * 2.6;
      const height = 5 + heat * 34 + Math.sin(time * 13 + index * 2.1) * 3;
      if (height <= 6) continue;
      const taper = index % 2 === 0 ? 1 : 0.72;
      ctx.beginPath();
      ctx.moveTo(x - 5, baseY);
      ctx.quadraticCurveTo(x - 4 + wobble, baseY - height * 0.6 * taper, x + wobble, baseY - height * taper);
      ctx.quadraticCurveTo(x + 4 + wobble, baseY - height * 0.6 * taper, x + 5, baseY);
      ctx.closePath();
      ctx.fillStyle = index % 2 === 0 ? 'rgba(255,158,31,0.8)' : 'rgba(255,107,53,0.72)';
      ctx.fill();
    }
    if (heat > 0.35) {
      for (let index = 0; index < 7; index += 1) {
        const x = 534 + index * 18;
        const wobble = Math.sin(time * 11 + index * 2) * 2;
        const height = (3 + heat * 16) * 0.7;
        ctx.beginPath();
        ctx.moveTo(x - 3, baseY);
        ctx.quadraticCurveTo(x + wobble, baseY - height, x, baseY - height);
        ctx.quadraticCurveTo(x + 3 + wobble, baseY - height, x + 3, baseY);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,226,150,0.75)';
        ctx.fill();
      }
    }
  }

  function paintWokFood(recipe, amount, burnt) {
    const cx = 588;
    const cy = 326;
    if (burnt) {
      ctx.fillStyle = '#3b2b1e';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 88, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#221810';
      for (let index = 0; index < 9; index += 1) {
        const x = cx + (index - 4) * 19;
        ctx.beginPath();
        ctx.arc(x, cy + 2 + (index % 2 === 0 ? 4 : -3), 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    if (amount <= 0.01) return;
    const k = Math.min(1, 0.35 + amount * 0.65);
    if (recipe.base === 'noodles') {
      ctx.save();
      ctx.lineCap = 'round';
      for (let strand = 0; strand < 9; strand += 1) {
        const offset = (strand - 4) * 5.4 * k;
        ctx.strokeStyle = strand % 3 === 0 ? '#f2c063' : '#d9a34a';
        ctx.lineWidth = strand % 3 === 0 ? 2.2 : 4.6;
        ctx.beginPath();
        ctx.moveTo(cx - 88 * k, cy + offset);
        ctx.quadraticCurveTo(cx, cy + offset - 16 * k, cx + 88 * k, cy + offset);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.fillStyle = '#efe3c6';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 90 * k, 22 * k, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f9f1de';
      for (let grain = 0; grain < 22; grain += 1) {
        const angle = grain * 2.399;
        const radius = Math.sqrt((grain + 1) / 22);
        const x = cx + Math.cos(angle) * 76 * k * radius;
        const y = cy + Math.sin(angle) * 16 * k * radius;
        ctx.beginPath();
        ctx.ellipse(x, y, 2.6, 1.6, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const accents = recipe.accents;
    for (let piece = 0; piece < 10; piece += 1) {
      const angle = piece * 2.399;
      const radius = 0.25 + ((piece * 0.37) % 0.7);
      const x = cx + Math.cos(angle) * 84 * k * radius;
      const y = cy + Math.sin(angle) * 17 * k * radius;
      ctx.fillStyle = accents[piece % accents.length];
      ctx.beginPath();
      ctx.ellipse(x, y - 3, 6 + (piece % 3) * 1.6, 3.4, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function paintWok(state) {
    const wok = state.wok;
    const recipe = activeRecipe(state);
    const readyToCook = recipe !== null && trayComplete(recipe, state.tray) && (!state.chop.needed || state.chop.done);

    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(588, 398, 148, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    fillRound(520, 372, 136, 36, 9, '#20242b');
    fillRound(526, 366, 124, 12, 5, '#2c3139');
    ctx.fillStyle = '#454d57';
    for (let grate = 0; grate < 5; grate += 1) ctx.fillRect(538 + grate * 22, 372, 3, 10);
    ctx.fillStyle = '#2a2f36';
    ctx.beginPath();
    ctx.arc(534, 396, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(642, 396, 5, 0, Math.PI * 2);
    ctx.fill();

    paintFlames(state);

    ctx.save();
    ctx.translate(452, WOK.cy);
    ctx.rotate(-0.18);
    fillRound(-20, -7, 34, 14, 7, '#3e4650');
    ctx.restore();
    ctx.save();
    ctx.translate(724, WOK.cy);
    ctx.rotate(0.18);
    fillRound(-14, -7, 34, 14, 7, '#3e4650');
    ctx.restore();

    const bowl = ctx.createLinearGradient(0, 278, 0, 382);
    bowl.addColorStop(0, '#4c5763');
    bowl.addColorStop(0.5, '#333b46');
    bowl.addColorStop(1, '#1d232b');
    ctx.fillStyle = bowl;
    ctx.beginPath();
    ctx.ellipse(588, WOK.cy, WOK.rx, WOK.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(195,204,214,0.6)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(588, WOK.cy, WOK.rx - 1, WOK.ry - 1, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#1b2027';
    ctx.beginPath();
    ctx.ellipse(588, WOK.cy - 2, WOK.rx - 16, WOK.ry - 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(588, WOK.cy - 3, WOK.rx - 24, WOK.ry - 16, 0, Math.PI * 1.1, Math.PI * 1.85);
    ctx.stroke();

    const foodAmount = wok.burnt ? 0 : wok.ready ? 1 : wok.progress;
    if (readyToCook && foodAmount > 0.01) {
      paintWokFood(recipe, foodAmount, wok.burnt);
    } else if (wok.burnt) {
      paintWokFood(recipe ?? { base: 'rice', accents: ['#3b2b1e'] }, 0.4, true);
    }

    if (wok.ready) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,209,102,0.85)';
      ctx.shadowBlur = 24;
      ctx.strokeStyle = 'rgba(255,209,102,0.8)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(588, WOK.cy - 2, WOK.rx - 12, WOK.ry - 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (recipe === null) {
      label('NO TICKET AT THE WOK', 588, 262, { size: 9, weight: 600, color: 'rgba(179,166,142,0.65)', align: 'center' });
      return;
    }
    if (wok.burnt) {
      label('BURNT - TAP THE WOK TO SCRAPE', 588, 262, { size: 10.5, weight: 700, color: P.chili, align: 'center' });
      return;
    }
    if (wok.ready) {
      const pulse = 0.7 + Math.sin(state.time * 6) * 0.3;
      label('DISH READY - TAP THE WOK TO PLATE', 588, 262, { size: 10.5, weight: 700, color: P.gold, align: 'center', alpha: pulse });
      return;
    }
    if (!readyToCook) {
      label(state.chop.needed && !state.chop.done ? 'CHOP, THEN STIR' : 'PICK THE TICKET FIRST', 588, 262, { size: 9.5, weight: 600, color: 'rgba(179,166,142,0.75)', align: 'center' });
      return;
    }
    const inBand = wok.heat >= 0.45 && wok.heat <= 0.8;
    label(wok.heat > 0.8 ? 'TOO HOT - LET IT COOL' : inBand ? 'IN THE BAND - KEEP STIRRING' : 'HOLD TO STIR', 588, 256, { size: 10, weight: 700, color: wok.heat > 0.8 ? P.chili : inBand ? P.jade : P.amber, align: 'center' });
    bar(ctx, 528, 264, 120, 5, wok.progress, { fill: P.gold, back: 'rgba(255,255,255,0.12)' });
  }

  function gaugeY(fraction) {
    return GAUGE.y + GAUGE.h - fraction * GAUGE.h;
  }

  function paintGauge(state) {
    label('HEAT', GAUGE.x + GAUGE.w / 2, GAUGE.y - 6, { size: 8, weight: 700, color: P.muted, align: 'center' });
    fillRound(GAUGE.x, GAUGE.y, GAUGE.w, GAUGE.h, GAUGE.w / 2, 'rgba(12,14,18,0.9)');
    strokeRound(GAUGE.x + 0.5, GAUGE.y + 0.5, GAUGE.w - 1, GAUGE.h - 1, GAUGE.w / 2, 'rgba(255,255,255,0.12)', 1);

    const bandTop = gaugeY(0.8);
    const bandBottom = gaugeY(0.45);
    fillRound(GAUGE.x + 5, bandTop, GAUGE.w - 10, bandBottom - bandTop, 9, 'rgba(87,199,133,0.4)');
    ctx.fillStyle = 'rgba(87,199,133,0.9)';
    ctx.fillRect(GAUGE.x + 4, bandTop, 1.6, bandBottom - bandTop);
    ctx.fillRect(GAUGE.x + GAUGE.w - 5.6, bandTop, 1.6, bandBottom - bandTop);

    fillRound(GAUGE.x + 5, gaugeY(1) + 1, GAUGE.w - 10, gaugeY(0.94) - gaugeY(1) - 1, 6, 'rgba(230,64,46,0.55)');

    const heat = state.wok.heat;
    const y = gaugeY(heat);
    const color = state.wok.burnt ? P.chili : heat > 0.8 ? P.chili : heat >= 0.45 ? P.jade : P.amber;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(GAUGE.x + GAUGE.w / 2, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(GAUGE.x + GAUGE.w / 2 - 2, y - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = heat > 0.8 ? P.chili : '#ff9e1f';
    ctx.beginPath();
    ctx.moveTo(GAUGE.x + GAUGE.w / 2, GAUGE.y + GAUGE.h + 12);
    ctx.quadraticCurveTo(GAUGE.x + GAUGE.w / 2 + 6, GAUGE.y + GAUGE.h + 2, GAUGE.x + GAUGE.w / 2, GAUGE.y + GAUGE.h - 3);
    ctx.quadraticCurveTo(GAUGE.x + GAUGE.w / 2 - 6, GAUGE.y + GAUGE.h + 2, GAUGE.x + GAUGE.w / 2, GAUGE.y + GAUGE.h + 12);
    ctx.fill();
  }

  function paintPass(state) {
    fillRound(772, 106, 240, 350, 10, '#1b1318');
    strokeRound(772.5, 106.5, 239, 349, 10, '#3f2f3a', 1.2);

    const cone = ctx.createLinearGradient(0, 128, 0, 400);
    cone.addColorStop(0, 'rgba(255,225,170,0.13)');
    cone.addColorStop(1, 'rgba(255,225,170,0.01)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(848, 128);
    ctx.lineTo(936, 128);
    ctx.lineTo(1004, 400);
    ctx.lineTo(780, 400);
    ctx.closePath();
    ctx.fill();

    fillRound(838, 110, 108, 10, 5, '#4e5862');
    for (let bulb = 0; bulb < 3; bulb += 1) {
      const bx = 864 + bulb * 28;
      ctx.fillStyle = 'rgba(255,226,160,0.28)';
      ctx.beginPath();
      ctx.arc(bx, 126, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe7b0';
      ctx.beginPath();
      ctx.arc(bx, 124, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    label('GARNISH', 892, 194, { size: 8, weight: 700, color: P.muted, align: 'center' });
    for (const jar of JARS) {
      const garnish = GARNISHES.find((entry) => entry.id === jar.id);
      const active = state.plate.dish !== null && !state.plate.garnished;
      drawGarnishJar(ctx, garnish, jar.x, jar.y, jar.w, jar.h, active);
    }

    drawPlate(ctx, PLATE.cx, PLATE.cy, PLATE.r);
    if (state.plate.dish !== null) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,209,102,0.5)';
      ctx.shadowBlur = 22;
      ctx.strokeStyle = 'rgba(255,209,102,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(PLATE.cx, PLATE.cy, PLATE.r, PLATE.r * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      drawDishOn(ctx, state.plate.dish, PLATE.cx, PLATE.cy, PLATE.r, state.plate.garnished ? state.plate.garnishId : null);

      fillRound(966, 146, 42, 20, 4, P.jade);
      label('READY', 987, 156, { size: 8, weight: 700, color: '#0e2a1a', align: 'center', baseline: 'middle' });
      ctx.strokeStyle = 'rgba(87,199,133,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(987, 166);
      ctx.lineTo(987, 176);
      ctx.stroke();
    } else {
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(PLATE.cx, PLATE.cy, PLATE.r * 0.55, PLATE.r * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      label('PASS', PLATE.cx, PLATE.cy + 4, { size: 10, weight: 600, color: 'rgba(255,255,255,0.25)', align: 'center' });
    }

    const canServe = state.plate.dish !== null;
    ctx.save();
    if (canServe) {
      ctx.shadowColor = 'rgba(255,179,71,0.65)';
      ctx.shadowBlur = 14;
    }
    fillRound(SERVE.x, SERVE.y, SERVE.w, SERVE.h, 14, canServe ? P.amber : '#2b2f36');
    ctx.restore();
    strokeRound(SERVE.x + 0.5, SERVE.y + 0.5, SERVE.w - 1, SERVE.h - 1, 14, canServe ? '#ffe0a3' : '#3d434c', 1.2);
    label(canServe ? 'SERVE  ' + money(state.plate.dish.price + 3) : 'SERVE', SERVE.x + SERVE.w / 2, SERVE.y + SERVE.h / 2 + 1, { size: 12, weight: 700, color: canServe ? '#2a1d15' : 'rgba(179,166,142,0.6)', align: 'center', baseline: 'middle' });
    label('ENTER', SERVE.x + SERVE.w / 2, SERVE.y + SERVE.h + 11, { size: 7, weight: 600, color: 'rgba(179,166,142,0.45)', align: 'center' });
  }

  function paintCustomer(ticket) {
    const cx = 1146;
    const headY = 322;
    const skin = ['#e8b48f', '#c98d63', '#f2c9a4'][ticket.id % 3];
    const shirt = ['#3a5f7d', '#7d3a4a', '#4a6b3a'][ticket.id % 3];
    const frac = ticket.patienceMax > 0 ? ticket.patience / ticket.patienceMax : 0;

    fillRound(1096, 352, 100, 76, 30, shirt);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.ellipse(1146, 366, 34, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(cx, headY, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#241a15';
    ctx.beginPath();
    ctx.arc(cx, headY - 4, 26, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
    if (ticket.id % 3 === 1) {
      ctx.fillStyle = '#241a15';
      ctx.beginPath();
      ctx.arc(cx + 20, headY - 18, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (ticket.id % 3 === 2) {
      fillRound(cx - 30, headY - 26, 60, 10, 5, '#8a5f1e');
    }

    ctx.fillStyle = '#2a1d15';
    ctx.beginPath();
    ctx.arc(cx - 9, headY + 1, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 9, headY + 1, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2a1d15';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const mouthY = headY + 12;
    const curve = (frac - 0.5) * 16;
    ctx.beginPath();
    ctx.moveTo(cx - 8, mouthY);
    ctx.quadraticCurveTo(cx, mouthY + curve, cx + 8, mouthY);
    ctx.stroke();

    if (frac < 0.35) {
      ctx.strokeStyle = 'rgba(42,29,21,0.7)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - 14, headY - 8);
      ctx.lineTo(cx - 5, headY - 5);
      ctx.moveTo(cx + 14, headY - 8);
      ctx.lineTo(cx + 5, headY - 5);
      ctx.stroke();
      ctx.fillStyle = 'rgba(180,220,255,0.8)';
      ctx.beginPath();
      ctx.ellipse(cx + 20, headY - 2, 2.6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineCap = 'butt';
  }

  function paintWindow(state) {
    fillRound(1022, 106, 248, 350, 12, '#1b120e');
    strokeRound(1022.5, 106.5, 247, 349, 12, '#4a3423', 1.2);
    const inner = ctx.createLinearGradient(0, 114, 0, 448);
    inner.addColorStop(0, '#2b1f26');
    inner.addColorStop(1, '#150e14');
    ctx.save();
    roundRectPath(ctx, 1030, 114, 232, 334, 8);
    ctx.clip();
    ctx.fillStyle = inner;
    ctx.fillRect(1030, 114, 232, 334);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let line = 0; line < 6; line += 1) ctx.fillRect(1030, 150 + line * 52, 232, 1);
    ctx.restore();

    if (state.rush) {
      fillRound(1040, 120, 212, 18, 9, 'rgba(230,64,46,0.9)');
      label('RUSH HOUR', 1146, 129, { size: 9, weight: 700, color: '#fff1e3', align: 'center', baseline: 'middle' });
    } else {
      label('SERVICE', 1146, 133, { size: 8, weight: 700, color: 'rgba(179,166,142,0.7)', align: 'center', baseline: 'middle' });
    }

    const urgent = mostUrgent(state.book);
    if (urgent === null) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.arc(1146, 300, 34, 0, Math.PI * 2);
      ctx.fill();
      label('NO ONE WAITING', 1146, 300, { size: 9, weight: 600, color: 'rgba(179,166,142,0.6)', align: 'center', baseline: 'middle' });
      return;
    }

    const bubbleX = 1040;
    const bubbleY = 144;
    const bubbleW = 212;
    const bubbleH = 104;
    fillRound(bubbleX + 2, bubbleY + 3, bubbleW, bubbleH, 10, 'rgba(0,0,0,0.35)');
    fillRound(bubbleX, bubbleY, bubbleW, bubbleH, 10, P.paper);
    ctx.fillStyle = P.paper;
    ctx.beginPath();
    ctx.moveTo(1124, bubbleY + bubbleH - 2);
    ctx.lineTo(1168, bubbleY + bubbleH - 2);
    ctx.lineTo(1146, bubbleY + bubbleH + 22);
    ctx.closePath();
    ctx.fill();

    const lines = recipeLines(urgent.recipe);
    if (lines.length > 1) {
      label(lines[0], bubbleX + bubbleW / 2, bubbleY + 20, { size: 11.5, weight: 700, color: P.ink, align: 'center' });
      label(lines[1], bubbleX + bubbleW / 2, bubbleY + 33, { size: 11.5, weight: 700, color: P.ink, align: 'center' });
    } else {
      label(urgent.recipe.name, bubbleX + bubbleW / 2, bubbleY + 26, { size: 11.5, weight: 700, color: P.ink, align: 'center' });
    }
    drawBowlIcon(ctx, urgent.recipe, bubbleX + bubbleW / 2, bubbleY + 58, 36);

    const frac = urgent.patience / urgent.patienceMax;
    const color = frac > 0.5 ? P.jadeDeep : frac > 0.25 ? '#c98a2e' : P.chili;
    bar(ctx, bubbleX + 20, bubbleY + 82, bubbleW - 64, 7, frac, { fill: color, back: 'rgba(42,29,21,0.16)' });
    label(Math.ceil(urgent.patience) + 's', bubbleX + bubbleW - 18, bubbleY + 82, { size: 8, weight: 700, color, align: 'right', baseline: 'top', family: FONT.mono });

    paintCustomer(urgent);

    const waiting = openTickets(state.book).length;
    if (waiting > 1) {
      fillRound(1040, 420, 96, 20, 10, 'rgba(255,255,255,0.08)');
      label('QUEUE ' + (waiting - 1), 1088, 430, { size: 8, weight: 700, color: 'rgba(247,241,227,0.75)', align: 'center', baseline: 'middle' });
    }
  }

  function paintTape(state, step) {
    fillRound(10, 458, 1260, 16, 6, '#141018');
    ctx.fillStyle = 'rgba(255,179,71,0.22)';
    ctx.fillRect(10, 457, 1260, 1);
    for (let index = 0; index < STEP_LABELS.length; index += 1) {
      const number = index + 1;
      const x = 44 + index * 196;
      const active = number === step;
      ctx.fillStyle = active ? P.amber : 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.arc(x, 466, 7, 0, Math.PI * 2);
      ctx.fill();
      label(String(number), x, 466.5, { size: 9, weight: 700, color: active ? '#2a1d15' : 'rgba(247,241,227,0.55)', align: 'center', baseline: 'middle' });
      label(STEP_LABELS[index], x + 13, 466.5, { size: 10, weight: 700, color: active ? P.cream : 'rgba(247,241,227,0.38)', baseline: 'middle' });
    }
    label('1-8 PICK   C CHOP   HOLD SPACE STIR   P PLATE   ENTER SERVE', 1264, 466.5, { size: 7.5, weight: 600, color: 'rgba(179,166,142,0.5)', align: 'right', baseline: 'middle' });
  }

  function paintParticles(state) {
    const items = state.particles.items;
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.active) continue;
      const life = Math.max(0, item.life / item.maxLife);
      if (item.kind === PARTICLE_STEAM) {
        ctx.fillStyle = 'rgba(' + item.color + ',' + (life * 0.14) + ')';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.size * (1.2 - life * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else if (item.kind === PARTICLE_SMOKE) {
        ctx.fillStyle = 'rgba(' + item.color + ',' + (life * 0.22) + ')';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.size * (1.3 - life * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (item.kind === PARTICLE_EMBER) {
        ctx.fillStyle = 'rgba(' + item.color + ',' + life + ')';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.kind === PARTICLE_CRUMB) {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.life * 9);
        ctx.fillStyle = item.color;
        ctx.globalAlpha = Math.min(1, life * 1.6);
        ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size * 0.7);
        ctx.restore();
      } else if (item.kind === PARTICLE_COIN) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, life * 1.4);
        drawCoin(ctx, item.x, item.y, item.size);
        ctx.restore();
      } else if (item.kind === PARTICLE_PAY) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, life * 1.5);
        ctx.shadowColor = 'rgba(255,209,102,0.7)';
        ctx.shadowBlur = 10;
        label(item.text, item.x, item.y, { size: 18, weight: 700, color: item.color, align: 'center' });
        ctx.restore();
      }
    }
  }

  function paintToast(state) {
    const toast = state.toast;
    if (!toast || toast.ttl <= 0 || !toast.text) return;
    const color = toast.kind === 'good' ? P.jade : toast.kind === 'bad' ? P.chili : toast.kind === 'gold' ? P.gold : P.cream;
    ctx.save();
    setFont(ctx, 12, 700);
    const width = ctx.measureText(toast.text).width;
    const alpha = Math.min(1, toast.ttl / 0.35);
    ctx.globalAlpha = alpha;
    const x = 640 - (width + 38) / 2;
    const y = 420;
    fillRound(x, y, width + 38, 28, 14, 'rgba(10,8,12,0.88)');
    strokeRound(x + 0.5, y + 0.5, width + 37, 27, 14, color, 1.3);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(toast.text, 640, y + 14.5);
    ctx.restore();
  }

  function paintVignette() {
    const vignette = ctx.createRadialGradient(640, 240, 260, 640, 240, 780);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function paintTitle() {
    ctx.fillStyle = 'rgba(5,6,10,0.74)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    fillRound(250, 44, 780, 372, 18, '#1d140f');
    strokeRound(250.5, 44.5, 779, 371, 18, '#5a3f2a', 2);
    strokeRound(262, 56, 756, 348, 14, 'rgba(255,179,71,0.22)', 1);

    ctx.save();
    ctx.shadowColor = 'rgba(255,92,138,0.85)';
    ctx.shadowBlur = 26;
    label('EMBER WOK', 640, 136, { size: 52, weight: 700, color: '#ff6f9c', align: 'center', family: FONT.display });
    ctx.restore();
    sparkle(ctx, 424, 116, 7, 'rgba(255,209,102,0.7)');
    sparkle(ctx, 856, 116, 7, 'rgba(255,209,102,0.7)');
    label('A NIGHT-MARKET COOKING SHIFT', 640, 164, { size: 11, weight: 700, color: P.amber, align: 'center' });

    ctx.fillStyle = 'rgba(255,179,71,0.3)';
    ctx.fillRect(506, 180, 268, 1);

    const lines = [
      'Three tickets hang on the board. Pick each dish off the shelf onto the prep tray.',
      'Chop what the knife asks for, then stir the wok: hold to heat, let go to cool,',
      'and keep the needle in the green band until the dish is ready.',
      'Plate it, tap a garnish jar for a tip, and serve before the customer loses patience.',
    ];
    for (let index = 0; index < lines.length; index += 1) {
      label(lines[index], 640, 208 + index * 22, { size: 12, weight: 500, color: '#efe6d2', align: 'center' });
    }

    label('3:00 SHIFT   ·   RUSH HOUR AT 1:00   ·   NIGHT GOAL $120', 640, 318, { size: 9.5, weight: 700, color: P.muted, align: 'center' });
    label('1-8 PICK · C CHOP · HOLD SPACE STIR · P PLATE · G GARNISH · ENTER SERVE · ESC PAUSE · M MUTE', 640, 340, { size: 8.5, weight: 600, color: 'rgba(179,166,142,0.8)', align: 'center' });
    label('CLICK OR PRESS SPACE TO OPEN THE STALL', 640, 390, { size: 13.5, weight: 700, color: P.gold, align: 'center', alpha: 0.65 + Math.sin(Date.now() / 360) * 0.35 });
  }

  function paintPaused() {
    ctx.fillStyle = 'rgba(5,6,10,0.7)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    fillRound(430, 168, 420, 148, 16, '#1d140f');
    strokeRound(430.5, 168.5, 419, 147, 16, '#5a3f2a', 2);
    label('PAUSED', 640, 226, { size: 34, weight: 700, color: P.cream, align: 'center', family: FONT.display });
    label('The burner keeps its heat while you step away.', 640, 258, { size: 11, weight: 500, color: P.muted, align: 'center' });
    label('ESC OR CLICK TO KEEP COOKING', 640, 288, { size: 10, weight: 700, color: P.gold, align: 'center' });
  }

  function paintOver(state) {
    ctx.fillStyle = 'rgba(5,6,10,0.74)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    fillRound(300, 74, 680, 332, 18, '#1d140f');
    strokeRound(300.5, 74.5, 679, 331, 18, '#5a3f2a', 2);
    strokeRound(312, 86, 656, 308, 14, 'rgba(255,179,71,0.22)', 1);

    label('SHIFT OVER', 640, 132, { size: 32, weight: 700, color: P.cream, align: 'center', family: FONT.display });

    const stars = state.score.earnings >= SHIFT.goal * 1.35 ? 3 : state.score.earnings >= SHIFT.goal ? 2 : state.score.earnings >= SHIFT.goal * 0.6 ? 1 : 0;
    for (let index = 0; index < 3; index += 1) {
      sparkle(ctx, 585 + index * 55, 172, 15, index < stars ? P.gold : 'rgba(255,255,255,0.14)');
    }

    label('EARNED ' + money(state.score.earnings) + '  OF  ' + money(SHIFT.goal), 640, 220, { size: 19, weight: 700, color: P.gold, align: 'center', family: FONT.display });
    label('SERVED ' + state.score.served + '   ·   LOST ' + state.score.lost + '   ·   BEST COMBO x' + state.score.bestCombo + '   ·   GARNISHED ' + state.score.garnishCount, 640, 248, { size: 10, weight: 600, color: P.muted, align: 'center' });

    const verdict = stars >= 2 ? 'THE STALL EARNS ITS KEEP. THE NIGHT MARKET WANTS MORE.' : stars === 1 ? 'A RESPECTABLE NIGHT - THE GOAL IS WITHIN REACH.' : 'SHORT OF THE NIGHT GOAL. ONE MORE SHIFT.';
    label(verdict, 640, 282, { size: 11.5, weight: 700, color: stars >= 2 ? P.jade : P.amber, align: 'center' });

    label('CLICK OR PRESS SPACE TO COOK ANOTHER SHIFT', 640, 336, { size: 12.5, weight: 700, color: P.cream, align: 'center', alpha: 0.65 + Math.sin(Date.now() / 360) * 0.35 });
  }

  function draw(state, step) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = P.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, FIELD.width, FIELD.height);
    ctx.clip();

    paintBackdrop(state);
    paintCounter();
    paintBoard(state);
    paintShelf(state);
    paintTray(state);
    paintCombo(state);
    paintChop(state);
    paintWok(state);
    paintGauge(state);
    paintPass(state);
    paintWindow(state);
    paintTape(state, step);
    paintParticles(state);
    paintToast(state);
    paintVignette();

    if (state.phase === PHASE_TITLE) paintTitle();
    else if (state.phase === PHASE_PAUSED) paintPaused();
    else if (state.phase === PHASE_OVER) paintOver(state);

    ctx.restore();
  }

  function paintBoard(state) {
    fillRound(10, 6, 1260, 92, 12, '#20150f');
    strokeRound(10.5, 6.5, 1259, 91, 12, '#4a3423', 1.4);
    ctx.fillStyle = 'rgba(255,179,71,0.12)';
    ctx.fillRect(22, 8, 1236, 1);
    paintNameplate();
    paintTickets(state);
    paintShiftPanel(state);
  }

  return { draw };
}
