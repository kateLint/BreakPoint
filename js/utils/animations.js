/**
 * Animation Utilities
 * Confetti and celebration effects
 */

// ============================================
// CONFETTI CONFIGURATION
// ============================================
const CONFETTI_CONFIG = {
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#8B5CF6', '#EC4899', '#F97316', '#FBBF24', '#10B981', '#3B82F6', '#14B8A6']
};

// ============================================
// CREATE CONFETTI
// ============================================
export function createConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) {
        console.warn('Confetti canvas not found');
        return;
    }

    // Clear any existing confetti
    canvas.innerHTML = '';

    // Create particles
    for (let i = 0; i < CONFETTI_CONFIG.particleCount; i++) {
        createConfettiParticle(canvas, i);
    }

    // Auto-cleanup after animation
    setTimeout(() => {
        canvas.innerHTML = '';
    }, 5000);
}

// ============================================
// CREATE CONFETTI PARTICLE
// ============================================
function createConfettiParticle(container, index) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';

    // Random properties
    const color = CONFETTI_CONFIG.colors[Math.floor(Math.random() * CONFETTI_CONFIG.colors.length)];
    const size = Math.random() * 10 + 5;
    const startX = Math.random() * window.innerWidth;
    const startY = -20;
    const endX = startX + (Math.random() - 0.5) * 200;
    const rotation = Math.random() * 720;
    const duration = Math.random() * 2 + 2;
    const delay = Math.random() * 0.5;

    // Apply styles
    particle.style.cssText = `
        position: fixed;
        left: ${startX}px;
        top: ${startY}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation: confettiFall ${duration}s ease-out ${delay}s forwards;
        z-index: 9999;
        pointer-events: none;
    `;

    // Add custom animation
    const keyframes = `
        @keyframes confettiFall-${index} {
            0% {
                transform: translateY(0) translateX(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(${window.innerHeight + 100}px) translateX(${endX - startX}px) rotate(${rotation}deg);
                opacity: 0;
            }
        }
    `;

    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    particle.style.animation = `confettiFall-${index} ${duration}s ease-out ${delay}s forwards`;

    container.appendChild(particle);

    // Cleanup
    setTimeout(() => {
        particle.remove();
        style.remove();
    }, (duration + delay) * 1000 + 100);
}

// ============================================
// CELEBRATION SOUND
// ============================================
export function playCelebrationSound() {
    // Placeholder for sound effect
    // In production, this would play an actual audio file
    console.log('🎉 Playing celebration sound!');
}

// ============================================
// SUCCESS ANIMATION
// ============================================
export function showSuccessAnimation(element) {
    if (!element) return;

    element.classList.add('success-checkmark');

    setTimeout(() => {
        element.classList.remove('success-checkmark');
    }, 1000);
}

// ============================================
// SHAKE ANIMATION (for errors)
// ============================================
export function shakeElement(element) {
    if (!element) return;

    element.classList.add('shake');

    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
}

// ============================================
// PULSE ANIMATION
// ============================================
export function pulseElement(element) {
    if (!element) return;

    element.classList.add('pulse-scale');

    setTimeout(() => {
        element.classList.remove('pulse-scale');
    }, 2000);
}

// ============================================
// STAGGER ANIMATION FOR LISTS
// ============================================
export function staggerAnimation(elements) {
    elements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.1}s`;
        element.classList.add('stagger-item');
    });
}

// ============================================
// SMOOTH SCROLL TO ELEMENT
// ============================================
export function smoothScrollTo(element) {
    if (!element) return;

    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// ============================================
// LOADING SPINNER
// ============================================
export function showLoadingSpinner(container) {
    if (!container) return;

    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.id = 'loading-spinner';

    container.appendChild(spinner);

    return spinner;
}

export function hideLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

// ============================================
// TYPING INDICATOR
// ============================================
export function showTypingIndicator(container) {
    if (!container) return;

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    container.appendChild(indicator);

    return indicator;
}

export function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// ============================================
// RIPPLE EFFECT
// ============================================
export function createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    `;

    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// ============================================
// EXPORT ALL UTILITIES
// ============================================
export default {
    createConfetti,
    playCelebrationSound,
    showSuccessAnimation,
    shakeElement,
    pulseElement,
    staggerAnimation,
    smoothScrollTo,
    showLoadingSpinner,
    hideLoadingSpinner,
    showTypingIndicator,
    hideTypingIndicator,
    createRipple
};
