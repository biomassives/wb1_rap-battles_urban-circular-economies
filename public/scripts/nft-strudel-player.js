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
    this.dbReady = false;
    this.dbInitPromise = null;
  }

  /**
   * Wait for localDB to be available
   */
  async waitForDB() {
    if (this.dbReady && window.localDB?.db) return true;

    if (this.dbInitPromise) return this.dbInitPromise;

    this.dbInitPromise = new Promise(async (resolve) => {
      let attempts = 0;
      while (!window.localDB?.db && attempts < 100) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      this.dbReady = !!window.localDB?.db;
      if (!this.dbReady) {
        console.warn('⚠️ LocalDB not available after waiting');
      }
      resolve(this.dbReady);
    });

    return this.dbInitPromise;
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
    // Wait for DB to be available
    const dbReady = await this.waitForDB();
    if (!dbReady) {
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

      // Log metadata format for debugging
      const hasWBMeta = !!nft.metadata?.worldbridger_metadata;
      console.log(`🎵 Loaded NFT: ${nft.name} (${hasWBMeta ? 'WorldBridger format' : 'Legacy format'})`);

      return nft;
    } catch (error) {
      console.error('Error loading NFT:', error);
      return null;
    }
  }

  /**
   * Play NFT music
   * Supports both legacy metadata and new worldbridger_metadata format
   */
  async playNFT(nftId) {
    const nft = await this.loadNFT(nftId);
    if (!nft) return false;

    // Check for WorldBridger metadata format (new)
    const wbMeta = nft.metadata?.worldbridger_metadata;
    if (wbMeta) {
      // Check for Strudel pattern in worldbridger format
      if (wbMeta.beat?.strudel_pattern) {
        console.log('🎵 Playing WorldBridger NFT with Strudel pattern');
        return this.playStrudelPattern(wbMeta.beat.strudel_pattern);
      }

      // Check for audio in IPFS storage
      if (wbMeta.storage?.audio_ipfs) {
        console.log('🎵 Playing WorldBridger NFT from IPFS');
        const ipfsUrl = this.resolveIPFSUrl(wbMeta.storage.audio_ipfs);
        return this.playAudioURL(ipfsUrl);
      }

      // Check for beat in IPFS storage
      if (wbMeta.storage?.beat_ipfs) {
        console.log('🎵 Playing WorldBridger beat from IPFS');
        const ipfsUrl = this.resolveIPFSUrl(wbMeta.storage.beat_ipfs);
        return this.playAudioURL(ipfsUrl);
      }

      // Check bucket reference
      if (wbMeta.storage?.bucket_ref) {
        console.log('🎵 Playing WorldBridger NFT from bucket');
        return this.playAudioURL(wbMeta.storage.bucket_ref);
      }
    }

    // Legacy format: Check if NFT has Strudel pattern
    if (nft.metadata?.strudelPattern) {
      return this.playStrudelPattern(nft.metadata.strudelPattern);
    }

    // Legacy format: Check if NFT has music URL
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
   * Resolve IPFS URL to gateway URL
   */
  resolveIPFSUrl(ipfsRef) {
    if (!ipfsRef) return null;

    // Already a full URL
    if (ipfsRef.startsWith('http://') || ipfsRef.startsWith('https://')) {
      return ipfsRef;
    }

    // IPFS hash or ipfs:// URL
    const hash = ipfsRef.replace('ipfs://', '').replace('/ipfs/', '');

    // Use multiple gateways for reliability
    const gateways = [
      `https://ipfs.io/ipfs/${hash}`,
      `https://gateway.pinata.cloud/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://dweb.link/ipfs/${hash}`
    ];

    // Return first gateway (could implement fallback logic)
    return gateways[0];
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
   * Supports both legacy and worldbridger_metadata formats
   */
  generatePatternFromNFT(nft) {
    if (!nft?.metadata) return null;

    const meta = nft.metadata;

    // Check WorldBridger metadata first (new format)
    const wbMeta = meta.worldbridger_metadata;
    if (wbMeta) {
      // If the NFT already has a Strudel pattern, return it
      if (wbMeta.beat?.strudel_pattern) {
        return wbMeta.beat.strudel_pattern;
      }

      // Generate pattern from beat info
      if (wbMeta.beat) {
        const bpm = wbMeta.customizations?.bpm || wbMeta.beat.original_bpm || 120;
        const beatName = wbMeta.beat.name || 'custom';

        // Use beat ID to generate genre-appropriate pattern
        const beatId = wbMeta.beat.id || '';
        let basePattern;

        if (beatId.includes('trap') || beatId.includes('808')) {
          basePattern = `stack(s("bd*2 ~ bd ~"), s("~ sd ~ sd"), s("hh*8")).cpm(${bpm / 4})`;
        } else if (beatId.includes('boom') || beatId.includes('bap')) {
          basePattern = `stack(s("bd ~ bd sd"), s("hh*4")).cpm(${bpm / 4})`;
        } else if (beatId.includes('drill')) {
          basePattern = `stack(s("bd ~ ~ bd ~ ~ bd ~"), s("~ ~ sd ~ ~ sd ~ ~"), s("hh*16")).cpm(${bpm / 4})`;
        } else if (beatId.includes('reggae') || beatId.includes('dancehall')) {
          basePattern = `stack(s("bd ~ bd ~"), s("~ sd ~ sd"), s("~ hh ~ hh")).cpm(${bpm / 4})`;
        } else if (beatId.includes('afro')) {
          basePattern = `stack(s("bd bd ~ bd"), s("~ ~ sd ~"), s("hh hh hh hh")).cpm(${bpm / 4})`;
        } else {
          basePattern = `stack(s("bd sd bd sd"), s("hh*8")).cpm(${bpm / 4})`;
        }

        return basePattern;
      }
    }

    // Legacy format: Extract attributes
    const attributes = meta.attributes || [];

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
    return `s("bd sd, hh*8").cpm(${baseBPM / 4}).room(0.2)`;
  }

  /**
   * Extract BPM from NFT metadata
   * Supports both legacy and worldbridger_metadata formats
   */
  extractBPMFromNFT() {
    if (!this.currentNFT?.metadata) return 120;

    const meta = this.currentNFT.metadata;

    // Check WorldBridger metadata first
    const wbMeta = meta.worldbridger_metadata;
    if (wbMeta) {
      // Customized BPM takes priority
      if (wbMeta.customizations?.bpm) {
        return parseInt(wbMeta.customizations.bpm) || 120;
      }
      // Original beat BPM
      if (wbMeta.beat?.original_bpm) {
        return parseInt(wbMeta.beat.original_bpm) || 120;
      }
    }

    // Legacy format: check attributes
    if (!meta.attributes) return 120;

    const bpm = this.findAttribute(
      meta.attributes,
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
    // Wait for DB to be ready
    const dbReady = await this.waitForDB();
    if (!dbReady || !window.localDB?.db) {
      console.warn('⚠️ Cannot get NFT: LocalDB not available');
      return null;
    }

    try {
      const transaction = window.localDB.db.transaction(['nfts'], 'readonly');
      const store = transaction.objectStore('nfts');

      return new Promise((resolve) => {
        const request = store.get(nftId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Error getting NFT:', error);
      return null;
    }
  }

  /**
   * Check if an NFT has playable music content
   * Supports both legacy and worldbridger_metadata formats
   */
  isPlayableNFT(nft) {
    if (!nft?.metadata) return false;

    const meta = nft.metadata;

    // Check WorldBridger metadata format (new)
    const wbMeta = meta.worldbridger_metadata;
    if (wbMeta) {
      // Has Strudel pattern
      if (wbMeta.beat?.strudel_pattern) return true;

      // Has audio storage references
      if (wbMeta.storage?.audio_ipfs) return true;
      if (wbMeta.storage?.beat_ipfs) return true;
      if (wbMeta.storage?.bucket_ref) return true;

      // Is a battle recording type
      if (wbMeta.type === 'battle_recording') return true;
    }

    // Legacy format checks
    if (meta.animation_url) return true;
    if (meta.audio_url) return true;
    if (meta.strudelPattern) return true;

    // Check attributes for music-related traits
    const attributes = meta.attributes || [];
    const hasMusicTrait = attributes.some(attr => {
      const traitType = (attr.trait_type || '').toLowerCase();
      return traitType === 'music' ||
             traitType === 'sound' ||
             traitType === 'audio' ||
             traitType === 'beat' ||
             traitType === 'strudel';
    });
    if (hasMusicTrait) return true;

    return false;
  }

  /**
   * Get all music NFTs for user
   * Supports both legacy and worldbridger_metadata formats
   */
  async getUserMusicNFTs() {
    const wallet = window.walletManager?.connectedWallet;
    if (!wallet) {
      console.warn('⚠️ Cannot get music NFTs: No wallet connected');
      return [];
    }

    // Wait for DB to be ready
    const dbReady = await this.waitForDB();
    if (!dbReady || !window.localDB?.db) {
      console.warn('⚠️ Cannot get music NFTs: LocalDB not available');
      return [];
    }

    try {
      const transaction = window.localDB.db.transaction(['nfts'], 'readonly');
      const store = transaction.objectStore('nfts');
      const index = store.index('ownerWallet');

      return new Promise((resolve) => {
        const request = index.getAll(wallet);
        request.onsuccess = () => {
          // Filter for music NFTs only using the new checker
          const musicNFTs = (request.result || []).filter(nft => this.isPlayableNFT(nft));
          console.log(`🎵 Found ${musicNFTs.length} playable music NFTs out of ${request.result?.length || 0} total`);
          resolve(musicNFTs);
        };
        request.onerror = (error) => {
          console.error('Error fetching user NFTs:', error);
          resolve([]);
        };
      });
    } catch (error) {
      console.error('Error in getUserMusicNFTs:', error);
      return [];
    }
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
      html += '<p class="no-nfts">No music NFTs found. Create battle recordings to see them here!</p>';
    } else {
      nfts.forEach(nft => {
        // Use standardized data for display
        const musicData = this.getStandardizedMusicData(nft);
        const sourceIcon = musicData?.strudelPattern ? '✨' :
                          musicData?.audioUrl ? '🎧' : '🎵';
        const formatBadge = musicData?.isWorldBridger ? 'WB' : '';

        html += `
          <div class="nft-card" data-nft-id="${nft.id}">
            <img src="${musicData?.image || '/images/default-nft.png'}" alt="${nft.name}" />
            <div class="nft-card-info">
              <h3>${sourceIcon} ${nft.name}</h3>
              <div class="nft-card-meta">
                <span class="nft-bpm">${musicData?.bpm || '?'} BPM</span>
                ${formatBadge ? `<span class="nft-format-badge">${formatBadge}</span>` : ''}
              </div>
            </div>
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

  /**
   * Get standardized music data from any NFT format
   * Returns a unified format for the sampler to use
   */
  getStandardizedMusicData(nft) {
    if (!nft?.metadata) return null;

    const meta = nft.metadata;
    const wbMeta = meta.worldbridger_metadata;

    // Build standardized result
    const result = {
      id: nft.id,
      name: nft.name,
      image: meta.image || '/images/default-nft.png',
      type: 'unknown',
      source: null,
      strudelPattern: null,
      audioUrl: null,
      bpm: 120,
      genre: 'unknown',
      duration: null,
      isWorldBridger: false
    };

    // WorldBridger format
    if (wbMeta) {
      result.isWorldBridger = true;
      result.type = wbMeta.type || 'battle_recording';
      result.bpm = wbMeta.customizations?.bpm || wbMeta.beat?.original_bpm || 120;

      // Strudel pattern
      if (wbMeta.beat?.strudel_pattern) {
        result.strudelPattern = wbMeta.beat.strudel_pattern;
        result.source = 'strudel';
      }

      // Beat info
      if (wbMeta.beat?.name) {
        result.genre = wbMeta.beat.name;
      }

      // Storage references
      if (wbMeta.storage) {
        if (wbMeta.storage.audio_ipfs) {
          result.audioUrl = this.resolveIPFSUrl(wbMeta.storage.audio_ipfs);
          result.source = result.source || 'ipfs';
        }
        if (wbMeta.storage.beat_ipfs && !result.audioUrl) {
          result.audioUrl = this.resolveIPFSUrl(wbMeta.storage.beat_ipfs);
          result.source = result.source || 'ipfs';
        }
        if (wbMeta.storage.bucket_ref && !result.audioUrl) {
          result.audioUrl = wbMeta.storage.bucket_ref;
          result.source = result.source || 'bucket';
        }
      }

      // Recording info
      if (wbMeta.recording) {
        result.duration = wbMeta.recording.duration_seconds;
      }

      // Vector data available
      if (wbMeta.vector_data) {
        result.hasVectorData = true;
        result.waveformPoints = wbMeta.vector_data.waveform_points;
        result.beatMarkers = wbMeta.vector_data.beat_markers;
      }
    } else {
      // Legacy format
      if (meta.strudelPattern) {
        result.strudelPattern = meta.strudelPattern;
        result.source = 'strudel';
      }

      if (meta.animation_url) {
        result.audioUrl = meta.animation_url;
        result.source = 'url';
      } else if (meta.audio_url) {
        result.audioUrl = meta.audio_url;
        result.source = 'url';
      }

      // Try to get BPM from attributes
      const attributes = meta.attributes || [];
      const bpmAttr = attributes.find(a =>
        ['bpm', 'tempo', 'beats_per_minute'].includes((a.trait_type || '').toLowerCase())
      );
      if (bpmAttr) {
        result.bpm = parseInt(bpmAttr.value) || 120;
      }

      const genreAttr = attributes.find(a =>
        ['genre', 'style', 'category'].includes((a.trait_type || '').toLowerCase())
      );
      if (genreAttr) {
        result.genre = genreAttr.value;
      }
    }

    return result;
  }

  /**
   * Load metadata from a WorldBridger NFT or sampler sequence
   * This is used by the recording pages
   */
  loadFromMetadata(metadata) {
    if (!metadata) return false;

    // Handle worldbridger_metadata format
    if (metadata.worldbridger_metadata) {
      const wbMeta = metadata.worldbridger_metadata;
      if (wbMeta.beat?.strudel_pattern) {
        this.currentPattern = wbMeta.beat.strudel_pattern;
        console.log('✅ Loaded Strudel pattern from WorldBridger metadata');
        return true;
      }
    }

    // Handle direct Strudel pattern
    if (metadata.strudelPattern) {
      this.currentPattern = metadata.strudelPattern;
      console.log('✅ Loaded Strudel pattern from metadata');
      return true;
    }

    // Handle sequence data (from sampler)
    if (metadata.combinedStrudelPattern) {
      this.currentPattern = metadata.combinedStrudelPattern;
      console.log('✅ Loaded combined Strudel pattern from sampler sequence');
      return true;
    }

    console.warn('⚠️ No playable pattern found in metadata');
    return false;
  }
}

// Create global instance
window.nftStrudelPlayer = new NFTStrudelPlayer();

console.log('🎨 NFT Strudel Player loaded');
