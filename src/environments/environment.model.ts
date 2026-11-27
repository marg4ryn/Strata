import type { LogLevel } from '@app/core/logger';

export interface Environment {
  production: boolean;
  apiUrl: string;
  enableLogging: boolean;
  logLevel: LogLevel;
}
