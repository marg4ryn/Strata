import { Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

import { LoadingSpinnerComponent } from '@app/shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-analysis-loading',
  imports: [LoadingSpinnerComponent, TranslocoPipe],
  templateUrl: './analysis-loading.component.html',
  styleUrl: './analysis-loading.component.scss',
})
export class AnalysisLoadingComponent {}
