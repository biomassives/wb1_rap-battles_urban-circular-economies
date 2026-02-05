# Mixer Waveform Visualization & Custom Upload Guide

## Overview

The DJ Mixer now features **real-time waveform visualization** and **custom WAV file upload** capabilities, allowing you to:
- See actual waveforms of loaded samples
- Upload your own audio files from computer or phone
- Mix custom samples with built-in sounds
- Visualize both frequency analysis (when playing) and static waveforms (when idle)

---

## Waveform Visualization

### What You See

**When Sample is Loaded (Idle State)**
- Displays the **actual waveform** of the loaded audio file
- Shows amplitude over time
- Color-coded: **Green** for left bank, **Magenta** for right bank
- Waveform data extracted directly from WAV file

**When Sample is Playing**
- Switches to **real-time frequency analysis**
- Shows live audio spectrum (frequency bars)
- Animated glow effects
- Peak line indicator

### How It Works

1. **Click a sample pad** → Loads sample into bank
2. **Waveform extracts automatically** → Visualizer displays audio shape
3. **Press PLAY** → Switches to frequency analysis
4. **Press STOP** → Returns to waveform display

### Technical Details

- **Waveform Resolution**: Up to 1000 data points per file
- **Analysis Method**: RMS (Root Mean Square) amplitude
- **Update Rate**: 60 FPS real-time rendering
- **FFT Size**: 128 bins for frequency analysis

---

## Custom WAV File Upload

### Uploading Files

**From Desktop:**
1. Open mixer at `/mixer`
2. Click **"✏️ EDIT"** button in header
3. Find the slot you want to replace
4. Click **"📁 Upload WAV"** button
5. Select `.wav` file from your computer
6. File uploads and waveform extracts automatically

**From Mobile (Phone/Tablet):**
1. Same steps as desktop
2. File picker adapts to mobile OS
3. Select from Files app, iCloud, Google Drive, etc.
4. Tap WAV file to upload

### Supported Formats

✅ **Supported:**
- `.wav` (WAV/WAVE)
- PCM encoded audio
- Mono or stereo (converts to mono)
- Any sample rate (auto-converts to 44.1kHz)
- Any bit depth (16-bit, 24-bit, 32-bit float)

❌ **Not Supported:**
- MP3, OGG, FLAC (use online converter first)
- Compressed formats
- DRM-protected files

### What Happens During Upload

```
1. File selected → Read as ArrayBuffer
2. WAV parsed → Extract audio data
3. Waveform calculated → RMS analysis (1000 points)
4. Base64 encoded → Stored in localStorage
5. Pattern updated → Set to "custom:filename.wav"
6. Visualizer ready → Waveform displays when loaded
```

### File Size Limits

**localStorage Limit**: ~5-10 MB per domain

**Recommendations:**
- **Optimal**: 100KB - 500KB per file
- **Maximum**: ~1-2 MB per file
- **Total custom files**: 10-15 files comfortably

**Tips for keeping files small:**
- Use **mono** instead of stereo (halves size)
- Sample at **22.05kHz** or **44.1kHz** (avoid 96kHz)
- Keep samples **short** (1-5 seconds ideal)
- Use **16-bit** depth (24-bit unnecessary for samples)

### Reducing File Size

**Using Audacity (Free):**
```
1. Open WAV file
2. Tracks → Mix → Mix Stereo Down to Mono
3. Tracks → Resample → 44100 Hz
4. File → Export → Export as WAV
   - Format: WAV (Microsoft) signed 16-bit PCM
5. Save with descriptive name
```

**Using FFmpeg (Command Line):**
```bash
ffmpeg -i input.wav -ac 1 -ar 44100 -sample_fmt s16 output.wav
```

---

## Using Custom Samples

### After Upload

1. **Custom file appears** in slot with filename shown
2. **Waveform extracted** automatically
3. **Pattern set** to `custom:filename.wav`
4. **Name updated** to filename (without .wav extension)

### Playing Custom Files

**Same as built-in samples:**
1. Click pad to load
2. Waveform displays in visualizer
3. Press **▶ PLAY** to hear
4. Press **■ STOP** to stop
5. Use crossfader to mix

**Differences from built-in:**
- Custom files play as **one-shot** (not looping patterns)
- Audio connects directly to mixer gain nodes
- Auto-stops when file finishes playing
- Stored in localStorage (persists across sessions)

### Saving Custom Banks

1. Upload your custom files to desired slots
2. Click **"💾 Save Custom Bank"**
3. Bank saved to localStorage
4. Loads automatically on next visit

### Exporting/Sharing Custom Banks

**Currently**: localStorage only (browser-specific)

**Planned** (future update):
- Export bank as JSON file
- Include base64-encoded audio data
- Share with other users
- Import banks from files

---

## Workflow Examples

### Example 1: DJ Set with Custom Samples

```
SETUP:
1. Upload your own kick drum → Left Bank L1
2. Upload vocal sample → Left Bank L2
3. Upload bass loop → Right Bank R1
4. Keep built-in hi-hats → Right Bank R8

PERFORMANCE:
1. Load L1 (custom kick) → Play
2. Crossfade to center
3. Load R8 (hi-hats) → Play
4. Both playing → Adjust crossfader
5. Swap to L2 (vocal) for variation
```

### Example 2: Mixing Custom & Built-In

```
LEFT BANK (Custom):
L1: Your kick.wav
L2: Your snare.wav
L3: Your melody.wav

RIGHT BANK (Built-In):
R1: Built-in bass-sub
R2: Built-in pad
R3: Built-in riser

RESULT: Hybrid bank with your sounds + synth elements
```

### Example 3: Full Custom Setup

```
Upload 18 custom WAV files (9 per bank):
- Left: Your drum hits
- Right: Your melodic loops

Create fully personalized mixer setup
Save as custom bank
Use for live performance or production
```

---

## Visualizer Modes

### Mode 1: Waveform Display (Idle)

**When visible:**
- Sample loaded but not playing

**What you see:**
- Actual audio waveform
- Amplitude bars from center line
- Static display (non-animated)
- Glow effect on bars

**Example:**
```
  ━━━┓
━━━┛  ┗━━━┓     ┏━━━
         ┗━━━━━┛

(Waveform shape of loaded sample)
```

### Mode 2: Frequency Analysis (Playing)

**When visible:**
- Sample currently playing

**What you see:**
- Live frequency spectrum
- Animated bars (60 FPS)
- Color gradient (low to high freq)
- Peak line indicator
- Pulsing glow effects

**Example:**
```
█
█ ▄
█ █ ▀
█ █ █ ▄ ▀   ▄
█ █ █ █ █ █ █ ▀ ▄ ▀
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
Low ←→ High Freq
```

---

## Mobile Usage

### Uploading from Phone

**iOS (iPhone/iPad):**
1. Tap **📁 Upload WAV**
2. Choose from:
   - Files app
   - iCloud Drive
   - On My iPhone/iPad
   - Cloud services
3. Select WAV file
4. Upload processes automatically

**Android:**
1. Tap **📁 Upload WAV**
2. Choose from:
   - Downloads
   - Google Drive
   - File manager
   - Cloud storage
3. Select WAV file
4. Upload completes

### Recording & Converting on Mobile

**iOS Workflow:**
```
1. Record voice memo or import audio
2. Use "Voice Memos" app
3. Share → Save to Files
4. Open WorldBridger One mixer
5. Upload from Files app
```

**Android Workflow:**
```
1. Record with voice recorder app
2. Save as WAV (or convert using app)
3. Store in Downloads or Drive
4. Open mixer in browser
5. Upload from file picker
```

### Converting to WAV on Mobile

**iOS Apps** (free):
- Audio Converter
- Media Converter
- AudioShare

**Android Apps** (free):
- Audio Converter
- MP3 Cutter and Ringtone Maker
- Timbre

---

## Troubleshooting

### "Error uploading file"

**Possible causes:**
- File is not a valid WAV
- File is corrupted
- File is too large (>10MB)

**Solutions:**
- Re-export as WAV PCM
- Reduce file size
- Check file integrity

### "Waveform not displaying"

**Check:**
1. Sample is actually loaded (name shows in "LOADED" section)
2. Visualizer canvas is visible
3. Browser supports Web Audio API
4. Console for errors (F12)

**Fix:**
- Reload page
- Try different sample
- Clear browser cache

### "Custom file won't play"

**Check:**
1. Pattern shows `custom:filename.wav`
2. Custom file data saved (check localStorage)
3. Audio context not blocked (click anywhere first)

**Fix:**
- Re-upload file
- Save custom bank again
- Check browser console

### "localStorage quota exceeded"

**Cause**: Too many/large custom files

**Solutions:**
1. Delete unused custom samples
2. Reduce WAV file sizes
3. Use smaller sample library
4. Reset to default and start fresh

**Check storage:**
```javascript
// In browser console (F12)
console.log(localStorage.length);
console.log(JSON.stringify(localStorage).length);
```

---

## Advanced Features

### Waveform Data Structure

```javascript
sample.waveform = [
  { rms: 0.45, max: 0.67, min: -0.62 },
  { rms: 0.52, max: 0.78, min: -0.71 },
  // ... up to 1000 points
];
```

**Fields:**
- `rms`: Root mean square amplitude (0-1)
- `max`: Peak positive amplitude
- `min`: Peak negative amplitude

### Custom File Data

```javascript
sample = {
  id: "L1",
  name: "MyKick",
  pattern: "custom:MyKick.wav",
  type: "drums",
  bpm: 120,
  color: "#ff0000",
  customFile: "UklGRiQAAABXQVZFZm10...", // base64
  customFileName: "MyKick.wav",
  waveform: [...],
  sampleRate: 44100,
  duration: 1.5
};
```

### Programmatic Upload

```javascript
// Access mixer instance
const mixer = window.mixer;

// Get sample slot
const sample = mixer.leftBank[0];

// Check if custom file
if (sample.pattern.startsWith('custom:')) {
  console.log(`Custom file: ${sample.customFileName}`);
  console.log(`Duration: ${sample.duration}s`);
  console.log(`Sample rate: ${sample.sampleRate}Hz`);
}
```

---

## Performance Tips

### For Best Visualizer Performance

1. **Close other browser tabs** (reduces CPU load)
2. **Use modern browser** (Chrome, Firefox, Safari latest)
3. **Disable browser extensions** temporarily
4. **Full-screen mixer** (hide other UI)

### For Smooth Upload/Playback

1. **Use Wi-Fi** on mobile (faster than cellular)
2. **Compress files** before uploading
3. **Limit custom files** to 10-15 total
4. **Clear old custom banks** periodically

---

## Future Enhancements

**Planned features:**
- Multi-file drag-and-drop upload
- Waveform editing (trim, normalize)
- Cloud storage integration
- Bank export/import as files
- Waveform zoom and scrubbing
- Sample recording directly in browser
- Auto-BPM detection from waveform
- Crossfade preview in visualizer

---

## See Also

- `MIXER-WORKFLOW.md` - Best practices for DJ performance
- `MIXER-BANKS.md` - Bank system documentation
- `SAMPLES.md` - Built-in sample reference

---

**Ready to create!** Upload your custom samples and see their waveforms come to life in the visualizer. 🎵🎛️
