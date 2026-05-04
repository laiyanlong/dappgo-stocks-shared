/**
 * DappGo Stocks — Shared Utilities
 *
 * Pure-TypeScript helpers consumed by both `dappgo-tw-stocks-app` and
 * `dappgo-us-stocks-app`. No React, no React Native, no theme imports —
 * keeps these test-runnable in plain Node and reusable from any future
 * web dashboard / CLI / server.
 *
 * To extend: add the new file to `src/`, export it here, ship a test
 * alongside. Then `npm install ../dappgo-stocks-shared` in each app and
 * import via `dappgo-stocks-shared`.
 */

export { verdictLabel } from './verdict-label';
export { explainVerdict, type VerdictExplain } from './verdict-explain';
export { daysUntil } from './days-until';
export {
  classifyInsiderActivity,
  type InsiderDirection,
} from './insider-direction';
export { secFormColor, type ColorTokens, type SecFormColor } from './sec-form-color';
export { computeMA } from './compute-ma';
export {
  summarizeSectors,
  type SectorSummary,
} from './sector-aggregate';
export {
  summarizeMarket,
  type MarketSentiment,
} from './ticker-aggregate';
export { computeDrawdown, type DrawdownResult } from './utils/max-drawdown';
export {
  formatPrice,
  formatPercent,
  formatVolume,
  formatMarketCap,
  formatCompactNumber,
  formatDate,
  formatRelativeDate,
  type FormatPriceOpts,
  type FormatPercentOpts,
} from './utils/formatters';
export {
  relativeStrength,
  type RsInputs,
  type RsScores,
} from './utils/relative-strength';
export { riskRating, type RiskInputs, type RiskRating } from './utils/risk-rating';
export {
  classifySentiment,
  type SentimentLabel,
  type SentimentInput,
  type SentimentDisplay,
} from './utils/news-sentiment';
export {
  stripHighlightMarkers,
  parseHighlightSegments,
  countHighlights,
  type HighlightStyle,
  type Segment,
} from './utils/highlight-markers';
export {
  contributionBars,
  type ContributionInput,
  type ContributionBar,
  type ContributionDisplay,
} from './utils/contribution-bars';
export {
  percentageBar,
  type PercentageBarInput,
  type PercentageBarSegment,
} from './utils/percentage-bar';
export {
  explainVerdict as explainVerdictFull,
  type Verdict,
  type SignalsLike,
  type VerdictExplanation,
} from './utils/verdict-explainer';
export * from './tokens';
export {
  priceAxisTicks,
  dateAxisLabels,
  scaleLinear,
  niceCeiling,
  niceFloor,
} from './utils/chart-axis';
export {
  cleanCommentary,
  type CleanedCommentary,
} from './utils/commentary-cleanup';
export {
  summarizeTicker,
  type TickerSummaryInput,
  type TickerSummary,
} from './utils/summarize-ticker';
export {
  buildDashboardSummary,
  type TickerLite,
  type DashboardSummary,
} from './utils/dashboard-summary';
export {
  gate,
  truncateForTier,
  limitForTier,
  daysUntilExpiry,
  effectiveTier,
  type UserTier,
  type GateResult,
} from './utils/feature-gating';
export {
  totalHeaderHeight,
  shouldShowBack,
  truncateHeaderTitle,
  HEADER_HEIGHT,
  HEADER_BACK_LABEL,
  HEADER_TITLE_FONT_SIZE,
  HEADER_SUBTITLE_FONT_SIZE,
  HEADER_BORDER_OPACITY,
  type ScreenHeaderConfig,
} from './utils/screen-header';
export {
  regimeDisplay,
  volRegimeLabel,
  trendArrow,
  isBenchmarkAbove50,
  isBenchmarkAbove200,
  benchmarkTrend,
  type Regime,
  type VolRegime,
  type TrendDir,
  type RegimeData,
  type RegimeDisplay,
} from './utils/regime-display';
