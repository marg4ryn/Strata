import { inject, Service } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { StorageService } from '@app/core/storage/storage.service';
import { PendingAnalysis } from '../../analysis-run.model';

@Service()
export class AnalysisRunStorageService {
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  private readonly sessionIdKey = 'sessionId';
  private readonly pendingAnalysesKey = 'pendingAnalyses';

  getSessionId(): string | null {
    const sessionId = this.storage.getItem<string>(sessionStorage, this.sessionIdKey);
    this.logger.debug(
      `Analysis Run Storage Service returned sessionId: ${sessionId} from sessionStorage`,
    );
    return sessionId;
  }

  saveSessionId(sessionId: string): void {
    this.storage.setItem<string>(sessionStorage, this.sessionIdKey, sessionId);
    this.logger.info(
      `Analysis Run Storage Service saved sessionId: ${sessionId} to sessionStorage`,
    );
  }

  deleteSessionId(): void {
    this.storage.removeItem(sessionStorage, this.sessionIdKey);
    this.logger.info('Analysis Run Storage removed sessionId from sessionStorage');
  }

  getPendingAnalyses(): PendingAnalysis[] | null {
    const pendingAnalyses = this.storage.getItem<PendingAnalysis[]>(
      localStorage,
      this.pendingAnalysesKey,
    );
    this.logger.debug(
      'Analysis Run Storage Service returned pendingAnalyses from localStorage',
      pendingAnalyses,
    );
    return pendingAnalyses;
  }

  savePendingAnalysis(pendingAnalysis: PendingAnalysis): void {
    const pendingAnalyses = this.getPendingAnalyses() ?? [];
    const updatedAnalyses = [...pendingAnalyses, pendingAnalysis];
    this.storage.setItem<PendingAnalysis[]>(localStorage, this.pendingAnalysesKey, updatedAnalyses);
    this.logger.info(
      `Analysis Run Storage Service saved pendingAnalysis with sessionId: ${pendingAnalysis.sessionId} to localStorage`,
    );
  }

  deletePendingAnalysis(sessionId: string): void {
    const pendingAnalyses = this.getPendingAnalyses();
    if (!pendingAnalyses) return;

    const filteredAnalyses = pendingAnalyses.filter((analysis) => analysis.sessionId !== sessionId);

    if (filteredAnalyses.length < 1) {
      this.clearPendingAnalyses();
    } else {
      this.storage.setItem(localStorage, this.pendingAnalysesKey, filteredAnalyses);
      this.logger.info(
        `Analysis Run Storage Service removed pendingAnalysis with sessionId: ${sessionId} from localStorage`,
      );
    }
  }

  clearPendingAnalyses(): void {
    this.storage.removeItem(localStorage, this.pendingAnalysesKey);
    this.logger.info('Analysis Run Storage removed pendingAnalyses from localStorage');
  }
}
