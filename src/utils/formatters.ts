/**
 * Shared formatting utilities for price, percent, volume, market-cap, numbers,
 * and dates. Pure functions — no side effects, no `any`, SSR-safe.
 *
 * Null / undefined inputs always return EM_DASH ("—").
 */

const EM_DASH = '—';

// ---------------------------------------------------------------------------
// Price
// ---------------------------------------------------------------------------

export interface FormatPriceOpts {
  /** Number of decimal places. Default: 2 */
  decimals?: number;
  /** Currency prefix style. Default: '' (no prefix) */
  currency?: 'TWD' | 'USD' | '';
  /** When true, prepend "+" on positive values. Default: false */
  showSign?: boolean;
}

/**
 * Format a numeric price with optional currency prefix and sign.
 *
 * Examples:
 *   formatPrice(1234.56)                           → "1,234.56"
 *   formatPrice(1234.56, { currency: 'USD' })      → "$1,234.56"
 *   formatPrice(1234.56, { currency: 'TWD' })      → "TWD 1,234.56"
 *   formatPrice(1.2, { showSign: true })            → "+1.20"
 *   formatPrice(null)                              → "—"
 */
export function formatPrice(
  value: number | null | undefined,
  opts?: FormatPriceOpts,
): string {
  if (value == null || !isFinite(value)) return EM_DASH;

  const decimals = opts?.decimals ?? 2;
  const currency = opts?.currency ?? '';
  const showSign = opts?.showSign ?? false;

  const abs = Math.abs(value);
  const formatted = commaFormat(abs, decimals);

  const sign = value < 0 ? '-' : showSign && value > 0 ? '+' : '';

  let prefix = '';
  if (currency === 'USD') prefix = '$';
  else if (currency === 'TWD') prefix = 'TWD ';

  return `${sign}${prefix}${formatted}`;
}

// ---------------------------------------------------------------------------
// Percent
// ---------------------------------------------------------------------------

export interface FormatPercentOpts {
  /** Number of decimal places. Default: 2 */
  decimals?: number;
  /** Prepend "+" on positive values. Default: true */
  showSign?: boolean;
}

/**
 * Format a decimal or percentage value as a percentage string.
 * Input is treated as already-percentage (e.g. 12.34 → "12.34%").
 *
 * Examples:
 *   formatPercent(12.34)          → "+12.34%"
 *   formatPercent(-3.21)          → "-3.21%"
 *   formatPercent(0)              → "0.00%"
 *   formatPercent(null)           → "—"
 */
export function formatPercent(
  value: number | null | undefined,
  opts?: FormatPercentOpts,
): string {
  if (value == null || !isFinite(value)) return EM_DASH;

  const decimals = opts?.decimals ?? 2;
  const showSign = opts?.showSign ?? true;

  const abs = Math.abs(value);
  const formatted = abs.toFixed(decimals);

  const sign = value < 0 ? '-' : showSign && value > 0 ? '+' : '';

  return `${sign}${formatted}%`;
}

// ---------------------------------------------------------------------------
// Compact numbers (K / M / B)
// ---------------------------------------------------------------------------

/**
 * Universal compact format using K / M / B suffixes.
 *
 * Examples:
 *   formatCompactNumber(1234)      → "1.23K"
 *   formatCompactNumber(1500000)   → "1.50M"
 *   formatCompactNumber(1e10)      → "10.00B"
 *   formatCompactNumber(null)      → "—"
 */
export function formatCompactNumber(
  value: number | null | undefined,
  decimals: number = 2,
): string {
  if (value == null || !isFinite(value)) return EM_DASH;

  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(decimals)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(decimals)}K`;
  return `${sign}${abs.toFixed(decimals)}`;
}

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

/**
 * Format a trading volume value using compact K/M/B suffixes (2 decimals).
 *
 * Examples:
 *   formatVolume(1234)       → "1.23K"
 *   formatVolume(1500000)    → "1.50M"
 *   formatVolume(1e10)       → "10.00B"
 *   formatVolume(null)       → "—"
 */
export function formatVolume(value: number | null | undefined): string {
  return formatCompactNumber(value, 2);
}

// ---------------------------------------------------------------------------
// Market cap
// ---------------------------------------------------------------------------

/**
 * Format a market-cap value with currency-aware suffixes.
 * USD uses K/M/B; TWD uses Chinese 萬/億.
 *
 * Examples (USD):
 *   formatMarketCap(12345678901, 'USD')  → "USD 12.35B"
 *   formatMarketCap(500000, 'USD')       → "USD 500.00K"
 *
 * Examples (TWD):
 *   formatMarketCap(1234500000000, 'TWD') → "新台幣 1.23兆"
 *   formatMarketCap(12345678901, 'TWD')   → "新台幣 123.5億"
 *   formatMarketCap(123456789, 'TWD')     → "新台幣 1.23億"
 *   formatMarketCap(12345678, 'TWD')      → "新台幣 1234.57萬"
 */
export function formatMarketCap(
  value: number | null | undefined,
  currency: 'TWD' | 'USD' = 'USD',
): string {
  if (value == null || !isFinite(value)) return EM_DASH;

  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (currency === 'TWD') {
    // Chinese financial units: 兆 (1e12), 億 (1e8), 萬 (1e4)
    if (abs >= 1e12) return `${sign}新台幣 ${(abs / 1e12).toFixed(2)}兆`;
    if (abs >= 1e8)  return `${sign}新台幣 ${(abs / 1e8).toFixed(1)}億`;
    if (abs >= 1e4)  return `${sign}新台幣 ${(abs / 1e4).toFixed(2)}萬`;
    return `${sign}新台幣 ${abs.toFixed(0)}`;
  }

  // USD — same K/M/B logic
  if (abs >= 1e9) return `${sign}USD ${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}USD ${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}USD ${(abs / 1e3).toFixed(2)}K`;
  return `${sign}USD ${abs.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

/**
 * Format an ISO date string (YYYY-MM-DD or full ISO) for display.
 * Uses manual parsing — no Intl locale variance between environments.
 *
 * zh-TW: "2026/05/02"
 * en-US: "5/2/2026"
 */
export function formatDate(
  iso: string | null | undefined,
  locale: 'zh-TW' | 'en-US' = 'zh-TW',
): string {
  if (!iso) return EM_DASH;
  const parts = iso.slice(0, 10).split('-');
  if (parts.length !== 3) return EM_DASH;
  const [y, m, d] = parts;
  if (!y || !m || !d) return EM_DASH;
  const year = parseInt(y, 10);
  const month = parseInt(m, 10);
  const day = parseInt(d, 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return EM_DASH;

  if (locale === 'en-US') return `${month}/${day}/${year}`;
  return `${year}/${pad2(month)}/${pad2(day)}`;
}

// ---------------------------------------------------------------------------
// Relative date
// ---------------------------------------------------------------------------

/**
 * Return a human-readable relative date label.
 *
 * Comparison is calendar-day based (ignores time-of-day).
 *
 * zh-TW:  今天 / 明天 / 昨天 / 週X / formatDate fallback
 * en-US:  Today / Tomorrow / Yesterday / weekday / formatDate fallback
 */
export function formatRelativeDate(
  iso: string,
  now: Date = new Date(),
  locale: 'zh-TW' | 'en-US' = 'zh-TW',
): string {
  if (!iso) return EM_DASH;

  // Parse target as local calendar date (no timezone shift)
  const parts = iso.slice(0, 10).split('-');
  if (parts.length !== 3) return EM_DASH;
  const [y, m, d] = parts;
  if (!y || !m || !d) return EM_DASH;
  const target = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / MS_PER_DAY);

  if (locale === 'zh-TW') {
    if (diffDays === 0)  return '今天';
    if (diffDays === 1)  return '明天';
    if (diffDays === -1) return '昨天';
    if (diffDays > 1 && diffDays < 7)   return `週${ZH_WEEKDAYS[target.getDay()]}`;
    if (diffDays < 0 && diffDays > -7)  return `週${ZH_WEEKDAYS[target.getDay()]}`;
    return formatDate(iso, 'zh-TW');
  }

  if (diffDays === 0)  return 'Today';
  if (diffDays === 1)  return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (Math.abs(diffDays) < 7) return EN_WEEKDAYS[target.getDay()];
  return formatDate(iso, 'en-US');
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;

const ZH_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;
const EN_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Zero-pad a number to 2 digits */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Format an absolute number with thousand-separator commas and fixed decimals.
 * Avoids Intl.NumberFormat for SSR consistency.
 */
function commaFormat(abs: number, decimals: number): string {
  const fixed = abs.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const withCommas = (intPart ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}
