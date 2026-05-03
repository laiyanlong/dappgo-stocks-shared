import { buildDashboardSummary, type TickerLite } from './dashboard-summary';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTicker(
  symbol: string,
  verdict: string | null,
  changedFrom?: string | null,
): TickerLite {
  return {
    symbol,
    name: symbol,
    signals: verdict != null ? { verdict } : null,
    verdict_changed_from: changedFrom ?? null,
  };
}

// ---------------------------------------------------------------------------
// 1. Empty array
// ---------------------------------------------------------------------------

describe('empty input', () => {
  it('returns all zeros with neutral tone (zh-TW)', () => {
    const s = buildDashboardSummary([]);
    expect(s.total).toBe(0);
    expect(s.buys).toBe(0);
    expect(s.tone).toBe('neutral');
    expect(s.oneLineHeadline).toBe('尚無資料');
    expect(s.freshSignalSymbols).toEqual([]);
  });

  it('returns English headline for en-US locale', () => {
    const s = buildDashboardSummary([], 'en-US');
    expect(s.oneLineHeadline).toBe('No data available');
  });
});

// ---------------------------------------------------------------------------
// 2. All buys → bull_heavy
// ---------------------------------------------------------------------------

describe('all buys', () => {
  const tickers = ['A', 'B', 'C', 'D', 'E'].map((s) => makeTicker(s, 'BUY'));

  it('tone is bull_heavy', () => {
    expect(buildDashboardSummary(tickers).tone).toBe('bull_heavy');
  });

  it('buys count equals total', () => {
    const s = buildDashboardSummary(tickers);
    expect(s.buys).toBe(5);
    expect(s.total).toBe(5);
  });

  it('bullPct is 1.0, bearPct is 0', () => {
    const s = buildDashboardSummary(tickers);
    expect(s.bullPct).toBe(1);
    expect(s.bearPct).toBe(0);
  });

  it('zh-TW headline contains buys count', () => {
    const s = buildDashboardSummary(tickers);
    expect(s.oneLineHeadline).toBe('今日 5 檔買進 / 0 檔賣出');
  });
});

// ---------------------------------------------------------------------------
// 3. All sells → bear_heavy
// ---------------------------------------------------------------------------

describe('all sells', () => {
  const tickers = ['X', 'Y', 'Z'].map((s) => makeTicker(s, 'SELL'));

  it('tone is bear_heavy', () => {
    expect(buildDashboardSummary(tickers).tone).toBe('bear_heavy');
  });

  it('sells count equals total', () => {
    const s = buildDashboardSummary(tickers);
    expect(s.sells).toBe(3);
    expect(s.avoids).toBe(0);
  });

  it('en-US headline format', () => {
    const s = buildDashboardSummary(tickers, 'en-US');
    expect(s.oneLineHeadline).toBe('Today 0 Buy / 3 Sell');
  });
});

// ---------------------------------------------------------------------------
// 4. Mixed → mild_bull
// ---------------------------------------------------------------------------

describe('mild_bull scenario', () => {
  // 6 buys+holds out of 10 = 0.6 bullPct → mild_bull
  const tickers: TickerLite[] = [
    ...['A', 'B', 'C'].map((s) => makeTicker(s, 'buy')),
    ...['D', 'E', 'F'].map((s) => makeTicker(s, 'hold')),
    ...['G', 'H'].map((s) => makeTicker(s, 'watch')),
    makeTicker('I', 'avoid'),
    makeTicker('J', 'sell'),
  ];

  it('tone is mild_bull', () => {
    const s = buildDashboardSummary(tickers);
    expect(s.tone).toBe('mild_bull');
    expect(s.bullPct).toBeCloseTo(0.6);
    expect(s.bearPct).toBeCloseTo(0.2);
  });
});

// ---------------------------------------------------------------------------
// 5. Mixed → mild_bear
// ---------------------------------------------------------------------------

describe('mild_bear scenario', () => {
  // 6 avoids+sells out of 10 = 0.6 bearPct
  const tickers: TickerLite[] = [
    ...['A', 'B'].map((s) => makeTicker(s, 'buy')),
    ...['C', 'D', 'E'].map((s) => makeTicker(s, 'avoid')),
    ...['F', 'G', 'H', 'I', 'J'].map((s) => makeTicker(s, 'sell')),
  ];

  // Wait: 3 avoids + 5 sells = 8/10 = 0.8 → bear_heavy actually
  // Let me recalculate: 3 avoids + 3 sells out of 10 = 0.6
  const tickers2: TickerLite[] = [
    ...['A', 'B'].map((s) => makeTicker(s, 'buy')),
    ...['C', 'D'].map((s) => makeTicker(s, 'watch')),
    ...['E', 'F', 'G'].map((s) => makeTicker(s, 'avoid')),
    ...['H', 'I', 'J'].map((s) => makeTicker(s, 'sell')),
  ];

  it('tone is mild_bear when bearPct ~0.6', () => {
    const s = buildDashboardSummary(tickers2);
    expect(s.tone).toBe('mild_bear');
    expect(s.bearPct).toBeCloseTo(0.6);
  });
});

// ---------------------------------------------------------------------------
// 6. Neutral scenario
// ---------------------------------------------------------------------------

describe('neutral scenario', () => {
  // bullPct = 0.4, bearPct = 0.4 → diff = 0 → neutral
  const tickers: TickerLite[] = [
    ...['A', 'B', 'C', 'D'].map((s) => makeTicker(s, 'buy')),
    ...['E', 'F', 'G', 'H'].map((s) => makeTicker(s, 'sell')),
    makeTicker('I', 'watch'),
    makeTicker('J', 'watch'),
  ];

  it('tone is neutral', () => {
    const s = buildDashboardSummary(tickers);
    expect(s.tone).toBe('neutral');
  });
});

// ---------------------------------------------------------------------------
// 7. Upgrade / downgrade counting
// ---------------------------------------------------------------------------

describe('upgrade and downgrade counting', () => {
  const tickers: TickerLite[] = [
    makeTicker('UP1', 'buy', 'hold'),   // hold(3) → buy(4): upgrade
    makeTicker('UP2', 'hold', 'avoid'), // avoid(1) → hold(3): upgrade
    makeTicker('DN1', 'sell', 'hold'),  // hold(3) → sell(0): downgrade
    makeTicker('DN2', 'avoid', 'buy'),  // buy(4) → avoid(1): downgrade
    makeTicker('NC1', 'buy', null),     // no prev
    makeTicker('NC2', 'watch', 'watch'), // same rank → neither
  ];

  it('counts upgrades correctly', () => {
    expect(buildDashboardSummary(tickers).upgradeCount).toBe(2);
  });

  it('counts downgrades correctly', () => {
    expect(buildDashboardSummary(tickers).downgradeCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 8. freshSignalSymbols sorted by abs rank diff, capped at 5
// ---------------------------------------------------------------------------

describe('freshSignalSymbols sorting and cap', () => {
  const tickers: TickerLite[] = [
    makeTicker('BIG',   'buy',   'sell'),  // diff 4 → largest
    makeTicker('MED1',  'buy',   'avoid'), // diff 3
    makeTicker('MED2',  'hold',  'sell'),  // diff 3
    makeTicker('SMALL', 'hold',  'avoid'), // diff 2
    makeTicker('TINY1', 'buy',   'hold'),  // diff 1
    makeTicker('TINY2', 'avoid', 'watch'), // diff 1
    makeTicker('NONE',  'buy',   null),    // no change
  ];

  it('returns at most 5 symbols', () => {
    const s = buildDashboardSummary(tickers);
    expect(s.freshSignalSymbols.length).toBeLessThanOrEqual(5);
  });

  it('first symbol is the one with largest rank diff', () => {
    const s = buildDashboardSummary(tickers);
    expect(s.freshSignalSymbols[0]).toBe('BIG');
  });

  it('symbol with no prev verdict is excluded', () => {
    const s = buildDashboardSummary(tickers);
    expect(s.freshSignalSymbols).not.toContain('NONE');
  });
});

// ---------------------------------------------------------------------------
// 9. Unknown verdicts
// ---------------------------------------------------------------------------

describe('unknown verdicts', () => {
  const tickers: TickerLite[] = [
    makeTicker('A', 'buy'),
    makeTicker('B', null),        // null verdict
    makeTicker('C', 'UNKNOWN'),   // unrecognized string
    makeTicker('D', ''),          // empty string
  ];

  it('unknown verdicts count into unknowns, not bull or bear', () => {
    const s = buildDashboardSummary(tickers);
    expect(s.unknowns).toBe(3);
    expect(s.buys).toBe(1);
  });

  it('bullPct only counts buy/hold over total', () => {
    const s = buildDashboardSummary(tickers);
    // 1 buy / 4 total = 0.25
    expect(s.bullPct).toBeCloseTo(0.25);
    expect(s.bearPct).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 10. Case-insensitive verdict matching
// ---------------------------------------------------------------------------

describe('case-insensitive verdicts', () => {
  const tickers = [
    makeTicker('A', 'BUY'),
    makeTicker('B', 'Buy'),
    makeTicker('C', 'buy'),
    makeTicker('D', 'HOLD'),
    makeTicker('E', 'SELL'),
  ];

  it('normalizes casing correctly', () => {
    const s = buildDashboardSummary(tickers);
    expect(s.buys).toBe(3);
    expect(s.holds).toBe(1);
    expect(s.sells).toBe(1);
    expect(s.unknowns).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 11. Single ticker
// ---------------------------------------------------------------------------

describe('single ticker', () => {
  it('handles one buy correctly', () => {
    const s = buildDashboardSummary([makeTicker('AAPL', 'buy')]);
    expect(s.total).toBe(1);
    expect(s.buys).toBe(1);
    expect(s.bullPct).toBe(1);
    expect(s.tone).toBe('bull_heavy');
  });
});

// ---------------------------------------------------------------------------
// 12. Verdict changed from unrecognized value
// ---------------------------------------------------------------------------

describe('unrecognized verdict_changed_from', () => {
  it('does not count as upgrade or downgrade', () => {
    const tickers: TickerLite[] = [
      makeTicker('A', 'buy', 'unknown_rank'),
      makeTicker('B', 'sell', 'unknown_rank'),
    ];
    const s = buildDashboardSummary(tickers);
    expect(s.upgradeCount).toBe(0);
    expect(s.downgradeCount).toBe(0);
    expect(s.freshSignalSymbols).toEqual([]);
  });
});
