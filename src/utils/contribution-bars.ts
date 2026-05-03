/**
 * Contribution-bars helper: converts a signals.contributions map into
 * bar-chart segments for explainability UI display.
 *
 * Each axis score is in the range -2..+2 (integer or float).
 * Width is proportional to the axis with the largest absolute score.
 * Composite score is the sum of all axes; tier thresholds:
 *   >= 4  → strong_bull
 *   >= 1  → mild_bull
 *   > -1  → neutral
 *   > -4  → mild_bear
 *   else  → strong_bear
 *
 * Pure function — no IO, no globals, deterministic.
 */

export interface ContributionInput {
  [axis: string]: number;
}

export interface ContributionBar {
  axis: string;
  score: number;
  widthPct: number;
  side: 'positive' | 'negative' | 'zero';
  tone: 'strong_positive' | 'mild_positive' | 'neutral' | 'mild_negative' | 'strong_negative';
}

export interface ContributionDisplay {
  bars: ContributionBar[];
  compositeScore: number;
  compositeTier: 'strong_bull' | 'mild_bull' | 'neutral' | 'mild_bear' | 'strong_bear';
}

type ToneType = ContributionBar['tone'];
type SideType = ContributionBar['side'];
type TierType = ContributionDisplay['compositeTier'];

function deriveTone(score: number): ToneType {
  const abs = Math.abs(score);
  if (score === 0) return 'neutral';
  if (abs >= 2) return score > 0 ? 'strong_positive' : 'strong_negative';
  return score > 0 ? 'mild_positive' : 'mild_negative';
}

function deriveSide(score: number): SideType {
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'zero';
}

function deriveTier(compositeScore: number): TierType {
  if (compositeScore >= 4)  return 'strong_bull';
  if (compositeScore >= 1)  return 'mild_bull';
  if (compositeScore > -1)  return 'neutral';
  if (compositeScore > -4)  return 'mild_bear';
  return 'strong_bear';
}

const EMPTY_DISPLAY: ContributionDisplay = {
  bars: [],
  compositeScore: 0,
  compositeTier: 'neutral',
};

export function contributionBars(
  input: ContributionInput | null | undefined,
): ContributionDisplay {
  if (input == null) return EMPTY_DISPLAY;

  const entries = Object.entries(input);
  if (entries.length === 0) return EMPTY_DISPLAY;

  const maxAbs = entries.reduce((m, [, v]) => Math.max(m, Math.abs(v)), 0);
  const compositeScore = entries.reduce((sum, [, v]) => sum + v, 0);

  const bars: ContributionBar[] = entries.map(([axis, score]) => ({
    axis,
    score,
    widthPct: maxAbs === 0 ? 0 : (Math.abs(score) / maxAbs) * 100,
    side: deriveSide(score),
    tone: deriveTone(score),
  }));

  return {
    bars,
    compositeScore,
    compositeTier: deriveTier(compositeScore),
  };
}
