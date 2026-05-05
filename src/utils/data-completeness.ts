// Data completeness scoring utility — pure, no external deps.

export interface TickerDict {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any; // intentional bag-of-fields
}

export interface CompletenessResult {
  pct: number;
  filledCount: number;
  totalCount: number;
  missing: string[];
  tier: 'excellent' | 'good' | 'partial' | 'sparse';
}

export const DEFAULT_FIELDS_TW = [
  'indicators', 'chip', 'news', 'announcements', 'signals',
  'revenue', 'holders', 'broker_concentration', 'chip_streaks',
  'news_sentiment', 'lending', 'buyback', 'price_history', 'orderbook',
] as const;

export const DEFAULT_FIELDS_US = [
  'indicators', 'ownership', 'fundamentals', 'risk', 'insider_cluster',
  'short_interest', 'options_flow', 'news', 'news_sentiment', 'signals',
  'price_history', 'sector_rs',
] as const;

// TODO: Verify field names against dappgo-options-app once it migrates to
// the shared data-completeness utility. Current keys are drawn from
// options-daily-report/dashboard/data.json (the canonical data schema).
// Candidate additions: 'chains', 'iv_surface', 'flow', 'risk_metrics',
// 'earnings_date' — add when the Options app adopts this utility.
export const DEFAULT_FIELDS_OPTIONS = [
  'live_prices', 'options_matrices', 'oi_distribution', 'timing',
  'ticker_stats', 'strategy_stats', 'recent_trades', 'cumulative_pnl',
  'summary',
] as const;

/**
 * A field is "filled" when it is truthy OR the number zero,
 * AND is not an empty array or empty object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFieldFilled(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return true; // 0 is data
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return Boolean(value);
}

function tierOf(pct: number): CompletenessResult['tier'] {
  if (pct >= 90) return 'excellent';
  if (pct >= 70) return 'good';
  if (pct >= 40) return 'partial';
  return 'sparse';
}

export function computeCompleteness(
  ticker: TickerDict,
  fields: readonly string[],
): CompletenessResult {
  const totalCount = fields.length;
  if (totalCount === 0) {
    return { pct: 100, filledCount: 0, totalCount: 0, missing: [], tier: 'excellent' };
  }

  const missing: string[] = [];
  let filledCount = 0;

  for (const field of fields) {
    if (isFieldFilled(ticker[field])) {
      filledCount++;
    } else {
      missing.push(field);
    }
  }

  const pct = Math.round((filledCount / totalCount) * 100);

  return { pct, filledCount, totalCount, missing, tier: tierOf(pct) };
}
