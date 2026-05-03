/**
 * Map a SEC form type (or legacy TW announcement type) to a semantic
 * color identifier. Pure function — easy to unit test, callable from
 * either the SEC filings list or any future filings widget.
 *
 * The output is a token like '8-K', '10-K', etc. used by the UI to
 * pick a hex color via theme. We return the color directly to keep
 * call sites minimal.
 */

export type SecFormColor =
  | '#ef4444' // red    — 8-K material event
  | '#3b82f6' // blue   — 10-Q quarterly
  | '#a855f7' // purple — DEF 14A proxy
  | '#10b981' // emerald — 13F-HR institutional
  | '#f97316' // orange — S-1 / S-* registration
  | string; // fallback (theme tokens, gold accent, border, etc.)

export interface ColorTokens {
  gold: string;
  accent: string;
  border: string;
}

/**
 * @returns The hex / token color to use for the type pill background.
 *          For unknown types (or empty input) returns `tokens.border`.
 *
 * Matching is case-insensitive on the canonical SEC name. Legacy TW
 * announcement labels (法說 / 財報) are recognised so this same helper
 * works in both apps.
 */
export function secFormColor(type: string | undefined, tokens: ColorTokens): string {
  if (!type) return tokens.border;
  const upper = type.trim().toUpperCase();

  if (upper === '8-K') return '#ef4444';
  if (upper === '10-K') return tokens.gold;
  if (upper === '10-Q') return '#3b82f6';
  if (upper === 'DEF 14A' || upper.startsWith('DEF ')) return '#a855f7';
  if (upper === '13F-HR' || upper.startsWith('13F')) return '#10b981';
  if (upper === 'S-1' || upper.startsWith('S-')) return '#f97316';

  // Legacy TW labels
  if (type.includes('法說')) return tokens.accent;
  if (type.includes('財報') || type.includes('財務')) return tokens.gold;

  return tokens.border;
}
