import { inject, Service } from '@angular/core';
import { environment } from '@env/environment';
import { AnalysisStatusKey } from '../analysis-run.model';
import { StoreService } from '../store/store.service';
import { LoggerService } from '@app/core/logging/logger.service';

type WsMessage =
  | { type: 'progress'; data: AnalysisStatusKey }
  | { type: 'success'; data: string }
  | { type: 'error'; data: string }
  | { type: 'aborted' };

@Service()
export class WebSocketService {
  private readonly logger = inject(LoggerService);
  private readonly store = inject(StoreService);

  private socket?: WebSocket;
  private intentionalClose: boolean = false;

  private readonly isBusy = this.store.isBusy;
  private readonly progress = this.store.progress;
  private readonly result = this.store.result;
  private readonly error = this.store.error;

  connect(params?: Record<string, string>): void {
    const url = this.constructUrl(params);
    this.logger.debug(`WebSocket Service constructed URL: ${url}`);

    this.intentionalClose = false;
    this.isBusy.set(true);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.logger.debug('WebSocket Service opened connection');
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as WsMessage;
        this.logger.info('WebSocket Service received message', message);

        switch (message.type) {
          case 'progress':
            this.progress.set(message.data);
            break;
          case 'success':
            this.result.set(message.data);
            this.disconnect();
            break;
          case 'aborted':
            this.disconnect();
            break;
          case 'error':
            this.error.set(message.data || 'Server error');
            this.disconnect();
            break;
          default:
            this.logger.warn('WebSocket Service received unknown message type');
        }
      } catch (error) {
        this.error.set('Failed to parse message');
        this.logger.error('WebSocket Service failed to parse message', error);
        this.disconnect();
      }
    };

    this.socket.onerror = () => {
      if (this.intentionalClose) {
        this.logger.debug('WebSocket Service suppressed error during intentional close');
        return;
      }
      this.error.set('Connection error');
      this.logger.error('WebSocket Service encountered connection error');
      this.disconnect();
    };

    this.socket.onclose = () => {
      this.logger.debug('WebSocket Service closed connection');
      this.isBusy.set(false);
    };
  }

  abort(): void {
    if (!this.socket) {
      return;
    }

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'abort' }));
      this.logger.info('WebSocket Service sent an abort message');
      return;
    }

    if (this.socket.readyState === WebSocket.CONNECTING) {
      this.logger.debug('WebSocket Service aborting connection before it was established');
      this.intentionalClose = true;
      this.disconnect();
      return;
    }

    this.logger.debug(
      'WebSocket Service did not send an abort message - socket already closing/closed',
    );
  }

  disconnect(): void {
    this.socket?.close();
  }

  private constructUrl(params?: Record<string, string>): string {
    let url = environment.apiUrl.replace(/^http/, 'ws') + 'analysis';

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
