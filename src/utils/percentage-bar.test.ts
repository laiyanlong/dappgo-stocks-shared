import { percentageBar } from './percentage-bar';

describe('percentageBar', () => {
  it('null input → empty result', () => {
    const r = percentageBar(null);
    expect(r.segments).toHaveLength(0);
    expect(r.total).toBe(0);
  });

  it('undefined input → empty result', () => {
    expect(percentageBar(undefined).segments).toHaveLength(0);
  });

  it('all-zero values → empty result (total = 0)', () => {
    const r = percentageBar({ advancers: 0, decliners: 0, unchanged: 0 });
    expect(r.segments).toHaveLength(0);
    expect(r.total).toBe(0);
  });

  it('typical advancers/decliners/unchanged', () => {
    const r = percentageBar({ advancers: 412, decliners: 198, unchanged: 50 });
    expect(r.total).toBe(660);
    expect(r.segments).toHaveLength(3);

    const adv = r.segments.find(s => s.key === 'advancers')!;
    expect(adv.value).toBe(412);
    expect(adv.ratio).toBeCloseTo(412 / 660, 5);
    expect(adv.pct).toBeCloseTo((412 / 660) * 100, 1);

    // Pct values sum near 100 (rounding artefacts)
    const pctSum = r.segments.reduce((s, seg) => s + seg.pct, 0);
    expect(pctSum).toBeGreaterThanOrEqual(99.9);
    expect(pctSum).toBeLessThanOrEqual(100.1);
  });

  it('single non-zero segment → 100% pct, ratio=1', () => {
    const r = percentageBar({ only: 5 });
    expect(r.segments).toHaveLength(1);
    expect(r.segments[0].ratio).toBe(1);
    expect(r.segments[0].pct).toBe(100);
  });

  it('null/undefined values are skipped', () => {
    const r = percentageBar({ a: 100, b: null, c: undefined, d: 100 });
    expect(r.segments).toHaveLength(2);
    expect(r.total).toBe(200);
    const keys = r.segments.map(s => s.key);
    expect(keys).not.toContain('b');
    expect(keys).not.toContain('c');
  });

  it('negative values are clamped to 0 and excluded when all clamp to 0', () => {
    const r = percentageBar({ a: -10, b: -5 });
    expect(r.segments).toHaveLength(0);
    expect(r.total).toBe(0);
  });

  it('mix of negative and positive: negatives clamped to 0, positives compute normally', () => {
    const r = percentageBar({ a: -50, b: 200 });
    expect(r.total).toBe(200);
    expect(r.segments).toHaveLength(2);
    const a = r.segments.find(s => s.key === 'a')!;
    expect(a.value).toBe(0);
    expect(a.ratio).toBe(0);
    expect(a.pct).toBe(0);
    const b = r.segments.find(s => s.key === 'b')!;
    expect(b.ratio).toBe(1);
  });

  it('preserves insertion order (Object.entries order)', () => {
    const r = percentageBar({ z: 1, a: 2, m: 3 });
    expect(r.segments.map(s => s.key)).toEqual(['z', 'a', 'm']);
  });
});
