// Web Audio API Sound Generator for ALES TempoKoç

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.7;
    this.soundType = 'chime'; // 'chime', 'beep', 'bell', 'digital'
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setSoundType(type) {
    this.soundType = type;
  }

  playTone(freq, type = 'sine', duration = 0.15, startOffset = 0, gainValue = null) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startOffset);

      const targetGain = gainValue !== null ? gainValue : this.volume;
      gain.gain.setValueAtTime(targetGain, this.ctx.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + startOffset + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + startOffset);
      osc.stop(this.ctx.currentTime + startOffset + duration);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Soft click / tick for countdown (e.g. 5, 4, 3, 2, 1)
  playCountdownTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    this.playTone(880, 'sine', 0.05, 0, this.volume * 0.3);
  }

  // Attention alert when question target time expires
  playTimeoutAlert() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    if (this.soundType === 'beep') {
      this.playTone(600, 'square', 0.2, 0, this.volume * 0.5);
      this.playTone(600, 'square', 0.2, 0.25, this.volume * 0.5);
    } else if (this.soundType === 'bell') {
      this.playTone(440, 'sine', 0.6, 0, this.volume);
      this.playTone(880, 'sine', 0.6, 0.05, this.volume * 0.8);
    } else if (this.soundType === 'digital') {
      this.playTone(900, 'sawtooth', 0.1, 0, this.volume * 0.4);
      this.playTone(1200, 'sawtooth', 0.1, 0.12, this.volume * 0.4);
      this.playTone(1500, 'sawtooth', 0.2, 0.24, this.volume * 0.5);
    } else {
      // Default: Soft Chime Alert
      this.playTone(523.25, 'sine', 0.3, 0, this.volume * 0.8); // C5
      this.playTone(659.25, 'sine', 0.3, 0.1, this.volume * 0.8); // E5
      this.playTone(783.99, 'sine', 0.4, 0.2, this.volume * 0.9); // G5
    }
  }

  // Pleasant chime when question is solved
  playQuestionComplete() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.playTone(587.33, 'triangle', 0.1, 0, this.volume * 0.6); // D5
    this.playTone(880, 'triangle', 0.2, 0.08, this.volume * 0.7); // A5
  }

  // Pas / Boş Bırakıldığında hafif ton
  playSkipSound() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.playTone(400, 'sine', 0.1, 0, this.volume * 0.3);
    this.playTone(300, 'sine', 0.15, 0.08, this.volume * 0.3);
  }

  // Session victory chime
  playSessionFinish() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.4, idx * 0.12, this.volume * 0.8);
    });
  }

  testSound() {
    this.playTimeoutAlert();
  }
}

export const soundEngine = new SoundEngine();
