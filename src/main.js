// TempoKoç — Main Controller & Twin Timers Engine
import { soundEngine } from './audio.js';
import { StorageManager } from './storage.js';
import { TimerEngine } from './timer.js';
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

// DOM Element References (Safe getters)
const views = {
  setup: document.getElementById('view-setup'),
  active: document.getElementById('view-active'),
  results: document.getElementById('view-results'),
};

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

// Setup Inputs
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

// Instance Variables
const timerEngine = new TimerEngine();
let currentSettings = StorageManager.getSettings();
let currentPresetKey = 'sayisal';
let resultsChartInstance = null;

// Initialization
function initApp() {
  applyLoadedSettings();
  setupTimerCallbacks();
  bindEvents();
  renderHistoryList();

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

  // Set active preset
  selectPreset(currentSettings.preset || 'sayisal');
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

// Timer Engine Callbacks Setup
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
    if (state.isOvertime) badgeOvertimeLive.classList.remove('hidden');
    else badgeOvertimeLive.classList.add('hidden');
  }

  if (overtimeBanner) {
    if (state.isOvertime) overtimeBanner.classList.remove('hidden');
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

  // Render Table Rows
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

// Render Interactive Chart.js Visualization
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
          <button data-delete-id="${item.id}" class="btn-delete-history text-slate-500 hover:text-rose-400 p-1.5 transition" title="Sil">🗑️</button>
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

  // Start Session Button
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

  // Active View Actions
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
      if (timerEngine.status === 'running' || timerEngine.status === 'paused') {
        if (!confirm('Devam eden testiniz var. Ana ekrana dönmek istediğinize emin misiniz?')) return;
        timerEngine.resetSession();
      }
      showView('setup');
    });
  }

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', handleKeyboardShortcuts);
}

// Start Session Logic
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

  if (timerEngine.status === 'running' || timerEngine.status === 'paused') {
    if (e.code === 'Space') {
      e.preventDefault();
      soundEngine.playQuestionComplete();
      timerEngine.markSolved();
    } else if (e.code === 'KeyB') {
      e.preventDefault();
      soundEngine.playSkipSound();
      timerEngine.markSkipped();
    } else if (e.code === 'KeyP') {
      e.preventDefault();
      timerEngine.togglePause();
    } else if (e.code === 'KeyR') {
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
}

// Boot App
document.addEventListener('DOMContentLoaded', initApp);
