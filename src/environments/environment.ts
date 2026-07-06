import { LogLevel } from '../app/core/logging/logger.types';
import { Environment } from './environment.types';

export const environment: Environment = {
  production: true,
  enableLogging: false,
  logLevel: LogLevel.ERROR,
};
