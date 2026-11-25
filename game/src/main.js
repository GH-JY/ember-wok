// Boot. The URL seeds the shift (`?seed=`) and can freeze the page on a staged scene (`?shot=`), which
// is how the screenshots are taken; otherwise the real loop runs. The loop advances the rules at a fixed
// 60 steps per second, lets a slow frame catch up (a hidden tab is clipped instead of fast-forwarding the
// whole shift), drains the engine's cue list into the synth and repaints once per animation frame, so
// input, rules, sound and picture all read the same clock.

import { STEP } from './config.js';
import { createGame, tick, takeCues, currentStep } from './game.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.querySelector('#game');
const status = document.querySelector('#status');
const params = new URLSearchParams(window.location.search);
const seed = Number.parseInt(params.get('seed') ?? '7', 10);
const game = createGame(Number.isFinite(seed) ? seed : 7);
const renderer = createRenderer(canvas);
const shot = params.get('shot');

if (params.get('debug') === '1') window.__emberWok = game;

if (shot !== null) {
  stageShot(shot, game);
  let ready = false;

  // A resize clears the canvas, and a browser may settle its viewport a frame or two after the page
  // loads, so repaint on the next frames and on every resize; the flag only goes up after a paint
  // that survived layout.
  function paintShot() {
    renderer.draw(game.state, currentStep(game));
  }

  paintShot();
  requestAnimationFrame(paintShot);
  window.setTimeout(() => {
    paintShot();
    ready = true;
    window.__shotReady = true;
    if (status !== null) status.textContent = 'Staged screenshot scene: ' + shot;
  }, 300);
  window.addEventListener('resize', () => {
    paintShot();
    if (ready) window.__shotReady = true;
  });
} else {
  const audio = createAudio();
  createInput(canvas, game, audio);

  let last = performance.now();
  let carry = 0;

  function frame(now) {
    const elapsed = Math.min(0.25, Math.max(0, (now - last) / 1000));
    last = now;
    carry += elapsed;

    let steps = 0;
    while (carry >= STEP && steps < 15) {
      tick(game, STEP);
      carry -= STEP;
      steps += 1;
    }
    if (carry >= STEP) carry = 0;

    for (const cue of takeCues(game)) audio.play(cue);
    renderer.draw(game.state, currentStep(game));
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
