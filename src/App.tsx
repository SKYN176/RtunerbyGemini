/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AudioAnalysisSnapshot,
  FormantEstimate,
  FormantId,
  HarmonicId,
  HarmonicsData,
  PitchResult,
} from './types';
import { audioEngine } from './utils/audioEngine';
import { calculateResonanceAlignment } from './utils/resonanceAlignment';
import { Header } from './components/Header';
import { PitchHarmonicsHeader } from './components/PitchHarmonicsHeader';
import { SpectrumView } from './components/SpectrumView';
import { FormantsPanel } from './components/FormantsPanel';
import { ResonanceTuningAligner } from './components/ResonanceTuningAligner';
import { VowelGuideModal } from './components/VowelGuideModal';

const DEFAULT_PITCH: PitchResult = {
  frequency: 0,
  noteName: '--',
  cents: 0,
  midiNote: 0,
  clarity: 0,
  isVoiced: false,
  volumeDb: -100,
};

const DEFAULT_HARMONICS: HarmonicsData = {
  h1: 0,
  h2: 0,
  h3: 0,
  h4: 0,
  h5: 0,
  h6: 0,
};

const DEFAULT_FORMANTS: Record<FormantId, FormantEstimate> = {
  F1: { id: 'F1', name: 'F1', freq: 520, bandwidth: 100, amplitude: 0, standardRange: [250, 950], description: '下巴开合度 / 口咽腔', articulatoryRole: '元音开闭' },
  F2: { id: 'F2', name: 'F2', freq: 1540, bandwidth: 120, amplitude: 0, standardRange: [750, 2700], description: '舌位前后 / 口腔容积', articulatoryRole: '元音前后' },
  F3: { id: 'F3', name: 'F3', freq: 2650, bandwidth: 140, amplitude: 0, standardRange: [2100, 3400], description: '舌尖喉口 / 明亮度', articulatoryRole: '声音焦点' },
  F4: { id: 'F4', name: 'F4', freq: 3580, bandwidth: 150, amplitude: 0, standardRange: [3200, 4200], description: '歌唱家共鸣峰群', articulatoryRole: '金属芯/穿透力' },
  F5: { id: 'F5', name: 'F5', freq: 4450, bandwidth: 160, amplitude: 0, standardRange: [4000, 5200], description: '极高频泛音包络', articulatoryRole: '高频辉光' },
};

export default function App() {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [noiseGate, setNoiseGate] = useState<number>(-54);
  const [pitch, setPitch] = useState<PitchResult>(DEFAULT_PITCH);
  const [harmonics, setHarmonics] = useState<HarmonicsData>(DEFAULT_HARMONICS);
  const [formants, setFormants] = useState<Record<FormantId, FormantEstimate>>(DEFAULT_FORMANTS);
  const [fftData, setFftData] = useState<Float32Array>(new Float32Array(2048));
  const [lpcEnvelope, setLpcEnvelope] = useState<Float32Array>(new Float32Array(512));
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [inputVolumeDb, setInputVolumeDb] = useState<number>(-100);

  // Selected target for Resonance Tuning alignment
  const [selectedFormant, setSelectedFormant] = useState<FormantId>('F1');
  const [selectedHarmonic, setSelectedHarmonic] = useState<HarmonicId>('H2');

  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Throttled UI update via requestAnimationFrame / timestamp to maintain smooth 60fps performance
  const lastUpdateRef = useRef<number>(0);

  const handleAudioData = useCallback((data: AudioAnalysisSnapshot) => {
    const now = performance.now();
    // Update at ~45-60fps
    if (now - lastUpdateRef.current > 16) {
      lastUpdateRef.current = now;
      setPitch(data.pitch);
      setHarmonics(data.harmonics);
      setFormants(data.formants);
      setFftData(data.fftData);
      setLpcEnvelope(data.lpcEnvelope);
      setSampleRate(data.sampleRate);
      setInputVolumeDb(data.pitch.volumeDb);
    }
  }, []);

  const toggleMicrophone = async () => {
    if (isRunning) {
      audioEngine.stopMicrophone();
      setIsRunning(false);
      setPitch(DEFAULT_PITCH);
      setHarmonics(DEFAULT_HARMONICS);
      setInputVolumeDb(-100);
    } else {
      const success = await audioEngine.startMicrophone(handleAudioData);
      if (success) {
        setIsRunning(true);
      }
    }
  };

  const handleNoiseGateChange = (val: number) => {
    setNoiseGate(val);
    audioEngine.setNoiseGate(val);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioEngine.stopMicrophone();
    };
  }, []);

  // Compute live resonance alignment calculation
  const alignment = calculateResonanceAlignment(
    selectedFormant,
    selectedHarmonic,
    formants,
    harmonics,
    pitch,
    9
  );

  return (
    <div className="flex flex-col h-screen max-h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        isRunning={isRunning}
        onToggleMic={toggleMicrophone}
        noiseGate={noiseGate}
        onNoiseGateChange={handleNoiseGateChange}
        inputVolumeDb={inputVolumeDb}
        onPlayTone={(freq) => audioEngine.playToneReference(freq)}
        onStopTone={() => audioEngine.stopToneReference()}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Single-Screen Workspace */}
      <main className="flex-1 flex flex-col p-2.5 sm:p-3 gap-2.5 overflow-hidden min-h-0">
        {/* 1. Top Section: Pitch + Hz + Cents + Harmonics (H2 - H6) */}
        <PitchHarmonicsHeader
          pitch={pitch}
          harmonics={harmonics}
          selectedHarmonic={selectedHarmonic}
          onSelectHarmonic={(h) => setSelectedHarmonic(h)}
        />

        {/* 2. Middle Section: Real-time Spectrum Canvas Analyzer */}
        <SpectrumView
          fftData={fftData}
          lpcEnvelope={lpcEnvelope}
          pitch={pitch}
          harmonics={harmonics}
          formants={formants}
          selectedFormant={selectedFormant}
          selectedHarmonic={selectedHarmonic}
          sampleRate={sampleRate}
        />

        {/* 3. Formants F1 - F5 Readout Cards */}
        <FormantsPanel
          formants={formants}
          selectedFormant={selectedFormant}
          onSelectFormant={(f) => setSelectedFormant(f)}
          pitch={pitch}
        />

        {/* 4. Core Resonance Alignment Trainer (Target Selector & Real-Time Guidance Feedback) */}
        <ResonanceTuningAligner
          alignment={alignment}
          selectedFormant={selectedFormant}
          selectedHarmonic={selectedHarmonic}
          onSelectFormant={(f) => setSelectedFormant(f)}
          onSelectHarmonic={(h) => setSelectedHarmonic(h)}
        />
      </main>

      {/* Vowel Acoustic Reference Guide Modal */}
      <VowelGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
