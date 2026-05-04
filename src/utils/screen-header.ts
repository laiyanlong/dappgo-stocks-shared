/** Standard screen header config consumed by ScreenHeader component
 *  in each app. Apps each implement the rendering, but the contract
 *  + helpers live here for consistency. */
export interface ScreenHeaderConfig {
  title: string;
  subtitle?: string;
  showBack?: boolean;       // default true
  rightLabel?: string;      // optional right-side action label
}

export const HEADER_HEIGHT = 56;               // pt — match across apps
export const HEADER_BACK_LABEL = '返回';
export const HEADER_TITLE_FONT_SIZE = 17;
export const HEADER_SUBTITLE_FONT_SIZE = 12;
export const HEADER_BORDER_OPACITY = 0.06;

const DEFAULT_MAX_TITLE_CHARS = 20;

/** Compute total header height including safe-area top inset. */
export function totalHeaderHeight(safeAreaTop: number): number {
  return HEADER_HEIGHT + safeAreaTop;
}

/** Should the back button be shown? Default true unless explicitly false. */
export function shouldShowBack(config: ScreenHeaderConfig): boolean {
  return config.showBack !== false;
}

/** Truncate header title to fit narrow phone widths (≤375pt). */
export function truncateHeaderTitle(title: string, maxChars: number = DEFAULT_MAX_TITLE_CHARS): string {
  if (title.length <= maxChars) return title;
  return title.slice(0, maxChars - 1) + '…';
}
