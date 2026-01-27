# DJ Mixer Workflow Guide

## 9+9 Sampler Pad System

The mixer features **9 playable pads per bank** (18 total) in a **3×3 grid** layout optimized for DJ performance.

```
┌─────────────────────────────────────────────────────────────┐
│                      DJ MIXER LAYOUT                        │
├──────────────────┬────────────────┬─────────────────────────┤
│   LEFT BANK      │     MASTER     │      RIGHT BANK         │
│   (9 pads)       │   CROSSFADER   │      (9 pads)          │
├──────────────────┤                ├─────────────────────────┤
│  ┌───┬───┬───┐   │   ┌──────┐    │   ┌───┬───┬───┐        │
│  │L1 │L2 │L3 │   │   │ L─C─R│    │   │R1 │R2 │R3 │        │
│  ├───┼───┼───┤   │   └──────┘    │   ├───┼───┼───┤        │
│  │L4 │L5 │L6 │   │                │   │R4 │R5 │R6 │        │
│  ├───┼───┼───┤   │   PLAY ALL     │   ├───┼───┼───┤        │
│  │L7 │L8 │L9 │   │   STOP ALL     │   │R7 │R8 │R9 │        │
│  └───┴───┴───┘   │   SYNC         │   └───┴───┴───┘        │
│                   │                │                         │
│  [VISUALIZER]     │   BPM: 120     │   [VISUALIZER]         │
│  [LOADED INFO]    │   MASTER VOL   │   [LOADED INFO]        │
│  [▶ PLAY] [STOP]  │                │   [▶ PLAY] [STOP]      │
└──────────────────┴────────────────┴─────────────────────────┘
```

## Best Workflow Practices

### 1. Source Types

**WAV Samples** (Direct Audio Files)
- Single drum hits (bd, sd, hh, etc.)
- Bass one-shots
- FX sounds
- Pre-recorded loops

**Strudel Patterns** (Generative Sequences)
- Drum patterns: `sound("bd hh sd hh")`
- Melodic sequences: `note("c a f e").s("piano")`
- Complex arrangements
- Algorithmic compositions

### 2. Recommended Bank Organization

#### Strategy A: Layer by Energy (Default "Space Bass")

**LEFT BANK** - Foundation & Build
```
┌─────────┬─────────┬─────────┐
│L1: Sub  │L2: Acid │L3: Synth│  ← Bass Layer
├─────────┼─────────┼─────────┤
│L4: Reese│L5: Wobbl│L6: Phase│  ← Texture Layer
├─────────┼─────────┼─────────┤
│L7: Filtr│L8: Riser│L9: Laser│  ← Transition FX
└─────────┴─────────┴─────────┘
```

**RIGHT BANK** - Rhythm & Atmosphere
```
┌─────────┬─────────┬─────────┐
│R1: Pad  │R2: Drone│R3: Cosmc│  ← Ambient Layer
├─────────┼─────────┼─────────┤
│R4: Swosh│R5: Zap  │R6: 808  │  ← FX + Rhythm
├─────────┼─────────┼─────────┤
│R7: Boom │R8: HiHat│R9: Toms │  ← Drum Patterns
└─────────┴─────────┴─────────┘
```

**Workflow:**
1. Start with R1 (Pad) for atmosphere
2. Add L1 (Sub Bass) for low end
3. Bring in R6/R7 (drums) for rhythm
4. Use crossfader to blend left (bass) and right (drums)
5. Use L8 (Riser) for build-ups before drops

#### Strategy B: Separate Elements (Classic DJ)

**LEFT BANK** - All Melodic
```
┌─────────┬─────────┬─────────┐
│L1: Bass1│L2: Bass2│L3: Bass3│  ← Bass Variations
├─────────┼─────────┼─────────┤
│L4: Pad1 │L5: Pad2 │L6: Lead │  ← Synth/Melody
├─────────┼─────────┼─────────┤
│L7: FX 1 │L8: FX 2 │L9: FX 3 │  ← Transitions
└─────────┴─────────┴─────────┘
```

**RIGHT BANK** - All Rhythmic
```
┌─────────┬─────────┬─────────┐
│R1: Kick │R2: Snare│R3: HiHat│  ← Individual Hits
├─────────┼─────────┼─────────┤
│R4: Patrn│R5: Break│R6: Full │  ← Full Patterns
├─────────┼─────────┼─────────┤
│R7: Perc1│R8: Perc2│R9: Fill │  ← Percussion
└─────────┴─────────┴─────────┘
```

**Workflow:**
1. Load R4 (Pattern) for main beat
2. Crossfade to center
3. Bring in L1 (Bass) on left
4. Use individual hits (R1-R3) for fills
5. Swap bass sounds (L1-L3) for variation

#### Strategy C: Track Building (Producer Mode)

**LEFT BANK** - Intro/Verse Elements
```
┌─────────┬─────────┬─────────┐
│L1: Intro│L2: Verse│L3: Pre  │  ← Song Sections
├─────────┼─────────┼─────────┤
│L4: Sub  │L5: Mid  │L6: Top  │  ← Frequency Layers
├─────────┼─────────┼─────────┤
│L7: Ambnt│L8: Textr│L9: Space│  ← Atmosphere
└─────────┴─────────┴─────────┘
```

**RIGHT BANK** - Chorus/Drop Elements
```
┌─────────┬─────────┬─────────┐
│R1: Chors│R2: Drop │R3: Break│  ← High Energy
├─────────┼─────────┼─────────┤
│R4: Lead │R5: Stabs│R6: Arp  │  ← Melodic Hooks
├─────────┼─────────┼─────────┤
│R7: Build│R8: Riser│R9: Down │  ← Transitions
└─────────┴─────────┴─────────┘
```

**Workflow:**
1. Start with L1 (Intro) on full left
2. Gradually crossfade right while transitioning
3. Full right at R2 (Drop)
4. Use R7-R9 for transitions between sections

### 3. WAV vs Strudel: When to Use Each

#### Use WAV Samples For:

**✅ Single Hits**
```javascript
{ "pattern": "s(\"bd\")" }           // Kick drum
{ "pattern": "s(\"bass-sub\")" }     // Sub bass hit
{ "pattern": "s(\"laser\")" }        // Laser zap FX
```

**✅ Textured Sounds**
```javascript
{ "pattern": "s(\"pad\")" }          // 3-second ambient pad
{ "pattern": "s(\"drone\")" }        // 4-second drone
{ "pattern": "s(\"cosmic\")" }       // Evolving texture
```

**Advantages:**
- Predictable playback
- High-quality pre-rendered audio
- Immediate response
- No synthesis overhead

#### Use Strudel Patterns For:

**✅ Rhythmic Patterns**
```javascript
{ "pattern": "sound(\"bd hh sd hh\")" }              // 4-beat pattern
{ "pattern": "s(\"bd sd bd cp\")" }                  // Boom bap
{ "pattern": "sound(\"bd bd sd hh bd sd hh hh\")" }  // Complex rhythm
```

**✅ Melodic Sequences**
```javascript
{ "pattern": "note(\"c a f e\").s(\"piano\")" }      // Melody
{ "pattern": "note(\"c2 e2 g2\").s(\"bass\")" }      // Bass line
```

**✅ Generative/Evolving**
```javascript
{ "pattern": "s(\"bd sd\").fast(2)" }                // Speed variations
{ "pattern": "sound(\"hh*8\").gain(0.5)" }           // Volume control
```

**Advantages:**
- Pattern variations
- Algorithmic composition
- Less storage (code vs audio)
- Live-codeable

### 4. Optimal Workflow Steps

#### A. Performance Workflow (DJ Set)

```
PREPARATION (Before Performance):
1. Click "📁 BANKS" → Select preset matching style
2. Or click "✏️ EDIT" → Load custom bank
3. Verify all 18 pads load correctly
4. Test each sample briefly
5. Note which pads pair well

DURING PERFORMANCE:
1. Start with ambient (R1: Pad or R2: Drone)
2. Set crossfader to RIGHT
3. Play right bank → establishes atmosphere
4. Load complementary left sample (L1: Sub Bass)
5. Gradually move crossfader LEFT
6. Both banks playing = full mix
7. Use individual volumes to balance
8. Swap samples mid-performance by clicking new pads
9. Use riser/sweep for transitions (L8, R4)
10. Drop with crossfader snap to opposite side

TRANSITIONS:
1. Build: Use L8 (Riser) + increase left volume
2. Drop: Snap crossfader to right at peak
3. Breakdown: Crossfade to left (bass only)
4. Return: Crossfade back to center
```

#### B. Production Workflow (Track Building)

```
LAYER BY LAYER:
1. Start with foundation:
   - R6: Load "bd hh sd hh" pattern (drums)
   - Play → Establishes rhythm

2. Add bass layer:
   - L1: Load "bass-sub"
   - Set crossfader to CENTER
   - Play left bank → Bass + drums

3. Add atmosphere:
   - R1: Load "pad"
   - Adjust right volume to blend

4. Add movement:
   - L6: Load "phaser" or "filter-sweep"
   - Trigger periodically for interest

5. Build to drop:
   - L8: Load "riser"
   - As it plays, gradually reduce other volumes
   - At peak, stop all and drop new pattern

6. Record/Export:
   - Use browser audio capture
   - Or record performance live
```

#### C. Experimental Workflow (Sound Design)

```
DISCOVERY MODE:
1. Click "📁 BANKS" → "Ambient Space" preset
2. Load multiple pads simultaneously
3. Use crossfader to morph between textures
4. Try unexpected combinations:
   - Pad + Wobble Bass = Thick low-mid
   - Drone + Laser = Evolving sci-fi
   - Cosmic + Phaser = Swirling space
5. When you find good combos, note them
6. Click "✏️ EDIT" → Create custom bank
7. Arrange discoveries into performance layout
8. Save custom bank for later
```

### 5. Visual Workflow Guide

#### Pad Click → Load Behavior

```
USER CLICKS PAD:
  ↓
Check if sample already loaded
  ↓
  YES → Highlight pad, update info panel
  ↓
  NO → Load sample, highlight pad, show info
  ↓
Sample ready in bank
  ↓
User clicks PLAY
  ↓
Strudel evaluates pattern
  ↓
Audio plays through bank gain node
  ↓
Visualizer shows waveform
  ↓
Crossfader controls left/right balance
```

#### Crossfader Behavior

```
Position: 0 ──────── 50 ──────── 100
          LEFT     CENTER     RIGHT

At LEFT (0):
  Left Bank:  100% volume
  Right Bank:   0% volume

At CENTER (50):
  Left Bank:  50% volume
  Right Bank: 50% volume

At RIGHT (100):
  Left Bank:   0% volume
  Right Bank: 100% volume

Formula:
  leftGain  = (100 - position) / 100
  rightGain = position / 100
```

### 6. Sample Management

#### Naming Conventions

**Good Names** (Clear & Descriptive):
```javascript
{ "name": "Sub Bass" }       // Clear
{ "name": "808 Groove" }     // Descriptive
{ "name": "Riser FX" }       // Categorized
{ "name": "Ambient Pad" }    // Type + Function
```

**Avoid**:
```javascript
{ "name": "Sample 1" }       // Non-descriptive
{ "name": "asdfgh" }         // Meaningless
{ "name": "New" }            // Too vague
```

#### Pattern Organization

**Single Samples** (One-shots):
```javascript
s("bd")              // Single kick
s("bass-sub")        // Single bass note
s("laser")           // Single FX
```

**Patterns** (Sequences):
```javascript
sound("bd hh sd hh")           // 4-step drum pattern
s("bd sd bd cp")               // Boom bap pattern
sound("lt mt ht lt")           // Tom pattern
```

**Complex** (Multi-element):
```javascript
sound("bd hh sd hh bd sd hh hh")      // 8-step pattern
note("c a f e c a f e").s("piano")    // Melodic sequence
```

### 7. Performance Tips

#### Smooth Transitions

**Crossfader Techniques:**
1. **Slow Fade** (8 beats): Gradual blend
2. **Quick Cut** (instant): Sharp transition
3. **Center Hold** (4+ beats): Layered section
4. **Tease** (back and forth): Build tension

#### Volume Balancing

**Rule of thumb:**
- Bass: 80-90% volume
- Drums: 70-80% volume
- Pads: 50-60% volume
- FX: 40-50% volume

**Mixing Strategy:**
1. Start with all volumes at 80%
2. Play together
3. Adjust individual volumes to taste
4. Use crossfader for final balance

#### Pad Swapping

**Mid-Performance Change:**
1. While current sample plays
2. Click new pad to load
3. Wait for natural gap in music
4. Press STOP
5. Press PLAY for new sample
6. Crossfade in smoothly

### 8. Common Workflows

#### Scenario 1: Build & Drop

```
1. R1 (Pad) → Play → Full RIGHT → Atmosphere
2. L8 (Riser) → Play → Gradual LEFT → Building
3. At peak → STOP ALL
4. R6 (808 Groove) → Play → Snap RIGHT → DROP
5. L5 (Wobble Bass) → Play → Crossfade CENTER → Full mix
```

#### Scenario 2: Layered Jam

```
1. Crossfader → CENTER
2. L1 (Sub Bass) → Play LEFT
3. R6 (808 Groove) → Play RIGHT
4. Both playing → Balanced mix
5. Adjust volumes to taste
6. Add R1 (Pad) → Increase right volume → Thickness
7. Swap L1 for L2 (Acid Bass) → Variation
```

#### Scenario 3: Breakdown to Build

```
1. Full mix playing (L1 + R6)
2. Crossfade → Full LEFT → Just bass
3. Load R1 (Pad) → Play RIGHT
4. Crossfade → CENTER → Bass + pad (no drums)
5. Load L8 (Riser) → Play LEFT → Building
6. At peak → Load R7 (Boom Bap) → PLAY
7. Crossfade → Full RIGHT → Drop back in
```

## Technical Notes

### Grid Layout

- CSS Grid: `repeat(3, 1fr)`
- 3 columns × 3 rows = 9 pads
- Responsive: Collapses to 1 column on mobile
- Gap: 0.5rem between pads

### Pad States

1. **Default**: White with colored border
2. **Hover**: Scale 1.05, brighter glow
3. **Active**: Full color fill, thick border
4. **Playing**: Active + animated glow pulse

### Sample Loading

- All samples preload on page load
- Cached in Web Audio buffers
- Instant playback when PLAY pressed
- Visualizer updates in real-time (60fps)

### Storage

- Current bank: In-memory
- Custom bank: localStorage
- Preset: Read from JSON file
- Last used: localStorage key

## Best Practices Summary

✅ **DO:**
- Organize by energy/function
- Use clear, descriptive names
- Test samples before performing
- Use WAV for single hits
- Use Strudel for patterns
- Save custom banks frequently
- Balance volumes before mixing

❌ **DON'T:**
- Overload with similar sounds
- Use unclear names
- Max out all volumes
- Mix clashing frequencies
- Change mid-performance without testing
- Forget to save custom work

## Keyboard Reference (Future)

Planned shortcuts:
- `1-9`: Load left pads L1-L9
- `Shift+1-9`: Load right pads R1-R9
- `Space`: Play/Pause active bank
- `Left/Right Arrow`: Crossfader
- `Up/Down Arrow`: Master volume
- `S`: Save custom bank
- `L`: Open bank selector

---

**Ready to mix!** Open `/mixer` and start with the "Space Bass" preset to explore the 9+9 pad system.
