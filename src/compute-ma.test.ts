import { computeMA } from './compute-ma';

const bars = (closes: number[]) => closes.map((c) => ({ close: c }));

describe('computeMA', () => {
  it('returns empty array on empty input', () => {
    expect(computeMA([], 5)).toEqual([]);
  });

  it('returns all nulls when window > length', () => {
    expect(computeMA(bars([1, 2, 3]), 5)).toEqual([null, null, null]);
  });

  it('returns the value itself when window=1', () => {
    expect(computeMA(bars([10, 20, 30]), 1)).toEqual([10, 20, 30]);
  });

  it('fills with null until the window is satisfied', () => {
    const out = computeMA(bars([10, 20, 30, 40]), 3);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[2]).toBe(20);            // (10+20+30)/3
    expect(out[3]).toBe(30);            // (20+30+40)/3
  });

  it('rolls the window across longer series', () => {
    const out = computeMA(bars([1, 2, 3, 4, 5, 6, 7, 8]), 4);
    // Expected: nulls at 0..2, then averages of 1234, 2345, 3456, 4567, 5678
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[2]).toBeNull();
    expect(out[3]).toBe(2.5);
    expect(out[4]).toBe(3.5);
    expect(out[5]).toBe(4.5);
    expect(out[6]).toBe(5.5);
    expect(out[7]).toBe(6.5);
  });

  it('handles window equal to length', () => {
    const out = computeMA(bars([2, 4, 6, 8]), 4);
    expect(out).toEqual([null, null, null, 5]);
  });

  it('handles non-positive window defensively', () => {
    expect(computeMA(bars([1, 2, 3]), 0)).toEqual([null, null, null]);
    expect(computeMA(bars([1, 2, 3]), -5)).toEqual([null, null, null]);
  });

  it('handles negative close prices', () => {
    const out = computeMA(bars([-2, -4, -6, -8]), 2);
    expect(out).toEqual([null, -3, -5, -7]);
  });

  it('output length matches input length', () => {
    for (const len of [0, 1, 5, 19, 20, 21, 200]) {
      const closes = Array.from({ length: len }, (_, i) => i + 1);
      expect(computeMA(bars(closes), 20).length).toBe(len);
    }
  });
});
