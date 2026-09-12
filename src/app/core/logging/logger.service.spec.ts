import type { MockInstance } from 'vitest';

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

const consoleMethodByLevel = {
  debug: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error',
} as const;

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleSpies: Record<keyof typeof consoleMethodByLevel, MockInstance>;

  beforeEach(() => {
    environment.production = false;
    environment.enableLogging = true;
    environment.logLevel = LogLevel.DEBUG;

    consoleSpies = {
      debug: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    service = new LoggerService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logging enabled', () => {
    it.each(Object.entries(consoleMethodByLevel) as [keyof typeof consoleMethodByLevel, string][])(
      'maps %s() to console.%s',
      (method) => {
        service[method]('foo');
        expect(consoleSpies[method]).toHaveBeenCalled();
      },
    );

    it('displays proper message', () => {
      const date = new Date(Date.UTC(2000, 0, 1, 1, 1, 1, 1));
      const firstObject = { foo: 'foo' };
      const secondObject = { bar: 'bar' };
      const message = 'baz';
      vi.useFakeTimers();
      vi.setSystemTime(date);

      service.debug(message, firstObject, secondObject);

      expect(consoleSpies.debug).toHaveBeenCalledWith(
        '[2000-01-01T01:01:01.001Z] [DEBUG]',
        message,
        firstObject,
        secondObject,
      );

      vi.useRealTimers();
    });

    it('does not log when the log level is higher than the environment level', () => {
      environment.logLevel = LogLevel.WARN;
      service = new LoggerService();
      service.info('foo');
      expect(consoleSpies.info).not.toHaveBeenCalled();
    });

    it('does not log and does not throw for an invalid log level', () => {
      expect(() => (service as any).log(999, 'foo')).not.toThrow();
      Object.values(consoleSpies).forEach((spy) => expect(spy).not.toHaveBeenCalled());
    });
  });

  describe('logging disabled', () => {
    beforeEach(() => {
      environment.enableLogging = false;
      service = new LoggerService();
    });

    it('does not log anything', () => {
      service.debug('foo');
      service.info('bar');
      service.warn('baz');
      service.error('foo');
      Object.values(consoleSpies).forEach((spy) => expect(spy).not.toHaveBeenCalled());
    });
  });
});
