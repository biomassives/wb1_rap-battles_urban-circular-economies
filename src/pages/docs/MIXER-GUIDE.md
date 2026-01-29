---
layout: "../../layouts/DocLayout.astro"
title: "MIXER-GUIDE"
---
<div data-pagefind-filter="type:docs"></div>

# DJ Mixer Guide

## Overview

The DJ Mixer (`/mixer`) features two sample banks with crossfader control and real-time waveform visualization.

## Mixer Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         ◢ DJ MIXER ◣                           │
├───────────────┬─────────────────────┬───────────────────────────┤
│  LEFT BANK    │    MASTER SECTION   │      RIGHT BANK          │
│  Space Bass   │                     │   Cosmic Ambience        │
├───────────────┤                     ├───────────────────────────┤
│               │   ┌───────────┐     │                          │
│  [L1][L2][L3] │   │CROSSFADER │     │   [R1][R2][R3]           │
│  [L4][L5][L6] │   │    ═══    │     │   [R4][R5][R6]           │
│  [L7][L8][L9] │   │ L ─── R  │     │   [R7][R8][R9]           │
│               │   └───────────┘     │                          │
│ ┌───────────┐ │                     │  ┌───────────┐           │
│ │ VISUALIZER│ │   PLAY ALL          │  │ VISUALIZER│           │
│ │ [WAVEFORM]│ │   STOP ALL          │  │ [WAVEFORM]│           │
│ └───────────┘ │   SYNC              │  └───────────┘           │
│               │                     │                          │
│  Loaded:      │   BPM: 120          │  Loaded:                 │
│  [Sample Info]│   Master Vol        │  [Sample Info]           │
│               │                     │                          │
│  ▶ PLAY       │   STATUS: READY     │  ▶ PLAY                  │
│  ■ STOP       │                     │  ■ STOP                  │
│  VOL: ████    │                     │  VOL: ████               │
└───────────────┴─────────────────────┴───────────────────────────┘
```

## Left Bank: Space Bass 🎸

**Bass Sounds** (L1-L5)
- **L1: Sub Bass** - Deep 55Hz sub bass, pure and powerful
- **L2: Acid Bass** - TB-303 style acid bass with filter sweep
- **L3: Synth Bass** - Square wave synth bass with PWM
- **L4: Reese Bass** - Detuned thick bass, rich texture
- **L5: Wobble Bass** - Dubstep wobble bass with 4Hz LFO

**Phaser/FX** (L6-L8)
- **L6: Phaser** - 100Hz-2000Hz frequency sweep
- **L7: Filter Sweep** - Bandpass filter sweep effect
- **L8: Riser** - Tension build-up, 50Hz-1000Hz rise

**Effects** (L9)
- **L9: Laser Zap** - Sci-fi laser effect, dramatic pitch drop

## Right Bank: Cosmic Ambience 🌌

**Ambient** (R1-R3)
- **R1: Pad** - Warm ambient pad, detuned oscillators
- **R2: Drone** - Harmonic drone, 8 harmonics at 110Hz
- **R3: Cosmic** - Evolving cosmic texture, slow movement

**FX** (R4-R5)
- **R4: Swoosh** - Whoosh transition effect
- **R5: Zap** - Electric zap, harsh sawtooth burst

**Drums** (R6-R9)
- **R6: 808 Groove** - Classic `bd hh sd hh` pattern
- **R7: Boom Bap** - Hip-hop `bd cp bd cp` pattern
- **R8: Hi-Hats** - Hi-hat pattern `hh hh oh hh`
- **R9: Tom Rolls** - Tom rolls `lt mt ht lt`

## Crossfader

The prominent center crossfader controls the mix between left and right banks:

```
LEFT ◀════════╪════════▶ RIGHT
            CENTER
```

- **Full Left (0)**: Only left bank audible
- **Center (50)**: Both banks at equal volume
- **Full Right (100)**: Only right bank audible

Position indicator shows: **LEFT** | **CENTER** | **RIGHT**

## Waveform Visualizers

Each bank has a real-time frequency analyzer:

**Left Bank Visualizer** (Green)
- Shows frequency spectrum 0-5kHz
- Green color scheme (hue 120-180)
- Active when left bank is playing

**Right Bank Visualizer** (Magenta)
- Shows frequency spectrum 0-5kHz
- Magenta color scheme (hue 280-340)
- Active when right bank is playing

Visualizers display:
- Frequency bars (64 bins)
- Peak level line
- Idle sine wave when not playing

## Controls

### Per-Bank Controls
- **PLAY** - Start playing loaded sample
- **STOP** - Stop playback
- **VOLUME** - Adjust bank volume (0-100)
- **METER** - Visual level meter

### Master Controls
- **PLAY ALL** - Play both banks simultaneously
- **STOP ALL** - Stop all playback
- **SYNC** - Re-sync both banks
- **BPM** - Master tempo (60-200)
- **MASTER** - Master volume (0-100)

### Sample Selection
Click any sample pad (L1-L9 or R1-R9) to load it. The active pad will highlight with a bright glow.

## Sample Info Display

When a sample is loaded, the info panel shows:
```
LOADED:
[Sample Name]
Pattern: s("sample-name")
BPM: 120
```

## Usage Examples

### Basic DJ Mix
1. Load **L1: Sub Bass** on left bank
2. Load **R1: Pad** on right bank
3. Set crossfader to **CENTER**
4. Click **PLAY ALL**
5. Move crossfader to blend

### Build-Up Effect
1. Load **L8: Riser** on left bank
2. Load **R6: 808 Groove** on right bank
3. Set crossfader to **LEFT**
4. Play left bank (riser builds)
5. At peak, quickly move crossfader to **RIGHT**
6. Drums drop in

### Ambient Mix
1. Load **R2: Drone** on right bank
2. Load **R3: Cosmic** on right bank (will replace drone)
3. Play right bank
4. Layer with **L1: Sub Bass** on left
5. Use crossfader to blend

### Wobble Drop
1. Load **L5: Wobble Bass** on left
2. Load **R6: 808 Groove** on right
3. Play both simultaneously
4. Crossfader at center
5. Wobble bass + drums = dubstep vibes

## Keyboard Shortcuts

*Currently controlled via mouse/touch only*

Future shortcuts planned:
- Space: Play/Pause
- Left/Right Arrow: Crossfader
- 1-9: Load left bank samples
- Shift+1-9: Load right bank samples

## Sample Details

### Audio Format
- **Sample Rate**: 44.1kHz
- **Bit Depth**: 16-bit
- **Channels**: Mono
- **Format**: WAV (uncompressed)

### Loading
All samples preload on page load for instant playback. Console shows:
```
🎵 Initializing Strudel player for mixer...
📁 Loading samples from /wav/
📦 Preloading samples...
  ✅ BD: /wav/bd.wav
  ✅ BASS-SUB: /wav/bass-sub.wav
  ...
✅ Loaded 23/23 samples
```

## Technical Details

### Audio Chain
```
Left Bank → Left Gain → Left Analyzer → Master Gain → Output
Right Bank → Right Gain → Right Analyzer → Master Gain → Output
```

### Crossfader Algorithm
```javascript
leftGain = (100 - position) / 100
rightGain = position / 100

leftOutput = leftVolume * leftGain * masterVolume
rightOutput = rightVolume * rightGain * masterVolume
```

### Visualization
- FFT Size: 128
- Smoothing: 0.8
- Update Rate: 60fps (requestAnimationFrame)
- Frequency Range: 0-22.05kHz (Nyquist)

## Tips & Tricks

1. **Smooth Transitions**: Move crossfader slowly for gradual blends
2. **Quick Cuts**: Snap crossfader for instant switches
3. **Layering**: Use center position to layer bass + drums
4. **Build-Ups**: Use risers on left, drop on right
5. **Ambient Beds**: Layer pad + drone for thick atmosphere
6. **Rhythm Sync**: Use SYNC button to re-align patterns
7. **Volume Balance**: Adjust individual volumes before crossfading
8. **Effect Sweeps**: Phaser and filter-sweep work great as transitions

## Sample Synthesis

All samples are locally generated using pure JavaScript synthesis:

- **Bass**: Sawtooth/square waves with envelopes
- **Pads**: Detuned oscillators with slow LFO
- **Drums**: Pitch sweeps + noise layers
- **FX**: Frequency sweeps and filtered noise

See `SAMPLES.md` for full synthesis details.

## File Locations

- **Mixer**: `/src/pages/mixer.astro`
- **Samples**: `/public/wav/*.wav`
- **Banks**: `/public/data/mixer-banks.json`
- **Generator**: `/scripts/generate-synth-samples.js`

## Related Pages

- **Beat Pad**: `/beat-pad` - 16-pad sampler
- **Sampler**: `/sampler` - Full sequencer
- **Audio Remix Lab**: `/audio-remix-lab` - Advanced tools

## Regenerating Samples

To regenerate all samples:

```bash
npm run generate-all-samples
```

This creates fresh WAV files from synthesis code.
