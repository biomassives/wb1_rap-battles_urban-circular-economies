# Rapper 3D Builder - Three.js Implementation Plan

**Version:** 1.0
**Target:** `/rapper-threejs-template-builder`
**Technology:** Three.js + WebGL + Astro

---

## Vision

Create an **interactive 3D rapper character builder** using Three.js that allows users to:
- Rotate, zoom, and view characters from all angles
- Customize 3D models with real-time updates
- Export as GLB/GLTF for AR/VR compatibility
- Render high-quality 2D snapshots for NFT cards
- Animate characters with idle movements and poses

---

## Core Features

### 1. 3D Character Model

#### Base Mesh Options
- **Male Rapper Model**
  - Athletic build, angular jawline
  - Broader shoulders
  - Defined musculature (low-poly style)

- **Female Rapper Model**
  - Feminine proportions
  - Softer facial features
  - Customizable body type slider

#### Art Style
- **Low-Poly Aesthetic** (3000-5000 triangles)
  - Faceted geometry (geodesic inspiration)
  - Sharp angles and clean lines
  - Optimized for web performance

- **Cel-Shaded Rendering**
  - Cartoon outline effect
  - Flat color zones with edge highlights
  - Minimal shadow complexity

### 2. Customization System

#### Facial Features
```javascript
{
  faceShape: ['angular', 'rounded', 'square', 'heart'],
  eyeShape: ['almond', 'round', 'narrow', 'wide'],
  eyeColor: ['brown', 'blue', 'green', 'hazel', 'custom'],
  noseType: ['small', 'medium', 'large', 'wide', 'narrow'],
  lipShape: ['thin', 'medium', 'full', 'heart'],
  earSize: ['small', 'medium', 'large'],
  facialHair: ['none', 'goatee', 'beard', 'mustache', 'stubble']
}
```

#### Hair System
- **10+ Hairstyle Meshes:**
  - Dreadlocks (rope geometry)
  - Afro (sphere cluster)
  - Fade (sculpted cap)
  - Braids (bezier curves)
  - Top Bun
  - Waves (subdivided planes)
  - Mohawk
  - Cornrows
  - Ponytail
  - Buzz cut

- **Hair Colors:**
  - Natural: Black, Brown, Blonde, Auburn, Gray
  - Vibrant: Red, Blue, Green, Purple, Pink
  - Multi-tone support

#### Accessories (3D Models)
```javascript
accessories: {
  headwear: [
    'baseball-cap',
    'beanie',
    'snapback',
    'bucket-hat',
    'durag',
    'crown',
    'headphones'
  ],
  eyewear: [
    'aviator-sunglasses',
    'round-sunglasses',
    'rectangular-shades',
    'ski-goggles',
    'vr-headset',
    'glasses'
  ],
  neckwear: [
    'gold-chain',
    'diamond-chain',
    'dog-tag',
    'choker',
    'pendant',
    'multiple-chains'
  ],
  earrings: [
    'studs',
    'hoops',
    'dangles',
    'diamond-studs',
    'grills' // teeth accessory
  ],
  clothing: [
    'hoodie',
    'jersey',
    't-shirt',
    'leather-jacket',
    'bomber-jacket',
    'tank-top'
  ]
}
```

#### Skin Tones
- **16 Preset Tones** (expanded from 6)
- **Custom RGB Picker**
- **Subsurface Scattering** (simulated for realistic skin)

#### Animal Spirit Integration
- **3D Animal Overlays:**
  - Translucent 3D models that wrap around character
  - Particle effects emanating from spirit animal
  - Aura colors based on animal type
  - Animated floating/rotating spirits

### 3. 3D Scene Setup

#### Camera System
```javascript
{
  type: 'PerspectiveCamera',
  fov: 50,
  near: 0.1,
  far: 1000,
  position: { x: 0, y: 1.6, z: 3 },
  controls: 'OrbitControls',
  limits: {
    minDistance: 1.5,
    maxDistance: 5,
    minPolarAngle: Math.PI / 4,
    maxPolarAngle: (3 * Math.PI) / 4,
    enablePan: false
  }
}
```

#### Lighting Setup
```javascript
lights: [
  {
    type: 'AmbientLight',
    color: 0xffffff,
    intensity: 0.4
  },
  {
    type: 'DirectionalLight',
    color: 0xffffff,
    intensity: 0.8,
    position: { x: 2, y: 3, z: 2 },
    castShadow: true
  },
  {
    type: 'DirectionalLight', // Fill light
    color: 0x00ffff,
    intensity: 0.3,
    position: { x: -2, y: 1, z: -1 }
  },
  {
    type: 'PointLight', // Rim light
    color: 0x00ff00,
    intensity: 0.5,
    position: { x: 0, y: 2, z: -2 }
  }
]
```

#### Environment
- **Skybox Options:**
  - Urban rooftop
  - Recording studio
  - Stage with lights
  - Graffiti alley
  - Abstract neon grid

- **Ground Plane:**
  - Reflective surface (mirror effect)
  - Shadow receiver
  - Optional grid overlay

### 4. Animation System

#### Idle Animations
```javascript
animations: {
  idle: {
    breathe: true, // Chest rise/fall
    headBob: { intensity: 0.2, speed: 0.5 },
    armSway: { intensity: 0.1, speed: 0.3 }
  },
  pose1: 'arms-crossed',
  pose2: 'mic-holding',
  pose3: 'hand-gestures',
  pose4: 'lean-back',
  pose5: 'pointing'
}
```

#### Facial Expressions
- Neutral
- Smile
- Smirk
- Serious
- Surprised
- Angry

#### Blend Shapes (Morph Targets)
- Smile intensity
- Eye openness
- Eyebrow position
- Jaw movement

### 5. UI/UX Design

#### Layout Structure
```
+------------------------------------------+
|  [🔙 Back] [🎲 Random] [💾 Export]      |
+------------------------------------------+
|                          |               |
|                          | CONTROLS:     |
|      3D VIEWER           |               |
|                          | • Gender      |
|   (Rotate character)     | • Face Shape  |
|                          | • Skin Tone   |
|                          | • Hair        |
|                          | • Accessories |
|                          | • Animal      |
|                          | • Pose        |
|                          | • Expression  |
|                          |               |
|                          | PRESETS:      |
|                          | [Card 1]      |
|                          | [Card 2]      |
|                          | [Card 3]      |
+------------------------------------------+
|  VIEW: [Front][Side][Back][Free Rotate] |
+------------------------------------------+
```

#### Control Panel Features
- **Tabbed Interface:**
  - Body (gender, build, skin)
  - Face (features, expression)
  - Hair & Headwear
  - Accessories
  - Clothing
  - Animal Spirit
  - Pose & Animation

- **Visual Sliders:**
  - Material sliders with live preview
  - Color pickers with swatches
  - Intensity/scale controls

- **Quick Presets:**
  - Save custom presets to localStorage
  - Load community-shared presets
  - Export/import preset JSON

### 6. Export & Rendering

#### Screenshot Capture
```javascript
export const captureScreenshot = (size = { width: 1024, height: 1024 }) => {
  renderer.setSize(size.width, size.height);
  renderer.render(scene, camera);

  return renderer.domElement.toDataURL('image/png');
};
```

#### Model Export Formats
- **GLB** (binary GLTF) - for AR/VR
- **GLTF** (JSON + binaries) - for web
- **OBJ** - for 3D printing
- **FBX** - for animation software

#### Render Passes
- **Beauty Pass** (full color)
- **Outline Pass** (cel-shading edges)
- **Depth Pass** (for post-processing)
- **Normal Pass** (for lighting adjustments)

### 7. Performance Optimization

#### Level of Detail (LOD)
```javascript
const lod = new THREE.LOD();
lod.addLevel(highPolyMesh, 0);    // 0-2 units away
lod.addLevel(mediumPolyMesh, 2);  // 2-5 units away
lod.addLevel(lowPolyMesh, 5);     // 5+ units away
```

#### Texture Optimization
- **Atlas Mapping** (combine textures)
- **Compressed Formats:** WEBP for textures
- **Mipmapping** for distant objects
- **Lazy Loading** for accessories

#### Render Optimization
- **Frustum Culling** (don't render off-screen)
- **Occlusion Culling** (don't render hidden parts)
- **Instanced Rendering** for particles
- **60 FPS Target** on modern devices

---

## Technical Stack

### Core Libraries
```json
{
  "three": "^0.160.0",
  "@types/three": "^0.160.0",
  "@react-three/fiber": "^8.15.0", // Optional: React integration
  "@react-three/drei": "^9.95.0",  // Helper components
  "lil-gui": "^0.19.0",             // Debug controls
  "gsap": "^3.12.0"                 // Animations
}
```

### Optional Enhancements
- **Cannon.js / Rapier:** Physics engine (cloth simulation)
- **Tone.js:** Audio reactivity (visualizer mode)
- **TensorFlow.js:** Face tracking for expression mirroring
- **AR.js / 8th Wall:** Augmented reality preview

---

## File Structure

```
src/pages/
  rapper-threejs-template-builder.astro   # Main page

public/
  models/
    rapper-male-base.glb                  # Base male model
    rapper-female-base.glb                # Base female model
    hair/
      dreads.glb
      afro.glb
      fade.glb
      ...
    accessories/
      chain-gold.glb
      sunglasses-aviator.glb
      ...
    animals/
      chicken-spirit.glb
      lion-spirit.glb
      ...

  textures/
    skin/
      tone-01.png
      tone-02.png
      ...
    hair/
      black.png
      brown.png
      ...

  scripts/
    three-builder/
      SceneManager.js            # Three.js scene setup
      CharacterBuilder.js        # Character assembly logic
      AccessoryManager.js        # Load/attach accessories
      ExportManager.js           # GLB/PNG export
      PresetManager.js           # Save/load presets
      AnimationController.js     # Idle animations
```

---

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Three.js scene with OrbitControls
- [ ] Load base male/female models
- [ ] Implement camera system
- [ ] Add basic lighting
- [ ] Create control panel UI (HTML/CSS)

### Phase 2: Customization (Week 3-4)
- [ ] Skin tone material swapping
- [ ] Hair mesh swapping system
- [ ] Facial feature blend shapes
- [ ] Accessory attachment system
- [ ] Material editor (color pickers)

### Phase 3: Polish (Week 5-6)
- [ ] Idle animations with GSAP
- [ ] Pose presets
- [ ] Animal spirit particle effects
- [ ] Screenshot/export functionality
- [ ] Performance optimization (LOD)

### Phase 4: Integration (Week 7-8)
- [ ] Save presets to database
- [ ] Share presets via URL
- [ ] Connect to NFT minting workflow
- [ ] AR preview mode (mobile)
- [ ] Community gallery

---

## Interaction Patterns

### Mouse/Touch Controls
```javascript
controls = {
  leftClick: 'rotate',
  rightClick: 'pan', // disabled
  scroll: 'zoom',
  doubleTap: 'reset camera',
  pinch: 'zoom (mobile)'
}
```

### Keyboard Shortcuts
```javascript
shortcuts = {
  'Space': 'toggle rotation',
  'R': 'randomize character',
  'E': 'export PNG',
  'S': 'save preset',
  'Arrow Keys': 'rotate camera',
  '1-5': 'switch poses',
  'F': 'front view',
  'B': 'back view',
  'L/R': 'left/right view'
}
```

---

## Integration with Existing System

### NFT Gallery Link
- Button in `/nft-gallery` → "VIEW IN 3D"
- Loads character with same attributes
- Allows 360° inspection before minting

### Battle System
- Pre-battle character preview
- 3D avatar shown during matchups
- Animated victory poses

### Profile Page
- 3D rotating profile picture
- Interactive business card

---

## Future Enhancements

### AR Mode
- WebXR integration
- Place character in real environment
- Scale adjustment
- Screenshot with real background

### VR Mode
- Walk around character
- Virtual recording studio
- Multiplayer character showcase

### AI Features
- Face upload → auto-generate character
- Voice input → animate lip sync
- Style transfer from uploaded photo

### Blockchain Integration
- Mint 3D model as NFT
- Store GLB on Arweave
- Verifiable rarity traits
- Evolution/leveling system

---

## Asset Requirements

### 3D Models Needed
1. **Base Characters:**
   - Male base (rigged, T-pose)
   - Female base (rigged, T-pose)

2. **Hair Meshes:** 10+ styles

3. **Accessories:** 30+ items
   - Hats, glasses, jewelry, clothing

4. **Animal Spirits:** 10 models
   - Low-poly, translucent materials

### Texture Maps
- Diffuse/Albedo
- Normal maps (for detail)
- Roughness/Metallic (PBR)
- Emission (for glowing elements)

### Animations
- Idle breathing loop
- 5 pose snapshots
- Facial expression blend shapes

---

## Performance Targets

| Metric | Target | Max |
|--------|--------|-----|
| FPS | 60 | 30 |
| Draw Calls | <50 | 100 |
| Triangles | 5,000 | 10,000 |
| Textures | 10MB | 20MB |
| Load Time | <3s | 5s |

---

## Example Code Snippets

### Scene Setup
```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class RapperBuilder {
  constructor(container) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(0, 1.6, 3);
    this.controls.update();

    this.setupLights();
    this.animate();
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(2, 3, 2);
    keyLight.castShadow = true;
    this.scene.add(keyLight);
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
```

### Loading Character Model
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

async function loadCharacter(gender, config) {
  const loader = new GLTFLoader();
  const modelPath = `/models/rapper-${gender}-base.glb`;

  const gltf = await loader.loadAsync(modelPath);
  const character = gltf.scene;

  // Apply skin tone
  character.traverse((child) => {
    if (child.isMesh && child.material.name === 'Skin') {
      child.material.color.set(config.skinTone);
    }
  });

  return character;
}
```

---

## Success Metrics

- **User Engagement:** Avg. time on page >3 minutes
- **Export Rate:** 30%+ of visitors export a character
- **Preset Sharing:** 10%+ share custom presets
- **Performance:** 60 FPS on 80%+ of devices
- **Mobile Support:** Full functionality on iOS/Android

---

## Budget Estimate

| Item | Cost | Notes |
|------|------|-------|
| 3D Modeler (contract) | $2,000 | Base characters + 20 accessories |
| Hair models | $500 | 10 hairstyles |
| Animal spirits | $400 | 10 models |
| Textures & materials | $300 | PBR sets |
| Three.js dev time | 80 hrs | @ your rate |
| Testing & optimization | 20 hrs | Performance tuning |
| **Total** | **~$3,200** | + dev time |

---

**Status:** Planning Phase
**Next Steps:**
1. Approve plan & budget
2. Source/commission 3D models
3. Set up Three.js boilerplate
4. Begin Phase 1 development

---

Built with ⚡ for WorldBridger One NFT Platform
