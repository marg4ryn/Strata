import { Service, inject } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { AnalysisHistoryStoreService } from '../store/analysis-history-store.service';
import { AnalysisHistoryStorageService } from '../storage/analysis-history-storage.service';
import { AnalysisHistoryEntry } from '../../analysis-history.model';

@Service()
export class AnalysisHistoryService {
  private readonly store = inject(AnalysisHistoryStoreService);
  private readonly storage = inject(AnalysisHistoryStorageService);
  private readonly logger = inject(LoggerService);

  private readonly channel = new BroadcastChannel('analysis-history-sync');

  constructor() {
    this.channel.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'add') {
        this.logger.debug(
          `Analysis History Service received an analysis history entry via BroadcastChannel: ${event.data.analysisHistoryEntry.analysisId}`,
        );
        this.store.addAnalysisHistoryEntry(event.data.analysisHistoryEntry);
      } else if (event.data.type === 'remove') {
        this.logger.debug(
          `Analysis History Service received a removal request of analysis history entry with analysisId: ${event.data.analysisId} via BroadcastChannel: `,
        );
        this.store.removeAnalysisHistoryEntry(event.data.analysisId);
      }
    };
  }

  openPanel(): void {
    this.logger.debug('Analysis History Service opened history panel');
    this.store.showPanel.set(true);
  }

  closePanel(): void {
    this.logger.debug('Analysis History Service closed history panel');
    this.store.showPanel.set(false);
  }

  loadAnalysisHistory(): void {
    this.logger.debug('Analysis History Service is loading analysis history from storage');
    const analysisHistory = this.storage.getAnalysisHistory();
    this.store.analysisHistory.set(analysisHistory);
  }

  loadAnalysis(analysisId: string): void {
    this.logger.debug(
      `Analysis History Service received a request to load analysis with analysisId: ${analysisId}`,
    );
    // call analysis results feature
  }

  addAnalysisHistoryEntry(analysisHistoryEntry: AnalysisHistoryEntry) {
    this.logger.debug(
      'Analysis History Service received a request to add analysis history entry: ',
      analysisHistoryEntry,
    );
    this.store.addAnalysisHistoryEntry(analysisHistoryEntry);
    this.storage.saveAnalysisHistoryEntry(analysisHistoryEntry);
    this.channel.postMessage({ type: 'add', analysisHistoryEntry });
  }

  removeAnalysisHistoryEntry(analysisId: string) {
    this.logger.debug(
      `Analysis History Service received a request to remove analysis history entry with analysisId: ${analysisId}`,
    );
    this.store.removeAnalysisHistoryEntry(analysisId);
    this.storage.removeAnalysisHistoryEntry(analysisId);
    this.channel.postMessage({ type: 'remove', analysisId });
  }
}
