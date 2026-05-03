import {
  SPACING,
  SECTION_GAP,
  CARD_GAP,
  SCREEN_PADDING_X,
  space,
} from './spacing';

describe('SPACING constants', () => {
  it('contains expected point values on 4-pt grid', () => {
    expect(SPACING.xs).toBe(4);
    expect(SPACING.sm).toBe(8);
    expect(SPACING.md).toBe(12);
    expect(SPACING.lg).toBe(16);
    expect(SPACING.xl).toBe(24);
    expect(SPACING.xxl).toBe(32);
  });

  it('SECTION_GAP equals xl (Apple HIG inset-grouped section gap)', () => {
    expect(SECTION_GAP).toBe(SPACING.xl);
    expect(SECTION_GAP).toBe(24);
  });

  it('CARD_GAP equals md', () => {
    expect(CARD_GAP).toBe(SPACING.md);
  });

  it('SCREEN_PADDING_X equals lg', () => {
    expect(SCREEN_PADDING_X).toBe(SPACING.lg);
  });
});

describe('space()', () => {
  it('returns the numeric point value for a token', () => {
    expect(space('sm')).toBe(8);
    expect(space('xl')).toBe(24);
  });

  it('returns xs for xs token', () => {
    expect(space('xs')).toBe(4);
  });

  it('returns xxl for xxl token', () => {
    expect(space('xxl')).toBe(32);
  });
});
