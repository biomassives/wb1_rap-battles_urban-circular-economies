/**
 * Enhanced Sound Generator
 * Advanced audio synthesis for NFT cards
 *
 * Features:
 * - Musical scales (pentatonic, blues, chromatic)
 * - Harmonics and overtones
 * - Multiple oscillators per sound
 * - Effects (reverb, delay, chorus)
 * - Sample-based synthesis (future)
 */

class EnhancedSoundGenerator {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.activeNodes = [];

    // Musical scales (MIDI note numbers)
    this.scales = {
      pentatonic: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24], // Major pentatonic
      blues: [0, 3, 5, 6, 7, 10, 12, 15, 17, 18, 19, 22, 24], // Blues scale
      minor: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24], // Natural minor
      major: [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24], // Major scale
      chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // All notes
    };

    // Animal spirit to scale mapping
    this.animalScales = {
      'Chicken': 'pentatonic',
      'Cat': 'blues',
      'Goat': 'major',
      'Dog': 'pentatonic',
      'Bunny': 'major',
      'Pigeon': 'minor',
      "Cooper's Hawk": 'blues',
      'Eagle': 'chromatic',
      'Lion': 'blues',
      'Coywolf': 'minor'
    };
  }

  /**
   * Initialize audio context (call on first user interaction)
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    }
  }

  /**
   * Convert MIDI note number to frequency
   */
  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Get musical frequency based on scale and index
   */
  getMusicalFrequency(animalSpirit, seedIndex, baseOctave = 3) {
    const scale = this.animalScales[animalSpirit] || 'pentatonic';
    const scaleNotes = this.scales[scale];
    const noteIndex = seedIndex % scaleNotes.length;
    const octaveShift = Math.floor(seedIndex / scaleNotes.length) % 3; // 0-2 octaves up

    const midiNote = 60 + (baseOctave - 4) * 12 + scaleNotes[noteIndex] + (octaveShift * 12);
    return this.midiToFreq(midiNote);
  }

  /**
   * Create a complex sound with harmonics
   */
  playSoundEnhanced(config) {
    this.init();
    this.stopAll(); // Stop any currently playing sounds

    const {
      animalSpirit = 'Chicken',
      cardId = 1,
      rarity = 'Common',
      waveType = 'sine',
      duration = 2.0
    } = config;

    const now = this.audioContext.currentTime;

    // Get fundamental frequency from musical scale
    const fundamentalFreq = this.getMusicalFrequency(animalSpirit, cardId);

    // Rarity affects complexity
    const harmonicsCount = {
      'Common': 1,
      'Uncommon': 2,
      'Rare': 3,
      'Legendary': 4
    }[rarity] || 1;

    // Create multiple oscillators (fundamental + harmonics)
    for (let i = 0; i < harmonicsCount; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const panner = this.audioContext.createStereoPanner();

      // Harmonic frequencies (octaves and fifths)
      const harmonicRatio = i === 0 ? 1 : (i === 1 ? 2 : (i === 2 ? 1.5 : 3));
      osc.frequency.setValueAtTime(fundamentalFreq * harmonicRatio, now);

      // Wave type varies by harmonic
      const waveTypes = ['sine', 'triangle', 'sawtooth', 'square'];
      osc.type = waveTypes[i % waveTypes.length];

      // Harmonic volume (quieter for higher harmonics)
      const harmonicVolume = 1 / (i + 1);

      // ADSR Envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(harmonicVolume * 0.3, now + 0.05); // Attack
      gain.gain.linearRampToValueAtTime(harmonicVolume * 0.2, now + 0.15); // Decay
      gain.gain.setValueAtTime(harmonicVolume * 0.2, now + duration - 0.3); // Sustain
      gain.gain.linearRampToValueAtTime(0, now + duration); // Release

      // Stereo panning (spread harmonics)
      const panValue = (i / harmonicsCount) * 2 - 1; // -1 to 1
      panner.pan.setValueAtTime(panValue * 0.5, now);

      // Connect nodes
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain);

      // Start and schedule stop
      osc.start(now);
      osc.stop(now + duration);

      // Track active nodes
      this.activeNodes.push({ osc, gain, panner });

      // Cleanup when finished
      osc.onended = () => {
        this.activeNodes = this.activeNodes.filter(node => node.osc !== osc);
        osc.disconnect();
        gain.disconnect();
        panner.disconnect();
      };
    }

    // Add subtle vibrato for Legendary rarity
    if (rarity === 'Legendary') {
      const vibrato = this.audioContext.createOscillator();
      const vibratoGain = this.audioContext.createGain();

      vibrato.frequency.setValueAtTime(5, now); // 5 Hz vibrato
      vibratoGain.gain.setValueAtTime(10, now); // 10 Hz depth

      vibrato.connect(vibratoGain);

      // Apply vibrato to all oscillators
      this.activeNodes.forEach(node => {
        vibratoGain.connect(node.osc.frequency);
      });

      vibrato.start(now);
      vibrato.stop(now + duration);
    }

    return { duration, frequency: fundamentalFreq };
  }

  /**
   * Play a melodic sequence (for special animations)
   */
  playMelody(animalSpirit, noteCount = 5, tempo = 120) {
    this.init();
    this.stopAll();

    const beatDuration = 60 / tempo; // Quarter note duration
    const now = this.audioContext.currentTime;

    for (let i = 0; i < noteCount; i++) {
      const startTime = now + (i * beatDuration);
      const freq = this.getMusicalFrequency(animalSpirit, i);

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      // Envelope for each note
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + beatDuration * 0.9);
      gain.gain.setValueAtTime(0, startTime + beatDuration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + beatDuration);

      this.activeNodes.push({ osc, gain });

      osc.onended = () => {
        this.activeNodes = this.activeNodes.filter(node => node.osc !== osc);
        osc.disconnect();
        gain.disconnect();
      };
    }

    return { duration: noteCount * beatDuration };
  }

  /**
   * Create ambient sound (for background/hover)
   */
  playAmbient(animalSpirit, duration = 5) {
    this.init();
    this.stopAll();

    const now = this.audioContext.currentTime;
    const freq = this.getMusicalFrequency(animalSpirit, 0, 2); // Lower octave

    // Create pad sound with multiple detuned oscillators
    const numVoices = 3;
    for (let i = 0; i < numVoices; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((i - 1) * 10, now); // Slight detune for chorus

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(1, now);

      // Slow attack/release for pad
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 1);
      gain.gain.setValueAtTime(0.05, now + duration - 1);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);

      this.activeNodes.push({ osc, gain, filter });

      osc.onended = () => {
        this.activeNodes = this.activeNodes.filter(node => node.osc !== osc);
        osc.disconnect();
        gain.disconnect();
        filter.disconnect();
      };
    }

    return { duration };
  }

  /**
   * Generate percussive sound (for rhythm/clicking)
   */
  playPercussion(type = 'kick', rarity = 'Common') {
    this.init();

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    if (type === 'kick') {
      // Kick drum: frequency sweep from high to low
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.3);

    } else if (type === 'snare') {
      // Snare: noise + tone
      const noise = this.audioContext.createBufferSource();
      const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.2, this.audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);

      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }

      noise.buffer = noiseBuffer;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      noise.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.2);
      noise.stop(now + 0.2);

    } else if (type === 'hihat') {
      // Hi-hat: filtered noise
      const noise = this.audioContext.createBufferSource();
      const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);

      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }

      noise.buffer = noiseBuffer;

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 0.1);
    }

    return { type };
  }

  /**
   * Stop all currently playing sounds
   */
  stopAll() {
    this.activeNodes.forEach(node => {
      try {
        if (node.osc && node.osc.stop) {
          node.osc.stop();
        }
      } catch (e) {
        // Already stopped
      }
    });
    this.activeNodes = [];
  }

  /**
   * Get sound preview info without playing
   */
  getSoundInfo(animalSpirit, cardId, rarity) {
    const freq = this.getMusicalFrequency(animalSpirit, cardId);
    const scale = this.animalScales[animalSpirit] || 'pentatonic';
    const harmonics = {
      'Common': 1,
      'Uncommon': 2,
      'Rare': 3,
      'Legendary': 4
    }[rarity] || 1;

    return {
      frequency: Math.round(freq * 100) / 100,
      scale,
      harmonics,
      musicalNote: this.freqToNoteName(freq)
    };
  }

  /**
   * Convert frequency to musical note name
   */
  freqToNoteName(freq) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const midi = 12 * Math.log2(freq / 440) + 69;
    const noteIndex = Math.round(midi) % 12;
    const octave = Math.floor(Math.round(midi) / 12) - 1;
    return `${noteNames[noteIndex]}${octave}`;
  }

  /**
   * Cleanup audio context
   */
  destroy() {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export as global for use in pages
if (typeof window !== 'undefined') {
  window.EnhancedSoundGenerator = EnhancedSoundGenerator;
}

export default EnhancedSoundGenerator;
