import {
  gate,
  truncateForTier,
  limitForTier,
  daysUntilExpiry,
  effectiveTier,
} from './feature-gating';

// --- gate ---

describe('gate', () => {
  it('free + free required → allowed', () => {
    const r = gate('free', 'free', 42);
    expect(r).toEqual({ allowed: true, value: 42, reason: 'allowed' });
  });

  it('free + pro required → denied with requires_pro', () => {
    const r = gate('free', 'pro', 'data');
    expect(r).toEqual({ allowed: false, value: null, reason: 'requires_pro' });
  });

  it('free + pro_plus required → denied with requires_pro_plus', () => {
    const r = gate('free', 'pro_plus', true);
    expect(r).toEqual({ allowed: false, value: null, reason: 'requires_pro_plus' });
  });

  it('pro + pro required → allowed', () => {
    const r = gate('pro', 'pro', [1, 2, 3]);
    expect(r).toEqual({ allowed: true, value: [1, 2, 3], reason: 'allowed' });
  });

  it('pro + pro_plus required → denied with requires_pro_plus', () => {
    const r = gate('pro', 'pro_plus', 'premium');
    expect(r).toEqual({ allowed: false, value: null, reason: 'requires_pro_plus' });
  });

  it('pro_plus + pro_plus required → allowed', () => {
    const r = gate('pro_plus', 'pro_plus', 'top');
    expect(r).toEqual({ allowed: true, value: 'top', reason: 'allowed' });
  });

  it('pro_plus allows free-tier content', () => {
    const r = gate('pro_plus', 'free', 99);
    expect(r).toEqual({ allowed: true, value: 99, reason: 'allowed' });
  });
});

// --- truncateForTier ---

describe('truncateForTier', () => {
  const long = 'a'.repeat(150);

  it('free truncates text beyond freeMaxChars', () => {
    const r = truncateForTier(long, 'free', 100);
    expect(r.text).toHaveLength(100);
    expect(r.truncated).toBe(true);
  });

  it('free does not truncate text within limit', () => {
    const r = truncateForTier('short', 'free', 100);
    expect(r.text).toBe('short');
    expect(r.truncated).toBe(false);
  });

  it('pro does not truncate regardless of length', () => {
    const r = truncateForTier(long, 'pro', 100);
    expect(r.text).toBe(long);
    expect(r.truncated).toBe(false);
  });

  it('pro_plus does not truncate', () => {
    const r = truncateForTier(long, 'pro_plus', 100);
    expect(r.truncated).toBe(false);
  });

  it('uses default freeMaxChars of 100', () => {
    const r = truncateForTier('b'.repeat(101), 'free');
    expect(r.text).toHaveLength(100);
    expect(r.truncated).toBe(true);
  });
});

// --- limitForTier ---

describe('limitForTier', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];

  it('free clips to freeLimit and reports clipped count', () => {
    const r = limitForTier(items, 'free', 5);
    expect(r.items).toHaveLength(5);
    expect(r.clipped).toBe(3);
  });

  it('free does not clip when within limit', () => {
    const r = limitForTier([1, 2], 'free', 5);
    expect(r.items).toEqual([1, 2]);
    expect(r.clipped).toBe(0);
  });

  it('pro returns all items with clipped=0', () => {
    const r = limitForTier(items, 'pro', 5);
    expect(r.items).toBe(items);
    expect(r.clipped).toBe(0);
  });

  it('uses default freeLimit of 5', () => {
    const r = limitForTier([1, 2, 3, 4, 5, 6], 'free');
    expect(r.items).toHaveLength(5);
    expect(r.clipped).toBe(1);
  });
});

// --- daysUntilExpiry ---

describe('daysUntilExpiry', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('returns ~30 days for a date 30 days in the future', () => {
    const r = daysUntilExpiry('2026-01-31T00:00:00Z', now);
    expect(r).toBe(30);
  });

  it('returns negative days for an expired date', () => {
    const r = daysUntilExpiry('2025-12-01T00:00:00Z', now);
    expect(r).toBeLessThan(0);
  });

  it('returns null for null input', () => {
    expect(daysUntilExpiry(null, now)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(daysUntilExpiry(undefined, now)).toBeNull();
  });
});

// --- effectiveTier ---

describe('effectiveTier', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('stored free → returns free regardless of expiry', () => {
    expect(effectiveTier('free', '2030-01-01T00:00:00Z', now)).toBe('free');
  });

  it('expired pro subscription → returns free', () => {
    expect(effectiveTier('pro', '2025-06-01T00:00:00Z', now)).toBe('free');
  });

  it('valid pro subscription → returns pro', () => {
    expect(effectiveTier('pro', '2026-06-01T00:00:00Z', now)).toBe('pro');
  });

  it('valid pro_plus subscription → returns pro_plus', () => {
    expect(effectiveTier('pro_plus', '2027-01-01T00:00:00Z', now)).toBe('pro_plus');
  });

  it('null expiry on pro → returns free (treated as expired)', () => {
    expect(effectiveTier('pro', null, now)).toBe('free');
  });
});
