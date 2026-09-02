import React from 'react';
import { X, Sparkles, BookOpen, Volume2 } from 'lucide-react';

interface VowelGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VOWEL_CHART = [
  { vowel: '[i] (衣/ee)', f1: '270 - 320 Hz', f2: '2200 - 2600 Hz', jaw: '闭/微开', tongue: '前高舌位', tip: '高位置聚焦，F2极高，适合高泛音咬合' },
  { vowel: '[e] (诶/eh)', f1: '400 - 530 Hz', f2: '1800 - 2100 Hz', jaw: '半开', tongue: '前中舌位', tip: '常用于中高音区 (如男声换声区咬合 H2)' },
  { vowel: '[a] (啊/ah)', f1: '700 - 950 Hz', f2: '1100 - 1400 Hz', jaw: '完全张开', tongue: '低平舌位', tip: 'F1最高，最容易与高音的 H1 或中音的 H2 共鸣' },
  { vowel: '[o] (喔/oh)', f1: '450 - 550 Hz', f2: '800 - 1050 Hz', jaw: '半开/拢唇', tongue: '后中舌位', tip: '圆唇增长声道，使所有共振峰适度下移' },
  { vowel: '[u] (呜/oo)', f1: '280 - 350 Hz', f2: '750 - 950 Hz', jaw: '闭/收小唇', tongue: '后高舌位', tip: '最暗最闭元音，F1与F2均处于低频区' },
];

export const VowelGuideModal: React.FC<VowelGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">
              歌手共鸣调谐 (Resonance Tuning) 实用指南
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-neutral-300 leading-relaxed">
          {/* Core Concept */}
          <div className="bg-sky-950/40 border border-sky-800/60 rounded-xl p-3.5">
            <div className="flex items-center gap-2 font-bold text-sky-300 mb-1 text-sm">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>什么是共鸣调谐 (Resonance Tuning)？</span>
            </div>
            <p>
              声带发声会产生基频 (f0/H1) 和一系列整数倍泛音 (H2, H3, H4...)。声道（咽腔、口腔）是一个声学滤波器，其固有共鸣频率称为
              <strong className="text-amber-300"> 共振峰 (Formants F1-F5)</strong>。
              当歌手通过微调口型、下巴开合和舌位，使某个共振峰（如 F1）的频率精确重合于某个声带泛音（如 H2）时，就会触发
              <strong className="text-emerald-300"> 共鸣声能极大化 (Acoustic Boost)</strong>，声音无需费力就能响亮、通透、丰满！
            </p>
          </div>

          {/* Vowel Table */}
          <div>
            <h3 className="font-bold text-neutral-100 text-sm mb-2 flex items-center gap-1.5">
              <span>五大元音参考共振峰与声道状态</span>
            </h3>
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                    <th className="p-2 font-semibold">元音</th>
                    <th className="p-2 font-semibold">F1 (下巴)</th>
                    <th className="p-2 font-semibold">F2 (舌位)</th>
                    <th className="p-2 font-semibold hidden sm:table-cell">口型与状态</th>
                    <th className="p-2 font-semibold">调谐技巧</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                  {VOWEL_CHART.map((v) => (
                    <tr key={v.vowel} className="hover:bg-neutral-800/40">
                      <td className="p-2 font-bold text-amber-300">{v.vowel}</td>
                      <td className="p-2 text-neutral-200">{v.f1}</td>
                      <td className="p-2 text-neutral-200">{v.f2}</td>
                      <td className="p-2 text-neutral-400 font-sans hidden sm:table-cell">{v.jaw} · {v.tongue}</td>
                      <td className="p-2 text-neutral-300 font-sans">{v.tip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Practical Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-xl">
              <h4 className="font-bold text-amber-400 mb-1">🎯 经典调谐策略 1: F1 / H2 咬合</h4>
              <p className="text-neutral-400">
                常用于男声中高音区 (如 C4-G4) 或女声混声胸声区。例如唱 C4 (261.6Hz) 时，H2 位于 523Hz，若张开下巴唱 [e] 或 [o] 将 F1 调至 523Hz，声音会瞬间获得类似胸声的饱满力量。
              </p>
            </div>
            <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-xl">
              <h4 className="font-bold text-cyan-400 mb-1">🌟 歌唱家共鸣峰 (Singer's Formant F4/F5)</h4>
              <p className="text-neutral-400">
                在 2800 - 3800Hz 之间集聚的声能，被称为金属芯或穿透力。通过微缩会厌漏斗、保持喉头稳定放松，可使高频泛音即使在无麦克风或伴奏轰鸣下依然极具穿透力。
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 flex justify-end bg-neutral-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition"
          >
            开始调谐训练
          </button>
        </div>
      </div>
    </div>
  );
};
