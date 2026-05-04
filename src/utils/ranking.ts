/** Percentile of value within array (0..100). Higher value = higher percentile. */
export function percentile(value: number, values: number[]): number {
  if (values.length === 0) return 0;
  const below = values.filter((v) => v < value).length;
  return (below / values.length) * 100;
}

/** Sort by primary key desc (or asc), fall back to secondary key asc on tie. */
export function multiKeySort<T>(
  items: T[],
  primary: (it: T) => number | null | undefined,
  secondary?: (it: T) => number | string,
  primaryDir: 'asc' | 'desc' = 'desc',
): T[] {
  return [...items].sort((a, b) => {
    const pa = primary(a) ?? -Infinity;
    const pb = primary(b) ?? -Infinity;
    const diff = primaryDir === 'desc' ? pb - pa : pa - pb;
    if (diff !== 0) return diff;
    if (!secondary) return 0;
    const sa = secondary(a);
    const sb = secondary(b);
    if (sa < sb) return -1;
    if (sa > sb) return 1;
    return 0;
  });
}

/** Top N by field (skips null/undefined). Default direction is desc (highest first). */
export function topN<T>(
  items: T[],
  selector: (it: T) => number | null | undefined,
  n: number,
  direction: 'asc' | 'desc' = 'desc',
): T[] {
  const valid = items.filter((it) => selector(it) != null);
  const sorted = valid.sort((a, b) => {
    const va = selector(a) as number;
    const vb = selector(b) as number;
    return direction === 'desc' ? vb - va : va - vb;
  });
  return sorted.slice(0, n);
}

/** Bucket a value into N quantile groups (1 = lowest, N = highest). */
export function quantileBucket(value: number, values: number[], buckets: number): number {
  if (values.length === 0 || buckets <= 0) return 1;
  const pct = percentile(value, values);
  // Use floor+1 so the top value lands in bucket N; clamp to [1, N].
  const bucket = Math.floor((pct / 100) * buckets) + 1;
  return Math.max(1, Math.min(bucket, buckets));
}

/** Z-score of value vs mean/stdev of values. Returns 0 if stdev is 0. */
export function zScore(value: number, values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdev = Math.sqrt(variance);
  if (stdev === 0) return 0;
  return (value - mean) / stdev;
}
