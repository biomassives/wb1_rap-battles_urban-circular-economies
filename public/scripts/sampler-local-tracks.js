/**
 * Sampler Local Tracks Integration
 * Connects the sampler/mixer to the local IndexedDB track database
 *
 * Features:
 * - Load user's tracks from IndexedDB
 * - Load tracks to sampler pads
 * - Support both audio and Strudel patterns
 * - Generate Strudel patterns from tracks
 * - Drag and drop tracks to pads
 */

class SamplerLocalTracks {
  constructor() {
    this.availableTracks = [];
    this.loaded = false;
  }

  /**
   * Initialize and wait for dependencies
   */
  async initialize() {
    // Wait for localDB
    let attempts = 0;
    while (!window.localDB?.db && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (!window.localDB?.db) {
      console.error('❌ LocalDB not available');
      return false;
    }

    this.loaded = true;
    console.log('✅ Sampler Local Tracks ready');
    return true;
  }

  /**
   * Load tracks from local database
   */
  async loadLocalTracks(filters = {}) {
    if (!this.loaded) {
      await this.initialize();
    }

    const wallet = window.walletManager?.connectedWallet;
    if (!wallet) {
      console.warn('⚠️ No wallet connected - can\'t load tracks');
      return [];
    }

    try {
      // Get tracks from IndexedDB
      const tracks = await window.localDB.getTracks({
        userWallet: wallet,
        status: 'published',
        ...filters
      });

      this.availableTracks = tracks;
      console.log(`📂 Loaded ${tracks.length} local tracks`);
      return tracks;
    } catch (error) {
      console.error('❌ Error loading tracks:', error);
      return [];
    }
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

    console.log(`🎵 Loading track "${track.title}" to pad ${padIndex}`);

    // Check if track has Strudel pattern
    if (track.strudelPattern) {
      this.loadStrudelToPad(track, padIndex);
      return true;
    }

    // Load audio URL
    if (track.audioFileUrl) {
      await this.loadAudioToPad(track, padIndex);
      return true;
    }

    // Generate Strudel pattern if nothing else available
    if (window.trackToStrudelConverter) {
      const pattern = window.trackToStrudelConverter.convert(track);
      track.generatedPattern = pattern;
      this.loadStrudelToPad(track, padIndex);
      return true;
    }

    console.warn('Track has no audio or pattern');
    return false;
  }

  /**
   * Load Strudel pattern to pad
   */
  loadStrudelToPad(track, padIndex) {
    const pad = document.querySelector(`[data-pad="${padIndex}"]`);
    if (!pad) return;

    // Store pattern on pad
    const pattern = track.strudelPattern || track.generatedPattern;
    pad.dataset.strudelPattern = pattern;
    pad.dataset.mode = 'strudel';
    pad.dataset.trackId = track.id;
    pad.dataset.trackTitle = track.title;

    // Visual feedback
    pad.classList.add('strudel-mode');
    pad.classList.add('loaded');

    // Update pad label
    const label = pad.querySelector('.pad-label');
    if (label) {
      label.textContent = track.title.substring(0, 10);
    }

    console.log(`✨ Strudel pattern loaded to pad ${padIndex}`);
  }

  /**
   * Load audio file to pad
   */
  async loadAudioToPad(track, padIndex) {
    const pad = document.querySelector(`[data-pad="${padIndex}"]`);
    if (!pad) return;

    // Store audio URL on pad
    pad.dataset.audioUrl = track.audioFileUrl;
    pad.dataset.mode = 'audio';
    pad.dataset.trackId = track.id;
    pad.dataset.trackTitle = track.title;

    // Visual feedback
    pad.classList.add('audio-mode');
    pad.classList.add('loaded');

    // Update pad label
    const label = pad.querySelector('.pad-label');
    if (label) {
      label.textContent = track.title.substring(0, 10);
    }

    console.log(`🎧 Audio loaded to pad ${padIndex}`);
  }

  /**
   * Get track by ID
   */
  getTrack(trackId) {
    return this.availableTracks.find(t => t.id === trackId);
  }

  /**
   * Filter tracks by genre
   */
  filterByGenre(genre) {
    return this.availableTracks.filter(t => t.genre === genre);
  }

  /**
   * Filter tracks with Strudel patterns
   */
  getStrudelTracks() {
    return this.availableTracks.filter(t => t.strudelPattern);
  }

  /**
   * Render track browser UI
   */
  renderTrackBrowser(container, options = {}) {
    if (!container) return;

    const { showFilters = true, showGenerate = true } = options;

    let html = '<div class="track-browser">';

    // Filters
    if (showFilters) {
      html += `
        <div class="track-filters">
          <select id="genre-filter" class="filter-select">
            <option value="">All Genres</option>
            <option value="rap">Rap</option>
            <option value="reggae">Reggae</option>
            <option value="dancehall">Dancehall</option>
            <option value="afrobeat">Afrobeat</option>
            <option value="hip-hop">Hip-Hop</option>
            <option value="trap">Trap</option>
          </select>
          <select id="mode-filter" class="filter-select">
            <option value="">All Tracks</option>
            <option value="strudel">Strudel Only</option>
            <option value="audio">Audio Only</option>
          </select>
          <button id="refresh-tracks-btn" class="btn-refresh">🔄 Refresh</button>
        </div>
      `;
    }

    // Track list
    html += '<div class="track-list" id="track-list-container">';

    this.availableTracks.forEach((track, index) => {
      const hasStrudel = track.strudelPattern ? '✨' : '';
      const hasAudio = track.audioFileUrl ? '🎧' : '';

      html += `
        <div class="track-item" data-track-id="${track.id}" draggable="true">
          <div class="track-icon">${hasStrudel || hasAudio || '🎵'}</div>
          <div class="track-info">
            <div class="track-title">${track.title}</div>
            <div class="track-meta">${track.genre} ${track.bpm ? `• ${track.bpm} BPM` : ''}</div>
          </div>
          <div class="track-actions">
            ${hasStrudel ? '<span class="badge strudel-badge">STRUDEL</span>' : ''}
            ${showGenerate && !hasStrudel ? '<button class="btn-gen" data-track-id="${track.id}">⚡ Gen</button>' : ''}
          </div>
        </div>
      `;
    });

    html += '</div></div>';

    container.innerHTML = html;

    // Attach event listeners
    this.attachTrackBrowserEvents();
  }

  /**
   * Attach event listeners to track browser
   */
  attachTrackBrowserEvents() {
    // Drag and drop
    document.querySelectorAll('.track-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('trackId', item.dataset.trackId);
      });

      // Click to load to first available pad
      item.addEventListener('click', async () => {
        const trackId = parseInt(item.dataset.trackId);
        const firstEmptyPad = this.findFirstEmptyPad();
        if (firstEmptyPad !== -1) {
          await this.loadTrackToPad(trackId, firstEmptyPad);
        }
      });
    });

    // Generate Strudel pattern buttons
    document.querySelectorAll('.btn-gen').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const trackId = parseInt(btn.dataset.trackId);
        await this.generateAndSaveStrudel(trackId);
      });
    });

    // Filter listeners
    document.getElementById('genre-filter')?.addEventListener('change', (e) => {
      this.filterTracks();
    });

    document.getElementById('mode-filter')?.addEventListener('change', (e) => {
      this.filterTracks();
    });

    document.getElementById('refresh-tracks-btn')?.addEventListener('click', async () => {
      await this.loadLocalTracks();
      this.renderTrackBrowser(document.querySelector('.track-browser-container'));
    });
  }

  /**
   * Find first empty pad
   */
  findFirstEmptyPad() {
    for (let i = 0; i < 16; i++) {
      const pad = document.querySelector(`[data-pad="${i}"]`);
      if (pad && !pad.classList.contains('loaded')) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Generate and save Strudel pattern for track
   */
  async generateAndSaveStrudel(trackId) {
    const track = this.getTrack(trackId);
    if (!track || !window.trackToStrudelConverter) return;

    const pattern = window.trackToStrudelConverter.convert(track);

    // Save pattern to track
    track.strudelPattern = pattern;
    await window.localDB.saveTrack(track);

    console.log(`✨ Generated Strudel pattern for "${track.title}"`);

    // Refresh browser
    const container = document.querySelector('.track-browser-container');
    if (container) {
      this.renderTrackBrowser(container);
    }
  }

  /**
   * Filter tracks in browser
   */
  filterTracks() {
    const genreFilter = document.getElementById('genre-filter')?.value;
    const modeFilter = document.getElementById('mode-filter')?.value;

    let filtered = [...this.availableTracks];

    if (genreFilter) {
      filtered = filtered.filter(t => t.genre === genreFilter);
    }

    if (modeFilter === 'strudel') {
      filtered = filtered.filter(t => t.strudelPattern);
    } else if (modeFilter === 'audio') {
      filtered = filtered.filter(t => t.audioFileUrl);
    }

    // Re-render with filtered tracks
    const original = this.availableTracks;
    this.availableTracks = filtered;

    const container = document.querySelector('.track-browser-container');
    if (container) {
      this.renderTrackBrowser(container);
    }

    this.availableTracks = original;
  }
}

// Create global instance
window.samplerLocalTracks = new SamplerLocalTracks();

console.log('🎛️ Sampler Local Tracks loaded');
