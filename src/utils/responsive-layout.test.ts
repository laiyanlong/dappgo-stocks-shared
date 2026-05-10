import { getLayoutMode, getResponsiveValues } from './responsive-layout';
import type { LayoutMode } from './responsive-layout';

// ── getLayoutMode ──────────────────────────────────────────────────────────

describe('getLayoutMode', () => {
  it('returns phone for width < 600', () => {
    expect(getLayoutMode(390)).toBe('phone');
    expect(getLayoutMode(599)).toBe('phone');
    expect(getLayoutMode(0)).toBe('phone');
  });

  it('returns tablet-portrait for width 600–899', () => {
    expect(getLayoutMode(600)).toBe('tablet-portrait');
    expect(getLayoutMode(768)).toBe('tablet-portrait');
    expect(getLayoutMode(899)).toBe('tablet-portrait');
  });

  it('returns tablet-landscape for width >= 900', () => {
    expect(getLayoutMode(900)).toBe('tablet-landscape');
    expect(getLayoutMode(1024)).toBe('tablet-landscape');
    expect(getLayoutMode(1366)).toBe('tablet-landscape');
  });
});

// ── getResponsiveValues ────────────────────────────────────────────────────

describe('getResponsiveValues — phone (390 × 844)', () => {
  const layout = getResponsiveValues(390, 844);

  it('mode is phone', () => expect(layout.mode).toBe<LayoutMode>('phone'));
  it('isPhone true', () => expect(layout.isPhone).toBe(true));
  it('isTablet false', () => expect(layout.isTablet).toBe(false));
  it('isLandscape false (portrait)', () => expect(layout.isLandscape).toBe(false));
  it('contentMaxWidth is Infinity', () => expect(layout.contentMaxWidth).toBe(Infinity));
  it('contentPadding is 0', () => expect(layout.contentPadding).toBe(0));
  it('numColumns is 1', () => expect(layout.numColumns).toBe(1));
});

describe('getResponsiveValues — phone landscape (844 × 390)', () => {
  const layout = getResponsiveValues(844, 390);

  it('mode is phone (still < 900 but > 600 → tablet-portrait)', () => {
    // 844 >= 600, so it becomes tablet-portrait not phone
    expect(layout.mode).toBe<LayoutMode>('tablet-portrait');
  });
  it('isLandscape true (844 > 390)', () => expect(layout.isLandscape).toBe(true));
});

describe('getResponsiveValues — tablet portrait (768 × 1024)', () => {
  const layout = getResponsiveValues(768, 1024);

  it('mode is tablet-portrait', () => expect(layout.mode).toBe<LayoutMode>('tablet-portrait'));
  it('isPhone false', () => expect(layout.isPhone).toBe(false));
  it('isTablet true', () => expect(layout.isTablet).toBe(true));
  it('isLandscape false', () => expect(layout.isLandscape).toBe(false));
  it('contentMaxWidth is 720', () => expect(layout.contentMaxWidth).toBe(720));
  it('contentPadding is (768 - 720) / 2 = 24', () => expect(layout.contentPadding).toBe(24));
  it('numColumns is 2', () => expect(layout.numColumns).toBe(2));
});

describe('getResponsiveValues — tablet landscape (1024 × 768)', () => {
  const layout = getResponsiveValues(1024, 768);

  it('mode is tablet-landscape', () => expect(layout.mode).toBe<LayoutMode>('tablet-landscape'));
  it('isPhone false', () => expect(layout.isPhone).toBe(false));
  it('isTablet true', () => expect(layout.isTablet).toBe(true));
  it('isLandscape true', () => expect(layout.isLandscape).toBe(true));
  it('contentMaxWidth is 860', () => expect(layout.contentMaxWidth).toBe(860));
  it('contentPadding is (1024 - 860) / 2 = 82', () => expect(layout.contentPadding).toBe(82));
  it('numColumns is 3', () => expect(layout.numColumns).toBe(3));
});

describe('getResponsiveValues — large iPad 12.9" landscape (1366 × 1024)', () => {
  const layout = getResponsiveValues(1366, 1024);

  it('mode is tablet-landscape', () => expect(layout.mode).toBe<LayoutMode>('tablet-landscape'));
  it('contentMaxWidth is 860', () => expect(layout.contentMaxWidth).toBe(860));
  it('contentPadding is (1366 - 860) / 2 = 253', () => expect(layout.contentPadding).toBe(253));
  it('numColumns is 3', () => expect(layout.numColumns).toBe(3));
});

describe('getResponsiveValues — edge case exactly 900pt wide landscape (900 × 600)', () => {
  const layout = getResponsiveValues(900, 600);

  it('mode is tablet-landscape', () => expect(layout.mode).toBe<LayoutMode>('tablet-landscape'));
  it('contentMaxWidth is 860', () => expect(layout.contentMaxWidth).toBe(860));
  it('contentPadding is (900 - 860) / 2 = 20', () => expect(layout.contentPadding).toBe(20));
});

describe('getResponsiveValues — edge case exactly 600pt wide portrait (600 × 900)', () => {
  const layout = getResponsiveValues(600, 900);

  it('mode is tablet-portrait', () => expect(layout.mode).toBe<LayoutMode>('tablet-portrait'));
  it('contentMaxWidth is 720', () => expect(layout.contentMaxWidth).toBe(720));
  // contentPadding: (600 - 720) / 2 → negative → clamped to 0
  it('contentPadding is 0 (screen narrower than contentMaxWidth)', () => expect(layout.contentPadding).toBe(0));
  it('numColumns is 2', () => expect(layout.numColumns).toBe(2));
});
