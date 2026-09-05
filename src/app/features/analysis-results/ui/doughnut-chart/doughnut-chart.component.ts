import { Component, input, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@ngneat/transloco';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

export interface DoughnutChartItem {
  legendLabelKey: string;
  tooltipLabelKey: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-doughnut-chart',
  imports: [BaseChartDirective],
  templateUrl: './doughnut-chart.component.html',
  styleUrl: './doughnut-chart.component.scss',
})
export class DoughnutChartComponent {
  private readonly transloco = inject(TranslocoService);

  items = input.required<DoughnutChartItem[]>();

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  chartType: ChartConfiguration<'doughnut'>['type'] = 'doughnut';

  chartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const items = this.items();
    this.activeLang();

    return {
      labels: items.map((i) => this.transloco.translate(i.legendLabelKey)),
      datasets: [
        {
          data: items.map((i) => i.value),
          backgroundColor: items.map((i) => i.color),
          borderWidth: 0,
        },
      ],
    };
  });

  chartOptions = computed<ChartConfiguration<'doughnut'>['options']>(() => {
    const items = this.items();
    const lang = this.activeLang();

    return {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      spacing: 3,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: '#ffffff' },
        },
        tooltip: {
          callbacks: {
            title: () => '',
            label: (context) => {
              const item = items[context.dataIndex];
              const label = this.transloco.translate(item.tooltipLabelKey);
              return ` ${label}: ${context.parsed.toLocaleString(lang)}`;
            },
          },
        },
      },
    };
  });
}
