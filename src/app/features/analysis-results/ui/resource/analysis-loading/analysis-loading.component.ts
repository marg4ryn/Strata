import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LoadingSpinnerComponent } from '@app/shared/components';

@Component({
  selector: 'app-analysis-loading',
  imports: [LoadingSpinnerComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-loading.component.html',
  styleUrl: './analysis-loading.component.scss',
})
export class AnalysisLoadingComponent {}
