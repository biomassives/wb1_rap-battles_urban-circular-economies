---
layout: "../../layouts/DocLayout.astro"
title: "MOOG_3D_VISUALIZER_PLAN"
---
<div data-pagefind-filter="type:docs"></div>

# Moog 3D Visualizer - Full Implementation Plan

## Executive Summary
Transform the existing MoogVisualizer3D component into a fully interactive, production-ready 3D sound parameter visualization tool. Users can see their Moog synth parameters move through 3D space, drag control points to shape the sound envelope, and switch between multiple camera perspectives.

**Status**: Component created (639 lines) but not integrated into any page
**Priority**: High - Unique feature that demonstrates technical excellence
**Target Pages**: Music page, homepage (optional), dedicated `/synth-3d` page

---

## Current State Analysis

### ✅ What's Already Built
- **Component File**: `src/components/MoogVisualizer3D.astro` (639 lines)
- **Three.js Integration**: Scene, camera, renderer setup complete
- **Basic UI**: View controls (perspective, left, top, front), auto-rotate toggle
- **3D Axes**: X=Frequency (red), Y=Intensity (cyan), Z=Modulation (blue)
- **Control Points**: 4 vertices defining sound path (Start, Attack, Sustain, Release)
- **Styling**: Dark gradient background, responsive layout, mobile controls

### ❌ What's Missing
1. **No Integration**: Not included in any page
2. **No Moog Connection**: Not listening to MoogLooper parameter changes
3. **Incomplete Dragging**: Vertex dragging logic needs raycasting implementation
4. **No Audio Playback**: Can't hear the sound while visualizing
5. **Missing Features**: Particle trails, sound playback indicator, recording/export
6. **No Documentation**: Users don't know what they're looking at
7. **Performance**: Not optimized for mobile/low-end devices

---

## Implementation Phases

## Phase 1: Integration & Basic Functionality (Week 1)

### 1.1 Page Integration
**Goal**: Get the 3D visualizer visible on the music page

**Tasks**:
- [ ] Add MoogVisualizer3D to `/music` page below MoogLooper component
- [ ] Create dedicated route `/synth-3d` for full-screen experience
- [ ] Add tab to music page: "2D Controls | 3D Visualizer"
- [ ] Ensure Three.js CDN loads properly on all pages
- [ ] Test on mobile devices (performance concerns)

**Code Changes**:
```astro
// src/pages/music.astro
import MoogVisualizer3D from '../components/MoogVisualizer3D.astro';

<div class="moog-studio">
  <div class="moog-tabs">
    <button class="tab active" data-tab="2d">2D Controls</button>
    <button class="tab" data-tab="3d">3D Visualizer</button>
  </div>

  <div class="tab-content active" data-tab="2d">
    <MoogLooper compact={false} />
  </div>

  <div class="tab-content" data-tab="3d">
    <MoogVisualizer3D width={1200} height={800} />
  </div>
</div>
```

### 1.2 Moog Parameter Synchronization
**Goal**: 3D visualization responds to Moog dial changes in real-time

**Implementation**:
- [ ] Add event listener in MoogVisualizer3D for `moog-params-update` custom event
- [ ] Map Moog parameters to 3D space coordinates
- [ ] Update control point positions when parameters change
- [ ] Smooth animation between parameter changes (tweening)
- [ ] Add visual feedback when sound is playing

**Event System**:
```javascript
// MoogLooper emits:
window.dispatchEvent(new CustomEvent('moog-params-update', {
  detail: {
    frequency: 440,      // Hz
    duration: 2.5,       // seconds
    intensity: 0.8,      // 0-1
    modulation: 120,     // Hz
    isPlaying: true
  }
}));

// MoogVisualizer3D listens:
window.addEventListener('moog-params-update', (e) => {
  this.updateSoundPath(e.detail);
  if (e.detail.isPlaying) {
    this.playPathAnimation();
  }
});
```

**Coordinate Mapping**:
```javascript
// Map Moog params to 3D space (0-5 units)
mapToSpace(params) {
  return {
    x: (params.frequency / 2000) * 5,        // 20-2000 Hz → 0-5
    y: params.intensity * 5,                  // 0-1 → 0-5
    z: (params.modulation / 200) * 5,        // 0-200 Hz → 0-5

    // Duration affects path length/interpolation speed
    duration: params.duration
  };
}
```

### 1.3 Vertex Dragging with Raycasting
**Goal**: Users can click and drag control points to modify sound parameters

**Technical Requirements**:
- [ ] Implement Three.js Raycaster for mouse picking
- [ ] Create draggable spheres at control points
- [ ] Calculate 3D position from 2D mouse coordinates
- [ ] Lock dragging to specific planes (easier UX)
- [ ] Emit `vertex-dragged` events back to MoogLooper
- [ ] Show coordinate values while dragging

**Raycasting Implementation**:
```javascript
setupDragging() {
  this.raycaster = new THREE.Raycaster();
  this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  this.selectedVertex = null;

  this.canvas.addEventListener('mousedown', (e) => {
    const mouse = this.getMousePosition(e);
    this.raycaster.setFromCamera(mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.controlSpheres);
    if (intersects.length > 0) {
      this.selectedVertex = intersects[0].object;
      this.controls.enabled = false; // Disable orbit controls
    }
  });

  this.canvas.addEventListener('mousemove', (e) => {
    if (!this.selectedVertex) return;

    const mouse = this.getMousePosition(e);
    this.raycaster.setFromCamera(mouse, this.camera);

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersection);

    // Update vertex position
    this.selectedVertex.position.copy(intersection);
    this.updateControlPoint(this.selectedVertex.userData.index, intersection);
    this.updateSoundPath();
    this.emitParameterChange();
  });

  this.canvas.addEventListener('mouseup', () => {
    this.selectedVertex = null;
    this.controls.enabled = true;
  });
}

emitParameterChange() {
  // Reverse map 3D position to Moog parameters
  const params = this.mapFromSpace(this.controlPoints[1]); // Attack point
  window.dispatchEvent(new CustomEvent('3d-vertex-changed', {
    detail: params
  }));
}
```

---

## Phase 2: Advanced Visualization (Week 2)

### 2.1 Particle Trail System
**Goal**: Show sound "flowing" through the path as particles when playing

**Implementation**:
- [ ] Create particle system along the curve path
- [ ] Animate particles when sound is playing
- [ ] Color particles by intensity (brighter = louder)
- [ ] Fade particles based on duration envelope
- [ ] Pool particles for performance (reuse instead of create/destroy)

**Particle System**:
```javascript
createParticleTrail() {
  const particleCount = 500;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;

    colors[i * 3] = 1.0;      // R
    colors[i * 3 + 1] = 0.4;  // G
    colors[i * 3 + 2] = 0.8;  // B

    sizes[i] = Math.random() * 0.1 + 0.05;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  this.particleSystem = new THREE.Points(geometry, material);
  this.scene.add(this.particleSystem);
}

animateParticles(delta) {
  if (!this.isPlaying) return;

  const positions = this.particleSystem.geometry.attributes.position.array;
  const curve = new THREE.CatmullRomCurve3(this.controlPoints);

  for (let i = 0; i < positions.length / 3; i++) {
    // Move particle along curve
    this.particleProgress[i] += delta / this.params.duration;
    if (this.particleProgress[i] > 1) this.particleProgress[i] = 0;

    const point = curve.getPoint(this.particleProgress[i]);
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
  }

  this.particleSystem.geometry.attributes.position.needsUpdate = true;
}
```

### 2.2 Enhanced Camera Controls
**Goal**: Smooth, intuitive camera movement with OrbitControls

**Tasks**:
- [ ] Integrate Three.js OrbitControls
- [ ] Add smooth transitions between preset views
- [ ] Implement camera zoom with mouse wheel
- [ ] Add pan with right-click drag
- [ ] Create "Focus on point" feature (double-click vertex)
- [ ] Add reset camera button

**OrbitControls Integration**:
```javascript
setupCameraControls() {
  // Load OrbitControls from CDN
  this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
  this.controls.enableDamping = true;
  this.controls.dampingFactor = 0.05;
  this.controls.minDistance = 2;
  this.controls.maxDistance = 20;
  this.controls.target.set(2, 1, 0.5); // Center on sound path

  // Smooth view transitions
  this.cameraAnimating = false;
}

setView(view) {
  const positions = {
    perspective: { pos: [5, 5, 5], target: [2, 1, 0.5] },
    left: { pos: [-8, 2, 0.5], target: [2, 1, 0.5] },
    top: { pos: [2, 10, 0.5], target: [2, 1, 0.5] },
    front: { pos: [2, 1, 8], target: [2, 1, 0.5] }
  };

  const config = positions[view];
  this.animateCameraTo(
    new THREE.Vector3(...config.pos),
    new THREE.Vector3(...config.target)
  );
}

animateCameraTo(position, target, duration = 1000) {
  const startPos = this.camera.position.clone();
  const startTarget = this.controls.target.clone();
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = this.easeInOutCubic(progress);

    this.camera.position.lerpVectors(startPos, position, eased);
    this.controls.target.lerpVectors(startTarget, target, eased);
    this.controls.update();

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  animate();
}

easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
```

### 2.3 Visual Enhancements
**Goal**: Make the visualization beautiful and informative

**Features**:
- [ ] Glow effect on control spheres (bloom post-processing)
- [ ] Grid plane with subtle animation
- [ ] Axis labels with dynamic positioning (always face camera)
- [ ] Waveform preview at each control point
- [ ] Color-coded intensity zones (green=low, yellow=mid, red=high)
- [ ] Shadow/glow under sound path curve

**Bloom Effect**:
```javascript
setupPostProcessing() {
  // Bloom for glowing effect
  const renderScene = new THREE.RenderPass(this.scene, this.camera);
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,  // strength
    0.4,  // radius
    0.85  // threshold
  );

  this.composer = new THREE.EffectComposer(this.renderer);
  this.composer.addPass(renderScene);
  this.composer.addPass(bloomPass);
}

// In render loop:
render() {
  if (this.composer) {
    this.composer.render();
  } else {
    this.renderer.render(this.scene, this.camera);
  }
}
```

---

## Phase 3: Audio Integration & Playback (Week 3)

### 3.1 Synchronized Audio Playback
**Goal**: Play Moog sound while visualizing the path

**Implementation**:
- [ ] Trigger audio synthesis when play button clicked
- [ ] Show playback progress indicator on path
- [ ] Sync particle animation with audio playback
- [ ] Loop audio if enabled
- [ ] Visual feedback for attack/sustain/release phases

**Playback Indicator**:
```javascript
updatePlaybackIndicator(progress) {
  // progress: 0-1 representing position in sound duration
  const curve = new THREE.CatmullRomCurve3(this.controlPoints);
  const position = curve.getPoint(progress);

  // Update glowing sphere position
  this.playbackSphere.position.copy(position);
  this.playbackSphere.material.opacity = 1.0 - progress; // Fade out

  // Update particles to cluster around current position
  this.focusParticlesAt(position, progress);
}

// Listen to audio context time
listenToAudioPlayback() {
  window.addEventListener('moog-audio-playing', (e) => {
    const { currentTime, duration } = e.detail;
    const progress = currentTime / duration;
    this.updatePlaybackIndicator(progress);
  });
}
```

### 3.2 Recording & Export
**Goal**: Users can record parameter changes and export animations

**Features**:
- [ ] Record camera movements + parameter changes
- [ ] Export as video (WebM using canvas.captureStream)
- [ ] Export as JSON config (shareable sound designs)
- [ ] Import community sound paths
- [ ] Screenshot with transparent background

**Video Export**:
```javascript
startRecording() {
  const stream = this.renderer.domElement.captureStream(30); // 30 FPS
  this.mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9'
  });

  this.recordedChunks = [];
  this.mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      this.recordedChunks.push(e.data);
    }
  };

  this.mediaRecorder.onstop = () => {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moog-3d-${Date.now()}.webm`;
    a.click();
  };

  this.mediaRecorder.start();
  this.isRecording = true;
}

stopRecording() {
  if (this.mediaRecorder && this.isRecording) {
    this.mediaRecorder.stop();
    this.isRecording = false;
  }
}
```

---

## Phase 4: Polish & Optimization (Week 4)

### 4.1 Performance Optimization
**Goal**: Smooth 60 FPS on mobile devices

**Tasks**:
- [ ] Implement Level of Detail (LOD) system
- [ ] Reduce particle count on mobile (500 → 100)
- [ ] Use object pooling for particles
- [ ] Lazy load Three.js only when needed
- [ ] Debounce parameter updates
- [ ] Use requestAnimationFrame properly
- [ ] GPU profiling and optimization

**LOD Implementation**:
```javascript
setupLOD() {
  // Detect device capability
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const hasGPU = this.detectGPUCapability();

  if (isMobile || !hasGPU) {
    this.quality = 'low';
    this.particleCount = 100;
    this.enableBloom = false;
    this.shadowsEnabled = false;
  } else {
    this.quality = 'high';
    this.particleCount = 500;
    this.enableBloom = true;
    this.shadowsEnabled = true;
  }
}

detectGPUCapability() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return false;

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) return true; // Assume capable if can't detect

  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  return !renderer.toLowerCase().includes('swiftshader'); // Software renderer
}
```

### 4.2 User Experience Enhancements
**Goal**: Make it intuitive and delightful to use

**Features**:
- [ ] Interactive tutorial on first use
- [ ] Tooltips on all controls
- [ ] Keyboard shortcuts (Space=play, R=reset camera, 1-4=views)
- [ ] Undo/redo for vertex movements
- [ ] Preset sound paths (saw wave, sine wave, custom envelopes)
- [ ] "Randomize" button for inspiration
- [ ] Share link with current configuration

**Tutorial System**:
```javascript
showTutorial() {
  const steps = [
    {
      target: '.view-controls',
      text: 'Switch camera views to see the sound from different angles',
      position: 'bottom'
    },
    {
      target: '.control-sphere',
      text: 'Drag these spheres to shape your sound envelope',
      position: 'top'
    },
    {
      target: '.auto-rotate',
      text: 'Enable auto-rotate to see the path in motion',
      position: 'left'
    }
  ];

  this.currentTutorialStep = 0;
  this.showTutorialStep(steps[0]);
}
```

### 4.3 Accessibility
**Goal**: Usable by everyone, including keyboard-only users

**Requirements**:
- [ ] Full keyboard navigation
- [ ] ARIA labels on all interactive elements
- [ ] Screen reader announcements for parameter changes
- [ ] High contrast mode
- [ ] Reduced motion mode (disable particles/rotation)
- [ ] Focus indicators on all controls

---

## Technical Specifications

### Dependencies
```json
{
  "three": "^0.150.0",  // Core 3D engine
  "three-orbit-controls": "^82.1.0",  // Camera controls
  "@types/three": "^0.150.0"  // TypeScript definitions
}
```

Or use CDN for Astro:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r150/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.150.0/examples/js/controls/OrbitControls.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.150.0/examples/js/postprocessing/EffectComposer.js"></script>
```

### Event System
```typescript
// Events emitted by MoogVisualizer3D
interface Moog3DEvents {
  '3d-vertex-changed': {
    vertexIndex: number;
    position: { x: number; y: number; z: number };
    parameters: MoogParams;
  };

  '3d-view-changed': {
    view: 'perspective' | 'left' | 'top' | 'front';
    cameraPosition: { x: number; y: number; z: number };
  };

  '3d-recording-started': { timestamp: number };
  '3d-recording-stopped': { duration: number; blob: Blob };
}

// Events consumed by MoogVisualizer3D
interface MoogLooperEvents {
  'moog-params-update': MoogParams & { isPlaying: boolean };
  'moog-audio-playing': { currentTime: number; duration: number };
  'moog-preset-loaded': { presetName: string; params: MoogParams };
}
```

### Performance Targets
| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| FPS (Desktop) | 60 | 45 | 30 |
| FPS (Mobile) | 30 | 24 | 15 |
| Initial Load | <2s | <4s | <8s |
| Memory Usage | <50MB | <100MB | <200MB |
| Particle Count (High) | 500 | 300 | 100 |
| Particle Count (Low) | 100 | 50 | 25 |

---

## Integration Checklist

### Music Page Integration
- [ ] Add tab switcher for 2D/3D views
- [ ] Ensure Moog controls affect 3D visualization
- [ ] Test on all browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive layout
- [ ] Performance profiling

### Homepage Integration (Optional)
- [ ] Add compact 3D preview in hero section
- [ ] "Try 3D Visualizer" CTA button
- [ ] Auto-play demo animation on load
- [ ] Link to full experience on music page

### Dedicated Route `/synth-3d`
- [ ] Full-screen 3D visualizer
- [ ] Side panel with Moog controls
- [ ] Advanced features (recording, sharing)
- [ ] Documentation and tutorial
- [ ] Community showcase of shared sounds

---

## Testing Plan

### Unit Tests
- [ ] Coordinate mapping (Moog params ↔ 3D space)
- [ ] Event emission and handling
- [ ] Particle system performance
- [ ] Raycasting accuracy

### Integration Tests
- [ ] MoogLooper ↔ MoogVisualizer3D communication
- [ ] Audio playback synchronization
- [ ] Recording and export functionality
- [ ] Mobile touch interactions

### Browser Testing
- [ ] Chrome (Desktop & Mobile)
- [ ] Firefox (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile)
- [ ] Edge (Desktop)

### Performance Testing
- [ ] FPS monitoring across devices
- [ ] Memory leak detection (24-hour stress test)
- [ ] GPU usage profiling
- [ ] Network bandwidth (Three.js CDN load time)

### User Testing
- [ ] First-time user experience (tutorial clarity)
- [ ] Advanced user workflow (sound design)
- [ ] Accessibility audit (screen reader, keyboard)
- [ ] Cross-browser compatibility

---

## Documentation Needs

### User-Facing
- [ ] "What is 3D Sound Visualization?" explainer
- [ ] Interactive tutorial (first-time use)
- [ ] Keyboard shortcuts reference
- [ ] Video tutorial (30-second demo)
- [ ] FAQ section

### Developer-Facing
- [ ] Component API documentation
- [ ] Event system reference
- [ ] Customization guide (colors, particle count, etc.)
- [ ] Performance optimization tips
- [ ] Troubleshooting guide

---

## Success Metrics

### User Engagement
- [ ] 30%+ of music page visitors try 3D visualizer
- [ ] Average session >2 minutes on 3D view
- [ ] 10%+ create and share sound designs
- [ ] <5% bounce rate from performance issues

### Technical Metrics
- [ ] <1% error rate (Three.js errors)
- [ ] 60 FPS on 80%+ of desktop devices
- [ ] 30 FPS on 60%+ of mobile devices
- [ ] <3s load time on 4G connection

### Community Metrics
- [ ] 50+ shared sound designs in first month
- [ ] 10+ community tutorials/demos
- [ ] Featured on Three.js showcase
- [ ] Positive feedback on social media

---

## Future Enhancements (Post-Launch)

### Advanced Features
- [ ] **VR Support**: View in VR headset (WebXR)
- [ ] **Multiplayer**: Collaborate on sound design in real-time
- [ ] **AI Assistant**: Suggest parameter changes for desired sound
- [ ] **MIDI Input**: Control parameters with MIDI controllers
- [ ] **Sound Library**: Browse community creations
- [ ] **Generative Art**: Export as NFT with animated 3D path

### Technical Improvements
- [ ] Web Workers for heavy computation
- [ ] WebAssembly for particle simulation
- [ ] Service Worker for offline use
- [ ] IndexedDB for local sound library
- [ ] WebRTC for multiplayer features

---

## Risk Assessment

### High Risk
- **Three.js Bundle Size**: CDN dependency or large bundle
  - *Mitigation*: Lazy load, code splitting, CDN with fallback

- **Mobile Performance**: Complex 3D may lag on low-end devices
  - *Mitigation*: Aggressive LOD, quality settings, feature detection

### Medium Risk
- **Browser Compatibility**: WebGL support varies
  - *Mitigation*: Feature detection, graceful fallback to 2D view

- **User Confusion**: 3D interface may be overwhelming
  - *Mitigation*: Tutorial, tooltips, simple default state

### Low Risk
- **Recording Feature**: Browser compatibility for canvas.captureStream
  - *Mitigation*: Progressive enhancement, fallback to screenshot

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1: Integration | Week 1 | Component on music page, parameter sync, basic dragging |
| Phase 2: Visualization | Week 2 | Particles, camera controls, visual polish |
| Phase 3: Audio | Week 3 | Playback sync, recording, export |
| Phase 4: Polish | Week 4 | Performance, UX, accessibility, testing |
| **Total** | **4 Weeks** | **Production-Ready 3D Visualizer** |

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Prioritize phases** based on resources
3. **Set up tracking** (GitHub project board)
4. **Begin Phase 1** implementation
5. **Weekly demos** to gather feedback

---

**Document Version**: 1.0
**Last Updated**: 2026-01-03
**Author**: Claude Code
**Status**: Planning Complete - Ready for Implementation
