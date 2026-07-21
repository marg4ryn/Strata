import { Service, inject, effect } from '@angular/core';
import { LoggerService } from '@app/core/logging/logger.service';
import { StoreService } from '../store/store.service';
import { StorageService } from '../storage/storage.service';
import { WebSocketService } from '../web-socket/web-socket.service';
import { LockService } from '../lock/lock.service';
import {
  AnalysisTarget,
  AnalysisTargetFormModel,
  DateRange,
  PendingAnalysis,
} from '../../analysis-run.model';

interface AnalysisHistoryEntry {
  analysisId: string;
  startedAt: number;
  target: AnalysisTarget;
}

@Service()
export class OrchestratorService {
  private readonly store = inject(StoreService);
  private readonly storage = inject(StorageService);
  private readonly webSocket = inject(WebSocketService);
  private readonly locker = inject(LockService);
  private readonly logger = inject(LoggerService);

  constructor() {
    effect(() => {
      const result = this.store.result();
      const error = this.store.error();

      if (result !== null) {
        this.logger.info('Orchestrator handled the analysis results');
        // sendMessageSuccess()
        // call history feature
        // call analysis-results feature
        void this.clearData(); // not waiting for Promise on purpose
      }

      if (error !== null) {
        this.logger.info('Orchestrator handled an analysis error');
        // sendMessageError()
      }
    });
  }

  async tryToReconnect(): Promise<void> {
    this.logger.debug('Orchestrator is trying to reconnect to an ongoing analysis');

    if (this.store.isBusy()) {
      this.logger.debug('Orchestrator found an ongoing analysis');
      return;
    }

    this.store.resetState();
    const sessionId = this.storage.getSessionId();

    if (sessionId === null) {
      this.logger.debug('Orchestrator did not found an ongoing analysis');
      return this.tryToResumeAnalysis();
    }

    const acquired = await this.locker.lock(sessionId);

    if (!acquired) {
      this.logger.debug('Orchestrator found an ongoing analysis, but another card took over');
      this.storage.deleteSessionId();
      return await this.tryToResumeAnalysis();
    }

    const pendingAnalyses = this.storage.getPendingAnalyses();
    const filteredAnalyses = pendingAnalyses?.filter(
      (analysis) => analysis.sessionId === sessionId,
    );

    if (!filteredAnalyses || filteredAnalyses.length < 1) {
      this.logger.debug('Orchestrator found an ongoing analysis, but another card took over');
      this.storage.deleteSessionId();
      await this.locker.unlock(sessionId);
      return await this.tryToResumeAnalysis();
    }

    this.logger.info('Orchestrator reconnected to an ongoing analysis');
    this.store.pendingAnalysis.set(filteredAnalyses[0]);
    this.webSocket.connect({ sessionId: sessionId });
  }

  async tryToResumeAnalysis(): Promise<void> {
    this.logger.debug('Orchestrator is trying to resume any pending analysis');

    const initialPendingAnalyses = this.storage.getPendingAnalyses();

    if (!initialPendingAnalyses || initialPendingAnalyses.length < 1) {
      this.store.showModal.set(false);
      this.logger.debug('Orchestrator did not found any pending analysis');
      return;
    }

    for (const pendingAnalysis of initialPendingAnalyses) {
      const sessionId = pendingAnalysis.sessionId;
      this.logger.debug(
        `Orchestrator is trying to take over the analysis with sessionId: ${sessionId}`,
      );
      const acquired = await this.locker.lock(sessionId);

      if (!acquired) {
        this.logger.debug(
          `Orchestrator could not take over the analysis with sessionId: ${sessionId} - analysis belongs to another tab`,
        );
        continue;
      }

      const freshPendingAnalyses = this.storage.getPendingAnalyses();
      const freshFilteredAnalyses = freshPendingAnalyses?.filter(
        (analysis) => analysis.sessionId === sessionId,
      );

      if (!freshFilteredAnalyses || freshFilteredAnalyses.length < 1) {
        this.logger.debug(
          `Orchestrator could not take over the analysis with sessionId: ${sessionId} - analysis belongs to another tab`,
        );
        await this.locker.unlock(sessionId);
        continue;
      }

      this.logger.info(`Orchestrator found an unfinished analysis with sessionId: ${sessionId}`);
      this.store.pendingAnalysis.set(pendingAnalysis);
      this.store.showModal.set(true);
      return;
    }
  }

  async startNewAnalysis(formData: AnalysisTargetFormModel): Promise<void> {
    this.logger.info('Orchestrator received data to create a new analysis: ', formData);
    const pendingAnalysis = this.constructPendingAnalysis(formData);
    this.logger.debug('Orchestrator constructed pendingAnalysis: ', pendingAnalysis);
    const connectionParams = this.constructConnectionParams(pendingAnalysis);
    this.logger.debug('Orchestrator constructed connectionParams: ', connectionParams);
    await this.locker.lock(pendingAnalysis.sessionId);
    this.store.pendingAnalysis.set(pendingAnalysis);
    this.storage.savePendingAnalysis(pendingAnalysis);
    this.storage.saveSessionId(pendingAnalysis.sessionId);
    this.webSocket.connect(connectionParams);
  }

  resumeAnalysis(): void {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(
      `Orchestrator received a request to resume analysis with sessionId: ${sessionId}`,
    );
    this.storage.saveSessionId(sessionId);
    this.webSocket.connect({ sessionId: sessionId });
    this.store.showModal.set(false);
  }

  async abandonAnalysis(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(
      `Orchestrator received a request to abandon analysis with sessionId: ${sessionId}`,
    );
    // sendMessageCancel()
    await this.clearData();
    await this.tryToResumeAnalysis();
  }

  async abortAnalysis(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(
      `Orchestrator received a request to abort analysis with sessionId: ${sessionId}`,
    );
    this.webSocket.abort();
    // sendMessageCancel()
    await this.clearData();
  }

  retryAnalysis(): void {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(
      `Orchestrator received a request to retry analysis with sessionId: ${sessionId}`,
    );
    this.store.error.set(null);
    this.webSocket.connect({ sessionId: sessionId });
  }

  async cancelAnalysis(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(
      `Orchestrator received a request to cancel analysis with sessionId: ${sessionId}`,
    );
    this.store.error.set(null);
    // sendMessageCancel()
    await this.clearData();
  }

  private async clearData(): Promise<void> {
    const sessionId = this.store.pendingAnalysis()!.sessionId;
    this.logger.info(`Orchestrator deleted data of analysis with sessionId: ${sessionId}`);
    this.storage.deleteSessionId();
    this.storage.deletePendingAnalysis(sessionId);
    await this.locker.unlock(sessionId);
    this.store.resetAnalysisState();
  }

  private constructPendingAnalysis(formData: AnalysisTargetFormModel): PendingAnalysis {
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

  private constructConnectionParams(pendingAnalysis: PendingAnalysis): Record<string, string> {
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
}
