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
  const calcDisplay = document.getElementById('calcDisplay');
  const calcExpression = document.getElementById('calcExpression');
  const keypad = document.querySelector('.keypad');
  const opKeys = document.querySelectorAll('.key-op');

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
  let calcEntry = '0';        // 入力中の数値
  let calcAccumulator = null; // 確定済みの左辺
  let calcPendingOp = null;   // 未計算の演算子
  let calcOverwrite = true;   // 次の数字入力で calcEntry を置き換えるか
  let calcHistory = '';       // 「=」の後に残す式
  let calcError = false;

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

  const CALC_MAX_DIGITS = 12;
  const OP_SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  // 2 進小数の誤差（0.1 + 0.2 など）を有効桁で丸めてから文字列にする
  function formatCalcNumber(n) {
    if (!Number.isFinite(n)) return 'エラー';
    const rounded = Number(n.toPrecision(CALC_MAX_DIGITS));
    const abs = Math.abs(rounded);
    if (rounded !== 0 && (abs >= 1e12 || abs < 1e-9)) {
      return rounded.toExponential(6).replace(/\.?0+e/, 'e');
    }
    return String(rounded);
  }

  function operate(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      default: return b;
    }
  }

  function renderCalc() {
    calcDisplay.textContent = calcEntry;
    calcDisplay.classList.toggle('is-long', calcEntry.length > 9);
    calcDisplay.classList.toggle('is-error', calcError);
    if (calcError) {
      calcExpression.textContent = '';
    } else if (calcPendingOp) {
      calcExpression.textContent = `${formatCalcNumber(calcAccumulator)} ${OP_SYMBOLS[calcPendingOp]}`;
    } else {
      calcExpression.textContent = calcHistory;
    }
    opKeys.forEach((key) => {
      key.classList.toggle('is-active', !calcError && calcOverwrite && key.dataset.op === calcPendingOp);
    });
  }

  function clearCalc() {
    calcEntry = '0';
    calcAccumulator = null;
    calcPendingOp = null;
    calcOverwrite = true;
    calcHistory = '';
    calcError = false;
    renderCalc();
  }

  function setCalcError() {
    calcEntry = 'エラー';
    calcAccumulator = null;
    calcPendingOp = null;
    calcOverwrite = true;
    calcHistory = '';
    calcError = true;
    renderCalc();
  }

  function digitCount(text) {
    return text.replace(/[-.]/g, '').length;
  }

  function inputDigit(digit) {
    if (calcError) clearCalc();
    calcHistory = '';
    if (calcOverwrite) {
      calcEntry = digit;
      calcOverwrite = false;
    } else if (digitCount(calcEntry) < CALC_MAX_DIGITS) {
      calcEntry = calcEntry === '0' ? digit : calcEntry + digit;
    }
    renderCalc();
  }

  function inputDecimal() {
    if (calcError) clearCalc();
    calcHistory = '';
    if (calcOverwrite) {
      calcEntry = '0.';
      calcOverwrite = false;
    } else if (!calcEntry.includes('.')) {
      calcEntry += '.';
    }
    renderCalc();
  }

  function negate() {
    if (calcError || calcEntry === '0') return;
    calcEntry = calcEntry.startsWith('-') ? calcEntry.slice(1) : `-${calcEntry}`;
    renderCalc();
  }

  function backspace() {
    if (calcError) { clearCalc(); return; }
    if (calcOverwrite) return;
    calcEntry = calcEntry.slice(0, -1);
    if (calcEntry === '' || calcEntry === '-') {
      calcEntry = '0';
      calcOverwrite = true;
    }
    renderCalc();
  }

  // 「+ / -」の直後は左辺に対する割合、それ以外は単純に 1/100 にする
  function percent() {
    if (calcError) return;
    const current = Number(calcEntry);
    const base = (calcAccumulator !== null && (calcPendingOp === '+' || calcPendingOp === '-'))
      ? calcAccumulator
      : 1;
    calcEntry = formatCalcNumber(base * current / 100);
    calcOverwrite = false;
    renderCalc();
  }

  function chooseOp(op) {
    if (calcError) return;
    calcHistory = '';
    if (calcPendingOp !== null && !calcOverwrite) {
      const result = operate(calcAccumulator, Number(calcEntry), calcPendingOp);
      if (!Number.isFinite(result)) { setCalcError(); return; }
      calcAccumulator = result;
      calcEntry = formatCalcNumber(result);
    } else if (calcPendingOp === null) {
      calcAccumulator = Number(calcEntry);
    }
    calcPendingOp = op;
    calcOverwrite = true;
    renderCalc();
  }

  function equals() {
    if (calcError || calcPendingOp === null) return;
    const left = calcAccumulator;
    const right = Number(calcEntry);
    const result = operate(left, right, calcPendingOp);
    if (!Number.isFinite(result)) { setCalcError(); return; }
    calcHistory = `${formatCalcNumber(left)} ${OP_SYMBOLS[calcPendingOp]} ${formatCalcNumber(right)} =`;
    calcAccumulator = null;
    calcPendingOp = null;
    calcEntry = formatCalcNumber(result);
    calcOverwrite = true;
    renderCalc();
  }

  const CALC_ACTIONS = {
    clear: clearCalc,
    backspace,
    percent,
    negate,
    decimal: inputDecimal,
    equals,
  };

  function handleCalcKey(e) {
    if (e.key >= '0' && e.key <= '9') { inputDigit(e.key); return true; }
    if (e.key === '.' || e.key === ',') { inputDecimal(); return true; }
    if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') { chooseOp(e.key); return true; }
    if (e.key === 'x' || e.key === 'X') { chooseOp('*'); return true; }
    if (e.key === '=' || e.key === 'Enter') { equals(); return true; }
    if (e.key === '%') { percent(); return true; }
    if (e.key === 'Backspace') { backspace(); return true; }
    if (e.key === 'Escape' || e.key === 'Delete' || e.key === 'c' || e.key === 'C') { clearCalc(); return true; }
    return false;
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
    } else if (mode === 'calc') {
      renderCalc();
      document.title = '電卓 - シンプルタイマー';
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

  keypad.addEventListener('click', (e) => {
    const key = e.target.closest('.key');
    if (!key) return;
    if (key.dataset.digit !== undefined) inputDigit(key.dataset.digit);
    else if (key.dataset.op !== undefined) chooseOp(key.dataset.op);
    else if (CALC_ACTIONS[key.dataset.action]) CALC_ACTIONS[key.dataset.action]();
  });

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
    if (activeMode === 'calc' && !typing) {
      // フォーカス中のキーで Enter / Space を押した場合はブラウザの click に任せる
      const onKeyButton = e.target instanceof HTMLElement && e.target.closest('.key');
      if (onKeyButton && (e.key === 'Enter' || e.key === ' ')) return;
      if (handleCalcKey(e)) e.preventDefault();
      return;
    }
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
  renderCalc();
})();
