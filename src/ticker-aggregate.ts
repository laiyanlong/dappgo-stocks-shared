// Pure helpers that summarise the per-ticker sentiment used on Dashboard.

export interface TickerEntry {
  symbol: string;
  name: string;
  price_change_pct: number;
  signals: { verdict: string };
}

export interface TickerMover {
  symbol: string;
  name: string;
  change: number;
}

export interface MarketSentiment {
  bullish: number;
  bearish: number;
  neutral: number;
  topMover: TickerMover | null;
}

const BULLISH = new Set(['BUY', 'HOLD']);
const BEARISH = new Set(['AVOID', 'SELL']);
const NEUTRAL = new Set(['WATCH']);

export function summarizeMarket(
  tickers: Record<string, TickerEntry>,
): MarketSentiment {
  const summary: MarketSentiment = {
    bullish: 0,
    bearish: 0,
    neutral: 0,
    topMover: null,
  };

  for (const entry of Object.values(tickers)) {
    const verdict = entry.signals?.verdict?.toUpperCase?.() ?? '';
    if (BULLISH.has(verdict)) summary.bullish += 1;
    else if (BEARISH.has(verdict)) summary.bearish += 1;
    else if (NEUTRAL.has(verdict)) summary.neutral += 1;

    const change = entry.price_change_pct;
    if (typeof change !== 'number' || Number.isNaN(change)) continue;

    if (
      summary.topMover === null ||
      Math.abs(change) > Math.abs(summary.topMover.change)
    ) {
      summary.topMover = {
        symbol: entry.symbol,
        name: entry.name,
        change,
      };
    }
  }

  return summary;
}
