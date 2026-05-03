import { relativeStrength } from './relative-strength';

describe('relativeStrength', () => {
  it('leader: stock crushes both sector and market', () => {
    const r = relativeStrength({ stockReturn: 0.50, sectorReturn: 0.05, marketReturn: 0.03 });
    expect(r.vsSector).toBeGreaterThan(0);
    expect(r.vsMarket).toBeGreaterThan(0);
    expect(r.composite).toBeGreaterThanOrEqual(40);
    expect(r.tier).toBe('leader');
  });

  it('laggard: stock far below sector and market', () => {
    const r = relativeStrength({ stockReturn: -0.40, sectorReturn: 0.05, marketReturn: 0.08 });
    expect(r.vsSector).toBeLessThan(0);
    expect(r.vsMarket).toBeLessThan(0);
    expect(r.composite).toBeLessThanOrEqual(-40);
    expect(r.tier).toBe('laggard');
  });

  it('beats sector but loses to market → neutral or weak depending on magnitude', () => {
    // stockReturn = 0.06, sectorReturn = 0.04 (+2% vs sector),
    // marketReturn = 0.10 (-4% vs market).
    const r = relativeStrength({ stockReturn: 0.06, sectorReturn: 0.04, marketReturn: 0.10 });
    expect(r.vsSector).toBeGreaterThan(0);
    expect(r.vsMarket).toBeLessThan(0);
    // Composite is the average of a small positive and a small negative.
    expect(['neutral', 'weak', 'strong']).toContain(r.tier);
  });

  it('exactly neutral: stock = sector = market', () => {
    const r = relativeStrength({ stockReturn: 0.05, sectorReturn: 0.05, marketReturn: 0.05 });
    expect(r.vsSector).toBe(0);
    expect(r.vsMarket).toBe(0);
    expect(r.composite).toBe(0);
    expect(r.tier).toBe('neutral');
  });

  it('caps scores at ±100 on extreme differences', () => {
    const r = relativeStrength({ stockReturn: 5.0, sectorReturn: 0, marketReturn: 0 });
    expect(r.vsSector).toBe(100);
    expect(r.vsMarket).toBe(100);
    expect(r.composite).toBe(100);
  });

  it('strong: moderate outperformance of both', () => {
    // +15% vs sector and +12% vs market → composite around 13.5 → strong
    const r = relativeStrength({ stockReturn: 0.20, sectorReturn: 0.05, marketReturn: 0.08 });
    expect(r.composite).toBeGreaterThan(10);
    expect(['strong', 'leader']).toContain(r.tier);
  });
});
