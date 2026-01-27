/**
 * NFT Strudel Player
 * Plays and remixes music NFTs with embedded Strudel patterns
 *
 * Features:
 * - Play NFTs with Strudel patterns
 * - Play NFTs with audio URLs
 * - Remix and modify NFT patterns
 * - Save remixed patterns as new tracks
 * - Display NFT metadata and attributes
 * - Support for Metaplex NFT standard
 */

class NFTStrudelPlayer {
  constructor() {
    this.currentNFT = null;
    this.currentPattern = null;
    this.isPlaying = false;
    this.strudelReady = false;
    this.remixedPattern = null;
  }

  /**
   * Initialize Strudel for NFT playback
   */
  async initialize() {
    // Check if Strudel is loaded
    if (typeof initStrudel !== 'undefined') {
      try {
        initStrudel();
        this.strudelReady = true;
        console.log('✅ NFT Strudel Player initialized');
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
   * Load NFT from IndexedDB
   */
  async loadNFT(nftId) {
    if (!window.localDB) {
      console.error('LocalDB not available');
      return null;
    }

    try {
      const nft = await this.getNFT(nftId);
      if (!nft) {
        console.error('NFT not found:', nftId);
        return null;
      }

      this.currentNFT = nft;
      console.log(`🎵 Loaded NFT: ${nft.name}`);
      return nft;
    } catch (error) {
      console.error('Error loading NFT:', error);
      return null;
    }
  }

  /**
   * Play NFT music
   */
  async playNFT(nftId) {
    const nft = await this.loadNFT(nftId);
    if (!nft) return false;

    // Check if NFT has Strudel pattern
    if (nft.metadata?.strudelPattern) {
      return this.playStrudelPattern(nft.metadata.strudelPattern);
    }

    // Check if NFT has music URL
    if (nft.metadata?.animation_url || nft.metadata?.audio_url) {
      const url = nft.metadata.animation_url || nft.metadata.audio_url;
      return this.playAudioURL(url);
    }

    // Try to generate pattern from metadata
    if (window.trackToStrudelConverter) {
      const pattern = this.generatePatternFromNFT(nft);
      if (pattern) {
        return this.playStrudelPattern(pattern);
      }
    }

    console.warn('NFT has no playable music');
    return false;
  }

  /**
   * Play Strudel pattern
   */
  playStrudelPattern(patternCode) {
    if (!this.strudelReady) {
      console.warn('⚠️ Strudel not ready');
      return false;
    }

    try {
      hush(); // Stop any playing patterns
      eval(patternCode + '.play()');
      this.currentPattern = patternCode;
      this.isPlaying = true;
      console.log('🎵 Playing Strudel pattern');
      return true;
    } catch (error) {
      console.error('❌ Strudel error:', error);
      return false;
    }
  }

  /**
   * Play audio URL (fallback for non-Strudel NFTs)
   */
  playAudioURL(url) {
    // Create or reuse audio element
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
      });
    }

    try {
      this.audioElement.src = url;
      this.audioElement.play();
      this.isPlaying = true;
      console.log('🎧 Playing audio URL');
      return true;
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      return false;
    }
  }

  /**
   * Stop playback
   */
  stop() {
    // Stop Strudel
    if (typeof hush !== 'undefined') {
      hush();
    }

    // Stop audio
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    this.isPlaying = false;
    this.currentPattern = null;
    console.log('⏹️ Playback stopped');
  }

  /**
   * Remix current pattern
   */
  remix(modifications = {}) {
    if (!this.currentPattern) {
      console.warn('No pattern to remix');
      return null;
    }

    let remixed = this.currentPattern;

    // Apply modifications
    if (modifications.speed) {
      remixed = `(${remixed}).fast(${modifications.speed})`;
    }

    if (modifications.slow) {
      remixed = `(${remixed}).slow(${modifications.slow})`;
    }

    if (modifications.filter) {
      remixed = `(${remixed}).lpf(${modifications.filter})`;
    }

    if (modifications.reverb) {
      remixed = `(${remixed}).room(${modifications.reverb})`;
    }

    if (modifications.delay) {
      remixed = `(${remixed}).delay(${modifications.delay})`;
    }

    if (modifications.gain) {
      remixed = `(${remixed}).gain(${modifications.gain})`;
    }

    if (modifications.crush) {
      remixed = `(${remixed}).crush(${modifications.crush})`;
    }

    if (modifications.distortion) {
      remixed = `(${remixed}).distort(${modifications.distortion})`;
    }

    // Advanced modifications
    if (modifications.reverse) {
      remixed = `(${remixed}).rev()`;
    }

    if (modifications.chop) {
      remixed = `(${remixed}).chop(${modifications.chop})`;
    }

    if (modifications.stutter) {
      remixed = `(${remixed}).stut(${modifications.stutter}, 0.5, 0.1)`;
    }

    this.remixedPattern = remixed;
    console.log('🎚️ Pattern remixed');
    return remixed;
  }

  /**
   * Play remixed pattern
   */
  playRemix() {
    if (!this.remixedPattern) {
      console.warn('No remix to play');
      return false;
    }

    return this.playStrudelPattern(this.remixedPattern);
  }

  /**
   * Save remix as new track
   */
  async saveRemixAsTrack(metadata = {}) {
    if (!this.remixedPattern || !this.currentNFT) {
      console.error('No remix or NFT to save');
      return false;
    }

    const wallet = window.walletManager?.connectedWallet;
    if (!wallet) {
      console.error('Wallet not connected');
      return false;
    }

    try {
      const track = {
        userWallet: wallet,
        title: metadata.title || `${this.currentNFT.name} (Remix)`,
        genre: metadata.genre || 'remix',
        bpm: metadata.bpm || this.extractBPMFromNFT(),
        strudelPattern: this.remixedPattern,
        originalNFT: this.currentNFT.mint_address,
        coverArtUrl: this.currentNFT.metadata?.image,
        description: `Remixed from NFT: ${this.currentNFT.name}`,
        isRemix: true,
        status: 'published'
      };

      const savedTrack = await window.localDB.saveTrack(track);
      console.log('💾 Remix saved as track:', savedTrack.id);

      // Award XP
      if (window.formAdapter) {
        await window.formAdapter.awardXP(wallet, 75, 'nft_remix', `Remixed NFT: ${this.currentNFT.name}`);
      }

      return savedTrack;
    } catch (error) {
      console.error('Error saving remix:', error);
      return false;
    }
  }

  /**
   * Generate Strudel pattern from NFT metadata
   */
  generatePatternFromNFT(nft) {
    // Extract attributes that can be converted to music
    const attributes = nft.metadata?.attributes || [];

    // Try to find music-related attributes
    const bpm = this.findAttribute(attributes, ['bpm', 'tempo', 'beats_per_minute']);
    const genre = this.findAttribute(attributes, ['genre', 'style', 'category']);
    const energy = this.findAttribute(attributes, ['energy', 'intensity', 'vibe']);

    // If we have a track-to-Strudel converter, use it
    if (window.trackToStrudelConverter) {
      const trackData = {
        genre: genre || 'experimental',
        bpm: bpm || 120,
        energy: energy || 0.5,
        title: nft.name
      };
      return window.trackToStrudelConverter.convert(trackData);
    }

    // Fallback: Generate basic pattern
    const baseBPM = bpm || 120;
    return `s("bd sd, hh*8").cpm(${baseBPM}).room(0.2)`;
  }

  /**
   * Extract BPM from NFT metadata
   */
  extractBPMFromNFT() {
    if (!this.currentNFT?.metadata?.attributes) return 120;

    const bpm = this.findAttribute(
      this.currentNFT.metadata.attributes,
      ['bpm', 'tempo', 'beats_per_minute']
    );

    return parseInt(bpm) || 120;
  }

  /**
   * Find attribute by possible names
   */
  findAttribute(attributes, possibleNames) {
    for (const attr of attributes) {
      const traitType = (attr.trait_type || '').toLowerCase();
      if (possibleNames.includes(traitType)) {
        return attr.value;
      }
    }
    return null;
  }

  /**
   * Get NFT from IndexedDB
   */
  async getNFT(nftId) {
    const transaction = window.localDB.db.transaction(['nfts'], 'readonly');
    const store = transaction.objectStore('nfts');

    return new Promise((resolve) => {
      const request = store.get(nftId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  /**
   * Get all music NFTs for user
   */
  async getUserMusicNFTs() {
    const wallet = window.walletManager?.connectedWallet;
    if (!wallet) return [];

    const transaction = window.localDB.db.transaction(['nfts'], 'readonly');
    const store = transaction.objectStore('nfts');
    const index = store.index('ownerWallet');

    return new Promise((resolve) => {
      const request = index.getAll(wallet);
      request.onsuccess = () => {
        // Filter for music NFTs only
        const musicNFTs = request.result.filter(nft =>
          nft.metadata?.animation_url ||
          nft.metadata?.audio_url ||
          nft.metadata?.strudelPattern ||
          (nft.metadata?.attributes || []).some(attr =>
            attr.trait_type?.toLowerCase() === 'music' ||
            attr.trait_type?.toLowerCase() === 'sound'
          )
        );
        resolve(musicNFTs);
      };
      request.onerror = () => resolve([]);
    });
  }

  /**
   * Render NFT player UI
   */
  renderPlayer(container, nftId) {
    if (!container) return;

    const html = `
      <div class="nft-player" id="nft-player-${nftId}">
        <div class="nft-player-header">
          <h3>🎵 NFT Music Player</h3>
          <button class="close-btn" onclick="this.closest('.nft-player').remove()">✕</button>
        </div>

        <div class="nft-info" id="nft-info-${nftId}">
          <div class="nft-loading">Loading NFT...</div>
        </div>

        <div class="player-controls">
          <button id="play-btn-${nftId}" class="btn-play">▶ Play</button>
          <button id="stop-btn-${nftId}" class="btn-stop" disabled>⏹ Stop</button>
          <button id="remix-btn-${nftId}" class="btn-remix" disabled>🎚️ Remix</button>
        </div>

        <div class="remix-controls" id="remix-controls-${nftId}" style="display: none;">
          <h4>Remix Controls</h4>
          <div class="remix-sliders">
            <div class="slider-group">
              <label>Speed: <span id="speed-value-${nftId}">1.0</span></label>
              <input type="range" id="speed-${nftId}" min="0.5" max="2" step="0.1" value="1" />
            </div>
            <div class="slider-group">
              <label>Filter: <span id="filter-value-${nftId}">1000</span> Hz</label>
              <input type="range" id="filter-${nftId}" min="200" max="5000" step="100" value="1000" />
            </div>
            <div class="slider-group">
              <label>Reverb: <span id="reverb-value-${nftId}">0.2</span></label>
              <input type="range" id="reverb-${nftId}" min="0" max="1" step="0.1" value="0.2" />
            </div>
            <div class="slider-group">
              <label>Delay: <span id="delay-value-${nftId}">0</span></label>
              <input type="range" id="delay-${nftId}" min="0" max="1" step="0.1" value="0" />
            </div>
          </div>

          <div class="remix-actions">
            <button id="apply-remix-btn-${nftId}" class="btn-apply">⚡ Apply Remix</button>
            <button id="save-remix-btn-${nftId}" class="btn-save">💾 Save as Track</button>
          </div>
        </div>

        <div class="pattern-display" id="pattern-display-${nftId}" style="display: none;">
          <h4>Strudel Pattern</h4>
          <pre id="pattern-code-${nftId}"></pre>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Load NFT data and attach events
    this.loadNFTData(nftId);
    this.attachPlayerEvents(nftId);
  }

  /**
   * Load and display NFT data
   */
  async loadNFTData(nftId) {
    const nft = await this.loadNFT(nftId);
    if (!nft) return;

    const infoContainer = document.getElementById(`nft-info-${nftId}`);

    const html = `
      <div class="nft-display">
        <img src="${nft.metadata?.image || '/images/default-nft.png'}" alt="${nft.name}" class="nft-image" />
        <div class="nft-details">
          <h4>${nft.name}</h4>
          <p class="nft-description">${nft.metadata?.description || 'No description'}</p>
          <div class="nft-attributes">
            ${this.renderAttributes(nft.metadata?.attributes || [])}
          </div>
          <div class="nft-meta">
            <span class="nft-symbol">${nft.symbol}</span>
            <span class="nft-mint">${this.truncateMint(nft.mint_address)}</span>
          </div>
        </div>
      </div>
    `;

    infoContainer.innerHTML = html;
  }

  /**
   * Render NFT attributes
   */
  renderAttributes(attributes) {
    if (!attributes.length) return '<p class="no-attributes">No attributes</p>';

    return attributes.map(attr => `
      <div class="attribute">
        <span class="trait-type">${attr.trait_type}</span>
        <span class="trait-value">${attr.value}</span>
      </div>
    `).join('');
  }

  /**
   * Truncate mint address for display
   */
  truncateMint(mint) {
    if (!mint) return '';
    return `${mint.substring(0, 4)}...${mint.substring(mint.length - 4)}`;
  }

  /**
   * Attach event listeners to player
   */
  attachPlayerEvents(nftId) {
    const playBtn = document.getElementById(`play-btn-${nftId}`);
    const stopBtn = document.getElementById(`stop-btn-${nftId}`);
    const remixBtn = document.getElementById(`remix-btn-${nftId}`);
    const applyRemixBtn = document.getElementById(`apply-remix-btn-${nftId}`);
    const saveRemixBtn = document.getElementById(`save-remix-btn-${nftId}`);

    playBtn?.addEventListener('click', async () => {
      const success = await this.playNFT(nftId);
      if (success) {
        playBtn.disabled = true;
        stopBtn.disabled = false;
        remixBtn.disabled = false;

        // Show pattern if available
        if (this.currentPattern) {
          document.getElementById(`pattern-code-${nftId}`).textContent = this.currentPattern;
          document.getElementById(`pattern-display-${nftId}`).style.display = 'block';
        }
      }
    });

    stopBtn?.addEventListener('click', () => {
      this.stop();
      playBtn.disabled = false;
      stopBtn.disabled = true;
    });

    remixBtn?.addEventListener('click', () => {
      const remixControls = document.getElementById(`remix-controls-${nftId}`);
      remixControls.style.display = remixControls.style.display === 'none' ? 'block' : 'none';
    });

    // Slider events
    ['speed', 'filter', 'reverb', 'delay'].forEach(param => {
      const slider = document.getElementById(`${param}-${nftId}`);
      const valueSpan = document.getElementById(`${param}-value-${nftId}`);

      slider?.addEventListener('input', (e) => {
        valueSpan.textContent = e.target.value;
      });
    });

    applyRemixBtn?.addEventListener('click', () => {
      const modifications = {
        speed: parseFloat(document.getElementById(`speed-${nftId}`).value),
        filter: parseInt(document.getElementById(`filter-${nftId}`).value),
        reverb: parseFloat(document.getElementById(`reverb-${nftId}`).value),
        delay: parseFloat(document.getElementById(`delay-${nftId}`).value)
      };

      const remixed = this.remix(modifications);
      if (remixed) {
        document.getElementById(`pattern-code-${nftId}`).textContent = remixed;
        this.playRemix();
      }
    });

    saveRemixBtn?.addEventListener('click', async () => {
      const title = prompt('Enter a title for your remix:', `${this.currentNFT.name} Remix`);
      if (!title) return;

      const saved = await this.saveRemixAsTrack({ title });
      if (saved) {
        alert(`✅ Remix saved as track! +75 XP`);
      } else {
        alert('❌ Failed to save remix');
      }
    });
  }

  /**
   * Render NFT gallery with music filter
   */
  async renderMusicNFTGallery(container) {
    if (!container) return;

    const nfts = await this.getUserMusicNFTs();

    let html = `
      <div class="music-nft-gallery">
        <h2>🎵 Music NFT Collection</h2>
        <div class="nft-grid">
    `;

    if (nfts.length === 0) {
      html += '<p class="no-nfts">No music NFTs found</p>';
    } else {
      nfts.forEach(nft => {
        html += `
          <div class="nft-card" data-nft-id="${nft.id}">
            <img src="${nft.metadata?.image || '/images/default-nft.png'}" alt="${nft.name}" />
            <h3>${nft.name}</h3>
            <button class="play-nft-btn" data-nft-id="${nft.id}">▶ Play</button>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach play button events
    document.querySelectorAll('.play-nft-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const nftId = parseInt(btn.dataset.nftId);
        await this.playNFT(nftId);
      });
    });
  }
}

// Create global instance
window.nftStrudelPlayer = new NFTStrudelPlayer();

console.log('🎨 NFT Strudel Player loaded');
