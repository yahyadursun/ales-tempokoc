// LocalStorage Management for ALES TempoKoç

const STORAGE_KEYS = {
  SETTINGS: 'ales_pacer_settings_v1',
  HISTORY: 'ales_pacer_history_v1',
};

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  soundVolume: 0.8,
  soundType: 'chime', // 'chime', 'bell', 'beep', 'digital'
  countdownBeep: true, // Beep during final 5 seconds
  visualFlash: true, // Flash screen on timeout
  autoAdvanceOnTimeout: false, // Wait for user or auto-advance
  autoAdvanceDelay: 1.5, // seconds delay before auto-advance
  preset: 'sayisal',
  presets: {
    sayisal: { name: 'ALES Sayısal', totalQuestions: 50, targetSeconds: 90 },
    sozel: { name: 'ALES Sözel', totalQuestions: 50, targetSeconds: 60 },
    esit_agirlik: { name: 'ALES Eşit Ağırlık', totalQuestions: 50, targetSeconds: 75 },
    custom: { name: 'Özel Deneme / Pratik', totalQuestions: 20, targetSeconds: 60 },
  }
};

export class StorageManager {
  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...parsed, presets: { ...DEFAULT_SETTINGS.presets, ...parsed.presets } };
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
