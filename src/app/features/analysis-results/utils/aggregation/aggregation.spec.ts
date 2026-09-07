import type {
  LineChartDataPoint,
  LineChartAggregation,
} from '../../ui/line-chart/line-chart.component';
import { aggregatePoints } from './aggregation';

function point(date: string, value: number): LineChartDataPoint {
  return { date, value };
}

describe('aggregatePoints', () => {
  describe('mode: day', () => {
    it('groups each day as a separate bucket', () => {
      const points = [point('2024-01-01', 5), point('2024-01-02', 3)];
      const result = aggregatePoints(points, 'day');
      expect(result.size).toBe(2);
      expect(result.get('2024-01-01')).toBe(5);
      expect(result.get('2024-01-02')).toBe(3);
    });

    it('sums the values for the same day', () => {
      const points = [point('2024-01-01', 5), point('2024-01-01', 3)];
      const result = aggregatePoints(points, 'day');
      expect(result.size).toBe(1);
      expect(result.get('2024-01-01')).toBe(8);
    });

    it('returns an empty Map for an empty array', () => {
      const result = aggregatePoints([], 'day');
      expect(result.size).toBe(0);
    });
  });

  describe('mode: week', () => {
    it('maps a midweek date to Monday of that week', () => {
      const points = [point('2024-01-03', 10)];
      const result = aggregatePoints(points, 'week');
      expect(result.get('2024-01-01')).toBe(10);
    });

    it('maps Sunday to Monday of the previous week', () => {
      const points = [point('2024-01-07', 7)];
      const result = aggregatePoints(points, 'week');
      expect(result.get('2024-01-01')).toBe(7);
    });

    it('maps Monday onto itself', () => {
      const points = [point('2024-01-01', 4)];
      const result = aggregatePoints(points, 'week');
      expect(result.get('2024-01-01')).toBe(4);
    });

    it('sums up points from different days of the same week', () => {
      const points = [point('2024-01-01', 1), point('2024-01-03', 2), point('2024-01-07', 3)];
      const result = aggregatePoints(points, 'week');
      expect(result.size).toBe(1);
      expect(result.get('2024-01-01')).toBe(6);
    });

    it('distributes points from adjacent weeks into separate buckets', () => {
      const points = [point('2024-01-07', 1), point('2024-01-08', 2)];
      const result = aggregatePoints(points, 'week');
      expect(result.size).toBe(2);
      expect(result.get('2024-01-01')).toBe(1);
      expect(result.get('2024-01-08')).toBe(2);
    });

    it('handles the year boundary correctly', () => {
      const points = [point('2023-12-31', 5)];
      const result = aggregatePoints(points, 'week');
      expect(result.get('2023-12-25')).toBe(5);
    });
  });

  describe('mode: biweek', () => {
    it('the first point always goes to the bucket starting on Monday of his week', () => {
      const points = [point('2024-01-03', 10)];
      const result = aggregatePoints(points, 'biweek');
      expect(result.size).toBe(1);
      expect(result.get('2024-01-01')).toBe(10);
    });

    it('groups dates within 14 days from the anchor into one bucket', () => {
      const points = [point('2024-01-01', 1), point('2024-01-05', 2), point('2024-01-14', 3)];
      const result = aggregatePoints(points, 'biweek');
      expect(result.size).toBe(1);
      expect(result.get('2024-01-01')).toBe(6);
    });

    it('splits dates after the 14-day window is exceeded into the next bucket', () => {
      const points = [point('2024-01-01', 1), point('2024-01-15', 2)];
      const result = aggregatePoints(points, 'biweek');
      expect(result.size).toBe(2);
      expect(result.get('2024-01-01')).toBe(1);
      expect(result.get('2024-01-15')).toBe(2);
    });

    it('the anchor depends on the earliest date', () => {
      const points = [point('2024-01-10', 5), point('2024-01-03', 2)];
      const result = aggregatePoints(points, 'biweek');
      expect(result.get('2024-01-01')).toBe(7);
      expect(result.size).toBe(1);
    });

    it('the anchor is determined from the Monday of the week of the earliest date', () => {
      const points = [point('2024-01-07', 3), point('2024-01-01', 4)];
      const result = aggregatePoints(points, 'biweek');
      expect(result.get('2024-01-01')).toBe(7);
      expect(result.size).toBe(1);
    });

    it('returns an empty Map for an empty array', () => {
      const result = aggregatePoints([], 'biweek');
      expect(result.size).toBe(0);
    });

    it('correctly handles multiple consecutive two-week windows', () => {
      const points = [point('2024-01-01', 1), point('2024-01-16', 2), point('2024-01-30', 3)];
      const result = aggregatePoints(points, 'biweek');
      expect(result.size).toBe(3);
      expect(result.get('2024-01-01')).toBe(1);
      expect(result.get('2024-01-15')).toBe(2);
      expect(result.get('2024-01-29')).toBe(3);
    });
  });

  describe('mode: month', () => {
    it('groups all days of the same month into one bucket', () => {
      const points = [point('2024-01-01', 1), point('2024-01-15', 2), point('2024-01-31', 3)];
      const result = aggregatePoints(points, 'month');
      expect(result.size).toBe(1);
      expect(result.get('2024-01')).toBe(6);
    });

    it('distributes points from different months', () => {
      const points = [point('2024-01-31', 1), point('2024-02-01', 2)];
      const result = aggregatePoints(points, 'month');
      expect(result.size).toBe(2);
      expect(result.get('2024-01')).toBe(1);
      expect(result.get('2024-02')).toBe(2);
    });

    it('handles the year boundary correctly', () => {
      const points = [point('2023-12-31', 1), point('2024-01-01', 2)];
      const result = aggregatePoints(points, 'month');
      expect(result.size).toBe(2);
      expect(result.get('2023-12')).toBe(1);
      expect(result.get('2024-01')).toBe(2);
    });
  });

  describe('input order', () => {
    it('the aggregation result does not depend on the order of the input points', () => {
      const pointsAsc = [point('2024-01-01', 1), point('2024-01-02', 2)];
      const pointsDesc = [point('2024-01-02', 2), point('2024-01-01', 1)];
      const resultAsc = aggregatePoints(pointsAsc, 'day');
      const resultDesc = aggregatePoints(pointsDesc, 'day');
      expect([...resultAsc.entries()]).toEqual(expect.arrayContaining([...resultDesc.entries()]));
    });
  });

  describe('type guard', () => {
    it('returns an empty key for an unknown mode', () => {
      const points = [point('2024-01-01', 5)];
      const result = aggregatePoints(points, 'invalid' as LineChartAggregation);
      expect(result.get('')).toBe(5);
    });
  });
});
