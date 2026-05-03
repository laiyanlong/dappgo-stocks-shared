/**
 * Plain-language explanations of each verdict code, for users who don't
 * yet know what BUY / WATCH / etc. mean operationally. Surface this on
 * the stock detail page next to the verdict badge so the meaning is
 * one tap away.
 *
 * Pure data — no React or theme dependency. Mirror in TW + US apps.
 */

export interface VerdictExplain {
  /** One-sentence operational meaning of the verdict. */
  meaning: string;
  /** Suggested follow-up action a retail investor might consider. */
  action: string;
  /** Generic risk band. */
  risk: 'low' | 'medium' | 'high' | 'unknown';
}

const EXPLAIN: Record<string, VerdictExplain> = {
  BUY: {
    meaning: '多項偏多訊號同時出現，技術面具備買進條件',
    action: '可分批進場；設定下方支撐為停損點',
    risk: 'medium',
  },
  HOLD: {
    meaning: '多頭訊號優於空頭，可續抱已有部位',
    action: '不必急於加碼或減碼，留意趨勢延續',
    risk: 'low',
  },
  WATCH: {
    meaning: '訊號中性，方向尚未明確',
    action: '觀望為宜；待趨勢成形再行動',
    risk: 'low',
  },
  AVOID: {
    meaning: '空頭訊號浮現，新進場風險偏高',
    action: '暫不買進；已持有者留意停損',
    risk: 'high',
  },
  SELL: {
    meaning: '多項空頭訊號，技術面建議降低部位',
    action: '考慮分批減碼或停損出場',
    risk: 'high',
  },
  HOT: {
    meaning: '板塊強勢，多檔個股漲幅同步擴大',
    action: '輪動行情可關注領漲標的',
    risk: 'medium',
  },
  WARM: {
    meaning: '板塊偏多，整體氛圍正面但未過熱',
    action: '挑強勢股長線持有為宜',
    risk: 'low',
  },
  NEUTRAL: {
    meaning: '板塊中性，無明顯趨勢',
    action: '個股操作為主，不宜押板塊輪動',
    risk: 'low',
  },
  COOL: {
    meaning: '板塊偏空，買盤動能不足',
    action: '減少新部位曝險，等待止跌訊號',
    risk: 'medium',
  },
  COLD: {
    meaning: '板塊弱勢，多檔個股同步下跌',
    action: '空手觀望或反向操作；避免接刀',
    risk: 'high',
  },
};

export function explainVerdict(code: string): VerdictExplain | null {
  return EXPLAIN[code] ?? null;
}
