import { verdictLabel } from './verdict-label';

describe('verdictLabel', () => {
  it('maps stock-level English codes to 繁中 labels', () => {
    expect(verdictLabel('BUY')).toBe('買進');
    expect(verdictLabel('HOLD')).toBe('持有');
    expect(verdictLabel('WATCH')).toBe('觀望');
    expect(verdictLabel('AVOID')).toBe('避開');
    expect(verdictLabel('SELL')).toBe('賣出');
  });

  it('maps sector-level English codes to 繁中 labels', () => {
    expect(verdictLabel('HOT')).toBe('熱絡');
    expect(verdictLabel('WARM')).toBe('偏多');
    expect(verdictLabel('NEUTRAL')).toBe('中性');
    expect(verdictLabel('COOL')).toBe('偏空');
    expect(verdictLabel('COLD')).toBe('冷清');
  });

  it('returns the input verbatim for unknown codes', () => {
    expect(verdictLabel('UNKNOWN_VERDICT')).toBe('UNKNOWN_VERDICT');
    expect(verdictLabel('')).toBe('');
  });

  it('is case-sensitive — lowercase falls through', () => {
    // Engine emits uppercase; if we get lowercase it's a data bug we
    // want to surface (verbatim) rather than mis-translate.
    expect(verdictLabel('buy')).toBe('buy');
  });

  it('does not trim whitespace — leading/trailing spaces fall through', () => {
    // Engine emits exact uppercase codes; whitespace indicates upstream
    // bug we want surfaced verbatim, not silently mapped.
    expect(verdictLabel(' BUY')).toBe(' BUY');
    expect(verdictLabel('BUY ')).toBe('BUY ');
    expect(verdictLabel('  HOT  ')).toBe('  HOT  ');
  });

  it('mixed-case input falls through (only fully uppercase is recognized)', () => {
    expect(verdictLabel('Buy')).toBe('Buy');
    expect(verdictLabel('hOt')).toBe('hOt');
    expect(verdictLabel('Neutral')).toBe('Neutral');
  });

  it('covers every documented verdict in the type union', () => {
    // Smoke check: ensure the 10 known codes round-trip to non-empty
    // 繁中 strings (not the input itself).
    const codes = ['BUY', 'HOLD', 'WATCH', 'AVOID', 'SELL',
                   'HOT', 'WARM', 'NEUTRAL', 'COOL', 'COLD'];
    for (const c of codes) {
      const label = verdictLabel(c);
      expect(label).not.toBe(c);
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
