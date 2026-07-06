import { Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LogLevel } from './logger.types';

@Service()
export class LoggerService {
  private readonly isEnabled: boolean = environment.enableLogging;
  private readonly logLevel: LogLevel = environment.logLevel;

  debug(message: any, ...params: any[]): void {
    this.log(LogLevel.DEBUG, message, ...params);
  }

  info(message: any, ...params: any[]): void {
    this.log(LogLevel.INFO, message, ...params);
  }

  warn(message: any, ...params: any[]): void {
    this.log(LogLevel.WARN, message, ...params);
  }

  error(message: any, ...params: any[]): void {
    this.log(LogLevel.ERROR, message, ...params);
  }

  private log(level: LogLevel, message: any, ...params: any[]): void {
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
