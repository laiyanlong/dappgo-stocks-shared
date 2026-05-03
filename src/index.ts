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
export * from './tokens';
