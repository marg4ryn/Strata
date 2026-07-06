import { LogLevel } from '../app/core/logging/logger.types';
import { Environment } from './environment.types';

export const environment: Environment = {
  production: false,
  enableLogging: true,
  logLevel: LogLevel.DEBUG,
};
