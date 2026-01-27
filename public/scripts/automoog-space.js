/**
 * AutoMoog 3D Parameter Space v2.0
 *
 * Manages the synth's position in a 3D control space where:
 * - X axis = Timbre (oscillator mix, wave shape, drive)
 * - Y axis = Brightness (filter cutoff, resonance)
 * - Z axis = Motion/Energy (LFO depth, envelope speed)
 *
 * Features:
 * - Psychoacoustic parameter mapping (non-linear curves)
 * - Smooth continuous motion with multiple trajectory modes
 * - Generative modulation (Perlin noise, Lorenz, Clifford, Lissajous)
 * - Tempo-aware motion and automation
 * - All outputs pass through smoothing filters
 *
 * Motion rules: No abrupt jumps, no zipper noise, always musical.
 */

// ============================================================================
// PERLIN NOISE - Smooth, natural-feeling random motion
// ============================================================================

class PerlinNoise {
  constructor(seed = Math.random() * 10000) {
    this.seed = seed;
    this.permutation = this._generatePermutation();
  }

  _generatePermutation() {
    const p = new Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

    // Shuffle with seeded random
    let s = this.seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    // Duplicate for overflow
    return [...p, ...p];
  }

  _fade(t) {
    // Quintic fade curve for smoother transitions
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  _lerp(a, b, t) {
    return a + t * (b - a);
  }

  _grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise3D(x, y, z) {
    const p = this.permutation;

    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this._fade(x);
    const v = this._fade(y);
    const w = this._fade(z);

    const A = p[X] + Y;
    const AA = p[A] + Z;
    const AB = p[A + 1] + Z;
    const B = p[X + 1] + Y;
    const BA = p[B] + Z;
    const BB = p[B + 1] + Z;

    return this._lerp(
      this._lerp(
        this._lerp(this._grad(p[AA], x, y, z), this._grad(p[BA], x - 1, y, z), u),
        this._lerp(this._grad(p[AB], x, y - 1, z), this._grad(p[BB], x - 1, y - 1, z), u),
        v
      ),
      this._lerp(
        this._lerp(this._grad(p[AA + 1], x, y, z - 1), this._grad(p[BA + 1], x - 1, y, z - 1), u),
        this._lerp(this._grad(p[AB + 1], x, y - 1, z - 1), this._grad(p[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  }

  // Fractal Brownian Motion for more organic movement
  fbm(x, y, z, octaves = 4, lacunarity = 2, persistence = 0.5) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise3D(x * frequency, y * frequency, z * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }

  // Turbulence variation using absolute values
  turbulence(x, y, z, octaves = 4) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * Math.abs(this.noise3D(x * frequency, y * frequency, z * frequency));
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }

  reseed(seed) {
    this.seed = seed;
    this.permutation = this._generatePermutation();
  }
}

// ============================================================================
// LORENZ ATTRACTOR - Chaotic but bounded motion
// ============================================================================

class LorenzAttractor {
  constructor() {
    // Standard Lorenz parameters
    this.sigma = 10;
    this.rho = 28;
    this.beta = 8 / 3;

    // State
    this.x = 0.1;
    this.y = 0;
    this.z = 0;

    // Time step (affects speed and stability)
    this.dt = 0.005;

    // Normalization bounds
    this.xRange = [-25, 25];
    this.yRange = [-35, 35];
    this.zRange = [0, 55];

    // Smoothing
    this.smoothX = 0.5;
    this.smoothY = 0.5;
    this.smoothZ = 0.5;
    this.smoothFactor = 0.1;
  }

  step() {
    // Runge-Kutta 4th order for stability
    const k1 = this._derivatives(this.x, this.y, this.z);
    const k2 = this._derivatives(
      this.x + k1.dx * this.dt * 0.5,
      this.y + k1.dy * this.dt * 0.5,
      this.z + k1.dz * this.dt * 0.5
    );
    const k3 = this._derivatives(
      this.x + k2.dx * this.dt * 0.5,
      this.y + k2.dy * this.dt * 0.5,
      this.z + k2.dz * this.dt * 0.5
    );
    const k4 = this._derivatives(
      this.x + k3.dx * this.dt,
      this.y + k3.dy * this.dt,
      this.z + k3.dz * this.dt
    );

    this.x += (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx) * this.dt / 6;
    this.y += (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy) * this.dt / 6;
    this.z += (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz) * this.dt / 6;

    return this.getNormalized();
  }

  _derivatives(x, y, z) {
    return {
      dx: this.sigma * (y - x),
      dy: x * (this.rho - z) - y,
      dz: x * y - this.beta * z
    };
  }

  getNormalized() {
    const rawX = (this.x - this.xRange[0]) / (this.xRange[1] - this.xRange[0]);
    const rawY = (this.y - this.yRange[0]) / (this.yRange[1] - this.yRange[0]);
    const rawZ = (this.z - this.zRange[0]) / (this.zRange[1] - this.zRange[0]);

    // Apply smoothing
    this.smoothX += (rawX - this.smoothX) * this.smoothFactor;
    this.smoothY += (rawY - this.smoothY) * this.smoothFactor;
    this.smoothZ += (rawZ - this.smoothZ) * this.smoothFactor;

    return {
      x: Math.max(0, Math.min(1, this.smoothX)),
      y: Math.max(0, Math.min(1, this.smoothY)),
      z: Math.max(0, Math.min(1, this.smoothZ))
    };
  }

  setSpeed(speed) {
    this.dt = 0.002 + Math.max(0, Math.min(1, speed)) * 0.015;
  }

  setSmoothing(factor) {
    this.smoothFactor = Math.max(0.01, Math.min(0.5, factor));
  }

  reset(randomize = true) {
    if (randomize) {
      this.x = 0.1 + Math.random() * 5;
      this.y = Math.random() * 5;
      this.z = Math.random() * 5;
    } else {
      this.x = 0.1;
      this.y = 0;
      this.z = 0;
    }
    this.smoothX = 0.5;
    this.smoothY = 0.5;
    this.smoothZ = 0.5;
  }
}

// ============================================================================
// CLIFFORD ATTRACTOR - Different chaotic character
// ============================================================================

class CliffordAttractor {
  constructor() {
    // Clifford parameters (affect shape of attractor)
    this.a = -1.4;
    this.b = 1.6;
    this.c = 1.0;
    this.d = 0.7;

    // State (typically stays within -3 to 3)
    this.x = 0.1;
    this.y = 0.1;

    // Z is derived from velocity/change rate
    this.prevX = 0.1;
    this.prevY = 0.1;

    // Speed multiplier
    this.speed = 1;

    // Normalization bounds
    this.xyRange = [-2.5, 2.5];

    // Smoothing
    this.smoothX = 0.5;
    this.smoothY = 0.5;
    this.smoothZ = 0.5;
    this.smoothFactor = 0.08;
  }

  step() {
    // Store previous for velocity calculation
    this.prevX = this.x;
    this.prevY = this.y;

    // Clifford attractor equations
    const newX = Math.sin(this.a * this.y) + this.c * Math.cos(this.a * this.x);
    const newY = Math.sin(this.b * this.x) + this.d * Math.cos(this.b * this.y);

    // Apply with speed
    this.x = this.x + (newX - this.x) * this.speed * 0.1;
    this.y = this.y + (newY - this.y) * this.speed * 0.1;

    return this.getNormalized();
  }

  getNormalized() {
    // X and Y from attractor position
    const rawX = (this.x - this.xyRange[0]) / (this.xyRange[1] - this.xyRange[0]);
    const rawY = (this.y - this.xyRange[0]) / (this.xyRange[1] - this.xyRange[0]);

    // Z from velocity magnitude (change rate)
    const velX = this.x - this.prevX;
    const velY = this.y - this.prevY;
    const velocity = Math.sqrt(velX * velX + velY * velY);
    const rawZ = Math.min(1, velocity * 5);

    // Smooth
    this.smoothX += (rawX - this.smoothX) * this.smoothFactor;
    this.smoothY += (rawY - this.smoothY) * this.smoothFactor;
    this.smoothZ += (rawZ - this.smoothZ) * this.smoothFactor;

    return {
      x: Math.max(0, Math.min(1, this.smoothX)),
      y: Math.max(0, Math.min(1, this.smoothY)),
      z: Math.max(0, Math.min(1, this.smoothZ))
    };
  }

  setSpeed(speed) {
    this.speed = Math.max(0.1, Math.min(3, speed));
  }

  setParameters(a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }

  // Preset parameter sets for different visual/motion characteristics
  setPreset(preset) {
    const presets = {
      butterfly: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
      spiral: { a: 1.5, b: -1.8, c: 1.6, d: 0.9 },
      flower: { a: -1.7, b: 1.8, c: -0.5, d: -1.2 },
      waves: { a: 1.1, b: -1.5, c: 1.3, d: -1.1 }
    };

    if (presets[preset]) {
      const p = presets[preset];
      this.setParameters(p.a, p.b, p.c, p.d);
    }
  }

  reset(randomize = true) {
    if (randomize) {
      this.x = (Math.random() - 0.5) * 2;
      this.y = (Math.random() - 0.5) * 2;
    } else {
      this.x = 0.1;
      this.y = 0.1;
    }
    this.prevX = this.x;
    this.prevY = this.y;
    this.smoothX = 0.5;
    this.smoothY = 0.5;
    this.smoothZ = 0.5;
  }
}

// ============================================================================
// LISSAJOUS TRAJECTORY - Smooth, loopable paths
// ============================================================================

class LissajousTrajectory {
  constructor() {
    // Frequency ratios for each axis
    this.freqX = 1;
    this.freqY = 2;
    this.freqZ = 3;

    // Phase offsets
    this.phaseX = 0;
    this.phaseY = Math.PI / 4;
    this.phaseZ = Math.PI / 2;

    // Amplitude (0-1 range, centered)
    this.ampX = 0.4;
    this.ampY = 0.4;
    this.ampZ = 0.3;

    // Center point
    this.centerX = 0.5;
    this.centerY = 0.5;
    this.centerZ = 0.5;

    // Time
    this.t = 0;
    this.speed = 1;

    // Phase drift for evolving patterns
    this.phaseDrift = 0;
    this.driftSpeed = 0.001;
  }

  step(deltaTime) {
    this.t += deltaTime * this.speed;
    this.phaseDrift += deltaTime * this.driftSpeed;

    return {
      x: this.centerX + Math.sin(this.t * this.freqX + this.phaseX + this.phaseDrift) * this.ampX,
      y: this.centerY + Math.sin(this.t * this.freqY + this.phaseY) * this.ampY,
      z: this.centerZ + Math.sin(this.t * this.freqZ + this.phaseZ - this.phaseDrift * 0.5) * this.ampZ
    };
  }

  setPattern(freqX, freqY, freqZ) {
    this.freqX = freqX;
    this.freqY = freqY;
    this.freqZ = freqZ;
  }

  setCenter(x, y, z) {
    this.centerX = Math.max(0.1, Math.min(0.9, x));
    this.centerY = Math.max(0.1, Math.min(0.9, y));
    this.centerZ = Math.max(0.1, Math.min(0.9, z));
  }

  setAmplitude(x, y, z) {
    this.ampX = Math.max(0.05, Math.min(0.45, x));
    this.ampY = Math.max(0.05, Math.min(0.45, y));
    this.ampZ = Math.max(0.05, Math.min(0.45, z));
  }

  setSpeed(speed) {
    this.speed = Math.max(0.1, Math.min(5, speed));
  }

  setDriftSpeed(speed) {
    this.driftSpeed = speed;
  }

  // Musical interval-based presets
  setMusicalPreset(preset) {
    const presets = {
      octave: { freqX: 1, freqY: 2, freqZ: 4 },
      fifth: { freqX: 2, freqY: 3, freqZ: 4 },
      fourth: { freqX: 3, freqY: 4, freqZ: 8 },
      major: { freqX: 4, freqY: 5, freqZ: 6 },
      minor: { freqX: 5, freqY: 6, freqZ: 8 }
    };

    if (presets[preset]) {
      const p = presets[preset];
      this.setPattern(p.freqX, p.freqY, p.freqZ);
    }
  }

  reset() {
    this.t = 0;
    this.phaseDrift = 0;
  }
}

// ============================================================================
// SPLINE TRAJECTORY - Smooth paths through control points
// ============================================================================

class SplineTrajectory {
  constructor() {
    this.controlPoints = [
      { x: 0.2, y: 0.3, z: 0.4 },
      { x: 0.7, y: 0.6, z: 0.3 },
      { x: 0.5, y: 0.8, z: 0.7 },
      { x: 0.3, y: 0.4, z: 0.6 }
    ];

    this.t = 0;
    this.speed = 0.2;
    this.loop = true;
  }

  // Catmull-Rom spline interpolation
  _catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;

    return 0.5 * (
      (2 * p1) +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
  }

  step(deltaTime) {
    this.t += deltaTime * this.speed;

    const points = this.controlPoints;
    const n = points.length;

    if (this.loop) {
      this.t = this.t % n;
    } else {
      this.t = Math.min(this.t, n - 1.001);
    }

    const i = Math.floor(this.t);
    const f = this.t - i;

    // Get 4 points for Catmull-Rom
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i % n];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    return {
      x: Math.max(0, Math.min(1, this._catmullRom(p0.x, p1.x, p2.x, p3.x, f))),
      y: Math.max(0, Math.min(1, this._catmullRom(p0.y, p1.y, p2.y, p3.y, f))),
      z: Math.max(0, Math.min(1, this._catmullRom(p0.z, p1.z, p2.z, p3.z, f)))
    };
  }

  setControlPoints(points) {
    if (points.length >= 4) {
      this.controlPoints = points;
    }
  }

  addControlPoint(x, y, z) {
    this.controlPoints.push({ x, y, z });
  }

  setSpeed(speed) {
    this.speed = Math.max(0.01, Math.min(2, speed));
  }

  reset() {
    this.t = 0;
  }
}

// ============================================================================
// PSYCHOACOUSTIC MAPPING - Perceptually linear parameter curves
// ============================================================================

class PsychoacousticMapper {
  constructor() {
    // Frequency range for filter cutoff
    this.minCutoff = 40;
    this.maxCutoff = 16000;

    // Perceived loudness range
    this.minGain = -60; // dB
    this.maxGain = 0;
  }

  // Exponential mapping for frequency (perceived pitch is logarithmic)
  mapToFrequency(normalized, minFreq = this.minCutoff, maxFreq = this.maxCutoff) {
    const n = Math.max(0, Math.min(1, normalized));
    return minFreq * Math.pow(maxFreq / minFreq, n);
  }

  // Inverse: frequency to normalized
  frequencyToNormalized(freq, minFreq = this.minCutoff, maxFreq = this.maxCutoff) {
    const f = Math.max(minFreq, Math.min(maxFreq, freq));
    return Math.log(f / minFreq) / Math.log(maxFreq / minFreq);
  }

  // S-curve for parameters that need center emphasis
  sCurve(normalized, steepness = 3) {
    const n = Math.max(0, Math.min(1, normalized));
    return 1 / (1 + Math.exp(-steepness * (n - 0.5) * 2));
  }

  // Inverse S-curve
  inverseSCurve(normalized, steepness = 3) {
    const n = Math.max(0.001, Math.min(0.999, normalized));
    return 0.5 + Math.log(n / (1 - n)) / (2 * steepness);
  }

  // Logarithmic mapping for amplitude/gain
  mapToGain(normalized, minDb = this.minGain, maxDb = this.maxGain) {
    const n = Math.max(0, Math.min(1, normalized));
    if (n === 0) return 0;
    const db = minDb + (maxDb - minDb) * n;
    return Math.pow(10, db / 20);
  }

  // Power curve for resonance (more sensitive at high end)
  mapToResonance(normalized, power = 2) {
    const n = Math.max(0, Math.min(1, normalized));
    return Math.pow(n, power);
  }

  // Inverse power curve
  resonanceToNormalized(resonance, power = 2) {
    const r = Math.max(0, Math.min(1, resonance));
    return Math.pow(r, 1 / power);
  }

  // Envelope time mapping (exponential for natural feel)
  mapToEnvelopeTime(normalized, minTime = 0.001, maxTime = 5) {
    const n = Math.max(0, Math.min(1, normalized));
    return minTime * Math.pow(maxTime / minTime, n);
  }

  // LFO rate mapping (logarithmic for musical divisions)
  mapToLFORate(normalized, minRate = 0.1, maxRate = 20) {
    const n = Math.max(0, Math.min(1, normalized));
    return minRate * Math.pow(maxRate / minRate, n);
  }

  // Detuning in cents (linear is fine here)
  mapToDetune(normalized, maxCents = 50) {
    return (normalized - 0.5) * 2 * maxCents;
  }
}

// ============================================================================
// PARAMETER SPACE - Main 3D control system
// ============================================================================

class ParameterSpace {
  constructor() {
    // Current position (0-1 normalized)
    this.position = { x: 0.5, y: 0.5, z: 0.5 };

    // Target position (for manual mode)
    this.target = { x: 0.5, y: 0.5, z: 0.5 };

    // Smoothed output position
    this.smoothPosition = { x: 0.5, y: 0.5, z: 0.5 };

    // Smoothing factor (lower = smoother, 0.01-0.5)
    this.smoothingFactor = 0.05;

    // Motion generators
    this.perlin = new PerlinNoise();
    this.lorenz = new LorenzAttractor();
    this.clifford = new CliffordAttractor();
    this.lissajous = new LissajousTrajectory();
    this.spline = new SplineTrajectory();

    // Psychoacoustic mapper
    this.mapper = new PsychoacousticMapper();

    // Motion mode
    this.motionMode = 'manual'; // manual, perlin, lorenz, clifford, lissajous, spline

    // Time tracking
    this.time = 0;
    this.lastTime = performance.now() / 1000;

    // Motion parameters
    this.motionSpeed = 1;
    this.motionScale = 0.3;

    // BPM sync
    this.bpm = 120;
    this.syncEnabled = false;
    this.beatPhase = 0;

    // Bounds (can be constrained by moods)
    this.bounds = {
      x: { min: 0, max: 1 },
      y: { min: 0, max: 1 },
      z: { min: 0, max: 1 }
    };

    // Attractor point (pulls position toward this point)
    this.attractor = null;
    this.attractorStrength = 0;

    // Freeze/hold state
    this.frozen = false;
    this.frozenPosition = null;

    // Trajectory history for visualization
    this.history = [];
    this.maxHistory = 150;

    // Callbacks for parameter changes
    this.callbacks = [];

    // Running state
    this._running = false;
    this._animationFrame = null;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.lastTime = performance.now() / 1000;
    this._update();
  }

  stop() {
    this._running = false;
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  }

  _update() {
    if (!this._running) return;

    const now = performance.now() / 1000;
    const deltaTime = Math.min(now - this.lastTime, 0.1); // Cap to prevent jumps
    this.lastTime = now;
    this.time += deltaTime;

    // Update beat phase if sync enabled
    if (this.syncEnabled) {
      const beatDuration = 60 / this.bpm;
      this.beatPhase = (this.time % beatDuration) / beatDuration;
    }

    // Skip motion if frozen
    if (!this.frozen) {
      // Generate motion based on mode
      this._generateMotion(deltaTime);

      // Apply attractor force if set
      this._applyAttractor();
    }

    // Apply smoothing
    this._applySmoothing();

    // Clamp to bounds
    this._clampToBounds();

    // Store history
    this._updateHistory();

    // Notify callbacks
    this._notifyCallbacks();

    this._animationFrame = requestAnimationFrame(() => this._update());
  }

  _generateMotion(deltaTime) {
    const speed = this.syncEnabled ?
      this.motionSpeed * (this.bpm / 120) :
      this.motionSpeed;

    switch (this.motionMode) {
      case 'manual':
        // Interpolate toward target
        this.position.x += (this.target.x - this.position.x) * 0.15;
        this.position.y += (this.target.y - this.position.y) * 0.15;
        this.position.z += (this.target.z - this.position.z) * 0.15;
        break;

      case 'perlin':
        // Perlin noise drift
        const scale = this.motionScale;
        const pSpeed = speed * 0.3;
        this.position.x = 0.5 + this.perlin.fbm(this.time * pSpeed, 0, 0) * scale;
        this.position.y = 0.5 + this.perlin.fbm(0, this.time * pSpeed, 100) * scale;
        this.position.z = 0.5 + this.perlin.fbm(100, 0, this.time * pSpeed) * scale;
        break;

      case 'lorenz':
        this.lorenz.setSpeed(speed);
        const lorenzPos = this.lorenz.step();
        this.position.x = lorenzPos.x;
        this.position.y = lorenzPos.y;
        this.position.z = lorenzPos.z;
        break;

      case 'clifford':
        this.clifford.setSpeed(speed);
        const cliffordPos = this.clifford.step();
        this.position.x = cliffordPos.x;
        this.position.y = cliffordPos.y;
        this.position.z = cliffordPos.z;
        break;

      case 'lissajous':
        this.lissajous.setSpeed(speed);
        const lissPos = this.lissajous.step(deltaTime);
        this.position.x = lissPos.x;
        this.position.y = lissPos.y;
        this.position.z = lissPos.z;
        break;

      case 'spline':
        this.spline.setSpeed(speed * 0.5);
        const splinePos = this.spline.step(deltaTime);
        this.position.x = splinePos.x;
        this.position.y = splinePos.y;
        this.position.z = splinePos.z;
        break;
    }
  }

  _applyAttractor() {
    if (!this.attractor || this.attractorStrength === 0) return;

    const str = this.attractorStrength;
    this.position.x += (this.attractor.x - this.position.x) * str;
    this.position.y += (this.attractor.y - this.position.y) * str;
    this.position.z += (this.attractor.z - this.position.z) * str;
  }

  _applySmoothing() {
    const f = this.smoothingFactor;
    this.smoothPosition.x += (this.position.x - this.smoothPosition.x) * f;
    this.smoothPosition.y += (this.position.y - this.smoothPosition.y) * f;
    this.smoothPosition.z += (this.position.z - this.smoothPosition.z) * f;
  }

  _clampToBounds() {
    this.smoothPosition.x = Math.max(this.bounds.x.min, Math.min(this.bounds.x.max, this.smoothPosition.x));
    this.smoothPosition.y = Math.max(this.bounds.y.min, Math.min(this.bounds.y.max, this.smoothPosition.y));
    this.smoothPosition.z = Math.max(this.bounds.z.min, Math.min(this.bounds.z.max, this.smoothPosition.z));
  }

  _updateHistory() {
    this.history.push({
      x: this.smoothPosition.x,
      y: this.smoothPosition.y,
      z: this.smoothPosition.z,
      time: this.time
    });

    while (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  _notifyCallbacks() {
    const mapped = this.getMappedParameters();
    for (const cb of this.callbacks) {
      cb(this.smoothPosition, mapped);
    }
  }

  // Get psychoacoustically mapped parameters
  getMappedParameters() {
    const pos = this.smoothPosition;

    return {
      // X -> Timbre
      timbre: {
        raw: pos.x,
        oscillatorMix: pos.x,
        waveShape: this.mapper.sCurve(pos.x),
        drive: 1 + pos.x * 3,
        harmonicContent: this.mapper.sCurve(pos.x, 2)
      },

      // Y -> Brightness
      brightness: {
        raw: pos.y,
        cutoff: this.mapper.mapToFrequency(pos.y, 80, 12000),
        resonance: this.mapper.mapToResonance(pos.y * 0.85),
        filterEnvAmount: pos.y * 4000,
        filterDrive: 1 + pos.y * 0.5
      },

      // Z -> Motion/Energy
      motion: {
        raw: pos.z,
        lfoDepth: this.mapper.sCurve(pos.z) * 0.8,
        lfoRate: this.mapper.mapToLFORate(pos.z, 0.2, 10),
        envAttack: this.mapper.mapToEnvelopeTime(1 - pos.z, 0.005, 0.5),
        envDecay: this.mapper.mapToEnvelopeTime(1 - pos.z, 0.05, 1),
        envRelease: this.mapper.mapToEnvelopeTime(1 - pos.z * 0.7, 0.1, 2),
        modulationIntensity: pos.z
      }
    };
  }

  // Manual position control
  setPosition(x, y, z) {
    this.target.x = Math.max(0, Math.min(1, x));
    this.target.y = Math.max(0, Math.min(1, y));
    this.target.z = Math.max(0, Math.min(1, z));

    if (this.motionMode === 'manual') {
      this.position.x = this.target.x;
      this.position.y = this.target.y;
      this.position.z = this.target.z;
    }
  }

  // Nudge position (relative change)
  nudgePosition(dx, dy, dz) {
    this.target.x = Math.max(0, Math.min(1, this.target.x + dx));
    this.target.y = Math.max(0, Math.min(1, this.target.y + dy));
    this.target.z = Math.max(0, Math.min(1, this.target.z + dz));
  }

  setMotionMode(mode) {
    const validModes = ['manual', 'perlin', 'lorenz', 'clifford', 'lissajous', 'spline'];
    if (!validModes.includes(mode)) return;

    this.motionMode = mode;

    // Reset the generator when switching
    switch (mode) {
      case 'lorenz':
        this.lorenz.reset();
        break;
      case 'clifford':
        this.clifford.reset();
        break;
      case 'lissajous':
        this.lissajous.reset();
        break;
      case 'spline':
        this.spline.reset();
        break;
    }
  }

  setMotionSpeed(speed) {
    this.motionSpeed = Math.max(0.1, Math.min(5, speed));
  }

  setMotionScale(scale) {
    this.motionScale = Math.max(0.1, Math.min(1, scale));
  }

  setSmoothing(factor) {
    this.smoothingFactor = Math.max(0.01, Math.min(0.5, factor));
  }

  setBounds(bounds) {
    if (bounds.x) this.bounds.x = { ...this.bounds.x, ...bounds.x };
    if (bounds.y) this.bounds.y = { ...this.bounds.y, ...bounds.y };
    if (bounds.z) this.bounds.z = { ...this.bounds.z, ...bounds.z };
  }

  setBPM(bpm) {
    this.bpm = Math.max(40, Math.min(240, bpm));
  }

  setSyncEnabled(enabled) {
    this.syncEnabled = enabled;
  }

  setAttractor(x, y, z, strength = 0.1) {
    this.attractor = { x, y, z };
    this.attractorStrength = Math.max(0, Math.min(0.5, strength));
  }

  clearAttractor() {
    this.attractor = null;
    this.attractorStrength = 0;
  }

  // Freeze current position
  freeze() {
    this.frozen = true;
    this.frozenPosition = { ...this.smoothPosition };
  }

  // Unfreeze and continue motion
  unfreeze() {
    this.frozen = false;
    this.frozenPosition = null;
  }

  toggleFreeze() {
    if (this.frozen) {
      this.unfreeze();
    } else {
      this.freeze();
    }
    return this.frozen;
  }

  // Lissajous configuration
  setLissajousPattern(freqX, freqY, freqZ) {
    this.lissajous.setPattern(freqX, freqY, freqZ);
  }

  setLissajousCenter(x, y, z) {
    this.lissajous.setCenter(x, y, z);
  }

  setLissajousAmplitude(x, y, z) {
    this.lissajous.setAmplitude(x, y, z);
  }

  // Clifford configuration
  setCliffordPreset(preset) {
    this.clifford.setPreset(preset);
  }

  // Spline configuration
  setSplineControlPoints(points) {
    this.spline.setControlPoints(points);
  }

  // Perlin configuration
  reseedPerlin() {
    this.perlin.reseed(Math.random() * 10000);
  }

  onChange(callback) {
    this.callbacks.push(callback);
  }

  removeCallback(callback) {
    const idx = this.callbacks.indexOf(callback);
    if (idx >= 0) this.callbacks.splice(idx, 1);
  }

  getPosition() {
    return { ...this.smoothPosition };
  }

  getRawPosition() {
    return { ...this.position };
  }

  getHistory() {
    return [...this.history];
  }

  isFrozen() {
    return this.frozen;
  }
}

// ============================================================================
// PARAMETER AUTOMATION - Tempo-aware motion scheduling
// ============================================================================

class ParameterAutomation {
  constructor(parameterSpace) {
    this.space = parameterSpace;
    this.bpm = 120;
    this.playing = false;

    // Automation curves (array of {time, value} points)
    this.curves = {
      x: [],
      y: [],
      z: []
    };

    // Playhead
    this.playhead = 0;
    this.loopLength = 4; // bars
    this.looping = true;

    this._startTime = 0;
    this._playing = false;
  }

  setBPM(bpm) {
    this.bpm = Math.max(40, Math.min(240, bpm));
  }

  setLoopLength(bars) {
    this.loopLength = Math.max(1, Math.min(64, bars));
  }

  play() {
    this._playing = true;
    this._startTime = performance.now() / 1000;
    this._update();
  }

  stop() {
    this._playing = false;
    this.playhead = 0;
  }

  pause() {
    this._playing = false;
  }

  _update() {
    if (!this._playing) return;

    const now = performance.now() / 1000;
    const elapsed = now - this._startTime;

    // Convert to bars
    const beatsPerSecond = this.bpm / 60;
    const barsPerSecond = beatsPerSecond / 4;
    this.playhead = elapsed * barsPerSecond;

    if (this.looping) {
      this.playhead = this.playhead % this.loopLength;
    }

    // Apply automation
    if (this.curves.x.length > 0) {
      this.space.target.x = this.getValueAt('x', this.playhead);
    }
    if (this.curves.y.length > 0) {
      this.space.target.y = this.getValueAt('y', this.playhead);
    }
    if (this.curves.z.length > 0) {
      this.space.target.z = this.getValueAt('z', this.playhead);
    }

    requestAnimationFrame(() => this._update());
  }

  // Record current position at current playhead
  recordPoint(axis) {
    const pos = this.space.getPosition();
    this.curves[axis].push({
      time: this.playhead,
      value: pos[axis]
    });

    // Sort by time
    this.curves[axis].sort((a, b) => a.time - b.time);
  }

  // Get interpolated value at time
  getValueAt(axis, time) {
    const curve = this.curves[axis];
    if (curve.length === 0) return 0.5;
    if (curve.length === 1) return curve[0].value;

    // Handle looping
    const loopedTime = this.looping ? time % this.loopLength : time;

    // Find surrounding points
    let before = curve[curve.length - 1];
    let after = curve[0];

    for (let i = 0; i < curve.length - 1; i++) {
      if (curve[i].time <= loopedTime && curve[i + 1].time > loopedTime) {
        before = curve[i];
        after = curve[i + 1];
        break;
      }
    }

    // Interpolate with smoothstep
    if (before.time === after.time) return before.value;

    let t;
    if (after.time > before.time) {
      t = (loopedTime - before.time) / (after.time - before.time);
    } else {
      // Wrap around
      const totalSpan = (this.loopLength - before.time) + after.time;
      if (loopedTime >= before.time) {
        t = (loopedTime - before.time) / totalSpan;
      } else {
        t = (this.loopLength - before.time + loopedTime) / totalSpan;
      }
    }

    // Smoothstep interpolation
    const smoothT = t * t * (3 - 2 * t);
    return before.value + (after.value - before.value) * smoothT;
  }

  clearCurve(axis) {
    this.curves[axis] = [];
  }

  clearAll() {
    this.curves.x = [];
    this.curves.y = [];
    this.curves.z = [];
  }

  // Utility conversions
  barsToSeconds(bars) {
    return bars * (60 / this.bpm) * 4;
  }

  secondsToBars(seconds) {
    return seconds / ((60 / this.bpm) * 4);
  }

  getPlayhead() {
    return this.playhead;
  }

  isPlaying() {
    return this._playing;
  }
}

// ============================================================================
// BROWSER GLOBAL
// ============================================================================

if (typeof window !== 'undefined') {
  window.AutoMoogSpace = {
    PerlinNoise,
    LorenzAttractor,
    CliffordAttractor,
    LissajousTrajectory,
    SplineTrajectory,
    PsychoacousticMapper,
    ParameterSpace,
    ParameterAutomation
  };
}
