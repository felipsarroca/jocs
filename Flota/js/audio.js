/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Efectes sonors d'Enfonsar la flota (Web Audio API, sense fitxers externs).
 *
 * Cada efecte sona en una «veu». Una veu nova del mateix canal talla l'anterior
 * amb una fosa molt curta, de manera que, encara que es jugui de pressa, mai no
 * s'acumulen sons ni en queden sonant al final. */

const MUTE_KEY = 'flota:muted';
const CUT_FADE = 0.02; // segons de fosa en tallar un so

class SoundFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this._noiseBuffer = null;
    this._voices = {}; // canal -> veu activa
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch (_) {
      this.muted = false;
    }

    // En passar a segon pla, silencia-ho tot perquè no reaparegui res en tornar
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stopAll();
    });
  }

  _buildContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.knee.value = 12;
      comp.ratio.value = 5;
      comp.attack.value = 0.003;
      comp.release.value = 0.08;

      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  _getNoiseBuffer(ctx) {
    if (this._noiseBuffer && this._noiseBuffer.sampleRate === ctx.sampleRate) {
      return this._noiseBuffer;
    }
    const len = Math.floor(ctx.sampleRate * 1.0);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this._noiseBuffer = buffer;
    return buffer;
  }

  unlock() {
    if (this.muted) return;
    const ctx = this._buildContext();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch (_) {}
    if (this.muted) this.stopAll();
    else this.unlock();
    return this.muted;
  }

  /* ---------- Veus ---------- */

  /** Obre una veu nova al canal indicat i talla la que hi hagués. */
  _voice(channel) {
    if (this.muted) return null;
    const ctx = this._buildContext();
    if (!ctx) return null;
    // Sense cua: si el context dorm, es desperta i el so es programa igualment;
    // com que cada veu nova talla l'anterior, mai no se n'acumulen.
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    this._stopVoice(channel);
    const out = ctx.createGain();
    out.connect(this.master);
    const voice = { ctx, out, sources: [], t: ctx.currentTime + 0.005 };
    this._voices[channel] = voice;
    return voice;
  }

  _stopVoice(channel) {
    const v = this._voices[channel];
    if (!v) return;
    delete this._voices[channel];
    const now = v.ctx.currentTime;
    try {
      v.out.gain.cancelScheduledValues(now);
      v.out.gain.setValueAtTime(v.out.gain.value, now);
      v.out.gain.linearRampToValueAtTime(0, now + CUT_FADE);
    } catch (_) {}
    for (const s of v.sources) {
      try {
        s.stop(now + CUT_FADE + 0.01);
      } catch (_) {}
    }
    setTimeout(() => {
      try {
        v.out.disconnect();
      } catch (_) {}
    }, 200);
  }

  stopAll() {
    Object.keys(this._voices).forEach((ch) => this._stopVoice(ch));
  }

  /** Oscil·lador amb envolupant percussiva (atac curt + caiguda exponencial). */
  _tone(v, { type = 'sine', f0, f1 = f0, at = 0, dur, peak, attack = 0.004, dest = v.out }) {
    const { ctx } = v;
    const t = v.t + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.01);
    v.sources.push(osc);
    return osc;
  }

  /** Soroll filtrat amb envolupant percussiva. */
  _noise(v, { at = 0, dur, peak, attack = 0.003, type = 'bandpass', f0, f1 = f0, q = 1 }) {
    const { ctx } = v;
    const t = v.t + at;
    const src = ctx.createBufferSource();
    src.buffer = this._getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(v.out);
    src.start(t, Math.random() * 0.6);
    src.stop(t + dur + 0.01);
    v.sources.push(src);
    return src;
  }

  /* ---------- Efectes ---------- */

  /** Clic suau d'interfície (col·locar o girar vaixells). */
  ping(freq = 660, duration = 0.07) {
    const v = this._voice('ui');
    if (!v) return;
    this._tone(v, { f0: freq, f1: freq * 1.12, dur: Math.min(duration, 0.09), peak: 0.1 });
  }

  /** Aigua: xipoteig curt (cop sord a la superfície + esquitx + gotes). ~0,3 s */
  water() {
    const v = this._voice('fx');
    if (!v) return;
    // Cop sord de l'aigua
    this._noise(v, { dur: 0.12, peak: 0.35, type: 'lowpass', f0: 700, f1: 180, q: 0.7 });
    // Esquitx: soroll brillant que s'apaga
    this._noise(v, { at: 0.01, dur: 0.22, peak: 0.28, type: 'bandpass', f0: 2600, f1: 900, q: 0.9 });
    // Gotes que tornen a caure (grans de soroll molt curts i aguts)
    const drops = [0.07, 0.11, 0.16, 0.21, 0.26];
    drops.forEach((at, i) => {
      const f = 2200 + Math.random() * 2600;
      this._noise(v, { at: at + Math.random() * 0.02, dur: 0.03, peak: 0.12 - i * 0.015, type: 'bandpass', f0: f, q: 6 });
    });
  }

  /** Tocat: cop metàl·lic sobre el buc + petita detonació. ~0,35 s */
  hit() {
    const v = this._voice('fx');
    if (!v) return;
    // Cruixit de l'impacte
    this._noise(v, { dur: 0.04, peak: 0.45, type: 'highpass', f0: 1800, q: 0.7, attack: 0.001 });
    // Detonació greu
    this._noise(v, { dur: 0.3, peak: 0.55, type: 'lowpass', f0: 1600, f1: 120, q: 0.9, attack: 0.002 });
    this._tone(v, { type: 'triangle', f0: 150, f1: 45, dur: 0.22, peak: 0.4, attack: 0.002 });
    // Ressonància metàl·lica del buc (parcials inharmònics que s'apaguen ràpid)
    [[410, 0.1], [1030, 0.07], [1690, 0.05], [2470, 0.03]].forEach(([f, p]) => {
      this._tone(v, { f0: f, f1: f * 0.98, dur: 0.18, peak: p, attack: 0.001 });
    });
  }

  /** Enfonsat: explosió + dos tocs curts de botzina d'alarma naval. ~0,65 s */
  sunk() {
    const v = this._voice('fx');
    if (!v) return;
    const { ctx } = v;
    // Explosió
    this._noise(v, { dur: 0.32, peak: 0.6, type: 'lowpass', f0: 2000, f1: 100, q: 0.9, attack: 0.002 });
    this._tone(v, { type: 'triangle', f0: 120, f1: 35, dur: 0.3, peak: 0.45, attack: 0.002 });

    // Botzina d'alarma: dues ones quadrades lleugerament desafinades, filtrades
    const horn = ctx.createBiquadFilter();
    horn.type = 'lowpass';
    horn.frequency.value = 1800;
    horn.Q.value = 0.8;
    horn.connect(v.out);
    [0.2, 0.44].forEach((at) => {
      const t = v.t + at;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.012);
      g.gain.setValueAtTime(0.16, t + 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
      g.connect(horn);
      [370, 373.5].forEach((f) => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, t);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.2);
        v.sources.push(osc);
      });
    });
  }

  /** Victòria: arpegi ascendent curt. Comença quan ja ha sonat l'últim impacte. */
  win() {
    const v = this._voice('end');
    if (!v) return;
    v.t += 0.35;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this._tone(v, { f0: f, at: i * 0.09, dur: i === 3 ? 0.3 : 0.14, peak: 0.12 });
    });
  }

  /** Derrota: tres notes descendents curtes. */
  lose() {
    const v = this._voice('end');
    if (!v) return;
    v.t += 0.35;
    [392.0, 329.63, 261.63].forEach((f, i) => {
      this._tone(v, { type: 'triangle', f0: f, at: i * 0.13, dur: i === 2 ? 0.32 : 0.16, peak: 0.16 });
    });
  }
}

export const soundFX = new SoundFX();
