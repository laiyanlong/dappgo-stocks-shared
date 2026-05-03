import {
  regimeDisplay,
  volRegimeLabel,
  trendArrow,
  isBenchmarkAbove50,
  isBenchmarkAbove200,
  benchmarkTrend,
  type RegimeData,
} from './regime-display';

// --- regimeDisplay ---

test('risk_on zh-TW', () => {
  const d = regimeDisplay('risk_on');
  expect(d.emoji).toBe('🟢');
  expect(d.label).toBe('風險偏好');
  expect(d.tone).toBe('positive');
});

test('risk_off en-US', () => {
  const d = regimeDisplay('risk_off', 'en-US');
  expect(d.emoji).toBe('🔴');
  expect(d.label).toBe('Risk Off');
  expect(d.tone).toBe('negative');
});

test('mixed tone is mild_negative', () => {
  expect(regimeDisplay('mixed').tone).toBe('mild_negative');
});

test('neutral tone is neutral', () => {
  expect(regimeDisplay('neutral').tone).toBe('neutral');
});

test('unknown zh-TW label is 資料不足', () => {
  expect(regimeDisplay('unknown').label).toBe('資料不足');
});

test('null regime defaults to unknown', () => {
  const d = regimeDisplay(null);
  expect(d.label).toBe('資料不足');
  expect(d.tone).toBe('neutral');
});

test('undefined regime defaults to unknown en-US', () => {
  expect(regimeDisplay(undefined, 'en-US').label).toBe('Unknown');
});

// --- volRegimeLabel ---

test('volRegimeLabel calm zh-TW', () => {
  expect(volRegimeLabel('calm')).toBe('低波動');
});

test('volRegimeLabel choppy en-US', () => {
  expect(volRegimeLabel('choppy', 'en-US')).toBe('Choppy');
});

test('volRegimeLabel high zh-TW', () => {
  expect(volRegimeLabel('high')).toBe('高波動');
});

test('volRegimeLabel null returns unknown label', () => {
  expect(volRegimeLabel(null)).toBe('未知');
  expect(volRegimeLabel(undefined, 'en-US')).toBe('Unknown');
});

// --- trendArrow ---

test('trendArrow up', () => { expect(trendArrow('up')).toBe('↑'); });
test('trendArrow down', () => { expect(trendArrow('down')).toBe('↓'); });
test('trendArrow sideways', () => { expect(trendArrow('sideways')).toBe('→'); });
test('trendArrow null returns em dash', () => { expect(trendArrow(null)).toBe('—'); });
test('trendArrow undefined returns em dash', () => { expect(trendArrow(undefined)).toBe('—'); });

// --- benchmark unifiers ---

test('isBenchmarkAbove50: prefers taiex when present', () => {
  const d: RegimeData = { taiex_above_50ma: true, spy_above_50ma: false };
  expect(isBenchmarkAbove50(d)).toBe(true);
});

test('isBenchmarkAbove50: falls back to spy when taiex absent', () => {
  const d: RegimeData = { spy_above_50ma: false };
  expect(isBenchmarkAbove50(d)).toBe(false);
});

test('isBenchmarkAbove50: null when neither present', () => {
  expect(isBenchmarkAbove50({})).toBeNull();
});

test('isBenchmarkAbove200: prefers taiex', () => {
  const d: RegimeData = { taiex_above_200ma: false, spy_above_200ma: true };
  expect(isBenchmarkAbove200(d)).toBe(false);
});

test('isBenchmarkAbove200: falls back to spy', () => {
  const d: RegimeData = { spy_above_200ma: true };
  expect(isBenchmarkAbove200(d)).toBe(true);
});

test('isBenchmarkAbove200: null when neither present', () => {
  expect(isBenchmarkAbove200({})).toBeNull();
});

test('benchmarkTrend: prefers taiex_trend', () => {
  const d: RegimeData = { taiex_trend: 'up', spy_trend: 'down' };
  expect(benchmarkTrend(d)).toBe('up');
});

test('benchmarkTrend: falls back to spy_trend', () => {
  const d: RegimeData = { spy_trend: 'sideways' };
  expect(benchmarkTrend(d)).toBe('sideways');
});

test('benchmarkTrend: null when neither present', () => {
  expect(benchmarkTrend({})).toBeNull();
});
