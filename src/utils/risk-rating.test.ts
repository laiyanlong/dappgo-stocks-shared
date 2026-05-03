import { riskRating } from './risk-rating';

describe('riskRating', () => {
  it('no inputs → conservative middle (3)', () => {
    const r = riskRating({});
    expect(r.score).toBe(3);
    expect(r.emoji).toBe('🟠');
    expect(r.label).toBe('中');
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('all-null inputs → conservative middle (3)', () => {
    const r = riskRating({ beta: null, maxDrawdownPct: null, hv30: null });
    expect(r.score).toBe(3);
  });

  it('all green inputs → score 1 (lowest risk)', () => {
    // beta ≤ 1.6, drawdown mild, hv30 low.
    const r = riskRating({ beta: 0.8, maxDrawdownPct: -10, hv30: 20 });
    expect(r.score).toBe(1);
    expect(r.emoji).toBe('🟢');
    expect(r.label).toBe('低');
    expect(r.reasons).toHaveLength(0);
  });

  it('all bad inputs → score 5 (highest risk)', () => {
    // beta > 2 (+2), drawdown < -50 (+2), hv30 > 50 (+1) → 1+5 = 6, clamped to 5.
    const r = riskRating({ beta: 2.5, maxDrawdownPct: -60, hv30: 80 });
    expect(r.score).toBe(5);
    expect(r.emoji).toBe('⚫');
    expect(r.label).toBe('高');
    expect(r.reasons.length).toBe(3);
  });

  it('beta-only (moderate) → score 2', () => {
    const r = riskRating({ beta: 1.8 });
    expect(r.score).toBe(2);
    expect(r.emoji).toBe('🟡');
    expect(r.label).toBe('中低');
    expect(r.reasons).toHaveLength(1);
  });

  it('high beta + severe drawdown → score 4', () => {
    // beta > 2 (+2), drawdown < -30 but ≥ -50 (+1) → 1+3=4
    const r = riskRating({ beta: 2.2, maxDrawdownPct: -35 });
    expect(r.score).toBe(4);
    expect(r.emoji).toBe('🔴');
    expect(r.label).toBe('中高');
  });
});
