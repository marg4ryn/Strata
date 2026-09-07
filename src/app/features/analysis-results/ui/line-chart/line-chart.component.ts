import { Component, input, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService, TranslocoPipe } from '@ngneat/transloco';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

import type { ISODateString } from '@app/shared/date-utils/date.utils';
import { aggregatePoints } from '../../utils/aggregation/aggregation';

export type LineChartMode = 'sum' | 'max';

export type LineChartAggregation = 'day' | 'week' | 'biweek' | 'month';

export interface LineChartDataPoint {
  date: ISODateString;
  value: number;
}

export interface LineChartSeries {
  legendLabelKey: string;
  tooltipLabelKey: string;
  color: string;
  points: LineChartDataPoint[];
}

@Component({
  selector: 'app-line-chart',
  imports: [BaseChartDirective, TranslocoPipe],
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss',
})
export class LineChartComponent {
  private readonly transloco = inject(TranslocoService);

  series = input.required<LineChartSeries[]>();
  aggregation = input.required<LineChartAggregation>();
  mode = input<LineChartMode>('sum');

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  private readonly aggregatedSeries = computed(() =>
    this.series().map((s) => ({
      ...s,
      buckets: aggregatePoints(s.points, this.aggregation(), this.mode()),
    })),
  );

  private readonly bucketKeys = computed(() => {
    const keys = new Set<string>();
    for (const s of this.aggregatedSeries()) {
      for (const key of s.buckets.keys()) keys.add(key);
    }
    return [...keys].sort();
  });

  chartWidth = computed(() => Math.max(this.bucketKeys().length * 15, 350));
  chartHeight = computed(() => 250);

  chartType: ChartConfiguration<'line'>['type'] = 'line';

  chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const keys = this.bucketKeys();
    const mode = this.aggregation();
    const lang = this.activeLang();

    return {
      labels: keys.map((k) => this.formatBucketLabel(k, mode, lang)),
      datasets: this.aggregatedSeries().map((s) => ({
        label: this.transloco.translate(s.tooltipLabelKey),
        data: keys.map((k) => s.buckets.get(k) ?? 0),
        borderColor: s.color,
        backgroundColor: s.color,
        fill: false,
        tension: 0.1,
      })),
    };
  });

  chartOptions = computed<ChartConfiguration<'line'>['options']>(() => {
    const lang = this.activeLang();

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { type: 'category' },
        y: { beginAtZero: true, ticks: { color: '#ffffff' } },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) =>
              ` ${context.dataset.label}: ${context.parsed.y?.toLocaleString(lang)}`,
          },
        },
      },
    };
  });

  formatBucketLabel(key: string, mode: LineChartAggregation, lang: string): string {
    if (mode === 'month') {
      const [year, month] = key.split('-');
      return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(lang, {
        month: 'long',
        year: 'numeric',
      });
    }

    return new Date(key + 'T00:00:00Z').toLocaleDateString(lang, {
      day: '2-digit',
      month: 'long',
    });
  }
}
