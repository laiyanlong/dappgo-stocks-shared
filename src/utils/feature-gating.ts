export type UserTier = 'free' | 'pro' | 'pro_plus';

export interface GateResult<T> {
  allowed: boolean;
  value: T | null;
  reason: 'allowed' | 'requires_pro' | 'requires_pro_plus';
}

const TIER_RANK: Record<UserTier, number> = { free: 0, pro: 1, pro_plus: 2 };

/** Returns gated wrapper around a value. */
export function gate<T>(
  tier: UserTier,
  requiredTier: UserTier,
  value: T,
): GateResult<T> {
  if (TIER_RANK[tier] >= TIER_RANK[requiredTier]) {
    return { allowed: true, value, reason: 'allowed' };
  }
  const reason: GateResult<T>['reason'] =
    requiredTier === 'pro_plus' ? 'requires_pro_plus' : 'requires_pro';
  return { allowed: false, value: null, reason };
}

/** Returns truncated string for free tier (e.g. AI commentary preview). */
export function truncateForTier(
  text: string,
  tier: UserTier,
  freeMaxChars: number = 100,
): { text: string; truncated: boolean } {
  if (tier !== 'free' || text.length <= freeMaxChars) {
    return { text, truncated: false };
  }
  return { text: text.slice(0, freeMaxChars), truncated: true };
}

/** Limit array for free tier (e.g. show only first 5 watchlist items). */
export function limitForTier<T>(
  items: T[],
  tier: UserTier,
  freeLimit: number = 5,
): { items: T[]; clipped: number } {
  if (tier !== 'free' || items.length <= freeLimit) {
    return { items, clipped: 0 };
  }
  return { items: items.slice(0, freeLimit), clipped: items.length - freeLimit };
}

/** Compute days-until-expiry for pro subscription. Returns null when not pro. */
export function daysUntilExpiry(
  proExpiresAt: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!proExpiresAt) return null;
  const expiry = new Date(proExpiresAt);
  if (isNaN(expiry.getTime())) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((expiry.getTime() - now.getTime()) / msPerDay);
}

/** Determine effective tier — handles expired subscriptions. */
export function effectiveTier(
  storedTier: UserTier,
  proExpiresAt: string | null | undefined,
  now: Date = new Date(),
): UserTier {
  if (storedTier === 'free') return 'free';
  const days = daysUntilExpiry(proExpiresAt, now);
  if (days === null || days < 0) return 'free';
  return storedTier;
}
