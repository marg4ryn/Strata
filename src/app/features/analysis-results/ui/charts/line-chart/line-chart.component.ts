import { ChangeDetectionStrategy, Component, input, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';

import { aggregatePoints, formatBucketLabel } from '../../../utils/aggregation/aggregation.utils';
import type {
  ChartAggregationMode,
  ChartAggregationPeriod,
  ChartSeries,
} from '../../../utils/aggregation/aggregation.utils';

@Component({
  selector: 'app-line-chart',
  imports: [BaseChartDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss',
})
export class LineChartComponent {
  private readonly transloco = inject(TranslocoService);

  series = input.required<ChartSeries[]>();
  period = input.required<ChartAggregationPeriod>();
  modes = input<ChartAggregationMode[]>(['sum']);

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  private readonly aggregatedSeries = computed(() =>
    this.series().map((s, idx) => ({
      ...s,
      buckets: aggregatePoints(s.points, this.period(), this.modes()[idx]),
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
    const period = this.period();
    const lang = this.activeLang();

    return {
      labels: keys.map((k) => formatBucketLabel(k, period, lang)),
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
      locale: lang,
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { type: 'category' },
        y: { beginAtZero: true, ticks: { color: '#ffffff', stepSize: 1 } },
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
}
