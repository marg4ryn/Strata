import { Component, inject, signal } from '@angular/core';
import { AnalysisTargetForm } from '../ui/analysis-target-form/analysis-target-form.component';
import { AnalysisProgressSpinner } from '../ui/analysis-progress-spinner/analysis-progress-spinner';
import { AnalysisTarget } from '../data-access/analysis-run.model';
import { LoggerService } from '@app/core/logging/logger.service';

@Component({
  selector: 'app-analysis-run-page.component',
  imports: [AnalysisTargetForm, AnalysisProgressSpinner],
  templateUrl: './analysis-run-page.component.html',
  styleUrl: './analysis-run-page.component.scss',
})
export class AnalysisRunPage {
  private readonly logger = inject(LoggerService);

  label = signal<string>('Loading...');
  isRunning = signal<boolean>(false);

  runAnalysis(data: AnalysisTarget): void {
    this.logger.info(`Analysis target form accepted data: `, data);
    this.isRunning.set(true);
  }

  abortAnalysis(): void {
    this.isRunning.set(false);
  }
}
