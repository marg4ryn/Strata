import { Service } from '@angular/core';

import { environment } from '@env/environment';
import { ContextLogger } from '../context-logger/context-logger.decorator';
import { LogLevel } from '../logger.enum';

@Service()
export class LoggerService {
  private readonly isEnabled: boolean = environment.enableLogging;
  private readonly logLevel: LogLevel = environment.logLevel;

  debug(message: unknown, ...params: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...params);
  }

  info(message: unknown, ...params: unknown[]): void {
    this.log(LogLevel.INFO, message, ...params);
  }

  warn(message: unknown, ...params: unknown[]): void {
    this.log(LogLevel.WARN, message, ...params);
  }

  error(message: unknown, ...params: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...params);
  }

  withContext(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }

  log(level: LogLevel, message: unknown, ...params: unknown[]): void {
    if (!this.isEnabled || level < this.logLevel) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${LogLevel[level]}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.log(prefix, message, ...params);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...params);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...params);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, ...params);
        break;
      default:
        level satisfies never;
    }
  }
}
