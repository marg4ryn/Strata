import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'app-analysis-error',
  imports: [TranslocoPipe],
  templateUrl: './analysis-error.component.html',
  styleUrl: './analysis-error.component.scss',
})
export class AnalysisErrorComponent {
  readonly error = input<Error>();
}
