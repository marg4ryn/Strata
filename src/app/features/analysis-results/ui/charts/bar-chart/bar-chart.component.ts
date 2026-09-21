import { ChangeDetectionStrategy, Component, input, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';

import { aggregatePoints, formatBucketLabel } from '../../../utils/aggregation/aggregation';
import type { ChartAggregationPeriod, ChartSeries } from '../../../utils/aggregation/aggregation';

@Component({
  selector: 'app-bar-chart',
  imports: [BaseChartDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './bar-chart.component.scss',
  templateUrl: './bar-chart.component.html',
})
export class BarChartComponent {
  private readonly transloco = inject(TranslocoService);

  series = input.required<ChartSeries[]>();
  period = input.required<ChartAggregationPeriod>();

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  private readonly aggregatedSeries = computed(() =>
    this.series().map((s) => ({
      ...s,
      buckets: aggregatePoints(s.points, this.period(), 'sum'),
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

  chartType: ChartConfiguration<'bar'>['type'] = 'bar';

  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const keys = this.bucketKeys();
    const period = this.period();
    const lang = this.activeLang();

    return {
      labels: keys.map((k) => formatBucketLabel(k, period, lang)),
      datasets: this.aggregatedSeries().map((s) => ({
        label: this.transloco.translate(s.tooltipLabelKey),
        data: keys.map((k) => s.buckets.get(k) ?? 0),
        borderColor: s.color,
        backgroundColor: s.color,
      })),
    };
  });

  chartOptions = computed<ChartConfiguration<'bar'>['options']>(() => {
    const lang = this.activeLang();
    const fmt = (v: number | string) => Math.abs(Number(v)).toLocaleString(lang);

    return {
      locale: lang,
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { type: 'category', stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            color: '#ffffff',
            callback: (value) => fmt(value),
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${fmt(context.parsed.y ?? 0)}`,
          },
        },
      },
    };
  });
}
