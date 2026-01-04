/**
 * Bio Synth Generator
 * Creates WAV files using bio-inspired mathematical synthesis
 *
 * Features:
 * - Fibonacci frequency ratios
 * - Golden ratio amplitude envelopes
 * - Natural decay curves
 * - Harmonic series based on biological patterns
 * - Fractal noise generation
 */

class BioSynthGenerator {
  constructor() {
    this.sampleRate = 44100; // CD quality
    this.bitDepth = 16;
    this.PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio
    this.audioContext = null;

    // Schumann Resonances - Earth's electromagnetic frequencies
    this.SCHUMANN_FREQUENCIES = {
      fundamental: 7.83,
      second: 14.3,
      third: 20.8,
      fourth: 27.3,
      fifth: 33.8,
      sixth: 39.0,
      seventh: 45.0
    };

    // Solfeggio Frequencies - Ancient healing tones
    this.SOLFEGGIO_FREQUENCIES = {
      UT: 174,   // Pain reduction
      RE: 285,   // Energy restoration
      MI: 396,   // Liberation from fear
      FA: 417,   // Facilitate change
      SOL: 528,  // DNA repair, transformation (love frequency)
      LA: 639,   // Relationships, connection
      TI: 741,   // Awakening intuition
      SI: 852,   // Spiritual order
      OM: 963    // Divine consciousness
    };

    // Reggae bass frequencies and dub presets
    this.REGGAE_PRESETS = {
      bassNotes: { E: 41.2, F: 43.65, G: 49.0, A: 55.0, B: 61.74 },
      dubDelays: [0, 0.375, 0.75, 1.125], // Quarter note delays at 120 BPM
      dubDecay: 0.6
    };
  }

  /**
   * Initialize Web Audio API context
   */
  async init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Generate kick drum using bio-inspired frequency sweep
   * Based on natural pressure wave decay patterns
   */
  generateKick(duration = 0.5, baseFreq = 60) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      // Bio-inspired frequency sweep (exponential decay like natural resonance)
      const freq = baseFreq * Math.exp(-progress * 8);

      // Golden ratio amplitude envelope
      const envelope = Math.exp(-progress * this.PHI * 6);

      // Add sub-harmonic for body (Fibonacci ratio)
      const fundamental = Math.sin(2 * Math.PI * freq * t);
      const subHarmonic = Math.sin(2 * Math.PI * (freq / 2) * t) * 0.3;

      // Add click transient (mimics membrane impact)
      const click = Math.exp(-progress * 100) * Math.random() * 0.2;

      audioData[i] = (fundamental + subHarmonic + click) * envelope;
    }

    return audioData;
  }

  /**
   * Generate snare drum using fractal noise
   * Based on chaotic biological oscillations
   */
  generateSnare(duration = 0.3, toneFreq = 200) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      // Golden ratio decay envelope
      const envelope = Math.exp(-progress * this.PHI * 10);

      // Tone component (drum shell resonance)
      const tone = Math.sin(2 * Math.PI * toneFreq * t) * 0.3;
      const tone2 = Math.sin(2 * Math.PI * toneFreq * 1.618 * t) * 0.2; // Golden ratio harmonic

      // Fractal noise (snare wires)
      let noise = 0;
      for (let octave = 1; octave <= 4; octave++) {
        noise += (Math.random() * 2 - 1) / octave;
      }
      noise *= 0.5;

      // Combine with bio-inspired ratios
      audioData[i] = (tone + tone2 + noise) * envelope;
    }

    return audioData;
  }

  /**
   * Generate hi-hat using Fibonacci-series filtered noise
   * Mimics natural cymbal shimmer
   */
  generateHiHat(duration = 0.15, brightness = 0.7) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    // Fibonacci sequence for harmonic filtering
    const fib = [1, 2, 3, 5, 8, 13, 21];

    for (let i = 0; i < samples; i++) {
      const progress = i / samples;

      // Sharp exponential decay (like metal vibration)
      const envelope = Math.exp(-progress * 20 * brightness);

      // High-frequency noise with Fibonacci harmonics
      let signal = 0;
      for (let f of fib) {
        const freq = 3000 + f * 500;
        signal += Math.sin(2 * Math.PI * freq * i / this.sampleRate) / f;
      }

      // Add metallic noise
      const noise = (Math.random() * 2 - 1) * 0.7;

      audioData[i] = (signal * 0.3 + noise * 0.7) * envelope;
    }

    return audioData;
  }

  /**
   * Generate bass using harmonic series
   * Based on natural overtone patterns
   */
  generateBass(duration = 1.0, note = 'E', octave = 1) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    // Note frequencies (E1 = 41.2 Hz by default)
    const noteFrequencies = {
      'C': 32.70, 'D': 36.71, 'E': 41.20, 'F': 43.65,
      'G': 49.00, 'A': 55.00, 'B': 61.74
    };

    const baseFreq = noteFrequencies[note] * Math.pow(2, octave - 1);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      // Golden ratio ADSR envelope
      let envelope;
      if (progress < 0.05) {
        // Attack
        envelope = progress / 0.05;
      } else if (progress < 0.15) {
        // Decay
        envelope = 1.0 - (progress - 0.05) * 0.3 / 0.1;
      } else if (progress < 0.8) {
        // Sustain
        envelope = 0.7;
      } else {
        // Release
        envelope = 0.7 * (1 - (progress - 0.8) / 0.2);
      }

      // Harmonic series (natural overtones)
      const fundamental = Math.sin(2 * Math.PI * baseFreq * t);
      const second = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.5;
      const third = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.25;
      const fifth = Math.sin(2 * Math.PI * baseFreq * 5 * t) * 0.1; // Fibonacci harmonic

      // Add slight detuning (biological imperfection)
      const detune = Math.sin(2 * Math.PI * baseFreq * 1.001 * t) * 0.1;

      audioData[i] = (fundamental + second + third + fifth + detune) * envelope * 0.8;
    }

    return audioData;
  }

  /**
   * Generate clap using chaos theory
   * Multiple overlapping transients
   */
  generateClap(duration = 0.3) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    // Simulate multiple hands clapping with slight delays (chaos)
    const clapCount = 5;
    const delays = [0, 0.005, 0.011, 0.017, 0.025]; // Natural timing variations

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      let signal = 0;

      // Each "hand" contributes to the clap
      for (let c = 0; c < clapCount; c++) {
        const clapTime = t - delays[c];
        if (clapTime >= 0) {
          const clapProgress = clapTime / duration;
          const envelope = Math.exp(-clapProgress * 15);

          // Filtered noise per clap
          const noise = (Math.random() * 2 - 1);
          const filtered = noise * envelope;

          signal += filtered / clapCount;
        }
      }

      // Add high-frequency shimmer
      const shimmer = Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-progress * 20) * 0.1;

      audioData[i] = signal + shimmer;
    }

    return audioData;
  }

  /**
   * Generate reggaeton horn using harmonic stacking
   */
  generateReggaetonHorn(duration = 0.4) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    const fundamentalFreq = 400; // Hz

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      // Sharp attack, sustained, quick release
      let envelope;
      if (progress < 0.1) {
        envelope = progress / 0.1;
      } else if (progress < 0.7) {
        envelope = 1.0;
      } else {
        envelope = 1.0 - (progress - 0.7) / 0.3;
      }

      // Brassy harmonic series
      const h1 = Math.sin(2 * Math.PI * fundamentalFreq * t);
      const h2 = Math.sin(2 * Math.PI * fundamentalFreq * 2 * t) * 0.6;
      const h3 = Math.sin(2 * Math.PI * fundamentalFreq * 3 * t) * 0.4;
      const h4 = Math.sin(2 * Math.PI * fundamentalFreq * 4 * t) * 0.3;
      const h5 = Math.sin(2 * Math.PI * fundamentalFreq * 5 * t) * 0.2;

      // Add slight pitch bend up (natural horn attack)
      const pitchBend = progress < 0.05 ? (1 + progress * 0.2) : 1;
      const bendedSignal = Math.sin(2 * Math.PI * fundamentalFreq * pitchBend * t);

      audioData[i] = (h1 + h2 + h3 + h4 + h5 + bendedSignal * 0.1) * envelope * 0.7;
    }

    return audioData;
  }

  /**
   * Generate Schumann resonance tone
   * Earth's electromagnetic frequency - deeply calming
   */
  generateSchumann(frequency = 7.83, duration = 10.0, harmonics = 3) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      // Gentle fade in/out envelope
      let envelope;
      if (progress < 0.1) {
        envelope = progress / 0.1;
      } else if (progress > 0.9) {
        envelope = (1 - progress) / 0.1;
      } else {
        envelope = 1.0;
      }

      // Since Schumann is sub-audio (7.83Hz), we create a binaural beat effect
      // by using a carrier frequency in audible range
      const carrier = 200; // Hz - low, soothing carrier
      const fundamental = Math.sin(2 * Math.PI * carrier * t);
      const modulated = Math.sin(2 * Math.PI * (carrier + frequency) * t);

      // Add harmonics for richness
      let harmonicSum = 0;
      for (let h = 1; h <= harmonics; h++) {
        harmonicSum += Math.sin(2 * Math.PI * carrier * h * t) / (h * 2);
      }

      // Binaural beat effect creates the Schumann frequency difference
      audioData[i] = ((fundamental + modulated) * 0.3 + harmonicSum * 0.2) * envelope;
    }

    return audioData;
  }

  /**
   * Generate Solfeggio healing frequency
   * Ancient tones used for meditation and healing
   */
  generateSolfeggio(frequency = 528, duration = 8.0, overtones = 5) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      // Smooth fade in/out
      let envelope;
      if (progress < 0.15) {
        envelope = progress / 0.15;
      } else if (progress > 0.85) {
        envelope = (1 - progress) / 0.15;
      } else {
        envelope = 1.0;
      }

      // Pure fundamental
      const fundamental = Math.sin(2 * Math.PI * frequency * t);

      // Add golden ratio overtones for healing harmony
      let overtoneSum = 0;
      for (let o = 1; o <= overtones; o++) {
        const overtoneFreq = frequency * Math.pow(this.PHI, o / 3);
        overtoneSum += Math.sin(2 * Math.PI * overtoneFreq * t) / (o * 1.5);
      }

      // Add subtle amplitude modulation for depth
      const modulation = 1 + Math.sin(2 * Math.PI * 0.5 * t) * 0.1;

      audioData[i] = (fundamental * 0.7 + overtoneSum * 0.3) * envelope * modulation;
    }

    return audioData;
  }

  /**
   * Generate reggae bass with dub echo effect
   */
  generateReggaeBass(note = 'E', duration = 2.0, dubStyle = true) {
    const baseFreq = this.REGGAE_PRESETS.bassNotes[note] || 41.2;
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      // Reggae-style envelope: punchy attack, sustained
      let envelope;
      if (progress < 0.02) {
        envelope = progress / 0.02;
      } else if (progress < 0.6) {
        envelope = 1.0;
      } else {
        envelope = 1.0 - (progress - 0.6) / 0.4;
      }

      // Deep sub-bass with harmonics
      const fundamental = Math.sin(2 * Math.PI * baseFreq * t);
      const octave = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.3;
      const fifth = Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * 0.2;

      // Add slight distortion for warmth
      let signal = fundamental + octave + fifth;
      signal = Math.tanh(signal * 1.5); // Soft clipping

      let finalSignal = signal * envelope;

      // Add dub echo delays if enabled
      if (dubStyle) {
        for (const delay of this.REGGAE_PRESETS.dubDelays) {
          const delaySamples = Math.floor(delay * this.sampleRate);
          if (i >= delaySamples) {
            const delayedIndex = i - delaySamples;
            const delayProgress = delayedIndex / samples;
            const delayEnvelope = delayProgress < 0.02 ? delayProgress / 0.02 :
                                  delayProgress < 0.6 ? 1.0 :
                                  1.0 - (delayProgress - 0.6) / 0.4;

            const echoLevel = Math.pow(this.REGGAE_PRESETS.dubDecay,
                                      this.REGGAE_PRESETS.dubDelays.indexOf(delay));

            const delayedT = delayedIndex / this.sampleRate;
            const delayedSignal = Math.sin(2 * Math.PI * baseFreq * delayedT) * delayEnvelope;

            finalSignal += delayedSignal * echoLevel * 0.4;
          }
        }
      }

      audioData[i] = finalSignal * 0.8;
    }

    return audioData;
  }

  /**
   * Generate healing meditation tone (combines Solfeggio + Schumann)
   */
  generateMeditationTone(solfeggioFreq = 528, schumannFreq = 7.83, duration = 15.0) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      // Very gentle fade in/out for meditation
      let envelope;
      if (progress < 0.2) {
        envelope = progress / 0.2;
      } else if (progress > 0.8) {
        envelope = (1 - progress) / 0.2;
      } else {
        envelope = 1.0;
      }

      // Solfeggio tone
      const solfeggio = Math.sin(2 * Math.PI * solfeggioFreq * t);

      // Schumann modulation (creates pulsing effect at Earth frequency)
      const schumannMod = Math.sin(2 * Math.PI * schumannFreq * t);

      // Golden ratio harmonic
      const phi_harmonic = Math.sin(2 * Math.PI * solfeggioFreq * this.PHI * t) * 0.3;

      // Combine with subtle modulation
      const combined = solfeggio * (0.8 + schumannMod * 0.2) + phi_harmonic;

      audioData[i] = combined * envelope * 0.6;
    }

    return audioData;
  }

  /**
   * Convert Float32Array audio data to WAV file blob
   */
  audioDataToWav(audioData, sampleRate = this.sampleRate) {
    const numChannels = 1; // Mono
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioData.length * bytesPerSample;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, this.bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      // Convert float to 16-bit PCM
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Download WAV file
   */
  downloadWav(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Generate and download all sampler sounds
   */
  async generateAllSamples() {
    console.log('🎵 Generating bio synth samples...');

    const samples = [
      { name: 'kick.wav', generator: () => this.generateKick() },
      { name: 'snare.wav', generator: () => this.generateSnare() },
      { name: 'hihat.wav', generator: () => this.generateHiHat() },
      { name: 'bass.wav', generator: () => this.generateBass(1.0, 'E', 1) },
      { name: 'clap.wav', generator: () => this.generateClap() },
      { name: 'horn.wav', generator: () => this.generateReggaetonHorn() },
      { name: 'bass-g.wav', generator: () => this.generateBass(1.0, 'G', 1) },
      { name: 'bass-a.wav', generator: () => this.generateBass(1.0, 'A', 1) },
      { name: 'hihat-open.wav', generator: () => this.generateHiHat(0.5, 0.4) },
      { name: 'shout.wav', generator: () => this.generateShout() },
      { name: 'water.wav', generator: () => this.generateWater() },
      { name: 'electric.wav', generator: () => this.generateElectric() },
    ];

    const results = [];

    for (const sample of samples) {
      try {
        const audioData = sample.generator();
        const wavBlob = this.audioDataToWav(audioData);
        results.push({ name: sample.name, blob: wavBlob, size: wavBlob.size });
        console.log(`✅ Generated: ${sample.name} (${(wavBlob.size / 1024).toFixed(1)} KB)`);
      } catch (error) {
        console.error(`❌ Failed to generate ${sample.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Generate shout/vocal effect using formant synthesis
   */
  generateShout(duration = 0.3) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    // Formant frequencies for "HEY!" vowel sound
    const formants = [700, 1200, 2500]; // Approximate formants

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      // Sharp attack, quick decay
      const envelope = Math.exp(-progress * 10);

      // Fundamental (vocal cord vibration)
      const f0 = 120; // Hz
      const voice = Math.sin(2 * Math.PI * f0 * t);

      // Add formants
      let formantSignal = 0;
      for (let j = 0; j < formants.length; j++) {
        formantSignal += Math.sin(2 * Math.PI * formants[j] * t) / (j + 1);
      }

      // Add breathiness
      const noise = (Math.random() * 2 - 1) * 0.2;

      audioData[i] = (voice * 0.5 + formantSignal * 0.3 + noise) * envelope;
    }

    return audioData;
  }

  /**
   * Generate water droplet using damped oscillation
   */
  generateWater(duration = 0.4) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      // Damped oscillation (like water surface ripple)
      const freq = 800 * Math.exp(-progress * 2);
      const damping = Math.exp(-progress * 5);

      const droplet = Math.sin(2 * Math.PI * freq * t) * damping;

      // Add bubble sound
      const bubbleFreq = 1200;
      const bubble = Math.sin(2 * Math.PI * bubbleFreq * t) * Math.exp(-progress * 8) * 0.3;

      audioData[i] = droplet + bubble;
    }

    return audioData;
  }

  /**
   * Generate electric zap using frequency modulation
   */
  generateElectric(duration = 0.2) {
    const samples = Math.floor(this.sampleRate * duration);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      // Sharp attack, quick decay
      const envelope = Math.exp(-progress * 15);

      // FM synthesis for electric character
      const carrierFreq = 200 + progress * 1000;
      const modFreq = 50;
      const modIndex = 10;

      const modulator = Math.sin(2 * Math.PI * modFreq * t) * modIndex;
      const carrier = Math.sin(2 * Math.PI * carrierFreq * t + modulator);

      // Add crackling noise
      const noise = (Math.random() * 2 - 1) * 0.3;

      audioData[i] = (carrier * 0.7 + noise * 0.3) * envelope;
    }

    return audioData;
  }

  /**
   * Preview audio data in browser
   */
  async previewAudio(audioData) {
    const ctx = await this.init();
    const buffer = ctx.createBuffer(1, audioData.length, this.sampleRate);
    buffer.copyToChannel(audioData, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();

    return source;
  }
}

// Make available globally
window.BioSynthGenerator = BioSynthGenerator;

// Convenience function
window.generateBioSynthSamples = async function() {
  const generator = new BioSynthGenerator();
  const samples = await generator.generateAllSamples();

  console.log(`\n🎵 Generated ${samples.length} samples!`);
  console.log('Total size:', (samples.reduce((sum, s) => sum + s.size, 0) / 1024).toFixed(1), 'KB');

  return samples;
};

console.log('🧬 Bio Synth Generator loaded! Use generateBioSynthSamples() to create WAV files.');
