import { aggregatePortfolio, type PortfolioInput } from './portfolio-aggregator';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const buyItem = (symbol: string, chg: number): PortfolioInput => ({
  symbol,
  name: symbol,
  price_change_pct: chg,
  signals: { verdict: 'BUY' },
});

const sellItem = (symbol: string, chg: number): PortfolioInput => ({
  symbol,
  name: symbol,
  price_change_pct: chg,
  signals: { verdict: 'SELL' },
});

const holdItem = (symbol: string): PortfolioInput => ({
  symbol,
  name: symbol,
  signals: { verdict: 'HOLD' },
});

const avoidItem = (symbol: string): PortfolioInput => ({
  symbol,
  name: symbol,
  signals: { verdict: 'AVOID' },
});

// ---------------------------------------------------------------------------
// 1. Empty input
// ---------------------------------------------------------------------------

describe('aggregatePortfolio — empty input', () => {
  it('returns zero-state with zh-TW summary', () => {
    const result = aggregatePortfolio([]);
    expect(result.totalCount).toBe(0);
    expect(result.avgChangePct).toBeNull();
    expect(result.weightedSentiment).toBe('neutral');
    expect(result.bestPerformer).toBeNull();
    expect(result.worstPerformer).toBeNull();
    expect(result.avgPE).toBeNull();
    expect(result.avgDividendYield).toBeNull();
    expect(result.maxDrawdown).toBeNull();
    expect(result.oneLineSummary).toBe('尚無自選股');
  });

  it('returns English summary for en-US locale', () => {
    const result = aggregatePortfolio([], 'en-US');
    expect(result.oneLineSummary).toBe('No watchlist items');
  });
});

// ---------------------------------------------------------------------------
// 2. All BUY → bull sentiment
// ---------------------------------------------------------------------------

describe('aggregatePortfolio — all BUY', () => {
  const items = [buyItem('AAPL', 1), buyItem('MSFT', 2), buyItem('NVDA', 3)];

  it('returns bull sentiment', () => {
    expect(aggregatePortfolio(items).weightedSentiment).toBe('bull');
  });

  it('verdict breakdown has correct BUY count', () => {
    const { verdictBreakdown } = aggregatePortfolio(items);
    expect(verdictBreakdown.BUY).toBe(3);
    expect(verdictBreakdown.SELL).toBe(0);
    expect(verdictBreakdown.UNKNOWN).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Mixed verdicts → neutral
// ---------------------------------------------------------------------------

describe('aggregatePortfolio — mixed verdicts neutral', () => {
  // 2 BUY + 1 HOLD + 1 SELL + 1 AVOID + 1 WATCH = 6 items
  // bullPct = 3/6 = 0.5, bearPct = 2/6 ≈ 0.33  → mild_bull (bullPct >= 0.4)
  // Use balanced set: 1 BUY, 1 HOLD, 1 WATCH, 1 AVOID, 1 SELL, 1 UNKNOWN → bullPct=2/6≈0.33, bearPct=2/6≈0.33 → neutral
  const items: PortfolioInput[] = [
    buyItem('A', 0),
    holdItem('B'),
    { symbol: 'C', name: 'C', signals: { verdict: 'WATCH' } },
    avoidItem('D'),
    sellItem('E', 0),
    { symbol: 'F', name: 'F', signals: { verdict: null } },
  ];

  it('returns neutral sentiment', () => {
    expect(aggregatePortfolio(items).weightedSentiment).toBe('neutral');
  });
});

// ---------------------------------------------------------------------------
// 4. Best and worst performer detection
// ---------------------------------------------------------------------------

describe('aggregatePortfolio — best/worst performer', () => {
  const items: PortfolioInput[] = [
    buyItem('AAPL', 5.2),
    buyItem('MSFT', -3.1),
    buyItem('TSLA', 1.0),
  ];

  it('identifies best performer', () => {
    const { bestPerformer } = aggregatePortfolio(items);
    expect(bestPerformer).toEqual({ symbol: 'AAPL', changePct: 5.2 });
  });

  it('identifies worst performer', () => {
    const { worstPerformer } = aggregatePortfolio(items);
    expect(worstPerformer).toEqual({ symbol: 'MSFT', changePct: -3.1 });
  });
});

// ---------------------------------------------------------------------------
// 5. Average computations skip nulls
// ---------------------------------------------------------------------------

describe('aggregatePortfolio — average computations skip nulls', () => {
  const items: PortfolioInput[] = [
    {
      symbol: 'A', name: 'A',
      price_change_pct: 2,
      signals: { verdict: 'BUY' },
      fundamentals: { pe_trailing: 20, dividend_yield_pct: 1.5 },
      risk: { drawdown: { max_drawdown_pct: -15 } },
    },
    {
      symbol: 'B', name: 'B',
      price_change_pct: null,        // skipped in avgChangePct
      signals: { verdict: 'HOLD' },
      fundamentals: { pe_trailing: null, dividend_yield_pct: 2.5 },
      risk: { drawdown: { max_drawdown_pct: -25 } },
    },
    {
      symbol: 'C', name: 'C',
      price_change_pct: 4,
      signals: { verdict: 'BUY' },
      fundamentals: null,            // skipped in avgPE and avgDividendYield
      risk: null,                    // skipped in maxDrawdown
    },
  ];

  it('avgChangePct uses only non-null values', () => {
    expect(aggregatePortfolio(items).avgChangePct).toBeCloseTo(3); // (2+4)/2
  });

  it('avgPE uses only non-null values', () => {
    expect(aggregatePortfolio(items).avgPE).toBeCloseTo(20); // only A has pe
  });

  it('avgDividendYield averages correctly', () => {
    expect(aggregatePortfolio(items).avgDividendYield).toBeCloseTo(2); // (1.5+2.5)/2
  });

  it('maxDrawdown returns worst-case (most negative)', () => {
    expect(aggregatePortfolio(items).maxDrawdown).toBe(-25);
  });
});

// ---------------------------------------------------------------------------
// 6. en-US locale summary
// ---------------------------------------------------------------------------

describe('aggregatePortfolio — en-US locale', () => {
  it('produces English one-line summary', () => {
    const items = [buyItem('AAPL', 1), sellItem('TSLA', -2), holdItem('MSFT')];
    const { oneLineSummary } = aggregatePortfolio(items, 'en-US');
    expect(oneLineSummary).toBe('1 Buy / 1 Sell across 3 stocks');
  });
});

// ---------------------------------------------------------------------------
// 7. Single ticker
// ---------------------------------------------------------------------------

describe('aggregatePortfolio — single ticker', () => {
  it('handles single item correctly', () => {
    const result = aggregatePortfolio([buyItem('AAPL', 3.5)]);
    expect(result.totalCount).toBe(1);
    expect(result.avgChangePct).toBeCloseTo(3.5);
    expect(result.bestPerformer).toEqual({ symbol: 'AAPL', changePct: 3.5 });
    expect(result.worstPerformer).toEqual({ symbol: 'AAPL', changePct: 3.5 });
    expect(result.weightedSentiment).toBe('bull');
    expect(result.verdictBreakdown.BUY).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 8. Verdict count accuracy
// ---------------------------------------------------------------------------

describe('aggregatePortfolio — verdict count accuracy', () => {
  const items: PortfolioInput[] = [
    buyItem('A', 0), buyItem('B', 0),
    holdItem('C'),
    { symbol: 'D', name: 'D', signals: { verdict: 'WATCH' } },
    { symbol: 'E', name: 'E', signals: { verdict: 'WATCH' } },
    { symbol: 'F', name: 'F', signals: { verdict: 'WATCH' } },
    avoidItem('G'),
    sellItem('H', 0), sellItem('I', 0),
    { symbol: 'J', name: 'J', signals: null },
  ];

  it('counts each verdict correctly', () => {
    const { verdictBreakdown, totalCount } = aggregatePortfolio(items);
    expect(totalCount).toBe(10);
    expect(verdictBreakdown.BUY).toBe(2);
    expect(verdictBreakdown.HOLD).toBe(1);
    expect(verdictBreakdown.WATCH).toBe(3);
    expect(verdictBreakdown.AVOID).toBe(1);
    expect(verdictBreakdown.SELL).toBe(2);
    expect(verdictBreakdown.UNKNOWN).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 9. Bear sentiment
// ---------------------------------------------------------------------------

describe('aggregatePortfolio — bear sentiment', () => {
  const items = [
    sellItem('A', -5), sellItem('B', -3), avoidItem('C'), avoidItem('D'),
    buyItem('E', 1),
  ];

  it('returns bear when SELL+AVOID >= 60%', () => {
    // bearPct = 4/5 = 0.8 → bear
    expect(aggregatePortfolio(items).weightedSentiment).toBe('bear');
  });
});

// ---------------------------------------------------------------------------
// 10. Items with no price_change_pct → no performer
// ---------------------------------------------------------------------------

describe('aggregatePortfolio — all null price changes', () => {
  const items: PortfolioInput[] = [
    { symbol: 'A', name: 'A', signals: { verdict: 'BUY' } },
    { symbol: 'B', name: 'B', signals: { verdict: 'SELL' } },
  ];

  it('returns null for best/worst performer when no change data', () => {
    const { bestPerformer, worstPerformer, avgChangePct } = aggregatePortfolio(items);
    expect(bestPerformer).toBeNull();
    expect(worstPerformer).toBeNull();
    expect(avgChangePct).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 11. mild_bull threshold boundary
// ---------------------------------------------------------------------------

describe('aggregatePortfolio — mild_bull sentinel', () => {
  // 2 BUY + 3 others: bullPct=2/5=0.4 → mild_bull
  const items: PortfolioInput[] = [
    buyItem('A', 0), buyItem('B', 0),
    { symbol: 'C', name: 'C', signals: { verdict: 'WATCH' } },
    { symbol: 'D', name: 'D', signals: { verdict: 'WATCH' } },
    { symbol: 'E', name: 'E', signals: { verdict: 'WATCH' } },
  ];

  it('returns mild_bull at exactly 40% bull', () => {
    expect(aggregatePortfolio(items).weightedSentiment).toBe('mild_bull');
  });
});
