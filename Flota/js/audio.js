/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Sintetitzador d'àudio tàctic per a Enfonsar la flota (Web Audio API, sense fitxers externs) */

const MUTE_KEY = 'flota:muted';

class SoundFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this._noiseBuffer = null;
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch (_) {
      this.muted = false;
    }
  }

  _buildContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 18;
      comp.ratio.value = 6;
      comp.attack.value = 0.004;
      comp.release.value = 0.18;

      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  _getNoiseBuffer(ctx) {
    if (this._noiseBuffer && this._noiseBuffer.sampleRate === ctx.sampleRate) {
      return this._noiseBuffer;
    }
    const dur = 1.0;
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this._noiseBuffer = buffer;
    return buffer;
  }

  unlock() {
    if (this.muted) return;
    const ctx = this._buildContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  _withCtx(fn) {
    if (this.muted) return;
    const ctx = this._buildContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume()
        .then(() => {
          if (!this.muted) fn(ctx, this.master);
        })
        .catch(() => {});
      return;
    }
    fn(ctx, this.master);
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch (_) {}
    if (!this.muted) {
      this.unlock();
    }
    return this.muted;
  }

  ping(freq = 660, duration = 0.1) {
    this._withCtx((ctx, out) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.14, now + duration);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain).connect(out);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    });
  }

  /* Pedra que cau a l'aigua: cop d'entrada + esquitx + bombolles d'immersió */
  water() {
    this._withCtx((ctx, out) => {
      const now = ctx.currentTime;

      // 1. Entrada de la pedra a la superfície
      const dropOsc = ctx.createOscillator();
      const dropGain = ctx.createGain();
      dropOsc.type = 'sine';
      dropOsc.frequency.setValueAtTime(240, now);
      dropOsc.frequency.exponentialRampToValueAtTime(68, now + 0.075);
      dropGain.gain.setValueAtTime(0.001, now);
      dropGain.gain.linearRampToValueAtTime(0.24, now + 0.006);
      dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      dropOsc.connect(dropGain).connect(out);
      dropOsc.start(now);
      dropOsc.stop(now + 0.1);

      // 2. Esquitx d'aigua filtrat
      const splashDur = 0.34;
      const noise = ctx.createBufferSource();
      noise.buffer = this._getNoiseBuffer(ctx);

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(260, now);

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1750, now + 0.01);
      bp.frequency.exponentialRampToValueAtTime(420, now + splashDur);
      bp.Q.value = 1.3;

      const splashGain = ctx.createGain();
      splashGain.gain.setValueAtTime(0.001, now);
      splashGain.gain.linearRampToValueAtTime(0.32, now + 0.022);
      splashGain.gain.exponentialRampToValueAtTime(0.001, now + splashDur);

      noise.connect(hp).connect(bp).connect(splashGain).connect(out);
      noise.start(now + 0.008);
      noise.stop(now + splashDur + 0.02);

      // 3. Bombolla principal de la pedra submergint-se ("plop-blup")
      const bubStart = now + 0.045;
      const bubOsc = ctx.createOscillator();
      const bubGain = ctx.createGain();
      bubOsc.type = 'sine';
      bubOsc.frequency.setValueAtTime(320, bubStart);
      bubOsc.frequency.exponentialRampToValueAtTime(980, bubStart + 0.115);
      bubGain.gain.setValueAtTime(0.001, bubStart);
      bubGain.gain.linearRampToValueAtTime(0.26, bubStart + 0.018);
      bubGain.gain.exponentialRampToValueAtTime(0.001, bubStart + 0.14);
      bubOsc.connect(bubGain).connect(out);
      bubOsc.start(bubStart);
      bubOsc.stop(bubStart + 0.15);

      // 4. Segona bombolleta suau de cua
      const bub2Start = now + 0.145;
      const bub2Osc = ctx.createOscillator();
      const bub2Gain = ctx.createGain();
      bub2Osc.type = 'sine';
      bub2Osc.frequency.setValueAtTime(470, bub2Start);
      bub2Osc.frequency.exponentialRampToValueAtTime(1180, bub2Start + 0.08);
      bub2Gain.gain.setValueAtTime(0.001, bub2Start);
      bub2Gain.gain.linearRampToValueAtTime(0.11, bub2Start + 0.012);
      bub2Gain.gain.exponentialRampToValueAtTime(0.001, bub2Start + 0.095);
      bub2Osc.connect(bub2Gain).connect(out);
      bub2Osc.start(bub2Start);
      bub2Osc.stop(bub2Start + 0.11);
    });
  }

  /* Petita explosió quan encerten un vaixell */
  hit() {
    this._withCtx((ctx, out) => {
      const now = ctx.currentTime;

      // 1. Impacte greu del projectil
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(175, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(36, now + 0.24);
      bodyGain.gain.setValueAtTime(0.001, now);
      bodyGain.gain.linearRampToValueAtTime(0.46, now + 0.006);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      bodyOsc.connect(bodyGain).connect(out);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.28);

      // 2. Deflagració d'explosió amb filtre passa-baix que es tanca
      const boomDur = 0.42;
      const noise = ctx.createBufferSource();
      noise.buffer = this._getNoiseBuffer(ctx);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2800, now);
      lp.frequency.exponentialRampToValueAtTime(135, now + boomDur);
      lp.Q.value = 1.7;

      const boomGain = ctx.createGain();
      boomGain.gain.setValueAtTime(0.001, now);
      boomGain.gain.linearRampToValueAtTime(0.55, now + 0.008);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + boomDur);

      noise.connect(lp).connect(boomGain).connect(out);
      noise.start(now);
      noise.stop(now + boomDur + 0.03);
    });
  }

  /* Enfonsament: petita explosió profunda + sirena d'emergència naval curta */
  sunk() {
    this._withCtx((ctx, out) => {
      const now = ctx.currentTime;

      // 1. Cop d'enfonsament inicial
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(135, now);
      thud.frequency.exponentialRampToValueAtTime(30, now + 0.34);
      thudGain.gain.setValueAtTime(0.001, now);
      thudGain.gain.linearRampToValueAtTime(0.45, now + 0.008);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      thud.connect(thudGain).connect(out);
      thud.start(now);
      thud.stop(now + 0.38);

      const burst = ctx.createBufferSource();
      burst.buffer = this._getNoiseBuffer(ctx);
      const burstLp = ctx.createBiquadFilter();
      burstLp.type = 'lowpass';
      burstLp.frequency.setValueAtTime(1800, now);
      burstLp.frequency.exponentialRampToValueAtTime(110, now + 0.36);
      const burstGain = ctx.createGain();
      burstGain.gain.setValueAtTime(0.001, now);
      burstGain.gain.linearRampToValueAtTime(0.4, now + 0.01);
      burstGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      burst.connect(burstLp).connect(burstGain).connect(out);
      burst.start(now);
      burst.stop(now + 0.4);

      // 2. Petita sirena d'emergència naval (2 cicles suaus i nítids)
      const sStart = now + 0.14;
      const sDur = 0.84;
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      oscA.type = 'sawtooth';
      oscB.type = 'triangle';
      oscB.detune.value = 6;

      // Corba típica de sirena d'alarma naval: puja i baixa dues vegades
      const setSirenCurve = (param) => {
        param.setValueAtTime(460, sStart);
        param.linearRampToValueAtTime(780, sStart + 0.19);
        param.linearRampToValueAtTime(470, sStart + 0.40);
        param.linearRampToValueAtTime(790, sStart + 0.60);
        param.linearRampToValueAtTime(420, sStart + sDur);
      };
      setSirenCurve(oscA.frequency);
      setSirenCurve(oscB.frequency);

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1050, sStart);
      bp.Q.value = 1.1;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2100, sStart);

      const sirenGain = ctx.createGain();
      sirenGain.gain.setValueAtTime(0.001, sStart);
      sirenGain.gain.linearRampToValueAtTime(0.24, sStart + 0.045);
      sirenGain.gain.setValueAtTime(0.24, sStart + sDur - 0.12);
      sirenGain.gain.exponentialRampToValueAtTime(0.001, sStart + sDur);

      oscA.connect(bp);
      oscB.connect(bp);
      bp.connect(lp).connect(sirenGain).connect(out);

      oscA.start(sStart);
      oscB.start(sStart);
      oscA.stop(sStart + sDur + 0.03);
      oscB.stop(sStart + sDur + 0.03);
    });
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      setTimeout(() => this.ping(f, 0.2), idx * 115);
    });
  }

  lose() {
    const notes = [392.0, 349.23, 293.66];
    notes.forEach((f, idx) => {
      setTimeout(() => this.ping(f, 0.22), idx * 145);
    });
  }
}

export const soundFX = new SoundFX();
