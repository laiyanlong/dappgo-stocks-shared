/** Spacing tokens used across DappGo Stocks apps. Distances are in points
 *  (matches React Native default unit).
 *
 *  Scale derived from a 4-pt base grid, consistent with Apple HIG and
 *  Material Design 3 spacing guidelines. lg=16 matches Apple HIG's standard
 *  grouped inset margin; xl=24 matches the HIG section gap for grouped tables.
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Vertical gap between two top-level sections (e.g. dashboard widgets).
 *  Tuned to match Apple HIG groupedInsetGroupedSection spacing. */
export const SECTION_GAP = SPACING.xl;

/** Vertical gap between cards inside a single section. */
export const CARD_GAP = SPACING.md;

/** Horizontal screen padding consistent with safe-area-aware layouts. */
export const SCREEN_PADDING_X = SPACING.lg;

export type SpacingToken = keyof typeof SPACING;

/** Return the numeric point value for a named spacing token. */
export function space(token: SpacingToken): number {
  return SPACING[token];
}
