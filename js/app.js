/**
 * BreakPoint - Main Application Controller
 * Handles routing, state management, view coordination, and real-time multiplayer
 */

import { initializeWheel, spinWheel, resetWheel } from './components/DrinkWheel.js';
import { initializeSwipeVoting, swipeCard, addRestaurantToSwipeCards } from './components/SwipeVoting.js';
import { initializeFoodWheel, spinFoodWheel, addCategoryToFoodWheel } from './components/FoodWheel.js';
import { BreakPointRealtime, getOrCreateClientId } from './utils/BreakPointRealtime.js';

export const AppState = {
    currentView: 'homeView',
    currentUser: { id: getOrCreateClientId(), name: 'You', avatar: '😊' },
    realtimeClient: null,
    currentRoomId: 'DEFAULTROOM',
    savedRooms: ['DEFAULTROOM', 'Floor3', 'Floor10'], // Defaults
    isHost: false
};

// Load saved rooms
const saved = localStorage.getItem('bp_saved_rooms');
if (saved) {
    try {
        AppState.savedRooms = JSON.parse(saved);
        if (!Array.isArray(AppState.savedRooms) || AppState.savedRooms.length === 0) {
            AppState.savedRooms = ['DEFAULTROOM'];
        }
    } catch {
        AppState.savedRooms = ['DEFAULTROOM'];
    }
}

// Load last room
const lastRoom = localStorage.getItem('bp_last_room');
if (lastRoom && AppState.savedRooms.includes(lastRoom)) {
    AppState.currentRoomId = lastRoom;
}

export const ViewManager = {
    show(viewId, options = {}) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });

        // Show requested view
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.remove('hidden');
            AppState.currentView = viewId;

            // View specific init
            if (viewId === 'drinkWheelView') {
                resetWheel();
                if (options.autoSpin) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            if (typeof spinWheel === 'function') {
                                spinWheel();
                            }
                        });
                    });
                }
            } else if (viewId === 'swipeView') {
                initializeSwipeVoting();
            } else if (viewId === 'foodWheelView') {
                // Food wheel will initialize on its own
            } else if (viewId === 'pollView') {
                if (AppState.isHost) {
                    startPollActivity();
                }
                initializePoll();
            } else if (viewId === 'lobbyView') {
                renderRoomList();
            }
        }
    },

    goBack() {
        this.show('homeView');
    }
};

function initializeApp() {
    console.log('🚀 BreakPoint initializing...');
    setupEventListeners();
    initializeWheel();
    initializeFoodWheel();

    // Connect to real-time backend
    connectToBackend();

    // Auto-create icons if loaded late
    if (window.lucide) {
        lucide.createIcons();
    }
}

// ============================================
// REAL-TIME BACKEND CONNECTION
// ============================================

async function connectToBackend() {
    if (AppState.realtimeClient) {
        AppState.realtimeClient.disconnect(); // Disconnect existing
    }

    // Dynamic backend URL based on current hostname
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // Assume backend is always on 8787 for now, or use window var override
    const defaultApiUrl = `${protocol}//${hostname}:8787`;

    const apiBaseUrl = window.BREAKPOINT_API_BASE_URL || defaultApiUrl;

    console.log(`🔌 Connecting to room: ${AppState.currentRoomId} at ${apiBaseUrl}`);

    AppState.realtimeClient = new BreakPointRealtime({
        apiBaseUrl,
        roomId: AppState.currentRoomId,
        profile: {
            clientId: AppState.currentUser.id,
            displayName: AppState.currentUser.name,
            avatar: AppState.currentUser.avatar,
            busy: false
        }
    });

    // Listen for connection events
    AppState.realtimeClient.addEventListener('welcome', (e) => {
        console.log('✅ Connected to room:', e.detail);
        AppState.isHost = e.detail.isHost;
        document.getElementById('currentRoomDisplay').innerText = `Room: ${AppState.currentRoomId}`;
        syncPollToServer();
    });

    // Listen for state updates
    AppState.realtimeClient.addEventListener('state', (e) => {
        // console.log('📊 Room state updated:', e.detail.state);
        handleServerStateUpdate(e.detail.state);
    });

    // Listen for activity updates
    AppState.realtimeClient.addEventListener('activity_upsert', (e) => {
        // console.log('🎯 Activity updated:', e.detail.activity);
        handleActivityUpdate(e.detail.activity);
    });

    // Listen for server notifications (Promotions!)
    AppState.realtimeClient.addEventListener('server_notification', (e) => {
        const msg = e.detail.message || "Notification";
        alert(msg); // TODO: Replace with nice toast
    });

    // Listen for errors
    AppState.realtimeClient.addEventListener('error', (e) => {
        console.error('❌ Real-time error:', e.detail);
    });

    // Connect
    try {
        await AppState.realtimeClient.connect();
        console.log('🎉 Real-time connection established!');
    } catch (err) {
        console.error('⚠️ Failed to connect to backend (running offline):', err);
    }
}

function handleServerStateUpdate(state) {
    if (state.promotedOptions && state.promotedOptions.length > 0) {
        // console.log('🏆 Updating promoted options:', state.promotedOptions);
        // Inject into FoodWheel?
        state.promotedOptions.forEach(opt => {
            addCategoryToFoodWheel({
                id: opt.id,
                name: opt.name,
                icon: opt.emoji || '🏆',
                color: '#F59E0B' // Gold
            });
        });
    }

    // Sync poll restaurants from server activity
    if (state.activity && state.activity.kind === 'quick_poll') {
        const payload = state.activity.payload || {};
        if (payload.restaurants) {
            POLL_RESTAURANTS = payload.restaurants;
            initializePoll();
        }
    }
}

function handleActivityUpdate(activity) {
    // Handle different activity types
    // Note: Worker uses 'kind' and 'payload', app.js used 'type' and 'data'
    const payload = activity.payload || {};

    if (activity.kind === 'quick_poll') {
        console.log('🗳️ Poll activity updated');
        if (payload.restaurants) {
            POLL_RESTAURANTS = payload.restaurants;
            initializePoll();
        }
    } else if (activity.kind === 'drink_wheel') {
        console.log('☕ Drink wheel spun:', payload.result);
    } else if (activity.kind === 'food_wheel') {
        console.log('🍕 Food wheel spun:', payload.result);
    }
}

function startPollActivity() {
    if (!AppState.realtimeClient || !AppState.isHost) {
        return;
    }

    console.log('📤 Starting poll activity...');

    AppState.realtimeClient.startActivity({
        id: 'team-poll',
        kind: 'quick_poll',
        status: 'open',
        createdBy: AppState.currentUser.id,
        createdAt: Date.now(),
        payload: {
            title: 'Team Lunch Poll',
            restaurants: POLL_RESTAURANTS,
            votes: {}
        }
    });
}

// ============================================
// POLL FUNCTIONALITY WITH CUSTOM OPTIONS
// ============================================

const DEFAULT_POLL_RESTAURANTS = [
    { id: '1', name: 'Pizza Palace', emoji: '🍕', votes: 0, isCustom: false },
    { id: '2', name: 'Burger Joint', emoji: '🍔', votes: 0, isCustom: false },
    { id: '3', name: 'Sushi Bar', emoji: '🍣', votes: 0, isCustom: false },
    { id: '4', name: 'Taco Spot', emoji: '🌮', votes: 0, isCustom: false },
    { id: '5', name: 'Healthy Bowl', emoji: '🥗', votes: 0, isCustom: false }
];

let POLL_RESTAURANTS = [...DEFAULT_POLL_RESTAURANTS];
let userVote = null;
let customOptionCounter = 100; // Start custom IDs from 100

function initializePoll() {
    const pollOptions = document.getElementById('pollOptions');
    if (!pollOptions) return;

    pollOptions.innerHTML = POLL_RESTAURANTS.map(restaurant => {
        const percentage = calculatePercentage(restaurant.id);
        const isVoted = userVote === restaurant.id;
        const customBadge = restaurant.isCustom ?
            '<span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold ml-2">Custom</span>' : '';

        return `
            <button class="poll-option w-full bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all ${isVoted ? 'ring-2 ring-purple-500' : ''}"
                    data-id="${restaurant.id}">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <span class="text-3xl">${restaurant.emoji}</span>
                        <div class="flex flex-col items-start">
                            <div class="flex items-center">
                                <span class="font-bold text-slate-800">${restaurant.name}</span>
                                ${customBadge}
                            </div>
                        </div>
                    </div>
                    <span class="text-2xl font-bold text-purple-600">${percentage}%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500"
                         style="width: ${percentage}%"></div>
                </div>
                <div class="mt-2 text-sm text-slate-500">${restaurant.votes} votes</div>
            </button>
        `;
    }).join('');

    // Add click handlers
    pollOptions.querySelectorAll('.poll-option').forEach(option => {
        option.addEventListener('click', () => {
            const id = option.dataset.id;
            handleVote(id);
        });
    });

    // Reinitialize icons for the new "plus-circle" icon
    if (window.lucide) {
        lucide.createIcons();
    }
}

function addCustomOption(optionName) {
    if (!optionName || optionName.trim().length === 0) {
        alert('Please enter a restaurant name!');
        return;
    }

    // Check if already exists
    const exists = POLL_RESTAURANTS.find(r =>
        r.name.toLowerCase() === optionName.trim().toLowerCase()
    );

    if (exists) {
        alert('This option already exists!');
        return;
    }

    // Add custom option
    const customOption = {
        id: `custom-${customOptionCounter++}`,
        name: optionName.trim(),
        emoji: '🍽️', // Default emoji for custom options
        votes: 0,
        isCustom: true
    };

    // Clear input
    const input = document.getElementById('customOptionInput');
    if (input) input.value = '';

    // Sync to server
    if (AppState.realtimeClient && AppState.realtimeClient.isConnected) {
        // Optimistic UI update or wait for server?
        // Let's rely on server state update for adding to list to verify sync works.
        // But clear input immediately.
        AppState.realtimeClient.addPollOption('team-poll', customOption);
    } else {
        // Fallback for offline mode or if connection failed
        console.warn('⚠️ Offline: Adding option locally');
        POLL_RESTAURANTS.push(customOption);
        initializePoll();
    }
}

function handleVote(restaurantId) {
    // Remove previous vote if exists
    if (userVote) {
        const prevRestaurant = POLL_RESTAURANTS.find(r => r.id === userVote);
        if (prevRestaurant) prevRestaurant.votes--;
    }

    // Add new vote
    const restaurant = POLL_RESTAURANTS.find(r => r.id === restaurantId);
    if (restaurant) restaurant.votes++;

    userVote = restaurantId;
    initializePoll(); // Refresh local view instantly

    // Sync vote to server
    if (AppState.realtimeClient && AppState.realtimeClient.isConnected) {
        AppState.realtimeClient.vote('team-poll', { restaurantId });
    }
}

function calculatePercentage(restaurantId) {
    const total = POLL_RESTAURANTS.reduce((sum, r) => sum + r.votes, 0);
    if (total === 0) return 0;
    const restaurant = POLL_RESTAURANTS.find(r => r.id === restaurantId);
    return Math.round((restaurant.votes / total) * 100);
}

function finishPoll() {
    const winner = POLL_RESTAURANTS.reduce((max, r) =>
        r.votes > max.votes ? r : max, POLL_RESTAURANTS[0]
    );

    if (winner.votes === 0) {
        alert('No votes yet! Vote for your favorite option first.');
        return;
    }

    // Show winner announcement
    alert(`🎉 Winner: ${winner.emoji} ${winner.name} with ${winner.votes} votes!`);

    // If it's a custom option, add it to Food Wheel and Swipe Cards
    if (winner.isCustom) {
        console.log(`🏆 Custom option won! Adding "${winner.name}" to food options...`);

        // Add to Food Wheel
        addCategoryToFoodWheel({
            id: winner.id,
            name: winner.name,
            icon: winner.emoji,
            color: '#10B981' // Green color for custom options
        });

        // Add to Swipe Cards
        addRestaurantToSwipeCards({
            id: winner.id,
            name: winner.name,
            description: 'Team favorite!',
            category: 'Custom',
            type: 'Custom',
            price: '$$',
            color: 'bg-green-100'
        });

        alert(`✨ "${winner.name}" has been added to Food Wheel and Swipe Cards!\n\nYou can still vote on it again in future polls!`);
    }

    // Reset votes only (keep custom options!)
    POLL_RESTAURANTS.forEach(r => r.votes = 0);
    userVote = null;
    initializePoll();
}

// ============================================
// ROOM MANAGEMENT
// ============================================

function renderRoomList() {
    const list = document.getElementById('roomList');
    if (!list) return;

    list.innerHTML = AppState.savedRooms.map(roomId => {
        const isActive = roomId === AppState.currentRoomId;
        return `
            <div class="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-xl p-4 border ${isActive ? 'border-purple-400 bg-white/20' : 'border-white/10'} hover:bg-white/20 transition-all cursor-pointer group"
                 onclick="switchRoom('${roomId}')">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                        ${roomId.substring(0, 2).toUpperCase()}
                    </div>
                    <div class="flex flex-col">
                        <span class="text-white font-bold">${roomId}</span>
                        <span class="text-white/60 text-xs">${isActive ? 'Active Now' : 'Click to Join'}</span>
                    </div>
                </div>
                ${!isActive && roomId !== 'DEFAULTROOM' ? `
                <button onclick="event.stopPropagation(); removeRoom('${roomId}')" class="text-white/40 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
                ` : ''}
                ${isActive ? '<i data-lucide="check-circle" class="text-green-400 w-5 h-5"></i>' : ''}
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Make globally available for onclick
window.switchRoom = function (roomId) {
    if (roomId === AppState.currentRoomId) return;

    // Save previous room?
    AppState.currentRoomId = roomId;
    localStorage.setItem('bp_last_room', roomId);

    // Reconnect
    connectToBackend();

    // Refresh UI
    renderRoomList();

    // Show toast or something?
    // alert(`Joined Room: ${roomId}`);
    ViewManager.show('homeView');
}

window.removeRoom = function (roomId) {
    if (confirm(`Remove "${roomId}" from saved rooms?`)) {
        AppState.savedRooms = AppState.savedRooms.filter(r => r !== roomId);
        localStorage.setItem('bp_saved_rooms', JSON.stringify(AppState.savedRooms));
        renderRoomList();
    }
}

function addRoom(roomId) {
    roomId = roomId.trim();
    if (!roomId) return;

    // Allow alphanumeric
    if (!/^[a-zA-Z0-9_-]+$/.test(roomId)) {
        alert("Room ID can only contain letters, numbers, hyphens, and underscores.");
        return;
    }

    if (!AppState.savedRooms.includes(roomId)) {
        AppState.savedRooms.push(roomId);
        localStorage.setItem('bp_saved_rooms', JSON.stringify(AppState.savedRooms));
    }

    switchRoom(roomId);
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // === Navigation ===
    document.getElementById('navToDrink')?.addEventListener('click', () => {
        ViewManager.show('drinkWheelView');
    });
    document.getElementById('navToLunch')?.addEventListener('click', () => ViewManager.show('lunchView'));

    // === Lunch Options ===
    document.getElementById('navToSwipe')?.addEventListener('click', () => ViewManager.show('swipeView'));
    document.getElementById('navToFoodWheel')?.addEventListener('click', () => ViewManager.show('foodWheelView'));
    document.getElementById('navToPoll')?.addEventListener('click', () => ViewManager.show('pollView'));

    // === Lobby (Rooms) ===
    document.getElementById('roomButton')?.addEventListener('click', () => ViewManager.show('lobbyView'));
    document.getElementById('burgerMenuButton')?.addEventListener('click', () => ViewManager.show('lobbyView')); // Assuming burger menu goes to settings/rooms

    // === Back Buttons ===
    document.getElementById('backFromDrink')?.addEventListener('click', () => ViewManager.goBack());
    document.getElementById('backFromLunch')?.addEventListener('click', () => ViewManager.goBack());
    document.getElementById('backFromSwipe')?.addEventListener('click', () => ViewManager.show('lunchView'));
    document.getElementById('backFromFoodWheel')?.addEventListener('click', () => ViewManager.show('lunchView'));
    document.getElementById('backFromPoll')?.addEventListener('click', () => ViewManager.show('lunchView'));
    document.getElementById('backFromLobby')?.addEventListener('click', () => ViewManager.goBack());

    // === Drink Wheel Actions ===
    document.getElementById('spinButton')?.addEventListener('click', spinWheel);

    document.getElementById('spinAgainButton')?.addEventListener('click', () => {
        resetWheel();
        document.getElementById('wheelResult').classList.add('hidden');
    });

    document.getElementById('inviteTeamButton')?.addEventListener('click', () => {
        // Copy Room ID
        navigator.clipboard.writeText(AppState.currentRoomId).then(() => {
            const btn = document.getElementById('inviteTeamButton');
            const original = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i> <span>Copied ID!</span>';
            setTimeout(() => btn.innerHTML = original, 2000);
        });
    });

    // === Food Wheel Actions ===
    document.getElementById('foodSpinButton')?.addEventListener('click', spinFoodWheel);

    document.getElementById('spinFoodAgainButton')?.addEventListener('click', () => {
        document.getElementById('foodWheelResult').classList.add('hidden');
        document.getElementById('foodSpinControls').classList.remove('hidden');
    });

    document.getElementById('inviteFoodTeamButton')?.addEventListener('click', () => {
        ViewManager.show('lobbyView');
    });

    // === Poll Actions ===
    document.getElementById('addCustomOptionButton')?.addEventListener('click', () => {
        const input = document.getElementById('customOptionInput');
        if (input) {
            addCustomOption(input.value);
        }
    });

    // Allow Enter key to add custom option
    document.getElementById('customOptionInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCustomOption(e.target.value);
        }
    });

    document.getElementById('finishPollButton')?.addEventListener('click', finishPoll);

    // === Swipe Actions ===
    document.getElementById('swipeLeft')?.addEventListener('click', () => swipeCard('left'));
    document.getElementById('swipeRight')?.addEventListener('click', () => swipeCard('right'));

    // === Room Actions ===
    document.getElementById('addRoomButton')?.addEventListener('click', () => {
        const val = document.getElementById('newRoomInput')?.value;
        if (val) addRoom(val);
    });

    document.getElementById('newRoomInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addRoom(e.target.value);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeApp);
