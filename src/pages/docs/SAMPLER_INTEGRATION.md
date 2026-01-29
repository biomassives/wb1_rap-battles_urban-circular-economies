---
layout: "../../layouts/DocLayout.astro"
title: "SAMPLER_INTEGRATION"
---
<div data-pagefind-filter="type:docs"></div>

# Sampler Integration Guide

## Overview
The sampler system is now fully integrated with the homepage, rap battles, and is super accessible. It features a minimal overlay mode with no text on pads, making it perfect for quick music creation.

## Components

### 1. SamplerPad Component (`src/components/SamplerPad.astro`)
A reusable sampler pad component with three modes:

**Props:**
- `minimal` (boolean) - Shows only pad numbers, no labels or frequency text
- `battleMode` (boolean) - Enables battle submission features
- `overlayMode` (boolean) - Optimized styling for overlay display

**Features:**
- 16 pressure-sensitive pads
- Keyboard shortcuts (1-4, Q-R, A-F, Z-V)
- Volume control
- Record/playback functionality
- Battle submission capability
- XP rewards integration

### 2. Homepage Integration (`src/pages/index.astro`)

**Floating Action Button (FAB):**
- Fixed position bottom-right
- Always accessible
- Gradient blue-purple styling
- Opens sampler overlay on click

**Overlay Modal:**
- Minimal mode enabled (no text on pads)
- Dark backdrop with blur effect
- Click outside to close
- ESC key to close
- Smooth fade-in/slide-up animation

### 3. Battle Integration (`src/lib/battlemanager.js`)

**New Methods:**
- `setupSamplerIntegration()` - Listens for sampler submissions
- `submitSamplerRecording()` - Submits recordings to battle system

**Event System:**
- Window event: `sampler-battle-submit`
- Automatically triggered when user submits from sampler in battle mode

## Usage

### Opening the Sampler
Click the floating sampler button on the homepage (bottom-right corner).

### Playing Sounds
- **Click/Touch:** Tap any pad to play sound
- **Keyboard:** Use keys 1-4, Q-R, A-F, Z-V for pads 1-16

### Recording
1. Click "Record" button
2. Play your sequence
3. Click "Record" again to stop
4. Use "Submit to Battle" if in battle mode

### Battle Submissions
When the sampler is used in battle mode:
1. Record your sequence
2. Click "Submit to Battle"
3. Recording is automatically submitted to the active battle
4. Earn 25 XP for submissions

### Accessibility Features
- Keyboard navigation support
- ARIA labels on buttons
- High contrast UI
- Large touch targets
- ESC key to close
- Mobile-responsive design

## File Structure

```
src/
├── components/
│   └── SamplerPad.astro          # Reusable sampler component
├── pages/
│   ├── index.astro               # Homepage with FAB & overlay
│   └── sampler.astro             # Full sampler page
└── lib/
    └── battlemanager.js          # Battle integration
```

## Styling

### Color Scheme
- Background: Dark gradient (#0e1117 to #161b22)
- Pads: Dark with blue borders (#30363d)
- Active: Blue-purple gradient (#58a6ff to #7c3aed)
- FAB: Blue-purple gradient
- Submit: Red gradient (battle mode)

### Animations
- Pad press: Scale down to 0.95 + glow effect
- FAB hover: Scale up + lift effect
- Overlay: Fade in (0.3s)
- Modal: Slide up (0.3s)

## XP Rewards
- Open sampler: +2 XP
- Play pad: +1 XP (10% chance per play)
- Submit to battle: +25 XP

## Integration with Other Systems

### Progress Manager
```javascript
if (window.progressManager) {
  window.progressManager.awardXP(amount, type, description);
}
```

### Battle Manager
```javascript
window.addEventListener('sampler-battle-submit', async (event) => {
  const { recording, timestamp } = event.detail;
  await battleManager.submitSamplerRecording(recording, timestamp);
});
```

## Customization

### Using in Different Contexts

**Minimal Overlay (Homepage):**
```astro
<SamplerPad minimal={true} overlayMode={true} />
```

**Battle Mode:**
```astro
<SamplerPad battleMode={true} />
```

**Full Version:**
```astro
<SamplerPad minimal={false} />
```

## Technical Details

### Web Audio API
- Uses Web Audio API for sound generation
- Oscillators with exponential decay envelopes
- Configurable frequencies per pad
- Master volume control

### Recording Format
Recordings are stored as arrays of events:
```javascript
[
  { index: 0, frequency: 60, time: 1234567890 },
  { index: 5, frequency: 120, time: 1234567892 },
  // ...
]
```

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Touch events supported

## Future Enhancements
- MIDI input/output support
- Sample upload capability
- Pattern save/load
- Collaborative jam sessions
- Effect processing (reverb, delay, etc.)
- Visual spectrum analyzer
- Loop recording with overdub

## Dev Server
Currently running at: **http://localhost:4322/**

Test the sampler by clicking the floating button in the bottom-right corner!
