/**
 * Utilities for parsing and stripping Gemini-style `**bold**` highlight markers
 * from AI commentary text. Pure functions — no side effects, no `any`, no deps.
 *
 * Supported marker styles:
 *   bold   — **text**
 *   italic — *text*   (must NOT consume ** boundaries)
 *   mark   — ==text==
 *
 * Rules:
 *   - Markers must be balanced; an unmatched opening marker is plain text.
 *   - Italic `*x*` never matches across `**` — bold is checked first when
 *     the cursor is at `**`.
 *   - Nesting is NOT supported; only the outer/first markers are recognised.
 *   - Newlines are preserved verbatim.
 *   - null / undefined input: stripHighlightMarkers returns '',
 *     parseHighlightSegments returns [], countHighlights returns all zeros.
 */

export type HighlightStyle = 'bold' | 'italic' | 'mark';

/** A typed text segment produced by parseHighlightSegments. */
export interface Segment {
  kind: 'plain' | HighlightStyle;
  text: string;
}

// ---------------------------------------------------------------------------
// Internal parser — single-pass, no regex
// ---------------------------------------------------------------------------

type TokenKind = 'bold' | 'italic' | 'mark' | 'plain';

interface Token {
  kind: TokenKind;
  text: string;
}

/**
 * Walk through `text` character by character and emit tokens.
 * Bold (`**`) is detected before italic (`*`) to prevent false matches.
 */
function tokenise(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let plainStart = 0;

  const flushPlain = (end: number) => {
    if (end > plainStart) {
      tokens.push({ kind: 'plain', text: text.slice(plainStart, end) });
    }
  };

  while (i < text.length) {
    // ---------- bold: **...**  ----------
    if (text[i] === '*' && text[i + 1] === '*') {
      const closeIdx = text.indexOf('**', i + 2);
      if (closeIdx !== -1) {
        flushPlain(i);
        tokens.push({ kind: 'bold', text: text.slice(i + 2, closeIdx) });
        i = closeIdx + 2;
        plainStart = i;
        continue;
      }
      // unmatched ** — treat as plain, advance past only one char to
      // let the next loop iteration see the second '*' as potential italic
      i++;
      continue;
    }

    // ---------- italic: *...*  ----------
    // Only entered when text[i] === '*' but NOT '**' (checked above already
    // handled the '**' case; we fall here only for single '*').
    if (text[i] === '*') {
      // Find the closing '*' that is not part of '**'
      let j = i + 1;
      let closeItalic = -1;
      while (j < text.length) {
        if (text[j] === '*') {
          if (text[j + 1] === '*') {
            // '**' boundary — stop searching
            break;
          }
          closeItalic = j;
          break;
        }
        j++;
      }
      if (closeItalic !== -1) {
        flushPlain(i);
        tokens.push({ kind: 'italic', text: text.slice(i + 1, closeItalic) });
        i = closeItalic + 1;
        plainStart = i;
        continue;
      }
      // unmatched single '*' — plain
      i++;
      continue;
    }

    // ---------- mark: ==...==  ----------
    if (text[i] === '=' && text[i + 1] === '=') {
      const closeIdx = text.indexOf('==', i + 2);
      if (closeIdx !== -1) {
        flushPlain(i);
        tokens.push({ kind: 'mark', text: text.slice(i + 2, closeIdx) });
        i = closeIdx + 2;
        plainStart = i;
        continue;
      }
      // unmatched ==
      i += 2;
      continue;
    }

    i++;
  }

  flushPlain(text.length);
  return tokens;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Strip highlight markers of the requested style (or all styles when omitted),
 * returning plain text.
 *
 * Examples:
 *   stripHighlightMarkers("a **b** c", "bold")   → "a b c"
 *   stripHighlightMarkers("a *b* c", "italic")   → "a b c"
 *   stripHighlightMarkers("a ==b== c", "mark")   → "a b c"
 *   stripHighlightMarkers("a **b** c")            → "a b c"  (all styles)
 */
export function stripHighlightMarkers(
  text: string | null | undefined,
  style?: HighlightStyle,
): string {
  if (text == null) return '';
  const tokens = tokenise(text);
  return tokens
    .map((t) => {
      if (t.kind === 'plain') return t.text;
      if (style == null || t.kind === style) return t.text;
      // Different highlight style — re-wrap with its markers so the caller
      // can see the untouched markers.
      if (t.kind === 'bold')   return `**${t.text}**`;
      if (t.kind === 'italic') return `*${t.text}*`;
      /* mark */               return `==${t.text}==`;
    })
    .join('');
}

/**
 * Split text into typed segments, preserving original order.
 * Intended for use by React Native / RN-Web renderers that need
 * to apply per-segment styling.
 *
 * Empty inner text (e.g. `****`) produces no segment.
 * null / undefined input returns [].
 *
 * Example:
 *   parseHighlightSegments("a **b** *c* ==d== e") →
 *     [{kind:'plain',text:'a '}, {kind:'bold',text:'b'}, {kind:'plain',text:' '},
 *      {kind:'italic',text:'c'}, {kind:'plain',text:' '},
 *      {kind:'mark',text:'d'}, {kind:'plain',text:' e'}]
 */
export function parseHighlightSegments(
  text: string | null | undefined,
): Segment[] {
  if (text == null) return [];
  return tokenise(text).filter((t) => t.text.length > 0) as Segment[];
}

/**
 * Count how many highlighted spans of each style appear in the text.
 * Useful for telemetry (e.g. average highlights per article).
 *
 * null / undefined input returns { bold: 0, italic: 0, mark: 0 }.
 */
export function countHighlights(
  text: string | null | undefined,
): { bold: number; italic: number; mark: number } {
  const counts = { bold: 0, italic: 0, mark: 0 };
  if (text == null) return counts;
  for (const t of tokenise(text)) {
    if (t.kind === 'bold' || t.kind === 'italic' || t.kind === 'mark') {
      counts[t.kind]++;
    }
  }
  return counts;
}
