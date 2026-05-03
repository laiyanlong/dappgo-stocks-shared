import { classifyInsiderActivity } from './insider-direction';

describe('classifyInsiderActivity', () => {
  it('returns "buying" when only buys exist', () => {
    expect(classifyInsiderActivity(10000, 0)).toBe('buying');
  });

  it('returns "selling" when only sells exist', () => {
    expect(classifyInsiderActivity(0, 10000)).toBe('selling');
  });

  it('returns "mixed" when buy and sell are roughly equal', () => {
    expect(classifyInsiderActivity(5000, 5000)).toBe('mixed');
  });

  it('returns "none" when both sides are 0', () => {
    expect(classifyInsiderActivity(0, 0)).toBe('none');
  });

  it('returns "mixed" when buy is within 1.2x of sell', () => {
    // 1100 / 1000 = 1.1 → below dominance threshold
    expect(classifyInsiderActivity(1100, 1000)).toBe('mixed');
  });

  it('returns "buying" when buy is at or above 1.2x sell', () => {
    expect(classifyInsiderActivity(1300, 1000)).toBe('buying');
  });

  it('returns "selling" when sell is at or above 1.2x buy', () => {
    expect(classifyInsiderActivity(1000, 1300)).toBe('selling');
  });

  it('treats negative inputs as 0', () => {
    expect(classifyInsiderActivity(-500, -200)).toBe('none');
    expect(classifyInsiderActivity(-100, 5000)).toBe('selling');
  });
});
