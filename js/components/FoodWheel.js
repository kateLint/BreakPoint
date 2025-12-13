/**
 * FoodWheel Component
 * Spinning wheel for restaurant selection
 */

import { AppState } from '../app.js';

// ============================================
// FOOD OPTIONS
// ============================================
let FOOD_CATEGORIES = [
    { id: 'pizza', name: 'Pizza', icon: '🍕', color: '#EF4444' },
    { id: 'burger', name: 'Burgers', icon: '🍔', color: '#F59E0B' },
    { id: 'sushi', name: 'Sushi', icon: '🍣', color: '#3B82F6' },
    { id: 'thai', name: 'Thai', icon: '🌶️', color: '#F97316' },
    { id: 'mexican', name: 'Mexican', icon: '🌮', color: '#EF4444' },
    { id: 'chinese', name: 'Chinese', icon: '🥟', color: '#F59E0B' },
    { id: 'healthy', name: 'Healthy', icon: '🥗', color: '#10B981' },
    { id: 'bbq', name: 'BBQ', icon: '🍖', color: '#DC2626' }
];

const RESTAURANTS = {
    pizza: ['Pizza Corner', 'Slice of Heaven', 'Dough Bros', 'Margherita Magic'],
    burger: ['Burger Palace', 'Patty Paradise', 'Grill Masters', 'Burger Barn'],
    sushi: ['Sushi Garden', 'Tokyo Roll', 'Fresh Fish Co', 'Sakura Sushi'],
    thai: ['Thai Spice', 'Bangkok Kitchen', 'Pad Thai Palace', 'Curry House'],
    mexican: ['Taco Fiesta', 'Burrito Bar', 'Salsa Street', 'Nacho Libre'],
    chinese: ['Dim Sum Palace', 'Wok This Way', 'Dragon Kitchen', 'Noodle House'],
    healthy: ['Green Bowl', 'Fresh Salads', 'Juice Bar', 'Protein Palace'],
    bbq: ['BBQ Pit', 'Smoke House', 'Ribs & More', 'Grill Station']
};

/**
 * Add a custom category to the food wheel (e.g., from poll winner)
 * @param {object} category - { id, name, icon, color }
 */
export function addCategoryToFoodWheel(category) {
    // Check if already exists
    const exists = FOOD_CATEGORIES.find(c => c.id === category.id);
    if (exists) {
        console.log(`Category "${category.name}" already exists on food wheel`);
        return;
    }

    // Add to categories
    FOOD_CATEGORIES.push({
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color
    });

    // Add restaurant list for this category
    if (!RESTAURANTS[category.id]) {
        RESTAURANTS[category.id] = [category.name];
    }

    console.log(`✅ Added "${category.name}" to Food Wheel!`);

    // Redraw wheel if it's been initialized
    if (foodCtx) {
        drawFoodWheel();
    }
}

let foodCanvas, foodCtx;
let foodRotation = 0;
let isFoodSpinning = false;

// ============================================
// INITIALIZATION
// ============================================
export function initializeFoodWheel() {
    foodCanvas = document.getElementById('foodWheelCanvas');
    if (!foodCanvas) return;

    foodCtx = foodCanvas.getContext('2d');
    drawFoodWheel();
}

// ============================================
// DRAW FOOD WHEEL
// ============================================
function drawFoodWheel() {
    if (!foodCtx || !foodCanvas) return;

    const centerX = foodCanvas.width / 2;
    const centerY = foodCanvas.height / 2;
    const radius = foodCanvas.width / 2 - 10;

    const sliceAngle = (2 * Math.PI) / FOOD_CATEGORIES.length;

    // Clear canvas
    foodCtx.clearRect(0, 0, foodCanvas.width, foodCanvas.height);

    // Draw slices
    FOOD_CATEGORIES.forEach((option, index) => {
        // Start at -90 degrees (top) and offset by half a slice so pointer lands in CENTER of slice
        const startAngle = index * sliceAngle + foodRotation - (Math.PI / 2) - (sliceAngle / 2);
        const endAngle = startAngle + sliceAngle;

        // Draw slice
        foodCtx.beginPath();
        foodCtx.moveTo(centerX, centerY);
        foodCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        foodCtx.closePath();

        // Fill with gradient
        const gradient = foodCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, lightenColor(option.color, 20));
        gradient.addColorStop(1, option.color);
        foodCtx.fillStyle = gradient;
        foodCtx.fill();

        // Border
        foodCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        foodCtx.lineWidth = 2;
        foodCtx.stroke();

        // Draw icon
        const angle = startAngle + sliceAngle / 2;
        const iconX = centerX + Math.cos(angle) * (radius * 0.65);
        const iconY = centerY + Math.sin(angle) * (radius * 0.65);

        foodCtx.save();
        foodCtx.translate(iconX, iconY);
        foodCtx.rotate(angle + Math.PI / 2);
        foodCtx.font = 'bold 40px Arial';
        foodCtx.textAlign = 'center';
        foodCtx.textBaseline = 'middle';
        foodCtx.fillStyle = 'white';
        foodCtx.fillText(option.icon, 0, 0);
        foodCtx.restore();

        // Draw label
        const labelX = centerX + Math.cos(angle) * (radius * 0.4);
        const labelY = centerY + Math.sin(angle) * (radius * 0.4);

        foodCtx.save();
        foodCtx.translate(labelX, labelY);
        foodCtx.rotate(angle + Math.PI / 2);
        foodCtx.font = 'bold 16px "Outfit", sans-serif';
        foodCtx.textAlign = 'center';
        foodCtx.textBaseline = 'middle';
        foodCtx.fillStyle = 'white';
        foodCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        foodCtx.shadowBlur = 4;
        foodCtx.fillText(option.name, 0, 0);
        foodCtx.restore();
    });

    // Draw center circle
    foodCtx.beginPath();
    foodCtx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
    foodCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    foodCtx.fill();
    foodCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    foodCtx.lineWidth = 3;
    foodCtx.stroke();
}

// ============================================
// HELPER FUNCTIONS
// ============================================
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
// SPIN FOOD WHEEL
// ============================================
export function spinFoodWheel() {
    if (isFoodSpinning) return;

    isFoodSpinning = true;
    const spinButton = document.getElementById('foodSpinButton');
    if (spinButton) {
        spinButton.classList.add('spinning');
    }

    // Random spin parameters
    const spins = 5 + Math.random() * 3;
    const extraRotation = Math.random() * 2 * Math.PI;
    const totalRotation = spins * 2 * Math.PI + extraRotation;
    const duration = 4000;
    const startTime = Date.now();
    const startRotation = foodRotation;

    // Easing function
    function easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Track previous rotation for haptic feedback
    let lastHapticRotation = startRotation;
    const sliceAngle = (2 * Math.PI) / FOOD_CATEGORIES.length;

    // Animation loop
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOut(progress);

        foodRotation = startRotation + totalRotation * easedProgress;

        // Haptic feedback check
        // Check if we've rotated past a slice boundary since the last frame
        const rotationDiff = foodRotation - lastHapticRotation;
        if (rotationDiff > sliceAngle) {
            // Trigger haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(5); // Ultra short pulse
            }
            lastHapticRotation = foodRotation;
        }

        drawFoodWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Spin complete
            isFoodSpinning = false;
            if (spinButton) {
                spinButton.classList.remove('spinning');
            }

            // Final success vibration
            if (navigator.vibrate) {
                navigator.vibrate([50, 50, 50]);
            }

            showFoodResult();
        }
    }

    animate();
}

// ============================================
// SHOW RESULT
// ============================================
function showFoodResult() {
    const sliceAngle = (2 * Math.PI) / FOOD_CATEGORIES.length;

    // Normalize rotation
    const normalizedRotation = ((foodRotation % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);

    // Pointer at top (270 degrees)
    const pointerAngle = (Math.PI * 1.5);

    // Account for the half-slice offset (-slice/2) AND the 90 degree visual offset (-PI/2)
    // We visually shifted by -(PI/2 + slice/2), so we add that back to get the correct index
    const angleAtPointer = (pointerAngle - normalizedRotation + (sliceAngle / 2) + (Math.PI / 2) + 2 * Math.PI) % (2 * Math.PI);
    const selectedIndex = Math.floor(angleAtPointer / sliceAngle) % FOOD_CATEGORIES.length;
    const selectedCategory = FOOD_CATEGORIES[selectedIndex];

    // Get specific restaurant
    const restaurants = RESTAURANTS[selectedCategory.id];
    const selectedRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];

    // Sync to server
    if (AppState.realtimeClient && AppState.realtimeClient.ws) {
        console.log('📤 Syncing food wheel result to server:', selectedRestaurant);
        AppState.realtimeClient.send({
            t: 'activity_upsert',
            activityId: 'food-wheel',
            activity: {
                type: 'foodWheel',
                title: 'Team Lunch Wheel',
                data: {
                    result: selectedRestaurant,
                    category: selectedCategory.id
                }
            }
        });
    }

    // Show result overlay
    const resultDiv = document.getElementById('foodWheelResult');
    const resultText = document.getElementById('foodResultText');
    const spinControls = document.getElementById('foodSpinControls');

    if (resultText) {
        resultText.textContent = selectedRestaurant;
    }

    if (spinControls) {
        spinControls.classList.add('hidden');
    }

    if (resultDiv) {
        resultDiv.classList.remove('hidden');
    }
}

// ============================================
// EXPORT FOR GLOBAL ACCESS
// ============================================
window.spinFoodWheel = spinFoodWheel;
window.initializeFoodWheel = initializeFoodWheel;
