/**
 * DrinkWheel Component
 * Handles the spinning wheel animation and drink selection
 */

import { AppState, ViewManager } from '../app.js';

// ============================================
// WHEEL CONFIGURATION
// ============================================
const DRINK_OPTIONS = [
    { id: 'coffee', name: 'Coffee', icon: '☕', color: '#8B4513' },
    { id: 'tea', name: 'Tea', icon: '🍵', color: '#10B981' },
    { id: 'water', name: 'Water', icon: '💧', color: '#3B82F6' },
    { id: 'soda', name: 'Soda', icon: '🥤', color: '#F97316' },
    { id: 'surprise', name: 'Surprise Me!', icon: '✨', color: '#EC4899' }
];

const SPECIAL_DRINKS = {
    coffee: ['Espresso', 'Cappuccino', 'Latte', 'Americano', 'Mocha', 'Macchiato'],
    tea: ['Green Tea', 'Earl Grey', 'Chamomile', 'Matcha Latte', 'Chai'],
    water: ['Sparkling Water', 'Lemon Water', 'Cucumber Water', 'Plain Water'],
    soda: ['Cola', 'Lemon Soda', 'Orange Soda', 'Root Beer'],
    surprise: ['Smoothie', 'Juice', 'Hot Chocolate', 'Iced Coffee', 'Bubble Tea']
};

let canvas, ctx;
let currentRotation = 0;
let isSpinning = false;

// ============================================
// INITIALIZATION
// ============================================
export function initializeWheel() {
    canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    drawWheel();
}

// ============================================
// DRAW WHEEL
// ============================================
function drawWheel() {
    if (!ctx || !canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    // Get active options
    const activeOptions = getActiveOptions();
    const sliceAngle = (2 * Math.PI) / activeOptions.length;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw slices
    activeOptions.forEach((option, index) => {
        // Start at -90 degrees (top) and offset by half a slice so pointer lands in CENTER of slice
        const startAngle = index * sliceAngle + currentRotation - (Math.PI / 2) - (sliceAngle / 2);
        const endAngle = startAngle + sliceAngle;

        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, lightenColor(option.color, 20));
        gradient.addColorStop(1, option.color);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw icon
        const angle = startAngle + sliceAngle / 2;
        const iconX = centerX + Math.cos(angle) * (radius * 0.65);
        const iconY = centerY + Math.sin(angle) * (radius * 0.65);

        ctx.save();
        ctx.translate(iconX, iconY);
        ctx.rotate(angle + Math.PI / 2);
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(option.icon, 0, 0);
        ctx.restore();

        // Draw label
        const labelX = centerX + Math.cos(angle) * (radius * 0.4);
        const labelY = centerY + Math.sin(angle) * (radius * 0.4);

        ctx.save();
        ctx.translate(labelX, labelY);
        ctx.rotate(angle + Math.PI / 2);
        ctx.font = 'bold 16px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(option.name, 0, 0);
        ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getActiveOptions() {
    // In new UI, we use all options by default as there are no toggles
    return DRINK_OPTIONS;
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// ============================================
// SPIN WHEEL
// ============================================
export function spinWheel() {
    if (isSpinning) return;

    isSpinning = true;
    const spinButton = document.getElementById('spinButton');
    if (spinButton) {
        spinButton.disabled = true;
        spinButton.classList.add('spinning');
    }

    // Random spin parameters
    const activeOptions = getActiveOptions();
    const spins = 5 + Math.random() * 3; // 5-8 full rotations
    const extraRotation = Math.random() * 2 * Math.PI;
    const totalRotation = spins * 2 * Math.PI + extraRotation;
    const duration = 4000; // 4 seconds
    const startTime = Date.now();
    const startRotation = currentRotation;

    // Easing function
    function easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Track previous rotation for haptic feedback
    let lastHapticRotation = startRotation;
    const sliceAngle = (2 * Math.PI) / activeOptions.length;

    // Animation loop
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOut(progress);

        currentRotation = startRotation + totalRotation * easedProgress;

        // Haptic feedback check
        // Check if we've rotated past a slice boundary since the last frame
        const rotationDiff = currentRotation - lastHapticRotation;
        if (rotationDiff > sliceAngle) {
            // Trigger haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(5); // Ultra short pulse
            }
            lastHapticRotation = currentRotation;
        }

        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Spin complete
            isSpinning = false;
            if (spinButton) {
                spinButton.disabled = false;
                spinButton.classList.remove('spinning');
            }

            // Final success vibration
            if (navigator.vibrate) {
                navigator.vibrate([50, 50, 50]);
            }

            showResult(activeOptions);
        }
    }

    animate();
}

// ============================================
// SHOW RESULT
// ============================================
function showResult(activeOptions) {
    // Calculate which slice the pointer is on
    const sliceAngle = (2 * Math.PI) / activeOptions.length;

    // Normalize rotation to 0-2π range
    const normalizedRotation = ((currentRotation % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);

    // Pointer at top (270 degrees)
    const pointerAngle = (Math.PI * 1.5);

    // Account for the half-slice offset (-slice/2) AND the 90 degree visual offset (-PI/2)
    const angleAtPointer = (pointerAngle - normalizedRotation + (sliceAngle / 2) + (Math.PI / 2) + 2 * Math.PI) % (2 * Math.PI);

    // Find which slice this angle corresponds to
    const selectedIndex = Math.floor(angleAtPointer / sliceAngle) % activeOptions.length;
    const selectedOption = activeOptions[selectedIndex];

    // Get specific drink variant
    const variants = SPECIAL_DRINKS[selectedOption.id];
    const specificDrink = variants[Math.floor(Math.random() * variants.length)];

    // Store selection
    AppState.selectedDrink = {
        ...selectedOption,
        name: specificDrink
    };

    // Sync to server
    if (AppState.realtimeClient && AppState.realtimeClient.ws) {
        console.log('📤 Syncing drink wheel result to server:', specificDrink);
        AppState.realtimeClient.send({
            t: 'activity_upsert',
            activityId: 'drink-wheel',
            activity: {
                type: 'drinkWheel',
                title: 'Quick Coffee',
                data: {
                    result: specificDrink,
                    option: selectedOption.id
                }
            }
        });
    }

    // Show result
    const resultDiv = document.getElementById('wheelResult');
    const resultText = document.getElementById('resultText');

    if (resultText) {
        resultText.textContent = specificDrink;
    }

    if (resultDiv) {
        resultDiv.classList.remove('hidden');
    }

    // Play celebration sound (if available)
    // playSound('celebration'); // Commented out - not implemented yet
}

// ============================================
// RESET WHEEL
// ============================================
export function resetWheel() {
    const resultDiv = document.getElementById('wheelResult');
    if (resultDiv) {
        resultDiv.classList.add('hidden');
    }
    AppState.selectedDrink = null;

    // Reset AI message
    const aiResult = document.getElementById('aiMessageResult');
    if (aiResult) aiResult.classList.add('hidden');
}

// ============================================
// EXPORT FOR GLOBAL ACCESS
// ============================================
window.spinWheel = spinWheel;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWheel);
} else {
    initializeWheel();
}
