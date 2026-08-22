import { Service, inject } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger/logger.service';
import { StorageService } from '@app/core/storage/storage.service';
import { AnalysisHistoryEntry } from '../../analysis-history.model';

@Service()
export class AnalysisHistoryStorageService {
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  private readonly analysisHistoryKey = 'analysisHistory';

  getAnalysisHistory(): AnalysisHistoryEntry[] | null {
    const analysisHistory = this.storage.getItem<AnalysisHistoryEntry[]>(
      localStorage,
      this.analysisHistoryKey,
    );
    this.logger.debug(
      'Analysis History Storage Service returned analysisHistory from localStorage',
      analysisHistory,
    );
    return analysisHistory;
  }

  saveAnalysisHistoryEntry(analysisHistoryEntry: AnalysisHistoryEntry): void {
    const analysisHistory = this.getAnalysisHistory() ?? [];
    const updatedAnalysisHistory = [...analysisHistory, analysisHistoryEntry];
    this.storage.setItem<AnalysisHistoryEntry[]>(
      localStorage,
      this.analysisHistoryKey,
      updatedAnalysisHistory,
    );
    this.logger.info(
      `Analysis History Storage Service saved analysisHistoryEntry with analysisId: ${analysisHistoryEntry.analysisId} to localStorage`,
    );
  }

  removeAnalysisHistoryEntry(analysisId: string): void {
    const analysisHistory = this.getAnalysisHistory();
    if (!analysisHistory) return;

    const filteredHistory = analysisHistory.filter((entry) => entry.analysisId !== analysisId);

    if (filteredHistory.length < 1) {
      this.clearAnalysisHistory();
    } else {
      this.storage.setItem(localStorage, this.analysisHistoryKey, filteredHistory);
      this.logger.info(
        `Analysis History Storage Service removed analysisHistoryEntry with analysisId: ${analysisId} from localStorage`,
      );
    }
  }

  clearAnalysisHistory(): void {
    this.storage.removeItem(localStorage, this.analysisHistoryKey);
    this.logger.info('Analysis History Storage removed analysisHistory from localStorage');
  }
}
