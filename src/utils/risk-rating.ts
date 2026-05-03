/**
 * Risk-rating classifier: combines beta + max-drawdown + 30-day HV
 * into a 1–5 ordinal score with emoji and Chinese label.
 *
 * Scoring rules (additive points, then clamp to 1–5):
 *   - Start at base score 1.
 *   - beta > 1.6              → +1
 *   - maxDrawdownPct < -30    → +1
 *   - hv30 > 50               → +1
 *   - beta > 2                → +2 (instead of +1 above, i.e. +1 more)
 *   - maxDrawdownPct < -50    → +2 (instead of +1 above, i.e. +1 more)
 *   - If no known fields are provided → return conservative middle (3).
 *
 * Pure function — no IO, no globals, deterministic.
 */

export interface RiskInputs {
  beta?: number | null;
  maxDrawdownPct?: number | null;   // e.g. -28  (negative)
  hv30?: number | null;             // 30-day historical volatility, annualised %
}

export interface RiskRating {
  score: 1 | 2 | 3 | 4 | 5;
  emoji: '🟢' | '🟡' | '🟠' | '🔴' | '⚫';
  label: '低' | '中低' | '中' | '中高' | '高';
  reasons: string[];
}

const EMOJI_MAP: Record<number, RiskRating['emoji']> = {
  1: '🟢',
  2: '🟡',
  3: '🟠',
  4: '🔴',
  5: '⚫',
};

const LABEL_MAP: Record<number, RiskRating['label']> = {
  1: '低',
  2: '中低',
  3: '中',
  4: '中高',
  5: '高',
};

function isKnown(v: number | null | undefined): v is number {
  return v !== null && v !== undefined;
}

export function riskRating(inputs: RiskInputs): RiskRating {
  const { beta, maxDrawdownPct, hv30 } = inputs;

  const hasAny = isKnown(beta) || isKnown(maxDrawdownPct) || isKnown(hv30);
  if (!hasAny) {
    return { score: 3, emoji: '🟠', label: '中', reasons: ['資料不足，保守估中風險'] };
  }

  let points = 0;
  const reasons: string[] = [];

  if (isKnown(beta)) {
    if (beta > 2) {
      points += 2;
      reasons.push(`Beta ${beta.toFixed(2)} > 2（極高波動）`);
    } else if (beta > 1.6) {
      points += 1;
      reasons.push(`Beta ${beta.toFixed(2)} > 1.6（偏高波動）`);
    }
  }

  if (isKnown(maxDrawdownPct)) {
    if (maxDrawdownPct < -50) {
      points += 2;
      reasons.push(`最大回撤 ${maxDrawdownPct.toFixed(1)}% < -50%（極深）`);
    } else if (maxDrawdownPct < -30) {
      points += 1;
      reasons.push(`最大回撤 ${maxDrawdownPct.toFixed(1)}% < -30%（偏深）`);
    }
  }

  if (isKnown(hv30) && hv30 > 50) {
    points += 1;
    reasons.push(`30日年化波動率 ${hv30.toFixed(1)}% > 50%`);
  }

  const raw = 1 + points;
  const score = Math.max(1, Math.min(5, raw)) as RiskRating['score'];

  return {
    score,
    emoji: EMOJI_MAP[score],
    label: LABEL_MAP[score],
    reasons,
  };
}
