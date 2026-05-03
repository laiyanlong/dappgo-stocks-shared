import {
  stripHighlightMarkers,
  parseHighlightSegments,
  countHighlights,
  type Segment,
} from './highlight-markers';

// ---------------------------------------------------------------------------
// 1. stripHighlightMarkers — basic per-style
// ---------------------------------------------------------------------------

describe('stripHighlightMarkers — basic strip', () => {
  test('strips bold markers', () => {
    expect(stripHighlightMarkers('a **b** c', 'bold')).toBe('a b c');
  });

  test('strips italic markers', () => {
    expect(stripHighlightMarkers('a *b* c', 'italic')).toBe('a b c');
  });

  test('strips mark markers', () => {
    expect(stripHighlightMarkers('a ==b== c', 'mark')).toBe('a b c');
  });

  test('strips all styles when no style arg given', () => {
    expect(stripHighlightMarkers('**bold** *ital* ==mark==')).toBe('bold ital mark');
  });
});

// ---------------------------------------------------------------------------
// 2. stripHighlightMarkers — mixed styles
// ---------------------------------------------------------------------------

describe('stripHighlightMarkers — mixed styles', () => {
  test('stripping bold leaves italic and mark markers intact', () => {
    expect(stripHighlightMarkers('**B** *I* ==M==', 'bold')).toBe('B *I* ==M==');
  });

  test('stripping italic leaves bold and mark markers intact', () => {
    expect(stripHighlightMarkers('**B** *I* ==M==', 'italic')).toBe('**B** I ==M==');
  });

  test('stripping mark leaves bold and italic markers intact', () => {
    expect(stripHighlightMarkers('**B** *I* ==M==', 'mark')).toBe('**B** *I* M');
  });

  test('mixed full sentence round-trip', () => {
    const input = 'Revenue **rose 12%** while costs *declined* and margins ==improved==.';
    expect(stripHighlightMarkers(input)).toBe(
      'Revenue rose 12% while costs declined and margins improved.',
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Unbalanced markers preserved as plain text
// ---------------------------------------------------------------------------

describe('unbalanced markers', () => {
  test('unmatched ** left as plain text', () => {
    expect(stripHighlightMarkers('a ** b')).toBe('a ** b');
  });

  test('unmatched * left as plain text', () => {
    expect(stripHighlightMarkers('a * b')).toBe('a * b');
  });

  test('unmatched == left as plain text', () => {
    expect(stripHighlightMarkers('a == b')).toBe('a == b');
  });

  test('opening ** with no closing: whole tail is plain', () => {
    expect(stripHighlightMarkers('start **unclosed')).toBe('start **unclosed');
  });
});

// ---------------------------------------------------------------------------
// 4. Multiple spans of the same style
// ---------------------------------------------------------------------------

describe('multiple spans', () => {
  test('two bold spans both stripped', () => {
    expect(stripHighlightMarkers('**a** and **b**', 'bold')).toBe('a and b');
  });

  test('three mark spans all counted', () => {
    expect(countHighlights('==x== ==y== ==z==')).toEqual({ bold: 0, italic: 0, mark: 3 });
  });
});

// ---------------------------------------------------------------------------
// 5. parseHighlightSegments — order and shape
// ---------------------------------------------------------------------------

describe('parseHighlightSegments — ordering', () => {
  test('full mixed example preserves segment order', () => {
    const segs = parseHighlightSegments('a **b** *c* ==d== e');
    expect(segs).toEqual<Segment[]>([
      { kind: 'plain',  text: 'a ' },
      { kind: 'bold',   text: 'b' },
      { kind: 'plain',  text: ' ' },
      { kind: 'italic', text: 'c' },
      { kind: 'plain',  text: ' ' },
      { kind: 'mark',   text: 'd' },
      { kind: 'plain',  text: ' e' },
    ]);
  });

  test('no empty segments emitted', () => {
    const segs = parseHighlightSegments('**a****b**');
    expect(segs.every((s) => s.text.length > 0)).toBe(true);
  });

  test('plain-only string returns single plain segment', () => {
    expect(parseHighlightSegments('hello world')).toEqual<Segment[]>([
      { kind: 'plain', text: 'hello world' },
    ]);
  });
});

// ---------------------------------------------------------------------------
// 6. countHighlights accuracy
// ---------------------------------------------------------------------------

describe('countHighlights', () => {
  test('counts each style correctly', () => {
    expect(countHighlights('**a** *b* ==c== **d**')).toEqual({
      bold: 2,
      italic: 1,
      mark: 1,
    });
  });

  test('plain text returns all zeros', () => {
    expect(countHighlights('no markers here')).toEqual({ bold: 0, italic: 0, mark: 0 });
  });
});

// ---------------------------------------------------------------------------
// 7. null / undefined handling
// ---------------------------------------------------------------------------

describe('null and undefined inputs', () => {
  test('stripHighlightMarkers(null) returns empty string', () => {
    expect(stripHighlightMarkers(null)).toBe('');
  });

  test('stripHighlightMarkers(undefined) returns empty string', () => {
    expect(stripHighlightMarkers(undefined)).toBe('');
  });

  test('parseHighlightSegments(null) returns []', () => {
    expect(parseHighlightSegments(null)).toEqual([]);
  });

  test('parseHighlightSegments(undefined) returns []', () => {
    expect(parseHighlightSegments(undefined)).toEqual([]);
  });

  test('countHighlights(null) returns all zeros', () => {
    expect(countHighlights(null)).toEqual({ bold: 0, italic: 0, mark: 0 });
  });

  test('countHighlights(undefined) returns all zeros', () => {
    expect(countHighlights(undefined)).toEqual({ bold: 0, italic: 0, mark: 0 });
  });
});

// ---------------------------------------------------------------------------
// 8. Nested markers (not supported — outer consumed, inner treated as plain)
// ---------------------------------------------------------------------------

describe('nested markers — not supported', () => {
  test('inner markers inside bold are returned as plain text', () => {
    // **outer *inner* text** → bold segment containing "*inner* text"
    const segs = parseHighlightSegments('**outer *inner* text**');
    expect(segs).toEqual<Segment[]>([
      { kind: 'bold', text: 'outer *inner* text' },
    ]);
  });
});

// ---------------------------------------------------------------------------
// 9. Newlines preserved
// ---------------------------------------------------------------------------

describe('newlines preserved', () => {
  test('newlines inside bold span are kept', () => {
    expect(stripHighlightMarkers('**line1\nline2**', 'bold')).toBe('line1\nline2');
  });

  test('newlines between spans are kept', () => {
    const result = stripHighlightMarkers('**a**\n*b*');
    expect(result).toBe('a\nb');
  });
});
