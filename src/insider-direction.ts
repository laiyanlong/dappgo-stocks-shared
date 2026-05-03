/**
 * Net-direction classifier for Form-4 insider activity.
 *
 * Mirrors the logic in `tw-stocks-core` so the mobile app can label
 * insider tiles without pulling in the heavier scoring engine.
 */

export type InsiderDirection = 'buying' | 'selling' | 'mixed' | 'none';

/** Ratio above which one side is considered to dominate. */
const DOMINANCE_RATIO = 1.2;

/**
 * Classify net insider activity as buying / selling / mixed / none.
 *
 * - Both sides ~0 → `'none'`
 * - One side dominates (>= 1.2x the other) → `'buying'` / `'selling'`
 * - Otherwise → `'mixed'`
 *
 * Negative inputs are clamped to 0 defensively (upstream feeds
 * occasionally send signed values).
 */
export function classifyInsiderActivity(
  buyValue: number,
  sellValue: number,
): InsiderDirection {
  const buy = Math.max(0, buyValue || 0);
  const sell = Math.max(0, sellValue || 0);

  if (buy === 0 && sell === 0) return 'none';
  if (sell === 0) return 'buying';
  if (buy === 0) return 'selling';

  if (buy >= sell * DOMINANCE_RATIO) return 'buying';
  if (sell >= buy * DOMINANCE_RATIO) return 'selling';
  return 'mixed';
}
