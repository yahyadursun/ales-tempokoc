// LocalStorage Management for ALES & YÖK Sınavları TempoKoç

const STORAGE_KEYS = {
  SETTINGS: 'ales_pacer_settings_v2',
  HISTORY: 'ales_pacer_history_v2',
};

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  soundVolume: 0.8,
  soundType: 'chime', // 'chime', 'bell', 'beep', 'digital'
  countdownBeep: true, // Beep during final 5 seconds
  visualFlash: true, // Flash screen on timeout
  showQuestionTimer: true, // Show or hide per-question timer display (Gizli Mod)
  notifyOnTimeout: true, // Trigger sound & visual alerts when question time expires
  autoAdvanceOnTimeout: false, // Wait for user or auto-advance
  autoAdvanceDelay: 1.5, // seconds delay before auto-advance
  preset: 'sayisal',
  presets: {
    sayisal: { name: 'ALES Sayısal', totalQuestions: 50, targetSeconds: 90, totalExamMinutes: 75, category: 'ALES', desc: '50 Soru | 75 Dk Toplam Sınav' },
    sozel: { name: 'ALES Sözel', totalQuestions: 50, targetSeconds: 60, totalExamMinutes: 75, category: 'ALES', desc: '50 Soru | 75 Dk Toplam Sınav' },
    esit_agirlik: { name: 'ALES Tam Deneme', totalQuestions: 100, targetSeconds: 90, totalExamMinutes: 150, category: 'ALES', desc: '100 Soru | 150 Dk (2.5 Saat)' },
    yds: { name: 'YDS (Yabancı Dil Sınavı)', totalQuestions: 80, targetSeconds: 135, totalExamMinutes: 180, category: 'YÖK Dil', desc: '80 Soru | 180 Dk (3 Saat)' },
    yokdil: { name: 'YÖKDİL', totalQuestions: 80, targetSeconds: 135, totalExamMinutes: 180, category: 'YÖK Dil', desc: '80 Soru | 180 Dk (3 Saat)' },
    tus: { name: 'TUS (Tıpta Uzmanlık)', totalQuestions: 100, targetSeconds: 81, totalExamMinutes: 135, category: 'Sağlık', desc: '100 Soru | 135 Dk Oturum' },
    dus: { name: 'DUS (Diş Hekimliği Uzmanlık)', totalQuestions: 120, targetSeconds: 75, totalExamMinutes: 150, category: 'Sağlık', desc: '120 Soru | 150 Dk Oturum' },
    yks_tyt: { name: 'YKS - TYT', totalQuestions: 120, targetSeconds: 83, totalExamMinutes: 165, category: 'YKS', desc: '120 Soru | 165 Dk (2 Sa 45 Dk)' },
    custom: { name: 'Özel Mod / Serbest', totalQuestions: 20, targetSeconds: 60, totalExamMinutes: 30, category: 'Özel', desc: 'Özelleştirilebilir Sınav' },
  }
};

export class StorageManager {
  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed, 
        presets: { ...DEFAULT_SETTINGS.presets, ...parsed.presets } 
      };
    } catch (e) {
      console.warn('Failed to load settings:', e);
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  static getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load history:', e);
      return [];
    }
  }

  static saveSession(sessionData) {
    try {
      const history = this.getHistory();
      const newSession = {
        id: 'sess_' + Date.now(),
        date: new Date().toISOString(),
        ...sessionData
      };
      history.unshift(newSession); // Add newest first
      // Keep up to 100 sessions
      if (history.length > 100) history.pop();
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      return newSession;
    } catch (e) {
      console.error('Failed to save session:', e);
      return null;
    }
  }

  static deleteSession(sessionId) {
    try {
      const history = this.getHistory().filter(s => s.id !== sessionId);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  }

  static clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  }
}
