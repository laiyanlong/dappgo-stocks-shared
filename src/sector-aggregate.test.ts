import { summarizeSectors } from './sector-aggregate';

describe('summarizeSectors', () => {
  it('returns zeros and null movers for empty rotation', () => {
    const result = summarizeSectors({});
    expect(result).toEqual({
      hot: 0,
      warm: 0,
      neutral: 0,
      cool: 0,
      cold: 0,
      topGainer: null,
      topLoser: null,
    });
  });

  it('counts when all sectors are HOT', () => {
    const result = summarizeSectors({
      Tech: { verdict: 'HOT', avg_change_pct: 2.1 },
      Energy: { verdict: 'HOT', avg_change_pct: 1.5 },
      Health: { verdict: 'HOT', avg_change_pct: 3.0 },
    });
    expect(result.hot).toBe(3);
    expect(result.warm).toBe(0);
    expect(result.neutral).toBe(0);
    expect(result.cool).toBe(0);
    expect(result.cold).toBe(0);
  });

  it('counts a mix of all five verdicts', () => {
    const result = summarizeSectors({
      A: { verdict: 'HOT', avg_change_pct: 2 },
      B: { verdict: 'WARM', avg_change_pct: 1 },
      C: { verdict: 'NEUTRAL', avg_change_pct: 0 },
      D: { verdict: 'COOL', avg_change_pct: -1 },
      E: { verdict: 'COLD', avg_change_pct: -2 },
    });
    expect(result.hot).toBe(1);
    expect(result.warm).toBe(1);
    expect(result.neutral).toBe(1);
    expect(result.cool).toBe(1);
    expect(result.cold).toBe(1);
  });

  it('handles a single sector', () => {
    const result = summarizeSectors({
      Tech: { verdict: 'WARM', avg_change_pct: 0.7 },
    });
    expect(result.warm).toBe(1);
    expect(result.topGainer).toEqual({ name: 'Tech', change: 0.7 });
    expect(result.topLoser).toEqual({ name: 'Tech', change: 0.7 });
  });

  it('returns the first sector on a top-gainer tie (stable order)', () => {
    const result = summarizeSectors({
      First: { verdict: 'HOT', avg_change_pct: 2.5 },
      Second: { verdict: 'HOT', avg_change_pct: 2.5 },
      Third: { verdict: 'WARM', avg_change_pct: 1.0 },
    });
    expect(result.topGainer).toEqual({ name: 'First', change: 2.5 });
  });

  it('picks the least-negative when all changes are negative', () => {
    const result = summarizeSectors({
      A: { verdict: 'COLD', avg_change_pct: -5.0 },
      B: { verdict: 'COOL', avg_change_pct: -1.2 },
      C: { verdict: 'COLD', avg_change_pct: -3.4 },
    });
    expect(result.topGainer).toEqual({ name: 'B', change: -1.2 });
    expect(result.topLoser).toEqual({ name: 'A', change: -5.0 });
  });

  it('identifies top loser correctly amid mixed signs', () => {
    const result = summarizeSectors({
      Up: { verdict: 'HOT', avg_change_pct: 4.5 },
      Flat: { verdict: 'NEUTRAL', avg_change_pct: 0.1 },
      Down: { verdict: 'COLD', avg_change_pct: -3.8 },
      Worse: { verdict: 'COLD', avg_change_pct: -7.2 },
    });
    expect(result.topGainer).toEqual({ name: 'Up', change: 4.5 });
    expect(result.topLoser).toEqual({ name: 'Worse', change: -7.2 });
  });

  it('ignores malformed verdicts in the bucket counts but still tracks movers', () => {
    const result = summarizeSectors({
      Bogus: { verdict: 'SCORCHING', avg_change_pct: 9.9 },
      Empty: { verdict: '', avg_change_pct: -2.0 },
    });
    expect(result.hot).toBe(0);
    expect(result.warm).toBe(0);
    expect(result.neutral).toBe(0);
    expect(result.cool).toBe(0);
    expect(result.cold).toBe(0);
    expect(result.topGainer).toEqual({ name: 'Bogus', change: 9.9 });
    expect(result.topLoser).toEqual({ name: 'Empty', change: -2.0 });
  });

  it('accepts lowercase verdict strings', () => {
    const result = summarizeSectors({
      A: { verdict: 'hot', avg_change_pct: 1 },
      B: { verdict: 'cold', avg_change_pct: -1 },
    });
    expect(result.hot).toBe(1);
    expect(result.cold).toBe(1);
  });
});
