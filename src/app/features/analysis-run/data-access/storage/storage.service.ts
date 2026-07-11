import { inject, Service } from '@angular/core';
import { PendingAnalysis } from '../analysis-run.model';
import { LoggerService } from '@app/core/logging/logger.service';

@Service()
export class StorageService {
  private readonly logger = inject(LoggerService);
  private readonly SESSION_ID_KEY = 'sessionId';
  private readonly PENDING_ANALYSES_KEY = 'pendingAnalyses';

  saveSessionId(sessionId: string): void {
    try {
      sessionStorage.setItem(this.SESSION_ID_KEY, sessionId);
      this.logger.info(`Storage Service saved sessionId to sessionStorage: ${sessionId}`);
    } catch (error) {
      this.logger.error('Failed to save sessionId to sessionStorage', error);
    }
  }

  savePendingAnalysis(pendingAnalysis: PendingAnalysis): void {
    this.saveSessionId(pendingAnalysis.sessionId);
    const pendingAnalyses = this.getPendingAnalyses() ?? [];
    const updatedAnalyses = [...pendingAnalyses, pendingAnalysis];

    try {
      localStorage.setItem(this.PENDING_ANALYSES_KEY, JSON.stringify(updatedAnalyses));
      this.logger.info(
        `Storage Service saved pendingAnalysis with sessionId: ${pendingAnalysis.sessionId} to localStorage`,
      );
    } catch (error) {
      this.logger.error('Failed to save pendingAnalysis to localStorage', error);
    }
  }

  getSessionId(): string | null {
    try {
      const sessionId = sessionStorage.getItem(this.SESSION_ID_KEY);
      this.logger.debug('Storage Service returned sessionId from sessionStorage: ', sessionId);
      return sessionId;
    } catch (error) {
      this.logger.error('Failed to read sessionId from sessionStorage', error);
      return null;
    }
  }

  getPendingAnalyses(): Array<PendingAnalysis> | null {
    let raw: string | null;
    try {
      raw = localStorage.getItem(this.PENDING_ANALYSES_KEY);
    } catch (error) {
      this.logger.error('Failed to read pendingAnalyses from localStorage', error);
      return null;
    }

    if (raw === null) {
      return null;
    }

    try {
      const pendingAnalyses = JSON.parse(raw) as Array<PendingAnalysis>;
      this.logger.debug(
        'Storage Service returned pendingAnalyses from localStorage: ',
        pendingAnalyses,
      );
      return pendingAnalyses;
    } catch (error) {
      this.logger.error('Failed to parse pendingAnalyses JSON, clearing corrupted data', error);
      localStorage.removeItem(this.PENDING_ANALYSES_KEY);
      return null;
    }
  }

  deleteSessionId(): void {
    try {
      const sessionId = sessionStorage.getItem(this.SESSION_ID_KEY);
      sessionStorage.removeItem(this.SESSION_ID_KEY);
      this.logger.info(`Storage Service removed sessionId from sessionStorage: ${sessionId}`);
    } catch (error) {
      this.logger.error('Failed to remove sessionId from sessionStorage', error);
    }
  }

  deletePendingAnalysis(sessionId: string): void {
    const pendingAnalyses = this.getPendingAnalyses() ?? [];
    const remainingAnalyses = pendingAnalyses.filter(
      (analysis) => analysis.sessionId !== sessionId,
    );

    try {
      localStorage.setItem(this.PENDING_ANALYSES_KEY, JSON.stringify(remainingAnalyses));
      this.logger.info(
        `Storage Service removed pendingAnalysis with sessionId: ${sessionId} from localStorage`,
      );
    } catch (error) {
      this.logger.error('Failed to remove pendingAnalysis from localStorage', error);
    }
  }
}
