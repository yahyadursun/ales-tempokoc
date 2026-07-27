// LocalStorage Management for TempoKoç (Sınav Pacer & Focus To-Do)

const STORAGE_KEYS = {
  SETTINGS: 'ales_pacer_settings_v2',
  HISTORY: 'ales_pacer_history_v2',
  TASKS: 'tempokoc_tasks_v1',
  POMODORO_SETTINGS: 'tempokoc_pomodoro_settings_v1',
  DAILY_STATS: 'tempokoc_daily_stats_v1',
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

const DEFAULT_POMODORO_SETTINGS = {
  workMins: 25,
  shortBreakMins: 5,
  longBreakMins: 15,
  autoStartBreaks: true,
  autoStartPomodoros: false,
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

  // --- EXAM HISTORY ---
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
      history.unshift(newSession);
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

  // --- FOCUS TO-DO TASKS ---
  static getTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        // Initial sample tasks for user
        const sampleTasks = [
          { id: 'task_1', title: 'Matematik - Üslü Sayılar 30 Soru', subject: 'Matematik', estPomodoros: 2, donePomodoros: 1, completed: false },
          { id: 'task_2', title: 'Paragraf Çözümü (ALES Sözel)', subject: 'Türkçe', estPomodoros: 3, donePomodoros: 3, completed: true },
          { id: 'task_3', title: 'İngilizce Kelime Ezberi (YDS/YÖKDİL)', subject: 'İngilizce', estPomodoros: 2, donePomodoros: 0, completed: false },
        ];
        this.saveTasks(sampleTasks);
        return sampleTasks;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to load tasks:', e);
      return [];
    }
  }

  static saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  }

  static addTask(taskData) {
    const tasks = this.getTasks();
    const newTask = {
      id: 'task_' + Date.now(),
      title: taskData.title,
      subject: taskData.subject || 'Genel',
      estPomodoros: taskData.estPomodoros || 1,
      donePomodoros: 0,
      completed: false,
      createdAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  static toggleTask(taskId) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks(tasks);
    }
    return tasks;
  }

  static deleteTask(taskId) {
    const tasks = this.getTasks().filter(t => t.id !== taskId);
    this.saveTasks(tasks);
    return tasks;
  }

  static incrementTaskPomodoro(taskId) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.donePomodoros = (task.donePomodoros || 0) + 1;
      if (task.donePomodoros >= task.estPomodoros) {
        task.completed = true;
      }
      this.saveTasks(tasks);
    }
    return tasks;
  }

  // --- POMODORO SETTINGS & DAILY STATS ---
  static getPomodoroSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POMODORO_SETTINGS);
      return data ? { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(data) } : DEFAULT_POMODORO_SETTINGS;
    } catch (e) {
      return DEFAULT_POMODORO_SETTINGS;
    }
  }

  static savePomodoroSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save pomodoro settings:', e);
    }
  }

  static getDailyStats() {
    const todayKey = new Date().toISOString().split('T')[0];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
      const allStats = data ? JSON.parse(data) : {};
      return allStats[todayKey] || { date: todayKey, totalWorkSec: 0, pomodorosDone: 0 };
    } catch (e) {
      return { date: todayKey, totalWorkSec: 0, pomodorosDone: 0 };
    }
  }

  static recordFocusTime(workSeconds) {
    const todayKey = new Date().toISOString().split('T')[0];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
      const allStats = data ? JSON.parse(data) : {};
      const current = allStats[todayKey] || { date: todayKey, totalWorkSec: 0, pomodorosDone: 0 };
      
      current.totalWorkSec += workSeconds;
      current.pomodorosDone += 1;
      allStats[todayKey] = current;

      localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(allStats));
      return current;
    } catch (e) {
      console.error('Failed to record focus time:', e);
      return null;
    }
  }
}
