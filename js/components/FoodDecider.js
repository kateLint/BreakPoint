/**
 * Poll Voting Component
 * Quick poll-based decision making
 */

import { showNotification, ViewManager } from '../app.js';

// ============================================
// POLL DATA
// ============================================
const POLL_OPTIONS = [
    { id: '1', name: 'Thai Spice', description: 'Authentic Thai cuisine', emoji: '🌶️' },
    { id: '2', name: 'Burger Palace', description: 'Gourmet burgers', emoji: '🍔' },
    { id: '3', name: 'Sushi Garden', description: 'Fresh sushi', emoji: '🍣' },
    { id: '4', name: 'Pizza Corner', description: 'Wood-fired pizza', emoji: '🍕' }
];

let selectedOption = null;
let pollTimer = null;
let timeRemaining = 600; // 10 minutes in seconds

// ============================================
// INITIALIZE POLL
// ============================================
export function initializePoll() {
    selectedOption = null;
    timeRemaining = 600;

    const pollOptions = document.getElementById('pollOptions');
    if (!pollOptions) return;

    // Render options
    pollOptions.innerHTML = POLL_OPTIONS.map(option => `
        <div class="poll-option" data-id="${option.id}" onclick="selectPollOption('${option.id}')">
            <div class="poll-option-content">
                <div class="poll-option-image" style="background: linear-gradient(135deg, ${getGradientForOption(option.emoji)}); display: flex; align-items: center; justify-content: center; font-size: 48px;">
                    ${option.emoji}
                </div>
                <div class="poll-option-info">
                    <div class="poll-option-name">${option.name}</div>
                    <div class="poll-option-description">${option.description}</div>
                </div>
                <div class="poll-option-checkbox"></div>
            </div>
        </div>
    `).join('');

    // Start timer
    startPollTimer();
}

// ============================================
// SELECT POLL OPTION
// ============================================
export function selectPollOption(optionId) {
    selectedOption = optionId;

    // Update UI
    document.querySelectorAll('.poll-option').forEach(option => {
        if (option.dataset.id === optionId) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// ============================================
// SUBMIT POLL VOTE
// ============================================
export function submitPollVote() {
    if (!selectedOption) {
        showNotification('Please select an option!', 'error');
        return;
    }

    const winner = POLL_OPTIONS.find(opt => opt.id === selectedOption);
    if (!winner) return;

    // Stop timer
    if (pollTimer) {
        clearInterval(pollTimer);
    }

    // Show result
    showPollWinner(winner);
}

// ============================================
// POLL TIMER
// ============================================
function startPollTimer() {
    const timerText = document.getElementById('timerText');
    const pollTimerEl = document.getElementById('pollTimer');

    if (pollTimer) {
        clearInterval(pollTimer);
    }

    pollTimer = setInterval(() => {
        timeRemaining--;

        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Add urgent class when < 2 minutes
        if (timeRemaining < 120) {
            pollTimerEl.classList.add('urgent');
        }

        // Auto-submit when time runs out
        if (timeRemaining <= 0) {
            clearInterval(pollTimer);
            if (selectedOption) {
                submitPollVote();
            } else {
                showNotification('Time\'s up! No vote submitted.', 'info');
                ViewManager.show('foodDeciderView');
            }
        }
    }, 1000);
}

// ============================================
// SHOW POLL WINNER
// ============================================
function showPollWinner(option) {
    ViewManager.show('resultView');

    const winnerImage = document.getElementById('winnerImage');
    const winnerName = document.getElementById('winnerName');
    const winnerDetails = document.getElementById('winnerDetails');

    // Set winner info
    winnerName.textContent = option.name;
    winnerDetails.textContent = `${option.description} • ${Math.floor(Math.random() * 5) + 3} people voted`;

    // Create placeholder image
    winnerImage.style.background = `linear-gradient(135deg, ${getGradientForOption(option.emoji)})`;
    winnerImage.style.display = 'flex';
    winnerImage.style.alignItems = 'center';
    winnerImage.style.justifyContent = 'center';
    winnerImage.style.fontSize = '120px';
    winnerImage.textContent = option.emoji;
    winnerImage.alt = option.name;

    // Trigger confetti
    import('../utils/animations.js').then(module => {
        module.createConfetti();
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getGradientForOption(emoji) {
    const gradients = {
        '🌶️': '#F97316 0%, #EF4444 100%',
        '🍔': '#F59E0B 0%, #EF4444 100%',
        '🍣': '#3B82F6 0%, #8B5CF6 100%',
        '🍕': '#EF4444 0%, #F97316 100%'
    };
    return gradients[emoji] || '#8B5CF6 0%, #EC4899 100%';
}

// ============================================
// CLEANUP
// ============================================
export function cleanupPoll() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
}

// ============================================
// EXPORT FOR GLOBAL ACCESS
// ============================================
window.initializePoll = initializePoll;
window.selectPollOption = selectPollOption;
window.submitPollVote = submitPollVote;
