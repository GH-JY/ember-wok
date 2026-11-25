// A handful of synthesized sounds: no files, no network, just oscillators. Each cue is a short
// envelope over one or two tones, so the stall ticks, chops, sizzles, chimes and sighs without an
// audio asset anywhere in the repository. Audio starts on the first real interaction (browsers do
// not allow it before), and every call is safe when the context cannot be made.

const CUES = {
  pick: { notes: [[520, 0.05]], type: 'triangle', gain: 0.12 },
  every: { notes: [[660, 0.05]], type: 'triangle', gain: 0.1 },
  chop: { notes: [[180, 0.05], [120, 0.06]], type: 'square', gain: 0.07 },
  stir: { notes: [[90, 0.09]], type: 'sawtooth', gain: 0.05 },
  ready: { notes: [[740, 0.08], [988, 0.1]], type: 'sine', gain: 0.14 },
  plate: { notes: [[600, 0.06], [760, 0.08]], type: 'triangle', gain: 0.12 },
  serve: { notes: [[660, 0.07], [880, 0.07], [1174, 0.12]], type: 'sine', gain: 0.14 },
  fail: { notes: [[220, 0.12], [150, 0.16]], type: 'sawtooth', gain: 0.1 },
  burnt: { notes: [[130, 0.16]], type: 'sawtooth', gain: 0.09 },
  start: { notes: [[392, 0.08], [523, 0.08], [659, 0.14]], type: 'triangle', gain: 0.14 },
  over: { notes: [[659, 0.12], [523, 0.12], [392, 0.2]], type: 'triangle', gain: 0.14 },
};

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context !== null) return context;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    } catch {
      context = null;
    }
    return context;
  }

  function play(name) {
    if (muted) return;
    const cue = CUES[name];
    if (!cue) return;
    const ctx = ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    let at = ctx.currentTime;
    for (const [frequency, length] of cue.notes) {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = cue.type;
      osc.frequency.value = frequency;
      amp.gain.setValueAtTime(0.0001, at);
      amp.gain.exponentialRampToValueAtTime(cue.gain, at + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, at + length);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + length + 0.02);
      at += length * 0.65;
    }
  }

  return {
    play,
    toggle() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
  };
}
