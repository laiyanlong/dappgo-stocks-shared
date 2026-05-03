/**
 * Verdict-explainer: turns the engine's verdict + signals + contributions
 * into a human-readable two-sentence explanation.
 *
 * Pure function, locale-aware, no IO, no external dependencies.
 */

export type Verdict = 'BUY' | 'HOLD' | 'WATCH' | 'AVOID' | 'SELL';

export interface SignalsLike {
  trend_label?: string | null;
  trend_reason?: string | null;
  momentum_label?: string | null;
  momentum_reason?: string | null;
  volume_label?: string | null;
  volume_reason?: string | null;
  // TW uses chip_*, US uses ownership_*
  chip_label?: string | null;
  chip_reason?: string | null;
  ownership_label?: string | null;
  ownership_reason?: string | null;
  verdict?: Verdict | string | null;
  verdict_reason?: string | null;
  contributions?: {
    trend?: number;
    momentum?: number;
    volume?: number;
    chip?: number;
    ownership?: number;
  } | null;
}

export interface VerdictExplanation {
  headline: string;
  detail: string;
  bullets: string[];
  dominantAxis: 'trend' | 'momentum' | 'volume' | 'chip' | 'ownership' | null;
}

type Axis = 'trend' | 'momentum' | 'volume' | 'chip' | 'ownership';

// Tie-break order: trend > momentum > volume > chip/ownership (chip first)
const AXIS_PRIORITY: Axis[] = ['trend', 'momentum', 'volume', 'chip', 'ownership'];

const VERDICT_ZH: Record<string, string> = {
  BUY: '買進',
  HOLD: '持有',
  WATCH: '觀望',
  AVOID: '避開',
  SELL: '賣出',
};

const VERDICT_EN: Record<string, string> = {
  BUY: 'Buy',
  HOLD: 'Hold',
  WATCH: 'Watch',
  AVOID: 'Avoid',
  SELL: 'Sell',
};

const AXIS_ZH: Record<Axis, string> = {
  trend: '趨勢',
  momentum: '動能',
  volume: '量能',
  chip: '籌碼',
  ownership: '機構',
};

const AXIS_EN: Record<Axis, string> = {
  trend: 'Trend',
  momentum: 'Momentum',
  volume: 'Volume',
  chip: 'Chips',
  ownership: 'Ownership',
};

const EMPTY_ZH: VerdictExplanation = {
  headline: '無足夠資訊',
  detail: '',
  bullets: [],
  dominantAxis: null,
};

const EMPTY_EN: VerdictExplanation = {
  headline: 'Insufficient data',
  detail: '',
  bullets: [],
  dominantAxis: null,
};

function getReason(input: SignalsLike, axis: Axis): string | null {
  switch (axis) {
    case 'trend':     return input.trend_reason     ?? null;
    case 'momentum':  return input.momentum_reason  ?? null;
    case 'volume':    return input.volume_reason     ?? null;
    case 'chip':      return input.chip_reason       ?? null;
    case 'ownership': return input.ownership_reason  ?? null;
  }
}

function getDominantAxis(
  contributions: NonNullable<SignalsLike['contributions']>,
): Axis | null {
  let best: Axis | null = null;
  let bestAbs = -1;

  for (const axis of AXIS_PRIORITY) {
    const val = contributions[axis];
    if (val == null) continue;
    const abs = Math.abs(val);
    if (abs > bestAbs) {
      bestAbs = abs;
      best = axis;
    }
  }

  return best;
}

function axesByContribDesc(
  contributions: NonNullable<SignalsLike['contributions']>,
): Axis[] {
  return AXIS_PRIORITY
    .filter((a) => contributions[a] != null)
    .sort((a, b) => {
      const absA = Math.abs(contributions[a] ?? 0);
      const absB = Math.abs(contributions[b] ?? 0);
      if (absB !== absA) return absB - absA;
      // stable tie-break via AXIS_PRIORITY order
      return AXIS_PRIORITY.indexOf(a) - AXIS_PRIORITY.indexOf(b);
    });
}

export function explainVerdict(
  input: SignalsLike | null | undefined,
  locale: 'zh-TW' | 'en-US' = 'zh-TW',
): VerdictExplanation {
  const isZH = locale === 'zh-TW';
  const empty = isZH ? EMPTY_ZH : EMPTY_EN;

  if (input == null) return empty;

  const verdictCode = (input.verdict ?? '').toUpperCase();
  if (!verdictCode) return empty;

  const verdictDisplay = isZH
    ? (VERDICT_ZH[verdictCode] ?? verdictCode)
    : (VERDICT_EN[verdictCode] ?? verdictCode);

  // --- dominant axis ---
  const contributions = input.contributions ?? {};
  const hasContributions = Object.values(contributions).some((v) => v != null);

  const dominantAxis: Axis | null = hasContributions
    ? getDominantAxis(contributions)
    : null;

  // --- headline ---
  let headline: string;
  if (isZH) {
    const axisLabel = dominantAxis ? AXIS_ZH[dominantAxis] : null;
    headline = axisLabel
      ? `「${verdictDisplay} — ${axisLabel}主導」`
      : `「${verdictDisplay}」`;
  } else {
    const axisLabel = dominantAxis ? AXIS_EN[dominantAxis] : null;
    headline = axisLabel
      ? `${verdictDisplay} — ${axisLabel}-led`
      : verdictDisplay;
  }

  // --- detail ---
  const topAxes = hasContributions ? axesByContribDesc(contributions) : [];
  const primaryReason =
    input.verdict_reason ||
    (topAxes[0] ? getReason(input, topAxes[0]) : null) ||
    '';
  const secondaryReason =
    (topAxes[1] ? getReason(input, topAxes[1]) : null) || '';

  let detail: string;
  if (primaryReason && secondaryReason) {
    detail = isZH
      ? `${primaryReason}；${secondaryReason}`
      : `${primaryReason}; ${secondaryReason}`;
  } else {
    detail = primaryReason || secondaryReason;
  }

  // --- bullets (top 4 axes by |contribution| desc) ---
  const bulletAxes = topAxes.slice(0, 4);
  const bullets: string[] = bulletAxes
    .map((axis) => {
      const reason = getReason(input, axis);
      if (!reason) return null;
      const label = isZH ? AXIS_ZH[axis] : AXIS_EN[axis];
      return isZH ? `「${label}: ${reason}」` : `${label}: ${reason}`;
    })
    .filter((b): b is string => b !== null);

  return { headline, detail, bullets, dominantAxis };
}
