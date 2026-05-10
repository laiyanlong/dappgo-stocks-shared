/**
 * Responsive layout breakpoint logic for the DappGo Stocks family.
 *
 * Pure-TS: no React, no React Native. Can be unit-tested without mocking.
 * Each app wraps this with a thin `useResponsiveLayout()` hook that passes
 * `useWindowDimensions()` values in.
 *
 * Breakpoints (following Apple HIG + industry convention):
 *   phone               < 600pt  (all iPhones, iPad split-screen 1/3)
 *   tablet-portrait    600–899pt (iPad 9.7" portrait, iPad mini all orientations)
 *   tablet-landscape   >= 900pt  (iPad 11" landscape, iPad 12.9" all)
 */

export type LayoutMode = 'phone' | 'tablet-portrait' | 'tablet-landscape';

export interface ResponsiveLayout {
  /** Current layout mode derived from window width */
  mode: LayoutMode;
  /** True for any phone-width context (< 600pt) */
  isPhone: boolean;
  /** True for any tablet-width context (>= 600pt) */
  isTablet: boolean;
  /** True when width > height (landscape orientation) */
  isLandscape: boolean;
  /**
   * Maximum pixel width for the content column.
   * Infinity for phone (no constraint), 720 for tablet-portrait, 860 for tablet-landscape.
   */
  contentMaxWidth: number;
  /**
   * Horizontal padding to center the content column within the screen.
   * Computed as Math.max(0, (windowWidth - contentMaxWidth) / 2).
   * 0 for phone (no centering needed).
   */
  contentPadding: number;
  /**
   * Suggested column count for card grids.
   * 1 for phone, 2 for tablet-portrait, 3 for tablet-landscape.
   */
  numColumns: number;
}

/**
 * Returns the LayoutMode for a given window width.
 */
export function getLayoutMode(width: number): LayoutMode {
  if (width >= 900) return 'tablet-landscape';
  if (width >= 600) return 'tablet-portrait';
  return 'phone';
}

/**
 * Returns the full responsive layout values for a given window size.
 *
 * @param width  Window width in points (from useWindowDimensions)
 * @param height Window height in points (from useWindowDimensions)
 */
export function getResponsiveValues(width: number, height: number): ResponsiveLayout {
  const mode = getLayoutMode(width);
  const isPhone = mode === 'phone';
  const isTablet = !isPhone;
  const isLandscape = width > height;

  let contentMaxWidth: number;
  let numColumns: number;

  switch (mode) {
    case 'tablet-landscape':
      contentMaxWidth = 860;
      numColumns = 3;
      break;
    case 'tablet-portrait':
      contentMaxWidth = 720;
      numColumns = 2;
      break;
    default:
      contentMaxWidth = Infinity;
      numColumns = 1;
      break;
  }

  const contentPadding = isPhone
    ? 0
    : Math.max(0, (width - contentMaxWidth) / 2);

  return {
    mode,
    isPhone,
    isTablet,
    isLandscape,
    contentMaxWidth,
    contentPadding,
    numColumns,
  };
}
