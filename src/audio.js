// Web Audio API Sound Generator & Ambient Noise Synthesizer for ALES TempoKoç

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.7;
    this.soundType = 'chime'; // 'chime', 'beep', 'bell', 'digital'

    // Ambient Sound Generator Nodes
    this.ambientSource = null;
    this.ambientGain = null;
    this.ambientType = null; // 'rain', 'waves', 'white', 'coffee'
    this.ambientVolume = 0.5;
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
    if (muted) {
      this.stopAmbientSound();
    }
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

  // Soft click / tick for countdown
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

  playQuestionComplete() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.playTone(587.33, 'triangle', 0.1, 0, this.volume * 0.6); // D5
    this.playTone(880, 'triangle', 0.2, 0.08, this.volume * 0.7); // A5
  }

  playSkipSound() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.playTone(400, 'sine', 0.1, 0, this.volume * 0.3);
    this.playTone(300, 'sine', 0.15, 0.08, this.volume * 0.3);
  }

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

  // --- AMBIENT SOUND SYNTHESIZER ---
  playAmbientSound(type) {
    this.init();
    if (!this.ctx) return;
    this.stopAmbientSound();

    if (type === 'none') return;

    this.ambientType = type;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    this.ambientGain = this.ctx.createGain();

    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.15, this.ctx.currentTime);
    } else if (type === 'waves') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      
      // LFO for wave swelling
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.1; // Slow wave swelling every 10 seconds
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = this.ambientVolume * 0.1;
      lfo.connect(lfoGain);
      lfoGain.connect(this.ambientGain.gain);
      lfo.start();

      this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.12, this.ctx.currentTime);
    } else if (type === 'coffee') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.Q.value = 1.2;
      this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.1, this.ctx.currentTime);
    } else {
      // White noise
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, this.ctx.currentTime);
      this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.08, this.ctx.currentTime);
    }

    whiteNoise.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    whiteNoise.start();
    this.ambientSource = whiteNoise;
  }

  stopAmbientSound() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch (e) {}
      this.ambientSource = null;
    }
    this.ambientType = null;
  }

  setAmbientVolume(vol) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.15, this.ctx.currentTime);
    }
  }
}

export const soundEngine = new SoundEngine();
