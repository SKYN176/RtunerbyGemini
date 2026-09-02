import React from 'react';
import { FormantEstimate, FormantId, PitchResult } from '../types';

interface FormantsPanelProps {
  formants: Record<FormantId, FormantEstimate>;
  selectedFormant: FormantId;
  onSelectFormant: (f: FormantId) => void;
  pitch: PitchResult;
}

const FORMANT_META: Record<
  FormantId,
  {
    title: string;
    sub: string;
    range: string;
    colorBorder: string;
    colorBg: string;
    colorText: string;
    colorAccent: string;
  }
> = {
  F1: {
    title: 'F1 第一共振峰',
    sub: '下巴开合度 / 口咽腔',
    range: '约 250 ~ 950 Hz',
    colorBorder: 'border-amber-500/60',
    colorBg: 'bg-amber-950/30',
    colorText: 'text-amber-400',
    colorAccent: '#f59e0b',
  },
  F2: {
    title: 'F2 第二共振峰',
    sub: '舌位前后 / 口腔容积',
    range: '约 750 ~ 2700 Hz',
    colorBorder: 'border-pink-500/60',
    colorBg: 'bg-pink-950/30',
    colorText: 'text-pink-400',
    colorAccent: '#ec4899',
  },
  F3: {
    title: 'F3 第三共振峰',
    sub: '舌尖与喉口会厌 / 明亮感',
    range: '约 2100 ~ 3400 Hz',
    colorBorder: 'border-purple-500/60',
    colorBg: 'bg-purple-950/30',
    colorText: 'text-purple-400',
    colorAccent: '#a855f7',
  },
  F4: {
    title: 'F4 歌唱家共鸣峰',
    sub: '金属芯穿透力 (Singer’s Formant)',
    range: '约 3200 ~ 4200 Hz',
    colorBorder: 'border-cyan-500/60',
    colorBg: 'bg-cyan-950/30',
    colorText: 'text-cyan-400',
    colorAccent: '#06b6d4',
  },
  F5: {
    title: 'F5 高频气声辉光',
    sub: '极高频泛音包络延伸',
    range: '约 4000 ~ 5200 Hz',
    colorBorder: 'border-emerald-500/60',
    colorBg: 'bg-emerald-950/30',
    colorText: 'text-emerald-400',
    colorAccent: '#10b981',
  },
};

export const FormantsPanel: React.FC<FormantsPanelProps> = ({
  formants,
  selectedFormant,
  onSelectFormant,
  pitch,
}) => {
  const formantKeys: FormantId[] = ['F1', 'F2', 'F3', 'F4', 'F5'];
  const isVoiced = pitch.isVoiced && pitch.frequency > 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {formantKeys.map((fId) => {
        const item = formants[fId];
        const meta = FORMANT_META[fId];
        const isSelected = selectedFormant === fId;

        return (
          <button
            key={fId}
            onClick={() => onSelectFormant(fId)}
            className={`flex flex-col text-left p-2.5 rounded-xl border transition relative overflow-hidden ${
              isSelected
                ? `${meta.colorBg} ${meta.colorBorder} ring-2 ring-[${meta.colorAccent}] shadow-lg`
                : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between w-full mb-1">
              <span className={`text-xs font-bold ${meta.colorText}`}>
                {fId}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {meta.range}
              </span>
            </div>

            {/* Formant Frequency Readout */}
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="text-xl font-extrabold font-mono text-neutral-100">
                {isVoiced && item && item.freq > 0 ? Math.round(item.freq) : (item ? Math.round(item.freq) : '--')}
              </span>
              <span className="text-xs font-mono text-neutral-400">Hz</span>
            </div>

            {/* Vocal tract description */}
            <div className="text-[11px] text-neutral-300 font-medium truncate w-full">
              {meta.sub}
            </div>
            <div className="text-[10px] text-neutral-500 truncate w-full mt-0.5">
              {item ? item.articulatoryRole : ''}
            </div>

            {/* Selected Tag */}
            {isSelected && (
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
            )}
          </button>
        );
      })}
    </div>
  );
};
