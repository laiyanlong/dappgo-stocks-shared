/**
 * Dashboard summary — produces at-a-glance headline stats from a list of
 * ticker-lite records. Pure function, no IO, no deps.
 *
 * Verdict rank ladder (used for upgrade / downgrade detection):
 *   SELL=0  AVOID=1  WATCH=2  HOLD=3  BUY=4
 *
 * Tone thresholds:
 *   bull_heavy  bullPct >= 0.70
 *   mild_bull   bullPct >= 0.50
 *   neutral     |bullPct - bearPct| <= 0.05
 *   mild_bear   bearPct >= 0.50
 *   bear_heavy  bearPct >= 0.70
 */

export interface TickerLite {
  symbol: string;
  name: string;
  signals?: { verdict?: string | null; trend_label?: string | null } | null;
  price_change_pct?: number | null;
  verdict_changed_from?: string | null;
}

export interface DashboardSummary {
  total: number;
  buys: number;
  holds: number;
  watches: number;
  avoids: number;
  sells: number;
  unknowns: number;
  bullPct: number;
  bearPct: number;
  upgradeCount: number;
  downgradeCount: number;
  freshSignalSymbols: string[];
  oneLineHeadline: string;
  tone: 'bull_heavy' | 'mild_bull' | 'neutral' | 'mild_bear' | 'bear_heavy';
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const RANK: Record<string, number> = {
  sell: 0,
  avoid: 1,
  watch: 2,
  hold: 3,
  buy: 4,
};

function normalizeVerdict(v: string | null | undefined): string | null {
  if (v == null) return null;
  return v.trim().toLowerCase();
}

function rank(v: string | null | undefined): number | null {
  const n = normalizeVerdict(v);
  if (n == null) return null;
  const r = RANK[n];
  return r !== undefined ? r : null;
}

function deriveTone(bullPct: number, bearPct: number): DashboardSummary['tone'] {
  if (bullPct >= 0.7) return 'bull_heavy';
  if (bearPct >= 0.7) return 'bear_heavy';
  if (Math.abs(bullPct - bearPct) <= 0.05) return 'neutral';
  if (bullPct >= 0.5) return 'mild_bull';
  if (bearPct >= 0.5) return 'mild_bear';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

export function buildDashboardSummary(
  tickers: TickerLite[],
  locale: 'zh-TW' | 'en-US' = 'zh-TW',
): DashboardSummary {
  if (tickers.length === 0) {
    const headline = locale === 'en-US' ? 'No data available' : '尚無資料';
    return {
      total: 0,
      buys: 0,
      holds: 0,
      watches: 0,
      avoids: 0,
      sells: 0,
      unknowns: 0,
      bullPct: 0,
      bearPct: 0,
      upgradeCount: 0,
      downgradeCount: 0,
      freshSignalSymbols: [],
      oneLineHeadline: headline,
      tone: 'neutral',
    };
  }

  let buys = 0;
  let holds = 0;
  let watches = 0;
  let avoids = 0;
  let sells = 0;
  let unknowns = 0;
  let upgradeCount = 0;
  let downgradeCount = 0;

  // Symbol → absolute rank diff for sorting freshSignalSymbols
  const changed: Array<{ symbol: string; absDiff: number }> = [];

  for (const t of tickers) {
    const currentVerdict = t.signals?.verdict;
    const prevVerdict = t.verdict_changed_from;

    const norm = normalizeVerdict(currentVerdict);
    switch (norm) {
      case 'buy':   buys++;    break;
      case 'hold':  holds++;   break;
      case 'watch': watches++; break;
      case 'avoid': avoids++;  break;
      case 'sell':  sells++;   break;
      default:      unknowns++; break;
    }

    // Upgrade / downgrade detection
    if (prevVerdict != null) {
      const curRank = rank(currentVerdict);
      const prvRank = rank(prevVerdict);
      if (curRank !== null && prvRank !== null) {
        const diff = curRank - prvRank;
        if (diff > 0) upgradeCount++;
        else if (diff < 0) downgradeCount++;
        if (diff !== 0) {
          changed.push({ symbol: t.symbol, absDiff: Math.abs(diff) });
        }
      }
    }
  }

  const total = tickers.length;
  const bullPct = total > 0 ? (buys + holds) / total : 0;
  const bearPct = total > 0 ? (avoids + sells) / total : 0;

  // Top 5 by abs rank diff descending
  changed.sort((a, b) => b.absDiff - a.absDiff);
  const freshSignalSymbols = changed.slice(0, 5).map((c) => c.symbol);

  const tone = deriveTone(bullPct, bearPct);

  let oneLineHeadline: string;
  if (locale === 'en-US') {
    oneLineHeadline = `Today ${buys} Buy / ${sells} Sell`;
  } else {
    oneLineHeadline = `今日 ${buys} 檔買進 / ${sells} 檔賣出`;
  }

  return {
    total,
    buys,
    holds,
    watches,
    avoids,
    sells,
    unknowns,
    bullPct,
    bearPct,
    upgradeCount,
    downgradeCount,
    freshSignalSymbols,
    oneLineHeadline,
    tone,
  };
}
