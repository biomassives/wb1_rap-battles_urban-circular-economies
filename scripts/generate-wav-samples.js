#!/usr/bin/env node

/**
 * WAV Sample Generator
 * Generates drum samples as WAV files for the mixer
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

// Synthesis functions
function generateKick(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 0.5; // 500ms
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Pitch envelope: 150Hz -> 40Hz
    const pitchEnv = 150 * Math.exp(-t * 8) + 40;

    // Amplitude envelope
    const ampEnv = Math.exp(-t * 5);

    // Oscillator
    const phase = 2 * Math.PI * pitchEnv * t;
    const sample = Math.sin(phase) * ampEnv * 0.8;

    wav.addSample(sample);
  }

  return wav;
}

function generateSnare(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 0.3;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Noise component (snare wires)
    const noise = (Math.random() * 2 - 1);
    const noiseEnv = Math.exp(-t * 20);

    // Tone component (drum body)
    const tone = Math.sin(2 * Math.PI * 180 * t);
    const toneEnv = Math.exp(-t * 15);

    const sample = (noise * noiseEnv * 0.7 + tone * toneEnv * 0.3);

    wav.addSample(sample);
  }

  return wav;
}

function generateHiHat(sampleRate = 44100, open = false) {
  const wav = new WAVWriter(sampleRate);
  const duration = open ? 0.3 : 0.1;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // High-frequency noise
    const noise = (Math.random() * 2 - 1);

    // Envelope
    const decay = open ? 8 : 40;
    const envelope = Math.exp(-t * decay);

    const sample = noise * envelope * 0.5;

    wav.addSample(sample);
  }

  return wav;
}

function generateClap(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 0.15;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Layered noise bursts
    let sample = 0;
    const delays = [0, 0.01, 0.02];

    for (const delay of delays) {
      if (t >= delay) {
        const localT = t - delay;
        const noise = (Math.random() * 2 - 1);
        const envelope = Math.exp(-localT * 30);
        sample += noise * envelope;
      }
    }

    wav.addSample(sample * 0.3);
  }

  return wav;
}

function generateTom(sampleRate = 44100, pitch = 100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 0.4;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Pitch envelope
    const pitchEnv = pitch * Math.exp(-t * 4) + pitch * 0.5;

    // Amplitude envelope
    const ampEnv = Math.exp(-t * 6);

    // Oscillator with slight harmonics
    const phase = 2 * Math.PI * pitchEnv * t;
    const sample = (Math.sin(phase) + 0.3 * Math.sin(2 * phase)) * ampEnv * 0.7;

    wav.addSample(sample);
  }

  return wav;
}

function generateRimshot(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 0.08;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Sharp click with high frequency
    const tone = Math.sin(2 * Math.PI * 2000 * t);
    const envelope = Math.exp(-t * 60);

    const sample = tone * envelope * 0.6;

    wav.addSample(sample);
  }

  return wav;
}

// Main generation
console.log('🎵 Generating WAV samples...\n');

const outputDir = path.join(__dirname, '..', 'public', 'wav');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate samples
const samples = [
  { name: 'bd', generator: () => generateKick(), description: '808 Kick Drum' },
  { name: 'sd', generator: () => generateSnare(), description: '808 Snare Drum' },
  { name: 'hh', generator: () => generateHiHat(44100, false), description: 'Closed Hi-Hat' },
  { name: 'oh', generator: () => generateHiHat(44100, true), description: 'Open Hi-Hat' },
  { name: 'cp', generator: () => generateClap(), description: 'Hand Clap' },
  { name: 'lt', generator: () => generateTom(44100, 80), description: 'Low Tom' },
  { name: 'mt', generator: () => generateTom(44100, 120), description: 'Mid Tom' },
  { name: 'ht', generator: () => generateTom(44100, 180), description: 'High Tom' },
  { name: 'rim', generator: () => generateRimshot(), description: 'Rimshot' },
];

samples.forEach(({ name, generator, description }) => {
  const wav = generator();
  const filename = path.join(outputDir, `${name}.wav`);
  wav.writeWAV(filename);
  console.log(`   ${description}`);
});

console.log(`\n✅ Generated ${samples.length} WAV samples in ${outputDir}`);
console.log('📁 Files saved to: /public/wav/\n');
