import { Service, signal } from '@angular/core';

import { injectLogger } from '@app/core/logging';
import type { AnalysisHistoryEntry } from '../../analysis-history.model';

@Service()
export class AnalysisHistoryStoreService {
  private readonly logger = injectLogger('AnalysisHistoryStoreService');

  readonly analysisHistory = signal<AnalysisHistoryEntry[] | null>(null);
  readonly showPanel = signal<boolean>(false);

  addAnalysisHistoryEntry(analysisHistoryEntry: AnalysisHistoryEntry): void {
    this.analysisHistory.update((history) => [...(history ?? []), analysisHistoryEntry]);
    this.logger.info('History entry added', { analysisId: analysisHistoryEntry.analysisId });
  }

  removeAnalysisHistoryEntry(analysisId: string): void {
    const currentEntries = this.analysisHistory();
    if (!currentEntries) return;

    const filtered = currentEntries.filter((e) => e.analysisId !== analysisId);
    this.analysisHistory.set(filtered.length < 1 ? null : filtered);
    this.logger.info('History entry removed', { analysisId });
  }
}
