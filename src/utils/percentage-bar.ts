/**
 * Percentage-bar helper: distributes a keyed count map into proportional
 * segments for rendering advance/decline or any categorical bar.
 *
 * Rules:
 *   - Null/undefined values are skipped; negatives are clamped to 0.
 *   - Segments preserve insertion order (Object.entries).
 *   - When total = 0 returns { segments: [], total: 0 }.
 *   - pct is rounded to 1 decimal place.
 *
 * Pure function — no IO, no globals, deterministic.
 */

export interface PercentageBarInput {
  [key: string]: number | null | undefined;
}

export interface PercentageBarSegment {
  key: string;
  value: number;
  ratio: number;
  pct: number;
}

export function percentageBar(
  input: PercentageBarInput | null | undefined,
): { segments: PercentageBarSegment[]; total: number } {
  if (input == null) return { segments: [], total: 0 };

  // Collect valid (non-null, non-undefined) entries clamped to >= 0
  const valid: Array<[string, number]> = Object.entries(input)
    .filter((entry): entry is [string, number] => entry[1] != null)
    .map(([key, raw]) => [key, Math.max(0, raw)]);

  const total = valid.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return { segments: [], total: 0 };

  const segments: PercentageBarSegment[] = valid.map(([key, value]) => {
    const ratio = value / total;
    return {
      key,
      value,
      ratio,
      pct: Math.round(ratio * 1000) / 10,
    };
  });

  return { segments, total };
}
