/**
 * Generates a self-contained, standalone single-file HTML version
 * that works 100% offline in any modern browser without internet or server.
 */
export function generateOfflineHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>歌手共鸣调谐仪 (离线版) - Resonance Singer Tuning</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background-color: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #18181b;
      border-bottom: 1px solid #27272a;
    }
    .btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { background: #1d4ed8; }
    .btn.active { background: #dc2626; }
    .btn-secondary {
      background: #27272a;
      color: #e4e4e7;
    }
    .btn-secondary:hover { background: #3f3f46; }
    .main-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 10px;
      gap: 10px;
      overflow: hidden;
    }
    .card {
      background: #121215;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 10px 14px;
    }
    /* Top Section */
    .top-section {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .pitch-badge {
      display: flex;
      align-items: baseline;
      gap: 8px;
      background: #1e1e24;
      padding: 6px 16px;
      border-radius: 8px;
      border: 1px solid #3b82f6;
    }
    .note-name { font-size: 28px; font-weight: 800; color: #60a5fa; }
    .cents-tag { font-size: 12px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .cents-perfect { background: #065f46; color: #34d399; }
    .cents-off { background: #451a03; color: #fbbf24; }
    .harmonics-row {
      display: flex;
      gap: 6px;
      flex: 1;
      overflow-x: auto;
    }
    .harmonic-chip {
      background: #1c1917;
      border: 1px solid #44403c;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      white-space: nowrap;
    }
    .harmonic-label { color: #38bdf8; font-weight: bold; margin-right: 4px; }
    /* Spectrum */
    .spectrum-box {
      flex: 1;
      min-height: 180px;
      position: relative;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 8px;
      overflow: hidden;
    }
    canvas { width: 100%; height: 100%; display: block; }
    /* Formants */
    .formants-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }
    .formant-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 6px;
      padding: 6px 10px;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s;
    }
    .formant-card.selected { border-color: #f59e0b; background: #27272a; }
    .f-title { font-size: 12px; font-weight: bold; }
    .f-hz { font-size: 16px; font-weight: 800; margin: 2px 0; }
    .f-range { font-size: 10px; color: #a1a1aa; }
    /* Alignment */
    .align-section {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .align-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .align-group { display: flex; align-items: center; gap: 4px; }
    .btn-pill {
      background: #27272a;
      color: #d4d4d8;
      border: 1px solid #3f3f46;
      padding: 3px 10px;
      border-radius: 14px;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-pill.active {
      background: #f59e0b;
      color: #000;
      font-weight: 700;
      border-color: #fbbf24;
    }
    .btn-pill.h-active {
      background: #0284c7;
      color: #fff;
      font-weight: 700;
      border-color: #38bdf8;
    }
    .feedback-banner {
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .fb-aligned { background: #064e3b; border: 1px solid #059669; color: #6ee7b7; font-weight: 600; }
    .fb-below { background: #451a03; border: 1px solid #d97706; color: #fde68a; }
    .fb-above { background: #3b0764; border: 1px solid #9333ea; color: #f5d0fe; }
    .fb-silent { background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; }
    .hint-text { font-size: 12px; color: #d4d4d8; opacity: 0.9; margin-top: 2px; }
  </style>
</head>
<body>
  <header>
    <div style="display:flex; align-items:center; gap:10px;">
      <span style="font-weight:800; font-size:15px; color:#38bdf8;">🎤 歌手共鸣调谐仪 (离线版)</span>
      <span style="font-size:12px; color:#a1a1aa;">Resonance Singer Tuning</span>
    </div>
    <div style="display:flex; gap:8px;">
      <button id="micBtn" class="btn" onclick="toggleMic()">🎙️ 开启麦克风</button>
      <button class="btn btn-secondary" onclick="playTone(261.63)">🎵 C4 基准音</button>
    </div>
  </header>

  <div class="main-container">
    <!-- Top Pitch & Harmonics -->
    <div class="card top-section">
      <div class="pitch-badge">
        <div style="display:flex; flex-direction:column;">
          <span style="font-size:10px; color:#93c5fd; text-transform:uppercase;">当前音高</span>
          <span id="noteName" class="note-name mono">--</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end;">
          <span id="pitchHz" class="mono" style="font-size:16px; font-weight:700; color:#e0f2fe;">0.0 Hz</span>
          <span id="centsTag" class="cents-tag mono cents-perfect">±0 cent</span>
        </div>
      </div>

      <div class="harmonics-row">
        <div class="harmonic-chip mono"><span class="harmonic-label">H2:</span><span id="h2Val">--</span> Hz</div>
        <div class="harmonic-chip mono"><span class="harmonic-label">H3:</span><span id="h3Val">--</span> Hz</div>
        <div class="harmonic-chip mono"><span class="harmonic-label">H4:</span><span id="h4Val">--</span> Hz</div>
        <div class="harmonic-chip mono"><span class="harmonic-label">H5:</span><span id="h5Val">--</span> Hz</div>
        <div class="harmonic-chip mono"><span class="harmonic-label">H6:</span><span id="h6Val">--</span> Hz</div>
      </div>
    </div>

    <!-- Middle Spectrum Canvas -->
    <div class="spectrum-box">
      <canvas id="specCanvas"></canvas>
    </div>

    <!-- Formants F1 - F5 Section -->
    <div class="formants-row">
      <div class="formant-card" onclick="selectFormant('F1')">
        <div class="f-title" style="color:#f59e0b;">F1 (下巴开合)</div>
        <div id="f1Hz" class="f-hz mono" style="color:#fbbf24;">-- Hz</div>
        <div class="f-range">标准: 250~950 Hz</div>
      </div>
      <div class="formant-card" onclick="selectFormant('F2')">
        <div class="f-title" style="color:#ec4899;">F2 (舌位前后)</div>
        <div id="f2Hz" class="f-hz mono" style="color:#f472b6;">-- Hz</div>
        <div class="f-range">标准: 750~2700 Hz</div>
      </div>
      <div class="formant-card" onclick="selectFormant('F3')">
        <div class="f-title" style="color:#a855f7;">F3 (音色明亮)</div>
        <div id="f3Hz" class="f-hz mono" style="color:#c084fc;">-- Hz</div>
        <div class="f-range">标准: 2100~3400 Hz</div>
      </div>
      <div class="formant-card" onclick="selectFormant('F4')">
        <div class="f-title" style="color:#06b6d4;">F4 (歌唱家峰)</div>
        <div id="f4Hz" class="f-hz mono" style="color:#22d3ee;">-- Hz</div>
        <div class="f-range">标准: 3200~4200 Hz</div>
      </div>
      <div class="formant-card" onclick="selectFormant('F5')">
        <div class="f-title" style="color:#10b981;">F5 (超高频辉光)</div>
        <div id="f5Hz" class="f-hz mono" style="color:#34d399;">-- Hz</div>
        <div class="f-range">标准: 4000~5200 Hz</div>
      </div>
    </div>

    <!-- Resonance Alignment Selector & Real-Time Feedback -->
    <div class="align-section">
      <div class="align-controls">
        <div class="align-group">
          <span style="font-size:12px; font-weight:bold; color:#a1a1aa; margin-right:4px;">共振峰:</span>
          <button id="btnF1" class="btn-pill active" onclick="selectFormant('F1')">F1</button>
          <button id="btnF2" class="btn-pill" onclick="selectFormant('F2')">F2</button>
          <button id="btnF3" class="btn-pill" onclick="selectFormant('F3')">F3</button>
          <button id="btnF4" class="btn-pill" onclick="selectFormant('F4')">F4</button>
          <button id="btnF5" class="btn-pill" onclick="selectFormant('F5')">F5</button>
        </div>

        <span style="font-size:13px; color:#71717a;">对齐 ➔</span>

        <div class="align-group">
          <span style="font-size:12px; font-weight:bold; color:#a1a1aa; margin-right:4px;">基频/泛音:</span>
          <button id="btnH1" class="btn-pill" onclick="selectHarmonic('H1')">f0 (H1)</button>
          <button id="btnH2" class="btn-pill h-active" onclick="selectHarmonic('H2')">H2</button>
          <button id="btnH3" class="btn-pill" onclick="selectHarmonic('H3')">H3</button>
          <button id="btnH4" class="btn-pill" onclick="selectHarmonic('H4')">H4</button>
          <button id="btnH5" class="btn-pill" onclick="selectHarmonic('H5')">H5</button>
          <button id="btnH6" class="btn-pill" onclick="selectHarmonic('H6')">H6</button>
        </div>
      </div>

      <!-- Real-time simplified guidance feedback -->
      <div id="feedbackBanner" class="feedback-banner fb-silent">
        <div>
          <div id="feedbackMsg" style="font-weight:700;">🎤 请点击开启麦克风并开嗓发声...</div>
          <div id="feedbackHint" class="hint-text">通过实时微调下巴、舌位和元音，使共振峰精准咬合泛音。</div>
        </div>
        <div id="deltaTag" class="mono" style="font-size:14px; font-weight:800;">Δ 0 Hz</div>
      </div>
    </div>
  </div>

  <script>
    let audioCtx = null, mediaStream = null, analyser = null, isRunning = false;
    let selectedF = 'F1', selectedH = 'H2';
    let prevF = { F1: 500, F2: 1500, F3: 2600, F4: 3500, F5: 4400 };
    let osc = null;

    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    function selectFormant(f) {
      selectedF = f;
      ['F1','F2','F3','F4','F5'].forEach(id => {
        const btn = document.getElementById('btn' + id);
        if (btn) btn.className = id === f ? 'btn-pill active' : 'btn-pill';
      });
    }

    function selectHarmonic(h) {
      selectedH = h;
      ['H1','H2','H3','H4','H5','H6'].forEach(id => {
        const btn = document.getElementById('btn' + id);
        if (btn) btn.className = id === h ? 'btn-pill h-active' : 'btn-pill';
      });
    }

    async function toggleMic() {
      if (isRunning) {
        isRunning = false;
        if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
        document.getElementById('micBtn').className = 'btn';
        document.getElementById('micBtn').innerText = '🎙️ 开启麦克风';
        return;
      }

      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        const src = audioCtx.createMediaStreamSource(mediaStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0.65;
        src.connect(analyser);

        isRunning = true;
        document.getElementById('micBtn').className = 'btn active';
        document.getElementById('micBtn').innerText = '⏹️ 停止监听';
        loop();
      } catch (err) {
        alert('无法获取麦克风权限: ' + err.message);
      }
    }

    function playTone(freq) {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (osc) { osc.stop(); osc.disconnect(); osc = null; return; }
      osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => { if (osc) { osc.stop(); osc = null; } }, 2000);
    }

    function detectPitchYIN(buffer, sampleRate) {
      const minPeriod = Math.floor(sampleRate / 1300);
      const maxPeriod = Math.floor(sampleRate / 60);
      const d = new Float32Array(maxPeriod);
      for (let tau = 0; tau < maxPeriod; tau++) {
        let sum = 0;
        for (let i = 0; i < maxPeriod; i++) {
          const diff = buffer[i] - buffer[i + tau];
          sum += diff * diff;
        }
        d[tau] = sum;
      }
      const dPrime = new Float32Array(maxPeriod);
      dPrime[0] = 1;
      let runningSum = 0;
      for (let tau = 1; tau < maxPeriod; tau++) {
        runningSum += d[tau];
        dPrime[tau] = (d[tau] * tau) / runningSum;
      }
      let tau = minPeriod;
      while (tau < maxPeriod) {
        if (dPrime[tau] < 0.2) {
          while (tau + 1 < maxPeriod && dPrime[tau + 1] < dPrime[tau]) tau++;
          break;
        }
        tau++;
      }
      if (tau >= maxPeriod) return 0;
      let betterTau = tau;
      if (tau > 0 && tau < maxPeriod - 1) {
        const s0 = dPrime[tau - 1], s1 = dPrime[tau], s2 = dPrime[tau + 1];
        const denom = 2 * (2 * s1 - s0 - s2);
        if (denom !== 0) betterTau = tau + (s0 - s2) / denom;
      }
      return sampleRate / betterTau;
    }

    function computeLPC(signal, order) {
      const N = signal.length;
      const r = new Float32Array(order + 1);
      for (let k = 0; k <= order; k++) {
        let sum = 0;
        for (let i = 0; i < N - k; i++) sum += signal[i] * signal[i + k];
        r[k] = sum;
      }
      if (r[0] === 0) return new Float32Array(order + 1);
      const a = new Float32Array(order + 1);
      const aPrev = new Float32Array(order + 1);
      a[0] = 1;
      let E = r[0];
      for (let i = 1; i <= order; i++) {
        let sum = 0;
        for (let j = 1; j < i; j++) sum += a[j] * r[i - j];
        const k = (r[i] - sum) / E;
        a[i] = k;
        for (let j = 1; j < i; j++) aPrev[j] = a[j];
        for (let j = 1; j < i; j++) a[j] = aPrev[j] - k * aPrev[i - j];
        E *= (1 - k * k);
      }
      return a;
    }

    const timeBuf = new Float32Array(4096);
    const freqBuf = new Float32Array(2048);

    function loop() {
      if (!isRunning) return;
      analyser.getFloatTimeDomainData(timeBuf);
      analyser.getFloatFrequencyData(freqBuf);

      let sumSq = 0;
      for (let i = 0; i < timeBuf.length; i++) sumSq += timeBuf[i] * timeBuf[i];
      const rms = Math.sqrt(sumSq / timeBuf.length);
      const volDb = 20 * Math.log10(Math.max(1e-5, rms));

      if (volDb > -50) {
        const pitch = detectPitchYIN(timeBuf, audioCtx.sampleRate);
        if (pitch > 60 && pitch < 1300) {
          const midi = 69 + 12 * Math.log2(pitch / 440);
          const rMidi = Math.round(midi);
          const noteStr = NOTE_NAMES[((rMidi % 12) + 12) % 12] + (Math.floor(rMidi / 12) - 1);
          const cents = Math.round((midi - rMidi) * 100);

          document.getElementById('noteName').innerText = noteStr;
          document.getElementById('pitchHz').innerText = pitch.toFixed(1) + ' Hz';
          const cTag = document.getElementById('centsTag');
          cTag.innerText = (cents > 0 ? '+' : '') + cents + ' cent';
          cTag.className = Math.abs(cents) < 8 ? 'cents-tag mono cents-perfect' : 'cents-tag mono cents-off';

          const h1 = pitch, h2 = pitch * 2, h3 = pitch * 3, h4 = pitch * 4, h5 = pitch * 5, h6 = pitch * 6;
          document.getElementById('h2Val').innerText = h2.toFixed(1);
          document.getElementById('h3Val').innerText = h3.toFixed(1);
          document.getElementById('h4Val').innerText = h4.toFixed(1);
          document.getElementById('h5Val').innerText = h5.toFixed(1);
          document.getElementById('h6Val').innerText = h6.toFixed(1);

          // LPC Formant extraction
          const subSig = new Float32Array(1024);
          for (let i = 0; i < 1024; i++) subSig[i] = timeBuf[i] - 0.95 * (timeBuf[i-1] || 0);
          const lpc = computeLPC(subSig, 14);

          const lpcSpec = new Float32Array(512);
          for (let i = 0; i < 512; i++) {
            const omega = (2 * Math.PI * (i / 512) * 5000) / audioCtx.sampleRate;
            let real = 1, imag = 0;
            for (let k = 1; k < lpc.length; k++) {
              real += lpc[k] * Math.cos(-k * omega);
              imag += lpc[k] * Math.sin(-k * omega);
            }
            lpcSpec[i] = -10 * Math.log10(Math.max(1e-12, real*real + imag*imag));
          }

          const findPeak = (minF, maxF, defF) => {
            const minBin = Math.floor((minF / 5000) * 512);
            const maxBin = Math.floor((maxF / 5000) * 512);
            let maxVal = -999, bestBin = -1;
            for (let b = minBin; b <= maxBin; b++) {
              if (lpcSpec[b] > maxVal && lpcSpec[b] > lpcSpec[b-1] && lpcSpec[b] > lpcSpec[b+1]) {
                maxVal = lpcSpec[b];
                bestBin = b;
              }
            }
            return bestBin > 0 ? (bestBin / 512) * 5000 : defF;
          };

          prevF.F1 = prevF.F1 * 0.7 + findPeak(250, 950, 500) * 0.3;
          prevF.F2 = prevF.F2 * 0.7 + findPeak(800, 2700, 1500) * 0.3;
          prevF.F3 = prevF.F3 * 0.7 + findPeak(2100, 3400, 2600) * 0.3;
          prevF.F4 = prevF.F4 * 0.7 + findPeak(3200, 4200, 3500) * 0.3;
          prevF.F5 = prevF.F5 * 0.7 + findPeak(4000, 5200, 4400) * 0.3;

          document.getElementById('f1Hz').innerText = Math.round(prevF.F1) + ' Hz';
          document.getElementById('f2Hz').innerText = Math.round(prevF.F2) + ' Hz';
          document.getElementById('f3Hz').innerText = Math.round(prevF.F3) + ' Hz';
          document.getElementById('f4Hz').innerText = Math.round(prevF.F4) + ' Hz';
          document.getElementById('f5Hz').innerText = Math.round(prevF.F5) + ' Hz';

          // Resonance Tuning comparison feedback
          const targetFVal = prevF[selectedF];
          const harmonicsMap = { H1: h1, H2: h2, H3: h3, H4: h4, H5: h5, H6: h6 };
          const targetHVal = harmonicsMap[selectedH];
          const delta = Math.round(targetFVal - targetHVal);
          const absDelta = Math.abs(delta);

          const banner = document.getElementById('feedbackBanner');
          const msg = document.getElementById('feedbackMsg');
          const hint = document.getElementById('feedbackHint');
          const dTag = document.getElementById('deltaTag');

          dTag.innerText = (delta > 0 ? '+' : '') + delta + ' Hz';

          if (absDelta <= 8) {
            banner.className = 'feedback-banner fb-aligned';
            msg.innerText = '🎯 ' + selectedF + ' 完美对齐 ' + selectedH + '！（相差 ' + absDelta + ' Hz）';
            hint.innerText = '共鸣锁死！声能增益最大化，声音丰满且通透。';
          } else if (delta < 0) {
            banner.className = 'feedback-banner fb-below';
            msg.innerText = '⬇️ ' + selectedF + ' 低于 ' + selectedH + ' 约 ' + absDelta + ' Hz';
            hint.innerText = selectedF === 'F1' ? '提示：略微张开下巴 / 尝试更开的元音以提高 F1' : '提示：舌位向前微抬以提高共振峰';
          } else {
            banner.className = 'feedback-banner fb-above';
            msg.innerText = '⬆️ ' + selectedF + ' 高于 ' + selectedH + ' 约 ' + absDelta + ' Hz';
            hint.innerText = selectedF === 'F1' ? '提示：微闭下巴 / 放松喉位 / 尝试较闭元音以降低 F1' : '提示：舌位略后缩 / 增加咽腔容积以降低共振峰';
          }

          drawSpectrum(freqBuf, pitch, [h1,h2,h3,h4,h5,h6], prevF);
        }
      }

      requestAnimationFrame(loop);
    }

    function drawSpectrum(fft, pitch, harmList, formants) {
      const canvas = document.getElementById('specCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width = canvas.parentElement.clientWidth;
      const h = canvas.height = canvas.parentElement.clientHeight;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, w, h);

      // Grid lines (1000Hz, 2000Hz, 3000Hz, 4000Hz)
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      for (let freq = 1000; freq <= 4000; freq += 1000) {
        const x = (freq / 5000) * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.fillStyle = '#71717a';
        ctx.font = '10px monospace';
        ctx.fillText(freq + 'Hz', x + 4, h - 6);
      }

      // Draw FFT Bars
      const nyquist = audioCtx.sampleRate / 2;
      const binsIn5k = Math.floor((5000 / nyquist) * fft.length);
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let b = 0; b < binsIn5k; b++) {
        const x = (b / binsIn5k) * w;
        const db = fft[b];
        const norm = Math.max(0, (db + 90) / 80);
        const y = h - norm * h;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Harmonics vertical markers
      harmList.forEach((hHz, idx) => {
        if (hHz <= 5000 && hHz > 0) {
          const x = (hHz / 5000) * w;
          ctx.strokeStyle = '#0284c7';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px monospace';
          ctx.fillText('H' + (idx+1), x + 2, 14);
        }
      });

      // Draw Formants markers
      const fColors = { F1: '#f59e0b', F2: '#ec4899', F3: '#a855f7', F4: '#06b6d4', F5: '#10b981' };
      Object.keys(formants).forEach(fKey => {
        const fHz = formants[fKey];
        if (fHz <= 5000) {
          const x = (fHz / 5000) * w;
          ctx.strokeStyle = fColors[fKey];
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
          ctx.fillStyle = fColors[fKey];
          ctx.font = 'bold 11px monospace';
          ctx.fillText(fKey, x - 8, 30);
        }
      });
    }

    // Auto-resize canvas
    window.addEventListener('resize', () => {
      const c = document.getElementById('specCanvas');
      if (c && c.parentElement) { c.width = c.parentElement.clientWidth; c.height = c.parentElement.clientHeight; }
    });
  </script>
</body>
</html>`;
}

export function downloadOfflineHtmlFile() {
  const htmlContent = generateOfflineHtml();
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Resonance_Singer_Tuning_Offline.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
