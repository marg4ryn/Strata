import { inject } from '@angular/core';

import { LoggerService } from '../logger/logger.service';

export function injectLogger(context: string) {
  return inject(LoggerService).withContext(context);
}
