import { Service, inject, effect, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { injectLogger } from '@app/core/logging';
import { AnalysisResultsFacade } from '@app/features/analysis-results';
import { NotificationsFacade } from '@app/features/notifications';
import { AnalysisHistoryFacade } from '@app/features/analysis-history';
import type { AnalysisHistoryEntry } from '@app/features/analysis-history';
import { AnalysisRunStoreService } from '../analysis-run-store/analysis-run-store.service';
import { AnalysisRunStorageService } from '../analysis-run-storage/analysis-run-storage.service';
import { AnalysisRunWebSocketService } from '../analysis-run-web-socket/analysis-run-web-socket.service';
import { AnalysisRunLockService } from '../analysis-run-lock/analysis-run-lock.service';
import type {
  AnalysisTarget,
  AnalysisTargetFormModel,
  DateRange,
  PendingAnalysis,
} from '../../analysis-run.model';

@Service()
export class AnalysisRunService {
  private readonly logger = injectLogger('AnalysisRunService');
  private readonly results = inject(AnalysisResultsFacade);
  private readonly store = inject(AnalysisRunStoreService);
  private readonly storage = inject(AnalysisRunStorageService);
  private readonly webSocket = inject(AnalysisRunWebSocketService);
  private readonly locker = inject(AnalysisRunLockService);
  private readonly notifications = inject(NotificationsFacade);
  private readonly history = inject(AnalysisHistoryFacade);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      const result = this.store.result();
      const error = this.store.error();

      if (result !== null) {
        untracked(() => {
          this.logger.info('Handled analysis result', { result });
          this.notifications.sendNotificationSuccess(marker('analysisRun.notifications.success'), {
            repoName: this.getRepoName(),
          });
          const analysisHistoryEntry = this.constructAnalysisHistoryEntry(
            this.store.pendingAnalysis()!,
          );
          this.history.addAnalysisHistoryEntry(analysisHistoryEntry);
          this.results.navigateToAnalysis(result);
          void this.clearData();
        });
      }

      if (error !== null) {
        untracked(() => {
          this.logger.info('Handled analysis error', { error });
          this.notifications.sendNotificationError(marker('analysisRun.notifications.error'), {
            repoName: this.getRepoName(),
          });
        });
      }
    });
  }

  navigateToStartNewAnalysis(): void {
    this.router.navigate(['']);
  }

  async tryToReconnect(): Promise<void> {
    this.logger.debug('Reconnecting to an ongoing analysis');

    if (this.store.isBusy()) {
      this.logger.info('Reconnected to an ongoing analysis', {
        sessionId: this.store.pendingAnalysis()?.sessionId,
      });
      return;
    }

    this.store.resetState();
    const sessionId = this.storage.getSessionId();

    if (sessionId === null) {
      this.logger.debug('Did not found an ongoing analysis');
      return this.tryToResumeAnalysis();
    }

    const acquired = await this.locker.lock(sessionId);

    if (!acquired) {
      this.logger.debug('Found an ongoing analysis, but another card took over', { sessionId });
      this.storage.deleteSessionId();
      return await this.tryToResumeAnalysis();
    }

    const pendingAnalyses = this.storage.getPendingAnalyses();
    const filteredAnalyses = pendingAnalyses?.filter(
      (analysis) => analysis.sessionId === sessionId,
    );

    if (!filteredAnalyses || filteredAnalyses.length < 1) {
      this.logger.debug('Found an ongoing analysis, but another card took over', { sessionId });
      this.storage.deleteSessionId();
      await this.locker.unlock(sessionId);
      return await this.tryToResumeAnalysis();
    }

    this.logger.info('Reconnected to an ongoing analysis', { sessionId });
    this.store.pendingAnalysis.set(filteredAnalyses[0]);
    this.webSocket.connect({ sessionId: sessionId });
  }

  async tryToResumeAnalysis(): Promise<void> {
    this.logger.debug('Trying to resume any pending analysis');

    const initialPendingAnalyses = this.storage.getPendingAnalyses();

    if (!initialPendingAnalyses || initialPendingAnalyses.length < 1) {
      this.store.showModal.set(false);
      this.logger.debug('Did not found any pending analysis');
      return;
    }

    for (const pendingAnalysis of initialPendingAnalyses) {
      const sessionId = pendingAnalysis.sessionId;
      this.logger.debug('Trying to take over the analysis', { sessionId });
      const acquired = await this.locker.lock(sessionId);

      if (!acquired) {
        this.logger.debug('Could not take over the analysis – it belongs to another tab', {
          sessionId,
        });
        continue;
      }

      const freshPendingAnalyses = this.storage.getPendingAnalyses();
      const freshFilteredAnalyses = freshPendingAnalyses?.filter(
        (analysis) => analysis.sessionId === sessionId,
      );

      if (!freshFilteredAnalyses || freshFilteredAnalyses.length < 1) {
        this.logger.debug('Could not take over the analysis – it belongs to another tab', {
          sessionId,
        });
        await this.locker.unlock(sessionId);
        continue;
      }

      this.logger.info('Reconnected to the unfinished analysis', { sessionId });
      this.store.pendingAnalysis.set(pendingAnalysis);
      this.store.showModal.set(true);
      return;
    }
  }

  async startNewAnalysis(formData: AnalysisTargetFormModel): Promise<void> {
    this.logger.info('User submitted the form', { formData });
    const pendingAnalysis = this.constructPendingAnalysis(formData);
    this.logger.debug('Constructed pending analysis', { pendingAnalysis });
    const connectionParams = this.constructConnectionParams(pendingAnalysis);
    this.logger.debug('Constructed connection params', { connectionParams });

    await this.locker.lock(pendingAnalysis.sessionId);
    this.store.pendingAnalysis.set(pendingAnalysis);
    this.storage.savePendingAnalysis(pendingAnalysis);
    this.storage.saveSessionId(pendingAnalysis.sessionId);
    this.webSocket.connect(connectionParams);
  }

  resumeAnalysis(): void {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.storage.saveSessionId(sessionId);
    this.webSocket.connect({ sessionId: sessionId });
    this.store.showModal.set(false);
    this.logger.info('Analysis resumed', { sessionId });
  }

  async abandonAnalysis(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.notifications.sendNotificationInfo(marker('analysisRun.notifications.abandon'), {
      repoName: this.getRepoName(),
    });
    this.logger.info('Analysis abandoned', { sessionId });
    await this.clearData();
    await this.tryToResumeAnalysis();
  }

  async abortAnalysis(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info('Trying to abort the analysis', { sessionId });

    const confirmed = await this.webSocket.abort();

    if (confirmed) {
      this.logger.info('Analysis abort confirmed by server', { sessionId });
      this.notifications.sendNotificationInfo(marker('analysisRun.notifications.abort'), {
        repoName: this.getRepoName(),
      });
      await this.clearData();
      await this.tryToResumeAnalysis();
    } else {
      this.logger.warn('Analysis abort confirmation timed out', { sessionId });
      this.notifications.sendNotificationWarning(marker('analysisRun.notifications.abortError'), {
        repoName: this.getRepoName(),
      });
      this.storage.deleteSessionId();
      await this.locker.unlock(sessionId);
    }
  }

  retryAnalysis(): void {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info('Analysis retried', { sessionId });
    this.store.error.set(null);
    this.webSocket.connect({ sessionId: sessionId });
  }

  async cancelAnalysis(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info('Analysis cancelled', { sessionId });
    this.store.error.set(null);
    this.notifications.sendNotificationInfo(marker('analysisRun.notifications.cancel'), {
      repoName: this.getRepoName(),
    });
    await this.clearData();
    await this.tryToResumeAnalysis();
  }

  async clearData(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info('Analysis deleted', { sessionId });
    this.storage.deleteSessionId();
    this.storage.deletePendingAnalysis(sessionId);
    await this.locker.unlock(sessionId);
    this.store.resetAnalysisState();
  }

  constructPendingAnalysis(formData: AnalysisTargetFormModel): PendingAnalysis {
    const sessionId = crypto.randomUUID();
    const startedAt = Date.now();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const dateRange = !formData.limitRange
      ? null
      : ({
          startDate: formData.startDate!.toISOString().split('T')[0],
          endDate: formData.endDate!.toISOString().split('T')[0],
          timezone: timeZone,
        } as DateRange);

    const analysisTarget: AnalysisTarget = {
      targetURL: formData.targetURL,
      limitRange: formData.limitRange,
      range: dateRange,
    };

    const pendingAnalysis: PendingAnalysis = {
      sessionId: sessionId,
      startedAt: startedAt,
      target: analysisTarget,
    };

    return pendingAnalysis;
  }

  constructConnectionParams(pendingAnalysis: PendingAnalysis): Record<string, string> {
    const params: Record<string, string> = {
      sessionId: pendingAnalysis.sessionId,
      repositoryUrl: pendingAnalysis.target.targetURL,
    };

    if (pendingAnalysis.target.limitRange) {
      params['startDate'] = pendingAnalysis.target.range!.startDate;
      params['endDate'] = pendingAnalysis.target.range!.endDate;
      params['timezone'] = pendingAnalysis.target.range!.timezone;
    }

    return params;
  }

  constructAnalysisHistoryEntry(pendingAnalysis: PendingAnalysis): AnalysisHistoryEntry {
    return {
      analysisId: this.store.result()!,
      completedAt: Date.now(),
      target: pendingAnalysis.target,
    };
  }

  getRepoName(): string {
    const targetUrl = this.store.pendingAnalysis()?.target?.targetURL ?? '';
    const repoName = targetUrl.split('/').pop() || '';
    return repoName?.replace(/\.git$/, '');
  }
}
