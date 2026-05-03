import {
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHT_RATIO,
  lineHeight,
} from './typography';

describe('FONT_SIZE constants', () => {
  it('display equals 34 (Apple HIG large title)', () => {
    expect(FONT_SIZE.display).toBe(34);
  });

  it('subhead equals 17 (Apple HIG body reference size)', () => {
    expect(FONT_SIZE.subhead).toBe(17);
  });

  it('micro equals 11 (Material label-small reference)', () => {
    expect(FONT_SIZE.micro).toBe(11);
  });
});

describe('FONT_WEIGHT constants', () => {
  it('regular is "400" and bold is "700"', () => {
    expect(FONT_WEIGHT.regular).toBe('400');
    expect(FONT_WEIGHT.bold).toBe('700');
  });
});

describe('lineHeight()', () => {
  it('rounds to nearest integer using default ratio 1.35', () => {
    // 17 * 1.35 = 22.95 → 23
    expect(lineHeight(17)).toBe(23);
  });

  it('accepts a custom ratio', () => {
    // 20 * 1.5 = 30
    expect(lineHeight(20, 1.5)).toBe(30);
  });

  it('uses LINE_HEIGHT_RATIO as default', () => {
    expect(lineHeight(34)).toBe(Math.round(34 * LINE_HEIGHT_RATIO));
  });

  it('works for micro size', () => {
    // 11 * 1.35 = 14.85 → 15
    expect(lineHeight(11)).toBe(15);
  });
});
