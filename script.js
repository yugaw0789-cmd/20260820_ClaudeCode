(() => {
  'use strict';

  const display = document.getElementById('display');
  const status = document.getElementById('status');
  const ring = document.querySelector('.ring-fg');
  const startPauseBtn = document.getElementById('startPause');
  const resetBtn = document.getElementById('reset');
  const inputs = {
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
  };
  const modeTabs = document.querySelectorAll('.mode-tab');
  const panels = document.querySelectorAll('.mode-panel');
  const stopwatchDisplay = document.getElementById('stopwatchDisplay');
  const stopwatchStatus = document.getElementById('stopwatchStatus');
  const stopwatchStartPauseBtn = document.getElementById('stopwatchStartPause');
  const stopwatchLapBtn = document.getElementById('stopwatchLap');
  const stopwatchResetBtn = document.getElementById('stopwatchReset');
  const laps = document.getElementById('laps');
  const clockDisplay = document.getElementById('clockDisplay');
  const clockDate = document.getElementById('clockDate');

  const CIRCUMFERENCE = 2 * Math.PI * 92;
  ring.style.strokeDasharray = CIRCUMFERENCE;

  let totalMs = 0;      // 設定された合計時間
  let remainingMs = 0;  // 残り時間
  let deadline = 0;     // 動作中の終了時刻 (performance.now 基準)
  let timerId = null;
  let running = false;
  let activeMode = 'timer';
  let stopwatchElapsedMs = 0;
  let stopwatchStartedAt = 0;
  let stopwatchTimerId = null;
  let stopwatchRunning = false;
  let lapCount = 0;
  let clockTimerId = null;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function readInputs() {
    const h = clamp(parseInt(inputs.hours.value, 10) || 0, 0, 99);
    const m = clamp(parseInt(inputs.minutes.value, 10) || 0, 0, 59);
    const s = clamp(parseInt(inputs.seconds.value, 10) || 0, 0, 59);
    inputs.hours.value = h;
    inputs.minutes.value = m;
    inputs.seconds.value = s;
    return (h * 3600 + m * 60 + s) * 1000;
  }

  function writeInputs(ms) {
    const total = Math.round(ms / 1000);
    inputs.hours.value = Math.floor(total / 3600);
    inputs.minutes.value = Math.floor((total % 3600) / 60);
    inputs.seconds.value = total % 60;
  }

  function format(ms) {
    const total = Math.ceil(Math.max(0, ms) / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  function render() {
    const text = format(remainingMs);
    display.textContent = text;
    display.classList.toggle('is-long', text.length > 5);
    if (activeMode === 'timer') {
      document.title = running ? `${text} - シンプルタイマー` : 'シンプルタイマー';
    }
    const ratio = totalMs > 0 ? clamp(remainingMs / totalMs, 0, 1) : 0;
    ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - ratio);
  }

  function setStatus(text) {
    status.textContent = text;
  }

  function setInputsDisabled(disabled) {
    Object.values(inputs).forEach((el) => { el.disabled = disabled; });
  }

  function stopTicking() {
    clearInterval(timerId);
    timerId = null;
  }

  // setInterval はタブが非表示だと間引かれるが、終了時刻を基準にしているので
  // 復帰時に正しい残り時間へ追いつく。
  function tick() {
    remainingMs = deadline - performance.now();
    if (remainingMs <= 0) {
      remainingMs = 0;
      finish();
      return;
    }
    render();
  }

  function start() {
    if (running) return;
    if (remainingMs <= 0) {
      totalMs = readInputs();
      remainingMs = totalMs;
    }
    if (remainingMs <= 0) {
      setStatus('時間を設定してください');
      return;
    }
    document.body.classList.remove('finished');
    running = true;
    deadline = performance.now() + remainingMs;
    startPauseBtn.textContent = '一時停止';
    setStatus('カウントダウン中');
    setInputsDisabled(true);
    stopTicking();
    timerId = setInterval(tick, 100);
  }

  function pause() {
    if (!running) return;
    stopTicking();
    remainingMs = Math.max(0, deadline - performance.now());
    running = false;
    startPauseBtn.textContent = '再開';
    setStatus('一時停止中');
    render();
  }

  function finish() {
    stopTicking();
    running = false;
    startPauseBtn.textContent = 'スタート';
    setStatus('終了しました');
    setInputsDisabled(false);
    document.body.classList.add('finished');
    render();
    document.title = '⏰ 時間です - シンプルタイマー';
    beep();
  }

  function reset() {
    stopTicking();
    running = false;
    document.body.classList.remove('finished');
    totalMs = readInputs();
    remainingMs = totalMs;
    startPauseBtn.textContent = 'スタート';
    setStatus('停止中');
    setInputsDisabled(false);
    render();
  }

  // 終了音（外部ファイル不要の短いビープを3回）
  function beep() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      const ctx = new Ctx();
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const at = now + i * 0.45;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 0.4);
      }
      setTimeout(() => ctx.close(), 2000);
    } catch (_) {
      /* 音が鳴らせない環境では無視 */
    }
  }

  function formatStopwatch(ms) {
    const centiseconds = Math.floor(ms / 10) % 100;
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000) % 60;
    const hours = Math.floor(ms / 3600000);
    const pad = (n) => String(n).padStart(2, '0');
    return hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`
      : `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  }

  function stopwatchCurrentMs() {
    return stopwatchRunning
      ? stopwatchElapsedMs + performance.now() - stopwatchStartedAt
      : stopwatchElapsedMs;
  }

  function renderStopwatch() {
    stopwatchDisplay.textContent = formatStopwatch(stopwatchCurrentMs());
  }

  function tickStopwatch() {
    renderStopwatch();
  }

  function startStopwatch() {
    if (stopwatchRunning) return;
    stopwatchRunning = true;
    stopwatchStartedAt = performance.now();
    stopwatchStartPauseBtn.textContent = '一時停止';
    stopwatchStatus.textContent = '計測中';
    stopwatchTimerId = setInterval(tickStopwatch, 10);
  }

  function pauseStopwatch() {
    if (!stopwatchRunning) return;
    stopwatchElapsedMs = stopwatchCurrentMs();
    stopwatchRunning = false;
    clearInterval(stopwatchTimerId);
    stopwatchTimerId = null;
    stopwatchStartPauseBtn.textContent = '再開';
    stopwatchStatus.textContent = '一時停止中';
    renderStopwatch();
  }

  function recordLap() {
    if (!stopwatchRunning) return;
    const item = document.createElement('li');
    const label = document.createElement('span');
    const time = document.createElement('time');
    lapCount += 1;
    label.textContent = `ラップ ${lapCount}`;
    time.textContent = formatStopwatch(stopwatchCurrentMs());
    item.append(label, time);
    laps.prepend(item);
  }

  function resetStopwatch() {
    clearInterval(stopwatchTimerId);
    stopwatchTimerId = null;
    stopwatchRunning = false;
    stopwatchElapsedMs = 0;
    lapCount = 0;
    laps.replaceChildren();
    stopwatchStartPauseBtn.textContent = 'スタート';
    stopwatchStatus.textContent = '停止中';
    renderStopwatch();
  }

  function renderClock() {
    const now = new Date();
    clockDisplay.textContent = new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(now);
    clockDate.textContent = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
    }).format(now);
  }

  function setMode(mode) {
    activeMode = mode;
    modeTabs.forEach((tab) => {
      const selected = tab.dataset.mode === mode;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
    });
    panels.forEach((panel) => { panel.hidden = panel.id !== `${mode}-panel`; });
    clearInterval(clockTimerId);
    clockTimerId = null;
    if (mode === 'clock') {
      renderClock();
      clockTimerId = setInterval(renderClock, 1000);
      document.title = '時計 - シンプルタイマー';
    } else if (mode === 'stopwatch') {
      renderStopwatch();
      document.title = 'ストップウォッチ - シンプルタイマー';
    } else {
      render();
    }
  }

  startPauseBtn.addEventListener('click', () => (running ? pause() : start()));
  resetBtn.addEventListener('click', reset);
  stopwatchStartPauseBtn.addEventListener('click', () => (stopwatchRunning ? pauseStopwatch() : startStopwatch()));
  stopwatchLapBtn.addEventListener('click', recordLap);
  stopwatchResetBtn.addEventListener('click', resetStopwatch);
  modeTabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));

  Object.values(inputs).forEach((el) => {
    el.addEventListener('change', () => {
      if (!running) reset();
    });
  });

  document.querySelectorAll('.preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (running) pause();
      writeInputs(Number(btn.dataset.seconds) * 1000);
      reset();
    });
  });

  document.addEventListener('keydown', (e) => {
    const typing = e.target instanceof HTMLInputElement;
    if (e.code === 'Space' && !typing) {
      e.preventDefault();
      if (activeMode === 'timer') {
        running ? pause() : start();
      } else if (activeMode === 'stopwatch') {
        stopwatchRunning ? pauseStopwatch() : startStopwatch();
      }
    } else if ((e.key === 'r' || e.key === 'R') && !typing) {
      if (activeMode === 'timer') reset();
      if (activeMode === 'stopwatch') resetStopwatch();
    }
  });

  reset();
  renderStopwatch();
})();
