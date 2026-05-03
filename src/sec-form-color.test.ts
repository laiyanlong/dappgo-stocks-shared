import { secFormColor } from './sec-form-color';

const TOKENS = { gold: '#facc15', accent: '#6366f1', border: '#cbd5e1' };

describe('secFormColor', () => {
  it('returns red for 8-K', () => {
    expect(secFormColor('8-K', TOKENS)).toBe('#ef4444');
  });

  it('returns gold for 10-K (annual report)', () => {
    expect(secFormColor('10-K', TOKENS)).toBe(TOKENS.gold);
  });

  it('returns blue for 10-Q (quarterly)', () => {
    expect(secFormColor('10-Q', TOKENS)).toBe('#3b82f6');
  });

  it('returns purple for DEF 14A', () => {
    expect(secFormColor('DEF 14A', TOKENS)).toBe('#a855f7');
  });

  it('matches DEF prefix for variants like DEFA14A', () => {
    expect(secFormColor('DEF A14A', TOKENS)).toBe('#a855f7');
  });

  it('returns emerald for 13F-HR', () => {
    expect(secFormColor('13F-HR', TOKENS)).toBe('#10b981');
  });

  it('returns emerald for any 13F variant', () => {
    expect(secFormColor('13F-NT', TOKENS)).toBe('#10b981');
  });

  it('returns orange for S-1', () => {
    expect(secFormColor('S-1', TOKENS)).toBe('#f97316');
  });

  it('returns orange for any S- variant', () => {
    expect(secFormColor('S-3', TOKENS)).toBe('#f97316');
  });

  it('falls back to legacy TW 法說 type → accent', () => {
    expect(secFormColor('法說會', TOKENS)).toBe(TOKENS.accent);
  });

  it('falls back to legacy TW 財報 type → gold', () => {
    expect(secFormColor('財務報告', TOKENS)).toBe(TOKENS.gold);
  });

  it('returns border for unknown type', () => {
    expect(secFormColor('unknown-form', TOKENS)).toBe(TOKENS.border);
  });

  it('returns border for empty / undefined', () => {
    expect(secFormColor(undefined, TOKENS)).toBe(TOKENS.border);
    expect(secFormColor('', TOKENS)).toBe(TOKENS.border);
  });

  it('is case-insensitive for SEC types', () => {
    expect(secFormColor('8-k', TOKENS)).toBe('#ef4444');
    expect(secFormColor(' 10-K ', TOKENS)).toBe(TOKENS.gold);
  });
});
