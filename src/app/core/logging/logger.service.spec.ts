import { TestBed } from '@angular/core/testing';
import { MockInstance } from 'vitest';

import { environment } from '@env/environment';
import { LoggerService } from './logger.service';
import { LogLevel } from './logger.enum';

vi.mock('@env/environment', () => ({
  environment: {
    production: false,
    apiUrl: 'http://localhost:8080/api/',
    enableLogging: true,
    logLevel: LogLevel.DEBUG,
  },
}));

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleDebugSpy: MockInstance;
  let consoleInfoSpy: MockInstance;
  let consoleWarnSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    service = TestBed.inject(LoggerService);

    consoleDebugSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Dev Environment', () => {
    beforeEach(() => {
      environment.production = false;
      environment.enableLogging = true;
      environment.logLevel = LogLevel.DEBUG;
      service = new LoggerService();
    });

    it('logs debug', () => {
      service.debug('foo');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('logs info', () => {
      service.info('foo');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('logs warn', () => {
      service.warn('foo');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('logs error', () => {
      service.error('foo');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('displays proper message', () => {
      const date = new Date(Date.UTC(2000, 0, 1, 1, 1, 1, 1));
      const objectOne = { foo: 'foo' };
      const objectTwo = { bar: 'bar' };
      const message = 'foo';
      vi.useFakeTimers();
      vi.setSystemTime(date);

      service.debug(message, objectOne, objectTwo);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `[2000-01-01T01:01:01.001Z] [DEBUG]`,
        message,
        objectOne,
        objectTwo,
      );

      vi.useRealTimers();
    });

    it('does not log when the log level is higher than the environment level', () => {
      environment.logLevel = LogLevel.WARN;
      service = new LoggerService();
      service.info('foo');
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('does not log when logging is disabled', () => {
      environment.enableLogging = false;
      service = new LoggerService();
      service.debug('foo');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('does not log and not throw for invalid log level', () => {
      expect(() => (service as any).log(999, 'foo')).not.toThrow();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Prod Environment', () => {
    beforeEach(() => {
      environment.production = true;
      environment.enableLogging = false;
      environment.logLevel = LogLevel.ERROR;
      service = new LoggerService();
    });

    it('does not log debug', () => {
      service.debug('foo');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('does not log info', () => {
      service.info('foo');
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('does not log warn', () => {
      service.warn('foo');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('does not log error', () => {
      service.error('foo');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
