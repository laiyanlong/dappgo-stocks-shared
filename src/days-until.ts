/**
 * Pure helper for computing whole-day deltas between today and a target
 * date. Extracted from EarningsCountdown so the logic can be unit-tested
 * without rendering React Native.
 */

const MS_PER_DAY = 86_400_000;

/**
 * Returns the number of days from `now` to `dateStr` after normalising
 * both to local-time start-of-day.
 *
 * - `null`, `undefined`, `''` or unparseable strings → `null`
 * - Same day → `0`
 * - Future → positive integer
 * - Past → negative integer
 *
 * `now` defaults to `new Date()` so callers don't have to thread it
 * through; tests pin it to keep results deterministic.
 */
export function daysUntil(
  dateStr: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!dateStr) return null;

  // Date-only strings ("YYYY-MM-DD") are parsed as UTC midnight by the
  // Date constructor, which can shift to the previous day in negative
  // UTC offsets. Detect this shape and build the Date in local time so
  // start-of-day normalisation lines up with the user's calendar.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  let target: Date;
  if (dateOnly) {
    const [y, m, d] = dateStr.split('-').map(Number);
    target = new Date(y, m - 1, d);
  } else {
    target = new Date(dateStr);
  }
  if (isNaN(target.getTime())) return null;

  const today = new Date(now.getTime());
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}
