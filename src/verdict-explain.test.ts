import { explainVerdict } from './verdict-explain';

describe('explainVerdict', () => {
  it('returns explanation with all 3 fields for stock-level verdicts', () => {
    for (const code of ['BUY', 'HOLD', 'WATCH', 'AVOID', 'SELL']) {
      const exp = explainVerdict(code);
      expect(exp).not.toBeNull();
      expect(exp?.meaning).toBeTruthy();
      expect(exp?.action).toBeTruthy();
      expect(['low', 'medium', 'high', 'unknown']).toContain(exp?.risk);
    }
  });

  it('returns explanation for sector-level verdicts', () => {
    for (const code of ['HOT', 'WARM', 'NEUTRAL', 'COOL', 'COLD']) {
      const exp = explainVerdict(code);
      expect(exp).not.toBeNull();
      expect(exp?.meaning.length).toBeGreaterThan(5);
    }
  });

  it('assigns higher risk to bearish verdicts', () => {
    expect(explainVerdict('SELL')?.risk).toBe('high');
    expect(explainVerdict('AVOID')?.risk).toBe('high');
    expect(explainVerdict('COLD')?.risk).toBe('high');
  });

  it('assigns lower risk to neutral / consolidation verdicts', () => {
    expect(explainVerdict('HOLD')?.risk).toBe('low');
    expect(explainVerdict('WATCH')?.risk).toBe('low');
    expect(explainVerdict('NEUTRAL')?.risk).toBe('low');
    expect(explainVerdict('WARM')?.risk).toBe('low');
  });

  it('returns null for unknown verdicts', () => {
    expect(explainVerdict('UNKNOWN')).toBeNull();
    expect(explainVerdict('')).toBeNull();
    expect(explainVerdict('buy')).toBeNull();  // case-sensitive
  });

  it('returns null for whitespace-padded codes (no auto-trim)', () => {
    // Whitespace-padded codes are treated as upstream bugs; we surface
    // them as null so callers can detect rather than silently mis-map.
    expect(explainVerdict(' BUY')).toBeNull();
    expect(explainVerdict('BUY ')).toBeNull();
    expect(explainVerdict('\tHOT')).toBeNull();
  });

  it('rejects mixed-case codes (case-sensitive lookup)', () => {
    expect(explainVerdict('Buy')).toBeNull();
    expect(explainVerdict('Hot')).toBeNull();
    expect(explainVerdict('NeUtRaL')).toBeNull();
  });

  it('explanations are 繁體中文 (contain Han chars)', () => {
    const hanRe = /[一-鿿]/;
    for (const code of ['BUY', 'HOT']) {
      const exp = explainVerdict(code)!;
      expect(hanRe.test(exp.meaning)).toBe(true);
      expect(hanRe.test(exp.action)).toBe(true);
    }
  });
});
