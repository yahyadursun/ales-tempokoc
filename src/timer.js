// ALES & YÖK Sınavları Question Pacer & Genel Sınav Kronometresi Engine

export class TimerEngine {
  constructor() {
    this.status = 'idle'; // 'idle' | 'running' | 'paused' | 'finished'
    this.totalQuestions = 50;
    this.targetSeconds = 90;
    this.totalExamMinutes = 75;
    this.currentQuestionIndex = 0;
    
    this.currentQuestionElapsed = 0;
    this.sessionTotalElapsed = 0;
    
    this.autoAdvanceOnTimeout = false;
    this.autoAdvanceDelay = 1.5;
    this.countdownBeepEnabled = true;

    this.questionLogs = [];
    
    this.intervalId = null;
    this.lastTickTime = 0;
    
    // Callbacks
    this.callbacks = {
      onTick: null,
      onTimeout: null,
      onCountdownTick: null,
      onQuestionChange: null,
      onFinish: null,
    };

    this.lastPlayedCountdownSec = -1;
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  startSession(config = {}) {
    this.totalQuestions = config.totalQuestions || 50;
    this.targetSeconds = config.targetSeconds || 90;
    this.totalExamMinutes = config.totalExamMinutes || Math.ceil((this.totalQuestions * this.targetSeconds) / 60);
    this.autoAdvanceOnTimeout = config.autoAdvanceOnTimeout ?? false;
    this.autoAdvanceDelay = config.autoAdvanceDelay || 1.5;
    this.countdownBeepEnabled = config.countdownBeepEnabled ?? true;

    this.currentQuestionIndex = 0;
    this.currentQuestionElapsed = 0;
    this.sessionTotalElapsed = 0;
    this.questionLogs = [];
    this.lastPlayedCountdownSec = -1;

    this.status = 'running';
    this.lastTickTime = performance.now();

    this.clearTimer();
    this.intervalId = setInterval(() => this.tick(), 100);

    if (this.callbacks.onQuestionChange) {
      this.callbacks.onQuestionChange(this.getState());
    }
  }

  pause() {
    if (this.status === 'running') {
      this.status = 'paused';
      this.clearTimer();
      if (this.callbacks.onTick) this.callbacks.onTick(this.getState());
    }
  }

  resume() {
    if (this.status === 'paused') {
      this.status = 'running';
      this.lastTickTime = performance.now();
      this.clearTimer();
      this.intervalId = setInterval(() => this.tick(), 100);
      if (this.callbacks.onTick) this.callbacks.onTick(this.getState());
    }
  }

  togglePause() {
    if (this.status === 'running') {
      this.pause();
    } else if (this.status === 'paused') {
      this.resume();
    }
  }

  clearTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick() {
    if (this.status !== 'running') return;

    const now = performance.now();
    const deltaSeconds = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    this.currentQuestionElapsed += deltaSeconds;
    this.sessionTotalElapsed += deltaSeconds;

    const remaining = Math.max(0, this.targetSeconds - this.currentQuestionElapsed);
    const roundedRemaining = Math.ceil(remaining);

    // Countdown tick on last 5 seconds (5, 4, 3, 2, 1)
    if (
      this.countdownBeepEnabled &&
      roundedRemaining <= 5 &&
      roundedRemaining > 0 &&
      roundedRemaining !== this.lastPlayedCountdownSec
    ) {
      this.lastPlayedCountdownSec = roundedRemaining;
      if (this.callbacks.onCountdownTick) {
        this.callbacks.onCountdownTick(roundedRemaining);
      }
    }

    // Check question timeout
    if (this.currentQuestionElapsed >= this.targetSeconds && !this.timeoutTriggeredCurrentQuestion) {
      this.timeoutTriggeredCurrentQuestion = true;
      if (this.callbacks.onTimeout) {
        this.callbacks.onTimeout(this.getState());
      }

      if (this.autoAdvanceOnTimeout) {
        // Log timeout and automatically advance
        this.logCurrentQuestion('timeout');
        this.nextQuestion();
      }
    }

    if (this.callbacks.onTick) {
      this.callbacks.onTick(this.getState());
    }
  }

  logCurrentQuestion(status) {
    this.questionLogs[this.currentQuestionIndex] = {
      questionNum: this.currentQuestionIndex + 1,
      targetSeconds: this.targetSeconds,
      actualSeconds: parseFloat(this.currentQuestionElapsed.toFixed(1)),
      status: status, // 'solved' | 'skipped' | 'timeout'
      delta: parseFloat((this.currentQuestionElapsed - this.targetSeconds).toFixed(1)),
    };
  }

  markSolved() {
    if (this.status !== 'running' && this.status !== 'paused') return;
    const status = (this.currentQuestionElapsed > this.targetSeconds) ? 'timeout' : 'solved';
    this.logCurrentQuestion(status);
    this.nextQuestion();
  }

  markSkipped() {
    if (this.status !== 'running' && this.status !== 'paused') return;
    this.logCurrentQuestion('skipped');
    this.nextQuestion();
  }

  nextQuestion() {
    if (this.currentQuestionIndex + 1 >= this.totalQuestions) {
      this.finishSession();
    } else {
      this.currentQuestionIndex++;
      this.currentQuestionElapsed = 0;
      this.timeoutTriggeredCurrentQuestion = false;
      this.lastPlayedCountdownSec = -1;
      this.lastTickTime = performance.now();

      if (this.callbacks.onQuestionChange) {
        this.callbacks.onQuestionChange(this.getState());
      }
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      const prevLog = this.questionLogs[this.currentQuestionIndex];
      this.currentQuestionElapsed = prevLog ? prevLog.actualSeconds : 0;
      this.timeoutTriggeredCurrentQuestion = false;
      this.lastPlayedCountdownSec = -1;
      this.lastTickTime = performance.now();

      if (this.callbacks.onQuestionChange) {
        this.callbacks.onQuestionChange(this.getState());
      }
    }
  }

  finishSession() {
    this.clearTimer();
    this.status = 'finished';

    const solvedCount = this.questionLogs.filter(q => q.status === 'solved').length;
    const skippedCount = this.questionLogs.filter(q => q.status === 'skipped').length;
    const timeoutCount = this.questionLogs.filter(q => q.status === 'timeout').length;
    
    const totalSolvedActualSecs = this.questionLogs.reduce((acc, q) => acc + q.actualSeconds, 0);
    const totalOvertimeSeconds = this.questionLogs.reduce((acc, q) => acc + Math.max(0, q.delta), 0);
    const avgTimePerQuestion = this.questionLogs.length ? (totalSolvedActualSecs / this.questionLogs.length).toFixed(1) : 0;
    
    const totalExamSeconds = this.totalExamMinutes * 60;
    const paceVariance = (this.sessionTotalElapsed - (this.questionLogs.length * this.targetSeconds)).toFixed(1);
    const totalExamOvertimeSec = Math.max(0, this.sessionTotalElapsed - totalExamSeconds);

    const report = {
      totalQuestions: this.totalQuestions,
      questionsAttempted: this.questionLogs.length,
      targetSeconds: this.targetSeconds,
      totalExamMinutes: this.totalExamMinutes,
      totalExamSeconds,
      sessionTotalElapsed: parseFloat(this.sessionTotalElapsed.toFixed(1)),
      solvedCount,
      skippedCount,
      timeoutCount,
      totalOvertimeSeconds: parseFloat(totalOvertimeSeconds.toFixed(1)),
      totalExamOvertimeSec: parseFloat(totalExamOvertimeSec.toFixed(1)),
      avgTimePerQuestion: parseFloat(avgTimePerQuestion),
      paceVariance: parseFloat(paceVariance),
      questionLogs: [...this.questionLogs],
    };

    if (this.callbacks.onFinish) {
      this.callbacks.onFinish(report);
    }
  }

  resetSession() {
    this.clearTimer();
    this.status = 'idle';
    this.currentQuestionIndex = 0;
    this.currentQuestionElapsed = 0;
    this.sessionTotalElapsed = 0;
    this.questionLogs = [];
    this.timeoutTriggeredCurrentQuestion = false;
    this.lastPlayedCountdownSec = -1;
  }

  getState() {
    const remainingSeconds = Math.max(0, this.targetSeconds - this.currentQuestionElapsed);
    const overtimeSeconds = Math.max(0, this.currentQuestionElapsed - this.targetSeconds);
    const progressPercent = Math.min(100, (this.currentQuestionElapsed / this.targetSeconds) * 100);
    
    const totalExamSeconds = this.totalExamMinutes * 60;
    const totalExamRemainingSeconds = Math.max(0, totalExamSeconds - this.sessionTotalElapsed);
    const totalExamOvertimeSeconds = Math.max(0, this.sessionTotalElapsed - totalExamSeconds);
    const totalExamProgressPercent = Math.min(100, (this.sessionTotalElapsed / totalExamSeconds) * 100);

    // Total pace calculation (Are we ahead or behind cumulative target?)
    const expectedElapsed = (this.currentQuestionIndex) * this.targetSeconds;
    const currentLoggedElapsed = this.questionLogs.reduce((acc, q) => acc + q.actualSeconds, 0);
    const totalPaceDiff = currentLoggedElapsed - expectedElapsed; // negative = ahead (good), positive = behind

    return {
      status: this.status,
      currentQuestionNum: this.currentQuestionIndex + 1,
      totalQuestions: this.totalQuestions,
      targetSeconds: this.targetSeconds,
      totalExamMinutes: this.totalExamMinutes,
      totalExamSeconds,
      totalExamRemainingSeconds: parseFloat(totalExamRemainingSeconds.toFixed(1)),
      totalExamOvertimeSeconds: parseFloat(totalExamOvertimeSeconds.toFixed(1)),
      totalExamProgressPercent: parseFloat(totalExamProgressPercent.toFixed(1)),
      isTotalExamOvertime: this.sessionTotalElapsed > totalExamSeconds,
      currentQuestionElapsed: parseFloat(this.currentQuestionElapsed.toFixed(1)),
      remainingSeconds: parseFloat(remainingSeconds.toFixed(1)),
      overtimeSeconds: parseFloat(overtimeSeconds.toFixed(1)),
      progressPercent: parseFloat(progressPercent.toFixed(1)),
      sessionTotalElapsed: parseFloat(this.sessionTotalElapsed.toFixed(1)),
      totalPaceDiff: parseFloat(totalPaceDiff.toFixed(1)),
      isOvertime: this.currentQuestionElapsed > this.targetSeconds,
      logs: [...this.questionLogs]
    };
  }
}
