// Timer State Management
const timerState = {
  mode: 'pomodoro', // pomodoro, countdown, stopwatch
  isRunning: false,
  isPaused: false,
  timeRemaining: 0, // in seconds
  startTime: 0,
  elapsedTime: 0,
  intervalId: null,
  
  // Pomodoro specific
  pomodoroPhase: 'work', // work, shortBreak, longBreak
  currentSession: 1,
  totalSessions: 0,
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsUntilLongBreak: 4,
  
  // Settings
  flipEnabled: false,
  soundEnabled: true,
  currentFont: "'Orbitron', monospace",
  backgroundMedia: null,
  backgroundType: null, // 'image' or 'video'
  currentTheme: 'default'
};

// DOM Elements
const elements = {
  // Mode buttons
  modeBtns: document.querySelectorAll('.mode-btn'),
  
  // Timer display
  timerDisplay: document.getElementById('timerDisplay'),
  digits: {},
  
  // Controls
  startPauseBtn: document.getElementById('startPauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  
  // Pomodoro
  pomodoroStatus: document.getElementById('pomodoroStatus'),
  sessionType: document.querySelector('.session-type'),
  sessionCounter: document.querySelector('.session-counter'),
  progressFill: document.getElementById('progressFill'),
  
  // Countdown input
  countdownInput: document.getElementById('countdownInput'),
  hoursInput: document.getElementById('hoursInput'),
  minutesInput: document.getElementById('minutesInput'),
  secondsInput: document.getElementById('secondsInput'),
  
  // Settings panel
  settingsPanel: document.getElementById('settingsPanel'),
  closeSettings: document.getElementById('closeSettings'),
  flipToggle: document.getElementById('flipToggle'),
  soundToggle: document.getElementById('soundToggle'),
  fontSelector: document.getElementById('fontSelector'),
  backgroundUpload: document.getElementById('backgroundUpload'),
  clearBackground: document.getElementById('clearBackground'),
  uploadStatus: document.getElementById('uploadStatus'),
  themeSelector: document.getElementById('themeSelector'),
  
  // Pomodoro settings
  pomodoroSettings: document.getElementById('pomodoroSettings'),
  workDuration: document.getElementById('workDuration'),
  shortBreak: document.getElementById('shortBreak'),
  longBreak: document.getElementById('longBreak'),
  sessionsUntilLongBreak: document.getElementById('sessionsUntilLongBreak'),
  
  // Background
  videoBackground: document.getElementById('videoBackground'),
  backgroundOverlay: document.getElementById('backgroundOverlay')
};

// Initialize digit references
const digitTypes = ['hours-tens', 'hours-ones', 'minutes-tens', 'minutes-ones', 'seconds-tens', 'seconds-ones'];
digitTypes.forEach(type => {
  elements.digits[type] = document.querySelector(`[data-digit="${type}"]`);
});

// Initialize
function init() {
  setupEventListeners();
  updateDisplay();
  updatePomodoroDisplay();
  
  // Initialize settings toggles
  elements.flipToggle.checked = timerState.flipEnabled;
  elements.soundToggle.checked = timerState.soundEnabled;
  
  // Set default font to match flipclocks.org
  elements.fontSelector.value = "'Orbitron', monospace";
  changeFont({ target: elements.fontSelector });
}

// Event Listeners
function setupEventListeners() {
  // Mode selection
  elements.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => handleModeChange(btn.dataset.mode));
  });
  
  // Timer controls
  elements.startPauseBtn.addEventListener('click', toggleTimer);
  elements.resetBtn.addEventListener('click', resetTimer);
  elements.settingsBtn.addEventListener('click', openSettings);
  
  // Settings panel
  elements.closeSettings.addEventListener('click', closeSettings);
  elements.flipToggle.addEventListener('change', toggleFlipAnimation);
  elements.soundToggle.addEventListener('change', toggleSound);
  elements.fontSelector.addEventListener('change', changeFont);
  elements.backgroundUpload.addEventListener('change', handleBackgroundUpload);
  elements.clearBackground.addEventListener('click', clearBackground);
  elements.themeSelector.addEventListener('change', changeTheme);
  
  // Pomodoro settings
  elements.workDuration.addEventListener('change', updatePomodoroSettings);
  elements.shortBreak.addEventListener('change', updatePomodoroSettings);
  elements.longBreak.addEventListener('change', updatePomodoroSettings);
  elements.sessionsUntilLongBreak.addEventListener('change', updatePomodoroSettings);
}

// Mode Change
function handleModeChange(mode) {
  if (timerState.isRunning) {
    stopTimer();
  }
  
  timerState.mode = mode;
  timerState.isPaused = false;
  
  // Update active button
  elements.modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  // Show/hide relevant sections
  if (mode === 'pomodoro') {
    elements.pomodoroStatus.classList.remove('hidden');
    elements.countdownInput.classList.add('hidden');
    elements.pomodoroSettings.style.display = 'block';
    initializePomodoro();
  } else if (mode === 'countdown') {
    elements.pomodoroStatus.classList.add('hidden');
    elements.countdownInput.classList.remove('hidden');
    elements.pomodoroSettings.style.display = 'none';
    initializeCountdown();
  } else if (mode === 'stopwatch') {
    elements.pomodoroStatus.classList.add('hidden');
    elements.countdownInput.classList.add('hidden');
    elements.pomodoroSettings.style.display = 'none';
    initializeStopwatch();
  }
  
  updateDisplay();
}

// Initialize Modes
function initializePomodoro() {
  timerState.pomodoroPhase = 'work';
  timerState.currentSession = 1;
  timerState.totalSessions = 0;
  timerState.timeRemaining = timerState.workDuration;
  updatePomodoroDisplay();
}

function initializeCountdown() {
  const hours = parseInt(elements.hoursInput.value) || 0;
  const minutes = parseInt(elements.minutesInput.value) || 0;
  const seconds = parseInt(elements.secondsInput.value) || 0;
  timerState.timeRemaining = hours * 3600 + minutes * 60 + seconds;
}

function initializeStopwatch() {
  timerState.timeRemaining = 0;
  timerState.elapsedTime = 0;
}

// Timer Control
function toggleTimer() {
  if (timerState.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (timerState.mode === 'countdown' && !timerState.isPaused) {
    initializeCountdown();
  }
  
  timerState.isRunning = true;
  timerState.isPaused = false;
  timerState.startTime = Date.now();
  
  elements.startPauseBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="6" y="4" width="4" height="16"></rect>
      <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
    Pause
  `;
  
  runTimer();
}

function pauseTimer() {
  timerState.isRunning = false;
  timerState.isPaused = true;
  
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
  
  elements.startPauseBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
    Resume
  `;
}

function stopTimer() {
  timerState.isRunning = false;
  timerState.isPaused = false;
  
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
  
  elements.startPauseBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
    Start
  `;
}

function resetTimer() {
  stopTimer();
  
  if (timerState.mode === 'pomodoro') {
    initializePomodoro();
  } else if (timerState.mode === 'countdown') {
    initializeCountdown();
  } else if (timerState.mode === 'stopwatch') {
    initializeStopwatch();
  }
  
  updateDisplay();
}

// Timer Logic
function runTimer() {
  timerState.intervalId = setInterval(() => {
    if (!timerState.isRunning) return;
    
    if (timerState.mode === 'stopwatch') {
      timerState.elapsedTime++;
      timerState.timeRemaining = timerState.elapsedTime;
    } else {
      timerState.timeRemaining--;
      
      if (timerState.timeRemaining <= 0) {
        handleTimerComplete();
        return;
      }
    }
    
    updateDisplay();
    
    if (timerState.mode === 'pomodoro') {
      updateProgressBar();
    }
  }, 1000);
}

function handleTimerComplete() {
  if (timerState.soundEnabled) {
    playNotificationSound();
  }
  
  if (timerState.mode === 'pomodoro') {
    handlePomodoroComplete();
  } else {
    stopTimer();
    timerState.timeRemaining = 0;
    updateDisplay();
  }
}

function handlePomodoroComplete() {
  if (timerState.pomodoroPhase === 'work') {
    timerState.totalSessions++;
    
    if (timerState.totalSessions % timerState.sessionsUntilLongBreak === 0) {
      // Long break
      timerState.pomodoroPhase = 'longBreak';
      timerState.timeRemaining = timerState.longBreakDuration;
    } else {
      // Short break
      timerState.pomodoroPhase = 'shortBreak';
      timerState.timeRemaining = timerState.shortBreakDuration;
    }
  } else {
    // Break ended, start work
    timerState.pomodoroPhase = 'work';
    timerState.currentSession = (timerState.totalSessions % timerState.sessionsUntilLongBreak) + 1;
    timerState.timeRemaining = timerState.workDuration;
  }
  
  updatePomodoroDisplay();
  updateDisplay();
  
  // Auto-start next phase
  startTimer();
}

// Display Updates
function updateDisplay() {
  const time = timerState.timeRemaining;
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;
  
  updateDigit('hours-tens', Math.floor(hours / 10));
  updateDigit('hours-ones', hours % 10);
  updateDigit('minutes-tens', Math.floor(minutes / 10));
  updateDigit('minutes-ones', minutes % 10);
  updateDigit('seconds-tens', Math.floor(seconds / 10));
  updateDigit('seconds-ones', seconds % 10);
}

function updateDigit(digitType, value) {
  const digitEl = elements.digits[digitType];
  const currentValue = parseInt(digitEl.textContent);
  
  if (currentValue !== value) {
    if (timerState.flipEnabled && timerState.isRunning) {
      // Store old value for flip animation
      digitEl.setAttribute('data-old-value', currentValue);
      digitEl.setAttribute('data-current-value', value);
      
      // Add flipping class
      digitEl.classList.add('flipping');
      
      // Update the visible text immediately (but it's hidden by the pseudo-elements)
      digitEl.textContent = value;
      
      // Remove flipping class after animation completes
      setTimeout(() => {
        digitEl.classList.remove('flipping');
      }, 600);
    } else {
      // No animation, just update
      digitEl.textContent = value;
    }
  }
}

function updatePomodoroDisplay() {
  if (timerState.mode !== 'pomodoro') return;
  
  const phaseNames = {
    work: 'Work Session',
    shortBreak: 'Short Break',
    longBreak: 'Long Break'
  };
  
  elements.sessionType.textContent = phaseNames[timerState.pomodoroPhase];
  elements.sessionCounter.textContent = `Session ${timerState.currentSession} of ${timerState.sessionsUntilLongBreak}`;
  
  updateProgressBar();
}

function updateProgressBar() {
  let totalDuration;
  if (timerState.pomodoroPhase === 'work') {
    totalDuration = timerState.workDuration;
  } else if (timerState.pomodoroPhase === 'shortBreak') {
    totalDuration = timerState.shortBreakDuration;
  } else {
    totalDuration = timerState.longBreakDuration;
  }
  
  const progress = ((totalDuration - timerState.timeRemaining) / totalDuration) * 100;
  elements.progressFill.style.width = `${progress}%`;
}

// Settings
function openSettings() {
  elements.settingsPanel.classList.add('active');
  elements.settingsPanel.classList.remove('hidden');
}

function closeSettings() {
  elements.settingsPanel.classList.remove('active');
}

function toggleFlipAnimation(e) {
  timerState.flipEnabled = e.target.checked;
  if (timerState.flipEnabled) {
    elements.timerDisplay.classList.add('flip-enabled');
  } else {
    elements.timerDisplay.classList.remove('flip-enabled');
  }
}

function toggleSound(e) {
  timerState.soundEnabled = e.target.checked;
}

function changeFont(e) {
  timerState.currentFont = e.target.value;
  const digits = document.querySelectorAll('.digit, .separator');
  digits.forEach(digit => {
    digit.style.fontFamily = timerState.currentFont;
  });
}

function changeTheme(e) {
  timerState.currentTheme = e.target.value;
  document.body.setAttribute('data-theme', timerState.currentTheme);
}

function handleBackgroundUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  
  reader.onload = function(event) {
    const fileType = file.type;
    
    if (fileType.startsWith('image/')) {
      setImageBackground(event.target.result);
      elements.uploadStatus.textContent = 'Image uploaded successfully!';
    } else if (fileType.startsWith('video/')) {
      setVideoBackground(event.target.result);
      elements.uploadStatus.textContent = 'Video uploaded successfully!';
    }
    
    setTimeout(() => {
      elements.uploadStatus.textContent = '';
    }, 3000);
  };
  
  reader.readAsDataURL(file);
}

function setImageBackground(dataUrl) {
  // Clear any existing background
  elements.videoBackground.innerHTML = '';
  
  // Create image element
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = 'Background';
  img.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -2;
  `;
  
  // Add to background container
  elements.videoBackground.appendChild(img);
  
  timerState.backgroundMedia = dataUrl;
  timerState.backgroundType = 'image';
  
  elements.uploadStatus.textContent = 'Background image set successfully!';
  setTimeout(() => {
    elements.uploadStatus.textContent = '';
  }, 3000);
}

function setVideoBackground(dataUrl) {
  // Clear any existing background
  elements.videoBackground.innerHTML = '';
  
  // Create video element
  const video = document.createElement('video');
  video.src = dataUrl;
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -2;
  `;
  
  // Add to background container
  elements.videoBackground.appendChild(video);
  
  timerState.backgroundMedia = dataUrl;
  timerState.backgroundType = 'video';
  
  elements.uploadStatus.textContent = 'Background video set successfully!';
  setTimeout(() => {
    elements.uploadStatus.textContent = '';
  }, 3000);
}

function clearBackground() {
  elements.videoBackground.innerHTML = '';
  timerState.backgroundMedia = null;
  timerState.backgroundType = null;
  elements.uploadStatus.textContent = 'Background cleared';
  setTimeout(() => {
    elements.uploadStatus.textContent = '';
  }, 2000);
}

function updatePomodoroSettings() {
  timerState.workDuration = parseInt(elements.workDuration.value) * 60;
  timerState.shortBreakDuration = parseInt(elements.shortBreak.value) * 60;
  timerState.longBreakDuration = parseInt(elements.longBreak.value) * 60;
  timerState.sessionsUntilLongBreak = parseInt(elements.sessionsUntilLongBreak.value);
  
  if (timerState.mode === 'pomodoro' && !timerState.isRunning) {
    initializePomodoro();
    updateDisplay();
  }
}

// Notification Sound
function playNotificationSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// Initialize app
init();
