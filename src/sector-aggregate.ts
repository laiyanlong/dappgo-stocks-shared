// Pure helpers that summarise the sector-rotation map shown on the Dashboard.
// Kept dependency-free so they can be unit-tested without React Native.

export interface SectorRotationEntry {
  verdict: string;
  avg_change_pct: number;
}

export interface SectorMover {
  name: string;
  change: number;
}

export interface SectorSummary {
  hot: number;
  warm: number;
  neutral: number;
  cool: number;
  cold: number;
  topGainer: SectorMover | null;
  topLoser: SectorMover | null;
}

const VERDICT_BUCKETS = ['HOT', 'WARM', 'NEUTRAL', 'COOL', 'COLD'] as const;
type VerdictBucket = (typeof VERDICT_BUCKETS)[number];

function isVerdictBucket(value: string): value is VerdictBucket {
  return (VERDICT_BUCKETS as readonly string[]).includes(value);
}

export function summarizeSectors(
  rotation: Record<string, SectorRotationEntry>,
): SectorSummary {
  const summary: SectorSummary = {
    hot: 0,
    warm: 0,
    neutral: 0,
    cool: 0,
    cold: 0,
    topGainer: null,
    topLoser: null,
  };

  // Object.entries preserves insertion order for string keys, so the first
  // sector to reach a tied extremum wins — matches "stable first" semantics.
  for (const [name, entry] of Object.entries(rotation)) {
    const verdict = entry.verdict?.toUpperCase?.() ?? '';
    if (isVerdictBucket(verdict)) {
      switch (verdict) {
        case 'HOT':
          summary.hot += 1;
          break;
        case 'WARM':
          summary.warm += 1;
          break;
        case 'NEUTRAL':
          summary.neutral += 1;
          break;
        case 'COOL':
          summary.cool += 1;
          break;
        case 'COLD':
          summary.cold += 1;
          break;
      }
    }

    const change = entry.avg_change_pct;
    if (typeof change !== 'number' || Number.isNaN(change)) continue;

    if (summary.topGainer === null || change > summary.topGainer.change) {
      summary.topGainer = { name, change };
    }
    if (summary.topLoser === null || change < summary.topLoser.change) {
      summary.topLoser = { name, change };
    }
  }

  return summary;
}
