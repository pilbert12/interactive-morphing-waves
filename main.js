import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Camera position
camera.position.set(0, 30, 30);
camera.lookAt(0, 0, 0);

// Interactive parameters
const params = {
    pointSize: 0.05,
    opacity: 0.8,
    rippleSpeed: 2.0,
    rippleDecay: 0.98,
    rippleRadius: 0.5,
    rippleAmplitude: 0.2,
    waveSpeed: 1.0,
    colorSpeed: 0.5,
    baseWaveStrength: 0.2,
    sphereRadius: 10,
    helixRadius: 3,
    helixHeight: 30,
    helixTurns: 8,
    strandRadius: 0.8,
    strandGap: 1.2,
    toroidRadius: 12,
    toroidTubeRadius: 4,
    morphProgress: 0,
    morphState: 0, // 0: sphere, 1: helix, 2: toroid
    autoMorph: false,
    morphSpeed: 0.005,
    transitionProgress: 0 // Overall transition progress
};

// Ripple system
class Ripple {
    constructor(point) {
        this.origin = point.clone().normalize();
        this.radius = 0;
        this.amplitude = params.rippleAmplitude;
        this.age = 0;
    }

    update() {
        this.radius += params.rippleSpeed * 0.1;
        this.amplitude *= params.rippleDecay;
        this.age += 1;
        return this.amplitude > 0.01;
    }

    getDisplacement(point) {
        const normalizedPoint = point.clone().normalize();
        const angle = Math.acos(this.origin.dot(normalizedPoint));
        const distanceFromRing = Math.abs(angle - this.radius);
        
        if (distanceFromRing > params.rippleRadius) return 0;
        
        return this.amplitude * 
               (1 - distanceFromRing / params.rippleRadius) * 
               Math.cos(angle * 20 - this.age * 0.1);
    }
}

let activeRipples = [];

// Grid parameters
const gridSize = 200;
const geometry = new THREE.BufferGeometry();
const totalPoints = gridSize * gridSize;
const positions = new Float32Array(totalPoints * 3);
const colors = new Float32Array(totalPoints * 3);
const basePositions = new Float32Array(totalPoints * 3);

// Create initial positions and colors
for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
        const index = (i * gridSize + j) * 3;
        const u = (i / (gridSize - 1)) * Math.PI * 2;
        const v = (j / (gridSize - 1)) * Math.PI;

        // Store base planar positions (circular)
        const r = (j / gridSize) * params.sphereRadius;
        basePositions[index] = Math.cos(u) * r;
        basePositions[index + 1] = 0;
        basePositions[index + 2] = Math.sin(u) * r;

        // Initial spherical positions
        positions[index] = Math.sin(v) * Math.cos(u) * params.sphereRadius;
        positions[index + 1] = Math.cos(v) * params.sphereRadius;
        positions[index + 2] = Math.sin(v) * Math.sin(u) * params.sphereRadius;

        // Create gradient colors
        const color = new THREE.Color();
        color.setHSL(j / gridSize, 0.8, 0.5);
        colors[index] = color.r;
        colors[index + 1] = color.g;
        colors[index + 2] = color.b;
    }
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
    size: params.pointSize,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: params.opacity
});

const points = new THREE.Points(geometry, material);
scene.add(points);

// Click interaction
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([points]);
    
    if (intersects.length > 0) {
        activeRipples.push(new Ripple(intersects[0].point));
    }
});

// Animation parameters
const waves = [
    { amplitude: 0.5, frequency: 2.0, speed: 1.0, phase: 0 },
    { amplitude: 0.3, frequency: 3.0, speed: 1.5, phase: Math.PI / 4 },
    { amplitude: 0.2, frequency: 4.0, speed: 0.7, phase: Math.PI / 2 }
];

// GUI Setup
const gui = new dat.GUI();
const morphFolder = gui.addFolder('Morph Controls');
morphFolder.add(params, 'autoMorph').name('Auto Morph');
morphFolder.add(params, 'morphSpeed', 0.001, 0.01).name('Morph Speed');
morphFolder.open();

const helixFolder = gui.addFolder('Helix Controls');
helixFolder.add(params, 'helixRadius', 2, 6).name('Main Radius');
helixFolder.add(params, 'helixHeight', 10, 40).name('Height');
helixFolder.add(params, 'helixTurns', 4, 12).name('Turns');
helixFolder.add(params, 'strandRadius', 0.2, 2).name('Strand Thickness');
helixFolder.add(params, 'strandGap', 0.5, 2).name('Strand Spacing');
helixFolder.open();

const rippleFolder = gui.addFolder('Ripple Controls');
rippleFolder.add(params, 'rippleSpeed', 0.1, 5).name('Speed');
rippleFolder.add(params, 'rippleDecay', 0.9, 0.999).name('Decay');
rippleFolder.add(params, 'rippleRadius', 0.1, 1).name('Size');
rippleFolder.add(params, 'rippleAmplitude', 0.1, 1).name('Strength');
rippleFolder.open();

const waveFolder = gui.addFolder('Wave Controls');
waveFolder.add(params, 'waveSpeed', 0.1, 3).name('Speed');
waveFolder.add(params, 'baseWaveStrength', 0, 1).name('Strength');
waveFolder.add(params, 'colorSpeed', 0, 2).name('Color Speed');
waveFolder.open();

const visualFolder = gui.addFolder('Visual Controls');
visualFolder.add(params, 'pointSize', 0.01, 0.2).onChange(value => material.size = value);
visualFolder.add(params, 'opacity', 0, 1).onChange(value => material.opacity = value);
visualFolder.open();

const toroidFolder = gui.addFolder('Toroid Controls');
toroidFolder.add(params, 'toroidRadius', 8, 20).name('Main Radius');
toroidFolder.add(params, 'toroidTubeRadius', 2, 8).name('Tube Radius');
toroidFolder.open();

function getHelixPosition(u, v) {
    const angle = u * Math.PI * 2 * params.helixTurns;
    const height = (v - 0.5) * params.helixHeight;
    const mainRadius = params.helixRadius;
    
    // Create double helix effect with two intertwined strands
    const strandOffset = Math.PI * (v < 0.5 ? 0 : 1); // Separate strands
    const strandRadius = params.strandRadius;
    
    // Calculate main helix position
    const mainX = Math.cos(angle) * mainRadius;
    const mainZ = Math.sin(angle) * mainRadius;
    
    // Add smaller circular motion for strand thickness
    const secondaryAngle = angle * params.strandGap;
    const x = mainX + Math.cos(secondaryAngle + strandOffset) * strandRadius;
    const y = height;
    const z = mainZ + Math.sin(secondaryAngle + strandOffset) * strandRadius;
    
    return new THREE.Vector3(x, y, z);
}

function getToroidPosition(u, v) {
    const mainAngle = u * Math.PI * 2;
    const tubeAngle = v * Math.PI * 2;
    
    // Calculate position on torus
    const x = (params.toroidRadius + params.toroidTubeRadius * Math.cos(tubeAngle)) * Math.cos(mainAngle);
    const y = params.toroidTubeRadius * Math.sin(tubeAngle);
    const z = (params.toroidRadius + params.toroidTubeRadius * Math.cos(tubeAngle)) * Math.sin(mainAngle);
    
    return new THREE.Vector3(x, y, z);
}

// Math visualization functions
function formatNumber(num) {
    return Number(num.toFixed(3));
}

function updateMathPanel(point, index, time) {
    const u = (Math.floor(index / gridSize) / (gridSize - 1));
    const v = ((index % gridSize) / (gridSize - 1));

    // Update point coordinates
    document.getElementById('pointCoords').innerHTML = `
        Point[${Math.floor(index / gridSize)}, ${index % gridSize}]:<br>
        x = <span class="value">${formatNumber(point.x)}</span><br>
        y = <span class="value">${formatNumber(point.y)}</span><br>
        z = <span class="value">${formatNumber(point.z)}</span>
    `;

    // Update morphing equations with continuous transition progress
    const states = ['Sphere', 'Helix', 'Toroid'];
    const currentState = states[params.morphState];
    const nextState = states[(params.morphState + 1) % 3];
    document.getElementById('morphEquation').innerHTML = `
        Overall Progress: <span class="value">${formatNumber(params.transitionProgress / 3)}</span><br>
        Current Transition: ${currentState} → ${nextState}<br>
        Progress: <span class="value">${formatNumber(params.morphProgress)}</span><br>
        pos = (1 - t) * ${currentState}Pos + t * ${nextState}Pos
    `;

    // Update wave equations
    let waveHtml = 'Combined Wave Function:<br>y = ';
    waves.forEach((wave, i) => {
        const waveValue = wave.amplitude * params.baseWaveStrength * 
                         Math.sin(wave.frequency * point.length() + time * wave.speed * params.waveSpeed + wave.phase);
        waveHtml += `
            <div class="equation ${Math.abs(waveValue) > 0.1 ? 'active' : ''}">
            ${i > 0 ? ' + ' : ''}A${i} * sin(f${i}*r + s${i}*t + φ${i}) = <span class="value">${formatNumber(waveValue)}</span>
            </div>
        `;
    });
    document.getElementById('waveEquations').innerHTML = waveHtml;

    // Update helix equations
    const angle = u * Math.PI * 2 * params.helixTurns;
    document.getElementById('helixEquations').innerHTML = `
        Helix Parameters:<br>
        Angle = u * 2π * turns = <span class="value">${formatNumber(angle)}</span><br>
        Height = v * height = <span class="value">${formatNumber((v - 0.5) * params.helixHeight)}</span><br>
        Radius = <span class="value">${formatNumber(params.helixRadius)}</span><br>
        Strand Offset = <span class="value">${formatNumber(Math.PI * (v < 0.5 ? 0 : 1))}</span>
    `;

    // Update ripple equations
    let rippleHtml = 'Active Ripples:<br>';
    activeRipples.forEach((ripple, i) => {
        const displacement = ripple.getDisplacement(point);
        rippleHtml += `
            <div class="equation ${Math.abs(displacement) > 0.01 ? 'active' : ''}">
            Ripple ${i + 1}:<br>
            Age: <span class="value">${ripple.age}</span><br>
            Amplitude: <span class="value">${formatNumber(ripple.amplitude)}</span><br>
            Displacement: <span class="value">${formatNumber(displacement)}</span>
            </div>
        `;
    });
    document.getElementById('rippleEquations').innerHTML = rippleHtml || 'No active ripples';

    // Add toroid equations
    const mainAngle = (Math.floor(index / gridSize) / (gridSize - 1)) * Math.PI * 2;
    const tubeAngle = ((index % gridSize) / (gridSize - 1)) * Math.PI * 2;
    document.getElementById('helixEquations').innerHTML += `
        <br>Toroid Parameters:<br>
        Main Angle = <span class="value">${formatNumber(mainAngle)}</span><br>
        Tube Angle = <span class="value">${formatNumber(tubeAngle)}</span><br>
        Main Radius = <span class="value">${formatNumber(params.toroidRadius)}</span><br>
        Tube Radius = <span class="value">${formatNumber(params.toroidTubeRadius)}</span>
    `;
}

function animate() {
    requestAnimationFrame(animate);

    // Handle automated morphing
    if (params.autoMorph) {
        params.transitionProgress += params.morphSpeed;
        if (params.transitionProgress > 3) {
            params.transitionProgress = 0;
        }
        
        // Calculate current state and progress within that state
        params.morphState = Math.floor(params.transitionProgress);
        params.morphProgress = params.transitionProgress % 1;
    }

    const positions = geometry.attributes.position.array;
    const colors = geometry.attributes.color.array;
    const time = performance.now() * 0.001;

    // Update and filter out dead ripples
    activeRipples = activeRipples.filter(ripple => ripple.update());

    // Sample point for math visualization
    const sampleIndex = Math.floor(totalPoints / 2);

    for (let i = 0; i < totalPoints; i++) {
        const index = i * 3;
        const point = new THREE.Vector3();

        // Calculate normalized coordinates
        const u = (Math.floor(i / gridSize) / (gridSize - 1));
        const v = ((i % gridSize) / (gridSize - 1));

        // Get positions for all three shapes
        const sphereU = u * Math.PI * 2;
        const sphereV = v * Math.PI;
        const sphereX = Math.sin(sphereV) * Math.cos(sphereU) * params.sphereRadius;
        const sphereY = Math.cos(sphereV) * params.sphereRadius;
        const sphereZ = Math.sin(sphereV) * Math.sin(sphereU) * params.sphereRadius;
        const spherePos = new THREE.Vector3(sphereX, sphereY, sphereZ);

        const helixPos = getHelixPosition(u, v);
        const toroidPos = getToroidPosition(u, v);

        // Determine source and target positions based on current morph state
        let sourcePos, targetPos;
        if (params.morphState === 0) {
            sourcePos = toroidPos;
            targetPos = spherePos;
        } else if (params.morphState === 1) {
            sourcePos = spherePos;
            targetPos = helixPos;
        } else {
            sourcePos = helixPos;
            targetPos = toroidPos;
        }
        
        point.x = THREE.MathUtils.lerp(sourcePos.x, targetPos.x, params.morphProgress);
        point.y = THREE.MathUtils.lerp(sourcePos.y, targetPos.y, params.morphProgress);
        point.z = THREE.MathUtils.lerp(sourcePos.z, targetPos.z, params.morphProgress);

        let displacement = 0;
        
        // Base waves
        const distanceFromCenter = point.length();
        for (const wave of waves) {
            displacement += wave.amplitude * params.baseWaveStrength * 
                          Math.sin(wave.frequency * distanceFromCenter + time * wave.speed * params.waveSpeed + wave.phase);
        }

        // Add all active ripples
        for (const ripple of activeRipples) {
            displacement += ripple.getDisplacement(point);
        }

        // Apply displacement in the direction of the point's normal
        const normal = point.clone().normalize();
        point.add(normal.multiplyScalar(displacement));

        positions[index] = point.x;
        positions[index + 1] = point.y;
        positions[index + 2] = point.z;

        // Update math panel for sample point
        if (i === sampleIndex) {
            updateMathPanel(point, i, time);
        }

        // Update colors based on current shape and displacement
        const color = new THREE.Color();
        const hue = ((i % gridSize) / gridSize + time * params.colorSpeed) % 1;
        let brightness;
        if (params.morphState === 1) { // Helix
            brightness = v < 0.5 ? 0.3 : 0.7; // Different colors for DNA strands
        } else if (params.morphState === 2) { // Toroid
            const tubeAngle = v * Math.PI * 2;
            brightness = 0.5 + Math.sin(tubeAngle) * 0.2; // Gradient around the tube
        } else { // Sphere
            brightness = 0.5;
        }
        color.setHSL(hue, 0.8, brightness + displacement * 0.2);
        colors[index] = color.r;
        colors[index + 1] = color.g;
        colors[index + 2] = color.b;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate(); 