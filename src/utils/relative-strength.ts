/**
 * Relative-strength scorer: stock vs sector vs market (three-layer).
 *
 * Raw scores are the difference in return scaled to -100..100, then
 * averaged into a composite. Tier labels follow fixed thresholds.
 *
 * Pure function — no IO, no globals, deterministic.
 */

export interface RsInputs {
  stockReturn: number;   // e.g. 0.08 for +8 %
  sectorReturn: number;
  marketReturn: number;
}

export interface RsScores {
  vsSector: number;   // -100..100 (capped); positive = stronger than sector
  vsMarket: number;
  composite: number;  // average of vsSector and vsMarket, also -100..100
  tier: 'leader' | 'strong' | 'neutral' | 'weak' | 'laggard';
}

/** Scale a return-difference to -100..100.
 *  Inputs are fractions (e.g. 0.08 for +8%).
 *  A ±1.0 (±100%) difference maps to ±100; capped beyond that.
 */
function scaleDiff(diff: number): number {
  const scaled = diff * 100;
  return Math.max(-100, Math.min(100, scaled));
}

function toTier(composite: number): RsScores['tier'] {
  if (composite >= 40) return 'leader';
  if (composite >= 10) return 'strong';
  if (composite > -10) return 'neutral';
  if (composite > -40) return 'weak';
  return 'laggard';
}

export function relativeStrength(inputs: RsInputs): RsScores {
  const { stockReturn, sectorReturn, marketReturn } = inputs;

  const vsSector = scaleDiff(stockReturn - sectorReturn);
  const vsMarket = scaleDiff(stockReturn - marketReturn);
  const composite = Math.max(-100, Math.min(100, (vsSector + vsMarket) / 2));

  return {
    vsSector,
    vsMarket,
    composite,
    tier: toTier(composite),
  };
}
