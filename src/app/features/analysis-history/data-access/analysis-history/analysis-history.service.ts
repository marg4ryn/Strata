import { Service, inject } from '@angular/core';

import { injectLogger } from '@app/core/logging';
import { AnalysisResultsFacade } from '@app/features/analysis-results';
import { AnalysisHistoryStoreService } from '../analysis-history-store/analysis-history-store.service';
import { AnalysisHistoryStorageService } from '../analysis-history-storage/analysis-history-storage.service';
import type { AnalysisHistoryEntry } from '../../analysis-history.model';

@Service()
export class AnalysisHistoryService {
  private readonly logger = injectLogger('AnalysisHistoryService');
  private readonly store = inject(AnalysisHistoryStoreService);
  private readonly storage = inject(AnalysisHistoryStorageService);
  private readonly results = inject(AnalysisResultsFacade);

  private readonly channel = new BroadcastChannel('analysis-history-sync');

  constructor() {
    this.channel.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'add') {
        this.store.addAnalysisHistoryEntry(event.data.analysisHistoryEntry);
      } else if (event.data.type === 'remove') {
        this.store.removeAnalysisHistoryEntry(event.data.analysisId);
      }
      this.logger.debug('BroadcastChannel message received', {
        type: event.data.type,
        analysisId: event.data.analysisId,
      });
    };
  }

  loadAnalysisHistory(): void {
    const analysisHistory = this.storage.getAnalysisHistory();
    this.store.analysisHistory.set(analysisHistory);
    this.logger.debug('Analysis history loaded', {
      count: analysisHistory?.length ?? 0,
    });
  }

  loadAnalysis(analysisId: string): void {
    this.results.navigateToAnalysis(analysisId);
    this.logger.info('Analysis loaded', { analysisId });
  }

  openPanel(): void {
    this.logger.debug('Analysis history panel opened');
    this.store.showPanel.set(true);
  }

  closePanel(): void {
    this.logger.debug('Analysis history panel closed');
    this.store.showPanel.set(false);
  }

  addAnalysisHistoryEntry(analysisHistoryEntry: AnalysisHistoryEntry) {
    this.store.addAnalysisHistoryEntry(analysisHistoryEntry);
    this.storage.saveAnalysisHistoryEntry(analysisHistoryEntry);
    this.channel.postMessage({ type: 'add', analysisHistoryEntry });
  }

  removeAnalysisHistoryEntry(analysisId: string) {
    this.store.removeAnalysisHistoryEntry(analysisId);
    this.storage.removeAnalysisHistoryEntry(analysisId);
    this.channel.postMessage({ type: 'remove', analysisId });
  }
}
