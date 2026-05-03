import {
  formatPrice,
  formatPercent,
  formatVolume,
  formatMarketCap,
  formatCompactNumber,
  formatDate,
  formatRelativeDate,
} from './formatters';

const EM = '—';

// ---------------------------------------------------------------------------
// formatPrice — 7 cases
// ---------------------------------------------------------------------------
describe('formatPrice', () => {
  it('formats basic positive number with 2 decimals', () => {
    expect(formatPrice(1234.56)).toBe('1,234.56');
  });

  it('respects custom decimals option', () => {
    expect(formatPrice(1234.5678, { decimals: 3 })).toBe('1,234.568');
  });

  it('prefixes TWD currency', () => {
    expect(formatPrice(1234.56, { currency: 'TWD' })).toBe('TWD 1,234.56');
  });

  it('prefixes USD with dollar sign', () => {
    expect(formatPrice(1234.56, { currency: 'USD' })).toBe('$1,234.56');
  });

  it('shows + sign on positive when showSign is true', () => {
    expect(formatPrice(1.2, { showSign: true })).toBe('+1.20');
  });

  it('shows - sign on negative value (no + prefix)', () => {
    expect(formatPrice(-99.5, { showSign: true })).toBe('-99.50');
  });

  it('returns em-dash for null', () => {
    expect(formatPrice(null)).toBe(EM);
  });

  it('returns em-dash for undefined', () => {
    expect(formatPrice(undefined)).toBe(EM);
  });
});

// ---------------------------------------------------------------------------
// formatPercent — 6 cases
// ---------------------------------------------------------------------------
describe('formatPercent', () => {
  it('formats positive percent with + sign by default', () => {
    expect(formatPercent(12.34)).toBe('+12.34%');
  });

  it('formats negative percent', () => {
    expect(formatPercent(-3.21)).toBe('-3.21%');
  });

  it('formats zero without sign', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('suppresses sign when showSign is false', () => {
    expect(formatPercent(5.5, { showSign: false })).toBe('5.50%');
  });

  it('respects custom decimals', () => {
    expect(formatPercent(1.5, { decimals: 1 })).toBe('+1.5%');
  });

  it('returns em-dash for null', () => {
    expect(formatPercent(null)).toBe(EM);
  });
});

// ---------------------------------------------------------------------------
// formatVolume — 5 cases
// ---------------------------------------------------------------------------
describe('formatVolume', () => {
  it('formats thousands', () => {
    expect(formatVolume(1234)).toBe('1.23K');
  });

  it('formats millions', () => {
    expect(formatVolume(1500000)).toBe('1.50M');
  });

  it('formats billions', () => {
    expect(formatVolume(1e10)).toBe('10.00B');
  });

  it('formats sub-thousand as compact', () => {
    expect(formatVolume(500)).toBe('500.00');
  });

  it('returns em-dash for null', () => {
    expect(formatVolume(null)).toBe(EM);
  });
});

// ---------------------------------------------------------------------------
// formatMarketCap — 5 cases
// ---------------------------------------------------------------------------
describe('formatMarketCap', () => {
  it('USD billions', () => {
    expect(formatMarketCap(12_345_678_901, 'USD')).toBe('USD 12.35B');
  });

  it('USD millions', () => {
    expect(formatMarketCap(5_000_000, 'USD')).toBe('USD 5.00M');
  });

  it('TWD 億 range', () => {
    expect(formatMarketCap(123_500_000_000, 'TWD')).toBe('新台幣 1235.0億');
  });

  it('TWD 萬 range', () => {
    expect(formatMarketCap(12_345_678, 'TWD')).toBe('新台幣 1234.57萬');
  });

  it('returns em-dash for null', () => {
    expect(formatMarketCap(null)).toBe(EM);
  });
});

// ---------------------------------------------------------------------------
// formatDate — 4 cases
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  it('zh-TW formats as YYYY/MM/DD', () => {
    expect(formatDate('2026-05-02', 'zh-TW')).toBe('2026/05/02');
  });

  it('en-US formats as M/D/YYYY', () => {
    expect(formatDate('2026-05-02', 'en-US')).toBe('5/2/2026');
  });

  it('returns em-dash for null', () => {
    expect(formatDate(null)).toBe(EM);
  });

  it('returns em-dash for malformed string', () => {
    expect(formatDate('not-a-date')).toBe(EM);
  });
});

// ---------------------------------------------------------------------------
// formatRelativeDate — 6 cases
// ---------------------------------------------------------------------------
describe('formatRelativeDate', () => {
  const NOW = new Date(2026, 4, 2); // 2026-05-02 (month is 0-indexed)

  it('returns 今天 / Today for same day', () => {
    expect(formatRelativeDate('2026-05-02', NOW, 'zh-TW')).toBe('今天');
    expect(formatRelativeDate('2026-05-02', NOW, 'en-US')).toBe('Today');
  });

  it('returns 明天 / Tomorrow for next day', () => {
    expect(formatRelativeDate('2026-05-03', NOW, 'zh-TW')).toBe('明天');
    expect(formatRelativeDate('2026-05-03', NOW, 'en-US')).toBe('Tomorrow');
  });

  it('returns 昨天 / Yesterday for previous day', () => {
    expect(formatRelativeDate('2026-05-01', NOW, 'zh-TW')).toBe('昨天');
    expect(formatRelativeDate('2026-05-01', NOW, 'en-US')).toBe('Yesterday');
  });

  it('returns weekday label for dates within 7 days (zh-TW)', () => {
    // 2026-05-06 is Wednesday (3 days from 2026-05-02 which is Saturday → Wed)
    // 2026-05-02 is Saturday; +4 days = 2026-05-06 = Wednesday
    const result = formatRelativeDate('2026-05-06', NOW, 'zh-TW');
    expect(result).toBe('週三');
  });

  it('returns weekday label for dates within 7 days (en-US)', () => {
    const result = formatRelativeDate('2026-05-06', NOW, 'en-US');
    expect(result).toBe('Wednesday');
  });

  it('falls back to formatted date for dates >= 7 days away', () => {
    expect(formatRelativeDate('2026-05-20', NOW, 'zh-TW')).toBe('2026/05/20');
    expect(formatRelativeDate('2026-04-10', NOW, 'en-US')).toBe('4/10/2026');
  });
});
