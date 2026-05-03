import { cleanCommentary, type CleanedCommentary } from './commentary-cleanup';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function result(text: string | null | undefined): CleanedCommentary {
  return cleanCommentary(text);
}

// ---------------------------------------------------------------------------
// 1. Null / undefined / empty
// ---------------------------------------------------------------------------

describe('cleanCommentary — null/undefined/empty', () => {
  test('null returns all-empty object', () => {
    const r = result(null);
    expect(r.summary).toBe('');
    expect(r.highlights).toEqual([]);
    expect(r.fullText).toBe('');
    expect(r.wordCount).toBe(0);
  });

  test('undefined returns all-empty object', () => {
    const r = result(undefined);
    expect(r.summary).toBe('');
    expect(r.wordCount).toBe(0);
  });

  test('empty string returns all-empty object', () => {
    expect(result('')).toEqual({ summary: '', highlights: [], fullText: '', wordCount: 0 });
  });

  test('whitespace-only string returns all-empty object', () => {
    expect(result('   \n  ')).toEqual({ summary: '', highlights: [], fullText: '', wordCount: 0 });
  });
});

// ---------------------------------------------------------------------------
// 2. Boilerplate stripping — 免責聲明 trailing block
// ---------------------------------------------------------------------------

describe('cleanCommentary — strip 免責聲明 trailing', () => {
  test('removes everything from **免責 onward', () => {
    const text = '這支股票表現強勁。\n\n**免責聲明**：本內容僅供參考，不構成投資建議。';
    const r = result(text);
    expect(r.fullText).not.toContain('免責聲明');
    expect(r.fullText).toContain('這支股票表現強勁');
  });

  test('removes everything from ## 免責 onward', () => {
    const text = '分析完畢。\n\n## 免責聲明\n本內容僅供參考。';
    const r = result(text);
    expect(r.fullText).not.toContain('免責聲明');
  });

  test('strips 投資前請諮詢 line', () => {
    const text = '本週科技股走強。\n投資前請諮詢專業顧問。\n繼續觀察市場動向。';
    const r = result(text);
    expect(r.fullText).not.toContain('投資前請諮詢');
    expect(r.fullText).toContain('本週科技股走強');
  });

  test('strips 投資有風險 line', () => {
    const text = '整體市場偏多。\n投資有風險，入市需謹慎。';
    const r = result(text);
    expect(r.fullText).not.toContain('投資有風險');
    expect(r.fullText).toContain('整體市場偏多');
  });

  test('strips DYOR line (case-insensitive)', () => {
    const text = 'AAPL shows strong momentum.\nDYOR before investing.\nTrend is bullish.';
    const r = result(text);
    expect(r.fullText).not.toContain('DYOR');
    expect(r.fullText).toContain('AAPL shows strong momentum');
  });
});

// ---------------------------------------------------------------------------
// 3. Highlights — dash bullets
// ---------------------------------------------------------------------------

describe('cleanCommentary — extract dash-bullets', () => {
  test('extracts lines starting with "- "', () => {
    const text = '重點如下：\n- 營收創新高\n- 毛利率提升\n- 現金流穩定';
    const r = result(text);
    expect(r.highlights).toHaveLength(3);
    expect(r.highlights[0]).toBe('營收創新高');
    expect(r.highlights[2]).toBe('現金流穩定');
  });

  test('extracts lines starting with "• "', () => {
    const text = '• Revenue beat\n• Margins expanded\n• Guidance raised';
    const r = result(text);
    expect(r.highlights).toEqual(['Revenue beat', 'Margins expanded', 'Guidance raised']);
  });
});

// ---------------------------------------------------------------------------
// 4. Highlights — numbered list
// ---------------------------------------------------------------------------

describe('cleanCommentary — numbered list highlights', () => {
  test('extracts "1. 2. 3." numbered list items', () => {
    const text = '三大亮點：\n1. EPS 超越預期\n2. 指引上調\n3. 回購計畫啟動';
    const r = result(text);
    expect(r.highlights).toHaveLength(3);
    expect(r.highlights[0]).toBe('EPS 超越預期');
  });

  test('extracts "1) 2) 3)" style numbered items', () => {
    const text = '1) Strong Q4\n2) Raised outlook\n3) Share buyback';
    const r = result(text);
    expect(r.highlights).toHaveLength(3);
    expect(r.highlights[1]).toBe('Raised outlook');
  });
});

// ---------------------------------------------------------------------------
// 5. Highlights — bold-only lines
// ---------------------------------------------------------------------------

describe('cleanCommentary — bold-only line highlights', () => {
  test('extracts lines that are entirely **bold**', () => {
    const text = '**營收成長**\n本季表現出色。\n**毛利率改善**\n費用控制得宜。';
    const r = result(text);
    expect(r.highlights).toContain('營收成長');
    expect(r.highlights).toContain('毛利率改善');
  });

  test('does NOT extract mixed-content bold lines', () => {
    const text = '本季 **營收** 創新高，值得關注。';
    const r = result(text);
    expect(r.highlights).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Summary extraction
// ---------------------------------------------------------------------------

describe('cleanCommentary — summary', () => {
  test('takes first complete sentence up to 120 chars', () => {
    // First sentence is 31+ chars, so it should stand alone
    const text = 'This quarter Apple delivered earnings well above analyst expectations. Guidance was also raised.';
    const r = result(text);
    expect(r.summary).toBe('This quarter Apple delivered earnings well above analyst expectations.');
  });

  test('takes two sentences if first is shorter than 30 chars', () => {
    const text = '表現強勁。本季 EPS 超預期，指引上調，市場反應正面。';
    const r = result(text);
    // First sentence is "表現強勁。" (5 chars < 30), so second appended
    expect(r.summary.length).toBeGreaterThan(5);
    expect(r.summary).toContain('表現強勁');
    expect(r.summary).toContain('本季 EPS 超預期');
  });

  test('caps summary at 120 chars', () => {
    const longText = 'A'.repeat(200) + '.';
    const r = result(longText);
    expect(r.summary.length).toBeLessThanOrEqual(120);
  });
});

// ---------------------------------------------------------------------------
// 7. Very short text (no sentence terminator)
// ---------------------------------------------------------------------------

describe('cleanCommentary — very short text', () => {
  test('short text without terminator still produces summary', () => {
    const r = result('看好');
    expect(r.summary).toBe('看好');
    expect(r.fullText).toBe('看好');
    expect(r.wordCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Pure CJK wordCount accuracy
// ---------------------------------------------------------------------------

describe('cleanCommentary — CJK wordCount', () => {
  test('counts each CJK character individually', () => {
    const text = '五個字測試看看';  // 7 CJK chars
    const r = result(text);
    expect(r.wordCount).toBe(7);
  });

  test('counts mixed CJK + ASCII tokens correctly', () => {
    // "股票 AAPL 表現" → 2 CJK (股票) + 1 token (AAPL) + 2 CJK (表現) = 5
    const text = '股票 AAPL 表現';
    const r = result(text);
    expect(r.wordCount).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// 9. Combination: summary + highlights + clean text in same input
// ---------------------------------------------------------------------------

describe('cleanCommentary — combination', () => {
  test('handles all features together', () => {
    const text = [
      '本季蘋果公司的業績表現超越市場預期，分析師普遍給予正面評價。',
      '',
      '主要亮點：',
      '- EPS 達 $2.18，高於預期的 $2.10',
      '- 服務收入年增 14%',
      '- iPhone 銷量在旺季維持穩定',
      '',
      '**整體而言展望樂觀**',
      '',
      '免責聲明：本內容僅供參考。',
    ].join('\n');

    const r = result(text);

    expect(r.summary).toContain('本季蘋果公司的業績表現超越市場預期');
    expect(r.highlights).toHaveLength(4); // 3 dashes + 1 bold-only
    expect(r.highlights).toContain('整體而言展望樂觀');
    expect(r.fullText).not.toContain('免責聲明');
    expect(r.wordCount).toBeGreaterThan(0);
  });
});
