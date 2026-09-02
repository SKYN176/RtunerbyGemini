import { AlignmentComparison, FormantEstimate, FormantId, HarmonicId, HarmonicsData, PitchResult } from '../types';

export function getHarmonicFreq(harmonics: HarmonicsData, harmonicId: HarmonicId): number {
  switch (harmonicId) {
    case 'H1':
      return harmonics.h1;
    case 'H2':
      return harmonics.h2;
    case 'H3':
      return harmonics.h3;
    case 'H4':
      return harmonics.h4;
    case 'H5':
      return harmonics.h5;
    case 'H6':
      return harmonics.h6;
    default:
      return 0;
  }
}

/**
 * Compare target formant against target harmonic and generate concise feedback for singer
 */
export function calculateResonanceAlignment(
  formantId: FormantId,
  harmonicId: HarmonicId,
  formants: Record<FormantId, FormantEstimate>,
  harmonics: HarmonicsData,
  pitch: PitchResult,
  toleranceHz = 10
): AlignmentComparison {
  const fObj = formants[formantId];
  const formantFreq = fObj ? fObj.freq : 0;
  const harmonicFreq = getHarmonicFreq(harmonics, harmonicId);

  if (!pitch.isVoiced || formantFreq <= 0 || harmonicFreq <= 0) {
    return {
      formantId,
      harmonicId,
      formantFreq: 0,
      harmonicFreq: 0,
      deltaHz: 0,
      deltaCents: 0,
      status: 'silent',
      shortMessage: '🎤 请开嗓发声（长音或元音）...',
      detailedHint: '发声稳定持续后，即可实时查看共鸣对齐反馈',
    };
  }

  const deltaHz = Math.round(formantFreq - harmonicFreq);
  const deltaCents = Math.round(1200 * Math.log2(formantFreq / harmonicFreq));
  const absDelta = Math.abs(deltaHz);

  let status: 'below' | 'aligned' | 'above' = 'aligned';
  let shortMessage = '';
  let detailedHint = '';

  if (absDelta <= toleranceHz) {
    status = 'aligned';
    shortMessage = `🎯 ${formantId} 与 ${harmonicId} 完美对齐！（相差 ${absDelta} Hz）`;
    detailedHint = `共鸣锁死增强中！当前 ${formantId} (${Math.round(formantFreq)}Hz) 精准增益 ${harmonicId} (${Math.round(harmonicFreq)}Hz)，声音丰满度与穿透力达到峰值。`;
  } else if (deltaHz < 0) {
    status = 'below';
    shortMessage = `⬇️ ${formantId} 低于 ${harmonicId} 约 ${absDelta} Hz`;
    if (formantId === 'F1') {
      detailedHint = `提示：略微张开下巴 / 咽腔微收 / 略偏向 [a] / [ɑ] 元音，以提升 F1 频率匹配 ${harmonicId}。`;
    } else if (formantId === 'F2') {
      detailedHint = `提示：舌位略微向前抬起 / 偏向 [e] / [i] 元音，以提升 F2 频率匹配 ${harmonicId}。`;
    } else {
      detailedHint = `提示：略微收紧会厌漏斗 / 寻找更明亮的金属音色感 (Twang)，以提升 ${formantId}。`;
    }
  } else {
    status = 'above';
    shortMessage = `⬆️ ${formantId} 高于 ${harmonicId} 约 ${absDelta} Hz`;
    if (formantId === 'F1') {
      detailedHint = `提示：略微微闭下巴 / 放松喉头 / 略偏向 [o] / [u] 元音，以降低 F1 频率匹配 ${harmonicId}。`;
    } else if (formantId === 'F2') {
      detailedHint = `提示：舌位略后缩 / 嘴唇微拢圆 / 偏向 [o] / [u] 元音，以降低 F2 频率匹配 ${harmonicId}。`;
    } else {
      detailedHint = `提示：适度放下喉位 / 放松咽壁空间，以降低 ${formantId}。`;
    }
  }

  return {
    formantId,
    harmonicId,
    formantFreq: Math.round(formantFreq),
    harmonicFreq: Math.round(harmonicFreq),
    deltaHz,
    deltaCents,
    status,
    shortMessage,
    detailedHint,
  };
}
