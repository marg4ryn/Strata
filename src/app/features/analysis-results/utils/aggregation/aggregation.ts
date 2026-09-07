import type { ISODateString } from '@app/shared/date-utils/date.utils';
import type {
  LineChartAggregation,
  LineChartDataPoint,
  LineChartMode,
} from '../../ui/line-chart/line-chart.component';

const MS_PER_DAY = 86_400_000;

export function aggregatePoints(
  points: LineChartDataPoint[],
  aggregation: LineChartAggregation,
  mode: LineChartMode,
): Map<string, number> {
  const buckets = new Map<string, number>();
  const biweekAnchor = aggregation === 'biweek' ? getBiweekAnchor(points) : undefined;

  for (const point of points) {
    const key = getBucketKey(point.date, aggregation, biweekAnchor);
    const prev = buckets.get(key) ?? 0;
    const value = mode === 'sum' ? prev + point.value : Math.max(prev, point.value);
    buckets.set(key, value);
  }

  return buckets;
}

function getBiweekAnchor(points: LineChartDataPoint[]): number | undefined {
  if (points.length === 0) return undefined;
  const earliest = points.reduce((min, p) => (p.date < min ? p.date : min), points[0].date);
  return getWeekStart(earliest).getTime();
}

function getWeekStart(date: ISODateString): Date {
  const d = new Date(date + 'T00:00:00Z');
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

function getBucketKey(
  date: ISODateString,
  mode: LineChartAggregation,
  biweekAnchor?: number,
): string {
  switch (mode) {
    case 'day':
      return date;

    case 'week':
      return getWeekStart(date).toISOString().slice(0, 10);

    case 'biweek': {
      const anchor = biweekAnchor!;
      const d = new Date(date + 'T00:00:00Z');
      const daysSinceAnchor = Math.floor((d.getTime() - anchor) / MS_PER_DAY);
      const biweekIndex = Math.floor(daysSinceAnchor / 14);
      const bucketStart = new Date(anchor + biweekIndex * 14 * MS_PER_DAY);
      return bucketStart.toISOString().slice(0, 10);
    }

    case 'month':
      return date.slice(0, 7);

    default:
      mode satisfies never;
      return '';
  }
}
