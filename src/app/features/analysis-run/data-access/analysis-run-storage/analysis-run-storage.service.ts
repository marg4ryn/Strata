import { Service, inject } from '@angular/core';

import { injectLogger } from '@app/core/logging';
import { StorageService } from '@app/core/storage';
import type { PendingAnalysis } from '../../analysis-run.model';

@Service()
export class AnalysisRunStorageService {
  private readonly logger = injectLogger('AnalysisRunStorageService');
  private readonly storage = inject(StorageService);

  private readonly sessionIdKey = 'sessionId';
  private readonly pendingAnalysesKey = 'pendingAnalyses';

  getSessionId(): string | null {
    return this.storage.getItem<string>(sessionStorage, this.sessionIdKey);
  }

  saveSessionId(sessionId: string): void {
    this.storage.setItem<string>(sessionStorage, this.sessionIdKey, sessionId);
    this.logger.debug('Session ID saved', { sessionId });
  }

  deleteSessionId(): void {
    const sessionId = this.getSessionId();
    this.storage.removeItem(sessionStorage, this.sessionIdKey);
    this.logger.debug('Session ID removed', { sessionId });
  }

  getPendingAnalyses(): PendingAnalysis[] | null {
    return this.storage.getItem<PendingAnalysis[]>(localStorage, this.pendingAnalysesKey);
  }

  savePendingAnalysis(pendingAnalysis: PendingAnalysis): void {
    const pendingAnalyses = this.getPendingAnalyses() ?? [];
    const updatedAnalyses = [...pendingAnalyses, pendingAnalysis];
    this.storage.setItem<PendingAnalysis[]>(localStorage, this.pendingAnalysesKey, updatedAnalyses);
    this.logger.debug('Pending analysis saved', { sessionId: pendingAnalysis.sessionId });
  }

  deletePendingAnalysis(sessionId: string): void {
    const pendingAnalyses = this.getPendingAnalyses();
    if (!pendingAnalyses) return;

    const filteredAnalyses = pendingAnalyses.filter((analysis) => analysis.sessionId !== sessionId);

    if (filteredAnalyses.length < 1) {
      this.clearPendingAnalyses();
    } else {
      this.storage.setItem(localStorage, this.pendingAnalysesKey, filteredAnalyses);
    }
    this.logger.debug('Pending analysis removed', { sessionId });
  }

  clearPendingAnalyses(): void {
    this.storage.removeItem(localStorage, this.pendingAnalysesKey);
  }
}
