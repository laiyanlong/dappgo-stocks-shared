import { explainVerdict, type SignalsLike } from './verdict-explainer';

// ── helpers ──────────────────────────────────────────────────────────────────

const tw: SignalsLike = {
  verdict: 'BUY',
  verdict_reason: '整體技術面偏多',
  trend_reason: '均線多頭排列',
  momentum_reason: 'RSI 上揚',
  volume_reason: '成交量放大',
  chip_reason: '主力籌碼集中',
  contributions: { trend: 2, momentum: 1.5, volume: 0.5, chip: 1 },
};

const us: SignalsLike = {
  verdict: 'SELL',
  verdict_reason: 'Technicals deteriorating',
  trend_reason: 'Price below 200MA',
  momentum_reason: 'MACD bearish crossover',
  volume_reason: 'Volume declining',
  ownership_reason: 'Institutional selling',
  contributions: { trend: -2, momentum: -1, volume: -0.5, ownership: -1.5 },
};

// ── 1. Each verdict label translates correctly (zh-TW) ───────────────────────

test('BUY headline contains 買進', () => {
  const r = explainVerdict({ verdict: 'BUY', contributions: { trend: 1 } });
  expect(r.headline).toContain('買進');
});

test('HOLD headline contains 持有', () => {
  const r = explainVerdict({ verdict: 'HOLD', contributions: { momentum: 0.5 } });
  expect(r.headline).toContain('持有');
});

test('WATCH headline contains 觀望', () => {
  const r = explainVerdict({ verdict: 'WATCH', contributions: { volume: 0.2 } });
  expect(r.headline).toContain('觀望');
});

test('AVOID headline contains 避開', () => {
  const r = explainVerdict({ verdict: 'AVOID', contributions: { trend: -1 } });
  expect(r.headline).toContain('避開');
});

test('SELL headline contains 賣出', () => {
  const r = explainVerdict({ verdict: 'SELL', contributions: { trend: -2 } });
  expect(r.headline).toContain('賣出');
});

// ── 2. Dominant axis selection ────────────────────────────────────────────────

test('dominant axis is axis with highest |contribution|', () => {
  const r = explainVerdict(tw);
  expect(r.dominantAxis).toBe('trend');
  expect(r.headline).toContain('趨勢主導');
});

test('dominant axis tie-break: trend > momentum when |contributions| equal', () => {
  const input: SignalsLike = {
    verdict: 'BUY',
    contributions: { trend: 1, momentum: 1 },
  };
  const r = explainVerdict(input);
  expect(r.dominantAxis).toBe('trend');
});

test('dominant axis tie-break: momentum > volume', () => {
  const input: SignalsLike = {
    verdict: 'HOLD',
    contributions: { momentum: 0.8, volume: 0.8 },
  };
  const r = explainVerdict(input);
  expect(r.dominantAxis).toBe('momentum');
});

// ── 3. TW (chip) vs US (ownership) shapes both work ──────────────────────────

test('TW chip axis detected as dominant', () => {
  const input: SignalsLike = {
    verdict: 'BUY',
    chip_reason: '主力大量買超',
    contributions: { trend: 0.5, chip: 2 },
  };
  const r = explainVerdict(input);
  expect(r.dominantAxis).toBe('chip');
  expect(r.headline).toContain('籌碼');
});

test('US ownership axis detected as dominant', () => {
  const r = explainVerdict(us);
  expect(r.dominantAxis).toBe('trend'); // trend=-2 wins over ownership=-1.5
});

test('US ownership used in bullets when present', () => {
  const r = explainVerdict(us, 'en-US');
  expect(r.bullets.some((b) => b.includes('Ownership'))).toBe(true);
});

// ── 4. Null / undefined input ─────────────────────────────────────────────────

test('null input returns empty zh-TW result', () => {
  const r = explainVerdict(null);
  expect(r.headline).toBe('無足夠資訊');
  expect(r.detail).toBe('');
  expect(r.bullets).toEqual([]);
  expect(r.dominantAxis).toBeNull();
});

test('undefined input returns empty zh-TW result', () => {
  const r = explainVerdict(undefined);
  expect(r.headline).toBe('無足夠資訊');
});

// ── 5. Empty contributions → fallback to verdict_reason ──────────────────────

test('empty contributions object: detail falls back to verdict_reason', () => {
  const input: SignalsLike = {
    verdict: 'HOLD',
    verdict_reason: '持股不動',
    contributions: {},
  };
  const r = explainVerdict(input);
  expect(r.detail).toBe('持股不動');
  expect(r.dominantAxis).toBeNull();
});

test('null contributions: detail falls back to verdict_reason', () => {
  const input: SignalsLike = {
    verdict: 'WATCH',
    verdict_reason: '方向未明',
    contributions: null,
  };
  const r = explainVerdict(input);
  expect(r.detail).toBe('方向未明');
});

// ── 6. en-US locale ───────────────────────────────────────────────────────────

test('en-US: verdict labels in English', () => {
  const r = explainVerdict({ verdict: 'BUY', contributions: { trend: 1 } }, 'en-US');
  expect(r.headline).toContain('Buy');
  expect(r.headline).toContain('Trend');
});

test('en-US: null input returns English empty', () => {
  const r = explainVerdict(null, 'en-US');
  expect(r.headline).toBe('Insufficient data');
});

test('en-US: detail joined with semicolon-space', () => {
  const r = explainVerdict(us, 'en-US');
  expect(r.detail).toContain('; ');
});

// ── 7. Bullets ────────────────────────────────────────────────────────────────

test('bullets contain top axes formatted correctly (zh-TW)', () => {
  const r = explainVerdict(tw);
  // trend is top → first bullet should contain 趨勢
  expect(r.bullets[0]).toContain('趨勢');
  expect(r.bullets[0]).toMatch(/^「.*」$/);
});

test('bullets limited to top 4 axes', () => {
  const input: SignalsLike = {
    verdict: 'BUY',
    trend_reason: 'A',
    momentum_reason: 'B',
    volume_reason: 'C',
    chip_reason: 'D',
    ownership_reason: 'E',
    contributions: { trend: 5, momentum: 4, volume: 3, chip: 2, ownership: 1 },
  };
  const r = explainVerdict(input);
  expect(r.bullets.length).toBeLessThanOrEqual(4);
});

// ── 8. No verdict code → empty ────────────────────────────────────────────────

test('input with no verdict code returns empty', () => {
  const r = explainVerdict({ verdict: null });
  expect(r.headline).toBe('無足夠資訊');
});
