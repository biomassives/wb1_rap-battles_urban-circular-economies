---
layout: "../../layouts/DocLayout.astro"
title: "MIXER-BANKS"
---
<div data-pagefind-filter="type:docs"></div>

# Mixer Bank System

## Overview

The DJ Mixer features a flexible bank system with 9 pre-filled samples on each side (18 total), customizable presets, and persistent storage.

## Features

### 📦 Bank Presets (4 Total)

1. **Space Bass** (default)
   - Left: Bass sounds (sub, acid, synth, reese, wobble) + FX (phaser, filter-sweep, riser, laser)
   - Right: Ambient (pad, drone, cosmic) + FX (swoosh, zap) + Drums (808 groove, boom bap, hi-hats, toms)

2. **Classic Drums**
   - Left: Individual 808 sounds (kick, snare, hh, oh, clap, toms, rimshot)
   - Right: Beat patterns (four floor, breakbeat, 808 groove, hip hop, boom bap, etc.)

3. **Bass Heavy**
   - Left: All bass variations (sub, acid, synth, reese variations)
   - Right: Drum support (kicks, patterns, fills)

4. **Ambient Space**
   - Left: Atmospheric pads and drones
   - Right: Space effects and transitions

### 📁 Banks Menu

Located in the mixer header, the **"📁 BANKS"** button opens a preset selector:

- Visual cards show all available presets
- Current preset highlighted in green
- Click any preset to load instantly
- No confirmation needed - loads immediately

### ✏️ Bank Editor

The **"✏️ EDIT"** button opens a comprehensive bank editor:

**What You Can Edit:**
- Bank names (left and right)
- All 18 sample slots (9 per bank)
- For each slot:
  - **Name**: Display name
  - **Pattern**: Strudel code (e.g., `s("bd")`, `sound("bd hh sd")`)
  - **Type**: drums, bass, fx, or ambient
  - **BPM**: Tempo (60-200)
  - **Color**: Pad color (visual indicator)

**Editor Layout:**
- 3x3 grid for left bank (9 slots)
- 3x3 grid for right bank (9 slots)
- Real-time preview as you edit
- Color-coded slots

### 💾 Persistence

**localStorage Storage:**
- `mixer-custom-bank`: Your saved custom bank
- `mixer-last-preset`: Last selected preset ID

**Behavior:**
1. First visit → Loads "Space Bass" preset
2. Return visit → Loads last used preset
3. After editing → Saves custom bank
4. Custom bank → Always loads on return

**Data Persists:**
- Across browser sessions
- Until manually cleared
- Until reset to default

## Usage Guide

### Loading a Preset

```
1. Click "📁 BANKS" in header
2. Browse 4 available presets
3. Click desired preset
4. Banks load instantly
5. Start mixing!
```

### Creating a Custom Bank

```
1. Click "✏️ EDIT" in header
2. Modify bank names (optional)
3. Edit any of 18 slots:
   • Change name
   • Update Strudel pattern
   • Adjust BPM
   • Set type category
   • Pick color
4. Click "💾 Save Custom Bank"
5. Custom bank saved to browser
6. Auto-loads on next visit
```

### Editing a Slot

Each slot has 5 editable fields:

```javascript
{
  "name": "Sub Bass",           // Display name
  "pattern": "s(\"bass-sub\")", // Strudel code
  "type": "bass",               // Category
  "bpm": 90,                    // Tempo
  "color": "#00ff00"            // Hex color
}
```

**Pattern Examples:**
- Single sound: `s("bd")`
- Multiple sounds: `sound("bd hh sd hh")`
- With effects: `s("bd").room(0.5)`
- Note pattern: `note("c a f e").s("piano")`

### Resetting to Default

```
1. Click "✏️ EDIT"
2. Scroll to bottom
3. Click "🔄 Reset to Default"
4. Confirm in dialog
5. Custom bank cleared
6. First preset loaded
```

## Bank Structure

### JSON Format

```json
{
  "leftBank": [...9 samples...],
  "rightBank": [...9 samples...],
  "leftBankName": "Bank Name",
  "rightBankName": "Bank Name"
}
```

### Sample Object

```json
{
  "id": "L1",
  "name": "Sub Bass",
  "pattern": "s(\"bass-sub\")",
  "type": "bass",
  "bpm": 90,
  "color": "#00ff00"
}
```

## Available Samples

### Drums (808 Machine)
- bd, sd, hh, oh, cp, lt, mt, ht, rim

### Bass Sounds
- bass-sub, bass-acid, bass-synth, bass-reese, bass-wobble

### Phaser/FX
- phaser, filter-sweep, riser

### Space/Ambient
- pad, drone, laser, zap, cosmic, swoosh

## Tips & Tricks

### Organizing Banks

**By Genre:**
- Left: Melodic elements
- Right: Rhythmic elements

**By Energy:**
- Left: Low energy / ambient
- Right: High energy / aggressive

**By Function:**
- Left: Build-up elements
- Right: Drop/main sections

### Color Coding

Use colors to organize by type:
- **Green (#00ff00)**: Bass sounds
- **Cyan (#00ffff)**: FX and transitions
- **Magenta (#ff00ff)**: Ambient/pads
- **Yellow (#ffff00)**: Drums
- **Red (#ff0000)**: High-energy elements

### Pattern Best Practices

1. **Keep patterns simple** for easy mixing
2. **Use consistent BPM** within a bank
3. **Test patterns** before saving
4. **Document complex patterns** in name
5. **Use type field** for quick filtering

## Keyboard Workflow

Currently mouse-based. Future enhancements:
- Keyboard shortcuts for switching presets
- Tab navigation in editor
- Enter to save
- Esc to cancel

## Integration with Sampler

**Current**: Manual pattern entry in editor
**Future**: Click samples in /sampler to populate mixer banks

## Advanced Customization

### Creating Theme Banks

**Dark & Moody:**
```
Left: bass-sub, bass-reese, drone, pad
Right: bd, sd patterns, minimal beats
Colors: Dark blues/purples
```

**High Energy:**
```
Left: bass-wobble, bass-acid, riser
Right: Breakbeat patterns, fast drums
Colors: Bright reds/oranges
```

**Ambient Soundscape:**
```
Left: pad, drone, cosmic
Right: swoosh, laser, filter-sweep
Colors: Cool blues/cyans
```

### Duplicate & Modify

Start with a preset, then:
1. Load preset
2. Click Edit
3. Make small changes
4. Save as custom

This preserves good structure while allowing tweaks.

## Troubleshooting

### Custom Bank Not Loading

**Check:**
- localStorage enabled in browser
- Not in private/incognito mode
- No extensions blocking storage

**Fix:**
- Re-save custom bank
- Check browser console for errors
- Reset to default and try again

### Preset Disappeared

**Presets are read-only** - they always load from the JSON file. If a preset seems gone:
1. Refresh the page
2. Check browser console
3. Verify `/data/mixer-bank-presets.json` exists

### Editor Changes Not Saving

**Steps:**
1. Make changes in editor
2. Click "💾 Save Custom Bank" button
3. Wait for "✅ Custom bank saved!" message
4. Changes now persisted

## Storage Limits

localStorage typical limit: **5-10 MB**

A custom bank uses ~2-4 KB, so you can store thousands of configurations.

## Export/Import (Future)

Planned features:
- Export custom bank as JSON file
- Import banks from files
- Share banks with other users
- Bank library/marketplace

## API

For advanced users, access the mixer programmatically:

```javascript
// Get current mixer instance
const mixer = window.mixer;

// Load a preset
mixer.loadPreset('classic-drums');

// Get current bank
console.log(mixer.leftBank);
console.log(mixer.rightBank);

// Save custom bank
mixer.saveCustomBank();
```

## Files

- **Presets**: `/public/data/mixer-bank-presets.json`
- **Mixer Page**: `/src/pages/mixer.astro`
- **Samples**: `/public/wav/*.wav`

## See Also

- `MIXER-GUIDE.md` - Complete mixer usage
- `SAMPLES.md` - Sample generation guide
- `/public/wav/README.md` - WAV file details
