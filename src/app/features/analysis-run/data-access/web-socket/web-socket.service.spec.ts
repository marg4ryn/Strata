import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './web-socket.service';
import { StoreService } from '../store/store.service';
import { LoggerService } from '@app/core/logging/logger.service';
import { signal } from '@angular/core';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
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
    isBusy: ReturnType<typeof signal<boolean>>;
    progress: ReturnType<typeof signal<any>>;
    result: ReturnType<typeof signal<any>>;
    error: ReturnType<typeof signal<any>>;
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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should connect and set isBusy true', () => {
    service.connect();
    expect(store.isBusy()).toBe(true);
    expect(getSocket()).toBeTruthy();
  });

  it('should build url with query params', () => {
    service.connect({ a: '1', b: '2' });
    expect(getSocket().url).toMatch(/analysis\?a=1&b=2/);
  });

  it('should log on open', () => {
    service.connect();
    getSocket().onopen?.();
    expect(logger.debug).toHaveBeenCalledWith('WebSocket Service opened connection');
  });

  it('should handle progress message', () => {
    service.connect();
    getSocket().onmessage?.({
      data: JSON.stringify({ type: 'progress', data: 'RUNNING' }),
    } as MessageEvent);
    expect(store.progress()).toBe('RUNNING');
  });

  it('should handle success message and disconnect', () => {
    service.connect();
    const socket = getSocket();
    socket.onmessage?.({
      data: JSON.stringify({ type: 'success', data: 'ok-result' }),
    } as MessageEvent);
    expect(store.result()).toBe('ok-result');
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('should handle aborted message and disconnect', () => {
    service.connect();
    const socket = getSocket();
    socket.onmessage?.({ data: JSON.stringify({ type: 'aborted' }) } as MessageEvent);
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('should handle error message with data and disconnect', () => {
    service.connect();
    const socket = getSocket();
    socket.onmessage?.({ data: JSON.stringify({ type: 'error', data: 'boom' }) } as MessageEvent);
    expect(store.error()).toBe('boom');
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('should handle error message without data using fallback', () => {
    service.connect();
    const socket = getSocket();
    socket.onmessage?.({ data: JSON.stringify({ type: 'error', data: '' }) } as MessageEvent);
    expect(store.error()).toBe('Server error');
  });

  it('should warn on unknown message type', () => {
    service.connect();
    getSocket().onmessage?.({ data: JSON.stringify({ type: 'unknown' }) } as MessageEvent);
    expect(logger.warn).toHaveBeenCalledWith('WebSocket Service received unknown message type');
  });

  it('should handle invalid JSON message and disconnect', () => {
    service.connect();
    const socket = getSocket();
    socket.onmessage?.({ data: 'not-json' } as MessageEvent);
    expect(store.error()).toBe('Failed to parse message');
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('should handle connection error and disconnect', () => {
    service.connect();
    const socket = getSocket();
    socket.onerror?.();
    expect(store.error()).toBe('Connection error');
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('should set isBusy false on close', () => {
    service.connect();
    getSocket().onclose?.();
    expect(store.isBusy()).toBe(false);
  });

  it('should send abort message when socket is open', () => {
    service.connect();
    const socket = getSocket();
    socket.readyState = MockWebSocket.OPEN;
    service.abort();
    expect(socket.sent[0]).toBe(JSON.stringify({ type: 'abort' }));
  });

  it('should not send abort when socket is not open', () => {
    service.connect();
    const socket = getSocket();
    socket.readyState = MockWebSocket.CLOSED;
    service.abort();
    expect(socket.sent.length).toBe(0);
  });

  it('should do nothing on abort if no socket', () => {
    expect(() => service.abort()).not.toThrow();
  });

  it('should close socket on disconnect', () => {
    service.connect();
    const socket = getSocket();
    service.disconnect();
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });
});
