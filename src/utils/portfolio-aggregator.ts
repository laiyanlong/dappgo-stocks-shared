/**
 * portfolio-aggregator — rolls up a watchlist into at-a-glance portfolio stats.
 * Pure function, no IO, no external deps.
 *
 * Sentiment thresholds (mirror dashboard-summary.ts logic, mapped to 5 levels):
 *   bull        bullPct >= 0.60
 *   mild_bull   bullPct >= 0.40
 *   bear        bearPct >= 0.60
 *   mild_bear   bearPct >= 0.40
 *   neutral     otherwise
 *
 * bull = BUY+HOLD, bear = SELL+AVOID
 */

export interface PortfolioInput {
  symbol: string;
  name: string;
  price_change_pct?: number | null;
  signals?: { verdict?: string | null } | null;
  fundamentals?: { pe_trailing?: number | null; dividend_yield_pct?: number | null } | null;
  risk?: { drawdown?: { max_drawdown_pct?: number | null } | null } | null;
}

export interface PortfolioStats {
  totalCount: number;
  avgChangePct: number | null;
  weightedSentiment: 'bull' | 'mild_bull' | 'neutral' | 'mild_bear' | 'bear';
  verdictBreakdown: { BUY: number; HOLD: number; WATCH: number; AVOID: number; SELL: number; UNKNOWN: number };
  bestPerformer: { symbol: string; changePct: number } | null;
  worstPerformer: { symbol: string; changePct: number } | null;
  avgPE: number | null;
  avgDividendYield: number | null;
  maxDrawdown: number | null;
  oneLineSummary: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type VerdictKey = 'BUY' | 'HOLD' | 'WATCH' | 'AVOID' | 'SELL' | 'UNKNOWN';

function normalizeVerdict(v: string | null | undefined): VerdictKey {
  switch (v?.trim().toUpperCase()) {
    case 'BUY':   return 'BUY';
    case 'HOLD':  return 'HOLD';
    case 'WATCH': return 'WATCH';
    case 'AVOID': return 'AVOID';
    case 'SELL':  return 'SELL';
    default:      return 'UNKNOWN';
  }
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function deriveSentiment(
  bullPct: number,
  bearPct: number,
): PortfolioStats['weightedSentiment'] {
  if (bullPct >= 0.6) return 'bull';
  if (bearPct >= 0.6) return 'bear';
  if (bullPct >= 0.4) return 'mild_bull';
  if (bearPct >= 0.4) return 'mild_bear';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

export function aggregatePortfolio(
  items: PortfolioInput[],
  locale: 'zh-TW' | 'en-US' = 'zh-TW',
): PortfolioStats {
  const emptyBreakdown = { BUY: 0, HOLD: 0, WATCH: 0, AVOID: 0, SELL: 0, UNKNOWN: 0 };

  if (items.length === 0) {
    return {
      totalCount: 0,
      avgChangePct: null,
      weightedSentiment: 'neutral',
      verdictBreakdown: { ...emptyBreakdown },
      bestPerformer: null,
      worstPerformer: null,
      avgPE: null,
      avgDividendYield: null,
      maxDrawdown: null,
      oneLineSummary: locale === 'en-US' ? 'No watchlist items' : '尚無自選股',
    };
  }

  const breakdown = { ...emptyBreakdown };
  const changePcts: number[] = [];
  const peValues: number[] = [];
  const divYields: number[] = [];
  const drawdowns: number[] = [];

  let best: PortfolioStats['bestPerformer'] = null;
  let worst: PortfolioStats['worstPerformer'] = null;

  for (const item of items) {
    // Verdict breakdown
    const v = normalizeVerdict(item.signals?.verdict);
    breakdown[v]++;

    // Price change
    const chg = item.price_change_pct;
    if (chg != null) {
      changePcts.push(chg);
      if (best === null || chg > best.changePct) best = { symbol: item.symbol, changePct: chg };
      if (worst === null || chg < worst.changePct) worst = { symbol: item.symbol, changePct: chg };
    }

    // Fundamentals
    const pe = item.fundamentals?.pe_trailing;
    if (pe != null) peValues.push(pe);

    const div = item.fundamentals?.dividend_yield_pct;
    if (div != null) divYields.push(div);

    // Drawdown — keep the most negative (worst-case)
    const dd = item.risk?.drawdown?.max_drawdown_pct;
    if (dd != null) drawdowns.push(dd);
  }

  const total = items.length;
  const bullPct = (breakdown.BUY + breakdown.HOLD) / total;
  const bearPct = (breakdown.SELL + breakdown.AVOID) / total;

  const avgChangePct = avg(changePcts);
  const avgPE = avg(peValues);
  const avgDividendYield = avg(divYields);
  const maxDrawdown = drawdowns.length > 0 ? Math.min(...drawdowns) : null;

  const sentiment = deriveSentiment(bullPct, bearPct);

  let oneLineSummary: string;
  if (locale === 'en-US') {
    oneLineSummary = `${breakdown.BUY} Buy / ${breakdown.SELL} Sell across ${total} stocks`;
  } else {
    oneLineSummary = `${total} 檔自選股：${breakdown.BUY} 買進、${breakdown.SELL} 賣出`;
  }

  return {
    totalCount: total,
    avgChangePct,
    weightedSentiment: sentiment,
    verdictBreakdown: breakdown,
    bestPerformer: best,
    worstPerformer: worst,
    avgPE,
    avgDividendYield,
    maxDrawdown,
    oneLineSummary,
  };
}
