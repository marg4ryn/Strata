import { LogLevel } from '@app/core/logger';
import type { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api',
  enableLogging: false,
  logLevel: LogLevel.ERROR,
};
