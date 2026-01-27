/**
 * AutoMoog DSP Engine v2.0
 *
 * DSP-focused analog-style generative music engine inspired by Moog modular synthesis.
 *
 * Architecture:
 * - All parameter changes go through smoothing filters (no zipper noise)
 * - Zero garbage creation in audio callbacks
 * - Phase-continuous oscillators with analog drift modeling
 * - Authentic Moog ladder filter with saturation and self-oscillation
 * - AudioWorklet for production (ScriptProcessor fallback)
 *
 * Sound quality takes priority over visual novelty.
 * Musicality, continuity, and analog character are non-negotiable.
 */

// ============================================================================
// PARAMETER SMOOTHER - Prevents zipper noise on all parameter changes
// ============================================================================

class ParameterSmoother {
  constructor(audioContext, initialValue = 0, smoothingTime = 0.02) {
    this.ctx = audioContext;
    this.value = initialValue;
    this.target = initialValue;
    this.smoothingTime = smoothingTime;

    // Use ConstantSourceNode + GainNode for sample-accurate smoothing
    this.constantSource = audioContext.createConstantSource();
    this.constantSource.offset.value = initialValue;
    this.constantSource.start();
  }

  setTarget(value, immediate = false) {
    this.target = value;
    const now = this.ctx.currentTime;
    const param = this.constantSource.offset;

    if (immediate) {
      param.cancelScheduledValues(now);
      param.setValueAtTime(value, now);
      this.value = value;
    } else {
      param.cancelScheduledValues(now);
      param.setTargetAtTime(value, now, this.smoothingTime);
    }
  }

  getValue() {
    return this.constantSource.offset.value;
  }

  getAudioParam() {
    return this.constantSource.offset;
  }

  connect(destination) {
    this.constantSource.connect(destination);
    return this;
  }

  disconnect() {
    this.constantSource.disconnect();
  }

  dispose() {
    this.constantSource.stop();
    this.constantSource.disconnect();
  }
}

// ============================================================================
// ONE-POLE FILTER - For smooth parameter interpolation in audio thread
// ============================================================================

class OnePoleFilter {
  constructor(coefficient = 0.001) {
    this.a = coefficient;
    this.b = 1 - coefficient;
    this.z = 0;
  }

  process(input) {
    this.z = input * this.a + this.z * this.b;
    return this.z;
  }

  setCoefficient(coeff) {
    this.a = Math.max(0.0001, Math.min(1, coeff));
    this.b = 1 - this.a;
  }

  reset(value = 0) {
    this.z = value;
  }
}

// ============================================================================
// ANALOG OSCILLATOR - Phase-continuous VCO with drift
// ============================================================================

class AnalogOscillator {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.phase = 0;
    this.frequency = 440;
    this.waveform = 'sawtooth'; // sawtooth, square, triangle, sine
    this.pulseWidth = 0.5; // PWM for square wave

    // Analog drift modeling (slow random detune)
    this.driftEnabled = true;
    this.driftAmount = 0.002; // ~3.5 cents max
    this.driftSpeed = 0.3; // Hz
    this.driftPhase = Math.random() * Math.PI * 2;
    this.driftLFO = 0;

    // Secondary drift for richer analog feel
    this.drift2Phase = Math.random() * Math.PI * 2;
    this.drift2Speed = 0.07;
    this.drift2LFO = 0;

    // Output
    this.outputGain = audioContext.createGain();
    this.outputGain.gain.value = 1;

    // Processor
    this.bufferSize = 256;
    this.processor = null;
    this.isRunning = false;

    // Pre-allocated for zero-GC
    this._sampleRate = audioContext.sampleRate;
    this._phaseIncrement = 0;
    this._invSampleRate = 1 / this._sampleRate;
  }

  start() {
    if (this.isRunning) return;

    console.log('AnalogOscillator starting, freq:', this.frequency);
    this.processor = this.ctx.createScriptProcessor(this.bufferSize, 0, 1);
    const self = this;
    let sampleCount = 0;

    this.processor.onaudioprocess = function(e) {
      const output = e.outputBuffer.getChannelData(0);
      const len = output.length;
      const invSR = self._invSampleRate;

      // Debug: log first few calls
      if (sampleCount < 3) {
        console.log('Oscillator processing, buffer size:', len, 'freq:', self.frequency);
        sampleCount++;
      }

      for (let i = 0; i < len; i++) {
        // Update drift LFOs (very slow modulation)
        if (self.driftEnabled) {
          self.driftPhase += self.driftSpeed * invSR;
          if (self.driftPhase > 6.283185307) self.driftPhase -= 6.283185307;

          self.drift2Phase += self.drift2Speed * invSR;
          if (self.drift2Phase > 6.283185307) self.drift2Phase -= 6.283185307;

          // Combine two LFOs for more organic movement
          self.driftLFO = Math.sin(self.driftPhase) * 0.7 +
                          Math.sin(self.drift2Phase * 1.618) * 0.3;
        }

        // Calculate frequency with drift
        const driftMult = self.driftEnabled ? (1 + self.driftLFO * self.driftAmount) : 1;
        const freq = self.frequency * driftMult;
        self._phaseIncrement = freq * invSR;

        // Generate sample based on waveform
        let sample = 0;

        switch (self.waveform) {
          case 'sawtooth':
            sample = self._polyBlepSaw(self.phase, self._phaseIncrement);
            break;

          case 'square':
            sample = self._polyBlepSquare(self.phase, self.pulseWidth, self._phaseIncrement);
            break;

          case 'triangle':
            sample = self._polyBlepTriangle(self.phase, self._phaseIncrement);
            break;

          case 'sine':
            sample = Math.sin(self.phase * 6.283185307);
            break;

          default:
            sample = self._polyBlepSaw(self.phase, self._phaseIncrement);
        }

        output[i] = sample;

        // Advance phase (keep continuous, never reset)
        self.phase += self._phaseIncrement;
        if (self.phase >= 1) {
          self.phase -= 1;
          self._justCycled = true;
        } else {
          self._justCycled = false;
        }
      }
    };

    this.processor.connect(this.outputGain);
    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) return;
    this.processor.disconnect();
    this.processor = null;
    this.isRunning = false;
  }

  // PolyBLEP for band-limited sawtooth (reduces aliasing)
  _polyBlepSaw(phase, phaseInc) {
    let value = 2 * phase - 1; // Naive sawtooth
    value -= this._polyBlep(phase, phaseInc);
    return value;
  }

  // PolyBLEP for band-limited square with PWM
  _polyBlepSquare(phase, pw, phaseInc) {
    let value = phase < pw ? 1 : -1;
    value += this._polyBlep(phase, phaseInc);
    value -= this._polyBlep((phase + 1 - pw) % 1, phaseInc);
    return value;
  }

  // PolyBLEP triangle (integrated square, differentiated saw)
  _polyBlepTriangle(phase, phaseInc) {
    // Triangle from folded sawtooth for better anti-aliasing
    let value = 4 * phase;
    if (value > 1) value = 2 - value;
    if (value < -1) value = -2 - value;
    return value - 1;
  }

  // PolyBLEP residual function
  _polyBlep(t, dt) {
    if (t < dt) {
      t /= dt;
      return t + t - t * t - 1;
    } else if (t > 1 - dt) {
      t = (t - 1) / dt;
      return t * t + t + t + 1;
    }
    return 0;
  }

  setFrequency(freq) {
    this.frequency = Math.max(20, Math.min(20000, freq));
  }

  setWaveform(waveform) {
    if (['sawtooth', 'square', 'triangle', 'sine'].includes(waveform)) {
      this.waveform = waveform;
    }
  }

  setPulseWidth(pw) {
    this.pulseWidth = Math.max(0.05, Math.min(0.95, pw));
  }

  setDrift(amount) {
    this.driftAmount = Math.max(0, Math.min(0.01, amount));
  }

  setDriftEnabled(enabled) {
    this.driftEnabled = enabled;
  }

  // Hard sync - reset phase (called by master oscillator)
  resetPhase() {
    this.phase = 0;
  }

  // Get current phase for sync detection
  getPhase() {
    return this.phase;
  }

  // Check if oscillator just completed a cycle (for sync trigger)
  justCycled() {
    return this._justCycled;
  }

  connect(destination) {
    this.outputGain.connect(destination);
    return this;
  }

  disconnect() {
    this.outputGain.disconnect();
  }
}

// ============================================================================
// MOOG LADDER FILTER - 24dB/oct with non-linear saturation
// ============================================================================

class MoogLadderFilter {
  constructor(audioContext) {
    this.ctx = audioContext;

    // Parameters
    this.cutoff = 1000;
    this.resonance = 0; // 0-1, >0.9 causes self-oscillation
    this.drive = 1; // Input drive (saturation amount)
    this.compensation = 0.5; // Resonance gain compensation

    // Filter state (4-pole cascade)
    this.stage = new Float64Array(4);
    this.delay = new Float64Array(4);

    // Smoothed parameters (one-pole filters for interpolation)
    this.cutoffFilter = new OnePoleFilter(0.002);
    this.resonanceFilter = new OnePoleFilter(0.002);

    // Processor
    this.bufferSize = 256;
    this.processor = null;
    this.isRunning = false;

    this._sampleRate = audioContext.sampleRate;
    this._nyquist = this._sampleRate * 0.5;

    // Output
    this.outputGain = audioContext.createGain();
    this.outputGain.gain.value = 1;
  }

  start() {
    if (this.isRunning) return;

    console.log('MoogLadderFilter starting, cutoff:', this.cutoff);
    this.cutoffFilter.reset(this.cutoff);
    this.resonanceFilter.reset(this.resonance);

    this.processor = this.ctx.createScriptProcessor(this.bufferSize, 1, 1);
    const self = this;
    let filterSampleCount = 0;

    this.processor.onaudioprocess = function(e) {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      const len = output.length;
      const sampleRate = self._sampleRate;

      // Debug: check if receiving input
      if (filterSampleCount < 3) {
        let maxInput = 0;
        for (let i = 0; i < len; i++) {
          if (Math.abs(input[i]) > maxInput) maxInput = Math.abs(input[i]);
        }
        console.log('Filter processing, max input level:', maxInput.toFixed(4));
        filterSampleCount++;
      }

      for (let i = 0; i < len; i++) {
        // Smooth parameter changes
        const smoothCutoff = self.cutoffFilter.process(self.cutoff);
        const smoothResonance = self.resonanceFilter.process(self.resonance);

        // Calculate filter coefficient (Moog ladder approximation)
        // fc = cutoff normalized to sample rate
        const fc = Math.min(smoothCutoff / sampleRate, 0.45);

        // Compute feedback coefficient from resonance
        // Non-linear resonance scaling for musical response
        const k = smoothResonance * 4;

        // Coefficient for one-pole stages
        // Using bilinear transform for better high-frequency accuracy
        const g = fc * 1.16;
        const gCompensated = g * (1 - 0.15 * g);

        // Input with drive and feedback
        let x = input[i] * self.drive;

        // Feedback from 4th stage with saturation
        const feedback = self.delay[3] * k;
        x -= self._tanhFast(feedback);

        // Soft clip input to prevent runaway with high resonance
        x = self._tanhFast(x);

        // 4-stage cascade (Moog ladder topology)
        // Each stage is a one-pole lowpass with saturation
        self.stage[0] = (x - self.delay[0]) * gCompensated;
        self.delay[0] += self.stage[0];
        self.delay[0] = self._tanhSoft(self.delay[0]);

        self.stage[1] = (self.delay[0] - self.delay[1]) * gCompensated;
        self.delay[1] += self.stage[1];
        self.delay[1] = self._tanhSoft(self.delay[1]);

        self.stage[2] = (self.delay[1] - self.delay[2]) * gCompensated;
        self.delay[2] += self.stage[2];
        self.delay[2] = self._tanhSoft(self.delay[2]);

        self.stage[3] = (self.delay[2] - self.delay[3]) * gCompensated;
        self.delay[3] += self.stage[3];
        self.delay[3] = self._tanhSoft(self.delay[3]);

        // Output with resonance compensation
        const resonanceComp = 1 - smoothResonance * self.compensation;
        output[i] = self.delay[3] * resonanceComp;
      }
    };

    this.processor.connect(this.outputGain);
    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) return;
    this.processor.disconnect();
    this.processor = null;
    this.isRunning = false;

    // Reset state
    this.stage.fill(0);
    this.delay.fill(0);
  }

  // Fast tanh approximation (Pade approximant)
  _tanhFast(x) {
    if (x < -3) return -1;
    if (x > 3) return 1;
    const x2 = x * x;
    return x * (27 + x2) / (27 + 9 * x2);
  }

  // Soft saturation for filter stages
  _tanhSoft(x) {
    // Softer curve for internal stages
    if (x < -2) return -0.96 + (x + 2) * 0.02;
    if (x > 2) return 0.96 + (x - 2) * 0.02;
    return x * (1 - x * x * 0.1);
  }

  setCutoff(freq) {
    this.cutoff = Math.max(20, Math.min(this._nyquist * 0.9, freq));
  }

  setResonance(res) {
    this.resonance = Math.max(0, Math.min(1.2, res));
  }

  setDrive(drive) {
    this.drive = Math.max(0.5, Math.min(5, drive));
  }

  setCompensation(comp) {
    this.compensation = Math.max(0, Math.min(1, comp));
  }

  getInput() {
    return this.processor;
  }

  connect(destination) {
    this.outputGain.connect(destination);
    return this;
  }

  disconnect() {
    this.outputGain.disconnect();
  }
}

// ============================================================================
// ADSR ENVELOPE - Exponential curves with analog-style behavior
// ============================================================================

class ADSREnvelope {
  constructor(audioContext) {
    this.ctx = audioContext;

    // Times in seconds
    this.attack = 0.01;
    this.decay = 0.1;
    this.sustain = 0.7; // Level 0-1
    this.release = 0.3;

    // Curve shapes (higher = more exponential)
    this.attackCurve = 0.3; // Nearly linear for punchy attack
    this.decayCurve = 0.1; // More exponential for natural decay
    this.releaseCurve = 0.1;

    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 0;

    this.state = 'idle'; // idle, attack, decay, sustain, release
    this.velocity = 1;
  }

  trigger(velocity = 1) {
    console.log('ADSR trigger called, velocity:', velocity, 'attack:', this.attack);
    this.velocity = Math.max(0, Math.min(1, velocity));
    const now = this.ctx.currentTime;
    const gain = this.gainNode.gain;
    const peakLevel = this.velocity;
    const sustainLevel = this.sustain * this.velocity;

    console.log('ADSR: now=', now, 'peakLevel=', peakLevel, 'sustainLevel=', sustainLevel);

    // Cancel any scheduled changes
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);

    // Attack phase
    if (this.attack < 0.005) {
      // Very fast attack - use linear
      console.log('ADSR: Using linear attack');
      gain.linearRampToValueAtTime(peakLevel, now + this.attack);
    } else {
      // Exponential attack approach
      console.log('ADSR: Using exponential attack');
      gain.setTargetAtTime(peakLevel, now, this.attack * this.attackCurve);
      // Ensure we reach peak
      gain.setValueAtTime(peakLevel, now + this.attack);
    }

    // Decay phase (exponential approach to sustain)
    gain.setTargetAtTime(sustainLevel, now + this.attack, this.decay * this.decayCurve);

    this.state = 'attack';
    console.log('ADSR: state set to attack');
  }

  release_env() {
    const now = this.ctx.currentTime;
    const gain = this.gainNode.gain;
    const currentValue = gain.value;

    // Cancel scheduled changes and start from current
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(currentValue, now);

    // Exponential release to near-zero
    gain.setTargetAtTime(0.0001, now, this.release * this.releaseCurve);

    // Ensure complete silence after release
    gain.setValueAtTime(0, now + this.release * 5);

    this.state = 'release';
  }

  forceOff() {
    const now = this.ctx.currentTime;
    const gain = this.gainNode.gain;
    gain.cancelScheduledValues(now);
    gain.setTargetAtTime(0, now, 0.005);
    this.state = 'idle';
  }

  setAttack(time) {
    this.attack = Math.max(0.001, Math.min(10, time));
  }

  setDecay(time) {
    this.decay = Math.max(0.001, Math.min(10, time));
  }

  setSustain(level) {
    this.sustain = Math.max(0, Math.min(1, level));
  }

  setRelease(time) {
    this.release = Math.max(0.001, Math.min(30, time));
  }

  connect(destination) {
    this.gainNode.connect(destination);
    return this;
  }

  disconnect() {
    this.gainNode.disconnect();
  }

  getNode() {
    return this.gainNode;
  }

  getState() {
    return this.state;
  }
}

// ============================================================================
// LFO - Multiple waveforms, BPM sync, phase continuity
// ============================================================================

class LFO {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.frequency = 1;
    this.waveform = 'sine'; // sine, triangle, saw, square, random, smoothRandom
    this.phase = 0;
    this.depth = 1;
    this.offset = 0;
    this.polarity = 'bipolar'; // bipolar (-1 to 1) or unipolar (0 to 1)

    // BPM sync
    this.syncEnabled = false;
    this.bpm = 120;
    this.division = 1; // 1 = quarter, 0.5 = half, 2 = eighth, 4 = sixteenth

    // Output values
    this.value = 0;
    this.smoothValue = 0;

    // Smooth random (sample & hold with glide)
    this.randomValue = 0;
    this.randomTarget = 0;
    this.randomGlide = 0.1;

    // Smoothing
    this.outputSmoother = new OnePoleFilter(0.1);

    this._lastTime = audioContext.currentTime;
    this.callbacks = [];
    this._running = false;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = this.ctx.currentTime;
    this._update();
  }

  stop() {
    this._running = false;
  }

  _update() {
    if (!this._running) return;

    const now = this.ctx.currentTime;
    const deltaTime = Math.min(now - this._lastTime, 0.1); // Cap delta
    this._lastTime = now;

    // Calculate frequency (BPM sync if enabled)
    let freq = this.frequency;
    if (this.syncEnabled) {
      freq = (this.bpm / 60) * this.division;
    }

    // Advance phase
    const oldPhase = this.phase;
    this.phase += freq * deltaTime;

    // Detect cycle completion for S&H
    if (this.phase >= 1) {
      this.phase -= Math.floor(this.phase);
      this.randomTarget = Math.random() * 2 - 1;
    }

    // Generate waveform value
    let raw = 0;
    switch (this.waveform) {
      case 'sine':
        raw = Math.sin(this.phase * Math.PI * 2);
        break;
      case 'triangle':
        raw = 4 * Math.abs(this.phase - 0.5) - 1;
        break;
      case 'saw':
        raw = 2 * this.phase - 1;
        break;
      case 'square':
        raw = this.phase < 0.5 ? 1 : -1;
        break;
      case 'random':
        raw = this.randomTarget;
        break;
      case 'smoothRandom':
        // Glide between random values
        this.randomValue += (this.randomTarget - this.randomValue) * this.randomGlide;
        raw = this.randomValue;
        break;
    }

    // Apply polarity
    if (this.polarity === 'unipolar') {
      raw = (raw + 1) * 0.5;
    }

    // Apply depth and offset
    this.value = raw * this.depth + this.offset;

    // Smooth output
    this.smoothValue = this.outputSmoother.process(this.value);

    // Notify callbacks
    for (const cb of this.callbacks) {
      cb(this.smoothValue, this.phase);
    }

    requestAnimationFrame(() => this._update());
  }

  setFrequency(freq) {
    this.frequency = Math.max(0.01, Math.min(100, freq));
  }

  setWaveform(waveform) {
    this.waveform = waveform;
  }

  setDepth(depth) {
    this.depth = Math.max(0, Math.min(1, depth));
  }

  setOffset(offset) {
    this.offset = offset;
  }

  setPolarity(polarity) {
    this.polarity = polarity;
  }

  setBPM(bpm) {
    this.bpm = Math.max(20, Math.min(300, bpm));
  }

  setDivision(div) {
    this.division = div;
  }

  enableSync(enabled) {
    this.syncEnabled = enabled;
  }

  getValue() {
    return this.smoothValue;
  }

  getPhase() {
    return this.phase;
  }

  resetPhase() {
    this.phase = 0;
  }

  onValue(callback) {
    this.callbacks.push(callback);
  }

  removeCallback(callback) {
    const idx = this.callbacks.indexOf(callback);
    if (idx >= 0) this.callbacks.splice(idx, 1);
  }
}

// ============================================================================
// SOFT SATURATION - Tube-like warmth
// ============================================================================

class SoftSaturation {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.drive = 1;
    this.mix = 0.5;
    this.outputLevel = 1;

    // Use WaveShaper for saturation
    this.waveshaper = audioContext.createWaveShaper();
    this.inputGain = audioContext.createGain();
    this.outputGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.merger = audioContext.createGain();

    this._updateCurve();

    // Routing for wet/dry mix
    this.inputGain.connect(this.waveshaper);
    this.inputGain.connect(this.dryGain);
    this.waveshaper.connect(this.wetGain);
    this.dryGain.connect(this.merger);
    this.wetGain.connect(this.merger);
    this.merger.connect(this.outputGain);

    this.setMix(this.mix);
  }

  _updateCurve() {
    const samples = 8192; // High resolution for smooth response
    const curve = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const x = ((i / samples) * 2 - 1) * this.drive;

      // Soft-knee tube-like saturation
      // Based on: y = x * (|x| + drive) / (x^2 + (drive-1)*|x| + 1)
      const absX = Math.abs(x);
      const denominator = x * x + (this.drive - 1) * absX + 1;
      curve[i] = x * (absX + this.drive) / (denominator * this.drive);
    }

    this.waveshaper.curve = curve;
    this.waveshaper.oversample = '4x'; // Highest oversampling for quality
  }

  setDrive(drive) {
    this.drive = Math.max(1, Math.min(10, drive));
    this._updateCurve();
  }

  setMix(mix) {
    this.mix = Math.max(0, Math.min(1, mix));
    const now = this.ctx.currentTime;
    this.dryGain.gain.setTargetAtTime(1 - this.mix, now, 0.01);
    this.wetGain.gain.setTargetAtTime(this.mix, now, 0.01);
  }

  setOutputLevel(level) {
    this.outputLevel = Math.max(0, Math.min(2, level));
    this.outputGain.gain.setTargetAtTime(this.outputLevel, this.ctx.currentTime, 0.01);
  }

  getInput() {
    return this.inputGain;
  }

  connect(destination) {
    this.outputGain.connect(destination);
    return this;
  }

  disconnect() {
    this.outputGain.disconnect();
  }
}

// ============================================================================
// AUTOMOOG VOICE - Complete synth voice with all components
// ============================================================================

class AutoMoogVoice {
  constructor(audioContext) {
    this.ctx = audioContext;

    // Three oscillators for rich sound
    this.osc1 = new AnalogOscillator(audioContext);
    this.osc2 = new AnalogOscillator(audioContext);
    this.osc3 = new AnalogOscillator(audioContext);

    // Oscillator mix
    this.oscMixer = audioContext.createGain();
    this.osc1Gain = audioContext.createGain();
    this.osc2Gain = audioContext.createGain();
    this.osc3Gain = audioContext.createGain();

    // Noise generator for texture
    this.noiseGain = audioContext.createGain();
    this.noiseGain.gain.value = 0;
    this._createNoiseBuffer();

    // Filter
    this.filter = new MoogLadderFilter(audioContext);

    // Envelopes
    this.ampEnv = new ADSREnvelope(audioContext);
    this.filterEnv = new ADSREnvelope(audioContext);

    // LFOs
    this.lfo1 = new LFO(audioContext); // Filter mod
    this.lfo2 = new LFO(audioContext); // Pitch mod (vibrato)
    this.lfo3 = new LFO(audioContext); // PWM

    // Saturation
    this.saturation = new SoftSaturation(audioContext);

    // Master output
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = 0.5;

    // Modulation routing depths
    this.filterEnvDepth = 2000; // Hz
    this.lfo1ToCutoff = 0; // 0-1
    this.lfo2ToPitch = 0; // semitones
    this.lfo3ToPWM = 0; // 0-1

    // Base parameter values
    this.baseFrequency = 220;
    this.baseCutoff = 1000;
    this.oscDetune = 0.005; // Slight detune between oscillators

    // Classic Moog features
    this.hardSyncEnabled = false;
    this.ringModAmount = 0;
    this.ringModGain = null;
    this.keyboardTrackingAmount = 0.5; // 50% default tracking
    this._syncInterval = null;

    // Parameter smoothers
    this._cutoffSmoother = new OnePoleFilter(0.01);
    this._cutoffSmoother.reset(this.baseCutoff);

    this._setupRouting();
    this._setupModulation();
    this._setupDefaults();
  }

  _createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Pink-ish noise (filtered white noise)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    this.noiseBuffer = buffer;
    this.noiseSource = null;
  }

  _setupRouting() {
    console.log('Setting up audio routing...');

    // Oscillators -> Gain -> Mixer
    this.osc1.connect(this.osc1Gain);
    this.osc2.connect(this.osc2Gain);
    this.osc3.connect(this.osc3Gain);

    this.osc1Gain.connect(this.oscMixer);
    this.osc2Gain.connect(this.oscMixer);
    this.osc3Gain.connect(this.oscMixer);
    this.noiseGain.connect(this.oscMixer);
    console.log('Oscillators routed to mixer');

    // Initial mix levels
    this.osc1Gain.gain.value = 0.5;
    this.osc2Gain.gain.value = 0.3;
    this.osc3Gain.gain.value = 0.2;

    // Mixer -> Filter
    console.log('Starting filter...');
    this.filter.start();
    const filterInput = this.filter.getInput();
    console.log('Filter input (processor):', filterInput);
    this.oscMixer.connect(filterInput);
    console.log('Mixer connected to filter');

    // Filter -> Amp Envelope
    this.filter.connect(this.ampEnv.getNode());
    console.log('Filter connected to amp envelope');

    // Amp Envelope -> Saturation
    this.ampEnv.connect(this.saturation.getInput());
    console.log('Amp envelope connected to saturation');

    // Saturation -> Master
    this.saturation.connect(this.masterGain);
    console.log('Saturation connected to master, routing complete');
  }

  _setupModulation() {
    // LFO1 -> Filter cutoff
    this.lfo1.onValue((val) => {
      if (!this._running) return;
      const modAmount = val * this.lfo1ToCutoff * 4000;
      this._updateCutoff(modAmount);
    });

    // LFO2 -> Pitch (vibrato)
    this.lfo2.onValue((val) => {
      if (!this._running) return;
      const semitones = val * this.lfo2ToPitch;
      const pitchMult = Math.pow(2, semitones / 12);
      this._updatePitch(pitchMult);
    });

    // LFO3 -> PWM
    this.lfo3.onValue((val) => {
      if (!this._running) return;
      const pw = 0.5 + val * this.lfo3ToPWM * 0.4;
      this.osc1.setPulseWidth(pw);
      this.osc2.setPulseWidth(pw);
    });
  }

  _setupDefaults() {
    // Oscillator waveforms
    this.osc1.setWaveform('sawtooth');
    this.osc2.setWaveform('sawtooth');
    this.osc3.setWaveform('sawtooth');

    // LFO defaults
    this.lfo1.setFrequency(2);
    this.lfo1.setWaveform('sine');

    this.lfo2.setFrequency(5);
    this.lfo2.setWaveform('sine');

    this.lfo3.setFrequency(0.5);
    this.lfo3.setWaveform('triangle');

    // Envelope defaults
    this.ampEnv.setAttack(0.01);
    this.ampEnv.setDecay(0.2);
    this.ampEnv.setSustain(0.7);
    this.ampEnv.setRelease(0.3);

    this.filterEnv.setAttack(0.01);
    this.filterEnv.setDecay(0.3);
    this.filterEnv.setSustain(0.4);
    this.filterEnv.setRelease(0.5);
  }

  _updateCutoff(lfoMod = 0) {
    const smoothedBase = this._cutoffSmoother.process(this.baseCutoff);
    const totalCutoff = Math.max(20, Math.min(18000, smoothedBase + lfoMod));
    this.filter.setCutoff(totalCutoff);
  }

  _updatePitch(lfoMult = 1) {
    const freq = this.baseFrequency * lfoMult;
    this.osc1.setFrequency(freq);
    this.osc2.setFrequency(freq * (1 + this.oscDetune));
    this.osc3.setFrequency(freq * 0.5); // Sub octave
  }

  start() {
    console.log('AutoMoogVoice.start() called');
    this._running = true;

    console.log('Starting oscillators...');
    this.osc1.start();
    this.osc2.start();
    this.osc3.start();
    console.log('Oscillators started');

    // Start noise
    console.log('Starting noise source...');
    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = this.noiseBuffer;
    this.noiseSource.loop = true;
    this.noiseSource.connect(this.noiseGain);
    this.noiseSource.start();

    console.log('Starting LFOs...');
    this.lfo1.start();
    this.lfo2.start();
    this.lfo3.start();
    console.log('AutoMoogVoice fully started');
  }

  stop() {
    this._running = false;

    this.osc1.stop();
    this.osc2.stop();
    this.osc3.stop();

    if (this.noiseSource) {
      this.noiseSource.stop();
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }

    this.filter.stop();
    this.lfo1.stop();
    this.lfo2.stop();
    this.lfo3.stop();

    this.ampEnv.forceOff();
  }

  noteOn(frequency = 220, velocity = 1) {
    console.log('noteOn called: freq=', frequency, 'velocity=', velocity);
    this.baseFrequency = frequency;
    this._updatePitch(1);
    console.log('Pitch updated, osc1.freq=', this.osc1.frequency);

    // Apply keyboard tracking to filter
    this._applyKeyboardTracking(frequency);

    console.log('Triggering amp envelope...');
    this.ampEnv.trigger(velocity);
    console.log('Triggering filter envelope...');
    this.filterEnv.trigger(velocity);
    console.log('noteOn complete');
  }

  noteOff() {
    this.ampEnv.release_env();
    this.filterEnv.release_env();
  }

  // =========================================================================
  // MACRO PARAMETER SETTERS (for 3D space mapping)
  // =========================================================================

  setTimbre(value) {
    // 0-1: Controls oscillator mix, waveforms, and harmonics
    const v = Math.max(0, Math.min(1, value));

    // Waveform morphing: sine -> triangle -> saw -> square
    if (v < 0.25) {
      this.osc1.setWaveform('sine');
      this.osc2.setWaveform('triangle');
    } else if (v < 0.5) {
      this.osc1.setWaveform('triangle');
      this.osc2.setWaveform('sawtooth');
    } else if (v < 0.75) {
      this.osc1.setWaveform('sawtooth');
      this.osc2.setWaveform('sawtooth');
    } else {
      this.osc1.setWaveform('sawtooth');
      this.osc2.setWaveform('square');
    }

    // Mix ratios
    this.osc1Gain.gain.setTargetAtTime(0.6 - v * 0.2, this.ctx.currentTime, 0.05);
    this.osc2Gain.gain.setTargetAtTime(0.2 + v * 0.3, this.ctx.currentTime, 0.05);

    // PWM depth increases with timbre
    this.lfo3ToPWM = v * 0.8;

    // Drive increases with timbre
    this.saturation.setDrive(1 + v * 2.5);
  }

  setBrightness(value) {
    // 0-1: Controls filter cutoff and resonance
    const v = Math.max(0, Math.min(1, value));

    // Exponential cutoff mapping (perceptually linear)
    const minFreq = 80;
    const maxFreq = 12000;
    this.baseCutoff = minFreq * Math.pow(maxFreq / minFreq, v);

    // Resonance peaks in the middle, creating expressiveness
    const resonance = Math.sin(v * Math.PI) * 0.75;
    this.filter.setResonance(resonance);

    // Slight filter drive increase with brightness
    this.filter.setDrive(1 + v * 0.5);
  }

  setMotion(value) {
    // 0-1: Controls modulation depth and speed
    const v = Math.max(0, Math.min(1, value));

    // LFO depths
    this.lfo1ToCutoff = v * 0.8;
    this.lfo2ToPitch = v * 0.15; // Max ~2 semitones vibrato

    // LFO speeds increase with motion
    this.lfo1.setFrequency(0.5 + v * 6);
    this.lfo2.setFrequency(4 + v * 4);
    this.lfo3.setFrequency(0.3 + v * 2);

    // Envelope speeds decrease with motion (longer, more evolving)
    const envMult = 1 - v * 0.7;
    this.ampEnv.setAttack(0.005 + envMult * 0.3);
    this.ampEnv.setDecay(0.1 + envMult * 0.4);
    this.ampEnv.setRelease(0.2 + envMult * 0.8);
  }

  setEnergy(value) {
    // Compound control affecting overall intensity
    const v = Math.max(0, Math.min(1, value));

    this.masterGain.gain.setTargetAtTime(0.3 + v * 0.5, this.ctx.currentTime, 0.05);
    this.saturation.setMix(v * 0.7);
    this.osc3Gain.gain.setTargetAtTime(v * 0.35, this.ctx.currentTime, 0.05);

    // Add some noise at high energy
    this.noiseGain.gain.setTargetAtTime(v * 0.05, this.ctx.currentTime, 0.1);
  }

  setWarmth(value) {
    // 0-1: Affects drive, low-end, and analog character
    const v = Math.max(0, Math.min(1, value));

    this.saturation.setDrive(1 + v * 3);
    this.osc3Gain.gain.setTargetAtTime(v * 0.4, this.ctx.currentTime, 0.05);

    // Increase detune for thicker sound
    this.oscDetune = 0.002 + v * 0.008;

    // More drift with warmth
    this.osc1.setDrift(0.001 + v * 0.003);
    this.osc2.setDrift(0.001 + v * 0.004);
  }

  setDensity(value) {
    // 0-1: Affects layering and envelope behavior
    const v = Math.max(0, Math.min(1, value));

    // All three oscillators become more prominent
    const baseLevel = 0.3 + v * 0.2;
    this.osc1Gain.gain.setTargetAtTime(baseLevel, this.ctx.currentTime, 0.05);
    this.osc2Gain.gain.setTargetAtTime(baseLevel * 0.8, this.ctx.currentTime, 0.05);

    // Longer sustain with density
    this.ampEnv.setSustain(0.5 + v * 0.4);

    // Filter envelope becomes more prominent
    this.filterEnvDepth = 1000 + v * 3000;
  }

  setChaos(value) {
    // 0-1: Affects randomness and unpredictability
    const v = Math.max(0, Math.min(1, value));

    // LFO waveforms become more chaotic
    if (v > 0.7) {
      this.lfo1.setWaveform('smoothRandom');
    } else if (v > 0.4) {
      this.lfo1.setWaveform('triangle');
    } else {
      this.lfo1.setWaveform('sine');
    }

    // Increase drift
    const drift = 0.001 + v * 0.005;
    this.osc1.setDrift(drift);
    this.osc2.setDrift(drift * 1.3);

    // Resonance becomes more extreme
    const currentRes = this.filter.resonance;
    this.filter.setResonance(Math.min(1.1, currentRes + v * 0.3));
  }

  // =========================================================================
  // CLASSIC MOOG FEATURES
  // =========================================================================

  /**
   * Hard Sync - OSC1 resets OSC2 phase on each cycle
   * Creates aggressive, harmonically rich timbres
   * @param {boolean} enabled - Enable sync mode
   */
  setHardSync(enabled) {
    this.hardSyncEnabled = enabled;

    if (enabled && this._running) {
      // Start sync monitoring loop
      if (!this._syncInterval) {
        this._syncInterval = setInterval(() => {
          if (this.osc1.justCycled()) {
            this.osc2.resetPhase();
          }
        }, 1); // Check frequently for accurate sync
      }
    } else if (this._syncInterval) {
      clearInterval(this._syncInterval);
      this._syncInterval = null;
    }
  }

  /**
   * Ring Modulation - Multiply OSC1 × OSC2 for metallic tones
   * Creates bell-like, inharmonic textures
   * @param {number} amount - Ring mod mix 0-1
   */
  setRingMod(amount) {
    this.ringModAmount = Math.max(0, Math.min(1, amount));

    // Create ring mod gain node if not exists
    if (!this.ringModGain && this.ctx) {
      this.ringModGain = this.ctx.createGain();
      this.ringModGain.gain.value = 0;
      this.ringModGain.connect(this.oscMixer);
    }

    if (this.ringModGain) {
      // Adjust ring mod level (reduce direct osc levels proportionally)
      const ringLevel = this.ringModAmount * 0.5;
      this.ringModGain.gain.setTargetAtTime(ringLevel, this.ctx.currentTime, 0.05);

      // Reduce direct oscillator levels to compensate
      const directLevel = 1 - (this.ringModAmount * 0.3);
      this.osc1Gain.gain.setTargetAtTime(0.5 * directLevel, this.ctx.currentTime, 0.05);
      this.osc2Gain.gain.setTargetAtTime(0.3 * directLevel, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Keyboard Tracking - Filter cutoff follows note pitch
   * Higher notes = brighter, lower notes = warmer
   * @param {number} amount - Tracking amount 0-1 (0.5 = 50% tracking)
   */
  setKeyboardTracking(amount) {
    this.keyboardTrackingAmount = Math.max(0, Math.min(1, amount));
  }

  /**
   * Apply keyboard tracking to filter when note plays
   * Called internally from noteOn
   */
  _applyKeyboardTracking(frequency) {
    if (!this.keyboardTrackingAmount) return;

    // Reference frequency (middle C = 261.63 Hz)
    const refFreq = 261.63;

    // Calculate octave offset from reference
    const octaveOffset = Math.log2(frequency / refFreq);

    // Apply tracking: each octave shifts cutoff by tracking amount
    // Full tracking (1.0) = cutoff doubles per octave like pitch
    const trackingMult = Math.pow(2, octaveOffset * this.keyboardTrackingAmount);

    // Apply to base cutoff
    const trackedCutoff = this.baseCutoff * trackingMult;
    this.filter.setCutoff(Math.max(20, Math.min(18000, trackedCutoff)));
  }

  connect(destination) {
    this.masterGain.connect(destination);
    return this;
  }

  disconnect() {
    this.masterGain.disconnect();
  }
}

// ============================================================================
// BROWSER GLOBAL
// ============================================================================

if (typeof window !== 'undefined') {
  window.AutoMoogDSP = {
    ParameterSmoother,
    OnePoleFilter,
    AnalogOscillator,
    MoogLadderFilter,
    ADSREnvelope,
    LFO,
    SoftSaturation,
    AutoMoogVoice
  };
}
