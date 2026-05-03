import { computeDrawdown } from './max-drawdown';

describe('computeDrawdown', () => {
  it('monotonic up — no drawdown', () => {
    const result = computeDrawdown([10, 20, 30, 40, 50]);
    expect(result.maxDrawdownPct).toBe(0);
    expect(result.peakIdx).toBe(0);
    expect(result.troughIdx).toBe(0);
    // No decline, so recovery is immediate at peak.
    expect(result.drawdownBars).toBe(0);
  });

  it('V-shape fully recovered', () => {
    // Peak=100 at idx 0, trough=60 at idx 3, recovery=105 at idx 5.
    const result = computeDrawdown([100, 80, 70, 60, 80, 105]);
    expect(result.maxDrawdownPct).toBeCloseTo(-40, 1);
    expect(result.peakIdx).toBe(0);
    expect(result.troughIdx).toBe(3);
    expect(result.recoveryIdx).toBe(5);
    expect(result.drawdownBars).toBe(3);
    expect(result.recoveryBars).toBe(2);
  });

  it('V-shape not recovered', () => {
    // Peak=100 at idx 0, trough=50 at idx 2, never gets back to 100.
    const result = computeDrawdown([100, 70, 50, 60, 80]);
    expect(result.maxDrawdownPct).toBeCloseTo(-50, 1);
    expect(result.peakIdx).toBe(0);
    expect(result.troughIdx).toBe(2);
    expect(result.recoveryIdx).toBeNull();
    expect(result.recoveryBars).toBeNull();
  });

  it('flat series — zero drawdown', () => {
    const result = computeDrawdown([42, 42, 42, 42]);
    expect(result.maxDrawdownPct).toBe(0);
    expect(result.drawdownBars).toBe(0);
  });

  it('single bar — no drawdown, recovery is self', () => {
    const result = computeDrawdown([99]);
    expect(result.maxDrawdownPct).toBe(0);
    expect(result.peakIdx).toBe(0);
    expect(result.troughIdx).toBe(0);
    expect(result.recoveryIdx).toBe(0);
    expect(result.drawdownBars).toBe(0);
    expect(result.recoveryBars).toBe(0);
  });
});
