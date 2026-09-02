import React from 'react';
import { AlignmentComparison, FormantId, HarmonicId } from '../types';
import { ArrowDown, ArrowUp, CheckCircle2, Mic } from 'lucide-react';

interface ResonanceTuningAlignerProps {
  alignment: AlignmentComparison;
  selectedFormant: FormantId;
  selectedHarmonic: HarmonicId;
  onSelectFormant: (f: FormantId) => void;
  onSelectHarmonic: (h: HarmonicId) => void;
}

const FORMANT_OPTIONS: FormantId[] = ['F1', 'F2', 'F3', 'F4', 'F5'];
const HARMONIC_OPTIONS: HarmonicId[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

export const ResonanceTuningAligner: React.FC<ResonanceTuningAlignerProps> = ({
  alignment,
  selectedFormant,
  selectedHarmonic,
  onSelectFormant,
  onSelectHarmonic,
}) => {
  // Delta gauge needle position (-100Hz to +100Hz mapped to 0% to 100%)
  const clampedDelta = Math.max(-80, Math.min(80, alignment.deltaHz));
  const needlePercent = ((clampedDelta + 80) / 160) * 100;
  const isAligned = alignment.status === 'aligned';

  return (
    <div className="bg-neutral-900/95 border border-neutral-800 rounded-xl p-3 shadow-lg flex flex-col gap-2.5">
      {/* Target Selector Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-2.5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Formant Choice */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-400">共振峰:</span>
            <div className="flex gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              {FORMANT_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => onSelectFormant(f)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                    selectedFormant === f
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <span className="text-neutral-600 font-bold hidden sm:inline">对齐至</span>

          {/* Harmonic Choice */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-400">基频/泛音:</span>
            <div className="flex gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              {HARMONIC_OPTIONS.map((h) => (
                <button
                  key={h}
                  onClick={() => onSelectHarmonic(h)}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition ${
                    selectedHarmonic === h
                      ? 'bg-sky-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  {h === 'H1' ? 'f0 (H1)' : h}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current values readout */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="text-neutral-400">
            {selectedFormant}: <span className="font-bold text-amber-400">{alignment.formantFreq} Hz</span>
          </div>
          <span className="text-neutral-600">vs</span>
          <div className="text-neutral-400">
            {selectedHarmonic}: <span className="font-bold text-sky-400">{alignment.harmonicFreq} Hz</span>
          </div>
        </div>
      </div>

      {/* Real-Time Concise Guidance Feedback Banner */}
      <div
        className={`p-3 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors ${
          alignment.status === 'aligned'
            ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200'
            : alignment.status === 'below'
            ? 'bg-amber-950/50 border-amber-500/70 text-amber-200'
            : alignment.status === 'above'
            ? 'bg-purple-950/50 border-purple-500/70 text-purple-200'
            : 'bg-neutral-950/60 border-neutral-800 text-neutral-400'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0">
            {alignment.status === 'aligned' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : alignment.status === 'below' ? (
              <ArrowDown className="w-5 h-5 text-amber-400 animate-bounce" />
            ) : alignment.status === 'above' ? (
              <ArrowUp className="w-5 h-5 text-purple-400 animate-bounce" />
            ) : (
              <Mic className="w-5 h-5 text-neutral-500" />
            )}
          </div>
          <div>
            {/* The concise feedback message requested by user */}
            <div className="text-sm font-extrabold tracking-wide flex items-center gap-2">
              <span>{alignment.shortMessage}</span>
            </div>
            {/* Vocal tract adjustment hint */}
            <div className="text-xs opacity-90 mt-0.5 font-normal">
              {alignment.detailedHint}
            </div>
          </div>
        </div>

        {/* Delta Gauge Meter */}
        <div className="flex flex-col items-end shrink-0 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span>差值:</span>
            <span
              className={`text-sm px-2 py-0.5 rounded ${
                isAligned
                  ? 'bg-emerald-900/80 text-emerald-300'
                  : 'bg-neutral-900 text-neutral-200'
              }`}
            >
              {alignment.deltaHz > 0 ? `+${alignment.deltaHz}` : alignment.deltaHz} Hz
            </span>
          </div>

          {/* Visual Alignment Track */}
          <div className="w-44 h-2 bg-neutral-950 rounded-full relative mt-1.5 overflow-hidden border border-neutral-800">
            <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-full bg-emerald-500/60 z-10" />
            <div
              className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-75 ${
                isAligned
                  ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                  : alignment.status === 'below'
                  ? 'bg-amber-400'
                  : 'bg-purple-400'
              }`}
              style={{ left: `calc(${needlePercent}% - 5px)` }}
            />
          </div>
          <div className="flex justify-between w-44 text-[8px] font-mono text-neutral-500 mt-0.5">
            <span>偏低 (-80Hz)</span>
            <span>完美对齐 (0)</span>
            <span>偏高 (+80Hz)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
