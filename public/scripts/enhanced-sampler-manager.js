/**
 * Enhanced Sampler Manager
 * Features:
 * - Sound adjustment controls (volume, pitch, playback rate, filters)
 * - Save/load sample configurations
 * - Microphone recording
 * - Export API for battle/jam interfaces
 */

class EnhancedSamplerManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.pads = new Array(16).fill(null).map(() => ({
      buffer: null,
      url: null,
      name: '',
      volume: 1.0,
      pitch: 0, // Semitones (-12 to +12)
      playbackRate: 1.0, // 0.5 to 2.0
      loop: false,
      filterType: 'none', // 'none', 'lowpass', 'highpass', 'bandpass'
      filterFrequency: 1000,
      filterQ: 1,
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.3
      }
    }));

    this.recordedSamples = []; // Microphone recordings
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordingChunks = [];

    this.presetBanks = {}; // Saved preset banks
    this.currentBank = 'default';
  }

  async init() {
    console.log('Initializing Enhanced Sampler Manager');

    // Initialize Web Audio API
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);

    // Load saved banks from localStorage
    this.loadBanksFromStorage();

    // Setup event listeners
    this.setupEventListeners();

    console.log('Enhanced Sampler initialized');
  }

  setupEventListeners() {
    // Listen for custom events from other components
    window.addEventListener('sampler:loadBank', (e) => {
      this.loadBank(e.detail.bankName);
    });

    window.addEventListener('sampler:exportForBattle', (e) => {
      const samples = this.exportSamplesForBattle();
      window.dispatchEvent(new CustomEvent('sampler:exported', {
        detail: { samples, context: 'battle' }
      }));
    });
  }

  // ==========================================
  // PAD MANAGEMENT
  // ==========================================

  async loadSampleToPad(padIndex, audioFile) {
    if (padIndex < 0 || padIndex >= 16) {
      throw new Error('Invalid pad index');
    }

    try {
      let arrayBuffer;

      if (audioFile instanceof File || audioFile instanceof Blob) {
        arrayBuffer = await audioFile.arrayBuffer();
      } else if (typeof audioFile === 'string') {
        // URL
        const response = await fetch(audioFile);
        arrayBuffer = await response.arrayBuffer();
      }

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.pads[padIndex].buffer = audioBuffer;
      this.pads[padIndex].url = typeof audioFile === 'string' ? audioFile : null;
      this.pads[padIndex].name = audioFile.name || `Sample ${padIndex + 1}`;

      console.log(`Loaded sample to pad ${padIndex}:`, this.pads[padIndex].name);

      // Dispatch event for UI update
      this.dispatchPadUpdate(padIndex);

      return true;
    } catch (error) {
      console.error(`Error loading sample to pad ${padIndex}:`, error);
      throw error;
    }
  }

  async playSample(padIndex, options = {}) {
    if (padIndex < 0 || padIndex >= 16) return;

    const pad = this.pads[padIndex];
    if (!pad.buffer) {
      console.warn(`No sample loaded on pad ${padIndex}`);
      return;
    }

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Create audio source
    const source = this.audioContext.createBufferSource();
    source.buffer = pad.buffer;

    // Apply playback rate (affects both speed and pitch naturally)
    const basePitchShift = Math.pow(2, pad.pitch / 12); // Convert semitones to playback rate
    source.playbackRate.value = pad.playbackRate * basePitchShift;

    // Loop setting
    source.loop = pad.loop;

    // Create gain node for volume control
    const gainNode = this.audioContext.createGain();
    const finalVolume = pad.volume * (options.velocity || 1.0);

    // Apply ADSR envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(
      finalVolume,
      now + pad.envelope.attack
    );
    gainNode.gain.linearRampToValueAtTime(
      finalVolume * pad.envelope.sustain,
      now + pad.envelope.attack + pad.envelope.decay
    );

    // Create filter if specified
    let filterNode = null;
    if (pad.filterType !== 'none') {
      filterNode = this.audioContext.createBiquadFilter();
      filterNode.type = pad.filterType;
      filterNode.frequency.value = pad.filterFrequency;
      filterNode.Q.value = pad.filterQ;
    }

    // Connect nodes
    if (filterNode) {
      source.connect(filterNode);
      filterNode.connect(gainNode);
    } else {
      source.connect(gainNode);
    }
    gainNode.connect(this.masterGain);

    // Start playback
    source.start(0);

    // Apply release envelope on stop
    if (!pad.loop) {
      const duration = pad.buffer.duration / source.playbackRate.value;
      const releaseStart = now + duration - pad.envelope.release;
      gainNode.gain.linearRampToValueAtTime(0, releaseStart + pad.envelope.release);
      source.stop(releaseStart + pad.envelope.release);
    }

    // Return control object
    return {
      source,
      gainNode,
      stop: () => {
        const stopTime = this.audioContext.currentTime + pad.envelope.release;
        gainNode.gain.linearRampToValueAtTime(0, stopTime);
        source.stop(stopTime);
      }
    };
  }

  // ==========================================
  // SOUND ADJUSTMENT CONTROLS
  // ==========================================

  setPadVolume(padIndex, volume) {
    if (padIndex >= 0 && padIndex < 16) {
      this.pads[padIndex].volume = Math.max(0, Math.min(2, volume));
      this.dispatchPadUpdate(padIndex);
    }
  }

  setPadPitch(padIndex, semitones) {
    if (padIndex >= 0 && padIndex < 16) {
      this.pads[padIndex].pitch = Math.max(-12, Math.min(12, semitones));
      this.dispatchPadUpdate(padIndex);
    }
  }

  setPadPlaybackRate(padIndex, rate) {
    if (padIndex >= 0 && padIndex < 16) {
      this.pads[padIndex].playbackRate = Math.max(0.25, Math.min(4, rate));
      this.dispatchPadUpdate(padIndex);
    }
  }

  setPadFilter(padIndex, filterType, frequency, q) {
    if (padIndex >= 0 && padIndex < 16) {
      this.pads[padIndex].filterType = filterType;
      this.pads[padIndex].filterFrequency = frequency;
      this.pads[padIndex].filterQ = q;
      this.dispatchPadUpdate(padIndex);
    }
  }

  setPadEnvelope(padIndex, envelope) {
    if (padIndex >= 0 && padIndex < 16) {
      this.pads[padIndex].envelope = { ...this.pads[padIndex].envelope, ...envelope };
      this.dispatchPadUpdate(padIndex);
    }
  }

  setPadLoop(padIndex, loop) {
    if (padIndex >= 0 && padIndex < 16) {
      this.pads[padIndex].loop = loop;
      this.dispatchPadUpdate(padIndex);
    }
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(2, volume));
    }
  }

  // ==========================================
  // MICROPHONE RECORDING
  // ==========================================

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(stream);
      this.recordingChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordingChunks, { type: 'audio/webm' });
        const recording = {
          blob,
          url: URL.createObjectURL(blob),
          timestamp: Date.now(),
          duration: 0 // Will be calculated when loaded
        };

        this.recordedSamples.push(recording);

        // Dispatch event
        window.dispatchEvent(new CustomEvent('sampler:recordingComplete', {
          detail: { recording, index: this.recordedSamples.length - 1 }
        }));

        console.log('Recording saved:', recording);
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      console.log('Recording started');

      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Stop all tracks
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());

      console.log('Recording stopped');
      return true;
    }
    return false;
  }

  async loadRecordingToPad(recordingIndex, padIndex) {
    if (recordingIndex < 0 || recordingIndex >= this.recordedSamples.length) {
      throw new Error('Invalid recording index');
    }

    const recording = this.recordedSamples[recordingIndex];
    await this.loadSampleToPad(padIndex, recording.blob);
    this.pads[padIndex].name = `Recording ${new Date(recording.timestamp).toLocaleString()}`;
  }

  // ==========================================
  // SAVE/LOAD FUNCTIONALITY
  // ==========================================

  saveBank(bankName) {
    const bank = {
      name: bankName,
      timestamp: Date.now(),
      pads: this.pads.map(pad => ({
        url: pad.url,
        name: pad.name,
        volume: pad.volume,
        pitch: pad.pitch,
        playbackRate: pad.playbackRate,
        loop: pad.loop,
        filterType: pad.filterType,
        filterFrequency: pad.filterFrequency,
        filterQ: pad.filterQ,
        envelope: { ...pad.envelope }
      }))
    };

    this.presetBanks[bankName] = bank;
    this.saveBanksToStorage();

    console.log(`Bank "${bankName}" saved`);

    return bank;
  }

  async loadBank(bankName) {
    const bank = this.presetBanks[bankName];
    if (!bank) {
      throw new Error(`Bank "${bankName}" not found`);
    }

    // Load each pad's settings
    for (let i = 0; i < 16; i++) {
      const padData = bank.pads[i];

      // Restore settings
      this.pads[i].volume = padData.volume;
      this.pads[i].pitch = padData.pitch;
      this.pads[i].playbackRate = padData.playbackRate;
      this.pads[i].loop = padData.loop;
      this.pads[i].filterType = padData.filterType;
      this.pads[i].filterFrequency = padData.filterFrequency;
      this.pads[i].filterQ = padData.filterQ;
      this.pads[i].envelope = { ...padData.envelope };
      this.pads[i].name = padData.name;

      // Reload sample if URL is available
      if (padData.url) {
        try {
          await this.loadSampleToPad(i, padData.url);
        } catch (error) {
          console.warn(`Failed to reload sample for pad ${i}:`, error);
        }
      }
    }

    this.currentBank = bankName;

    console.log(`Bank "${bankName}" loaded`);

    // Dispatch event
    window.dispatchEvent(new CustomEvent('sampler:bankLoaded', {
      detail: { bankName, bank }
    }));
  }

  deleteBank(bankName) {
    delete this.presetBanks[bankName];
    this.saveBanksToStorage();
    console.log(`Bank "${bankName}" deleted`);
  }

  getBankList() {
    return Object.keys(this.presetBanks).map(name => ({
      name,
      timestamp: this.presetBanks[name].timestamp
    }));
  }

  saveBanksToStorage() {
    try {
      localStorage.setItem('samplerBanks', JSON.stringify(this.presetBanks));
    } catch (error) {
      console.error('Error saving banks to storage:', error);
    }
  }

  loadBanksFromStorage() {
    try {
      const stored = localStorage.getItem('samplerBanks');
      if (stored) {
        this.presetBanks = JSON.parse(stored);
        console.log('Loaded banks from storage:', Object.keys(this.presetBanks));
      }
    } catch (error) {
      console.error('Error loading banks from storage:', error);
    }
  }

  // ==========================================
  // INTEGRATION API (for Battle/Jam)
  // ==========================================

  exportSamplesForBattle() {
    // Export only loaded pads with their settings
    return this.pads
      .map((pad, index) => ({
        index,
        name: pad.name,
        hasBuffer: !!pad.buffer,
        url: pad.url,
        settings: {
          volume: pad.volume,
          pitch: pad.pitch,
          playbackRate: pad.playbackRate,
          loop: pad.loop,
          filterType: pad.filterType,
          filterFrequency: pad.filterFrequency,
          filterQ: pad.filterQ,
          envelope: { ...pad.envelope }
        }
      }))
      .filter(pad => pad.hasBuffer);
  }

  exportSamplesForJam() {
    // Similar to battle export but may include additional metadata
    return {
      samples: this.exportSamplesForBattle(),
      bankName: this.currentBank,
      exportedAt: Date.now()
    };
  }

  importSamplesFromExport(exportData) {
    // Load samples from exported data
    exportData.samples.forEach(async (sampleData) => {
      if (sampleData.url) {
        try {
          await this.loadSampleToPad(sampleData.index, sampleData.url);

          // Apply settings
          const settings = sampleData.settings;
          this.pads[sampleData.index].volume = settings.volume;
          this.pads[sampleData.index].pitch = settings.pitch;
          this.pads[sampleData.index].playbackRate = settings.playbackRate;
          this.pads[sampleData.index].loop = settings.loop;
          this.pads[sampleData.index].filterType = settings.filterType;
          this.pads[sampleData.index].filterFrequency = settings.filterFrequency;
          this.pads[sampleData.index].filterQ = settings.filterQ;
          this.pads[sampleData.index].envelope = { ...settings.envelope };
        } catch (error) {
          console.error(`Failed to import sample ${sampleData.index}:`, error);
        }
      }
    });
  }

  // Get current state for battle/jam initialization
  getCurrentState() {
    return {
      pads: this.pads.map((pad, index) => ({
        index,
        loaded: !!pad.buffer,
        name: pad.name,
        settings: {
          volume: pad.volume,
          pitch: pad.pitch,
          playbackRate: pad.playbackRate,
          loop: pad.loop
        }
      })),
      masterVolume: this.masterGain?.gain.value || 1.0,
      currentBank: this.currentBank
    };
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  dispatchPadUpdate(padIndex) {
    window.dispatchEvent(new CustomEvent('sampler:padUpdated', {
      detail: {
        padIndex,
        pad: {
          name: this.pads[padIndex].name,
          hasBuffer: !!this.pads[padIndex].buffer,
          volume: this.pads[padIndex].volume,
          pitch: this.pads[padIndex].pitch,
          playbackRate: this.pads[padIndex].playbackRate,
          loop: this.pads[padIndex].loop,
          filterType: this.pads[padIndex].filterType
        }
      }
    }));
  }

  clearPad(padIndex) {
    if (padIndex >= 0 && padIndex < 16) {
      this.pads[padIndex] = {
        buffer: null,
        url: null,
        name: '',
        volume: 1.0,
        pitch: 0,
        playbackRate: 1.0,
        loop: false,
        filterType: 'none',
        filterFrequency: 1000,
        filterQ: 1,
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.8,
          release: 0.3
        }
      };
      this.dispatchPadUpdate(padIndex);
    }
  }

  clearAllPads() {
    for (let i = 0; i < 16; i++) {
      this.clearPad(i);
    }
  }

  getPadInfo(padIndex) {
    if (padIndex >= 0 && padIndex < 16) {
      return {
        ...this.pads[padIndex],
        hasBuffer: !!this.pads[padIndex].buffer,
        duration: this.pads[padIndex].buffer?.duration || 0
      };
    }
    return null;
  }
}

// Create global instance
window.enhancedSamplerManager = new EnhancedSamplerManager();

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.enhancedSamplerManager.init();
  });
} else {
  window.enhancedSamplerManager.init();
}

console.log('Enhanced Sampler Manager loaded');

export default EnhancedSamplerManager;
