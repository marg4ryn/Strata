import { LogLevel } from '@app/core/logging/logger.enum';
import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api/',
  enableLogging: false,
  logLevel: LogLevel.ERROR,
};
