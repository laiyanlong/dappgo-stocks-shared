export type Regime = 'risk_on' | 'risk_off' | 'mixed' | 'neutral' | 'unknown';
export type VolRegime = 'calm' | 'choppy' | 'high';
export type TrendDir = 'up' | 'down' | 'sideways';

export interface RegimeData {
  regime?: Regime | null;
  taiex_trend?: TrendDir | null;
  spy_trend?: TrendDir | null;
  taiex_above_50ma?: boolean | null;
  taiex_above_200ma?: boolean | null;
  spy_above_50ma?: boolean | null;
  spy_above_200ma?: boolean | null;
  advance_decline_ratio?: number | null;
  breadth_score?: number | null;
  vol_regime?: VolRegime | null;
  sector_dispersion?: number | null;
  rationale?: string | null;
}

export interface RegimeDisplay {
  emoji: string;
  label: string;
  tone: 'positive' | 'mild_positive' | 'neutral' | 'mild_negative' | 'negative';
}

type LocaleKey = 'zh-TW' | 'en-US';

interface RegimeConfig {
  emoji: string;
  labels: Record<LocaleKey, string>;
  tone: RegimeDisplay['tone'];
}

const REGIME_CONFIG: Record<Regime, RegimeConfig> = {
  risk_on:  { emoji: '🟢', labels: { 'zh-TW': '風險偏好', 'en-US': 'Risk On'  }, tone: 'positive'      },
  mixed:    { emoji: '🟡', labels: { 'zh-TW': '盤整',     'en-US': 'Mixed'    }, tone: 'mild_negative'  },
  neutral:  { emoji: '⚪', labels: { 'zh-TW': '中性',     'en-US': 'Neutral'  }, tone: 'neutral'        },
  risk_off: { emoji: '🔴', labels: { 'zh-TW': '風險規避', 'en-US': 'Risk Off' }, tone: 'negative'       },
  unknown:  { emoji: '—',  labels: { 'zh-TW': '資料不足', 'en-US': 'Unknown'  }, tone: 'neutral'        },
};

const VOL_LABELS: Record<VolRegime, Record<LocaleKey, string>> = {
  calm:   { 'zh-TW': '低波動', 'en-US': 'Calm'   },
  choppy: { 'zh-TW': '震盪',   'en-US': 'Choppy' },
  high:   { 'zh-TW': '高波動', 'en-US': 'High'   },
};

export function regimeDisplay(
  r: Regime | null | undefined,
  locale: LocaleKey = 'zh-TW',
): RegimeDisplay {
  const key: Regime = r ?? 'unknown';
  const cfg = REGIME_CONFIG[key];
  return { emoji: cfg.emoji, label: cfg.labels[locale], tone: cfg.tone };
}

export function volRegimeLabel(
  v: VolRegime | null | undefined,
  locale: LocaleKey = 'zh-TW',
): string {
  if (v == null) return locale === 'zh-TW' ? '未知' : 'Unknown';
  return VOL_LABELS[v][locale];
}

export function trendArrow(t: TrendDir | null | undefined): '↑' | '↓' | '→' | '—' {
  if (t == null) return '—';
  if (t === 'up') return '↑';
  if (t === 'down') return '↓';
  return '→';
}

export function isBenchmarkAbove50(d: RegimeData): boolean | null {
  if (d.taiex_above_50ma != null) return d.taiex_above_50ma;
  if (d.spy_above_50ma != null) return d.spy_above_50ma;
  return null;
}

export function isBenchmarkAbove200(d: RegimeData): boolean | null {
  if (d.taiex_above_200ma != null) return d.taiex_above_200ma;
  if (d.spy_above_200ma != null) return d.spy_above_200ma;
  return null;
}

export function benchmarkTrend(d: RegimeData): TrendDir | null {
  if (d.taiex_trend != null) return d.taiex_trend;
  if (d.spy_trend != null) return d.spy_trend;
  return null;
}
