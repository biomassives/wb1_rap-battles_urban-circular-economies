/**
 * AutoMoog Mood System v2.0
 *
 * A Mood defines:
 * - Bounds in 3D parameter space
 * - Preferred trajectories or attractors
 * - Modulation depth limits
 * - Energy bias (calm <-> aggressive)
 *
 * Mood transitions are always smooth - no hard resets of oscillators,
 * filters, or envelopes. Musical continuity is non-negotiable.
 */

// ============================================================================
// MOOD DEFINITION
// ============================================================================

class Mood {
  constructor(name, config = {}) {
    this.name = name;

    // Bounds in parameter space (0-1 normalized)
    this.bounds = {
      x: { min: 0, max: 1, center: 0.5 },
      y: { min: 0, max: 1, center: 0.5 },
      z: { min: 0, max: 1, center: 0.5 },
      ...config.bounds
    };

    // Preferred motion characteristics
    this.motion = {
      preferredMode: 'lissajous', // manual, perlin, lorenz, clifford, lissajous, spline
      speed: 1,
      scale: 0.3,
      smoothing: 0.05,
      ...config.motion
    };

    // Lissajous trajectory parameters
    this.lissajous = {
      freqX: 1,
      freqY: 2,
      freqZ: 3,
      ampX: 0.3,
      ampY: 0.3,
      ampZ: 0.25,
      ...config.lissajous
    };

    // Clifford attractor parameters
    this.clifford = {
      preset: 'butterfly', // butterfly, spiral, flower, waves
      ...config.clifford
    };

    // Spline control points for custom trajectories
    this.splinePoints = config.splinePoints || null;

    // Attractor point (position the mood tends toward)
    this.attractor = {
      x: 0.5,
      y: 0.5,
      z: 0.5,
      strength: 0.1, // How strongly it pulls toward center
      ...config.attractor
    };

    // Modulation limits
    this.modulation = {
      maxLFODepth: 0.5,
      maxFilterEnv: 4000,
      maxDrive: 3,
      maxResonance: 0.8,
      ...config.modulation
    };

    // Energy characteristics (performance control biases)
    this.energy = {
      level: 0.5, // 0 = calm, 1 = aggressive
      warmth: 0.5, // 0 = cold/digital, 1 = warm/analog
      density: 0.5, // 0 = sparse, 1 = thick/layered
      chaos: 0.3, // 0 = ordered/predictable, 1 = chaotic
      ...config.energy
    };

    // Voice settings
    this.voice = {
      baseOctave: 3, // MIDI octave for base note
      drift: 0.002, // Oscillator drift amount
      detune: 0.005, // Oscillator detune spread
      ...config.voice
    };

    // Color for visualization (optional)
    this.color = config.color || '#58a6ff';

    // Description for UI
    this.description = config.description || '';
  }

  // Check if a position is within this mood's bounds
  containsPosition(x, y, z) {
    return (
      x >= this.bounds.x.min && x <= this.bounds.x.max &&
      y >= this.bounds.y.min && y <= this.bounds.y.max &&
      z >= this.bounds.z.min && z <= this.bounds.z.max
    );
  }

  // Get the center of this mood's space
  getCenter() {
    return {
      x: this.bounds.x.center,
      y: this.bounds.y.center,
      z: this.bounds.z.center
    };
  }

  // Calculate attraction force toward mood center
  getAttractionForce(x, y, z) {
    const center = this.attractor;
    return {
      x: (center.x - x) * center.strength,
      y: (center.y - y) * center.strength,
      z: (center.z - z) * center.strength
    };
  }

  // Clone this mood (for interpolation)
  clone() {
    return new Mood(this.name, {
      bounds: JSON.parse(JSON.stringify(this.bounds)),
      motion: { ...this.motion },
      lissajous: { ...this.lissajous },
      clifford: { ...this.clifford },
      splinePoints: this.splinePoints ? [...this.splinePoints] : null,
      attractor: { ...this.attractor },
      modulation: { ...this.modulation },
      energy: { ...this.energy },
      voice: { ...this.voice },
      color: this.color,
      description: this.description
    });
  }
}

// ============================================================================
// PRESET MOODS - Carefully designed sonic characters
// ============================================================================

const PRESET_MOODS = {
  // Calm, meditative state - slow evolving pads
  meditation: new Mood('meditation', {
    bounds: {
      x: { min: 0.15, max: 0.5, center: 0.3 },
      y: { min: 0.2, max: 0.5, center: 0.35 },
      z: { min: 0.1, max: 0.35, center: 0.2 }
    },
    motion: {
      preferredMode: 'perlin',
      speed: 0.25,
      scale: 0.12,
      smoothing: 0.02
    },
    attractor: {
      x: 0.3,
      y: 0.35,
      z: 0.2,
      strength: 0.15
    },
    modulation: {
      maxLFODepth: 0.15,
      maxFilterEnv: 800,
      maxDrive: 1.3,
      maxResonance: 0.4
    },
    energy: {
      level: 0.15,
      warmth: 0.75,
      density: 0.25,
      chaos: 0.05
    },
    voice: {
      baseOctave: 3,
      drift: 0.001,
      detune: 0.003
    },
    color: '#6366f1',
    description: 'Calm, meditative pads with slow evolution'
  }),

  // Ambient textures - evolving soundscapes
  ambient: new Mood('ambient', {
    bounds: {
      x: { min: 0.25, max: 0.7, center: 0.45 },
      y: { min: 0.3, max: 0.7, center: 0.5 },
      z: { min: 0.2, max: 0.55, center: 0.35 }
    },
    motion: {
      preferredMode: 'lissajous',
      speed: 0.4,
      scale: 0.22,
      smoothing: 0.03
    },
    lissajous: {
      freqX: 1,
      freqY: 1.5,
      freqZ: 2,
      ampX: 0.2,
      ampY: 0.2,
      ampZ: 0.15
    },
    attractor: {
      x: 0.45,
      y: 0.5,
      z: 0.35,
      strength: 0.08
    },
    modulation: {
      maxLFODepth: 0.35,
      maxFilterEnv: 2000,
      maxDrive: 1.8,
      maxResonance: 0.55
    },
    energy: {
      level: 0.3,
      warmth: 0.65,
      density: 0.45,
      chaos: 0.2
    },
    voice: {
      baseOctave: 3,
      drift: 0.002,
      detune: 0.004
    },
    color: '#8b5cf6',
    description: 'Evolving ambient textures and soundscapes'
  }),

  // Groove - rhythmic, pulsing patterns
  groove: new Mood('groove', {
    bounds: {
      x: { min: 0.4, max: 0.85, center: 0.6 },
      y: { min: 0.4, max: 0.8, center: 0.6 },
      z: { min: 0.45, max: 0.8, center: 0.6 }
    },
    motion: {
      preferredMode: 'lissajous',
      speed: 1.2,
      scale: 0.28,
      smoothing: 0.06
    },
    lissajous: {
      freqX: 2,
      freqY: 3,
      freqZ: 4,
      ampX: 0.22,
      ampY: 0.2,
      ampZ: 0.18
    },
    attractor: {
      x: 0.6,
      y: 0.6,
      z: 0.6,
      strength: 0.04
    },
    modulation: {
      maxLFODepth: 0.6,
      maxFilterEnv: 3500,
      maxDrive: 2.5,
      maxResonance: 0.7
    },
    energy: {
      level: 0.6,
      warmth: 0.5,
      density: 0.6,
      chaos: 0.3
    },
    voice: {
      baseOctave: 3,
      drift: 0.002,
      detune: 0.006
    },
    color: '#10b981',
    description: 'Rhythmic, pulsing grooves with movement'
  }),

  // Deep - bass-heavy, subby tones
  deep: new Mood('deep', {
    bounds: {
      x: { min: 0.1, max: 0.45, center: 0.25 },
      y: { min: 0.1, max: 0.4, center: 0.25 },
      z: { min: 0.3, max: 0.65, center: 0.45 }
    },
    motion: {
      preferredMode: 'perlin',
      speed: 0.5,
      scale: 0.18,
      smoothing: 0.04
    },
    attractor: {
      x: 0.25,
      y: 0.25,
      z: 0.45,
      strength: 0.12
    },
    modulation: {
      maxLFODepth: 0.45,
      maxFilterEnv: 1500,
      maxDrive: 2.8,
      maxResonance: 0.5
    },
    energy: {
      level: 0.5,
      warmth: 0.85,
      density: 0.7,
      chaos: 0.15
    },
    voice: {
      baseOctave: 2,
      drift: 0.0015,
      detune: 0.007
    },
    color: '#0891b2',
    description: 'Deep, bass-heavy tones with warmth'
  }),

  // Aggressive - high energy, distorted
  aggressive: new Mood('aggressive', {
    bounds: {
      x: { min: 0.55, max: 1, center: 0.8 },
      y: { min: 0.5, max: 1, center: 0.75 },
      z: { min: 0.55, max: 1, center: 0.8 }
    },
    motion: {
      preferredMode: 'lorenz',
      speed: 1.6,
      scale: 0.35,
      smoothing: 0.08
    },
    attractor: {
      x: 0.8,
      y: 0.75,
      z: 0.8,
      strength: 0.025
    },
    modulation: {
      maxLFODepth: 0.85,
      maxFilterEnv: 5500,
      maxDrive: 4,
      maxResonance: 0.9
    },
    energy: {
      level: 0.9,
      warmth: 0.35,
      density: 0.85,
      chaos: 0.6
    },
    voice: {
      baseOctave: 3,
      drift: 0.003,
      detune: 0.008
    },
    color: '#ef4444',
    description: 'High energy, aggressive with distortion'
  }),

  // Chaos - experimental, unpredictable
  chaos: new Mood('chaos', {
    bounds: {
      x: { min: 0, max: 1, center: 0.5 },
      y: { min: 0, max: 1, center: 0.5 },
      z: { min: 0.35, max: 1, center: 0.7 }
    },
    motion: {
      preferredMode: 'clifford',
      speed: 2,
      scale: 0.45,
      smoothing: 0.1
    },
    clifford: {
      preset: 'spiral'
    },
    attractor: {
      x: 0.5,
      y: 0.5,
      z: 0.7,
      strength: 0.01
    },
    modulation: {
      maxLFODepth: 1,
      maxFilterEnv: 6000,
      maxDrive: 4,
      maxResonance: 1
    },
    energy: {
      level: 0.75,
      warmth: 0.3,
      density: 0.6,
      chaos: 0.95
    },
    voice: {
      baseOctave: 3,
      drift: 0.005,
      detune: 0.01
    },
    color: '#f97316',
    description: 'Chaotic, experimental and unpredictable'
  }),

  // Ethereal - bright, shimmering, otherworldly
  ethereal: new Mood('ethereal', {
    bounds: {
      x: { min: 0.3, max: 0.7, center: 0.5 },
      y: { min: 0.6, max: 0.95, center: 0.8 },
      z: { min: 0.3, max: 0.7, center: 0.5 }
    },
    motion: {
      preferredMode: 'lissajous',
      speed: 0.6,
      scale: 0.2,
      smoothing: 0.035
    },
    lissajous: {
      freqX: 3,
      freqY: 4,
      freqZ: 5,
      ampX: 0.18,
      ampY: 0.15,
      ampZ: 0.18
    },
    attractor: {
      x: 0.5,
      y: 0.8,
      z: 0.5,
      strength: 0.1
    },
    modulation: {
      maxLFODepth: 0.5,
      maxFilterEnv: 3000,
      maxDrive: 1.5,
      maxResonance: 0.7
    },
    energy: {
      level: 0.4,
      warmth: 0.4,
      density: 0.4,
      chaos: 0.25
    },
    voice: {
      baseOctave: 4,
      drift: 0.002,
      detune: 0.004
    },
    color: '#a855f7',
    description: 'Bright, shimmering, ethereal textures'
  }),

  // Industrial - harsh, metallic, mechanical
  industrial: new Mood('industrial', {
    bounds: {
      x: { min: 0.6, max: 1, center: 0.8 },
      y: { min: 0.3, max: 0.7, center: 0.5 },
      z: { min: 0.6, max: 1, center: 0.8 }
    },
    motion: {
      preferredMode: 'clifford',
      speed: 1.4,
      scale: 0.3,
      smoothing: 0.07
    },
    clifford: {
      preset: 'waves'
    },
    attractor: {
      x: 0.8,
      y: 0.5,
      z: 0.8,
      strength: 0.05
    },
    modulation: {
      maxLFODepth: 0.75,
      maxFilterEnv: 4000,
      maxDrive: 3.5,
      maxResonance: 0.85
    },
    energy: {
      level: 0.8,
      warmth: 0.25,
      density: 0.75,
      chaos: 0.7
    },
    voice: {
      baseOctave: 3,
      drift: 0.004,
      detune: 0.012
    },
    color: '#64748b',
    description: 'Harsh, metallic, mechanical textures'
  })
};

// ============================================================================
// MOOD MANAGER - Handles transitions and interpolation
// ============================================================================

class MoodManager {
  constructor(parameterSpace) {
    this.space = parameterSpace;

    // Current and target moods
    this.currentMood = PRESET_MOODS.ambient;
    this.targetMood = null;

    // Transition state
    this.transitioning = false;
    this.transitionProgress = 0;
    this.transitionDuration = 3; // seconds
    this.transitionStartTime = 0;

    // Interpolated mood values
    this.interpolatedMood = this.currentMood.clone();

    // Performance controls (bias the current mood)
    this.performance = {
      energy: 0.5,
      warmth: 0.5,
      density: 0.5,
      chaos: 0.3
    };

    // Manual override flag
    this._manualOverride = false;

    // Synth voice reference (set externally)
    this.voice = null;

    // Running state
    this._running = false;
    this._lastTime = 0;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now() / 1000;
    this._update();
  }

  stop() {
    this._running = false;
  }

  _update() {
    if (!this._running) {
      requestAnimationFrame(() => this._update());
      return;
    }

    const now = performance.now() / 1000;
    const deltaTime = now - this._lastTime;
    this._lastTime = now;

    // Update transition
    if (this.transitioning) {
      this._updateTransition(deltaTime);
    }

    // Apply mood to parameter space
    this._applyMoodToSpace();

    // Apply mood to voice if connected
    if (this.voice) {
      this._applyMoodToVoice();
    }

    requestAnimationFrame(() => this._update());
  }

  _updateTransition(deltaTime) {
    this.transitionProgress += deltaTime / this.transitionDuration;

    if (this.transitionProgress >= 1) {
      // Transition complete
      this.transitionProgress = 1;
      this.currentMood = this.targetMood;
      this.targetMood = null;
      this.transitioning = false;
    }

    // Smooth interpolation using ease-in-out cubic
    const t = this._easeInOutCubic(this.transitionProgress);
    this._interpolateMoods(t);
  }

  _easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  _interpolateMoods(t) {
    if (!this.targetMood) return;

    const from = this.currentMood;
    const to = this.targetMood;

    // Interpolate bounds
    this.interpolatedMood.bounds = {
      x: {
        min: this._lerp(from.bounds.x.min, to.bounds.x.min, t),
        max: this._lerp(from.bounds.x.max, to.bounds.x.max, t),
        center: this._lerp(from.bounds.x.center, to.bounds.x.center, t)
      },
      y: {
        min: this._lerp(from.bounds.y.min, to.bounds.y.min, t),
        max: this._lerp(from.bounds.y.max, to.bounds.y.max, t),
        center: this._lerp(from.bounds.y.center, to.bounds.y.center, t)
      },
      z: {
        min: this._lerp(from.bounds.z.min, to.bounds.z.min, t),
        max: this._lerp(from.bounds.z.max, to.bounds.z.max, t),
        center: this._lerp(from.bounds.z.center, to.bounds.z.center, t)
      }
    };

    // Interpolate motion (mode switches at midpoint)
    this.interpolatedMood.motion = {
      preferredMode: t < 0.5 ? from.motion.preferredMode : to.motion.preferredMode,
      speed: this._lerp(from.motion.speed, to.motion.speed, t),
      scale: this._lerp(from.motion.scale, to.motion.scale, t),
      smoothing: this._lerp(from.motion.smoothing, to.motion.smoothing, t)
    };

    // Interpolate lissajous
    this.interpolatedMood.lissajous = {
      freqX: this._lerp(from.lissajous.freqX, to.lissajous.freqX, t),
      freqY: this._lerp(from.lissajous.freqY, to.lissajous.freqY, t),
      freqZ: this._lerp(from.lissajous.freqZ, to.lissajous.freqZ, t),
      ampX: this._lerp(from.lissajous.ampX || 0.3, to.lissajous.ampX || 0.3, t),
      ampY: this._lerp(from.lissajous.ampY || 0.3, to.lissajous.ampY || 0.3, t),
      ampZ: this._lerp(from.lissajous.ampZ || 0.25, to.lissajous.ampZ || 0.25, t)
    };

    // Interpolate attractor
    this.interpolatedMood.attractor = {
      x: this._lerp(from.attractor.x, to.attractor.x, t),
      y: this._lerp(from.attractor.y, to.attractor.y, t),
      z: this._lerp(from.attractor.z, to.attractor.z, t),
      strength: this._lerp(from.attractor.strength, to.attractor.strength, t)
    };

    // Interpolate energy
    this.interpolatedMood.energy = {
      level: this._lerp(from.energy.level, to.energy.level, t),
      warmth: this._lerp(from.energy.warmth, to.energy.warmth, t),
      density: this._lerp(from.energy.density, to.energy.density, t),
      chaos: this._lerp(from.energy.chaos, to.energy.chaos, t)
    };

    // Interpolate modulation limits
    this.interpolatedMood.modulation = {
      maxLFODepth: this._lerp(from.modulation.maxLFODepth, to.modulation.maxLFODepth, t),
      maxFilterEnv: this._lerp(from.modulation.maxFilterEnv, to.modulation.maxFilterEnv, t),
      maxDrive: this._lerp(from.modulation.maxDrive, to.modulation.maxDrive, t),
      maxResonance: this._lerp(from.modulation.maxResonance || 0.8, to.modulation.maxResonance || 0.8, t)
    };

    // Interpolate voice settings
    this.interpolatedMood.voice = {
      baseOctave: Math.round(this._lerp(from.voice.baseOctave, to.voice.baseOctave, t)),
      drift: this._lerp(from.voice.drift, to.voice.drift, t),
      detune: this._lerp(from.voice.detune, to.voice.detune, t)
    };

    // Interpolate color
    this.interpolatedMood.color = this._lerpColor(from.color, to.color, t);
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  _lerpColor(colorA, colorB, t) {
    const a = this._hexToRgb(colorA);
    const b = this._hexToRgb(colorB);

    const r = Math.round(this._lerp(a.r, b.r, t));
    const g = Math.round(this._lerp(a.g, b.g, t));
    const bl = Math.round(this._lerp(a.b, b.b, t));

    return `rgb(${r}, ${g}, ${bl})`;
  }

  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 88, g: 166, b: 255 };
  }

  _applyMoodToSpace() {
    const mood = this.transitioning ? this.interpolatedMood : this.currentMood;

    // Apply bounds with performance bias
    const energyBias = (this.performance.energy - 0.5) * 0.3;
    const chaosBias = this.performance.chaos * 0.15;

    const bounds = {
      x: {
        min: Math.max(0, mood.bounds.x.min - energyBias),
        max: Math.min(1, mood.bounds.x.max + energyBias)
      },
      y: {
        min: Math.max(0, mood.bounds.y.min - energyBias),
        max: Math.min(1, mood.bounds.y.max + energyBias)
      },
      z: {
        min: Math.max(0, mood.bounds.z.min + chaosBias),
        max: Math.min(1, mood.bounds.z.max + chaosBias)
      }
    };

    this.space.setBounds(bounds);

    // Apply motion settings if not in manual override
    if (!this._manualOverride) {
      this.space.setMotionMode(mood.motion.preferredMode);
      this.space.setMotionSpeed(mood.motion.speed * (0.5 + this.performance.energy));
      this.space.setMotionScale(mood.motion.scale * (0.5 + this.performance.chaos));
      this.space.setSmoothing(mood.motion.smoothing / (0.5 + this.performance.density));
    }

    // Apply attractor
    if (mood.attractor.strength > 0) {
      this.space.setAttractor(
        mood.attractor.x,
        mood.attractor.y,
        mood.attractor.z,
        mood.attractor.strength
      );
    } else {
      this.space.clearAttractor();
    }

    // Apply lissajous pattern if that mode is active
    if (mood.motion.preferredMode === 'lissajous') {
      this.space.setLissajousPattern(
        mood.lissajous.freqX,
        mood.lissajous.freqY,
        mood.lissajous.freqZ
      );
      this.space.setLissajousAmplitude(
        mood.lissajous.ampX || 0.3,
        mood.lissajous.ampY || 0.3,
        mood.lissajous.ampZ || 0.25
      );
    }

    // Apply clifford preset if that mode is active
    if (mood.motion.preferredMode === 'clifford' && mood.clifford) {
      this.space.setCliffordPreset(mood.clifford.preset);
    }
  }

  _applyMoodToVoice() {
    if (!this.voice) return;

    const mood = this.transitioning ? this.interpolatedMood : this.currentMood;

    // Apply energy-based settings with performance bias
    const energy = mood.energy.level * this.performance.energy;
    const warmth = mood.energy.warmth * this.performance.warmth;
    const density = mood.energy.density * this.performance.density;
    const chaos = mood.energy.chaos * this.performance.chaos;

    // Set voice parameters
    this.voice.setEnergy(energy);
    this.voice.setWarmth(warmth);
    this.voice.setDensity(density);
    this.voice.setChaos(chaos);
  }

  // Transition to a new mood smoothly
  transitionTo(moodName, duration = 3) {
    const mood = PRESET_MOODS[moodName];
    if (!mood) {
      console.warn(`Unknown mood: ${moodName}`);
      return false;
    }

    if (this.transitioning) {
      // If already transitioning, make current the interpolated state
      this.currentMood = this.interpolatedMood.clone();
    }

    this.targetMood = mood;
    this.transitionDuration = Math.max(0.5, duration);
    this.transitionProgress = 0;
    this.transitioning = true;

    console.log(`Transitioning to mood: ${moodName} over ${duration}s`);
    return true;
  }

  // Immediately set mood (no transition - use sparingly!)
  setMood(moodName) {
    const mood = PRESET_MOODS[moodName];
    if (!mood) {
      console.warn(`Unknown mood: ${moodName}`);
      return false;
    }

    this.currentMood = mood;
    this.interpolatedMood = mood.clone();
    this.transitioning = false;
    this.targetMood = null;

    this._applyMoodToSpace();
    return true;
  }

  // Performance control setters
  setEnergy(value) {
    this.performance.energy = Math.max(0, Math.min(1, value));
  }

  setWarmth(value) {
    this.performance.warmth = Math.max(0, Math.min(1, value));
  }

  setDensity(value) {
    this.performance.density = Math.max(0, Math.min(1, value));
  }

  setChaos(value) {
    this.performance.chaos = Math.max(0, Math.min(1, value));
  }

  // Set all performance controls at once
  setPerformance(energy, warmth, density, chaos) {
    this.setEnergy(energy);
    this.setWarmth(warmth);
    this.setDensity(density);
    this.setChaos(chaos);
  }

  // Enable manual control (bypasses mood motion)
  setManualOverride(enabled) {
    this._manualOverride = enabled;
    if (enabled) {
      this.space.setMotionMode('manual');
    }
  }

  // Connect a voice to this mood manager
  setVoice(voice) {
    this.voice = voice;
  }

  // Get current effective mood
  getCurrentMood() {
    return this.transitioning ? this.interpolatedMood : this.currentMood;
  }

  // Get current mood name
  getCurrentMoodName() {
    return this.currentMood.name;
  }

  // Get all available mood names
  getMoodNames() {
    return Object.keys(PRESET_MOODS);
  }

  // Get mood info for UI
  getMoodInfo(moodName) {
    const mood = PRESET_MOODS[moodName];
    if (!mood) return null;

    return {
      name: mood.name,
      description: mood.description,
      color: mood.color,
      energy: mood.energy
    };
  }

  // Get transition progress (0-1)
  getTransitionProgress() {
    return this.transitionProgress;
  }

  isTransitioning() {
    return this.transitioning;
  }

  // Get current mood color
  getCurrentColor() {
    const mood = this.getCurrentMood();
    return mood.color;
  }
}

// ============================================================================
// BROWSER GLOBAL
// ============================================================================

if (typeof window !== 'undefined') {
  window.AutoMoogMoods = {
    Mood,
    PRESET_MOODS,
    MoodManager
  };
}
