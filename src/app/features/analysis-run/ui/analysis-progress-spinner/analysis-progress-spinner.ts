import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-analysis-progress-spinner',
  imports: [],
  templateUrl: './analysis-progress-spinner.html',
  styleUrl: './analysis-progress-spinner.scss',
})
export class AnalysisProgressSpinner {
  label = input<string>('');
  abort = output<void>();

  onAbort(): void {
    this.abort.emit();
  }
}
