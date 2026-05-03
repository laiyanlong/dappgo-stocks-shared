import { daysUntil } from './days-until';

describe('daysUntil', () => {
  it('returns null for null / undefined / empty / invalid', () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(undefined)).toBeNull();
    expect(daysUntil('')).toBeNull();
    expect(daysUntil('not-a-date')).toBeNull();
  });

  it('returns 0 when target is today (date-only string)', () => {
    const now = new Date(2026, 4, 2, 14, 30); // 2026-05-02 14:30 local
    expect(daysUntil('2026-05-02', now)).toBe(0);
  });

  it('returns positive integer for future dates', () => {
    const now = new Date(2026, 4, 2);
    expect(daysUntil('2026-05-09', now)).toBe(7);
  });

  it('returns negative integer for past dates', () => {
    const now = new Date(2026, 4, 2);
    expect(daysUntil('2026-04-30', now)).toBe(-2);
  });

  it('handles year boundary correctly', () => {
    const now = new Date(2026, 11, 31);
    expect(daysUntil('2027-01-02', now)).toBe(2);
  });

  it('tolerates ISO datetime strings (not just date-only)', () => {
    const now = new Date(2026, 4, 2, 9, 0);
    // Both forms should normalise to start-of-day and yield same delta.
    const a = daysUntil('2026-05-09', now);
    const b = daysUntil('2026-05-09T12:00:00', now);
    expect(a).toBe(7);
    expect(b).toBe(7);
  });

  it('still returns 0 even when now has a late time component', () => {
    const now = new Date(2026, 4, 2, 23, 59, 59);
    expect(daysUntil('2026-05-02', now)).toBe(0);
  });

  it('defaults `now` to current time when omitted', () => {
    // Smoke test: passing no second arg should not throw and should
    // produce a number (or null for invalid input).
    expect(typeof daysUntil('2099-01-01')).toBe('number');
  });
});
