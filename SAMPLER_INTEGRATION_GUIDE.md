# Enhanced Sampler Integration Guide

## Overview

The Enhanced Sampler Manager provides comprehensive audio sampling capabilities with sound adjustment, save/load functionality, microphone recording, and seamless integration with Battle and Jam interfaces.

## Features

### 1. Sound Adjustment Controls ✅
- **Volume**: 0-200% (0-2.0)
- **Pitch**: ±12 semitones
- **Playback Rate**: 0.25x to 4x speed
- **Filters**: Low-pass, High-pass, Band-pass with frequency and Q controls
- **ADSR Envelope**: Attack, Decay, Sustain, Release controls
- **Loop Toggle**: Enable/disable sample looping

### 2. Save/Load Banks ✅
- Save complete pad configurations
- Load saved banks instantly
- Delete unwanted banks
- Persistent storage via localStorage
- Export/import capability

### 3. Microphone Recording ✅
- Record audio directly from microphone
- Save recordings to pad slots
- Multiple recording management
- WebRTC audio stream handling

### 4. Integration API ✅
- Export samples for Battle interface
- Export samples for Jam sessions
- Import from external sources
- Real-time state synchronization

---

## Quick Start

### 1. Include the Enhanced Sampler Manager

```html
<!-- In your page -->
<script src="/scripts/enhanced-sampler-manager.js"></script>
```

### 2. Initialize the Sampler

```javascript
// The sampler auto-initializes and is available globally
const sampler = window.enhancedSamplerManager;

// Or manually initialize
await sampler.init();
```

### 3. Load Samples

```javascript
// From URL
await sampler.loadSampleToPad(0, '/sounds/kick.wav');

// From File Upload
const fileInput = document.querySelector('#file-input');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  await sampler.loadSampleToPad(0, file);
});
```

### 4. Play Samples

```javascript
// Basic playback
sampler.playSample(0);

// With velocity control
sampler.playSample(0, { velocity: 0.8 });
```

---

## Sound Adjustment API

### Volume Control

```javascript
// Set pad volume (0-2.0)
sampler.setPadVolume(0, 1.5); // 150%

// Set master volume
sampler.setMasterVolume(0.8); // 80%
```

### Pitch Shifting

```javascript
// Shift pitch by semitones (-12 to +12)
sampler.setPadPitch(0, 5); // Up 5 semitones
sampler.setPadPitch(1, -3); // Down 3 semitones
```

### Playback Rate

```javascript
// Change playback speed (0.25x to 4x)
sampler.setPadPlaybackRate(0, 2.0); // Double speed
sampler.setPadPlaybackRate(1, 0.5); // Half speed
```

### Filters

```javascript
// Apply low-pass filter
sampler.setPadFilter(
  0,               // pad index
  'lowpass',       // type: 'lowpass', 'highpass', 'bandpass', 'none'
  800,             // frequency (Hz)
  5                // Q (resonance)
);

// Remove filter
sampler.setPadFilter(0, 'none', 1000, 1);
```

### ADSR Envelope

```javascript
// Set envelope parameters
sampler.setPadEnvelope(0, {
  attack: 0.05,   // 50ms fade in
  decay: 0.2,     // 200ms decay
  sustain: 0.7,   // 70% sustain level
  release: 0.5    // 500ms fade out
});
```

### Loop Control

```javascript
// Enable looping
sampler.setPadLoop(0, true);

// Disable looping
sampler.setPadLoop(0, false);
```

---

## Save/Load Banks

### Save Current Configuration

```javascript
// Save all pad settings
sampler.saveBank('My Hip Hop Kit');

// Returns saved bank object
```

### Load Saved Bank

```javascript
// Load by name
await sampler.loadBank('My Hip Hop Kit');

// All pads will be restored with their samples and settings
```

### Manage Banks

```javascript
// Get list of saved banks
const banks = sampler.getBankList();
// Returns: [{ name: 'Bank Name', timestamp: 1234567890 }, ...]

// Delete a bank
sampler.deleteBank('Old Kit');
```

---

## Microphone Recording

### Start Recording

```javascript
// Request microphone access and start recording
try {
  await sampler.startRecording();
  console.log('Recording started');
} catch (error) {
  console.error('Microphone access denied:', error);
}
```

### Stop Recording

```javascript
// Stop recording and save
sampler.stopRecording();

// Recording is automatically added to recordedSamples array
// Event 'sampler:recordingComplete' is dispatched
```

### Load Recording to Pad

```javascript
// Listen for recording completion
window.addEventListener('sampler:recordingComplete', async (e) => {
  const { recording, index } = e.detail;

  // Load to a pad
  await sampler.loadRecordingToPad(index, 0);

  console.log('Recording loaded to pad 0');
});
```

### Manual Recording Management

```javascript
// Access recorded samples
const recordings = sampler.recordedSamples;

// Load specific recording
await sampler.loadRecordingToPad(0, 5); // Recording 0 → Pad 5
```

---

## Integration with Battle Interface

### Export Samples for Battle

```javascript
// Export all loaded samples
const samples = sampler.exportSamplesForBattle();

/* Returns array:
[
  {
    index: 0,
    name: 'Kick Drum',
    hasBuffer: true,
    url: '/sounds/kick.wav',
    settings: {
      volume: 1.0,
      pitch: 0,
      playbackRate: 1.0,
      loop: false,
      filterType: 'none',
      filterFrequency: 1000,
      filterQ: 1,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 }
    }
  },
  // ... more samples
]
*/

// Send to battle interface
window.dispatchEvent(new CustomEvent('sampler:exportedForBattle', {
  detail: { samples }
}));
```

### Battle Interface Implementation

```javascript
// In your battle interface
window.addEventListener('sampler:exportedForBattle', (e) => {
  const { samples } = e.detail;

  console.log(`Loaded ${samples.length} samples for battle`);

  // Make samples available in battle UI
  samples.forEach(sample => {
    addSampleToBattleInterface(sample);
  });
});

function addSampleToBattleInterface(sample) {
  // Create button to trigger sample during battle
  const btn = document.createElement('button');
  btn.textContent = sample.name;
  btn.onclick = () => {
    window.enhancedSamplerManager.playSample(sample.index);
  };

  document.getElementById('battle-samples').appendChild(btn);
}
```

### Trigger Samples During Battle

```javascript
// In battle freestyle mode
document.addEventListener('keypress', (e) => {
  const keyMap = {
    '1': 0, '2': 1, '3': 2, '4': 3,
    'q': 4, 'w': 5, 'e': 6, 'r': 7,
    'a': 8, 's': 9, 'd': 10, 'f': 11,
    'z': 12, 'x': 13, 'c': 14, 'v': 15
  };

  const padIndex = keyMap[e.key.toLowerCase()];
  if (padIndex !== undefined) {
    window.enhancedSamplerManager.playSample(padIndex, { velocity: 0.9 });
  }
});
```

---

## Integration with Reggae Jam Session

### Export for Jam

```javascript
// Export complete bank for jam
const jamData = sampler.exportSamplesForJam();

/* Returns:
{
  samples: [ ... ],
  bankName: 'default',
  exportedAt: 1234567890
}
*/

// Send to jam session
window.dispatchEvent(new CustomEvent('sampler:exportedForJam', {
  detail: jamData
}));
```

### Jam Session Implementation

```javascript
// In reggae jam interface
window.addEventListener('sampler:exportedForJam', (e) => {
  const { samples, bankName } = e.detail;

  console.log(`Loaded bank "${bankName}" with ${samples.length} samples for jam`);

  // Initialize jam pads
  initializeJamPads(samples);
});

function initializeJamPads(samples) {
  const jamGrid = document.getElementById('jam-grid');

  samples.forEach((sample, index) => {
    const pad = document.createElement('div');
    pad.className = 'jam-pad';
    pad.textContent = sample.name;

    // Touch/click to trigger
    pad.addEventListener('mousedown', () => {
      window.enhancedSamplerManager.playSample(sample.index);
      pad.classList.add('active');
    });

    pad.addEventListener('mouseup', () => {
      pad.classList.remove('active');
    });

    jamGrid.appendChild(pad);
  });
}
```

### Jam Session with Loop Synchronization

```javascript
// Sync samples to BPM
class JamSessionManager {
  constructor(bpm = 120) {
    this.bpm = bpm;
    this.beatInterval = (60 / bpm) * 1000; // ms per beat
    this.sampler = window.enhancedSamplerManager;
  }

  scheduleLoop(padIndex, beatPattern) {
    // beatPattern: [1, 0, 1, 0] (play on beats 1 and 3)
    let currentBeat = 0;

    setInterval(() => {
      if (beatPattern[currentBeat % beatPattern.length]) {
        this.sampler.playSample(padIndex);
      }
      currentBeat++;
    }, this.beatInterval);
  }

  playOnBeat(padIndex) {
    // Quantize to nearest beat
    const now = Date.now();
    const nextBeat = Math.ceil(now / this.beatInterval) * this.beatInterval;
    const delay = nextBeat - now;

    setTimeout(() => {
      this.sampler.playSample(padIndex);
    }, delay);
  }
}

// Usage in jam session
const jam = new JamSessionManager(90); // 90 BPM reggae

// Schedule kick on beats 1 and 3
jam.scheduleLoop(0, [1, 0, 1, 0]);

// Schedule snare on beats 2 and 4
jam.scheduleLoop(1, [0, 1, 0, 1]);
```

---

## Event System

### Listen for Sampler Events

```javascript
// Pad updated
window.addEventListener('sampler:padUpdated', (e) => {
  const { padIndex, pad } = e.detail;
  console.log(`Pad ${padIndex} updated:`, pad);
});

// Bank loaded
window.addEventListener('sampler:bankLoaded', (e) => {
  const { bankName, bank } = e.detail;
  console.log(`Bank loaded: ${bankName}`);
});

// Recording complete
window.addEventListener('sampler:recordingComplete', (e) => {
  const { recording, index } = e.detail;
  console.log('New recording available:', recording);
});
```

### Trigger Sampler Actions via Events

```javascript
// Load bank via event
window.dispatchEvent(new CustomEvent('sampler:loadBank', {
  detail: { bankName: 'My Kit' }
}));

// Export for battle via event
window.dispatchEvent(new CustomEvent('sampler:exportForBattle'));
```

---

## Get Current State

```javascript
// Get complete sampler state
const state = sampler.getCurrentState();

/* Returns:
{
  pads: [
    { index: 0, loaded: true, name: 'Kick', settings: {...} },
    // ... 16 pads
  ],
  masterVolume: 1.0,
  currentBank: 'default'
}
*/
```

---

## Advanced Usage Examples

### Create Custom Preset

```javascript
// Set up a hip-hop drum kit
async function setupHipHopKit() {
  await sampler.loadSampleToPad(0, '/sounds/kicks/808-kick.wav');
  sampler.setPadVolume(0, 1.2);
  sampler.setPadPitch(0, -2);

  await sampler.loadSampleToPad(1, '/sounds/snares/clap.wav');
  sampler.setPadFilter(1, 'highpass', 200, 1);

  await sampler.loadSampleToPad(2, '/sounds/hihats/closed-hat.wav');
  sampler.setPadEnvelope(2, { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 });

  // Save the kit
  sampler.saveBank('Hip Hop Starter Kit');
}
```

### Dynamic Pad Assignment

```javascript
// Automatically assign samples to pads
async function loadSamplePack(urls) {
  for (let i = 0; i < urls.length && i < 16; i++) {
    await sampler.loadSampleToPad(i, urls[i]);
  }
}

const sampleUrls = [
  '/sounds/kick.wav',
  '/sounds/snare.wav',
  '/sounds/hat.wav',
  // ... up to 16 samples
];

await loadSamplePack(sampleUrls);
```

### Real-time Filter Automation

```javascript
// Animate filter frequency
function animateFilter(padIndex, startFreq, endFreq, duration) {
  const start = Date.now();
  const interval = setInterval(() => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);

    const currentFreq = startFreq + (endFreq - startFreq) * progress;
    sampler.setPadFilter(padIndex, 'lowpass', currentFreq, 5);

    if (progress >= 1) clearInterval(interval);
  }, 50);
}

// Usage: sweep from 200Hz to 2000Hz over 2 seconds
animateFilter(0, 200, 2000, 2000);
```

---

## UI Component Usage

### Add Sampler Controls to Your Page

```astro
---
import SamplerControls from '../components/SamplerControls.astro';
---

<div class="music-page">
  <!-- Your sampler pads -->
  <div id="sampler-pads">
    <!-- 16 pads -->
  </div>

  <!-- Add controls panel -->
  <SamplerControls />
</div>

<!-- Include the manager -->
<script src="/scripts/enhanced-sampler-manager.js"></script>
```

---

## Troubleshooting

### Common Issues

**Samples not loading:**
- Check CORS headers for remote URLs
- Verify file format (WAV, MP3, OGG supported)
- Check browser console for errors

**Audio not playing:**
- Click anywhere on page first (browsers require user interaction)
- Check audio context state: `sampler.audioContext.state`
- Resume if suspended: `await sampler.audioContext.resume()`

**Microphone not working:**
- Check browser permissions
- Use HTTPS (required for getUserMedia)
- Handle promise rejection for denied access

**Banks not saving:**
- Check localStorage quota (5-10MB typical)
- Clear old data if needed
- Use export/import for large banks

---

## Best Practices

1. **Initialize Early**: Load samples during page load, not on first play
2. **Preload Samples**: Use `loadSampleToPad()` before user interaction
3. **Save Frequently**: Auto-save banks when user makes changes
4. **Event-Driven**: Use custom events for cross-component communication
5. **Error Handling**: Always wrap async operations in try-catch
6. **Memory Management**: Clear unused pads to free memory
7. **User Feedback**: Show loading states and error messages

---

## API Reference

### Main Methods

- `init()` - Initialize audio context
- `loadSampleToPad(index, file)` - Load sample to pad
- `playSample(index, options)` - Play pad sample
- `setPadVolume(index, volume)` - Set pad volume
- `setPadPitch(index, semitones)` - Set pitch shift
- `setPadPlaybackRate(index, rate)` - Set playback speed
- `setPadFilter(index, type, freq, q)` - Configure filter
- `setPadEnvelope(index, envelope)` - Set ADSR envelope
- `setPadLoop(index, bool)` - Enable/disable loop
- `saveBank(name)` - Save current configuration
- `loadBank(name)` - Load saved configuration
- `deleteBank(name)` - Delete saved bank
- `startRecording()` - Start mic recording
- `stopRecording()` - Stop and save recording
- `exportSamplesForBattle()` - Export for battle interface
- `exportSamplesForJam()` - Export for jam session
- `getCurrentState()` - Get complete state

### Events

- `sampler:padUpdated` - Pad settings changed
- `sampler:bankLoaded` - Bank loaded successfully
- `sampler:recordingComplete` - Recording finished
- `sampler:exportedForBattle` - Samples exported for battle
- `sampler:exportedForJam` - Samples exported for jam

---

## Example: Complete Battle Integration

```javascript
// battle-interface.js
class BattleInterface {
  constructor() {
    this.sampler = window.enhancedSamplerManager;
    this.activeSamples = [];
  }

  async init() {
    // Load battle samples
    await this.loadBattleKit();

    // Setup keyboard controls
    this.setupKeyboardControls();

    // Listen for exports from sampler
    this.listenForSamplerExports();
  }

  async loadBattleKit() {
    const urls = [
      '/sounds/battle/808-kick.wav',
      '/sounds/battle/snare.wav',
      '/sounds/battle/hat.wav',
      '/sounds/battle/crash.wav'
    ];

    for (let i = 0; i < urls.length; i++) {
      await this.sampler.loadSampleToPad(i, urls[i]);
    }

    this.sampler.saveBank('Battle Kit Default');
  }

  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      const keyMap = {
        '1': 0, '2': 1, '3': 2, '4': 3,
        'q': 4, 'w': 5, 'e': 6, 'r': 7
      };

      const pad = keyMap[e.key.toLowerCase()];
      if (pad !== undefined) {
        this.sampler.playSample(pad, { velocity: 0.9 });
        this.highlightPad(pad);
      }
    });
  }

  listenForSamplerExports() {
    window.addEventListener('sampler:exportedForBattle', (e) => {
      this.activeSamples = e.detail.samples;
      this.updateUI();
    });
  }

  highlightPad(index) {
    const pad = document.querySelector(`[data-pad="${index}"]`);
    if (pad) {
      pad.classList.add('active');
      setTimeout(() => pad.classList.remove('active'), 200);
    }
  }

  updateUI() {
    console.log(`Battle interface updated with ${this.activeSamples.length} samples`);
  }
}

// Initialize
const battle = new BattleInterface();
battle.init();
```

---

**Now you have a complete, production-ready sampler system with all requested features!** 🎵🔥
