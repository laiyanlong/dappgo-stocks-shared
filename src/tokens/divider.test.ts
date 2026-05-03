import {
  DIVIDER_THICKNESS,
  DIVIDER_OPACITY_LIGHT,
  DIVIDER_OPACITY_DARK,
  dividerStyle,
} from './divider';

describe('DIVIDER constants', () => {
  it('thickness is 1 logical pixel', () => {
    expect(DIVIDER_THICKNESS).toBe(1);
  });

  it('dark opacity is higher than light opacity (Retina compensation)', () => {
    expect(DIVIDER_OPACITY_DARK).toBeGreaterThan(DIVIDER_OPACITY_LIGHT);
  });
});

describe('dividerStyle()', () => {
  it('returns borderTopWidth of 1 for light mode', () => {
    const style = dividerStyle({ isDark: false, baseColor: '#000000' });
    expect(style.borderTopWidth).toBe(1);
  });

  it('bakes light-mode opacity into rgba color', () => {
    const style = dividerStyle({ isDark: false, baseColor: '#000000' });
    expect(style.borderTopColor).toBe(`rgba(0,0,0,${DIVIDER_OPACITY_LIGHT})`);
  });

  it('bakes dark-mode opacity into rgba color', () => {
    const style = dividerStyle({ isDark: true, baseColor: '#ffffff' });
    expect(style.borderTopColor).toBe(`rgba(255,255,255,${DIVIDER_OPACITY_DARK})`);
  });

  it('expands 3-digit hex shorthand', () => {
    const style = dividerStyle({ isDark: false, baseColor: '#fff' });
    expect(style.borderTopColor).toBe(`rgba(255,255,255,${DIVIDER_OPACITY_LIGHT})`);
  });
});
