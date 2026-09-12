export type ISODateString = string; // "YYYY-MM-DD"
export type ISOLocalDateTime = string; // "YYYY-MM-DDTHH:mm:ss.SSS"

export function dateToCalendarKey(date: Date): number {
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}

export function localNowAsUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
