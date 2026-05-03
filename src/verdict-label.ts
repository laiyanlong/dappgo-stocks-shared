/**
 * Map verdict / sector-verdict English codes to 繁中 display labels.
 *
 * Pure function — no React or theme dependency, so it can be unit
 * tested without spinning up the RN test environment. The visual
 * VerdictBadge component re-exports this for convenience.
 */

const VERDICT_LABEL: Record<string, string> = {
  // Stock-level
  BUY: '買進',
  HOLD: '持有',
  WATCH: '觀望',
  AVOID: '避開',
  SELL: '賣出',
  // Sector-level
  HOT: '熱絡',
  WARM: '偏多',
  NEUTRAL: '中性',
  COOL: '偏空',
  COLD: '冷清',
};

export function verdictLabel(code: string): string {
  return VERDICT_LABEL[code] ?? code;
}
