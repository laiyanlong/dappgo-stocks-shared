import {
  computeCompleteness,
  isFieldFilled,
  DEFAULT_FIELDS_TW,
  DEFAULT_FIELDS_US,
  DEFAULT_FIELDS_OPTIONS,
} from './data-completeness';

const TW = DEFAULT_FIELDS_TW as readonly string[];
const US = DEFAULT_FIELDS_US as readonly string[];
const OPTIONS = DEFAULT_FIELDS_OPTIONS as readonly string[];

// --- isFieldFilled ---

describe('isFieldFilled', () => {
  it('null → false', () => expect(isFieldFilled(null)).toBe(false));
  it('undefined → false', () => expect(isFieldFilled(undefined)).toBe(false));
  it('empty string → false', () => expect(isFieldFilled('')).toBe(false));
  it('empty array → false', () => expect(isFieldFilled([])).toBe(false));
  it('empty object → false', () => expect(isFieldFilled({})).toBe(false));
  it('false → false', () => expect(isFieldFilled(false)).toBe(false));

  it('0 (numeric zero) → true', () => expect(isFieldFilled(0)).toBe(true));
  it('non-empty string → true', () => expect(isFieldFilled('data')).toBe(true));
  it('non-empty array → true', () => expect(isFieldFilled([1])).toBe(true));
  it('non-empty object → true', () => expect(isFieldFilled({ a: 1 })).toBe(true));
  it('positive number → true', () => expect(isFieldFilled(42)).toBe(true));
  it('true → true', () => expect(isFieldFilled(true)).toBe(true));
});

// --- computeCompleteness ---

describe('computeCompleteness', () => {
  it('all fields filled → 100%, excellent', () => {
    const ticker = Object.fromEntries(TW.map((f) => [f, { value: 1 }]));
    const r = computeCompleteness(ticker, TW);
    expect(r.pct).toBe(100);
    expect(r.tier).toBe('excellent');
    expect(r.missing).toHaveLength(0);
    expect(r.filledCount).toBe(TW.length);
  });

  it('half filled → ~50%, partial', () => {
    const half = TW.slice(0, Math.floor(TW.length / 2));
    const ticker = Object.fromEntries(half.map((f) => [f, [1]]));
    const r = computeCompleteness(ticker, TW);
    expect(r.pct).toBeLessThan(60);
    expect(r.pct).toBeGreaterThan(30);
    expect(r.tier).toBe('partial');
  });

  it('empty ticker → 0%, sparse', () => {
    const r = computeCompleteness({}, TW);
    expect(r.pct).toBe(0);
    expect(r.tier).toBe('sparse');
    expect(r.missing).toEqual([...TW]);
    expect(r.filledCount).toBe(0);
  });

  it('empty array field → not filled', () => {
    const ticker = Object.fromEntries(TW.map((f) => [f, []]));
    const r = computeCompleteness(ticker, TW);
    expect(r.pct).toBe(0);
    expect(r.filledCount).toBe(0);
  });

  it('empty object field → not filled', () => {
    const ticker = Object.fromEntries(TW.map((f) => [f, {}]));
    const r = computeCompleteness(ticker, TW);
    expect(r.pct).toBe(0);
  });

  it('null field → not filled', () => {
    const ticker = { indicators: null };
    const r = computeCompleteness(ticker, ['indicators']);
    expect(r.pct).toBe(0);
    expect(r.missing).toContain('indicators');
  });

  it('numeric zero field → filled', () => {
    const r = computeCompleteness({ indicators: 0 }, ['indicators']);
    expect(r.pct).toBe(100);
    expect(r.filledCount).toBe(1);
    expect(r.missing).toHaveLength(0);
  });

  it('custom field list works', () => {
    const fields = ['a', 'b', 'c'] as const;
    const r = computeCompleteness({ a: [1], b: 'yes' }, fields);
    expect(r.filledCount).toBe(2);
    expect(r.totalCount).toBe(3);
    expect(r.missing).toContain('c');
  });

  it('≥90% → excellent tier', () => {
    const ticker = Object.fromEntries(US.map((f) => [f, { ok: true }]));
    const r = computeCompleteness(ticker, US);
    expect(r.tier).toBe('excellent');
  });

  it('≥70% <90% → good tier', () => {
    // fill 8 of 12 US fields → 67%? let us target exactly 75%: 9/12
    const nine = US.slice(0, 9);
    const ticker = Object.fromEntries(nine.map((f) => [f, [1]]));
    const r = computeCompleteness(ticker, US);
    expect(r.tier).toBe('good');
  });

  it('empty field list → 100%, excellent, no missing', () => {
    const r = computeCompleteness({ a: 1 }, []);
    expect(r.pct).toBe(100);
    expect(r.tier).toBe('excellent');
    expect(r.missing).toHaveLength(0);
  });

  it('missing list matches unfilled keys', () => {
    const r = computeCompleteness({ indicators: { v: 1 }, chip: null }, ['indicators', 'chip', 'news']);
    expect(r.missing).toEqual(['chip', 'news']);
    expect(r.filledCount).toBe(1);
  });
});

// --- DEFAULT_FIELDS_OPTIONS tier mapping (mirrors data-completeness-display.test.ts in US app) ---

describe('data-completeness (OPTIONS)', () => {
  it('tier: excellent — all OPTIONS fields filled', () => {
    const ticker: Record<string, unknown> = {};
    for (const f of OPTIONS) {
      ticker[f] = { value: 1 };
    }
    const r = computeCompleteness(ticker, OPTIONS);
    expect(r.tier).toBe('excellent');
    expect(r.pct).toBe(100);
    expect(r.missing).toHaveLength(0);
    expect(r.filledCount).toBe(OPTIONS.length);
  });

  it('tier: good — ~78% filled (7 of 9)', () => {
    const ticker: Record<string, unknown> = {};
    OPTIONS.slice(0, 7).forEach((f) => { ticker[f] = [1]; });
    const r = computeCompleteness(ticker, OPTIONS);
    expect(r.tier).toBe('good');
    expect(r.filledCount).toBe(7);
    expect(r.missing).toHaveLength(2);
  });

  it('tier: partial — ~56% filled (5 of 9)', () => {
    const ticker: Record<string, unknown> = {};
    OPTIONS.slice(0, 5).forEach((f) => { ticker[f] = 'data'; });
    const r = computeCompleteness(ticker, OPTIONS);
    expect(r.tier).toBe('partial');
    expect(r.filledCount).toBe(5);
  });

  it('tier: sparse — fewer than 40% filled (3 of 9 = 33%)', () => {
    const ticker: Record<string, unknown> = {
      live_prices: [{ price: 100 }],
      options_matrices: { AAPL: [] },
      summary: { vix: 20 },
    };
    const r = computeCompleteness(ticker, OPTIONS);
    expect(r.tier).toBe('sparse');
    expect(r.pct).toBeLessThan(40);
    expect(r.missing.length).toBeGreaterThan(0);
  });

  it('OPTIONS field list has expected length', () => {
    expect(OPTIONS.length).toBe(9);
  });

  it('OPTIONS contains expected canonical keys', () => {
    expect(OPTIONS).toContain('live_prices');
    expect(OPTIONS).toContain('options_matrices');
    expect(OPTIONS).toContain('oi_distribution');
    expect(OPTIONS).toContain('timing');
    expect(OPTIONS).toContain('ticker_stats');
  });
});
