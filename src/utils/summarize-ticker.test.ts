import { summarizeTicker, type TickerSummaryInput } from './summarize-ticker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysFromNow(n: number): string {
  const d = new Date(Date.now() + n * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** Build a YYYY-MM-DD string `n` days after `now` using LOCAL time so it
 *  pairs deterministically with summarizeTicker's local-time daysUntil math.
 *  Use this in tests that pass an explicit `now` to summarizeTicker.
 */
function localDaysFromNow(n: number, now: Date): string {
  const d = new Date(now.getTime());
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// 1. Basic zh-TW with all fields
// ---------------------------------------------------------------------------

test('zh-TW full fields produces correct pieces', () => {
  const input: TickerSummaryInput = {
    symbol: 'AAPL',
    name: 'Apple',
    market: 'US',
    latestClose: 172.5,
    priceChangePct: 2.3,
    verdict: 'BUY',
    verdictReason: '突破壓力',
    trend: 'up',
    momentum: 'rising',
    sentimentLabel: 'positive',
    earningsDateNext: daysFromNow(30),
  };
  const result = summarizeTicker(input, 'zh-TW');

  expect(result.oneLine).toContain('Apple (AAPL)');
  expect(result.oneLine).toContain('買進');
  expect(result.oneLine).toContain('+2.3%');
  expect(result.oneLine.length).toBeLessThanOrEqual(80);

  expect(result.twoLine).toContain('Apple (AAPL) — 買進');
  expect(result.twoLine).toContain('上漲 +2.3%');
  expect(result.twoLine).toContain('趨勢向上');

  expect(result.detailed).toContain('Apple (AAPL)');
  expect(result.detailed).toContain('突破壓力');
  expect(result.detailed).toContain('新聞正面');

  // BUY → hasFreshSignal
  expect(result.hasFreshSignal).toBe(true);
});

// ---------------------------------------------------------------------------
// 2. en-US with all fields
// ---------------------------------------------------------------------------

test('en-US full fields uses English labels', () => {
  const input: TickerSummaryInput = {
    symbol: 'TSLA',
    name: 'Tesla',
    market: 'US',
    latestClose: 210.0,
    priceChangePct: -1.5,
    verdict: 'SELL',
    verdictReason: 'broke support',
    trend: 'down',
    momentum: 'falling',
    sentimentLabel: 'negative',
    earningsDateNext: daysFromNow(60),
  };
  const result = summarizeTicker(input, 'en-US');

  expect(result.oneLine).toContain('Tesla (TSLA)');
  expect(result.oneLine).toContain('SELL');
  expect(result.oneLine).toContain('-1.5%');
  expect(result.oneLine.length).toBeLessThanOrEqual(80);

  expect(result.twoLine).toContain('Tesla (TSLA) — SELL');
  expect(result.twoLine).toContain('Down -1.5%');
  expect(result.twoLine).toContain('Downtrend');

  expect(result.detailed).toContain('broke support');
  expect(result.detailed).toContain('News: Negative');

  // SELL → hasFreshSignal
  expect(result.hasFreshSignal).toBe(true);
});

// ---------------------------------------------------------------------------
// 3. Missing optional fields — no price, no verdict
// ---------------------------------------------------------------------------

test('missing optional fields — safe fallback without price/verdict', () => {
  const input: TickerSummaryInput = { symbol: 'MSFT', name: 'Microsoft' };
  const result = summarizeTicker(input);

  expect(result.oneLine).toBe('Microsoft (MSFT)');
  expect(result.twoLine).toBe('Microsoft (MSFT)');
  expect(result.detailed).toBe('Microsoft (MSFT)');
  expect(result.hasFreshSignal).toBe(false);
});

// ---------------------------------------------------------------------------
// 4. Only price, no verdict/trend/momentum
// ---------------------------------------------------------------------------

test('price only — no verdict section', () => {
  const input: TickerSummaryInput = {
    symbol: '2330',
    name: 'TSMC',
    latestClose: 850,
    priceChangePct: 0.5,
  };
  const result = summarizeTicker(input, 'zh-TW');

  expect(result.oneLine).toContain('上漲 +0.5%');
  expect(result.oneLine).not.toContain('買進');
  expect(result.hasFreshSignal).toBe(false);
});

// ---------------------------------------------------------------------------
// 5. Truncation — very long name exceeds 80 chars
// ---------------------------------------------------------------------------

test('truncation — oneLine capped at 80 chars', () => {
  const input: TickerSummaryInput = {
    symbol: 'LONGTICKERXYZ',
    name: 'A Very Long Company Name That Eats Into The Limit Inc',
    latestClose: 999.99,
    priceChangePct: 12.34,
    verdict: 'BUY',
    trend: 'up',
    momentum: 'strong',
  };
  const result = summarizeTicker(input);
  expect(result.oneLine.length).toBeLessThanOrEqual(80);
  expect(result.oneLine.endsWith('…')).toBe(true);
});

// ---------------------------------------------------------------------------
// 6. hasFreshSignal = true — earnings within 7 days
// ---------------------------------------------------------------------------

test('hasFreshSignal true when earnings in 3 days', () => {
  const input: TickerSummaryInput = {
    symbol: 'AMZN',
    name: 'Amazon',
    earningsDateNext: daysFromNow(3),
  };
  const result = summarizeTicker(input);
  expect(result.hasFreshSignal).toBe(true);
  expect(result.detailed).toContain('財報');
});

// ---------------------------------------------------------------------------
// 7. hasFreshSignal = true — very_positive sentiment
// ---------------------------------------------------------------------------

test('hasFreshSignal true when sentimentLabel=very_positive', () => {
  const input: TickerSummaryInput = {
    symbol: 'NVDA',
    name: 'Nvidia',
    sentimentLabel: 'very_positive',
  };
  const result = summarizeTicker(input);
  expect(result.hasFreshSignal).toBe(true);
});

// ---------------------------------------------------------------------------
// 8. hasFreshSignal = true — very_negative sentiment
// ---------------------------------------------------------------------------

test('hasFreshSignal true when sentimentLabel=very_negative', () => {
  const input: TickerSummaryInput = {
    symbol: 'GME',
    name: 'GameStop',
    sentimentLabel: 'very_negative',
  };
  const result = summarizeTicker(input);
  expect(result.hasFreshSignal).toBe(true);
});

// ---------------------------------------------------------------------------
// 9. hasFreshSignal = false — all conditions miss
// ---------------------------------------------------------------------------

test('hasFreshSignal false when verdict=HOLD, neutral sentiment, distant earnings', () => {
  const input: TickerSummaryInput = {
    symbol: 'KO',
    name: 'Coca-Cola',
    verdict: 'HOLD',
    sentimentLabel: 'neutral',
    earningsDateNext: daysFromNow(30),
  };
  const result = summarizeTicker(input);
  expect(result.hasFreshSignal).toBe(false);
});

// ---------------------------------------------------------------------------
// 10. hasFreshSignal = false — earnings today (day 0) still counts as fresh
// ---------------------------------------------------------------------------

test('hasFreshSignal true when earnings is today (day 0)', () => {
  const input: TickerSummaryInput = {
    symbol: 'META',
    name: 'Meta',
    earningsDateNext: daysFromNow(0),
  };
  const result = summarizeTicker(input);
  expect(result.hasFreshSignal).toBe(true);
});

// ---------------------------------------------------------------------------
// 11. hasFreshSignal false — earnings 8 days away is NOT fresh
// ---------------------------------------------------------------------------

test('hasFreshSignal false when earnings 8 days away', () => {
  const input: TickerSummaryInput = {
    symbol: 'GOOG',
    name: 'Alphabet',
    earningsDateNext: daysFromNow(8),
  };
  const result = summarizeTicker(input);
  expect(result.hasFreshSignal).toBe(false);
});

// ---------------------------------------------------------------------------
// 12. null/undefined optional fields — no crash
// ---------------------------------------------------------------------------

test('null fields are safe — no crash', () => {
  const input: TickerSummaryInput = {
    symbol: 'XYZ',
    name: 'Unknown Corp',
    latestClose: null,
    priceChangePct: null,
    verdict: null,
    verdictReason: null,
    trend: null,
    momentum: null,
    sentimentLabel: null,
    earningsDateNext: null,
  };
  expect(() => summarizeTicker(input)).not.toThrow();
  const result = summarizeTicker(input);
  expect(result.hasFreshSignal).toBe(false);
  expect(result.oneLine).toBe('Unknown Corp (XYZ)');
});

// ---------------------------------------------------------------------------
// 13. en-US earnings tag uses English
// ---------------------------------------------------------------------------

test('en-US earnings tag within 7 days uses English', () => {
  // Pin `now` to noon local time so the date arithmetic is stable across
  // timezones / clock-edge runs (was flaky when the system clock was within
  // a few hours of UTC midnight — toISOString() shifted the date by 1 day).
  const now = new Date(2026, 4, 4, 12, 0, 0);
  const input: TickerSummaryInput = {
    symbol: 'AAPL',
    name: 'Apple',
    earningsDateNext: localDaysFromNow(5, now),
  };
  const result = summarizeTicker(input, 'en-US', now);
  expect(result.detailed).toContain('Earnings in 5d');
  expect(result.hasFreshSignal).toBe(true);
});

// ---------------------------------------------------------------------------
// 14. Negative price change uses correct direction label
// ---------------------------------------------------------------------------

test('negative priceChangePct shows correct zh-TW direction', () => {
  const input: TickerSummaryInput = {
    symbol: '0050',
    name: '元大台灣50',
    priceChangePct: -3.2,
  };
  const result = summarizeTicker(input, 'zh-TW');
  expect(result.oneLine).toContain('下跌 -3.2%');
});

// ---------------------------------------------------------------------------
// 15. twoLine structure — has newline separator
// ---------------------------------------------------------------------------

test('twoLine contains newline when signal parts exist', () => {
  const input: TickerSummaryInput = {
    symbol: 'AAPL',
    name: 'Apple',
    verdict: 'BUY',
    priceChangePct: 1.0,
    momentum: 'rising',
  };
  const result = summarizeTicker(input, 'en-US');
  const lines = result.twoLine.split('\n');
  expect(lines.length).toBe(2);
  expect(lines[0]).toContain('BUY');
  expect(lines[1]).toContain('Rising momentum');
});
