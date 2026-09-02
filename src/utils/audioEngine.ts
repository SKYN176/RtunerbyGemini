import { AudioAnalysisSnapshot, FormantEstimate, FormantId, HarmonicsData, PitchResult } from '../types';
import {
  applyHammingWindow,
  computeLpcLevinsonDurbin,
  detectPitchYIN,
  evaluateLpcSpectrum,
  extractFormants,
  frequencyToNote,
  preEmphasis,
} from './dspMath';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private referenceOscillator: OscillatorNode | null = null;
  private referenceGain: GainNode | null = null;

  private isRunning = false;
  private animationFrameId: number | null = null;
  private onDataCallback: ((data: AudioAnalysisSnapshot) => void) | null = null;

  private timeDomainBuffer: Float32Array = new Float32Array(2048);
  private frequencyBuffer: Float32Array = new Float32Array(2048);

  private noiseGateThreshold = -52; // dB
  private a4Reference = 440;
  private maxSpectrumFreq = 5000; // 0 - 5000 Hz spectrum window for singing formants

  private prevPitch: PitchResult = {
    frequency: 0,
    noteName: '--',
    cents: 0,
    midiNote: 0,
    clarity: 0,
    isVoiced: false,
    volumeDb: -100,
  };

  private prevFormants?: Record<FormantId, FormantEstimate>;

  constructor() {}

  public async startMicrophone(onData: (data: AudioAnalysisSnapshot) => void): Promise<boolean> {
    this.onDataCallback = onData;

    try {
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Request pure high-quality mic stream with minimal browser AGC distortion
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 4096;
      this.analyserNode.smoothingTimeConstant = 0.65;
      this.analyserNode.minDecibels = -95;
      this.analyserNode.maxDecibels = -10;

      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);

      this.timeDomainBuffer = new Float32Array(this.analyserNode.fftSize);
      this.frequencyBuffer = new Float32Array(this.analyserNode.frequencyBinCount);

      this.isRunning = true;
      this.loop();
      return true;
    } catch (err) {
      console.error('Failed to start microphone:', err);
      return false;
    }
  }

  public stopMicrophone() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.stopToneReference();
  }

  public setNoiseGate(thresholdDb: number) {
    this.noiseGateThreshold = thresholdDb;
  }

  public setGain(gainValue: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = gainValue;
    }
  }

  public setA4(hz: number) {
    this.a4Reference = hz;
  }

  public playToneReference(freq: number) {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
    this.stopToneReference();

    try {
      this.referenceOscillator = this.audioContext.createOscillator();
      this.referenceGain = this.audioContext.createGain();
      this.referenceOscillator.type = 'sine';
      this.referenceOscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);

      this.referenceGain.gain.setValueAtTime(0.001, this.audioContext.currentTime);
      this.referenceGain.gain.exponentialRampToValueAtTime(0.2, this.audioContext.currentTime + 0.05);

      this.referenceOscillator.connect(this.referenceGain);
      this.referenceGain.connect(this.audioContext.destination);
      this.referenceOscillator.start();
    } catch (e) {
      console.error('Tone ref error:', e);
    }
  }

  public stopToneReference() {
    if (this.referenceOscillator && this.referenceGain && this.audioContext) {
      try {
        this.referenceGain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.05);
        setTimeout(() => {
          this.referenceOscillator?.stop();
          this.referenceOscillator?.disconnect();
          this.referenceGain?.disconnect();
          this.referenceOscillator = null;
          this.referenceGain = null;
        }, 60);
      } catch (e) {
        this.referenceOscillator = null;
        this.referenceGain = null;
      }
    }
  }

  private loop = () => {
    if (!this.isRunning || !this.analyserNode || !this.audioContext) {
      return;
    }

    this.analyserNode.getFloatTimeDomainData(this.timeDomainBuffer);
    this.analyserNode.getFloatFrequencyData(this.frequencyBuffer);

    const sampleRate = this.audioContext.sampleRate;

    // 1. Calculate RMS volume in dB
    let sumSquares = 0;
    for (let i = 0; i < this.timeDomainBuffer.length; i++) {
      sumSquares += this.timeDomainBuffer[i] * this.timeDomainBuffer[i];
    }
    const rms = Math.sqrt(sumSquares / this.timeDomainBuffer.length);
    const volumeDb = 20 * Math.log10(Math.max(1e-5, rms));

    const isAudioActive = volumeDb > this.noiseGateThreshold;

    let pitch: PitchResult;
    let harmonics: HarmonicsData;
    let formants: Record<FormantId, FormantEstimate>;
    let lpcEnvelope = new Float32Array(512);

    if (isAudioActive) {
      // 2. Pitch Detection
      const pitchResult = detectPitchYIN(this.timeDomainBuffer, sampleRate, 0.18, 55, 1350);

      let currentFreq = pitchResult.frequency;
      if (pitchResult.clarity > 0.6 && currentFreq > 0) {
        // Smooth pitch tracking
        if (this.prevPitch.isVoiced && Math.abs(currentFreq - this.prevPitch.frequency) < 25) {
          currentFreq = this.prevPitch.frequency * 0.7 + currentFreq * 0.3;
        }

        const noteInfo = frequencyToNote(currentFreq, this.a4Reference);
        pitch = {
          frequency: Math.round(currentFreq * 10) / 10,
          noteName: noteInfo.noteName,
          cents: noteInfo.cents,
          midiNote: noteInfo.midiNote,
          clarity: pitchResult.clarity,
          isVoiced: true,
          volumeDb: Math.round(volumeDb),
        };
      } else {
        pitch = {
          ...this.prevPitch,
          isVoiced: false,
          volumeDb: Math.round(volumeDb),
        };
      }

      // 3. Harmonics calculation
      const f0 = pitch.isVoiced ? pitch.frequency : 0;
      harmonics = {
        h1: Math.round(f0 * 10) / 10,
        h2: Math.round(f0 * 2 * 10) / 10,
        h3: Math.round(f0 * 3 * 10) / 10,
        h4: Math.round(f0 * 4 * 10) / 10,
        h5: Math.round(f0 * 5 * 10) / 10,
        h6: Math.round(f0 * 6 * 10) / 10,
        h7: Math.round(f0 * 7 * 10) / 10,
        h8: Math.round(f0 * 8 * 10) / 10,
      };

      // 4. Formant estimation via LPC
      // Downsample / window for vocal tract LPC (order 16)
      const lpcWindowSize = 1024;
      const lpcSignal = new Float32Array(lpcWindowSize);
      for (let i = 0; i < lpcWindowSize; i++) {
        lpcSignal[i] = this.timeDomainBuffer[i];
      }

      const preEmphasized = preEmphasis(lpcSignal, 0.95);
      const windowed = applyHammingWindow(preEmphasized);
      const lpcCoeffs = computeLpcLevinsonDurbin(windowed, 16);

      lpcEnvelope = evaluateLpcSpectrum(lpcCoeffs, 512, sampleRate, this.maxSpectrumFreq);
      formants = extractFormants(lpcEnvelope, this.frequencyBuffer, 512, this.maxSpectrumFreq, this.prevFormants);

      this.prevPitch = pitch;
      this.prevFormants = formants;
    } else {
      // Idle / Silenced
      pitch = {
        frequency: 0,
        noteName: '--',
        cents: 0,
        midiNote: 0,
        clarity: 0,
        isVoiced: false,
        volumeDb: Math.round(volumeDb),
      };

      harmonics = {
        h1: 0,
        h2: 0,
        h3: 0,
        h4: 0,
        h5: 0,
        h6: 0,
      };

      formants = this.prevFormants || {
        F1: { id: 'F1', name: 'F1', freq: 500, bandwidth: 100, amplitude: 0, standardRange: [250, 950], description: '下巴开合', articulatoryRole: '元音开闭' },
        F2: { id: 'F2', name: 'F2', freq: 1500, bandwidth: 120, amplitude: 0, standardRange: [750, 2700], description: '舌位前后', articulatoryRole: '元音前后' },
        F3: { id: 'F3', name: 'F3', freq: 2600, bandwidth: 140, amplitude: 0, standardRange: [2100, 3400], description: '色彩明亮', articulatoryRole: '声音焦点' },
        F4: { id: 'F4', name: 'F4', freq: 3500, bandwidth: 150, amplitude: 0, standardRange: [3200, 4200], description: '歌唱家共鸣峰', articulatoryRole: '金属芯/穿透力' },
        F5: { id: 'F5', name: 'F5', freq: 4400, bandwidth: 160, amplitude: 0, standardRange: [4000, 5200], description: '高频辉光', articulatoryRole: '空气感/泛音' },
      };
    }

    if (this.onDataCallback) {
      this.onDataCallback({
        pitch,
        harmonics,
        formants,
        fftData: this.frequencyBuffer,
        lpcEnvelope,
        sampleRate,
        fftSize: this.analyserNode.fftSize,
        maxFreq: this.maxSpectrumFreq,
        volumeRms: rms,
        isAudioActive,
      });
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}

export const audioEngine = new AudioEngine();
