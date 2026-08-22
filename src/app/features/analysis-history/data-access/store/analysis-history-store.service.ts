import { Service, signal, inject } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger/logger.service';
import { AnalysisHistoryEntry } from '../../analysis-history.model';

@Service()
export class AnalysisHistoryStoreService {
  private readonly logger = inject(LoggerService);

  readonly analysisHistory = signal<AnalysisHistoryEntry[] | null>(null);
  readonly showPanel = signal<boolean>(false);

  addAnalysisHistoryEntry(analysisHistoryEntry: AnalysisHistoryEntry): void {
    this.analysisHistory.update((history) => [...(history ?? []), analysisHistoryEntry]);
    this.logger.info(
      'Analysis Hsitory Store Service added analysis history entry: ',
      analysisHistoryEntry,
    );
  }

  removeAnalysisHistoryEntry(analysisId: string): void {
    if (!this.analysisHistory()) return;
    const filteredHistory = this.analysisHistory()!.filter(
      (entry) => entry.analysisId !== analysisId,
    );
    this.analysisHistory.set(filteredHistory.length < 1 ? null : filteredHistory);
    this.logger.info(
      `Analysis Hsitory Store Service removed analysis history entry with analysisId: ${analysisId}`,
    );
  }
}
