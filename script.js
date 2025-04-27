// Basic script file (currently empty, can be used for future interactivity)
console.log("FlowState website script loaded!");

// --- Audio Player and Spectrum/Waveform Analyzers Variables ---
// Declare these variables early so they are available when setupAnalyzerCanvas is called
const spectrumCanvas = document.getElementById('spectrum-analyzer-canvas'); 
const waveformCanvas = document.getElementById('waveform-analyzer-canvas'); 
const audioFileInput = document.getElementById('audio-file-input');
const audioElement = document.getElementById('audio-element');
const fileNameDisplay = document.getElementById('file-name-display');

const spectrumCtx = spectrumCanvas ? spectrumCanvas.getContext('2d') : null; 
const waveformCtx = waveformCanvas ? waveformCanvas.getContext('2d') : null; 

let audioContext;
let analyzerNode;
let sourceNode;
let frequencyDataArray; 
let timeDomainDataArray; 

// --- Sacred Geometry Visualizer variables 
let sacredGeometryParticles = []; 
const numParticles = 120;
let animationActive = false;
let lastFrameTime = 0;
const frameRate = 60;
const frameDelay = 1000 / frameRate;
let frequencyBeatDetection = new Array(5).fill(0);
let beatThreshold = 200;
let prevBeatDetectionAvg = 0;

// Example: Simple smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            const offset = 0; 
            const targetPosition = targetElement.offsetTop - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// --- Theme Toggle ---
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

// Define theme classes
const themeClasses = [
    '', 
    'theme-cyberpunk',
    'theme-matrix',
    'theme-synthwave',
    'theme-hacker'
];
let currentThemeIndex = 0;
let currentThemeClass = ''; 

// --- Particle System (Mouse Trail) ---
const particleCanvas = document.getElementById('particle-canvas'); 
const particleCtx = particleCanvas.getContext('2d'); 
let particlesArray = [];
const maxParticles = 300;
const particlesPerFrame = 2;

const mouse = {
    x: null,
    y: null,
};

let colorPalette = []; 

// Function to update the particle color palette based on current CSS variables
function updateParticleColors() {
     const rootStyles = getComputedStyle(document.documentElement);
     colorPalette = [
        rootStyles.getPropertyValue('--color-primary').trim(),
        rootStyles.getPropertyValue('--color-secondary').trim(),
        rootStyles.getPropertyValue('--color-accent-light').trim(),
        rootStyles.getPropertyValue('--color-accent-dark').trim(),
     ];
     // Optional: Clear existing particles when theme changes for a fresh start
     // particlesArray = []; 
}

// Function to apply a theme by its index in the themeClasses array
function applyThemeByIndex(index) {
    if (index < 0 || index >= themeClasses.length) {
        console.error("Invalid theme index:", index);
        return;
    }

    const newThemeClass = themeClasses[index];

    if (currentThemeClass && body.classList.contains(currentThemeClass)) {
         body.classList.remove(currentThemeClass);
    }

    if (newThemeClass) {
        body.classList.add(newThemeClass);
    }

    currentThemeClass = newThemeClass;
    currentThemeIndex = index;

    try {
        localStorage.setItem('currentThemeIndex', currentThemeIndex.toString());
    } catch (e) {
        console.error("Could not save theme to localStorage:", e);
    }

    updateParticleColors(); 
    setupAnalyzerCanvas();
    // Only call updateAbstractVisualizer if sacredGeometryParticles is initialized
    if (sacredGeometryParticles.length > 0) {
        updateAbstractVisualizer();
    }
    // If audio is playing, the animation loops will pick up the new colors
}

// Function to cycle through themes
function cycleThemes() {
    const nextThemeIndex = (currentThemeIndex + 1) % themeClasses.length;
    applyThemeByIndex(nextThemeIndex);
}

// Load theme from localStorage on page load
try {
    const savedThemeIndex = localStorage.getItem('currentThemeIndex');
    if (savedThemeIndex !== null) {
        const parsedIndex = parseInt(savedThemeIndex, 10);
        if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < themeClasses.length) {
            currentThemeIndex = parsedIndex;
        } else {
             currentThemeIndex = 0;
             console.warn("Invalid saved theme index, reverting to default.");
        }
    } else {
         currentThemeIndex = 0;
    }
} catch (e) {
    console.error("Could not load theme from localStorage:", e);
    currentThemeIndex = 0;
}

// Apply the initial theme determined by the loaded/default index
currentThemeClass = themeClasses[currentThemeIndex]; 
applyThemeByIndex(currentThemeIndex); 

// Add event listener to the toggle button
themeToggleBtn.addEventListener('click', cycleThemes);

// Update mouse position on mousemove
window.addEventListener('mousemove', function(event){
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

// Reset mouse position when it leaves the window to stop generating particles
window.addEventListener('mouseout', function(){
    mouse.x = null;
    mouse.y = null;
});

// Particle class (for mouse trail)
class Particle {
    constructor(x, y) { 
        this.x = x + (Math.random() - 0.5) * 15;
        this.y = y + (Math.random() - 0.5) * 15;
        this.size = Math.random() * 2 + 1;
        this.color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        this.velocityX = (Math.random() - 0.5) * 3;
        this.velocityY = (Math.random() - 0.5) * 3;
        this.alpha = 1;
        this.lifeSpan = Math.random() * 30 + 30;
        this.decayRate = 1 / this.lifeSpan;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;

        this.alpha -= this.decayRate;
        this.size *= 0.97;

        this.velocityX *= 0.98;
        this.velocityY *= 0.98;
    }

    draw() {
        if (this.alpha <= 0 || this.size <= 0.2) return;

        particleCtx.globalAlpha = this.alpha; 
        particleCtx.fillStyle = this.color; 
        particleCtx.beginPath(); 
        particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2); 
        particleCtx.closePath(); 
        particleCtx.fill(); 
    }
}

// Handle canvas resize - only for particle canvas
function resizeParticleCanvas() {
    particleCanvas.width = window.innerWidth; 
    particleCanvas.height = window.innerHeight; 
    // particlesArray = []; 
}

// Animation loop for particles
function animateParticles() {
     particleCtx.fillStyle = 'rgba(18, 18, 18, 0.15)'; 
     particleCtx.fillRect(0, 0, particleCanvas.width, particleCanvas.height); 

    if (mouse.x !== null && mouse.y !== null && particlesArray.length < maxParticles) {
        for (let i = 0; i < particlesPerFrame; i++) {
            particlesArray.push(new Particle(mouse.x, mouse.y));
        }
    }

    for (let i = particlesArray.length - 1; i >= 0; i--) {
        particlesArray[i].update();
        particlesArray[i].draw();

        if (particlesArray[i].alpha <= 0 || particlesArray[i].size <= 0.2) {
            particlesArray.splice(i, 1);
        }
    }

    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', resizeParticleCanvas); 
resizeParticleCanvas(); 
animateParticles(); 

// --- Audio Player and Spectrum/Waveform Analyzers Functions ---

// Initialize AudioContext on a user gesture (like file selection)
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyzerNode = audioContext.createAnalyser();
            analyzerNode.fftSize = 2048; 
            analyzerNode.smoothingTimeConstant = 0.8; 

            frequencyDataArray = new Uint8Array(analyzerNode.frequencyBinCount); 
            timeDomainDataArray = new Uint8Array(analyzerNode.fftSize); 

            analyzerNode.connect(audioContext.destination);

            console.log("AudioContext initialized");
        } catch (e) {
            console.error("Web Audio API is not supported or could not be initialized:", e);
            if(audioFileInput) audioFileInput.disabled = true;
            if(audioElement) audioElement.controls = false; 
            if(fileNameDisplay) fileNameDisplay.textContent = "Audio features not supported.";
        }
    }
}

// Function to set up audio source and connections
function setupAudioSource() {
    if (!audioContext || !analyzerNode || !audioElement) {
        console.error("Audio system not ready or not supported.");
        return;
    }

    if (sourceNode) {
         sourceNode.disconnect();
    }

    sourceNode = audioContext.createMediaElementSource(audioElement);

    sourceNode.connect(analyzerNode);

    console.log("Audio source connected to analyzer.");
}

// Draw the spectrum and waveform analyzers
function drawAnalyzers() {
    if (!analyzerNode || (!spectrumCtx && !waveformCtx) || !frequencyDataArray || !timeDomainDataArray) {
         setupAnalyzerCanvas();
         return;
    }

    analyzerNode.getByteFrequencyData(frequencyDataArray);

    analyzerNode.getByteTimeDomainData(timeDomainDataArray); 

    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--color-primary').trim();
    const secondaryColor = rootStyles.getPropertyValue('--color-secondary').trim();
    const accentColor = rootStyles.getPropertyValue('--color-accent-light').trim(); 

    if (spectrumCtx && spectrumCanvas) { 
        const canvasWidth = spectrumCanvas.width;
        const canvasHeight = spectrumCanvas.height;
        spectrumCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        const numBars = 128; 
        const step = Math.floor(frequencyDataArray.length / numBars);
        const barWidth = (canvasWidth / numBars) * 0.8; 
        const barGap = (canvasWidth / numBars) * 0.2;
        let x = 0;

        for (let i = 0; i < numBars; i++) {
            const index = i * step;
            if (index >= frequencyDataArray.length) break; 

            let barHeight = frequencyDataArray[index];
            barHeight = barHeight * (canvasHeight / 255); 

            const color = i % 2 === 0 ? primaryColor : secondaryColor;
            spectrumCtx.fillStyle = color;

            spectrumCtx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);

            x += barWidth + barGap; 
        }
    }


    if (waveformCtx && waveformCanvas) { 
        const canvasWidth = waveformCanvas.width;
        const canvasHeight = waveformCanvas.height;
        waveformCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        waveformCtx.lineWidth = 2;
        waveformCtx.strokeStyle = accentColor; 
        waveformCtx.beginPath();

        const sliceWidth = canvasWidth * 1.0 / timeDomainDataArray.length;
        let x = 0;

        for (let i = 0; i < timeDomainDataArray.length; i++) {
            const v = timeDomainDataArray[i] / 128.0; 
            const y = (v * canvasHeight) / 2; 

            if (i === 0) {
                waveformCtx.moveTo(x, y);
            } else {
                waveformCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        waveformCtx.lineTo(canvasWidth, canvasHeight / 2); 
        waveformCtx.stroke();
    }


    if (!audioElement.paused || sourceNode) { 
        requestAnimationFrame(drawAnalyzers);
    } else {
         setupAnalyzerCanvas(); 
    }
}

// Event listener for file input
audioFileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        initAudioContext(); 
         if (!audioContext) { 
             console.error("AudioContext not available, stopping file load.");
             fileNameDisplay.textContent = "Audio features disabled in this browser.";
             if (spectrumCtx) spectrumCtx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
             if (waveformCtx) waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
             setupAnalyzerCanvas(); 
             return;
         }

        const reader = new FileReader();

        reader.onload = function(e) {
            audioElement.src = e.target.result;
            fileNameDisplay.textContent = `Loaded: ${file.name}`;

            audioElement.onloadedmetadata = function() {
                setupAudioSource(); 
                 console.log("Audio metadata loaded, source setup complete.");
                 drawAnalyzers();
            };

            audioElement.onerror = function() {
                console.error("Error loading audio file.");
                fileNameDisplay.textContent = `Error loading file: ${file.name}`;
                 if (spectrumCtx) spectrumCtx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
                if (waveformCtx) waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
                setupAnalyzerCanvas(); 
                if (sourceNode) { sourceNode.disconnect(); sourceNode = null; } 
            }

            audioElement.load();
        };

        reader.onerror = function(e) {
            console.error("Error reading file:", e);
            fileNameDisplay.textContent = `Error reading file: ${file.name}`;
        };

        reader.readAsDataURL(file); 
    } else {
        audioElement.removeAttribute('src');
        fileNameDisplay.textContent = '';
        if (spectrumCtx) spectrumCtx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height); 
        if (waveformCtx) waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
         setupAnalyzerCanvas(); 
        if (sourceNode) { sourceNode.disconnect(); sourceNode = null; } 
        console.log("No file selected.");
    }
});

// Start drawing the spectrum/waveform when the audio starts playing
audioElement.addEventListener('play', () => {
     console.log("Audio playing, starting analyzer draw loop.");
     if (audioContext && audioContext.state === 'suspended') {
         audioContext.resume().then(() => {
             console.log("AudioContext resumed successfully.");
         });
     }
     drawAnalyzers(); 
     if (!animationActive) {
        toggleSacredGeometryVisualizer(true);
    }
});

// Optionally stop the drawing loop when audio is paused or ended (drawAnalyzers checks state)
audioElement.addEventListener('pause', () => {
     console.log("Audio paused.");
});

audioElement.addEventListener('ended', () => {
     console.log("Audio ended.");
});

// Initial canvas size setting and placeholder draw for Analyzers
function setupAnalyzerCanvas() {
     if (spectrumCanvas && spectrumCtx && waveformCanvas && waveformCtx) {
         const container = spectrumCanvas.parentElement; 
         if (container) { 
             const containerWidth = container.clientWidth;
             const spectrumHeight = spectrumCanvas.clientHeight; 
             const waveformHeight = waveformCanvas.clientHeight; 

             spectrumCanvas.width = containerWidth;
             spectrumCanvas.height = spectrumHeight;

             waveformCanvas.width = containerWidth;
             waveformCanvas.height = waveformHeight;

             spectrumCtx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
             spectrumCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
             spectrumCtx.font = '14px var(--font-body)';
             spectrumCtx.textAlign = 'center';
             spectrumCtx.textBaseline = 'middle';
             spectrumCtx.fillText('Spectrum Analyzer', spectrumCanvas.width / 2, spectrumCanvas.height / 2);

             waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
             waveformCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
             waveformCtx.font = '14px var(--font-body)';
             waveformCtx.textAlign = 'center';
             waveformCtx.textBaseline = 'middle';
             waveformCtx.fillText('Waveform Analyzer', waveformCanvas.width / 2, waveformCanvas.height / 2);
         } else {
             console.warn("Analyzer canvas container not found.");
         }
     } else {
         console.warn("Analyzer canvas elements or contexts not found. Skipping setup.");
     }
}

// Resize analyzer canvas when window resizes
function resizeAnalyzerCanvas() {
    setupAnalyzerCanvas(); 
}

window.addEventListener('resize', resizeAnalyzerCanvas);
setupAnalyzerCanvas(); 

// Ensure AudioContext starts in response to user gesture
document.addEventListener('click', initAudioContext, { once: true });
audioFileInput.addEventListener('change', initAudioContext, { once: true });
audioElement.addEventListener('play', initAudioContext, { once: true });

// --- Abstract Visualizer (Placeholder for now) ---
const abstractVisualizerCanvas = document.getElementById('abstract-visualizer-canvas');
const abstractVisualizerCtx = abstractVisualizerCanvas ? abstractVisualizerCanvas.getContext('2d') : null;

// Update sacred geometry colors based on theme
function updateSacredGeometryColors() {
    // Add safety check
    if (!sacredGeometryParticles || sacredGeometryParticles.length === 0) {
        console.log("Sacred geometry particles not initialized yet, skipping color update");
        return;
    }
    
    const rootStyles = getComputedStyle(document.documentElement);
    const colors = [
        rootStyles.getPropertyValue('--color-primary').trim(),
        rootStyles.getPropertyValue('--color-secondary').trim(),
        rootStyles.getPropertyValue('--color-accent-light').trim(),
        rootStyles.getPropertyValue('--color-accent-dark').trim(),
    ];
    
    sacredGeometryParticles.forEach(particle => {
        particle.color = colors[Math.floor(Math.random() * colors.length)];
    });
}

// Update abstract visualizer when theme changes
function updateAbstractVisualizer() {
    // Add safety check
    if (sacredGeometryParticles && sacredGeometryParticles.length > 0) {
        updateSacredGeometryColors();
    }
}

// Sacred Geometry classes
class SacredGeometryParticle {
    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.size = Math.random() * 15 + 5;
        this.baseSize = this.size;
        this.maxSize = this.size * 2;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.rotationAngle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 2 + 0.5;
        this.distance = Math.random() * 150 + 50;
        this.maxDistance = this.distance * 1.5;
        this.baseDistance = this.distance;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.shapeType = Math.floor(Math.random() * 6); // 0: circle, 1: triangle, 2: square, 3: pentagon, 4: hexagon, 5: flower
        this.color = null; // Will be set based on theme
        this.opacity = Math.random() * 0.5 + 0.5;
    }

    update(audioData, beatDetected) {
        this.rotationAngle += this.rotationSpeed;
        
        // Move in a circular/orbital pattern
        this.angle += 0.01;
        
        // If beat detected, increase size and distance temporarily
        if (beatDetected) {
            this.size = Math.min(this.maxSize, this.size * 1.2);
            this.distance = Math.min(this.maxDistance, this.distance * 1.05);
        } else {
            // Gradually return to base size and distance
            this.size = this.size * 0.95 + this.baseSize * 0.05;
            this.distance = this.distance * 0.95 + this.baseDistance * 0.05;
        }
        
        // Use distance to control orbital pattern
        this.x = canvasWidth / 2 + Math.cos(this.angle) * this.distance;
        this.y = canvasHeight / 2 + Math.sin(this.angle) * this.distance;
        
        // Bounce off edges (optional - can be disabled for orbital motion)
        if (this.x < 0 || this.x > canvasWidth) this.vx *= -1;
        if (this.y < 0 || this.y > canvasHeight) this.vy *= -1;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        
        switch (this.shapeType) {
            case 0: // Circle
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 1: // Triangle
                drawPolygon(ctx, 3, this.size, 0);
                break;
            case 2: // Square
                drawPolygon(ctx, 4, this.size, Math.PI / 4);
                break;
            case 3: // Pentagon
                drawPolygon(ctx, 5, this.size, 0);
                break;
            case 4: // Hexagon
                drawPolygon(ctx, 6, this.size, 0);
                break;
            case 5: // Flower of Life inspired
                const petals = 6;
                const innerRadius = this.size * 0.5;
                ctx.beginPath();
                for (let i = 0; i < petals; i++) {
                    const angle = (Math.PI * 2 / petals) * i;
                    const x = Math.cos(angle) * this.size;
                    const y = Math.sin(angle) * this.size;
                    ctx.moveTo(0, 0);
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }
}

// Helper function to draw regular polygons
function drawPolygon(ctx, sides, radius, startAngle = 0) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const angle = startAngle + (Math.PI * 2 / sides) * i;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.stroke();
}

// Initialize sacred geometry particles
function initSacredGeometryVisualizer() {
    if (!abstractVisualizerCanvas || !abstractVisualizerCtx) return;
    
    const canvasWidth = abstractVisualizerCanvas.width;
    const canvasHeight = abstractVisualizerCanvas.height;
    
    sacredGeometryParticles = [];
    for (let i = 0; i < numParticles; i++) {
        sacredGeometryParticles.push(new SacredGeometryParticle(canvasWidth, canvasHeight));
    }
    
    updateSacredGeometryColors();
}

// Draw the sacred geometry visualizer
function drawSacredGeometryVisualizer(timestamp) {
    if (!abstractVisualizerCanvas || !abstractVisualizerCtx || !animationActive) return;
    
    // Control frame rate
    if (timestamp - lastFrameTime < frameDelay) {
        requestAnimationFrame(drawSacredGeometryVisualizer);
        return;
    }
    
    lastFrameTime = timestamp;
    
    const canvasWidth = abstractVisualizerCanvas.width;
    const canvasHeight = abstractVisualizerCanvas.height;
    
    // Clear canvas with semi-transparent black for trail effect
    abstractVisualizerCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    abstractVisualizerCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Get audio data if available
    let audioData = new Uint8Array(analyzerNode ? analyzerNode.frequencyBinCount : 0);
    let beatDetected = false;
    
    if (analyzerNode && audioElement && !audioElement.paused) {
        analyzerNode.getByteFrequencyData(audioData);
        
        // Basic beat detection by monitoring bass frequencies
        // Typically bass is in the lower frequency range, e.g., 0-10 indices
        const bassAvg = (audioData[1] + audioData[2] + audioData[3] + audioData[4]) / 4;
        
        // Shift previous readings
        for (let i = frequencyBeatDetection.length - 1; i > 0; i--) {
            frequencyBeatDetection[i] = frequencyBeatDetection[i-1];
        }
        frequencyBeatDetection[0] = bassAvg;
        
        // Calculate the current average
        const currentBeatDetectionAvg = frequencyBeatDetection.reduce((sum, value) => sum + value, 0) / frequencyBeatDetection.length;
        
        // Beat is detected when current average is significantly higher than the previous average
        beatDetected = (currentBeatDetectionAvg - prevBeatDetectionAvg) > beatThreshold;
        
        prevBeatDetectionAvg = currentBeatDetectionAvg;
    }
    
    // Draw sacred geometry visualizer
    sacredGeometryParticles.forEach(particle => {
        particle.update(audioData, beatDetected);
        particle.draw(abstractVisualizerCtx);
    });
    
    // Draw connection lines between nearby particles
    drawConnections(abstractVisualizerCtx, sacredGeometryParticles, canvasWidth, canvasHeight);
    
    requestAnimationFrame(drawSacredGeometryVisualizer);
}

// Draw connections between particles that are close to each other
function drawConnections(ctx, particles, canvasWidth, canvasHeight) {
    const connectionDistance = canvasWidth * 0.1; // Adjust based on canvas size
    const maxConnections = 3; // Limit connections per particle
    
    particles.forEach(particleA => {
        let connections = 0;
        
        particles.forEach(particleB => {
            if (particleA === particleB || connections >= maxConnections) return;
            
            const dx = particleA.x - particleB.x;
            const dy = particleA.y - particleB.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < connectionDistance) {
                connections++;
                const opacity = (1 - distance / connectionDistance) * 0.2;
                ctx.strokeStyle = particleA.color;
                ctx.globalAlpha = opacity;
                ctx.beginPath();
                ctx.moveTo(particleA.x, particleA.y);
                ctx.lineTo(particleB.x, particleB.y);
                ctx.stroke();
            }
        });
    });
}

// Start/stop the visualizer animation
function toggleSacredGeometryVisualizer(start = true) {
    animationActive = start;
    if (start && abstractVisualizerCanvas && abstractVisualizerCtx) {
        drawSacredGeometryVisualizer(0);
    }
}

// Resize abstract visualizer canvas
function setupAbstractVisualizerCanvas() {
    if (abstractVisualizerCanvas && abstractVisualizerCtx) {
        const container = abstractVisualizerCanvas.parentElement;
        if (container) {
            abstractVisualizerCanvas.width = container.clientWidth;
            abstractVisualizerCanvas.height = 400; // Fixed height or adjust as needed
            
            // Initialize visualizer if not active
            if (!animationActive) {
                initSacredGeometryVisualizer();
                toggleSacredGeometryVisualizer(true);
            }
        } else {
            console.warn("Abstract visualizer canvas container not found.");
        }
    } else {
        console.warn("Abstract visualizer canvas or context not found. Skipping setup.");
    }
}

// Resize abstract visualizer canvas when window resizes
function resizeAbstractVisualizerCanvas() {
    setupAbstractVisualizerCanvas();
    initSacredGeometryVisualizer();
}

window.addEventListener('resize', resizeAbstractVisualizerCanvas);

window.addEventListener('DOMContentLoaded', () => {
    setupAbstractVisualizerCanvas();
});
