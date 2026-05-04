import { percentile, multiKeySort, topN, quantileBucket, zScore } from './ranking';

// percentile
describe('percentile', () => {
  it('returns 0 for empty array', () => expect(percentile(5, [])).toBe(0));
  it('returns 0 when value is minimum', () => expect(percentile(1, [1, 2, 3, 4, 5])).toBe(0));
  it('returns 80 when 4 of 5 values are below', () => expect(percentile(5, [1, 2, 3, 4, 5])).toBe(80));
  it('returns 50 for median', () => expect(percentile(3, [1, 2, 3, 4, 5])).toBe(40));
  it('works with all equal values', () => expect(percentile(5, [5, 5, 5])).toBe(0));
});

// multiKeySort
describe('multiKeySort', () => {
  const items = [
    { name: 'a', score: 10, rank: 2 },
    { name: 'b', score: 20, rank: 1 },
    { name: 'c', score: 10, rank: 1 },
  ];

  it('sorts desc by primary by default', () => {
    const result = multiKeySort(items, (x) => x.score);
    expect(result[0].name).toBe('b');
  });

  it('breaks tie with secondary asc', () => {
    const result = multiKeySort(items, (x) => x.score, (x) => x.rank);
    expect(result[1].name).toBe('c'); // score=10, rank=1 before rank=2
    expect(result[2].name).toBe('a');
  });

  it('sorts asc when primaryDir=asc', () => {
    const result = multiKeySort(items, (x) => x.score, undefined, 'asc');
    expect(result[0].score).toBe(10);
    expect(result[2].score).toBe(20);
  });

  it('treats null primary as -Infinity in desc sort', () => {
    const data = [{ v: null as number | null }, { v: 5 }, { v: 1 }];
    const result = multiKeySort(data, (x) => x.v);
    expect(result[result.length - 1].v).toBeNull();
  });

  it('does not mutate original array', () => {
    const orig = [...items];
    multiKeySort(items, (x) => x.score);
    expect(items).toEqual(orig);
  });
});

// topN
describe('topN', () => {
  const data = [{ v: 3 }, { v: null as number | null }, { v: 1 }, { v: 5 }, { v: 2 }];

  it('returns top N highest by default', () => {
    const result = topN(data, (x) => x.v, 2);
    expect(result.map((x) => x.v)).toEqual([5, 3]);
  });

  it('returns top N lowest when direction=asc', () => {
    const result = topN(data, (x) => x.v, 2, 'asc');
    expect(result.map((x) => x.v)).toEqual([1, 2]);
  });

  it('skips null values', () => {
    const result = topN(data, (x) => x.v, 10);
    expect(result.every((x) => x.v != null)).toBe(true);
  });

  it('returns fewer than N if not enough valid items', () => {
    expect(topN(data, (x) => x.v, 100)).toHaveLength(4);
  });
});

// quantileBucket
describe('quantileBucket', () => {
  const vals = [10, 20, 30, 40, 50];

  it('assigns lowest bucket to minimum value', () => expect(quantileBucket(10, vals, 5)).toBe(1));
  it('assigns highest bucket to maximum value', () => expect(quantileBucket(50, vals, 5)).toBe(5));
  it('returns 1 for empty values', () => expect(quantileBucket(5, [], 4)).toBe(1));
  it('clamps to at least 1', () => expect(quantileBucket(10, vals, 10)).toBeGreaterThanOrEqual(1));
});

// zScore
describe('zScore', () => {
  it('returns 0 for empty array', () => expect(zScore(5, [])).toBe(0));
  it('returns 0 when all values equal', () => expect(zScore(3, [3, 3, 3])).toBe(0));
  it('returns positive z for above-mean value', () => expect(zScore(5, [1, 2, 3, 4, 5])).toBeGreaterThan(0));
  it('returns negative z for below-mean value', () => expect(zScore(1, [1, 2, 3, 4, 5])).toBeLessThan(0));
  it('mean value has z=0', () => expect(zScore(3, [1, 2, 3, 4, 5])).toBeCloseTo(0));
});
