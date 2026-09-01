import { inject, Service } from '@angular/core';

import { environment } from '@env/environment';
import { LoggerService } from '@app/core/logging/logger.service';
import { AnalysisStatusKey } from '../../analysis-run.model';
import { AnalysisRunStoreService } from '../analysis-run-store/analysis-run-store.service';

type WsMessage =
  | { type: 'progress'; data: AnalysisStatusKey }
  | { type: 'success'; data: string }
  | { type: 'error'; data: string }
  | { type: 'aborted' };

@Service()
export class AnalysisRunWebSocketService {
  private readonly logger = inject(LoggerService);
  private readonly store = inject(AnalysisRunStoreService);

  private socket?: WebSocket;
  private abortResolver: ((confirmed: boolean) => void) | null = null;

  private readonly isAborting = this.store.isAborting;
  private readonly isBusy = this.store.isBusy;
  private readonly progress = this.store.progress;
  private readonly result = this.store.result;
  private readonly error = this.store.error;
  private readonly errorType = this.store.errorType;

  connect(params?: Record<string, string>): void {
    const url = this.constructUrl(params);
    this.logger.debug(`Analysis Run WebSocket Service constructed URL: ${url}`);

    this.isBusy.set(true);
    this.isAborting.set(false);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.logger.debug('Analysis Run WebSocket Service opened connection');
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as WsMessage;
        this.logger.info('Analysis Run WebSocket Service received message', message);

        switch (message.type) {
          case 'progress':
            this.progress.set(message.data);
            break;
          case 'aborted':
            this.resolveAbort(true);
            this.disconnect();
            break;
          case 'success':
            this.result.set(message.data);
            this.resolveAbort(false);
            this.disconnect();
            break;
          case 'error':
            this.error.set(message.data || 'Server error');
            this.errorType.set('server');
            this.resolveAbort(false);
            this.disconnect();
            break;
          default:
            this.logger.warn('Analysis Run WebSocket Service received unknown message type');
        }
      } catch (error) {
        this.error.set('Failed to parse message');
        this.errorType.set('server');
        this.disconnect();
        this.logger.error('Analysis Run WebSocket Service failed to parse message', error);
      }
    };

    this.socket.onerror = () => {
      if (this.isAborting()) {
        this.logger.debug(
          'Analysis Run WebSocket Service suppressed error during intentional close',
        );
        return;
      }
      this.error.set('Connection error');
      this.errorType.set('connection');
      this.logger.error('Analysis Run WebSocket Service encountered connection error');
      this.disconnect();
    };

    this.socket.onclose = () => {
      this.logger.debug('Analysis Run WebSocket Service closed connection');
      this.isBusy.set(false);
      this.resolveAbort(false);
    };
  }

  abort(): Promise<boolean> {
    if (!this.socket) {
      return Promise.resolve(false);
    }

    this.isAborting.set(true);

    if (this.socket.readyState === WebSocket.OPEN) {
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          this.logger.warn(
            'Analysis Run WebSocket Service timed out waiting for abort confirmation',
          );
          this.abortResolver = null;
          this.disconnect();
          resolve(false);
        }, 5000);

        this.abortResolver = (confirmed: boolean) => {
          clearTimeout(timeout);
          resolve(confirmed);
        };

        this.socket!.send(JSON.stringify({ type: 'abort' }));
        this.logger.info('Analysis Run WebSocket Service sent an abort message');
      });
    }

    if (this.socket.readyState === WebSocket.CONNECTING) {
      this.logger.debug(
        'Analysis Run WebSocket Service aborted connection before it was established',
      );
      this.disconnect();
      return Promise.resolve(true);
    }

    this.logger.debug(
      'Analysis Run WebSocket Service did not send an abort message - socket already closing/closed',
    );
    return Promise.resolve(false);
  }

  resolveAbort(confirmed: boolean): void {
    if (this.abortResolver) {
      this.abortResolver(confirmed);
      this.abortResolver = null;
    }
  }

  disconnect(): void {
    this.socket?.close();
  }

  private constructUrl(params?: Record<string, string>): string {
    let url = environment.apiUrl.replace(/^http/, 'ws') + '/analysis';

    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      url += `?${queryParams.toString()}`;
    }

    return url;
  }
}
