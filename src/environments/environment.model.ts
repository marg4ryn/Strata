import { LogLevel } from '@app/core/logging/logger.enum';

export interface Environment {
  production: boolean;
  apiUrl: string;
  enableLogging: boolean;
  logLevel: LogLevel;
}
