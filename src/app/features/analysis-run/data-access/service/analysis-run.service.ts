import { Service, inject, effect, untracked } from '@angular/core';
import { Router } from '@angular/router';

import { LoggerService } from '@app/core/logging/logger/logger.service';
import { NotificationsFacade } from '@app/features/notifications/notifications.facade';
import { AnalysisHistoryFacade } from '@app/features/analysis-history/analysis-history.facade';
import { AnalysisHistoryEntry } from '@app/features/analysis-history/analysis-history.model';
import { AnalysisRunStoreService } from '../store/analysis-run-store.service';
import { AnalysisRunStorageService } from '../storage/analysis-run-storage.service';
import { AnalysisRunWebSocketService } from '../web-socket/analysis-run-web-socket.service';
import { AnalysisRunLockService } from '../lock/analysis-run-lock.service';
import {
  AnalysisTarget,
  AnalysisTargetFormModel,
  DateRange,
  PendingAnalysis,
} from '../../analysis-run.model';

@Service()
export class AnalysisRunService {
  private readonly router = inject(Router);
  private readonly store = inject(AnalysisRunStoreService);
  private readonly storage = inject(AnalysisRunStorageService);
  private readonly webSocket = inject(AnalysisRunWebSocketService);
  private readonly locker = inject(AnalysisRunLockService);
  private readonly logger = inject(LoggerService);
  private readonly notifications = inject(NotificationsFacade);
  private readonly history = inject(AnalysisHistoryFacade);

  constructor() {
    effect(() => {
      const result = this.store.result();
      const error = this.store.error();

      if (result !== null) {
        untracked(() => {
          this.logger.info('Analysis Run Service handled the analysis results');
          this.notifications.sendNotificationSuccess(
            `${this.getRepoName()} analysis was successful`,
          );
          const analysisHistoryEntry = this.constructAnalysisHistoryEntry(
            this.store.pendingAnalysis()!,
          );
          this.history.addAnalysisHistoryEntry(analysisHistoryEntry);
          this.router.navigate(['analysis', result, 'summary']);
          void this.clearData(); // not waiting for Promise on purpose
        });
      }

      if (error !== null) {
        untracked(() => {
          this.logger.info('Analysis Run Service handled an analysis error');
          this.notifications.sendNotificationError(
            `${this.getRepoName()} analysis ended with an error`,
          );
        });
      }
    });
  }

  async tryToReconnect(): Promise<void> {
    this.logger.debug('Analysis Run Service is trying to reconnect to an ongoing analysis');

    if (this.store.isBusy()) {
      this.logger.debug('Analysis Run Service found an ongoing analysis');
      return;
    }

    this.store.resetState();
    const sessionId = this.storage.getSessionId();

    if (sessionId === null) {
      this.logger.debug('Analysis Run Service did not found an ongoing analysis');
      return this.tryToResumeAnalysis();
    }

    const acquired = await this.locker.lock(sessionId);

    if (!acquired) {
      this.logger.debug(
        'Analysis Run Service found an ongoing analysis, but another card took over',
      );
      this.storage.deleteSessionId();
      return await this.tryToResumeAnalysis();
    }

    const pendingAnalyses = this.storage.getPendingAnalyses();
    const filteredAnalyses = pendingAnalyses?.filter(
      (analysis) => analysis.sessionId === sessionId,
    );

    if (!filteredAnalyses || filteredAnalyses.length < 1) {
      this.logger.debug(
        'Analysis Run Service found an ongoing analysis, but another card took over',
      );
      this.storage.deleteSessionId();
      await this.locker.unlock(sessionId);
      return await this.tryToResumeAnalysis();
    }

    this.logger.info('Analysis Run Service reconnected to an ongoing analysis');
    this.store.pendingAnalysis.set(filteredAnalyses[0]);
    this.webSocket.connect({ sessionId: sessionId });
  }

  async tryToResumeAnalysis(): Promise<void> {
    this.logger.debug('Analysis Run Service is trying to resume any pending analysis');

    const initialPendingAnalyses = this.storage.getPendingAnalyses();

    if (!initialPendingAnalyses || initialPendingAnalyses.length < 1) {
      this.store.showModal.set(false);
      this.logger.debug('Analysis Run Service did not found any pending analysis');
      return;
    }

    for (const pendingAnalysis of initialPendingAnalyses) {
      const sessionId = pendingAnalysis.sessionId;
      this.logger.debug(
        `Analysis Run Service is trying to take over the analysis with sessionId: ${sessionId}`,
      );
      const acquired = await this.locker.lock(sessionId);

      if (!acquired) {
        this.logger.debug(
          `Analysis Run Service could not take over the analysis with sessionId: ${sessionId} - analysis belongs to another tab`,
        );
        continue;
      }

      const freshPendingAnalyses = this.storage.getPendingAnalyses();
      const freshFilteredAnalyses = freshPendingAnalyses?.filter(
        (analysis) => analysis.sessionId === sessionId,
      );

      if (!freshFilteredAnalyses || freshFilteredAnalyses.length < 1) {
        this.logger.debug(
          `Analysis Run Service could not take over the analysis with sessionId: ${sessionId} - analysis belongs to another tab`,
        );
        await this.locker.unlock(sessionId);
        continue;
      }

      this.logger.info(
        `Analysis Run Service found an unfinished analysis with sessionId: ${sessionId}`,
      );
      this.store.pendingAnalysis.set(pendingAnalysis);
      this.store.showModal.set(true);
      return;
    }
  }

  async startNewAnalysis(formData: AnalysisTargetFormModel): Promise<void> {
    this.logger.info('Analysis Run Service received data to create a new analysis: ', formData);
    const pendingAnalysis = this.constructPendingAnalysis(formData);
    this.logger.debug('Analysis Run Service constructed pendingAnalysis: ', pendingAnalysis);
    const connectionParams = this.constructConnectionParams(pendingAnalysis);
    this.logger.debug('Analysis Run Service constructed connectionParams: ', connectionParams);

    await this.locker.lock(pendingAnalysis.sessionId);
    this.store.pendingAnalysis.set(pendingAnalysis);
    this.storage.savePendingAnalysis(pendingAnalysis);
    this.storage.saveSessionId(pendingAnalysis.sessionId);
    this.webSocket.connect(connectionParams);
  }

  resumeAnalysis(): void {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(
      `Analysis Run Service received a request to resume analysis with sessionId: ${sessionId}`,
    );
    this.storage.saveSessionId(sessionId);
    this.webSocket.connect({ sessionId: sessionId });
    this.store.showModal.set(false);
  }

  async abandonAnalysis(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(
      `Analysis Run Service received a request to abandon analysis with sessionId: ${sessionId}`,
    );
    this.notifications.sendNotificationInfo(`${this.getRepoName()} analysis abandoned`);
    await this.clearData();
    await this.tryToResumeAnalysis();
  }

  async abortAnalysis(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(
      `Analysis Run Service received a request to abort analysis with sessionId: ${sessionId}`,
    );

    const confirmed = await this.webSocket.abort();

    if (confirmed) {
      this.logger.debug(`Abort for sessionId ${sessionId} confirmed by server`);
      this.notifications.sendNotificationInfo(`${this.getRepoName()} analysis aborted`);
      await this.clearData();
      await this.tryToResumeAnalysis();
    } else {
      this.logger.warn(
        `Abort for sessionId ${sessionId} not confirmed by server - analysis result already arrived or timed out`,
      );
      this.notifications.sendNotificationWarning(
        `${this.getRepoName()} analysis abort failed - server not responding`,
      );
      this.storage.deleteSessionId();
      await this.locker.unlock(sessionId);
    }
  }

  retryAnalysis(): void {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(
      `Analysis Run Service received a request to retry analysis with sessionId: ${sessionId}`,
    );
    this.store.error.set(null);
    this.webSocket.connect({ sessionId: sessionId });
  }

  async cancelAnalysis(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(
      `Analysis Run Service received a request to cancel analysis with sessionId: ${sessionId}`,
    );
    this.store.error.set(null);
    this.notifications.sendNotificationInfo(`${this.getRepoName()} analysis cancelled`);
    await this.clearData();
    await this.tryToResumeAnalysis();
  }

  async clearData(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(`Analysis Run Service deleted data of analysis with sessionId: ${sessionId}`);
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
