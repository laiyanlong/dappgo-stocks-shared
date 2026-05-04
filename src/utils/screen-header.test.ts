import {
  totalHeaderHeight,
  shouldShowBack,
  truncateHeaderTitle,
  HEADER_HEIGHT,
  HEADER_TITLE_FONT_SIZE,
  HEADER_SUBTITLE_FONT_SIZE,
  HEADER_BORDER_OPACITY,
} from './screen-header';

describe('totalHeaderHeight', () => {
  it('adds safe-area inset to base height', () => {
    expect(totalHeaderHeight(44)).toBe(100);
  });

  it('returns base height when inset is 0', () => {
    expect(totalHeaderHeight(0)).toBe(56);
  });

  it('handles non-standard inset (e.g. Android 24pt)', () => {
    expect(totalHeaderHeight(24)).toBe(80);
  });
});

describe('shouldShowBack', () => {
  it('defaults to true when showBack is undefined', () => {
    expect(shouldShowBack({ title: 'Test' })).toBe(true);
  });

  it('returns false when explicitly set to false', () => {
    expect(shouldShowBack({ title: 'Home', showBack: false })).toBe(false);
  });

  it('returns true when explicitly set to true', () => {
    expect(shouldShowBack({ title: 'Detail', showBack: true })).toBe(true);
  });
});

describe('truncateHeaderTitle', () => {
  it('leaves short titles unchanged', () => {
    expect(truncateHeaderTitle('台股分析')).toBe('台股分析');
  });

  it('truncates titles exceeding default 20 chars', () => {
    const long = 'This is a very long title that should be cut';
    const result = truncateHeaderTitle(long);
    expect(result.length).toBe(20);
    expect(result.endsWith('…')).toBe(true);
  });

  it('respects custom maxChars', () => {
    const result = truncateHeaderTitle('Hello World', 8);
    expect(result).toBe('Hello W…');
    expect(result.length).toBe(8);
  });

  it('returns title as-is when exactly at maxChars', () => {
    const title = '12345';
    expect(truncateHeaderTitle(title, 5)).toBe('12345');
  });
});

describe('constants are reasonable', () => {
  it('HEADER_HEIGHT is 56', () => {
    expect(HEADER_HEIGHT).toBe(56);
  });

  it('font sizes are sensible (title > subtitle)', () => {
    expect(HEADER_TITLE_FONT_SIZE).toBeGreaterThan(HEADER_SUBTITLE_FONT_SIZE);
    expect(HEADER_SUBTITLE_FONT_SIZE).toBeGreaterThan(0);
  });

  it('border opacity is between 0 and 1', () => {
    expect(HEADER_BORDER_OPACITY).toBeGreaterThan(0);
    expect(HEADER_BORDER_OPACITY).toBeLessThan(1);
  });
});
