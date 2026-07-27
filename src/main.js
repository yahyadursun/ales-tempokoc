// TempoKoç — Main Controller & Twin Timers Engine (Exam Pacer, Focus To-Do, & Progress Analytics)
import { soundEngine } from './audio.js';
import { StorageManager } from './storage.js';
import { TimerEngine } from './timer.js';
import { PomodoroEngine } from './pomodoro.js';
import Chart from 'chart.js/auto';
import confetti from 'canvas-confetti';

// Format Helpers
function formatMMSS(seconds) {
  const isNeg = seconds < 0;
  const absSec = Math.abs(Math.round(seconds));
  const mins = Math.floor(absSec / 60);
  const secs = absSec % 60;
  const str = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return isNeg ? `-${str}` : str;
}

function formatHHMMSS(seconds) {
  const isNeg = seconds < 0;
  const absSec = Math.abs(Math.round(seconds));
  const hrs = Math.floor(absSec / 3600);
  const mins = Math.floor((absSec % 3600) / 60);
  const secs = absSec % 60;

  const str = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return isNeg ? `+${str}` : str;
}

// Views Navigation
const views = {
  setup: document.getElementById('view-setup'),
  active: document.getElementById('view-active'),
  results: document.getElementById('view-results'),
  focustodo: document.getElementById('view-focustodo'),
};

// Mode Switcher Tabs
const btnModeExam = document.getElementById('btn-mode-exam');
const btnModeFocusTodo = document.getElementById('btn-mode-focustodo');
let currentAppMode = 'exam'; // 'exam' or 'focustodo'

// Header Controls
const btnStartSession = document.getElementById('btn-start-session');
const btnMuteToggle = document.getElementById('btn-mute-toggle');
const labelAudio = document.getElementById('label-audio');
const iconAudio = document.getElementById('icon-audio');

const btnOpenSettings = document.getElementById('btn-open-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const modalSettings = document.getElementById('modal-settings');

const btnOpenHistory = document.getElementById('btn-open-history');
const btnCloseHistory = document.getElementById('btn-close-history');
const btnCloseHistoryModal = document.getElementById('btn-close-history-modal');
const modalHistory = document.getElementById('modal-history');
const historyListContainer = document.getElementById('history-list-container');
const btnClearHistory = document.getElementById('btn-clear-history');

// Analytics Modal Controls
const btnOpenAnalytics = document.getElementById('btn-open-analytics');
const btnCloseAnalytics = document.getElementById('btn-close-analytics');
const btnCloseAnalyticsModal = document.getElementById('btn-close-analytics-modal');
const modalAnalytics = document.getElementById('modal-analytics');
const analyticsPeriodTabs = document.querySelectorAll('#analytics-period-tabs .analytics-tab');
let currentAnalyticsPeriod = 'daily';
let trendChartInstance = null;
let subjectChartInstance = null;

// Setup Inputs (Exam Mode)
const inputTotalQuestions = document.getElementById('input-total-questions');
const labelTotalQuestions = document.getElementById('label-total-questions');
const inputTargetSeconds = document.getElementById('input-target-seconds');
const labelTargetSeconds = document.getElementById('label-target-seconds');
const inputTotalExamMinutes = document.getElementById('input-total-exam-minutes');
const labelTotalExamMinutes = document.getElementById('label-total-exam-minutes');
const toggleShowQuestionTimer = document.getElementById('toggle-show-question-timer');
const toggleNotifyOnTimeout = document.getElementById('toggle-notify-on-timeout');
const toggleAutoAdvance = document.getElementById('toggle-auto-advance');
const toggleCountdownBeep = document.getElementById('toggle-countdown-beep');
const toggleVisualFlash = document.getElementById('toggle-visual-flash');
const presetTitleBadge = document.getElementById('preset-title-badge');
const presetCards = document.querySelectorAll('.preset-card');
const categoryTabs = document.querySelectorAll('.cat-tab');

// Active View Elements (Twin Timers)
const activeQCurrent = document.getElementById('active-q-current');
const activeQTotal = document.getElementById('active-q-total');
const activeQProgressbar = document.getElementById('active-q-progressbar');
const activeSessionElapsed = document.getElementById('active-session-elapsed');
const activePaceBadge = document.getElementById('active-pace-badge');
const activePaceText = document.getElementById('active-pace-text');

// Question Timer Card Elements
const questionTimerVisualWrapper = document.getElementById('question-timer-visual-wrapper');
const hiddenQuestionTimerBadge = document.getElementById('hidden-question-timer-badge');
const displayTimerDigits = document.getElementById('display-timer-digits');
const displayTargetSec = document.getElementById('display-target-sec');
const labelTimeStatus = document.getElementById('label-time-status');
const timerRingCircle = document.getElementById('timer-ring-circle');
const flashOverlay = document.getElementById('flash-overlay');
const overtimeBanner = document.getElementById('overtime-banner');
const overtimeBannerTime = document.getElementById('overtime-banner-time');
const badgeOvertimeLive = document.getElementById('badge-overtime-live');
const displayOvertimeSec = document.getElementById('display-overtime-sec');

// Total Exam Timer Card Elements
const activeTotalExamTimer = document.getElementById('active-total-exam-timer');
const activeTotalExamProgressbar = document.getElementById('active-total-exam-progressbar');
const labelTotalExamStatus = document.getElementById('label-total-exam-status');
const labelTotalExamPresetBadge = document.getElementById('label-total-exam-preset-badge');
const labelTotalExamPct = document.getElementById('label-total-exam-pct');
const labelExamAdvice = document.getElementById('label-exam-advice');

// Action Deck
const btnActionSolve = document.getElementById('btn-action-solve');
const btnActionSkip = document.getElementById('btn-action-skip');
const btnActionPause = document.getElementById('btn-action-pause');
const labelBtnPause = document.getElementById('label-btn-pause');
const iconBtnPause = document.getElementById('icon-btn-pause');
const btnActionPrev = document.getElementById('btn-action-prev');
const btnActionReset = document.getElementById('btn-action-reset');
const activeLogChips = document.getElementById('active-log-chips');

// Results View Elements
const resMetricOntimeRate = document.getElementById('res-metric-ontime-rate');
const resMetricOntimeCount = document.getElementById('res-metric-ontime-count');
const resMetricAvgTime = document.getElementById('res-metric-avg-time');
const resMetricTargetComparison = document.getElementById('res-metric-target-comparison');
const resMetricOvertimeCount = document.getElementById('res-metric-overtime-count');
const resMetricOvertimeTotal = document.getElementById('res-metric-overtime-total');
const resMetricSkippedCount = document.getElementById('res-metric-skipped-count');
const resultsSummarySubtitle = document.getElementById('results-summary-subtitle');
const tableResultsBody = document.getElementById('table-results-body');
const btnRestartNew = document.getElementById('btn-restart-new');
const btnLogoHome = document.getElementById('btn-logo-home');

// Settings Inputs
const soundTypeButtons = document.querySelectorAll('#sound-type-options button');
const inputVolume = document.getElementById('input-volume');
const labelVolumeVal = document.getElementById('label-volume-val');
const btnTestSound = document.getElementById('btn-test-sound');
const btnSaveSettings = document.getElementById('btn-save-settings');

// --- FOCUS TO-DO & POMODORO ELEMENTS ---
const formAddTask = document.getElementById('form-add-task');
const inputTaskTitle = document.getElementById('input-task-title');
const selectTaskSubject = document.getElementById('select-task-subject');
const selectTaskEstPomo = document.getElementById('select-task-est-pomo');
const tasksContainer = document.getElementById('tasks-container');
const taskFilterTabs = document.querySelectorAll('#task-filter-tabs .task-tab');

const pomoActiveTaskTitle = document.getElementById('pomo-active-task-title');
const pomoPhaseBtns = document.querySelectorAll('.pomo-phase-btn');
const pomoPresetBtns = document.querySelectorAll('.pomo-preset-btn');
const pomoRingCircle = document.getElementById('pomo-ring-circle');
const pomoPhaseLabel = document.getElementById('pomo-phase-label');
const pomoDisplayDigits = document.getElementById('pomo-display-digits');
const pomoCyclesBadge = document.getElementById('pomo-cycles-badge');
const btnPomoStartToggle = document.getElementById('btn-pomo-start-toggle');
const iconPomoStart = document.getElementById('icon-pomo-start');
const labelPomoStart = document.getElementById('label-pomo-start');
const btnPomoSkip = document.getElementById('btn-pomo-skip');
const btnPomoReset = document.getElementById('btn-pomo-reset');

const themeBtns = document.querySelectorAll('#theme-selector .theme-btn');
const clockStyleBtns = document.querySelectorAll('#clock-style-selector .clock-style-btn');

const statTodayFocusTime = document.getElementById('stat-today-focus-time');
const statTodayPomodoros = document.getElementById('stat-today-pomodoros');
const statTodayTasks = document.getElementById('stat-today-tasks');

// Instances
const timerEngine = new TimerEngine();
const pomodoroEngine = new PomodoroEngine();

let currentSettings = StorageManager.getSettings();
let currentPresetKey = 'sayisal';
let resultsChartInstance = null;
let currentTaskFilter = 'all';

// Initialization
function initApp() {
  applyLoadedSettings();
  setupTimerCallbacks();
  setupPomodoroCallbacks();
  bindEvents();
  renderHistoryList();
  renderTasks();
  updateDailyStatsUI();

  // Load Theme & Clock preferences
  const savedTheme = StorageManager.getThemePreference();
  setTheme(savedTheme);

  const savedClockStyle = StorageManager.getClockStylePreference();
  setClockStyle(savedClockStyle);

  // Notification permission lazy prompt
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function applyLoadedSettings() {
  soundEngine.setMuted(!currentSettings.soundEnabled);
  soundEngine.setVolume(currentSettings.soundVolume);
  soundEngine.setSoundType(currentSettings.soundType);

  updateAudioBtnUI();

  if (inputVolume) {
    inputVolume.value = Math.round(currentSettings.soundVolume * 100);
  }
  if (labelVolumeVal) {
    labelVolumeVal.textContent = `${Math.round(currentSettings.soundVolume * 100)}%`;
  }
  updateSoundTypeButtonsUI(currentSettings.soundType);

  if (toggleShowQuestionTimer) toggleShowQuestionTimer.checked = currentSettings.showQuestionTimer ?? true;
  if (toggleNotifyOnTimeout) toggleNotifyOnTimeout.checked = currentSettings.notifyOnTimeout ?? true;
  if (toggleAutoAdvance) toggleAutoAdvance.checked = currentSettings.autoAdvanceOnTimeout;
  if (toggleCountdownBeep) toggleCountdownBeep.checked = currentSettings.countdownBeep;
  if (toggleVisualFlash) toggleVisualFlash.checked = currentSettings.visualFlash;

  selectPreset(currentSettings.preset || 'sayisal');
}

function setTheme(themeName) {
  document.body.className = `theme-${themeName} bg-slate-950 text-slate-100 font-sans antialiased min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white`;
  StorageManager.saveThemePreference(themeName);

  themeBtns.forEach(btn => {
    if (btn.dataset.theme === themeName) {
      btn.className = 'theme-btn active px-2.5 py-1.5 rounded-xl bg-slate-800 text-white border border-slate-700 transition cursor-pointer flex-shrink-0 font-bold';
    } else {
      btn.className = 'theme-btn px-2.5 py-1.5 rounded-xl bg-slate-950/70 text-slate-400 border border-slate-800 hover:bg-slate-900 transition cursor-pointer flex-shrink-0';
    }
  });
}

function setClockStyle(styleName) {
  const container = document.getElementById('pomo-clock-container');
  if (container) {
    container.className = `clock-style-${styleName} bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl backdrop-blur-2xl flex flex-col items-center justify-between text-center space-y-6 relative overflow-hidden`;
  }
  StorageManager.saveClockStylePreference(styleName);

  clockStyleBtns.forEach(btn => {
    if (btn.dataset.clockStyle === styleName) {
      btn.className = 'clock-style-btn active p-2 rounded-xl bg-emerald-600 text-white transition cursor-pointer font-bold';
    } else {
      btn.className = 'clock-style-btn p-2 rounded-xl bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800 transition cursor-pointer';
    }
  });

  updatePomodoroUI(pomodoroEngine.getState());
}

function updateAudioBtnUI() {
  if (soundEngine.muted) {
    if (iconAudio) iconAudio.textContent = '🔇';
    if (labelAudio) labelAudio.textContent = 'Ses Kapalı';
  } else {
    if (iconAudio) iconAudio.textContent = '🔊';
    if (labelAudio) labelAudio.textContent = 'Ses Açık';
  }
}

function updateSoundTypeButtonsUI(selectedType) {
  soundTypeButtons.forEach(btn => {
    const sound = btn.dataset.sound;
    if (sound === selectedType) {
      btn.className = 'p-2.5 rounded-xl border-2 border-indigo-500 bg-indigo-500/20 text-indigo-200 font-bold text-xs text-left cursor-pointer';
    } else {
      btn.className = 'p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 font-semibold text-xs text-left hover:border-slate-700 cursor-pointer';
    }
  });
}

// Mode Switching Logic
function setAppMode(mode) {
  currentAppMode = mode;
  if (mode === 'exam') {
    if (btnModeExam) btnModeExam.className = 'app-mode-tab active px-3.5 py-1.5 rounded-lg transition text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow flex items-center gap-1.5 cursor-pointer';
    if (btnModeFocusTodo) btnModeFocusTodo.className = 'app-mode-tab px-3.5 py-1.5 rounded-lg transition text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer';
    
    if (timerEngine.status === 'running' || timerEngine.status === 'paused') {
      showView('active');
    } else {
      showView('setup');
    }
  } else if (mode === 'focustodo') {
    if (btnModeFocusTodo) btnModeFocusTodo.className = 'app-mode-tab active px-3.5 py-1.5 rounded-lg transition text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow flex items-center gap-1.5 cursor-pointer';
    if (btnModeExam) btnModeExam.className = 'app-mode-tab px-3.5 py-1.5 rounded-lg transition text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer';
    
    showView('focustodo');
    renderTasks(currentTaskFilter);
    updateDailyStatsUI();
  }
}

// Preset selection
function selectPreset(presetKey) {
  currentPresetKey = presetKey;
  const p = currentSettings.presets[presetKey] || currentSettings.presets.sayisal;

  presetCards.forEach(card => {
    if (card.dataset.preset === presetKey) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  if (inputTotalQuestions) inputTotalQuestions.value = p.totalQuestions;
  if (labelTotalQuestions) labelTotalQuestions.textContent = `${p.totalQuestions} Soru`;

  if (inputTargetSeconds) inputTargetSeconds.value = p.targetSeconds;
  if (labelTargetSeconds) labelTargetSeconds.textContent = `${p.targetSeconds} Saniye (${formatMMSS(p.targetSeconds)})`;

  if (p.totalExamMinutes && inputTotalExamMinutes) {
    inputTotalExamMinutes.value = p.totalExamMinutes;
    if (labelTotalExamMinutes) {
      labelTotalExamMinutes.textContent = `${p.totalExamMinutes} Dakika (${formatHHMMSS(p.totalExamMinutes * 60)})`;
    }
  }

  if (presetTitleBadge) presetTitleBadge.textContent = p.name;
}

// View Navigation
function showView(viewName) {
  Object.keys(views).forEach(k => {
    if (views[k]) {
      if (k === viewName) {
        views[k].classList.remove('hidden');
      } else {
        views[k].classList.add('hidden');
      }
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- EXAM TIMER CALLBACKS ---
function setupTimerCallbacks() {
  timerEngine.setCallbacks({
    onTick: (state) => updateActiveUI(state),
    onCountdownTick: () => {
      if (toggleCountdownBeep && toggleCountdownBeep.checked) {
        soundEngine.playCountdownTick();
      }
    },
    onTimeout: () => {
      const isNotifyEnabled = toggleNotifyOnTimeout ? toggleNotifyOnTimeout.checked : (currentSettings.notifyOnTimeout ?? true);
      if (isNotifyEnabled) {
        soundEngine.playTimeoutAlert();
        triggerVisualFlashAlert();
        sendWebNotification();
      }
    },
    onQuestionChange: (state) => {
      clearVisualFlashAlert();
      updateActiveUI(state);
      renderLogChips(state.logs);
    },
    onFinish: (report) => {
      soundEngine.playSessionFinish();
      const savedSession = StorageManager.saveSession({
        presetKey: currentPresetKey,
        presetName: currentSettings.presets[currentPresetKey]?.name || 'Özel Sınav',
        ...report
      });
      renderHistoryList();
      showResultsView(report);
    }
  });
}

// --- POMODORO TIMER CALLBACKS ---
function setupPomodoroCallbacks() {
  pomodoroEngine.setCallbacks({
    onTick: (state) => updatePomodoroUI(state),
    onTaskChange: (task) => {
      if (pomoActiveTaskTitle) {
        pomoActiveTaskTitle.textContent = task ? `${task.subject}: ${task.title}` : 'Lütfen bir görev seçin veya serbest odaklanın';
      }
    },
    onWorkComplete: (workSec, task) => {
      const subject = task ? task.subject : 'Genel Odaklanma';
      StorageManager.recordStudyLog({
        subject,
        durationSec: workSec,
        type: 'pomodoro',
        taskId: task ? task.id : null
      });

      if (task) {
        StorageManager.incrementTaskPomodoro(task.id);
        renderTasks(currentTaskFilter);
      }
      updateDailyStatsUI();
    },
    onPhaseFinish: (finishedPhase, nextPhase) => {
      soundEngine.playSessionFinish();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = finishedPhase === 'work' ? '🎉 Pomodoro Tamamlandı!' : '⏰ Mola Süresi Bitti!';
        const body = finishedPhase === 'work' ? 'Tebrikler! Mola zamanı geldi.' : 'Tazeledin, tekrar ders çalışma zamanı!';
        new Notification(title, { body, icon: '/favicon.svg' });
      }
    }
  });
}

// Update Active Pacer View UI (Twin Timers Dashboard)
function updateActiveUI(state) {
  if (activeQCurrent) activeQCurrent.textContent = state.currentQuestionNum;
  if (activeQTotal) activeQTotal.textContent = state.totalQuestions;
  
  if (activeQProgressbar) {
    const progressPct = ((state.currentQuestionNum - 1) / state.totalQuestions) * 100;
    activeQProgressbar.style.width = `${progressPct}%`;
  }

  if (activeSessionElapsed) activeSessionElapsed.textContent = formatMMSS(state.sessionTotalElapsed);

  // Pace Diff calculation badge
  if (activePaceBadge && activePaceText) {
    if (state.totalPaceDiff < -5) {
      activePaceBadge.className = 'px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-xs sm:text-sm flex items-center gap-1.5';
      activePaceText.textContent = `⚡ Temponun ${Math.abs(Math.round(state.totalPaceDiff))}sn Önündesin`;
    } else if (state.totalPaceDiff > 5) {
      activePaceBadge.className = 'px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs sm:text-sm flex items-center gap-1.5';
      activePaceText.textContent = `⚠️ Temponun ${Math.round(state.totalPaceDiff)}sn Geridesin`;
    } else {
      activePaceBadge.className = 'px-3.5 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold text-xs sm:text-sm flex items-center gap-1.5';
      activePaceText.textContent = `🎯 Hedef Tempoyla Tam Dengedesin`;
    }
  }

  // --- TIMER CARD 1: QUESTION PACER ---
  const isQuestionTimerVisible = toggleShowQuestionTimer ? toggleShowQuestionTimer.checked : (currentSettings.showQuestionTimer ?? true);
  if (questionTimerVisualWrapper && hiddenQuestionTimerBadge) {
    if (isQuestionTimerVisible) {
      questionTimerVisualWrapper.classList.remove('hidden');
      hiddenQuestionTimerBadge.classList.add('hidden');
    } else {
      questionTimerVisualWrapper.classList.add('hidden');
      hiddenQuestionTimerBadge.classList.remove('hidden');
    }
  }

  if (displayTimerDigits) {
    if (state.isOvertime) {
      displayTimerDigits.textContent = `+${formatMMSS(state.overtimeSeconds)}`;
      displayTimerDigits.classList.add('text-rose-400');
      displayTimerDigits.classList.remove('text-white');
    } else {
      displayTimerDigits.textContent = formatMMSS(state.remainingSeconds);
      displayTimerDigits.classList.remove('text-rose-400');
      displayTimerDigits.classList.add('text-white');
    }
  }

  if (displayOvertimeSec) displayOvertimeSec.textContent = `+${formatMMSS(state.overtimeSeconds)}`;
  if (overtimeBannerTime) overtimeBannerTime.textContent = `+${formatMMSS(state.overtimeSeconds)} (Toplam: ${formatMMSS(state.currentQuestionElapsed)})`;

  if (badgeOvertimeLive) {
    if (state.isOvertime && isQuestionTimerVisible) badgeOvertimeLive.classList.remove('hidden');
    else badgeOvertimeLive.classList.add('hidden');
  }

  if (overtimeBanner) {
    if (state.isOvertime && isQuestionTimerVisible) overtimeBanner.classList.remove('hidden');
    else overtimeBanner.classList.add('hidden');
  }

  if (displayTargetSec) displayTargetSec.textContent = `Hedef: ${state.targetSeconds} sn`;

  // Pause button state
  if (labelBtnPause && iconBtnPause) {
    if (state.status === 'paused') {
      iconBtnPause.textContent = '▶️';
      labelBtnPause.textContent = 'Devam Et';
      if (labelTimeStatus) labelTimeStatus.textContent = 'DURAKLATILDI';
    } else {
      iconBtnPause.textContent = '⏸️';
      labelBtnPause.textContent = 'Duraklat';
      if (labelTimeStatus) labelTimeStatus.textContent = state.isOvertime ? 'SÜRE AŞIMI (OVERTIME)' : 'Kalan Süre';
    }
  }

  // SVG Ring calculation
  if (timerRingCircle) {
    const totalCircleLength = 527.78;
    const ratio = Math.max(0, state.remainingSeconds / state.targetSeconds);
    const strokeOffset = totalCircleLength * (1 - ratio);
    timerRingCircle.style.strokeDashoffset = strokeOffset;

    if (state.isOvertime) {
      timerRingCircle.setAttribute('class', 'stroke-rose-500 transition-all duration-150 timer-ring-red');
    } else if (ratio < 0.25) {
      timerRingCircle.setAttribute('class', 'stroke-amber-400 transition-all duration-150 timer-ring-yellow');
    } else {
      timerRingCircle.setAttribute('class', 'stroke-emerald-400 transition-all duration-150 timer-ring-green');
    }
  }

  // --- TIMER CARD 2: OVERALL TOTAL EXAM TIMER ---
  if (activeTotalExamTimer) {
    if (state.isTotalExamOvertime) {
      activeTotalExamTimer.textContent = `+${formatHHMMSS(state.totalExamOvertimeSeconds)}`;
      activeTotalExamTimer.className = 'font-mono font-black text-5xl sm:text-6xl tracking-tight text-rose-400 drop-shadow-lg animate-pulse';
      if (labelTotalExamStatus) labelTotalExamStatus.textContent = '⚠️ RESMİ SINAV SÜRESİ AŞILDI';
    } else {
      activeTotalExamTimer.textContent = formatHHMMSS(state.totalExamRemainingSeconds);
      activeTotalExamTimer.className = 'font-mono font-black text-5xl sm:text-6xl tracking-tight text-indigo-300 drop-shadow-lg';
      if (labelTotalExamStatus) labelTotalExamStatus.textContent = 'Resmi Sınav Kalan Süre';
    }
  }

  if (activeTotalExamProgressbar) {
    const pct = Math.max(0, 100 - state.totalExamProgressPercent);
    activeTotalExamProgressbar.style.width = `${pct}%`;
  }

  if (labelTotalExamPct) {
    const pct = Math.max(0, Math.round(100 - state.totalExamProgressPercent));
    labelTotalExamPct.textContent = `%${pct} Kalan`;
  }

  if (labelTotalExamPresetBadge) {
    labelTotalExamPresetBadge.textContent = `Resmi Süre: ${state.totalExamMinutes} Dk`;
  }

  if (labelExamAdvice) {
    if (state.isTotalExamOvertime) {
      labelExamAdvice.textContent = '⚠️ Dikkat! Resmi sınav süresi doldu. Soruları hızlıca tamamlayın.';
    } else if (state.totalPaceDiff > 15) {
      labelExamAdvice.textContent = '⚠️ Temponuz hedef sürenin gerisinde. Pas geçme stratejisini kullanabilirsiniz.';
    } else {
      labelExamAdvice.textContent = '💡 Harika gidiyorsunuz! Genel sınav süresini dengeli harcıyorsunuz.';
    }
  }
}

// Update Pomodoro UI (Supports all clock styles & flip clock)
function updatePomodoroUI(state) {
  const formattedMMSS = formatMMSS(state.remainingSeconds);

  if (pomoDisplayDigits) pomoDisplayDigits.textContent = formattedMMSS;

  document.querySelectorAll('.pomo-display-digits-alt').forEach(el => {
    el.textContent = formattedMMSS;
  });

  // Flip Clock digits
  const minsStr = Math.floor(state.remainingSeconds / 60).toString().padStart(2, '0');
  const secsStr = (state.remainingSeconds % 60).toString().padStart(2, '0');
  const flipMins = document.getElementById('flip-mins');
  const flipSecs = document.getElementById('flip-secs');
  if (flipMins) flipMins.textContent = minsStr;
  if (flipSecs) flipSecs.textContent = secsStr;

  // Hourglass bar
  const hourglassBar = document.getElementById('pomo-hourglass-progressbar');
  if (hourglassBar) {
    const pct = Math.max(0, 100 - state.progressPercent);
    hourglassBar.style.width = `${pct}%`;
  }

  if (pomoCyclesBadge) pomoCyclesBadge.textContent = `Pomodoro #${state.completedWorkCycles + 1}`;
  document.querySelectorAll('.pomo-cycles-badge-alt').forEach(el => {
    el.textContent = `Pomodoro #${state.completedWorkCycles + 1}`;
  });

  pomoPhaseBtns.forEach(btn => {
    if (btn.dataset.phase === state.phase) {
      if (state.phase === 'work') {
        btn.className = 'pomo-phase-btn active flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold transition cursor-pointer';
      } else {
        btn.className = 'pomo-phase-btn active flex-1 py-2 rounded-xl bg-teal-600 text-white font-bold transition cursor-pointer';
      }
    } else {
      btn.className = 'pomo-phase-btn flex-1 py-2 rounded-xl text-slate-400 hover:text-white transition cursor-pointer';
    }
  });

  const phaseTitle = state.phase === 'work' ? 'ODAKLANMA ZAMANI 🍅' : (state.phase === 'shortBreak' ? 'KISA MOLA ZAMANI ☕' : 'UZUN MOLA ZAMANI 🌴');
  if (pomoPhaseLabel) pomoPhaseLabel.textContent = phaseTitle;
  document.querySelectorAll('.pomo-phase-label-alt').forEach(el => el.textContent = phaseTitle);

  if (pomoRingCircle) {
    const totalLength = 527.78;
    const ratio = Math.max(0, state.remainingSeconds / state.targetDuration);
    const strokeOffset = totalLength * (1 - ratio);
    pomoRingCircle.style.strokeDashoffset = strokeOffset;
    if (state.phase === 'work') {
      pomoRingCircle.setAttribute('class', 'stroke-rose-500 transition-all duration-150');
    } else {
      pomoRingCircle.setAttribute('class', 'stroke-teal-400 transition-all duration-150');
    }
  }

  if (labelPomoStart && iconPomoStart) {
    if (state.status === 'running') {
      iconPomoStart.textContent = '⏸️';
      labelPomoStart.textContent = 'DURAKLAT';
    } else if (state.status === 'paused') {
      iconPomoStart.textContent = '▶️';
      labelPomoStart.textContent = 'DEVAM ET';
    } else {
      iconPomoStart.textContent = '▶️';
      labelPomoStart.textContent = state.phase === 'work' ? 'ODAKLANMAYI BAŞLAT' : 'MOLAYI BAŞLAT';
    }
  }
}

// Render Analytics Progress Charts (Day / Month / Year)
function renderAnalyticsCharts(period = 'daily') {
  currentAnalyticsPeriod = period;
  if (!modalAnalytics) return;

  analyticsPeriodTabs.forEach(tab => {
    if (tab.dataset.period === period) {
      tab.className = 'analytics-tab active px-4 py-2 rounded-xl bg-emerald-600 text-white transition cursor-pointer font-bold';
    } else {
      tab.className = 'analytics-tab px-4 py-2 rounded-xl text-slate-400 hover:text-white transition cursor-pointer';
    }
  });

  const streakCount = StorageManager.getStreakCount();
  const statStreakCount = document.getElementById('stat-streak-count');
  if (statStreakCount) statStreakCount.textContent = `${streakCount} Gün 🔥`;

  let analyticsData;
  let labels = [];
  let valuesInMinutes = [];
  let periodLabel = '';

  if (period === 'daily') {
    const todayStr = new Date().toISOString().split('T')[0];
    analyticsData = StorageManager.getDailyAnalytics(todayStr);
    labels = ['Bugün'];
    valuesInMinutes = [(analyticsData.totalSec / 60).toFixed(1)];
    periodLabel = 'Bugünkü Çalışma (Dakika)';
  } else if (period === 'monthly') {
    analyticsData = StorageManager.getMonthlyAnalytics();
    labels = Array.from({ length: analyticsData.daysInMonth }, (_, i) => `${i + 1}`);
    valuesInMinutes = analyticsData.dailyTotals.map(sec => (sec / 60).toFixed(1));
    periodLabel = 'Bu Ay Gün Gün Çalışma (Dakika)';
  } else if (period === 'yearly') {
    analyticsData = StorageManager.getYearlyAnalytics();
    labels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    valuesInMinutes = analyticsData.monthlyTotals.map(sec => (sec / 3600).toFixed(1));
    periodLabel = 'Bu Yıl Ay Ay Çalışma (Saat)';
  }

  const totalTimeEl = document.getElementById('analytics-total-time');
  const logsCountEl = document.getElementById('analytics-logs-count');
  const topSubjectEl = document.getElementById('analytics-top-subject');
  const labelPeriodChart = document.getElementById('label-period-chart');

  if (labelPeriodChart) labelPeriodChart.textContent = periodLabel;
  if (totalTimeEl) totalTimeEl.textContent = formatHHMMSS(analyticsData.totalSec || 0);
  if (logsCountEl) logsCountEl.textContent = `${analyticsData.logsCount || (analyticsData.dailyTotals ? analyticsData.dailyTotals.filter(v => v > 0).length : 0)} Oturum`;

  let topSub = 'Henüz Veri Yok';
  let maxTime = 0;
  if (analyticsData.subjectMap) {
    Object.keys(analyticsData.subjectMap).forEach(sub => {
      if (analyticsData.subjectMap[sub] > maxTime) {
        maxTime = analyticsData.subjectMap[sub];
        topSub = sub;
      }
    });
  }
  if (topSubjectEl) topSubjectEl.textContent = topSub;

  // Chart 1: Trend Bar Chart
  const trendCanvas = document.getElementById('chart-period-trend');
  if (trendCanvas) {
    if (trendChartInstance) trendChartInstance.destroy();
    trendChartInstance = new Chart(trendCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: periodLabel,
          data: valuesInMinutes,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8' } }
        },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51, 65, 85, 0.2)' } },
          y: { beginAtZero: true, ticks: { color: '#64748b' }, grid: { color: 'rgba(51, 65, 85, 0.2)' } }
        }
      }
    });
  }

  // Chart 2: Subject Doughnut Chart
  const subjectCanvas = document.getElementById('chart-subject-distribution');
  if (subjectCanvas) {
    if (subjectChartInstance) subjectChartInstance.destroy();
    const subjectLabels = Object.keys(analyticsData.subjectMap || {});
    const subjectValues = subjectLabels.map(k => (analyticsData.subjectMap[k] / 60).toFixed(1));

    if (subjectLabels.length === 0) {
      subjectLabels.push('Henüz Veri Yok');
      subjectValues.push(1);
    }

    subjectChartInstance = new Chart(subjectCanvas, {
      type: 'doughnut',
      data: {
        labels: subjectLabels,
        datasets: [{
          data: subjectValues,
          backgroundColor: ['#10b981', '#818cf8', '#f59e0b', '#ec4899', '#06b6d4', '#64748b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
        }
      }
    });
  }
}

// Render Focus To-Do Tasks List
function renderTasks(filter = 'all') {
  currentTaskFilter = filter;
  if (!tasksContainer) return;
  let tasks = StorageManager.getTasks();
  
  if (filter === 'active') tasks = tasks.filter(t => !t.completed);
  else if (filter === 'completed') tasks = tasks.filter(t => t.completed);

  if (tasks.length === 0) {
    tasksContainer.innerHTML = '<p class="text-xs text-slate-500 italic text-center py-6">Bu filtreye uygun görev bulunamadı.</p>';
    return;
  }

  tasksContainer.innerHTML = tasks.map(t => {
    const isCompleted = t.completed;
    const isSelected = pomodoroEngine.activeTask && pomodoroEngine.activeTask.id === t.id;

    let pomoBadges = '';
    const est = t.estPomodoros || 1;
    const done = t.donePomodoros || 0;
    for (let i = 0; i < est; i++) {
      if (i < done) pomoBadges += '🍅';
      else pomoBadges += '⚪';
    }

    return `
      <div class="p-3.5 rounded-2xl bg-slate-950/70 border ${isSelected ? 'border-emerald-500/80 bg-emerald-950/20' : 'border-slate-800'} flex items-center justify-between gap-3 hover:border-slate-700 transition">
        <div class="flex items-center gap-3 min-w-0">
          <input type="checkbox" data-task-id="${t.id}" class="task-checkbox w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer" ${isCompleted ? 'checked' : ''}>
          <div class="min-w-0 space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-xs text-white truncate ${isCompleted ? 'line-through text-slate-500' : ''}">${t.title}</span>
              <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium flex-shrink-0">${t.subject}</span>
            </div>
            <div class="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span>${pomoBadges}</span>
              <span class="text-slate-500">(${done}/${est} 🍅)</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button data-select-task-id="${t.id}" class="btn-select-task px-2.5 py-1 rounded-lg text-xs font-semibold ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'} transition cursor-pointer" title="Bu göreve odaklan">
            ${isSelected ? '✓ Odaklanılıyor' : '🎯 Odaklan'}
          </button>
          <button data-delete-task-id="${t.id}" class="btn-delete-task text-slate-500 hover:text-rose-400 p-1.5 transition cursor-pointer" title="Sil">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.task-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.currentTarget.dataset.taskId;
      StorageManager.toggleTask(id);
      renderTasks(currentTaskFilter);
      updateDailyStatsUI();
    });
  });

  document.querySelectorAll('.btn-select-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.selectTaskId;
      const tasks = StorageManager.getTasks();
      const selected = tasks.find(t => t.id === id);
      if (selected) {
        pomodoroEngine.setActiveTask(selected);
        renderTasks(currentTaskFilter);
      }
    });
  });

  document.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.deleteTaskId;
      StorageManager.deleteTask(id);
      if (pomodoroEngine.activeTask && pomodoroEngine.activeTask.id === id) {
        pomodoroEngine.setActiveTask(null);
      }
      renderTasks(currentTaskFilter);
      updateDailyStatsUI();
    });
  });
}

// Update Daily Productivity Stats Cards
function updateDailyStatsUI() {
  const stats = StorageManager.getDailyStats();
  const tasks = StorageManager.getTasks();
  const completedTasks = tasks.filter(t => t.completed).length;

  if (statTodayFocusTime) statTodayFocusTime.textContent = formatHHMMSS(stats.totalWorkSec || 0);
  if (statTodayPomodoros) statTodayPomodoros.textContent = `${stats.pomodorosDone || 0} 🍅`;
  if (statTodayTasks) statTodayTasks.textContent = `${completedTasks} / ${tasks.length} Görev`;
}

// Visual Flash Effect on Timeout
function triggerVisualFlashAlert() {
  if (toggleVisualFlash && toggleVisualFlash.checked && flashOverlay) {
    flashOverlay.classList.add('animate-flash-alert');
  }
}

function clearVisualFlashAlert() {
  if (flashOverlay) {
    flashOverlay.classList.remove('animate-flash-alert');
  }
}

// Browser Web Notification
function sendWebNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('TempoKoç: Süre Doldu!', {
      body: `Soru ${timerEngine.currentQuestionIndex + 1} için hedef süre tamamlandı. Pas geçin veya sonraki soruya ilerleyin!`,
      icon: '/favicon.svg'
    });
  }
}

// Render Question Log Chips
function renderLogChips(logs) {
  if (!activeLogChips) return;
  if (!logs || logs.length === 0) {
    activeLogChips.innerHTML = '<span class="text-xs text-slate-500 italic">Henüz soru yanıtlanmadı...</span>';
    return;
  }

  activeLogChips.innerHTML = logs.map(log => {
    let badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    let icon = '✓';
    if (log.status === 'skipped') {
      badgeClass = 'bg-slate-800 text-slate-400 border-slate-700';
      icon = '⊘';
    } else if (log.status === 'timeout') {
      badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      const overtimeSec = Math.max(0, log.delta);
      icon = `⚠ (+${Math.round(overtimeSec)}s aşım)`;
    }

    return `
      <div class="flex-shrink-0 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium ${badgeClass} flex items-center gap-1.5">
        <span class="font-bold">S${log.questionNum}:</span>
        <span>${log.actualSeconds}s</span>
        <span>${icon}</span>
      </div>
    `;
  }).join('');

  activeLogChips.scrollLeft = activeLogChips.scrollWidth;
}

// Show Results Dashboard View
function showResultsView(report) {
  showView('results');

  const onTimeCount = report.solvedCount;
  const onTimePct = Math.round((onTimeCount / report.totalQuestions) * 100);

  if (resMetricOntimeRate) resMetricOntimeRate.textContent = `${onTimePct}%`;
  if (resMetricOntimeCount) resMetricOntimeCount.textContent = `${onTimeCount} / ${report.totalQuestions} Soru`;

  if (resMetricAvgTime) resMetricAvgTime.textContent = `${formatMMSS(report.avgTimePerQuestion)}`;
  if (resMetricTargetComparison) resMetricTargetComparison.textContent = `Hedef: ${report.targetSeconds} sn`;

  if (resMetricOvertimeCount) resMetricOvertimeCount.textContent = `${report.timeoutCount} Soru`;
  if (resMetricOvertimeTotal) resMetricOvertimeTotal.textContent = `Toplam +${formatMMSS(report.totalOvertimeSeconds || 0)} Aşım`;
  if (resMetricSkippedCount) resMetricSkippedCount.textContent = `${report.skippedCount} Soru`;

  if (resultsSummarySubtitle) {
    resultsSummarySubtitle.textContent = `Toplam ${report.totalQuestions} soruluk testi ${formatMMSS(report.sessionTotalElapsed)} sürede tamamladınız. Ortalama soru başına harcanan süre ${report.avgTimePerQuestion} saniye.`;
  }

  if (tableResultsBody) {
    tableResultsBody.innerHTML = report.questionLogs.map(log => {
      let statusBadge = '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">✓ Zamanında</span>';
      if (log.status === 'skipped') {
        statusBadge = '<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">⊘ Boş</span>';
      } else if (log.status === 'timeout') {
        statusBadge = '<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">⚠ Süre Aşımı</span>';
      }

      const deltaStr = log.delta > 0 ? `+${log.delta}s (Aşım)` : `${log.delta}s (Hızlı)`;
      const deltaColor = log.delta > 0 ? 'text-rose-400' : 'text-emerald-400';

      return `
        <tr class="hover:bg-slate-800/40">
          <td class="p-3 font-bold text-white">Soru ${log.questionNum}</td>
          <td class="p-3 font-semibold text-slate-200">${log.actualSeconds} saniye</td>
          <td class="p-3 ${deltaColor}">${deltaStr}</td>
          <td class="p-3">${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  renderResultsChart(report);

  if (onTimePct >= 65) {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

// Render Interactive Chart.js Visualization (Results)
function renderResultsChart(report) {
  const canvas = document.getElementById('results-chart');
  if (!canvas) return;

  if (resultsChartInstance) {
    resultsChartInstance.destroy();
  }

  const labels = report.questionLogs.map(q => `S${q.questionNum}`);
  const dataActual = report.questionLogs.map(q => q.actualSeconds);
  const targetSec = report.targetSeconds;

  const barBackgroundColors = report.questionLogs.map(q => {
    if (q.status === 'skipped') return 'rgba(100, 116, 139, 0.6)';
    if (q.actualSeconds > targetSec) return 'rgba(244, 63, 94, 0.85)';
    return 'rgba(16, 185, 129, 0.85)';
  });

  resultsChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Harcanan Süre (Saniye)',
          data: dataActual,
          backgroundColor: barBackgroundColors,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Hedef Süre Çizgisi',
          data: Array(labels.length).fill(targetSec),
          type: 'line',
          borderColor: '#818cf8',
          borderWidth: 2.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (ctx) => `Harcanan: ${ctx.parsed.y} sn (Hedef: ${targetSec} sn)`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } },
          grid: { color: 'rgba(51, 65, 85, 0.3)' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 11 } },
          grid: { color: 'rgba(51, 65, 85, 0.3)' }
        }
      }
    }
  });
}

// History List Renderer
function renderHistoryList() {
  if (!historyListContainer) return;
  const history = StorageManager.getHistory();
  if (!history || history.length === 0) {
    historyListContainer.innerHTML = '<p class="text-xs text-slate-500 italic text-center py-6">Henüz geçmiş deneme kaydı yok.</p>';
    return;
  }

  historyListContainer.innerHTML = history.map(item => {
    const formattedDate = new Date(item.date).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    const onTimePct = Math.round((item.solvedCount / item.totalQuestions) * 100);

    return `
      <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 hover:border-slate-700 transition">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-outfit font-bold text-sm text-white">${item.presetName}</span>
            <span class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold font-mono">${item.totalQuestions} Soru</span>
          </div>
          <p class="text-xs text-slate-400 font-mono">${formattedDate} • Toplam: ${formatMMSS(item.sessionTotalElapsed)}</p>
        </div>
        <div class="flex items-center gap-3 font-mono text-xs">
          <div class="text-right">
            <div class="font-bold text-emerald-400">%${onTimePct} Zamanında</div>
            <div class="text-slate-500">Ort. ${item.avgTimePerQuestion}s/soru</div>
          </div>
          <button data-delete-id="${item.id}" class="btn-delete-history text-slate-500 hover:text-rose-400 p-1.5 transition cursor-pointer" title="Sil">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.btn-delete-history').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.deleteId;
      StorageManager.deleteSession(id);
      renderHistoryList();
    });
  });
}

// Bind Event Listeners
function bindEvents() {
  // App Main Mode Switchers
  if (btnModeExam) btnModeExam.addEventListener('click', () => setAppMode('exam'));
  if (btnModeFocusTodo) btnModeFocusTodo.addEventListener('click', () => setAppMode('focustodo'));

  // Analytics Modal Listeners
  if (btnOpenAnalytics) {
    btnOpenAnalytics.addEventListener('click', () => {
      if (modalAnalytics) modalAnalytics.classList.remove('hidden');
      renderAnalyticsCharts(currentAnalyticsPeriod);
    });
  }
  if (btnCloseAnalytics) btnCloseAnalytics.addEventListener('click', () => modalAnalytics && modalAnalytics.classList.add('hidden'));
  if (btnCloseAnalyticsModal) btnCloseAnalyticsModal.addEventListener('click', () => modalAnalytics && modalAnalytics.classList.add('hidden'));

  analyticsPeriodTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const period = tab.dataset.period;
      renderAnalyticsCharts(period);
    });
  });

  // Themes and Clock Style selectors
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setTheme(btn.dataset.theme);
    });
  });

  clockStyleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setClockStyle(btn.dataset.clockStyle);
    });
  });

  // Category Filter Tabs Handler
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat;
      categoryTabs.forEach(t => {
        if (t === tab) {
          t.className = 'cat-tab active px-3 py-1.5 rounded-lg transition text-white bg-indigo-600 font-bold';
        } else {
          t.className = 'cat-tab px-3 py-1.5 rounded-lg transition text-slate-400 hover:text-white hover:bg-slate-800';
        }
      });

      presetCards.forEach(card => {
        if (cat === 'all' || card.dataset.category === cat) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // Preset Selection Cards
  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      selectPreset(card.dataset.preset);
    });
  });

  // Custom Sliders
  if (inputTotalQuestions) {
    inputTotalQuestions.addEventListener('input', (e) => {
      if (labelTotalQuestions) labelTotalQuestions.textContent = `${e.target.value} Soru`;
      if (currentPresetKey !== 'custom') {
        selectPreset('custom');
      }
      const customCardQs = document.getElementById('custom-card-qs');
      if (customCardQs) customCardQs.textContent = `${e.target.value} Soru | ${inputTotalExamMinutes ? inputTotalExamMinutes.value : 30} Dk`;
    });
  }

  if (inputTargetSeconds) {
    inputTargetSeconds.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (labelTargetSeconds) labelTargetSeconds.textContent = `${val} Saniye (${formatMMSS(val)})`;
      if (currentPresetKey !== 'custom') {
        selectPreset('custom');
      }
      const customCardSec = document.getElementById('custom-card-sec');
      if (customCardSec) customCardSec.textContent = `${val}s / Soru`;
    });
  }

  if (inputTotalExamMinutes) {
    inputTotalExamMinutes.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (labelTotalExamMinutes) {
        labelTotalExamMinutes.textContent = `${val} Dakika (${formatHHMMSS(val * 60)})`;
      }
      if (currentPresetKey !== 'custom') {
        selectPreset('custom');
      }
      const customCardQs = document.getElementById('custom-card-qs');
      if (customCardQs) customCardQs.textContent = `${inputTotalQuestions ? inputTotalQuestions.value : 20} Soru | ${val} Dk`;
    });
  }

  // Start Session Button (Exam Mode)
  if (btnStartSession) btnStartSession.addEventListener('click', startPracticeSession);

  // Audio Toggle
  if (btnMuteToggle) {
    btnMuteToggle.addEventListener('click', () => {
      soundEngine.setMuted(!soundEngine.muted);
      currentSettings.soundEnabled = !soundEngine.muted;
      StorageManager.saveSettings(currentSettings);
      updateAudioBtnUI();
    });
  }

  // Settings Modal
  if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => modalSettings && modalSettings.classList.remove('hidden'));
  if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => modalSettings && modalSettings.classList.add('hidden'));

  soundTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const sound = btn.dataset.sound;
      currentSettings.soundType = sound;
      soundEngine.setSoundType(sound);
      updateSoundTypeButtonsUI(sound);
    });
  });

  if (inputVolume) {
    inputVolume.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (labelVolumeVal) labelVolumeVal.textContent = `${val}%`;
      const vol = val / 100;
      currentSettings.soundVolume = vol;
      soundEngine.setVolume(vol);
    });
  }

  if (btnTestSound) btnTestSound.addEventListener('click', () => soundEngine.testSound());

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      if (toggleShowQuestionTimer) currentSettings.showQuestionTimer = toggleShowQuestionTimer.checked;
      if (toggleNotifyOnTimeout) currentSettings.notifyOnTimeout = toggleNotifyOnTimeout.checked;
      if (toggleAutoAdvance) currentSettings.autoAdvanceOnTimeout = toggleAutoAdvance.checked;
      if (toggleCountdownBeep) currentSettings.countdownBeep = toggleCountdownBeep.checked;
      if (toggleVisualFlash) currentSettings.visualFlash = toggleVisualFlash.checked;
      StorageManager.saveSettings(currentSettings);
      if (modalSettings) modalSettings.classList.add('hidden');
    });
  }

  // History Modal
  if (btnOpenHistory) btnOpenHistory.addEventListener('click', () => modalHistory && modalHistory.classList.remove('hidden'));
  if (btnCloseHistory) btnCloseHistory.addEventListener('click', () => modalHistory && modalHistory.classList.add('hidden'));
  if (btnCloseHistoryModal) btnCloseHistoryModal.addEventListener('click', () => modalHistory && modalHistory.classList.add('hidden'));

  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      if (confirm('Tüm deneme geçmişini silmek istediğinize emin misiniz?')) {
        StorageManager.clearHistory();
        renderHistoryList();
      }
    });
  }

  // Active Exam View Actions
  if (btnActionSolve) {
    btnActionSolve.addEventListener('click', () => {
      soundEngine.playQuestionComplete();
      timerEngine.markSolved();
    });
  }

  if (btnActionSkip) {
    btnActionSkip.addEventListener('click', () => {
      soundEngine.playSkipSound();
      timerEngine.markSkipped();
    });
  }

  if (btnActionPause) {
    btnActionPause.addEventListener('click', () => {
      timerEngine.togglePause();
    });
  }

  if (btnActionPrev) {
    btnActionPrev.addEventListener('click', () => {
      timerEngine.previousQuestion();
    });
  }

  if (btnActionReset) {
    btnActionReset.addEventListener('click', () => {
      if (confirm('Mevcut testi sıfırlayıp ana ekrana dönmek istiyor musunuz?')) {
        timerEngine.resetSession();
        showView('setup');
      }
    });
  }

  if (btnRestartNew) {
    btnRestartNew.addEventListener('click', () => {
      showView('setup');
    });
  }

  if (btnLogoHome) {
    btnLogoHome.addEventListener('click', () => {
      if (currentAppMode === 'exam' && (timerEngine.status === 'running' || timerEngine.status === 'paused')) {
        if (!confirm('Devam eden testiniz var. Ana ekrana dönmek istediğinize emin misiniz?')) return;
        timerEngine.resetSession();
      }
      setAppMode('exam');
    });
  }

  // --- FOCUS TO-DO & POMODORO EVENTS ---
  if (formAddTask) {
    formAddTask.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = inputTaskTitle ? inputTaskTitle.value.trim() : '';
      if (!title) return;

      const subject = selectTaskSubject ? selectTaskSubject.value : 'Genel';
      const estPomodoros = selectTaskEstPomo ? parseInt(selectTaskEstPomo.value, 10) : 2;

      StorageManager.addTask({ title, subject, estPomodoros });
      if (inputTaskTitle) inputTaskTitle.value = '';

      renderTasks(currentTaskFilter);
      updateDailyStatsUI();
    });
  }

  taskFilterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;
      taskFilterTabs.forEach(t => {
        if (t === tab) {
          t.className = 'task-tab active px-2.5 py-1 rounded-lg bg-emerald-600 text-white cursor-pointer';
        } else {
          t.className = 'task-tab px-2.5 py-1 rounded-lg text-slate-400 hover:text-white cursor-pointer';
        }
      });
      renderTasks(filter);
    });
  });

  pomoPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.pomoPreset;
      pomoPresetBtns.forEach(b => {
        if (b === btn) b.className = 'pomo-preset-btn active px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold transition cursor-pointer';
        else b.className = 'pomo-preset-btn px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer';
      });

      if (preset === 'classic') {
        pomodoroEngine.setDurations({ workMins: 25, shortBreakMins: 5, longBreakMins: 15 });
      } else if (preset === 'deep') {
        pomodoroEngine.setDurations({ workMins: 50, shortBreakMins: 10, longBreakMins: 20 });
      }
      updatePomodoroUI(pomodoroEngine.getState());
    });
  });

  pomoPhaseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const phase = btn.dataset.phase;
      pomodoroEngine.startPhase(phase);
    });
  });

  if (btnPomoStartToggle) {
    btnPomoStartToggle.addEventListener('click', () => {
      soundEngine.init();
      if (pomodoroEngine.status === 'idle') {
        pomodoroEngine.startPhase(pomodoroEngine.phase);
      } else {
        pomodoroEngine.togglePause();
      }
    });
  }

  if (btnPomoSkip) {
    btnPomoSkip.addEventListener('click', () => {
      pomodoroEngine.skipPhase();
    });
  }

  if (btnPomoReset) {
    btnPomoReset.addEventListener('click', () => {
      pomodoroEngine.resetSession();
    });
  }

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', handleKeyboardShortcuts);
}

// Start Session Logic (Exam Mode)
function startPracticeSession() {
  soundEngine.init();

  const totalQuestions = inputTotalQuestions ? parseInt(inputTotalQuestions.value, 10) : 50;
  const targetSeconds = inputTargetSeconds ? parseInt(inputTargetSeconds.value, 10) : 90;
  const totalExamMinutes = inputTotalExamMinutes ? parseInt(inputTotalExamMinutes.value, 10) : 75;

  // Save selected settings
  currentSettings.presets[currentPresetKey] = {
    ...currentSettings.presets[currentPresetKey],
    totalQuestions,
    targetSeconds,
    totalExamMinutes
  };
  currentSettings.preset = currentPresetKey;
  if (toggleShowQuestionTimer) currentSettings.showQuestionTimer = toggleShowQuestionTimer.checked;
  if (toggleNotifyOnTimeout) currentSettings.notifyOnTimeout = toggleNotifyOnTimeout.checked;
  if (toggleAutoAdvance) currentSettings.autoAdvanceOnTimeout = toggleAutoAdvance.checked;
  if (toggleCountdownBeep) currentSettings.countdownBeep = toggleCountdownBeep.checked;
  if (toggleVisualFlash) currentSettings.visualFlash = toggleVisualFlash.checked;

  StorageManager.saveSettings(currentSettings);

  showView('active');

  timerEngine.startSession({
    totalQuestions,
    targetSeconds,
    totalExamMinutes,
    autoAdvanceOnTimeout: toggleAutoAdvance ? toggleAutoAdvance.checked : false,
    countdownBeepEnabled: toggleCountdownBeep ? toggleCountdownBeep.checked : true,
  });
}

// Keyboard Shortcut Handler
function handleKeyboardShortcuts(e) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    return;
  }

  if (currentAppMode === 'exam') {
    if (timerEngine.status === 'running' || timerEngine.status === 'paused') {
      // Çözdüm / Sonraki (D tuşu, Sağ Ok, Aşağı Ok, Enter)
      if (e.code === 'KeyD' || e.code === 'ArrowRight' || e.code === 'ArrowDown' || e.code === 'Enter') {
        e.preventDefault();
        soundEngine.playQuestionComplete();
        timerEngine.markSolved();
      } 
      // Boş / Pas (B tuşu)
      else if (e.code === 'KeyB') {
        e.preventDefault();
        soundEngine.playSkipSound();
        timerEngine.markSkipped();
      } 
      // Duraklat / Devam Et (Boşluk tuşu / Space veya P)
      else if (e.code === 'Space' || e.code === 'KeyP') {
        e.preventDefault();
        timerEngine.togglePause();
      } 
      // Sıfırla (R tuşu)
      else if (e.code === 'KeyR') {
        e.preventDefault();
        if (confirm('Testi sıfırlamak istiyor musunuz?')) {
          timerEngine.resetSession();
          showView('setup');
        }
      }
    } else if (views.setup && !views.setup.classList.contains('hidden')) {
      if (e.code === 'Enter') {
        e.preventDefault();
        startPracticeSession();
      }
    }
  } else if (currentAppMode === 'focustodo') {
    if (e.code === 'Space') {
      e.preventDefault();
      if (pomodoroEngine.status === 'idle') {
        pomodoroEngine.startPhase(pomodoroEngine.phase);
      } else {
        pomodoroEngine.togglePause();
      }
    }
  }
}

// Boot App
document.addEventListener('DOMContentLoaded', initApp);
