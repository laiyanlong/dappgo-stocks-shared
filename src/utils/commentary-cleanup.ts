/**
 * Post-processes Gemini AI commentary text: strips boilerplate, extracts a
 * summary sentence, pulls out highlighted/listed items, and counts words.
 *
 * Pure function — no IO, no side effects, no external deps.
 */

export interface CleanedCommentary {
  /** First 1-2 sentences, max 120 chars. */
  summary: string;
  /** Bulleted/listed items the AI flagged with bold or list markers. */
  highlights: string[];
  /** Original text minus boilerplate; markdown preserved. */
  fullText: string;
  /** Spaces + CJK char count, for telemetry. */
  wordCount: number;
}

// ---------------------------------------------------------------------------
// Boilerplate removal
// ---------------------------------------------------------------------------

/**
 * Patterns that mark the START of a trailing boilerplate block.
 * Everything from the match position to end-of-string is removed.
 */
const BOILERPLATE_BLOCK_RE =
  /(\*\*免責|\s*##\s*免責)/u;

/**
 * Individual boilerplate phrases that appear as standalone sentences or lines.
 * Matched case-insensitively; the whole line containing the phrase is dropped.
 */
const BOILERPLATE_LINE_PATTERNS: RegExp[] = [
  /本內容僅供參考/iu,
  /投資前請諮詢/iu,
  /免責聲明/iu,
  /投資有風險/iu,
  /\bDYOR\b/iu,
];

function stripBoilerplate(text: string): string {
  // 1. Remove everything from block-level boilerplate markers onward
  const blockMatch = BOILERPLATE_BLOCK_RE.exec(text);
  let cleaned = blockMatch != null ? text.slice(0, blockMatch.index) : text;

  // 2. Drop individual lines that contain boilerplate phrases
  const lines = cleaned.split('\n');
  const kept = lines.filter(
    (line) => !BOILERPLATE_LINE_PATTERNS.some((re) => re.test(line)),
  );
  cleaned = kept.join('\n');

  return cleaned.trim();
}

// ---------------------------------------------------------------------------
// Summary extraction
// ---------------------------------------------------------------------------

/** Sentence terminators (CJK full-stop, ASCII .!?) */
const SENTENCE_END_RE = /[。.!?！？]/u;

/**
 * Returns first sentence (≤120 chars). If the first sentence is <30 chars,
 * appends the second sentence (still capped at 120 total).
 */
function extractSummary(text: string): string {
  if (text.length === 0) return '';

  // Strip leading markdown heading lines before looking for sentences
  const stripped = text.replace(/^#+\s.*$/mu, '').trim();
  const body = stripped.length > 0 ? stripped : text;

  // Split on sentence terminators, keeping the terminator with each chunk
  const parts = body.split(/([。.!?！？])/u);

  // Rebuild sentences: parts alternate [text, terminator, text, terminator …]
  const sentences: string[] = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    const s = (parts[i] + (parts[i + 1] ?? '')).trim();
    if (s.length > 0) sentences.push(s);
  }
  // Remainder after last terminator (no terminator found → whole text is one)
  const lastRemainder = parts[parts.length - 1]?.trim();
  if (sentences.length === 0 && lastRemainder) {
    sentences.push(lastRemainder);
  }

  if (sentences.length === 0) return '';

  let summary = sentences[0];
  if (summary.length < 30 && sentences.length > 1) {
    const candidate = summary + sentences[1];
    summary = candidate;
  }

  return summary.slice(0, 120).trim();
}

// ---------------------------------------------------------------------------
// Highlights extraction
// ---------------------------------------------------------------------------

/**
 * A line counts as a highlight if it:
 *   - starts with `- ` or `• `
 *   - starts with a digit followed by `.` or `)` (numbered list)
 *   - is entirely a bold span: `**...**` with no surrounding text
 */
const BULLET_LINE_RE = /^(?:[-•]\s+|\d+[.)]\s+)/u;
const BOLD_ONLY_LINE_RE = /^\*\*[^*]+\*\*$/u;

function extractHighlights(text: string): string[] {
  const highlights: string[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.length === 0) continue;
    if (BULLET_LINE_RE.test(line) || BOLD_ONLY_LINE_RE.test(line)) {
      // Strip the list marker and surrounding bold for clean display
      const content = line
        .replace(/^[-•]\s+/, '')
        .replace(/^\d+[.)]\s+/, '')
        .replace(/^\*\*(.*)\*\*$/, '$1')
        .trim();
      if (content.length > 0) highlights.push(content);
    }
  }
  return highlights;
}

// ---------------------------------------------------------------------------
// Word count (whitespace tokens + individual CJK characters)
// ---------------------------------------------------------------------------

const CJK_CHAR_RE = /[　-鿿豈-﫿︰-﹏]/gu;
const WHITESPACE_TOKEN_RE = /\S+/gu;

function countWords(text: string): number {
  if (text.length === 0) return 0;

  // Count CJK characters individually
  const cjkMatches = text.match(CJK_CHAR_RE);
  const cjkCount = cjkMatches != null ? cjkMatches.length : 0;

  // Remove CJK chars before counting space-delimited tokens so they don't
  // inflate the token count
  const nonCjk = text.replace(CJK_CHAR_RE, ' ');
  const tokenMatches = nonCjk.match(WHITESPACE_TOKEN_RE);
  const tokenCount = tokenMatches != null ? tokenMatches.length : 0;

  return cjkCount + tokenCount;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const EMPTY: CleanedCommentary = {
  summary: '',
  highlights: [],
  fullText: '',
  wordCount: 0,
};

export function cleanCommentary(
  text: string | null | undefined,
): CleanedCommentary {
  if (text == null || text.trim().length === 0) return { ...EMPTY };

  const fullText = stripBoilerplate(text);
  const summary = extractSummary(fullText);
  const highlights = extractHighlights(fullText);
  const wordCount = countWords(fullText);

  return { summary, highlights, fullText, wordCount };
}
