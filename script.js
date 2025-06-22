// Global variables
var challengeTimer = null;
var timeRemaining = 0;
var streak = 0;
var progress = 0;
var expenses = [];
var badgesEarned = 0;
var currentChallenge = null;
var challengeActive = false;

// Challenge data objects
var challenges = {
    'spend-less': 'Spend Less Than $10 Today',
    'buy-less': 'Avoid Buying stuff more than $40 Today',
    'cook-meal': 'Cook a Meal Instead of Eating Out',
    'save-money': 'Save $20 by Skipping Takeout',
    'track-expenses': 'Track All Expenses for the Day'
};

// DOM element references
var startChallengeBtn = document.getElementById('start-challenge');
var endChallengeBtn = document.getElementById('end-challenge');
var resetChallengeBtn = document.getElementById('reset-challenge');
var challengeDropdown = document.getElementById('challenge-dropdown');
var todaysChallengeDisplay = document.getElementById('todays-challenge');
var timeRemainingDisplay = document.getElementById('time-remaining');
var streakCountDisplay = document.getElementById('streak-count');
var currentStreakDisplay = document.getElementById('current-streak');
var expenseForm = document.getElementById('expense-form');
var amountInput = document.getElementById('amount');
var moodSelect = document.getElementById('mood');
var categorySelect = document.getElementById('category');
var historyList = document.getElementById('history-list');
var toggleHistoryBtn = document.getElementById('toggle-history');
var progressBar = document.getElementById('progress');
var progressValueDisplay = document.getElementById('progress-value');
var progressFeedback = document.getElementById('progress-feedback');
var progressContent = document.getElementById('progress-content');
var progressComplete = document.getElementById('progress-complete');
var activeChallenge = document.getElementById('active-challenge');
var completedChallenge = document.getElementById('completed-challenge');
var badgeCollection = document.getElementById('badge-collection');

// INITIALIZATION
function init() {
    clearAllTimers();
    loadState();
    updateUI();
    setupEventListeners();
}

// TIMER FUNCTIONS
function clearAllTimers() {
    if (challengeTimer !== null) {
        clearInterval(challengeTimer);
        challengeTimer = null;
    }
}

// STATE MANAGEMENT
function loadState() {
    var savedState = localStorage.getItem('spendSmartState');

    // If nothing saved, use defaults
    if (!savedState) return;

    var state = JSON.parse(savedState);

    // Basic validation - check if it looks like our state object
    if (state && typeof state === 'object') {
        // Set numeric values with defaults
        badgesEarned = typeof state.badgesEarned === 'number' ? state.badgesEarned : 0;
        streak = typeof state.streak === 'number' ? state.streak : 0;

        // Handle expenses array
        expenses = [];
        if (Array.isArray(state.expenses)) {
            for (var i = 0; i < state.expenses.length; i++) {
                var e = state.expenses[i];
                if (e && typeof e === 'object') {
                    expenses.push({
                        amount: typeof e.amount === 'number' ? e.amount : 0,
                        mood: e.mood || 'neutral',  // default if missing
                        category: e.category || 'other',
                        date: e.date ? new Date(e.date) : new Date()
                    });
                }
            }
        }
    }

    // Always reset these temporary values
    progress = 0;
    challengeActive = false;
    currentChallenge = null;
    timeRemaining = 0;
}

function saveState() {
    var state = {
        badgesEarned: badgesEarned,
        streak: streak,
        expenses: expenses.map(function (expense) {
            return {
                amount: expense.amount,
                mood: expense.mood,
                category: expense.category,
                date: expense.date.toISOString()
            };
        })
    };
    localStorage.setItem('spendSmartState', JSON.stringify(state));
}

function resetState() {
    clearAllTimers();

    // Only reset these values (keep streak and badgesEarned)
    progress = 0;
    currentChallenge = null;
    challengeActive = false;
    timeRemaining = 0;

    // Reset UI to show the completed challenge state (with streaks and badges)
    progressContent.style.display = "none";
    progressComplete.style.display = "block";
    activeChallenge.style.display = "none";
    completedChallenge.style.display = "block";
    currentStreakDisplay.textContent = streak + "-day";

    // Show start button and hide end button
    startChallengeBtn.style.display = "block";
    endChallengeBtn.style.display = "none";

    // Update the challenge display text
    todaysChallengeDisplay.textContent = "Select a daily challenge from the dropdown, track your progress, and earn rewards! Gain 10 points for positive moods and lose 10 for negative ones—stay motivated to achieve your goals. The progress bar will become visible after your first entry.";

    updateUI();
}

// CORE FUNCTIONS
function startChallenge(challengeId) {
    var challengeText = challenges[challengeId];
    if (!challengeText) return;

    currentChallenge = challengeId;
    challengeActive = true;
    todaysChallengeDisplay.textContent = challengeText;
    timeRemaining = 24 * 60 * 60; // 24 hours in seconds

    // Hide start button and show end button
    startChallengeBtn.style.display = "none";
    endChallengeBtn.style.display = "block";

    updateTimerDisplay();
    clearAllTimers();

    challengeTimer = setInterval(function () {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearAllTimers();
            endChallenge();
        }
    }, 1000);
}

function endChallenge() {
    clearAllTimers();
    // Show start button and hide end button
    startChallengeBtn.style.display = "block";
    endChallengeBtn.style.display = "none";

    // Reset challenge display text
    todaysChallengeDisplay.textContent = "Select a daily challenge from the dropdown, track your progress, and earn rewards! Gain 10 points for positive moods and lose 10 for negative ones—stay motivated to achieve your goals. The progress bar will become visible after your first entry.";

    challengeActive = false;
    timeRemaining = 0;
    updateTimerDisplay();
}

function completeChallenge() {
    if (!challengeActive) return;

    streak++;
    badgesEarned++;
    showCompletedChallengeUI();
    updateStreakDisplay();
    saveState();

    challengeActive = false;
    progress = 0;
    updateProgressBar();
}

function logExpense(amount, mood, category) {
    // Input validation
    if (!challengeActive) {
        alert("Please start a challenge first!");
        return false;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount!");
        return false;
    }

    // Create expense object
    var newExpense = {
        amount: parseFloat(amount),
        mood: mood,
        category: category,
        date: new Date()
    };

    expenses.push(newExpense);

    // Update progress based on mood
    if (mood === "happy" || mood === "excited" || mood === "relaxed") {
        progress += 10;
        progressFeedback.textContent = "+10 points for a positive mood!";
        progressFeedback.className = "feedback";
    } else {
        progress -= 10;
        progressFeedback.textContent = "-10 points for a negative mood. Stay strong!";
        progressFeedback.className = "feedback negative";
    }

    // Ensure progress stays between 0-100
    progress = Math.max(0, Math.min(100, progress));
    updateProgressBar();
    updateHistory();

    if (progress >= 100) {
        completeChallenge();
    }

    saveState();
    return true;
}

// ==== UI FUNCTIONS
function updateUI() {
    updateStreakDisplay();
    loadBadges();
    updateHistory();
    progress = 0;
    updateProgressBar();
    showActiveChallengeUI();
}

function showActiveChallengeUI() {
    progressContent.style.display = "block";
    progressComplete.style.display = "none";
    activeChallenge.style.display = "block";
    completedChallenge.style.display = "none";
    endChallengeBtn.style.display = "none";
    challengeActive = false;
}

function showCompletedChallengeUI() {
    progressContent.style.display = "none";
    progressComplete.style.display = "block";
    activeChallenge.style.display = "none";
    completedChallenge.style.display = "block";
    currentStreakDisplay.textContent = streak + "-day";
}

function loadBadges() {
    badgeCollection.innerHTML = '';
    for (var i = 0; i < badgesEarned; i++) {
        var newBadge = document.createElement('img');
        newBadge.src = 'Images/Badge.png';
        newBadge.className = 'badge-icon';
        newBadge.alt = 'Golden Badge';
        badgeCollection.appendChild(newBadge);
    }
}

function updateStreakDisplay() {
    streakCountDisplay.textContent = streak;
    currentStreakDisplay.textContent = streak + "-day";
}

function updateProgressBar() {
    progressBar.style.width = progress + '%';
    progressValueDisplay.textContent = progress;
}

function updateTimerDisplay() {
    var hours = Math.floor(timeRemaining / 3600);
    var minutes = Math.floor((timeRemaining % 3600) / 60);
    var seconds = timeRemaining % 60;

    timeRemainingDisplay.textContent =
        (hours < 10 ? "0" : "") + hours + ":" +
        (minutes < 10 ? "0" : "") + minutes + ":" +
        (seconds < 10 ? "0" : "") + seconds;
}

function updateHistory() {
    historyList.innerHTML = '';
    var reversedExpenses = expenses.slice().reverse();

    // Loop through expenses
    for (var i = 0; i < reversedExpenses.length; i++) {
        var expense = reversedExpenses[i];
        var li = document.createElement('li');
        li.innerHTML = '<span class="category">' + expense.category +
            '</span><span class="mood">' + expense.mood +
            '</span><span class="date">' + expense.date.toLocaleDateString() +
            '</span><span class="amount">$' + expense.amount.toFixed(2) + '</span>';
        historyList.appendChild(li);
    }
}

// EVENT LISTENERS
function setupEventListeners() {
    // Window event
    window.addEventListener('beforeunload', clearAllTimers);

    // Button click events
    startChallengeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var selectedChallenge = challengeDropdown.value;
        if (!selectedChallenge) {
            alert('Please select a challenge first!');
            return;
        }
        startChallenge(selectedChallenge);
    });

    endChallengeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        endChallenge();
    });

    resetChallengeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        resetState();
    });

    // Form submission
    expenseForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var amount = amountInput.value;
        var mood = moodSelect.value;
        var category = categorySelect.value;

        if (isNaN(amount) || !mood || !category) {
            alert('Please fill in all fields');
            return;
        }

        logExpense(amount, mood, category);
        expenseForm.reset();
    });

    toggleHistoryBtn.addEventListener('click', function (e) {
        e.preventDefault();
        historyList.classList.toggle('hidden');
    });
}

// Start the application
window.onload = init;