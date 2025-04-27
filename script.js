// Basic script file (currently empty, can be used for future interactivity)
console.log("FlowState website script loaded!");

// Example: Simple smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            // Calculate target position considering potential fixed header (though none exists yet)
            const offset = 0; // Adjust if you add a fixed header
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
// The first item is an empty string representing the default theme
const themeClasses = [
    '', // Default theme (no specific class)
    'theme-cyberpunk',
    'theme-matrix',
    'theme-synthwave',
    'theme-hacker'
];
let currentThemeIndex = 0;
let currentThemeClass = ''; // Variable to store the name of the currently applied theme class

// --- Particle System (Mouse Trail) ---
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];
const maxParticles = 300;
const particlesPerFrame = 2;

const mouse = {
    x: null,
    y: null,
};

let colorPalette = []; // Declare colorPalette before updateParticleColors

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
    // Ensure the index is valid
    if (index < 0 || index >= themeClasses.length) {
        console.error("Invalid theme index:", index);
        return;
    }

    const newThemeClass = themeClasses[index];

    // Remove the old theme class if it exists and is not empty
    // We only remove if currentThemeClass is truthy (not '') AND it is actually on the body
    if (currentThemeClass && body.classList.contains(currentThemeClass)) {
         body.classList.remove(currentThemeClass);
    }

    // Add the new theme class if it is not empty
    if (newThemeClass) {
        body.classList.add(newThemeClass);
    }

    // Update the stored current theme class and index
    currentThemeClass = newThemeClass;
    currentThemeIndex = index;

    // Store the current theme index in localStorage
    try {
        localStorage.setItem('currentThemeIndex', currentThemeIndex.toString());
    } catch (e) {
        console.error("Could not save theme to localStorage:", e);
    }


    // Update particle colors after theme changes
    updateParticleColors(); // This call is now safe because colorPalette is declared above
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
        // Validate the parsed index
        if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < themeClasses.length) {
            currentThemeIndex = parsedIndex;
        } else {
             // If saved index is invalid, use default (index 0)
             currentThemeIndex = 0;
             console.warn("Invalid saved theme index, reverting to default.");
        }
    } else {
         // If no saved theme, use default (index 0)
         currentThemeIndex = 0;
    }
} catch (e) {
    console.error("Could not load theme from localStorage:", e);
    // Fallback to default theme if localStorage access fails
    currentThemeIndex = 0;
}

// Apply the initial theme determined by the loaded/default index
// Need to set initial currentThemeClass *before* the first call to applyThemeByIndex
// This ensures the logic for removing the "old" class works correctly even on first load
// Also ensure particle colors are updated on first load with the correct theme
currentThemeClass = themeClasses[currentThemeIndex]; // Set the class name based on the loaded index
applyThemeByIndex(currentThemeIndex); // Apply the theme (which will effectively re-apply it but setup the system correctly)
updateParticleColors(); // Explicitly call after initial theme application

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

// Particle class
class Particle {
    constructor(x, y) { // Removed color parameter, use palette internally
        this.x = x + (Math.random() - 0.5) * 15;
        this.y = y + (Math.random() - 0.5) * 15;
        this.size = Math.random() * 2 + 1;
        // Select color from the updated palette
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

        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}

// Handle canvas resize - only for particle canvas
function resizeParticleCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesArray = []; // Clear particles on resize
}

// Animation loop for particles
function animateParticles() {
     // Use a low alpha background fill for a subtle trail effect
     // Retrieve the current background color dynamically if needed, but using a semi-transparent dark fill is simpler
     // Note: This fill color is static. If you want the trail to perfectly match the themed background,
     // you would need to dynamically get the --color-background and its alpha, which is more complex.
     // A consistent dark transparent overlay often looks fine regardless of theme.
     ctx.fillStyle = 'rgba(18, 18, 18, 0.15)'; // Semi-transparent dark fill
     ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add new particles
    if (mouse.x !== null && mouse.y !== null && particlesArray.length < maxParticles) {
        for (let i = 0; i < particlesPerFrame; i++) {
            // Pass mouse coordinates, particle constructor now gets color from global palette
            particlesArray.push(new Particle(mouse.x, mouse.y));
        }
    }

    // Update and draw particles
    for (let i = particlesArray.length - 1; i >= 0; i--) {
        particlesArray[i].update();
        particlesArray[i].draw();

        // Remove particles
        if (particlesArray[i].alpha <= 0 || particlesArray[i].size <= 0.2) {
            particlesArray.splice(i, 1);
        }
    }

    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', resizeParticleCanvas); // Add resize listener
resizeParticleCanvas(); // Initial call
animateParticles(); // Start particle animation

// --- Audio Player and Spectrum Analyzer ---
const audioFileInput = document.getElementById('audio-file-input');
const audioElement = document.getElementById('audio-element');
const analyzerCanvas = document.getElementById('spectrum-analyzer-canvas');
const fileNameDisplay = document.getElementById('file-name-display');
const analyzerCtx = analyzerCanvas.getContext('2d');

let audioContext;
let analyzerNode;
let sourceNode;
let audioDataArray; // To hold frequency data

// Initialize AudioContext on a user gesture (like file selection)
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyzerNode = audioContext.createAnalyser();
            analyzerNode.fftSize = 2048; // Determines number of data points
            audioDataArray = new Uint8Array(analyzerNode.frequencyBinCount); // Array to hold frequency data

            // Connect analyzer to destination (speakers)
            analyzerNode.connect(audioContext.destination);

            console.log("AudioContext initialized");
        } catch (e) {
            console.error("Web Audio API is not supported in this browser:", e);
        }
    }
}

// Function to set up audio source and connections
function setupAudioSource() {
    if (!audioContext || !analyzerNode || !audioElement) {
        console.error("Audio system not ready.");
        return;
    }

    // Disconnect previous source if it exists
    if (sourceNode) {
         sourceNode.disconnect();
    }

    // Create new MediaElementAudioSourceNode
    sourceNode = audioContext.createMediaElementSource(audioElement);

    // Connect source to analyzer
    sourceNode.connect(analyzerNode);

    // Analyzer is already connected to destination in initAudioContext
    console.log("Audio source connected to analyzer.");
}

// Draw the spectrum analyzer
function drawSpectrum() {
    if (!analyzerNode || !analyzerCtx || !audioDataArray) {
        // System not initialized or ready
         // Maybe draw a placeholder or clear the canvas
         analyzerCtx.clearRect(0, 0, analyzerCanvas.width, analyzerCanvas.height);
         // Draw a simple message or pattern if needed
         return;
    }

    // Get frequency data
    analyzerNode.getByteFrequencyData(audioDataArray);

    // Clear canvas
    analyzerCtx.clearRect(0, 0, analyzerCanvas.width, analyzerCanvas.height);

    const canvasWidth = analyzerCanvas.width;
    const canvasHeight = analyzerCanvas.height;
    const barWidth = (canvasWidth / audioDataArray.length) * 2.5; // Adjust multiplier for bar spacing/density
    let barHeight;
    let x = 0;

    // Get current theme colors for drawing
     const rootStyles = getComputedStyle(document.documentElement);
     const primaryColor = rootStyles.getPropertyValue('--color-primary').trim();
     const secondaryColor = rootStyles.getPropertyValue('--color-secondary').trim();

    for (let i = 0; i < audioDataArray.length; i++) {
        // audioDataArray[i] is a value between 0 and 255
        barHeight = audioDataArray[i]; // Map 0-255 to canvas height
        barHeight = barHeight * (canvasHeight / 255); // Scale height

        // Simple gradient or alternating colors
        const color = i % 2 === 0 ? primaryColor : secondaryColor;
        analyzerCtx.fillStyle = color;

        // Draw rectangle (x, y, width, height)
        // We draw from the bottom up, so y is canvasHeight - barHeight
        analyzerCtx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);

        x += barWidth + 1; // Add 1 pixel gap between bars
    }

    // Request next frame only if audio is playing or paused (to keep state visible)
    // Check if audio is playing or if the user has interacted (loaded a file)
    if (!audioElement.paused) {
        requestAnimationFrame(drawSpectrum);
    } else {
         // If paused or stopped, keep the last frame or clear
         // We keep the last frame for simplicity unless cleared by file load
    }
}

// Event listener for file input
audioFileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        initAudioContext(); // Initialize context on file selection
        const reader = new FileReader();

        reader.onload = function(e) {
            audioElement.src = e.target.result;
            fileNameDisplay.textContent = `Loaded: ${file.name}`;

            // Need to set up the source node *after* the src is set
            // And only connect it when the audio is ready/can play
            audioElement.onloadedmetadata = function() {
                setupAudioSource(); // Setup source node
                // Optional: Automatically play after loading
                // audioElement.play().catch(error => console.error("Autoplay failed:", error));
                 console.log("Audio metadata loaded, source setup complete.");
                 // Start drawing loop (it will check if audio is playing)
                 // Call it once here to show initial state/clear canvas, animation loop will continue if playing
                 drawSpectrum();
            };

            audioElement.onerror = function() {
                console.error("Error loading audio file.");
                fileNameDisplay.textContent = `Error loading file: ${file.name}`;
                 // Clear canvas and reset state on error
                if (analyzerCtx) analyzerCtx.clearRect(0, 0, analyzerCanvas.width, analyzerCanvas.height);
                if (sourceNode) { sourceNode.disconnect(); sourceNode = null; } // Disconnect source
            }

            // Load the audio element
            audioElement.load();
        };

        reader.onerror = function(e) {
            console.error("Error reading file:", e);
            fileNameDisplay.textContent = `Error reading file: ${file.name}`;
        };

        reader.readAsDataURL(file); // Read file as Data URL

    } else {
        // No file selected
        audioElement.removeAttribute('src');
        fileNameDisplay.textContent = '';
        if (analyzerCtx) analyzerCtx.clearRect(0, 0, analyzerCanvas.width, analyzerCanvas.height); // Clear canvas
        if (sourceNode) { sourceNode.disconnect(); sourceNode = null; } // Disconnect source
        console.log("No file selected.");
    }
});

// Start drawing the spectrum when the audio starts playing
audioElement.addEventListener('play', () => {
     console.log("Audio playing, starting spectrum draw loop.");
     // Ensure AudioContext is running (important for some browsers)
     if (audioContext && audioContext.state === 'suspended') {
         audioContext.resume().then(() => {
             console.log("AudioContext resumed successfully.");
         });
     }
     drawSpectrum(); // Start the animation loop
});

// Optionally stop the drawing loop when audio is paused or ended (drawSpectrum checks state)
audioElement.addEventListener('pause', () => {
     console.log("Audio paused.");
     // drawSpectrum loop will stop requesting next frame
});

audioElement.addEventListener('ended', () => {
     console.log("Audio ended.");
     // drawSpectrum loop will stop requesting next frame
     // Optional: Clear or reset canvas here
     // if (analyzerCtx) analyzerCtx.clearRect(0, 0, analyzerCanvas.width, analyzerCanvas.height);
});

// Initial canvas size setting and maybe a placeholder draw
function setupAnalyzerCanvas() {
     const container = analyzerCanvas.parentElement;
     if (container) {
         // Set canvas dimensions based on its CSS size
         analyzerCanvas.width = container.clientWidth;
         analyzerCanvas.height = 200; // Match the CSS height
         // Draw a placeholder text
         if (analyzerCtx) {
              analyzerCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
              analyzerCtx.font = '14px var(--font-body)';
              analyzerCtx.textAlign = 'center';
              analyzerCtx.textBaseline = 'middle';
              analyzerCtx.fillText('Upload an audio file to see the spectrum', analyzerCanvas.width / 2, analyzerCanvas.height / 2);
         }
     }
}

// Resize analyzer canvas when window resizes
function resizeAnalyzerCanvas() {
    setupAnalyzerCanvas(); // Recalculate size and redraw placeholder
    // If audio is playing, drawSpectrum will handle the rest in the next frame
}

window.addEventListener('resize', resizeAnalyzerCanvas);
setupAnalyzerCanvas(); // Initial setup

// Ensure AudioContext starts in response to user gesture
// Add click listener to the document or the file input wrapper
document.addEventListener('click', initAudioContext, { once: true });
audioFileInput.addEventListener('change', initAudioContext, { once: true });
// Also add to the play event of the audio element itself as a fallback
audioElement.addEventListener('play', initAudioContext, { once: true });
