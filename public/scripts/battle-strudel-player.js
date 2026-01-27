/**
 * Battle Strudel Player
 * Integrates Strudel live coding into rap battles
 *
 * Features:
 * - Create battle beats with Strudel
 * - Live code during battles
 * - Save and share battle beats
 * - Real-time beat switching
 */

class BattleStrudelPlayer {
  constructor() {
    this.currentPattern = null;
    this.isPlaying = false;
    this.battleId = null;
    this.strudelReady = false;
  }

  /**
   * Initialize Strudel for battle
   */
  async initialize() {
    // Check if Strudel is loaded
    if (typeof initStrudel !== 'undefined') {
      try {
        initStrudel();
        this.strudelReady = true;
        console.log('✅ Strudel initialized for battle');
        return true;
      } catch (error) {
        console.error('❌ Strudel init error:', error);
        return false;
      }
    }

    console.warn('⚠️ Strudel not loaded - add <script src="https://unpkg.com/@strudel/web@1.0.3"></script>');
    return false;
  }

  /**
   * Create battle beat with Strudel
   */
  createBattleBeat(bpm = 140, style = 'rap', options = {}) {
    const {
      intensity = 'medium',  // low, medium, high
      complexity = 'medium',  // simple, medium, complex
      vibe = 'aggressive'     // aggressive, smooth, laid-back, energetic
    } = options;

    // Base patterns by style
    const patterns = {
      rap: this.rapPattern(bpm, intensity),
      trap: this.trapPattern(bpm, complexity),
      boom_bap: this.boomBapPattern(bpm),
      drill: this.drillPattern(bpm),
      conscious: this.consciousPattern(bpm, vibe),
      freestyle: this.freestylePattern(bpm, intensity)
    };

    return patterns[style] || patterns.rap;
  }

  /**
   * Rap battle beat pattern
   */
  rapPattern(bpm, intensity) {
    const patterns = {
      low: `stack(
        s("bd ~ sd ~, ~ ~ cp ~, hh*4")
      ).cpm(${bpm}).room(0.2)`,

      medium: `stack(
        s("bd sd, ~ cp, hh*8"),
        s("~ ~ ~ ~").sometimes(x => x.s("808"))
      ).cpm(${bpm}).room(0.2)`,

      high: `stack(
        s("bd [sd bd] bd sd, ~ cp ~ cp, hh*16"),
        s("[~ 808]*2").fast(2).lpf(600)
      ).cpm(${bpm}).room(0.3)`
    };

    return patterns[intensity] || patterns.medium;
  }

  /**
   * Trap battle beat
   */
  trapPattern(bpm, complexity) {
    const patterns = {
      simple: `stack(
        s("bd*2 [~ bd], ~ cp ~ cp, hh*16")
      ).cpm(${bpm})`,

      medium: `stack(
        s("bd*2 [~ bd], ~ cp ~ cp, hh*16"),
        s("[~ 808]*4").fast(2)
      ).cpm(${bpm}).lpf(perlin.range(500, 2000))`,

      complex: `stack(
        s("bd*2 [[~ bd] bd], ~ cp ~ [cp cp], hh*16 hh*32"),
        s("[~ 808 ~ 808]*2").lpf(800),
        s("~ ~ ~ ~").rarely(x => x.s("crash"))
      ).cpm(${bpm}).room(0.1)`
    };

    return patterns[complexity] || patterns.medium;
  }

  /**
   * Boom Bap classic pattern
   */
  boomBapPattern(bpm) {
    return `stack(
      s("bd ~ sd ~, ~ ~ cp ~, hh*4 hh*2"),
      note("c2 ~ e2 ~").s("sawtooth").lpf(400).slow(2)
    ).cpm(${bpm}).room(0.4)`;
  }

  /**
   * Drill pattern
   */
  drillPattern(bpm) {
    return `stack(
      s("bd ~ bd [~ bd], ~ ~ cp ~, hh*8"),
      s("[~ 808 ~ ~]*2").fast(2).lpf(700),
      s("~ ~ ~ ~").sometimes(x => x.s("rim"))
    ).cpm(${bpm}).lpf(900).room(0.2)`;
  }

  /**
   * Conscious/smooth pattern
   */
  consciousPattern(bpm, vibe) {
    if (vibe === 'smooth') {
      return `stack(
        s("bd ~ ~ ~, ~ sd ~ ~, hh*2"),
        note("<c2 e2 g2 f2>").s("sawtooth").lpf(600).slow(2)
      ).cpm(${bpm}).room(0.6).delay(0.3)`;
    }

    return `stack(
      s("bd ~ sd ~, ~ ~ cp ~, hh*2"),
      note("c2 ~ e2 ~").s("triangle").lpf(500).slow(4)
    ).cpm(${bpm}).room(0.5)`;
  }

  /**
   * Freestyle / experimental pattern
   */
  freestylePattern(bpm, intensity) {
    return `stack(
      s("bd [sd ~] bd sd, ~ cp ~ [cp ~], hh*${intensity === 'high' ? 16 : 8}"),
      note(choose("c2", "e2", "g2", "f2")).s("sawtooth").lpf(perlin.range(400, 1000))
    ).cpm(${bpm}).sometimes(x => x.fast(2)).room(0.3)`;
  }

  /**
   * Play battle beat
   */
  play(patternCode) {
    if (!this.strudelReady) {
      console.warn('⚠️ Strudel not ready');
      return false;
    }

    try {
      hush(); // Stop any playing patterns
      eval(patternCode + '.play()');
      this.currentPattern = patternCode;
      this.isPlaying = true;
      console.log('🎵 Battle beat playing');
      return true;
    } catch (error) {
      console.error('❌ Strudel error:', error);
      return false;
    }
  }

  /**
   * Stop battle beat
   */
  stop() {
    if (typeof hush !== 'undefined') {
      hush();
      this.isPlaying = false;
      this.currentPattern = null;
      console.log('⏹️ Battle beat stopped');
    }
  }

  /**
   * Modify current pattern (live coding)
   */
  modifyPattern(modifications) {
    if (!this.currentPattern) return;

    let modified = this.currentPattern;

    // Apply modifications
    if (modifications.speed) {
      modified = `(${modified}).fast(${modifications.speed})`;
    }

    if (modifications.filter) {
      modified = `(${modified}).lpf(${modifications.filter})`;
    }

    if (modifications.reverb) {
      modified = `(${modified}).room(${modifications.reverb})`;
    }

    if (modifications.delay) {
      modified = `(${modified}).delay(${modifications.delay})`;
    }

    // Play modified version
    this.play(modified);
  }

  /**
   * Save battle beat to database
   */
  async saveBattleBeat(battleId, patternCode, bpm, metadata = {}) {
    if (!window.localDB) {
      console.error('LocalDB not available');
      return false;
    }

    try {
      // Get battle
      const battle = await this.getBattle(battleId);
      if (!battle) {
        console.error('Battle not found');
        return false;
      }

      // Add Strudel beat
      battle.strudelBeat = {
        code: patternCode,
        bpm: bpm,
        creatorWallet: window.walletManager?.connectedWallet,
        shared: metadata.shared !== false,
        createdAt: new Date().toISOString(),
        style: metadata.style || 'rap',
        intensity: metadata.intensity || 'medium'
      };

      // Save battle
      await this.saveBattle(battle);

      console.log(`💾 Battle beat saved to battle ${battleId}`);
      return true;
    } catch (error) {
      console.error('Error saving battle beat:', error);
      return false;
    }
  }

  /**
   * Load battle beat
   */
  async loadBattleBeat(battleId) {
    const battle = await this.getBattle(battleId);
    if (!battle || !battle.strudelBeat) {
      console.warn('No Strudel beat for this battle');
      return null;
    }

    return battle.strudelBeat;
  }

  /**
   * Get battle from IndexedDB
   */
  async getBattle(battleId) {
    const transaction = window.localDB.db.transaction(['battles'], 'readonly');
    const store = transaction.objectStore('battles');

    return new Promise((resolve) => {
      const request = store.get(battleId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  /**
   * Save battle to IndexedDB
   */
  async saveBattle(battle) {
    const transaction = window.localDB.db.transaction(['battles'], 'readwrite');
    const store = transaction.objectStore('battles');

    return new Promise((resolve) => {
      const request = store.put(battle);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  /**
   * Create beat maker UI
   */
  renderBeatMaker(container) {
    if (!container) return;

    const html = `
      <div class="beat-maker-panel">
        <h3>🎵 Battle Beat Creator</h3>

        <div class="beat-controls">
          <div class="control-group">
            <label>Style</label>
            <select id="beat-style">
              <option value="rap">Rap</option>
              <option value="trap">Trap</option>
              <option value="boom_bap">Boom Bap</option>
              <option value="drill">Drill</option>
              <option value="conscious">Conscious</option>
              <option value="freestyle">Freestyle</option>
            </select>
          </div>

          <div class="control-group">
            <label>BPM</label>
            <input type="number" id="beat-bpm" value="140" min="60" max="200" />
          </div>

          <div class="control-group">
            <label>Intensity</label>
            <select id="beat-intensity">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div class="control-group">
            <label>Complexity</label>
            <select id="beat-complexity">
              <option value="simple">Simple</option>
              <option value="medium" selected>Medium</option>
              <option value="complex">Complex</option>
            </select>
          </div>
        </div>

        <div class="beat-actions">
          <button id="create-beat-btn" class="btn-primary">⚡ Create Beat</button>
          <button id="play-beat-btn" class="btn-success" disabled>▶ Play</button>
          <button id="stop-beat-btn" class="btn-danger" disabled>⏹ Stop</button>
          <button id="save-beat-btn" class="btn-info" disabled>💾 Save</button>
        </div>

        <div id="beat-code-display" class="code-display" style="display: none;">
          <label>Strudel Code:</label>
          <pre id="beat-code"></pre>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach listeners
    this.attachBeatMakerEvents();
  }

  /**
   * Attach beat maker event listeners
   */
  attachBeatMakerEvents() {
    const createBtn = document.getElementById('create-beat-btn');
    const playBtn = document.getElementById('play-beat-btn');
    const stopBtn = document.getElementById('stop-beat-btn');
    const saveBtn = document.getElementById('save-beat-btn');

    createBtn?.addEventListener('click', () => {
      const style = document.getElementById('beat-style').value;
      const bpm = parseInt(document.getElementById('beat-bpm').value);
      const intensity = document.getElementById('beat-intensity').value;
      const complexity = document.getElementById('beat-complexity').value;

      const beatCode = this.createBattleBeat(bpm, style, { intensity, complexity });

      // Display code
      document.getElementById('beat-code').textContent = beatCode;
      document.getElementById('beat-code-display').style.display = 'block';

      // Enable buttons
      playBtn.disabled = false;
      saveBtn.disabled = false;

      this.currentPattern = beatCode;
    });

    playBtn?.addEventListener('click', () => {
      this.play(this.currentPattern);
      playBtn.disabled = true;
      stopBtn.disabled = false;
    });

    stopBtn?.addEventListener('click', () => {
      this.stop();
      playBtn.disabled = false;
      stopBtn.disabled = true;
    });

    saveBtn?.addEventListener('click', async () => {
      if (this.battleId && this.currentPattern) {
        const bpm = parseInt(document.getElementById('beat-bpm').value);
        const style = document.getElementById('beat-style').value;
        const intensity = document.getElementById('beat-intensity').value;

        await this.saveBattleBeat(this.battleId, this.currentPattern, bpm, {
          style,
          intensity,
          shared: true
        });

        alert('✅ Battle beat saved!');
      } else {
        alert('❌ No battle ID or pattern');
      }
    });
  }

  /**
   * Set battle ID
   */
  setBattleId(id) {
    this.battleId = id;
  }
}

// Create global instance
window.battleStrudelPlayer = new BattleStrudelPlayer();

console.log('🥊 Battle Strudel Player loaded');
