/**
 * Audio Engine using Web Audio API
 * Generates dynamic ticking sounds and victory fanfare without external audio files.
 */
class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
    this.volume = 0.8;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setMuted(isMuted) {
    this.muted = isMuted;
  }

  // Realistic mechanical/wood tick sound on needle strike
  playTick(velocityRatio = 1.0) {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Pitch slightly rises with faster velocity for tension
      const baseFreq = 750 + Math.min(velocityRatio * 350, 400);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);

      gain.gain.setValueAtTime(0.35 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.045);
    } catch (e) {
      console.warn('Audio play tick error:', e);
    }
  }

  // Glorious celebratory victory fanfare
  playVictoryFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      
      // Joyful chord notes: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [
        { freq: 523.25, start: 0.0, duration: 0.12 },
        { freq: 659.25, start: 0.1, duration: 0.12 },
        { freq: 784.00, start: 0.2, duration: 0.14 },
        { freq: 1046.50, start: 0.32, duration: 0.75 },
        // Harmonic support chord
        { freq: 523.25, start: 0.32, duration: 0.75 },
        { freq: 659.25, start: 0.32, duration: 0.75 },
        { freq: 784.00, start: 0.32, duration: 0.75 }
      ];

      notes.forEach(note => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, t + note.start);

        gain.gain.setValueAtTime(0.001, t + note.start);
        gain.gain.linearRampToValueAtTime(0.3 * this.volume, t + note.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.start + note.duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(t + note.start);
        osc.stop(t + note.start + note.duration + 0.05);
      });
    } catch (e) {
      console.warn('Audio play fanfare error:', e);
    }
  }
}

export const sound = new SoundEngine();
