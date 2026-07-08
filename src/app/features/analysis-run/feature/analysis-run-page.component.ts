import { Component, inject, computed, debounced } from '@angular/core';
import { AnalysisTargetForm } from '../ui/analysis-target-form/analysis-target-form.component';
import { AnalysisProgressSpinner } from '../ui/analysis-progress-spinner/analysis-progress-spinner';
import { AnalysisStatus, AnalysisTarget } from '../data-access/analysis-run.model';
import { LoggerService } from '@app/core/logging/logger.service';
import { WebSocketService } from '../data-access/web-socket/web-socket.service';

@Component({
  selector: 'app-analysis-run-page.component',
  imports: [AnalysisTargetForm, AnalysisProgressSpinner],
  templateUrl: './analysis-run-page.component.html',
  styleUrl: './analysis-run-page.component.scss',
})
export class AnalysisRunPage {
  private readonly logger = inject(LoggerService);
  private readonly websocket = inject(WebSocketService);

  label = debounced(
    computed(() => {
      const progress = this.websocket.progress();
      return progress ? `${AnalysisStatus[progress]}...` : 'Connecting...';
    }),
    800,
  );

  isRunning = this.websocket.connected;

  runAnalysis(data: AnalysisTarget): void {
    this.logger.info(`Analysis target form accepted data: `, data);

    if (!data.limitRange) {
      this.websocket.connect({
        repositoryUrl: data.URL,
      });
    } else {
      this.websocket.connect({
        repositoryUrl: data.URL,
        startDate: data.startDate!.toISOString().split('T')[0],
        endDate: data.endDate!.toISOString().split('T')[0],
      });
    }
  }

  abortAnalysis(): void {
    this.websocket.disconnect();
  }
}
