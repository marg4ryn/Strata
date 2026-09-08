import type {
  LineChartDataPoint,
  LineChartAggregationMode,
  LineChartAggregationPeriod,
} from '../../ui/charts/line-chart/line-chart.component';
import { aggregatePoints } from './aggregation';

function point(date: string, value: number): LineChartDataPoint {
  return { date, value };
}

describe('aggregatePoints', () => {
  describe('period: day', () => {
    it('creates a separate bucket for each day', () => {
      const points = [point('2024-01-01', 5), point('2024-01-02', 3)];
      const result = aggregatePoints(points, 'day', 'sum');
      expect(result.size).toBe(2);
      expect(result.get('2024-01-01')).toBe(5);
      expect(result.get('2024-01-02')).toBe(3);
    });

    it('does not create buckets for days with no data', () => {
      const points = [point('2024-01-01', 5), point('2024-01-03', 3)];
      const result = aggregatePoints(points, 'day', 'sum');
      expect(result.size).toBe(2);
      expect(result.get('2024-01-02')).toBeUndefined();
    });
  });

  describe('period: week', () => {
    it('maps a midweek date to Monday of that week', () => {
      const points = [point('2024-01-03', 10)];
      const result = aggregatePoints(points, 'week', 'sum');
      expect(result.get('2024-01-01')).toBe(10);
    });

    it('maps Sunday to Monday of the same week', () => {
      const points = [point('2024-01-07', 7)];
      const result = aggregatePoints(points, 'week', 'sum');
      expect(result.get('2024-01-01')).toBe(7);
    });

    it('maps Monday onto itself', () => {
      const points = [point('2024-01-01', 4)];
      const result = aggregatePoints(points, 'week', 'sum');
      expect(result.get('2024-01-01')).toBe(4);
    });

    it('groups points from different days of the same week into one bucket', () => {
      const points = [point('2024-01-01', 1), point('2024-01-03', 2), point('2024-01-07', 3)];
      const result = aggregatePoints(points, 'week', 'sum');
      expect(result.size).toBe(1);
      expect(result.get('2024-01-01')).toBe(6);
    });

    it('puts points from adjacent weeks into separate buckets', () => {
      const points = [point('2024-01-07', 1), point('2024-01-08', 2)];
      const result = aggregatePoints(points, 'week', 'sum');
      expect(result.size).toBe(2);
      expect(result.get('2024-01-01')).toBe(1);
      expect(result.get('2024-01-08')).toBe(2);
    });

    it('handles the year boundary correctly', () => {
      const points = [point('2023-12-31', 5)];
      const result = aggregatePoints(points, 'week', 'sum');
      expect(result.get('2023-12-25')).toBe(5);
    });
  });

  describe('period: biweek', () => {
    it("anchors the first bucket to Monday of the earliest point's week", () => {
      const points = [point('2024-01-07', 3), point('2024-01-10', 5), point('2024-01-03', 2)];
      const result = aggregatePoints(points, 'biweek', 'sum');
      expect(result.size).toBe(1);
      expect(result.get('2024-01-01')).toBe(10);
    });

    it('groups dates within 14 days from the anchor into one bucket', () => {
      const points = [point('2024-01-01', 1), point('2024-01-05', 2), point('2024-01-14', 3)];
      const result = aggregatePoints(points, 'biweek', 'sum');
      expect(result.size).toBe(1);
      expect(result.get('2024-01-01')).toBe(6);
    });

    it('opens a new bucket once the 14-day window is exceeded', () => {
      const points = [point('2024-01-01', 1), point('2024-01-15', 2)];
      const result = aggregatePoints(points, 'biweek', 'sum');
      expect(result.size).toBe(2);
      expect(result.get('2024-01-01')).toBe(1);
      expect(result.get('2024-01-15')).toBe(2);
    });

    it('correctly handles multiple consecutive two-week windows', () => {
      const points = [point('2024-01-01', 1), point('2024-01-16', 2), point('2024-01-30', 3)];
      const result = aggregatePoints(points, 'biweek', 'sum');
      expect(result.size).toBe(3);
      expect(result.get('2024-01-01')).toBe(1);
      expect(result.get('2024-01-15')).toBe(2);
      expect(result.get('2024-01-29')).toBe(3);
    });
  });

  describe('period: month', () => {
    it('groups all days of the same month into one bucket', () => {
      const points = [point('2024-01-01', 1), point('2024-01-15', 2), point('2024-01-31', 3)];
      const result = aggregatePoints(points, 'month', 'sum');
      expect(result.size).toBe(1);
      expect(result.get('2024-01')).toBe(6);
    });

    it('puts points from different months into separate buckets', () => {
      const points = [point('2024-01-31', 1), point('2024-02-01', 2)];
      const result = aggregatePoints(points, 'month', 'sum');
      expect(result.size).toBe(2);
      expect(result.get('2024-01')).toBe(1);
      expect(result.get('2024-02')).toBe(2);
    });

    it('handles the year boundary correctly', () => {
      const points = [point('2023-12-31', 1), point('2024-01-01', 2)];
      const result = aggregatePoints(points, 'month', 'sum');
      expect(result.size).toBe(2);
      expect(result.get('2023-12')).toBe(1);
      expect(result.get('2024-01')).toBe(2);
    });
  });

  describe('aggregation mode: sum (default)', () => {
    it('sums values within the same bucket', () => {
      const points = [point('2024-01-01', 5), point('2024-01-01', 3)];
      const result = aggregatePoints(points, 'day', 'sum');
      expect(result.get('2024-01-01')).toBe(8);
    });

    it('defaults to "sum" when mode is omitted', () => {
      const points = [point('2024-01-01', 5), point('2024-01-01', 3)];
      const result = aggregatePoints(points, 'day');
      expect(result.get('2024-01-01')).toBe(8);
    });

    it('falls back to "sum" for an unknown aggregation mode', () => {
      const points = [point('2024-01-01', 5), point('2024-01-01', 3)];
      const result = aggregatePoints(points, 'day', 'invalid' as LineChartAggregationMode);
      expect(result.get('2024-01-01')).toBe(8);
    });

    it('handles negative and decimal values', () => {
      const points = [point('2024-01-01', 2.5), point('2024-01-01', -1)];
      const result = aggregatePoints(points, 'day', 'sum');
      expect(result.get('2024-01-01')).toBe(1.5);
    });
  });

  describe('aggregation mode: max', () => {
    it('keeps the maximum value within the same bucket', () => {
      const points = [point('2024-01-01', 5), point('2024-01-01', 3), point('2024-01-01', 9)];
      const result = aggregatePoints(points, 'day', 'max');
      expect(result.get('2024-01-01')).toBe(9);
    });

    it('applies "max" across multi-day buckets too', () => {
      const points = [point('2024-01-01', 1), point('2024-01-03', 4), point('2024-01-06', 2)];
      const result = aggregatePoints(points, 'week', 'max');
      expect(result.get('2024-01-01')).toBe(4);
    });
  });

  describe('edge cases', () => {
    it.each(['day', 'week', 'biweek', 'month'] as LineChartAggregationPeriod[])(
      'returns an empty map for an empty array (period: %s)',
      (period) => {
        const result = aggregatePoints([], period, 'sum');
        expect(result.size).toBe(0);
      },
    );

    it('is independent of the input points order', () => {
      const pointsAsc = [point('2024-01-01', 1), point('2024-01-02', 2)];
      const pointsDesc = [point('2024-01-02', 2), point('2024-01-01', 1)];
      const resultAsc = aggregatePoints(pointsAsc, 'day', 'sum');
      const resultDesc = aggregatePoints(pointsDesc, 'day', 'sum');
      expect(resultAsc).toEqual(resultDesc);
    });

    it('buckets under an empty key for an unknown aggregation period', () => {
      const points = [point('2024-01-01', 5)];
      const result = aggregatePoints(points, 'invalid' as LineChartAggregationPeriod, 'sum');
      expect(result.get('')).toBe(5);
    });
  });
});
