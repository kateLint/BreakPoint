/**
 * BreakPoint - Main Application Controller
 * Handles routing, state management, view coordination, and real-time multiplayer
 */

import { initializeWheel, spinWheel, resetWheel } from './components/DrinkWheel.js';
import { initializeSwipeVoting, swipeCard, addRestaurantToSwipeCards } from './components/SwipeVoting.js';
import { initializeFoodWheel, spinFoodWheel, addCategoryToFoodWheel } from './components/FoodWheel.js';
import { BreakPointRealtime, getOrCreateClientId } from './utils/BreakPointRealtime.js';

export const AppState = {
    currentView: 'roomSelectionView',
    currentUser: { id: getOrCreateClientId(), name: 'You', avatar: '😊' },
    realtimeClient: null,
    currentRoomId: null,
    savedRooms: ['ROOM1'], // Default room
    isHost: false
};

// Load saved rooms
const saved = localStorage.getItem('bp_saved_rooms');
if (saved) {
    try {
        AppState.savedRooms = JSON.parse(saved);
        if (!Array.isArray(AppState.savedRooms) || AppState.savedRooms.length === 0) {
            AppState.savedRooms = ['ROOM1'];
        }
    } catch {
        AppState.savedRooms = ['ROOM1'];
    }
}

// Note: We don't auto-connect to a room anymore, user must select one

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
                // Check if there's already an active poll from the server
                if (AppState.realtimeClient?.state?.activity?.kind === 'quick_poll') {
                    console.log('📥 Loading existing poll from server');
                    const payload = AppState.realtimeClient.state.activity.payload || {};
                    if (payload.restaurants) {
                        POLL_RESTAURANTS = payload.restaurants;
                    }
                } else if (AppState.isHost) {
                    console.log('🎬 Host starting new poll activity');
                    startPollActivity();
                }
                initializePoll();
            } else if (viewId === 'lobbyView') {
                renderRoomList();
            } else if (viewId === 'roomSelectionView') {
                renderRoomSelectionList();
            }
        }
    },

    goBack() {
        // If in a room, go back to room selection
        if (AppState.currentRoomId) {
            this.show('roomSelectionView');
        } else {
            this.show('roomSelectionView');
        }
    }
};

/**
 * Handle invite link from URL parameters
 * Format: ?room=ROOM2&invite=abc123xyz
 */
function handleInviteLink() {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    const inviteToken = params.get('invite');

    if (!roomId || !inviteToken) {
        return; // Not an invite link
    }

    console.log('🎟️ Invite link detected:', { roomId, inviteToken });

    // Clear URL parameters (for privacy)
    window.history.replaceState({}, document.title, window.location.pathname);

    // Store invite token temporarily
    sessionStorage.setItem('pendingInvite', JSON.stringify({ roomId, inviteToken }));

    // Auto-join the room
    joinRoom(roomId, inviteToken);
}

function initializeApp() {
    console.log('🚀 BreakPoint initializing...');
    setupEventListeners();
    initializeWheel();
    initializeFoodWheel();

    // Check for invite link in URL
    handleInviteLink();

    // Show room selection first (don't auto-connect)
    renderRoomSelectionList();

    // Auto-create icons if loaded late
    if (window.lucide) {
        lucide.createIcons();
    }
}

// ============================================
// REAL-TIME BACKEND CONNECTION
// ============================================

async function connectToBackend(inviteToken = null) {
    if (!AppState.currentRoomId) {
        console.warn('⚠️ No room selected, skipping connection');
        return;
    }

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

    // Update profile with invite token if present
    const profile = {
        clientId: AppState.currentUser.id,
        displayName: AppState.currentUser.name,
        avatar: AppState.currentUser.avatar,
        busy: false
    };

    if (inviteToken) {
        profile.invite = inviteToken;
    }

    AppState.realtimeClient = new BreakPointRealtime({
        apiBaseUrl,
        roomId: AppState.currentRoomId,
        profile
    });

    // Listen for connection events
    AppState.realtimeClient.addEventListener('welcome', (e) => {
        console.log('✅ Connected to room:', e.detail);
        AppState.isHost = e.detail.isHost;
        const roomDisplay = document.getElementById('currentRoomDisplay');
        if (roomDisplay) {
            roomDisplay.innerText = `Room: ${AppState.currentRoomId}`;
        }
        updateOnlineUsersDisplay();
    });

    // Listen for state updates
    AppState.realtimeClient.addEventListener('state', (e) => {
        // console.log('📊 Room state updated:', e.detail.state);
        handleServerStateUpdate(e.detail.state);
    });

    // Listen for activity updates
    AppState.realtimeClient.addEventListener('activity_upsert', (e) => {
        console.log('🎯 [ACTIVITY_UPSERT EVENT] Received:', e.detail.activity);
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

        if (e.detail.code === 'needs_invite') {
            alert('This room requires an invite to join. Please request access or get an invite link.');
            ViewManager.show('roomSelectionView');
        } else if (e.detail.code === 'invalid_invite') {
            alert('Invalid or expired invite link.');
            ViewManager.show('roomSelectionView');
        }
    });

    // Listen for invite_generated event
    AppState.realtimeClient.addEventListener('invite_generated', async (e) => {
        console.log('🎟️ Invite generated:', e.detail);

        const { url, token } = e.detail;

        // Update input
        document.getElementById('inviteLinkInput').value = url;

        // Generate QR code
        try {
            const { renderQRToCanvas } = await import('./utils/qrcode.js');
            const canvas = document.getElementById('inviteQRCode');
            await renderQRToCanvas(canvas, url);
        } catch (error) {
            console.error('Failed to generate QR code:', error);
        }
    });

    // Listen for join request events
    AppState.realtimeClient.addEventListener('join_request', (e) => {
        console.log('🔔 Join request received:', e.detail);

        const request = e.detail.request;
        showJoinRequestNotification(request);
    });

    // Listen for join approved event
    AppState.realtimeClient.addEventListener('join_approved', (e) => {
        console.log('✅ Join request approved:', e.detail);

        const { roomId, inviteToken } = e.detail;

        // Close waiting modal if open
        document.getElementById('joinRequestWaitingModal').classList.add('hidden');

        // Close temp WebSocket
        if (window._tempJoinRequestWs) {
            window._tempJoinRequestWs.close();
            window._tempJoinRequestWs = null;
        }

        // Auto-join with the invite token
        setTimeout(() => {
            joinRoom(roomId, inviteToken);
        }, 500);
    });

    // Listen for join denied event
    AppState.realtimeClient.addEventListener('join_denied', (e) => {
        console.log('❌ Join request denied:', e.detail);

        // Close waiting modal
        document.getElementById('joinRequestWaitingModal').classList.add('hidden');

        // Close temp WebSocket
        if (window._tempJoinRequestWs) {
            window._tempJoinRequestWs.close();
            window._tempJoinRequestWs = null;
        }

        // Show error message
        alert('Your request to join was denied by the host.');
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
    console.log('📊 Received state update from server:', state);

    if (state.promotedOptions && state.promotedOptions.length > 0) {
        console.log('🏆 Updating promoted options:', state.promotedOptions);
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
        console.log('🗳️ Syncing poll from server state');
        const payload = state.activity.payload || {};
        if (payload.restaurants) {
            POLL_RESTAURANTS = payload.restaurants;
            // Only re-render if we're on the poll view
            if (AppState.currentView === 'pollView') {
                initializePoll();
            }
        }
    }

    // Update online users display
    updateOnlineUsersDisplay();
}

function handleActivityUpdate(activity) {
    console.log('🎯 [handleActivityUpdate] Called with:', activity);
    console.log('🎯 [handleActivityUpdate] Current view:', AppState.currentView);
    const payload = activity.payload || {};

    if (activity.kind === 'quick_poll') {
        console.log('🗳️ [POLL UPDATE] Received restaurants:', payload.restaurants);
        console.log('🗳️ [POLL UPDATE] Current local restaurants:', POLL_RESTAURANTS);
        if (payload.restaurants) {
            POLL_RESTAURANTS = payload.restaurants;
            console.log('🗳️ [POLL UPDATE] Updated local restaurants to:', POLL_RESTAURANTS);
            // Re-render poll if we're currently viewing it
            if (AppState.currentView === 'pollView') {
                console.log('✨ [POLL UPDATE] Re-rendering poll UI now!');
                initializePoll();
            } else {
                console.log('⚠️ [POLL UPDATE] Not on poll view, skipping render. Current view:', AppState.currentView);
            }
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

    // Always add to local list immediately (optimistic UI update)
    POLL_RESTAURANTS.push(customOption);
    initializePoll();

    // Also sync to server if connected
    console.log('📤 [ADD_OPTION] Checking connection...');
    console.log('📤 [ADD_OPTION] isConnected:', AppState.realtimeClient?.isConnected);
    console.log('📤 [ADD_OPTION] Client state:', AppState.realtimeClient?.state);

    if (AppState.realtimeClient && AppState.realtimeClient.isConnected) {
        const activity = AppState.realtimeClient.state?.activity;
        console.log('📤 [ADD_OPTION] Current activity:', activity);
        if (activity && activity.kind === 'quick_poll') {
            console.log('📤 [ADD_OPTION] Sending to server:', customOption);
            console.log('📤 [ADD_OPTION] Activity ID:', activity.id);
            const sent = AppState.realtimeClient.addPollOption(activity.id, customOption);
            console.log('📤 [ADD_OPTION] Send result:', sent);
        } else {
            console.warn('⚠️ [ADD_OPTION] No active poll activity found. State:', AppState.realtimeClient.state);
        }
    } else {
        console.warn('⚠️ [ADD_OPTION] Not connected. Client:', AppState.realtimeClient);
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
        const activity = AppState.realtimeClient.state?.activity;
        if (activity && activity.kind === 'quick_poll') {
            console.log('📤 Sending vote to server:', restaurantId);
            AppState.realtimeClient.vote(activity.id, { restaurantId });
        }
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

function renderRoomSelectionList() {
    const list = document.getElementById('roomSelectionList');
    if (!list) return;

    list.innerHTML = AppState.savedRooms.map(roomId => {
        return `
            <button class="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-lg border-2 border-transparent hover:border-purple-200 transition-all active:scale-95 text-left w-full"
                 onclick="joinRoom('${roomId}')">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i data-lucide="users" class="w-20 h-20 text-purple-500" stroke-width="1.5"></i>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="bg-purple-100 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                            <i data-lucide="users" class="w-6 h-6"></i>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-xl font-bold text-slate-800">${roomId}</span>
                            <span class="text-slate-500 text-sm">Tap to join room</span>
                        </div>
                    </div>
                    <i data-lucide="arrow-right" class="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors"></i>
                </div>
            </button>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

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
                ${!isActive && roomId !== 'ROOM1' ? `
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
window.joinRoom = async function (roomId, inviteToken = null) {
    console.log('🔌 Connecting to room:', roomId, 'at', window.BREAKPOINT_API_BASE_URL || 'http://localhost:8787');

    // Disconnect from current room if any
    if (AppState.realtimeClient) {
        AppState.realtimeClient.disconnect();
        AppState.realtimeClient = null;
    }

    AppState.currentRoomId = roomId;
    localStorage.setItem('bp_last_room', roomId);

    // Show home view
    ViewManager.show('homeView');

    // Update room display
    const roomDisplay = document.getElementById('currentRoomDisplay');
    if (roomDisplay) {
        roomDisplay.textContent = `Room: ${roomId}`;
    }

    // Connect to backend with invite token if provided
    await connectToBackend(inviteToken);

    // Update online users display
    updateOnlineUsersDisplay();
}

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
    roomId = roomId.trim().toUpperCase(); // Convert to uppercase for consistency
    if (!roomId) return;

    // Allow alphanumeric
    if (!/^[A-Z0-9_-]+$/.test(roomId)) {
        alert("Room ID can only contain letters, numbers, hyphens, and underscores.");
        return;
    }

    if (roomId.length < 3 || roomId.length > 16) {
        alert("Room ID must be between 3 and 16 characters.");
        return;
    }

    if (!AppState.savedRooms.includes(roomId)) {
        AppState.savedRooms.push(roomId);
        localStorage.setItem('bp_saved_rooms', JSON.stringify(AppState.savedRooms));
    }

    // Refresh room list and join the new room
    renderRoomSelectionList();
    joinRoom(roomId);
}

async function fetchActiveRooms() {
    const apiBaseUrl = window.BREAKPOINT_API_BASE_URL || 'http://localhost:8787';

    try {
        const response = await fetch(`${apiBaseUrl}/api/rooms/list`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.rooms || [];
    } catch (error) {
        console.error('Failed to fetch active rooms:', error);
        return [];
    }
}

async function showActiveRoomsModal() {
    const modal = document.getElementById('activeRoomsModal');
    const list = document.getElementById('activeRoomsList');
    const loading = document.getElementById('activeRoomsLoading');
    const noRooms = document.getElementById('noActiveRooms');

    // Show modal and loading state
    modal.classList.remove('hidden');
    loading.classList.remove('hidden');
    list.innerHTML = '';
    noRooms.classList.add('hidden');

    // Fetch rooms
    const rooms = await fetchActiveRooms();
    loading.classList.add('hidden');

    if (rooms.length === 0) {
        noRooms.classList.remove('hidden');
        return;
    }

    // Render rooms
    list.innerHTML = rooms.map(room => `
        <div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">🟢</span>
                    <span class="font-bold text-lg text-white">${escapeHtml(room.roomId)}</span>
                </div>
            </div>
            <div class="text-gray-400 text-sm mb-3">
                ${room.onlineCount} ${room.onlineCount === 1 ? 'person' : 'people'} online · Host: ${escapeHtml(room.hostName)}
            </div>
            <button
                onclick="requestJoinRoom('${escapeHtml(room.roomId)}')"
                class="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
                Request to Join
            </button>
        </div>
    `).join('');
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function requestJoinRoom(roomId) {
    // Close active rooms modal
    document.getElementById('activeRoomsModal').classList.add('hidden');

    // Show waiting modal
    const waitingModal = document.getElementById('joinRequestWaitingModal');
    document.getElementById('waitingRoomName').textContent = roomId;
    waitingModal.classList.remove('hidden');

    // Send request via WebSocket (need to establish connection first)
    const apiBaseUrl = window.BREAKPOINT_API_BASE_URL || 'http://localhost:8787';
    const profile = AppState.currentUser;

    try {
        // Create WebSocket connection to send request
        const wsUrl = apiBaseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
        const ws = new WebSocket(`${wsUrl}/api/rooms/${roomId}/ws`);

        ws.onopen = () => {
            // Send join request
            ws.send(JSON.stringify({
                v: 1,
                t: 'request_join',
                roomId: roomId,
                clientId: profile.id,
                displayName: profile.name,
                avatar: profile.avatar
            }));

            console.log('📤 Join request sent to', roomId);
        };

        ws.onerror = () => {
            waitingModal.classList.add('hidden');
            alert('Failed to connect to room. Please try again.');
        };

        // Store WebSocket for later cleanup
        window._tempJoinRequestWs = ws;

    } catch (error) {
        console.error('Failed to request join:', error);
        waitingModal.classList.add('hidden');
        alert('Failed to send join request. Please try again.');
    }
}

// Make globally available for inline onclick handlers
window.requestJoinRoom = requestJoinRoom;

function generateInviteLink() {
    if (!AppState.realtimeClient || !AppState.realtimeClient.isConnected) {
        alert('Not connected to room');
        return;
    }

    // Show modal
    const modal = document.getElementById('inviteShareModal');
    modal.classList.remove('hidden');

    // Reset state
    document.getElementById('inviteLinkInput').value = 'Generating...';
    const canvas = document.getElementById('inviteQRCode');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillText('Generating...', 50, 100);

    // Send generate_invite message
    AppState.realtimeClient.send({ v: 1, t: 'generate_invite' });

    console.log('📤 Requested invite token generation');
}

function showJoinRequestNotification(request) {
    const container = document.getElementById('joinRequestNotifications');
    if (!container) return;

    // Check if host
    if (!AppState.isHost) return;

    // Clone template
    const template = document.getElementById('joinRequestNotificationTemplate');
    const notification = template.content.cloneNode(true);

    // Fill in details
    notification.querySelector('.join-request-avatar').textContent = request.avatar;
    notification.querySelector('.join-request-name').textContent = request.displayName;

    // Set up approve button
    const approveBtn = notification.querySelector('.approve-join-btn');
    approveBtn.addEventListener('click', () => {
        approveJoinRequest(request.clientId);
        // Remove notification
        approveBtn.closest('.bg-purple-900').remove();
    });

    // Set up deny button
    const denyBtn = notification.querySelector('.deny-join-btn');
    denyBtn.addEventListener('click', () => {
        denyJoinRequest(request.clientId);
        // Remove notification
        denyBtn.closest('.bg-purple-900').remove();
    });

    // Add to container
    container.appendChild(notification);
}

function approveJoinRequest(requesterId) {
    if (!AppState.realtimeClient || !AppState.realtimeClient.isConnected) {
        console.error('Not connected to room');
        return;
    }

    AppState.realtimeClient.send({
        v: 1,
        t: 'approve_join',
        requesterId: requesterId
    });

    console.log('✅ Approved join request for', requesterId);
}

function denyJoinRequest(requesterId) {
    if (!AppState.realtimeClient || !AppState.realtimeClient.isConnected) {
        console.error('Not connected to room');
        return;
    }

    AppState.realtimeClient.send({
        v: 1,
        t: 'deny_join',
        requesterId: requesterId
    });

    console.log('❌ Denied join request for', requesterId);
}

function updateOnlineUsersDisplay() {
    const onlineUsers = document.getElementById('onlineUsers');
    if (!onlineUsers) return;

    if (AppState.realtimeClient && AppState.realtimeClient.isConnected) {
        const onlineCount = Object.values(AppState.realtimeClient.state?.members || {}).filter(m => m.online).length;
        onlineUsers.innerHTML = `<p>${onlineCount} ${onlineCount === 1 ? 'person' : 'people'} online in this room</p>`;
    } else {
        onlineUsers.innerHTML = `<p>Connecting to room...</p>`;
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // === Room Selection ===
    document.getElementById('createRoomButton')?.addEventListener('click', () => {
        const input = document.getElementById('newRoomInputHome');
        if (input && input.value) {
            addRoom(input.value);
            input.value = '';
        }
    });

    document.getElementById('newRoomInputHome')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const input = e.target;
            if (input.value) {
                addRoom(input.value);
                input.value = '';
            }
        }
    });

    document.getElementById('backToRooms')?.addEventListener('click', () => {
        ViewManager.show('roomSelectionView');
    });

    // Browse Active Rooms
    document.getElementById('browseActiveRoomsButton')?.addEventListener('click', showActiveRoomsModal);
    document.getElementById('closeActiveRoomsModal')?.addEventListener('click', () => {
        document.getElementById('activeRoomsModal').classList.add('hidden');
    });

    // Join Request Waiting
    document.getElementById('cancelJoinRequest')?.addEventListener('click', () => {
        document.getElementById('joinRequestWaitingModal').classList.add('hidden');

        // Close temp WebSocket if exists
        if (window._tempJoinRequestWs) {
            window._tempJoinRequestWs.close();
            window._tempJoinRequestWs = null;
        }
    });

    // Invite Share
    document.getElementById('shareRoomButton')?.addEventListener('click', generateInviteLink);
    document.getElementById('closeInviteShareModal')?.addEventListener('click', () => {
        document.getElementById('inviteShareModal').classList.add('hidden');
    });
    document.getElementById('copyInviteLink')?.addEventListener('click', async () => {
        const input = document.getElementById('inviteLinkInput');
        try {
            await navigator.clipboard.writeText(input.value);
            const btn = document.getElementById('copyInviteLink');
            const originalText = btn.textContent;
            btn.textContent = '✅ Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy link');
        }
    });

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
