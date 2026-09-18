import { ContextLogger } from './context-logger.decorator';
import type { LoggerService } from '../logger/logger.service';

describe('ContextLogger', () => {
  let logger: LoggerService;
  let contextLogger: ContextLogger;

  beforeEach(() => {
    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as LoggerService;

    contextLogger = new ContextLogger(logger, 'TestContext');
  });

  it('prefixes and delegates debug messages', () => {
    contextLogger.debug('message', 1, 2);
    expect(logger.debug).toHaveBeenCalledWith('[TestContext] message', 1, 2);
  });

  it('prefixes and delegates info messages', () => {
    contextLogger.info('message');
    expect(logger.info).toHaveBeenCalledWith('[TestContext] message');
  });

  it('prefixes and delegates warn messages', () => {
    contextLogger.warn('message');
    expect(logger.warn).toHaveBeenCalledWith('[TestContext] message');
  });

  it('prefixes and delegates error messages', () => {
    const error = new Error('boom');
    contextLogger.error('message', error);
    expect(logger.error).toHaveBeenCalledWith('[TestContext] message', error);
  });
});
