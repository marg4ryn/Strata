import type { Provider } from '@angular/core';
import { provideCharts } from 'ng2-charts';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

/**
 * Registers only the Chart.js parts used by the bar, line and doughnut chart components.
 * Add the matching controller, element, scale or plugin here when a new chart type or option is used.
 */
export function provideAnalysisCharts(): Provider {
  return provideCharts({
    registerables: [
      BarController,
      BarElement,
      LineController,
      LineElement,
      PointElement,
      DoughnutController,
      ArcElement,
      CategoryScale,
      LinearScale,
      Legend,
      Tooltip,
    ],
  });
}
