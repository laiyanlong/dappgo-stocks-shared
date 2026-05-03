import { contributionBars } from './contribution-bars';

describe('contributionBars', () => {
  it('null input → empty display with neutral tier', () => {
    const r = contributionBars(null);
    expect(r.bars).toHaveLength(0);
    expect(r.compositeScore).toBe(0);
    expect(r.compositeTier).toBe('neutral');
  });

  it('undefined input → empty display', () => {
    const r = contributionBars(undefined);
    expect(r.bars).toHaveLength(0);
  });

  it('empty object → empty display', () => {
    const r = contributionBars({});
    expect(r.bars).toHaveLength(0);
    expect(r.compositeScore).toBe(0);
  });

  it('all-zero axes → widthPct 0, neutral tones, neutral tier', () => {
    const r = contributionBars({ trend: 0, momentum: 0, volume: 0 });
    expect(r.bars).toHaveLength(3);
    r.bars.forEach(b => {
      expect(b.widthPct).toBe(0);
      expect(b.side).toBe('zero');
      expect(b.tone).toBe('neutral');
    });
    expect(r.compositeTier).toBe('neutral');
  });

  it('strong bull stack: all +2 across 4 axes → strong_bull', () => {
    const r = contributionBars({ trend: 2, momentum: 2, volume: 2, ownership: 2 });
    expect(r.compositeScore).toBe(8);
    expect(r.compositeTier).toBe('strong_bull');
    r.bars.forEach(b => {
      expect(b.widthPct).toBe(100);
      expect(b.tone).toBe('strong_positive');
      expect(b.side).toBe('positive');
    });
  });

  it('strong bear stack: all -2 across 4 axes → strong_bear', () => {
    const r = contributionBars({ trend: -2, momentum: -2, volume: -2, ownership: -2 });
    expect(r.compositeScore).toBe(-8);
    expect(r.compositeTier).toBe('strong_bear');
    r.bars.forEach(b => {
      expect(b.tone).toBe('strong_negative');
      expect(b.side).toBe('negative');
    });
  });

  it('typical mixed: trend=2, momentum=1, volume=-1, ownership=0 → mild_bull', () => {
    const r = contributionBars({ trend: 2, momentum: 1, volume: -1, ownership: 0 });
    expect(r.compositeScore).toBe(2);
    expect(r.compositeTier).toBe('mild_bull');

    const trend = r.bars.find(b => b.axis === 'trend')!;
    expect(trend.widthPct).toBe(100);
    expect(trend.tone).toBe('strong_positive');

    const momentum = r.bars.find(b => b.axis === 'momentum')!;
    expect(momentum.widthPct).toBe(50);
    expect(momentum.tone).toBe('mild_positive');

    const volume = r.bars.find(b => b.axis === 'volume')!;
    expect(volume.tone).toBe('mild_negative');
    expect(volume.side).toBe('negative');

    const ownership = r.bars.find(b => b.axis === 'ownership')!;
    expect(ownership.widthPct).toBe(0);
    expect(ownership.tone).toBe('neutral');
  });

  it('max-abs scaling: mixed ±1 axes → both at 100% width', () => {
    const r = contributionBars({ a: 1, b: -1 });
    r.bars.forEach(b => expect(b.widthPct).toBe(100));
  });

  it('partial axes (only two provided) → correct composite and bars', () => {
    const r = contributionBars({ trend: 2, volume: -1 });
    expect(r.bars).toHaveLength(2);
    expect(r.compositeScore).toBe(1);
    expect(r.compositeTier).toBe('mild_bull');
  });

  it('unknown/custom axis name passes through unchanged', () => {
    const r = contributionBars({ insider_flow: 2, macro: -2 });
    const axes = r.bars.map(b => b.axis);
    expect(axes).toContain('insider_flow');
    expect(axes).toContain('macro');
    expect(r.compositeScore).toBe(0);
    expect(r.compositeTier).toBe('neutral');
  });

  it('compositeTier boundary: score=4 → strong_bull, score=3 → mild_bull', () => {
    expect(contributionBars({ a: 2, b: 2 }).compositeTier).toBe('strong_bull');
    expect(contributionBars({ a: 2, b: 1 }).compositeTier).toBe('mild_bull');
  });

  it('compositeTier boundary: score 0 → neutral, score=-1 → mild_bear, score=-3 → mild_bear, score=-4 → strong_bear', () => {
    // neutral: score > -1 (exclusive), so 0 is neutral, -1 is mild_bear
    // mild_bear: score > -4 (exclusive), so -3 is mild_bear, -4 is strong_bear
    expect(contributionBars({ a: 0 }).compositeTier).toBe('neutral');
    expect(contributionBars({ a: -1, b: 0 }).compositeTier).toBe('mild_bear');
    expect(contributionBars({ a: -2, b: -1 }).compositeTier).toBe('mild_bear');     // score -3
    expect(contributionBars({ a: -2, b: -2 }).compositeTier).toBe('strong_bear');  // score -4
    expect(contributionBars({ a: -2, b: -2, c: -1 }).compositeTier).toBe('strong_bear');
  });

  it('single axis with positive score', () => {
    const r = contributionBars({ momentum: 1 });
    expect(r.bars).toHaveLength(1);
    expect(r.bars[0].widthPct).toBe(100);
    expect(r.bars[0].tone).toBe('mild_positive');
    expect(r.compositeTier).toBe('mild_bull');
  });
});
