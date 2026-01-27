# Strudel Integration Guide
**WorldBridger One - Live Coding Music Integration**

## 🎹 Overview

Integrating [Strudel](https://strudel.cc/) (TidalCycles for JavaScript) with WorldBridger One's offline-first music system to enable:
- **Live coding music** directly in browser
- **Converting tracks to Strudel patterns** for remixing
- **Rap battle Strudel players** for beat-making
- **NFT music with embedded Strudel code**
- **Sampler integration** with local track database

---

## 📊 Data Structure Requirements

### Track Schema Enhancement

Add Strudel-specific fields to the `tracks` table:

```javascript
// Enhanced Track Object
{
  // Existing fields
  id: 1,
  userWallet: "ABC123...",
  title: "My Track",
  genre: "rap",
  audioFileUrl: "https://example.com/track.mp3",
  bpm: 140,
  key: "C Major",

  // NEW: Strudel Integration Fields
  strudelPattern: null,        // Strudel code string (optional)
  strudelSamples: [],          // Array of sample references
  audioAnalysis: {             // Auto-generated from audio
    tempo: 140,
    beats: [...],              // Beat timestamps
    bars: [...],               // Bar timestamps
    sections: [...],           // Verse/chorus sections
    pitches: [...],            // Pitch detection
    energy: 0.85,              // Overall energy level
    danceability: 0.72         // Rhythmic pattern consistency
  },
  mixerSettings: {             // For sampler/mixer integration
    volume: 0.8,
    pan: 0,
    effects: {
      reverb: 0.2,
      delay: 0.1,
      filter: { type: "lowpass", frequency: 800 }
    }
  },
  stems: {                     // If track has separated stems
    drums: "url_to_drums.mp3",
    bass: "url_to_bass.mp3",
    melody: "url_to_melody.mp3",
    vocals: "url_to_vocals.mp3"
  }
}
```

### Battle Schema Enhancement

```javascript
// Enhanced Battle Object
{
  id: 1,
  challengerWallet: "ABC...",
  opponentWallet: "XYZ...",
  category: "wordplay",

  // NEW: Strudel Beat Integration
  beatMode: "strudel",         // "strudel" | "uploaded" | "none"
  strudelBeat: {
    code: 's("bd sd, hh*8").bank("RolandTR909")',
    bpm: 140,
    creatorWallet: "ABC...",   // Who created the beat
    shared: true               // Can others use this beat?
  },

  // Or traditional uploaded beat
  battleBeat: {
    audioUrl: "https://example.com/beat.mp3",
    title: "Battle Beat #1",
    bpm: 140
  },

  // Battle rounds with Strudel backing
  rounds: [
    {
      roundNumber: 1,
      challenger: {
        lyrics: "...",
        audioUrl: "...",
        strudelBacking: null  // Optional Strudel additions
      },
      opponent: {
        lyrics: "...",
        audioUrl: "...",
        strudelBacking: 's("bd*4").lpf(500)' // Custom beat variation
      }
    }
  ]
}
```

### NFT Metadata with Strudel

```javascript
// NFT with embedded Strudel music
{
  mint_address: "SOL...",
  name: "Bio-Beat #42",
  description: "Fungal rhythm encoded as live-codeable music",

  // Traditional music fields
  animation_url: "https://example.com/track.mp3",

  // NEW: Strudel Code as NFT Attribute
  attributes: [
    {
      trait_type: "Strudel Pattern",
      value: 's("bd [sd bd] bd sd, hh*16").bank("RolandTR909")'
    },
    {
      trait_type: "Bio-Code",
      value: "Mycelium growth pattern #42"
    },
    {
      trait_type: "BPM",
      value: 120,
      display_type: "number"
    },
    {
      trait_type: "Generative",
      value: true,
      display_type: "boolean"
    }
  ],

  properties: {
    category: "audio",
    strudelCode: 's("bd [sd bd] bd sd").room(0.5)',
    playable: true,           // Can be played in browser
    remixable: true,          // Can be modified and remixed
    bioData: {                // Biodiversity metadata
      species: "Fungus",
      pattern: "growth_cycle_42"
    }
  }
}
```

---

## 🗄️ IndexedDB Schema Updates

Update `local-db-manager.js` to include Strudel fields:

```javascript
// Add to tracks object store
if (!db.objectStoreNames.contains('tracks')) {
  const trackStore = db.createObjectStore('tracks', {
    keyPath: 'id',
    autoIncrement: true
  });
  trackStore.createIndex('userWallet', 'userWallet');
  trackStore.createIndex('genre', 'genre');
  trackStore.createIndex('hasStrudelPattern', 'strudelPattern', {
    unique: false,
    multiEntry: false
  });
  trackStore.createIndex('bpm', 'bpm');
}

// Add Strudel patterns store (for saved patterns)
if (!db.objectStoreNames.contains('strudel_patterns')) {
  const patternStore = db.createObjectStore('strudel_patterns', {
    keyPath: 'id',
    autoIncrement: true
  });
  patternStore.createIndex('userWallet', 'userWallet');
  patternStore.createIndex('category', 'category');
  patternStore.createIndex('createdAt', 'createdAt');
}

// Add mixer presets store
if (!db.objectStoreNames.contains('mixer_presets')) {
  const mixerStore = db.createObjectStore('mixer_presets', {
    keyPath: 'id',
    autoIncrement: true
  });
  mixerStore.createIndex('userWallet', 'userWallet');
  mixerStore.createIndex('name', 'name');
}
```

---

## 🎛️ Mixer Integration with Local Tracks

### Connect Sampler to IndexedDB

```javascript
// public/scripts/sampler-local-tracks.js

class SamplerLocalTracks {
  constructor() {
    this.availableTracks = [];
  }

  /**
   * Load tracks from local database
   */
  async loadLocalTracks(filters = {}) {
    if (!window.localDB) {
      console.warn('LocalDB not available');
      return [];
    }

    // Get all user's tracks
    const tracks = await window.localDB.getTracks({
      userWallet: window.walletManager?.connectedWallet,
      status: 'published',
      ...filters
    });

    this.availableTracks = tracks;
    return tracks;
  }

  /**
   * Load track into sampler pad
   */
  async loadTrackToPad(trackId, padIndex) {
    const track = this.availableTracks.find(t => t.id === trackId);
    if (!track) {
      console.error('Track not found:', trackId);
      return false;
    }

    // If track has Strudel pattern, use it
    if (track.strudelPattern) {
      this.loadStrudelPattern(track.strudelPattern, padIndex);
      return true;
    }

    // Otherwise load audio URL
    if (track.audioFileUrl) {
      await this.loadAudioToPad(track.audioFileUrl, padIndex);
      return true;
    }

    return false;
  }

  /**
   * Load Strudel pattern instead of audio
   */
  loadStrudelPattern(patternCode, padIndex) {
    // Store pattern code on pad element
    const pad = document.querySelector(`[data-pad="${padIndex}"]`);
    if (pad) {
      pad.dataset.strudelPattern = patternCode;
      pad.dataset.mode = 'strudel';
      pad.classList.add('strudel-mode');
    }
  }

  /**
   * Load audio file to pad
   */
  async loadAudioToPad(audioUrl, padIndex) {
    const pad = document.querySelector(`[data-pad="${padIndex}"]`);
    if (pad) {
      pad.dataset.audioUrl = audioUrl;
      pad.dataset.mode = 'audio';
      pad.classList.add('audio-mode');
    }
  }

  /**
   * Convert track to Strudel pattern (basic)
   */
  async generateStrudelFromTrack(trackId) {
    const track = this.availableTracks.find(t => t.id === trackId);
    if (!track) return null;

    // Basic pattern generation based on BPM and genre
    const patterns = {
      'rap': `s("bd sd, ~ cp, hh*8").cpm(${track.bpm})`,
      'reggae': `s("bd ~ bd ~, ~ cp ~ cp, hh*4").cpm(${track.bpm})`,
      'dancehall': `s("bd*2 [~ bd]*2, cp ~ cp ~, hh*16").cpm(${track.bpm})`,
      'afrobeat': `s("bd ~ bd [~ bd], ~ cp ~ cp, hh*8").cpm(${track.bpm})`,
      'default': `s("bd sd bd sd").cpm(${track.bpm})`
    };

    return patterns[track.genre] || patterns.default;
  }
}

window.samplerLocalTracks = new SamplerLocalTracks();
```

---

## 🎤 Rap Battle Strudel Integration

### Battle Beat Creator

```javascript
// public/scripts/battle-strudel-player.js

class BattleStrudelPlayer {
  constructor() {
    this.currentPattern = null;
    this.isPlaying = false;
  }

  /**
   * Initialize Strudel for battle
   */
  async initialize() {
    // Strudel is loaded globally via CDN
    if (typeof initStrudel !== 'undefined') {
      initStrudel();
      console.log('✅ Strudel initialized for battle');
      return true;
    }
    return false;
  }

  /**
   * Create battle beat with Strudel
   */
  createBattleBeat(bpm = 140, style = 'rap') {
    const patterns = {
      rap: `stack(
        s("bd sd, ~ cp, hh*8"),
        s("~ ~ ~ ~").sometimes(x => x.s("~ 808"))
      ).cpm(${bpm}).room(0.2)`,

      trap: `stack(
        s("bd*2 [~ bd], ~ cp ~ cp, hh*16"),
        s("~ ~ 808:1 ~").fast(2)
      ).cpm(${bpm}).lpf(perlin.range(500, 2000))`,

      boom_bap: `s("bd ~ sd ~, ~ ~ cp ~, hh*4").cpm(${bpm}).room(0.4)`,

      drill: `stack(
        s("bd ~ bd [~ bd], ~ ~ cp ~, hh*8"),
        s("[~ 808]*4").fast(2)
      ).cpm(${bpm}).lpf(800)`,

      conscious: `stack(
        s("bd ~ sd ~, ~ ~ cp ~, hh*2"),
        note("c2 ~ e2 ~").s("sawtooth").lpf(600)
      ).cpm(${bpm}).room(0.5)`
    };

    return patterns[style] || patterns.rap;
  }

  /**
   * Play battle beat
   */
  play(patternCode) {
    try {
      hush(); // Stop any playing patterns
      eval(patternCode + '.play()');
      this.currentPattern = patternCode;
      this.isPlaying = true;
      console.log('🎵 Battle beat playing');
    } catch (error) {
      console.error('❌ Strudel error:', error);
    }
  }

  /**
   * Stop battle beat
   */
  stop() {
    if (typeof hush !== 'undefined') {
      hush();
      this.isPlaying = false;
      console.log('⏹️ Battle beat stopped');
    }
  }

  /**
   * Save battle beat to database
   */
  async saveBattleBeat(battleId, patternCode, bpm) {
    const battle = await window.localDB.getBattle(battleId);
    if (!battle) return false;

    battle.strudelBeat = {
      code: patternCode,
      bpm: bpm,
      creatorWallet: window.walletManager?.connectedWallet,
      shared: true,
      createdAt: new Date().toISOString()
    };

    await window.localDB.saveBattle(battle);
    return true;
  }
}

window.battleStrudelPlayer = new BattleStrudelPlayer();
```

---

## 💎 NFT Strudel Player Component

```javascript
// public/scripts/nft-strudel-player.js

class NFTStrudelPlayer {
  constructor() {
    this.activeNFT = null;
  }

  /**
   * Play NFT's embedded Strudel pattern
   */
  playNFTMusic(nft) {
    // Extract Strudel pattern from NFT attributes
    const strudelAttr = nft.attributes?.find(
      attr => attr.trait_type === 'Strudel Pattern'
    );

    if (!strudelAttr) {
      console.warn('No Strudel pattern in this NFT');
      return false;
    }

    const patternCode = strudelAttr.value;

    try {
      hush();
      eval(patternCode + '.play()');
      this.activeNFT = nft;
      console.log(`🎵 Playing NFT: ${nft.name}`);
      return true;
    } catch (error) {
      console.error('❌ Error playing NFT music:', error);
      return false;
    }
  }

  /**
   * Stop NFT music
   */
  stop() {
    if (typeof hush !== 'undefined') {
      hush();
      this.activeNFT = null;
    }
  }

  /**
   * Remix NFT pattern
   */
  remixNFT(nft, modifications = {}) {
    const original = nft.attributes?.find(
      attr => attr.trait_type === 'Strudel Pattern'
    )?.value;

    if (!original) return null;

    // Apply modifications
    let remixed = original;

    if (modifications.speed) {
      remixed = `(${remixed}).fast(${modifications.speed})`;
    }

    if (modifications.filter) {
      remixed = `(${remixed}).lpf(${modifications.filter})`;
    }

    if (modifications.room) {
      remixed = `(${remixed}).room(${modifications.room})`;
    }

    if (modifications.delay) {
      remixed = `(${remixed}).delay(${modifications.delay})`;
    }

    return remixed;
  }

  /**
   * Save remixed NFT pattern as new track
   */
  async saveRemix(originalNFT, remixedPattern) {
    const remixTrack = {
      title: `${originalNFT.name} (Remix)`,
      genre: 'remix',
      strudelPattern: remixedPattern,
      description: `Remix of ${originalNFT.name}`,
      bpm: null, // Extract from pattern
      isRemix: true,
      originalNFT: originalNFT.mint_address
    };

    const result = await window.formAdapter.submitTrack(remixTrack);
    return result;
  }
}

window.nftStrudelPlayer = new NFTStrudelPlayer();
```

---

## 🔄 Track-to-Strudel Pattern Converter

```javascript
// public/scripts/track-to-strudel-converter.js

class TrackToStrudelConverter {
  /**
   * Convert track metadata to Strudel pattern
   */
  convert(track) {
    const { genre, bpm, key, audioAnalysis } = track;

    // Base pattern by genre
    let pattern = this.getGenrePattern(genre, bpm);

    // Add key/scale if available
    if (key) {
      pattern = this.addHarmony(pattern, key);
    }

    // Add complexity based on audio analysis
    if (audioAnalysis) {
      pattern = this.enhanceFromAnalysis(pattern, audioAnalysis);
    }

    return pattern;
  }

  /**
   * Generate base pattern by genre
   */
  getGenrePattern(genre, bpm = 120) {
    const patterns = {
      rap: `s("bd sd, ~ cp, hh*8").cpm(${bpm})`,
      reggae: `s("bd ~ bd ~, ~ cp ~ cp, hh*4").cpm(${bpm})`,
      dancehall: `s("bd*2 [~ bd]*2, cp ~ cp ~, hh*16").cpm(${bpm})`,
      afrobeat: `s("bd ~ bd [~ bd], ~ cp ~ cp, hh*8 hh*8").cpm(${bpm})`,
      'hip-hop': `s("bd ~ sd ~, ~ ~ cp ~, hh*4").cpm(${bpm})`,
      trap: `s("bd*2 [~ bd], ~ cp ~ cp, hh*16").cpm(${bpm})`,
      'boom-bap': `s("bd ~ sd ~, ~ ~ cp ~, hh*4").cpm(${bpm})`,
      dub: `s("bd ~ ~ ~, ~ ~ cp ~, hh*2").cpm(${bpm}).room(0.9)`,
      default: `s("bd sd bd sd").cpm(${bpm})`
    };

    return patterns[genre] || patterns.default;
  }

  /**
   * Add harmonic content based on key
   */
  addHarmony(pattern, key) {
    const keyMap = {
      'C Major': 'c d e f g a b',
      'A Minor': 'a b c d e f g',
      'G Major': 'g a b c d e fs',
      'E Minor': 'e fs g a b c d',
      // Add more keys as needed
    };

    const scale = keyMap[key] || 'c d e f g a b';

    return `stack(
      ${pattern},
      note("${scale}").s("sawtooth").lpf(800).slow(4)
    )`;
  }

  /**
   * Enhance pattern from audio analysis
   */
  enhanceFromAnalysis(pattern, analysis) {
    let enhanced = pattern;

    // Add complexity based on energy
    if (analysis.energy > 0.7) {
      enhanced = `(${enhanced}).sometimes(x => x.fast(2))`;
    }

    // Add variation based on danceability
    if (analysis.danceability > 0.6) {
      enhanced = `(${enhanced}).off(1/8, x => x.s("808"))`;
    }

    return enhanced;
  }
}

window.trackToStrudelConverter = new TrackToStrudelConverter();
```

---

## 📝 Usage Examples

### Load Local Tracks in Sampler

```javascript
// In sampler.astro
async function initSampler() {
  // Load user's tracks
  const tracks = await window.samplerLocalTracks.loadLocalTracks({
    genre: 'rap'
  });

  // Display tracks in track browser
  renderTrackBrowser(tracks);

  // Load track to pad
  document.querySelectorAll('.track-item').forEach((item, index) => {
    item.addEventListener('click', async () => {
      const trackId = parseInt(item.dataset.trackId);
      await window.samplerLocalTracks.loadTrackToPad(trackId, index % 16);
    });
  });
}
```

### Battle Beat Creation

```javascript
// In battle/[id].astro
async function createBattleBeat() {
  await window.battleStrudelPlayer.initialize();

  // Create beat
  const beatCode = window.battleStrudelPlayer.createBattleBeat(140, 'trap');

  // Play it
  window.battleStrudelPlayer.play(beatCode);

  // Save to battle
  await window.battleStrudelPlayer.saveBattleBeat(battleId, beatCode, 140);
}
```

### NFT Music Player

```javascript
// In NFT detail page
async function playNFTMusic(nft) {
  const success = window.nftStrudelPlayer.playNFTMusic(nft);

  if (success) {
    console.log('✅ NFT music playing');
  } else {
    // Fallback to traditional audio
    playAudioFile(nft.animation_url);
  }
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Data Layer
- [x] Update IndexedDB schema with Strudel fields
- [x] Add Strudel pattern storage
- [x] Update form adapter for Strudel tracks

### Phase 2: Sampler Integration
- [ ] Create sampler-local-tracks.js
- [ ] Add track browser to sampler UI
- [ ] Implement drag-and-drop tracks to pads
- [ ] Add Strudel mode toggle for pads

### Phase 3: Battle Integration
- [ ] Create battle-strudel-player.js
- [ ] Add beat creator UI to battle page
- [ ] Implement beat selection/sharing
- [ ] Add Strudel playback during battles

### Phase 4: NFT Integration
- [ ] Create nft-strudel-player.js
- [ ] Add Strudel player to NFT cards
- [ ] Implement remix functionality
- [ ] Add "Save Remix" feature

### Phase 5: Converters
- [ ] Create track-to-strudel-converter.js
- [ ] Implement audio analysis (optional)
- [ ] Add pattern generation algorithms
- [ ] Create pattern library/presets

---

**Ready to make WorldBridger music truly live and remixable!** 🎵

Built with ❤️ for Kakuma Refugee Camp
