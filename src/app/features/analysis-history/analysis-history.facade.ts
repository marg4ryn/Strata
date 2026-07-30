import { Service, inject, computed } from '@angular/core';

import { AnalysisHistoryService } from './data-access/service/analysis-history.service';
import { AnalysisHistoryStoreService } from './data-access/store/analysis-history-store.service';
import { AnalysisHistoryEntry } from './analysis-history.model';

@Service()
export class AnalysisHistoryFacade {
  private readonly store = inject(AnalysisHistoryStoreService);
  private readonly service = inject(AnalysisHistoryService);

  readonly analysisHistory = computed(() => this.store.analysisHistory());
  readonly showPanel = computed(() => this.store.showPanel());

  openPanel(): void {
    this.service.openPanel();
  }

  closePanel(): void {
    this.service.closePanel();
  }

  loadAnalysisHistory(): void {
    this.service.loadAnalysisHistory();
  }

  loadAnalysis(analysisId: string): void {
    this.service.loadAnalysis(analysisId);
  }

  addAnalysisHistoryEntry(analysisHistoryEntry: AnalysisHistoryEntry): void {
    this.service.addAnalysisHistoryEntry(analysisHistoryEntry);
  }

  removeAnalysisHistoryEntry(analysisId: string): void {
    this.service.removeAnalysisHistoryEntry(analysisId);
  }
}
