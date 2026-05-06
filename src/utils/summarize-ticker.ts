/**
 * Produce human-readable summary strings from engine output.
 * Used for share text, push notifications, and search-result snippets.
 *
 * Pure function — no IO, no side effects, no deps beyond standard TypeScript.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TickerSummaryInput {
  symbol: string;
  name: string;
  market?: 'TW' | 'US';
  latestClose?: number | null;
  priceChangePct?: number | null;
  verdict?: string | null;
  verdictReason?: string | null;
  trend?: string | null;
  momentum?: string | null;
  // News sentiment
  sentimentLabel?: string | null;
  // Earnings imminent?
  earningsDateNext?: string | null;
}

export interface TickerSummary {
  /** <= 80 chars: "${name} (${symbol}): BUY · 上漲 +2.3% · 動能轉強" */
  oneLine: string;
  /** line1: "${name} (${symbol}) — BUY"; line2: "上漲 +2.3% · 趨勢轉強" */
  twoLine: string;
  /** 4-5 lines suitable for share message */
  detailed: string;
  /** true if earnings within 7d OR sentiment strong+ OR verdict BUY/SELL */
  hasFreshSignal: boolean;
}

// ---------------------------------------------------------------------------
// Locale maps
// ---------------------------------------------------------------------------

const VERDICT_ZH: Record<string, string> = {
  BUY:  '買進',
  HOLD: '持有',
  WATCH: '觀望',
  AVOID: '避開',
  SELL: '賣出',
};

const VERDICT_EN: Record<string, string> = {
  BUY:  'BUY',
  HOLD: 'HOLD',
  WATCH: 'WATCH',
  AVOID: 'AVOID',
  SELL: 'SELL',
};

const MOMENTUM_ZH: Record<string, string> = {
  strong:   '動能強勁',
  rising:   '動能轉強',
  neutral:  '動能中性',
  falling:  '動能轉弱',
  weak:     '動能疲弱',
};

const MOMENTUM_EN: Record<string, string> = {
  strong:   'Strong momentum',
  rising:   'Rising momentum',
  neutral:  'Neutral momentum',
  falling:  'Falling momentum',
  weak:     'Weak momentum',
};

const TREND_ZH: Record<string, string> = {
  up:       '趨勢向上',
  sideways: '橫盤整理',
  down:     '趨勢向下',
};

const TREND_EN: Record<string, string> = {
  up:       'Uptrend',
  sideways: 'Sideways',
  down:     'Downtrend',
};

const SENTIMENT_ZH: Record<string, string> = {
  very_positive: '新聞強正面',
  positive:      '新聞正面',
  neutral:       '新聞中性',
  negative:      '新聞負面',
  very_negative: '新聞強負面',
};

const SENTIMENT_EN: Record<string, string> = {
  very_positive: 'News: Strong+',
  positive:      'News: Positive',
  neutral:       'News: Neutral',
  negative:      'News: Negative',
  very_negative: 'News: Strong-',
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const FRESH_VERDICTS = new Set(['BUY', 'SELL']);
const STRONG_SENTIMENTS = new Set(['very_positive', 'very_negative']);
const ONE_LINE_MAX = 80;

function formatPct(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

/** Returns number of whole calendar days from `now` (default: today) to
 *  dateStr (YYYY-MM-DD). Returns 0 for same day, positive for future,
 *  negative for past. Parses date-only strings as local time to avoid
 *  UTC-offset shift. The `now` parameter is injectable to keep tests
 *  deterministic across timezones / clock-edge moments.
 */
function daysUntilDate(dateStr: string, now: Date = new Date()): number {
  const nowMidnight = new Date(now.getTime());
  nowMidnight.setHours(0, 0, 0, 0);

  // Parse YYYY-MM-DD in local time (avoids UTC midnight → -1 day bug)
  const parts = dateStr.slice(0, 10).split('-');
  const y = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '1', 10) - 1;
  const d = parseInt(parts[2] ?? '1', 10);
  const target = new Date(y, m, d);

  return Math.floor((target.getTime() - nowMidnight.getTime()) / 86_400_000);
}

function localVerdict(code: string, locale: 'zh-TW' | 'en-US'): string {
  const map = locale === 'en-US' ? VERDICT_EN : VERDICT_ZH;
  return map[code] ?? code;
}

function localMomentum(code: string, locale: 'zh-TW' | 'en-US'): string {
  const map = locale === 'en-US' ? MOMENTUM_EN : MOMENTUM_ZH;
  return map[code] ?? code;
}

function localTrend(code: string, locale: 'zh-TW' | 'en-US'): string {
  const map = locale === 'en-US' ? TREND_EN : TREND_ZH;
  return map[code] ?? code;
}

function localSentiment(code: string, locale: 'zh-TW' | 'en-US'): string {
  const map = locale === 'en-US' ? SENTIMENT_EN : SENTIMENT_ZH;
  return map[code] ?? code;
}

/** Truncate a string to maxLen, appending '…' if cut. */
function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  // Cut at maxLen-1 to leave room for the ellipsis character (1 char)
  return s.slice(0, maxLen - 1) + '…';
}

// ---------------------------------------------------------------------------
// hasFreshSignal
// ---------------------------------------------------------------------------

function computeHasFreshSignal(input: TickerSummaryInput, now: Date): boolean {
  if (input.verdict != null && FRESH_VERDICTS.has(input.verdict)) return true;
  if (input.sentimentLabel != null && STRONG_SENTIMENTS.has(input.sentimentLabel)) return true;
  if (input.earningsDateNext != null) {
    const days = daysUntilDate(input.earningsDateNext, now);
    if (days >= 0 && days <= 7) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Build pieces
// ---------------------------------------------------------------------------

function buildPricePiece(
  input: TickerSummaryInput,
  locale: 'zh-TW' | 'en-US',
): string {
  if (input.latestClose == null && input.priceChangePct == null) return '';

  const parts: string[] = [];
  if (input.latestClose != null) {
    parts.push(input.latestClose.toLocaleString('en-US', { maximumFractionDigits: 2 }));
  }
  if (input.priceChangePct != null) {
    const direction = input.priceChangePct >= 0
      ? (locale === 'en-US' ? 'Up' : '上漲')
      : (locale === 'en-US' ? 'Down' : '下跌');
    parts.push(`${direction} ${formatPct(input.priceChangePct)}`);
  }
  return parts.join(' · ');
}

function buildSignalParts(
  input: TickerSummaryInput,
  locale: 'zh-TW' | 'en-US',
): string[] {
  const parts: string[] = [];
  if (input.trend != null)    parts.push(localTrend(input.trend, locale));
  if (input.momentum != null) parts.push(localMomentum(input.momentum, locale));
  return parts;
}

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

export function summarizeTicker(
  input: TickerSummaryInput,
  locale: 'zh-TW' | 'en-US' = 'zh-TW',
  now: Date = new Date(),
): TickerSummary {
  const { symbol, name } = input;

  const header = `${name} (${symbol})`;
  const verdictStr = input.verdict != null ? localVerdict(input.verdict, locale) : '';
  const pricePiece = buildPricePiece(input, locale);
  const signalParts = buildSignalParts(input, locale);
  const hasFreshSignal = computeHasFreshSignal(input, now);

  // ---- oneLine (≤ 80 chars) -----------------------------------------------
  // Pattern: "{name} ({symbol}): {verdict} · {priceChange} · {momentum}"
  const oneLineParts: string[] = [];
  if (verdictStr) oneLineParts.push(verdictStr);
  if (pricePiece) oneLineParts.push(pricePiece);
  oneLineParts.push(...signalParts);

  const oneLineBody = oneLineParts.join(' · ');
  const oneLineRaw = oneLineBody ? `${header}: ${oneLineBody}` : header;
  const oneLine = truncate(oneLineRaw, ONE_LINE_MAX);

  // ---- twoLine ------------------------------------------------------------
  // line1: "{name} ({symbol}) — {verdict}"
  // line2: "{priceChange} · {trend}"
  const line1Parts = [header];
  if (verdictStr) line1Parts.push(verdictStr);
  const line1 = line1Parts.join(' — ');

  const line2Parts: string[] = [];
  if (pricePiece) line2Parts.push(pricePiece);
  line2Parts.push(...signalParts);
  const line2 = line2Parts.join(' · ');

  const twoLine = line2 ? `${line1}\n${line2}` : line1;

  // ---- detailed -----------------------------------------------------------
  const detailedLines: string[] = [];

  // Line 1: header
  detailedLines.push(header);

  // Line 2: price
  if (pricePiece) detailedLines.push(pricePiece);

  // Line 3: verdict + reason
  if (verdictStr) {
    const reasonSuffix = input.verdictReason
      ? ` — ${input.verdictReason}`
      : '';
    detailedLines.push(`${verdictStr}${reasonSuffix}`);
  }

  // Line 4: signal tags
  const tagParts = [...signalParts];
  if (input.sentimentLabel != null) {
    tagParts.push(localSentiment(input.sentimentLabel, locale));
  }
  if (input.earningsDateNext != null) {
    const days = daysUntilDate(input.earningsDateNext, now);
    if (days >= 0 && days <= 7) {
      const earningsTag = locale === 'en-US'
        ? `Earnings in ${days}d`
        : `財報 ${days} 天後`;
      tagParts.push(earningsTag);
    }
  }
  if (tagParts.length > 0) detailedLines.push(tagParts.join(' · '));

  const detailed = detailedLines.join('\n');

  return { oneLine, twoLine, detailed, hasFreshSignal };
}
