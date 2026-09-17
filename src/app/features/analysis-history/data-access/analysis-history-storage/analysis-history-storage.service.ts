import { Service, inject } from '@angular/core';

import { injectLogger } from '@app/core/logging/inject-logger/inject-logger';
import { StorageService } from '@app/core/storage/storage.service';
import { AnalysisHistoryEntry } from '../../analysis-history.model';

@Service()
export class AnalysisHistoryStorageService {
  private readonly logger = injectLogger('AnalysisHistoryStorageService');
  private readonly storage = inject(StorageService);

  private readonly analysisHistoryKey = 'analysisHistory';

  getAnalysisHistory(): AnalysisHistoryEntry[] | null {
    return this.storage.getItem<AnalysisHistoryEntry[]>(localStorage, this.analysisHistoryKey);
  }

  saveAnalysisHistoryEntry(analysisHistoryEntry: AnalysisHistoryEntry): void {
    const analysisHistory = this.getAnalysisHistory() ?? [];
    const updatedAnalysisHistory = [...analysisHistory, analysisHistoryEntry];
    this.storage.setItem<AnalysisHistoryEntry[]>(
      localStorage,
      this.analysisHistoryKey,
      updatedAnalysisHistory,
    );
    this.logger.debug('History entry saved', { analysisId: analysisHistoryEntry.analysisId });
  }

  removeAnalysisHistoryEntry(analysisId: string): void {
    const analysisHistory = this.getAnalysisHistory();
    if (!analysisHistory) return;

    const filteredHistory = analysisHistory.filter((entry) => entry.analysisId !== analysisId);

    if (filteredHistory.length < 1) {
      this.clearAnalysisHistory();
    } else {
      this.storage.setItem(localStorage, this.analysisHistoryKey, filteredHistory);
      this.logger.debug('History entry removed', { analysisId });
    }
  }

  clearAnalysisHistory(): void {
    this.storage.removeItem(localStorage, this.analysisHistoryKey);
    this.logger.info('All history entries cleared');
  }
}
