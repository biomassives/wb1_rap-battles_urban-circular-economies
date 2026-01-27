# Scripts

This directory contains utility scripts for generating WAV audio samples.

## Overview

Two scripts generate all audio samples for the mixer and beat pad:

1. **generate-wav-samples.js** - Generates 808 drum machine samples
2. **generate-synth-samples.js** - Generates bass, phaser, and space music samples

## generate-wav-samples.js

Generates 808 drum machine samples as WAV files.

### Usage

```bash
npm run generate-wav
```

Or:

```bash
node scripts/generate-wav-samples.js
```

### What it does

1. Creates `/public/wav/` directory if it doesn't exist
2. Generates 9 drum samples using Web Audio synthesis:
   - **bd.wav** - 808 Kick Drum (500ms)
   - **sd.wav** - 808 Snare Drum (300ms)
   - **hh.wav** - Closed Hi-Hat (100ms)
   - **oh.wav** - Open Hi-Hat (300ms)
   - **cp.wav** - Hand Clap (150ms)
   - **lt.wav** - Low Tom (400ms)
   - **mt.wav** - Mid Tom (400ms)
   - **ht.wav** - High Tom (400ms)
   - **rim.wav** - Rimshot (80ms)

3. All files are generated as 16-bit PCM WAV at 44.1kHz mono

### Output

Files are saved to: `/public/wav/`

These files are automatically loaded by:
- `/src/pages/mixer.astro`
- `/src/pages/beat-pad.astro`

### Technical Details

The script uses custom WAV file generation without external dependencies:

1. **WAVWriter class**: Constructs proper RIFF/WAVE file format
   - RIFF header
   - fmt chunk (PCM format specification)
   - data chunk (audio samples)

2. **Synthesis functions**: Generate drum sounds using oscillators, envelopes, and noise
   - Kick: Pitch sweep with lowpass
   - Snare: Layered noise + tone
   - Hi-hats: Filtered noise with different decays
   - Clap: Multiple delayed noise bursts
   - Toms: Pitch envelopes with harmonics
   - Rimshot: Sharp high-frequency click

### Adding New Samples

To add new samples:

1. Create a new synthesis function (e.g., `generateCowbell()`)
2. Add it to the `samples` array
3. Run `npm run generate-wav`
4. The new sample will be available at `/wav/[name].wav`

Example:

```javascript
function generateCowbell(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 0.2;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Two tone synthesis for cowbell
    const freq1 = 800;
    const freq2 = 540;
    const tone1 = Math.sin(2 * Math.PI * freq1 * t);
    const tone2 = Math.sin(2 * Math.PI * freq2 * t);

    const envelope = Math.exp(-t * 8);
    const sample = (tone1 + tone2) * envelope * 0.5;

    wav.addSample(sample);
  }

  return wav;
}

// Add to samples array:
{ name: 'cb', generator: () => generateCowbell(), description: 'Cowbell' }
```

### File Format Specification

```
RIFF Header:
  - "RIFF" marker (4 bytes)
  - File size - 8 (4 bytes)
  - "WAVE" marker (4 bytes)

fmt Chunk:
  - "fmt " marker (4 bytes)
  - Chunk size: 16 (4 bytes)
  - Audio format: 1 (PCM) (2 bytes)
  - Channels: 1 (mono) (2 bytes)
  - Sample rate: 44100 (4 bytes)
  - Byte rate: 88200 (4 bytes)
  - Block align: 2 (2 bytes)
  - Bits per sample: 16 (2 bytes)

data Chunk:
  - "data" marker (4 bytes)
  - Data size (4 bytes)
  - Audio samples (16-bit signed integers)
```

### Benefits of Local WAV Files

1. **No external dependencies** - Works offline
2. **Fast loading** - Local files load instantly
3. **Consistent quality** - Same samples every time
4. **Customizable** - Easy to modify synthesis parameters
5. **No CDN issues** - No CORS or rate limiting
6. **Version control** - Samples can be committed to git

### Future Enhancements

- Add 909 drum machine samples
- Add cymbal samples (crash, ride)
- Add percussion samples (tambourine, shaker)
- Add bass and synth sounds
- Support for stereo samples
- Sample variations (multiple kick sounds, etc.)
