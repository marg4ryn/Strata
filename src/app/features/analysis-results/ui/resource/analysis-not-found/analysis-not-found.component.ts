import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-analysis-not-found',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-not-found.component.html',
  styleUrl: './analysis-not-found.component.scss',
})
export class AnalysisNotFoundComponent {}
