import type { LoggerService } from '../logger/logger.service';

export class ContextLogger {
  constructor(
    private readonly logger: LoggerService,
    private readonly context: string,
  ) {}

  debug(message: unknown, ...params: unknown[]): void {
    this.logger.debug(`[${this.context}] ${message}`, ...params);
  }

  info(message: unknown, ...params: unknown[]): void {
    this.logger.info(`[${this.context}] ${message}`, ...params);
  }

  warn(message: unknown, ...params: unknown[]): void {
    this.logger.warn(`[${this.context}] ${message}`, ...params);
  }

  error(message: unknown, ...params: unknown[]): void {
    this.logger.error(`[${this.context}] ${message}`, ...params);
  }
}
