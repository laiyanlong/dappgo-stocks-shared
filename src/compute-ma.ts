/**
 * Rolling-mean (simple moving average) over a window of close prices.
 *
 * Returns an array the same length as `bars` where each entry is:
 *   - the SMA of the previous `window` bars (inclusive of the current bar)
 *     once index >= window-1, OR
 *   - `null` while the window has not yet filled.
 *
 * Pure function — extracted from PriceChart so it can be exercised
 * directly by unit tests without React rendering.
 *
 * @param bars  Array of bars with a numeric `close` field
 * @param window Window size in bars (e.g. 20 for MA20)
 */
export function computeMA<T extends { close: number }>(
  bars: T[],
  window: number,
): (number | null)[] {
  if (window <= 0) {
    // Defensive: a non-positive window has no meaningful MA. Return all
    // nulls so consumers don't crash on bad input.
    return new Array(bars.length).fill(null);
  }
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].close;
    if (i >= window) sum -= bars[i - window].close;
    out.push(i >= window - 1 ? sum / window : null);
  }
  return out;
}
