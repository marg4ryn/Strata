import { LoggerService } from '../logger/logger.service';

export class ContextLogger {
  constructor(
    private readonly logger: LoggerService,
    private readonly context: string,
  ) {}

  debug(message: any, ...params: any[]): void {
    this.logger.debug(`[${this.context}] ${message}`, ...params);
  }
  info(message: any, ...params: any[]): void {
    this.logger.info(`[${this.context}] ${message}`, ...params);
  }
  warn(message: any, ...params: any[]): void {
    this.logger.warn(`[${this.context}] ${message}`, ...params);
  }
  error(message: any, ...params: any[]): void {
    this.logger.error(`[${this.context}] ${message}`, ...params);
  }
}
