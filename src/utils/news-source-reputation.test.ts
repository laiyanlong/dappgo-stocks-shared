import { classifyNewsSource, tierLabel, type SourceTier } from './news-source-reputation';

// ---------------------------------------------------------------------------
// classifyNewsSource — URL inputs
// ---------------------------------------------------------------------------

describe('classifyNewsSource — URL → tier1', () => {
  it('reuters.com full article URL → tier1', () => {
    const info = classifyNewsSource('https://www.reuters.com/article/us-markets-stocks/abc-123');
    expect(info.tier).toBe('tier1');
    expect(info.emoji).toBe('🥇');
    expect(info.domain).toBe('reuters.com');
    expect(info.trustScore).toBeGreaterThanOrEqual(90);
  });

  it('bloomberg.com → tier1', () => {
    const info = classifyNewsSource('https://bloomberg.com/news/articles/2025-01-01/foo');
    expect(info.tier).toBe('tier1');
    expect(info.source).toBe('Bloomberg');
  });

  it('ft.com → tier1', () => {
    const info = classifyNewsSource('https://www.ft.com/content/some-uuid');
    expect(info.tier).toBe('tier1');
    expect(info.trustScore).toBeGreaterThanOrEqual(90);
  });

  it('wsj.com → tier1', () => {
    const info = classifyNewsSource('https://www.wsj.com/articles/fed-raises-rates');
    expect(info.tier).toBe('tier1');
  });

  it('TW: money.udn.com (經濟日報) → tier1', () => {
    const info = classifyNewsSource('https://money.udn.com/money/story/5607/1234567');
    expect(info.tier).toBe('tier1');
    expect(info.source).toBe('經濟日報');
  });

  it('TW: ctee.com.tw (工商時報) → tier1', () => {
    const info = classifyNewsSource('https://www.ctee.com.tw/news/20250101700001-430101');
    expect(info.tier).toBe('tier1');
  });
});

// ---------------------------------------------------------------------------
// classifyNewsSource — URL → tier2
// ---------------------------------------------------------------------------

describe('classifyNewsSource — URL → tier2', () => {
  it('cnbc.com → tier2', () => {
    const info = classifyNewsSource('https://www.cnbc.com/2025/01/01/markets.html');
    expect(info.tier).toBe('tier2');
    expect(info.emoji).toBe('🥈');
    expect(info.source).toBe('CNBC');
  });

  it('marketwatch.com → tier2', () => {
    const info = classifyNewsSource('https://www.marketwatch.com/story/abc');
    expect(info.tier).toBe('tier2');
  });

  it('finance.yahoo.com subdomain → tier2 (subdomain match)', () => {
    const info = classifyNewsSource('https://finance.yahoo.com/news/foo-bar');
    expect(info.tier).toBe('tier2');
    expect(info.source).toBe('Yahoo Finance');
  });

  it('TW: anue.com.tw (鉅亨) → tier2', () => {
    const info = classifyNewsSource('https://news.anue.com.tw/news/category/tw_stock');
    expect(info.tier).toBe('tier2');
  });
});

// ---------------------------------------------------------------------------
// classifyNewsSource — URL → tier3
// ---------------------------------------------------------------------------

describe('classifyNewsSource — URL → tier3', () => {
  it('medium.com → tier3', () => {
    const info = classifyNewsSource('https://medium.com/@somewriter/article');
    expect(info.tier).toBe('tier3');
    expect(info.emoji).toBe('🥉');
    expect(info.trustScore).toBeLessThan(50);
  });

  it('substack.com → tier3', () => {
    const info = classifyNewsSource('https://somewriter.substack.com/p/article');
    expect(info.tier).toBe('tier3');
  });
});

// ---------------------------------------------------------------------------
// classifyNewsSource — URL → unknown
// ---------------------------------------------------------------------------

describe('classifyNewsSource — unknown URL', () => {
  it('completely unknown domain → unknown tier', () => {
    const info = classifyNewsSource('https://randomstockblog.io/post/123');
    expect(info.tier).toBe('unknown');
    expect(info.emoji).toBe('❓');
    expect(info.trustScore).toBe(0);
  });

  it('www subdomain of unknown domain → unknown', () => {
    const info = classifyNewsSource('https://www.clickbaitnews.click/top-10-stocks');
    expect(info.tier).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// classifyNewsSource — source name inputs
// ---------------------------------------------------------------------------

describe('classifyNewsSource — source name string', () => {
  it('exact name "Reuters" → tier1', () => {
    const info = classifyNewsSource('Reuters');
    expect(info.tier).toBe('tier1');
    expect(info.emoji).toBe('🥇');
  });

  it('case-insensitive name "bloomberg" → tier1', () => {
    const info = classifyNewsSource('bloomberg');
    expect(info.tier).toBe('tier1');
  });

  it('Chinese name "經濟日報" → tier1', () => {
    const info = classifyNewsSource('經濟日報');
    expect(info.tier).toBe('tier1');
  });

  it('"CNBC" source name → tier2', () => {
    const info = classifyNewsSource('CNBC');
    expect(info.tier).toBe('tier2');
  });

  it('unknown source name → unknown', () => {
    const info = classifyNewsSource('SomeBlogNoOneKnows');
    expect(info.tier).toBe('unknown');
    expect(info.emoji).toBe('❓');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('classifyNewsSource — edge cases', () => {
  it('empty string → unknown', () => {
    const info = classifyNewsSource('');
    expect(info.tier).toBe('unknown');
    expect(info.emoji).toBe('❓');
  });

  it('whitespace-only string → unknown', () => {
    const info = classifyNewsSource('   ');
    expect(info.tier).toBe('unknown');
  });

  it('URL with mixed-case domain → still matches', () => {
    const info = classifyNewsSource('https://WWW.REUTERS.COM/article/test');
    expect(info.tier).toBe('tier1');
  });

  it('malformed URL treated as source name lookup', () => {
    // "not-a-url" doesn't start with http — falls to name lookup path, won't match anything
    const info = classifyNewsSource('not-a-url');
    expect(info.tier).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// tierLabel
// ---------------------------------------------------------------------------

describe('tierLabel', () => {
  const tiers: SourceTier[] = ['tier1', 'tier2', 'tier3', 'unknown'];

  it('en-US labels are correct', () => {
    expect(tierLabel('tier1',   'en-US')).toBe('Major');
    expect(tierLabel('tier2',   'en-US')).toBe('Mainstream');
    expect(tierLabel('tier3',   'en-US')).toBe('Other');
    expect(tierLabel('unknown', 'en-US')).toBe('Unknown');
  });

  it('zh-TW labels are correct', () => {
    expect(tierLabel('tier1',   'zh-TW')).toBe('主流財經');
    expect(tierLabel('tier2',   'zh-TW')).toBe('財經媒體');
    expect(tierLabel('tier3',   'zh-TW')).toBe('一般');
    expect(tierLabel('unknown', 'zh-TW')).toBe('未知');
  });

  it('defaults to zh-TW when locale omitted', () => {
    expect(tierLabel('tier1')).toBe('主流財經');
  });

  it('all tiers produce non-empty strings for both locales', () => {
    for (const tier of tiers) {
      expect(tierLabel(tier, 'en-US').length).toBeGreaterThan(0);
      expect(tierLabel(tier, 'zh-TW').length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Return-shape invariants
// ---------------------------------------------------------------------------

describe('SourceInfo shape invariants', () => {
  const samples = [
    'https://www.reuters.com/article/test',
    'https://www.cnbc.com/2025/01/01/markets.html',
    'https://medium.com/@foo/bar',
    'https://unknown-blog.xyz/post',
    'Reuters',
    '',
  ];

  it.each(samples)('classifyNewsSource(%s) returns complete SourceInfo', (input) => {
    const info = classifyNewsSource(input);
    expect(typeof info.source).toBe('string');
    expect(typeof info.domain).toBe('string');
    expect(['tier1', 'tier2', 'tier3', 'unknown']).toContain(info.tier);
    expect(['🥇', '🥈', '🥉', '❓']).toContain(info.emoji);
    expect(info.trustScore).toBeGreaterThanOrEqual(0);
    expect(info.trustScore).toBeLessThanOrEqual(100);
  });
});
