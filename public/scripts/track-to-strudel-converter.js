/**
 * Track-to-Strudel Converter
 * Automatically generates Strudel patterns from track metadata
 *
 * Features:
 * - Convert genre, BPM, mood to Strudel code
 * - Generate patterns based on audio analysis
 * - Support for multiple music styles
 * - Customizable pattern complexity
 * - Metadata-driven pattern generation
 */

class TrackToStrudelConverter {
  constructor() {
    this.defaultBPM = 120;
    this.defaultComplexity = 'medium';
  }

  /**
   * Convert track metadata to Strudel pattern
   */
  convert(track, options = {}) {
    const {
      complexity = this.defaultComplexity, // simple, medium, complex
      useAudioAnalysis = true,
      style = null // Override genre-based style
    } = options;

    // Extract metadata
    const genre = (track.genre || 'experimental').toLowerCase();
    const bpm = track.bpm || track.tempo || this.defaultBPM;
    const energy = track.energy || this.inferEnergyFromGenre(genre);
    const mood = track.mood || this.inferMoodFromGenre(genre);

    // Use audio analysis if available
    let pattern;
    if (useAudioAnalysis && track.audioAnalysis) {
      pattern = this.convertFromAudioAnalysis(track.audioAnalysis, bpm);
    } else {
      // Generate pattern from genre/metadata
      pattern = this.generatePatternByGenre(genre, bpm, energy, mood, complexity);
    }

    return pattern;
  }

  /**
   * Generate pattern based on genre
   */
  generatePatternByGenre(genre, bpm, energy, mood, complexity) {
    // Normalize genre
    const genreMap = {
      'rap': 'rap',
      'hip-hop': 'rap',
      'hiphop': 'rap',
      'trap': 'trap',
      'boom bap': 'boom_bap',
      'boom-bap': 'boom_bap',
      'drill': 'drill',
      'uk drill': 'drill',
      'reggae': 'reggae',
      'dancehall': 'dancehall',
      'afrobeat': 'afrobeat',
      'afro': 'afrobeat',
      'house': 'house',
      'techno': 'techno',
      'ambient': 'ambient',
      'experimental': 'experimental',
      'drum and bass': 'dnb',
      'dnb': 'dnb',
      'jungle': 'dnb',
      'dubstep': 'dubstep',
      'grime': 'grime'
    };

    const normalizedGenre = genreMap[genre] || 'experimental';

    // Route to appropriate generator
    const generators = {
      rap: () => this.generateRap(bpm, energy, complexity),
      trap: () => this.generateTrap(bpm, energy, complexity),
      boom_bap: () => this.generateBoomBap(bpm, complexity),
      drill: () => this.generateDrill(bpm, complexity),
      reggae: () => this.generateReggae(bpm, mood),
      dancehall: () => this.generateDancehall(bpm, energy),
      afrobeat: () => this.generateAfrobeat(bpm, complexity),
      house: () => this.generateHouse(bpm, energy),
      techno: () => this.generateTechno(bpm, energy),
      ambient: () => this.generateAmbient(bpm, mood),
      dnb: () => this.generateDnB(bpm, energy),
      dubstep: () => this.generateDubstep(bpm, energy),
      grime: () => this.generateGrime(bpm, energy),
      experimental: () => this.generateExperimental(bpm, mood)
    };

    return generators[normalizedGenre]() || generators.experimental();
  }

  /**
   * Generate Rap pattern
   */
  generateRap(bpm, energy, complexity) {
    const patterns = {
      simple: `stack(
  s("bd ~ sd ~, hh*4")
).cpm(${bpm}).room(0.2)`,

      medium: `stack(
  s("bd [~ bd] sd ~, hh*8"),
  s("~ ~ ~ 808").sometimes(x => x.gain(0.8))
).cpm(${bpm}).room(0.2).lpf(1200)`,

      complex: `stack(
  s("bd [bd ~] [sd bd] sd, hh*16 [hh hh]*2"),
  s("[~ 808]*2 ~ ~").fast(2).lpf(800),
  note("<c2 eb2 f2 g2>").s("sawtooth").lpf(400).gain(0.3)
).cpm(${bpm}).room(0.3)`
    };

    return patterns[complexity] || patterns.medium;
  }

  /**
   * Generate Trap pattern
   */
  generateTrap(bpm, energy, complexity) {
    const hihatDensity = energy > 0.7 ? 32 : 16;

    const patterns = {
      simple: `stack(
  s("bd*2 [~ bd], ~ cp ~ cp, hh*16")
).cpm(${bpm})`,

      medium: `stack(
  s("bd*2 [[~ bd] bd], ~ cp ~ [cp cp], hh*${hihatDensity}"),
  s("[~ 808 ~ 808]*2").lpf(700)
).cpm(${bpm}).room(0.1)`,

      complex: `stack(
  s("bd*2 [[~ bd] bd] [bd ~], ~ cp ~ [cp [cp ~]], hh*${hihatDensity} hh*32"),
  s("[~ 808 ~ 808]*2").lpf(perlin.range(500, 900)),
  s("~ ~ ~ ~").rarely(x => x.s("crash").gain(0.5))
).cpm(${bpm}).room(0.15).sometimes(x => x.fast(2))`
    };

    return patterns[complexity] || patterns.medium;
  }

  /**
   * Generate Boom Bap pattern
   */
  generateBoomBap(bpm, complexity) {
    if (complexity === 'simple') {
      return `s("bd ~ sd ~, ~ ~ cp ~, hh*4").cpm(${bpm}).room(0.4)`;
    }

    return `stack(
  s("bd ~ sd [~ sd], ~ ~ cp ~, hh*4 [hh hh]"),
  note("c2 ~ eb2 ~").s("sawtooth").lpf(500).slow(2).gain(0.4)
).cpm(${bpm}).room(0.5).sometimes(x => x.delay(0.25))`;
  }

  /**
   * Generate Drill pattern
   */
  generateDrill(bpm, complexity) {
    const patterns = {
      simple: `stack(
  s("bd ~ bd ~, ~ ~ cp ~, hh*8"),
  s("~ 808 ~ ~").fast(2)
).cpm(${bpm}).lpf(800)`,

      medium: `stack(
  s("bd ~ bd [~ bd], ~ ~ cp ~, hh*8 hh*4"),
  s("[~ 808 ~ ~]*2").fast(2).lpf(700),
  s("~ ~ ~ ~").sometimes(x => x.s("rim"))
).cpm(${bpm}).lpf(900).room(0.2)`,

      complex: `stack(
  s("bd ~ bd [~ [bd bd]], ~ ~ cp [~ cp], hh*8 [hh*16 hh*4]"),
  s("[~ 808 ~ 808]*2").lpf(perlin.range(600, 900)),
  note("<c2 c2 g1 f1>").s("square").lpf(600).gain(0.3)
).cpm(${bpm}).lpf(850).room(0.25)`
    };

    return patterns[complexity] || patterns.medium;
  }

  /**
   * Generate Reggae pattern
   */
  generateReggae(bpm, mood) {
    const chords = mood === 'dark' ?
      "<c2 eb2 f2 g2>" :
      "<c2 f2 g2 c3>";

    return `stack(
  s("~ bd ~ bd, ~ ~ cp ~, ~ hh ~ hh"),
  note("${chords}").s("sawtooth").lpf(800).slow(2)
).cpm(${bpm}).room(0.4).delay(0.2)`;
  }

  /**
   * Generate Dancehall pattern
   */
  generateDancehall(bpm, energy) {
    const snarePattern = energy > 0.7 ? "~ cp [~ cp] ~" : "~ cp ~ ~";

    return `stack(
  s("bd ~ bd ~, ${snarePattern}, hh*8"),
  s("~ ~ 808 ~").sometimes(x => x.fast(2)),
  note("<c2 g2 bb2 f2>").s("sawtooth").lpf(1000).slow(2)
).cpm(${bpm}).room(0.3)`;
  }

  /**
   * Generate Afrobeat pattern
   */
  generateAfrobeat(bpm, complexity) {
    const patterns = {
      simple: `stack(
  s("bd ~ bd ~, ~ cp ~ cp, hh*8 [hh hh]"),
  note("<c2 f2 g2 bb2>").s("triangle").lpf(900)
).cpm(${bpm}).room(0.4)`,

      medium: `stack(
  s("bd [~ bd] bd ~, ~ cp [~ cp] cp, hh*8 [hh hh hh]"),
  s("~ ~ 808 ~").sometimes(x => x.fast(2)),
  note("<c2 eb2 f2 g2 bb2>").s("triangle").lpf(900).slow(2)
).cpm(${bpm}).room(0.4).delay(0.15)`,

      complex: `stack(
  s("bd [~ bd] bd [bd ~], [~ cp]*2 cp [~ [cp cp]], hh*16"),
  s("~ 808 ~ [808 ~]").lpf(700),
  note("<c2 eb2 f2 g2 bb2 c3>").s("triangle").lpf(900).slow(2),
  s("~ ~ ~ ~").rarely(x => x.s("cowbell").gain(0.6))
).cpm(${bpm}).room(0.5).delay(0.2)`
    };

    return patterns[complexity] || patterns.medium;
  }

  /**
   * Generate House pattern
   */
  generateHouse(bpm, energy) {
    const bassline = energy > 0.7 ?
      "<c2 c2 eb2 f2>" :
      "<c2 ~ eb2 ~>";

    return `stack(
  s("bd*4, ~ cp ~ cp, [hh hh]*8"),
  note("${bassline}").s("sawtooth").lpf(600).fast(2)
).cpm(${bpm}).room(0.2)`;
  }

  /**
   * Generate Techno pattern
   */
  generateTechno(bpm, energy) {
    const complexity = energy > 0.7 ? 'high' : 'medium';

    if (complexity === 'high') {
      return `stack(
  s("bd*4, [~ cp]*2, hh*16 hh*32"),
  note(perlin.range(50, 100)).s("sawtooth").lpf(perlin.range(400, 2000)),
  s("~ ~ ~ ~").sometimes(x => x.s("noise").gain(0.3).hpf(2000))
).cpm(${bpm}).room(0.1)`;
    }

    return `stack(
  s("bd*4, [~ cp]*2, hh*8"),
  note("<c1 c1 g1 f1>").s("sawtooth").lpf(800)
).cpm(${bpm}).room(0.15)`;
  }

  /**
   * Generate Ambient pattern
   */
  generateAmbient(bpm, mood) {
    const scale = mood === 'dark' ?
      "<c2 eb2 f2 g2 bb2>" :
      "<c2 d2 e2 g2 a2>";

    return `stack(
  note("${scale}").s("sine").slow(8),
  note("${scale}").add(12).s("triangle").slow(6).gain(0.5)
).cpm(${bpm / 2}).room(0.8).delay(0.5).lpf(1200)`;
  }

  /**
   * Generate Drum and Bass pattern
   */
  generateDnB(bpm, energy) {
    // DnB is typically 160-180 BPM
    const dnbBPM = bpm < 140 ? bpm * 1.5 : bpm;

    return `stack(
  s("bd ~ [~ bd] ~, ~ ~ sd ~, hh*16 [hh*8 hh*16]"),
  note("<c2 eb2 f2 g2>").s("sawtooth").lpf(600).fast(2),
  s("~ ~ 808 ~").sometimes(x => x.fast(2)).lpf(500)
).cpm(${dnbBPM}).room(0.2)`;
  }

  /**
   * Generate Dubstep pattern
   */
  generateDubstep(bpm, energy) {
    // Dubstep is typically around 140 BPM
    const wobbleLFO = energy > 0.7 ? "perlin.range(100, 800)" : "perlin.range(200, 600)";

    return `stack(
  s("~ ~ bd ~, ~ cp ~ ~, hh*8"),
  note("<c1 c1 g0 f0>").s("sawtooth").lpf(${wobbleLFO}).gain(0.8),
  s("~ ~ ~ 808").gain(1.2)
).cpm(${bpm}).room(0.3)`;
  }

  /**
   * Generate Grime pattern
   */
  generateGrime(bpm, energy) {
    return `stack(
  s("bd ~ [bd ~] ~, ~ ~ cp ~, hh*8 [hh*16 hh*8]"),
  note("<c2 c2 eb2 f2>").s("square").lpf(700).fast(2),
  s("~ 808 ~ [808 ~]").lpf(600)
).cpm(${bpm}).room(0.2)`;
  }

  /**
   * Generate Experimental pattern
   */
  generateExperimental(bpm, mood) {
    return `stack(
  s(choose("bd", "sd", "hh", "cp")),
  note(perlin.range(30, 100)).s(choose("sine", "sawtooth", "square", "triangle")),
  s("~ ~ ~ ~").rarely(x => x.s(choose("noise", "808", "crash")))
).cpm(${bpm}).lpf(perlin.range(400, 2000)).room(perlin.range(0, 0.8))`;
  }

  /**
   * Convert from audio analysis data
   */
  convertFromAudioAnalysis(analysis, bpm) {
    // Extract key features from analysis
    const tempo = analysis.tempo || bpm;
    const energy = analysis.energy || 0.5;
    const danceability = analysis.danceability || 0.5;

    // Generate rhythm based on detected beats
    let kickPattern = "bd*4"; // Default 4-on-floor
    let snarePattern = "~ cp ~ cp";
    let hihatPattern = "hh*8";

    if (analysis.beats) {
      // Analyze beat positions to generate more accurate patterns
      kickPattern = this.extractKickPattern(analysis.beats);
      snarePattern = this.extractSnarePattern(analysis.beats);
    }

    // Build pattern based on energy and danceability
    if (energy > 0.7 && danceability > 0.6) {
      return `stack(
  s("${kickPattern}, ${snarePattern}, ${hihatPattern} hh*16"),
  note(perlin.range(30, 60)).s("sawtooth").lpf(800)
).cpm(${tempo}).room(0.2)`;
    } else if (energy < 0.3) {
      return `stack(
  s("bd ~ ~ ~, ~ ~ sd ~, ~ hh ~ hh"),
  note("<c2 d2 e2 g2>").s("sine").slow(4)
).cpm(${tempo}).room(0.6)`;
    } else {
      return `stack(
  s("${kickPattern}, ${snarePattern}, ${hihatPattern}"),
  note("<c2 eb2 f2 g2>").s("sawtooth").lpf(1000)
).cpm(${tempo}).room(0.3)`;
    }
  }

  /**
   * Extract kick drum pattern from beat analysis
   */
  extractKickPattern(beats) {
    // Placeholder: Analyze beat positions
    // In real implementation, would analyze beat.position and beat.confidence
    return "bd [~ bd] bd ~";
  }

  /**
   * Extract snare pattern from beat analysis
   */
  extractSnarePattern(beats) {
    // Placeholder: Analyze beat positions
    return "~ cp ~ [cp ~]";
  }

  /**
   * Infer energy level from genre
   */
  inferEnergyFromGenre(genre) {
    const energyMap = {
      'trap': 0.8,
      'drill': 0.75,
      'dnb': 0.85,
      'techno': 0.8,
      'house': 0.7,
      'dubstep': 0.8,
      'grime': 0.75,
      'rap': 0.6,
      'boom_bap': 0.5,
      'reggae': 0.4,
      'dancehall': 0.7,
      'afrobeat': 0.65,
      'ambient': 0.2,
      'experimental': 0.5
    };

    return energyMap[genre] || 0.5;
  }

  /**
   * Infer mood from genre
   */
  inferMoodFromGenre(genre) {
    const moodMap = {
      'trap': 'aggressive',
      'drill': 'dark',
      'dnb': 'energetic',
      'techno': 'hypnotic',
      'house': 'uplifting',
      'dubstep': 'intense',
      'grime': 'aggressive',
      'rap': 'confident',
      'boom_bap': 'classic',
      'reggae': 'laid-back',
      'dancehall': 'party',
      'afrobeat': 'celebratory',
      'ambient': 'peaceful',
      'experimental': 'exploratory'
    };

    return moodMap[genre] || 'neutral';
  }

  /**
   * Generate pattern with custom parameters
   */
  generateCustom(params) {
    const {
      bpm = 120,
      kickPattern = "bd*4",
      snarePattern = "~ cp ~ cp",
      hihatPattern = "hh*8",
      bassline = "<c2 eb2 f2 g2>",
      bassSound = "sawtooth",
      filterFreq = 1000,
      reverb = 0.2,
      includeEffects = true
    } = params;

    let pattern = `stack(
  s("${kickPattern}, ${snarePattern}, ${hihatPattern}"),
  note("${bassline}").s("${bassSound}").lpf(${filterFreq})
).cpm(${bpm})`;

    if (includeEffects) {
      pattern += `.room(${reverb})`;
    }

    return pattern;
  }

  /**
   * Batch convert multiple tracks
   */
  convertBatch(tracks, options = {}) {
    return tracks.map(track => ({
      trackId: track.id,
      title: track.title,
      pattern: this.convert(track, options)
    }));
  }

  /**
   * Get pattern info/metadata
   */
  analyzePattern(pattern) {
    return {
      hasStacks: pattern.includes('stack('),
      hasBass: pattern.includes('note('),
      hasEffects: pattern.includes('.room(') || pattern.includes('.delay('),
      hasFilter: pattern.includes('.lpf(') || pattern.includes('.hpf('),
      hasRandomness: pattern.includes('perlin') || pattern.includes('choose'),
      complexity: this.estimateComplexity(pattern)
    };
  }

  /**
   * Estimate pattern complexity
   */
  estimateComplexity(pattern) {
    const indicators = {
      simple: pattern.length < 150 && !pattern.includes('sometimes'),
      medium: pattern.length < 300,
      complex: pattern.length >= 300 || pattern.includes('rarely')
    };

    if (indicators.complex) return 'complex';
    if (indicators.medium) return 'medium';
    return 'simple';
  }
}

// Create global instance
window.trackToStrudelConverter = new TrackToStrudelConverter();

console.log('🎼 Track-to-Strudel Converter loaded');
