import type { LogLevel } from '@app/core/logging';

export interface Environment {
  production: boolean;
  apiUrl: string;
  enableLogging: boolean;
  logLevel: LogLevel;
}
