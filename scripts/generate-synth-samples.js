#!/usr/bin/env node

/**
 * Synth WAV Sample Generator
 * Generates bass, phaser, and space music samples as WAV files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// WAV file format helper
class WAVWriter {
  constructor(sampleRate = 44100, numChannels = 1) {
    this.sampleRate = sampleRate;
    this.numChannels = numChannels;
    this.samples = [];
  }

  addSample(value) {
    // Clamp to -1 to 1
    const clamped = Math.max(-1, Math.min(1, value));
    this.samples.push(clamped);
  }

  writeWAV(filename) {
    const numSamples = this.samples.length;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = this.numChannels * bytesPerSample;
    const dataSize = numSamples * blockAlign;
    const fileSize = 44 + dataSize;

    const buffer = Buffer.alloc(fileSize);
    let offset = 0;

    // RIFF header
    buffer.write('RIFF', offset); offset += 4;
    buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
    buffer.write('WAVE', offset); offset += 4;

    // fmt chunk
    buffer.write('fmt ', offset); offset += 4;
    buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
    buffer.writeUInt16LE(1, offset); offset += 2; // PCM format
    buffer.writeUInt16LE(this.numChannels, offset); offset += 2;
    buffer.writeUInt32LE(this.sampleRate, offset); offset += 4;
    buffer.writeUInt32LE(this.sampleRate * blockAlign, offset); offset += 4; // byte rate
    buffer.writeUInt16LE(blockAlign, offset); offset += 2;
    buffer.writeUInt16LE(bytesPerSample * 8, offset); offset += 2; // bits per sample

    // data chunk
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;

    // Write samples
    for (let i = 0; i < numSamples; i++) {
      const sample16 = Math.floor(this.samples[i] * 32767);
      buffer.writeInt16LE(sample16, offset);
      offset += 2;
    }

    fs.writeFileSync(filename, buffer);
    console.log(`✅ Generated: ${path.basename(filename)}`);
  }
}

// ============================================================================
// BASS SYNTHESIS
// ============================================================================

function generateSubBass(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 1.0;
  const numSamples = Math.floor(duration * sampleRate);
  const baseFreq = 55; // A1 - sub bass

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Deep sine wave with subtle harmonic
    const fundamental = Math.sin(2 * Math.PI * baseFreq * t);
    const harmonic = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.1;

    // Envelope
    const attack = Math.min(1, t * 20);
    const decay = Math.exp(-t * 1.5);
    const envelope = attack * decay;

    const sample = (fundamental + harmonic) * envelope * 0.8;
    wav.addSample(sample);
  }

  return wav;
}

function generateAcidBass(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 0.8;
  const numSamples = Math.floor(duration * sampleRate);
  const baseFreq = 110; // A2

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Sawtooth wave (rich in harmonics)
    let sawtooth = 0;
    for (let h = 1; h <= 8; h++) {
      sawtooth += Math.sin(2 * Math.PI * baseFreq * h * t) / h;
    }

    // Resonant filter sweep
    const cutoffFreq = 200 + 1500 * Math.exp(-t * 8);
    const resonance = 1 + 3 * Math.exp(-t * 5);

    // Simple filter simulation
    const filtered = sawtooth / resonance;

    // Envelope
    const envelope = Math.exp(-t * 2);

    const sample = filtered * envelope * 0.5;
    wav.addSample(sample);
  }

  return wav;
}

function generateSynthBass(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 0.6;
  const numSamples = Math.floor(duration * sampleRate);
  const baseFreq = 82.4; // E2

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Square wave-ish (odd harmonics)
    let square = 0;
    for (let h = 1; h <= 5; h += 2) {
      square += Math.sin(2 * Math.PI * baseFreq * h * t) / h;
    }

    // Slight PWM effect
    const pwm = Math.sin(2 * Math.PI * 5 * t) * 0.2;

    // Envelope with punch
    const attack = Math.min(1, t * 50);
    const decay = Math.exp(-t * 3);
    const envelope = attack * decay;

    const sample = (square + pwm) * envelope * 0.6;
    wav.addSample(sample);
  }

  return wav;
}

function generateReeseBass(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 1.2;
  const numSamples = Math.floor(duration * sampleRate);
  const baseFreq = 65.4; // C2

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Detuned sawtooth oscillators
    let saw1 = 0, saw2 = 0;
    for (let h = 1; h <= 10; h++) {
      saw1 += Math.sin(2 * Math.PI * baseFreq * h * t) / h;
      saw2 += Math.sin(2 * Math.PI * (baseFreq * 1.01) * h * t) / h;
    }

    // Chorus/detune effect
    const detune = (saw1 + saw2) / 2;

    // Envelope
    const attack = Math.min(1, t * 10);
    const sustain = 0.7 + 0.3 * Math.exp(-t * 2);
    const envelope = attack * sustain;

    const sample = detune * envelope * 0.5;
    wav.addSample(sample);
  }

  return wav;
}

function generateWobbleBass(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 1.0;
  const numSamples = Math.floor(duration * sampleRate);
  const baseFreq = 98; // G2

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Sawtooth
    let sawtooth = 0;
    for (let h = 1; h <= 8; h++) {
      sawtooth += Math.sin(2 * Math.PI * baseFreq * h * t) / h;
    }

    // LFO wobble at 4 Hz
    const lfo = Math.sin(2 * Math.PI * 4 * t);
    const wobble = 0.3 + 0.7 * ((lfo + 1) / 2);

    // Envelope
    const envelope = Math.exp(-t * 1.5);

    const sample = sawtooth * wobble * envelope * 0.6;
    wav.addSample(sample);
  }

  return wav;
}

// ============================================================================
// PHASER/SWEPT EFFECTS
// ============================================================================

function generatePhaser(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 2.0;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Sweeping frequency from 100Hz to 2000Hz
    const sweepRate = 0.5; // Hz
    const freqMin = 100;
    const freqMax = 2000;
    const currentFreq = freqMin + (freqMax - freqMin) * ((Math.sin(2 * Math.PI * sweepRate * t) + 1) / 2);

    // Generate tone at sweeping frequency
    const tone = Math.sin(2 * Math.PI * currentFreq * t);

    // Add harmonics for richness
    const harmonic1 = Math.sin(2 * Math.PI * currentFreq * 2 * t) * 0.3;
    const harmonic2 = Math.sin(2 * Math.PI * currentFreq * 3 * t) * 0.15;

    // Envelope
    const envelope = 0.7 + 0.3 * Math.sin(2 * Math.PI * sweepRate * t);

    const sample = (tone + harmonic1 + harmonic2) * envelope * 0.5;
    wav.addSample(sample);
  }

  return wav;
}

function generateFilterSweep(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 1.5;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // White noise
    const noise = Math.random() * 2 - 1;

    // Sweeping bandpass frequency
    const centerFreq = 200 + 3000 * (t / duration);

    // Simple bandpass simulation using sine modulation
    const modulated = noise * Math.sin(2 * Math.PI * centerFreq * t / 100);

    // Envelope
    const envelope = Math.exp(-t * 1.2);

    const sample = modulated * envelope * 0.6;
    wav.addSample(sample);
  }

  return wav;
}

function generateRiser(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 2.5;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = t / duration;

    // Rising frequency from 50Hz to 1000Hz
    const freq = 50 + 950 * progress;

    // Sawtooth with rising pitch
    let sawtooth = 0;
    for (let h = 1; h <= 5; h++) {
      sawtooth += Math.sin(2 * Math.PI * freq * h * t) / h;
    }

    // Add white noise that increases
    const noise = (Math.random() * 2 - 1) * progress * 0.5;

    // Rising envelope
    const envelope = progress * progress;

    const sample = (sawtooth * 0.7 + noise * 0.3) * envelope * 0.5;
    wav.addSample(sample);
  }

  return wav;
}

// ============================================================================
// SPACE/AMBIENT ELEMENTS
// ============================================================================

function generatePad(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 3.0;
  const numSamples = Math.floor(duration * sampleRate);
  const baseFreq = 220; // A3

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Multiple detuned oscillators
    const osc1 = Math.sin(2 * Math.PI * baseFreq * t);
    const osc2 = Math.sin(2 * Math.PI * baseFreq * 1.005 * t);
    const osc3 = Math.sin(2 * Math.PI * baseFreq * 0.995 * t);
    const osc4 = Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * 0.3; // Fifth

    // Slow LFO for movement
    const lfo = Math.sin(2 * Math.PI * 0.3 * t) * 0.1;

    // Slow attack and release
    const attack = Math.min(1, t * 2);
    const release = Math.min(1, (duration - t) * 2);
    const envelope = attack * release * (0.9 + lfo);

    const sample = (osc1 + osc2 + osc3 + osc4) / 4 * envelope * 0.4;
    wav.addSample(sample);
  }

  return wav;
}

function generateDrone(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 4.0;
  const numSamples = Math.floor(duration * sampleRate);
  const baseFreq = 110; // A2

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Rich harmonic series
    let harmonics = 0;
    for (let h = 1; h <= 8; h++) {
      const amplitude = 1 / h;
      harmonics += Math.sin(2 * Math.PI * baseFreq * h * t) * amplitude;
    }

    // Slow modulation
    const mod = 1 + Math.sin(2 * Math.PI * 0.2 * t) * 0.05;

    // Very slow envelope
    const attack = Math.min(1, t * 0.5);
    const release = Math.min(1, (duration - t) * 0.5);
    const envelope = attack * release;

    const sample = harmonics * mod * envelope * 0.3;
    wav.addSample(sample);
  }

  return wav;
}

function generateLaser(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 0.8;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Dramatic pitch drop from 2000Hz to 50Hz
    const freq = 2000 * Math.exp(-t * 8) + 50;

    // Sine wave
    const tone = Math.sin(2 * Math.PI * freq * t);

    // Fast envelope
    const envelope = Math.exp(-t * 5);

    const sample = tone * envelope * 0.7;
    wav.addSample(sample);
  }

  return wav;
}

function generateZap(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 0.3;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Harsh sawtooth with pitch sweep
    const freq = 500 + 1500 * Math.exp(-t * 15);
    let sawtooth = 0;
    for (let h = 1; h <= 10; h++) {
      sawtooth += Math.sin(2 * Math.PI * freq * h * t) / h;
    }

    // Add noise
    const noise = (Math.random() * 2 - 1) * 0.2;

    // Sharp envelope
    const envelope = Math.exp(-t * 12);

    const sample = (sawtooth + noise) * envelope * 0.6;
    wav.addSample(sample);
  }

  return wav;
}

function generateCosmic(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 3.5;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Multiple slow-moving oscillators
    const freq1 = 150 + 50 * Math.sin(2 * Math.PI * 0.1 * t);
    const freq2 = 200 + 40 * Math.sin(2 * Math.PI * 0.15 * t);
    const freq3 = 180 + 60 * Math.sin(2 * Math.PI * 0.08 * t);

    const osc1 = Math.sin(2 * Math.PI * freq1 * t);
    const osc2 = Math.sin(2 * Math.PI * freq2 * t);
    const osc3 = Math.sin(2 * Math.PI * freq3 * t);

    // Add some filtered noise for texture
    const noise = (Math.random() * 2 - 1) * 0.1 * Math.sin(2 * Math.PI * 100 * t);

    // Slow envelope
    const attack = Math.min(1, t * 1);
    const release = Math.min(1, (duration - t) * 1);
    const envelope = attack * release;

    const sample = (osc1 + osc2 + osc3) / 3 * envelope * 0.4 + noise;
    wav.addSample(sample);
  }

  return wav;
}

function generateSwoosh(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 1.5;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Filtered white noise with sweep
    const noise = Math.random() * 2 - 1;

    // Sweeping filter
    const filterFreq = 5000 + 5000 * Math.sin(2 * Math.PI * t / duration);
    const filtered = noise * Math.sin(2 * Math.PI * filterFreq * t / 1000);

    // Bell curve envelope
    const center = duration / 2;
    const width = duration / 4;
    const envelope = Math.exp(-Math.pow((t - center) / width, 2));

    const sample = filtered * envelope * 0.5;
    wav.addSample(sample);
  }

  return wav;
}

// ============================================================================
// MAIN GENERATION
// ============================================================================

console.log('🎹 Generating Synth WAV samples...\n');

const outputDir = path.join(__dirname, '..', 'public', 'wav');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate samples
const samples = [
  // Bass sounds
  { name: 'bass-sub', generator: () => generateSubBass(), description: 'Sub Bass (55Hz)' },
  { name: 'bass-acid', generator: () => generateAcidBass(), description: 'Acid Bass (110Hz)' },
  { name: 'bass-synth', generator: () => generateSynthBass(), description: 'Synth Bass (82Hz)' },
  { name: 'bass-reese', generator: () => generateReeseBass(), description: 'Reese Bass (65Hz)' },
  { name: 'bass-wobble', generator: () => generateWobbleBass(), description: 'Wobble Bass (98Hz)' },

  // Phaser/Sweep effects
  { name: 'phaser', generator: () => generatePhaser(), description: 'Phaser Sweep' },
  { name: 'filter-sweep', generator: () => generateFilterSweep(), description: 'Filter Sweep' },
  { name: 'riser', generator: () => generateRiser(), description: 'Riser Effect' },

  // Space/Ambient elements
  { name: 'pad', generator: () => generatePad(), description: 'Ambient Pad (220Hz)' },
  { name: 'drone', generator: () => generateDrone(), description: 'Harmonic Drone (110Hz)' },
  { name: 'laser', generator: () => generateLaser(), description: 'Laser Zap' },
  { name: 'zap', generator: () => generateZap(), description: 'Electric Zap' },
  { name: 'cosmic', generator: () => generateCosmic(), description: 'Cosmic Ambience' },
  { name: 'swoosh', generator: () => generateSwoosh(), description: 'Swoosh Effect' },
];

console.log('📦 BASS SOUNDS\n');
samples.slice(0, 5).forEach(({ name, generator, description }) => {
  const wav = generator();
  const filename = path.join(outputDir, `${name}.wav`);
  wav.writeWAV(filename);
  console.log(`   ${description}`);
});

console.log('\n📦 PHASER/SWEEP EFFECTS\n');
samples.slice(5, 8).forEach(({ name, generator, description }) => {
  const wav = generator();
  const filename = path.join(outputDir, `${name}.wav`);
  wav.writeWAV(filename);
  console.log(`   ${description}`);
});

console.log('\n📦 SPACE/AMBIENT ELEMENTS\n');
samples.slice(8).forEach(({ name, generator, description }) => {
  const wav = generator();
  const filename = path.join(outputDir, `${name}.wav`);
  wav.writeWAV(filename);
  console.log(`   ${description}`);
});

console.log(`\n✅ Generated ${samples.length} synth WAV samples in ${outputDir}`);
console.log('📁 Files saved to: /public/wav/\n');
