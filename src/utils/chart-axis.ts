/**
 * Chart axis utilities — pure functions for generating sane tick values
 * on price (y-axis) and date (x-axis) charts.
 */

// ─── Internal helpers ───────────────────────────────────────────────────────

/** Magnitude of the range, e.g. range 35 → 10, range 350 → 100 */
function magnitude(value: number): number {
  return Math.pow(10, Math.floor(Math.log10(Math.abs(value))));
}

/** Candidate nice step multipliers, in order */
const NICE_STEPS = [1, 2, 2.5, 5, 10] as const;

function niceStep(rawStep: number): number {
  const mag = magnitude(rawStep);
  const normalised = rawStep / mag;
  for (const s of NICE_STEPS) {
    if (normalised <= s) return s * mag;
  }
  return 10 * mag;
}

// ─── Exported functions ──────────────────────────────────────────────────────

/**
 * Generate "nice" tick values across [min, max] aiming for ~5-7 ticks.
 *
 * @example
 *   priceAxisTicks(95, 130)    → [95, 100, 110, 120, 130]
 *   priceAxisTicks(95, 95.5)   → [95.0, 95.1, 95.2, 95.3, 95.4, 95.5]
 */
export function priceAxisTicks(
  min: number,
  max: number,
  target = 6,
): number[] {
  if (!isFinite(min) || !isFinite(max)) return [];
  if (min > max) [min, max] = [max, min];

  // Equal values — return a single centred tick
  if (min === max) return [min];

  const range = max - min;
  const rawStep = range / Math.max(target - 1, 1);
  const step = niceStep(rawStep);

  // Round min down and max up to step boundaries
  const start = Math.ceil(min / step) * step;
  const end = Math.floor(max / step) * step;

  const ticks: number[] = [];

  // Always include min if it falls on a nice boundary or is the actual min
  if (Math.abs(start - min) > step * 1e-9) ticks.push(min);

  let t = start;
  // Avoid floating-point drift: iterate with integer counts
  const count = Math.round((end - start) / step);
  for (let i = 0; i <= count; i++) {
    const v = start + i * step;
    // Round away tiny fp errors
    const rounded = Math.round(v / step) * step;
    // Deduplicate the synthetic min we may have pushed
    if (ticks.length === 0 || Math.abs(rounded - ticks[ticks.length - 1]) > step * 1e-9) {
      ticks.push(rounded);
    }
    t = v;
  }

  // Always include max
  if (ticks.length === 0 || Math.abs(max - ticks[ticks.length - 1]) > step * 1e-9) {
    ticks.push(max);
  }

  // Keep precision consistent: if step < 1 round to appropriate decimals
  const decimals = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
  return ticks.map(v => parseFloat(v.toFixed(decimals)));
}

// ─────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/**
 * Pick evenly-spaced date labels from an array of ISO date strings.
 *
 * @param isoDates  Array of ISO date strings (YYYY-MM-DD).
 * @param target    Desired number of labels (default 5).
 * @param locale    'zh-TW' (M/D) or 'en-US' (M/D, or MonthName D on first of month).
 */
export function dateAxisLabels(
  isoDates: string[],
  target = 5,
  locale: 'zh-TW' | 'en-US' = 'en-US',
): { index: number; label: string }[] {
  if (isoDates.length === 0) return [];
  if (target <= 0) return [];

  const n = isoDates.length;

  // Build evenly-spaced indices
  const indices: number[] = [];
  if (target === 1 || n === 1) {
    indices.push(0);
  } else {
    for (let i = 0; i < target; i++) {
      indices.push(Math.round((i / (target - 1)) * (n - 1)));
    }
  }

  // Deduplicate (can happen when n < target)
  const unique = [...new Set(indices)];

  return unique.map(idx => {
    const iso = isoDates[idx] ?? isoDates[0];
    const parts = iso.split('-');
    const month = parseInt(parts[1] ?? '1', 10);
    const day = parseInt(parts[2] ?? '1', 10);

    let label: string;
    if (locale === 'zh-TW') {
      label = `${month}/${day}`;
    } else {
      // en-US: use month name on first label or first of a new month
      const isFirst = idx === unique[0];
      const prevIso = idx > 0 ? isoDates[idx - 1] : null;
      const prevMonth = prevIso ? parseInt(prevIso.split('-')[1] ?? '0', 10) : -1;
      const showName = isFirst || month !== prevMonth;
      label = showName
        ? `${MONTH_NAMES_EN[month - 1]} ${day}`
        : `${month}/${day}`;
    }
    return { index: idx, label };
  });
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a value in [domainMin, domainMax] to a pixel position in [pxMin, pxMax].
 * Supports inverted axes (e.g. y-axis where pxMin > pxMax).
 */
export function scaleLinear(
  value: number,
  domainMin: number,
  domainMax: number,
  pxMin: number,
  pxMax: number,
): number {
  if (!isFinite(value) || !isFinite(domainMin) || !isFinite(domainMax)) return pxMin;
  const domainRange = domainMax - domainMin;
  if (domainRange === 0) return (pxMin + pxMax) / 2;
  const t = (value - domainMin) / domainRange;
  return pxMin + t * (pxMax - pxMin);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Choose the nice step for a positive value:
 * - values >= 10: step = magnitude/10  (2 significant figures)
 * - values <  10: step = magnitude     (1 significant figure)
 */
function niceStepForBound(abs: number): number {
  return abs >= 10 ? magnitude(abs) / 10 : magnitude(abs);
}

/**
 * Return the smallest "nice" round number >= value.
 *
 * @example
 *   niceCeiling(127.3)  → 130
 *   niceCeiling(1273)   → 1300
 *   niceCeiling(0.0823) → 0.09
 */
export function niceCeiling(value: number): number {
  if (!isFinite(value)) return value;
  if (value === 0) return 0;
  const negative = value < 0;
  const abs = Math.abs(value);
  const step = niceStepForBound(abs);
  const raw = Math.ceil(abs / step - 1e-9) * step;
  const decimals = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
  const result = parseFloat(raw.toFixed(decimals));
  // For negatives, ceil (toward zero) means using floor on the absolute value
  return negative ? -parseFloat((Math.floor(abs / step + 1e-9) * step).toFixed(decimals)) : result;
}

/**
 * Return the largest "nice" round number <= value.
 *
 * @example
 *   niceFloor(127.3)  → 120
 *   niceFloor(1273)   → 1200
 *   niceFloor(0.0823) → 0.08
 */
export function niceFloor(value: number): number {
  if (!isFinite(value)) return value;
  if (value === 0) return 0;
  const negative = value < 0;
  const abs = Math.abs(value);
  const step = niceStepForBound(abs);
  const raw = Math.floor(abs / step + 1e-9) * step;
  const decimals = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
  const result = parseFloat(raw.toFixed(decimals));
  // For negatives, floor (away from zero) means using ceil on the absolute value
  return negative ? -parseFloat((Math.ceil(abs / step - 1e-9) * step).toFixed(decimals)) : result;
}
