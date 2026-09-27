import { inject } from '@angular/core';

import { LoggerService } from '../services/logger.service';

export function injectLogger(context: string) {
  return inject(LoggerService).withContext(context);
}
