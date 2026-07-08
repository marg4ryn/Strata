import { inject, Service, signal } from '@angular/core';
import { environment } from '@env/environment';
import { AnalysisStatusKey } from '../analysis-run.model';
import { LoggerService } from '@app/core/logging/logger.service';

type WsMessage =
  | { type: 'progress'; data: AnalysisStatusKey }
  | { type: 'success'; data: string }
  | { type: 'error'; data: string };

@Service()
export class WebSocketService {
  private readonly logger = inject(LoggerService);

  private socket?: WebSocket;

  connected = signal<boolean>(false);
  progress = signal<AnalysisStatusKey | null>(null);
  result = signal<string>('');
  error = signal<string>('');

  connect(params?: Record<string, string>): void {
    const url = this.constructUrl(params);

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.connected.set(true);
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
      this.logger.debug('WebSocket Service encountered connection error');
      this.disconnect();
    };

    this.socket.onclose = () => {
      this.logger.debug('WebSocket Service closed connection');
      this.connected.set(false);
    };
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
