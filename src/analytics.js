// Real Analytics & Statistics Engine for TempoKoç
import { AuthManager } from './auth.js';
import { StorageManager } from './storage.js';
import Chart from 'chart.js/auto';

export class AnalyticsManager {
  static trendChartInstance = null;
  static subjectChartInstance = null;
  static currentPeriod = 'weekly';

  static init() {
    this.bindEvents();
  }

  static bindEvents() {
    // Period tab buttons
    document.querySelectorAll('.analytics-period-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.analytics-period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentPeriod = btn.getAttribute('data-period') || 'weekly';
        this.render();
      });
    });

    // Guest Auth CTA buttons
    const btnGuestLogin = document.getElementById('btn-analytics-guest-login');
    if (btnGuestLogin) {
      btnGuestLogin.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
      });
    }

    const btnGuestRegister = document.getElementById('btn-analytics-guest-register');
    if (btnGuestRegister) {
      btnGuestRegister.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'register' } }));
      });
    }

    // Export Data Button
    const btnExport = document.getElementById('btn-analytics-export');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportUserData());
    }

    // Clear Data Button
    const btnClearData = document.getElementById('btn-analytics-clear');
    if (btnClearData) {
      btnClearData.addEventListener('click', () => this.clearUserData());
    }
  }

  static render() {
    const guestBanner = document.getElementById('analytics-guest-overlay');
    const contentWrapper = document.getElementById('analytics-content-wrapper');

    const isLoggedIn = AuthManager.isLoggedIn();

    if (!isLoggedIn) {
      if (guestBanner) guestBanner.style.display = 'flex';
      if (contentWrapper) contentWrapper.classList.add('analytics-blurred');
      this.renderGuestPreview();
      return;
    }

    if (guestBanner) guestBanner.style.display = 'none';
    if (contentWrapper) contentWrapper.classList.remove('analytics-blurred');

    const logs = StorageManager.getStudyLogs();
    const streak = StorageManager.getStreakCount();
    const history = StorageManager.getHistory();

    // Summary Statistics Cards
    this.updateSummaryCards(logs, streak, history);

    // Render Charts
    this.renderTrendChart();
    this.renderSubjectChart();

    // Render Activity Table
    this.renderActivityTable(logs);
  }

  static updateSummaryCards(logs, streak, history) {
    let totalSec = 0;
    let pomoCount = 0;

    logs.forEach(l => {
      totalSec += l.durationSec || 0;
      if (l.type === 'pomodoro') pomoCount++;
    });

    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);

    const elHours = document.getElementById('stat-total-hours');
    if (elHours) elHours.textContent = hours > 0 ? `${hours} sa ${mins} dk` : `${mins} dk`;

    const elPomo = document.getElementById('stat-total-pomo');
    if (elPomo) elPomo.textContent = pomoCount.toString();

    const elStreak = document.getElementById('stat-streak');
    if (elStreak) elStreak.textContent = `${streak} Gün`;

    const elExams = document.getElementById('stat-total-exams');
    if (elExams) elExams.textContent = history.length.toString();
  }

  static renderTrendChart() {
    const ctx = document.getElementById('chart-analytics-trend');
    if (!ctx) return;

    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
    }

    let labels = [];
    let dataValues = [];

    if (this.currentPeriod === 'daily') {
      const today = StorageManager.getDailyAnalytics();
      labels = ['Bugün'];
      dataValues = [Math.round(today.totalSec / 60)];
    } else if (this.currentPeriod === 'weekly') {
      const weekly = StorageManager.getWeeklyAnalytics();
      labels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
      dataValues = weekly.dailyTotals.map(sec => Math.round(sec / 60));
    } else if (this.currentPeriod === 'monthly') {
      const monthly = StorageManager.getMonthlyAnalytics();
      labels = Array.from({ length: monthly.daysInMonth }, (_, i) => `${i + 1}`);
      dataValues = monthly.dailyTotals.map(sec => Math.round(sec / 60));
    }

    this.trendChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Odaklanma Süresi (Dakika)',
          data: dataValues,
          backgroundColor: 'rgba(99, 102, 241, 0.75)',
          borderColor: '#6366f1',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: '#818cf8',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.raw} Dakika Odaklanıldı`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' },
            beginAtZero: true
          }
        }
      }
    });
  }

  static renderSubjectChart() {
    const ctx = document.getElementById('chart-analytics-subject');
    if (!ctx) return;

    if (this.subjectChartInstance) {
      this.subjectChartInstance.destroy();
    }

    const logs = StorageManager.getStudyLogs();
    const subjectMap = {};

    logs.forEach(l => {
      const subj = l.subject || 'Genel';
      subjectMap[subj] = (subjectMap[subj] || 0) + l.durationSec;
    });

    const labels = Object.keys(subjectMap);
    const dataValues = Object.values(subjectMap).map(sec => Math.round(sec / 60));

    if (labels.length === 0) {
      labels.push('Veri Yok');
      dataValues.push(1);
    }

    const colors = [
      '#6366f1', '#ec4899', '#10b981', '#f59e0b', 
      '#06b6d4', '#8b5cf6', '#3b82f6', '#f43f5e'
    ];

    this.subjectChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: dataValues,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#1e293b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#cbd5e1', padding: 12, usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw} Dk`
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  static renderActivityTable(logs) {
    const tbody = document.getElementById('analytics-activity-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-6 text-slate-400">
            Henüz çalışma kaydı bulunmuyor. Pomodoro veya Sınav sayacını kullanarak verilerinizi oluşturun!
          </td>
        </tr>
      `;
      return;
    }

    logs.slice(0, 15).forEach(l => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors';

      const dateStr = new Date(l.timestamp).toLocaleDateString('tr-TR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      });

      const mins = Math.round((l.durationSec || 0) / 60);

      const typeBadge = l.type === 'exam' 
        ? '<span class="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Sınav</span>'
        : '<span class="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Pomodoro</span>';

      tr.innerHTML = `
        <td class="py-3 px-4 text-xs text-slate-400">${dateStr}</td>
        <td class="py-3 px-4 font-medium text-slate-200">${l.taskTitle || l.subject}</td>
        <td class="py-3 px-4 text-sm font-semibold text-emerald-400">${mins} Dk</td>
        <td class="py-3 px-4">${typeBadge}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  static renderGuestPreview() {
    // Show mock numbers on guest view for stunning locked visual preview
    const elHours = document.getElementById('stat-total-hours');
    if (elHours) elHours.textContent = '14 sa 30 dk';

    const elPomo = document.getElementById('stat-total-pomo');
    if (elPomo) elPomo.textContent = '32';

    const elStreak = document.getElementById('stat-streak');
    if (elStreak) elStreak.textContent = '5 Gün';

    const elExams = document.getElementById('stat-total-exams');
    if (elExams) elExams.textContent = '4';

    // Mock trend chart for preview background
    const ctx = document.getElementById('chart-analytics-trend');
    if (ctx && !this.trendChartInstance) {
      this.trendChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
          datasets: [{
            data: [120, 150, 90, 180, 210, 140, 160],
            backgroundColor: 'rgba(99, 102, 241, 0.4)',
            borderRadius: 8
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    }

    // Mock subject chart for preview background
    const ctxSubj = document.getElementById('chart-analytics-subject');
    if (ctxSubj && !this.subjectChartInstance) {
      this.subjectChartInstance = new Chart(ctxSubj, {
        type: 'doughnut',
        data: {
          labels: ['Matematik', 'Türkçe', 'Fen', 'İngilizce'],
          datasets: [{
            data: [40, 30, 20, 10],
            backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    }
  }

  static exportUserData() {
    if (!AuthManager.isLoggedIn()) return;
    const user = AuthManager.getCurrentUser();
    const data = {
      user,
      tasks: StorageManager.getTasks(),
      studyLogs: StorageManager.getStudyLogs(),
      history: StorageManager.getHistory(),
      settings: StorageManager.getSettings(),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tempokoc_analiz_verileri_${user.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static clearUserData() {
    if (!AuthManager.isLoggedIn()) return;
    if (confirm('Tüm çalışma geçmişiniz ve istatistikleriniz silinecektir. Emin misiniz?')) {
      StorageManager.clearHistory();
      localStorage.removeItem(StorageManager.getKey('tempokoc_study_logs_v1'));
      localStorage.removeItem(StorageManager.getKey('tempokoc_daily_stats_v1'));
      this.render();
      alert('Analiz verileriniz temizlendi.');
    }
  }
}
