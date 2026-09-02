import React, { useEffect, useRef, useState } from 'react';
import { FormantEstimate, FormantId, HarmonicId, HarmonicsData, PitchResult } from '../types';
import { getHarmonicFreq } from '../utils/resonanceAlignment';
import { Maximize2, Minimize2, Eye } from 'lucide-react';

interface SpectrumViewProps {
  fftData: Float32Array;
  lpcEnvelope: Float32Array;
  pitch: PitchResult;
  harmonics: HarmonicsData;
  formants: Record<FormantId, FormantEstimate>;
  selectedFormant: FormantId;
  selectedHarmonic: HarmonicId;
  sampleRate: number;
}

const FORMANT_COLORS: Record<FormantId, { stroke: string; fill: string; text: string }> = {
  F1: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
  F2: { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)', text: '#f472b6' },
  F3: { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' },
  F4: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee' },
  F5: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
};

export const SpectrumView: React.FC<SpectrumViewProps> = ({
  fftData,
  lpcEnvelope,
  pitch,
  harmonics,
  formants,
  selectedFormant,
  selectedHarmonic,
  sampleRate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [maxDisplayFreq, setMaxDisplayFreq] = useState<number>(5000); // 3000Hz or 5000Hz
  const [showLpcEnvelope, setShowLpcEnvelope] = useState<boolean>(true);

  // Peak hold buffer for smooth visual rendering
  const peakHoldRef = useRef<Float32Array>(new Float32Array(512));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw subtle frequency grid lines
    const gridStep = maxDisplayFreq <= 3000 ? 500 : 1000;
    ctx.strokeStyle = '#1e1e24';
    ctx.lineWidth = 1;

    for (let f = gridStep; f < maxDisplayFreq; f += gridStep) {
      const x = (f / maxDisplayFreq) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 18);
      ctx.stroke();

      ctx.fillStyle = '#52525b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${f}Hz`, x + 3, height - 6);
    }

    // Horizontal dB lines (-60dB, -40dB, -20dB)
    const dbSteps = [-60, -40, -20];
    ctx.strokeStyle = '#18181b';
    dbSteps.forEach((db) => {
      const norm = (db + 90) / 80;
      const y = height - 18 - norm * (height - 30);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      ctx.fillStyle = '#3f3f46';
      ctx.font = '9px monospace';
      ctx.fillText(`${db}dB`, 4, y - 2);
    });

    if (fftData.length === 0 || sampleRate <= 0) return;

    const nyquist = sampleRate / 2;
    const totalBins = fftData.length;
    const visibleBins = Math.floor((maxDisplayFreq / nyquist) * totalBins);

    // 2. Draw FFT Raw Spectrum filled area
    ctx.beginPath();
    ctx.moveTo(0, height - 18);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    gradient.addColorStop(0.6, 'rgba(14, 165, 233, 0.15)');
    gradient.addColorStop(1, 'rgba(2, 132, 199, 0.01)');

    for (let i = 0; i < visibleBins; i++) {
      const freq = (i / totalBins) * nyquist;
      const x = (freq / maxDisplayFreq) * width;
      const db = fftData[i];
      const norm = Math.max(0, Math.min(1, (db + 90) / 80));
      const y = height - 18 - norm * (height - 30);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height - 18);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // FFT Spectrum outline stroke
    ctx.beginPath();
    for (let i = 0; i < visibleBins; i++) {
      const freq = (i / totalBins) * nyquist;
      const x = (freq / maxDisplayFreq) * width;
      const db = fftData[i];
      const norm = Math.max(0, Math.min(1, (db + 90) / 80));
      const y = height - 18 - norm * (height - 30);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Draw LPC Formant Spectral Envelope (if enabled)
    if (showLpcEnvelope && lpcEnvelope && lpcEnvelope.length > 0) {
      ctx.beginPath();
      const numEnvPoints = lpcEnvelope.length;
      for (let i = 0; i < numEnvPoints; i++) {
        const freq = (i / numEnvPoints) * 5000;
        if (freq > maxDisplayFreq) break;
        const x = (freq / maxDisplayFreq) * width;
        const db = lpcEnvelope[i];
        // map dB to height
        const norm = Math.max(0, Math.min(1, (db + 50) / 60));
        const y = height - 18 - norm * (height - 35);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 4. Draw Harmonics vertical markers (H1 - H6)
    const harmonicKeys: HarmonicId[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    harmonicKeys.forEach((hKey) => {
      const hFreq = getHarmonicFreq(harmonics, hKey);
      if (hFreq > 0 && hFreq <= maxDisplayFreq) {
        const x = (hFreq / maxDisplayFreq) * width;
        const isSelected = selectedHarmonic === hKey;

        ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.setLineDash(isSelected ? [] : [3, 3]);

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 18);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label at top
        ctx.fillStyle = isSelected ? '#38bdf8' : '#0284c7';
        ctx.font = `bold ${isSelected ? 11 : 9}px "JetBrains Mono", monospace`;
        ctx.fillText(hKey, x + 2, isSelected ? 14 : 24);
      }
    });

    // 5. Draw Formants Markers (F1 - F5) with distinct colors & glowing dots
    const formantKeys: FormantId[] = ['F1', 'F2', 'F3', 'F4', 'F5'];
    formantKeys.forEach((fKey) => {
      const fObj = formants[fKey];
      if (fObj && fObj.freq > 0 && fObj.freq <= maxDisplayFreq) {
        const x = (fObj.freq / maxDisplayFreq) * width;
        const isSelected = selectedFormant === fKey;
        const color = FORMANT_COLORS[fKey];

        // Highlight beam for selected formant
        if (isSelected) {
          ctx.fillStyle = color.fill;
          ctx.fillRect(x - 12, 0, 24, height - 18);
        }

        ctx.strokeStyle = color.stroke;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 18);
        ctx.stroke();

        // Formant peak node circle
        ctx.fillStyle = color.stroke;
        ctx.beginPath();
        ctx.arc(x, 32, isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = color.text;
        ctx.font = `bold ${isSelected ? 12 : 10}px "JetBrains Mono", monospace`;
        ctx.fillText(`${fKey} (${Math.round(fObj.freq)})`, x - (isSelected ? 22 : 16), isSelected ? 48 : 20);
      }
    });

    // 6. Draw Alignment Bracket / Bridge between Selected Formant & Selected Harmonic
    const selFormantObj = formants[selectedFormant];
    const selFormantHz = selFormantObj ? selFormantObj.freq : 0;
    const selHarmonicHz = getHarmonicFreq(harmonics, selectedHarmonic);

    if (selFormantHz > 0 && selHarmonicHz > 0 && selFormantHz <= maxDisplayFreq && selHarmonicHz <= maxDisplayFreq) {
      const xF = (selFormantHz / maxDisplayFreq) * width;
      const xH = (selHarmonicHz / maxDisplayFreq) * width;
      const delta = Math.abs(selFormantHz - selHarmonicHz);
      const isLocked = delta <= 10;

      // Draw bridging arc / indicator at y = 60
      const bridgeY = 62;
      ctx.strokeStyle = isLocked ? '#34d399' : '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xF, bridgeY);
      ctx.lineTo(xH, bridgeY);
      ctx.stroke();

      // Delta label
      const midX = (xF + xH) / 2;
      ctx.fillStyle = isLocked ? '#34d399' : '#fbbf24';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      const labelText = isLocked ? '🎯 锁死' : `Δ ${Math.round(delta)}Hz`;
      ctx.fillText(labelText, Math.max(8, Math.min(width - 60, midX - 20)), bridgeY - 6);
    }
  }, [
    fftData,
    lpcEnvelope,
    pitch,
    harmonics,
    formants,
    selectedFormant,
    selectedHarmonic,
    sampleRate,
    maxDisplayFreq,
    showLpcEnvelope,
  ]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-[190px] bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-inner flex flex-col"
    >
      {/* Top Floating Overlay Controls */}
      <div className="absolute top-2.5 right-3 flex items-center gap-2 z-10">
        {/* Toggle LPC Formant Envelope curve */}
        <button
          onClick={() => setShowLpcEnvelope(!showLpcEnvelope)}
          className={`flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-md border transition ${
            showLpcEnvelope
              ? 'bg-amber-950/80 border-amber-600 text-amber-300'
              : 'bg-neutral-900/80 border-neutral-700 text-neutral-400'
          }`}
          title="显示/隐藏 LPC 共振峰平滑包络线"
        >
          <Eye className="w-3 h-3" />
          <span>LPC包络</span>
        </button>

        {/* Toggle 3kHz vs 5kHz range */}
        <button
          onClick={() => setMaxDisplayFreq(maxDisplayFreq === 5000 ? 3000 : 5000)}
          className="flex items-center gap-1 text-[11px] font-mono bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 px-2 py-1 rounded-md border border-neutral-700 transition"
          title="切换频宽缩放 (3kHz 人声核心 / 5kHz 全泛音列)"
        >
          {maxDisplayFreq === 5000 ? (
            <>
              <Maximize2 className="w-3 h-3 text-sky-400" />
              <span>0-5kHz</span>
            </>
          ) : (
            <>
              <Minimize2 className="w-3 h-3 text-sky-400" />
              <span>0-3kHz</span>
            </>
          )}
        </button>
      </div>

      {/* Legend Indicator in Top Left */}
      <div className="absolute top-2.5 left-3 flex items-center gap-3 z-10 pointer-events-none text-[10px] font-mono">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-1 bg-sky-400 rounded-full" />
          <span className="text-neutral-400">FFT频谱 / 泛音列</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-1 bg-amber-400 rounded-full" />
          <span className="text-neutral-400">声道共振包络 (LPC)</span>
        </div>
      </div>

      {/* Real-time Spectrum Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
