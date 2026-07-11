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

  isBusy = this.store.isBusy;
  progress = this.store.progress;
  result = this.store.result;
  error = this.store.error;

  connect(params?: Record<string, string>): void {
    const url = this.constructUrl(params);

    this.isBusy.set(true);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.logger.debug('WebSocket Service opened connection');
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as WsMessage;
        this.logger.info('WebSocket Service received message: ', message);

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
      } catch {
        this.error.set('Failed to parse message');
        this.logger.error('WebSocket Service failed to parse message');
        this.disconnect();
      }
    };

    this.socket.onerror = () => {
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
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: 'abort',
      }),
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
        if (value != null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }
}
