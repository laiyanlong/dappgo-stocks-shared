/** Font sizes used across the apps.
 *
 *  Values follow Apple HIG Dynamic Type reference sizes (iOS 17+):
 *    body=17, subhead=15, large-title=34. Intermediate steps (title1=28,
 *    title2=22→24, title3=20) follow HIG naming. The `micro` and `small`
 *    additions cover chip/badge contexts not explicitly named in HIG but
 *    common in financial UIs (compare Material Design 3 label-small=11,
 *    label-medium=12).
 *
 *  Note: HIG body is 17pt; we use 15 for `body` to leave room for the
 *  `subhead` step at 17, keeping the same label mapping as HIG.
 */
export const FONT_SIZE = {
  micro: 11,   // chip text, captions  (≈ Material label-small)
  small: 13,   // metadata, secondary  (≈ Material label-medium)
  body: 15,    // default text
  subhead: 17, // subheadings, H4      (= Apple HIG body)
  title3: 20,  // H3, card titles      (= Apple HIG title3)
  title2: 24,  // H2                   (≈ Apple HIG title2 22 → bumped one step)
  title1: 28,  // H1, screen headers   (= Apple HIG title1)
  display: 34, // hero metric numbers  (= Apple HIG large title)
} as const;

/** Font weight tokens — map directly to CSS/RN fontWeight string values. */
export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

/** Multiplier for line-height from font-size. 1.35 gives comfortable reading
 *  for dense financial data while staying tighter than the HIG default 1.5
 *  used for long-form prose. */
export const LINE_HEIGHT_RATIO = 1.35;

export type FontSizeToken = keyof typeof FONT_SIZE;

/** Compute a rounded line-height for a given font size.
 *  @param size   Font size in points.
 *  @param ratio  Multiplier. Defaults to LINE_HEIGHT_RATIO (1.35).
 */
export function lineHeight(size: number, ratio: number = LINE_HEIGHT_RATIO): number {
  return Math.round(size * ratio);
}
