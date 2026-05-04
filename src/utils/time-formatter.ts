/**
 * Time formatting utilities — relative and absolute date/time strings.
 * Pure functions. No external dependencies. No Intl.DateTimeFormat.
 * Supports zh-TW and en-US locales.
 */

export type Locale = 'zh-TW' | 'en-US';

const DEFAULT_LOCALE: Locale = 'zh-TW';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function parseDate(iso: string | null | undefined): Date | null {
  if (iso == null || iso === '') return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function nowDate(now?: Date): Date {
  return now ?? new Date();
}

/** Zero-pad a number to 2 digits. */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** "HH:MM" — 24-hour local clock. */
function localHHMM(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "h:MM AM/PM" — 12-hour local clock. */
function localAmPm(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad2(m)} ${period}`;
}

const ZH_WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'] as const;
const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

// ---------------------------------------------------------------------------
// isSameLocalDay
// ---------------------------------------------------------------------------

/**
 * Returns true when two Date objects fall on the same calendar day
 * in the local (runtime) timezone.
 */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ---------------------------------------------------------------------------
// humanizeDuration
// ---------------------------------------------------------------------------

/**
 * Convert a millisecond duration to a short human-readable string.
 *
 *   500          → '不到 1 秒' / 'less than 1s'
 *   60_000       → '1 分鐘'   / '1m'
 *   3_600_000    → '1 小時'   / '1h'
 */
export function humanizeDuration(ms: number, locale: Locale = DEFAULT_LOCALE): string {
  const absMs = Math.abs(ms);
  const secs = Math.floor(absMs / 1000);
  const mins = Math.floor(absMs / 60_000);
  const hours = Math.floor(absMs / 3_600_000);
  const days = Math.floor(absMs / 86_400_000);

  if (locale === 'en-US') {
    if (secs < 1) return 'less than 1s';
    if (mins < 1) return `${secs}s`;
    if (hours < 1) return `${mins}m`;
    if (days < 1) return `${hours}h`;
    return `${days}d`;
  }

  // zh-TW
  if (secs < 1) return '不到 1 秒';
  if (mins < 1) return `${secs} 秒`;
  if (hours < 1) return `${mins} 分鐘`;
  if (days < 1) return `${hours} 小時`;
  return `${days} 天`;
}

// ---------------------------------------------------------------------------
// relativeTimeShort
// ---------------------------------------------------------------------------

/**
 * Shortest relative time string, e.g. "5 分鐘前" / "5m ago".
 *
 *   < 1 min   → '剛剛' / 'just now'
 *   < 1 hour  → '5 分鐘前' / '5m ago'
 *   < 24 hr   → '3 小時前' / '3h ago'
 *   < 7 days  → '2 天前' / '2d ago'
 *   else      → '2026-04-15' / 'Apr 15'  (includes year when ≠ current year)
 */
export function relativeTimeShort(
  iso: string | null | undefined,
  now?: Date,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const d = parseDate(iso);
  if (d === null) return locale === 'en-US' ? 'Invalid date' : '無效日期';

  const ref = nowDate(now);
  const diffMs = ref.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (locale === 'en-US') {
    if (diffMins < 1) return 'just now';
    if (diffHours < 1) return `${diffMins}m ago`;
    if (diffDays < 1) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    // absolute
    const month = EN_MONTHS[d.getMonth()];
    const sameYear = d.getFullYear() === ref.getFullYear();
    return sameYear ? `${month} ${d.getDate()}` : `${month} ${d.getDate()} ${d.getFullYear()}`;
  }

  // zh-TW
  if (diffMins < 1) return '剛剛';
  if (diffHours < 1) return `${diffMins} 分鐘前`;
  if (diffDays < 1) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  // absolute
  const sameYear = d.getFullYear() === ref.getFullYear();
  if (sameYear) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ---------------------------------------------------------------------------
// relativeTimeLong
// ---------------------------------------------------------------------------

/**
 * Long relative time string with clock time.
 *
 *   today     → '今天 14:30' / 'Today 2:30 PM'
 *   yesterday → '昨天 09:00' / 'Yesterday 9:00 AM'
 *   < 7 days  → '週一 14:30' / 'Mon 2:30 PM'
 *   < 1 yr    → '4/15 14:30' / 'Apr 15 2:30 PM'
 *   older     → '2025/4/15'  / 'Apr 15 2025'
 */
export function relativeTimeLong(
  iso: string | null | undefined,
  now?: Date,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const d = parseDate(iso);
  if (d === null) return locale === 'en-US' ? 'Invalid date' : '無效日期';

  const ref = nowDate(now);
  const yesterday = new Date(ref);
  yesterday.setDate(ref.getDate() - 1);

  const diffMs = ref.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  const sameYear = d.getFullYear() === ref.getFullYear();

  if (locale === 'en-US') {
    const time = localAmPm(d);
    if (isSameLocalDay(d, ref)) return `Today ${time}`;
    if (isSameLocalDay(d, yesterday)) return `Yesterday ${time}`;
    if (diffDays < 7) return `${EN_WEEKDAYS[d.getDay()]} ${time}`;
    if (sameYear) return `${EN_MONTHS[d.getMonth()]} ${d.getDate()} ${time}`;
    return `${EN_MONTHS[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
  }

  // zh-TW
  const time = localHHMM(d);
  if (isSameLocalDay(d, ref)) return `今天 ${time}`;
  if (isSameLocalDay(d, yesterday)) return `昨天 ${time}`;
  if (diffDays < 7) return `${ZH_WEEKDAYS[d.getDay()]} ${time}`;
  if (sameYear) return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
