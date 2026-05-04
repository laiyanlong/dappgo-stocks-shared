import {
  relativeTimeShort,
  relativeTimeLong,
  humanizeDuration,
  isSameLocalDay,
} from './time-formatter';

// Fixed reference: 2026-04-15 Wednesday 14:30:00 local
// We build `now` via explicit constructor so tests are timezone-agnostic.
const NOW = new Date(2026, 3, 15, 14, 30, 0); // month is 0-indexed

// ---------------------------------------------------------------------------
// isSameLocalDay
// ---------------------------------------------------------------------------
describe('isSameLocalDay', () => {
  it('same instant → true', () => {
    expect(isSameLocalDay(NOW, new Date(NOW))).toBe(true);
  });
  it('same day different time → true', () => {
    expect(isSameLocalDay(NOW, new Date(2026, 3, 15, 0, 0, 0))).toBe(true);
  });
  it('adjacent days → false', () => {
    expect(isSameLocalDay(NOW, new Date(2026, 3, 14, 23, 59, 59))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// humanizeDuration
// ---------------------------------------------------------------------------
describe('humanizeDuration', () => {
  it('< 1s zh-TW', () => expect(humanizeDuration(500)).toBe('不到 1 秒'));
  it('< 1s en-US', () => expect(humanizeDuration(500, 'en-US')).toBe('less than 1s'));
  it('exact 1 minute zh-TW', () => expect(humanizeDuration(60_000)).toBe('1 分鐘'));
  it('exact 1 minute en-US', () => expect(humanizeDuration(60_000, 'en-US')).toBe('1m'));
  it('1 hour zh-TW', () => expect(humanizeDuration(3_600_000)).toBe('1 小時'));
  it('1 hour en-US', () => expect(humanizeDuration(3_600_000, 'en-US')).toBe('1h'));
  it('2 days zh-TW', () => expect(humanizeDuration(2 * 86_400_000)).toBe('2 天'));
  it('2 days en-US', () => expect(humanizeDuration(2 * 86_400_000, 'en-US')).toBe('2d'));
  it('handles negative ms (absolute value)', () => {
    expect(humanizeDuration(-60_000)).toBe('1 分鐘');
  });
});

// ---------------------------------------------------------------------------
// relativeTimeShort
// ---------------------------------------------------------------------------
describe('relativeTimeShort', () => {
  it('null → fallback zh-TW', () => {
    expect(relativeTimeShort(null, NOW)).toBe('無效日期');
  });
  it('invalid string → fallback en-US', () => {
    expect(relativeTimeShort('not-a-date', NOW, 'en-US')).toBe('Invalid date');
  });

  // zh-TW branches
  it('< 1 min → 剛剛', () => {
    const iso = new Date(NOW.getTime() - 30_000).toISOString();
    expect(relativeTimeShort(iso, NOW)).toBe('剛剛');
  });
  it('5 min ago zh-TW', () => {
    const iso = new Date(NOW.getTime() - 5 * 60_000).toISOString();
    expect(relativeTimeShort(iso, NOW)).toBe('5 分鐘前');
  });
  it('3 hours ago zh-TW', () => {
    const iso = new Date(NOW.getTime() - 3 * 3_600_000).toISOString();
    expect(relativeTimeShort(iso, NOW)).toBe('3 小時前');
  });
  it('2 days ago zh-TW', () => {
    const iso = new Date(NOW.getTime() - 2 * 86_400_000).toISOString();
    expect(relativeTimeShort(iso, NOW)).toBe('2 天前');
  });
  it('same year, > 7 days zh-TW → M/D form', () => {
    // 2026-01-10 is within same year but > 7 days ago
    const iso = new Date(2026, 0, 10, 10, 0, 0).toISOString();
    expect(relativeTimeShort(iso, NOW)).toBe('1/10');
  });
  it('previous year zh-TW → YYYY-MM-DD', () => {
    const iso = new Date(2025, 3, 15, 10, 0, 0).toISOString();
    expect(relativeTimeShort(iso, NOW)).toBe('2025-04-15');
  });

  // en-US branches
  it('< 1 min → just now en-US', () => {
    const iso = new Date(NOW.getTime() - 30_000).toISOString();
    expect(relativeTimeShort(iso, NOW, 'en-US')).toBe('just now');
  });
  it('5m ago en-US', () => {
    const iso = new Date(NOW.getTime() - 5 * 60_000).toISOString();
    expect(relativeTimeShort(iso, NOW, 'en-US')).toBe('5m ago');
  });
  it('3h ago en-US', () => {
    const iso = new Date(NOW.getTime() - 3 * 3_600_000).toISOString();
    expect(relativeTimeShort(iso, NOW, 'en-US')).toBe('3h ago');
  });
  it('2d ago en-US', () => {
    const iso = new Date(NOW.getTime() - 2 * 86_400_000).toISOString();
    expect(relativeTimeShort(iso, NOW, 'en-US')).toBe('2d ago');
  });
  it('same year > 7 days en-US → "Apr 15"', () => {
    const iso = new Date(2026, 0, 5, 10, 0, 0).toISOString();
    expect(relativeTimeShort(iso, NOW, 'en-US')).toBe('Jan 5');
  });
  it('previous year en-US → "Apr 15 2025"', () => {
    const iso = new Date(2025, 3, 15, 10, 0, 0).toISOString();
    expect(relativeTimeShort(iso, NOW, 'en-US')).toBe('Apr 15 2025');
  });
});

// ---------------------------------------------------------------------------
// relativeTimeLong
// ---------------------------------------------------------------------------
describe('relativeTimeLong', () => {
  it('null → fallback zh-TW', () => {
    expect(relativeTimeLong(null, NOW)).toBe('無效日期');
  });

  // zh-TW branches
  it('today zh-TW', () => {
    const iso = new Date(2026, 3, 15, 9, 0, 0).toISOString();
    expect(relativeTimeLong(iso, NOW)).toBe('今天 09:00');
  });
  it('yesterday zh-TW', () => {
    const iso = new Date(2026, 3, 14, 9, 0, 0).toISOString();
    expect(relativeTimeLong(iso, NOW)).toBe('昨天 09:00');
  });
  it('within 7 days zh-TW → weekday', () => {
    // 2026-04-13 is Monday (週一)
    const iso = new Date(2026, 3, 13, 14, 30, 0).toISOString();
    expect(relativeTimeLong(iso, NOW)).toBe('週一 14:30');
  });
  it('same year > 7 days zh-TW → M/D HH:MM', () => {
    const iso = new Date(2026, 0, 10, 9, 5, 0).toISOString();
    expect(relativeTimeLong(iso, NOW)).toBe('1/10 09:05');
  });
  it('previous year zh-TW → YYYY/M/D', () => {
    const iso = new Date(2025, 3, 10, 9, 0, 0).toISOString();
    expect(relativeTimeLong(iso, NOW)).toBe('2025/4/10');
  });

  // en-US branches
  it('today en-US', () => {
    const iso = new Date(2026, 3, 15, 9, 0, 0).toISOString();
    expect(relativeTimeLong(iso, NOW, 'en-US')).toBe('Today 9:00 AM');
  });
  it('yesterday en-US', () => {
    const iso = new Date(2026, 3, 14, 14, 0, 0).toISOString();
    expect(relativeTimeLong(iso, NOW, 'en-US')).toBe('Yesterday 2:00 PM');
  });
  it('within 7 days en-US → weekday', () => {
    // 2026-04-13 is Monday
    const iso = new Date(2026, 3, 13, 14, 30, 0).toISOString();
    expect(relativeTimeLong(iso, NOW, 'en-US')).toBe('Mon 2:30 PM');
  });
  it('same year > 7 days en-US → "Apr 15 2:30 PM"', () => {
    const iso = new Date(2026, 0, 10, 14, 30, 0).toISOString();
    expect(relativeTimeLong(iso, NOW, 'en-US')).toBe('Jan 10 2:30 PM');
  });
  it('previous year en-US → "Apr 10 2025"', () => {
    const iso = new Date(2025, 3, 10, 9, 0, 0).toISOString();
    expect(relativeTimeLong(iso, NOW, 'en-US')).toBe('Apr 10 2025');
  });
});
