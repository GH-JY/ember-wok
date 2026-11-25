// Pointer and keyboard, mapped onto the rules engine. A tap is converted from the window's pixels
// back into field coordinates (the same letterbox the renderer uses) and hit-tested against the
// station rectangles, so what the drawing shows is exactly what the tap touches. Holding the wok
// stirs until the pointer comes up anywhere; the keyboard mirrors every station and adds pause and
// mute. The first input also unlocks the audio context, which browsers only allow after a gesture.

import { FIELD } from './config.js';
import { hitTest } from './stations.js';
import { INGREDIENTS } from './ingredients.js';
import {
  PHASE_TITLE,
  PHASE_PLAY,
  PHASE_PAUSED,
  PHASE_OVER,
  startShift,
  togglePause,
  pickIngredient,
  chopTap,
  plateTap,
  garnishTap,
  serveTap,
  setStirring,
} from './game.js';

const BIN_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'];
const NUMPAD_KEYS = ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8'];

function fieldPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const px = rect.width > 0 ? (clientX - rect.left) * (canvas.width / rect.width) : clientX;
  const py = rect.height > 0 ? (clientY - rect.top) * (canvas.height / rect.height) : clientY;
  const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
  const offsetX = (canvas.width - FIELD.width * scale) / 2;
  const offsetY = (canvas.height - FIELD.height * scale) / 2;
  return { x: (px - offsetX) / scale, y: (py - offsetY) / scale };
}

function binIndexFor(code) {
  const digit = BIN_KEYS.indexOf(code);
  if (digit >= 0) return digit;
  return NUMPAD_KEYS.indexOf(code);
}

export function createInput(canvas, game, audio) {
  let stirringPointer = false;

  function beginOrResume() {
    const phase = game.state.phase;
    if (phase === PHASE_TITLE || phase === PHASE_OVER) {
      startShift(game);
      return true;
    }
    if (phase === PHASE_PAUSED) {
      togglePause(game);
      return true;
    }
    return false;
  }

  function stopStirring() {
    if (!stirringPointer) return;
    stirringPointer = false;
    setStirring(game, false);
  }

  function onPointerDown(event) {
    audio.unlock();
    if (event.button !== undefined && event.button !== 0) return;
    if (beginOrResume()) return;
    if (game.state.phase !== PHASE_PLAY) return;

    const point = fieldPoint(canvas, event.clientX, event.clientY);
    const hit = hitTest(point.x, point.y);
    if (hit === null) return;
    event.preventDefault();

    switch (hit.kind) {
      case 'bin':
        pickIngredient(game, INGREDIENTS[hit.index].id);
        break;
      case 'chop':
        chopTap(game);
        break;
      case 'wok':
        if (game.state.wok.ready || game.state.wok.burnt) {
          plateTap(game);
        } else {
          stirringPointer = true;
          setStirring(game, true);
        }
        break;
      case 'plate':
        if (game.state.plate.dish !== null) serveTap(game);
        else plateTap(game);
        break;
      case 'serve':
        serveTap(game);
        break;
      case 'garnish':
        garnishTap(game, hit.id);
        break;
      default:
        break;
    }
  }

  function onKeyDown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    audio.unlock();

    if (event.code === 'KeyM') {
      audio.toggle();
      event.preventDefault();
      return;
    }

    const phase = game.state.phase;
    if (phase === PHASE_TITLE || phase === PHASE_OVER) {
      if (event.code === 'Space' || event.code === 'Enter') {
        startShift(game);
        event.preventDefault();
      }
      return;
    }
    if (phase === PHASE_PAUSED) {
      if (event.code === 'Escape' || event.code === 'Space' || event.code === 'Enter') {
        togglePause(game);
        event.preventDefault();
      }
      return;
    }

    const bin = binIndexFor(event.code);
    if (bin >= 0) {
      pickIngredient(game, INGREDIENTS[bin].id);
      event.preventDefault();
      return;
    }

    switch (event.code) {
      case 'KeyC':
        chopTap(game);
        event.preventDefault();
        break;
      case 'KeyP':
        plateTap(game);
        event.preventDefault();
        break;
      case 'KeyG':
        garnishTap(game, 'scallion');
        event.preventDefault();
        break;
      case 'Enter':
        serveTap(game);
        event.preventDefault();
        break;
      case 'Space':
        if (!event.repeat && !stirringPointer) {
          stirringPointer = true;
          setStirring(game, true);
        }
        event.preventDefault();
        break;
      case 'Escape':
        togglePause(game);
        event.preventDefault();
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    if (event.code === 'Space') {
      stopStirring();
      event.preventDefault();
    }
  }

  function onPointerUp() {
    stopStirring();
  }

  function onBlur() {
    stopStirring();
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
}
