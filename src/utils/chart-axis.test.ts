import {
  priceAxisTicks,
  dateAxisLabels,
  scaleLinear,
  niceCeiling,
  niceFloor,
} from './chart-axis';

// ─── priceAxisTicks ───────────────────────────────────────────────────────────

describe('priceAxisTicks', () => {
  it('typical stock price range 95–130 → nice 5-step ticks', () => {
    const ticks = priceAxisTicks(95, 130);
    expect(ticks[0]).toBe(95);
    expect(ticks[ticks.length - 1]).toBe(130);
    expect(ticks.length).toBeGreaterThanOrEqual(4);
    expect(ticks.length).toBeLessThanOrEqual(9);
    // Intervals should be equal (nice step)
    const diffs = ticks.slice(1).map((v, i) => parseFloat((v - ticks[i]).toFixed(6)));
    const uniqueDiffs = new Set(diffs);
    // at most 2 distinct intervals (endpoints may differ slightly)
    expect(uniqueDiffs.size).toBeLessThanOrEqual(2);
  });

  it('tight range 95–95.5 → sub-cent step ticks', () => {
    const ticks = priceAxisTicks(95, 95.5);
    expect(ticks[0]).toBe(95);
    expect(ticks[ticks.length - 1]).toBe(95.5);
    expect(ticks.length).toBeGreaterThanOrEqual(4);
  });

  it('very small sub-dollar range 1.00–1.05 → ~5 ticks at 0.01 step', () => {
    const ticks = priceAxisTicks(1.0, 1.05);
    expect(ticks[0]).toBe(1.0);
    expect(ticks[ticks.length - 1]).toBe(1.05);
    expect(ticks.length).toBeGreaterThanOrEqual(4);
  });

  it('zero-crossing range -5–5 → includes 0', () => {
    const ticks = priceAxisTicks(-5, 5);
    expect(ticks).toContain(0);
    expect(ticks[0]).toBeLessThanOrEqual(-5);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(5);
  });

  it('large range 0–1000 → nice 100 or 200 step', () => {
    const ticks = priceAxisTicks(0, 1000);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBe(1000);
    expect(ticks.length).toBeGreaterThanOrEqual(4);
    expect(ticks.length).toBeLessThanOrEqual(9);
  });

  it('equal min/max → single tick', () => {
    expect(priceAxisTicks(100, 100)).toEqual([100]);
  });

  it('NaN inputs → empty array', () => {
    expect(priceAxisTicks(NaN, 100)).toEqual([]);
    expect(priceAxisTicks(0, NaN)).toEqual([]);
  });

  it('inverted min/max → normalises and returns ticks', () => {
    const ticks = priceAxisTicks(130, 95);
    expect(ticks[0]).toBeLessThan(ticks[ticks.length - 1]);
  });

  it('custom target=4 → ~4 ticks', () => {
    const ticks = priceAxisTicks(0, 100, 4);
    expect(ticks.length).toBeGreaterThanOrEqual(3);
    expect(ticks.length).toBeLessThanOrEqual(6);
  });
});

// ─── niceCeiling / niceFloor ──────────────────────────────────────────────────

describe('niceCeiling', () => {
  it('127.3 → 130 (step=10)', () => expect(niceCeiling(127.3)).toBe(130));
  it('1273 → 1300 (step=100)', () => expect(niceCeiling(1273)).toBeCloseTo(1300));
  it('0.0823 → 0.09 (step=0.01)', () => expect(niceCeiling(0.0823)).toBeCloseTo(0.09));
  it('0 → 0', () => expect(niceCeiling(0)).toBe(0));
  it('exact multiple passes through: 130 → 130', () => expect(niceCeiling(130)).toBe(130));
  it('negative -127 → -120 (ceil toward zero)', () => expect(niceCeiling(-127)).toBeCloseTo(-120));
  it('negative -127.3 → -120 (ceil toward zero)', () => expect(niceCeiling(-127.3)).toBeCloseTo(-120));
  it('NaN → NaN', () => expect(niceCeiling(NaN)).toBeNaN());
});

describe('niceFloor', () => {
  it('127.3 → 120 (step=10)', () => expect(niceFloor(127.3)).toBe(120));
  it('1273 → 1200 (step=100)', () => expect(niceFloor(1273)).toBeCloseTo(1200));
  it('0.0823 → 0.08 (step=0.01)', () => expect(niceFloor(0.0823)).toBeCloseTo(0.08));
  it('0 → 0', () => expect(niceFloor(0)).toBe(0));
  it('exact multiple passes through: 120 → 120', () => expect(niceFloor(120)).toBe(120));
  it('negative -127 → -130 (floor away from zero)', () => expect(niceFloor(-127)).toBeCloseTo(-130));
  it('negative -127.3 → -130 (floor away from zero)', () => expect(niceFloor(-127.3)).toBeCloseTo(-130));
});

// ─── scaleLinear ─────────────────────────────────────────────────────────────

describe('scaleLinear', () => {
  it('maps domain midpoint to pixel midpoint', () => {
    expect(scaleLinear(50, 0, 100, 0, 400)).toBe(200);
  });

  it('maps domain min → pxMin', () => {
    expect(scaleLinear(0, 0, 100, 0, 400)).toBe(0);
  });

  it('maps domain max → pxMax', () => {
    expect(scaleLinear(100, 0, 100, 0, 400)).toBe(400);
  });

  it('inverted y-axis: pxMin > pxMax', () => {
    // value=130 (top of domain) should map to pxMax=0 (top of screen)
    const result = scaleLinear(130, 100, 130, 300, 0);
    expect(result).toBe(0);
    const mid = scaleLinear(115, 100, 130, 300, 0);
    expect(mid).toBe(150);
  });

  it('zero domain range → midpoint pixel', () => {
    expect(scaleLinear(50, 50, 50, 0, 400)).toBe(200);
  });

  it('NaN value → pxMin', () => {
    expect(scaleLinear(NaN, 0, 100, 0, 400)).toBe(0);
  });
});

// ─── dateAxisLabels ───────────────────────────────────────────────────────────

function buildDates(from: string, days: number): string[] {
  const result: string[] = [];
  const d = new Date(from);
  for (let i = 0; i < days; i++) {
    result.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return result;
}

describe('dateAxisLabels', () => {
  it('empty array → empty result', () => {
    expect(dateAxisLabels([])).toEqual([]);
  });

  it('single item → single label at index 0', () => {
    const result = dateAxisLabels(['2026-01-15']);
    expect(result).toHaveLength(1);
    expect(result[0].index).toBe(0);
  });

  it('returns exactly target labels when array is large enough', () => {
    const dates = buildDates('2026-01-01', 365);
    const result = dateAxisLabels(dates, 4);
    expect(result).toHaveLength(4);
    expect(result[0].index).toBe(0);
    expect(result[3].index).toBe(364);
  });

  it('indices are evenly distributed', () => {
    const dates = buildDates('2026-01-01', 100);
    const result = dateAxisLabels(dates, 5);
    // Expect approx 25-unit spacing
    const gaps = result.slice(1).map((r, i) => r.index - result[i].index);
    gaps.forEach(g => expect(g).toBeGreaterThanOrEqual(20));
  });

  it('zh-TW locale: labels use M/D format', () => {
    const dates = ['2026-01-05', '2026-06-15'];
    const result = dateAxisLabels(dates, 2, 'zh-TW');
    expect(result[0].label).toBe('1/5');
    expect(result[1].label).toBe('6/15');
  });

  it('en-US locale: first label uses month name', () => {
    const dates = buildDates('2026-03-01', 30);
    const result = dateAxisLabels(dates, 3, 'en-US');
    expect(result[0].label).toMatch(/^Mar/);
  });

  it('array smaller than target → deduplicates', () => {
    const result = dateAxisLabels(['2026-01-01', '2026-01-02'], 10);
    // Unique indices only: 0 and 1
    expect(result.length).toBeLessThanOrEqual(2);
  });
});
