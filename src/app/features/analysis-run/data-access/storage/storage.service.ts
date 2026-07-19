import { inject, Service } from '@angular/core';
import { LoggerService } from '@app/core/logging/logger.service';
import { PendingAnalysis } from '../../analysis-run.model';

@Service()
export class StorageService {
  private readonly logger = inject(LoggerService);
  private readonly sessionIdKey = 'sessionId';
  private readonly pendingAnalysesKey = 'pendingAnalyses';

  saveSessionId(sessionId: string): void {
    try {
      sessionStorage.setItem(this.sessionIdKey, sessionId);
      this.logger.info(`Storage Service saved sessionId: ${sessionId} to sessionStorage`);
    } catch (error) {
      this.logger.error(`Failed to save sessionId: ${sessionId} to sessionStorage`, error);
    }
  }

  savePendingAnalysis(pendingAnalysis: PendingAnalysis): void {
    const pendingAnalyses = this.getPendingAnalyses() ?? [];
    const updatedAnalyses = [...pendingAnalyses, pendingAnalysis];

    try {
      localStorage.setItem(this.pendingAnalysesKey, JSON.stringify(updatedAnalyses));
      this.logger.info(
        `Storage Service saved pendingAnalysis with sessionId: ${pendingAnalysis.sessionId} to localStorage`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save pendingAnalysis with sessionId: ${pendingAnalysis.sessionId} to localStorage`,
        error,
      );
    }
  }

  getSessionId(): string | null {
    try {
      const sessionId = sessionStorage.getItem(this.sessionIdKey);
      this.logger.debug(`Storage Service returned sessionId: ${sessionId} from sessionStorage`);
      return sessionId;
    } catch (error) {
      this.logger.error('Failed to read sessionId from sessionStorage', error);
      return null;
    }
  }

  getPendingAnalyses(): Array<PendingAnalysis> | null {
    let raw: string | null;
    try {
      raw = localStorage.getItem(this.pendingAnalysesKey);
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
        'Storage Service returned pendingAnalyses from localStorage',
        pendingAnalyses,
      );
      return pendingAnalyses;
    } catch (error) {
      this.logger.error('Failed to parse pendingAnalyses JSON, clearing corrupted data', error);
      this.removePendingAnalysesItem();
      return null;
    }
  }

  removePendingAnalysesItem(): void {
    try {
      localStorage.removeItem(this.pendingAnalysesKey);
      this.logger.info(`Storage Service removed pendingAnalyses from localStorage`);
    } catch (error) {
      this.logger.error('Failed to remove pendingAnalyses from localStorage', error);
    }
  }

  deleteSessionId(): void {
    try {
      const sessionId = sessionStorage.getItem(this.sessionIdKey);
      sessionStorage.removeItem(this.sessionIdKey);
      this.logger.info(`Storage Service removed sessionId: ${sessionId} from sessionStorage`);
    } catch (error) {
      this.logger.error('Failed to remove sessionId from sessionStorage', error);
    }
  }

  deletePendingAnalysis(sessionId: string): void {
    const pendingAnalyses = this.getPendingAnalyses();
    if (pendingAnalyses === null) return;

    const remainingAnalyses = pendingAnalyses.filter(
      (analysis) => analysis.sessionId !== sessionId,
    );

    try {
      if (remainingAnalyses.length !== 0) {
        localStorage.setItem(this.pendingAnalysesKey, JSON.stringify(remainingAnalyses));
        this.logger.info(
          `Storage Service removed pendingAnalysis with sessionId: ${sessionId} from localStorage`,
        );
      } else {
        this.removePendingAnalysesItem();
      }
    } catch (error) {
      this.logger.error(
        `Failed to remove pendingAnalysis with sessionId: ${sessionId} from localStorage`,
        error,
      );
    }
  }
}
