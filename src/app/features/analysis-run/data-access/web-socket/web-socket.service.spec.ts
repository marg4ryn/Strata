import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { WebSocketService } from './web-socket.service';
import { StoreService } from '../store/store.service';
import { AnalysisStatusKey, ErrorType } from '../../analysis-run.model';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: string[] = [];
  url: string;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

describe('WebSocketService', () => {
  let service: WebSocketService;
  let store: {
    progress: ReturnType<typeof signal<AnalysisStatusKey | null>>;
    result: ReturnType<typeof signal<string | null>>;
    error: ReturnType<typeof signal<string | null>>;
    errorType: ReturnType<typeof signal<ErrorType | null>>;
    isBusy: ReturnType<typeof signal<boolean>>;
  };
  let logger: Partial<LoggerService>;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket as any);
    MockWebSocket.instances = [];

    store = {
      isBusy: signal(false),
      progress: signal(null),
      result: signal(null),
      error: signal(null),
      errorType: signal(null),
    };

    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: StoreService, useValue: store },
        { provide: LoggerService, useValue: logger },
      ],
    });

    service = TestBed.inject(WebSocketService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const getSocket = () => MockWebSocket.instances[0];

  it('connects and sets isBusy to true', () => {
    service.connect();
    expect(store.isBusy()).toBe(true);
    expect(getSocket()).toBeTruthy();
  });

  it('builds url with query params', () => {
    service.connect({ a: '1', b: '2' });
    expect(getSocket().url).toMatch(/analysis\?a=1&b=2/);
  });

  it('builds url without query params', () => {
    service.connect();
    expect(getSocket().url).toMatch(/analysis/);
  });

  it('logs on open', () => {
    service.connect();
    getSocket().onopen?.();
    expect(logger.debug).toHaveBeenCalledWith('WebSocket Service opened connection');
  });

  it('handles progress message', () => {
    service.connect();
    getSocket().onmessage?.({
      data: JSON.stringify({ type: 'progress', data: 'RUNNING' }),
    } as MessageEvent);
    expect(store.progress()).toBe('RUNNING');
  });

  it('handles success message and disconnects', () => {
    service.connect();
    const socket = getSocket();
    socket.onmessage?.({
      data: JSON.stringify({ type: 'success', data: 'analysisId' }),
    } as MessageEvent);
    expect(store.result()).toBe('analysisId');
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('handles aborted message and disconnects', () => {
    service.connect();
    const socket = getSocket();
    socket.onmessage?.({ data: JSON.stringify({ type: 'aborted' }) } as MessageEvent);
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('handles error message with data and disconnects', () => {
    service.connect();
    const socket = getSocket();
    socket.onmessage?.({ data: JSON.stringify({ type: 'error', data: 'boom' }) } as MessageEvent);
    expect(store.error()).toBe('boom');
    expect(store.errorType()).toBe('server');
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('handles error message without data using fallback', () => {
    service.connect();
    const socket = getSocket();
    socket.onmessage?.({ data: JSON.stringify({ type: 'error', data: '' }) } as MessageEvent);
    expect(store.error()).toBe('Server error');
    expect(store.errorType()).toBe('server');
  });

  it('warns on unknown message type', () => {
    service.connect();
    getSocket().onmessage?.({ data: JSON.stringify({ type: 'unknown' }) } as MessageEvent);
    expect(logger.warn).toHaveBeenCalledWith('WebSocket Service received unknown message type');
  });

  it('handles invalid JSON message and disconnects', () => {
    service.connect();
    const socket = getSocket();
    socket.onmessage?.({ data: 'invalid json' } as MessageEvent);
    expect(store.error()).toBe('Failed to parse message');
    expect(store.errorType()).toBe('server');
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('handles connection error and disconnects', () => {
    service.connect();
    const socket = getSocket();
    socket.onerror?.();
    expect(store.error()).toBe('Connection error');
    expect(store.errorType()).toBe('connection');
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('handles socket error caused by abort during connecting', () => {
    service.connect();
    const socket = getSocket();
    socket.readyState = MockWebSocket.CONNECTING;
    service.abort();
    socket.onerror?.();
    expect(store.error()).toBeNull();
    expect(store.errorType()).toBeNull();
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('sets isBusy to false on close', () => {
    service.connect();
    getSocket().onclose?.();
    expect(store.isBusy()).toBe(false);
  });

  it('sends abort message', () => {
    service.connect();
    const socket = getSocket();
    socket.readyState = MockWebSocket.OPEN;
    service.abort();
    expect(socket.sent[0]).toBe(JSON.stringify({ type: 'abort' }));
  });

  it('does not send an abort message while disconnecting', () => {
    service.connect();
    const socket = getSocket();
    socket.readyState = MockWebSocket.CLOSING;
    service.abort();
    expect(socket.sent.length).toBe(0);
    expect(logger.debug).toHaveBeenCalledWith(
      'WebSocket Service did not send an abort message - socket already closing/closed',
    );
  });

  it('does nothing on abort if no socket exists', () => {
    expect(() => service.abort()).not.toThrow();
  });

  it('closes socket on disconnect', () => {
    service.connect();
    const socket = getSocket();
    service.disconnect();
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });
});
