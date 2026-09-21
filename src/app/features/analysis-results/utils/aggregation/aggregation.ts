import type { ISODateString } from '@app/shared/utils';

export type ChartAggregationMode = 'sum' | 'max';

export type ChartAggregationPeriod = 'day' | 'week' | 'biweek' | 'month';

export interface ChartDataPoint {
  date: ISODateString;
  value: number;
}

export interface ChartSeries {
  legendLabelKey: string;
  tooltipLabelKey: string;
  color: string;
  points: ChartDataPoint[];
}

const MS_PER_DAY = 86_400_000;
const MIDNIGHT_UTC = 'T00:00:00Z';

export function aggregatePoints(
  points: ChartDataPoint[],
  period: ChartAggregationPeriod,
  mode: ChartAggregationMode = 'sum',
): Map<string, number> {
  const buckets = new Map<string, number>();
  const biweekAnchor = period === 'biweek' ? getBiweekAnchor(points) : undefined;

  for (const point of points) {
    const key = getBucketKey(point.date, period, biweekAnchor);
    const prev = buckets.get(key) ?? 0;
    const value = mode === 'max' ? Math.max(prev, point.value) : prev + point.value;
    buckets.set(key, value);
  }

  return buckets;
}

function getBiweekAnchor(points: ChartDataPoint[]): number | undefined {
  if (points.length === 0) return undefined;
  const earliest = points.reduce((min, p) => (p.date < min ? p.date : min), points[0].date);
  return getWeekStart(earliest).getTime();
}

function getWeekStart(date: ISODateString): Date {
  const d = new Date(date + MIDNIGHT_UTC);
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

function getBucketKey(
  date: ISODateString,
  period: ChartAggregationPeriod,
  biweekAnchor?: number,
): string {
  switch (period) {
    case 'day':
      return date;

    case 'week':
      return getWeekStart(date).toISOString().slice(0, 10);

    case 'biweek': {
      const anchor = biweekAnchor!;
      const d = new Date(date + MIDNIGHT_UTC);
      const daysSinceAnchor = Math.floor((d.getTime() - anchor) / MS_PER_DAY);
      const biweekIndex = Math.floor(daysSinceAnchor / 14);
      const bucketStart = new Date(anchor + biweekIndex * 14 * MS_PER_DAY);
      return bucketStart.toISOString().slice(0, 10);
    }

    case 'month':
      return date.slice(0, 7);

    default:
      period satisfies never;
      return '';
  }
}

export function formatBucketLabel(
  key: string,
  period: ChartAggregationPeriod,
  lang: string,
): string {
  if (period === 'month') {
    const [year, month] = key.split('-');
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(lang, {
      month: 'long',
      year: 'numeric',
    });
  }

  return new Date(key + MIDNIGHT_UTC).toLocaleDateString(lang, {
    day: '2-digit',
    month: 'long',
  });
}
