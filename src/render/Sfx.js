// Lightweight Web Audio beeps — no binary assets. Fails closed when AudioContext
// is unavailable (headless smokes, autoplay policies).
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  context() {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
    } catch {
      return null;
    }
    return this.ctx;
  }

  resume() {
    const ctx = this.context();
    if (ctx?.state === "suspended") ctx.resume().catch(() => {});
  }

  tone(freq, duration, { type = "sine", gain = 0.07, delay = 0 } = {}) {
    if (this.muted) return;
    const ctx = this.context();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  playCapture() {
    this.resume();
    this.tone(520, 0.07, { gain: 0.06 });
    this.tone(780, 0.09, { gain: 0.055, delay: 0.05 });
  }

  playKill() {
    this.resume();
    this.tone(380, 0.05, { type: "square", gain: 0.045 });
    this.tone(920, 0.11, { gain: 0.07, delay: 0.04 });
    this.tone(1180, 0.06, { gain: 0.04, delay: 0.09 });
  }

  playDeath() {
    this.resume();
    this.tone(240, 0.16, { type: "sawtooth", gain: 0.05 });
    this.tone(140, 0.22, { type: "sine", gain: 0.04, delay: 0.08 });
  }
}
