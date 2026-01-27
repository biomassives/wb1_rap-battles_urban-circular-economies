# Audio Sample Generation

This project uses locally-generated WAV samples for all audio playback in the mixer and beat pad.

## Quick Start

Generate all samples:

```bash
npm run generate-all-samples
```

This creates 23 WAV files in `/public/wav/` totaling ~2.3MB.

## Sample Categories

### 🥁 Drums (9 samples)
Classic 808 drum machine sounds:
- **bd** - Kick drum with pitch sweep
- **sd** - Snare with noise + tone layers
- **hh** - Closed hi-hat (fast decay)
- **oh** - Open hi-hat (slow decay)
- **cp** - Hand clap (triple burst)
- **lt/mt/ht** - Low/mid/high toms
- **rim** - Rimshot click

### 🎸 Bass (5 samples)
Electronic bass sounds:
- **bass-sub** - Deep sub bass (55Hz)
- **bass-acid** - TB-303 style acid bass
- **bass-synth** - Square wave synth bass
- **bass-reese** - Detuned Reese bass
- **bass-wobble** - Dubstep wobble bass

### 🌀 Phaser/FX (3 samples)
Sweep and build effects:
- **phaser** - Frequency sweep effect
- **filter-sweep** - Bandpass filter sweep
- **riser** - Tension build-up effect

### 🌌 Space/Ambient (6 samples)
Atmospheric and sci-fi sounds:
- **pad** - Warm ambient pad
- **drone** - Harmonic drone
- **laser** - Laser zap effect
- **zap** - Electric zap
- **cosmic** - Evolving cosmic texture
- **swoosh** - Whoosh transition

## NPM Scripts

```bash
# Generate everything (recommended)
npm run generate-all-samples

# Generate specific categories
npm run generate-wav      # Drums only
npm run generate-synth    # Bass/FX/Ambient only
```

## Direct Execution

```bash
# Drums
node scripts/generate-wav-samples.js

# Bass/FX/Ambient
node scripts/generate-synth-samples.js
```

## How It Works

Both scripts use a custom WAV writer that:

1. **Synthesizes audio** using mathematical functions (oscillators, noise, envelopes)
2. **Generates samples** at 44.1kHz, 16-bit mono
3. **Writes WAV files** with proper RIFF/WAVE format
4. **No dependencies** - uses only Node.js built-ins

### Example: Kick Drum Synthesis

```javascript
// Pitch envelope: 150Hz → 40Hz
const pitchEnv = 150 * Math.exp(-t * 8) + 40;

// Sine wave at sweeping frequency
const sample = Math.sin(2 * Math.PI * pitchEnv * t);

// Apply amplitude envelope
const envelope = Math.exp(-t * 5);
const output = sample * envelope;
```

## File Format

All samples use standard WAV format:

```
Format:       PCM (uncompressed)
Sample Rate:  44100 Hz
Bit Depth:    16-bit
Channels:     1 (mono)
Byte Order:   Little-endian
```

## Usage in Code

Samples are automatically loaded by the mixer and beat pad:

```javascript
// In mixer.astro and beat-pad.astro
const sampleUrls = {
  // Drums
  bd: '/wav/bd.wav',
  sd: '/wav/sd.wav',

  // Bass
  'bass-sub': '/wav/bass-sub.wav',
  'bass-acid': '/wav/bass-acid.wav',

  // FX
  'phaser': '/wav/phaser.wav',

  // Ambient
  'pad': '/wav/pad.wav',
  'drone': '/wav/drone.wav',
  // ...
};
```

## Synthesis Techniques

### Drums
- **Kick**: Pitch sweep with sine wave
- **Snare**: White noise + tonal body
- **Hi-hats**: Filtered noise
- **Clap**: Delayed noise bursts
- **Toms**: Pitched resonance

### Bass
- **Sub**: Pure sine wave + harmonic
- **Acid**: Sawtooth + resonant filter
- **Synth**: Square wave + PWM
- **Reese**: Detuned oscillators
- **Wobble**: LFO-modulated sawtooth

### FX
- **Phaser**: Frequency sweeps
- **Filter Sweep**: Noise through bandpass
- **Riser**: Rising pitch + noise

### Ambient
- **Pad**: Detuned oscillators
- **Drone**: Harmonic series
- **Laser/Zap**: Pitch drops
- **Cosmic**: Slow-moving tones
- **Swoosh**: Filtered noise

## File Sizes

| Category | Files | Total Size |
|----------|-------|------------|
| Drums | 9 | ~244 KB |
| Bass | 5 | ~399 KB |
| FX | 3 | ~519 KB |
| Ambient | 6 | ~1.2 MB |
| **Total** | **23** | **~2.3 MB** |

## Benefits

✅ **No external dependencies** - Works offline
✅ **Fast loading** - Local files load instantly
✅ **No CDN issues** - No CORS or rate limiting
✅ **Customizable** - Easy to modify synthesis
✅ **Version control** - Can commit to git
✅ **High quality** - Uncompressed WAV format
✅ **Cross-platform** - Pure JavaScript synthesis

## Adding New Samples

To add a new sample:

1. Create synthesis function in appropriate script:

```javascript
function generateMySample(sampleRate = 44100) {
  const wav = new WAVWriter(sampleRate);
  const duration = 1.0;
  const numSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Your synthesis here
    const sample = Math.sin(2 * Math.PI * 440 * t);

    wav.addSample(sample);
  }

  return wav;
}
```

2. Add to samples array:

```javascript
{
  name: 'my-sample',
  generator: () => generateMySample(),
  description: 'My Custom Sample'
}
```

3. Regenerate:

```bash
npm run generate-synth  # or generate-wav
```

4. Use in code:

```javascript
const sampleUrls = {
  'my-sample': '/wav/my-sample.wav',
};
```

## Technical Notes

- Sample rate locked at 44.1kHz (CD quality)
- All samples are mono (easier to pan/position)
- 16-bit depth is sufficient for drum/synth sounds
- Uncompressed WAV ensures no artifacts
- Files are small enough for git commits

## Future Enhancements

Potential additions:
- 909 drum machine sounds
- Cymbal samples (crash, ride, splash)
- Percussion (tambourine, shaker, cowbell)
- More bass variations
- Melody/chord samples
- Vocal samples
- Stereo samples for ambience
- Sample variations/round-robin

## License

All generated samples are procedurally synthesized and free to use.
