import { summarizeMarket, TickerEntry } from './ticker-aggregate';

const mk = (
  symbol: string,
  verdict: string,
  change: number,
  name = symbol,
): TickerEntry => ({
  symbol,
  name,
  price_change_pct: change,
  signals: { verdict },
});

describe('summarizeMarket', () => {
  it('returns zero counts and null mover for empty input', () => {
    expect(summarizeMarket({})).toEqual({
      bullish: 0,
      bearish: 0,
      neutral: 0,
      topMover: null,
    });
  });

  it('counts all-bullish tickers', () => {
    const result = summarizeMarket({
      AAPL: mk('AAPL', 'BUY', 1.2, 'Apple'),
      MSFT: mk('MSFT', 'HOLD', 0.4, 'Microsoft'),
      GOOG: mk('GOOG', 'BUY', 2.3, 'Alphabet'),
    });
    expect(result.bullish).toBe(3);
    expect(result.bearish).toBe(0);
    expect(result.neutral).toBe(0);
  });

  it('counts all-bearish tickers', () => {
    const result = summarizeMarket({
      X: mk('X', 'SELL', -1.0),
      Y: mk('Y', 'AVOID', -0.3),
    });
    expect(result.bearish).toBe(2);
    expect(result.bullish).toBe(0);
    expect(result.neutral).toBe(0);
  });

  it('counts a mixed bag of verdicts', () => {
    const result = summarizeMarket({
      A: mk('A', 'BUY', 0.5),
      B: mk('B', 'WATCH', 0.0),
      C: mk('C', 'AVOID', -0.7),
      D: mk('D', 'HOLD', 0.2),
      E: mk('E', 'SELL', -1.1),
    });
    expect(result.bullish).toBe(2);
    expect(result.bearish).toBe(2);
    expect(result.neutral).toBe(1);
  });

  it('chooses the ticker with the largest absolute price change as topMover', () => {
    const result = summarizeMarket({
      A: mk('A', 'BUY', 1.5),
      B: mk('B', 'SELL', -4.7, 'Big Loser'),
      C: mk('C', 'HOLD', 2.0),
    });
    expect(result.topMover).toEqual({
      symbol: 'B',
      name: 'Big Loser',
      change: -4.7,
    });
  });

  it('keeps the first ticker when absolute changes tie', () => {
    const result = summarizeMarket({
      First: mk('First', 'BUY', 2.0),
      Second: mk('Second', 'SELL', -2.0),
    });
    expect(result.topMover?.symbol).toBe('First');
  });

  it('ignores unknown verdicts but still considers them for topMover', () => {
    const result = summarizeMarket({
      Weird: mk('Weird', 'YOLO', 9.9),
      Norm: mk('Norm', 'BUY', 1.0),
    });
    expect(result.bullish).toBe(1);
    expect(result.bearish).toBe(0);
    expect(result.neutral).toBe(0);
    expect(result.topMover?.symbol).toBe('Weird');
  });
});
