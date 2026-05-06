# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- 

### Changed
- 

### Fixed
- 

## [0.1.0] - 2026-05-05

Initial documented release. Backfilled from git history.

### Added
- Initial scaffold of shared TypeScript utilities for the DappGo Stocks family.
- Shared formatters utility (price / percent / volume / market cap / date).
- Shared design tokens (spacing / typography / divider).
- Verdict-explainer (locale-aware verdict + signal narration).
- News-sentiment classifier (zh-TW + en-US).
- News-source-reputation classifier (tier1 / tier2 / tier3 + emoji + locale labels).
- Highlight-markers util (strip / parse / count bold / italic / mark).
- Contribution-bars + percentage-bar utilities.
- Chart-axis utility (`priceAxisTicks` / `dateAxisLabels` / `scaleLinear` / `niceCeiling` / `niceFloor`).
- Commentary-cleanup post-processor for AI text.
- `summarize-ticker` (oneLine / twoLine / detailed + `hasFreshSignal`).
- Dashboard-summary aggregator (verdict counts + tone + `freshSignalSymbols`).
- Regime-display unifier (TW + US benchmark fields normalised).
- Feature-gating utility (gate / truncate / limit / `effectiveTier`).
- Shared screen-header types + helpers (`HEADER_HEIGHT` 56pt).
- Portfolio aggregator (sentiment + best / worst + avg P/E / yield + drawdown).
- Max-drawdown + relative-strength + risk-rating utilities.
- Typography polish + Anchored VWAP + tab badges + collapse-all + dev mode + ranking util.
- `DEFAULT_FIELDS_OPTIONS` exported from shared index.
