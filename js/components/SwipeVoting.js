/**
 * SwipeVoting Component
 * Tinder-style card swiping for restaurant selection
 */

import { AppState, ViewManager } from '../app.js';

// ============================================
// MOCK RESTAURANT DATA
// ============================================
let MOCK_RESTAURANTS = [
    { id: '1', name: 'Thai Spice', description: 'Authentic Thai cuisine', category: 'Thai', type: 'Thai', price: '$$', color: 'bg-orange-100' },
    { id: '2', name: 'Burger Palace', description: 'Gourmet burgers & fries', category: 'American', type: 'American', price: '$$', color: 'bg-red-100' },
    { id: '3', name: 'Sushi Garden', description: 'Fresh sushi & sashimi', category: 'Japanese', type: 'Japanese', price: '$$$$', color: 'bg-indigo-100' },
    { id: '4', name: 'Pizza Corner', description: 'Wood-fired pizzas', category: 'Italian', type: 'Italian', price: '$$', color: 'bg-orange-50' },
    { id: '5', name: 'Green Bowl', description: 'Healthy salads & bowls', category: 'Healthy', type: 'Healthy', price: '$$$', color: 'bg-green-100' },
    { id: '6', name: 'Taco Fiesta', description: 'Mexican street food', category: 'Mexican', type: 'Mexican', price: '$', color: 'bg-yellow-100' }
];

/**
 * Add a custom restaurant to the swipe cards (e.g., from poll winner)
 * @param {object} restaurant - { id, name, description, category, type, price, color }
 */
export function addRestaurantToSwipeCards(restaurant) {
    // Check if already exists
    const exists = MOCK_RESTAURANTS.find(r => r.id === restaurant.id);
    if (exists) {
        console.log(`Restaurant "${restaurant.name}" already exists in swipe cards`);
        return;
    }

    // Add to restaurants
    MOCK_RESTAURANTS.push({
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description || 'Team favorite!',
        category: restaurant.category || 'Custom',
        type: restaurant.type || 'Custom',
        price: restaurant.price || '$$',
        color: restaurant.color || 'bg-green-100'
    });

    console.log(`✅ Added "${restaurant.name}" to Swipe Cards!`);
}

let currentCardIndex = 0;
let swipeVotes = [];
let cards = [];

// ============================================
// CATEGORY EMOJIS
// ============================================
const CATEGORY_EMOJIS = {
    'Thai': '🌶️',
    'American': '🍔',
    'Japanese': '🍣',
    'Italian': '🍕',
    'Healthy': '🥗',
    'Mexican': '🌮',
    'Vietnamese': '🍜',
    'BBQ': '🍖',
    'Chinese': '🥟'
};

// ============================================
// INITIALIZE SWIPE VOTING
// ============================================
export function initializeSwipeVoting() {
    currentCardIndex = 0;
    swipeVotes = [];

    const swipeStack = document.getElementById('swipeStack');
    if (!swipeStack) return;

    // Shuffle restaurants
    const shuffled = [...MOCK_RESTAURANTS].sort(() => Math.random() - 0.5);

    // Create cards
    // Reverse order for stacking (first item on top, which mean last in DOM with highest Z, or first in DOM with absolute?)
    // Actually, if we use z-index, order doesn't matter too much, but standard DOM order puts last element on top.
    // So we want the first card (index 0) to be on TOP.
    // Layout: Absolute. 
    // We render them such that index 0 is at the end of the list? No.
    // Let's render index 0 with highest z-index.

    swipeStack.innerHTML = shuffled.map((restaurant, index) => {
        const zIndex = 50 - index; // Ensure earlier cards are on top
        const emoji = CATEGORY_EMOJIS[restaurant.category] || '🍽️';

        return `
        <div class="swipe-card absolute max-w-sm aspect-[3/4] ${restaurant.color || 'bg-white'} rounded-3xl shadow-2xl p-8 flex flex-col justify-between transform transition-transform duration-300 cursor-grab active:cursor-grabbing origin-bottom"
             style="z-index: ${zIndex}; top: 0; left: 50%; transform: translateX(-50%); width: 90%; max-width: 380px;"
             data-index="${index}"
             data-id="${restaurant.id}">
            
            <div class="flex justify-between items-start">
               <span class="bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-slate-800 backdrop-blur-sm">
                 ${restaurant.type}
               </span>
               <span class="text-slate-400 font-bold">${restaurant.price}</span>
            </div>
            
            <div class="text-center">
              <div class="text-9xl mb-8 filter drop-shadow-md transition-transform hover:scale-110">${emoji}</div>
              <h2 class="text-4xl font-extrabold text-slate-800 mb-2 leading-tight">${restaurant.name}</h2>
              <p class="text-slate-600 font-medium">4.5 ★★★★☆</p>
            </div>

            <div class="text-center text-xs text-slate-400 uppercase tracking-widest font-bold">
              Swipe to vote
            </div>
            
            <!-- Indicators -->
            <div class="absolute top-8 right-8 text-green-500 border-4 border-green-500 rounded-lg px-2 py-1 font-black text-2xl transform rotate-12 opacity-0 transition-opacity swipe-like">LIKE</div>
            <div class="absolute top-8 left-8 text-red-500 border-4 border-red-500 rounded-lg px-2 py-1 font-black text-2xl transform -rotate-12 opacity-0 transition-opacity swipe-nope">NOPE</div>
        </div>
    `;
    }).join('');

    // Get all cards
    cards = Array.from(swipeStack.querySelectorAll('.swipe-card'));

    // Enable first card
    if (cards[0]) {
        setupCardSwipe(cards[0]);
    }
}

// ============================================
// SETUP CARD SWIPE
// ============================================
function setupCardSwipe(card) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    // Remove transitions during drag to make it instant
    const disableTransition = () => card.style.transition = 'none';
    const enableTransition = () => card.style.transition = 'transform 0.3s ease-out';

    const handleStart = (e) => {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        disableTransition();
        card.style.cursor = 'grabbing';
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        // Prevent scrolling on mobile
        e.preventDefault();

        currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const deltaX = currentX - startX;
        const rotation = deltaX / 20;

        card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;

        // Update indicators
        const like = card.querySelector('.swipe-like');
        const nope = card.querySelector('.swipe-nope');

        if (deltaX > 20) {
            like.style.opacity = Math.min(deltaX / 100, 1);
            nope.style.opacity = 0;
        } else if (deltaX < -20) {
            nope.style.opacity = Math.min(Math.abs(deltaX) / 100, 1);
            like.style.opacity = 0;
        } else {
            like.style.opacity = 0;
            nope.style.opacity = 0;
        }
    };

    const handleEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        card.style.cursor = 'grab';
        enableTransition();

        const deltaX = currentX - startX;

        if (deltaX > 100) {
            swipeCard('right', card);
        } else if (deltaX < -100) {
            swipeCard('left', card);
        } else {
            // Reset
            card.style.transform = '';
            card.querySelector('.swipe-like').style.opacity = 0;
            card.querySelector('.swipe-nope').style.opacity = 0;
        }
    };

    // Events
    card.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    card.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
}

// ============================================
// SWIPE CARD
// ============================================
export function swipeCard(direction, cardElement = null) {
    const card = cardElement || cards[currentCardIndex];
    if (!card) return;

    // Trigger animation
    card.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
    const moveX = direction === 'right' ? window.innerWidth : -window.innerWidth;
    card.style.transform = `translate(${moveX}px, 0) rotate(${direction === 'right' ? 20 : -20}deg)`;
    card.style.opacity = '0';

    // Store vote
    if (direction === 'right') {
        swipeVotes.push(card.dataset.id);
    }

    setTimeout(() => {
        card.remove(); // Actually remove DOM element
        currentCardIndex++;

        // Setup next card
        const nextCard = cards[currentCardIndex];
        if (nextCard) {
            setupCardSwipe(nextCard);
        } else {
            // No more cards
            if (swipeVotes.length > 0) {
                // Determine winner (first like for now)
                ViewManager.show('wheelResult'); // Show waiting or result
                // Actually, let's just alert for now or implement result screen
                alert('You liked: ' + swipeVotes.length + ' places!');
                ViewManager.goBack();
            } else {
                alert('You seem picky today! 😉');
                ViewManager.goBack();
            }
        }
    }, 300);
}
