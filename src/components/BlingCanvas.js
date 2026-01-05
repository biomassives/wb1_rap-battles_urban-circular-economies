import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

/**
 * Metadata & Template Definition
 * This defines the "Source of Truth" for the Rap Battle PFP / Biodiversity Token.
 */
const TOKEN_TEMPLATE = (pathData) => `
<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <bio:tokenID>BIO-AMZ-2026</bio:tokenID>
    <bio:standard>Accessible_Tech_v1</bio:standard>
  </metadata>
  <g id="base-gourd" data-depth="15" data-color="#1a120b">
    <path d="M250,50 Q150,50 100,200 Q70,350 150,450 L350,450 Q430,350 400,200 Q350,50 250,50 Z" />
  </g>
  <g id="identity-marks" data-depth="5" data-color="#aae8ff">
    <path d="${pathData}" />
  </g>
</svg>`;

/**
 * API Connector: Triggers the "Cash In" event for biodiversity token redemption
 */
export async function triggerStarlightRedemption(artistId, updateUI) {
    try {
        const response = await fetch('/api/cash-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ artist_id: artistId, action: 'cash_in' })
        });
        const data = await response.json();
        if (updateUI) updateUI(data.bling);
        return data;
    } catch (error) {
        console.error("Redemption failed:", error);
    }
}

/**
 * Main 3D Scene Initialization
 */
export async function initBling(container, artistData) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const loader = new SVGLoader();
    const group = new THREE.Group();

    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    scene.add(group);

    // 1. Identity Shader (The Pulse for the Ancestral Bridge)
    const identityMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uGlow: { value: artistData?.glow_intensity || 0.5 },
            uColor: { value: new THREE.Color(0xaae8ff) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uGlow;
            uniform vec3 uColor;
            void main() {
                float pulse = (sin(uTime * 2.5) * 0.4 + 0.6) * uGlow;
                gl_FragColor = vec4(uColor, pulse);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide
    });

    const woodMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2d1b0e, 
        roughness: 0.9, 
        metalness: 0.1 
    });

    // 2. SVG Processing (Layer-aware Extrusion)
    const svgString = TOKEN_TEMPLATE(artistData?.identity_path || "M250 140 V190");
    const svgData = loader.parse(svgString);

    svgData.paths.forEach((path) => {
        const parent = path.userData.node.parentNode;
        const depth = parseFloat(parent.getAttribute('data-depth')) || 1;
        
        const shapes = SVGLoader.createShapes(path);

        shapes.forEach((shape) => {
            const geometry = new THREE.ExtrudeGeometry(shape, {
                depth: depth,
                bevelEnabled: true,
                bevelThickness: 0.5,
                bevelSize: 0.5
            });

            // Assign material based on SVG Layer ID
            const meshMaterial = parent.id === 'identity-marks' ? identityMaterial : woodMaterial;
            
            const mesh = new THREE.Mesh(geometry, meshMaterial);
            
            // Correct SVG Orientation and Center
            mesh.rotation.x = Math.PI;
            mesh.position.set(-250, 250, 0); 
            group.add(mesh);
        });
    });

    // 3. Environment & Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffd700, 1.2, 800);
    pointLight.position.set(100, 100, 150);
    scene.add(pointLight);

    camera.position.z = 400;

    // 4. Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Organic rotation
        group.rotation.y = Math.sin(Date.now() * 0.0005) * 0.15;
        
        // Update Shader Uniforms
        identityMaterial.uniforms.uTime.value += 0.02;
        
        renderer.render(scene, camera);
    }
    animate();

    // Responsive Handlers
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}
