export interface PitchResult {
  frequency: number; // in Hz
  noteName: string; // e.g. "C4"
  cents: number; // -50 to +50
  midiNote: number;
  clarity: number; // 0 to 1 confidence
  isVoiced: boolean;
  volumeDb: number;
}

export interface HarmonicsData {
  h1: number; // Fundamental (f0)
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
  h7?: number;
  h8?: number;
}

export interface FormantEstimate {
  id: 'F1' | 'F2' | 'F3' | 'F4' | 'F5';
  name: string;
  freq: number; // current detected peak in Hz
  bandwidth: number;
  amplitude: number; // in dB or normalized magnitude
  standardRange: [number, number]; // e.g. [250, 950] for F1
  description: string;
  articulatoryRole: string; // e.g. "下巴开合 (口咽)"
}

export type FormantId = 'F1' | 'F2' | 'F3' | 'F4' | 'F5';
export type HarmonicId = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6';

export interface AlignmentComparison {
  formantId: FormantId;
  harmonicId: HarmonicId;
  formantFreq: number;
  harmonicFreq: number;
  deltaHz: number; // formantFreq - harmonicFreq
  deltaCents: number;
  status: 'below' | 'aligned' | 'above' | 'silent';
  shortMessage: string;
  detailedHint: string;
}

export interface AudioAnalysisSnapshot {
  pitch: PitchResult;
  harmonics: HarmonicsData;
  formants: Record<FormantId, FormantEstimate>;
  fftData: Float32Array; // frequency data in dB (-100 to 0)
  lpcEnvelope: Float32Array; // smoothed spectral envelope
  sampleRate: number;
  fftSize: number;
  maxFreq: number;
  volumeRms: number;
  isAudioActive: boolean;
}
