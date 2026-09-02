import React, { useState } from 'react';
import { Download, HelpCircle, Mic, MicOff, Volume2, VolumeX, Sliders } from 'lucide-react';
import { downloadOfflineHtmlFile } from '../utils/offlineBundle';

interface HeaderProps {
  isRunning: boolean;
  onToggleMic: () => void;
  noiseGate: number;
  onNoiseGateChange: (val: number) => void;
  inputVolumeDb: number;
  onPlayTone: (freq: number) => void;
  onStopTone: () => void;
  onOpenGuide: () => void;
}

const TONE_PRESETS = [
  { label: 'C3 (130.8Hz)', freq: 130.81 },
  { label: 'A3 (220.0Hz)', freq: 220.0 },
  { label: 'C4 (261.6Hz)', freq: 261.63 },
  { label: 'E4 (329.6Hz)', freq: 329.63 },
  { label: 'G4 (392.0Hz)', freq: 392.0 },
  { label: 'A4 (440.0Hz)', freq: 440.0 },
  { label: 'C5 (523.3Hz)', freq: 523.25 },
];

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onToggleMic,
  noiseGate,
  onNoiseGateChange,
  inputVolumeDb,
  onPlayTone,
  onStopTone,
  onOpenGuide,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [playingTone, setPlayingTone] = useState<number | null>(null);

  const handleToneClick = (freq: number) => {
    if (playingTone === freq) {
      onStopTone();
      setPlayingTone(null);
    } else {
      onPlayTone(freq);
      setPlayingTone(freq);
    }
  };

  // Normalized input meter 0 to 100%
  const meterPercent = Math.max(0, Math.min(100, ((inputVolumeDb + 70) / 60) * 100));

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800 text-neutral-100 backdrop-blur-md shrink-0">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-400">
          <Mic className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">
              歌手共鸣调谐仪
            </h1>
            <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-sky-950 text-sky-400 border border-sky-800/60">
              Resonance Tuning
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 hidden sm:block">
            实时音高 · 泛音列分析 · F1-F5共振峰咬合训练
          </p>
        </div>
      </div>

      {/* Center Input Meter */}
      <div className="hidden md:flex items-center gap-2 bg-neutral-950/80 px-3 py-1.5 rounded-lg border border-neutral-800">
        <span className="text-[11px] font-mono text-neutral-400">输入电平</span>
        <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-75 ${
              inputVolumeDb > noiseGate ? 'bg-emerald-400' : 'bg-neutral-600'
            }`}
            style={{ width: `${meterPercent}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-neutral-400 w-12 text-right">
          {inputVolumeDb > -90 ? `${inputVolumeDb} dB` : '-∞ dB'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Pitch Tone Reference Dropdown / Quick Button */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1.5 rounded-lg border border-neutral-700 transition"
            title="基准音与灵敏度"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">设置与发音参考</span>
          </button>

          {showSettings && (
            <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-neutral-700 rounded-xl p-3 shadow-2xl z-50 text-xs">
              <div className="font-semibold text-neutral-200 mb-2 flex items-center justify-between">
                <span>🎵 基准参考音 (点击发声)</span>
                {playingTone && (
                  <button
                    onClick={() => {
                      onStopTone();
                      setPlayingTone(null);
                    }}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    静音
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {TONE_PRESETS.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => handleToneClick(t.freq)}
                    className={`py-1 px-2 rounded font-mono text-[11px] border transition ${
                      playingTone === t.freq
                        ? 'bg-sky-600 text-white border-sky-400 font-bold'
                        : 'bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-neutral-800 pt-2.5">
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>静音门限 (Noise Gate)</span>
                  <span className="font-mono text-neutral-200">{noiseGate} dB</span>
                </div>
                <input
                  type="range"
                  min="-70"
                  max="-30"
                  step="1"
                  value={noiseGate}
                  onChange={(e) => onNoiseGateChange(Number(e.target.value))}
                  className="w-full accent-sky-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  调高可过滤环境噪音，只在演唱时触发检测。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Vowel Acoustic Guide Button */}
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1.5 rounded-lg border border-neutral-700 transition"
          title="共鸣与元音修正指南"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">共鸣原理</span>
        </button>

        {/* Offline HTML Download Button */}
        <button
          onClick={downloadOfflineHtmlFile}
          className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-sm transition border border-emerald-500/40"
          title="下载离线单文件HTML，在任何设备无网使用"
        >
          <Download className="w-3.5 h-3.5" />
          <span>离线单文件下载</span>
        </button>

        {/* Microphone Toggle Button */}
        <button
          onClick={onToggleMic}
          className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg transition shadow-md border ${
            isRunning
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 animate-pulse'
              : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400'
          }`}
        >
          {isRunning ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>停止监听</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>开启麦克风</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
