import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-analysis-error',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-error.component.html',
  styleUrl: './analysis-error.component.scss',
})
export class AnalysisErrorComponent {
  readonly error = input<Error>();
}
