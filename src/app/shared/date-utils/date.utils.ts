export type ISODateString = string; // Alias ​​for readability - "YYYY-MM-DD"

export function isoDateToLocaleString(iso: ISODateString | undefined, locale?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale);
}

export function dateToCalendarKey(date: Date): number {
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}

export function localNowAsUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
