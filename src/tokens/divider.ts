/** Divider tokens — a single logical hairline separating content regions.
 *
 *  DIVIDER_THICKNESS is 1 logical pixel; React Native consumers should
 *  swap with StyleSheet.hairlineWidth (≈0.33px on 3× Retina) where a true
 *  hairline is desired. Opacity values differ by mode because Retina
 *  sub-pixel rendering causes hairlines to appear heavier on dark backgrounds,
 *  requiring a slightly higher opacity to achieve perceptual parity — mirrors
 *  the approach used in Apple's UIKit separator colors.
 */
export const DIVIDER_THICKNESS = 1;

/** Opacity for dividers rendered on a light background. */
export const DIVIDER_OPACITY_LIGHT = 0.10;

/** Opacity for dividers rendered on a dark background. */
export const DIVIDER_OPACITY_DARK = 0.16;

export interface DividerStyleResult {
  borderTopWidth: number;
  borderTopColor: string;
}

export interface DividerStyleOpts {
  /** True when the surrounding surface is dark-mode. */
  isDark: boolean;
  /** Base color in any CSS/RN-compatible format, e.g. "#000000" or "rgb(0,0,0)". */
  baseColor: string;
}

/** Build a minimal border-top style object for a divider line.
 *
 *  The returned object is directly spreadable onto a React Native / web style.
 *  Opacity is baked into the color via rgba() — avoids needing a wrapper View
 *  with its own opacity prop.
 *
 *  @example
 *    dividerStyle({ isDark: false, baseColor: '#000000' })
 *    // { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.10)' }
 */
export function dividerStyle(opts: DividerStyleOpts): DividerStyleResult {
  const opacity = opts.isDark ? DIVIDER_OPACITY_DARK : DIVIDER_OPACITY_LIGHT;
  // Parse hex shorthand or full 6-digit hex into r,g,b components.
  const color = hexToRgba(opts.baseColor, opacity);
  return {
    borderTopWidth: DIVIDER_THICKNESS,
    borderTopColor: color,
  };
}

// ---------------------------------------------------------------------------
// Private helper
// ---------------------------------------------------------------------------

/** Convert a 3- or 6-digit hex color + opacity to an rgba() string.
 *  Falls back to the raw baseColor string if the format is unrecognised,
 *  allowing callers to pass pre-computed rgba() strings directly.
 */
function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.trim().replace(/^#/, '');

  if (clean.length === 3) {
    const r = parseInt(clean[0]! + clean[0]!, 16);
    const g = parseInt(clean[1]! + clean[1]!, 16);
    const b = parseInt(clean[2]! + clean[2]!, 16);
    return `rgba(${r},${g},${b},${opacity})`;
  }

  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  }

  // Unknown format — return as-is (e.g. already an rgb/rgba string).
  return hex;
}
