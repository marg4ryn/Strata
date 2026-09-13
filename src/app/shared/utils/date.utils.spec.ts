import { dateToCalendarKey, localNowAsUtcMidnight } from './date.utils';

function setFakeLocalTime(date: Date): void {
  vi.useFakeTimers();
  vi.setSystemTime(date);
}

describe('dateToCalendarKey', () => {
  it('encodes year, month, and day as a comparable number', () => {
    const date = new Date(Date.UTC(2026, 6, 18));
    expect(dateToCalendarKey(date)).toBe(20260718);
  });

  it('encodes January correctly (month index 0)', () => {
    const date = new Date(Date.UTC(2026, 0, 1));
    expect(dateToCalendarKey(date)).toBe(20260101);
  });

  it('encodes December correctly (month index 11)', () => {
    const date = new Date(Date.UTC(2026, 11, 31));
    expect(dateToCalendarKey(date)).toBe(20261231);
  });

  it('ignores time-of-day component', () => {
    const midnight = new Date(Date.UTC(2026, 6, 18, 0, 0, 0));
    const laterSameDay = new Date(Date.UTC(2026, 6, 18, 23, 59, 59));
    expect(dateToCalendarKey(midnight)).toBe(dateToCalendarKey(laterSameDay));
  });

  it('produces keys that sort correctly for comparison', () => {
    const earlier = new Date(Date.UTC(2026, 6, 17));
    const later = new Date(Date.UTC(2026, 6, 18));
    expect(dateToCalendarKey(earlier)).toBeLessThan(dateToCalendarKey(later));
  });

  it('produces different keys across year boundaries', () => {
    const endOfYear = new Date(Date.UTC(2025, 11, 31));
    const startOfNextYear = new Date(Date.UTC(2026, 0, 1));
    expect(dateToCalendarKey(endOfYear)).toBeLessThan(dateToCalendarKey(startOfNextYear));
  });

  it('returns NaN for an invalid date', () => {
    const invalid = new Date('not-a-date');
    expect(Number.isNaN(dateToCalendarKey(invalid))).toBe(true);
  });
});

describe('localNowAsUtcMidnight', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a Date at UTC midnight for the current local date', () => {
    setFakeLocalTime(new Date(2026, 6, 18, 15, 30, 45));

    const res = localNowAsUtcMidnight();

    expect(res.getUTCFullYear()).toBe(2026);
    expect(res.getUTCMonth()).toBe(6);
    expect(res.getUTCDate()).toBe(18);
    expect(res.getUTCHours()).toBe(0);
    expect(res.getUTCMinutes()).toBe(0);
    expect(res.getUTCSeconds()).toBe(0);
    expect(res.getUTCMilliseconds()).toBe(0);
  });

  it('reflects a different local date at a different fixed time', () => {
    setFakeLocalTime(new Date(2026, 0, 1, 0, 5, 0));
    const res = localNowAsUtcMidnight();
    expect(dateToCalendarKey(res)).toBe(20260101);
  });
});
