/**
 * News-source reputation classifier — returns a trust tier and display info
 * given a URL or a source name string.
 * Pure function — no IO, no side effects, no deps beyond standard TypeScript.
 *
 * Tier definitions:
 *   tier1 — major financial wire (Reuters, Bloomberg, WSJ, FT, 經濟日報, 工商時報)
 *   tier2 — established outlets (CNBC, MarketWatch, Yahoo Finance, 中央社, MoneyDJ, 鉅亨)
 *   tier3 — blogs / low-verification (Medium, Substack, individual writers)
 *   unknown — couldn't classify
 */

export type SourceTier = 'tier1' | 'tier2' | 'tier3' | 'unknown';

export interface SourceInfo {
  source: string;       // canonical display name
  domain: string;       // normalised domain (empty string if input was a name)
  tier: SourceTier;
  emoji: '🥇' | '🥈' | '🥉' | '❓';
  trustScore: number;   // 0-100
}

// ---------------------------------------------------------------------------
// Internal source table
// ---------------------------------------------------------------------------

interface SourceEntry {
  tier: SourceTier;
  displayName: string;
  trustScore: number;
}

const KNOWN_SOURCES: Map<string, SourceEntry> = new Map([
  // --- Tier 1 — Western financial wire ---
  ['reuters.com',       { tier: 'tier1', displayName: 'Reuters',          trustScore: 97 }],
  ['bloomberg.com',     { tier: 'tier1', displayName: 'Bloomberg',         trustScore: 96 }],
  ['wsj.com',           { tier: 'tier1', displayName: 'WSJ',               trustScore: 95 }],
  ['ft.com',            { tier: 'tier1', displayName: 'Financial Times',   trustScore: 95 }],
  ['economist.com',     { tier: 'tier1', displayName: 'The Economist',     trustScore: 94 }],
  ['barrons.com',       { tier: 'tier1', displayName: "Barron's",          trustScore: 91 }],
  // --- Tier 1 — Taiwan financial ---
  ['money.udn.com',     { tier: 'tier1', displayName: '經濟日報',           trustScore: 90 }],
  ['ctee.com.tw',       { tier: 'tier1', displayName: '工商時報',           trustScore: 90 }],
  // --- Tier 2 — Western established ---
  ['cnbc.com',          { tier: 'tier2', displayName: 'CNBC',              trustScore: 82 }],
  ['marketwatch.com',   { tier: 'tier2', displayName: 'MarketWatch',       trustScore: 81 }],
  ['finance.yahoo.com', { tier: 'tier2', displayName: 'Yahoo Finance',     trustScore: 78 }],
  ['yahoo.com',         { tier: 'tier2', displayName: 'Yahoo Finance',     trustScore: 75 }],
  ['seekingalpha.com',  { tier: 'tier2', displayName: 'Seeking Alpha',     trustScore: 72 }],
  ['businessinsider.com', { tier: 'tier2', displayName: 'Business Insider', trustScore: 70 }],
  ['thestreet.com',     { tier: 'tier2', displayName: 'The Street',        trustScore: 70 }],
  ['investopedia.com',  { tier: 'tier2', displayName: 'Investopedia',      trustScore: 74 }],
  ['morningstar.com',   { tier: 'tier2', displayName: 'Morningstar',       trustScore: 80 }],
  // --- Tier 2 — Taiwan established ---
  ['news.cnyes.com',    { tier: 'tier2', displayName: '鉅亨網',             trustScore: 76 }],
  ['anue.com.tw',       { tier: 'tier2', displayName: '鉅亨網',             trustScore: 76 }],
  ['moneydj.com',       { tier: 'tier2', displayName: 'MoneyDJ',           trustScore: 75 }],
  ['cna.com.tw',        { tier: 'tier2', displayName: '中央社',             trustScore: 85 }],
  ['technews.tw',       { tier: 'tier2', displayName: '科技新報',           trustScore: 72 }],
  ['ettoday.net',       { tier: 'tier2', displayName: 'ETtoday財經雲',      trustScore: 68 }],
  ['udn.com',           { tier: 'tier2', displayName: '聯合新聞網',          trustScore: 78 }],
  // --- Tier 3 — blogs / user-generated ---
  ['medium.com',        { tier: 'tier3', displayName: 'Medium',            trustScore: 35 }],
  ['substack.com',      { tier: 'tier3', displayName: 'Substack',          trustScore: 33 }],
  ['reddit.com',        { tier: 'tier3', displayName: 'Reddit',            trustScore: 20 }],
  ['twitter.com',       { tier: 'tier3', displayName: 'Twitter / X',       trustScore: 18 }],
  ['x.com',             { tier: 'tier3', displayName: 'Twitter / X',       trustScore: 18 }],
  ['tumblr.com',        { tier: 'tier3', displayName: 'Tumblr',            trustScore: 15 }],
]);

const TIER_EMOJI: Record<SourceTier, SourceInfo['emoji']> = {
  tier1:   '🥇',
  tier2:   '🥈',
  tier3:   '🥉',
  unknown: '❓',
};

const UNKNOWN_ENTRY: SourceEntry = {
  tier:         'unknown',
  displayName:  'Unknown',
  trustScore:   0,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return true when the string looks like an absolute URL. */
function looksLikeUrl(input: string): boolean {
  return /^https?:\/\//i.test(input);
}

/** Strip leading "www." (and similar) from a hostname. */
function stripWww(hostname: string): string {
  return hostname.replace(/^www\./i, '');
}

/**
 * Parse a URL string and return a normalised hostname (no "www."),
 * or null if the URL is invalid.
 */
function extractDomain(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    return stripWww(hostname.toLowerCase());
  } catch {
    return null;
  }
}

/**
 * Try to find an entry by substring-matching the display name
 * (case-insensitive). Used when the caller passes a source name string.
 */
function lookupByName(name: string): [string, SourceEntry] | null {
  const lower = name.toLowerCase();
  for (const [domain, entry] of KNOWN_SOURCES) {
    if (entry.displayName.toLowerCase().includes(lower) || lower.includes(entry.displayName.toLowerCase())) {
      return [domain, entry];
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify a news source from either a URL ("https://reuters.com/…")
 * or a source name string ("Reuters" / "經濟日報").
 */
export function classifyNewsSource(urlOrSourceName: string): SourceInfo {
  const input = urlOrSourceName.trim();

  if (input.length === 0) {
    return buildInfo('', UNKNOWN_ENTRY);
  }

  // --- URL path ---
  if (looksLikeUrl(input)) {
    const domain = extractDomain(input);
    if (domain === null) {
      return buildInfo('', UNKNOWN_ENTRY);
    }
    // Try direct match first, then walk up sub-domains
    const entry = lookupDomain(domain);
    return buildInfo(domain, entry ?? UNKNOWN_ENTRY);
  }

  // --- Source name path ---
  const match = lookupByName(input);
  if (match !== null) {
    const [domain, entry] = match;
    return buildInfo(domain, entry);
  }
  return buildInfo('', UNKNOWN_ENTRY);
}

/**
 * Look up a domain in KNOWN_SOURCES. If not found directly, try stripping
 * sub-domain prefixes one level at a time (e.g. "finance.yahoo.com" → match
 * "finance.yahoo.com" first, then "yahoo.com").
 */
function lookupDomain(domain: string): SourceEntry | undefined {
  const direct = KNOWN_SOURCES.get(domain);
  if (direct !== undefined) return direct;

  // Walk up: "a.b.c" → "b.c"
  const parts = domain.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const shorter = parts.slice(i).join('.');
    const found = KNOWN_SOURCES.get(shorter);
    if (found !== undefined) return found;
  }
  return undefined;
}

function buildInfo(domain: string, entry: SourceEntry): SourceInfo {
  return {
    source:     entry.displayName,
    domain,
    tier:       entry.tier,
    emoji:      TIER_EMOJI[entry.tier],
    trustScore: entry.trustScore,
  };
}

/**
 * Localised label for a tier.
 *   zh-TW: tier1 → '主流財經', tier2 → '財經媒體', tier3 → '一般', unknown → '未知'
 *   en-US: tier1 → 'Major',   tier2 → 'Mainstream', tier3 → 'Other', unknown → 'Unknown'
 */
export function tierLabel(tier: SourceTier, locale: 'zh-TW' | 'en-US' = 'zh-TW'): string {
  if (locale === 'en-US') {
    const EN: Record<SourceTier, string> = {
      tier1:   'Major',
      tier2:   'Mainstream',
      tier3:   'Other',
      unknown: 'Unknown',
    };
    return EN[tier];
  }
  const ZH: Record<SourceTier, string> = {
    tier1:   '主流財經',
    tier2:   '財經媒體',
    tier3:   '一般',
    unknown: '未知',
  };
  return ZH[tier];
}
