# WAV Samples

This directory contains locally-generated WAV files used by the mixer and beat pad.

## Sample List

### Drums (808 Machine)

| File | Description | Duration | Format |
|------|-------------|----------|--------|
| `bd.wav` | 808 Kick Drum | 500ms | 16-bit 44.1kHz WAV |
| `sd.wav` | 808 Snare Drum | 300ms | 16-bit 44.1kHz WAV |
| `hh.wav` | Closed Hi-Hat | 100ms | 16-bit 44.1kHz WAV |
| `oh.wav` | Open Hi-Hat | 300ms | 16-bit 44.1kHz WAV |
| `cp.wav` | Hand Clap | 150ms | 16-bit 44.1kHz WAV |
| `lt.wav` | Low Tom | 400ms | 16-bit 44.1kHz WAV |
| `mt.wav` | Mid Tom | 400ms | 16-bit 44.1kHz WAV |
| `ht.wav` | High Tom | 400ms | 16-bit 44.1kHz WAV |
| `rim.wav` | Rimshot | 80ms | 16-bit 44.1kHz WAV |

### Bass Sounds

| File | Description | Duration | Format |
|------|-------------|----------|--------|
| `bass-sub.wav` | Sub Bass (55Hz) | 1000ms | 16-bit 44.1kHz WAV |
| `bass-acid.wav` | Acid Bass (110Hz) | 800ms | 16-bit 44.1kHz WAV |
| `bass-synth.wav` | Synth Bass (82Hz) | 600ms | 16-bit 44.1kHz WAV |
| `bass-reese.wav` | Reese Bass (65Hz) | 1200ms | 16-bit 44.1kHz WAV |
| `bass-wobble.wav` | Wobble Bass (98Hz) | 1000ms | 16-bit 44.1kHz WAV |

### Phaser & Effects

| File | Description | Duration | Format |
|------|-------------|----------|--------|
| `phaser.wav` | Phaser Sweep | 2000ms | 16-bit 44.1kHz WAV |
| `filter-sweep.wav` | Filter Sweep | 1500ms | 16-bit 44.1kHz WAV |
| `riser.wav` | Riser Effect | 2500ms | 16-bit 44.1kHz WAV |

### Space & Ambient

| File | Description | Duration | Format |
|------|-------------|----------|--------|
| `pad.wav` | Ambient Pad (220Hz) | 3000ms | 16-bit 44.1kHz WAV |
| `drone.wav` | Harmonic Drone (110Hz) | 4000ms | 16-bit 44.1kHz WAV |
| `laser.wav` | Laser Zap | 800ms | 16-bit 44.1kHz WAV |
| `zap.wav` | Electric Zap | 300ms | 16-bit 44.1kHz WAV |
| `cosmic.wav` | Cosmic Ambience | 3500ms | 16-bit 44.1kHz WAV |
| `swoosh.wav` | Swoosh Effect | 1500ms | 16-bit 44.1kHz WAV |

## Regenerating Samples

To regenerate all WAV samples, run:

```bash
npm run generate-all-samples
```

Or individually:

```bash
npm run generate-wav       # Drums only
npm run generate-synth     # Bass/FX/Ambient
```

Or directly:

```bash
node scripts/generate-wav-samples.js    # Drums
node scripts/generate-synth-samples.js  # Bass/FX/Ambient
```

## Synthesis Details

All samples are synthesized using Web Audio API techniques:

### Drums

**Kick Drum (bd)**
- Pitch envelope: 150Hz → 40Hz
- Exponential decay
- Sine wave oscillator

**Snare Drum (sd)**
- White noise component (snare wires)
- 180Hz tone component (drum body)
- Layered with different decay rates

**Hi-Hats (hh, oh)**
- High-frequency filtered noise
- Fast decay for closed (100ms)
- Slower decay for open (300ms)

**Clap (cp)**
- Three layered noise bursts
- 10ms and 20ms delays
- Creates realistic hand clap flutter

**Toms (lt, mt, ht)**
- Pitch envelopes with harmonics
- Different base frequencies: 80Hz, 120Hz, 180Hz
- Resonant character

**Rimshot (rim)**
- Sharp 2kHz click
- Very fast decay (80ms)
- Percussive attack

### Bass Sounds

**Sub Bass (bass-sub)**
- Deep sine wave at 55Hz (A1)
- Subtle 2nd harmonic
- Slow attack and decay

**Acid Bass (bass-acid)**
- Sawtooth wave at 110Hz (A2)
- Resonant filter sweep
- Classic TB-303 style

**Synth Bass (bass-synth)**
- Square wave at 82Hz (E2)
- Pulse width modulation
- Punchy envelope

**Reese Bass (bass-reese)**
- Detuned sawtooth oscillators at 65Hz (C2)
- Chorus/detune effect
- Rich and thick texture

**Wobble Bass (bass-wobble)**
- Sawtooth at 98Hz (G2)
- 4Hz LFO modulation
- Dubstep-style wobble

### Phaser & Effects

**Phaser (phaser)**
- Sweeping frequency 100Hz-2000Hz
- 0.5Hz sweep rate
- Harmonics for richness

**Filter Sweep (filter-sweep)**
- Filtered white noise
- Bandpass sweep 200Hz-3200Hz
- Progressive sweep

**Riser (riser)**
- Rising pitch 50Hz-1000Hz
- Mixed with rising noise
- Build-up tension effect

### Space & Ambient

**Ambient Pad (pad)**
- Multiple detuned oscillators at 220Hz (A3)
- Slow LFO movement
- Smooth attack/release

**Harmonic Drone (drone)**
- Rich harmonic series at 110Hz (A2)
- 8 harmonics
- Slow modulation

**Laser Zap (laser)**
- Dramatic pitch drop 2000Hz→50Hz
- Fast envelope
- Sci-fi laser effect

**Electric Zap (zap)**
- Harsh sawtooth 500Hz-2000Hz
- Mixed with noise
- Sharp attack

**Cosmic Ambience (cosmic)**
- Three slow-moving oscillators
- Filtered noise texture
- Evolving harmonies

**Swoosh Effect (swoosh)**
- Filtered white noise
- Bell curve envelope
- Sweeping filter movement

## Usage in Code

The mixer and beat pad automatically load these samples:

```javascript
const sampleUrls = {
  bd: '/wav/bd.wav',
  sd: '/wav/sd.wav',
  hh: '/wav/hh.wav',
  oh: '/wav/oh.wav',
  cp: '/wav/cp.wav',
  lt: '/wav/lt.wav',
  mt: '/wav/mt.wav',
  ht: '/wav/ht.wav',
  rim: '/wav/rim.wav',
};
```

Samples are loaded into Web Audio buffers and cached for performance.

## License

These samples are procedurally generated and free to use.
