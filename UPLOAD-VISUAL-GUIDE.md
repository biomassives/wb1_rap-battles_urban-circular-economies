# Visual Upload Guide

## 📍 Where to Click

### Sample Pad Layout

```
┌─────────────────────────────────────────┐
│  MIXER - 3×3 PAD GRID                  │
├─────────────────────────────────────────┤
│                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐
│ 📁│    [+] ←Click here!                │
│   │  ┌─────┐│  │  ┌─────┐│  │  ┌─────┐│
│   │  │ L1  ││  │  │ L2  ││  │  │ L3  ││
│   │  │Sub  ││  │  │Acid ││  │  │Synth││
│   │  │BASS ││  │  │BASS ││  │  │BASS ││
│   │  └─────┘│  │  └─────┘│  │  └─────┘│
│   └──────────┘  └──────────┘  └──────────┘
│                    ↑
│              Upload button on EVERY pad!
│
└─────────────────────────────────────────┘
```

### Button Details

**Upload Button (+)**
- Location: **Top-right corner** of each pad
- Color: **Neon blue/cyan**
- Size: 24px circle (28px on mobile)
- Action: Click → File picker opens

**Custom Indicator (📁)**
- Location: **Top-left corner** when uploaded
- Color: **Green**
- Shows: File has been customized

---

## 🎨 Visual States

### 1. Default Pad (Built-in Sound)

```
┌──────────┐
│          │ ← No 📁 indicator
│  ┌─────┐ │
│  │ L1  │ │ ← Pad ID
│  │Sub  │ │ ← Name
│  │BASS │ │ ← Type
│  └─────┘ │
│      [+] │ ← Upload button
└──────────┘
     ↑
Neon blue border
```

### 2. Hover State

```
┌──────────┐
│          │
│  ┌─────┐ │ ← Brighter glow
│  │ L1  │ │ ← Scales 1.05x
│  │Sub  │ │
│  │BASS │ │
│  └─────┘ │
│      [+] │ ← Button glows cyan
└──────────┘
     ↑
Stronger border glow
```

### 3. Active/Selected Pad

```
┌══════════┐
║          ║ ← Thick border (5px)
║  ┌─────┐ ║
║  │ L1  │ ║ ← Full color fill
║  │Sub  │ ║ ← Black text
║  │BASS │ ║ ← Pulsing animation
║  └─────┘ ║
║      [+] ║
└══════════┘
     ↑
Bright pulsing glow
```

### 4. Custom Uploaded Pad

```
┌──────────┐
│📁        │ ← Custom indicator
│  ┌─────┐ │
│  │ L1  │ │
│  │MyKick│ │ ← Your filename
│  │DRUMS│ │
│  └─────┘ │
│      [+] │ ← Can replace anytime
└──────────┘
```

### 5. Drag-Over State (Desktop)

```
┌┄┄┄┄┄┄┄┄┄┄┐
┊  DROP    ┊ ← Dashed border
┊  HERE!   ┊ ← Glowing cyan
┊  ┌─────┐ ┊
┊  │ L1  │ ┊
┊  │     │ ┊
┊  │     │ ┊
┊  └─────┘ ┊
┊      [+] ┊
└┄┄┄┄┄┄┄┄┄┄┘
     ↑
Ready to receive file
```

---

## 📱 Mobile vs Desktop

### Mobile View

```
PHONE SCREEN (Portrait):
┌─────────────────────┐
│ ◢ DJ MIXER ◣       │
│ [📁 BANKS] [✏️ EDIT]│
│ 💡 Click + to upload│ ← Hint text
├─────────────────────┤
│ LEFT BANK           │
│ ┌───┐ ┌───┐ ┌───┐  │
│ │L1+│ │L2+│ │L3+│  │ ← Bigger + buttons
│ └───┘ └───┘ └───┘  │
│ ┌───┐ ┌───┐ ┌───┐  │
│ │L4+│ │L5+│ │L6+│  │
│ └───┘ └───┘ └───┘  │
│ ┌───┐ ┌───┐ ┌───┐  │
│ │L7+│ │L8+│ │L9+│  │
│ └───┘ └───┘ └───┘  │
└─────────────────────┘
```

**Mobile Features:**
- Larger touch targets (28px buttons)
- Tap + button → Native file picker
- Access Files app, iCloud, Drive, etc.
- No drag-and-drop (use + button)

### Desktop View

```
WIDE SCREEN (Desktop):
┌───────────────────────────────────────────────────────────┐
│ ◢ DJ MIXER ◣    [📁 BANKS] [✏️ EDIT]                     │
│ 💡 Click + on any pad to upload • Drag & drop audio files │
├───────────────────────────────────────────────────────────┤
│ LEFT BANK        MASTER          RIGHT BANK               │
│ ┌───┐┌───┐┌───┐  CROSSFADER    ┌───┐┌───┐┌───┐          │
│ │L1+││L2+││L3+│  ┌──────┐      │R1+││R2+││R3+│          │
│ └───┘└───┘└───┘  │ L─C─R│      └───┘└───┘└───┘          │
│ ┌───┐┌───┐┌───┐  └──────┘      ┌───┐┌───┐┌───┐          │
│ │L4+││L5+││L6+│                │R4+││R5+││R6+│          │
│ └───┘└───┘└───┘                └───┘└───┘└───┘          │
│ ┌───┐┌───┐┌───┐                ┌───┐┌───┐┌───┐          │
│ │L7+││L8+││L9+│                │R7+││R8+││R9+│          │
│ └───┘└───┘└───┘                └───┘└───┘└───┘          │
└───────────────────────────────────────────────────────────┘
     ↑                                      ↑
Drag files here                       Or drop here
```

**Desktop Features:**
- Smaller + buttons (24px)
- Click + → System file picker
- Drag & drop from file explorer
- Hover effects and animations

---

## 🎯 Click Targets

### Upload Button Hit Area

```
┌──────────┐
│  ┌────┐  │
│  │ +  │←─ 24×24px clickable area
│  └────┘  │   (28×28px on mobile)
│          │
│  Pad     │
│  Content │
│          │
└──────────┘
```

**Accessibility:**
- Large enough for fingers (mobile)
- Clear visual separation
- Stops propagation (won't trigger pad)
- Tooltip shows "Upload WAV file"

---

## 🔄 Upload Flow Diagram

```
USER ACTION          VISUAL FEEDBACK         RESULT
───────────          ───────────────         ──────

Click + button   →   File picker opens   →   Select audio file
      ↓
File selected    →   "Uploading..."      →   Processing...
      ↓                status message
Waveform         →   Pad updates         →   Shows filename
extracted             with new name            & 📁 indicator
      ↓
Auto-save        →   "✅ Uploaded!"      →   Bank saved
      ↓                status message           to browser
Ready to play    →   Click pad to load   →   Press PLAY
                      & see waveform           to hear
```

---

## 📏 Dimensions Reference

### Pad Sizes

| Element | Desktop | Mobile |
|---------|---------|--------|
| Pad | ~100px | ~80px |
| + Button | 24px circle | 28px circle |
| 📁 Indicator | 20px | 20px |
| Border | 3px (normal) | 3px |
| Border (active) | 5px | 5px |

### Spacing

| Gap | Desktop | Mobile |
|-----|---------|--------|
| Between pads | 0.75rem (12px) | 0.5rem (8px) |
| Grid padding | 0.5rem | 0.25rem |
| Bank gap | 1rem | 0.5rem |

---

## 🎨 Color Reference

### Upload Button Colors

```
State         Border      Background         Text
─────         ──────      ──────────         ────
Default       #00ffff     rgba(0,255,255,0.2) #00ffff
Hover         #00ffff     #00ffff             #000
Active        #00ffff     #00ffff             #000
```

### Custom Indicator Colors

```
Element       Border      Background         Text
───────       ──────      ──────────         ────
📁 Badge      #0f0        rgba(0,255,0,0.2)  #0f0
```

### Drag-Over State

```
Element       Border      Background         Glow
───────       ──────      ──────────         ────
Pad           #0ff        rgba(0,255,255,0.3) 0 0 40px #0ff
              (dashed)
```

---

## 🖱️ Interaction Patterns

### Desktop

```
HOVER:
  Cursor: pointer
  + Button: Glows & scales 1.1x
  Tooltip: "Upload WAV file"

CLICK:
  Action: Open file picker
  Propagation: Stopped (won't load sample)

DRAG OVER:
  Visual: Dashed border, cyan glow
  Cursor: copy

DROP:
  Action: Upload file immediately
  Visual: Reset, show uploading status
```

### Mobile

```
TAP + BUTTON:
  Feedback: Slight scale animation
  Action: Native file picker
  Access: Files, iCloud, Drive, etc.

TAP PAD (not +):
  Action: Load sample (normal behavior)
  Visual: Active state, highlight

LONG PRESS:
  (Currently no action - future context menu?)
```

---

## 🧭 Navigation Flow

```
Main Mixer Page
       ↓
   Click + on pad
       ↓
   File picker opens
       ↓
Choose audio file
       ↓
  File uploads
       ↓
Waveform extracts
       ↓
  Pad updates
       ↓
  Auto-saves
       ↓
 Ready to play!
```

**No need to:**
- Open edit mode
- Manually save
- Refresh page
- Configure settings

**Just:**
1. Click +
2. Pick file
3. Done!

---

## 📚 See Also

- **Step-by-step guide**: `EASY-UPLOAD-GUIDE.md`
- **Technical details**: `MIXER-WAVEFORM-UPLOAD.md`
- **Styling info**: `NEON-BLUE-STYLING.md`

---

**Ready to upload!** Look for the **blue + button** in the top-right corner of any pad. Click it and choose your sound! 🎵✨
