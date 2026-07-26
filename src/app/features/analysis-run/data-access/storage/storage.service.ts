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
      this.logger.info(`Analysis Run Storage saved sessionId: ${sessionId} to sessionStorage`);
    } catch (error) {
      this.logger.error(
        `Analysis Run Storage failed to save sessionId: ${sessionId} to sessionStorage`,
        error,
      );
    }
  }

  savePendingAnalysis(pendingAnalysis: PendingAnalysis): void {
    const pendingAnalyses = this.getPendingAnalyses() ?? [];
    const updatedAnalyses = [...pendingAnalyses, pendingAnalysis];

    try {
      localStorage.setItem(this.pendingAnalysesKey, JSON.stringify(updatedAnalyses));
      this.logger.info(
        `Analysis Run Storage saved pendingAnalysis with sessionId: ${pendingAnalysis.sessionId} to localStorage`,
      );
    } catch (error) {
      this.logger.error(
        `Analysis Run Storage failed to save pendingAnalysis with sessionId: ${pendingAnalysis.sessionId} to localStorage`,
        error,
      );
    }
  }

  getSessionId(): string | null {
    try {
      const sessionId = sessionStorage.getItem(this.sessionIdKey);
      this.logger.debug(
        `Analysis Run Storage returned sessionId: ${sessionId} from sessionStorage`,
      );
      return sessionId;
    } catch (error) {
      this.logger.error('Analysis Run Storage failed to read sessionId from sessionStorage', error);
      return null;
    }
  }

  getPendingAnalyses(): PendingAnalysis[] | null {
    let raw: string | null;
    try {
      raw = localStorage.getItem(this.pendingAnalysesKey);
    } catch (error) {
      this.logger.error(
        'Analysis Run Storage failed to read pendingAnalyses from localStorage',
        error,
      );
      return null;
    }

    if (raw === null) return null;

    try {
      const pendingAnalyses = JSON.parse(raw) as PendingAnalysis[];
      this.logger.debug(
        'Analysis Run Storage returned pendingAnalyses from localStorage',
        pendingAnalyses,
      );
      return pendingAnalyses;
    } catch (error) {
      this.logger.error(
        'Analysis Run Storage failed to parse pendingAnalyses JSON, clearing corrupted data',
        error,
      );
      this.removePendingAnalysesItem();
      return null;
    }
  }

  removePendingAnalysesItem(): void {
    try {
      localStorage.removeItem(this.pendingAnalysesKey);
      this.logger.info(`Analysis Run Storage removed pendingAnalyses from localStorage`);
    } catch (error) {
      this.logger.error(
        'Analysis Run Storage failed to remove pendingAnalyses from localStorage',
        error,
      );
    }
  }

  deleteSessionId(): void {
    try {
      const sessionId = sessionStorage.getItem(this.sessionIdKey);
      sessionStorage.removeItem(this.sessionIdKey);
      this.logger.info(`Analysis Run Storage removed sessionId: ${sessionId} from sessionStorage`);
    } catch (error) {
      this.logger.error(
        'Analysis Run Storage failed to remove sessionId from sessionStorage',
        error,
      );
    }
  }

  deletePendingAnalysis(sessionId: string): void {
    const pendingAnalyses = this.getPendingAnalyses();
    if (!pendingAnalyses) return;

    const remainingAnalyses = pendingAnalyses.filter(
      (analysis) => analysis.sessionId !== sessionId,
    );

    if (remainingAnalyses.length < 1) {
      this.removePendingAnalysesItem();
    } else {
      try {
        localStorage.setItem(this.pendingAnalysesKey, JSON.stringify(remainingAnalyses));
        this.logger.info(
          `Analysis Run Storage removed pendingAnalysis with sessionId: ${sessionId} from localStorage`,
        );
      } catch (error) {
        this.logger.error(
          `Analysis Run Storage failed to remove pendingAnalysis with sessionId: ${sessionId} from localStorage`,
          error,
        );
      }
    }
  }
}
