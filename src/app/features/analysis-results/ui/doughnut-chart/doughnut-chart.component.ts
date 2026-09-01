import { Component, input, OnChanges, SimpleChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

export interface DoughnutChartItem {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-doughnut-chart',
  imports: [BaseChartDirective],
  templateUrl: './doughnut-chart.component.html',
  styleUrl: './doughnut-chart.component.scss',
})
export class DoughnutChartComponent implements OnChanges {
  items = input.required<DoughnutChartItem[]>();
  showLegend = input<boolean>(true);
  legendPosition = input<'top' | 'bottom' | 'left' | 'right'>('bottom');

  private readonly defaultColors = [
    '#4f46e5',
    '#22c55e',
    '#f97316',
    '#e11d48',
    '#0ea5e9',
    '#a855f7',
  ];

  chartType: ChartConfiguration<'doughnut'>['type'] = 'doughnut';
  chartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration<'doughnut'>['options'] = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || changes['showLegend'] || changes['legendPosition']) {
      this.buildChart();
    }
  }

  private buildChart(): void {
    this.chartData = {
      labels: this.items().map((i) => i.label),
      datasets: [
        {
          data: this.items().map((i) => i.value),
          backgroundColor: this.items().map(
            (i, idx) => i.color ?? this.defaultColors[idx % this.defaultColors.length],
          ),
          borderWidth: 0,
        },
      ],
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      spacing: 3,
      plugins: {
        legend: {
          display: this.showLegend(),
          position: this.legendPosition(),
        },
      },
    };
  }
}
