import React from 'react';
import { HarmonicId, HarmonicsData, PitchResult } from '../types';

interface PitchHarmonicsHeaderProps {
  pitch: PitchResult;
  harmonics: HarmonicsData;
  selectedHarmonic: HarmonicId;
  onSelectHarmonic: (h: HarmonicId) => void;
}

export const PitchHarmonicsHeader: React.FC<PitchHarmonicsHeaderProps> = ({
  pitch,
  harmonics,
  selectedHarmonic,
  onSelectHarmonic,
}) => {
  const isVoiced = pitch.isVoiced && pitch.frequency > 0;

  // Cents indicator position (-50 to +50 cents maps to 0% to 100%)
  const clampedCents = Math.max(-50, Math.min(50, pitch.cents));
  const centsPositionPercent = ((clampedCents + 50) / 100) * 100;
  const isPitchAccurate = Math.abs(pitch.cents) <= 8;

  const harmonicsList: { id: HarmonicId; label: string; value: number; multiplier: number }[] = [
    { id: 'H2', label: 'H2', value: harmonics.h2, multiplier: 2 },
    { id: 'H3', label: 'H3', value: harmonics.h3, multiplier: 3 },
    { id: 'H4', label: 'H4', value: harmonics.h4, multiplier: 4 },
    { id: 'H5', label: 'H5', value: harmonics.h5, multiplier: 5 },
    { id: 'H6', label: 'H6', value: harmonics.h6, multiplier: 6 },
  ];

  return (
    <div className="bg-neutral-900/95 border border-neutral-800 rounded-xl p-3 shadow-lg flex flex-col md:flex-row items-stretch md:items-center gap-3">
      {/* Pitch & Fundamental frequency Block */}
      <div className="flex items-center gap-3 bg-neutral-950/90 border border-neutral-800/80 rounded-lg px-3.5 py-2 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
            当前音高 (Pitch)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-sky-400 leading-none">
              {isVoiced ? pitch.noteName : '--'}
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold font-mono text-neutral-100 leading-none">
                {isVoiced ? `${pitch.frequency.toFixed(1)} Hz` : '0.0 Hz'}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">基频 f0 (H1)</span>
            </div>
          </div>
        </div>

        {/* Pitch Cents Tuner Needle */}
        <div className="flex flex-col items-center justify-center border-l border-neutral-800 pl-3 min-w-[90px]">
          <div className="text-[10px] font-mono flex items-center gap-1 mb-1">
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                isPitchAccurate && isVoiced
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {isVoiced ? `${pitch.cents > 0 ? '+' : ''}${pitch.cents} cent` : '±0 cent'}
            </span>
          </div>
          {/* Cent meter bar */}
          <div className="w-20 h-1.5 bg-neutral-800 rounded-full relative overflow-hidden">
            <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full bg-neutral-600 z-10" />
            <div
              className={`absolute top-0 bottom-0 w-2 rounded-full transition-all duration-75 ${
                isPitchAccurate ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
              }`}
              style={{ left: `calc(${centsPositionPercent}% - 4px)` }}
            />
          </div>
          <div className="flex justify-between w-20 text-[8px] font-mono text-neutral-500 mt-0.5">
            <span>-50</span>
            <span>0</span>
            <span>+50</span>
          </div>
        </div>
      </div>

      {/* Harmonics List: H2: xx, H3: xx, H4: xx, H5: xx, H6: xx */}
      <div className="flex-1 flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {harmonicsList.map((item) => {
          const isSelected = selectedHarmonic === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectHarmonic(item.id)}
              className={`flex-1 min-w-[95px] flex items-center justify-between px-2.5 py-2 rounded-lg border transition text-left ${
                isSelected
                  ? 'bg-sky-950/80 border-sky-400 text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.2)] ring-1 ring-sky-400'
                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
              }`}
              title={`点击将 ${item.label} 作为共鸣对齐目标`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-black font-mono text-sky-400">
                  {item.label}：
                </span>
                <span className="text-[9px] text-neutral-500 font-mono">
                  {item.multiplier}×f0
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-neutral-100">
                  {isVoiced && item.value > 0 ? `${item.value.toFixed(1)}` : '--'}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono ml-0.5">Hz</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
