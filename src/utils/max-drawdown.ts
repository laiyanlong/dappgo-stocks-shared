/**
 * Maximum drawdown calculator for a series of closing prices.
 *
 * Scans for the peak-to-trough decline that produces the largest
 * percentage drawdown, then checks whether price has subsequently
 * recovered above the peak (i.e., "recovered").
 *
 * Pure function — no IO, no globals, deterministic.
 */

export interface DrawdownResult {
  maxDrawdownPct: number;       // negative number, e.g. -32.4
  peakIdx: number;
  troughIdx: number;
  recoveryIdx: number | null;   // null if not recovered yet
  drawdownBars: number;         // bars from peak to trough
  recoveryBars: number | null;  // bars from trough to recovery, null if not recovered
}

export function computeDrawdown(closes: number[]): DrawdownResult {
  if (closes.length === 0) {
    return {
      maxDrawdownPct: 0,
      peakIdx: 0,
      troughIdx: 0,
      recoveryIdx: null,
      drawdownBars: 0,
      recoveryBars: null,
    };
  }

  if (closes.length === 1) {
    return {
      maxDrawdownPct: 0,
      peakIdx: 0,
      troughIdx: 0,
      recoveryIdx: 0,
      drawdownBars: 0,
      recoveryBars: 0,
    };
  }

  let maxDd = 0;
  let bestPeakIdx = 0;
  let bestTroughIdx = 0;

  // For each candidate peak, find the worst trough that follows it.
  let runningPeakIdx = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[runningPeakIdx]) {
      runningPeakIdx = i;
    }
    const dd = (closes[i] - closes[runningPeakIdx]) / closes[runningPeakIdx];
    if (dd < maxDd) {
      maxDd = dd;
      bestPeakIdx = runningPeakIdx;
      bestTroughIdx = i;
    }
  }

  // Check for recovery: first bar after trough where price >= peak price.
  const peakPrice = closes[bestPeakIdx];
  let recoveryIdx: number | null = null;
  for (let i = bestTroughIdx + 1; i < closes.length; i++) {
    if (closes[i] >= peakPrice) {
      recoveryIdx = i;
      break;
    }
  }

  return {
    maxDrawdownPct: maxDd * 100,
    peakIdx: bestPeakIdx,
    troughIdx: bestTroughIdx,
    recoveryIdx,
    drawdownBars: bestTroughIdx - bestPeakIdx,
    recoveryBars: recoveryIdx !== null ? recoveryIdx - bestTroughIdx : null,
  };
}
