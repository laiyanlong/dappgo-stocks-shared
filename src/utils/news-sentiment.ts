/**
 * News-sentiment label/tone mapping for consistent badge display across apps.
 * Pure function — no IO, no side effects, no deps beyond standard TypeScript.
 *
 * Label derivation (when explicit `label` not provided):
 *   score >= 0.5          → very_positive
 *   score >= 0.15         → positive
 *   score > -0.15         → neutral
 *   score > -0.5          → negative
 *   score <= -0.5         → very_negative
 *   no score and no label → unknown
 */

const EM_DASH = '—';

export type SentimentLabel =
  | 'very_positive'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'very_negative'
  | 'unknown';

export interface SentimentInput {
  score?: number | null;             // -1.0 .. +1.0
  positive_count?: number | null;
  negative_count?: number | null;
  neutral_count?: number | null;
  label?: SentimentLabel | null;
  top_positive_title?: string | null;
  top_negative_title?: string | null;
}

export interface SentimentDisplay {
  label: SentimentLabel;
  emoji: '🟢' | '🟡' | '⚪' | '🟠' | '🔴' | '?';
  tone: 'positive' | 'mild_positive' | 'neutral' | 'mild_negative' | 'negative' | 'unknown';
  headline: string;    // e.g. "正面 (5/2/0)" — counts: pos/neg/neu
  scoreLabel: string;  // "+0.42" or "—" if score null
  summary: string | null; // dominant side title, null if both 0
}

// ---------------------------------------------------------------------------
// Internal maps
// ---------------------------------------------------------------------------

type EmojiType = SentimentDisplay['emoji'];
type ToneType = SentimentDisplay['tone'];

const EMOJI_MAP: Record<SentimentLabel, EmojiType> = {
  very_positive: '🟢',
  positive:      '🟡',
  neutral:       '⚪',
  negative:      '🟠',
  very_negative: '🔴',
  unknown:       '?',
};

const TONE_MAP: Record<SentimentLabel, ToneType> = {
  very_positive: 'positive',
  positive:      'mild_positive',
  neutral:       'neutral',
  negative:      'mild_negative',
  very_negative: 'negative',
  unknown:       'unknown',
};

const ZH_LABEL_MAP: Record<SentimentLabel, string> = {
  very_positive: '強正面',
  positive:      '正面',
  neutral:       '中性',
  negative:      '負面',
  very_negative: '強負面',
  unknown:       '未知',
};

const EN_LABEL_MAP: Record<SentimentLabel, string> = {
  very_positive: 'Strong+',
  positive:      'Positive',
  neutral:       'Neutral',
  negative:      'Negative',
  very_negative: 'Strong-',
  unknown:       'Unknown',
};

// ---------------------------------------------------------------------------
// Score → label derivation
// ---------------------------------------------------------------------------

function deriveLabel(score: number): SentimentLabel {
  if (score >= 0.5)   return 'very_positive';
  if (score >= 0.15)  return 'positive';
  if (score > -0.15)  return 'neutral';
  if (score > -0.5)   return 'negative';
  return 'very_negative';
}

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

export function classifySentiment(
  input: SentimentInput | null | undefined,
  locale: 'zh-TW' | 'en-US' = 'zh-TW',
): SentimentDisplay {
  if (input == null) {
    return buildDisplay('unknown', null, null, null, null, null, null, locale);
  }

  const {
    score,
    positive_count,
    negative_count,
    neutral_count,
    label,
    top_positive_title,
    top_negative_title,
  } = input;

  // Resolve label: explicit wins, else derive from score, else unknown
  let resolved: SentimentLabel;
  if (label != null) {
    resolved = label;
  } else if (score != null && isFinite(score)) {
    resolved = deriveLabel(score);
  } else {
    resolved = 'unknown';
  }

  return buildDisplay(
    resolved,
    score ?? null,
    positive_count ?? null,
    negative_count ?? null,
    neutral_count ?? null,
    top_positive_title ?? null,
    top_negative_title ?? null,
    locale,
  );
}

function buildDisplay(
  label: SentimentLabel,
  score: number | null,
  pos: number | null,
  neg: number | null,
  neu: number | null,
  topPos: string | null,
  topNeg: string | null,
  locale: 'zh-TW' | 'en-US',
): SentimentDisplay {
  const labelMap = locale === 'en-US' ? EN_LABEL_MAP : ZH_LABEL_MAP;
  const localLabel = labelMap[label];

  // Counts string "(pos/neg/neu)" — only when at least one count is known
  const hasCounts = pos != null || neg != null || neu != null;
  const posN = pos ?? 0;
  const negN = neg ?? 0;
  const neuN = neu ?? 0;
  const countsStr = hasCounts ? ` (${posN}/${negN}/${neuN})` : '';
  const headline = `${localLabel}${countsStr}`;

  // Score label
  const scoreLabel =
    score != null && isFinite(score)
      ? (score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2))
      : EM_DASH;

  // Summary: dominant side
  let summary: string | null = null;
  if (posN > negN && topPos) {
    summary = topPos;
  } else if (negN > posN && topNeg) {
    summary = topNeg;
  } else if (posN === negN) {
    // tie — prefer positive title if available, else negative
    summary = topPos ?? topNeg ?? null;
  }

  return {
    label,
    emoji: EMOJI_MAP[label],
    tone:  TONE_MAP[label],
    headline,
    scoreLabel,
    summary,
  };
}
