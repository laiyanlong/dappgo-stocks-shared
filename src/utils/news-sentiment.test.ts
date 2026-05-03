import {
  classifySentiment,
  type SentimentDisplay,
  type SentimentInput,
} from './news-sentiment';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function label(d: SentimentDisplay) {
  return d.label;
}
function emoji(d: SentimentDisplay) {
  return d.emoji;
}
function tone(d: SentimentDisplay) {
  return d.tone;
}

// ---------------------------------------------------------------------------
// 1. Explicit label — respected regardless of score
// ---------------------------------------------------------------------------

describe('explicit label is trusted', () => {
  const cases: SentimentInput['label'][] = [
    'very_positive', 'positive', 'neutral', 'negative', 'very_negative', 'unknown',
  ];

  test.each(cases)('label=%s is passed through', (lbl) => {
    const d = classifySentiment({ label: lbl, score: 0 });
    expect(d.label).toBe(lbl);
  });
});

// ---------------------------------------------------------------------------
// 2. Score-only derivation — each band
// ---------------------------------------------------------------------------

describe('score derivation', () => {
  test('score 0.5 → very_positive', () => {
    expect(label(classifySentiment({ score: 0.5 }))).toBe('very_positive');
  });

  test('score 0.9 → very_positive', () => {
    expect(label(classifySentiment({ score: 0.9 }))).toBe('very_positive');
  });

  test('score 0.15 → positive', () => {
    expect(label(classifySentiment({ score: 0.15 }))).toBe('positive');
  });

  test('score 0.3 → positive', () => {
    expect(label(classifySentiment({ score: 0.3 }))).toBe('positive');
  });

  test('score 0 → neutral', () => {
    expect(label(classifySentiment({ score: 0 }))).toBe('neutral');
  });

  test('score -0.1 → neutral', () => {
    expect(label(classifySentiment({ score: -0.1 }))).toBe('neutral');
  });

  test('score -0.15 → neutral (boundary exclusive)', () => {
    // score > -0.15 is neutral; -0.15 is NOT > -0.15 → negative
    expect(label(classifySentiment({ score: -0.15 }))).toBe('negative');
  });

  test('score -0.3 → negative', () => {
    expect(label(classifySentiment({ score: -0.3 }))).toBe('negative');
  });

  test('score -0.5 → very_negative (boundary inclusive)', () => {
    expect(label(classifySentiment({ score: -0.5 }))).toBe('very_negative');
  });

  test('score -0.8 → very_negative', () => {
    expect(label(classifySentiment({ score: -0.8 }))).toBe('very_negative');
  });
});

// ---------------------------------------------------------------------------
// 3. null / undefined / empty input → unknown
// ---------------------------------------------------------------------------

describe('missing input → unknown', () => {
  test('null input returns unknown', () => {
    expect(label(classifySentiment(null))).toBe('unknown');
  });

  test('undefined input returns unknown', () => {
    expect(label(classifySentiment(undefined))).toBe('unknown');
  });

  test('empty object (no score, no label) returns unknown', () => {
    expect(label(classifySentiment({}))).toBe('unknown');
  });

  test('score: null returns unknown', () => {
    expect(label(classifySentiment({ score: null }))).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// 4. emoji and tone maps
// ---------------------------------------------------------------------------

describe('emoji and tone mapping', () => {
  test('very_positive → 🟢, tone=positive', () => {
    const d = classifySentiment({ label: 'very_positive' });
    expect(emoji(d)).toBe('🟢');
    expect(tone(d)).toBe('positive');
  });

  test('positive → 🟡, tone=mild_positive', () => {
    const d = classifySentiment({ label: 'positive' });
    expect(emoji(d)).toBe('🟡');
    expect(tone(d)).toBe('mild_positive');
  });

  test('neutral → ⚪, tone=neutral', () => {
    const d = classifySentiment({ label: 'neutral' });
    expect(emoji(d)).toBe('⚪');
    expect(tone(d)).toBe('neutral');
  });

  test('negative → 🟠, tone=mild_negative', () => {
    const d = classifySentiment({ label: 'negative' });
    expect(emoji(d)).toBe('🟠');
    expect(tone(d)).toBe('mild_negative');
  });

  test('very_negative → 🔴, tone=negative', () => {
    const d = classifySentiment({ label: 'very_negative' });
    expect(emoji(d)).toBe('🔴');
    expect(tone(d)).toBe('negative');
  });

  test('unknown → ?, tone=unknown', () => {
    const d = classifySentiment({ label: 'unknown' });
    expect(emoji(d)).toBe('?');
    expect(tone(d)).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// 5. headline with counts (zh-TW)
// ---------------------------------------------------------------------------

describe('headline with counts', () => {
  test('counts appear in zh-TW headline', () => {
    const d = classifySentiment({
      score: 0.6,
      positive_count: 5,
      negative_count: 2,
      neutral_count: 0,
    });
    expect(d.headline).toBe('強正面 (5/2/0)');
  });

  test('partial counts (only positive_count known)', () => {
    const d = classifySentiment({
      label: 'positive',
      positive_count: 3,
    });
    expect(d.headline).toBe('正面 (3/0/0)');
  });

  test('no counts → no parenthetical', () => {
    const d = classifySentiment({ label: 'neutral' });
    expect(d.headline).toBe('中性');
  });

  test('null counts treated as 0 in output', () => {
    const d = classifySentiment({
      label: 'negative',
      positive_count: null,
      negative_count: 4,
      neutral_count: null,
    });
    expect(d.headline).toBe('負面 (0/4/0)');
  });
});

// ---------------------------------------------------------------------------
// 6. scoreLabel
// ---------------------------------------------------------------------------

describe('scoreLabel', () => {
  test('positive score shows + prefix', () => {
    expect(classifySentiment({ score: 0.42 }).scoreLabel).toBe('+0.42');
  });

  test('negative score shows - prefix', () => {
    expect(classifySentiment({ score: -0.35 }).scoreLabel).toBe('-0.35');
  });

  test('zero score shows +0.00', () => {
    expect(classifySentiment({ score: 0 }).scoreLabel).toBe('+0.00');
  });

  test('null score shows em dash', () => {
    expect(classifySentiment({ label: 'neutral' }).scoreLabel).toBe('—');
  });
});

// ---------------------------------------------------------------------------
// 7. summary — dominant side title selection
// ---------------------------------------------------------------------------

describe('summary title selection', () => {
  test('pos > neg → top_positive_title', () => {
    const d = classifySentiment({
      label: 'positive',
      positive_count: 5,
      negative_count: 1,
      top_positive_title: 'Good earnings',
      top_negative_title: 'Recall notice',
    });
    expect(d.summary).toBe('Good earnings');
  });

  test('neg > pos → top_negative_title', () => {
    const d = classifySentiment({
      label: 'negative',
      positive_count: 1,
      negative_count: 4,
      top_positive_title: 'Record high',
      top_negative_title: 'CEO resigns',
    });
    expect(d.summary).toBe('CEO resigns');
  });

  test('tie → prefers top_positive_title when available', () => {
    const d = classifySentiment({
      label: 'neutral',
      positive_count: 2,
      negative_count: 2,
      top_positive_title: 'Mixed outlook',
      top_negative_title: 'Cautious guidance',
    });
    expect(d.summary).toBe('Mixed outlook');
  });

  test('tie, no positive title → falls back to top_negative_title', () => {
    const d = classifySentiment({
      label: 'neutral',
      positive_count: 2,
      negative_count: 2,
      top_negative_title: 'Cautious guidance',
    });
    expect(d.summary).toBe('Cautious guidance');
  });

  test('both counts 0, no titles → summary null', () => {
    const d = classifySentiment({ label: 'unknown' });
    expect(d.summary).toBeNull();
  });

  test('no counts provided, no titles → summary null', () => {
    const d = classifySentiment({ score: 0.3 });
    expect(d.summary).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 8. en-US locale labels
// ---------------------------------------------------------------------------

describe('en-US locale', () => {
  test('very_positive en-US headline', () => {
    expect(classifySentiment({ label: 'very_positive' }, 'en-US').headline).toBe('Strong+');
  });

  test('positive en-US with counts', () => {
    const d = classifySentiment(
      { label: 'positive', positive_count: 3, negative_count: 1, neutral_count: 2 },
      'en-US',
    );
    expect(d.headline).toBe('Positive (3/1/2)');
  });

  test('neutral en-US', () => {
    expect(classifySentiment({ label: 'neutral' }, 'en-US').headline).toBe('Neutral');
  });

  test('negative en-US', () => {
    expect(classifySentiment({ label: 'negative' }, 'en-US').headline).toBe('Negative');
  });

  test('very_negative en-US', () => {
    expect(classifySentiment({ label: 'very_negative' }, 'en-US').headline).toBe('Strong-');
  });

  test('unknown en-US', () => {
    expect(classifySentiment(null, 'en-US').headline).toBe('Unknown');
  });
});
