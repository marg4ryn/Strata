import { isoDateToLocaleString, dateToCalendarKey, localNowAsUtcMidnight } from './date.utils';

describe('isoDateToLocaleString', () => {
  it('returns empty string for undefined', () => {
    expect(isoDateToLocaleString(undefined)).toBe('');
  });

  it('returns empty string for an empty string', () => {
    expect(isoDateToLocaleString('')).toBe('');
  });

  it('formats a valid ISO date using local time', () => {
    const result = isoDateToLocaleString('2026-07-18');
    const expected = new Date(2026, 6, 18).toLocaleDateString();
    expect(result).toBe(expected);
  });

  it('never converts through UTC internally', () => {
    const toISOSpy = vi.spyOn(Date.prototype, 'toISOString');
    isoDateToLocaleString('2026-01-01');
    expect(toISOSpy).not.toHaveBeenCalled();
    toISOSpy.mockRestore();
  });

  it('handles single-digit month and day correctly', () => {
    const result = isoDateToLocaleString('2026-03-05');
    const expected = new Date(2026, 2, 5).toLocaleDateString();
    expect(result).toBe(expected);
  });

  it('handles leap year date correctly', () => {
    const result = isoDateToLocaleString('2024-02-29');
    const expected = new Date(2024, 1, 29).toLocaleDateString();
    expect(result).toBe(expected);
  });
});

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
});

describe('localNowAsUtcMidnight', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a Date at UTC midnight for the current local date', () => {
    const fixedNow = new Date(2026, 6, 18, 15, 30, 45);
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const result = localNowAsUtcMidnight();

    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(6);
    expect(result.getUTCDate()).toBe(18);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it('is comparable via dateToCalendarKey with dates from valueAsDate-style UTC midnight', () => {
    const fixedNow = new Date(2026, 6, 18, 9, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const today = localNowAsUtcMidnight();
    const sameDayFromInput = new Date(Date.UTC(2026, 6, 18));

    expect(dateToCalendarKey(today)).toBe(dateToCalendarKey(sameDayFromInput));
  });

  it('reflects a different local date at a different fixed time', () => {
    const fixedNow = new Date(2026, 0, 1, 0, 5, 0);
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const result = localNowAsUtcMidnight();

    expect(dateToCalendarKey(result)).toBe(20260101);
  });
});
