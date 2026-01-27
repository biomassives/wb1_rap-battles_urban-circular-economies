/**
 * Enhanced Sampler Manager
 *
 * Responsibilities:
 * - Manage sampler pads
 * - Schedule sample playback
 * - Expose AudioNode output
 * - Support NFT + Strudel driven playback
 * - Be recordable & composable
 */

class EnhancedSamplerManager {
  constructor(options = {}) {
    this.audioContext =
      options.audioContext ||
      new (window.AudioContext || window.webkitAudioContext)();

    this.output = this.audioContext.createGain();
    this.output.gain.value = options.gain ?? 1.0;
    this.output.connect(this.audioContext.destination);

    this.pads = new Map(); // padId -> AudioBuffer
    this.activeSources = [];
    this.isPlaying = false;
    this.bpm = 120;
  }

  /* --------------------------------------------------
   * Core graph access
   * -------------------------------------------------- */

  getAudioNode() {
    return this.output;
  }

  connect(destination) {
    this.output.disconnect();
    this.output.connect(destination);
  }

  setGain(value) {
    this.output.gain.value = value;
  }

  /* --------------------------------------------------
   * Pad management
   * -------------------------------------------------- */

  async loadSample(padId, source) {
    let arrayBuffer;

    if (typeof source === 'string') {
      const res = await fetch(source);
      arrayBuffer = await res.arrayBuffer();
    } else if (source instanceof ArrayBuffer) {
      arrayBuffer = source;
    } else {
      throw new Error('Unsupported sample source');
    }

    const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.pads.set(padId, buffer);

    console.log(`🔊 Loaded sample pad: ${padId}`);
    return buffer;
  }

  unloadSample(padId) {
    this.pads.delete(padId);
  }

  clearPads() {
    this.pads.clear();
  }

  /* --------------------------------------------------
   * Playback
   * -------------------------------------------------- */

  playPad(padId, time = 0, options = {}) {
    const buffer = this.pads.get(padId);
    if (!buffer) {
      console.warn(`Pad not found: ${padId}`);
      return null;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    if (options.playbackRate) {
      source.playbackRate.value = options.playbackRate;
    }

    const gain = this.audioContext.createGain();
    gain.gain.value = options.gain ?? 1.0;

    source.connect(gain);
    gain.connect(this.output);

    const startTime =
      time > 0 ? time : this.audioContext.currentTime;

    source.start(startTime);
    this.activeSources.push(source);

    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };

    return source;
  }

  stopAll() {
    this.activeSources.forEach(src => {
      try {
        src.stop();
      } catch {}
    });

    this.activeSources = [];
    this.isPlaying = false;
  }

  /* --------------------------------------------------
   * Sequence playback (NFT / Strudel driven)
   * -------------------------------------------------- */

  playSequence(sequence, options = {}) {
    /**
     * sequence format:
     * [
     *   { pad: 'kick', step: 0 },
     *   { pad: 'snare', step: 2 },
     * ]
     */

    if (!Array.isArray(sequence)) {
      console.error('Invalid sequence');
      return;
    }

    this.stopAll();
    this.isPlaying = true;

    this.bpm = options.bpm || this.bpm;
    const stepsPerBar = options.stepsPerBar || 16;
    const secondsPerStep = (60 / this.bpm) / (stepsPerBar / 4);
    const startTime = this.audioContext.currentTime + 0.05;

    sequence.forEach(event => {
      const time =
        startTime + event.step * secondsPerStep;

      this.playPad(event.pad, time, event.options || {});
    });

    console.log('▶ Sampler sequence playing');
  }

  /* --------------------------------------------------
   * NFT helpers
   * -------------------------------------------------- */

  loadFromMetadata(metadata) {
    /**
     * Expected NFT format:
     * {
     *   sampler: {
     *     pads: { kick: 'url', snare: 'url' },
     *     sequence: [...]
     *   }
     * }
     */

    if (!metadata?.sampler) return null;

    const { pads, sequence, bpm } = metadata.sampler;

    if (pads) {
      Object.entries(pads).forEach(([id, src]) => {
        this.loadSample(id, src);
      });
    }

    if (bpm) this.bpm = bpm;

    return sequence || null;
  }

  exportSequence(sequence) {
    return {
      sampler: {
        pads: [...this.pads.keys()],
        sequence,
        bpm: this.bpm
      }
    };
  }

  /* --------------------------------------------------
   * Cleanup
   * -------------------------------------------------- */

  destroy() {
    this.stopAll();
    this.output.disconnect();
    this.audioContext.close();
  }
}

/* --------------------------------------------------
 * Global instance
 * -------------------------------------------------- */

window.enhancedSamplerManager = new EnhancedSamplerManager();

console.log('🎛️ Enhanced Sampler Manager loaded');

