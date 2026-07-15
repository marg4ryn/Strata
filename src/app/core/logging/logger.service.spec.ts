import { TestBed } from '@angular/core/testing';
import { MockInstance } from 'vitest';
import { environment } from '@env/environment';
import { LoggerService } from './logger.service';
import { LogLevel } from './logger.enum';

vi.mock('@env/environment', () => ({
  environment: {
    production: false,
    apiUrl: '',
    enableLogging: true,
    logLevel: LogLevel.DEBUG,
  },
}));

describe('LoggerService', () => {
  let logger: LoggerService;
  let consoleDebugSpy: MockInstance;
  let consoleInfoSpy: MockInstance;
  let consoleWarnSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({});
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
      logger = new LoggerService();
    });

    it('should log debug', () => {
      logger.debug('foo');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should log info', () => {
      logger.info('foo');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should log warn', () => {
      logger.warn('foo');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error', () => {
      logger.error('foo');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should display proper message', () => {
      const date = new Date(Date.UTC(2000, 0, 1, 1, 1, 1, 1));
      const objectOne = { foo: 'foo' };
      const objectTwo = { bar: 'bar' };
      const message = 'foo';
      vi.useFakeTimers();
      vi.setSystemTime(date);

      logger.debug(message, objectOne, objectTwo);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `[2000-01-01T01:01:01.001Z] [DEBUG]`,
        message,
        objectOne,
        objectTwo,
      );

      vi.useRealTimers();
    });

    it('should not log when log level is higher', () => {
      environment.logLevel = LogLevel.WARN;
      logger = new LoggerService();
      logger.info('foo');
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should not log when logging is disabled', () => {
      environment.enableLogging = false;
      logger = new LoggerService();
      logger.debug('foo');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should not log and not throw for invalid log level', () => {
      expect(() => (logger as any).log(999, 'foo')).not.toThrow();
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
      logger = new LoggerService();
    });

    it('should not log debug', () => {
      logger.debug('foo');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should not log info', () => {
      logger.info('foo');
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should not log warn', () => {
      logger.warn('foo');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not log error', () => {
      logger.error('foo');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
