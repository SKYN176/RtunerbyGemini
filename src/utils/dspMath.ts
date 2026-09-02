import { FormantEstimate, FormantId, PitchResult } from '../types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert frequency in Hz to Note Name, cents, and MIDI note number
 */
export function frequencyToNote(frequency: number, a4 = 440): { noteName: string; cents: number; midiNote: number } {
  if (frequency <= 0 || !isFinite(frequency)) {
    return { noteName: '--', cents: 0, midiNote: 0 };
  }

  const midiNumber = 69 + 12 * Math.log2(frequency / a4);
  const roundedMidi = Math.round(midiNumber);
  const cents = Math.round((midiNumber - roundedMidi) * 100);

  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  const noteName = `${NOTE_NAMES[noteIndex]}${octave}`;

  return { noteName, cents, midiNote: roundedMidi };
}

/**
 * Autocorrelation / YIN pitch detector with parabolic interpolation
 */
export function detectPitchYIN(
  buffer: Float32Array,
  sampleRate: number,
  threshold = 0.15,
  minFreq = 55, // A1
  maxFreq = 1400 // F6
): { frequency: number; clarity: number } {
  const bufferSize = buffer.length;
  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.floor(sampleRate / minFreq);

  if (bufferSize < maxPeriod * 2) {
    return { frequency: 0, clarity: 0 };
  }

  // 1. Difference function: d(tau) = sum (x[i] - x[i+tau])^2
  const d = new Float32Array(maxPeriod);
  for (let tau = 0; tau < maxPeriod; tau++) {
    let sum = 0;
    for (let i = 0; i < maxPeriod; i++) {
      const diff = buffer[i] - buffer[i + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }

  // 2. Cumulative mean normalized difference function (CMNDF)
  const dPrime = new Float32Array(maxPeriod);
  dPrime[0] = 1;
  let runningSum = 0;

  for (let tau = 1; tau < maxPeriod; tau++) {
    runningSum += d[tau];
    dPrime[tau] = runningSum > 0 ? (d[tau] * tau) / runningSum : 1;
  }

  // 3. Absolute threshold search
  let tau = minPeriod;
  while (tau < maxPeriod) {
    if (dPrime[tau] < threshold) {
      while (tau + 1 < maxPeriod && dPrime[tau + 1] < dPrime[tau]) {
        tau++;
      }
      break;
    }
    tau++;
  }

  // If no minimum under threshold was found, find the global minimum in range
  if (tau >= maxPeriod) {
    let minVal = 1;
    let bestTau = 0;
    for (let t = minPeriod; t < maxPeriod; t++) {
      if (dPrime[t] < minVal) {
        minVal = dPrime[t];
        bestTau = t;
      }
    }
    if (minVal > 0.45 || bestTau === 0) {
      return { frequency: 0, clarity: 0 };
    }
    tau = bestTau;
  }

  // 4. Parabolic interpolation for sub-sample precision
  let betterTau = tau;
  if (tau > 0 && tau < maxPeriod - 1) {
    const s0 = dPrime[tau - 1];
    const s1 = dPrime[tau];
    const s2 = dPrime[tau + 1];
    const denom = 2 * (2 * s1 - s0 - s2);
    if (denom !== 0) {
      const delta = (s0 - s2) / denom;
      if (Math.abs(delta) < 1) {
        betterTau = tau + delta;
      }
    }
  }

  const frequency = sampleRate / betterTau;
  const clarity = Math.max(0, Math.min(1, 1 - dPrime[tau]));

  if (frequency < minFreq || frequency > maxFreq) {
    return { frequency: 0, clarity: 0 };
  }

  return { frequency, clarity };
}

/**
 * Pre-emphasis filter to boost high frequency resonances before LPC
 */
export function preEmphasis(signal: Float32Array, alpha = 0.95): Float32Array {
  const out = new Float32Array(signal.length);
  out[0] = signal[0];
  for (let i = 1; i < signal.length; i++) {
    out[i] = signal[i] - alpha * signal[i - 1];
  }
  return out;
}

/**
 * Apply Hamming Window
 */
export function applyHammingWindow(signal: Float32Array): Float32Array {
  const N = signal.length;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
    out[i] = signal[i] * w;
  }
  return out;
}

/**
 * Levinson-Durbin algorithm to compute LPC coefficients
 */
export function computeLpcLevinsonDurbin(signal: Float32Array, order: number): Float32Array {
  const N = signal.length;
  const r = new Float32Array(order + 1);

  // Compute autocorrelation r[0...order]
  for (let k = 0; k <= order; k++) {
    let sum = 0;
    for (let i = 0; i < N - k; i++) {
      sum += signal[i] * signal[i + k];
    }
    r[k] = sum;
  }

  if (r[0] === 0) {
    return new Float32Array(order + 1);
  }

  const a = new Float32Array(order + 1);
  const aPrev = new Float32Array(order + 1);

  a[0] = 1;
  let E = r[0];

  for (let i = 1; i <= order; i++) {
    let sum = 0;
    for (let j = 1; j < i; j++) {
      sum += a[j] * r[i - j];
    }
    const k = (r[i] - sum) / E;
    a[i] = k;

    for (let j = 1; j < i; j++) {
      aPrev[j] = a[j];
    }

    for (let j = 1; j < i; j++) {
      a[j] = aPrev[j] - k * aPrev[i - j];
    }

    E *= 1 - k * k;
    if (E <= 0) break;
  }

  return a;
}

/**
 * Evaluate LPC frequency response (all-pole spectral envelope)
 */
export function evaluateLpcSpectrum(
  lpcCoeffs: Float32Array,
  numPoints: number,
  sampleRate: number,
  maxFreq: number
): Float32Array {
  const envelope = new Float32Array(numPoints);
  const order = lpcCoeffs.length - 1;

  for (let i = 0; i < numPoints; i++) {
    const freq = (i / numPoints) * maxFreq;
    const omega = (2 * Math.PI * freq) / sampleRate;

    let real = 1.0;
    let imag = 0.0;

    for (let k = 1; k <= order; k++) {
      const angle = -k * omega;
      real += lpcCoeffs[k] * Math.cos(angle);
      imag += lpcCoeffs[k] * Math.sin(angle);
    }

    const magSquared = real * real + imag * imag;
    const gainDb = -10 * Math.log10(Math.max(1e-12, magSquared));
    envelope[i] = gainDb;
  }

  return envelope;
}

/**
 * Extract Formants F1 through F5 from LPC envelope and FFT spectrum
 */
export function extractFormants(
  lpcEnvelope: Float32Array,
  fftData: Float32Array,
  numPoints: number,
  maxFreq: number,
  prevFormants?: Record<FormantId, FormantEstimate>
): Record<FormantId, FormantEstimate> {
  // Search bands optimized for human vocal tract acoustics (Singing Voice resonance)
  const bands: Record<FormantId, { range: [number, number]; desc: string; role: string; def: number }> = {
    F1: { range: [250, 950], desc: '下巴开合度 / 口咽腔高度', role: '决定元音开闭 ([i]/[u]低, [a]高)', def: 550 },
    F2: { range: [750, 2700], desc: '舌位前后 / 口腔容积', role: '决定元音前后 ([u]/[o]后舌低, [e]/[i]前舌高)', def: 1500 },
    F3: { range: [2100, 3400], desc: '舌尖与会厌 / 喉口匹配', role: '色彩明亮度与音色穿透力', def: 2700 },
    F4: { range: [3200, 4200], desc: '歌唱家共鸣峰群 (Singer’s Formant)', role: '高频金属芯与泛音辉煌感', def: 3600 },
    F5: { range: [4000, 5200], desc: '超高频共鸣 / 气声辉光', role: '极高频泛音包络延伸', def: 4500 },
  };

  const hzPerBin = maxFreq / numPoints;

  // Find local peaks in the LPC envelope
  const rawPeaks: { freq: number; amp: number }[] = [];
  for (let i = 2; i < numPoints - 2; i++) {
    const y0 = lpcEnvelope[i - 1];
    const y1 = lpcEnvelope[i];
    const y2 = lpcEnvelope[i + 1];

    if (y1 > y0 && y1 > y2 && y1 > -50) {
      // parabolic interpolation for peak frequency
      const denom = 2 * (2 * y1 - y0 - y2);
      const delta = denom !== 0 ? (y0 - y2) / denom : 0;
      const peakFreq = (i + delta) * hzPerBin;
      rawPeaks.push({ freq: peakFreq, amp: y1 });
    }
  }

  const result: Record<FormantId, FormantEstimate> = {} as any;
  const formantKeys: FormantId[] = ['F1', 'F2', 'F3', 'F4', 'F5'];

  for (const fId of formantKeys) {
    const config = bands[fId];
    const [minF, maxF] = config.range;

    // Filter candidate peaks in range
    const candidates = rawPeaks.filter((p) => p.freq >= minF && p.freq <= maxF);

    let chosenFreq = config.def;
    let chosenAmp = -20;

    if (candidates.length > 0) {
      // Pick the strongest peak or one closest to typical expectation
      candidates.sort((a, b) => b.amp - a.amp);
      chosenFreq = candidates[0].freq;
      chosenAmp = candidates[0].amp;
    } else if (prevFormants && prevFormants[fId]) {
      // Retain smoothed previous
      chosenFreq = prevFormants[fId].freq;
      chosenAmp = prevFormants[fId].amplitude;
    }

    // Apply smoothing if previous exists
    if (prevFormants && prevFormants[fId] && prevFormants[fId].freq > 0) {
      const alpha = 0.25; // smoothing factor
      chosenFreq = prevFormants[fId].freq * (1 - alpha) + chosenFreq * alpha;
    }

    result[fId] = {
      id: fId,
      name: fId,
      freq: Math.round(chosenFreq),
      bandwidth: 120,
      amplitude: chosenAmp,
      standardRange: config.range,
      description: config.desc,
      articulatoryRole: config.role,
    };
  }

  // Ensure strict ordering: F1 < F2 < F3 < F4 < F5
  if (result.F2.freq <= result.F1.freq + 150) {
    result.F2.freq = result.F1.freq + 300;
  }
  if (result.F3.freq <= result.F2.freq + 250) {
    result.F3.freq = result.F2.freq + 400;
  }
  if (result.F4.freq <= result.F3.freq + 250) {
    result.F4.freq = result.F3.freq + 400;
  }
  if (result.F5.freq <= result.F4.freq + 250) {
    result.F5.freq = result.F4.freq + 400;
  }

  return result;
}
