// TempoKoç — Pomodoro Focus Engine

export class PomodoroEngine {
  constructor() {
    this.status = 'idle'; // 'idle', 'running', 'paused', 'break'
    this.phase = 'work'; // 'work', 'shortBreak', 'longBreak'
    
    // Default Durations in seconds
    this.durations = {
      work: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60,
    };
    
    this.completedWorkCycles = 0;
    this.longBreakInterval = 4; // Long break after 4 work sessions
    this.remainingSeconds = this.durations.work;
    this.elapsedSecondsInPhase = 0;
    this.activeTask = null; // Currently selected task object

    this.timerInterval = null;
    this.lastTickTime = null;
    this.callbacks = {};
  }

  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  setDurations({ workMins = 25, shortBreakMins = 5, longBreakMins = 15 }) {
    this.durations.work = workMins * 60;
    this.durations.shortBreak = shortBreakMins * 60;
    this.durations.longBreak = longBreakMins * 60;
    
    if (this.status === 'idle') {
      this.remainingSeconds = this.durations[this.phase];
    }
  }

  setActiveTask(task) {
    this.activeTask = task;
    if (this.callbacks.onTaskChange) {
      this.callbacks.onTaskChange(this.activeTask);
    }
  }

  startPhase(phaseName = 'work') {
    this.phase = phaseName;
    this.remainingSeconds = this.durations[phaseName];
    this.elapsedSecondsInPhase = 0;
    this.status = 'running';
    this.lastTickTime = performance.now();

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => this.tick(), 1000);
    this.emitState();
  }

  togglePause() {
    if (this.status === 'running') {
      this.status = 'paused';
      if (this.timerInterval) clearInterval(this.timerInterval);
    } else if (this.status === 'paused') {
      this.status = 'running';
      this.lastTickTime = performance.now();
      this.timerInterval = setInterval(() => this.tick(), 1000);
    }
    this.emitState();
  }

  skipPhase() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.phase === 'work') {
      // Completed a work phase
      this.completedWorkCycles++;
      if (this.callbacks.onWorkComplete) {
        this.callbacks.onWorkComplete(this.durations.work, this.activeTask);
      }
      const nextPhase = (this.completedWorkCycles % this.longBreakInterval === 0) ? 'longBreak' : 'shortBreak';
      this.startPhase(nextPhase);
    } else {
      // Completed break phase -> back to work
      this.startPhase('work');
    }
  }

  resetSession() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.status = 'idle';
    this.phase = 'work';
    this.remainingSeconds = this.durations.work;
    this.elapsedSecondsInPhase = 0;
    this.emitState();
  }

  tick() {
    if (this.status !== 'running') return;

    const now = performance.now();
    const deltaSec = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    this.remainingSeconds -= deltaSec;
    this.elapsedSecondsInPhase += deltaSec;

    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = 0;
      this.onPhaseEnded();
    } else {
      this.emitState();
    }
  }

  onPhaseEnded() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (this.phase === 'work') {
      this.completedWorkCycles++;
      if (this.callbacks.onWorkComplete) {
        this.callbacks.onWorkComplete(this.durations.work, this.activeTask);
      }
      const nextPhase = (this.completedWorkCycles % this.longBreakInterval === 0) ? 'longBreak' : 'shortBreak';
      this.status = 'idle';
      this.phase = nextPhase;
      this.remainingSeconds = this.durations[nextPhase];
      if (this.callbacks.onPhaseFinish) {
        this.callbacks.onPhaseFinish('work', nextPhase);
      }
    } else {
      this.status = 'idle';
      this.phase = 'work';
      this.remainingSeconds = this.durations.work;
      if (this.callbacks.onPhaseFinish) {
        this.callbacks.onPhaseFinish('break', 'work');
      }
    }
    this.emitState();
  }

  getState() {
    const targetDuration = this.durations[this.phase] || 1500;
    const progressPercent = Math.min(100, (this.elapsedSecondsInPhase / targetDuration) * 100);

    return {
      status: this.status,
      phase: this.phase,
      remainingSeconds: Math.ceil(this.remainingSeconds),
      targetDuration,
      progressPercent,
      completedWorkCycles: this.completedWorkCycles,
      activeTask: this.activeTask
    };
  }

  emitState() {
    if (this.callbacks.onTick) {
      this.callbacks.onTick(this.getState());
    }
  }
}
