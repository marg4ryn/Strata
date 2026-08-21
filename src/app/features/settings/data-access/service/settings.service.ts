import { Service, inject } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { SettingsStoreService } from '../settings-store/settings-store.service';

@Service()
export class SettingsService {
  private readonly store = inject(SettingsStoreService);
  private readonly logger = inject(LoggerService);

  openPanel(): void {
    this.logger.debug('Settings Service opened settings panel');
    this.store.showPanel.set(true);
  }

  closePanel(): void {
    this.logger.debug('Settings Service closed settings panel');
    this.store.showPanel.set(false);
  }
}
